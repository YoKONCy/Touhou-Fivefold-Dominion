/**
 * 回合节奏规划（智能 WAIT / 安全后排走位 / 射手拉扯高台 / 突击切后排与卡位 DEFEND）子模块
 */

import {
  checkSpellLineOfSight,
  getUnitMinDistance,
  getUnitOccupiedHexes,
  isEngagedInMelee,
  type CombatContentCatalog,
} from '@core/combatEngine';
import { getFootprintHexes, hexKey, minHexSetDistance, type HexCoord } from '@core/hex';
import type { BattleState, BattleUnit, CombatCommand } from '@core/types';
import type { BattlefieldIntel } from './threatMap';
import type { ScoredAiCommand } from './types';

/**
 * 评估本回合是否应该主动发动 HoMM4 核心节奏技「WAIT（等待）」：
 * 1. 等待己方尚未行动的英雄/大法师先拍出群体增益，再由我方核心主力出手吃满 Buff；
 * 2. 敌军仍在远处且尚未行动时，避免近战/飞行主力单骑冲进敌方 1 回合围殴圈白给，改由回合末反手切入；
 * 3. 我方远程当前仅有严重折损视线/距离的糟糕射击，等敌军前压后再全伤齐射。
 */
export function evaluateTacticalWait(
  state: BattleState,
  unit: BattleUnit,
  intel: BattlefieldIntel,
  bestSpell: ScoredAiCommand | null,
  bestAttack: ScoredAiCommand | null,
  bestSpellCard: ScoredAiCommand | null,
): ScoredAiCommand | null {
  const { profile, activeProfile } = intel;
  if (!profile.enableTacticalWait || unit.hasWaitedThisRound) return null;
  if (!intel.anyEnemyPendingThisRound && !intel.allyPendingMajorBuff) return null;

  const bestOffensiveScore = Math.max(
    bestSpellCard?.score ?? -Infinity,
    bestSpell?.score ?? -Infinity,
    bestAttack?.score ?? -Infinity,
  );
  // 若手上已经握有超高收益大招、强控或确定斩杀，直接果断出手绝不拖泥带水
  if (bestOffensiveScore >= 210) return null;

  const engaged = isEngagedInMelee(state, unit);
  const dangerHere = intel.getFootprintDanger(unit.pos, unit.footprint);

  // 场景 A：核心输出兵等待己方英雄先手拍群体 Buff（仅限未贴身且当前没有必杀好球）
  if (
    intel.allyPendingMajorBuff &&
    !engaged &&
    dangerHere < 50 &&
    !activeProfile.isSpellcaster &&
    activeProfile.expectedDps >= 36 &&
    bestOffensiveScore < 160
  ) {
    return {
      command: { type: 'WAIT', unitId: unit.id },
      score: Math.max(125, bestOffensiveScore + 18),
      tag: 'wait:ally_buff',
    };
  }

  // 场景 B：开局前两回合，近战 / 飞行突击手摸不到敌方、原地安全且敌军仍在远处未动 → 暂缓 WAIT 诱敌先动！
  const nearestEnemyDist = Math.min(
    ...intel.enemies.map((e) => getUnitMinDistance(unit, e)),
  );
  if (
    state.round <= 2 &&
    !activeProfile.isActiveRanged &&
    !(unit.kind === 'hero' && !activeProfile.isFrontlineHero) &&
    !engaged &&
    intel.anyEnemyPendingThisRound &&
    bestOffensiveScore < 68 &&
    dangerHere < 25 &&
    nearestEnemyDist > activeProfile.stats.speed + 1
  ) {
    return {
      command: { type: 'WAIT', unitId: unit.id },
      score: 88,
      tag: 'wait:bait_advance',
    };
  }

  // 场景 C：远程单位尚未被贴脸、当前所在安全，但目前只能打出极低分折损射击，等敌军靠近再开火
  if (
    activeProfile.isUnpinnedRanged &&
    intel.anyEnemyPendingThisRound &&
    dangerHere < 30 &&
    bestOffensiveScore < 48 &&
    (!bestSpell || bestSpell.score < 55)
  ) {
    return {
      command: { type: 'WAIT', unitId: unit.id },
      score: 62,
      tag: 'wait:ranged_window',
    };
  }

  return null;
}

/** 选出单位在移动阶段应优先朝向或拉扯的敌方核心锚定目标 */
function selectNavigationTarget(unit: BattleUnit, intel: BattlefieldIntel): BattleUnit {
  const { enemies, profile, activeProfile } = intel;
  // 寻常档退化为按总血量选主目标（体现阉割差异）
  if (profile.rolePriorityWeight <= 0) {
    return [...enemies].sort(
      (a, b) => (intel.getProfile(b.id)?.totalHp ?? 0) - (intel.getProfile(a.id)?.totalHp ?? 0),
    )[0];
  }

  const isBackline =
    (unit.kind === 'hero' && !activeProfile.isFrontlineHero) || activeProfile.isActiveRanged;

  return [...enemies].sort((a, b) => {
    const pa = intel.getProfile(a.id);
    const pb = intel.getProfile(b.id);
    if (!pa || !pb) return 0;
    const da = getUnitMinDistance(unit, a);
    const db = getUnitMinDistance(unit, b);
    if (isBackline) {
      // 后排看最近的近战威胁优先防备，兼顾高威胁目标
      const threatA = pa.threatScore / (da + 2.5);
      const threatB = pb.threatScore / (db + 2.5);
      return threatB - threatA;
    }
    // 突击/飞行兵强烈倾向奔赴敌方自由射手、辅助法师与法系英雄
    const hunterBonusA = pa.isUnpinnedRanged ? 1.45 : pa.role === 'caster_support' || pa.role === 'hero_caster' ? 1.32 : 1.0;
    const hunterBonusB = pb.isUnpinnedRanged ? 1.45 : pb.role === 'caster_support' || pb.role === 'hero_caster' ? 1.32 : 1.0;
    const scoreA = (pa.threatScore * hunterBonusA) / (da + 3.5);
    const scoreB = (pb.threatScore * hunterBonusB) / (db + 3.5);
    return scoreB - scoreA;
  })[0];
}

/** 计算无法直接施法/攻击时的最优战术走位、卡位防御或等待指令 */
export function evaluateBestMoveOrDefend(
  state: BattleState,
  unit: BattleUnit,
  intel: BattlefieldIntel,
  _catalog: CombatContentCatalog,
): CombatCommand {
  const { profile, personality, activeProfile, allies, enemies } = intel;
  const reachable = intel.getActiveReachable();
  const navTarget = selectNavigationTarget(unit, intel);
  const navTargetHexes = intel.occupiedHexesByUnitId.get(navTarget.id) ?? getUnitOccupiedHexes(navTarget);
  const quicksandSet = new Set(state.battleSpellFlags?.quicksandHexKeys ?? []);
  const avoidsQuicksand =
    !unit.abilities.flying &&
    !unit.abilities.teleport &&
    !unit.abilities.globalTeleport &&
    !unit.statusEffects?.terrainWalk;

  // 若仅剩孤军英雄且无蓝无箭，解除纯后排保命约束主动接战，避免双方残局无限对峙
  const loneExhaustedHero =
    unit.kind === 'hero' &&
    allies.length === 1 &&
    !activeProfile.isSpellcaster &&
    !activeProfile.isActiveRanged;
  const isBacklineHero = unit.kind === 'hero' && !activeProfile.isFrontlineHero && !loneExhaustedHero;
  const isRangedRole = activeProfile.isActiveRanged;
  const isSupportRole = !isBacklineHero && !isRangedRole && activeProfile.isSupportCaster;
  const isTankRole = activeProfile.role === 'tank_frontline';

  // 己方需要被保护的后排核心（英雄或自由射手），用于肉盾护阵走位
  const fragileAllies = allies.filter((a) => {
    if (a.id === unit.id) return false;
    const ap = intel.getProfile(a.id);
    return Boolean(ap && ((a.kind === 'hero' && !ap.isFrontlineHero) || ap.isUnpinnedRanged));
  });

  const scoreTile = (tile: HexCoord): number => {
    const foot = getFootprintHexes(tile, unit.footprint);
    const maxElev = Math.max(...foot.map((h) => state.tiles[hexKey(h)]?.elevation ?? 1));
    const danger = intel.getFootprintDanger(tile, unit.footprint);
    const distToNav = minHexSetDistance(foot, navTargetHexes);
    const nearestEnemyDist = Math.min(
      ...enemies.map((e) => minHexSetDistance(foot, getUnitOccupiedHexes(e))),
    );
    const stepOnQuicksand = avoidsQuicksand && foot.some((h) => quicksandSet.has(hexKey(h)));
    const quicksandPenalty = stepOnQuicksand ? 65 : 0;

    // 1. 法系/远程后排英雄（严禁前顶：安全第一、抢高台扩射程、超距时主动前压至射界内避免双方僵持）
    if (isBacklineHero) {
      const effectiveRangeCap = isRangedRole
        ? Math.max(5, Math.min(9, activeProfile.stats.range - 1))
        : 9;
      const outOfActionRangePenalty = Math.max(0, distToNav - effectiveRangeCap) * 16;
      const distScore = -Math.abs(nearestEnemyDist - Math.min(8, effectiveRangeCap)) * 10 - outOfActionRangePenalty;
      const tooClosePenalty = nearestEnemyDist <= 2 ? 120 : nearestEnemyDist <= 4 ? 42 : 0;
      const safetyPenalty = Math.min(140, danger * 1.15) * profile.threatAvoidanceWeight * personality.caution;
      const highGroundBonus = maxElev >= 2 ? 32 : 0;
      // 尽量留在能支援友军的中后排，不要一个人躲去地图角落失联
      const allyCohesion =
        allies.length > 1
          ? -Math.max(0, Math.min(...allies.filter((a) => a.id !== unit.id).map((a) => minHexSetDistance(foot, getUnitOccupiedHexes(a)))) - 5) * 6
          : 0;
      return highGroundBonus + distScore + allyCohesion - safetyPenalty - tooClosePenalty - quicksandPenalty;
    }

    // 2. 常规远程射手（拉扯安全距离、抢高台、避开贴脸与高威胁冲锋区；超出射程则主动推进）
    if (isRangedRole) {
      const idealDist = Math.max(5, Math.min(8, activeProfile.stats.range - 1));
      const outOfRangePenalty = Math.max(0, distToNav - activeProfile.stats.range) * 18;
      const distScore = -Math.abs(distToNav - idealDist) * 10 - outOfRangePenalty;
      const tooClosePenalty = nearestEnemyDist <= 2 ? 95 : 0;
      const safetyPenalty = Math.min(110, danger * 0.85) * profile.threatAvoidanceWeight * personality.caution;
      const highGroundBonus = maxElev >= 2 ? 28 : 0;
      return highGroundBonus + distScore - safetyPenalty - tooClosePenalty - quicksandPenalty;
    }

    // 3. 辅助施法兵种（跟在主力后面 2~5 格内安全支援）
    if (isSupportRole) {
      const safetyPenalty = Math.min(85, danger * 0.7) * profile.threatAvoidanceWeight * personality.caution;
      const highGroundBonus = maxElev >= 2 ? 24 : 0;
      const idealDist = -Math.abs(nearestEnemyDist - 6) * 8;
      return highGroundBonus + idealDist - safetyPenalty - quicksandPenalty;
    }

    // 4. 近战 / 飞行突击手 / 格斗前顶英雄（必须持续压迫推进，避险惩罚封顶绝不缩在出生点干瞪眼！）
    let score = -distToNav * 20 * personality.aggression + (maxElev >= 2 ? 12 : 0) - quicksandPenalty;

    // 顺路贴死敌方自由射手的高额奖励！
    if (profile.rangedPinWeight > 0) {
      for (const e of enemies) {
        const ep = intel.getProfile(e.id);
        if (ep?.isUnpinnedRanged && minHexSetDistance(foot, getUnitOccupiedHexes(e)) === 1) {
          score += (55 + ep.expectedDps * 0.72) * profile.rangedPinWeight;
        }
      }
    }

    // 宗师/精锐模式：前两回合推进时略微倾向挑风险更低的侧翼格，但惩罚上限封顶，绝不压过推进意愿
    if (state.round <= 2 && intel.anyEnemyPendingThisRound && nearestEnemyDist > 1 && profile.enableThreatMap) {
      score -= Math.min(32, danger * 0.14) * profile.threatAvoidanceWeight * personality.caution;
    }

    // 重装前排肉盾在靠近己方脆弱后排的护阵走廊时获得轻微加分
    if (isTankRole && fragileAllies.length > 0 && profile.enableThreatMap) {
      const distToCarry = Math.min(
        ...fragileAllies.map((fa) => minHexSetDistance(foot, getUnitOccupiedHexes(fa))),
      );
      if (distToCarry >= 1 && distToCarry <= 3 && distToNav <= 6) {
        score += 18 * personality.caution;
      }
    }

    return score;
  };

  // 先评估留在原地（DEFEND）的基准分，再对比所有可达移动格（已贴身交战的近战单位不施加负分，防止绕敌来回踱步死循环）
  const engagedNow = isEngagedInMelee(state, unit);
  const stayScore = scoreTile(unit.pos) + (isBacklineHero || isRangedRole ? 10 : engagedNow ? 0 : -40);

  // 对远程/法系英雄在选出前 4 个候选格后附加清晰的视线检查加分（低开销高收益）
  const rawCandidates: Array<{ pos: HexCoord; score: number }> = [];
  for (const key of reachable.costs.keys()) {
    const tile = state.tiles[key];
    if (!tile) continue;
    if (tile.q === unit.pos.q && tile.r === unit.pos.r) continue;
    rawCandidates.push({ pos: { q: tile.q, r: tile.r }, score: scoreTile(tile) });
  }

  rawCandidates.sort((a, b) => b.score - a.score);

  let bestMove = rawCandidates[0];
  if ((isBacklineHero || isRangedRole) && profile.enableThreatMap && rawCandidates.length > 0) {
    const topSlice = rawCandidates.slice(0, 5);
    for (const cand of topSlice) {
      const virtualUnit: BattleUnit = { ...unit, pos: cand.pos };
      if (checkSpellLineOfSight(state, virtualUnit, navTargetHexes, navTarget).canCast) {
        cand.score += 14;
      }
    }
    topSlice.sort((a, b) => b.score - a.score);
    bestMove = topSlice[0];
  }
  // 若原地已经比任何移动都更安全/更有优势（如后排英雄已稳坐安全高台），则直接 WAIT 或 DEFEND 绝不乱跑！
  if (!bestMove || stayScore >= bestMove.score + (isBacklineHero || isRangedRole ? 4 : 18)) {
    if (!unit.hasWaitedThisRound && intel.anyEnemyPendingThisRound) {
      return { type: 'WAIT', unitId: unit.id };
    }
    return { type: 'DEFEND', unitId: unit.id };
  }

  return { type: 'MOVE', unitId: unit.id, to: bestMove.pos };
}

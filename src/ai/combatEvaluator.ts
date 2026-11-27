/**
 * 战斗攻防评估与多格站位微操子模块
 *
 * 核心能力：
 * 1. 按射手/法师/辅助/英雄/前排肉盾的角色威胁价值给攻击打分，告别“只啃大肉盾”
 * 2. 贴脸锁死敌方自由远程（逼其近战 -60% 衰减或断射）给予高额战术加分
 * 3. 宗师档枚举合法近战落脚锚点，自动优化周身全扫、三翼裂袭、贯穿吐息与长武器免反击站位
 * 4. 严格遵循「仅战斗树总加点 > 五系魔法总加点且无远程手段的英雄才尝试前顶」原则
 * 5. 严防误打醒被致盲 / 镇魂神乐控制的敌方核心主力
 */

import {
  AREA_RANGED_RADIUS,
  computeLightningStrikeDamage,
  computeStoneGazeCreatureKills,
  computeStoneGazeHeroDamage,
  computeStoneGazeThreshold,
  findUnitAtHex,
  getUnitOccupiedHexes,
  hasDoubleStrikeForMode,
  isEngagedInMelee,
  previewAreaRangedAttack,
  previewAttack,
  STONE_GAZE_TRIGGER_CHANCE,
  type CombatContentCatalog,
} from '@core/combatEngine';
import { isImmuneToLivingEffects, isImmuneToLivingHeal, isUndeadUnit } from '@core/creatureTypes';
import {
  getFootprintHexes,
  getHexRange,
  hexDistance,
  hexKey,
  hexRay,
  minHexSetDistance,
  type HexCoord,
} from '@core/hex';
import type { AttackPreview, BattleState, BattleUnit } from '@core/types';
import type { BattlefieldIntel, UnitThreatProfile } from './threatMap';
import { deterministicScoreJitter, type ScoredAiCommand } from './types';

/** 估算某近战落脚点触发周身全扫 / 三翼裂袭 / 贯穿吐息带来的额外副目标战术得分 */
function evaluateAreaMeleeBonus(
  state: BattleState,
  unit: BattleUnit,
  primaryTarget: BattleUnit,
  landingAnchor: HexCoord,
  primaryAvgDeal: number,
  intel: BattlefieldIntel,
): number {
  const atkHexes = getFootprintHexes(landingAnchor, unit.footprint);
  const tgtHexes = getUnitOccupiedHexes(primaryTarget);
  let bonus = 0;

  const scoreSecondaryHit = (victim: BattleUnit, dmgMult: number) => {
    const vp = intel.getProfile(victim.id);
    if (!vp) return;
    const estDmg = Math.round(primaryAvgDeal * dmgMult);
    const effective = Math.min(estDmg, vp.totalHp);
    bonus += effective * vp.valuePerHp;
    if (estDmg >= vp.totalHp) {
      bonus += victim.kind === 'hero' ? 190 : 72 * vp.priorityMultiplier;
    }
    if (vp.isWakeOnDamageCC && estDmg < vp.totalHp && !intel.allEnemiesWakeCCed) {
      bonus -= (130 + vp.threatScore * 0.4) * intel.profile.ccWakePenaltyWeight;
    }
    if (victim.abilities.fireShield && !unit.abilities.fireResistant && !unit.abilities.magicImmune) {
      const fireScale = unit.abilities.fireResist25 ? 0.75 : 1;
      bonus -= estDmg * 0.22 * fireScale * intel.profile.retaliationRiskWeight;
    }
  };

  if (unit.abilities.multipleAttack) {
    for (const other of intel.enemies) {
      if (other.id === primaryTarget.id) continue;
      if (minHexSetDistance(atkHexes, getUnitOccupiedHexes(other)) <= 1) {
        scoreSecondaryHit(other, 0.85);
      }
    }
  } else if (unit.abilities.threeHeadedAttack) {
    for (const other of intel.enemies) {
      if (other.id === primaryTarget.id) continue;
      const otherHexes = getUnitOccupiedHexes(other);
      if (minHexSetDistance(atkHexes, otherHexes) <= 1 && minHexSetDistance(tgtHexes, otherHexes) <= 1) {
        scoreSecondaryHit(other, 0.85);
      }
    }
  }

  if (unit.abilities.breathAttack) {
    const atkKeySet = new Set(atkHexes.map(hexKey));
    const tgtKeySet = new Set(tgtHexes.map(hexKey));
    let bestA = landingAnchor;
    let bestT = primaryTarget.pos;
    let bestD = Infinity;
    for (const ah of atkHexes) {
      for (const th of tgtHexes) {
        const d = hexDistance(ah, th);
        if (d < bestD) {
          bestD = d;
          bestA = ah;
          bestT = th;
        }
      }
    }
    const ray = hexRay(bestA, bestT, 4, (c) => Boolean(state.tiles[hexKey(c)]));
    for (const step of ray) {
      const k = hexKey(step);
      if (atkKeySet.has(k) || tgtKeySet.has(k)) continue;
      if (minHexSetDistance([step], tgtHexes) !== 1) continue;
      const behind = findUnitAtHex(state, step, false);
      if (behind && behind.id !== primaryTarget.id && behind.side !== unit.side) {
        scoreSecondaryHit(behind, behind.abilities.fireResistant ? 0.5 : behind.abilities.fireResist25 ? 0.75 : 1.0);
      }
      break;
    }
  }

  return bonus;
}

/** 评估单次攻击（给定目标与预览）的统一战术得分 */
function scoreAttackPreview(
  state: BattleState,
  unit: BattleUnit,
  enemy: BattleUnit,
  ep: UnitThreatProfile,
  preview: AttackPreview,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): number {
  const { profile, personality, activeProfile } = intel;
  const landingAnchor = preview.isRanged ? unit.pos : (preview.moveTo ?? unit.pos);
  const landingFoot = getFootprintHexes(landingAnchor, unit.footprint);

  const hasDouble = hasDoubleStrikeForMode(unit, preview.isRanged);
  const singleAvgDeal = (preview.expectedMinDamage + preview.expectedMaxDamage) / 2;
  // 双重连击单位若第一下未能全灭目标，计入第二段连击预期收益
  const doubleFactor =
    hasDouble && preview.expectedMinKills < enemy.count ? 1.65 : 1.0;
  const avgDeal = singleAvgDeal * doubleFactor;

  const effectiveDeal = Math.min(avgDeal, ep.totalHp);
  const killsAll =
    preview.expectedMinKills >= enemy.count ||
    (hasDouble && avgDeal >= ep.totalHp * 1.08);
  const estKills = killsAll
    ? enemy.count
    : Math.min(enemy.count, Math.max(preview.expectedMaxKills, Math.floor(avgDeal / Math.max(1, ep.stats.maxHp))));

  let score = effectiveDeal * ep.valuePerHp * (0.95 + 0.1 * personality.aggression);

  // 1. 击杀与斩杀奖励（含敌方符卡收取高额悬赏）
  if (killsAll) {
    score += enemy.kind === 'hero' ? 255 : 102 * ep.priorityMultiplier;
    if (
      enemy.kind === 'hero' &&
      state.activeFieldAura &&
      state.activeFieldAura.casterUnitId === enemy.id &&
      !state.activeFieldAura.captured
    ) {
      score += 140;
    }
  } else if (estKills > 0) {
    score += estKills * 15 * ep.priorityMultiplier;
  }

  // 2. 命中附带强力特技收益（剧毒/赤雷天罚/冰冻/定身/震慑/衰老/石化）
  if (!killsAll) {
    if (unit.abilities.poisonAttack && !isImmuneToLivingEffects(enemy) && !enemy.abilities.magicImmune) {
      score += Math.min(75, unit.count * 13 * 1.45) * ep.priorityMultiplier;
    }
    if (!preview.isRanged && unit.abilities.lightningStrike && !enemy.abilities.magicImmune) {
      const estLight = computeLightningStrikeDamage(unit, enemy, state, catalog);
      score += estLight * ep.valuePerHp * 1.05;
    }
    if (unit.abilities.stoneGaze && !isImmuneToLivingEffects(enemy) && !enemy.abilities.magicImmune) {
      const sgThreshold = computeStoneGazeThreshold(unit.count);
      if (enemy.kind === 'creature') {
        const estKills = computeStoneGazeCreatureKills(enemy.currentHp, ep.stats.maxHp, enemy.count, sgThreshold);
        if (estKills > 0) {
          score += estKills * ep.stats.maxHp * ep.valuePerHp * STONE_GAZE_TRIGGER_CHANCE * 0.95;
        }
      } else {
        const estHeroDmg = computeStoneGazeHeroDamage(sgThreshold, ep.stats.magicResistance);
        score += estHeroDmg * ep.valuePerHp * STONE_GAZE_TRIGGER_CHANCE * 0.95;
      }
    }
    if ((unit.abilities.freezingAttack || unit.abilities.terrorOnHit || unit.abilities.stunOnHit) && !ep.isHardCCed) {
      score += ep.threatScore * 0.22;
    }
    if (unit.abilities.agingOnHit && !(enemy.statusEffects?.agedRounds && enemy.statusEffects.agedRounds > 0)) {
      score += ep.threatScore * 0.18;
    }
  }

  // 3. 吸血收益
  if (
    !preview.isRanged &&
    (unit.abilities.lifeDraining || unit.statusEffects?.vampiricTouch) &&
    (!isImmuneToLivingHeal(unit) || isUndeadUnit(unit)) &&
    !isImmuneToLivingEffects(enemy)
  ) {
    const missingSelf = Math.max(0, unit.maxCount * activeProfile.stats.maxHp - activeProfile.totalHp);
    if (missingSelf > 0) {
      score += Math.min(missingSelf, avgDeal * 0.5) * activeProfile.valuePerHp * 0.72;
    }
  }

  // 4. 多目标近战特技收益（周身全扫 / 三翼裂袭 / 贯穿吐息）
  if (!preview.isRanged && (unit.abilities.multipleAttack || unit.abilities.threeHeadedAttack || unit.abilities.breathAttack)) {
    score += evaluateAreaMeleeBonus(state, unit, enemy, landingAnchor, singleAvgDeal, intel);
  }

  // 5. 贴脸锁死敌方自由远程战术奖励（不仅限于主目标，顺路贴住旁侧射手同样计功！）
  if (!preview.isRanged && profile.rangedPinWeight > 0) {
    for (const other of intel.enemies) {
      const op = intel.getProfile(other.id);
      if (!op || !op.isUnpinnedRanged) continue;
      if (other.id === enemy.id && killsAll) continue; // 都打死了就不重复算贴脸
      if (minHexSetDistance(landingFoot, getUnitOccupiedHexes(other)) === 1) {
        score += (35 + op.expectedDps * 0.68) * profile.rangedPinWeight;
      }
    }
  }

  // 6. 反击、烈焰护盾、反伤与落点后续威胁风险
  const avgTaken = preview.willRetaliate
    ? (preview.retaliationMinDamage + preview.retaliationMaxDamage) / 2
    : 0;
  const fireShieldTaken =
    !preview.isRanged && enemy.abilities.fireShield && !unit.abilities.fireResistant && !unit.abilities.magicImmune
      ? avgDeal * 0.22 * (unit.abilities.fireResist25 ? 0.75 : 1)
      : 0;
  const mirrorTaken =
    enemy.statusEffects?.painMirror
      ? avgDeal * 0.5
      : !preview.isRanged && enemy.statusEffects?.retribution
        ? avgDeal * 0.35
        : 0;
  const totalSelfDmg = avgTaken + fireShieldTaken + mirrorTaken;

  const retVictim =
    preview.retaliationTargetId && preview.retaliationTargetId !== unit.id
      ? state.units[preview.retaliationTargetId] ?? unit
      : unit;
  const retVictimProfile = intel.getProfile(retVictim.id) ?? activeProfile;

  let selfRiskPenalty =
    totalSelfDmg * retVictimProfile.valuePerHp * 0.85 * profile.retaliationRiskWeight * personality.caution;
  if (retVictim.kind === 'hero' && totalSelfDmg >= retVictim.currentHp * 0.55) {
    selfRiskPenalty += 210 * profile.retaliationRiskWeight;
  } else if (totalSelfDmg >= retVictimProfile.totalHp * 0.85) {
    selfRiskPenalty += 75 * profile.retaliationRiskWeight;
  }

  // 落点下回合被敌军集火的风险（巡回突袭折返原格，按原位估算危险！）
  const finalStopAnchor = !preview.isRanged && unit.abilities.strikeAndReturn && preview.moveTo ? unit.pos : landingAnchor;
  const landingDanger = intel.getFootprintDanger(finalStopAnchor, unit.footprint);
  const dangerScale =
    unit.kind === 'hero' && !activeProfile.isFrontlineHero
      ? 0.65
      : activeProfile.isActiveRanged || activeProfile.role === 'caster_support'
        ? 0.48
        : activeProfile.role === 'tank_frontline'
          ? 0.08
          : 0.16;
  const landingPenalty =
    preview.isRanged
      ? 0
      : landingDanger * dangerScale * profile.threatAvoidanceWeight * personality.caution;

  // 严格落实主人的英雄前顶规则：非纯近战战斗树英雄（含全部具备远程手段的英雄）严禁无脑冲前肉搏！
  // 例外：残局仅剩本英雄孤军且已无蓝无箭时允许贴身决胜，避免双方干瞪眼死锁
  let nonFrontlineHeroPenalty = 0;
  if (unit.kind === 'hero' && !activeProfile.isFrontlineHero && !preview.isRanged) {
    const alreadyEngaged = isEngagedInMelee(state, unit);
    const loneExhaustedHero =
      intel.allies.length === 1 && !activeProfile.isSpellcaster && !activeProfile.isActiveRanged;
    const safeFinish = killsAll && landingDanger < 45;
    if (!alreadyEngaged && !safeFinish && !loneExhaustedHero) {
      nonFrontlineHeroPenalty = 195 + landingDanger * 1.15;
    }
  }

  // 7. 无反击安全压制 & 高台站位微加分
  const safeStrikeBonus =
    (preview.isRanged || preview.isLongWeaponPoke || unit.abilities.noRetaliation) &&
    (!preview.willRetaliate || Boolean(preview.retaliationTargetId && preview.retaliationTargetId !== unit.id))
      ? unit.abilities.strikeAndReturn && !preview.isRanged && preview.moveTo
        ? 44
        : 26
      : 0;
  const highGroundBonus =
    !preview.isRanged && Math.max(...landingFoot.map((h) => state.tiles[hexKey(h)]?.elevation ?? 1)) >= 2
      ? 10
      : 0;

  // 8. 严禁随便打醒正处于致盲/镇魂神乐的高威胁敌军（除非本发必杀或敌方全员都在睡）
  const wakePenalty =
    ep.isWakeOnDamageCC && !killsAll && !intel.allEnemiesWakeCCed
      ? (155 + ep.threatScore * 0.52) * profile.ccWakePenaltyWeight
      : 0;

  // 若单位本为远程但被迫近战且吃 -60% 惩罚，附加额外心理抵触
  const forcedMeleePenalty =
    !preview.isRanged && activeProfile.isActiveRanged && !unit.abilities.noMeleePenalty && unit.kind === 'creature'
      ? 18
      : 0;

  return (
    score +
    safeStrikeBonus +
    highGroundBonus -
    selfRiskPenalty -
    landingPenalty -
    nonFrontlineHeroPenalty -
    wakePenalty -
    forcedMeleePenalty
  );
}

/** 评估当前活跃单位全部直接攻击候选（含宗师档多格落脚锚点寻优） */
export function evaluateBestAttackAction(
  state: BattleState,
  unit: BattleUnit,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): ScoredAiCommand | null {
  const { profile, enemies } = intel;
  const seedSalt = state.round * 733 + state.commandSeq * 53 + unit.pos.q * 19 + unit.pos.r * 11;

  let best: ScoredAiCommand | null = null;
  const consider = (enemyId: string, preview: AttackPreview, rawScore: number) => {
    const moveTag = preview.moveTo ? `${preview.moveTo.q},${preview.moveTo.r}` : 'stay';
    const tag = `atk:${enemyId}:${preview.isRanged ? 'r' : moveTag}`;
    const score = rawScore * deterministicScoreJitter(seedSalt, tag, profile.noiseRatio);
    if (!best || score > best.score) {
      best = {
        command: {
          type: 'ATTACK',
          unitId: unit.id,
          targetId: enemyId,
          moveTo: preview.isRanged ? undefined : preview.moveTo,
        },
        score,
        tag,
      };
    }
  };

  const considerAreaHex = (targetHex: HexCoord, rawScore: number) => {
    const tag = `atk_hex:${targetHex.q},${targetHex.r}`;
    const score = rawScore * deterministicScoreJitter(seedSalt, tag, profile.noiseRatio);
    if (!best || score > best.score) {
      best = {
        command: {
          type: 'ATTACK_HEX',
          unitId: unit.id,
          targetHex,
        },
        score,
        tag,
      };
    }
  };

  // 0. 掷山大力鬼「飞石轰击」2 环完全 AOE 智能瞄点（支持超射程瞄准敌人附近空地以避开友军或一石多鸟！）
  if (unit.abilities.areaRanged && intel.activeProfile.isActiveRanged) {
    const candInfo = new Map<string, { hex: HexCoord; enemyNear: number; allyNear: number }>();
    const touchCand = (hex: HexCoord, isEnemy: boolean) => {
      const k = hexKey(hex);
      if (!state.tiles[k]) return;
      const existing = candInfo.get(k);
      if (existing) {
        if (isEnemy) existing.enemyNear += 1;
        else existing.allyNear += 1;
      } else {
        candInfo.set(k, { hex, enemyNear: isEnemy ? 1 : 0, allyNear: isEnemy ? 0 : 1 });
      }
    };
    for (const e of enemies) {
      if (e.statusEffects?.sanctuary) continue;
      const seenForEnemy = new Set<string>();
      for (const eh of getUnitOccupiedHexes(e)) {
        for (const nb of getHexRange(eh, AREA_RANGED_RADIUS)) {
          const nk = hexKey(nb);
          if (seenForEnemy.has(nk)) continue;
          seenForEnemy.add(nk);
          touchCand(nb, true);
        }
      }
    }
    for (const ally of intel.allies) {
      if (ally.id === unit.id) continue;
      const seenForAlly = new Set<string>();
      for (const ah of getUnitOccupiedHexes(ally)) {
        for (const nb of getHexRange(ah, AREA_RANGED_RADIUS)) {
          const nk = hexKey(nb);
          if (seenForAlly.has(nk) || !candInfo.has(nk)) continue;
          seenForAlly.add(nk);
          touchCand(nb, false);
        }
      }
    }
    // 优先评估多敌军重叠且远离友军的高价值瞄点，兼顾精准与亚毫秒性能
    const candidates = Array.from(candInfo.values())
      .sort((a, b) => (b.enemyNear * 3 - b.allyNear * 4) - (a.enemyNear * 3 - a.allyNear * 4))
      .slice(0, 32);

    for (const { hex: candHex } of candidates) {
      const areaPrev = previewAreaRangedAttack(state, unit.id, candHex, catalog);
      if (!areaPrev.valid || areaPrev.targets.length === 0) continue;
      let areaScore = 0;
      let hitEnemyCount = 0;
      let hitFriendlyCount = 0;
      for (const t of areaPrev.targets) {
        const avgDmg = (t.minDamage + t.maxDamage) / 2;
        const tp = intel.getProfile(t.unitId);
        if (!tp) continue;
        const effective = Math.min(avgDmg, tp.totalHp);
        const killsAll = avgDmg >= tp.totalHp || t.minKills >= tp.unit.count;
        const estKills = killsAll
          ? tp.unit.count
          : Math.min(tp.unit.count, Math.max(t.maxKills, Math.floor(avgDmg / Math.max(1, tp.stats.maxHp))));
        if (t.isFriendly) {
          hitFriendlyCount += 1;
          // 敌我不分：误伤友军施以高额惩罚，促使 AI 优先瞄准敌人身后空地精准避友！
          let ffPenalty = effective * tp.valuePerHp * 1.48;
          if (killsAll) {
            ffPenalty += tp.unit.kind === 'hero' ? 320 : 120 * tp.priorityMultiplier;
          } else if (estKills > 0) {
            ffPenalty += estKills * 18 * tp.priorityMultiplier;
          }
          areaScore -= ffPenalty;
        } else {
          hitEnemyCount += 1;
          areaScore += effective * tp.valuePerHp * (0.95 + 0.1 * intel.personality.aggression);
          if (killsAll) {
            areaScore += tp.unit.kind === 'hero' ? 255 : 102 * tp.priorityMultiplier;
            if (
              tp.unit.kind === 'hero' &&
              state.activeFieldAura &&
              state.activeFieldAura.casterUnitId === tp.unit.id &&
              !state.activeFieldAura.captured
            ) {
              areaScore += 140;
            }
          } else if (estKills > 0) {
            areaScore += estKills * 15 * tp.priorityMultiplier;
          }
          if (tp.isWakeOnDamageCC && !killsAll && !intel.allEnemiesWakeCCed) {
            areaScore -= (155 + tp.threatScore * 0.52) * profile.ccWakePenaltyWeight;
          }
        }
      }
      if (hitEnemyCount > 0) {
        if (hitEnemyCount >= 2) areaScore += hitEnemyCount * 36;
        if (hitFriendlyCount === 0) areaScore += 16; // 精准空地避友红利
        areaScore += 26; // 无反击远程区域轰炸安全红利（与 safeStrikeBonus 同量纲）
        considerAreaHex(candHex, areaScore);
      }
    }
  }

  const maxMeleeReach = unit.abilities.longWeapon ? 2 : 1;
  const hasAreaOrPosSpecial = Boolean(
    unit.abilities.multipleAttack ||
      unit.abilities.threeHeadedAttack ||
      unit.abilities.breathAttack ||
      unit.abilities.longWeapon,
  );
  const attackerSpeedBound =
    unit.abilities.globalTeleport
      ? 99
      : intel.activeProfile.stats.speed + maxMeleeReach + (unit.footprint === '1x1' ? 0 : 1);
  const attackerHexes = intel.occupiedHexesByUnitId.get(unit.id) ?? getUnitOccupiedHexes(unit);

  for (const enemy of enemies) {
    const ep = intel.getProfile(enemy.id);
    if (!ep || enemy.statusEffects?.sanctuary) continue;

    // 1. 远程攻击优先检查（区域飞石轰击已由上方 ATTACK_HEX 完整寻优覆盖）
    if (intel.activeProfile.isActiveRanged && !unit.abilities.areaRanged) {
      const rangedPreview = previewAttack(state, unit.id, enemy.id, catalog);
      if (rangedPreview.valid && rangedPreview.isRanged) {
        const sc = scoreAttackPreview(state, unit, enemy, ep, rangedPreview, intel, catalog);
        consider(enemy.id, rangedPreview, sc);
        continue;
      }
    }

    if (unit.abilities.noMelee) continue;

    const defHexes = intel.occupiedHexesByUnitId.get(enemy.id) ?? getUnitOccupiedHexes(enemy);
    // 粗距快速剪枝：物理距离超过最大移速+攻击半径的敌军直接跳过，避免无意义寻路
    if (minHexSetDistance(attackerHexes, defHexes) > attackerSpeedBound) continue;

    // 2. 仅围绕敌军周边小环面在 O(1) 可达表内筛选合法近战落脚点，绝不遍历全图 250 格！
    const reachableCosts = intel.getActiveReachable().costs;
    const ringRadius = maxMeleeReach + (unit.footprint === '1x1' ? 0 : 1);
    const checkedKeys = new Set<string>();
    const validMelee: Array<{ anchor: HexCoord; foot: HexCoord[] }> = [];

    for (const dh of defHexes) {
      for (const cand of getHexRange(dh, ringRadius)) {
        const ck = hexKey(cand);
        if (checkedKeys.has(ck) || !reachableCosts.has(ck)) continue;
        checkedKeys.add(ck);
        const foot = getFootprintHexes(cand, unit.footprint);
        const d = minHexSetDistance(foot, defHexes);
        if (d >= 1 && d <= maxMeleeReach) {
          validMelee.push({ anchor: cand, foot });
        }
      }
    }
    if (validMelee.length === 0) continue;

    // 轻量启发式挑出前 1~2 个最有价值的近战落脚点（兼顾全扫/吐息/贴射手/长武器免反击与亚毫秒耗时）
    const ranked = validMelee
      .map((ra) => {
        const elev = Math.max(...ra.foot.map((h) => state.tiles[hexKey(h)]?.elevation ?? 1));
        const danger = intel.getFootprintDanger(ra.anchor, unit.footprint);
        let hScore = elev * 10 - danger * 0.22;
        const dToDef = minHexSetDistance(ra.foot, defHexes);
        if (unit.abilities.longWeapon && !enemy.abilities.longWeapon && dToDef === 2) {
          hScore += 95;
        }
        if (profile.enableAreaMeleeOptimization) {
          if (unit.abilities.multipleAttack || unit.abilities.threeHeadedAttack) {
            for (const other of enemies) {
              if (other.id === enemy.id) continue;
              const oHexes = intel.occupiedHexesByUnitId.get(other.id) ?? getUnitOccupiedHexes(other);
              if (minHexSetDistance(ra.foot, oHexes) <= 1) {
                if (unit.abilities.multipleAttack || minHexSetDistance(defHexes, oHexes) <= 1) {
                  hScore += 55;
                }
              }
            }
          }
          if (unit.abilities.breathAttack) {
            hScore += evaluateAreaMeleeBonus(state, unit, enemy, ra.anchor, ep.expectedDps * 0.4, intel) * 0.6;
          }
          if (profile.rangedPinWeight > 0) {
            for (const other of enemies) {
              if (intel.getProfile(other.id)?.isUnpinnedRanged) {
                const oHexes = intel.occupiedHexesByUnitId.get(other.id) ?? getUnitOccupiedHexes(other);
                if (minHexSetDistance(ra.foot, oHexes) === 1) {
                  hScore += 48;
                }
              }
            }
          }
        }
        return { anchor: ra.anchor, hScore };
      })
      .sort((a, b) => b.hScore - a.hScore);

    const inspectLimit = profile.enableAreaMeleeOptimization && hasAreaOrPosSpecial ? 2 : 1;
    for (const { anchor } of ranked.slice(0, inspectLimit)) {
      const prev = previewAttack(state, unit.id, enemy.id, catalog, anchor);
      if (prev.valid && !prev.isRanged) {
        const sc = scoreAttackPreview(state, unit, enemy, ep, prev, intel, catalog);
        consider(enemy.id, prev, sc);
      }
    }
  }

  return best;
}

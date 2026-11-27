/**
 * 战场态势感知、单位角色威胁估值、英雄前顶判据与 1 回合危险热力图子模块
 */

import type { Alignment } from '@core/alignment';
import {
  getEffectiveSpellManaCost,
  getUnitOccupiedHexes,
  getUnitReachableMap,
  isEngagedInMelee,
  type CombatContentCatalog,
} from '@core/combatEngine';
import { MAGIC_PRIMARY_SKILL_IDS, SKILL_TREE_META } from '@core/h4Skills';
import {
  getFootprintHexes,
  hexKey,
  minHexSetDistance,
  type FootprintSize,
  type HexCoord,
} from '@core/hex';
import { computeUnitStats } from '@core/modifiers';
import type { BattleState, BattleUnit, ComputedUnitStats, SideId } from '@core/types';
import {
  blendPersonalityFactor,
  FACTION_PERSONALITIES,
  type AiDifficultyProfile,
  type FactionPersonality,
} from './types';

/** 单位战术定位分类 */
export type UnitTacticalRole =
  | 'hero_caster'
  | 'hero_bruiser'
  | 'ranged_dps'
  | 'caster_support'
  | 'flier_striker'
  | 'melee_bruiser'
  | 'tank_frontline';

/** 单支存活单位的完整威胁画像（每步决策预计算一次，供攻防/法术/走位复用） */
export interface UnitThreatProfile {
  unit: BattleUnit;
  stats: ComputedUnitStats;
  totalHp: number;
  /** 期望单轮普攻输出（已计入连击与士气） */
  expectedDps: number;
  /** 是否具备当前可发射的有效远程射击手段 */
  isActiveRanged: boolean;
  /** 是否为当前未被贴身压制的自由远程火力点 */
  isUnpinnedRanged: boolean;
  /** 是否拥有可立即施放的战斗法术 */
  isSpellcaster: boolean;
  /** 是否具备治疗/复活/控场/召唤等高价值辅助法术 */
  isSupportCaster: boolean;
  /** 是否处于致盲/镇魂/冰冻/定身/震慑/迷乱等硬控状态 */
  isHardCCed: boolean;
  /** 是否处于“一打就醒”型软硬控（宵暗蔽目 / 镇魂神乐） */
  isWakeOnDamageCC: boolean;
  /** 英雄是否允许尝试前顶肉搏（战斗树总加点 > 五系魔法总加点 且无远程手段） */
  isFrontlineHero: boolean;
  role: UnitTacticalRole;
  /** 受难度缩放后的目标优先击杀倍率（射手/法师/英雄显著更高） */
  priorityMultiplier: number;
  /** 综合战场威胁值 */
  threatScore: number;
  /** 每造成 1 点伤害等价的战术收益权重（脆皮高威胁单位极高，纯肉盾较低） */
  valuePerHp: number;
  /** 单位当前挂在身上的有益法术/状态总价值（用于剥法/窃法/驱散） */
  positiveBuffScore: number;
  /** 单位当前挂在身上的负面异常总严重度（用于御币清祓/大祓净世） */
  negativeDebuffScore: number;
  /** 本回合后续是否仍有行动权 */
  canActLaterThisRound: boolean;
  /** 单位所处等阶（英雄按 4 阶权重计） */
  tierWeight: number;
}

/** 当前回合的全局战场情报汇总 */
export interface BattlefieldIntel {
  profile: AiDifficultyProfile;
  personality: FactionPersonality;
  activeUnit: BattleUnit;
  activeProfile: UnitThreatProfile;
  /** 惰性获取当前行动单位可达图（纯施法或原地射击回合零寻路开销，且全流程最多计算一次） */
  getActiveReachable: () => ReturnType<typeof getUnitReachableMap>;
  /** 全部存活单位已缓存的占据六边形表 */
  occupiedHexesByUnitId: Map<string, HexCoord[]>;
  /** 全部存活单位已占用的六边形键集合（用于亚毫秒级空位预筛） */
  occupiedHexKeys: Set<string>;
  allies: BattleUnit[];
  enemies: BattleUnit[];
  unitProfiles: Map<string, UnitThreatProfile>;
  /** 是否有尚未行动的己方英雄/施法者手握高价值群体增益（用于触发己方主力 WAIT 吃 Buff） */
  allyPendingMajorBuff: boolean;
  /** 本回合是否仍有未行动且未受控的敌军（决定 WAIT 是否能诱敌进圈） */
  anyEnemyPendingThisRound: boolean;
  /** 场上所有存活敌军是否都处于“一打就醒”控场下（若全睡则允许挑最残的一只收割） */
  allEnemiesWakeCCed: boolean;
  /** 评估目标多格落点所承受的敌方 1 回合近战危险总值（O(敌军数) 亚毫秒查询） */
  getFootprintDanger: (anchor: HexCoord, footprint: FootprintSize) => number;
  /** 快捷读取单位威胁画像 */
  getProfile: (unitId: string) => UnitThreatProfile | undefined;
}

/** 判定单位当前是否具备有效远程攻击手段（有远程特技、未被遗忘封禁、且仍有弹药或无限弹药） */
export function isUnitActiveRanged(unit: BattleUnit): boolean {
  return (
    Boolean(unit.abilities.ranged) &&
    !unit.abilities.noRanged &&
    (Boolean(unit.abilities.unlimitedShots) || unit.ammo > 0)
  );
}

/**
 * 精确英雄前顶判据（严格遵循既定规则）：
 * 仅当「战斗（格斗）树总加点 > 五系魔法树总加点」且「没有远程攻击手段」时，才允许英雄尝试前顶近战。
 */
export function isFrontlineCombatHero(unit: BattleUnit): boolean {
  if (unit.kind !== 'hero') return false;
  if (isUnitActiveRanged(unit)) return false;

  const sub = unit.subSkills ?? {};
  const combatTreePoints =
    (unit.skills.combat ?? 0) +
    (sub.melee ?? 0) +
    (sub.archery ?? 0) +
    (sub.magic_resistance ?? 0);

  let magicTreePoints = 0;
  for (const magicId of MAGIC_PRIMARY_SKILL_IDS) {
    magicTreePoints += unit.skills[magicId] ?? 0;
    const meta = SKILL_TREE_META[magicId];
    for (const subId of meta.subSkills) {
      magicTreePoints += sub[subId] ?? 0;
    }
  }

  return combatTreePoints > magicTreePoints;
}

/** 判断单位当前是否处于硬控无法正常出手的状态 */
export function isUnitHardCCed(unit: BattleUnit): boolean {
  const se = unit.statusEffects;
  return Boolean(
    (se.blindRounds && se.blindRounds > 0) ||
      (se.songOfPeaceRounds && se.songOfPeaceRounds > 0) ||
      (se.frozenRounds && se.frozenRounds > 0) ||
      (se.stunnedRounds && se.stunnedRounds > 0) ||
      (se.terrifiedRounds && se.terrifiedRounds > 0) ||
      (se.confusionRounds && se.confusionRounds > 0),
  );
}

/** 判断单位当前是否处于“受伤即惊醒破控”状态（宵暗蔽目 / 镇魂神乐） */
export function isUnitWakeOnDamageCC(unit: BattleUnit): boolean {
  const se = unit.statusEffects;
  return Boolean(
    (se.blindRounds && se.blindRounds > 0) ||
      (se.songOfPeaceRounds && se.songOfPeaceRounds > 0),
  );
}

/** 评估单位身上有益增益状态与修饰器的总战术价值（供剥法/窃法/驱散决策） */
export function evaluatePositiveBuffScore(unit: BattleUnit): number {
  const se = unit.statusEffects;
  let score = 0;
  for (const m of unit.modifiers) {
    if (m.spellPolarity === 'positive') {
      score += Math.abs(m.value) >= 0.4 ? 38 : 24;
    }
  }
  if (se.bless) score += 34;
  if (se.blur) score += 26;
  if (se.precisionRounds && se.precisionRounds > 0) score += 34;
  if (se.bloodlustRounds && se.bloodlustRounds > 0) score += 32;
  if (se.vampiricTouch) score += 52;
  if (se.auraOfFear) score += 36;
  if (se.fireAura) score += 28;
  if (se.retribution) score += 28;
  if (se.painMirror) score += 45;
  if (se.magicMirror) score += 32;
  if (se.guardianAngelLives && se.guardianAngelLives > 0) score += 60;
  if (se.regenPerRound && se.regenPerRound > 0) score += 26;
  if (se.tempShieldHp && se.tempShieldHp > 0) score += Math.min(50, se.tempShieldHp * 0.45);
  if (se.slayer) score += 22;
  if (se.defenderBonus) score += 16;
  if (se.grantedAbilities?.includes('doubleStrike')) score += 58;
  if (se.grantedAbilities?.includes('firstStrike')) score += 30;
  if (se.grantedAbilities?.includes('flying')) score += 20;
  if (se.schoolWards) {
    score += Object.values(se.schoolWards).filter(Boolean).length * 24;
  }
  return score;
}

/** 评估单位身上负面异常状态的总严重度（供御币清祓 / 大祓净世 / 驱散决策） */
export function evaluateNegativeDebuffScore(unit: BattleUnit): number {
  const se = unit.statusEffects;
  let score = 0;
  for (const m of unit.modifiers) {
    if (m.spellPolarity === 'negative') {
      score += Math.abs(m.value) >= 0.35 ? 34 : 22;
    }
  }
  if (se.blindRounds && se.blindRounds > 0) score += 88;
  if (se.songOfPeaceRounds && se.songOfPeaceRounds > 0) score += 82;
  if (se.berserkRounds && se.berserkRounds > 0) score += 95;
  if (se.hypnotizedRounds && se.hypnotizedRounds > 0) score += 110;
  if (se.frozenRounds && se.frozenRounds > 0) score += 75;
  if (se.stunnedRounds && se.stunnedRounds > 0) score += 60;
  if (se.terrifiedRounds && se.terrifiedRounds > 0) score += 60;
  if (se.confusionRounds && se.confusionRounds > 0) score += 52;
  if (se.cowardiceRounds && se.cowardiceRounds > 0) score += 42;
  if (se.curse) score += 34;
  if (se.poisonPower && se.poisonPower > 0) score += 30 + Math.min(40, se.poisonPower * 0.7);
  if (se.plaguePower && se.plaguePower > 0) score += 35 + Math.min(45, se.plaguePower * 0.8);
  if (se.agedRounds && se.agedRounds > 0) score += 55;
  if (se.powerDrain) score += 32;
  if (se.spellShacklePower && se.spellShacklePower > 0) score += 32;
  if (se.grantedAbilities?.includes('noRanged') && unit.baseAbilities?.ranged) score += 58;
  return score;
}

const MAJOR_ARMY_BUFF_EFFECTS = new Set([
  'prayer',
  'mass_bless',
  'mass_bloodlust',
  'mass_first_strike',
  'mass_blur',
  'mass_precision',
  'cat_reflexes',
  'dragon_strength',
  'vampiric_touch',
]);

/** 解析某一方的主导阵营风格（优先取存活己方英雄阵营，否则取存活军团多数派系） */
function resolveSidePersonality(
  state: BattleState,
  side: SideId,
  fallbackAlignment: Alignment,
  weight: number,
): FactionPersonality {
  const sideUnits = Object.values(state.units).filter((u) => u.side === side && u.status === 'alive');
  const hero = sideUnits.find((u) => u.kind === 'hero');
  const rawAlign = hero?.alignment ?? fallbackAlignment;
  const base = FACTION_PERSONALITIES[rawAlign] ?? FACTION_PERSONALITIES.might;
  return {
    id: rawAlign,
    buffBias: blendPersonalityFactor(base.buffBias, weight),
    healCleanseBias: blendPersonalityFactor(base.healCleanseBias, weight),
    nukeBias: blendPersonalityFactor(base.nukeBias, weight),
    controlIllusionBias: blendPersonalityFactor(base.controlIllusionBias, weight),
    debuffNecroBias: blendPersonalityFactor(base.debuffNecroBias, weight),
    summonBias: blendPersonalityFactor(base.summonBias, weight),
    aggression: blendPersonalityFactor(base.aggression, weight),
    caution: blendPersonalityFactor(base.caution, weight),
  };
}

/** 构造当前回合的完整战场情报与 1 回合敌军近战危险热力图 */
export function buildBattlefieldIntel(
  state: BattleState,
  activeUnit: BattleUnit,
  catalog: CombatContentCatalog,
  profile: AiDifficultyProfile,
): BattlefieldIntel {
  const allAlive = Object.values(state.units).filter((u) => u.status === 'alive');
  const allies = allAlive.filter((u) => u.side === activeUnit.side);
  const enemies = allAlive.filter((u) => u.side !== activeUnit.side);
  const personality = resolveSidePersonality(
    state,
    activeUnit.side,
    activeUnit.alignment,
    profile.factionPersonalityWeight,
  );

  const pendingQueueSet = new Set<string>([...state.turnQueue, ...state.waitQueue]);
  const unitProfiles = new Map<string, UnitThreatProfile>();

  for (const u of allAlive) {
    const stats = computeUnitStats(u, state, catalog);
    const totalHp = Math.max(1, (u.count - 1) * stats.maxHp + u.currentHp);
    const avgSingle = (stats.minDamage + stats.maxDamage) / 2;
    const moraleMult =
      u.roundMoraleState === 'good' ? 1.25 : u.roundMoraleState === 'bad' ? 0.8 : 1;
    const strikeMult = u.abilities.doubleStrike ? 1.85 : 1;
    const blessCurseMult = u.statusEffects?.bless ? 1.15 : u.statusEffects?.curse ? 0.78 : 1;
    const expectedDps = Math.max(1, avgSingle * u.count * moraleMult * strikeMult * blessCurseMult);

    const isActiveRanged = isUnitActiveRanged(u);
    const engaged = isEngagedInMelee(state, u);
    const isUnpinnedRanged = isActiveRanged && !engaged;
    const isHardCCed = isUnitHardCCed(u);
    const isWakeOnDamageCC = isUnitWakeOnDamageCC(u);
    const isFrontlineHero = isFrontlineCombatHero(u);

    const castableSpells =
      u.knownSpellIds.length > 0 && (u.mana ?? 0) >= 2 && !(u.statusEffects?.songOfPeaceRounds && u.statusEffects.songOfPeaceRounds > 0)
        ? u.knownSpellIds
            .map((id) => catalog.spells[id])
            .filter(
              (sp) =>
                Boolean(sp) &&
                !sp.isAdventureOnly &&
                sp.targetType !== 'adventure' &&
                (u.mana ?? 0) >= getEffectiveSpellManaCost(state, u, sp),
            )
        : [];
    const isSpellcaster = castableSpells.length > 0;
    const isSupportCaster = castableSpells.some(
      (sp) =>
        Boolean(sp.healBase || sp.reviveBase || sp.buffModifiers || sp.massScope === 'all_allies') ||
        sp.targetType === 'corpse_unit' ||
        sp.targetType === 'hex_empty' ||
        sp.specialEffect === 'blind' ||
        sp.specialEffect === 'hypnotize' ||
        sp.specialEffect === 'berserk' ||
        sp.specialEffect === 'forgetfulness' ||
        sp.specialEffect === 'create_illusion' ||
        sp.specialEffect === 'phantom_image' ||
        sp.specialEffect === 'prayer' ||
        sp.specialEffect === 'mass_bless' ||
        sp.specialEffect === 'divine_intervention',
    );

    const tierWeight =
      u.kind === 'hero' ? 4 : (catalog.creatures[u.defId]?.tier ?? 2);
    const dpsPerHp = expectedDps / totalHp;

    let role: UnitTacticalRole;
    if (u.kind === 'hero') {
      role = isFrontlineHero ? 'hero_bruiser' : 'hero_caster';
    } else if (isActiveRanged) {
      role = 'ranged_dps';
    } else if (isSpellcaster && (isSupportCaster || tierWeight >= 2)) {
      role = 'caster_support';
    } else if (u.abilities.flying || stats.speed >= 8) {
      role = 'flier_striker';
    } else if (dpsPerHp >= 0.34 || u.abilities.noRetaliation || u.abilities.doubleStrike) {
      role = 'melee_bruiser';
    } else {
      role = 'tank_frontline';
    }

    // 计算原始战术击杀优先级倍率（射手 / 法师 / 辅助 / 英雄最高，重甲低攻肉盾最低）
    let rawPriority = 1.0;
    if (role === 'hero_caster') {
      rawPriority = 1.56;
    } else if (role === 'hero_bruiser') {
      rawPriority = 1.44;
    } else if (role === 'ranged_dps') {
      rawPriority = isUnpinnedRanged ? 1.5 : 1.16;
      if (isSpellcaster) rawPriority += 0.12;
    } else if (role === 'caster_support') {
      rawPriority = 1.42;
    } else if (role === 'flier_striker') {
      rawPriority = 1.24;
    } else if (role === 'melee_bruiser') {
      rawPriority = 1.08;
    } else {
      rawPriority = 0.84;
    }

    // 敌方正在维持专属符卡领域时，击倒该英雄可触发「符卡收取」额外回蓝加 P 点，优先级拉满！
    if (
      u.kind === 'hero' &&
      state.activeFieldAura &&
      state.activeFieldAura.casterUnitId === u.id &&
      !state.activeFieldAura.captured
    ) {
      rawPriority += 0.32;
    }

    // 已被硬控瘫痪的单位当回合威胁大降，避免把宝贵火力倾泻在已经动不了的目标上
    if (isHardCCed) {
      rawPriority *= 0.45;
    }
    // 幻象分身虽然血少，但若其输出高、且单下打死就能消除大量 DPS，可略微保持击破价值
    if (u.isIllusion) {
      rawPriority *= 0.92;
    }

    const priorityMultiplier = 1 + (rawPriority - 1) * profile.rolePriorityWeight;

    // 综合威胁值：普攻输出 + 施法潜力 + 体积持久力
    const spellThreat = isSpellcaster
      ? (u.kind === 'hero' ? 75 + stats.spellPower * 6.5 : 35 + Math.min(60, (u.mana ?? 0) * 3.5))
      : 0;
    const rawThreat = (expectedDps * 1.35 + spellThreat + totalHp * 0.22) * priorityMultiplier;
    const threatScore = isHardCCed ? rawThreat * 0.35 : rawThreat;

    // 每点伤害的战术含金量：打在脆皮射手/法师上的每 1 点伤害，比刮在前排血牛上更值钱
    const fragilityFactor = Math.min(1.85, Math.max(0.72, 130 / Math.max(55, Math.sqrt(totalHp) * 9)));
    const baseValuePerHp = 0.72 + 0.52 * priorityMultiplier * fragilityFactor;
    const valuePerHp = 1 + (baseValuePerHp - 1) * Math.max(0.2, profile.rolePriorityWeight);

    const canActLaterThisRound =
      u.id !== activeUnit.id &&
      !u.hasActedThisRound &&
      !isHardCCed &&
      pendingQueueSet.has(u.id);

    unitProfiles.set(u.id, {
      unit: u,
      stats,
      totalHp,
      expectedDps,
      isActiveRanged,
      isUnpinnedRanged,
      isSpellcaster,
      isSupportCaster,
      isHardCCed,
      isWakeOnDamageCC,
      isFrontlineHero,
      role,
      priorityMultiplier,
      threatScore,
      valuePerHp,
      positiveBuffScore: evaluatePositiveBuffScore(u),
      negativeDebuffScore: evaluateNegativeDebuffScore(u),
      canActLaterThisRound,
      tierWeight,
    });
  }

  // 缓存全部存活单位的多格占位与占用键集，并对当前单位的可达图做惰性缓存
  const occupiedHexesByUnitId = new Map<string, HexCoord[]>();
  const occupiedHexKeys = new Set<string>();
  for (const u of allAlive) {
    const hexes = getUnitOccupiedHexes(u);
    occupiedHexesByUnitId.set(u.id, hexes);
    for (const h of hexes) occupiedHexKeys.add(hexKey(h));
  }
  let cachedReachable: ReturnType<typeof getUnitReachableMap> | null = null;
  const getActiveReachable = () => {
    if (!cachedReachable) {
      cachedReachable = getUnitReachableMap(state, activeUnit, catalog);
    }
    return cachedReachable;
  };

  // 构造轻量化几何危险圈表（O(敌军数) 亚毫秒查询，避免每步为 7 名敌军重复跑全图 Dijkstra！）
  interface EnemyThreatZone {
    hexes: HexCoord[];
    threatRadius: number;
    meleeThreat: number;
  }
  const enemyThreatZones: EnemyThreatZone[] = [];
  if (profile.enableThreatMap) {
    for (const enemy of enemies) {
      const ep = unitProfiles.get(enemy.id);
      if (!ep || ep.isHardCCed || enemy.abilities.noMelee) continue;
      const meleeThreat =
        enemy.kind === 'hero' && !ep.isFrontlineHero
          ? ep.expectedDps * 0.35
          : ep.isActiveRanged && !enemy.abilities.noMeleePenalty
            ? ep.expectedDps * 0.3
            : ep.expectedDps;
      if (meleeThreat <= 5) continue;

      const reachAdj = enemy.abilities.longWeapon ? 2 : 1;
      const moveBonus =
        enemy.abilities.globalTeleport
          ? 24
          : enemy.abilities.flying || enemy.abilities.teleport
            ? ep.stats.speed
            : Math.max(1, ep.stats.speed - 1);
      enemyThreatZones.push({
        hexes: occupiedHexesByUnitId.get(enemy.id) ?? [enemy.pos],
        threatRadius: moveBonus + reachAdj,
        meleeThreat,
      });
    }
  }

  // 检查己方是否有尚未行动的英雄/大法师手握强力群 Buff（用于主力单位决定是否先 WAIT 等 Buff）
  const allyPendingMajorBuff = allies.some((a) => {
    if (a.id === activeUnit.id) return false;
    const ap = unitProfiles.get(a.id);
    if (!ap || !ap.canActLaterThisRound || !ap.isSpellcaster) return false;
    return a.knownSpellIds.some((id) => {
      const sp = catalog.spells[id];
      if (!sp || sp.isAdventureOnly || sp.level > profile.maxSpellLevel) return false;
      if ((a.mana ?? 0) < getEffectiveSpellManaCost(state, a, sp)) return false;
      if (sp.specialEffect && MAJOR_ARMY_BUFF_EFFECTS.has(sp.specialEffect)) return true;
      return sp.massScope === 'all_allies' && Boolean(sp.buffModifiers?.length);
    });
  });

  const anyEnemyPendingThisRound = enemies.some((e) => unitProfiles.get(e.id)?.canActLaterThisRound);
  const allEnemiesWakeCCed =
    enemies.length > 0 && enemies.every((e) => Boolean(unitProfiles.get(e.id)?.isWakeOnDamageCC));

  const getFootprintDanger = (anchor: HexCoord, footprint: FootprintSize): number => {
    if (!profile.enableThreatMap || enemyThreatZones.length === 0) return 0;
    const foot = getFootprintHexes(anchor, footprint);
    let totalDanger = 0;
    for (const z of enemyThreatZones) {
      if (minHexSetDistance(foot, z.hexes) <= z.threatRadius) {
        totalDanger += z.meleeThreat;
      }
    }
    return totalDanger;
  };

  return {
    profile,
    personality,
    activeUnit,
    activeProfile: unitProfiles.get(activeUnit.id)!,
    getActiveReachable,
    occupiedHexesByUnitId,
    occupiedHexKeys,
    allies,
    enemies,
    unitProfiles,
    allyPendingMajorBuff,
    anyEnemyPendingThisRound,
    allEnemiesWakeCCed,
    getFootprintDanger,
    getProfile: (unitId: string) => unitProfiles.get(unitId),
  };
}

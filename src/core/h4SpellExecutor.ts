/**
 * 《英雄无敌 IV (HoMM4)》全 142 法术完整结算引擎
 *
 * 严格遵循纯逻辑零视图依赖原则，完整实现全部 137 个战斗术式（+ 5 个大地图术式校验）：
 * - 灵力消耗动态修正：魔力涌动（Mana Flare -2 MP）/ 魔力枯竭（Power Drain ×2）/ 魔力虹吸（Magic Leech ×2 并吸蓝）/ 法术枷锁（Spell Shackle 耗蓝反伤）
 * - 派系宗师威力系数：依据施法者对应五系技能等级（1~5 宗师级）自动放大伤害、治疗、召唤与复活规模
 * - 完整实装：全魔免双向拦截、魔法镜面 50% 反弹、派系守护 50% 减伤、连锁闪电 5 跳衰减、末日审判敌我不分、
 *   火环挖心、流沙地形、瞬息传送、空间击退、殉道替伤、血祭复生、催眠倒戈、狂暴乱打、致盲破控、
 *   16 种自然召唤 + 2 种幻象分身 + 5 种死亡招魂复生、驱魔/消除/驱散/窃取附魔全套交互！
 */

import type { Alignment } from './alignment';
import {
  DARK_MAGIC_VULNERABILITY_MULT,
  isDarkMagicVulnerable,
  isImmuneToLivingEffects,
  isImmuneToLivingHeal,
  isImmuneToMindSpells,
  isImmuneToMorale,
  isMindSpellDef,
  isUndeadUnit,
} from './creatureTypes';
import {
  computeHeroSpellEffectivenessMultiplier,
  H4_ADVANCED_CLASSES,
  resolveActiveHeroClass,
} from './h4Skills';
import {
  getFootprintHexes,
  getHexRange,
  hexDistance,
  hexEquals,
  hexKey,
  hexRay,
  type FootprintSize,
  type HexCoord,
} from './hex';
import { computeUnitStats } from './modifiers';
import { nextRandom } from './rng';
import {
  enforceUnitStatusSlotCap,
  markStatusEffectOrder,
  upsertUnitModifier,
} from './statusCap';
import { HERO_TRAIT_REGISTRY, type SpellPowerHookContext } from './traits';
import type {
  AdvancedClassDef,
  BattleState,
  BattleUnit,
  CombatCommand,
  CombatEvent,
  CommandResult,
  CreatureDefinition,
  PrimarySkillId,
  SideId,
  SpellDef,
  StatModifier,
} from './types';
import type { CombatContentCatalog } from './combatEngine';

export interface SpellExecutionDeps {
  getUnitOccupiedHexes: (unit: BattleUnit) => HexCoord[];
  getUnitMinDistance: (a: BattleUnit, b: BattleUnit) => number;
  findUnitAtHex: (state: BattleState, hex: HexCoord, includeKnockedOut?: boolean) => BattleUnit | null;
  checkSpellLineOfSight: (
    state: BattleState,
    caster: BattleUnit,
    targetHexes: readonly HexCoord[],
    targetUnit?: BattleUnit | null,
  ) => { canCast: boolean };
  applyDamageToUnit: (
    state: BattleState,
    target: BattleUnit,
    damage: number,
    catalog: CombatContentCatalog,
    events: CombatEvent[],
  ) => number;
  applyBonusKills: (
    state: BattleState,
    target: BattleUnit,
    bonusKills: number,
    events: CombatEvent[],
  ) => number;
  grantGrazeReward: (
    state: BattleState,
    defender: BattleUnit,
    manaGain: number,
    catalog: CombatContentCatalog,
  ) => void;
  handlePostKillRewards: (
    state: BattleState,
    killer: BattleUnit,
    victim: BattleUnit,
    kills: number,
  ) => void;
  consumeActiveUnitTurn: (state: BattleState, unit: BattleUnit) => void;
  advanceTurn: (state: BattleState, catalog: CombatContentCatalog, events: CombatEvent[]) => void;
  syncMidRoundMorale: (
    state: BattleState,
    affectedUnitIds: string[],
    catalog: CombatContentCatalog,
    events: CombatEvent[],
  ) => void;
}

/** 判断单位是否正站在高台/站台地形（highland 或 tower）上 */
export function isUnitOnHighlandPlatform(state: BattleState, unit: BattleUnit): boolean {
  return getFootprintHexes(unit.pos, unit.footprint).some((h) => {
    const tile = state.tiles[hexKey(h)];
    return tile?.terrain === 'highland' || tile?.terrain === 'tower';
  });
}

/**
 * 计算单位施放指定法术的实时有效施法距离（唯一事实来源）：
 * - 基础射程 <= 0（自身/全场即时术式或大地图术式）保持 0
 * - 站在高地/站台（highland / tower）上的单位，所有有射程术式施法距离 +50%
 */
export function getEffectiveSpellRange(
  state: BattleState,
  caster: BattleUnit,
  spell: SpellDef,
): number {
  if (spell.range <= 0) return spell.range;
  if (isUnitOnHighlandPlatform(state, caster)) {
    return Math.round(spell.range * 1.5);
  }
  return spell.range;
}

/**
 * 将精确的总生命预算拆分为堆叠数量与首名残兵生命（HoMM4 原版忠实规则）：
 * - 绝不通过强制补满白嫖整血单位！
 * - 例：unitMaxHp = 78, totalHpPool = 40 → { count: 1, currentHp: 40 }（1 名残血兵）
 * - 例：unitMaxHp = 78, totalHpPool = 100 → { count: 2, currentHp: 22 }（1 满血 + 1 名 22/78 残兵）
 */
export function allocateHpPoolToStack(
  totalHpPool: number,
  unitMaxHp: number,
): { count: number; currentHp: number } {
  const safeMaxHp = Math.max(1, Math.round(unitMaxHp));
  const safePool = Math.max(0, Math.floor(totalHpPool));
  if (safePool <= 0) {
    return { count: 0, currentHp: 0 };
  }
  const fullCount = Math.floor(safePool / safeMaxHp);
  const remainder = safePool % safeMaxHp;
  if (remainder > 0) {
    return { count: fullCount + 1, currentHp: remainder };
  }
  return { count: fullCount, currentHp: safeMaxHp };
}

/**
 * 计算目标单位当前可供招魂/死灵转化提取的剩余残骸生命池：
 * - 仅统计已阵亡兵力的生命总和，并扣减已被历次招魂消耗的 consumedCorpseHp
 */
export function getAvailableCorpseHp(
  state: BattleState,
  target: BattleUnit,
  catalog: CombatContentCatalog,
): number {
  if (target.kind !== 'creature' || target.statusEffects?.disintegrated) return 0;
  const lostModels =
    target.status === 'dead' ? target.maxCount : Math.max(0, target.maxCount - target.count);
  if (lostModels <= 0) return 0;
  const unitMaxHp = Math.max(1, computeUnitStats(target, state, catalog).maxHp);
  const totalDeadHp = lostModels * unitMaxHp;
  const consumed = target.statusEffects?.consumedCorpseHp ?? 0;
  return Math.max(0, totalDeadHp - consumed);
}

export type IllusionCastEvaluation =
  | {
      ok: true;
      illusionHpPool: number;
      count: number;
      currentHp: number;
      casterDominance: number;
      requiredDominance: number;
    }
  | {
      ok: false;
      reason: string;
      shortLabel: string;
      casterDominance?: number;
      requiredDominance?: number;
    };

/**
 * 评估幻象/镜像复制法术（Create Illusion / Phantom Image）的施法门槛与精确残兵规模（HoMM4 原版忠实机制）：
 * 1. 仅可复制非英雄且非幻象的普通兵种；
 * 2. 施法者实力（英雄等级+法强+秩序造诣 / 兵种当前总血量×阶位权重）必须远强于目标单兵强度
 *    （2 阶「蜃楼幻影」需 ≥ 3.0× 目标单兵强度；4 阶「月镜分身」需 ≥ 1.8× 目标单兵强度）；
 * 3. 幻象总生命严格受 min(目标当前有效总血量 × 复制比例, 施法预算) 截断，允许生成残兵且绝不免费补满！
 */
export function evaluateIllusionSpell(
  spell: SpellDef,
  caster: BattleUnit,
  target: BattleUnit,
  state: BattleState,
  catalog: CombatContentCatalog,
  traitMult = 1,
): IllusionCastEvaluation {
  if (target.kind !== 'creature') {
    return { ok: false, reason: '幻象类法术仅可复刻普通兵种（不可复刻英雄）', shortLabel: '不可复刻英雄' };
  }
  if (target.isIllusion) {
    return { ok: false, reason: '无法对幻象单位再次施放镜像复制法术', shortLabel: '不可复制幻象' };
  }
  const targetDef = catalog.creatures[target.defId];
  if (!targetDef) {
    return { ok: false, reason: '缺少目标兵种蓝图数据', shortLabel: '蓝图缺失' };
  }

  const targetStats = computeUnitStats(target, state, catalog);
  const targetMaxHp = Math.max(1, targetStats.maxHp);
  const targetTierWeight =
    targetDef.tier === 1 ? 1.0 : targetDef.tier === 2 ? 1.25 : targetDef.tier === 3 ? 1.55 : 2.1;
  const targetUnitPower = Math.round(targetMaxHp * targetTierWeight);

  const casterStats = computeUnitStats(caster, state, catalog);
  let casterDominance = 0;
  if (caster.kind === 'hero') {
    const orderRank = getCasterSchoolRank(caster, 'order');
    const wizardryRank = caster.subSkills?.wizardry ?? 0;
    casterDominance = Math.round(
      90 +
        (caster.level ?? 1) * 55 +
        casterStats.spellPower * 18 +
        orderRank * 45 +
        wizardryRank * 25,
    );
  } else {
    const casterDef = catalog.creatures[caster.defId];
    const casterTier = casterDef?.tier ?? 2;
    const casterTierWeight =
      casterTier === 1 ? 1.0 : casterTier === 2 ? 1.25 : casterTier === 3 ? 1.55 : 2.1;
    const casterTotalHp = Math.max(
      1,
      (caster.count - 1) * Math.max(1, casterStats.maxHp) + caster.currentHp,
    );
    casterDominance = Math.round(casterTotalHp * casterTierWeight);
  }

  const isPhantom = spell.specialEffect === 'phantom_image';
  const dominanceMult = isPhantom ? 1.8 : 3.0;
  const requiredDominance = Math.round(targetUnitPower * dominanceMult);
  if (casterDominance < requiredDominance) {
    return {
      ok: false,
      reason: `目标「${target.name}」过于强大（需施法支配力 ≥ ${requiredDominance}，当前 ${casterDominance}），施法者须远强于目标单兵方可施放复制`,
      shortLabel: '实力不足以复制',
      casterDominance,
      requiredDominance,
    };
  }

  const activeHeroClass =
    caster.kind === 'hero'
      ? resolveActiveHeroClass(
          caster.skills,
          caster.subSkills,
          catalog.advancedClasses,
          caster.selectedAdvancedClassId,
        )
      : null;
  const subAndClassMult =
    caster.kind === 'hero' && spell.alignment !== 'might'
      ? computeHeroSpellEffectivenessMultiplier(
          caster.skills,
          caster.subSkills,
          activeHeroClass,
          spell.alignment,
          'buff_debuff',
        )
      : 1;
  const budgetHp = computeDualTrackSpellPower({
    caster,
    baseValue: isPhantom ? 72 : 36,
    heroSpWeight: isPhantom ? 3.8 : 2.4,
    casterSpellPower: casterStats.spellPower,
    schoolMult: getSchoolSpellMultiplier(caster, spell),
    subAndClassMult,
    traitMult,
    catalog,
  });

  const ratio = isPhantom ? 0.85 : 0.5;
  const targetCurrentTotalHp = Math.max(1, (target.count - 1) * targetMaxHp + target.currentHp);
  const illusionHpPool = Math.floor(Math.min(targetCurrentTotalHp * ratio, budgetHp));
  const minViableHp = Math.max(1, Math.ceil(targetDef.baseStats.maxHp * 0.25));
  if (illusionHpPool < minViableHp) {
    return {
      ok: false,
      reason: `当前幻象生命预算仅 ${illusionHpPool} HP（至少需 ${minViableHp} HP），不足以凝聚「${target.name}」的幻象`,
      shortLabel: '预算不足以复制',
      casterDominance,
      requiredDominance,
    };
  }

  const allocated = allocateHpPoolToStack(illusionHpPool, targetDef.baseStats.maxHp);
  if (allocated.count <= 0) {
    return {
      ok: false,
      reason: '幻象生命预算不足，无法生成分身',
      shortLabel: '预算不足以复制',
      casterDominance,
      requiredDominance,
    };
  }
  return {
    ok: true,
    illusionHpPool,
    count: allocated.count,
    currentHp: allocated.currentHp,
    casterDominance,
    requiredDominance,
  };
}

/** 计算指定法术的实时有效灵力消耗（纳入魔力涌动 -2、星辰大魔导/巫师职业 -2、魔力枯竭/虹吸 ×2） */
export function getEffectiveSpellManaCost(
  state: BattleState,
  caster: BattleUnit,
  spell: SpellDef,
  advancedClasses: Record<string, AdvancedClassDef> = H4_ADVANCED_CLASSES,
): number {
  let cost = spell.manaCost;
  if (caster.kind === 'hero') {
    const activeCls = resolveActiveHeroClass(
      caster.skills,
      caster.subSkills,
      advancedClasses,
      caster.selectedAdvancedClassId,
    );
    if (activeCls?.passive?.manaCostDelta) {
      cost = Math.max(1, cost + activeCls.passive.manaCostDelta);
    }
  }
  if (state.battleSpellFlags?.manaFlareActive) {
    cost = Math.max(1, cost - 2);
  }
  if (caster.statusEffects?.powerDrain || caster.statusEffects?.magicLeechCasterId) {
    cost *= 2;
  }
  return Math.max(1, cost);
}

/** 读取施法者在对应五系魔法的技能等级（0~5，宗师级 = 5） */
export function getCasterSchoolRank(caster: BattleUnit, alignment: Alignment): number {
  if (alignment === 'might') return 0;
  const key = `${alignment}_magic` as PrimarySkillId;
  return caster.skills[key] ?? 0;
}

/**
 * 魔法派系主技能倍率（严格对齐 HoMM4 原版规则）：
 * 主魔法技能负责解锁 1~5 阶法术与进阶职业门槛，不再额外叠乘伤害倍率，
 * 伤害与治疗成长统一归由英雄等级、法强、子技能（魔力/炎术/治愈等）与职业被动承担。
 */
export function getSchoolSpellMultiplier(_caster: BattleUnit, _spell: SpellDef): number {
  return 1;
}

/**
 * 计算非英雄施法兵种的单体施法效能系数（HoMM4 正统按人头线性缩放）：
 * 按兵种阶位（T1~T4）给出稳定基准并叠加单兵法强（每点 +0.03），
 * 确保 T1 魔法使（SP=2）施放魔导星矢（base=20）精确打出 20×0.25 = 5 点/人。
 */
export function getCreaturePerUnitSpellFactor(
  caster: BattleUnit,
  casterSpellPower: number,
  catalog: CombatContentCatalog,
): number {
  const tier = catalog.creatures[caster.defId]?.tier ?? 2;
  const tierBase = tier === 1 ? 0.19 : tier === 2 ? 0.27 : tier === 3 ? 0.38 : 0.68;
  return tierBase + Math.max(0, casterSpellPower) * 0.03;
}

/**
 * 双轨法术威力公式（单一事实来源）：
 * - 英雄单位：基础威力 × (1 + 0.1 × (level - 1)) + 法强 × heroSpWeight，再乘派系阶位 × 子技能/职业倍率 × 特质钩子
 * - 非英雄兵种：基础威力 × 单体施法效能系数 × 存活人头数 count × 特质钩子（严格按堆叠数量线性缩放！）
 */
export function computeDualTrackSpellPower(opts: {
  caster: BattleUnit;
  baseValue: number;
  heroSpWeight: number;
  casterSpellPower: number;
  schoolMult: number;
  subAndClassMult: number;
  traitMult: number;
  catalog: CombatContentCatalog;
}): number {
  if (opts.caster.kind === 'creature') {
    const perUnit = getCreaturePerUnitSpellFactor(opts.caster, opts.casterSpellPower, opts.catalog);
    return opts.baseValue * perUnit * Math.max(1, opts.caster.count) * opts.traitMult;
  }
  const heroLevelMult = 1 + Math.max(0, (opts.caster.level ?? 1) - 1) * 0.1;
  const baseWithHeroStats = opts.baseValue * heroLevelMult + opts.casterSpellPower * opts.heroSpWeight;
  return baseWithHeroStats * opts.schoolMult * opts.subAndClassMult * opts.traitMult;
}

export type SpellTargetValidationResult =
  | { ok: true }
  | { ok: false; reason: string; shortLabel: string };

/**
 * 单体法术目标合法性统一校验器（引擎结算 + UI 准星/高亮 + 战术 AI 共享单一事实来源）：
 * 完整拦截阵营归属、全魔免、圣域、非活体治愈/护命、心智免疫、活体生理限制、
 * 仅远程法术（精准/忘却）、仅近战附魔（嗜血/炎缠/吸血/先攻）、仅施法者诅咒、士气免疫与已飞行重复加持。
 */
export function validateSpellUnitTarget(
  spell: SpellDef,
  caster: BattleUnit,
  target: BattleUnit,
  state: BattleState,
  catalog: CombatContentCatalog,
  allowDead = false,
): SpellTargetValidationResult {
  const eff = spell.specialEffect ?? 'standard';
  if ((!allowDead && target.status !== 'alive') || (allowDead && target.status === 'knocked_out')) {
    return { ok: false, reason: '请选择有效目标单位', shortLabel: '无效目标' };
  }
  if (spell.targetType === 'ally_unit' && target.side !== caster.side) {
    return { ok: false, reason: '该术式仅可作用于友军', shortLabel: '仅限友军' };
  }
  if (spell.targetType === 'enemy_unit' && target.side === caster.side) {
    return { ok: false, reason: '该术式仅可作用于敌军', shortLabel: '仅限敌军' };
  }
  if (target.abilities.magicImmune && !(eff === 'dispel' && target.statusEffects?.antiMagic)) {
    return { ok: false, reason: '全魔法免疫目标无法被任何正面或负面法术指定', shortLabel: '全魔免免疫' };
  }
  if (target.statusEffects?.sanctuary && target.id !== caster.id && eff !== 'dispel') {
    return { ok: false, reason: '目标隐于「常世净域」，免疫一切法术', shortLabel: '常世净域中' };
  }
  if ((spell.healBase || spell.reviveBase || eff === 'guardian_angel') && !allowDead && isImmuneToLivingHeal(target)) {
    return { ok: false, reason: '机械/不死/元素/幻象单位无法接受活体治愈、苏生或护命', shortLabel: '非活体不可治愈' };
  }
  if (isMindSpellDef(spell) && isImmuneToMindSpells(target)) {
    return { ok: false, reason: '机械/不死/幻象单位免疫心智魔法', shortLabel: '免疫心智魔法' };
  }
  if ((spell.livingOnly || eff === 'hand_of_death') && isImmuneToLivingEffects(target)) {
    return { ok: false, reason: '该术式仅对活体生物生效（对机械/不死/元素/幻象无效）', shortLabel: '仅对活体生效' };
  }
  if (eff === 'precision' || eff === 'forgetfulness') {
    if (!target.abilities.ranged || target.abilities.noRanged) {
      return eff === 'precision'
        ? { ok: false, reason: '目标不具备有效远程攻击能力，无法施放「天眼狙定」', shortLabel: '非远程不可精准' }
        : { ok: false, reason: '目标无有效远程能力，无需封印弹幕', shortLabel: '非远程目标' };
    }
  }
  if (eff === 'bloodlust' || eff === 'fire_aura' || eff === 'vampiric_touch' || eff === 'first_strike') {
    if (target.abilities.noMelee) {
      return { ok: false, reason: '近战禁手单位不会进行近战交锋，无法受益于近战附魔', shortLabel: '近战禁手无效' };
    }
  }
  if (eff === 'vampiric_touch' && isImmuneToLivingHeal(target) && !isUndeadUnit(target)) {
    return { ok: false, reason: '机械/元素/幻象单位无法通过吸血回复生命', shortLabel: '不可吸血回复' };
  }
  if (eff === 'power_drain' || eff === 'magic_leech' || eff === 'spell_shackle') {
    const tStats = computeUnitStats(target, state, catalog);
    if (target.knownSpellIds.length === 0 || tStats.maxMana <= 0) {
      return { ok: false, reason: '目标不具备施法能力，该法力诅咒对其无效', shortLabel: '非施法单位' };
    }
  }
  if (spell.id === 'life_mirth' || spell.id === 'death_sorrow') {
    if (isImmuneToMorale(target)) {
      return { ok: false, reason: '机械/不死单位免疫正负士气波动', shortLabel: '免疫士气波动' };
    }
  }
  if (eff === 'flight' || eff === 'terrain_walk') {
    if (target.abilities.flying) {
      return { ok: false, reason: '目标已具备飞行能力，无需重复施加御空或履平', shortLabel: '已具备飞行' };
    }
  }
  if (eff === 'create_illusion' || eff === 'phantom_image') {
    const evalRes = evaluateIllusionSpell(spell, caster, target, state, catalog);
    if (!evalRes.ok) {
      return { ok: false, reason: evalRes.reason, shortLabel: evalRes.shortLabel };
    }
  }
  return { ok: true };
}

/** 校验多格体积是否可合法放置于目标锚格（无障碍、不越界、无存活单位占位） */
export function canPlaceFootprintAt(
  state: BattleState,
  anchor: HexCoord,
  footprint: FootprintSize,
  ignoreUnitId?: string,
  flying = false,
): boolean {
  const cells = getFootprintHexes(anchor, footprint);
  const occupied = new Set<string>();
  for (const u of Object.values(state.units)) {
    if (u.status !== 'alive' || u.id === ignoreUnitId) continue;
    for (const h of getFootprintHexes(u.pos, u.footprint)) {
      occupied.add(hexKey(h));
    }
  }
  for (const c of cells) {
    const k = hexKey(c);
    const tile = state.tiles[k];
    if (!tile) return false;
    if (tile.terrain === 'wall') return false;
    if (!flying && tile.blocksGround) return false;
    if (occupied.has(k)) return false;
  }
  return true;
}

/** 寻找距离中心点最近的可落位空锚格（供召唤、招魂、镜像分身使用） */
export function findNearestOpenAnchor(
  state: BattleState,
  origin: HexCoord,
  footprint: FootprintSize,
  flying = false,
  maxRadius = 4,
): HexCoord | null {
  for (let rad = 0; rad <= maxRadius; rad++) {
    const ring = getHexRange(origin, rad).filter((h) => hexDistance(origin, h) === rad);
    for (const h of ring) {
      if (canPlaceFootprintAt(state, h, footprint, undefined, flying)) {
        return h;
      }
    }
  }
  return null;
}

/** 授予临时特技（并记录以便驱散时精准收回） */
function grantTempAbility(
  target: BattleUnit,
  ab: 'firstStrike' | 'doubleStrike' | 'flying' | 'noRanged' | 'longRange' | 'noObstaclePenalty' | 'magicImmune',
): void {
  if (!target.abilities[ab]) {
    target.abilities[ab] = true;
    target.statusEffects.grantedAbilities = target.statusEffects.grantedAbilities ?? [];
    if (!target.statusEffects.grantedAbilities.includes(ab)) {
      target.statusEffects.grantedAbilities.push(ab);
    }
  }
}

/** 净化单位身上的全部负面法术效果（驱魔 Exorcism / 神圣干涉） */
export function cleanseNegativeEffects(target: BattleUnit, includePoisonAndPlague = true): number {
  let removed = 0;
  const beforeLen = target.modifiers.length;
  target.modifiers = target.modifiers.filter((m) => m.spellPolarity !== 'negative');
  removed += beforeLen - target.modifiers.length;

  const se = target.statusEffects;
  if (se.stunnedRounds > 0) { se.stunnedRounds = 0; removed++; }
  if (se.terrifiedRounds > 0) { se.terrifiedRounds = 0; removed++; }
  if (se.blindRounds) { se.blindRounds = 0; removed++; }
  if (se.confusionRounds) { se.confusionRounds = 0; removed++; }
  if (se.songOfPeaceRounds) { se.songOfPeaceRounds = 0; removed++; }
  if (se.cowardiceRounds) { se.cowardiceRounds = 0; removed++; }
  if (se.berserkRounds) { se.berserkRounds = 0; removed++; }
  if (se.hypnotizedRounds) {
    se.hypnotizedRounds = 0;
    if (se.hypnotizedOriginalSide) {
      target.side = se.hypnotizedOriginalSide;
      se.hypnotizedOriginalSide = undefined;
    }
    removed++;
  }
  if (se.curse) { se.curse = false; removed++; }
  if (se.powerDrain) { se.powerDrain = false; removed++; }
  if (se.magicLeechCasterId) { se.magicLeechCasterId = undefined; removed++; }
  if (se.spellShacklePower) { se.spellShacklePower = 0; removed++; }
  if (se.grantedAbilities?.includes('noRanged')) {
    target.abilities.noRanged = false;
    se.grantedAbilities = se.grantedAbilities.filter((a) => a !== 'noRanged');
    removed++;
  }
  if (includePoisonAndPlague) {
    if (se.poisonPower) { se.poisonPower = 0; removed++; }
    if (se.plaguePower) { se.plaguePower = 0; removed++; }
  }
  return removed;
}

/** 消除单位身上的全部正面法术效果（魔力消除 Cancellation / 驱散 Dispel） */
export function cleansePositiveEffects(target: BattleUnit): StatModifier[] {
  const stolen: StatModifier[] = [];
  target.modifiers = target.modifiers.filter((m) => {
    if (m.spellPolarity === 'positive') {
      stolen.push({ ...m });
      return false;
    }
    return true;
  });

  const se = target.statusEffects;
  se.bless = false;
  se.retribution = false;
  se.painMirror = false;
  se.magicMirror = false;
  se.vampiricTouch = false;
  se.fireAura = false;
  se.auraOfFear = false;
  se.slayer = false;
  se.defenderBonus = false;
  se.terrainWalk = false;
  se.blur = false;
  se.precisionRounds = 0;
  se.bloodlustRounds = 0;
  if (se.rabbitFormRounds && se.rabbitFormRounds > 0) {
    se.rabbitFormRounds = 0;
    se.rabbitFormGrantedFirstStrike = false;
    if (se.rabbitFormOriginalBlueprintId) {
      target.voxelBlueprintId = se.rabbitFormOriginalBlueprintId;
      se.rabbitFormOriginalBlueprintId = undefined;
    }
  }
  se.sanctuary = false;
  se.martyrProtectedByUnitId = undefined;
  se.regenPerRound = 0;
  se.tempShieldHp = 0;
  se.guardianAngelLives = 0;
  se.schoolWards = undefined;
  se.antiMagic = false;

  if (se.grantedAbilities) {
    for (const ab of se.grantedAbilities) {
      if (ab !== 'noRanged') {
        target.abilities[ab] = false;
      }
    }
    se.grantedAbilities = se.grantedAbilities.filter((a) => a === 'noRanged');
  }
  return stolen;
}

/** 在战场上真实生成一个召唤/招魂/幻象兵种单位并加入行动队列（支持 initialCurrentHp 生成残血领队） */
function spawnSummonedStack(
  state: BattleState,
  side: SideId,
  def: CreatureDefinition,
  count: number,
  pos: HexCoord,
  opts: {
    isSummoned?: boolean;
    isIllusion?: boolean;
    summonKind?: 'illusion' | 'summoned' | 'raised';
    customName?: string;
    initialCurrentHp?: number;
  },
): BattleUnit {
  const id = `${side}_sum_${state.commandSeq}_${Object.keys(state.units).length}`;
  const clampedInitialHp = Math.max(
    1,
    Math.min(def.baseStats.maxHp, Math.round(opts.initialCurrentHp ?? def.baseStats.maxHp)),
  );
  const unit: BattleUnit = {
    id,
    defId: def.id,
    kind: 'creature',
    side,
    name: opts.customName ?? def.name,
    alignment: def.alignment,
    pos: { ...pos },
    footprint: def.footprint ?? '1x1',
    facing: side === 'left' ? 'right' : 'left',
    status: 'alive',
    count: Math.max(1, count),
    maxCount: Math.max(1, count),
    currentHp: clampedInitialHp,
    baseStats: {
      attack: def.baseStats.attack,
      defense: def.baseStats.defense,
      minDamage: def.baseStats.minDamage,
      maxDamage: def.baseStats.maxDamage,
      maxHp: def.baseStats.maxHp,
      speed: def.baseStats.speed,
      initiative: def.baseStats.initiative,
      range: def.baseStats.range,
      morale: def.baseStats.morale,
      luck: def.baseStats.luck,
      magicResistance: def.baseStats.magicResistance,
      grazeChance: def.baseStats.grazeChance,
      spellPower: def.baseStats.spellPower ?? 0,
      maxMana: def.baseStats.maxMana ?? 0,
    },
    abilities: { ...def.abilities },
    ammo: def.baseStats.ammo,
    maxAmmo: def.baseStats.ammo,
    modifiers: [],
    statusEffects: { stunnedRounds: 0, terrifiedRounds: 0 },
    hasActedThisRound: false,
    hasWaitedThisRound: false,
    isDefending: false,
    hasRetaliatedThisRound: false,
    mana: def.baseStats.maxMana && def.baseStats.maxMana > 0 ? def.baseStats.maxMana : undefined,
    innateTraitIds: [],
    knownSpellIds: [...(def.knownSpellIds ?? [])],
    potions: [],
    skills: {},
    subSkills: {},
    equippedArtifactIds: [],
    voxelBlueprintId: def.voxelBlueprintId,
    themeColor: opts.isIllusion ? '#8ce8ff' : def.themeColor,
    accentColor: opts.isIllusion ? '#ffffff' : def.accentColor,
    isSummoned: opts.isSummoned,
    isIllusion: opts.isIllusion,
    summonKind: opts.summonKind ?? (opts.isIllusion ? 'illusion' : opts.isSummoned ? 'summoned' : undefined),
  };
  state.units[id] = unit;
  // 新召唤/招魂单位排入本巡行动队列末尾，立即具备实战参与感！
  state.turnQueue.push(id);
  return unit;
}

/** 计算并结算单次法术伤害（完整包含派系守护、魔抗、火抗、擦弹、破邪与全魔免拦截） */
function computeAndApplySpellDamage(
  state: BattleState,
  caster: BattleUnit,
  target: BattleUnit,
  spell: SpellDef,
  rawDamage: number,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
  deps: SpellExecutionDeps,
  grazeFactor = 0.7,
): { damage: number; kills: number; grazed: boolean } {
  if (target.abilities.magicImmune || target.statusEffects?.sanctuary) {
    return { damage: 0, kills: 0, grazed: false };
  }
  if (target.abilities.coldResistant && spell.isColdSpell) {
    state.actionLog.push(`❄ ${target.name} 具备「寒冰抗性」，完全免疫了寒冰法术「${spell.name}」！`);
    return { damage: 0, kills: 0, grazed: false };
  }
  const tStats = computeUnitStats(target, state, catalog);
  let dmg = rawDamage;

  if (spell.id === 'life_exorcism_orb' && (target.abilities.darkNature || isUndeadUnit(target) || target.alignment === 'chaos' || target.alignment === 'death')) {
    dmg *= 1.35;
  }
  if (isDarkMagicVulnerable(target)) {
    dmg *= DARK_MAGIC_VULNERABILITY_MULT;
  }
  if (target.abilities.deathWard && (spell.alignment === 'death' || spell.alignment === 'chaos')) {
    dmg *= 0.5;
  }
  if (target.abilities.lifeWard && spell.alignment === 'life') {
    dmg *= 0.5;
  }
  if (target.statusEffects?.schoolWards?.[spell.alignment]) {
    dmg *= 0.5;
  }
  if (target.abilities.fireResistant && spell.isFireSpell) {
    dmg *= 0.5;
  }
  if (target.abilities.chaosResistant && spell.alignment === 'chaos') {
    dmg *= 0.75;
  }
  if (target.abilities.lightningResistant && spell.isLightningSpell) {
    dmg *= 0.75;
  }
  dmg *= Math.max(0, 1 - tStats.magicResistance);

  let grazed = false;
  if (grazeFactor > 0 && tStats.grazeChance > 0 && nextRandom(state.rng) < tStats.grazeChance * grazeFactor) {
    grazed = true;
    dmg *= 0.75;
    deps.grantGrazeReward(state, target, 3, catalog);
  }
  const finalDmg = Math.max(1, Math.round(dmg));
  const kills = deps.applyDamageToUnit(state, target, finalDmg, catalog, events);
  deps.handlePostKillRewards(state, caster, target, kills);
  return { damage: finalDmg, kills, grazed };
}

/** 复活并治疗指定单位堆叠（支持起死回生已阵亡堆叠，上限为初始 maxCount） */
function reviveAndHealUnit(
  state: BattleState,
  target: BattleUnit,
  power: number,
  catalog: CombatContentCatalog,
  allowDeadResurrect = false,
): { revivedCount: number; healedHp: number } {
  if (target.statusEffects?.disintegrated) {
    return { revivedCount: 0, healedHp: 0 };
  }
  const tStats = computeUnitStats(target, state, catalog);
  const maxHp = Math.max(1, tStats.maxHp);
  const wasDead = target.status === 'dead';
  if (wasDead && !allowDeadResurrect) {
    return { revivedCount: 0, healedHp: 0 };
  }
  const oldCount = wasDead ? 0 : target.count;
  const oldTotal = wasDead ? 0 : (target.count - 1) * maxHp + target.currentHp;
  const maxTotal = target.maxCount * maxHp;
  const nextTotal = Math.min(maxTotal, oldTotal + Math.max(1, Math.round(power)));
  if (nextTotal <= oldTotal) return { revivedCount: 0, healedHp: 0 };

  const nextCount = Math.max(1, Math.ceil(nextTotal / maxHp));
  const nextTopHp = nextTotal - (nextCount - 1) * maxHp;
  target.count = nextCount;
  target.currentHp = nextTopHp;
  if (wasDead) {
    target.status = 'alive';
    if (!state.turnQueue.includes(target.id)) {
      state.turnQueue.push(target.id);
    }
  }
  return {
    revivedCount: Math.max(0, nextCount - oldCount),
    healedHp: Math.max(0, nextTotal - oldTotal),
  };
}

/**
 * 统一执行任意 HoMM4 五系法术指令（CAST_SPELL）
 */
export function executeH4CastSpell(
  state: BattleState,
  unit: BattleUnit,
  command: Extract<CombatCommand, { type: 'CAST_SPELL' }>,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
  deps: SpellExecutionDeps,
): CommandResult {
  const spell = catalog.spells[command.spellId];
  if (!spell || !unit.knownSpellIds.includes(spell.id)) {
    return { ok: false, error: '未习得该术式', events: [] };
  }
  if (spell.isAdventureOnly || spell.targetType === 'adventure') {
    return { ok: false, error: `「${spell.name}」为大地图行军术式，战斗棋盘中不可施放`, events: [] };
  }
  if (unit.statusEffects?.songOfPeaceRounds && unit.statusEffects.songOfPeaceRounds > 0) {
    return { ok: false, error: '受「镇魂神乐」安抚，当前无法施放法术', events: [] };
  }

  const effectiveCost = getEffectiveSpellManaCost(state, unit, spell, catalog.advancedClasses);
  if ((unit.mana ?? 0) < effectiveCost) {
    return { ok: false, error: `灵力不足（需要 ${effectiveCost} MP）`, events: [] };
  }

  // 施法行动解除自身圣域庇护
  if (unit.statusEffects?.sanctuary) {
    unit.statusEffects.sanctuary = false;
  }

  const casterStats = computeUnitStats(unit, state, catalog);
  const castHook: SpellPowerHookContext = {
    state,
    caster: unit,
    isSpellCard: false,
    damageMultiplier: 1,
    notes: [],
  };
  for (const traitId of unit.innateTraitIds) {
    HERO_TRAIT_REGISTRY[traitId]?.onBeforeCast?.(castHook);
  }

  const eff = spell.specialEffect ?? 'standard';
  const schoolMult = getSchoolSpellMultiplier(unit, spell);

  // 接入 36 技能树子技能 + 48 进阶职业专属法术倍率
  const activeHeroClass =
    unit.kind === 'hero'
      ? resolveActiveHeroClass(unit.skills, unit.subSkills, catalog.advancedClasses, unit.selectedAdvancedClassId)
      : null;
  const spellCategory: 'damage' | 'heal' | 'revive' | 'summon' | 'raise' | 'mind' | 'buff_debuff' =
    eff === 'summon_creature'
      ? 'summon'
      : eff === 'raise_undead' || eff === 'animate_dead' || eff === 'death_call'
        ? 'raise'
        : spell.reviveBase || eff === 'divine_intervention' || eff === 'guardian_angel'
          ? 'revive'
          : spell.healBase || eff === 'heavenly_shield' || eff === 'regeneration'
            ? 'heal'
            : eff === 'blind' || eff === 'hypnotize' || eff === 'berserk' || eff === 'confusion' || eff === 'cloud_of_confusion' || eff === 'cowardice' || eff === 'song_of_peace'
              ? 'mind'
              : spell.damageBase || eff === 'holy_word' || eff === 'holy_shout' || eff === 'hand_of_death' || eff === 'disintegrate' || eff === 'chain_lightning' || eff === 'armageddon' || eff === 'life_drain' || eff === 'sparks' || eff === 'banish'
                ? 'damage'
                : 'buff_debuff';
  const subAndClassMult =
    unit.kind === 'hero' && spell.alignment !== 'might'
      ? computeHeroSpellEffectivenessMultiplier(
          unit.skills,
          unit.subSkills,
          activeHeroClass,
          spell.alignment,
          spellCategory,
        )
      : 1;
  const lifeDurationBonus =
    unit.kind === 'hero' && spell.alignment === 'life' && (unit.subSkills?.spirituality ?? 0) >= 3 ? 1 : 0;
  const mindDurationBonus =
    unit.kind === 'hero' && (unit.subSkills?.charm ?? 0) >= 3 ? 1 : 0;

  /** 双轨威力计算器（英雄按等级+法强+技能树，兵种按存活人头数线性缩放） */
  const calcPower = (baseValue: number, heroSpWeight: number): number =>
    computeDualTrackSpellPower({
      caster: unit,
      baseValue,
      heroSpWeight,
      casterSpellPower: casterStats.spellPower,
      schoolMult,
      subAndClassMult,
      traitMult: castHook.damageMultiplier,
      catalog,
    });
  // 记录施法前各存活单位的有效士气，便于在士气法术或驱散生效后即时刷新本回合梯队与增减伤
  const preMoraleByUnitId = new Map<string, number>();
  for (const u of Object.values(state.units)) {
    if (u.status === 'alive') {
      preMoraleByUnitId.set(u.id, computeUnitStats(u, state, catalog).morale);
    }
  }
  const statusModifiedTargets = new Set<BattleUnit>();
  const touchStatusFlag = (t: BattleUnit, flagKey: string) => {
    markStatusEffectOrder(t, state, flagKey);
    statusModifiedTargets.add(t);
  };
  const pushSpellModifier = (t: BattleUnit, mod: StatModifier) => {
    upsertUnitModifier(t, state, { ...mod, spellId: mod.spellId ?? spell.id });
    statusModifiedTargets.add(t);
  };

  const affectedUnitIds: string[] = [];
  const damageMap: Record<string, { damage: number; kills: number; grazed: boolean }> = {};
  const healMap: Record<string, number> = {};
  const reviveMap: Record<string, { revivedCount: number; healedHp: number }> = {};
  const summonedUnitIds: string[] = [];
  const displacedUnits: Array<{ unitId: string; to: HexCoord }> = [];
  let targetHex: HexCoord = unit.pos;
  let noteText: string | undefined;

  const isMindSpell = spellCategory === 'mind' || isMindSpellDef(spell);

  const isTargetBlockedByLiving = (t: BattleUnit) =>
    Boolean(spell.livingOnly && isImmuneToLivingEffects(t));

  const isTargetBlockedByMind = (t: BattleUnit) =>
    Boolean(isMindSpell && isImmuneToMindSpells(t));

  const effectiveRange = getEffectiveSpellRange(state, unit, spell);

  const requireSingleUnit = (allowDead = false): BattleUnit | string => {
    const tUnit = command.targetUnitId ? state.units[command.targetUnitId] : undefined;
    if (!tUnit) {
      return '请选择有效目标单位';
    }
    const check = validateSpellUnitTarget(spell, unit, tUnit, state, catalog, allowDead);
    if (!check.ok) {
      return check.reason;
    }
    if (effectiveRange > 0 && deps.getUnitMinDistance(unit, tUnit) > effectiveRange) {
      return '目标超出施法距离';
    }
    if (!spell.ignoreLos && !allowDead && !deps.checkSpellLineOfSight(state, unit, deps.getUnitOccupiedHexes(tUnit), tUnit).canCast) {
      return '视线被高耸障碍或单位阻挡，无法施法';
    }
    return tUnit;
  };

  // =========================================================================
  // 1. 召唤类术式（自然 16 召唤 + 深渊冰魔召唤）
  // =========================================================================
  if (eff === 'summon_creature') {
    const template = spell.summonTemplateId ? catalog.creatures[spell.summonTemplateId] : undefined;
    if (!template) return { ok: false, error: '未找到召唤生物模板', events: [] };
    const reqHex = command.targetHex;
    if (!reqHex || !state.tiles[hexKey(reqHex)]) {
      return { ok: false, error: '请在战场空地选择召唤落点', events: [] };
    }
    if (effectiveRange > 0 && hexDistance(unit.pos, reqHex) > effectiveRange) {
      return { ok: false, error: '召唤位置超出施法范围', events: [] };
    }
    const spawnAnchor = canPlaceFootprintAt(state, reqHex, template.footprint, undefined, Boolean(template.abilities.flying))
      ? reqHex
      : findNearestOpenAnchor(state, reqHex, template.footprint, Boolean(template.abilities.flying), 2);
    if (!spawnAnchor) {
      return { ok: false, error: '目标区域空间不足，无法容纳该召唤生物', events: [] };
    }
    const budgetHp = calcPower(45, 3) * (0.75 + spell.level * 0.25);
    const count = Math.max(1, Math.round(budgetHp / Math.max(10, template.baseStats.maxHp)));
    const spawned = spawnSummonedStack(state, unit.side, template, count, spawnAnchor, {
      isSummoned: true,
      summonKind: 'summoned',
    });
    targetHex = spawnAnchor;
    summonedUnitIds.push(spawned.id);
    affectedUnitIds.push(spawned.id);
    noteText = `召唤 ${spawned.name} ×${spawned.count}!`;
    state.actionLog.push(`✦ ${unit.name} 施放「${spell.name}」，召唤 ${spawned.name} ×${spawned.count} 降临战阵！`);
  }
  // =========================================================================
  // 2. 死亡招魂 / 操纵死尸 / 死亡呼唤（正式死亡兵种 + 严格残骸生命池截断 + 支持残兵）
  // =========================================================================
  else if (eff === 'raise_undead' || eff === 'animate_dead' || eff === 'death_call') {
    if (state.battleSpellFlags?.necromancyWardActive) {
      return { ok: false, error: '战场受「净土封冥」封印，无法施放招魂术式！', events: [] };
    }
    const tUnit = command.targetUnitId ? state.units[command.targetUnitId] : undefined;
    if (!tUnit || tUnit.kind !== 'creature') {
      return { ok: false, error: '请选择一支已阵亡或有兵力折损的兵种残骸', events: [] };
    }
    if (tUnit.statusEffects?.disintegrated) {
      return { ok: false, error: '该目标已被「星穹湮灭」化为虚无，无法招魂复活！', events: [] };
    }
    if (effectiveRange > 0 && deps.getUnitMinDistance(unit, tUnit) > effectiveRange) {
      return { ok: false, error: '目标残骸超出施法距离', events: [] };
    }
    const lostModels = tUnit.status === 'dead' ? tUnit.maxCount : Math.max(0, tUnit.maxCount - tUnit.count);
    if (lostModels <= 0) {
      return { ok: false, error: '目标尚未出现阵亡兵力，无法唤起亡骸', events: [] };
    }
    targetHex = tUnit.pos;

    if (eff === 'raise_undead') {
      const template = spell.summonTemplateId ? catalog.creatures[spell.summonTemplateId] : undefined;
      if (!template) return { ok: false, error: '未找到招魂亡灵模板', events: [] };
      const availableCorpseHp = getAvailableCorpseHp(state, tUnit, catalog);
      if (availableCorpseHp <= 0) {
        return { ok: false, error: '该残骸的亡灵生机已被耗尽，无法再次招魂', events: [] };
      }
      const anchor = findNearestOpenAnchor(state, tUnit.pos, template.footprint, Boolean(template.abilities.flying), 3);
      if (!anchor) return { ok: false, error: '目标残骸周围无空地可唤起亡灵', events: [] };
      // 按招魂术等阶分层计算施法生命预算，并与残骸剩余生命池取较小值（杜绝小怪尸体白嫖满血高阶亡灵）
      const budgetHp =
        spell.level <= 1
          ? calcPower(32, 2.0)
          : spell.level <= 3
            ? calcPower(48, 2.8)
            : calcPower(68, 3.8);
      const effectiveHpPool = Math.floor(Math.min(availableCorpseHp, budgetHp));
      const allocated = allocateHpPoolToStack(effectiveHpPool, template.baseStats.maxHp);
      if (allocated.count <= 0) {
        return { ok: false, error: '招魂预算或残骸生机不足，无法唤起亡灵', events: [] };
      }
      tUnit.statusEffects.consumedCorpseHp = (tUnit.statusEffects.consumedCorpseHp ?? 0) + effectiveHpPool;
      const raised = spawnSummonedStack(state, unit.side, template, allocated.count, anchor, {
        isSummoned: true,
        summonKind: 'raised',
        initialCurrentHp: allocated.currentHp,
      });
      targetHex = anchor;
      summonedUnitIds.push(raised.id);
      affectedUnitIds.push(raised.id);
      const woundedSuffix =
        raised.currentHp < template.baseStats.maxHp
          ? `（首名残血 ${raised.currentHp}/${template.baseStats.maxHp} HP）`
          : '';
      noteText = `唤起 ${raised.name} ×${raised.count}!`;
      state.actionLog.push(
        `☠ ${unit.name} 施放「${spell.name}」，从 ${tUnit.name} 的残骸中唤起 ${raised.name} ×${raised.count}${woundedSuffix}（共 ${effectiveHpPool} HP）！`,
      );
    } else {
      // Animate Dead / Death Call：友军战损/阵亡直接按预算原地复生（不足整兵时复生残血单位）；敌军残骸则转化为正式死亡兵种（尸壳 / 怨灵）！
      if (tUnit.side === unit.side && !tUnit.abilities.magicImmune) {
        const tMaxHp = Math.max(1, computeUnitStats(tUnit, state, catalog).maxHp);
        const curTotal = tUnit.status === 'dead' ? 0 : (tUnit.count - 1) * tMaxHp + tUnit.currentHp;
        const maxRecoverableTotal = Math.max(
          curTotal,
          tUnit.maxCount * tMaxHp - (tUnit.statusEffects?.consumedCorpseHp ?? 0),
        );
        const recoverableMissing = Math.max(0, maxRecoverableTotal - curTotal);
        if (recoverableMissing <= 0) {
          return { ok: false, error: '该友军残骸已无可复生的剩余生命', events: [] };
        }
        const spWeight = eff === 'death_call' ? 2.4 : 1.5;
        const revBudget = Math.min(
          recoverableMissing,
          Math.max(1, Math.round(calcPower(spell.reviveBase ?? 55, spWeight))),
        );
        const wasDead = tUnit.status === 'dead';
        const res = reviveAndHealUnit(state, tUnit, revBudget, catalog, true);
        if (tUnit.kind === 'creature' && !tUnit.abilities.undead) {
          tUnit.abilities.undead = true;
        }
        // 从彻底阵亡残骸被死亡法术复生拉起时标记复生视觉色，但不改写 isSummoned 以保持原版驱逐规则
        if (wasDead) {
          tUnit.summonKind = 'raised';
        }
        reviveMap[tUnit.id] = res;
        if (res.healedHp > 0) healMap[tUnit.id] = res.healedHp;
        affectedUnitIds.push(tUnit.id);
        const woundedSuffix =
          tUnit.currentHp < tMaxHp ? `（领队残血 ${tUnit.currentHp}/${tMaxHp} HP）` : '';
        noteText = `复生 +${res.revivedCount} 兵!`;
        state.actionLog.push(
          `☠ ${unit.name} 施放「${spell.name}」，令 ${tUnit.name} 复生 ${res.revivedCount} 名战力${woundedSuffix}（恢复 ${res.healedHp} HP）！`,
        );
      } else {
        const template =
          eff === 'death_call' ? catalog.creatures.wraith_spirit : catalog.creatures.corpse_husk;
        if (!template) return { ok: false, error: '未找到死亡转化兵种模板', events: [] };
        const availableCorpseHp = getAvailableCorpseHp(state, tUnit, catalog);
        if (availableCorpseHp <= 0) {
          return { ok: false, error: '该敌军残骸的亡灵生机已被耗尽，无法继续转化', events: [] };
        }
        const anchor = findNearestOpenAnchor(state, tUnit.pos, template.footprint, Boolean(template.abilities.flying), 3);
        if (!anchor) return { ok: false, error: '残骸周围无空位可供招魂', events: [] };
        const budgetHp = eff === 'death_call' ? calcPower(62, 3.2) : calcPower(40, 2.2);
        const effectiveHpPool = Math.floor(Math.min(availableCorpseHp, budgetHp));
        const allocated = allocateHpPoolToStack(effectiveHpPool, template.baseStats.maxHp);
        if (allocated.count <= 0) {
          return { ok: false, error: '残骸生机或施法预算不足，无法转化亡灵', events: [] };
        }
        tUnit.statusEffects.consumedCorpseHp = (tUnit.statusEffects.consumedCorpseHp ?? 0) + effectiveHpPool;
        const raised = spawnSummonedStack(state, unit.side, template, allocated.count, anchor, {
          isSummoned: true,
          summonKind: 'raised',
          initialCurrentHp: allocated.currentHp,
        });
        targetHex = anchor;
        summonedUnitIds.push(raised.id);
        affectedUnitIds.push(raised.id);
        const woundedSuffix =
          raised.currentHp < template.baseStats.maxHp
            ? `（首名残血 ${raised.currentHp}/${template.baseStats.maxHp} HP）`
            : '';
        noteText = `死灵转化 ×${raised.count}!`;
        state.actionLog.push(
          `☠ ${unit.name} 施放「${spell.name}」，将 ${tUnit.name} 的亡骸转化为 ${raised.name} ×${raised.count}${woundedSuffix}（共 ${effectiveHpPool} HP）！`,
        );
      }
    }
  }
  // =========================================================================
  // 3. 两步点选：瞬息传送（unit_to_hex） / 殉道替伤 & 血祭复生（ally_to_ally）
  // =========================================================================
  else if (eff === 'teleport') {
    const tUnit = command.targetUnitId ? state.units[command.targetUnitId] : undefined;
    const dest = command.secondTargetHex ?? command.targetHex;
    if (!tUnit || tUnit.status !== 'alive' || tUnit.side !== unit.side) {
      return { ok: false, error: '请先选择一名己方存活单位作为传送目标', events: [] };
    }
    if (tUnit.abilities.magicImmune) {
      return { ok: false, error: '全魔法免疫目标无法被传送术指定', events: [] };
    }
    if (effectiveRange > 0 && deps.getUnitMinDistance(unit, tUnit) > effectiveRange) {
      return { ok: false, error: '传送目标超出施法距离', events: [] };
    }
    if (!dest || !canPlaceFootprintAt(state, dest, tUnit.footprint, tUnit.id, Boolean(tUnit.abilities.flying))) {
      return { ok: false, error: '目标落点不可通行或已被占据', events: [] };
    }
    tUnit.pos = { ...dest };
    targetHex = dest;
    affectedUnitIds.push(tUnit.id);
    displacedUnits.push({ unitId: tUnit.id, to: { ...dest } });
    noteText = '隙间瞬移!';
    state.actionLog.push(`✦ ${unit.name} 施放「${spell.name}」，撕开隙间将 ${tUnit.name} 瞬移至指定坐标！`);
  } else if (eff === 'martyr' || eff === 'sacrifice') {
    const first = command.targetUnitId ? state.units[command.targetUnitId] : undefined;
    const second = command.secondTargetUnitId ? state.units[command.secondTargetUnitId] : undefined;
    if (!first || first.status !== 'alive' || first.side !== unit.side) {
      return { ok: false, error: '请先选择第一位己方友军单位', events: [] };
    }
    if (!second || second.status !== 'alive' || second.side !== unit.side || second.id === first.id) {
      return { ok: false, error: '请选择另一位不同的己方友军单位', events: [] };
    }
    if (first.abilities.magicImmune || second.abilities.magicImmune) {
      return { ok: false, error: '全魔法免疫单位不受该法术影响', events: [] };
    }
    if (
      effectiveRange > 0 &&
      (deps.getUnitMinDistance(unit, first) > effectiveRange ||
        deps.getUnitMinDistance(unit, second) > effectiveRange)
    ) {
      return { ok: false, error: '目标友军超出施法距离', events: [] };
    }
    targetHex = second.pos;
    affectedUnitIds.push(first.id, second.id);
    if (eff === 'martyr') {
      second.statusEffects.martyrProtectedByUnitId = first.id;
      touchStatusFlag(second, 'martyrProtectedByUnitId');
      noteText = `${first.name} 替身承伤!`;
      state.actionLog.push(`✝ ${unit.name} 施放「替身雏偶」：${second.name} 所受的一切伤害将由 ${first.name} 代为承受！`);
    } else {
      if (first.kind === 'hero') {
        return { ok: false, error: '不可献祭英雄单位，请选择普通友军兵种', events: [] };
      }
      if (isImmuneToLivingHeal(second) && !isUndeadUnit(second)) {
        return { ok: false, error: '机械/元素/幻象单位无法接受彼岸献祭复生', events: [] };
      }
      const fStats = computeUnitStats(first, state, catalog);
      const sacrificedHp = (first.count - 1) * fStats.maxHp + first.currentHp;
      first.count = 0;
      first.currentHp = 0;
      first.status = 'dead';
      events.push({ type: 'UNIT_DIED', unitId: first.id });
      const res = reviveAndHealUnit(state, second, sacrificedHp * 1.25 * schoolMult, catalog, false);
      reviveMap[second.id] = res;
      if (res.healedHp > 0) healMap[second.id] = res.healedHp;
      noteText = `彼岸献祭 +${res.revivedCount}!`;
      state.actionLog.push(`☠ ${unit.name} 施放「彼岸献祭」，献祭 ${first.name}（${sacrificedHp} HP），令 ${second.name} 复生 ${res.revivedCount} 兵！`);
    }
  }
  // =========================================================================
  // 4. 幻象分身（Create Illusion / Phantom Image：HoMM4 实力强压门槛 + 残兵机制）
  // =========================================================================
  else if (eff === 'create_illusion' || eff === 'phantom_image') {
    const tUnitOrErr = requireSingleUnit(false);
    if (typeof tUnitOrErr === 'string') return { ok: false, error: tUnitOrErr, events: [] };
    const evalRes = evaluateIllusionSpell(
      spell,
      unit,
      tUnitOrErr,
      state,
      catalog,
      castHook.damageMultiplier,
    );
    if (!evalRes.ok) {
      return { ok: false, error: evalRes.reason, events: [] };
    }
    const cDef = catalog.creatures[tUnitOrErr.defId];
    if (!cDef) return { ok: false, error: '缺少兵种蓝图数据', events: [] };
    const anchor =
      findNearestOpenAnchor(state, tUnitOrErr.pos, cDef.footprint, Boolean(cDef.abilities.flying), 3) ??
      findNearestOpenAnchor(state, unit.pos, cDef.footprint, Boolean(cDef.abilities.flying), 3);
    if (!anchor) return { ok: false, error: '目标附近无空地可生成幻象', events: [] };
    const clone = spawnSummonedStack(state, unit.side, cDef, evalRes.count, anchor, {
      isSummoned: true,
      isIllusion: true,
      summonKind: 'illusion',
      initialCurrentHp: evalRes.currentHp,
      customName: `${tUnitOrErr.name}·幻象`,
    });
    targetHex = anchor;
    summonedUnitIds.push(clone.id);
    affectedUnitIds.push(clone.id);
    const woundedSuffix =
      clone.currentHp < cDef.baseStats.maxHp
        ? `（首名残血 ${clone.currentHp}/${cDef.baseStats.maxHp} HP）`
        : '';
    noteText = `幻象 ×${clone.count}!`;
    state.actionLog.push(
      `✦ ${unit.name} 施放「${spell.name}」，幻化出 ${clone.name} ×${clone.count}${woundedSuffix}（共 ${evalRes.illusionHpPool} HP）投入战阵！`,
    );
  }
  // =========================================================================
  // 5. 区域范围术式（Fireball / Inferno / Fire Ring / Cloud of Confusion / Quicksand）
  // =========================================================================
  else if (spell.targetType === 'hex_aoe') {
    const center = command.targetHex;
    if (!center || !state.tiles[hexKey(center)]) {
      return { ok: false, error: '请选择有效目标区域', events: [] };
    }
    if (effectiveRange > 0 && hexDistance(unit.pos, center) > effectiveRange) {
      return { ok: false, error: '目标区域超出射程', events: [] };
    }
    if (!spell.ignoreLos && !deps.checkSpellLineOfSight(state, unit, [center]).canCast) {
      return { ok: false, error: '视线被高耸障碍或单位阻挡，无法施法', events: [] };
    }
    targetHex = center;

    if (eff === 'quicksand') {
      const hexes = getHexRange(center, spell.aoeRadius ?? 1);
      let added = 0;
      for (const h of hexes) {
        const k = hexKey(h);
        const tile = state.tiles[k];
        if (!tile || tile.blocksGround) continue;
        if (!state.battleSpellFlags.quicksandHexKeys.includes(k)) {
          state.battleSpellFlags.quicksandHexKeys.push(k);
          added++;
        }
      }
      noteText = `泥沼区 (${added}格)!`;
      state.actionLog.push(`🏜 ${unit.name} 施放「泥沼陷地」，将目标区域化为吞噬脚步的流沙泥潭！`);
    } else {
      const radius = spell.aoeRadius ?? 1;
      const areaHexes = getHexRange(center, radius).filter((h) =>
        eff === 'fire_ring' ? hexDistance(center, h) === 1 : true,
      );
      const areaKeys = new Set(areaHexes.map(hexKey));

      for (const candidate of Object.values(state.units)) {
        if (candidate.status !== 'alive' || candidate.side === unit.side) continue;
        const hitAny = deps.getUnitOccupiedHexes(candidate).some((h) => areaKeys.has(hexKey(h)));
        if (!hitAny) continue;
        affectedUnitIds.push(candidate.id);
        if (candidate.abilities.magicImmune || candidate.statusEffects?.sanctuary) {
          damageMap[candidate.id] = { damage: 0, kills: 0, grazed: false };
          state.actionLog.push(`${candidate.name} 无视了「${spell.name}」！`);
          continue;
        }
        if (eff === 'cloud_of_confusion') {
          if (!isTargetBlockedByLiving(candidate) && !isTargetBlockedByMind(candidate)) {
            candidate.statusEffects.confusionRounds = Math.max(candidate.statusEffects.confusionRounds ?? 0, 1 + mindDurationBonus);
            touchStatusFlag(candidate, 'confusionRounds');
          }
          continue;
        }
        const raw = calcPower(spell.damageBase ?? 26, spell.level >= 4 ? 0.6 : 0.5);
        damageMap[candidate.id] = computeAndApplySpellDamage(
          state, unit, candidate, spell, raw, catalog, events, deps, 0.8,
        );
      }
      state.actionLog.push(
        eff === 'cloud_of_confusion'
          ? `☁ ${unit.name} 释放「浓雾迷心」，令范围内 ${affectedUnitIds.length} 支敌军神志迷乱！`
          : `🔥 ${unit.name} 轰出范围术式「${spell.name}」，波及 ${affectedUnitIds.length} 支敌军！`,
      );
    }
  }
  // =========================================================================
  // 6. 全场/自身即时术式
  // =========================================================================
  else if (spell.targetType === 'self') {
    targetHex = unit.pos;
    const allies = Object.values(state.units).filter((u) => u.status === 'alive' && u.side === unit.side);
    const enemies = Object.values(state.units).filter((u) => u.status === 'alive' && u.side !== unit.side);
    const allAlive = Object.values(state.units).filter((u) => u.status === 'alive');

    if (eff === 'rabbit_transform') {
      if (command.targetUnitId && command.targetUnitId !== unit.id) {
        return { ok: false, error: '「兔化」仅可对自己施放', events: [] };
      }
      if (unit.abilities.magicImmune) {
        return { ok: false, error: '全魔法免疫状态下无法施放「兔化」', events: [] };
      }
      // 持续 2 回合（含施法本回合共 3 回合）：位移距离 +50%、先手程度 +50%、擦弹率 +50%、获得先攻，并切换妖兔真身模型！
      const duration = 3;
      if (!unit.statusEffects.rabbitFormOriginalBlueprintId) {
        unit.statusEffects.rabbitFormOriginalBlueprintId = unit.voxelBlueprintId;
      }
      unit.voxelBlueprintId = 'creature_rabbit_transformed';
      unit.statusEffects.rabbitFormRounds = duration;
      if (!unit.abilities.firstStrike) {
        grantTempAbility(unit, 'firstStrike');
        unit.statusEffects.rabbitFormGrantedFirstStrike = true;
      }
      touchStatusFlag(unit, 'rabbitFormRounds');
      // 清除旧的同源兔化修饰器再重施，确保单次生效不叠乘
      unit.modifiers = unit.modifiers.filter((m) => m.spellId !== spell.id);
      const rabbitMods: Array<Omit<StatModifier, 'id' | 'remainingRounds'>> = [
        { stat: 'speed', mode: 'percent', value: 0.5, sourceName: '兔符·兔化', spellPolarity: 'positive', spellId: spell.id },
        { stat: 'initiative', mode: 'percent', value: 0.5, sourceName: '兔符·兔化', spellPolarity: 'positive', spellId: spell.id },
        { stat: 'grazeChance', mode: 'flat', value: 0.5, sourceName: '兔符·兔化', spellPolarity: 'positive', spellId: spell.id },
      ];
      rabbitMods.forEach((m, idx) => {
        pushSpellModifier(unit, {
          ...m,
          id: `spell:${spell.id}:${state.commandSeq}:${idx}`,
          remainingRounds: duration,
        });
      });
      affectedUnitIds.push(unit.id);
      noteText = '兔化真身!';
      state.actionLog.push(
        `🐇 ${unit.name} 发动「兔化」，化作月光白兔真身！获得先攻且位移距离、先手主动与擦弹率 +50%（持续 3 回合）！`,
      );
    } else if (eff === 'heavenly_shield') {
      const shield = Math.round(calcPower(spell.healBase ?? 48, 1.0));
      unit.statusEffects.tempShieldHp = (unit.statusEffects.tempShieldHp ?? 0) + shield;
      touchStatusFlag(unit, 'tempShieldHp');
      affectedUnitIds.push(unit.id);
      noteText = `二重结界 +${shield}!`;
      state.actionLog.push(`🛡 ${unit.name} 展开「二重结界」，获得 ${shield} 点临时护盾生命！`);
    } else if (eff === 'mana_flare') {
      state.battleSpellFlags.manaFlareActive = true;
      affectedUnitIds.push(unit.id);
      noteText = '灵脉沸腾 -2MP!';
      state.actionLog.push(`⚡ ${unit.name} 发动「灵脉沸腾」，全场敌我一切法术灵力消耗永久 -2！`);
    } else if (eff === 'necromancy_ward') {
      state.battleSpellFlags.necromancyWardActive = true;
      affectedUnitIds.push(unit.id);
      noteText = '净土封冥!';
      state.actionLog.push(`🌿 ${unit.name} 张开「净土封冥」，本场战斗禁止一切冥府招魂与反魂起尸术！`);
    } else if (eff === 'defender') {
      for (const a of allies) {
        if (a.abilities.magicImmune) continue;
        a.statusEffects.defenderBonus = true;
        touchStatusFlag(a, 'defenderBonus');
        affectedUnitIds.push(a.id);
      }
      noteText = '不动如山+50%!';
      state.actionLog.push(`🛡 ${unit.name} 施放「不动如山」，全队防御姿态护甲额外 +50%！`);
    } else if (eff === 'mass_bless') {
      for (const a of allies) {
        if (a.abilities.magicImmune) continue;
        a.statusEffects.bless = true;
        a.statusEffects.curse = false;
        touchStatusFlag(a, 'bless');
        affectedUnitIds.push(a.id);
      }
      noteText = '八百万神祝!';
      state.actionLog.push(`✨ ${unit.name} 施放「八百万神祝」，全队攻击恒定打出最大伤害！`);
    } else if (eff === 'mass_curse') {
      for (const e of enemies) {
        if (e.abilities.magicImmune || e.statusEffects?.sanctuary) continue;
        e.statusEffects.curse = true;
        e.statusEffects.bless = false;
        touchStatusFlag(e, 'curse');
        affectedUnitIds.push(e.id);
      }
      noteText = '百鬼厄祟!';
      state.actionLog.push(`☠ ${unit.name} 施放「百鬼厄祟」，全体非魔免敌军只能打出最小伤害！`);
    } else if (eff === 'ward_mass' && spell.wardSchool) {
      for (const a of allies) {
        if (a.abilities.magicImmune) continue;
        a.statusEffects.schoolWards = { ...(a.statusEffects.schoolWards ?? {}), [spell.wardSchool]: true };
        touchStatusFlag(a, 'schoolWards');
        affectedUnitIds.push(a.id);
      }
      noteText = `${spell.name}!`;
      state.actionLog.push(`🛡 ${unit.name} 展开「${spell.name}」，全队获得该系 50% 魔法与防卫抗性！`);
    } else if (eff === 'mass_exorcism') {
      let total = 0;
      for (const a of allies) {
        if (a.abilities.magicImmune) continue;
        total += cleanseNegativeEffects(a, true);
        affectedUnitIds.push(a.id);
      }
      noteText = `大祓净世 (${total})!`;
      state.actionLog.push(`✨ ${unit.name} 举行「大祓净世」，净化全队 ${total} 项负面诅咒与异常状态！`);
    } else if (eff === 'mass_cancellation') {
      let total = 0;
      for (const e of enemies) {
        if (e.abilities.magicImmune) continue;
        total += cleansePositiveEffects(e).length;
        affectedUnitIds.push(e.id);
      }
      noteText = `幽冥剥法!`;
      state.actionLog.push(`☠ ${unit.name} 施放「幽冥剥法」，剥除了敌军全部有益增益（${total} 项）！`);
    } else if (eff === 'mass_dispel') {
      for (const u of allAlive) {
        if (u.abilities.magicImmune) continue;
        cleansePositiveEffects(u);
        cleanseNegativeEffects(u, false); // H4 规则：驱散不解除中毒与瘟疫
        affectedUnitIds.push(u.id);
      }
      noteText = '万法归零!';
      state.actionLog.push(`✦ ${unit.name} 施放「万法归零」，涤荡了全场所有敌我法术状态！`);
    } else if (eff === 'steal_all_enchantments') {
      const eligibleAllies = allies.filter((a) => !a.abilities.magicImmune);
      let stolenCount = 0;
      for (const e of enemies) {
        if (e.abilities.magicImmune) continue;
        const stolen = cleansePositiveEffects(e);
        affectedUnitIds.push(e.id);
        for (const mod of stolen) {
          if (eligibleAllies.length === 0) break;
          const pick = eligibleAllies[Math.floor(nextRandom(state.rng) * eligibleAllies.length)];
          pushSpellModifier(pick, { ...mod, id: `stolen:${state.commandSeq}:${stolenCount}` });
          stolenCount++;
        }
      }
      noteText = `大盗窃法 ×${stolenCount}!`;
      state.actionLog.push(`✦ ${unit.name} 发动「大盗窃法」，共将 ${stolenCount} 项敌军增益夺归己用！`);
    } else if (eff === 'mass_blur') {
      for (const a of allies) {
        if (a.abilities.magicImmune) continue;
        a.statusEffects.blur = true;
        touchStatusFlag(a, 'blur');
        affectedUnitIds.push(a.id);
      }
      noteText = '万象蜃楼!';
      state.actionLog.push(`✦ ${unit.name} 展开「万象蜃楼」，全队远程减伤与擦弹率大幅提升！`);
    } else if (eff === 'mass_precision') {
      for (const a of allies) {
        if (a.abilities.magicImmune || !a.abilities.ranged || a.abilities.noRanged) continue;
        a.statusEffects.precisionRounds = 6;
        touchStatusFlag(a, 'precisionRounds');
        grantTempAbility(a, 'longRange');
        grantTempAbility(a, 'noObstaclePenalty');
        affectedUnitIds.push(a.id);
      }
      noteText = '百步星瞳!';
      state.actionLog.push(`✦ ${unit.name} 发动「百步星瞳」，全体有效远程友军远程攻击 +25% 且无视距离与普通障碍！`);
    } else if (eff === 'mass_bloodlust') {
      for (const a of allies) {
        if (a.abilities.magicImmune || a.abilities.noMelee) continue;
        a.statusEffects.bloodlustRounds = 6;
        touchStatusFlag(a, 'bloodlustRounds');
        affectedUnitIds.push(a.id);
      }
      noteText = '百鬼狂潮+25%!';
      state.actionLog.push(`🔥 ${unit.name} 发动「百鬼狂潮」，全体近战友军近战伤害 +25%！`);
    } else if (eff === 'mass_first_strike') {
      for (const a of allies) {
        if (a.abilities.magicImmune || a.abilities.noMelee) continue;
        grantTempAbility(a, 'firstStrike');
        affectedUnitIds.push(a.id);
      }
      noteText = `${spell.name}!`;
      state.actionLog.push(`⚡ ${unit.name} 施放「${spell.name}」，全体非魔免友军获得「先攻」特技！`);
    } else if (eff === 'mass_slayer') {
      for (const a of allies) {
        if (a.abilities.magicImmune) continue;
        a.statusEffects.slayer = true;
        touchStatusFlag(a, 'slayer');
        affectedUnitIds.push(a.id);
      }
      noteText = '众刃屠龙+50%!';
      state.actionLog.push(`🔥 ${unit.name} 施放「众刃屠龙」，全队对 4 阶巨兽伤害 +50%！`);
    } else if (eff === 'prayer') {
      for (const a of allies) {
        if (a.abilities.magicImmune || a.alignment !== 'life') continue;
        const oldMax = computeUnitStats(a, state, catalog).maxHp;
        const dur = 6 + lifeDurationBonus;
        pushSpellModifier(a, { id: `spell:prayer:hp:${state.commandSeq}:${a.id}`, stat: 'maxHp', mode: 'percent', value: 0.25, sourceName: '祈符·巫女祈祷', remainingRounds: dur, spellPolarity: 'positive' });
        pushSpellModifier(a, { id: `spell:prayer:d1:${state.commandSeq}:${a.id}`, stat: 'minDamage', mode: 'percent', value: 0.25, sourceName: '祈符·巫女祈祷', remainingRounds: dur, spellPolarity: 'positive' });
        pushSpellModifier(a, { id: `spell:prayer:d2:${state.commandSeq}:${a.id}`, stat: 'maxDamage', mode: 'percent', value: 0.25, sourceName: '祈符·巫女祈祷', remainingRounds: dur, spellPolarity: 'positive' });
        const newMax = computeUnitStats(a, state, catalog).maxHp;
        a.currentHp = Math.min(newMax, a.currentHp + Math.max(0, newMax - oldMax));
        affectedUnitIds.push(a.id);
      }
      noteText = '巫女祈祷+25%!';
      state.actionLog.push(`✝ ${unit.name} 献上「巫女祈祷」，己方全体生命系部队生命与伤害 +25%！`);
    } else if (eff === 'divine_intervention') {
      for (const a of allies) {
        if (a.abilities.magicImmune || isImmuneToLivingHeal(a)) continue;
        cleanseNegativeEffects(a, true);
        const aStats = computeUnitStats(a, state, catalog);
        const revPower = Math.max(calcPower(spell.reviveBase ?? 180, 2.0), aStats.maxHp * a.maxCount);
        const res = reviveAndHealUnit(state, a, revPower, catalog, false);
        a.currentHp = aStats.maxHp;
        reviveMap[a.id] = res;
        if (res.healedHp > 0) healMap[a.id] = res.healedHp;
        affectedUnitIds.push(a.id);
      }
      noteText = '八百万神降!';
      state.actionLog.push(`✨ ${unit.name} 发动终极神迹「八百万神降」，全军活体友军满血复生并彻底清祓一切厄祟！`);
    } else if (eff === 'holy_shout') {
      for (const e of enemies) {
        const isUnholy = isUndeadUnit(e) || e.alignment === 'death' || e.abilities.darkNature;
        const isChaos = e.alignment === 'chaos';
        if (!isUnholy && !isChaos) continue;
        affectedUnitIds.push(e.id);
        const mult = isUnholy ? 1.0 : 0.55;
        const raw = calcPower(spell.damageBase ?? 24, 0.5) * mult;
        damageMap[e.id] = computeAndApplySpellDamage(state, unit, e, spell, raw, catalog, events, deps, 0.5);
      }
      state.actionLog.push(`✝ ${unit.name} 发出「阴阳叱咤」，退魔灵光震慑全场 ${affectedUnitIds.length} 支异变敌军！`);
    } else if (eff === 'life_drain') {
      let totalDrained = 0;
      for (const e of enemies) {
        if (isImmuneToLivingEffects(e)) continue;
        affectedUnitIds.push(e.id);
        const raw = calcPower(spell.damageBase ?? 20, 0.45);
        const res = computeAndApplySpellDamage(state, unit, e, spell, raw, catalog, events, deps, 0.4);
        totalDrained += res.damage;
      }
      const selfHeal = Math.round(totalDrained * 0.5);
      if (selfHeal > 0 && !unit.abilities.magicImmune && (!isImmuneToLivingHeal(unit) || isUndeadUnit(unit))) {
        const before = unit.currentHp;
        unit.currentHp = Math.min(casterStats.maxHp, unit.currentHp + selfHeal);
        healMap[unit.id] = Math.max(0, unit.currentHp - before);
      }
      state.actionLog.push(`☠ ${unit.name} 施放「冥樱吸魂」，掠夺 ${totalDrained} 点生机并转化回复自身 ${healMap[unit.id] ?? 0} HP！`);
    } else if (eff === 'unholy_song') {
      for (const e of enemies) {
        if (e.abilities.magicImmune || e.alignment !== 'life') continue;
        pushSpellModifier(e, { id: `spell:unholy:d1:${state.commandSeq}:${e.id}`, stat: 'minDamage', mode: 'percent', value: -0.2, sourceName: '幽曲·反魂幽曲', remainingRounds: 5, spellPolarity: 'negative' });
        pushSpellModifier(e, { id: `spell:unholy:d2:${state.commandSeq}:${e.id}`, stat: 'maxDamage', mode: 'percent', value: -0.2, sourceName: '幽曲·反魂幽曲', remainingRounds: 5, spellPolarity: 'negative' });
        pushSpellModifier(e, { id: `spell:unholy:def:${state.commandSeq}:${e.id}`, stat: 'defense', mode: 'percent', value: -0.2, sourceName: '幽曲·反魂幽曲', remainingRounds: 5, spellPolarity: 'negative' });
        affectedUnitIds.push(e.id);
      }
      noteText = '反魂幽曲!';
      state.actionLog.push(`☠ ${unit.name} 奏响「反魂幽曲」，压制敌方全体生命系单位伤害与防御 -20%！`);
    } else if (eff === 'plague') {
      const tickDmg = Math.round(calcPower(spell.damageBase ?? 14, 0.4));
      for (const u of allAlive) {
        if (u.abilities.magicImmune || isImmuneToLivingEffects(u) || u.statusEffects?.sanctuary) continue;
        u.statusEffects.plaguePower = Math.max(u.statusEffects.plaguePower ?? 0, tickDmg);
        touchStatusFlag(u, 'plaguePower');
        affectedUnitIds.push(u.id);
        damageMap[u.id] = computeAndApplySpellDamage(state, unit, u, spell, tickDmg, catalog, events, deps, 0);
      }
      state.actionLog.push(`☣ ${unit.name} 散布禁术「黄泉瘴疫」，全场 ${affectedUnitIds.length} 支活体部队染疫流血！`);
    } else if (eff === 'sparks') {
      for (const e of enemies) {
        if (deps.getUnitMinDistance(unit, e) > 2) continue;
        affectedUnitIds.push(e.id);
        const raw = calcPower(spell.damageBase ?? 18, 0.45);
        damageMap[e.id] = computeAndApplySpellDamage(state, unit, e, spell, raw, catalog, events, deps, 0.5);
      }
      state.actionLog.push(`⚡ ${unit.name} 释放「星尘迸裂」，灼烧近身 ${affectedUnitIds.length} 支敌军！`);
    } else if (eff === 'armageddon') {
      for (const u of allAlive) {
        affectedUnitIds.push(u.id);
        const raw = calcPower(spell.damageBase ?? 52, 0.6);
        damageMap[u.id] = computeAndApplySpellDamage(state, unit, u, spell, raw, catalog, events, deps, 0.45);
      }
      state.actionLog.push(`☄ ${unit.name} 发动终极禁咒「星陨终末」！焚世陨星无差别席卷全战场 ${affectedUnitIds.length} 支单位！`);
    } else if (spell.massScope) {
      // 通用群体治疗 / 群体 Buff / 群体 Debuff（如 Celestial Armor / Mass Healing / Mass Slow / Mass Speed 等）
      const pool =
        spell.massScope === 'all_allies' ? allies : spell.massScope === 'all_enemies' ? enemies : allAlive;
      const isMoraleMassSpell = Boolean(
        spell.buffModifiers?.some((m) => m.stat === 'morale') ||
          spell.debuffModifiers?.some((m) => m.stat === 'morale'),
      );
      for (const t of pool) {
        if (t.abilities.magicImmune || t.statusEffects?.sanctuary) continue;
        if (isTargetBlockedByMind(t) || isTargetBlockedByLiving(t)) continue;
        if (spell.healBase && isImmuneToLivingHeal(t)) continue;
        if (isMoraleMassSpell && isImmuneToMorale(t)) continue;
        affectedUnitIds.push(t.id);
        if (spell.healBase) {
          const tStats = computeUnitStats(t, state, catalog);
          const amt = Math.round(calcPower(spell.healBase, 0.5));
          const before = t.currentHp;
          t.currentHp = Math.min(tStats.maxHp, t.currentHp + amt);
          healMap[t.id] = Math.max(0, t.currentHp - before);
          t.statusEffects.poisonPower = 0;
          t.statusEffects.plaguePower = 0;
        }
        if (spell.buffModifiers && spell.buffDuration) {
          spell.buffModifiers.forEach((m, idx) => {
            pushSpellModifier(t, {
              ...m,
              id: `spell:${spell.id}:${state.commandSeq}:${t.id}:${idx}`,
              remainingRounds: spell.buffDuration! + lifeDurationBonus,
              spellPolarity: m.spellPolarity ?? 'positive',
            });
          });
        }
        if (spell.debuffModifiers && spell.debuffDuration) {
          spell.debuffModifiers.forEach((m, idx) => {
            pushSpellModifier(t, {
              ...m,
              id: `spell:${spell.id}:${state.commandSeq}:${t.id}:${idx}`,
              remainingRounds: spell.debuffDuration!,
              spellPolarity: m.spellPolarity ?? 'negative',
            });
          });
        }
      }
      state.actionLog.push(`✦ ${unit.name} 施放群体术式「${spell.name}」，覆盖 ${affectedUnitIds.length} 支单位！`);
    }
  }
  // =========================================================================
  // 7. 单体单位术式（ally_unit / enemy_unit / any_unit）
  // =========================================================================
  else {
    const tUnitOrErr = requireSingleUnit(false);
    if (typeof tUnitOrErr === 'string') {
      return { ok: false, error: tUnitOrErr, events: [] };
    }
    const tUnit = tUnitOrErr;
    targetHex = tUnit.pos;
    affectedUnitIds.push(tUnit.id);
    const tStats = computeUnitStats(tUnit, state, catalog);

    // 混沌系「贤者折光 Magic Mirror」：敌方单体伤害法术以 50% 威力反弹给施法者！
    const triggerMagicMirror = (rawDmg: number) => {
      if (tUnit.side !== unit.side && tUnit.statusEffects?.magicMirror && !unit.abilities.magicImmune && rawDmg > 0) {
        const refl = computeAndApplySpellDamage(state, tUnit, unit, spell, rawDmg * 0.5, catalog, events, deps, 0);
        damageMap[unit.id] = refl;
        affectedUnitIds.push(unit.id);
        state.actionLog.push(`🪞 ${tUnit.name} 的「贤者折光」将「${spell.name}」半数威力反弹，重创 ${unit.name} ${refl.damage} 伤害！`);
      }
    };

    if (eff === 'bless') {
      tUnit.statusEffects.bless = true;
      tUnit.statusEffects.curse = false;
      touchStatusFlag(tUnit, 'bless');
      noteText = '神祝满伤!';
      state.actionLog.push(`✨ ${unit.name} 对 ${tUnit.name} 降下「神祝满盈」，每次攻击恒定最大伤害！`);
    } else if (eff === 'curse') {
      tUnit.statusEffects.curse = true;
      tUnit.statusEffects.bless = false;
      touchStatusFlag(tUnit, 'curse');
      noteText = '厄祟低伤!';
      state.actionLog.push(`☠ ${unit.name} 对 ${tUnit.name} 施加「厄祟缠身」，每次攻击只能打出最小伤害！`);
    } else if (eff === 'exorcism') {
      const n = cleanseNegativeEffects(tUnit, true);
      noteText = `御币清祓 (${n})!`;
      state.actionLog.push(`✨ ${unit.name} 对 ${tUnit.name} 施放「御币清祓」，净化了 ${n} 项负面状态！`);
    } else if (eff === 'cancellation') {
      const n = cleansePositiveEffects(tUnit).length;
      noteText = `蚀灵消咒 (${n})!`;
      state.actionLog.push(`☠ ${unit.name} 对 ${tUnit.name} 施放「蚀灵消咒」，剥除了 ${n} 项有益增益！`);
    } else if (eff === 'dispel') {
      cleansePositiveEffects(tUnit);
      cleanseNegativeEffects(tUnit, false);
      noteText = '星律解咒!';
      state.actionLog.push(`✦ ${unit.name} 对 ${tUnit.name} 施放「星律解咒」，清除了全部正负法术状态！`);
    } else if (eff === 'steal_enchantment') {
      const stolen = cleansePositiveEffects(tUnit);
      const allies = Object.values(state.units).filter((a) => a.status === 'alive' && a.side === unit.side && !a.abilities.magicImmune);
      if (stolen.length > 0 && allies.length > 0) {
        const pick = allies[Math.floor(nextRandom(state.rng) * allies.length)];
        pushSpellModifier(pick, { ...stolen[0], id: `stolen:${state.commandSeq}` });
        affectedUnitIds.push(pick.id);
        noteText = `窃法魔手!`;
        state.actionLog.push(`✦ ${unit.name} 发动「窃法魔手」，顺手将 ${tUnit.name} 的增益转移至 ${pick.name} 身上！`);
      } else {
        noteText = '无可窃取增益';
        state.actionLog.push(`${unit.name} 对 ${tUnit.name} 施放「窃法魔手」，目标暂无可转移的增益修饰。`);
      }
    } else if (eff === 'ward_single' && spell.wardSchool) {
      tUnit.statusEffects.schoolWards = { ...(tUnit.statusEffects.schoolWards ?? {}), [spell.wardSchool]: true };
      touchStatusFlag(tUnit, 'schoolWards');
      noteText = `${spell.name}!`;
      state.actionLog.push(`🛡 ${unit.name} 为 ${tUnit.name} 展开「${spell.name}」（50% 对应系魔抗与防卫）！`);
    } else if (eff === 'retribution') {
      tUnit.statusEffects.retribution = true;
      touchStatusFlag(tUnit, 'retribution');
      noteText = '因果报应35%!';
      state.actionLog.push(`✝ ${unit.name} 为 ${tUnit.name} 施加「因果报应」，近战来犯者将受 35% 反弹伤害！`);
    } else if (eff === 'pain_mirror') {
      tUnit.statusEffects.painMirror = true;
      touchStatusFlag(tUnit, 'painMirror');
      noteText = '因果水镜50%!';
      state.actionLog.push(`🪞 ${unit.name} 为 ${tUnit.name} 立起「因果水镜」，所受一切攻击伤害 50% 反弹攻击者！`);
    } else if (eff === 'magic_mirror') {
      tUnit.statusEffects.magicMirror = true;
      touchStatusFlag(tUnit, 'magicMirror');
      noteText = '贤者折光50%!';
      state.actionLog.push(`🪞 ${unit.name} 为 ${tUnit.name} 展开「贤者折光」，将反射敌方单体攻击法术！`);
    } else if (eff === 'song_of_peace') {
      tUnit.statusEffects.songOfPeaceRounds = 2 + mindDurationBonus;
      touchStatusFlag(tUnit, 'songOfPeaceRounds');
      noteText = '镇魂神乐!';
      state.actionLog.push(`🎵 ${unit.name} 对 ${tUnit.name} 奏响「镇魂神乐」，${2 + mindDurationBonus} 回合内无法攻击或施法！`);
    } else if (eff === 'regeneration') {
      const reg = Math.round(calcPower(spell.healBase ?? 20, 0.5));
      tUnit.statusEffects.regenPerRound = reg;
      touchStatusFlag(tUnit, 'regenPerRound');
      noteText = `生生不息 +${reg}/回!`;
      state.actionLog.push(`💚 ${unit.name} 为 ${tUnit.name} 施放「生生不息」，每回合自动恢复 ${reg} HP！`);
    } else if (eff === 'guardian_angel') {
      const lives = Math.max(2, Math.floor(1 + getCasterSchoolRank(unit, 'life') * 0.6 + (unit.subSkills?.resurrection_skill ?? 0) * 0.35));
      tUnit.statusEffects.guardianAngelLives = lives;
      touchStatusFlag(tUnit, 'guardianAngelLives');
      noteText = `御神护命×${lives}!`;
      state.actionLog.push(`👼 ${unit.name} 为 ${tUnit.name} 降下「御神护命」，赋予 ${lives} 次免死复生护命！`);
    } else if (eff === 'sanctuary') {
      for (const a of Object.values(state.units)) {
        if (a.side === unit.side) a.statusEffects.sanctuary = false;
      }
      tUnit.statusEffects.sanctuary = true;
      touchStatusFlag(tUnit, 'sanctuary');
      noteText = '常世净域!';
      state.actionLog.push(`✨ ${unit.name} 为 ${tUnit.name} 张开「常世净域」，行动前绝对免受攻击与法术！`);
    } else if (eff === 'blur') {
      tUnit.statusEffects.blur = true;
      touchStatusFlag(tUnit, 'blur');
      noteText = '蜃气残影!';
      state.actionLog.push(`✦ ${unit.name} 为 ${tUnit.name} 施加「蜃气残影」，远程减伤与高额擦弹生效！`);
    } else if (eff === 'precision') {
      tUnit.statusEffects.precisionRounds = 6;
      touchStatusFlag(tUnit, 'precisionRounds');
      grantTempAbility(tUnit, 'longRange');
      grantTempAbility(tUnit, 'noObstaclePenalty');
      noteText = '天眼狙定!';
      state.actionLog.push(`🎯 ${unit.name} 为 ${tUnit.name} 开启「天眼狙定」，远程攻击 +25% 且无视距离与普通障碍衰减！`);
    } else if (eff === 'bloodlust') {
      tUnit.statusEffects.bloodlustRounds = 6;
      touchStatusFlag(tUnit, 'bloodlustRounds');
      noteText = '鬼神狂战+25%!';
      state.actionLog.push(`🔥 ${unit.name} 为 ${tUnit.name} 施加「鬼神狂战」，持续 6 回合近战伤害 +25%！`);
    } else if (eff === 'displacement') {
      const awayRay = hexRay(unit.pos, tUnit.pos, deps.getUnitMinDistance(unit, tUnit) + 3, (c) => Boolean(state.tiles[hexKey(c)]));
      const tIdx = awayRay.findIndex((h) => hexEquals(h, tUnit.pos));
      let destPos = tUnit.pos;
      if (tIdx >= 0) {
        for (let step = 1; step <= 2; step++) {
          const cand = awayRay[tIdx + step];
          if (cand && canPlaceFootprintAt(state, cand, tUnit.footprint, tUnit.id, Boolean(tUnit.abilities.flying))) {
            destPos = cand;
          } else {
            break;
          }
        }
      }
      tUnit.pos = { ...destPos };
      targetHex = destPos;
      displacedUnits.push({ unitId: tUnit.id, to: { ...destPos } });
      noteText = '隙间斥退!';
      state.actionLog.push(`🌀 ${unit.name} 发动「隙间斥退」，将 ${tUnit.name} 强行震退！`);
    } else if (eff === 'cowardice') {
      tUnit.statusEffects.cowardiceRounds = 3 + mindDurationBonus;
      touchStatusFlag(tUnit, 'cowardiceRounds');
      noteText = `畏惧之瞳 ${3 + mindDurationBonus}回!`;
      state.actionLog.push(`😨 ${unit.name} 对 ${tUnit.name} 投下「畏惧之瞳」，${3 + mindDurationBonus} 回合内不敢攻击强敌！`);
    } else if (eff === 'flight') {
      grantTempAbility(tUnit, 'flying');
      noteText = '御空浮游!';
      state.actionLog.push(`🕊 ${unit.name} 为 ${tUnit.name} 施加「御空浮游」，无视障碍地形自由翱翔！`);
    } else if (eff === 'power_drain') {
      tUnit.statusEffects.powerDrain = true;
      touchStatusFlag(tUnit, 'powerDrain');
      noteText = '灵脉枯竭!';
      state.actionLog.push(`⚡ ${unit.name} 对 ${tUnit.name} 施放「灵脉枯竭」，其一切施法消耗翻倍！`);
    } else if (eff === 'magic_leech') {
      tUnit.statusEffects.magicLeechCasterId = unit.id;
      touchStatusFlag(tUnit, 'powerDrain');
      noteText = '噬灵魔蛭!';
      state.actionLog.push(`☠ ${unit.name} 对 ${tUnit.name} 寄生「噬灵魔蛭」，其施法消耗翻倍并虹吸蓝量给己方！`);
    } else if (eff === 'spell_shackle') {
      tUnit.statusEffects.spellShacklePower = Math.max(1, Math.round(calcPower(spell.damageBase ?? 8, 0.3)));
      touchStatusFlag(tUnit, 'spellShacklePower');
      noteText = '咒缚反噬!';
      state.actionLog.push(`⛓ ${unit.name} 对 ${tUnit.name} 结下「咒缚反噬」，施法即遭灵力灼伤！`);
    } else if (eff === 'forgetfulness') {
      grantTempAbility(tUnit, 'noRanged');
      noteText = '忘却弹幕!';
      state.actionLog.push(`🚫 ${unit.name} 对 ${tUnit.name} 施放「忘却弹幕」，本战封印其远程射击！`);
    } else if (eff === 'berserk') {
      tUnit.statusEffects.berserkRounds = 2 + mindDurationBonus;
      touchStatusFlag(tUnit, 'berserkRounds');
      noteText = '月狂赤瞳!';
      state.actionLog.push(`💢 ${unit.name} 对 ${tUnit.name} 发动「月狂赤瞳」，使其不分敌我猛攻最近单位！`);
    } else if (eff === 'blind') {
      tUnit.statusEffects.blindRounds = 3 + mindDurationBonus;
      touchStatusFlag(tUnit, 'blindRounds');
      noteText = `宵暗蔽目 ${3 + mindDurationBonus}回!`;
      state.actionLog.push(`👁 ${unit.name} 对 ${tUnit.name} 施放「宵暗蔽目」，${3 + mindDurationBonus} 回合无法行动（受伤即醒）！`);
    } else if (eff === 'confusion') {
      tUnit.statusEffects.confusionRounds = 1 + mindDurationBonus;
      touchStatusFlag(tUnit, 'confusionRounds');
      noteText = '迷乱魔雾!';
      state.actionLog.push(`😵 ${unit.name} 对 ${tUnit.name} 释放「迷乱魔雾」，令其丧失下一次行动！`);
    } else if (eff === 'wasp_swarm') {
      const raw = calcPower(spell.damageBase ?? 14, 0.4);
      damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0.5);
      tUnit.statusEffects.confusionRounds = 1;
      touchStatusFlag(tUnit, 'confusionRounds');
      noteText = '妖虫乱舞!';
      state.actionLog.push(`🐝 ${unit.name} 驱使「妖虫乱舞」，袭伤 ${tUnit.name} 并使其失去下次行动！`);
    } else if (eff === 'hypnotize') {
      if (!tUnit.statusEffects.hypnotizedOriginalSide) {
        tUnit.statusEffects.hypnotizedOriginalSide = tUnit.side;
      }
      tUnit.side = unit.side;
      tUnit.facing = unit.side === 'left' ? 'right' : 'left';
      tUnit.statusEffects.hypnotizedRounds = 3 + mindDurationBonus;
      touchStatusFlag(tUnit, 'hypnotizedRounds');
      noteText = '迷梦傀儡!';
      state.actionLog.push(`🌀 ${unit.name} 发动「迷梦傀儡」，彻底魅惑 ${tUnit.name} 倒戈 ${3 + mindDurationBonus} 回合！`);
    } else if (eff === 'aura_of_fear') {
      tUnit.statusEffects.auraOfFear = true;
      touchStatusFlag(tUnit, 'auraOfFear');
      noteText = '幽冥威慑!';
      state.actionLog.push(`☠ ${unit.name} 为 ${tUnit.name} 施加「幽冥威慑」，进攻非免疫敌军时压制其反击！`);
    } else if (eff === 'vampiric_touch') {
      tUnit.statusEffects.vampiricTouch = true;
      touchStatusFlag(tUnit, 'vampiricTouch');
      noteText = '绯红吸血50%!';
      state.actionLog.push(`🩸 ${unit.name} 为 ${tUnit.name} 施加「绯红吸血」，近战伤害 50% 转化为吸血复苏！`);
    } else if (eff === 'fire_aura') {
      tUnit.statusEffects.fireAura = true;
      touchStatusFlag(tUnit, 'fireAura');
      noteText = '不死炎缠+25%!';
      state.actionLog.push(`🔥 ${unit.name} 为 ${tUnit.name} 施加「不死炎缠」，近战额外附带 +25% 火焰灼烧！`);
    } else if (eff === 'slayer') {
      tUnit.statusEffects.slayer = true;
      touchStatusFlag(tUnit, 'slayer');
      noteText = '屠龙魔刃+50%!';
      state.actionLog.push(`⚔ ${unit.name} 为 ${tUnit.name} 赋予「屠龙魔刃」，对 4 阶巨兽伤害 +50%！`);
    } else if (eff === 'first_strike') {
      grantTempAbility(tUnit, 'firstStrike');
      noteText = `${spell.name}!`;
      state.actionLog.push(`⚡ ${unit.name} 为 ${tUnit.name} 施加「${spell.name}」，获得先攻特技！`);
    } else if (eff === 'cat_reflexes') {
      grantTempAbility(tUnit, 'doubleStrike');
      noteText = '火猫连击!';
      state.actionLog.push(`🐱 ${unit.name} 为 ${tUnit.name} 施加「火猫连击」，获得双重攻击连打！`);
    } else if (eff === 'terrain_walk') {
      tUnit.statusEffects.terrainWalk = true;
      touchStatusFlag(tUnit, 'terrainWalk');
      noteText = '山林履平!';
      state.actionLog.push(`🌿 ${unit.name} 为 ${tUnit.name} 施加「山林履平」，无视竹林与泥沼减速！`);
    } else if (eff === 'anti_magic') {
      tUnit.statusEffects.antiMagic = true;
      touchStatusFlag(tUnit, 'antiMagic');
      grantTempAbility(tUnit, 'magicImmune');
      noteText = '无魔绝域!';
      state.actionLog.push(`🛡 ${unit.name} 为 ${tUnit.name} 张开「无魔绝域」，进入全魔法免疫状态！`);
    } else if (eff === 'giant_strength' || eff === 'dragon_strength') {
      const pct = eff === 'dragon_strength' ? 1.0 : 0.25;
      const oldMax = tStats.maxHp;
      pushSpellModifier(tUnit, { id: `spell:${spell.id}:hp:${state.commandSeq}`, stat: 'maxHp', mode: 'percent', value: pct, sourceName: `${spell.spellCardPrefix ?? '术式'}·${spell.name}`, remainingRounds: 6, spellPolarity: 'positive' });
      pushSpellModifier(tUnit, { id: `spell:${spell.id}:d1:${state.commandSeq}`, stat: 'minDamage', mode: 'percent', value: pct, sourceName: `${spell.spellCardPrefix ?? '术式'}·${spell.name}`, remainingRounds: 6, spellPolarity: 'positive' });
      pushSpellModifier(tUnit, { id: `spell:${spell.id}:d2:${state.commandSeq}`, stat: 'maxDamage', mode: 'percent', value: pct, sourceName: `${spell.spellCardPrefix ?? '术式'}·${spell.name}`, remainingRounds: 6, spellPolarity: 'positive' });
      const newMax = computeUnitStats(tUnit, state, catalog).maxHp;
      tUnit.currentHp = Math.min(newMax, tUnit.currentHp + Math.max(0, newMax - oldMax));
      noteText = eff === 'dragon_strength' ? '古龙神力+100%!' : '鬼王巨力+25%!';
      state.actionLog.push(`🐉 ${unit.name} 为 ${tUnit.name} 施加「${spell.name}」，生命与伤害暴涨 +${Math.round(pct * 100)}%！`);
    } else if (eff === 'poison') {
      const pDmg = Math.max(1, Math.round(calcPower(spell.damageBase ?? 15, 0.4)));
      tUnit.statusEffects.poisonPower = Math.max(tUnit.statusEffects.poisonPower ?? 0, pDmg);
      touchStatusFlag(tUnit, 'poisonPower');
      damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, pDmg, catalog, events, deps, 0);
      noteText = `铃兰毒 ${pDmg}/回!`;
      state.actionLog.push(`☠ ${unit.name} 对 ${tUnit.name} 施放「铃兰剧毒」，每回合持续毒伤 ${pDmg}！`);
    } else if (eff === 'banish') {
      const mult = tUnit.isSummoned || tUnit.isIllusion ? 3.2 : 0.35;
      const raw = calcPower(spell.damageBase ?? 75, 0.9) * mult;
      damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0.2);
      state.actionLog.push(`✦ ${unit.name} 对 ${tUnit.name} 施放「放逐虚境」，造成 ${damageMap[tUnit.id].damage} 点放逐打击！`);
    } else if (eff === 'holy_word') {
      const mult = isUndeadUnit(tUnit) || tUnit.alignment === 'death' || tUnit.abilities.darkNature ? 1.25 : tUnit.alignment === 'chaos' ? 0.85 : 0.5;
      const raw = calcPower(spell.damageBase ?? 24, 0.5) * mult;
      damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0.5);
      triggerMagicMirror(raw);
      state.actionLog.push(`✝ ${unit.name} 念诵「破邪真言」，对 ${tUnit.name} 降下 ${damageMap[tUnit.id].damage} 点退魔惩戒！`);
    } else if (eff === 'hand_of_death') {
      if (isImmuneToLivingEffects(tUnit)) {
        return { ok: false, error: '机械/不死/元素/幻象单位免疫「冥府勾魂」', events: [] };
      }
      const raw = calcPower(spell.damageBase ?? 76, 1.0);
      if (tUnit.kind === 'creature' && !tUnit.abilities.magicImmune) {
        // 对齐英雄与兵种抗性结算：纳入暗系易伤、抗死结界、死亡守护与魔抗！
        let effectivePower = raw;
        if (isDarkMagicVulnerable(tUnit)) effectivePower *= DARK_MAGIC_VULNERABILITY_MULT;
        if (tUnit.abilities.deathWard) effectivePower *= 0.5;
        if (tUnit.statusEffects?.schoolWards?.death) effectivePower *= 0.5;
        effectivePower *= Math.max(0, 1 - tStats.magicResistance);
        const directKills = Math.max(1, Math.min(tUnit.count, Math.floor(effectivePower / Math.max(12, tStats.maxHp))));
        const actual = deps.applyBonusKills(state, tUnit, directKills, events);
        damageMap[tUnit.id] = { damage: actual * tStats.maxHp, kills: actual, grazed: false };
        deps.handlePostKillRewards(state, unit, tUnit, actual);
        state.actionLog.push(`💀 ${unit.name} 施放「冥府勾魂」，直接夺命抹杀 ${tUnit.name} ${actual} 名兵力！`);
      } else {
        damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0);
        state.actionLog.push(`💀 ${unit.name} 施放「冥府勾魂」，重创 ${tUnit.name} ${damageMap[tUnit.id].damage} 伤害！`);
      }
      triggerMagicMirror(raw);
    } else if (eff === 'disintegrate') {
      const raw = calcPower(spell.damageBase ?? 85, 1.0);
      damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0.35);
      if (damageMap[tUnit.id].kills > 0 || tUnit.status === 'dead') {
        tUnit.statusEffects.disintegrated = true;
      }
      triggerMagicMirror(raw);
      state.actionLog.push(`💥 ${unit.name} 轰出「星穹湮灭」，对 ${tUnit.name} 造成 ${damageMap[tUnit.id].damage} 点湮灭伤害！`);
    } else if (eff === 'chain_lightning') {
      const baseRaw = calcPower(spell.damageBase ?? 68, 0.8);
      const hitSet = new Set<string>([tUnit.id]);
      damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, baseRaw, catalog, events, deps, 0.45);
      triggerMagicMirror(baseRaw);

      let curr = tUnit;
      let currRaw = baseRaw * 0.5;
      for (let bounce = 0; bounce < 4; bounce++) {
        const nextCand = Object.values(state.units)
          .filter((u) => u.status === 'alive' && !hitSet.has(u.id) && !u.abilities.magicImmune && !u.statusEffects?.sanctuary)
          .sort((a, b) => {
            const da = deps.getUnitMinDistance(curr, a);
            const db = deps.getUnitMinDistance(curr, b);
            if (da !== db) return da - db;
            // 同距离优先弹射敌军
            return (a.side !== unit.side ? 0 : 1) - (b.side !== unit.side ? 0 : 1);
          })[0];
        if (!nextCand || deps.getUnitMinDistance(curr, nextCand) > 6) break;
        hitSet.add(nextCand.id);
        affectedUnitIds.push(nextCand.id);
        damageMap[nextCand.id] = computeAndApplySpellDamage(state, unit, nextCand, spell, currRaw, catalog, events, deps, 0.35);
        curr = nextCand;
        currRaw *= 0.5;
      }
      state.actionLog.push(`⚡ ${unit.name} 轰出「五雷连锁」，高压紫雷连续贯穿 ${hitSet.size} 支目标！`);
    } else {
      // 标准单体治疗 / 苏生 / Buff / Debuff / 伤害
      if (spell.reviveBase) {
        const revPower = calcPower(spell.reviveBase, 1.2);
        const res = reviveAndHealUnit(state, tUnit, revPower, catalog, false);
        reviveMap[tUnit.id] = res;
        if (res.healedHp > 0) healMap[tUnit.id] = res.healedHp;
        state.actionLog.push(
          res.revivedCount > 0
            ? `✨ ${unit.name} 施放「${spell.name}」，令 ${tUnit.name} 苏生 ${res.revivedCount} 名兵力（共恢复 ${res.healedHp} HP）！`
            : `${unit.name} 施放「${spell.name}」，为 ${tUnit.name} 回复 ${res.healedHp} 生命。`,
        );
      } else if (spell.healBase) {
        const healAmount = Math.max(1, Math.round(calcPower(spell.healBase, 0.6)));
        const before = tUnit.currentHp;
        tUnit.currentHp = Math.min(tStats.maxHp, tUnit.currentHp + healAmount);
        healMap[tUnit.id] = Math.max(0, tUnit.currentHp - before);
        if (spell.id === 'life_heal') {
          tUnit.statusEffects.poisonPower = 0;
          tUnit.statusEffects.plaguePower = 0;
        }
        state.actionLog.push(`${unit.name} 施放「${spell.name}」，为 ${tUnit.name} 回复 ${healMap[tUnit.id]} 生命。`);
      }

      if (spell.buffModifiers && spell.buffDuration) {
        spell.buffModifiers.forEach((m, idx) => {
          pushSpellModifier(tUnit, {
            ...m,
            id: `spell:${spell.id}:${state.commandSeq}:${idx}`,
            remainingRounds: spell.buffDuration! + lifeDurationBonus,
            spellPolarity: m.spellPolarity ?? 'positive',
          });
        });
        state.actionLog.push(`${unit.name} 为 ${tUnit.name} 施加了「${spell.name}」。`);
      }

      if (spell.debuffModifiers && spell.debuffDuration) {
        if (isTargetBlockedByLiving(tUnit) || isTargetBlockedByMind(tUnit)) {
          state.actionLog.push(`${tUnit.name} 免疫了「${spell.name}」！`);
        } else {
          spell.debuffModifiers.forEach((m, idx) => {
            pushSpellModifier(tUnit, {
              ...m,
              id: `spell:${spell.id}:${state.commandSeq}:${idx}`,
              remainingRounds: spell.debuffDuration!,
              spellPolarity: m.spellPolarity ?? 'negative',
            });
          });
          state.actionLog.push(`${unit.name} 对 ${tUnit.name} 施加了「${spell.name}」。`);
        }
      }

      if (spell.damageBase) {
        const spWeight = spell.level >= 4 ? 0.8 : spell.level === 3 ? 0.6 : 0.5;
        const raw = calcPower(spell.damageBase, spWeight);
        damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0.7);
        triggerMagicMirror(raw);
        const lossText = tUnit.kind === 'creature' ? `（折损 ${damageMap[tUnit.id].kills} 兵）` : '';
        state.actionLog.push(
          `${unit.name} 施放「${spell.name}」，对 ${tUnit.name} 造成 ${damageMap[tUnit.id].damage} 伤害${lossText}${damageMap[tUnit.id].grazed ? '(擦弹!)' : ''}！`,
        );
      }
    }
  }

  // 统一执行单单位最多 20 个 Buff/Debuff 的 FIFO 自动顶替校验
  for (const modTarget of statusModifiedTargets) {
    const evicted = enforceUnitStatusSlotCap(modTarget);
    if (evicted.length > 0) {
      state.actionLog.push(`ℹ ${modTarget.name} 状态栏已满（20/20），自动顶替最早状态：${evicted.join('、')}。`);
    }
  }

  // 若法术或驱散改变了任何单位的有效士气，立即重检本回合士气态并刷新剩余行动梯队
  const moraleChangedIds: string[] = [];
  for (const [uid, prevMorale] of preMoraleByUnitId.entries()) {
    const u = state.units[uid];
    if (!u || u.status !== 'alive') continue;
    const nextMorale = computeUnitStats(u, state, catalog).morale;
    if (nextMorale !== prevMorale) {
      moraleChangedIds.push(uid);
    }
  }
  if (moraleChangedIds.length > 0) {
    deps.syncMidRoundMorale(state, moraleChangedIds, catalog, events);
  }

  // 结算灵力扣除、魔力虹吸与法术枷锁反伤！
  unit.mana = Math.max(0, (unit.mana ?? 0) - effectiveCost);
  if (unit.kind === 'hero') {
    unit.spellCardCharge = Math.min(100, (unit.spellCardCharge ?? 0) + 16);
  }
  if (unit.statusEffects?.magicLeechCasterId) {
    const leecher = state.units[unit.statusEffects.magicLeechCasterId];
    if (leecher && leecher.status === 'alive') {
      const lStats = computeUnitStats(leecher, state, catalog);
      leecher.mana = Math.min(lStats.maxMana, (leecher.mana ?? 0) + effectiveCost);
      state.actionLog.push(`☠ 「噬灵魔蛭」从 ${unit.name} 处为 ${leecher.name} 吸取了 ${effectiveCost} 点灵力！`);
    }
  }
  if (unit.statusEffects?.spellShacklePower && unit.statusEffects.spellShacklePower > 0 && unit.status === 'alive') {
    const shackleDmg = Math.max(1, Math.round(unit.statusEffects.spellShacklePower * Math.max(1, effectiveCost / 3)));
    deps.applyDamageToUnit(state, unit, shackleDmg, catalog, events);
    damageMap[unit.id] = { damage: shackleDmg, kills: 0, grazed: false };
    state.actionLog.push(`⛓ 「咒缚反噬」灼伤施法者 ${unit.name}，造成 ${shackleDmg} 点法力反噬！`);
  }

  events.push({
    type: 'SPELL_CAST',
    casterId: unit.id,
    spellId: spell.id,
    spellName: spell.name,
    vfxKey: spell.vfxKey,
    targetHex,
    affectedUnitIds,
    damageMap: Object.keys(damageMap).length > 0 ? damageMap : undefined,
    healMap: Object.keys(healMap).length > 0 ? healMap : undefined,
    reviveMap: Object.keys(reviveMap).length > 0 ? reviveMap : undefined,
    summonedUnitIds: summonedUnitIds.length > 0 ? summonedUnitIds : undefined,
    displacedUnits: displacedUnits.length > 0 ? displacedUnits : undefined,
    noteText,
  });

  deps.consumeActiveUnitTurn(state, unit);
  deps.advanceTurn(state, catalog, events);
  return { ok: true, events };
}

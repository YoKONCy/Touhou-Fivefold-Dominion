/**
 * 法术通用计算、目标合法性校验、残骸与幻象评估、驱散与召唤生成辅助模块
 */

import type { Alignment } from '../alignment';
import type { CombatContentCatalog } from '../combatEngine';
import {
  DARK_MAGIC_VULNERABILITY_MULT,
  isDarkMagicVulnerable,
  isElementalUnit,
  isIllusionUnit,
  isImmuneToLivingEffects,
  isImmuneToLivingHeal,
  isImmuneToMindSpells,
  isImmuneToMorale,
  isMechanicalUnit,
  isMindSpellDef,
  isSpecialNonLivingUnit,
  isUndeadUnit,
} from '../creatureTypes';
import {
  computeHeroSpellEffectivenessMultiplier,
  H4_ADVANCED_CLASSES,
  resolveActiveHeroClass,
} from '../h4Skills';
import {
  getFootprintHexes,
  getHexRange,
  hexDistance,
  hexKey,
  type FootprintSize,
  type HexCoord,
} from '../hex';
import { computeUnitStats, getUnitEffectiveMagicResistance } from '../modifiers';
import { nextRandom } from '../rng';
import type {
  AdvancedClassDef,
  BattleState,
  BattleUnit,
  CombatEvent,
  CreatureDefinition,
  PrimarySkillId,
  SideId,
  SpellDef,
  StatModifier,
} from '../types';
import type { SpellExecutionDeps } from './context';

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
 * - 洞察预言贤者（Seer = 侦查+秩序）施法距离额外 +2 格
 * - 站在高地/站台（highland / tower）上的单位，所有有射程术式施法距离 +50%
 */
export function getEffectiveSpellRange(
  state: BattleState,
  caster: BattleUnit,
  spell: SpellDef,
): number {
  if (spell.range <= 0) return spell.range;
  const casterCls =
    caster.kind === 'hero'
      ? resolveActiveHeroClass(
          caster.skills,
          caster.subSkills,
          H4_ADVANCED_CLASSES,
          caster.selectedAdvancedClassId,
        )
      : null;
  const baseRange = spell.range + (casterCls?.passive?.spellRangeDelta ?? 0);
  if (isUnitOnHighlandPlatform(state, caster)) {
    return Math.round(baseRange * 1.5);
  }
  return baseRange;
}

/**
 * 判定目标是否凭借 100% 魔法抗性完全抵挡敌方施放的法术（区分于魔龙全魔免：仍允许友方治愈与增益！）
 */
export function isTargetResistingHostileSpell(
  state: BattleState,
  caster: BattleUnit,
  target: BattleUnit,
  catalog: CombatContentCatalog,
): boolean {
  if (target.side === caster.side) return false;
  return getUnitEffectiveMagicResistance(target, state, catalog) >= 1;
}

/**
 * 将精确的总生命预算拆分为堆叠数量与首名残兵生命（HoMM4 原版忠实规则）：
 * - 绝不通过强制补满白嫖整血单位！
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
 * 校验目标生物类型是否允许作为死亡招魂系残骸：
 * - 招魂唤起新亡灵（招魂·尸壳/怨灵/血族，及反魂起尸/黄泉呼唤转化敌骸）：严禁机械、亡灵、元素、幻象（仅限活体尸体）
 * - 反魂起尸/黄泉呼唤原地复生友军（allowUndeadAllyRevive = true）：仍严禁机械、元素、幻象，但允许复生己方不死/亡灵与活体
 */
export function getNecromancyCorpseRejection(
  target: Pick<BattleUnit, 'name' | 'abilities' | 'isIllusion'>,
  allowUndeadAllyRevive = false,
): { reason: string; shortLabel: string } | null {
  if (isIllusionUnit(target)) {
    return {
      reason: `【${target.name}】为幻象分身，消散无骸，无法从中招魂`,
      shortLabel: '幻象不可招魂',
    };
  }
  if (isMechanicalUnit(target)) {
    return {
      reason: `【${target.name}】为机械构造体，无血肉残骸，无法从中招魂`,
      shortLabel: '机械不可招魂',
    };
  }
  if (isElementalUnit(target)) {
    return {
      reason: `【${target.name}】为元素纯灵，消散归元，无法从中招魂`,
      shortLabel: '元素不可招魂',
    };
  }
  if (!allowUndeadAllyRevive && isUndeadUnit(target)) {
    return {
      reason: `【${target.name}】为亡灵单位，无法从其残骸中再次招魂`,
      shortLabel: '亡灵不可招魂',
    };
  }
  return null;
}

/**
 * 计算目标单位当前可供招魂/死灵转化提取的剩余残骸生命池：
 * - 默认严格屏蔽机械、亡灵、元素、幻象四类非活体（仅当 allowUndead=true 用于己方亡灵原地复生时放行亡灵）
 * - 仅统计已阵亡兵力的生命总和，并扣减已被历次招魂消耗的 consumedCorpseHp
 */
export function getAvailableCorpseHp(
  state: BattleState,
  target: BattleUnit,
  catalog: CombatContentCatalog,
  opts?: { allowUndead?: boolean },
): number {
  if (target.kind !== 'creature' || target.statusEffects?.disintegrated) return 0;
  if (opts?.allowUndead) {
    if (isMechanicalUnit(target) || isElementalUnit(target) || isIllusionUnit(target)) return 0;
  } else if (isSpecialNonLivingUnit(target)) {
    return 0;
  }
  const lostModels =
    target.status === 'dead' ? target.maxCount : Math.max(0, target.maxCount - target.count);
  if (lostModels <= 0) return 0;
  const unitMaxHp = Math.max(1, computeUnitStats(target, state, catalog).maxHp);
  const totalDeadHp = lostModels * unitMaxHp;
  const consumed = target.statusEffects?.consumedCorpseHp ?? 0;
  return Math.max(0, totalDeadHp - consumed);
}

/**
 * 统一校验死亡招魂系法术（corpse_unit）对目标残骸的合法性（引擎结算、UI 高亮、悬停诊断共用唯一真相源）
 */
export function validateCorpseSpellTarget(
  spell: SpellDef,
  caster: BattleUnit,
  target: BattleUnit,
  state: BattleState,
  catalog: CombatContentCatalog,
): SpellTargetValidationResult {
  if (state.battleSpellFlags?.necromancyWardActive) {
    return {
      ok: false,
      reason: '战场受「净土封冥」封印，无法施放招魂术式！',
      shortLabel: '净土封冥封印',
    };
  }
  if (target.kind !== 'creature') {
    return {
      ok: false,
      reason: '请选择一支已阵亡或有兵力折损的兵种残骸（不可指定英雄）',
      shortLabel: '不可指定英雄',
    };
  }
  if (target.statusEffects?.disintegrated) {
    return {
      ok: false,
      reason: '该目标已被「星穹湮灭」化为虚无，无法招魂复活！',
      shortLabel: '已湮灭无骸',
    };
  }

  const eff = spell.specialEffect ?? 'standard';
  const isAllyInPlaceRevive =
    (eff === 'animate_dead' || eff === 'death_call') && target.side === caster.side;

  if (isAllyInPlaceRevive && target.abilities.magicImmune) {
    return {
      ok: false,
      reason: `【${target.name}】全魔法免疫，无法接受反魂复生`,
      shortLabel: '魔法免疫',
    };
  }

  const typeRejection = getNecromancyCorpseRejection(target, isAllyInPlaceRevive);
  if (typeRejection) {
    return { ok: false, ...typeRejection };
  }

  const lostModels =
    target.status === 'dead' ? target.maxCount : Math.max(0, target.maxCount - target.count);
  if (lostModels <= 0) {
    return {
      ok: false,
      reason: '目标尚未出现阵亡兵力，无法唤起亡骸',
      shortLabel: '尚无阵亡残骸',
    };
  }

  const availableCorpseHp = getAvailableCorpseHp(state, target, catalog, {
    allowUndead: isAllyInPlaceRevive,
  });
  if (availableCorpseHp <= 0) {
    return {
      ok: false,
      reason: '该残骸的可用生命池已被耗尽，无法再次招魂',
      shortLabel: '残骸生机耗尽',
    };
  }

  return { ok: true };
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
 * 评估幻象/镜像复制法术（Create Illusion / Phantom Image）的施法门槛与精确残兵规模
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
          {
            spellId: spell.id,
            isFireSpell: Boolean(spell.isFireSpell),
            isIllusion: true,
          },
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

/** 魔法派系主技能倍率（严格对齐 HoMM4 原版规则：主技能管解锁，不额外叠乘倍率） */
export function getSchoolSpellMultiplier(_caster: BattleUnit, _spell: SpellDef): number {
  return 1;
}

/** 计算非英雄施法兵种的单体施法效能系数（按兵种阶位与单兵法强缩放） */
export function getCreaturePerUnitSpellFactor(
  caster: BattleUnit,
  casterSpellPower: number,
  catalog: CombatContentCatalog,
): number {
  const tier = catalog.creatures[caster.defId]?.tier ?? 2;
  const tierBase = tier === 1 ? 0.19 : tier === 2 ? 0.27 : tier === 3 ? 0.38 : 0.68;
  return tierBase + Math.max(0, casterSpellPower) * 0.03;
}

/** 双轨法术威力公式（英雄按等级+法强+技能树；非英雄兵种按人头线性缩放） */
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

/** 单体法术目标合法性统一校验器（引擎结算 + UI 准星 + 战术 AI 单一事实来源） */
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
  if (isTargetResistingHostileSpell(state, caster, target, catalog)) {
    return { ok: false, reason: '目标具备 100% 魔法抗性，完全抵御敌方一切法术', shortLabel: '100%魔抗免疫' };
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
export function grantTempAbility(
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

/** 在战场上真实生成一个召唤/招魂/幻象兵种单位并加入行动队列 */
export function spawnSummonedStack(
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
  // 新召唤/招魂单位排入本巡行动队列末尾，立即具备实战参与感
  state.turnQueue.push(id);
  return unit;
}

/** 计算并结算单次法术伤害（完整包含派系守护、破界穿盾、100%魔抗、炽焰免疫、火抗、擦弹、破邪与全魔免拦截） */
export function computeAndApplySpellDamage(
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
  const targetCls =
    target.kind === 'hero'
      ? resolveActiveHeroClass(
          target.skills,
          target.subSkills,
          catalog.advancedClasses,
          target.selectedAdvancedClassId,
        )
      : null;
  if (spell.isFireSpell && targetCls?.passive?.grantFireSpellImmune) {
    state.actionLog.push(`🔥 ${target.name} 具备「炽焰免疫」，完全无视火焰法术「${spell.name}」！`);
    return { damage: 0, kills: 0, grazed: false };
  }
  const tStats = computeUnitStats(target, state, catalog);
  if (tStats.magicResistance >= 1) {
    state.actionLog.push(`🛡 ${target.name} 凭 100% 魔法抗性，完全抵消了「${spell.name}」的伤害！`);
    return { damage: 0, kills: 0, grazed: false };
  }

  const casterCls =
    caster.kind === 'hero'
      ? resolveActiveHeroClass(
          caster.skills,
          caster.subSkills,
          catalog.advancedClasses,
          caster.selectedAdvancedClassId,
        )
      : null;
  const ignoresWards = Boolean(casterCls?.passive?.ignoreEnemyWards);
  let dmg = rawDamage;

  if (
    spell.id === 'life_exorcism_orb' &&
    (target.abilities.darkNature || isUndeadUnit(target) || target.alignment === 'chaos' || target.alignment === 'death')
  ) {
    dmg *= 1.35;
  }
  if (isDarkMagicVulnerable(target)) {
    dmg *= DARK_MAGIC_VULNERABILITY_MULT;
  }
  if (!ignoresWards && target.abilities.deathWard && (spell.alignment === 'death' || spell.alignment === 'chaos')) {
    dmg *= 0.5;
  }
  if (!ignoresWards && target.abilities.lifeWard && spell.alignment === 'life') {
    dmg *= 0.5;
  }
  if (!ignoresWards && target.abilities.chaosWard && spell.alignment === 'chaos') {
    dmg *= 0.5;
  }
  if (!ignoresWards && target.statusEffects?.schoolWards?.[spell.alignment]) {
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
export function reviveAndHealUnit(
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

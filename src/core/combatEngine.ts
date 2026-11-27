/**
 * HoMM4 核心六边形战斗引擎（纯 TS，确定性 Command → State → Event[]）
 *
 * 完整实现：
 * - 7 格自由混编（英雄亲自上场 + 非角色量产兵种）
 * - 行动队列（Initiative）与经典 Wait（等待至本轮末逆序出手）
 * - 两阶段同时反击（ComputePhase → ApplyPhase）
 * - 先攻（First Strike）、不受反击（No Retaliation）、远程互射反击
 * - 六边形射线视线遮挡（LoS）与高地增伤（+25%）
 * - 东方融合机制：英雄固有特质钩子、擦弹（Graze 减伤 + 反向回蓝充能）、P 点、专属符卡宣言与符卡收取 Bonus
 * - 英雄腰带战斗药水、英雄战败倒地（KnockedOut）
 */

import {
  DARK_MAGIC_VULNERABILITY_MULT,
  DARK_VS_LIVING_DAMAGE_MULT,
  isDarkBonusTarget,
  isDarkMagicVulnerable,
  isImmuneToLivingEffects,
  isImmuneToLivingHeal,
  isImmuneToMorale,
  isUndeadUnit,
} from './creatureTypes';
import {
  canIncrementSubSkill,
  clampSubSkillsToPrimaries,
  getSubSkillMaxAllowedRank,
  resolveActiveHeroClass,
  resolveEligibleAdvancedClasses,
  SKILL_TREE_META,
} from './h4Skills';
import {
  computeReachableHexes,
  evaluateLineOfSight,
  getFootprintHexes,
  hexDistance,
  hexEquals,
  hexKey,
  hexLine,
  hexRay,
  minHexSetDistance,
  offsetToAxial,
  reconstructHexPath,
  type HexCoord,
  type HexTile,
  type LineOfSightResult,
} from './hex';
import { computeUnitStats, resolveAdvancedClass, type GameDataRegistry } from './modifiers';
import { createRngState, nextInt, nextRandom } from './rng';
import {
  enforceUnitStatusSlotCap,
  markStatusEffectOrder,
  upsertUnitModifier,
} from './statusCap';
import { hasIgnoreTerrainPenaltyTrait, HERO_TRAIT_REGISTRY, type AttackHookContext, type SpellPowerHookContext } from './traits';
import {
  allocateHpPoolToStack,
  canPlaceFootprintAt,
  evaluateIllusionSpell,
  executeH4CastSpell,
  getAvailableCorpseHp,
  getCasterSchoolRank,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  isUnitOnHighlandPlatform,
} from './h4SpellExecutor';
import {
  getUnitMovementDomain,
  type AttackPreview,
  type BattleState,
  type BattleUnit,
  type CombatCommand,
  type CombatEvent,
  type CommandResult,
  type ControllerType,
  type CreatureDefinition,
  type HeroDefinition,
  type PotionDef,
  type PrimarySkillId,
  type RangedPenaltyTier,
  type SecondaryHitReport,
  type SecondarySkillId,
  type SideId,
  type SkillRank,
  type SpellCardDef,
  type SpellDef,
  type StatModifier,
  type StrikeReport,
} from './types';

export {
  allocateHpPoolToStack,
  canPlaceFootprintAt,
  evaluateIllusionSpell,
  getAvailableCorpseHp,
  getCasterSchoolRank,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  isUnitOnHighlandPlatform,
};

export interface CombatContentCatalog extends GameDataRegistry {
  heroes: Record<string, HeroDefinition>;
  creatures: Record<string, CreatureDefinition>;
  spells: Record<string, SpellDef>;
  spellCards: Record<string, SpellCardDef>;
  potions: Record<string, PotionDef>;
}

export interface ArmyPlacementSlot {
  kind: 'hero' | 'creature';
  defId: string;
  count?: number;
  col: number;
  row: number;
}

export interface CreateBattleOptions {
  battleId?: string;
  seed?: number;
  mapWidth: number;
  mapHeight: number;
  tiles: Record<string, HexTile>;
  leftSlots: ArmyPlacementSlot[];
  rightSlots: ArmyPlacementSlot[];
  controllers: Record<SideId, ControllerType>;
  balancePreset?: 'classic_h4' | 'equilibris_tuned';
}

function buildTileMap(state: BattleState): Map<string, HexTile> {
  return new Map(Object.entries(state.tiles));
}

/** 获取单个单位当前占据的全部六边形坐标 */
export function getUnitOccupiedHexes(unit: BattleUnit): HexCoord[] {
  return getFootprintHexes(unit.pos, unit.footprint);
}

/** 计算两支单位所有占据格之间的最小六边形距离 */
export function getUnitMinDistance(a: BattleUnit, b: BattleUnit): number {
  return minHexSetDistance(getUnitOccupiedHexes(a), getUnitOccupiedHexes(b));
}

/** 根据指定六边形格反查站在该格上的单位（始终优先返回存活单位，仅在无存活单位且允许时返回倒地英雄） */
export function findUnitAtHex(
  state: BattleState,
  hex: HexCoord,
  includeKnockedOut = false,
): BattleUnit | null {
  let knockedOutFallback: BattleUnit | null = null;
  for (const unit of Object.values(state.units)) {
    if (unit.status === 'dead') continue;
    const occupied = getUnitOccupiedHexes(unit);
    if (!occupied.some((h) => hexEquals(h, hex))) continue;
    if (unit.status === 'alive') {
      return unit;
    }
    if (includeKnockedOut && !knockedOutFallback) {
      knockedOutFallback = unit;
    }
  }
  return knockedOutFallback;
}

/** 反查站在目标六边形上可用于招魂/操纵死尸的兵种单位（包含仍有可用残骸生命池的已阵亡残骸或减员存活堆叠） */
export function findCorpseTargetAtHex(
  state: BattleState,
  hex: HexCoord,
  catalog?: CombatContentCatalog,
): BattleUnit | null {
  let deadFallback: BattleUnit | null = null;
  for (const unit of Object.values(state.units)) {
    if (unit.kind !== 'creature') continue;
    if (unit.statusEffects?.disintegrated) continue;
    const occupied = getUnitOccupiedHexes(unit);
    if (!occupied.some((h) => hexEquals(h, hex))) continue;
    const lostModels = unit.status === 'dead' ? unit.maxCount : Math.max(0, unit.maxCount - unit.count);
    if (lostModels <= 0) continue;
    const maxHp = catalog
      ? Math.max(1, computeUnitStats(unit, state, catalog).maxHp)
      : Math.max(1, unit.baseStats.maxHp);
    const remainingCorpseHp = lostModels * maxHp - (unit.statusEffects?.consumedCorpseHp ?? 0);
    if (remainingCorpseHp <= 0) continue;
    if (unit.status === 'alive' && unit.count < unit.maxCount) {
      return unit;
    }
    if (unit.status === 'dead' && !deadFallback) {
      deadFallback = unit;
    }
  }
  return deadFallback;
}

function getOccupiedHexKeys(state: BattleState, excludeUnitId?: string): Set<string> {
  const set = new Set<string>();
  for (const unit of Object.values(state.units)) {
    if (unit.status !== 'alive') continue;
    if (unit.id === excludeUnitId) continue;
    for (const h of getUnitOccupiedHexes(unit)) {
      set.add(hexKey(h));
    }
  }
  return set;
}

function createHeroUnit(
  id: string,
  side: SideId,
  def: HeroDefinition,
  pos: HexCoord,
  catalog: CombatContentCatalog,
): BattleUnit {
  const initSub = clampSubSkillsToPrimaries(def.initialSkills, def.initialSubSkills ?? {});
  const advClass = resolveAdvancedClass(
    def.initialSkills,
    catalog.advancedClasses,
    initSub,
    def.initialSelectedClassId,
  );
  const maxP = def.innateTraitIds.includes('marisa_firepower_doctrine') ? 5.0 : 4.0;

  return {
    id,
    defId: def.id,
    kind: 'hero',
    side,
    name: def.name,
    title: def.title,
    alignment: def.alignment,
    pos,
    footprint: def.footprint ?? '1x1',
    facing: side === 'left' ? 'right' : 'left',
    status: 'alive',
    count: 1,
    maxCount: 1,
    currentHp: def.baseStats.maxHp,
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
      spellPower: def.baseStats.spellPower,
      maxMana: def.baseStats.maxMana,
    },
    abilities: { ...def.abilities },
    baseAbilities: { ...def.abilities },
    ammo: def.baseStats.ammo,
    maxAmmo: def.baseStats.ammo,
    modifiers: [],
    statusEffects: { stunnedRounds: 0, terrifiedRounds: 0 },
    hasActedThisRound: false,
    hasWaitedThisRound: false,
    isDefending: false,
    hasRetaliatedThisRound: false,
    hasUsedPotionThisRound: false,
    level: def.level,
    mana: def.baseStats.maxMana,
    powerPoints: 2.0,
    maxPowerPoints: maxP,
    spellCardCharge: 55,
    innateTraitIds: [...def.innateTraitIds],
    knownSpellIds: [...def.knownSpellIds],
    signatureSpellCardId: def.signatureSpellCardId,
    potions: def.initialPotions.map((p) => ({ ...p })),
    skills: { ...def.initialSkills },
    subSkills: initSub,
    advancedClassId: advClass?.id,
    selectedAdvancedClassId: def.initialSelectedClassId ?? null,
    equippedArtifactIds: [...(def.initialArtifacts ?? [])],
    voxelBlueprintId: def.voxelBlueprintId,
    themeColor: def.themeColor,
    accentColor: def.accentColor,
  };
}

function createCreatureUnit(
  id: string,
  side: SideId,
  def: CreatureDefinition,
  count: number,
  pos: HexCoord,
): BattleUnit {
  return {
    id,
    defId: def.id,
    kind: 'creature',
    side,
    name: def.name,
    alignment: def.alignment,
    pos,
    footprint: def.footprint ?? '1x1',
    facing: side === 'left' ? 'right' : 'left',
    status: 'alive',
    count,
    maxCount: count,
    currentHp: def.baseStats.maxHp,
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
    baseAbilities: { ...def.abilities },
    ammo: def.baseStats.ammo,
    maxAmmo: def.baseStats.ammo,
    modifiers: [],
    statusEffects: { stunnedRounds: 0, terrifiedRounds: 0 },
    hasActedThisRound: false,
    hasWaitedThisRound: false,
    isDefending: false,
    hasRetaliatedThisRound: false,
    hasUsedPotionThisRound: false,
    mana: def.baseStats.maxMana && def.baseStats.maxMana > 0 ? def.baseStats.maxMana : undefined,
    innateTraitIds: [],
    knownSpellIds: [...(def.knownSpellIds ?? [])],
    potions: [],
    skills: {},
    subSkills: {},
    equippedArtifactIds: [],
    voxelBlueprintId: def.voxelBlueprintId,
    themeColor: def.themeColor,
    accentColor: def.accentColor,
  };
}

export interface MoraleLuckRates {
  /** 高士气触发率（正统 HoMM4：本回合进入第一先手梯队且伤害 +25%，0~1） */
  goodMoraleChance: number;
  /** 低士气触发率（正统 HoMM4：本回合跌入最末行动梯队且伤害 -20%，0~1） */
  badMoraleChance: number;
  /** 进攻正幸运暴击率（伤害 ×1.5，0~1） */
  attackLuckChance: number;
  /** 进攻负幸运厄运率（伤害 ×0.5，0~1） */
  attackBadLuckChance: number;
  /** 防守正幸运护身率（物理受击伤害 ×0.5，0~1） */
  defenseLuckChance: number;
  /** 防守负幸运破防率（物理受击伤害 ×1.25，0~1） */
  defenseBadLuckChance: number;
}

/**
 * 统一核算士气（-10~+10）与幸运（-10~+10）的实时触发概率（引擎结算与 UI 提示单一事实来源）
 * - 士气遵循正统 HoMM4 规则：每点 10% 概率（满值 100%），触发后改变本回合行动梯队与伤害（+25% / -20%），不提供额外回合
 * - 幸运保留攻防双向机制，但严格压缩满值上限，避免群体幸运等满额法术超模
 */
export function computeMoraleLuckRates(
  morale: number,
  luck: number,
  balancePreset: BattleState['balancePreset'] = 'equilibris_tuned',
  isMechanical = false,
): MoraleLuckRates {
  const isClassic = balancePreset === 'classic_h4';
  const clampedMorale = Math.max(-10, Math.min(10, Math.round(morale)));
  const clampedLuck = Math.max(-10, Math.min(10, Math.round(luck)));

  // 机械/器灵/亡灵免疫士气波动（固定处于平稳梯队）
  const goodMoraleChance =
    isMechanical || clampedMorale <= 0 ? 0 : Math.min(1, clampedMorale * 0.1);
  const badMoraleChance =
    isMechanical || clampedMorale >= 0 ? 0 : Math.min(1, -clampedMorale * 0.1);

  // 双向幸运概率封顶：equilibris_tuned 进攻上限 35% / 护身上限 30%；classic_h4 进攻上限 40% / 护身上限 35%
  const attackLuckChance =
    clampedLuck > 0 ? Math.min(isClassic ? 0.4 : 0.35, clampedLuck * (isClassic ? 0.04 : 0.035)) : 0;
  const attackBadLuckChance =
    clampedLuck < 0 ? Math.min(isClassic ? 0.35 : 0.3, -clampedLuck * (isClassic ? 0.035 : 0.03)) : 0;
  const defenseLuckChance =
    clampedLuck > 0 ? Math.min(isClassic ? 0.35 : 0.3, clampedLuck * (isClassic ? 0.035 : 0.03)) : 0;
  const defenseBadLuckChance =
    clampedLuck < 0 ? Math.min(isClassic ? 0.3 : 0.25, -clampedLuck * (isClassic ? 0.03 : 0.025)) : 0;

  return {
    goodMoraleChance,
    badMoraleChance,
    attackLuckChance,
    attackBadLuckChance,
    defenseLuckChance,
    defenseBadLuckChance,
  };
}

/**
 * 为单个单位执行本回合的正统 HoMM4 士气检定（仅在士气非 0 时消耗随机数，保持默认 0 士气下的 RNG 确定性）
 */
function rollUnitRoundMorale(
  state: BattleState,
  unit: BattleUnit,
  catalog: CombatContentCatalog,
): { state: 'good' | 'neutral' | 'bad'; morale: number } {
  if (isImmuneToMorale(unit)) {
    return { state: 'neutral', morale: 0 };
  }
  const stats = computeUnitStats(unit, state, catalog);
  const rates = computeMoraleLuckRates(stats.morale, stats.luck, state.balancePreset, false);
  if (rates.goodMoraleChance > 0) {
    return {
      state: nextRandom(state.rng) < rates.goodMoraleChance ? 'good' : 'neutral',
      morale: stats.morale,
    };
  }
  if (rates.badMoraleChance > 0) {
    return {
      state: nextRandom(state.rng) < rates.badMoraleChance ? 'bad' : 'neutral',
      morale: stats.morale,
    };
  }
  return { state: 'neutral', morale: stats.morale };
}

/**
 * 按正统 HoMM4 三层士气梯队（高士气先手梯队 → 普通梯队 → 低士气末位梯队）+ 有效主动性排序
 */
function sortUnitIdsByTurnPriority(
  unitIds: string[],
  state: BattleState,
  catalog: CombatContentCatalog,
): string[] {
  const tierOf = (u: BattleUnit): number =>
    u.roundMoraleState === 'good' ? 2 : u.roundMoraleState === 'bad' ? 0 : 1;

  return [...unitIds].sort((idA, idB) => {
    const a = state.units[idA];
    const b = state.units[idB];
    if (!a || !b) return idA.localeCompare(idB);
    const tierDiff = tierOf(b) - tierOf(a);
    if (tierDiff !== 0) return tierDiff;
    const sa = computeUnitStats(a, state, catalog);
    const sb = computeUnitStats(b, state, catalog);
    const scoreA = sa.initiative * 10 + sa.morale * 2 + (a.kind === 'hero' ? 1 : 0);
    const scoreB = sb.initiative * 10 + sb.morale * 2 + (b.kind === 'hero' ? 1 : 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.id.localeCompare(b.id);
  });
}

/**
 * 构建本回合的行动顺序（可选在回合初统一结算全军士气检定，按高/平/低三层梯队与主动性降序排列）
 */
function buildRoundTurnQueue(
  state: BattleState,
  catalog: CombatContentCatalog,
  events?: CombatEvent[],
  rollMorale = false,
): string[] {
  const alive = Object.values(state.units).filter((u) => u.status === 'alive');
  if (rollMorale) {
    const orderedForRoll = [...alive].sort((a, b) => a.id.localeCompare(b.id));
    for (const u of orderedForRoll) {
      const rolled = rollUnitRoundMorale(state, u, catalog);
      u.roundMoraleState = rolled.state;
      if (rolled.state === 'good') {
        events?.push({ type: 'MORALE_TRIGGERED', unitId: u.id, kind: 'good', morale: rolled.morale });
        state.actionLog.push(
          `🦅 ${u.name} 士气高涨（士气 +${rolled.morale}）：本回合抢占先手梯队且伤害 +25%！`,
        );
      } else if (rolled.state === 'bad') {
        events?.push({ type: 'MORALE_TRIGGERED', unitId: u.id, kind: 'bad', morale: rolled.morale });
        state.actionLog.push(
          `💔 ${u.name} 士气低落（士气 ${rolled.morale}）：本回合落入末位梯队且伤害 -20%！`,
        );
      }
    }
  }
  return sortUnitIdsByTurnPriority(
    alive.map((u) => u.id),
    state,
    catalog,
  );
}

/**
 * 回合中因法术/驱散改变了目标有效士气时，立即重检受影响单位的本回合士气态并重排尚未行动的队列
 */
function syncMidRoundMorale(
  state: BattleState,
  affectedUnitIds: string[],
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): void {
  let anyChanged = false;
  const uniqueIds = Array.from(new Set(affectedUnitIds));
  for (const uid of uniqueIds) {
    const u = state.units[uid];
    if (!u || u.status !== 'alive') continue;
    const prev = u.roundMoraleState ?? 'neutral';
    const rolled = rollUnitRoundMorale(state, u, catalog);
    if (rolled.state !== prev) {
      u.roundMoraleState = rolled.state;
      anyChanged = true;
      if (rolled.state === 'good') {
        events.push({ type: 'MORALE_TRIGGERED', unitId: u.id, kind: 'good', morale: rolled.morale });
        state.actionLog.push(
          `🦅 ${u.name} 士气振奋（士气 +${rolled.morale}）：本回合立即跃升先手梯队且伤害 +25%！`,
        );
      } else if (rolled.state === 'bad') {
        events.push({ type: 'MORALE_TRIGGERED', unitId: u.id, kind: 'bad', morale: rolled.morale });
        state.actionLog.push(
          `💔 ${u.name} 士气受挫（士气 ${rolled.morale}）：本回合滑落末位梯队且伤害 -20%！`,
        );
      }
    }
  }
  if (anyChanged && state.turnQueue.length > 1) {
    // 仅重排尚未轮到的待行动单位，保留当前正在行动的单位顺序不受干扰
    const pending = state.turnQueue.filter((id) => id !== state.activeUnitId);
    const reordered = sortUnitIdsByTurnPriority(pending, state, catalog);
    state.turnQueue =
      state.activeUnitId && state.turnQueue.includes(state.activeUnitId)
        ? [state.activeUnitId, ...reordered]
        : reordered;
  }
}

/**
 * 初始化一场全新的六边形战术战斗
 */
export function createBattleState(
  options: CreateBattleOptions,
  catalog: CombatContentCatalog,
): { state: BattleState; events: CombatEvent[] } {
  const units: Record<string, BattleUnit> = {};

  const addSlots = (side: SideId, slots: ArmyPlacementSlot[]) => {
    slots.slice(0, 7).forEach((slot, idx) => {
      const pos = offsetToAxial(slot.col, slot.row);
      const id = `${side}_${idx}_${slot.defId}`;
      if (slot.kind === 'hero') {
        const def = catalog.heroes[slot.defId];
        if (!def) throw new Error(`未找到英雄定义: ${slot.defId}`);
        units[id] = createHeroUnit(id, side, def, pos, catalog);
      } else {
        const def = catalog.creatures[slot.defId];
        if (!def) throw new Error(`未找到兵种定义: ${slot.defId}`);
        units[id] = createCreatureUnit(id, side, def, Math.max(1, slot.count ?? 1), pos);
      }
    });
  };

  addSlots('left', options.leftSlots);
  addSlots('right', options.rightSlots);

  const state: BattleState = {
    battleId: options.battleId ?? 'battle_shrine_night',
    mapWidth: options.mapWidth,
    mapHeight: options.mapHeight,
    tiles: structuredClone(options.tiles),
    units,
    turnQueue: [],
    waitQueue: [],
    activeUnitId: null,
    round: 1,
    phase: 'active',
    winner: null,
    controllers: { ...options.controllers },
    activeFieldAura: null,
    battleSpellFlags: {
      manaFlareActive: false,
      necromancyWardActive: false,
      quicksandHexKeys: [],
    },
    balancePreset: options.balancePreset ?? 'equilibris_tuned',
    capturedSpellCards: [],
    rng: createRngState(options.seed ?? 20261125),
    actionLog: ['夜幕降临幻想乡，结界六边形战局正式开始！'],
    commandSeq: 0,
    hasCombatStarted: false,
    nextStatusOrder: 0,
  };

  // 同步英雄由 36 技能树 + 激活职业派生的特技与满血满蓝上限
  for (const unit of Object.values(state.units)) {
    if (unit.kind === 'hero') {
      syncHeroDerivedState(state, unit, catalog, true);
    }
  }
  for (const unit of Object.values(state.units)) {
    const computed = computeUnitStats(unit, state, catalog);
    unit.currentHp = computed.maxHp;
    if (computed.maxMana > 0) {
      unit.mana = computed.maxMana;
    }
  }

  const events: CombatEvent[] = [{ type: 'ROUND_STARTED', round: 1 }];
  state.turnQueue = buildRoundTurnQueue(state, catalog, events, true);
  state.activeUnitId = state.turnQueue[0] ?? null;

  if (state.activeUnitId) {
    events.push({ type: 'TURN_STARTED', unitId: state.activeUnitId });
  }

  return { state, events };
}

/**
 * 判断当前是否处于「战斗场景外」（战前整备阶段或战斗结束后），允许自由切换已解锁进阶职业与调整配点
 */
export function canModifyHeroClassOrBuild(state: BattleState): boolean {
  return !state.hasCombatStarted || state.phase === 'finished';
}

/**
 * 根据英雄当前 36 技能树与激活职业，无损重算其派生特技（如射击解锁远程、圣骑士抗死结界、烈焰守卫火盾等）与血蓝上限
 */
export function syncHeroDerivedState(
  state: BattleState,
  hero: BattleUnit,
  catalog: CombatContentCatalog,
  refillIfPrep = false,
): void {
  if (hero.kind !== 'hero') return;
  hero.subSkills = clampSubSkillsToPrimaries(hero.skills, hero.subSkills ?? {});

  // 若先前指定的职业因减点不再满足条件，自动回退至最高资格职业
  const eligible = resolveEligibleAdvancedClasses(hero.skills, hero.subSkills, catalog.advancedClasses);
  if (hero.selectedAdvancedClassId && !eligible.some((c) => c.id === hero.selectedAdvancedClassId)) {
    hero.selectedAdvancedClassId = null;
  }

  const activeCls = resolveActiveHeroClass(
    hero.skills,
    hero.subSkills,
    catalog.advancedClasses,
    hero.selectedAdvancedClassId,
  );
  hero.advancedClassId = activeCls?.id;

  // 从基础特技快照出发重构派生特技，并保留法术临时赋予的特技
  const baseAb = hero.baseAbilities ?? { ...hero.abilities };
  hero.baseAbilities = { ...baseAb };
  const nextAb = { ...baseAb };
  const sub = hero.subSkills ?? {};
  const p = activeCls?.passive;

  if ((sub.archery ?? 0) >= 1) {
    nextAb.ranged = true;
    hero.baseStats.range = Math.max(hero.baseStats.range, 8);
    if (hero.maxAmmo < 16) {
      hero.maxAmmo = 16;
      hero.ammo = Math.max(hero.ammo, 16);
    }
  }
  if ((sub.stealth ?? 0) >= 3) nextAb.stealth = true;
  if (p?.grantDeathWard) nextAb.deathWard = true;
  if (p?.grantFireShield) nextAb.fireShield = true;
  if (p?.grantFireResistant) nextAb.fireResistant = true;
  if (p?.grantLongRange) nextAb.longRange = true;
  if (p?.grantFirstStrike) nextAb.firstStrike = true;

  if (hero.statusEffects.grantedAbilities) {
    for (const ga of hero.statusEffects.grantedAbilities) {
      nextAb[ga] = true;
    }
  }
  hero.abilities = nextAb;

  // 若处于战前整备且要求补满，或血蓝超出新上限则同步对齐
  const stats = computeUnitStats(hero, state, catalog);
  if (refillIfPrep && !state.hasCombatStarted) {
    hero.currentHp = stats.maxHp;
    hero.mana = stats.maxMana;
  } else {
    hero.currentHp = Math.min(hero.currentHp, stats.maxHp);
    if (hero.mana !== undefined) {
      hero.mana = Math.min(hero.mana, stats.maxMana);
    }
  }
}

/** 战前整备 / 沙盒调整英雄主技能阶位（0~5），自动级联收敛子技能、同步法术与职业 */
export function setHeroPrimarySkillRank(
  state: BattleState,
  heroId: string,
  skillId: PrimarySkillId,
  rank: SkillRank,
  catalog: CombatContentCatalog,
): { ok: boolean; error?: string } {
  if (!canModifyHeroClassOrBuild(state)) {
    return { ok: false, error: '战斗进行中无法调整技能配点，请于战前整备或重开战局后调整' };
  }
  const hero = state.units[heroId];
  if (!hero || hero.kind !== 'hero') return { ok: false, error: '目标不是英雄单位' };

  const clamped = Math.max(0, Math.min(5, Math.round(rank))) as SkillRank;
  if (clamped === 0) {
    delete hero.skills[skillId];
  } else {
    hero.skills[skillId] = clamped;
  }

  // 若提升了五系魔法主技能，自动解锁对应阶位及以下该系法术供沙盒直接施放体验！
  const meta = SKILL_TREE_META[skillId];
  if (meta.isMagic && meta.magicSchool && clamped > 0) {
    const known = new Set(hero.knownSpellIds);
    for (const sp of Object.values(catalog.spells)) {
      if (sp.alignment === meta.magicSchool && sp.level <= clamped && !sp.isCreatureOnly) {
        known.add(sp.id);
      }
    }
    hero.knownSpellIds = Array.from(known);
  }

  syncHeroDerivedState(state, hero, catalog, true);
  // 同步刷新全队因战术/贵族等光环变化导致的初始血量与先手行动队列
  if (!state.hasCombatStarted) {
    for (const u of Object.values(state.units)) {
      const s = computeUnitStats(u, state, catalog);
      u.currentHp = s.maxHp;
      if (s.maxMana > 0) u.mana = s.maxMana;
    }
    state.turnQueue = buildRoundTurnQueue(state, catalog);
    state.activeUnitId = state.turnQueue[0] ?? null;
  }
  return { ok: true };
}

/** 战前整备 / 沙盒调整英雄二级子技能阶位（0~5），严格校验 H4 主技能前置要求 */
export function setHeroSecondarySkillRank(
  state: BattleState,
  heroId: string,
  subSkillId: SecondarySkillId,
  rank: SkillRank,
  catalog: CombatContentCatalog,
): { ok: boolean; error?: string } {
  if (!canModifyHeroClassOrBuild(state)) {
    return { ok: false, error: '战斗进行中无法调整子技能配点，请于战前整备或重开战局后调整' };
  }
  const hero = state.units[heroId];
  if (!hero || hero.kind !== 'hero') return { ok: false, error: '目标不是英雄单位' };

  const target = Math.max(0, Math.min(5, Math.round(rank))) as SkillRank;
  const current = hero.subSkills?.[subSkillId] ?? 0;
  if (target > current) {
    const check = canIncrementSubSkill(hero.skills, hero.subSkills ?? {}, subSkillId);
    if (!check.ok) return { ok: false, error: check.reason };
    const maxAllowed = getSubSkillMaxAllowedRank(hero.skills, subSkillId);
    if (target > maxAllowed) {
      return { ok: false, error: `子技能最高不可超过主技能当前阶位 (Lv.${maxAllowed})` };
    }
  }

  hero.subSkills = { ...(hero.subSkills ?? {}) };
  if (target === 0) {
    delete hero.subSkills[subSkillId];
  } else {
    hero.subSkills[subSkillId] = target;
  }

  syncHeroDerivedState(state, hero, catalog, true);
  if (!state.hasCombatStarted) {
    for (const u of Object.values(state.units)) {
      const s = computeUnitStats(u, state, catalog);
      u.currentHp = s.maxHp;
      if (s.maxMana > 0) u.mana = s.maxMana;
    }
    state.turnQueue = buildRoundTurnQueue(state, catalog);
    state.activeUnitId = state.turnQueue[0] ?? null;
  }
  return { ok: true };
}

/**
 * 战斗场景外自由切换英雄进阶职业（支持在全部已满足解锁条件的进阶组合职业之间任意切换！）
 * 战斗正式打响后（hasCombatStarted === true 且 phase === 'active'）自动锁定禁止切职。
 */
export function selectHeroAdvancedClass(
  state: BattleState,
  heroId: string,
  classId: string | null,
  catalog: CombatContentCatalog,
): { ok: boolean; error?: string } {
  if (!canModifyHeroClassOrBuild(state)) {
    return { ok: false, error: '战斗进行中不可切换进阶职业，请于战前整备或战斗结束后切换' };
  }
  const hero = state.units[heroId];
  if (!hero || hero.kind !== 'hero') return { ok: false, error: '仅英雄可切换进阶职业' };

  if (classId !== null) {
    const eligible = resolveEligibleAdvancedClasses(hero.skills, hero.subSkills, catalog.advancedClasses);
    if (!eligible.some((c) => c.id === classId)) {
      return { ok: false, error: '尚未满足该进阶职业的技能树组合条件' };
    }
  }

  hero.selectedAdvancedClassId = classId;
  syncHeroDerivedState(state, hero, catalog, true);
  if (!state.hasCombatStarted) {
    for (const u of Object.values(state.units)) {
      const s = computeUnitStats(u, state, catalog);
      u.currentHp = s.maxHp;
      if (s.maxMana > 0) u.mana = s.maxMana;
    }
    state.turnQueue = buildRoundTurnQueue(state, catalog);
    state.activeUnitId = state.turnQueue[0] ?? null;
  }
  const activeCls = resolveActiveHeroClass(
    hero.skills,
    hero.subSkills,
    catalog.advancedClasses,
    hero.selectedAdvancedClassId,
  );
  if (activeCls) {
    state.actionLog.push(`✦ ${hero.name} 于战前整备切换进阶职业为【${activeCls.name}】！`);
  }
  return { ok: true };
}

/**
 * 判断单位是否处于敌军近战贴身压制状态（任意占据格与敌军占据格相邻）
 */
export function isEngagedInMelee(state: BattleState, unit: BattleUnit): boolean {
  const myHexes = getUnitOccupiedHexes(unit);
  for (const other of Object.values(state.units)) {
    if (other.status !== 'alive' || other.side === unit.side) continue;
    if (minHexSetDistance(myHexes, getUnitOccupiedHexes(other)) <= 1) return true;
  }
  return false;
}

/**
 * 计算单位在当前状态下的全部可移动六边形（严格校验多格碰撞体积！）
 */
export function getUnitReachableMap(
  state: BattleState,
  unit: BattleUnit,
  catalog: CombatContentCatalog,
) {
  const stats = computeUnitStats(unit, state, catalog);
  const tiles = buildTileMap(state);
  const occupied = getOccupiedHexKeys(state, unit.id);
  const domain = getUnitMovementDomain(unit);
  const allyPathfindingWalk = Object.values(state.units).some(
    (u) => u.side === unit.side && u.status === 'alive' && u.kind === 'hero' && (u.subSkills?.pathfinding ?? 0) >= 4,
  );
  const ignoreTerrain =
    hasIgnoreTerrainPenaltyTrait(unit) || Boolean(unit.statusEffects?.terrainWalk) || allyPathfindingWalk;

  // H4 自然法术「流沙陷阱 (Quicksand)」：非飞行且无地形通行的陆地单位踩入流沙格立即耗尽剩余移动力停步！
  const qsKeys = state.battleSpellFlags?.quicksandHexKeys ?? [];
  if (qsKeys.length > 0 && domain === 'ground' && !ignoreTerrain) {
    const stopCost = Math.max(1, stats.speed);
    for (const k of qsKeys) {
      const t = tiles.get(k);
      if (t) {
        tiles.set(k, { ...t, moveCost: Math.max(t.moveCost, stopCost) });
      }
    }
  }

  return computeReachableHexes(
    unit.pos,
    stats.speed,
    tiles,
    occupied,
    domain,
    ignoreTerrain,
    unit.footprint,
  );
}

/**
 * 施法视线判定（唯一真相源）：
 * - 普通障碍物（竹林等）绝不阻挡施法！
 * - 只有高耸障碍物（高耸玄石碑/城墙）以及【所有其他存活单位】会阻挡施法视线。
 * - 自动排除施法者自身占位格，以及目标单位（或目标点上站立单位）自身的占位格。
 */
export function checkSpellLineOfSight(
  state: BattleState,
  caster: BattleUnit,
  targetHexes: readonly HexCoord[],
  targetUnit?: BattleUnit | null,
): { canCast: boolean; los: LineOfSightResult } {
  const emptyBlocked: LineOfSightResult = {
    canShoot: false,
    status: 'blocked',
    losMultiplier: 0,
    intermediateHexes: [],
    blockingHexes: [],
  };
  if (targetHexes.length === 0) {
    return { canCast: false, los: emptyBlocked };
  }

  const casterHexes = getUnitOccupiedHexes(caster);
  // 施法目标为自身或重叠在自身占据格上时必定畅通
  if (targetUnit && targetUnit.id === caster.id) {
    return {
      canCast: true,
      los: { canShoot: true, status: 'clear', losMultiplier: 1, intermediateHexes: [], blockingHexes: [] },
    };
  }

  const tiles = buildTileMap(state);
  const occupied = getOccupiedHexKeys(state, caster.id);
  // 排除目标单位（或目标落点上站立单位）自身全部占位格，防止目标挡住打向自己的法术
  if (targetUnit) {
    for (const h of getUnitOccupiedHexes(targetUnit)) {
      occupied.delete(hexKey(h));
    }
  } else {
    for (const th of targetHexes) {
      occupied.delete(hexKey(th));
      const standing = findUnitAtHex(state, th, false);
      if (standing) {
        for (const h of getUnitOccupiedHexes(standing)) {
          occupied.delete(hexKey(h));
        }
      }
    }
  }

  let bestLos: LineOfSightResult = emptyBlocked;
  for (const cHex of casterHexes) {
    for (const tHex of targetHexes) {
      const los = evaluateLineOfSight(cHex, tHex, tiles, occupied);
      // 施法无视普通障碍物（partial 亦视为完全可施放），只有 blocked（高耸障碍/单位）才会阻挡！
      if (los.status !== 'blocked') {
        return { canCast: true, los };
      }
      bestLos = los;
    }
  }
  return { canCast: false, los: bestLos };
}

/**
 * 统一计算 HoMM4 远程四阶衰减（距离档位 + 普通障碍降档）
 */
function computeRangedPenalty(
  shooter: BattleUnit,
  effectiveRange: number,
  distance: number,
  losStatus: 'clear' | 'partial' | 'blocked',
): { penaltyTier: RangedPenaltyTier; rangePenalty: number } {
  let distSteps = 0;
  if (shooter.abilities.longRange) {
    distSteps = 0;
  } else if (shooter.abilities.shortRange) {
    distSteps = distance <= effectiveRange ? 0 : distance <= Math.ceil(effectiveRange * 1.5) ? 1 : 2;
  } else {
    distSteps = distance <= effectiveRange ? 0 : distance <= effectiveRange * 2 ? 1 : 2;
  }
  const obstacleSteps = losStatus === 'partial' && !shooter.abilities.noObstaclePenalty ? 1 : 0;
  const totalSteps = Math.min(3, distSteps + obstacleSteps);
  const penaltyTier: RangedPenaltyTier =
    totalSteps === 0 ? 'full' : totalSteps === 1 ? 'half' : totalSteps === 2 ? 'quarter' : 'eighth';
  const rangePenalty =
    totalSteps === 0 ? 1 : totalSteps === 1 ? 0.5 : totalSteps === 2 ? 0.25 : 0.125;
  return { penaltyTier, rangePenalty };
}

/**
 * 判断攻击者是否能对目标发起远程射击（HoMM4 四阶衰减：默认 1x / 1/2 / 1/4 / 1/8！）
 * - 距离衰减：≤ range 为 1x；(range, 2×range] 为 1/2；> 2×range 为 1/4
 * - 普通障碍物（竹林等）绝不完全阻挡，只会令远程衰减再降一档（1x→1/2，1/2→1/4，1/4→1/8！）
 * - 紧贴射击者身旁（距离 1）的己方前卫友军允许越肩开火（构成经典前卫掩护后排阵型），
 *   但非紧邻友军（距离 ≥ 2）、任意敌军及高耸障碍物（高耸岩柱/城墙）仍彻底阻挡远程视线！
 */
export function checkRangedCapability(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  catalog: CombatContentCatalog,
): {
  canRanged: boolean;
  los: LineOfSightResult;
  distance: number;
  rangePenalty: number;
  penaltyTier: RangedPenaltyTier;
} {
  const stats = computeUnitStats(attacker, state, catalog);
  const atkHexes = getUnitOccupiedHexes(attacker);
  const defHexes = getUnitOccupiedHexes(defender);
  const distance = minHexSetDistance(atkHexes, defHexes);
  const emptyLos: LineOfSightResult = {
    canShoot: false,
    status: 'blocked',
    losMultiplier: 0,
    intermediateHexes: [],
    blockingHexes: [],
  };

  const hasAmmo = Boolean(attacker.abilities.unlimitedShots) || attacker.ammo > 0;
  // 近战禁手（No Melee）单位即便被敌军贴身（含紧邻距离 1），依然可照常进行远程射击，只是永远不会发起近战！
  const canShootWhileEngaged = Boolean(attacker.abilities.noMelee);
  if (!attacker.abilities.ranged || attacker.abilities.noRanged || !hasAmmo) {
    return { canRanged: false, los: emptyLos, distance, rangePenalty: 0, penaltyTier: 'full' };
  }
  if (!canShootWhileEngaged && (distance <= 1 || isEngagedInMelee(state, attacker))) {
    return { canRanged: false, los: emptyLos, distance, rangePenalty: 0, penaltyTier: 'full' };
  }

  const tiles = buildTileMap(state);
  const occupied = getOccupiedHexKeys(state);
  // 排除射击者与目标自身占位格
  for (const h of atkHexes) occupied.delete(hexKey(h));
  for (const h of defHexes) occupied.delete(hexKey(h));
  // 紧贴射击者身旁（距离 1）的己方友军允许越肩射击，不阻挡己方主动开火视线
  for (const ally of Object.values(state.units)) {
    if (ally.status !== 'alive' || ally.side !== attacker.side || ally.id === attacker.id) continue;
    const allyHexes = getUnitOccupiedHexes(ally);
    if (minHexSetDistance(atkHexes, allyHexes) <= 1) {
      for (const h of allyHexes) occupied.delete(hexKey(h));
    }
  }

  let bestLos: LineOfSightResult = emptyLos;
  for (const aHex of atkHexes) {
    for (const dHex of defHexes) {
      const los = evaluateLineOfSight(aHex, dHex, tiles, occupied);
      if (los.losMultiplier > bestLos.losMultiplier || (los.canShoot && !bestLos.canShoot)) {
        bestLos = los;
      }
      if (bestLos.status === 'clear') break;
    }
    if (bestLos.status === 'clear') break;
  }

  const effectiveRange = Math.max(1, stats.range);
  const { penaltyTier, rangePenalty } = computeRangedPenalty(attacker, effectiveRange, distance, bestLos.status);

  return {
    canRanged: bestLos.canShoot,
    los: bestLos,
    distance,
    rangePenalty,
    penaltyTier,
  };
}

/**
 * 原版 HoMM4 远程反击与「前卫替伤（Frontline Interception）」统一判定器（预览与实战唯一真相源）：
 * - 防守方 A 向攻击方 B 发起远程反击时，沿 A→B 的弹道射线逐格扫描：
 *   1. 若遇高耸障碍物（玄石岩柱/城墙）或 A 自身非紧邻友军，则该射线被彻底阻挡；
 *   2. 若在命中 B 之前先遇到 B 的存活友军 C（非「常世净域」无敌隐匿状态），
 *      则 A 依然正常发动远程反击，但弹道会被最先挡在轨迹上的前卫 C 截击替伤！
 *   3. 命中前卫 C 后，射程衰减与遮挡均按 A → C 的实际飞行段重算，避免原攻击者 B 受损。
 */
export function evaluateRangedRetaliation(
  state: BattleState,
  defender: BattleUnit,
  attacker: BattleUnit,
  catalog: CombatContentCatalog,
): {
  canRetaliate: boolean;
  actualTarget: BattleUnit;
  interceptedBy: BattleUnit | null;
  los: LineOfSightResult;
  distance: number;
  rangePenalty: number;
  penaltyTier: RangedPenaltyTier;
} {
  const stats = computeUnitStats(defender, state, catalog);
  const defHexes = getUnitOccupiedHexes(defender);
  const atkHexes = getUnitOccupiedHexes(attacker);
  const directDistance = minHexSetDistance(defHexes, atkHexes);
  const emptyLos: LineOfSightResult = {
    canShoot: false,
    status: 'blocked',
    losMultiplier: 0,
    intermediateHexes: [],
    blockingHexes: [],
  };

  const hasAmmo = Boolean(defender.abilities.unlimitedShots) || defender.ammo > 0;
  const canShootWhileEngaged = Boolean(defender.abilities.noMelee);
  if (!defender.abilities.ranged || defender.abilities.noRanged || !hasAmmo) {
    return {
      canRetaliate: false,
      actualTarget: attacker,
      interceptedBy: null,
      los: emptyLos,
      distance: directDistance,
      rangePenalty: 0,
      penaltyTier: 'full',
    };
  }
  if (!canShootWhileEngaged && (directDistance <= 1 || isEngagedInMelee(state, defender))) {
    return {
      canRetaliate: false,
      actualTarget: attacker,
      interceptedBy: null,
      los: emptyLos,
      distance: directDistance,
      rangePenalty: 0,
      penaltyTier: 'full',
    };
  }

  const tiles = buildTileMap(state);
  // 构造反击射线上的两类单位集合：
  // 1) hardUnitBlockerKeys：阻挡 A 反击的单位（A 方非紧邻友军，以及不可受伤的常世净域单位）
  // 2) attackerAllyHexMap：可替 B 挡箭的 B 方存活友军（排除 B 自身与常世净域单位）
  const hardUnitBlockerKeys = new Set<string>();
  const attackerAllyHexMap = new Map<string, BattleUnit>();

  for (const u of Object.values(state.units)) {
    if (u.status !== 'alive' || u.id === defender.id || u.id === attacker.id) continue;
    const uHexes = getUnitOccupiedHexes(u);
    if (u.side === defender.side) {
      // A 身旁紧邻（距离 1）的己方友军允许越肩反击，非紧邻友军仍阻挡视线
      if (minHexSetDistance(defHexes, uHexes) > 1) {
        for (const h of uHexes) hardUnitBlockerKeys.add(hexKey(h));
      }
    } else if (u.side === attacker.side) {
      if (u.statusEffects?.sanctuary) {
        // 处于常世净域的友军不可被攻击或替伤，按纯阻挡处理以严守净域无敌规则
        for (const h of uHexes) hardUnitBlockerKeys.add(hexKey(h));
      } else {
        for (const h of uHexes) attackerAllyHexMap.set(hexKey(h), u);
      }
    }
  }

  interface RetaliationRayCandidate {
    interceptedBy: BattleUnit | null;
    interceptStep: number;
    los: LineOfSightResult;
  }

  let bestDirect: RetaliationRayCandidate | null = null;
  let bestIntercept: RetaliationRayCandidate | null = null;

  for (const dHex of defHexes) {
    const dElev = tiles.get(hexKey(dHex))?.elevation ?? 1;
    for (const aHex of atkHexes) {
      const aElev = tiles.get(hexKey(aHex))?.elevation ?? 1;
      const maxEndElev = Math.max(dElev, aElev);
      const path = hexLine(dHex, aHex);
      const intermediate = path.slice(1, -1);

      let blocked = false;
      let partialCount = 0;
      const blockingHexes: HexCoord[] = [];
      let hitAlly: BattleUnit | null = null;
      let hitStep = Infinity;

      for (let i = 0; i < intermediate.length; i += 1) {
        const hex = intermediate[i];
        const key = hexKey(hex);
        const tile = tiles.get(key);
        if (!tile) {
          blocked = true;
          break;
        }
        // 1. A 方非紧邻友军（或净域阻隔）直接阻断反击射线
        if (hardUnitBlockerKeys.has(key) && tile.elevation + 2 >= maxEndElev) {
          blocked = true;
          break;
        }
        // 2. 高耸地形障碍（玄石岩柱/城墙）直接阻断反击射线
        if (tile.losObstruction === 'full' && tile.elevation >= maxEndElev) {
          blocked = true;
          break;
        }
        // 3. 命中站在弹道上的 B 方前卫友军 C：箭矢在此被截击替伤，不再继续向后飞行！
        const ally = attackerAllyHexMap.get(key);
        if (ally && tile.elevation + 2 >= maxEndElev) {
          hitAlly = ally;
          hitStep = i + 1;
          break;
        }
        // 4. 沿途经过的普通障碍物（竹林等）累计为半遮挡
        if (tile.losObstruction === 'partial' || tile.losObstruction === 'full') {
          partialCount += 1;
          blockingHexes.push(hex);
        }
      }

      if (blocked) continue;

      const los: LineOfSightResult =
        partialCount > 0
          ? {
              canShoot: true,
              status: 'partial',
              losMultiplier: 0.5,
              intermediateHexes: hitAlly ? intermediate.slice(0, hitStep - 1) : intermediate,
              blockingHexes,
            }
          : {
              canShoot: true,
              status: 'clear',
              losMultiplier: 1,
              intermediateHexes: hitAlly ? intermediate.slice(0, hitStep - 1) : intermediate,
              blockingHexes: [],
            };

      if (!hitAlly) {
        if (!bestDirect || los.losMultiplier > bestDirect.los.losMultiplier) {
          bestDirect = { interceptedBy: null, interceptStep: Infinity, los };
        }
      } else {
        // 多格单位若多条射线均被替伤拦截，优先保留视线更佳且拦截点更靠近反击者的路径
        if (
          !bestIntercept ||
          los.losMultiplier > bestIntercept.los.losMultiplier ||
          (los.losMultiplier === bestIntercept.los.losMultiplier && hitStep < bestIntercept.interceptStep)
        ) {
          bestIntercept = { interceptedBy: hitAlly, interceptStep: hitStep, los };
        }
      }
    }
  }

  const chosen = bestDirect ?? bestIntercept;
  if (!chosen) {
    return {
      canRetaliate: false,
      actualTarget: attacker,
      interceptedBy: null,
      los: emptyLos,
      distance: directDistance,
      rangePenalty: 0,
      penaltyTier: 'full',
    };
  }

  const actualTarget = chosen.interceptedBy ?? attacker;
  const actualDistance = minHexSetDistance(defHexes, getUnitOccupiedHexes(actualTarget));
  const effectiveRange = Math.max(1, stats.range);
  const { penaltyTier, rangePenalty } = computeRangedPenalty(
    defender,
    effectiveRange,
    actualDistance,
    chosen.los.status,
  );

  return {
    canRetaliate: true,
    actualTarget,
    interceptedBy: chosen.interceptedBy,
    los: chosen.los,
    distance: actualDistance,
    rangePenalty,
    penaltyTier,
  };
}

/**
 * 计算一次打击的期望伤害区间（纯函数，用于攻击预测与正式结算）
 */
function calculateDamageRange(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  attackerPos: HexCoord,
  isRanged: boolean,
  losMultiplier: number,
  rangePenalty: number,
  catalog: CombatContentCatalog,
  chargeSteps = 0,
): {
  minDamage: number;
  maxDamage: number;
  highGroundBonus: boolean;
  notes: string[];
} {
  const atkStats = computeUnitStats(attacker, state, catalog);
  const defStats = computeUnitStats(defender, state, catalog);

  // 执行英雄固有特质 onBeforeAttack 钩子
  const hookCtx: AttackHookContext = {
    state,
    attacker,
    defender,
    isRanged,
    damageMultiplier: 1,
    defensePenetration: 0,
    notes: [],
  };
  for (const traitId of attacker.innateTraitIds) {
    HERO_TRAIT_REGISTRY[traitId]?.onBeforeAttack?.(hookCtx);
  }

  // 抗死结界 / 抗生结界（特技）与五系法术守护结界（schoolWards）防御倍率
  const deathWardActive = Boolean(
    defender.abilities.deathWard &&
      (attacker.alignment === 'death' ||
        attacker.alignment === 'chaos' ||
        attacker.abilities.darkNature ||
        isUndeadUnit(attacker)),
  );
  const lifeWardActive = Boolean(defender.abilities.lifeWard && attacker.alignment === 'life');
  const schoolWardActive = Boolean(defender.statusEffects?.schoolWards?.[attacker.alignment]);
  const wardDefenseMult = schoolWardActive || lifeWardActive ? 1.5 : deathWardActive ? 1.25 : 1;
  // 骸骨体质（远程防御 +100%）与虚无体质（近战/远程双防 +100%）
  const bodyDefenseMult =
    (defender.abilities.insubstantial ? 2 : 1) * (isRanged && defender.abilities.skeletal ? 2 : 1);
  const effectiveDefense = Math.max(
    1,
    defStats.defense * wardDefenseMult * bodyDefenseMult * (1 - hookCtx.defensePenetration),
  );
  if (schoolWardActive) {
    hookCtx.notes.push('敌方派系守护(防+50%)');
  } else if (lifeWardActive) {
    hookCtx.notes.push('敌方抗生结界(防+50%)');
  } else if (deathWardActive) {
    hookCtx.notes.push('敌方抗死结界(防+25%)');
  }
  if (defender.abilities.insubstantial) {
    hookCtx.notes.push('敌方虚无体质(双防+100%)');
  }
  if (isRanged && defender.abilities.skeletal) {
    hookCtx.notes.push('敌方骸骨体质(远防+100%)');
  }

  // 天眼狙定（Precision）：仅在远程射击时提升 +25% 有效攻击，绝不加成近战！
  const precisionActive = Boolean(isRanged && (attacker.statusEffects?.precisionRounds ?? 0) > 0);
  const effectiveAttack = precisionActive ? atkStats.attack * 1.25 : atkStats.attack;
  if (precisionActive) {
    hookCtx.notes.push('天眼狙定(+25%远攻)');
  }

  // HoMM4 风格非线性攻防比：避免极端一刀秒或 0 伤害
  const atkDefRatio = Math.max(0.35, Math.min(2.6, (effectiveAttack + 10) / (effectiveDefense + 10)));

  // 高地压制判定（取多格单位占据格中的最高高程进行比较）
  const atkElev = Math.max(
    ...getFootprintHexes(attackerPos, attacker.footprint).map((h) => state.tiles[hexKey(h)]?.elevation ?? 1),
  );
  const defElev = Math.max(
    ...getUnitOccupiedHexes(defender).map((h) => state.tiles[hexKey(h)]?.elevation ?? 1),
  );
  const highGroundBonus = atkElev > defElev;
  const highGroundMult = highGroundBonus ? 1.25 : 1;
  if (highGroundBonus) {
    hookCtx.notes.push('高地压制(+25%)');
  }

  // 冲锋增伤（Charge）：近战突进每移动 1 格伤害 +5%（上限 +45%）
  const chargeMult =
    !isRanged && attacker.abilities.charge && chargeSteps > 0
      ? 1 + Math.min(0.45, chargeSteps * 0.05)
      : 1;
  if (chargeMult > 1) {
    hookCtx.notes.push(`冲锋突击(+${Math.round((chargeMult - 1) * 100)}%)`);
  }

  // 屠龙魔刃（Slayer）与巨人杀手（Giant Slayer）：攻击 4 阶巨兽时各提供 +50% 伤害
  const defenderTier = defender.kind === 'creature' ? catalog.creatures[defender.defId]?.tier ?? 1 : 0;
  const slayerMult = attacker.statusEffects?.slayer && defenderTier >= 4 ? 1.5 : 1;
  if (slayerMult > 1) {
    hookCtx.notes.push('屠龙魔刃(+50%)');
  }
  const giantSlayerMult = attacker.abilities.giantSlayer && defenderTier >= 4 ? 1.5 : 1;
  if (giantSlayerMult > 1) {
    hookCtx.notes.push('巨人杀手(+50%)');
  }

  // 净秽裁决（秩序净秽者专属）：远程攻击非秩序阵营单位时额外造成 +20% 伤害
  const orderPurgeMult =
    isRanged && attacker.abilities.orderPurgeRanged && defender.alignment !== 'order' ? 1.2 : 1;
  if (orderPurgeMult > 1) {
    hookCtx.notes.push('净秽裁决(+20%)');
  }

  // 不死炎缠（Fire Aura）：近战攻击额外附加 +25% 火焰灼烧伤害（火免除外）
  const fireAuraMult = !isRanged && attacker.statusEffects?.fireAura && !defender.abilities.fireResistant ? 1.25 : 1;
  if (fireAuraMult > 1) {
    hookCtx.notes.push('不死炎缠(+25%)');
  }

  // 鬼神狂战 / 百鬼狂潮（Bloodlust / Bloodfrenzy）：严格仅加成近战伤害 +25%，绝不加成远程射击！
  const bloodlustMult = !isRanged && (attacker.statusEffects?.bloodlustRounds ?? 0) > 0 ? 1.25 : 1;
  if (bloodlustMult > 1) {
    hookCtx.notes.push('鬼神狂战(+25%近战)');
  }

  // 影遁潜行（Stealth）、子技能「潜行」与蜃气残影（Blur）：受远程弹幕射击伤害额外减免
  const stealthMult = isRanged && defender.abilities.stealth ? 0.85 : 1;
  if (stealthMult < 1) {
    hookCtx.notes.push('影遁减伤(-15%)');
  }
  const defenderStealthSub = defender.kind === 'hero' ? (defender.subSkills?.stealth ?? 0) : 0;
  const subStealthMult = isRanged && defenderStealthSub > 0 ? Math.max(0.65, 1 - defenderStealthSub * 0.06) : 1;
  if (subStealthMult < 1) {
    hookCtx.notes.push(`潜行规避(-${Math.round((1 - subStealthMult) * 100)}%)`);
  }
  const blurMult = isRanged && defender.statusEffects?.blur ? 0.65 : 1;
  if (blurMult < 1) {
    hookCtx.notes.push('蜃气残影(-35%)');
  }

  // 英雄子技能「近战 / 射击」与激活进阶职业专属物理伤害倍率
  let heroCombatSkillMult = 1;
  if (attacker.kind === 'hero') {
    const atkCls = resolveActiveHeroClass(
      attacker.skills,
      attacker.subSkills,
      catalog.advancedClasses,
      attacker.selectedAdvancedClassId,
    );
    if (!isRanged) {
      const mRank = attacker.subSkills?.melee ?? 0;
      if (mRank > 0) {
        heroCombatSkillMult += mRank * 0.12;
        hookCtx.notes.push(`近战专精(+${mRank * 12}%)`);
      }
      if (atkCls?.passive?.heroMeleeDamagePct) {
        heroCombatSkillMult += atkCls.passive.heroMeleeDamagePct;
      }
    } else {
      const aRank = attacker.subSkills?.archery ?? 0;
      if (aRank > 0) {
        heroCombatSkillMult += aRank * 0.12;
        hookCtx.notes.push(`射击专精(+${aRank * 12}%)`);
      }
      if (atkCls?.passive?.heroRangedDamagePct) {
        heroCombatSkillMult += atkCls.passive.heroRangedDamagePct;
      }
    }
  }

  // 英雄 P 点火力加成（每 1.0 P 点提供 +5% 通用输出）
  const powerMult = attacker.kind === 'hero' ? 1 + (attacker.powerPoints ?? 0) * 0.05 : 1;

  // 远程单位被迫近身肉搏时伤害衰减（英雄或拥有「近战无衰减」特技者免衰减）
  const meleePenalty =
    !isRanged && attacker.abilities.ranged && !attacker.abilities.noMeleePenalty && attacker.kind === 'creature'
      ? 0.65
      : 1;
  if (meleePenalty < 1) {
    hookCtx.notes.push('射手近战衰减(-35%)');
  }

  // 正统 HoMM4 士气伤害修正：高士气 +25%（×1.25），低士气 -20%（×0.80）
  const moraleMult =
    attacker.roundMoraleState === 'good'
      ? 1.25
      : attacker.roundMoraleState === 'bad'
        ? 0.8
        : 1;
  if (moraleMult > 1) {
    hookCtx.notes.push('高士气(+25%)');
  } else if (moraleMult < 1) {
    hookCtx.notes.push('低士气(-20%)');
  }

  // 东方「暗系」特质：对非暗系、非四大特殊类型（机械/不死/元素/幻象）的活体单位额外造成 +15% 伤害
  const darkVsLivingMult = isDarkBonusTarget(attacker, defender) ? DARK_VS_LIVING_DAMAGE_MULT : 1;
  if (darkVsLivingMult > 1) {
    hookCtx.notes.push('暗系蚀生(+15%)');
  }

  // 寒冰抗性：承受寒霜攻击伤害减半
  const coldResistMult = attacker.abilities.freezingAttack && defender.abilities.coldResistant ? 0.5 : 1;
  if (coldResistMult < 1) {
    hookCtx.notes.push('寒冰抗性(-50%)');
  }

  // 平衡模式微调：equilibris_tuned 略微收敛单英雄极值，保持小兵战略价值
  const balanceMult =
    state.balancePreset === 'equilibris_tuned' && attacker.kind === 'hero' ? 0.94 : 1;

  const totalMult =
    atkDefRatio *
    highGroundMult *
    chargeMult *
    slayerMult *
    giantSlayerMult *
    orderPurgeMult *
    fireAuraMult *
    bloodlustMult *
    stealthMult *
    subStealthMult *
    blurMult *
    heroCombatSkillMult *
    powerMult *
    meleePenalty *
    moraleMult *
    darkVsLivingMult *
    coldResistMult *
    balanceMult *
    (isRanged ? losMultiplier * rangePenalty : 1) *
    hookCtx.damageMultiplier;

  const count = Math.max(1, attacker.count);
  let minDamage = Math.max(1, Math.round(atkStats.minDamage * count * totalMult));
  let maxDamage = Math.max(minDamage, Math.round(atkStats.maxDamage * count * totalMult));

  // H4 神祝满盈（Bless）锁定最大伤害；厄祟缠身（Curse）锁定最小伤害！
  if (attacker.statusEffects?.bless && !attacker.statusEffects?.curse) {
    minDamage = maxDamage;
    hookCtx.notes.push('神祝(满伤)');
  } else if (attacker.statusEffects?.curse && !attacker.statusEffects?.bless) {
    maxDamage = minDamage;
    hookCtx.notes.push('厄祟(低伤)');
  }

  return { minDamage, maxDamage, highGroundBonus, notes: hookCtx.notes };
}

/**
 * 估算指定伤害对目标造成的减员数（不改动状态）
 */
function simulateKills(
  target: BattleUnit,
  damage: number,
  maxHpPerUnit: number,
): number {
  if (target.status !== 'alive' || damage <= 0) return 0;
  const totalHp = (target.count - 1) * maxHpPerUnit + target.currentHp;
  const remaining = Math.max(0, totalHp - damage);
  if (remaining === 0) return target.count;
  const newCount = Math.ceil(remaining / maxHpPerUnit);
  return Math.max(0, target.count - newCount);
}

/**
 * 真正将伤害施加到目标单位（完整支持殉道替伤、致盲/和平破控、天国圣盾吸收、守护天使救赎、英雄倒地与符卡收取）
 */
function applyDamageToUnit(
  state: BattleState,
  target: BattleUnit,
  damage: number,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
  allowMartyrRedirect = true,
): number {
  if (target.status !== 'alive' || damage <= 0) return 0;

  // H4 替身雏偶（Martyr）：由承伤替身友军代为承受全部伤害
  if (allowMartyrRedirect && target.statusEffects?.martyrProtectedByUnitId) {
    const martyr = state.units[target.statusEffects.martyrProtectedByUnitId];
    if (martyr && martyr.status === 'alive' && martyr.id !== target.id && martyr.side === target.side) {
      state.actionLog.push(`✝ 「替身雏偶」生效：${martyr.name} 替 ${target.name} 承受了 ${damage} 点伤害！`);
      return applyDamageToUnit(state, martyr, damage, catalog, events, false);
    }
    target.statusEffects.martyrProtectedByUnitId = undefined;
  }

  // 遭受伤害立刻打断「宵暗蔽目」与「镇魂神乐」控制
  if (target.statusEffects?.blindRounds && target.statusEffects.blindRounds > 0) {
    target.statusEffects.blindRounds = 0;
    state.actionLog.push(`${target.name} 受创惊醒，破除了「宵暗蔽目」！`);
  }
  if (target.statusEffects?.songOfPeaceRounds && target.statusEffects.songOfPeaceRounds > 0) {
    target.statusEffects.songOfPeaceRounds = 0;
  }

  // H4 二重结界（Heavenly Shield）：优先消耗结界护盾值抵挡伤害
  let effectiveDamage = damage;
  if (target.statusEffects?.tempShieldHp && target.statusEffects.tempShieldHp > 0) {
    const absorbed = Math.min(target.statusEffects.tempShieldHp, effectiveDamage);
    target.statusEffects.tempShieldHp -= absorbed;
    effectiveDamage -= absorbed;
    if (absorbed > 0) {
      state.actionLog.push(`🛡 「二重结界」为 ${target.name} 吸收了 ${absorbed} 点伤害（剩余护盾 ${target.statusEffects.tempShieldHp}）！`);
    }
    if (effectiveDamage <= 0) return 0;
  }

  const stats = computeUnitStats(target, state, catalog);
  const maxHp = stats.maxHp;
  const oldCount = target.count;
  const totalHp = (target.count - 1) * maxHp + target.currentHp;
  const remaining = Math.max(0, totalHp - effectiveDamage);

  if (remaining <= 0) {
    // H4 御神护命（Guardian Angel）：致命全灭瞬间神使降临，立即保留/复活 35% 兵力！
    if (target.statusEffects?.guardianAngelLives && target.statusEffects.guardianAngelLives > 0) {
      target.statusEffects.guardianAngelLives -= 1;
      const savedCount = Math.max(1, Math.ceil(target.maxCount * 0.35));
      target.count = savedCount;
      target.currentHp = maxHp;
      state.actionLog.push(
        `👼 「御神护命」降临救赎 ${target.name}！抵消全灭并重聚 ${savedCount} 名战力（剩余护命 ${target.statusEffects.guardianAngelLives} 次）！`,
      );
      return Math.max(0, oldCount - savedCount);
    }

    target.count = 0;
    target.currentHp = 0;
    if (target.kind === 'hero') {
      // H4 灵魂机制：英雄不直接删除，进入满身疮痍/可被俘状态，并清空 P 点
      target.status = 'knocked_out';
      target.powerPoints = 0;
      events.push({ type: 'UNIT_KNOCKED_OUT', unitId: target.id });
      state.actionLog.push(`${target.name} 满身疮痍倒下，P 点散落！`);

      // 检查是否达成「符卡收取 Bonus」（在敌方英雄符卡领域持续期间将其击倒）
      if (
        state.activeFieldAura &&
        state.activeFieldAura.casterUnitId === target.id &&
        !state.activeFieldAura.captured
      ) {
        state.activeFieldAura.captured = true;
        const capturerSide: SideId = target.side === 'left' ? 'right' : 'left';
        const bonusText = '敌方符卡收取成功！己方存活英雄 P 点 +1.0、灵力 +10！';
        state.capturedSpellCards.push({
          spellCardName: state.activeFieldAura.name,
          bySide: capturerSide,
          bonusText,
        });
        for (const u of Object.values(state.units)) {
          if (u.side === capturerSide && u.status === 'alive' && u.kind === 'hero') {
            const uStats = computeUnitStats(u, state, catalog);
            u.powerPoints = Math.min(u.maxPowerPoints ?? 4, (u.powerPoints ?? 0) + 1.0);
            u.mana = Math.min(uStats.maxMana, (u.mana ?? 0) + 10);
          }
        }
        events.push({
          type: 'SPELL_CARD_CAPTURED',
          spellCardName: state.activeFieldAura.name,
          bySide: capturerSide,
          bonusText,
        });
        state.actionLog.push(`★ 符卡收取成功！击破 ${state.activeFieldAura.name}，${bonusText}`);
      }
    } else {
      target.status = 'dead';
      events.push({ type: 'UNIT_DIED', unitId: target.id });
      state.actionLog.push(`${target.name} 全军覆没。`);
    }
    return oldCount;
  }

  const newCount = Math.ceil(remaining / maxHp);
  const topHp = remaining - (newCount - 1) * maxHp;
  target.count = newCount;
  target.currentHp = topHp;
  return oldCount - newCount;
}

/**
 * 获取攻击者近战攻击目标时的全部合法可达落脚锚点（原生支持 1x1~2x2 任意多格体积与 H4 长武器隔格攻击！）
 */
export function getValidMeleeApproachAnchors(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  catalog: CombatContentCatalog,
): HexCoord[] {
  const reachable = getUnitReachableMap(state, attacker, catalog);
  const defHexes = getUnitOccupiedHexes(defender);
  const maxReach = attacker.abilities.longWeapon ? 2 : 1;
  const result: HexCoord[] = [];

  for (const key of reachable.costs.keys()) {
    const tile = state.tiles[key];
    if (!tile) continue;
    const anchor: HexCoord = { q: tile.q, r: tile.r };
    const candidateHexes = getFootprintHexes(anchor, attacker.footprint);
    const dist = minHexSetDistance(candidateHexes, defHexes);
    if (dist >= 1 && dist <= maxReach) {
      result.push(anchor);
    }
  }
  return result;
}

/**
 * 寻找攻击者近战攻击目标时，战术最优的可落脚锚格（长武器单位优先停在隔 1 格免反击位！）
 */
export function findBestMeleeApproachHex(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  catalog: CombatContentCatalog,
  preferredHex?: HexCoord,
): HexCoord | null {
  const candidates = getValidMeleeApproachAnchors(state, attacker, defender, catalog);
  if (candidates.length === 0) return null;

  if (preferredHex) {
    const matched = candidates.find((c) => hexEquals(c, preferredHex));
    if (matched) return matched;
  }

  // 若攻击者已在合法近战位且未指定改换方位，优先原地直接出手
  const stayHere = candidates.find((c) => hexEquals(c, attacker.pos));
  if (stayHere && (!preferredHex || hexEquals(preferredHex, attacker.pos))) {
    return stayHere;
  }

  const reachable = getUnitReachableMap(state, attacker, catalog);
  const defHexes = getUnitOccupiedHexes(defender);
  const preferSafePoke =
    Boolean(attacker.abilities.longWeapon) &&
    !defender.abilities.longWeapon &&
    !defender.abilities.noMelee;

  let best: HexCoord | null = null;
  let bestScore = Infinity;
  for (const cand of candidates) {
    const k = hexKey(cand);
    const cost = reachable.costs.get(k) ?? 99;
    const candHexes = getFootprintHexes(cand, attacker.footprint);
    const elev = Math.max(...candHexes.map((h) => state.tiles[hexKey(h)]?.elevation ?? 1));
    const distToDef = minHexSetDistance(candHexes, defHexes);
    const safePokeBonus = preferSafePoke && distToDef === 2 ? 45 : 0;
    const score = cost * 10 - elev * 4 - safePokeBonus;
    if (score < bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  return best;
}

/**
 * 判定单位在本回合是否仍保有反击次数
 * 原版 HoMM4 规则：普通单位每回合近战与远程反击共用 1 次配额；仅携带「无限反击」特技的单位不受次数限制。
 */
export function canUnitRetaliateThisRound(unit: BattleUnit): boolean {
  return Boolean(unit.abilities.unlimitedRetaliation) || !unit.hasRetaliatedThisRound;
}

/**
 * 判定攻防双方的结算模式（同时反击 / 攻击方先攻 / 防守方先攻 / 单向无反击）
 * 严格区分近战先攻（firstStrike）与远程先攻（rangedFirstStrike），并完整支持破先攻（negateFirstStrike）！
 */
function resolveExchangeMode(
  attacker: BattleUnit,
  defender: BattleUnit,
  willRetaliate: boolean,
  isRanged: boolean,
): 'simultaneous' | 'attacker_first' | 'defender_first' | 'one_way' {
  if (!willRetaliate) return 'one_way';
  const atkRawFS = isRanged
    ? Boolean(attacker.abilities.rangedFirstStrike)
    : Boolean(attacker.abilities.firstStrike);
  const defRawFS = isRanged
    ? Boolean(defender.abilities.rangedFirstStrike)
    : Boolean(defender.abilities.firstStrike);
  const atkFS = atkRawFS && !defender.abilities.negateFirstStrike;
  const defFS = defRawFS && !attacker.abilities.negateFirstStrike;
  if (atkFS && !defFS) return 'attacker_first';
  if (!atkFS && defFS) return 'defender_first';
  return 'simultaneous';
}

/**
 * 攻击预估器：UI 鼠标悬停敌方单位时实时计算精确伤害与同时反击风险
 */
/** 毒瘴妖等「剧毒喷射」每单位基础剧毒威力（对标 H4 毒液怪：无视物理防御、命中瞬发首段毒伤并每回合持续流血） */
export const POISON_ATTACK_DAMAGE_PER_UNIT = 13;

/** 计算剧毒喷射单次毒伤（按施毒方兵力独立结算，无视物理防御，正常受抗死结界与魔法抗性减免） */
export function computePoisonAttackDamage(
  striker: BattleUnit,
  victim: BattleUnit,
  state: BattleState,
  catalog: CombatContentCatalog,
  strikerCountOverride?: number,
): number {
  const unitCount = Math.max(1, strikerCountOverride ?? striker.count);
  let dmg = unitCount * POISON_ATTACK_DAMAGE_PER_UNIT;
  if (victim.abilities.deathWard || victim.statusEffects?.schoolWards?.death) {
    dmg *= 0.5;
  }
  const vStats = computeUnitStats(victim, state, catalog);
  dmg *= Math.max(0, 1 - vStats.magicResistance);
  return Math.max(1, Math.round(dmg));
}

export function previewAttack(
  state: BattleState,
  attackerId: string,
  targetId: string,
  catalog: CombatContentCatalog,
  preferredMoveTo?: HexCoord,
  forceMelee = false,
): AttackPreview {
  const invalid = (reason: string): AttackPreview => ({
    valid: false,
    reason,
    isRanged: false,
    rangedPenaltyTier: 'full',
    rangedMultiplier: 1,
    exchangeMode: 'one_way',
    expectedMinDamage: 0,
    expectedMaxDamage: 0,
    expectedMinKills: 0,
    expectedMaxKills: 0,
    willRetaliate: false,
    retaliationMinDamage: 0,
    retaliationMaxDamage: 0,
    retaliationMinKills: 0,
    retaliationMaxKills: 0,
    losStatus: 'blocked',
    highGroundBonus: false,
    targetGrazeChance: 0,
    notes: [],
  });

  const attacker = state.units[attackerId];
  const defender = state.units[targetId];
  if (!attacker || !defender || attacker.status !== 'alive' || defender.status !== 'alive') {
    return invalid('无效目标');
  }
  if (attacker.side === defender.side) {
    return invalid('不可攻击友军');
  }
  if (defender.statusEffects?.sanctuary) {
    return invalid('目标隐于「常世净域」，不可被攻击');
  }
  if (attacker.statusEffects?.songOfPeaceRounds && attacker.statusEffects.songOfPeaceRounds > 0) {
    return invalid('受「镇魂神乐」安抚，当前无法发起攻击');
  }
  if (attacker.statusEffects?.cowardiceRounds && attacker.statusEffects.cowardiceRounds > 0) {
    const aS = computeUnitStats(attacker, state, catalog);
    const dS = computeUnitStats(defender, state, catalog);
    const atkTotalHp = (attacker.count - 1) * aS.maxHp + attacker.currentHp;
    const defTotalHp = (defender.count - 1) * dS.maxHp + defender.currentHp;
    if (defTotalHp > atkTotalHp) {
      return invalid('受「畏惧之瞳」震慑，不敢攻击总生命更高的敌军');
    }
  }

  // 1. 优先检测是否可远程射击（若主动切换为强制近战或指定了近战落脚格则走近战）
  const rangedCheck = checkRangedCapability(state, attacker, defender, catalog);
  const useRanged = !forceMelee && !preferredMoveTo && rangedCheck.canRanged;

  let finalAtkPos = attacker.pos;
  let movePath: HexCoord[] | undefined;

  if (!useRanged) {
    if (attacker.abilities.noMelee) {
      const hasAmmo = Boolean(attacker.abilities.unlimitedShots) || attacker.ammo > 0;
      if (attacker.abilities.ranged && !hasAmmo) {
        return invalid('弹药已耗尽且近战禁手，无法攻击');
      }
      if (attacker.abilities.ranged && rangedCheck.los.status === 'blocked') {
        return invalid('视线被高耸障碍或单位阻挡');
      }
      return invalid('近战禁手：无法发起近战攻击');
    }
    const approach = findBestMeleeApproachHex(state, attacker, defender, catalog, preferredMoveTo);
    if (!approach) {
      // 即使超出本回合移动/射程或被视线阻挡，仍按原版 H4 习惯计算理论交锋预估伤害范围与折损数（保持 valid: false）
      const blockedReason = forceMelee
        ? '超出本回合近战移动范围'
        : attacker.abilities.ranged && rangedCheck.los.status === 'blocked' && rangedCheck.distance > 1
          ? '视线被障碍物完全阻挡'
          : '超出本回合移动与攻击范围';
      const atkHasAmmoHyp = Boolean(attacker.abilities.unlimitedShots) || attacker.ammo > 0;
      const defHasAmmoHyp = Boolean(defender.abilities.unlimitedShots) || defender.ammo > 0;
      const hypotheticalRanged = Boolean(
        !forceMelee && attacker.abilities.ranged && !attacker.abilities.noRanged && atkHasAmmoHyp && rangedCheck.distance > 1,
      );
      const hypAtk = calculateDamageRange(
        state,
        attacker,
        defender,
        attacker.pos,
        hypotheticalRanged,
        1,
        1,
        catalog,
      );
      const defStatsHyp = computeUnitStats(defender, state, catalog);
      const atkStatsHyp = computeUnitStats(attacker, state, catalog);
      const hypWillRet =
        !attacker.abilities.noRetaliation &&
        canUnitRetaliateThisRound(defender) &&
        (!hypotheticalRanged || Boolean(defender.abilities.ranged && !defender.abilities.noRanged && defHasAmmoHyp));
      const hypRet = hypWillRet
        ? calculateDamageRange(state, defender, attacker, defender.pos, hypotheticalRanged, 1, 1, catalog)
        : { minDamage: 0, maxDamage: 0 };
      const hypMode = resolveExchangeMode(attacker, defender, hypWillRet, hypotheticalRanged);
      return {
        valid: false,
        reason: blockedReason,
        isRanged: hypotheticalRanged,
        rangedPenaltyTier: hypotheticalRanged ? rangedCheck.penaltyTier : 'full',
        rangedMultiplier: hypotheticalRanged ? Math.max(0.125, rangedCheck.rangePenalty || 1) : 1,
        exchangeMode: hypMode,
        expectedMinDamage: hypAtk.minDamage,
        expectedMaxDamage: hypAtk.maxDamage,
        expectedMinKills: simulateKills(defender, hypAtk.minDamage, defStatsHyp.maxHp),
        expectedMaxKills: simulateKills(defender, hypAtk.maxDamage, defStatsHyp.maxHp),
        willRetaliate: hypWillRet,
        retaliationMinDamage: hypRet.minDamage,
        retaliationMaxDamage: hypRet.maxDamage,
        retaliationMinKills: simulateKills(attacker, hypRet.minDamage, atkStatsHyp.maxHp),
        retaliationMaxKills: simulateKills(attacker, hypRet.maxDamage, atkStatsHyp.maxHp),
        losStatus: hypotheticalRanged ? rangedCheck.los.status : 'clear',
        highGroundBonus: hypAtk.highGroundBonus,
        targetGrazeChance: hypotheticalRanged ? defStatsHyp.grazeChance : 0,
        notes: [...hypAtk.notes, blockedReason],
      };
    }
    finalAtkPos = approach;
    if (!hexEquals(approach, attacker.pos)) {
      const reachable = getUnitReachableMap(state, attacker, catalog);
      movePath = reconstructHexPath(reachable, approach) ?? undefined;
    }
  }

  // 冲锋步数：仅近战移动距离参与冲锋增伤计算
  const chargeSteps = !useRanged && movePath && movePath.length > 1 ? movePath.length - 1 : 0;

  // HoMM4 远程倍率已将距离衰减与半遮挡合并为统一四档（1 / 1/2 / 1/4 / 1/8），不再重复叠乘 losMultiplier
  const atkRange = calculateDamageRange(
    state,
    attacker,
    defender,
    finalAtkPos,
    useRanged,
    1,
    useRanged ? rangedCheck.rangePenalty : 1,
    catalog,
    chargeSteps,
  );
  const defStats = computeUnitStats(defender, state, catalog);
  const atkStats = computeUnitStats(attacker, state, catalog);

  // 双重攻击（Two Attacks）在预测阶段将预期总伤害近似翻倍展示
  const strikeCountMult = attacker.abilities.doubleStrike ? 2 : 1;
  const totalMinDmg = atkRange.minDamage * strikeCountMult;
  const totalMaxDmg = atkRange.maxDamage * strikeCountMult;

  // 判断近战出手时的实际距离（用于 H4 长武器隔格攻击免反击判定！）
  const finalMeleeDist = minHexSetDistance(
    getFootprintHexes(finalAtkPos, attacker.footprint),
    getUnitOccupiedHexes(defender),
  );
  const defenderMeleeReach = defender.abilities.longWeapon ? 2 : 1;
  const isLongWeaponPoke = !useRanged && finalMeleeDist > defenderMeleeReach;

  // 判断防守方是否触发反击（普通单位每回合近战与远程共用 1 次反击，仅无限反击特技不限次数；长武器隔格、死灵恐惧或恐惧灵气会压制反击）
  const fearSuppressRetaliation = Boolean(
    !useRanged &&
      (attacker.statusEffects?.auraOfFear || attacker.abilities.fearAttack) &&
      !isImmuneToLivingEffects(defender) &&
      !defender.abilities.magicImmune,
  );
  const defenderRetaliationReady = canUnitRetaliateThisRound(defender);
  let willRetaliate = false;
  let retaliationTarget: BattleUnit = attacker;
  let retaliationInterceptedBy: BattleUnit | null = null;
  let retRange = { minDamage: 0, maxDamage: 0, highGroundBonus: false, notes: [] as string[] };
  if (!attacker.abilities.noRetaliation && !fearSuppressRetaliation && defenderRetaliationReady) {
    if (!useRanged) {
      if (!defender.abilities.noMelee && !isLongWeaponPoke) {
        willRetaliate = true;
        retRange = calculateDamageRange(state, defender, attacker, defender.pos, false, 1, 1, catalog);
      }
    } else {
      const defRet = evaluateRangedRetaliation(state, defender, attacker, catalog);
      if (defRet.canRetaliate) {
        willRetaliate = true;
        retaliationTarget = defRet.actualTarget;
        retaliationInterceptedBy = defRet.interceptedBy;
        retRange = calculateDamageRange(
          state,
          defender,
          retaliationTarget,
          defender.pos,
          true,
          1,
          defRet.rangePenalty,
          catalog,
        );
      }
    }
  }

  const retTargetStats =
    retaliationTarget.id === attacker.id
      ? atkStats
      : computeUnitStats(retaliationTarget, state, catalog);

  const exchangeMode = resolveExchangeMode(attacker, defender, willRetaliate, useRanged);
  const atkRawFS = useRanged
    ? Boolean(attacker.abilities.rangedFirstStrike)
    : Boolean(attacker.abilities.firstStrike);
  const defRawFS = useRanged
    ? Boolean(defender.abilities.rangedFirstStrike)
    : Boolean(defender.abilities.firstStrike);
  const notes = [...atkRange.notes];
  if (fearSuppressRetaliation) {
    notes.push(attacker.abilities.fearAttack ? '死灵恐惧(免反击)' : '幽冥威慑(免反击)');
  }
  if (!defenderRetaliationReady) notes.push('敌方本巡已反击');
  if (retaliationInterceptedBy) notes.push(`前卫替伤(${retaliationInterceptedBy.name})`);
  if (useRanged && rangedCheck.penaltyTier === 'half') notes.push('远程衰减 1/2');
  if (useRanged && rangedCheck.penaltyTier === 'quarter') notes.push('远程衰减 1/4');
  if (useRanged && rangedCheck.penaltyTier === 'eighth') notes.push('远程衰减 1/8');
  if (useRanged && attacker.abilities.longRange) notes.push('精准无衰减');
  if (useRanged && attacker.abilities.noObstaclePenalty) notes.push('无视普通障碍');
  if (isLongWeaponPoke) notes.push('长手隔格(免反击)');
  if (attacker.abilities.doubleStrike) notes.push('双重攻击(×2)');
  if (!useRanged && attacker.abilities.multipleAttack) notes.push('周身全扫');
  if (!useRanged && attacker.abilities.threeHeadedAttack) notes.push('三翼裂袭');
  if (!useRanged && attacker.abilities.breathAttack) notes.push('龙息贯穿');
  if (!useRanged && attacker.abilities.lifeDraining && !isImmuneToLivingEffects(defender)) notes.push('吸血复苏(50%)');
  if (attacker.abilities.poisonAttack && !isImmuneToLivingEffects(defender) && !defender.abilities.magicImmune) {
    const previewPoison = computePoisonAttackDamage(attacker, defender, state, catalog);
    notes.push(`剧毒喷射(瞬发+${previewPoison}/每回${previewPoison})`);
  }
  if (!useRanged && attacker.abilities.agingOnHit && !isImmuneToLivingEffects(defender) && !defender.abilities.magicImmune) notes.push('衰老触碰');
  if (!useRanged && attacker.abilities.freezingAttack && !defender.abilities.coldResistant && !defender.abilities.magicImmune) notes.push('寒霜冻结');
  if (!useRanged && defender.abilities.fireShield && !attacker.abilities.fireResistant && !attacker.abilities.magicImmune) {
    notes.push('敌方烈焰反伤!');
  }
  if (defender.abilities.block) notes.push('敌方格挡(35%)');
  if (attacker.abilities.noRetaliation) notes.push('不受反击');
  if (attacker.abilities.negateFirstStrike && defRawFS) notes.push('破先攻生效');
  if (defender.abilities.negateFirstStrike && atkRawFS) notes.push(useRanged ? '远程先攻被破除' : '先攻被破除');
  if (exchangeMode === 'simultaneous') notes.push('同时反击');
  if (exchangeMode === 'attacker_first') notes.push(useRanged ? '我方远程先攻压制' : '我方先攻压制');
  if (exchangeMode === 'defender_first') notes.push(useRanged ? '敌方远程先攻警告!' : '敌方先攻警告!');

  return {
    valid: true,
    isRanged: useRanged,
    isLongWeaponPoke,
    rangedPenaltyTier: useRanged ? rangedCheck.penaltyTier : 'full',
    rangedMultiplier: useRanged ? rangedCheck.rangePenalty : 1,
    moveTo: hexEquals(finalAtkPos, attacker.pos) ? undefined : finalAtkPos,
    movePath,
    exchangeMode,
    expectedMinDamage: totalMinDmg,
    expectedMaxDamage: totalMaxDmg,
    expectedMinKills: simulateKills(defender, totalMinDmg, defStats.maxHp),
    expectedMaxKills: simulateKills(defender, totalMaxDmg, defStats.maxHp),
    willRetaliate,
    retaliationTargetId: retaliationInterceptedBy ? retaliationInterceptedBy.id : undefined,
    retaliationTargetName: retaliationInterceptedBy ? retaliationInterceptedBy.name : undefined,
    retaliationMinDamage: retRange.minDamage,
    retaliationMaxDamage: retRange.maxDamage,
    retaliationMinKills: simulateKills(retaliationTarget, retRange.minDamage, retTargetStats.maxHp),
    retaliationMaxKills: simulateKills(retaliationTarget, retRange.maxDamage, retTargetStats.maxHp),
    losStatus: useRanged ? rangedCheck.los.status : 'clear',
    highGroundBonus: atkRange.highGroundBonus,
    targetGrazeChance: useRanged ? defStats.grazeChance : 0,
    notes,
  };
}

/**
 * 按当前单位快照计算一次正式的打击伤害（不直接修改目标 HP，支持两阶段同时反击与全 H4 特技！）
 */
function rollStrikeDamage(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  isRanged: boolean,
  isRetaliation: boolean,
  losMultiplier: number,
  losStatus: 'clear' | 'partial' | 'blocked',
  rangePenalty: number,
  catalog: CombatContentCatalog,
  chargeSteps = 0,
  extraMult = 1,
): StrikeReport {
  const range = calculateDamageRange(
    state,
    attacker,
    defender,
    attacker.pos,
    isRanged,
    losMultiplier,
    rangePenalty,
    catalog,
    chargeSteps,
  );
  const atkStats = computeUnitStats(attacker, state, catalog);
  const defStats = computeUnitStats(defender, state, catalog);

  // H4 绝对格挡（Block：35% 概率彻底挡下本次物理/远程打击！）
  if (defender.abilities.block && nextRandom(state.rng) < 0.35) {
    return {
      attackerId: attacker.id,
      defenderId: defender.id,
      damage: 0,
      kills: 0,
      isRanged,
      isRetaliation,
      grazed: false,
      grazeManaGain: 0,
      luckyCrit: false,
      highGroundBonus: range.highGroundBonus,
      losStatus,
      traitNotes: [...range.notes, '绝对格挡!'],
      blocked: true,
    };
  }

  let damage = Math.max(1, Math.round(nextInt(state.rng, range.minDamage, range.maxDamage) * extraMult));

  // HoMM4 攻防双向幸运与厄运检定（单一事实来源概率公式）
  const atkRates = computeMoraleLuckRates(
    atkStats.morale,
    atkStats.luck,
    state.balancePreset,
    isImmuneToMorale(attacker),
  );
  const defRates = computeMoraleLuckRates(
    defStats.morale,
    defStats.luck,
    state.balancePreset,
    isImmuneToMorale(defender),
  );

  let luckyCrit = false;
  let unluckyHit = false;
  if (atkRates.attackLuckChance > 0 && nextRandom(state.rng) < atkRates.attackLuckChance) {
    luckyCrit = true;
    damage = Math.max(1, Math.round(damage * 1.5));
    range.notes.push('幸运暴击 ×1.5');
  } else if (atkRates.attackBadLuckChance > 0 && nextRandom(state.rng) < atkRates.attackBadLuckChance) {
    unluckyHit = true;
    damage = Math.max(1, Math.round(damage * 0.5));
    range.notes.push('厄运减半 ×0.5');
  }

  // HoMM4 防守方幸运护身（受击伤害减半）与防守厄运破防（受击伤害 +25%）
  let defenderLucky = false;
  let defenderUnlucky = false;
  if (defRates.defenseLuckChance > 0 && nextRandom(state.rng) < defRates.defenseLuckChance) {
    defenderLucky = true;
    damage = Math.max(1, Math.round(damage * 0.5));
    range.notes.push('幸运护身 ×0.5');
  } else if (defRates.defenseBadLuckChance > 0 && nextRandom(state.rng) < defRates.defenseBadLuckChance) {
    defenderUnlucky = true;
    damage = Math.max(1, Math.round(damage * 1.25));
    range.notes.push('厄运破防 ×1.25');
  }

  // 东方融合机制：擦弹判定（主要针对远程弹幕，触发时减伤 25% 并反向为己方英雄补充灵力与符卡充能！）
  let grazed = false;
  let grazeManaGain = 0;
  if (isRanged && defStats.grazeChance > 0) {
    if (nextRandom(state.rng) < defStats.grazeChance) {
      grazed = true;
      damage = Math.max(1, Math.round(damage * 0.75));
      grazeManaGain = 3;
    }
  }

  // H4 命中特效判定（机械/不死/元素/幻象与全魔免免疫心智/石化/恐惧/衰老控场！）
  const immuneToControl = Boolean(isImmuneToLivingEffects(defender) || defender.abilities.magicImmune);
  let petrifyKills = 0;
  let appliedStatus: 'stunned' | 'terrified' | 'frozen' | 'aged' | 'poisoned' | undefined;

  // 寒霜冻结（深渊冰魔）：非寒冰抗性且非魔免目标 30% 概率冻结 2 回合
  if (!isRanged && attacker.abilities.freezingAttack && !defender.abilities.coldResistant && !defender.abilities.magicImmune) {
    if (nextRandom(state.rng) < 0.3) {
      appliedStatus = 'frozen';
    }
  }

  if (!immuneToControl) {
    // 魔眼石化（Stone Gaze）：18% 概率额外石化即死 1~2 名敌兵（对英雄转为 +20% 咒蚀伤害）
    if (attacker.abilities.stoneGaze && nextRandom(state.rng) < 0.18) {
      if (defender.kind === 'creature') {
        petrifyKills = nextInt(state.rng, 1, 2);
      } else {
        damage = Math.round(damage * 1.2);
      }
    }

    // 噩梦震慑（Terror）：近战命中 38% 概率震慑 1 回合
    if (!appliedStatus && !isRanged && attacker.abilities.terrorOnHit && nextRandom(state.rng) < 0.38) {
      appliedStatus = 'terrified';
    } else if (!appliedStatus && !isRanged && attacker.abilities.stunOnHit) {
      // 符箓定身（Stun）：按伤害占比 28%~65% 概率定身 1 回合
      const totalDefHp = Math.max(1, (defender.count - 1) * defStats.maxHp + defender.currentHp);
      const stunChance = Math.min(0.65, 0.28 + (damage / totalDefHp) * 0.35);
      if (nextRandom(state.rng) < stunChance) {
        appliedStatus = 'stunned';
      }
    } else if (!appliedStatus && !isRanged && attacker.abilities.agingOnHit && nextRandom(state.rng) < 0.35) {
      // 衰老触碰（怨灵）：35% 概率使活体敌军衰老 3 回合
      appliedStatus = 'aged';
    }
  }

  return {
    attackerId: attacker.id,
    defenderId: defender.id,
    damage,
    kills: 0, // 实际减员数在 ApplyPhase 填回
    isRanged,
    isRetaliation,
    grazed,
    grazeManaGain,
    luckyCrit,
    unluckyHit: unluckyHit || undefined,
    defenderLucky: defenderLucky || undefined,
    defenderUnlucky: defenderUnlucky || undefined,
    highGroundBonus: range.highGroundBonus,
    losStatus,
    traitNotes: range.notes,
    blocked: false,
    petrifyKills: petrifyKills > 0 ? petrifyKills : undefined,
    appliedStatus,
  };
}

/** 对存活小兵堆叠施加石化即死等额外折损人数 */
function applyBonusKills(
  state: BattleState,
  target: BattleUnit,
  bonusKills: number,
  events: CombatEvent[],
): number {
  if (target.status !== 'alive' || target.kind !== 'creature' || bonusKills <= 0) return 0;
  const actual = Math.min(target.count, bonusKills);
  target.count -= actual;
  if (target.count <= 0) {
    target.count = 0;
    target.currentHp = 0;
    target.status = 'dead';
    events.push({ type: 'UNIT_DIED', unitId: target.id });
    state.actionLog.push(`${target.name} 在魔眼石化下全军化作雕像！`);
  }
  return actual;
}

/** 命中后施加定身/震慑/冰封/衰老状态（并纳入 20 格 Buff/Debuff FIFO 上限管控） */
function applyHitStatusEffect(
  state: BattleState,
  target: BattleUnit,
  status: 'stunned' | 'terrified' | 'frozen' | 'aged' | 'poisoned' | undefined,
): void {
  if (!status || target.status !== 'alive') return;
  if (status === 'terrified') {
    target.statusEffects.terrifiedRounds = Math.max(target.statusEffects.terrifiedRounds, 1);
    markStatusEffectOrder(target, state, 'terrifiedRounds');
    enforceUnitStatusSlotCap(target);
    state.actionLog.push(`${target.name} 陷入「噩梦震慑」，下回合无法行动且防御下降！`);
  } else if (status === 'stunned') {
    target.statusEffects.stunnedRounds = Math.max(target.statusEffects.stunnedRounds, 1);
    markStatusEffectOrder(target, state, 'stunnedRounds');
    enforceUnitStatusSlotCap(target);
    state.actionLog.push(`${target.name} 被「符箓定身」，下回合将跳过行动！`);
  } else if (status === 'frozen') {
    target.statusEffects.frozenRounds = Math.max(target.statusEffects.frozenRounds ?? 0, 2);
    markStatusEffectOrder(target, state, 'frozenRounds');
    enforceUnitStatusSlotCap(target);
    state.actionLog.push(`❄ ${target.name} 被「寒霜冻结」，2 回合内无法行动！`);
  } else if (status === 'aged') {
    target.statusEffects.agedRounds = 3;
    target.modifiers = target.modifiers.filter((m) => m.spellId !== 'ability:aging');
    const ageMods: Array<Omit<StatModifier, 'id' | 'remainingRounds'>> = [
      { stat: 'attack', mode: 'percent', value: -0.25, sourceName: '特技·衰老触碰', spellPolarity: 'negative', spellId: 'ability:aging' },
      { stat: 'defense', mode: 'percent', value: -0.2, sourceName: '特技·衰老触碰', spellPolarity: 'negative', spellId: 'ability:aging' },
      { stat: 'speed', mode: 'percent', value: -0.5, sourceName: '特技·衰老触碰', spellPolarity: 'negative', spellId: 'ability:aging' },
      { stat: 'initiative', mode: 'percent', value: -0.5, sourceName: '特技·衰老触碰', spellPolarity: 'negative', spellId: 'ability:aging' },
    ];
    ageMods.forEach((m, idx) => {
      target.modifiers.push({
        ...m,
        id: `ability:aging:${state.commandSeq}:${idx}`,
        remainingRounds: 3,
      });
    });
    markStatusEffectOrder(target, state, 'agedRounds');
    enforceUnitStatusSlotCap(target);
    state.actionLog.push(`⏳ ${target.name} 遭受「衰老触碰」，3 回合内攻 -25%、防 -20%、速与先手减半！`);
  }
}

/** 结算近战命中「烈焰护盾」时的自动火焰反伤 */
function resolveFireShield(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  strike: StrikeReport,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): void {
  if (strike.isRanged || strike.blocked || strike.damage <= 0) return;
  if (!defender.abilities.fireShield || attacker.status !== 'alive') return;
  if (attacker.abilities.fireResistant || attacker.abilities.magicImmune) return;

  const fsDamage = Math.max(1, Math.round(strike.damage * 0.22));
  const fsKills = applyDamageToUnit(state, attacker, fsDamage, catalog, events);
  strike.secondaryHits = strike.secondaryHits ?? [];
  strike.secondaryHits.push({
    targetId: attacker.id,
    damage: fsDamage,
    kills: fsKills,
    kind: 'fire_shield',
  });
  const loss = attacker.kind === 'creature' ? `（折损 ${fsKills} 兵）` : '';
  state.actionLog.push(`🔥 ${defender.name} 的「烈焰护盾」灼伤 ${attacker.name}，反弹 ${fsDamage} 点火焰伤害${loss}！`);
}

/** 结算主动近战附带的「周身全扫 (Multiple Attack)」与「贯穿吐息 (Breath Attack)」 */
function resolveAreaMeleeEffects(
  state: BattleState,
  attacker: BattleUnit,
  primaryTarget: BattleUnit,
  strike: StrikeReport,
  chargeSteps: number,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): void {
  if (strike.isRanged) return;
  const secondaryHits: SecondaryHitReport[] = strike.secondaryHits ?? [];

  // 1. 周身全扫（Multiple Attack）：顺劈攻击者周围所有其他相邻敌军（无反击）
  if (attacker.abilities.multipleAttack) {
    const atkHexes = getUnitOccupiedHexes(attacker);
    for (const candidate of Object.values(state.units)) {
      if (candidate.status !== 'alive' || candidate.side === attacker.side || candidate.id === primaryTarget.id) {
        continue;
      }
      if (minHexSetDistance(atkHexes, getUnitOccupiedHexes(candidate)) <= 1) {
        const sub = rollStrikeDamage(
          state,
          attacker,
          candidate,
          false,
          false,
          1,
          'clear',
          1,
          catalog,
          chargeSteps,
          0.85,
        );
        const kills = sub.blocked ? 0 : applyDamageToUnit(state, candidate, sub.damage, catalog, events);
        secondaryHits.push({
          targetId: candidate.id,
          damage: sub.damage,
          kills,
          kind: 'cleave',
          blocked: sub.blocked,
        });
        if (!sub.blocked) {
          handlePostKillRewards(state, attacker, candidate, kills);
          resolveFireShield(state, attacker, candidate, { ...sub, secondaryHits }, catalog, events);
        }
      }
    }
  }

  // 1b. 三翼裂袭（Three-Headed Attack，地狱鸦专属）：同时横扫与攻击者和主目标共同相邻的左右侧敌军（无反击）
  if (attacker.abilities.threeHeadedAttack && !attacker.abilities.multipleAttack) {
    const atkHexes = getUnitOccupiedHexes(attacker);
    const tgtHexes = getUnitOccupiedHexes(primaryTarget);
    for (const candidate of Object.values(state.units)) {
      if (candidate.status !== 'alive' || candidate.side === attacker.side || candidate.id === primaryTarget.id) {
        continue;
      }
      const candHexes = getUnitOccupiedHexes(candidate);
      if (minHexSetDistance(atkHexes, candHexes) <= 1 && minHexSetDistance(tgtHexes, candHexes) <= 1) {
        const sub = rollStrikeDamage(
          state,
          attacker,
          candidate,
          false,
          false,
          1,
          'clear',
          1,
          catalog,
          chargeSteps,
          0.85,
        );
        const kills = sub.blocked ? 0 : applyDamageToUnit(state, candidate, sub.damage, catalog, events);
        secondaryHits.push({
          targetId: candidate.id,
          damage: sub.damage,
          kills,
          kind: 'cleave',
          blocked: sub.blocked,
        });
        if (!sub.blocked) {
          handlePostKillRewards(state, attacker, candidate, kills);
          resolveFireShield(state, attacker, candidate, { ...sub, secondaryHits }, catalog, events);
        }
      }
    }
  }

  // 2. 贯穿吐息（Breath Attack）：沿攻势射线贯穿灼烧主目标身后一格的敌军！
  if (attacker.abilities.breathAttack) {
    const atkHexes = getUnitOccupiedHexes(attacker);
    const tgtHexes = getUnitOccupiedHexes(primaryTarget);
    const atkKeySet = new Set(atkHexes.map(hexKey));
    const tgtKeySet = new Set(tgtHexes.map(hexKey));

    // 取攻守最近邻对计算吐息向量，定位紧贴主目标身后的那一格
    let bestA = attacker.pos;
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
    const hitUnitIds = new Set<string>();
    for (const step of ray) {
      const k = hexKey(step);
      if (atkKeySet.has(k) || tgtKeySet.has(k)) continue;
      if (minHexSetDistance([step], tgtHexes) !== 1) continue;
      const behind = findUnitAtHex(state, step, false);
      if (behind && behind.id !== primaryTarget.id && behind.side !== attacker.side && !hitUnitIds.has(behind.id)) {
        hitUnitIds.add(behind.id);
        const fireMult = behind.abilities.fireResistant ? 0.5 : 1.0;
        const sub = rollStrikeDamage(
          state,
          attacker,
          behind,
          false,
          false,
          1,
          'clear',
          1,
          catalog,
          0,
          fireMult,
        );
        const kills = sub.blocked ? 0 : applyDamageToUnit(state, behind, sub.damage, catalog, events);
        secondaryHits.push({
          targetId: behind.id,
          damage: sub.damage,
          kills,
          kind: 'breath',
          blocked: sub.blocked,
        });
        if (!sub.blocked) {
          handlePostKillRewards(state, attacker, behind, kills);
        }
        state.actionLog.push(
          `🐉 ${attacker.name} 的「贯穿吐息」波及身后 ${behind.name}，造成 ${sub.damage} 伤害！`,
        );
      }
      break;
    }
  }

  if (secondaryHits.length > 0) {
    strike.secondaryHits = secondaryHits;
  }
}

/**
 * 擦弹成功后，为己方英雄补充灵力与符卡充能
 */
function grantGrazeReward(
  state: BattleState,
  defender: BattleUnit,
  manaGain: number,
  catalog: CombatContentCatalog,
): void {
  if (manaGain <= 0) return;
  const heroes = Object.values(state.units).filter(
    (u) => u.side === defender.side && u.status === 'alive' && u.kind === 'hero',
  );
  for (const h of heroes) {
    const hStats = computeUnitStats(h, state, catalog);
    h.mana = Math.min(hStats.maxMana, (h.mana ?? 0) + manaGain);
    h.spellCardCharge = Math.min(100, (h.spellCardCharge ?? 0) + 14);
  }
}

/**
 * 击杀后触发 P 点成长、符卡充能与特质 onAfterKill 钩子
 */
function handlePostKillRewards(
  state: BattleState,
  killer: BattleUnit,
  victim: BattleUnit,
  kills: number,
): void {
  if (kills <= 0 || killer.status !== 'alive') return;
  if (killer.kind === 'hero') {
    const maxP = killer.maxPowerPoints ?? 4;
    killer.powerPoints = Math.min(maxP, Number(((killer.powerPoints ?? 0) + 0.35).toFixed(2)));
    killer.spellCardCharge = Math.min(100, (killer.spellCardCharge ?? 0) + 18);
  } else {
    // 友军小兵击杀也为己方主英雄提供少量符卡充能
    for (const u of Object.values(state.units)) {
      if (u.side === killer.side && u.status === 'alive' && u.kind === 'hero') {
        u.spellCardCharge = Math.min(100, (u.spellCardCharge ?? 0) + 8);
      }
    }
  }

  for (const traitId of killer.innateTraitIds) {
    HERO_TRAIT_REGISTRY[traitId]?.onAfterKill?.({ state, killer, victim, kills });
  }
}

/**
 * 检查战斗是否已分出胜负
 */
function checkVictory(state: BattleState, events: CombatEvent[]): boolean {
  const leftAlive = Object.values(state.units).some((u) => u.side === 'left' && u.status === 'alive');
  const rightAlive = Object.values(state.units).some((u) => u.side === 'right' && u.status === 'alive');

  if (!leftAlive || !rightAlive) {
    state.phase = 'finished';
    state.winner = leftAlive ? 'left' : 'right';
    state.activeUnitId = null;
    events.push({ type: 'BATTLE_ENDED', winner: state.winner });
    state.actionLog.push(
      state.winner === 'left'
        ? '★ 博丽神社阵营大获全胜！异变退治完成！'
        : '★ 雾雨魔导阵营大获全胜！火力就是正义！',
    );
    return true;
  }
  return false;
}

/**
 * 推进至下一个有效行动单位或进入新回合
 * 完整支持：正统 HoMM4 新回合士气三层梯队判定、异常控场跳过、衰减 Buff、领域持续回合与回蓝
 */
function advanceTurn(
  state: BattleState,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): void {
  if (checkVictory(state, events)) return;

  // 清理队列中已阵亡/倒地单位
  const popNextAlive = (queue: string[]): string | null => {
    while (queue.length > 0) {
      const id = queue.shift()!;
      const u = state.units[id];
      if (u && u.status === 'alive' && !u.hasActedThisRound) {
        return id;
      }
    }
    return null;
  };

  for (let safety = 0; safety < 48; safety++) {
    let nextId = popNextAlive(state.turnQueue);
    if (!nextId) {
      nextId = popNextAlive(state.waitQueue);
    }

    if (nextId) {
      const nextUnit = state.units[nextId];
      nextUnit.isDefending = false;

      // H4 控场机制：噩梦震慑 / 符箓定身 / 寒霜冻结 / 致盲术 / 迷惑术 / 狂暴术
      const se = nextUnit.statusEffects;
      if (
        se.terrifiedRounds > 0 ||
        se.stunnedRounds > 0 ||
        (se.frozenRounds ?? 0) > 0 ||
        (se.blindRounds ?? 0) > 0 ||
        (se.confusionRounds ?? 0) > 0
      ) {
        let reason: 'terrified' | 'stunned' | 'frozen' | 'blind' | 'confusion' = 'stunned';
        let label = '符箓定身';
        if (se.terrifiedRounds > 0) {
          reason = 'terrified';
          label = '噩梦震慑';
          se.terrifiedRounds = Math.max(0, se.terrifiedRounds - 1);
        } else if (se.stunnedRounds > 0) {
          reason = 'stunned';
          label = '符箓定身';
          se.stunnedRounds = Math.max(0, se.stunnedRounds - 1);
        } else if ((se.frozenRounds ?? 0) > 0) {
          reason = 'frozen';
          label = '寒霜冻结';
          se.frozenRounds = Math.max(0, (se.frozenRounds ?? 1) - 1);
        } else if ((se.blindRounds ?? 0) > 0) {
          reason = 'blind';
          label = '宵暗蔽目';
          se.blindRounds = Math.max(0, (se.blindRounds ?? 1) - 1);
        } else {
          reason = 'confusion';
          label = '迷乱魔雾';
          se.confusionRounds = Math.max(0, (se.confusionRounds ?? 1) - 1);
        }
        nextUnit.hasActedThisRound = true;
        events.push({ type: 'UNIT_SKIPPED_TURN', unitId: nextId, reason });
        state.actionLog.push(`${nextUnit.name} 处于「${label}」，跳过本巡行动！`);
        continue;
      }

      // H4 狂暴术（Berserk）：丧失理智，自动扑向距离最近的任意存活单位（无论敌我）！
      if ((se.berserkRounds ?? 0) > 0) {
        se.berserkRounds = Math.max(0, (se.berserkRounds ?? 1) - 1);
        const nearest = Object.values(state.units)
          .filter((u) => u.status === 'alive' && u.id !== nextUnit.id && !u.statusEffects?.sanctuary)
          .sort((a, b) => getUnitMinDistance(nextUnit, a) - getUnitMinDistance(nextUnit, b))[0];
        if (nearest) {
          const strike = rollStrikeDamage(state, nextUnit, nearest, false, false, 1, 'clear', 1, catalog);
          if (!strike.blocked) {
            strike.kills = applyDamageToUnit(state, nearest, strike.damage, catalog, events);
          }
          events.push({
            type: 'COMBAT_EXCHANGE',
            attackerId: nextUnit.id,
            defenderId: nearest.id,
            mode: 'one_way',
            attackerStrike: strike,
            defenderStrike: null,
          });
          state.actionLog.push(
            `🔥 ${nextUnit.name} 受「月狂赤瞳」驱使发狂！不分敌我猛攻 ${nearest.name}，造成 ${strike.damage} 点伤害！`,
          );
        } else {
          events.push({ type: 'UNIT_SKIPPED_TURN', unitId: nextId, reason: 'berserk' });
        }
        nextUnit.hasActedThisRound = true;
        if (checkVictory(state, events)) return;
        continue;
      }

      // 小恶魔专属「魔力吸取 (Mana Leech)」：每回合轮到首次行动时自动从敌方施法者窃取灵力并传给己方施法者（不耗行动权）
      if (nextUnit.abilities.manaLeech && !nextUnit.hasWaitedThisRound) {
        const enemyCasters = Object.values(state.units)
          .filter((u) => u.status === 'alive' && u.side !== nextUnit.side && (u.mana ?? 0) > 0)
          .sort((a, b) => (b.mana ?? 0) - (a.mana ?? 0));
        const enemyTarget = enemyCasters[0];
        if (enemyTarget && (enemyTarget.mana ?? 0) > 0) {
          const stealCap = Math.max(1, Math.floor(nextUnit.count * 0.2));
          const stolen = Math.min(enemyTarget.mana ?? 0, stealCap);
          if (stolen > 0) {
            enemyTarget.mana = Math.max(0, (enemyTarget.mana ?? 0) - stolen);
            const allyCasters = Object.values(state.units)
              .filter((u) => {
                if (u.status !== 'alive' || u.side !== nextUnit.side) return false;
                const aStats = computeUnitStats(u, state, catalog);
                return aStats.maxMana > 0 && (u.mana ?? 0) < aStats.maxMana;
              })
              .sort((a, b) => (a.kind === 'hero' ? -1 : b.kind === 'hero' ? 1 : (a.mana ?? 0) - (b.mana ?? 0)));
            const allyReceiver = allyCasters[0] ?? null;
            if (allyReceiver) {
              const rStats = computeUnitStats(allyReceiver, state, catalog);
              allyReceiver.mana = Math.min(rStats.maxMana, (allyReceiver.mana ?? 0) + stolen);
            }
            events.push({
              type: 'MANA_LEECH',
              sourceUnitId: nextUnit.id,
              enemyUnitId: enemyTarget.id,
              allyUnitId: allyReceiver?.id ?? null,
              amount: stolen,
            });
            state.actionLog.push(
              `😈 ${nextUnit.name} 发动「魔力吸取」，从 ${enemyTarget.name} 窃取了 ${stolen} 点灵力${allyReceiver ? `并注入 ${allyReceiver.name}` : ''}！`,
            );
          }
        }
      }

      state.activeUnitId = nextId;
      events.push({ type: 'TURN_STARTED', unitId: nextId });
      return;
    }

    // 本巡全员已行动完毕 → 进入新回合
    state.round += 1;

    // 衰减战场符卡结界领域持续时间
    if (state.activeFieldAura) {
      state.activeFieldAura.remainingRounds -= 1;
      if (state.activeFieldAura.remainingRounds <= 0) {
        state.actionLog.push(`${state.activeFieldAura.name} 灵光消散。`);
        state.activeFieldAura = null;
      }
    }

    // 刷新各单位回合标记、衰减临时 Buff、结算再生/中毒/瘟疫、催眠到期与灵力回复
    for (const unit of Object.values(state.units)) {
      unit.hasActedThisRound = false;
      unit.hasWaitedThisRound = false;
      unit.isDefending = false;
      unit.hasRetaliatedThisRound = false;
      unit.hasUsedPotionThisRound = false;
      unit.roundMoraleState = 'neutral';
      unit.modifiers = unit.modifiers
        .map((m) =>
          m.remainingRounds === null ? m : { ...m, remainingRounds: m.remainingRounds - 1 },
        )
        .filter((m) => m.remainingRounds === null || m.remainingRounds > 0);

      const se = unit.statusEffects;
      if (se.songOfPeaceRounds && se.songOfPeaceRounds > 0) {
        se.songOfPeaceRounds = Math.max(0, se.songOfPeaceRounds - 1);
      }
      if (se.cowardiceRounds && se.cowardiceRounds > 0) {
        se.cowardiceRounds = Math.max(0, se.cowardiceRounds - 1);
      }
      if (se.precisionRounds && se.precisionRounds > 0) {
        se.precisionRounds = Math.max(0, se.precisionRounds - 1);
        if (se.precisionRounds === 0 && se.grantedAbilities) {
          for (const ab of ['longRange', 'noObstaclePenalty'] as const) {
            if (se.grantedAbilities.includes(ab)) {
              unit.abilities[ab] = false;
              se.grantedAbilities = se.grantedAbilities.filter((k) => k !== ab);
            }
          }
        }
      }
      if (se.bloodlustRounds && se.bloodlustRounds > 0) {
        se.bloodlustRounds = Math.max(0, se.bloodlustRounds - 1);
      }
      if (se.agedRounds && se.agedRounds > 0) {
        se.agedRounds = Math.max(0, se.agedRounds - 1);
      }
      if (se.rabbitFormRounds && se.rabbitFormRounds > 0) {
        se.rabbitFormRounds = Math.max(0, se.rabbitFormRounds - 1);
        if (se.rabbitFormRounds === 0) {
          if (se.rabbitFormOriginalBlueprintId) {
            unit.voxelBlueprintId = se.rabbitFormOriginalBlueprintId;
            se.rabbitFormOriginalBlueprintId = undefined;
          }
          if (se.rabbitFormGrantedFirstStrike) {
            unit.abilities.firstStrike = false;
            se.rabbitFormGrantedFirstStrike = false;
            if (se.grantedAbilities) {
              se.grantedAbilities = se.grantedAbilities.filter((k) => k !== 'firstStrike');
            }
          }
          state.actionLog.push(`🐇 ${unit.name} 的「兔化」时间结束，恢复原本形态。`);
        }
      }
      if (se.hypnotizedRounds && se.hypnotizedRounds > 0) {
        se.hypnotizedRounds = Math.max(0, se.hypnotizedRounds - 1);
        if (se.hypnotizedRounds === 0 && se.hypnotizedOriginalSide) {
          unit.side = se.hypnotizedOriginalSide;
          unit.facing = unit.side === 'left' ? 'right' : 'left';
          se.hypnotizedOriginalSide = undefined;
          state.actionLog.push(`${unit.name} 摆脱「迷梦傀儡」操控，重归原阵营！`);
        }
      }

      if (unit.status === 'alive') {
        const stats = computeUnitStats(unit, state, catalog);
        // 生生不息（Regeneration）：每回合开始回复首兵生命（仅活体有效）
        if (se.regenPerRound && se.regenPerRound > 0 && !isImmuneToLivingHeal(unit)) {
          const beforeHp = unit.currentHp;
          unit.currentHp = Math.min(stats.maxHp, unit.currentHp + se.regenPerRound);
          const gained = unit.currentHp - beforeHp;
          if (gained > 0) {
            state.actionLog.push(`💚 ${unit.name} 的「生生不息」回复了 ${gained} 点生命。`);
          }
        }
        // 剧毒（Poison）与瘟疫（Plague）：每回合开始持续扣血并推送舞台毒发事件
        const poisonPart = se.poisonPower ?? 0;
        const plaguePart = se.plaguePower ?? 0;
        const dotDmg = poisonPart + plaguePart;
        if (dotDmg > 0 && !unit.abilities.magicImmune && !se.sanctuary) {
          const dotKills = applyDamageToUnit(state, unit, dotDmg, catalog, events);
          events.push({
            type: 'STATUS_DOT_TICK',
            unitId: unit.id,
            damage: dotDmg,
            kills: dotKills,
            kind: poisonPart >= plaguePart ? 'poison' : 'plague',
          });
          state.actionLog.push(
            `☠ ${unit.name} 遭受毒疫侵蚀，损失 ${dotDmg} 生命${unit.kind === 'creature' ? `（折损 ${dotKills} 兵）` : ''}！`,
          );
        }

        if (unit.status === 'alive') {
          if (unit.kind === 'hero') {
            // 英雄子技能「治疗/草药」自然回血；战中不设无条件保底回蓝，仅由「巫术/冥想」与魔导妖术师职业提供精确回蓝
            const sub = unit.subSkills ?? {};
            const passiveHeal = (sub.healing ?? 0) * 4 + (sub.herbalism ?? 0) * 3;
            if (passiveHeal > 0 && unit.currentHp < stats.maxHp) {
              unit.currentHp = Math.min(stats.maxHp, unit.currentHp + passiveHeal);
            }
            const heroCls = resolveActiveHeroClass(
              unit.skills,
              unit.subSkills,
              catalog.advancedClasses,
              unit.selectedAdvancedClassId,
            );
            const bonusManaRegen =
              (sub.wizardry ?? 0) + (sub.meditation ?? 0) + (heroCls?.passive?.manaRegenPerRound ?? 0);
            if (bonusManaRegen > 0) {
              unit.mana = Math.min(stats.maxMana, (unit.mana ?? 0) + bonusManaRegen);
            }
            unit.spellCardCharge = Math.min(100, (unit.spellCardCharge ?? 0) + 15);
          }
          // 施法兵种严格遵循 0 自动回蓝，灵力池为整场有限战略资源
        }
      }
    }

    if (checkVictory(state, events)) return;

    events.push({ type: 'ROUND_STARTED', round: state.round });
    state.actionLog.push(`—— 第 ${state.round} 回合开始 ——`);
    state.turnQueue = buildRoundTurnQueue(state, catalog, events, true);
    state.waitQueue = [];
    // 下一轮循环将从新 turnQueue 取出首位未受控的单位
  }
}

/**
 * 获取当前活跃单位从队列中移除状态，准备结束本次行动
 */
function consumeActiveUnitTurn(state: BattleState, unit: BattleUnit): void {
  unit.hasActedThisRound = true;
  state.turnQueue = state.turnQueue.filter((id) => id !== unit.id);
  state.waitQueue = state.waitQueue.filter((id) => id !== unit.id);
}

/**
 * 唯一入口：执行任意确定性战斗指令，返回校验结果与结构化演出事件流
 */
export function dispatchCombatCommand(
  state: BattleState,
  command: CombatCommand,
  catalog: CombatContentCatalog,
): CommandResult {
  if (state.phase !== 'active') {
    return { ok: false, error: '战斗已结束', events: [] };
  }
  if (state.activeUnitId !== command.unitId) {
    return { ok: false, error: '尚未轮到该单位行动', events: [] };
  }

  const unit = state.units[command.unitId];
  if (!unit || unit.status !== 'alive') {
    return { ok: false, error: '单位无法行动', events: [] };
  }

  const events: CombatEvent[] = [];
  state.commandSeq += 1;

  // ====== 1. 移动指令 ======
  if (command.type === 'MOVE') {
    const reachable = getUnitReachableMap(state, unit, catalog);
    const path = reconstructHexPath(reachable, command.to);
    if (!path || path.length <= 1) {
      return { ok: false, error: '目标格子不可到达', events: [] };
    }
    const prevQ = unit.pos.q;
    unit.pos = { ...command.to };
    if (unit.statusEffects?.sanctuary) {
      unit.statusEffects.sanctuary = false;
    }
    if (command.to.q !== prevQ) {
      unit.facing = command.to.q > prevQ ? 'right' : 'left';
    }
    events.push({ type: 'UNIT_MOVED', unitId: unit.id, path });
    state.hasCombatStarted = true;
    state.actionLog.push(
      unit.abilities.teleport || unit.abilities.globalTeleport
        ? `✦ ${unit.name} 瞬移至 (${command.to.q}, ${command.to.r})。`
        : `${unit.name} 移动至 (${command.to.q}, ${command.to.r})。`,
    );
    consumeActiveUnitTurn(state, unit);
    advanceTurn(state, catalog, events);
    return { ok: true, events };
  }

  // ====== 2. 攻击指令（含 HoMM4 两阶段同时反击与远程互射反击） ======
  if (command.type === 'ATTACK') {
    const target = state.units[command.targetId];
    if (!target || target.status !== 'alive' || target.side === unit.side) {
      return { ok: false, error: '目标无效', events: [] };
    }

    const preview = previewAttack(
      state,
      unit.id,
      target.id,
      catalog,
      command.moveTo,
      Boolean(command.forceMelee),
    );
    if (!preview.valid) {
      return { ok: false, error: preview.reason ?? '无法攻击该目标', events: [] };
    }

    // 近战先移动到位并记录冲锋距离
    const chargeSteps = !preview.isRanged && preview.movePath && preview.movePath.length > 1 ? preview.movePath.length - 1 : 0;
    if (preview.moveTo && preview.movePath && preview.movePath.length > 1) {
      unit.pos = { ...preview.moveTo };
      events.push({ type: 'UNIT_MOVED', unitId: unit.id, path: preview.movePath });
    }
    if (unit.statusEffects?.sanctuary) {
      unit.statusEffects.sanctuary = false;
    }

    unit.facing = target.pos.q >= unit.pos.q ? 'right' : 'left';
    target.facing = unit.pos.q >= target.pos.q ? 'right' : 'left';

    const useRanged = preview.isRanged;
    const rangedCheck = useRanged
      ? checkRangedCapability(state, unit, target, catalog)
      : null;

    const defRangedCheck =
      useRanged && preview.willRetaliate
        ? evaluateRangedRetaliation(state, target, unit, catalog)
        : null;
    // 若远程反击弹道被攻击方前卫友军截击，则由该前卫代为承受全部反击伤害
    const retaliationInterceptor = defRangedCheck?.interceptedBy ?? null;
    const retaliationTarget = retaliationInterceptor ?? unit;

    let attackerStrike: StrikeReport | null = null;
    let defenderStrike: StrikeReport | null = null;

    const finalizeStrikeOnTarget = (
      striker: BattleUnit,
      victim: BattleUnit,
      strike: StrikeReport,
      strikerCountOverride?: number,
    ) => {
      if (!strike.blocked) {
        strike.kills = applyDamageToUnit(state, victim, strike.damage, catalog, events);
        if (strike.petrifyKills && victim.status === 'alive') {
          const pKills = applyBonusKills(state, victim, strike.petrifyKills, events);
          strike.petrifyKills = pKills;
          strike.kills += pKills;
        } else {
          strike.petrifyKills = undefined;
        }
        if (strike.grazed) grantGrazeReward(state, victim, strike.grazeManaGain, catalog);
        handlePostKillRewards(state, striker, victim, strike.kills);
        applyHitStatusEffect(state, victim, strike.appliedStatus);
        // 剧毒喷射（毒瘴妖专属，还原 H4 毒液怪）：按存活兵力独立计算无视防御毒伤，命中瞬发首次扣血并挂上持续剧毒！
        if (
          striker.abilities.poisonAttack &&
          strike.damage > 0 &&
          victim.status === 'alive' &&
          !isImmuneToLivingEffects(victim) &&
          !victim.abilities.magicImmune
        ) {
          const pDmg = computePoisonAttackDamage(striker, victim, state, catalog, strikerCountOverride);
          const pKills = applyDamageToUnit(state, victim, pDmg, catalog, events);
          strike.poisonInstantDamage = pDmg;
          strike.poisonInstantKills = pKills;
          handlePostKillRewards(state, striker, victim, pKills);
          if (victim.status === 'alive') {
            victim.statusEffects.poisonPower = Math.max(victim.statusEffects.poisonPower ?? 0, pDmg);
            markStatusEffectOrder(victim, state, 'poisonPower');
            enforceUnitStatusSlotCap(victim);
          }
          if (!strike.appliedStatus) strike.appliedStatus = 'poisoned';
          state.actionLog.push(
            `☠ ${striker.name} 触发「剧毒喷射」，瞬发毒伤 ${pDmg}${victim.kind === 'creature' ? `（折损 ${pKills} 兵）` : ''}${victim.status === 'alive' ? `，并令 ${victim.name} 每回合持续流失 ${victim.statusEffects.poisonPower} 生命！` : `，直接毒杀 ${victim.name}！`}`,
          );
        }
        resolveFireShield(state, striker, victim, strike, catalog, events);

        // H4 复仇反伤（Retribution 35% 近战反伤）与 痛楚镜面（Pain Mirror 50% 近/远程反伤）
        if (strike.damage > 0 && striker.status === 'alive' && !striker.abilities.magicImmune && !striker.statusEffects?.sanctuary) {
          const mirrorRatio = victim.statusEffects?.painMirror
            ? 0.5
            : !strike.isRanged && victim.statusEffects?.retribution
              ? 0.35
              : 0;
          if (mirrorRatio > 0) {
            const refDmg = Math.max(1, Math.round(strike.damage * mirrorRatio));
            const refKills = applyDamageToUnit(state, striker, refDmg, catalog, events);
            strike.secondaryHits = strike.secondaryHits ?? [];
            strike.secondaryHits.push({
              targetId: striker.id,
              damage: refDmg,
              kills: refKills,
              kind: 'fire_shield',
            });
            state.actionLog.push(
              `🪞 ${victim.name} 的「${victim.statusEffects?.painMirror ? '因果水镜' : '因果报应'}」将 ${refDmg} 点伤害反射给 ${striker.name}！`,
            );
          }
        }

        // H4 绯红吸血（Vampiric Touch）或 阴阳双生巫师/冥刃掠夺者职业吸血：近战伤害转化生命！
        const strikerClassVamp =
          striker.kind === 'hero' &&
          Boolean(
            resolveActiveHeroClass(
              striker.skills,
              striker.subSkills,
              catalog.advancedClasses,
              striker.selectedAdvancedClassId,
            )?.passive?.grantVampiric,
          );
        if (
          !strike.isRanged &&
          strike.damage > 0 &&
          striker.status === 'alive' &&
          (striker.abilities.lifeDraining || striker.statusEffects?.vampiricTouch || strikerClassVamp) &&
          (!isImmuneToLivingHeal(striker) || isUndeadUnit(striker)) &&
          !isImmuneToLivingEffects(victim)
        ) {
          const drainRatio = striker.abilities.lifeDraining || striker.statusEffects?.vampiricTouch ? 0.5 : 0.3;
          const drain = Math.max(1, Math.round(strike.damage * drainRatio));
          const sStats = computeUnitStats(striker, state, catalog);
          const maxHp = Math.max(1, sStats.maxHp);
          const curTotal = (striker.count - 1) * maxHp + striker.currentHp;
          const capTotal = striker.maxCount * maxHp;
          const nextTotal = Math.min(capTotal, curTotal + drain);
          if (nextTotal > curTotal) {
            const nextCount = Math.max(1, Math.ceil(nextTotal / maxHp));
            striker.count = nextCount;
            striker.currentHp = nextTotal - (nextCount - 1) * maxHp;
            state.actionLog.push(
              `🩸 ${striker.name} 触发「${striker.abilities.lifeDraining ? '吸血复苏' : '绯红吸血'}」，吸取了 ${nextTotal - curTotal} 点生命！`,
            );
          }
        }
      }
    };

    if (preview.exchangeMode === 'simultaneous') {
      // 【核心 H4 灵魂：两阶段同时反击】
      // Phase 1 Compute：基于出手前的完好数量，同时掷出双边伤害！
      attackerStrike = rollStrikeDamage(
        state,
        unit,
        target,
        useRanged,
        false,
        1,
        rangedCheck ? rangedCheck.los.status : 'clear',
        rangedCheck ? rangedCheck.rangePenalty : 1,
        catalog,
        chargeSteps,
      );
      defenderStrike = rollStrikeDamage(
        state,
        target,
        retaliationTarget,
        useRanged,
        true,
        1,
        defRangedCheck ? defRangedCheck.los.status : 'clear',
        defRangedCheck ? defRangedCheck.rangePenalty : 1,
        catalog,
      );
      if (retaliationInterceptor) {
        defenderStrike.interceptedByUnitId = retaliationInterceptor.id;
      }

      // Phase 2 Apply：同时结算双方减员、格挡、石化、剧毒、控制、烈焰护盾与擦弹充能（保留出手前完整兵力用于同时反击剧毒！）
      const attackerPreCount = unit.count;
      const defenderPreCount = target.count;
      finalizeStrikeOnTarget(unit, target, attackerStrike, attackerPreCount);
      finalizeStrikeOnTarget(target, retaliationTarget, defenderStrike, defenderPreCount);
    } else if (preview.exchangeMode === 'attacker_first' || preview.exchangeMode === 'one_way') {
      // 攻击方先攻（或不受反击）：先扣减防守方数量，若防守方仍存活再按残余人数反击
      attackerStrike = rollStrikeDamage(
        state,
        unit,
        target,
        useRanged,
        false,
        1,
        rangedCheck ? rangedCheck.los.status : 'clear',
        rangedCheck ? rangedCheck.rangePenalty : 1,
        catalog,
        chargeSteps,
      );
      finalizeStrikeOnTarget(unit, target, attackerStrike);

      if (preview.exchangeMode === 'attacker_first' && target.status === 'alive') {
        defenderStrike = rollStrikeDamage(
          state,
          target,
          retaliationTarget,
          useRanged,
          true,
          1,
          defRangedCheck ? defRangedCheck.los.status : 'clear',
          defRangedCheck ? defRangedCheck.rangePenalty : 1,
          catalog,
        );
        if (retaliationInterceptor) {
          defenderStrike.interceptedByUnitId = retaliationInterceptor.id;
        }
        finalizeStrikeOnTarget(target, retaliationTarget, defenderStrike);
      }
    } else {
      // 防守方先攻：防守方先手压制（若远程反击被前卫挡箭则由前卫承伤），随后若原攻击方仍存活再按残余人数还击
      defenderStrike = rollStrikeDamage(
        state,
        target,
        retaliationTarget,
        useRanged,
        true,
        1,
        defRangedCheck ? defRangedCheck.los.status : 'clear',
        defRangedCheck ? defRangedCheck.rangePenalty : 1,
        catalog,
      );
      if (retaliationInterceptor) {
        defenderStrike.interceptedByUnitId = retaliationInterceptor.id;
      }
      finalizeStrikeOnTarget(target, retaliationTarget, defenderStrike);

      if (unit.status === 'alive') {
        attackerStrike = rollStrikeDamage(
          state,
          unit,
          target,
          useRanged,
          false,
          1,
          rangedCheck ? rangedCheck.los.status : 'clear',
          rangedCheck ? rangedCheck.rangePenalty : 1,
          catalog,
          chargeSteps,
        );
        finalizeStrikeOnTarget(unit, target, attackerStrike);
      }
    }

    // 仅对实际发射了远程弹幕的单位扣减弹药（无限弹药单位永不扣弹；先攻一击全灭时败方不扣弹）
    if (useRanged && attackerStrike && !unit.abilities.unlimitedShots) {
      unit.ammo = Math.max(0, unit.ammo - 1);
    }
    if (defRangedCheck?.canRetaliate && defenderStrike && !target.abilities.unlimitedShots) {
      target.ammo = Math.max(0, target.ammo - 1);
    }
    // 普通单位实际触发近战或远程反击后，消耗本回合唯一的 1 次反击配额（无限反击单位不受此限）
    if (defenderStrike && !target.abilities.unlimitedRetaliation) {
      target.hasRetaliatedThisRound = true;
    }

    // 主动近战额外特技：周身全扫 (Multiple Attack) 与 贯穿吐息 (Breath Attack)
    if (attackerStrike && !useRanged) {
      resolveAreaMeleeEffects(state, unit, target, attackerStrike, chargeSteps, catalog, events);
    }

    // H4 双重攻击（Two Attacks）：若攻击方与目标均仍存活且未被反击控场，立刻追加第二段不触发反击的连击！
    if (
      attackerStrike &&
      unit.abilities.doubleStrike &&
      unit.status === 'alive' &&
      target.status === 'alive' &&
      unit.statusEffects.stunnedRounds === 0 &&
      unit.statusEffects.terrifiedRounds === 0
    ) {
      const follow = rollStrikeDamage(
        state,
        unit,
        target,
        useRanged,
        false,
        1,
        rangedCheck ? rangedCheck.los.status : 'clear',
        rangedCheck ? rangedCheck.rangePenalty : 1,
        catalog,
        0,
      );
      finalizeStrikeOnTarget(unit, target, follow);
      attackerStrike.followUpStrike = {
        damage: follow.damage,
        kills: follow.kills,
        blocked: follow.blocked,
        luckyCrit: follow.luckyCrit,
        unluckyHit: follow.unluckyHit,
        defenderLucky: follow.defenderLucky,
        defenderUnlucky: follow.defenderUnlucky,
        grazed: follow.grazed,
        petrifyKills: follow.petrifyKills,
      };
      if (follow.secondaryHits && follow.secondaryHits.length > 0) {
        attackerStrike.secondaryHits = [...(attackerStrike.secondaryHits ?? []), ...follow.secondaryHits];
      }
    }

    // 生成清晰中文战报（完整报告格挡、连击、石化、擦弹、暴击与兵力折损）
    const modeLabel =
      preview.exchangeMode === 'simultaneous'
        ? '同时交锋'
        : preview.exchangeMode === 'attacker_first'
          ? '先攻压制'
          : preview.exchangeMode === 'defender_first'
            ? '遭遇先攻反击'
            : useRanged
              ? '远程弹幕射击'
              : '单向突袭';
    const formatLoss = (victim: BattleUnit, kills: number) =>
      victim.kind === 'creature' ? `，折损 ${kills} 兵` : '';
    const describeStrike = (actor: BattleUnit, victim: BattleUnit, s: StrikeReport | null) => {
      if (!s) return `${actor.name} 未能出手`;
      if (s.blocked) return `${actor.name} 的攻击被 ${victim.name} 完全格挡!`;
      const followTxt = s.followUpStrike
        ? s.followUpStrike.blocked
          ? ' + 二段追击被格挡'
          : ` + 二段连击 ${s.followUpStrike.damage}${victim.kind === 'creature' ? `(-${s.followUpStrike.kills}兵)` : ''}`
        : '';
      const petrifyTxt = s.petrifyKills ? `(石化+${s.petrifyKills})` : '';
      const luckTags = [
        s.grazed ? '(擦弹!)' : '',
        s.luckyCrit ? '(幸运暴击!)' : '',
        s.unluckyHit ? '(厄运减半!)' : '',
        s.defenderLucky ? '(幸运护身!)' : '',
        s.defenderUnlucky ? '(厄运破防!)' : '',
      ].join('');
      return `${actor.name} 造成 ${s.damage} 伤害${formatLoss(victim, s.kills)}${petrifyTxt}${luckTags}${followTxt}`;
    };
    const atkSummary = describeStrike(unit, target, attackerStrike);
    const defSummary = defenderStrike
      ? retaliationInterceptor
        ? `；前卫 ${retaliationInterceptor.name} 替伤挡下远程反击，${describeStrike(target, retaliationTarget, defenderStrike)}`
        : `；${describeStrike(target, retaliationTarget, defenderStrike)}`
      : '';
    state.actionLog.push(`【${modeLabel}】${atkSummary}${defSummary}`);

    // 双方英雄交锋增加少量符卡充能
    if (unit.status === 'alive' && unit.kind === 'hero') {
      unit.spellCardCharge = Math.min(100, (unit.spellCardCharge ?? 0) + 12);
    }
    if (target.status === 'alive' && target.kind === 'hero') {
      target.spellCardCharge = Math.min(100, (target.spellCardCharge ?? 0) + 14);
    }

    events.push({
      type: 'COMBAT_EXCHANGE',
      attackerId: unit.id,
      defenderId: target.id,
      retaliationTargetId: retaliationInterceptor ? retaliationInterceptor.id : undefined,
      mode: preview.exchangeMode,
      attackerStrike,
      defenderStrike,
    });

    state.hasCombatStarted = true;
    consumeActiveUnitTurn(state, unit);
    advanceTurn(state, catalog, events);
    return { ok: true, events };
  }

  // ====== 3. 通用五系法术指令（全量 142 个 HoMM4 术式完整执行器） ======
  if (command.type === 'CAST_SPELL') {
    const res = executeH4CastSpell(state, unit, command, catalog, events, {
      getUnitOccupiedHexes,
      getUnitMinDistance,
      findUnitAtHex,
      checkSpellLineOfSight,
      applyDamageToUnit,
      applyBonusKills,
      grantGrazeReward,
      handlePostKillRewards,
      consumeActiveUnitTurn,
      advanceTurn,
      syncMidRoundMorale,
    });
    if (res.ok) state.hasCombatStarted = true;
    return res;
  }

  // ====== 4. 东方专属符卡宣言指令（展开盘面旋转结界大阵 + 强力演出） ======
  if (command.type === 'DECLARE_SPELL_CARD') {
    if (unit.kind !== 'hero' || !unit.signatureSpellCardId) {
      return { ok: false, error: '该单位没有专属符卡', events: [] };
    }
    if (unit.statusEffects?.songOfPeaceRounds && unit.statusEffects.songOfPeaceRounds > 0) {
      return { ok: false, error: '受「镇魂神乐」安抚，当前无法宣言符卡', events: [] };
    }
    const card = catalog.spellCards[unit.signatureSpellCardId];
    if (!card) return { ok: false, error: '符卡数据缺失', events: [] };
    if ((unit.mana ?? 0) < card.manaCost) return { ok: false, error: '灵力不足', events: [] };
    if ((unit.spellCardCharge ?? 0) < card.chargeCost) {
      return { ok: false, error: `符卡充能不足 (${unit.spellCardCharge ?? 0}/${card.chargeCost}%)`, events: [] };
    }
    if (unit.statusEffects?.sanctuary) {
      unit.statusEffects.sanctuary = false;
    }

    const casterStats = computeUnitStats(unit, state, catalog);
    const castHook: SpellPowerHookContext = {
      state,
      caster: unit,
      isSpellCard: true,
      damageMultiplier: 1,
      notes: [],
    };
    for (const traitId of unit.innateTraitIds) {
      HERO_TRAIT_REGISTRY[traitId]?.onBeforeCast?.(castHook);
    }

    let lineHexes: HexCoord[] | undefined;
    const damageMap: Record<string, { damage: number; kills: number; grazed: boolean }> = {};

    if (card.targetType === 'hex_line') {
      const targetHex = command.targetHex;
      if (!targetHex || hexEquals(targetHex, unit.pos)) {
        return { ok: false, error: '请指定符卡炮击方向格', events: [] };
      }
      unit.facing = targetHex.q >= unit.pos.q ? 'right' : 'left';
      lineHexes = hexRay(
        unit.pos,
        targetHex,
        card.lineLength ?? 9,
        (c) => Boolean(state.tiles[hexKey(c)]),
      );
      const lineKeySet = new Set(lineHexes.map(hexKey));
      for (const candidate of Object.values(state.units)) {
        if (candidate.status !== 'alive' || candidate.side === unit.side) continue;
        const hitAny = getUnitOccupiedHexes(candidate).some((h) => lineKeySet.has(hexKey(h)));
        if (!hitAny) continue;

        if (candidate.abilities.magicImmune) {
          damageMap[candidate.id] = { damage: 0, kills: 0, grazed: false };
          state.actionLog.push(`${candidate.name} 全魔法免疫，完全无视了符卡【${card.name}】！`);
          continue;
        }

        const cStats = computeUnitStats(candidate, state, catalog);
        let dmg = ((card.damageBase ?? 85) + casterStats.spellPower * 4.2) * castHook.damageMultiplier;
        if (isDarkMagicVulnerable(candidate)) {
          dmg *= DARK_MAGIC_VULNERABILITY_MULT;
        }
        if (candidate.abilities.chaosResistant && card.alignment === 'chaos') {
          dmg *= 0.75;
        }
        dmg *= 1 - cStats.magicResistance * 0.7;
        let grazed = false;
        if (cStats.grazeChance > 0 && nextRandom(state.rng) < cStats.grazeChance * 0.65) {
          grazed = true;
          dmg *= 0.75;
          grantGrazeReward(state, candidate, 4, catalog);
        }
        const finalDmg = Math.max(1, Math.round(dmg));
        const kills = applyDamageToUnit(state, candidate, finalDmg, catalog, events);
        damageMap[candidate.id] = { damage: finalDmg, kills, grazed };
        handlePostKillRewards(state, unit, candidate, kills);
      }
      // 蕾米莉亚《神枪「冈格尼尔之枪」》：鲜红魔枪贯通吸血，按命中总伤害的 30%（上限 75 HP）回复自身生命！
      if (card.id === 'remilia_gungnir' && unit.status === 'alive') {
        const totalLineDmg = Object.values(damageMap).reduce((sum, entry) => sum + entry.damage, 0);
        const vampHeal = Math.min(75, Math.round(totalLineDmg * 0.3));
        if (vampHeal > 0) {
          unit.currentHp = Math.min(casterStats.maxHp, unit.currentHp + vampHeal);
          state.actionLog.push(`🩸 蕾米莉亚以神枪汲取绯红生机，回复 ${vampHeal} 点生命！`);
        }
      }
    } else if (card.targetType === 'field_self') {
      // 全场结界符卡（灵梦《梦想天生》、永琳《天文密葬法》等）：为全队活体恢复 35 点生命（全魔免与非活体除外）
      for (const ally of Object.values(state.units)) {
        if (ally.status !== 'alive' || ally.side !== unit.side) continue;
        if (ally.abilities.magicImmune) continue;
        const aStats = computeUnitStats(ally, state, catalog);
        if (!isImmuneToLivingHeal(ally)) {
          ally.currentHp = Math.min(aStats.maxHp, ally.currentHp + 35);
        }
        // 八意永琳《秘术「天文密葬法」》：星律共鸣额外为全队施法单位回复 4 点灵力
        if (card.id === 'eirin_astronomical_entombing' && aStats.maxMana > 0) {
          ally.mana = Math.min(aStats.maxMana, (ally.mana ?? 0) + 4);
        }
      }
    }

    // 展开盘面结界领域
    if (card.fieldAura) {
      state.activeFieldAura = {
        id: card.fieldAura.id,
        spellCardId: card.id,
        name: card.fieldAura.name,
        casterUnitId: unit.id,
        casterSide: unit.side,
        remainingRounds: card.fieldAura.durationRounds,
        themeColor: card.fieldAura.themeColor,
        accentColor: card.fieldAura.accentColor,
        pattern: card.fieldAura.pattern,
        allyModifiers: card.fieldAura.allyModifiers,
        enemyModifiers: card.fieldAura.enemyModifiers,
        captured: false,
      };
    }

    unit.mana = Math.max(0, (unit.mana ?? 0) - card.manaCost);
    unit.spellCardCharge = 0;

    state.actionLog.push(`✦ 符卡宣言！${unit.name} 发动【${card.name}】！`);
    events.push({
      type: 'SPELL_CARD_DECLARED',
      casterId: unit.id,
      spellCardId: card.id,
      spellCardName: card.name,
      subtitle: card.subtitle,
      vfxKey: card.vfxKey,
      themeColor: card.fieldAura?.themeColor ?? unit.themeColor,
      accentColor: card.fieldAura?.accentColor ?? unit.accentColor,
      lineHexes,
      damageMap: Object.keys(damageMap).length > 0 ? damageMap : undefined,
      fieldActivated: Boolean(card.fieldAura),
    });

    state.hasCombatStarted = true;
    consumeActiveUnitTurn(state, unit);
    advanceTurn(state, catalog, events);
    return { ok: true, events };
  }

  // ====== 5. 英雄腰带战斗秘药（不消耗行动权，但每名英雄每回合限用 1 次，受自然「草药」增幅） ======
  if (command.type === 'USE_POTION') {
    if (unit.kind !== 'hero') {
      return { ok: false, error: '仅英雄可使用腰带药水', events: [] };
    }
    if (unit.hasUsedPotionThisRound) {
      return { ok: false, error: '本回合已饮用过秘药，每名英雄每回合限用 1 次', events: [] };
    }
    const slot = unit.potions.find((p) => p.potionId === command.potionId && p.charges > 0);
    const def = catalog.potions[command.potionId];
    if (!slot || !def) {
      return { ok: false, error: '药水已耗尽', events: [] };
    }

    slot.charges -= 1;
    unit.hasUsedPotionThisRound = true;
    state.hasCombatStarted = true;
    const stats = computeUnitStats(unit, state, catalog);
    const herbMult = 1 + (unit.subSkills?.herbalism ?? 0) * 0.15;
    const scaledPower = Math.round(def.power * herbMult);
    let summary = '';

    if (def.effectType === 'heal') {
      const before = unit.currentHp;
      unit.currentHp = Math.min(stats.maxHp, unit.currentHp + scaledPower);
      summary = `回复 ${unit.currentHp - before} 生命`;
    } else if (def.effectType === 'mana_charge') {
      unit.mana = Math.min(stats.maxMana, (unit.mana ?? 0) + scaledPower);
      unit.spellCardCharge = Math.min(100, (unit.spellCardCharge ?? 0) + 35);
      summary = `灵力 +${scaledPower}、符卡充能 +35%`;
    } else {
      upsertUnitModifier(unit, state, {
        id: `potion:def:${state.commandSeq}`,
        stat: 'defense',
        mode: 'percent',
        value: scaledPower / 100,
        sourceName: `药水·${def.name}`,
        remainingRounds: 2,
        spellPolarity: 'positive',
      });
      upsertUnitModifier(unit, state, {
        id: `potion:graze:${state.commandSeq}`,
        stat: 'grazeChance',
        mode: 'flat',
        value: 0.15,
        sourceName: `药水·${def.name}`,
        remainingRounds: 2,
        spellPolarity: 'positive',
      });
      enforceUnitStatusSlotCap(unit);
      summary = `防御 +${scaledPower}%、擦弹 +15% (2回合)`;
    }

    state.actionLog.push(`${unit.name} 饮下「${def.name}」：${summary}。`);
    events.push({
      type: 'POTION_USED',
      unitId: unit.id,
      potionName: def.name,
      summary,
      color: def.color,
    });
    // 喝药属于 H4 免费自由动作，不结束当前英雄行动回合！
    return { ok: true, events };
  }

  // ====== 6. 等待指令（Wait：移至本回合末按后手顺位出手） ======
  if (command.type === 'WAIT') {
    if (unit.hasWaitedThisRound) {
      return { ok: false, error: '本回合已等待过一次', events: [] };
    }
    state.hasCombatStarted = true;
    unit.hasWaitedThisRound = true;
    state.turnQueue = state.turnQueue.filter((id) => id !== unit.id);
    // 经典英雄无敌规则：先等待的高主动单位排在等待队列末尾，低速单位在等待阶段反先出手
    state.waitQueue.unshift(unit.id);
    state.actionLog.push(`${unit.name} 暂缓行动，静待时机。`);
    events.push({ type: 'UNIT_WAITING', unitId: unit.id });
    advanceTurn(state, catalog, events);
    return { ok: true, events };
  }

  // ====== 7. 防御姿态指令 ======
  if (command.type === 'DEFEND') {
    state.hasCombatStarted = true;
    unit.isDefending = true;
    state.actionLog.push(`${unit.name} 进入防御姿态（护甲 +35%）。`);
    events.push({ type: 'UNIT_DEFENDING', unitId: unit.id });
    consumeActiveUnitTurn(state, unit);
    advanceTurn(state, catalog, events);
    return { ok: true, events };
  }

  return { ok: false, error: '未知指令类型', events: [] };
}

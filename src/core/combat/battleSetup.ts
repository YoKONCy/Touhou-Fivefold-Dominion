/**
 * 战场初始化与英雄/兵种单位实例化工厂子模块
 */

import { clampSkillsToPrerequisites } from '../h4Skills';
import { offsetToAxial, type HexCoord } from '../hex';
import { computeUnitStats, resolveAdvancedClass } from '../modifiers';
import { createRngState } from '../rng';
import type {
  BattleState,
  BattleUnit,
  CombatEvent,
  CreatureDefinition,
  HeroDefinition,
  SideId,
} from '../types';
import { syncHeroDerivedState } from './heroBuild';
import { buildRoundTurnQueue } from './turnQueue';
import type { ArmyPlacementSlot, CombatContentCatalog, CreateBattleOptions } from './types';

function createHeroUnit(
  id: string,
  side: SideId,
  def: HeroDefinition,
  pos: HexCoord,
  catalog: CombatContentCatalog,
): BattleUnit {
  const normalized = clampSkillsToPrerequisites(def.initialSkills, def.initialSubSkills ?? {});
  const initSkills = normalized.skills;
  const initSub = normalized.subSkills;
  const advClass = resolveAdvancedClass(
    initSkills,
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
    spellCardCharge: 15,
    innateTraitIds: [...def.innateTraitIds],
    knownSpellIds: [...def.knownSpellIds],
    signatureSpellCardId: def.signatureSpellCardId,
    potions: def.initialPotions.map((p) => ({ ...p })),
    skills: { ...initSkills },
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

/** 初始化一场全新的六边形战术战斗 */
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

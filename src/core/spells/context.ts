/**
 * 法术执行器共享依赖接口与运行时上下文类型
 */

import type { CombatContentCatalog } from '../combatEngine';
import type { HexCoord } from '../hex';
import type { computeUnitStats } from '../modifiers';
import type { SpellPowerHookContext } from '../traits';
import type {
  BattleState,
  BattleUnit,
  CombatCommand,
  CombatEvent,
  CommandResult,
  SpellDef,
  StatModifier,
} from '../types';

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

/** 单次施法结算期间各分派处理器共享的可变上下文 */
export interface SpellCastContext {
  state: BattleState;
  unit: BattleUnit;
  spell: SpellDef;
  eff: string;
  command: Extract<CombatCommand, { type: 'CAST_SPELL' }>;
  catalog: CombatContentCatalog;
  events: CombatEvent[];
  deps: SpellExecutionDeps;
  casterStats: ReturnType<typeof computeUnitStats>;
  castHook: SpellPowerHookContext;
  schoolMult: number;
  lifeDurationBonus: number;
  mindDurationBonus: number;
  effectiveRange: number;
  calcPower: (baseValue: number, heroSpWeight: number) => number;
  touchStatusFlag: (target: BattleUnit, flagKey: string) => void;
  pushSpellModifier: (target: BattleUnit, mod: StatModifier) => void;
  isTargetBlockedByLiving: (target: BattleUnit) => boolean;
  isTargetBlockedByMind: (target: BattleUnit) => boolean;
  requireSingleUnit: (allowDead?: boolean) => BattleUnit | string;
  affectedUnitIds: string[];
  damageMap: Record<string, { damage: number; kills: number; grazed: boolean }>;
  healMap: Record<string, number>;
  reviveMap: Record<string, { revivedCount: number; healedHp: number }>;
  summonedUnitIds: string[];
  displacedUnits: Array<{ unitId: string; to: HexCoord }>;
  targetHex: HexCoord;
  noteText?: string;
}

/** 子处理器返回值：null 表示正常完成；CommandResult 表示校验失败需中止施法 */
export type SpellBranchOutcome = CommandResult | null;

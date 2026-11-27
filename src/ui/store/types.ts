/**
 * 战斗状态桥公共 UI 状态与悬停交互类型定义
 */

import type { HexCoord } from '@core/hex';
import type {
  AttackPreview,
  BattleUnit,
  ProjectileTrajectoryPreview,
  RangedPenaltyTier,
  SpellDef,
} from '@core/types';

export type SecondaryDrawerType = 'none' | 'spells' | 'potions' | 'logs' | 'settings';

export type TacticalCursorKind =
  | 'default'
  | 'move'
  | 'fly_move'
  | 'melee'
  | 'ranged'
  | 'ranged_penalty'
  | 'spell'
  | 'blocked'
  | 'inspect';

export interface TacticalCursorState {
  kind: TacticalCursorKind;
  angleDeg: number;
  label?: string;
  /** 远程射击时的 HoMM4 原版距离/遮挡衰减档位（默认 full / 1/2 / 最低 1/4） */
  rangedPenaltyTier?: RangedPenaltyTier;
}

export interface SpellCardBannerState {
  visible: boolean;
  name: string;
  subtitle: string;
  themeColor: string;
  accentColor: string;
  casterBlueprintId?: string;
}

export interface UnitDetailModalState {
  unitId: string;
  x: number;
  y: number;
}

export interface HoverAttackContext {
  attacker: BattleUnit;
  defender: BattleUnit;
  preview: AttackPreview;
  isCurrentTurnAttacker: boolean;
  chosenApproachHex: HexCoord | null;
  candidateApproachHexes: HexCoord[];
}

export interface HoverSpellContext {
  spell: SpellDef;
  caster: BattleUnit;
  manaCost: number;
  effRange: number;
  distance: number;
  targetHex: HexCoord;
  targetUnit: BattleUnit | null;
  canCast: boolean;
  /** 无法施放时的详细中文说明（如被何物阻挡、超出射程或目标魔免） */
  reason?: string;
  /** 战术指针与紧凑浮标使用的简短标签 */
  shortLabel: string;
  /** 施法飞行路径与阻挡/超距诊断模型 */
  trajectory: ProjectileTrajectoryPreview | null;
}

/** 触控模式下底部战术确认操作栏的实时状态摘要 */
export interface TouchActionSummary {
  mode: 'move' | 'attack' | 'spell' | 'spell_card' | 'inspect' | 'blocked' | 'targeting_idle';
  title: string;
  detail: string;
  badgeText?: string;
  badgeTone?: 'gold' | 'jade' | 'danger' | 'mana' | 'warn';
  canConfirm: boolean;
  confirmLabel: string;
  inspectUnitId: string | null;
  approachCount: number;
  approachIndex: number;
  isTargeting: boolean;
}

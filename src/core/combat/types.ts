/**
 * 战斗引擎对外暴露的目录接口与初始化/概率配置类型
 */

import type { HexTile } from '../hex';
import type { GameDataRegistry } from '../modifiers';
import type {
  ControllerType,
  CreatureDefinition,
  HeroDefinition,
  PotionDef,
  SideId,
  SpellCardDef,
  SpellDef,
} from '../types';

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

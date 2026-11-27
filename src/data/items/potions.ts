/**
 * 英雄腰带战斗秘药数据表
 */

import type { PotionDef } from '@core/types';

/** 英雄腰带战斗秘药 */
export const POTIONS: Record<string, PotionDef> = {
  healing_elixir: {
    id: 'healing_elixir',
    name: '蓬莱治愈药',
    description: '饮用后立即恢复英雄 75 点生命值，不消耗本回合行动权。',
    effectType: 'heal',
    power: 75,
    color: '#e6556b',
  },
  spirit_draught: {
    id: 'spirit_draught',
    name: '高纯灵力露',
    description: '饮用后恢复 18 点灵力并立即增加 +15% 符卡充能，不消耗本回合行动权。',
    effectType: 'mana_charge',
    power: 18,
    color: '#5fa8ff',
  },
  iron_barrier_oil: {
    id: 'iron_barrier_oil',
    name: '结界硬化秘药',
    description: '饮用后持续 2 回合防御 +35%、擦弹率 +15%，不消耗本回合行动权。',
    effectType: 'combat_elixir',
    power: 35,
    color: '#e8c468',
  },
};

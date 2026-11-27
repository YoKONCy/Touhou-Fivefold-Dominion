/**
 * 全阵营兵种定义总汇（生命 / 混沌 / 秩序 / 死亡 / 力量 / 召唤模板 / 储备兵种）
 */

import type { CreatureDefinition } from '@core/types';
import { H4_SUMMON_TEMPLATES } from '../spells/summonTemplates';
import { CHAOS_CREATURES } from './chaos/creatures';
import { DEATH_CREATURES } from './death/creatures';
import { LIFE_CREATURES } from './life/creatures';
import { MIGHT_CREATURES } from './might/creatures';
import { RESERVE_CREATURES } from './neutral/creatures';
import { ORDER_CREATURES } from './order/creatures';

export { CHAOS_CREATURES } from './chaos/creatures';
export { DEATH_CREATURES } from './death/creatures';
export { LIFE_CREATURES } from './life/creatures';
export { MIGHT_CREATURES } from './might/creatures';
export { RESERVE_CREATURES } from './neutral/creatures';
export { ORDER_CREATURES } from './order/creatures';

/** 全量量产兵种静态定义总表 */
export const CREATURE_DEFINITIONS: Record<string, CreatureDefinition> = {
  ...LIFE_CREATURES,
  ...CHAOS_CREATURES,
  ...H4_SUMMON_TEMPLATES,
  ...ORDER_CREATURES,
  ...DEATH_CREATURES,
  ...MIGHT_CREATURES,
  ...RESERVE_CREATURES,
};

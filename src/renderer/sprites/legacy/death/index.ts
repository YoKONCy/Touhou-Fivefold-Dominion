/**
 * 幽冥公馆 · 死亡系（蕾米莉亚 + 8 位死亡城镇兵种 + 深渊冰魔）精雕 48×54 像素立绘聚合导出
 */

import type { SpriteRigSpec } from '../../../voxelSprites';
import { DEATH_LOW_TIER_RIG_SPECS } from './lowTier';
import { DEATH_MID_TIER_RIG_SPECS } from './midTier';
import { DEATH_HIGH_TIER_RIG_SPECS } from './highTier';

export const DEATH_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  ...DEATH_LOW_TIER_RIG_SPECS,
  ...DEATH_MID_TIER_RIG_SPECS,
  ...DEATH_HIGH_TIER_RIG_SPECS,
};

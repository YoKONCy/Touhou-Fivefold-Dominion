/**
 * 幻月庭园 · 秩序系（八意永琳 + 6 位秩序兵种 + 月影妖兔变身形态）精雕 48×54 像素立绘聚合导出
 */

import type { SpriteRigSpec } from '../../../voxelSprites';
import { ORDER_LOW_TIER_RIG_SPECS } from './lowTier';
import { ORDER_HIGH_TIER_RIG_SPECS } from './highTier';

export const ORDER_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  ...ORDER_LOW_TIER_RIG_SPECS,
  ...ORDER_HIGH_TIER_RIG_SPECS,
};

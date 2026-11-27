/**
 * 博丽神社 · 生命系精雕 7 位像素立绘聚合导出
 */

import type { SpriteRigSpec } from '../../voxelSprites';
import { LIFE_LOW_RIG_SPECS } from './lifeLow';
import { LIFE_HIGH_RIG_SPECS } from './lifeHigh';

export const LIFE_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  ...LIFE_LOW_RIG_SPECS,
  ...LIFE_HIGH_RIG_SPECS,
};

/**
 * 魔法之森 · 混沌系精雕 7 位像素立绘聚合导出
 */

import type { SpriteRigSpec } from '../../voxelSprites';
import { CHAOS_LOW_RIG_SPECS } from './chaosLow';
import { CHAOS_HIGH_RIG_SPECS } from './chaosHigh';

export const CHAOS_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  ...CHAOS_LOW_RIG_SPECS,
  ...CHAOS_HIGH_RIG_SPECS,
};

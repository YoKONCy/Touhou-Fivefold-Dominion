/**
 * 四阵营标准分辨率 48×54 精灵蓝图聚合转发入口
 * 汇总秩序系、死亡系、博丽·生命系与魔法使·混沌系全部蓝图，保持键名与绘制逻辑完全一致
 */

import type { SpriteRigSpec } from './voxelSprites';
import { ORDER_FACTION_RIG_SPECS } from './orderFactionSprites';
import { DEATH_FACTION_RIG_SPECS } from './deathFactionSprites';
import { LIFE_FACTION_RIG_SPECS } from './sprites/legacy/life';
import { CHAOS_FACTION_RIG_SPECS } from './sprites/legacy/chaos';

export const FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  ...ORDER_FACTION_RIG_SPECS,
  ...DEATH_FACTION_RIG_SPECS,
  ...LIFE_FACTION_RIG_SPECS,
  ...CHAOS_FACTION_RIG_SPECS,
};

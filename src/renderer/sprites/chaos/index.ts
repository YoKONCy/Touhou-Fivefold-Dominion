/**
 * 魔导结社 · 混沌阵营全量 9 套 64×72 新一代精雕像素绘谱聚合入口
 *
 * 完整覆盖混沌阵营全部 9 个模型蓝图：
 * 1. hero_marisa              — 雾雨魔理沙（混沌英雄 · 1×1 飞行远程）
 * 2. creature_shadow_imp      — 夜影使魔（混沌 T1-A · 1×1 潜行暗系刺客）
 * 3. creature_broom_caster    — 魔法使（混沌 T1-B · 1×1 短程施法游击小魔女）
 * 4. creature_hourai_doll     — 武装人形（混沌 T2-A · 1×1 机械绝对格挡）
 * 5. creature_grimoire        — 禁忌之书（混沌 T2-B · 2×1 浮空暗系炮台）
 * 6. creature_nightmare       — 梦境兽（混沌 T3-A · 2×1 暗系星梦喰梦兽）
 * 7. creature_efreet          — 法界之火（混沌 T3-B · 1×2 飞行元素）
 * 8. creature_arcane_colossus — 魔导巨像（混沌 T4-A · 2×2 机械周身全扫）
 * 9. creature_crimson_dragon  — 红莲魔龙（混沌 T4-B · 2×2 飞行全魔免终极霸主）
 */

import type { SpriteRigSpec } from '../../voxelSprites';
import { CREATURE_ARCANE_COLOSSUS_RIG_SPEC } from './arcaneColossus';
import { CREATURE_BROOM_CASTER_RIG_SPEC } from './broomCaster';
import { CREATURE_CRIMSON_DRAGON_RIG_SPEC } from './crimsonDragon';
import { CREATURE_EFREET_RIG_SPEC } from './efreet';
import { CREATURE_GRIMOIRE_RIG_SPEC } from './grimoire';
import { HERO_MARISA_RIG_SPEC } from './heroMarisa';
import { CREATURE_HOURAI_DOLL_RIG_SPEC } from './houraiDoll';
import { CREATURE_NIGHTMARE_RIG_SPEC } from './nightmare';
import { CREATURE_SHADOW_IMP_RIG_SPEC } from './shadowImp';

/** 混沌阵营全量 HD 像素精灵配置映射表 */
export const HD_CHAOS_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  hero_marisa: HERO_MARISA_RIG_SPEC,
  creature_shadow_imp: CREATURE_SHADOW_IMP_RIG_SPEC,
  creature_broom_caster: CREATURE_BROOM_CASTER_RIG_SPEC,
  creature_hourai_doll: CREATURE_HOURAI_DOLL_RIG_SPEC,
  creature_grimoire: CREATURE_GRIMOIRE_RIG_SPEC,
  creature_nightmare: CREATURE_NIGHTMARE_RIG_SPEC,
  creature_efreet: CREATURE_EFREET_RIG_SPEC,
  creature_arcane_colossus: CREATURE_ARCANE_COLOSSUS_RIG_SPEC,
  creature_crimson_dragon: CREATURE_CRIMSON_DRAGON_RIG_SPEC,
};

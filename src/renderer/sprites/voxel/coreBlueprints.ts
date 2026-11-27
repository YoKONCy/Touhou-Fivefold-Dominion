/**
 * 全部 9 位内置基础东方角色与兵种的骨骼解构多态动画绘谱总表（画布 48×54，脚底锚点 24, 49，默认朝右）
 *
 * 按英雄主角、精怪生物与巨像造物拆分为三个子模块，在此按原键序装配导出。
 */

import { CONSTRUCT_RIG_SPECS } from './constructBlueprints';
import { CREATURE_RIG_SPECS } from './creatureBlueprints';
import { HERO_RIG_SPECS } from './heroBlueprints';
import type { SpriteRigSpec } from './types';

/** 全部 9 位基础角色与兵种骨骼绘谱表 */
export const RIG_SPECS: Record<string, SpriteRigSpec> = {
  hero_reimu: HERO_RIG_SPECS.hero_reimu,
  hero_marisa: HERO_RIG_SPECS.hero_marisa,
  creature_kedama: CREATURE_RIG_SPECS.creature_kedama,
  creature_fairy: CREATURE_RIG_SPECS.creature_fairy,
  creature_rabbit: CREATURE_RIG_SPECS.creature_rabbit,
  creature_golem: CONSTRUCT_RIG_SPECS.creature_golem,
  creature_grimoire: CONSTRUCT_RIG_SPECS.creature_grimoire,
  creature_spirit: CREATURE_RIG_SPECS.creature_spirit,
  creature_hisoutensoku: CONSTRUCT_RIG_SPECS.creature_hisoutensoku,
};

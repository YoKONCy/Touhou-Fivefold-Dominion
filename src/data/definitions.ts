/**
 * 《Touhou-H4》数据总汇聚合入口（兼容导出层）
 *
 * 各领域与阵营数据已按目录拆解：
 * - 神器与秘药：`src/data/items/`
 * - 五系法术与专属符卡：`src/data/spells/`
 * - 东方英雄：`src/data/heroes/`
 * - 各阵营兵种：`src/data/factions/{life,chaos,order,death,neutral}/`
 * - 默认战场地形：`src/data/maps/`
 */

import { H4_ADVANCED_CLASSES } from '@core/h4Skills';
import type { GameDataRegistry } from '@core/modifiers';
import type { AdvancedClassDef, SpellDef } from '@core/types';
import { ARTIFACTS, ARTIFACT_SETS } from './items/artifacts';
import { H4_SPELLS, TOUHOU_EXTRA_SPELLS } from './spells';

export { CREATURE_DEFINITIONS } from './factions';
export { HERO_DEFINITIONS } from './heroes';
export { ARTIFACTS, ARTIFACT_SETS } from './items/artifacts';
export { POTIONS } from './items/potions';
export { buildShrineNightBattleMap, SHRINE_FIELD_PROJECTION } from './maps/shrineField';
export { SPELL_CARDS } from './spells';

/** HoMM4 全量 37 种双修/全能进阶组合职业（C(9,2)=36 两两双修 + 万象大贤者，东方双层风味命名） */
export const ADVANCED_CLASSES: Record<string, AdvancedClassDef> = H4_ADVANCED_CLASSES;

/** 修饰符计算器使用的静态数据注册表 */
export const GAME_DATA_REGISTRY: GameDataRegistry = {
  advancedClasses: ADVANCED_CLASSES,
  artifacts: ARTIFACTS,
  artifactSets: ARTIFACT_SETS,
};

/** 通用五系法术总录（包含全部 142 个 HoMM4 官方五系法术 + 东方专属兵种术式兼容保留） */
export const SPELLS: Record<string, SpellDef> = {
  ...H4_SPELLS,
  ...TOUHOU_EXTRA_SPELLS,
};

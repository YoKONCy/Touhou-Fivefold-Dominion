/**
 * 武艺旧都 · 力量阵营 9 位单位（星熊勇仪 + 8 城镇兵种）64×72 精雕像素绘谱聚合索引
 */

import type { SpriteRigSpec } from '../../voxelSprites';
import { berserkerSpec } from './berserker';
import { crimsonThunderbirdSpec } from './crimsonThunderbird';
import { HERO_YUUGI_RIG_SPEC } from './heroYuugi';
import { javelineerSpec } from './javelineer';
import { lavaBehemothSpec } from './lavaBehemoth';
import { mountainThrowerSpec } from './mountainThrower';
import { oniVanguardSpec } from './oniVanguard';
import { redPriestSpec } from './redPriest';
import { roamingHoundSpec } from './roamingHound';

export const HD_MIGHT_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  hero_yuugi: HERO_YUUGI_RIG_SPEC,
  creature_might_berserker: berserkerSpec,
  creature_might_javelineer: javelineerSpec,
  creature_might_oni_vanguard: oniVanguardSpec,
  creature_might_roaming_hound: roamingHoundSpec,
  creature_might_mountain_thrower: mountainThrowerSpec,
  creature_might_red_priest: redPriestSpec,
  creature_might_crimson_thunderbird: crimsonThunderbirdSpec,
  creature_might_lava_behemoth: lavaBehemothSpec,
};

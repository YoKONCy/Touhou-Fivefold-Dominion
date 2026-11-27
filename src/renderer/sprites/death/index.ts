/**
 * 幽冥公馆 · 死亡阵营其余 9 位单位 64×72 新一代精雕像素绘谱聚合索引（与 v8 蕾米莉亚 100% 统一画风！）
 *
 * 严格遵循 v8 黄金像素美学标准：
 * - 7 位东方萌系美少女（小恶魔 / 怨灵 / 地狱鸦 / 血族眷属 / 毒瘴妖 / 深渊隙间恶魔 / 深渊冰魔）：
 *   2.3 头身圆润苹果脸 + 4×4 水灵朝右宝石大眼 + 干净大色块发团与波浪裙摆 + 3/4 斜错步 + 2px 软萌少女小臂！
 * - 2 位硬核帅气骨系单位（尸壳 / 骸骨巨龙）：
 *   全画幅立体骸骨结构、镂空胸肋幽焰、凶猛獠牙骨首与撕裂冥焰蝠翼，帅气凶狠绝不敷衍！
 */

import type { SpriteRigSpec } from '../../voxelSprites';
import { abyssGapDevilSpec } from './abyssGapDevil';
import { abyssIceDemonSpec } from './abyssIceDemon';
import { boneDragonSpec } from './boneDragon';
import { corpseHuskSpec } from './corpseHusk';
import { crimsonVampireSpec } from './crimsonVampire';
import { hellRavenSpec } from './hellRaven';
import { koakumaImpSpec } from './koakumaImp';
import { miasmaVenomSpec } from './miasmaVenom';
import { wraithSpiritSpec } from './wraithSpirit';

export const HD_DEATH_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  creature_corpse_husk: corpseHuskSpec,
  creature_koakuma_imp: koakumaImpSpec,
  creature_wraith_spirit: wraithSpiritSpec,
  creature_hell_raven: hellRavenSpec,
  creature_crimson_vampire: crimsonVampireSpec,
  creature_miasma_venom: miasmaVenomSpec,
  creature_bone_dragon: boneDragonSpec,
  creature_abyss_gap_devil: abyssGapDevilSpec,
  creature_abyss_ice_demon: abyssIceDemonSpec,
};

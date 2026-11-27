/**
 * 博丽神社 · 信仰圣域（生命阵营）全量 8 大兵种 64×72 新一代精雕像素绘谱聚合导出
 *
 * 严格遵循 v8 黄金像素美学标准：
 * - 4 位东方萌系美少女（御札弓手 / 退魔剑士 / 净邪巫女 / 1×2 六翼炽光神使）：
 *   2.3 头身圆润苹果脸 + 4×4 水灵朝右宝石大眼 + 干净大色块发团与波浪裙摆 + 3/4 斜错步 + 2px 软萌少女小臂 + 环握玉手！
 * - 2 位宏伟神兽与圣骑（2×2 镇守狛犬 / 2×1 御柱天马圣骑）：
 *   全画幅立体雕塑感体态、四足动态奔袭/人立飞扑/冲锋刺枪、层次丰富的毛发/石肌/羽翼/鎏金铠甲，威武华丽！
 * - 2 位神社经典灵物与圣器（博丽毛玉 / 阴阳浮游炮）：
 *   数学精确光栅化立体琉璃太极核、高弹性挤压拉伸云团绒毛、雕花古金八卦环与 3D 公转棱镜浮游炮！
 */

import type { SpriteRigSpec } from '../../voxelSprites';
import { creatureExorcistBladeSpec } from './exorcistBlade';
import { creatureHakureiSeraphSpec } from './hakureiSeraph';
import { creatureKedamaSpec } from './kedama';
import { creatureKomainuSpec } from './komainu';
import { creatureOfudaArcherSpec } from './ofudaArcher';
import { creatureOnbashiraSteedSpec } from './onbashiraSteed';
import { creaturePrayerMaidenSpec } from './prayerMaiden';
import { creatureYinyangTurretSpec } from './yinyangTurret';

/** 生命阵营全量 8 大兵种 64×72 HD 像素精灵表 */
export const HD_LIFE_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  creature_kedama: creatureKedamaSpec,
  creature_ofuda_archer: creatureOfudaArcherSpec,
  creature_komainu: creatureKomainuSpec,
  creature_yinyang_turret: creatureYinyangTurretSpec,
  creature_exorcist_blade: creatureExorcistBladeSpec,
  creature_prayer_maiden: creaturePrayerMaidenSpec,
  creature_onbashira_steed: creatureOnbashiraSteedSpec,
  creature_hakurei_seraph: creatureHakureiSeraphSpec,
};

/**
 * 幻月庭园 · 秩序阵营全量 10 套 64×72 新一代精雕像素绘谱聚合索引（与 v8 灵梦 / 蕾米 / 生命 / 死亡 100% 统一画风！）
 *
 * 完整覆盖秩序阵营全部 10 个模型蓝图：
 * 1. hero_eirin                 — 八意永琳（秩序英雄 · 1×1 远程天弓「天文密葬」）
 * 2. creature_rabbit            — 竹林妖怪兔（秩序 T1-A · 1×1 抗魔施法萌兔）
 * 3. creature_rabbit_transformed— 兔化真身（T1-A「兔化」变身专属 · 四足飞跃月影灵兔）
 * 4. creature_lunar_slinger     — 玉兔掷弹兵（秩序 T1-B · 1×1 远程巨人杀手）
 * 5. creature_tanuki_illusionist— 幻法狸妖（秩序 T2-A · 1×1 绘月折扇远程幻术师）
 * 6. creature_armored_lunar_guard— 重装月兔近卫（秩序 T2-B · 1×1 秘银鸢盾长戟重甲女骑）
 * 7. creature_lunar_genie       — 幻月妖（秩序 T3-A · 1×1 瞬移星纱天女与真·镂空新月星轮）
 * 8. creature_combat_mk2        — 战斗 II 型（秩序 T3-B · 1×2 河童重工六臂阿修罗武士机甲）
 * 9. creature_purity_titan      — 净秽者（秩序 T4-A · 1×2 月都苍雷天神将与真·镂空日晷神轮）
 * 10. creature_hisoutensoku     — 非想天则（秩序 T4-B · 2×2 勇者系蒸汽核动力先攻机神）
 */

import type { SpriteRigSpec } from '../../voxelSprites';
import { armoredLunarGuardRigSpec } from './armoredLunarGuard';
import { combatMk2RigSpec } from './combatMk2';
import { heroEirinRigSpec } from './heroEirin';
import { hisoutensokuRigSpec } from './hisoutensoku';
import { lunarGenieRigSpec } from './lunarGenie';
import { lunarSlingerRigSpec } from './lunarSlinger';
import { purityTitanRigSpec } from './purityTitan';
import { rabbitRigSpec, rabbitTransformedRigSpec } from './rabbit';
import { tanukiIllusionistRigSpec } from './tanukiIllusionist';

/** 秩序阵营全部 10 套 HD 像素精灵蓝图映射表 */
export const HD_ORDER_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  hero_eirin: heroEirinRigSpec,
  creature_rabbit: rabbitRigSpec,
  creature_rabbit_transformed: rabbitTransformedRigSpec,
  creature_lunar_slinger: lunarSlingerRigSpec,
  creature_tanuki_illusionist: tanukiIllusionistRigSpec,
  creature_armored_lunar_guard: armoredLunarGuardRigSpec,
  creature_lunar_genie: lunarGenieRigSpec,
  creature_combat_mk2: combatMk2RigSpec,
  creature_purity_titan: purityTitanRigSpec,
  creature_hisoutensoku: hisoutensokuRigSpec,
};

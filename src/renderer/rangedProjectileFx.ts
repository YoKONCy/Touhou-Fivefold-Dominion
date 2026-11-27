/**
 * 五大经典远程弹道原型与命中特效映射库
 *
 * 严格遵循五类清晰复用的视觉语言：
 * 1. arrow           — 箭矢：修长锐利破空羽箭 + 羽尾 + 迅捷风切尾迹（命中：锐利穿刺锋芒）
 * 2. light_orb       — 光球：圣洁/月华双层发光灵弹 + 十字星闪与柔光彗尾（命中：灵光绽放）
 * 3. dark_orb        — 暗球：深暗魔核 + 锯齿邪光外环与幽暗尾烟（命中：暗影/毒瘴裂爆）
 * 4. magic_wave      — 魔法冲击波：随航向精确旋转的双层新月形奥术能量弧（命中：奥术震波）
 * 5. explosive_shell — 爆裂弹：高抛物线重弹 + 闪烁炽焰引信尾火（命中：炽烈爆裂冲击）
 */

import * as PIXI from 'pixi.js';
import type { SoundId } from '@audio/index';
import type { PixelFxEffectId, TouhouPaletteKey } from './pixelfxBridge';

export type RangedProjectileKind =
  | 'arrow'
  | 'light_orb'
  | 'dark_orb'
  | 'magic_wave'
  | 'explosive_shell';

export interface RangedProjectileProfile {
  kind: RangedProjectileKind;
  /** 弹体主色（十六进制） */
  primaryColor: number;
  /** 弹体辅助/高光/外晕色 */
  accentColor: number;
  /** 抛物线最高拱起像素高度 */
  arcHeight: number;
  /** 飞行耗时（秒） */
  duration: number;
  /** 命中时播放的 pixelfx 特效模块 */
  impactFx: PixelFxEffectId;
  /** 命中特效所使用的东方调色板 */
  impactPalette: TouhouPaletteKey;
  /** 命中额外发光强度 */
  impactLight: number;
}

/** 按单位 defId / blueprintId 精准映射到五大经典远程弹道 */
const UNIT_RANGED_PROFILES: Record<string, RangedProjectileProfile> = {
  // ===== 1. 箭矢（arrow）=====
  hero_eirin: {
    kind: 'arrow',
    primaryColor: 0x7ae8ff,
    accentColor: 0xffe885,
    arcHeight: 7,
    duration: 0.19,
    impactFx: 'thrust',
    impactPalette: 'order_lunar',
    impactLight: 1.48,
  },
  ofuda_archer: {
    kind: 'arrow',
    primaryColor: 0x5ce8c4,
    accentColor: 0xffe478,
    arcHeight: 8,
    duration: 0.19,
    impactFx: 'thrust',
    impactPalette: 'spring_dew',
    impactLight: 1.42,
  },
  creature_ofuda_archer: {
    kind: 'arrow',
    primaryColor: 0x5ce8c4,
    accentColor: 0xffe478,
    arcHeight: 8,
    duration: 0.19,
    impactFx: 'thrust',
    impactPalette: 'spring_dew',
    impactLight: 1.42,
  },
  summon_elf: {
    kind: 'arrow',
    primaryColor: 0x7dff9e,
    accentColor: 0xfff0a6,
    arcHeight: 7,
    duration: 0.18,
    impactFx: 'thrust',
    impactPalette: 'nature_emerald',
    impactLight: 1.4,
  },

  // ===== 2. 光球（light_orb）=====
  hero_reimu: {
    kind: 'light_orb',
    primaryColor: 0xff5e7e,
    accentColor: 0xffe899,
    arcHeight: 11,
    duration: 0.21,
    impactFx: 'halo',
    impactPalette: 'reimu_crimson',
    impactLight: 1.5,
  },
  prayer_maiden: {
    kind: 'light_orb',
    primaryColor: 0x78ffea,
    accentColor: 0xfff5c2,
    arcHeight: 12,
    duration: 0.21,
    impactFx: 'halo',
    impactPalette: 'celestial_jade',
    impactLight: 1.45,
  },
  creature_prayer_maiden: {
    kind: 'light_orb',
    primaryColor: 0x78ffea,
    accentColor: 0xfff5c2,
    arcHeight: 12,
    duration: 0.21,
    impactFx: 'halo',
    impactPalette: 'celestial_jade',
    impactLight: 1.45,
  },
  sunflower_fairy: {
    kind: 'light_orb',
    primaryColor: 0xffe066,
    accentColor: 0xffffff,
    arcHeight: 12,
    duration: 0.21,
    impactFx: 'sunburst',
    impactPalette: 'shrine_gold',
    impactLight: 1.4,
  },
  creature_fairy: {
    kind: 'light_orb',
    primaryColor: 0xffe066,
    accentColor: 0xffffff,
    arcHeight: 12,
    duration: 0.21,
    impactFx: 'sunburst',
    impactPalette: 'shrine_gold',
    impactLight: 1.4,
  },
  summon_water_elemental: {
    kind: 'light_orb',
    primaryColor: 0x66dcff,
    accentColor: 0xe3fbff,
    arcHeight: 12,
    duration: 0.21,
    impactFx: 'water_orb',
    impactPalette: 'frost_cyan',
    impactLight: 1.42,
  },

  // ===== 3. 暗球（dark_orb）=====
  hero_remilia: {
    kind: 'dark_orb',
    primaryColor: 0xe61c4b,
    accentColor: 0xff85a8,
    arcHeight: 11,
    duration: 0.21,
    impactFx: 'dark_explosion',
    impactPalette: 'scarlet_moon',
    impactLight: 1.52,
  },
  grimoire_familiar: {
    kind: 'dark_orb',
    primaryColor: 0x9c42ff,
    accentColor: 0xff66c4,
    arcHeight: 12,
    duration: 0.21,
    impactFx: 'dark_explosion',
    impactPalette: 'black_void',
    impactLight: 1.48,
  },
  creature_grimoire: {
    kind: 'dark_orb',
    primaryColor: 0x9c42ff,
    accentColor: 0xff66c4,
    arcHeight: 12,
    duration: 0.21,
    impactFx: 'dark_explosion',
    impactPalette: 'black_void',
    impactLight: 1.48,
  },
  miasma_venom_youkai: {
    kind: 'dark_orb',
    primaryColor: 0x4ee66b,
    accentColor: 0xc270ff,
    arcHeight: 13,
    duration: 0.22,
    impactFx: 'dark_explosion',
    impactPalette: 'suzuran_venom',
    impactLight: 1.45,
  },
  creature_miasma_venom: {
    kind: 'dark_orb',
    primaryColor: 0x4ee66b,
    accentColor: 0xc270ff,
    arcHeight: 13,
    duration: 0.22,
    impactFx: 'dark_explosion',
    impactPalette: 'suzuran_venom',
    impactLight: 1.45,
  },
  summon_waspwort: {
    kind: 'dark_orb',
    primaryColor: 0x62cc47,
    accentColor: 0xd9ff66,
    arcHeight: 12,
    duration: 0.21,
    impactFx: 'dark_explosion',
    impactPalette: 'yomi_plague',
    impactLight: 1.4,
  },

  // ===== 4. 魔法冲击波（magic_wave）=====
  hero_marisa: {
    kind: 'magic_wave',
    primaryColor: 0xffd84d,
    accentColor: 0xfff8cc,
    arcHeight: 4,
    duration: 0.19,
    impactFx: 'mana_burst',
    impactPalette: 'marisa_starlight',
    impactLight: 1.55,
  },
  broom_caster: {
    kind: 'magic_wave',
    primaryColor: 0xffc847,
    accentColor: 0x9ae8ff,
    arcHeight: 5,
    duration: 0.19,
    impactFx: 'mana_burst',
    impactPalette: 'marisa_starlight',
    impactLight: 1.48,
  },
  creature_broom_caster: {
    kind: 'magic_wave',
    primaryColor: 0xffc847,
    accentColor: 0x9ae8ff,
    arcHeight: 5,
    duration: 0.19,
    impactFx: 'mana_burst',
    impactPalette: 'marisa_starlight',
    impactLight: 1.48,
  },
  tanuki_illusionist: {
    kind: 'magic_wave',
    primaryColor: 0xc275ff,
    accentColor: 0x99f0ff,
    arcHeight: 6,
    duration: 0.2,
    impactFx: 'mana_burst',
    impactPalette: 'mirage_prism',
    impactLight: 1.46,
  },
  creature_tanuki_illusionist: {
    kind: 'magic_wave',
    primaryColor: 0xc275ff,
    accentColor: 0x99f0ff,
    arcHeight: 6,
    duration: 0.2,
    impactFx: 'mana_burst',
    impactPalette: 'mirage_prism',
    impactLight: 1.46,
  },
  purity_titan: {
    kind: 'magic_wave',
    primaryColor: 0x62c4ff,
    accentColor: 0xffe885,
    arcHeight: 3,
    duration: 0.18,
    impactFx: 'spark_arc',
    impactPalette: 'thunder_violet',
    impactLight: 1.62,
  },
  creature_purity_titan: {
    kind: 'magic_wave',
    primaryColor: 0x62c4ff,
    accentColor: 0xffe885,
    arcHeight: 3,
    duration: 0.18,
    impactFx: 'spark_arc',
    impactPalette: 'thunder_violet',
    impactLight: 1.62,
  },
  summon_faerie_dragon: {
    kind: 'magic_wave',
    primaryColor: 0xd978ff,
    accentColor: 0x8cf5c4,
    arcHeight: 5,
    duration: 0.19,
    impactFx: 'mana_burst',
    impactPalette: 'gap_violet',
    impactLight: 1.52,
  },

  // ===== 5. 爆裂弹（explosive_shell）=====
  lunar_slinger: {
    kind: 'explosive_shell',
    primaryColor: 0xffa633,
    accentColor: 0xfff099,
    arcHeight: 24,
    duration: 0.24,
    impactFx: 'plasma_explosion',
    impactPalette: 'phoenix_flame',
    impactLight: 1.52,
  },
  creature_lunar_slinger: {
    kind: 'explosive_shell',
    primaryColor: 0xffa633,
    accentColor: 0xfff099,
    arcHeight: 24,
    duration: 0.24,
    impactFx: 'plasma_explosion',
    impactPalette: 'phoenix_flame',
    impactLight: 1.52,
  },
  yinyang_turret: {
    kind: 'explosive_shell',
    primaryColor: 0xff4263,
    accentColor: 0xffe878,
    arcHeight: 22,
    duration: 0.23,
    impactFx: 'plasma_explosion',
    impactPalette: 'reimu_crimson',
    impactLight: 1.56,
  },
  creature_yinyang_turret: {
    kind: 'explosive_shell',
    primaryColor: 0xff4263,
    accentColor: 0xffe878,
    arcHeight: 22,
    duration: 0.23,
    impactFx: 'plasma_explosion',
    impactPalette: 'reimu_crimson',
    impactLight: 1.56,
  },
  // ===== 6. 武艺旧都力量系专属远程（标枪 / 巨岩 / 勇仪裂空石酒波）=====
  might_javelineer: {
    kind: 'arrow',
    primaryColor: 0xe8a45c,
    accentColor: 0xffeed1,
    arcHeight: 15,
    duration: 0.2,
    impactFx: 'hit_spark',
    impactPalette: 'shrine_gold',
    impactLight: 1.35,
  },
  creature_might_javelineer: {
    kind: 'arrow',
    primaryColor: 0xe8a45c,
    accentColor: 0xffeed1,
    arcHeight: 15,
    duration: 0.2,
    impactFx: 'hit_spark',
    impactPalette: 'shrine_gold',
    impactLight: 1.35,
  },
  might_mountain_thrower: {
    kind: 'explosive_shell',
    primaryColor: 0xd96b2b,
    accentColor: 0xffe082,
    arcHeight: 30,
    duration: 0.28,
    impactFx: 'big_explosion',
    impactPalette: 'hell_inferno',
    impactLight: 1.7,
  },
  creature_might_mountain_thrower: {
    kind: 'explosive_shell',
    primaryColor: 0xd96b2b,
    accentColor: 0xffe082,
    arcHeight: 30,
    duration: 0.28,
    impactFx: 'big_explosion',
    impactPalette: 'hell_inferno',
    impactLight: 1.7,
  },
  hero_yuugi: {
    kind: 'explosive_shell',
    primaryColor: 0xff7b29,
    accentColor: 0xffe885,
    arcHeight: 18,
    duration: 0.22,
    impactFx: 'plasma_explosion',
    impactPalette: 'phoenix_flame',
    impactLight: 1.62,
  },
};

const FALLBACK_LIGHT_ORB: RangedProjectileProfile = {
  kind: 'light_orb',
  primaryColor: 0x99d6ff,
  accentColor: 0xffffff,
  arcHeight: 11,
  duration: 0.2,
  impactFx: 'hit_spark',
  impactPalette: 'order_lunar',
  impactLight: 1.35,
};

/** 五类远程弹道原型到物理建模发射音效的映射表 */
const RANGED_SHOT_SOUND_MAP: Record<RangedProjectileKind, SoundId> = {
  arrow: 'shot_arrow',
  light_orb: 'shot_light_orb',
  dark_orb: 'shot_dark_orb',
  magic_wave: 'shot_magic_wave',
  explosive_shell: 'shot_explosive_shell',
};

/** 按远程弹道原型返回专属发射音效 ID（箭矢硬弓弦/光球圣铃/暗球低涡/魔法冲击波/爆裂弹迫击炮） */
export function resolveRangedShotSound(kind: RangedProjectileKind): SoundId {
  return RANGED_SHOT_SOUND_MAP[kind];
}

/** 按单位 defId 与 blueprintId 解析对应的五类远程弹道配置（100% 覆盖全部远程单位与英雄） */
export function resolveUnitRangedProjectile(
  defId?: string,
  blueprintId?: string,
): RangedProjectileProfile {
  if (defId && UNIT_RANGED_PROFILES[defId]) {
    return UNIT_RANGED_PROFILES[defId];
  }
  if (blueprintId && UNIT_RANGED_PROFILES[blueprintId]) {
    return UNIT_RANGED_PROFILES[blueprintId];
  }
  return FALLBACK_LIGHT_ORB;
}

/**
 * 为五类经典远程弹道绘制精致的局部朝右 (+X) PixiJS 像素矢量弹体
 * 调用方在每帧按飞行抛物线切线设置 `graphic.rotation = atan2(vy, vx)`，即可丝滑跟随航向！
 */
export function buildRangedProjectileGraphic(
  kind: RangedProjectileKind,
  primaryColor: number,
  accentColor = 0xffffff,
): PIXI.Graphics {
  const g = new PIXI.Graphics();

  if (kind === 'arrow') {
    // 1. 箭矢：迅捷破空尾迹 + 金木箭杆 + 锋利白炽箭镞 + 双叉羽尾
    g.moveTo(-16, 0).lineTo(-7, 0).stroke({ color: primaryColor, width: 1.5, alpha: 0.4 });
    g.moveTo(-9, 0).lineTo(6, 0).stroke({ color: accentColor, width: 2, alpha: 0.95 });
    // 叉形箭羽
    g.moveTo(-9, 0).lineTo(-12, -3).stroke({ color: primaryColor, width: 1.5, alpha: 0.95 });
    g.moveTo(-9, 0).lineTo(-12, 3).stroke({ color: primaryColor, width: 1.5, alpha: 0.95 });
    g.moveTo(-7, 0).lineTo(-10, -2.5).stroke({ color: 0xffffff, width: 1, alpha: 0.8 });
    g.moveTo(-7, 0).lineTo(-10, 2.5).stroke({ color: 0xffffff, width: 1, alpha: 0.8 });
    // 菱形锋利箭锋 + 微光头晕
    g.circle(6, 0, 3.6).fill({ color: primaryColor, alpha: 0.35 });
    g.poly([10, 0, 4, -2.8, 5.5, 0, 4, 2.8]).fill({ color: 0xffffff, alpha: 0.98 });
    g.poly([8.5, 0, 4.5, -1.8, 5.2, 0, 4.5, 1.8]).fill({ color: primaryColor, alpha: 0.95 });
    return g;
  }

  if (kind === 'light_orb') {
    // 2. 光球：柔和彗星尾迹 + 三层圣洁辉光球核 + 十字星闪
    g.poly([-14, 0, -2, -2.8, -2, 2.8]).fill({ color: primaryColor, alpha: 0.35 });
    g.poly([-10, 0, -1, -1.6, -1, 1.6]).fill({ color: accentColor, alpha: 0.6 });
    g.circle(0, 0, 6.2).fill({ color: primaryColor, alpha: 0.28 });
    g.circle(0, 0, 4.0).fill({ color: primaryColor, alpha: 0.92 });
    g.circle(0.5, 0, 2.3).fill({ color: 0xffffff, alpha: 0.98 });
    // 十字璀璨星芒
    g.moveTo(-5.5, 0).lineTo(5.5, 0).stroke({ color: 0xffffff, width: 1, alpha: 0.85 });
    g.moveTo(0, -5.5).lineTo(0, 5.5).stroke({ color: accentColor, width: 1, alpha: 0.85 });
    return g;
  }

  if (kind === 'dark_orb') {
    // 3. 暗球：诡谲暗影拖尾 + 紫黑/毒光邪环 + 漆黑空洞魔核（高对比反差，一眼区分于光球！）
    g.poly([-15, 0, -3, -3.6, -5, 0, -3, 3.6]).fill({ color: 0x160a24, alpha: 0.72 });
    g.poly([-12, -1.5, -3, -3, -3, 3, -12, 1.5]).fill({ color: primaryColor, alpha: 0.38 });
    // 外层炽亮邪气环
    g.circle(0, 0, 6.4).fill({ color: primaryColor, alpha: 0.3 });
    g.circle(0, 0, 4.6).fill({ color: primaryColor, alpha: 0.95 });
    // 内部深黑吞噬核心 + 尖刺反光瞳点
    g.circle(0, 0, 2.8).fill({ color: 0x12061e, alpha: 0.98 });
    g.circle(1.2, -0.8, 1.1).fill({ color: accentColor, alpha: 0.98 });
    // 两颗伴飞小暗粒
    g.circle(-7, -3.2, 1.2).fill({ color: accentColor, alpha: 0.85 });
    g.circle(-9, 2.8, 1.1).fill({ color: primaryColor, alpha: 0.85 });
    return g;
  }

  if (kind === 'magic_wave') {
    // 4. 魔法冲击波：高速破风双层新月形奥术震波弧 + 尾流残弧
    g.arc(-4, 0, 8.5, -0.85, 0.85).stroke({ color: primaryColor, width: 2.5, alpha: 0.38 });
    g.arc(-1, 0, 8.8, -0.95, 0.95).stroke({ color: primaryColor, width: 3.2, alpha: 0.92 });
    g.arc(0, 0, 8.8, -0.82, 0.82).stroke({ color: 0xffffff, width: 1.6, alpha: 0.98 });
    g.arc(-5, 0, 5.5, -0.75, 0.75).stroke({ color: accentColor, width: 1.5, alpha: 0.78 });
    // 中心高速尾流线
    g.moveTo(-12, 0).lineTo(6, 0).stroke({ color: accentColor, width: 1.2, alpha: 0.65 });
    g.circle(7, 0, 2.2).fill({ color: 0xffffff, alpha: 0.92 });
    return g;
  }

  // 5. explosive_shell — 爆裂弹：沉稳炽烈球形重炮弹 + 高亮引信火尾 + 飞溅火花
  g.poly([-14, 0, -4, -3.5, -6, 0, -4, 3.5]).fill({ color: primaryColor, alpha: 0.62 });
  g.poly([-10, 0, -4, -2, -4, 2]).fill({ color: accentColor, alpha: 0.92 });
  // 外层炽热光晕
  g.circle(0, 0, 6.8).fill({ color: primaryColor, alpha: 0.34 });
  // 厚重弹壳外环 + 炽热熔核
  g.circle(0, 0, 4.4).fill({ color: 0x3b1720, alpha: 0.98 });
  g.circle(0, 0, 3.3).fill({ color: primaryColor, alpha: 0.96 });
  g.circle(1, -1, 1.6).fill({ color: 0xffffff, alpha: 0.98 });
  // 引信火星点
  g.circle(-11, -2.5, 1.2).fill({ color: 0xfff5b8, alpha: 0.95 });
  g.circle(-13, 2.2, 1.0).fill({ color: primaryColor, alpha: 0.9 });
  return g;
}

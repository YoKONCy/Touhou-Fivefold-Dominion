/**
 * 《Touhou-H4》扩充自研东方纯净像素特效模块库聚合转发入口（27 种高辨识度双缓冲特效）
 *
 * 具体实现已按派系与类型拆分至 `src/renderer/vfx/custom/`：
 * - `deathAndCrimson.ts`：英雄符卡与幽冥公馆死亡/红雾/深渊系核心招牌 7 术
 * - `summons.ts`：9 种差异化生灵/元素/亡灵召请大阵
 * - `sealsAndWards.ts`：11 种东方专属结界、符箓、星盘、棱镜、弹幕、音律与影蔓特效
 */

export {
  fxTouhouAbyssGapRift,
  fxTouhouCrimsonMist,
  fxTouhouFrostPrison,
  fxTouhouGungnirLance,
  fxTouhouManaSiphon,
  fxTouhouVampiricClawBurst,
  fxTouhouWitherHourglass,
} from './vfx/custom/deathAndCrimson';

export {
  fxTouhouSummonBeastTotem,
  fxTouhouSummonCrypt,
  fxTouhouSummonEarth,
  fxTouhouSummonFairyRing,
  fxTouhouSummonFlora,
  fxTouhouSummonIceAbyss,
  fxTouhouSummonPhoenix,
  fxTouhouSummonWater,
  fxTouhouSummonWind,
} from './vfx/custom/summons';

export {
  fxTouhouCrimsonShackle,
  fxTouhouLunarAstrolabe,
  fxTouhouLunarHareBloom,
  fxTouhouMirrorPrism,
  fxTouhouOfudaSealRing,
  fxTouhouSakuraVortex,
  fxTouhouShadowTendrils,
  fxTouhouShrineBellRipple,
  fxTouhouStarDanmaku,
  fxTouhouWardDomePrism,
  fxTouhouYinYangDream,
} from './vfx/custom/sealsAndWards';

/** 导出全部 27 个扩充自研东方特效键位清单 */
export const TOUHOU_EXTRA_CUSTOM_FX_IDS = [
  'gungnir_lance',
  'crimson_mist',
  'abyss_gap_rift',
  'vampiric_claw_burst',
  'frost_prison_shatter',
  'wither_hourglass',
  'mana_siphon_vortex',
  'summon_fairy_ring',
  'summon_beast_totem',
  'summon_elemental_wind',
  'summon_elemental_earth',
  'summon_elemental_fire',
  'summon_elemental_water',
  'summon_flora_bloom',
  'summon_undead_crypt',
  'summon_ice_abyss',
  'ofuda_seal_ring',
  'ward_dome_prism',
  'yin_yang_dream',
  'lunar_astrolabe_fx',
  'lunar_hare_bloom',
  'crimson_shackle_chains',
  'mirror_prism_shatter',
  'star_danmaku_spiral',
  'sakura_spirit_vortex',
  'shrine_bell_ripple',
  'shadow_tendrils',
] as const;

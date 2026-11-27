/**
 * 全部 150 个东方化 HoMM4 法术专属视觉特效编排总表（高辨识度去重精雕版）
 *
 * 设计哲学：
 * - 一术一配方：35 生命 + 27 秩序 + 26 死亡 + 29 混沌 + 32 自然 + 1 秩序兵种变身 = 150 个术式全部显式登记；
 * - 全面接入 132 种程序化双缓冲像素特效 + 28 套东方调色板，彻底终结 16× summon_rise 与 12× divine_shield 同质化复用；
 * - 多阶段演出：起手阵(casterFx) → 弹道/射线/连跳电弧/火环/双端隙间/吸魂回流(travel) →
 *   主爆发(impactFx) + 副层叠(secondaryFx) + 全屏天象(weatherFx) + 逐目标独立粒子(perTargetFx)
 * - 严格纯数据声明，供 PixiJS 舞台 `animateSpellCast` 导演消费，亦可被 Vitest 全量校验完整性！
 */

import type { SoundId } from '@audio/index';
import type { PixelFxEffectId, TouhouPaletteKey } from './pixelfxBridge';

export type SpellTravelStyle =
  | 'none'
  | 'bolt'
  | 'ofuda_arc'
  | 'beam'
  | 'chain_arcs'
  | 'ring_burst'
  | 'meteor_rain'
  | 'teleport_rift'
  | 'drain_return'
  | 'screen_weather';

export interface SpellVfxChoreography {
  /** 施法者起手瞬间的阵法/蓄力特效 */
  casterFx?: PixelFxEffectId;
  casterPalette?: TouhouPaletteKey;
  /** 从施法者至目标的弹道/空间/天象演出方式 */
  travel?: SpellTravelStyle;
  /** 弹道或连线粒子主色（十六进制） */
  travelColor?: number;
  /** 目标点核心主特效（132 种程序化像素模块之一） */
  impactFx: PixelFxEffectId;
  impactPalette: TouhouPaletteKey;
  /** 可选第二层复合叠加特效（打造 4~5 阶与特色术式的惊艳双层演出） */
  secondaryFx?: PixelFxEffectId;
  secondaryPalette?: TouhouPaletteKey;
  /** 群体/连击/召唤时在每个受影响单位身上同步触发的独立粒子 */
  perTargetFx?: PixelFxEffectId;
  perTargetPalette?: TouhouPaletteKey;
  /** 战场中央展开的全屏大阵或天象（神降、末日、永夜、冥樱、红雾、极光等） */
  weatherFx?: PixelFxEffectId;
  weatherPalette?: TouhouPaletteKey;
  /** 匹配的空间音效 */
  sound: SoundId;
  /** 震屏强度 */
  shake: number;
  /** 命中顿帧（秒） */
  hitStop?: number;
  /** 播放速度倍率 */
  speedScale?: number;
  /** 双缓冲发光强度 */
  light?: number;
}

/** 全部 150 个术式一对一专属特效编排表 */
export const SPELL_VFX_CATALOG: Record<string, SpellVfxChoreography> = {
  // =========================================================================
  // 一、生命系 Life（32 H4 + 3 博丽固有 = 35 术）
  // =========================================================================
  life_bind_wound: {
    casterFx: 'spell_charge', casterPalette: 'spring_dew',
    travel: 'ofuda_arc', travelColor: 0x8cf5c4,
    impactFx: 'heal', impactPalette: 'spring_dew',
    sound: 'spell_heal', shake: 1.5, light: 1.2,
  },
  life_bless: {
    casterFx: 'shrine_bell_ripple', casterPalette: 'shrine_gold',
    impactFx: 'blessing', impactPalette: 'shrine_gold',
    secondaryFx: 'sunburst', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 2.2, light: 1.4,
  },
  life_exorcism: {
    casterFx: 'ofuda_seal_ring', casterPalette: 'pure_white',
    travel: 'ofuda_arc', travelColor: 0xd9f6ff,
    impactFx: 'feather_burst', impactPalette: 'pure_white',
    secondaryFx: 'halo', secondaryPalette: 'graze_cyan',
    sound: 'spell_heal', shake: 2.0, light: 1.35,
  },
  life_holy_word: {
    casterFx: 'yin_yang_dream', casterPalette: 'reimu_crimson',
    travel: 'ofuda_arc', travelColor: 0xff6b84,
    impactFx: 'smite', impactPalette: 'reimu_crimson',
    secondaryFx: 'ofuda_seal_ring', secondaryPalette: 'shrine_gold',
    sound: 'spell_orb', shake: 4.0, hitStop: 0.05, light: 1.5,
  },
  life_spiritual_armor: {
    casterFx: 'ofuda_seal_ring', casterPalette: 'shrine_gold',
    impactFx: 'ofuda_seal_ring', impactPalette: 'reimu_crimson',
    secondaryFx: 'halo', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 2.0, light: 1.35,
  },
  life_summon_ship: {
    impactFx: 'summon_elemental_water', impactPalette: 'frost_cyan',
    secondaryFx: 'whirlpool', secondaryPalette: 'pure_white',
    sound: 'spell_buff', shake: 1.5,
  },
  life_chaos_ward: {
    casterFx: 'rune_circle', casterPalette: 'phoenix_flame',
    impactFx: 'ward_dome_prism', impactPalette: 'phoenix_flame',
    secondaryFx: 'ofuda_seal_ring', secondaryPalette: 'reimu_crimson',
    sound: 'spell_buff', shake: 2.2, light: 1.35,
  },
  life_death_ward: {
    casterFx: 'halo', casterPalette: 'pure_white',
    impactFx: 'ward_dome_prism', impactPalette: 'pure_white',
    secondaryFx: 'sunburst', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 2.2, light: 1.35,
  },
  life_defender: {
    casterFx: 'shrine_bell_ripple', casterPalette: 'earth_amber',
    travel: 'screen_weather',
    impactFx: 'shield_block', impactPalette: 'shrine_gold',
    perTargetFx: 'ofuda_seal_ring', perTargetPalette: 'earth_amber',
    sound: 'stance_defend', shake: 2.5, light: 1.3,
  },
  life_heal: {
    casterFx: 'healing_bloom', casterPalette: 'spring_dew',
    impactFx: 'heal_aoe', impactPalette: 'spring_dew',
    secondaryFx: 'summon_flora_bloom', secondaryPalette: 'celestial_jade',
    sound: 'spell_heal', shake: 2.0, light: 1.35,
  },
  life_heavenly_shield: {
    casterFx: 'yin_yang_dream', casterPalette: 'reimu_crimson',
    impactFx: 'divine_shield', impactPalette: 'reimu_crimson',
    secondaryFx: 'force_field', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 3.0, light: 1.5,
  },
  life_martyr: {
    casterFx: 'halo', casterPalette: 'reimu_crimson',
    travel: 'drain_return', travelColor: 0xff7a96,
    impactFx: 'blessing', impactPalette: 'reimu_crimson',
    secondaryFx: 'ofuda_seal_ring', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 2.5, light: 1.35,
  },
  life_mirth: {
    casterFx: 'sunburst', casterPalette: 'shrine_gold',
    impactFx: 'shrine_bell_ripple', impactPalette: 'shrine_gold',
    secondaryFx: 'firework_burst', secondaryPalette: 'reimu_crimson',
    sound: 'spell_buff', shake: 2.0, light: 1.4,
  },
  life_nature_ward: {
    casterFx: 'summon_flora_bloom', casterPalette: 'nature_emerald',
    impactFx: 'ward_dome_prism', impactPalette: 'celestial_jade',
    secondaryFx: 'healing_bloom', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 2.2, light: 1.35,
  },
  life_order_ward: {
    casterFx: 'lunar_astrolabe_fx', casterPalette: 'order_lunar',
    impactFx: 'ward_dome_prism', impactPalette: 'order_lunar',
    secondaryFx: 'mirror_prism_shatter', secondaryPalette: 'pure_white',
    sound: 'spell_buff', shake: 2.2, light: 1.35,
  },
  life_retribution: {
    casterFx: 'ofuda_seal_ring', casterPalette: 'reimu_crimson',
    impactFx: 'holy_pillar', impactPalette: 'shrine_gold',
    secondaryFx: 'sword_slash', secondaryPalette: 'reimu_crimson',
    sound: 'spell_buff', shake: 3.0, light: 1.45,
  },
  life_song_of_peace: {
    casterFx: 'shrine_bell_ripple', casterPalette: 'pure_white',
    travel: 'ofuda_arc', travelColor: 0xb8f0ff,
    impactFx: 'shrine_bell_ripple', impactPalette: 'pure_white',
    secondaryFx: 'feather_burst', secondaryPalette: 'graze_cyan',
    weatherFx: 'aurora', weatherPalette: 'pure_white',
    sound: 'spell_heal', shake: 1.8, light: 1.35,
  },
  life_celestial_armor: {
    casterFx: 'yin_yang_dream', casterPalette: 'shrine_gold',
    travel: 'screen_weather',
    impactFx: 'divine_shield', impactPalette: 'shrine_gold',
    perTargetFx: 'ofuda_seal_ring', perTargetPalette: 'pure_white',
    weatherFx: 'god_rays', weatherPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 3.0, light: 1.45,
  },
  life_holy_shout: {
    casterFx: 'shrine_bell_ripple', casterPalette: 'reimu_crimson',
    travel: 'screen_weather',
    impactFx: 'holy_pillar', impactPalette: 'reimu_crimson',
    perTargetFx: 'smite', perTargetPalette: 'shrine_gold',
    weatherFx: 'sunburst', weatherPalette: 'reimu_crimson',
    sound: 'spell_orb', shake: 5.0, hitStop: 0.06, light: 1.55,
  },
  life_mass_bless: {
    casterFx: 'sunburst', casterPalette: 'shrine_gold',
    travel: 'screen_weather',
    impactFx: 'blessing', impactPalette: 'shrine_gold',
    perTargetFx: 'shrine_bell_ripple', perTargetPalette: 'shrine_gold',
    weatherFx: 'god_rays', weatherPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 3.2, light: 1.5,
  },
  life_mass_healing: {
    casterFx: 'summon_flora_bloom', casterPalette: 'spring_dew',
    travel: 'screen_weather',
    impactFx: 'heal_aoe', impactPalette: 'celestial_jade',
    perTargetFx: 'heal', perTargetPalette: 'spring_dew',
    weatherFx: 'aurora', weatherPalette: 'spring_dew',
    sound: 'spell_heal', shake: 2.5, light: 1.45,
  },
  life_regeneration: {
    casterFx: 'healing_bloom', casterPalette: 'spring_dew',
    impactFx: 'summon_flora_bloom', impactPalette: 'spring_dew',
    secondaryFx: 'heal', secondaryPalette: 'celestial_jade',
    sound: 'spell_heal', shake: 2.0, light: 1.35,
  },
  life_mass_chaos_ward: {
    casterFx: 'ofuda_seal_ring', casterPalette: 'reimu_crimson',
    travel: 'screen_weather',
    impactFx: 'ward_dome_prism', impactPalette: 'reimu_crimson',
    perTargetFx: 'force_field', perTargetPalette: 'phoenix_flame',
    sound: 'spell_buff', shake: 3.2, light: 1.45,
  },
  life_mass_death_ward: {
    casterFx: 'ofuda_seal_ring', casterPalette: 'shrine_gold',
    travel: 'screen_weather',
    impactFx: 'divine_shield', impactPalette: 'pure_white',
    perTargetFx: 'ward_dome_prism', perTargetPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 3.2, light: 1.45,
  },
  life_mass_exorcism: {
    casterFx: 'feather_burst', casterPalette: 'pure_white',
    travel: 'screen_weather',
    impactFx: 'feather_burst', impactPalette: 'pure_white',
    perTargetFx: 'ofuda_seal_ring', perTargetPalette: 'graze_cyan',
    weatherFx: 'god_rays', weatherPalette: 'pure_white',
    sound: 'spell_heal', shake: 3.2, light: 1.5,
  },
  life_mass_fervor: {
    casterFx: 'shrine_bell_ripple', casterPalette: 'shrine_gold',
    travel: 'screen_weather',
    impactFx: 'shrine_bell_ripple', impactPalette: 'reimu_crimson',
    perTargetFx: 'blessing', perTargetPalette: 'shrine_gold',
    weatherFx: 'firework_burst', weatherPalette: 'reimu_crimson',
    sound: 'spell_buff', shake: 3.5, light: 1.5,
  },
  life_mass_nature_ward: {
    casterFx: 'summon_flora_bloom', casterPalette: 'nature_emerald',
    travel: 'screen_weather',
    impactFx: 'ofuda_seal_ring', impactPalette: 'nature_emerald',
    perTargetFx: 'ward_dome_prism', perTargetPalette: 'celestial_jade',
    sound: 'spell_buff', shake: 3.2, light: 1.45,
  },
  life_mass_order_ward: {
    casterFx: 'lunar_astrolabe_fx', casterPalette: 'order_lunar',
    travel: 'screen_weather',
    impactFx: 'mirror_prism_shatter', impactPalette: 'order_lunar',
    perTargetFx: 'ward_dome_prism', perTargetPalette: 'pure_white',
    sound: 'spell_buff', shake: 3.2, light: 1.45,
  },
  life_prayer: {
    casterFx: 'yin_yang_dream', casterPalette: 'reimu_crimson',
    travel: 'screen_weather',
    impactFx: 'yin_yang_dream', impactPalette: 'shrine_gold',
    perTargetFx: 'resurrection', perTargetPalette: 'reimu_crimson',
    weatherFx: 'god_rays', weatherPalette: 'reimu_crimson',
    sound: 'spell_buff', shake: 4.0, light: 1.55,
  },
  life_divine_intervention: {
    casterFx: 'yin_yang_dream', casterPalette: 'shrine_gold',
    travel: 'screen_weather',
    impactFx: 'resurrection', impactPalette: 'shrine_gold',
    secondaryFx: 'yin_yang_dream', secondaryPalette: 'pure_white',
    perTargetFx: 'resurrection', perTargetPalette: 'shrine_gold',
    weatherFx: 'god_rays', weatherPalette: 'shrine_gold',
    sound: 'spellcard_declare', shake: 6.5, hitStop: 0.08, light: 1.75,
  },
  life_guardian_angel: {
    casterFx: 'halo', casterPalette: 'shrine_gold',
    impactFx: 'feather_burst', impactPalette: 'pure_white',
    secondaryFx: 'holy_pillar', secondaryPalette: 'shrine_gold',
    sound: 'spell_heal', shake: 4.2, light: 1.6,
  },
  life_sanctuary: {
    casterFx: 'ofuda_seal_ring', casterPalette: 'pure_white',
    impactFx: 'force_field', impactPalette: 'celestial_jade',
    secondaryFx: 'holy_pillar', secondaryPalette: 'pure_white',
    sound: 'spell_buff', shake: 4.0, light: 1.6,
  },
  life_ward: {
    casterFx: 'ofuda_seal_ring', casterPalette: 'reimu_crimson',
    impactFx: 'ofuda_seal_ring', impactPalette: 'reimu_crimson',
    secondaryFx: 'force_field', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 2.2, light: 1.38,
  },
  life_exorcism_orb: {
    casterFx: 'yin_yang_dream', casterPalette: 'reimu_crimson',
    travel: 'ofuda_arc', travelColor: 0xff526b,
    impactFx: 'yin_yang_dream', impactPalette: 'reimu_crimson',
    secondaryFx: 'smite', secondaryPalette: 'shrine_gold',
    sound: 'spell_orb', shake: 3.8, hitStop: 0.05, light: 1.5,
  },
  life_resurrection: {
    casterFx: 'holy_pillar', casterPalette: 'shrine_gold',
    impactFx: 'resurrection', impactPalette: 'shrine_gold',
    secondaryFx: 'feather_burst', secondaryPalette: 'reimu_crimson',
    sound: 'spell_heal', shake: 4.5, light: 1.6,
  },

  // =========================================================================
  // 二、秩序系 Order（27 H4 + 1 兔化 = 28 术）
  // =========================================================================
  order_blur: {
    casterFx: 'mirror_prism_shatter', casterPalette: 'mirage_prism',
    impactFx: 'hologram', impactPalette: 'mirage_prism',
    secondaryFx: 'blink_in', secondaryPalette: 'order_lunar',
    sound: 'spell_buff', shake: 1.8, light: 1.35,
  },
  order_dispel: {
    casterFx: 'lunar_astrolabe_fx', casterPalette: 'pure_white',
    travel: 'bolt', travelColor: 0xa8e0ff,
    impactFx: 'mirror_prism_shatter', impactPalette: 'pure_white',
    secondaryFx: 'mana_burst', secondaryPalette: 'order_lunar',
    sound: 'spell_debuff', shake: 2.5, light: 1.4,
  },
  order_displacement: {
    casterFx: 'abyss_gap_rift', casterPalette: 'gap_violet',
    travel: 'bolt', travelColor: 0xb86bff,
    impactFx: 'abyss_gap_rift', impactPalette: 'order_lunar',
    secondaryFx: 'blink_out', secondaryPalette: 'gap_violet',
    sound: 'spell_orb', shake: 3.8, hitStop: 0.04, light: 1.45,
  },
  order_magic_fist: {
    casterFx: 'spell_charge', casterPalette: 'order_lunar',
    travel: 'bolt', travelColor: 0x70c4ff,
    impactFx: 'crit_hit', impactPalette: 'order_lunar',
    secondaryFx: 'mana_burst', secondaryPalette: 'pure_white',
    sound: 'hit_impact', shake: 4.5, hitStop: 0.05, light: 1.45,
  },
  order_precision: {
    casterFx: 'lunar_astrolabe_fx', casterPalette: 'order_lunar',
    impactFx: 'lunar_astrolabe_fx', impactPalette: 'frost_cyan',
    secondaryFx: 'halo', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 2.0, light: 1.38,
  },
  order_visions: {
    impactFx: 'lunar_astrolabe_fx', impactPalette: 'mirage_prism',
    secondaryFx: 'eyeball', secondaryPalette: 'order_lunar',
    sound: 'spell_buff', shake: 1.5,
  },
  order_cowardice: {
    casterFx: 'hex_sigil', casterPalette: 'dusk_eclipse',
    travel: 'bolt', travelColor: 0x826bd6,
    impactFx: 'crimson_shackle_chains', impactPalette: 'dusk_eclipse',
    secondaryFx: 'eyeball', secondaryPalette: 'order_lunar',
    sound: 'spell_debuff', shake: 2.2, light: 1.3,
  },
  order_create_illusion: {
    casterFx: 'mirror_prism_shatter', casterPalette: 'mirage_prism',
    impactFx: 'hologram', impactPalette: 'frost_cyan',
    secondaryFx: 'warp_in', secondaryPalette: 'mirage_prism',
    sound: 'spell_buff', shake: 3.0, light: 1.45,
  },
  order_flight: {
    casterFx: 'summon_elemental_wind', casterPalette: 'frost_cyan',
    impactFx: 'summon_elemental_wind', impactPalette: 'pure_white',
    secondaryFx: 'feather_burst', secondaryPalette: 'frost_cyan',
    sound: 'move_fly_whoosh', shake: 2.2, light: 1.35,
  },
  order_ice_bolt: {
    casterFx: 'snowflake_burst', casterPalette: 'frost_cyan',
    travel: 'bolt', travelColor: 0x8ce8ff,
    impactFx: 'frost_prison_shatter', impactPalette: 'frost_cyan',
    secondaryFx: 'ice_shatter', secondaryPalette: 'pure_white',
    sound: 'spell_ice', shake: 4.2, hitStop: 0.05, light: 1.5,
  },
  order_power_drain: {
    casterFx: 'rune_circle', casterPalette: 'order_lunar',
    travel: 'drain_return', travelColor: 0x66a8ff,
    impactFx: 'mana_siphon_vortex', impactPalette: 'order_lunar',
    secondaryFx: 'status_cursed', secondaryPalette: 'dusk_eclipse',
    sound: 'spell_debuff', shake: 2.8, light: 1.4,
  },
  order_slow: {
    casterFx: 'wither_hourglass', casterPalette: 'order_lunar',
    travel: 'bolt', travelColor: 0x70b8ff,
    impactFx: 'status_slowed', impactPalette: 'order_lunar',
    secondaryFx: 'freeze', secondaryPalette: 'frost_cyan',
    sound: 'spell_debuff', shake: 2.5, light: 1.35,
  },
  order_steal_enchantment: {
    casterFx: 'abyss_gap_rift', casterPalette: 'mirage_prism',
    travel: 'drain_return', travelColor: 0xffe073,
    impactFx: 'mana_siphon_vortex', impactPalette: 'shrine_gold',
    secondaryFx: 'blink_out', secondaryPalette: 'mirage_prism',
    sound: 'spell_orb', shake: 2.8, light: 1.4,
  },
  order_banish: {
    casterFx: 'abyss_gap_rift', casterPalette: 'gap_violet',
    travel: 'beam', travelColor: 0xc770ff,
    impactFx: 'void_orb', impactPalette: 'gap_violet',
    secondaryFx: 'disintegrate', secondaryPalette: 'order_lunar',
    sound: 'spell_aoe', shake: 5.0, hitStop: 0.06, light: 1.6,
  },
  order_forgetfulness: {
    casterFx: 'wither_hourglass', casterPalette: 'gap_violet',
    travel: 'bolt', travelColor: 0xd970ff,
    impactFx: 'status_confused', impactPalette: 'gap_violet',
    secondaryFx: 'smoke_bomb', secondaryPalette: 'dusk_eclipse',
    sound: 'spell_debuff', shake: 2.8, light: 1.35,
  },
  order_mass_blur: {
    casterFx: 'mirror_prism_shatter', casterPalette: 'mirage_prism',
    travel: 'screen_weather',
    impactFx: 'hologram', impactPalette: 'mirage_prism',
    perTargetFx: 'hologram', perTargetPalette: 'frost_cyan',
    weatherFx: 'aurora', weatherPalette: 'mirage_prism',
    sound: 'spell_buff', shake: 3.0, light: 1.45,
  },
  order_mass_dispel: {
    casterFx: 'mirror_prism_shatter', casterPalette: 'pure_white',
    travel: 'screen_weather',
    impactFx: 'mana_burst', impactPalette: 'pure_white',
    perTargetFx: 'mirror_prism_shatter', perTargetPalette: 'order_lunar',
    weatherFx: 'frost_nova', weatherPalette: 'pure_white',
    sound: 'spell_aoe', shake: 4.5, light: 1.6,
  },
  order_mass_precision: {
    casterFx: 'lunar_astrolabe_fx', casterPalette: 'order_lunar',
    travel: 'screen_weather',
    impactFx: 'lunar_astrolabe_fx', impactPalette: 'frost_cyan',
    perTargetFx: 'spark_arc', perTargetPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 3.0, light: 1.45,
  },
  order_teleport: {
    casterFx: 'abyss_gap_rift', casterPalette: 'gap_violet',
    travel: 'teleport_rift', travelColor: 0xd966ff,
    impactFx: 'abyss_gap_rift', impactPalette: 'gap_violet',
    secondaryFx: 'warp_in', secondaryPalette: 'order_lunar',
    sound: 'spell_orb', shake: 3.2, light: 1.55,
  },
  order_town_gate: {
    impactFx: 'portal', impactPalette: 'order_lunar',
    secondaryFx: 'warp_in', secondaryPalette: 'gap_violet',
    sound: 'spell_buff', shake: 2.0,
  },
  order_berserk: {
    casterFx: 'crimson_shackle_chains', casterPalette: 'madness_eye',
    travel: 'bolt', travelColor: 0xff3355,
    impactFx: 'eyeball', impactPalette: 'madness_eye',
    secondaryFx: 'status_rage', secondaryPalette: 'madness_eye',
    sound: 'spell_debuff', shake: 4.5, hitStop: 0.05, light: 1.6,
  },
  order_blind: {
    casterFx: 'eclipse', casterPalette: 'dusk_eclipse',
    travel: 'bolt', travelColor: 0x4c3899,
    impactFx: 'eclipse', impactPalette: 'dusk_eclipse',
    secondaryFx: 'smoke_bomb', secondaryPalette: 'dusk_eclipse',
    sound: 'spell_debuff', shake: 3.5, light: 1.45,
  },
  order_mass_slow: {
    casterFx: 'time_stop', casterPalette: 'order_lunar',
    travel: 'screen_weather',
    impactFx: 'time_stop', impactPalette: 'order_lunar',
    perTargetFx: 'wither_hourglass', perTargetPalette: 'frost_cyan',
    weatherFx: 'time_stop', weatherPalette: 'order_lunar',
    sound: 'spellcard_declare', shake: 5.5, hitStop: 0.08, light: 1.65,
  },
  order_phantom_image: {
    casterFx: 'mirror_prism_shatter', casterPalette: 'mirage_prism',
    impactFx: 'warp_in', impactPalette: 'mirage_prism',
    secondaryFx: 'hologram', secondaryPalette: 'pure_white',
    sound: 'spell_buff', shake: 3.8, light: 1.55,
  },
  order_hypnotize: {
    casterFx: 'sakura_spirit_vortex', casterPalette: 'gap_violet',
    travel: 'bolt', travelColor: 0xff70c4,
    impactFx: 'status_charmed', impactPalette: 'gap_violet',
    secondaryFx: 'sakura_spirit_vortex', secondaryPalette: 'saigyou_sakura',
    sound: 'spell_debuff', shake: 4.5, hitStop: 0.06, light: 1.6,
  },
  order_pain_mirror: {
    casterFx: 'mirror_prism_shatter', casterPalette: 'mirage_prism',
    impactFx: 'mirror_prism_shatter', impactPalette: 'madness_eye',
    secondaryFx: 'force_field', secondaryPalette: 'mirage_prism',
    sound: 'spell_buff', shake: 4.0, light: 1.6,
  },
  order_steal_all_enchantments: {
    casterFx: 'mana_siphon_vortex', casterPalette: 'shrine_gold',
    travel: 'screen_weather',
    impactFx: 'mana_siphon_vortex', impactPalette: 'shrine_gold',
    perTargetFx: 'blink_out', perTargetPalette: 'mirage_prism',
    weatherFx: 'star_fall', weatherPalette: 'shrine_gold',
    sound: 'spell_aoe', shake: 5.0, light: 1.65,
  },
  order_rabbit_transform: {
    casterFx: 'lunar_astrolabe_fx', casterPalette: 'order_lunar',
    impactFx: 'lunar_hare_bloom', impactPalette: 'saigyou_sakura',
    secondaryFx: 'lunar_astrolabe_fx', secondaryPalette: 'order_lunar',
    sound: 'spell_buff', shake: 3.0, light: 1.6,
  },

  // =========================================================================
  // 三、死亡系 Death（25 H4 + 1 深渊冰魔召唤 = 26 术）
  // =========================================================================
  death_cancellation: {
    casterFx: 'hex_sigil', casterPalette: 'death_nether',
    travel: 'bolt', travelColor: 0x9c5cff,
    impactFx: 'dark_explosion', impactPalette: 'death_nether',
    sound: 'spell_debuff', shake: 2.5, light: 1.35,
  },
  death_curse: {
    casterFx: 'crimson_shackle_chains', casterPalette: 'death_nether',
    travel: 'bolt', travelColor: 0x8f4dff,
    impactFx: 'curse', impactPalette: 'death_nether',
    secondaryFx: 'crimson_shackle_chains', secondaryPalette: 'black_void',
    sound: 'spell_debuff', shake: 2.8, light: 1.4,
  },
  death_disrupting_ray: {
    casterFx: 'shadow_flames', casterPalette: 'death_nether',
    travel: 'beam', travelColor: 0x6bffea,
    impactFx: 'ice_shatter', impactPalette: 'death_nether',
    secondaryFx: 'hex_sigil', secondaryPalette: 'bone_pale',
    sound: 'spell_debuff', shake: 3.2, light: 1.4,
  },
  death_poison: {
    casterFx: 'spore_burst', casterPalette: 'suzuran_venom',
    travel: 'bolt', travelColor: 0x6bff66,
    impactFx: 'status_poisoned', impactPalette: 'suzuran_venom',
    secondaryFx: 'toxic_puddle', secondaryPalette: 'suzuran_venom',
    sound: 'spell_debuff', shake: 2.8, light: 1.4,
  },
  death_raise_skeletons: {
    casterFx: 'hex_sigil', casterPalette: 'bone_pale',
    impactFx: 'summon_undead_crypt', impactPalette: 'bone_pale',
    secondaryFx: 'necro_skulls', secondaryPalette: 'death_nether',
    sound: 'spell_debuff', shake: 3.2, light: 1.45,
  },
  death_animate_dead: {
    casterFx: 'summon_undead_crypt', casterPalette: 'death_nether',
    impactFx: 'grasping_hands', impactPalette: 'death_nether',
    secondaryFx: 'soul_rise', secondaryPalette: 'bone_pale',
    sound: 'spell_debuff', shake: 3.5, light: 1.45,
  },
  death_fatigue: {
    casterFx: 'wither_hourglass', casterPalette: 'death_nether',
    travel: 'bolt', travelColor: 0x7c5ca8,
    impactFx: 'wither_hourglass', impactPalette: 'death_nether',
    secondaryFx: 'shadow_tendrils', secondaryPalette: 'dusk_eclipse',
    sound: 'spell_debuff', shake: 2.4, light: 1.35,
  },
  death_life_drain: {
    casterFx: 'sakura_spirit_vortex', casterPalette: 'saigyou_sakura',
    travel: 'drain_return', travelColor: 0xff85c0,
    impactFx: 'sakura_spirit_vortex', impactPalette: 'saigyou_sakura',
    perTargetFx: 'soul_drain', perTargetPalette: 'saigyou_sakura',
    weatherFx: 'cherry_blossoms', weatherPalette: 'saigyou_sakura',
    sound: 'spell_aoe', shake: 4.0, light: 1.55,
  },
  death_mire: {
    impactFx: 'toxic_puddle', impactPalette: 'death_nether',
    secondaryFx: 'root_snare', secondaryPalette: 'dusk_eclipse',
    sound: 'spell_debuff', shake: 2.0,
  },
  death_sorrow: {
    casterFx: 'sakura_spirit_vortex', casterPalette: 'saigyou_sakura',
    travel: 'ofuda_arc', travelColor: 0xe64d78,
    impactFx: 'sakura_spirit_vortex', impactPalette: 'dusk_eclipse',
    secondaryFx: 'smoke_bomb', secondaryPalette: 'saigyou_sakura',
    sound: 'spell_debuff', shake: 2.5, light: 1.35,
  },
  death_unholy_song: {
    casterFx: 'shrine_bell_ripple', casterPalette: 'death_nether',
    travel: 'screen_weather',
    impactFx: 'shadow_flames', impactPalette: 'death_nether',
    perTargetFx: 'wither_hourglass', perTargetPalette: 'death_nether',
    weatherFx: 'fog', weatherPalette: 'death_nether',
    sound: 'spell_debuff', shake: 3.2, light: 1.45,
  },
  death_weakness: {
    casterFx: 'wither_hourglass', casterPalette: 'death_nether',
    travel: 'bolt', travelColor: 0x8a52cc,
    impactFx: 'shadow_tendrils', impactPalette: 'death_nether',
    secondaryFx: 'wither_hourglass', secondaryPalette: 'dusk_eclipse',
    sound: 'spell_debuff', shake: 2.5, light: 1.35,
  },
  death_aura_of_fear: {
    casterFx: 'shadow_flames', casterPalette: 'black_void',
    impactFx: 'necro_skulls', impactPalette: 'death_nether',
    secondaryFx: 'shadow_flames', secondaryPalette: 'black_void',
    sound: 'spell_debuff', shake: 3.2, light: 1.45,
  },
  death_magic_leech: {
    casterFx: 'mana_siphon_vortex', casterPalette: 'death_nether',
    travel: 'drain_return', travelColor: 0x70e0ff,
    impactFx: 'mana_siphon_vortex', impactPalette: 'abyss_frost',
    secondaryFx: 'life_steal', secondaryPalette: 'order_lunar',
    sound: 'spell_debuff', shake: 3.2, light: 1.48,
  },
  death_mass_cancellation: {
    casterFx: 'abyss_gap_rift', casterPalette: 'black_void',
    travel: 'screen_weather',
    impactFx: 'dark_explosion', impactPalette: 'black_void',
    perTargetFx: 'curse', perTargetPalette: 'death_nether',
    sound: 'spell_aoe', shake: 4.0, light: 1.5,
  },
  death_mass_curse: {
    casterFx: 'necro_skulls', casterPalette: 'death_nether',
    travel: 'screen_weather',
    impactFx: 'crimson_shackle_chains', impactPalette: 'death_nether',
    perTargetFx: 'status_cursed', perTargetPalette: 'black_void',
    weatherFx: 'eclipse', weatherPalette: 'death_nether',
    sound: 'spell_aoe', shake: 4.2, light: 1.55,
  },
  death_plague: {
    casterFx: 'poison_cloud', casterPalette: 'yomi_plague',
    travel: 'screen_weather',
    impactFx: 'poison_cloud', impactPalette: 'yomi_plague',
    perTargetFx: 'status_poisoned', perTargetPalette: 'yomi_plague',
    weatherFx: 'fog', weatherPalette: 'yomi_plague',
    sound: 'spell_aoe', shake: 4.8, hitStop: 0.05, light: 1.55,
  },
  death_raise_ghost: {
    casterFx: 'soul_rise', casterPalette: 'death_nether',
    impactFx: 'ghost', impactPalette: 'death_nether',
    secondaryFx: 'summon_undead_crypt', secondaryPalette: 'graze_cyan',
    sound: 'spell_debuff', shake: 3.5, light: 1.5,
  },
  death_death_call: {
    casterFx: 'abyss_gap_rift', casterPalette: 'black_void',
    impactFx: 'summon_undead_crypt', impactPalette: 'death_nether',
    secondaryFx: 'grasping_hands', secondaryPalette: 'bone_pale',
    sound: 'spell_aoe', shake: 4.2, light: 1.55,
  },
  death_mass_sorrow: {
    casterFx: 'sakura_spirit_vortex', casterPalette: 'saigyou_sakura',
    travel: 'screen_weather',
    impactFx: 'sakura_spirit_vortex', impactPalette: 'saigyou_sakura',
    perTargetFx: 'wither_hourglass', perTargetPalette: 'dusk_eclipse',
    weatherFx: 'cherry_blossoms', weatherPalette: 'dusk_eclipse',
    sound: 'spell_debuff', shake: 3.8, light: 1.5,
  },
  death_mass_weakness: {
    casterFx: 'wither_hourglass', casterPalette: 'death_nether',
    travel: 'screen_weather',
    impactFx: 'wither_hourglass', impactPalette: 'death_nether',
    perTargetFx: 'shadow_tendrils', perTargetPalette: 'dusk_eclipse',
    sound: 'spell_debuff', shake: 3.8, light: 1.45,
  },
  death_vampiric_touch: {
    casterFx: 'vampiric_claw_burst', casterPalette: 'scarlet_moon',
    impactFx: 'vampiric_claw_burst', impactPalette: 'crimson_blood',
    secondaryFx: 'life_steal', secondaryPalette: 'scarlet_moon',
    sound: 'spell_buff', shake: 3.8, light: 1.58,
  },
  death_hand_of_death: {
    casterFx: 'eclipse', casterPalette: 'black_void',
    travel: 'bolt', travelColor: 0xc94dff,
    impactFx: 'scythe_reap', impactPalette: 'crimson_blood',
    secondaryFx: 'grasping_hands', secondaryPalette: 'black_void',
    weatherFx: 'crimson_mist', weatherPalette: 'black_void',
    sound: 'unit_death', shake: 6.5, hitStop: 0.09, light: 1.72,
  },
  death_raise_vampires: {
    casterFx: 'eclipse', casterPalette: 'scarlet_moon',
    impactFx: 'vampiric_claw_burst', impactPalette: 'scarlet_moon',
    secondaryFx: 'summon_undead_crypt', secondaryPalette: 'crimson_blood',
    weatherFx: 'crimson_mist', weatherPalette: 'scarlet_moon',
    sound: 'spell_aoe', shake: 4.5, light: 1.62,
  },
  death_sacrifice: {
    casterFx: 'crimson_shackle_chains', casterPalette: 'crimson_blood',
    travel: 'drain_return', travelColor: 0xff3355,
    impactFx: 'resurrection', impactPalette: 'scarlet_moon',
    secondaryFx: 'vampiric_claw_burst', secondaryPalette: 'shrine_gold',
    sound: 'spell_aoe', shake: 5.5, hitStop: 0.07, light: 1.65,
  },
  death_summon_ice_demon: {
    casterFx: 'abyss_gap_rift', casterPalette: 'abyss_frost',
    travel: 'bolt', travelColor: 0x66e6ff,
    impactFx: 'summon_ice_abyss', impactPalette: 'abyss_frost',
    secondaryFx: 'frost_prison_shatter', secondaryPalette: 'frost_cyan',
    sound: 'spell_ice', shake: 4.2, light: 1.62,
  },

  // =========================================================================
  // 四、混沌系 Chaos（27 H4 + 2 魔理沙固有 = 29 术）
  // =========================================================================
  chaos_bloodlust: {
    casterFx: 'spirit_flame', casterPalette: 'crimson_blood',
    impactFx: 'status_rage', impactPalette: 'hell_inferno',
    secondaryFx: 'sword_slash', secondaryPalette: 'crimson_blood',
    sound: 'spell_buff', shake: 2.8, light: 1.4,
  },
  chaos_fire_aura: {
    casterFx: 'spirit_flame', casterPalette: 'hell_inferno',
    impactFx: 'spirit_flame', impactPalette: 'hell_inferno',
    secondaryFx: 'flame_pillar', secondaryPalette: 'marisa_starlight',
    sound: 'spell_buff', shake: 2.5, light: 1.4,
  },
  chaos_haste: {
    casterFx: 'star_danmaku_spiral', casterPalette: 'marisa_starlight',
    impactFx: 'status_haste', impactPalette: 'marisa_starlight',
    secondaryFx: 'spark_arc', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 2.2, light: 1.35,
  },
  chaos_magic_arrow: {
    casterFx: 'spell_charge', casterPalette: 'marisa_starlight',
    travel: 'bolt', travelColor: 0xffe066,
    impactFx: 'arcane_missiles', impactPalette: 'marisa_starlight',
    secondaryFx: 'star_danmaku_spiral', secondaryPalette: 'marisa_starlight',
    sound: 'spell_star_bolt', shake: 3.2, hitStop: 0.04, light: 1.45,
  },
  chaos_slayer: {
    casterFx: 'spirit_flame', casterPalette: 'hell_inferno',
    impactFx: 'double_slash', impactPalette: 'marisa_starlight',
    secondaryFx: 'status_rage', secondaryPalette: 'hell_inferno',
    sound: 'spell_buff', shake: 2.8, light: 1.4,
  },
  chaos_sparks: {
    casterFx: 'spark_arc', casterPalette: 'marisa_starlight',
    impactFx: 'star_danmaku_spiral', impactPalette: 'marisa_starlight',
    perTargetFx: 'hit_spark', perTargetPalette: 'hell_inferno',
    sound: 'spell_lightning', shake: 3.8, hitStop: 0.04, light: 1.5,
  },
  chaos_confusion: {
    casterFx: 'smoke_bomb', casterPalette: 'calamity_rose',
    travel: 'bolt', travelColor: 0xe666ff,
    impactFx: 'status_confused', impactPalette: 'calamity_rose',
    sound: 'spell_debuff', shake: 2.4, light: 1.35,
  },
  chaos_fire_bolt: {
    casterFx: 'spirit_flame', casterPalette: 'hell_inferno',
    travel: 'bolt', travelColor: 0xff6622,
    impactFx: 'fireball', impactPalette: 'hell_inferno',
    secondaryFx: 'flame_pillar', secondaryPalette: 'phoenix_flame',
    sound: 'spell_star_bolt', shake: 4.5, hitStop: 0.05, light: 1.55,
  },
  chaos_first_strike: {
    casterFx: 'spark_arc', casterPalette: 'marisa_starlight',
    impactFx: 'thrust', impactPalette: 'shrine_gold',
    secondaryFx: 'spark_arc', secondaryPalette: 'marisa_starlight',
    sound: 'spell_buff', shake: 2.8, light: 1.4,
  },
  chaos_mana_flare: {
    casterFx: 'mana_siphon_vortex', casterPalette: 'marisa_starlight',
    travel: 'screen_weather',
    impactFx: 'mana_burst', impactPalette: 'order_lunar',
    weatherFx: 'aurora', weatherPalette: 'marisa_starlight',
    sound: 'spell_buff', shake: 3.8, light: 1.55,
  },
  chaos_misfortune: {
    casterFx: 'crimson_shackle_chains', casterPalette: 'calamity_rose',
    travel: 'bolt', travelColor: 0xe63973,
    impactFx: 'status_cursed', impactPalette: 'calamity_rose',
    secondaryFx: 'dark_explosion', secondaryPalette: 'calamity_rose',
    sound: 'spell_debuff', shake: 2.8, light: 1.35,
  },
  chaos_spell_shackle: {
    casterFx: 'crimson_shackle_chains', casterPalette: 'hell_inferno',
    travel: 'bolt', travelColor: 0xff5247,
    impactFx: 'crimson_shackle_chains', impactPalette: 'hell_inferno',
    secondaryFx: 'electrified', secondaryPalette: 'calamity_rose',
    sound: 'spell_debuff', shake: 3.2, light: 1.48,
  },
  chaos_bloodfrenzy: {
    casterFx: 'flame_pillar', casterPalette: 'crimson_blood',
    travel: 'screen_weather',
    impactFx: 'status_rage', impactPalette: 'crimson_blood',
    perTargetFx: 'status_rage', perTargetPalette: 'hell_inferno',
    weatherFx: 'crimson_mist', weatherPalette: 'hell_inferno',
    sound: 'spell_buff', shake: 4.0, light: 1.5,
  },
  chaos_fire_ring: {
    casterFx: 'spirit_flame', casterPalette: 'hell_inferno',
    travel: 'ring_burst', travelColor: 0xff5722,
    impactFx: 'fire_ring', impactPalette: 'hell_inferno',
    secondaryFx: 'flame_pillar', secondaryPalette: 'phoenix_flame',
    sound: 'spell_aoe', shake: 5.2, hitStop: 0.06, light: 1.6,
  },
  chaos_fireball: {
    casterFx: 'fireball', casterPalette: 'hell_inferno',
    travel: 'bolt', travelColor: 0xff5722,
    impactFx: 'big_explosion', impactPalette: 'hell_inferno',
    secondaryFx: 'plasma_explosion', secondaryPalette: 'marisa_starlight',
    sound: 'spell_aoe', shake: 5.5, hitStop: 0.06, light: 1.6,
  },
  chaos_lightning: {
    casterFx: 'spark_arc', casterPalette: 'thunder_violet',
    impactFx: 'lightning_strike', impactPalette: 'thunder_violet',
    secondaryFx: 'thunderclap', secondaryPalette: 'frost_cyan',
    sound: 'spell_lightning', shake: 5.5, hitStop: 0.06, light: 1.65,
  },
  chaos_magic_mirror: {
    casterFx: 'mirror_prism_shatter', casterPalette: 'mirage_prism',
    impactFx: 'mirror_prism_shatter', impactPalette: 'marisa_starlight',
    secondaryFx: 'arcane_orb', secondaryPalette: 'mirage_prism',
    sound: 'spell_buff', shake: 3.0, light: 1.5,
  },
  chaos_mass_slayer: {
    casterFx: 'flame_pillar', casterPalette: 'hell_inferno',
    travel: 'screen_weather',
    impactFx: 'double_slash', impactPalette: 'marisa_starlight',
    perTargetFx: 'spirit_flame', perTargetPalette: 'hell_inferno',
    sound: 'spell_buff', shake: 3.8, light: 1.5,
  },
  chaos_cat_reflexes: {
    casterFx: 'star_danmaku_spiral', casterPalette: 'phoenix_flame',
    impactFx: 'claw_swipe', impactPalette: 'phoenix_flame',
    secondaryFx: 'status_haste', secondaryPalette: 'marisa_starlight',
    sound: 'attack_melee_slash', shake: 3.8, light: 1.55,
  },
  chaos_cloud_of_confusion: {
    casterFx: 'smoke_bomb', casterPalette: 'calamity_rose',
    travel: 'bolt', travelColor: 0xd95cff,
    impactFx: 'poison_cloud', impactPalette: 'calamity_rose',
    perTargetFx: 'status_confused', perTargetPalette: 'calamity_rose',
    sound: 'spell_debuff', shake: 3.8, light: 1.45,
  },
  chaos_implosion: {
    casterFx: 'void_orb', casterPalette: 'black_void',
    impactFx: 'black_hole', impactPalette: 'black_void',
    secondaryFx: 'implosion', secondaryPalette: 'thunder_violet',
    sound: 'spell_aoe', shake: 6.8, hitStop: 0.09, light: 1.72,
  },
  chaos_inferno: {
    casterFx: 'flame_pillar', casterPalette: 'hell_inferno',
    travel: 'meteor_rain', travelColor: 0xff4d1a,
    impactFx: 'fire_tornado', impactPalette: 'hell_inferno',
    secondaryFx: 'big_explosion', secondaryPalette: 'phoenix_flame',
    perTargetFx: 'flame_pillar', perTargetPalette: 'hell_inferno',
    sound: 'spell_aoe', shake: 6.5, hitStop: 0.08, light: 1.7,
  },
  chaos_mass_first_strike: {
    casterFx: 'thunderclap', casterPalette: 'marisa_starlight',
    travel: 'screen_weather',
    impactFx: 'spark_arc', impactPalette: 'marisa_starlight',
    perTargetFx: 'star_danmaku_spiral', perTargetPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 4.0, light: 1.55,
  },
  chaos_mass_misfortune: {
    casterFx: 'crimson_shackle_chains', casterPalette: 'calamity_rose',
    travel: 'screen_weather',
    impactFx: 'dark_explosion', impactPalette: 'calamity_rose',
    perTargetFx: 'crimson_shackle_chains', perTargetPalette: 'calamity_rose',
    sound: 'spell_debuff', shake: 4.2, light: 1.5,
  },
  chaos_armageddon: {
    casterFx: 'fire_tornado', casterPalette: 'hell_inferno',
    travel: 'meteor_rain', travelColor: 0xff4d1a,
    impactFx: 'meteor', impactPalette: 'hell_inferno',
    secondaryFx: 'big_explosion', secondaryPalette: 'phoenix_flame',
    perTargetFx: 'meteor', perTargetPalette: 'hell_inferno',
    weatherFx: 'shooting_stars', weatherPalette: 'hell_inferno',
    sound: 'spellcard_master_spark', shake: 8.5, hitStop: 0.1, light: 1.8,
  },
  chaos_chain_lightning: {
    casterFx: 'ball_lightning', casterPalette: 'thunder_violet',
    travel: 'chain_arcs', travelColor: 0x8ce8ff,
    impactFx: 'chain_lightning', impactPalette: 'thunder_violet',
    secondaryFx: 'lightning_strike', secondaryPalette: 'frost_cyan',
    perTargetFx: 'electrified', perTargetPalette: 'thunder_violet',
    sound: 'spell_lightning', shake: 6.5, hitStop: 0.08, light: 1.75,
  },
  chaos_disintegrate: {
    casterFx: 'void_orb', casterPalette: 'black_void',
    travel: 'beam', travelColor: 0xe64dff,
    impactFx: 'arcane_beam', impactPalette: 'black_void',
    secondaryFx: 'disintegrate', secondaryPalette: 'calamity_rose',
    sound: 'spellcard_master_spark', shake: 7.2, hitStop: 0.09, light: 1.75,
  },
  chaos_star_bolt: {
    casterFx: 'star_danmaku_spiral', casterPalette: 'marisa_starlight',
    travel: 'bolt', travelColor: 0xffe46b,
    impactFx: 'star_danmaku_spiral', impactPalette: 'marisa_starlight',
    secondaryFx: 'plasma_explosion', secondaryPalette: 'shrine_gold',
    sound: 'spell_star_bolt', shake: 4.0, hitStop: 0.05, light: 1.55,
  },
  chaos_meteor_burst: {
    casterFx: 'star_fall', casterPalette: 'marisa_starlight',
    travel: 'meteor_rain', travelColor: 0xffb833,
    impactFx: 'star_fall', impactPalette: 'marisa_starlight',
    secondaryFx: 'star_danmaku_spiral', secondaryPalette: 'hell_inferno',
    sound: 'spell_aoe', shake: 5.5, hitStop: 0.06, light: 1.62,
  },

  // =========================================================================
  // 五、自然系 Nature（31 H4 + 1 固有 = 32 术，全 16 种召请按物种元素完全差异化！）
  // =========================================================================
  nature_pathfinding: {
    impactFx: 'leaf_storm', impactPalette: 'nature_emerald',
    sound: 'spell_buff', shake: 1.5,
  },
  nature_speed: {
    casterFx: 'summon_elemental_wind', casterPalette: 'nature_emerald',
    impactFx: 'tornado', impactPalette: 'nature_emerald',
    secondaryFx: 'status_haste', secondaryPalette: 'spring_dew',
    sound: 'move_fly_whoosh', shake: 2.5, light: 1.35,
  },
  nature_stoneskin: {
    casterFx: 'summon_elemental_earth', casterPalette: 'earth_amber',
    impactFx: 'summon_elemental_earth', impactPalette: 'earth_amber',
    secondaryFx: 'shield_block', secondaryPalette: 'earth_amber',
    sound: 'stance_defend', shake: 3.2, light: 1.35,
  },
  nature_summon_sprite: {
    casterFx: 'summon_fairy_ring', casterPalette: 'celestial_jade',
    impactFx: 'summon_fairy_ring', impactPalette: 'spring_dew',
    secondaryFx: 'butterfly', secondaryPalette: 'frost_cyan',
    sound: 'spell_heal', shake: 2.4, light: 1.42,
  },
  nature_summon_wolf: {
    casterFx: 'summon_beast_totem', casterPalette: 'pure_white',
    impactFx: 'summon_beast_totem', impactPalette: 'pure_white',
    secondaryFx: 'claw_swipe', secondaryPalette: 'frost_cyan',
    sound: 'spell_buff', shake: 3.0, light: 1.42,
  },
  nature_summon_leprechaun: {
    casterFx: 'shrine_bell_ripple', casterPalette: 'shrine_gold',
    impactFx: 'summon_fairy_ring', impactPalette: 'shrine_gold',
    secondaryFx: 'firework_burst', secondaryPalette: 'nature_emerald',
    sound: 'spell_buff', shake: 2.4, light: 1.45,
  },
  nature_terrain_walk: {
    casterFx: 'summon_flora_bloom', casterPalette: 'nature_emerald',
    impactFx: 'leaf_storm', impactPalette: 'spring_dew',
    secondaryFx: 'status_haste', secondaryPalette: 'nature_emerald',
    sound: 'spell_buff', shake: 2.0, light: 1.3,
  },
  nature_fortune: {
    casterFx: 'shrine_bell_ripple', casterPalette: 'shrine_gold',
    impactFx: 'shrine_bell_ripple', impactPalette: 'nature_emerald',
    secondaryFx: 'firework_burst', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 2.5, light: 1.45,
  },
  nature_giant_strength: {
    casterFx: 'summon_elemental_earth', casterPalette: 'earth_amber',
    impactFx: 'quake', impactPalette: 'earth_amber',
    secondaryFx: 'status_rage', secondaryPalette: 'nature_emerald',
    sound: 'attack_melee_heavy', shake: 4.0, light: 1.45,
  },
  nature_quicksand: {
    casterFx: 'quake', casterPalette: 'earth_amber',
    travel: 'ofuda_arc', travelColor: 0xe6bd6b,
    impactFx: 'whirlpool', impactPalette: 'earth_amber',
    secondaryFx: 'quake', secondaryPalette: 'earth_amber',
    sound: 'spell_debuff', shake: 4.0, light: 1.35,
  },
  nature_snake_strike: {
    casterFx: 'healing_bloom', casterPalette: 'celestial_jade',
    impactFx: 'snake', impactPalette: 'pure_white',
    secondaryFx: 'thrust', secondaryPalette: 'spring_dew',
    sound: 'attack_melee_slash', shake: 2.8, light: 1.4,
  },
  nature_summon_elf: {
    casterFx: 'leaf_storm', casterPalette: 'nature_emerald',
    impactFx: 'summon_flora_bloom', impactPalette: 'nature_emerald',
    secondaryFx: 'leaf_storm', secondaryPalette: 'spring_dew',
    sound: 'spell_buff', shake: 2.8, light: 1.42,
  },
  nature_summon_satyr: {
    casterFx: 'water_orb', casterPalette: 'celestial_jade',
    impactFx: 'summon_elemental_water', impactPalette: 'celestial_jade',
    secondaryFx: 'geyser', secondaryPalette: 'frost_cyan',
    sound: 'spell_buff', shake: 3.0, light: 1.42,
  },
  nature_summon_white_tiger: {
    casterFx: 'snowflake_burst', casterPalette: 'pure_white',
    impactFx: 'summon_beast_totem', impactPalette: 'frost_cyan',
    secondaryFx: 'frost_prison_shatter', secondaryPalette: 'pure_white',
    sound: 'attack_melee_slash', shake: 3.5, light: 1.48,
  },
  nature_wasp_swarm: {
    casterFx: 'spore_burst', casterPalette: 'marisa_starlight',
    travel: 'bolt', travelColor: 0xffe047,
    impactFx: 'butterfly', impactPalette: 'marisa_starlight',
    secondaryFx: 'spore_burst', secondaryPalette: 'nature_emerald',
    sound: 'spell_debuff', shake: 3.0, light: 1.4,
  },
  nature_anti_magic: {
    casterFx: 'ward_dome_prism', casterPalette: 'black_void',
    impactFx: 'force_field', impactPalette: 'nature_emerald',
    secondaryFx: 'ward_dome_prism', secondaryPalette: 'black_void',
    sound: 'spell_buff', shake: 3.8, light: 1.55,
  },
  nature_mass_speed: {
    casterFx: 'summon_elemental_wind', casterPalette: 'nature_emerald',
    travel: 'screen_weather',
    impactFx: 'summon_elemental_wind', impactPalette: 'nature_emerald',
    perTargetFx: 'status_haste', perTargetPalette: 'spring_dew',
    weatherFx: 'leaf_storm', weatherPalette: 'reimu_crimson',
    sound: 'move_fly_whoosh', shake: 4.0, light: 1.5,
  },
  nature_necromancy_ward: {
    casterFx: 'summon_flora_bloom', casterPalette: 'spring_dew',
    travel: 'screen_weather',
    impactFx: 'root_snare', impactPalette: 'nature_emerald',
    weatherFx: 'aurora', weatherPalette: 'celestial_jade',
    sound: 'spell_heal', shake: 3.8, light: 1.55,
  },
  nature_summon_air_elemental: {
    casterFx: 'tornado', casterPalette: 'frost_cyan',
    impactFx: 'summon_elemental_wind', impactPalette: 'frost_cyan',
    secondaryFx: 'blizzard_vortex', secondaryPalette: 'pure_white',
    sound: 'move_fly_whoosh', shake: 3.8, light: 1.52,
  },
  nature_summon_earth_elemental: {
    casterFx: 'quake', casterPalette: 'earth_amber',
    impactFx: 'summon_elemental_earth', impactPalette: 'earth_amber',
    secondaryFx: 'earth_spike', secondaryPalette: 'earth_amber',
    sound: 'attack_melee_heavy', shake: 5.0, light: 1.48,
  },
  nature_summon_fire_elemental: {
    casterFx: 'flame_pillar', casterPalette: 'hell_inferno',
    impactFx: 'summon_elemental_fire', impactPalette: 'hell_inferno',
    secondaryFx: 'fire_tornado', secondaryPalette: 'phoenix_flame',
    sound: 'spell_aoe', shake: 4.5, light: 1.62,
  },
  nature_summon_water_elemental: {
    casterFx: 'geyser', casterPalette: 'frost_cyan',
    impactFx: 'summon_elemental_water', impactPalette: 'order_lunar',
    secondaryFx: 'geyser', secondaryPalette: 'frost_cyan',
    sound: 'spell_heal', shake: 4.0, light: 1.52,
  },
  nature_mass_fortune: {
    casterFx: 'shrine_bell_ripple', casterPalette: 'shrine_gold',
    travel: 'screen_weather',
    impactFx: 'firework_burst', impactPalette: 'shrine_gold',
    perTargetFx: 'shrine_bell_ripple', perTargetPalette: 'nature_emerald',
    weatherFx: 'shooting_stars', weatherPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 3.8, light: 1.55,
  },
  nature_mass_snake_strike: {
    casterFx: 'snake', casterPalette: 'celestial_jade',
    travel: 'screen_weather',
    impactFx: 'snake', impactPalette: 'pure_white',
    perTargetFx: 'thrust', perTargetPalette: 'spring_dew',
    sound: 'spell_buff', shake: 3.8, light: 1.5,
  },
  nature_summon_griffin: {
    casterFx: 'summon_elemental_wind', casterPalette: 'shrine_gold',
    impactFx: 'bird', impactPalette: 'reimu_crimson',
    secondaryFx: 'summon_elemental_wind', secondaryPalette: 'shrine_gold',
    sound: 'move_fly_whoosh', shake: 4.2, light: 1.55,
  },
  nature_summon_unicorn: {
    casterFx: 'sunburst', casterPalette: 'spring_dew',
    impactFx: 'summon_flora_bloom', impactPalette: 'pure_white',
    secondaryFx: 'holy_pillar', secondaryPalette: 'celestial_jade',
    sound: 'spell_heal', shake: 4.5, light: 1.62,
  },
  nature_summon_waspwort: {
    casterFx: 'thorns', casterPalette: 'nature_emerald',
    impactFx: 'thorns', impactPalette: 'nature_emerald',
    secondaryFx: 'summon_flora_bloom', secondaryPalette: 'shrine_gold',
    sound: 'spell_buff', shake: 4.0, light: 1.5,
  },
  nature_dragon_strength: {
    casterFx: 'summon_elemental_earth', casterPalette: 'nature_emerald',
    impactFx: 'holy_pillar', impactPalette: 'nature_emerald',
    secondaryFx: 'fire_breath', secondaryPalette: 'shrine_gold',
    sound: 'spellcard_declare', shake: 6.2, hitStop: 0.08, light: 1.7,
  },
  nature_summon_faerie_dragon: {
    casterFx: 'star_danmaku_spiral', casterPalette: 'gap_violet',
    impactFx: 'summon_fairy_ring', impactPalette: 'gap_violet',
    secondaryFx: 'star_fall', secondaryPalette: 'spring_dew',
    sound: 'spellcard_declare', shake: 5.5, light: 1.68,
  },
  nature_summon_mantis: {
    casterFx: 'leaf_storm', casterPalette: 'nature_emerald',
    impactFx: 'summon_beast_totem', impactPalette: 'nature_emerald',
    secondaryFx: 'double_slash', secondaryPalette: 'spring_dew',
    sound: 'attack_melee_slash', shake: 5.5, light: 1.65,
  },
  nature_summon_phoenix: {
    casterFx: 'summon_elemental_fire', casterPalette: 'phoenix_flame',
    impactFx: 'summon_elemental_fire', impactPalette: 'phoenix_flame',
    secondaryFx: 'feather_burst', secondaryPalette: 'hell_inferno',
    weatherFx: 'fire_tornado', weatherPalette: 'phoenix_flame',
    sound: 'spellcard_declare', shake: 6.8, hitStop: 0.08, light: 1.75,
  },
  nature_haste: {
    casterFx: 'leaf_storm', casterPalette: 'nature_emerald',
    impactFx: 'healing_bloom', impactPalette: 'nature_emerald',
    secondaryFx: 'status_haste', secondaryPalette: 'spring_dew',
    sound: 'spell_buff', shake: 2.2, light: 1.35,
  },
};

export const ALL_SPELL_VFX_IDS: string[] = Object.keys(SPELL_VFX_CATALOG);

/** 获取指定法术 ID 的专属特效编排（兜底安全返回星矢编排） */
export function getSpellVfxChoreography(spellId: string): SpellVfxChoreography {
  return SPELL_VFX_CATALOG[spellId] ?? SPELL_VFX_CATALOG.chaos_magic_arrow;
}

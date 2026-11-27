/**
 * patch-gg/pixelfx × PixiJS v8 双缓冲辉光适配桥（全 148 术东方专属纯净特效版）
 *
 * 架构与视觉净化管线：
 * 1. 维护与虚拟像素舞台（640×360）严格对齐的透明双缓冲（color + light），零 Mixels 失真；
 * 2. 集成 106 个程序化像素特效模块（94 个严选净化 pixelfx + 12 个自研全屏天象/东方魔导纯净模块）+ 25 套东方调色板；
 * 3. 全局注入静默透明替身（SILENT_ACTOR），彻底杜绝 pixelfx 在东方角色身上叠画西幻像素骑士剪影；
 * 4. 对所有高空垂降光柱/落雷自动启用零 GC 离屏「顶缘柔和羽化 (Soft Top Feather)」与「黑幕剥离 (Strip Dark Veil)」，
 *    从渲染底层彻底根治半空水平一刀切边与脏黑幕污染！
 */

import * as PIXI from 'pixi.js';
import {
  clearFrame,
  composite,
  createFrame,
  createFx,
  painterFor,
  smooth,
  type PixelFxFrame,
  type PixelFxInstance,
  type PixelFxModule,
  type PixelFxOptions,
} from 'pixelfx';

// ===== 一、奥术 / 时空 / 符阵类 =====
import * as fxArcaneBeam from 'pixelfx/fx/arcane/arcane-beam';
import * as fxArcaneMissiles from 'pixelfx/fx/arcane/arcane-missiles';
import * as fxArcaneOrb from 'pixelfx/fx/arcane/arcane-orb';
import * as fxBlinkIn from 'pixelfx/fx/arcane/blink-in';
import * as fxBlinkOut from 'pixelfx/fx/arcane/blink-out';
import * as fxMagicCircleCast from 'pixelfx/fx/arcane/magic-circle-cast';
import * as fxManaBurst from 'pixelfx/fx/arcane/mana-burst';
import * as fxPortal from 'pixelfx/fx/arcane/portal';
import * as fxRuneCircle from 'pixelfx/fx/arcane/rune-circle';
import * as fxSpellCharge from 'pixelfx/fx/arcane/spell-charge';
import * as fxStarFall from 'pixelfx/fx/arcane/star-fall';
import * as fxTimeStop from 'pixelfx/fx/arcane/time-stop';

// ===== 二、神圣 / 神社 / 羽翼 / 治愈类 =====
import * as fxBlessing from 'pixelfx/fx/holy/blessing';
import * as fxDivineShield from 'pixelfx/fx/holy/divine-shield';
import * as fxFeatherBurst from 'pixelfx/fx/holy/feather-burst';
import * as fxHalo from 'pixelfx/fx/holy/halo';
import * as fxHeal from 'pixelfx/fx/holy/heal';
import * as fxHealAoe from 'pixelfx/fx/holy/heal-aoe';
import * as fxHolyPillar from 'pixelfx/fx/holy/holy-pillar';
import * as fxResurrection from 'pixelfx/fx/holy/resurrection';
import * as fxSmite from 'pixelfx/fx/holy/smite';
import * as fxSunburst from 'pixelfx/fx/holy/sunburst';

// ===== 三、火焰 / 爆炸 / 陨星类 =====
import * as fxBigExplosion from 'pixelfx/fx/explosions/big-explosion';
import * as fxFireworkBurst from 'pixelfx/fx/explosions/firework-burst';
import * as fxImplosion from 'pixelfx/fx/explosions/implosion';
import * as fxPlasmaExplosion from 'pixelfx/fx/explosions/plasma-explosion';
import * as fxSmokeBomb from 'pixelfx/fx/explosions/smoke-bomb';
import * as fxFireBreath from 'pixelfx/fx/fire/fire-breath';
import * as fxFireRing from 'pixelfx/fx/fire/fire-ring';
import * as fxFireTornado from 'pixelfx/fx/fire/fire-tornado';
import * as fxFireball from 'pixelfx/fx/fire/fireball';
import * as fxFlamePillar from 'pixelfx/fx/fire/flame-pillar';
import * as fxMeteor from 'pixelfx/fx/fire/meteor';
import * as fxSpiritFlame from 'pixelfx/fx/fire/spirit-flame';

// ===== 四、寒冰 / 霜华类 =====
import * as fxBlizzardVortex from 'pixelfx/fx/ice/blizzard-vortex';
import * as fxFreeze from 'pixelfx/fx/ice/freeze';
import * as fxFrostNova from 'pixelfx/fx/ice/frost-nova';
import * as fxIceLance from 'pixelfx/fx/ice/ice-lance';
import * as fxIceShatter from 'pixelfx/fx/ice/ice-shatter';
import * as fxSnowflakeBurst from 'pixelfx/fx/ice/snowflake-burst';

// ===== 五、雷霆 / 紫电类 =====
import * as fxBallLightning from 'pixelfx/fx/lightning/ball-lightning';
import * as fxChainLightning from 'pixelfx/fx/lightning/chain-lightning';
import * as fxLightningStrike from 'pixelfx/fx/lightning/lightning-strike';
import * as fxThunderclap from 'pixelfx/fx/lightning/thunderclap';

// ===== 六、幽冥 / 暗影 / 死亡类 =====
import * as fxBlackHole from 'pixelfx/fx/shadow/black-hole';
import * as fxCurse from 'pixelfx/fx/shadow/curse';
import * as fxDarkExplosion from 'pixelfx/fx/shadow/dark-explosion';
import * as fxEclipse from 'pixelfx/fx/shadow/eclipse';
import * as fxGraspingHands from 'pixelfx/fx/shadow/grasping-hands';
import * as fxHexSigil from 'pixelfx/fx/shadow/hex-sigil';
import * as fxLifeSteal from 'pixelfx/fx/shadow/life-steal';
import * as fxNecroSkulls from 'pixelfx/fx/shadow/necro-skulls';
import * as fxShadowFlames from 'pixelfx/fx/shadow/shadow-flames';
import * as fxSoulDrain from 'pixelfx/fx/shadow/soul-drain';
import * as fxVoidOrb from 'pixelfx/fx/shadow/void-orb';

// ===== 七、自然 / 毒雾 / 岩土 / 水流类 =====
import * as fxEarthSpike from 'pixelfx/fx/nature/earth-spike';
import * as fxHealingBloom from 'pixelfx/fx/nature/healing-bloom';
import * as fxLeafStorm from 'pixelfx/fx/nature/leaf-storm';
import * as fxPoisonCloud from 'pixelfx/fx/nature/poison-cloud';
import * as fxQuake from 'pixelfx/fx/nature/quake';
import * as fxRootSnare from 'pixelfx/fx/nature/root-snare';
import * as fxSporeBurst from 'pixelfx/fx/nature/spore-burst';
import * as fxThorns from 'pixelfx/fx/nature/thorns';
import * as fxTornado from 'pixelfx/fx/nature/tornado';
import * as fxToxicPuddle from 'pixelfx/fx/nature/toxic-puddle';
import * as fxGeyser from 'pixelfx/fx/water/geyser';
import * as fxWaterOrb from 'pixelfx/fx/water/water-orb';
import * as fxWhirlpool from 'pixelfx/fx/water/whirlpool';

// ===== 八、生灵 / 斩击 / 召唤 / 状态 =====
import * as fxBat from 'pixelfx/fx/critters/bat';
import * as fxBird from 'pixelfx/fx/critters/bird';
import * as fxButterfly from 'pixelfx/fx/critters/butterfly';
import * as fxEyeball from 'pixelfx/fx/critters/eyeball';
import * as fxGhost from 'pixelfx/fx/critters/ghost';
import * as fxSnake from 'pixelfx/fx/critters/snake';
import * as fxWisp from 'pixelfx/fx/critters/wisp';
import * as fxCritHit from 'pixelfx/fx/impacts/crit-hit';
import * as fxHitSpark from 'pixelfx/fx/impacts/hit-spark';
import * as fxShieldBlock from 'pixelfx/fx/impacts/shield-block';
import * as fxClawSwipe from 'pixelfx/fx/melee/claw-swipe';
import * as fxDoubleSlash from 'pixelfx/fx/melee/double-slash';
import * as fxScytheReap from 'pixelfx/fx/melee/scythe-reap';
import * as fxSwordSlash from 'pixelfx/fx/melee/sword-slash';
import * as fxThrust from 'pixelfx/fx/melee/thrust';
import * as fxMagicMissile from 'pixelfx/fx/projectiles/magic-missile';
import * as fxDisintegrate from 'pixelfx/fx/spawn/disintegrate';
import * as fxSpawnPortal from 'pixelfx/fx/spawn/spawn-portal';
import * as fxSummonRise from 'pixelfx/fx/spawn/summon-rise';
import * as fxStatusCharmed from 'pixelfx/fx/status/charmed';
import * as fxStatusConfused from 'pixelfx/fx/status/confused';
import * as fxStatusCursed from 'pixelfx/fx/status/cursed';
import * as fxStatusHaste from 'pixelfx/fx/status/haste';
import * as fxStatusRage from 'pixelfx/fx/status/rage';
import * as fxStatusSlowed from 'pixelfx/fx/status/slowed';

// ===== 九、自研全屏无边框东方天象与纯净魔导模块（取代有脏矩形/硬边/科幻道具/假人崩溃的旧模块） =====
import {
  fxTouhouAurora,
  fxTouhouCherryBlossoms,
  fxTouhouElectrified,
  fxTouhouFog,
  fxTouhouForceField,
  fxTouhouGodRays,
  fxTouhouHologram,
  fxTouhouPoisoned,
  fxTouhouShootingStars,
  fxTouhouSoulRise,
  fxTouhouSparkArc,
  fxTouhouWarpIn,
} from './touhouCustomFx';
import {
  fxTouhouAbyssGapRift,
  fxTouhouCrimsonMist,
  fxTouhouCrimsonShackle,
  fxTouhouFrostPrison,
  fxTouhouGungnirLance,
  fxTouhouLunarAstrolabe,
  fxTouhouLunarHareBloom,
  fxTouhouManaSiphon,
  fxTouhouMirrorPrism,
  fxTouhouOfudaSealRing,
  fxTouhouSakuraVortex,
  fxTouhouShadowTendrils,
  fxTouhouShrineBellRipple,
  fxTouhouStarDanmaku,
  fxTouhouSummonBeastTotem,
  fxTouhouSummonCrypt,
  fxTouhouSummonEarth,
  fxTouhouSummonFairyRing,
  fxTouhouSummonFlora,
  fxTouhouSummonIceAbyss,
  fxTouhouSummonPhoenix,
  fxTouhouSummonWater,
  fxTouhouSummonWind,
  fxTouhouVampiricClawBurst,
  fxTouhouWardDomePrism,
  fxTouhouWitherHourglass,
  fxTouhouYinYangDream,
} from './touhouCustomFxExtra';

/** 28 套东方幻想乡双缓冲发光调色板（严格由暗至亮递增，供全部 150 术与 4 位英雄符卡按意象精准着色） */
export const TOUHOU_PALETTES = {
  // 生命 · 神社系
  reimu_crimson: ['#260916', '#7d1831', '#d93855', '#ff7a8a', '#ffe3a8', '#ffffff'],
  shrine_gold: ['#291a08', '#8a5c14', '#d9a42e', '#ffe066', '#fff5b8', '#ffffff'],
  spring_dew: ['#09261d', '#196e52', '#3cd495', '#8cf5c4', '#e0ffef', '#ffffff'],
  pure_white: ['#1b1e2e', '#596a8c', '#9eb8db', '#d9ecff', '#f5faff', '#ffffff'],
  // 秩序 · 月都与隙间系
  order_lunar: ['#0f1a38', '#26468c', '#4d82e0', '#96c2ff', '#dff0ff', '#ffffff'],
  gap_violet: ['#170829', '#4f1875', '#9c36cc', '#ff5288', '#ffd4e6', '#ffffff'],
  frost_cyan: ['#0a1e30', '#1c5c8a', '#42b8eb', '#99ebff', '#e3fbff', '#ffffff'],
  dusk_eclipse: ['#0a0717', '#261a4f', '#523c99', '#9982e0', '#dbd0ff', '#ffffff'],
  madness_eye: ['#260812', '#7a1228', '#d92647', '#ff6685', '#ffccd6', '#ffffff'],
  mirage_prism: ['#122138', '#3466a8', '#66c4eb', '#b8f0ff', '#fff0c2', '#ffffff'],
  // 死亡 · 幽冥与绯红系
  death_nether: ['#150b2b', '#411f7a', '#7842c9', '#56d9d0', '#b8fff6', '#ffffff'],
  saigyou_sakura: ['#240e24', '#6e2861', '#c752a0', '#ff99cc', '#ffe0f0', '#ffffff'],
  suzuran_venom: ['#0a2112', '#1c6332', '#3ec456', '#8cf566', '#e0ffbd', '#ffffff'],
  crimson_blood: ['#24060c', '#6e0f20', '#c71c36', '#ff526b', '#ffc7cf', '#ffffff'],
  scarlet_moon: ['#2b0612', '#8c1230', '#e62250', '#ff6b8f', '#ffd9e3', '#ffffff'],
  abyss_frost: ['#130b2e', '#3b2478', '#7852d6', '#5ce2ff', '#d6faff', '#ffffff'],
  bone_pale: ['#171624', '#4d4a66', '#8d8aa8', '#d4d0e6', '#f2f0fa', '#ffffff'],
  yomi_plague: ['#121f14', '#385c2b', '#75a83e', '#c7e05c', '#f2ffb3', '#ffffff'],
  // 混沌 · 魔导与核焰系
  marisa_starlight: ['#24140a', '#7c4312', '#d98a1c', '#f7ca45', '#fff29c', '#ffffff'],
  hell_inferno: ['#290a06', '#8a1e0f', '#e64219', '#ff9433', '#ffe878', '#ffffff'],
  thunder_violet: ['#101233', '#2e3899', '#5c78f0', '#9ce0ff', '#ebffff', '#ffffff'],
  black_void: ['#080412', '#26104a', '#6b29b8', '#c766ff', '#f5d4ff', '#ffffff'],
  calamity_rose: ['#260a1a', '#731847', '#c92e78', '#ff70ad', '#ffd9eb', '#ffffff'],
  // 自然 · 妖山与式神系
  nature_emerald: ['#0a241b', '#1b6647', '#3cb878', '#8ce89f', '#ebffbd', '#ffffff'],
  celestial_jade: ['#082422', '#176b63', '#36c9b8', '#8af7e8', '#e3fffb', '#ffffff'],
  earth_amber: ['#24190c', '#6b4822', '#b58038', '#e6bd6b', '#fff0bd', '#ffffff'],
  phoenix_flame: ['#290c06', '#8c2612', '#f05c22', '#ffbe3b', '#fff7b8', '#ffffff'],
  graze_cyan: ['#0a1d2e', '#1a5a85', '#42b3e6', '#9ae8ff', '#ffffff'],
} as const;

export type TouhouPaletteKey = keyof typeof TOUHOU_PALETTES;

/** 全部 132 个已注册的程序化像素特效模块索引 */
export const PIXELFX_MODULES = {
  // 奥术/时空
  arcane_beam: fxArcaneBeam,
  arcane_missiles: fxArcaneMissiles,
  arcane_orb: fxArcaneOrb,
  blink_in: fxBlinkIn,
  blink_out: fxBlinkOut,
  magic_circle_cast: fxMagicCircleCast,
  mana_burst: fxManaBurst,
  portal: fxPortal,
  rune_circle: fxRuneCircle,
  spell_charge: fxSpellCharge,
  star_fall: fxStarFall,
  time_stop: fxTimeStop,
  // 神圣/神社
  blessing: fxBlessing,
  divine_shield: fxDivineShield,
  feather_burst: fxFeatherBurst,
  halo: fxHalo,
  heal: fxHeal,
  heal_aoe: fxHealAoe,
  holy_pillar: fxHolyPillar,
  resurrection: fxResurrection,
  smite: fxSmite,
  sunburst: fxSunburst,
  // 火焰/爆炸
  big_explosion: fxBigExplosion,
  firework_burst: fxFireworkBurst,
  implosion: fxImplosion,
  plasma_explosion: fxPlasmaExplosion,
  smoke_bomb: fxSmokeBomb,
  fire_breath: fxFireBreath,
  fire_ring: fxFireRing,
  fire_tornado: fxFireTornado,
  fireball: fxFireball,
  flame_pillar: fxFlamePillar,
  meteor: fxMeteor,
  spirit_flame: fxSpiritFlame,
  // 寒冰
  blizzard_vortex: fxBlizzardVortex,
  freeze: fxFreeze,
  frost_nova: fxFrostNova,
  ice_lance: fxIceLance,
  ice_shatter: fxIceShatter,
  snowflake_burst: fxSnowflakeBurst,
  // 雷霆（spark_arc 与 electrified 升级为纯净东方版）
  ball_lightning: fxBallLightning,
  chain_lightning: fxChainLightning,
  electrified: fxTouhouElectrified,
  lightning_strike: fxLightningStrike,
  spark_arc: fxTouhouSparkArc,
  thunderclap: fxThunderclap,
  // 幽冥/死亡
  black_hole: fxBlackHole,
  curse: fxCurse,
  dark_explosion: fxDarkExplosion,
  eclipse: fxEclipse,
  grasping_hands: fxGraspingHands,
  hex_sigil: fxHexSigil,
  life_steal: fxLifeSteal,
  necro_skulls: fxNecroSkulls,
  shadow_flames: fxShadowFlames,
  shadow_tendrils: fxTouhouShadowTendrils,
  soul_drain: fxSoulDrain,
  void_orb: fxVoidOrb,
  // 自然/水土
  earth_spike: fxEarthSpike,
  healing_bloom: fxHealingBloom,
  leaf_storm: fxLeafStorm,
  poison_cloud: fxPoisonCloud,
  quake: fxQuake,
  root_snare: fxRootSnare,
  spore_burst: fxSporeBurst,
  thorns: fxThorns,
  tornado: fxTornado,
  toxic_puddle: fxToxicPuddle,
  geyser: fxGeyser,
  water_orb: fxWaterOrb,
  whirlpool: fxWhirlpool,
  // 生灵/召唤/斩击/状态/天象（科幻与天气全面替换为东方纯净模块）
  bat: fxBat,
  bird: fxBird,
  butterfly: fxButterfly,
  eyeball: fxEyeball,
  ghost: fxGhost,
  snake: fxSnake,
  wisp: fxWisp,
  crit_hit: fxCritHit,
  hit_spark: fxHitSpark,
  shield_block: fxShieldBlock,
  claw_swipe: fxClawSwipe,
  double_slash: fxDoubleSlash,
  scythe_reap: fxScytheReap,
  sword_slash: fxSwordSlash,
  thrust: fxThrust,
  magic_missile: fxMagicMissile,
  force_field: fxTouhouForceField,
  hologram: fxTouhouHologram,
  warp_in: fxTouhouWarpIn,
  disintegrate: fxDisintegrate,
  soul_rise: fxTouhouSoulRise,
  spawn_portal: fxSpawnPortal,
  summon_rise: fxSummonRise,
  status_charmed: fxStatusCharmed,
  status_confused: fxStatusConfused,
  status_cursed: fxStatusCursed,
  status_haste: fxStatusHaste,
  status_poisoned: fxTouhouPoisoned,
  status_rage: fxStatusRage,
  status_slowed: fxStatusSlowed,
  aurora: fxTouhouAurora,
  cherry_blossoms: fxTouhouCherryBlossoms,
  fog: fxTouhouFog,
  god_rays: fxTouhouGodRays,
  shooting_stars: fxTouhouShootingStars,
  crimson_mist: fxTouhouCrimsonMist,
  // 扩充自研东方专属特效（25 种局域高辨识度模块，终结法术/召唤/结界/符卡复用！）
  gungnir_lance: fxTouhouGungnirLance,
  abyss_gap_rift: fxTouhouAbyssGapRift,
  vampiric_claw_burst: fxTouhouVampiricClawBurst,
  frost_prison_shatter: fxTouhouFrostPrison,
  wither_hourglass: fxTouhouWitherHourglass,
  mana_siphon_vortex: fxTouhouManaSiphon,
  summon_fairy_ring: fxTouhouSummonFairyRing,
  summon_beast_totem: fxTouhouSummonBeastTotem,
  summon_elemental_wind: fxTouhouSummonWind,
  summon_elemental_earth: fxTouhouSummonEarth,
  summon_elemental_fire: fxTouhouSummonPhoenix,
  summon_elemental_water: fxTouhouSummonWater,
  summon_flora_bloom: fxTouhouSummonFlora,
  summon_undead_crypt: fxTouhouSummonCrypt,
  summon_ice_abyss: fxTouhouSummonIceAbyss,
  ofuda_seal_ring: fxTouhouOfudaSealRing,
  ward_dome_prism: fxTouhouWardDomePrism,
  yin_yang_dream: fxTouhouYinYangDream,
  lunar_astrolabe_fx: fxTouhouLunarAstrolabe,
  lunar_hare_bloom: fxTouhouLunarHareBloom,
  crimson_shackle_chains: fxTouhouCrimsonShackle,
  mirror_prism_shatter: fxTouhouMirrorPrism,
  star_danmaku_spiral: fxTouhouStarDanmaku,
  sakura_spirit_vortex: fxTouhouSakuraVortex,
  shrine_bell_ripple: fxTouhouShrineBellRipple,
} as const satisfies Record<string, PixelFxModule>;

export type PixelFxEffectId = keyof typeof PIXELFX_MODULES;

/**
 * 静默透明替身（零掩码 + 零像素 + 精准头胸定位锚点）：
 * 防止 pixelfx 中带 meta.actor 的模块把内置 24×38 西幻火柴人骑士(HERO2)叠画到东方角色身上！
 */
export const SILENT_PIXELFX_ACTOR = Object.freeze({
  mask: Object.freeze({ w: 24, h: 38, data: new Uint8Array(24 * 38) }),
  pixels: new Uint32Array(24 * 38),
  x: -12,
  y: -38,
  w: 24,
  h: 38,
  k: 2,
  head: [0, -34] as [number, number],
  chest: [0, -20] as [number, number],
  eyes: [
    [11, 4],
    [13, 4],
  ] as Array<[number, number]>,
});

/** 垂直通天光柱 / 落雷的离屏净化与顶部柔化羽化配置 */
export interface FxPostProcessRule {
  /** 模块顶部局部硬切 Y 坐标（相对原点，通常为负数如 -204） */
  topOffset: number;
  /** 从顶部向下过渡到 100% 不透明的柔和羽化像素高度 */
  featherPx: number;
  /** 是否剥离模块自绘的纯黑/暗紫背景压暗幕布（如 lightning_strike 的 NIGHT 椭圆遮罩） */
  stripDarkVeil?: boolean;
}

export const MODULE_POST_PROCESS_RULES = new Map<PixelFxModule, FxPostProcessRule>([
  [fxHolyPillar, { topOffset: -204, featherPx: 54 }],
  [fxResurrection, { topOffset: -140, featherPx: 46 }],
  [fxBlessing, { topOffset: -108, featherPx: 38 }],
  [fxSmite, { topOffset: -148, featherPx: 42 }],
  [fxMagicCircleCast, { topOffset: -176, featherPx: 48 }],
  [fxFlamePillar, { topOffset: -212, featherPx: 48 }],
  [fxLightningStrike, { topOffset: -224, featherPx: 46, stripDarkVeil: true }],
]);

/**
 * 对离屏临时帧应用顶部柔化羽化与暗幕剥离，然后无损合并至目标主帧（支持单元测试直接复测！）
 */
export function blendSanitizedScratchIntoFrame(
  scratch: PixelFxFrame,
  dest: PixelFxFrame,
  originY: number,
  rule: FxPostProcessRule,
): void {
  const w = scratch.w;
  const h = scratch.h;
  const sc = scratch.color;
  const sl = scratch.light;
  const dc = dest.color;
  const dl = dest.light;

  const topScreenY = originY + rule.topOffset;
  const featherEnd = topScreenY + rule.featherPx;
  const stripDark = Boolean(rule.stripDarkVeil);

  for (let y = 0; y < h; y++) {
    const sy = y + scratch.oy;
    // 若像素低于 topScreenY，做平滑渐显羽化，彻底消除半空中一刀平切的硬边！
    let feather = 1;
    if (sy < featherEnd) {
      feather = smooth(topScreenY - 2, featherEnd, sy);
    }
    const rowOff = y * w;

    for (let x = 0; x < w; x++) {
      const idx = rowOff + x;
      let c = sc[idx];
      let l = sl[idx];
      if (!c && !l) continue;

      if (c) {
        let ca = c >>> 24;
        const r = c & 255;
        const g = (c >>> 8) & 255;
        const b = (c >>> 16) & 255;

        // 剥离闪电等模块自带的低亮度半透明背景黑幕，避免把暗夜棋盘糊出一块脏黑圆斑
        if (stripDark && ca < 215 && r < 24 && g < 22 && b < 34) {
          c = 0;
        } else if (feather < 0.999) {
          ca = Math.round(ca * feather);
          if (ca <= 2) {
            c = 0;
          } else {
            c = (ca << 24) | (b << 16) | (g << 8) | r;
          }
        }

        if (c) {
          const srcA = (c >>> 24) / 255;
          const prev = dc[idx];
          if (!prev || srcA >= 0.996) {
            dc[idx] = c;
          } else {
            const dstA = (prev >>> 24) / 255;
            const outA = srcA + dstA * (1 - srcA);
            if (outA > 0.004) {
              const k = srcA / outA;
              const m = 1 - k;
              const nr = ((c & 255) * k + (prev & 255) * m) & 255;
              const ng = (((c >>> 8) & 255) * k + ((prev >>> 8) & 255) * m) & 255;
              const nb = (((c >>> 16) & 255) * k + ((prev >>> 16) & 255) * m) & 255;
              dc[idx] = (((outA * 255) & 255) << 24) | (nb << 16) | (ng << 8) | nr;
            }
          }
        }
      }

      if (l) {
        const lr = Math.round((l & 255) * feather);
        const lg = Math.round(((l >>> 8) & 255) * feather);
        const lb = Math.round(((l >>> 16) & 255) * feather);
        if (lr > 0 || lg > 0 || lb > 0) {
          const prevL = dl[idx];
          const nr = Math.min(255, (prevL & 255) + lr);
          const ng = Math.min(255, ((prevL >>> 8) & 255) + lg);
          const nb = Math.min(255, ((prevL >>> 16) & 255) + lb);
          dl[idx] = (255 << 24) | (nb << 16) | (ng << 8) | nr;
        }
      }
    }
  }
}

/** 向后兼容的基础近战/符卡预设键 */
export type VfxKey =
  | 'melee_slash'
  | 'hit_spark'
  | 'crit_hit'
  | 'graze_shield'
  | 'ranged_missile'
  | 'holy_heal'
  | 'holy_ward'
  | 'reimu_orb'
  | 'marisa_bolt'
  | 'star_burst'
  | 'order_slow'
  | 'death_curse'
  | 'nature_haste'
  | 'mana_burst'
  | 'soul_rise'
  | 'spellcard_reimu'
  | 'spellcard_marisa';

interface VfxPreset {
  mod: PixelFxModule;
  palette: readonly string[];
  light?: number;
  speedScale?: number;
  maxDuration?: number;
}

const VFX_PRESETS: Record<VfxKey, VfxPreset> = {
  melee_slash: { mod: fxSwordSlash, palette: TOUHOU_PALETTES.reimu_crimson, light: 1.25, speedScale: 1.35 },
  hit_spark: { mod: fxHitSpark, palette: TOUHOU_PALETTES.marisa_starlight, light: 1.3, speedScale: 1.3 },
  crit_hit: { mod: fxCritHit, palette: TOUHOU_PALETTES.marisa_starlight, light: 1.45, speedScale: 1.2 },
  graze_shield: { mod: fxShieldBlock, palette: TOUHOU_PALETTES.graze_cyan, light: 1.35, speedScale: 1.45 },
  ranged_missile: { mod: fxMagicMissile, palette: TOUHOU_PALETTES.order_lunar, light: 1.25, speedScale: 1.8 },
  holy_heal: { mod: fxHealAoe, palette: TOUHOU_PALETTES.nature_emerald, light: 1.2, speedScale: 1.4, maxDuration: 1.6 },
  holy_ward: { mod: fxDivineShield, palette: TOUHOU_PALETTES.reimu_crimson, light: 1.25, speedScale: 1.3, maxDuration: 1.5 },
  reimu_orb: { mod: fxSmite, palette: TOUHOU_PALETTES.reimu_crimson, light: 1.4, speedScale: 1.5, maxDuration: 1.5 },
  marisa_bolt: { mod: fxPlasmaExplosion, palette: TOUHOU_PALETTES.marisa_starlight, light: 1.45, speedScale: 1.35 },
  star_burst: { mod: fxStarFall, palette: TOUHOU_PALETTES.marisa_starlight, light: 1.4, speedScale: 1.4, maxDuration: 1.8 },
  order_slow: { mod: fxMagicCircleCast, palette: TOUHOU_PALETTES.order_lunar, light: 1.2, speedScale: 1.8, maxDuration: 1.5 },
  death_curse: { mod: fxCurse, palette: TOUHOU_PALETTES.death_nether, light: 1.25, speedScale: 1.6, maxDuration: 1.6 },
  nature_haste: { mod: fxHealingBloom, palette: TOUHOU_PALETTES.nature_emerald, light: 1.25, speedScale: 1.7, maxDuration: 1.5 },
  mana_burst: { mod: fxManaBurst, palette: TOUHOU_PALETTES.order_lunar, light: 1.35, speedScale: 1.35 },
  soul_rise: { mod: fxTouhouSoulRise, palette: TOUHOU_PALETTES.death_nether, light: 1.2, speedScale: 1.35, maxDuration: 1.6 },
  spellcard_reimu: { mod: fxHolyPillar, palette: TOUHOU_PALETTES.reimu_crimson, light: 1.55, speedScale: 1.25, maxDuration: 2.2 },
  spellcard_marisa: { mod: fxArcaneBeam, palette: TOUHOU_PALETTES.marisa_starlight, light: 1.65, speedScale: 1.15, maxDuration: 1.7 },
};

interface ActiveFxSlot {
  instance: PixelFxInstance;
  originY: number;
  postRule: FxPostProcessRule | null;
  speedScale: number;
  elapsed: number;
  maxDuration: number;
}

let painterSafetyInstalled = false;

/**
 * 为 pixelfx 内部 Painter 原型安装 NaN / Infinity / 超巨越界安全守卫（幂等、近零开销）：
 * 根治第三方特效模块在边界帧算出 NaN 坐标传入 p.line() 时触发 Bresenham `for (;;)` 永久死循环，
 * 同时防御 beam / each / circle / disc / ellipse / ring / arc / glow 系列方法的非有限参数卡死！
 */
export function installPixelFxPainterSafetyGuards(): void {
  if (painterSafetyInstalled) return;
  painterSafetyInstalled = true;

  const probe = painterFor(createFrame(1, 1, 0, 0));
  const proto = Object.getPrototypeOf(probe) as Record<string, (...args: unknown[]) => unknown> | null;
  if (!proto) return;

  const MAX_ABS_COORD = 4096;
  const wrapCoordGuard = (methodName: string, numArgs: number, maxSpan = 2400) => {
    const orig = proto[methodName];
    if (typeof orig !== 'function') return;
    proto[methodName] = function guardedPainterMethod(this: unknown, ...args: unknown[]) {
      for (let i = 0; i < numArgs; i++) {
        const v = args[i];
        if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > MAX_ABS_COORD) {
          return;
        }
      }
      if (methodName === 'line' && numArgs >= 4) {
        const dx = Math.abs((args[2] as number) - (args[0] as number));
        const dy = Math.abs((args[3] as number) - (args[1] as number));
        if (dx > maxSpan || dy > maxSpan) return;
      }
      if (methodName === 'arc' && numArgs >= 6) {
        if ((args[5] as number) <= (args[4] as number)) return;
      }
      return orig.apply(this, args);
    };
  };

  wrapCoordGuard('line', 4);
  wrapCoordGuard('beam', 5);
  wrapCoordGuard('each', 4);
  wrapCoordGuard('rect', 4);
  wrapCoordGuard('circle', 3);
  wrapCoordGuard('disc', 3);
  wrapCoordGuard('ellipse', 4);
  wrapCoordGuard('ring', 4);
  wrapCoordGuard('arc', 6);
  wrapCoordGuard('glow', 3);
  wrapCoordGuard('glowLine', 5);
  wrapCoordGuard('glowRing', 4);
}

installPixelFxPainterSafetyGuards();

export class PixelFxStageBridge {
  public readonly sprite: PIXI.Sprite;
  private readonly frame: PixelFxFrame;
  private readonly scratchFrame: PixelFxFrame;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly imageData: ImageData;
  private readonly canvasSource: PIXI.CanvasSource;
  private readonly activeList: ActiveFxSlot[] = [];
  private seedCounter = 1001;
  private dirtyEmpty = false;

  constructor(width: number, height: number) {
    installPixelFxPainterSafetyGuards();
    this.frame = createFrame(width, height, 0, 0);
    // 复用的单帧离屏净化缓冲（仅对垂直光柱与落雷激活，零每帧内存分配！）
    this.scratchFrame = createFrame(width, height, 0, 0);
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法初始化 pixelfx 离屏 Canvas 2D 上下文');
    }
    this.ctx = ctx;
    this.imageData = ctx.createImageData(width, height);

    this.canvasSource = new PIXI.CanvasSource({
      resource: this.canvas,
      scaleMode: 'nearest',
    });
    const texture = new PIXI.Texture({ source: this.canvasSource });
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.roundPixels = true;
  }

  /** 按内置基础预设键播放特效（近战/符卡兼容） */
  public spawn(
    key: VfxKey,
    x: number,
    y: number,
    extra: {
      palette?: readonly string[];
      flip?: boolean;
      angle?: number;
      light?: number;
      maxDuration?: number;
    } = {},
  ): void {
    const preset = VFX_PRESETS[key];
    if (!preset) return;
    this.spawnModule(preset.mod, x, y, {
      palette: extra.palette ?? preset.palette,
      flip: extra.flip,
      angle: extra.angle,
      light: extra.light ?? preset.light ?? 1.25,
      speedScale: preset.speedScale ?? 1.2,
      maxDuration: extra.maxDuration ?? preset.maxDuration ?? 2.2,
    });
  }

  /** 按 106 种精细像素特效模块键 + 25 套东方调色板自由编排专属法术特效！ */
  public spawnEffect(
    effectId: PixelFxEffectId,
    x: number,
    y: number,
    opts: {
      paletteKey?: TouhouPaletteKey;
      palette?: readonly string[];
      flip?: boolean;
      angle?: number;
      light?: number;
      speedScale?: number;
      maxDuration?: number;
    } = {},
  ): void {
    const mod = PIXELFX_MODULES[effectId];
    if (!mod) return;
    const pal = opts.palette ?? (opts.paletteKey ? TOUHOU_PALETTES[opts.paletteKey] : TOUHOU_PALETTES.marisa_starlight);
    this.spawnModule(mod, x, y, {
      palette: pal,
      flip: opts.flip,
      angle: opts.angle,
      light: opts.light ?? 1.35,
      speedScale: opts.speedScale ?? 1.45,
      maxDuration: opts.maxDuration ?? 1.65,
    });
  }

  private spawnModule(
    mod: PixelFxModule,
    x: number,
    y: number,
    cfg: {
      palette: readonly string[];
      flip?: boolean;
      angle?: number;
      light: number;
      speedScale: number;
      maxDuration: number;
    },
  ): void {
    // 防极端群体法术同帧叠加爆表：限制上限 24 槽位并自动淘汰最旧槽位，保证全屏 AOE 丝滑不掉帧
    if (this.activeList.length >= 24) {
      this.activeList.shift();
    }
    this.seedCounter += 17;
    const roundedY = Math.round(y);
    const opts: PixelFxOptions & { actor?: unknown } = {
      x: Math.round(x),
      y: roundedY,
      flip: cfg.flip ?? false,
      angle: cfg.angle ?? 0,
      seed: this.seedCounter,
      palette: [...cfg.palette],
      light: cfg.light,
      // 强制注入静默空像素替身，彻底消灭西幻像素骑士剪影污染！
      actor: SILENT_PIXELFX_ACTOR,
    };
    const instance = createFx(mod, opts);
    this.activeList.push({
      instance,
      originY: roundedY,
      postRule: MODULE_POST_PROCESS_RULES.get(mod) ?? null,
      speedScale: cfg.speedScale,
      elapsed: 0,
      maxDuration: cfg.maxDuration,
    });
    this.dirtyEmpty = true;
  }

  /** 每帧推进全部活跃 pixelfx 特效，并将双缓冲（color + light）透明合成到 PixiJS 纹理 */
  public update(dtSeconds: number): void {
    const clampedDt = Math.min(0.05, Math.max(0.001, dtSeconds));

    if (this.activeList.length === 0) {
      if (this.dirtyEmpty) {
        this.ctx.clearRect(0, 0, this.frame.w, this.frame.h);
        this.canvasSource.update();
        this.dirtyEmpty = false;
      }
      return;
    }

    clearFrame(this.frame);

    for (let i = this.activeList.length - 1; i >= 0; i--) {
      const slot = this.activeList[i];
      slot.elapsed += clampedDt;
      // 硬超时保险：防止任何异常特效滞留永不结束
      if (slot.elapsed >= slot.maxDuration + 0.65) {
        this.activeList.splice(i, 1);
        continue;
      }
      try {
        if (slot.elapsed >= slot.maxDuration) {
          slot.instance.stop();
        }
        slot.instance.update(clampedDt * slot.speedScale);
        if (slot.instance.done()) {
          this.activeList.splice(i, 1);
          continue;
        }
        if (slot.postRule) {
          clearFrame(this.scratchFrame);
          slot.instance.draw(this.scratchFrame);
          blendSanitizedScratchIntoFrame(this.scratchFrame, this.frame, slot.originY, slot.postRule);
        } else {
          slot.instance.draw(this.frame);
        }
      } catch (err) {
        console.warn('像素特效渲染异常，已安全剔除故障槽位以防卡死:', err);
        this.activeList.splice(i, 1);
      }
    }

    composite(this.frame, this.imageData.data, null, 1.25);
    this.ctx.putImageData(this.imageData, 0, 0);
    this.canvasSource.update();
  }

  public destroy(): void {
    this.activeList.length = 0;
    this.sprite.destroy({ texture: true, textureSource: true });
  }
}

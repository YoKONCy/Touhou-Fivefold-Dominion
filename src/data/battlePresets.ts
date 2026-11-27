/**
 * 预设纯阵营 7 vs 7 满编战局工厂：支持「生命·信仰圣域」「混沌·魔导结社」「秩序·幻月庭园」三大完整 8 兵阵营任意两两对弈！
 *
 * 每阵营完整提供 A / B 两套互斥兵营路线：
 * - 信仰圣域（生命 · 博丽灵梦）：
 *   · A 阵：博丽毛玉 + 御札弓手 + 镇守狛犬(2×2) + 退魔剑士 + 净邪巫女 + 御柱天马(2×1)
 *   · B 阵：博丽毛玉 + 御札弓手 + 阴阳浮游炮 + 镇守狛犬(2×2) + 净邪巫女 + 神使(1×2)
 * - 魔导结社（混沌 · 雾雨魔理沙）：
 *   · A 阵：夜影使魔 + 魔法使 + 武装人形 + 禁忌之书(2×1) + 梦境兽(2×1) + 魔导巨像(2×2)
 *   · B 阵：夜影使魔 + 魔法使 + 禁忌之书(2×1) + 武装人形 + 法界之火(1×2) + 红莲魔龙(2×2)
 * - 幻月庭园（秩序 · 八意永琳）：
 *   · A 阵（净秽法阵）：竹林妖怪兔 + 玉兔掷弹兵 + 幻法狸妖 + 重装月兔近卫 + 幻月妖 + 净秽者(1×2)
 *   · B 阵（河童机神）：竹林妖怪兔 + 玉兔掷弹兵 + 重装月兔近卫 + 幻法狸妖 + 战斗 II 型(1×2) + 非想天则(2×2)
 */

import {
  createBattleState,
  type ArmyPlacementSlot,
  type CombatContentCatalog,
} from '@core/combatEngine';
import type { BattleState, CombatEvent, ControllerType, SideId } from '@core/types';
import {
  buildShrineNightBattleMap,
  CREATURE_DEFINITIONS,
  GAME_DATA_REGISTRY,
  HERO_DEFINITIONS,
  POTIONS,
  SPELL_CARDS,
  SPELLS,
} from './definitions';

export const TOUHOU_CATALOG: CombatContentCatalog = {
  ...GAME_DATA_REGISTRY,
  heroes: HERO_DEFINITIONS,
  creatures: CREATURE_DEFINITIONS,
  spells: SPELLS,
  spellCards: SPELL_CARDS,
  potions: POTIONS,
};

export type LineupVariant = 'A' | 'B';
export type PlayableFactionId = 'life' | 'order' | 'chaos' | 'death';

export const PLAYABLE_FACTION_META: Record<
  PlayableFactionId,
  {
    id: PlayableFactionId;
    short: string;
    name: string;
    heroName: string;
    themeColor: string;
    variantAName: string;
    variantBName: string;
    variantASummary: string;
    variantBSummary: string;
  }
> = {
  life: {
    id: 'life',
    short: '生命',
    name: '信仰圣域',
    heroName: '博丽灵梦',
    themeColor: '#e04f5f',
    variantAName: '铁壁退魔',
    variantBName: '神使苏生',
    variantASummary: '博丽灵梦率镇守狛犬 / 退魔剑士 / 御柱天马正面对决',
    variantBSummary: '博丽灵梦率神使苏生 / 阴阳浮游炮无视障碍立体压制',
  },
  order: {
    id: 'order',
    short: '秩序',
    name: '幻月庭园',
    heroName: '八意永琳',
    themeColor: '#6699ff',
    variantAName: '净秽法阵',
    variantBName: '河童机神',
    variantASummary: '八意永琳率净秽者 / 幻月妖 / 幻法狸妖与重装月兔近卫控场轰杀',
    variantBSummary: '八意永琳率 2×2 巨神非想天则 / 1×2 六臂战斗 II 型铁壁先攻推进',
  },
  chaos: {
    id: 'chaos',
    short: '混沌',
    name: '魔导结社',
    heroName: '雾雨魔理沙',
    themeColor: '#f6c945',
    variantAName: '魔导巨像',
    variantBName: '法界魔龙',
    variantASummary: '雾雨魔理沙率魔导巨像全扫 / 梦境兽震慑 / 武装人形格挡强突',
    variantBSummary: '雾雨魔理沙率红莲魔龙全魔免吐息 / 法界之火烈焰护盾狂轰',
  },
  death: {
    id: 'death',
    short: '死亡',
    name: '幽冥公馆',
    heroName: '蕾米莉亚',
    themeColor: '#b556e8',
    variantAName: '红魔亡灵',
    variantBName: '深渊瘴毒',
    variantASummary: '蕾米莉亚率骸骨巨龙 / 血族眷属吸血 / 怨灵衰老与小恶魔吸蓝强袭',
    variantBSummary: '蕾米莉亚率深渊隙间恶魔全图瞬移召冰魔 / 毒瘴妖剧毒 / 地狱鸦三翼裂袭',
  },
};

export const LINEUP_VARIANT_META: Record<
  LineupVariant,
  { short: string; title: string; summary: string }
> = {
  A: {
    short: '阵A',
    title: 'A 阵 · 主战路线 A',
    summary: '生命（御柱天马）· 秩序（净秽者）· 混沌（魔导巨像）· 死亡（骸骨巨龙/血族眷属）',
  },
  B: {
    short: '阵B',
    title: 'B 阵 · 主战路线 B',
    summary: '生命（神使）· 秩序（非想天则）· 混沌（红莲魔龙）· 死亡（深渊隙间恶魔/毒瘴妖）',
  },
};

export interface PresetBattleOptions {
  mode: 'vs_ai' | 'hotseat';
  balancePreset?: 'classic_h4' | 'equilibris_tuned';
  lineupVariant?: LineupVariant;
  leftFaction?: PlayableFactionId;
  rightFaction?: PlayableFactionId;
  seed?: number;
}

/**
 * 为指定阵营与左右战线生成 7 格满编合法落位（严格避开全部岩石、水域与高耸障碍，支持 1×1~2×2 任意多格体积！）
 */
export function buildFactionArmySlots(
  faction: PlayableFactionId,
  side: SideId,
  variant: LineupVariant,
): ArmyPlacementSlot[] {
  if (faction === 'life') {
    if (side === 'left') {
      return variant === 'A'
        ? [
            { kind: 'hero', defId: 'hero_reimu', col: -2, row: 7 },
            { kind: 'creature', defId: 'kedama', count: 20, col: 1, row: 14 },
            { kind: 'creature', defId: 'ofuda_archer', count: 16, col: -1, row: 3 },
            { kind: 'creature', defId: 'shrine_komainu', count: 8, col: 2, row: 6 },
            { kind: 'creature', defId: 'exorcist_blade', count: 5, col: 2, row: 2 },
            { kind: 'creature', defId: 'prayer_maiden', count: 5, col: -2, row: 11 },
            { kind: 'creature', defId: 'onbashira_steed', count: 3, col: 0, row: 11 },
          ]
        : [
            { kind: 'hero', defId: 'hero_reimu', col: -2, row: 7 },
            { kind: 'creature', defId: 'kedama', count: 20, col: 1, row: 14 },
            { kind: 'creature', defId: 'ofuda_archer', count: 16, col: -1, row: 3 },
            { kind: 'creature', defId: 'yinyang_turret', count: 8, col: 2, row: 2 },
            { kind: 'creature', defId: 'shrine_komainu', count: 7, col: 2, row: 6 },
            { kind: 'creature', defId: 'prayer_maiden', count: 5, col: -2, row: 11 },
            { kind: 'creature', defId: 'hakurei_seraph', count: 2, col: 0, row: 10 },
          ];
    }
    return variant === 'A'
      ? [
          { kind: 'hero', defId: 'hero_reimu', col: 22, row: 13 },
          { kind: 'creature', defId: 'kedama', count: 20, col: 18, row: 19 },
          { kind: 'creature', defId: 'ofuda_archer', count: 16, col: 21, row: 8 },
          { kind: 'creature', defId: 'shrine_komainu', count: 8, col: 18, row: 13 },
          { kind: 'creature', defId: 'exorcist_blade', count: 5, col: 19, row: 5 },
          { kind: 'creature', defId: 'prayer_maiden', count: 5, col: 21, row: 16 },
          { kind: 'creature', defId: 'onbashira_steed', count: 3, col: 18, row: 10 },
        ]
      : [
          { kind: 'hero', defId: 'hero_reimu', col: 22, row: 13 },
          { kind: 'creature', defId: 'kedama', count: 20, col: 18, row: 19 },
          { kind: 'creature', defId: 'ofuda_archer', count: 16, col: 21, row: 8 },
          { kind: 'creature', defId: 'yinyang_turret', count: 8, col: 19, row: 5 },
          { kind: 'creature', defId: 'shrine_komainu', count: 7, col: 18, row: 13 },
          { kind: 'creature', defId: 'prayer_maiden', count: 5, col: 21, row: 16 },
          { kind: 'creature', defId: 'hakurei_seraph', count: 2, col: 19, row: 10 },
        ];
  }

  if (faction === 'chaos') {
    if (side === 'right') {
      return variant === 'A'
        ? [
            { kind: 'hero', defId: 'hero_marisa', col: 22, row: 13 },
            { kind: 'creature', defId: 'forest_shadow_imp', count: 22, col: 18, row: 19 },
            { kind: 'creature', defId: 'broom_caster', count: 16, col: 21, row: 8 },
            { kind: 'creature', defId: 'hourai_doll', count: 8, col: 18, row: 14 },
            { kind: 'creature', defId: 'grimoire_familiar', count: 8, col: 20, row: 16 },
            { kind: 'creature', defId: 'miasma_nightmare', count: 4, col: 18, row: 5 },
            { kind: 'creature', defId: 'arcane_colossus', count: 2, col: 18, row: 10 },
          ]
        : [
            { kind: 'hero', defId: 'hero_marisa', col: 22, row: 13 },
            { kind: 'creature', defId: 'forest_shadow_imp', count: 22, col: 18, row: 19 },
            { kind: 'creature', defId: 'broom_caster', count: 16, col: 21, row: 8 },
            { kind: 'creature', defId: 'grimoire_familiar', count: 7, col: 20, row: 16 },
            { kind: 'creature', defId: 'hourai_doll', count: 7, col: 18, row: 14 },
            { kind: 'creature', defId: 'starfire_efreet', count: 4, col: 19, row: 4 },
            { kind: 'creature', defId: 'crimson_star_dragon', count: 1, col: 18, row: 10 },
          ];
    }
    return variant === 'A'
      ? [
          { kind: 'hero', defId: 'hero_marisa', col: -2, row: 7 },
          { kind: 'creature', defId: 'forest_shadow_imp', count: 22, col: 1, row: 14 },
          { kind: 'creature', defId: 'broom_caster', count: 16, col: -1, row: 3 },
          { kind: 'creature', defId: 'hourai_doll', count: 8, col: 3, row: 6 },
          { kind: 'creature', defId: 'grimoire_familiar', count: 8, col: -2, row: 11 },
          { kind: 'creature', defId: 'miasma_nightmare', count: 4, col: 2, row: 2 },
          { kind: 'creature', defId: 'arcane_colossus', count: 2, col: 1, row: 9 },
        ]
      : [
          { kind: 'hero', defId: 'hero_marisa', col: -2, row: 7 },
          { kind: 'creature', defId: 'forest_shadow_imp', count: 22, col: 1, row: 14 },
          { kind: 'creature', defId: 'broom_caster', count: 16, col: -1, row: 3 },
          { kind: 'creature', defId: 'grimoire_familiar', count: 7, col: -2, row: 11 },
          { kind: 'creature', defId: 'hourai_doll', count: 7, col: 3, row: 6 },
          { kind: 'creature', defId: 'starfire_efreet', count: 4, col: 2, row: 2 },
          { kind: 'creature', defId: 'crimson_star_dragon', count: 1, col: 1, row: 10 },
        ];
  }

  // 幻月庭园 · 秩序系（八意永琳率 8 兵种 A/B 双路线满编）
  if (faction === 'order') {
    if (side === 'left') {
    return variant === 'A'
      ? [
          { kind: 'hero', defId: 'hero_eirin', col: -2, row: 7 },
          { kind: 'creature', defId: 'youkai_rabbit', count: 19, col: 1, row: 14 },
          { kind: 'creature', defId: 'lunar_slinger', count: 19, col: -1, row: 3 },
          { kind: 'creature', defId: 'armored_lunar_guard', count: 8, col: 2, row: 6 },
          { kind: 'creature', defId: 'tanuki_illusionist', count: 8, col: -2, row: 11 },
          { kind: 'creature', defId: 'lunar_genie', count: 5, col: 2, row: 2 },
          { kind: 'creature', defId: 'purity_titan', count: 2, col: 0, row: 10 },
        ]
      : [
          { kind: 'hero', defId: 'hero_eirin', col: -2, row: 7 },
          { kind: 'creature', defId: 'youkai_rabbit', count: 19, col: 1, row: 14 },
          { kind: 'creature', defId: 'lunar_slinger', count: 19, col: -1, row: 3 },
          { kind: 'creature', defId: 'armored_lunar_guard', count: 8, col: 3, row: 6 },
          { kind: 'creature', defId: 'tanuki_illusionist', count: 7, col: -2, row: 11 },
          { kind: 'creature', defId: 'combat_mk2', count: 4, col: 2, row: 2 },
          { kind: 'creature', defId: 'hisoutensoku', count: 2, col: 0, row: 10 },
        ];
  }
  return variant === 'A'
    ? [
        { kind: 'hero', defId: 'hero_eirin', col: 22, row: 13 },
        { kind: 'creature', defId: 'youkai_rabbit', count: 19, col: 18, row: 19 },
        { kind: 'creature', defId: 'lunar_slinger', count: 19, col: 21, row: 8 },
        { kind: 'creature', defId: 'armored_lunar_guard', count: 8, col: 18, row: 14 },
        { kind: 'creature', defId: 'tanuki_illusionist', count: 8, col: 21, row: 16 },
        { kind: 'creature', defId: 'lunar_genie', count: 5, col: 19, row: 5 },
        { kind: 'creature', defId: 'purity_titan', count: 2, col: 19, row: 10 },
      ]
    : [
        { kind: 'hero', defId: 'hero_eirin', col: 22, row: 13 },
        { kind: 'creature', defId: 'youkai_rabbit', count: 19, col: 18, row: 19 },
        { kind: 'creature', defId: 'lunar_slinger', count: 19, col: 21, row: 8 },
        { kind: 'creature', defId: 'armored_lunar_guard', count: 8, col: 18, row: 14 },
        { kind: 'creature', defId: 'tanuki_illusionist', count: 7, col: 21, row: 16 },
        { kind: 'creature', defId: 'combat_mk2', count: 4, col: 18, row: 5 },
        { kind: 'creature', defId: 'hisoutensoku', count: 2, col: 17, row: 10 },
      ];
  }

  // 幽冥公馆 · 死亡系（蕾米莉亚率 8 兵种 A/B 双路线满编）
  if (side === 'left') {
    return variant === 'A'
      ? [
          { kind: 'hero', defId: 'hero_remilia', col: -2, row: 7 },
          { kind: 'creature', defId: 'corpse_husk', count: 21, col: 1, row: 14 },
          { kind: 'creature', defId: 'koakuma_imp', count: 20, col: -1, row: 3 },
          { kind: 'creature', defId: 'wraith_spirit', count: 8, col: 2, row: 6 },
          { kind: 'creature', defId: 'hell_raven', count: 7, col: 2, row: 2 },
          { kind: 'creature', defId: 'crimson_vampire', count: 4, col: -2, row: 11 },
          { kind: 'creature', defId: 'bone_dragon', count: 2, col: 1, row: 10 },
        ]
      : [
          { kind: 'hero', defId: 'hero_remilia', col: -2, row: 7 },
          { kind: 'creature', defId: 'corpse_husk', count: 21, col: 1, row: 14 },
          { kind: 'creature', defId: 'koakuma_imp', count: 20, col: -1, row: 3 },
          { kind: 'creature', defId: 'hell_raven', count: 8, col: 2, row: 2 },
          { kind: 'creature', defId: 'wraith_spirit', count: 7, col: 2, row: 6 },
          { kind: 'creature', defId: 'miasma_venom_youkai', count: 4, col: -2, row: 11 },
          { kind: 'creature', defId: 'abyss_gap_devil', count: 2, col: 0, row: 10 },
        ];
  }
  return variant === 'A'
    ? [
        { kind: 'hero', defId: 'hero_remilia', col: 22, row: 13 },
        { kind: 'creature', defId: 'corpse_husk', count: 21, col: 18, row: 19 },
        { kind: 'creature', defId: 'koakuma_imp', count: 20, col: 21, row: 8 },
        { kind: 'creature', defId: 'wraith_spirit', count: 8, col: 18, row: 13 },
        { kind: 'creature', defId: 'hell_raven', count: 7, col: 18, row: 5 },
        { kind: 'creature', defId: 'crimson_vampire', count: 4, col: 21, row: 16 },
        { kind: 'creature', defId: 'bone_dragon', count: 2, col: 18, row: 10 },
      ]
    : [
        { kind: 'hero', defId: 'hero_remilia', col: 22, row: 13 },
        { kind: 'creature', defId: 'corpse_husk', count: 21, col: 18, row: 19 },
        { kind: 'creature', defId: 'koakuma_imp', count: 20, col: 21, row: 8 },
        { kind: 'creature', defId: 'hell_raven', count: 8, col: 18, row: 5 },
        { kind: 'creature', defId: 'wraith_spirit', count: 7, col: 18, row: 13 },
        { kind: 'creature', defId: 'miasma_venom_youkai', count: 4, col: 21, row: 16 },
        { kind: 'creature', defId: 'abyss_gap_devil', count: 2, col: 19, row: 10 },
      ];
}

export function createReimuVsMarisaBattle(
  options: PresetBattleOptions = { mode: 'vs_ai' },
): { state: BattleState; events: CombatEvent[] } {
  const map = buildShrineNightBattleMap();
  const variant: LineupVariant = options.lineupVariant ?? 'A';
  const leftFaction: PlayableFactionId = options.leftFaction ?? 'life';
  const rightFaction: PlayableFactionId = options.rightFaction ?? 'chaos';

  const leftSlots = buildFactionArmySlots(leftFaction, 'left', variant);
  const rightSlots = buildFactionArmySlots(rightFaction, 'right', variant);

  const controllers: Record<SideId, ControllerType> =
    options.mode === 'hotseat'
      ? { left: 'human', right: 'human' }
      : { left: 'human', right: 'ai' };

  return createBattleState(
    {
      battleId: `shrine_night_${leftFaction}_vs_${rightFaction}_${variant.toLowerCase()}`,
      seed: options.seed ?? 20261125,
      mapWidth: map.width,
      mapHeight: map.height,
      tiles: map.tiles,
      leftSlots,
      rightSlots,
      controllers,
      balancePreset: options.balancePreset ?? 'equilibris_tuned',
    },
    TOUHOU_CATALOG,
  );
}

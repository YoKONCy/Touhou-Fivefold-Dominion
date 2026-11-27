/**
 * 阵营/生物类型语义着色器 + 法术极性分类系统（单一事实来源）
 *
 * 1. 法术极性五分法：伤害 (damage) / 治愈 (heal) / 增益 (buff) / 减益 (debuff) / 战术 (utility)
 * 2. 特殊生物类型与暗系视觉微标字典（机械 / 不死 / 元素 / 幻象 / 暗系）
 * 3. 纯安全 Token 语义分词器（零 v-html 风险），自动为详述文案中的五大阵营、
 *    东方势力、特殊生物类型及正负数值上色并配小图标。
 */

import { ALIGNMENT_META, type Alignment } from '@core/alignment';
import {
  resolveUnitSummonKind,
  type BattleUnit,
  type SpellCardDef,
  type SpellDef,
  type SummonKind,
} from '@core/types';

export type SpellPolarityKind = 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';

export interface SpellPolarityMeta {
  id: SpellPolarityKind;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  barColor: string;
}

export const ALL_SPELL_POLARITIES: readonly SpellPolarityKind[] = [
  'damage',
  'heal',
  'buff',
  'debuff',
  'utility',
] as const;

export const SPELL_POLARITY_META: Record<SpellPolarityKind, SpellPolarityMeta> = {
  damage: {
    id: 'damage',
    label: '伤害',
    shortLabel: '伤',
    icon: 'polarity_damage',
    color: '#ff8291',
    bg: 'rgba(64, 18, 28, 0.92)',
    border: '#d9485e',
    barColor: '#f2556d',
  },
  heal: {
    id: 'heal',
    label: '治愈',
    shortLabel: '愈',
    icon: 'polarity_heal',
    color: '#7ef5b5',
    bg: 'rgba(14, 50, 38, 0.92)',
    border: '#3ec787',
    barColor: '#4be39c',
  },
  buff: {
    id: 'buff',
    label: '增益',
    shortLabel: '益',
    icon: 'polarity_buff',
    color: '#88e8dc',
    bg: 'rgba(16, 46, 48, 0.92)',
    border: '#45b8ad',
    barColor: '#54d6c8',
  },
  debuff: {
    id: 'debuff',
    label: '减益',
    shortLabel: '衰',
    icon: 'polarity_debuff',
    color: '#eb96f5',
    bg: 'rgba(54, 18, 56, 0.92)',
    border: '#c252cc',
    barColor: '#d966e6',
  },
  utility: {
    id: 'utility',
    label: '战术',
    shortLabel: '术',
    icon: 'polarity_utility',
    color: '#f5d98a',
    bg: 'rgba(54, 40, 16, 0.92)',
    border: '#cfa34a',
    barColor: '#e6ba5c',
  },
};

const UTILITY_EFFECTS = new Set([
  'summon_creature',
  'raise_undead',
  'animate_dead',
  'death_call',
  'create_illusion',
  'teleport',
  'dispel',
  'steal_enchantment',
  'quicksand',
  'necromancy_ward',
  'sacrifice',
]);

const HEAL_EFFECTS = new Set([
  'regeneration',
  'divine_intervention',
  'guardian_angel',
]);

const DEBUFF_EFFECTS = new Set([
  'poison',
  'plague',
  'blind',
  'hypnotize',
  'berserk',
  'confusion',
  'cloud_of_confusion',
  'cowardice',
  'song_of_peace',
  'forgetfulness',
  'curse',
  'cancellation',
  'magic_leech',
  'mana_flare',
]);

const DAMAGE_EFFECTS = new Set([
  'holy_word',
  'holy_shout',
  'hand_of_death',
  'disintegrate',
  'chain_lightning',
  'armageddon',
  'life_drain',
  'sparks',
  'banish',
  'wasp_swarm',
]);

/** 将任意法术归入 5 大视觉极性（伤害 / 治愈 / 增益 / 减益 / 战术） */
export function classifySpellPolarity(spell: SpellDef): SpellPolarityKind {
  if (spell.isAdventureOnly || spell.targetType === 'adventure') {
    return 'utility';
  }
  const eff = spell.specialEffect;
  if (eff && UTILITY_EFFECTS.has(eff)) {
    return 'utility';
  }
  if (spell.healBase || spell.reviveBase || (eff && HEAL_EFFECTS.has(eff))) {
    return 'heal';
  }
  if (eff && DEBUFF_EFFECTS.has(eff)) {
    return 'debuff';
  }
  if (spell.damageBase || (eff && DAMAGE_EFFECTS.has(eff))) {
    return 'damage';
  }
  if (
    (spell.debuffModifiers && spell.debuffModifiers.length > 0) ||
    spell.targetType === 'enemy_unit' ||
    spell.massScope === 'all_enemies'
  ) {
    return 'debuff';
  }
  return 'buff';
}

/** 将英雄专属符卡归入对应极性 */
export function classifySpellCardPolarity(card: SpellCardDef): SpellPolarityKind {
  if (card.targetType === 'hex_line' || card.damageBase) {
    return 'damage';
  }
  if (card.fieldAura) {
    return 'buff';
  }
  return 'utility';
}

export type SpecialCreatureTagId =
  | 'mechanical'
  | 'undead'
  | 'elemental'
  | 'illusion'
  | 'summoned'
  | 'raised'
  | 'darkNature';

export interface SpecialCreatureTagMeta {
  id: SpecialCreatureTagId;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}

/** 三类召唤物（幻象 / 召唤 / 复生）UI 血条渐变与标签视觉配色（与战场血条色 100% 同源） */
export const SUMMON_KIND_HP_THEME: Record<
  SummonKind,
  { label: string; hpGradient: string; hpTextColor: string; borderColor: string }
> = {
  illusion: {
    label: '幻象',
    hpGradient: 'linear-gradient(90deg, #18c5e8 0%, #78ffff 100%)',
    hpTextColor: '#b8fcff',
    borderColor: '#5ceeff',
  },
  summoned: {
    label: '召唤',
    hpGradient: 'linear-gradient(90deg, #e8841a 0%, #ffd45e 100%)',
    hpTextColor: '#ffebc2',
    borderColor: '#ffca5c',
  },
  raised: {
    label: '复生',
    hpGradient: 'linear-gradient(90deg, #9836e8 0%, #df9eff 100%)',
    hpTextColor: '#ecd4ff',
    borderColor: '#d68aff',
  },
};

export const SPECIAL_CREATURE_TAG_META: Record<SpecialCreatureTagId, SpecialCreatureTagMeta> = {
  mechanical: {
    id: 'mechanical',
    label: '机械',
    icon: 'mechanical',
    color: '#d4dfed',
    bg: 'rgba(26, 32, 46, 0.94)',
    border: '#7d8eab',
  },
  undead: {
    id: 'undead',
    label: '不死',
    icon: 'undead',
    color: '#d9c2ff',
    bg: 'rgba(34, 18, 52, 0.94)',
    border: '#9266cc',
  },
  elemental: {
    id: 'elemental',
    label: '元素',
    icon: 'elemental',
    color: '#8cf5eb',
    bg: 'rgba(14, 44, 48, 0.94)',
    border: '#42bfb5',
  },
  illusion: {
    id: 'illusion',
    label: '幻象',
    icon: 'illusion',
    color: '#a8f0ff',
    bg: 'rgba(16, 40, 56, 0.94)',
    border: '#5ec8eb',
  },
  summoned: {
    id: 'summoned',
    label: '召唤',
    icon: 'nature_magic',
    color: '#ffe29e',
    bg: 'rgba(48, 30, 12, 0.94)',
    border: '#f0a83c',
  },
  raised: {
    id: 'raised',
    label: '复生',
    icon: 'death_magic',
    color: '#ebd1ff',
    bg: 'rgba(42, 16, 58, 0.94)',
    border: '#c26eff',
  },
  darkNature: {
    id: 'darkNature',
    label: '暗系',
    icon: 'darkNature',
    color: '#cbb8ff',
    bg: 'rgba(28, 18, 52, 0.94)',
    border: '#8266d6',
  },
};

/** 提取单位当前需要展示在抬头名牌上的特殊生物类型 + 召唤来源 + 暗系微标（默认活体返回空数组） */
export function getUnitHeaderCreatureTags(
  unit: Pick<BattleUnit, 'abilities' | 'isIllusion' | 'isSummoned' | 'summonKind'>,
): SpecialCreatureTagMeta[] {
  const tags: SpecialCreatureTagMeta[] = [];
  if (unit.abilities.mechanical) tags.push(SPECIAL_CREATURE_TAG_META.mechanical);
  if (unit.abilities.undead) tags.push(SPECIAL_CREATURE_TAG_META.undead);
  if (unit.abilities.elemental) tags.push(SPECIAL_CREATURE_TAG_META.elemental);
  const sKind = resolveUnitSummonKind(unit);
  if (sKind === 'illusion') tags.push(SPECIAL_CREATURE_TAG_META.illusion);
  else if (sKind === 'summoned') tags.push(SPECIAL_CREATURE_TAG_META.summoned);
  else if (sKind === 'raised') tags.push(SPECIAL_CREATURE_TAG_META.raised);
  if (unit.abilities.darkNature) tags.push(SPECIAL_CREATURE_TAG_META.darkNature);
  return tags;
}

export interface SemanticTextToken {
  kind: 'plain' | 'alignment' | 'creatureType' | 'deltaPos' | 'deltaNeg';
  text: string;
  color?: string;
  icon?: string;
}

const ALIGNMENT_TERM_TO_ID: Record<string, Alignment> = {
  '生命·信仰': 'life',
  '信仰圣域': 'life',
  '生命魔法': 'life',
  '生命系': 'life',
  '秩序·幻月': 'order',
  '幻月庭园': 'order',
  '秩序魔法': 'order',
  '秩序系': 'order',
  '死亡·幽冥': 'death',
  '幽冥楼府': 'death',
  '死亡魔法': 'death',
  '死亡系': 'death',
  '混沌·魔导': 'chaos',
  '魔导结社': 'chaos',
  '混沌魔法': 'chaos',
  '混沌系': 'chaos',
  '自然·灵森': 'nature',
  '自然森境': 'nature',
  '自然魔法': 'nature',
  '自然系': 'nature',
  '力量·武艺': 'might',
  '武艺旧都': 'might',
  '反魔体术': 'might',
  '力量系': 'might',
};

const CREATURE_TERM_TO_TAG: Record<string, SpecialCreatureTagId> = {
  '器灵构造体': 'mechanical',
  '机械': 'mechanical',
  '不死': 'undead',
  '亡灵': 'undead',
  '元素': 'elemental',
  '幻象': 'illusion',
  '暗系': 'darkNature',
};

/**
 * 统一语义匹配正则（长词优先，并排除「不死鸟」「不死炽焰」避免误标骷髅图标）
 */
const SEMANTIC_TOKEN_RE =
  /(生命·信仰|秩序·幻月|死亡·幽冥|混沌·魔导|自然·灵森|力量·武艺|信仰圣域|幻月庭园|幽冥楼府|魔导结社|自然森境|武艺旧都|生命魔法|秩序魔法|死亡魔法|混沌魔法|自然魔法|反魔体术|生命系|秩序系|死亡系|混沌系|自然系|力量系|器灵构造体|机械|不死(?!鸟|炽焰)|亡灵|元素|幻象|暗系|[+-]\d+(?:\.\d+)?%?(?=[\s，。、；）)\]]|$))/g;

/** 将一段纯文本安全切分为带颜色与内联微标的语义 Token 数组 */
export function tokenizeSemanticText(text: string): SemanticTextToken[] {
  if (!text) return [];
  const tokens: SemanticTextToken[] = [];
  let lastIndex = 0;
  SEMANTIC_TOKEN_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SEMANTIC_TOKEN_RE.exec(text)) !== null) {
    const start = match.index;
    const raw = match[0];
    if (start > lastIndex) {
      tokens.push({ kind: 'plain', text: text.slice(lastIndex, start) });
    }

    const alignId = ALIGNMENT_TERM_TO_ID[raw];
    if (alignId) {
      tokens.push({
        kind: 'alignment',
        text: raw,
        color: ALIGNMENT_META[alignId].textColor,
      });
    } else {
      const cTagId = CREATURE_TERM_TO_TAG[raw];
      if (cTagId) {
        const meta = SPECIAL_CREATURE_TAG_META[cTagId];
        tokens.push({
          kind: 'creatureType',
          text: raw,
          color: meta.color,
          icon: meta.icon,
        });
      } else if (raw.startsWith('+')) {
        tokens.push({ kind: 'deltaPos', text: raw, color: '#84f0b8' });
      } else if (raw.startsWith('-')) {
        tokens.push({ kind: 'deltaNeg', text: raw, color: '#ff8c9e' });
      } else {
        tokens.push({ kind: 'plain', text: raw });
      }
    }

    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ kind: 'plain', text: text.slice(lastIndex) });
  }
  return tokens;
}

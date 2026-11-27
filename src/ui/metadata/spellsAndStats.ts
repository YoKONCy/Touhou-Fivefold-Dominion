/**
 * 法术图标映射、属性明细标签与法术/符卡悬浮提示构造器
 */

import { ALIGNMENT_META } from '@core/alignment';
import type { ComputedUnitStats, SpellCardDef, SpellDef, StatKey } from '@core/types';
import { formatSpellCardTitle } from '@data/h4Spells';
import { getSpellCardCopy, getSpellCopy } from '@data/spellCopy';
import {
  classifySpellCardPolarity,
  classifySpellPolarity,
  SPELL_POLARITY_META,
} from '@ui/semanticFormat';
import type { HudTooltipPayload } from './types';

/** 根据术式属性映射专属像素法术图标 ID（完整区分全部 142 个 HoMM4 术式类型） */
export function getSpellIconKey(spell: SpellDef): string {
  if (spell.isAdventureOnly || spell.targetType === 'adventure') return 'scouting';
  if (spell.specialEffect === 'summon_creature') return 'nature_magic';
  if (spell.specialEffect === 'raise_undead' || spell.specialEffect === 'animate_dead' || spell.specialEffect === 'death_call') {
    return 'death_magic';
  }
  if (spell.specialEffect === 'create_illusion' || spell.specialEffect === 'phantom_image' || spell.specialEffect === 'teleport') {
    return 'order_magic';
  }
  if (spell.reviveBase || spell.specialEffect === 'guardian_angel' || spell.specialEffect === 'divine_intervention') {
    return 'resurrection';
  }
  if (spell.healBase || spell.specialEffect === 'regeneration') return 'spell_heal';
  if (spell.targetType === 'hex_aoe' || spell.specialEffect === 'armageddon' || spell.specialEffect === 'fire_ring') {
    return 'spell_aoe';
  }
  if (spell.specialEffect === 'ward_single' || spell.specialEffect === 'ward_mass' || spell.specialEffect === 'heavenly_shield' || spell.specialEffect === 'sanctuary' || spell.specialEffect === 'anti_magic' || spell.id.includes('ward')) {
    return 'spell_ward';
  }
  if (spell.specialEffect === 'first_strike' || spell.specialEffect === 'cat_reflexes' || spell.id.includes('haste') || spell.id.includes('speed')) {
    return 'spell_haste';
  }
  if (spell.specialEffect === 'blind' || spell.specialEffect === 'confusion' || spell.specialEffect === 'song_of_peace' || spell.id.includes('slow')) {
    return 'spell_slow';
  }
  if (spell.debuffModifiers || spell.specialEffect === 'curse' || spell.specialEffect === 'poison' || spell.specialEffect === 'plague' || spell.specialEffect === 'berserk' || spell.specialEffect === 'hypnotize' || spell.id.includes('curse')) {
    return 'spell_curse';
  }
  if (spell.alignment === 'life') return 'spell_orb';
  if (spell.alignment === 'order') return 'order_magic';
  if (spell.alignment === 'death') return 'death_magic';
  if (spell.alignment === 'nature') return 'nature_magic';
  return 'spell_bolt';
}

export function statKeyLabel(key: StatKey): string {
  const map: Record<StatKey, string> = {
    attack: '攻击力',
    defense: '防御力',
    minDamage: '最小伤害',
    maxDamage: '最大伤害',
    maxHp: '生命上限',
    speed: '移动力',
    initiative: '先手主动',
    range: '远程射程',
    morale: '部队士气',
    luck: '战斗幸运',
    magicResistance: '魔法抗性',
    grazeChance: '擦弹减伤',
    spellPower: '法术强度',
    maxMana: '灵力上限',
  };
  return map[key] ?? key;
}

/** 构造单个属性方格的悬浮公式明细 */
export function buildStatCellTooltip(
  label: string,
  valueText: string,
  statKeys: StatKey[],
  stats: ComputedUnitStats,
  extraLines: string[] = [],
): HudTooltipPayload {
  const lines: string[] = [...extraLines];
  const seen = new Set<string>();
  for (const k of statKeys) {
    const items = stats.breakdowns[k];
    if (!items) continue;
    for (const it of items) {
      const tag = `${it.sourceName}:${it.deltaText}`;
      if (seen.has(tag)) continue;
      seen.add(tag);
      lines.push(`• ${it.sourceName}  ${it.deltaText}`);
    }
  }
  if (lines.length === 0) {
    lines.push('当前为基础面板数值，暂无额外修正。');
  }
  return {
    title: `${label}：${valueText}`,
    tag: '实时属性明细',
    accent: '#ffe484',
    lines,
  };
}

/** 将法术目标类型映射为简明中文标签 */
function spellTargetLabel(type: SpellDef['targetType']): string {
  switch (type) {
    case 'ally_unit':
      return '单体友军';
    case 'enemy_unit':
      return '单体敌军';
    case 'any_unit':
      return '任意单位';
    case 'hex_aoe':
      return '区域范围';
    case 'hex_empty':
      return '空地召唤';
    case 'unit_to_hex':
      return '目标至空地';
    case 'ally_to_ally':
      return '双友联动';
    case 'corpse_unit':
      return '战场残骸';
    case 'adventure':
      return '大地图术式';
    default:
      return '即刻施放';
  }
}

/** 构造统一精炼的法术三段式悬浮提示（阵营与极性彩色胶囊 + 简介 + 客观效果 + 可选斜体小字彩蛋，零冗余括号） */
export function buildSpellTooltipPayload(
  spell: SpellDef,
  opts: {
    effectiveManaCost?: number;
    currentMana?: number;
    effectiveRange?: number;
  } = {},
): HudTooltipPayload {
  const isAdv = Boolean(spell.isAdventureOnly || spell.targetType === 'adventure');
  const cost = opts.effectiveManaCost ?? spell.manaCost;
  const manaShort = !isAdv && opts.currentMana !== undefined && opts.currentMana < cost;
  const copy = getSpellCopy(spell);
  const align = ALIGNMENT_META[spell.alignment];
  const pol = SPELL_POLARITY_META[classifySpellPolarity(spell)];

  const effRange = opts.effectiveRange ?? spell.range;
  const hasHighlandRangeBoost = spell.range > 0 && effRange > spell.range;
  const subParts = [
    align.name,
    `Lv.${spell.level}`,
    spellTargetLabel(spell.targetType),
  ];
  if (spell.range > 0) {
    subParts.push(hasHighlandRangeBoost ? `${effRange}格(高台+50%)` : `${effRange}格`);
  }

  const lines = [copy.effect];
  if (hasHighlandRangeBoost) {
    lines.push(`站台高地增益：有效施法距离 +50%（${spell.range} → ${effRange} 格）。`);
  }

  return {
    title: formatSpellCardTitle(spell),
    subtitle: subParts.join(' · '),
    tag: isAdv ? '大地图' : `${cost} MP`,
    tagTone: isAdv ? 'muted' : manaShort ? 'danger' : 'default',
    accent: align.themeColor,
    badges: [
      {
        label: align.name,
        color: align.textColor,
        bg: 'rgba(22, 16, 26, 0.92)',
        border: align.themeColor,
      },
      {
        label: pol.label,
        icon: pol.icon,
        color: pol.color,
        bg: pol.bg,
        border: pol.border,
      },
    ],
    summary: copy.summary,
    lines,
    flavor: copy.flavor,
  };
}

/** 构造统一精炼的英雄专属符卡三段式悬浮提示 */
export function buildSpellCardTooltipPayload(
  card: SpellCardDef,
  opts: {
    currentMana?: number;
    currentCharge?: number;
  } = {},
): HudTooltipPayload {
  const copy = getSpellCardCopy(card);
  const align = ALIGNMENT_META[card.alignment];
  const pol = SPELL_POLARITY_META[classifySpellCardPolarity(card)];
  const ready =
    opts.currentMana !== undefined &&
    opts.currentCharge !== undefined &&
    opts.currentMana >= card.manaCost &&
    opts.currentCharge >= card.chargeCost;
  const chargeText = opts.currentCharge !== undefined ? `${opts.currentCharge}%` : `${card.chargeCost}%`;

  return {
    title: card.name,
    subtitle: `${align.name} · 专属符卡`,
    tag: `${card.manaCost} MP · ${chargeText}`,
    tagTone: opts.currentMana !== undefined && !ready ? 'muted' : 'default',
    accent: '#f5df9e',
    badges: [
      {
        label: align.name,
        color: align.textColor,
        bg: 'rgba(22, 16, 26, 0.92)',
        border: align.themeColor,
      },
      {
        label: `${pol.label}符卡`,
        icon: pol.icon,
        color: pol.color,
        bg: pol.bg,
        border: pol.border,
      },
    ],
    summary: copy.summary,
    lines: [copy.effect],
    flavor: copy.flavor,
  };
}

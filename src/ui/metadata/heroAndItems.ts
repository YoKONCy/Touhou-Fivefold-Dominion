/**
 * 英雄固有特质徽章与纸娃娃神器装备槽位构造器
 */

import { ALIGNMENT_META } from '@core/alignment';
import { HERO_TRAIT_REGISTRY } from '@core/traits';
import type { ArtifactDef, BattleUnit } from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { SPELL_POLARITY_META } from '@ui/semanticFormat';
import { SPEC_BADGE_UTILITY } from './specialties';
import { statKeyLabel } from './spellsAndStats';
import type { HudIconBadge, HudTooltipMiniBadge, HudTooltipPayload } from './types';

/** 构造英雄固有特质徽章列表 */
export function buildHeroTraitBadges(unit: BattleUnit): HudIconBadge[] {
  const am = ALIGNMENT_META[unit.alignment];
  return unit.innateTraitIds
    .map((id) => HERO_TRAIT_REGISTRY[id])
    .filter(Boolean)
    .map((tr) => ({
      id: `trait_${tr.id}`,
      icon: 'trait',
      polarity: 'positive' as const,
      shortLabel: tr.name.slice(0, 4),
      accent: '#f5df9e',
      bg: 'rgba(60, 20, 30, 0.95)',
      border: '#cfa75b',
      tooltip: {
        title: `固有特质 · ${tr.name}`,
        tag: '英雄专属',
        accent: '#f5df9e',
        badges: [
          { label: `${am.factionName} · ${am.name}`, color: am.textColor, bg: 'rgba(22, 16, 26, 0.92)', border: am.themeColor },
          SPEC_BADGE_UTILITY,
        ],
        lines: [tr.description],
      },
    }));
}

/** 英雄纸娃娃 5 大装备槽位快照 */
export function buildHeroEquipmentSlots(unit: BattleUnit): Array<{
  slot: ArtifactDef['slot'];
  slotName: string;
  icon: string;
  artifact: ArtifactDef | null;
  tooltip: HudTooltipPayload;
}> {
  const slotDefs: Array<{ slot: ArtifactDef['slot']; slotName: string; icon: string }> = [
    { slot: 'weapon', slotName: '主手', icon: 'art_weapon' },
    { slot: 'head', slotName: '头冠', icon: 'art_head' },
    { slot: 'armor', slotName: '护甲', icon: 'art_armor' },
    { slot: 'accessory', slotName: '饰品', icon: 'art_accessory' },
    { slot: 'ring', slotName: '指环', icon: 'art_ring' },
  ];

  const equipped = unit.equippedArtifactIds
    .map((id) => TOUHOU_CATALOG.artifacts[id])
    .filter(Boolean);

  return slotDefs.map((s) => {
    const art = equipped.find((a) => a.slot === s.slot) ?? null;
    if (!art) {
      return {
        ...s,
        artifact: null,
        tooltip: {
          title: `${s.slotName}装备槽`,
          tag: '未装备',
          accent: '#9aa6c4',
          lines: ['当前未佩戴该部位神器。'],
        },
      };
    }
    const modLines = art.modifiers.map((m) => {
      const val =
        m.mode === 'percent'
          ? `${m.value >= 0 ? '+' : ''}${Math.round(m.value * 100)}%`
          : `${m.value >= 0 ? '+' : ''}${m.value}`;
      return `• ${statKeyLabel(m.stat)} ${val}`;
    });
    const badges: HudTooltipMiniBadge[] = [
      {
        label: `${s.slotName}神器`,
        icon: s.icon,
        color: '#f5df9e',
        bg: 'rgba(46, 34, 16, 0.92)',
        border: '#a8843c',
      },
    ];
    if (art.setId) {
      badges.push({
        label: '套装部件',
        icon: SPELL_POLARITY_META.buff.icon,
        color: '#a6f0ff',
        bg: 'rgba(18, 42, 54, 0.92)',
        border: '#5fa8c4',
      });
    }
    return {
      ...s,
      artifact: art,
      tooltip: {
        title: art.name,
        subtitle: art.setId ? `隶属套装 · ${TOUHOU_CATALOG.artifactSets[art.setId]?.name ?? ''}` : `${s.slotName}装备`,
        tag: s.slotName,
        accent: '#ffe28a',
        badges,
        summary: art.description,
        lines: modLines,
      },
    };
  });
}

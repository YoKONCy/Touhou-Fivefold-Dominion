/**
 * 单位特技提示卡片顶部通用微标配色常量
 */

import { SPELL_POLARITY_META } from '@ui/semanticFormat';
import type { HudTooltipMiniBadge } from '../types';

export const SPEC_BADGE_OFFENSE: HudTooltipMiniBadge = {
  label: '进攻特技',
  icon: SPELL_POLARITY_META.damage.icon,
  color: SPELL_POLARITY_META.damage.color,
  bg: SPELL_POLARITY_META.damage.bg,
  border: SPELL_POLARITY_META.damage.border,
};

export const SPEC_BADGE_DEFENSE: HudTooltipMiniBadge = {
  label: '防御特技',
  icon: SPELL_POLARITY_META.buff.icon,
  color: SPELL_POLARITY_META.buff.color,
  bg: SPELL_POLARITY_META.buff.bg,
  border: SPELL_POLARITY_META.buff.border,
};

export const SPEC_BADGE_CONTROL: HudTooltipMiniBadge = {
  label: '控场特效',
  icon: SPELL_POLARITY_META.debuff.icon,
  color: SPELL_POLARITY_META.debuff.color,
  bg: SPELL_POLARITY_META.debuff.bg,
  border: SPELL_POLARITY_META.debuff.border,
};

export const SPEC_BADGE_UTILITY: HudTooltipMiniBadge = {
  label: '战术机动',
  icon: SPELL_POLARITY_META.utility.icon,
  color: SPELL_POLARITY_META.utility.color,
  bg: SPELL_POLARITY_META.utility.bg,
  border: SPELL_POLARITY_META.utility.border,
};

export const SPEC_BADGE_HEAL: HudTooltipMiniBadge = {
  label: '治愈神术',
  icon: SPELL_POLARITY_META.heal.icon,
  color: SPELL_POLARITY_META.heal.color,
  bg: SPELL_POLARITY_META.heal.bg,
  border: SPELL_POLARITY_META.heal.border,
};

export const SPEC_BADGE_LIMIT: HudTooltipMiniBadge = {
  label: '行动限制',
  icon: SPELL_POLARITY_META.debuff.icon,
  color: '#ff9aa8',
  bg: 'rgba(62, 18, 28, 0.92)',
  border: '#c74c5e',
};

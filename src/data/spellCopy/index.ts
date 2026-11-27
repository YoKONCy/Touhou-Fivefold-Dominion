/**
 * 全法术与专属符卡文案聚合索引（分派系模块导出）
 */

import type { SpellCardDef, SpellDef } from '@core/types';
import { CHAOS_SPELL_COPY } from './chaos';
import { DEATH_SPELL_COPY } from './death';
import { LIFE_SPELL_COPY } from './life';
import { NATURE_SPELL_COPY } from './nature';
import { ORDER_SPELL_COPY } from './order';
import { SPELL_CARD_COPY_CATALOG } from './spellCards';
import type { SpellCopyEntry } from './types';

export { CHAOS_SPELL_COPY } from './chaos';
export { DEATH_SPELL_COPY } from './death';
export { LIFE_SPELL_COPY } from './life';
export { NATURE_SPELL_COPY } from './nature';
export { ORDER_SPELL_COPY } from './order';
export { SPELL_CARD_COPY_CATALOG } from './spellCards';
export type { SpellCopyEntry } from './types';

/** 全部 148 个注册法术的三段式文案总表 */
export const SPELL_COPY_CATALOG: Record<string, SpellCopyEntry> = {
  ...LIFE_SPELL_COPY,
  ...ORDER_SPELL_COPY,
  ...DEATH_SPELL_COPY,
  ...CHAOS_SPELL_COPY,
  ...NATURE_SPELL_COPY,
};

/** 获取任意法术的标准三段式文案（优先取总表，兜底兼容内联字段） */
export function getSpellCopy(spell: SpellDef): SpellCopyEntry {
  const entry = SPELL_COPY_CATALOG[spell.id];
  if (entry) return entry;
  return {
    summary: spell.summary ?? spell.name,
    effect: spell.effect ?? spell.description,
    flavor: spell.flavor,
  };
}

/** 获取专属符卡的标准三段式文案 */
export function getSpellCardCopy(card: SpellCardDef): SpellCopyEntry {
  const entry = SPELL_CARD_COPY_CATALOG[card.id];
  if (entry) return entry;
  return {
    summary: card.summary ?? card.subtitle,
    effect: card.effect ?? card.description,
    flavor: card.flavor,
  };
}

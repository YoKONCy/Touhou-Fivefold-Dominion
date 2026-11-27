/**
 * 五系法术数据总汇（聚合生命 / 秩序 / 死亡 / 混沌 / 自然五系法术与召唤模板）
 */

import type { SpellDef } from '@core/types';
import { CHAOS_H4_SPELLS } from './chaos';
import { DEATH_H4_SPELLS } from './death';
import { LIFE_H4_SPELLS } from './life';
import { NATURE_H4_SPELLS } from './nature';
import { ORDER_H4_SPELLS } from './order';

export { CHAOS_H4_SPELLS } from './chaos';
export { DEATH_H4_SPELLS } from './death';
export { LIFE_H4_SPELLS } from './life';
export { NATURE_H4_SPELLS } from './nature';
export { ORDER_H4_SPELLS } from './order';
export { SPELL_CARDS, TOUHOU_EXTRA_SPELLS } from './signatureSpells';
export { H4_SUMMON_TEMPLATES } from './summonTemplates';

/** 全部 142 个 HoMM4 官方五系法术表（东方幻想乡双层符卡命名版） */
export const H4_SPELLS: Record<string, SpellDef> = {
  ...LIFE_H4_SPELLS,
  ...ORDER_H4_SPELLS,
  ...DEATH_H4_SPELLS,
  ...CHAOS_H4_SPELLS,
  ...NATURE_H4_SPELLS,
};

/** 格式化法术的东方双层符卡全称（如 结界「二重结界」，无前缀时回退为术名） */
export function formatSpellCardTitle(spell: SpellDef): string {
  return spell.spellCardPrefix ? `${spell.spellCardPrefix}「${spell.name}」` : spell.name;
}

/** 按五系与 1~5 阶排序的完整 142 个 H4 官方标准法术 ID 列表 */
export const ALL_H4_SPELL_IDS: string[] = Object.keys(H4_SPELLS);

/** 全部 137 个战斗可施放 H4 法术 ID 列表 */
export const ALL_H4_COMBAT_SPELL_IDS: string[] = ALL_H4_SPELL_IDS.filter(
  (id) => !H4_SPELLS[id].isAdventureOnly,
);

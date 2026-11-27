/**
 * 全部 150 个东方化 HoMM4 法术 VFX 编排总表聚合入口
 * 分派系编排模块位于 `./vfx/catalog/`（life / order / death / chaos / nature）。
 */

import { CHAOS_SPELL_VFX_CATALOG } from './vfx/catalog/chaos';
import { DEATH_SPELL_VFX_CATALOG } from './vfx/catalog/death';
import { LIFE_SPELL_VFX_CATALOG } from './vfx/catalog/life';
import { NATURE_SPELL_VFX_CATALOG } from './vfx/catalog/nature';
import { ORDER_SPELL_VFX_CATALOG } from './vfx/catalog/order';
import type { SpellVfxChoreography } from './vfx/catalog/types';

export { CHAOS_SPELL_VFX_CATALOG } from './vfx/catalog/chaos';
export { DEATH_SPELL_VFX_CATALOG } from './vfx/catalog/death';
export { LIFE_SPELL_VFX_CATALOG } from './vfx/catalog/life';
export { NATURE_SPELL_VFX_CATALOG } from './vfx/catalog/nature';
export { ORDER_SPELL_VFX_CATALOG } from './vfx/catalog/order';
export type { SpellTravelStyle, SpellVfxChoreography } from './vfx/catalog/types';

/** 全部 150 个术式一对一专属特效编排表 */
export const SPELL_VFX_CATALOG: Record<string, SpellVfxChoreography> = {
  ...LIFE_SPELL_VFX_CATALOG,
  ...ORDER_SPELL_VFX_CATALOG,
  ...DEATH_SPELL_VFX_CATALOG,
  ...CHAOS_SPELL_VFX_CATALOG,
  ...NATURE_SPELL_VFX_CATALOG,
};

export const ALL_SPELL_VFX_IDS: string[] = Object.keys(SPELL_VFX_CATALOG);

/** 获取指定法术 ID 的专属特效编排（兜底安全返回星矢编排） */
export function getSpellVfxChoreography(spellId: string): SpellVfxChoreography {
  return SPELL_VFX_CATALOG[spellId] ?? SPELL_VFX_CATALOG.chaos_magic_arrow;
}

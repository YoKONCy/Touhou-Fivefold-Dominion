/**
 * 148 个东方化 HoMM4 法术专属 24×24 像素图标统一调度与缓存中心
 *
 * 完整覆盖：
 * - 35 生命系 + 27 秩序系 + 25 死亡系 + 29 混沌系 + 32 自然系 = 148 个术式
 * - 懒加载离屏光栅化 + Map<string, string> DataURL 缓存，零重复渲染开销
 * - 提供纯内存像素哈希校验接口 computeSpellIconPixelHash()，供 Vitest 证明 148 术图标 100% 零重复撞脸！
 */

import { SPELLS } from '@data/definitions';
import {
  hashPixelBuffer,
  pixelsToDataUrl,
  rasterizeSpellIconPixels,
  type SpellIconDrawFn,
  type SpellIconRecipe,
} from './spellIconCore';
import { CHAOS_SPELL_ICON_DRAWERS } from './spellIconsChaos';
import { DEATH_SPELL_ICON_DRAWERS } from './spellIconsDeath';
import { LIFE_SPELL_ICON_DRAWERS } from './spellIconsLife';
import { NATURE_SPELL_ICON_DRAWERS } from './spellIconsNature';
import { ORDER_SPELL_ICON_DRAWERS } from './spellIconsOrder';

/** 全部 148 个术式的专属手绘绘制函数映射表 */
export const SPELL_ICON_DRAWERS: Record<string, SpellIconDrawFn> = {
  ...LIFE_SPELL_ICON_DRAWERS,
  ...ORDER_SPELL_ICON_DRAWERS,
  ...DEATH_SPELL_ICON_DRAWERS,
  ...CHAOS_SPELL_ICON_DRAWERS,
  ...NATURE_SPELL_ICON_DRAWERS,
};

export const ALL_SPELL_ICON_IDS: string[] = Object.keys(SPELL_ICON_DRAWERS);

const dataUrlCache = new Map<string, string>();
const pixelCache = new Map<string, Uint8ClampedArray>();

function buildSpellIconRecipe(spellId: string): SpellIconRecipe | null {
  const draw = SPELL_ICON_DRAWERS[spellId];
  const sp = SPELLS[spellId];
  if (!draw || !sp) return null;
  const isMass = Boolean(
    sp.massScope ||
      sp.specialEffect?.startsWith('mass_') ||
      sp.specialEffect === 'ward_mass' ||
      sp.specialEffect === 'divine_intervention' ||
      sp.specialEffect === 'armageddon' ||
      sp.specialEffect === 'steal_all_enchantments' ||
      sp.specialEffect === 'plague' ||
      sp.specialEffect === 'prayer' ||
      sp.specialEffect === 'holy_shout' ||
      sp.specialEffect === 'unholy_song' ||
      sp.specialEffect === 'life_drain',
  );
  return {
    meta: {
      alignment: sp.alignment,
      level: sp.level,
      isAdventure: Boolean(sp.isAdventureOnly || sp.targetType === 'adventure'),
      isMass,
    },
    draw,
  };
}

/** 获取指定法术 24×24 RGBA 像素数组（纯内存，不依赖 DOM） */
export function getSpellIconPixels(spellId: string): Uint8ClampedArray | null {
  const cached = pixelCache.get(spellId);
  if (cached) return cached;
  const recipe = buildSpellIconRecipe(spellId);
  if (!recipe) return null;
  const pixels = rasterizeSpellIconPixels(recipe);
  pixelCache.set(spellId, pixels);
  return pixels;
}

/** 计算指定法术图标的 64 位像素哈希（供单元测试严格断言 148 术图标 100% 互不相同） */
export function computeSpellIconPixelHash(spellId: string): string | null {
  const pixels = getSpellIconPixels(spellId);
  return pixels ? hashPixelBuffer(pixels) : null;
}

/** 获取指定法术的 24×24 精雕像素 PNG DataURL（自动缓存，供 Vue 组件直接 `<img :src>` 使用） */
export function getSpellIconDataUrl(spellId: string): string {
  const cached = dataUrlCache.get(spellId);
  if (cached) return cached;
  const pixels = getSpellIconPixels(spellId);
  if (!pixels) return '';
  const url = pixelsToDataUrl(pixels);
  if (url) dataUrlCache.set(spellId, url);
  return url;
}

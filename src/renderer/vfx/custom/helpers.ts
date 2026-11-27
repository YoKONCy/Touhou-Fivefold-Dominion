/**
 * 《Touhou-H4》自研东方纯净像素特效公共辅助工具
 *
 * 汇总全屏舞台尺寸常量、调色板安全解析、生命周期包络及常用透视符阵/星芒像素绘制原语，
 * 供 `src/renderer/vfx/custom/` 下各特效子模块复用。
 */

import { clamp, fit, mix, smooth, TAU, type PixelFxPainter } from 'pixelfx';

/** 全屏透明叠加天象特效的标准舞台宽度（像素） */
export const STAGE_W = 640;

/** 全屏透明叠加天象特效的标准舞台高度（像素） */
export const STAGE_H = 360;

/** 将调色板未知入参安全转为 0xAABBGGRR 颜色数组 */
export function resolveRamp(palette: unknown, count: number): number[] {
  const fallback = ['#291a08', '#8a5c14', '#d9a42e', '#ffe066', '#fff5b8', '#ffffff'];
  const src = Array.isArray(palette) && palette.length > 0 ? (palette as readonly (string | number)[]) : fallback;
  return fit(src, count);
}

/**
 * 计算生命周期自然淡入淡出包络（避免进场突兀闪现或退场硬切断）
 * 注：原 `touhouCustomFx.ts` 默认 `(0.24, 0.45)`，原 `touhouCustomFxExtra.ts` 默认 `(0.16, 0.38)`，
 * 各特效模块均显式传入 `fadeIn` 与 `fadeOut` 参数以确保包络曲线完全一致。
 */
export function lifeEnvelope(t: number, duration: number, fadeIn = 0.24, fadeOut = 0.45): number {
  const aIn = smooth(0, fadeIn, t);
  const aOut = 1 - smooth(Math.max(fadeIn, duration - fadeOut), duration, t);
  return clamp(aIn * aOut);
}

/** 绘制水平压扁的透视地面符阵椭圆环 */
export function drawPerspectiveRing(
  p: PixelFxPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  steps: number,
  spin: number,
  colMain: number,
  colBright: number,
  alpha: number,
  brightEvery = 4,
): void {
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * TAU + spin;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;
    p.dot(x, y, i % brightEvery === 0 ? colBright : colMain, alpha);
  }
}

/** 绘制精致小像素五角星 */
export function drawTinyStar(
  p: PixelFxPainter,
  x: number,
  y: number,
  r: number,
  rot: number,
  colOuter: number,
  colCore: number,
  alpha: number,
): void {
  for (let k = 0; k < 5; k++) {
    const a = rot + (k * TAU) / 5;
    p.line(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, colOuter, alpha);
  }
  p.dot(x, y, colCore, alpha);
  p.light(x, y, colOuter, 0.35 * alpha);
}

export { mix };

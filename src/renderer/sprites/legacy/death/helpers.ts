/**
 * 幽冥公馆 · 死亡系共享像素绘制辅助函数
 * 提供正圆、菱晶、少女头冠双鬓、非对称蝠翼与弯月斩击光弧等公共绘谱原语
 */

import type { PixelPainter } from '../../../voxelSprites';

/** 辅助绘制正圆（复用 PixelPainter.ellipse） */
export function drawCircle(
  p: PixelPainter,
  cx: number,
  cy: number,
  r: number,
  color: string,
  emissive = false,
): void {
  p.ellipse(cx, cy, r, r, color, emissive);
}

/** 辅助绘制精致菱晶（复用 PixelPainter.poly） */
export function drawDiamond(
  p: PixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  emissive = false,
): void {
  p.poly(
    [
      [cx, cy - ry],
      [cx + rx, cy],
      [cx, cy + ry],
      [cx - rx, cy],
    ],
    color,
    emissive,
  );
}

/** 标杆级少女柔和鹅蛋脸 + 自然细颈（严格对齐灵梦/退魔剑士比例） */
export function drawMaidenHead(
  p: PixelPainter,
  bx: number,
  headY: number,
  skin = '#ffe9dc',
  shadow = '#e5b69e',
): void {
  p.rect(bx - 1, headY + 4, 3, 3, shadow);
  p.ellipse(bx, headY, 5.3, 4.9, skin);
  p.hline(bx - 3, headY + 4, 7, shadow);
  p.px(bx - 4, headY + 3, shadow);
  p.px(bx + 4, headY + 3, shadow);
  p.hline(bx - 2, headY - 4, 4, '#fff7f0');
}

/** 标杆级圆润柔顺发冠 + 分缕空气刘海 + 天使环高光 */
export function drawMaidenCrown(
  p: PixelPainter,
  bx: number,
  headY: number,
  dark: string,
  mid: string,
  light: string,
  spec: string,
): void {
  p.ellipse(bx, headY - 4.3, 6.1, 3.5, dark);
  p.ellipse(bx, headY - 4.7, 5.1, 2.6, mid);
  p.hline(bx - 4, headY - 6, 8, light);
  p.hline(bx - 2, headY - 7, 4, spec);
  p.px(bx - 5, headY - 2, dark);
  p.px(bx - 3, headY - 2, mid);
  p.px(bx, headY - 2, dark);
  p.px(bx + 3, headY - 2, mid);
  p.px(bx + 5, headY - 2, dark);
}

/** 柔和包颊双鬓（修脸型、去方框感） */
export function drawMaidenLocks(
  p: PixelPainter,
  bx: number,
  headY: number,
  dark: string,
  light: string,
  lenLeft = 7,
  lenRight = 6,
): void {
  p.poly(
    [
      [bx - 6, headY - 3],
      [bx - 4, headY - 2],
      [bx - 5, headY + lenLeft],
      [bx - 7, headY + lenLeft - 2],
    ],
    dark,
  );
  p.vline(bx - 6, headY - 1, Math.max(2, lenLeft - 2), light);
  p.poly(
    [
      [bx + 4, headY - 2],
      [bx + 6, headY - 3],
      [bx + 7, headY + lenRight - 2],
      [bx + 5, headY + lenRight],
    ],
    dark,
  );
  p.vline(bx + 5, headY - 1, Math.max(2, lenRight - 2), light);
}

/** 绘制非对称 3/4 层次蝠翼（后翼大幅舒展，前翼略收形成立体纵深！） */
export function drawAsymBatWings(
  p: PixelPainter,
  bx: number,
  cy: number,
  leftSpan: number,
  rightSpan: number,
  height: number,
  flap: number,
  outer: string,
  inner: string,
  rib: string,
): void {
  // 左侧主翼（大展角，高对比扇形骨翼膜）
  p.poly(
    [
      [bx - 2, cy],
      [bx - leftSpan, cy - height + flap],
      [bx - Math.round(leftSpan * 0.94), cy + 1 + flap],
      [bx - Math.round(leftSpan * 0.65), cy - 1 + Math.round(flap * 0.6)],
      [bx - Math.round(leftSpan * 0.56), cy + 5 + Math.round(flap * 0.4)],
      [bx - Math.round(leftSpan * 0.32), cy + 2 + Math.round(flap * 0.3)],
      [bx - 2, cy + 5],
    ],
    outer,
  );
  p.poly(
    [
      [bx - 4, cy + 1],
      [bx - Math.round(leftSpan * 0.85), cy - Math.round(height * 0.72) + flap],
      [bx - Math.round(leftSpan * 0.62), cy + Math.round(flap * 0.5)],
      [bx - Math.round(leftSpan * 0.36), cy + 2 + Math.round(flap * 0.3)],
    ],
    inner,
  );
  p.line(bx - 2, cy, bx - leftSpan, cy - height + flap, rib, 1);
  p.line(
    bx - Math.round(leftSpan * 0.55),
    cy - Math.round(height * 0.52) + Math.round(flap * 0.6),
    bx - Math.round(leftSpan * 0.65),
    cy + 3 + Math.round(flap * 0.4),
    rib,
    1,
  );

  // 右侧远翼（略小略高，营造 3/4 立体层次）
  p.poly(
    [
      [bx + 3, cy - 1],
      [bx + rightSpan, cy - Math.round(height * 0.92) + flap],
      [bx + Math.round(rightSpan * 0.9), cy + 2 + flap],
      [bx + Math.round(rightSpan * 0.55), cy + Math.round(flap * 0.5)],
      [bx + Math.round(rightSpan * 0.38), cy + 4 + Math.round(flap * 0.3)],
      [bx + 3, cy + 4],
    ],
    outer,
  );
  p.poly(
    [
      [bx + 4, cy],
      [bx + Math.round(rightSpan * 0.8), cy - Math.round(height * 0.64) + flap],
      [bx + Math.round(rightSpan * 0.54), cy + Math.round(flap * 0.5)],
    ],
    inner,
  );
  p.line(bx + 3, cy - 1, bx + rightSpan, cy - Math.round(height * 0.92) + flap, rib, 1);
}

/** 绘制连续饱满的弯月斩击光弧（对标退魔剑士高质感剑气） */
export function drawSlashArc(
  p: PixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  aStart: number,
  aEnd: number,
  outerColor: string,
  innerColor: string,
): void {
  const segs = 10;
  for (let i = 0; i < segs; i++) {
    const a0 = aStart + (i / segs) * (aEnd - aStart);
    const a1 = aStart + ((i + 1) / segs) * (aEnd - aStart);
    const ox0 = Math.round(cx + Math.cos(a0) * rx);
    const oy0 = Math.round(cy + Math.sin(a0) * ry);
    const ox1 = Math.round(cx + Math.cos(a1) * rx);
    const oy1 = Math.round(cy + Math.sin(a1) * ry);
    const ix0 = Math.round(cx + Math.cos(a0) * (rx - 2));
    const iy0 = Math.round(cy + Math.sin(a0) * (ry - 2));
    const ix1 = Math.round(cx + Math.cos(a1) * (rx - 2));
    const iy1 = Math.round(cy + Math.sin(a1) * (ry - 2));
    const thick = i >= 2 && i <= 7 ? 2 : 1;
    p.line(ox0, oy0, ox1, oy1, outerColor, thick, true);
    p.line(ix0, iy0, ix1, iy1, i >= 3 && i <= 7 ? '#ffffff' : innerColor, 1, true);
  }
}

/**
 * 幻月庭园 · 秩序系共享像素绘制辅助函数
 * 提供精致少女脸庞、发冠与包颊双鬓绘谱原语
 */

import type { PixelPainter } from '../../../voxelSprites';

/** 标杆级少女柔和鹅蛋脸 + 下颌暖影 + 俏丽腮红 */
export function drawRefinedFace(p: PixelPainter, bx: number, headY: number): void {
  p.rect(bx - 1, headY + 4, 3, 2, '#deb099');
  p.ellipse(bx, headY, 5.4, 5.0, '#ffe9dc');
  p.hline(bx - 3, headY + 4, 7, '#edbda6');
  p.px(bx - 4, headY + 3, '#f2c5b0');
  p.px(bx + 4, headY + 3, '#f2c5b0');
  p.hline(bx - 2, headY - 4, 4, '#fff5ed');
  p.hline(bx - 4, headY + 2, 2, '#ffa6bc');
  p.hline(bx + 4, headY + 2, 2, '#ffa6bc');
}

/** 标杆级圆润柔顺发冠 + 分缕自然刘海 + 天使环高光 */
export function drawRefinedHairCrown(
  p: PixelPainter,
  bx: number,
  headY: number,
  dark: string,
  mid: string,
  light: string,
  spec: string,
): void {
  p.ellipse(bx, headY - 4.3, 6.2, 3.5, dark);
  p.ellipse(bx, headY - 4.7, 5.2, 2.6, mid);
  p.hline(bx - 4, headY - 6, 8, light);
  p.hline(bx - 2, headY - 7, 4, spec);
  p.px(bx - 5, headY - 2, dark);
  p.px(bx - 3, headY - 2, mid);
  p.px(bx, headY - 2, dark);
  p.px(bx + 3, headY - 2, mid);
  p.px(bx + 5, headY - 2, dark);
}

/** 柔和包颊双鬓（自然修饰脸型轮廓） */
export function drawSoftSideLocks(
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

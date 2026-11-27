/**
 * 标准分辨率阵营精灵共享少女头冠与脸部底绘辅助函数
 * 供博丽·生命系与魔法使·混沌系蓝图复用
 */

import type { PixelPainter } from '../../voxelSprites';

/** 通用精致少女脸庞与细颈底绘（标准 5.4×5.0 柔和鹅蛋脸 + 下颌暖影） */
export function drawAnimeHeadBase(p: PixelPainter, bx: number, headY: number): void {
  p.rect(bx - 1, headY + 4, 3, 3, '#e0ac92');
  p.ellipse(bx, headY, 5.4, 5.0, '#ffe9d9');
  p.hline(bx - 3, headY + 4, 7, '#ebb99d');
  p.px(bx - 4, headY + 3, '#f2c5aa');
  p.px(bx + 4, headY + 3, '#f2c5aa');
  p.hline(bx - 2, headY - 4, 4, '#fff4eb');
}

/** 通用柔顺圆顶少女发冠（彻底替代生硬方盒，呈现流畅日系像素弧顶与天使环高光） */
export function drawSoftHairCrown(
  p: PixelPainter,
  bx: number,
  headY: number,
  dark: string,
  mid: string,
  light: string,
  spec: string,
): void {
  p.ellipse(bx, headY - 4.4, 6.2, 3.6, dark);
  p.ellipse(bx, headY - 4.8, 5.2, 2.7, mid);
  p.hline(bx - 4, headY - 6, 8, light);
  p.hline(bx - 2, headY - 7, 4, spec);
  // 轻盈自然分缕刘海（绝不遮盖眼睫毛！）
  p.px(bx - 5, headY - 2, dark);
  p.px(bx - 3, headY - 2, mid);
  p.px(bx, headY - 2, dark);
  p.px(bx + 3, headY - 2, mid);
  p.px(bx + 5, headY - 2, dark);
}

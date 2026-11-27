/**
 * 秩序阵营 HD 像素精灵共享基础配置与通用绘制辅助函数。
 */

import {
  HD_ORIGIN_X,
  HD_ORIGIN_Y,
  HD_RENDER_SCALE,
  HD_SPRITE_HEIGHT,
  HD_SPRITE_WIDTH,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';

/** 秩序阵营 64×72 像素绘谱基础画布配置 */
export const HD_BASE = {
  width: HD_SPRITE_WIDTH,
  height: HD_SPRITE_HEIGHT,
  originX: HD_ORIGIN_X,
  originY: HD_ORIGIN_Y,
  renderScale: HD_RENDER_SCALE,
  avatarCrop: { x: 14, y: 5, size: 36 },
  portraitCrop: { x: 4, y: 3, w: 56, h: 64 },
  draw: () => {},
} as const;

/** 绘制环握武器柄的正面上层 3×2 娇小玉手（杜绝握柄穿手！） */
export function drawWrappedHand(
  p: HdPixelPainter,
  gx: number,
  gy: number,
  skin = '#ffe6dc',
  hi = '#fff7f2',
  sh = '#e8b3ad',
): void {
  p.setPart(SPRITE_PART.WEAPON);
  p.rect(gx - 1, gy - 1, 3, 2, skin);
  p.hline(gx - 1, gy - 1, 2, hi);
  p.hline(gx - 1, gy + 1, 2, sh);
}

/**
 * 真·镂空鎏金/星银环（内部 100% 透明不画实心暗片，彻底避免地图上的“黑圆贴片”！）
 */
export function drawHollowRing64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  innerRatio: number,
  outerCol: string,
  midCol: string,
  hiCol: string,
  emissive = true,
): void {
  const limX = Math.ceil(rx) + 1;
  const limY = Math.ceil(ry) + 1;
  for (let dy = -limY; dy <= limY; dy++) {
    for (let dx = -limX; dx <= limX; dx++) {
      const d = Math.hypot(dx / rx, dy / ry);
      if (d <= 1.0 && d >= innerRatio) {
        const isTopLeft = dx + dy < -rx * 0.35;
        const isOuterEdge = d > 1.0 - (1.0 - innerRatio) * 0.32;
        const col = isTopLeft ? hiCol : isOuterEdge ? outerCol : midCol;
        p.px(cx + dx, cy + dy, col, emissive);
      }
    }
  }
}

/**
 * 东方萌系雪白毛茸茸长兔耳（支持双立耳或左折右立，内衬柔美樱花粉与光泽高光！）
 */
export function drawFluffyBunnyEars64(
  p: HdPixelPainter,
  bx: number,
  topY: number,
  opts: {
    earTilt: number;
    leftFolded?: boolean;
    earLen?: number;
    outerShade?: string;
    outerLight?: string;
    innerPink?: string;
    innerLight?: string;
  },
): void {
  const tilt = opts.earTilt;
  const len = opts.earLen ?? 14;
  const shade = opts.outerShade ?? '#d4ddf0';
  const white = opts.outerLight ?? '#ffffff';
  const pink = opts.innerPink ?? '#ff8cb5';
  const pinkHi = opts.innerLight ?? '#ffc4da';

  p.setPart(SPRITE_PART.HEADWEAR);

  // 左耳（靠后侧，可选俏皮半折垂尖）
  if (opts.leftFolded) {
    // 根部竖起
    p.poly(
      [
        [bx - 7, topY + 2],
        [bx - 10 + tilt * 0.5, topY - Math.round(len * 0.65)],
        [bx - 5 + tilt * 0.5, topY - Math.round(len * 0.72)],
        [bx - 2, topY + 2],
      ],
      shade,
    );
    p.poly(
      [
        [bx - 6, topY + 1],
        [bx - 9 + tilt * 0.5, topY - Math.round(len * 0.6)],
        [bx - 6 + tilt * 0.5, topY - Math.round(len * 0.66)],
        [bx - 3, topY + 1],
      ],
      white,
    );
    // 俏皮向左外折的毛茸茸耳尖
    const foldX = bx - 10 + Math.round(tilt * 0.6);
    const foldY = topY - Math.round(len * 0.65);
    p.poly(
      [
        [foldX + 4, foldY - 1],
        [foldX - 7, foldY + 4],
        [foldX - 5, foldY + 8],
        [foldX + 2, foldY + 3],
      ],
      shade,
    );
    p.poly(
      [
        [foldX + 3, foldY],
        [foldX - 6, foldY + 4],
        [foldX - 4, foldY + 7],
        [foldX + 1, foldY + 2],
      ],
      white,
    );
    p.line(bx - 5, topY, foldX + 1, foldY + 2, pink, 2);
    p.px(foldX - 3, foldY + 5, pinkHi);
  } else {
    p.poly(
      [
        [bx - 7, topY + 2],
        [bx - 11 + tilt, topY - len],
        [bx - 6 + tilt, topY - len - 1],
        [bx - 2, topY + 2],
      ],
      shade,
    );
    p.poly(
      [
        [bx - 6, topY + 1],
        [bx - 10 + tilt, topY - len + 1],
        [bx - 7 + tilt, topY - len],
        [bx - 3, topY + 1],
      ],
      white,
    );
    p.ellipse(bx - 8.5 + tilt, topY - len, 2.3, 2.1, white);
    p.poly(
      [
        [bx - 6, topY + 1],
        [bx - 9 + tilt, topY - len + 3],
        [bx - 7 + tilt, topY - len + 2],
        [bx - 4, topY + 1],
      ],
      pink,
    );
    p.px(bx - 8 + tilt, topY - len + 4, pinkHi);
  }

  // 右耳（高耸挺立，受光雪白饱满！）
  p.poly(
    [
      [bx + 2, topY + 2],
      [bx + 5 + tilt, topY - len - 1],
      [bx + 10 + tilt, topY - len],
      [bx + 7, topY + 2],
    ],
    shade,
  );
  p.poly(
    [
      [bx + 3, topY + 1],
      [bx + 6 + tilt, topY - len],
      [bx + 9 + tilt, topY - len + 1],
      [bx + 6, topY + 1],
    ],
    white,
  );
  p.ellipse(bx + 7.5 + tilt, topY - len, 2.4, 2.2, white);
  p.poly(
    [
      [bx + 4, topY + 1],
      [bx + 6 + tilt, topY - len + 3],
      [bx + 8 + tilt, topY - len + 3],
      [bx + 6, topY + 1],
    ],
    pink,
  );
  p.px(bx + 7 + tilt, topY - len + 4, pinkHi);
}

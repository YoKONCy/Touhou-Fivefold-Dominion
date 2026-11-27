/**
 * 混沌阵营 HD 像素精灵共享常量与绘图辅助函数
 * 提供通用精灵基础配置、武器握持手部绘制、镂空光环、闪耀星芒及迷你八卦炉印章等共用能力。
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

/** 混沌阵营 64×72 HD 像素精灵通用基础配置 */
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
  skin = '#ffe2d1',
  hi = '#fff5ee',
  sh = '#e6ae9e',
): void {
  p.setPart(SPRITE_PART.WEAPON);
  p.rect(gx - 1, gy - 1, 3, 2, skin);
  p.hline(gx - 1, gy - 1, 2, hi);
  p.hline(gx - 1, gy + 1, 2, sh);
}

/**
 * 真·镂空鎏金/魔紫光环（内部 100% 透明绝不画实心暗饼！）
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

/** 绘制精致四角闪耀星芒（用于魔理沙极限火花、星火扫帚与魔导星辉） */
export function drawSparkStar64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  radius: number,
  outerCol: string,
  coreCol = '#ffffff',
): void {
  p.setPart(SPRITE_PART.GLOW_FX);
  if (radius >= 2) {
    p.hline(cx - radius, cy, radius * 2 + 1, outerCol, true);
    p.vline(cx, cy - radius, radius * 2 + 1, outerCol, true);
  }
  p.px(cx, cy, coreCol, true);
  if (radius >= 3) {
    p.px(cx - 1, cy - 1, outerCol, true);
    p.px(cx + 1, cy - 1, outerCol, true);
    p.px(cx - 1, cy + 1, outerCol, true);
    p.px(cx + 1, cy + 1, outerCol, true);
  }
}

/**
 * 东方正统 15×15 精雕正八边形「迷你八卦炉 (Mini-Hakkero)」像素印章
 * - 清晰平直正八边黑铁鎏金炉框 + 八方亮金八卦卦象刻纹 + 中心阴阳太极核（攻击态炽燃白金星焰！）
 */
export function drawMiniHakkero64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  mode: 'idle' | 'charge' | 'fire',
): void {
  const ox = Math.round(cx - 7);
  const oy = Math.round(cy - 7);

  // 严格 15×15 对称正八边形：四正边长 7px、四斜切 45° 清晰利落，八方均带闪耀金卦刻纹！
  const rows =
    mode === 'idle'
      ? [
          '....HHHGGGG....',
          '...HkkkkkkkG...',
          '..HkttktkttkG..',
          '.HktkgHHHggktG.',
          'HktkgkWWWkggtkG',
          'HkkgkWWBWWkgkkG',
          'HktgWWWWBBBgktG',
          'HktgWWWBBBBgktG',
          'HktgWWBBBBBgktG',
          'HkkgkBBWBBkgkkG',
          'HktkgkBBBkggtkG',
          '.Gktkgggggkktd.',
          '..Gkttktkttkd..',
          '...Gkkkkkkkd...',
          '....GGddddd....',
        ]
      : [
          '....HHHGGGG....',
          '...HkkkkkkkG...',
          '..HkttktkttkG..',
          '.HktkgHHHggktG.',
          'HktkgkFFOkggtkG',
          'HkkgkOYYYOkgkkG',
          'HktgFYYWYYFgktG',
          'HktgOYWWWYOgktG',
          'HktgFYYWYYFgktG',
          'HkkgkOYYYOkgkkG',
          'HktkgkFFOkggtkG',
          '.Gktkgggggkktd.',
          '..Gkttktkttkd..',
          '...Gkkkkkkkd...',
          '....GGddddd....',
        ];

  const palette: Record<string, string> = {
    H: '#fff5b8', // 左上受光亮金框
    G: '#e6b235', // 鎏金正框
    d: '#a66e17', // 右下古金暗框
    k: '#221d38', // 玄铁黑炉体
    t: '#ffe866', // 八方发光八卦金刻纹
    g: '#f5c84c', // 内圆金环
    W: '#ffffff', // 太极阳鱼纯白 / 炽白焰芯
    B: '#151026', // 太极阴鱼玄黑
    F: '#ff4d24', // 充能炽红魔焰
    O: '#ff9c24', // 充能烈橙魔焰
    Y: '#fff078', // 充能亮金魔焰
  };

  const emissiveKeys = new Set(mode === 'idle' ? ['t', 'H'] : ['t', 'H', 'F', 'O', 'Y', 'W']);
  p.setPart(SPRITE_PART.WEAPON);
  p.stamp(ox, oy, rows, palette, emissiveKeys);
}

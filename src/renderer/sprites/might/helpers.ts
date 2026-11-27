/**
 * 武艺旧都 · 力量阵营 HD 像素精灵共享常量与精雕辅助工具集
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

export const HD_MIGHT_BASE = {
  width: HD_SPRITE_WIDTH,
  height: HD_SPRITE_HEIGHT,
  originX: HD_ORIGIN_X,
  originY: HD_ORIGIN_Y,
  renderScale: HD_RENDER_SCALE,
  avatarCrop: { x: 14, y: 5, size: 36 },
  portraitCrop: { x: 3, y: 2, w: 58, h: 66 },
  draw: () => {},
} as const;

/** 绘制带自然弧度、明暗体积与横纹刻度的立体鬼角 */
export function drawOniHorn64(
  p: HdPixelPainter,
  baseX: number,
  baseY: number,
  ctrlX: number,
  ctrlY: number,
  tipX: number,
  tipY: number,
  opts?: {
    baseWidth?: number;
    shadowColor?: string;
    mainColor?: string;
    hiColor?: string;
    ringColor?: string;
  },
): void {
  const bw = opts?.baseWidth ?? 3.6;
  const shadowColor = opts?.shadowColor ?? '#6e1018';
  const mainColor = opts?.mainColor ?? '#d92838';
  const hiColor = opts?.hiColor ?? '#ff9a85';
  const ringColor = opts?.ringColor ?? '#ffe478';

  p.setPart(SPRITE_PART.HEADWEAR);
  p.bezierRibbon([baseX, baseY], [ctrlX, ctrlY], [tipX, tipY], bw, 0.9, shadowColor);
  p.bezierRibbon(
    [baseX + (tipX >= baseX ? 0.5 : -0.5), baseY - 0.5],
    [ctrlX + (tipX >= baseX ? 0.4 : -0.4), ctrlY - 0.5],
    [tipX, tipY],
    Math.max(1.4, bw * 0.62),
    0.7,
    mainColor,
  );
  p.bezierRibbon(
    [baseX, baseY - 1],
    [ctrlX, ctrlY - 1],
    [tipX, tipY],
    Math.max(0.8, bw * 0.28),
    0.5,
    hiColor,
  );
  // 鬼角根部精致金环束圈
  p.line(baseX - 1.5, baseY + 0.5, baseX + 1.5, baseY + 0.5, ringColor, 1);
  p.px(tipX, tipY, '#fff8d6', true);
}

/** 绘制立体一环扣一环的玄铁锁链（冷钢蓝高光，支持自然垂弧） */
export function drawIronChain64(
  p: HdPixelPainter,
  points: ReadonlyArray<[number, number]>,
  part: (typeof SPRITE_PART)[keyof typeof SPRITE_PART] = SPRITE_PART.WEAPON,
): void {
  p.setPart(part);
  for (let i = 0; i < points.length; i++) {
    const [cx, cy] = points[i];
    const vertical = i % 2 === 0;
    const rx = vertical ? 1.8 : 2.3;
    const ry = vertical ? 2.4 : 1.7;
    p.ellipse(cx, cy, rx, ry, '#232a3d');
    p.ellipse(cx, cy, Math.max(0.8, rx - 0.7), Math.max(0.8, ry - 0.7), '#667599');
    p.px(cx, cy, '#121624');
    p.px(cx - 1, cy - 1, '#dbe6ff');
  }
}

/** 绘制星熊勇仪招牌大号三足朱漆金边「星熊杯」（一滴不洒的金澄美酒 + 波光酒香） */
export function drawSakeDish64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  glowing = false,
  phase = 0,
): void {
  p.setPart(SPRITE_PART.WEAPON);
  // 三足朱漆承脚与黑漆底座阴影
  p.rect(cx - 5, cy + 2, 2, 3, '#470a12');
  p.rect(cx - 1, cy + 3, 2, 3, '#630e19');
  p.rect(cx + 3, cy + 2, 2, 3, '#470a12');
  p.px(cx - 5, cy + 4, '#d99e30');
  p.px(cx, cy + 5, '#ffe078');
  p.px(cx + 4, cy + 4, '#d99e30');

  // 宽阔大酒盏外廓（深漆红阴影 + 亮朱红杯壁 + 鎏金雕边）
  p.ellipse(cx, cy + 1.4, 7.6, 3.0, '#590b16');
  p.ellipse(cx, cy + 0.5, 7.2, 2.5, '#c91e32');
  p.ellipse(cx, cy - 0.2, 6.8, 2.1, '#f24150');
  p.hline(cx - 5, cy + 2, 10, '#f0be4d');

  // 盈满杯口的澄黄金酒（绝不洒出，闪耀温润酒光！）
  p.ellipse(cx, cy - 0.5, 5.4, 1.5, '#d98c1c');
  p.ellipse(cx, cy - 0.8, 4.6, 1.1, glowing ? '#fff8bd' : '#ffdc6b', glowing);
  p.hline(cx - 3, cy - 1, 5, '#ffffff', glowing);

  // 柔和上扬酒气微光星屑
  p.setPart(SPRITE_PART.GLOW_FX);
  const drift = Math.round(Math.sin(phase) * 1.2);
  p.px(cx - 3 + drift, cy - 3, glowing ? '#fff8bd' : '#ffe685', true);
  p.px(cx + 2 - drift, cy - 4, glowing ? '#ffffff' : '#ffd166', true);
  if (glowing) {
    drawSparkStar64(p, cx, cy - 6, 2, '#fff5a6');
  }
}

/** 绘制精致 4 芒星闪光（用于刀锋、星饰、雷芒、酒光焦点点缀） */
export function drawSparkStar64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  p.setPart(SPRITE_PART.GLOW_FX);
  for (let d = -radius; d <= radius; d++) {
    p.px(cx + d, cy, d === 0 ? '#ffffff' : color, true);
    p.px(cx, cy + d, d === 0 ? '#ffffff' : color, true);
  }
}

/** 绘制真·镂空发光法环（供红祭司背后血祭战轮、勇仪蓄力气旋使用） */
export function drawHollowRing64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  innerRatio: number,
  outerColor: string,
  innerColor: string,
  glintColor: string,
  part: (typeof SPRITE_PART)[keyof typeof SPRITE_PART] = SPRITE_PART.GLOW_FX,
  emissive = true,
): void {
  p.setPart(part);
  const xMin = Math.max(1, Math.floor(cx - rx - 1));
  const xMax = Math.min(62, Math.ceil(cx + rx + 1));
  const yMin = Math.max(1, Math.floor(cy - ry - 1));
  const yMax = Math.min(70, Math.ceil(cy + ry + 1));
  const rInnerSq = innerRatio * innerRatio;
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d2 = dx * dx + dy * dy;
      if (d2 <= 1.0 && d2 >= rInnerSq) {
        const edge = d2 > 0.88 ? outerColor : dy < -0.35 ? glintColor : innerColor;
        p.px(x, y, edge, emissive);
      }
    }
  }
}

/** 绘制纤细锋锐的多折冰青白雷电细弧（1px 锐利电流 + 关键节点微光，绝不糊脸！） */
export function drawFineLightning64(
  p: HdPixelPainter,
  points: ReadonlyArray<[number, number]>,
  outerColor = '#5ce6ff',
  coreColor = '#ffffff',
): void {
  p.setPart(SPRITE_PART.GLOW_FX);
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    p.line(x1, y1, x2, y2, outerColor, 1, true);
    // 每段中点点缀炽白核心高光
    const mx = Math.round((x1 + x2) * 0.5);
    const my = Math.round((y1 + y2) * 0.5);
    p.px(mx, my, coreColor, true);
  }
  if (points.length > 0) {
    const [sx, sy] = points[0];
    const [ex, ey] = points[points.length - 1];
    p.px(sx, sy, coreColor, true);
    p.px(ex, ey, coreColor, true);
  }
}

/** 绘制立体包裹握拳/手铠（防止细线手臂戳穿武器柄） */
export function drawWrappedHand64(
  p: HdPixelPainter,
  x: number,
  y: number,
  shade: string,
  main: string,
  hi: string,
): void {
  p.setPart(SPRITE_PART.FRONT_ARM);
  p.ellipse(x, y, 2.3, 2.1, shade);
  p.ellipse(x, y - 0.4, 1.7, 1.5, main);
  p.px(x - 1, y - 1, hi);
}

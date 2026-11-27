/**
 * 幽冥公馆 · 死亡阵营 HD 像素精灵共享常量与通用绘制辅助函数
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
import type { RigPose } from '../../voxelSprites';

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

/** 绘制环握武器柄的正面上层 3×2 娇小玉手 */
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

/** 飞行少女悬空轻收微屈的娇小双腿（飞行扑翅时不再踏步走路，轻盈后收！） */
export function drawFlyingTuckedLegs64(
  p: HdPixelPainter,
  cx: number,
  topY: number,
  by: number,
  opts: {
    sockShadow: string;
    sockLight: string;
    shoeDark: string;
    shoeMain: string;
    shoeHighlight?: string;
    skinColor?: string;
  },
): void {
  p.setPart(SPRITE_PART.LEGS);
  const drawTucked = (lx: number, fy: number, isFront: boolean) => {
    const sockCol = isFront ? opts.sockLight : opts.sockShadow;
    // 向后微屈斜收的纤细小腿
    p.line(lx + 1, topY + by, lx - 2, fy + by - 3, sockCol, 3);
    if (opts.skinColor) {
      p.rect(lx, topY + by, 3, 2, opts.skinColor);
    }
    p.line(lx + 1, topY + by + 1, lx - 1, fy + by - 4, isFront ? '#ffffff' : opts.sockLight, 1);
    // 尖尖朝右下方轻垂的小皮鞋
    p.rect(lx - 4, fy + by - 3, 6, 3, opts.shoeDark);
    p.rect(lx - 3, fy + by - 3, 5, 2, isFront ? opts.shoeMain : opts.shoeDark);
    if (opts.shoeHighlight) {
      p.px(lx, fy + by - 3, opts.shoeHighlight);
    }
  };
  drawTucked(cx - 5, 60, false);
  drawTucked(cx + 2, 62, true);
}

/**
 * 血族眷属专属 move 变身形态：化身华丽「猩红大血蝠」4 帧扑翅疾掠 + 双迷你小血蝠与绯红血雾尾迹！
 */
export function drawCrimsonVampireBatFlight64(p: HdPixelPainter, pose: RigPose): void {
  const f = pose.frame % 4;
  // 4 帧经典吸血鬼血蝠扑翅物理节奏：0高举蓄力 → 1全力下拍压风 → 2贴风低掠滑翔 → 3回扬振翅
  const wingLift = [-15, 13, 2, -8][f];
  const wingSpan = [23, 25, 27, 24][f];
  const bobY = [-3, 3, 0, -2][f];
  const cx = 34;
  const cy = 35 + bobY;

  // [1] 绯红血雾流光尾迹 + 2 只错拍跟随的迷你猩红小血蝠
  p.setPart(SPRITE_PART.GLOW_FX);
  const trailShift = [0, 2, 4, 2][f];
  p.bezierRibbon([cx - 8, cy + 2], [cx - 18, cy + 3 + (f % 2 === 0 ? -2 : 2)], [6 + trailShift, cy + 5], 4.2, 0.8, '#8c0c2b', true);
  p.bezierRibbon([cx - 10, cy + 1], [cx - 18, cy + 2], [10 + trailShift, cy + 4], 1.8, 0.5, '#ff4070', true);
  p.px(12 + trailShift, cy - 3, '#ff6e94', true);
  p.px(17, cy + 8, '#ff3366', true);
  p.px(9, cy + 1, '#ffd4e2', true);

  // 2 只随行迷你暗红小血蝠（错拍上下扇翅，呼应血族蝠群疾掠！）
  const drawEscortBat = (bx: number, by: number, bFlap: number) => {
    p.setPart(SPRITE_PART.BACK_ACC);
    p.poly([[bx, by], [bx - 6, by - 4 + bFlap], [bx - 4, by + 2]], '#59081e');
    p.poly([[bx, by], [bx + 5, by - 4 + bFlap], [bx + 4, by + 2]], '#7d0d2c');
    p.line(bx - 6, by - 4 + bFlap, bx, by, '#ff3366', 1);
    p.line(bx + 5, by - 4 + bFlap, bx, by, '#ff4d7a', 1);
    p.ellipse(bx, by, 2.2, 1.8, '#9e1138');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx + 1, by - 1, '#ffdfe8', true);
  };
  drawEscortBat(13, cy - 11 + (f % 2 === 0 ? -2 : 2), f % 2 === 0 ? 4 : -4);
  drawEscortBat(15, cy + 14 + (f % 2 === 0 ? 2 : -2), f % 2 === 0 ? -4 : 4);

  // [2] 猩红巨血蝠左右宽阔恶魔蝠翼（4 帧大振幅扑扇，翼骨明晰、血膜饱满！）
  p.setPart(SPRITE_PART.BACK_ACC);
  const drawBatWing = (dir: -1 | 1, span: number, lift: number) => {
    const shX = cx + dir * 3;
    const shY = cy;
    const elbowX = cx + dir * Math.round(span * 0.52);
    const elbowY = cy - 4 + Math.round(lift * 0.65);
    const tipX = Math.max(4, Math.min(60, cx + dir * span));
    const tipY = cy + lift;
    const lobe1X = cx + dir * Math.round(span * 0.74);
    const lobe1Y = cy + Math.round(lift * 0.58) + 8;
    const lobe2X = cx + dir * Math.round(span * 0.42);
    const lobe2Y = cy + Math.round(lift * 0.3) + 10;

    // 暗绯黑红底层大蝠翼剪影（经典 3 拱蝙蝠凹弧！）
    p.poly(
      [
        [shX, shY - 2],
        [elbowX, elbowY],
        [tipX, tipY],
        [Math.round((tipX + lobe1X) * 0.5) - dir * 2, Math.round((tipY + lobe1Y) * 0.5) - 2],
        [lobe1X, lobe1Y],
        [Math.round((lobe1X + lobe2X) * 0.5) - dir * 1, Math.round((lobe1Y + lobe2Y) * 0.5) - 2],
        [lobe2X, lobe2Y],
        [shX, shY + 5],
      ],
      '#360619',
    );
    // 浓郁鲜红翼膜主面
    p.poly(
      [
        [shX + dir * 1, shY],
        [elbowX, elbowY + 2],
        [tipX - dir * 2, tipY + 1],
        [lobe1X - dir * 1, lobe1Y - 2],
        [lobe2X, lobe2Y - 2],
      ],
      '#a81139',
    );
    // 受光璀璨亮玫红膜面
    p.poly(
      [
        [shX + dir * 2, shY],
        [elbowX, elbowY + 2],
        [Math.round((elbowX + tipX) * 0.55), Math.round((elbowY + tipY) * 0.55) + 2],
        [lobe2X + dir * 1, lobe2Y - 4],
      ],
      '#eb2a5b',
    );
    // 清晰黑曜翼骨梁 + 放射指骨 + 翼弯金红勾爪
    p.bezierRibbon([shX, shY - 1], [elbowX, elbowY - 1], [tipX, tipY], 2.6, 1.0, '#1c0412');
    p.line(shX + dir, shY - 1, elbowX, elbowY, '#ff668c', 1);
    p.line(elbowX, elbowY, tipX, tipY, '#ff4d7a', 1);
    p.line(elbowX, elbowY + 1, lobe1X, lobe1Y, '#1c0412', 1);
    p.line(elbowX - dir * 2, elbowY + 2, lobe2X, lobe2Y, '#1c0412', 1);
    p.px(elbowX, elbowY - 2, '#ffd966', true); // 翼弯小金爪
  };
  // 后翼（左偏后，略大展幅）与前翼（右偏前，3/4 透视层次！）
  drawBatWing(-1, wingSpan, wingLift);
  drawBatWing(1, Math.round(wingSpan * 0.86), Math.round(wingLift * 0.92) - 1);

  // [3] 血蝠绒毛躯干、小巧尖尾与邪魅血蝠头雕（立耳 + 发光猩红锐眸 + 雪白小獠牙！）
  p.setPart(SPRITE_PART.TORSO);
  p.ellipse(cx, cy + 2, 5.2, 6.2, '#4a081f');
  p.ellipse(cx + 0.5, cy + 1, 3.8, 4.6, '#8f1135');
  p.ellipse(cx + 1, cy, 2.2, 2.8, '#cf214f');
  // 尖小恶魔尾
  p.poly([[cx - 2, cy + 7], [cx - 5, cy + 12], [cx, cy + 9]], '#360619');

  // 血蝠头雕 + 一对锐利尖耸恶魔蝠耳
  p.setPart(SPRITE_PART.NECK_HEAD);
  const hx = cx + 2;
  const hy = cy - 4;
  p.poly([[hx - 4, hy - 2], [hx - 6, hy - 10], [hx - 1, hy - 4]], '#360619');
  p.line(hx - 5, hy - 8, hx - 2, hy - 4, '#d92152', 1);
  p.poly([[hx + 2, hy - 2], [hx + 5, hy - 10], [hx + 5, hy - 3]], '#360619');
  p.line(hx + 4, hy - 8, hx + 4, hy - 4, '#ff4d7a', 1);
  p.ellipse(hx, hy, 4.8, 4.2, '#5c0925');
  p.ellipse(hx + 0.4, hy - 0.5, 3.6, 3.1, '#a8133d');
  // 摄魂璀璨猩红双瞳 + 迷你雪白双獠牙！
  p.setPart(SPRITE_PART.GLOW_FX);
  p.rect(hx - 2, hy - 1, 2, 2, '#ff1f53', true);
  p.px(hx - 2, hy - 1, '#ffffff', true);
  p.rect(hx + 2, hy - 1, 2, 2, '#ff1f53', true);
  p.px(hx + 2, hy - 1, '#ffffff', true);
  p.px(hx, hy + 2, '#ffffff');
  p.px(hx + 3, hy + 2, '#ffffff');

  // 全力下拍帧（f === 1）：左右翼尖各自划出锐利猩红血风破空弧（不连死成底部整条！）
  if (f === 1) {
    p.setPart(SPRITE_PART.GLOW_FX);
    p.bezierRibbon([cx - 24, cy + 4], [cx - 27, cy + 12], [cx - 17, cy + 17], 2.2, 0.5, '#ff1f53', true);
    p.bezierRibbon([cx - 23, cy + 5], [cx - 25, cy + 11], [cx - 18, cy + 16], 1.0, 0.4, '#ffd9e6', true);
    p.bezierRibbon([cx + 21, cy + 3], [cx + 24, cy + 11], [cx + 15, cy + 16], 2.0, 0.5, '#ff1f53', true);
    p.bezierRibbon([cx + 20, cy + 4], [cx + 22, cy + 10], [cx + 16, cy + 15], 1.0, 0.4, '#ffd9e6', true);
  }
}

/**
 * 怨灵专属 move 变身形态：化作「幽蓝紫流光彗星大灵团」4 帧波浪曳尾飞行 + 绕核公转双鬼火！
 */
export function drawWraithOrbFlight64(p: HdPixelPainter, pose: RigPose): void {
  const f = pose.frame % 4;
  const ph = (f / 4) * Math.PI * 2;
  const bobY = Math.round(Math.sin(ph) * 2.5);
  const wave1 = Math.round(Math.sin(ph) * 5.0);
  const wave2 = Math.round(Math.cos(ph) * 5.0);
  const cx = 39;
  const cy = 34 + bobY;

  // [1] 双股交缠翻涌的幽蓝×薰衣草紫长彗星灵尾（4 帧丝滑波浪流动！）
  p.setPart(SPRITE_PART.BACK_ACC);
  // 主幽蓝灵尾
  p.bezierRibbon(
    [cx - 3, cy],
    [24, cy + wave1],
    [7, cy - Math.round(wave2 * 0.7)],
    14.5,
    1.6,
    '#2a5ec4',
    true,
  );
  p.bezierRibbon(
    [cx - 2, cy],
    [25, cy + Math.round(wave1 * 0.85)],
    [10, cy - Math.round(wave2 * 0.55)],
    9.5,
    1.0,
    '#66d9ff',
    true,
  );
  // 纠缠副冥紫灵焰丝带
  p.bezierRibbon(
    [cx - 4, cy + 2],
    [23, cy - wave1 * 0.85],
    [9, cy + Math.round(wave2 * 0.8)],
    6.5,
    1.0,
    '#7b42e8',
    true,
  );
  p.bezierRibbon(
    [cx - 3, cy + 1],
    [24, cy - Math.round(wave1 * 0.65)],
    [13, cy + Math.round(wave2 * 0.55)],
    3.0,
    0.6,
    '#d6b3ff',
    true,
  );

  // [2] 璀璨梦幻半透感大灵团主体（流线水滴核：深海蓝外晕 → 冰青亮层 → 洁白纯核！）
  p.setPart(SPRITE_PART.TORSO);
  p.ellipse(cx, cy, 12.2, 10.6, '#2b66cc', true);
  p.ellipse(cx + 0.8, cy - 0.5, 10.2, 8.8, '#54c4ff', true);
  p.ellipse(cx + 1.4, cy - 1.0, 7.6, 6.6, '#b8f2ff', true);
  p.ellipse(cx + 2.0, cy - 1.4, 4.8, 4.2, '#ffffff', true);
  // 顶沿跃动淡紫灵火冠弧
  p.bezierRibbon([cx - 6, cy - 8], [cx, cy - 13 + Math.round(wave1 * 0.3)], [cx + 7, cy - 7], 2.4, 0.8, '#9e6bff', true);

  // [3] 灵团内核隐约浮现的迷离幽灵双眸（一眼识别怨灵本尊，灵气十足！）
  p.setPart(SPRITE_PART.FACE_FEATURES);
  p.rect(cx - 1, cy - 2, 2, 3, '#3b24a6');
  p.px(cx - 1, cy - 2, '#ffffff', true);
  p.rect(cx + 4, cy - 2, 2, 3, '#3b24a6');
  p.px(cx + 4, cy - 2, '#ffffff', true);
  p.px(cx - 3, cy + 2, '#c49eff');
  p.px(cx + 6, cy + 2, '#c49eff');

  // [4] 绕灵团高速公转的青碧 & 冥紫双色小鬼火 + 沿途散落冰青灵尘！
  p.setPart(SPRITE_PART.GLOW_FX);
  const orb1X = Math.round(cx + Math.cos(ph) * 16);
  const orb1Y = Math.round(cy + Math.sin(ph) * 12);
  p.ellipse(orb1X, orb1Y, 3.0, 3.0, '#1cd6e8', true);
  p.ellipse(orb1X, orb1Y, 1.5, 1.5, '#ffffff', true);

  const orb2X = Math.round(cx + Math.cos(ph + Math.PI) * 16);
  const orb2Y = Math.round(cy + Math.sin(ph + Math.PI) * 12);
  p.ellipse(orb2X, orb2Y, 2.8, 2.8, '#9b4dff', true);
  p.ellipse(orb2X, orb2Y, 1.4, 1.4, '#ffffff', true);

  // 散落灵尘星点
  p.px(12 + (f * 3) % 8, cy - 8, '#99f5ff', true);
  p.px(18 - f * 2, cy + 9, '#d6a6ff', true);
  p.px(8 + f * 2, cy + 2, '#ffffff', true);
}

/**
 * 博丽神社 · 信仰圣域（生命阵营）64×72 HD 像素精灵共享常量与绘制辅助函数
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

/** 生命阵营 64×72 HD 像素精灵默认基础配置与裁剪参数 */
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
  skin = '#ffe4d4',
  hi = '#fff6ed',
  sh = '#e8ad99',
): void {
  p.setPart(SPRITE_PART.WEAPON);
  p.rect(gx - 1, gy - 1, 3, 2, skin);
  p.hline(gx - 1, gy - 1, 2, hi);
  p.hline(gx - 1, gy + 1, 2, sh);
}

/** 数学精确光栅化立体琉璃阴阳太极球（丝滑完美 S 曲线 + 左上镜面高光 + 发光双太极鱼眼！） */
export function drawGlossyTaijiOrb64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  radius: number,
  rotRad: number,
  emissiveEyes = true,
): void {
  const halfR = radius * 0.5;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);
  const lim = Math.ceil(radius);

  for (let dy = -lim; dy <= lim; dy++) {
    for (let dx = -lim; dx <= lim; dx++) {
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;

      // 旋转到太极局部坐标，让阴阳双鱼流畅缓缓旋转
      const lx = dx * cosR - dy * sinR;
      const ly = dx * sinR + dy * cosR;
      const dTop = Math.hypot(lx, ly + halfR);
      const dBot = Math.hypot(lx, ly - halfR);
      const isYang = (lx >= 0 && dBot > halfR) || dTop <= halfR;

      // 左上受光球面明暗场（3D 琉璃通透感）
      const nx = dx / radius;
      const ny = dy / radius;
      const shade = nx * 0.45 + ny * 0.55 + (dist / radius) * 0.25;

      let col: string;
      if (isYang) {
        if (shade < -0.25) col = '#ff7d95';
        else if (shade < 0.28) col = '#eb264b';
        else if (shade < 0.65) col = '#b81434';
        else col = '#7a0b22';
      } else {
        if (shade < -0.2) col = '#ffffff';
        else if (shade < 0.35) col = '#faf5ee';
        else if (shade < 0.68) col = '#dfd6e3';
        else col = '#b6acc4';
      }
      p.px(cx + dx, cy + dy, col);
    }
  }

  // 旋转后的双太极鱼眼（金白阳眼 + 绯红阴眼）
  const eyeOff = halfR;
  const topEyeX = Math.round(cx + eyeOff * sinR);
  const topEyeY = Math.round(cy - eyeOff * cosR);
  const botEyeX = Math.round(cx - eyeOff * sinR);
  const botEyeY = Math.round(cy + eyeOff * cosR);
  const eyeR = Math.max(1.3, radius * 0.19);
  p.ellipse(topEyeX, topEyeY, eyeR, eyeR, '#fff4b8', emissiveEyes);
  p.px(topEyeX, topEyeY, '#ffffff', emissiveEyes);
  p.ellipse(botEyeX, botEyeY, eyeR, eyeR, '#ff335c', emissiveEyes);
  p.px(botEyeX, botEyeY, '#ffc7d4', emissiveEyes);

  // 左上方琉璃通透高光弧
  const hiX = Math.round(cx - radius * 0.42);
  const hiY = Math.round(cy - radius * 0.44);
  p.px(hiX, hiY, '#ffffff', true);
  p.px(hiX + 1, hiY - 1, '#ffffff', true);
  if (radius >= 9) {
    p.px(hiX - 1, hiY + 1, '#fff6e8', true);
  }
}

/** 绘制神社经典 Z 字锯齿白纸垂（Shide） */
export function drawShideTassel64(
  p: HdPixelPainter,
  sx: number,
  sy: number,
  sway: number,
  segments = 3,
): void {
  for (let i = 0; i < segments; i++) {
    const zig = i % 2 === 0 ? -1 : 1;
    const ox = Math.round(sx + zig * 1.4 + sway * (i * 0.45));
    const oy = sy + i * 3;
    p.rect(ox - 1, oy, 3, 3, i % 2 === 0 ? '#ffffff' : '#e6dce6');
    p.px(ox, oy, '#ffffff');
  }
}

/** 绘制真·镂空鎏金圣环（只渲染环体像素，环心 100% 透明绝无深色贴纸！） */
export function drawHollowGoldRing64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  innerRatio: number,
  darkCol: string,
  mainCol: string,
  hiCol: string,
  emissive = true,
): void {
  const maxX = Math.ceil(rx);
  const maxY = Math.ceil(ry);
  for (let dy = -maxY; dy <= maxY; dy++) {
    for (let dx = -maxX; dx <= maxX; dx++) {
      const d = Math.hypot(dx / rx, dy / ry);
      if (d > 1.0 || d < innerRatio) continue;
      let col = mainCol;
      if (dy < -ry * 0.25 && dx < rx * 0.4) col = hiCol;
      else if (dy > ry * 0.45 && dx > -rx * 0.2) col = darkCol;
      p.px(cx + dx, cy + dy, col, emissive);
    }
  }
}

/** 精雕层次感洁白暖金大天使羽翼（供神使六翼 & 御柱天马双翼复用，羽瓣分明、层次奢华！） */
export function drawSeraphWingSide64(
  p: HdPixelPainter,
  rootX: number,
  rootY: number,
  dir: -1 | 1,
  span: number,
  height: number,
  flapY: number,
  colors: {
    deep: string;
    mid: string;
    light: string;
    tip: string;
    gold?: string;
  },
  emissiveTip = true,
): void {
  const elbowX = rootX + dir * Math.round(span * 0.48);
  const elbowY = rootY - Math.round(height * 0.72) + Math.round(flapY * 0.65);
  const tipX = Math.max(3, Math.min(60, rootX + dir * span));
  const tipY = Math.max(4, Math.min(64, rootY - Math.round(height * 0.45) + flapY));

  const f1X = Math.max(3, Math.min(60, rootX + dir * Math.round(span * 0.9)));
  const f1Y = tipY + 5;
  const f2X = Math.max(3, Math.min(60, rootX + dir * Math.round(span * 0.74)));
  const f2Y = tipY + 10;
  const f3X = Math.max(3, Math.min(60, rootX + dir * Math.round(span * 0.52)));
  const f3Y = rootY + Math.round(height * 0.35) + Math.round(flapY * 0.35);

  // 底层深羽影剪影（带 3 级清晰阶梯羽尖轮廓）
  p.poly(
    [
      [rootX, rootY - 1],
      [elbowX, elbowY - 1],
      [tipX, tipY],
      [f1X - dir * 3, f1Y - 2],
      [f1X, f1Y],
      [f2X - dir * 3, f2Y - 2],
      [f2X, f2Y],
      [f3X, f3Y],
      [rootX, rootY + 5],
    ],
    colors.deep,
  );
  // 中层丰满羽片
  p.poly(
    [
      [rootX + dir * 1, rootY],
      [elbowX, elbowY],
      [tipX - dir * 1, tipY + 1],
      [f1X - dir * 1, f1Y - 1],
      [f2X - dir * 1, f2Y - 2],
      [f3X - dir * 1, f3Y - 2],
      [rootX + dir * 1, rootY + 3],
    ],
    colors.mid,
  );
  // 上层受光洁白暖羽
  p.poly(
    [
      [rootX + dir * 2, rootY],
      [elbowX, elbowY + 1],
      [Math.round((elbowX + tipX) * 0.6), Math.round((elbowY + tipY) * 0.6) + 1],
      [f2X - dir * 2, f2Y - 4],
      [rootX + dir * 2, rootY + 2],
    ],
    colors.light,
    emissiveTip,
  );

  // 清晰翼肩鎏金脊羽线条 + 羽片分缝暗线与羽尖辉光点缀
  p.bezierRibbon([rootX, rootY - 1], [elbowX, elbowY - 1], [tipX, tipY], 2.2, 0.9, colors.gold ?? colors.light, emissiveTip);
  p.line(elbowX, elbowY + 3, f1X - dir * 2, f1Y - 1, colors.deep, 1);
  p.line(Math.round((rootX + elbowX) * 0.65), Math.round((rootY + elbowY) * 0.65) + 3, f2X - dir * 2, f2Y - 1, colors.deep, 1);
  p.line(elbowX, elbowY + 2, f1X, f1Y, colors.tip, 1, emissiveTip);
  p.px(tipX, tipY, colors.tip, emissiveTip);
  p.px(f1X, f1Y, colors.tip, emissiveTip);
}

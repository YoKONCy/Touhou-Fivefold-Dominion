/**
 * 像素骨骼立绘绘制工具集：动作姿态序列、少女五官画笔、离屏光栅化、外轮廓烘焙与背景辅助
 */

import * as PIXI from 'pixi.js';
import { renderHdRigFrameToRgba } from '../../hdPixelEngine';
import {
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  type PixelPainter,
  type RigPose,
  type SpriteAnimState,
  type SpriteRigSpec,
} from './types';

/** 构建 4 大动作状态的精确骨骼动画关键帧序列 */
export function buildPoseSequence(state: SpriteAnimState): RigPose[] {
  if (state === 'idle') {
    // 6 帧循环：轻柔胸腔呼吸 + 飘带羽翼次级律动 + 第 4 帧自然眨眼！
    return [
      { state, frame: 0, phase: 0 / 6, breathY: 0, leanX: 0, stride: 0, stepLift: 0, flutter: 0, armAction: 0, blink: false, expr: 'normal', slashAlpha: 0 },
      { state, frame: 1, phase: 1 / 6, breathY: -0.6, leanX: 0, stride: 0, stepLift: 0, flutter: 0.7, armAction: 0.08, blink: false, expr: 'normal', slashAlpha: 0 },
      { state, frame: 2, phase: 2 / 6, breathY: -1.1, leanX: 0.4, stride: 0, stepLift: 0, flutter: 1.0, armAction: 0.14, blink: false, expr: 'normal', slashAlpha: 0 },
      { state, frame: 3, phase: 3 / 6, breathY: -0.8, leanX: 0.2, stride: 0, stepLift: 0, flutter: 0.3, armAction: 0.08, blink: false, expr: 'normal', slashAlpha: 0 },
      { state, frame: 4, phase: 4 / 6, breathY: -0.2, leanX: 0, stride: 0, stepLift: 0, flutter: -0.6, armAction: -0.05, blink: true, expr: 'normal', slashAlpha: 0 },
      { state, frame: 5, phase: 5 / 6, breathY: 0.2, leanX: -0.2, stride: 0, stepLift: 0, flutter: -0.9, armAction: -0.08, blink: false, expr: 'normal', slashAlpha: 0 },
    ];
  }
  if (state === 'move') {
    // 4 帧完整迈步/振翅冲刺循环：左脚前跨 → 过渡腾空 → 右脚前跨 → 过渡腾空
    return [
      { state, frame: 0, phase: 0.0, breathY: -0.5, leanX: 2.2, stride: 1.0, stepLift: 0, flutter: 1.0, armAction: 0.35, blink: false, expr: 'focus', slashAlpha: 0 },
      { state, frame: 1, phase: 0.25, breathY: -1.6, leanX: 2.6, stride: 0.2, stepLift: 1.8, flutter: 0.2, armAction: 0.1, blink: false, expr: 'focus', slashAlpha: 0 },
      { state, frame: 2, phase: 0.5, breathY: -0.5, leanX: 2.2, stride: -1.0, stepLift: 0, flutter: -1.0, armAction: -0.35, blink: false, expr: 'focus', slashAlpha: 0 },
      { state, frame: 3, phase: 0.75, breathY: -1.6, leanX: 2.6, stride: -0.2, stepLift: 1.8, flutter: -0.2, armAction: -0.1, blink: false, expr: 'focus', slashAlpha: 0 },
    ];
  }
  if (state === 'attack') {
    // 4 帧打击感经典四段：蓄力抬手后拉 → 猛然前倾挥击+像素剑气 → 满力释放定格 → 优雅收招
    return [
      { state, frame: 0, phase: 0.0, breathY: -1.2, leanX: -2.4, stride: -0.7, stepLift: 0.5, flutter: -1.0, armAction: -1.0, blink: false, expr: 'focus', slashAlpha: 0 },
      { state, frame: 1, phase: 0.35, breathY: 0.6, leanX: 4.0, stride: 1.1, stepLift: 0, flutter: 1.2, armAction: 1.0, blink: false, expr: 'focus', slashAlpha: 1.0 },
      { state, frame: 2, phase: 0.7, breathY: 0.3, leanX: 3.0, stride: 0.9, stepLift: 0, flutter: 0.8, armAction: 0.85, blink: false, expr: 'focus', slashAlpha: 0.6 },
      { state, frame: 3, phase: 1.0, breathY: -0.3, leanX: 0.8, stride: 0.3, stepLift: 0, flutter: 0.2, armAction: 0.25, blink: false, expr: 'normal', slashAlpha: 0 },
    ];
  }
  // hit：2 帧受击后仰皱眉
  return [
    { state, frame: 0, phase: 0.0, breathY: 1.0, leanX: -3.2, stride: -0.5, stepLift: 0, flutter: -1.1, armAction: -0.65, blink: true, expr: 'hurt', slashAlpha: 0 },
    { state, frame: 1, phase: 0.6, breathY: 0.5, leanX: -1.6, stride: -0.2, stepLift: 0, flutter: -0.4, armAction: -0.3, blink: true, expr: 'hurt', slashAlpha: 0 },
  ];
}

/** 绘制通用精致像素少女五官（精准 3/4 右向东方萌系大瞳：水润双高光 + 内收柔腮 + 微笑/眨眼/受击 > <） */
export function drawChibiFaceEyes(
  p: PixelPainter,
  cx: number,
  cy: number,
  irisDark: string,
  irisLight: string,
  pose: RigPose,
): void {
  if (pose.expr === 'hurt') {
    // 受击紧闭 > <（严格收于脸颊内侧，绝不越界！）
    p.px(cx - 3, cy - 1, '#261433');
    p.px(cx - 2, cy, '#261433');
    p.px(cx - 3, cy + 1, '#261433');
    p.px(cx + 2, cy - 1, '#261433');
    p.px(cx + 1, cy, '#261433');
    p.px(cx + 2, cy + 1, '#261433');
    p.px(cx - 4, cy + 2, '#ff9cb3');
    p.px(cx + 3, cy + 2, '#ff9cb3');
    p.hline(cx - 1, cy + 2, 2, '#c25764');
    return;
  }
  if (pose.blink) {
    // 温柔笑眼弯弧
    p.hline(cx - 3, cy + 1, 2, '#2b1838');
    p.hline(cx + 1, cy + 1, 2, '#2b1838');
    p.px(cx - 4, cy, '#593b6b');
    p.px(cx + 3, cy, '#593b6b');
    p.px(cx - 4, cy + 2, '#ffa1b8');
    p.px(cx + 3, cy + 2, '#ffa1b8');
    p.px(cx - 1, cy + 2, '#d47480');
    return;
  }

  // 2×3 经典 16-bit 日系宝石大瞳（深邃瞳仁 + 晶亮高光 + 浓郁虹膜下沿，彻底告别发白眯眼！）
  // 上沿深邃睫线
  p.hline(cx - 3, cy - 1, 2, '#1f102e');
  p.hline(cx + 1, cy - 1, 2, '#1f102e');
  // 中排：左上纯白星光高光 + 右侧浓郁深瞳核心
  p.px(cx - 3, cy, '#ffffff');
  p.px(cx - 2, cy, pose.expr === 'focus' ? '#140821' : '#241136');
  p.px(cx + 1, cy, '#ffffff');
  p.px(cx + 2, cy, pose.expr === 'focus' ? '#140821' : '#241136');
  // 下排：饱满宝石主色 + 亮色虹膜反光
  p.px(cx - 3, cy + 1, irisDark);
  p.px(cx - 2, cy + 1, irisLight);
  p.px(cx + 1, cy + 1, irisDark);
  p.px(cx + 2, cy + 1, irisLight);

  // 内收樱粉柔腮与精致小嘴
  p.px(cx - 4, cy + 2, '#ff99b3');
  p.px(cx + 3, cy + 2, '#ff99b3');
  p.px(cx - 1, cy + 2, pose.expr === 'focus' ? '#b34655' : '#d16b78');
  if (pose.expr !== 'focus') {
    p.px(cx, cy + 2, '#eb99a3');
  }
}

/** 将指定骨骼规格与姿态帧光栅化到离屏 Canvas，并按模式烘焙外轮廓/自发光/受击闪白层 */
export function renderRigFrameToCanvas(
  spec: SpriteRigSpec,
  pose: RigPose,
  flipX: boolean,
  mode: 'body' | 'glow' | 'flash',
): HTMLCanvasElement {
  const width = spec.width ?? SPRITE_WIDTH;
  const height = spec.height ?? SPRITE_HEIGHT;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // 若启用新一代 64×72 零糊边分层绘谱，走纯整数光栅化 + 自动部件内描边管线！
  if (spec.hdDraw) {
    const rgba = renderHdRigFrameToRgba(spec.hdDraw, pose, flipX, mode, width, height);
    const imgData = ctx.createImageData(width, height);
    imgData.data.set(rgba);
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  const mapX = (x: number) => (flipX ? width - 1 - x : x);
  const shouldDraw = (emissive?: boolean) => (mode === 'glow' ? Boolean(emissive) : true);
  const pickColor = (color: string) => (mode === 'flash' ? '#ffffff' : color);

  const helpers: PixelPainter = {
    px: (x, y, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      ctx.fillRect(Math.round(mapX(x)), Math.round(y), 1, 1);
    },
    rect: (x, y, w, h, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      const rx = flipX ? width - x - w : x;
      ctx.fillRect(Math.round(rx), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    },
    hline: (x, y, len, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      const rx = flipX ? width - x - len : x;
      ctx.fillRect(Math.round(rx), Math.round(y), Math.max(1, Math.round(len)), 1);
    },
    vline: (x, y, len, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      ctx.fillRect(Math.round(mapX(x)), Math.round(y), 1, Math.max(1, Math.round(len)));
    },
    ellipse: (cx, cy, rx, ry, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      const minX = Math.floor(cx - rx);
      const maxX = Math.ceil(cx + rx);
      const minY = Math.floor(cy - ry);
      const maxY = Math.ceil(cy + ry);
      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const dx = (px - cx) / Math.max(0.5, rx);
          const dy = (py - cy) / Math.max(0.5, ry);
          if (dx * dx + dy * dy <= 1) {
            ctx.fillRect(Math.round(mapX(px)), Math.round(py), 1, 1);
          }
        }
      }
    },
    poly: (pts, color, emissive) => {
      if (!shouldDraw(emissive) || pts.length < 3) return;
      ctx.fillStyle = pickColor(color);
      ctx.beginPath();
      const firstX = flipX ? width - pts[0][0] : pts[0][0];
      ctx.moveTo(firstX, pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        const px = flipX ? width - pts[i][0] : pts[i][0];
        ctx.lineTo(px, pts[i][1]);
      }
      ctx.closePath();
      ctx.fill();
    },
    line: (x0, y0, x1, y1, color, thickness = 1, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      const half = Math.floor(thickness / 2);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = Math.round(x0 + (x1 - x0) * t);
        const py = Math.round(y0 + (y1 - y0) * t);
        const rx = flipX ? width - px - thickness + half : px - half;
        ctx.fillRect(rx, py - half, thickness, thickness);
      }
    },
  };

  spec.draw(helpers, pose);

  // 组装完全身解构部件后统一执行 1px 深靛黑像素外轮廓（零 Mixels 完美锐利！）
  if (mode === 'body') {
    const img = ctx.getImageData(0, 0, width, height);
    const src = new Uint8ClampedArray(img.data);
    const out = img.data;
    const isOpaque = (px: number, py: number) => {
      if (px < 0 || py < 0 || px >= width || py >= height) return false;
      return src[(py * width + px) * 4 + 3] > 30;
    };

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const idx = (py * width + px) * 4;
        if (src[idx + 3] > 30) continue;
        if (
          isOpaque(px - 1, py) ||
          isOpaque(px + 1, py) ||
          isOpaque(px, py - 1) ||
          isOpaque(px, py + 1)
        ) {
          out[idx] = 12;
          out[idx + 1] = 13;
          out[idx + 2] = 28;
          out[idx + 3] = 242;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  return canvas;
}

/** 将离屏像素画布转换为最近邻采样的 PIXI.Texture */
export function canvasToNearestTexture(canvas: HTMLCanvasElement): PIXI.Texture {
  const source = new PIXI.CanvasSource({
    resource: canvas,
    scaleMode: 'nearest',
  });
  return new PIXI.Texture({ source });
}

/** 绘制立绘与头像通用的柔和暗金结界背光底纹 */
export function drawSubtlePixelFrameBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spec: SpriteRigSpec,
  frameIdx = 0,
): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, spec.backdropTop);
  grad.addColorStop(0.68, spec.backdropBottom);
  grad.addColorStop(1, '#09070d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 柔和背光圣晕（突出角色主体轮廓与空气感）
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.44, w * 0.06, w * 0.5, h * 0.46, w * 0.54);
  glow.addColorStop(0, `${spec.backdropGlow}52`);
  glow.addColorStop(0.62, `${spec.backdropGlow}18`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // 雅致暗金结界细环底纹（像素齐整，不抢主角视觉）
  ctx.save();
  ctx.strokeStyle = `${spec.backdropGlow}2e`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(Math.round(w * 0.5), Math.round(h * 0.47), Math.round(w * 0.38), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(Math.round(w * 0.5), Math.round(h * 0.47), Math.round(w * 0.31), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 漂浮暗夜星尘微光（随 6 帧待机轻缓闪动）
  const starSeeds = [
    [0.16, 0.18],
    [0.82, 0.2],
    [0.14, 0.72],
    [0.86, 0.66],
    [0.26, 0.32],
    [0.76, 0.36],
  ];
  for (let i = 0; i < starSeeds.length; i++) {
    const twinkle = (i + frameIdx) % 3 === 0 ? 0.85 : 0.32;
    ctx.fillStyle = i % 2 === 0 ? `rgba(255, 242, 196, ${twinkle})` : `${spec.backdropGlow}${twinkle > 0.5 ? 'cc' : '55'}`;
    const sx = Math.round(starSeeds[i][0] * w);
    const sy = Math.round(starSeeds[i][1] * h);
    ctx.fillRect(sx, sy, 2, 2);
  }
}

/**
 * 扫描像素画布待机首帧，精确寻找最顶端的非透明像素行 Y（用于自动对齐头顶箭头与飘字，彻底适配 48×54 与 64×72 双画风）
 */
export function measureCanvasTopOpaqueY(canvas: HTMLCanvasElement, fallbackTopY: number): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return fallbackTopY;
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; y++) {
    const rowOff = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[rowOff + x * 4 + 3] > 20) {
        return y;
      }
    }
  }
  return fallbackTopY;
}

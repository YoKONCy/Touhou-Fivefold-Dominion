/**
 * 《Touhou-H4》扩充自研东方纯净像素特效模块库（26 种高辨识度双缓冲特效）
 *
 * 设计目标：
 * - 彻底打破法术与召唤/护盾/符卡之间的特效复用瓶颈，让五大魔法派系、幽冥公馆死亡系与四位英雄符卡各具惊艳演出！
 * - 全员严格遵循 pixelfx 双缓冲 (color + light) 规范，自带平滑淡入淡出包络，零脏矩形底色、零硬切边、零假人依赖。
 * - 包含：
 *   [A] 英雄符卡与幽冥公馆死亡系招牌 7 术（冈格尼尔螺旋魔枪、全屏红雾异变、深渊隙间魔瞳、血族血爪蝠群、极寒冰牢、凋零沙漏、魔力虹吸）；
 *   [B] 9 种差异化生灵/元素/亡灵召请大阵（终结 16× summon_rise 撞脸！）；
 *   [C] 10 种东方专属结界/弹幕/星轨/音律/魔镜/锁链特效（终结 12× divine_shield 与高频阵法撞脸！）。
 */

import { clamp, fit, rand, smooth, TAU, WHITE, type PixelFxModule, type PixelFxPainter } from 'pixelfx';

const STAGE_W = 640;
const STAGE_H = 360;

/** 安全解析调色板为 0xAABBGGRR 数组 */
function resolveRamp(palette: unknown, count: number): number[] {
  const fallback = ['#291a08', '#8a5c14', '#d9a42e', '#ffe066', '#fff5b8', '#ffffff'];
  const src = Array.isArray(palette) && palette.length > 0 ? (palette as readonly (string | number)[]) : fallback;
  return fit(src, count);
}

/** 生命周期平滑淡入淡出包络 */
function lifeEnvelope(t: number, duration: number, fadeIn = 0.16, fadeOut = 0.38): number {
  const aIn = smooth(0, fadeIn, t);
  const aOut = 1 - smooth(Math.max(fadeIn, duration - fadeOut), duration, t);
  return clamp(aIn * aOut);
}

/** 绘制水平压扁的透视地面符阵椭圆环 */
function drawPerspectiveRing(
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
function drawTinyStar(
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

// ============================================================================
// [A] 英雄符卡 & 幽冥公馆死亡系核心招牌特效（7 种）
// ============================================================================

/**
 * 1. 神枪「冈格尼尔之枪」——沿 angle 暴射的炽烈螺旋绯红魔枪 + 命运穿刺十字星爆
 */
export const fxTouhouGungnirLance: PixelFxModule = {
  meta: {
    name: 'Touhou Gungnir Lance',
    desc: '沿指定方向贯穿全屏的螺旋绯红命运神枪与十字光焰',
    size: [360, 220],
    origin: [180, 110],
    duration: 1.35,
    loop: false,
    fps: 30,
    options: {
      palette: ['#24060c', '#6e0f20', '#c71c36', '#ff526b', '#ffc7cf', '#ffffff'],
      angle: 0,
      seed: 19,
    },
  },
  draw(p, t, o) {
    const D = 1.35;
    const env = lifeEnvelope(t, D, 0.08, 0.38);
    if (env <= 0.005) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 19);
    const ang = Number(o.angle ?? 0);
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const nx = -sa;
    const ny = ca;

    // 起手绯红星阵绽放
    const chargeEnv = 1 - smooth(0.45, 0.85, t);
    if (chargeEnv > 0.02) {
      const r0 = 14 + 10 * smooth(0, 0.25, t);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * TAU + t * 5;
        p.dot(Math.cos(a) * r0, Math.sin(a) * r0, i % 4 === 0 ? WHITE : C[3], chargeEnv * env);
      }
      p.glow(0, 0, 26, C[3], 0.55 * chargeEnv * env);
    }

    // 贯穿枪身高速前刺延伸至 190px
    const reach = 190 * smooth(0.05, 0.38, t);
    const width = 4.2 * (1 - 0.55 * smooth(0.55, 1.3, t));

    for (let d = 0; d <= reach; d += 2) {
      const bx = ca * d;
      const by = sa * d;
      const tipK = smooth(reach - 18, reach, d);
      const localW = Math.max(0.8, width * (1 - tipK * 0.55));

      // 主炽红枪芯 + 白炽内脉
      p.line(bx - nx * localW, by - ny * localW, bx + nx * localW, by + ny * localW, C[3], env * 0.9);
      p.dot(bx, by, WHITE, env);
      if (d % 8 === 0) {
        p.glow(bx, by, 10, C[3], 0.34 * env);
      }

      // 双螺旋命运缠绕光带
      const ph = d * 0.14 - t * 18;
      const amp = (5.5 + 3 * Math.sin(d * 0.04)) * (1 - tipK * 0.6);
      const sx1 = bx + nx * Math.sin(ph) * amp;
      const sy1 = by + ny * Math.sin(ph) * amp;
      const sx2 = bx - nx * Math.sin(ph) * amp;
      const sy2 = by - ny * Math.sin(ph) * amp;
      p.dot(sx1, sy1, C[4], env * 0.92);
      p.dot(sx2, sy2, C[2], env * 0.85);
      p.light(sx1, sy1, C[3], 0.35 * env);
    }

    // 锋利璀璨命运枪锋与倒刺翼芒
    const tx = ca * reach;
    const ty = sa * reach;
    const barbBackX = tx - ca * 14;
    const barbBackY = ty - sa * 14;
    p.line(tx, ty, barbBackX + nx * 9, barbBackY + ny * 9, WHITE, env);
    p.line(tx, ty, barbBackX - nx * 9, barbBackY - ny * 9, WHITE, env);
    p.line(tx + ca * 6, ty + sa * 6, barbBackX + nx * 7, barbBackY + ny * 7, C[4], env);
    p.line(tx + ca * 6, ty + sa * 6, barbBackX - nx * 7, barbBackY - ny * 7, C[4], env);
    p.glow(tx, ty, 24, C[4], 0.72 * env);

    // 沿途飞溅的猩红十字星屑
    for (let i = 0; i < 18; i++) {
      const dist = rand(S, i, 1) * reach;
      const side = (rand(S, i, 2) - 0.5) * 28;
      const drift = t * (10 + rand(S, i, 3) * 18);
      const px = ca * dist + nx * (side + (side >= 0 ? drift * 0.35 : -drift * 0.35));
      const py = sa * dist + ny * (side + (side >= 0 ? drift * 0.35 : -drift * 0.35));
      const tw = 0.4 + 0.6 * Math.sin(t * 14 + i);
      p.dot(px, py, i % 3 === 0 ? WHITE : C[4], env * tw);
      p.light(px, py, C[3], 0.32 * env * tw);
    }
  },
};

/**
 * 2. 红雾异变 · 全屏 640×360 纯透明猩红薄雾与暗夜蝠影天象（零黑底矩形污染）
 */
export const fxTouhouCrimsonMist: PixelFxModule = {
  meta: {
    name: 'Touhou Crimson Mist',
    desc: '全屏 640×360 纯透明红雾异变薄纱与微光红尘蝠影',
    size: [STAGE_W, STAGE_H],
    origin: [STAGE_W / 2, STAGE_H / 2],
    duration: 2.2,
    loop: false,
    fps: 30,
    options: {
      palette: ['#24060c', '#6e0f20', '#c71c36', '#ff526b', '#ffc7cf', '#ffffff'],
      seed: 31,
    },
  },
  draw(p, t, o) {
    const D = 2.2;
    const env = lifeEnvelope(t, D, 0.28, 0.55);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 31);

    // 4 道轻柔横向流动的明亮绯红红雾丝带（高亮度低透明，彻底避免暗色污斑！）
    const bands = [
      { y0: -115, amp: 14, freq: 0.012, spd: 28, h: 36, k: 0.72 },
      { y0: -38, amp: 18, freq: 0.01, spd: -22, h: 46, k: 0.92 },
      { y0: 42, amp: 15, freq: 0.013, spd: 24, h: 42, k: 0.85 },
      { y0: 108, amp: 12, freq: 0.015, spd: -18, h: 34, k: 0.68 },
    ];
    for (let bi = 0; bi < bands.length; bi++) {
      const b = bands[bi];
      for (let x = -312; x <= 312; x += 2) {
        const edgeX = smooth(-312, -238, x) * (1 - smooth(238, 312, x));
        if (edgeX <= 0.02) continue;
        const cy = b.y0 + Math.sin((x + t * b.spd) * b.freq + bi * 1.7) * b.amp;
        const wisp = 0.55 + 0.45 * Math.sin(x * 0.026 - t * 2.4 + bi * 2.3);
        const hh = b.h * (0.65 + 0.35 * wisp);
        for (let dy = -hh; dy <= hh; dy += 2) {
          const y = cy + dy;
          if (y < -172 || y > 168) continue;
          const v = Math.abs(dy) / hh;
          if (v >= 1) continue;
          const prof = Math.pow(1 - v * v, 1.8) * edgeX * b.k * wisp * env;
          if (prof < 0.05) continue;
          const col = v < 0.35 ? C[4] : C[3];
          const a = Math.min(0.24, prof * 0.26);
          p.blend(x, y, col, a);
          p.blend(x + 1, y, col, a);
          p.blend(x, y + 1, col, a * 0.9);
          p.blend(x + 1, y + 1, col, a * 0.9);
          p.light(x, y, C[3], prof * 0.22);
        }
      }
    }

    // 72 颗全屏摇曳的绯红光尘微粒 + 10 只轻掠夜空的亮红小蝠影
    for (let i = 0; i < 72; i++) {
      const x0 = -305 + rand(S, i, 1) * 610;
      const y0 = -162 + rand(S, i, 2) * 320;
      const x = ((((x0 + t * (16 + rand(S, i, 3) * 24) + 310) % 620) + 620) % 620) - 310;
      const y = y0 + Math.sin(t * 2.5 + i) * 9;
      const edge = smooth(-310, -270, x) * (1 - smooth(270, 310, x));
      const tw = 0.45 + 0.55 * Math.sin(t * 6 + i * 1.9);
      const a = edge * tw * env;
      if (a < 0.12) continue;
      p.dot(x, y, i % 4 === 0 ? WHITE : C[4], a);
      if (i % 5 === 0) p.glow(x, y, 6, C[3], 0.3 * a);
    }
    for (let i = 0; i < 10; i++) {
      const bx = -280 + ((rand(S + 55, i, 1) * 560 + t * (48 + (i % 3) * 18)) % 560);
      const by = -135 + rand(S + 55, i, 2) * 245 + Math.sin(t * 5 + i * 2) * 8;
      const wing = Math.sin(t * 15 + i * 3) * 2.6;
      const a = env * smooth(-280, -230, bx) * (1 - smooth(230, 280, bx));
      if (a < 0.12) continue;
      p.dot(bx, by, C[4], a);
      p.line(bx - 4, by - 1 + wing, bx, by, C[3], a);
      p.line(bx + 4, by - 1 + wing, bx, by, C[3], a);
      p.light(bx, by, C[3], 0.28 * a);
    }
  },
};

/**
 * 3. 深渊隙间魔瞳裂隙——横向撕裂空间 + 睁开金红隙间魔瞳 + 碎裂紫光粒子
 */
export const fxTouhouAbyssGapRift: PixelFxModule = {
  meta: {
    name: 'Touhou Abyss Gap Rift',
    desc: '紫红深渊空间裂缝撕开、浮现凝视金红隙间魔瞳与碎裂空间微粒',
    size: [140, 120],
    origin: [70, 68],
    duration: 1.35,
    loop: false,
    fps: 30,
    options: {
      palette: ['#170829', '#4f1875', '#9c36cc', '#ff5288', '#ffd4e6', '#ffffff'],
      seed: 41,
    },
  },
  draw(p, t, o) {
    const D = 1.35;
    const env = lifeEnvelope(t, D, 0.12, 0.34);
    if (env <= 0.005) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 41);
    const cy = -14;
    const open = smooth(0.05, 0.28, t) * (1 - smooth(0.85, 1.32, t));
    const rx = 34 * smooth(0.02, 0.24, t);
    const ry = 13 * open;

    // 隙间裂隙外缘亮红紫光晕 + 内腔深紫空间裂口
    if (rx > 2 && ry > 0.8) {
      for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) {
        const q = x / rx;
        const arch = Math.max(0, 1 - q * q);
        const h = ry * Math.pow(arch, 0.85);
        for (let y = Math.floor(-h); y <= Math.ceil(h); y++) {
          const v = Math.abs(y) / Math.max(0.5, h);
          const col = v > 0.72 ? C[3] : v > 0.45 ? C[2] : C[0];
          p.blend(x, cy + y, col, (v > 0.72 ? 0.92 : 0.78) * env);
        }
        p.dot(x, cy - h, Math.abs(q) < 0.3 ? WHITE : C[4], env);
        p.dot(x, cy + h, Math.abs(q) < 0.3 ? WHITE : C[4], env);
      }
      // 裂隙两侧经典红白/金红蝴蝶结光点饰边
      p.glow(-rx * 0.85, cy, 8, C[3], 0.45 * env);
      p.glow(rx * 0.85, cy, 8, C[3], 0.45 * env);

      // 裂隙中睁开的三枚金红深渊魔瞳！
      const eyePositions = [-16, 0, 16];
      const eyeOpen = smooth(0.18, 0.4, t) * (1 - smooth(0.82, 1.18, t));
      if (eyeOpen > 0.08) {
        for (let ei = 0; ei < eyePositions.length; ei++) {
          const ex = eyePositions[ei];
          const er = ei === 1 ? 4.4 : 3.0;
          const eh = er * 0.75 * eyeOpen;
          if (Math.abs(ex) > rx * 0.78) continue;
          p.circle(ex, cy, er * eyeOpen, (d) => (d < 0.4 ? C[1] : d < 0.75 ? C[4] : WHITE), env);
          p.line(ex, cy - eh * 0.8, ex, cy + eh * 0.8, C[0], env);
          p.dot(ex + 1, cy - 1, WHITE, env);
          p.glow(ex, cy, er * 2.5, C[3], 0.42 * eyeOpen * env);
        }
      }
    }

    // 围绕隙间四散飞舞的空间菱形碎片
    for (let i = 0; i < 20; i++) {
      const a = rand(S, i, 1) * TAU + t * 1.4;
      const dist = 10 + (18 + rand(S, i, 2) * 24) * smooth(0.08, 0.9, t);
      const px = Math.cos(a) * dist;
      const py = cy + Math.sin(a) * dist * 0.55;
      p.dot(px, py, i % 3 === 0 ? WHITE : C[4], env * 0.9);
      p.light(px, py, C[3], 0.3 * env);
    }
    p.glow(0, cy, 34, C[3], 0.42 * env);
  },
};

/**
 * 4. 血族血爪撕裂与猩红蝠群——三道交叉猩红利爪痕 + 螺旋升腾血蝠群
 */
export const fxTouhouVampiricClawBurst: PixelFxModule = {
  meta: {
    name: 'Touhou Vampiric Claw Burst',
    desc: '三道平行猩红利爪斜劈撕裂，随后涌出盘旋上升的绯红血蝠与血珠',
    size: [120, 120],
    origin: [60, 74],
    duration: 1.45,
    loop: false,
    fps: 30,
    options: {
      palette: ['#24060c', '#6e0f20', '#c71c36', '#ff526b', '#ffc7cf', '#ffffff'],
      seed: 29,
    },
  },
  draw(p, t, o) {
    const D = 1.45;
    const env = lifeEnvelope(t, D, 0.06, 0.4);
    if (env <= 0.005) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 29);
    const cy = -14;

    // 阶段 1：三道平行分明、垂直拉开间距的犀利猩红血爪撕裂痕（0 ~ 0.65s）
    const slashAlpha = smooth(0, 0.08, t) * (1 - smooth(0.38, 0.78, t));
    if (slashAlpha > 0.02) {
      const prog = smooth(0.02, 0.24, t);
      for (let k = -1; k <= 1; k++) {
        // 偏移方向严格垂直于斜劈方向 (+32, +28)，三爪清晰分离不粘连！
        const x0 = -16 + k * 8;
        const y0 = cy - 14 - k * 9;
        const x1 = x0 + 32 * prog;
        const y1 = y0 + 28 * prog;
        p.line(x0, y0, x1, y1, C[3], slashAlpha);
        p.line(x0 + 1, y0, x1 + 1, y1, k === 0 ? WHITE : C[4], slashAlpha);
        p.glowLine(x0, y0, x1, y1, 5, C[3], 0.35 * slashAlpha);
      }
    }

    // 阶段 2：10 只自血雾中螺旋腾飞的迷你猩红血蝠 + 飞散血珠
    for (let i = 0; i < 10; i++) {
      const delay = 0.08 + i * 0.04;
      const lt = t - delay;
      if (lt <= 0) continue;
      const u = clamp(lt / 1.1);
      const a = rand(S, i, 1) * TAU + lt * (3.2 + (i % 3));
      const rad = 8 + u * 26;
      const bx = Math.cos(a) * rad;
      const by = cy + 6 - u * 44 + Math.sin(a) * 6;
      const wing = Math.sin(lt * 18 + i) * 2.5;
      const ba = Math.sin(u * Math.PI) * env;
      if (ba <= 0.08) continue;
      p.dot(bx, by, C[4], ba);
      p.line(bx - 3.5, by - 1 + wing, bx, by, C[3], ba);
      p.line(bx + 3.5, by - 1 + wing, bx, by, C[3], ba);
      p.light(bx, by, C[3], 0.3 * ba);
    }

    for (let i = 0; i < 18; i++) {
      const a = rand(S + 10, i, 1) * TAU;
      const spd = 16 + rand(S + 10, i, 2) * 28;
      const px = Math.cos(a) * t * spd;
      const py = cy + Math.sin(a) * t * spd * 0.7 - t * 14;
      p.dot(px, py, i % 3 === 0 ? WHITE : C[3], env * (1 - t / D));
    }
    p.glow(0, cy, 24, C[3], 0.42 * env);
  },
};

/**
 * 5. 极寒六棱冰晶牢笼——六道锋利冰棱破土合拢封锁目标 + 雪花星芒
 */
export const fxTouhouFrostPrison: PixelFxModule = {
  meta: {
    name: 'Touhou Frost Prison',
    desc: '六道晶莹冰棱破土合拢构筑冰晶牢笼，绽放六角寒霜星芒',
    size: [120, 120],
    origin: [60, 78],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#0a1e30', '#1c5c8a', '#42b8eb', '#99ebff', '#e3fbff', '#ffffff'],
      seed: 53,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.1, 0.42);
    if (env <= 0.005) return;

    const C = resolveRamp(o.palette, 6);
    const rise = smooth(0.04, 0.32, t);
    const cy = -14;

    // 地面六角霜花光环
    drawPerspectiveRing(p, 0, 2, 22 * rise, 8 * rise, 30, t * 1.4, C[3], WHITE, env, 5);
    p.glow(0, 0, 24, C[3], 0.38 * env);

    // 6 道环绕目标破土斜刺合拢的锋利菱形冰棱柱
    const shards = [
      { x: -18, h: 30, tilt: 7 },
      { x: -10, h: 38, tilt: 3 },
      { x: -2, h: 42, tilt: 1 },
      { x: 6, h: 39, tilt: -2 },
      { x: 14, h: 34, tilt: -5 },
      { x: 20, h: 27, tilt: -8 },
    ];
    for (let i = 0; i < shards.length; i++) {
      const sh = shards[i];
      const shRise = smooth(0.03 * i, 0.25 + 0.03 * i, t);
      if (shRise <= 0.02) continue;
      const topX = sh.x + sh.tilt * shRise;
      const topY = 2 - sh.h * shRise;
      const midY = 2 - sh.h * 0.48 * shRise;
      p.line(sh.x - 2, 2, topX, topY, C[2], env * 0.92);
      p.line(sh.x + 2, 2, topX, topY, C[3], env * 0.95);
      p.line(sh.x, 2, topX, topY, C[4], env);
      p.line(sh.x - 1, midY, topX, topY, WHITE, env);
      p.dot(topX, topY, WHITE, env);
      p.light(topX, topY, C[3], 0.4 * env);
    }

    // 顶部绽放的旋转六角大雪花
    const starA = smooth(0.25, 0.45, t) * env;
    if (starA > 0.05) {
      for (let k = 0; k < 6; k++) {
        const a = t * 1.8 + (k * TAU) / 6;
        const sx = Math.cos(a) * 14;
        const sy = cy - 12 + Math.sin(a) * 14;
        p.line(0, cy - 12, sx, sy, C[4], starA);
        p.dot(sx, sy, WHITE, starA);
      }
      p.glow(0, cy - 12, 16, C[4], 0.45 * starA);
    }
  },
};

/**
 * 6. 凋零时光沙漏——怨灵枯朽衰老与幽冥虚弱专属，苍紫沙漏倒转飘落衰朽光尘
 */
export const fxTouhouWitherHourglass: PixelFxModule = {
  meta: {
    name: 'Touhou Wither Hourglass',
    desc: '苍紫冥界时光沙漏浮现并逆转流沙，洒下衰朽枯萎光尘',
    size: [110, 120],
    origin: [55, 76],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#150b2b', '#411f7a', '#7842c9', '#56d9d0', '#b8fff6', '#ffffff'],
      seed: 67,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.14, 0.4);
    if (env <= 0.005) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 67);
    const cy = -24;

    // 精致双三角像素沙漏框架（顶部宽盖 + 交叉沙杯 + 底部宽座）
    const w = 11;
    const h = 14;
    p.line(-w - 2, cy - h, w + 2, cy - h, C[4], env);
    p.line(-w - 2, cy + h, w + 2, cy + h, C[4], env);
    p.line(-w, cy - h, w, cy + h, C[3], env);
    p.line(w, cy - h, -w, cy + h, C[3], env);
    p.line(-w, cy - h, 0, cy, WHITE, env * 0.85);
    p.line(w, cy - h, 0, cy, C[4], env * 0.85);

    // 沙漏中心高速下坠的流沙像素线与底部堆沙
    const drain = clamp(t / D);
    for (let y = cy; y <= cy + h - 2; y += 2) {
      const flick = ((y + Math.floor(t * 24)) % 4 === 0) ? WHITE : C[4];
      p.dot(0, y, flick, env);
    }
    const pileR = 2 + drain * 7;
    p.line(-pileR, cy + h - 1, pileR, cy + h - 1, C[3], env);
    p.line(-pileR * 0.6, cy + h - 2, pileR * 0.6, cy + h - 2, C[4], env);
    p.glow(0, cy, 20, C[3], 0.36 * env);

    // 外围逆时针转动的衰老符环 + 飘落苍白衰朽尘埃
    drawPerspectiveRing(p, 0, -4, 22, 7, 28, -t * 2.8, C[2], C[4], env * 0.9, 4);
    for (let i = 0; i < 20; i++) {
      const px = (rand(S, i, 1) - 0.5) * 34;
      const py = cy - 14 + ((t * (20 + rand(S, i, 2) * 18) + rand(S, i, 3) * 40) % 44);
      p.dot(px + Math.sin(t * 3 + i) * 2, py, i % 3 === 0 ? WHITE : C[3], env * 0.85);
    }
  },
};

/**
 * 7. 魔力虹吸旋涡——小恶魔吸蓝/魔力汲取专属，双螺线紫青符文向核心急速塌缩抽蓝
 */
export const fxTouhouManaSiphon: PixelFxModule = {
  meta: {
    name: 'Touhou Mana Siphon',
    desc: '紫青双螺线魔力星流向核心高速塌缩虹吸，抽取目标灵力',
    size: [110, 110],
    origin: [55, 65],
    duration: 1.35,
    loop: false,
    fps: 30,
    options: {
      palette: ['#150b2b', '#411f7a', '#7842c9', '#56d9d0', '#b8fff6', '#ffffff'],
      seed: 73,
    },
  },
  draw(p, t, o) {
    const D = 1.35;
    const env = lifeEnvelope(t, D, 0.1, 0.34);
    if (env <= 0.005) return;

    const C = resolveRamp(o.palette, 6);
    const cy = -14;

    // 3 条向中心高速收缩的魔力虹吸螺线
    for (let arm = 0; arm < 3; arm++) {
      for (let k = 0; k < 22; k++) {
        const u = ((k / 22 + t * 1.6) % 1);
        const rad = (1 - u) * 30;
        const a = arm * (TAU / 3) + u * 5.2 + t * 4.5;
        const x = Math.cos(a) * rad;
        const y = cy + Math.sin(a) * rad * 0.72;
        const col = u > 0.75 ? WHITE : u > 0.4 ? C[4] : C[3];
        p.dot(x, y, col, env * Math.sin(u * Math.PI));
        if (k % 3 === 0) p.light(x, y, C[3], 0.3 * env);
      }
    }
    // 核心收缩灵核闪耀
    const pulse = 5 + Math.sin(t * 14) * 1.8;
    p.circle(0, cy, pulse, (d) => (d < 0.45 ? WHITE : C[4]), env);
    p.glow(0, cy, 22, C[3], 0.55 * env);
  },
};

// ============================================================================
// [B] 9 种差异化生灵/元素/亡灵召请大阵（终结 16× summon_rise 同质化！）
// ============================================================================

/**
 * 8. 妖精花环召请阵（雾湖妖精 / 座敷童子 / 妖精飞龙）
 */
export const fxTouhouSummonFairyRing: PixelFxModule = {
  meta: {
    name: 'Touhou Summon Fairy Ring',
    desc: '旋转花环符阵与翩跹升腾的五彩萤火妖精星尘',
    size: [120, 130],
    origin: [60, 96],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#09261d', '#196e52', '#3cd495', '#8cf5c4', '#e0ffef', '#ffffff'],
      seed: 101,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.14, 0.4);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 101);

    const r = 24 * smooth(0, 0.28, t);
    drawPerspectiveRing(p, 0, 0, r, r * 0.36, 36, t * 2.2, C[3], WHITE, env, 6);
    drawPerspectiveRing(p, 0, 0, r * 0.62, r * 0.22, 24, -t * 3.1, C[4], C[5], env * 0.85, 4);

    // 8 颗沿双螺旋翩跹盘旋上升的妖精萤火（带星光十字）
    for (let i = 0; i < 8; i++) {
      const u = clamp(t * 0.95 - i * 0.05);
      if (u <= 0) continue;
      const a = i * (TAU / 8) + t * 4.2;
      const rad = r * (0.95 - 0.35 * u);
      const x = Math.cos(a) * rad;
      const y = -u * 56 + Math.sin(a) * 6;
      const aDot = Math.sin(u * Math.PI) * env;
      p.dot(x, y, WHITE, aDot);
      p.dot(x + 1, y, C[4], aDot * 0.8);
      p.dot(x - 1, y, C[4], aDot * 0.8);
      p.dot(x, y - 1, C[3], aDot * 0.8);
      p.dot(x, y + 1, C[3], aDot * 0.8);
      p.glow(x, y, 7, C[3], 0.36 * aDot);
    }
    for (let i = 0; i < 16; i++) {
      const x = (rand(S, i, 1) - 0.5) * 38;
      const y = -((t * 32 + rand(S, i, 2) * 50) % 58);
      p.dot(x, y, i % 2 === 0 ? C[4] : WHITE, env * 0.75);
    }
    p.glow(0, -10, 26, C[3], 0.35 * env);
  },
};

/**
 * 9. 灵兽图腾破印阵（白狼妖犬 / 雪山白虎 / 山神螳螂）
 */
export const fxTouhouSummonBeastTotem: PixelFxModule = {
  meta: {
    name: 'Touhou Summon Beast Totem',
    desc: '裂地野性爪印冲击波与冲天灵兽气焰环',
    size: [120, 130],
    origin: [60, 96],
    duration: 1.45,
    loop: false,
    fps: 30,
    options: {
      palette: ['#1b1e2e', '#596a8c', '#9eb8db', '#d9ecff', '#f5faff', '#ffffff'],
      seed: 109,
    },
  },
  draw(p, t, o) {
    const D = 1.45;
    const env = lifeEnvelope(t, D, 0.08, 0.38);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);

    // 地面急速扩张的野性冲击环
    const waveR = 8 + 26 * smooth(0.02, 0.45, t);
    drawPerspectiveRing(p, 0, 2, waveR, waveR * 0.34, 34, t * 1.5, C[3], WHITE, env, 3);

    // 冲天而起的三道并行野性兽爪气柱
    const h = 48 * smooth(0.05, 0.38, t);
    for (let k = -1; k <= 1; k++) {
      const xBase = k * 10;
      const xTop = k * 14 + Math.sin(t * 8 + k) * 2;
      p.line(xBase, 2, xTop, 2 - h, C[3], env * 0.92);
      p.line(xBase + 1, 2, xTop + 1, 2 - h, WHITE, env);
      p.glowLine(xBase, 2, xTop, 2 - h, 6, C[3], 0.35 * env);
    }
    // 顶部爆发兽嚎音浪环
    const roarR = 6 + 20 * smooth(0.2, 0.8, t);
    const roarA = smooth(0.18, 0.34, t) * (1 - smooth(0.6, 1.05, t));
    if (roarA > 0.04) {
      drawPerspectiveRing(p, 0, -24, roarR, roarR * 0.42, 28, 0, C[4], WHITE, roarA, 4);
    }
    p.glow(0, -14, 28, C[3], 0.42 * env);
  },
};

/**
 * 10. 疾风天狗羽阵（七曜风精 / 鸦天狗 / 飞行术）
 */
export const fxTouhouSummonWind: PixelFxModule = {
  meta: {
    name: 'Touhou Summon Wind',
    desc: '多层青白螺旋疾风刃环与旋舞神羽红枫',
    size: [120, 136],
    origin: [60, 102],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#0a1e30', '#1c5c8a', '#42b8eb', '#99ebff', '#e3fbff', '#ffffff'],
      seed: 113,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.1, 0.38);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);

    // 5 层盘旋上升的透明风刃椭圆圈
    for (let layer = 0; layer < 5; layer++) {
      const u = ((t * 1.3 + layer * 0.2) % 1);
      const y = 2 - u * 64;
      const rad = 10 + u * 20;
      const la = Math.sin(u * Math.PI) * env;
      const a0 = t * (7 + layer) + layer * 1.4;
      for (let k = 0; k < 18; k++) {
        const a = a0 + (k / 18) * 3.4;
        p.dot(Math.cos(a) * rad, y + Math.sin(a) * rad * 0.28, k < 5 ? WHITE : C[4], la);
      }
      p.glow(0, y, rad, C[3], 0.16 * la);
    }

    // 14 片随飓风切线甩出的光羽
    for (let i = 0; i < 14; i++) {
      const a = t * 5.2 + i * 0.9;
      const rad = 14 + (i % 4) * 5;
      const x = Math.cos(a) * rad;
      const y = -8 - ((t * 36 + i * 7) % 58);
      p.line(x, y, x - Math.sin(a) * 4, y + 2, i % 3 === 0 ? WHITE : C[4], env * 0.9);
    }
  },
};

/**
 * 11. 地脉岩晶隆起阵（七曜土精 / 石肤术 / 巨力术）
 */
export const fxTouhouSummonEarth: PixelFxModule = {
  meta: {
    name: 'Touhou Summon Earth',
    desc: '琥珀地脉符环裂开，六块发光魔岩悬浮环绕升腾',
    size: [120, 126],
    origin: [60, 94],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#24190c', '#6b4822', '#b58038', '#e6bd6b', '#fff0bd', '#ffffff'],
      seed: 127,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.1, 0.38);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);

    // 地面六芒地脉震纹
    const r = 24 * smooth(0, 0.22, t);
    drawPerspectiveRing(p, 0, 2, r, r * 0.35, 30, 0, C[3], C[5], env, 5);
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6;
      p.line(0, 2, Math.cos(a) * r, 2 + Math.sin(a) * r * 0.35, C[4], env * 0.75);
    }

    // 6 块自地底震出并环绕盘旋悬浮的立体棱角琥珀魔岩块（暗石底 + 亮晶棱边！）
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6 + t * 2.1;
      const lift = smooth(0.06, 0.45, t) * (16 + (i % 3) * 10);
      const rx = Math.cos(a) * 20;
      const ry = 0 - lift + Math.sin(a) * 6 + Math.sin(t * 5 + i) * 2;
      p.circle(rx, ry, 4.2, (d) => (d < 0.45 ? C[3] : d < 0.78 ? C[2] : C[1]), env);
      p.line(rx - 3, ry - 1, rx, ry - 4, C[4], env);
      p.line(rx, ry - 4, rx + 3, ry - 1, WHITE, env);
      p.line(rx + 3, ry - 1, rx, ry + 4, C[2], env);
      p.line(rx, ry + 4, rx - 3, ry - 1, C[1], env);
      p.glow(rx, ry, 7, C[3], 0.28 * env);
    }
    p.glow(0, -6, 26, C[3], 0.35 * env);
  },
};

/**
 * 12. 蓬莱业火涅槃阵（七曜火精 / 蓬莱不死鸟）
 */
export const fxTouhouSummonPhoenix: PixelFxModule = {
  meta: {
    name: 'Touhou Summon Phoenix',
    desc: '炽烈朱雀双焰翼展翅冲天，螺旋金红不灭羽瀑漫天飞舞',
    size: [150, 146],
    origin: [75, 108],
    duration: 1.65,
    loop: false,
    fps: 30,
    options: {
      palette: ['#290c06', '#8c2612', '#f05c22', '#ffbe3b', '#fff7b8', '#ffffff'],
      seed: 131,
    },
  },
  draw(p, t, o) {
    const D = 1.65;
    const env = lifeEnvelope(t, D, 0.1, 0.42);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 131);

    const spread = smooth(0.05, 0.42, t);
    const cy = -18;
    // 地面业火轮环
    drawPerspectiveRing(p, 0, 2, 26 * spread, 9 * spread, 36, t * 3.2, C[2], C[4], env, 4);

    // 左右对称展开的炽烈朱雀火焰双翼（各 6 根弧形飞扬火羽！）
    for (const side of [-1, 1]) {
      for (let f = 0; f < 6; f++) {
        const u = f / 5;
        const len = (22 + u * 26) * spread;
        const baseAng = side === 1 ? -0.35 - u * 0.72 : Math.PI + 0.35 + u * 0.72;
        const flap = Math.sin(t * 7 + u * 2) * 0.12 * side;
        const ang = baseAng + flap;
        const x1 = Math.cos(ang) * len;
        const y1 = cy + Math.sin(ang) * len * 0.85;
        p.line(side * 4, cy + 4, x1, y1, f > 2 ? C[3] : C[2], env);
        p.line(side * 4, cy + 3, x1 * 0.85, y1 * 0.92, f > 3 ? WHITE : C[4], env);
        p.glow(x1, y1, 9, C[3], 0.32 * env);
      }
    }

    // 26 颗冲天飞舞的炽金火羽星屑
    for (let i = 0; i < 26; i++) {
      const x = (rand(S, i, 1) - 0.5) * 62 + Math.sin(t * 4 + i) * 5;
      const y = 2 - ((t * (38 + rand(S, i, 2) * 32) + rand(S, i, 3) * 50) % 86);
      const a = smooth(-84, -60, y) * env;
      p.dot(x, y, i % 3 === 0 ? WHITE : C[4], a);
      p.light(x, y, C[3], 0.3 * a);
    }
    p.glow(0, cy, 34, C[3], 0.55 * env);
  },
};

/**
 * 13. 玄武清泉波纹阵（七曜水精 / 溪谷河童 / 召唤船只）
 */
export const fxTouhouSummonWater: PixelFxModule = {
  meta: {
    name: 'Touhou Summon Water',
    desc: '三重扩散晶莹水涟漪与螺旋喷涌水花清泉泡沫',
    size: [120, 126],
    origin: [60, 94],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#0a1e30', '#1c5c8a', '#42b8eb', '#99ebff', '#e3fbff', '#ffffff'],
      seed: 137,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.1, 0.38);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 137);

    // 3 重连续扩散的地面清泉水波涟漪
    for (let w = 0; w < 3; w++) {
      const u = ((t * 1.15 + w * 0.33) % 1);
      const rad = 6 + u * 28;
      drawPerspectiveRing(p, 0, 2, rad, rad * 0.34, 32, t, C[3], WHITE, (1 - u) * env, 5);
    }

    // 双股螺旋跃起的水柱波花弧
    for (let s = 0; s < 2; s++) {
      for (let k = 0; k < 20; k++) {
        const u = k / 20;
        const h = 44 * smooth(0.04, 0.45, t) * u;
        const a = t * 5.2 + s * Math.PI + u * 3.8;
        const rad = 14 * (1 - u * 0.55);
        const x = Math.cos(a) * rad;
        const y = 2 - h;
        p.dot(x, y, u > 0.7 ? WHITE : C[4], env);
        p.dot(x + 1, y, C[3], env * 0.8);
      }
    }

    // 14 颗晶莹水沫泡
    for (let i = 0; i < 14; i++) {
      const x = (rand(S, i, 1) - 0.5) * 34;
      const y = -((t * 28 + rand(S, i, 2) * 44) % 52);
      p.circle(x, y, 1.8, (d) => (d < 0.5 ? WHITE : C[4]), env * 0.85);
    }
    p.glow(0, -10, 24, C[3], 0.35 * env);
  },
};

/**
 * 14. 太阳花田繁花召请阵（竹林灵弓 / 幽香魔花 / 圣林白泽 / 再生术）
 */
export const fxTouhouSummonFlora: PixelFxModule = {
  meta: {
    name: 'Touhou Summon Flora',
    desc: '旋转八瓣翡翠金莲繁花阵绽放，飘扬治愈花粉与嫩叶光瓣',
    size: [120, 126],
    origin: [60, 92],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#0a241b', '#1b6647', '#3cb878', '#8ce89f', '#ebffbd', '#ffffff'],
      seed: 149,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.14, 0.4);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 149);

    const bloom = smooth(0, 0.35, t);
    const spin = t * 1.4;
    // 地面绽放的八瓣透视繁花图阵
    for (let k = 0; k < 8; k++) {
      const a = spin + (k * TAU) / 8;
      const px = Math.cos(a) * 24 * bloom;
      const py = Math.sin(a) * 9 * bloom;
      p.line(0, 0, px, py, C[3], env);
      p.circle(px * 0.72, py * 0.72, 3.2 * bloom, (d) => (d < 0.5 ? C[4] : C[2]), env * 0.9);
      p.dot(px, py, WHITE, env);
    }
    p.glow(0, 0, 24, C[3], 0.38 * env);

    // 上扬旋转的发光花瓣与金色花粉
    for (let i = 0; i < 20; i++) {
      const a = rand(S, i, 1) * TAU + t * 2.5;
      const rad = 8 + rand(S, i, 2) * 18;
      const y = -((t * 30 + rand(S, i, 3) * 46) % 58);
      const x = Math.cos(a) * rad;
      p.dot(x, y, i % 3 === 0 ? WHITE : C[4], env * 0.9);
      p.dot(x + 1, y + 1, C[3], env * 0.75);
      p.light(x, y, C[3], 0.25 * env);
    }
  },
};

/**
 * 15. 黄泉冥碑破土召请阵（亡灵招魂 / 复生 / 骷髅 / 幽灵）
 */
export const fxTouhouSummonCrypt: PixelFxModule = {
  meta: {
    name: 'Touhou Summon Crypt',
    desc: '六芒幽冥死灵阵裂地展开，升起冥碑符柱与苍白鬼火骨屑',
    size: [120, 134],
    origin: [60, 100],
    duration: 1.55,
    loop: false,
    fps: 30,
    options: {
      palette: ['#150b2b', '#411f7a', '#7842c9', '#56d9d0', '#b8fff6', '#ffffff'],
      seed: 157,
    },
  },
  draw(p, t, o) {
    const D = 1.55;
    const env = lifeEnvelope(t, D, 0.12, 0.42);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 157);

    const open = smooth(0, 0.26, t);
    // 地面六芒星幽冥阵
    drawPerspectiveRing(p, 0, 2, 24 * open, 8.5 * open, 34, -t * 1.6, C[2], C[4], env, 5);
    for (let tri = 0; tri < 2; tri++) {
      for (let i = 0; i < 3; i++) {
        const a0 = -t * 1.1 + tri * (Math.PI / 3) + (i * TAU) / 3;
        const a1 = a0 + TAU / 3;
        p.line(
          Math.cos(a0) * 20 * open,
          2 + Math.sin(a0) * 7 * open,
          Math.cos(a1) * 20 * open,
          2 + Math.sin(a1) * 7 * open,
          C[3],
          env * 0.85,
        );
      }
    }

    // 左右两道升腾的幽青冥碑虚影与飞散鬼火
    const h = 38 * smooth(0.1, 0.48, t);
    for (const sx of [-14, 14]) {
      p.line(sx, 2, sx, 2 - h, C[3], env * 0.85);
      p.line(sx - 2, 2 - h * 0.7, sx + 2, 2 - h * 0.7, C[4], env);
      p.glow(sx, 2 - h, 8, C[4], 0.42 * env);
    }
    for (let i = 0; i < 20; i++) {
      const x = (rand(S, i, 1) - 0.5) * 34;
      const y = 2 - ((t * 34 + rand(S, i, 2) * 48) % 62);
      p.dot(x, y, i % 3 === 0 ? WHITE : C[4], env * 0.9);
      p.light(x, y, C[3], 0.28 * env);
    }
    p.glow(0, -10, 26, C[3], 0.4 * env);
  },
};

/**
 * 16. 极寒深渊霜门阵（深渊隙间恶魔「深渊冰魔召唤」专属！）
 */
export const fxTouhouSummonIceAbyss: PixelFxModule = {
  meta: {
    name: 'Touhou Summon Ice Abyss',
    desc: '紫红深渊隙间底环叠加极光冰蓝六角霜门，唤出深渊冰魔',
    size: [130, 140],
    origin: [65, 102],
    duration: 1.6,
    loop: false,
    fps: 30,
    options: {
      palette: ['#130b2e', '#3b2478', '#7852d6', '#5ce2ff', '#d6faff', '#ffffff'],
      seed: 163,
    },
  },
  draw(p, t, o) {
    const D = 1.6;
    const env = lifeEnvelope(t, D, 0.12, 0.42);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 163);

    const open = smooth(0, 0.28, t);
    // 外环深渊紫电阵 + 内环冰蓝六角雪阵
    drawPerspectiveRing(p, 0, 2, 28 * open, 10 * open, 38, t * 2.2, C[2], C[4], env, 4);
    drawPerspectiveRing(p, 0, 2, 16 * open, 5.8 * open, 24, -t * 3.0, C[3], WHITE, env, 4);

    // 竖立在空中的旋转寒霜六角门轮
    const cy = -26;
    const gr = 18 * open;
    for (let k = 0; k < 6; k++) {
      const a0 = t * 1.8 + (k * TAU) / 6;
      const a1 = a0 + TAU / 6;
      p.line(Math.cos(a0) * gr, cy + Math.sin(a0) * gr, Math.cos(a1) * gr, cy + Math.sin(a1) * gr, C[3], env);
      p.line(0, cy, Math.cos(a0) * gr, cy + Math.sin(a0) * gr, C[4], env * 0.65);
      p.dot(Math.cos(a0) * gr, cy + Math.sin(a0) * gr, WHITE, env);
    }

    // 冰晶尖刺碎屑迸发
    for (let i = 0; i < 22; i++) {
      const a = rand(S, i, 1) * TAU;
      const dist = 6 + (16 + rand(S, i, 2) * 24) * smooth(0.15, 0.9, t);
      const px = Math.cos(a) * dist;
      const py = cy + Math.sin(a) * dist * 0.85;
      p.dot(px, py, i % 2 === 0 ? WHITE : C[4], env * 0.92);
      p.light(px, py, C[3], 0.34 * env);
    }
    p.glow(0, cy, 28, C[3], 0.5 * env);
  },
};

// ============================================================================
// [C] 10 种东方专属结界/弹幕/星轨/魔镜/锁链/音律特效（彻底去重！）
// ============================================================================

/**
 * 17. 博丽御札旋转封魔环（取代大量重复 divine_shield：8 张立体公转红白灵符！）
 */
export const fxTouhouOfudaSealRing: PixelFxModule = {
  meta: {
    name: 'Touhou Ofuda Seal Ring',
    desc: '8 张双色像素御札围绕目标 3D 轨道高速公转封魔护体',
    size: [110, 110],
    origin: [55, 68],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#260916', '#7d1831', '#d93855', '#ff7a8a', '#ffe3a8', '#ffffff'],
      seed: 173,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.12, 0.38);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const cy = -16;
    const rad = 22 * (0.75 + 0.25 * smooth(0, 0.25, t));

    drawPerspectiveRing(p, 0, cy + 16, rad, rad * 0.34, 30, t * 2.4, C[3], C[4], env * 0.75, 5);

    // 8 张沿倾斜 3D 环高速公转的精致像素御札符纸
    for (let i = 0; i < 8; i++) {
      const a = t * 3.4 + (i * TAU) / 8;
      const x = Math.cos(a) * rad;
      const y = cy + Math.sin(a) * 10 + Math.cos(a * 2) * 3;
      const front = Math.sin(a) >= 0;
      const fa = (front ? 1.0 : 0.6) * env;
      // 3×5 精致白底红纹御札
      p.line(x - 1, y - 2, x + 1, y - 2, WHITE, fa);
      p.line(x - 1, y - 1, x + 1, y - 1, WHITE, fa);
      p.line(x - 1, y, x + 1, y, WHITE, fa);
      p.line(x - 1, y + 1, x + 1, y + 1, WHITE, fa);
      p.line(x - 1, y + 2, x + 1, y + 2, C[4], fa);
      p.line(x, y - 1, x, y + 1, C[2], fa);
      if (front) p.glow(x, y, 6, C[3], 0.32 * fa);
    }
    p.glow(0, cy, 24, C[3], 0.32 * env);
  },
};

/**
 * 18. 四象棱镜守护穹顶（生命系四派系守护混沌/死亡/自然/秩序 Ward 专属多面体结界！）
 */
export const fxTouhouWardDomePrism: PixelFxModule = {
  meta: {
    name: 'Touhou Ward Dome Prism',
    desc: '旋转多面体四象棱镜水晶结界穹顶，按守护派系呈现璀璨棱光',
    size: [110, 110],
    origin: [55, 68],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#0f1a38', '#26468c', '#4d82e0', '#96c2ff', '#dff0ff', '#ffffff'],
      seed: 181,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.12, 0.38);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const cy = -16;
    const R = 23 * smooth(0, 0.24, t);
    const spin = t * 1.9;

    // 旋转八棱水晶顶/中/底三环连线，构筑立体多面体穹顶
    const topY = cy - R * 0.92;
    const botY = cy + R * 0.85;
    for (let i = 0; i < 6; i++) {
      const a0 = spin + (i * TAU) / 6;
      const a1 = a0 + TAU / 6;
      const mx0 = Math.cos(a0) * R;
      const my0 = cy + Math.sin(a0) * R * 0.38;
      const mx1 = Math.cos(a1) * R;
      const my1 = cy + Math.sin(a1) * R * 0.38;
      p.line(mx0, my0, mx1, my1, C[4], env);
      p.line(0, topY, mx0, my0, i % 2 === 0 ? WHITE : C[3], env * 0.92);
      p.line(0, botY, mx0, my0, C[3], env * 0.78);
      p.dot(mx0, my0, WHITE, env);
    }
    p.dot(0, topY, WHITE, env);
    p.glow(0, topY, 10, C[4], 0.45 * env);
    p.glow(0, cy, 28, C[3], 0.36 * env);
  },
};

/**
 * 19. 博丽阴阳玉旋转星环（博丽灵梦「梦想天生」/ 祈祷 / 神圣干预专属！）
 */
export const fxTouhouYinYangDream: PixelFxModule = {
  meta: {
    name: 'Touhou Yin Yang Dream',
    desc: '博丽太极阴阳玉旋转升腾，绽放七彩神社星光弹幕与同心神乐环',
    size: [150, 150],
    origin: [75, 92],
    duration: 1.75,
    loop: false,
    fps: 30,
    options: {
      palette: ['#260916', '#7d1831', '#d93855', '#ff7a8a', '#ffe3a8', '#ffffff'],
      seed: 191,
    },
  },
  draw(p, t, o) {
    const D = 1.75;
    const env = lifeEnvelope(t, D, 0.14, 0.45);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const cy = -18;
    const R = 16 * smooth(0, 0.25, t);
    const rot = t * 3.2;

    // 旋转太极阴阳玉核心（阴阳双鱼分界 + 双眼）
    if (R > 2) {
      for (let y = Math.floor(-R); y <= Math.ceil(R); y++) {
        for (let x = Math.floor(-R); x <= Math.ceil(R); x++) {
          const d2 = x * x + y * y;
          if (d2 > R * R) continue;
          const rx = x * Math.cos(-rot) - y * Math.sin(-rot);
          const ry = x * Math.sin(-rot) + y * Math.cos(-rot);
          const dTop = Math.hypot(rx, ry + R * 0.5);
          const dBot = Math.hypot(rx, ry - R * 0.5);
          let isYang = rx >= 0;
          if (dTop < R * 0.5) isYang = true;
          if (dBot < R * 0.5) isYang = false;
          if (dTop < R * 0.18) isYang = false;
          if (dBot < R * 0.18) isYang = true;
          const isEdge = d2 > (R - 1.3) * (R - 1.3);
          const col = isEdge ? C[4] : isYang ? WHITE : C[2];
          p.blend(x, cy + y, col, (isEdge ? 1 : 0.88) * env);
        }
      }
    }

    // 外围 6 枚公转阴阳玉星光弹幕
    const orbR = 30 * smooth(0.08, 0.42, t);
    for (let i = 0; i < 6; i++) {
      const a = -rot * 0.85 + (i * TAU) / 6;
      const ox = Math.cos(a) * orbR;
      const oy = cy + Math.sin(a) * orbR * 0.72;
      p.circle(ox, oy, 3.2, (d) => (d < 0.5 ? WHITE : i % 2 === 0 ? C[3] : C[4]), env);
      p.glow(ox, oy, 10, i % 2 === 0 ? C[3] : C[4], 0.42 * env);
    }
    p.glow(0, cy, 38, C[3], 0.48 * env);
  },
};

/**
 * 20. 月都浑天星轨仪（八意永琳「天文密葬法」/ 精准 / 洞悉专属！）
 */
export const fxTouhouLunarAstrolabe: PixelFxModule = {
  meta: {
    name: 'Touhou Lunar Astrolabe',
    desc: '三层精密交错公转的苍月鎏金浑天星轨环与银蓝星针',
    size: [150, 150],
    origin: [75, 92],
    duration: 1.75,
    loop: false,
    fps: 30,
    options: {
      palette: ['#0f1a38', '#26468c', '#4d82e0', '#96c2ff', '#dff0ff', '#ffffff'],
      seed: 197,
    },
  },
  draw(p, t, o) {
    const D = 1.75;
    const env = lifeEnvelope(t, D, 0.14, 0.45);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const cy = -18;
    const scale = smooth(0, 0.28, t);

    // 3 层不同倾角交错旋转的浑天星轨椭圆环
    const rings = [
      { r: 30 * scale, tilt: 0.28, flat: 0.38, spd: 2.2, col: C[4] },
      { r: 24 * scale, tilt: -0.52, flat: 0.44, spd: -2.9, col: C[3] },
      { r: 17 * scale, tilt: 0.95, flat: 0.55, spd: 3.6, col: WHITE },
    ];
    for (let ri = 0; ri < rings.length; ri++) {
      const rg = rings[ri];
      const ct = Math.cos(rg.tilt);
      const st = Math.sin(rg.tilt);
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * TAU + t * rg.spd;
        const lx = Math.cos(a) * rg.r;
        const ly = Math.sin(a) * rg.r * rg.flat;
        const rx = lx * ct - ly * st;
        const ry = cy + lx * st + ly * ct;
        p.dot(rx, ry, i % 10 === 0 ? WHITE : rg.col, env * 0.92);
        if (i % 10 === 0) p.glow(rx, ry, 7, C[4], 0.38 * env);
      }
    }

    // 中央新月圣印与十字星芒
    drawTinyStar(p, 0, cy, 9 * scale, t * 2, C[4], WHITE, env);
    p.glow(0, cy, 34, C[3], 0.45 * env);
  },
};

/**
 * 21. 月华玉兔蜕变光轮（竹林妖怪兔「兔化」专属变身特效！）
 */
export const fxTouhouLunarHareBloom: PixelFxModule = {
  meta: {
    name: 'Touhou Lunar Hare Bloom',
    desc: '皎洁满月光轮于身后升起，樱粉与月白花瓣螺旋聚拢璀璨蜕变',
    size: [130, 130],
    origin: [65, 86],
    duration: 1.55,
    loop: false,
    fps: 30,
    options: {
      palette: ['#240e24', '#6e2861', '#c752a0', '#ff99cc', '#ffe0f0', '#ffffff'],
      seed: 211,
    },
  },
  draw(p, t, o) {
    const D = 1.55;
    const env = lifeEnvelope(t, D, 0.12, 0.42);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const cy = -20;

    // 背后升起的皎洁弯月光轮 + 顶部灵动玉兔双耳星光轮廓！
    const moonR = 17 * smooth(0, 0.26, t);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU + t * 1.4;
      const mx = Math.cos(a) * moonR;
      const my = cy + Math.sin(a) * moonR;
      p.dot(mx, my, i % 4 === 0 ? WHITE : C[4], env);
      if (Math.cos(a - 0.5) > 0.1) {
        // 弯月明亮内弧
        p.dot(mx * 0.84, cy + Math.sin(a) * moonR * 0.84, C[3], env * 0.9);
      }
    }
    // 顶部俏皮可爱的发光玉兔双耳星轨弧
    const earH = 15 * smooth(0.1, 0.36, t);
    for (const side of [-1, 1]) {
      const baseX = side * 6;
      const baseY = cy - moonR + 2;
      const tipX = side * 11;
      const tipY = baseY - earH;
      p.line(baseX - side * 2, baseY, tipX, tipY, C[4], env);
      p.line(baseX + side * 2, baseY, tipX, tipY, WHITE, env);
      p.glow(tipX, tipY, 7, C[3], 0.4 * env);
    }

    // 18 片樱月花瓣先内聚再轰然绽放！
    const burst = t < 0.42 ? 1 - t * 1.45 : (t - 0.42) * 2.1;
    const rad = Math.max(8, 28 * Math.abs(burst));
    for (let i = 0; i < 18; i++) {
      const a = (i * TAU) / 18 + t * 4.2;
      const x = Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad * 0.82;
      p.dot(x, y, i % 2 === 0 ? WHITE : C[3], env);
      p.dot(x + 1, y, C[4], env * 0.85);
      p.light(x, y, C[3], 0.36 * env);
    }
    p.glow(0, cy, 28, C[3], 0.42 * env);
  },
};

/**
 * 22. 厄祟魔锁链缚（法术枷锁 / 怯懦 / 诅咒 / 群体诅咒专属）
 */
export const fxTouhouCrimsonShackle: PixelFxModule = {
  meta: {
    name: 'Touhou Crimson Shackle',
    desc: '四道炽亮像素厄祟锁链自四方交叉疾射锁死目标，迸出诅咒星火',
    size: [120, 120],
    origin: [60, 72],
    duration: 1.45,
    loop: false,
    fps: 30,
    options: {
      palette: ['#260a1a', '#731847', '#c92e78', '#ff70ad', '#ffd9eb', '#ffffff'],
      seed: 223,
    },
  },
  draw(p, t, o) {
    const D = 1.45;
    const env = lifeEnvelope(t, D, 0.08, 0.38);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const cy = -16;
    const lock = smooth(0.04, 0.28, t);

    // 4 道自四角交叉射向中心的发光链环锁链
    const corners: Array<[number, number]> = [
      [-34, cy - 26],
      [34, cy - 26],
      [-34, cy + 22],
      [34, cy + 22],
    ];
    for (let ci = 0; ci < corners.length; ci++) {
      const [sx, sy] = corners[ci];
      const ex = sx * (1 - lock);
      const ey = sy + (cy - sy) * lock;
      const steps = 12;
      for (let k = 0; k <= steps; k++) {
        const u = k / steps;
        const px = sx + (ex - sx) * u;
        const py = sy + (ey - sy) * u;
        const isLink = k % 2 === 0;
        p.dot(px, py, isLink ? WHITE : C[3], env);
        if (isLink) {
          p.dot(px + 1, py, C[4], env * 0.85);
          p.dot(px - 1, py, C[2], env * 0.85);
        }
      }
    }

    // 中心锁扣封环与锁死爆发火花
    const ringA = smooth(0.24, 0.36, t) * env;
    if (ringA > 0.05) {
      drawPerspectiveRing(p, 0, cy, 11, 11, 24, t * 2, C[3], WHITE, ringA, 4);
      p.glow(0, cy, 22, C[3], 0.55 * ringA);
    }
  },
};

/**
 * 23. 贤者折光魔镜（痛楚镜面 / 魔法镜 / 驱散 / 群体驱散专属）
 */
export const fxTouhouMirrorPrism: PixelFxModule = {
  meta: {
    name: 'Touhou Mirror Prism',
    desc: '双面悬浮对映的像素棱镜魔镜折射星光束，迸出七彩结晶微芒',
    size: [120, 120],
    origin: [60, 74],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#122138', '#3466a8', '#66c4eb', '#b8f0ff', '#fff0c2', '#ffffff'],
      seed: 229,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.1, 0.4);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const cy = -16;
    const open = smooth(0, 0.25, t);

    // 左右两面悬浮对映的菱形水晶魔镜
    for (const side of [-1, 1]) {
      const mx = side * 19 * open;
      const my = cy + Math.sin(t * 4 + side) * 2;
      p.line(mx, my - 12, mx + side * 4, my, WHITE, env);
      p.line(mx + side * 4, my, mx, my + 12, C[4], env);
      p.line(mx, my + 12, mx - side * 4, my, C[3], env);
      p.line(mx - side * 4, my, mx, my - 12, WHITE, env);
      p.line(mx, my - 9, mx, my + 9, C[4], env * 0.7);
      p.glow(mx, my, 12, C[3], 0.4 * env);
    }

    // 双镜间来回折射的 Z 字高能灵光束
    const beamA = smooth(0.2, 0.36, t) * env;
    if (beamA > 0.05) {
      const mx = 17 * open;
      p.line(-mx, cy - 6, mx, cy, WHITE, beamA);
      p.line(mx, cy, -mx, cy + 7, C[4], beamA);
      p.glowLine(-mx, cy - 6, mx, cy, 5, C[3], 0.38 * beamA);
      p.glowLine(mx, cy, -mx, cy + 7, 5, C[4], 0.34 * beamA);
      drawTinyStar(p, 0, cy, 7, t * 4, C[4], WHITE, beamA);
    }
  },
};

/**
 * 24. 东方螺旋五芒星弹幕（魔理沙星弹 / 星火 / 魔矢 / 流星爆发专属！）
 */
export const fxTouhouStarDanmaku: PixelFxModule = {
  meta: {
    name: 'Touhou Star Danmaku',
    desc: '12 颗旋转像素五芒星沿东方对数螺线华丽绽放飞旋',
    size: [140, 140],
    origin: [70, 82],
    duration: 1.45,
    loop: false,
    fps: 30,
    options: {
      palette: ['#24140a', '#7c4312', '#d98a1c', '#f7ca45', '#fff29c', '#ffffff'],
      seed: 233,
    },
  },
  draw(p, t, o) {
    const D = 1.45;
    const env = lifeEnvelope(t, D, 0.08, 0.4);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const cy = -14;
    const expand = smooth(0.02, 0.85, t);

    // 12 颗旋转五角星沿双层东方弹幕螺线绽放
    for (let i = 0; i < 12; i++) {
      const outer = i < 8;
      const a = (i * TAU) / (outer ? 8 : 4) + t * (outer ? 2.6 : -3.4);
      const rad = (outer ? 36 : 20) * expand;
      const sx = Math.cos(a) * rad;
      const sy = cy + Math.sin(a) * rad * 0.82;
      drawTinyStar(p, sx, sy, outer ? 4.2 : 3.2, t * 6 + i, outer ? C[3] : C[4], WHITE, env);
    }
    p.glow(0, cy, 28, C[3], 0.45 * env);
  },
};

/**
 * 25. 西行妖冥樱漩涡（幽冥吸魂 / 悲伤 / 群体悲伤 / 亡灵挽歌专属）
 */
export const fxTouhouSakuraVortex: PixelFxModule = {
  meta: {
    name: 'Touhou Sakura Vortex',
    desc: '深粉幽紫冥樱花岚绕体疾旋，中心绽开西行妖五瓣冥樱印',
    size: [130, 130],
    origin: [65, 86],
    duration: 1.55,
    loop: false,
    fps: 30,
    options: {
      palette: ['#240e24', '#6e2861', '#c752a0', '#ff99cc', '#ffe0f0', '#ffffff'],
      seed: 239,
    },
  },
  draw(p, t, o) {
    const D = 1.55;
    const env = lifeEnvelope(t, D, 0.12, 0.42);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const cy = -16;

    // 中心旋转五瓣冥樱印
    const rCore = 12 * smooth(0, 0.28, t);
    for (let k = 0; k < 5; k++) {
      const a = t * 2.1 + (k * TAU) / 5;
      const px = Math.cos(a) * rCore;
      const py = cy + Math.sin(a) * rCore;
      p.circle(px, py, 3.0, (d) => (d < 0.5 ? C[4] : C[3]), env * 0.9);
    }
    p.dot(0, cy, WHITE, env);

    // 26 片高速螺旋盘旋升腾的冥樱花瓣风暴
    for (let i = 0; i < 26; i++) {
      const u = ((t * 0.9 + i / 26) % 1);
      const a = i * 1.15 + t * 5.2;
      const rad = 12 + Math.sin(u * Math.PI) * 20;
      const x = Math.cos(a) * rad;
      const y = 4 - u * 54 + Math.sin(a) * 5;
      const pa = Math.sin(u * Math.PI) * env;
      p.dot(x, y, i % 3 === 0 ? WHITE : C[4], pa);
      p.dot(x + Math.cos(a + 1) * 1.5, y + Math.sin(a + 1) * 1.5, C[3], pa * 0.9);
      if (i % 4 === 0) p.light(x, y, C[3], 0.3 * pa);
    }
    p.glow(0, cy, 28, C[3], 0.4 * env);
  },
};

/**
 * 26. 神乐金铃音律波纹（欢欣 / 群体狂热 / 宁静之歌 / 幸运 / 群体幸运专属）
 */
export const fxTouhouShrineBellRipple: PixelFxModule = {
  meta: {
    name: 'Touhou Shrine Bell Ripple',
    desc: '清脆扩散的三重金白神乐铃音律涟漪与跃动招福星符',
    size: [130, 126],
    origin: [65, 82],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#291a08', '#8a5c14', '#d9a42e', '#ffe066', '#fff5b8', '#ffffff'],
      seed: 241,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.1, 0.4);
    if (env <= 0.005) return;
    const C = resolveRamp(o.palette, 6);
    const cy = -18;

    // 3 重清脆扩散的同心音律波纹
    for (let r = 0; r < 3; r++) {
      const u = ((t * 1.2 + r * 0.33) % 1);
      const rad = 6 + u * 30;
      const ra = (1 - u) * env;
      drawPerspectiveRing(p, 0, cy, rad, rad * 0.72, 34, t * 1.5, C[3], WHITE, ra, 6);
    }

    // 6 枚欢快上扬的像素小音符 + 顶部闪烁神乐金星
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6 + t * 1.6;
      const nx = Math.cos(a) * (16 + t * 10);
      const ny = cy + Math.sin(a) * 10 - t * 18;
      // 精致像素八分音符（符头 + 符干 + 符尾）
      p.circle(nx, ny, 1.6, () => C[4], env);
      p.line(nx + 1, ny, nx + 1, ny - 5, WHITE, env);
      p.line(nx + 1, ny - 5, nx + 4, ny - 4, C[3], env);
      p.light(nx, ny, C[3], 0.3 * env);
    }
    drawTinyStar(p, 0, cy - 10, 6.5, t * 3, C[4], WHITE, env);
    p.glow(0, cy, 24, C[3], 0.4 * env);
  },
};

/**
 * 27. 幽冥暗影缠蔓（取代存在 Math.pow(负数,0.75)->NaN->p.line 永久死循环漏洞的第三方 shadow-tendrils）
 * —— 适用于「枯荣凋零」「幽冥蚀力」「冥雾倦怠」等单体与全屏 AOE 衰弱术式，60fps 多目标并行零卡顿！
 */
export const fxTouhouShadowTendrils: PixelFxModule = {
  meta: {
    name: 'Touhou Shadow Tendrils',
    desc: '幽紫冥界法环裂开涌出五条盘旋缠绕的幽冥影蔓与衰朽星尘，无脏黑底且零死循环风险',
    size: [120, 120],
    origin: [60, 88],
    duration: 1.45,
    loop: false,
    fps: 30,
    options: {
      palette: ['#0a0717', '#261a4f', '#523c99', '#9982e0', '#dbd0ff', '#ffffff'],
      seed: 193,
    },
  },
  draw(p, t, o) {
    const D = 1.45;
    const env = lifeEnvelope(t, D, 0.1, 0.38);
    if (env <= 0.005) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 193);
    const open = smooth(0.02, 0.24, t) * (1 - smooth(0.95, D, t));

    // 地面双层幽紫冥环（透视扁环，零黑块污染）
    const rx = 24 * open;
    const ry = 8.5 * open;
    if (rx > 1.5) {
      drawPerspectiveRing(p, 0, 2, rx, ry, 28, -t * 2.4, C[2], C[4], env * 0.92, 5);
      drawPerspectiveRing(p, 0, 2, rx * 0.58, ry * 0.58, 18, t * 3.1, C[3], WHITE, env * 0.78, 4);
      p.glow(0, 0, rx * 1.15, C[3], 0.34 * env * open);
    }

    // 5 条破土盘旋攀升的幽冥影蔓（严格 clamp(1 - u, 0, 1) 杜绝任何负数开方/NaN！）
    const bases = [-16, -8, 0, 9, 17];
    for (let ti = 0; ti < bases.length; ti++) {
      const delay = ti * 0.045;
      const lt = t - delay;
      if (lt <= 0) continue;
      const rise = smooth(0, 0.32, lt) * (1 - smooth(0.82, 1.32, lt));
      if (rise <= 0.03) continue;

      const maxH = (32 + (ti % 2) * 11 + rand(S, ti, 1) * 7) * rise;
      const swayAmp = 4.2 + rand(S, ti, 2) * 3.4;
      const freq = 0.14 + rand(S, ti, 3) * 0.05;
      const phase = rand(S, ti, 4) * TAU;
      const lean = (ti - 2) * 0.12;
      const steps = Math.max(4, Math.floor(maxH / 2.2));
      let prevX = bases[ti];
      let prevY = 2;

      for (let s = 1; s <= steps; s++) {
        const u = clamp(s / steps, 0, 1);
        const curY = 2 - u * maxH;
        const curX =
          bases[ti] +
          lean * u * maxH * 0.45 +
          Math.sin(u * maxH * freq - lt * 6.5 + phase) * swayAmp * smooth(0, 0.35, u);
        const taper = Math.pow(clamp(1 - u, 0, 1), 0.7);
        const colBody = u > 0.78 ? C[4] : u > 0.35 ? C[3] : C[2];
        p.line(prevX, prevY, curX, curY, colBody, env * (0.72 + 0.28 * taper));
        if (taper > 0.38) {
          p.dot(curX + 1, curY, C[1], env * 0.85);
          p.dot(curX - 1, curY, C[4], env * 0.65);
        }
        if (s === steps) {
          p.dot(curX, curY, WHITE, env);
          p.light(curX, curY, C[4], 0.45 * env);
        }
        prevX = curX;
        prevY = curY;
      }
    }

    // 围绕目标浮散的幽蓝/暗紫衰朽微尘
    for (let i = 0; i < 14; i++) {
      const a = rand(S + 17, i, 1) * TAU + t * 1.9;
      const rad = 8 + rand(S + 17, i, 2) * 18;
      const px = Math.cos(a) * rad;
      const py = 2 - ((t * (18 + rand(S + 17, i, 3) * 20) + rand(S + 17, i, 4) * 32) % 44);
      const tw = 0.45 + 0.55 * Math.sin(t * 9 + i * 2.1);
      p.dot(px, py, i % 3 === 0 ? WHITE : C[4], env * tw * 0.88);
    }
  },
};

/** 导出全部 27 个扩充自研东方特效键位清单 */
export const TOUHOU_EXTRA_CUSTOM_FX_IDS = [
  'gungnir_lance',
  'crimson_mist',
  'abyss_gap_rift',
  'vampiric_claw_burst',
  'frost_prison_shatter',
  'wither_hourglass',
  'mana_siphon_vortex',
  'summon_fairy_ring',
  'summon_beast_totem',
  'summon_elemental_wind',
  'summon_elemental_earth',
  'summon_elemental_fire',
  'summon_elemental_water',
  'summon_flora_bloom',
  'summon_undead_crypt',
  'summon_ice_abyss',
  'ofuda_seal_ring',
  'ward_dome_prism',
  'yin_yang_dream',
  'lunar_astrolabe_fx',
  'lunar_hare_bloom',
  'crimson_shackle_chains',
  'mirror_prism_shatter',
  'star_danmaku_spiral',
  'sakura_spirit_vortex',
  'shrine_bell_ripple',
  'shadow_tendrils',
] as const;

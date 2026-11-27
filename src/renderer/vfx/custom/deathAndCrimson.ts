/**
 * 《Touhou-H4》英雄符卡与幽冥公馆死亡/红雾/深渊系核心招牌特效（7 种）
 *
 * 包含：
 * 1. `fxTouhouGungnirLance`（神枪「冈格尼尔之枪」）
 * 2. `fxTouhouCrimsonMist`（红雾异变 · 全屏红雾与暗夜蝠影）
 * 3. `fxTouhouAbyssGapRift`（深渊隙间魔瞳裂隙）
 * 4. `fxTouhouVampiricClawBurst`（血族血爪撕裂与猩红蝠群）
 * 5. `fxTouhouFrostPrison`（极寒六棱冰晶牢笼）
 * 6. `fxTouhouWitherHourglass`（凋零时光沙漏）
 * 7. `fxTouhouManaSiphon`（魔力虹吸旋涡）
 */

import { clamp, rand, smooth, TAU, WHITE, type PixelFxModule } from 'pixelfx';
import { drawPerspectiveRing, lifeEnvelope, resolveRamp, STAGE_H, STAGE_W } from './helpers';

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

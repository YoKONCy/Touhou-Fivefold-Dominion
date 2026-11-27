/**
 * 《Touhou-H4》五大 640×360 全屏透明东方天象特效（零背景底色、零硬边裁切、零假地板）
 *
 * 包含：
 * 1. `fxTouhouGodRays`（八百万神降 · 天降圣光）
 * 2. `fxTouhouCherryBlossoms`（西行妖 · 冥樱吹雪）
 * 3. `fxTouhouAurora`（幻月极光 · 结界天幕）
 * 4. `fxTouhouFog`（幻想幽雾 · 妖瘴弥漫）
 * 5. `fxTouhouShootingStars`（星屑流星雨 · 恋色星河）
 */

import { clamp, hex, mix, rand, smooth, TAU, WHITE, type PixelFxModule } from 'pixelfx';
import { lifeEnvelope, resolveRamp, STAGE_H, STAGE_W } from './helpers';

/**
 * 1. 八百万神降 · 天降圣光（替代原版 320×180 带黑底+假地板的 god-rays）
 * 自 640×360 画面最顶端斜倾而下，纯透明金白体积光束 + 向下自然柔和渐隐 + 满屏神圣光尘
 */
export const fxTouhouGodRays: PixelFxModule = {
  meta: {
    name: 'Touhou God Rays',
    desc: '全屏 640×360 透明叠加圣光天柱与飘浮神尘，零矩形底色与截断边',
    size: [STAGE_W, STAGE_H],
    origin: [STAGE_W / 2, STAGE_H / 2],
    duration: 2.1,
    loop: false,
    fps: 30,
    options: {
      palette: ['#291a08', '#8a5c14', '#d9a42e', '#ffe066', '#fff5b8', '#ffffff'],
      seed: 7,
    },
  },
  draw(p, t, o) {
    const D = 2.1;
    const env = lifeEnvelope(t, D, 0.26, 0.55);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 7);

    // 9 道覆盖全屏宽度的天际斜射圣光（基于画面左上至右上的宽广天顶扇面，自然向下渐隐）
    const shafts = [
      { xTop: -275, slope: 0.30, hw: 24, amp: 0.72, ph: 0.4 },
      { xTop: -205, slope: 0.32, hw: 16, amp: 0.60, ph: 1.5 },
      { xTop: -135, slope: 0.33, hw: 32, amp: 0.96, ph: 2.2 },
      { xTop: -55,  slope: 0.34, hw: 18, amp: 0.68, ph: 3.1 },
      { xTop: 15,   slope: 0.35, hw: 36, amp: 1.00, ph: 0.9 },
      { xTop: 95,   slope: 0.36, hw: 20, amp: 0.75, ph: 4.3 },
      { xTop: 165,  slope: 0.37, hw: 28, amp: 0.85, ph: 2.8 },
      { xTop: 235,  slope: 0.38, hw: 17, amp: 0.58, ph: 5.1 },
      { xTop: 295,  slope: 0.39, hw: 22, amp: 0.52, ph: 1.9 },
    ];

    // 每 2px 采样一行并对称绘制，兼顾清晰像素束感与极速帧率
    for (let y = -180; y < 145; y += 2) {
      // 垂直柔和包络：天顶全亮，自画面中部以下平滑消散至 y=145 彻底归零（绝不出现半空截断线！）
      const vNorm = (y + 180) / 325;
      const vFade = Math.pow(clamp(1 - smooth(0.42, 1.0, vNorm)), 1.35);
      if (vFade <= 0.01) continue;

      const drop = y + 180;
      for (let si = 0; si < shafts.length; si++) {
        const s = shafts[si];
        const breath = 0.78 + 0.22 * Math.sin(t * 2.6 + s.ph);
        const sway = Math.sin(t * 1.1 + s.ph) * 8;
        const cx = s.xTop + sway + drop * s.slope;
        // 光束向下略微扩散，更符合大气丁达尔体积光质感
        const hw = s.hw * (0.78 + 0.55 * vNorm);
        const x0 = Math.max(-320, Math.floor(cx - hw));
        const x1 = Math.min(319, Math.ceil(cx + hw));
        if (x0 > x1) continue;

        for (let x = x0; x <= x1; x += 2) {
          const q = Math.abs(x - cx) / hw;
          if (q >= 1) continue;
          // 屏幕左右边缘 40px 柔和羽化，杜绝左右硬切
          const edgeX = smooth(-320, -276, x) * (1 - smooth(276, 320, x));
          if (edgeX <= 0.01) continue;

          const profile = Math.pow(1 - q * q, 1.65);
          const strand = 0.78 + 0.22 * Math.sin((x - cx) * 0.55 + t * 2.2 + si);
          const intensity = profile * s.amp * breath * vFade * edgeX * strand * env;
          if (intensity < 0.04) continue;

          const col = intensity > 0.62 ? C[5] : intensity > 0.36 ? C[4] : C[3];
          const alpha = Math.min(0.32, intensity * 0.34);
          const lightK = Math.min(0.42, intensity * 0.44);

          // 填满 2×2 柔和像素单元，呈细腻透光束感而非厚重涂色
          p.blend(x, y, col, alpha);
          p.blend(x + 1, y, col, alpha);
          p.blend(x, y + 1, col, alpha * 0.85);
          p.blend(x + 1, y + 1, col, alpha * 0.85);
          p.light(x, y, C[3], lightK);
          p.light(x + 1, y + 1, C[3], lightK * 0.85);
        }
      }
    }

    // 顶部天穹柔光晕（无边界硬切）
    p.glow(-140, -172, 110, C[4], 0.24 * env);
    p.glow(20, -176, 120, C[3], 0.22 * env);
    p.glow(170, -170, 95, C[4], 0.18 * env);

    // 88 颗全屏飘落与上浮闪烁的神圣金尘微粒
    for (let i = 0; i < 88; i++) {
      const rx = rand(S, i, 1);
      const ry = rand(S, i, 2);
      const spd = 12 + rand(S, i, 3) * 26;
      const swayPh = rand(S, i, 4) * TAU;
      const x = -305 + rx * 610 + Math.sin(t * 2.2 + swayPh) * 10 + t * 8;
      const rawY = -170 + ((ry * 310 + t * spd) % 310);
      const yFade = smooth(-175, -140, rawY) * (1 - smooth(80, 145, rawY));
      const tw = 0.45 + 0.55 * Math.sin(t * (5 + (i % 5)) + swayPh);
      const a = yFade * tw * env;
      if (a < 0.12) continue;

      const big = i % 4 === 0;
      const col = tw > 0.82 ? WHITE : C[4];
      p.dot(x, rawY, col, a);
      if (big && tw > 0.65) {
        p.dot(x + 1, rawY, C[3], a * 0.75);
        p.dot(x, rawY + 1, C[3], a * 0.75);
        p.glow(x, rawY, 5, C[3], 0.28 * a);
      } else {
        p.light(x, rawY, C[4], 0.35 * a);
      }
    }
  },
};

/**
 * 2. 西行妖 · 冥樱吹雪（替代原版 320×180 带深紫夜幕矩形底色的 cherry-blossoms）
 * 全屏 640×360 纯透明叠加！优雅像素花瓣与五瓣整樱乘夜风斜掠整片战场
 */
export const fxTouhouCherryBlossoms: PixelFxModule = {
  meta: {
    name: 'Touhou Cherry Blossoms',
    desc: '全屏 640×360 透明叠加幻想乡樱吹雪，零深色矩形遮罩',
    size: [STAGE_W, STAGE_H],
    origin: [STAGE_W / 2, STAGE_H / 2],
    duration: 2.2,
    loop: false,
    fps: 30,
    options: {
      palette: ['#240e24', '#6e2861', '#c752a0', '#ff99cc', '#ffe0f0', '#ffffff'],
      seed: 12,
    },
  },
  draw(p, t, o) {
    const D = 2.2;
    const env = lifeEnvelope(t, D, 0.2, 0.5);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 12);
    const windGust = Math.sin(t * 2.4) * 18;

    // 110 片随风翻飞闪烁的单樱花瓣
    for (let i = 0; i < 110; i++) {
      const near = i < 42;
      const sx = -360 + rand(S, i, 1) * 720;
      const sy = -200 + rand(S, i, 2) * 340;
      const vx = (near ? 56 : 36) + rand(S, i, 3) * 32;
      const vy = (near ? 34 : 22) + rand(S, i, 4) * 24;
      const ph = rand(S, i, 5) * TAU;
      const spin = 3.2 + rand(S, i, 6) * 4.5;

      let x = sx + vx * t + windGust * (near ? 0.9 : 0.5) + Math.cos(t * 3.1 + ph) * 9;
      let y = sy + vy * t + Math.sin(t * 2.6 + ph) * 6;
      // 平滑环绕于 640×360 视口内
      x = ((((x + 340) % 680) + 680) % 680) - 340;
      y = ((((y + 190) % 380) + 380) % 380) - 190;
      if (x < -316 || x > 316 || y < -176 || y > 170) continue;

      const edgeFade =
        smooth(-318, -280, x) *
        (1 - smooth(280, 318, x)) *
        smooth(-178, -145, y) *
        (1 - smooth(135, 172, y));
      const a = env * edgeFade;
      if (a <= 0.08) continue;

      const flip = Math.cos(t * spin + ph);
      const ang = t * (near ? 2.4 : 1.7) + ph;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const colMain = flip < -0.15 ? C[2] : C[3];
      const colTip = flip > 0.72 ? WHITE : C[4];

      // 浪漫像素樱瓣（带主瓣、尖端高光与微宽侧瓣）
      p.dot(x, y, colMain, a);
      p.dot(x + ca * 1.4, y + sa * 1.4, colTip, a);
      p.dot(x - ca * 1.3, y - sa * 1.3, C[2], a * 0.92);
      const wScale = 0.45 + 0.65 * Math.abs(flip);
      p.dot(x - sa * 1.15 * wScale, y + ca * 1.15 * wScale, colMain, a * 0.92);
      if (near) {
        p.dot(x + sa * 1.15 * wScale, y - ca * 1.15 * wScale, colTip, a * 0.9);
        p.dot(x + ca * 2.2, y + sa * 2.2, colTip, a * 0.78);
      }
      if (flip > 0.76) {
        p.glow(x, y, near ? 7 : 5, C[4], 0.36 * a);
      } else {
        p.light(x, y, C[3], 0.2 * a);
      }
    }

    // 14 朵缓缓旋转飘落的五瓣整樱
    for (let i = 0; i < 14; i++) {
      const sx = -300 + rand(S + 99, i, 1) * 580;
      const sy = -185 + rand(S + 99, i, 2) * 280;
      const x = sx + (32 + rand(S + 99, i, 3) * 20) * t + Math.sin(t * 2 + i) * 10;
      const y = sy + (26 + rand(S + 99, i, 4) * 18) * t;
      if (x < -310 || x > 310 || y < -172 || y > 165) continue;
      const a = env * (1 - smooth(120, 165, y));
      if (a <= 0.1) continue;

      const rot = t * 1.8 + i * 1.3;
      for (let k = 0; k < 5; k++) {
        const pa = rot + (k * TAU) / 5;
        const px = x + Math.cos(pa) * 2.5;
        const py = y + Math.sin(pa) * 2.5;
        p.dot(px, py, C[4], a);
        p.dot(px + Math.cos(pa) * 1.2, py + Math.sin(pa) * 1.2, C[3], a * 0.92);
      }
      p.dot(x, y, hex('#ffe48a'), a);
      p.glow(x, y, 9, C[4], 0.32 * a);
    }
  },
};

/**
 * 3. 幻月极光 · 结界天幕（替代原版 320×180 硬裁剪方框 aurora）
 * 横贯完整 640px 暗夜天穹的丝滑连续极光帷幕，四边柔化零竖条间隙与裁切边
 */
export const fxTouhouAurora: PixelFxModule = {
  meta: {
    name: 'Touhou Aurora',
    desc: '全屏 640×360 上半天穹无缝极光帷幕，四边柔化零硬切',
    size: [STAGE_W, STAGE_H],
    origin: [STAGE_W / 2, STAGE_H / 2],
    duration: 2.2,
    loop: false,
    fps: 30,
    options: {
      palette: ['#09261d', '#196e52', '#3cd495', '#8cf5c4', '#e0ffef', '#ffffff'],
      seed: 19,
    },
  },
  draw(p, t, o) {
    const D = 2.2;
    const env = lifeEnvelope(t, D, 0.3, 0.55);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 19);

    // 双层贯穿全屏宽度的波浪极光帷幕（2×2 满填 + 柔和余弦波束，丝滑无竖条断层！）
    const curtains = [
      { baseY: -96, slope: 0.035, amp: 14, freq: 0.014, spd: 1.8, h: 52, power: 0.72 },
      { baseY: -54, slope: -0.028, amp: 18, freq: 0.011, spd: -1.35, h: 68, power: 1.0 },
    ];

    for (let ci = 0; ci < curtains.length; ci++) {
      const c = curtains[ci];
      for (let x = -314; x <= 314; x += 2) {
        const edgeX = smooth(-314, -244, x) * (1 - smooth(244, 314, x));
        if (edgeX <= 0.01) continue;

        const wave =
          Math.sin(x * c.freq + t * c.spd + ci * 2.1) * c.amp +
          Math.sin(x * c.freq * 2.2 - t * 1.9 + S) * (c.amp * 0.36);
        const hemY = c.baseY + x * c.slope + wave;
        const ripple =
          0.5 +
          0.5 *
            Math.max(
              0,
              Math.sin(x * 0.045 - t * 2.6 + ci) * 0.6 + Math.sin(x * 0.095 + t * 1.9 + S) * 0.4,
            );
        const rayH = c.h * (0.7 + 0.45 * ripple);

        for (let dy = 0; dy <= rayH; dy += 2) {
          const y = hemY - dy;
          if (y < -178 || y > 80) continue;
          const v = dy / rayH;
          // 底部柔和亮裙边，向上平滑淡出成彩霞丝带；顶缘 28px 平滑归零
          const hemEdge = smooth(0, 0.08, v);
          const prof = hemEdge * Math.pow(1 - v, 1.55) * 1.15;
          const topFade = smooth(-178, -146, y);
          const intensity = prof * ripple * c.power * edgeX * topFade * env;
          if (intensity < 0.04) continue;

          // 使用高饱和中间彩度阶平滑混色，保留鲜活极光色彩而非灰白
          const col = v < 0.25 ? mix(C[4], C[3], v / 0.25) : mix(C[3], C[2], (v - 0.25) / 0.75);
          const alpha = Math.min(0.42, intensity * 0.4);
          const lk = Math.min(0.48, intensity * 0.5);
          p.blend(x, y, col, alpha);
          p.blend(x + 1, y, col, alpha);
          p.blend(x, y + 1, col, alpha * 0.92);
          p.blend(x + 1, y + 1, col, alpha * 0.92);
          p.light(x, y, C[3], lk);
          p.light(x + 1, y + 1, C[3], lk * 0.85);
        }
      }
    }

    // 散布于极光带内的 45 颗微光星点
    for (let i = 0; i < 45; i++) {
      const x = -290 + rand(S, i, 1) * 580;
      const y = -165 + rand(S, i, 2) * 140;
      const tw = 0.4 + 0.6 * Math.sin(t * (4 + (i % 4)) + i * 1.7);
      const a = tw * env * 0.85;
      if (a < 0.15) continue;
      p.dot(x, y, tw > 0.82 ? WHITE : C[4], a);
      if (i % 5 === 0) p.glow(x, y, 4, C[3], 0.25 * a);
    }
  },
};

/**
 * 4. 幻想幽雾 · 妖瘴弥漫（替代原版 320×90 硬矩形雾砖 fog）
 * 由多层大半径径向柔边雾团横向轻飘组成，全连续平滑混色，绝无硬边或水平色阶断层！
 */
export const fxTouhouFog: PixelFxModule = {
  meta: {
    name: 'Touhou Mist',
    desc: '全屏 640×360 柔和径向羽化漂浮妖雾，零直线硬边框',
    size: [STAGE_W, STAGE_H],
    origin: [STAGE_W / 2, STAGE_H / 2],
    duration: 2.2,
    loop: false,
    fps: 30,
    options: {
      palette: ['#150b2b', '#411f7a', '#7842c9', '#56d9d0', '#b8fff6', '#ffffff'],
      seed: 5,
    },
  },
  draw(p, t, o) {
    const D = 2.2;
    const env = lifeEnvelope(t, D, 0.28, 0.6);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 5);

    // 28 团全屏错落漂移的柔边云雾团（全连续颜色过渡 + 微波浪扰动，零硬分界！）
    for (let i = 0; i < 28; i++) {
      const baseX = -275 + rand(S, i, 1) * 550;
      const baseY = -88 + rand(S, i, 2) * 228;
      const spd = (i % 2 === 0 ? 1 : -1) * (14 + rand(S, i, 3) * 20);
      const r = 26 + rand(S, i, 4) * 34;
      const cx = baseX + spd * t;
      const cy = baseY + Math.sin(t * 1.8 + i) * 6;
      const edgeFade = smooth(-320, -240, cx) * (1 - smooth(240, 320, cx));
      const a0 = (0.14 + rand(S, i, 5) * 0.13) * env * edgeFade;
      if (a0 <= 0.01) continue;

      const mistCol = i % 3 === 0 ? C[3] : C[2];
      const highlightCol = C[4];

      const rx = r * 1.75;
      const ry = r * 0.68;
      const x0 = Math.max(-318, Math.floor(cx - rx));
      const x1 = Math.min(318, Math.ceil(cx + rx));
      const y0 = Math.max(-176, Math.floor(cy - ry));
      const y1 = Math.min(176, Math.ceil(cy + ry));

      for (let y = y0; y <= y1; y += 2) {
        const dy = (y - cy) / ry;
        const dy2 = dy * dy;
        if (dy2 >= 1) continue;
        for (let x = x0; x <= x1; x += 2) {
          const dx = (x - cx) / rx;
          // 轻微正弦云团外缘扰动，彻底打破规整几何椭圆轮廓
          const ripple = 0.08 * Math.sin(x * 0.11 + y * 0.09 + i * 1.7);
          const d2 = dx * dx + dy2 + ripple;
          if (d2 >= 1) continue;
          const falloff = Math.pow(clamp(1 - d2), 2.1);
          const a = a0 * falloff;
          if (a < 0.012) continue;
          const hiMix = clamp((0.35 - dy) * 0.42) * falloff;
          const col = mix(mistCol, highlightCol, hiMix);
          p.blend(x, y, col, a);
          p.blend(x + 1, y, col, a);
          p.blend(x, y + 1, col, a * 0.9);
          p.blend(x + 1, y + 1, col, a * 0.9);
          if (falloff > 0.5) {
            p.light(x, y, C[3], a * 0.36);
          }
        }
      }
    }
  },
};

/**
 * 5. 星屑流星雨 · 恋色星河（替代原版 320×180 硬方框星空 shooting-stars）
 * 覆盖完整 640×360 暗夜天际的多道长尾绚丽像素流星 + 爆发十字星芒
 */
export const fxTouhouShootingStars: PixelFxModule = {
  meta: {
    name: 'Touhou Shooting Stars',
    desc: '全屏 640×360 无边框像素流星雨与星芒尾迹',
    size: [STAGE_W, STAGE_H],
    origin: [STAGE_W / 2, STAGE_H / 2],
    duration: 2.0,
    loop: false,
    fps: 30,
    options: {
      palette: ['#24140a', '#7c4312', '#d98a1c', '#f7ca45', '#fff29c', '#ffffff'],
      seed: 4,
    },
  },
  draw(p, t, o) {
    const D = 2.0;
    const env = lifeEnvelope(t, D, 0.14, 0.45);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 4);

    // 14 颗从全屏高空错落斜划的流星（起点覆盖 [-280..+320]）
    for (let i = 0; i < 14; i++) {
      const t0 = (i / 14) * 1.15 + rand(S, i, 1) * 0.14;
      const life = 0.55 + rand(S, i, 2) * 0.38;
      const age = t - t0;
      if (age < 0 || age > life + 0.25) continue;

      const sx = -180 + rand(S, i, 3) * 520;
      const sy = -178 + rand(S, i, 4) * 70;
      const ang = 2.28 + (rand(S, i, 5) - 0.5) * 0.28; // 自右上向左下斜落
      const spd = 250 + rand(S, i, 6) * 140;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);

      const u = clamp(age / life);
      const activeK = age <= life ? smooth(0, 0.16, u) * (1 - smooth(0.74, 1, u)) : 0;
      const hx = sx + ca * spd * Math.min(age, life);
      const hy = sy + sa * spd * Math.min(age, life);

      if (activeK > 0.02) {
        const tailLen = 36 + rand(S, i, 7) * 44;
        const steps = 24;
        for (let k = 0; k <= steps; k++) {
          const frac = k / steps;
          const px = hx - ca * tailLen * frac;
          const py = hy - sa * tailLen * frac;
          if (px < -318 || px > 318 || py < -178 || py > 176) continue;
          const fade = (1 - frac) * activeK * env;
          const col = frac < 0.14 ? WHITE : frac < 0.4 ? C[4] : frac < 0.72 ? C[3] : C[2];
          p.dot(px, py, col, fade);
          if (frac < 0.35) {
            p.dot(px + 1, py, C[4], fade * 0.75);
          }
          if (k % 4 === 0) {
            p.glow(px, py, 7 * (1 - frac) + 2, C[3], 0.32 * fade);
          }
        }
        // 流星明亮星首
        if (hx > -316 && hx < 316 && hy > -176 && hy < 174) {
          p.circle(hx, hy, 1.5, WHITE, activeK * env);
          p.glow(hx, hy, 14, C[4], 0.65 * activeK * env);
          // 十字星芒
          const arm = Math.round(4 + 3 * activeK);
          p.line(hx - arm, hy, hx + arm, hy, C[5], activeK * env);
          p.line(hx, hy - arm, hx, hy + arm, C[5], activeK * env);
        }
      }
    }
  },
};

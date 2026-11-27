/**
 * 《Touhou-H4》自研纯净像素特效模块库（100% 兼容 pixelfx 双缓冲 Painter 接口）
 *
 * 设计铁律：
 * 1. 全屏天象模块（god_rays / cherry_blossoms / aurora / fog / shooting_stars）专为 640×360 透明叠加舞台编写：
 *    - 绝对禁止填充深色底色矩形或半空假地板条纹；
 *    - 完整铺满 640×360 视口，且在四边与起止时间自带平滑渐入渐出包络，彻底杜绝「脏矩形贴纸」与「硬边裁切」！
 * 2. 东方魔导局域模块（spark_arc / hologram / warp_in / force_field / soul_rise / electrified / status_poisoned）：
 *    - 彻底取代原版 pixelfx 中的实验室金属电弧机、科幻钢铁投影仪、硬切光柱砖与西幻像素骑士剪影，
 *      打造 100% 契合东方幻想乡审美的结界、电弧、魂火、铃兰毒泡与隙间降临演出！
 */

import { clamp, fit, hex, mix, rand, smooth, TAU, WHITE, type PixelFxModule } from 'pixelfx';

const STAGE_W = 640;
const STAGE_H = 360;

/** 将调色板未知入参安全转为 0xAABBGGRR 颜色数组 */
function resolveRamp(palette: unknown, count: number): number[] {
  const fallback = ['#291a08', '#8a5c14', '#d9a42e', '#ffe066', '#fff5b8', '#ffffff'];
  const src = Array.isArray(palette) && palette.length > 0 ? (palette as readonly (string | number)[]) : fallback;
  return fit(src, count);
}

/** 计算生命周期自然淡入淡出包络（避免进场突兀闪现或退场硬切断） */
function lifeEnvelope(t: number, duration: number, fadeIn = 0.24, fadeOut = 0.45): number {
  const aIn = smooth(0, fadeIn, t);
  const aOut = 1 - smooth(Math.max(fadeIn, duration - fadeOut), duration, t);
  return clamp(aIn * aOut);
}

// ============================================================================
// 一、五大 640×360 全屏透明东方天象（零背景底色、零硬边裁切、零假地板）
// ============================================================================

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

// ============================================================================
// 二、七套纯净东方魔导局域特效（取代穿帮科幻机器/投影仪/假人崩溃模块）
// ============================================================================

/**
 * 6. 紫电跃弧（替代原版画出一台金属实验室雅各布天梯机器的 spark-arc）
 */
export const fxTouhouSparkArc: PixelFxModule = {
  meta: {
    name: 'Touhou Spark Arc',
    desc: '纯净高频锯齿跃动电弧与电火花，彻底去除金属机器底座',
    size: [120, 120],
    origin: [60, 60],
    duration: 1.2,
    loop: false,
    fps: 30,
    options: {
      palette: ['#101233', '#2e3899', '#5c78f0', '#9ce0ff', '#ebffff', '#ffffff'],
      seed: 2,
    },
  },
  draw(p, t, o) {
    const D = 1.2;
    const env = lifeEnvelope(t, D, 0.08, 0.38);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 2);
    const frameIdx = Math.floor(t * 24);

    // 中心电光核脉冲
    const pulse = 0.75 + 0.25 * Math.sin(t * 36);
    p.glow(0, -12, 28, C[3], 0.45 * env * pulse);
    p.circle(0, -12, 3.2 * env, WHITE);

    // 5 条环绕目标点肆意跃动的锯齿电弧
    for (let aIdx = 0; aIdx < 5; aIdx++) {
      const ang0 = (aIdx / 5) * TAU + t * 2.6 + rand(S, frameIdx, aIdx) * 0.45;
      const rad = 18 + rand(S, frameIdx, aIdx + 10) * 16;
      const ex = Math.cos(ang0) * rad;
      const ey = -12 + Math.sin(ang0) * rad * 0.85;

      let px = 0;
      let py = -12;
      const segs = 6;
      for (let s = 1; s <= segs; s++) {
        const u = s / segs;
        const jit = (1 - Math.abs(u - 0.5) * 1.6) * 9;
        const nx = ex * u + (rand(S, frameIdx * 7 + aIdx, s * 2) - 0.5) * jit;
        const ny = -12 + (ey + 12) * u + (rand(S, frameIdx * 7 + aIdx, s * 2 + 1) - 0.5) * jit;
        p.line(px, py, nx, ny, s <= 2 ? WHITE : C[4], env);
        if (s % 2 === 0) {
          p.glow(nx, ny, 7, C[3], 0.35 * env);
        }
        px = nx;
        py = ny;
      }
    }

    // 18 颗四射高速电火花
    for (let i = 0; i < 18; i++) {
      const ang = rand(S, i, 1) * TAU;
      const spd = 28 + rand(S, i, 2) * 52;
      const life = 0.35 + rand(S, i, 3) * 0.55;
      const u = t / life;
      if (u >= 1) continue;
      const x = Math.cos(ang) * spd * t;
      const y = -12 + Math.sin(ang) * spd * t * 0.8 + 14 * t * t;
      const fade = (1 - u) * env;
      p.dot(x, y, u < 0.35 ? WHITE : C[4], fade);
      p.light(x, y, C[3], 0.35 * fade);
    }
  },
};

/**
 * 7. 幻象镜阵（替代原版脚底带 LED 科幻钢铁投影仪的 hologram）
 */
export const fxTouhouHologram: PixelFxModule = {
  meta: {
    name: 'Touhou Mirage Prism',
    desc: '东方悬浮八角棱镜幻象光环与折光残影波纹，零科幻投影机',
    size: [120, 120],
    origin: [60, 82],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#122138', '#3466a8', '#66c4eb', '#b8f0ff', '#fff0c2', '#ffffff'],
      seed: 21,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.16, 0.42);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const cy = -18;
    const spin = t * 2.4;

    // 脚下悬浮双层魔导圆环（柔光椭圆）
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * TAU + spin * 0.6;
      const rx = 20;
      const ry = 7;
      p.dot(Math.cos(a) * rx, 2 + Math.sin(a) * ry, i % 4 === 0 ? C[5] : C[3], env * 0.9);
    }
    p.glow(0, 2, 22, C[3], 0.32 * env);

    // 环绕单位周身旋转的双层八角折光菱形结界
    const rOuter = 16 + Math.sin(t * 5) * 1.5;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 8; i++) {
      const a = spin + (i * TAU) / 8;
      pts.push([Math.cos(a) * rOuter, cy + Math.sin(a) * rOuter * 0.72]);
    }
    for (let i = 0; i < 8; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % 8];
      const [cx2, cy2] = pts[(i + 3) % 8];
      p.line(ax, ay, bx, by, C[4], env * 0.85);
      p.line(ax, ay, cx2, cy2, C[2], env * 0.48);
      p.dot(ax, ay, WHITE, env);
    }

    // 上下往复扫描的幻象灵光水平丝带（折光微粒）
    const scanY = cy + Math.sin(t * 5.2) * 18;
    p.line(-15, scanY, 15, scanY, C[5], env * 0.9);
    p.glowLine(-14, scanY, 14, scanY, 6, C[3], 0.38 * env);

    // 升腾的菱形折光碎片
    for (let i = 0; i < 16; i++) {
      const ph = i * 1.37;
      const u = ((t * 0.9 + (i / 16)) % 1);
      const x = Math.cos(ph + t * 2) * (10 + (i % 5) * 2.5);
      const y = 4 - u * 44;
      const a = Math.sin(u * Math.PI) * env;
      p.dot(x, y, i % 3 === 0 ? WHITE : C[4], a);
      p.light(x, y, C[3], 0.25 * a);
    }
  },
};

/**
 * 8. 隙间降临（替代原版硬切惨白方砖 + 扫描出西幻小人的 warp-in）
 */
export const fxTouhouWarpIn: PixelFxModule = {
  meta: {
    name: 'Touhou Warp In',
    desc: '顶部自然渐隐的东方降临灵光柱 + 旋转隙间召唤环，无硬切方砖与假人',
    size: [140, 160],
    origin: [70, 128],
    duration: 1.45,
    loop: false,
    fps: 30,
    options: {
      palette: ['#170829', '#4f1875', '#9c36cc', '#ff5288', '#ffd4e6', '#ffffff'],
      seed: 3,
    },
  },
  draw(p, t, o) {
    const D = 1.45;
    const env = lifeEnvelope(t, D, 0.14, 0.42);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const widthPulse = 12 * smooth(0, 0.2, t) * (1 - 0.65 * smooth(0.8, 1.35, t));

    // 柔和的垂直降临灵光柱（顶部 48px 平滑渐隐至 0，底部收敛于脚下法阵！）
    if (widthPulse > 0.5) {
      for (let y = -112; y <= 2; y++) {
        const topFade = smooth(-112, -56, y);
        const botFade = 1 - smooth(-4, 4, y);
        const vFade = topFade * botFade;
        if (vFade <= 0.01) continue;
        const hw = widthPulse * (0.7 + 0.45 * ((y + 112) / 114));
        const x0 = Math.floor(-hw);
        const x1 = Math.ceil(hw);
        for (let x = x0; x <= x1; x++) {
          const q = Math.abs(x) / hw;
          if (q >= 1) continue;
          const profile = (1 - q * q) * vFade * env;
          if (profile < 0.05) continue;
          const col = q < 0.3 ? WHITE : q < 0.65 ? C[4] : C[3];
          p.blend(x, y, col, Math.min(0.55, profile * 0.55));
          p.light(x, y, C[3], profile * 0.42);
        }
      }
    }

    // 3 道沿光柱自上而下收缩的传送灵环
    for (let r = 0; r < 3; r++) {
      const u = ((t * 1.4 + r * 0.33) % 1);
      const ry = -90 + u * 92;
      const rad = 18 * (1 - 0.35 * u);
      const ra = Math.sin(u * Math.PI) * env;
      for (let k = 0; k < 32; k++) {
        const a = (k / 32) * TAU + t * 3;
        p.dot(Math.cos(a) * rad, ry + Math.sin(a) * rad * 0.28, k % 3 === 0 ? WHITE : C[4], ra);
      }
      p.glow(0, ry, rad + 6, C[3], 0.22 * ra);
    }

    // 地面扩散降临圆环与飞溅星芒
    const ringR = 8 + 26 * smooth(0.1, 0.75, t);
    for (let k = 0; k < 44; k++) {
      const a = (k / 44) * TAU - t * 2.5;
      p.dot(Math.cos(a) * ringR, Math.sin(a) * ringR * 0.32, k % 4 === 0 ? WHITE : C[4], env);
    }
    p.glow(0, -4, 30, C[3], 0.45 * env);
  },
};

/**
 * 9. 六角灵结界（替代原版底部水平一刀切的科幻护盾 force-field）
 */
export const fxTouhouForceField: PixelFxModule = {
  meta: {
    name: 'Touhou Hex Barrier',
    desc: '圆润立体博丽六角灵结界护盾球，无水平截断底边',
    size: [110, 110],
    origin: [55, 62],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#260916', '#7d1831', '#d93855', '#ff7a8a', '#ffe3a8', '#ffffff'],
      seed: 5,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.14, 0.45);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const cy = -14;
    const R = 24 * (0.72 + 0.28 * smooth(0, 0.22, t));
    const wave = Math.sin(t * 7) * 0.12 + 0.88;

    // 完整圆形球壳（菲涅尔边缘高亮 + 内部半透明灵膜，彻底告别底部硬切！）
    for (let y = Math.floor(cy - R - 1); y <= Math.ceil(cy + R + 1); y++) {
      for (let x = Math.floor(-R - 1); x <= Math.ceil(R + 1); x++) {
        const dx = x / R;
        const dy = (y - cy) / R;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const d = Math.sqrt(d2);
        const fresnel = Math.pow(d, 2.2);
        // 内部柔和六边形蜂巢网格纹理
        const gx = Math.abs((((x + t * 8) % 8) + 8) % 8 - 4);
        const gy = Math.abs((((y - cy) % 7) + 7) % 7 - 3.5);
        const hexEdge = gx > 3.1 || gy > 2.7 ? 1 : 0;

        if (d > 0.88) {
          p.dot(x, y, d > 0.94 ? WHITE : C[4], env * wave);
          p.light(x, y, C[3], 0.35 * env);
        } else {
          const alpha = (0.08 + 0.22 * fresnel + hexEdge * 0.14) * env;
          p.blend(x, y, hexEdge ? C[4] : C[3], alpha);
        }
      }
    }

    // 两条倾斜交叉旋转的结界经纬光环
    for (let r = 0; r < 2; r++) {
      const tilt = r === 0 ? 0.35 : -0.35;
      const spin = t * (r === 0 ? 2.6 : -2.2);
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * TAU + spin;
        const lx = Math.cos(a) * (R + 2);
        const ly = Math.sin(a) * (R + 2) * 0.34;
        const rx = lx * Math.cos(tilt) - ly * Math.sin(tilt);
        const ry = cy + lx * Math.sin(tilt) + ly * Math.cos(tilt);
        p.dot(rx, ry, i % 6 === 0 ? WHITE : C[4], env * 0.85);
      }
    }
    p.glow(0, cy, R + 10, C[3], 0.35 * env);
  },
};

/**
 * 10. 幽冥魂火升腾（替代依赖西幻骑士掩码导致空 mask 崩溃的 soul-rise）
 */
export const fxTouhouSoulRise: PixelFxModule = {
  meta: {
    name: 'Touhou Soul Rise',
    desc: '幽冥法阵 + 螺旋升腾的苍白魂火与亡灵光带',
    size: [120, 140],
    origin: [60, 112],
    duration: 1.6,
    loop: false,
    fps: 30,
    options: {
      palette: ['#150b2b', '#411f7a', '#7842c9', '#56d9d0', '#b8fff6', '#ffffff'],
      seed: 11,
    },
  },
  draw(p, t, o) {
    const D = 1.6;
    const env = lifeEnvelope(t, D, 0.15, 0.45);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 11);

    // 地面旋转幽冥符环
    const rRing = 18 + 6 * smooth(0, 0.3, t);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU + t * 2.2;
      p.dot(Math.cos(a) * rRing, Math.sin(a) * rRing * 0.32, i % 5 === 0 ? C[5] : C[3], env);
    }
    p.glow(0, 0, 26, C[3], 0.35 * env);

    // 3 道螺旋向上升腾的幽冥光带与魂火球
    for (let s = 0; s < 3; s++) {
      const headY = -6 - t * 44 - s * 10;
      for (let k = 0; k < 22; k++) {
        const y = headY + k * 2.4;
        if (y > 2 || y < -96) continue;
        const a = t * 4.5 + s * (TAU / 3) - k * 0.22;
        const rad = (14 - k * 0.35) * (0.6 + 0.4 * Math.sin(k * 0.2));
        const x = Math.cos(a) * rad;
        const fade = (1 - k / 22) * env * smooth(-96, -72, y);
        const col = k < 4 ? WHITE : k < 10 ? C[4] : C[3];
        p.dot(x, y, col, fade);
        if (k < 6) p.dot(x + 1, y, C[4], fade * 0.8);
        if (k === 0) p.glow(x, y, 10, C[4], 0.48 * fade);
      }
    }

    // 24 颗零散漂浮上扬的亡灵磷火星尘
    for (let i = 0; i < 24; i++) {
      const x0 = (rand(S, i, 1) - 0.5) * 32;
      const spd = 22 + rand(S, i, 2) * 36;
      const y = -((t * spd + rand(S, i, 3) * 40) % 84);
      const x = x0 + Math.sin(t * 3 + i) * 4;
      const a = smooth(-84, -62, y) * (1 - smooth(-8, 0, y)) * env;
      p.dot(x, y, i % 3 === 0 ? WHITE : C[4], a);
      p.light(x, y, C[3], 0.25 * a);
    }
  },
};

/**
 * 11. 感电缠身（替代依赖西幻骑士掩码的 electrified）
 */
export const fxTouhouElectrified: PixelFxModule = {
  meta: {
    name: 'Touhou Electrified',
    desc: '环绕目标劈啪跃动的贴身高压电弧与静电星点',
    size: [100, 100],
    origin: [50, 68],
    duration: 1.4,
    loop: false,
    fps: 30,
    options: {
      palette: ['#101233', '#2e3899', '#5c78f0', '#9ce0ff', '#ebffff', '#ffffff'],
      seed: 17,
    },
  },
  draw(p, t, o) {
    const D = 1.4;
    const env = lifeEnvelope(t, D, 0.08, 0.35);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 17);
    const frame = Math.floor(t * 22);

    // 4 道紧贴单位周身圆柱区域跳跃的电弧环
    for (let b = 0; b < 4; b++) {
      const yBase = -6 - b * 9 + (rand(S, frame, b) - 0.5) * 4;
      let px = -14;
      let py = yBase;
      for (let step = 1; step <= 6; step++) {
        const nx = -14 + (28 * step) / 6;
        const ny = yBase + (rand(S, frame * 5 + b, step) - 0.5) * 9;
        p.line(px, py, nx, ny, step % 2 === 0 ? WHITE : C[4], env);
        px = nx;
        py = ny;
      }
      p.glow(0, yBase, 14, C[3], 0.28 * env);
    }

    // 14 颗跳动静电火花
    for (let i = 0; i < 14; i++) {
      const a = rand(S, frame + i, 1) * TAU;
      const r = 10 + rand(S, frame + i, 2) * 14;
      const x = Math.cos(a) * r;
      const y = -18 + Math.sin(a) * r * 1.1;
      p.dot(x, y, i % 2 === 0 ? WHITE : C[4], env);
      p.light(x, y, C[3], 0.32 * env);
    }
  },
};

/**
 * 12. 铃兰毒泡（替代依赖西幻骑士掩码的 status-poisoned）
 */
export const fxTouhouPoisoned: PixelFxModule = {
  meta: {
    name: 'Touhou Poisoned',
    desc: '自脚下升腾破裂的碧绿铃兰毒泡与毒雾微粒',
    size: [100, 100],
    origin: [50, 74],
    duration: 1.5,
    loop: false,
    fps: 30,
    options: {
      palette: ['#0a2112', '#1c6332', '#3ec456', '#8cf566', '#e0ffbd', '#ffffff'],
      seed: 23,
    },
  },
  draw(p, t, o) {
    const D = 1.5;
    const env = lifeEnvelope(t, D, 0.14, 0.42);
    if (env <= 0.004) return;

    const C = resolveRamp(o.palette, 6);
    const S = Number(o.seed ?? 23);

    // 脚下柔和毒雾底晕
    p.glow(0, -4, 22, C[3], 0.32 * env);

    // 14 颗升腾膨胀随后爆裂成微尘的像素毒泡
    for (let i = 0; i < 14; i++) {
      const u = ((t * 0.85 + rand(S, i, 1)) % 1);
      const x = (rand(S, i, 2) - 0.5) * 28 + Math.sin(t * 4 + i * 2) * 3;
      const y = -2 - u * 44;
      const r = 1.8 + rand(S, i, 3) * 2.6;
      const a = Math.sin(u * Math.PI) * env;
      if (a <= 0.1) continue;

      if (u < 0.84) {
        p.circle(x, y, r, (d) => (d < 0.45 ? C[4] : d < 0.8 ? C[3] : C[2]), a * 0.85);
        p.dot(x - r * 0.35, y - r * 0.35, WHITE, a);
        p.light(x, y, C[3], 0.25 * a);
      } else {
        // 毒泡顶端噗嗤破裂飞溅 4 点毒液微粒
        const pop = (u - 0.84) / 0.16;
        for (let k = 0; k < 4; k++) {
          const ka = (k * TAU) / 4 + i;
          p.dot(x + Math.cos(ka) * (r + pop * 5), y + Math.sin(ka) * (r + pop * 5), C[4], (1 - pop) * env);
        }
      }
    }
  },
};

/** 导出全部定制特效键位集合，便于单元测试校验 */
export const TOUHOU_CUSTOM_FX_IDS = [
  'god_rays',
  'cherry_blossoms',
  'aurora',
  'fog',
  'shooting_stars',
  'spark_arc',
  'hologram',
  'warp_in',
  'force_field',
  'soul_rise',
  'electrified',
  'status_poisoned',
] as const;

export const TOUHOU_WEATHER_FX_SET = new Set<string>([
  'god_rays',
  'cherry_blossoms',
  'aurora',
  'fog',
  'shooting_stars',
  'crimson_mist',
]);

export { mix };

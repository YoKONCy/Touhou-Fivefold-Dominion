/**
 * 新一代 64×72 纯代码精雕像素立绘引擎 v3（3/4 侧身集群美学 × 水灵宝石大眼 × 高明度东方色板）
 *
 * 核心美术法则（融合经典 32-bit 日系像素大触技法，100% 纯代码零贴图）：
 * 1. 干净大色块集群（Big Clean Clusters）：彻底杜绝高频数学斑马条纹与碎噪点，
 *    裙摆采用「自然 3D 透视圆弧 + 3~4 瓣宽大柔美波浪 + 2~3 道宽软布料垂褶 + 探出蕾丝边」，
 *    发型采用「大块蓬松发团 + 左右分缕大块空气刘海 + 亮泽天使环高光」！
 * 2. 真实 3/4 侧身动感站姿：一前一后斜错步双腿（后脚微高靠左、前脚微低靠右、脚尖同朝右）+ 窄溜肩微侧身！
 * 3. 水灵璀璨 4×4 / 4×5 宝石大眼：柔美弧形上睫毛（绝不画死压凶杠）+ 清晰纯白大星光高光 + 清澈眼白 +
 *    下虹膜宝石荧光 + 苹果脸柔粉腮红 + 俏皮小嘴（蕾米攻击露小虎牙）！
 * 4. 零抗锯齿整数光栅化 + 精准语义部件分层 Sel-out + 温润深紫褐外描边（拒绝死黑与灰闷）！
 */

import type { RigPose } from './voxelSprites';

export const HD_SPRITE_WIDTH = 64;
export const HD_SPRITE_HEIGHT = 72;
export const HD_ORIGIN_X = 32;
export const HD_ORIGIN_Y = 66;
/** 舞台物理尺寸对齐倍率：64×0.78 ≈ 50px，与旧版 48×54 占位完美一致，清晰度翻倍！ */
export const HD_RENDER_SCALE = 0.78;

/** 语义部件深度 ID（数值越大层级越靠前，用于自动计算干净的结构分离线与投影） */
export const SPRITE_PART = {
  NONE: 0,
  BACK_ACC: 1,
  BACK_HAIR: 2,
  LEGS: 3,
  BACK_ARM: 4,
  PETTICOAT: 5,
  SKIRT: 6,
  APRON_WAIST: 7,
  TORSO: 8,
  NECK_HEAD: 9,
  FACE_FEATURES: 10,
  FRONT_HAIR: 11,
  HEADWEAR: 12,
  FRONT_ARM: 13,
  WEAPON: 14,
  GLOW_FX: 15,
} as const;

export type SpritePartId = (typeof SPRITE_PART)[keyof typeof SPRITE_PART];

export interface HdPixelPainter {
  setPart: (part: SpritePartId) => void;
  px: (x: number, y: number, color: string, emissive?: boolean) => void;
  rect: (x: number, y: number, w: number, h: number, color: string, emissive?: boolean) => void;
  hline: (x: number, y: number, len: number, color: string, emissive?: boolean) => void;
  vline: (x: number, y: number, len: number, color: string, emissive?: boolean) => void;
  ellipse: (cx: number, cy: number, rx: number, ry: number, color: string, emissive?: boolean) => void;
  poly: (pts: Array<[number, number]>, color: string, emissive?: boolean) => void;
  line: (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string,
    thickness?: number,
    emissive?: boolean,
  ) => void;
  bezierRibbon: (
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    w0: number,
    w1: number,
    color: string,
    emissive?: boolean,
  ) => void;
  stamp: (
    ox: number,
    oy: number,
    rows: string[],
    palette: Record<string, string>,
    emissiveKeys?: Set<string>,
  ) => void;
}

const hexCache = new Map<string, [number, number, number, number]>();

function parseHexRgba(color: string): [number, number, number, number] {
  const cached = hexCache.get(color);
  if (cached) return cached;
  const clean = color.startsWith('#') ? color.slice(1) : color;
  let res: [number, number, number, number] = [255, 0, 255, 255];
  if (clean.length === 6) {
    res = [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
      255,
    ];
  } else if (clean.length === 8) {
    res = [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
      parseInt(clean.slice(6, 8), 16),
    ];
  }
  hexCache.set(color, res);
  return res;
}

function shadeToward(
  r: number,
  g: number,
  b: number,
  targetR: number,
  targetG: number,
  targetB: number,
  ratio: number,
): [number, number, number] {
  const keep = 1 - ratio;
  return [
    Math.max(0, Math.min(255, Math.round(r * keep + targetR * ratio))),
    Math.max(0, Math.min(255, Math.round(g * keep + targetG * ratio))),
    Math.max(0, Math.min(255, Math.round(b * keep + targetB * ratio))),
  ];
}

/** 精选需要内部结构分离线的部件组合（只在真正需要区分边界处落笔，保持像素画面极致清爽！） */
function shouldSeparateParts(lowerPart: number, upperPart: number): boolean {
  if (lowerPart === upperPart || lowerPart === SPRITE_PART.NONE || upperPart === SPRITE_PART.NONE) {
    return false;
  }
  if (upperPart === SPRITE_PART.FACE_FEATURES || lowerPart === SPRITE_PART.FACE_FEATURES) return false;
  if (upperPart === SPRITE_PART.GLOW_FX || lowerPart === SPRITE_PART.GLOW_FX) return false;
  if (
    (lowerPart === SPRITE_PART.BACK_HAIR && upperPart === SPRITE_PART.FRONT_HAIR) ||
    (lowerPart === SPRITE_PART.FRONT_HAIR && upperPart === SPRITE_PART.BACK_HAIR)
  ) {
    return false;
  }
  return upperPart > lowerPart;
}

/**
 * 100% 零抗锯齿整数像素渲染器（浏览器与离线 Node 审稿脚本共用同一份逐像素管线）
 */
export function renderHdRigFrameToRgba(
  drawFn: (p: HdPixelPainter, pose: RigPose) => void,
  pose: RigPose,
  flipX: boolean,
  mode: 'body' | 'glow' | 'flash',
  width = HD_SPRITE_WIDTH,
  height = HD_SPRITE_HEIGHT,
): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(width * height * 4);
  const partMap = new Uint8Array(width * height);
  const emissiveMap = new Uint8Array(width * height);

  let currentPart: SpritePartId = SPRITE_PART.TORSO;
  const shouldDraw = (emissive?: boolean) => (mode === 'glow' ? Boolean(emissive) : true);

  const putRaw = (x: number, y: number, c: [number, number, number, number], emissive?: boolean) => {
    const ix = Math.round(flipX ? width - 1 - x : x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= width || iy >= height) return;
    const cell = iy * width + ix;
    const idx = cell * 4;
    if (mode === 'flash') {
      rgba[idx] = 255;
      rgba[idx + 1] = 255;
      rgba[idx + 2] = 255;
      rgba[idx + 3] = 255;
    } else {
      rgba[idx] = c[0];
      rgba[idx + 1] = c[1];
      rgba[idx + 2] = c[2];
      rgba[idx + 3] = c[3];
    }
    partMap[cell] = currentPart;
    emissiveMap[cell] = emissive ? 1 : 0;
  };

  const painter: HdPixelPainter = {
    setPart: (part) => {
      currentPart = part;
    },
    px: (x, y, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      putRaw(x, y, parseHexRgba(color), emissive);
    },
    rect: (x, y, w, h, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      const c = parseHexRgba(color);
      const x0 = Math.round(x);
      const y0 = Math.round(y);
      const rw = Math.max(1, Math.round(w));
      const rh = Math.max(1, Math.round(h));
      for (let py = y0; py < y0 + rh; py++) {
        for (let px = x0; px < x0 + rw; px++) putRaw(px, py, c, emissive);
      }
    },
    hline: (x, y, len, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      const c = parseHexRgba(color);
      const x0 = Math.round(x);
      const y0 = Math.round(y);
      const l = Math.max(1, Math.round(len));
      for (let px = x0; px < x0 + l; px++) putRaw(px, y0, c, emissive);
    },
    vline: (x, y, len, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      const c = parseHexRgba(color);
      const x0 = Math.round(x);
      const y0 = Math.round(y);
      const l = Math.max(1, Math.round(len));
      for (let py = y0; py < y0 + l; py++) putRaw(x0, py, c, emissive);
    },
    ellipse: (cx, cy, rx, ry, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      const c = parseHexRgba(color);
      const safeRx = Math.max(0.5, rx);
      const safeRy = Math.max(0.5, ry);
      const minX = Math.floor(cx - safeRx);
      const maxX = Math.ceil(cx + safeRx);
      const minY = Math.floor(cy - safeRy);
      const maxY = Math.ceil(cy + safeRy);
      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const dx = (px - cx) / safeRx;
          const dy = (py - cy) / safeRy;
          if (dx * dx + dy * dy <= 1) putRaw(px, py, c, emissive);
        }
      }
    },
    poly: (pts, color, emissive) => {
      if (!shouldDraw(emissive) || pts.length < 3) return;
      const c = parseHexRgba(color);
      let minY = height;
      let maxY = 0;
      for (const [, py] of pts) {
        if (py < minY) minY = Math.floor(py);
        if (py > maxY) maxY = Math.ceil(py);
      }
      minY = Math.max(0, minY);
      maxY = Math.min(height - 1, maxY);
      for (let y = minY; y <= maxY; y++) {
        const sy = y + 0.5;
        const xs: number[] = [];
        for (let i = 0; i < pts.length; i++) {
          const [x1, y1] = pts[i];
          const [x2, y2] = pts[(i + 1) % pts.length];
          if ((y1 <= sy && y2 > sy) || (y2 <= sy && y1 > sy)) {
            xs.push(x1 + ((sy - y1) * (x2 - x1)) / (y2 - y1));
          }
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
          const xStart = Math.max(0, Math.floor(xs[i] + 0.2));
          const xEnd = Math.min(width - 1, Math.floor(xs[i + 1] - 0.2));
          for (let x = xStart; x <= xEnd; x++) putRaw(x, y, c, emissive);
        }
      }
    },
    line: (x0, y0, x1, y1, color, thickness = 1, emissive) => {
      if (!shouldDraw(emissive)) return;
      const c = parseHexRgba(color);
      const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      const half = Math.floor(thickness / 2);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = Math.round(x0 + (x1 - x0) * t);
        const py = Math.round(y0 + (y1 - y0) * t);
        for (let dy = 0; dy < thickness; dy++) {
          for (let dx = 0; dx < thickness; dx++) {
            putRaw(px - half + dx, py - half + dy, c, emissive);
          }
        }
      }
    },
    bezierRibbon: (p0, p1, p2, w0, w1, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      const c = parseHexRgba(color);
      const approxLen =
        Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const steps = Math.max(8, Math.ceil(approxLen * 2.2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const bx = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
        const by = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
        const rad = Math.max(0.45, (w0 * mt + w1 * t) * 0.5);
        if (rad <= 0.6) {
          putRaw(bx, by, c, emissive);
        } else {
          const rCeil = Math.ceil(rad);
          const r2 = rad * rad;
          for (let dy = -rCeil; dy <= rCeil; dy++) {
            for (let dx = -rCeil; dx <= rCeil; dx++) {
              if (dx * dx + dy * dy <= r2) putRaw(bx + dx, by + dy, c, emissive);
            }
          }
        }
      }
    },
    stamp: (ox, oy, rows, palette, emissiveKeys) => {
      for (let r = 0; r < rows.length; r++) {
        const line = rows[r];
        for (let cIdx = 0; cIdx < line.length; cIdx++) {
          const ch = line[cIdx];
          if (ch === '.' || ch === ' ') continue;
          const col = palette[ch];
          if (!col) continue;
          const em = emissiveKeys ? emissiveKeys.has(ch) : false;
          if (!shouldDraw(em)) continue;
          putRaw(ox + cIdx, oy + r, parseHexRgba(col), em);
        }
      }
    },
  };

  drawFn(painter, pose);

  if (mode === 'body') {
    const srcRgba = new Uint8ClampedArray(rgba);

    // 1. 精致克制的部件交界内分离线（Sel-out）与刘海暖橘阴影
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = y * width + x;
        const idx = cell * 4;
        if (srcRgba[idx + 3] < 128 || emissiveMap[cell] === 1) continue;
        const myPart = partMap[cell];
        if (myPart === SPRITE_PART.FACE_FEATURES || myPart === SPRITE_PART.GLOW_FX) continue;

        let touchedUpper = false;
        let castAbove = false;
        let upperIsHead = false;
        let upperIsHair = false;

        const dirs = [
          [0, -1],
          [0, 1],
          [-1, 0],
          [1, 0],
        ];
        for (let d = 0; d < 4; d++) {
          const nx = x + dirs[d][0];
          const ny = y + dirs[d][1];
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nCell = ny * width + nx;
          if (srcRgba[nCell * 4 + 3] < 128) continue;
          const nPart = partMap[nCell];
          if (shouldSeparateParts(myPart, nPart)) {
            touchedUpper = true;
            if (d === 0) castAbove = true;
            if (nPart === SPRITE_PART.NECK_HEAD) upperIsHead = true;
            if (nPart === SPRITE_PART.FRONT_HAIR) upperIsHair = true;
          }
        }

        if (touchedUpper) {
          const r = srcRgba[idx];
          const g = srcRgba[idx + 1];
          const b = srcRgba[idx + 2];
          if (myPart === SPRITE_PART.NECK_HEAD && upperIsHair) {
            // 刘海盖在脸颊上：仅下方 1px 施以干净粉橘暖影，脸蛋干净红润绝不脏灰！
            if (castAbove) {
              const [sr, sg, sb] = shadeToward(r, g, b, 205, 112, 118, 0.3);
              rgba[idx] = sr;
              rgba[idx + 1] = sg;
              rgba[idx + 2] = sb;
            }
          } else {
            // 衣领/袖口/裙摆/腿部交界：清晰利落的暖紫褐内分离线
            const strength = upperIsHead ? 0.48 : castAbove ? 0.45 : 0.34;
            const [sr, sg, sb] = shadeToward(r, g, b, 42, 20, 48, strength);
            rgba[idx] = sr;
            rgba[idx + 1] = sg;
            rgba[idx + 2] = sb;
          }
        }
      }
    }

    // 2. 温润高雅的 1px 深紫褐自适应外轮廓（既有经典日式像素画的温暖高级感，又高对比不发灰！）
    const postSrc = new Uint8ClampedArray(rgba);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = y * width + x;
        const idx = cell * 4;
        if (postSrc[idx + 3] >= 128) continue;

        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let cnt = 0;
        let allEmissive = true;

        const nCoords = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
        for (const [nx, ny] of nCoords) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nc = ny * width + nx;
          if (postSrc[nc * 4 + 3] >= 128) {
            sumR += postSrc[nc * 4];
            sumG += postSrc[nc * 4 + 1];
            sumB += postSrc[nc * 4 + 2];
            cnt += 1;
            if (emissiveMap[nc] === 0) allEmissive = false;
          }
        }

        if (cnt > 0) {
          const avgR = sumR / cnt;
          const avgG = sumG / cnt;
          const avgB = sumB / cnt;
          if (allEmissive) {
            const [or, og, ob] = shadeToward(avgR, avgG, avgB, 42, 18, 52, 0.56);
            rgba[idx] = or;
            rgba[idx + 1] = og;
            rgba[idx + 2] = ob;
            rgba[idx + 3] = 225;
          } else {
            // 深紫褐基调 (42, 22, 46) 融合 24% 材质自身色相 → 温润不死黑！
            const [or, og, ob] = shadeToward(avgR, avgG, avgB, 40, 20, 46, 0.76);
            rgba[idx] = or;
            rgba[idx + 1] = og;
            rgba[idx + 2] = ob;
            rgba[idx + 3] = 255;
          }
        }
      }
    }
  }

  return rgba;
}

// ============================================================================
//  v3 3/4 侧身大集群萌系少女精雕积木（水灵圆弧大眼 + 蓬松发团 + 干净波浪大裙！）
// ============================================================================

export interface KawaiiHeadOptions {
  skinLight?: string;
  skinMain?: string;
  skinShade?: string;
  lashColor?: string;
  /** 深瞳/虹膜上部浓色 */
  irisDark: string;
  /** 虹膜饱满主色 */
  irisMid: string;
  /** 虹膜下缘月牙亮光色 */
  irisGlow: string;
  blushColor?: string;
  /** 攻击或微笑时可爱小虎牙 */
  vampireFang?: boolean;
}

/**
 * 20×16 柔圆 3/4 侧身萌系少女脸 + 璀璨水灵 4×4 弧睫宝石大眼！
 * 彻底修掉“凶扁斜杠眼 / 呆滞豆豆眼 / 无腮红 / 方下巴”四大硬伤！
 */
export function drawKawaiiHead64(
  p: HdPixelPainter,
  cx: number,
  headY: number,
  pose: RigPose,
  opts: KawaiiHeadOptions,
): void {
  const skinLight = opts.skinLight ?? '#fff4eb';
  const skinMain = opts.skinMain ?? '#ffe0cc';
  const skinShade = opts.skinShade ?? '#e8ad99';
  const lash = opts.lashColor ?? '#2e1530';
  const blush = opts.blushColor ?? '#ff94b0';

  // 1. 纤细娇嫩少女脖颈（3px 秀气细脖，告别粗硬脖子！）
  p.setPart(SPRITE_PART.NECK_HEAD);
  p.rect(cx - 1, headY + 7, 3, 4, skinShade);
  p.vline(cx, headY + 8, 3, skinMain);

  // 2. 饱满苹果颊 + 柔尖 3/4 侧颜小下巴（圆润Q弹，下巴微偏右 1px 呈现生动 3/4 角度！）
  const faceRows = [
    '....llllllllll....',
    '..llmmmmmmmmmmll..',
    '.lmmmmmmmmmmmmmml.',
    'lmmmmmmmmmmmmmmmml',
    'lmmmmmmmmmmmmmmmml',
    'smmmmmmmmmmmmmmmml',
    'smmmmmmmmmmmmmmmml',
    'smmmmmmmmmmmmmmmms',
    'ssmmmmmmmmmmmmmmms',
    '.ssmmmmmmmmmmmmms.',
    '.ssmmmmmmmmmmmmss.',
    '..ssmmmmmmmmmmss..',
    '...ssmmmmmmmmss...',
    '.....ssmmmmss.....',
    '.......ssss.......',
  ];
  p.stamp(cx - 9, headY - 7, faceRows, {
    l: skinLight,
    m: skinMain,
    s: skinShade,
  });

  // 3. 真正超萌的 4×4 水灵宝石大眼（柔弯弧形上睫毛 + 清澈眼白 + 闪耀纯白大星光 + 下虹膜宝石亮弧！）
  p.setPart(SPRITE_PART.FACE_FEATURES);
  const eyeTopY = headY - 1;
  // 3/4 侧身布局：左眼（近侧）完整 4×4，中间留 3px 洁净鼻梁，右眼（远侧）3×4 精致透视！
  const leftEyeX = cx - 5;
  const rightEyeX = cx + 2;

  if (pose.expr === 'hurt') {
    p.px(leftEyeX, eyeTopY, lash);
    p.px(leftEyeX + 1, eyeTopY + 1, lash);
    p.px(leftEyeX + 2, eyeTopY + 2, lash);
    p.px(leftEyeX + 1, eyeTopY + 3, lash);
    p.px(leftEyeX, eyeTopY + 3, lash);

    p.px(rightEyeX + 2, eyeTopY, lash);
    p.px(rightEyeX + 1, eyeTopY + 1, lash);
    p.px(rightEyeX, eyeTopY + 2, lash);
    p.px(rightEyeX + 1, eyeTopY + 3, lash);
    p.px(rightEyeX + 2, eyeTopY + 3, lash);
  } else if (pose.blink) {
    // 软萌笑眼弯弯弧线
    p.px(leftEyeX - 1, eyeTopY + 2, lash);
    p.hline(leftEyeX, eyeTopY + 1, 3, lash);
    p.px(leftEyeX + 3, eyeTopY + 2, lash);

    p.px(rightEyeX, eyeTopY + 2, lash);
    p.hline(rightEyeX + 1, eyeTopY + 1, 2, lash);
    p.px(rightEyeX + 3, eyeTopY + 2, lash);
  } else {
    const focused = pose.expr === 'focus';
    // 教科书级 3/4 朝右萌系宝石大眼：双眼统一微向右看、饱满圆润 3×3 宝石虹膜、同向左上纯白星光高光 + 柔弧上睫毛！
    const leftEye = focused
      ? [
          '.LLL',
          'wWPD',
          'wDPM',
          '.GGM',
        ]
      : [
          '.LL.',
          'wWPD',
          'wDPM',
          '.GGM',
        ];
    const rightEye = focused
      ? [
          'LLL',
          'WPD',
          'DPM',
          'GGM',
        ]
      : [
          'LL.',
          'WPD',
          'DPM',
          'GGM',
        ];
    const pal: Record<string, string> = {
      L: lash,
      w: '#fffcff',
      W: '#ffffff',
      P: '#210a26',
      D: opts.irisDark,
      M: opts.irisMid,
      G: opts.irisGlow,
    };
    p.stamp(leftEyeX, eyeTopY, leftEye, pal);
    p.stamp(rightEyeX, eyeTopY, rightEye, pal);
  }

  // 软萌苹果颊樱粉腮红（紧贴眼下外侧，2×1 柔和粉润，瞬间注入少女血色！）
  p.hline(leftEyeX - 1, eyeTopY + 4, 2, blush);
  p.hline(rightEyeX + 2, eyeTopY + 4, 2, blush);

  // 精致可爱小嘴（告别死板横黑杠！采用暖粉红 1~2px 柔和浅笑）
  const mouthX = cx + 1;
  const mouthY = eyeTopY + 5;
  if (pose.expr === 'hurt') {
    p.rect(mouthX - 1, mouthY, 2, 2, '#d15671');
    p.px(mouthX - 1, mouthY, '#ffa3b8');
  } else if (pose.expr === 'focus') {
    p.hline(mouthX - 1, mouthY, 2, '#cc4b68');
    p.px(mouthX, mouthY + 1, '#ff94ab');
    if (opts.vampireFang) {
      // 蕾米莉亚招牌俏皮小虎牙！
      p.px(mouthX + 1, mouthY, '#ffffff');
    }
  } else {
    p.px(mouthX - 1, mouthY, '#de7a8b');
    p.px(mouthX, mouthY, '#c95f74');
  }
}

export interface CleanAnimeHairOptions {
  deep: string;
  dark: string;
  mid: string;
  light: string;
  spec: string;
  /** 左/右侧包脸鬓发长度 */
  leftLockLen?: number;
  rightLockLen?: number;
  /** 发型蓬松高度 */
  fluff?: number;
  /** 是否在发尾向外微卷翘（如蕾米短波浪 bob 头） */
  bobFlare?: boolean;
  sway?: number;
}

/**
 * 干净大色块集群萌系发型（Big Clean Clusters —— 彻底告别 5 根竖条栅栏刘海！）
 * 饱满圆润穹顶 + 清晰大三角空气额头 + 左右大块包颊弯发 + 亮泽天使环高光！
 */
export function drawCleanAnimeHair64(
  p: HdPixelPainter,
  cx: number,
  headY: number,
  opts: CleanAnimeHairOptions,
): void {
  p.setPart(SPRITE_PART.FRONT_HAIR);
  const fl = opts.fluff ?? 2;
  const sw = opts.sway ?? 0;

  // 1. 蓬松饱满圆穹发冠（大块干净体积，零碎噪点）
  p.ellipse(cx - 0.5, headY - 7.5 - fl * 0.4, 11.2, 5.6 + fl * 0.4, opts.deep);
  p.ellipse(cx - 0.5, headY - 8.2 - fl * 0.4, 10.0, 4.6 + fl * 0.3, opts.dark);
  p.ellipse(cx - 1.2, headY - 9.0 - fl * 0.4, 8.2, 3.2, opts.mid);

  // 2. 柔美弯曲两段式天使光环高光（干净宽亮带）
  p.hline(cx - 6, headY - 9 - fl, 4, opts.light);
  p.hline(cx - 5, headY - 10 - fl, 3, opts.spec);
  p.hline(cx + 1, headY - 10 - fl, 4, opts.light);
  p.hline(cx + 2, headY - 10 - fl, 2, opts.spec);

  // 3. 大块空气感三瓣刘海（左斜大片 + 中央一撮俏皮 V 尖 + 右斜大片，给双眼留出明亮额头呼吸感！）
  // 左大片斜刘海
  p.poly(
    [
      [cx - 10, headY - 7],
      [cx - 2, headY - 7],
      [cx - 4, headY - 2],
      [cx - 8, headY - 1],
      [cx - 10, headY - 3],
    ],
    opts.dark,
  );
  p.poly(
    [
      [cx - 9, headY - 7],
      [cx - 3, headY - 7],
      [cx - 5, headY - 3],
      [cx - 8, headY - 3],
    ],
    opts.mid,
  );

  // 中央一撮俏皮尖尾刘海（优雅垂于双眉之间，绝对不挡眼睛！）
  p.poly(
    [
      [cx - 2, headY - 7],
      [cx + 3, headY - 7],
      [cx + 1, headY - 1],
      [cx - 1, headY - 3],
    ],
    opts.dark,
  );
  p.poly(
    [
      [cx - 1, headY - 7],
      [cx + 2, headY - 7],
      [cx + 1, headY - 3],
    ],
    opts.light,
  );

  // 右大片斜刘海
  p.poly(
    [
      [cx + 3, headY - 7],
      [cx + 10, headY - 7],
      [cx + 10, headY - 2],
      [cx + 7, headY - 2],
      [cx + 5, headY - 4],
    ],
    opts.dark,
  );
  p.poly(
    [
      [cx + 4, headY - 7],
      [cx + 9, headY - 7],
      [cx + 8, headY - 4],
      [cx + 5, headY - 5],
    ],
    opts.mid,
  );

  // 4. 饱满柔和弯弧双鬓（左侧近景更蓬厚，右侧远景收拢修颜）
  const lLen = opts.leftLockLen ?? 12;
  const rLen = opts.rightLockLen ?? 10;
  const lEndX = opts.bobFlare ? cx - 12.5 + sw * 0.6 : cx - 9.0 + sw * 0.5;
  const rEndX = opts.bobFlare ? cx + 11.5 - sw * 0.4 : cx + 9.2 - sw * 0.3;

  // 左侧大束鬓发
  p.bezierRibbon([cx - 9.5, headY - 5], [cx - 12.2, headY + lLen * 0.45], [lEndX, headY + lLen], 4.8, 1.4, opts.deep);
  p.bezierRibbon([cx - 9.2, headY - 4], [cx - 11.2, headY + lLen * 0.42], [lEndX + 0.6, headY + lLen - 1.5], 3.2, 0.9, opts.mid);
  p.bezierRibbon([cx - 9.5, headY - 3], [cx - 10.6, headY + lLen * 0.3], [cx - 10.0, headY + lLen * 0.55], 1.4, 0.6, opts.light);

  // 右侧修颜鬓发
  p.bezierRibbon([cx + 9.0, headY - 5], [cx + 11.2, headY + rLen * 0.45], [rEndX, headY + rLen], 4.0, 1.2, opts.deep);
  p.bezierRibbon([cx + 8.8, headY - 4], [cx + 10.2, headY + rLen * 0.42], [rEndX - 0.5, headY + rLen - 1.5], 2.4, 0.8, opts.mid);
}

export interface CleanAnimeSkirtOptions {
  waistX: number;
  waistY: number;
  waistW: number;
  hemY: number;
  hemW: number;
  /** 3/4 侧身裙摆自然向右侧偏摆偏移（配合错步腿超生动！） */
  tiltRight?: number;
  /** 柔和 3D 透视圆弧下垂量（2.2~2.8px） */
  archDepth?: number;
  /** 宽大优雅的波浪瓣数（仅 3~4 瓣大波浪，绝不做 12 个尖刺锯齿！） */
  waveLobes?: number;
  waveAmp?: number;
  swayX?: number;
  colors: {
    deep: string;
    shadow: string;
    main: string;
    light: string;
    highlight: string;
  };
  /** 随波浪弧线自然贴合的单道优雅滚边/红带 */
  trimBand?: {
    offsetFromHem: number;
    thickness: number;
    color: string;
    shadowColor?: string;
  };
  /** 柔和探出裙底的雪白荷叶衬裙（大波浪柔和收口，无尖刺、无密集锯齿！） */
  petticoat?: {
    peekDepth: number;
    shade: string;
    main: string;
    highlight: string;
  };
}

/**
 * 干净大体积 3/4 优雅波浪裙引擎 v3！
 * 彻底抛弃“平底梯形”和“高频斑马竖条纹”，采用像素大触级【3 大块干净立体受光面 + 2 道柔和宽垂褶 + 柔美圆弧波浪裙摆】！
 */
export function drawCleanAnimeSkirt64(
  p: HdPixelPainter,
  opts: CleanAnimeSkirtOptions,
): void {
  const arch = opts.archDepth ?? 2.5;
  const lobes = Math.max(2, opts.waveLobes ?? 3.5);
  const amp = opts.waveAmp ?? 1.4;
  const sway = (opts.swayX ?? 0) + (opts.tiltRight ?? 1.0);
  const totalH = Math.max(5, opts.hemY - opts.waistY);

  const getSpanAtV = (v: number): [number, number] => {
    const flare = Math.pow(Math.max(0, Math.min(1, v)), 0.82);
    const halfW = (opts.waistW * (1 - flare) + opts.hemW * flare) * 0.5;
    const center = opts.waistX + sway * flare;
    return [center - halfW, center + halfW];
  };

  // 自然 3D 透视圆弧 + 宽大柔美布料波浪（左侧轻扬、中后段饱满垂落、右侧收弧）
  const getHemYAtU = (u: number): number => {
    const cu = Math.max(-1, Math.min(1, u));
    const dome = (1 - cu * cu) * arch;
    // 3/4 侧身微斜：右侧前腿处略低 0.8px，左侧后方轻扬！
    const slant = cu * 0.7;
    const gentleWave = Math.sin((cu + 1) * 0.5 * lobes * Math.PI) * amp * 0.5 + amp * 0.5;
    return opts.hemY + dome + slant + gentleWave;
  };

  // 1. 柔和探出的雪白内层荷叶衬裙（干净圆润，无细碎锯齿！）
  if (opts.petticoat) {
    const pet = opts.petticoat;
    p.setPart(SPRITE_PART.PETTICOAT);
    const petHalfW = Math.max(5, opts.hemW * 0.5 - 1.2);
    const petCenter = opts.waistX + sway;
    const minX = Math.floor(petCenter - petHalfW);
    const maxX = Math.ceil(petCenter + petHalfW);
    for (let x = minX; x <= maxX; x++) {
      const u = (x - petCenter) / Math.max(1, petHalfW);
      if (Math.abs(u) > 1) continue;
      const edgeSoft = Math.sqrt(Math.max(0, 1 - u * u * 0.9));
      const outerHem = getHemYAtU(u * 0.94);
      const wave = Math.abs(Math.sin((u + 1) * 0.5 * 5 * Math.PI + 0.3));
      const peek = (pet.peekDepth + wave * 1.1) * (0.4 + 0.6 * edgeSoft);
      const topY = Math.floor(outerHem - 1);
      const botY = Math.round(outerHem + peek);
      for (let y = topY; y <= botY; y++) {
        let col = pet.main;
        if (y <= Math.floor(outerHem) || u > 0.42) col = pet.shade;
        else if (y === botY && u < 0.2) col = pet.highlight;
        p.px(x, y, col);
      }
    }
  }

  // 2. 干净大色块立体外裙（左上大片受光面 + 中央柔美宽褶 + 右后侧厚重立体阴影！）
  p.setPart(SPRITE_PART.SKIRT);
  const maxY = Math.ceil(opts.hemY + arch + amp + 3);
  for (let y = Math.floor(opts.waistY); y <= maxY; y++) {
    const vRaw = (y - opts.waistY) / totalH;
    const v = Math.max(0, Math.min(1.2, vRaw));
    const [xLeft, xRight] = getSpanAtV(Math.min(1, v));
    const xStart = Math.floor(xLeft);
    const xEnd = Math.ceil(xRight);
    const span = Math.max(1, xRight - xLeft);

    for (let x = xStart; x <= xEnd; x++) {
      const u = ((x - xLeft) / span) * 2 - 1;
      if (u < -1 || u > 1) continue;
      const hemAtX = getHemYAtU(u);
      if (y > Math.round(hemAtX)) continue;

      const distFromHem = hemAtX - y;

      // 随波浪平滑弯曲的丝带/滚边
      if (
        opts.trimBand &&
        distFromHem >= opts.trimBand.offsetFromHem &&
        distFromHem < opts.trimBand.offsetFromHem + opts.trimBand.thickness
      ) {
        const useSh = opts.trimBand.shadowColor && u > 0.38;
        p.px(x, y, useSh ? opts.trimBand.shadowColor! : opts.trimBand.color);
        continue;
      }

      // 仅在 u = -0.32 和 u = +0.28 处雕琢 2 道宽软优雅的自然布料垂褶，彻底告别高频斑马条纹！
      const fold1 = Math.exp(-Math.pow((u + 0.32) / 0.13, 2)) * Math.pow(Math.min(1, v), 0.75);
      const fold2 = Math.exp(-Math.pow((u - 0.28) / 0.14, 2)) * Math.pow(Math.min(1, v), 0.75);
      const foldDip = Math.max(fold1, fold2);

      // 干净 3/4 球面大受光场（左前明亮饱满 → 中间柔和主色 → 右侧及最底阴影收厚！）
      let lum = 0.62 - u * 0.34 - foldDip * 0.34 - (v < 0.15 ? 0.12 : 0);
      if (distFromHem < 1.2) lum -= 0.08;

      let col = opts.colors.main;
      if (lum < 0.26) col = opts.colors.deep;
      else if (lum < 0.44) col = opts.colors.shadow;
      else if (lum > 0.8) col = opts.colors.highlight;
      else if (lum > 0.66) col = opts.colors.light;

      p.px(x, y, col);
    }
  }
}

/**
 * 真实 3/4 侧身斜错步少女双腿（后脚靠左偏上踩实，前脚靠右偏下优雅前迈，脚尖同朝右！）
 */
export function drawStaggeredLegs64(
  p: HdPixelPainter,
  cx: number,
  topY: number,
  footY: number,
  pose: RigPose,
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
  const stride = Math.round(pose.stride * 3.8);
  const backLift = pose.stride > 0.25 ? -2 : 0;
  const frontLift = pose.stride < -0.25 ? -2 : 0;

  const drawLeg = (lx: number, fy: number, isFront: boolean) => {
    const legTop = topY + (isFront ? frontLift : backLift);
    const legFoot = fy + (isFront ? frontLift : backLift);
    const h = Math.max(5, legFoot - legTop);
    const sockCol = isFront ? opts.sockLight : opts.sockShadow;

    // 纤细少女小腿（3px 精致洁净）
    p.rect(lx - 1, legTop, 4, Math.max(2, h - 4), sockCol);
    p.rect(lx, legTop + Math.max(2, h - 4), 3, 4, sockCol);
    if (opts.skinColor) {
      p.rect(lx - 1, legTop, 4, 2, opts.skinColor);
    }
    p.vline(lx + 1, legTop + 1, Math.max(2, h - 4), isFront ? '#ffffff' : opts.sockLight);

    // 优雅朝右圆头小鞋（3/4 透视鞋尖朝右探出！）
    p.rect(lx - 1, legFoot - 3, 6, 3, opts.shoeDark);
    p.rect(lx, legFoot - 3, 5, 2, isFront ? opts.shoeMain : opts.shoeDark);
    p.hline(lx + 1, legFoot - 3, 3, opts.shoeMain);
    if (opts.shoeHighlight) {
      p.px(lx + 3, legFoot - 3, opts.shoeHighlight);
    }
  };

  // 后脚略靠左上方（y = footY - 2），前脚靠右下方（y = footY）→ 一秒立出 3/4 立体地面透视！
  drawLeg(cx - 5 - stride, footY - 2, false);
  drawLeg(cx + 3 + stride, footY, true);
}

/**
 * 圆润饱满立体 3/4 动漫大蝴蝶结（干净大色块集群 + 柔美内折痕 + 飘逸收尖丝带）
 */
export function drawCuteRibbonBow64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  opts: {
    leftSpan: number;
    rightSpan: number;
    wingHeight: number;
    tailLen: number;
    sway?: number;
    dark: string;
    main: string;
    light: string;
    trim?: string;
    part?: SpritePartId;
  },
): void {
  if (opts.part) p.setPart(opts.part);
  const sw = opts.sway ?? 0;
  const lw = opts.leftSpan;
  const rw = opts.rightSpan;
  const h = opts.wingHeight;

  // 飘逸双垂带
  if (opts.tailLen > 0) {
    p.bezierRibbon(
      [cx - 3, cy + 2],
      [cx - lw * 0.55 + sw * 0.4, cy + opts.tailLen * 0.55],
      [cx - lw * 0.72 + sw, cy + opts.tailLen],
      3.8,
      1.6,
      opts.dark,
    );
    p.bezierRibbon(
      [cx - 2.6, cy + 2.5],
      [cx - lw * 0.52 + sw * 0.4, cy + opts.tailLen * 0.5],
      [cx - lw * 0.68 + sw, cy + opts.tailLen - 1.5],
      2.2,
      0.8,
      opts.main,
    );
    p.bezierRibbon(
      [cx + 3, cy + 2],
      [cx + rw * 0.52 - sw * 0.3, cy + opts.tailLen * 0.55],
      [cx + rw * 0.65 - sw * 0.7, cy + opts.tailLen],
      3.4,
      1.5,
      opts.dark,
    );
    p.bezierRibbon(
      [cx + 2.6, cy + 2.5],
      [cx + rw * 0.48 - sw * 0.3, cy + opts.tailLen * 0.5],
      [cx + rw * 0.6 - sw * 0.7, cy + opts.tailLen - 1.5],
      2.0,
      0.8,
      opts.light,
    );
  }

  // 经典挺括饱满梯形折翼蝴蝶结（外缘宽展微弧、中央收腰，彻底告别米老鼠圆耳朵！）
  const ly = cy + sw * 0.4;
  p.poly(
    [
      [cx - 1, cy - 1],
      [cx - lw + 1, ly - h * 0.56],
      [cx - lw - 1, ly - h * 0.2],
      [cx - lw - 1, ly + h * 0.3],
      [cx - lw + 2, ly + h * 0.54],
      [cx - 1, cy + 2],
    ],
    opts.dark,
  );
  p.poly(
    [
      [cx - 2, cy - 0.5],
      [cx - lw + 2, ly - h * 0.44],
      [cx - lw, ly + h * 0.22],
      [cx - lw + 2, ly + h * 0.38],
      [cx - 2, cy + 1],
    ],
    opts.main,
  );
  p.line(cx - 4, cy - 1, cx - lw + 3, ly - h * 0.38, opts.light, 1);
  p.line(cx - 3, cy + 0.5, cx - Math.round(lw * 0.65), Math.round(ly + 1), opts.dark, 1);
  if (opts.trim) {
    p.line(cx - lw, ly - h * 0.36, cx - lw - 1, ly + h * 0.32, opts.trim, 1);
  }

  // 右翼（3/4 视角略收拢，挺括有折角！）
  const ry = cy - sw * 0.35;
  p.poly(
    [
      [cx + 1, cy - 1],
      [cx + rw - 1, ry - h * 0.54],
      [cx + rw + 1, ry - h * 0.18],
      [cx + rw + 1, ry + h * 0.28],
      [cx + rw - 2, ry + h * 0.52],
      [cx + 1, cy + 2],
    ],
    opts.dark,
  );
  p.poly(
    [
      [cx + 2, cy - 0.5],
      [cx + rw - 2, ry - h * 0.42],
      [cx + rw, ry + h * 0.2],
      [cx + rw - 2, ry + h * 0.36],
      [cx + 2, cy + 1],
    ],
    opts.main,
  );
  p.line(cx + 4, cy - 1, cx + rw - 3, ry - h * 0.36, opts.light, 1);
  p.line(cx + 3, cy + 0.5, cx + Math.round(rw * 0.65), Math.round(ry + 1), opts.dark, 1);
  if (opts.trim) {
    p.line(cx + rw, ry - h * 0.34, cx + rw + 1, ry + h * 0.3, opts.trim, 1);
  }

  // 中央饱满绸结
  p.ellipse(cx, cy + 0.5, 2.7, 2.3, opts.dark);
  p.ellipse(cx - 0.3, cy - 0.2, 1.8, 1.5, opts.light);
}

/**
 * 2px 软萌双色少女小臂（v8 校准标准：上沿受光亮肤 + 下沿柔影，彻底兼顾纤细度与柔美肉感！）
 */
export function drawSoftChibiArm64(
  p: HdPixelPainter,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  lightSkin = '#ffe8de',
  shadeSkin = '#efc2b6',
): void {
  p.line(x0, y0, x1, y1, shadeSkin, 2);
  p.line(x0, y0 - 1, x1, y1 - 1, lightSkin, 1);
}

/**
 * 端正娇小雪白/定制色泡泡袖 + 1px 彩带袖口（彻底杜绝壮汉三角肌球！）
 */
export function drawPuffSleeve64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  shade: string,
  main: string,
  cuffColor?: string,
  side: 'left' | 'right' = 'left',
): void {
  p.ellipse(cx, cy, 2.9, 2.5, shade);
  p.ellipse(cx + (side === 'left' ? -0.2 : 0.2), cy - 0.5, 2.1, 1.8, main);
  if (cuffColor) {
    if (side === 'left') {
      p.line(cx - 2.5, cy + 0.5, cx - 0.5, cy + 2.5, cuffColor, 1);
    } else {
      p.line(cx + 0.5, cy + 2.5, cx + 2.5, cy + 0.5, cuffColor, 1);
    }
  }
}

/**
 * 64×72 锐利璀璨像素斩击光弧
 */
export function drawSlashArc64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startRad: number,
  endRad: number,
  outerCol: string,
  midCol: string,
  coreCol: string,
): void {
  p.setPart(SPRITE_PART.GLOW_FX);
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = startRad + (endRad - startRad) * t;
    const sinEnv = Math.sin(t * Math.PI);
    const x = cx + Math.cos(ang) * rx;
    const y = cy + Math.sin(ang) * ry;
    const thick = sinEnv > 0.65 ? 3 : sinEnv > 0.28 ? 2 : 1;
    p.line(x, y, x, y, outerCol, thick, true);
    if (sinEnv > 0.35) {
      p.px(Math.round(x - Math.cos(ang) * 0.8), Math.round(y - Math.sin(ang) * 0.8), midCol, true);
    }
    if (sinEnv > 0.55) {
      p.px(Math.round(x), Math.round(y), coreCol, true);
    }
  }
}

/**
 * 华丽高饱和猩红黑骨哥特恶魔蝠翼（清晰凹弧剪影 + 饱满绯红亮膜 + 锐利翼尖！）
 */
export function drawGothicBatWings64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  opts: {
    leftSpan: number;
    rightSpan: number;
    height: number;
    flap: number;
    boneDark: string;
    boneLight: string;
    webDark: string;
    webMain: string;
    webLight: string;
    webGlow?: string;
  },
): void {
  p.setPart(SPRITE_PART.BACK_ACC);
  const fl = opts.flap;
  const drawSide = (dir: -1 | 1, span: number) => {
    const shX = cx + dir * 4;
    const shY = cy;
    const topX = cx + dir * Math.round(span * 0.86);
    const topY = cy - Math.round(opts.height * 0.7) + fl;
    const tipX = cx + dir * span;
    const tipY = cy - Math.round(opts.height * 0.08) + Math.round(fl * 1.15);
    const midLobeX = cx + dir * Math.round(span * 0.65);
    const midLobeY = cy + Math.round(opts.height * 0.38) + Math.round(fl * 0.55);
    const innerLobeX = cx + dir * Math.round(span * 0.34);
    const innerLobeY = cy + Math.round(opts.height * 0.46) + Math.round(fl * 0.25);

    // 凹弧蝠翼剪影
    p.poly(
      [
        [shX, shY],
        [topX, topY],
        [tipX, tipY],
        [Math.round((tipX + midLobeX) * 0.5) - dir * 2, Math.round((tipY + midLobeY) * 0.5) - 2],
        [midLobeX, midLobeY],
        [Math.round((midLobeX + innerLobeX) * 0.5) - dir * 1, Math.round((midLobeY + innerLobeY) * 0.5) - 2],
        [innerLobeX, innerLobeY],
        [shX, shY + 5],
      ],
      opts.webDark,
    );

    // 饱满明艳绯红翼膜主面
    p.poly(
      [
        [shX + dir * 2, shY + 1],
        [Math.round((shX + topX) * 0.56), Math.round((shY + topY) * 0.56) + 1],
        [Math.round((topX + tipX) * 0.52) - dir * 2, Math.round((topY + tipY) * 0.52) + 1],
        [midLobeX - dir * 2, midLobeY - 2],
        [innerLobeX, innerLobeY - 2],
      ],
      opts.webMain,
    );
    // 左上受光亮绯红区
    p.poly(
      [
        [shX + dir * 3, shY + 1],
        [Math.round((shX + topX) * 0.58), Math.round((shY + topY) * 0.58) + 2],
        [Math.round((shX + midLobeX) * 0.52), Math.round((shY + midLobeY) * 0.55)],
      ],
      opts.webLight,
    );

    // 锐利黑红指骨脉络
    p.bezierRibbon([shX, shY], [Math.round((shX + topX) * 0.5), topY - 2], [topX, topY], 2.5, 1.2, opts.boneDark);
    p.bezierRibbon([topX, topY], [Math.round((topX + tipX) * 0.55), Math.round((topY + tipY) * 0.45)], [tipX, tipY], 1.8, 0.7, opts.boneDark);
    p.line(topX, topY, midLobeX, midLobeY, opts.boneDark, 1);
    p.line(Math.round((shX + topX) * 0.55), Math.round((shY + topY) * 0.55), innerLobeX, innerLobeY, opts.boneDark, 1);
    p.line(shX + dir * 2, shY - 1, topX - dir * 1, topY + 1, opts.boneLight, 1);
    if (opts.webGlow) {
      p.px(topX, topY, opts.webGlow, true);
      p.px(tipX, tipY, opts.webGlow, true);
    }
  };

  drawSide(-1, opts.leftSpan);
  drawSide(1, opts.rightSpan);
}

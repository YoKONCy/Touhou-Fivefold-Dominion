/**
 * 64×72 零抗锯齿整数像素光栅化管线、语义部件分层 Sel-out 与温润深紫褐自适应外描边核心
 */

import type { RigPose } from '../voxelSprites';

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

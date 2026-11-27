/**
 * 100% 纯代码 24×24 精雕像素法术图标烘焙引擎内核
 *
 * 设计规范：
 * - 分辨率：严格 24×24 像素画布（可在 UI 中以 24px/36px/48px 整倍最近邻放大，零 Mixels 锯齿失真）
 * - 三层烘焙管线：
 *   1. 和风派系底纹框（暗夜微光径向晕底 + 五系色阶漆框 + 高阶 4~5 阶古金四隅星饰 + 大地图卷轴角章）
 *   2. 前景主体像素图腾（支持点/矩形/线/圆/圆环/椭圆/菱形/多边形/镜像对称绘制，写入独立前景层）
 *   3. 自动 1px 深墨外轮廓描边（仅围绕前景图腾外缘自动生成，立体感与清晰度直接对标经典 SFC/PS1 像素法术图标！）
 * - 纯整数像素缓冲区（Uint8ClampedArray），既可在浏览器实时转 DataURL 缓存，又可在 Node/Vitest 下直接计算像素哈希验证 100% 零重复撞脸！
 */

import type { Alignment } from '@core/alignment';

export const SPELL_ICON_SIZE = 24;

export interface SpellIconPainter {
  /** 绘制单个像素（前景主体层，默认参与自动 1px 深墨描边） */
  px: (x: number, y: number, color: string, bgOnly?: boolean) => void;
  /** 左右镜像绘制像素（相对 x = 11.5 轴对称，快速绘制对称结界、翅膀、双刃、鬼面等） */
  symPx: (x: number, y: number, color: string) => void;
  /** 填充矩形 */
  rect: (x: number, y: number, w: number, h: number, color: string, bgOnly?: boolean) => void;
  /** 绘制水平线段 */
  hline: (x: number, y: number, len: number, color: string) => void;
  /** 绘制竖直线段 */
  vline: (x: number, y: number, len: number, color: string) => void;
  /** 绘制像素直线（Bresenham 算法，支持粗细） */
  line: (x0: number, y0: number, x1: number, y1: number, color: string, thickness?: number) => void;
  /** 填充圆 */
  circle: (cx: number, cy: number, r: number, color: string, bgOnly?: boolean) => void;
  /** 绘制圆环 */
  ring: (cx: number, cy: number, r: number, color: string, thickness?: number) => void;
  /** 填充椭圆 */
  ellipse: (cx: number, cy: number, rx: number, ry: number, color: string) => void;
  /** 绘制菱形（中心 + 半宽 + 半高，可选空心） */
  diamond: (cx: number, cy: number, rx: number, ry: number, color: string, hollow?: boolean) => void;
  /** 绘制实心多边形（扫描线填充） */
  poly: (pts: Array<[number, number]>, color: string) => void;
  /** 叠加背景局部光斑（不参与前景黑色外轮廓，用于柔和星芒与魔力氛围） */
  glow: (cx: number, cy: number, r: number, color: string, alpha?: number) => void;
  /** 在四个角或指定点缀星芒十字 */
  sparkle: (cx: number, cy: number, color: string, size?: 1 | 2) => void;
  /** 绘制经典东方小型御札纸符（常用作生命/结界辅件） */
  ofuda: (x: number, y: number, w: number, h: number, paperColor?: string, inkColor?: string) => void;
  /** 绘制经典群体波纹/三重光环底印（用于 Mass 群体术式视觉升华） */
  massAura: (color: string, brightColor?: string) => void;
}

export interface SpellIconDrawMeta {
  alignment: Alignment;
  level: 1 | 2 | 3 | 4 | 5;
  isAdventure?: boolean;
  isMass?: boolean;
}

export type SpellIconDrawFn = (p: SpellIconPainter) => void;

export interface SpellIconRecipe {
  meta: SpellIconDrawMeta;
  draw: SpellIconDrawFn;
}

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const colorParseCache = new Map<string, Rgba>();

function parseHexColor(hex: string): Rgba {
  const cached = colorParseCache.get(hex);
  if (cached) return cached;
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  let r = 255;
  let g = 255;
  let b = 255;
  let a = 255;
  if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else if (clean.length === 8) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
    a = parseInt(clean.slice(6, 8), 16);
  } else if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  }
  const res = { r, g, b, a };
  colorParseCache.set(hex, res);
  return res;
}

/** 五大派系和风漆盒背景色板 */
const SCHOOL_BACKDROP: Record<
  Alignment,
  { bgDark: string; bgMid: string; glow: string; rim: string; rimHi: string }
> = {
  life: { bgDark: '#1b0d14', bgMid: '#3a1421', glow: '#b8324c', rim: '#8f3042', rimHi: '#f5d487' },
  order: { bgDark: '#0d1426', bgMid: '#192a54', glow: '#3e74cc', rim: '#3f69b0', rimHi: '#a8d4ff' },
  death: { bgDark: '#140c21', bgMid: '#2a1647', glow: '#6c3bb8', rim: '#653e99', rimHi: '#cfa6ff' },
  chaos: { bgDark: '#21100b', bgMid: '#471e12', glow: '#cc5822', rim: '#a84f24', rimHi: '#ffcf70' },
  nature: { bgDark: '#0b1d15', bgMid: '#153b2a', glow: '#2fa66c', rim: '#2f7d55', rimHi: '#9cf5c4' },
  might: { bgDark: '#1c150e', bgMid: '#382a1a', glow: '#b08642', rim: '#8c6932', rimHi: '#f5df9e' },
};

function blendPixel(buf: Uint8ClampedArray, idx: number, r: number, g: number, b: number, a: number): void {
  if (a <= 0) return;
  if (a >= 255 || buf[idx + 3] === 0) {
    buf[idx] = r;
    buf[idx + 1] = g;
    buf[idx + 2] = b;
    buf[idx + 3] = a;
    return;
  }
  const sa = a / 255;
  const da = buf[idx + 3] / 255;
  const outA = sa + da * (1 - sa);
  buf[idx] = Math.round((r * sa + buf[idx] * da * (1 - sa)) / outA);
  buf[idx + 1] = Math.round((g * sa + buf[idx + 1] * da * (1 - sa)) / outA);
  buf[idx + 2] = Math.round((b * sa + buf[idx + 2] * da * (1 - sa)) / outA);
  buf[idx + 3] = Math.round(outA * 255);
}

/**
 * 纯内存光栅化一个 24×24 法术像素图标，返回 RGBA 字节数组（不依赖 DOM，可在 Vitest 离线校验！）
 */
export function rasterizeSpellIconPixels(recipe: SpellIconRecipe): Uint8ClampedArray {
  const S = SPELL_ICON_SIZE;
  const bg = new Uint8ClampedArray(S * S * 4);
  const fg = new Uint8ClampedArray(S * S * 4);
  const fgMask = new Uint8Array(S * S);

  const theme = SCHOOL_BACKDROP[recipe.meta.alignment] ?? SCHOOL_BACKDROP.might;
  const cDark = parseHexColor(theme.bgDark);
  const cMid = parseHexColor(theme.bgMid);
  const cGlow = parseHexColor(theme.glow);
  const cRim = parseHexColor(theme.rim);
  const cRimHi = parseHexColor(theme.rimHi);

  // 1. 烘焙和风内发光漆底与圆切角双线边框
  const cx0 = (S - 1) / 2;
  const cy0 = (S - 1) / 2;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const idx = (y * S + x) * 4;
      const dist = Math.hypot(x - cx0, y - cy0) / 13.5;
      const t = Math.max(0, Math.min(1, 1 - dist));
      const gBoost = t * t * (0.36 + recipe.meta.level * 0.045);
      const r = Math.min(255, Math.round(cDark.r + (cMid.r - cDark.r) * t + cGlow.r * gBoost * 0.45));
      const g = Math.min(255, Math.round(cDark.g + (cMid.g - cDark.g) * t + cGlow.g * gBoost * 0.45));
      const b = Math.min(255, Math.round(cDark.b + (cMid.b - cDark.b) * t + cGlow.b * gBoost * 0.45));
      bg[idx] = r;
      bg[idx + 1] = g;
      bg[idx + 2] = b;
      bg[idx + 3] = 255;
    }
  }

  // 外缘 1px 和风漆框（四角微暗切角）
  const setBgRaw = (x: number, y: number, c: Rgba, alphaOverride?: number) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= S || iy < 0 || iy >= S) return;
    blendPixel(bg, (iy * S + ix) * 4, c.r, c.g, c.b, alphaOverride ?? c.a);
  };

  for (let i = 1; i < S - 1; i++) {
    setBgRaw(i, 0, cRim);
    setBgRaw(i, S - 1, cRim);
    setBgRaw(0, i, cRim);
    setBgRaw(S - 1, i, cRim);
  }
  // 4~5 阶高阶法术在四角点缀古金星铆
  if (recipe.meta.level >= 4) {
    const gold = recipe.meta.level === 5 ? parseHexColor('#ffe894') : cRimHi;
    setBgRaw(1, 1, gold);
    setBgRaw(S - 2, 1, gold);
    setBgRaw(1, S - 2, gold);
    setBgRaw(S - 2, S - 2, gold);
    if (recipe.meta.level === 5) {
      setBgRaw(2, 1, cRimHi, 160);
      setBgRaw(1, 2, cRimHi, 160);
      setBgRaw(S - 3, 1, cRimHi, 160);
      setBgRaw(S - 2, 2, cRimHi, 160);
      setBgRaw(2, S - 2, cRimHi, 160);
      setBgRaw(1, S - 3, cRimHi, 160);
      setBgRaw(S - 3, S - 2, cRimHi, 160);
      setBgRaw(S - 2, S - 3, cRimHi, 160);
    }
  }

  // 群体术式自动自带一层雅致外扩阵纹底印
  if (recipe.meta.isMass) {
    const auraC = parseHexColor(theme.rimHi);
    for (let y = 2; y < S - 2; y++) {
      for (let x = 2; x < S - 2; x++) {
        const d = Math.hypot(x - cx0, y - cy0);
        if (Math.abs(d - 9.2) < 0.55) {
          setBgRaw(x, y, auraC, 95);
        }
      }
    }
  }

  // 2. 构造画笔接口
  const putPx = (x: number, y: number, color: string, bgOnly = false) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= S || iy < 0 || iy >= S) return;
    const c = parseHexColor(color);
    const idx = (iy * S + ix) * 4;
    if (bgOnly) {
      blendPixel(bg, idx, c.r, c.g, c.b, c.a);
    } else {
      blendPixel(fg, idx, c.r, c.g, c.b, c.a);
      if (c.a >= 110) fgMask[iy * S + ix] = 1;
    }
  };

  const painter: SpellIconPainter = {
    px: putPx,
    symPx: (x, y, color) => {
      putPx(x, y, color);
      const mx = S - 1 - Math.round(x);
      if (mx !== Math.round(x)) putPx(mx, y, color);
    },
    rect: (x, y, w, h, color, bgOnly = false) => {
      const x0 = Math.round(x);
      const y0 = Math.round(y);
      const ww = Math.round(w);
      const hh = Math.round(h);
      for (let dy = 0; dy < hh; dy++) {
        for (let dx = 0; dx < ww; dx++) {
          putPx(x0 + dx, y0 + dy, color, bgOnly);
        }
      }
    },
    hline: (x, y, len, color) => {
      const x0 = Math.round(x);
      const y0 = Math.round(y);
      for (let i = 0; i < Math.round(len); i++) putPx(x0 + i, y0, color);
    },
    vline: (x, y, len, color) => {
      const x0 = Math.round(x);
      const y0 = Math.round(y);
      for (let i = 0; i < Math.round(len); i++) putPx(x0, y0 + i, color);
    },
    line: (x0, y0, x1, y1, color, thickness = 1) => {
      let ix0 = Math.round(x0);
      let iy0 = Math.round(y0);
      const ix1 = Math.round(x1);
      const iy1 = Math.round(y1);
      const dx = Math.abs(ix1 - ix0);
      const dy = Math.abs(iy1 - iy0);
      const sx = ix0 < ix1 ? 1 : -1;
      const sy = iy0 < iy1 ? 1 : -1;
      let err = dx - dy;
      const drawBrush = (bx: number, by: number) => {
        putPx(bx, by, color);
        if (thickness >= 2) {
          putPx(bx + 1, by, color);
          putPx(bx, by + 1, color);
        }
      };
      for (let guard = 0; guard < 64; guard++) {
        drawBrush(ix0, iy0);
        if (ix0 === ix1 && iy0 === iy1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          ix0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          iy0 += sy;
        }
      }
    },
    circle: (cx, cy, r, color, bgOnly = false) => {
      const r2 = r * r;
      const minX = Math.floor(cx - r);
      const maxX = Math.ceil(cx + r);
      const minY = Math.floor(cy - r);
      const maxY = Math.ceil(cy + r);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= r2 + 0.25) {
            putPx(x, y, color, bgOnly);
          }
        }
      }
    },
    ring: (cx, cy, r, color, thickness = 1) => {
      const inner = Math.max(0, r - thickness);
      const minX = Math.floor(cx - r - 1);
      const maxX = Math.ceil(cx + r + 1);
      const minY = Math.floor(cy - r - 1);
      const maxY = Math.ceil(cy + r + 1);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d <= r + 0.35 && d >= inner - 0.35) {
            putPx(x, y, color);
          }
        }
      }
    },
    ellipse: (cx, cy, rx, ry, color) => {
      const minX = Math.floor(cx - rx);
      const maxX = Math.ceil(cx + rx);
      const minY = Math.floor(cy - ry);
      const maxY = Math.ceil(cy + ry);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const nx = (x - cx) / Math.max(0.5, rx);
          const ny = (y - cy) / Math.max(0.5, ry);
          if (nx * nx + ny * ny <= 1.05) putPx(x, y, color);
        }
      }
    },
    diamond: (cx, cy, rx, ry, color, hollow = false) => {
      const minX = Math.floor(cx - rx);
      const maxX = Math.ceil(cx + rx);
      const minY = Math.floor(cy - ry);
      const maxY = Math.ceil(cy + ry);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const md = Math.abs(x - cx) / Math.max(0.5, rx) + Math.abs(y - cy) / Math.max(0.5, ry);
          if (hollow ? md <= 1.08 && md >= 0.72 : md <= 1.05) {
            putPx(x, y, color);
          }
        }
      }
    },
    poly: (pts, color) => {
      if (pts.length < 3) return;
      let minY = S;
      let maxY = 0;
      for (const [, py] of pts) {
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      const yStart = Math.max(0, Math.floor(minY));
      const yEnd = Math.min(S - 1, Math.ceil(maxY));
      for (let y = yStart; y <= yEnd; y++) {
        const xs: number[] = [];
        for (let i = 0; i < pts.length; i++) {
          const [x1, y1] = pts[i];
          const [x2, y2] = pts[(i + 1) % pts.length];
          if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
            xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
          }
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
          const x0 = Math.max(0, Math.round(xs[i]));
          const x1 = Math.min(S - 1, Math.round(xs[i + 1]));
          for (let x = x0; x <= x1; x++) putPx(x, y, color);
        }
      }
    },
    glow: (cx, cy, r, color, alpha = 0.45) => {
      const c = parseHexColor(color);
      const minX = Math.max(1, Math.floor(cx - r));
      const maxX = Math.min(S - 2, Math.ceil(cx + r));
      const minY = Math.max(1, Math.floor(cy - r));
      const maxY = Math.min(S - 2, Math.ceil(cy + r));
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d <= r) {
            const k = (1 - d / r) * alpha;
            setBgRaw(x, y, c, Math.round(k * 255));
          }
        }
      }
    },
    sparkle: (cx, cy, color, size = 1) => {
      putPx(cx, cy, '#ffffff');
      putPx(cx - 1, cy, color);
      putPx(cx + 1, cy, color);
      putPx(cx, cy - 1, color);
      putPx(cx, cy + 1, color);
      if (size === 2) {
        putPx(cx - 2, cy, color);
        putPx(cx + 2, cy, color);
        putPx(cx, cy - 2, color);
        putPx(cx, cy + 2, color);
      }
    },
    ofuda: (x, y, w, h, paperColor = '#faf2df', inkColor = '#d93855') => {
      painter.rect(x, y, w, h, paperColor);
      if (w >= 4 && h >= 6) {
        painter.hline(x + 1, y + 1, w - 2, inkColor);
        painter.vline(x + Math.floor(w / 2), y + 2, Math.max(1, h - 4), inkColor);
        painter.hline(x + 1, y + h - 2, w - 2, inkColor);
      }
    },
    massAura: (color, brightColor = '#ffffff') => {
      painter.glow(11.5, 11.5, 10, color, 0.35);
      const c = parseHexColor(brightColor);
      setBgRaw(11, 2, c, 210);
      setBgRaw(12, 2, c, 210);
      setBgRaw(2, 11, c, 210);
      setBgRaw(2, 12, c, 210);
      setBgRaw(21, 11, c, 210);
      setBgRaw(21, 12, c, 210);
      setBgRaw(11, 21, c, 210);
      setBgRaw(12, 21, c, 210);
    },
  };

  // 执行法术专属手绘函数
  recipe.draw(painter);

  // 大地图专用术式统一在右下角点缀一枚古典卷轴金角标
  if (recipe.meta.isAdventure) {
    painter.rect(17, 17, 5, 5, '#d9a441');
    painter.rect(18, 18, 3, 3, '#fff0ba');
    painter.px(19, 19, '#7a4b14');
  }

  // 3. 合成最终 24×24 RGBA 像素图：底图 → 前景自动 1px 深墨外轮廓 → 前景本体
  const out = new Uint8ClampedArray(bg);
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (let y = 1; y < S - 1; y++) {
    for (let x = 1; x < S - 1; x++) {
      if (fgMask[y * S + x]) continue;
      let touchesFg = false;
      for (const [dx, dy] of dirs) {
        if (fgMask[(y + dy) * S + (x + dx)]) {
          touchesFg = true;
          break;
        }
      }
      if (touchesFg) {
        const idx = (y * S + x) * 4;
        blendPixel(out, idx, 10, 7, 15, 225);
      }
    }
  }

  for (let i = 0; i < S * S; i++) {
    const idx = i * 4;
    if (fg[idx + 3] > 0) {
      blendPixel(out, idx, fg[idx], fg[idx + 1], fg[idx + 2], fg[idx + 3]);
    }
  }

  return out;
}

/** 计算像素缓冲区的 FNV-1a 64位十六进制哈希（用于自动化单测证明全部 148 个法术图标 0 重复！） */
export function hashPixelBuffer(pixels: Uint8ClampedArray): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < pixels.length; i++) {
    h1 ^= pixels[i];
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= pixels[i] ^ (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

/** 将 24×24 RGBA 像素缓冲区编码为浏览器可用的 PNG DataURL */
export function pixelsToDataUrl(pixels: Uint8ClampedArray): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = SPELL_ICON_SIZE;
  canvas.height = SPELL_ICON_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const imgData = ctx.createImageData(SPELL_ICON_SIZE, SPELL_ICON_SIZE);
  imgData.data.set(pixels);
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

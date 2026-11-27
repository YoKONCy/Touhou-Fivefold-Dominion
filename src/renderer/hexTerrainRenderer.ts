/**
 * 暗夜幻想乡五层景深实景大地 + 斜 45° 侧俯极淡六边形网格渲染器
 *
 * 100% 纯代码零静态资源，彻底告别“悬浮抽象棋盘”：
 * - 层 1（远景天穹与群山）：暗夜抖动星空、月晕满月、薄云与两层雾隐远山
 * - 层 2（中景幻想乡地标）：左后博丽参道朱红大鸟居、发光石灯笼、层叠古杉林；右后魔法之森古树与星光尖顶屋
 * - 层 3（无缝铺满全屏的连续实景大地）：多频程序化价值噪声 + Bayer 像素抖动草地、苔石小径、
 *         自然隆起的缓坡草丘高地、自然凹陷的水岸灵泉、嵌地风化神社青石板
 * - 层 4（极淡贴地六边形网格）：默认 alpha 极低，柔和融于地表（支持 淡雅 / 清晰 / 隐藏 三档切换）
 * - 层 5（可与棋子按纵深 Y 轴混排的立体地表景物）：扎根大地的灵竹丛、刻符古玄石碑
 * - 层 6（前景景深压边）：画面底角极克制的暗夜草叶与雾气框景
 */

import * as PIXI from 'pixi.js';
import {
  getProjectedHexPolygon,
  HEX_DIRECTIONS,
  hexKey,
  hexToPixel,
  type HexProjectionConfig,
  type HexTile,
} from '@core/hex';

/** 4x4 有序抖动矩阵 */
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** 确定性 2D 整数哈希 */
function hash2d(x: number, y: number, seed = 1337): number {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** 平滑 2D 价值噪声（用于生成自然起伏的草地、土坡、泥径纹理） */
function valueNoise2d(x: number, y: number, seed = 1337): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2d(xi, yi, seed);
  const b = hash2d(xi + 1, yi, seed);
  const c = hash2d(xi, yi + 1, seed);
  const d = hash2d(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm2d(x: number, y: number, seed = 1337): number {
  return (
    valueNoise2d(x, y, seed) * 0.58 +
    valueNoise2d(x * 2.1, y * 2.1, seed + 31) * 0.28 +
    valueNoise2d(x * 4.3, y * 4.3, seed + 79) * 0.14
  );
}

/**
 * 在像素画布上画一棵暗夜像素古杉/幽林树（用于中景树冠围合与层次景深）
 */
function drawPixelPineTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  height: number,
  palette: [string, string, string],
): void {
  const trunkH = Math.max(3, Math.round(height * 0.22));
  ctx.fillStyle = '#0c0d18';
  ctx.fillRect(Math.round(x - 1), Math.round(baseY - trunkH), 3, trunkH);

  const layers = 4;
  for (let l = 0; l < layers; l++) {
    const t = l / layers;
    const layerY = baseY - trunkH - Math.round(t * (height - trunkH));
    const halfW = Math.max(2, Math.round((1 - t * 0.72) * (height * 0.42)));
    const layerH = Math.max(3, Math.round((height - trunkH) * 0.34));
    for (let row = 0; row < layerH; row++) {
      const rw = Math.max(1, Math.round(halfW * (1 - row / (layerH + 1))));
      ctx.fillStyle = palette[0];
      ctx.fillRect(Math.round(x - rw), layerY - row, rw * 2 + 1, 1);
      // 左侧受月光照亮边缘
      ctx.fillStyle = palette[1];
      ctx.fillRect(Math.round(x - rw), layerY - row, Math.max(1, Math.round(rw * 0.85)), 1);
      if (row === layerH - 1 || row === layerH - 2) {
        ctx.fillStyle = palette[2];
        ctx.fillRect(Math.round(x - rw + 1), layerY - row, Math.max(1, Math.round(rw * 0.45)), 1);
      }
    }
  }
}

/**
 * 绘制中景博丽石灯笼（带暖橙灯火核心）
 */
function drawStoneLantern(ctx: CanvasRenderingContext2D, x: number, baseY: number): void {
  const rx = Math.round(x);
  const ry = Math.round(baseY);
  // 地面柔影
  ctx.fillStyle = 'rgba(4, 6, 12, 0.55)';
  ctx.fillRect(rx - 5, ry - 1, 10, 3);
  // 底座与石柱
  ctx.fillStyle = '#333a4f';
  ctx.fillRect(rx - 3, ry - 2, 6, 2);
  ctx.fillRect(rx - 1, ry - 9, 3, 7);
  ctx.fillStyle = '#4c5673';
  ctx.fillRect(rx - 1, ry - 9, 1, 7);
  // 灯室与暖橙灯芯
  ctx.fillStyle = '#252a3b';
  ctx.fillRect(rx - 3, ry - 14, 6, 5);
  ctx.fillStyle = '#ffb55a';
  ctx.fillRect(rx - 2, ry - 13, 4, 3);
  ctx.fillStyle = '#fff5cc';
  ctx.fillRect(rx - 1, ry - 12, 2, 1);
  // 笠顶
  ctx.fillStyle = '#434d69';
  ctx.fillRect(rx - 5, ry - 15, 10, 2);
  ctx.fillStyle = '#627094';
  ctx.fillRect(rx - 3, ry - 17, 6, 2);
}

/**
 * 烘焙完整 640×360 分层实景大地与远中景（无网格线，网格线独立成层支持透明度切换）
 * 让整块战场自然长在幻想乡暗夜博丽林间空地之上！
 */
export function bakeLayeredEnvironmentTexture(
  width: number,
  height: number,
  tiles: Record<string, HexTile>,
  proj: HexProjectionConfig,
): PIXI.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const horizonY = Math.round(height * 0.185);

  // ========== 第 1 层：远景暗夜星空与满月天穹 ==========
  const skyRamp = ['#050711', '#080c1c', '#0d142c', '#141e3d', '#1c284f'];
  for (let y = 0; y < horizonY + 18; y++) {
    const t = Math.min(1, y / (horizonY + 18)) * (skyRamp.length - 1);
    const idx = Math.floor(t);
    const frac = t - idx;
    for (let x = 0; x < width; x++) {
      const th = BAYER_4X4[y & 3][x & 3] / 16;
      const picked = Math.min(skyRamp.length - 1, frac > th ? idx + 1 : idx);
      ctx.fillStyle = skyRamp[picked];
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // 柔和满月与月晕（偏中上微右，与斜 45° 纵深视线呼应）
  const moonX = Math.round(width * 0.56);
  const moonY = Math.round(height * 0.09);
  for (let r = 82; r >= 18; r -= 8) {
    ctx.fillStyle = `rgba(178, 206, 255, ${(88 - r) * 0.0012})`;
    ctx.beginPath();
    ctx.arc(moonX, moonY, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#edf2ff';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c8d6f5';
  ctx.fillRect(moonX - 8, moonY - 5, 6, 4);
  ctx.fillRect(moonX + 3, moonY + 2, 6, 4);

  // 像素繁星
  for (let i = 0; i < 150; i++) {
    const sx = Math.floor(hash2d(i, 1, 901) * width);
    const sy = Math.floor(hash2d(i, 2, 901) * (horizonY - 8));
    const br = hash2d(i, 3, 901);
    ctx.fillStyle = br > 0.86 ? '#ffe6a3' : br > 0.48 ? '#a8c6ff' : '#4a5c8f';
    ctx.fillRect(sx, sy, 1, 1);
    if (br > 0.93) {
      ctx.fillStyle = 'rgba(255, 238, 186, 0.35)';
      ctx.fillRect(sx - 1, sy, 3, 1);
      ctx.fillRect(sx, sy - 1, 1, 3);
    }
  }

  // 漂浮月光薄云
  for (let c = 0; c < 7; c++) {
    const cx = 56 + c * Math.round(width / 7);
    const cy = 24 + (c % 3) * 16;
    ctx.fillStyle = 'rgba(130, 158, 214, 0.14)';
    ctx.fillRect(cx - 32, cy, 64, 3);
    ctx.fillRect(cx - 20, cy - 2, 38, 2);
    ctx.fillStyle = 'rgba(186, 210, 255, 0.12)';
    ctx.fillRect(cx - 24, cy - 1, 28, 1);
  }

  // 远景群山（双层大气雾化妖怪之山剪影）
  ctx.fillStyle = '#111830';
  for (let x = 0; x < width; x++) {
    const ridgeFar =
      horizonY - 34 + Math.sin(x * 0.009 + 0.5) * 20 + Math.cos(x * 0.022) * 10 + Math.sin(x * 0.045) * 3;
    ctx.fillRect(x, Math.round(ridgeFar), 1, horizonY + 24 - Math.round(ridgeFar));
  }
  ctx.fillStyle = '#0c1224';
  for (let x = 0; x < width; x++) {
    const ridgeNear =
      horizonY - 18 + Math.sin(x * 0.015 + 2.1) * 12 + Math.cos(x * 0.038) * 5;
    ctx.fillRect(x, Math.round(ridgeNear), 1, horizonY + 24 - Math.round(ridgeNear));
  }

  // ========== 第 2 层：无缝铺满下半屏的连续暗夜幻想乡大地 (y = horizonY..360) ==========
  // 使用 2x2 逻辑像素块 + fbm 噪声 + Bayer 抖动画出浑然一体、带自然近远景深透视的实景地面！
  const grassPalette = ['#121d2b', '#172536', '#1c2e40', '#23384a', '#2b4454'];
  const mossPalette = ['#11242b', '#163038', '#1d3e45', '#254e52'];
  const pathPalette = ['#212333', '#2a2c40', '#34364d'];

  for (let y = horizonY; y < height; y += 2) {
    // 透视深度：越靠地平线越暗紫雾化，越靠近景越温润清晰
    const depth = (y - horizonY) / (height - horizonY);
    for (let x = 0; x < width; x += 2) {
      // 将屏幕地面像素轻度透视拉伸，使草地与石径自然呈现侧俯延伸感
      const n = fbm2d(x * 0.018, y * 0.036, 409);
      const micro = hash2d(x >> 1, y >> 1, 777);
      const bayer = BAYER_4X4[(y >> 1) & 3][(x >> 1) & 3] / 16;

      // 沿斜 45° 对角线有一条若隐若现的古老参道泥石径（从左下博丽参道通向右上魔法森林！）
      const diagDist = Math.abs((x - width * 0.5) * 0.42 + (y - height * 0.62));
      const roadWave = Math.sin(x * 0.022) * 14 + (n - 0.5) * 28;
      const onPath = Math.abs(diagDist - 12 + roadWave) < 16;

      let color: string;
      if (onPath && depth > 0.14) {
        const pi = Math.min(pathPalette.length - 1, Math.floor((n * 0.8 + bayer * 0.35) * pathPalette.length));
        color = pathPalette[pi];
      } else if (n > 0.58) {
        const mi = Math.min(
          mossPalette.length - 1,
          Math.floor((depth * 0.45 + (n - 0.4) * 0.9 + bayer * 0.25) * mossPalette.length),
        );
        color = mossPalette[Math.max(0, mi)];
      } else {
        const gi = Math.min(
          grassPalette.length - 1,
          Math.floor((depth * 0.42 + n * 0.62 + bayer * 0.22) * grassPalette.length),
        );
        color = grassPalette[Math.max(0, gi)];
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 2, 2);

      // 零星月下细草穗与落樱微瓣
      if (micro > 0.986 && depth > 0.18) {
        ctx.fillStyle = micro > 0.994 ? '#6e8ea8' : '#2e5463';
        ctx.fillRect(x, y - 1, 1, 2);
      } else if (micro < 0.004 && depth > 0.25) {
        ctx.fillStyle = 'rgba(240, 166, 188, 0.5)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // 地平线处的柔化暗夜晨雾过渡带（自然衔接远山与大地）
  const mistGrad = ctx.createLinearGradient(0, horizonY - 12, 0, horizonY + 34);
  mistGrad.addColorStop(0, 'rgba(24, 34, 64, 0)');
  mistGrad.addColorStop(0.45, 'rgba(34, 48, 84, 0.42)');
  mistGrad.addColorStop(1, 'rgba(18, 29, 43, 0)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, horizonY - 12, width, 46);

  // ========== 第 3 层：中景幻想乡实景林带与标志建筑（按比例自适应宽屏围合战场四周！） ==========
  for (let i = 0; i < 12; i++) {
    const tx = 14 + i * 24 + (i % 2) * 5;
    const ty = horizonY + 8 + (i % 3) * 5;
    drawPixelPineTree(ctx, tx, ty, 26 + (i % 3) * 7, ['#0c1c24', '#16343d', '#285961']);
  }
  // 博丽朱红大鸟居（坐落在左后方高坡上）
  const toriiX = Math.round(width * 0.14);
  const toriiBaseY = horizonY + 18;
  ctx.fillStyle = 'rgba(4, 6, 12, 0.5)';
  ctx.fillRect(toriiX - 24, toriiBaseY - 1, 48, 3);
  ctx.fillStyle = '#7a1f32';
  ctx.fillRect(toriiX - 15, toriiBaseY - 28, 4, 28);
  ctx.fillRect(toriiX + 11, toriiBaseY - 28, 4, 28);
  ctx.fillStyle = '#a82c45';
  ctx.fillRect(toriiX - 15, toriiBaseY - 28, 2, 28);
  ctx.fillRect(toriiX + 11, toriiBaseY - 28, 2, 28);
  ctx.fillStyle = '#1c1d2e';
  ctx.fillRect(toriiX - 25, toriiBaseY - 32, 50, 3);
  ctx.fillStyle = '#b8324c';
  ctx.fillRect(toriiX - 23, toriiBaseY - 29, 46, 3);
  ctx.fillRect(toriiX - 19, toriiBaseY - 22, 38, 3);
  ctx.fillStyle = '#e8c468';
  ctx.fillRect(toriiX - 2, toriiBaseY - 26, 4, 5);

  // 右侧中景：魔法森林古树群 + 尖顶魔法使小屋
  for (let i = 0; i < 12; i++) {
    const tx = width - 16 - i * 24 - (i % 2) * 6;
    const ty = horizonY + 10 + (i % 3) * 6;
    drawPixelPineTree(ctx, tx, ty, 28 + (i % 4) * 6, ['#11152b', '#1e2547', '#354273']);
  }
  const hutX = Math.round(width * 0.86);
  const hutBaseY = horizonY + 20;
  ctx.fillStyle = 'rgba(4, 6, 12, 0.5)';
  ctx.fillRect(hutX - 22, hutBaseY - 1, 44, 3);
  ctx.fillStyle = '#211c36';
  ctx.fillRect(hutX - 14, hutBaseY - 16, 28, 16);
  ctx.fillStyle = '#2d2647';
  ctx.fillRect(hutX - 14, hutBaseY - 16, 12, 16);
  for (let r = 0; r < 18; r++) {
    const hw = Math.max(1, 20 - r);
    ctx.fillStyle = r < 4 ? '#151226' : '#2a224a';
    ctx.fillRect(hutX - hw, hutBaseY - 16 - r, hw * 2, 1);
  }
  ctx.fillStyle = '#ffd559';
  ctx.fillRect(hutX - 8, hutBaseY - 11, 5, 5);
  ctx.fillRect(hutX + 3, hutBaseY - 11, 5, 5);
  ctx.fillStyle = '#fff6cc';
  ctx.fillRect(hutX - 7, hutBaseY - 10, 2, 2);
  ctx.fillRect(hutX + 4, hutBaseY - 10, 2, 2);

  // 场边极外侧四角安放石灯笼与林缘古杉，把整片宽阔地面完整让给斜向近千格不规则战场
  drawStoneLantern(ctx, 18, Math.round(height * 0.27));
  drawStoneLantern(ctx, 16, Math.round(height * 0.88));
  drawStoneLantern(ctx, width - 18, Math.round(height * 0.27));
  drawStoneLantern(ctx, width - 16, Math.round(height * 0.88));

  drawPixelPineTree(ctx, 12, Math.round(height * 0.97), 32, ['#0a1620', '#122a33', '#224c57']);
  drawPixelPineTree(ctx, width - 12, Math.round(height * 0.97), 32, ['#0e1326', '#1b2242', '#2f3b6b']);

  // ========== 第 3.5 层：不规则战场自然林缘轮廓柔影与极淡结界地脉边线 ==========
  // 将整片可战不规则空地以微暖苔草提亮，外缘以柔暗林荫与极细古金界线勾出自然边界感！
  ctx.save();
  for (const tile of Object.values(tiles)) {
    const pts = getProjectedHexPolygon(tile, proj, 1, 1.02);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(44, 72, 86, 0.14)';
    ctx.fill();
  }

  // 仅在缺失相邻地块的“外缘边”上绘制极细古金地脉边线，让不规则轮廓精致克制而不生硬
  // 尖顶六边形边 i (顶点 i -> i+1) 外法线依次对应东/东南/西南/西/西北/东北 = HEX_DIRECTIONS[0,5,4,3,2,1]
  const edgeDirIndex = [0, 5, 4, 3, 2, 1];
  ctx.lineWidth = 0.65;
  ctx.strokeStyle = 'rgba(207, 167, 91, 0.26)';
  for (const tile of Object.values(tiles)) {
    const pts = getProjectedHexPolygon(tile, proj, tile.elevation, 1.0);
    for (let edge = 0; edge < 6; edge++) {
      const dir = HEX_DIRECTIONS[edgeDirIndex[edge]];
      const nKey = hexKey({ q: tile.q + dir.q, r: tile.r + dir.r });
      if (tiles[nKey]) continue;
      const p0 = pts[edge];
      const p1 = pts[(edge + 1) % 6];
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  }
  ctx.restore();

  // ========== 第 4 层：将战场的特殊地形有机地“长进”连续实景大地 ==========
  const sortedTiles = Object.values(tiles).sort((a, b) => {
    const pa = hexToPixel(a, proj, 1);
    const pb = hexToPixel(b, proj, 1);
    return pa.y - pb.y;
  });

  for (const tile of sortedTiles) {
    if (tile.terrain === 'plain') continue;

    const groundCenter = hexToPixel(tile, proj, 1);
    const center = hexToPixel(tile, proj, tile.elevation);
    const basePts = getProjectedHexPolygon(tile, proj, 1, 1.05);
    const topPts = getProjectedHexPolygon(tile, proj, tile.elevation, 0.99);

    if (tile.terrain === 'highland') {
      // 立体隆起的月下石苔高台：深沉落地基影 + 三面面向镜头的岩层峭壁 + 受月光翠苔石台顶
      ctx.save();
      ctx.fillStyle = 'rgba(4, 7, 16, 0.56)';
      ctx.beginPath();
      ctx.ellipse(
        groundCenter.x + 1,
        groundCenter.y + 4,
        proj.radius * 1.24,
        proj.radius * proj.ySquash * 1.18,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // 斜向投影 (-0.56 rad) 下真正面向镜头的三面峭壁：右前 (1->2)、正前 (2->3)、左前 (3->4)
      const drawCliff = (i0: number, i1: number, col: string, ridgeCol: string) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(topPts[i0].x, topPts[i0].y);
        ctx.lineTo(topPts[i1].x, topPts[i1].y);
        ctx.lineTo(basePts[i1].x, basePts[i1].y + 2.5);
        ctx.lineTo(basePts[i0].x, basePts[i0].y + 2.5);
        ctx.closePath();
        ctx.fill();

        // 岩壁中段横向层理与石阶暗线，强化垂直落差感
        const m0x = (topPts[i0].x + basePts[i0].x) * 0.5;
        const m0y = (topPts[i0].y + basePts[i0].y + 2.5) * 0.5;
        const m1x = (topPts[i1].x + basePts[i1].x) * 0.5;
        const m1y = (topPts[i1].y + basePts[i1].y + 2.5) * 0.5;
        ctx.strokeStyle = ridgeCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(m0x, m0y);
        ctx.lineTo(m1x, m1y);
        ctx.stroke();
      };
      drawCliff(1, 2, '#2a425c', 'rgba(138, 192, 232, 0.28)');
      drawCliff(2, 3, '#1e324a', 'rgba(104, 152, 194, 0.24)');
      drawCliff(3, 4, '#132033', 'rgba(72, 108, 148, 0.22)');

      // 高台受月光青草石台顶面
      ctx.beginPath();
      ctx.moveTo(topPts[0].x, topPts[0].y);
      for (let i = 1; i < 6; i++) ctx.lineTo(topPts[i].x, topPts[i].y);
      ctx.closePath();
      ctx.fillStyle = '#31526b';
      ctx.fill();
      ctx.strokeStyle = 'rgba(130, 186, 228, 0.44)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 左上迎月高光顶棱 (4->5->0->1)，让高台边缘在暗夜中清晰翘起
      ctx.strokeStyle = 'rgba(186, 228, 255, 0.62)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(topPts[4].x, topPts[4].y);
      ctx.lineTo(topPts[5].x, topPts[5].y);
      ctx.lineTo(topPts[0].x, topPts[0].y);
      ctx.lineTo(topPts[1].x, topPts[1].y);
      ctx.stroke();

      // 高台顶面零星翠苔草丛与青石露头
      ctx.fillStyle = '#436e8c';
      ctx.fillRect(Math.round(center.x - 6), Math.round(center.y - 2), 11, 2);
      ctx.fillStyle = '#74a8cc';
      ctx.fillRect(Math.round(center.x - 4), Math.round(center.y - 3), 6, 1);
      ctx.restore();
    } else if (tile.terrain === 'water') {
      // 自然凹陷的暗夜灵泉池塘（柔和土岸 + 清澈深蓝池水 + 月光波纹）
      ctx.save();
      ctx.fillStyle = '#111d2b';
      ctx.beginPath();
      ctx.ellipse(center.x, center.y - 1, proj.radius * 1.05, proj.radius * proj.ySquash * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#113354';
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, proj.radius * 0.9, proj.radius * proj.ySquash * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#194d78';
      ctx.beginPath();
      ctx.ellipse(center.x - 1, center.y - 1, proj.radius * 0.65, proj.radius * proj.ySquash * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();

      // 银蓝月光水波反光
      ctx.fillStyle = 'rgba(166, 228, 255, 0.62)';
      ctx.fillRect(Math.round(center.x - 7), Math.round(center.y - 2), 8, 1);
      ctx.fillRect(Math.round(center.x - 1), Math.round(center.y + 2), 7, 1);
      ctx.fillStyle = '#e0f7ff';
      ctx.fillRect(Math.round(center.x - 4), Math.round(center.y - 2), 3, 1);
      ctx.restore();
    } else if (tile.terrain === 'shrine_tile') {
      // 嵌入草地的古老风化神社石板（边缘柔和融合，带淡朱红结界纹）
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(topPts[0].x, topPts[0].y);
      for (let i = 1; i < 6; i++) ctx.lineTo(topPts[i].x, topPts[i].y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(46, 38, 62, 0.72)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(176, 118, 132, 0.34)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(228, 193, 111, 0.35)';
      ctx.fillRect(Math.round(center.x - 2), Math.round(center.y - 1), 4, 2);
      ctx.restore();
    } else if (tile.terrain === 'forest') {
      // 灵竹林底下的深幽林荫苔地（贴合平地根部）
      ctx.fillStyle = 'rgba(10, 26, 26, 0.55)';
      ctx.beginPath();
      ctx.ellipse(groundCenter.x, groundCenter.y + 1, proj.radius * 0.92, proj.radius * proj.ySquash * 0.92, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (tile.terrain === 'rock') {
      // 玄石岩柱底下的碎石基座与深影（稳稳贴合岩柱根部大地）
      ctx.fillStyle = 'rgba(7, 10, 18, 0.65)';
      ctx.beginPath();
      ctx.ellipse(groundCenter.x, groundCenter.y + 3, proj.radius * 0.88, proj.radius * proj.ySquash * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ========== 第 5 层：极克制的四角暗夜前景景深框景 ==========
  const vig = ctx.createRadialGradient(width * 0.5, height * 0.58, width * 0.3, width * 0.5, height * 0.55, width * 0.65);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(4, 6, 14, 0.52)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);

  const source = new PIXI.CanvasSource({ resource: canvas, scaleMode: 'nearest' });
  return new PIXI.Texture({ source });
}

/**
 * 单独烘焙贴合实景地面的极淡六边形网格线纹理（支持一键调整透明度：淡雅 / 清晰 / 隐藏）
 */
export function bakeSubtleHexGridTexture(
  width: number,
  height: number,
  tiles: Record<string, HexTile>,
  proj: HexProjectionConfig,
): PIXI.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  ctx.strokeStyle = 'rgba(176, 206, 245, 1)';
  ctx.lineWidth = 1;

  for (const tile of Object.values(tiles)) {
    const drawElev = tile.terrain === 'rock' ? 1 : tile.elevation;
    const pts = getProjectedHexPolygon(tile, proj, drawElev, 0.99);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();
  }

  const source = new PIXI.CanvasSource({ resource: canvas, scaleMode: 'nearest' });
  return new PIXI.Texture({ source });
}

/**
 * 创建可按 Y 深度与棋子实时互相遮挡的立体地表障碍物精灵（灵竹丛 / 刻符玄石碑）
 */
export function createTerrainPropTexture(kind: 'forest' | 'rock'): PIXI.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 30;
  canvas.height = 34;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const cx = 15;
  const by = 29;

  if (kind === 'forest') {
    const trunks = [
      { dx: -7, dy: 1, h: 16 },
      { dx: 0, dy: -2, h: 20 },
      { dx: 6, dy: 2, h: 15 },
    ];
    for (const tr of trunks) {
      const bx = cx + tr.dx;
      const py = by + tr.dy;
      ctx.fillStyle = 'rgba(4, 8, 16, 0.55)';
      ctx.fillRect(bx - 2, py, 6, 2);
      ctx.fillStyle = '#194a42';
      ctx.fillRect(bx, py - tr.h, 2, tr.h);
      ctx.fillStyle = '#38b596';
      ctx.fillRect(bx, py - tr.h, 1, tr.h);
      // 茂密层次像素竹冠
      ctx.fillStyle = '#123835';
      ctx.fillRect(bx - 4, py - tr.h - 4, 9, 6);
      ctx.fillStyle = '#246e63';
      ctx.fillRect(bx - 3, py - tr.h - 5, 7, 4);
      ctx.fillStyle = '#58e0be';
      ctx.fillRect(bx - 2, py - tr.h - 5, 3, 2);
    }
  } else {
    // 扎根大地的古老刻符玄石岩柱（清晰表现阻挡远程 LoS 视线）
    ctx.fillStyle = 'rgba(4, 6, 14, 0.65)';
    ctx.fillRect(cx - 10, by - 1, 20, 4);
    ctx.fillStyle = '#272d40';
    ctx.fillRect(cx - 7, by - 22, 14, 22);
    ctx.fillStyle = '#404966';
    ctx.fillRect(cx - 7, by - 22, 6, 22);
    ctx.fillStyle = '#68769e';
    ctx.fillRect(cx - 7, by - 25, 14, 3);
    // 发光古结界符纹
    ctx.fillStyle = '#6ec6ff';
    ctx.fillRect(cx - 1, by - 17, 2, 8);
    ctx.fillStyle = '#dbf3ff';
    ctx.fillRect(cx - 1, by - 16, 1, 4);
    ctx.strokeStyle = '#090c17';
    ctx.strokeRect(cx - 7.5, by - 25.5, 15, 26);
  }

  const source = new PIXI.CanvasSource({ resource: canvas, scaleMode: 'nearest' });
  return new PIXI.Texture({ source });
}

/**
 * 创建柔和高斯点光源圆形纹理（blendMode = 'add'）
 */
export function createSoftPointLightTexture(size = 96): PIXI.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 2, half, half, half);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.32, 'rgba(255, 255, 255, 0.42)');
  grad.addColorStop(0.68, 'rgba(255, 255, 255, 0.12)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const source = new PIXI.CanvasSource({ resource: canvas, scaleMode: 'linear' });
  return new PIXI.Texture({ source });
}

/**
 * 贴合斜 45° 侧俯地面透视的盘面旋转几何符卡结界大阵
 */
export class SpellCardMagicCircleLayer {
  public readonly container = new PIXI.Container();
  private readonly outerRing = new PIXI.Graphics();
  private readonly innerRing = new PIXI.Graphics();
  private currentPattern: 'yin_yang' | 'hakke_star' | 'lunar_astrolabe' | 'scarlet_moon' | null = null;
  private targetAlpha = 0;

  constructor(centerX: number, centerY: number) {
    this.container.position.set(centerX, centerY);
    // 严格跟随斜 45° 侧俯视角的压扁比例（0.58），让魔法阵平贴在斜向广阔大地上！
    this.container.scale.set(1, 0.58);
    this.container.alpha = 0;
    this.container.addChild(this.outerRing, this.innerRing);
  }

  public setAura(
    aura: { pattern: 'yin_yang' | 'hakke_star' | 'lunar_astrolabe' | 'scarlet_moon'; themeColor: string; accentColor: string } | null,
  ): void {
    if (!aura) {
      this.targetAlpha = 0;
      return;
    }
    this.targetAlpha = 0.52;
    if (this.currentPattern === aura.pattern) return;
    this.currentPattern = aura.pattern;
    this.redraw(aura.pattern, aura.themeColor, aura.accentColor);
  }

  private redraw(
    pattern: 'yin_yang' | 'hakke_star' | 'lunar_astrolabe' | 'scarlet_moon',
    themeColor: string,
    accentColor: string,
  ): void {
    this.outerRing.clear();
    this.innerRing.clear();

    const primary = parseInt(themeColor.replace('#', ''), 16);
    const accent = parseInt(accentColor.replace('#', ''), 16);

    this.outerRing.circle(0, 0, 152).stroke({ width: 2, color: primary, alpha: 0.9 });
    this.outerRing.circle(0, 0, 142).stroke({ width: 1, color: accent, alpha: 0.75 });
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16;
      const r0 = i % 2 === 0 ? 128 : 136;
      this.outerRing
        .moveTo(Math.cos(a) * r0, Math.sin(a) * r0)
        .lineTo(Math.cos(a) * 152, Math.sin(a) * 152)
        .stroke({ width: i % 2 === 0 ? 2 : 1, color: accent, alpha: 0.8 });
    }

    if (pattern === 'yin_yang') {
      for (let offset = 0; offset < 2; offset++) {
        const pts: number[] = [];
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI / 2) * i + (offset * Math.PI) / 4;
          pts.push(Math.cos(a) * 116, Math.sin(a) * 116);
        }
        this.innerRing.poly(pts, true).stroke({ width: 1.5, color: primary, alpha: 0.95 });
      }
      this.innerRing.circle(0, 0, 62).stroke({ width: 2, color: accent, alpha: 0.9 });
      this.innerRing.circle(0, -24, 16).stroke({ width: 2, color: primary, alpha: 0.95 });
      this.innerRing.circle(0, 24, 16).stroke({ width: 2, color: accent, alpha: 0.95 });
    } else if (pattern === 'lunar_astrolabe') {
      // 八意永琳《秘术「天文密葬法」》：月都伪月星仪大阵（双六芒星轨 + 三重偏心月环）
      for (let tri = 0; tri < 2; tri++) {
        const pts: number[] = [];
        for (let i = 0; i < 3; i++) {
          const a = (Math.PI * 2 * i) / 3 + (tri * Math.PI) / 3 - Math.PI / 2;
          pts.push(Math.cos(a) * 120, Math.sin(a) * 120);
        }
        this.innerRing.poly(pts, true).stroke({ width: 1.8, color: primary, alpha: 0.95 });
      }
      this.innerRing.circle(0, 0, 92).stroke({ width: 1.5, color: accent, alpha: 0.85 });
      this.innerRing.circle(0, 0, 52).stroke({ width: 2, color: primary, alpha: 0.95 });
      this.innerRing.circle(16, 0, 38).stroke({ width: 1.5, color: accent, alpha: 0.85 });
    } else if (pattern === 'scarlet_moon') {
      // 蕾米莉亚《神枪「冈格尼尔之枪」》：鲜红幼月玫瑰星阵（八角蔷薇棘环 + 鲜红满月圆轮）
      const rosePts: number[] = [];
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 * i) / 16 - Math.PI / 2;
        const r = i % 2 === 0 ? 124 : 74;
        rosePts.push(Math.cos(a) * r, Math.sin(a) * r);
      }
      this.innerRing.poly(rosePts, true).stroke({ width: 2, color: primary, alpha: 0.95 });
      this.innerRing.circle(0, 0, 68).stroke({ width: 2.2, color: accent, alpha: 0.9 });
      this.innerRing.circle(0, 0, 38).stroke({ width: 1.8, color: primary, alpha: 0.95 });
    } else {
      const starPts: number[] = [];
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 * i) / 16;
        const r = i % 2 === 0 ? 132 : 58;
        starPts.push(Math.cos(a) * r, Math.sin(a) * r);
      }
      this.innerRing.poly(starPts, true).stroke({ width: 2, color: primary, alpha: 0.95 });
      this.innerRing.circle(0, 0, 86).stroke({ width: 1.5, color: accent, alpha: 0.85 });
      this.innerRing.circle(0, 0, 34).stroke({ width: 2, color: primary, alpha: 0.95 });
    }
  }

  public update(dt: number): void {
    const diff = this.targetAlpha - this.container.alpha;
    if (Math.abs(diff) > 0.005) {
      this.container.alpha += diff * Math.min(1, dt * 4);
    } else {
      this.container.alpha = this.targetAlpha;
    }

    if (this.container.alpha > 0.01) {
      this.outerRing.rotation += dt * 0.18;
      this.innerRing.rotation -= dt * 0.28;
    }
  }
}

/**
 * 《Touhou-H4》东方专属结界、符箓、星盘、棱镜、弹幕、音律与影蔓特效（11 种）
 *
 * 包含：
 * 17. `fxTouhouOfudaSealRing`（博丽御札旋转封魔环）
 * 18. `fxTouhouWardDomePrism`（四象棱镜守护穹顶）
 * 19. `fxTouhouYinYangDream`（博丽阴阳玉旋转星环）
 * 20. `fxTouhouLunarAstrolabe`（月都浑天星轨仪）
 * 21. `fxTouhouLunarHareBloom`（月华玉兔蜕变光轮）
 * 22. `fxTouhouCrimsonShackle`（厄祟魔锁链缚）
 * 23. `fxTouhouMirrorPrism`（贤者折光魔镜）
 * 24. `fxTouhouStarDanmaku`（东方螺旋五芒星弹幕）
 * 25. `fxTouhouSakuraVortex`（西行妖冥樱漩涡）
 * 26. `fxTouhouShrineBellRipple`（神乐金铃音律波纹）
 * 27. `fxTouhouShadowTendrils`（幽冥暗影缠蔓）
 */

import { clamp, rand, smooth, TAU, WHITE, type PixelFxModule } from 'pixelfx';
import { drawPerspectiveRing, drawTinyStar, lifeEnvelope, resolveRamp } from './helpers';

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

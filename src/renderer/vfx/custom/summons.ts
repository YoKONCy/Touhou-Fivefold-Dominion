/**
 * 《Touhou-H4》9 种差异化生灵/元素/亡灵召请大阵特效（终结 16× summon_rise 同质化！）
 *
 * 包含：
 * 8. `fxTouhouSummonFairyRing`（妖精花环召请阵）
 * 9. `fxTouhouSummonBeastTotem`（灵兽图腾破印阵）
 * 10. `fxTouhouSummonWind`（疾风天狗羽阵）
 * 11. `fxTouhouSummonEarth`（地脉岩晶隆起阵）
 * 12. `fxTouhouSummonPhoenix`（蓬莱业火涅槃阵）
 * 13. `fxTouhouSummonWater`（玄武清泉波纹阵）
 * 14. `fxTouhouSummonFlora`（太阳花田繁花召请阵）
 * 15. `fxTouhouSummonCrypt`（黄泉冥碑破土召请阵）
 * 16. `fxTouhouSummonIceAbyss`（极寒深渊霜门阵）
 */

import { clamp, rand, smooth, TAU, WHITE, type PixelFxModule } from 'pixelfx';
import { drawPerspectiveRing, lifeEnvelope, resolveRamp } from './helpers';

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

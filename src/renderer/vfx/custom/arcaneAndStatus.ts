/**
 * 《Touhou-H4》七套纯净东方魔导与状态局域特效（取代穿帮科幻机器/投影仪/假人崩溃模块）
 *
 * 包含：
 * 6. `fxTouhouSparkArc`（紫电跃弧）
 * 7. `fxTouhouHologram`（幻象镜阵）
 * 8. `fxTouhouWarpIn`（隙间降临）
 * 9. `fxTouhouForceField`（六角灵结界）
 * 10. `fxTouhouSoulRise`（幽冥魂火升腾）
 * 11. `fxTouhouElectrified`（感电缠身）
 * 12. `fxTouhouPoisoned`（铃兰毒泡）
 */

import { rand, smooth, TAU, WHITE, type PixelFxModule } from 'pixelfx';
import { lifeEnvelope, resolveRamp } from './helpers';

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

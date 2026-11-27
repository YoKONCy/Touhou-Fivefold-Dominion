/**
 * 轻量幻想乡兵种程序化半身立绘绘制器（阴阳毛玉、向日葵妖精、竹林妖怪兔）
 */

import { drawAnimeEye, drawAnimeFaceBase, drawNightBackdrop, INK } from './helpers';

/** 3. 阴阳毛玉：24 束分层柔软月光绒毛 + 璀璨朱金阴阳玉灵核 + 双伴飞灵火 */
export function paintKedama(ctx: CanvasRenderingContext2D, s: number): void {
  drawNightBackdrop(ctx, s, {
    topColor: '#090e22',
    bottomColor: '#1b2038',
    glowColor: 'rgba(235, 118, 138, 0.28)',
    accentSpark: '#ffdf85',
    motif: 'shrine',
  });

  const cx = s * 0.5;
  const cy = s * 0.5;

  // 外围蓬松毛绒星云（20 簇弯曲尖毛束）
  for (let layer = 0; layer < 2; layer++) {
    const count = layer === 0 ? 18 : 14;
    const baseR = layer === 0 ? s * 0.35 : s * 0.27;
    const tipR = layer === 0 ? s * 0.43 : s * 0.33;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + layer * 0.18;
      const grad = ctx.createRadialGradient(cx, cy, baseR * 0.3, cx + Math.cos(a) * tipR, cy + Math.sin(a) * tipR, baseR * 0.8);
      grad.addColorStop(0, layer === 0 ? '#f5ede8' : '#ffffff');
      grad.addColorStop(0.7, layer === 0 ? '#d9d4eb' : '#f7efe8');
      grad.addColorStop(1, '#9db4db');
      ctx.fillStyle = grad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = layer === 0 ? 2.2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a - 0.24) * baseR * 0.72, cy + Math.sin(a - 0.24) * baseR * 0.72);
      ctx.quadraticCurveTo(
        cx + Math.cos(a - 0.08) * tipR,
        cy + Math.sin(a - 0.08) * tipR,
        cx + Math.cos(a + 0.06) * tipR * 1.02,
        cy + Math.sin(a + 0.06) * tipR * 1.02,
      );
      ctx.quadraticCurveTo(
        cx + Math.cos(a + 0.18) * baseR * 0.95,
        cy + Math.sin(a + 0.18) * baseR * 0.95,
        cx + Math.cos(a + 0.24) * baseR * 0.72,
        cy + Math.sin(a + 0.24) * baseR * 0.72,
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // 中心柔和蓬松球体
  const bodyG = ctx.createRadialGradient(cx - s * 0.06, cy - s * 0.08, s * 0.04, cx, cy, s * 0.27);
  bodyG.addColorStop(0, '#ffffff');
  bodyG.addColorStop(0.7, '#f5eae2');
  bodyG.addColorStop(1, '#cbbcd4');
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.26, 0, Math.PI * 2);
  ctx.fill();

  // 中央发光朱金阴阳太极晶玉
  const r = s * 0.115;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.1);
  glow.addColorStop(0, 'rgba(255, 224, 130, 0.85)');
  glow.addColorStop(0.55, 'rgba(235, 68, 98, 0.35)');
  glow.addColorStop(1, 'rgba(235, 68, 98, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#fff0bf';
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = '#e03554';
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(cx, cy - r * 0.5, r * 0.5, Math.PI * 1.5, Math.PI * 0.5);
  ctx.arc(cx, cy + r * 0.5, r * 0.5, Math.PI * 1.5, Math.PI * 0.5, true);
  ctx.fill();
  ctx.fillStyle = '#fff0bf';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.5, r * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e03554';
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.5, r * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#ffe596';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // 两侧伴飞神灯小灵火
  for (const [wx, wy] of [[0.13, 0.65], [0.87, 0.72]]) {
    const fg = ctx.createRadialGradient(s * wx, s * wy, 1, s * wx, s * wy, s * 0.08);
    fg.addColorStop(0, '#ffffff');
    fg.addColorStop(0.4, '#ffab70');
    fg.addColorStop(1, 'rgba(255, 110, 90, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(s * wx, s * wy, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 4. 向日葵妖精：翠绿花瓣礼裙 + 四枚璀璨流光青翼 + 金灿向日葵花冠 + 碧绿星眸 */
export function paintFairy(ctx: CanvasRenderingContext2D, s: number): void {
  drawNightBackdrop(ctx, s, {
    topColor: '#081224',
    bottomColor: '#102430',
    glowColor: 'rgba(92, 232, 180, 0.3)',
    accentSpark: '#ffe169',
    motif: 'forest',
  });

  // 四枚透明虹彩青碧妖精光翼
  const drawWing = (dir: -1 | 1, upper: boolean) => {
    ctx.save();
    const wg = ctx.createLinearGradient(s * 0.5, s * 0.55, s * (0.5 + dir * 0.45), s * (upper ? 0.22 : 0.85));
    wg.addColorStop(0, 'rgba(184, 255, 240, 0.85)');
    wg.addColorStop(0.6, 'rgba(72, 224, 188, 0.62)');
    wg.addColorStop(1, 'rgba(110, 245, 255, 0.82)');
    ctx.fillStyle = wg;
    ctx.strokeStyle = '#c8fff5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (upper) {
      ctx.moveTo(s * 0.5, s * 0.58);
      ctx.bezierCurveTo(
        s * (0.5 + dir * 0.18), s * 0.34,
        s * (0.5 + dir * 0.44), s * 0.18,
        s * (0.5 + dir * 0.46), s * 0.28,
      );
      ctx.bezierCurveTo(
        s * (0.5 + dir * 0.42), s * 0.52,
        s * (0.5 + dir * 0.24), s * 0.62,
        s * 0.5, s * 0.62,
      );
    } else {
      ctx.moveTo(s * 0.5, s * 0.64);
      ctx.bezierCurveTo(
        s * (0.5 + dir * 0.25), s * 0.64,
        s * (0.5 + dir * 0.42), s * 0.78,
        s * (0.5 + dir * 0.38), s * 0.85,
      );
      ctx.bezierCurveTo(
        s * (0.5 + dir * 0.26), s * 0.86,
        s * (0.5 + dir * 0.14), s * 0.78,
        s * 0.5, s * 0.7,
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  drawWing(-1, true);
  drawWing(1, true);
  drawWing(-1, false);
  drawWing(1, false);

  // 金色卷曲后发
  const hairG = ctx.createLinearGradient(s * 0.3, s * 0.22, s * 0.7, s * 0.68);
  hairG.addColorStop(0, '#ffe878');
  hairG.addColorStop(0.6, '#f2b830');
  hairG.addColorStop(1, '#bd7c1a');
  ctx.fillStyle = hairG;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.46, s * 0.22, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 翠绿层叠花瓣连衣裙 + 金绸带
  const dressG = ctx.createLinearGradient(s * 0.3, s * 0.68, s * 0.7, s);
  dressG.addColorStop(0, '#5be095');
  dressG.addColorStop(0.55, '#26945c');
  dressG.addColorStop(1, '#125438');
  ctx.fillStyle = dressG;
  ctx.beginPath();
  ctx.moveTo(s * 0.22, s);
  ctx.bezierCurveTo(s * 0.28, s * 0.72, s * 0.38, s * 0.68, s * 0.5, s * 0.68);
  ctx.bezierCurveTo(s * 0.62, s * 0.68, s * 0.72, s * 0.72, s * 0.78, s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 象牙白花瓣胸饰与金丝带结
  ctx.fillStyle = '#fff9e6';
  ctx.beginPath();
  ctx.moveTo(s * 0.38, s * 0.7);
  ctx.lineTo(s * 0.5, s * 0.85);
  ctx.lineTo(s * 0.62, s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffd659';
  ctx.beginPath();
  ctx.ellipse(s * 0.46, s * 0.84, s * 0.04, s * 0.022, -0.3, 0, Math.PI * 2);
  ctx.ellipse(s * 0.54, s * 0.84, s * 0.04, s * 0.022, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 脸庞与灵动翡翠星眸
  drawAnimeFaceBase(ctx, s * 0.5, s * 0.48, s * 0.16, s * 0.17, 'cheerful');
  drawAnimeEye(ctx, s * 0.435, s * 0.475, s * 0.095, s * 0.076, '#126b40', '#58f29f', 0.8);
  drawAnimeEye(ctx, s * 0.565, s * 0.475, s * 0.095, s * 0.076, '#126b40', '#58f29f', 0.8);

  // 金色蓬松刘海
  ctx.fillStyle = hairG;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(s * 0.32, s * 0.45);
  ctx.bezierCurveTo(s * 0.3, s * 0.25, s * 0.7, s * 0.25, s * 0.68, s * 0.45);
  ctx.lineTo(s * 0.6, s * 0.4);
  ctx.lineTo(s * 0.56, s * 0.45);
  ctx.lineTo(s * 0.5, s * 0.38);
  ctx.lineTo(s * 0.44, s * 0.45);
  ctx.lineTo(s * 0.4, s * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 头顶盛开向日葵花冠（右侧大花 + 左侧副花 + 翠叶）
  const drawSunflower = (fx: number, fy: number, fr: number) => {
    // 翠绿叶片
    ctx.fillStyle = '#2fa866';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    for (const a of [0.6, 2.3, 3.8]) {
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(a) * fr * 1.15, fy + Math.sin(a) * fr * 1.15, fr * 0.5, fr * 0.24, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // 14 枚灿烂金黄花瓣
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      ctx.fillStyle = i % 2 === 0 ? '#ffd845' : '#ffb829';
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(a) * fr * 0.85, fy + Math.sin(a) * fr * 0.85, fr * 0.46, fr * 0.18, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // 暖褐花蕊
    const cg = ctx.createRadialGradient(fx - fr * 0.15, fy - fr * 0.15, 1, fx, fy, fr * 0.52);
    cg.addColorStop(0, '#9e5822');
    cg.addColorStop(1, '#4a240c');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(fx, fy, fr * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  drawSunflower(s * 0.36, s * 0.25, s * 0.082);
  drawSunflower(s * 0.61, s * 0.24, s * 0.112);
}

/** 5. 竹林妖怪兔：高耸粉白长兔耳 + 银白短发 + 凌厉红瞳 + 靛蓝月影和服武士装 + 银蓝灵光捣药杵 */
export function paintRabbit(ctx: CanvasRenderingContext2D, s: number): void {
  drawNightBackdrop(ctx, s, {
    topColor: '#070d1f',
    bottomColor: '#13213d',
    glowColor: 'rgba(122, 184, 255, 0.28)',
    accentSpark: '#9ee8ff',
    motif: 'bamboo',
  });

  // 背后斜挎发光银蓝月纹捣药长杵
  ctx.save();
  ctx.translate(s * 0.78, s * 0.34);
  ctx.rotate(0.42);
  const pg = ctx.createRadialGradient(0, 0, 4, 0, 0, s * 0.2);
  pg.addColorStop(0, 'rgba(126, 232, 255, 0.55)');
  pg.addColorStop(1, 'rgba(126, 232, 255, 0)');
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5c2c24';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.fillRect(-s * 0.025, s * 0.08, s * 0.05, s * 0.45);
  ctx.strokeRect(-s * 0.025, s * 0.08, s * 0.05, s * 0.45);

  const headG = ctx.createLinearGradient(-s * 0.07, 0, s * 0.07, 0);
  headG.addColorStop(0, '#362630');
  headG.addColorStop(0.5, '#6b3e36');
  headG.addColorStop(1, '#2a2230');
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.roundRect(-s * 0.075, -s * 0.14, s * 0.15, s * 0.24, 10);
  ctx.fill();
  ctx.stroke();

  // 杵面发光银蓝新月符纹
  ctx.strokeStyle = '#99f5ff';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, -s * 0.02, s * 0.036, 0.5, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();

  // 招牌高耸修长双兔耳（外银白 + 内樱粉）
  const drawEar = (bx: number, by: number, angle: number) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);
    const eg = ctx.createLinearGradient(0, 0, 0, -s * 0.3);
    eg.addColorStop(0, '#cfd8eb');
    eg.addColorStop(1, '#ffffff');
    ctx.fillStyle = eg;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-s * 0.045, 0);
    ctx.bezierCurveTo(-s * 0.07, -s * 0.14, -s * 0.04, -s * 0.28, 0, -s * 0.3);
    ctx.bezierCurveTo(s * 0.045, -s * 0.27, s * 0.068, -s * 0.14, s * 0.045, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const ig = ctx.createLinearGradient(0, -s * 0.03, 0, -s * 0.25);
    ig.addColorStop(0, '#f094b0');
    ig.addColorStop(1, '#ffd4e2');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.14, s * 0.024, s * 0.095, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawEar(s * 0.4, s * 0.35, -0.34);
  drawEar(s * 0.57, s * 0.35, 0.3);

  // 靛蓝和风武士短装 + 飘逸领巾
  const tunicG = ctx.createLinearGradient(s * 0.24, s * 0.68, s * 0.76, s);
  tunicG.addColorStop(0, '#3a5ca8');
  tunicG.addColorStop(0.55, '#1f3366');
  tunicG.addColorStop(1, '#121e40');
  ctx.fillStyle = tunicG;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(s * 0.2, s);
  ctx.bezierCurveTo(s * 0.24, s * 0.72, s * 0.34, s * 0.68, s * 0.5, s * 0.68);
  ctx.bezierCurveTo(s * 0.66, s * 0.68, s * 0.76, s * 0.72, s * 0.8, s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 洁白交叉和服衣领与银纹镶边
  ctx.strokeStyle = '#eef4ff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(s * 0.38, s * 0.7);
  ctx.lineTo(s * 0.56, s * 0.94);
  ctx.moveTo(s * 0.6, s * 0.7);
  ctx.lineTo(s * 0.44, s * 0.9);
  ctx.stroke();

  // 脸庞与凌厉赤红战眸
  drawAnimeFaceBase(ctx, s * 0.49, s * 0.51, s * 0.155, s * 0.168, 'focused');
  drawAnimeEye(ctx, s * 0.425, s * 0.505, s * 0.09, s * 0.068, '#8a1228', '#ff4769', 1.5, true);
  drawAnimeEye(ctx, s * 0.555, s * 0.505, s * 0.09, s * 0.068, '#8a1228', '#ff4769', 1.5, true);

  // 锐利眉锋
  ctx.strokeStyle = '#4e5b78';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(s * 0.37, s * 0.445);
  ctx.lineTo(s * 0.46, s * 0.465);
  ctx.moveTo(s * 0.6, s * 0.445);
  ctx.lineTo(s * 0.52, s * 0.465);
  ctx.stroke();

  // 银白清爽短发（带月蓝柔影）
  const silverG = ctx.createLinearGradient(s * 0.3, s * 0.3, s * 0.68, s * 0.62);
  silverG.addColorStop(0, '#ffffff');
  silverG.addColorStop(0.6, '#d9e3f5');
  silverG.addColorStop(1, '#8ea1c4');
  ctx.fillStyle = silverG;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(s * 0.31, s * 0.54);
  ctx.bezierCurveTo(s * 0.28, s * 0.29, s * 0.7, s * 0.29, s * 0.67, s * 0.54);
  ctx.lineTo(s * 0.61, s * 0.45);
  ctx.lineTo(s * 0.56, s * 0.5);
  ctx.lineTo(s * 0.5, s * 0.41);
  ctx.lineTo(s * 0.44, s * 0.5);
  ctx.lineTo(s * 0.39, s * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 靛蓝迎风围巾
  ctx.fillStyle = '#334d82';
  ctx.beginPath();
  ctx.roundRect(s * 0.35, s * 0.64, s * 0.29, s * 0.08, 12);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 0.6, s * 0.67);
  ctx.bezierCurveTo(s * 0.75, s * 0.66, s * 0.85, s * 0.6, s * 0.94, s * 0.65);
  ctx.bezierCurveTo(s * 0.82, s * 0.73, s * 0.72, s * 0.74, s * 0.6, s * 0.71);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

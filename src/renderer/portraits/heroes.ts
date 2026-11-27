/**
 * 主角英雄程序化半身立绘绘制器（博丽灵梦、雾雨魔理沙）
 */

import { drawAnimeEye, drawAnimeFaceBase, drawNightBackdrop, INK } from './helpers';

/** 1. 博丽灵梦：朱红大蝴蝶结 + 乌黑柔顺长发 + 赤瞳 + 红白巫女服 + 博丽御币 + 浮空阴阳玉 */
export function paintReimu(ctx: CanvasRenderingContext2D, s: number): void {
  drawNightBackdrop(ctx, s, {
    topColor: '#090d20',
    bottomColor: '#1d142c',
    glowColor: 'rgba(235, 86, 114, 0.34)',
    glowX: 0.48,
    glowY: 0.42,
    accentSpark: '#ffe082',
    motif: 'shrine',
  });

  // 标志性超大朱红蝴蝶结（后景双翼 + 雪白蕾丝边）
  const drawBowWing = (dir: -1 | 1) => {
    ctx.save();
    const grad = ctx.createLinearGradient(s * 0.5, s * 0.08, s * (0.5 + dir * 0.34), s * 0.36);
    grad.addColorStop(0, '#a31c36');
    grad.addColorStop(0.55, '#dc304e');
    grad.addColorStop(1, '#ff6178');
    ctx.fillStyle = grad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.22);
    ctx.bezierCurveTo(
      s * (0.5 + dir * 0.14), s * 0.04,
      s * (0.5 + dir * 0.34), s * 0.05,
      s * (0.5 + dir * 0.32), s * 0.22,
    );
    ctx.bezierCurveTo(
      s * (0.5 + dir * 0.33), s * 0.35,
      s * (0.5 + dir * 0.16), s * 0.38,
      s * 0.5, s * 0.27,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 蕾丝白边高光
    ctx.strokeStyle = '#fff5ea';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(s * (0.5 + dir * 0.27), s * 0.1);
    ctx.quadraticCurveTo(s * (0.5 + dir * 0.31), s * 0.21, s * (0.5 + dir * 0.28), s * 0.31);
    ctx.stroke();
    ctx.restore();
  };
  drawBowWing(-1);
  drawBowWing(1);

  // 后垂飘逸黑长发
  const hairGrad = ctx.createLinearGradient(s * 0.25, s * 0.18, s * 0.72, s * 0.78);
  hairGrad.addColorStop(0, '#3e293d');
  hairGrad.addColorStop(0.45, '#241829');
  hairGrad.addColorStop(1, '#140e1a');
  ctx.fillStyle = hairGrad;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(s * 0.27, s * 0.38);
  ctx.bezierCurveTo(s * 0.2, s * 0.58, s * 0.22, s * 0.74, s * 0.3, s * 0.78);
  ctx.lineTo(s * 0.72, s * 0.78);
  ctx.bezierCurveTo(s * 0.79, s * 0.7, s * 0.78, s * 0.52, s * 0.73, s * 0.36);
  ctx.bezierCurveTo(s * 0.7, s * 0.15, s * 0.3, s * 0.15, s * 0.27, s * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 博丽巫女上衣、红领结与分体宽袖
  const clothGrad = ctx.createLinearGradient(s * 0.22, s * 0.65, s * 0.78, s);
  clothGrad.addColorStop(0, '#ffffff');
  clothGrad.addColorStop(0.65, '#f0e7dc');
  clothGrad.addColorStop(1, '#d1c2b8');
  ctx.fillStyle = clothGrad;
  ctx.beginPath();
  ctx.moveTo(s * 0.14, s);
  ctx.bezierCurveTo(s * 0.18, s * 0.72, s * 0.3, s * 0.67, s * 0.5, s * 0.66);
  ctx.bezierCurveTo(s * 0.7, s * 0.67, s * 0.82, s * 0.72, s * 0.86, s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 宽袖朱红边饰与露出锁骨肩线
  ctx.fillStyle = '#d9304d';
  ctx.beginPath();
  ctx.moveTo(s * 0.22, s * 0.76);
  ctx.lineTo(s * 0.33, s * 0.78);
  ctx.lineTo(s * 0.28, s);
  ctx.lineTo(s * 0.17, s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(s * 0.78, s * 0.76);
  ctx.lineTo(s * 0.67, s * 0.78);
  ctx.lineTo(s * 0.72, s);
  ctx.lineTo(s * 0.83, s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 巫女红领边与胸前朱红蝴蝶结
  ctx.strokeStyle = '#d9304d';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(s * 0.4, s * 0.66);
  ctx.lineTo(s * 0.5, s * 0.78);
  ctx.lineTo(s * 0.6, s * 0.66);
  ctx.stroke();
  ctx.fillStyle = '#e63e5a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(s * 0.46, s * 0.78, s * 0.045, s * 0.025, -0.35, 0, Math.PI * 2);
  ctx.ellipse(s * 0.54, s * 0.78, s * 0.045, s * 0.025, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 朱红袴腰带
  ctx.fillStyle = '#bd223d';
  ctx.fillRect(s * 0.33, s * 0.9, s * 0.34, s * 0.1);
  ctx.strokeRect(s * 0.33, s * 0.9, s * 0.34, s * 0.1);

  // 脸庞与赤红星眸
  drawAnimeFaceBase(ctx, s * 0.5, s * 0.47, s * 0.165, s * 0.185, 'serene');
  drawAnimeEye(ctx, s * 0.43, s * 0.465, s * 0.095, s * 0.075, '#7a1126', '#f24b67', 1.2);
  drawAnimeEye(ctx, s * 0.57, s * 0.465, s * 0.095, s * 0.075, '#7a1126', '#f24b67', 1.2);

  // 精致柔和双眉
  ctx.strokeStyle = '#2d1c2e';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(s * 0.38, s * 0.4);
  ctx.quadraticCurveTo(s * 0.43, s * 0.38, s * 0.47, s * 0.4);
  ctx.moveTo(s * 0.53, s * 0.4);
  ctx.quadraticCurveTo(s * 0.57, s * 0.38, s * 0.62, s * 0.4);
  ctx.stroke();

  // 蓬松黑发刘海与双鬓管饰
  ctx.fillStyle = hairGrad;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(s * 0.3, s * 0.44);
  ctx.bezierCurveTo(s * 0.28, s * 0.2, s * 0.72, s * 0.2, s * 0.7, s * 0.44);
  // 灵动参差刘海
  ctx.lineTo(s * 0.64, s * 0.4);
  ctx.lineTo(s * 0.61, s * 0.44);
  ctx.lineTo(s * 0.55, s * 0.37);
  ctx.lineTo(s * 0.51, s * 0.44);
  ctx.lineTo(s * 0.46, s * 0.37);
  ctx.lineTo(s * 0.41, s * 0.44);
  ctx.lineTo(s * 0.36, s * 0.39);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 标志性双鬓发束与红白发筒
  for (const dir of [-1, 1]) {
    const sx = s * (0.5 + dir * 0.165);
    ctx.fillStyle = hairGrad;
    ctx.beginPath();
    ctx.moveTo(sx - dir * s * 0.03, s * 0.42);
    ctx.quadraticCurveTo(sx + dir * s * 0.04, s * 0.58, sx - dir * s * 0.02, s * 0.74);
    ctx.quadraticCurveTo(sx - dir * s * 0.06, s * 0.58, sx - dir * s * 0.03, s * 0.42);
    ctx.fill();
    ctx.stroke();

    // 巫女红白发管
    ctx.fillStyle = '#e03452';
    ctx.fillRect(sx - s * 0.026, s * 0.51, s * 0.052, s * 0.055);
    ctx.strokeRect(sx - s * 0.026, s * 0.51, s * 0.052, s * 0.055);
    ctx.fillStyle = '#fff5eb';
    ctx.fillRect(sx - s * 0.03, s * 0.5, s * 0.06, s * 0.015);
    ctx.fillRect(sx - s * 0.03, s * 0.555, s * 0.06, s * 0.015);
  }

  // 月光天使发丝高光弧
  ctx.strokeStyle = 'rgba(182, 206, 255, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s * 0.36, s * 0.31);
  ctx.quadraticCurveTo(s * 0.48, s * 0.27, s * 0.62, s * 0.32);
  ctx.stroke();

  // 左侧悬浮发光阴阳玉（红白太极 + 暖金神光）
  const orbX = s * 0.17;
  const orbY = s * 0.59;
  const orbR = s * 0.088;
  const orbHalo = ctx.createRadialGradient(orbX, orbY, orbR * 0.4, orbX, orbY, orbR * 1.9);
  orbHalo.addColorStop(0, 'rgba(255, 212, 118, 0.65)');
  orbHalo.addColorStop(1, 'rgba(255, 86, 114, 0)');
  ctx.fillStyle = orbHalo;
  ctx.beginPath();
  ctx.arc(orbX, orbY, orbR * 1.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#fff0c4';
  ctx.fillRect(orbX - orbR, orbY - orbR, orbR * 2, orbR * 2);
  ctx.fillStyle = '#d92b49';
  ctx.beginPath();
  ctx.arc(orbX, orbY, orbR, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(orbX, orbY - orbR * 0.5, orbR * 0.5, Math.PI * 1.5, Math.PI * 0.5);
  ctx.arc(orbX, orbY + orbR * 0.5, orbR * 0.5, Math.PI * 1.5, Math.PI * 0.5, true);
  ctx.fill();
  ctx.fillStyle = '#fff0c4';
  ctx.beginPath();
  ctx.arc(orbX, orbY - orbR * 0.5, orbR * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d92b49';
  ctx.beginPath();
  ctx.arc(orbX, orbY + orbR * 0.5, orbR * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#ffe599';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
  ctx.stroke();

  // 右侧博丽御币（木柄 + 摇曳雪白之字纸垂）
  ctx.strokeStyle = '#754b27';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(s * 0.72, s);
  ctx.lineTo(s * 0.87, s * 0.36);
  ctx.stroke();
  ctx.strokeStyle = '#c48f56';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(s * 0.72, s);
  ctx.lineTo(s * 0.87, s * 0.36);
  ctx.stroke();

  ctx.fillStyle = '#fff9f0';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 4; i++) {
    const px = s * 0.87 - i * s * 0.015;
    const py = s * 0.4 + i * s * 0.075;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + s * 0.06, py + s * 0.03);
    ctx.lineTo(px + s * 0.035, py + s * 0.085);
    ctx.lineTo(px - s * 0.02, py + s * 0.055);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** 2. 雾雨魔理沙：超大黑尖顶魔女帽 + 金发麻花辫 + 自信金眸 + 黑白魔法装 + 发光迷你八卦炉 */
export function paintMarisa(ctx: CanvasRenderingContext2D, s: number): void {
  drawNightBackdrop(ctx, s, {
    topColor: '#080c1e',
    bottomColor: '#1b1730',
    glowColor: 'rgba(246, 201, 69, 0.3)',
    glowX: 0.54,
    glowY: 0.52,
    accentSpark: '#ffe066',
    motif: 'forest',
  });

  // 飘逸金色波浪长发（后景）
  const goldHair = ctx.createLinearGradient(s * 0.25, s * 0.28, s * 0.75, s * 0.85);
  goldHair.addColorStop(0, '#ffe885');
  goldHair.addColorStop(0.5, '#ebb338');
  goldHair.addColorStop(1, '#a86e18');
  ctx.fillStyle = goldHair;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(s * 0.26, s * 0.44);
  ctx.bezierCurveTo(s * 0.14, s * 0.62, s * 0.18, s * 0.84, s * 0.3, s * 0.9);
  ctx.lineTo(s * 0.74, s * 0.88);
  ctx.bezierCurveTo(s * 0.86, s * 0.8, s * 0.84, s * 0.6, s * 0.74, s * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 黑白荷叶边魔法使上衣与围裙肩带
  ctx.fillStyle = '#f5f2eb';
  ctx.beginPath();
  ctx.moveTo(s * 0.18, s);
  ctx.bezierCurveTo(s * 0.22, s * 0.72, s * 0.35, s * 0.67, s * 0.5, s * 0.67);
  ctx.bezierCurveTo(s * 0.65, s * 0.67, s * 0.78, s * 0.72, s * 0.82, s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 黑色马甲与双排金扣
  const vestGrad = ctx.createLinearGradient(s * 0.34, s * 0.7, s * 0.66, s);
  vestGrad.addColorStop(0, '#2d324d');
  vestGrad.addColorStop(1, '#151829');
  ctx.fillStyle = vestGrad;
  ctx.beginPath();
  ctx.moveTo(s * 0.33, s * 0.7);
  ctx.lineTo(s * 0.67, s * 0.7);
  ctx.lineTo(s * 0.72, s);
  ctx.lineTo(s * 0.28, s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 洁白翻领与四枚黄铜纽扣
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(s * 0.41, s * 0.66);
  ctx.lineTo(s * 0.5, s * 0.77);
  ctx.lineTo(s * 0.59, s * 0.66);
  ctx.lineTo(s * 0.55, s * 0.63);
  ctx.lineTo(s * 0.5, s * 0.7);
  ctx.lineTo(s * 0.45, s * 0.63);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  for (const [bx, by] of [[0.45, 0.82], [0.45, 0.91], [0.55, 0.82], [0.55, 0.91]]) {
    ctx.fillStyle = '#f5ca52';
    ctx.beginPath();
    ctx.arc(s * bx, s * by, s * 0.017, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 脸庞与俏皮璀璨金眸
  drawAnimeFaceBase(ctx, s * 0.51, s * 0.5, s * 0.16, s * 0.175, 'smirk');
  drawAnimeEye(ctx, s * 0.445, s * 0.495, s * 0.095, s * 0.072, '#995c0c', '#ffcf40', 1.4, true);
  drawAnimeEye(ctx, s * 0.58, s * 0.495, s * 0.095, s * 0.072, '#995c0c', '#ffcf40', 1.4, true);

  // 自信眉形
  ctx.strokeStyle = '#9e6918';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(s * 0.39, s * 0.425);
  ctx.lineTo(s * 0.48, s * 0.445);
  ctx.moveTo(s * 0.63, s * 0.425);
  ctx.lineTo(s * 0.54, s * 0.445);
  ctx.stroke();

  // 金色碎刘海与招牌垂肩麻花辫
  ctx.fillStyle = goldHair;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(s * 0.33, s * 0.48);
  ctx.bezierCurveTo(s * 0.32, s * 0.32, s * 0.68, s * 0.32, s * 0.69, s * 0.48);
  ctx.lineTo(s * 0.63, s * 0.44);
  ctx.lineTo(s * 0.59, s * 0.49);
  ctx.lineTo(s * 0.53, s * 0.41);
  ctx.lineTo(s * 0.48, s * 0.48);
  ctx.lineTo(s * 0.42, s * 0.42);
  ctx.lineTo(s * 0.38, s * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 左侧麻花辫与小白结
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#f5c542' : '#ffd966';
    ctx.beginPath();
    ctx.ellipse(s * (0.37 + i * 0.018), s * (0.59 + i * 0.052), s * 0.036, s * 0.028, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#fff8eb';
  ctx.beginPath();
  ctx.ellipse(s * 0.41, s * 0.78, s * 0.035, s * 0.018, -0.2, 0, Math.PI * 2);
  ctx.ellipse(s * 0.46, s * 0.78, s * 0.035, s * 0.018, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 招牌超大斜倾黑尖顶魔女帽 + 白色蕾丝边 + 大白蝴蝶结
  const hatGrad = ctx.createLinearGradient(s * 0.14, s * 0.05, s * 0.85, s * 0.42);
  hatGrad.addColorStop(0, '#3a4266');
  hatGrad.addColorStop(0.5, '#1d2136');
  hatGrad.addColorStop(1, '#0f1221');

  // 帽檐
  ctx.fillStyle = hatGrad;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(s * 0.49, s * 0.36, s * 0.42, s * 0.12, -0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 帽檐内侧白色褶皱花边
  ctx.strokeStyle = '#f5f0e6';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(s * 0.51, s * 0.39, s * 0.25, s * 0.06, -0.2, Math.PI * 0.95, Math.PI * 2.05);
  ctx.stroke();

  // 高耸弯尖帽冠
  ctx.fillStyle = hatGrad;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(s * 0.26, s * 0.34);
  ctx.bezierCurveTo(s * 0.28, s * 0.14, s * 0.34, s * 0.04, s * 0.45, s * 0.07);
  ctx.bezierCurveTo(s * 0.35, s * 0.12, s * 0.48, s * 0.12, s * 0.66, s * 0.28);
  ctx.quadraticCurveTo(s * 0.48, s * 0.37, s * 0.26, s * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 白色绸带与大蝴蝶结
  ctx.fillStyle = '#f7f3eb';
  ctx.beginPath();
  ctx.ellipse(s * 0.33, s * 0.29, s * 0.085, s * 0.048, -0.5, 0, Math.PI * 2);
  ctx.ellipse(s * 0.46, s * 0.24, s * 0.085, s * 0.048, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 右下角炽亮发光迷你八卦炉 + 跃动星轨
  const hx = s * 0.72;
  const hy = s * 0.82;
  const hr = s * 0.095;
  const hGlow = ctx.createRadialGradient(hx, hy, hr * 0.2, hx, hy, hr * 2.4);
  hGlow.addColorStop(0, 'rgba(255, 245, 178, 0.95)');
  hGlow.addColorStop(0.45, 'rgba(255, 190, 62, 0.48)');
  hGlow.addColorStop(1, 'rgba(255, 160, 40, 0)');
  ctx.fillStyle = hGlow;
  ctx.beginPath();
  ctx.arc(hx, hy, hr * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d99e38';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
    const px = hx + Math.cos(a) * hr;
    const py = hy + Math.sin(a) * hr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff9d6';
  ctx.beginPath();
  ctx.arc(hx, hy, hr * 0.56, 0, Math.PI * 2);
  ctx.fill();

  // 星尘光带
  ctx.strokeStyle = 'rgba(255, 232, 130, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx + hr * 0.5, hy);
  ctx.bezierCurveTo(s * 0.94, s * 0.76, s * 0.92, s * 0.56, s * 0.84, s * 0.48);
  ctx.stroke();
}

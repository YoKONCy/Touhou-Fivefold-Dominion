/**
 * 精英与巨构幻想乡兵种程序化半身立绘绘制器（御柱石狮子、星屑魔导书、地底怨灵、非想天则）
 */

import { drawNightBackdrop, INK } from './helpers';

/** 6. 御柱石狮子：雕纹卷鬃玄石狮首 + 青苔金符肩甲 + 朱金注连绳 + 炽热琥珀双瞳 */
export function paintGolem(ctx: CanvasRenderingContext2D, s: number): void {
  drawNightBackdrop(ctx, s, {
    topColor: '#090e1c',
    bottomColor: '#1b1e2c',
    glowColor: 'rgba(255, 186, 66, 0.24)',
    accentSpark: '#ffcf66',
    motif: 'forest',
  });

  // 宽厚雕石双肩甲与胸躯
  const stoneDark = ctx.createLinearGradient(s * 0.1, s * 0.4, s * 0.9, s);
  stoneDark.addColorStop(0, '#807a70');
  stoneDark.addColorStop(0.5, '#595550');
  stoneDark.addColorStop(1, '#2b292b');
  ctx.fillStyle = stoneDark;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s * 0.04, s);
  ctx.bezierCurveTo(s * 0.06, s * 0.56, s * 0.22, s * 0.48, s * 0.5, s * 0.48);
  ctx.bezierCurveTo(s * 0.78, s * 0.48, s * 0.94, s * 0.56, s * 0.96, s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 肩甲青苔与发光金色神符
  ctx.fillStyle = '#3d7d52';
  ctx.beginPath();
  ctx.ellipse(s * 0.16, s * 0.59, s * 0.07, s * 0.03, -0.4, 0, Math.PI * 2);
  ctx.ellipse(s * 0.84, s * 0.59, s * 0.07, s * 0.03, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffcb4d';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(s * 0.8, s * 0.72);
  ctx.lineTo(s * 0.86, s * 0.72);
  ctx.lineTo(s * 0.83, s * 0.8);
  ctx.moveTo(s * 0.15, s * 0.72);
  ctx.lineTo(s * 0.21, s * 0.72);
  ctx.lineTo(s * 0.18, s * 0.8);
  ctx.stroke();

  // 朱金编织神圣注连绳 + 雪白纸垂
  const ropeG = ctx.createLinearGradient(s * 0.2, s * 0.72, s * 0.8, s * 0.82);
  ropeG.addColorStop(0, '#961c32');
  ropeG.addColorStop(0.5, '#e03a52');
  ropeG.addColorStop(1, '#8c1a2e');
  ctx.fillStyle = ropeG;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(s * 0.2, s * 0.68);
  ctx.quadraticCurveTo(s * 0.5, s * 0.86, s * 0.8, s * 0.68);
  ctx.quadraticCurveTo(s * 0.5, s * 0.95, s * 0.2, s * 0.77);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffd566';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s * 0.24, s * 0.73);
  ctx.quadraticCurveTo(s * 0.5, s * 0.89, s * 0.76, s * 0.73);
  ctx.stroke();

  // 三条雪白纸垂
  ctx.fillStyle = '#f7f2ea';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  for (const sx of [0.32, 0.5, 0.68]) {
    ctx.beginPath();
    ctx.moveTo(s * sx, s * 0.82);
    ctx.lineTo(s * (sx + 0.04), s * 0.87);
    ctx.lineTo(s * (sx - 0.01), s * 0.94);
    ctx.lineTo(s * (sx + 0.03), s * 0.99);
    ctx.lineTo(s * (sx - 0.04), s * 0.99);
    ctx.lineTo(s * (sx - 0.02), s * 0.87);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 威严雕石狮鬃（环绕卷纹）
  const maneG = ctx.createRadialGradient(s * 0.5, s * 0.34, s * 0.08, s * 0.5, s * 0.4, s * 0.34);
  maneG.addColorStop(0, '#cfc3ae');
  maneG.addColorStop(0.65, '#8f8676');
  maneG.addColorStop(1, '#4f4a45');
  ctx.fillStyle = maneG;
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12;
    const mx = s * 0.5 + Math.cos(a) * s * 0.24;
    const my = s * 0.4 + Math.sin(a) * s * 0.22;
    ctx.beginPath();
    ctx.arc(mx, my, s * 0.095, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 狮首主面庞
  const faceG = ctx.createLinearGradient(s * 0.32, s * 0.18, s * 0.68, s * 0.62);
  faceG.addColorStop(0, '#dbd1be');
  faceG.addColorStop(0.55, '#a69d8c');
  faceG.addColorStop(1, '#5e5850');
  ctx.fillStyle = faceG;
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.4, s * 0.21, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 额头金雕符印
  ctx.strokeStyle = '#ffcf4d';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(s * 0.5, s * 0.23);
  ctx.lineTo(s * 0.53, s * 0.27);
  ctx.lineTo(s * 0.5, s * 0.31);
  ctx.lineTo(s * 0.47, s * 0.27);
  ctx.closePath();
  ctx.stroke();

  // 威严粗眉与炽热熔金双瞳
  for (const dir of [-1, 1]) {
    const ex = s * (0.5 + dir * 0.088);
    const ey = s * 0.38;
    const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, s * 0.075);
    eg.addColorStop(0, '#ffffff');
    eg.addColorStop(0.35, '#ffbf2b');
    eg.addColorStop(1, 'rgba(255, 118, 24, 0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex, ey, s * 0.075, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffcf40';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(ex - dir * s * 0.045, ey - s * 0.02);
    ctx.quadraticCurveTo(ex, ey - s * 0.04, ex + dir * s * 0.045, ey - s * 0.005);
    ctx.quadraticCurveTo(ex, ey + s * 0.04, ex - dir * s * 0.045, ey - s * 0.02);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#7a1f00';
    ctx.beginPath();
    ctx.ellipse(ex, ey, s * 0.009, s * 0.024, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 威武狮鼻与石雕口鼻
  ctx.fillStyle = '#70685e';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(s * 0.44, s * 0.46);
  ctx.lineTo(s * 0.56, s * 0.46);
  ctx.lineTo(s * 0.5, s * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(s * 0.39, s * 0.54);
  ctx.quadraticCurveTo(s * 0.5, s * 0.58, s * 0.61, s * 0.54);
  ctx.stroke();
}

/** 7. 星屑魔导书：凌空展翼紫金硬壳魔典 + 发光星阵羊皮纸页 + 璀璨黄金星瞳 */
export function paintGrimoire(ctx: CanvasRenderingContext2D, s: number): void {
  drawNightBackdrop(ctx, s, {
    topColor: '#09091e',
    bottomColor: '#1d1438',
    glowColor: 'rgba(176, 108, 255, 0.34)',
    glowY: 0.32,
    accentSpark: '#ffe073',
    motif: 'forest',
  });

  // 紫金雕花硬壳封皮（左右展开翼角）
  const coverL = ctx.createLinearGradient(s * 0.08, s * 0.34, s * 0.5, s * 0.88);
  coverL.addColorStop(0, '#6b32b8');
  coverL.addColorStop(1, '#2c1552');
  ctx.fillStyle = coverL;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(s * 0.14, s * 0.36);
  ctx.lineTo(s * 0.5, s * 0.48);
  ctx.lineTo(s * 0.5, s * 0.9);
  ctx.lineTo(s * 0.08, s * 0.76);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const coverR = ctx.createLinearGradient(s * 0.5, s * 0.48, s * 0.92, s * 0.78);
  coverR.addColorStop(0, '#472180');
  coverR.addColorStop(1, '#7c3dd1');
  ctx.fillStyle = coverR;
  ctx.beginPath();
  ctx.moveTo(s * 0.86, s * 0.36);
  ctx.lineTo(s * 0.5, s * 0.48);
  ctx.lineTo(s * 0.5, s * 0.9);
  ctx.lineTo(s * 0.92, s * 0.76);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 黄铜包角装饰
  ctx.fillStyle = '#e6b84c';
  for (const [cx, cy] of [[0.14, 0.38], [0.86, 0.38], [0.1, 0.74], [0.9, 0.74]]) {
    ctx.beginPath();
    ctx.arc(s * cx, s * cy, s * 0.036, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 发光羊皮纸双页
  const pageG = ctx.createLinearGradient(s * 0.16, s * 0.32, s * 0.84, s * 0.82);
  pageG.addColorStop(0, '#fff7dc');
  pageG.addColorStop(0.5, '#f0d8a8');
  pageG.addColorStop(1, '#fff2c7');
  ctx.fillStyle = pageG;
  // 左页
  ctx.beginPath();
  ctx.moveTo(s * 0.2, s * 0.32);
  ctx.quadraticCurveTo(s * 0.36, s * 0.34, s * 0.5, s * 0.46);
  ctx.lineTo(s * 0.5, s * 0.84);
  ctx.quadraticCurveTo(s * 0.34, s * 0.72, s * 0.14, s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 右页
  ctx.beginPath();
  ctx.moveTo(s * 0.8, s * 0.32);
  ctx.quadraticCurveTo(s * 0.64, s * 0.34, s * 0.5, s * 0.46);
  ctx.lineTo(s * 0.5, s * 0.84);
  ctx.quadraticCurveTo(s * 0.66, s * 0.72, s * 0.86, s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 书页上的金色星轨六芒阵纹
  ctx.strokeStyle = '#c98e2b';
  ctx.lineWidth = 1.8;
  for (const px of [0.33, 0.67]) {
    ctx.beginPath();
    ctx.ellipse(s * px, s * 0.57, s * 0.09, s * 0.1, px < 0.5 ? -0.25 : 0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * px, s * 0.49);
    ctx.lineTo(s * (px + 0.06), s * 0.62);
    ctx.lineTo(s * (px - 0.06), s * 0.62);
    ctx.closePath();
    ctx.stroke();
  }

  // 悬浮黄金星瞳晶核 + 紫金星云环
  const ex = s * 0.5;
  const ey = s * 0.26;
  const starHalo = ctx.createRadialGradient(ex, ey, 4, ex, ey, s * 0.24);
  starHalo.addColorStop(0, 'rgba(255, 240, 150, 0.9)');
  starHalo.addColorStop(0.5, 'rgba(180, 108, 255, 0.38)');
  starHalo.addColorStop(1, 'rgba(180, 108, 255, 0)');
  ctx.fillStyle = starHalo;
  ctx.beginPath();
  ctx.arc(ex, ey, s * 0.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 224, 128, 0.75)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(ex, ey, s * 0.18, s * 0.07, -0.35, 0, Math.PI * 2);
  ctx.stroke();

  // 八芒黄金星体
  ctx.fillStyle = '#ffe066';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? s * 0.125 : s * 0.048;
    const px = ex + Math.cos(a) * rad;
    const py = ey + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 魔眼瞳仁
  ctx.fillStyle = '#fff9d6';
  ctx.beginPath();
  ctx.ellipse(ex, ey, s * 0.038, s * 0.048, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6f22b8';
  ctx.beginPath();
  ctx.ellipse(ex, ey, s * 0.012, s * 0.036, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** 8. 地底怨灵：青碧幽紫盘旋灵焰魅影 + 凛冽紫晶双眸 + 环绕鬼火 */
export function paintSpirit(ctx: CanvasRenderingContext2D, s: number): void {
  drawNightBackdrop(ctx, s, {
    topColor: '#060a18',
    bottomColor: '#131630',
    glowColor: 'rgba(68, 240, 224, 0.36)',
    glowY: 0.44,
    accentSpark: '#c073ff',
    motif: 'cavern',
  });

  // 外层幽紫灵雾拖尾
  const violetG = ctx.createLinearGradient(s * 0.25, s * 0.1, s * 0.78, s * 0.94);
  violetG.addColorStop(0, '#44f0e0');
  violetG.addColorStop(0.5, '#4682d9');
  violetG.addColorStop(1, '#6f2ec4');
  ctx.fillStyle = violetG;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(s * 0.52, s * 0.12);
  ctx.bezierCurveTo(s * 0.78, s * 0.18, s * 0.64, s * 0.36, s * 0.88, s * 0.46);
  ctx.bezierCurveTo(s * 0.74, s * 0.62, s * 0.72, s * 0.78, s * 0.56, s * 0.9);
  ctx.bezierCurveTo(s * 0.38, s * 0.94, s * 0.26, s * 0.78, s * 0.34, s * 0.64);
  ctx.bezierCurveTo(s * 0.14, s * 0.56, s * 0.32, s * 0.42, s * 0.34, s * 0.32);
  ctx.bezierCurveTo(s * 0.34, s * 0.2, s * 0.42, s * 0.14, s * 0.52, s * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 内层高亮青碧灵核魅影
  const coreG = ctx.createRadialGradient(s * 0.47, s * 0.38, s * 0.03, s * 0.48, s * 0.46, s * 0.3);
  coreG.addColorStop(0, '#ebfffd');
  coreG.addColorStop(0.5, '#5ef5e6');
  coreG.addColorStop(1, 'rgba(72, 168, 224, 0.15)');
  ctx.fillStyle = coreG;
  ctx.beginPath();
  ctx.moveTo(s * 0.48, s * 0.18);
  ctx.bezierCurveTo(s * 0.64, s * 0.26, s * 0.64, s * 0.52, s * 0.52, s * 0.78);
  ctx.bezierCurveTo(s * 0.36, s * 0.68, s * 0.34, s * 0.42, s * 0.48, s * 0.18);
  ctx.closePath();
  ctx.fill();

  // 凌厉发光紫晶双瞳
  for (const dir of [-1, 1]) {
    const ex = s * (0.47 + dir * 0.072);
    const ey = s * 0.37;
    const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, s * 0.068);
    eg.addColorStop(0, '#ffffff');
    eg.addColorStop(0.45, '#d16bff');
    eg.addColorStop(1, 'rgba(180, 72, 255, 0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex, ey, s * 0.068, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e5a8ff';
    ctx.strokeStyle = '#330c54';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(ex - dir * s * 0.045, ey - s * 0.03);
    ctx.quadraticCurveTo(ex, ey - s * 0.01, ex + dir * s * 0.042, ey + s * 0.025);
    ctx.quadraticCurveTo(ex, ey + s * 0.04, ex - dir * s * 0.045, ey - s * 0.03);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, ey, s * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 9. 非想天则·试验型：玄铁朱漆重装巨神 + 鎏金黄铜巨肩巴纹 + 炽金核炉 + 新月武士巨盔翠青目镜 */
export function paintHisoutensoku(ctx: CanvasRenderingContext2D, s: number): void {
  drawNightBackdrop(ctx, s, {
    topColor: '#070b18',
    bottomColor: '#1b1626',
    glowColor: 'rgba(255, 178, 56, 0.28)',
    glowY: 0.62,
    accentSpark: '#ff9642',
    motif: 'mountain',
  });

  // 背后双蒸汽烟囱排气管
  ctx.fillStyle = '#736552';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  for (const [tx, rot] of [[0.34, -0.28], [0.72, 0.28]]) {
    ctx.save();
    ctx.translate(s * tx, s * 0.34);
    ctx.rotate(rot);
    ctx.fillRect(-s * 0.03, -s * 0.14, s * 0.06, s * 0.2);
    ctx.strokeRect(-s * 0.03, -s * 0.14, s * 0.06, s * 0.2);
    ctx.restore();
  }

  // 巨型黄铜铆钉双肩甲
  const brassG = ctx.createLinearGradient(s * 0.06, s * 0.36, s * 0.94, s * 0.85);
  brassG.addColorStop(0, '#ffe08a');
  brassG.addColorStop(0.45, '#c48f37');
  brassG.addColorStop(1, '#5e4119');
  ctx.fillStyle = brassG;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(s * 0.16, s * 0.62, s * 0.16, s * 0.22, 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(s * 0.84, s * 0.62, s * 0.17, s * 0.22, -0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 肩甲发光金色巴纹徽记
  for (const sx of [0.16, 0.84]) {
    ctx.fillStyle = '#3b2914';
    ctx.beginPath();
    ctx.arc(s * sx, s * 0.56, s * 0.062, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ffdf75';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(s * sx, s * 0.56, s * 0.036, 0, Math.PI * 1.65);
    ctx.stroke();
    ctx.strokeStyle = INK;
  }

  // 朱漆重装胸甲主躯
  const armorG = ctx.createLinearGradient(s * 0.25, s * 0.44, s * 0.75, s);
  armorG.addColorStop(0, '#d94545');
  armorG.addColorStop(0.55, '#99262c');
  armorG.addColorStop(1, '#47151b');
  ctx.fillStyle = armorG;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s * 0.22, s * 0.52);
  ctx.lineTo(s * 0.78, s * 0.52);
  ctx.lineTo(s * 0.72, s);
  ctx.lineTo(s * 0.28, s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 玄铁厚重护领环
  ctx.fillStyle = '#40485e';
  ctx.beginPath();
  ctx.roundRect(s * 0.34, s * 0.42, s * 0.32, s * 0.13, 12);
  ctx.fill();
  ctx.stroke();

  // 胸口炽金核动力反应炉（带黑铁栅格与强烈辉光）
  const fx = s * 0.48;
  const fy = s * 0.74;
  const fGlow = ctx.createRadialGradient(fx, fy, s * 0.03, fx, fy, s * 0.24);
  fGlow.addColorStop(0, 'rgba(255, 248, 178, 0.95)');
  fGlow.addColorStop(0.45, 'rgba(255, 168, 42, 0.5)');
  fGlow.addColorStop(1, 'rgba(255, 118, 24, 0)');
  ctx.fillStyle = fGlow;
  ctx.beginPath();
  ctx.arc(fx, fy, s * 0.24, 0, Math.PI * 2);
  ctx.fill();

  const coreGrad = ctx.createRadialGradient(fx, fy, 4, fx, fy, s * 0.11);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.5, '#ffe066');
  coreGrad.addColorStop(1, '#ff771c');
  ctx.fillStyle = coreGrad;
  ctx.strokeStyle = '#242938';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(fx - s * 0.11, fy - s * 0.09, s * 0.22, s * 0.18, 12);
  ctx.fill();
  ctx.stroke();
  // 反应炉竖铁栅栏
  ctx.strokeStyle = '#2c221c';
  ctx.lineWidth = 2.6;
  for (const gx of [-0.055, 0, 0.055]) {
    ctx.beginPath();
    ctx.moveTo(fx + s * gx, fy - s * 0.085);
    ctx.lineTo(fx + s * gx, fy + s * 0.085);
    ctx.stroke();
  }

  // 玄铁武士巨盔头颅 + 翠青光学双目镜 + 黄金新月头冠
  const helmG = ctx.createLinearGradient(s * 0.36, s * 0.16, s * 0.64, s * 0.48);
  helmG.addColorStop(0, '#6a7491');
  helmG.addColorStop(0.55, '#3b4259');
  helmG.addColorStop(1, '#1d2233');
  ctx.fillStyle = helmG;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(s * 0.49, s * 0.31, s * 0.145, s * 0.155, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 朱漆武士面罩与吹返护颊
  ctx.fillStyle = '#bd353f';
  ctx.beginPath();
  ctx.roundRect(s * 0.4, s * 0.34, s * 0.18, s * 0.11, 6);
  ctx.fill();
  ctx.stroke();

  // 翠青发光光学目镜
  ctx.fillStyle = '#121826';
  ctx.fillRect(s * 0.38, s * 0.31, s * 0.22, s * 0.058);
  for (const vx of [0.435, 0.54]) {
    const vg = ctx.createRadialGradient(s * vx, s * 0.34, 1, s * vx, s * 0.34, s * 0.06);
    vg.addColorStop(0, '#ffffff');
    vg.addColorStop(0.45, '#54fff0');
    vg.addColorStop(1, 'rgba(64, 240, 224, 0)');
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.arc(s * vx, s * 0.34, s * 0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#85fff5';
    ctx.fillRect(s * vx - s * 0.032, s * 0.326, s * 0.064, s * 0.026);
  }

  // 黄金巨型新月兜饰
  ctx.fillStyle = '#ffd966';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(s * 0.48, s * 0.24);
  ctx.bezierCurveTo(s * 0.3, s * 0.22, s * 0.28, s * 0.08, s * 0.38, s * 0.04);
  ctx.bezierCurveTo(s * 0.34, s * 0.12, s * 0.4, s * 0.18, s * 0.48, s * 0.18);
  ctx.bezierCurveTo(s * 0.56, s * 0.18, s * 0.62, s * 0.12, s * 0.58, s * 0.04);
  ctx.bezierCurveTo(s * 0.68, s * 0.08, s * 0.66, s * 0.22, s * 0.48, s * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/**
 * 高精度程序化暗夜幻想乡立绘与头像共享画布、背景与日系五官绘制原语
 */

export interface ProceduralPortraitSet {
  /** 256×256 高清半身立绘（用于居中详情大窗、双页魔导书、符卡宣言横幅） */
  portraitUrl: string;
  /** 128×128 面部/核心居中特写头像（用于顶部极简出招顺序圆框、右侧栏徽章） */
  avatarUrl: string;
}

export const INK = '#151024';
export const SKIN_LIGHT = '#fff0e0';
export const SKIN_MID = '#fbd7bc';
export const SKIN_SHADE = '#dda58c';

/** 创建高分辨率抗锯齿 Canvas2D 离屏画布 */
export function createHiResCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  return { canvas, ctx };
}

/** 绘制统一风格的暗夜幻想乡氛围背景 + 漂浮流萤与星芒 */
export function drawNightBackdrop(
  ctx: CanvasRenderingContext2D,
  s: number,
  options: {
    topColor: string;
    bottomColor: string;
    glowColor: string;
    glowX?: number;
    glowY?: number;
    accentSpark: string;
    motif?: 'shrine' | 'forest' | 'bamboo' | 'cavern' | 'mountain';
  },
): void {
  const bg = ctx.createLinearGradient(0, 0, 0, s);
  bg.addColorStop(0, options.topColor);
  bg.addColorStop(1, options.bottomColor);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s, s);

  // 月晕与角色身后大气柔光
  const gx = (options.glowX ?? 0.5) * s;
  const gy = (options.glowY ?? 0.42) * s;
  const aura = ctx.createRadialGradient(gx, gy, s * 0.04, gx, gy, s * 0.56);
  aura.addColorStop(0, options.glowColor);
  aura.addColorStop(1, 'rgba(10, 14, 30, 0)');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, s, s);

  // 远景微弱剪影意象
  ctx.save();
  if (options.motif === 'shrine') {
    ctx.fillStyle = 'rgba(20, 14, 34, 0.55)';
    ctx.fillRect(s * 0.08, s * 0.34, s * 0.38, s * 0.03);
    ctx.fillRect(s * 0.11, s * 0.41, s * 0.32, s * 0.022);
    ctx.fillRect(s * 0.15, s * 0.36, s * 0.035, s * 0.38);
    ctx.fillRect(s * 0.35, s * 0.36, s * 0.035, s * 0.38);
  } else if (options.motif === 'bamboo') {
    ctx.fillStyle = 'rgba(14, 28, 46, 0.6)';
    for (const bx of [0.1, 0.2, 0.82, 0.91]) {
      ctx.fillRect(s * bx, 0, s * 0.035, s);
    }
  } else if (options.motif === 'forest') {
    ctx.fillStyle = 'rgba(12, 16, 36, 0.55)';
    for (const tx of [0.12, 0.26, 0.78, 0.9]) {
      ctx.beginPath();
      ctx.moveTo(s * tx, s * 0.14);
      ctx.lineTo(s * (tx - 0.1), s * 0.85);
      ctx.lineTo(s * (tx + 0.1), s * 0.85);
      ctx.closePath();
      ctx.fill();
    }
  } else if (options.motif === 'cavern') {
    ctx.fillStyle = 'rgba(8, 10, 24, 0.75)';
    const spikes = [
      [0, 0, 0.14, 0, 0.06, 0.34],
      [0.86, 0, 1, 0, 0.93, 0.32],
      [0, 1, 0.22, 1, 0.08, 0.7],
      [0.78, 1, 1, 1, 0.92, 0.68],
    ];
    for (const [x1, y1, x2, y2, x3, y3] of spikes) {
      ctx.beginPath();
      ctx.moveTo(s * x1, s * y1);
      ctx.lineTo(s * x2, s * y2);
      ctx.lineTo(s * x3, s * y3);
      ctx.closePath();
      ctx.fill();
    }
  } else if (options.motif === 'mountain') {
    ctx.fillStyle = 'rgba(12, 16, 32, 0.65)';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.62);
    ctx.lineTo(s * 0.28, s * 0.34);
    ctx.lineTo(s * 0.56, s * 0.58);
    ctx.lineTo(s * 0.82, s * 0.32);
    ctx.lineTo(s, s * 0.54);
    ctx.lineTo(s, s);
    ctx.lineTo(0, s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 漂浮暗夜金/星流萤微粒
  const sparks = [
    [0.14, 0.2, 2.2],
    [0.84, 0.18, 2.6],
    [0.22, 0.72, 1.8],
    [0.86, 0.64, 2.1],
    [0.76, 0.36, 1.6],
    [0.18, 0.46, 1.9],
    [0.64, 0.14, 1.5],
    [0.34, 0.12, 1.4],
  ];
  for (const [sx, sy, sr] of sparks) {
    const px = sx * s;
    const py = sy * s;
    const spG = ctx.createRadialGradient(px, py, 0, px, py, sr * 3.2);
    spG.addColorStop(0, '#ffffff');
    spG.addColorStop(0.35, options.accentSpark);
    spG.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spG;
    ctx.beginPath();
    ctx.arc(px, py, sr * 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 绘制精致日系赛璐珞双眸（深色上睫、渐变虹膜、深邃瞳孔、双点晶亮高光、下缘微光） */
export function drawAnimeEye(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  irisTop: string,
  irisBottom: string,
  lookDx = 0,
  sharp = false,
): void {
  ctx.save();
  // 眼白
  ctx.fillStyle = '#fffaf5';
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.5, h * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  // 虹膜渐变
  const ig = ctx.createLinearGradient(cx, cy - h * 0.42, cx, cy + h * 0.42);
  ig.addColorStop(0, irisTop);
  ig.addColorStop(0.6, irisBottom);
  ig.addColorStop(1, '#fff2cc');
  ctx.fillStyle = ig;
  ctx.beginPath();
  ctx.ellipse(cx + lookDx, cy + h * 0.03, w * 0.34, h * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // 瞳孔
  ctx.fillStyle = '#1b1124';
  ctx.beginPath();
  ctx.ellipse(cx + lookDx, cy + h * 0.04, w * 0.16, h * 0.21, 0, 0, Math.PI * 2);
  ctx.fill();

  // 上眼影柔暗
  ctx.fillStyle = 'rgba(24, 14, 38, 0.32)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.26, w * 0.45, h * 0.22, 0, 0, Math.PI);
  ctx.fill();

  // 双高光点（赋予角色灵魂神采！）
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx + lookDx - w * 0.14, cy - h * 0.15, Math.max(1.4, w * 0.11), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + lookDx + w * 0.13, cy + h * 0.16, Math.max(0.9, w * 0.06), 0, Math.PI * 2);
  ctx.fill();

  // 精致上睫毛墨线
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, h * 0.2);
  ctx.beginPath();
  if (sharp) {
    ctx.moveTo(cx - w * 0.56, cy - h * 0.16);
    ctx.quadraticCurveTo(cx, cy - h * 0.58, cx + w * 0.58, cy - h * 0.24);
  } else {
    ctx.moveTo(cx - w * 0.54, cy - h * 0.08);
    ctx.quadraticCurveTo(cx, cy - h * 0.62, cx + w * 0.54, cy - h * 0.12);
  }
  ctx.stroke();

  // 轻柔下睫线
  ctx.strokeStyle = 'rgba(38, 22, 48, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.34, cy + h * 0.44);
  ctx.quadraticCurveTo(cx, cy + h * 0.54, cx + w * 0.34, cy + h * 0.42);
  ctx.stroke();
  ctx.restore();
}

/** 绘制精致日系少女脸型与柔和腮红、脖颈阴影 */
export function drawAnimeFaceBase(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  smile: 'serene' | 'smirk' | 'cheerful' | 'focused',
): void {
  // 颈部与锁骨柔影
  const neckGrad = ctx.createLinearGradient(cx, cy + ry * 0.72, cx, cy + ry * 1.48);
  neckGrad.addColorStop(0, SKIN_SHADE);
  neckGrad.addColorStop(0.45, SKIN_MID);
  neckGrad.addColorStop(1, SKIN_LIGHT);
  ctx.fillStyle = neckGrad;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.3, cy + ry * 0.7);
  ctx.lineTo(cx - rx * 0.34, cy + ry * 1.45);
  ctx.lineTo(cx + rx * 0.34, cy + ry * 1.45);
  ctx.lineTo(cx + rx * 0.3, cy + ry * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 柔和下巴轮廓脸庞
  const faceGrad = ctx.createRadialGradient(cx - rx * 0.15, cy - ry * 0.2, rx * 0.1, cx, cy, rx * 1.25);
  faceGrad.addColorStop(0, SKIN_LIGHT);
  faceGrad.addColorStop(0.72, SKIN_MID);
  faceGrad.addColorStop(1, SKIN_SHADE);
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy - ry * 0.15);
  ctx.bezierCurveTo(cx - rx, cy - ry * 1.05, cx + rx, cy - ry * 1.05, cx + rx, cy - ry * 0.15);
  ctx.bezierCurveTo(cx + rx * 0.96, cy + ry * 0.52, cx + rx * 0.34, cy + ry * 0.98, cx, cy + ry);
  ctx.bezierCurveTo(cx - rx * 0.34, cy + ry * 0.98, cx - rx * 0.96, cy + ry * 0.52, cx - rx, cy - ry * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 双颊透粉暖光腮红
  for (const dir of [-1, 1]) {
    const bx = cx + dir * rx * 0.54;
    const by = cy + ry * 0.26;
    const bg = ctx.createRadialGradient(bx, by, 1, bx, by, rx * 0.32);
    bg.addColorStop(0, 'rgba(255, 134, 146, 0.42)');
    bg.addColorStop(1, 'rgba(255, 134, 146, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(bx, by, rx * 0.32, ry * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 精致小鼻尖微影
  ctx.fillStyle = '#c98e77';
  ctx.beginPath();
  ctx.arc(cx + rx * 0.03, cy + ry * 0.22, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // 表情神态嘴唇
  ctx.strokeStyle = '#8c4448';
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  if (smile === 'serene') {
    ctx.moveTo(cx - rx * 0.2, cy + ry * 0.5);
    ctx.quadraticCurveTo(cx, cy + ry * 0.62, cx + rx * 0.22, cy + ry * 0.48);
    ctx.stroke();
  } else if (smile === 'smirk') {
    ctx.moveTo(cx - rx * 0.24, cy + ry * 0.5);
    ctx.quadraticCurveTo(cx + rx * 0.04, cy + ry * 0.64, cx + rx * 0.28, cy + ry * 0.42);
    ctx.stroke();
  } else if (smile === 'cheerful') {
    ctx.fillStyle = '#e86f7c';
    ctx.moveTo(cx - rx * 0.22, cy + ry * 0.46);
    ctx.quadraticCurveTo(cx, cy + ry * 0.72, cx + rx * 0.22, cy + ry * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.moveTo(cx - rx * 0.18, cy + ry * 0.54);
    ctx.quadraticCurveTo(cx, cy + ry * 0.5, cx + rx * 0.18, cy + ry * 0.54);
    ctx.stroke();
  }
}

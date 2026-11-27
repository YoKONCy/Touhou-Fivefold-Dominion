/**
 * 100% 纯代码零静态资源 · 高精度程序化暗夜幻想乡立绘与头像渲染引擎
 *
 * 设计理念（严格遵循全代码零静态资源宪章）：
 * - 彻底告别把 36×40 战场小方块粗暴放大当头像的做法！
 * - 基于高分辨率离屏 Canvas2D（256×256 逻辑像素），用贝塞尔曲线、多层径向/线性赛璐珞渐变、
 *   月光靛蓝边缘轮廓光（Rim Light）、暖金神灯主光、深靛墨线描边与精致高光双眸，
 *   纯代码绘制全部 9 位东方英雄与幻想乡兵种的精美半身立绘（Portrait）与面部特写头像（Avatar）！
 * - 首次调用时烘焙并缓存为 DataURL，零运行时每帧开销，且与暗夜和风 UI 100% 画风统一！
 */

export interface ProceduralPortraitSet {
  /** 256×256 高清半身立绘（用于居中详情大窗、双页魔导书、符卡宣言横幅） */
  portraitUrl: string;
  /** 128×128 面部/核心居中特写头像（用于顶部极简出招顺序圆框、右侧栏徽章） */
  avatarUrl: string;
}

const INK = '#151024';
const SKIN_LIGHT = '#fff0e0';
const SKIN_MID = '#fbd7bc';
const SKIN_SHADE = '#dda58c';

function createHiResCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
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
function drawNightBackdrop(
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
function drawAnimeEye(
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
function drawAnimeFaceBase(
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

/** 1. 博丽灵梦：朱红大蝴蝶结 + 乌黑柔顺长发 + 赤瞳 + 红白巫女服 + 博丽御币 + 浮空阴阳玉 */
function paintReimu(ctx: CanvasRenderingContext2D, s: number): void {
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
function paintMarisa(ctx: CanvasRenderingContext2D, s: number): void {
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

/** 3. 阴阳毛玉：24 束分层柔软月光绒毛 + 璀璨朱金阴阳玉灵核 + 双伴飞灵火 */
function paintKedama(ctx: CanvasRenderingContext2D, s: number): void {
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
function paintFairy(ctx: CanvasRenderingContext2D, s: number): void {
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
function paintRabbit(ctx: CanvasRenderingContext2D, s: number): void {
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

/** 6. 御柱石狮子：雕纹卷鬃玄石狮首 + 青苔金符肩甲 + 朱金注连绳 + 炽热琥珀双瞳 */
function paintGolem(ctx: CanvasRenderingContext2D, s: number): void {
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
function paintGrimoire(ctx: CanvasRenderingContext2D, s: number): void {
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
function paintSpirit(ctx: CanvasRenderingContext2D, s: number): void {
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
function paintHisoutensoku(ctx: CanvasRenderingContext2D, s: number): void {
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

const PORTRAIT_PAINTERS: Record<string, (ctx: CanvasRenderingContext2D, s: number) => void> = {
  hero_reimu: paintReimu,
  hero_marisa: paintMarisa,
  creature_kedama: paintKedama,
  creature_fairy: paintFairy,
  creature_rabbit: paintRabbit,
  creature_golem: paintGolem,
  creature_grimoire: paintGrimoire,
  creature_spirit: paintSpirit,
  creature_hisoutensoku: paintHisoutensoku,
};

/** 头像面部特写裁剪框（标准化 0..1 坐标，确保圆形小头像完美聚焦五官/核心，不切头也不显小！） */
const AVATAR_CROP_RECTS: Record<string, { x: number; y: number; size: number }> = {
  hero_reimu: { x: 0.14, y: 0.1, size: 0.72 },
  hero_marisa: { x: 0.12, y: 0.1, size: 0.76 },
  creature_kedama: { x: 0.06, y: 0.06, size: 0.88 },
  creature_fairy: { x: 0.14, y: 0.1, size: 0.72 },
  creature_rabbit: { x: 0.12, y: 0.08, size: 0.74 },
  creature_golem: { x: 0.12, y: 0.1, size: 0.76 },
  creature_grimoire: { x: 0.06, y: 0.08, size: 0.88 },
  creature_spirit: { x: 0.12, y: 0.08, size: 0.76 },
  creature_hisoutensoku: { x: 0.14, y: 0.06, size: 0.72 },
};

const portraitSetCache = new Map<string, ProceduralPortraitSet>();

/**
 * 获取（并缓存）指定角色/兵种的 100% 纯代码高清立绘与面部特写头像 DataURL
 */
export function getProceduralPortraitSet(blueprintId: string): ProceduralPortraitSet {
  const cached = portraitSetCache.get(blueprintId);
  if (cached) return cached;

  const painter = PORTRAIT_PAINTERS[blueprintId] ?? paintKedama;
  const fullSize = 256;
  const { canvas: fullCanvas, ctx: fullCtx } = createHiResCanvas(fullSize);
  painter(fullCtx, fullSize);

  // 柔和暗夜内暗角压边，使立绘融入暗金卷轴画框更显高级
  const vig = fullCtx.createRadialGradient(
    fullSize * 0.5,
    fullSize * 0.45,
    fullSize * 0.34,
    fullSize * 0.5,
    fullSize * 0.5,
    fullSize * 0.64,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(6, 8, 18, 0.42)');
  fullCtx.fillStyle = vig;
  fullCtx.fillRect(0, 0, fullSize, fullSize);

  const crop = AVATAR_CROP_RECTS[blueprintId] ?? { x: 0.1, y: 0.1, size: 0.8 };
  const avatarSize = 128;
  const { canvas: avCanvas, ctx: avCtx } = createHiResCanvas(avatarSize);
  avCtx.drawImage(
    fullCanvas,
    crop.x * fullSize,
    crop.y * fullSize,
    crop.size * fullSize,
    crop.size * fullSize,
    0,
    0,
    avatarSize,
    avatarSize,
  );

  const result: ProceduralPortraitSet = {
    portraitUrl: fullCanvas.toDataURL('image/png'),
    avatarUrl: avCanvas.toDataURL('image/png'),
  };
  portraitSetCache.set(blueprintId, result);
  return result;
}

export function getUnitPortraitUrl(blueprintId: string): string {
  return getProceduralPortraitSet(blueprintId).portraitUrl;
}

export function getUnitAvatarUrl(blueprintId: string): string {
  return getProceduralPortraitSet(blueprintId).avatarUrl;
}

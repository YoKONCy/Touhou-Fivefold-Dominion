/**
 * 幽冥公馆 · 死亡阵营其余 9 位单位 64×72 新一代精雕像素绘谱（与 v8 蕾米莉亚 100% 统一画风！）
 *
 * 严格遵循 v8 黄金像素美学标准：
 * - 7 位东方萌系美少女（小恶魔 / 怨灵 / 地狱鸦 / 血族眷属 / 毒瘴妖 / 深渊隙间恶魔 / 深渊冰魔）：
 *   2.3 头身圆润苹果脸 + 4×4 水灵朝右宝石大眼 + 干净大色块发团与波浪裙摆 + 3/4 斜错步 + 2px 软萌少女小臂！
 * - 2 位硬核帅气骨系单位（尸壳 / 骸骨巨龙）：
 *   全画幅立体骸骨结构、镂空胸肋幽焰、凶猛獠牙骨首与撕裂冥焰蝠翼，帅气凶狠绝不敷衍！
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawCuteRibbonBow64,
  drawGothicBatWings64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSlashArc64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  HD_ORIGIN_X,
  HD_ORIGIN_Y,
  HD_RENDER_SCALE,
  HD_SPRITE_HEIGHT,
  HD_SPRITE_WIDTH,
  SPRITE_PART,
  type HdPixelPainter,
} from './hdPixelEngine';
import type { RigPose, SpriteRigSpec } from './voxelSprites';

const HD_BASE = {
  width: HD_SPRITE_WIDTH,
  height: HD_SPRITE_HEIGHT,
  originX: HD_ORIGIN_X,
  originY: HD_ORIGIN_Y,
  renderScale: HD_RENDER_SCALE,
  avatarCrop: { x: 14, y: 5, size: 36 },
  portraitCrop: { x: 4, y: 3, w: 56, h: 64 },
  draw: () => {},
} as const;

/** 绘制环握武器柄的正面上层 3×2 娇小玉手 */
function drawWrappedHand(p: HdPixelPainter, gx: number, gy: number, skin = '#ffe6dc', hi = '#fff7f2', sh = '#e8b3ad'): void {
  p.setPart(SPRITE_PART.WEAPON);
  p.rect(gx - 1, gy - 1, 3, 2, skin);
  p.hline(gx - 1, gy - 1, 2, hi);
  p.hline(gx - 1, gy + 1, 2, sh);
}

/** 飞行少女悬空轻收微屈的娇小双腿（飞行扑翅时不再踏步走路，轻盈后收！） */
function drawFlyingTuckedLegs64(
  p: HdPixelPainter,
  cx: number,
  topY: number,
  by: number,
  opts: {
    sockShadow: string;
    sockLight: string;
    shoeDark: string;
    shoeMain: string;
    shoeHighlight?: string;
    skinColor?: string;
  },
): void {
  p.setPart(SPRITE_PART.LEGS);
  const drawTucked = (lx: number, fy: number, isFront: boolean) => {
    const sockCol = isFront ? opts.sockLight : opts.sockShadow;
    // 向后微屈斜收的纤细小腿
    p.line(lx + 1, topY + by, lx - 2, fy + by - 3, sockCol, 3);
    if (opts.skinColor) {
      p.rect(lx, topY + by, 3, 2, opts.skinColor);
    }
    p.line(lx + 1, topY + by + 1, lx - 1, fy + by - 4, isFront ? '#ffffff' : opts.sockLight, 1);
    // 尖尖朝右下方轻垂的小皮鞋
    p.rect(lx - 4, fy + by - 3, 6, 3, opts.shoeDark);
    p.rect(lx - 3, fy + by - 3, 5, 2, isFront ? opts.shoeMain : opts.shoeDark);
    if (opts.shoeHighlight) {
      p.px(lx, fy + by - 3, opts.shoeHighlight);
    }
  };
  drawTucked(cx - 5, 60, false);
  drawTucked(cx + 2, 62, true);
}

/**
 * 血族眷属专属 move 变身形态：化身华丽「猩红大血蝠」4 帧扑翅疾掠 + 双迷你小血蝠与绯红血雾尾迹！
 */
function drawCrimsonVampireBatFlight64(p: HdPixelPainter, pose: RigPose): void {
  const f = pose.frame % 4;
  // 4 帧经典吸血鬼血蝠扑翅物理节奏：0高举蓄力 → 1全力下拍压风 → 2贴风低掠滑翔 → 3回扬振翅
  const wingLift = [-15, 13, 2, -8][f];
  const wingSpan = [23, 25, 27, 24][f];
  const bobY = [-3, 3, 0, -2][f];
  const cx = 34;
  const cy = 35 + bobY;

  // [1] 绯红血雾流光尾迹 + 2 只错拍跟随的迷你猩红小血蝠
  p.setPart(SPRITE_PART.GLOW_FX);
  const trailShift = [0, 2, 4, 2][f];
  p.bezierRibbon([cx - 8, cy + 2], [cx - 18, cy + 3 + (f % 2 === 0 ? -2 : 2)], [6 + trailShift, cy + 5], 4.2, 0.8, '#8c0c2b', true);
  p.bezierRibbon([cx - 10, cy + 1], [cx - 18, cy + 2], [10 + trailShift, cy + 4], 1.8, 0.5, '#ff4070', true);
  p.px(12 + trailShift, cy - 3, '#ff6e94', true);
  p.px(17, cy + 8, '#ff3366', true);
  p.px(9, cy + 1, '#ffd4e2', true);

  // 2 只随行迷你暗红小血蝠（错拍上下扇翅，呼应血族蝠群疾掠！）
  const drawEscortBat = (bx: number, by: number, bFlap: number) => {
    p.setPart(SPRITE_PART.BACK_ACC);
    p.poly([[bx, by], [bx - 6, by - 4 + bFlap], [bx - 4, by + 2]], '#59081e');
    p.poly([[bx, by], [bx + 5, by - 4 + bFlap], [bx + 4, by + 2]], '#7d0d2c');
    p.line(bx - 6, by - 4 + bFlap, bx, by, '#ff3366', 1);
    p.line(bx + 5, by - 4 + bFlap, bx, by, '#ff4d7a', 1);
    p.ellipse(bx, by, 2.2, 1.8, '#9e1138');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx + 1, by - 1, '#ffdfe8', true);
  };
  drawEscortBat(13, cy - 11 + (f % 2 === 0 ? -2 : 2), f % 2 === 0 ? 4 : -4);
  drawEscortBat(15, cy + 14 + (f % 2 === 0 ? 2 : -2), f % 2 === 0 ? -4 : 4);

  // [2] 猩红巨血蝠左右宽阔恶魔蝠翼（4 帧大振幅扑扇，翼骨明晰、血膜饱满！）
  p.setPart(SPRITE_PART.BACK_ACC);
  const drawBatWing = (dir: -1 | 1, span: number, lift: number) => {
    const shX = cx + dir * 3;
    const shY = cy;
    const elbowX = cx + dir * Math.round(span * 0.52);
    const elbowY = cy - 4 + Math.round(lift * 0.65);
    const tipX = Math.max(4, Math.min(60, cx + dir * span));
    const tipY = cy + lift;
    const lobe1X = cx + dir * Math.round(span * 0.74);
    const lobe1Y = cy + Math.round(lift * 0.58) + 8;
    const lobe2X = cx + dir * Math.round(span * 0.42);
    const lobe2Y = cy + Math.round(lift * 0.3) + 10;

    // 暗绯黑红底层大蝠翼剪影（经典 3 拱蝙蝠凹弧！）
    p.poly(
      [
        [shX, shY - 2],
        [elbowX, elbowY],
        [tipX, tipY],
        [Math.round((tipX + lobe1X) * 0.5) - dir * 2, Math.round((tipY + lobe1Y) * 0.5) - 2],
        [lobe1X, lobe1Y],
        [Math.round((lobe1X + lobe2X) * 0.5) - dir * 1, Math.round((lobe1Y + lobe2Y) * 0.5) - 2],
        [lobe2X, lobe2Y],
        [shX, shY + 5],
      ],
      '#360619',
    );
    // 浓郁鲜红翼膜主面
    p.poly(
      [
        [shX + dir * 1, shY],
        [elbowX, elbowY + 2],
        [tipX - dir * 2, tipY + 1],
        [lobe1X - dir * 1, lobe1Y - 2],
        [lobe2X, lobe2Y - 2],
      ],
      '#a81139',
    );
    // 受光璀璨亮玫红膜面
    p.poly(
      [
        [shX + dir * 2, shY],
        [elbowX, elbowY + 2],
        [Math.round((elbowX + tipX) * 0.55), Math.round((elbowY + tipY) * 0.55) + 2],
        [lobe2X + dir * 1, lobe2Y - 4],
      ],
      '#eb2a5b',
    );
    // 清晰黑曜翼骨梁 + 放射指骨 + 翼弯金红勾爪
    p.bezierRibbon([shX, shY - 1], [elbowX, elbowY - 1], [tipX, tipY], 2.6, 1.0, '#1c0412');
    p.line(shX + dir, shY - 1, elbowX, elbowY, '#ff668c', 1);
    p.line(elbowX, elbowY, tipX, tipY, '#ff4d7a', 1);
    p.line(elbowX, elbowY + 1, lobe1X, lobe1Y, '#1c0412', 1);
    p.line(elbowX - dir * 2, elbowY + 2, lobe2X, lobe2Y, '#1c0412', 1);
    p.px(elbowX, elbowY - 2, '#ffd966', true); // 翼弯小金爪
  };
  // 后翼（左偏后，略大展幅）与前翼（右偏前，3/4 透视层次！）
  drawBatWing(-1, wingSpan, wingLift);
  drawBatWing(1, Math.round(wingSpan * 0.86), Math.round(wingLift * 0.92) - 1);

  // [3] 血蝠绒毛躯干、小巧尖尾与邪魅血蝠头雕（立耳 + 发光猩红锐眸 + 雪白小獠牙！）
  p.setPart(SPRITE_PART.TORSO);
  p.ellipse(cx, cy + 2, 5.2, 6.2, '#4a081f');
  p.ellipse(cx + 0.5, cy + 1, 3.8, 4.6, '#8f1135');
  p.ellipse(cx + 1, cy, 2.2, 2.8, '#cf214f');
  // 尖小恶魔尾
  p.poly([[cx - 2, cy + 7], [cx - 5, cy + 12], [cx, cy + 9]], '#360619');

  // 血蝠头雕 + 一对锐利尖耸恶魔蝠耳
  p.setPart(SPRITE_PART.NECK_HEAD);
  const hx = cx + 2;
  const hy = cy - 4;
  p.poly([[hx - 4, hy - 2], [hx - 6, hy - 10], [hx - 1, hy - 4]], '#360619');
  p.line(hx - 5, hy - 8, hx - 2, hy - 4, '#d92152', 1);
  p.poly([[hx + 2, hy - 2], [hx + 5, hy - 10], [hx + 5, hy - 3]], '#360619');
  p.line(hx + 4, hy - 8, hx + 4, hy - 4, '#ff4d7a', 1);
  p.ellipse(hx, hy, 4.8, 4.2, '#5c0925');
  p.ellipse(hx + 0.4, hy - 0.5, 3.6, 3.1, '#a8133d');
  // 摄魂璀璨猩红双瞳 + 迷你雪白双獠牙！
  p.setPart(SPRITE_PART.GLOW_FX);
  p.rect(hx - 2, hy - 1, 2, 2, '#ff1f53', true);
  p.px(hx - 2, hy - 1, '#ffffff', true);
  p.rect(hx + 2, hy - 1, 2, 2, '#ff1f53', true);
  p.px(hx + 2, hy - 1, '#ffffff', true);
  p.px(hx, hy + 2, '#ffffff');
  p.px(hx + 3, hy + 2, '#ffffff');

  // 全力下拍帧（f === 1）：左右翼尖各自划出锐利猩红血风破空弧（不连死成底部整条！）
  if (f === 1) {
    p.setPart(SPRITE_PART.GLOW_FX);
    p.bezierRibbon([cx - 24, cy + 4], [cx - 27, cy + 12], [cx - 17, cy + 17], 2.2, 0.5, '#ff1f53', true);
    p.bezierRibbon([cx - 23, cy + 5], [cx - 25, cy + 11], [cx - 18, cy + 16], 1.0, 0.4, '#ffd9e6', true);
    p.bezierRibbon([cx + 21, cy + 3], [cx + 24, cy + 11], [cx + 15, cy + 16], 2.0, 0.5, '#ff1f53', true);
    p.bezierRibbon([cx + 20, cy + 4], [cx + 22, cy + 10], [cx + 16, cy + 15], 1.0, 0.4, '#ffd9e6', true);
  }
}

/**
 * 怨灵专属 move 变身形态：化作「幽蓝紫流光彗星大灵团」4 帧波浪曳尾飞行 + 绕核公转双鬼火！
 */
function drawWraithOrbFlight64(p: HdPixelPainter, pose: RigPose): void {
  const f = pose.frame % 4;
  const ph = (f / 4) * Math.PI * 2;
  const bobY = Math.round(Math.sin(ph) * 2.5);
  const wave1 = Math.round(Math.sin(ph) * 5.0);
  const wave2 = Math.round(Math.cos(ph) * 5.0);
  const cx = 39;
  const cy = 34 + bobY;

  // [1] 双股交缠翻涌的幽蓝×薰衣草紫长彗星灵尾（4 帧丝滑波浪流动！）
  p.setPart(SPRITE_PART.BACK_ACC);
  // 主幽蓝灵尾
  p.bezierRibbon(
    [cx - 3, cy],
    [24, cy + wave1],
    [7, cy - Math.round(wave2 * 0.7)],
    14.5,
    1.6,
    '#2a5ec4',
    true,
  );
  p.bezierRibbon(
    [cx - 2, cy],
    [25, cy + Math.round(wave1 * 0.85)],
    [10, cy - Math.round(wave2 * 0.55)],
    9.5,
    1.0,
    '#66d9ff',
    true,
  );
  // 纠缠副冥紫灵焰丝带
  p.bezierRibbon(
    [cx - 4, cy + 2],
    [23, cy - wave1 * 0.85],
    [9, cy + Math.round(wave2 * 0.8)],
    6.5,
    1.0,
    '#7b42e8',
    true,
  );
  p.bezierRibbon(
    [cx - 3, cy + 1],
    [24, cy - Math.round(wave1 * 0.65)],
    [13, cy + Math.round(wave2 * 0.55)],
    3.0,
    0.6,
    '#d6b3ff',
    true,
  );

  // [2] 璀璨梦幻半透感大灵团主体（流线水滴核：深海蓝外晕 → 冰青亮层 → 洁白纯核！）
  p.setPart(SPRITE_PART.TORSO);
  p.ellipse(cx, cy, 12.2, 10.6, '#2b66cc', true);
  p.ellipse(cx + 0.8, cy - 0.5, 10.2, 8.8, '#54c4ff', true);
  p.ellipse(cx + 1.4, cy - 1.0, 7.6, 6.6, '#b8f2ff', true);
  p.ellipse(cx + 2.0, cy - 1.4, 4.8, 4.2, '#ffffff', true);
  // 顶沿跃动淡紫灵火冠弧
  p.bezierRibbon([cx - 6, cy - 8], [cx, cy - 13 + Math.round(wave1 * 0.3)], [cx + 7, cy - 7], 2.4, 0.8, '#9e6bff', true);

  // [3] 灵团内核隐约浮现的迷离幽灵双眸（一眼识别怨灵本尊，灵气十足！）
  p.setPart(SPRITE_PART.FACE_FEATURES);
  p.rect(cx - 1, cy - 2, 2, 3, '#3b24a6');
  p.px(cx - 1, cy - 2, '#ffffff', true);
  p.rect(cx + 4, cy - 2, 2, 3, '#3b24a6');
  p.px(cx + 4, cy - 2, '#ffffff', true);
  p.px(cx - 3, cy + 2, '#c49eff');
  p.px(cx + 6, cy + 2, '#c49eff');

  // [4] 绕灵团高速公转的青碧 & 冥紫双色小鬼火 + 沿途散落冰青灵尘！
  p.setPart(SPRITE_PART.GLOW_FX);
  const orb1X = Math.round(cx + Math.cos(ph) * 16);
  const orb1Y = Math.round(cy + Math.sin(ph) * 12);
  p.ellipse(orb1X, orb1Y, 3.0, 3.0, '#1cd6e8', true);
  p.ellipse(orb1X, orb1Y, 1.5, 1.5, '#ffffff', true);

  const orb2X = Math.round(cx + Math.cos(ph + Math.PI) * 16);
  const orb2Y = Math.round(cy + Math.sin(ph + Math.PI) * 12);
  p.ellipse(orb2X, orb2Y, 2.8, 2.8, '#9b4dff', true);
  p.ellipse(orb2X, orb2Y, 1.4, 1.4, '#ffffff', true);

  // 散落灵尘星点
  p.px(12 + (f * 3) % 8, cy - 8, '#99f5ff', true);
  p.px(18 - f * 2, cy + 9, '#d6a6ff', true);
  p.px(8 + f * 2, cy + 2, '#ffffff', true);
}

export const HD_DEATH_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  // =========================================================================
  // 1. 尸壳（T1-A · 骸骨体质：正统苍白镂空骷髅剑盾武士 + 破损暗紫披风 + 冥火眼窝）
  // =========================================================================
  creature_corpse_husk: {
    ...HD_BASE,
    backdropTop: '#121024',
    backdropBottom: '#231f42',
    backdropGlow: '#52ffe8',
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 28 : Math.round(31 + pose.leanX * 0.9);
      const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.2);
      const sway = pose.flutter * 1.8;
      const stride = Math.round(pose.stride * 4.2);
      const headY = 20 + by;

      // [1] 破损飘扬的暗紫残破披风 + 高耸立领（衬托苍白骷髅头！）
      p.setPart(SPRITE_PART.BACK_ACC);
      p.poly(
        [
          [bx - 8, 26 + by],
          [bx + 7, 26 + by],
          [bx + 9 - sway * 0.4, 49 + by],
          [bx + 3 - sway * 0.3, 52 + by],
          [bx - 2 + sway * 0.4, 48 + by],
          [bx - 9 + sway * 0.8, 54 + by],
          [bx - 16 + sway, 46 + by],
          [bx - 13 + sway * 0.6, 34 + by],
        ],
        '#291f45',
      );
      p.poly(
        [
          [bx - 7, 27 + by],
          [bx + 5, 27 + by],
          [bx - 4 + sway * 0.5, 48 + by],
          [bx - 13 + sway * 0.8, 44 + by],
        ],
        '#463670',
      );
      // 颈后翻起的破损暗紫高领
      p.poly([[bx - 9, 24 + by], [bx - 4, 28 + by], [bx + 5, 28 + by], [bx + 8, 24 + by], [bx + 6, 31 + by], [bx - 7, 31 + by]], '#392a5e');
      p.line(bx - 9, 24 + by, bx - 4, 28 + by, '#7b62ba', 1);
      p.line(bx + 8, 24 + by, bx + 5, 28 + by, '#7b62ba', 1);
      p.bezierRibbon([bx - 11, 33 + by], [bx - 14 + sway * 0.6, 41 + by], [bx - 15 + sway, 47 + by], 2.0, 1.0, '#6a539e');

      // [2] 清晰 3/4 错步白骨下肢与冥铁护胫
      p.setPart(SPRITE_PART.LEGS);
      const backLift = pose.stride > 0.25 ? -2 : 0;
      const frontLift = pose.stride < -0.25 ? -2 : 0;
      const drawBoneLeg = (lx: number, fy: number, lift: number, front: boolean) => {
        const boneCol = front ? '#eef3fa' : '#b8c3d9';
        const jointCol = front ? '#ffffff' : '#d5dff0';
        const topY = 47 + by + lift;
        const botY = fy + lift;
        p.line(lx, topY, lx + 1, topY + 7, boneCol, 2);
        p.ellipse(lx + 1, topY + 7, 2.0, 1.6, jointCol); // 膝关节
        p.line(lx + 1, topY + 8, lx, botY - 3, boneCol, 2);
        // 残破铁靴/骨爪脚
        p.rect(lx - 1, botY - 3, 6, 3, '#3c4563');
        p.hline(lx, botY - 3, 4, front ? '#7c8db8' : '#566487');
      };
      drawBoneLeg(bx - 5 - stride, 63, backLift, false);
      drawBoneLeg(bx + 4 + stride, 65, frontLift, true);

      // [3] 镂空燃魂白骨胸腔（暗腔脊椎 → 内燃幽青魂火 → 4 对雪白弧肋跨过魂火前层！）
      p.setPart(SPRITE_PART.TORSO);
      // 暗幽骨盆与腰带
      p.poly([[bx - 6, 44 + by], [bx + 6, 44 + by], [bx + 5, 48 + by], [bx - 5, 48 + by]], '#353e59');
      p.hline(bx - 6, 44 + by, 12, '#6c7ba3');
      p.rect(bx - 1, 44 + by, 3, 3, '#c9d6ed'); // 骨盆扣
      // 胸腔深暗内腔底 + 脊椎骨节
      p.ellipse(bx, 37 + by, 6.4, 7.0, '#141124');
      p.vline(bx, 30 + by, 14, '#7d8bad');
      p.px(bx, 32 + by, '#cfdcf0');
      p.px(bx, 35 + by, '#cfdcf0');
      p.px(bx, 38 + by, '#cfdcf0');
      p.px(bx, 41 + by, '#cfdcf0');
      // 胸腔深处内燃幽青魂火（置于肋骨之内，透出幽光！）
      p.ellipse(bx, 36 + by, 3.0, 3.6, '#15b8ab', true);
      p.ellipse(bx + 0.5, 35.5 + by, 1.8, 2.2, '#80fff2', true);
      p.px(bx + 1, 35 + by, '#ffffff', true);
      // 4 对立体雪白弧形肋骨跨过魂火前方 + 锁骨肩甲！
      p.hline(bx - 7, 30 + by, 15, '#e8eef7');
      p.hline(bx - 6, 31 + by, 13, '#aab7d4');
      for (let r = 0; r < 4; r++) {
        const ry = 33 + r * 3 + by;
        const w = r === 3 ? 5 : 6;
        p.hline(bx - w, ry, w - 1, '#ced9ed');
        p.hline(bx - w + 1, ry, Math.max(2, w - 3), '#ffffff');
        p.hline(bx + 2, ry, w - 1, '#e6eefc');
        p.hline(bx + 2, ry, Math.max(2, w - 3), '#ffffff');
      }
      // 残破冥铁左/右肩甲
      p.ellipse(bx - 8, 31 + by, 3.5, 2.8, '#3f4a6b');
      p.ellipse(bx - 8, 30.2 + by, 2.3, 1.7, '#7c8db8');
      p.px(bx - 9, 29 + by, '#b8caed');
      p.ellipse(bx + 7, 31 + by, 3.5, 2.8, '#3f4a6b');
      p.ellipse(bx + 7, 30.2 + by, 2.3, 1.7, '#8ea1cf');
      p.px(bx + 7, 29 + by, '#d6e3ff');

      // [4] 精雕冷峻全露苍白骷髅头颅 + 额骨旧裂痕 + 幽青冥火双瞳 + 收窄梯形牙颌！
      p.setPart(SPRITE_PART.NECK_HEAD);
      p.rect(bx - 1, headY + 6, 3, 4, '#a6b3cf');
      // 饱满立体冷骨颅顶（4阶骨色立体光影，去掉瓜皮兜帽！）
      p.ellipse(bx, headY - 2, 7.8, 7.2, '#a3afc9');
      p.ellipse(bx - 0.5, headY - 2.6, 6.8, 6.1, '#dce5f5');
      p.ellipse(bx - 1.5, headY - 4.4, 4.8, 3.4, '#f5f9ff');
      p.hline(bx - 3, headY - 6, 4, '#ffffff');
      // 帅气额角古战裂纹
      p.px(bx - 4, headY - 6, '#5c6685');
      p.px(bx - 3, headY - 5, '#5c6685');
      p.px(bx - 3, headY - 4, '#7d88a8');
      // 收窄梯形下颌骨 + 立体齿槽与雪白牙列
      p.poly(
        [
          [bx - 5, headY + 3],
          [bx + 6, headY + 3],
          [bx + 4, headY + 8],
          [bx - 3, headY + 8],
        ],
        '#c2cde3',
      );
      p.poly(
        [
          [bx - 4, headY + 3],
          [bx + 5, headY + 3],
          [bx + 3, headY + 7],
          [bx - 2, headY + 7],
        ],
        '#eef4fc',
      );
      p.hline(bx - 2, headY + 6, 6, '#1c152e');
      for (const tx of [-2, 0, 2, 4]) {
        p.px(bx + tx, headY + 5, '#ffffff');
      }
      // 深邃黑眼窝 + 熊熊幽青魂火瞳点 + 倒三角鼻腔
      p.setPart(SPRITE_PART.FACE_FEATURES);
      p.rect(bx - 4, headY - 1, 3, 3, '#120d21');
      p.rect(bx + 2, headY - 1, 3, 3, '#120d21');
      p.px(bx + 1, headY + 2, '#1a142e');
      p.px(bx + 1, headY + 3, '#1a142e');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.rect(bx - 3, headY, 2, 2, '#2ef0db', true);
      p.px(bx - 3, headY, '#ffffff', true);
      p.rect(bx + 3, headY, 2, 2, '#2ef0db', true);
      p.px(bx + 3, headY, '#ffffff', true);

      // [5] 左臂：冥铁圆盾（金属镶边 + 幽青符印核心！）
      p.setPart(SPRITE_PART.BACK_ARM);
      p.line(bx - 8, 33 + by, bx - 12, 40 + by, '#c7d2e6', 2);
      p.ellipse(bx - 13, 41 + by, 5.6, 6.8, '#363f5c');
      p.ellipse(bx - 13.5, 40.5 + by, 4.3, 5.4, '#5a6a91');
      p.ellipse(bx - 14, 39.5 + by, 2.2, 3.0, '#8ba0cf');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx - 13, 41 + by, 1.5, 1.8, '#3ef5e0', true);

      // [6] 右骨臂 + 幽青冥火古骨阔剑（厚重剑格 + 凛冽阔刃 + 蓄力高举挥斩！）
      p.setPart(SPRITE_PART.FRONT_ARM);
      let handX = bx + 12;
      let handY = 40 + by - Math.round(pose.armAction * 2);
      if (isAtk && f === 0) {
        handX = bx + 9;
        handY = 26 + by;
      } else if (isAtk && (f === 1 || f === 2)) {
        handX = bx + 16;
        handY = 38 + by;
      }
      p.line(bx + 7, 33 + by, handX, handY, '#dce5f2', 2);
      p.ellipse(bx + 10, Math.round((33 + by + handY) * 0.5), 1.6, 1.6, '#ffffff');

      p.setPart(SPRITE_PART.WEAPON);
      if (isAtk && f === 0) {
        p.line(handX, handY + 2, handX - 5, handY - 18, '#28455c', 5);
        p.line(handX, handY, handX - 5, handY - 18, '#6ef7ea', 3, true);
        p.line(handX, handY - 2, handX - 5, handY - 18, '#ffffff', 1, true);
        p.hline(handX - 4, handY - 1, 8, '#c9d6ed');
      } else if (isAtk && (f === 1 || f === 2)) {
        const tipX = Math.min(59, handX + 18);
        p.line(handX - 2, handY, tipX, handY - 4, '#24465e', 5);
        p.line(handX + 1, handY, tipX, handY - 4, '#5cfce9', 3, true);
        p.line(handX + 2, handY - 1, tipX, handY - 4, '#ffffff', 1, true);
        p.vline(handX + 2, handY - 4, 8, '#d5e2f7');
        drawSlashArc64(p, bx + 13, 36 + by, 17, 16, -1.15, 0.9, '#17bfad', '#75fff0', '#ffffff');
      } else {
        const tipX = handX + 13;
        const tipY = handY - 15;
        p.line(handX - 2, handY + 2, tipX, tipY, '#264359', 5);
        p.line(handX + 1, handY - 1, tipX, tipY, '#59e8db', 3, true);
        p.line(handX + 2, handY - 2, tipX, tipY, '#ebfffd', 1, true);
        p.line(handX - 2, handY - 3, handX + 4, handY + 2, '#d5e2f7', 2);
      }
      p.rect(handX - 1, handY - 1, 3, 2, '#eef4fc');
    },
  },

  // =========================================================================
  // 2. 小恶魔（T1-B · 红魔馆可爱图书馆使魔少女：亮紫边蝠翼 + 贴耳小蝙蝠头翼 + 白领红结黑马甲 + 右前悬浮吸蓝魔导书！）
  // =========================================================================
  creature_koakuma_imp: {
    ...HD_BASE,
    backdropTop: '#1c0b24',
    backdropBottom: '#38153d',
    backdropGlow: '#d95eff',
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 26 : isMove ? 31 : Math.round(29 + pose.leanX * 0.9);
      const by = isMove
        ? [-3, 1, 0, -2][f % 4]
        : Math.round(Math.sin(phase) * 1.4 + pose.breathY - pose.stepLift - 1);
      const sway = isMove ? 2.6 + (f % 2 === 0 ? 0.6 : -0.4) : pose.flutter * 1.6;
      // 飞行时 4 帧大幅扑腾翅膀：0高举展翅 → 1全力下拍推风 → 2低掠滑翔 → 3强劲上扬！
      const flap = isMove ? [-7, 10, 4, -5][f % 4] : Math.round(Math.sin(phase) * 2.4 + pose.flutter);
      const headY = 23 + by;

      // [1] 背后高对比度俏皮紫边小恶魔蝠翼（飞行时大振幅扑腾，下拍帧划出紫青风压微弧！）
      drawGothicBatWings64(p, bx - 1, 36 + by, {
        leftSpan: isMove ? 24 : 22,
        rightSpan: isMove ? 19 : 17,
        height: isMove ? 16 : 14,
        flap,
        boneDark: '#26103b',
        boneLight: '#d18aff',
        webDark: '#471d70',
        webMain: '#7834ba',
        webLight: '#b366ff',
        webGlow: '#ebd1ff',
      });
      if (isMove && f === 1) {
        p.setPart(SPRITE_PART.GLOW_FX);
        p.bezierRibbon([bx - 22, 34 + by], [bx - 24, 41 + by], [bx - 16, 46 + by], 1.6, 0.5, '#d699ff', true);
        p.bezierRibbon([bx + 17, 34 + by], [bx + 19, 41 + by], [bx + 13, 45 + by], 1.4, 0.5, '#9eeeff', true);
      }

      // [2] 鲜亮珊瑚樱红飘逸过肩长后发（优雅微卷尾端，饱满光泽！）
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 9, headY],
          [bx + 10 - sway * 0.4, 42 + by],
          [bx + 5 - sway * 0.6, 48 + by],
          [bx - 9 + sway * 0.7, 49 + by],
          [bx - 13 + sway * 0.8, 40 + by],
        ],
        '#851230',
      );
      p.poly(
        [
          [bx - 8, headY + 1],
          [bx + 7, headY + 1],
          [bx + 8 - sway * 0.3, 41 + by],
          [bx - 10 + sway * 0.6, 42 + by],
        ],
        '#cf294e',
      );
      p.bezierRibbon([bx - 9, headY + 5], [bx - 12 + sway * 0.6, 39 + by], [bx - 13 + sway, 48 + by], 3.8, 1.0, '#9e193b');
      p.bezierRibbon([bx - 8, headY + 6], [bx - 10 + sway * 0.5, 37 + by], [bx - 10 + sway * 0.8, 44 + by], 1.6, 0.6, '#ff6e8e');

      // [3] 双腿（待机/攻击 3/4 斜错步；飞行时悬空微屈后收，不再空中踏步！）
      const legColors = {
        sockShadow: '#d8cfe8',
        sockLight: '#ffffff',
        shoeDark: '#28143d',
        shoeMain: '#522c7a',
        shoeHighlight: '#ff9ec4',
        skinColor: '#ffe4d6',
      };
      if (isMove) {
        drawFlyingTuckedLegs64(p, bx, 51, by, legColors);
      } else {
        drawStaggeredLegs64(p, bx, 51, 65, pose, legColors);
      }

      // [4] 左后臂：雪白泡泡袖 + 2px 软萌少女小臂（优雅轻抬，让左后华丽紫边背翼 100% 舒展净空！）
      p.setPart(SPRITE_PART.BACK_ARM);
      drawPuffSleeve64(p, bx - 6.5, 34.5 + by, '#dcd4ed', '#ffffff', '#3d2459', 'left');
      drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 13, 39 + by);
      p.rect(bx - 15, 37 + by, 3, 2, '#ffe4d6');

      // [5] 红魔馆经典深靛黑紫学院百褶蓬蓬裙 + 淡粉白丝带滚边 + 蓬松白蕾丝衬裙！
      drawCleanAnimeSkirt64(p, {
        waistX: bx + 0.5,
        waistY: 40 + by,
        waistW: 10,
        hemY: 51 + by,
        hemW: 28,
        tiltRight: 1.0,
        archDepth: 2.5,
        waveLobes: 3.5,
        waveAmp: 1.5,
        swayX: -pose.leanX * 0.5 + sway * 0.75,
        colors: {
          deep: '#19122e',
          shadow: '#2b204d',
          main: '#433373',
          light: '#644fa3',
          highlight: '#9078d4',
        },
        trimBand: {
          offsetFromHem: 2.0,
          thickness: 1.3,
          color: '#ffd6e8',
          shadowColor: '#ad7a9b',
        },
        petticoat: {
          peekDepth: 2.2,
          shade: '#cfc3e0',
          main: '#faf5ff',
          highlight: '#ffffff',
        },
      });

      // [6] 经典红魔馆图书司书装：雪白尖翻领衬衫 + 利落修身深黑马甲 + 鲜红立体领结与双垂带！
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#ffffff');
      p.poly([[bx - 4, 34 + by], [bx + 5, 34 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#261a3d');
      p.poly([[bx - 3, 35 + by], [bx + 4, 35 + by], [bx + 4, 39 + by], [bx - 3, 39 + by]], '#3f2e63');
      // 清脆雪白 V 型衬衫领口（一眼亮出学院层次！）
      p.poly([[bx - 4, 31 + by], [bx + 4, 31 + by], [bx + 1, 36 + by], [bx, 36 + by]], '#ffffff');
      p.px(bx - 1, 38 + by, '#ffd973'); // 马甲金扣
      p.px(bx + 2, 38 + by, '#ffd973');
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.hline(bx - 5, 40 + by, 11, '#201433');
      // 胸前鲜艳绯红小领结 + 俏皮双垂带！
      p.rect(bx - 2, 33 + by, 5, 2, '#e61c4b');
      p.px(bx, 33 + by, '#ff9eb5');
      p.line(bx - 1, 35 + by, bx - 2, 38 + by, '#ff3366', 1);
      p.line(bx + 1, 35 + by, bx + 2, 38 + by, '#ff3366', 1);

      // [7] 甜美元气少女脸 + 璀璨红琥珀 4×4 大眼 + 珊瑚艳红大色块柔顺萌发
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#fff6ee',
        skinMain: '#ffe2d1',
        skinShade: '#e8ad99',
        lashColor: '#2e1026',
        irisDark: '#8f1230',
        irisMid: '#eb3154',
        irisGlow: '#ffa478',
        blushColor: '#ff94b0',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#7d102c',
        dark: '#b31d42',
        mid: '#e6355c',
        light: '#ff7090',
        spec: '#ffc7d4',
        leftLockLen: 12,
        rightLockLen: 10,
        fluff: 2,
        sway,
      });

      // [8] 小恶魔灵魂标志：经典优雅漆黑紫「锋利上翘翼钩 + 双拱凹弧锯齿」迷你蝙蝠头翼！
      //     （飞行时随背翼欢快大幅同步扑闪！）
      p.setPart(SPRITE_PART.HEADWEAR);
      const earFlap = isMove ? [-4, 4, 2, -2][f % 4] : Math.round(flap * 0.35);
      // 左迷你蝙蝠头翼
      p.poly(
        [
          [bx - 8, headY - 6],
          [bx - 14, headY - 14 + earFlap],
          [bx - 19, headY - 12 + earFlap],
          [bx - 17, headY - 6 + earFlap],
          [bx - 14, headY - 8 + earFlap],
          [bx - 12, headY - 4 + earFlap],
          [bx - 10, headY - 6],
        ],
        '#1d0a2e',
      );
      p.poly(
        [
          [bx - 9, headY - 6],
          [bx - 14, headY - 12 + earFlap],
          [bx - 17, headY - 10 + earFlap],
          [bx - 16, headY - 7 + earFlap],
          [bx - 12, headY - 6 + earFlap],
        ],
        '#57208a',
      );
      p.line(bx - 8, headY - 6, bx - 14, headY - 14 + earFlap, '#c98aff', 1);
      p.line(bx - 14, headY - 14 + earFlap, bx - 19, headY - 12 + earFlap, '#9e54e6', 1);
      p.px(bx - 14, headY - 14 + earFlap, '#f2dbff');

      // 右迷你蝙蝠头翼
      p.poly(
        [
          [bx + 7, headY - 6],
          [bx + 13, headY - 14 - earFlap],
          [bx + 18, headY - 12 - earFlap],
          [bx + 16, headY - 6 - earFlap],
          [bx + 13, headY - 8 - earFlap],
          [bx + 11, headY - 4 - earFlap],
          [bx + 9, headY - 6],
        ],
        '#1d0a2e',
      );
      p.poly(
        [
          [bx + 8, headY - 6],
          [bx + 13, headY - 12 - earFlap],
          [bx + 16, headY - 10 - earFlap],
          [bx + 15, headY - 7 - earFlap],
          [bx + 11, headY - 6 - earFlap],
        ],
        '#57208a',
      );
      p.line(bx + 7, headY - 6, bx + 13, headY - 14 - earFlap, '#c98aff', 1);
      p.line(bx + 13, headY - 14 - earFlap, bx + 18, headY - 12 - earFlap, '#9e54e6', 1);
      p.px(bx + 13, headY - 14 - earFlap, '#f2dbff');

      // [9] 右前臂泡泡袖 + 2px 软萌小臂凌空御使「翻开的红魔馆紫金吸蓝大魔导书」！
      p.setPart(SPRITE_PART.FRONT_ARM);
      drawPuffSleeve64(p, bx + 6.5, 34.5 + by, '#dcd4ed', '#ffffff', '#3d2459', 'right');
      const handX = isAtk && (f === 1 || f === 2) ? bx + 13 : bx + 11;
      const handY = isAtk && f === 0 ? 33 + by : 37 + by - Math.round(pose.armAction * 2);
      drawSoftChibiArm64(p, bx + 8, 36 + by, handX, handY);
      p.rect(handX - 1, handY - 1, 3, 2, '#ffe2d1');

      // 悬浮于右前净空处的精致敞开「紫金吸蓝魔导书」（始终与脸颊留足清爽距离！）
      const bkX = Math.min(54, handX + (isAtk && (f === 1 || f === 2) ? 9 : 8));
      const bkY = Math.max(36 + by, handY + 1) + Math.round(Math.sin(phase) * 1.2);
      p.setPart(SPRITE_PART.WEAPON);
      // 紫红鎏金厚硬壳封底
      p.poly([[bkX - 7, bkY - 3], [bkX, bkY], [bkX, bkY + 6], [bkX - 7, bkY + 3]], '#691b42');
      p.poly([[bkX + 7, bkY - 3], [bkX, bkY], [bkX, bkY + 6], [bkX + 7, bkY + 3]], '#4d1330');
      // 亮奶油金羊皮双展开页
      p.poly([[bkX - 6, bkY - 4], [bkX, bkY - 1], [bkX, bkY + 4], [bkX - 6, bkY + 1]], '#fff8e0');
      p.poly([[bkX + 6, bkY - 4], [bkX, bkY - 1], [bkX, bkY + 4], [bkX + 6, bkY + 1]], '#f5e2b8');
      // 鎏金书脊与绯紫书页咒文
      p.vline(bkX, bkY - 1, 6, '#ffd659');
      p.hline(bkX - 5, bkY - 1, 3, '#a84dff');
      p.hline(bkX + 2, bkY - 1, 3, '#d93870');
      // 魔导书上方跃动旋转的「青紫吸蓝咒球与符文星芒」
      p.setPart(SPRITE_PART.GLOW_FX);
      const orbY = bkY - 8 + Math.round(Math.cos(phase) * 1.2);
      p.ellipse(bkX, orbY, isAtk ? 3.8 : 2.8, isAtk ? 3.8 : 2.8, '#9e33ff', true);
      p.ellipse(bkX, orbY - 0.4, 1.8, 1.8, '#75f5ff', true);
      p.px(bkX - 1, orbY - 1, '#ffffff', true);
      p.px(bkX - 4, orbY - 3, '#ff80c4', true);
      p.px(bkX + 4, orbY - 2, '#66f2ff', true);
      if (isAtk && (f === 1 || f === 2)) {
        drawSlashArc64(p, bkX - 2, orbY + 3, 14, 14, -1.1, 1.0, '#9929ff', '#66f0ff', '#ffffff');
      }
    },
  },

  // =========================================================================
  // 3. 怨灵（T2-A · 不死飞行幽灵少女：白装束宽袖和服 + 优雅卷曲半透幽灵尾 + 三角纸天冠 + 双鬼火）
  // =========================================================================
  creature_wraith_spirit: {
    ...HD_BASE,
    backdropTop: '#0d152e',
    backdropBottom: '#1c2b59',
    backdropGlow: '#66e6ff',
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      // 怨灵专属飞行形态：移动时化作璀璨「幽蓝紫流光曳尾大灵团」飞掠！
      if (pose.state === 'move') {
        drawWraithOrbFlight64(p, pose);
        return;
      }
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 28 : Math.round(31 + pose.leanX * 0.85);
      // 轻盈漂浮律动
      const floatY = Math.round(Math.sin(phase) * 2.4 + pose.breathY - pose.stepLift);
      const sway = pose.flutter * 1.8;
      const headY = 22 + floatY;

      // [1] 柔顺发光冰蓝长后发
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 9, headY],
          [bx + 10 - sway * 0.5, 42 + floatY],
          [bx + 5 - sway * 0.7, 49 + floatY],
          [bx - 9 + sway * 0.8, 50 + floatY],
          [bx - 13 + sway * 0.8, 41 + floatY],
        ],
        '#29478a',
      );
      p.poly(
        [
          [bx - 8, headY + 1],
          [bx + 7, headY + 1],
          [bx + 8 - sway * 0.4, 41 + floatY],
          [bx - 9 + sway * 0.6, 42 + floatY],
        ],
        '#4c74c9',
      );

      // [2] 优雅盘旋收尖的幽灵幻光尾（彻底告别僵硬双腿，飘逸灵动！）
      p.setPart(SPRITE_PART.SKIRT);
      // 卷曲收尖发光幽蓝尾流
      p.bezierRibbon(
        [bx, 48 + floatY],
        [bx - 3 + sway * 1.1, 57 + floatY],
        [bx - 12 + sway * 1.5, 62 + floatY],
        15,
        1.4,
        '#4a90d9',
      );
      p.bezierRibbon(
        [bx, 48 + floatY],
        [bx - 2 + sway * 1.0, 56 + floatY],
        [bx - 10 + sway * 1.4, 61 + floatY],
        10.5,
        1.0,
        '#91d9ff',
      );
      p.bezierRibbon(
        [bx + 1, 49 + floatY],
        [bx - 1 + sway * 0.9, 55 + floatY],
        [bx - 7 + sway * 1.2, 59 + floatY],
        5.5,
        0.6,
        '#e3f8ff',
      );

      // [3] 宽大飘逸的白装束幽灵振袖（左后袖）
      p.setPart(SPRITE_PART.BACK_ARM);
      p.poly(
        [
          [bx - 5, 33 + floatY],
          [bx - 16, 36 + floatY],
          [bx - 17 + sway * 0.6, 48 + floatY],
          [bx - 8 + sway * 0.4, 46 + floatY],
        ],
        '#b8d0f2',
      );
      p.poly(
        [
          [bx - 5, 33 + floatY],
          [bx - 15, 36 + floatY],
          [bx - 15 + sway * 0.5, 45 + floatY],
          [bx - 8 + sway * 0.3, 44 + floatY],
        ],
        '#eef7ff',
      );
      p.rect(bx - 17, 38 + floatY, 3, 2, '#f2f5ff');

      // [4] 白装束和服下摆（干净波浪轻纱下摆自然融进幽灵光尾！）
      drawCleanAnimeSkirt64(p, {
        waistX: bx + 0.5,
        waistY: 40 + floatY,
        waistW: 11,
        hemY: 50 + floatY,
        hemW: 25,
        tiltRight: 0.5,
        archDepth: 2.2,
        waveLobes: 3,
        waveAmp: 1.5,
        swayX: sway * 0.9,
        colors: {
          deep: '#789ed6',
          shadow: '#b0cef5',
          main: '#dff0ff',
          light: '#f5fbff',
          highlight: '#ffffff',
        },
        trimBand: {
          offsetFromHem: 1.8,
          thickness: 1.2,
          color: '#7852d6',
          shadowColor: '#4c2f99',
        },
      });

      // [5] 优雅左衽和风白装束上衣 + 紫色灵纹腰带与双垂结！
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 31 + floatY], [bx + 6, 31 + floatY], [bx + 6, 40 + floatY], [bx - 5, 40 + floatY]], '#cce0fa');
      p.poly([[bx - 4, 31 + floatY], [bx + 5, 31 + floatY], [bx + 5, 39 + floatY], [bx - 4, 39 + floatY]], '#f7fbff');
      // 清晰交领暗紫滚边
      p.line(bx - 3, 31 + floatY, bx + 2, 36 + floatY, '#7052c4', 1);
      p.line(bx + 4, 31 + floatY, bx + 1, 35 + floatY, '#8b6be6', 1);
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.hline(bx - 6, 40 + floatY, 12, '#623dc2');
      p.hline(bx - 5, 39 + floatY, 10, '#8d66f0');
      drawCuteRibbonBow64(p, bx + 1, 40 + floatY, {
        leftSpan: 4.5,
        rightSpan: 4.0,
        wingHeight: 3.5,
        tailLen: 7,
        sway,
        dark: '#4a289c',
        main: '#8459eb',
        light: '#c2a6ff',
        part: SPRITE_PART.APRON_WAIST,
      });

      // [6] 月光淡紫瓷肌幽灵少女颜 + 璀璨琉璃紫青 4×4 大眼 + 冰蓝大集群萌发
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#fffcff',
        skinMain: '#efe8ff',
        skinShade: '#bdc0e6',
        lashColor: '#1f2352',
        irisDark: '#3632b8',
        irisMid: '#6b66ff',
        irisGlow: '#82f5ff',
        blushColor: '#c49eff',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#243f82',
        dark: '#3b5eb0',
        mid: '#5e88e6',
        light: '#9ec4ff',
        spec: '#ebf5ff',
        leftLockLen: 12,
        rightLockLen: 11,
        fluff: 2,
        sway,
      });

      // [7] 东方经典白色三角幽灵天冠头带（立体褶折 + 紫金细线！）
      p.setPart(SPRITE_PART.HEADWEAR);
      p.hline(bx - 9, headY - 7, 18, '#dce8fa');
      p.hline(bx - 8, headY - 8, 16, '#ffffff');
      p.poly([[bx, headY - 15], [bx - 5, headY - 7], [bx + 5, headY - 7]], '#dce8fa');
      p.poly([[bx, headY - 14], [bx - 3.5, headY - 7], [bx + 3.5, headY - 7]], '#ffffff');
      p.px(bx, headY - 10, '#7df2ff', true);

      // [8] 右前优雅弧摆白振袖伸手唤灵（柔顺垂摆，攻击时放出高速幽紫鬼火冲锋！）
      p.setPart(SPRITE_PART.FRONT_ARM);
      const handX = isAtk && (f === 1 || f === 2) ? bx + 15 : bx + 12;
      const handY = isAtk && f === 0 ? 31 + floatY : 37 + floatY;
      p.poly(
        [
          [bx + 5, 33 + floatY],
          [handX - 1, handY - 1],
          [handX - 2, handY + 5],
          [bx + 8, handY + 8],
          [bx + 5, 40 + floatY],
        ],
        '#cee0fa',
      );
      p.poly(
        [
          [bx + 5, 33 + floatY],
          [handX - 1, handY - 1],
          [handX - 3, handY + 4],
          [bx + 8, handY + 6],
        ],
        '#f2f9ff',
      );
      p.line(bx + 8, handY + 7, handX - 2, handY + 5, '#8d66f0', 1);
      p.rect(handX - 1, handY - 1, 3, 2, '#f0ebff');

      // [9] 环绕漂浮的双色发光鬼火（攻击时紫鬼火疾射前冲轰击光弧！）
      p.setPart(SPRITE_PART.GLOW_FX);
      const wispBob = Math.round(Math.cos(phase) * 2.2);
      // 左青鬼火
      p.ellipse(bx - 21, 29 + floatY + wispBob, 3.0, 3.4, '#1cd6e8', true);
      p.poly([[bx - 21, 22 + floatY + wispBob], [bx - 23, 28 + floatY + wispBob], [bx - 19, 28 + floatY + wispBob]], '#59f5ff', true);
      p.ellipse(bx - 21, 29 + floatY + wispBob, 1.5, 1.8, '#ffffff', true);
      // 右紫鬼火
      if (isAtk && (f === 1 || f === 2)) {
        const dashX = Math.min(58, bx + 27);
        const dashY = 34 + floatY;
        p.bezierRibbon([handX + 3, dashY + 1], [dashX - 6, dashY], [dashX, dashY], 3.8, 1.6, '#9142ff', true);
        p.ellipse(dashX, dashY, 3.4, 3.4, '#b86bff', true);
        p.ellipse(dashX, dashY, 1.8, 1.8, '#ffffff', true);
        drawSlashArc64(p, bx + 15, 35 + floatY, 17, 15, -1.0, 0.9, '#33c9ff', '#b085ff', '#ffffff');
      } else {
        p.ellipse(bx + 20, 33 + floatY - wispBob, 2.8, 3.2, '#9142ff', true);
        p.poly([[bx + 20, 27 + floatY - wispBob], [bx + 18, 32 + floatY - wispBob], [bx + 22, 32 + floatY - wispBob]], '#cf8cff', true);
        p.ellipse(bx + 20, 33 + floatY - wispBob, 1.4, 1.6, '#ffffff', true);
      }
    },
  },

  // =========================================================================
  // 4. 地狱鸦（T2-B · 2×1 飞行三翼裂袭：4层分叉飞羽炽焰大鸦翼 + 飘扬烈焰领巾 + 酷飒狩衣鸦娘 + 双伴飞炽瞳渡鸦！）
  // =========================================================================
  creature_hell_raven: {
    ...HD_BASE,
    backdropTop: '#1c0a14',
    backdropBottom: '#3d1424',
    backdropGlow: '#ff5c33',
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 26 : isMove ? 31 : Math.round(29 + pose.leanX * 0.9);
      const by = isMove
        ? [-4, 1, 0, -3][f % 4]
        : Math.round(Math.sin(phase) * 1.8 + pose.breathY - pose.stepLift - 1);
      // 飞行时 4 帧剧烈扑腾大鸦翼：0高展冲顶 → 1全力下扫拍风甩火星 → 2低掠滑翔 → 3回扬振羽！
      const flap = isMove ? [-7, 11, 4, -5][f % 4] : Math.round(Math.sin(phase) * 3.0 + pose.flutter * 1.4);
      const sway = isMove ? 2.8 + (f % 2 === 0 ? 0.8 : -0.5) : pose.flutter * 1.8;
      const headY = 22 + by;

      // [1] 华丽「浑厚层叠黑羽 · 4 尾分叉炽焰大鸦翼」（翼体饱满连贯，仅外 25% 优雅分叉出焰羽梢！）
      p.setPart(SPRITE_PART.BACK_ACC);
      const drawFeatheredRavenWing = (dir: -1 | 1, span: number, liftY: number) => {
        const shX = bx + dir * 4;
        const shY = 33 + by + Math.round(liftY * 0.35);
        const elbowX = bx + dir * Math.round(span * 0.58);
        const elbowY = 22 + by + liftY + Math.round(flap * 0.65);
        const feathers: Array<[number, number]> = [
          [span, 18 + liftY + flap],
          [Math.round(span * 1.03), 24 + liftY + Math.round(flap * 0.95)],
          [Math.round(span * 0.88), 30 + liftY + Math.round(flap * 0.7)],
          [Math.round(span * 0.65), 36 + liftY + Math.round(flap * 0.45)],
        ];
        // 浑厚饱满的主翼羽面（深靛黑基底 + 清晰蓝紫覆羽层，彻底告别散碎火柴棒！）
        p.poly(
          [
            [shX, shY],
            [elbowX, elbowY],
            [bx + dir * Math.round(span * 0.92), feathers[0][1] + by],
            [bx + dir * Math.round(span * 0.94), feathers[1][1] + by],
            [bx + dir * Math.round(span * 0.82), feathers[2][1] + by],
            [bx + dir * Math.round(span * 0.58), feathers[3][1] + by],
            [bx + dir * Math.round(span * 0.35), 39 + by + Math.round(liftY * 0.4)],
            [shX, shY + 6],
          ],
          '#1b142b',
        );
        // 中层覆羽蓝紫羽面层次（大色块羽层立体光！）
        p.poly(
          [
            [shX + dir * 2, shY + 1],
            [elbowX, elbowY + 1],
            [bx + dir * Math.round(span * 0.76), feathers[1][1] + by - 1],
            [bx + dir * Math.round(span * 0.6), feathers[2][1] + by - 1],
            [shX + dir * 4, shY + 4],
          ],
          '#3a2c5e',
        );
        // 外沿 4 根优雅收尖的弧形飞羽羽尖 + 深红→橙金自然燃焰过渡！
        for (let i = 0; i < feathers.length; i++) {
          const [fxDist, fyBase] = feathers[i];
          const tx = bx + dir * fxDist;
          const ty = fyBase + by;
          const rootX = bx + dir * Math.round(fxDist * 0.65);
          const rootY = Math.round((shY + ty) * 0.52);
          p.bezierRibbon([rootX, rootY], [Math.round((rootX + tx) * 0.52), Math.round((rootY + ty) * 0.52) - 1], [tx, ty], 3.4, 1.0, '#241b3b');
          p.line(Math.round((rootX + tx) * 0.55), Math.round((rootY + ty) * 0.55), tx, ty, '#c92639', 1);
          p.line(Math.round(rootX * 0.25 + tx * 0.75), Math.round(rootY * 0.25 + ty * 0.75), tx, ty, i < 2 ? '#ff5929' : '#ff8c38', 1, true);
          p.px(tx, ty, i < 2 ? '#ffe478' : '#ffb84d', true);
        }
        // 上缘覆羽柔和蓝紫脊光
        p.bezierRibbon([shX + dir, shY], [elbowX, elbowY], [bx + dir * Math.round(span * 0.88), feathers[0][1] + by], 2.0, 0.9, '#6e57a6');
      };
      drawFeatheredRavenWing(-1, isMove ? 26 : 25, isMove ? -1 : -1);
      drawFeatheredRavenWing(1, isMove ? 22 : 21, isMove ? -6 : -7);
      // 飞行猛烈下拍帧（f === 1）：双大鸦翼下方甩出炽红金焰拍风气浪与火星！
      if (isMove && f === 1) {
        p.setPart(SPRITE_PART.GLOW_FX);
        p.bezierRibbon([bx - 24, 33 + by], [bx - 25, 42 + by], [bx - 16, 47 + by], 1.8, 0.5, '#ff5929', true);
        p.bezierRibbon([bx + 19, 30 + by], [bx + 22, 38 + by], [bx + 15, 44 + by], 1.6, 0.5, '#ffb84d', true);
        p.px(bx - 25, 38 + by, '#ffe885', true);
        p.px(bx + 21, 34 + by, '#ffffff', true);
      }

      // 从腰后优雅 S 型轻扬的深红腰带缎尾（彻底避开左手臂，绝不显得像左手拿棍子！）
      p.setPart(SPRITE_PART.BACK_ACC);
      p.bezierRibbon([bx - 5, 42 + by], [bx - 12 + sway * 0.7, 45 + by], [bx - 17 + sway, 49 + by], 3.0, 1.0, '#9e142f');
      p.bezierRibbon([bx - 6, 42 + by], [bx - 12 + sway * 0.7, 45 + by], [bx - 16 + sway, 48 + by], 1.4, 0.6, '#ff3d57');

      // [2] 乌黑带靛紫羽毛光泽的飘逸后发
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 9, headY],
          [bx + 10 - sway * 0.4, 40 + by],
          [bx + 4 - sway * 0.5, 44 + by],
          [bx - 9 + sway * 0.7, 45 + by],
          [bx - 12 + sway * 0.7, 38 + by],
        ],
        '#191429',
      );
      p.poly([[bx - 8, headY + 1], [bx + 7, headY + 1], [bx + 7, 38 + by], [bx - 9, 39 + by]], '#332852');

      // [3] 双腿（待机/攻击 3/4 斜错步；飞行时微屈后收轻盈掠空！）
      const ravenLegColors = {
        sockShadow: '#231b38',
        sockLight: '#47386e',
        shoeDark: '#8c1026',
        shoeMain: '#eb2845',
        shoeHighlight: '#ffd966',
        skinColor: '#ffe3d1',
      };
      if (isMove) {
        drawFlyingTuckedLegs64(p, bx, 51, by, ravenLegColors);
      } else {
        drawStaggeredLegs64(p, bx, 51, 65, pose, ravenLegColors);
      }

      // [4] 左后臂：雪白短袖 + 2px 软萌少女小臂（优雅外展控鸦！）
      p.setPart(SPRITE_PART.BACK_ARM);
      drawPuffSleeve64(p, bx - 6.5, 34.5 + by, '#d6cee3', '#ffffff', '#e62945', 'left');
      drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 13, 39 + by);
      p.rect(bx - 15, 37 + by, 3, 2, '#ffe3d1');

      // [5] 酷飒靛黑紫和风狩衣蓬蓬短裙 + 炽红与鎏金双色裙边 + 雪白蓬纱衬裙！
      drawCleanAnimeSkirt64(p, {
        waistX: bx + 0.5,
        waistY: 40 + by,
        waistW: 10,
        hemY: 50 + by,
        hemW: 27,
        tiltRight: 1.0,
        archDepth: 2.4,
        waveLobes: 3.5,
        waveAmp: 1.6,
        swayX: -pose.leanX * 0.5 + sway * 0.8,
        colors: {
          deep: '#1a142e',
          shadow: '#2c224d',
          main: '#453573',
          light: '#6852a6',
          highlight: '#967fd6',
        },
        trimBand: {
          offsetFromHem: 2.0,
          thickness: 1.4,
          color: '#ff4252',
          shadowColor: '#b31b31',
        },
        petticoat: {
          peekDepth: 2.1,
          shade: '#d4cadb',
          main: '#fff8f5',
          highlight: '#ffffff',
        },
      });

      // [6] 洁白和风交领狩衣上衣 + 鲜红收腰护胸 + 鎏金太阳腰扣
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 31 + by], [bx + 5, 31 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#ffffff');
      p.poly([[bx - 4, 34 + by], [bx + 5, 34 + by], [bx + 5, 40 + by], [bx - 4, 40 + by]], '#cc1e3b');
      p.poly([[bx - 3, 35 + by], [bx + 4, 35 + by], [bx + 4, 39 + by], [bx - 3, 39 + by]], '#f03551');
      // 洁白交领 V 襟
      p.poly([[bx - 4, 31 + by], [bx + 4, 31 + by], [bx + 1, 35 + by], [bx, 35 + by]], '#ffffff');
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.hline(bx - 5, 40 + by, 11, '#ffd452');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx + 1, 37 + by, 1.8, 1.8, '#ff7326', true);
      p.px(bx + 1, 37 + by, '#fff5a6', true);

      // [7] 活泼飒爽鸦娘圆脸 + 炽金赤红 4×4 锐瞳 + 蓝紫光泽黑羽发 + 灵动呆毛 + 鲜红大蝴蝶结！
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#fff6ee',
        skinMain: '#ffe2d1',
        skinShade: '#e8ad99',
        lashColor: '#241029',
        irisDark: '#a61229',
        irisMid: '#f23838',
        irisGlow: '#ffdb59',
        blushColor: '#ff91a6',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#19142b',
        dark: '#2d234a',
        mid: '#4a3b75',
        light: '#7b66b3',
        spec: '#c7b8f0',
        leftLockLen: 11,
        rightLockLen: 10,
        fluff: 2,
        sway,
      });
      // 头顶灵动羽状呆毛
      p.setPart(SPRITE_PART.FRONT_HAIR);
      p.bezierRibbon([bx + 1, headY - 10], [bx + 5, headY - 15], [bx + 8, headY - 13], 1.6, 0.7, '#3c2e61');
      p.px(bx + 4, headY - 14, '#9a84d6');
      // 俏丽鲜红大丝带蝴蝶结
      drawCuteRibbonBow64(p, bx - 7, headY - 9, {
        leftSpan: 5.5,
        rightSpan: 4.5,
        wingHeight: 4.5,
        tailLen: 7,
        sway,
        dark: '#a31029',
        main: '#f22749',
        light: '#ff8599',
        part: SPRITE_PART.HEADWEAR,
      });

      // [8] 右前臂泡泡袖 + 2px 软萌少女小臂燃起炽焰利爪
      p.setPart(SPRITE_PART.FRONT_ARM);
      drawPuffSleeve64(p, bx + 6.5, 34.5 + by, '#d6cee3', '#ffffff', '#e62945', 'right');
      const handX = isAtk && (f === 1 || f === 2) ? bx + 15 : bx + 11;
      const handY = isAtk && f === 0 ? 30 + by : 38 + by;
      drawSoftChibiArm64(p, bx + 8, 36 + by, handX, handY);
      p.rect(handX - 1, handY - 1, 3, 2, '#ffe2d1');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(handX + 3, handY, 2.5, 2.3, '#ff4824', true);
      p.ellipse(handX + 3, handY - 0.4, 1.3, 1.2, '#ffe885', true);
      p.px(handX + 3, handY - 1, '#ffffff', true);

      // [9] 灵魂标志：两只清晰展翅飞翔的「炽瞳小地狱渡鸦」（经典双翼展翅鸟影 + 独立干净净空站位！）
      const drawMiniRaven = (cx: number, cy: number, wingTilt: number) => {
        p.setPart(SPRITE_PART.WEAPON);
        // 后远小翼 + 前近展翅大翼（清晰飞鸟双翼轮廓，绝不再像黑墨团！）
        p.poly([[cx + 1, cy - 1], [cx + 5, cy - 5 + wingTilt], [cx + 4, cy - 1]], '#2b2047');
        p.poly([[cx - 1, cy - 1], [cx - 7, cy - 6 + wingTilt], [cx - 5, cy], [cx - 2, cy + 1]], '#1a132e');
        p.line(cx - 1, cy - 1, cx - 6, cy - 5 + wingTilt, '#6d57a6', 1);
        p.px(cx - 7, cy - 6 + wingTilt, '#ff5938', true);
        // 纤巧鸟尾羽 + 立体黑蓝圆身 + 尖锐亮金鸟喙 + 炽红灵眸！
        p.line(cx - 2, cy + 1, cx - 6, cy + 3, '#2b2047', 2);
        p.ellipse(cx, cy, 3.2, 2.2, '#231a3d');
        p.ellipse(cx + 0.5, cy - 0.5, 2.0, 1.3, '#574487');
        p.poly([[cx + 2, cy - 2], [cx + 6, cy - 1], [cx + 3, cy + 1]], '#ffd252'); // 清晰尖鸟喙
        p.setPart(SPRITE_PART.GLOW_FX);
        p.px(cx + 2, cy - 1, '#ff2e4d', true); // 炽红鸟瞳
      };
      const rBob = Math.round(Math.sin(phase + 1.2) * 1.8);
      const miniFlap = isMove ? [-5, 5, 2, -3][f % 4] : Math.round(flap * 0.35);
      // 左下伴鸦（独立清爽落位在裙摆左下方，飞行时同步剧烈扑翼！）
      drawMiniRaven(Math.max(9, bx - 19), 56 + by + rBob, miniFlap);
      // 右下/右前伴鸦（待机悬于右下净空，攻击时低空疾掠突袭避开右翼与上爪弧！）
      const r2x = Math.min(55, isAtk && (f === 1 || f === 2) ? bx + 25 : bx + 22);
      const r2y = (isAtk && (f === 1 || f === 2) ? 53 : 53) + by - rBob;
      drawMiniRaven(r2x, r2y, -miniFlap);

      // 攻击爆发：三翼裂袭炽红金白三重爪弧！
      if (isAtk && (f === 1 || f === 2)) {
        p.setPart(SPRITE_PART.GLOW_FX);
        drawSlashArc64(p, bx + 16, 35 + by, 19, 17, -1.15, 0.9, '#ff2614', '#ffa833', '#ffffff');
        drawSlashArc64(p, bx + 13, 35 + by, 15, 13, -1.0, 0.8, '#ff4d29', '#ffe066', '#ffffff');
      }
    },
  },

  // =========================================================================
  // 5. 血族眷属（T3-A · 暗系不死飞行 · 100% 徒手猩红三连血爪攻击！优雅银发双马尾夜族少女）
  // =========================================================================
  creature_crimson_vampire: {
    ...HD_BASE,
    backdropTop: '#1c0814',
    backdropBottom: '#3d0e24',
    backdropGlow: '#ff2e58',
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      // 血族眷属专属飞行形态：移动时化身华丽「猩红大血蝠」扑翅疾掠！
      if (pose.state === 'move') {
        drawCrimsonVampireBatFlight64(p, pose);
        return;
      }
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 27 : Math.round(30 + pose.leanX * 0.9);
      const by = Math.round(Math.sin(phase) * 1.8 + pose.breathY - pose.stepLift - 1);
      const flap = Math.round(Math.sin(phase) * 2.8 + pose.flutter * 1.2);
      const sway = pose.flutter * 1.8;
      const headY = 23 + by;

      // [1] 华丽暗金黑红夜族恶魔蝠翼（外展清晰可见，不被银白双马尾遮挡！）
      drawGothicBatWings64(p, bx - 1, 35 + by, {
        leftSpan: 24,
        rightSpan: 18,
        height: 16,
        flap,
        boneDark: '#1c0717',
        boneLight: '#b31b46',
        webDark: '#3b0921',
        webMain: '#8c143c',
        webLight: '#c92659',
      });

      // [2] 优雅飘逸的银白双马尾（左右两束曲线大马尾，洁净高贵！）
      p.setPart(SPRITE_PART.BACK_HAIR);
      // 左大马尾
      p.bezierRibbon([bx - 10, headY - 3], [bx - 17 + sway * 0.6, headY + 10], [bx - 15 + sway * 1.2, 46 + by], 6.5, 1.5, '#8a8ca8');
      p.bezierRibbon([bx - 10, headY - 3], [bx - 16 + sway * 0.6, headY + 9], [bx - 14 + sway * 1.1, 44 + by], 4.4, 1.0, '#e3e6f5');
      p.bezierRibbon([bx - 11, headY], [bx - 15 + sway * 0.5, headY + 7], [bx - 14 + sway * 0.8, 37 + by], 2.0, 0.6, '#ffffff');
      // 右大马尾
      p.bezierRibbon([bx + 9, headY - 3], [bx + 15 - sway * 0.5, headY + 10], [bx + 14 - sway, 45 + by], 5.6, 1.4, '#8a8ca8');
      p.bezierRibbon([bx + 9, headY - 3], [bx + 14 - sway * 0.5, headY + 9], [bx + 13 - sway * 0.9, 43 + by], 3.8, 0.9, '#eef0fa');

      // [3] 3/4 斜错步雪白过膝长袜 + 绯红哥特高跟小鞋
      drawStaggeredLegs64(p, bx, 51, 65, pose, {
        sockShadow: '#d4cee3',
        sockLight: '#ffffff',
        shoeDark: '#7a0a24',
        shoeMain: '#d41740',
        shoeHighlight: '#ffe085',
      });

      // [4] 左后臂：雪白泡泡袖 + 2px 软萌小臂（悬停一只迷你血蝠陪伴！）
      p.setPart(SPRITE_PART.BACK_ARM);
      drawPuffSleeve64(p, bx - 6.5, 34.5 + by, '#d6cce6', '#ffffff', '#b81135', 'left');
      drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 13, 39 + by, '#fff4f0', '#ebc2bd');
      p.rect(bx - 15, 37 + by, 3, 2, '#fff4f0');
      // 身侧左上空旷处伴飞迷你猩红小血蝠（不与发饰和蝠翼粘连！）
      p.setPart(SPRITE_PART.GLOW_FX);
      const batY = 17 + by + Math.round(Math.sin(phase + 1) * 2.2);
      p.poly([[bx - 21, batY], [bx - 25, batY - 3], [bx - 23, batY + 2]], '#cc143c', true);
      p.poly([[bx - 19, batY], [bx - 15, batY - 3], [bx - 17, batY + 2]], '#cc143c', true);
      p.ellipse(bx - 20, batY, 1.6, 1.5, '#ff3366', true);
      p.px(bx - 20, batY, '#ffffff', true);

      // [5] 高贵深绯红哥特丝绒大蓬裙 + 鎏金弯弧花边 + 探出白纱衬裙！
      drawCleanAnimeSkirt64(p, {
        waistX: bx + 0.5,
        waistY: 40 + by,
        waistW: 10,
        hemY: 51 + by,
        hemW: 30,
        tiltRight: 1.0,
        archDepth: 2.6,
        waveLobes: 3.5,
        waveAmp: 1.6,
        swayX: -pose.leanX * 0.5 + sway * 0.85,
        colors: {
          deep: '#5c0920',
          shadow: '#941133',
          main: '#c91c47',
          light: '#eb3864',
          highlight: '#ff7a9b',
        },
        trimBand: {
          offsetFromHem: 2.1,
          thickness: 1.3,
          color: '#ffd966',
          shadowColor: '#b88828',
        },
        petticoat: {
          peekDepth: 2.2,
          shade: '#d4c3d9',
          main: '#fff2f7',
          highlight: '#ffffff',
        },
      });

      // [6] 黑丝绒束腰马甲 + 雪白蕾丝高领 + 绯红十字领带
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#241429');
      p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#3b2142');
      p.poly([[bx - 3, 31 + by], [bx + 4, 31 + by], [bx + 2, 36 + by], [bx, 36 + by]], '#ffffff');
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.hline(bx - 5, 40 + by, 11, '#e61c4b');
      p.px(bx + 1, 35 + by, '#ff3366', true);
      p.px(bx + 1, 37 + by, '#ffd966', true);

      // [7] 苍白瓷肌傲娇夜族颜 + 赤红宝石 4×4 大眼 + 小虎牙 + 银白柔顺发冠 + 双马尾玫瑰红结！
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#ffffff',
        skinMain: '#fff0eb',
        skinShade: '#e3b8b8',
        lashColor: '#290d24',
        irisDark: '#8a0826',
        irisMid: '#e61744',
        irisGlow: '#ff85a3',
        blushColor: '#ff96b3',
        vampireFang: true,
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#7c7e9e',
        dark: '#adb0cc',
        mid: '#dadcf0',
        light: '#f5f6ff',
        spec: '#ffffff',
        leftLockLen: 11,
        rightLockLen: 10,
        fluff: 2,
        sway,
      });
      // 双马尾绑带绯红玫瑰蝴蝶结
      drawCuteRibbonBow64(p, bx - 10, headY - 4, {
        leftSpan: 4,
        rightSpan: 3.5,
        wingHeight: 3.5,
        tailLen: 5,
        sway,
        dark: '#8f0a29',
        main: '#eb1c4b',
        light: '#ff7596',
        part: SPRITE_PART.HEADWEAR,
      });
      drawCuteRibbonBow64(p, bx + 9, headY - 4, {
        leftSpan: 3.5,
        rightSpan: 4,
        wingHeight: 3.5,
        tailLen: 5,
        sway: -sway,
        dark: '#8f0a29',
        main: '#eb1c4b',
        light: '#ff7596',
        part: SPRITE_PART.HEADWEAR,
      });

      // [8] 右前臂：严格【徒手猩红血爪攻击】（蓄力举爪 → 扑击撕出三条平行璀璨血爪斩痕！）
      p.setPart(SPRITE_PART.FRONT_ARM);
      drawPuffSleeve64(p, bx + 6.5, 34.5 + by, '#d6cce6', '#ffffff', '#b81135', 'right');
      if (isAtk && f === 0) {
        drawSoftChibiArm64(p, bx + 8, 35 + by, bx + 11, 28 + by, '#fff0eb', '#e3b8b8');
        p.rect(bx + 10, 26 + by, 3, 2, '#fff0eb');
        p.setPart(SPRITE_PART.GLOW_FX);
        p.line(bx + 12, 26 + by, bx + 16, 23 + by, '#ff2658', 1, true);
        p.line(bx + 13, 27 + by, bx + 17, 25 + by, '#ff4d7a', 1, true);
      } else if (isAtk && (f === 1 || f === 2)) {
        // 徒手猛扑挥爪：与发饰/双马尾彻底分离的三道独立平行弯弧猩红血爪撕裂痕！
        drawSoftChibiArm64(p, bx + 8, 36 + by, bx + 16, 37 + by, '#fff0eb', '#e3b8b8');
        p.rect(bx + 15, 36 + by, 3, 2, '#fff0eb');
        p.setPart(SPRITE_PART.GLOW_FX);
        for (const k of [-1, 0, 1]) {
          const sx = bx + 22 + k * 3;
          const sy = 26 + by + k * 2;
          const cx = Math.min(58, bx + 29 + k * 3);
          const cy = 36 + by + k * 2;
          const ex = Math.min(58, bx + 23 + k * 3);
          const ey = 47 + by + k * 2;
          p.bezierRibbon([sx, sy], [cx, cy], [ex, ey], 2.2, 0.7, '#ff1749', true);
          p.bezierRibbon([sx + 1, sy + 1], [cx - 1, cy], [ex, ey - 1], 1.0, 0.4, '#ffe6ef', true);
        }
      } else {
        // 待机：优雅轻抬纤纤玉手，指尖泛起丝缕绯红血爪微光！
        const handX = bx + 12;
        const handY = 38 + by - Math.round(pose.armAction * 2);
        drawSoftChibiArm64(p, bx + 8, 36 + by, handX, handY, '#fff0eb', '#e3b8b8');
        p.rect(handX - 1, handY - 1, 3, 2, '#fff0eb');
        p.setPart(SPRITE_PART.GLOW_FX);
        p.px(handX + 2, handY - 2, '#ff3366', true);
        p.px(handX + 3, handY, '#ff5983', true);
        p.px(handX + 2, handY + 1, '#ff3366', true);
      }
    },
  },

  // =========================================================================
  // 6. 毒瘴妖（T3-B · 铃兰瘴毒远程射手：梅蒂欣风金发紫帽铃兰少女 + 翠绿围裙裙 + 剧毒瘴球）
  // =========================================================================
  creature_miasma_venom: {
    ...HD_BASE,
    backdropTop: '#0d1f18',
    backdropBottom: '#1c3b2c',
    backdropGlow: '#52ff7d',
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 28 : Math.round(31 + pose.leanX * 0.9);
      const by = Math.round(pose.breathY * 1.2 - pose.stepLift * 1.2);
      const sway = pose.flutter * 1.6;
      const headY = 23 + by;

      // [1] 温暖蜂蜜金卷曲后发
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 9, headY],
          [bx + 10 - sway * 0.4, 41 + by],
          [bx + 6 - sway * 0.5, 45 + by],
          [bx - 8 + sway * 0.6, 46 + by],
          [bx - 12 + sway * 0.7, 40 + by],
        ],
        '#9c6b1c',
      );
      p.poly(
        [
          [bx - 8, headY + 1],
          [bx + 7, headY + 1],
          [bx + 8 - sway * 0.3, 39 + by],
          [bx - 9 + sway * 0.5, 40 + by],
        ],
        '#e3a83b',
      );

      // [2] 3/4 斜错步雪白袜 + 紫晶小皮鞋
      drawStaggeredLegs64(p, bx, 51, 65, pose, {
        sockShadow: '#d8cfe8',
        sockLight: '#ffffff',
        shoeDark: '#4a1d7a',
        shoeMain: '#843bd6',
        shoeHighlight: '#b0ff9e',
      });

      // [3] 左后臂：柔紫泡泡袖 + 2px 软萌少女小臂（挂小毒药瓶）
      p.setPart(SPRITE_PART.BACK_ARM);
      drawPuffSleeve64(p, bx - 6.5, 34.5 + by, '#6a38a8', '#a366eb', '#ffffff', 'left');
      drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 12, 40 + by);
      p.rect(bx - 14, 39 + by, 3, 2, '#ffe1cf');
      // 悬在左手边的精致玻璃剧毒烧瓶（木塞 + 透明玻璃轮廓 + 翠绿发光毒液 + 玻璃高光！）
      p.setPart(SPRITE_PART.WEAPON);
      p.rect(bx - 16, 40 + by, 3, 2, '#c9935b'); // 木瓶塞
      p.ellipse(bx - 15, 44 + by, 3.2, 3.4, '#bfe8d8'); // 玻璃瓶身
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx - 15, 45 + by, 2.2, 2.0, '#24d957', true); // 半满翠绿毒液
      p.px(bx - 16, 44 + by, '#b8ffcc', true);
      p.setPart(SPRITE_PART.WEAPON);
      p.px(bx - 17, 43 + by, '#ffffff'); // 玻璃壁高光

      // [4] 明艳翠绿紫边洋装蓬蓬裙 + 洁白蕾丝前围裙！
      drawCleanAnimeSkirt64(p, {
        waistX: bx + 0.5,
        waistY: 40 + by,
        waistW: 10,
        hemY: 51 + by,
        hemW: 29,
        tiltRight: 1.0,
        archDepth: 2.5,
        waveLobes: 3.5,
        waveAmp: 1.6,
        swayX: -pose.leanX * 0.5 + sway * 0.8,
        colors: {
          deep: '#125934',
          shadow: '#1e8a4e',
          main: '#33bd68',
          light: '#5ee68c',
          highlight: '#a6ffbe',
        },
        trimBand: {
          offsetFromHem: 2.0,
          thickness: 1.4,
          color: '#a352f2',
          shadowColor: '#6624a8',
        },
        petticoat: {
          peekDepth: 2.1,
          shade: '#d4cce6',
          main: '#f8fff9',
          highlight: '#ffffff',
        },
      });
      // 洁白圆弧小围裙（落在 APRON_WAIST 层，自然与绿裙拉出清脆层次！）
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.poly(
        [
          [bx - 4, 40 + by],
          [bx + 5, 40 + by],
          [bx + 7, 48 + by],
          [bx + 1, 50 + by],
          [bx - 5, 48 + by],
        ],
        '#e3dcf0',
      );
      p.poly(
        [
          [bx - 3, 40 + by],
          [bx + 4, 40 + by],
          [bx + 5, 47 + by],
          [bx + 1, 49 + by],
          [bx - 4, 47 + by],
        ],
        '#ffffff',
      );

      // [5] 紫翡小马甲 + 翠绿宝石胸扣 + 白蕾丝领
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#58288c');
      p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#8342c7');
      p.hline(bx - 4, 32 + by, 8, '#ffffff');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx + 1, 36 + by, 1.8, 1.8, '#42f26b', true);
      p.px(bx + 1, 35 + by, '#ffffff', true);

      // [6] 甜美圆脸 + 翡翠碧绿 4×4 宝石大眼 + 蜂蜜金蓬松大块萌发
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#fff6ee',
        skinMain: '#ffe2d1',
        skinShade: '#e8ad99',
        lashColor: '#291538',
        irisDark: '#127341',
        irisMid: '#29cc68',
        irisGlow: '#a6ff9e',
        blushColor: '#ff96b0',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#996418',
        dark: '#cc8f29',
        mid: '#f5be49',
        light: '#ffe07d',
        spec: '#fff8cc',
        leftLockLen: 12,
        rightLockLen: 10,
        fluff: 1,
        bobFlare: true,
        sway,
      });

      // [7] 蓬松歪戴四阶丝绒紫贝雷帽（放射抓褶 + 绒蒂 + 精致细翠绸带 + 垂吊铃兰双白花！）
      p.setPart(SPRITE_PART.HEADWEAR);
      const hatCx = bx - 1.0;
      const hatY = headY - 9.5;
      // 饱满蓬松帽冠（四阶细腻紫丝绒）
      p.ellipse(hatCx, hatY - 1.8, 10.6, 5.6, '#421b6e');
      p.ellipse(hatCx - 0.6, hatY - 2.6, 9.2, 4.4, '#793bc2');
      p.ellipse(hatCx - 1.8, hatY - 3.8, 6.2, 2.8, '#aa6ef2');
      p.ellipse(hatCx - 2.8, hatY - 4.7, 3.4, 1.4, '#e2c7ff');
      // 3 道放射微褶线（丝绸垂坠质感！）
      p.line(hatCx - 1, hatY - 6, hatCx - 7, hatY - 1, '#582594', 1);
      p.line(hatCx, hatY - 6, hatCx + 1, hatY - 1, '#582594', 1);
      p.line(hatCx + 1, hatY - 6, hatCx + 7, hatY - 1, '#582594', 1);
      // 帽顶俏皮紫绒小蒂
      p.rect(hatCx - 1, hatY - 8, 2, 2, '#582594');
      p.px(hatCx - 1, hatY - 8, '#d4b3ff');
      // 精致 1px 翡翠细绸帽带 + 右侧垂吊双洁白铃兰钟花与绿叶！
      p.bezierRibbon([hatCx - 9, hatY + 1.2], [hatCx, hatY + 0.2], [hatCx + 9, hatY + 1.2], 1.1, 1.1, '#26b856');
      p.line(hatCx + 5, hatY - 2, hatCx + 9, hatY + 2, '#28bd5b', 1);
      p.px(hatCx + 4, hatY - 2, '#6eff9e');
      p.ellipse(hatCx + 7, hatY - 1, 2.0, 2.0, '#ffffff');
      p.px(hatCx + 7, hatY, '#c9f5d8');
      p.ellipse(hatCx + 10, hatY + 1.5, 2.0, 2.0, '#f5fff8');
      p.px(hatCx + 10, hatY + 2, '#b8f0cb');

      // [8] 右前臂泡泡袖 + 2px 软萌小臂投射沸腾翠绿剧毒瘴弹！
      p.setPart(SPRITE_PART.FRONT_ARM);
      drawPuffSleeve64(p, bx + 6.5, 34.5 + by, '#6a38a8', '#a366eb', '#ffffff', 'right');
      const handX = isAtk && (f === 1 || f === 2) ? bx + 15 : bx + 12;
      const handY = isAtk && f === 0 ? 30 + by : 37 + by - Math.round(pose.armAction * 2);
      drawSoftChibiArm64(p, bx + 8, 36 + by, handX, handY);
      p.rect(handX - 1, handY - 1, 3, 2, '#ffe2d1');
      // 沸腾碧绿紫环毒瘴魔球
      p.setPart(SPRITE_PART.GLOW_FX);
      const orbX = handX + 5;
      const orbY = handY - 1 + Math.round(Math.sin(phase) * 1.5);
      p.ellipse(orbX, orbY, isAtk ? 4.4 : 3.4, isAtk ? 4.4 : 3.4, '#24d957', true);
      p.ellipse(orbX, orbY - 0.5, 2.1, 2.1, '#a6ffb8', true);
      p.px(orbX - 1, orbY - 1, '#ffffff', true);
      p.px(orbX + 4, orbY - 4, '#c270ff', true);
      p.px(orbX - 2, orbY - 5, '#59ff88', true);
      if (isAtk && (f === 1 || f === 2)) {
        drawSlashArc64(p, bx + 16, 35 + by, 17, 15, -0.95, 0.9, '#24d957', '#c270ff', '#e8ffed');
      }
    },
  },

  // =========================================================================
  // 7. 骸骨巨龙（T4-A · 2×2 飞行 · 霸气凶猛骸骨巨龙王：双翼遮天 + 4阶立体骸骨 + 强健龙爪 + 冥焰龙息！）
  // =========================================================================
  creature_bone_dragon: {
    ...HD_BASE,
    backdropTop: '#120b24',
    backdropBottom: '#291547',
    backdropGlow: '#9e52ff',
    avatarCrop: { x: 20, y: 4, size: 36 },
    portraitCrop: { x: 2, y: 2, w: 60, h: 66 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 27 : isMove ? 30 : Math.round(29 + pose.leanX * 0.8);
      const by = isMove
        ? [-4, 2, 0, -2][f % 4]
        : Math.round(Math.sin(phase) * 2.0 + pose.breathY - pose.stepLift);
      // 骸骨巨龙飞行扑腾双巨翼：0遮天高扬 → 1雷霆下拍掀冥焰气流 → 2展开滑翔 → 3强劲回提！
      const flap = isMove ? [-6, 13, 5, -4][f % 4] : Math.round(Math.sin(phase) * 3.4 + pose.flutter * 1.4);
      const boneDeep = '#6b7296';
      const boneMid = '#a4b0d1';
      const boneMain = '#dce4f5';
      const boneHi = '#ffffff';

      // [0] 右后方透视副骨翼（避开龙角区域，飞行时与主翼同步巨幅扑腾！）
      p.setPart(SPRITE_PART.BACK_ACC);
      const rwTopX = bx - 5;
      const rwTopY = Math.max(5, 5 + by + Math.round(flap * 0.72));
      const rwTipX = bx - 14;
      const rwTipY = Math.max(6, 13 + by + Math.round(flap * 0.8));
      p.poly(
        [
          [bx + 1, 27 + by],
          [rwTopX, rwTopY],
          [rwTipX, rwTipY],
          [bx - 8, 22 + by + Math.round(flap * 0.35)],
          [bx + 2, 30 + by],
        ],
        '#29104a',
      );
      p.poly(
        [
          [bx, 26 + by],
          [rwTopX - 1, rwTopY + 3],
          [rwTipX + 2, rwTipY + 1],
          [bx - 6, 22 + by + Math.round(flap * 0.3)],
        ],
        '#53248c',
      );
      p.line(bx + 1, 27 + by, rwTopX, rwTopY, boneMid, 2);
      p.line(rwTopX, rwTopY, rwTipX, rwTipY, boneDeep, 2);

      // [1] 左前方遮天撕裂紫焰骸骨巨翼（4阶立体骨指 + 撕裂紫焰翼膜 + 翼肘骨爪！）
      const wTopX = Math.max(4, bx - 22);
      const wTopY = Math.max(6, 7 + by + flap);
      const wMidX = Math.max(3, bx - 25);
      const wMidY = Math.min(52, 25 + by + Math.round(flap * 1.05));
      const wBotX = bx - 15;
      const wBotY = Math.min(56, 39 + by + Math.round(flap * 0.65));
      p.poly(
        [
          [bx - 4, 28 + by],
          [wTopX, wTopY],
          [wMidX, wMidY],
          [wMidX + 6, wMidY - 3],
          [wBotX, wBotY],
          [wBotX + 6, wBotY - 5],
          [bx - 5, 38 + by],
        ],
        '#36155e',
      );
      p.poly(
        [
          [bx - 5, 28 + by],
          [wTopX + 3, wTopY + 4],
          [wMidX + 4, wMidY - 4],
          [wBotX + 4, wBotY - 5],
        ],
        '#7534c7',
      );
      p.setPart(SPRITE_PART.GLOW_FX);
      p.line(wTopX + 3, wTopY + 5, wMidX + 4, wMidY - 3, '#c480ff', 1, true);
      p.line(wTopX + 4, wTopY + 7, wBotX + 3, wBotY - 4, '#9b52ff', 1, true);
      // 巨龙下拍爆发帧（f === 1）：撕裂巨翼下方掀起紫青冥焰强劲下洗气流！
      if (isMove && f === 1) {
        p.bezierRibbon([wMidX + 1, wMidY + 3], [wBotX - 2, wBotY + 6], [bx - 4, wBotY + 3], 2.2, 0.6, '#9b52ff', true);
        p.bezierRibbon([wMidX + 3, wMidY + 2], [wBotX, wBotY + 5], [bx - 6, wBotY + 2], 1.0, 0.4, '#66f5ff', true);
      }
      // 粗壮立体翼骨主脊、翼肘骨棘与三根指骨
      p.setPart(SPRITE_PART.BACK_ACC);
      p.bezierRibbon([bx - 3, 29 + by], [bx - 13, Math.max(5, 16 + by + flap * 0.72)], [wTopX, wTopY], 4.2, 2.2, boneMid);
      p.bezierRibbon([bx - 3, 28 + by], [bx - 13, Math.max(4, 15 + by + flap * 0.72)], [wTopX, wTopY], 2.2, 1.1, boneMain);
      p.line(bx - 13, Math.max(4, 15 + by + Math.round(flap * 0.72)), wTopX, wTopY, boneHi, 1);
      // 翼顶凶悍骨棘爪
      p.poly([[wTopX, wTopY], [wTopX - 2, Math.max(2, wTopY - 4)], [wTopX + 3, Math.max(3, wTopY - 1)]], boneHi);
      p.line(wTopX, wTopY, wMidX, wMidY, boneMain, 2);
      p.line(wTopX + 2, wTopY + 2, wBotX, wBotY, boneMid, 2);
      p.line(bx - 12, Math.max(6, 18 + by + Math.round(flap * 0.7)), bx - 10, 36 + by, boneMid, 2);

      // [2] 蜿蜒长棘骨尾（4阶骨节 + 背棘 + 紫焰骨刃尾尖！）
      p.setPart(SPRITE_PART.BACK_ACC);
      const tailWave = isMove ? Math.round(flap * 0.55) : Math.round(flap * 0.4);
      p.bezierRibbon([bx - 8, 46 + by], [bx - 21, 55 + by], [bx - 26, 44 + by + tailWave], 5.0, 1.6, boneDeep);
      p.bezierRibbon([bx - 8, 45 + by], [bx - 20, 53 + by], [bx - 25, 43 + by + tailWave], 3.0, 1.0, boneMain);
      p.bezierRibbon([bx - 8, 44 + by], [bx - 19, 52 + by], [bx - 24, 42 + by + tailWave], 1.2, 0.5, boneHi);
      // 尾刺尖端冥紫骨刃
      const tailTipY = 44 + by + tailWave;
      p.poly([[bx - 26, tailTipY], [bx - 29, tailTipY - 5], [bx - 22, tailTipY - 3]], '#9e52ff', true);
      p.px(bx - 27, tailTipY - 3, '#e8ccff', true);

      // [3] 强壮厚重骸骨后肢（待机踩地霸气；飞行时向后屈收掠空不再空中走路！）
      p.setPart(SPRITE_PART.LEGS);
      if (isMove) {
        p.line(bx - 2, 46 + by, bx - 4, 54 + by, boneDeep, 4);
        p.line(bx - 4, 54 + by, bx + 2, 57 + by, boneMid, 3);
        p.bezierRibbon([bx - 9, 45 + by], [bx - 16, 51 + by], [bx - 14, 55 + by], 5.0, 3.4, boneMid);
        p.bezierRibbon([bx - 9, 44 + by], [bx - 15, 50 + by], [bx - 14, 54 + by], 2.6, 1.8, boneMain);
        p.ellipse(bx - 15, 53 + by, 2.6, 2.2, boneHi);
        p.line(bx - 14, 54 + by, bx - 9, 59 + by, boneMain, 4);
        p.line(bx - 9, 59 + by, bx - 4, 60 + by, boneHi, 2);
        p.line(bx - 9, 59 + by, bx - 6, 62 + by, boneHi, 1);
        p.px(bx - 4, 60 + by, '#c480ff', true);
      } else {
        const stride = Math.round(pose.stride * 3.0);
        // 远侧后腿（暗骨立体纵深）
        p.line(bx - 2, 46 + by, bx + 4 + stride, 54, boneDeep, 4);
        p.line(bx + 4 + stride, 54, bx + 1 + stride, 62, boneMid, 3);
        p.poly([[bx - 1 + stride, 62], [bx + 7 + stride, 62], [bx + 9 + stride, 64], [bx + 1 + stride, 64]], boneMid);
        // 近侧强健霸王龙后骨腿（粗大腿 + 突出膝骨节 + 肌肉感胫骨 + 3 趾锋利弯爪！）
        p.bezierRibbon([bx - 9, 45 + by], [bx - 15 - stride, 52], [bx - 12 - stride, 56], 5.2, 3.6, boneMid);
        p.bezierRibbon([bx - 9, 44 + by], [bx - 14 - stride, 51], [bx - 12 - stride, 55], 2.8, 2.0, boneMain);
        p.ellipse(bx - 13 - stride, 54, 2.8, 2.4, boneHi); // 膝关节球
        p.line(bx - 12 - stride, 55, bx - 7 - stride, 62, boneMid, 4);
        p.line(bx - 11 - stride, 55, bx - 7 - stride, 61, boneHi, 2);
        // 3 趾抓地巨龙骨爪
        p.poly([[bx - 11 - stride, 62], [bx - 3 - stride, 61], [bx + 1 - stride, 64], [bx - 10 - stride, 64]], boneMain);
        p.hline(bx - 9 - stride, 62, 8, boneHi);
        p.px(bx + 1 - stride, 64, '#b870ff', true);
        p.px(bx - 3 - stride, 64, '#b870ff', true);
      }

      // [4] 巨型拱起脊椎 + 镂空燃魂巨胸肋 + 熊熊紫青冥焰龙魂核！
      p.setPart(SPRITE_PART.TORSO);
      p.ellipse(bx - 2, 39 + by, 10.6, 8.8, '#140b24'); // 深黑胸腔底
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx, 39 + by, 5.2, 4.6, '#7a2eff', true);
      p.ellipse(bx + 1, 38 + by, 2.8, 2.5, '#59f5ff', true);
      p.px(bx + 1, 38 + by, '#ffffff', true);
      // 粗壮拱背龙脊骨 + 锯齿背脊骨棘！
      p.setPart(SPRITE_PART.TORSO);
      p.bezierRibbon([bx - 11, 46 + by], [bx - 2, 30 + by], [bx + 8, 27 + by], 5.6, 4.6, boneDeep);
      p.bezierRibbon([bx - 10, 45 + by], [bx - 2, 29 + by], [bx + 8, 26 + by], 3.4, 2.8, boneMain);
      p.bezierRibbon([bx - 9, 44 + by], [bx - 2, 28 + by], [bx + 8, 25 + by], 1.4, 1.2, boneHi);
      // 脊背骨棘刺
      for (const [sx, sy] of [[bx - 7, 36], [bx - 3, 30], [bx + 1, 27], [bx + 5, 25]]) {
        p.poly([[sx, sy + by], [sx - 2, sy - 4 + by], [sx + 2, sy - 1 + by]], boneMain);
        p.px(sx - 2, sy - 3 + by, boneHi);
      }
      // 5 根 2 阶立体弯曲象牙巨肋跨过龙魂核心！
      for (let i = 0; i < 5; i++) {
        const rx = bx - 8 + i * 3.5;
        const ry = 35 + by + (i < 2 ? 2 : 0);
        p.bezierRibbon([rx, ry - 3], [rx - 1, ry + 5], [rx + 4, ry + 11], 2.8, 1.4, boneMid);
        p.bezierRibbon([rx + 0.5, ry - 3], [rx, ry + 4], [rx + 3.5, ry + 9], 1.3, 0.7, boneHi);
      }

      // [4.5] 凶猛胸前蓄力高抬的前龙骨爪（告别呆板支撑棍，霸气威慑抓握！）
      p.setPart(SPRITE_PART.FRONT_ARM);
      const clawLift = isAtk && (f === 1 || f === 2) ? -3 : 0;
      const clawReach = isAtk && (f === 1 || f === 2) ? 4 : 0;
      const elbowX = bx + 4;
      const elbowY = 44 + by + clawLift;
      const wristX = bx + 11 + clawReach;
      const wristY = 46 + by + clawLift;
      p.line(bx + 5, 36 + by, elbowX, elbowY, boneMid, 3);
      p.line(bx + 6, 36 + by, elbowX + 1, elbowY, boneHi, 1);
      p.line(elbowX, elbowY, wristX, wristY, boneMain, 3);
      p.line(elbowX + 1, elbowY - 1, wristX, wristY - 1, boneHi, 1);
      // 三根寒光锋利弯钩骨爪指！
      p.line(wristX, wristY - 1, wristX + 4, wristY - 3, boneHi, 1);
      p.line(wristX, wristY, wristX + 5, wristY + 1, boneHi, 1);
      p.line(wristX, wristY + 1, wristX + 3, wristY + 4, boneMain, 1);
      p.px(wristX + 5, wristY + 1, '#c480ff', true);

      // [5] 弯曲强健 S 形骨颈 + 凶悍棱角龙骨巨首 + 双对镰刀龙角 + 错落长獠牙！
      p.setPart(SPRITE_PART.NECK_HEAD);
      const headX = bx + 11 + (isAtk && (f === 1 || f === 2) ? 2 : 0);
      const headY = 20 + by + (isAtk && f === 0 ? -3 : 0);
      p.bezierRibbon([bx + 5, 30 + by], [bx + 9, 27 + by], [headX - 3, headY + 2], 5.2, 4.0, boneDeep);
      p.bezierRibbon([bx + 6, 29 + by], [bx + 9, 26 + by], [headX - 2, headY + 1], 3.0, 2.2, boneMain);
      p.bezierRibbon([bx + 6, 28 + by], [bx + 9, 25 + by], [headX - 2, headY], 1.2, 1.0, boneHi);

      // 两对后弯霸气立体象牙镰刀龙角！
      p.setPart(SPRITE_PART.HEADWEAR);
      p.bezierRibbon([headX - 4, headY - 4], [headX - 10, headY - 13], [headX - 17, headY - 11], 3.5, 0.9, boneDeep);
      p.bezierRibbon([headX - 4, headY - 5], [headX - 10, headY - 13], [headX - 16, headY - 11], 1.6, 0.5, boneHi);
      p.bezierRibbon([headX - 1, headY - 5], [headX - 5, headY - 14], [headX - 11, headY - 15], 3.0, 0.8, boneMid);
      p.bezierRibbon([headX - 1, headY - 6], [headX - 5, headY - 14], [headX - 10, headY - 15], 1.2, 0.5, boneHi);

      // 棱角凶悍龙骨上颌（倾斜流线吻部 + 高耸重眉脊 + 尖锐鼻棘！）
      p.setPart(SPRITE_PART.NECK_HEAD);
      p.poly(
        [
          [headX - 6, headY - 5],
          [headX + 3, headY - 7],
          [headX + 12, headY - 3],
          [headX + 15, headY + 1],
          [headX + 12, headY + 3],
          [headX - 4, headY + 3],
        ],
        boneMid,
      );
      p.poly(
        [
          [headX - 5, headY - 5],
          [headX + 3, headY - 6],
          [headX + 12, headY - 2],
          [headX + 14, headY + 1],
          [headX - 2, headY + 1],
        ],
        boneMain,
      );
      p.line(headX - 4, headY - 5, headX + 3, headY - 6, boneHi, 1);
      p.line(headX + 3, headY - 6, headX + 12, headY - 2, boneHi, 1);
      // 上翘鼻吻钩棘
      p.poly([[headX + 10, headY - 3], [headX + 14, headY - 7], [headX + 14, headY - 1]], boneHi);
      // 深暗龙口 + 凶悍锯齿下颌骨
      const jawDrop = isAtk && (f === 1 || f === 2) ? 4 : 1;
      p.poly(
        [
          [headX - 2, headY + 2],
          [headX + 13, headY + 2],
          [headX + 10, headY + 7 + jawDrop],
          [headX - 3, headY + 6 + jawDrop],
        ],
        '#170824',
      );
      p.poly(
        [
          [headX - 3, headY + 5 + jawDrop],
          [headX + 11, headY + 6 + jawDrop],
          [headX + 9, headY + 9 + jawDrop],
          [headX - 4, headY + 8 + jawDrop],
        ],
        boneMid,
      );
      p.hline(headX - 2, headY + 6 + jawDrop, 11, boneMain);
      // 错落大犬齿獠牙与利齿列！
      p.vline(headX + 11, headY + 2, 3, boneHi); // 前大犬齿
      p.vline(headX + 7, headY + 2, 2, boneHi);
      p.vline(headX + 4, headY + 2, 2, boneMain);
      p.vline(headX + 9, headY + 4 + jawDrop, 2, boneHi); // 下大獠牙
      p.px(headX + 5, headY + 5 + jawDrop, boneHi);

      // 深邃黑眼窝 + 凶厉燃烧猩红狭长龙瞳！
      p.setPart(SPRITE_PART.FACE_FEATURES);
      p.poly([[headX - 2, headY - 3], [headX + 5, headY - 2], [headX + 4, headY + 1], [headX - 2, headY]], '#12061c');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.line(headX, headY - 2, headX + 4, headY - 1, '#ff1744', 2, true);
      p.px(headX + 2, headY - 2, '#fff5a6', true);

      // [6] 攻击爆发：炽烈幽蓝冥紫龙息吐息！
      if (isAtk && (f === 1 || f === 2)) {
        p.setPart(SPRITE_PART.GLOW_FX);
        p.poly(
          [
            [headX + 9, headY + 4],
            [63, headY - 4],
            [63, headY + 16],
            [headX + 9, headY + 8],
          ],
          '#8233ff',
          true,
        );
        p.poly(
          [
            [headX + 10, headY + 5],
            [63, headY],
            [63, headY + 12],
            [headX + 10, headY + 7],
          ],
          '#3deeff',
          true,
        );
        p.line(headX + 10, headY + 6, 62, headY + 5, '#ffffff', 2, true);
        p.px(56, headY + 1, '#ffffff', true);
        p.px(59, headY + 10, '#c78cff', true);
      }
    },
  },

  // =========================================================================
  // 8. 深渊隙间恶魔 / 魔王（T4-B · 1×2 高挑深渊暗系魔王：修长高开衩黑金魔王长礼服 + 漆黑金环双魔角 + 尖锐撕裂空间隙间魔瞳 + 黑曜鎏金深渊月镰！）
  // =========================================================================
  creature_abyss_gap_devil: {
    ...HD_BASE,
    backdropTop: '#14051f',
    backdropBottom: '#330a38',
    backdropGlow: '#ff2b6e',
    avatarCrop: { x: 13, y: 2, size: 36 },
    portraitCrop: { x: 2, y: 1, w: 60, h: 68 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 24 : isMove ? 28 : Math.round(28 + pose.leanX * 0.9);
      const by = isMove
        ? [-2, -4, -3, -1][f % 4]
        : Math.round(pose.breathY * 1.0 - pose.stepLift * 1.1);
      const flap = isMove ? [-6, 5, -2, -5][f % 4] : Math.round(Math.sin(phase) * 2.4 + pose.flutter);
      const sway = isMove ? 2.6 : pose.flutter * 1.7;
      // 1×2 高挑魔王专属御姐比例：头位比常规单位高出 4px，气场瞬间鹤立鸡群！
      const headY = 19 + by;

      // [1] 背后斜向撕裂空间的「尖锐深渊隙间裂隙 + 竖瞳金红魔眼 + 绯红丝带小蝴蝶结」（瞬移裂界态时剧烈扩张撕裂！）
      p.setPart(SPRITE_PART.BACK_ACC);
      const gapY = 23 + by + Math.round(Math.sin(phase) * 1.4);
      const tearBoost = isMove ? 5 : 0;
      p.poly(
        [
          [Math.max(1, bx - 25 - tearBoost), gapY + 3],
          [bx - 12, gapY - 6 - Math.round(tearBoost * 0.6)],
          [bx + 12, gapY - 5 - Math.round(tearBoost * 0.6)],
          [Math.min(62, bx + 25 + tearBoost), gapY + 1],
          [bx + 11, gapY + 8 + Math.round(tearBoost * 0.6)],
          [bx - 11, gapY + 9 + Math.round(tearBoost * 0.6)],
        ],
        '#8c1148',
      );
      p.poly(
        [
          [Math.max(3, bx - 22 - tearBoost), gapY + 2],
          [bx - 11, gapY - 4 - Math.round(tearBoost * 0.5)],
          [bx + 11, gapY - 3 - Math.round(tearBoost * 0.5)],
          [Math.min(60, bx + 22 + tearBoost), gapY + 1],
          [bx + 10, gapY + 6 + Math.round(tearBoost * 0.5)],
          [bx - 10, gapY + 7 + Math.round(tearBoost * 0.5)],
        ],
        '#11041c',
      );
      p.line(Math.max(2, bx - 23 - tearBoost), gapY + 2, bx - 12, gapY - 5 - Math.round(tearBoost * 0.5), '#ff3878', 1, true);
      p.line(bx + 12, gapY - 4 - Math.round(tearBoost * 0.5), Math.min(61, bx + 23 + tearBoost), gapY + 1, '#ff3878', 1, true);
      if (isMove) {
        // 撕裂空间态：额外飞舞紫红与纯白空间碎裂菱片！
        p.setPart(SPRITE_PART.GLOW_FX);
        p.line(Math.max(2, bx - 26), gapY + 4, bx - 16, gapY - 8, '#ffffff', 1, true);
        p.line(bx + 16, gapY - 7, Math.min(61, bx + 27), gapY + 2, '#ffd6e8', 1, true);
        p.px(Math.max(3, bx - 22), gapY - 9 + (f % 2) * 3, '#ff66a3', true);
        p.px(Math.min(60, bx + 24), gapY + 9 - (f % 2) * 3, '#c77dff', true);
        p.setPart(SPRITE_PART.BACK_ACC);
      }
      p.rect(Math.max(2, bx - 23 - Math.round(tearBoost * 0.5)), gapY + 1, 2, 3, '#ff2459');
      p.rect(Math.min(60, bx + 21 + Math.round(tearBoost * 0.5)), gapY, 2, 3, '#ff2459');
      // 左右两枚犀利凝视的竖瞳金红深渊魔眼（瞬移态怒睁！）
      p.setPart(SPRITE_PART.GLOW_FX);
      const drawGapEye = (ex: number, ey: number) => {
        p.ellipse(ex, ey, isMove ? 3.8 : 3.2, isMove ? 2.2 : 1.8, '#ff4769', true);
        p.ellipse(ex, ey, isMove ? 2.6 : 2.2, isMove ? 1.7 : 1.4, '#ffe052', true);
        p.vline(ex, ey - 1, 3, '#170421');
        p.px(ex - 1, ey - 1, '#ffffff', true);
      };
      drawGapEye(bx - 16, gapY + 2);
      drawGapEye(bx + 19, gapY + 1);

      // 宽大威严黑曜鎏金深渊魔王大蝠翼（翼骨镶鎏金，王者风范！）
      drawGothicBatWings64(p, bx - 1, 36 + by, {
        leftSpan: 24,
        rightSpan: 17,
        height: 16,
        flap,
        boneDark: '#170521',
        boneLight: '#ffd459',
        webDark: '#26082e',
        webMain: '#631144',
        webLight: '#b8256a',
        webGlow: '#ff70a6',
      });

      // [2] 瀑布般倾泻至脚踝的纯净雪白银紫魔王长后发（极高明暗对比！）
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 9, headY],
          [bx + 11 - sway * 0.4, 52 + by],
          [bx + 5 - sway * 0.6, 59 + by],
          [bx - 10 + sway * 0.8, 60 + by],
          [bx - 15 + sway * 0.9, 49 + by],
          [bx - 12 + sway * 0.5, 34 + by],
        ],
        '#7e72a6',
      );
      p.poly(
        [
          [bx - 8, headY + 1],
          [bx + 7, headY + 1],
          [bx + 9 - sway * 0.3, 51 + by],
          [bx - 11 + sway * 0.6, 53 + by],
        ],
        '#e8e4ff',
      );
      p.bezierRibbon([bx - 9, headY + 6], [bx - 12 + sway * 0.6, 40 + by], [bx - 12 + sway * 0.9, 56 + by], 2.4, 0.8, '#ffffff');

      // [3] 1×2 修长魔姬玉腿 + 黑金高跟战靴（瞬移裂界态从容凌空悬步，尽显跨界王威！）
      p.setPart(SPRITE_PART.LEGS);
      const stride = isMove ? 0 : Math.round(pose.stride * 3.4);
      const bLift = isMove ? -1 : pose.stride > 0.25 ? -2 : 0;
      const fLift = isMove ? -2 : pose.stride < -0.25 ? -2 : 0;
      // 左后长腿 + 黑金过膝高跟靴
      p.rect(bx - 6 - stride, 48 + by + bLift, 4, 9, '#311a47');
      p.rect(bx - 6 - stride, 56 + bLift, 4, 8, '#1a0a26');
      p.poly([[bx - 7 - stride, 62 + bLift], [bx - 1 - stride, 62 + bLift], [bx + 1 - stride, 65 + bLift], [bx - 7 - stride, 65 + bLift]], '#6e0d2a');
      p.hline(bx - 6 - stride, 56 + bLift, 4, '#ffd452');
      // 右前修长白皙长腿（高开衩露腿）+ 黑红鎏金长靴
      p.rect(bx + 2 + stride, 46 + by + fLift, 4, 11, '#fff0ec');
      p.vline(bx + 2 + stride, 46 + by + fLift, 11, '#e3b5bc');
      p.rect(bx + 2 + stride, 57 + fLift, 4, 7, '#260d33');
      p.hline(bx + 2 + stride, 57 + fLift, 4, '#ffd966');
      p.poly([[bx + 2 + stride, 63 + fLift], [bx + 7 + stride, 63 + fLift], [bx + 9 + stride, 66 + fLift], [bx + 2 + stride, 66 + fLift]], '#c91642');
      p.px(bx + 6 + stride, 64 + fLift, '#ffe885');

      // [4] 左后臂：暗紫鎏金肩甲泡泡袖 + 2px 娇美玉臂优雅托起亮金白芯紫红隙间魔焰（瞬移态高扬撕裂虚空！）
      p.setPart(SPRITE_PART.BACK_ARM);
      drawPuffSleeve64(p, bx - 6.5, 31.5 + by, '#1f0b2e', '#4f1e6b', '#ffd452', 'left');
      const lHandX = isMove ? bx - 16 : bx - 15;
      const lHandY = isMove ? 31 + by : 36 + by;
      drawSoftChibiArm64(p, bx - 8, 33 + by, lHandX, lHandY, '#fff2ee', '#e3b5bc');
      p.rect(lHandX - 2, lHandY - 1, 3, 2, '#fff2ee');
      p.setPart(SPRITE_PART.GLOW_FX);
      const orbR = isMove ? 3.5 : 2.6;
      p.ellipse(lHandX - 3, lHandY - 4, orbR, orbR, '#ff2666', true);
      p.ellipse(lHandX - 3, lHandY - 4.5, orbR * 0.55, orbR * 0.55, '#ffe885', true);
      p.px(lHandX - 3, lHandY - 5, '#ffffff', true);
      if (isMove) {
        // 裂界指尖放射紫白空间裂纹！
        p.line(lHandX - 6, lHandY - 9, lHandX, lHandY + 1, '#ffd4e6', 1, true);
      }

      // [5] 华贵「黑曜丝绒绛红 · 立体柔褶高开衩曳地魔王长礼服」（丝绒暗褶 + 温润古金渐变滚边！）
      p.setPart(SPRITE_PART.SKIRT);
      const skSway = Math.round(-pose.leanX * 0.5 + sway * 0.85);
      // 曳地黑曜暗紫大长袍外裙摆（左侧曳地长拖尾 + 右侧优雅高开衩露出白皙长腿！）
      p.poly(
        [
          [bx - 6, 38 + by],
          [bx + 6, 38 + by],
          [bx + 12 + skSway, 55 + by],
          [bx + 8 + skSway, 53 + by],
          [bx + 2 + skSway, 46 + by], // 高开衩切口！
          [bx - 1 + skSway, 59 + by],
          [bx - 13 + skSway, 61 + by],
          [bx - 17 + skSway, 56 + by],
        ],
        '#1b0826',
      );
      // 华丽深绛红丝绒内衬长裙面（四阶立体垂坠明暗！）
      p.poly(
        [
          [bx - 5, 38 + by],
          [bx + 5, 38 + by],
          [bx + 9 + skSway, 52 + by],
          [bx + 2 + skSway, 45 + by],
          [bx - 2 + skSway, 57 + by],
          [bx - 11 + skSway, 58 + by],
          [bx - 13 + skSway, 53 + by],
        ],
        '#850f33',
      );
      p.poly(
        [
          [bx - 4, 39 + by],
          [bx + 3, 39 + by],
          [bx - 1 + skSway, 54 + by],
          [bx - 9 + skSway, 55 + by],
        ],
        '#c21b4a',
      );
      // 丝绒垂坠暗褶沟 + 柔润绯红绸光（彻底告别平面多边形感！）
      p.bezierRibbon([bx - 3, 40 + by], [bx - 6 + skSway * 0.5, 48 + by], [bx - 10 + skSway, 57 + by], 1.8, 1.0, '#630926');
      p.bezierRibbon([bx + 1, 40 + by], [bx - 1 + skSway * 0.5, 49 + by], [bx - 3 + skSway, 57 + by], 1.5, 0.9, '#6e0b2a');
      p.bezierRibbon([bx - 1, 40 + by], [bx - 4 + skSway * 0.5, 48 + by], [bx - 6 + skSway, 55 + by], 2.0, 0.8, '#e8386a');
      p.bezierRibbon([bx - 5, 41 + by], [bx - 9 + skSway * 0.5, 49 + by], [bx - 12 + skSway, 54 + by], 1.4, 0.6, '#f25785');
      // 温润古金渐变精致滚边（暗金底 + 亮金转折点高光，优雅不生硬！）
      p.line(bx - 15 + skSway, 56 + by, bx - 12 + skSway, 60 + by, '#ba8624', 1);
      p.line(bx - 12 + skSway, 60 + by, bx - 1 + skSway, 58 + by, '#d9a436', 1);
      p.line(bx - 1 + skSway, 58 + by, bx + 2 + skSway, 46 + by, '#f0c452', 1);
      p.line(bx + 2 + skSway, 46 + by, bx + 11 + skSway, 54 + by, '#c9932c', 1);
      p.px(bx - 12 + skSway, 60 + by, '#fff0a6');
      p.px(bx + 2 + skSway, 46 + by, '#fff5bd');
      p.px(bx - 1 + skSway, 58 + by, '#ffe885');

      // [6] 修长黑金魔姬束腰礼服上衣 + 高贵紫红立领 + 璀璨深渊红宝石胸饰！
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 29 + by], [bx + 5, 29 + by], [bx + 6, 38 + by], [bx - 5, 38 + by]], '#190826');
      p.poly([[bx - 4, 29 + by], [bx + 4, 29 + by], [bx + 4, 37 + by], [bx - 4, 37 + by]], '#36124d');
      // 魔王金色胸甲饰线与高领
      p.line(bx - 5, 29 + by, bx + 1, 33 + by, '#ffd452', 1);
      p.line(bx + 5, 29 + by, bx + 1, 33 + by, '#ffd452', 1);
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.hline(bx - 5, 38 + by, 11, '#ffd452');
      p.rect(bx - 1, 37 + by, 3, 3, '#ff265e');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx + 1, 33 + by, 1.8, 1.8, '#ff245c', true);
      p.px(bx + 1, 32 + by, '#fff5a6', true);

      // [7] 魅惑尊贵魔王颜 + 炽金猩红 4×4 大眼 + 纯净雪白银紫长发 + 漆黑金环外掠大魔角 + 悬浮红金魔冠印！
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#ffffff',
        skinMain: '#fff2ef',
        skinShade: '#e3b5bc',
        lashColor: '#240829',
        irisDark: '#9e102c',
        irisMid: '#f2304d',
        irisGlow: '#ffe466',
        blushColor: '#ff8fb3',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#786ca3',
        dark: '#afa6d4',
        mid: '#e0dcfa',
        light: '#f7f5ff',
        spec: '#ffffff',
        leftLockLen: 14,
        rightLockLen: 12,
        fluff: 2,
        sway,
      });
      // 威严大幅外掠「漆黑鎏金环大魔角」+ 额顶悬浮深渊红金魔冠微印！
      p.setPart(SPRITE_PART.HEADWEAR);
      // 左大弯角
      p.bezierRibbon([bx - 6, headY - 8], [bx - 14, headY - 11], [bx - 16, headY - 17], 3.4, 0.9, '#1f0721');
      p.bezierRibbon([bx - 6, headY - 9], [bx - 13, headY - 12], [bx - 15, headY - 16], 1.4, 0.5, '#ff3366');
      p.line(bx - 11, headY - 12, bx - 10, headY - 9, '#ffd659', 1); // 鎏金角环！
      p.px(bx - 16, headY - 17, '#ffe885', true);
      // 右大弯角
      p.bezierRibbon([bx + 6, headY - 8], [bx + 14, headY - 11], [bx + 16, headY - 17], 3.4, 0.9, '#1f0721');
      p.bezierRibbon([bx + 6, headY - 9], [bx + 13, headY - 12], [bx + 15, headY - 16], 1.4, 0.5, '#ff3366');
      p.line(bx + 11, headY - 12, bx + 10, headY - 9, '#ffd659', 1); // 鎏金角环！
      p.px(bx + 16, headY - 17, '#ffe885', true);
      // 悬浮深渊菱形王冠微印
      p.setPart(SPRITE_PART.GLOW_FX);
      p.poly([[bx, headY - 16], [bx + 2, headY - 13], [bx, headY - 11], [bx - 2, headY - 13]], '#ffd659', true);
      p.px(bx, headY - 13, '#ff265e', true);

      // [8] 右前臂黑金泡泡袖 + 2px 纤长玉臂真握持「黑曜鎏金深渊月镰」！
      p.setPart(SPRITE_PART.FRONT_ARM);
      drawPuffSleeve64(p, bx + 6.5, 31.5 + by, '#1f0b2e', '#4f1e6b', '#ffd452', 'right');
      const handX = isAtk && (f === 1 || f === 2) ? bx + 14 : isAtk && f === 0 ? bx + 13 : bx + 12;
      const handY = isAtk && f === 0 ? 29 + by : 36 + by - Math.round(pose.armAction * 2);
      drawSoftChibiArm64(p, bx + 8, 34 + by, handX, handY, '#fff2ef', '#e3b5bc');

      // 彻底升级神器级「黑曜雕花玄铁长杆 + 鎏金魔冠镰顶 + 巨幅深弯月血金巨镰刃」
      p.setPart(SPRITE_PART.WEAPON);
      if (isAtk && f === 0) {
        // 蓄力帧：向右上方高昂拉弓举镰，镰刃朝右外上方大张蓄势，100% 避开雪白秀发与面容！
        const topX = Math.min(54, handX + 10);
        const topY = 8 + by;
        const buttX = handX - 6;
        const buttY = handY + 13;
        p.line(buttX, buttY, topX, topY, '#261133', 3);
        p.line(buttX + 1, buttY - 1, topX, topY, '#8b57b0', 1);
        p.px(Math.round((handX + topX) * 0.5), Math.round((handY + topY) * 0.5), '#ffd659');
        p.ellipse(topX, topY, 2.4, 2.4, '#ffd659');
        p.px(topX, topY, '#ff265e', true);
        p.bezierRibbon([topX, topY], [Math.min(60, topX + 9), topY + 2], [Math.min(61, topX + 9), topY + 16], 4.6, 0.9, '#b80f3c');
        p.bezierRibbon([topX + 1, topY + 1], [Math.min(59, topX + 8), topY + 3], [Math.min(60, topX + 8), topY + 15], 2.2, 0.5, '#ff4d7a', true);
      } else if (isAtk && (f === 1 || f === 2)) {
        // 高速挥斩撕裂虚空：黑曜玄铁长杆精准过掌 + 巨大深弯月猩红镰刃紧贴三色虚空斩弧！
        const tipX = Math.min(57, handX + 17);
        const tipY = handY - 12;
        const buttX = handX - 9;
        const buttY = handY + 7;
        p.line(buttX, buttY, tipX, tipY, '#261133', 3);
        p.line(buttX + 1, buttY - 1, tipX, tipY, '#9966bd', 1);
        p.px(buttX, buttY, '#ffd659');
        p.ellipse(tipX, tipY, 2.5, 2.5, '#ffd659');
        p.px(tipX, tipY, '#ff265e', true);
        p.bezierRibbon([tipX, tipY], [tipX + 3, tipY + 13], [tipX - 9, tipY + 23], 4.8, 0.9, '#b30d38');
        p.bezierRibbon([tipX, tipY + 1], [tipX + 2, tipY + 13], [tipX - 8, tipY + 22], 2.2, 0.5, '#ff5983', true);
        drawSlashArc64(p, bx + 15, 33 + by, 21, 19, -1.2, 0.95, '#7a17e6', '#ff245e', '#ffe885');
      } else {
        // 尊贵斜立黑曜鎏金深渊月镰（下端立于右靴外侧地面，完全不挡白皙开衩长腿与右靴！）
        const topX = handX + 4;
        const topY = 9 + by;
        const botX = handX - 1;
        const botY = 63;
        p.line(botX, botY, topX, topY, '#220e30', 3);
        p.line(botX + 1, botY - 1, topX, topY, '#754896', 1);
        // 杆身鎏金螺旋饰环 + 矛尾金尖
        for (const t of [0.18, 0.42, 0.72, 0.88]) {
          const rx = Math.round(botX + (topX - botX) * t);
          const ry = Math.round(botY + (topY - botY) * t);
          p.hline(rx - 1, ry, 3, '#ffd659');
        }
        p.poly([[botX - 2, botY - 1], [botX + 2, botY - 1], [botX, botY + 3]], '#ffd659');
        // 华丽恶魔展翼金冠镰顶 + 燃血核心红宝石
        p.poly([[topX - 4, topY + 2], [topX, topY - 3], [topX + 4, topY + 2], [topX, topY + 4]], '#d99e26');
        p.poly([[topX - 2, topY + 1], [topX, topY - 2], [topX + 2, topY + 1]], '#ffe885');
        p.px(topX, topY + 1, '#ff265e', true);
        // 绝世巨大深弯月血金死神镰刃（弧长饱满、刀背黑金、刀锋锐利炽红发光！）
        p.bezierRibbon([topX + 1, topY], [topX + 13, topY + 1], [Math.min(61, topX + 17), topY + 16], 5.0, 0.9, '#240926');
        p.bezierRibbon([topX + 2, topY], [topX + 13, topY + 2], [Math.min(60, topX + 16), topY + 15], 3.2, 0.7, '#d91644', true);
        p.bezierRibbon([topX + 3, topY + 1], [topX + 13, topY + 3], [Math.min(60, topX + 16), topY + 15], 1.3, 0.4, '#ffdfe9', true);
        // 刀背鎏金雕纹弧线
        p.bezierRibbon([topX + 1, topY - 1], [topX + 11, topY], [Math.min(58, topX + 14), topY + 7], 1.1, 0.5, '#ffd659');
      }
      drawWrappedHand(p, handX, handY, '#fff2ef', '#ffffff', '#e3b5bc');
    },
  },

  // =========================================================================
  // 9. 深渊冰魔（T3 召唤 · 暗系寒冰抗性：冰晶角与冰翼冰魔少女 + 冰蓝蓬裙 + 晶棱冰枪）
  // =========================================================================
  creature_abyss_ice_demon: {
    ...HD_BASE,
    backdropTop: '#0b1833',
    backdropBottom: '#193566',
    backdropGlow: '#66f0ff',
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 27 : Math.round(30 + pose.leanX * 0.9);
      const by = Math.round(pose.breathY * 1.2 - pose.stepLift * 1.2);
      const flap = Math.round(Math.sin(phase) * 2.5 + pose.flutter);
      const sway = pose.flutter * 1.6;
      const headY = 23 + by;

      // [1] 璀璨棱晶极寒冰翼（3/4 展开的冰蓝恶魔晶翼！）
      drawGothicBatWings64(p, bx - 1, 36 + by, {
        leftSpan: 22,
        rightSpan: 16,
        height: 15,
        flap,
        boneDark: '#162859',
        boneLight: '#82f0ff',
        webDark: '#234a8f',
        webMain: '#4794eb',
        webLight: '#9ee8ff',
        webGlow: '#ffffff',
      });

      // [2] 冰晶湛蓝长后发
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 9, headY],
          [bx + 10 - sway * 0.4, 42 + by],
          [bx + 5 - sway * 0.5, 48 + by],
          [bx - 8 + sway * 0.6, 49 + by],
          [bx - 12 + sway * 0.7, 41 + by],
        ],
        '#1b408a',
      );
      p.poly(
        [
          [bx - 8, headY + 1],
          [bx + 7, headY + 1],
          [bx + 8 - sway * 0.3, 41 + by],
          [bx - 9 + sway * 0.5, 42 + by],
        ],
        '#3d7de0',
      );

      // [3] 3/4 斜错步雪白过膝袜 + 湛蓝冰晶小鞋
      drawStaggeredLegs64(p, bx, 51, 65, pose, {
        sockShadow: '#cde0f5',
        sockLight: '#ffffff',
        shoeDark: '#193b80',
        shoeMain: '#3875e0',
        shoeHighlight: '#b8f7ff',
      });

      // [4] 左后臂：雪白泡泡袖 + 2px 软萌少女小臂（左上方悬浮透亮棱晶冰块！）
      p.setPart(SPRITE_PART.BACK_ARM);
      drawPuffSleeve64(p, bx - 6.5, 34.5 + by, '#c7ddf5', '#ffffff', '#3896f0', 'left');
      drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 13, 39 + by, '#fff5f5', '#d9c2d4');
      p.rect(bx - 15, 37 + by, 3, 2, '#fff5f5');
      p.setPart(SPRITE_PART.GLOW_FX);
      const shardY = 23 + by + Math.round(Math.sin(phase) * 1.8);
      p.poly([[bx - 21, shardY - 4], [bx - 18, shardY], [bx - 21, shardY + 4], [bx - 24, shardY]], '#38ccff', true);
      p.poly([[bx - 21, shardY - 3], [bx - 19, shardY], [bx - 21, shardY + 2], [bx - 23, shardY]], '#c2f7ff', true);
      p.px(bx - 21, shardY - 1, '#ffffff', true);

      // [5] 晶莹天蓝波浪哥特冰霜洋装 + 雪白霜纹滚边 + 冰白蕾丝衬裙！
      drawCleanAnimeSkirt64(p, {
        waistX: bx + 0.5,
        waistY: 40 + by,
        waistW: 10,
        hemY: 51 + by,
        hemW: 30,
        tiltRight: 1.0,
        archDepth: 2.5,
        waveLobes: 3.5,
        waveAmp: 1.6,
        swayX: -pose.leanX * 0.5 + sway * 0.85,
        colors: {
          deep: '#1f4e99',
          shadow: '#3b82d6',
          main: '#66bdf7',
          light: '#a3e2ff',
          highlight: '#e3f9ff',
        },
        trimBand: {
          offsetFromHem: 2.0,
          thickness: 1.3,
          color: '#ffffff',
          shadowColor: '#bfe3ff',
        },
        petticoat: {
          peekDepth: 2.2,
          shade: '#bfd8f2',
          main: '#f2fbff',
          highlight: '#ffffff',
        },
      });

      // [6] 深蓝束腰冰魔礼服上衣 + 冰晶菱石胸针 + 洁白蕾丝领
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#1e3c7a');
      p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#3566bd');
      p.hline(bx - 4, 32 + by, 8, '#ffffff');
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.hline(bx - 5, 40 + by, 11, '#b8f2ff');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.poly([[bx + 1, 34 + by], [bx + 3, 36 + by], [bx + 1, 38 + by], [bx - 1, 36 + by]], '#70f5ff', true);
      p.px(bx + 1, 35 + by, '#ffffff', true);

      // [7] 娇俏雪肤圆脸 + 璀璨深海冰蓝 4×4 宝石大眼 + 冰蓝大集群发冠 + 一对晶莹发光冰晶魔角！
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#ffffff',
        skinMain: '#fff2f5',
        skinShade: '#d9bdd4',
        lashColor: '#17234d',
        irisDark: '#1246a6',
        irisMid: '#2e8cf5',
        irisGlow: '#99f7ff',
        blushColor: '#ff9ec2',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#193b82',
        dark: '#2b5ec2',
        mid: '#4d94f0',
        light: '#8cd4ff',
        spec: '#ebfbff',
        leftLockLen: 12,
        rightLockLen: 10,
        fluff: 2,
        sway,
      });
      // 一对修长微弯璀璨冰晶魔角（深海冰底托 + 透亮青晶 + 雪白晶尖，立体不撞猫耳！）
      p.setPart(SPRITE_PART.HEADWEAR);
      p.bezierRibbon([bx - 6, headY - 9], [bx - 12, headY - 14], [bx - 10, headY - 19], 3.2, 0.8, '#173a82');
      p.bezierRibbon([bx - 6, headY - 10], [bx - 11, headY - 14], [bx - 10, headY - 18], 1.8, 0.6, '#59e3ff', true);
      p.px(bx - 10, headY - 18, '#ffffff', true);
      p.bezierRibbon([bx + 6, headY - 9], [bx + 12, headY - 14], [bx + 10, headY - 19], 3.2, 0.8, '#173a82');
      p.bezierRibbon([bx + 6, headY - 10], [bx + 11, headY - 14], [bx + 10, headY - 18], 1.8, 0.6, '#59e3ff', true);
      p.px(bx + 10, headY - 18, '#ffffff', true);

      // [8] 右前臂泡泡袖 + 2px 软萌小臂真握持「极寒雪花晶棱冰枪」！
      p.setPart(SPRITE_PART.FRONT_ARM);
      drawPuffSleeve64(p, bx + 6.5, 34.5 + by, '#c7ddf5', '#ffffff', '#3896f0', 'right');
      const handX = isAtk && (f === 1 || f === 2) ? bx + 14 : bx + 11;
      const handY = isAtk && f === 0 ? 28 + by : 39 + by - Math.round(pose.armAction * 2);
      drawSoftChibiArm64(p, bx + 8, 37 + by, handX, handY, '#fff2f5', '#d9bdd4');

      p.setPart(SPRITE_PART.WEAPON);
      if (isAtk && f === 0) {
        const topX = Math.min(58, handX + 12);
        const topY = handY - 14;
        p.line(handX - 6, handY + 7, topX, topY, '#1f59a8', 3);
        p.line(handX - 5, handY + 6, topX, topY, '#8cf5ff', 1, true);
        p.poly([[topX + 4, topY - 4], [topX - 3, topY], [topX + 1, topY + 4]], '#66eeff', true);
      } else if (isAtk && (f === 1 || f === 2)) {
        const tipX = Math.min(61, handX + 20);
        p.line(handX - 5, handY + 1, tipX - 6, handY - 2, '#1f59a8', 3);
        p.line(handX - 4, handY, tipX - 4, handY - 2, '#8cf5ff', 1, true);
        // 雪花晶棱护手 + 极寒冰枪刃
        p.vline(tipX - 9, handY - 6, 9, '#d6fbff', true);
        p.poly([[tipX, handY - 3], [tipX - 9, handY - 6], [tipX - 7, handY - 2], [tipX - 9, handY + 2]], '#59e8ff', true);
        p.line(tipX - 9, handY - 2, tipX, handY - 3, '#ffffff', 1, true);
        drawSlashArc64(p, bx + 17, 35 + by, 17, 14, -0.9, 0.85, '#33a3ff', '#99f7ff', '#ffffff');
      } else {
        const upLen = 19;
        const downLen = 19;
        const ux = 0.32;
        const topX = Math.min(57, Math.round(handX + upLen * ux));
        const topY = handY - upLen;
        const botX = Math.round(handX - downLen * ux);
        const botY = Math.min(64, handY + downLen);
        p.line(botX, botY, topX, topY, '#1f59a8', 3);
        p.line(botX + 1, botY - 1, topX, topY, '#75ebff', 1, true);
        // 精致冰晶十字雪花护手 + 透亮棱晶矛尖！
        p.line(topX - 4, topY + 2, topX + 4, topY + 4, '#ffffff', 1, true);
        p.poly([[topX + 2, topY - 7], [topX - 3, topY + 2], [topX, topY + 5], [topX + 4, topY + 2]], '#47dbff', true);
        p.poly([[topX + 2, topY - 6], [topX - 1, topY + 1], [topX + 2, topY + 2]], '#d9fbff', true);
        p.line(topX, topY + 2, topX + 2, topY - 6, '#ffffff', 1, true);
      }
      drawWrappedHand(p, handX, handY, '#fff2f5', '#ffffff', '#d9bdd4');
    },
  },
};

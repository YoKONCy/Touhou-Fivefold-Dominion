/**
 * 64×72 3/4 侧身萌系像素少女精雕积木库（水灵大眼、集群发型、波浪裙、错步腿、蝴蝶结、斩弧与哥特蝠翼）
 */

import type { RigPose } from '../voxelSprites';
import { SPRITE_PART, type HdPixelPainter, type SpritePartId } from './rasterizer';

export interface KawaiiHeadOptions {
  skinLight?: string;
  skinMain?: string;
  skinShade?: string;
  lashColor?: string;
  /** 深瞳/虹膜上部浓色 */
  irisDark: string;
  /** 虹膜饱满主色 */
  irisMid: string;
  /** 虹膜下缘月牙亮光色 */
  irisGlow: string;
  blushColor?: string;
  /** 攻击或微笑时可爱小虎牙 */
  vampireFang?: boolean;
}

/**
 * 20×16 柔圆 3/4 侧身萌系少女脸 + 璀璨水灵 4×4 弧睫宝石大眼！
 */
export function drawKawaiiHead64(
  p: HdPixelPainter,
  cx: number,
  headY: number,
  pose: RigPose,
  opts: KawaiiHeadOptions,
): void {
  const skinLight = opts.skinLight ?? '#fff4eb';
  const skinMain = opts.skinMain ?? '#ffe0cc';
  const skinShade = opts.skinShade ?? '#e8ad99';
  const lash = opts.lashColor ?? '#2e1530';
  const blush = opts.blushColor ?? '#ff94b0';

  // 1. 纤细娇嫩少女脖颈（3px 秀气细脖，告别粗硬脖子！）
  p.setPart(SPRITE_PART.NECK_HEAD);
  p.rect(cx - 1, headY + 7, 3, 4, skinShade);
  p.vline(cx, headY + 8, 3, skinMain);

  // 2. 饱满苹果颊 + 柔尖 3/4 侧颜小下巴（圆润Q弹，下巴微偏右 1px 呈现生动 3/4 角度！）
  const faceRows = [
    '....llllllllll....',
    '..llmmmmmmmmmmll..',
    '.lmmmmmmmmmmmmmml.',
    'lmmmmmmmmmmmmmmmml',
    'lmmmmmmmmmmmmmmmml',
    'smmmmmmmmmmmmmmmml',
    'smmmmmmmmmmmmmmmml',
    'smmmmmmmmmmmmmmmms',
    'ssmmmmmmmmmmmmmmms',
    '.ssmmmmmmmmmmmmms.',
    '.ssmmmmmmmmmmmmss.',
    '..ssmmmmmmmmmmss..',
    '...ssmmmmmmmmss...',
    '.....ssmmmmss.....',
    '.......ssss.......',
  ];
  p.stamp(cx - 9, headY - 7, faceRows, {
    l: skinLight,
    m: skinMain,
    s: skinShade,
  });

  // 3. 真正超萌的 4×4 水灵宝石大眼（柔弯弧形上睫毛 + 清澈眼白 + 闪耀纯白大星光 + 下虹膜宝石亮弧！）
  p.setPart(SPRITE_PART.FACE_FEATURES);
  const eyeTopY = headY - 1;
  // 3/4 侧身布局：左眼（近侧）完整 4×4，中间留 3px 洁净鼻梁，右眼（远侧）3×4 精致透视！
  const leftEyeX = cx - 5;
  const rightEyeX = cx + 2;

  if (pose.expr === 'hurt') {
    p.px(leftEyeX, eyeTopY, lash);
    p.px(leftEyeX + 1, eyeTopY + 1, lash);
    p.px(leftEyeX + 2, eyeTopY + 2, lash);
    p.px(leftEyeX + 1, eyeTopY + 3, lash);
    p.px(leftEyeX, eyeTopY + 3, lash);

    p.px(rightEyeX + 2, eyeTopY, lash);
    p.px(rightEyeX + 1, eyeTopY + 1, lash);
    p.px(rightEyeX, eyeTopY + 2, lash);
    p.px(rightEyeX + 1, eyeTopY + 3, lash);
    p.px(rightEyeX + 2, eyeTopY + 3, lash);
  } else if (pose.blink) {
    // 软萌笑眼弯弯弧线
    p.px(leftEyeX - 1, eyeTopY + 2, lash);
    p.hline(leftEyeX, eyeTopY + 1, 3, lash);
    p.px(leftEyeX + 3, eyeTopY + 2, lash);

    p.px(rightEyeX, eyeTopY + 2, lash);
    p.hline(rightEyeX + 1, eyeTopY + 1, 2, lash);
    p.px(rightEyeX + 3, eyeTopY + 2, lash);
  } else {
    const focused = pose.expr === 'focus';
    // 教科书级 3/4 朝右萌系宝石大眼：双眼统一微向右看、饱满圆润 3×3 宝石虹膜、同向左上纯白星光高光 + 柔弧上睫毛！
    const leftEye = focused
      ? [
          '.LLL',
          'wWPD',
          'wDPM',
          '.GGM',
        ]
      : [
          '.LL.',
          'wWPD',
          'wDPM',
          '.GGM',
        ];
    const rightEye = focused
      ? [
          'LLL',
          'WPD',
          'DPM',
          'GGM',
        ]
      : [
          'LL.',
          'WPD',
          'DPM',
          'GGM',
        ];
    const pal: Record<string, string> = {
      L: lash,
      w: '#fffcff',
      W: '#ffffff',
      P: '#210a26',
      D: opts.irisDark,
      M: opts.irisMid,
      G: opts.irisGlow,
    };
    p.stamp(leftEyeX, eyeTopY, leftEye, pal);
    p.stamp(rightEyeX, eyeTopY, rightEye, pal);
  }

  // 软萌苹果颊樱粉腮红（紧贴眼下外侧，2×1 柔和粉润，瞬间注入少女血色！）
  p.hline(leftEyeX - 1, eyeTopY + 4, 2, blush);
  p.hline(rightEyeX + 2, eyeTopY + 4, 2, blush);

  // 精致可爱小嘴（告别死板横黑杠！采用暖粉红 1~2px 柔和浅笑）
  const mouthX = cx + 1;
  const mouthY = eyeTopY + 5;
  if (pose.expr === 'hurt') {
    p.rect(mouthX - 1, mouthY, 2, 2, '#d15671');
    p.px(mouthX - 1, mouthY, '#ffa3b8');
  } else if (pose.expr === 'focus') {
    p.hline(mouthX - 1, mouthY, 2, '#cc4b68');
    p.px(mouthX, mouthY + 1, '#ff94ab');
    if (opts.vampireFang) {
      // 蕾米莉亚招牌俏皮小虎牙！
      p.px(mouthX + 1, mouthY, '#ffffff');
    }
  } else {
    p.px(mouthX - 1, mouthY, '#de7a8b');
    p.px(mouthX, mouthY, '#c95f74');
  }
}

export interface CleanAnimeHairOptions {
  deep: string;
  dark: string;
  mid: string;
  light: string;
  spec: string;
  /** 左/右侧包脸鬓发长度 */
  leftLockLen?: number;
  rightLockLen?: number;
  /** 发型蓬松高度 */
  fluff?: number;
  /** 是否在发尾向外微卷翘（如蕾米短波浪 bob 头） */
  bobFlare?: boolean;
  sway?: number;
}

/**
 * 干净大色块集群萌系发型（Big Clean Clusters —— 彻底告别 5 根竖条栅栏刘海！）
 * 饱满圆润穹顶 + 清晰大三角空气额头 + 左右大块包颊弯发 + 亮泽天使环高光！
 */
export function drawCleanAnimeHair64(
  p: HdPixelPainter,
  cx: number,
  headY: number,
  opts: CleanAnimeHairOptions,
): void {
  p.setPart(SPRITE_PART.FRONT_HAIR);
  const fl = opts.fluff ?? 2;
  const sw = opts.sway ?? 0;

  // 1. 蓬松饱满圆穹发冠（大块干净体积，零碎噪点）
  p.ellipse(cx - 0.5, headY - 7.5 - fl * 0.4, 11.2, 5.6 + fl * 0.4, opts.deep);
  p.ellipse(cx - 0.5, headY - 8.2 - fl * 0.4, 10.0, 4.6 + fl * 0.3, opts.dark);
  p.ellipse(cx - 1.2, headY - 9.0 - fl * 0.4, 8.2, 3.2, opts.mid);

  // 2. 柔美弯曲两段式天使光环高光（干净宽亮带）
  p.hline(cx - 6, headY - 9 - fl, 4, opts.light);
  p.hline(cx - 5, headY - 10 - fl, 3, opts.spec);
  p.hline(cx + 1, headY - 10 - fl, 4, opts.light);
  p.hline(cx + 2, headY - 10 - fl, 2, opts.spec);

  // 3. 大块空气感三瓣刘海（左斜大片 + 中央一撮俏皮 V 尖 + 右斜大片，给双眼留出明亮额头呼吸感！）
  p.poly(
    [
      [cx - 10, headY - 7],
      [cx - 2, headY - 7],
      [cx - 4, headY - 2],
      [cx - 8, headY - 1],
      [cx - 10, headY - 3],
    ],
    opts.dark,
  );
  p.poly(
    [
      [cx - 9, headY - 7],
      [cx - 3, headY - 7],
      [cx - 5, headY - 3],
      [cx - 8, headY - 3],
    ],
    opts.mid,
  );

  // 中央一撮俏皮尖尾刘海（优雅垂于双眉之间，绝对不挡眼睛！）
  p.poly(
    [
      [cx - 2, headY - 7],
      [cx + 3, headY - 7],
      [cx + 1, headY - 1],
      [cx - 1, headY - 3],
    ],
    opts.dark,
  );
  p.poly(
    [
      [cx - 1, headY - 7],
      [cx + 2, headY - 7],
      [cx + 1, headY - 3],
    ],
    opts.light,
  );

  // 右大片斜刘海
  p.poly(
    [
      [cx + 3, headY - 7],
      [cx + 10, headY - 7],
      [cx + 10, headY - 2],
      [cx + 7, headY - 2],
      [cx + 5, headY - 4],
    ],
    opts.dark,
  );
  p.poly(
    [
      [cx + 4, headY - 7],
      [cx + 9, headY - 7],
      [cx + 8, headY - 4],
      [cx + 5, headY - 5],
    ],
    opts.mid,
  );

  // 4. 饱满柔和弯弧双鬓（左侧近景更蓬厚，右侧远景收拢修颜）
  const lLen = opts.leftLockLen ?? 12;
  const rLen = opts.rightLockLen ?? 10;
  const lEndX = opts.bobFlare ? cx - 12.5 + sw * 0.6 : cx - 9.0 + sw * 0.5;
  const rEndX = opts.bobFlare ? cx + 11.5 - sw * 0.4 : cx + 9.2 - sw * 0.3;

  // 左侧大束鬓发
  p.bezierRibbon([cx - 9.5, headY - 5], [cx - 12.2, headY + lLen * 0.45], [lEndX, headY + lLen], 4.8, 1.4, opts.deep);
  p.bezierRibbon([cx - 9.2, headY - 4], [cx - 11.2, headY + lLen * 0.42], [lEndX + 0.6, headY + lLen - 1.5], 3.2, 0.9, opts.mid);
  p.bezierRibbon([cx - 9.5, headY - 3], [cx - 10.6, headY + lLen * 0.3], [cx - 10.0, headY + lLen * 0.55], 1.4, 0.6, opts.light);

  // 右侧修颜鬓发
  p.bezierRibbon([cx + 9.0, headY - 5], [cx + 11.2, headY + rLen * 0.45], [rEndX, headY + rLen], 4.0, 1.2, opts.deep);
  p.bezierRibbon([cx + 8.8, headY - 4], [cx + 10.2, headY + rLen * 0.42], [rEndX - 0.5, headY + rLen - 1.5], 2.4, 0.8, opts.mid);
}

export interface CleanAnimeSkirtOptions {
  waistX: number;
  waistY: number;
  waistW: number;
  hemY: number;
  hemW: number;
  /** 3/4 侧身裙摆自然向右侧偏摆偏移（配合错步腿超生动！） */
  tiltRight?: number;
  /** 柔和 3D 透视圆弧下垂量（2.2~2.8px） */
  archDepth?: number;
  /** 宽大优雅的波浪瓣数（仅 3~4 瓣大波浪，绝不做 12 个尖刺锯齿！） */
  waveLobes?: number;
  waveAmp?: number;
  swayX?: number;
  colors: {
    deep: string;
    shadow: string;
    main: string;
    light: string;
    highlight: string;
  };
  /** 随波浪弧线自然贴合的单道优雅滚边/红带 */
  trimBand?: {
    offsetFromHem: number;
    thickness: number;
    color: string;
    shadowColor?: string;
  };
  /** 柔和探出裙底的雪白荷叶衬裙（大波浪柔和收口，无尖刺、无密集锯齿！） */
  petticoat?: {
    peekDepth: number;
    shade: string;
    main: string;
    highlight: string;
  };
}

/**
 * 干净大体积 3/4 优雅波浪裙引擎 v3！
 * 采用【3 大块干净立体受光面 + 2 道柔和宽垂褶 + 柔美圆弧波浪裙摆】
 */
export function drawCleanAnimeSkirt64(
  p: HdPixelPainter,
  opts: CleanAnimeSkirtOptions,
): void {
  const arch = opts.archDepth ?? 2.5;
  const lobes = Math.max(2, opts.waveLobes ?? 3.5);
  const amp = opts.waveAmp ?? 1.4;
  const sway = (opts.swayX ?? 0) + (opts.tiltRight ?? 1.0);
  const totalH = Math.max(5, opts.hemY - opts.waistY);

  const getSpanAtV = (v: number): [number, number] => {
    const flare = Math.pow(Math.max(0, Math.min(1, v)), 0.82);
    const halfW = (opts.waistW * (1 - flare) + opts.hemW * flare) * 0.5;
    const center = opts.waistX + sway * flare;
    return [center - halfW, center + halfW];
  };

  // 自然 3D 透视圆弧 + 宽大柔美布料波浪（左侧轻扬、中后段饱满垂落、右侧收弧）
  const getHemYAtU = (u: number): number => {
    const cu = Math.max(-1, Math.min(1, u));
    const dome = (1 - cu * cu) * arch;
    // 3/4 侧身微斜：右侧前腿处略低 0.8px，左侧后方轻扬！
    const slant = cu * 0.7;
    const gentleWave = Math.sin((cu + 1) * 0.5 * lobes * Math.PI) * amp * 0.5 + amp * 0.5;
    return opts.hemY + dome + slant + gentleWave;
  };

  // 1. 柔和探出的雪白内层荷叶衬裙（干净圆润，无细碎锯齿！）
  if (opts.petticoat) {
    const pet = opts.petticoat;
    p.setPart(SPRITE_PART.PETTICOAT);
    const petHalfW = Math.max(5, opts.hemW * 0.5 - 1.2);
    const petCenter = opts.waistX + sway;
    const minX = Math.floor(petCenter - petHalfW);
    const maxX = Math.ceil(petCenter + petHalfW);
    for (let x = minX; x <= maxX; x++) {
      const u = (x - petCenter) / Math.max(1, petHalfW);
      if (Math.abs(u) > 1) continue;
      const edgeSoft = Math.sqrt(Math.max(0, 1 - u * u * 0.9));
      const outerHem = getHemYAtU(u * 0.94);
      const wave = Math.abs(Math.sin((u + 1) * 0.5 * 5 * Math.PI + 0.3));
      const peek = (pet.peekDepth + wave * 1.1) * (0.4 + 0.6 * edgeSoft);
      const topY = Math.floor(outerHem - 1);
      const botY = Math.round(outerHem + peek);
      for (let y = topY; y <= botY; y++) {
        let col = pet.main;
        if (y <= Math.floor(outerHem) || u > 0.42) col = pet.shade;
        else if (y === botY && u < 0.2) col = pet.highlight;
        p.px(x, y, col);
      }
    }
  }

  // 2. 干净大色块立体外裙（左上大片受光面 + 中央柔美宽褶 + 右后侧厚重立体阴影！）
  p.setPart(SPRITE_PART.SKIRT);
  const maxY = Math.ceil(opts.hemY + arch + amp + 3);
  for (let y = Math.floor(opts.waistY); y <= maxY; y++) {
    const vRaw = (y - opts.waistY) / totalH;
    const v = Math.max(0, Math.min(1.2, vRaw));
    const [xLeft, xRight] = getSpanAtV(Math.min(1, v));
    const xStart = Math.floor(xLeft);
    const xEnd = Math.ceil(xRight);
    const span = Math.max(1, xRight - xLeft);

    for (let x = xStart; x <= xEnd; x++) {
      const u = ((x - xLeft) / span) * 2 - 1;
      if (u < -1 || u > 1) continue;
      const hemAtX = getHemYAtU(u);
      if (y > Math.round(hemAtX)) continue;

      const distFromHem = hemAtX - y;

      // 随波浪平滑弯曲的丝带/滚边
      if (
        opts.trimBand &&
        distFromHem >= opts.trimBand.offsetFromHem &&
        distFromHem < opts.trimBand.offsetFromHem + opts.trimBand.thickness
      ) {
        const useSh = opts.trimBand.shadowColor && u > 0.38;
        p.px(x, y, useSh ? opts.trimBand.shadowColor! : opts.trimBand.color);
        continue;
      }

      // 仅在 u = -0.32 和 u = +0.28 处雕琢 2 道宽软优雅的自然布料垂褶，彻底告别高频斑马条纹！
      const fold1 = Math.exp(-Math.pow((u + 0.32) / 0.13, 2)) * Math.pow(Math.min(1, v), 0.75);
      const fold2 = Math.exp(-Math.pow((u - 0.28) / 0.14, 2)) * Math.pow(Math.min(1, v), 0.75);
      const foldDip = Math.max(fold1, fold2);

      // 干净 3/4 球面大受光场（左前明亮饱满 → 中间柔和主色 → 右侧及最底阴影收厚！）
      let lum = 0.62 - u * 0.34 - foldDip * 0.34 - (v < 0.15 ? 0.12 : 0);
      if (distFromHem < 1.2) lum -= 0.08;

      let col = opts.colors.main;
      if (lum < 0.26) col = opts.colors.deep;
      else if (lum < 0.44) col = opts.colors.shadow;
      else if (lum > 0.8) col = opts.colors.highlight;
      else if (lum > 0.66) col = opts.colors.light;

      p.px(x, y, col);
    }
  }
}

/**
 * 真实 3/4 侧身斜错步少女双腿（后脚靠左偏上踩实，前脚靠右偏下优雅前迈，脚尖同朝右！）
 */
export function drawStaggeredLegs64(
  p: HdPixelPainter,
  cx: number,
  topY: number,
  footY: number,
  pose: RigPose,
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
  const stride = Math.round(pose.stride * 3.8);
  const backLift = pose.stride > 0.25 ? -2 : 0;
  const frontLift = pose.stride < -0.25 ? -2 : 0;

  const drawLeg = (lx: number, fy: number, isFront: boolean) => {
    const legTop = topY + (isFront ? frontLift : backLift);
    const legFoot = fy + (isFront ? frontLift : backLift);
    const h = Math.max(5, legFoot - legTop);
    const sockCol = isFront ? opts.sockLight : opts.sockShadow;

    // 纤细少女小腿（3px 精致洁净）
    p.rect(lx - 1, legTop, 4, Math.max(2, h - 4), sockCol);
    p.rect(lx, legTop + Math.max(2, h - 4), 3, 4, sockCol);
    if (opts.skinColor) {
      p.rect(lx - 1, legTop, 4, 2, opts.skinColor);
    }
    p.vline(lx + 1, legTop + 1, Math.max(2, h - 4), isFront ? '#ffffff' : opts.sockLight);

    // 优雅朝右圆头小鞋（3/4 透视鞋尖朝右探出！）
    p.rect(lx - 1, legFoot - 3, 6, 3, opts.shoeDark);
    p.rect(lx, legFoot - 3, 5, 2, isFront ? opts.shoeMain : opts.shoeDark);
    p.hline(lx + 1, legFoot - 3, 3, opts.shoeMain);
    if (opts.shoeHighlight) {
      p.px(lx + 3, legFoot - 3, opts.shoeHighlight);
    }
  };

  // 后脚略靠左上方（y = footY - 2），前脚靠右下方（y = footY）→ 一秒立出 3/4 立体地面透视！
  drawLeg(cx - 5 - stride, footY - 2, false);
  drawLeg(cx + 3 + stride, footY, true);
}

/**
 * 圆润饱满立体 3/4 动漫大蝴蝶结（干净大色块集群 + 柔美内折痕 + 飘逸收尖丝带）
 */
export function drawCuteRibbonBow64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  opts: {
    leftSpan: number;
    rightSpan: number;
    wingHeight: number;
    tailLen: number;
    sway?: number;
    dark: string;
    main: string;
    light: string;
    trim?: string;
    part?: SpritePartId;
  },
): void {
  if (opts.part) p.setPart(opts.part);
  const sw = opts.sway ?? 0;
  const lw = opts.leftSpan;
  const rw = opts.rightSpan;
  const h = opts.wingHeight;

  // 飘逸双垂带
  if (opts.tailLen > 0) {
    p.bezierRibbon(
      [cx - 3, cy + 2],
      [cx - lw * 0.55 + sw * 0.4, cy + opts.tailLen * 0.55],
      [cx - lw * 0.72 + sw, cy + opts.tailLen],
      3.8,
      1.6,
      opts.dark,
    );
    p.bezierRibbon(
      [cx - 2.6, cy + 2.5],
      [cx - lw * 0.52 + sw * 0.4, cy + opts.tailLen * 0.5],
      [cx - lw * 0.68 + sw, cy + opts.tailLen - 1.5],
      2.2,
      0.8,
      opts.main,
    );
    p.bezierRibbon(
      [cx + 3, cy + 2],
      [cx + rw * 0.52 - sw * 0.3, cy + opts.tailLen * 0.55],
      [cx + rw * 0.65 - sw * 0.7, cy + opts.tailLen],
      3.4,
      1.5,
      opts.dark,
    );
    p.bezierRibbon(
      [cx + 2.6, cy + 2.5],
      [cx + rw * 0.48 - sw * 0.3, cy + opts.tailLen * 0.5],
      [cx + rw * 0.6 - sw * 0.7, cy + opts.tailLen - 1.5],
      2.0,
      0.8,
      opts.light,
    );
  }

  // 经典挺括饱满梯形折翼蝴蝶结（外缘宽展微弧、中央收腰，彻底告别米老鼠圆耳朵！）
  const ly = cy + sw * 0.4;
  p.poly(
    [
      [cx - 1, cy - 1],
      [cx - lw + 1, ly - h * 0.56],
      [cx - lw - 1, ly - h * 0.2],
      [cx - lw - 1, ly + h * 0.3],
      [cx - lw + 2, ly + h * 0.54],
      [cx - 1, cy + 2],
    ],
    opts.dark,
  );
  p.poly(
    [
      [cx - 2, cy - 0.5],
      [cx - lw + 2, ly - h * 0.44],
      [cx - lw, ly + h * 0.22],
      [cx - lw + 2, ly + h * 0.38],
      [cx - 2, cy + 1],
    ],
    opts.main,
  );
  p.line(cx - 4, cy - 1, cx - lw + 3, ly - h * 0.38, opts.light, 1);
  p.line(cx - 3, cy + 0.5, cx - Math.round(lw * 0.65), Math.round(ly + 1), opts.dark, 1);
  if (opts.trim) {
    p.line(cx - lw, ly - h * 0.36, cx - lw - 1, ly + h * 0.32, opts.trim, 1);
  }

  // 右翼（3/4 视角略收拢，挺括有折角！）
  const ry = cy - sw * 0.35;
  p.poly(
    [
      [cx + 1, cy - 1],
      [cx + rw - 1, ry - h * 0.54],
      [cx + rw + 1, ry - h * 0.18],
      [cx + rw + 1, ry + h * 0.28],
      [cx + rw - 2, ry + h * 0.52],
      [cx + 1, cy + 2],
    ],
    opts.dark,
  );
  p.poly(
    [
      [cx + 2, cy - 0.5],
      [cx + rw - 2, ry - h * 0.42],
      [cx + rw, ry + h * 0.2],
      [cx + rw - 2, ry + h * 0.36],
      [cx + 2, cy + 1],
    ],
    opts.main,
  );
  p.line(cx + 4, cy - 1, cx + rw - 3, ry - h * 0.36, opts.light, 1);
  p.line(cx + 3, cy + 0.5, cx + Math.round(rw * 0.65), Math.round(ry + 1), opts.dark, 1);
  if (opts.trim) {
    p.line(cx + rw, ry - h * 0.34, cx + rw + 1, ry + h * 0.3, opts.trim, 1);
  }

  // 中央饱满绸结
  p.ellipse(cx, cy + 0.5, 2.7, 2.3, opts.dark);
  p.ellipse(cx - 0.3, cy - 0.2, 1.8, 1.5, opts.light);
}

/**
 * 2px 软萌双色少女小臂（上沿受光亮肤 + 下沿柔影，彻底兼顾纤细度与柔美肉感！）
 */
export function drawSoftChibiArm64(
  p: HdPixelPainter,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  lightSkin = '#ffe8de',
  shadeSkin = '#efc2b6',
): void {
  p.line(x0, y0, x1, y1, shadeSkin, 2);
  p.line(x0, y0 - 1, x1, y1 - 1, lightSkin, 1);
}

/**
 * 端正娇小雪白/定制色泡泡袖 + 1px 彩带袖口（彻底杜绝壮汉三角肌球！）
 */
export function drawPuffSleeve64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  shade: string,
  main: string,
  cuffColor?: string,
  side: 'left' | 'right' = 'left',
): void {
  p.ellipse(cx, cy, 2.9, 2.5, shade);
  p.ellipse(cx + (side === 'left' ? -0.2 : 0.2), cy - 0.5, 2.1, 1.8, main);
  if (cuffColor) {
    if (side === 'left') {
      p.line(cx - 2.5, cy + 0.5, cx - 0.5, cy + 2.5, cuffColor, 1);
    } else {
      p.line(cx + 0.5, cy + 2.5, cx + 2.5, cy + 0.5, cuffColor, 1);
    }
  }
}

/**
 * 64×72 锐利璀璨像素斩击光弧
 */
export function drawSlashArc64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startRad: number,
  endRad: number,
  outerCol: string,
  midCol: string,
  coreCol: string,
): void {
  p.setPart(SPRITE_PART.GLOW_FX);
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = startRad + (endRad - startRad) * t;
    const sinEnv = Math.sin(t * Math.PI);
    const x = cx + Math.cos(ang) * rx;
    const y = cy + Math.sin(ang) * ry;
    const thick = sinEnv > 0.65 ? 3 : sinEnv > 0.28 ? 2 : 1;
    p.line(x, y, x, y, outerCol, thick, true);
    if (sinEnv > 0.35) {
      p.px(Math.round(x - Math.cos(ang) * 0.8), Math.round(y - Math.sin(ang) * 0.8), midCol, true);
    }
    if (sinEnv > 0.55) {
      p.px(Math.round(x), Math.round(y), coreCol, true);
    }
  }
}

/**
 * 华丽高饱和猩红黑骨哥特恶魔蝠翼（清晰凹弧剪影 + 饱满绯红亮膜 + 锐利翼尖！）
 */
export function drawGothicBatWings64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  opts: {
    leftSpan: number;
    rightSpan: number;
    height: number;
    flap: number;
    boneDark: string;
    boneLight: string;
    webDark: string;
    webMain: string;
    webLight: string;
    webGlow?: string;
  },
): void {
  p.setPart(SPRITE_PART.BACK_ACC);
  const fl = opts.flap;
  const drawSide = (dir: -1 | 1, span: number) => {
    const shX = cx + dir * 4;
    const shY = cy;
    const topX = cx + dir * Math.round(span * 0.86);
    const topY = cy - Math.round(opts.height * 0.7) + fl;
    const tipX = cx + dir * span;
    const tipY = cy - Math.round(opts.height * 0.08) + Math.round(fl * 1.15);
    const midLobeX = cx + dir * Math.round(span * 0.65);
    const midLobeY = cy + Math.round(opts.height * 0.38) + Math.round(fl * 0.55);
    const innerLobeX = cx + dir * Math.round(span * 0.34);
    const innerLobeY = cy + Math.round(opts.height * 0.46) + Math.round(fl * 0.25);

    // 凹弧蝠翼剪影
    p.poly(
      [
        [shX, shY],
        [topX, topY],
        [tipX, tipY],
        [Math.round((tipX + midLobeX) * 0.5) - dir * 2, Math.round((tipY + midLobeY) * 0.5) - 2],
        [midLobeX, midLobeY],
        [Math.round((midLobeX + innerLobeX) * 0.5) - dir * 1, Math.round((midLobeY + innerLobeY) * 0.5) - 2],
        [innerLobeX, innerLobeY],
        [shX, shY + 5],
      ],
      opts.webDark,
    );

    // 饱满明艳绯红翼膜主面
    p.poly(
      [
        [shX + dir * 2, shY + 1],
        [Math.round((shX + topX) * 0.56), Math.round((shY + topY) * 0.56) + 1],
        [Math.round((topX + tipX) * 0.52) - dir * 2, Math.round((topY + tipY) * 0.52) + 1],
        [midLobeX - dir * 2, midLobeY - 2],
        [innerLobeX, innerLobeY - 2],
      ],
      opts.webMain,
    );
    // 左上受光亮绯红区
    p.poly(
      [
        [shX + dir * 3, shY + 1],
        [Math.round((shX + topX) * 0.58), Math.round((shY + topY) * 0.58) + 2],
        [Math.round((shX + midLobeX) * 0.52), Math.round((shY + midLobeY) * 0.55)],
      ],
      opts.webLight,
    );

    // 锐利黑红指骨脉络
    p.bezierRibbon([shX, shY], [Math.round((shX + topX) * 0.5), topY - 2], [topX, topY], 2.5, 1.2, opts.boneDark);
    p.bezierRibbon([topX, topY], [Math.round((topX + tipX) * 0.55), Math.round((topY + tipY) * 0.45)], [tipX, tipY], 1.8, 0.7, opts.boneDark);
    p.line(topX, topY, midLobeX, midLobeY, opts.boneDark, 1);
    p.line(Math.round((shX + topX) * 0.55), Math.round((shY + topY) * 0.55), innerLobeX, innerLobeY, opts.boneDark, 1);
    p.line(shX + dir * 2, shY - 1, topX - dir * 1, topY + 1, opts.boneLight, 1);
    if (opts.webGlow) {
      p.px(topX, topY, opts.webGlow, true);
      p.px(tipX, tipY, opts.webGlow, true);
    }
  };

  drawSide(-1, opts.leftSpan);
  drawSide(1, opts.rightSpan);
}

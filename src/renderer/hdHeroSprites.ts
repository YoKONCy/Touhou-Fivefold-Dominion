/**
 * 64×72 新一代 v3 精雕萌系像素立绘样板谱（博丽灵梦 & 蕾米莉亚·斯卡雷特）
 *
 * v3 集大成融合突破：
 * - 真实 3/4 优雅侧身站姿 + 一前一后斜错步双腿 + 窄溜肩萌系体态
 * - 干净大色块像素集群（零斑马条纹裙、零竖条栅栏刘海）+ 明艳饱满东方高饱和配色
 * - 4×4 柔美弧睫宝石大眼（纯白大星光 + 清澈眼白 + 下虹膜荧光 + 柔粉苹果腮红 + 俏皮小嘴）
 * - 优雅流畅手臂与宽振袖/泡泡袖，彻底消灭“拳击手套袖”与“蟹钳折臂”！
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawCuteRibbonBow64,
  drawGothicBatWings64,
  drawKawaiiHead64,
  drawSlashArc64,
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

/** 饱满发光灵力勾玉（高饱和通透玉色 + 晶亮核心灵孔！） */
function drawMagatama64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  dark: string,
  main: string,
  hi: string,
  hole: string,
  flipTail: 1 | -1,
): void {
  p.setPart(SPRITE_PART.GLOW_FX);
  p.ellipse(cx, cy - 2, 3.0, 2.8, dark, true);
  p.ellipse(cx, cy - 2.3, 2.1, 1.9, main, true);
  p.px(cx - 1, cy - 3, hi, true);
  p.px(cx, cy - 4, hi, true);
  p.bezierRibbon(
    [cx + flipTail * 1.8, cy - 1],
    [cx + flipTail * 3.2, cy + 2.2],
    [cx - flipTail * 1.3, cy + 3.6],
    2.6,
    0.8,
    dark,
    true,
  );
  p.bezierRibbon(
    [cx + flipTail * 1.6, cy - 1],
    [cx + flipTail * 2.5, cy + 1.8],
    [cx - flipTail * 0.9, cy + 3.1],
    1.5,
    0.5,
    main,
    true,
  );
  p.px(cx, cy - 2, hole, true);
}

/** 1. 博丽灵梦（64×72 v3 精雕样板） */
export const HD_HERO_REIMU_SPEC: SpriteRigSpec = {
  width: HD_SPRITE_WIDTH,
  height: HD_SPRITE_HEIGHT,
  originX: HD_ORIGIN_X,
  originY: HD_ORIGIN_Y,
  renderScale: HD_RENDER_SCALE,
  backdropTop: '#161029',
  backdropBottom: '#33162e',
  backdropGlow: '#ff5274',
  avatarCrop: { x: 14, y: 5, size: 36 },
  portraitCrop: { x: 4, y: 3, w: 56, h: 64 },
  draw: () => {},
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx =
      isAtk && (f === 1 || f === 2)
        ? 28
        : isAtk && f === 0
          ? 27
          : Math.round(31 + pose.leanX * 0.9);
    const by = Math.round(pose.breathY * 1.2 - pose.stepLift * 1.2);
    const sway = pose.flutter * 1.7;
    const headY = 23 + by;

    // [1] 后景：挺括宏大的 3/4 博丽大红蝴蝶结（略微上提完全展露于发冠上方，招牌巫女剪影！）
    drawCuteRibbonBow64(p, bx - 1, headY - 12, {
      leftSpan: 15,
      rightSpan: 13,
      wingHeight: 11,
      tailLen: 17,
      sway,
      dark: '#a81434',
      main: '#eb2f52',
      light: '#ff758f',
      trim: '#fff5ed',
      part: SPRITE_PART.BACK_ACC,
    });

    // [2] 丰盈柔顺乌黑长发背影（大色块干净体积 + 飘逸收尖后发尾）
    p.setPart(SPRITE_PART.BACK_HAIR);
    const backTailY = 44 + by;
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 10 - sway * 0.5, 38 + by],
        [bx + 6 - sway * 0.6, backTailY],
        [bx - 8 + sway * 0.7, backTailY + 1],
        [bx - 12 + sway * 0.7, 38 + by],
      ],
      '#1e132e',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 8 - sway * 0.4, 37 + by],
        [bx - 9 + sway * 0.5, 38 + by],
      ],
      '#302047',
    );
    p.bezierRibbon([bx - 9, headY + 6], [bx - 12 + sway * 0.5, 39 + by], [bx - 13 + sway, backTailY + 2], 4.2, 1.1, '#1e132e');
    p.bezierRibbon([bx - 8, headY + 6], [bx - 10 + sway * 0.4, 37 + by], [bx - 10 + sway * 0.7, backTailY - 3], 1.8, 0.6, '#523b78');

    // [3] 真实 3/4 斜错步雪白足袋 + 鲜红系带草履（后脚偏左上踩实、前脚偏右下优雅微迈！）
    drawStaggeredLegs64(p, bx, 51, 65, pose, {
      sockShadow: '#d9ced8',
      sockLight: '#fffaf7',
      shoeDark: '#9e1534',
      shoeMain: '#eb2a4e',
      shoeHighlight: '#fff0d6',
    });

    // [4] 左后臂：优雅修长分体宽振袖（先露娇俏裸肩小臂，再自然垂出秀气宽白袖，绝非拳击手套！）
    p.setPart(SPRITE_PART.BACK_ARM);
    const backSwing = isAtk && f === 1 ? -4 : isHit ? -2 : Math.round(-pose.armAction * 3.0 - pose.stride * 2);
    // 娇俏露肩小臂肌肤
    p.line(bx - 4, 34 + by, bx - 8 + Math.round(backSwing * 0.4), 36 + by, '#ffe0cc', 3);
    p.line(bx - 7 + Math.round(backSwing * 0.4), 34 + by, bx - 8 + Math.round(backSwing * 0.4), 37 + by, '#e82a4d', 2);
    // 流畅垂坠的宽振袖（上窄下柔和展开 + 干净两阶暖白明暗！）
    p.poly(
      [
        [bx - 7 + Math.round(backSwing * 0.4), 36 + by],
        [bx - 13 + backSwing, 38 + by],
        [bx - 16 + backSwing, 46 + by],
        [bx - 11 + backSwing, 48 + by],
        [bx - 7 + Math.round(backSwing * 0.5), 44 + by],
      ],
      '#ded2dc',
    );
    p.poly(
      [
        [bx - 7 + Math.round(backSwing * 0.4), 36 + by],
        [bx - 12 + backSwing, 38 + by],
        [bx - 14 + backSwing, 45 + by],
        [bx - 9 + Math.round(backSwing * 0.5), 44 + by],
      ],
      '#fffaf7',
    );
    // 振袖底缘红边
    p.bezierRibbon(
      [bx - 16 + backSwing, 46 + by],
      [bx - 12 + backSwing, 48 + by],
      [bx - 8 + Math.round(backSwing * 0.5), 45 + by],
      1.8,
      1.4,
      '#e32449',
    );
    // 袖口探出的娇小柔嫩小手
    p.ellipse(bx - 15 + backSwing, 42 + by, 1.7, 1.7, '#ffe0cc');

    // [5] 干净大色块 3/4 波浪朱红巫女袴裙（2 道柔和宽垂褶 + 鲜亮朱红 + 弯曲白金滚边 + 柔和白衬裙！）
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 40 + by,
      waistW: 10,
      hemY: 51 + by,
      hemW: 29,
      tiltRight: 1.0,
      archDepth: 2.5,
      waveLobes: 3.5,
      waveAmp: 1.5,
      swayX: -pose.leanX * 0.5 + sway * 0.8,
      colors: {
        deep: '#91112e',
        shadow: '#c71d40',
        main: '#eb2d4f',
        light: '#ff5272',
        highlight: '#ff8ca1',
      },
      trimBand: {
        offsetFromHem: 2.0,
        thickness: 1.3,
        color: '#fff6eb',
        shadowColor: '#e0ccd4',
      },
      petticoat: {
        peekDepth: 2.0,
        shade: '#d6cad9',
        main: '#fff8f5',
        highlight: '#ffffff',
      },
    });

    // [6] 3/4 窄溜肩鲜红巫女服上衣 + 雪白翻领 + 金黄领巾 + 洁白细腰带
    p.setPart(SPRITE_PART.TORSO);
    // 窄肩修身红褂（比旧版收窄 2px，立出娇小少女肩线！）
    p.poly(
      [
        [bx - 5, 32 + by],
        [bx + 5, 32 + by],
        [bx + 6, 40 + by],
        [bx - 5, 40 + by],
      ],
      '#d41f42',
    );
    p.poly(
      [
        [bx - 4, 32 + by],
        [bx + 4, 32 + by],
        [bx + 4, 39 + by],
        [bx - 4, 39 + by],
      ],
      '#f2385a',
    );
    // 3/4 偏右洁白和服交领
    p.poly(
      [
        [bx - 3, 31 + by],
        [bx + 5, 31 + by],
        [bx + 2, 36 + by],
        [bx, 36 + by],
      ],
      '#fffaf7',
    );
    // 明亮暖金领结与细白腰带
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly([[bx - 2, 35 + by], [bx + 1, 36 + by], [bx - 2, 38 + by]], '#f2b830');
    p.poly([[bx + 4, 35 + by], [bx + 1, 36 + by], [bx + 4, 38 + by]], '#ffe066');
    p.px(bx + 1, 36 + by, '#fff8cc');
    p.hline(bx - 5, 40 + by, 11, '#fff5ed');
    p.hline(bx - 4, 40 + by, 7, '#ffffff');

    // [7] 2.3 头身圆润萌系少女脸 + 璀璨水灵 4×4 赤红宝石大眼 + 苹果腮红！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff5ed',
      skinMain: '#ffe0cc',
      skinShade: '#e8ad99',
      lashColor: '#29122e',
      irisDark: '#8f0f30',
      irisMid: '#e6224c',
      irisGlow: '#ff8ca6',
      blushColor: '#ff91ad',
    });

    // 干净大块乌黑紫光萌发 + 空气大三角额头
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#1d132e',
      dark: '#2b1c42',
      mid: '#402c61',
      light: '#644991',
      spec: '#a68fd4',
      leftLockLen: 12,
      rightLockLen: 11,
      fluff: 2,
      sway,
    });

    // 灵梦招牌双鬓白纸垂发管 + 鲜红细带
    p.setPart(SPRITE_PART.HEADWEAR);
    p.rect(bx - 11, headY + 4, 3, 6, '#efe6ed');
    p.vline(bx - 10, headY + 4, 6, '#ffffff');
    p.hline(bx - 11, headY + 5, 3, '#eb2a4e');
    p.rect(bx + 8, headY + 4, 3, 6, '#efe6ed');
    p.vline(bx + 9, headY + 4, 6, '#ffffff');
    p.hline(bx + 8, headY + 5, 3, '#eb2a4e');

    // [8] 右前臂宽振袖 + 利落三折大御币（流畅衔接，零遮脸！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    let handX = bx + 11;
    let handY = 39 + by - Math.round(pose.armAction * 3);
    if (isAtk && f === 0) {
      handX = bx + 9;
      handY = 27 + by;
    } else if (isAtk && (f === 1 || f === 2)) {
      handX = bx + 15;
      handY = 36 + by;
    }

    p.line(bx + 5, 33 + by, handX - 2, handY - 1, '#ffe0cc', 3);
    p.line(bx + 6, 33 + by, bx + 7, 36 + by, '#e82a4d', 2);
    p.poly(
      [
        [bx + 6, 34 + by],
        [handX, handY - 2],
        [handX + 1, handY + 5],
        [bx + 8, handY + 7],
        [bx + 5, 40 + by],
      ],
      '#fffaf7',
    );
    p.line(bx + 8, handY + 6, handX + 1, handY + 5, '#e82a4d', 2);
    p.ellipse(handX, handY, 1.9, 1.9, '#ffe0cc');

    // 博丽大御币（严格穿过掌心 + 环握手指压在木柄前层，自然真握持！）
    p.setPart(SPRITE_PART.WEAPON);
    if (isAtk && f === 0) {
      p.line(handX - 2, handY + 5, handX + 5, 11 + by, '#9e5d24', 2);
      p.line(handX - 1, handY + 4, handX + 5, 12 + by, '#e6a552', 1);
      p.bezierRibbon([handX + 5, 12 + by], [handX + 12, 16 + by], [handX + 12, 26 + by], 4, 1.8, '#fffaf7');
      p.bezierRibbon([handX + 4, 14 + by], [handX + 9, 19 + by], [handX + 9, 25 + by], 2.2, 1.0, '#dfd1d9');
    } else if (isAtk && (f === 1 || f === 2)) {
      const tipX = Math.min(58, handX + 18);
      const tipY = handY - 9;
      p.line(handX - 4, handY + 2, tipX, tipY, '#9e5d24', 2);
      p.line(handX - 3, handY + 1, tipX, tipY, '#ebaa57', 1);
      p.bezierRibbon([tipX - 2, tipY + 1], [tipX + 2, tipY + 9], [tipX - 3, tipY + 16], 4, 1.5, '#ffffff', true);
      drawSlashArc64(p, bx + 14, 34 + by, 18, 17, -1.15, 0.85, '#ff2652', '#ffd966', '#ffffff');
    } else {
      const dx = 7;
      const dy = -21;
      const tipX = handX + dx;
      const tipY = handY + dy;
      const botX = handX - Math.round(dx * 0.28);
      const botY = handY - Math.round(dy * 0.28);
      p.line(botX, botY, tipX, tipY, '#9e5d24', 2);
      p.line(botX + 1, botY - 1, tipX, tipY, '#ebaa57', 1);
      p.poly(
        [
          [tipX, tipY + 1],
          [tipX + 6, tipY + 4],
          [tipX + 4, tipY + 8],
          [tipX + 8, tipY + 11],
          [tipX + 5, tipY + 16],
          [tipX + 2, tipY + 13],
          [tipX + 3, tipY + 9],
          [tipX, tipY + 6],
        ],
        '#fffaf7',
      );
      p.line(tipX + 1, tipY + 4, tipX + 4, tipY + 6, '#dfd0d8', 1);
      p.line(tipX + 3, tipY + 10, tipX + 6, tipY + 12, '#dfd0d8', 1);
    }
    // 压在木柄正面的环握纤纤玉指（杜绝木柄切穿手掌！）
    p.setPart(SPRITE_PART.WEAPON);
    p.rect(handX - 1, handY - 1, 3, 2, '#ffe0cc');
    p.px(handX, handY - 1, '#fff5ed');
    p.px(handX - 1, handY + 1, '#e8ad99');

    // [9] 晶亮明艳的双色灵力勾玉
    const orbBob = Math.round(Math.sin(phase) * 2.2);
    drawMagatama64(p, Math.max(7, bx - 22), 34 + by + orbBob, '#d4173f', '#ff476c', '#fff2f7', '#fff8d6', 1);
    if (!isAtk || f === 3) {
      drawMagatama64(p, Math.min(57, bx + 22), 45 + by - orbBob, '#12ab84', '#42f5c0', '#e6fff8', '#ffffff', -1);
    }
  },
};

/** 2. 蕾米莉亚·斯卡雷特（64×72 v3 精雕样板） */
export const HD_HERO_REMILIA_SPEC: SpriteRigSpec = {
  width: HD_SPRITE_WIDTH,
  height: HD_SPRITE_HEIGHT,
  originX: HD_ORIGIN_X,
  originY: HD_ORIGIN_Y,
  renderScale: HD_RENDER_SCALE,
  backdropTop: '#210716',
  backdropBottom: '#47102b',
  backdropGlow: '#ff4275',
  avatarCrop: { x: 14, y: 4, size: 36 },
  portraitCrop: { x: 4, y: 2, w: 56, h: 64 },
  draw: () => {},
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx = isAtk && (f === 1 || f === 2) ? 26 : Math.round(30 + pose.leanX * 0.85);
    const by = Math.round(pose.breathY * 1.3 - pose.stepLift * 1.2 - 1);
    const flap = Math.round(Math.sin(phase) * 3.0 + pose.flutter * 1.4);
    const sway = pose.flutter * 1.6;
    const headY = 23 + by;

    // [1] 后景：高饱和华丽猩红恶魔蝠翼（3/4 侧透视：左翼宏展、右翼略收，明艳深红翼膜绝不发灰！）
    drawGothicBatWings64(p, bx - 1, 35 + by, {
      leftSpan: 24,
      rightSpan: 17,
      height: 18,
      flap,
      boneDark: '#260821',
      boneLight: '#cf2b67',
      webDark: '#5c0e3a',
      webMain: '#b81d55',
      webLight: '#e33b76',
      webGlow: '#ff6e9c',
    });

    // [2] 梦幻鲜亮冰蓝紫微卷蓬松 Bob 后发（微微外翘发尾，清新亮丽绝不发灰！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.ellipse(bx - 0.5, headY + 3, 11.2, 7.6, '#5878c4');
    p.ellipse(bx - 1, headY + 2, 9.6, 6.4, '#88abf2');
    // 左右微翘可爱发尾
    p.bezierRibbon([bx - 8, headY + 4], [bx - 12 + sway * 0.4, headY + 9], [bx - 14 + sway * 0.7, headY + 12], 5.2, 1.5, '#5878c4');
    p.bezierRibbon([bx - 8, headY + 4], [bx - 11 + sway * 0.4, headY + 8], [bx - 12.5 + sway * 0.6, headY + 10.5], 2.8, 0.8, '#a6c4ff');
    p.bezierRibbon([bx + 7, headY + 4], [bx + 11 - sway * 0.3, headY + 9], [bx + 12 - sway * 0.5, headY + 11], 4.4, 1.3, '#5878c4');

    // [3] 真实 3/4 斜错步雪白中筒袜 + 鲜红金扣玛丽珍鞋！
    drawStaggeredLegs64(p, bx, 51, 65, pose, {
      sockShadow: '#d8cfe8',
      sockLight: '#ffffff',
      shoeDark: '#9e0e35',
      shoeMain: '#eb1f54',
      shoeHighlight: '#ffe899',
      skinColor: '#ffe4d8',
    });

    // [4] 左后臂：端正雪白泡泡袖 + 红丝带袖口 + 柔和 2px 双色少女小臂托举绯红命运魔珠
    p.setPart(SPRITE_PART.BACK_ARM);
    p.ellipse(bx - 6.8, 34.5 + by, 3.0, 2.6, '#d6c6e6');
    p.ellipse(bx - 7.0, 34.0 + by, 2.2, 1.9, '#ffffff');
    p.line(bx - 9, 35 + by, bx - 7, 37 + by, '#e81c4f', 1);
    // 严格 2px 软萌少女小臂（上沿受光亮肤 + 下沿微暖投影，既不火柴也不壮汉！）
    p.line(bx - 8, 36 + by, bx - 13, 38 + by, '#efc2b6', 2);
    p.line(bx - 8, 36 + by, bx - 13, 37 + by, '#ffe8de', 1);
    p.rect(bx - 15, 36 + by, 3, 2, '#ffe8de');
    p.px(bx - 14, 36 + by, '#fff7f2');
    // 悬浮在左手上方的晶亮绯红命运宝珠
    p.setPart(SPRITE_PART.GLOW_FX);
    const orbY = 32 + by + Math.round(Math.sin(phase) * 1.8);
    p.ellipse(bx - 16, orbY, 2.7, 2.7, '#e8174b', true);
    p.ellipse(bx - 16, orbY - 0.5, 1.6, 1.6, '#ff7da3', true);
    p.px(bx - 17, orbY - 1, '#ffffff', true);

    // [5] 干净大色块樱粉哥特萝莉蓬蓬蛋糕裙（2 道柔和宽垂褶 + 鲜红弯弧丝带 + 柔和探出白蕾丝衬裙！）
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 39 + by,
      waistW: 10,
      hemY: 50 + by,
      hemW: 31,
      tiltRight: 1.0,
      archDepth: 2.6,
      waveLobes: 3.5,
      waveAmp: 1.7,
      swayX: -pose.leanX * 0.5 + sway * 0.85,
      colors: {
        deep: '#c474a1',
        shadow: '#e6a8ca',
        main: '#ffd9ed',
        light: '#fff0f8',
        highlight: '#ffffff',
      },
      trimBand: {
        offsetFromHem: 2.2,
        thickness: 1.5,
        color: '#e81c4f',
        shadowColor: '#ad1038',
      },
      petticoat: {
        peekDepth: 2.4,
        shade: '#d6c8e6',
        main: '#fcf7ff',
        highlight: '#ffffff',
      },
    });

    // [6] 3/4 娇小窄溜肩樱白洋装上衣 + 鲜红束腰缎带 + 胸口立体红蝴蝶结
    p.setPart(SPRITE_PART.TORSO);
    p.poly(
      [
        [bx - 5, 32 + by],
        [bx + 5, 32 + by],
        [bx + 6, 39 + by],
        [bx - 5, 39 + by],
      ],
      '#f5cce2',
    );
    p.poly(
      [
        [bx - 4, 32 + by],
        [bx + 4, 32 + by],
        [bx + 5, 39 + by],
        [bx - 4, 39 + by],
      ],
      '#fff5fa',
    );
    p.hline(bx - 3, 32 + by, 7, '#ffffff');
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.hline(bx - 5, 39 + by, 11, '#d91848');
    p.hline(bx - 4, 39 + by, 8, '#ff4d7d');
    drawCuteRibbonBow64(p, bx + 1, 35 + by, {
      leftSpan: 4.5,
      rightSpan: 4.0,
      wingHeight: 4,
      tailLen: 6,
      sway: sway * 0.5,
      dark: '#9e0e33',
      main: '#eb1c4f',
      light: '#ff7096',
      part: SPRITE_PART.APRON_WAIST,
    });
    p.px(bx + 1, 35 + by, '#ffe899', true);

    // [7] 2.3 头身娇俏圆润红魔大小姐脸 + 水灵璀璨 4×4 赤红宝石大眼 + 苹果腮红 + 傲娇小虎牙！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff7f2',
      skinMain: '#ffe6dc',
      skinShade: '#e8b3ad',
      lashColor: '#2e1028',
      irisDark: '#990b30',
      irisMid: '#eb1c4f',
      irisGlow: '#ff8aa8',
      blushColor: '#ff94b3',
      vampireFang: true,
    });

    // 清新明艳冰紫蓝大块蓬松萌发
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#4b68b3',
      dark: '#6788d6',
      mid: '#8cb0f5',
      light: '#bdd6ff',
      spec: '#f2f7ff',
      leftLockLen: 10,
      rightLockLen: 9,
      fluff: 1,
      bobFlare: true,
      sway,
    });

    // [8] 精雕立体抓褶哥特蕾丝 ZUN 帽（4 阶丝绸色阶抓褶蓬冠 + 收腰猩红缎带 + 波浪蕾丝荷叶檐 + 纤巧金扣侧结！）
    p.setPart(SPRITE_PART.HEADWEAR);
    const hatCx = bx - 0.5;
    const hatY = headY - 9.5;

    // 8a. 柔和外展的波浪蕾丝荷叶帽檐（5 瓣柔美褶浪，带褶谷紫影与雪白蕾丝外沿！）
    for (let x = Math.floor(hatCx - 11); x <= Math.ceil(hatCx + 11); x++) {
      const u = (x - hatCx) / 11;
      if (Math.abs(u) > 1) continue;
      // 3D 弧形帽檐走势：两侧略低环抱发冠，中央微微柔弧
      const brimArc = u * u * 1.6;
      const frillWave = Math.sin((u + 1) * 0.5 * 5 * Math.PI);
      const frillAmp = Math.abs(frillWave);
      const topY = Math.round(hatY - 0.5 + brimArc);
      const botY = Math.round(hatY + 2.2 + brimArc + frillAmp * 1.4);
      for (let y = topY; y <= botY; y++) {
        let col = '#fceef7';
        if (y === topY || frillAmp < 0.24) col = '#c8b2d9';
        else if (u > 0.35 || frillAmp < 0.45) col = '#e6d3ef';
        else if (y === botY && frillAmp > 0.5) col = '#ffffff';
        p.px(x, y, col);
      }
    }

    // 8b. 饱满蓬松抓褶丝绸帽冠（微宽于帽带呈云朵蓬松感 + 4 道放射状软布褶 + 左上珍珠高光！）
    const crownRx = 10.6;
    const crownRy = 6.2;
    const crownCy = hatY - 2.2;
    for (let y = Math.floor(crownCy - crownRy); y <= Math.ceil(hatY + 0.5); y++) {
      for (let x = Math.floor(hatCx - crownRx); x <= Math.ceil(hatCx + crownRx); x++) {
        const dx = (x - hatCx) / crownRx;
        const dy = (y - crownCy) / crownRy;
        // 上圆蓬松、下端靠近红带处微收（真实抓褶贝雷帽轮廓！）
        const pinch = dy > 0 ? 1 + dy * 0.28 : 1;
        if (dx * dx * pinch * pinch + dy * dy > 1) continue;

        // 4 道由帽带向帽顶中心汇聚的柔和放射抓褶
        const gatherAngle = dx * 3.1 * Math.PI;
        const gatherDip = Math.max(0, Math.cos(gatherAngle)) * (dy > -0.65 ? 0.22 : 0.08);
        // 球面左上主光 + 底部紧贴红带的微微垂坠投影
        let lum = 0.66 - dx * 0.34 - dy * 0.28 - gatherDip;
        if (y >= Math.floor(hatY - 0.5)) lum -= 0.16;

        let col = '#fceef7';
        if (lum < 0.34) col = '#c5add6';
        else if (lum < 0.54) col = '#e6d4f0';
        else if (lum > 0.84) col = '#ffffff';
        p.px(x, y, col);
      }
    }

    // 8c. 收腰丝绸猩红缎带（紧贴帽冠底弧，带清晰左亮右暗丝绸反光！）
    for (let x = Math.floor(hatCx - 9); x <= Math.ceil(hatCx + 9); x++) {
      const u = (x - hatCx) / 9;
      if (Math.abs(u) > 1) continue;
      const bandY = Math.round(hatY - 0.2 + u * u * 1.4);
      const darkCol = u > 0.35 ? '#8a0c2c' : '#b8113b';
      const mainCol = u < -0.15 ? '#ff5983' : u > 0.38 ? '#c91442' : '#eb1c4f';
      p.px(x, bandY, mainCol);
      p.px(x, bandY + 1, darkCol);
      if (u > -0.55 && u < 0.05) {
        p.px(x, bandY, '#ff85a3');
      }
    }

    // 8d. 精致立体右侧大红蝴蝶结 + 金珍珠扣 + 两条纤细灵动垂带
    const bowX = Math.round(hatCx + 6.5);
    const bowY = Math.round(hatY - 0.5);
    // 纤细飘逸双尾丝带（从蝴蝶结下垂拂过右发）
    p.bezierRibbon([bowX - 1, bowY + 2], [bowX + 1, bowY + 5], [bowX + 3 + sway * 0.4, bowY + 8], 1.7, 0.8, '#b8113b');
    p.bezierRibbon([bowX + 1, bowY + 2], [bowX + 4, bowY + 4], [bowX + 5 + sway * 0.5, bowY + 7], 1.5, 0.7, '#f21f54');
    // 左右纤巧挺括结耳
    p.poly([[bowX, bowY], [bowX - 4, bowY - 3], [bowX - 5, bowY], [bowX - 3, bowY + 2]], '#b8113b');
    p.poly([[bowX - 1, bowY], [bowX - 4, bowY - 2], [bowX - 4, bowY + 1]], '#ff4d7d');
    p.px(bowX - 3, bowY - 2, '#ffa6be');
    p.poly([[bowX, bowY], [bowX + 4, bowY - 3], [bowX + 5, bowY], [bowX + 3, bowY + 2]], '#a30f35');
    p.poly([[bowX + 1, bowY], [bowX + 4, bowY - 2], [bowX + 4, bowY + 1]], '#f21f54');
    p.px(bowX + 3, bowY - 2, '#ff85a3');
    // 饱满中心结 + 金色珍珠点缀
    p.rect(bowX - 1, bowY - 1, 2, 2, '#eb1c4f');
    p.px(bowX, bowY, '#ffe899', true);

    // [9] 右前臂：端正雪白泡泡袖 + 红丝带袖口 + 柔和 2px 双色少女小臂自然持枪！
    p.setPart(SPRITE_PART.FRONT_ARM);
    p.ellipse(bx + 6.8, 34.5 + by, 3.0, 2.6, '#d6c6e6');
    p.ellipse(bx + 6.8, 34.0 + by, 2.2, 1.9, '#ffffff');

    /** 辅助绘制严格 2px 软萌双色少女小臂（上受光、下暖影，告别 1px 细狗棍与 4px 肌肉臂！） */
    const drawSoftChibiArm = (x0: number, y0: number, x1: number, y1: number) => {
      p.line(x0, y0, x1, y1, '#efc2b6', 2);
      p.line(x0, y0 - 1, x1, y1 - 1, '#ffe8de', 1);
    };

    /** 辅助在枪杆正上方绘制圆润精致的 3×2 环握玉手 */
    const drawGrippingHand = (gx: number, gy: number) => {
      p.setPart(SPRITE_PART.WEAPON);
      p.rect(gx - 1, gy - 1, 3, 2, '#ffe8de');
      p.hline(gx - 1, gy - 1, 2, '#fff7f2');
      p.hline(gx - 1, gy + 1, 2, '#e8b3ad');
    };

    if (isAtk && f === 0) {
      // 蓄力高举掷枪姿态：2px 软萌少女小臂轻盈上抬
      const handX = bx + 12;
      const handY = 27 + by;
      p.line(bx + 7, 33 + by, bx + 9, 34 + by, '#e81c4f', 1);
      drawSoftChibiArm(bx + 8, 34 + by, handX, handY + 1);
      p.setPart(SPRITE_PART.WEAPON);
      const topX = Math.min(58, handX + 13);
      const topY = handY - 15;
      const botX = handX - 7;
      const botY = handY + 8;
      p.line(botX, botY, topX, topY, '#940a2e', 3);
      p.line(botX + 1, botY - 1, topX, topY, '#ff3366', 1, true);
      p.ellipse(topX - 1, topY + 2, 2.0, 1.5, '#ffd452', true);
      p.poly(
        [
          [topX + 4, topY - 5],
          [topX - 3, topY],
          [topX + 2, topY + 4],
        ],
        '#ff1f52',
        true,
      );
      p.line(topX - 1, topY + 1, topX + 3, topY - 4, '#ffffff', 1, true);
      drawGrippingHand(handX, handY);
    } else if (isAtk && (f === 1 || f === 2)) {
      // 全力前掷冈格尼尔：2px 软萌手臂平推前伸
      const handX = bx + 13;
      const handY = 35 + by;
      p.line(bx + 8, 33 + by, bx + 8, 36 + by, '#e81c4f', 1);
      drawSoftChibiArm(bx + 9, 36 + by, handX, handY + 1);
      p.setPart(SPRITE_PART.WEAPON);
      const tipX = Math.min(61, handX + 21);
      const tipY = handY - 3;
      const botX = handX - 6;
      const botY = handY + 1;
      p.line(botX, botY, tipX - 6, tipY + 1, '#940a2e', 3);
      p.line(botX + 1, botY, tipX - 4, tipY + 1, '#ff3868', 1, true);
      p.poly(
        [
          [tipX, tipY],
          [tipX - 9, tipY - 4],
          [tipX - 7, tipY + 1],
          [tipX - 9, tipY + 6],
        ],
        '#ff1c50',
        true,
      );
      p.line(tipX - 10, tipY + 1, tipX, tipY, '#ffffff', 1, true);
      drawGrippingHand(handX, handY);
      drawSlashArc64(p, bx + 18, 34 + by, 17, 14, -0.85, 0.85, '#ff1c50', '#ff8aa8', '#ffffff');
    } else {
      // 待机/行走：2px 软萌少女小臂自然斜下垂持枪于身侧，端庄又可爱！
      const handX = bx + 11;
      const handY = 39 + by - Math.round(pose.armAction * 2.0);
      p.line(bx + 6, 36 + by, bx + 9, 35 + by, '#e81c4f', 1);
      drawSoftChibiArm(bx + 8, 37 + by, handX, handY);
      p.setPart(SPRITE_PART.WEAPON);
      const upLen = 22;
      const downLen = 21;
      const ux = 0.32;
      const spearTopX = Math.min(58, Math.round(handX + upLen * ux));
      const spearTopY = handY - upLen;
      const spearBotX = Math.round(handX - downLen * ux);
      const spearBotY = Math.min(64, handY + downLen);
      p.line(spearBotX, spearBotY, spearTopX, spearTopY, '#87092a', 3);
      p.line(spearBotX + 1, spearBotY - 1, spearTopX, spearTopY, '#ff2e63', 1, true);
      p.ellipse(spearTopX - 1, spearTopY + 3, 2.2, 1.5, '#ffd452', true);
      p.poly(
        [
          [spearTopX + 2, spearTopY - 6],
          [spearTopX - 3, spearTopY + 1],
          [spearTopX, spearTopY + 4],
          [spearTopX + 4, spearTopY + 1],
        ],
        '#ff1f52',
        true,
      );
      p.line(spearTopX, spearTopY + 2, spearTopX + 2, spearTopY - 5, '#ffffff', 1, true);
      drawGrippingHand(handX, handY);
    }
  },
};

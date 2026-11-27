/**
 * 3. 魔法使（混沌 T1-B · 1×1 短程施法游击小魔女）
 * 暖橘波浪发 + 歪尖星辰紫帽 + 星火魔法扫帚 + 魔导星矢。
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawSparkStar64, drawWrappedHand, HD_BASE } from './helpers';

/** 魔法使（creature_broom_caster）HD 像素绘谱 */
export const CREATURE_BROOM_CASTER_RIG_SPEC: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#160f29',
  backdropBottom: '#381c26',
  backdropGlow: '#ffb347',
  avatarCrop: { x: 14, y: 4, size: 36 },
  portraitCrop: { x: 4, y: 3, w: 56, h: 64 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx = isAtk && (f === 1 || f === 2) ? 27 : Math.round(30 + pose.leanX * 0.85);
    // 严控上浮幅度确保行走帧紫帽尖 100% 零贴顶裁切！
    const by = Math.max(-1, Math.round(pose.breathY * 1.05 - pose.stepLift * 0.55 + (isMove ? -1 : 0)));
    const sway = pose.flutter * 1.5;
    const headY = 26 + by;

    // [1] 蓬松俏皮「暖橘蜂蜜波浪卷后发」
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.ellipse(bx - 1, headY + 4, 11.5, 8.2, '#993e12');
    p.ellipse(bx - 9 + sway * 0.6, headY + 10, 4.8, 5.6, '#d96a21');
    p.ellipse(bx - 10 + sway * 0.6, headY + 9, 2.8, 3.4, '#ff9e42');
    p.ellipse(bx + 8 - sway * 0.5, headY + 10, 4.4, 5.2, '#d96a21');
    p.ellipse(bx + 8 - sway * 0.5, headY + 9, 2.4, 3.0, '#ff9e42');

    // [2] 3/4 斜错步奶白短袜 + 绛紫橙边小魔女短靴
    drawStaggeredLegs64(p, bx, 54, 66, pose, {
      sockShadow: '#d9cfe8',
      sockLight: '#fff8f2',
      shoeDark: '#2c184a',
      shoeMain: '#5a3394',
      shoeHighlight: '#ffb84d',
    });

    // [3] 紫罗兰星辰荷叶边小魔女短裙 + 暖橙金滚边 + 洁白小围裙！
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 43 + by,
      waistW: 11,
      hemY: 54 + by,
      hemW: 28,
      tiltRight: 1.0,
      archDepth: 2.3,
      waveLobes: 3.5,
      waveAmp: 1.5,
      swayX: -pose.leanX * 0.5 + sway * 0.75,
      colors: {
        deep: '#241342',
        shadow: '#3e2170',
        main: '#6035a8',
        light: '#8554d6',
        highlight: '#b48cff',
      },
      trimBand: {
        offsetFromHem: 2.0,
        thickness: 1.4,
        color: '#ffb53d',
        shadowColor: '#c97618',
      },
      petticoat: {
        peekDepth: 2.0,
        shade: '#dbd0e8',
        main: '#fff9f2',
        highlight: '#ffffff',
      },
    });
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly([[bx - 4, 43 + by], [bx + 4, 43 + by], [bx + 6, 50 + by], [bx, 52 + by], [bx - 5, 50 + by]], '#ffffff');
    p.hline(bx - 5, 43 + by, 10, '#ff9a2e');

    // [4] 深紫罗兰小魔女短褂 + 白蕾丝领 + 暖橙蝴蝶领结
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 35 + by], [bx + 5, 35 + by], [bx + 6, 43 + by], [bx - 5, 43 + by]], '#341c5e');
    p.poly([[bx - 4, 35 + by], [bx + 4, 35 + by], [bx + 4, 42 + by], [bx - 4, 42 + by]], '#552f94');
    p.hline(bx - 4, 35 + by, 8, '#ffffff');
    p.rect(bx - 2, 37 + by, 5, 2, '#ff8d24');
    p.px(bx, 37 + by, '#ffe878');

    // [5] 左后臂：淡紫泡泡袖 + 2px 软萌少女小臂
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 37 + by, '#46267a', '#7c4cc7', '#ffb53d', 'left');
    const lHoldX = bx - 8;
    const lHoldY = 45 + by;
    drawSoftChibiArm64(p, bx - 7, 38 + by, lHoldX, lHoldY, '#fff3eb', '#e6ad99');

    // [6] 活泼元气圆脸 + 明亮翡翠碧绿 4×4 大眼 + 暖橘蓬松空气刘海
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff6ee',
      skinMain: '#ffe2ce',
      skinShade: '#e8ad99',
      lashColor: '#2e1638',
      irisDark: '#12704a',
      irisMid: '#24c479',
      irisGlow: '#a8ffbf',
      blushColor: '#ff94b0',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#9e4114',
      dark: '#cf611f',
      mid: '#f78d31',
      light: '#ffbf5e',
      spec: '#fff0b8',
      leftLockLen: 10,
      rightLockLen: 9,
      fluff: 1,
      bobFlare: true,
      sway,
    });

    // [7] 歪折紫罗兰星辰魔女帽 + 随相位轻摆的垂落小金星吊坠！（严格在 y>=5 零裁顶！）
    p.setPart(SPRITE_PART.HEADWEAR);
    const hatY = headY - 8;
    p.ellipse(bx, hatY, 16.0, 3.5, '#231340');
    p.ellipse(bx - 0.5, hatY - 0.6, 14.3, 2.4, '#4c2985');
    p.bezierRibbon([bx - 12, hatY - 1], [bx - 2, hatY - 2.5], [bx + 9, hatY - 1.5], 1.4, 0.9, '#8c57e0');
    const tipX = Math.max(8, bx - 12 + Math.round(sway * 0.6));
    const peakY = Math.max(5, hatY - 11);
    const tipY = Math.max(7, hatY - 8);
    p.poly(
      [
        [bx - 9, hatY - 1],
        [bx + 9, hatY - 1],
        [bx + 3, peakY + 2],
        [bx - 5, peakY],
        [tipX, tipY],
        [bx - 10, hatY - 5],
      ],
      '#2c1852',
    );
    p.poly(
      [
        [bx - 7, hatY - 1],
        [bx + 6, hatY - 1],
        [bx + 1, peakY + 3],
        [bx - 4, peakY + 1],
        [tipX + 2, tipY + 1],
      ],
      '#5c34a1',
    );
    p.line(bx - 4, peakY + 1, bx + 2, peakY + 4, '#9d6bf0', 1);
    p.rect(bx - 8, hatY - 4, 16, 3, '#eb8624');
    p.hline(bx - 8, hatY - 4, 16, '#ffd259');
    p.rect(bx + 1, hatY - 5, 5, 4, '#ffe878');
    p.rect(bx + 2, hatY - 4, 3, 2, '#5c34a1');
    // 帽尖垂挂轻摆金星吊坠
    const starSwing = Math.round(Math.sin(phase) * 1.0);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.line(tipX, tipY + 1, tipX + starSwing, tipY + 4, '#ffd259', 1, true);
    drawSparkStar64(p, tipX + starSwing, tipY + 5, 2, '#ffe878');

    // [8] 双手前持「星火魔法木扫帚」+ 脉冲炽橙魔火球 + 魔导星矢！
    const swing = isAtk && (f === 1 || f === 2) ? 5 : isAtk && f === 0 ? -3 : 0;
    const tipBroomX = Math.min(52, bx + 17 + swing);
    const tipBroomY = 35 + by - Math.round(pose.armAction * 4);
    const tailBroomX = Math.max(7, bx - 16);
    const tailBroomY = 50 + by + Math.round(pose.armAction * 2);

    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 37 + by, '#46267a', '#7c4cc7', '#ffb53d', 'right');
    const rHoldX = bx + 10;
    const rHoldY = 40 + by - Math.round(pose.armAction * 2);
    drawSoftChibiArm64(p, bx + 8, 38 + by, rHoldX, rHoldY, '#fff3eb', '#e6ad99');

    p.setPart(SPRITE_PART.WEAPON);
    p.line(tailBroomX, tailBroomY, tipBroomX, tipBroomY, '#6e3d1c', 3);
    p.line(tailBroomX + 1, tailBroomY - 1, tipBroomX, tipBroomY - 1, '#c77f3c', 1);
    p.poly(
      [
        [tailBroomX + 2, tailBroomY - 4],
        [Math.max(3, tailBroomX - 7), tailBroomY - 2],
        [Math.max(4, tailBroomX - 6), tailBroomY + 7],
        [tailBroomX + 4, tailBroomY + 4],
      ],
      '#b8741d',
    );
    p.poly(
      [
        [tailBroomX + 1, tailBroomY - 3],
        [Math.max(4, tailBroomX - 5), tailBroomY - 1],
        [Math.max(5, tailBroomX - 4), tailBroomY + 5],
        [tailBroomX + 3, tailBroomY + 3],
      ],
      '#ffd954',
    );
    p.line(tailBroomX + 1, tailBroomY - 4, tailBroomX + 4, tailBroomY + 4, '#e62e4d', 2);
    drawWrappedHand(p, lHoldX, lHoldY);
    drawWrappedHand(p, rHoldX, rHoldY);

    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(Math.max(3, tailBroomX - 7), tailBroomY + 2 + Math.round(sway * 0.5), '#ffe878', true);
    p.px(Math.max(4, tailBroomX - 4), tailBroomY + 9 - Math.round(sway * 0.5), '#ff7b29', true);

    const orbPulse = Math.sin(phase) * 0.45;
    const orbR = (isAtk && f === 0 ? 4.4 : 3.3) + orbPulse;
    p.ellipse(tipBroomX + 2, tipBroomY - 1, orbR, orbR, '#ff5924', true);
    p.ellipse(tipBroomX + 2, tipBroomY - 1, orbR * 0.6, orbR * 0.6, '#ffe466', true);
    p.px(tipBroomX + 2, tipBroomY - 1, '#ffffff', true);

    if (isAtk && (f === 1 || f === 2)) {
      // 璀璨混沌「魔导星矢」星尖魔弹与尾流（严格限幅 x<=59 零右裁切！）
      const endX = Math.min(58, tipBroomX + 13);
      p.poly([[tipBroomX + 3, tipBroomY - 4], [endX, tipBroomY - 1], [tipBroomX + 3, tipBroomY + 2]], '#ff4d24', true);
      p.poly([[tipBroomX + 4, tipBroomY - 2], [endX - 1, tipBroomY - 1], [tipBroomX + 4, tipBroomY + 1]], '#fff6a6', true);
      p.hline(tipBroomX + 4, tipBroomY - 1, Math.max(2, endX - tipBroomX - 4), '#ffffff', true);
      drawSparkStar64(p, endX - 1, tipBroomY - 1, 2, '#ffe466');
      drawSparkStar64(p, endX - 5, tipBroomY - 6, 2, '#d480ff');
      drawSparkStar64(p, endX - 5, tipBroomY + 4, 2, '#ff8838');
    }
  },
};

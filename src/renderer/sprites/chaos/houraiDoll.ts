/**
 * 4. 武装人形（混沌 T2-A · 1×1 机械绝对格挡）
 * 蓬莱人偶骑士 + 独立高位旋转黄铜发条钥 + 蓝星红宝鸢盾与篮柄骑士刺剑。
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawCuteRibbonBow64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSlashArc64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawHollowRing64, drawSparkStar64, drawWrappedHand, HD_BASE } from './helpers';

/** 武装人形（creature_hourai_doll）HD 像素绘谱 */
export const CREATURE_HOURAI_DOLL_RIG_SPEC: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0e1736',
  backdropBottom: '#251c42',
  backdropGlow: '#7dc2ff',
  avatarCrop: { x: 14, y: 5, size: 36 },
  portraitCrop: { x: 4, y: 3, w: 56, h: 64 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx = isAtk && (f === 1 || f === 2) ? 26 : Math.round(30 + pose.leanX * 0.8);
    const by = Math.round(pose.breathY * 1.15 - pose.stepLift * 1.1);
    const sway = pose.flutter * 1.4;
    const headY = 24 + by;

    // [1] 背后斜上探出的「旋转黄铜魔导发条钥」（上移至左肩后高净空，与下方蓝星鸢盾 100% 无遮挡重叠！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const keyRy = Math.max(1.8, Math.abs(Math.cos(phase)) * 3.4 + 1.6);
    const keyAx = Math.max(10, bx - 16);
    const keyAy = 29 + by;
    p.line(bx - 7, 34 + by, keyAx + 2, keyAy + 1, '#9e6b1a', 3);
    p.line(bx - 8, 33 + by, keyAx + 2, keyAy, '#ffe478', 1);
    drawHollowRing64(p, keyAx - 1, keyAy, 3.6, keyRy, 0.48, '#9e6b1a', '#e8b63a', '#fff6b8', false);

    // 柔顺奶油金卷后发
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 10 - sway * 0.4, 42 + by],
        [bx + 6 - sway * 0.5, 47 + by],
        [bx - 8 + sway * 0.6, 48 + by],
        [bx - 12 + sway * 0.6, 41 + by],
      ],
      '#a87118',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 8 - sway * 0.3, 41 + by],
        [bx - 9 + sway * 0.5, 43 + by],
      ],
      '#f2c444',
    );
    p.bezierRibbon([bx - 8, headY + 6], [bx - 11 + sway * 0.5, 39 + by], [bx - 10 + sway * 0.7, 46 + by], 2.4, 0.9, '#fff29c');

    // [2] 3/4 斜错步纯白蕾丝长筒袜 + 皇家蓝金扣玛丽珍鞋
    drawStaggeredLegs64(p, bx, 52, 66, pose, {
      sockShadow: '#d4def2',
      sockLight: '#ffffff',
      shoeDark: '#162d6e',
      shoeMain: '#2b54bd',
      shoeHighlight: '#ffe478',
    });

    // [3] 华丽多层哥特皇家蓝洛丽塔骑士裙 + 雪白蕾丝衬裙 + 纯白围裙
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 41 + by,
      waistW: 11,
      hemY: 52 + by,
      hemW: 30,
      tiltRight: 1.0,
      archDepth: 2.6,
      waveLobes: 3.5,
      waveAmp: 1.6,
      swayX: -pose.leanX * 0.5 + sway * 0.8,
      colors: {
        deep: '#142969',
        shadow: '#2246a8',
        main: '#386be0',
        light: '#689eff',
        highlight: '#add0ff',
      },
      trimBand: {
        offsetFromHem: 2.0,
        thickness: 1.3,
        color: '#ffe478',
        shadowColor: '#bd8d26',
      },
      petticoat: {
        peekDepth: 2.4,
        shade: '#ccd9f2',
        main: '#ffffff',
        highlight: '#ffffff',
      },
    });
    p.setPart(SPRITE_PART.APRON_WAIST);
    const apSway = Math.round(sway * 0.5);
    p.poly([[bx - 4, 41 + by], [bx + 4, 41 + by], [bx + 6 + apSway, 50 + by], [bx + apSway, 52 + by], [bx - 5 + apSway, 50 + by]], '#e3ecfc');
    p.poly([[bx - 3, 41 + by], [bx + 3, 41 + by], [bx + 5 + apSway, 49 + by], [bx + apSway, 51 + by], [bx - 4 + apSway, 49 + by]], '#ffffff');
    p.hline(bx - 5, 41 + by, 11, '#f0c44d');
    p.px(bx, 41 + by, '#eb2a4d');

    // [4] 蓝白紧身人偶礼服上衣 + 鲜红领结
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 33 + by], [bx + 5, 33 + by], [bx + 6, 41 + by], [bx - 5, 41 + by]], '#1e3e94');
    p.poly([[bx - 4, 33 + by], [bx + 4, 33 + by], [bx + 4, 40 + by], [bx - 4, 40 + by]], '#3562d4');
    p.rect(bx - 2, 34 + by, 5, 6, '#ffffff');
    p.rect(bx - 2, 34 + by, 5, 2, '#d92145');
    p.px(bx, 35 + by, '#ff7d96');
    p.px(bx - 1, 36 + by, '#eb2f52');
    p.px(bx + 2, 36 + by, '#c41a3b');

    // [5] 瓷娃娃精致头雕 + 蔚蓝星瞳 + 柔顺奶油金发冠 + 立体绯红丝绒大蝴蝶结发带！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#ffffff',
      skinMain: '#fff0e6',
      skinShade: '#e8b6ab',
      lashColor: '#241538',
      irisDark: '#1444ab',
      irisMid: '#3680f5',
      irisGlow: '#a6f2ff',
      blushColor: '#ff96b3',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#ad7315',
      dark: '#e0a82e',
      mid: '#fad355',
      light: '#ffed94',
      spec: '#ffffff',
      leftLockLen: 12,
      rightLockLen: 11,
      fluff: 2,
      bobFlare: true,
      sway,
    });
    p.setPart(SPRITE_PART.HEADWEAR);
    p.hline(bx - 7, headY - 9, 14, '#bf1d3d');
    drawCuteRibbonBow64(p, bx - 0.5, headY - 12, {
      leftSpan: 11,
      rightSpan: 10,
      wingHeight: 8.5,
      tailLen: 11,
      sway,
      dark: '#991230',
      main: '#e8254a',
      light: '#ff708c',
      trim: '#ffe885',
      part: SPRITE_PART.HEADWEAR,
    });

    // [6] 右前臂泡泡袖 + 「银白鎏金篮柄骑士刺剑」（严格限幅零裁边！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 35 + by, '#cfdcf5', '#ffffff', '#386be0', 'right');
    const rHandX = isAtk && (f === 1 || f === 2) ? bx + 15 : isAtk && f === 0 ? bx + 9 : bx + 11;
    const rHandY = isAtk && f === 0 ? 38 + by : isAtk && (f === 1 || f === 2) ? 37 + by : 39 + by - Math.round(pose.armAction * 2);
    drawSoftChibiArm64(p, bx + 8, 36 + by, rHandX, rHandY, '#fff0e6', '#e8b6ab');

    p.setPart(SPRITE_PART.WEAPON);
    if (isAtk && f === 0) {
      p.rect(rHandX - 1, rHandY - 2, 3, 4, '#f2c44d');
      p.line(rHandX + 1, rHandY, Math.min(56, rHandX + 15), rHandY - 5, '#8ac6ff', 2, true);
      p.line(rHandX + 2, rHandY - 1, Math.min(56, rHandX + 15), rHandY - 5, '#ffffff', 1, true);
      drawSparkStar64(p, Math.min(58, rHandX + 16), rHandY - 5, 2, '#99ebff');
    } else if (isAtk && (f === 1 || f === 2)) {
      const tipX = Math.min(59, rHandX + 19);
      p.rect(rHandX, rHandY - 2, 4, 5, '#ffe066');
      p.px(rHandX + 1, rHandY, '#eb2a4d');
      p.line(rHandX + 3, rHandY, tipX, rHandY, '#75c2ff', 2, true);
      p.hline(rHandX + 4, rHandY, Math.max(2, tipX - rHandX - 4), '#ffffff', true);
      p.setPart(SPRITE_PART.GLOW_FX);
      p.bezierRibbon([rHandX + 9, rHandY - 7], [rHandX + 13, rHandY], [rHandX + 9, rHandY + 7], 2.0, 0.8, '#8ae8ff', true);
      p.poly([[rHandX + 11, rHandY - 3], [Math.min(60, tipX + 2), rHandY], [rHandX + 11, rHandY + 3]], '#52b8ff', true);
      p.hline(rHandX + 13, rHandY, Math.max(2, Math.min(59, tipX + 1) - (rHandX + 13)), '#ffffff', true);
      drawSparkStar64(p, Math.min(57, tipX - 1), rHandY - 5, 2, '#ffe885');
      drawSparkStar64(p, Math.min(57, tipX - 1), rHandY + 5, 2, '#ffe885');
    } else {
      const tipX = Math.min(57, rHandX + 16);
      p.rect(rHandX, rHandY - 2, 4, 4, '#f2c44d');
      p.px(rHandX, rHandY + 2, '#eb2a4d');
      p.line(rHandX + 3, rHandY - 1, tipX, rHandY - 11, '#78a8eb', 2);
      p.line(rHandX + 3, rHandY - 2, tipX + 1, rHandY - 12, '#ffffff', 1, true);
      if (pose.frame % 3 === 1) {
        drawSparkStar64(p, Math.min(59, tipX + 1), rHandY - 12, 2, '#99ebff');
      }
    }
    drawWrappedHand(p, rHandX, rHandY, '#fff0e6', '#ffffff', '#e8b6ab');

    // [7] 左手精雕「白银镶金蓝星红宝鸢盾」（受击瞬间高举身前绽放绝对格挡青白结界！）
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 35 + by, '#cfdcf5', '#ffffff', '#386be0', 'left');
    const shX = isHit ? bx + 5 : isAtk && f === 0 ? bx - 7 : bx - 11;
    const shY = isHit ? 38 + by : 44 + by - Math.round(pose.armAction * 1.5);
    drawSoftChibiArm64(p, bx - 8, 36 + by, shX + 2, shY, '#fff0e6', '#e8b6ab');

    p.setPart(SPRITE_PART.WEAPON);
    p.poly([[shX - 5, shY - 6], [shX + 5, shY - 6], [shX + 5, shY + 2], [shX, shY + 9], [shX - 5, shY + 2]], '#bd8822');
    p.hline(shX - 5, shY - 6, 11, '#fff099');
    p.poly([[shX - 4, shY - 5], [shX + 4, shY - 5], [shX + 4, shY + 1], [shX, shY + 7], [shX - 4, shY + 1]], '#1f4eb8');
    p.poly([[shX - 3, shY - 4], [shX + 2, shY - 4], [shX + 2, shY], [shX - 3, shY]], '#3a73e8');
    p.vline(shX, shY - 4, 10, '#a3e8ff', true);
    p.hline(shX - 3, shY - 1, 7, '#a3e8ff', true);
    p.rect(shX - 1, shY - 2, 3, 3, '#ff335c', true);
    p.px(shX - 1, shY - 2, '#ffffff', true);

    if (isHit) {
      drawSlashArc64(p, shX + 4, shY, 10, 12, -1.15, 1.15, '#33b8ff', '#a8f4ff', '#ffffff');
    }
  },
};

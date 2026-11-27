/**
 * 1. 雾雨魔理沙（混沌英雄 · 1×1 飞行远程）
 * 宽檐大魔女帽 + 胸前金麻花辫 + 纯黑丝绒裙围裙 + 骑扫帚飞驰 + 15×15 精雕正八角迷你八卦炉。
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawCuteRibbonBow64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawHollowRing64, drawMiniHakkero64, drawSparkStar64, HD_BASE } from './helpers';

/** 雾雨魔理沙（hero_marisa）HD 像素绘谱 */
export const HERO_MARISA_RIG_SPEC: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0d1026',
  backdropBottom: '#2b1c40',
  backdropGlow: '#f6c945',
  avatarCrop: { x: 7, y: 3, size: 39 },
  portraitCrop: { x: 1, y: 2, w: 62, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    // 魔理沙优雅微偏左构图，为右侧 15×15 超清晰正八角「迷你八卦炉」与极彩极限火花留出黄金舞台！
    const bx =
      isAtk && (f === 1 || f === 2)
        ? 21
        : isAtk && f === 0
          ? 23
          : Math.round(24 + pose.leanX * 0.8);
    const hoverLift = isMove ? [-2, -3, -2, -1][f % 4] : 0;
    const by = Math.max(-2, Math.round(pose.breathY * 1.1 - pose.stepLift * 0.55 + hoverLift));
    const sway = pose.flutter * 1.6 + (isMove ? -2.4 : 0);
    const headY = 26 + by;

    // [1] 后景：胡桃木「魔法飞天扫帚」（待机优雅斜背；移动时帅气跨骑扫帚喷洒星尘！）
    p.setPart(SPRITE_PART.BACK_ACC);
    if (isMove) {
      const bTailX = Math.max(5, bx - 16);
      const bTailY = 55 + by;
      const bTipX = Math.min(46, bx + 18);
      const bTipY = 48 + by;
      p.line(bTailX, bTailY, bTipX, bTipY, '#59331a', 3);
      p.line(bTailX + 1, bTailY - 1, bTipX, bTipY - 1, '#ba763c', 1);
      p.px(bTipX, bTipY, '#ffe878', true);
      p.poly(
        [
          [bTailX + 2, bTailY - 4],
          [Math.max(2, bTailX - 6), bTailY - 1],
          [Math.max(3, bTailX - 5), bTailY + 6],
          [bTailX + 4, bTailY + 3],
        ],
        '#8c5a18',
      );
      p.poly(
        [
          [bTailX + 1, bTailY - 3],
          [Math.max(3, bTailX - 4), bTailY],
          [Math.max(4, bTailX - 3), bTailY + 4],
          [bTailX + 3, bTailY + 2],
        ],
        '#f0be42',
      );
      p.line(bTailX + 1, bTailY - 4, bTailX + 4, bTailY + 3, '#d92647', 2);
      p.setPart(SPRITE_PART.GLOW_FX);
      drawSparkStar64(p, Math.max(4, bTailX - 5), bTailY + 2, 2, '#ffe466');
      p.px(Math.max(3, bTailX - 7), bTailY - 2, '#75ecff', true);
    } else {
      const brX = Math.max(6, bx - 13);
      const brY = 54 + by;
      p.line(brX, brY + 1, bx + 10, 29 + by, '#59331a', 3);
      p.line(brX + 1, brY, bx + 9, 30 + by, '#b06d36', 1);
      p.px(bx + 10, 29 + by, '#ffe478', true);
      p.poly(
        [
          [brX + 2, brY - 3],
          [Math.max(2, brX - 8 + Math.round(sway * 0.4)), brY + 2],
          [Math.max(3, brX - 6 + Math.round(sway * 0.4)), brY + 7],
          [Math.max(4, brX - 2 + Math.round(sway * 0.3)), brY + 9],
          [brX + 4, brY + 2],
        ],
        '#8c5a18',
      );
      p.poly(
        [
          [brX + 1, brY - 2],
          [Math.max(3, brX - 6 + Math.round(sway * 0.4)), brY + 2],
          [Math.max(4, brX - 5 + Math.round(sway * 0.4)), brY + 6],
          [brX + 3, brY + 1],
        ],
        '#f0bc40',
      );
      p.line(brX, brY, Math.max(4, brX - 5 + Math.round(sway * 0.4)), brY + 4, '#fff29e', 1);
      p.line(brX, brY - 3, brX + 4, brY + 2, '#d92647', 2);
      p.px(brX + 2, brY - 1, '#ffe478');
    }

    // [2] 明艳蓬松波浪金色后长发（外扩发尾自然灵动，不贴头不呆板！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 11 - sway * 0.4, 42 + by],
        [bx + 7 - sway * 0.5, 48 + by],
        [bx - 10 + sway * 0.6, 49 + by],
        [bx - 13 + sway * 0.7, 41 + by],
      ],
      '#a86d14',
    );
    p.poly(
      [
        [bx - 9, headY + 1],
        [bx + 8, headY + 1],
        [bx + 9 - sway * 0.3, 41 + by],
        [bx - 10 + sway * 0.5, 44 + by],
      ],
      '#f5c43d',
    );
    p.bezierRibbon([bx - 9, headY + 6], [bx - 12 + sway * 0.5, 40 + by], [bx - 11 + sway * 0.7, 47 + by], 2.4, 0.9, '#fff299');
    p.bezierRibbon([bx + 8, headY + 6], [bx + 10 - sway * 0.4, 39 + by], [bx + 9 - sway * 0.5, 46 + by], 2.0, 0.8, '#ffe678');

    // [3] 3/4 斜错步雪白过膝袜 + 纯黑金扣短靴（飞行时向后收腿骑在扫帚上）
    if (isMove) {
      p.setPart(SPRITE_PART.LEGS);
      p.line(bx - 4, 53 + by, bx - 9, 59 + by, '#dce0eb', 3);
      p.rect(bx - 12, 58 + by, 5, 4, '#131524');
      p.hline(bx - 11, 59 + by, 3, '#3c456b');
      p.line(bx + 3, 53 + by, bx - 1, 60 + by, '#ffffff', 3);
      p.rect(bx - 3, 59 + by, 6, 4, '#1b1f36');
      p.hline(bx - 2, 60 + by, 4, '#546194');
      p.px(bx, 60 + by, '#ffe478');
    } else {
      drawStaggeredLegs64(p, bx, 54, 66, pose, {
        sockShadow: '#d8dbe8',
        sockLight: '#ffffff',
        shoeDark: '#121421',
        shoeMain: '#242942',
        shoeHighlight: '#ffe478',
      });
    }

    // [4] 左后臂：纯白泡泡袖（待机自信叉腰/握扫帚，蓄力帅气抬手轻按宽帽檐！）
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 37 + by, '#cfd5e6', '#ffffff', '#1b1f36', 'left');
    if (isAtk && f === 0) {
      drawSoftChibiArm64(p, bx - 8, 37 + by, bx - 15, 30 + by, '#fff4eb', '#e8b3a0');
      drawSoftChibiArm64(p, bx - 15, 30 + by, bx - 14, 20 + by, '#fff4eb', '#e8b3a0');
      p.rect(bx - 15, 18 + by, 3, 2, '#ffe0cc');
    } else {
      const backArmX = isHit ? bx - 13 : bx - 11 - Math.round(pose.stride * 1.4);
      const backArmY = 43 + by;
      drawSoftChibiArm64(p, bx - 8, 38 + by, backArmX, backArmY, '#fff4eb', '#e8b3a0');
      p.rect(backArmX - 1, backArmY - 1, 3, 2, '#ffe0cc');
    }

    // [5] 正统丝绒漆黑大蓬裙 + 洁白层叠荷叶衬裙 + 精细柔褶纯白围裙！
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 43 + by,
      waistW: 11,
      hemY: 54 + by,
      hemW: 30,
      tiltRight: 1.0,
      archDepth: 2.5,
      waveLobes: 3.5,
      waveAmp: 1.5,
      swayX: -pose.leanX * 0.5 + sway * 0.85,
      colors: {
        deep: '#0c0e1a',
        shadow: '#171b2e',
        main: '#242a47',
        light: '#38426e',
        highlight: '#5564a1',
      },
      trimBand: {
        offsetFromHem: 1.8,
        thickness: 1.2,
        color: '#ffffff',
        shadowColor: '#c2cce0',
      },
      petticoat: {
        peekDepth: 2.4,
        shade: '#ced5e6',
        main: '#ffffff',
        highlight: '#ffffff',
      },
    });
    // 精致立体褶皱纯白荷叶围裙（带淡紫灰立体垂褶，告别平白一块！）
    p.setPart(SPRITE_PART.APRON_WAIST);
    const apSway = Math.round(sway * 0.5);
    p.poly(
      [
        [bx - 4, 43 + by],
        [bx + 5, 43 + by],
        [bx + 8 + apSway, 51 + by],
        [bx + 4 + apSway, 53 + by],
        [bx + 1 + apSway, 54 + by],
        [bx - 3 + apSway, 53 + by],
        [bx - 6 + apSway, 51 + by],
      ],
      '#cdd4e6',
    );
    p.poly(
      [
        [bx - 3, 43 + by],
        [bx + 4, 43 + by],
        [bx + 6 + apSway, 50 + by],
        [bx + 1 + apSway, 52 + by],
        [bx - 5 + apSway, 50 + by],
      ],
      '#ffffff',
    );
    // 两条纤细柔美围裙布料垂影
    p.line(bx - 1, 44 + by, bx - 2 + apSway, 51 + by, '#dbe2f2', 1);
    p.line(bx + 3, 44 + by, bx + 4 + apSway, 51 + by, '#dbe2f2', 1);
    p.hline(bx - 5, 43 + by, 11, '#ffffff');

    // [6] 修身纯黑丝绒小马甲 + 雪白衬衫翻领 + 绯红/暖金领结 + 双排闪亮金扣
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 35 + by], [bx + 5, 35 + by], [bx + 6, 43 + by], [bx - 5, 43 + by]], '#111424');
    p.poly([[bx - 4, 35 + by], [bx + 4, 35 + by], [bx + 4, 42 + by], [bx - 4, 42 + by]], '#222845');
    p.poly([[bx - 3, 34 + by], [bx + 4, 34 + by], [bx + 1, 38 + by]], '#ffffff');
    // 标志性俏丽领结（红金双色提亮胸口焦点！）
    p.rect(bx - 1, 36 + by, 4, 2, '#e63250');
    p.px(bx + 1, 36 + by, '#ffe878');
    p.px(bx - 2, 39 + by, '#ffe478');
    p.px(bx + 3, 39 + by, '#ffe478');
    p.px(bx - 2, 41 + by, '#ffe478');
    p.px(bx + 3, 41 + by, '#ffe478');

    // [7] 俏皮元气少女颜 + 璀璨琥珀金 4×4 大眼 + 明亮金发 + 清晰左胸编织金麻花辫！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff6ee',
      skinMain: '#ffe2ce',
      skinShade: '#e8ad99',
      lashColor: '#291533',
      irisDark: '#a35d08',
      irisMid: '#eb9e17',
      irisGlow: '#fff478',
      blushColor: '#ff96b0',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#ab6f12',
      dark: '#e0a024',
      mid: '#fcd34d',
      light: '#ffed8a',
      spec: '#fffde0',
      leftLockLen: 11,
      rightLockLen: 10,
      fluff: 1,
      sway,
    });
    // 左胸前清晰立体编织麻花辫 + 纯白发结
    p.setPart(SPRITE_PART.FRONT_HAIR);
    const brdX = bx - 6 + Math.round(sway * 0.2);
    p.bezierRibbon([brdX - 1, headY + 4], [brdX, headY + 11], [brdX + 2, headY + 17], 3.8, 2.2, '#9e620e');
    p.bezierRibbon([brdX - 1, headY + 5], [brdX, headY + 11], [brdX + 2, headY + 16], 2.2, 1.4, '#ffda59');
    p.px(brdX - 1, headY + 7, '#fffbd4');
    p.px(brdX + 1, headY + 10, '#fffbd4');
    p.px(brdX, headY + 13, '#fffbd4');
    p.px(brdX + 2, headY + 16, '#fffbd4');
    p.setPart(SPRITE_PART.HEADWEAR);
    p.rect(brdX, headY + 17, 4, 2, '#ffffff');
    p.px(brdX + 1, headY + 19, '#cfd8eb');

    // [8] 标志性超经典高耸「漆黑丝绒大尖顶魔女帽 + 雪白宽帽带 + 蓬松右侧大白蝴蝶结」（宽檐挺括、帽尖圆润上扬再回钩！）
    p.setPart(SPRITE_PART.HEADWEAR);
    const hatTilt = isAtk && f === 1 ? 1 : 0;
    const hatY = headY - 8 + hatTilt;
    // 宽大垂弧丝绒黑帽檐（彻底取代扁灰椭圆！）
    p.ellipse(bx - 0.5, hatY, 18.2, 3.8, '#0c0e1c');
    p.ellipse(bx - 0.8, hatY - 0.7, 16.4, 2.7, '#1d233d');
    p.bezierRibbon([bx - 15, hatY - 1], [bx - 4, hatY - 3], [bx + 10, hatY - 2], 1.6, 1.0, '#44528a');
    // 柔和帽檐雪白蕾丝边
    for (let x = bx - 9; x <= bx + 9; x += 2) {
      p.px(x, hatY + 1, '#ffffff');
      p.px(x + 1, hatY + 1, '#cfd8eb');
    }
    // 宏伟挺括高尖魔女帽冠（S 形优雅向后弯垂帽尖，轮廓一眼认出魔理沙！）
    const peakY = Math.max(3, hatY - 14);
    const tipX = Math.max(4, bx - 14 + Math.round(sway * 0.4));
    const tipY = Math.max(8, hatY - 7);
    p.poly(
      [
        [bx - 10, hatY - 1],
        [bx + 9, hatY - 1],
        [bx + 6, hatY - 8],
        [bx, peakY],
        [bx - 6, peakY + 2],
        [tipX, tipY],
        [bx - 10, hatY - 5],
      ],
      '#101324',
    );
    p.poly(
      [
        [bx - 8, hatY - 1],
        [bx + 6, hatY - 1],
        [bx + 4, hatY - 8],
        [bx, peakY + 1],
        [bx - 5, peakY + 3],
        [tipX + 2, tipY],
      ],
      '#252d4f',
    );
    // 丝绒帽顶流畅高光弧线
    p.bezierRibbon([tipX + 2, tipY], [bx - 2, peakY + 1], [bx + 3, hatY - 7], 1.5, 1.0, '#5a6cb5');
    p.px(bx, peakY, '#495894');
    // 纯白宽帽带 + 右侧蓬松大白蝴蝶结 + 鎏金星徽！
    p.rect(bx - 8, hatY - 4, 16, 3, '#f0f4fa');
    p.hline(bx - 8, hatY - 4, 16, '#ffffff');
    p.hline(bx - 8, hatY - 2, 16, '#c6d0e3');
    drawCuteRibbonBow64(p, bx + 6, hatY - 4, {
      leftSpan: 4.5,
      rightSpan: 6.2,
      wingHeight: 6.8,
      tailLen: 6,
      sway: -sway * 0.5,
      dark: '#b8c4db',
      main: '#f2f6ff',
      light: '#ffffff',
      part: SPRITE_PART.HEADWEAR,
    });
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx + 6, hatY - 4, '#ffe059', true);

    // [9] 右前臂泡泡袖 + 优雅引手操控身旁的「15×15 精雕正八角迷你八卦炉」
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 37 + by, '#cfd5e6', '#ffffff', '#1b1f36', 'right');
    const rHandX = isAtk && (f === 1 || f === 2) ? bx + 11 : bx + 11;
    const rHandY = isAtk && f === 0 ? 35 + by : isAtk && (f === 1 || f === 2) ? 38 + by : 40 + by - Math.round(pose.armAction * 2);
    drawSoftChibiArm64(p, bx + 8, 38 + by, rHandX, rHandY, '#fff4eb', '#e8b3a0');
    p.rect(rHandX - 1, rHandY - 1, 3, 2, '#ffe0cc');

    // [10] 超清晰标志性 15×15 正八边形「迷你八卦炉 (Mini-Hakkero)」+ 极彩「极限火花 (Master Spark)」！！
    const furnHover = Math.round(Math.sin(phase) * 2.0);
    const furnX = isAtk && (f === 1 || f === 2) ? 39 : isAtk && f === 0 ? 45 : 47;
    const furnY = isAtk && f === 0 ? 34 + by : isAtk && (f === 1 || f === 2) ? 37 + by : 37 + by + furnHover;

    // 炉周漂浮星尘光粒（烘托魔导器悬浮感！）
    if (!isAtk) {
      drawSparkStar64(p, furnX + 8, furnY - 9 + Math.round(Math.cos(phase) * 1.5), 2, '#ffe478');
      p.px(furnX - 8, furnY + 9, '#78ecff', true);
    }

    drawMiniHakkero64(p, furnX, furnY, isAtk ? (f === 0 ? 'charge' : 'fire') : 'idle');

    if (isAtk && f === 0) {
      // 蓄力帧：八角八卦炉外围展开耀眼旋转金青魔导聚能环！
      drawHollowRing64(p, furnX, furnY, 10.6, 10.6, 0.86, '#ff7338', '#ffe059', '#ffffff', true);
      drawSparkStar64(p, furnX + 9, furnY - 9, 2, '#78ecff');
      drawSparkStar64(p, furnX - 9, furnY + 9, 2, '#ffe878');
    } else if (isAtk && (f === 1 || f === 2)) {
      // 爆发帧：极彩「极限火花 (Master Spark)」多色虹光巨炮自正八角炉口轰出！（严格停于 x=61 零裁切！）
      const endX = 61;
      const spread = f === 1 ? 13 : 8;
      p.setPart(SPRITE_PART.GLOW_FX);
      p.poly([[furnX + 5, furnY - 4], [endX, furnY - spread], [endX, furnY + spread], [furnX + 5, furnY + 4]], '#ff2e73', true);
      p.poly([[furnX + 5, furnY - 3], [endX, furnY - Math.round(spread * 0.76)], [endX, furnY + Math.round(spread * 0.76)], [furnX + 5, furnY + 3]], '#ffaa24', true);
      p.poly([[furnX + 6, furnY - 2], [endX - 1, furnY - Math.round(spread * 0.48)], [endX - 1, furnY + Math.round(spread * 0.48)], [furnX + 6, furnY + 2]], '#fff68f', true);
      p.line(furnX + 6, furnY, endX - 1, furnY, '#ffffff', f === 1 ? 3 : 2, true);
      drawSparkStar64(p, furnX + 10, furnY - spread + 1, 2, '#66e8ff');
      drawSparkStar64(p, furnX + 13, furnY + spread - 1, 2, '#ffe866');
      drawSparkStar64(p, endX - 3, furnY - Math.round(spread * 0.55), 2, '#ffffff');
    }
  },
};

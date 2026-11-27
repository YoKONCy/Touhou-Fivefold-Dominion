/**
 * 2. 小恶魔（T1-B · 红魔馆可爱图书馆使魔少女：亮紫边蝠翼 + 贴耳小蝙蝠头翼 + 白领红结黑马甲 + 右前悬浮吸蓝魔导书！）
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawGothicBatWings64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSlashArc64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawFlyingTuckedLegs64, HD_BASE } from './helpers';

export const koakumaImpSpec: SpriteRigSpec = {
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
};

/**
 * 5. 血族眷属（T3-A · 暗系不死飞行 · 100% 徒手猩红三连血爪攻击！优雅银发双马尾夜族少女）
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawCuteRibbonBow64,
  drawGothicBatWings64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawCrimsonVampireBatFlight64, HD_BASE } from './helpers';

export const crimsonVampireSpec: SpriteRigSpec = {
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
};

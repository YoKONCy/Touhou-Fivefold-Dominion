/**
 * 3. 怨灵（T2-A · 不死飞行幽灵少女：白装束宽袖和服 + 优雅卷曲半透幽灵尾 + 三角纸天冠 + 双鬼火）
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawCuteRibbonBow64,
  drawKawaiiHead64,
  drawSlashArc64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawWraithOrbFlight64, HD_BASE } from './helpers';

export const wraithSpiritSpec: SpriteRigSpec = {
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
};

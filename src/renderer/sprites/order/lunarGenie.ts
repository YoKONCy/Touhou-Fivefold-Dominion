/**
 * 秩序阵营 T3-A 兵种：幻月妖（creature_lunar_genie）HD 像素绘谱。
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawKawaiiHead64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawHollowRing64, drawWrappedHand, HD_BASE } from './helpers';

/**
 * 7. 幻月妖（秩序 T3-A · 1×1 短距瞬移全能施法天女）：
 *    彻底大改消除“蓝麻袋 + 大粗框仙带”！—— 真正古典飞天 S 型轻盈半透流光羽衣仙带（留足空气负空间！）+
 *    星夜紫银渐变蓬松长卷发 + 纤巧镂空鎏金弦月冠 + 分层高开叉月华星纱仙女裙（深星空外裙 + 雪白轻纱前裙摆 + 隐约踏月丝履）+
 *    半透月白广袖 + 华美月牙抱星镂空星轮法杖！
 */
export const lunarGenieRigSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0a0f30',
  backdropBottom: '#221c54',
  backdropGlow: '#b8a8ff',
  avatarCrop: { x: 14, y: 4, size: 36 },
  portraitCrop: { x: 4, y: 2, w: 56, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const floatY = Math.round(Math.sin(phase) * 2.0 - (isMove ? 3 : 1));
    const bx = isAtk && (f === 1 || f === 2) ? 24 : Math.round(28 + pose.leanX * 0.8);
    const by = floatY;
    const sway = Math.sin(phase) * 2.2 + pose.flutter * 1.4;
    const headY = 23 + by;

    // [1] 轻盈曼妙的「古典飞天弧形月华羽衣仙带」（越过肩背划出大弧云拱、左侧柔美 S 弯轻扬飘散，绝不折成竖直回形针！）
    p.setPart(SPRITE_PART.BACK_ACC);
    // 脑后高拱半透明云纱仙弧（托起天女仙姿！）
    p.bezierRibbon(
      [bx - 16 + sway * 0.4, 21 + by],
      [bx - 2, 6 + by],
      [bx + 15 - sway * 0.4, 20 + by],
      2.2,
      2.0,
      '#7d8cff',
    );
    p.bezierRibbon(
      [bx - 15 + sway * 0.4, 21 + by],
      [bx - 2, 7 + by],
      [bx + 14 - sway * 0.4, 20 + by],
      1.0,
      0.9,
      '#e8f6ff',
      true,
    );
    // 左侧优雅外展 S 弯云纱飘尾（自然垂落外扬，留足空气负空间！）
    p.bezierRibbon(
      [bx - 16 + sway * 0.4, 21 + by],
      [bx - 24 + sway * 0.7, 32 + by],
      [bx - 18 + sway, 49 + by],
      3.0,
      1.0,
      '#697ef0',
    );
    p.bezierRibbon(
      [bx - 15 + sway * 0.4, 21 + by],
      [bx - 22 + sway * 0.7, 32 + by],
      [bx - 18 + sway, 48 + by],
      1.3,
      0.5,
      '#dceeff',
      true,
    );
    // 右侧自然下垂微扬的尾纱与飘散星尘
    p.bezierRibbon(
      [bx + 15 - sway * 0.4, 20 + by],
      [bx + 21 - sway * 0.5, 36 + by],
      [bx + 16 - sway * 0.7, 53 + by],
      2.4,
      0.9,
      '#7b68eb',
    );
    p.bezierRibbon(
      [bx + 14 - sway * 0.4, 20 + by],
      [bx + 20 - sway * 0.5, 36 + by],
      [bx + 16 - sway * 0.7, 52 + by],
      1.0,
      0.4,
      '#ebd9ff',
      true,
    );
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx - 18 + Math.round(sway * 0.6), 17 + by, '#ffe899', true);
    p.px(bx - 20 + Math.round(sway), 48 + by, '#ffffff', true);
    p.px(bx + 17 - Math.round(sway * 0.6), 52 + by, '#ffe899', true);

    // [2] 如瀑梦幻「星夜薰衣草紫×月银」大波浪长仙发背影
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 11 - sway * 0.4, 43 + by],
        [bx + 8 - sway * 0.5, 53 + by],
        [bx - 10 + sway * 0.6, 54 + by],
        [bx - 13 + sway * 0.6, 41 + by],
      ],
      '#343c8c',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 9 - sway * 0.3, 41 + by],
        [bx - 10 + sway * 0.5, 44 + by],
      ],
      '#697de0',
    );
    p.bezierRibbon([bx - 9, headY + 6], [bx - 14 + sway * 0.5, 43 + by], [bx - 14 + sway, 54 + by], 3.8, 1.1, '#a6b8ff');

    // [3] 优雅凌波踏月足尖：白皙纤细小腿 + 银月绑带仙履（清晰秀气，告别断脚！）
    drawStaggeredLegs64(p, bx, 52 + Math.min(0, by), 65 + Math.round(by * 0.3), pose, {
      sockShadow: '#f2c8bc',
      sockLight: '#ffe6dc',
      shoeDark: '#263a94',
      shoeMain: '#668ef5',
      shoeHighlight: '#ffe885',
    });
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx - 9, 65, '#9ee8ff', true);
    p.px(bx + 8, 66, '#ffe885', true);
    if (isMove) {
      p.hline(bx - 12, 64, 24, '#8cc8ff', true);
    }

    // [4] 后臂轻舒星纱广袖（掌心绽放一朵微光冰蓝月莲星屑！）
    p.setPart(SPRITE_PART.BACK_ARM);
    p.poly([[bx - 6, 34 + by], [bx - 14, 37 + by], [bx - 16, 46 + by], [bx - 8, 44 + by]], '#4d6fd9');
    p.poly([[bx - 6, 35 + by], [bx - 13, 37 + by], [bx - 14, 44 + by], [bx - 8, 43 + by]], '#8cb4ff');
    p.line(bx - 15, 45 + by, bx - 9, 44 + by, '#ffffff', 1);
    drawSoftChibiArm64(p, bx - 6, 35 + by, bx - 15, 37 + by);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx - 16, 34 + by, 2.2, 2.2, '#7ce8ff', true);
    p.px(bx - 16, 34 + by, '#ffffff', true);

    // [5] 多层次绝美「月宫星纱天女礼裙」（深星空外裙 + 雪白流光前开轻纱 + 鎏金月相飘带，彻底摆脱蓝麻袋！）
    drawCleanAnimeSkirt64(p, {
      waistX: bx,
      waistY: 40 + by,
      waistW: 11.4,
      hemY: 54 + by,
      hemW: 31,
      swayX: sway,
      colors: {
        deep: '#10184a',
        shadow: '#1b2b7a',
        main: '#3152c4',
        light: '#648ef2',
        highlight: '#adcaff',
      },
      trimBand: {
        offsetFromHem: 2,
        thickness: 1.5,
        color: '#ffe485',
        shadowColor: '#cc9c35',
      },
      petticoat: {
        peekDepth: 2.2,
        shade: '#c7d8fa',
        main: '#f2f7ff',
        highlight: '#ffffff',
      },
    });
    // 正前方优雅层叠的雪白月华轻纱前摆（大提亮度与层次感，仙气十足！）
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly(
      [
        [bx - 4, 40 + by],
        [bx + 4, 40 + by],
        [bx + 8 + sway * 0.4, 54 + by],
        [bx + 1 + sway * 0.3, 56 + by],
        [bx - 5 + sway * 0.3, 53 + by],
      ],
      '#d4e5ff',
    );
    p.poly(
      [
        [bx - 3, 41 + by],
        [bx + 3, 41 + by],
        [bx + 6 + sway * 0.35, 53 + by],
        [bx + 1 + sway * 0.25, 55 + by],
        [bx - 4 + sway * 0.25, 52 + by],
      ],
      '#ffffff',
    );
    // 前摆两侧垂落的精致鎏金流苏飘带 + 星空裙面星辰微光
    p.line(bx - 4, 41 + by, bx - 5 + sway * 0.3, 53 + by, '#ffe078', 1);
    p.line(bx + 4, 41 + by, bx + 7 + sway * 0.4, 54 + by, '#ffe078', 1);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx - 9, 49 + by, '#fff4b8', true);
    p.px(bx + 10, 48 + by, '#99f0ff', true);
    p.px(bx + 1, 47 + by, '#8cd6ff', true);
    // 月白收腰交领仙衣 + 靛蓝星辰胸带 + 发光星月胸宝石
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5.5, 33 + by], [bx + 5.5, 33 + by], [bx + 5.5, 41 + by], [bx - 5.5, 41 + by]], '#d6e3fa');
    p.poly([[bx - 4.5, 34 + by], [bx + 4.5, 34 + by], [bx + 4.5, 40 + by], [bx - 4.5, 40 + by]], '#ffffff');
    p.line(bx - 4, 34 + by, bx, 39 + by, '#355ec9', 1);
    p.line(bx + 4, 34 + by, bx, 39 + by, '#355ec9', 1);
    p.hline(bx - 6, 40 + by, 12, '#ffe078');
    p.ellipse(bx, 39 + by, 2.0, 2.0, '#ffd966', true);
    p.px(bx, 39 + by, '#8cf2ff', true);

    // [6] 绝美星海紫罗兰大眼仙颜 + 梦幻紫蓝渐层蓬松空气发 + 纤巧镂空鎏金弦月仙冠！
    drawKawaiiHead64(p, bx, headY, pose, {
      irisDark: '#361f8a',
      irisMid: '#7354eb',
      irisGlow: '#d9c4ff',
      lashColor: '#241852',
      blushColor: '#ffb0cc',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#333d8f',
      dark: '#5769c7',
      mid: '#8ea4f5',
      light: '#cbd9ff',
      spec: '#ffffff',
      leftLockLen: 12,
      rightLockLen: 11,
      bobFlare: true,
      sway,
    });
    // 精致绝美的双弯尖镂空鎏金弦月额冠（告别笨重三角小饭团！）
    p.setPart(SPRITE_PART.HEADWEAR);
    p.hline(bx - 6, headY - 8, 12, '#e8b846');
    p.line(bx - 5, headY - 12, bx - 2, headY - 9, '#ffe680', 2, true);
    p.line(bx + 5, headY - 12, bx + 2, headY - 9, '#ffe680', 2, true);
    p.hline(bx - 3, headY - 9, 7, '#ffe680', true);
    p.px(bx - 5, headY - 13, '#ffffff', true);
    p.px(bx + 5, headY - 13, '#ffffff', true);
    p.ellipse(bx, headY - 10, 1.5, 1.5, '#8cf2ff', true);
    p.px(bx, headY - 10, '#ffffff', true);

    // [7] 前臂自然微垂的仙女星纱广袖优雅端持「月牙抱星真·镂空鎏金星轮法杖」！
    p.setPart(SPRITE_PART.FRONT_ARM);
    const staffX = isAtk && (f === 1 || f === 2) ? bx + 17 : bx + 15;
    const staffHandY = isAtk ? 36 + by : 40 + by;
    p.poly(
      [
        [bx + 5, 34 + by],
        [staffX - 1, staffHandY - 1],
        [staffX - 2, staffHandY + 6],
        [bx + 7, 45 + by],
        [bx + 5, 42 + by],
      ],
      '#5982e8',
    );
    p.poly(
      [
        [bx + 6, 35 + by],
        [staffX - 2, staffHandY],
        [staffX - 3, staffHandY + 4],
        [bx + 7, 43 + by],
      ],
      '#9ec2ff',
    );
    p.line(staffX - 1, staffHandY - 1, staffX - 2, staffHandY + 6, '#ffffff', 1);
    drawSoftChibiArm64(p, bx + 6, 36 + by, staffX, staffHandY);

    p.setPart(SPRITE_PART.WEAPON);
    const ringCY = isAtk ? 18 + by : 21 + by;
    // 纤雅鎏金杖杆 + 杖颈飘逸星纱丝带结
    p.line(staffX - 1, 62 + by, staffX, ringCY + 6, '#b5842c', 2);
    p.line(staffX, 61 + by, staffX, ringCY + 6, '#ffe685', 1);
    p.bezierRibbon([staffX, ringCY + 8], [staffX - 3, ringCY + 13], [staffX - 5 + sway * 0.4, ringCY + 18], 1.8, 0.7, '#b5a6ff');
    // 杖首真·镂空鎏金星轮（纯镂空精致金环 + 外侧辉光新月弧 + 中心悬浮璀璨蓝白星核！）
    drawHollowRing64(p, staffX, ringCY, 6.4, 6.4, 0.74, '#c9932e', '#ffe066', '#ffffff', true);
    // 外侧新月金芒与环顶星冠
    p.px(staffX, ringCY - 7, '#ffffff', true);
    p.px(staffX - 7, ringCY, '#ffe885', true);
    p.px(staffX + 7, ringCY, '#ffe885', true);
    p.ellipse(staffX, ringCY, isAtk ? 2.8 : 2.1, isAtk ? 2.8 : 2.1, '#66d9ff', true);
    p.px(staffX, ringCY, '#ffffff', true);
    drawWrappedHand(p, staffX, staffHandY);

    // [8] 攻击爆发：星轮绽放双层镂空星阵与璀璨星月光束！
    if (isAtk && (f === 1 || f === 2)) {
      p.setPart(SPRITE_PART.GLOW_FX);
      drawHollowRing64(p, staffX, ringCY, 9.2, 9.2, 0.84, '#7d66ff', '#a8f0ff', '#ffffff', true);
      const beamEnd = Math.min(59, staffX + 16);
      p.line(staffX + 3, ringCY, beamEnd, ringCY + 4, '#5cb8ff', 3, true);
      p.line(staffX + 3, ringCY, beamEnd, ringCY + 4, '#ffffff', 1, true);
      p.px(beamEnd, ringCY + 4, '#ffe885', true);
    }
  },
};

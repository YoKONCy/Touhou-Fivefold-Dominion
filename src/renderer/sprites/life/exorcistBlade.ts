/**
 * 5. 退魔剑士（T3-A · 双重攻击 + 抗死结界）64×72 HD 像素精灵绘谱
 * 月银和风二刀流女剑豪 · 月蓝高马尾 + 新月额饰 + 精雕月银胸甲 + 辉金太刀×冰蓝胁差双月连斩！
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSlashArc64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawWrappedHand, HD_BASE } from './helpers';

export const creatureExorcistBladeSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0c142e',
  backdropBottom: '#1c2b52',
  backdropGlow: '#78c4ff',
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const bx = isAtk && (f === 1 || f === 2) ? 26 : isAtk && f === 0 ? 25 : Math.round(29 + pose.leanX * 0.9);
    const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.2);
    const sway = pose.flutter * 1.7;
    const headY = 23 + by;

    // [1] 背后飒爽飞扬的「月蓝大高马尾」+ 飘逸深蓝鎏金「和风阵羽织短披风」
    p.setPart(SPRITE_PART.BACK_ACC);
    const tailSway = isAtk && f === 1 ? -4.5 : sway;
    // 动感 S 弧月蓝高马尾
    p.bezierRibbon(
      [bx - 7, headY - 6],
      [bx - 19 + tailSway * 0.6, headY - 2],
      [bx - 21 + tailSway, headY + 12],
      6.5,
      1.6,
      '#1a2957',
    );
    p.bezierRibbon(
      [bx - 7, headY - 5],
      [bx - 17 + tailSway * 0.5, headY - 1],
      [bx - 19 + tailSway * 0.9, headY + 10],
      3.8,
      1.0,
      '#3b63b8',
    );
    p.bezierRibbon(
      [bx - 8, headY - 5],
      [bx - 15 + tailSway * 0.4, headY - 2],
      [bx - 17 + tailSway * 0.7, headY + 5],
      1.5,
      0.5,
      '#94c2ff',
    );
    // 绯红鎏金高马尾扎结
    p.rect(bx - 9, headY - 8, 4, 4, '#d92649');
    p.px(bx - 8, headY - 7, '#ffe680');

    // 飘扬深蓝滚金阵羽织披风
    const capeBack = isAtk && f === 1 ? -5 : sway;
    p.poly(
      [
        [bx - 4, 32 + by],
        [bx - 19 + capeBack, 41 + by],
        [bx - 21 + capeBack, 54 + by],
        [bx - 9 + capeBack * 0.4, 52 + by],
        [bx - 4, 42 + by],
      ],
      '#112252',
    );
    p.poly(
      [
        [bx - 4, 33 + by],
        [bx - 16 + capeBack * 0.9, 41 + by],
        [bx - 17 + capeBack * 0.9, 51 + by],
        [bx - 7, 49 + by],
      ],
      '#254da6',
    );
    p.bezierRibbon(
      [bx - 20 + capeBack, 53 + by],
      [bx - 14 + capeBack * 0.7, 53 + by],
      [bx - 9 + capeBack * 0.4, 51 + by],
      1.6,
      1.2,
      '#f2c852',
    );

    // [2] 3/4 斜错步精钢月银护胫 + 深蓝系带战靴
    drawStaggeredLegs64(p, bx, 51, 65, pose, {
      sockShadow: '#6479a8',
      sockLight: '#dce8ff',
      shoeDark: '#172347',
      shoeMain: '#304985',
      shoeHighlight: '#ffe478',
    });

    // [3] 左后臂（副手）：精雕月银袖护 + 2px 软萌少女小臂 + 「冰蓝灵胁差（二刀流副刃）」！
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 34 + by, '#495d87', '#c2d5f5', '#f2c852', 'left');
    if (isAtk && f === 0) {
      drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 13, 39 + by);
      p.setPart(SPRITE_PART.WEAPON);
      p.line(bx - 13, 39 + by, bx - 22, 31 + by, '#4db8ff', 3, true);
      p.line(bx - 13, 38 + by, bx - 22, 31 + by, '#ebfbff', 1, true);
      p.rect(bx - 14, 38 + by, 2, 2, '#ffe066');
    } else if (isAtk && f === 1) {
      // 第一段纵斩：副刃后拉蓄势准备第二段连斩
      drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 13, 41 + by);
      p.setPart(SPRITE_PART.WEAPON);
      p.line(bx - 13, 41 + by, bx - 22, 46 + by, '#4db8ff', 2, true);
      p.line(bx - 13, 40 + by, bx - 22, 45 + by, '#e8faff', 1, true);
    } else if (isAtk && f === 2) {
      // 第二段回旋双连斩！副刃冰蓝灵胁差顺势前横扫切出苍蓝弯月剑气！
      drawSoftChibiArm64(p, bx - 7, 36 + by, bx + 9, 39 + by);
      p.setPart(SPRITE_PART.WEAPON);
      p.line(bx + 9, 39 + by, bx + 25, 34 + by, '#3db4ff', 3, true);
      p.line(bx + 10, 38 + by, bx + 25, 34 + by, '#ffffff', 1, true);
      drawWrappedHand(p, bx + 9, 39 + by);
    } else {
      // 待机/移动：左手反握冰蓝灵胁差优雅斜指后下方，二刀流剪影超飒！
      const offArm = isHit ? -2 : Math.round(-pose.stride * 1.4);
      const lhX = bx - 12 + offArm;
      const lhY = 40 + by;
      drawSoftChibiArm64(p, bx - 8, 36 + by, lhX, lhY);
      p.setPart(SPRITE_PART.WEAPON);
      p.line(lhX, lhY, Math.max(4, lhX - 11), lhY + 8, '#38a3ff', 3, true);
      p.line(lhX - 1, lhY, Math.max(4, lhX - 11), lhY + 7, '#e8fbff', 1, true);
      p.line(lhX - 1, lhY - 2, lhX + 2, lhY + 2, '#f5cc58', 1);
      drawWrappedHand(p, lhX, lhY);
    }

    // [4] 干净大色块 3/4 深蓝百褶剑道袴裙 + 洁白滚边 + 前垂纤长白金退魔御札布！
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
      swayX: -pose.leanX * 0.5 + sway * 0.75,
      colors: {
        deep: '#122454',
        shadow: '#1e3c80',
        main: '#2e5ec2',
        light: '#5287ed',
        highlight: '#8cb8ff',
      },
      trimBand: {
        offsetFromHem: 2.0,
        thickness: 1.3,
        color: '#f2f7ff',
        shadowColor: '#b3c6e8',
      },
      petticoat: {
        peekDepth: 1.8,
        shade: '#b8c8e6',
        main: '#f5f9ff',
        highlight: '#ffffff',
      },
    });
    // 前垂纤长白金退魔御札布（干净点缀正中，不挡腿）
    p.setPart(SPRITE_PART.APRON_WAIST);
    const tabSway = Math.round(-pose.leanX * 0.4 + sway * 0.5);
    p.poly(
      [
        [bx - 2, 41 + by],
        [bx + 3, 41 + by],
        [bx + 4 + tabSway, 53 + by],
        [bx - 1 + tabSway, 53 + by],
      ],
      '#f5f8ff',
    );
    p.vline(bx + 1 + Math.round(tabSway * 0.5), 42 + by, 10, '#e0284a');
    p.px(bx + 1 + Math.round(tabSway * 0.5), 45 + by, '#ffe680', true);

    // [5] 精雕月银修身轻胸甲 + 绯红和风交领 + 立体护甲下沿折线 + 金色退魔纹章与束腰！
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#425680');
    p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#a5bce0');
    p.rect(bx - 3, 33 + by, 4, 4, '#edf4ff');
    p.px(bx - 2, 34 + by, '#ffffff');
    // 胸甲立体金属折面暗线（强化轻铠金属雕塑感！）
    p.hline(bx - 4, 37 + by, 9, '#5e74a1');
    p.hline(bx - 3, 38 + by, 7, '#d4e4ff');
    // 绯红和风交领
    p.line(bx - 4, 32 + by, bx + 1, 36 + by, '#d92647', 1);
    p.line(bx + 4, 32 + by, bx + 1, 36 + by, '#f54263', 1);
    p.px(bx + 1, 37 + by, '#ffe478', true);
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.hline(bx - 5, 40 + by, 11, '#c91e3e');
    p.hline(bx - 4, 39 + by, 9, '#f2c852');
    p.rect(bx - 1, 39 + by, 3, 2, '#fff099');

    // [6] 飒爽英气少女脸 + 璀璨苍穹蓝 4×4 大眼 + 月蓝大集群发冠 + 白银发箍与鎏金新月红玉额饰！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff6ee',
      skinMain: '#ffe2ce',
      skinShade: '#e6ad98',
      lashColor: '#1b1d3d',
      irisDark: '#1646ad',
      irisMid: '#3682f5',
      irisGlow: '#9eeaff',
      blushColor: '#ff96b0',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#192752',
      dark: '#284285',
      mid: '#426ec7',
      light: '#78a8f5',
      spec: '#d6eaff',
      leftLockLen: 11,
      rightLockLen: 10,
      fluff: 2,
      sway,
    });
    // 白银细发箍 + 眉心精巧鎏金新月退魔额冠
    p.setPart(SPRITE_PART.HEADWEAR);
    p.hline(bx - 7, headY - 8, 14, '#dce8fc');
    p.hline(bx - 5, headY - 9, 10, '#ffffff');
    p.poly(
      [
        [bx - 4, headY - 12],
        [bx - 1, headY - 9],
        [bx + 1, headY - 9],
        [bx + 4, headY - 12],
        [bx + 2, headY - 8],
        [bx - 2, headY - 8],
      ],
      '#ffe478',
      true,
    );
    p.px(bx, headY - 9, '#ff2652', true);

    // [7] 右前臂月银小肩甲 + 2px 少女小臂真握持「辉金破魔太刀（主刃）」+ 双月连斩光弧！
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 34 + by, '#5c729e', '#d6e6ff', '#ffe073', 'right');

    if (isAtk && f === 0) {
      // 蓄力帧：右手高举辉金太刀向右上蓄势，避开脸庞！
      const handX = bx + 11;
      const handY = 27 + by;
      drawSoftChibiArm64(p, bx + 8, 35 + by, handX, handY);
      p.setPart(SPRITE_PART.WEAPON);
      p.line(handX - 2, handY + 3, handX + 1, handY - 1, '#a81c38', 2);
      p.line(handX - 2, handY - 2, handX + 4, handY + 1, '#ffe066', 2);
      p.line(handX + 1, handY - 1, handX - 5, 8 + by, '#f5b82e', 3, true);
      p.line(handX + 1, handY - 2, handX - 5, 8 + by, '#ffffff', 1, true);
      drawWrappedHand(p, handX, handY);
      p.setPart(SPRITE_PART.GLOW_FX);
      p.px(handX - 5, 7 + by, '#ffffff', true);
      p.px(handX - 7, 8 + by, '#8cd6ff', true);
    } else if (isAtk && f === 1) {
      // 第一段纵斩：太刀猛然斜劈，前方划出饱满炽金白芯大满月斩弧！
      const handX = bx + 13;
      const handY = 39 + by;
      drawSoftChibiArm64(p, bx + 8, 36 + by, handX, handY);
      p.setPart(SPRITE_PART.WEAPON);
      p.line(handX - 2, handY - 1, handX + 1, handY + 1, '#a81c38', 2);
      p.line(handX + 1, handY + 1, Math.min(58, handX + 19), handY + 7, '#f5b82e', 3, true);
      p.line(handX + 2, handY, Math.min(58, handX + 19), handY + 6, '#ffffff', 1, true);
      p.vline(handX + 2, handY - 2, 6, '#ffe478');
      drawWrappedHand(p, handX, handY);
      drawSlashArc64(p, bx + 13, 34 + by, 21, 20, -1.25, 0.95, '#ff9e24', '#ffe878', '#ffffff');
    } else if (isAtk && f === 2) {
      // 第二段回旋双连斩：太刀上撩收势 + 配合副手苍蓝新月反斩弧！
      const handX = bx + 12;
      const handY = 31 + by;
      drawSoftChibiArm64(p, bx + 8, 35 + by, handX, handY);
      p.setPart(SPRITE_PART.WEAPON);
      p.line(handX, handY, Math.min(58, handX + 16), handY - 13, '#f5c038', 3, true);
      p.line(handX + 1, handY - 1, Math.min(58, handX + 16), handY - 13, '#ffffff', 1, true);
      drawWrappedHand(p, handX, handY);
      drawSlashArc64(p, bx + 14, 35 + by, 20, 17, -0.95, 1.05, '#2694ff', '#99ebff', '#ffffff');
    } else {
      // 待机/行走：右手持修长微弧「辉金破魔太刀」斜指右上方，剑姿绝美！
      const handX = bx + 11;
      const handY = 38 + by - Math.round(pose.armAction * 2);
      drawSoftChibiArm64(p, bx + 8, 36 + by, handX, handY);
      p.setPart(SPRITE_PART.WEAPON);
      p.line(handX - 4, handY + 4, handX + 1, handY - 1, '#9e1b35', 2);
      p.line(handX - 2, handY - 3, handX + 4, handY + 2, '#f5cc58', 2);
      // 修长微弧太刀刃（冷银刀背 + 炽金白光刀锋！）
      const tipX = Math.min(59, handX + 16);
      const tipY = Math.max(10, handY - 20);
      p.bezierRibbon([handX + 1, handY - 1], [handX + 10, handY - 9], [tipX, tipY], 2.8, 1.1, '#78a8db');
      p.bezierRibbon([handX + 2, handY - 1], [handX + 11, handY - 9], [tipX, tipY], 1.7, 0.7, '#ffe473', true);
      p.bezierRibbon([handX + 3, handY - 2], [handX + 11, handY - 10], [tipX, tipY], 0.9, 0.4, '#ffffff', true);
      drawWrappedHand(p, handX, handY);
      if (pose.frame % 3 === 1) {
        p.setPart(SPRITE_PART.GLOW_FX);
        p.px(tipX + 1, tipY - 1, '#ffffff', true);
      }
    }
  },
};

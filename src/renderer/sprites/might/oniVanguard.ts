/**
 * 4. 鬼族先锋（武艺旧都 T2-A · 1×1 · 游牧民定位：高速先攻突击鬼将）
 * 飘逸月银波浪长发 + 高耸弯弧绯红金环双鬼角 + 深绯金边撕裂重披风 +
 * 黑漆朱甲鎏金大袖胴丸 + 鬼面双肩铠 + 叠片草摺战裙 + 45° 斜擎赤缨斩马大薙刀 + 先攻金电疾风斩！
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawKawaiiHead64,
  drawSlashArc64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import {
  drawOniHorn64,
  drawSparkStar64,
  drawWrappedHand64,
  HD_MIGHT_BASE,
} from './helpers';

export const oniVanguardSpec: SpriteRigSpec = {
  ...HD_MIGHT_BASE,
  backdropTop: '#1f080e',
  backdropBottom: '#4a121d',
  backdropGlow: '#ff5247',
  avatarCrop: { x: 13, y: 4, size: 37 },
  portraitCrop: { x: 2, y: 2, w: 60, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;

    const bx =
      isAtk && (f === 1 || f === 2)
        ? 25
        : isAtk && f === 0
          ? 27
          : isHit
            ? 27
            : Math.round(29 + pose.leanX * 0.9);
    const by = Math.max(-2, Math.round(pose.breathY * 0.9 - pose.stepLift * 0.9));
    const sway = pose.flutter * 1.6 + (isMove ? -2.2 : 0);
    const headY = 25 + by;

    // [1] 后景：猎猎翻飞的「深绯黑曜金边撕裂战披风」（衬托雪白长发与亮金大薙刀！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const capeX = Math.max(4, bx - 20 + Math.round(sway * 1.1));
    p.poly(
      [
        [bx - 8, 33 + by],
        [bx + 6, 33 + by],
        [bx + 7 - sway * 0.3, 56 + by],
        [bx - 4 + sway * 0.4, 59 + by],
        [bx - 12 + sway * 0.7, 54 + by],
        [capeX, 57 + by],
        [Math.max(5, capeX + 2), 44 + by],
      ],
      '#470812',
    );
    p.poly(
      [
        [bx - 7, 34 + by],
        [bx + 5, 34 + by],
        [bx + 5 - sway * 0.3, 54 + by],
        [bx - 10 + sway * 0.6, 52 + by],
        [Math.max(6, capeX + 3), 54 + by],
      ],
      '#9e1426',
    );
    p.line(Math.max(5, capeX + 2), 55 + by, bx - 4 + Math.round(sway * 0.4), 58 + by, '#ffe078', 1);
    p.line(bx - 7, 35 + by, Math.max(6, capeX + 2), 45 + by, '#ff5959', 1);

    // [2] 如霜月银波浪后长发（深靛灰暗面 + 冰银高光，气质瞬间拉满！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY - 1],
        [bx + 9, headY - 1],
        [bx + 9 - sway * 0.3, 41 + by],
        [bx + 4, 46 + by],
        [bx - 11 + sway * 0.6, 47 + by],
        [bx - 14 + sway * 0.7, 38 + by],
      ],
      '#4a5373',
    );
    p.poly(
      [
        [bx - 9, headY],
        [bx + 7, headY],
        [bx + 7 - sway * 0.3, 40 + by],
        [bx - 11 + sway * 0.5, 43 + by],
      ],
      '#c7d3eb',
    );
    p.bezierRibbon([bx - 8, headY + 4], [bx - 13 + sway * 0.5, 37 + by], [bx - 12 + sway * 0.7, 45 + by], 2.2, 0.8, '#ffffff');

    // [3] 3/4 疾行先攻重甲长战靴（黑铁护胫 + 鎏金护膝！）
    drawStaggeredLegs64(p, bx, 52, 66, pose, {
      sockShadow: '#301118',
      sockLight: '#6e202c',
      shoeDark: '#171a26',
      shoeMain: '#38415c',
      shoeHighlight: '#ffe078',
    });
    p.setPart(SPRITE_PART.LEGS);
    p.px(bx - 4 - Math.round(pose.stride * 3.5), 55, '#ffe478');
    p.px(bx + 4 + Math.round(pose.stride * 3.5), 57, '#ffe478');

    // [4] 深红金边叠片草摺战裙 + 纯白鬼纹前垂带 + 两侧立体黑红漆甲挂裙！
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 42 + by,
      waistW: 12.0,
      hemY: 54 + by,
      hemW: 29,
      tiltRight: 1.0,
      archDepth: 2.3,
      waveLobes: 4,
      waveAmp: 1.8,
      swayX: -pose.leanX * 0.4 + sway * 0.6,
      colors: {
        deep: '#1f080e',
        shadow: '#470d18',
        main: '#8c1828',
        light: '#cf2d3e',
        highlight: '#ff6670',
      },
      trimBand: {
        offsetFromHem: 1.8,
        thickness: 1.4,
        color: '#ffe078',
        shadowColor: '#9c681c',
      },
      petticoat: {
        peekDepth: 1.5,
        shade: '#21263b',
        main: '#3b4466',
        highlight: '#6d7db3',
      },
    });
    // 中央雪白金边鬼武前垂带 + 两侧叠片黑漆红线草摺甲
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly([[bx - 2, 42 + by], [bx + 3, 42 + by], [bx + 4 + sway * 0.2, 55 + by], [bx - 2 + sway * 0.2, 55 + by]], '#f5f7ff');
    p.vline(bx + 1, 43 + by, 11, '#d92234');
    p.hline(bx - 2 + sway * 0.2, 54 + by, 6, '#ffe078');
    // 左/右草摺挂甲片
    p.poly([[bx - 10, 42 + by], [bx - 4, 42 + by], [bx - 6, 50 + by], [bx - 12, 48 + by]], '#1c2030');
    p.hline(bx - 10, 44 + by, 5, '#d92638');
    p.hline(bx - 11, 47 + by, 5, '#ffe078');
    p.poly([[bx + 4, 42 + by], [bx + 10, 42 + by], [bx + 12, 48 + by], [bx + 6, 50 + by]], '#282f47');
    p.hline(bx + 5, 44 + by, 5, '#ff4757');
    p.hline(bx + 6, 47 + by, 5, '#ffe078');

    // [5] 亮黑漆×朱红片甲×鎏金收腰武神胴丸 + 双侧上翘赤金大袖肩铠！
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 7, 34 + by], [bx + 7, 34 + by], [bx + 6, 43 + by], [bx - 6, 43 + by]], '#1a1e2e');
    p.poly([[bx - 6, 35 + by], [bx + 6, 35 + by], [bx + 5, 41 + by], [bx - 5, 41 + by]], '#9e1928');
    p.hline(bx - 5, 36 + by, 10, '#e63946');
    p.hline(bx - 5, 39 + by, 10, '#ff6670');
    // 胸前金绳总角结 + 腰间鎏金战带
    p.line(bx - 4, 34 + by, bx, 38 + by, '#ffe078', 1);
    p.line(bx + 4, 34 + by, bx, 38 + by, '#fff5b8', 1);
    p.ellipse(bx, 38 + by, 2.0, 2.0, '#ffe478', true);
    p.hline(bx - 6, 42 + by, 12, '#f2c44d');
    // 威武上翘赤金鬼面大袖肩铠
    p.poly([[bx - 12, 33 + by], [bx - 5, 32 + by], [bx - 5, 39 + by], [bx - 11, 40 + by]], '#7a121f');
    p.hline(bx - 12, 33 + by, 7, '#ffe078');
    p.hline(bx - 11, 36 + by, 6, '#e63946');
    p.poly([[bx + 5, 32 + by], [bx + 12, 33 + by], [bx + 11, 40 + by], [bx + 5, 39 + by]], '#a61c2c');
    p.hline(bx + 5, 33 + by, 7, '#fff299');
    p.hline(bx + 5, 36 + by, 6, '#ff5964');

    // [6] 左护臂稳扶战腰/刀柄（黑钢护腕 + 金边）
    p.setPart(SPRITE_PART.BACK_ARM);
    const lHandX = isAtk && (f === 1 || f === 2) ? bx + 4 : bx - 9;
    const lHandY = isAtk && (f === 1 || f === 2) ? 40 + by : 44 + by;
    p.line(bx - 8, 36 + by, lHandX, lHandY, '#2e364f', 3);
    p.line(bx - 8, 35 + by, lHandX, lHandY - 1, '#92a4cc', 1);
    drawWrappedHand64(p, lHandX, lHandY, '#1c2130', '#4f5d80', '#ffe078');

    // [7] 凛冽英姿鬼将少女颜 + 琥珀金锐眸 + 月银雪发 + 弯弧高耸绯红金环双鬼角！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff7f2',
      skinMain: '#ffe4d8',
      skinShade: '#dfb3a2',
      lashColor: '#211229',
      irisDark: '#8c3d08',
      irisMid: '#ff9d24',
      irisGlow: '#fff799',
      blushColor: '#ff949e',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#4d5778',
      dark: '#8592ba',
      mid: '#d4dff5',
      light: '#f0f5ff',
      spec: '#ffffff',
      leftLockLen: 12,
      rightLockLen: 10,
      fluff: 1,
      sway,
    });
    // 额前鎏金细武士抹额
    p.setPart(SPRITE_PART.HEADWEAR);
    p.hline(bx - 7, headY - 7, 14, '#c91c2b');
    p.hline(bx - 6, headY - 8, 12, '#ffe078');
    // 高耸修长弯弧绯红双鬼角（彻底告别两根斜直棒！）
    drawOniHorn64(p, bx - 5, headY - 8, bx - 10, headY - 13, bx - 11, Math.max(3, headY - 19), {
      baseWidth: 3.4,
      shadowColor: '#660b14',
      mainColor: '#e02234',
      hiColor: '#ff968a',
      ringColor: '#ffe478',
    });
    drawOniHorn64(p, bx + 5, headY - 8, bx + 10, headY - 13, bx + 11, Math.max(3, headY - 19), {
      baseWidth: 3.4,
      shadowColor: '#660b14',
      mainColor: '#e02234',
      hiColor: '#ff968a',
      ringColor: '#ffe478',
    });

    // [8] 右臂黑钢护手 45° 飒爽斜擎「赤缨寒银斩马大薙刀」+ 先攻疾电黄金斩！
    p.setPart(SPRITE_PART.FRONT_ARM);
    let rHandX = bx + 11;
    let rHandY = 40 + by;
    let shaftBotX = bx - 3;
    let shaftBotY = 60 + by;
    let shaftTopX = bx + 20;
    let shaftTopY = 20 + by;
    if (isAtk && f === 0) {
      rHandX = bx + 7;
      rHandY = 36 + by;
      shaftBotX = Math.max(4, bx - 10);
      shaftBotY = 46 + by;
      shaftTopX = bx + 17;
      shaftTopY = 17 + by;
    } else if (isAtk && (f === 1 || f === 2)) {
      rHandX = bx + 15;
      rHandY = 40 + by;
      shaftBotX = bx - 5;
      shaftBotY = 43 + by;
      shaftTopX = Math.min(52, bx + 26);
      shaftTopY = 35 + by;
    }
    p.line(bx + 7, 36 + by, rHandX, rHandY, '#2e364f', 3);
    p.line(bx + 7, 35 + by, rHandX, rHandY - 1, '#b5c4e6', 1);

    p.setPart(SPRITE_PART.WEAPON);
    // 深黑朱漆盘金薙刀长柄
    p.line(shaftBotX, shaftBotY, shaftTopX, shaftTopY, '#3d1518', 3);
    p.line(shaftBotX, shaftBotY - 1, shaftTopX, shaftTopY - 1, '#c93838', 1);
    p.px(shaftBotX, shaftBotY, '#ffe078');

    const dx = shaftTopX - shaftBotX;
    const dy = shaftTopY - shaftBotY;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    // 鎏金莲瓣刀盘与飘飞绯红长缨
    p.ellipse(shaftTopX, shaftTopY, 2.6, 2.6, '#ffe078');
    p.bezierRibbon(
      [shaftTopX, shaftTopY],
      [shaftTopX + 2, shaftTopY + 5],
      [shaftTopX - 2 + sway * 0.5, shaftTopY + 11],
      2.4,
      0.8,
      '#d91e36',
    );
    p.bezierRibbon(
      [shaftTopX, shaftTopY],
      [shaftTopX + 3, shaftTopY + 4],
      [shaftTopX + 1 + sway * 0.4, shaftTopY + 9],
      1.2,
      0.5,
      '#ff7385',
    );

    // 优美上扬寒银厚背「鬼纹斩马大薙刀刃」（严格收在 x<=60, y>=3！）
    const tipX = Math.min(60, Math.round(shaftTopX + ux * 13 - nx * 2));
    const tipY = Math.max(4, Math.round(shaftTopY + uy * 13 - ny * 2));
    const bellyX = Math.min(60, Math.round(shaftTopX + ux * 7 + nx * 4.2));
    const bellyY = Math.max(4, Math.round(shaftTopY + uy * 7 + ny * 4.2));
    const backMidX = Math.min(59, Math.round(shaftTopX + ux * 6 - nx * 1.4));
    const backMidY = Math.max(4, Math.round(shaftTopY + uy * 6 - ny * 1.4));
    p.poly(
      [
        [shaftTopX - nx * 1.2, shaftTopY - ny * 1.2],
        [backMidX, backMidY],
        [tipX, tipY],
        [bellyX, bellyY],
        [shaftTopX + nx * 2.2, shaftTopY + ny * 2.2],
      ],
      '#3a4766',
    );
    p.poly(
      [
        [shaftTopX + ux * 1, shaftTopY + uy * 1],
        [backMidX, backMidY],
        [tipX, tipY],
        [bellyX, bellyY],
      ],
      '#ebf4ff',
      isAtk,
    );
    p.line(shaftTopX + nx * 2, shaftTopY + ny * 2, bellyX, bellyY, '#ffffff', 1, true);
    p.line(bellyX, bellyY, tipX, tipY, '#ffffff', 1, true);
    p.line(shaftTopX + ux * 2, shaftTopY + uy * 2, backMidX, backMidY, '#ffe066', 1);
    drawWrappedHand64(p, rHandX, rHandY, '#1c2130', '#4f5d80', '#ffe078');

    // 先攻金电疾风斩双层弧光（严格收于 x<=61！）
    if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, bx + 20, 36 + by, 14, 15, -1.2, 1.0, '#d92638', '#ff9d24', '#fff5a6');
      drawSlashArc64(p, bx + 22, 36 + by, 11, 12, -1.0, 0.85, '#ffe066', '#ffffff', '#ffffff');
      drawSparkStar64(p, Math.min(59, tipX), Math.max(6, tipY - 3), 2, '#ffe878');
    }
  },
};

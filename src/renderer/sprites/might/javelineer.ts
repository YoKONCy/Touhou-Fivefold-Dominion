/**
 * 3. 标枪手（武艺旧都 T1-B · 1×1 · 远程重标枪 + 近战无衰减）
 * v5 彻底重铸高颜值「苍青游侠披肩 × 象牙白鎏金轻甲 × 明媚亮金侧高马尾」猎鬼飞枪姬：
 * 彻底告别浑身土褐栗子感与标枪穿脸！斜戴赤金双羽游侠猎帽 + 背后红漆鎏金备矛箭筒 +
 * 左侧身护绀蓝鎏金小圆盾 + 右手高举过肩斜指苍穹的寒银红缨破甲重标枪！
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
import { drawSparkStar64, drawWrappedHand64, HD_MIGHT_BASE } from './helpers';

export const javelineerSpec: SpriteRigSpec = {
  ...HD_MIGHT_BASE,
  backdropTop: '#0d1a26',
  backdropBottom: '#213647',
  backdropGlow: '#ff9d47',
  avatarCrop: { x: 13, y: 4, size: 37 },
  portraitCrop: { x: 2, y: 2, w: 60, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;

    const bx =
      isAtk && (f === 1 || f === 2)
        ? 26
        : isAtk && f === 0
          ? 27
          : isHit
            ? 27
            : Math.round(28 + pose.leanX * 0.9);
    const by = Math.max(-2, Math.round(pose.breathY * 1.0 - pose.stepLift * 0.85));
    const sway = pose.flutter * 1.6 + (isMove ? -2.0 : 0);
    const headY = 26 + by;

    // [1] 后景：飘逸飞扬的「苍青金边游侠短斗篷」+ 红漆金箍备矛箭筒（2支银枪备矛！）+ 活力亮金侧马尾！
    p.setPart(SPRITE_PART.BACK_ACC);
    // 苍青游侠短斗篷（清爽高雅，彻底告别一团泥褐！）
    const capeX = Math.max(4, bx - 18 + Math.round(sway));
    p.poly(
      [
        [bx - 6, 35 + by],
        [bx + 5, 35 + by],
        [bx - 12 + Math.round(sway * 0.7), 50 + by],
        [capeX, 45 + by],
      ],
      '#10474f',
    );
    p.poly(
      [
        [bx - 5, 36 + by],
        [bx + 4, 36 + by],
        [bx - 11 + Math.round(sway * 0.6), 48 + by],
        [Math.max(6, capeX + 2), 44 + by],
      ],
      '#1e7d82',
    );
    p.line(Math.max(5, capeX + 1), 45 + by, bx - 11 + Math.round(sway * 0.7), 49 + by, '#ffe078', 1);

    // 背后斜插红漆金箍备矛箭筒（清晰露出 2 支雪亮寒银备矛枪头！）
    p.poly([[bx - 11, 30 + by], [bx - 6, 28 + by], [bx - 3, 44 + by], [bx - 8, 46 + by]], '#7a1c1c');
    p.line(bx - 10, 32 + by, bx - 6, 30 + by, '#ffe078', 1);
    const qTips: Array<[number, number]> = [
      [Math.max(5, bx - 14), 14 + by],
      [Math.max(7, bx - 9), 11 + by],
    ];
    for (const [qx, qy] of qTips) {
      p.line(bx - 8, 30 + by, qx, qy + 3, '#6e3b1f', 2);
      p.poly([[qx, Math.max(4, qy - 3)], [qx - 2, qy + 3], [qx + 2, qy + 3]], '#eef6ff');
      p.px(qx, Math.max(4, qy - 2), '#ffffff', true);
      p.px(qx, qy + 4, '#ff4757');
    }

    // 俏皮飞扬的「蜜桃亮金侧高马尾」（清爽高明度！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    const tailX = Math.max(4, bx - 19 + Math.round(sway * 1.1));
    p.bezierRibbon([bx - 7, headY - 3], [bx - 16 + sway * 0.5, headY + 2], [tailX, headY + 14 + sway * 0.7], 5.6, 1.7, '#b5741e');
    p.bezierRibbon([bx - 7, headY - 2], [bx - 15 + sway * 0.4, headY + 2], [tailX + 1, headY + 12 + sway * 0.6], 3.4, 1.0, '#f5c252');
    p.bezierRibbon([bx - 8, headY - 2], [bx - 14 + sway * 0.4, headY + 1], [tailX + 2, headY + 9 + sway * 0.5], 1.5, 0.6, '#fff4b8');
    p.setPart(SPRITE_PART.HEADWEAR);
    p.rect(bx - 9, headY - 4, 3, 4, '#e62e3d');
    p.px(bx - 8, headY - 3, '#ffe878');

    // [2] 轻捷 3/4 跨步双腿：象牙白过膝袜 + 亮铜镶金猎手皮短靴！
    drawStaggeredLegs64(p, bx, 53, 66, pose, {
      skinColor: '#ffe3d2',
      sockShadow: '#cfd6e6',
      sockLight: '#ffffff',
      shoeDark: '#472112',
      shoeMain: '#9c4b26',
      shoeHighlight: '#ffe078',
    });

    // [3] 苍青×象牙白双层游侠百褶短裙 + 绯红鎏金腰带！（明快清透极具东方猎手美感！）
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 42 + by,
      waistW: 11.2,
      hemY: 54 + by,
      hemW: 28,
      tiltRight: 1.0,
      archDepth: 2.3,
      waveLobes: 3.5,
      waveAmp: 1.7,
      swayX: -pose.leanX * 0.5 + sway * 0.8,
      colors: {
        deep: '#0e363d',
        shadow: '#175961',
        main: '#248c8f',
        light: '#47bdb8',
        highlight: '#8cf0e8',
      },
      trimBand: {
        offsetFromHem: 1.8,
        thickness: 1.4,
        color: '#ffe078',
        shadowColor: '#ad7a1f',
      },
      petticoat: {
        peekDepth: 2.0,
        shade: '#d6dceb',
        main: '#ffffff',
        highlight: '#ffffff',
      },
    });
    // 中央洁白镶红金猎手前垂巾 + 绯红皮腰带
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly([[bx - 3, 42 + by], [bx + 3, 42 + by], [bx + 4 + sway * 0.2, 54 + by], [bx - 3 + sway * 0.2, 54 + by]], '#ffffff');
    p.vline(bx, 43 + by, 10, '#e6323e');
    p.hline(bx - 3 + sway * 0.2, 53 + by, 7, '#ffe078');
    p.hline(bx - 6, 41 + by, 13, '#8c171f');
    p.hline(bx - 6, 42 + by, 13, '#e6323e');
    p.rect(bx - 1, 41 + by, 3, 3, '#ffe878');

    // [4] 象牙白内衫 + 苍青金边游侠短披肩领 + 亮金胸甲扣 + 左肩铜金护肩！
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 34 + by], [bx + 6, 34 + by], [bx + 6, 42 + by], [bx - 5, 42 + by]], '#d9e0f0');
    p.poly([[bx - 4, 34 + by], [bx + 5, 34 + by], [bx + 4, 41 + by], [bx - 4, 41 + by]], '#ffffff');
    // 苍青金边V形短披肩领 + 鲜红胸口领结
    p.poly([[bx - 8, 34 + by], [bx + 8, 34 + by], [bx + 6, 38 + by], [bx - 7, 38 + by]], '#1b6d75');
    p.hline(bx - 7, 37 + by, 14, '#ffe078');
    p.rect(bx - 1, 37 + by, 3, 3, '#e62e3d');
    p.px(bx, 38 + by, '#fff5b8');

    // [5] 左手侧身优雅护持「深绀蓝×鎏金星纹精致小圆盾」（置于身侧外缘，绝不糊住胸腰！）
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 36 + by, '#15545c', '#2ea3a6', '#ffe078', 'left');
    const shX = Math.max(9, bx - 13);
    const shY = 43 + by;
    drawSoftChibiArm64(p, bx - 7, 37 + by, shX + 3, shY, '#ffe6d8', '#dfb4a0');
    p.setPart(SPRITE_PART.WEAPON);
    p.ellipse(shX, shY, 4.8, 6.2, '#e6b23c');
    p.ellipse(shX, shY, 3.8, 5.1, '#193059');
    p.ellipse(shX + 0.5, shY - 0.5, 2.7, 3.8, '#3662ab');
    p.ellipse(shX, shY, 1.7, 2.0, '#ffe878', true);
    p.px(shX, shY - 1, '#ffffff', true);
    p.px(shX, shY - 4, '#fff5b8');
    p.px(shX, shY + 4, '#fff5b8');

    // [6] 元气飒爽少女颜 + 璀璨翡翠青/琥珀金锐眸 + 亮蜜金空气刘海 + 帅气斜戴「苍青金羽游侠猎帽」！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff8f2',
      skinMain: '#ffe6d8',
      skinShade: '#dfb4a0',
      lashColor: '#3b1e10',
      irisDark: '#8c3d08',
      irisMid: '#f28c1e',
      irisGlow: '#fff285',
      blushColor: '#ff969e',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#9c5e14',
      dark: '#d48d2a',
      mid: '#fad059',
      light: '#ffeb99',
      spec: '#fffde0',
      leftLockLen: 9,
      rightLockLen: 8,
      fluff: 1,
      bobFlare: true,
      sway,
    });
    // 标志性斜戴「苍青鎏金游侠猎帽 + 冲天绯红金羽」（彻底告别扣碗锅盖头！）
    p.setPart(SPRITE_PART.HEADWEAR);
    const hatY = headY - 8;
    // 俏皮微斜帽檐
    p.ellipse(bx, hatY, 12.6, 2.8, '#0f3b42');
    p.ellipse(bx + 0.5, hatY - 0.5, 11.4, 2.0, '#217a82');
    p.hline(bx - 8, hatY - 1, 16, '#ffe078');
    // 立体斜尖游侠帽冠
    p.poly(
      [
        [bx - 8, hatY - 1],
        [bx + 8, hatY - 1],
        [bx + 5, hatY - 6],
        [bx - 2, Math.max(4, hatY - 9)],
        [bx - 9, hatY - 5],
      ],
      '#155961',
    );
    p.poly(
      [
        [bx - 6, hatY - 1],
        [bx + 6, hatY - 1],
        [bx + 4, hatY - 5],
        [bx - 1, Math.max(5, hatY - 8)],
        [bx - 7, hatY - 4],
      ],
      '#2fa6a8',
    );
    p.line(bx - 6, hatY - 4, bx - 1, Math.max(5, hatY - 8), '#8cf0e8', 1);
    // 额前金扣与右侧飞扬的绯红白尖猎羽！
    p.rect(bx + 2, hatY - 4, 3, 3, '#ffe478');
    p.bezierRibbon([bx + 4, hatY - 3], [bx + 10, hatY - 9], [bx + 15, Math.max(4, hatY - 11)], 2.8, 0.8, '#d92234');
    p.bezierRibbon([bx + 4, hatY - 4], [bx + 10, hatY - 9], [bx + 15, Math.max(4, hatY - 11)], 1.2, 0.6, '#ff949e');
    p.px(bx + 15, Math.max(4, hatY - 11), '#ffffff', true);

    // [7] 右前臂泡泡袖高举过肩稳擎「寒银三棱红缨破甲重标枪」（全程位于身侧外域，100% 零穿脸！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 36 + by, '#15545c', '#2ea3a6', '#ffe078', 'right');
    let rHandX = bx + 13;
    let rHandY = 35 + by - Math.round(pose.armAction * 1.5);
    let javTailX = bx + 4;
    let javTailY = 57 + by;
    let tipX = Math.min(58, bx + 26);
    let tipY = 14 + by;

    if (isAtk && f === 0) {
      // 蓄力帧：右臂向身侧外展后拉瞄准，长标枪斜指右上方蓄势破空（远离脸部 10px+，100% 不挡脸！）
      rHandX = bx + 14;
      rHandY = 33 + by;
      javTailX = bx + 7;
      javTailY = 46 + by;
      tipX = Math.min(59, bx + 29);
      tipY = 17 + by;
    } else if (isAtk && (f === 1 || f === 2)) {
      // 爆发帧：弓步顺肩平掷破空，长标枪如虹直穿前方（严格 x<=60 零裁切！）
      rHandX = bx + 15;
      rHandY = 34 + by;
      javTailX = bx + 7;
      javTailY = 34 + by;
      tipX = 60;
      tipY = 34 + by;
    }
    drawSoftChibiArm64(p, bx + 7, 36 + by, rHandX, rHandY, '#ffe6d8', '#dfb4a0');

    // 修长寒银破甲重标枪绘制
    p.setPart(SPRITE_PART.WEAPON);
    const dx = tipX - javTailX;
    const dy = tipY - javTailY;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    const neckX = Math.round(tipX - ux * 8);
    const neckY = Math.round(tipY - uy * 8);

    // 优雅胡桃木包金枪杆
    p.line(javTailX, javTailY, neckX, neckY, '#4d2612', 3);
    p.line(javTailX, javTailY - 1, neckX, neckY - 1, '#d98f45', 1);
    p.px(javTailX, javTailY, '#ffe078');
    // 枪颈飘逸绯红长枪缨
    p.bezierRibbon([neckX, neckY], [neckX - 1, neckY + 5], [neckX - 4 + sway * 0.4, neckY + 9], 2.4, 0.8, '#d91e36');
    p.bezierRibbon([neckX, neckY], [neckX, neckY + 4], [neckX - 2 + sway * 0.3, neckY + 8], 1.2, 0.5, '#ff8090');
    p.ellipse(neckX, neckY, 2.0, 2.0, '#ffe478');
    // 锋利寒银三棱破甲枪头
    p.poly(
      [
        [Math.round(neckX + nx * 3.0), Math.round(neckY + ny * 3.0)],
        [tipX, tipY],
        [Math.round(neckX - nx * 3.0), Math.round(neckY - ny * 3.0)],
      ],
      '#475c85',
    );
    p.poly(
      [
        [Math.round(neckX + nx * 2.0), Math.round(neckY + ny * 2.0)],
        [tipX, tipY],
        [Math.round(neckX - nx * 0.8), Math.round(neckY - ny * 0.8)],
      ],
      '#f2f8ff',
      isAtk,
    );
    p.line(neckX, neckY, tipX, tipY, '#ffffff', 1, true);
    drawWrappedHand64(p, rHandX, rHandY, '#26140c', '#8c4b24', '#ffe078');

    // 蓄力聚能星芒 / 投掷青白金穿刺破空气浪（严格 x<=60！）
    if (isAtk && f === 0) {
      drawSparkStar64(p, Math.min(59, tipX), tipY, 3, '#ffe878');
    } else if (isAtk && (f === 1 || f === 2)) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.bezierRibbon([neckX - 1, neckY - 7], [neckX + 4, neckY], [neckX - 1, neckY + 7], 2.2, 0.8, '#66e8ff', true);
      p.line(javTailX + 2, neckY - 3, neckX + 2, neckY - 3, '#ffe878', 1, true);
      p.line(javTailX + 4, neckY + 3, neckX + 3, neckY + 3, '#9cf5ff', 1, true);
      drawSparkStar64(p, 58, tipY, 2, '#ffffff');
    }
  },
};

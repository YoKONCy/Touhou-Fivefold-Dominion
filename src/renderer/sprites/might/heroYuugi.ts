/**
 * 1. 星熊勇仪（武艺旧都 · 力量英雄 · 1×1 纯格斗大姐头宗师）
 * 蓬松微卷灿金短发 + 红五角星额饰绯红立体单鬼角 + 白色蓬袖短衫与飘动绯红领巾 +
 * 深绀蓝三层波浪花瓣百褶长裙 + 双腕玄铁镣铐长垂链 + 左手稳端三足朱漆星熊杯 + 右手炽金红「三步必杀」崩山重拳！
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
import {
  drawHollowRing64,
  drawIronChain64,
  drawOniHorn64,
  drawSakeDish64,
  drawSparkStar64,
  drawWrappedHand64,
  HD_MIGHT_BASE,
} from './helpers';

export const HERO_YUUGI_RIG_SPEC: SpriteRigSpec = {
  ...HD_MIGHT_BASE,
  backdropTop: '#1f0b0e',
  backdropBottom: '#4a1b17',
  backdropGlow: '#ff8a3d',
  avatarCrop: { x: 11, y: 3, size: 39 },
  portraitCrop: { x: 2, y: 2, w: 60, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx =
      isAtk && (f === 1 || f === 2)
        ? 27
        : isAtk && f === 0
          ? 27
          : isHit
            ? 27
            : Math.round(30 + pose.leanX * 0.9);
    const by = Math.max(-2, Math.round(pose.breathY * 1.0 - pose.stepLift * 0.85));
    const sway = pose.flutter * 1.5 + (isMove ? -2.0 : 0);
    const headY = 25 + by;

    // [1] 后景：自然甩荡的「双腕长垂玄铁鬼王锁链」（与飘动衣摆错开留出清晰负空间！）
    const cSway = Math.round(sway * 1.4);
    drawIronChain64(
      p,
      [
        [bx - 13, 41 + by],
        [Math.max(7, bx - 16 + Math.round(cSway * 0.4)), 46 + by],
        [Math.max(6, bx - 18 + Math.round(cSway * 0.8)), 51 + by],
        [Math.max(5, bx - 17 + cSway), 56 + by],
      ],
      SPRITE_PART.BACK_ACC,
    );
    // 铁链尾端重锤铁球（地灵殿标志性鬼族枷锁！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const ballX = Math.max(6, bx - 16 + cSway);
    const ballY = Math.min(62, 60 + by);
    p.ellipse(ballX, ballY, 3.2, 3.0, '#1e2436');
    p.ellipse(ballX - 0.5, ballY - 0.6, 2.2, 2.0, '#5a688c');
    p.px(ballX - 1, ballY - 1, '#dbe6ff');

    // [2] 蓬松外翘灿金色微卷后发（地灵殿星熊勇仪标志性齐肩外翻发尾！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 11, headY - 2],
        [bx + 10, headY - 2],
        [bx + 13 - sway * 0.3, 35 + by],
        [bx + 11 - sway * 0.4, 41 + by],
        [bx + 5, 38 + by],
        [bx - 5, 38 + by],
        [bx - 12 + sway * 0.5, 42 + by],
        [bx - 14 + sway * 0.6, 35 + by],
      ],
      '#9c610e',
    );
    p.poly(
      [
        [bx - 10, headY - 1],
        [bx + 9, headY - 1],
        [bx + 11 - sway * 0.3, 34 + by],
        [bx + 9 - sway * 0.3, 39 + by],
        [bx - 10 + sway * 0.4, 39 + by],
        [bx - 12 + sway * 0.5, 34 + by],
      ],
      '#f2be3d',
    );
    // 外翘卷发高光丝缕
    p.bezierRibbon([bx - 10, headY + 4], [bx - 13 + sway * 0.4, 35 + by], [bx - 12 + sway * 0.6, 40 + by], 2.0, 0.8, '#fff099');
    p.bezierRibbon([bx + 9, headY + 4], [bx + 12 - sway * 0.3, 34 + by], [bx + 10 - sway * 0.4, 39 + by], 1.8, 0.7, '#ffe678');

    // [3] 3/4 英姿豪迈跨步双腿 + 红绳漆木鬼王战履
    drawStaggeredLegs64(p, bx, 53, 66, pose, {
      skinColor: '#ffe0cf',
      sockShadow: '#d9b5a6',
      sockLight: '#ffe8db',
      shoeDark: '#471014',
      shoeMain: '#a61c28',
      shoeHighlight: '#ffd670',
    });

    // [4] 左后臂稳稳平端「三足朱漆金边星熊杯」（无论怎么出拳美酒绝不洒一滴！）
    const dishX = Math.max(10, isAtk && f === 0 ? bx - 14 : bx - 13);
    const dishY = isAtk && (f === 1 || f === 2) ? 39 + by : isAtk && f === 0 ? 37 + by : 40 + by;
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.8, 36 + by, '#cfd8eb', '#ffffff', '#e63946', 'left');
    drawSoftChibiArm64(p, bx - 8, 37 + by, dishX + 3, dishY + 2, '#fff0e6', '#e6b29e');
    // 左腕玄铁厚手铐
    p.setPart(SPRITE_PART.WEAPON);
    p.rect(dishX + 2, dishY, 3, 4, '#2a334a');
    p.vline(dishX + 3, dishY, 4, '#92a3cc');
    p.px(dishX + 3, dishY + 1, '#ffffff');
    drawSakeDish64(p, dishX, dishY, isAtk, phase);

    // [5] 标志性深绀蓝三层波浪花瓣长裙 + 纯白波浪蕾丝衬裙 + 绯红鎏金鬼纹裙缘！
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 42 + by,
      waistW: 11.5,
      hemY: 54 + by,
      hemW: 31,
      tiltRight: 1.0,
      archDepth: 2.8,
      waveLobes: 4,
      waveAmp: 2.2,
      swayX: -pose.leanX * 0.5 + sway * 0.85,
      colors: {
        deep: '#0c1538',
        shadow: '#162863',
        main: '#27489e',
        light: '#4772cf',
        highlight: '#7ca8ff',
      },
      trimBand: {
        offsetFromHem: 2.0,
        thickness: 1.4,
        color: '#ff5247',
        shadowColor: '#8c171b',
      },
      petticoat: {
        peekDepth: 2.2,
        shade: '#c7d3eb',
        main: '#f2f6ff',
        highlight: '#ffffff',
      },
    });
    // 腰间赤红×黄金双层鬼族腰带 + 侧飘细红流苏结
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.hline(bx - 6, 42 + by, 13, '#8c151f');
    p.hline(bx - 6, 41 + by, 13, '#e62e3d');
    p.hline(bx - 5, 42 + by, 11, '#ffd966');
    p.rect(bx - 1, 41 + by, 3, 3, '#fff5b8');
    p.bezierRibbon([bx + 4, 42 + by], [bx + 8 + sway * 0.3, 47 + by], [bx + 7 + sway * 0.5, 51 + by], 1.8, 0.7, '#e62e3d');
    p.px(bx + 7 + Math.round(sway * 0.5), 51 + by, '#ffe066');

    // [6] 修身纯白短衫 + 微微露腰立体光影 + 醒目飘扬绯红细领巾 + 胸前金扣
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 34 + by], [bx + 6, 34 + by], [bx + 6, 41 + by], [bx - 5, 41 + by]], '#d2dceb');
    p.poly([[bx - 4, 34 + by], [bx + 5, 34 + by], [bx + 5, 40 + by], [bx - 4, 40 + by]], '#ffffff');
    // 微露健康小麦白腰线
    p.hline(bx - 4, 40 + by, 9, '#ffdcc9');
    // 标志性鲜红水手领口与随风轻扬红领带
    p.line(bx - 4, 34 + by, bx, 37 + by, '#c91c2b', 2);
    p.line(bx + 5, 34 + by, bx + 1, 37 + by, '#ff4d5a', 2);
    p.poly([[bx - 1, 36 + by], [bx + 2, 36 + by], [bx + 3 + Math.round(sway * 0.3), 42 + by], [bx - 1 + Math.round(sway * 0.2), 42 + by]], '#e62236');
    p.vline(bx + 1, 36 + by, 5, '#ff7380');
    p.px(bx, 36 + by, '#ffe878');

    // [7] 豪爽自信大姐头容颜 + 璀璨苍蓝 4×4 大眼 + 小虎牙 + 灿金短发 + 招牌红星单鬼角！！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff7f0',
      skinMain: '#ffe3d4',
      skinShade: '#e3ad98',
      lashColor: '#2b1224',
      irisDark: '#0f2c82',
      irisMid: '#2968eb',
      irisGlow: '#8cd4ff',
      blushColor: '#ff969e',
      vampireFang: true,
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#995e0b',
      dark: '#d4901c',
      mid: '#fad046',
      light: '#ffeb85',
      spec: '#fffde0',
      leftLockLen: 10,
      rightLockLen: 9,
      fluff: 1,
      bobFlare: true,
      sway,
    });
    // 标志性前额「粗壮微弯绯红立体鬼王单角 + 璀璨红五角星饰」
    drawOniHorn64(p, bx + 1, headY - 8, bx + 3, headY - 14, bx + 7, Math.max(3, headY - 19), {
      baseWidth: 4.0,
      shadowColor: '#6b0d17',
      mainColor: '#e02438',
      hiColor: '#ff9c8a',
      ringColor: '#ffe478',
    });
    // 角根五芒红金星徽（星熊勇仪最经典的辨识灵魂！）
    p.setPart(SPRITE_PART.HEADWEAR);
    p.rect(bx - 1, headY - 10, 4, 3, '#c9182b');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx + 1, headY - 10, '#ff4d5a', true);
    p.px(bx + 1, headY - 9, '#ffe885', true);

    // [8] 右前臂泡泡袖 + 玄铁重手铐垂链 + 怪力乱神「三步必杀」狂暴重拳！！
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.8, 36 + by, '#cfd8eb', '#ffffff', '#e63946', 'right');
    let fistX = bx + 12;
    let fistY = 39 + by - Math.round(pose.armAction * 1.5);
    if (isAtk && f === 0) {
      // 蓄力帧：沉肩拉肘后蓄，右拳燃起炽金红鬼气涡流！
      fistX = bx + 7;
      fistY = 41 + by;
    } else if (isAtk && (f === 1 || f === 2)) {
      // 爆发帧：猛烈前突直拳轰出，气浪直贯前方（严格收于 x<=60 零裁切！）
      fistX = bx + 15;
      fistY = 36 + by;
    }
    drawSoftChibiArm64(p, bx + 8, 37 + by, fistX - 2, fistY, '#fff0e6', '#e6b29e');

    // 右腕厚重玄铁手铐 + 垂落半截短链
    p.setPart(SPRITE_PART.WEAPON);
    p.rect(fistX - 5, fistY - 2, 3, 4, '#252e42');
    p.vline(fistX - 4, fistY - 2, 4, '#92a3cc');
    p.px(fistX - 4, fistY - 1, '#ffffff');
    drawIronChain64(
      p,
      [
        [fistX - 4, fistY + 4],
        [fistX - 5 + Math.round(sway * 0.3), fistY + 8],
      ],
      SPRITE_PART.WEAPON,
    );
    // 强健紧握右拳
    drawWrappedHand64(p, fistX, fistY, '#d99e89', '#ffe3d4', '#ffffff');

    // [9] 「三步必杀」蓄力与轰击特效（严格收在 x<=61 零裁切！）
    if (isAtk && f === 0) {
      drawHollowRing64(p, fistX + 1, fistY, 6.4, 6.4, 0.72, '#e62e1a', '#ffaa24', '#fff7bd');
      drawSparkStar64(p, fistX + 5, fistY - 5, 2, '#ffe878');
    } else if (isAtk && (f === 1 || f === 2)) {
      // 双层炽金红破空拳风气刃 + 中心白金爆震核（严格收于 x<=60 零裁切！）
      drawSlashArc64(p, fistX - 1, fistY, 10, 12, -1.2, 1.2, '#d91e2a', '#ff8024', '#fff5a6');
      drawSlashArc64(p, fistX + 2, fistY, 12, 14, -1.0, 1.0, '#ff4d1a', '#ffe066', '#ffffff');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(fistX + 2, fistY, 3.4, 2.8, '#ff8024', true);
      p.ellipse(fistX + 2, fistY, 1.7, 1.4, '#ffffff', true);
      drawSparkStar64(p, Math.min(58, fistX + 12), fistY - 9, 2, '#ffe878');
      drawSparkStar64(p, Math.min(58, fistX + 13), fistY + 8, 2, '#ff7338');
    }
  },
};

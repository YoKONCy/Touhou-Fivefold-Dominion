/**
 * 6. 净邪巫女（T3-B · 远程施法 + 抗死结界）64×72 HD 像素精灵绘谱
 * 东方琉璃莲僧神官少女 · 紫藤长发 + 莲花金钿 + 翡翠滚金袈裟白袍 + 鎏金念珠法轮 + 六环大锡杖！
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawKawaiiHead64,
  drawSlashArc64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawHollowGoldRing64, drawWrappedHand, HD_BASE } from './helpers';

export const creaturePrayerMaidenSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0d1929',
  backdropBottom: '#1a2f42',
  backdropGlow: '#78f5df',
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const bx = isAtk && (f === 1 || f === 2) ? 26 : Math.round(29 + pose.leanX * 0.8);
    const by = Math.round(pose.breathY * 1.3 - pose.stepLift * 1.1 - 1);
    const sway = pose.flutter * 1.5;
    const headY = 23 + by;

    // [1] 脚下缓缓绽放的「青玉莲光浮空法阵」+ 背后悬空公转「12 珠鎏金翡翠念珠轮」！
    p.setPart(SPRITE_PART.BACK_ACC);
    p.ellipse(bx, 64, 15.0, 3.4, '#1a7d70', true);
    p.ellipse(bx, 64, 10.5, 2.0, '#78ffe8', true);
    p.hline(bx - 6, 64, 12, '#e6fffb', true);

    const ringY = 27 + by;
    p.setPart(SPRITE_PART.GLOW_FX);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + phase * 0.5;
      const rx = Math.max(3, Math.min(60, Math.round(bx + Math.cos(a) * 19.5)));
      const ry = Math.max(3, Math.min(58, Math.round(ringY + Math.sin(a) * 18.5)));
      if (i % 3 === 0) {
        p.ellipse(rx, ry, 1.8, 1.8, '#59f5db', true);
        p.px(rx, ry - 1, '#ffffff', true);
      } else {
        p.rect(rx - 1, ry - 1, 2, 2, '#ffe066', true);
      }
    }

    // [2] 瀑布般柔美紫藤丁香长后发（优雅区别于灵梦乌黑长发！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 11 - sway * 0.4, 45 + by],
        [bx + 6 - sway * 0.6, 52 + by],
        [bx - 9 + sway * 0.7, 53 + by],
        [bx - 13 + sway * 0.8, 44 + by],
      ],
      '#4b3773',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 8 - sway * 0.3, 44 + by],
        [bx - 10 + sway * 0.5, 45 + by],
      ],
      '#7e63b0',
    );
    p.bezierRibbon([bx - 8, headY + 6], [bx - 11 + sway * 0.5, 40 + by], [bx - 11 + sway * 0.8, 50 + by], 2.2, 0.8, '#c2aaf0');

    // [3] 3/4 斜错步雪白足袋 + 青玉滚金神官鞋
    drawStaggeredLegs64(p, bx, 52, 64, pose, {
      sockShadow: '#cedae6',
      sockLight: '#ffffff',
      shoeDark: '#16635b',
      shoeMain: '#2db5a5',
      shoeHighlight: '#ffe885',
    });

    // [4] 左后臂：优雅垂坠青玉鎏金广袖 + 娇嫩柔手结净灵祈愿手印
    p.setPart(SPRITE_PART.BACK_ARM);
    p.poly(
      [
        [bx - 5, 33 + by],
        [bx - 14 + sway * 0.4, 37 + by],
        [bx - 17 + sway * 0.6, 48 + by],
        [bx - 10 + sway * 0.4, 50 + by],
        [bx - 6, 44 + by],
      ],
      '#19756b',
    );
    p.poly(
      [
        [bx - 5, 34 + by],
        [bx - 12 + sway * 0.4, 38 + by],
        [bx - 14 + sway * 0.5, 47 + by],
        [bx - 8, 44 + by],
      ],
      '#34b8a8',
    );
    p.bezierRibbon(
      [bx - 16 + sway * 0.6, 48 + by],
      [bx - 12 + sway * 0.5, 49 + by],
      [bx - 8, 45 + by],
      1.6,
      1.2,
      '#ffe478',
    );
    p.ellipse(bx - 15 + Math.round(sway * 0.4), 41 + by, 1.8, 1.8, '#ffe6d6');
    // 祈愿指尖轻浮碧玉莲光微点
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx - 17 + Math.round(sway * 0.4), 37 + by, 2.0, 2.0, '#66ffea', true);
    p.px(bx - 17 + Math.round(sway * 0.4), 37 + by, '#ffffff', true);

    // [5] 干净大色块 3/4 琉璃珍珠白长祭司裙袍 + 翡翠鎏金双层滚边！
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 40 + by,
      waistW: 10,
      hemY: 53 + by,
      hemW: 30,
      tiltRight: 0.8,
      archDepth: 2.6,
      waveLobes: 3.5,
      waveAmp: 1.5,
      swayX: -pose.leanX * 0.4 + sway * 0.75,
      colors: {
        deep: '#adbdd6',
        shadow: '#d5e0f0',
        main: '#f2f7ff',
        light: '#fafdff',
        highlight: '#ffffff',
      },
      trimBand: {
        offsetFromHem: 2.2,
        thickness: 1.8,
        color: '#2dc2b0',
        shadowColor: '#197d71',
      },
      petticoat: {
        peekDepth: 1.8,
        shade: '#d4b357',
        main: '#ffe885',
        highlight: '#fff9cc',
      },
    });

    // [6] 洁白禅衣上身 + 斜披翡翠鎏金「天女袈裟」+ 胸口莲花翡翠玉佩
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#e6eef7');
    p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#ffffff');
    // 斜披碧玉鎏金袈裟绶带
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.line(bx - 5, 32 + by, bx + 5, 40 + by, '#1a7d71', 4);
    p.line(bx - 5, 32 + by, bx + 5, 40 + by, '#3ad1bf', 2);
    p.line(bx - 5, 31 + by, bx + 5, 39 + by, '#ffe478', 1);
    p.hline(bx - 5, 40 + by, 11, '#24998b');
    p.hline(bx - 4, 40 + by, 9, '#ffe880');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx + 1, 36 + by, 2.0, 2.0, '#66ffea', true);
    p.px(bx + 1, 35 + by, '#ffffff', true);

    // [7] 澄澈温婉神官少女脸 + 翡翠碧波 4×4 大眼 + 紫藤长发 + 精雕金莲额冠与双鬓金铃饰！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff8f2',
      skinMain: '#ffe6d6',
      skinShade: '#e6b29e',
      lashColor: '#291c40',
      irisDark: '#12736b',
      irisMid: '#26c9b8',
      irisGlow: '#a6fff4',
      blushColor: '#ff9cb5',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#4a3673',
      dark: '#7256a3',
      mid: '#9f82d4',
      light: '#cfb8f7',
      spec: '#f2ebff',
      leftLockLen: 13,
      rightLockLen: 12,
      fluff: 2,
      sway,
    });
    // 精致金莲翡翠额冠 + 双鬓金色小莲坠
    p.setPart(SPRITE_PART.HEADWEAR);
    p.poly(
      [
        [bx - 6, headY - 8],
        [bx - 3, headY - 12],
        [bx, headY - 14],
        [bx + 3, headY - 12],
        [bx + 6, headY - 8],
      ],
      '#d9a12b',
    );
    p.poly(
      [
        [bx - 5, headY - 8],
        [bx - 2, headY - 11],
        [bx, headY - 13],
        [bx + 2, headY - 11],
        [bx + 5, headY - 8],
      ],
      '#ffe678',
      true,
    );
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx, headY - 10, 1.8, 1.8, '#75ffeb', true);
    p.px(bx, headY - 11, '#ffffff', true);
    p.setPart(SPRITE_PART.HEADWEAR);
    p.rect(bx - 11, headY + 6, 2, 3, '#ffe066');
    p.rect(bx + 9, headY + 6, 2, 3, '#ffe066');

    // [8] 右前臂青玉广袖 + 2px 软萌小臂优雅端持「六环鎏金大锡杖」！
    p.setPart(SPRITE_PART.FRONT_ARM);
    const handX = isAtk && (f === 1 || f === 2) ? bx + 15 : isAtk && f === 0 ? bx + 12 : bx + 13;
    const handY = isAtk && f === 0 ? 31 + by : isAtk && (f === 1 || f === 2) ? 35 + by : 39 + by - Math.round(pose.armAction * 2);
    p.poly(
      [
        [bx + 5, 33 + by],
        [handX, handY - 2],
        [handX - 1, handY + 6],
        [bx + 7, handY + 7],
        [bx + 5, 40 + by],
      ],
      '#2ab0a0',
    );
    p.line(bx + 7, handY + 6, handX - 1, handY + 6, '#ffe478', 1);
    drawSoftChibiArm64(p, bx + 7, 36 + by, handX, handY);

    // 六环鎏金大锡杖（修长金柄 + 顶部镂空莲环 + 六枚晃动小金环 + 发光净灵翠玉核！）
    p.setPart(SPRITE_PART.WEAPON);
    const staffTopX = Math.min(54, handX + (isAtk && (f === 1 || f === 2) ? 6 : 2));
    const staffTopY = Math.max(10, handY - (isAtk && f === 0 ? 19 : 21));
    const staffBotX = handX - (isAtk && (f === 1 || f === 2) ? 4 : 1);
    const staffBotY = Math.min(64, handY + 23);
    p.line(staffBotX, staffBotY, staffTopX, staffTopY + 5, '#996719', 3);
    p.line(staffBotX + 1, staffBotY - 1, staffTopX, staffTopY + 5, '#ffe478', 1);
    // 锡杖顶真·镂空大金环（内部完全透明！绝无不透明黑圆贴片！）+ 顶部金莲尖
    drawHollowGoldRing64(p, staffTopX, staffTopY, 6.2, 6.8, 0.64, '#b87d1a', '#ffe478', '#fffad1', true);
    p.poly([[staffTopX - 2, staffTopY - 6], [staffTopX, staffTopY - 10], [staffTopX + 2, staffTopY - 6]], '#ffe885', true);
    // 两侧叮当作响的 6 枚小金环（左右各 3 环）
    const jingle = Math.round(Math.sin(phase * 2) * 1);
    for (const dy of [-2, 1, 4]) {
      p.ellipse(staffTopX - 5, staffTopY + dy + jingle, 1.5, 1.5, '#fff0a6', true);
      p.ellipse(staffTopX + 5, staffTopY + dy - jingle, 1.5, 1.5, '#fff0a6', true);
    }
    // 锡杖中央悬浮璀璨净灵翠玉核心
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(staffTopX, staffTopY, 2.2, 2.2, '#59ffea', true);
    p.px(staffTopX, staffTopY - 1, '#ffffff', true);

    drawWrappedHand(p, handX, handY);

    if (isAtk && (f === 1 || f === 2)) {
      // 施法净化爆发青金圣环与光波（严格收于画布上沿 y>=3 内零裁边！）
      p.setPart(SPRITE_PART.GLOW_FX);
      drawSlashArc64(p, staffTopX - 2, staffTopY + 5, 13, 14, -1.1, 1.1, '#24d9be', '#ffe885', '#ffffff');
    }
  },
};

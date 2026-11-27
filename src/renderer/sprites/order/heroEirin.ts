/**
 * 秩序阵营英雄：八意永琳（hero_eirin）HD 像素绘谱。
 */

import {
  drawCleanAnimeHair64,
  drawCuteRibbonBow64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawWrappedHand, HD_BASE } from './helpers';

/**
 * 1. 八意永琳（秩序系英雄 · 1×1 远程）：
 *    彻底大改还原东方原设神韵 —— 优雅深海蓝药师礼帽（宽柔折檐 + 亮红帽带 + 正中璀璨红金星辰药师徽章，告别红蓝小丑瓜皮帽！）+
 *    无缝 3D 垂褶左蓝右红星象波浪大洋裙 + 背后垂腰粗珍珠银麻花长辫与绯红大结 + 温婉深绯红大眼 + 舒展反曲天弓「天文密葬」！
 */
export const heroEirinRigSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0b1230',
  backdropBottom: '#211c45',
  backdropGlow: '#82beff',
  avatarCrop: { x: 14, y: 4, size: 36 },
  portraitCrop: { x: 4, y: 2, w: 56, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const bx = isAtk && (f === 1 || f === 2) ? 24 : isAtk && f === 0 ? 25 : Math.round(28 + pose.leanX * 0.8);
    const by = Math.round(pose.breathY * 1.0 - pose.stepLift * 1.0);
    const sway = pose.flutter * 1.4;
    const headY = 24 + by;

    // [1] 柔顺高贵银白长发背影 + 招牌左侧背后垂腰粗实珍珠银麻花长辫（不再挡脸挡肩，仪态万方！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 9 - sway * 0.3, 41 + by],
        [bx + 5 - sway * 0.4, 48 + by],
        [bx - 9 + sway * 0.5, 48 + by],
        [bx - 11 + sway * 0.5, 39 + by],
      ],
      '#7e93bd',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 7 - sway * 0.3, 39 + by],
        [bx - 8 + sway * 0.4, 41 + by],
      ],
      '#cfdef7',
    );
    // 垂于左后侧优雅摇曳的珍珠银粗麻花辫（饱满节段光泽 + 尾端大绯红蝴蝶结！）
    const braidBaseX = bx - 12;
    for (let i = 0; i < 6; i++) {
      const segY = headY + 7 + i * 4.2;
      const segX = braidBaseX - Math.sin(i * 0.55) * 1.8 + sway * (0.22 * i) + (i % 2 === 0 ? -0.6 : 0.6);
      p.ellipse(segX, segY, 3.0, 2.5, '#869cc7');
      p.ellipse(segX - 0.4, segY - 0.5, 2.0, 1.7, '#e6f0ff');
      p.px(Math.round(segX - 1), Math.round(segY - 1), '#ffffff');
    }
    const knotX = Math.round(braidBaseX - 1 + sway * 1.1);
    const knotY = Math.round(headY + 31);
    drawCuteRibbonBow64(p, knotX, knotY, {
      leftSpan: 4.5,
      rightSpan: 3.8,
      wingHeight: 3.8,
      tailLen: 6,
      sway: sway * 0.5,
      dark: '#8f1334',
      main: '#e02850',
      light: '#ff7a98',
      part: SPRITE_PART.BACK_HAIR,
    });
    p.px(knotX, knotY, '#ffe680', true);
    p.poly([[knotX - 2, knotY + 2], [knotX + 2, knotY + 2], [knotX + Math.round(sway * 0.3), knotY + 7]], '#dce8fa');

    // [2] 3/4 端庄斜错步：纯白过膝长袜 + 优雅海蓝金扣皮鞋
    drawStaggeredLegs64(p, bx, 52, 65, pose, {
      sockShadow: '#cfd8eb',
      sockLight: '#ffffff',
      shoeDark: '#172b61',
      shoeMain: '#2b52ad',
      shoeHighlight: '#ffe485',
    });

    // [3] 像素级无缝 3D 左蓝右红「星象双色波浪大洋裙」（同一套柔和垂褶 + 雪白蓬松荷叶衬裙，彻底告别拼接贴片！）
    // 先画柔和雪白探底荷叶衬裙
    p.setPart(SPRITE_PART.PETTICOAT);
    const skirtWaistY = 40 + by;
    const skirtHemY = 54 + by;
    const waistW = 12.6;
    const hemW = 32;
    const tiltSway = sway * 0.8 + 0.8;
    const getHemYAtU = (u: number) => {
      const cu = Math.max(-1, Math.min(1, u));
      const dome = (1 - cu * cu) * 2.5;
      const slant = cu * 0.7;
      const wave = Math.sin((cu + 1) * 0.5 * 3.5 * Math.PI) * 0.85 + 0.85;
      return skirtHemY + dome + slant + wave;
    };
    const petHalfW = hemW * 0.5 - 1.2;
    const petCenter = bx + tiltSway;
    for (let x = Math.floor(petCenter - petHalfW); x <= Math.ceil(petCenter + petHalfW); x++) {
      const u = (x - petCenter) / Math.max(1, petHalfW);
      if (Math.abs(u) > 1) continue;
      const edgeSoft = Math.sqrt(Math.max(0, 1 - u * u * 0.9));
      const outerHem = getHemYAtU(u * 0.94);
      const wave = Math.abs(Math.sin((u + 1) * 0.5 * 5 * Math.PI + 0.3));
      const peek = (2.1 + wave * 1.1) * (0.4 + 0.6 * edgeSoft);
      for (let y = Math.floor(outerHem - 1); y <= Math.round(outerHem + peek); y++) {
        const col = y <= Math.floor(outerHem) || u > 0.42 ? '#d4dceb' : y === Math.round(outerHem + peek) ? '#ffffff' : '#fafcff';
        p.px(x, y, col);
      }
    }
    // 无缝红蓝星象外裙（u < 0.04 左侧深海星蓝、u >= 0.04 右侧高贵绯红，还原原设经典左蓝右红！）
    p.setPart(SPRITE_PART.SKIRT);
    const totalH = Math.max(5, skirtHemY - skirtWaistY);
    for (let y = Math.floor(skirtWaistY); y <= Math.ceil(skirtHemY + 6); y++) {
      const v = Math.max(0, Math.min(1.2, (y - skirtWaistY) / totalH));
      const flare = Math.pow(Math.min(1, v), 0.82);
      const halfW = (waistW * (1 - flare) + hemW * flare) * 0.5;
      const center = bx + tiltSway * flare;
      const xLeft = center - halfW;
      const xRight = center + halfW;
      const span = Math.max(1, xRight - xLeft);
      for (let x = Math.floor(xLeft); x <= Math.ceil(xRight); x++) {
        const u = ((x - xLeft) / span) * 2 - 1;
        if (u < -1 || u > 1) continue;
        const hemAtX = getHemYAtU(u);
        if (y > Math.round(hemAtX)) continue;
        const distFromHem = hemAtX - y;

        // 中缝精致鎏金垂带 + 底缘波浪金边
        if (Math.abs(u - 0.04) < 0.075 && v > 0.06) {
          p.px(x, y, distFromHem < 2.4 ? '#fff4b8' : '#f2c85c');
          continue;
        }
        if (distFromHem >= 1.6 && distFromHem < 3.1) {
          p.px(x, y, u > 0.38 ? '#cc9c35' : '#ffe485');
          continue;
        }

        const fold1 = Math.exp(-Math.pow((u + 0.36) / 0.14, 2)) * Math.pow(Math.min(1, v), 0.75);
        const fold2 = Math.exp(-Math.pow((u - 0.34) / 0.14, 2)) * Math.pow(Math.min(1, v), 0.75);
        let lum = 0.62 - u * 0.28 - Math.max(fold1, fold2) * 0.34 - (v < 0.14 ? 0.12 : 0);
        if (distFromHem < 1.2) lum -= 0.08;

        if (u < 0.04) {
          // 左侧：深海星蓝
          const col = lum < 0.28 ? '#112259' : lum < 0.45 ? '#1c3b8a' : lum > 0.78 ? '#78a8ff' : lum > 0.64 ? '#4274db' : '#2954b8';
          p.px(x, y, col);
        } else {
          // 右侧：蓬莱绯红
          const col = lum < 0.28 ? '#5e0e26' : lum < 0.45 ? '#91193b' : lum > 0.78 ? '#ff829c' : lum > 0.64 ? '#ed4a6d' : '#cc274a';
          p.px(x, y, col);
        }
      }
    }
    // 裙摆精致金丝十二宫十字星纹（左蓝右红对称点缀！）
    p.setPart(SPRITE_PART.APRON_WAIST);
    const drawStarCross = (cx: number, cy: number) => {
      p.px(cx, cy, '#fff6c4', true);
      p.px(cx - 1, cy, '#ffd966');
      p.px(cx + 1, cy, '#ffd966');
      p.px(cx, cy - 1, '#ffd966');
      p.px(cx, cy + 1, '#ffd966');
    };
    drawStarCross(bx - 7, 48 + by);
    drawStarCross(bx + 8, 48 + by);

    // [4] 左后臂：优雅蓝袖灯笼袖 + 拉弓玉手
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 35 + by, '#1a387d', '#3364cc', '#ffffff', 'left');
    const pullHandX = isAtk && f === 0 ? bx + 5 : isAtk && f === 1 ? bx - 9 : bx - 9;
    const pullHandY = isAtk && f === 0 ? 35 + by : isAtk && f === 1 ? 36 + by : 42 + by;
    drawSoftChibiArm64(p, bx - 6.5, 36 + by, pullHandX, pullHandY);

    // [5] 修身左蓝右红宫廷上衣 + 雪白大水手披肩领 + 璀璨金星丝绸胸结
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 6, 33 + by], [bx + 1, 33 + by], [bx + 1, 41 + by], [bx - 6, 41 + by]], '#1e4296');
    p.poly([[bx - 5, 34 + by], [bx, 34 + by], [bx, 40 + by], [bx - 5, 40 + by]], '#3568d1');
    p.poly([[bx + 1, 33 + by], [bx + 6, 33 + by], [bx + 6, 41 + by], [bx + 1, 41 + by]], '#a81f3f');
    p.poly([[bx + 1, 34 + by], [bx + 5, 34 + by], [bx + 5, 40 + by], [bx + 1, 40 + by]], '#e03b5d');
    // 宽优雅雪白圆角水手披肩领 + 红色细边 + 中央鎏金星扣
    p.poly([[bx - 7, 32 + by], [bx + 7, 32 + by], [bx + 5, 37 + by], [bx, 38 + by], [bx - 5, 37 + by]], '#edf3ff');
    p.poly([[bx - 6, 32 + by], [bx + 6, 32 + by], [bx + 4, 36 + by], [bx, 37 + by], [bx - 4, 36 + by]], '#ffffff');
    p.line(bx - 5, 36 + by, bx, 37 + by, '#d92b4e', 1);
    p.line(bx + 5, 36 + by, bx, 37 + by, '#d92b4e', 1);
    p.ellipse(bx, 36 + by, 1.8, 1.8, '#ffe680', true);
    p.hline(bx - 6, 40 + by, 12, '#f2c85c');

    // [6] 温婉睿智蓬莱药师美人颜（原设温柔深绯红大眼！）+ 轻柔亮泽月银空气刘海
    drawKawaiiHead64(p, bx, headY, pose, {
      irisDark: '#7a1234',
      irisMid: '#c72658',
      irisGlow: '#ff8fb3',
      lashColor: '#301428',
      blushColor: '#ffadbd',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#6b7fa8',
      dark: '#92a8cf',
      mid: '#cdddf7',
      light: '#eef5ff',
      spec: '#ffffff',
      leftLockLen: 12,
      rightLockLen: 11,
      fluff: 1,
      sway,
    });

    // [7] 彻底重塑！！东方永夜抄原设级高贵「八意永琳药师礼帽」（柔和微拱圆锥穹顶 + 优雅宽折绯红帽檐 + 金白红十字药师徽章 + 右侧双红丝带，彻底告别平顶大盖帽与小丑帽！）
    p.setPart(SPRITE_PART.HEADWEAR);
    const hatCx = bx - 0.5;
    const hatY = headY - 9.2;
    // 7a. 柔美微拱收尖的深海宝蓝丝绸药师帽冠（下宽贴檐、上端柔和优雅收拱成古典宫廷药师帽穹顶！）
    const cRx = 9.0;
    const cH = 9.5;
    for (let y = Math.floor(hatY - cH); y <= Math.ceil(hatY + 0.5); y++) {
      const t = Math.max(0, Math.min(1, (hatY - y) / cH)); // 0=帽带底, 1=帽顶
      // 经典柔和微尖穹顶轮廓：底部饱满圆润，上半段优雅内收形成柔美小尖拱（绝不平头方帽！）
      const rowHalfW = cRx * Math.pow(Math.max(0, 1 - Math.pow(t, 1.55)), 0.58);
      if (rowHalfW < 0.7) continue;
      // 轻微优雅向后倾（左偏 1.2px），3/4 侧颜视角高级感拉满！
      const rowCx = hatCx - t * 1.4;
      for (let x = Math.floor(rowCx - rowHalfW); x <= Math.ceil(rowCx + rowHalfW); x++) {
        const dx = (x - rowCx) / Math.max(1, rowHalfW);
        if (Math.abs(dx) > 1) continue;
        const fold = Math.max(0, Math.cos(dx * 2.4 * Math.PI)) * (1 - t * 0.65) * 0.16;
        let lum = 0.6 - dx * 0.34 + t * 0.2 - fold;
        if (y >= Math.floor(hatY - 0.8)) lum -= 0.16;
        const col =
          lum < 0.3 ? '#0f1e52' : lum < 0.48 ? '#1b3987' : lum > 0.78 ? '#78aaff' : lum > 0.64 ? '#4274db' : '#2954b8';
        p.px(x, y, col);
      }
    }
    // 7b. 宽柔优雅的绯红折边帽檐（比帽冠宽出 2.5px 形成优雅阶梯帽檐 + 上沿细金滚边 + 两侧微翘弧！）
    for (let x = Math.floor(hatCx - 11.4); x <= Math.ceil(hatCx + 11.4); x++) {
      const u = (x - hatCx) / 11.4;
      if (Math.abs(u) > 1) continue;
      const brimArc = u * u * 1.8;
      const topY = Math.round(hatY - 0.5 + brimArc);
      const botY = Math.round(hatY + 2.4 + brimArc);
      for (let y = topY; y <= botY; y++) {
        let col = '#d4244a';
        if (y === topY) col = '#ffe485';
        else if (y === botY || u > 0.42) col = '#8a112e';
        else if (u < -0.1) col = '#f55879';
        p.px(x, y, col);
      }
    }
    // 7c. 帽冠正前方高贵「蓬莱金白十字星药师徽章」+ 右侧飘扬双红绸结丝带！
    const embX = Math.round(hatCx);
    const embY = Math.round(hatY - 3.6);
    p.ellipse(embX, embY, 2.8, 2.6, '#8f1334');
    p.ellipse(embX, embY, 2.0, 1.9, '#ffe685', true);
    p.vline(embX, embY - 2, 5, '#ffffff', true);
    p.hline(embX - 2, embY, 5, '#ffffff', true);
    p.px(embX, embY, '#ff3366', true);
    // 右檐优雅垂落双红绸飘带
    p.bezierRibbon([hatCx + 8, hatY + 2], [hatCx + 11, hatY + 5], [hatCx + 12 + sway * 0.4, hatY + 9], 1.6, 0.7, '#d4244a');
    p.bezierRibbon([hatCx + 7, hatY + 2], [hatCx + 9, hatY + 6], [hatCx + 10 + sway * 0.3, hatY + 10], 1.3, 0.6, '#ff6e8c');
    p.px(Math.round(hatCx + 9), Math.round(hatY + 2), '#ffe680');

    // [8] 右前臂（绯红优雅泡泡袖）+ 宏伟舒展反曲天弓「天文密葬」与苍月星矢！
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 35 + by, '#991838', '#e03b5d', '#ffffff', 'right');
    const bowHoldX = isAtk && f === 0 ? bx + 15 : isAtk && (f === 1 || f === 2) ? bx + 17 : bx + 15;
    const bowHoldY = isAtk ? 34 + by : 37 + by;
    drawSoftChibiArm64(p, bx + 6.5, 36 + by, bowHoldX, bowHoldY);

    p.setPart(SPRITE_PART.WEAPON);
    // 优美舒展的反曲天弓双翼（月银×海蓝双层弧骨 + 鎏金反曲梢头！）
    const bowTopX = bowHoldX - 4;
    const bowTopY = bowHoldY - 19;
    const bowBotX = bowHoldX - 4;
    const bowBotY = bowHoldY + 18;
    p.bezierRibbon([bowHoldX + 1, bowHoldY], [bowHoldX + 8, bowHoldY - 11], [bowTopX, bowTopY], 3.0, 1.2, '#214ca6');
    p.bezierRibbon([bowHoldX + 1, bowHoldY], [bowHoldX + 7, bowHoldY - 11], [bowTopX + 1, bowTopY + 1], 1.5, 0.7, '#d4ecff');
    p.bezierRibbon([bowHoldX + 1, bowHoldY], [bowHoldX + 8, bowHoldY + 10], [bowBotX, bowBotY], 3.0, 1.2, '#214ca6');
    p.bezierRibbon([bowHoldX + 1, bowHoldY], [bowHoldX + 7, bowHoldY + 10], [bowBotX + 1, bowBotY - 1], 1.5, 0.7, '#d4ecff');
    // 弓梢鎏金新月饰与握把苍蓝星核
    p.ellipse(bowTopX, bowTopY, 1.8, 1.6, '#ffe478', true);
    p.ellipse(bowBotX, bowBotY, 1.8, 1.6, '#ffe478', true);
    p.ellipse(bowHoldX + 2, bowHoldY, 2.4, 3.2, '#ffe073');
    p.px(bowHoldX + 3, bowHoldY, '#7ceeff', true);
    // 晶莹紧绷星光弓弦
    const stringPullX = isAtk && f === 0 ? bowHoldX - 10 : bowHoldX - 5;
    p.line(bowTopX, bowTopY + 1, stringPullX, bowHoldY, '#a6f0ff', 1, true);
    p.line(stringPullX, bowHoldY, bowBotX, bowBotY - 1, '#a6f0ff', 1, true);
    drawWrappedHand(p, bowHoldX, bowHoldY);

    // 天文密葬苍月星矢（待机也微搭半透明星矢显现弓手气质，蓄力拉满、释放破空！）
    p.setPart(SPRITE_PART.GLOW_FX);
    if (isAtk && f === 0) {
      p.line(stringPullX, bowHoldY, bowHoldX + 10, bowHoldY, '#7ce8ff', 2, true);
      p.hline(stringPullX + 2, bowHoldY, bowHoldX + 8 - stringPullX, '#ffffff', true);
      p.poly([[bowHoldX + 8, bowHoldY - 3], [bowHoldX + 14, bowHoldY], [bowHoldX + 8, bowHoldY + 3]], '#ffe680', true);
      p.px(bowHoldX + 13, bowHoldY, '#ffffff', true);
      drawWrappedHand(p, stringPullX, bowHoldY);
    } else if (isAtk && (f === 1 || f === 2)) {
      const tipX = Math.min(60, bowHoldX + (f === 1 ? 18 : 20));
      p.line(bowHoldX + 2, bowHoldY, tipX, bowHoldY, '#4cb8ff', 3, true);
      p.hline(bowHoldX + 3, bowHoldY, Math.max(2, tipX - bowHoldX - 3), '#ffffff', true);
      p.poly([[tipX - 5, bowHoldY - 3], [tipX + 1, bowHoldY], [tipX - 5, bowHoldY + 3]], '#ffe885', true);
      p.px(bowHoldX + 8, bowHoldY - 5, '#b8f4ff', true);
      p.px(bowHoldX + 10, bowHoldY + 5, '#ffe885', true);
      p.px(bowHoldX + 5, bowHoldY - 3, '#ffffff', true);
    } else if (!isHit) {
      // 待机微搭光矢于弓心，一眼即识远程弓手大贤者！
      p.line(stringPullX + 1, bowHoldY, bowHoldX + 8, bowHoldY, '#8cf0ff', 1, true);
      p.poly([[bowHoldX + 6, bowHoldY - 2], [bowHoldX + 10, bowHoldY], [bowHoldX + 6, bowHoldY + 2]], '#ffe885', true);
      p.px(bowTopX, bowTopY, '#ffffff', true);
    }
  },
};

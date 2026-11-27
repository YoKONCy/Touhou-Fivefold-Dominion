/**
 * 7. 红祭司（武艺旧都 T3-B · 1×2 · 肉盾战巫 + 鬼神狂战 / 瞬闪先手 / 命符「战争血祭」）
 * v5 彻底推倒重铸：对标「幻月妖 × 祈愿神使」的东方尊贵高阶「曜黑长发 × 纯白千早大振袖 × 深绯层叠神官长袴」大祭司！
 * 彻底消除红黄杂乱噪点与僵硬纸片感：
 * 1. 绝美深曜黑×暗紫罗兰长直姬发 + 绯红宝石凤眸，强反衬纯白宽大金边振袖与优雅弯角；
 * 2. 极致清雅头饰：一对修长象牙描金弯鬼角 + 额心单枚血玉金纹额饰（留足清爽负空间！）；
 * 3. 轻盈环绕肩后的「绯金流光巫女天衣仙带」+ 立体层次绯红神官长裙与雪白描金中垂绶带；
 * 4. 左手白振袖前轻聚三枚浮游赤玉血魂珠，右手白广袖优雅执握「镂空鎏金新月血晶大锡杖」！
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
import {
  drawHollowRing64,
  drawOniHorn64,
  drawSparkStar64,
  drawWrappedHand64,
  HD_MIGHT_BASE,
} from './helpers';

export const redPriestSpec: SpriteRigSpec = {
  ...HD_MIGHT_BASE,
  backdropTop: '#160712',
  backdropBottom: '#3b0e20',
  backdropGlow: '#ff4769',
  avatarCrop: { x: 13, y: 4, size: 37 },
  portraitCrop: { x: 2, y: 2, w: 60, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx =
      isAtk && (f === 1 || f === 2)
        ? 26
        : isAtk && f === 0
          ? 27
          : isHit
            ? 27
            : Math.round(28 + pose.leanX * 0.8);
    const by = Math.max(-1, Math.round(pose.breathY * 1.0 - pose.stepLift * 0.5));
    const sway = Math.sin(phase) * 1.4 + pose.flutter * 1.4 + (isMove ? -1.8 : 0);
    const headY = 23 + by;

    // [1] 后景：轻盈清逸的「绯红鎏金飞天巫女天衣仙带」（大幅外展留足空气负空间，与白广袖清爽分离！）
    p.setPart(SPRITE_PART.BACK_ACC);
    // 左肩后外展柔美 S 弯赤金仙带
    p.bezierRibbon(
      [bx - 10, 30 + by],
      [Math.max(3, bx - 25 + sway * 0.6), 34 + by],
      [Math.max(4, bx - 21 + sway), 55 + by],
      2.8,
      0.9,
      '#9e142e',
    );
    p.bezierRibbon(
      [bx - 10, 30 + by],
      [Math.max(4, bx - 23 + sway * 0.6), 34 + by],
      [Math.max(5, bx - 20 + sway), 54 + by],
      1.2,
      0.5,
      '#ff788c',
      true,
    );
    p.px(Math.max(4, bx - 21 + Math.round(sway)), 55 + by, '#ffe878', true);
    // 右肩后微扬仙带尾纱
    p.bezierRibbon(
      [bx + 10, 32 + by],
      [bx + 19 - sway * 0.4, 41 + by],
      [bx + 15 - sway * 0.6, 56 + by],
      2.4,
      0.9,
      '#8c1129',
    );
    p.bezierRibbon(
      [bx + 10, 32 + by],
      [bx + 18 - sway * 0.4, 41 + by],
      [bx + 15 - sway * 0.6, 55 + by],
      1.0,
      0.4,
      '#ffe078',
      true,
    );

    // [2] 如瀑垂落的绝美「深曜黑×暗紫罗兰长直姬发背影」（强对比衬托纯白振袖与红金法衣！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 11 - sway * 0.3, 45 + by],
        [bx + 8 - sway * 0.4, 54 + by],
        [bx - 9 + sway * 0.5, 55 + by],
        [bx - 12 + sway * 0.5, 44 + by],
      ],
      '#130d24',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 9 - sway * 0.3, 43 + by],
        [bx - 10 + sway * 0.4, 47 + by],
      ],
      '#2c204d',
    );
    // 发梢一抹若隐若现的绯红挑染光泽（旧都血祭神官点睛之笔！）
    p.bezierRibbon([bx - 9, 44 + by], [bx - 10 + sway * 0.4, 50 + by], [bx - 9 + sway * 0.5, 54 + by], 2.0, 0.8, '#c92240');
    p.bezierRibbon([bx + 8, 44 + by], [bx + 9 - sway * 0.3, 49 + by], [bx + 8 - sway * 0.4, 53 + by], 1.8, 0.7, '#c92240');

    // [3] 端庄秀气的白足袋 + 朱漆金带巫女高屐
    drawStaggeredLegs64(p, bx, 55, 67, pose, {
      sockShadow: '#d4dce8',
      sockLight: '#ffffff',
      shoeDark: '#470a14',
      shoeMain: '#b81c34',
      shoeHighlight: '#ffe078',
    });

    // [4] 立体柔美「深绯红大蓬巫女长袴裙 + 雪白层叠下衬 + 纯白描金神官前垂绶带」（告别僵硬红黑扑克牌！）
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 40 + by,
      waistW: 11.4,
      hemY: 59 + by,
      hemW: 32,
      tiltRight: 0.9,
      archDepth: 2.8,
      waveLobes: 4,
      waveAmp: 1.9,
      swayX: -pose.leanX * 0.4 + sway * 0.75,
      colors: {
        deep: '#3b0714',
        shadow: '#730f24',
        main: '#c41e38',
        light: '#f03e56',
        highlight: '#ff8596',
      },
      trimBand: {
        offsetFromHem: 2.2,
        thickness: 1.4,
        color: '#ffe078',
        shadowColor: '#ad7a1f',
      },
      petticoat: {
        peekDepth: 2.2,
        shade: '#d2dceb',
        main: '#ffffff',
        highlight: '#ffffff',
      },
    });
    // 正中纤雅垂落的「纯白描金绣纹神官绶带 + 精致小血玉结」（明快通透提亮全身！）
    p.setPart(SPRITE_PART.APRON_WAIST);
    const sashSway = Math.round(sway * 0.35);
    p.poly(
      [
        [bx - 3, 40 + by],
        [bx + 4, 40 + by],
        [bx + 5 + sashSway, 59 + by],
        [bx + 1 + sashSway, 62 + by],
        [bx - 4 + sashSway, 59 + by],
      ],
      '#dce4f2',
    );
    p.poly(
      [
        [bx - 2, 41 + by],
        [bx + 3, 41 + by],
        [bx + 4 + sashSway, 58 + by],
        [bx + 1 + sashSway, 60 + by],
        [bx - 3 + sashSway, 58 + by],
      ],
      '#ffffff',
    );
    p.vline(bx + 1 + Math.round(sashSway * 0.4), 42 + by, 15, '#e62e47');
    p.line(bx - 3, 41 + by, bx - 4 + sashSway, 59 + by, '#f0be4d', 1);
    p.line(bx + 4, 41 + by, bx + 5 + sashSway, 59 + by, '#ffe478', 1);
    p.px(bx + 1 + Math.round(sashSway * 0.4), 48 + by, '#ffe878', true);

    // [5] 纯净雪白金边「神官千早大振袖上衣」+ 绯红收腰金织帯 + 颈间雅致血玉勾玉！
    // 左侧宽大优雅雪白大振袖（垂褶立体、绯红金边袖口！）
    p.setPart(SPRITE_PART.BACK_ARM);
    p.poly(
      [
        [bx - 5, 33 + by],
        [bx - 15, 36 + by],
        [bx - 17 + Math.round(sway * 0.4), 47 + by],
        [bx - 7, 45 + by],
      ],
      '#cfd8eb',
    );
    p.poly(
      [
        [bx - 5, 34 + by],
        [bx - 14, 36 + by],
        [bx - 15 + Math.round(sway * 0.4), 45 + by],
        [bx - 7, 44 + by],
      ],
      '#ffffff',
    );
    p.line(bx - 15, 36 + by, bx - 17 + Math.round(sway * 0.4), 47 + by, '#e62e47', 1);
    p.line(bx - 16 + Math.round(sway * 0.4), 46 + by, bx - 8, 45 + by, '#ffe078', 1);
    // 左手轻舒振袖前，三枚灵动悬浮微光「血祭赤玉魂珠」（告别棒棒糖圆饼！）
    const lHandX = Math.max(9, bx - 14);
    const lHandY = isAtk ? 34 + by : 37 + by;
    drawSoftChibiArm64(p, bx - 7, 35 + by, lHandX + 1, lHandY, '#fff2eb', '#e0b3a4');
    p.setPart(SPRITE_PART.GLOW_FX);
    for (let i = 0; i < 3; i++) {
      const a = phase + (i * Math.PI * 2) / 3;
      const ox = Math.max(4, Math.round(lHandX - 1 + Math.cos(a) * 3.8));
      const oy = Math.round(lHandY - 4 + Math.sin(a) * 3.2);
      p.ellipse(ox, oy, 1.5, 1.5, i === 0 ? '#ff3352' : '#ffe066', true);
      p.px(ox, oy, '#ffffff', true);
    }

    // 纯白精致巫女交领千早短衣 + 绯红交领滚边 + 鎏金束腰织带
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5.5, 33 + by], [bx + 5.5, 33 + by], [bx + 5.5, 41 + by], [bx - 5.5, 41 + by]], '#d2dceb');
    p.poly([[bx - 4.5, 34 + by], [bx + 4.5, 34 + by], [bx + 4.5, 40 + by], [bx - 4.5, 40 + by]], '#ffffff');
    p.line(bx - 4, 34 + by, bx, 38 + by, '#d9223a', 1);
    p.line(bx + 4, 34 + by, bx, 38 + by, '#ff4d63', 1);
    // 颈心单枚璀璨血玉勾玉饰
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx, 37 + by, 1.6, 1.6, '#ff2647', true);
    p.px(bx, 37 + by, '#ffe885', true);
    // 猩红金织宽腰带
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.rect(bx - 6, 39 + by, 12, 3, '#8c1224');
    p.hline(bx - 6, 39 + by, 12, '#ffe078');
    p.rect(bx - 2, 39 + by, 5, 3, '#ffe885');
    p.px(bx, 40 + by, '#ff2647', true);

    // [6] 清冷绝美黑长直巫女颜 + 璀璨绯红宝石大眼 + 精致象牙描金弯双角 + 单枚血玉额饰（零杂乱噪点！）
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff8f5',
      skinMain: '#ffe6de',
      skinShade: '#deb3a6',
      lashColor: '#1f0d24',
      irisDark: '#7a0a20',
      irisMid: '#f2294e',
      irisGlow: '#ffa6b8',
      blushColor: '#ff96ad',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#120c21',
      dark: '#251a42',
      mid: '#423270',
      light: '#7460b0',
      spec: '#d4ccff',
      leftLockLen: 12,
      rightLockLen: 11,
      fluff: 1,
      bobFlare: true,
      sway,
    });
    // 清雅精致「纤细鎏金额饰 + 中央菱形血玉」（彻底告别大块土金厚冠！）
    p.setPart(SPRITE_PART.HEADWEAR);
    p.hline(bx - 6, headY - 8, 12, '#e6b23c');
    p.hline(bx - 4, headY - 9, 8, '#fff299');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.poly([[bx, headY - 11], [bx + 2, headY - 9], [bx, headY - 7], [bx - 2, headY - 9]], '#ff2647', true);
    p.px(bx, headY - 9, '#ffffff', true);
    // 典雅修长「象牙白×鎏金根环双弯鬼角」（清秀高贵、轮廓极度干净！）
    drawOniHorn64(p, bx - 6, headY - 8, bx - 10, headY - 12, bx - 10, Math.max(4, headY - 17), {
      baseWidth: 2.8,
      shadowColor: '#8c6d59',
      mainColor: '#f5ead6',
      hiColor: '#ffffff',
      ringColor: '#e62e47',
    });
    drawOniHorn64(p, bx + 6, headY - 8, bx + 10, headY - 12, bx + 10, Math.max(4, headY - 17), {
      baseWidth: 2.8,
      shadowColor: '#8c6d59',
      mainColor: '#f5ead6',
      hiColor: '#ffffff',
      ringColor: '#e62e47',
    });

    // [7] 右侧纯净雪白大广袖自然包覆右臂 + 优雅执握「镂空鎏金新月血晶大锡杖」（告别僵直肉棍！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    const staffX = isAtk && (f === 1 || f === 2) ? bx + 18 : isAtk && f === 0 ? bx + 16 : bx + 15;
    const staffHandY = isAtk && f === 0 ? 35 + by : 39 + by;
    // 自然优美垂落的纯白广袖（完整优雅包裹臂膀直至手腕！）
    p.poly(
      [
        [bx + 5, 33 + by],
        [staffX - 1, staffHandY - 1],
        [staffX - 2, staffHandY + 7],
        [bx + 8, 46 + by],
        [bx + 5, 42 + by],
      ],
      '#cfd8eb',
    );
    p.poly(
      [
        [bx + 5, 34 + by],
        [staffX - 2, staffHandY],
        [staffX - 3, staffHandY + 5],
        [bx + 8, 44 + by],
      ],
      '#ffffff',
    );
    p.line(staffX - 1, staffHandY - 1, staffX - 2, staffHandY + 7, '#e62e47', 1);
    p.line(staffX - 2, staffHandY + 6, bx + 8, 45 + by, '#ffe078', 1);

    // 纤雅尊贵的「朱漆盘金大锡杖 + 镂空鎏金新月血晶杖首」（对标幻月妖星轮杖的清透神圣美感！）
    p.setPart(SPRITE_PART.WEAPON);
    const ringCY = isAtk ? 17 + by : 20 + by;
    p.line(staffX, 65, staffX, ringCY + 6, '#59141e', 3);
    p.line(staffX, 64, staffX, ringCY + 6, '#ffe078', 1);
    p.px(staffX, 65, '#ffe885');
    // 杖颈飘逸绯白纸垂丝带结
    p.bezierRibbon([staffX, ringCY + 8], [staffX - 3, ringCY + 13], [staffX - 5 + sway * 0.4, ringCY + 17], 2.0, 0.7, '#e62e47');
    p.bezierRibbon([staffX, ringCY + 8], [staffX - 2, ringCY + 12], [staffX - 4 + sway * 0.3, ringCY + 16], 0.9, 0.5, '#ffffff');
    // 真·镂空鎏金锡杖金环 + 顶峰金芒 + 中心悬浮璀璨红宝石血魂核！
    drawHollowRing64(p, staffX, ringCY, 6.2, 6.2, 0.72, '#b87618', '#ffe066', '#ffffff', SPRITE_PART.WEAPON, true);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(staffX, ringCY - 7, '#ffffff', true);
    p.px(staffX - 7, ringCY, '#ffe885', true);
    p.px(staffX + 7, ringCY, '#ffe885', true);
    p.ellipse(staffX, ringCY, isAtk ? 3.0 : 2.3, isAtk ? 3.0 : 2.3, '#ff2647', true);
    p.ellipse(staffX, ringCY - 0.5, 1.3, 1.3, '#fff8bd', true);
    drawWrappedHand64(p, staffX, staffHandY, '#deb3a6', '#ffe6de', '#ffffff');

    // [8] 施法演出：杖首绽放清澈璀璨「命符·战争血祭」双层赤金镂空法环与血辉光束（零裁切！）
    if (isAtk && f === 0) {
      drawHollowRing64(p, staffX, ringCY, 9.5, 9.5, 0.84, '#d91636', '#ff8047', '#fff8bd');
      drawSparkStar64(p, Math.min(59, staffX + 7), Math.max(4, ringCY - 7), 2, '#ffe878');
    } else if (isAtk && (f === 1 || f === 2)) {
      drawHollowRing64(p, staffX, ringCY, 10.2, 10.2, 0.85, '#ff2647', '#ffe066', '#ffffff');
      p.setPart(SPRITE_PART.GLOW_FX);
      const beamEnd = Math.min(60, staffX + 16);
      p.line(staffX + 4, ringCY, beamEnd, ringCY + 3, '#ff3352', 3, true);
      p.line(staffX + 5, ringCY, beamEnd, ringCY + 3, '#fff8bd', 1, true);
      drawSparkStar64(p, Math.min(59, beamEnd - 1), ringCY + 3, 2, '#ffffff');
      drawSparkStar64(p, Math.min(59, staffX + 8), Math.max(4, ringCY - 8), 2, '#ffe878');
    }
  },
};

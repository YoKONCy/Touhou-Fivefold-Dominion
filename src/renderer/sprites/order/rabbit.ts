/**
 * 秩序阵营 T1-A 兵种：竹林妖怪兔（creature_rabbit）与兔化真身（creature_rabbit_transformed）HD 像素绘谱。
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawCuteRibbonBow64,
  drawKawaiiHead64,
  drawSlashArc64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawFluffyBunnyEars64, drawWrappedHand, HD_BASE } from './helpers';

/**
 * 2. 竹林妖怪兔（秩序 T1-A · 1×1 抗魔施法）：
 *    一立一微折粉白毛茸茸长兔耳 + 樱红金铃蝴蝶结 + 淡紫月银萌波波头 + 蓬松小白绒尾 + 和风蓝白蕾丝短裙 + 月纹捣药杵！
 */
export const rabbitRigSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0d1530',
  backdropBottom: '#1d2e57',
  backdropGlow: '#ff96c2',
  avatarCrop: { x: 14, y: 4, size: 36 },
  portraitCrop: { x: 4, y: 2, w: 56, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const bx = isAtk && (f === 1 || f === 2) ? 25 : isAtk && f === 0 ? 29 : Math.round(31 + pose.leanX * 1.0);
    const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.3);
    const sway = pose.flutter * 1.5;
    const earTilt = Math.round(-pose.leanX * 0.6 + pose.flutter * 1.3);
    const headY = 26 + by;

    // [1] 背后超蓬松雪白绒球兔尾 + 樱粉蝴蝶结腰飘带
    p.setPart(SPRITE_PART.BACK_ACC);
    const tailY = 48 + by + Math.round(pose.flutter);
    p.ellipse(bx - 12, tailY, 5.2, 4.8, '#d4dff5');
    p.ellipse(bx - 12, tailY - 1, 3.8, 3.5, '#ffffff');
    p.px(bx - 13, tailY - 3, '#ffffff');
    p.bezierRibbon([bx - 7, 43 + by], [bx - 14 + sway * 0.5, 46 + by], [bx - 17 + sway, 52 + by], 3.2, 1.2, '#e84d7e');
    p.bezierRibbon([bx - 7, 43 + by], [bx - 13 + sway * 0.4, 45 + by], [bx - 15 + sway * 0.8, 50 + by], 1.5, 0.6, '#ff9ec0');

    // [2] 淡紫月银蓬松波波后发
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.ellipse(bx - 1, headY + 2, 11.4, 9.6, '#7f93c4');
    p.ellipse(bx - 1, headY + 1, 9.8, 8.2, '#b9c8eb');

    // [3] 3/4 欢快碎步双腿：白及膝袜 + 靛蓝樱粉绑带可爱小短靴
    drawStaggeredLegs64(p, bx, 52, 65, pose, {
      sockShadow: '#d4ddf0',
      sockLight: '#ffffff',
      shoeDark: '#233c7a',
      shoeMain: '#3e69cc',
      shoeHighlight: '#ff9ec2',
    });

    // [4] 左后小振袖 + 娇俏小手
    p.setPart(SPRITE_PART.BACK_ARM);
    const backSwing = Math.round(-pose.stride * 2.5);
    p.poly(
      [
        [bx - 6, 37 + by],
        [bx - 13 + backSwing, 41 + by],
        [bx - 14 + backSwing, 47 + by],
        [bx - 7, 45 + by],
      ],
      '#365eb8',
    );
    p.poly(
      [
        [bx - 6, 38 + by],
        [bx - 12 + backSwing, 41 + by],
        [bx - 12 + backSwing, 45 + by],
        [bx - 7, 44 + by],
      ],
      '#6490eb',
    );
    p.line(bx - 14 + backSwing, 46 + by, bx - 8, 45 + by, '#ffffff', 2);
    p.ellipse(bx - 13 + backSwing, 48 + by, 1.8, 1.6, '#ffe6dc');

    // [5] 甜美和风兔娘蓬蓬靛蓝短裙 + 雪白波浪蕾丝边 + 樱粉宽腰封金铃
    drawCleanAnimeSkirt64(p, {
      waistX: bx,
      waistY: 42 + by,
      waistW: 13,
      hemY: 53 + by,
      hemW: 29,
      swayX: sway,
      colors: {
        deep: '#192d66',
        shadow: '#274694',
        main: '#4d7ce0',
        light: '#80adff',
        highlight: '#bfd8ff',
      },
      trimBand: {
        offsetFromHem: 1.5,
        thickness: 1.6,
        color: '#ffffff',
        shadowColor: '#d4ddf0',
      },
      petticoat: {
        peekDepth: 2.0,
        shade: '#e6d5e0',
        main: '#fff7fb',
        highlight: '#ffffff',
      },
    });
    // 洁白和风上衣 + 樱粉蝴蝶结腰封
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 6, 36 + by], [bx + 6, 36 + by], [bx + 7, 43 + by], [bx - 7, 43 + by]], '#eaf1ff');
    p.poly([[bx - 5, 36 + by], [bx + 5, 36 + by], [bx + 5, 42 + by], [bx - 5, 42 + by]], '#ffffff');
    p.line(bx - 3, 36 + by, bx + 2, 41 + by, '#ff8cb5', 1);
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.rect(bx - 7, 41 + by, 14, 3, '#f05485');
    p.hline(bx - 6, 41 + by, 12, '#ff94b8');
    p.rect(bx - 2, 41 + by, 5, 3, '#ff78a5');
    p.ellipse(bx, 43 + by, 1.6, 1.6, '#ffe478', true);

    // [6] 软萌草莓红大眼圆脸 + 淡紫月银蓬松空气刘海
    drawKawaiiHead64(p, bx, headY, pose, {
      irisDark: '#a8143c',
      irisMid: '#e83868',
      irisGlow: '#ffa6c4',
      lashColor: '#451a33',
      blushColor: '#ff99b8',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#6678ad',
      dark: '#889cd1',
      mid: '#c4d3f5',
      light: '#e8f0ff',
      spec: '#ffffff',
      leftLockLen: 9,
      rightLockLen: 8,
      bobFlare: true,
      sway,
    });

    // [7] 标志性一立一俏皮微折长兔耳 + 右耳根樱红金铃蝴蝶结！
    drawFluffyBunnyEars64(p, bx, headY - 9, {
      earTilt,
      leftFolded: true,
      earLen: 14,
    });
    drawCuteRibbonBow64(p, bx + 5, headY - 10, {
      leftSpan: 4.5,
      rightSpan: 4.5,
      wingHeight: 4.2,
      tailLen: 4,
      sway: sway * 0.4,
      dark: '#b81d49',
      main: '#ff4778',
      light: '#ff96b5',
      part: SPRITE_PART.HEADWEAR,
    });
    p.px(bx + 5, headY - 10, '#ffe885', true);

    // [8] 前振袖 + 温润葫芦腰形「月纹玉兔捣药杵」（蓄力高举 → 完整零裁切月华星屑弧光！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    let handX = bx + 10 + Math.round(pose.stride * 1.8);
    let handY = 42 + by;
    let p0x = bx + 6;
    let p0y = 50 + by;
    let p1x = bx + 18;
    let p1y = 28 + by;
    if (isAtk && f === 0) {
      handX = bx + 5;
      handY = 34 + by;
      p0x = bx - 4;
      p0y = 40 + by;
      p1x = bx + 12;
      p1y = 21 + by;
    } else if (isAtk && (f === 1 || f === 2)) {
      handX = bx + 13;
      handY = 39 + by;
      p0x = bx + 3;
      p0y = 41 + by;
      p1x = bx + 24;
      p1y = 37 + by;
    }
    p.poly([[bx + 5, 37 + by], [handX, handY - 2], [handX - 2, handY + 4], [bx + 5, 43 + by]], '#4d7ce0');
    p.line(handX, handY - 2, handX - 2, handY + 4, '#ffffff', 2);

    // 捣药杵（暖米木/月玉双头微膨葫芦腰造型 + 中腰樱红缠绳 + 发光鎏金月纹！）
    p.setPart(SPRITE_PART.WEAPON);
    const mx = Math.round((p0x + p1x) * 0.5);
    const my = Math.round((p0y + p1y) * 0.5);
    p.line(p0x, p0y, p1x, p1y, '#c9ab88', 3);
    p.line(p0x, p0y - 1, p1x, p1y - 1, '#fff3db', 1);
    // 杵尾与杵头饱满圆膨造型（典型日式木玉捣药杵！）
    p.ellipse(p0x, p0y, 3.2, 3.0, '#d9bc98');
    p.ellipse(p0x - 0.5, p0y - 0.5, 2.0, 1.8, '#fff7e8');
    p.ellipse(p1x, p1y, 4.0, 3.8, '#e3c7a3');
    p.ellipse(p1x - 1, p1y - 1, 2.6, 2.4, '#fffaf0');
    // 杵中樱红缠绳结 + 杵头发光金月印
    p.ellipse(mx, my, 2.0, 2.0, '#eb3b6a');
    p.line(p1x - 2, p1y + 1, p1x + 1, p1y - 2, '#ffd966', 2, true);
    p.px(p1x, p1y, '#99e6ff', true);
    // 杵尾樱红流苏挂穗
    p.line(p0x, p0y + 2, p0x - 2 + Math.round(sway * 0.5), p0y + 6, '#ff4d7e', 2);
    drawWrappedHand(p, handX, handY);

    if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, bx + 17, 37 + by, 12, 12, -1.15, 0.95, '#ff6ba0', '#9ee6ff', '#ffffff');
    }
  },
};

/**
 * 3. 兔化真身（T1-A「兔化」变身专属形态 · 四足飞跃月影灵兔！）：
 *    极速扑跃的雪白流线妖兔 + 迎风后掠超长粉白双耳 + 招牌樱红金铃蝴蝶结 + 绯红月瞳 + 蓬松大雪球尾 + 流动月华疾影光带！
 */
export const rabbitTransformedRigSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0b1433',
  backdropBottom: '#231b4d',
  backdropGlow: '#99e6ff',
  avatarCrop: { x: 16, y: 12, size: 36 },
  portraitCrop: { x: 4, y: 8, w: 56, h: 56 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const hop = isAtk && (f === 1 || f === 2)
      ? -6
      : isMove
        ? Math.round(-Math.abs(Math.sin(phase)) * 6 - 1)
        : Math.round(Math.sin(phase) * 2.2 - 1);
    // 攻击时机身居中微偏左，后脚与前爪双层月影爪斩 100% 留白零裁切！
    const bx = isAtk && (f === 1 || f === 2) ? 28 : isAtk && f === 0 ? 27 : 30;
    const by = 43 + hop;
    const stretch = isAtk && (f === 1 || f === 2) ? 3 : isMove ? Math.round(Math.sin(phase) * 3.5) : 0;

    // [1] 背后灵动飘逸的「月青星华疾风气流」与星屑残影（彻底告别脚底滑板线！）
    p.setPart(SPRITE_PART.GLOW_FX);
    p.bezierRibbon([bx - 21, by - 4], [bx - 12, by - 12], [bx + 3, by - 11], 2.0, 0.6, '#54b8ff', true);
    p.bezierRibbon([bx - 20, by + 4], [bx - 14, by + 1], [bx - 5, by - 3], 2.4, 0.7, '#9ef2ff', true);
    p.px(bx - 22, by - 7, '#ffe899', true);
    p.px(bx - 17, by + 10, '#ff8cb8', true);
    p.px(bx + 15, by - 16, '#b8f4ff', true);

    // [2] 远侧后腿与前爪（阴影区分前后肢深度！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const hindExt = isAtk && f === 1 ? -4 : -stretch;
    const foreExt = isAtk && f === 1 ? 5 : stretch;
    // 远侧后腿
    p.bezierRibbon([bx - 8, by + 2], [bx - 14 + hindExt, by + 9], [bx - 18 + hindExt, by + 14], 4.6, 2.3, '#b8c8e6');
    // 远侧前爪
    p.bezierRibbon([bx + 8, by + 2], [bx + 14 + foreExt, by + 6], [bx + 19 + foreExt, by + 8], 3.8, 1.9, '#c4d2ed');

    // [3] 超级蓬松圆滚滚大雪球兔尾
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.ellipse(bx - 14, by - 2, 6.0, 5.6, '#c7d5f0');
    p.ellipse(bx - 14, by - 3, 4.6, 4.4, '#eef5ff');
    p.ellipse(bx - 15, by - 4, 2.5, 2.3, '#ffffff');

    // [4] 健美流线飞跃雪白灵兔身躯（弓背跃动感 + 左上月光高光 + 腹部柔影）
    p.setPart(SPRITE_PART.TORSO);
    p.ellipse(bx - 1, by + 1, 13.8 + Math.max(0, stretch * 0.4), 8.0, '#ccd8f0');
    p.ellipse(bx, by - 1, 12.4 + Math.max(0, stretch * 0.4), 6.6, '#f0f6ff');
    p.ellipse(bx + 1, by - 3, 9.6, 4.0, '#ffffff');
    // 蓬松雪白胸毛团
    p.ellipse(bx + 9, by + 1, 5.5, 5.0, '#e6efff');
    p.ellipse(bx + 10, by, 4.0, 3.6, '#ffffff');

    // [5] 近侧强健后蹬大长腿 + 前伸凌空扑击前爪（配粉嫩小肉垫！）
    p.setPart(SPRITE_PART.LEGS);
    p.ellipse(bx - 8, by + 3, 6.2, 5.4, '#d8e3f7');
    p.ellipse(bx - 7, by + 2, 4.6, 4.0, '#ffffff');
    p.bezierRibbon([bx - 10, by + 6], [bx - 13 + hindExt, by + 12], [bx - 19 + hindExt, by + 16], 4.6, 2.5, '#eef5ff');
    p.ellipse(bx - 19 + hindExt, by + 16, 2.9, 1.9, '#ffffff');
    p.px(bx - 20 + hindExt, by + 17, '#ff9ec2');
    // 矫健近侧前腿与扑击前爪
    p.bezierRibbon([bx + 8, by + 2], [bx + 14 + foreExt, by + 8], [bx + 20 + foreExt, by + 10], 4.4, 2.2, '#f2f7ff');
    p.ellipse(bx + 20 + foreExt, by + 10, 2.7, 2.0, '#ffffff');
    p.px(bx + 21 + foreExt, by + 11, '#ff9ec2');

    // [6] 招牌颈间「樱红金铃大蝴蝶结」（与竹林妖怪兔一脉相承的萌系标志！）
    drawCuteRibbonBow64(p, bx + 10, by - 4, {
      leftSpan: 7.0,
      rightSpan: 5.2,
      wingHeight: 5.6,
      tailLen: 8,
      sway: -pose.flutter * 1.4 - (isAtk ? 3 : 0),
      dark: '#b31b46',
      main: '#ff4275',
      light: '#ff96b8',
      part: SPRITE_PART.APRON_WAIST,
    });
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx + 12, by - 2, 2.0, 2.0, '#ffe478', true);
    p.px(bx + 12, by - 3, '#ffffff', true);

    // [7] 灵动雪白妖兔头颅 + 清晰 V 字分开的迎风双长兔耳 + 闪耀绯红月瞳与俏皮三瓣嘴！
    p.setPart(SPRITE_PART.NECK_HEAD);
    const hx = bx + 13;
    const hy = by - 9;
    p.ellipse(hx, hy, 7.4, 6.4, '#d6e2f7');
    p.ellipse(hx + 0.5, hy - 0.8, 6.3, 5.4, '#ffffff');
    p.ellipse(hx + 6, hy + 1, 3.1, 2.5, '#ffffff');
    p.px(hx + 8, hy, '#ff7ba8');
    p.px(hx + 7, hy + 2, '#b86e82');

    // 清晰 V 字张开的一对后掠毛茸茸长兔耳（远耳高扬、近耳平掠，双耳分明绝不重叠！）
    p.setPart(SPRITE_PART.HEADWEAR);
    const earWave = Math.round(Math.sin(phase) * 2);
    // 远侧高扬长耳
    p.poly(
      [
        [hx - 2, hy - 5],
        [hx - 12, hy - 20 + earWave],
        [hx - 16, hy - 17 + earWave],
        [hx - 4, hy - 2],
      ],
      '#c4d4f0',
    );
    p.poly(
      [
        [hx - 3, hy - 4],
        [hx - 12, hy - 18 + earWave],
        [hx - 14, hy - 16 + earWave],
        [hx - 4, hy - 2],
      ],
      '#ff94ba',
    );
    // 近侧受光平掠雪白长耳
    p.poly(
      [
        [hx - 2, hy - 4],
        [hx - 19, hy - 12 - earWave],
        [hx - 21, hy - 8 - earWave],
        [hx - 4, hy],
      ],
      '#dde7fa',
    );
    p.poly(
      [
        [hx - 3, hy - 3],
        [hx - 18, hy - 11 - earWave],
        [hx - 19, hy - 8 - earWave],
        [hx - 4, hy - 1],
      ],
      '#ffffff',
    );
    p.line(hx - 5, hy - 3, hx - 17, hy - 9 - earWave, '#ff8cb5', 2);
    // 额心发光新月妖印
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(hx + 3, hy - 4, '#ffe680', true);
    p.px(hx + 2, hy - 3, '#ffe680', true);
    p.px(hx + 3, hy - 2, '#ffe680', true);

    // 炯炯有神的绯红宝石妖兔大眼
    p.setPart(SPRITE_PART.FACE_FEATURES);
    if (pose.blink || pose.expr === 'hurt') {
      p.hline(hx + 1, hy, 4, '#591833');
    } else {
      p.rect(hx + 1, hy - 2, 4, 4, '#9e113b');
      p.rect(hx + 2, hy - 1, 3, 3, '#ff2e63', true);
      p.px(hx + 2, hy - 1, '#ffffff', true);
      p.px(hx + 4, hy + 1, '#ff9ec2', true);
    }
    p.hline(hx + 1, hy + 3, 2, '#ffa8c4');

    // [8] 攻击爆发：先攻月影高速双爪斩弧（100% 完整在画布内绽放！）
    if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, bx + 19, by - 1, 12, 13, -1.2, 1.0, '#ff4d88', '#8cf0ff', '#ffffff');
      drawSlashArc64(p, bx + 22, by + 2, 9, 9, -0.95, 0.85, '#ffe078', '#ffffff', '#ffffff');
    }
  },
};

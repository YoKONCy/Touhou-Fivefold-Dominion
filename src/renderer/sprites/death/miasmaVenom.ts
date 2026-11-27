/**
 * 6. 毒瘴妖（T3-B · 铃兰瘴毒远程射手：梅蒂欣风金发紫帽铃兰少女 + 翠绿围裙裙 + 剧毒瘴球）
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
import { HD_BASE } from './helpers';

export const miasmaVenomSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0d1f18',
  backdropBottom: '#1c3b2c',
  backdropGlow: '#52ff7d',
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const bx = isAtk && (f === 1 || f === 2) ? 28 : Math.round(31 + pose.leanX * 0.9);
    const by = Math.round(pose.breathY * 1.2 - pose.stepLift * 1.2);
    const sway = pose.flutter * 1.6;
    const headY = 23 + by;

    // [1] 温暖蜂蜜金卷曲后发
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 10 - sway * 0.4, 41 + by],
        [bx + 6 - sway * 0.5, 45 + by],
        [bx - 8 + sway * 0.6, 46 + by],
        [bx - 12 + sway * 0.7, 40 + by],
      ],
      '#9c6b1c',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 8 - sway * 0.3, 39 + by],
        [bx - 9 + sway * 0.5, 40 + by],
      ],
      '#e3a83b',
    );

    // [2] 3/4 斜错步雪白袜 + 紫晶小皮鞋
    drawStaggeredLegs64(p, bx, 51, 65, pose, {
      sockShadow: '#d8cfe8',
      sockLight: '#ffffff',
      shoeDark: '#4a1d7a',
      shoeMain: '#843bd6',
      shoeHighlight: '#b0ff9e',
    });

    // [3] 左后臂：柔紫泡泡袖 + 2px 软萌少女小臂（挂小毒药瓶）
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 34.5 + by, '#6a38a8', '#a366eb', '#ffffff', 'left');
    drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 12, 40 + by);
    p.rect(bx - 14, 39 + by, 3, 2, '#ffe1cf');
    // 悬在左手边的精致玻璃剧毒烧瓶（木塞 + 透明玻璃轮廓 + 翠绿发光毒液 + 玻璃高光！）
    p.setPart(SPRITE_PART.WEAPON);
    p.rect(bx - 16, 40 + by, 3, 2, '#c9935b'); // 木瓶塞
    p.ellipse(bx - 15, 44 + by, 3.2, 3.4, '#bfe8d8'); // 玻璃瓶身
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx - 15, 45 + by, 2.2, 2.0, '#24d957', true); // 半满翠绿毒液
    p.px(bx - 16, 44 + by, '#b8ffcc', true);
    p.setPart(SPRITE_PART.WEAPON);
    p.px(bx - 17, 43 + by, '#ffffff'); // 玻璃壁高光

    // [4] 明艳翠绿紫边洋装蓬蓬裙 + 洁白蕾丝前围裙！
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 40 + by,
      waistW: 10,
      hemY: 51 + by,
      hemW: 29,
      tiltRight: 1.0,
      archDepth: 2.5,
      waveLobes: 3.5,
      waveAmp: 1.6,
      swayX: -pose.leanX * 0.5 + sway * 0.8,
      colors: {
        deep: '#125934',
        shadow: '#1e8a4e',
        main: '#33bd68',
        light: '#5ee68c',
        highlight: '#a6ffbe',
      },
      trimBand: {
        offsetFromHem: 2.0,
        thickness: 1.4,
        color: '#a352f2',
        shadowColor: '#6624a8',
      },
      petticoat: {
        peekDepth: 2.1,
        shade: '#d4cce6',
        main: '#f8fff9',
        highlight: '#ffffff',
      },
    });
    // 洁白圆弧小围裙（落在 APRON_WAIST 层，自然与绿裙拉出清脆层次！）
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly(
      [
        [bx - 4, 40 + by],
        [bx + 5, 40 + by],
        [bx + 7, 48 + by],
        [bx + 1, 50 + by],
        [bx - 5, 48 + by],
      ],
      '#e3dcf0',
    );
    p.poly(
      [
        [bx - 3, 40 + by],
        [bx + 4, 40 + by],
        [bx + 5, 47 + by],
        [bx + 1, 49 + by],
        [bx - 4, 47 + by],
      ],
      '#ffffff',
    );

    // [5] 紫翡小马甲 + 翠绿宝石胸扣 + 白蕾丝领
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#58288c');
    p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#8342c7');
    p.hline(bx - 4, 32 + by, 8, '#ffffff');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx + 1, 36 + by, 1.8, 1.8, '#42f26b', true);
    p.px(bx + 1, 35 + by, '#ffffff', true);

    // [6] 甜美圆脸 + 翡翠碧绿 4×4 宝石大眼 + 蜂蜜金蓬松大块萌发
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff6ee',
      skinMain: '#ffe2d1',
      skinShade: '#e8ad99',
      lashColor: '#291538',
      irisDark: '#127341',
      irisMid: '#29cc68',
      irisGlow: '#a6ff9e',
      blushColor: '#ff96b0',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#996418',
      dark: '#cc8f29',
      mid: '#f5be49',
      light: '#ffe07d',
      spec: '#fff8cc',
      leftLockLen: 12,
      rightLockLen: 10,
      fluff: 1,
      bobFlare: true,
      sway,
    });

    // [7] 蓬松歪戴四阶丝绒紫贝雷帽（放射抓褶 + 绒蒂 + 精致细翠绸带 + 垂吊铃兰双白花！）
    p.setPart(SPRITE_PART.HEADWEAR);
    const hatCx = bx - 1.0;
    const hatY = headY - 9.5;
    // 饱满蓬松帽冠（四阶细腻紫丝绒）
    p.ellipse(hatCx, hatY - 1.8, 10.6, 5.6, '#421b6e');
    p.ellipse(hatCx - 0.6, hatY - 2.6, 9.2, 4.4, '#793bc2');
    p.ellipse(hatCx - 1.8, hatY - 3.8, 6.2, 2.8, '#aa6ef2');
    p.ellipse(hatCx - 2.8, hatY - 4.7, 3.4, 1.4, '#e2c7ff');
    // 3 道放射微褶线（丝绸垂坠质感！）
    p.line(hatCx - 1, hatY - 6, hatCx - 7, hatY - 1, '#582594', 1);
    p.line(hatCx, hatY - 6, hatCx + 1, hatY - 1, '#582594', 1);
    p.line(hatCx + 1, hatY - 6, hatCx + 7, hatY - 1, '#582594', 1);
    // 帽顶俏皮紫绒小蒂
    p.rect(hatCx - 1, hatY - 8, 2, 2, '#582594');
    p.px(hatCx - 1, hatY - 8, '#d4b3ff');
    // 精致 1px 翡翠细绸帽带 + 右侧垂吊双洁白铃兰钟花与绿叶！
    p.bezierRibbon([hatCx - 9, hatY + 1.2], [hatCx, hatY + 0.2], [hatCx + 9, hatY + 1.2], 1.1, 1.1, '#26b856');
    p.line(hatCx + 5, hatY - 2, hatCx + 9, hatY + 2, '#28bd5b', 1);
    p.px(hatCx + 4, hatY - 2, '#6eff9e');
    p.ellipse(hatCx + 7, hatY - 1, 2.0, 2.0, '#ffffff');
    p.px(hatCx + 7, hatY, '#c9f5d8');
    p.ellipse(hatCx + 10, hatY + 1.5, 2.0, 2.0, '#f5fff8');
    p.px(hatCx + 10, hatY + 2, '#b8f0cb');

    // [8] 右前臂泡泡袖 + 2px 软萌小臂投射沸腾翠绿剧毒瘴弹！
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 34.5 + by, '#6a38a8', '#a366eb', '#ffffff', 'right');
    const handX = isAtk && (f === 1 || f === 2) ? bx + 15 : bx + 12;
    const handY = isAtk && f === 0 ? 30 + by : 37 + by - Math.round(pose.armAction * 2);
    drawSoftChibiArm64(p, bx + 8, 36 + by, handX, handY);
    p.rect(handX - 1, handY - 1, 3, 2, '#ffe2d1');
    // 沸腾碧绿紫环毒瘴魔球
    p.setPart(SPRITE_PART.GLOW_FX);
    const orbX = handX + 5;
    const orbY = handY - 1 + Math.round(Math.sin(phase) * 1.5);
    p.ellipse(orbX, orbY, isAtk ? 4.4 : 3.4, isAtk ? 4.4 : 3.4, '#24d957', true);
    p.ellipse(orbX, orbY - 0.5, 2.1, 2.1, '#a6ffb8', true);
    p.px(orbX - 1, orbY - 1, '#ffffff', true);
    p.px(orbX + 4, orbY - 4, '#c270ff', true);
    p.px(orbX - 2, orbY - 5, '#59ff88', true);
    if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, bx + 16, 35 + by, 17, 15, -0.95, 0.9, '#24d957', '#c270ff', '#e8ffed');
    }
  },
};

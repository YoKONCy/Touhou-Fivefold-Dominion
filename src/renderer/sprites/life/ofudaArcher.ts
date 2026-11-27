/**
 * 2. 御札弓手（T1-B · 精准射击 + 远程先攻）64×72 HD 像素精灵绘谱
 * 翠风林间灵羽弓少女 · 亚麻金柔发 + 翠羽游侠小帽 + 箭筒短斗篷 + 雕花神木大弓
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

export const creatureOfudaArcherSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0b1e24',
  backdropBottom: '#163830',
  backdropGlow: '#5ce8c4',
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const bx = isAtk && (f === 1 || f === 2) ? 25 : isAtk && f === 0 ? 24 : Math.round(28 + pose.leanX * 0.9);
    const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.2);
    const sway = pose.flutter * 1.6;
    const headY = 23 + by;

    // [1] 背后斜背皮革箭筒（插满三支翠羽金矢）+ 飘扬翠绿游侠短披风
    p.setPart(SPRITE_PART.BACK_ACC);
    p.poly(
      [
        [bx - 4, 31 + by],
        [bx - 17 + sway * 0.9, 41 + by],
        [bx - 16 + sway, 51 + by],
        [bx - 6 + sway * 0.4, 49 + by],
        [bx - 3, 40 + by],
      ],
      '#0f4d42',
    );
    p.poly(
      [
        [bx - 4, 32 + by],
        [bx - 14 + sway * 0.8, 41 + by],
        [bx - 12 + sway * 0.8, 48 + by],
        [bx - 5, 46 + by],
      ],
      '#208572',
    );
    p.bezierRibbon(
      [bx - 16 + sway, 50 + by],
      [bx - 11 + sway * 0.6, 51 + by],
      [bx - 6 + sway * 0.4, 48 + by],
      1.5,
      1.2,
      '#f2c85b',
    );
    // 皮革箭筒与三枚翠白羽箭尾
    p.line(bx - 11, 25 + by, bx - 5, 40 + by, '#5c341d', 4);
    p.line(bx - 10, 26 + by, bx - 5, 39 + by, '#9e6238', 2);
    p.hline(bx - 12, 26 + by, 4, '#f2c85b');
    p.line(bx - 11, 25 + by, bx - 15, 20 + by, '#66f5cc', 2, true);
    p.line(bx - 10, 24 + by, bx - 12, 19 + by, '#fff5c2', 1, true);
    p.line(bx - 9, 25 + by, bx - 9, 20 + by, '#4ce6b8', 1, true);

    // [2] 蓬松暖亚麻金过肩后发
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 8, headY],
        [bx + 9 - sway * 0.4, 37 + by],
        [bx + 4 - sway * 0.5, 42 + by],
        [bx - 9 + sway * 0.6, 42 + by],
        [bx - 12 + sway * 0.6, 36 + by],
      ],
      '#8c6430',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 6, headY + 1],
        [bx + 7 - sway * 0.3, 36 + by],
        [bx - 9 + sway * 0.4, 37 + by],
      ],
      '#cf9e52',
    );

    // [3] 3/4 斜错步雪白过膝袜 + 棕色皮质金扣游侠短靴
    drawStaggeredLegs64(p, bx, 51, 65, pose, {
      sockShadow: '#d4ddd8',
      sockLight: '#fffaf2',
      shoeDark: '#4f2c18',
      shoeMain: '#8f552e',
      shoeHighlight: '#ffe073',
      skinColor: '#ffe2cc',
    });

    // [4] 干净大色块 3/4 湖青翠绿波浪褶裙 + 鎏金滚边 + 象牙白衬裙
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 40 + by,
      waistW: 10,
      hemY: 51 + by,
      hemW: 28,
      tiltRight: 1.0,
      archDepth: 2.5,
      waveLobes: 3.5,
      waveAmp: 1.5,
      swayX: -pose.leanX * 0.5 + sway * 0.75,
      colors: {
        deep: '#0f473e',
        shadow: '#1a6e60',
        main: '#289c87',
        light: '#4cd1b6',
        highlight: '#8cf5df',
      },
      trimBand: {
        offsetFromHem: 2.0,
        thickness: 1.3,
        color: '#ffe073',
        shadowColor: '#b88d32',
      },
      petticoat: {
        peekDepth: 2.0,
        shade: '#d6d0c7',
        main: '#fffaf0',
        highlight: '#ffffff',
      },
    });

    // [5] 米白束身猎装 + 翠绿鎏金小披肩 + 棕色皮带与斜挎箭囊带
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#ede3d1');
    p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#fffaf0');
    // 翠绿鎏金披肩
    p.poly([[bx - 6, 31 + by], [bx + 6, 31 + by], [bx + 6, 36 + by], [bx, 37 + by], [bx - 6, 36 + by]], '#197060');
    p.poly([[bx - 5, 31 + by], [bx + 5, 31 + by], [bx + 4, 35 + by], [bx, 36 + by], [bx - 4, 35 + by]], '#2ca68f');
    p.hline(bx - 5, 36 + by, 10, '#ffe073');
    // 皮质斜挎带与金扣腰带
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.line(bx - 4, 32 + by, bx + 4, 40 + by, '#734222', 2);
    p.hline(bx - 5, 40 + by, 11, '#5e351a');
    p.rect(bx - 1, 39 + by, 3, 2, '#ffe478');

    // [6] 灵气清甜游侠少女脸 + 璀璨祖母绿 4×4 大眼 + 亚麻金萌发与精致左侧小麻花辫！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff6ed',
      skinMain: '#ffe2cc',
      skinShade: '#e6ad95',
      lashColor: '#291a14',
      irisDark: '#0f6b51',
      irisMid: '#24bd8e',
      irisGlow: '#99ffe0',
      blushColor: '#ff96ad',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#825b27',
      dark: '#b3833e',
      mid: '#deb262',
      light: '#f7d894',
      spec: '#fff7d4',
      leftLockLen: 12,
      rightLockLen: 9,
      fluff: 1,
      sway,
    });
    // 左侧垂落小麻花辫 + 翠绿小发带
    p.setPart(SPRITE_PART.FRONT_HAIR);
    const braidX = bx - 9;
    p.vline(braidX, headY + 6, 9, '#9e6f31');
    p.vline(braidX + 1, headY + 6, 9, '#f2cc79');
    p.px(braidX, headY + 8, '#fff2b8');
    p.px(braidX + 1, headY + 11, '#fff2b8');
    p.rect(braidX - 1, headY + 13, 3, 2, '#2eb89c');

    // [7] 精雕立体斜戴「翠绿灵羽游侠小帽」（4 阶丝绒湖青 + 鎏金帽带 + 飘逸雪白翠尖长灵羽！）
    p.setPart(SPRITE_PART.HEADWEAR);
    const hatY = headY - 9;
    p.poly(
      [
        [bx - 12, hatY + 3],
        [bx - 10, hatY - 4],
        [bx + 3, hatY - 7],
        [bx + 10, hatY - 2],
        [bx + 11, hatY + 2],
        [bx, hatY + 3],
      ],
      '#0f4d42',
    );
    p.poly(
      [
        [bx - 10, hatY + 2],
        [bx - 8, hatY - 3],
        [bx + 2, hatY - 6],
        [bx + 8, hatY - 2],
        [bx + 9, hatY + 1],
      ],
      '#258c79',
    );
    p.poly(
      [
        [bx - 8, hatY - 2],
        [bx + 1, hatY - 5],
        [bx + 5, hatY - 2],
        [bx - 4, hatY],
      ],
      '#47c7ad',
    );
    p.hline(bx - 10, hatY + 1, 20, '#d9a434');
    p.hline(bx - 8, hatY, 15, '#ffe680');
    // 飘逸雪白翠尖大灵羽插于帽侧，迎风舒展！
    p.bezierRibbon(
      [bx - 8, hatY - 2],
      [bx - 16 + sway * 0.6, hatY - 8],
      [bx - 21 + sway, hatY - 12],
      3.6,
      1.1,
      '#45e8be',
      true,
    );
    p.bezierRibbon(
      [bx - 8, hatY - 2],
      [bx - 15 + sway * 0.5, hatY - 7],
      [bx - 19 + sway * 0.9, hatY - 10],
      2.0,
      0.6,
      '#ffffff',
      true,
    );
    p.rect(bx - 9, hatY - 2, 3, 2, '#ffe478'); // 帽扣金徽

    // [8] 双臂拉弓射击 + 雕花神木金纹长弓 + 璀璨翠金破魔符箭（完全清晰净空剪影！）
    const pull = isAtk && f === 0 ? -5 : isAtk && (f === 1 || f === 2) ? 2 : 0;
    const bowX = Math.min(48, bx + 17 + (isAtk && (f === 1 || f === 2) ? 2 : 0));
    const bowY = 37 + by;

    // 后臂（左臂）：拉弦手 + 2px 软萌少女小臂
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6, 34 + by, '#197060', '#33b39a', '#ffe073', 'left');
    const pullHandX = bx + 5 + pull;
    const pullHandY = bowY;
    drawSoftChibiArm64(p, bx - 4, 36 + by, pullHandX, pullHandY);

    // 前臂（右臂）：伸直托弓手 + 2px 软萌少女小臂
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6, 34 + by, '#197060', '#33b39a', '#ffe073', 'right');
    drawSoftChibiArm64(p, bx + 7, 36 + by, bowX - 1, bowY);

    // 精雕神木金纹反曲大长弓
    p.setPart(SPRITE_PART.WEAPON);
    const bowTopX = bowX - 6;
    const bowTopY = bowY - 17;
    const bowBotX = bowX - 6;
    const bowBotY = bowY + 17;
    // 弓弦（蓄力时明显向后绷紧！）
    const stringX = isAtk && (f === 1 || f === 2) ? bowTopX + 1 : pullHandX;
    p.line(bowTopX, bowTopY + 1, stringX, bowY, '#e3faf5', 1);
    p.line(bowBotX, bowBotY - 1, stringX, bowY, '#e3faf5', 1);
    // 优雅反曲雕花弓臂
    p.bezierRibbon([bowTopX, bowTopY], [bowX + 3, bowY - 8], [bowX + 1, bowY], 2.4, 2.8, '#7a471d');
    p.bezierRibbon([bowTopX + 1, bowTopY + 1], [bowX + 3, bowY - 8], [bowX + 1, bowY], 1.1, 1.2, '#f2c85b');
    p.bezierRibbon([bowX + 1, bowY], [bowX + 3, bowY + 8], [bowBotX, bowBotY], 2.8, 2.4, '#7a471d');
    p.bezierRibbon([bowX + 1, bowY], [bowX + 3, bowY + 8], [bowBotX + 1, bowBotY - 1], 1.2, 1.1, '#f2c85b');
    // 弓梢翠玉灵珠
    p.ellipse(bowTopX, bowTopY, 1.6, 1.6, '#66ffdb', true);
    p.ellipse(bowBotX, bowBotY, 1.6, 1.6, '#66ffdb', true);

    // 翠金破魔御札灵箭（待机与蓄力搭在弓上，发射帧激射璀璨破魔箭光！）
    const arrowTailX = isAtk && (f === 1 || f === 2) ? bowX + 2 : pullHandX;
    const arrowTipX = Math.min(60, bowX + (isAtk && (f === 1 || f === 2) ? 14 : 9));
    p.line(arrowTailX, bowY, arrowTipX - 3, bowY, '#ffe680', 1, true);
    // 箭身小御札纸条
    p.rect(Math.min(54, bowX + 2), bowY - 2, 2, 4, '#fffaf0', true);
    p.px(Math.min(54, bowX + 2), bowY, '#ff3b5c', true);
    // 锋利发光翠金箭簇
    p.poly(
      [
        [arrowTipX, bowY],
        [arrowTipX - 5, bowY - 3],
        [arrowTipX - 4, bowY],
        [arrowTipX - 5, bowY + 3],
      ],
      '#3df5c4',
      true,
    );
    p.line(arrowTipX - 4, bowY, arrowTipX, bowY, '#ffffff', 1, true);

    drawWrappedHand(p, bowX, bowY);
    drawWrappedHand(p, pullHandX, pullHandY);

    if (isAtk && f === 0) {
      // 蓄力满弓翠金十字星芒
      p.setPart(SPRITE_PART.GLOW_FX);
      p.hline(arrowTipX - 2, bowY, 6, '#ffffff', true);
      p.vline(arrowTipX + 1, bowY - 3, 7, '#75ffe0', true);
    } else if (isAtk && (f === 1 || f === 2)) {
      // 离弦翠金星风破空波纹！
      p.setPart(SPRITE_PART.GLOW_FX);
      drawSlashArc64(p, bowX + 4, bowY, 11, 13, -0.95, 0.95, '#29d9a8', '#ffe878', '#ffffff');
      p.line(bowX + 4, bowY, 61, bowY, '#99ffe6', 2, true);
      p.hline(bowX + 6, bowY, Math.max(1, 61 - (bowX + 6)), '#ffffff', true);
    }
  },
};

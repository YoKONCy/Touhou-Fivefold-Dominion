/**
 * 2. 夜影使魔（混沌 T1-A · 1×1 潜行暗系刺客）
 * 银月紫发 × 黑曜猫耳连帽夜行披风 × 琥珀猫瞳东方影猫刺客少女，配双月牙短刃与星纹长围巾。
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
import { drawSparkStar64, drawWrappedHand, HD_BASE } from './helpers';

/** 夜影使魔（creature_shadow_imp）HD 像素绘谱 */
export const CREATURE_SHADOW_IMP_RIG_SPEC: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0d081f',
  backdropBottom: '#26123d',
  backdropGlow: '#d178ff',
  avatarCrop: { x: 14, y: 5, size: 36 },
  portraitCrop: { x: 3, y: 3, w: 58, h: 64 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx = isAtk && (f === 1 || f === 2) ? 26 : isHit ? 31 : Math.round(30 + pose.leanX * 1.0);
    const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.1);
    const sway = pose.flutter * 1.8 + (isMove ? -2.2 : 0);
    const headY = 25 + by;

    // [1] 后景：残影飘飞的「暗夜影雾破碎长披风」+ 优雅翘卷「暗影新月猫尾」（凸显 32% 潜行高擦弹！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const capeTailX = Math.max(4, bx - 22 + Math.round(sway * 1.1));
    p.poly(
      [
        [bx - 5, 34 + by],
        [bx + 4, 34 + by],
        [bx + 2, 50 + by],
        [bx - 7 + Math.round(sway * 0.6), 54 + by],
        [bx - 12 + Math.round(sway * 0.8), 49 + by],
        [capeTailX, 51 + by],
        [Math.max(5, capeTailX + 2), 41 + by],
      ],
      '#170d2e',
    );
    p.poly(
      [
        [bx - 4, 35 + by],
        [bx + 2, 35 + by],
        [bx - 5 + Math.round(sway * 0.6), 51 + by],
        [Math.max(6, capeTailX + 3), 48 + by],
        [Math.max(7, capeTailX + 4), 42 + by],
      ],
      '#391d6b',
    );
    // 披风内衬绯紫流光边与散逸暗影残烟
    p.bezierRibbon([bx - 6, 36 + by], [bx - 13 + sway * 0.5, 44 + by], [Math.max(6, capeTailX + 2), 49 + by], 1.5, 0.7, '#b5369c');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(Math.max(3, capeTailX - 1), 46 + by + Math.round(Math.sin(phase) * 2), '#c766ff', true);
    p.px(Math.max(4, capeTailX + 1), 54 + by - Math.round(Math.cos(phase) * 1.5), '#75e8ff', true);

    // 纤细灵巧 S 形黑紫恶魔猫尾（优雅向左上高挑卷起，与下方反握暗刃完全分离零重叠！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const tTipX = Math.max(6, bx - 22 + Math.round(sway * 0.7));
    const tTipY = 30 + by + Math.round(Math.cos(phase) * 2.0);
    p.bezierRibbon([bx - 6, 46 + by], [bx - 18, 43 + by], [tTipX + 2, tTipY], 2.8, 1.3, '#221140');
    p.bezierRibbon([bx - 6, 45 + by], [bx - 17, 42 + by], [tTipX + 2, tTipY], 1.1, 0.6, '#7d44c7');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.poly([[tTipX + 2, tTipY - 2], [Math.max(3, tTipX - 3), tTipY - 4], [tTipX, tTipY + 2], [tTipX + 3, tTipY]], '#e066ff', true);
    p.px(Math.max(4, tTipX - 1), tTipY - 3, '#ffe885', true);

    // 兜帽深邃后罩外缘（在银发外廓左右垂落黑曜暗影，强化“连帽暗影刺客”包裹层次！）
    p.setPart(SPRITE_PART.BACK_ACC);
    p.poly(
      [
        [bx - 13, headY - 7],
        [bx + 12, headY - 7],
        [bx + 13, headY + 10],
        [bx - 14, headY + 10],
      ],
      '#140a29',
    );

    // [2] 丝滑月银淡紫飘逸后发（与漆黑连帽披风形成绝美高反差！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 10 - sway * 0.4, 41 + by],
        [bx + 6 - sway * 0.5, 46 + by],
        [bx - 8 + sway * 0.6, 47 + by],
        [bx - 11 + sway * 0.6, 40 + by],
      ],
      '#6a6099',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 8 - sway * 0.3, 40 + by],
        [bx - 9 + sway * 0.5, 42 + by],
      ],
      '#b8b0e3',
    );

    // [3] 轻捷 3/4 斜错步「过膝暗夜长靴 + 露出一线月白肌肤与鎏金靴扣」（高阶东方刺客美感！）
    drawStaggeredLegs64(p, bx, 53, 66, pose, {
      sockShadow: '#231642',
      sockLight: '#402975',
      shoeDark: '#160d2b',
      shoeMain: '#382169',
      shoeHighlight: '#ffe478',
      skinColor: '#f5e4ec',
    });

    // [4] 左后臂：反握斜下曳出「星银暗月副弯刃」（向下后斜指，与高扬猫尾形成帅气叉角剪影！）
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 36.5 + by, '#1f123d', '#442b7d', '#ffe066', 'left');
    const lHandX = Math.max(11, isAtk && (f === 1 || f === 2) ? bx - 14 : bx - 12);
    const lHandY = isAtk && f === 0 ? 39 + by : 43 + by;
    drawSoftChibiArm64(p, bx - 8, 37 + by, lHandX, lHandY, '#fff2f7', '#d4b5c9');
    p.setPart(SPRITE_PART.WEAPON);
    p.bezierRibbon([lHandX, lHandY], [lHandX - 4, lHandY + 4], [Math.max(4, lHandX - 9), lHandY + 7], 2.8, 0.8, '#6a48b8');
    p.bezierRibbon([lHandX - 1, lHandY + 1], [lHandX - 4, lHandY + 4], [Math.max(4, lHandX - 9), lHandY + 7], 1.2, 0.5, '#f2e8ff', true);
    drawWrappedHand(p, lHandX, lHandY, '#261547', '#553399', '#120824');

    // [5] 锯齿暗夜燕尾刺客短裙 + 绯紫丝绸内衬 + 黄金新月束腰带！
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 42 + by,
      waistW: 10,
      hemY: 53 + by,
      hemW: 27,
      tiltRight: 1.0,
      archDepth: 2.2,
      waveLobes: 4,
      waveAmp: 1.8,
      swayX: -pose.leanX * 0.5 + sway * 0.85,
      colors: {
        deep: '#120a24',
        shadow: '#241447',
        main: '#3c2273',
        light: '#613ba8',
        highlight: '#966be0',
      },
      trimBand: {
        offsetFromHem: 1.8,
        thickness: 1.2,
        color: '#ff4da6',
        shadowColor: '#9e1960',
      },
      petticoat: {
        peekDepth: 1.6,
        shade: '#5e1a59',
        main: '#c4368a',
        highlight: '#ff8cd1',
      },
    });
    // 黄金新月腰带与绯红蝴蝶结飘带
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.hline(bx - 6, 42 + by, 13, '#d49a2a');
    p.hline(bx - 5, 41 + by, 11, '#ffe478');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.rect(bx - 1, 41 + by, 3, 3, '#fff7bd', true);

    // [6] 修身黑曜夜行紧身马甲 + 绯紫金边高领围巾 + 鎏金星辰胸扣！
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 34 + by], [bx + 5, 34 + by], [bx + 6, 42 + by], [bx - 5, 42 + by]], '#160d2b');
    p.poly([[bx - 4, 34 + by], [bx + 4, 34 + by], [bx + 4, 41 + by], [bx - 4, 41 + by]], '#2f1c59');
    p.line(bx - 4, 35 + by, bx + 1, 40 + by, '#ffe066', 1);
    p.line(bx + 4, 35 + by, bx + 1, 40 + by, '#ffe066', 1);
    // 护颈绯紫刺客高围巾
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.ellipse(bx, 34 + by, 6.8, 2.4, '#8f1b68');
    p.hline(bx - 5, 33 + by, 10, '#f25cb3');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx + 1, 34 + by, '#ffe878', true);

    // [7] 月白冷艳娇俏少女颜 + 璀璨琥珀金猫瞳 4×4 大眼 + 小虎牙 + 银月淡紫空气刘海 + 黑曜大猫耳刺客连帽！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff8fc',
      skinMain: '#f7e6f0',
      skinShade: '#cfb2c9',
      lashColor: '#210e36',
      irisDark: '#a64d00',
      irisMid: '#ffa214',
      irisGlow: '#fff685',
      blushColor: '#ff96c2',
      vampireFang: true,
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#6a609c',
      dark: '#978ec7',
      mid: '#cac3ed',
      light: '#ebe8ff',
      spec: '#ffffff',
      leftLockLen: 12,
      rightLockLen: 10,
      fluff: 1,
      bobFlare: true,
      sway,
    });

    // 标志性半覆顶「黑曜丝绒金边大猫耳刺客连帽」（兜帽包覆发冠上方，留出完整灵动银发与娇俏面庞！）
    p.setPart(SPRITE_PART.HEADWEAR);
    const hoodY = headY - 8;
    // 兜帽拱形帽檐轮廓（优雅包住头顶与左右两侧上沿，带细金边与紫罗兰立体受光！）
    p.poly(
      [
        [bx - 12, headY + 1],
        [bx - 12, hoodY + 1],
        [bx - 7, hoodY - 5],
        [bx + 6, hoodY - 5],
        [bx + 11, hoodY + 1],
        [bx + 11, headY - 1],
        [bx + 8, hoodY + 2],
        [bx + 5, hoodY - 1],
        [bx - 6, hoodY - 1],
        [bx - 9, hoodY + 3],
      ],
      '#190d33',
    );
    p.poly(
      [
        [bx - 11, hoodY + 1],
        [bx - 6, hoodY - 4],
        [bx + 5, hoodY - 4],
        [bx + 10, hoodY + 1],
        [bx + 6, hoodY - 1],
        [bx - 6, hoodY - 1],
      ],
      '#43247d',
    );
    p.hline(bx - 5, hoodY - 4, 10, '#7f52cc');
    // 精致金丝帽檐镶边
    p.line(bx - 9, hoodY + 1, bx - 5, hoodY - 1, '#ffe066', 1);
    p.hline(bx - 5, hoodY - 1, 11, '#ffe885');
    p.line(bx + 6, hoodY - 1, bx + 9, hoodY + 1, '#ffe066', 1);

    // 挺拔俏皮黑曜立体大猫耳（内耳柔粉紫光 + 左耳鎏金星环耳钉！）
    const earDrop = isHit ? 3 : 0;
    p.poly([[bx - 10, hoodY - 1], [bx - 13, Math.max(4, hoodY - 12 + earDrop)], [bx - 3, hoodY - 4]], '#1e0f3d');
    p.poly([[bx - 9, hoodY - 2], [bx - 11, Math.max(5, hoodY - 10 + earDrop)], [bx - 5, hoodY - 4]], '#57309e');
    p.poly([[bx - 8, hoodY - 2], [bx - 10, Math.max(6, hoodY - 8 + earDrop)], [bx - 6, hoodY - 4]], '#f29eff');
    p.poly([[bx + 9, hoodY - 1], [bx + 12, Math.max(4, hoodY - 12 + earDrop)], [bx + 2, hoodY - 4]], '#2b1654');
    p.poly([[bx + 8, hoodY - 2], [bx + 10, Math.max(5, hoodY - 10 + earDrop)], [bx + 4, hoodY - 4]], '#6e3ec2');
    p.poly([[bx + 7, hoodY - 2], [bx + 9, Math.max(6, hoodY - 8 + earDrop)], [bx + 5, hoodY - 4]], '#ffb8ff');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx - 11, Math.max(6, hoodY - 5 + earDrop), '#ffe878', true);
    p.px(bx - 10, Math.max(5, hoodY - 4 + earDrop), '#ffffff', true);

    // [8] 右前臂：疾影突刺「星银紫月牙主短刃」+ 双弧霓虹紫金瞬影斩！
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 36.5 + by, '#1f123d', '#442b7d', '#ffe066', 'right');
    const rHandX = isAtk && (f === 1 || f === 2) ? bx + 15 : isAtk && f === 0 ? bx + 9 : bx + 12;
    const rHandY = isAtk && f === 0 ? 38 + by : isAtk && (f === 1 || f === 2) ? 39 + by : 40 + by - Math.round(pose.armAction * 2);
    drawSoftChibiArm64(p, bx + 8, 37 + by, rHandX, rHandY, '#fff2f7', '#d4b5c9');

    p.setPart(SPRITE_PART.WEAPON);
    const bladeLen = isAtk && (f === 1 || f === 2) ? 14 : 12;
    const tipX = Math.min(57, rHandX + bladeLen);
    const tipY = isAtk && f === 0 ? rHandY - 10 : rHandY - 7;
    p.rect(rHandX, rHandY - 2, 2, 4, '#ffe066');
    p.bezierRibbon([rHandX + 1, rHandY - 1], [Math.round((rHandX + tipX) * 0.55), rHandY - 2], [tipX, tipY], 3.4, 0.8, '#6a46b8');
    p.bezierRibbon([rHandX + 2, rHandY - 1], [Math.round((rHandX + tipX) * 0.55), rHandY - 3], [tipX, tipY], 1.8, 0.6, '#f5ebff', true);
    p.px(tipX, tipY, '#ffffff', true);
    drawWrappedHand(p, rHandX, rHandY, '#261547', '#553399', '#120824');

    if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, bx + 16, 38 + by, 16, 15, -1.25, 1.05, '#9d2bff', '#ff59ba', '#fff7cc');
      drawSlashArc64(p, bx + 13, 39 + by, 13, 12, -1.0, 0.85, '#6624db', '#d499ff', '#ffffff');
      drawSparkStar64(p, Math.min(59, bx + 29), 26 + by, 2, '#ffe878');
    }
  },
};

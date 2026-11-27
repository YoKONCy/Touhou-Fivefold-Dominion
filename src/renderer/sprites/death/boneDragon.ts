/**
 * 7. 骸骨巨龙（T4-A · 2×2 飞行 · 霸气凶猛骸骨巨龙王：双翼遮天 + 4阶立体骸骨 + 强健龙爪 + 冥焰龙息！）
 */

import { SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { HD_BASE } from './helpers';

export const boneDragonSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#120b24',
  backdropBottom: '#291547',
  backdropGlow: '#9e52ff',
  avatarCrop: { x: 20, y: 4, size: 36 },
  portraitCrop: { x: 2, y: 2, w: 60, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const bx = isAtk && (f === 1 || f === 2) ? 27 : isMove ? 30 : Math.round(29 + pose.leanX * 0.8);
    const by = isMove
      ? [-4, 2, 0, -2][f % 4]
      : Math.round(Math.sin(phase) * 2.0 + pose.breathY - pose.stepLift);
    // 骸骨巨龙飞行扑腾双巨翼：0遮天高扬 → 1雷霆下拍掀冥焰气流 → 2展开滑翔 → 3强劲回提！
    const flap = isMove ? [-6, 13, 5, -4][f % 4] : Math.round(Math.sin(phase) * 3.4 + pose.flutter * 1.4);
    const boneDeep = '#6b7296';
    const boneMid = '#a4b0d1';
    const boneMain = '#dce4f5';
    const boneHi = '#ffffff';

    // [0] 右后方透视副骨翼（避开龙角区域，飞行时与主翼同步巨幅扑腾！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const rwTopX = bx - 5;
    const rwTopY = Math.max(5, 5 + by + Math.round(flap * 0.72));
    const rwTipX = bx - 14;
    const rwTipY = Math.max(6, 13 + by + Math.round(flap * 0.8));
    p.poly(
      [
        [bx + 1, 27 + by],
        [rwTopX, rwTopY],
        [rwTipX, rwTipY],
        [bx - 8, 22 + by + Math.round(flap * 0.35)],
        [bx + 2, 30 + by],
      ],
      '#29104a',
    );
    p.poly(
      [
        [bx, 26 + by],
        [rwTopX - 1, rwTopY + 3],
        [rwTipX + 2, rwTipY + 1],
        [bx - 6, 22 + by + Math.round(flap * 0.3)],
      ],
      '#53248c',
    );
    p.line(bx + 1, 27 + by, rwTopX, rwTopY, boneMid, 2);
    p.line(rwTopX, rwTopY, rwTipX, rwTipY, boneDeep, 2);

    // [1] 左前方遮天撕裂紫焰骸骨巨翼（4阶立体骨指 + 撕裂紫焰翼膜 + 翼肘骨爪！）
    const wTopX = Math.max(4, bx - 22);
    const wTopY = Math.max(6, 7 + by + flap);
    const wMidX = Math.max(3, bx - 25);
    const wMidY = Math.min(52, 25 + by + Math.round(flap * 1.05));
    const wBotX = bx - 15;
    const wBotY = Math.min(56, 39 + by + Math.round(flap * 0.65));
    p.poly(
      [
        [bx - 4, 28 + by],
        [wTopX, wTopY],
        [wMidX, wMidY],
        [wMidX + 6, wMidY - 3],
        [wBotX, wBotY],
        [wBotX + 6, wBotY - 5],
        [bx - 5, 38 + by],
      ],
      '#36155e',
    );
    p.poly(
      [
        [bx - 5, 28 + by],
        [wTopX + 3, wTopY + 4],
        [wMidX + 4, wMidY - 4],
        [wBotX + 4, wBotY - 5],
      ],
      '#7534c7',
    );
    p.setPart(SPRITE_PART.GLOW_FX);
    p.line(wTopX + 3, wTopY + 5, wMidX + 4, wMidY - 3, '#c480ff', 1, true);
    p.line(wTopX + 4, wTopY + 7, wBotX + 3, wBotY - 4, '#9b52ff', 1, true);
    // 巨龙下拍爆发帧（f === 1）：撕裂巨翼下方掀起紫青冥焰强劲下洗气流！
    if (isMove && f === 1) {
      p.bezierRibbon([wMidX + 1, wMidY + 3], [wBotX - 2, wBotY + 6], [bx - 4, wBotY + 3], 2.2, 0.6, '#9b52ff', true);
      p.bezierRibbon([wMidX + 3, wMidY + 2], [wBotX, wBotY + 5], [bx - 6, wBotY + 2], 1.0, 0.4, '#66f5ff', true);
    }
    // 粗壮立体翼骨主脊、翼肘骨棘与三根指骨
    p.setPart(SPRITE_PART.BACK_ACC);
    p.bezierRibbon([bx - 3, 29 + by], [bx - 13, Math.max(5, 16 + by + flap * 0.72)], [wTopX, wTopY], 4.2, 2.2, boneMid);
    p.bezierRibbon([bx - 3, 28 + by], [bx - 13, Math.max(4, 15 + by + flap * 0.72)], [wTopX, wTopY], 2.2, 1.1, boneMain);
    p.line(bx - 13, Math.max(4, 15 + by + Math.round(flap * 0.72)), wTopX, wTopY, boneHi, 1);
    // 翼顶凶悍骨棘爪
    p.poly([[wTopX, wTopY], [wTopX - 2, Math.max(2, wTopY - 4)], [wTopX + 3, Math.max(3, wTopY - 1)]], boneHi);
    p.line(wTopX, wTopY, wMidX, wMidY, boneMain, 2);
    p.line(wTopX + 2, wTopY + 2, wBotX, wBotY, boneMid, 2);
    p.line(bx - 12, Math.max(6, 18 + by + Math.round(flap * 0.7)), bx - 10, 36 + by, boneMid, 2);

    // [2] 蜿蜒长棘骨尾（4阶骨节 + 背棘 + 紫焰骨刃尾尖！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const tailWave = isMove ? Math.round(flap * 0.55) : Math.round(flap * 0.4);
    p.bezierRibbon([bx - 8, 46 + by], [bx - 21, 55 + by], [bx - 26, 44 + by + tailWave], 5.0, 1.6, boneDeep);
    p.bezierRibbon([bx - 8, 45 + by], [bx - 20, 53 + by], [bx - 25, 43 + by + tailWave], 3.0, 1.0, boneMain);
    p.bezierRibbon([bx - 8, 44 + by], [bx - 19, 52 + by], [bx - 24, 42 + by + tailWave], 1.2, 0.5, boneHi);
    // 尾刺尖端冥紫骨刃
    const tailTipY = 44 + by + tailWave;
    p.poly([[bx - 26, tailTipY], [bx - 29, tailTipY - 5], [bx - 22, tailTipY - 3]], '#9e52ff', true);
    p.px(bx - 27, tailTipY - 3, '#e8ccff', true);

    // [3] 强壮厚重骸骨后肢（待机踩地霸气；飞行时向后屈收掠空不再空中走路！）
    p.setPart(SPRITE_PART.LEGS);
    if (isMove) {
      p.line(bx - 2, 46 + by, bx - 4, 54 + by, boneDeep, 4);
      p.line(bx - 4, 54 + by, bx + 2, 57 + by, boneMid, 3);
      p.bezierRibbon([bx - 9, 45 + by], [bx - 16, 51 + by], [bx - 14, 55 + by], 5.0, 3.4, boneMid);
      p.bezierRibbon([bx - 9, 44 + by], [bx - 15, 50 + by], [bx - 14, 54 + by], 2.6, 1.8, boneMain);
      p.ellipse(bx - 15, 53 + by, 2.6, 2.2, boneHi);
      p.line(bx - 14, 54 + by, bx - 9, 59 + by, boneMain, 4);
      p.line(bx - 9, 59 + by, bx - 4, 60 + by, boneHi, 2);
      p.line(bx - 9, 59 + by, bx - 6, 62 + by, boneHi, 1);
      p.px(bx - 4, 60 + by, '#c480ff', true);
    } else {
      const stride = Math.round(pose.stride * 3.0);
      // 远侧后腿（暗骨立体纵深）
      p.line(bx - 2, 46 + by, bx + 4 + stride, 54, boneDeep, 4);
      p.line(bx + 4 + stride, 54, bx + 1 + stride, 62, boneMid, 3);
      p.poly([[bx - 1 + stride, 62], [bx + 7 + stride, 62], [bx + 9 + stride, 64], [bx + 1 + stride, 64]], boneMid);
      // 近侧强健霸王龙后骨腿（粗大腿 + 突出膝骨节 + 肌肉感胫骨 + 3 趾锋利弯爪！）
      p.bezierRibbon([bx - 9, 45 + by], [bx - 15 - stride, 52], [bx - 12 - stride, 56], 5.2, 3.6, boneMid);
      p.bezierRibbon([bx - 9, 44 + by], [bx - 14 - stride, 51], [bx - 12 - stride, 55], 2.8, 2.0, boneMain);
      p.ellipse(bx - 13 - stride, 54, 2.8, 2.4, boneHi); // 膝关节球
      p.line(bx - 12 - stride, 55, bx - 7 - stride, 62, boneMid, 4);
      p.line(bx - 11 - stride, 55, bx - 7 - stride, 61, boneHi, 2);
      // 3 趾抓地巨龙骨爪
      p.poly([[bx - 11 - stride, 62], [bx - 3 - stride, 61], [bx + 1 - stride, 64], [bx - 10 - stride, 64]], boneMain);
      p.hline(bx - 9 - stride, 62, 8, boneHi);
      p.px(bx + 1 - stride, 64, '#b870ff', true);
      p.px(bx - 3 - stride, 64, '#b870ff', true);
    }

    // [4] 巨型拱起脊椎 + 镂空燃魂巨胸肋 + 熊熊紫青冥焰龙魂核！
    p.setPart(SPRITE_PART.TORSO);
    p.ellipse(bx - 2, 39 + by, 10.6, 8.8, '#140b24'); // 深黑胸腔底
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx, 39 + by, 5.2, 4.6, '#7a2eff', true);
    p.ellipse(bx + 1, 38 + by, 2.8, 2.5, '#59f5ff', true);
    p.px(bx + 1, 38 + by, '#ffffff', true);
    // 粗壮拱背龙脊骨 + 锯齿背脊骨棘！
    p.setPart(SPRITE_PART.TORSO);
    p.bezierRibbon([bx - 11, 46 + by], [bx - 2, 30 + by], [bx + 8, 27 + by], 5.6, 4.6, boneDeep);
    p.bezierRibbon([bx - 10, 45 + by], [bx - 2, 29 + by], [bx + 8, 26 + by], 3.4, 2.8, boneMain);
    p.bezierRibbon([bx - 9, 44 + by], [bx - 2, 28 + by], [bx + 8, 25 + by], 1.4, 1.2, boneHi);
    // 脊背骨棘刺
    for (const [sx, sy] of [[bx - 7, 36], [bx - 3, 30], [bx + 1, 27], [bx + 5, 25]]) {
      p.poly([[sx, sy + by], [sx - 2, sy - 4 + by], [sx + 2, sy - 1 + by]], boneMain);
      p.px(sx - 2, sy - 3 + by, boneHi);
    }
    // 5 根 2 阶立体弯曲象牙巨肋跨过龙魂核心！
    for (let i = 0; i < 5; i++) {
      const rx = bx - 8 + i * 3.5;
      const ry = 35 + by + (i < 2 ? 2 : 0);
      p.bezierRibbon([rx, ry - 3], [rx - 1, ry + 5], [rx + 4, ry + 11], 2.8, 1.4, boneMid);
      p.bezierRibbon([rx + 0.5, ry - 3], [rx, ry + 4], [rx + 3.5, ry + 9], 1.3, 0.7, boneHi);
    }

    // [4.5] 凶猛胸前蓄力高抬的前龙骨爪（告别呆板支撑棍，霸气威慑抓握！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    const clawLift = isAtk && (f === 1 || f === 2) ? -3 : 0;
    const clawReach = isAtk && (f === 1 || f === 2) ? 4 : 0;
    const elbowX = bx + 4;
    const elbowY = 44 + by + clawLift;
    const wristX = bx + 11 + clawReach;
    const wristY = 46 + by + clawLift;
    p.line(bx + 5, 36 + by, elbowX, elbowY, boneMid, 3);
    p.line(bx + 6, 36 + by, elbowX + 1, elbowY, boneHi, 1);
    p.line(elbowX, elbowY, wristX, wristY, boneMain, 3);
    p.line(elbowX + 1, elbowY - 1, wristX, wristY - 1, boneHi, 1);
    // 三根寒光锋利弯钩骨爪指！
    p.line(wristX, wristY - 1, wristX + 4, wristY - 3, boneHi, 1);
    p.line(wristX, wristY, wristX + 5, wristY + 1, boneHi, 1);
    p.line(wristX, wristY + 1, wristX + 3, wristY + 4, boneMain, 1);
    p.px(wristX + 5, wristY + 1, '#c480ff', true);

    // [5] 弯曲强健 S 形骨颈 + 凶悍棱角龙骨巨首 + 双对镰刀龙角 + 错落长獠牙！
    p.setPart(SPRITE_PART.NECK_HEAD);
    const headX = bx + 11 + (isAtk && (f === 1 || f === 2) ? 2 : 0);
    const headY = 20 + by + (isAtk && f === 0 ? -3 : 0);
    p.bezierRibbon([bx + 5, 30 + by], [bx + 9, 27 + by], [headX - 3, headY + 2], 5.2, 4.0, boneDeep);
    p.bezierRibbon([bx + 6, 29 + by], [bx + 9, 26 + by], [headX - 2, headY + 1], 3.0, 2.2, boneMain);
    p.bezierRibbon([bx + 6, 28 + by], [bx + 9, 25 + by], [headX - 2, headY], 1.2, 1.0, boneHi);

    // 两对后弯霸气立体象牙镰刀龙角！
    p.setPart(SPRITE_PART.HEADWEAR);
    p.bezierRibbon([headX - 4, headY - 4], [headX - 10, headY - 13], [headX - 17, headY - 11], 3.5, 0.9, boneDeep);
    p.bezierRibbon([headX - 4, headY - 5], [headX - 10, headY - 13], [headX - 16, headY - 11], 1.6, 0.5, boneHi);
    p.bezierRibbon([headX - 1, headY - 5], [headX - 5, headY - 14], [headX - 11, headY - 15], 3.0, 0.8, boneMid);
    p.bezierRibbon([headX - 1, headY - 6], [headX - 5, headY - 14], [headX - 10, headY - 15], 1.2, 0.5, boneHi);

    // 棱角凶悍龙骨上颌（倾斜流线吻部 + 高耸重眉脊 + 尖锐鼻棘！）
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.poly(
      [
        [headX - 6, headY - 5],
        [headX + 3, headY - 7],
        [headX + 12, headY - 3],
        [headX + 15, headY + 1],
        [headX + 12, headY + 3],
        [headX - 4, headY + 3],
      ],
      boneMid,
    );
    p.poly(
      [
        [headX - 5, headY - 5],
        [headX + 3, headY - 6],
        [headX + 12, headY - 2],
        [headX + 14, headY + 1],
        [headX - 2, headY + 1],
      ],
      boneMain,
    );
    p.line(headX - 4, headY - 5, headX + 3, headY - 6, boneHi, 1);
    p.line(headX + 3, headY - 6, headX + 12, headY - 2, boneHi, 1);
    // 上翘鼻吻钩棘
    p.poly([[headX + 10, headY - 3], [headX + 14, headY - 7], [headX + 14, headY - 1]], boneHi);
    // 深暗龙口 + 凶悍锯齿下颌骨
    const jawDrop = isAtk && (f === 1 || f === 2) ? 4 : 1;
    p.poly(
      [
        [headX - 2, headY + 2],
        [headX + 13, headY + 2],
        [headX + 10, headY + 7 + jawDrop],
        [headX - 3, headY + 6 + jawDrop],
      ],
      '#170824',
    );
    p.poly(
      [
        [headX - 3, headY + 5 + jawDrop],
        [headX + 11, headY + 6 + jawDrop],
        [headX + 9, headY + 9 + jawDrop],
        [headX - 4, headY + 8 + jawDrop],
      ],
      boneMid,
    );
    p.hline(headX - 2, headY + 6 + jawDrop, 11, boneMain);
    // 错落大犬齿獠牙与利齿列！
    p.vline(headX + 11, headY + 2, 3, boneHi); // 前大犬齿
    p.vline(headX + 7, headY + 2, 2, boneHi);
    p.vline(headX + 4, headY + 2, 2, boneMain);
    p.vline(headX + 9, headY + 4 + jawDrop, 2, boneHi); // 下大獠牙
    p.px(headX + 5, headY + 5 + jawDrop, boneHi);

    // 深邃黑眼窝 + 凶厉燃烧猩红狭长龙瞳！
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.poly([[headX - 2, headY - 3], [headX + 5, headY - 2], [headX + 4, headY + 1], [headX - 2, headY]], '#12061c');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.line(headX, headY - 2, headX + 4, headY - 1, '#ff1744', 2, true);
    p.px(headX + 2, headY - 2, '#fff5a6', true);

    // [6] 攻击爆发：炽烈幽蓝冥紫龙息吐息！
    if (isAtk && (f === 1 || f === 2)) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.poly(
        [
          [headX + 9, headY + 4],
          [63, headY - 4],
          [63, headY + 16],
          [headX + 9, headY + 8],
        ],
        '#8233ff',
        true,
      );
      p.poly(
        [
          [headX + 10, headY + 5],
          [63, headY],
          [63, headY + 12],
          [headX + 10, headY + 7],
        ],
        '#3deeff',
        true,
      );
      p.line(headX + 10, headY + 6, 62, headY + 5, '#ffffff', 2, true);
      p.px(56, headY + 1, '#ffffff', true);
      p.px(59, headY + 10, '#c78cff', true);
    }
  },
};

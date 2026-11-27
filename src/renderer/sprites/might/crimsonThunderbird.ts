/**
 * 8. 赤雷巨鹏（武艺旧都 T4-A · 2×2 飞行 · 极速神禽 + 100% 稳定赤雷天罚）
 * 对标红莲魔龙史诗级精度的东方神禽「朱雀金翅赤雷大鹏王」：
 * 宽展弧拱多层分层赤金飞羽巨翼（清晰初级飞羽锯齿羽梢）+ 流线苍鹰金胸躯干 +
 * 凤凰三叉苍蓝雷眼长尾羽 + 羽裤屈膝黄金雷鹰钢爪 + 5缕烈焰红金冠羽鹰王首与弯钩神喙 +
 * 纤细锐利 1px 冰青白雷弧与苍穹锯齿天雷劈击！
 */

import { SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import {
  drawFineLightning64,
  drawHollowRing64,
  drawSparkStar64,
  HD_MIGHT_BASE,
} from './helpers';

export const crimsonThunderbirdSpec: SpriteRigSpec = {
  ...HD_MIGHT_BASE,
  backdropTop: '#16091a',
  backdropBottom: '#3d151e',
  backdropGlow: '#66e6ff',
  avatarCrop: { x: 22, y: 8, size: 35 },
  portraitCrop: { x: 1, y: 1, w: 62, h: 69 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx = isAtk && (f === 1 || f === 2) ? 28 : isHit ? 26 : Math.round(30 + pose.leanX * 0.7);
    const by = isMove
      ? [-4, 1, 2, -2][f % 4]
      : Math.round(Math.sin(phase) * 2.0 + pose.breathY);
    const flap = isMove
      ? [-7, 9, 3, -5][f % 4]
      : isAtk && f === 0
        ? -7
        : isAtk && (f === 1 || f === 2)
          ? 7
          : Math.round(Math.sin(phase) * 3.8);
    const tw = Math.round(pose.flutter * 2.0);

    // [1] 凤凰三叉长尾羽（赤红羽茎 + 炽金羽缘 + 苍蓝雪白雷眼羽斑！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const tailBaseX = bx - 8;
    const tailBaseY = 44 + by;
    const tails: Array<{ ex: number; ey: number; col: string; hi: string }> = [
      { ex: Math.max(4, bx - 25), ey: Math.min(62, 50 + by + tw), col: '#8f1322', hi: '#ff9d3b' },
      { ex: Math.max(5, bx - 24), ey: Math.min(65, 57 + by + tw), col: '#b81c28', hi: '#ffe066' },
      { ex: Math.max(9, bx - 19), ey: Math.min(66, 62 + by + tw), col: '#78101c', hi: '#ff7b29' },
    ];
    for (const t of tails) {
      p.bezierRibbon([tailBaseX, tailBaseY], [Math.round((tailBaseX + t.ex) * 0.5), Math.round((tailBaseY + t.ey) * 0.5) + 2], [t.ex, t.ey], 4.2, 1.8, t.col);
      p.bezierRibbon([tailBaseX, tailBaseY], [Math.round((tailBaseX + t.ex) * 0.5), Math.round((tailBaseY + t.ey) * 0.5) + 1], [t.ex + 1, t.ey - 1], 1.8, 0.9, t.hi);
      // 尾端精致雷电翎眼
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(t.ex + 1, t.ey - 1, 2.0, 1.5, '#38c9ff', true);
      p.px(t.ex + 1, t.ey - 1, '#ffffff', true);
      p.setPart(SPRITE_PART.BACK_ACC);
    }

    // [2] 远侧高展「苍穹右神翼」（宽展斜指右上角 + 3 根清晰锯齿尖长飞羽，彻底杜绝平顶帽错觉！）
    const rwElbowX = bx + 9;
    const rwElbowY = Math.max(5, 13 + by + Math.round(flap * 0.55));
    const rwTip1X = Math.min(59, bx + 27);
    const rwTip1Y = Math.max(4, 5 + by + Math.round(flap * 0.75));
    const rwTip2X = Math.min(58, bx + 26);
    const rwTip2Y = Math.max(9, 13 + by + Math.round(flap * 0.65));
    const rwTip3X = Math.min(54, bx + 22);
    const rwTip3Y = Math.max(15, 20 + by + Math.round(flap * 0.5));
    // 右翼锯齿状飞羽暗绛红底廓
    p.poly(
      [
        [bx + 2, 32 + by],
        [rwElbowX, rwElbowY],
        [rwTip1X, rwTip1Y],
        [rwTip1X - 6, Math.round((rwTip1Y + rwTip2Y) * 0.5) + 1],
        [rwTip2X, rwTip2Y],
        [rwTip2X - 6, Math.round((rwTip2Y + rwTip3Y) * 0.5) + 1],
        [rwTip3X, rwTip3Y],
        [bx + 8, 34 + by],
      ],
      '#590915',
    );
    // 右翼朱红覆羽中层
    p.poly(
      [
        [bx + 3, 31 + by],
        [rwElbowX + 1, rwElbowY + 2],
        [rwTip1X - 3, rwTip1Y + 2],
        [rwTip2X - 3, rwTip2Y],
        [rwTip3X - 2, rwTip3Y - 1],
        [bx + 7, 32 + by],
      ],
      '#c92228',
    );
    // 右翼炽橙内羽高光与 3 根锐利斜指长飞羽金羽干
    p.bezierRibbon([bx + 3, 30 + by], [rwElbowX, rwElbowY], [rwTip1X, rwTip1Y], 3.0, 1.2, '#e68a1c');
    p.bezierRibbon([bx + 3, 29 + by], [rwElbowX, rwElbowY - 1], [rwTip1X, rwTip1Y], 1.4, 0.7, '#fff299');
    p.line(rwElbowX + 2, rwElbowY + 3, rwTip2X, rwTip2Y, '#ffaa38', 2);
    p.line(rwElbowX + 2, rwElbowY + 7, rwTip3X, rwTip3Y, '#ff6e29', 2);
    p.px(rwTip1X, rwTip1Y, '#ffffff', true);
    p.px(rwTip2X, rwTip2Y, '#ffe878', true);

    // [3] 近侧遮天拱形「朱雀金翅左主翼」（三层叠羽 + 5 根根根分明的炽金长飞羽剪影！）
    const lwWristX = Math.max(9, bx - 15);
    const lwWristY = Math.max(4, 7 + by + Math.round(flap * 0.85));
    const lwTip1X = Math.max(3, bx - 26);
    const lwTip1Y = Math.max(6, 13 + by + flap);
    const lwTip2X = Math.max(4, bx - 25);
    const lwTip2Y = Math.min(40, 22 + by + Math.round(flap * 0.92));
    const lwTip3X = Math.max(6, bx - 22);
    const lwTip3Y = Math.min(46, 30 + by + Math.round(flap * 0.78));
    const lwTip4X = Math.max(10, bx - 16);
    const lwTip4Y = Math.min(49, 37 + by + Math.round(flap * 0.58));

    // 主翼锯齿状飞羽深暗廓影
    p.poly(
      [
        [bx - 3, 35 + by],
        [lwWristX, lwWristY],
        [lwTip1X, lwTip1Y],
        [lwTip1X + 6, Math.round((lwTip1Y + lwTip2Y) * 0.5)],
        [lwTip2X, lwTip2Y],
        [lwTip2X + 6, Math.round((lwTip2Y + lwTip3Y) * 0.5)],
        [lwTip3X, lwTip3Y],
        [lwTip3X + 5, Math.round((lwTip3Y + lwTip4Y) * 0.5)],
        [lwTip4X, lwTip4Y],
        [bx - 6, 42 + by],
      ],
      '#4f0914',
    );
    // 第二层浓郁朱红覆羽
    p.poly(
      [
        [bx - 4, 34 + by],
        [lwWristX + 1, lwWristY + 2],
        [lwTip1X + 3, lwTip1Y + 1],
        [lwTip2X + 3, lwTip2Y - 1],
        [lwTip3X + 3, lwTip3Y - 2],
        [lwTip4X + 2, lwTip4Y - 3],
        [bx - 6, 39 + by],
      ],
      '#c92228',
    );
    // 第三层炽橙金内覆羽叠鳞
    p.poly(
      [
        [bx - 5, 32 + by],
        [lwWristX + 2, lwWristY + 5],
        [lwTip1X + 8, lwTip1Y + 5],
        [lwTip2X + 8, lwTip2Y - 1],
        [lwTip3X + 7, lwTip3Y - 4],
        [bx - 7, 36 + by],
      ],
      '#ff662b',
    );
    // 耀眼鎏金拱形翼肩骨脊 + 5 根根根分明的灿金初级飞羽！
    p.bezierRibbon([bx - 3, 33 + by], [bx - 9, Math.max(5, 16 + by + flap * 0.6)], [lwWristX, lwWristY], 4.2, 2.2, '#e68a1c');
    p.bezierRibbon([bx - 3, 32 + by], [bx - 9, Math.max(5, 15 + by + flap * 0.6)], [lwWristX, lwWristY], 2.0, 1.0, '#fff299');
    p.line(lwWristX, lwWristY + 1, lwTip1X, lwTip1Y, '#ffe878', 2);
    p.line(lwWristX + 1, lwWristY + 4, lwTip2X, lwTip2Y, '#ffba38', 2);
    p.line(lwWristX + 2, lwWristY + 8, lwTip3X, lwTip3Y, '#ff942e', 2);
    p.line(lwWristX + 3, lwWristY + 12, lwTip4X, lwTip4Y, '#ff6a29', 2);
    p.px(lwTip1X, lwTip1Y, '#ffffff', true);
    p.px(lwTip2X, lwTip2Y, '#fff8bd', true);
    p.px(lwTip3X, lwTip3Y, '#ffe878', true);

    // [4] 流线健美猛禽躯体（倾斜苍鹰宽胸收腹 + 金羽胸甲叠纹，告别圆球气球！）
    p.setPart(SPRITE_PART.TORSO);
    p.bezierRibbon([bx - 9, 44 + by], [bx, 41 + by], [bx + 7, 35 + by], 10.2, 13.8, '#590c18');
    p.bezierRibbon([bx - 8, 43 + by], [bx + 1, 40 + by], [bx + 7, 35 + by], 7.4, 10.6, '#d92b28');
    // 高昂炽金羽胸甲（叠层飞羽高光）
    p.poly(
      [
        [bx + 3, 31 + by],
        [bx + 13, 34 + by],
        [bx + 10, 44 + by],
        [bx + 1, 46 + by],
      ],
      '#eb8c1e',
    );
    p.hline(bx + 4, 34 + by, 7, '#ffe066');
    p.hline(bx + 4, 37 + by, 8, '#fff5a6', true);
    p.hline(bx + 3, 40 + by, 7, '#ffe066');
    p.hline(bx + 2, 43 + by, 5, '#f2a62e');

    // [5] 粗壮覆羽腿裤 + 屈膝收紧的雄健「黄金雷鹰钢爪」（彻底告别两根黄火柴！）
    p.setPart(SPRITE_PART.LEGS);
    const talonFwd = isAtk && (f === 1 || f === 2) ? 7 : isMove ? 3 : 0;
    const talonLift = isAtk && (f === 1 || f === 2) ? -6 : isMove ? -3 : 0;
    // 远侧后爪
    const flx = bx - 3 + Math.round(talonFwd * 0.6);
    const fly = Math.min(62, 55 + by + talonLift);
    p.poly([[bx - 6, 44 + by], [bx, 44 + by], [bx - 2, 50 + by], [bx - 7, 49 + by]], '#8f1820');
    p.bezierRibbon([bx - 4, 48 + by], [bx - 7, 52 + by + Math.round(talonLift * 0.5)], [flx, fly], 3.0, 2.2, '#b87618');
    p.line(flx, fly, flx + 5, fly + 2, '#f0ba38', 2);
    p.line(flx, fly, flx + 3, fly + 5, '#d99a24', 2);
    p.line(flx, fly, flx - 4, fly + 3, '#b87618', 2);
    p.px(flx + 5, fly + 2, '#ffffff');
    // 近侧主力黄金雷鹰巨爪
    const nlx = bx + 6 + talonFwd;
    const nly = Math.min(63, 56 + by + talonLift);
    p.poly([[bx + 1, 44 + by], [bx + 8, 44 + by], [bx + 7, 51 + by], [bx, 50 + by]], '#b82226');
    p.hline(bx + 2, 46 + by, 5, '#ff8f38');
    p.bezierRibbon([bx + 4, 49 + by], [bx + 2 + Math.round(talonFwd * 0.4), 53 + by + Math.round(talonLift * 0.5)], [nlx, nly], 3.6, 2.5, '#d4901c');
    p.bezierRibbon([bx + 5, 49 + by], [bx + 3 + Math.round(talonFwd * 0.4), 53 + by + Math.round(talonLift * 0.5)], [nlx, nly - 1], 1.6, 1.2, '#fff299');
    // 三前趾一后趾寒光钢钩利爪！
    p.line(nlx, nly, nlx + 6, nly - 1, '#ffe478', 2);
    p.line(nlx, nly, nlx + 7, nly + 3, '#ffd159', 2);
    p.line(nlx, nly + 1, nlx + 3, nly + 6, '#e6a82e', 2);
    p.line(nlx - 1, nly + 1, nlx - 5, nly + 4, '#d4901c', 2);
    p.px(nlx + 6, nly - 1, '#ffffff', true);
    p.px(nlx + 7, nly + 3, '#ffffff', true);
    p.px(nlx + 3, nly + 6, '#fff8cc', true);

    // [6] 优雅弧形猛禽羽颈 + 凌厉鹰王首 + 5 缕烈焰红金长冠羽 + 金属弯钩神喙（与上方右翼拉开清爽负空间！）
    const hx = bx + 13 + (isAtk && (f === 1 || f === 2) ? 2 : 0);
    const hy = 25 + by + (isAtk && f === 0 ? -1 : 0);
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.bezierRibbon([bx + 6, 35 + by], [bx + 7, 28 + by], [hx - 2, hy + 2], 7.4, 5.2, '#78121b');
    p.bezierRibbon([bx + 7, 34 + by], [bx + 8, 28 + by], [hx - 1, hy + 2], 4.8, 3.4, '#eb3d2b');
    p.bezierRibbon([bx + 9, 34 + by], [bx + 10, 29 + by], [hx + 1, hy + 3], 2.2, 1.6, '#ffbb38');

    // 5 缕后掠如火燃动的神禽赤金长冠羽（彻底告别呆板两根刺！）
    p.setPart(SPRITE_PART.HEADWEAR);
    p.bezierRibbon([hx - 2, hy - 4], [hx - 9, hy - 11], [hx - 16, Math.max(4, hy - 8)], 3.2, 0.8, '#b81c24');
    p.bezierRibbon([hx - 2, hy - 4], [hx - 9, hy - 11], [hx - 15, Math.max(4, hy - 8)], 1.4, 0.6, '#ffe066', true);
    p.bezierRibbon([hx + 1, hy - 5], [hx - 4, hy - 13], [hx - 11, Math.max(3, hy - 13)], 2.8, 0.7, '#e63926');
    p.bezierRibbon([hx + 1, hy - 5], [hx - 4, hy - 13], [hx - 10, Math.max(3, hy - 13)], 1.2, 0.5, '#fff5a6', true);
    p.bezierRibbon([hx - 4, hy - 1], [hx - 10, hy - 5], [hx - 14, hy - 2], 2.2, 0.7, '#ff7b29');

    // 凌厉猛禽鹰王头颅（清晰眼眉脊与颊羽）
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.poly(
      [
        [hx - 6, hy - 4],
        [hx + 2, hy - 6],
        [hx + 8, hy - 3],
        [hx + 7, hy + 4],
        [hx - 5, hy + 4],
      ],
      '#8c1520',
    );
    p.poly(
      [
        [hx - 5, hy - 3],
        [hx + 2, hy - 5],
        [hx + 7, hy - 2],
        [hx + 6, hy + 3],
        [hx - 4, hy + 3],
      ],
      '#f2442c',
    );
    p.hline(hx - 3, hy - 4, 6, '#ff9447');
    p.poly([[hx - 2, hy + 1], [hx + 5, hy + 1], [hx + 4, hy + 4], [hx - 3, hy + 3]], '#ffe078');

    // 锐利深弯金属「黄金神鹰钩喙」（带喙脊雪白高光与暗金张口）
    p.poly(
      [
        [hx + 6, hy - 3],
        [hx + 13, hy - 2],
        [hx + 16, hy + 2],
        [hx + 14, hy + 6],
        [hx + 11, hy + 2],
        [hx + 6, hy + 2],
      ],
      '#9e5e10',
    );
    p.poly(
      [
        [hx + 6, hy - 3],
        [hx + 12, hy - 2],
        [hx + 15, hy + 2],
        [hx + 13, hy + 5],
        [hx + 11, hy + 1],
        [hx + 6, hy + 1],
      ],
      '#ffcf40',
    );
    p.line(hx + 7, hy - 3, hx + 13, hy - 1, '#ffffff', 1);
    // 攻击咆哮微张下喙
    const beakDrop = isAtk ? 3 : 1;
    p.poly([[hx + 6, hy + 2], [hx + 11, hy + 2 + beakDrop], [hx + 6, hy + 4 + beakDrop]], '#b87618');

    // 锐利压眉骨下的冰青炽亮电光鹰眸！
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.line(hx - 1, hy - 3, hx + 6, hy - 2, '#3b0812', 2);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.hline(hx + 1, hy - 2, 4, '#4dd8ff', true);
    p.hline(hx + 2, hy - 2, 2, '#ffffff', true);

    // [7] 高级感 1px 纤细苍蓝跃动电丝（贴合翼尖与爪间，彻底告别粗蓝灯管！）
    const sparkOff = Math.round(Math.sin(phase * 2) * 2);
    drawFineLightning64(
      p,
      [
        [lwTip1X + 1, lwTip1Y + 1],
        [lwTip1X + 4, lwTip1Y + 7 + sparkOff],
        [lwTip2X + 1, lwTip2Y - 1],
        [lwTip3X + 2, lwTip3Y - 1],
      ],
      '#47d4ff',
      '#ffffff',
    );
    drawFineLightning64(
      p,
      [
        [rwTip1X - 1, rwTip1Y + 1],
        [rwTip2X - 2, rwTip2Y + sparkOff],
        [rwTip3X, rwTip3Y],
      ],
      '#5ce6ff',
      '#ffffff',
    );
    drawSparkStar64(p, lwTip1X + 1, Math.max(4, lwTip1Y - 1), 2, '#78ecff');
    drawSparkStar64(p, Math.min(59, rwTip1X), Math.max(4, rwTip1Y), 2, '#ffe878');

    // [8] 攻击演出：翼爪与神喙前聚蓄炽亮天雷核 → 苍穹劈下「赤雷天罚」锯齿苍蓝白核神雷（绝不遮脸零裁切！）
    if (isAtk && f === 0) {
      const orbX = Math.min(56, hx + 13);
      const orbY = hy + 9;
      drawHollowRing64(p, orbX, orbY, 5.4, 5.4, 0.72, '#24a8ff', '#8cf0ff', '#ffffff');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(orbX, orbY, 2.2, 2.2, '#ffffff', true);
      drawFineLightning64(p, [[nlx + 3, nly], [orbX - 2, orbY + 4], [orbX, orbY]], '#66e6ff', '#ffffff');
      drawFineLightning64(p, [[rwTip2X - 1, rwTip2Y + 1], [orbX + 1, orbY - 5], [orbX, orbY]], '#ffe878', '#ffffff');
    } else if (isAtk && (f === 1 || f === 2)) {
      p.setPart(SPRITE_PART.GLOW_FX);
      // 从苍穹 (56,4) 劈向下方目标 (56,64) 的炽烈苍蓝金白锯齿天雷！
      const boltPts: Array<[number, number]> = [
        [56, 4],
        [51, 16],
        [58, 26],
        [50, 39],
        [57, 51],
        [53, 64],
      ];
      for (let i = 0; i < boltPts.length - 1; i++) {
        p.line(boltPts[i][0], boltPts[i][1], boltPts[i + 1][0], boltPts[i + 1][1], '#24a8ff', 4, true);
        p.line(boltPts[i][0], boltPts[i][1], boltPts[i + 1][0], boltPts[i + 1][1], '#9cf4ff', 2, true);
        p.line(boltPts[i][0], boltPts[i][1], boltPts[i + 1][0], boltPts[i + 1][1], '#ffffff', 1, true);
      }
      // 鹰喙/鹰爪牵引天雷分支
      drawFineLightning64(p, [[hx + 14, hy + 2], [46, hy + 8], [52, 26]], '#ffe878', '#ffffff');
      drawFineLightning64(p, [[nlx + 5, nly + 1], [44, nly - 2], [53, 45]], '#78ecff', '#ffffff');
      drawSparkStar64(p, 53, 62, 3, '#78ecff');
      drawSparkStar64(p, 56, 10, 2, '#ffe878');
    }
  },
};

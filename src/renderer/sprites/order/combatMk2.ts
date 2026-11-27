/**
 * 秩序阵营 T3-B 兵种：战斗 II 型（creature_combat_mk2）HD 像素绘谱。
 */

import {
  drawSlashArc64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { HD_BASE } from './helpers';

/**
 * 8. 战斗 II 型（秩序 T3-B · 1×2 高挑机身！）：
 *    河童重工六臂阿修罗武士机甲 — 3/4 英雄外八跨步站姿、钛白×河童翠青×枪灰骨架×黄铜铆钉、
 *    河童发光水碟高达头雕、清晰弯肘机械关节挂载 4 副臂 + 2 主臂共 6 柄锐利尖锋等离子光刃！
 */
export const combatMk2RigSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#081b26',
  backdropBottom: '#133747',
  backdropGlow: '#4df5d0',
  avatarCrop: { x: 14, y: 2, size: 36 },
  portraitCrop: { x: 2, y: 1, w: 60, h: 69 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const bx = isAtk && (f === 1 || f === 2) ? 25 : Math.round(31 + pose.leanX * 0.7);
    const by = Math.round(pose.breathY * 0.9 - pose.stepLift * 0.8);
    const stride = Math.round(pose.stride * 3.2);
    const headY = 18 + by;

    // 辅助函数：绘制一柄锐利收尖的高频翠蓝等离子光刃（彻底告别钝头棒！）
    const drawPlasmaBlade = (
      hx: number,
      hy: number,
      tx: number,
      ty: number,
      halfW = 1.6,
    ) => {
      p.setPart(SPRITE_PART.WEAPON);
      const dx = tx - hx;
      const dy = ty - hy;
      const len = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;
      // 枪灰金箍剑柄 + 护手
      p.line(hx - ux * 3, hy - uy * 3, hx + ux * 2, hy + uy * 2, '#344454', 2);
      p.line(hx + ux * 2 - nx * 2, hy + uy * 2 - ny * 2, hx + ux * 2 + nx * 2, hy + uy * 2 + ny * 2, '#ffd966', 1);
      // 锋利菱尖等离子刃体（先画翠青外焰多边形，再画纯白锐利芯刃！）
      p.setPart(SPRITE_PART.GLOW_FX);
      const baseX = hx + ux * 2.5;
      const baseY = hy + uy * 2.5;
      const midX = hx + ux * (len * 0.72);
      const midY = hy + uy * (len * 0.72);
      p.poly(
        [
          [baseX + nx * halfW, baseY + ny * halfW],
          [midX + nx * (halfW * 0.85), midY + ny * (halfW * 0.85)],
          [tx, ty],
          [midX - nx * (halfW * 0.85), midY - ny * (halfW * 0.85)],
          [baseX - nx * halfW, baseY - ny * halfW],
        ],
        '#18c2ab',
        true,
      );
      p.line(baseX + ux, baseY + uy, tx, ty, '#8cfff2', 1, true);
      p.line(baseX + ux * 2, baseY + uy * 2, midX, midY, '#ffffff', 1, true);
    };

    // [1] 背部双联阿修罗副机械臂挂载架（4 条分明弯肘副臂 + 4 柄高频尖刃）
    p.setPart(SPRITE_PART.BACK_ACC);
    p.poly([[bx - 10, 24 + by], [bx + 10, 24 + by], [bx + 8, 35 + by], [bx - 8, 35 + by]], '#304052');
    p.hline(bx - 9, 25 + by, 18, '#289e8c');
    p.px(bx - 7, 27 + by, '#ffe078');
    p.px(bx + 6, 27 + by, '#ffe078');

    // 副臂 1（左上高举臂）
    const sub1ElbowX = bx - 16;
    const sub1ElbowY = 21 + by;
    const sub1HandX = isAtk && f === 1 ? bx - 5 : bx - 18;
    const sub1HandY = isAtk && f === 1 ? 12 + by : 14 + by;
    p.line(bx - 8, 26 + by, sub1ElbowX, sub1ElbowY, '#495a6e', 3);
    p.line(sub1ElbowX, sub1ElbowY, sub1HandX, sub1HandY, '#c9d8e6', 3);
    p.ellipse(sub1ElbowX, sub1ElbowY, 2.2, 2.2, '#d9a844');
    drawPlasmaBlade(
      sub1HandX,
      sub1HandY,
      isAtk && f === 1 ? bx + 15 : bx - 25,
      isAtk && f === 1 ? 9 + by : 5 + by,
      1.7,
    );

    // 副臂 2（左中平展臂）
    p.setPart(SPRITE_PART.BACK_ACC);
    const sub2ElbowX = bx - 17;
    const sub2ElbowY = 34 + by;
    const sub2HandX = isAtk && f === 1 ? bx - 11 : bx - 21;
    const sub2HandY = 37 + by;
    p.line(bx - 8, 31 + by, sub2ElbowX, sub2ElbowY, '#495a6e', 3);
    p.line(sub2ElbowX, sub2ElbowY, sub2HandX, sub2HandY, '#c9d8e6', 3);
    p.ellipse(sub2ElbowX, sub2ElbowY, 2.0, 2.0, '#d9a844');
    drawPlasmaBlade(
      sub2HandX,
      sub2HandY,
      isAtk && f === 1 ? bx - 22 : bx - 27,
      isAtk && f === 1 ? 25 + by : 27 + by,
      1.6,
    );

    // 副臂 3（右上高举臂）
    p.setPart(SPRITE_PART.BACK_ACC);
    const sub3ElbowX = bx + 15;
    const sub3ElbowY = 21 + by;
    const sub3HandX = isAtk && f === 1 ? bx + 20 : bx + 17;
    const sub3HandY = isAtk && f === 1 ? 15 + by : 13 + by;
    p.line(bx + 8, 26 + by, sub3ElbowX, sub3ElbowY, '#495a6e', 3);
    p.line(sub3ElbowX, sub3ElbowY, sub3HandX, sub3HandY, '#e3eef7', 3);
    p.ellipse(sub3ElbowX, sub3ElbowY, 2.2, 2.2, '#ffd966');
    drawPlasmaBlade(
      sub3HandX,
      sub3HandY,
      isAtk && f === 1 ? Math.min(59, bx + 32) : bx + 26,
      isAtk && f === 1 ? 19 + by : 5 + by,
      1.7,
    );

    // 副臂 4（右中前袭臂）
    p.setPart(SPRITE_PART.BACK_ACC);
    const sub4ElbowX = bx + 15;
    const sub4ElbowY = 34 + by;
    const sub4HandX = isAtk && f === 1 ? bx + 21 : bx + 19;
    const sub4HandY = isAtk && f === 1 ? 31 + by : 36 + by;
    p.line(bx + 8, 31 + by, sub4ElbowX, sub4ElbowY, '#495a6e', 3);
    p.line(sub4ElbowX, sub4ElbowY, sub4HandX, sub4HandY, '#e3eef7', 3);
    p.ellipse(sub4ElbowX, sub4ElbowY, 2.0, 2.0, '#ffd966');
    drawPlasmaBlade(
      sub4HandX,
      sub4HandY,
      isAtk && f === 1 ? Math.min(59, bx + 33) : Math.min(58, bx + 28),
      isAtk && f === 1 ? 27 + by : 25 + by,
      1.6,
    );

    // [2] 超帅 3/4 英雄外八跨步机动长腿（彻底告别立正军姿！外斜撑地 + 尖锐翠青护膝与侧喷翼！）
    p.setPart(SPRITE_PART.LEGS);
    const lLift = pose.stride > 0.3 ? -2 : 0;
    const rLift = pose.stride < -0.3 ? -2 : 0;
    // 后撤外斜左机械长腿
    p.poly(
      [
        [bx - 8 - stride, 43 + lLift],
        [bx - 2 - stride, 43 + lLift],
        [bx - 7 - stride, 62 + lLift],
        [bx - 14 - stride, 62 + lLift],
      ],
      '#44566b',
    );
    p.poly(
      [
        [bx - 7 - stride, 44 + lLift],
        [bx - 3 - stride, 44 + lLift],
        [bx - 8 - stride, 60 + lLift],
        [bx - 13 - stride, 60 + lLift],
      ],
      '#bdcee0',
    );
    // 尖锐左翠青护膝与外侧机翼鳍
    p.poly([[bx - 11 - stride, 49 + lLift], [bx - 4 - stride, 48 + lLift], [bx - 6 - stride, 54 + lLift], [bx - 11 - stride, 53 + lLift]], '#1f9682');
    p.hline(bx - 10 - stride, 49 + lLift, 5, '#78ffe8');
    p.poly([[bx - 16 - stride, 61 + lLift], [bx - 5 - stride, 61 + lLift], [bx - 4 - stride, 66 + lLift], [bx - 17 - stride, 66 + lLift]], '#2c3a4a');
    p.hline(bx - 15 - stride, 62 + lLift, 10, '#2ec2a8');

    // 前跨霸气外八右机械长腿（受光高亮钛白 + 侧喷装甲鳍！）
    p.poly(
      [
        [bx + 2 + stride, 43 + rLift],
        [bx + 8 + stride, 43 + rLift],
        [bx + 15 + stride, 63 + rLift],
        [bx + 7 + stride, 63 + rLift],
      ],
      '#536780',
    );
    p.poly(
      [
        [bx + 3 + stride, 44 + rLift],
        [bx + 7 + stride, 44 + rLift],
        [bx + 13 + stride, 61 + rLift],
        [bx + 8 + stride, 61 + rLift],
      ],
      '#edf6ff',
    );
    // 右小腿外侧机动装甲鳍
    p.poly([[bx + 11 + stride, 52 + rLift], [bx + 16 + stride, 55 + rLift], [bx + 14 + stride, 60 + rLift]], '#24a68e');
    p.poly([[bx + 4 + stride, 48 + rLift], [bx + 11 + stride, 49 + rLift], [bx + 11 + stride, 54 + rLift], [bx + 6 + stride, 54 + rLift]], '#2ac4a8');
    p.hline(bx + 5 + stride, 49 + rLift, 5, '#c4fff5');
    p.poly([[bx + 6 + stride, 62 + rLift], [bx + 17 + stride, 62 + rLift], [bx + 19 + stride, 67 + rLift], [bx + 6 + stride, 67 + rLift]], '#35485e');
    p.hline(bx + 7 + stride, 63 + rLift, 10, '#78ffea');

    // [3] 精悍机械收腰 + 分体机动前裙甲 + 倒三角钛白翠青胸甲 + 河童水力核炉！
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.rect(bx - 6, 37 + by, 12, 6, '#303f52'); // 机械收腰骨架
    p.poly([[bx - 10, 40 + by], [bx - 3, 40 + by], [bx - 5, 47 + by], [bx - 12, 46 + by]], '#d2e1f0');
    p.poly([[bx + 3, 40 + by], [bx + 10, 40 + by], [bx + 12, 46 + by], [bx + 5, 47 + by]], '#ffffff');
    p.rect(bx - 2, 39 + by, 5, 8, '#229c87');
    p.hline(bx - 2, 39 + by, 5, '#ffe078');

    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 11, 24 + by], [bx + 11, 24 + by], [bx + 7, 38 + by], [bx - 7, 38 + by]], '#35475c');
    p.poly([[bx - 10, 25 + by], [bx + 10, 25 + by], [bx + 6, 37 + by], [bx - 6, 37 + by]], '#e6f2fc');
    p.poly([[bx - 9, 25 + by], [bx + 9, 25 + by], [bx + 5, 29 + by], [bx - 5, 29 + by]], '#ffffff');
    // 河童重工斜切翠青胸肋装甲与金饰
    p.poly([[bx - 9, 28 + by], [bx - 3, 30 + by], [bx - 4, 36 + by], [bx - 7, 34 + by]], '#229c87');
    p.poly([[bx + 9, 28 + by], [bx + 3, 30 + by], [bx + 4, 36 + by], [bx + 7, 34 + by]], '#2ec4a8');
    p.hline(bx - 10, 25 + by, 20, '#ffd966');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx, 31 + by, 3.2, 3.0, '#147a73');
    p.ellipse(bx, 31 + by, 2.3, 2.1, '#4dfce8', true);
    p.px(bx, 30 + by, '#ffffff', true);

    // [4] 帅气「河童发光水碟 × 武士高达双角天线」头雕！
    p.setPart(SPRITE_PART.HEADWEAR);
    p.poly([[bx - 6, headY - 4], [bx + 6, headY - 4], [bx + 5, headY + 4], [bx, headY + 6], [bx - 5, headY + 4]], '#394b5e');
    p.poly([[bx - 5, headY - 3], [bx + 5, headY - 3], [bx + 4, headY + 3], [bx, headY + 5], [bx - 4, headY + 3]], '#eef6ff');
    p.ellipse(bx, headY - 4, 5.2, 2.2, '#ffd966');
    p.ellipse(bx, headY - 4, 3.8, 1.4, '#4dfce8', true);
    p.hline(bx - 2, headY - 4, 4, '#ffffff', true);
    p.line(bx, headY - 3, bx - 7, headY - 9, '#ffd966', 2);
    p.line(bx, headY - 3, bx + 7, headY - 9, '#ffe885', 2);
    p.px(bx - 7, headY - 9, '#ffffff', true);
    p.px(bx + 7, headY - 9, '#ffffff', true);
    p.rect(bx - 4, headY - 1, 8, 3, '#101c26');
    p.hline(bx - 3, headY, 6, '#4dfce8', true);
    p.px(bx + 1, headY, '#ffffff', true);
    p.hline(bx - 2, headY + 3, 4, '#24a68e');

    // [5] 2 条粗壮主机械臂（外翘斜切翠青大肩甲 + 2 柄锋锐主光刃！）
    p.setPart(SPRITE_PART.BACK_ARM);
    p.poly([[bx - 15, 22 + by], [bx - 8, 24 + by], [bx - 8, 31 + by], [bx - 14, 30 + by]], '#229c87');
    p.hline(bx - 15, 23 + by, 7, '#ffe078');
    const lMainHandX = isAtk && f === 1 ? bx - 5 : bx - 15;
    const lMainHandY = isAtk && f === 1 ? 43 + by : 44 + by;
    p.line(bx - 11, 29 + by, lMainHandX, lMainHandY, '#667a8f', 3);
    p.ellipse(lMainHandX, lMainHandY, 2.3, 2.3, '#dce8f5');
    drawPlasmaBlade(
      lMainHandX,
      lMainHandY,
      isAtk && f === 1 ? bx + 13 : bx - 23,
      isAtk && f === 1 ? 47 + by : 52 + by,
      1.8,
    );

    p.setPart(SPRITE_PART.FRONT_ARM);
    p.poly([[bx + 8, 24 + by], [bx + 16, 22 + by], [bx + 15, 30 + by], [bx + 8, 31 + by]], '#2ec4a8');
    p.hline(bx + 8, 23 + by, 8, '#ffe885');
    const rMainHandX = isAtk && f === 0 ? bx + 11 : isAtk && (f === 1 || f === 2) ? bx + 18 : bx + 15;
    const rMainHandY = isAtk && f === 0 ? 33 + by : isAtk && (f === 1 || f === 2) ? 40 + by : 42 + by;
    p.line(bx + 11, 29 + by, rMainHandX, rMainHandY, '#9eb3c9', 4);
    p.line(bx + 11, 28 + by, rMainHandX, rMainHandY - 1, '#ffffff', 1);
    p.ellipse(rMainHandX, rMainHandY, 2.5, 2.5, '#eef6ff');
    drawPlasmaBlade(
      rMainHandX,
      rMainHandY,
      isAtk && f === 0 ? bx + 20 : isAtk && (f === 1 || f === 2) ? Math.min(60, bx + 33) : Math.min(58, bx + 27),
      isAtk && f === 0 ? 20 + by : isAtk && (f === 1 || f === 2) ? 45 + by : 47 + by,
      2.1,
    );

    // [6] 攻击爆发：六刃齐斩无反击高频翠白光网（100% 完整在画幅内零裁切！）
    if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, bx + 17, 30 + by, 14, 18, -1.25, 1.1, '#19bfa8', '#78fff0', '#ffffff');
      drawSlashArc64(p, bx + 21, 38 + by, 11, 12, -0.9, 1.05, '#ffe478', '#b8fff5', '#ffffff');
    }
  },
};

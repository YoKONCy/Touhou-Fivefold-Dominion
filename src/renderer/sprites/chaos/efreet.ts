/**
 * 7. 法界之火（混沌 T3-B · 1×2 飞行元素）
 * 炽橙红紫魔界炎灵真躯 + 燃羽流焰双翼 + 镂空八芒法轮 + 护身 3D 魔火环 + 威严炎冠首。
 */

import { SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawHollowRing64, drawSparkStar64, HD_BASE } from './helpers';

/** 法界之火（creature_efreet）HD 像素绘谱 */
export const CREATURE_EFREET_RIG_SPEC: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#160521',
  backdropBottom: '#420d26',
  backdropGlow: '#ff6640',
  avatarCrop: { x: 14, y: 4, size: 36 },
  portraitCrop: { x: 2, y: 2, w: 60, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const sway = Math.sin(phase) * 2.5;
    const sway2 = Math.cos(phase) * 2.0;

    const bx = isAtk && (f === 1 || f === 2) ? 25 : Math.round(32 + pose.leanX * 0.85);
    const by = Math.round(pose.breathY * 1.3 - pose.stepLift * 1.0) + (isMove ? -2 : 0);
    const lean = isMove ? 4 : isAtk && f === 1 ? 5 : isHit ? -4 : 0;

    // [1] 足底真·镂空旋转「魔界金红法阵环」
    p.setPart(SPRITE_PART.BACK_ACC);
    drawHollowRing64(p, bx, 64, 16, 3.0, 0.72, '#801763', '#f03b5e', '#ffe878', true);

    // [2] 背后尊贵真·镂空「黄金魔界八芒法轮」
    const haloY = 23 + by;
    const hr = isAtk && f <= 1 ? 15 : 13;
    const hr2 = Math.round(hr * 0.72);
    p.line(bx, haloY - hr, bx + hr, haloY, '#e6a62e', 1, true);
    p.line(bx + hr, haloY, bx, haloY + hr, '#e6a62e', 1, true);
    p.line(bx, haloY + hr, bx - hr, haloY, '#e6a62e', 1, true);
    p.line(bx - hr, haloY, bx, haloY - hr, '#e6a62e', 1, true);
    p.hline(bx - hr2, haloY - hr2, hr2 * 2 + 1, '#c92e85', true);
    p.hline(bx - hr2, haloY + hr2, hr2 * 2 + 1, '#c92e85', true);
    p.vline(bx - hr2, haloY - hr2, hr2 * 2 + 1, '#c92e85', true);
    p.vline(bx + hr2, haloY - hr2, hr2 * 2 + 1, '#c92e85', true);
    drawSparkStar64(p, bx, haloY - hr, 2, '#ffe878');

    // [3] 后景 3D 环绕「法界烈焰护盾」4 枚魔火球
    for (let i = 0; i < 4; i++) {
      const a = phase + (i * Math.PI * 2) / 4;
      if (Math.sin(a) < 0) {
        const ox = Math.max(4, Math.min(60, Math.round(bx + Math.cos(a) * 21)));
        const oy = Math.round(39 + by + Math.sin(a) * 6.5 - Math.cos(a) * 3.5);
        p.setPart(SPRITE_PART.BACK_ACC);
        p.ellipse(ox, oy, 2.6, 3.4, '#d9245e', true);
        p.ellipse(ox, oy - 0.5, 1.4, 1.8, '#ffe878', true);
      }
    }

    // [4] 有机飘逸三羽分叉「法界炽焰流羽火翼」（告别僵硬粉红冲浪板，真正熊熊燃烧的灵火羽翼！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const wingFlap = isMove ? [-6, 5, 1, -4][f % 4] : Math.round(Math.sin(phase) * 2.8);
    const drawFireWing = (dir: -1 | 1, reachScale: number) => {
      const sx = bx + dir * 6;
      const sy = 30 + by;
      // 上羽主炎舌
      const t1x = Math.max(3, Math.min(60, Math.round(bx + dir * 23 * reachScale - lean * 0.4)));
      const t1y = Math.max(6, 13 + by + wingFlap * (dir === -1 ? 1 : -1));
      p.bezierRibbon([sx, sy], [Math.round((sx + t1x) * 0.5), sy - 10], [t1x, t1y], 5.2, 1.0, '#8f1266', true);
      p.bezierRibbon([sx, sy], [Math.round((sx + t1x) * 0.5), sy - 9], [t1x, t1y + 1], 3.2, 0.7, '#ff3d33', true);
      p.bezierRibbon([sx + dir, sy], [Math.round((sx + t1x) * 0.5), sy - 7], [t1x - dir * 2, t1y + 3], 1.5, 0.5, '#ffe873', true);
      // 中羽副炎舌
      const t2x = Math.max(4, Math.min(59, Math.round(bx + dir * 21 * reachScale - lean * 0.3)));
      const t2y = Math.min(40, 23 + by + Math.round(wingFlap * 0.6 * (dir === -1 ? 1 : -1)));
      p.bezierRibbon([sx, sy + 3], [Math.round((sx + t2x) * 0.55), sy - 1], [t2x, t2y], 4.2, 0.9, '#b5186b', true);
      p.bezierRibbon([sx, sy + 3], [Math.round((sx + t2x) * 0.55), sy], [t2x - dir, t2y], 2.2, 0.6, '#ff8026', true);
      // 下羽短炎舌
      const t3x = Math.max(6, Math.min(57, Math.round(bx + dir * 16 * reachScale)));
      const t3y = 33 + by + Math.round(wingFlap * 0.3);
      p.bezierRibbon([sx, sy + 6], [Math.round((sx + t3x) * 0.5), sy + 6], [t3x, t3y], 3.2, 0.8, '#d9266e', true);
      p.px(t1x, t1y, '#ffffff', true);
    };
    drawFireWing(-1, 1.0);
    drawFireWing(1, isAtk && (f === 1 || f === 2) ? 0.78 : 0.95);

    // [5] 优雅高挑「魔界炎灵真躯」（宽阔炽焰肩胸 + 柔韧 S 形盘旋火尾龙卷 + 鎏金束腰魔环！）
    p.setPart(SPRITE_PART.TORSO);
    const tailX = Math.round(bx - lean * 1.7 + sway);
    // 盘旋向上的炎灵旋风尾（S曲线自然收尖，附带暗紫金旋转气流带！）
    p.bezierRibbon([tailX, 61 + by], [bx - 6 - lean * 0.5, 51 + by], [bx + 1, 41 + by], 2.6, 11.5, '#6b0f5e');
    p.bezierRibbon([tailX, 60 + by], [bx - 5 - lean * 0.4, 50 + by], [bx + 1, 40 + by], 1.8, 8.6, '#e6244f', true);
    p.bezierRibbon([tailX + 1, 57 + by], [bx - 3 - lean * 0.3, 49 + by], [bx + 1, 40 + by], 1.2, 5.2, '#ff8524', true);
    p.bezierRibbon([tailX + 1, 53 + by], [bx - 1, 46 + by], [bx, 37 + by], 0.9, 2.6, '#fff299', true);

    // 宽阔挺拔的炎灵胸肩（雕塑感倒三角，彻底告别圆萝卜！）
    p.poly([[bx - 11, 29 + by], [bx + 11, 29 + by], [bx + 6, 41 + by], [bx - 6, 41 + by]], '#7a115e');
    p.poly([[bx - 9, 29 + by], [bx + 9, 29 + by], [bx + 5, 40 + by], [bx - 5, 40 + by]], '#eb2a52', true);
    p.poly([[bx - 6, 30 + by], [bx + 6, 30 + by], [bx + 3, 39 + by], [bx - 3, 39 + by]], '#ff9126', true);
    p.poly([[bx - 3, 31 + by], [bx + 3, 31 + by], [bx + 1, 38 + by], [bx - 1, 38 + by]], '#fff8bf', true);

    // 胸腰环绕的暗金魔界星环与黑曜肩饰
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.bezierRibbon([bx - 7, 42 + by], [bx, 45 + by], [bx + 7, 41 + by], 2.0, 1.8, '#e6a82e', true);
    p.bezierRibbon([bx - 5, 50 + by], [bx, 52 + by], [bx + 5, 48 + by], 1.5, 1.3, '#ffe478', true);
    p.rect(bx - 11, 28 + by, 4, 4, '#240933');
    p.hline(bx - 11, 28 + by, 4, '#ffe478');
    p.rect(bx + 7, 28 + by, 4, 4, '#240933');
    p.hline(bx + 7, 28 + by, 4, '#ffe478');

    // 优雅跃动的炎灵双臂（左臂聚焰护体，右臂扬起引动业火！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    p.bezierRibbon([bx - 9, 31 + by], [bx - 14, 36 + by], [bx - 11, 41 + by], 3.2, 1.4, '#ff4d33', true);
    p.px(bx - 11, 41 + by, '#fff8cc', true);
    const rArmEndX = isAtk && (f === 1 || f === 2) ? bx + 15 : bx + 12;
    const rArmEndY = isAtk && (f === 1 || f === 2) ? 33 + by : 39 + by - Math.round(pose.armAction * 3);
    p.bezierRibbon([bx + 9, 31 + by], [bx + 13, 35 + by], [rArmEndX, rArmEndY], 3.2, 1.5, '#ff6629', true);
    p.px(rArmEndX, rArmEndY, '#ffffff', true);

    // [6] 威严修长「魔界炎冠头雕 + 升腾三股烈焰长冠 + 犀利细长炽金灵瞳！」（告别大黄三角虫眼！）
    const hy = 20 + by;
    p.setPart(SPRITE_PART.HEADWEAR);
    const topPeakY = Math.max(4, hy - (isAtk && f <= 1 ? 16 : 14));
    // 跃动赤金神焰长发冠
    p.poly(
      [
        [bx - 7, hy + 4],
        [bx - 9 + Math.round(sway), hy - 5],
        [bx - 4 + Math.round(sway2), hy - 12],
        [bx - 1, hy - 7],
        [bx + 1 - Math.round(sway), topPeakY],
        [bx + 4, hy - 7],
        [bx + 8 + Math.round(sway2), hy - 10],
        [bx + 7, hy + 4],
      ],
      '#d91c5c',
      true,
    );
    p.poly(
      [
        [bx - 4, hy + 2],
        [bx - 2 + Math.round(sway2), hy - 9],
        [bx + 1 - Math.round(sway), topPeakY + 3],
        [bx + 4, hy + 2],
      ],
      '#ff8c24',
      true,
    );
    p.line(bx, hy - 1, Math.round(bx + 1 - sway), topPeakY + 4, '#fff8cc', 2, true);

    // 凌厉优雅的暗紫黑曜假面头颅 + 弯角黄金炎冠
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.poly([[bx, hy - 5], [bx + 6, hy - 1], [bx + 4, hy + 6], [bx, hy + 8], [bx - 4, hy + 6], [bx - 6, hy - 1]], '#1a0629');
    // 精致鎏金双角头饰
    p.setPart(SPRITE_PART.HEADWEAR);
    p.bezierRibbon([bx - 5, hy - 2], [bx - 8, hy - 6], [bx - 6, hy - 9], 1.8, 0.7, '#ffe466', true);
    p.bezierRibbon([bx + 5, hy - 2], [bx + 8, hy - 6], [bx + 6, hy - 9], 1.8, 0.7, '#ffe466', true);
    p.px(bx, hy - 4, '#ffffff', true);
    // 犀利狭长斜飞炽金神目（仅 3×1 锐利细眼，霸气冷峻！）
    p.setPart(SPRITE_PART.FACE_FEATURES);
    if (isHit) {
      p.hline(bx - 4, hy + 1, 3, '#d98aff');
      p.hline(bx + 2, hy + 1, 3, '#d98aff');
    } else {
      p.line(bx - 4, hy, bx - 2, hy + 1, '#ffbf24', 1, true);
      p.px(bx - 2, hy + 1, '#ffffff', true);
      p.line(bx + 4, hy, bx + 2, hy + 1, '#ffbf24', 1, true);
      p.px(bx + 2, hy + 1, '#ffffff', true);
    }

    // [7] 攻击爆发：十字业火聚核 → 三股盘旋赤金紫焰「法界火蛇」前扑轰击！
    if (isAtk && f === 0) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx, 34 + by, 5.4, 5.4, '#ff3b5c', true);
      p.ellipse(bx, 34 + by, 2.8, 2.8, '#fff7cc', true);
      p.hline(bx - 10, 34 + by, 21, '#ffe878', true);
      p.vline(bx, 24 + by, 21, '#ffe878', true);
      p.px(bx, 34 + by, '#ffffff', true);
    } else if (isAtk && f === 1) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.bezierRibbon([bx + 11, 30 + by], [bx + 23, 21 + by], [60, 26 + by], 3.8, 1.2, '#e6245e', true);
      p.bezierRibbon([bx + 12, 30 + by], [bx + 23, 22 + by], [59, 26 + by], 1.6, 0.6, '#ffbd45', true);
      p.bezierRibbon([bx + 11, 34 + by], [bx + 25, 33 + by], [61, 33 + by], 4.6, 1.4, '#ff4d33', true);
      p.bezierRibbon([bx + 12, 34 + by], [bx + 25, 33 + by], [60, 33 + by], 2.2, 0.8, '#fff6bd', true);
      p.hline(bx + 14, 33 + by, Math.max(2, 58 - (bx + 14)), '#ffffff', true);
      p.bezierRibbon([bx + 11, 38 + by], [bx + 24, 45 + by], [60, 40 + by], 3.6, 1.2, '#c71f78', true);
      p.bezierRibbon([bx + 12, 38 + by], [bx + 24, 44 + by], [59, 40 + by], 1.5, 0.6, '#ffe466', true);
      drawSparkStar64(p, 59, 24 + by, 2, '#ffffff');
      drawSparkStar64(p, 59, 42 + by, 2, '#ffe878');
    } else if (isAtk && f === 2) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.bezierRibbon([bx + 15, 25 + by], [bx + 27, 27 + by], [60, 30 + by], 2.4, 0.8, '#ff664d', true);
      p.bezierRibbon([bx + 16, 33 + by], [bx + 28, 33 + by], [61, 33 + by], 2.6, 0.8, '#ffe878', true);
      p.bezierRibbon([bx + 15, 41 + by], [bx + 27, 39 + by], [59, 36 + by], 2.0, 0.6, '#e6338f', true);
      drawSparkStar64(p, 59, 33 + by, 2, '#ffffff');
    }

    // [8] 前景 3D 环绕「法界烈焰护盾」4 枚魔火球
    for (let i = 0; i < 4; i++) {
      const a = phase + (i * Math.PI * 2) / 4;
      if (Math.sin(a) >= 0) {
        const ox = Math.max(4, Math.min(60, Math.round(bx + Math.cos(a) * 21)));
        const oy = Math.round(39 + by + Math.sin(a) * 6.5 - Math.cos(a) * 3.5);
        p.setPart(SPRITE_PART.GLOW_FX);
        p.ellipse(ox, oy, 2.8, 3.6, '#ff4538', true);
        p.ellipse(ox, oy - 0.6, 1.6, 2.2, '#ffe878', true);
        p.px(ox, oy - 1, '#ffffff', true);
      }
    }
  },
};

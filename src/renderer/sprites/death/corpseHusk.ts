/**
 * 1. 尸壳（T1-A · 骸骨体质：正统苍白镂空骷髅剑盾武士 + 破损暗紫披风 + 冥火眼窝）
 */

import { drawSlashArc64, SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { HD_BASE } from './helpers';

export const corpseHuskSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#121024',
  backdropBottom: '#231f42',
  backdropGlow: '#52ffe8',
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const bx = isAtk && (f === 1 || f === 2) ? 28 : Math.round(31 + pose.leanX * 0.9);
    const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.2);
    const sway = pose.flutter * 1.8;
    const stride = Math.round(pose.stride * 4.2);
    const headY = 20 + by;

    // [1] 破损飘扬的暗紫残破披风 + 高耸立领（衬托苍白骷髅头！）
    p.setPart(SPRITE_PART.BACK_ACC);
    p.poly(
      [
        [bx - 8, 26 + by],
        [bx + 7, 26 + by],
        [bx + 9 - sway * 0.4, 49 + by],
        [bx + 3 - sway * 0.3, 52 + by],
        [bx - 2 + sway * 0.4, 48 + by],
        [bx - 9 + sway * 0.8, 54 + by],
        [bx - 16 + sway, 46 + by],
        [bx - 13 + sway * 0.6, 34 + by],
      ],
      '#291f45',
    );
    p.poly(
      [
        [bx - 7, 27 + by],
        [bx + 5, 27 + by],
        [bx - 4 + sway * 0.5, 48 + by],
        [bx - 13 + sway * 0.8, 44 + by],
      ],
      '#463670',
    );
    // 颈后翻起的破损暗紫高领
    p.poly([[bx - 9, 24 + by], [bx - 4, 28 + by], [bx + 5, 28 + by], [bx + 8, 24 + by], [bx + 6, 31 + by], [bx - 7, 31 + by]], '#392a5e');
    p.line(bx - 9, 24 + by, bx - 4, 28 + by, '#7b62ba', 1);
    p.line(bx + 8, 24 + by, bx + 5, 28 + by, '#7b62ba', 1);
    p.bezierRibbon([bx - 11, 33 + by], [bx - 14 + sway * 0.6, 41 + by], [bx - 15 + sway, 47 + by], 2.0, 1.0, '#6a539e');

    // [2] 清晰 3/4 错步白骨下肢与冥铁护胫
    p.setPart(SPRITE_PART.LEGS);
    const backLift = pose.stride > 0.25 ? -2 : 0;
    const frontLift = pose.stride < -0.25 ? -2 : 0;
    const drawBoneLeg = (lx: number, fy: number, lift: number, front: boolean) => {
      const boneCol = front ? '#eef3fa' : '#b8c3d9';
      const jointCol = front ? '#ffffff' : '#d5dff0';
      const topY = 47 + by + lift;
      const botY = fy + lift;
      p.line(lx, topY, lx + 1, topY + 7, boneCol, 2);
      p.ellipse(lx + 1, topY + 7, 2.0, 1.6, jointCol); // 膝关节
      p.line(lx + 1, topY + 8, lx, botY - 3, boneCol, 2);
      // 残破铁靴/骨爪脚
      p.rect(lx - 1, botY - 3, 6, 3, '#3c4563');
      p.hline(lx, botY - 3, 4, front ? '#7c8db8' : '#566487');
    };
    drawBoneLeg(bx - 5 - stride, 63, backLift, false);
    drawBoneLeg(bx + 4 + stride, 65, frontLift, true);

    // [3] 镂空燃魂白骨胸腔（暗腔脊椎 → 内燃幽青魂火 → 4 对雪白弧肋跨过魂火前层！）
    p.setPart(SPRITE_PART.TORSO);
    // 暗幽骨盆与腰带
    p.poly([[bx - 6, 44 + by], [bx + 6, 44 + by], [bx + 5, 48 + by], [bx - 5, 48 + by]], '#353e59');
    p.hline(bx - 6, 44 + by, 12, '#6c7ba3');
    p.rect(bx - 1, 44 + by, 3, 3, '#c9d6ed'); // 骨盆扣
    // 胸腔深暗内腔底 + 脊椎骨节
    p.ellipse(bx, 37 + by, 6.4, 7.0, '#141124');
    p.vline(bx, 30 + by, 14, '#7d8bad');
    p.px(bx, 32 + by, '#cfdcf0');
    p.px(bx, 35 + by, '#cfdcf0');
    p.px(bx, 38 + by, '#cfdcf0');
    p.px(bx, 41 + by, '#cfdcf0');
    // 胸腔深处内燃幽青魂火（置于肋骨之内，透出幽光！）
    p.ellipse(bx, 36 + by, 3.0, 3.6, '#15b8ab', true);
    p.ellipse(bx + 0.5, 35.5 + by, 1.8, 2.2, '#80fff2', true);
    p.px(bx + 1, 35 + by, '#ffffff', true);
    // 4 对立体雪白弧形肋骨跨过魂火前方 + 锁骨肩甲！
    p.hline(bx - 7, 30 + by, 15, '#e8eef7');
    p.hline(bx - 6, 31 + by, 13, '#aab7d4');
    for (let r = 0; r < 4; r++) {
      const ry = 33 + r * 3 + by;
      const w = r === 3 ? 5 : 6;
      p.hline(bx - w, ry, w - 1, '#ced9ed');
      p.hline(bx - w + 1, ry, Math.max(2, w - 3), '#ffffff');
      p.hline(bx + 2, ry, w - 1, '#e6eefc');
      p.hline(bx + 2, ry, Math.max(2, w - 3), '#ffffff');
    }
    // 残破冥铁左/右肩甲
    p.ellipse(bx - 8, 31 + by, 3.5, 2.8, '#3f4a6b');
    p.ellipse(bx - 8, 30.2 + by, 2.3, 1.7, '#7c8db8');
    p.px(bx - 9, 29 + by, '#b8caed');
    p.ellipse(bx + 7, 31 + by, 3.5, 2.8, '#3f4a6b');
    p.ellipse(bx + 7, 30.2 + by, 2.3, 1.7, '#8ea1cf');
    p.px(bx + 7, 29 + by, '#d6e3ff');

    // [4] 精雕冷峻全露苍白骷髅头颅 + 额骨旧裂痕 + 幽青冥火双瞳 + 收窄梯形牙颌！
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.rect(bx - 1, headY + 6, 3, 4, '#a6b3cf');
    // 饱满立体冷骨颅顶（4阶骨色立体光影，去掉瓜皮兜帽！）
    p.ellipse(bx, headY - 2, 7.8, 7.2, '#a3afc9');
    p.ellipse(bx - 0.5, headY - 2.6, 6.8, 6.1, '#dce5f5');
    p.ellipse(bx - 1.5, headY - 4.4, 4.8, 3.4, '#f5f9ff');
    p.hline(bx - 3, headY - 6, 4, '#ffffff');
    // 帅气额角古战裂纹
    p.px(bx - 4, headY - 6, '#5c6685');
    p.px(bx - 3, headY - 5, '#5c6685');
    p.px(bx - 3, headY - 4, '#7d88a8');
    // 收窄梯形下颌骨 + 立体齿槽与雪白牙列
    p.poly(
      [
        [bx - 5, headY + 3],
        [bx + 6, headY + 3],
        [bx + 4, headY + 8],
        [bx - 3, headY + 8],
      ],
      '#c2cde3',
    );
    p.poly(
      [
        [bx - 4, headY + 3],
        [bx + 5, headY + 3],
        [bx + 3, headY + 7],
        [bx - 2, headY + 7],
      ],
      '#eef4fc',
    );
    p.hline(bx - 2, headY + 6, 6, '#1c152e');
    for (const tx of [-2, 0, 2, 4]) {
      p.px(bx + tx, headY + 5, '#ffffff');
    }
    // 深邃黑眼窝 + 熊熊幽青魂火瞳点 + 倒三角鼻腔
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.rect(bx - 4, headY - 1, 3, 3, '#120d21');
    p.rect(bx + 2, headY - 1, 3, 3, '#120d21');
    p.px(bx + 1, headY + 2, '#1a142e');
    p.px(bx + 1, headY + 3, '#1a142e');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.rect(bx - 3, headY, 2, 2, '#2ef0db', true);
    p.px(bx - 3, headY, '#ffffff', true);
    p.rect(bx + 3, headY, 2, 2, '#2ef0db', true);
    p.px(bx + 3, headY, '#ffffff', true);

    // [5] 左臂：冥铁圆盾（金属镶边 + 幽青符印核心！）
    p.setPart(SPRITE_PART.BACK_ARM);
    p.line(bx - 8, 33 + by, bx - 12, 40 + by, '#c7d2e6', 2);
    p.ellipse(bx - 13, 41 + by, 5.6, 6.8, '#363f5c');
    p.ellipse(bx - 13.5, 40.5 + by, 4.3, 5.4, '#5a6a91');
    p.ellipse(bx - 14, 39.5 + by, 2.2, 3.0, '#8ba0cf');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx - 13, 41 + by, 1.5, 1.8, '#3ef5e0', true);

    // [6] 右骨臂 + 幽青冥火古骨阔剑（厚重剑格 + 凛冽阔刃 + 蓄力高举挥斩！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    let handX = bx + 12;
    let handY = 40 + by - Math.round(pose.armAction * 2);
    if (isAtk && f === 0) {
      handX = bx + 9;
      handY = 26 + by;
    } else if (isAtk && (f === 1 || f === 2)) {
      handX = bx + 16;
      handY = 38 + by;
    }
    p.line(bx + 7, 33 + by, handX, handY, '#dce5f2', 2);
    p.ellipse(bx + 10, Math.round((33 + by + handY) * 0.5), 1.6, 1.6, '#ffffff');

    p.setPart(SPRITE_PART.WEAPON);
    if (isAtk && f === 0) {
      p.line(handX, handY + 2, handX - 5, handY - 18, '#28455c', 5);
      p.line(handX, handY, handX - 5, handY - 18, '#6ef7ea', 3, true);
      p.line(handX, handY - 2, handX - 5, handY - 18, '#ffffff', 1, true);
      p.hline(handX - 4, handY - 1, 8, '#c9d6ed');
    } else if (isAtk && (f === 1 || f === 2)) {
      const tipX = Math.min(59, handX + 18);
      p.line(handX - 2, handY, tipX, handY - 4, '#24465e', 5);
      p.line(handX + 1, handY, tipX, handY - 4, '#5cfce9', 3, true);
      p.line(handX + 2, handY - 1, tipX, handY - 4, '#ffffff', 1, true);
      p.vline(handX + 2, handY - 4, 8, '#d5e2f7');
      drawSlashArc64(p, bx + 13, 36 + by, 17, 16, -1.15, 0.9, '#17bfad', '#75fff0', '#ffffff');
    } else {
      const tipX = handX + 13;
      const tipY = handY - 15;
      p.line(handX - 2, handY + 2, tipX, tipY, '#264359', 5);
      p.line(handX + 1, handY - 1, tipX, tipY, '#59e8db', 3, true);
      p.line(handX + 2, handY - 2, tipX, tipY, '#ebfffd', 1, true);
      p.line(handX - 2, handY - 3, handX + 4, handY + 2, '#d5e2f7', 2);
    }
    p.rect(handX - 1, handY - 1, 3, 2, '#eef4fc');
  },
};

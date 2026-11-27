/**
 * 5. 禁忌之书（混沌 T2-B · 2×1 浮空暗系炮台）
 * 黑曜紫鎏金古魔典 + 翻飞羊皮符文散页 + 冠冕深渊紫金日冕魔眼与净空石化凝视光束。
 */

import { SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawHollowRing64, drawSparkStar64, HD_BASE } from './helpers';

/** 禁忌之书（creature_grimoire）HD 像素绘谱 */
export const CREATURE_GRIMOIRE_RIG_SPEC: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0f0824',
  backdropBottom: '#2b134a',
  backdropGlow: '#cc70ff',
  avatarCrop: { x: 10, y: 6, size: 42 },
  portraitCrop: { x: 2, y: 4, w: 60, h: 62 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx = isAtk && (f === 1 || f === 2) ? 26 : Math.round(32 + pose.leanX * 0.7);
    const hover = Math.round(Math.sin(phase) * 2.2 + pose.breathY * 1.4 - pose.stepLift);
    const sway = pose.flutter * 1.8;
    const flap = isHit
      ? 2
      : isAtk && f === 0
        ? 1
        : isAtk && f === 1
          ? -7
          : isAtk && f === 2
            ? -4
            : Math.round(Math.sin(phase) * 2.8 - 1.5);

    // [1] 底部真·镂空倾斜「紫金禁忌魔阵足环」+ 垂悬双绯红金穗丝绸书签带
    p.setPart(SPRITE_PART.BACK_ACC);
    drawHollowRing64(p, bx, 63, 16.5, 3.2, 0.74, '#6d22bd', '#b45cff', '#ffe885', true);
    const ribY = 51 + hover;
    p.bezierRibbon([bx - 3, ribY], [bx - 6 + sway * 0.6, ribY + 5], [bx - 5 + sway, ribY + 10], 3.0, 1.4, '#8f1336');
    p.bezierRibbon([bx - 3, ribY], [bx - 5 + sway * 0.6, ribY + 5], [bx - 5 + sway, ribY + 9], 1.4, 0.7, '#ff3b73');
    p.px(Math.round(bx - 5 + sway), ribY + 10, '#ffe878', true);

    p.bezierRibbon([bx + 3, ribY], [bx + 7 - sway * 0.6, ribY + 6], [bx + 6 - sway, ribY + 12], 3.0, 1.4, '#a61942');
    p.bezierRibbon([bx + 3, ribY], [bx + 6 - sway * 0.6, ribY + 6], [bx + 6 - sway, ribY + 11], 1.4, 0.7, '#ff5989');
    p.px(Math.round(bx + 6 - sway), ribY + 12, '#ffe878', true);

    // [2] 背后真·镂空旋转「深渊紫金星轨法环」
    const eyeY = 19 + hover - Math.round(flap * 0.25);
    const ringR = isAtk && (f === 1 || f === 2) ? 14.5 : 11.5;
    drawHollowRing64(p, bx, eyeY, ringR, ringR * 0.85, 0.86, '#7a26d4', '#c26bff', '#ffe878', true);
    for (let i = 0; i < 8; i++) {
      const a = phase * 0.6 + (i * Math.PI) / 4;
      const rx = Math.round(bx + Math.cos(a) * ringR);
      const ry = Math.round(eyeY + Math.sin(a) * ringR * 0.85);
      p.px(rx, ry, i % 2 === 0 ? '#ffe878' : '#ffffff', true);
    }

    // [3] 立体厚重「黑曜紫鎏金古魔典双翼封皮 + 厚实羊皮纸书页叠层 + 炼金符文」
    p.setPart(SPRITE_PART.TORSO);
    const spineTop = 36 + hover;
    const spineBot = 53 + hover;
    const wingOutL = Math.max(4, bx - 22);
    const wingOutR = Math.min(58, bx + 22);
    const wingTopY = 30 + hover + flap;
    const wingBotY = 47 + hover + flap;

    p.poly([[wingOutL, wingTopY], [bx - 1, spineTop], [bx - 1, spineBot + 2], [wingOutL + 3, wingBotY + 3]], '#260d47');
    p.poly([[wingOutR, wingTopY], [bx + 1, spineTop], [bx + 1, spineBot + 2], [wingOutR - 3, wingBotY + 3]], '#381466');
    p.line(wingOutL, wingTopY, wingOutL + 3, wingBotY + 2, '#7330c9', 2);
    p.line(wingOutR, wingTopY, wingOutR - 3, wingBotY + 2, '#9142f0', 2);
    p.rect(wingOutL, wingTopY, 4, 4, '#c78c24');
    p.rect(wingOutL + 1, wingTopY + 1, 2, 2, '#fff2ad', true);
    p.rect(wingOutL + 2, wingBotY - 1, 4, 4, '#a8711c');
    p.rect(wingOutR - 3, wingTopY, 4, 4, '#f0be46');
    p.rect(wingOutR - 2, wingTopY + 1, 2, 2, '#ffffff', true);
    p.rect(wingOutR - 5, wingBotY - 1, 4, 4, '#d99e32');

    p.poly([[wingOutL + 3, wingBotY + 1], [bx - 1, spineBot], [bx - 1, spineBot - 3], [wingOutL + 3, wingBotY - 2]], '#a67e46');
    p.line(wingOutL + 4, wingBotY - 1, bx - 2, spineBot - 2, '#d4ae72', 1);
    p.poly([[wingOutR - 3, wingBotY + 1], [bx + 1, spineBot], [bx + 1, spineBot - 3], [wingOutR - 3, wingBotY - 2]], '#bf9352');
    p.line(wingOutR - 4, wingBotY - 1, bx + 2, spineBot - 2, '#e6c385', 1);

    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly([[wingOutL + 3, wingTopY + 1], [bx - 1, spineTop + 1], [bx - 1, spineBot - 3], [wingOutL + 4, wingBotY - 2]], '#e8cc8e');
    p.poly([[wingOutL + 5, wingTopY + 2], [bx - 3, spineTop + 2], [bx - 3, spineBot - 4], [wingOutL + 6, wingBotY - 3]], '#fff4cc');
    p.poly([[wingOutR - 3, wingTopY + 1], [bx + 1, spineTop + 1], [bx + 1, spineBot - 3], [wingOutR - 4, wingBotY - 2]], '#f2d899');
    p.poly([[wingOutR - 5, wingTopY + 2], [bx + 3, spineTop + 2], [bx + 3, spineBot - 4], [wingOutR - 6, wingBotY - 3]], '#fff8db');

    const midY = Math.round((wingTopY + spineTop) * 0.5) + 5;
    const runeCol = isAtk && f <= 2 ? '#ff59c7' : '#8933db';
    p.poly([[bx - 12, midY - 2], [bx - 9, midY], [bx - 12, midY + 2], [bx - 15, midY]], '#d9306d', true);
    p.px(bx - 12, midY, '#fff5b8', true);
    p.hline(bx - 16, midY + 4, 9, runeCol, isAtk);
    p.hline(bx - 15, midY + 7, 7, '#b53a86', isAtk);

    drawHollowRing64(p, bx + 11, midY, 3.2, 2.6, 0.52, '#a8368f', runeCol, '#fff5b8', true);
    p.hline(bx + 7, midY + 4, 9, runeCol, isAtk);
    p.hline(bx + 8, midY + 7, 7, '#d9306d', isAtk);

    p.setPart(SPRITE_PART.TORSO);
    p.rect(bx - 2, spineTop - 1, 5, 19, '#b87f1e');
    p.rect(bx - 1, spineTop, 3, 17, '#ffe478');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.rect(bx - 1, spineTop + 4, 2, 2, '#ff265e', true);
    p.rect(bx - 1, spineTop + 11, 2, 2, '#ff265e', true);

    // [4] 两张半空翻卷飞舞的「发光羊皮符文散页」（攻击时主动让出石化光束射界，保持视觉极致清爽！）
    p.setPart(SPRITE_PART.WEAPON);
    const pageLift = Math.round(Math.sin(phase + 1.2) * 2.8);
    const lpX = Math.max(4, bx - 21);
    const lpY = 19 + hover + pageLift;
    p.poly([[lpX, lpY], [lpX + 6, lpY - 2], [lpX + 7, lpY + 5], [lpX + 1, lpY + 7]], '#fff0bd', isAtk);
    p.hline(lpX + 1, lpY + 2, 4, '#a64dff', true);
    p.hline(lpX + 2, lpY + 4, 3, '#e63278', true);

    const rpX = isAtk && (f === 1 || f === 2) ? Math.min(54, bx + 20) : Math.min(54, bx + 16);
    const rpY = isAtk && (f === 1 || f === 2) ? 34 + hover : 18 + hover - pageLift;
    p.poly([[rpX, rpY], [rpX + 6, rpY + 1], [rpX + 5, rpY + 8], [rpX - 1, rpY + 7]], '#ffe89e', isAtk);
    p.hline(rpX + 1, rpY + 3, 4, '#ff45a8', true);
    p.hline(rpX + 1, rpY + 5, 3, '#9d4dff', true);

    // [5] 冠冕级「深渊紫金日冕魔眼」
    p.setPart(SPRITE_PART.HEADWEAR);
    const eyeW = isAtk && f === 1 ? 10.5 : isAtk && f === 2 ? 9.5 : 8.5;
    const eyeH = isHit ? 3.0 : isAtk && f === 1 ? 7.2 : 5.8;
    p.poly(
      [
        [bx, eyeY - Math.round(eyeH) - 5],
        [bx + Math.round(eyeW) + 5, eyeY],
        [bx, eyeY + Math.round(eyeH) + 5],
        [bx - Math.round(eyeW) - 5, eyeY],
      ],
      '#46177d',
    );
    p.poly(
      [
        [bx, eyeY - Math.round(eyeH) - 3],
        [bx + Math.round(eyeW) + 3, eyeY],
        [bx, eyeY + Math.round(eyeH) + 3],
        [bx - Math.round(eyeW) - 3, eyeY],
      ],
      '#e6ae36',
      true,
    );
    p.px(bx, eyeY - Math.round(eyeH) - 4, '#ffffff', true);
    p.px(bx, eyeY + Math.round(eyeH) + 4, '#ffe478', true);
    p.px(bx - Math.round(eyeW) - 4, eyeY, '#ffe478', true);
    p.px(bx + Math.round(eyeW) + 4, eyeY, '#ffffff', true);

    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.ellipse(bx, eyeY, eyeW - 0.8, eyeH - 0.6, '#fff9eb', true);
    if (pose.blink || isHit) {
      p.hline(bx - 7, eyeY, 15, '#4c1882');
      p.hline(bx - 6, eyeY - 1, 13, '#f2c14e');
    } else {
      const irisBoost = isAtk && f === 1 ? 1.0 : 0;
      p.ellipse(bx, eyeY, 4.8 + irisBoost, 4.4 + irisBoost * 0.8, '#771cc7', true);
      p.ellipse(bx, eyeY, 3.6 + irisBoost * 0.6, 3.5 + irisBoost * 0.5, '#eb2470', true);
      p.ellipse(bx, eyeY, 2.3, 2.5, '#ffbf38', true);
      p.vline(bx, eyeY - 3, 7, '#160726');
      p.vline(bx + 1, eyeY - 2, 5, '#2b0d47');
      if (isAtk && f === 0) {
        p.px(bx, eyeY, '#ffffff', true);
      } else {
        p.rect(bx - 2, eyeY - 2, 2, 2, '#ffffff', true);
        p.px(bx + 2, eyeY + 1, '#fff0ad', true);
      }
    }

    // [6] 魔眼石化攻击爆发：净空激射紫金魔眼射线 + 束身石化涟漪环！
    if (isAtk && f === 1) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.poly([[bx + 10, eyeY - 4], [61, eyeY], [bx + 10, eyeY + 4]], '#b34dff', true);
      p.poly([[bx + 11, eyeY - 2], [60, eyeY], [bx + 11, eyeY + 2]], '#ff5eb8', true);
      p.hline(bx + 12, eyeY, Math.max(2, 58 - (bx + 12)), '#ffffff', true);
      // 沿光束跃动的石化星环波纹
      p.vline(bx + 17, eyeY - 5, 11, '#ffe478', true);
      p.vline(bx + 25, eyeY - 4, 9, '#d480ff', true);
      p.line(bx - 12, eyeY - 9, bx - 8, eyeY - 5, '#ffe466', 2, true);
      p.line(bx + 12, eyeY - 9, bx + 8, eyeY - 5, '#ffe466', 2, true);
      p.line(bx - 12, eyeY + 9, bx - 8, eyeY + 5, '#ffe466', 2, true);
      p.line(bx + 12, eyeY + 9, bx + 8, eyeY + 5, '#ffe466', 2, true);
    } else if (isAtk && f === 2) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.line(bx + 11, eyeY - 4, 60, eyeY - 7, '#c766ff', 2, true);
      p.line(bx + 11, eyeY + 4, 60, eyeY + 7, '#ff66ba', 2, true);
      drawSparkStar64(p, 58, eyeY, 2, '#ffe878');
    }
  },
};

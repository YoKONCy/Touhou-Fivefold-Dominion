/**
 * 秩序阵营 T4-A 兵种：净秽者（creature_purity_titan）HD 像素绘谱。
 */

import {
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawHollowRing64, drawWrappedHand, HD_BASE } from './helpers';

/**
 * 9. 净秽者（秩序 T4-A · 1×2 高挑远程月都苍雷天神将）：
 *    背后真·镂空鎏金日晷星神轮 + 柔和飘逸深夜星空大披风 + 侧披铂银神发 + 雕金洁白神假面与苍蓝星瞳 +
 *    鎏金双翼新月冕 + 修长深蓝白金神铠与长胫甲 + 左掌苍雷星核 + 右手苍雷三叉天戟！
 */
export const purityTitanRigSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#081029',
  backdropBottom: '#192a5e',
  backdropGlow: '#78d8ff',
  avatarCrop: { x: 14, y: 2, size: 36 },
  portraitCrop: { x: 2, y: 1, w: 60, h: 69 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const bx = isAtk && (f === 1 || f === 2) ? 24 : Math.round(29 + pose.leanX * 0.7);
    const by = Math.round(pose.breathY * 0.9 - pose.stepLift * 0.8);
    const sway = pose.flutter * 1.4;
    const headY = 17 + by;

    // [1] 背后宏伟「真·镂空鎏金日晷星神轮」（纯镂空金环 + 8 道锐利星芒刻针，零黑片！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const haloCY = 22 + by;
    drawHollowRing64(p, bx, haloCY, 15.2, 15.2, 0.85, '#c28b29', '#ffe066', '#ffffff', true);
    drawHollowRing64(p, bx, haloCY, 11.0, 11.0, 0.87, '#4fa8ff', '#a8e8ff', '#ffffff', true);
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4 + phase * 0.1;
      const r0 = 15.0;
      const r1 = i % 2 === 0 ? 18.8 : 17.2;
      p.line(
        bx + Math.cos(ang) * r0,
        haloCY + Math.sin(ang) * r0,
        bx + Math.cos(ang) * r1,
        haloCY + Math.sin(ang) * r1,
        i % 2 === 0 ? '#ffe885' : '#8ce0ff',
        1,
        true,
      );
    }

    // [2] 优雅飘扬的「深夜星空大披风」（柔和波浪斜收尾，彻底告别生硬黄横棍！）
    p.poly(
      [
        [bx - 10, 26 + by],
        [bx + 9, 26 + by],
        [bx + 13 - sway * 0.3, 56 + by],
        [bx + 6 - sway * 0.2, 61 + by],
        [bx - 9 + sway * 0.6, 61 + by],
        [bx - 17 + sway, 57 + by],
      ],
      '#142152',
    );
    p.poly(
      [
        [bx - 8, 27 + by],
        [bx + 7, 27 + by],
        [bx + 10 - sway * 0.3, 54 + by],
        [bx - 13 + sway * 0.8, 56 + by],
      ],
      '#203b85',
    );
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx - 11 + Math.round(sway * 0.5), 48 + by, '#fff4b8', true);
    p.px(bx - 8 + Math.round(sway * 0.4), 55 + by, '#8ce8ff', true);
    p.px(bx + 9, 50 + by, '#ffffff', true);

    // [3] 飘逸在肩侧后方的铂银长发缕（彻底消除下巴下方的灰白胡子围兜！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.bezierRibbon([bx - 6, headY + 2], [bx - 11, headY + 11], [bx - 13 + sway * 0.5, headY + 19], 3.4, 1.0, '#a8bce0');
    p.bezierRibbon([bx - 5, headY + 2], [bx - 9, headY + 10], [bx - 11 + sway * 0.4, headY + 17], 1.6, 0.6, '#eef5ff');
    p.bezierRibbon([bx + 6, headY + 2], [bx + 10, headY + 10], [bx + 12 - sway * 0.4, headY + 17], 3.0, 1.0, '#b8cae8');

    // [4] 修长威严 3/4 跨步深海蓝×白金神胫甲与高筒圣靴（彻底摆脱灯笼阔腿裤！）
    p.setPart(SPRITE_PART.LEGS);
    const stride = Math.round(pose.stride * 2.8);
    // 后撑左神腿
    p.poly(
      [
        [bx - 7 - stride, 43],
        [bx - 2 - stride, 43],
        [bx - 5 - stride, 62],
        [bx - 10 - stride, 62],
      ],
      '#213878',
    );
    p.poly(
      [
        [bx - 6 - stride, 49],
        [bx - 2 - stride, 49],
        [bx - 5 - stride, 61],
        [bx - 9 - stride, 61],
      ],
      '#c2d4f2',
    );
    p.rect(bx - 9 - stride, 49, 6, 3, '#e0af42'); // 金护膝
    p.poly([[bx - 11 - stride, 61], [bx - 3 - stride, 61], [bx - 3 - stride, 66], [bx - 12 - stride, 66]], '#dce7fc');
    p.hline(bx - 10 - stride, 62, 7, '#ffe078');
    // 前跨右神腿
    p.poly(
      [
        [bx + 2 + stride, 43],
        [bx + 7 + stride, 43],
        [bx + 11 + stride, 63],
        [bx + 5 + stride, 63],
      ],
      '#2b4a9c',
    );
    p.poly(
      [
        [bx + 3 + stride, 49],
        [bx + 8 + stride, 49],
        [bx + 10 + stride, 62],
        [bx + 5 + stride, 62],
      ],
      '#edf5ff',
    );
    p.rect(bx + 3 + stride, 49, 6, 3, '#ffd966');
    p.poly([[bx + 5 + stride, 62], [bx + 13 + stride, 62], [bx + 14 + stride, 67], [bx + 5 + stride, 67]], '#ffffff');
    p.hline(bx + 6 + stride, 63, 7, '#ffe680');

    // [5] 修长霸气分体神将战裙甲 + 窄长中央金纹战旌 + V 字白金蓝胸铠！
    p.setPart(SPRITE_PART.SKIRT);
    // 两侧修长外斜雕金裙甲
    p.poly([[bx - 8, 40 + by], [bx - 3, 40 + by], [bx - 7, 54 + by], [bx - 13 + sway * 0.3, 52 + by]], '#d9e4f7');
    p.poly([[bx - 7, 41 + by], [bx - 4, 41 + by], [bx - 8, 52 + by], [bx - 11 + sway * 0.3, 51 + by]], '#ffffff');
    p.line(bx - 12 + sway * 0.3, 52 + by, bx - 7, 54 + by, '#ffe078', 1);
    p.poly([[bx + 3, 40 + by], [bx + 8, 40 + by], [bx + 13 - sway * 0.2, 52 + by], [bx + 7, 54 + by]], '#d9e4f7');
    p.poly([[bx + 4, 41 + by], [bx + 7, 41 + by], [bx + 11 - sway * 0.2, 51 + by], [bx + 8, 52 + by]], '#ffffff');
    p.line(bx + 7, 54 + by, bx + 12 - sway * 0.2, 52 + by, '#ffe078', 1);
    // 中央修长月蓝金边神将战旌（优雅垂于双膝间！）
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly([[bx - 3, 40 + by], [bx + 3, 40 + by], [bx + 2, 56 + by], [bx, 59 + by], [bx - 2, 56 + by]], '#24479e');
    p.vline(bx, 42 + by, 14, '#ffe278');
    p.px(bx, 47 + by, '#8ce8ff', true);

    // 立体 V 字白金胸铠 + 深海蓝颈甲衬领 + 胸口苍雷核心 + 双翼金肩甲
    p.setPart(SPRITE_PART.TORSO);
    p.rect(bx - 3, 22 + by, 6, 4, '#1b3578'); // 清晰优雅的深海蓝神铠立领！
    p.hline(bx - 4, 24 + by, 8, '#ffe078');
    p.poly([[bx - 10, 25 + by], [bx + 10, 25 + by], [bx + 6, 41 + by], [bx - 6, 41 + by]], '#9fb4db');
    p.poly([[bx - 9, 26 + by], [bx + 9, 26 + by], [bx + 5, 39 + by], [bx - 5, 39 + by]], '#ffffff');
    p.poly([[bx - 7, 27 + by], [bx + 7, 27 + by], [bx + 4, 33 + by], [bx - 4, 33 + by]], '#254ba3');
    p.hline(bx - 9, 26 + by, 18, '#ffd966');
    p.hline(bx - 6, 40 + by, 12, '#ffd966');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx, 31 + by, 3.0, 3.4, '#369cff', true);
    p.ellipse(bx, 31 + by, 1.6, 2.0, '#ffffff', true);
    // 威武双翼雕金重肩甲
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 15, 24 + by], [bx - 7, 25 + by], [bx - 7, 32 + by], [bx - 13, 31 + by]], '#e0af42');
    p.poly([[bx - 14, 25 + by], [bx - 8, 26 + by], [bx - 8, 30 + by], [bx - 12, 29 + by]], '#fff4bf');
    p.poly([[bx + 7, 25 + by], [bx + 15, 24 + by], [bx + 13, 31 + by], [bx + 7, 32 + by]], '#e0af42');
    p.poly([[bx + 8, 26 + by], [bx + 14, 25 + by], [bx + 12, 29 + by], [bx + 8, 30 + by]], '#fff8d6');

    // [6] 左臂前掌托浮滋滋跃动的「苍雷净秽星核」！
    p.setPart(SPRITE_PART.BACK_ARM);
    const orbX = isAtk && f === 0 ? bx - 12 : bx - 14;
    const orbY = isAtk ? 31 + by : 36 + by;
    p.line(bx - 10, 29 + by, orbX + 1, orbY + 4, '#cfdcf5', 3);
    p.ellipse(orbX + 1, orbY + 4, 2.2, 2.0, '#ffffff');
    p.setPart(SPRITE_PART.GLOW_FX);
    const orbR = isAtk ? 4.2 : 3.2;
    p.ellipse(orbX, orbY - 1, orbR, orbR, '#3da8ff', true);
    p.ellipse(orbX, orbY - 1, orbR * 0.55, orbR * 0.55, '#ffffff', true);
    p.line(orbX - 4, orbY - 4, orbX - 1, orbY - 2, '#b8f4ff', 1, true);
    p.line(orbX + 4, orbY + 2, orbX + 2, orbY, '#b8f4ff', 1, true);

    // [7] 流线雕金洁白神假面与苍蓝星神双瞳 + 鎏金双翼新月神冕！
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.poly([[bx - 6, headY - 5], [bx + 6, headY - 5], [bx + 5, headY + 4], [bx, headY + 6], [bx - 5, headY + 4]], '#cddbf2');
    p.poly([[bx - 5, headY - 4], [bx + 5, headY - 4], [bx + 4, headY + 3], [bx, headY + 5], [bx - 4, headY + 3]], '#ffffff');
    p.line(bx - 4, headY - 2, bx, headY, '#ffd966', 1);
    p.line(bx + 4, headY - 2, bx, headY, '#ffd966', 1);
    p.vline(bx, headY, 5, '#e8b846');
    p.setPart(SPRITE_PART.FACE_FEATURES);
    if (pose.expr !== 'hurt') {
      p.rect(bx - 4, headY, 3, 2, '#29b6ff', true);
      p.rect(bx + 1, headY, 3, 2, '#29b6ff', true);
      p.px(bx - 3, headY, '#ffffff', true);
      p.px(bx + 2, headY, '#ffffff', true);
    } else {
      p.hline(bx - 4, headY + 1, 3, '#4f6494');
      p.hline(bx + 1, headY + 1, 3, '#4f6494');
    }
    p.setPart(SPRITE_PART.HEADWEAR);
    p.poly([[bx - 7, headY - 4], [bx - 11, headY - 11], [bx - 4, headY - 7]], '#ffd966', true);
    p.poly([[bx + 7, headY - 4], [bx + 11, headY - 11], [bx + 4, headY - 7]], '#ffe885', true);
    p.ellipse(bx, headY - 7, 3.4, 3.0, '#ffe478', true);
    p.ellipse(bx, headY - 8, 2.2, 2.0, '#142152');
    p.px(bx, headY - 6, '#99f0ff', true);

    // [8] 右臂高擎宏伟「苍雷三叉天戟」+ 完整零裁切净秽裁决苍雷长枪光束！
    p.setPart(SPRITE_PART.FRONT_ARM);
    const handX = isAtk && f === 0 ? bx + 11 : isAtk && (f === 1 || f === 2) ? bx + 15 : bx + 14;
    const handY = isAtk ? 33 + by : 37 + by;
    p.line(bx + 10, 29 + by, handX, handY, '#dce7fc', 3);
    p.line(bx + 10, 28 + by, handX, handY - 1, '#ffffff', 1);

    p.setPart(SPRITE_PART.WEAPON);
    if (isAtk && (f === 1 || f === 2)) {
      const tipX = bx + 24;
      const tipY = handY - 2;
      p.line(bx - 2, handY + 2, tipX, tipY, '#d9a436', 2);
      p.line(bx - 1, handY + 1, tipX, tipY - 1, '#fff2ad', 1);
      p.poly([[tipX - 3, tipY - 5], [tipX + 3, tipY - 4], [tipX, tipY - 1]], '#ffe478', true);
      p.poly([[tipX - 3, tipY + 5], [tipX + 3, tipY + 4], [tipX, tipY + 1]], '#ffe478', true);
      p.poly([[tipX - 2, tipY - 2], [tipX + 6, tipY], [tipX - 2, tipY + 2]], '#99f0ff', true);
      drawWrappedHand(p, handX, handY, '#dce7fc', '#ffffff', '#7a8eb8');

      p.setPart(SPRITE_PART.GLOW_FX);
      const beamEnd = Math.min(60, tipX + 12);
      p.line(tipX + 3, tipY, beamEnd, tipY, '#339eff', 4, true);
      p.hline(tipX + 4, tipY, Math.max(2, beamEnd - tipX - 4), '#ffffff', true);
      p.line(tipX + 2, tipY - 5, tipX + 7, tipY - 2, '#99f4ff', 1, true);
      p.line(tipX + 7, tipY - 2, beamEnd - 2, tipY - 4, '#ffffff', 1, true);
      p.line(tipX + 3, tipY + 5, tipX + 8, tipY + 2, '#99f4ff', 1, true);
    } else {
      const poleX = handX + 1;
      p.line(poleX, 64 + by, poleX, 14 + by, '#c9942e', 2);
      p.vline(poleX + 1, 14 + by, 49, '#fff2ad');
      p.poly([[poleX - 6, 17 + by], [poleX - 5, 8 + by], [poleX - 2, 16 + by]], '#ffe066', true);
      p.poly([[poleX + 6, 17 + by], [poleX + 5, 8 + by], [poleX + 2, 16 + by]], '#ffe066', true);
      p.poly([[poleX - 3, 16 + by], [poleX, 4 + by], [poleX + 3, 16 + by]], '#8ce8ff', true);
      p.vline(poleX, 6 + by, 10, '#ffffff', true);
      p.hline(poleX - 6, 16 + by, 13, '#ffe478', true);
      drawWrappedHand(p, handX, handY, '#dce7fc', '#ffffff', '#7a8eb8');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.px(poleX - 5, 7 + by, '#b8f4ff', true);
      p.px(poleX + 5, 7 + by, '#b8f4ff', true);
      p.px(poleX, 4 + by, '#ffffff', true);
    }
  },
};

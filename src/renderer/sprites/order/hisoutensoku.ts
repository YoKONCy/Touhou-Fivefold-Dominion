/**
 * 秩序阵营 T4-B 兵种：非想天则（creature_hisoutensoku）HD 像素绘谱。
 */

import {
  drawSlashArc64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { HD_BASE } from './helpers';

/**
 * 10. 非想天则（秩序 T4-B · 2×2 勇者系超级蒸汽机神！）：
 *     高耸双联黄铜蒸汽大烟囱与立体白雾 + 棱角锐利武士金月高冠头雕 + 倒三角 V 字朱漆金边胸铠 +
 *     璀璨炽白太阳核心核动力反应炉 + 精悍收腰机械腹甲 + 雄迈 3/4 重装战胫 + 喷焰先攻火箭铁拳！
 */
export const hisoutensokuRigSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0b1026',
  backdropBottom: '#2b182e',
  backdropGlow: '#ffad33',
  avatarCrop: { x: 12, y: 3, size: 40 },
  portraitCrop: { x: 1, y: 1, w: 62, h: 70 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    // 攻击时左右双肩甲与前冲火箭铁拳+冲击波全部严格留白于 [3..61]，100% 零裁切！
    const bx = isAtk && (f === 1 || f === 2) ? 26 : Math.round(31 + pose.leanX * 0.7);
    const by = Math.round(pose.breathY * 0.85 - pose.stepLift * 0.6) + 2;
    const legStride = Math.round(pose.stride * 3.8);

    // [1] 背部双联黄铜重型蒸汽大烟囱 + 立体蓬松白雾蒸汽（留足顶部空间零贴顶！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const steamShift = (pose.frame * 2) % 4;
    p.rect(bx - 16, 9 + by, 6, 16, '#323d59');
    p.rect(bx - 15, 10 + by, 3, 13, '#6b7ca8');
    p.hline(bx - 16, 9 + by, 6, '#ffe073');
    p.hline(bx - 16, 13 + by, 6, '#b8852b');

    p.rect(bx + 10, 9 + by, 6, 16, '#323d59');
    p.rect(bx + 11, 10 + by, 3, 13, '#8496c7');
    p.hline(bx + 10, 9 + by, 6, '#ffe885');
    p.hline(bx + 10, 13 + by, 6, '#c79234');

    p.ellipse(bx - 13, 6 + by - Math.min(2, steamShift * 0.5), 3.4, 2.2, '#b9cfe8');
    p.ellipse(bx - 14, 5 + by - Math.min(2, steamShift * 0.5), 2.1, 1.4, '#eef6ff');
    p.ellipse(bx + 13, 6 + by - Math.min(2, ((steamShift + 2) % 4) * 0.5), 3.2, 2.0, '#b9cfe8');
    p.ellipse(bx + 12, 5 + by - Math.min(2, ((steamShift + 2) % 4) * 0.5), 2.0, 1.3, '#ffffff');

    // [2] 雄迈 3/4 跨步超级系外八重装战胫（厚重钢铁蓝胫甲 + 尖锐金护膝 + 朱漆大重靴！）
    p.setPart(SPRITE_PART.LEGS);
    const lLift = pose.stride > 0.3 ? -2 : 0;
    const rLift = pose.stride < -0.3 ? -2 : 0;
    // 左后蹬重腿
    p.poly(
      [
        [bx - 11 - legStride, 43 + lLift],
        [bx - 3 - legStride, 43 + lLift],
        [bx - 6 - legStride, 62 + lLift],
        [bx - 17 - legStride, 62 + lLift],
      ],
      '#252e47',
    );
    p.poly(
      [
        [bx - 10 - legStride, 44 + lLift],
        [bx - 4 - legStride, 44 + lLift],
        [bx - 7 - legStride, 60 + lLift],
        [bx - 14 - legStride, 60 + lLift],
      ],
      '#5a6a94',
    );
    p.poly(
      [
        [bx - 13 - legStride, 48 + lLift],
        [bx - 4 - legStride, 47 + lLift],
        [bx - 6 - legStride, 54 + lLift],
        [bx - 11 - legStride, 54 + lLift],
      ],
      '#deb043',
    );
    p.hline(bx - 12 - legStride, 48 + lLift, 7, '#fff3b0');
    p.poly(
      [
        [bx - 18 - legStride, 60 + lLift],
        [bx - 4 - legStride, 60 + lLift],
        [bx - 4 - legStride, 66 + lLift],
        [bx - 20 - legStride, 66 + lLift],
      ],
      '#9e1e36',
    );
    p.hline(bx - 17 - legStride, 61 + lLift, 12, '#f25c78');
    p.hline(bx - 19 - legStride, 65 + lLift, 15, '#591120');

    // 右前跨重腿（受光高亮立体面！）
    p.poly(
      [
        [bx + 3 + legStride, 43 + rLift],
        [bx + 11 + legStride, 43 + rLift],
        [bx + 18 + legStride, 63 + rLift],
        [bx + 6 + legStride, 63 + rLift],
      ],
      '#323f61',
    );
    p.poly(
      [
        [bx + 4 + legStride, 44 + rLift],
        [bx + 10 + legStride, 44 + rLift],
        [bx + 15 + legStride, 61 + rLift],
        [bx + 7 + legStride, 61 + rLift],
      ],
      '#8598c9',
    );
    p.line(bx + 9 + legStride, 45 + rLift, bx + 13 + legStride, 60 + rLift, '#c4d4f7', 2);
    p.poly(
      [
        [bx + 4 + legStride, 47 + rLift],
        [bx + 13 + legStride, 48 + rLift],
        [bx + 12 + legStride, 54 + rLift],
        [bx + 6 + legStride, 54 + rLift],
      ],
      '#ffd466',
    );
    p.hline(bx + 5 + legStride, 48 + rLift, 7, '#ffffff');
    p.poly(
      [
        [bx + 5 + legStride, 61 + rLift],
        [bx + 19 + legStride, 61 + rLift],
        [bx + 21 + legStride, 67 + rLift],
        [bx + 5 + legStride, 67 + rLift],
      ],
      '#cc2b49',
    );
    p.hline(bx + 6 + legStride, 62 + rLift, 13, '#ff859b');
    p.hline(bx + 6 + legStride, 66 + rLift, 15, '#6e1325');

    // [3] 精悍收腰机械腹甲 + 分体红金前裙甲 + 强倒三角 3D V 字朱漆胸铠 + 炽白太阳核心反应炉！
    p.setPart(SPRITE_PART.APRON_WAIST);
    // 机械钢灰液压收腰（凸显勇者系超级机神健美倒三角轮廓，彻底告别方砖！）
    p.rect(bx - 8, 34 + by, 16, 6, '#354263');
    p.vline(bx - 5, 35 + by, 4, '#889bc9');
    p.vline(bx + 5, 35 + by, 4, '#889bc9');
    // 分体式前裙甲
    p.poly([[bx - 13, 38 + by], [bx - 4, 38 + by], [bx - 5, 45 + by], [bx - 14, 44 + by]], '#a82039');
    p.hline(bx - 13, 39 + by, 8, '#f25c78');
    p.poly([[bx + 4, 38 + by], [bx + 13, 38 + by], [bx + 14, 44 + by], [bx + 5, 45 + by]], '#cf2d4b');
    p.hline(bx + 5, 39 + by, 8, '#ff8299');
    p.rect(bx - 4, 38 + by, 8, 8, '#d9a438');
    p.rect(bx - 3, 39 + by, 6, 4, '#fff099');

    // 宏伟强倒三角 V 字立体朱漆胸铠
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 16, 18 + by], [bx + 16, 18 + by], [bx + 10, 35 + by], [bx - 10, 35 + by]], '#222b42');
    p.poly([[bx - 15, 19 + by], [bx + 15, 19 + by], [bx + 9, 34 + by], [bx - 9, 34 + by]], '#a81e37');
    p.poly([[bx - 14, 20 + by], [bx + 14, 20 + by], [bx + 8, 31 + by], [bx - 8, 31 + by]], '#de3554');
    p.poly([[bx - 12, 20 + by], [bx + 12, 20 + by], [bx + 7, 24 + by], [bx - 7, 24 + by]], '#ff7890');
    // 胸口 V 型黄金护胸棱线
    p.line(bx - 14, 20 + by, bx - 9, 33 + by, '#ffe073', 2);
    p.line(bx + 14, 20 + by, bx + 9, 33 + by, '#ffe885', 2);
    p.hline(bx - 14, 19 + by, 28, '#ffe073');
    // 胸口炽烈通透太阳核心核动力反应炉（无粗十字挡芯，炽白核光芒四射！）
    p.setPart(SPRITE_PART.GLOW_FX);
    const corePulse = isAtk ? 1.5 : pose.flutter > 0.4 ? 0.6 : 0;
    p.ellipse(bx, 26 + by, 6.2, 5.2, '#3d2218');
    p.ellipse(bx, 26 + by, 5.2 + corePulse, 4.3 + corePulse * 0.6, '#ff8c1a', true);
    p.ellipse(bx, 26 + by, 3.8 + corePulse * 0.5, 3.2 + corePulse * 0.5, '#ffe866', true);
    p.ellipse(bx, 26 + by, 2.2 + corePulse * 0.3, 1.9 + corePulse * 0.3, '#ffffff', true);
    // 精致外围左右玄铁卡爪（不遮核心！）
    p.setPart(SPRITE_PART.TORSO);
    p.rect(bx - 6, 25 + by, 2, 3, '#3b2319');
    p.rect(bx + 5, 25 + by, 2, 3, '#3b2319');

    // [4] 威武超级系和风武士大金月高冠头雕 + 翠青发光双目镜！
    p.setPart(SPRITE_PART.HEADWEAR);
    const headY = 13 + by;
    p.poly([[bx - 8, headY - 4], [bx + 8, headY - 4], [bx + 7, headY + 5], [bx, headY + 7], [bx - 7, headY + 5]], '#2b3552');
    p.poly([[bx - 7, headY - 3], [bx + 7, headY - 3], [bx + 6, headY + 4], [bx, headY + 6], [bx - 6, headY + 4]], '#8295c7');
    p.hline(bx - 5, headY - 3, 10, '#c8d6fa');
    p.poly(
      [
        [bx - 12, headY - 5],
        [bx - 7, headY - 10],
        [bx, headY - 5],
        [bx + 7, headY - 10],
        [bx + 12, headY - 5],
        [bx, headY - 2],
      ],
      '#e8b238',
      true,
    );
    p.line(bx - 11, headY - 6, bx - 7, headY - 10, '#fff7bd', 1, true);
    p.line(bx + 7, headY - 10, bx + 11, headY - 6, '#fff7bd', 1, true);
    p.ellipse(bx, headY - 6, 1.8, 1.8, '#ffffff', true);
    p.rect(bx - 5, headY, 10, 3, '#101524');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.rect(bx - 4, headY, 3, 2, '#59fff0', true);
    p.rect(bx + 1, headY, 3, 2, '#59fff0', true);
    p.px(bx - 3, headY, '#ffffff', true);
    p.px(bx + 2, headY, '#ffffff', true);
    p.setPart(SPRITE_PART.HEADWEAR);
    p.hline(bx - 4, headY + 4, 8, '#e3ecff');
    p.rect(bx - 1, headY + 5, 2, 2, '#d9304f');

    // [5] 外翘斜切霸气黄金大肩甲 + 雄壮屈肘格斗架势液压双臂与先攻火箭铁拳！
    p.setPart(SPRITE_PART.BACK_ARM);
    const lShOut = isAtk && (f === 1 || f === 2) ? 21 : 24;
    p.poly([[bx - lShOut, 15 + by], [bx - 14, 18 + by], [bx - 14, 29 + by], [bx - (lShOut - 1), 27 + by]], '#a66e20');
    p.poly([[bx - (lShOut - 1), 16 + by], [bx - 15, 19 + by], [bx - 15, 27 + by], [bx - (lShOut - 2), 25 + by]], '#f2c154');
    p.hline(bx - (lShOut - 1), 16 + by, lShOut - 15, '#fff5b8');
    const lFistX = isAtk && (f === 1 || f === 2) ? bx - 17 : bx - 19;
    const lFistY = 34 + by - Math.round(pose.stride * 2.5);
    p.line(bx - (lShOut - 5), 27 + by, lFistX, lFistY + 2, '#465478', 6);
    p.line(bx - (lShOut - 6), 27 + by, lFistX + 1, lFistY + 2, '#8295c4', 2);
    p.rect(lFistX - 5, lFistY - 1, 10, 10, '#b52440');
    p.rect(lFistX - 4, lFistY, 8, 6, '#f2c052');
    p.hline(lFistX - 3, lFistY, 6, '#fff6c2');

    p.setPart(SPRITE_PART.FRONT_ARM);
    p.poly([[bx + 14, 18 + by], [bx + 24, 15 + by], [bx + 23, 27 + by], [bx + 14, 29 + by]], '#ba7e26');
    p.poly([[bx + 15, 19 + by], [bx + 23, 16 + by], [bx + 22, 25 + by], [bx + 15, 27 + by]], '#ffd96b');
    p.hline(bx + 15, 16 + by, 8, '#ffffff');

    // 待机略微前抬屈肘蓄势拳架，攻击蓄力后拉 → 肘后喷焰先攻火箭重拳轰击！
    let fistX = bx + 20;
    let fistY = 33 + by + Math.round(pose.stride * 2.2);
    if (isAtk && f === 0) {
      fistX = bx + 13;
      fistY = 26 + by;
    } else if (isAtk && (f === 1 || f === 2)) {
      fistX = Math.min(50, bx + 23);
      fistY = 28 + by;
    }
    p.line(bx + 18, 27 + by, fistX, fistY + 2, '#52628c', 6);
    p.line(bx + 18, 26 + by, fistX, fistY + 1, '#99addb', 2);
    p.setPart(SPRITE_PART.WEAPON);
    p.rect(fistX - 4, fistY - 2, 10, 10, '#cc2b49');
    p.rect(fistX - 3, fistY - 1, 8, 6, '#ffe073');
    p.hline(fistX - 3, fistY - 1, 7, '#ffffff');
    p.hline(fistX - 3, fistY + 5, 8, '#7a1529');

    // 先攻火箭铁拳推进烈焰 + 拳锋金翠双重冲击波（左右双侧均 100% 零裁切！）
    if (isAtk && (f === 1 || f === 2)) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.poly([[bx + 17, 27 + by], [bx + 8, 24 + by], [bx + 11, 31 + by]], '#ff6624', true);
      p.poly([[bx + 16, 27 + by], [bx + 11, 26 + by], [bx + 12, 29 + by]], '#fff4a6', true);
      drawSlashArc64(p, Math.min(52, fistX + 3), fistY + 3, 8, 12, -1.25, 1.25, '#ff9824', '#ffe878', '#ffffff');
      drawSlashArc64(p, Math.min(54, fistX + 5), fistY + 3, 6, 9, -1.0, 1.0, '#4dfce8', '#ffffff', '#ffffff');
    }
  },
};

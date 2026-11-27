/**
 * 8. 魔导巨像（混沌 T4-A · 2×2 机械周身全扫）
 * 3/4 雄迈黑曜石碑巨身 + 斜切棱角晶肩 + 悬浮紫晶巨拳 + 混沌星晶炉心。
 */

import { drawSlashArc64, SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawSparkStar64, HD_BASE } from './helpers';

/** 魔导巨像（creature_arcane_colossus）HD 像素绘谱 */
export const CREATURE_ARCANE_COLOSSUS_RIG_SPEC: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0d0721',
  backdropBottom: '#2d144a',
  backdropGlow: '#c46bff',
  avatarCrop: { x: 12, y: 3, size: 40 },
  portraitCrop: { x: 1, y: 1, w: 62, h: 70 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx = isAtk && (f === 1 || f === 2) ? 26 : Math.round(30 + pose.leanX * 0.75);
    // 严控上浮确保移动帧弯曲金角 100% 零顶边裁切！
    const by = Math.max(0, Math.round(pose.breathY * 0.85 - pose.stepLift * 0.45) + 2);
    const st = Math.round(pose.stride * 3.4);
    const hover = Math.round(Math.sin(phase) * 1.6);

    // [1] 背后真·镂空断裂「古金魔导星环」+ 两枚斜立浮游紫水晶棱锥
    p.setPart(SPRITE_PART.BACK_ACC);
    const ringY = 27 + by;
    for (let i = 0; i < 36; i++) {
      if (i % 9 === 0 || i % 9 === 1) continue;
      const a = (i / 36) * Math.PI * 2 + phase * 0.35;
      const rx = Math.round(bx + Math.cos(a) * 22);
      const ry = Math.round(ringY + Math.sin(a) * 15);
      if (rx >= 3 && rx <= 60 && ry >= 4 && ry <= 65) {
        p.rect(rx, ry, 2, 2, i % 3 === 0 ? '#ffe478' : '#b866ff', true);
      }
    }
    const lcX = Math.max(5, bx - 23);
    const lcY = 16 + by + hover;
    p.poly([[lcX, lcY - 5], [lcX + 3, lcY], [lcX, lcY + 5], [lcX - 3, lcY]], '#c759ff', true);
    p.px(lcX, lcY - 2, '#ffffff', true);
    const rcX = Math.min(58, bx + 23);
    const rcY = 16 + by - hover;
    p.poly([[rcX, rcY - 5], [rcX + 3, rcY], [rcX, rcY + 5], [rcX - 3, rcY]], '#c759ff', true);
    p.px(rcX, rcY - 2, '#ffffff', true);

    // [2] 3/4 雄迈外八重装「黑曜符文石柱战胫」（左后撑腿 + 右前踏重腿，彻底告别呆板平行柱！）
    p.setPart(SPRITE_PART.LEGS);
    const lLift = pose.stride > 0.3 ? -2 : 0;
    const rLift = pose.stride < -0.3 ? -2 : 0;
    // 左后蹬支撑黑曜腿
    p.poly(
      [
        [bx - 11 - st, 44 + lLift],
        [bx - 3 - st, 44 + lLift],
        [bx - 6 - st, 63 + lLift],
        [bx - 17 - st, 63 + lLift],
      ],
      '#1d1036',
    );
    p.poly(
      [
        [bx - 10 - st, 45 + lLift],
        [bx - 4 - st, 45 + lLift],
        [bx - 7 - st, 61 + lLift],
        [bx - 14 - st, 61 + lLift],
      ],
      '#3d2769',
    );
    // 棱角金护膝 + 紫晶裂纹
    p.poly([[bx - 13 - st, 49 + lLift], [bx - 4 - st, 48 + lLift], [bx - 6 - st, 54 + lLift], [bx - 11 - st, 54 + lLift]], '#d9a438');
    p.hline(bx - 12 - st, 49 + lLift, 7, '#fff2ad');
    p.line(bx - 9 - st, 54 + lLift, bx - 11 - st, 61 + lLift, '#d978ff', 1, true);
    p.poly([[bx - 19 - st, 61 + lLift], [bx - 4 - st, 61 + lLift], [bx - 4 - st, 66 + lLift], [bx - 20 - st, 66 + lLift]], '#2c1a4d');
    p.hline(bx - 18 - st, 62 + lLift, 13, '#e8bc4f');

    // 右前跨受光黑曜重腿（3/4 立体高光面 + 紫晶灵脉！）
    p.poly(
      [
        [bx + 3 + st, 44 + rLift],
        [bx + 11 + st, 44 + rLift],
        [bx + 18 + st, 64 + rLift],
        [bx + 6 + st, 64 + rLift],
      ],
      '#29184a',
    );
    p.poly(
      [
        [bx + 4 + st, 45 + rLift],
        [bx + 10 + st, 45 + rLift],
        [bx + 15 + st, 62 + rLift],
        [bx + 7 + st, 62 + rLift],
      ],
      '#5d3f99',
    );
    p.line(bx + 9 + st, 46 + rLift, bx + 13 + st, 61 + rLift, '#9c7ae0', 2);
    p.poly([[bx + 4 + st, 48 + rLift], [bx + 13 + st, 49 + rLift], [bx + 12 + st, 55 + rLift], [bx + 6 + st, 55 + rLift]], '#ffd459');
    p.hline(bx + 5 + st, 49 + rLift, 7, '#ffffff');
    p.line(bx + 9 + st, 55 + rLift, bx + 11 + st, 62 + rLift, '#f09eff', 1, true);
    p.poly([[bx + 5 + st, 62 + rLift], [bx + 19 + st, 62 + rLift], [bx + 21 + st, 67 + rLift], [bx + 5 + st, 67 + rLift]], '#3a2366');
    p.hline(bx + 6 + st, 63 + rLift, 13, '#ffe478');

    // [3] 魔力悬空紫晶收腰 + 强倒三角 3D 斜切黑曜胸铠 + 裂石「混沌星晶炉心」！
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx, 42 + by, 7.2, 3.0, '#b84dff', true);
    p.hline(bx - 5, 42 + by, 10, '#fff0ff', true);
    // 分体黑曜金边前腰甲
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly([[bx - 11, 41 + by], [bx - 4, 41 + by], [bx - 5, 47 + by], [bx - 12, 46 + by]], '#332059');
    p.hline(bx - 11, 42 + by, 6, '#e6b84d');
    p.poly([[bx + 4, 41 + by], [bx + 11, 41 + by], [bx + 12, 46 + by], [bx + 5, 47 + by]], '#4b3180');
    p.hline(bx + 5, 42 + by, 6, '#ffe478');
    p.poly([[bx - 3, 41 + by], [bx + 3, 41 + by], [bx + 2, 48 + by], [bx, 50 + by], [bx - 2, 48 + by]], '#d9a438');
    p.vline(bx, 42 + by, 6, '#fff5bd');

    // 宏伟强倒三角 V 字立体黑曜巨胸甲
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 16, 21 + by], [bx + 16, 21 + by], [bx + 10, 40 + by], [bx - 10, 40 + by]], '#1b0f33');
    p.poly([[bx - 14, 22 + by], [bx + 14, 22 + by], [bx + 8, 39 + by], [bx - 8, 39 + by]], '#412a70');
    p.poly([[bx - 12, 22 + by], [bx + 12, 22 + by], [bx + 7, 28 + by], [bx - 7, 28 + by]], '#6847ad');
    // V 型古金符文胸棱
    p.line(bx - 14, 22 + by, bx - 8, 38 + by, '#e8bc4f', 2);
    p.line(bx + 14, 22 + by, bx + 8, 38 + by, '#ffe478', 2);
    p.hline(bx - 14, 22 + by, 28, '#ffe073');
    // 胸口裂石八角炉膛 + 璀璨混沌星晶核心！
    p.ellipse(bx, 31 + by, 6.8, 7.0, '#120724');
    p.setPart(SPRITE_PART.GLOW_FX);
    const pulse = isAtk ? 1.2 : pose.flutter > 0.3 ? 0.5 : 0;
    p.ellipse(bx, 31 + by, 5.4 + pulse, 5.6 + pulse, '#bd38ff', true);
    p.poly(
      [
        [bx, 24 + by - Math.round(pulse)],
        [bx + 5 + Math.round(pulse), 31 + by],
        [bx, 38 + by + Math.round(pulse)],
        [bx - 5 - Math.round(pulse), 31 + by],
      ],
      '#ffe059',
      true,
    );
    p.poly([[bx, 27 + by], [bx + 3, 31 + by], [bx, 35 + by], [bx - 3, 31 + by]], '#ffffff', true);

    // [4] 3/4 棱角「悬空黑曜魔冠石雕巨首」（弯曲双金角严控 y>=4 + 锐利单目裂隙！）
    const hy = 13 + by + Math.round(hover * 0.4);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.hline(bx - 4, hy + 7, 9, '#d966ff', true);
    p.hline(bx - 2, hy + 7, 5, '#ffffff', true);

    p.setPart(SPRITE_PART.HEADWEAR);
    const hornTopY = Math.max(4, hy - 8);
    p.bezierRibbon([bx - 6, hy - 1], [bx - 13, hy - 3], [bx - 12, hornTopY], 3.0, 0.9, '#c78820');
    p.bezierRibbon([bx - 6, hy - 2], [bx - 12, hy - 3], [bx - 12, hornTopY], 1.3, 0.5, '#fff299', true);
    p.bezierRibbon([bx + 6, hy - 1], [bx + 13, hy - 3], [bx + 12, hornTopY], 3.0, 0.9, '#e0a22e');
    p.bezierRibbon([bx + 6, hy - 2], [bx + 12, hy - 3], [bx + 12, hornTopY], 1.3, 0.5, '#ffffff', true);

    p.poly([[bx - 7, hy - 4], [bx + 1, hy - 8], [bx + 8, hy - 4], [bx + 7, hy + 4], [bx + 1, hy + 6], [bx - 6, hy + 4]], '#221340');
    p.poly([[bx - 5, hy - 3], [bx + 1, hy - 7], [bx + 6, hy - 3], [bx + 6, hy + 3], [bx + 1, hy + 5], [bx - 4, hy + 3]], '#6243a1');
    p.line(bx - 4, hy - 3, bx + 1, hy - 7, '#b596f0', 1);
    p.px(bx + 1, hy - 7, '#ffe878', true);
    // 3/4 偏右炽亮紫金魔导目镜
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.rect(bx - 3, hy - 1, 9, 3, '#10061f');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.hline(bx - 2, hy, 7, '#ff52e0', true);
    p.hline(bx, hy, 4, '#fff8cc', true);

    // [5] 外翘斜切黑曜重肩甲（带生长紫晶尖刺！）+ 紫电牵引的「巨型棱角悬空紫晶铁拳」！
    // 左斜切巨肩甲 + 左悬空晶拳
    p.setPart(SPRITE_PART.BACK_ARM);
    const lShOut = Math.max(4, bx - 23);
    p.poly([[lShOut, 18 + by], [bx - 13, 21 + by], [bx - 12, 31 + by], [lShOut + 1, 30 + by]], '#2d1a52');
    p.poly([[lShOut + 1, 19 + by], [bx - 14, 22 + by], [bx - 13, 29 + by], [lShOut + 2, 28 + by]], '#583b94');
    p.line(lShOut, 18 + by, bx - 13, 21 + by, '#ffe073', 2);
    // 肩顶紫水晶刺
    p.poly([[lShOut + 2, 18 + by], [lShOut + 4, 13 + by], [lShOut + 7, 19 + by]], '#d470ff', true);

    const lfX = Math.max(8, bx - 21);
    const lfY = isAtk && f === 0 ? 33 + by : 39 + by - Math.round(pose.stride * 2.2);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.line(lShOut + 5, 31 + by, lfX + 1, lfY, '#c759ff', 2, true);
    p.line(lShOut + 6, 31 + by, lfX + 2, lfY, '#ffffff', 1, true);
    p.setPart(SPRITE_PART.BACK_ARM);
    p.poly([[lfX - 5, lfY], [lfX + 5, lfY], [lfX + 5, lfY + 9], [lfX, lfY + 13], [lfX - 5, lfY + 10]], '#231340');
    p.poly([[lfX - 4, lfY + 1], [lfX + 4, lfY + 1], [lfX + 4, lfY + 8], [lfX, lfY + 11], [lfX - 4, lfY + 8]], '#5e3f9e');
    p.hline(lfX - 4, lfY + 9, 9, '#e078ff', true);
    p.rect(lfX - 1, lfY + 3, 3, 3, '#ffe478', true);

    // 右斜切巨肩甲 + 雄壮前抬格斗架势「右悬空魔导巨拳」（比左拳略前高，3/4 霸气不对称！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    const rShOut = Math.min(58, bx + 23);
    p.poly([[bx + 13, 21 + by], [rShOut, 18 + by], [rShOut - 1, 30 + by], [bx + 12, 31 + by]], '#3b2469');
    p.poly([[bx + 14, 22 + by], [rShOut - 1, 19 + by], [rShOut - 2, 28 + by], [bx + 13, 29 + by]], '#7752bf');
    p.line(bx + 13, 21 + by, rShOut, 18 + by, '#ffe885', 2);
    p.poly([[rShOut - 2, 18 + by], [rShOut - 4, 13 + by], [rShOut - 7, 19 + by]], '#e085ff', true);

    let rfX = Math.min(52, bx + 21);
    let rfY = 33 + by + Math.round(pose.stride * 2.2);
    if (isAtk && f === 0) {
      rfX = bx + 15;
      rfY = 25 + by;
    } else if (isAtk && (f === 1 || f === 2)) {
      rfX = Math.min(52, bx + 24);
      rfY = 31 + by;
    }
    p.setPart(SPRITE_PART.GLOW_FX);
    p.line(rShOut - 5, 31 + by, rfX - 2, rfY + 2, '#d470ff', 2, true);
    p.line(rShOut - 6, 31 + by, rfX - 3, rfY + 2, '#ffffff', 1, true);

    p.setPart(SPRITE_PART.WEAPON);
    p.poly([[rfX - 6, rfY], [rfX + 6, rfY], [rfX + 7, rfY + 10], [rfX + 1, rfY + 14], [rfX - 6, rfY + 10]], '#2d1a52');
    p.poly([[rfX - 4, rfY + 1], [rfX + 5, rfY + 1], [rfX + 5, rfY + 9], [rfX + 1, rfY + 12], [rfX - 4, rfY + 9]], '#7b55c7');
    p.hline(rfX - 4, rfY + 1, 9, '#cdb8ff');
    // 前侧锋利紫晶指节刃！
    p.poly([[rfX + 5, rfY + 2], [rfX + 8, rfY + 5], [rfX + 6, rfY + 9]], '#e89eff', true);
    p.hline(rfX - 5, rfY + 10, 11, '#f29eff', true);
    p.rect(rfX - 1, rfY + 4, 3, 3, '#ffe878', true);

    // 攻击爆发：周身全扫紫金双弧冲击波（横扫全周，气吞山河！）
    if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, Math.min(50, rfX + 1), rfY + 6, 10, 16, -1.25, 1.25, '#a833ff', '#ffe066', '#ffffff');
      drawSlashArc64(p, bx, 38 + by, 24, 9, 0.2, 2.95, '#9933ff', '#f08cff', '#fff6bd');
      drawSparkStar64(p, Math.min(59, rfX + 7), rfY - 4, 2, '#ffe878');
    }
  },
};

/**
 * 6. 梦境兽（混沌 T3-A · 2×1 暗系星梦喰梦兽）
 * 俊逸流线梦驹首 + 镂空黄金新月冠 + 3D 环绕梦魂玉 + 锥形纤腿月蹄 + 星云长鬃尾。
 */

import { drawSlashArc64, SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawSparkStar64, HD_BASE } from './helpers';

/** 梦境兽（creature_nightmare）HD 像素绘谱 */
export const CREATURE_NIGHTMARE_RIG_SPEC: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0d0926',
  backdropBottom: '#2b1652',
  backdropGlow: '#ff70b8',
  avatarCrop: { x: 20, y: 4, size: 36 },
  portraitCrop: { x: 2, y: 2, w: 60, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const fl = Math.round(pose.flutter * 2.4);

    let hipX = 19;
    let hipY = 46;
    let chestX = 33;
    let chestY = 39;
    let headX = 38;
    let headY = 22;
    let farHind: [number, number] = [11, 63];
    let nearHind: [number, number] = [18, 65];
    let farFore: [number, number] = [36, 63];
    let nearForeKnee: [number, number] = [40, 49];
    let nearFore: [number, number] = [44, 57];
    let waveStage: 0 | 1 | 2 = 0;
    let eyeFlare = false;

    if (isAtk) {
      if (f === 0) {
        hipX = 19; hipY = 49; chestX = 27; chestY = 35; headX = 32; headY = 19;
        farHind = [11, 63]; nearHind = [19, 65];
        farFore = [38, 48]; nearForeKnee = [36, 40]; nearFore = [44, 37];
        eyeFlare = true;
      } else if (f === 1) {
        hipX = 15; hipY = 45; chestX = 28; chestY = 38; headX = 34; headY = 23;
        farHind = [7, 60]; nearHind = [14, 63];
        farFore = [38, 50]; nearForeKnee = [37, 43]; nearFore = [45, 44];
        waveStage = 1;
        eyeFlare = true;
      } else if (f === 2) {
        hipX = 17; hipY = 46; chestX = 31; chestY = 39; headX = 37; headY = 24;
        farHind = [10, 62]; nearHind = [17, 64];
        farFore = [39, 54]; nearForeKnee = [39, 47]; nearFore = [46, 51];
        waveStage = 2;
        eyeFlare = true;
      } else {
        hipX = 19; hipY = 47; chestX = 33; chestY = 40; headX = 38; headY = 23;
        farHind = [11, 63]; nearHind = [18, 65];
        farFore = [36, 63]; nearForeKnee = [40, 50]; nearFore = [44, 60];
      }
    } else if (isMove) {
      if (f === 0) {
        hipX = 16; hipY = 45; chestX = 32; chestY = 38; headX = 39; headY = 21;
        farHind = [8, 61]; nearHind = [14, 63]; farFore = [42, 59]; nearForeKnee = [41, 47]; nearFore = [48, 55];
      } else if (f === 1) {
        hipX = 19; hipY = 40; chestX = 33; chestY = 34; headX = 39; headY = 18;
        farHind = [12, 54]; nearHind = [17, 56]; farFore = [39, 51]; nearForeKnee = [41, 42]; nearFore = [46, 48];
      } else if (f === 2) {
        hipX = 21; hipY = 46; chestX = 34; chestY = 39; headX = 40; headY = 23;
        farHind = [16, 62]; nearHind = [22, 64]; farFore = [36, 62]; nearForeKnee = [39, 50]; nearFore = [42, 60];
      } else {
        hipX = 17; hipY = 43; chestX = 32; chestY = 36; headX = 39; headY = 20;
        farHind = [9, 58]; nearHind = [15, 60]; farFore = [43, 55]; nearForeKnee = [41, 45]; nearFore = [48, 51];
      }
    } else if (isHit) {
      const back = f === 0 ? -4 : -2;
      hipX = 18 + back; hipY = 49; chestX = 29 + back; chestY = 43; headX = 34 + back; headY = 27;
      farHind = [11 + back, 63]; nearHind = [17 + back, 65];
      farFore = [35 + back, 62]; nearForeKnee = [35 + back, 52]; nearFore = [39 + back, 59];
    } else {
      const by = Math.round(pose.breathY * 1.3);
      hipY = 46 + by;
      chestY = 39 + by;
      headY = 22 + by;
      nearForeKnee = [40, 49 + by];
      nearFore = [44, 56 + by];
    }

    const drawDreamOrb64 = (ox: number, oy: number, variant: number, isFront: boolean) => {
      p.setPart(isFront ? SPRITE_PART.GLOW_FX : SPRITE_PART.BACK_ACC);
      const outer = variant === 0 ? '#ff3378' : variant === 1 ? '#7d59ff' : '#ff8cc8';
      const inner = variant === 0 ? '#ffb8d2' : variant === 1 ? '#dbd0ff' : '#fff5bf';
      p.ellipse(ox, oy, 3.0, 3.0, outer, true);
      p.ellipse(ox, oy, 1.6, 1.6, inner, true);
      p.px(ox - 1, oy - 1, '#ffffff', true);
    };

    // 辅助绘制精致「斜切月蹄 + 轻盈星雾距毛」（彻底告别粉红圆球脚！）
    const drawDreamHoof = (fx: number, fy: number, isNear: boolean) => {
      // 踝部飘逸星雾距毛
      p.line(fx - 3, fy - 2, fx, fy - 3, isNear ? '#eb94ff' : '#8e6de0', 1, true);
      // 锐利斜切星蹄
      p.poly(
        [
          [fx - 2, fy - 2],
          [fx + 2, fy - 2],
          [fx + 4, fy + 1],
          [fx - 1, fy + 1],
        ],
        isNear ? '#ff5ca8' : '#7857d6',
        true,
      );
      p.hline(fx - 1, fy - 1, 4, isNear ? '#ffe0f2' : '#c7b8ff', true);
      p.px(fx + 3, fy, '#ffffff', true);
    };

    // [1] 后景 3D 椭圆轨道梦魂玉
    const orbRadius = isAtk && f === 0 ? 15 : 20;
    for (let i = 0; i < 3; i++) {
      const a = phase + (i * Math.PI * 2) / 3;
      if (Math.sin(a) < 0) {
        const ox = Math.max(4, Math.min(60, Math.round(chestX - 2 + Math.cos(a) * orbRadius)));
        const oy = Math.max(5, Math.min(64, Math.round(chestY - 2 + Math.sin(a) * 8 - Math.cos(a) * 3)));
        drawDreamOrb64(ox, oy, i, false);
      }
    }

    // [2] 流动卷曲星云梦雾大长尾（轻盈S形云焰 + 星屑！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const tx = Math.max(5, hipX - 13);
    const ty = Math.max(18, hipY - 12 + fl);
    p.bezierRibbon([hipX - 5, hipY - 1], [hipX - 13, hipY - 2], [tx + 2, ty + 3], 5.4, 2.2, '#47248a');
    p.bezierRibbon([hipX - 6, hipY - 2], [hipX - 13, hipY - 4], [tx + 1, ty], 3.2, 1.4, '#c27aff', true);
    p.ellipse(tx + 2, ty + 1, 4.4, 3.4, '#7d3ecc', true);
    p.ellipse(tx + 1, ty - 2, 3.2, 2.5, '#ff7ec4', true);
    p.px(tx + 1, ty - 2, '#ffffff', true);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(Math.max(3, tx - 3), ty + 4, '#ffe885', true);
    p.px(tx + 6, ty - 5, '#9ceeff', true);

    // [3] 远侧纤细收束星夜兽肢 + 斜切梦蹄
    p.setPart(SPRITE_PART.LEGS);
    p.bezierRibbon([hipX - 3, hipY + 3], [Math.round((hipX + farHind[0]) * 0.5) - 2, Math.round((hipY + farHind[1]) * 0.5)], [farHind[0], farHind[1] - 1], 4.8, 2.0, '#1e1345');
    drawDreamHoof(farHind[0], farHind[1], false);
    p.bezierRibbon([chestX + 1, chestY + 3], [Math.round((chestX + farFore[0]) * 0.5) + 1, Math.round((chestY + farFore[1]) * 0.5)], [farFore[0], farFore[1] - 1], 4.4, 1.9, '#261857');
    drawDreamHoof(farFore[0], farFore[1], false);

    // [4] 优雅流线星夜神驹躯干（宽胸收腰 + 深靛星空毛色 + 月白胸腹 + 星座连点！）
    p.setPart(SPRITE_PART.TORSO);
    p.bezierRibbon([hipX, hipY], [Math.round((hipX + chestX) * 0.5), Math.round((hipY + chestY) * 0.5) + 2], [chestX, chestY], 12.2, 13.8, '#231857');
    p.ellipse(hipX, hipY, 7.6, 6.4, '#231857');
    p.ellipse(hipX + 1.5, hipY - 1.5, 5.6, 4.4, '#4b38a3');
    p.ellipse(chestX, chestY, 8.6, 7.4, '#302270');
    p.ellipse(chestX + 1.5, chestY - 1.5, 6.4, 5.4, '#624ec7');
    // 柔和银月白胸腹过渡
    p.ellipse(chestX + 3, chestY + 3, 5.0, 3.8, '#e3dcff');
    p.ellipse(chestX + 3, chestY + 2, 3.2, 2.4, '#ffffff');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(hipX - 1, hipY - 2, '#ff9ee0', true);
    p.px(hipX + 3, hipY - 3, '#ffe899', true);
    p.px(chestX - 3, chestY - 3, '#9ce8ff', true);
    p.px(chestX - 7, hipY - 1, '#ffffff', true);

    // 颈间绯粉梦境缎带项圈 + 鎏金星铃
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.line(chestX - 5, chestY - 5, chestX + 7, chestY + 1, '#bf1f64', 3);
    p.line(chestX - 4, chestY - 5, chestX + 6, chestY, '#ff73b5', 1);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(chestX + 6, chestY + 2, 2.6, 2.6, '#ffe066', true);
    p.px(chestX + 5, chestY + 1, '#ffffff', true);

    // [5] 近侧优雅肌肉收束兽肢（健美大腿/肩臂 → 纤细关节 → 斜切星蹄！）
    p.setPart(SPRITE_PART.LEGS);
    const hHockX = Math.round((hipX + nearHind[0]) * 0.5) - 2;
    const hHockY = Math.round((hipY + nearHind[1]) * 0.5) + 1;
    p.bezierRibbon([hipX, hipY + 3], [hHockX, hHockY], [nearHind[0], nearHind[1] - 2], 6.4, 2.2, '#433194');
    p.bezierRibbon([hipX + 1, hipY + 2], [hHockX + 1, hHockY], [nearHind[0] + 1, nearHind[1] - 2], 3.4, 1.1, '#7c69db');
    p.hline(nearHind[0] - 1, nearHind[1] - 4, 4, '#fff2ff');
    drawDreamHoof(nearHind[0], nearHind[1], true);

    p.setPart(SPRITE_PART.FRONT_ARM);
    p.bezierRibbon([chestX + 2, chestY + 2], [nearForeKnee[0], nearForeKnee[1]], [nearFore[0], nearFore[1] - 2], 5.6, 2.1, '#5844bd');
    p.bezierRibbon([chestX + 3, chestY + 1], [nearForeKnee[0] + 1, nearForeKnee[1] - 1], [nearFore[0] + 1, nearFore[1] - 2], 2.6, 1.0, '#a999ff');
    p.hline(nearFore[0] - 1, nearFore[1] - 4, 4, '#fff2ff');
    drawDreamHoof(nearFore[0], nearFore[1], true);

    // [6] 优雅弧形 S 颈 + 飞扬星云梦雾长鬃 + 俊逸流线星梦奇兽头颅 + 真·镂空黄金新月冠！
    const hx = headX;
    const hy = headY;
    // 流畅 S 弯脖颈（彻底取代僵直圆柱！）
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.bezierRibbon([chestX - 1, chestY - 2], [chestX + 1, Math.round((chestY + hy) * 0.5)], [hx, hy + 2], 8.2, 5.2, '#34257a');
    p.bezierRibbon([chestX + 1, chestY - 2], [chestX + 2, Math.round((chestY + hy) * 0.5)], [hx + 1, hy + 2], 5.0, 3.0, '#6a56cc');
    p.bezierRibbon([chestX + 3, chestY - 1], [chestX + 4, Math.round((chestY + hy) * 0.5)], [hx + 3, hy + 3], 2.4, 1.4, '#e0d8ff');

    // 飘渺流动多缕星云长鬃（从头顶顺颈背飘向后方！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.bezierRibbon([hx - 2, hy - 5], [hx - 12 + fl * 0.4, hy + 2], [chestX - 11 + fl * 0.6, chestY - 2], 5.8, 2.0, '#6b34ba');
    p.bezierRibbon([hx - 2, hy - 4], [hx - 10 + fl * 0.3, hy + 2], [chestX - 8 + fl * 0.5, chestY - 3], 3.4, 1.2, '#eb80ff', true);
    p.bezierRibbon([hx - 1, hy - 5], [hx - 7 + fl * 0.3, hy], [chestX - 6 + fl * 0.4, chestY - 5], 1.5, 0.6, '#fff2ff', true);

    // 灵动后掠尖耳（修长高雅，受击压耳）
    p.setPart(SPRITE_PART.HEADWEAR);
    const earDrop = isHit ? 4 : 0;
    p.poly([[hx - 4, hy - 4], [hx - 12, hy - 12 + earDrop], [hx - 1, hy - 7]], '#3b2987');
    p.poly([[hx - 4, hy - 5], [hx - 9, hy - 10 + earDrop], [hx - 2, hy - 7]], '#ff99d6', true);
    p.poly([[hx + 1, hy - 5], [hx - 2, hy - 14 + earDrop], [hx + 6, hy - 5]], '#624dc4');
    p.poly([[hx + 1, hy - 6], [hx - 1, hy - 11 + earDrop], [hx + 4, hy - 6]], '#ffb8e4', true);

    // 纯透明真·镂空精雕「浮空黄金新月冠」
    p.setPart(SPRITE_PART.GLOW_FX);
    const mx = hx + 2;
    const my = Math.max(7, hy - 12 + Math.round(Math.sin(phase) * 1.1));
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const inOuter = dx * dx + dy * dy <= 20;
        const inCut = (dx - 2.3) * (dx - 2.3) + (dy + 0.6) * (dy + 0.6) <= 13;
        if (inOuter && !inCut) {
          p.px(mx + dx, my + dy, dx < -1 ? '#ffffff' : dy < 0 ? '#fff5b8' : '#f2be3d', true);
        }
      }
    }

    // 俊逸高贵的流线梦驹/麒麟奇兽头颅（深靛星冠自然过渡至银白修长吻鼻，彻底告别白面具羊驼感！）
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.poly(
      [
        [hx - 4, hy - 5],
        [hx + 5, hy - 5],
        [hx + 14, hy + 1],
        [hx + 13, hy + 5],
        [hx + 4, hy + 6],
        [hx - 4, hy + 4],
      ],
      '#36267d',
    );
    p.poly(
      [
        [hx - 2, hy - 4],
        [hx + 5, hy - 4],
        [hx + 13, hy + 1],
        [hx + 12, hy + 4],
        [hx + 3, hy + 5],
        [hx - 2, hy + 3],
      ],
      '#7864d4',
    );
    // 额梁至吻尖的柔滑珍珠白星光面颊渐变
    p.poly(
      [
        [hx + 3, hy - 3],
        [hx + 13, hy + 1],
        [hx + 12, hy + 4],
        [hx + 5, hy + 4],
      ],
      '#ede8ff',
    );
    p.line(hx + 4, hy - 3, hx + 13, hy + 1, '#ffffff', 1);
    // 精巧暗紫鼻尖 + 额心幻梦宝石
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.rect(hx + 12, hy + 1, 2, 2, '#3d2166');
    p.px(hx + 4, hy - 3, '#ff4593', true);
    p.px(hx + 6, hy - 2, '#ffe478', true);
    // 魅惑锐利猩红金瞳 + 纤细睫影
    if (pose.expr === 'hurt') {
      p.hline(hx + 2, hy, 4, '#241240');
    } else if (pose.blink) {
      p.hline(hx + 2, hy + 1, 4, '#2f1a59');
    } else {
      p.hline(hx + 2, hy - 1, 5, '#1d0a36');
      p.rect(hx + 3, hy, 4, 2, eyeFlare ? '#ff1766' : '#eb2668', true);
      p.px(hx + 3, hy, '#fff8bf', true);
      p.px(hx + 6, hy + 1, '#ffa8d6', true);
    }

    // [7] 前景 3D 椭圆轨道梦魂玉
    for (let i = 0; i < 3; i++) {
      const a = phase + (i * Math.PI * 2) / 3;
      if (Math.sin(a) >= 0) {
        const ox = Math.max(4, Math.min(60, Math.round(chestX - 2 + Math.cos(a) * orbRadius)));
        const oy = Math.max(5, Math.min(64, Math.round(chestY - 2 + Math.sin(a) * 8 - Math.cos(a) * 3)));
        drawDreamOrb64(ox, oy, i, true);
      }
    }

    // [8] 攻击净空「双层圆弧梦魇震慑波 + 疾射猩红梦魂玉」
    if (waveStage === 1) {
      drawSlashArc64(p, 46, 30, 8, 12, -1.15, 1.15, '#c438ff', '#ff4d9e', '#fff6bd');
      drawSlashArc64(p, 51, 30, 9, 15, -1.15, 1.15, '#7a33ff', '#ff8cd1', '#ffffff');
      drawDreamOrb64(55, 30, 0, true);
    } else if (waveStage === 2) {
      drawSlashArc64(p, 52, 30, 9, 15, -1.15, 1.15, '#8f47ff', '#ffe478', '#ffffff');
      drawSparkStar64(p, 58, 22, 2, '#ff80c4');
      drawSparkStar64(p, 59, 38, 2, '#ffe885');
    }
  },
};

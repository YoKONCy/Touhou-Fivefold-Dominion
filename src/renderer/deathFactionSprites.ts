/**
 * 幽冥公馆 · 死亡系（蕾米莉亚 + 8 位死亡城镇兵种 + 深渊冰魔）v3 大师级精雕 48×54 像素立绘绘谱
 *
 * 视觉美学标准（全面对标博丽灵梦、退魔剑士、祈祷巫女、极星红莲魔龙等顶级标杆）：
 * - 彻底摒弃死板正面木偶与对称站桩，全员采用 3/4 动感侧身构图、错步双腿、独立双臂手持武器与 4 帧完整挥击光弧！
 * - 尸壳：正统「骸骨体质」——立体雕琢苍白骷髅头颅（深眼窝燃幽青冥火）+ 破损暗紫兜帽披风 + 清晰镂空肋骨胸腔 + 冥铁圆盾与幽青骨刃！
 * - 骸骨巨龙：对标极星红莲魔龙的史诗级凶猛骨龙王——高眉脊獠牙凶首 + 后弯象牙镰角 + 多指骨撕裂紫焰翼膜 + 镂空燃魂胸肋 + 张颌冥焰龙息！
 * - 蕾米莉亚/小恶魔/怨灵/地狱鸦/血族眷属/毒瘴妖/深渊隙间恶魔/深渊冰魔：全员萌系幻想乡美少女高对比度精雕，剪影辨识度拉满！
 */

import {
  drawChibiFaceEyes,
  type PixelPainter,
  type RigPose,
  type SpriteRigSpec,
} from './voxelSprites';

/** 辅助绘制正圆（复用 PixelPainter.ellipse） */
function drawCircle(
  p: PixelPainter,
  cx: number,
  cy: number,
  r: number,
  color: string,
  emissive = false,
): void {
  p.ellipse(cx, cy, r, r, color, emissive);
}

/** 辅助绘制精致菱晶（复用 PixelPainter.poly） */
function drawDiamond(
  p: PixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  emissive = false,
): void {
  p.poly(
    [
      [cx, cy - ry],
      [cx + rx, cy],
      [cx, cy + ry],
      [cx - rx, cy],
    ],
    color,
    emissive,
  );
}

/** 标杆级少女柔和鹅蛋脸 + 自然细颈（严格对齐灵梦/退魔剑士比例） */
function drawMaidenHead(
  p: PixelPainter,
  bx: number,
  headY: number,
  skin = '#ffe9dc',
  shadow = '#e5b69e',
): void {
  p.rect(bx - 1, headY + 4, 3, 3, shadow);
  p.ellipse(bx, headY, 5.3, 4.9, skin);
  p.hline(bx - 3, headY + 4, 7, shadow);
  p.px(bx - 4, headY + 3, shadow);
  p.px(bx + 4, headY + 3, shadow);
  p.hline(bx - 2, headY - 4, 4, '#fff7f0');
}

/** 标杆级圆润柔顺发冠 + 分缕空气刘海 + 天使环高光 */
function drawMaidenCrown(
  p: PixelPainter,
  bx: number,
  headY: number,
  dark: string,
  mid: string,
  light: string,
  spec: string,
): void {
  p.ellipse(bx, headY - 4.3, 6.1, 3.5, dark);
  p.ellipse(bx, headY - 4.7, 5.1, 2.6, mid);
  p.hline(bx - 4, headY - 6, 8, light);
  p.hline(bx - 2, headY - 7, 4, spec);
  p.px(bx - 5, headY - 2, dark);
  p.px(bx - 3, headY - 2, mid);
  p.px(bx, headY - 2, dark);
  p.px(bx + 3, headY - 2, mid);
  p.px(bx + 5, headY - 2, dark);
}

/** 柔和包颊双鬓（修脸型、去方框感） */
function drawMaidenLocks(
  p: PixelPainter,
  bx: number,
  headY: number,
  dark: string,
  light: string,
  lenLeft = 7,
  lenRight = 6,
): void {
  p.poly(
    [
      [bx - 6, headY - 3],
      [bx - 4, headY - 2],
      [bx - 5, headY + lenLeft],
      [bx - 7, headY + lenLeft - 2],
    ],
    dark,
  );
  p.vline(bx - 6, headY - 1, Math.max(2, lenLeft - 2), light);
  p.poly(
    [
      [bx + 4, headY - 2],
      [bx + 6, headY - 3],
      [bx + 7, headY + lenRight - 2],
      [bx + 5, headY + lenRight],
    ],
    dark,
  );
  p.vline(bx + 5, headY - 1, Math.max(2, lenRight - 2), light);
}

/** 绘制非对称 3/4 层次蝠翼（后翼大幅舒展，前翼略收形成立体纵深！） */
function drawAsymBatWings(
  p: PixelPainter,
  bx: number,
  cy: number,
  leftSpan: number,
  rightSpan: number,
  height: number,
  flap: number,
  outer: string,
  inner: string,
  rib: string,
): void {
  // 左侧主翼（大展角，高对比扇形骨翼膜）
  p.poly(
    [
      [bx - 2, cy],
      [bx - leftSpan, cy - height + flap],
      [bx - Math.round(leftSpan * 0.94), cy + 1 + flap],
      [bx - Math.round(leftSpan * 0.65), cy - 1 + Math.round(flap * 0.6)],
      [bx - Math.round(leftSpan * 0.56), cy + 5 + Math.round(flap * 0.4)],
      [bx - Math.round(leftSpan * 0.32), cy + 2 + Math.round(flap * 0.3)],
      [bx - 2, cy + 5],
    ],
    outer,
  );
  p.poly(
    [
      [bx - 4, cy + 1],
      [bx - Math.round(leftSpan * 0.85), cy - Math.round(height * 0.72) + flap],
      [bx - Math.round(leftSpan * 0.62), cy + Math.round(flap * 0.5)],
      [bx - Math.round(leftSpan * 0.36), cy + 2 + Math.round(flap * 0.3)],
    ],
    inner,
  );
  p.line(bx - 2, cy, bx - leftSpan, cy - height + flap, rib, 1);
  p.line(
    bx - Math.round(leftSpan * 0.55),
    cy - Math.round(height * 0.52) + Math.round(flap * 0.6),
    bx - Math.round(leftSpan * 0.65),
    cy + 3 + Math.round(flap * 0.4),
    rib,
    1,
  );

  // 右侧远翼（略小略高，营造 3/4 立体层次）
  p.poly(
    [
      [bx + 3, cy - 1],
      [bx + rightSpan, cy - Math.round(height * 0.92) + flap],
      [bx + Math.round(rightSpan * 0.9), cy + 2 + flap],
      [bx + Math.round(rightSpan * 0.55), cy + Math.round(flap * 0.5)],
      [bx + Math.round(rightSpan * 0.38), cy + 4 + Math.round(flap * 0.3)],
      [bx + 3, cy + 4],
    ],
    outer,
  );
  p.poly(
    [
      [bx + 4, cy],
      [bx + Math.round(rightSpan * 0.8), cy - Math.round(height * 0.64) + flap],
      [bx + Math.round(rightSpan * 0.54), cy + Math.round(flap * 0.5)],
    ],
    inner,
  );
  p.line(bx + 3, cy - 1, bx + rightSpan, cy - Math.round(height * 0.92) + flap, rib, 1);
}

/** 绘制连续饱满的弯月斩击光弧（对标退魔剑士高质感剑气） */
function drawSlashArc(
  p: PixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  aStart: number,
  aEnd: number,
  outerColor: string,
  innerColor: string,
): void {
  const segs = 10;
  for (let i = 0; i < segs; i++) {
    const a0 = aStart + (i / segs) * (aEnd - aStart);
    const a1 = aStart + ((i + 1) / segs) * (aEnd - aStart);
    const ox0 = Math.round(cx + Math.cos(a0) * rx);
    const oy0 = Math.round(cy + Math.sin(a0) * ry);
    const ox1 = Math.round(cx + Math.cos(a1) * rx);
    const oy1 = Math.round(cy + Math.sin(a1) * ry);
    const ix0 = Math.round(cx + Math.cos(a0) * (rx - 2));
    const iy0 = Math.round(cy + Math.sin(a0) * (ry - 2));
    const ix1 = Math.round(cx + Math.cos(a1) * (rx - 2));
    const iy1 = Math.round(cy + Math.sin(a1) * (ry - 2));
    const thick = i >= 2 && i <= 7 ? 2 : 1;
    p.line(ox0, oy0, ox1, oy1, outerColor, thick, true);
    p.line(ix0, iy0, ix1, iy1, i >= 3 && i <= 7 ? '#ffffff' : innerColor, 1, true);
  }
}

export const DEATH_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  // =========================================================================
  // 1. 英雄：蕾米莉亚·斯卡雷特（永远鲜红的幼月 · 红魔馆之主）
  //    3/4 优雅浮空红魔大小姐 + 高展六骨漆黑绯边蝠翼 + 蕾丝白ZUN帽 + 投掷神枪冈格尼尔！
  // =========================================================================
  hero_remilia: {
    backdropTop: '#210716',
    backdropBottom: '#47102b',
    backdropGlow: '#ff4275',
    avatarCrop: { x: 8, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 18 : Math.round(21 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 1.1 - pose.stepLift - 1);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 2.5 + pose.flutter * 1.1);
      const sway = Math.round(pose.flutter * 1.4);
      const stride = Math.round(pose.stride * 2.8);
      const headY = 18 + by;

      // [部件 1] 华丽高展的非对称红魔蝠翼（翼展宏大气派、清晰指骨纹理！）
      drawAsymBatWings(p, bx, 26 + by, 18, 13, 12, flap, '#1c081b', '#5e1439', '#ff4d7d');

      // 淡银浅蓝微卷蓬松短发背影（飘逸弧线）
      p.poly(
        [
          [bx - 7, headY - 1],
          [bx + 6, headY - 1],
          [bx + 7 - Math.round(sway * 0.4), headY + 7],
          [bx - 9 + Math.round(sway * 0.5), headY + 7],
        ],
        '#6c82b8',
      );
      p.ellipse(bx, headY + 1, 6.4, 5.0, '#b0c5f2');

      // [部件 2] 3/4 娇小优雅站姿双腿（秀气雪白长袜 + 鲜红玛丽珍鞋，彻底告别外八撇腿！）
      const backLift = pose.stride > 0.3 ? -2 : 0;
      const frontLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(bx - 4 - stride, 42 + backLift, 3, 5, '#e8e4f5');
      p.rect(bx - 5 - stride, 46 + backLift, 4, 3, '#a81439');
      p.rect(bx + 2 + stride, 42 + frontLift, 3, 5, '#ffffff');
      p.rect(bx + 2 + stride, 46 + frontLift, 4, 3, '#e62250');
      p.px(bx + 4 + stride, 47 + frontLift, '#ffe899');

      // [部件 3] 优雅轻抬的左后臂（泡泡袖 + 托起鲜红幼月灵粒，留足净空！）
      p.poly(
        [
          [bx - 5, 26 + by],
          [bx - 10, 29 + by],
          [bx - 10, 32 + by],
          [bx - 5, 30 + by],
        ],
        '#ffe5f0',
      );
      p.rect(bx - 11, 30 + by, 2, 2, '#fff0ea');
      drawCircle(p, bx - 13, 27 + by + Math.round(sway * 0.5), 1.8, '#ff4d7d', true);
      p.px(bx - 13, 26 + by + Math.round(sway * 0.5), '#ffffff', true);

      // [部件 4] 立体褶皱浅粉白哥特蓬蓬洋装 + 鲜红腰带大蝴蝶结 + 逐像素波浪蕾丝裙摆
      const sk = Math.round(-pose.leanX * 0.5 + sway * 0.6);
      p.poly(
        [
          [bx - 5, 31 + by],
          [bx + 5, 31 + by],
          [bx + 11 + sk, 43 + by],
          [bx - 12 + sk, 43 + by],
        ],
        '#e3adc8',
      );
      p.poly(
        [
          [bx - 4, 31 + by],
          [bx + 4, 31 + by],
          [bx + 9 + sk, 42 + by],
          [bx - 9 + sk, 42 + by],
        ],
        '#fff2f8',
      );
      // 精致立体裙褶阴影与高光
      p.vline(bx - 6, 34 + by, 7, '#f2c4db');
      p.vline(bx - 2, 32 + by, 9, '#ffffff');
      p.vline(bx + 3, 33 + by, 8, '#f5cce0');
      p.hline(bx - 11 + sk, 40 + by, 22, '#e62e5c');
      p.hline(bx - 12 + sk, 42 + by, 24, '#ffffff');
      for (let x = bx - 11 + sk; x <= bx + 11 + sk; x += 2) {
        p.px(x, 43 + by, '#ffe3f0');
      }

      // 修身粉白洋装上衣 + 泡泡袖 + 鲜红领结双飘带
      p.poly(
        [
          [bx - 4, 24 + by],
          [bx + 4, 24 + by],
          [bx + 5, 31 + by],
          [bx - 5, 31 + by],
        ],
        '#fff5fa',
      );
      p.hline(bx - 4, 31 + by, 8, '#e62e5c');
      p.ellipse(bx - 5.5, 26 + by, 2.3, 2.2, '#ffe0ee');
      p.ellipse(bx + 5.5, 26 + by, 2.3, 2.2, '#ffe0ee');
      p.rect(bx - 3, 26 + by, 6, 3, '#e61e4d');
      p.px(bx, 27 + by, '#ffe899', true);
      p.line(bx - 1, 29 + by, bx - 4 + sk, 35 + by, '#ff4d7d', 1);
      p.line(bx + 1, 29 + by, bx + 4 + sk, 35 + by, '#ff4d7d', 1);

      // [部件 5] 精致傲娇红魔大小姐面容 + 璀璨赤红宝石大眼 + 蕾丝荷叶 ZUN 帽！
      drawMaidenHead(p, bx, headY, '#fff2ec', '#e8bfb8');
      drawChibiFaceEyes(p, bx + 1, headY, '#b80f34', '#ff6b91', pose);
      drawMaidenCrown(p, bx, headY, '#667db5', '#a6bdf0', '#d6e4ff', '#ffffff');
      drawMaidenLocks(p, bx, headY, '#758cc4', '#cddcff', 6, 5);

      // 标志性蓬松雪白蕾丝花边 ZUN 帽 + 立体鲜红丝带大蝴蝶结（干净高辨识度！）
      p.ellipse(bx, headY - 6.8, 7.8, 3.6, '#e0cfe0');
      p.ellipse(bx, headY - 7.4, 6.8, 2.9, '#ffffff');
      p.hline(bx - 7, headY - 5, 14, '#fff5fa');
      p.px(bx - 6, headY - 4, '#ffffff');
      p.px(bx + 6, headY - 4, '#ffffff');
      p.hline(bx - 5, headY - 6, 10, '#e61e4d');
      // 俏丽侧蝴蝶结双结耳 + 垂丝带
      p.poly(
        [
          [bx + 2, headY - 8],
          [bx + 8, headY - 10],
          [bx + 8, headY - 6],
          [bx + 2, headY - 7],
        ],
        '#ff2e5e',
      );
      p.px(bx + 4, headY - 8, '#ffe899', true);
      p.line(bx + 7, headY - 6, bx + 9 + Math.round(sway * 0.4), headY - 3, '#ff4d7d', 1);

      // [部件 6] 右臂与炽烈神枪「冈格尼尔」（蓄力高举 → 全力前掷绯红命运光枪 → 优雅收势！）
      if (isAtk && f === 0) {
        // 蓄力高举准备投掷
        p.line(bx + 4, 26 + by, bx + 9, 21 + by, '#ffe5f0', 2);
        p.rect(bx + 8, 20 + by, 2, 2, '#fff0ea');
        p.line(bx - 1, 22 + by, bx + 18, 13 + by, '#9e0e30', 2);
        p.line(bx + 1, 21 + by, bx + 19, 12 + by, '#ff3366', 1, true);
        p.poly([[bx + 22, 10 + by], [bx + 16, 11 + by], [bx + 18, 16 + by]], '#ff2454', true);
        p.px(bx + 21, 10 + by, '#ffffff', true);
      } else if (isAtk && (f === 1 || f === 2)) {
        // 命运神枪贯穿前刺 + 璀璨绯红旋涡枪芒（右手前推持枪，完全不挡胸口红蝴蝶结！）
        p.line(bx + 5, 27 + by, bx + 11, 27 + by, '#ffe5f0', 2);
        p.rect(bx + 10, 26 + by, 2, 2, '#fff0ea');
        p.line(bx + 8, 27 + by, Math.min(44, bx + 25), 25 + by, '#b81038', 2);
        p.line(bx + 9, 27 + by, Math.min(45, bx + 25), 25 + by, '#ff3b6b', 1, true);
        const tipX = Math.min(46, bx + 27);
        p.poly([[tipX, 25 + by], [tipX - 6, 22 + by], [tipX - 6, 28 + by]], '#ff2454', true);
        p.line(tipX - 8, 25 + by, tipX, 25 + by, '#ffffff', 1, true);
        drawSlashArc(p, bx + 13, 25 + by, 13, 10, -0.75, 0.75, '#ff3366', '#ff9eb8');
      } else {
        // 待机/行走：右手优雅斜握冈格尼尔于右外侧（不挡衣裙与蝴蝶结，螺旋红光微闪！）
        const handX = bx + 9;
        const handY = 29 + by - Math.round(pose.armAction * 2);
        p.line(bx + 4, 26 + by, handX, handY, '#ffe5f0', 2);
        p.rect(handX - 1, handY - 1, 2, 2, '#fff0ea');
        const sxBot = handX - 3;
        const syBot = 45 + by;
        const sxTop = Math.min(43, bx + 19);
        const syTop = Math.max(6, 10 + by);
        p.line(sxBot, syBot, sxTop - 2, syTop + 2, '#8c0d2b', 2);
        p.line(sxBot + 1, syBot - 1, sxTop - 1, syTop + 1, '#ff3366', 1, true);
        p.poly([[sxTop + 2, syTop - 2], [sxTop - 4, syTop + 1], [sxTop, syTop + 5]], '#ff2454', true);
        p.px(sxTop + 1, syTop - 1, '#ffffff', true);
        p.px(sxTop - 3, syTop + 7, '#ff85a8', true);
        p.px(sxTop - 6, syTop + 13, '#ff85a8', true);
      }
    },
  },

  // =========================================================================
  // 2. 死亡 T1-A：尸壳（正统「骸骨体质」——冥界苍白骷髅剑盾武士空壳！）
  //    立体骷髅头颅 + 幽青鬼火深眼窝 + 破损冥紫斗篷 + 镂空肋骨胸膛 + 残破冥铁圆盾 + 幽青骨刃！
  // =========================================================================
  creature_corpse_husk: {
    backdropTop: '#0d1124',
    backdropBottom: '#1c2140',
    backdropGlow: '#62f5e6',
    avatarCrop: { x: 8, y: 5, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 19 : Math.round(21 + pose.leanX * 0.8);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.6);
      const stride = Math.round(pose.stride * 3.4);
      const headY = 17 + by;

      // [部件 1] 随风撕裂飘荡的残破暗紫冥界披风（锯齿破损下摆，烘托空壳苍凉感！）
      const capeBack = isAtk && f === 1 ? -4 : sway;
      p.poly(
        [
          [bx - 4, 22 + by],
          [bx - 15 + capeBack, 28 + by],
          [bx - 17 + capeBack, 40 + by],
          [bx - 12 + capeBack, 38 + by],
          [bx - 9 + capeBack, 43 + by],
          [bx - 5, 38 + by],
        ],
        '#20193d',
      );
      p.poly(
        [
          [bx - 4, 23 + by],
          [bx - 13 + capeBack, 29 + by],
          [bx - 14 + capeBack, 37 + by],
          [bx - 6, 35 + by],
        ],
        '#392c69',
      );
      p.line(bx - 13 + capeBack, 29 + by, bx - 6, 33 + by, '#5b4899', 1);

      // [部件 2] 清晰纤细的骸骨双腿（白骨胫骨 + 膝关节圆骨 + 残破锈铁护胫，3/4 战斗跨步！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      // 后骨腿
      p.line(bx - 3, 35 + by, bx - 6 - stride, 46 + lLift, '#9e97b3', 2);
      p.rect(bx - 5 - Math.round(stride * 0.5), 40 + by, 2, 2, '#d9d4eb'); // 膝骨节
      p.hline(bx - 8 - stride, 47 + lLift, 4, '#595070');
      // 前骨腿
      p.line(bx + 2, 35 + by, bx + 5 + stride, 46 + rLift, '#dbd6ed', 2);
      p.rect(bx + 3 + Math.round(stride * 0.5), 40 + by, 2, 2, '#ffffff');
      p.hline(bx + 4 + stride, 47 + rLift, 5, '#8c83a6');

      // [部件 3] 货真价实的「镂空骸骨胸廓 + 残破暗铁腰甲」（一眼看出「骸骨体质」！）
      // 胸腔深暗空洞 + 幽青冥火魂核
      p.poly(
        [
          [bx - 4, 24 + by],
          [bx + 4, 24 + by],
          [bx + 3, 35 + by],
          [bx - 3, 35 + by],
        ],
        '#141226',
      );
      drawCircle(p, bx, 28 + by, 2.5, '#30c7c7', true);
      p.px(bx, 28 + by, '#c7fffb', true);
      // 清晰的白色胸骨与三对对称弧形肋骨（镂空见黑缝与青焰！）
      p.vline(bx, 24 + by, 9, '#ebe7f7');
      p.hline(bx - 4, 25 + by, 9, '#f5f2ff');
      p.hline(bx - 4, 27 + by, 3, '#dbd6ed');
      p.hline(bx + 2, 27 + by, 3, '#f5f2ff');
      p.hline(bx - 3, 29 + by, 2, '#c7c1db');
      p.hline(bx + 2, 29 + by, 2, '#ebe7f7');
      p.hline(bx - 3, 31 + by, 6, '#b8b0cc');
      // 残破紫铁腰带与前垂破损战裙布
      p.hline(bx - 5, 34 + by, 10, '#4f4473');
      p.px(bx, 34 + by, '#62f5e6', true);
      p.poly(
        [
          [bx - 4, 35 + by],
          [bx + 4, 35 + by],
          [bx + 5, 41 + by],
          [bx + 1, 39 + by],
          [bx - 3, 42 + by],
        ],
        '#2d2352',
      );
      p.hline(bx - 3, 35 + by, 7, '#a89ec7');

      // 残破尖刺冥铁肩甲（左厚右轻，立体 3/4 轮廓）
      p.poly([[bx - 8, 24 + by], [bx - 4, 23 + by], [bx - 4, 27 + by], [bx - 7, 28 + by]], '#4c436b');
      p.hline(bx - 7, 24 + by, 3, '#aba2c7');
      p.poly([[bx + 3, 23 + by], [bx + 7, 24 + by], [bx + 6, 27 + by], [bx + 3, 27 + by]], '#685e8c');
      p.hline(bx + 4, 24 + by, 3, '#e3def5');

      // [部件 4] 左臂 + 斜护身侧的「残破鬼火冥铁圆盾」（完美呼应远程防御 +100% 骸骨防线！）
      const shX = bx - 8;
      const shY = 31 + by;
      p.ellipse(shX, shY, 4.4, 5.8, '#2b2442');
      p.ellipse(shX + 0.5, shY, 3.3, 4.7, '#5a507d');
      p.vline(shX - 1, shY - 4, 8, '#a69ec4');
      p.px(shX, shY, '#62f5e6', true);
      p.px(shX + 1, shY - 3, '#c7c1db');
      p.px(shX + 1, shY + 3, '#c7c1db');

      // [部件 5] 精雕苍白骷髅头颅 + 幽青魂火双瞳 + 破损冥铁半冠（酷帅精致的尸壳！）
      // 颈椎骨
      p.vline(bx, headY + 4, 3, '#c7c1db');
      // 颅骨轮廓（饱满上颅 + 收窄颧骨与独立下颌齿列）
      p.ellipse(bx, headY - 1, 5.2, 4.6, '#d6d0e8');
      p.ellipse(bx + 0.5, headY - 1.5, 4.3, 3.7, '#f7f5ff');
      p.rect(bx - 2, headY + 2, 5, 3, '#e6e1f5');
      // 深邃黑眼窝 + 幽青魂火瞳光！
      p.rect(bx - 2, headY - 1, 2, 2, '#120e21');
      p.rect(bx + 2, headY - 1, 2, 2, '#120e21');
      p.px(bx - 1, headY - 1, '#62f5e6', true);
      p.px(bx + 3, headY - 1, '#62f5e6', true);
      // 鼻腔三角孔与清晰齿列缝
      p.px(bx + 1, headY + 1, '#261f3d');
      p.px(bx - 1, headY + 3, '#382f54');
      p.px(bx + 1, headY + 3, '#382f54');
      p.px(bx + 3, headY + 3, '#382f54');
      // 残破暗紫兜帽额冠 + 幽青额印
      p.poly(
        [
          [bx - 6, headY - 3],
          [bx - 4, headY - 7],
          [bx + 4, headY - 7],
          [bx + 6, headY - 3],
          [bx + 2, headY - 5],
          [bx - 2, headY - 5],
        ],
        '#2d2352',
      );
      p.hline(bx - 4, headY - 6, 8, '#625299');
      p.px(bx + 1, headY - 5, '#62f5e6', true);

      // [部件 6] 右骨臂 + 锋利「幽青冥铁骨刃」（4 帧完整蓄力 → 劈斩 + 幽青剑气！）
      if (isAtk && f === 0) {
        p.line(bx + 4, 25 + by, bx + 9, 19 + by, '#e8e4f7', 2);
        p.line(bx + 9, 19 + by, bx + 5, 7 + by, '#99f5ee', 2, true);
        p.line(bx + 9, 18 + by, bx + 5, 7 + by, '#ffffff', 1, true);
        p.rect(bx + 8, 18 + by, 3, 2, '#625299');
      } else if (isAtk && (f === 1 || f === 2)) {
        p.line(bx + 4, 26 + by, bx + 11, 29 + by, '#e8e4f7', 2);
        p.line(bx + 11, 29 + by, bx + 22, 34 + by, '#62f5e6', 2, true);
        p.line(bx + 12, 29 + by, bx + 22, 33 + by, '#ffffff', 1, true);
        drawSlashArc(p, bx + 10, 26 + by, 13, 12, -1.1, 0.85, '#3cd9cf', '#b8fffb');
      } else {
        const handX = bx + 9;
        const handY = 29 + by - Math.round(pose.armAction * 2);
        p.line(bx + 4, 26 + by, handX, handY, '#e3def5', 2);
        p.rect(handX - 1, handY - 1, 2, 2, '#ffffff');
        // 幽青锈骨长剑斜举向前上方
        p.line(handX - 1, handY - 2, handX + 2, handY + 1, '#7a6ca8', 1);
        p.line(handX + 1, handY - 1, handX + 10, handY - 11, '#8fa6bd', 2);
        p.line(handX + 2, handY - 1, handX + 11, handY - 12, '#62f5e6', 1, true);
        p.px(handX + 11, handY - 12, '#ffffff', true);
      }
    },
  },

  // =========================================================================
  // 3. 死亡 T1-B：小恶魔（红魔馆图书馆经典红发双小蝠翼司书美少女！）
  //    3/4 轻盈浮跃姿态 + 飘逸珊瑚红长发 + 白衬衫黑马甲红领结 + 悬浮紫金魔导书吸蓝！
  // =========================================================================
  creature_koakuma_imp: {
    backdropTop: '#240b18',
    backdropBottom: '#42152e',
    backdropGlow: '#ff668a',
    avatarCrop: { x: 8, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 19 : Math.round(20 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 1.2 - pose.stepLift - 1);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 2.4 + pose.flutter);
      const sway = Math.round(pose.flutter * 1.5);
      const stride = Math.round(pose.stride * 2.8);
      const headY = 18 + by;

      // [部件 1] 背后灵巧非对称紫边小恶魔蝠翼
      drawAsymBatWings(p, bx, 27 + by, 15, 11, 9, flap, '#221030', '#542473', '#d082ff');

      // 飘逸向右后方微卷的红魔馆标志珊瑚红长发背影！
      p.poly(
        [
          [bx - 6, headY],
          [bx + 6, headY],
          [bx + 7 - Math.round(sway * 0.3), 35 + by],
          [bx - 11 + sway, 37 + by],
          [bx - 9 + sway, 28 + by],
        ],
        '#961d35',
      );
      p.poly(
        [
          [bx - 5, headY + 1],
          [bx + 5, headY + 1],
          [bx + 5, 33 + by],
          [bx - 8 + sway, 35 + by],
        ],
        '#db3d5a',
      );
      p.line(bx - 5, headY + 4, bx - 7 + sway, 33 + by, '#ff7894', 1);

      // [部件 2] 俏皮秀气双脚（雪白及膝袜 + 黑色学院小皮鞋，柔和收拢微错开！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(bx - 4 - stride, 42 + lLift, 3, 5, '#ebe6f7');
      p.rect(bx - 5 - stride, 46 + lLift, 4, 3, '#1f1629');
      p.rect(bx + 2 + stride, 42 + rLift, 3, 5, '#ffffff');
      p.rect(bx + 2 + stride, 46 + rLift, 4, 3, '#332445');

      // [部件 3] 3/4 红魔馆图书司书学院装（百褶黑短裙 + 洁白短袖衬衫 + 修身黑马甲 + 红领结）
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      p.poly(
        [
          [bx - 5, 33 + by],
          [bx + 5, 33 + by],
          [bx + 9 + sk, 42 + by],
          [bx - 9 + sk, 42 + by],
        ],
        '#1b1326',
      );
      p.poly(
        [
          [bx - 3, 33 + by],
          [bx + 3, 33 + by],
          [bx + 6 + sk, 41 + by],
          [bx - 6 + sk, 41 + by],
        ],
        '#3a2952',
      );
      p.vline(bx - 3, 34 + by, 7, '#543c73');
      p.hline(bx - 8 + sk, 41 + by, 16, '#ffdbe8');
      // 洁白泡泡袖衬衫 + 修身黑马甲 + V 领白襟 + 鲜红蝴蝶领结
      p.rect(bx - 5, 25 + by, 10, 8, '#ffffff');
      p.rect(bx - 4, 26 + by, 8, 7, '#221730');
      p.poly([[bx - 2, 25 + by], [bx + 2, 25 + by], [bx, 29 + by]], '#ffffff');
      p.rect(bx - 2, 27 + by, 4, 2, '#ff335c');
      p.px(bx, 28 + by, '#ffe899');
      p.ellipse(bx - 5.5, 27 + by, 2.1, 2.1, '#ffffff');
      p.ellipse(bx + 5.5, 27 + by, 2.1, 2.1, '#ffffff');
      // 左手轻托红皮小典籍
      p.line(bx - 5, 28 + by, bx - 8, 32 + by, '#ffe9dc', 1);
      p.rect(bx - 10, 31 + by, 4, 5, '#8c1f3d');
      p.hline(bx - 10, 32 + by, 4, '#ffe073');

      // [部件 4] 甜美可爱脸庞 + 元气宝石红瞳 + 标志性红发 + 头顶一对立体小黑蝠翼发饰！
      drawMaidenHead(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#cc1f42', '#ff7a99', pose);
      drawMaidenCrown(p, bx, headY, '#991f38', '#db3e5c', '#ff738f', '#ffc7d4');
      drawMaidenLocks(p, bx, headY, '#991f38', '#f05975', 8, 7);

      // 灵魂标志：头部两侧一对带紫罗兰亮边的萌萌立体小蝠翼！
      const earFlap = Math.round(flap * 0.45);
      p.poly(
        [
          [bx - 5, headY - 4],
          [bx - 11, headY - 9 + earFlap],
          [bx - 11, headY - 4 + earFlap],
          [bx - 8, headY - 5 + earFlap],
          [bx - 6, headY - 2],
        ],
        '#291338',
      );
      p.line(bx - 5, headY - 4, bx - 11, headY - 9 + earFlap, '#cf85ff', 1);
      p.poly(
        [
          [bx + 4, headY - 4],
          [bx + 10, headY - 9 + earFlap],
          [bx + 10, headY - 4 + earFlap],
          [bx + 7, headY - 5 + earFlap],
          [bx + 5, headY - 2],
        ],
        '#291338',
      );
      p.line(bx + 4, headY - 4, bx + 10, headY - 9 + earFlap, '#cf85ff', 1);

      // [部件 5] 右手优雅前挥 + 悬浮翻开的「紫金吸蓝魔导书」+ 施法咒环！
      const castPush = isAtk && (f === 1 || f === 2) ? 4 : isAtk && f === 0 ? -1 : 0;
      const bkX = Math.min(41, bx + 14 + castPush);
      const bkY = 28 + by + Math.round(sway * 0.6);
      p.line(bx + 5, 27 + by, bx + 9 + Math.round(castPush * 0.5), 29 + by, '#ffe9dc', 2);
      // 翻开的精装魔导书（左页+右页+发光紫金书脊）
      p.poly([[bkX - 5, bkY - 3], [bkX, bkY - 1], [bkX, bkY + 4], [bkX - 5, bkY + 2]], '#4d2278');
      p.poly([[bkX + 5, bkY - 3], [bkX, bkY - 1], [bkX, bkY + 4], [bkX + 5, bkY + 2]], '#7a3ab8');
      p.line(bkX - 4, bkY - 2, bkX - 1, bkY - 1, '#fff7e0', 1);
      p.line(bkX + 4, bkY - 2, bkX + 1, bkY - 1, '#fff7e0', 1);
      p.vline(bkX, bkY - 1, 5, '#ffe073');
      // 悬浮旋转的紫青吸蓝魔力符文球
      drawCircle(p, bkX, bkY - 6, 2.4, '#c775ff', true);
      p.px(bkX, bkY - 6, '#ffffff', true);
      p.px(bkX - 3, bkY - 9 - sway, '#7df2ff', true);
      p.px(bkX + 3, bkY - 8 + sway, '#ff7ab8', true);
      if (isAtk && (f === 1 || f === 2)) {
        drawSlashArc(p, bkX - 1, bkY - 5, 6, 6, -1.6, 1.6, '#c775ff', '#7df2ff');
      }
    },
  },

  // =========================================================================
  // 4. 死亡 T2-A：怨灵（梦幻凄美的 1×2 轻盈 S 形浮空青紫幽灵少女）
  //    告别僵直倒三角！流线飘逸长发 + 层次青白广振袖 + 柔卷双尾幽灵雾 + 青紫双鬼火！
  // =========================================================================
  creature_wraith_spirit: {
    backdropTop: '#09152b',
    backdropBottom: '#1a2852',
    backdropGlow: '#78f5ff',
    avatarCrop: { x: 9, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 20 : Math.round(22 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 1.4 - pose.stepLift - 1);
      const sway = Math.round(Math.sin(pose.phase * Math.PI * 2) * 2.0 + pose.flutter);
      const headY = 17 + by;

      // [部件 1] 飘逸向左侧大幅流淌的深海蓝→冰青长发（极富灵动飘浮感！）
      p.poly(
        [
          [bx - 5, headY - 1],
          [bx + 6, headY],
          [bx + 7 - Math.round(sway * 0.3), 33 + by],
          [bx - 12 + sway, 37 + by],
          [bx - 14 + sway, 28 + by],
          [bx - 9, 20 + by],
        ],
        '#2c438c',
      );
      p.poly(
        [
          [bx - 4, headY + 1],
          [bx + 5, headY + 1],
          [bx + 5, 31 + by],
          [bx - 9 + sway, 34 + by],
        ],
        '#6294ed',
      );
      p.line(bx - 6, headY + 4, bx - 11 + sway, 33 + by, '#a8dcff', 1);

      // [部件 2] 优雅弯曲流淌的双尾半透明幽灵灵雾（彻底取代生硬倒三角！）
      p.poly(
        [
          [bx - 6, 36 + by],
          [bx + 6, 36 + by],
          [bx + 3 + Math.round(sway * 0.6), 44 + by],
          [bx - 4 + sway, 50 + by],
          [bx - 9 + sway, 48 + by],
          [bx - 5 + Math.round(sway * 0.5), 42 + by],
        ],
        '#4db2e6',
        true,
      );
      p.poly(
        [
          [bx - 3, 37 + by],
          [bx + 3, 37 + by],
          [bx + 1 + Math.round(sway * 0.6), 44 + by],
          [bx - 5 + sway, 48 + by],
        ],
        '#b8f2ff',
        true,
      );
      p.px(bx - 10 + sway, 46 + by, '#c78aff', true);
      p.px(bx + 5 + Math.round(sway * 0.5), 45 + by, '#7df2ff', true);

      // [部件 3] 轻盈左后飘逸广振袖 + 层次明暗和风白青灵衣 + 薰衣草紫大腰带双垂带
      p.poly(
        [
          [bx - 5, 24 + by],
          [bx - 14 + sway, 29 + by],
          [bx - 13 + sway, 36 + by],
          [bx - 5, 33 + by],
        ],
        '#7ab6eb',
      );
      p.hline(bx - 13 + sway, 35 + by, 8, '#9e70eb');
      // 收腰和风灵袍下摆
      p.poly(
        [
          [bx - 5, 30 + by],
          [bx + 5, 30 + by],
          [bx + 8, 39 + by],
          [bx - 8, 39 + by],
        ],
        '#8cc5f2',
      );
      p.poly(
        [
          [bx - 3, 30 + by],
          [bx + 3, 30 + by],
          [bx + 6, 38 + by],
          [bx - 5, 38 + by],
        ],
        '#ebf8ff',
      );
      p.vline(bx - 4, 32 + by, 6, '#5c94d9');
      p.vline(bx + 4, 32 + by, 6, '#5c94d9');
      // 典雅上衣 + 紫色交领 + 立体紫腰带蝴蝶结与飘逸垂带
      p.rect(bx - 4, 24 + by, 8, 7, '#f2fbff');
      p.line(bx - 4, 24 + by, bx, 28 + by, '#7c52cc', 1);
      p.line(bx + 4, 24 + by, bx, 28 + by, '#996de6', 1);
      p.hline(bx - 5, 30 + by, 10, '#7448c7');
      p.rect(bx - 2, 29 + by, 4, 3, '#c79eff');
      p.px(bx, 30 + by, '#ffffff', true);
      p.line(bx - 1, 32 + by, bx - 4 + sway, 39 + by, '#9664e6', 1);
      p.line(bx + 1, 32 + by, bx + 2 + sway, 38 + by, '#b88aff', 1);

      // [部件 4] 楚楚动人雪白幽灵少女容颜 + 冰紫宝石大瞳 + 标志性三角白额天冠！
      drawMaidenHead(p, bx, headY, '#f7faff', '#c2d8f2');
      drawChibiFaceEyes(p, bx + 1, headY, '#683fd6', '#7df2ff', pose);
      drawMaidenCrown(p, bx, headY, '#3852a3', '#75a6f5', '#c4e3ff', '#ffffff');
      drawMaidenLocks(p, bx, headY, '#3852a3', '#9ecaff', 9, 8);
      p.hline(bx - 5, headY - 5, 10, '#ffffff');
      p.poly([[bx - 3, headY - 5], [bx + 3, headY - 5], [bx, headY - 10]], '#ffffff');
      p.px(bx, headY - 7, '#a36bff', true);

      // [部件 5] 右前飘逸广振袖（自然下垂弧袖口，不僵直！）+ 枯朽冥力挥击 + 环绕双人魂鬼火
      const reach = isAtk && (f === 1 || f === 2) ? 5 : Math.round(Math.max(0, pose.armAction) * 3);
      p.poly(
        [
          [bx + 4, 24 + by],
          [bx + 11 + reach, 26 + by],
          [bx + 9 + reach, 34 + by],
          [bx + 5, 33 + by],
        ],
        '#d9f4ff',
      );
      p.line(bx + 5, 33 + by, bx + 9 + reach, 34 + by, '#8c62e6', 1);
      p.rect(bx + 10 + reach, 27 + by, 2, 2, '#f7faff');

      // 左侧拖尾青碧人魂鬼火
      const w1x = bx - 15;
      const w1y = 20 + by - sway;
      drawCircle(p, w1x, w1y, 2.4, '#54f0ff', true);
      p.poly([[w1x - 2, w1y - 1], [w1x + 1, w1y - 6], [w1x + 2, w1y - 1]], '#54f0ff', true);
      p.px(w1x, w1y - 1, '#ffffff', true);

      // 右前拖尾薰衣草紫人魂鬼火
      const w2x = Math.min(43, bx + 15 + reach);
      const w2y = 22 + by + sway;
      drawCircle(p, w2x, w2y, 2.3, '#c785ff', true);
      p.poly([[w2x - 2, w2y - 1], [w2x, w2y - 5], [w2x + 2, w2y - 1]], '#c785ff', true);
      p.px(w2x, w2y - 1, '#ffffff', true);

      if (isAtk && (f === 1 || f === 2)) {
        drawSlashArc(p, bx + 12, 26 + by, 10, 11, -1.0, 1.0, '#78f5ff', '#d09eff');
      }
    },
  },

  // =========================================================================
  // 5. 死亡 T2-B：地狱鸦（2×1 酷萌凌空俯冲黑羽赤瞳鸦娘 + 双炽羽渡鸦三翼裂袭！）
  //    告别死板三角裙！3/4 凌空飞掠战姿 + 红白和风狩衣飘带 + 展翅双伴鸦 + 三道赤炎爪光！
  // =========================================================================
  creature_hell_raven: {
    backdropTop: '#1c0a16',
    backdropBottom: '#381228',
    backdropGlow: '#ff4d6a',
    avatarCrop: { x: 8, y: 4, size: 28 },
    portraitCrop: { x: 1, y: 2, w: 46, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 19 : Math.round(21 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 1.1 - pose.stepLift - 1);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 3.0 + pose.flutter);
      const sway = Math.round(pose.flutter * 1.5);
      const stride = Math.round(pose.stride * 3.2);
      const headY = 17 + by;

      // [部件 1] 宏伟不对称凌空大黑羽双翼（后翼高扬展翅 + 炽红橙金烈焰羽尖！）
      // 左大主翼（斜向左上大幅高展，呈现俯冲飞行气势！）
      p.poly(
        [
          [bx - 2, 25 + by],
          [bx - 19, 10 + by + flap],
          [bx - 21, 18 + by + flap],
          [bx - 15, 25 + by + flap],
          [bx - 9, 29 + by + Math.round(flap * 0.5)],
          [bx - 2, 30 + by],
        ],
        '#1b142b',
      );
      p.poly(
        [
          [bx - 4, 25 + by],
          [bx - 16, 13 + by + flap],
          [bx - 16, 20 + by + flap],
          [bx - 8, 26 + by],
        ],
        '#342652',
      );
      p.line(bx - 19, 10 + by + flap, bx - 21, 18 + by + flap, '#ff3d5a', 2, true);
      p.line(bx - 19, 18 + by + flap, bx - 14, 25 + by + flap, '#ff9447', 1, true);
      p.px(bx - 19, 10 + by + flap, '#ffe073', true);

      // 右前掠翼
      p.poly(
        [
          [bx + 3, 24 + by],
          [bx + 18, 12 + by + flap],
          [bx + 19, 20 + by + flap],
          [bx + 12, 26 + by + Math.round(flap * 0.5)],
          [bx + 3, 29 + by],
        ],
        '#251b3b',
      );
      p.line(bx + 18, 12 + by + flap, bx + 19, 20 + by + flap, '#ff4d66', 2, true);
      p.line(bx + 17, 19 + by + flap, bx + 12, 25 + by + Math.round(flap * 0.5), '#ffa04d', 1, true);

      // 飘扬绯红炽焰长围巾/腰带飘带（向左后方甩出酷飒动势！）
      p.poly(
        [
          [bx - 4, 30 + by],
          [bx - 15 + sway, 33 + by],
          [bx - 18 + sway, 37 + by],
          [bx - 13 + sway, 38 + by],
          [bx - 4, 33 + by],
        ],
        '#d92647',
      );
      p.line(bx - 5, 31 + by, bx - 16 + sway, 36 + by, '#ff8547', 1, true);

      // [部件 2] 秀气优雅凌空微错步双腿（黑丝过膝袜 + 绯红金扣小短靴）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(bx - 4 - stride, 41 + lLift, 3, 6, '#2b2042');
      p.rect(bx - 5 - stride, 46 + lLift, 4, 3, '#b81a38');
      p.rect(bx + 2 + stride, 41 + rLift, 3, 5, '#3e2f5e');
      p.rect(bx + 2 + stride, 45 + rLift, 4, 3, '#eb3452');
      p.px(bx + 4 + stride, 46 + rLift, '#ffe073');

      // [部件 3] 高对比红白黑羽狩衣短裙（纤巧动感、彻底区分背景翅膀！）
      const sk = Math.round(-pose.leanX * 0.5 + sway * 0.5);
      p.poly(
        [
          [bx - 5, 32 + by],
          [bx + 5, 32 + by],
          [bx + 10 + sk, 41 + by],
          [bx - 9 + sk, 41 + by],
        ],
        '#291f40',
      );
      p.poly(
        [
          [bx - 3, 32 + by],
          [bx + 3, 32 + by],
          [bx + 7 + sk, 40 + by],
          [bx - 6 + sk, 40 + by],
        ],
        '#573d82',
      );
      p.hline(bx - 9 + sk, 40 + by, 18, '#ff4d63');
      p.hline(bx - 8 + sk, 41 + by, 16, '#fff5f7');
      // 洁白交领衬衫 + 炽红收腰背心 + 鎏金腰扣
      p.rect(bx - 5, 24 + by, 10, 8, '#ffffff');
      p.rect(bx - 4, 26 + by, 8, 6, '#d92647');
      p.poly([[bx - 3, 24 + by], [bx + 3, 24 + by], [bx, 28 + by]], '#ffffff');
      p.hline(bx - 5, 31 + by, 10, '#ffe073');
      p.px(bx, 28 + by, '#ffe899', true);

      // [部件 4] 酷萌乌鸦少女面容 + 赤金锐瞳 + 靛蓝高光黑羽发 + 大红蝴蝶结！
      drawMaidenHead(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#d91c3c', '#ffb84d', pose);
      drawMaidenCrown(p, bx, headY, '#1c152e', '#382a59', '#6e57a3', '#c4b5eb');
      drawMaidenLocks(p, bx, headY, '#1c152e', '#523e80', 7, 6);
      p.line(bx, headY - 8, bx + 3, headY - 11, '#5d4791', 1);
      p.poly([[bx - 8, headY - 8], [bx - 2, headY - 6], [bx - 7, headY - 4]], '#ff2e55');
      p.px(bx - 5, headY - 6, '#ffe073', true);

      // [部件 5] 优雅自然微曲右臂（手托炽红焰羽光球，攻击时挥出三道裂爪！）+ 两只高辨识度盘旋小地狱鸦
      if (isAtk && (f === 1 || f === 2)) {
        p.line(bx + 4, 26 + by, bx + 11, 28 + by, '#ffffff', 2);
        p.rect(bx + 10, 27 + by, 2, 2, '#ffe9dc');
        drawSlashArc(p, bx + 11, 27 + by, 13, 12, -1.0, 0.9, '#ff3355', '#ffcc66');
      } else {
        p.poly([[bx + 4, 25 + by], [bx + 8, 28 + by], [bx + 7, 32 + by], [bx + 4, 29 + by]], '#ffffff');
        p.rect(bx + 7, 30 + by, 2, 2, '#ffe9dc');
        drawCircle(p, bx + 10, 30 + by, 1.8, '#ff5947', true);
        p.px(bx + 10, 29 + by, '#fff4b8', true);
      }

      // 伴鸦 1（左下方清晰独立净空展翅小渡鸦）
      const c1x = bx - 15;
      const c1y = 42 + by + Math.round(sway * 0.6);
      p.ellipse(c1x, c1y, 3.2, 2.0, '#1e1633');
      p.poly([[c1x, c1y - 1], [c1x - 5, c1y - 5], [c1x - 3, c1y]], '#342652');
      p.line(c1x - 5, c1y - 5, c1x - 3, c1y, '#ff4d63', 1, true);
      p.px(c1x + 2, c1y - 1, '#ff5970', true);
      p.px(c1x + 4, c1y, '#ffcc54');

      // 伴鸦 2（右侧清晰独立展翅小渡鸦，三翼裂袭！）
      const c2x = Math.min(42, bx + 17);
      const c2y = 33 + by - Math.round(sway * 0.6);
      p.ellipse(c2x, c2y, 3.2, 2.0, '#1e1633');
      p.poly([[c2x - 1, c2y - 1], [c2x - 5, c2y - 5], [c2x + 1, c2y - 2]], '#342652');
      p.line(c2x - 5, c2y - 5, c2x - 2, c2y - 1, '#ff4d63', 1, true);
      p.px(c2x + 2, c2y - 1, '#ff5970', true);
      p.px(c2x + 4, c2y, '#ffcc54');
    },
  },

  // =========================================================================
  // 6. 死亡 T3-A：血族眷属（华丽银白长卷双马尾哥特血族少女 · 徒手猩红血爪！）
  //    3/4 优雅潜袭身姿 + 飘扬银白双马尾 + 高领暗红短斗篷 + 徒手猩红血爪三连撕裂与血雾蝠影！
  // =========================================================================
  creature_crimson_vampire: {
    backdropTop: '#240714',
    backdropBottom: '#470f26',
    backdropGlow: '#ff3b6b',
    avatarCrop: { x: 8, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 18 : Math.round(20 + pose.leanX * 0.8);
      const by = Math.round(pose.breathY - pose.stepLift);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 2.5 + pose.flutter);
      const sway = Math.round(pose.flutter * 1.5);
      const stride = Math.round(pose.stride * 3.4);
      const headY = 18 + by;

      // [部件 1] 猩红镶边暗夜血族蝠翼（不对称高展，极具速度感！）
      drawAsymBatWings(p, bx, 26 + by, 17, 13, 10, flap, '#1f0716', '#691336', '#ff4775');

      // 随风向左后方扬起的酒红内衬暗黑血族短斗篷
      p.poly(
        [
          [bx - 4, 24 + by],
          [bx - 15 + sway, 30 + by],
          [bx - 14 + sway, 38 + by],
          [bx - 5, 35 + by],
        ],
        '#240917',
      );
      p.poly(
        [
          [bx - 4, 25 + by],
          [bx - 12 + sway, 31 + by],
          [bx - 11 + sway, 36 + by],
          [bx - 5, 34 + by],
        ],
        '#8c1638',
      );

      // [部件 2] 飘扬银白蓬松双马尾（左后长甩 + 右侧微扬，彻底告别僵硬双白柱！）
      p.poly(
        [
          [bx - 6, headY - 3],
          [bx - 14 + sway, headY + 2],
          [bx - 16 + sway, 32 + by],
          [bx - 11 + sway, 34 + by],
          [bx - 8, 25 + by],
        ],
        '#b2aed4',
      );
      p.line(bx - 8, headY - 1, bx - 14 + sway, 30 + by, '#ffffff', 2);
      p.poly(
        [
          [bx + 5, headY - 3],
          [bx + 11, headY + 2],
          [bx + 10 + Math.round(sway * 0.5), 31 + by],
          [bx + 6 + Math.round(sway * 0.4), 30 + by],
        ],
        '#cfccf0',
      );
      p.line(bx + 7, headY, bx + 9 + Math.round(sway * 0.4), 28 + by, '#ffffff', 1);

      // [部件 3] 3/4 优雅纤细白蕾丝长袜 + 酒红金扣小短靴（收腿秀气！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(bx - 4 - stride, 42 + lLift, 3, 5, '#f0e6f0');
      p.rect(bx - 5 - stride, 46 + lLift, 4, 3, '#630e26');
      p.rect(bx + 2 + stride, 42 + rLift, 3, 5, '#ffffff');
      p.rect(bx + 2 + stride, 46 + rLift, 4, 3, '#a6173e');
      p.px(bx + 4 + stride, 47 + rLift, '#ffe073');

      // [部件 4] 立体褶皱酒红哥特蕾丝礼裙 + 黑丝绒束腰马甲 + 白荷叶领结
      const sk = Math.round(-pose.leanX * 0.5 + sway * 0.6);
      p.poly(
        [
          [bx - 5, 32 + by],
          [bx + 5, 32 + by],
          [bx + 10 + sk, 43 + by],
          [bx - 10 + sk, 43 + by],
        ],
        '#690f28',
      );
      p.poly(
        [
          [bx - 3, 32 + by],
          [bx + 3, 32 + by],
          [bx + 7 + sk, 42 + by],
          [bx - 7 + sk, 42 + by],
        ],
        '#c7244f',
      );
      p.vline(bx - 4, 34 + by, 7, '#8c1535');
      p.vline(bx + 1, 33 + by, 8, '#eb4672');
      p.hline(bx - 10 + sk, 42 + by, 20, '#ffffff');
      p.rect(bx - 4, 24 + by, 8, 8, '#260a1b');
      p.poly([[bx - 3, 24 + by], [bx + 3, 24 + by], [bx, 28 + by]], '#fff0f5');
      p.vline(bx, 27 + by, 5, '#ff4775');
      p.px(bx, 27 + by, '#ffe899', true);

      // [部件 5] 白皙血族少女面容 + 红宝石大眼 + 银白柔发 + 鲜红玫瑰发结
      drawMaidenHead(p, bx, headY, '#fff2f5', '#e6bec9');
      drawChibiFaceEyes(p, bx + 1, headY, '#c9123a', '#ff7096', pose);
      drawMaidenCrown(p, bx, headY, '#9490b8', '#d2cfeb', '#f0eeff', '#ffffff');
      drawMaidenLocks(p, bx, headY, '#9490b8', '#e6e3fa', 6, 5);
      p.rect(bx - 8, headY - 4, 3, 3, '#ff2659');
      p.px(bx - 7, headY - 3, '#ffe899');
      p.rect(bx + 5, headY - 4, 3, 3, '#ff2659');
      p.px(bx + 6, headY - 3, '#ffe899');

      // [部件 6] 优雅危险的徒手「猩红血爪」（彻底徒手挥抓！待机纤手凝血爪 + 攻击三道平行猩红裂爪痕！）
      // 左手轻扬微屈护于胸侧（亮出暗红血雾微芒）
      p.line(bx - 5, 26 + by, bx - 9, 29 + by, '#330f24', 2);
      p.rect(bx - 10, 29 + by, 2, 2, '#fff2f5');
      p.px(bx - 11, 29 + by, '#ff3366', true);
      p.px(bx - 11, 31 + by, '#ff7aa8', true);

      if (isAtk && f === 0) {
        // 蓄力帧：右手高抬弯爪蓄满猩红吸血血雾！
        p.line(bx + 4, 26 + by, bx + 9, 21 + by, '#330f24', 2);
        p.rect(bx + 8, 20 + by, 2, 2, '#fff2f5');
        p.line(bx + 10, 19 + by, bx + 13, 17 + by, '#ff2659', 1, true);
        p.line(bx + 10, 21 + by, bx + 14, 20 + by, '#ff6690', 1, true);
        p.line(bx + 10, 22 + by, bx + 13, 23 + by, '#ff2659', 1, true);
      } else if (isAtk && (f === 1 || f === 2)) {
        // 攻击帧：魅惑前扑徒手挥抓，利爪劈出三道凌厉猩红吸血爪痕 + 飞散血晶！
        p.line(bx + 4, 26 + by, bx + 11, 28 + by, '#330f24', 2);
        p.rect(bx + 10, 27 + by, 2, 2, '#fff2f5');
        // 手指尖三道红光尖爪
        p.line(bx + 12, 26 + by, bx + 15, 24 + by, '#ff2659', 1, true);
        p.line(bx + 12, 28 + by, bx + 16, 28 + by, '#ffffff', 1, true);
        p.line(bx + 12, 29 + by, bx + 15, 31 + by, '#ff2659', 1, true);
        // 三道斜向平行猩红血爪撕裂抓痕（视觉冲击力拉满！）
        const cx0 = bx + 15;
        const cx1 = Math.min(46, bx + 26);
        p.line(cx0, 18 + by, cx1, 26 + by, '#ff2454', 2, true);
        p.line(cx0 + 1, 18 + by, cx1, 25 + by, '#ffd6e2', 1, true);
        p.line(cx0 - 1, 23 + by, cx1 - 1, 31 + by, '#ff2454', 2, true);
        p.line(cx0, 23 + by, cx1 - 1, 30 + by, '#ffffff', 1, true);
        p.line(cx0 - 2, 28 + by, cx1 - 3, 36 + by, '#d91442', 2, true);
        p.line(cx0 - 1, 28 + by, cx1 - 3, 35 + by, '#ff99b8', 1, true);
        // 汲取生命的红雾星粒
        p.px(cx1 - 2, 20 + by, '#ff7099', true);
        p.px(cx0 + 2, 34 + by, '#ff4775', true);
      } else {
        // 待机 / 飞行：纤白右手优雅轻抬展爪，指尖泛起晶亮猩红锐爪 + 环绕一只迷你猩红血蝠！
        const handX = bx + 10;
        const handY = 27 + by - Math.round(pose.armAction * 2);
        p.line(bx + 4, 26 + by, handX - 1, handY, '#330f24', 2);
        p.rect(handX - 1, handY - 1, 2, 2, '#fff2f5');
        // 纤细妖冶的三缕猩红血爪锋芒
        p.line(handX + 1, handY - 1, handX + 4, handY - 3, '#ff2659', 1, true);
        p.line(handX + 1, handY, handX + 5, handY, '#ff6694', 1, true);
        p.line(handX + 1, handY + 1, handX + 4, handY + 3, '#ff2659', 1, true);
        p.px(handX + 5, handY, '#ffffff', true);
        // 指尖上方盘旋的迷你吸血小红蝠（优雅血族点睛之笔！）
        const bfX = Math.min(42, handX + 4);
        const bfY = 18 + by + Math.round(sway * 0.7);
        p.px(bfX, bfY, '#590d28');
        p.line(bfX - 3, bfY - 2, bfX, bfY, '#ff3366', 1, true);
        p.line(bfX + 3, bfY - 2, bfX, bfY, '#ff3366', 1, true);
        p.px(bfX, bfY - 1, '#ffe073', true);
      }
    },
  },

  // =========================================================================
  // 7. 死亡 T3-B：毒瘴妖（灵动可爱铃兰人偶毒姬 · 紫帽垂铃 + 翠绿白蕾丝裙 + 毒瘴药壶！）
  // =========================================================================
  creature_miasma_venom: {
    backdropTop: '#0d2116',
    backdropBottom: '#21163b',
    backdropGlow: '#78ff7a',
    avatarCrop: { x: 8, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 19 : Math.round(20 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const stride = Math.round(pose.stride * 2.8);
      const headY = 18 + by;

      // [部件 1] 柔顺淡金波浪卷发背影（飘逸微卷，不僵直！）
      p.poly(
        [
          [bx - 7, headY],
          [bx + 6, headY],
          [bx + 7, 30 + by],
          [bx - 10 + sway, 32 + by],
        ],
        '#bd9748',
      );
      p.ellipse(bx - 1, headY + 3, 6.8, 5.2, '#f5db8c');

      // [部件 2] 3/4 俏皮轻迈白蕾丝袜 + 紫罗兰金扣小圆鞋（纤巧并拢更萌！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(bx - 4 - stride, 42 + lLift, 3, 5, '#e6f5ea');
      p.rect(bx - 5 - stride, 46 + lLift, 4, 3, '#4c2675');
      p.rect(bx + 2 + stride, 42 + rLift, 3, 5, '#ffffff');
      p.rect(bx + 2 + stride, 46 + rLift, 4, 3, '#753db0');
      p.px(bx + 4 + stride, 47 + rLift, '#a8ff8c');

      // [部件 3] 立体花瓣褶皱翠绿洋裙 + 雪白围裙荷叶边 + 薰衣草紫灯笼袖上衣
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      p.poly(
        [
          [bx - 6, 32 + by],
          [bx + 6, 32 + by],
          [bx + 11 + sk, 43 + by],
          [bx - 11 + sk, 43 + by],
        ],
        '#361c59',
      );
      p.poly(
        [
          [bx - 4, 32 + by],
          [bx + 4, 32 + by],
          [bx + 8 + sk, 42 + by],
          [bx - 8 + sk, 42 + by],
        ],
        '#4cb05f',
      );
      p.vline(bx - 4, 33 + by, 8, '#7cf08b');
      p.vline(bx + 3, 33 + by, 8, '#2d7a40');
      // 精致雪白小围裙与底边蕾丝
      p.poly(
        [
          [bx - 2, 32 + by],
          [bx + 3, 32 + by],
          [bx + 4 + sk, 40 + by],
          [bx - 3 + sk, 40 + by],
        ],
        '#f5fff7',
      );
      p.hline(bx - 10 + sk, 42 + by, 20, '#ffffff');
      // 薰衣草紫收腰上衣 + 嫩绿蝶结 + 泡泡袖
      p.rect(bx - 5, 25 + by, 10, 7, '#7538b5');
      p.rect(bx - 2, 27 + by, 4, 3, '#94ff85');
      p.px(bx, 28 + by, '#ffffff');
      p.ellipse(bx - 6, 27 + by, 2.3, 2.2, '#f2fff5');
      p.ellipse(bx + 6, 27 + by, 2.3, 2.2, '#f2fff5');
      // 左侧腰间悬挂迷你紫毒小瓶
      p.rect(bx - 9, 34 + by, 3, 4, '#b86bff', true);
      p.px(bx - 8, 33 + by, '#ffe073');

      // [部件 4] 娇俏甜美人偶容颜 + 灵动紫绿双色宝石瞳 + 金发 + 紫罗兰大蓬帽垂白铃兰！
      drawMaidenHead(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#6a32b8', '#7dff82', pose);
      drawMaidenCrown(p, bx, headY, '#b58d3c', '#ebd07c', '#fff0b3', '#ffffff');
      drawMaidenLocks(p, bx, headY, '#b58d3c', '#f5db8c', 7, 6);

      // 立体紫罗兰大蓬帽 + 绿叶垂铃洁白铃兰小花铃铛！
      p.ellipse(bx, headY - 6.8, 8.2, 3.6, '#482275');
      p.ellipse(bx, headY - 7.5, 6.8, 2.7, '#894dcc');
      p.hline(bx - 7, headY - 5, 14, '#8eff82');
      p.px(bx - 7, headY - 4 + sway, '#4cc766');
      drawCircle(p, bx - 7, headY - 2 + sway, 1.8, '#ffffff');
      p.px(bx + 7, headY - 4 - sway, '#4cc766');
      drawCircle(p, bx + 7, headY - 2 - sway, 1.8, '#ffffff');

      // [部件 5] 右臂倾斜举起发光翠绿炼金毒瓶 + 袅袅升起的翠绿紫毒瘴泡泡（攻击喷涌毒瘴！）
      const castPush = isAtk && (f === 1 || f === 2) ? 4 : 0;
      const orbX = Math.min(41, bx + 13 + castPush);
      const orbY = 29 + by;
      p.line(bx + 5, 27 + by, orbX - 3, orbY, '#f2fff5', 2);
      p.rect(orbX - 4, orbY - 1, 2, 2, '#ffe9dc');
      p.rect(orbX - 1, orbY - 5, 3, 2, '#9966cc');
      drawCircle(p, orbX, orbY, 3.3, '#44e664', true);
      drawCircle(p, orbX, orbY - 1, 1.9, '#d0ffc4', true);
      drawCircle(p, orbX + 2, orbY - 8 + sway, 2.2, '#c770ff', true);
      drawCircle(p, orbX - 2, orbY - 11 - sway, 1.6, '#7dff78', true);
      p.px(orbX + 4, orbY - 3, '#ffffff', true);
      if (isAtk && (f === 1 || f === 2)) {
        drawSlashArc(p, orbX, orbY - 3, 7, 8, -1.2, 1.2, '#5eff78', '#cf85ff');
      }
    },
  },

  // =========================================================================
  // 8. 死亡 T4-A：骸骨巨龙（2×2 史诗级凶猛骨龙王 · 全面对标极星红莲魔龙雕塑精度！）
  //    高眉脊獠牙凶首 + 弯曲象牙镰骨双角 + 多指骨撕裂紫青魂翼 + 镂空燃魂胸肋 + 凶猛龙息！
  // =========================================================================
  creature_bone_dragon: {
    backdropTop: '#0d0921',
    backdropBottom: '#251547',
    backdropGlow: '#a86bff',
    avatarCrop: { x: 14, y: 3, size: 28 },
    portraitCrop: { x: 1, y: 1, w: 46, h: 50 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 19 : Math.round(21 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 1.1 - pose.stepLift);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 3.0);
      const tw = Math.round(pose.flutter * 2.0);

      // [部件 1] 蔽日凶悍的「多指骨撕裂冥焰骨翼」（象牙主骨梁 + 尖锐翼爪 + 破损紫青幽火翼膜！）
      // 左主大骨翼
      p.poly(
        [
          [bx - 3, 22 + by],
          [bx - 17, 4 + by + flap],
          [bx - 21, 14 + by + flap],
          [bx - 16, 24 + by + flap],
          [bx - 12, 20 + by + flap],
          [bx - 8, 27 + by],
        ],
        '#2d145c',
        true,
      );
      p.poly(
        [
          [bx - 5, 22 + by],
          [bx - 16, 8 + by + flap],
          [bx - 19, 15 + by + flap],
          [bx - 14, 21 + by + flap],
          [bx - 9, 23 + by],
        ],
        '#7c3ef0',
        true,
      );
      // 粗壮象牙主翼骨 + 3 根清晰分叉骨指 + 锋利翼尖骨爪！
      p.line(bx - 3, 22 + by, bx - 17, 4 + by + flap, '#f2eefc', 2);
      p.line(bx - 17, 4 + by + flap, bx - 21, 14 + by + flap, '#dcd6f0', 2);
      p.line(bx - 14, 8 + by + flap, bx - 16, 24 + by + flap, '#c7bfd9', 1);
      p.line(bx - 10, 13 + by + Math.round(flap * 0.7), bx - 11, 25 + by + Math.round(flap * 0.5), '#b8b0cc', 1);
      p.px(bx - 17, 3 + by + flap, '#7df7ff', true); // 翼角寒光爪

      // 右侧远景骨翼
      p.poly(
        [
          [bx + 3, 19 + by],
          [bx + 15, 4 + by + flap],
          [bx + 18, 15 + by + flap],
          [bx + 11, 20 + by],
        ],
        '#24104a',
        true,
      );
      p.poly(
        [
          [bx + 4, 19 + by],
          [bx + 13, 8 + by + flap],
          [bx + 15, 14 + by + flap],
          [bx + 9, 18 + by],
        ],
        '#5d2bc4',
        true,
      );
      p.line(bx + 3, 19 + by, bx + 15, 4 + by + flap, '#e6e0f5', 2);
      p.line(bx + 15, 4 + by + flap, bx + 18, 15 + by + flap, '#c7bfd9', 1);
      p.px(bx + 15, 3 + by + flap, '#7df7ff', true);

      // [部件 2] 凶猛多节脊椎骨尾 + 锋利骨刃紫焰尾矛
      p.line(bx - 8, 36 + by, bx - 17, 41 + by + tw, '#b8b0cc', 3);
      p.line(bx - 17, 41 + by + tw, bx - 20, 36 + by + tw, '#e6e0f5', 2);
      // 尾节脊椎骨刺
      p.px(bx - 12, 37 + by + Math.round(tw * 0.5), '#ffffff');
      p.px(bx - 15, 39 + by + tw, '#ffffff');
      p.poly(
        [
          [bx - 19, 36 + by + tw],
          [bx - 22, 31 + by + tw],
          [bx - 17, 33 + by + tw],
        ],
        '#a85cff',
        true,
      );
      p.px(bx - 21, 32 + by + tw, '#85f7ff', true);

      // [部件 3] 森然镂空骸骨巨躯（深邃黑腔燃幽蓝紫龙魂 + 弯曲粗壮象牙肋骨笼 + 背脊骨棘！）
      // 躯干深黑内腔与熊熊冥魂烈焰
      p.poly(
        [
          [bx - 10, 32 + by],
          [bx - 2, 25 + by],
          [bx + 7, 27 + by],
          [bx + 8, 37 + by],
          [bx - 1, 40 + by],
          [bx - 10, 37 + by],
        ],
        '#140b29',
      );
      p.ellipse(bx, 33 + by, 5.2, 4.0, '#7833e6', true);
      p.ellipse(bx + 1, 32 + by, 2.8, 2.4, '#6cf2ff', true);
      p.px(bx + 1, 32 + by, '#ffffff', true);
      // 雕塑感粗壮背脊骨梁与 4 根醒目弯曲肋骨（彻底告别实心白球！）
      p.line(bx - 9, 32 + by, bx + 6, 28 + by, '#ebe7f7', 3);
      p.line(bx - 6, 29 + by, bx - 5, 37 + by, '#d6d0e8', 2);
      p.line(bx - 2, 28 + by, bx - 1, 39 + by, '#f5f2ff', 2);
      p.line(bx + 2, 28 + by, bx + 3, 39 + by, '#ffffff', 2);
      p.line(bx + 6, 29 + by, bx + 6, 37 + by, '#e6e0f5', 2);
      // 凶猛背脊尖刺
      p.px(bx - 7, 28 + by, '#ffffff');
      p.px(bx - 3, 25 + by, '#ffffff');
      p.px(bx + 1, 25 + by, '#c785ff', true);

      // [部件 4] 强健弯折的凶兽骨腿 + 锋利张开的三趾寒光骨爪！
      // 后骨腿
      p.line(bx - 8, 36 + by, bx - 11, 41 + by, '#b8b0cc', 3);
      p.line(bx - 11, 41 + by, bx - 8, 46, '#dbd6ed', 2);
      p.line(bx - 10, 46, bx - 13, 47, '#ffffff', 1);
      p.line(bx - 8, 46, bx - 6, 47, '#ffffff', 1);
      // 前骨腿（蓄力或挥爪凌空猛扑！）
      const clawLift = isAtk && (f === 0 || f === 1) ? -4 : 0;
      p.line(bx + 4, 34 + by, bx + 9, 39 + by + clawLift, '#e6e0f5', 3);
      p.line(bx + 9, 39 + by + clawLift, bx + 7, 45 + clawLift, '#ffffff', 2);
      p.line(bx + 7, 45 + clawLift, bx + 12, 46 + clawLift, '#7df7ff', 1, true);
      p.line(bx + 7, 44 + clawLift, bx + 13, 44 + clawLift, '#ffffff', 1, true);
      p.px(bx + 5, 46 + clawLift, '#dbd6ed');

      // [部件 5] 凶悍俯冲的「S 形多节龙骨颈」+ 后弯象牙镰骨双角 + 锋利獠牙凶首！（凶猛核心！）
      const hx = Math.min(34, bx + 10);
      const hy = 13 + by;
      // 多节颈椎与尖锐颈背骨棘
      p.line(bx + 3, 28 + by, bx + 5, 21 + by, '#c7bfd9', 4);
      p.line(bx + 5, 21 + by, hx - 2, hy + 3, '#f2eefc', 4);
      p.px(bx + 2, 23 + by, '#b56bff', true);
      p.px(bx + 4, 19 + by, '#7df7ff', true);
      p.px(bx + 6, 15 + by, '#ffffff', true);

      // 优雅霸气后弯的「巨型象牙镰骨龙角」（对标红莲魔龙弯角！）
      p.line(hx - 1, hy, hx - 5, hy - 5, '#c7bfd9', 2);
      p.line(hx - 5, hy - 5, hx - 10, hy - 6, '#ffffff', 1);
      p.line(hx + 2, hy, hx - 1, hy - 6, '#e6e0f5', 2);
      p.line(hx - 1, hy - 6, hx - 5, hy - 8, '#c785ff', 1, true);

      // 棱角凌厉凶狠的骷髅龙首（高挑凶眉脊 + 锐利鼻骨 + 上下排交错獠牙！）
      p.poly(
        [
          [hx - 3, hy],
          [hx + 4, hy - 1],
          [hx + 11, hy + 2],
          [hx + 10, hy + 5],
          [hx - 1, hy + 5],
        ],
        '#c7bfd9',
      );
      p.poly(
        [
          [hx - 2, hy + 1],
          [hx + 4, hy],
          [hx + 10, hy + 2],
          [hx + 9, hy + 4],
          [hx, hy + 4],
        ],
        '#ffffff',
      );
      // 凶狠斜挑眉骨 + 深黑凹陷眼窝 + 猩红炽焰杀意竖瞳（死亡威慑气场！）
      p.hline(hx, hy, 5, '#998eba');
      p.rect(hx + 1, hy + 1, 3, 2, '#120824');
      p.px(hx + 2, hy + 2, '#ff2e5e', true);
      p.px(hx + 3, hy + 1, '#ffe478', true);
      p.px(hx + 9, hy + 2, '#1a0e33'); // 鼻孔骨洞
      // 张开的森然深黑口腔 + 锋利骸骨下颌 + 寒光交错尖牙！
      const jawOpen = isAtk && (f === 1 || f === 2) ? 4 : 2;
      p.rect(hx + 1, hy + 4, 7, jawOpen + 1, '#120824');
      p.poly(
        [
          [hx, hy + 5 + jawOpen],
          [hx + 9, hy + 5 + jawOpen],
          [hx + 7, hy + 7 + jawOpen],
          [hx - 1, hy + 7 + jawOpen],
        ],
        '#dcd6f0',
      );
      // 上下排凶猛尖牙（深黑口腔衬托，锋利逼人！）
      p.px(hx + 9, hy + 5, '#ffffff');
      p.px(hx + 6, hy + 5, '#ffffff');
      p.px(hx + 3, hy + 5, '#ffffff');
      p.px(hx + 8, hy + 4 + jawOpen, '#ffffff');
      p.px(hx + 5, hy + 4 + jawOpen, '#ffffff');

      // [部件 6] 攻击时张大森然骨颌，狂暴喷吐幽紫×苍青「死亡威慑冥焰龙息」！
      if (isAtk && (f === 1 || f === 2)) {
        p.poly([[hx + 7, hy + 5], [Math.min(47, hx + 16), hy], [Math.min(47, hx + 16), hy + 13]], '#7c2bff', true);
        p.poly([[hx + 8, hy + 5], [Math.min(46, hx + 15), hy + 2], [Math.min(46, hx + 15), hy + 10]], '#42e8ff', true);
        p.poly([[hx + 9, hy + 5], [Math.min(45, hx + 14), hy + 4], [Math.min(45, hx + 14), hy + 8]], '#ffffff', true);
      } else {
        // 待机从獠牙缝隙漏出一缕森冷冥火
        p.px(hx + 10, hy + 4, '#a86bff', true);
        p.px(hx + 11, hy + 3, '#7df7ff', true);
      }
    },
  },

  // =========================================================================
  // 9. 死亡 T4-B：深渊隙间恶魔（1×2 绝美银发高挑深渊魔姬 · 隙间魔瞳 + 绯金死神巨镰！）
  //    3/4 修长御姐魔姬姿态 + 瀑布飘扬雪白长发 + 背后撕裂隙间金红魔瞳 + 外展死神巨镰斩裂虚空！
  // =========================================================================
  creature_abyss_gap_devil: {
    backdropTop: '#1c0516',
    backdropBottom: '#3b0a2c',
    backdropGlow: '#ff2e6d',
    avatarCrop: { x: 8, y: 3, size: 28 },
    portraitCrop: { x: 1, y: 2, w: 46, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 17 : Math.round(20 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY - pose.stepLift);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 2.5 + pose.flutter);
      const sway = Math.round(pose.flutter * 1.5);
      const stride = Math.round(pose.stride * 2.6);
      const headY = 17 + by;

      // [部件 1] 背后斜向撕裂空间的「紫红深渊隙间裂隙」+ 璀璨凝视的金红隙间魔瞳！
      p.poly(
        [
          [bx - 16, 17 + by],
          [bx - 8, 12 + by],
          [bx + 9, 13 + by],
          [bx + 15, 19 + by],
          [bx + 7, 23 + by],
          [bx - 9, 22 + by],
        ],
        '#3d082d',
        true,
      );
      p.poly(
        [
          [bx - 13, 17 + by],
          [bx - 6, 14 + by],
          [bx + 7, 15 + by],
          [bx + 12, 19 + by],
          [bx + 5, 21 + by],
          [bx - 7, 20 + by],
        ],
        '#b8195d',
        true,
      );
      drawCircle(p, bx - 10, 17 + by, 1.5, '#ffe878', true);
      p.px(bx - 10, 17 + by, '#8c0d2b');
      drawCircle(p, bx + 9, 18 + by, 1.5, '#ffe878', true);
      p.px(bx + 9, 18 + by, '#8c0d2b');

      // 宏伟黑紫鎏金镶边深渊蝠翼
      drawAsymBatWings(p, bx, 26 + by, 17, 12, 10, flap, '#1a0516', '#5e113a', '#ffd466');

      // [部件 2] 瀑布般向左飘扬的雪白淡银紫长发（高对比神级剪影！）
      p.poly(
        [
          [bx - 6, headY],
          [bx + 6, headY],
          [bx + 7 - Math.round(sway * 0.3), 38 + by],
          [bx - 12 + sway, 40 + by],
          [bx - 11 + sway, 29 + by],
        ],
        '#bdb3d9',
      );
      p.poly(
        [
          [bx - 5, headY + 1],
          [bx + 5, headY + 1],
          [bx + 5, 36 + by],
          [bx - 9 + sway, 38 + by],
        ],
        '#f4f0ff',
      );
      p.line(bx - 6, headY + 4, bx - 10 + sway, 36 + by, '#ffffff', 1);

      // [部件 3] 1×2 修长高挑魔姬双腿（优雅前迈高开衩 + 黑金高跟长靴！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.line(bx - 3, 40 + by, bx - 6 - stride, 46 + lLift, '#f5d9d0', 2);
      p.rect(bx - 7 - stride, 44 + lLift, 3, 5, '#240819');
      p.line(bx + 2, 40 + by, bx + 4 + stride, 46 + rLift, '#ffeae2', 2);
      p.rect(bx + 3 + stride, 44 + rLift, 4, 5, '#3b0e29');
      p.px(bx + 5 + stride, 45 + rLift, '#ffd466');

      // [部件 4] 黑红丝绒鎏金高开衩哥特长礼服
      const sk = Math.round(-pose.leanX * 0.5 + sway * 0.6);
      p.poly(
        [
          [bx - 5, 30 + by],
          [bx + 5, 30 + by],
          [bx + 10 + sk, 44 + by],
          [bx - 11 + sk, 44 + by],
        ],
        '#210718',
      );
      p.poly(
        [
          [bx - 3, 30 + by],
          [bx + 3, 30 + by],
          [bx + 6 + sk, 42 + by],
          [bx - 7 + sk, 42 + by],
        ],
        '#bd1c52',
      );
      // 侧开衩露出修长白皙右腿线条 + 鎏金滚边
      p.line(bx + 2, 36 + by, bx + 4 + sk, 43 + by, '#ffeae2', 2);
      p.hline(bx - 10 + sk, 43 + by, 20, '#ffd466');
      p.rect(bx - 4, 23 + by, 8, 7, '#29091f');
      p.hline(bx - 4, 29 + by, 8, '#ffd466');
      p.px(bx, 25 + by, '#ff4778', true);
      // 左手轻挥唤出暗金深渊符粒
      p.line(bx - 5, 25 + by, bx - 10, 29 + by, '#ffeae2', 1);
      p.px(bx - 11, 28 + by, '#ff4778', true);

      // [部件 5] 艳丽高贵魔姬面容 + 璀璨金红双瞳 + 雪白长发 + 弯月黑金恶魔双角！
      drawMaidenHead(p, bx, headY, '#fff2f5', '#e8c4d0');
      drawChibiFaceEyes(p, bx + 1, headY, '#d91644', '#ffe066', pose);
      drawMaidenCrown(p, bx, headY, '#ada2c9', '#e3ddf7', '#f7f5ff', '#ffffff');
      drawMaidenLocks(p, bx, headY, '#ada2c9', '#f4f0ff', 9, 8);
      // 弯月后掠黑金双角
      p.line(bx - 4, headY - 6, bx - 9, headY - 10, '#240819', 2);
      p.px(bx - 9, headY - 10, '#ffd466', true);
      p.line(bx + 4, headY - 6, bx + 8, headY - 10, '#240819', 2);
      p.px(bx + 8, headY - 10, '#ffd466', true);

      // [部件 6] 右臂与「绯金月牙死神巨镰」（4 帧完整挥斩裂空弧，绝不撞双角！）
      if (isAtk && f === 0) {
        // 蓄力高抡巨镰
        p.line(bx + 4, 25 + by, bx + 9, 20 + by, '#ffeae2', 2);
        p.line(bx + 3, 39 + by, bx + 14, 10 + by, '#591632', 2);
        p.line(bx + 4, 37 + by, bx + 14, 11 + by, '#ffd466', 1);
        p.poly([[bx + 14, 10 + by], [bx + 6, 4 + by], [bx + 1, 9 + by], [bx + 8, 9 + by], [bx + 14, 14 + by]], '#ff245c', true);
      } else if (isAtk && (f === 1 || f === 2)) {
        // 巨镰大弧前劈，撕裂炽红鎏金半月剑气！
        p.line(bx + 4, 26 + by, bx + 12, 30 + by, '#ffeae2', 2);
        p.line(bx + 4, 24 + by, Math.min(43, bx + 24), 35 + by, '#591632', 2);
        p.line(bx + 5, 24 + by, Math.min(43, bx + 24), 35 + by, '#ffd466', 1);
        const stx = Math.min(44, bx + 24);
        p.poly([[stx, 35 + by], [stx - 4, 25 + by], [stx - 9, 22 + by], [stx - 3, 29 + by]], '#ff245c', true);
        drawSlashArc(p, bx + 12, 26 + by, 15, 14, -1.2, 0.95, '#ff245c', '#ffe478');
      } else {
        // 优雅近身侧持巨镰（自然屈肘轻握镰杆，告别长面条横臂！）
        const scX = Math.min(41, bx + 13);
        p.line(bx + 4, 25 + by, bx + 8, 29 + by, '#ffeae2', 2);
        p.line(bx + 8, 29 + by, scX - 1, 27 + by, '#ffeae2', 2);
        p.line(scX - 3, 46 + by, scX + 1, 9 + by, '#591632', 2);
        p.line(scX - 2, 44 + by, scX + 1, 11 + by, '#ffd466', 1);
        p.poly(
          [
            [scX + 1, 9 + by],
            [scX + 9, 6 + by],
            [scX + 12, 14 + by],
            [scX + 6, 11 + by],
            [scX + 1, 13 + by],
          ],
          '#ff245c',
          true,
        );
        p.line(scX + 9, 6 + by, scX + 12, 14 + by, '#ffe899', 1, true);
      }
    },
  },

  // =========================================================================
  // 10. 死亡召唤物：深渊冰魔（灵动悬空极寒冰晶小魔娘 · 冰晶弯角 + 寒霜浮游冰矛！）
  // =========================================================================
  creature_abyss_ice_demon: {
    backdropTop: '#0b1633',
    backdropBottom: '#1a2e63',
    backdropGlow: '#78e6ff',
    avatarCrop: { x: 8, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 19 : Math.round(21 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 1.3 - pose.stepLift - 1);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 2.4 + pose.flutter);
      const sway = Math.round(pose.flutter * 1.4);
      const stride = Math.round(pose.stride * 2.6);
      const headY = 18 + by;

      // [部件 1] 深海宝蓝×薰衣草紫非对称灵动魔翼
      drawAsymBatWings(p, bx, 27 + by, 15, 11, 9, flap, '#1f2d6e', '#644bb3', '#b8deff');

      // 飘逸冰蓝微卷短发背影
      p.poly(
        [
          [bx - 7, headY],
          [bx + 6, headY],
          [bx + 7, headY + 8],
          [bx - 9 + sway, headY + 9],
        ],
        '#3d68b8',
      );
      p.ellipse(bx, headY + 1, 6.2, 4.8, '#85c4ff');

      // [部件 2] 俏皮悬空秀气双腿（雪白短袜 + 白绒边冰蓝小短靴，柔美收拢！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(bx - 4 - stride, 42 + lLift, 3, 5, '#e6f5ff');
      p.rect(bx - 5 - stride, 46 + lLift, 4, 3, '#2d5ab0');
      p.rect(bx + 2 + stride, 42 + rLift, 3, 4, '#ffffff');
      p.rect(bx + 2 + stride, 45 + rLift, 4, 3, '#4c88e6');
      p.hline(bx + 2 + stride, 45 + rLift, 4, '#ffffff');

      // [部件 3] 冰蓝雪花哥特蓬蓬短裙 + 薰衣草紫蝴蝶结腰饰
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      p.poly(
        [
          [bx - 5, 32 + by],
          [bx + 5, 32 + by],
          [bx + 10 + sk, 42 + by],
          [bx - 10 + sk, 42 + by],
        ],
        '#2c4291',
      );
      p.poly(
        [
          [bx - 3, 32 + by],
          [bx + 3, 32 + by],
          [bx + 7 + sk, 41 + by],
          [bx - 7 + sk, 41 + by],
        ],
        '#70c7ff',
      );
      p.vline(bx - 3, 33 + by, 7, '#a8e3ff');
      p.hline(bx - 9 + sk, 41 + by, 18, '#ffffff');
      p.rect(bx - 4, 25 + by, 8, 7, '#4566bd');
      p.rect(bx - 2, 27 + by, 4, 3, '#c785ff');
      p.px(bx, 28 + by, '#ffffff', true);
      p.line(bx - 5, 27 + by, bx - 9, 30 + by, '#85c4ff', 2);
      p.line(bx + 5, 27 + by, bx + 10, 29 + by, '#a8d9ff', 2);

      // [部件 4] 粉嫩可爱冰霜少女脸庞 + 宝石蓝大瞳 + 透亮冰晶小恶魔弯角！
      drawMaidenHead(p, bx, headY, '#f7faff', '#cfe0f5');
      drawChibiFaceEyes(p, bx + 1, headY, '#1f62d6', '#85f2ff', pose);
      drawMaidenCrown(p, bx, headY, '#3862b3', '#78b5ff', '#bae0ff', '#ffffff');
      drawMaidenLocks(p, bx, headY, '#3862b3', '#99ccff', 7, 6);
      // 透亮晶莹冰晶双角
      p.poly([[bx - 5, headY - 5], [bx - 8, headY - 10], [bx - 2, headY - 7]], '#85f2ff', true);
      p.poly([[bx + 5, headY - 5], [bx + 8, headY - 10], [bx + 2, headY - 7]], '#85f2ff', true);
      p.px(bx - 7, headY - 9, '#ffffff', true);
      p.px(bx + 7, headY - 9, '#ffffff', true);

      // [部件 5] 身侧悬浮锋利「极光寒霜冰晶矛」×3（攻击帧向前急射冰霜尖矛爆发！）
      const shootX = isAtk && (f === 1 || f === 2) ? 6 : 0;
      // 前方主寒冰尖矛（斜指右前，清晰锐利！）
      const ix = Math.min(42, bx + 15 + shootX);
      const iy = 28 + by + Math.round(sway * 0.5);
      p.poly(
        [
          [ix + 5, iy - 2],
          [ix - 1, iy - 4],
          [ix - 4, iy + 2],
          [ix + 1, iy + 3],
        ],
        '#75ebff',
        true,
      );
      p.line(ix - 2, iy + 1, ix + 5, iy - 2, '#ffffff', 1, true);
      // 上方小冰晶星棱
      drawDiamond(p, Math.min(43, bx + 14 + Math.round(shootX * 0.6)), 19 + by - sway, 1.8, 3.0, '#c799ff', true);
      p.px(Math.min(43, bx + 14 + Math.round(shootX * 0.6)), 18 + by - sway, '#ffffff', true);
      // 左侧平衡浮游冰晶
      drawDiamond(p, bx - 15, 33 + by - sway, 2.0, 3.4, '#85f2ff', true);
      p.px(bx - 15, 32 + by - sway, '#ffffff', true);

      if (isAtk && (f === 1 || f === 2)) {
        p.line(bx + 10, 29 + by, ix - 2, iy, '#a8f7ff', 1, true);
        drawSlashArc(p, bx + 13, 27 + by, 10, 10, -1.0, 1.0, '#6cf2ff', '#d4adff');
      }
    },
  },
};

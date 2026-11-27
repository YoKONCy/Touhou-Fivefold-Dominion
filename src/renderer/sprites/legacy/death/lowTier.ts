/**
 * 幽冥公馆 · 死亡系英雄与低阶（T1）精雕 48×54 像素立绘绘谱
 * 包含：蕾米莉亚·斯卡雷特、尸壳、小恶魔
 */

import {
  drawChibiFaceEyes,
  type PixelPainter,
  type RigPose,
  type SpriteRigSpec,
} from '../../../voxelSprites';
import {
  drawAsymBatWings,
  drawCircle,
  drawMaidenCrown,
  drawMaidenHead,
  drawMaidenLocks,
  drawSlashArc,
} from './helpers';

export const DEATH_LOW_TIER_RIG_SPECS: Record<string, SpriteRigSpec> = {
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
};

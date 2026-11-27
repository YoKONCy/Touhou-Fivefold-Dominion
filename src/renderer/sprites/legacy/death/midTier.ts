/**
 * 幽冥公馆 · 死亡系中阶（T2-T3）精雕 48×54 像素立绘绘谱
 * 包含：怨灵、地狱鸦、血族眷属、毒瘴妖
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

export const DEATH_MID_TIER_RIG_SPECS: Record<string, SpriteRigSpec> = {
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
};

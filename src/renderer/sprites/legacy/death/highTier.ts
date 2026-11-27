/**
 * 幽冥公馆 · 死亡系高阶（T4）与召唤物精雕 48×54 像素立绘绘谱
 * 包含：骸骨巨龙、深渊隙间恶魔、深渊冰魔
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
  drawDiamond,
  drawMaidenCrown,
  drawMaidenHead,
  drawMaidenLocks,
  drawSlashArc,
} from './helpers';

export const DEATH_HIGH_TIER_RIG_SPECS: Record<string, SpriteRigSpec> = {
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

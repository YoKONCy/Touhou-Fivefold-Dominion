/**
 * 魔法之森 · 混沌系高阶（T3B-T4）精雕 48×54 像素立绘与骨骼动画像素绘谱
 * 包含：法界之火、极星红莲魔龙、魔导巨像
 */

import type { PixelPainter, RigPose, SpriteRigSpec } from '../../voxelSprites';

export const CHAOS_HIGH_RIG_SPECS: Record<string, SpriteRigSpec> = {
  /** 混沌 T3-B：法界之火（1×2 魔界·法界永燃魔火化身 · 盘旋升腾紫红金神焰柱 + 展开火翼光羽 + 浮空黄金魔界法轮 + 护身魔火环） */
  creature_efreet: {
    backdropTop: '#140624',
    backdropBottom: '#380b30',
    backdropGlow: '#ff52a8',
    avatarCrop: { x: 10, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAttack = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const sway = Math.round(Math.sin(phase) * 2.2);
      const sway2 = Math.round(Math.cos(phase) * 2.0);

      const bx = isAttack && f === 1 ? 20 : isAttack && f === 2 ? 21 : Math.round(24 + pose.leanX * 0.8);
      const by = Math.round(pose.breathY * 1.4 - pose.stepLift);
      const lean = isMove ? 3 : isAttack && f === 1 ? 4 : isHit ? -3 : 0;

      // [部件 1] 足底镂空旋转「魔界金紫法阵环」（细密像素光环，绝无实心黑饼！）
      const sealY = 47;
      for (let i = 0; i < 20; i++) {
        const a = phase * 0.6 + (i * Math.PI * 2) / 20;
        const sx = Math.round(bx + Math.cos(a) * 12);
        const sy = Math.round(sealY + Math.sin(a) * 2.2);
        p.px(sx, sy, i % 5 === 0 ? '#ffe878' : i % 2 === 0 ? '#c738b8' : '#7a198f', true);
      }

      // [部件 2] 背后神圣威严的「黄金魔界八芒法轮」（对称几何菱形金环，绝非杂点！）
      const haloY = 18 + by;
      const hr = isAttack && f <= 1 ? 11 : 9.5;
      p.line(bx, haloY - hr, bx + hr, haloY, '#d9982b', 1, true);
      p.line(bx + hr, haloY, bx, haloY + hr, '#d9982b', 1, true);
      p.line(bx, haloY + hr, bx - hr, haloY, '#d9982b', 1, true);
      p.line(bx - hr, haloY, bx, haloY - hr, '#d9982b', 1, true);
      p.px(bx, Math.round(haloY - hr), '#ffffff', true);
      p.px(Math.round(bx + hr), haloY, '#ffe878', true);
      p.px(Math.round(bx - hr), haloY, '#ffe878', true);
      // 十字光棱小星点
      p.px(bx - 7, haloY - 7, '#ff73c4', true);
      p.px(bx + 7, haloY - 7, '#ff73c4', true);

      // [部件 3] 后景环绕「法界护身魔火」（4 枚 3D 轨道后半段，呼应烈焰护盾特技！）
      for (let i = 0; i < 4; i++) {
        const a = phase + (i * Math.PI * 2) / 4;
        if (Math.sin(a) < 0) {
          const ox = Math.round(bx + Math.cos(a) * 15);
          const oy = Math.round(28 + by + Math.sin(a) * 5 - Math.cos(a) * 3);
          p.ellipse(ox, oy, 2.0, 2.6, '#d92680', true);
          p.px(ox, oy - 1, '#fff0a6', true);
        }
      }

      // [部件 4] 向两侧高高舒展跃动的「法界魔火流焰羽翼」（飘逸燃羽，彻底告别小丑T字袖！）
      const wingLift = Math.round(Math.sin(phase) * 2.2);
      // 左翼紫金流焰
      p.poly([
        [bx - 4, 24 + by],
        [bx - 16 - lean, 14 + by + wingLift],
        [bx - 18 - lean, 21 + by + wingLift],
        [bx - 11 - lean, 27 + by],
        [bx - 5, 29 + by],
      ], '#7d1478', true);
      p.poly([
        [bx - 5, 24 + by],
        [bx - 14 - lean, 16 + by + wingLift],
        [bx - 13 - lean, 23 + by + wingLift],
        [bx - 5, 27 + by],
      ], '#f03285', true);
      p.line(bx - 6, 24 + by, bx - 14 - lean, 17 + by + wingLift, '#ffbf47', 1, true);
      p.px(bx - 16 - lean, 14 + by + wingLift, '#fff7cc', true);

      // 右翼紫金流焰（攻击时向前化作燃爆火流！）
      const rWingX = isAttack && f >= 1 && f <= 2 ? bx + 12 : bx + 16 - lean;
      const rWingY = isAttack && f >= 1 && f <= 2 ? 19 + by : 15 + by - wingLift;
      p.poly([
        [bx + 4, 24 + by],
        [rWingX, rWingY],
        [rWingX + 2, rWingY + 7],
        [bx + 10, 28 + by],
        [bx + 4, 29 + by],
      ], '#7d1478', true);
      p.poly([
        [bx + 5, 24 + by],
        [rWingX - 1, rWingY + 2],
        [rWingX - 1, rWingY + 7],
        [bx + 5, 27 + by],
      ], '#f03285', true);
      p.line(bx + 6, 24 + by, rWingX - 1, rWingY + 2, '#ffbf47', 1, true);

      // [部件 5] 优雅 S 形盘旋升腾的「法界之火元素灵躯」（紫红魔焰外层 → 烈橙金中层 → 炽白星核！）
      const tailX = bx - lean * 1.6 + sway;
      // 外层深紫红动态火焰轮廓（无生硬矩形，自然收腰！）
      p.poly([
        [tailX, 45 + by],
        [bx - 7 - lean, 38 + by],
        [bx - 4, 31 + by],
        [bx - 8, 22 + by],
        [bx + 8, 22 + by],
        [bx + 4, 31 + by],
        [bx + 7 - lean * 0.5, 38 + by],
        [tailX + 2, 45 + by],
      ], '#6b1270');
      p.poly([
        [tailX, 44 + by],
        [bx - 5 - lean * 0.7, 37 + by],
        [bx - 3, 30 + by],
        [bx - 6, 21 + by],
        [bx + 6, 21 + by],
        [bx + 3, 30 + by],
        [bx + 5, 37 + by],
      ], '#e62978', true);
      // 中层炽橙金流动焰芯
      p.poly([
        [tailX + 1, 41 + by],
        [bx - 3, 34 + by],
        [bx - 4, 22 + by],
        [bx + 4, 22 + by],
        [bx + 2, 35 + by],
      ], '#ff8c2b', true);
      // 核心炽白金魔火束
      p.poly([
        [bx - 2, 23 + by],
        [bx + 2, 23 + by],
        [bx + 1, 33 + by],
        [tailX + 1, 39 + by],
      ], '#ffe878', true);
      p.vline(bx, 23 + by, 10, '#ffffff', true);
      // 胸口浮游暗金法界印记环
      p.line(bx - 5, 28 + by, bx + 5, 26 + by, '#ffe066', 1, true);
      p.px(bx, 27 + by, '#ffffff', true);

      // [部件 6] 飘逸流线火焰长首 + 向上卷燃的三道不对称神焰冠 + 锐利炽金灵目！（绝无小丑尖帽！）
      const hy = 15 + by;
      // 不对称摇曳升腾的三股高挑长火舌
      p.poly([
        [bx - 6, hy + 4],
        [bx - 7 + sway, hy - 3],
        [bx - 4 + sway2, hy - 9],
        [bx - 1, hy - 5],
        [bx + 1 - sway, hy - (isAttack && f <= 1 ? 13 : 11)],
        [bx + 4, hy - 5],
        [bx + 7 + sway2, hy - 7],
        [bx + 6, hy + 4],
      ], '#d91f7a', true);
      p.poly([
        [bx - 4, hy + 2],
        [bx - 2 + sway2, hy - 7],
        [bx + 1 - sway, hy - (isAttack && f <= 1 ? 11 : 9)],
        [bx + 4, hy + 2],
      ], '#ff9e33', true);
      p.line(bx, hy - 1, Math.round(bx + 1 - sway), hy - (isAttack && f <= 1 ? 10 : 8), '#fff8cc', 1, true);

      // 灵火中凝结的深靛灵颜核 + 锐利斜飞炽金双瞳 + 浮空眉心菱印
      p.poly([
        [bx, hy - 4],
        [bx + 5, hy],
        [bx + 3, hy + 5],
        [bx, hy + 6],
        [bx - 3, hy + 5],
        [bx - 5, hy],
      ], '#1b0630');
      p.px(bx, hy - 3, '#ffe478', true); // 眉心法界金印
      if (isHit) {
        p.hline(bx - 3, hy + 1, 2, '#d98aff');
        p.hline(bx + 2, hy + 1, 2, '#d98aff');
      } else {
        // 威严斜飞炽白金目
        p.line(bx - 4, hy, bx - 2, hy + 1, '#ffe466', 1, true);
        p.line(bx + 4, hy, bx + 2, hy + 1, '#ffe466', 1, true);
        p.px(bx - 2, hy + 1, '#ffffff', true);
        p.px(bx + 2, hy + 1, '#ffffff', true);
      }

      // [部件 7] 攻击态：盘旋冲出的紫红金「法界业火炽浪」（x = 30..46 净空爆发，凌厉流线！）
      if (isAttack && f === 0) {
        // 蓄焰聚核：胸前绽放十字法界金星
        p.ellipse(bx, 25 + by, 4.2, 4.2, '#ff4599', true);
        p.ellipse(bx, 25 + by, 2.4, 2.4, '#fff7cc', true);
        p.hline(bx - 7, 25 + by, 15, '#ffe878', true);
        p.vline(bx, 18 + by, 15, '#ffe878', true);
        p.px(bx, 25 + by, '#ffffff', true);
      } else if (isAttack && f === 1) {
        // 流线旋卷三股紫金火蛇前扑轰击！
        p.line(29, 23 + by, 37, 17 + by, '#e62478', 3, true);
        p.line(37, 17 + by, 45, 20 + by, '#ff9c38', 2, true);
        p.line(29, 25 + by, 46, 24 + by, '#ff4d94', 3, true);
        p.line(30, 25 + by, 45, 24 + by, '#fff5b8', 2, true);
        p.line(32, 25 + by, 44, 24 + by, '#ffffff', 1, true);
        p.line(29, 27 + by, 38, 32 + by, '#c71f80', 3, true);
        p.line(38, 32 + by, 45, 29 + by, '#ffe066', 2, true);
        p.px(46, 19 + by, '#ffffff', true);
        p.px(46, 29 + by, '#ffe878', true);
      } else if (isAttack && f === 2) {
        p.line(33, 19 + by, 45, 22 + by, '#ff66b2', 2, true);
        p.line(34, 25 + by, 46, 25 + by, '#ffe878', 2, true);
        p.line(33, 31 + by, 44, 28 + by, '#c94dff', 1, true);
        p.px(45, 25 + by, '#ffffff', true);
        p.px(42, 17 + by, '#ffe878', true);
      }

      // [部件 8] 前景环绕「法界护身魔火」（4 枚 3D 轨道前半段）
      for (let i = 0; i < 4; i++) {
        const a = phase + (i * Math.PI * 2) / 4;
        if (Math.sin(a) >= 0) {
          const ox = Math.round(bx + Math.cos(a) * 15);
          const oy = Math.round(28 + by + Math.sin(a) * 5 - Math.cos(a) * 3);
          p.ellipse(ox, oy, 2.2, 2.8, '#ff4599', true);
          p.ellipse(ox, oy - 0.5, 1.2, 1.6, '#ffe878', true);
          p.px(ox, oy - 1, '#ffffff', true);
        }
      }
    },
  },

  /** 混沌 T4-B：极星红莲魔龙（2×2 史诗级 S 颈展翼龙王 + 雕纹双膜巨翼 + 弯曲象牙金角 + 叠鳞金腹 + 利爪长尾） */
  creature_crimson_dragon: {
    backdropTop: '#120610',
    backdropBottom: '#380c1a',
    backdropGlow: '#ff384f',
    avatarCrop: { x: 14, y: 4, size: 28 },
    portraitCrop: { x: 1, y: 1, w: 46, h: 50 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(22 + pose.leanX * 0.9);
      const by = Math.round(pose.breathY * 1.2 - pose.stepLift);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 3.2);
      const tw = Math.round(pose.flutter * 2.2);

      // [部件 1] 宏伟蔽日的双扇「红莲龙骨膜翼」（扇形分骨 + 渐变红莲翼膜 + 黄金翼爪！）
      // 左主大翼（大幅后展，极富气势）
      p.poly([
        [bx - 2, 23 + by],
        [bx - 16, 4 + by + flap],
        [bx - 21, 14 + by + flap],
        [bx - 17, 25 + by + flap],
        [bx - 12, 22 + by + flap],
        [bx - 7, 28 + by],
      ], '#260b17');
      p.poly([
        [bx - 4, 23 + by],
        [bx - 15, 8 + by + flap],
        [bx - 19, 15 + by + flap],
        [bx - 16, 22 + by + flap],
        [bx - 12, 20 + by + flap],
        [bx - 7, 25 + by],
      ], '#b51933');
      p.poly([
        [bx - 6, 22 + by],
        [bx - 14, 11 + by + flap],
        [bx - 16, 17 + by + flap],
        [bx - 10, 21 + by],
      ], '#f03e56');
      // 翼骨主梁与弯指骨
      p.line(bx - 3, 23 + by, bx - 16, 4 + by + flap, '#4d172c', 2);
      p.line(bx - 16, 4 + by + flap, bx - 21, 14 + by + flap, '#4d172c', 2);
      p.line(bx - 14, 9 + by + flap, bx - 17, 24 + by + flap, '#381020', 1);
      p.px(bx - 16, 4 + by + flap, '#ffe478', true);

      // 右侧远景翼
      p.poly([
        [bx + 4, 20 + by],
        [bx + 15, 4 + by + flap],
        [bx + 19, 15 + by + flap],
        [bx + 12, 21 + by],
      ], '#210a14');
      p.poly([
        [bx + 5, 20 + by],
        [bx + 13, 8 + by + flap],
        [bx + 16, 15 + by + flap],
        [bx + 10, 19 + by],
      ], '#94142b');
      p.px(bx + 15, 4 + by + flap, '#ffe478', true);

      // [部件 2] 矫健盘卷的长棘龙尾 + 红莲矛尖
      p.poly([
        [bx - 9, 36 + by],
        [bx - 19, 39 + by + tw],
        [bx - 17, 45 + by + tw],
        [bx - 7, 40 + by],
      ], '#290d1a');
      p.line(bx - 10, 37 + by, bx - 18, 40 + by + tw, '#80203a', 1);
      p.poly([[bx - 18, 39 + by + tw], [bx - 22, 42 + by + tw], [bx - 17, 46 + by + tw]], '#ff5e2b', true);
      p.px(bx - 20, 42 + by + tw, '#fff8cc', true);

      // [部件 3] 强壮流线型红莲龙躯（加深红紫高光轮廓，在暗夜背景中立体突出！）+ 弧形黄金胸腹鳞
      p.poly([
        [bx - 10, 32 + by],
        [bx - 2, 26 + by],
        [bx + 8, 28 + by],
        [bx + 9, 37 + by],
        [bx - 1, 41 + by],
        [bx - 10, 38 + by],
      ], '#401122');
      p.poly([
        [bx - 8, 31 + by],
        [bx - 1, 27 + by],
        [bx + 7, 29 + by],
        [bx + 6, 36 + by],
        [bx - 7, 36 + by],
      ], '#8f1b36');
      p.line(bx - 7, 29 + by, bx + 4, 28 + by, '#de3754', 1);
      // 胸前弧形金鳞甲片（由咽喉顺滑延伸至腹下，内蕴炽焰星核微光！）
      p.poly([
        [bx + 1, 28 + by],
        [bx + 7, 29 + by],
        [bx + 8, 37 + by],
        [bx + 2, 39 + by],
      ], '#c97b28');
      p.hline(bx + 2, 30 + by, 5, '#ffe066');
      p.hline(bx + 2, 33 + by, 6, '#fff4ad', true);
      p.hline(bx + 2, 36 + by, 5, '#ffe066');
      p.px(bx + 4, 33 + by, '#ffffff', true);

      // [部件 4] 肌肉弯折的强悍龙腿 + 锋利张开的黄金巨爪（绝非方块黑靴！）
      // 远侧后爪
      p.poly([[bx - 9, 36 + by], [bx - 4, 37 + by], [bx - 7, 45], [bx - 11, 45]], '#5e172c');
      p.vline(bx - 7, 38 + by, 6, '#9c2440');
      p.px(bx - 12, 47, '#ffe073');
      p.px(bx - 9, 47, '#ffe073');
      p.px(bx - 6, 47, '#ffe073');
      // 近侧强健前胸龙爪（张爪凌空或踏地）
      const clawLift = pose.armAction >= 0.5 ? -3 : 0;
      p.poly([[bx + 3, 35 + by], [bx + 8, 35 + by], [bx + 11, 43 + clawLift], [bx + 6, 44 + clawLift]], '#9e213e');
      p.vline(bx + 7, 36 + by, 6, '#e0425e');
      p.line(bx + 7, 43 + clawLift, bx + 11, 46 + clawLift, '#ffe478', 1);
      p.line(bx + 9, 43 + clawLift, bx + 13, 46 + clawLift, '#fff4b8', 1);
      p.px(bx + 5, 46 + clawLift, '#ffe073');

      // [部件 5] 威武高昂的「S 形修长龙颈」+ 黄金背棘 + 雕塑感凶猛红莲龙首 + 弯曲象牙金龙角！
      const hx = bx + 10;
      const hy = 15 + by;
      p.poly([
        [bx + 2, 29 + by],
        [bx + 4, 21 + by],
        [hx - 2, hy + 2],
        [hx + 3, hy + 5],
        [bx + 9, 25 + by],
        [bx + 8, 32 + by],
      ], '#5c152b');
      p.poly([
        [bx + 4, 28 + by],
        [bx + 6, 22 + by],
        [hx, hy + 3],
        [hx + 2, hy + 5],
        [bx + 8, 29 + by],
      ], '#c92642');
      p.line(bx + 5, 27 + by, hx, hy + 4, '#ff5c77', 1);
      // 颈背三颗黄金尖棘
      p.px(bx + 3, 24 + by, '#ffe066', true);
      p.px(bx + 5, 20 + by, '#ffe066', true);
      p.px(bx + 7, 17 + by, '#fff4b8', true);

      // 优雅后弯的「双象牙金龙角」（先斜上再优雅后勾，告别直薯条！）
      p.line(hx - 1, hy, hx - 5, hy - 5, '#d9982b', 2);
      p.line(hx - 5, hy - 5, hx - 10, hy - 6, '#fff099', 1, true);
      p.line(hx + 2, hy, hx - 1, hy - 6, '#f0b844', 2);
      p.line(hx - 1, hy - 6, hx - 5, hy - 8, '#fff7cc', 1, true);

      // 雕塑感立体魔龙首（高眉脊 + 修长尖吻 + 发光熔金竖瞳 + 锋利龙牙！）
      p.poly([
        [hx - 3, hy],
        [hx + 5, hy],
        [hx + 11, hy + 3],
        [hx + 10, hy + 6],
        [hx - 1, hy + 6],
      ], '#381022');
      p.poly([
        [hx - 1, hy + 1],
        [hx + 5, hy + 1],
        [hx + 10, hy + 3],
        [hx + 9, hy + 5],
        [hx, hy + 5],
      ], '#d92642');
      p.hline(hx, hy + 1, 6, '#ff637d');
      p.px(hx + 9, hy + 3, '#ffe478', true); // 鼻孔星火
      // 下颌与雪白龙牙
      const jawOpen = pose.armAction >= 0.5 || pose.slashAlpha > 0.2 ? 3 : 0;
      p.poly([
        [hx, hy + 5 + jawOpen],
        [hx + 9, hy + 5 + jawOpen],
        [hx + 7, hy + 8 + jawOpen],
        [hx - 1, hy + 7 + jawOpen],
      ], '#2b0d1c');
      p.px(hx + 8, hy + 5, '#ffffff');
      p.px(hx + 5, hy + 5, '#ffffff');
      p.px(hx + 7, hy + 6 + jawOpen, '#ffffff');
      // 炽金魔龙威慑竖瞳
      p.rect(hx + 1, hy + 2, 3, 2, '#ffe84d', true);
      p.px(hx + 2, hy + 2, '#ffffff', true);

      // [部件 6] 攻击时爆发红莲星火龙息！
      if (jawOpen > 0) {
        p.poly([[hx + 7, hy + 5], [hx + 16, hy + 1], [hx + 16, hy + 12]], '#e62638', true);
        p.poly([[hx + 8, hy + 5], [hx + 15, hy + 3], [hx + 15, hy + 10]], '#ff9d2b', true);
        p.poly([[hx + 9, hy + 5], [hx + 14, hy + 4], [hx + 14, hy + 8]], '#fff8cc', true);
      }
    },
  },

  /** 混沌 T4-A：魔导巨像（2×3 魔法之森黑曜符文魔晶巨像 · 浮空魔冠石首 + 紫金星辉炉心 + 浮游符文重肩与紫晶巨拳！） */
  creature_arcane_colossus: {
    backdropTop: '#0d081f',
    backdropBottom: '#291442',
    backdropGlow: '#c26bff',
    avatarCrop: { x: 10, y: 3, size: 28 },
    portraitCrop: { x: 1, y: 2, w: 46, h: 49 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(24 + pose.leanX * 0.9);
      const by = Math.round(pose.breathY * 0.9 - pose.stepLift * 0.8);
      const st = Math.round(pose.stride * 2.8);
      const hover = Math.round(Math.sin(pose.phase * Math.PI * 2) * 1.6);

      // [部件 1] 背后缓缓旋转的「断裂古金魔导星环」与两枚浮游紫水晶棱锥
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + pose.phase * 0.6;
        if (i % 7 === 0) continue;
        const rx = Math.round(bx + Math.cos(a) * 17);
        const ry = Math.round(21 + by + Math.sin(a) * 13);
        p.px(rx, ry, i % 2 === 0 ? '#ffe073' : '#b86bff', true);
      }
      // 浮游晶锥
      p.poly([[bx - 19, 12 + by + hover], [bx - 16, 16 + by + hover], [bx - 19, 20 + by + hover], [bx - 21, 16 + by + hover]], '#d470ff', true);
      p.px(bx - 19, 15 + by + hover, '#ffffff', true);
      p.poly([[bx + 19, 12 + by - hover], [bx + 21, 16 + by - hover], [bx + 19, 20 + by - hover], [bx + 16, 16 + by - hover]], '#d470ff', true);
      p.px(bx + 19, 15 + by - hover, '#ffffff', true);

      // [部件 2] 沉重黑曜符文石柱双腿（内置发光紫晶灵脉纵裂纹 + 鎏金护膝！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      // 左腿
      p.poly([[bx - 10, 35 + by], [bx - 3, 35 + by], [bx - 3 - st, 47 + lLift], [bx - 12 - st, 47 + lLift]], '#23163b');
      p.rect(bx - 9 - st, 37 + by, 5, 9, '#3e2966');
      p.hline(bx - 10 - st, 39 + by, 6, '#e6b84d');
      p.vline(bx - 7 - st, 40 + by, 6, '#d478ff', true);
      p.hline(bx - 11 - st, 46 + lLift, 8, '#d9a438');
      // 右腿
      p.poly([[bx + 3, 35 + by], [bx + 10, 35 + by], [bx + 12 + st, 47 + rLift], [bx + 3 + st, 47 + rLift]], '#2c1c4a');
      p.rect(bx + 4 + st, 37 + by, 5, 9, '#523785');
      p.hline(bx + 4 + st, 39 + by, 6, '#ffe073');
      p.vline(bx + 6 + st, 40 + by, 6, '#e08cff', true);
      p.hline(bx + 3 + st, 46 + rLift, 8, '#ffe073');

      // [部件 3] 宏伟倒梯形黑曜石碑躯干 + 古金符文饰边 + 胸腔「混沌星辉魔晶核心炉」！
      p.poly([
        [bx - 12, 19 + by],
        [bx + 12, 19 + by],
        [bx + 9, 36 + by],
        [bx - 9, 36 + by],
      ], '#22153b');
      p.poly([
        [bx - 10, 20 + by],
        [bx + 10, 20 + by],
        [bx + 7, 35 + by],
        [bx - 7, 35 + by],
      ], '#412b6b');
      // 躯干石甲边缘鎏金符文框线
      p.hline(bx - 11, 20 + by, 22, '#e6b84d');
      p.hline(bx - 8, 34 + by, 16, '#d49a38');
      p.vline(bx - 8, 22 + by, 11, '#7854b8');
      p.vline(bx + 8, 22 + by, 11, '#2b1b4a');
      // 胸口裂石八角炉膛 + 炽烈紫金混沌魔晶核心！
      p.ellipse(bx, 27 + by, 5.4, 5.6, '#140a24');
      p.ellipse(bx, 27 + by, 4.3, 4.5, '#c742ff', true);
      p.poly([[bx, 22 + by], [bx + 4, 27 + by], [bx, 32 + by], [bx - 4, 27 + by]], '#ffe466', true);
      p.rect(bx - 1, 26 + by, 2, 2, '#ffffff', true);

      // [部件 4] 魔力悬空的「黑曜魔冠石雕巨首」（悬浮颈缝透出紫光 + 弯曲金角 + 炽亮单目裂隙！）
      const hy = 11 + by + Math.round(hover * 0.5);
      p.hline(bx - 4, hy + 6, 8, '#d966ff', true); // 悬空魔力颈缝！
      // 弯曲古金魔导双角
      p.line(bx - 5, hy - 1, bx - 10, hy - 7, '#d99a2e', 2);
      p.px(bx - 10, hy - 7, '#fff299', true);
      p.line(bx + 5, hy - 1, bx + 10, hy - 7, '#f2c144', 2);
      p.px(bx + 10, hy - 7, '#fff299', true);
      // 棱角分明的魔石雕像首
      p.poly([
        [bx - 6, hy - 4],
        [bx, hy - 8],
        [bx + 6, hy - 4],
        [bx + 5, hy + 4],
        [bx, hy + 6],
        [bx - 5, hy + 4],
      ], '#2b1b4a');
      p.poly([
        [bx - 4, hy - 3],
        [bx, hy - 6],
        [bx + 4, hy - 3],
        [bx + 4, hy + 3],
        [bx, hy + 5],
        [bx - 4, hy + 3],
      ], '#5a3d91');
      p.px(bx, hy - 6, '#ffe478', true);
      // 炽亮紫金魔导目镜光带
      p.hline(bx - 4, hy, 8, '#140821');
      p.hline(bx - 3, hy, 6, '#ff66e0', true);
      p.hline(bx - 1, hy, 3, '#fff7cc', true);

      // [部件 5] 悬浮符文重石双肩 + 紫电牵引的「巨型棱晶魔导铁拳」（攻击时双拳爆裂横扫！）
      // 左肩 + 左悬空晶拳
      const lArmY = 28 + by - Math.round(pose.stride * 2);
      p.poly([[bx - 20, 18 + by], [bx - 12, 16 + by], [bx - 11, 24 + by], [bx - 18, 25 + by]], '#36235c');
      p.hline(bx - 19, 18 + by, 8, '#ffe073');
      p.px(bx - 15, 21 + by, '#e078ff', true);
      p.line(bx - 16, 25 + by, bx - 17, lArmY + 2, '#c759ff', 2, true); // 魔力悬浮肘光
      p.poly([
        [bx - 22, lArmY],
        [bx - 13, lArmY],
        [bx - 13, lArmY + 9],
        [bx - 18, lArmY + 11],
        [bx - 22, lArmY + 8],
      ], '#2b194d');
      p.rect(bx - 20, lArmY + 2, 5, 6, '#5c3c99');
      p.hline(bx - 21, lArmY + 8, 7, '#e078ff', true);
      p.px(bx - 18, lArmY + 4, '#ffe478', true);

      // 右肩 + 右悬空星晶重拳（蓄力高举 → 轰然横扫全屏！）
      let rfX = bx + 16;
      let rfY = 28 + by + Math.round(pose.stride * 2);
      if (pose.armAction <= -0.5) {
        rfX = bx + 13;
        rfY = 20 + by;
      } else if (pose.armAction >= 0.6) {
        rfX = bx + 20;
        rfY = 24 + by;
      }
      p.poly([[bx + 20, 18 + by], [bx + 12, 16 + by], [bx + 11, 24 + by], [bx + 18, 25 + by]], '#4d3380');
      p.hline(bx + 12, 18 + by, 8, '#fff099');
      p.px(bx + 15, 21 + by, '#e078ff', true);
      p.line(bx + 15, 25 + by, rfX, rfY + 2, '#d966ff', 2, true);
      p.poly([
        [rfX - 4, rfY],
        [rfX + 5, rfY],
        [rfX + 6, rfY + 8],
        [rfX + 1, rfY + 11],
        [rfX - 4, rfY + 9],
      ], '#3c2569');
      p.rect(rfX - 2, rfY + 2, 6, 6, '#7b52c4');
      p.hline(rfX - 3, rfY + 8, 8, '#ff73e6', true);
      p.rect(rfX, rfY + 3, 2, 3, '#ffe878', true);

      // 周身全扫魔晶震波！
      if (pose.slashAlpha > 0.3) {
        p.line(bx - 21, 34 + by, bx + 22, 34 + by, '#d966ff', 2, true);
        p.line(bx + 16, 17 + by, bx + 23, 35 + by, '#ffe880', 2, true);
      }
    },
  },
};

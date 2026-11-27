/**
 * 内置大型巨像与魔导机关造物 48×54 骨骼解构多态动画绘谱（御柱石狮子、禁忌之书、非想天则）
 */

import type { SpriteRigSpec } from './types';

/** 基础大型巨像与魔导机关造物骨骼绘谱表 */
export const CONSTRUCT_RIG_SPECS: Record<
  'creature_golem' | 'creature_grimoire' | 'creature_hisoutensoku',
  SpriteRigSpec
> = {
  /** 6. 御柱石狮子（2×2 重甲）：沉重迈步巨足 + 独立双臂高举重砸 + 怒吼张口狮首 + 飘动纸垂注连绳 */
  creature_golem: {
    backdropTop: '#121524',
    backdropBottom: '#262326',
    backdropGlow: '#ffbf3b',
    avatarCrop: { x: 10, y: 7, size: 28 },
    portraitCrop: { x: 4, y: 5, w: 40, h: 44 },
    draw: (p, pose) => {
      const bx = Math.round(24 + pose.leanX * 0.9);
      const by = Math.round(pose.breathY * 1.2 - pose.stepLift * 0.8);
      const legStride = Math.round(pose.stride * 3.5);
      const sway = Math.round(pose.flutter);

      // [部件 1] 沉重玄石双腿（踏地步态）
      p.rect(bx - 11 - legStride, 39 + (pose.stride > 0.3 ? -2 : 0), 7, 9, '#524e48');
      p.rect(bx - 10 - legStride, 39 + (pose.stride > 0.3 ? -2 : 0), 4, 8, '#7a746a');
      p.rect(bx + 4 + legStride, 39 + (pose.stride < -0.3 ? -2 : 0), 7, 9, '#5e5a53');
      p.rect(bx + 5 + legStride, 39 + (pose.stride < -0.3 ? -2 : 0), 4, 8, '#8a8378');

      // [部件 2] 宽厚石雕胸躯 + 朱金注连绳与飘动纸垂
      p.ellipse(bx, 31 + by, 12.5, 9.6, '#6e6961');
      p.ellipse(bx - 1, 29 + by, 10.8, 8.0, '#968f82');
      p.poly([[bx - 11, 28 + by], [bx + 11, 28 + by], [bx + 8, 33 + by], [bx - 8, 33 + by]], '#bf2640', true);
      p.hline(bx - 9, 30 + by, 18, '#ffd45c', true);
      // 飘动白纸垂
      p.rect(bx - 7 + sway, 33 + by, 3, 5, '#fff7eb');
      p.rect(bx - 1 + sway, 33 + by, 3, 6, '#fff7eb');
      p.rect(bx + 5 + sway, 33 + by, 3, 5, '#fff7eb');

      // [部件 3] 威严石狮头颅 + 卷鬃 + 蓄力怒吼张口 + 熔金双瞳
      const headY = 17 + by;
      p.ellipse(bx, headY, 9.2, 7.6, '#7a746a');
      p.ellipse(bx, headY - 1, 7.6, 6.2, '#bfb6a3');
      p.ellipse(bx - 9, headY - 4, 3.2, 3.2, '#968f82');
      p.ellipse(bx + 9, headY - 4, 3.2, 3.2, '#968f82');
      p.ellipse(bx, headY - 7, 4.8, 2.6, '#d9d0bd');
      p.px(bx, headY - 5, '#ffd45c', true);

      if (!pose.blink && pose.expr !== 'hurt') {
        p.rect(bx - 5, headY - 1, 3, 2, '#ffbf2b', true);
        p.rect(bx + 2, headY - 1, 3, 2, '#ffbf2b', true);
        p.px(bx - 4, headY - 1, '#ffffff', true);
        p.px(bx + 3, headY - 1, '#ffffff', true);
      } else {
        p.hline(bx - 5, headY, 3, '#3b3733');
        p.hline(bx + 2, headY, 3, '#3b3733');
      }
      // 攻击时怒吼张大石口！
      const mouthH = pose.state === 'attack' ? 4 : 2;
      p.rect(bx - 4, headY + 3, 8, mouthH, '#2e2926');
      p.px(bx - 3, headY + 3, '#f7f2ea');
      p.px(bx + 2, headY + 3, '#f7f2ea');

      // [部件 4] 独立重石双巨臂（蓄力高举过顶 → 雷霆双拳砸地！）
      let armLift = Math.round(pose.breathY);
      let armReach = Math.round(pose.stride * 2);
      if (pose.armAction <= -0.6) {
        armLift = -11;
        armReach = -2;
      } else if (pose.armAction >= 0.7) {
        armLift = 6;
        armReach = 7;
      }
      // 后臂（左侧巨拳）
      p.ellipse(bx - 13, 25 + by + Math.round(armLift * 0.5), 4.6, 5.2, '#aba393');
      p.rect(bx - 17, 29 + by + armLift, 6, 8, '#857e73');
      p.rect(bx - 15, 22 + by + Math.round(armLift * 0.5), 3, 2, '#3c8058');
      // 前臂（右侧巨拳，攻击时猛然砸向前方！）
      p.ellipse(bx + 12 + Math.round(armReach * 0.4), 25 + by + Math.round(armLift * 0.6), 4.8, 5.4, '#b8b09e');
      p.rect(bx + 10 + armReach, 29 + by + armLift, 7, 9, '#968f82');
      p.px(bx + 13 + armReach, 32 + by + armLift, '#ffd45c', true);

      if (pose.slashAlpha > 0.3) {
        p.line(bx + 14, 38 + by, bx + 22, 44 + by, '#ffe066', 2, true);
        p.line(bx + 12, 43 + by, bx + 22, 46 + by, '#ff9a3d', 2, true);
      }
    },
  },

  /** 7. 禁忌之书（2×1 浮空魔导炮台 · 立体黑曜紫鎏金古魔典 + 翻飞发光符文散页 + 绯红丝绸书签 + 冠冕级深渊红金魔眼！） */
  creature_grimoire: {
    backdropTop: '#100a24',
    backdropBottom: '#291547',
    backdropGlow: '#cc70ff',
    avatarCrop: { x: 8, y: 6, size: 32 },
    portraitCrop: { x: 2, y: 4, w: 44, h: 46 },
    draw: (p, pose) => {
      const isAtk = pose.state === 'attack';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;

      const bx = isAtk && f === 1 ? 22 : Math.round(24 + pose.leanX * 0.65);
      const hover = Math.round(Math.sin(phase) * 1.8 + pose.breathY * 1.3 - pose.stepLift);
      const sway = Math.round(Math.cos(phase) * 1.6);

      // 双翼封皮舒展扇动：始终保持优雅上扬的展翼 V 弧，待机轻扇、蓄力微收、爆发大张！
      const flap = isHit
        ? 1
        : isAtk && f === 0
          ? 0
          : isAtk && f === 1
            ? -6
            : isAtk && f === 2
              ? -4
              : Math.round(Math.sin(phase) * 2.2 - 1.5);

      // [部件 1] 底部微光旋转「紫金禁忌魔阵足环」+ 垂悬双条绯红鎏金丝绸书签带
      const sealY = 47;
      for (let i = 0; i < 18; i++) {
        const a = phase * 0.5 + (i * Math.PI * 2) / 18;
        const sx = Math.round(bx + Math.cos(a) * 12);
        const sy = Math.round(sealY + Math.sin(a) * 1.8);
        p.px(sx, sy, i % 3 === 0 ? '#f5cf64' : '#9642e6', true);
      }
      // 垂落双丝绸书签（随悬浮气流优雅波浪摆动）
      const ribY = 39 + hover;
      p.line(bx - 2, ribY, bx - 4 + sway, ribY + 6, '#99183c', 2);
      p.line(bx - 2, ribY, bx - 4 + sway, ribY + 5, '#e63262', 1);
      p.px(bx - 4 + sway, ribY + 6, '#ffe073', true);
      p.line(bx + 2, ribY, bx + 5 - sway, ribY + 7, '#b51d47', 2);
      p.line(bx + 2, ribY, bx + 5 - sway, ribY + 6, '#ff4d79', 1);
      p.px(bx + 5 - sway, ribY + 7, '#ffe073', true);

      // [部件 2] 后景双层紫金法环（攻击爆发时骤然膨胀发亮！）
      const eyeY = 14 + hover - Math.round(flap * 0.25);
      const ringR = isAtk && f === 1 ? 11.5 : isAtk && f === 2 ? 12.5 : 8.5;
      for (let i = 0; i < 16; i++) {
        const a = phase * 0.7 + (i * Math.PI * 2) / 16;
        const rx = Math.round(bx + Math.cos(a) * ringR);
        const ry = Math.round(eyeY + Math.sin(a) * (ringR * 0.78));
        p.px(rx, ry, i % 4 === 0 ? '#ffe478' : '#a84dff', true);
      }

      // [部件 3] 立体厚重黑曜紫古魔典双翼封皮 + 古铜鎏金包角 + 书脊雕纹
      const spineTop = 27 + hover;
      const spineBot = 40 + hover;
      const wingOutL = bx - 18;
      const wingOutR = bx + 18;
      const wingTopY = 23 + hover + flap;
      const wingBotY = 36 + hover + flap;

      // 底层黑曜深紫厚封皮（带阴影厚度）
      p.poly([[wingOutL, wingTopY], [bx - 1, spineTop], [bx - 1, spineBot + 1], [wingOutL + 2, wingBotY + 2]], '#2c104f');
      p.poly([[wingOutR, wingTopY], [bx + 1, spineTop], [bx + 1, spineBot + 1], [wingOutR - 2, wingBotY + 2]], '#3d176b');
      // 封皮紫罗兰压花外沿
      p.line(wingOutL, wingTopY, wingOutL + 2, wingBotY + 1, '#6f2ec4', 1);
      p.line(wingOutR, wingTopY, wingOutR - 2, wingBotY + 1, '#893ee6', 1);
      // 四隅古铜鎏金包角装饰
      p.rect(wingOutL, wingTopY, 3, 3, '#d99e32');
      p.px(wingOutL + 1, wingTopY + 1, '#fff0a6', true);
      p.rect(wingOutL + 1, wingBotY - 1, 3, 3, '#b87f24');
      p.rect(wingOutR - 2, wingTopY, 3, 3, '#f2c14e');
      p.px(wingOutR - 1, wingTopY + 1, '#ffffff', true);
      p.rect(wingOutR - 3, wingBotY - 1, 3, 3, '#d99e32');

      // 立体厚书页切口层（清晰可见泛黄牛皮纸叠加厚度，彻底告别薄片！）
      p.poly([[wingOutL + 2, wingBotY], [bx - 1, spineBot], [bx - 1, spineBot - 2], [wingOutL + 2, wingBotY - 2]], '#b58d52');
      p.poly([[wingOutR - 2, wingBotY], [bx + 1, spineBot], [bx + 1, spineBot - 2], [wingOutR - 2, wingBotY - 2]], '#cca262');

      // 展开的双曲面泛黄羊皮纸页（带书脊折痕渐变）
      p.poly([[wingOutL + 2, wingTopY + 1], [bx - 1, spineTop + 1], [bx - 1, spineBot - 2], [wingOutL + 3, wingBotY - 2]], '#f2d99b');
      p.poly([[wingOutL + 4, wingTopY + 2], [bx - 2, spineTop + 2], [bx - 2, spineBot - 3], [wingOutL + 5, wingBotY - 3]], '#fff4cc');
      p.poly([[wingOutR - 2, wingTopY + 1], [bx + 1, spineTop + 1], [bx + 1, spineBot - 2], [wingOutR - 3, wingBotY - 2]], '#ffe39c');
      p.poly([[wingOutR - 4, wingTopY + 2], [bx + 2, spineTop + 2], [bx + 2, spineBot - 3], [wingOutR - 5, wingBotY - 3]], '#fff7d9');

      // 书页上的手绘绯红与紫光古代炼金魔纹 + 像素咒文行
      const midL = Math.round((wingTopY + spineTop) * 0.5) + 4;
      const midR = midL;
      const runeGlow = isAtk && f <= 2 ? '#ff66cc' : '#8e38e0';
      // 左页微型封印星纹 + 咒文
      p.px(bx - 10, midL - 1, runeGlow, true);
      p.px(bx - 11, midL, '#d93870', true);
      p.px(bx - 9, midL, '#d93870', true);
      p.px(bx - 10, midL + 1, runeGlow, true);
      p.hline(bx - 13, midL + 3, 6, '#7a3ec2', isAtk);
      p.hline(bx - 12, midL + 5, 5, '#b8428c', isAtk);
      // 右页发光古魔阵与符文
      p.ellipse(bx + 9, midR, 2.5, 2.0, runeGlow, true);
      p.px(bx + 9, midR, '#fff5cc', true);
      p.hline(bx + 6, midR + 3, 7, '#7a3ec2', isAtk);
      p.hline(bx + 7, midR + 5, 5, '#d93870', isAtk);

      // 华丽鎏金浮雕书脊（带红宝石书扣）
      p.rect(bx - 1, spineTop - 1, 3, 14, '#c48b28');
      p.vline(bx, spineTop, 12, '#ffe478');
      p.px(bx, spineTop + 3, '#e63058', true);
      p.px(bx, spineTop + 8, '#e63058', true);

      // [部件 4] 2 张半悬空正在翻卷飞舞的「发光羊皮符文散页」（立绘灵魂动态感！）
      const pageLift = Math.round(Math.sin(phase + 1.1) * 2.5);
      // 左上飘页
      p.poly([
        [bx - 15, 16 + hover + pageLift],
        [bx - 11, 14 + hover + pageLift],
        [bx - 10, 19 + hover + pageLift],
        [bx - 14, 21 + hover + pageLift],
      ], '#fff0bd', isAtk);
      p.hline(bx - 14, 17 + hover + pageLift, 3, '#a84dff', true);
      // 右上飘页（攻击时向前化作激射咒符！）
      const rPageX = isAtk && f === 1 ? bx + 15 : bx + 12;
      const rPageY = isAtk && f === 1 ? 19 + hover : 15 + hover - pageLift;
      p.poly([
        [rPageX, rPageY],
        [rPageX + 4, rPageY + 1],
        [rPageX + 3, rPageY + 6],
        [rPageX - 1, rPageY + 5],
      ], '#ffe69e', isAtk);
      p.hline(rPageX, rPageY + 3, 3, '#ff4da6', true);

      // [部件 5] 冠冕级「深渊紫金日冕魔眼」（彻底取代黄色荷包蛋 · 呼应魔眼石化！）
      const eyeW = isAtk && f === 1 ? 8.2 : isAtk && f === 2 ? 7.4 : 6.6;
      const eyeH = isHit ? 2.2 : isAtk && f === 1 ? 5.6 : 4.5;
      // 日冕紫金菱形外冠（上下锐利神圣尖刺 + 左右尖眼角）
      p.poly([
        [bx, eyeY - Math.round(eyeH) - 3],
        [bx + Math.round(eyeW) + 3, eyeY],
        [bx, eyeY + Math.round(eyeH) + 3],
        [bx - Math.round(eyeW) - 3, eyeY],
      ], '#4c1b85');
      p.poly([
        [bx, eyeY - Math.round(eyeH) - 2],
        [bx + Math.round(eyeW) + 2, eyeY],
        [bx, eyeY + Math.round(eyeH) + 2],
        [bx - Math.round(eyeW) - 2, eyeY],
      ], '#d99e32', true);
      p.px(bx, eyeY - Math.round(eyeH) - 3, '#fff5b8', true);
      p.px(bx, eyeY + Math.round(eyeH) + 3, '#ffe066', true);
      p.px(bx - Math.round(eyeW) - 3, eyeY, '#ffe066', true);
      p.px(bx + Math.round(eyeW) + 3, eyeY, '#ffe066', true);

      // 眼白与暗紫绯红魔眼虹膜
      p.ellipse(bx, eyeY, eyeW - 0.8, eyeH - 0.6, '#fff8e6', true);
      if (pose.blink || isHit) {
        // 优雅眨眼或受击闭合：紫金眼睑横线
        p.hline(bx - 5, eyeY, 11, '#5a1e99');
        p.hline(bx - 4, eyeY - 1, 9, '#f2c14e');
      } else {
        // 多层深渊渐变虹膜：外圈魔紫 → 中圈绯红 → 内圈琥珀金 + 锐利暗黑竖瞳 + 星点高光
        p.ellipse(bx, eyeY, 3.6 + (isAtk && f === 1 ? 0.8 : 0), 3.4 + (isAtk && f === 1 ? 0.6 : 0), '#7a1ec7', true);
        p.ellipse(bx, eyeY, 2.7, 2.7, '#e6246e', true);
        p.ellipse(bx, eyeY, 1.8, 2.0, '#ffbf38', true);
        // 威严裂瞳（竖直深渊黑瞳）
        p.vline(bx, eyeY - 2, 5, '#19082b');
        if (isAtk && f === 0) {
          p.px(bx, eyeY, '#ffffff', true); // 蓄力收瞳闪光
        } else {
          p.px(bx - 2, eyeY - 1, '#ffffff', true); // 晶莹高光星点
          p.px(bx + 1, eyeY + 1, '#ffe699', true);
        }
      }

      // [部件 6] 攻击爆发演出：魔眼解放「紫金八芒石化凝视射线与星芒」（绝不遮挡中心锐利竖瞳！）
      if (isAtk && f === 1) {
        // 向前激射的凝缩锥形魔眼光束（自带能量尖端，绝不平切截断！）
        p.poly([[bx + 8, eyeY - 2], [45, eyeY], [bx + 8, eyeY + 2]], '#b34dff', true);
        p.poly([[bx + 9, eyeY - 1], [44, eyeY], [bx + 9, eyeY + 1]], '#ff66b8', true);
        p.hline(bx + 10, eyeY, Math.max(1, 42 - (bx + 10)), '#ffffff', true);
        // 魔眼外圈四角向外放射的鎏金星芒（绕开中心眼瞳保持晶莹清晰！）
        p.line(bx - 9, eyeY - 7, bx - 6, eyeY - 4, '#ffe066', 1, true);
        p.line(bx + 9, eyeY - 7, bx + 6, eyeY - 4, '#ffe066', 1, true);
        p.line(bx - 9, eyeY + 7, bx - 6, eyeY + 4, '#ffe066', 1, true);
        p.line(bx + 9, eyeY + 7, bx + 6, eyeY + 4, '#ffe066', 1, true);
      } else if (isAtk && f === 2) {
        // 余波扩散星屑与紫金光波
        p.line(bx + 9, eyeY - 3, 44, eyeY - 5, '#c466ff', 1, true);
        p.line(bx + 9, eyeY + 3, 44, eyeY + 5, '#ff66b8', 1, true);
        p.px(43, eyeY, '#ffffff', true);
        p.px(41, eyeY - 2, '#ffe478', true);
        p.px(41, eyeY + 2, '#ffe478', true);
      }
    },
  },

  /** 9. 非想天则（3×2 高型超级机神）：勇者系高挑霸气比例 — 宽厚 V 型朱漆金边胸铠 + 修长重型外扩战胫与尖锐护膝 + 武士金月高冠头雕 + 双肩蒸汽烟囱与先攻火箭铁拳！ */
  creature_hisoutensoku: {
    backdropTop: '#0a1024',
    backdropBottom: '#26172b',
    backdropGlow: '#ffad33',
    avatarCrop: { x: 9, y: 2, size: 28 },
    portraitCrop: { x: 2, y: 1, w: 44, h: 52 },
    draw: (p, pose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 19 : Math.round(23 + pose.leanX * 0.65);
      const by = Math.round(pose.breathY * 0.85 - pose.stepLift * 0.55);
      const legStride = Math.round(pose.stride * 3.0);

      // [部件 1] 背部高耸黄铜双联蒸汽大烟囱 + 升腾层次白雾（留足顶部 1px 外描边，零切顶！）
      const steamLift = (pose.frame * 2) % 4;
      p.rect(bx - 12, 7 + by, 4, 12, '#363f5c');
      p.rect(bx - 11, 8 + by, 2, 9, '#68769e');
      p.hline(bx - 12, 7 + by, 4, '#ffe073');
      p.rect(bx + 8, 7 + by, 4, 12, '#363f5c');
      p.rect(bx + 9, 8 + by, 2, 9, '#7988b5');
      p.hline(bx + 8, 7 + by, 4, '#ffe073');
      p.ellipse(bx - 10, 5 + by - Math.min(2, steamLift), 2.3, 1.5, '#c7daed');
      p.ellipse(bx + 10, 5 + by - Math.min(2, (steamLift + 2) % 4), 2.1, 1.4, '#b0c6de');

      // [部件 2] 3/4 雄迈跨步超级系高挑重装战胫（左后蹬支撑 + 右前踏出，摆脱呆板对称直腿！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      // 后撑左重装长腿（微向后外斜展）
      p.poly([
        [bx - 8 - legStride, 33 + lLift],
        [bx - 2 - legStride, 33 + lLift],
        [bx - 4 - legStride, 48 + lLift],
        [bx - 12 - legStride, 48 + lLift],
      ], '#262d42');
      p.poly([
        [bx - 7 - legStride, 34 + lLift],
        [bx - 3 - legStride, 34 + lLift],
        [bx - 5 - legStride, 46 + lLift],
        [bx - 10 - legStride, 46 + lLift],
      ], '#55638a');
      p.poly([[bx - 9 - legStride, 37 + lLift], [bx - 3 - legStride, 37 + lLift], [bx - 5 - legStride, 42 + lLift], [bx - 8 - legStride, 42 + lLift]], '#deb047');
      p.poly([[bx - 13 - legStride, 46 + lLift], [bx - 3 - legStride, 46 + lLift], [bx - 3 - legStride, 51 + lLift], [bx - 14 - legStride, 51 + lLift]], '#9e2037');
      p.hline(bx - 12 - legStride, 47 + lLift, 8, '#eb5e76');

      // 前跨右重装长腿（亮面高光突出 3/4 立体感！）
      p.poly([
        [bx + 2 + legStride, 33 + rLift],
        [bx + 9 + legStride, 33 + rLift],
        [bx + 13 + legStride, 49 + rLift],
        [bx + 4 + legStride, 49 + rLift],
      ], '#343e5c');
      p.poly([
        [bx + 3 + legStride, 34 + rLift],
        [bx + 8 + legStride, 34 + rLift],
        [bx + 11 + legStride, 47 + rLift],
        [bx + 5 + legStride, 47 + rLift],
      ], '#7c8dba');
      p.vline(bx + 7 + legStride, 35 + rLift, 11, '#b0c0eb');
      p.poly([[bx + 3 + legStride, 37 + rLift], [bx + 10 + legStride, 37 + rLift], [bx + 9 + legStride, 42 + rLift], [bx + 5 + legStride, 42 + rLift]], '#ffd466');
      p.poly([[bx + 3 + legStride, 47 + rLift], [bx + 14 + legStride, 47 + rLift], [bx + 15 + legStride, 52 + rLift], [bx + 3 + legStride, 52 + rLift]], '#cc304c');
      p.hline(bx + 4 + legStride, 48 + rLift, 10, '#ff8096');

      // [部件 3] 精悍收腰重甲裙甲 + 3D 倒角立体 V 字朱漆胸铠 + 格栅护栏炽金核动力太阳炉！
      // 分体式前裙甲（超级机器人标志性轮廓，带下沿深影与金属铆钉高光！）
      p.poly([[bx - 10, 29 + by], [bx + 10, 29 + by], [bx + 11, 35 + by], [bx - 11, 35 + by]], '#2d354f');
      p.rect(bx - 9, 30 + by, 5, 5, '#a8223a');
      p.hline(bx - 9, 30 + by, 5, '#eb5c76');
      p.rect(bx + 4, 30 + by, 5, 5, '#cc304c');
      p.hline(bx + 4, 30 + by, 5, '#ff7d95');
      p.rect(bx - 3, 29 + by, 6, 7, '#d9a43b');
      p.rect(bx - 2, 30 + by, 4, 4, '#fff099');
      p.px(bx, 34 + by, '#8f5f19');
      // 宽厚立体 3D 倒角 V 字朱漆胸甲（深红底影 + 朱红主面 + 绯红顶坡高光 + 金属格栅边缘！）
      p.poly([[bx - 12, 15 + by], [bx + 12, 15 + by], [bx + 8, 30 + by], [bx - 8, 30 + by]], '#22293d');
      p.poly([[bx - 10, 16 + by], [bx + 10, 16 + by], [bx + 7, 29 + by], [bx - 7, 29 + by]], '#a82038');
      p.poly([[bx - 9, 17 + by], [bx + 9, 17 + by], [bx + 6, 26 + by], [bx - 6, 26 + by]], '#d93654');
      p.poly([[bx - 8, 17 + by], [bx + 8, 17 + by], [bx + 5, 20 + by], [bx - 5, 20 + by]], '#ff6e88');
      p.hline(bx - 10, 16 + by, 20, '#ffd966');
      p.hline(bx - 7, 28 + by, 14, '#701324');
      // 胸口脉动炽金核动力反应炉 + 铁栏与玄铁内框
      const corePulse = isAtk ? 1.2 : pose.flutter > 0.4 ? 0.5 : 0;
      p.ellipse(bx, 22 + by, 5.2, 4.4, '#36231c');
      p.ellipse(bx, 22 + by, 4.4 + corePulse, 3.8 + corePulse * 0.6, '#ff9c24', true);
      p.ellipse(bx, 22 + by, 2.8 + corePulse * 0.4, 2.4 + corePulse * 0.4, '#fff299', true);
      p.rect(bx - 1, 21 + by, 2, 2, '#ffffff', true);
      p.vline(bx - 2, 19 + by, 6, '#3b2418');
      p.vline(bx + 2, 19 + by, 6, '#3b2418');

      // [部件 4] 锐利超级系和风武士高冠头雕（立体面颊削角 + 霸气大弯月金立物 + 炽亮翠青双目！）
      const headY = 10 + by;
      p.poly([[bx - 6, headY - 3], [bx + 6, headY - 3], [bx + 5, headY + 4], [bx, headY + 6], [bx - 5, headY + 4]], '#2d3652');
      p.poly([[bx - 5, headY - 2], [bx + 5, headY - 2], [bx + 4, headY + 3], [bx, headY + 5], [bx - 4, headY + 3]], '#7889b8');
      p.hline(bx - 4, headY - 2, 8, '#b8c7ed');
      // 威武双角大金月立物（高耸立体金边！）
      p.poly([[bx - 9, headY - 4], [bx - 5, headY - 8], [bx, headY - 4], [bx + 5, headY - 8], [bx + 9, headY - 4], [bx, headY - 2]], '#e8b33c', true);
      p.line(bx - 8, headY - 5, bx - 5, headY - 8, '#fff7bd', 1, true);
      p.line(bx + 5, headY - 8, bx + 8, headY - 5, '#fff7bd', 1, true);
      p.px(bx, headY - 5, '#ffffff', true);
      // 锐利面罩与双发光翠青目镜 + 金属通风口下颚
      p.rect(bx - 4, headY, 8, 2, '#111626');
      p.rect(bx - 3, headY, 2, 2, '#66fff0', true);
      p.rect(bx + 1, headY, 2, 2, '#66fff0', true);
      p.px(bx - 2, headY, '#ffffff', true);
      p.px(bx + 2, headY, '#ffffff', true);
      p.hline(bx - 3, headY + 3, 6, '#d9e4ff');
      p.px(bx, headY + 4, '#cc304c');

      // [部件 5] 威风凛凛的高挑斜切大肩甲 + 重装液压双臂与火箭铁拳！
      // 左大肩甲 + 左重装铁拳
      p.poly([[bx - 18, 13 + by], [bx - 10, 15 + by], [bx - 10, 24 + by], [bx - 17, 23 + by]], '#a87222');
      p.poly([[bx - 17, 14 + by], [bx - 11, 16 + by], [bx - 11, 22 + by], [bx - 16, 21 + by]], '#f0bf54');
      p.hline(bx - 17, 14 + by, 6, '#fff4b0');
      const lFistY = 29 + by - Math.round(pose.stride * 2);
      p.rect(bx - 17, 23 + by, 6, 8, '#465070');
      p.rect(bx - 18, lFistY, 7, 7, '#b82a44');
      p.rect(bx - 17, lFistY + 1, 5, 4, '#f0be54');

      // 右大肩甲 + 先攻火箭重拳（蓄力后拉 → 轰燃火箭喷焰直拳重击！）
      p.poly([[bx + 10, 15 + by], [bx + 18, 13 + by], [bx + 17, 23 + by], [bx + 10, 24 + by]], '#b87d28');
      p.poly([[bx + 11, 16 + by], [bx + 17, 14 + by], [bx + 16, 21 + by], [bx + 11, 22 + by]], '#ffd46b');
      p.hline(bx + 11, 14 + by, 6, '#fff7bd');

      let fistX = bx + 15;
      let fistY = 29 + by + Math.round(pose.stride * 2);
      if (isAtk && f === 0) {
        fistX = bx + 11;
        fistY = 21 + by;
      } else if (isAtk && (f === 1 || f === 2)) {
        fistX = bx + 20;
        fistY = 22 + by;
      }
      p.line(bx + 13, 23 + by, fistX, fistY + 2, '#525f85', 5);
      p.rect(fistX - 3, fistY - 1, 7, 8, '#c9304c');
      p.rect(fistX - 2, fistY, 5, 5, '#ffd96b');
      p.hline(fistX - 2, fistY, 5, '#ffffff');

      // 火箭铁拳先攻轰击炽焰 + 翠金冲击波（严格保留在画幅内零裁切！）
      if (isAtk && (f === 1 || f === 2)) {
        // 肘后喷射烈焰
        p.poly([[bx + 11, 22 + by], [bx + 6, 20 + by], [bx + 8, 25 + by]], '#ff7833', true);
        // 拳锋先攻破甲金翠冲击弧
        p.line(Math.min(43, fistX + 3), fistY - 5, Math.min(46, fistX + 7), fistY + 2, '#ffe46b', 2, true);
        p.line(Math.min(43, fistX + 3), fistY + 9, Math.min(46, fistX + 7), fistY + 2, '#66fff0', 2, true);
      }
    },
  },
};

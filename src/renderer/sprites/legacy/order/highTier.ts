/**
 * 幻月庭园 · 秩序系高阶（T3-T4）与变身形态精雕 48×54 像素立绘与骨骼动画像素绘谱
 * 包含：幻月妖、战斗 II 型、净秽者、月影妖兔真身
 */

import {
  drawChibiFaceEyes,
  type PixelPainter,
  type RigPose,
  type SpriteRigSpec,
} from '../../../voxelSprites';
import {
  drawRefinedFace,
  drawRefinedHairCrown,
  drawSoftSideLocks,
} from './helpers';

export const ORDER_HIGH_TIER_RIG_SPECS: Record<string, SpriteRigSpec> = {
  // =========================================================================
  // 秩序 T3-A：幻月妖（纯陆地月宫天女 · 优雅柔和天女羽衣环绕 + 深星空分层星纱长裙 + 鎏金新月星杖）
  // =========================================================================
  creature_lunar_genie: {
    backdropTop: '#0a112e',
    backdropBottom: '#222659',
    backdropGlow: '#c7abff',
    avatarCrop: { x: 8, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(21 + pose.leanX * 0.75);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const stride = Math.round(pose.stride * 2.8);

      // [部件 1] 柔滑半透明「月宫天女羽衣仙带」（轻盈 1-2px 丝绸 S 弧飘带，留出空气负空间，告别厚色块！）
      p.line(bx - 6, 22 + by, bx - 12 + sway, 19 + by, '#c9b8ff', 2, true);
      p.line(bx - 12 + sway, 19 + by, bx - 15 + sway, 24 + by, '#e8e0ff', 1, true);
      p.line(bx - 15 + sway, 24 + by, bx - 13 + sway, 32 + by, '#9ebeff', 2, true);
      p.line(bx - 13 + sway, 32 + by, bx - 16 + sway, 39 + by, '#dce8ff', 1, true);
      p.px(bx - 12 + sway, 19 + by, '#ffffff', true);
      p.px(bx - 16 + sway, 39 + by, '#ffe899', true);

      // 飘逸星紫长卷发后层
      p.poly([
        [bx - 6, 18 + by],
        [bx + 6, 18 + by],
        [bx + 9 - sway, 36 + by],
        [bx - 9 + sway, 36 + by],
      ], '#2f3a80');
      p.poly([
        [bx - 5, 19 + by],
        [bx + 4, 19 + by],
        [bx + 6 - sway, 33 + by],
        [bx - 7 + sway, 33 + by],
      ], '#5e76d6');
      p.vline(bx - 4, 21 + by, 11, '#b5c8ff');

      // [部件 2] 稳稳踏地的精致银月履（纯陆地行走）
      p.rect(bx - 4 - stride, 44, 3, 4, '#dce6ff');
      p.rect(bx + 2 + stride, 44, 4, 4, '#ffffff');

      // [部件 3] 优雅 3/4 分层月夜星纱礼裙（深星空宝蓝衬底 + 渐变柔蓝裙褶 + 月白前开纱 + 金星边）
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 11 + sk, 45 + by], [bx - 10 + sk, 45 + by]], '#172866');
      p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 8 + sk, 44 + by], [bx - 7 + sk, 44 + by]], '#3962c7');
      p.vline(bx - 5, 35 + by, 8, '#26449c');
      p.poly([[bx - 1, 32 + by], [bx + 4, 32 + by], [bx + 7 + sk, 44 + by], [bx + 1 + sk, 44 + by]], '#c7deff');
      p.vline(bx + 2 + Math.round(sk * 0.5), 34 + by, 9, '#ffffff');
      p.hline(bx - 9 + sk, 44 + by, 19, '#ffe899');
      p.px(bx - 6, 39 + by, '#fff5bf', true);
      p.px(bx - 3, 36 + by, '#a8e8ff', true);
      p.px(bx + 7, 40 + by, '#e2d4ff', true);
      // 左侧优雅广袖 + 收腰仙衣
      p.poly([[bx - 5, 25 + by], [bx - 10, 30 + by], [bx - 9, 36 + by], [bx - 5, 34 + by]], '#557ee0');
      p.hline(bx - 9, 35 + by, 4, '#ffffff');
      p.rect(bx - 4, 25 + by, 8, 7, '#e6efff');
      p.line(bx - 4, 26 + by, bx, 31 + by, '#2b4eb5', 1);
      p.line(bx + 4, 26 + by, bx, 31 + by, '#2b4eb5', 1);
      p.hline(bx - 5, 32 + by, 10, '#ffe073');
      p.px(bx, 31 + by, '#9cf0ff', true);

      // [部件 4] 仙姿月华少女面庞 + 包颊双鬓 + 鎏金弦月冠
      const headY = 18 + by;
      drawRefinedFace(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#5234b8', '#c2a6ff', pose);
      drawRefinedHairCrown(p, bx, headY, '#3d4f9e', '#6f87e0', '#b3c7ff', '#eef5ff');
      drawSoftSideLocks(p, bx, headY, '#4f66bd', '#bdd0ff', 8, 7);
      p.poly([[bx - 4, headY - 8], [bx, headY - 6], [bx + 4, headY - 8], [bx, headY - 7]], '#ffe066', true);
      p.px(bx - 4, headY - 9, '#fff5b8', true);
      p.px(bx + 4, headY - 9, '#fff5b8', true);
      p.px(bx, headY - 9, '#ffffff', true);

      // [部件 5] 右手优雅端持「鎏金新月星轮法杖」
      const stX = bx + 13 + Math.round(pose.armAction * 3);
      const stY = 17 + by - Math.round(pose.armAction * 4);
      p.poly([[bx + 4, 26 + by], [stX - 2, stY + 9], [stX - 3, stY + 15], [bx + 3, 33 + by]], '#6f98f0');
      p.rect(stX - 2, stY + 9, 2, 2, '#ffe6d8');
      p.line(stX - 1, stY + 28, stX, stY - 1, '#a87d2e', 2);
      p.line(stX - 1, stY + 28, stX, stY - 1, '#ffe478', 1);
      p.ellipse(stX, stY - 5, 4.4, 4.4, '#ffe066', true);
      p.ellipse(stX + 2, stY - 6, 3.2, 3.2, '#131b42');
      p.ellipse(stX + 1, stY - 5, 1.8, 1.8, '#9ce8ff', true);
      p.px(stX + 1, stY - 5, '#ffffff', true);
      if (pose.slashAlpha > 0.3) {
        p.hline(stX - 6, stY - 5, 13, '#d9c2ff', true);
        p.vline(stX + 1, stY - 11, 13, '#a8e8ff', true);
        p.px(stX + 1, stY - 5, '#ffffff', true);
        p.px(stX - 4, stY - 9, '#ffe885', true);
        p.px(stX + 6, stY - 1, '#ffe885', true);
      }
    },
  },

  // =========================================================================
  // 秩序 T3-B：战斗 II 型（1×1 精悍河童重工六臂武士机甲！全面重做！
  // 彻底告别青绿色“蜘蛛火柴人”！改用高对比「钛白装甲 + 河童翠青 + 枪灰骨架 + 鎏金黄铜」：
  // 帅气武士高达风河童水碟头雕 + 扎实的厚实装甲躯干与武士胫甲 + 清晰弯肘机械关节挂载四条副臂 + 双主力太刀六刃阿修罗！）
  // =========================================================================
  creature_combat_mk2: {
    backdropTop: '#081822',
    backdropBottom: '#13303d',
    backdropGlow: '#66f2ff',
    avatarCrop: { x: 9, y: 5, size: 28 },
    portraitCrop: { x: 2, y: 3, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 19 : Math.round(22 + pose.leanX * 0.85);
      const by = Math.round(pose.breathY * 0.9 - pose.stepLift * 0.8);
      const stride = Math.round(pose.stride * 3.4);
      const thrust = isAtk && (f === 1 || f === 2) ? 3 : 0;

      // [部件 1] 背部河童重工「枪灰黄铜六臂挂载背包」+ 四条清晰弯肘副臂（绝不是直棍子辐射！）
      // 背包基座（隐约可见于肩背两侧，提供合理机械挂载支点）
      p.rect(bx - 8, 21 + by, 16, 8, '#263447');
      p.hline(bx - 8, 21 + by, 16, '#c99334');

      // 副臂 1（左上高举弯肘副臂：肩→肘向上折→手握反手短光刃向上斜展，形成阿修罗背翼剪影！）
      p.line(bx - 7, 22 + by, bx - 12, 18 + by, '#374b63', 2);
      p.rect(bx - 13, 16 + by, 3, 3, '#d9a13b'); // 清晰机械肘关节
      p.line(bx - 12, 16 + by, bx - 10, 12 + by, '#2ea393', 2);
      p.rect(bx - 11, 11 + by, 3, 2, '#ffe073'); // 剑柄护手
      p.line(bx - 11, 11 + by, bx - 18, 6 + by, '#4ce6ff', 2, true);
      p.line(bx - 11, 11 + by, bx - 18, 6 + by, '#ffffff', 1, true);

      // 副臂 2（左下腰侧弯肘副臂：背→外肘→下斜反手短刃）
      p.line(bx - 7, 28 + by, bx - 13, 30 + by, '#374b63', 2);
      p.rect(bx - 14, 29 + by, 3, 3, '#c99334');
      p.line(bx - 13, 31 + by, bx - 11, 35 + by, '#278a7d', 2);
      p.rect(bx - 12, 34 + by, 3, 2, '#ffe073');
      p.line(bx - 12, 35 + by, bx - 19, 39 + by, '#4ce6ff', 2, true);
      p.line(bx - 12, 35 + by, bx - 19, 39 + by, '#ffffff', 1, true);

      // 副臂 3（右上越肩弯肘副臂：肩→上肘→前指炽金胁差光刃！）
      p.line(bx + 7, 22 + by, bx + 12 + thrust, 17 + by, '#465e7a', 2);
      p.rect(bx + 11 + thrust, 15 + by, 3, 3, '#f0bb4f');
      p.line(bx + 12 + thrust, 15 + by, bx + 11 + thrust, 11 + by, '#45c7b2', 2);
      p.rect(bx + 10 + thrust, 10 + by, 3, 2, '#ffe885');
      p.line(bx + 12 + thrust, 10 + by, Math.min(45, bx + 19 + thrust), 5 + by, '#ffe066', 2, true);
      p.line(bx + 12 + thrust, 10 + by, Math.min(45, bx + 19 + thrust), 5 + by, '#ffffff', 1, true);

      // 副臂 4（右中腰侧弯肘副臂：背→外肘→前探苍青光刃！）
      p.line(bx + 7, 28 + by, bx + 13 + thrust, 29 + by, '#465e7a', 2);
      p.rect(bx + 12 + thrust, 28 + by, 3, 3, '#f0bb4f');
      p.line(bx + 14 + thrust, 30 + by, bx + 15 + thrust, 33 + by, '#45c7b2', 2);
      p.rect(bx + 14 + thrust, 32 + by, 3, 2, '#ffe885');
      p.line(bx + 16 + thrust, 33 + by, Math.min(45, bx + 22 + thrust), 37 + by, '#66f2ff', 2, true);
      p.line(bx + 16 + thrust, 33 + by, Math.min(45, bx + 22 + thrust), 37 + by, '#ffffff', 1, true);

      // [部件 2] 扎实稳健的武士机甲下肢（钛白护腿 + 翠青胫甲 + 黄铜护膝 + 厚重战靴，彻底告别细长虫腿！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      // 左后支撑装甲腿
      p.poly([[bx - 6 - stride, 34 + by], [bx - 1 - stride, 34 + by], [bx - 3 - stride, 46 + lLift], [bx - 8 - stride, 46 + lLift]], '#28384d');
      p.poly([[bx - 6 - stride, 35 + by], [bx - 2 - stride, 35 + by], [bx - 3 - stride, 40 + lLift], [bx - 6 - stride, 40 + lLift]], '#b8cdd9');
      p.rect(bx - 7 - stride, 39 + lLift, 4, 3, '#d9a13b');
      p.poly([[bx - 7 - stride, 41 + lLift], [bx - 3 - stride, 41 + lLift], [bx - 3 - stride, 46 + lLift], [bx - 8 - stride, 46 + lLift]], '#237a70');
      p.poly([[bx - 10 - stride, 45 + lLift], [bx - 3 - stride, 45 + lLift], [bx - 2 - stride, 48 + lLift], [bx - 10 - stride, 48 + lLift]], '#374c66');
      p.hline(bx - 9 - stride, 46 + lLift, 6, '#66e0c8');

      // 右前跨步装甲腿（高光亮面突出 3/4 立体感！）
      p.poly([[bx + 1 + stride, 34 + by], [bx + 6 + stride, 34 + by], [bx + 8 + stride, 46 + rLift], [bx + 2 + stride, 46 + rLift]], '#324661');
      p.poly([[bx + 2 + stride, 35 + by], [bx + 6 + stride, 35 + by], [bx + 6 + stride, 40 + rLift], [bx + 2 + stride, 40 + rLift]], '#e3f0f5');
      p.rect(bx + 2 + stride, 39 + rLift, 5, 3, '#ffe073');
      p.poly([[bx + 2 + stride, 41 + rLift], [bx + 7 + stride, 41 + rLift], [bx + 8 + stride, 46 + rLift], [bx + 3 + stride, 46 + rLift]], '#34ad9d');
      p.vline(bx + 5 + stride, 41 + rLift, 5, '#85f2dc');
      p.poly([[bx + 3 + stride, 45 + rLift], [bx + 10 + stride, 46 + rLift], [bx + 10 + stride, 48 + rLift], [bx + 2 + stride, 48 + rLift]], '#445e7d');
      p.hline(bx + 4 + stride, 46 + rLift, 5, '#ffe073');

      // [部件 3] 精悍武士机甲胸铠（钛白胸甲片 + 河童翠青核框 + 炽亮水力炉心 + 武士分片裙甲！）
      // 分体式武士护腰裙甲
      p.poly([[bx - 7, 31 + by], [bx + 7, 31 + by], [bx + 8, 36 + by], [bx - 8, 36 + by]], '#243347');
      p.rect(bx - 7, 32 + by, 4, 4, '#2ea393');
      p.rect(bx + 3, 32 + by, 4, 4, '#45c7b2');
      p.hline(bx - 7, 35 + by, 4, '#ffe073');
      p.hline(bx + 3, 35 + by, 4, '#ffe073');
      p.rect(bx - 2, 31 + by, 4, 5, '#e0ac42');
      p.rect(bx - 1, 32 + by, 2, 3, '#fff4b0');

      // 倒梯形高对比钛白×翠青重甲胸躯
      p.poly([[bx - 7, 21 + by], [bx + 7, 21 + by], [bx + 5, 31 + by], [bx - 5, 31 + by]], '#1d4f4c');
      p.poly([[bx - 6, 22 + by], [bx + 6, 22 + by], [bx + 4, 29 + by], [bx - 4, 29 + by]], '#d9eaf0');
      p.poly([[bx - 5, 22 + by], [bx + 5, 22 + by], [bx + 3, 25 + by], [bx - 3, 25 + by]], '#ffffff');
      p.poly([[bx - 4, 24 + by], [bx + 4, 24 + by], [bx + 3, 30 + by], [bx - 3, 30 + by]], '#2b8a7e');
      p.hline(bx - 6, 22 + by, 12, '#ffe073');
      // 胸口河童涡轮水力核心
      p.ellipse(bx + 1, 27 + by, 2.3, 2.3, '#4ceeff', true);
      p.px(bx + 1, 27 + by, '#ffffff', true);

      // [部件 4] 帅气比例「河童武士高达头雕」（钛白盔壳 + 河童荧光水碟冠 + 黄金 V 字天线 + 猩红斜刃双目！）
      const headY = 16 + by;
      p.poly([[bx - 5, headY - 3], [bx + 5, headY - 3], [bx + 6, headY + 2], [bx + 2, headY + 5], [bx - 4, headY + 4]], '#26384d');
      p.poly([[bx - 4, headY - 2], [bx + 5, headY - 2], [bx + 5, headY + 1], [bx + 2, headY + 4], [bx - 3, headY + 3]], '#dcebf0');
      p.hline(bx - 4, headY - 2, 9, '#ffffff');
      // 河童特色绿碧水碟反应盖 + 黄金武士前立 V 翼
      p.hline(bx - 4, headY - 3, 8, '#d9a13b');
      p.ellipse(bx, headY - 4, 3.6, 1.4, '#5ef5c0', true);
      p.hline(bx - 2, headY - 5, 4, '#ffffff', true);
      p.line(bx + 1, headY - 3, bx - 5, headY - 8, '#ffe066', 1, true);
      p.line(bx + 1, headY - 3, bx + 6, headY - 7, '#ffe066', 1, true);
      p.px(bx + 1, headY - 3, '#ff4d6d', true);
      // 凌厉 3/4 墨黑目镜槽 + 炽红双目光学传感
      p.rect(bx - 1, headY, 6, 2, '#101824');
      p.hline(bx, headY, 2, '#ff4d6d', true);
      p.hline(bx + 3, headY, 2, '#ff4d6d', true);
      p.px(bx + 4, headY, '#ffffff', true);
      p.hline(bx, headY + 3, 4, '#2ea393'); // 翠青下颌护面

      // [部件 5] 主双臂（5号/6号主力厚甲武士臂 · 翠金大肩甲 + 居合拔刀双主力长光刀！）
      // 左主臂（厚实翠金肩甲 + 护于左前侧持斜举长光刀，与下副臂留出清晰负空间）
      p.poly([[bx - 10, 21 + by], [bx - 5, 20 + by], [bx - 5, 25 + by], [bx - 9, 25 + by]], '#288a7d');
      p.hline(bx - 10, 21 + by, 5, '#ffe073');
      p.line(bx - 8, 25 + by, bx - 9, 28 + by, '#374b63', 3);
      p.line(bx - 9, 28 + by, bx - 6, 30 + by, '#dcebf0', 3);
      p.rect(bx - 7, 29 + by, 3, 3, '#ffe073');
      // 左主光刃斜指向左前上方（清晰分离于下副臂光刃！）
      p.line(bx - 7, 29 + by, bx - 17, 23 + by, '#5ceeff', 2, true);
      p.line(bx - 7, 29 + by, bx - 17, 23 + by, '#ffffff', 1, true);

      // 右主臂（亮翠金肩甲 + 拔刀突进持最长炽金苍刃大太刀！）
      const rHandX = bx + 11 + thrust;
      const rHandY = 27 + by - (isAtk && (f === 1 || f === 2) ? 2 : 0);
      p.poly([[bx + 5, 20 + by], [bx + 10, 21 + by], [bx + 9, 25 + by], [bx + 5, 25 + by]], '#3eb8a6');
      p.hline(bx + 5, 21 + by, 5, '#fff09e');
      p.line(bx + 7, 24 + by, rHandX, rHandY, '#e3f0f5', 3);
      p.rect(rHandX - 1, rHandY - 1, 3, 3, '#ffe073');
      // 主力修长弧形光太刀斜举向前上方（干净利落的刀身曲线！）
      p.line(rHandX + 1, rHandY - 1, Math.min(45, rHandX + 11), rHandY - 10, '#66f2ff', 2, true);
      p.line(rHandX + 1, rHandY - 1, Math.min(45, rHandX + 11), rHandY - 10, '#ffffff', 1, true);

      // 攻击帧：阿修罗六刃利落弧光斩击！（外缘清晰不杂乱，严控画幅内零裁切）
      if (isAtk && (f === 1 || f === 2)) {
        const arcCx = bx + 11;
        const arcCy = 24 + by;
        for (let i = 0; i < 9; i++) {
          const a0 = -1.15 + (i / 9) * 2.25;
          const a1 = -1.15 + ((i + 1) / 9) * 2.25;
          p.line(
            Math.min(46, Math.round(arcCx + Math.cos(a0) * 14)),
            Math.round(arcCy + Math.sin(a0) * 15),
            Math.min(46, Math.round(arcCx + Math.cos(a1) * 14)),
            Math.round(arcCy + Math.sin(a1) * 15),
            i % 2 === 0 ? '#66f2ff' : '#ffe066',
            2,
            true,
          );
        }
      }
    },
  },

  // =========================================================================
  // 秩序 T4-A：净秽者（v5 终极神圣重铸！彻底告别笨重方块眼罩！
  // 看齐神使的绝美东方月都天神将：
  // 俊美威严的苍瞳白发月神面容 + 鎏金月桂羽翼星冠 + 背后璀璨镂空日晷神轮 +
  // 深夜星空披风与分叉战袍露银胫甲 + 左掌悬浮净世雷球 + 右手斜擎苍雷月神三叉戟！）
  // =========================================================================
  creature_purity_titan: {
    backdropTop: '#060e24',
    backdropBottom: '#152954',
    backdropGlow: '#7ae0ff',
    avatarCrop: { x: 8, y: 2, size: 28 },
    portraitCrop: { x: 2, y: 1, w: 44, h: 51 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 18 : Math.round(21 + pose.leanX * 0.75);
      const by = Math.round(pose.breathY * 0.9 - pose.stepLift * 0.65);
      const sway = Math.round(pose.flutter * 1.4);
      const stride = Math.round(pose.stride * 2.8);

      // [部件 1] 背后高悬的「月都鎏金日晷星神轮」（连贯精致光环 + 四向星芒，立显 4 阶天神威仪！）
      const haloCy = 15 + by;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const hx = Math.round(bx - 1 + Math.cos(a) * 11.5);
        const hy = Math.round(haloCy + Math.sin(a) * 10.5);
        if (hy >= 2 && hx >= 2 && hx <= 45) {
          p.px(hx, hy, i % 4 === 0 ? '#ffffff' : i % 2 === 0 ? '#ffe066' : '#5ce8ff', true);
        }
      }
      // 四极星芒光针
      p.px(bx - 1, Math.max(2, haloCy - 12), '#ffe885', true);
      p.px(bx - 13, haloCy, '#ffe885', true);
      p.px(bx + 11, haloCy, '#ffe885', true);

      // [部件 2] 宽广飘扬的深夜星空大披风 + 潇洒长曳银白神发
      p.poly([
        [bx - 6, 20 + by],
        [bx - 17 + sway, 37 + by],
        [bx - 13 + sway, 48 + by],
        [bx + 5 + sway, 46 + by],
        [bx + 5, 20 + by],
      ], '#0e1d4a');
      p.poly([
        [bx - 5, 21 + by],
        [bx - 14 + sway, 36 + by],
        [bx - 11 + sway, 46 + by],
        [bx + 3 + sway, 44 + by],
        [bx + 3, 21 + by],
      ], '#1e3e8f');
      p.hline(bx - 12 + sway, 46 + by, 15, '#f2cc66');
      // 披风内点点星辰
      p.px(bx - 11 + sway, 38 + by, '#ffe899', true);
      p.px(bx - 9 + sway, 42 + by, '#80f0ff', true);
      // 背后流泻的铂银神发
      p.poly([
        [bx - 6, 13 + by],
        [bx - 12 + sway, 22 + by],
        [bx - 9 + sway, 32 + by],
        [bx + 6 - sway, 30 + by],
        [bx + 5, 14 + by],
      ], '#7a92cc');
      p.poly([
        [bx - 5, 14 + by],
        [bx - 10 + sway, 22 + by],
        [bx - 8 + sway, 29 + by],
        [bx - 4, 21 + by],
      ], '#d6e6ff');

      // [部件 3] 3/4 雄迈跨步银金神将长胫（外露修长铠腿 + 分叉战袍，彻底告别呆板蓝纸箱裙！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      // 后撑左神铠长腿
      p.poly([[bx - 6 - stride, 36 + by], [bx - 2 - stride, 36 + by], [bx - 4 - stride, 48 + lLift], [bx - 8 - stride, 48 + lLift]], '#3a5594');
      p.rect(bx - 7 - stride, 41 + lLift, 3, 2, '#f2c85b');
      p.rect(bx - 9 - stride, 47 + lLift, 5, 3, '#b8d2ff');
      // 前踏右神铠长腿（亮白银高光 + 金护膝！）
      p.poly([[bx + 2 + stride, 36 + by], [bx + 6 + stride, 36 + by], [bx + 8 + stride, 48 + rLift], [bx + 3 + stride, 48 + rLift]], '#8aaae6');
      p.vline(bx + 5 + stride, 37 + by, 10, '#eef5ff');
      p.rect(bx + 3 + stride, 41 + rLift, 4, 2, '#ffe885');
      p.rect(bx + 3 + stride, 47 + rLift, 6, 3, '#ffffff');
      p.hline(bx + 4 + stride, 47 + rLift, 4, '#ffe073');

      // 分叉式皇家深蓝金边神将战摆（前中自然劈叉露出霸气银腿 + 飘逸中央星蓝圣带！）
      const sk = Math.round(sway * 0.45);
      p.poly([[bx - 6, 31 + by], [bx - 2, 31 + by], [bx - 6 + sk, 45 + by], [bx - 10 + sk, 44 + by]], '#1b3a87');
      p.line(bx - 10 + sk, 44 + by, bx - 6 + sk, 45 + by, '#ffe073', 1);
      p.poly([[bx + 2, 31 + by], [bx + 6, 31 + by], [bx + 10 + sk, 44 + by], [bx + 6 + sk, 45 + by]], '#2d5ec7');
      p.line(bx + 6 + sk, 45 + by, bx + 10 + sk, 44 + by, '#ffe073', 1);
      // 精致纤细前垂月白金绣圣带
      p.poly([[bx - 1, 32 + by], [bx + 2, 32 + by], [bx + 2 + sk, 41 + by], [bx - 1 + sk, 41 + by]], '#eef5ff');
      p.vline(bx + 1, 33 + by, 7, '#5ceeff', true);
      p.px(bx + 1, 36 + by, '#ffe885', true);

      // [部件 4] 修长倒三角雕塑感「月白×皇家蓝×鎏金」天神胸铠 + 展翼流线肩铠！
      p.poly([[bx - 6, 21 + by], [bx + 6, 21 + by], [bx + 4, 32 + by], [bx - 4, 32 + by]], '#1b3982');
      p.poly([[bx - 5, 21 + by], [bx + 5, 21 + by], [bx + 3, 28 + by], [bx - 3, 28 + by]], '#b3cdfa');
      p.poly([[bx - 4, 21 + by], [bx + 4, 21 + by], [bx + 2, 26 + by], [bx - 2, 26 + by]], '#ffffff');
      p.hline(bx - 5, 21 + by, 10, '#ffe073');
      p.hline(bx - 4, 31 + by, 8, '#f5cc58');
      // 胸口精致苍雷菱晶核心
      p.poly([[bx, 23 + by], [bx + 2, 25 + by], [bx, 27 + by], [bx - 2, 25 + by]], '#4ce8ff', true);
      p.px(bx, 25 + by, '#ffffff', true);
      // 优雅流线天翼肩甲（上羽白金、下甲湛蓝，绝不方笨！）
      p.poly([[bx - 11, 20 + by], [bx - 5, 20 + by], [bx - 5, 25 + by], [bx - 9, 25 + by]], '#2e57b5');
      p.poly([[bx - 12, 19 + by], [bx - 6, 20 + by], [bx - 7, 23 + by], [bx - 11, 22 + by]], '#dceaff');
      p.hline(bx - 11, 19 + by, 6, '#ffe073');
      p.poly([[bx + 5, 20 + by], [bx + 11, 20 + by], [bx + 9, 25 + by], [bx + 5, 25 + by]], '#4576de');
      p.poly([[bx + 6, 20 + by], [bx + 12, 19 + by], [bx + 11, 22 + by], [bx + 7, 23 + by]], '#ffffff');
      p.hline(bx + 6, 19 + by, 6, '#ffe885');

      // [部件 5] 威严神秘的「月都苍雷神将假面头雕」（流线雕金洁白神面具 + 尖锥鼻梁 + 深邃眼隙发光苍瞳 + 铂银神发与鎏金双翼新月冕！）
      const headY = 14 + by;
      drawRefinedFace(p, bx, headY);
      // 柔美高贵的铂银长发冠与包颊神发
      drawRefinedHairCrown(p, bx, headY, '#6d85bd', '#abc2f0', '#e6f0ff', '#ffffff');
      drawSoftSideLocks(p, bx, headY, '#7d95cc', '#eef5ff', 7, 6);
      // 精致对称 V 形流线月神白银金纹假面（覆盖眉眼与鼻梁，下沿优雅收尖露出冷峻下颌，绝非呆板方砖！）
      p.poly([
        [bx - 5, headY - 3],
        [bx + 5, headY - 3],
        [bx + 5, headY + 1],
        [bx + 1, headY + 3],
        [bx - 4, headY + 1],
      ], '#182f6e');
      // 假面鎏金上沿羽纹与洁白鼻梁雕饰
      p.hline(bx - 5, headY - 3, 11, '#ffe066', true);
      p.poly([
        [bx - 4, headY - 2],
        [bx + 4, headY - 2],
        [bx + 1, headY + 3],
        [bx - 1, headY + 3],
      ], '#eef6ff');
      p.px(bx + 1, headY + 2, '#ffe066', true);
      // 假面左右狭长威严眼孔 + 炽亮冰蓝星瞳（穿透假面的神圣凝视！）
      p.hline(bx - 3, headY, 3, '#0b183d');
      p.hline(bx + 2, headY, 3, '#0b183d');
      p.hline(bx - 2, headY, 2, '#66f2ff', true);
      p.hline(bx + 2, headY, 2, '#66f2ff', true);
      p.px(bx - 1, headY, '#ffffff', true);
      p.px(bx + 3, headY, '#ffffff', true);
      // 假面颊翼金边收勾
      p.px(bx - 4, headY + 1, '#f2c85b');
      p.px(bx + 4, headY + 1, '#f2c85b');
      // 精致鎏金月神翼冠（轻灵羽翼曲线，非粗笨直棍！）
      p.hline(bx - 5, headY - 5, 10, '#ffe066', true);
      p.poly([[bx - 5, headY - 5], [bx - 9, headY - 9], [bx - 7, headY - 5]], '#fff4b8', true);
      p.poly([[bx + 5, headY - 5], [bx + 9, headY - 9], [bx + 7, headY - 5]], '#fff4b8', true);
      p.poly([[bx - 2, headY - 6], [bx, headY - 10], [bx + 2, headY - 6]], '#66f2ff', true);
      p.px(bx, headY - 8, '#ffffff', true);

      // [部件 6] 左手优雅伸展悬托「净秽苍雷星核」+ 右手斜擎「苍雷月神三叉天戟」！
      // 左臂清晰外展于左方负空间，掌心上方悬浮璀璨电弧雷球（彻底消除粘连肿瘤感！）
      const lHandX = bx - 14;
      const lHandY = 29 + by;
      p.line(bx - 7, 24 + by, lHandX + 1, lHandY, '#99b8f0', 2);
      p.rect(lHandX - 1, lHandY - 1, 2, 2, '#ffe6d8');
      const orbY = lHandY - 5 + Math.round(Math.sin(pose.phase * Math.PI * 2) * 1.2);
      p.ellipse(lHandX - 1, orbY, 2.7, 2.7, '#4ce8ff', true);
      p.px(lHandX - 1, orbY, '#ffffff', true);
      p.px(lHandX - 4, orbY - 1, '#ffe885', true);
      p.px(lHandX + 2, orbY - 2, '#99f5ff', true);

      // 右手优雅斜擎苍雷月神三叉戟（利落斜角 + 璀璨月叉闪电刃！）
      const spearX = bx + 13 + (isAtk && (f === 1 || f === 2) ? 2 : 0);
      p.line(bx + 7, 24 + by, spearX - 1, 26 + by, '#cfe0ff', 2);
      p.rect(spearX - 2, 25 + by, 2, 2, '#ffe6d8');
      // 优雅斜倾黄金神戟杆
      p.line(spearX - 4, 49 + by, spearX + 3, 10 + by, '#a87928', 2);
      p.line(spearX - 4, 49 + by, spearX + 3, 10 + by, '#ffe478', 1);
      // 精致鎏金新月护叉 + 苍白雷霆主刃
      p.line(spearX, 13 + by, spearX + 6, 12 + by, '#ffe066', 2, true);
      p.line(spearX, 13 + by, spearX - 2, 8 + by, '#ffe885', 1, true);
      p.line(spearX + 6, 12 + by, spearX + 8, 7 + by, '#ffe885', 1, true);
      p.poly([
        [spearX + 4, 2 + by],
        [spearX + 7, 8 + by],
        [spearX + 3, 13 + by],
        [spearX + 1, 8 + by],
      ], '#5ceeff', true);
      p.line(spearX + 4, 3 + by, spearX + 3, 12 + by, '#ffffff', 1, true);

      if (isAtk && (f === 1 || f === 2)) {
        // 净秽苍雷激射：炽白×苍蓝×星金天罚雷霆折线（严格留边零裁切！）
        p.line(spearX + 4, 6 + by, Math.min(46, spearX + 11), 11 + by, '#ffffff', 2, true);
        p.line(Math.min(46, spearX + 11), 11 + by, spearX + 6, 16 + by, '#5ceeff', 2, true);
        p.line(spearX + 6, 16 + by, Math.min(46, spearX + 12), 23 + by, '#ffffff', 2, true);
        p.line(spearX + 6, 16 + by, Math.min(45, spearX + 11), 28 + by, '#ffe478', 1, true);
      }
    },
  },

  // =========================================================================
  // 秩序 T1-A「兔化」专属变身形态：月影妖兔真身（四足飞跃雪白灵兔 + 樱红金铃蝴蝶结 + 疾影月华流光！）
  // =========================================================================
  creature_rabbit_transformed: {
    backdropTop: '#0d1536',
    backdropBottom: '#232e63',
    backdropGlow: '#ff96c8',
    avatarCrop: { x: 14, y: 10, size: 26 },
    portraitCrop: { x: 2, y: 8, w: 44, h: 42 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const f = pose.frame;
      const leapY = isAtk && (f === 1 || f === 2) ? -6 : isMove ? -Math.round(Math.abs(pose.stride) * 4) : 0;
      const bx = isAtk && (f === 1 || f === 2) ? 23 : Math.round(22 + pose.leanX * 1.1);
      const by = Math.round(pose.breathY * 1.1 - pose.stepLift) + leapY;
      const sway = Math.round(pose.flutter * 1.5);
      const stride = Math.round(pose.stride * 4.5);

      // [部件 1] 背后灵动飘逸的「月华疾影残像风纹」与悬浮月星（直观传达 +50% 移速/先手/擦弹！）
      p.line(bx - 18, 25 + by, bx - 10, 25 + by, '#7ae8ff', 1, true);
      p.line(bx - 19, 31 + by, bx - 12, 31 + by, '#ffa6d0', 1, true);
      p.line(bx - 17, 37 + by, bx - 11, 37 + by, '#b8f2ff', 1, true);
      p.px(bx - 14, 17 + by + sway, '#ffe885', true);
      p.px(bx + 15, 14 + by - sway, '#8ceeff', true);

      // [部件 2] 背后蓬松硕大雪白绒球兔尾 + 迎风舒展的樱红丝带双尾
      const tailX = bx - 12;
      const tailY = 34 + by + Math.round(pose.flutter * 0.8);
      p.ellipse(tailX, tailY, 4.4, 4.0, '#c9daf7');
      p.ellipse(tailX, tailY - 1, 3.3, 3.0, '#ffffff');
      p.px(tailX - 1, tailY - 2, '#fff6fa', true);
      // 颈间樱红蝴蝶结向后扬起的双条飘带（呼应人形态兔娘的樱红丝带！）
      p.line(bx + 2, 27 + by, bx - 7 + sway, 22 + by, '#e63968', 2);
      p.line(bx + 2, 28 + by, bx - 8 + sway, 26 + by, '#ff7aa6', 1);

      // [部件 3] 充满弹跳爆发力的后腿与纤巧灵动雪白前爪（四足灵兔跃动姿！）
      const hindExtend = isAtk && (f === 1 || f === 2) ? 3 : stride;
      const frontExtend = isAtk && (f === 1 || f === 2) ? 4 : stride;
      // 远侧后腿（阴影面）
      p.ellipse(bx - 7 - Math.round(hindExtend * 0.6), 41 + by, 4.0, 2.8, '#9eb5de');
      p.rect(bx - 11 - hindExtend, 44 + by, 6, 3, '#b8ccf0');
      // 远侧前爪
      p.line(bx + 6, 35 + by, bx + 11 + frontExtend, 42 + by, '#c7daf7', 3);
      p.ellipse(bx + 12 + frontExtend, 43 + by, 2.5, 1.8, '#dceaff');

      // [部件 4] 优雅流线型月白灵兔身躯（雪白背脊 + 柔冰蓝腹影 + 蓬松胸毛！）
      p.ellipse(bx - 2, 34 + by, 9.6, 6.2, '#b8cdf2');
      p.ellipse(bx - 1, 33 + by, 8.6, 5.4, '#edf4ff');
      p.ellipse(bx, 31 + by, 6.8, 3.4, '#ffffff');
      // 胸前毛茸茸的雪白绒颈毛
      p.ellipse(bx + 6, 32 + by, 4.6, 4.4, '#ffffff');
      p.ellipse(bx + 6, 34 + by, 3.8, 2.6, '#dce9ff');

      // 近侧充满爆发力的强健兔后腿（蓄力微屈、线条圆润饱满！）
      p.ellipse(bx - 6, 37 + by, 5.2, 4.4, '#d9e7ff');
      p.ellipse(bx - 6, 36 + by, 4.0, 3.2, '#ffffff');
      p.poly([
        [bx - 8, 41 + by],
        [bx - 4, 41 + by],
        [bx - 3 - Math.round(hindExtend * 0.5), 46 + by],
        [bx - 10 - hindExtend, 46 + by],
      ], '#eef5ff');
      p.hline(bx - 10 - hindExtend, 45 + by, 7, '#ffffff');
      p.px(bx - 9 - hindExtend, 46 + by, '#ff9ec2'); // 粉嫩小肉垫点缀

      // 近侧灵巧前爪
      p.line(bx + 5, 35 + by, bx + 9 + frontExtend, 44 + by, '#ffffff', 3);
      p.ellipse(bx + 10 + frontExtend, 45 + by, 2.8, 2.0, '#ffffff');
      p.px(bx + 11 + frontExtend, 45 + by, '#ff9ec2');

      // [部件 5] 标志性「樱红丝带蝴蝶结 + 鎏金新月小铃铛」项圈！
      p.line(bx + 2, 29 + by, bx + 9, 32 + by, '#e62e5c', 2);
      p.rect(bx + 1, 27 + by, 4, 3, '#ff4d7d', true);
      p.px(bx + 2, 28 + by, '#ffd9e6', true);
      p.ellipse(bx + 8, 33 + by, 2.1, 2.1, '#ffe066', true);
      p.px(bx + 8, 32 + by, '#ffffff', true);

      // [部件 6] 超萌又锐利的 3/4 侧颜「月影白兔头雕 + 迎风向后斜展的长兔耳」！
      const hx = bx + 7;
      const hy = 24 + by;
      const earWave = Math.round(pose.flutter * 1.1);
      // 远侧长兔耳（高耸向后优雅微倾，内衬发光樱粉！）
      p.poly([
        [hx - 1, hy - 3],
        [hx - 9 + earWave, hy - 14],
        [hx - 5 + earWave, hy - 15],
        [hx + 2, hy - 4],
      ], '#dce8ff');
      p.poly([
        [hx - 1, hy - 4],
        [hx - 7 + earWave, hy - 12],
        [hx - 5 + earWave, hy - 13],
        [hx + 1, hy - 4],
      ], '#ff8fb8', true);
      // 近侧长兔耳（顺风舒展流线型，带纯白高光！）
      p.poly([
        [hx - 3, hy - 2],
        [hx - 14 + earWave, hy - 10],
        [hx - 11 + earWave, hy - 13],
        [hx + 1, hy - 4],
      ], '#ffffff');
      p.ellipse(hx - 12 + earWave, hy - 11, 2.2, 1.8, '#ffffff');
      p.poly([
        [hx - 3, hy - 3],
        [hx - 11 + earWave, hy - 10],
        [hx - 9 + earWave, hy - 11],
        [hx - 1, hy - 4],
      ], '#ff7aa8', true);

      // 圆润饱满雪白兔脸 + 翘萌小嘴吻部
      p.ellipse(hx, hy, 6.2, 5.2, '#dce8ff');
      p.ellipse(hx, hy - 0.5, 5.6, 4.6, '#ffffff');
      p.ellipse(hx + 5, hy + 1, 2.8, 2.5, '#ffffff');
      p.hline(hx - 2, hy + 4, 7, '#c7daf7');
      // 额心发光冰蓝弦月灵纹（妖兔真身标志！）
      p.px(hx + 2, hy - 3, '#66f0ff', true);
      p.px(hx + 3, hy - 2, '#ffffff', true);
      // 炽亮绯红月兔大眼（萌中带着妖异锐气！）
      if (pose.expr !== 'hurt') {
        p.rect(hx + 1, hy - 1, 3, 3, '#b81442', true);
        p.rect(hx + 2, hy, 2, 2, '#ff5c8a', true);
        p.px(hx + 2, hy - 1, '#ffffff', true);
        p.px(hx + 3, hy + 1, '#ffd9e6', true);
      } else {
        p.hline(hx + 1, hy, 3, '#8c1438');
      }
      // 樱粉小腮红与俏皮小粉鼻尖
      p.hline(hx - 1, hy + 2, 2, '#ffa6c2');
      p.px(hx + 7, hy, '#ff5c8a', true);
      p.px(hx + 6, hy + 2, '#f0a6be');

      // [部件 7] 攻击帧：月兔极速扑斩绽放「樱粉×苍青弦月疾影斩击弧」！
      if (isAtk && (f === 1 || f === 2)) {
        const arcCx = hx + 3;
        const arcCy = hy + 6;
        for (let i = 0; i < 8; i++) {
          const a0 = -1.1 + (i / 8) * 2.15;
          const a1 = -1.1 + ((i + 1) / 8) * 2.15;
          p.line(
            Math.min(46, Math.round(arcCx + Math.cos(a0) * 11)),
            Math.round(arcCy + Math.sin(a0) * 12),
            Math.min(46, Math.round(arcCx + Math.cos(a1) * 11)),
            Math.round(arcCy + Math.sin(a1) * 12),
            i % 2 === 0 ? '#ff7ab8' : '#7aefff',
            2,
            true,
          );
        }
        p.px(Math.min(46, hx + 12), hy - 2, '#ffffff', true);
      }
    },
  },
};

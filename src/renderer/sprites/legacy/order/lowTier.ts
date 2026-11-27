/**
 * 幻月庭园 · 秩序系英雄与低阶（T1-T2）精雕 48×54 像素立绘与骨骼动画像素绘谱
 * 包含：八意永琳、玉兔掷弹兵、幻法狸妖、重装月兔近卫
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

export const ORDER_LOW_TIER_RIG_SPECS: Record<string, SpriteRigSpec> = {
  // =========================================================================
  // 秩序代表英雄：八意永琳（银发麻花长辫 + 3/4 红蓝星纹洋裙与圆润巫医帽 + 天弓「天文密葬」）
  // =========================================================================
  hero_eirin: {
    backdropTop: '#0a122e',
    backdropBottom: '#1c2b59',
    backdropGlow: '#7cb5ff',
    avatarCrop: { x: 7, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 3, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 17 : Math.round(19 + pose.leanX * 0.75);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const stride = Math.round(pose.stride * 3.6);

      // [部件 1] 柔顺飘逸银白后发 + 标志性垂腰粗麻花长辫（红金蝴蝶结）
      p.poly([
        [bx - 6, 19 + by],
        [bx - 13 + sway, 31 + by],
        [bx - 12 + sway, 43 + by],
        [bx - 7 + sway, 44 + by],
        [bx - 4, 30 + by],
      ], '#8898bf');
      p.poly([
        [bx - 5, 20 + by],
        [bx - 11 + sway, 31 + by],
        [bx - 10 + sway, 41 + by],
        [bx - 6, 29 + by],
      ], '#dce6fa');
      p.vline(bx - 9 + sway, 27 + by, 10, '#ffffff');
      p.px(bx - 10 + sway, 31 + by, '#7e8fb8');
      p.px(bx - 9 + sway, 35 + by, '#7e8fb8');
      p.rect(bx - 12 + sway, 39 + by, 5, 2, '#d93255');
      p.px(bx - 10 + sway, 40 + by, '#ffe885', true);

      // [部件 2] 3/4 优雅迈步白袜与深蓝金扣鞋
      const backLift = pose.stride > 0.3 ? -2 : 0;
      const frontLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(bx - 5 - stride, 42 + backLift, 3, 4, '#dce6fa');
      p.rect(bx - 6 - stride, 45 + backLift, 4, 3, '#1e3266');
      p.rect(bx + 2 + stride, 42 + frontLift, 3, 4, '#ffffff');
      p.rect(bx + 2 + stride, 45 + frontLift, 5, 3, '#2b478c');
      p.px(bx + 4 + stride, 46 + frontLift, '#ffe073');

      // [部件 3] 3/4 红蓝对称百褶洋裙 + 雪白蕾丝波浪缘 + 鎏金星辰纹饰
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      p.poly([[bx - 6, 32 + by], [bx + 1, 32 + by], [bx + 1, 44 + by], [bx - 11 + sk, 44 + by]], '#162d66');
      p.poly([[bx - 5, 32 + by], [bx + 1, 32 + by], [bx + 1, 43 + by], [bx - 8 + sk, 43 + by]], '#2d57b5');
      p.vline(bx - 4, 34 + by, 8, '#5e8cf0');
      p.poly([[bx + 1, 32 + by], [bx + 6, 32 + by], [bx + 10 + sk, 44 + by], [bx + 1, 44 + by]], '#871833');
      p.poly([[bx + 1, 32 + by], [bx + 5, 32 + by], [bx + 8 + sk, 43 + by], [bx + 1, 43 + by]], '#cf2d50');
      p.vline(bx + 5, 34 + by, 8, '#f06281');
      p.hline(bx - 10 + sk, 42 + by, 19, '#f2cc66');
      p.hline(bx - 10 + sk, 43 + by, 19, '#eef4ff');
      p.px(bx - 9 + sk, 44 + by, '#ffffff');
      p.px(bx - 4 + sk, 44 + by, '#ffffff');
      p.px(bx + 2 + sk, 44 + by, '#ffffff');
      p.px(bx + 7 + sk, 44 + by, '#ffffff');
      p.px(bx - 5, 37 + by, '#ffe899', true);
      p.px(bx + 5, 37 + by, '#ffe899', true);

      // 收腰红蓝洋装上身 + 雪白水手披领与金星胸针 + 左侧灯笼袖
      p.rect(bx - 5, 25 + by, 6, 8, '#284fa8');
      p.rect(bx + 1, 25 + by, 4, 8, '#c92a4c');
      p.poly([[bx - 6, 25 + by], [bx + 6, 25 + by], [bx + 4, 28 + by], [bx - 4, 28 + by]], '#f5f8ff');
      p.hline(bx - 5, 32 + by, 10, '#f2cc66');
      p.rect(bx, 28 + by, 2, 2, '#ffe885', true);
      p.poly([[bx - 5, 26 + by], [bx - 10, 31 + by], [bx - 9, 36 + by], [bx - 5, 33 + by]], '#3562c4');
      p.hline(bx - 10, 35 + by, 5, '#ffffff');
      p.rect(bx - 9, 35 + by, 2, 2, '#ffe6d8');

      // [部件 4] 温婉睿智大贤者面容 + 柔美包颊银发双鬓 + 精致圆弧蓝红巫医礼帽
      const headY = 19 + by;
      p.ellipse(bx, headY - 1, 6.7, 5.9, '#93a3c7');
      drawRefinedFace(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#8f1d45', '#ff709e', pose);
      drawRefinedHairCrown(p, bx, headY, '#93a3c7', '#cad6f0', '#eef4ff', '#ffffff');
      drawSoftSideLocks(p, bx, headY, '#a2b2d6', '#eef4ff', 8, 7);
      // 更圆润精致的蓝红巫医礼帽（顶部弧度柔化，帽檐轻巧优雅）
      p.ellipse(bx, headY - 8.2, 5.8, 2.9, '#1b316b');
      p.ellipse(bx, headY - 8.7, 4.4, 2.0, '#2f57b8');
      p.hline(bx - 3, headY - 10, 6, '#6290f0');
      p.hline(bx - 6, headY - 5, 13, '#cf294d');
      p.hline(bx - 5, headY - 6, 10, '#f25c7c');
      p.vline(bx, headY - 10, 4, '#fff2b0', true);
      p.hline(bx - 1, headY - 9, 3, '#fff2b0', true);

      // [部件 5] 天弓「天文密葬」+ 璀璨苍月星矢
      const pull = pose.armAction <= -0.5 ? -2 : pose.armAction >= 0.7 ? 2 : 0;
      const bowX = bx + 15 + Math.max(0, pull);
      const bowY = 28 + by;
      const drawHandX = bx + 8 + Math.min(0, pull);
      p.line(bx + 5, 27 + by, bowX - 1, bowY, '#cf2d50', 2);
      p.rect(bowX - 2, bowY - 1, 2, 2, '#ffe6d8');
      p.line(bx + 3, 28 + by, drawHandX, bowY, '#eef4ff', 2);
      p.rect(drawHandX - 1, bowY - 1, 2, 2, '#ffe6d8');
      p.line(bowX - 4, 15 + by, bowX + 1, 21 + by, '#4578db', 2);
      p.line(bowX + 1, 21 + by, bowX + 1, 35 + by, '#9ec4ff', 2);
      p.line(bowX + 1, 35 + by, bowX - 4, 41 + by, '#4578db', 2);
      p.px(bowX - 4, 15 + by, '#ffe885', true);
      p.px(bowX - 4, 41 + by, '#ffe885', true);
      p.px(bowX + 1, 21 + by, '#ffffff', true);
      p.px(bowX + 1, 35 + by, '#ffffff', true);
      p.line(bowX - 4, 16 + by, drawHandX, bowY, '#dceeff', 1);
      p.line(bowX - 4, 40 + by, drawHandX, bowY, '#dceeff', 1);
      p.line(drawHandX, bowY, Math.min(43, bowX + 7), bowY, '#75e8ff', 1, true);
      p.poly([
        [Math.min(41, bowX + 5), bowY - 2],
        [Math.min(45, bowX + 9), bowY],
        [Math.min(41, bowX + 5), bowY + 2],
      ], '#ffffff', true);
      if (pose.slashAlpha > 0.3) {
        p.line(bowX + 6, bowY, Math.min(45, bowX + 13), bowY, '#8cf5ff', 2, true);
        p.line(bowX + 6, bowY - 3, Math.min(44, bowX + 11), bowY - 1, '#ffe885', 1, true);
        p.line(bowX + 6, bowY + 3, Math.min(44, bowX + 11), bowY + 1, '#ffe885', 1, true);
      }
    },
  },

  // =========================================================================
  // 秩序 T1-B：玉兔掷弹兵（灵动侦察萌兔 · 软萌兔耳 + 猎装短裙弹袋 + 3/4 轻快迈步 + 木金弹弓）
  // =========================================================================
  creature_lunar_slinger: {
    backdropTop: '#0b1633',
    backdropBottom: '#1c2f5c',
    backdropGlow: '#ffe08a',
    avatarCrop: { x: 8, y: 4, size: 28 },
    portraitCrop: { x: 3, y: 2, w: 42, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 18 : Math.round(20 + pose.leanX * 0.85);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const earTilt = Math.round(-pose.leanX * 0.6 + pose.flutter * 1.1);
      const stride = Math.round(pose.stride * 4.2);

      // [部件 1] 软萌毛茸茸双兔耳 + 蓝金星发带
      p.poly([[bx - 5, 17 + by], [bx - 10 + earTilt, 7 + by], [bx - 6 + earTilt, 6 + by], [bx - 2, 17 + by]], '#e3ebfa');
      p.ellipse(bx - 8 + earTilt, 7 + by, 2.0, 1.8, '#e3ebfa');
      p.poly([[bx - 5, 16 + by], [bx - 9 + earTilt, 9 + by], [bx - 7 + earTilt, 8 + by], [bx - 3, 16 + by]], '#ff9ebc', true);
      p.poly([[bx + 2, 17 + by], [bx + 5 + earTilt, 6 + by], [bx + 9 + earTilt, 7 + by], [bx + 6, 17 + by]], '#ffffff');
      p.ellipse(bx + 7 + earTilt, 6 + by, 2.0, 1.8, '#ffffff');
      p.poly([[bx + 3, 16 + by], [bx + 5 + earTilt, 8 + by], [bx + 7 + earTilt, 9 + by], [bx + 5, 16 + by]], '#ff94ba', true);
      p.rect(bx + 2, 14 + by, 5, 2, '#3d73e0');
      p.px(bx + 4, 15 + by, '#ffe885', true);

      // [部件 2] 飘逸月蓝小披风 + 蓬松小白绒尾
      p.poly([[bx - 5, 27 + by], [bx - 14 + sway, 32 + by], [bx - 12 + sway, 38 + by], [bx - 5, 34 + by]], '#22458c');
      p.hline(bx - 12 + sway, 37 + by, 7, '#ffe073');
      p.ellipse(bx - 10, 40 + by + Math.round(pose.flutter), 3.3, 3.0, '#e8eefc');
      p.ellipse(bx - 10, 39 + by + Math.round(pose.flutter), 2.2, 2.0, '#ffffff');

      // [部件 3] 3/4 俏皮轻快站姿白袜与棕色绑带小短靴（左后右前微错开！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.line(bx - 3, 41 + by, bx - 5 - stride, 45 + lLift, '#dfe7f7', 2);
      p.rect(bx - 7 - stride, 45 + lLift, 4, 3, '#6e4326');
      p.hline(bx - 6 - stride, 45 + lLift, 3, '#e8b954');
      p.line(bx + 2, 41 + by, bx + 4 + stride, 45 + rLift, '#ffffff', 2);
      p.rect(bx + 3 + stride, 45 + rLift, 4, 3, '#8c5832');
      p.hline(bx + 3 + stride, 45 + rLift, 3, '#ffe073');

      // [部件 4] 蓬蓬月蓝侦察短裙 + 棕色斜挎月石弹袋
      const sk = Math.round(-pose.leanX * 0.5 + sway * 0.5);
      p.poly([[bx - 6, 33 + by], [bx + 6, 33 + by], [bx + 10 + sk, 42 + by], [bx - 10 + sk, 42 + by]], '#264994');
      p.poly([[bx - 4, 33 + by], [bx + 4, 33 + by], [bx + 7 + sk, 41 + by], [bx - 7 + sk, 41 + by]], '#4d7ee6');
      p.vline(bx - 2, 34 + by, 7, '#82aeff');
      p.hline(bx - 9 + sk, 41 + by, 18, '#ffffff');
      p.poly([[bx - 5, 26 + by], [bx + 5, 26 + by], [bx + 5, 34 + by], [bx - 5, 34 + by]], '#f5f8ff');
      p.poly([[bx - 6, 26 + by], [bx + 6, 26 + by], [bx + 5, 29 + by], [bx - 5, 29 + by]], '#3967c7');
      p.hline(bx - 5, 29 + by, 10, '#ffe073');
      p.line(bx - 4, 27 + by, bx + 4, 34 + by, '#7a4927', 1);
      p.rect(bx - 8, 32 + by, 5, 5, '#8a5530');
      p.rect(bx - 7, 33 + by, 3, 3, '#b87644');
      p.px(bx - 6, 33 + by, '#ffe885', true);

      // [部件 5] 甜美暖亚麻金短发 + 包颊双鬓 + 草莓粉红灵动大眼
      const headY = 21 + by;
      p.ellipse(bx, headY - 1, 6.8, 6.0, '#b38a4c');
      drawRefinedFace(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#c42758', '#ff85b0', pose);
      drawRefinedHairCrown(p, bx, headY, '#a67d41', '#d9b16a', '#f7db9e', '#fff6d6');
      drawSoftSideLocks(p, bx, headY, '#b58d4e', '#f2d591', 6, 6);

      // [部件 6] 拉满的月木鎏金 Y 字弹弓 + 璀璨星石弹丸
      const pull = pose.armAction <= -0.5 ? -3 : pose.armAction >= 0.7 ? 3 : 0;
      const forkX = bx + 13 + Math.max(0, pull);
      const forkY = 28 + by;
      p.line(bx + 4, 28 + by, forkX - 1, forkY + 2, '#4d7ee6', 2);
      p.rect(forkX - 1, forkY + 1, 2, 2, '#ffe6d8');
      p.line(bx - 1, 29 + by, bx + 6 + pull, forkY - 2, '#f5f8ff', 2);
      p.rect(bx + 5 + pull, forkY - 3, 2, 2, '#ffe6d8');
      p.rect(forkX - 1, forkY + 1, 3, 5, '#8c5627');
      p.line(forkX, forkY + 1, forkX - 3, forkY - 5, '#c78542', 2);
      p.line(forkX + 1, forkY + 1, forkX + 4, forkY - 5, '#e8a85a', 2);
      p.px(forkX - 3, forkY - 5, '#ffe885', true);
      p.px(forkX + 4, forkY - 5, '#ffe885', true);
      const pouchX = bx + 6 + pull;
      const pouchY = forkY - 3;
      p.line(forkX - 3, forkY - 5, pouchX, pouchY, '#fff0c2', 1);
      p.line(forkX + 4, forkY - 5, pouchX, pouchY, '#fff0c2', 1);
      p.ellipse(pouchX, pouchY, 2.3, 2.3, '#ffcf40', true);
      p.px(pouchX, pouchY, '#ffffff', true);
      if (pose.slashAlpha > 0.3) {
        p.line(forkX + 2, forkY - 3, Math.min(43, forkX + 10), forkY - 4, '#ffe878', 2, true);
        p.ellipse(Math.min(43, forkX + 10), forkY - 4, 2.1, 2.1, '#ffffff', true);
      }
    },
  },

  // =========================================================================
  // 秩序 T2-A：幻法狸妖（蓬松条纹大狸尾 + 圆绒狸耳碧叶 + 和风靛金振袖 + 绘月折扇与青金妖火）
  // =========================================================================
  creature_tanuki_illusionist: {
    backdropTop: '#0b142e',
    backdropBottom: '#1c2b4a',
    backdropGlow: '#78f0cc',
    avatarCrop: { x: 8, y: 5, size: 28 },
    portraitCrop: { x: 2, y: 3, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 19 : Math.round(21 + pose.leanX * 0.8);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.6);
      const stride = Math.round(pose.stride * 3.4);

      // [部件 1] 标志性超级蓬松条纹大狸尾
      const tX = bx - 12 + sway;
      const tY = 34 + by;
      p.ellipse(tX, tY, 7.2, 5.4, '#593720');
      p.ellipse(tX, tY - 1, 5.8, 4.2, '#8c5a37');
      p.ellipse(tX - 1, tY - 2, 4.0, 2.6, '#b87d52');
      p.poly([[tX - 2, tY - 5], [tX + 1, tY - 5], [tX, tY + 4], [tX - 3, tY + 4]], '#422716');
      p.poly([[tX + 3, tY - 4], [tX + 5, tY - 3], [tX + 4, tY + 3], [tX + 2, tY + 3]], '#422716');
      p.ellipse(tX - 5, tY - 1, 2.6, 2.4, '#f2e4cc');

      // [部件 2] 3/4 轻巧迈步白足袋与红带木屐
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(bx - 5 - stride, 42 + lLift, 3, 4, '#f5f2eb');
      p.rect(bx - 6 - stride, 46 + lLift, 5, 2, '#7a4927');
      p.px(bx - 4 - stride, 45 + lLift, '#d93b58');
      p.rect(bx + 2 + stride, 42 + rLift, 3, 4, '#ffffff');
      p.rect(bx + 2 + stride, 46 + rLift, 5, 2, '#995e33');
      p.px(bx + 4 + stride, 45 + rLift, '#d93b58');

      // [部件 3] 宽大飘逸和风蓝靛羽织振袖 + 翡翠金边褶裙 + 鎏金宽腰封
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      p.poly([[bx - 6, 33 + by], [bx + 6, 33 + by], [bx + 10 + sk, 43 + by], [bx - 10 + sk, 43 + by]], '#1b2c5c');
      p.poly([[bx - 4, 33 + by], [bx + 4, 33 + by], [bx + 7 + sk, 42 + by], [bx - 7 + sk, 42 + by]], '#3556a6');
      p.vline(bx - 2, 34 + by, 7, '#648ce0');
      p.hline(bx - 9 + sk, 42 + by, 18, '#5ce6be');
      p.hline(bx - 8 + sk, 41 + by, 16, '#ffe073');
      p.rect(bx - 5, 26 + by, 10, 8, '#f5f7ff');
      p.line(bx - 3, 26 + by, bx, 31 + by, '#1e3a7a', 1);
      p.line(bx + 3, 26 + by, bx, 31 + by, '#1e3a7a', 1);
      p.poly([[bx - 6, 26 + by], [bx - 2, 26 + by], [bx - 3, 34 + by], [bx - 6, 34 + by]], '#2d4d99');
      p.poly([[bx + 2, 26 + by], [bx + 6, 26 + by], [bx + 6, 34 + by], [bx + 3, 34 + by]], '#2d4d99');
      p.poly([[bx - 6, 27 + by], [bx - 12, 31 + by], [bx - 11, 37 + by], [bx - 5, 35 + by]], '#3a60ba');
      p.hline(bx - 11, 36 + by, 6, '#ffe073');
      p.rect(bx - 5, 32 + by, 10, 3, '#e0a93a');
      p.rect(bx - 2, 32 + by, 4, 3, '#5ce6be');

      // [部件 4] 娇俏栗棕卷发 + 毛绒圆狸耳 + 发光翡翠叶冠 + 柔和包颊双鬓
      const headY = 20 + by;
      p.ellipse(bx, headY - 1, 7.0, 6.2, '#54331d');
      p.ellipse(bx - 6, headY - 6, 3.4, 3.2, '#59361f');
      p.ellipse(bx - 6, headY - 6, 2.2, 2.0, '#9c6844');
      p.ellipse(bx - 6, headY - 5, 1.2, 1.1, '#f2d9be');
      p.ellipse(bx + 6, headY - 6, 3.4, 3.2, '#59361f');
      p.ellipse(bx + 6, headY - 6, 2.2, 2.0, '#9c6844');
      p.ellipse(bx + 6, headY - 5, 1.2, 1.1, '#f2d9be');
      drawRefinedFace(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#147a63', '#78ffdc', pose);
      drawRefinedHairCrown(p, bx, headY, '#54331d', '#875432', '#b87c52', '#e0b089');
      drawSoftSideLocks(p, bx, headY, '#6e4326', '#a86e46', 7, 7);
      p.poly([[bx - 3, headY - 8], [bx + 1, headY - 12], [bx + 5, headY - 9], [bx + 1, headY - 7]], '#26a66c', true);
      p.poly([[bx - 1, headY - 9], [bx + 1, headY - 11], [bx + 4, headY - 9], [bx + 1, headY - 8]], '#73f5b2', true);
      p.px(bx + 1, headY - 10, '#e6fff2', true);

      // [部件 5] 右手展开绘月折扇 + 悬浮青金妖火
      const fanLift = pose.armAction <= -0.5 ? -4 : pose.armAction >= 0.6 ? 2 : 0;
      const fanX = bx + 10;
      const fanY = 29 + by + fanLift;
      p.poly([[bx + 5, 27 + by], [fanX, fanY + 1], [fanX - 1, fanY + 6], [bx + 4, 34 + by]], '#3a60ba');
      p.rect(fanX - 1, fanY, 2, 2, '#ffe6d8');
      p.poly([
        [fanX, fanY + 1],
        [fanX + 6, fanY - 6],
        [fanX + 9, fanY - 2],
        [fanX + 8, fanY + 3],
      ], '#f5ebd1');
      p.line(fanX + 6, fanY - 6, fanX + 9, fanY - 2, '#3d70d6', 2);
      p.line(fanX + 9, fanY - 2, fanX + 8, fanY + 3, '#ffe073', 1);
      p.px(fanX + 5, fanY - 2, '#ff5978', true);
      const orbY = 16 + by + Math.round(Math.sin(pose.phase * Math.PI * 2) * 1.8) + fanLift;
      p.ellipse(fanX + 6, orbY, 3.0, 3.6, '#2cd9b5', true);
      p.ellipse(fanX + 6, orbY + 1, 1.8, 2.2, '#b8ffee', true);
      p.px(fanX + 6, orbY - 3, '#ffffff', true);
      if (pose.slashAlpha > 0.3) {
        p.line(fanX + 7, orbY, Math.min(45, fanX + 14), orbY - 3, '#78ffea', 2, true);
        p.line(fanX + 7, orbY + 2, Math.min(45, fanX + 14), orbY + 4, '#ffe885', 2, true);
      }
    },
  },

  // =========================================================================
  // 秩序 T2-B：重装月兔近卫（v5 高对比度英气女武神兔娘骑士！
  // 深靛紫长发与飘扬红里皇家披风强烈衬托雪白兔耳与冷银胸铠！
  // 斜举 45° 新月银刃长戟 + 斜护苍金月纹鸢盾，视觉精致度直接看齐退魔剑士！）
  // =========================================================================
  creature_armored_lunar_guard: {
    backdropTop: '#0a142e',
    backdropBottom: '#1c2f59',
    backdropGlow: '#9ec4ff',
    avatarCrop: { x: 8, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 18 : Math.round(21 + pose.leanX * 0.8);
      const by = Math.round(pose.breathY * 0.9 - pose.stepLift * 0.8);
      const sway = Math.round(pose.flutter * 1.4);
      const earTilt = Math.round(-pose.leanX * 0.5 + pose.flutter * 0.9);
      const stride = Math.round(pose.stride * 3.4);

      // [部件 1] 飒爽向左扬起的「午夜紫飘逸侧马尾 + 皇家深蓝绯红衬里骑士披风」（建立不对称 S 曲线动势！）
      p.poly([
        [bx - 4, 24 + by],
        [bx - 16 + sway, 34 + by],
        [bx - 13 + sway, 43 + by],
        [bx - 4, 40 + by],
      ], '#16285e');
      p.poly([
        [bx - 4, 26 + by],
        [bx - 13 + sway, 34 + by],
        [bx - 11 + sway, 41 + by],
        [bx - 4, 39 + by],
      ], '#8c1d3b');
      p.hline(bx - 13 + sway, 41 + by, 8, '#ffe073');
      // 飘逸后扬的深靛紫波浪长发（以深色长发强力反衬雪白兔耳与亮银胸甲！）
      p.poly([
        [bx - 5, 17 + by],
        [bx - 14 + sway, 22 + by],
        [bx - 13 + sway, 31 + by],
        [bx - 5, 29 + by],
      ], '#261f52');
      p.poly([
        [bx - 5, 18 + by],
        [bx - 12 + sway, 23 + by],
        [bx - 11 + sway, 28 + by],
        [bx - 5, 26 + by],
      ], '#4e4199');
      p.line(bx - 6, 19 + by, bx - 11 + sway, 23 + by, '#8c7fe0', 1);

      // [部件 2] 极高辨识度的「金环甲护雪白双兔耳」（深色头冠衬托下超级清新可爱！）
      p.poly([[bx - 5, 16 + by], [bx - 10 + earTilt, 6 + by], [bx - 6 + earTilt, 5 + by], [bx - 2, 16 + by]], '#eef4ff');
      p.poly([[bx - 5, 15 + by], [bx - 8 + earTilt, 8 + by], [bx - 6 + earTilt, 8 + by], [bx - 3, 15 + by]], '#ff9ebc', true);
      p.poly([[bx - 6, 16 + by], [bx - 7 + earTilt, 12 + by], [bx - 3 + earTilt, 12 + by], [bx - 2, 16 + by]], '#2d4685');
      p.hline(bx - 7 + earTilt, 12 + by, 4, '#ffe073');
      p.poly([[bx + 2, 16 + by], [bx + 5 + earTilt, 4 + by], [bx + 9 + earTilt, 5 + by], [bx + 6, 16 + by]], '#ffffff');
      p.ellipse(bx + 7 + earTilt, 5 + by, 1.9, 1.7, '#ffffff');
      p.poly([[bx + 3, 15 + by], [bx + 5 + earTilt, 7 + by], [bx + 7 + earTilt, 8 + by], [bx + 5, 15 + by]], '#ff94ba', true);
      p.poly([[bx + 2, 16 + by], [bx + 4 + earTilt, 12 + by], [bx + 7 + earTilt, 12 + by], [bx + 6, 16 + by]], '#3b5ca8');
      p.hline(bx + 4 + earTilt, 12 + by, 4, '#ffe073');

      // [部件 3] 3/4 英姿跨步过膝白银骑士长靴（修长稳健、绝非圆柱直腿！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.line(bx - 3, 40 + by, bx - 5 - stride, 46 + lLift, '#394f82', 3);
      p.rect(bx - 7 - stride, 45 + lLift, 4, 3, '#1f3161');
      p.px(bx - 5 - stride, 43 + lLift, '#ffe073');
      p.line(bx + 2, 40 + by, bx + 4 + stride, 46 + rLift, '#a8c4f5', 3);
      p.rect(bx + 3 + stride, 45 + rLift, 5, 3, '#2d4b94');
      p.hline(bx + 4 + stride, 43 + rLift, 3, '#ffe073');
      p.px(bx + 4 + stride, 41 + rLift, '#ffffff');

      // [部件 4] 标杆级收腰女骑士白银重铠（深藏蓝战裙 + 纯白金边骑士绶带 + 3 阶亮银收腰胸甲 + 绯红领结！）
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      p.poly([[bx - 5, 33 + by], [bx + 5, 33 + by], [bx + 9 + sk, 42 + by], [bx - 9 + sk, 42 + by]], '#13275e');
      p.poly([[bx - 4, 33 + by], [bx + 4, 33 + by], [bx + 6 + sk, 41 + by], [bx - 6 + sk, 41 + by]], '#2852b5');
      p.hline(bx - 8 + sk, 41 + by, 16, '#ffe073');
      // 精致对称银色侧甲片
      p.poly([[bx - 6, 33 + by], [bx - 3, 33 + by], [bx - 4 + sk, 39 + by], [bx - 7 + sk, 39 + by]], '#b3cdf7');
      p.poly([[bx + 3, 33 + by], [bx + 6, 33 + by], [bx + 7 + sk, 39 + by], [bx + 4 + sk, 39 + by]], '#e6f0ff');
      // 中央纯白绯红月纹前绶带（对标退魔剑士的超耐看红白金配色！）
      p.poly([[bx - 1, 33 + by], [bx + 2, 33 + by], [bx + 3 + sk, 42 + by], [bx - 1 + sk, 42 + by]], '#ffffff');
      p.vline(bx + 1, 34 + by, 7, '#d92b4b');
      p.px(bx + 1, 36 + by, '#ffe885', true);

      // 收腰 3 阶冷银高光胸甲 + 绯红领巾点缀 + 鎏金腰带 + 弧形银肩铠
      p.poly([[bx - 4, 25 + by], [bx + 4, 25 + by], [bx + 5, 33 + by], [bx - 5, 33 + by]], '#4d6499');
      p.rect(bx - 3, 26 + by, 6, 6, '#c2d8fa');
      p.rect(bx - 2, 26 + by, 3, 4, '#ffffff');
      p.line(bx - 3, 25 + by, bx, 28 + by, '#d92b4b', 1);
      p.line(bx + 3, 25 + by, bx, 28 + by, '#ff4d6d', 1);
      p.px(bx, 29 + by, '#ffe885', true);
      p.hline(bx - 5, 32 + by, 10, '#f2c44d');
      p.poly([[bx - 8, 25 + by], [bx - 4, 24 + by], [bx - 4, 28 + by], [bx - 7, 28 + by]], '#6886c2');
      p.hline(bx - 8, 25 + by, 4, '#eef5ff');
      p.poly([[bx + 4, 24 + by], [bx + 8, 25 + by], [bx + 7, 28 + by], [bx + 4, 28 + by]], '#8caae3');
      p.hline(bx + 4, 25 + by, 4, '#ffffff');

      // [部件 5] 超高颜值深靛紫秀发兔娘脸庞 + 宝石红眸（铃仙/月兔系高对比颜值拉满！）+ 鎏金新月额冠
      const headY = 19 + by;
      drawRefinedFace(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#b81d48', '#ff7098', pose);
      drawRefinedHairCrown(p, bx, headY, '#261f52', '#4a3d91', '#7e6fd4', '#c9bfff');
      drawSoftSideLocks(p, bx, headY, '#2e2661', '#6556b8', 7, 6);
      // 精致白金新月发箍（绝不遮挡秀发与兔耳！）
      p.hline(bx - 5, headY - 5, 10, '#eef5ff');
      p.px(bx - 2, headY - 6, '#ffe066', true);
      p.px(bx, headY - 7, '#78f0ff', true);
      p.px(bx + 2, headY - 6, '#ffe066', true);

      // [部件 6] 左前 3/4 斜护「月蓝光纹秘银鸢盾」+ 右手 45° 斜擎「绯缨月牙银刃长戟」！
      const shX = bx - 13;
      const shY = 30 + by;
      // 借鉴退魔剑士的斜角立体盾牌造型（绝不死板竖直！）
      p.poly([
        [shX + 1, shY + 1],
        [shX + 8, shY - 2],
        [shX + 10, shY + 4],
        [shX + 5, shY + 10],
        [shX - 1, shY + 6],
      ], '#1b3a80');
      p.poly([
        [shX + 2, shY + 2],
        [shX + 7, shY],
        [shX + 8, shY + 4],
        [shX + 4, shY + 8],
        [shX + 1, shY + 5],
      ], '#4b86eb');
      p.line(shX + 1, shY + 1, shX + 8, shY - 2, '#eef6ff', 1, true);
      p.line(shX + 8, shY - 2, shX + 10, shY + 4, '#ffe885', 1, true);
      // 盾面璀璨鎏金新月徽
      p.px(shX + 4, shY + 2, '#ffe885', true);
      p.px(shX + 3, shY + 4, '#ffe885', true);
      p.px(shX + 5, shY + 5, '#ffe885', true);
      p.px(shX + 5, shY + 3, '#ffffff', true);

      // 右手 45° 斜角飒爽持月刃重戟（对标退魔剑士的利落斜举对角线，彻底告别竖直牙签！）
      const armX = bx + 8 + (isAtk && (f === 1 || f === 2) ? 3 : pose.armAction <= -0.5 ? -2 : 0);
      const armY = 29 + by;
      p.line(bx + 5, 27 + by, armX, armY, '#9bb8ed', 2);
      p.rect(armX - 1, armY - 1, 2, 2, '#ffe6d8');
      if (isAtk && (f === 1 || f === 2)) {
        // 凌厉斜劈 + 璀璨苍金月弧斩击波！
        p.line(armX - 3, armY + 3, armX + 10, armY - 8, '#c79338', 2);
        p.poly([[armX + 8, armY - 11], [armX + 14, armY - 12], [armX + 12, armY - 5]], '#ffffff', true);
        p.px(armX + 6, armY - 6, '#ff3d60', true);
        const arcCx = armX + 3;
        const arcCy = armY - 1;
        for (let i = 0; i < 9; i++) {
          const a0 = -1.2 + (i / 9) * 2.1;
          const a1 = -1.2 + ((i + 1) / 9) * 2.1;
          p.line(
            Math.min(46, Math.round(arcCx + Math.cos(a0) * 14)),
            Math.round(arcCy + Math.sin(a0) * 14),
            Math.min(46, Math.round(arcCx + Math.cos(a1) * 14)),
            Math.round(arcCy + Math.sin(a1) * 14),
            i % 2 === 0 ? '#78eeff' : '#ffe478',
            2,
            true,
          );
        }
      } else {
        // 帅气 45° 对角线斜举月刃长戟（杆身贯穿右下至右上净空，月牙戟刃寒光四射！）
        p.line(armX - 4, armY + 8, armX + 10, armY - 10, '#8f6324', 2);
        p.line(armX - 4, armY + 8, armX + 10, armY - 10, '#f2c866', 1);
        // 绯红飘扬枪缨
        p.rect(armX + 7, armY - 7, 3, 2, '#e62e50', true);
        p.px(armX + 9, armY - 5, '#ff7894');
        // 寒光新月双刃戟尖（精致锋利，无大白块！）
        p.line(armX + 10, armY - 10, Math.min(46, armX + 15), armY - 16, '#8ce8ff', 2, true);
        p.line(armX + 10, armY - 10, Math.min(46, armX + 15), armY - 16, '#ffffff', 1, true);
        p.poly([
          [armX + 9, armY - 13],
          [Math.min(45, armX + 14), armY - 12],
          [armX + 12, armY - 7],
          [armX + 11, armY - 10],
        ], '#dceeff', true);
        p.px(Math.min(46, armX + 15), armY - 16, '#ffffff', true);
      }
    },
  },
};

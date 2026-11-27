/**
 * 魔法之森 · 混沌系中低阶（T1-T3A）精雕 48×54 像素立绘与骨骼动画像素绘谱
 * 包含：夜影使魔、魔法使、武装人形、梦境兽
 */

import {
  drawChibiFaceEyes,
  type PixelPainter,
  type RigPose,
  type SpriteRigSpec,
} from '../../voxelSprites';
import { drawAnimeHeadBase, drawSoftHairCrown } from './sharedHelpers';

export const CHAOS_LOW_RIG_SPECS: Record<string, SpriteRigSpec> = {
  /** 混沌 T1-A：夜影使魔（灵动猫耳兜帽暗夜刺客使魔 + 凌风星纹长围巾 + 疾影双月牙短刃 + 翘尾） */
  creature_shadow_imp: {
    backdropTop: '#100a21',
    backdropBottom: '#29153d',
    backdropGlow: '#c978ff',
    avatarCrop: { x: 10, y: 6, size: 28 },
    portraitCrop: { x: 3, y: 4, w: 42, h: 46 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(24 + pose.leanX * 1.1);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.8);
      const stride = Math.round(pose.stride * 4);

      // [部件 1] 凌风飘扬的星纹紫罗兰长围巾（不对称动感飘带！）+ 灵动恶魔猫尾
      p.poly([
        [bx - 4, 24 + by],
        [bx - 16 + sway, 20 + by],
        [bx - 19 + sway, 26 + by],
        [bx - 8 + sway, 29 + by],
        [bx - 3, 27 + by],
      ], '#6b32ab');
      p.line(bx - 5, 25 + by, bx - 17 + sway, 22 + by, '#b573ff', 1);
      p.px(bx - 15 + sway, 24 + by, '#ffe478', true);
      // 俏皮翘卷桃心猫尾
      p.line(bx - 6, 36 + by, bx - 14 + sway, 37 + by, '#45246b', 2);
      p.line(bx - 14 + sway, 37 + by, bx - 17 + sway, 32 + by, '#6e3ba8', 2);
      p.poly([[bx - 17 + sway, 30 + by], [bx - 21 + sway, 31 + by], [bx - 17 + sway, 34 + by]], '#e066ff', true);

      // [部件 2] 敏捷俯身刺客分腿（前弓步+后蹬步，彻底告别直筒柱身材！）
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.line(bx - 3, 37 + by, bx - 7 - stride, 46 + lLift, '#2b1845', 3);
      p.rect(bx - 9 - stride, 45 + lLift, 4, 3, '#4c2c7a');
      p.px(bx - 6 - stride, 43 + lLift, '#b885ff');
      p.line(bx + 3, 37 + by, bx + 7 + stride, 46 + rLift, '#3b215e', 3);
      p.rect(bx + 6 + stride, 45 + rLift, 4, 3, '#673ca3');
      p.px(bx + 7 + stride, 43 + rLift, '#ffe066');

      // [部件 3] 利落收腰紫黑盗影斗篷短打 + 黄金新月扣带
      const sk = Math.round(-pose.leanX * 0.5 + sway * 0.6);
      p.poly([
        [bx - 6, 26 + by],
        [bx + 6, 26 + by],
        [bx + 9 + sk, 39 + by],
        [bx + 3 + sk, 37 + by],
        [bx + sk, 40 + by],
        [bx - 4 + sk, 37 + by],
        [bx - 9 + sk, 39 + by],
      ], '#26143d');
      p.poly([[bx - 4, 27 + by], [bx + 4, 27 + by], [bx + 6 + sk, 37 + by], [bx - 5 + sk, 37 + by]], '#4d287d');
      p.hline(bx - 5, 33 + by, 10, '#d9a43b');
      p.rect(bx - 1, 33 + by, 3, 2, '#fff099', true);
      // 高领紫金围巾领口
      p.rect(bx - 6, 24 + by, 12, 3, '#7a42bd');
      p.rect(bx - 2, 25 + by, 4, 2, '#ffe066', true);

      // [部件 4] 软萌灵巧的大猫耳兜帽 + 暗影中闪耀的狡黠琥珀猫瞳与俏皮小虎牙！
      const headY = 18 + by;
      p.ellipse(bx, headY, 7.8, 6.8, '#2b1647');
      p.ellipse(bx, headY - 1, 6.6, 5.6, '#522c85');
      // 立体大尖猫耳（内耳发光紫粉）
      p.poly([[bx - 7, headY - 3], [bx - 9, headY - 11], [bx - 1, headY - 6]], '#3e2066');
      p.poly([[bx - 6, headY - 4], [bx - 7, headY - 9], [bx - 3, headY - 6]], '#c978ff');
      p.poly([[bx + 7, headY - 3], [bx + 9, headY - 11], [bx + 1, headY - 6]], '#522c85');
      p.poly([[bx + 6, headY - 4], [bx + 7, headY - 9], [bx + 3, headY - 6]], '#e09eff');
      p.hline(bx - 4, headY - 6, 8, '#8c54db');
      p.px(bx - 4, headY - 5, '#ffe478', true); // 小星发卡
      // 兜帽阴影下的小脸与发光大猫眼
      p.ellipse(bx + 1, headY + 1, 5.0, 4.3, '#170c29');
      if (pose.expr === 'hurt') {
        p.hline(bx - 2, headY + 1, 2, '#d499ff');
        p.hline(bx + 2, headY + 1, 2, '#d499ff');
      } else if (pose.blink) {
        p.hline(bx - 2, headY + 1, 2, '#ffe066', true);
        p.hline(bx + 2, headY + 1, 2, '#ffe066', true);
      } else {
        p.rect(bx - 2, headY, 2, 2, '#ffae2b', true);
        p.rect(bx + 2, headY, 2, 2, '#ffae2b', true);
        p.px(bx - 2, headY, '#ffffff', true);
        p.px(bx + 2, headY, '#ffffff', true);
        p.px(bx - 1, headY + 1, '#fff599', true);
        p.px(bx + 3, headY + 1, '#fff599', true);
        // 狡黠小白虎牙笑
        p.hline(bx, headY + 3, 3, '#c78cff');
        p.px(bx + 2, headY + 3, '#ffffff');
      }

      // [部件 5] 动感不对称双弯刃（左手反握后曳，右手前刺突袭！）
      const stab = pose.armAction >= 0.6 ? 6 : pose.armAction <= -0.5 ? -3 : 0;
      p.line(bx - 5, 29 + by, bx - 10, 32 + by, '#4d287d', 2);
      p.line(bx - 10, 32 + by, bx - 16, 29 + by, '#b894ff', 2);
      p.px(bx - 16, 29 + by, '#ffffff', true);
      p.line(bx + 5, 29 + by, bx + 9, 31 + by, '#5e3296', 2);
      p.line(bx + 9, 31 + by, bx + 16 + stab, 26 + by, '#e0c7ff', 2, true);
      p.line(bx + 10, 30 + by, bx + 16 + stab, 26 + by, '#ffffff', 1, true);
      p.rect(bx + 8, 30 + by, 2, 2, '#ffe066');
      if (pose.slashAlpha > 0.3) {
        p.line(bx + 11, 20 + by, bx + 21, 32 + by, '#d966ff', 2, true);
        p.line(bx + 13, 21 + by, bx + 22, 30 + by, '#fff5b8', 1, true);
      }
    },
  },

  /** 混沌 T1-B：魔法使（元气暖橘波浪发小魔女 + 星纹歪尖大帽 + 飞翔喷星魔法扫帚） */
  creature_broom_caster: {
    backdropTop: '#161026',
    backdropBottom: '#331c24',
    backdropGlow: '#ffb347',
    avatarCrop: { x: 10, y: 4, size: 28 },
    portraitCrop: { x: 3, y: 3, w: 42, h: 47 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(24 + pose.leanX * 0.9);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const stride = Math.round(pose.stride * 3.5);

      // [部件 1] 蓬松俏皮暖橘波浪后发
      p.ellipse(bx, 22 + by, 8.2, 5.8, '#b8541c');
      p.ellipse(bx - 7 + sway, 26 + by, 3.2, 3.6, '#eb802b');
      p.px(bx - 7 + sway, 25 + by, '#ffc266');
      p.ellipse(bx + 7 - sway, 26 + by, 3.2, 3.6, '#eb802b');
      p.px(bx + 7 - sway, 25 + by, '#ffc266');

      // [部件 2] 独立小短靴迈步
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(bx - 4 - stride, 42 + lLift, 3, 6, '#231b33');
      p.hline(bx - 4 - stride, 47 + lLift, 4, '#543c6b');
      p.rect(bx + 2 + stride, 42 + rLift, 3, 6, '#302447');
      p.hline(bx + 2 + stride, 47 + rLift, 4, '#6e4e8c');

      // [部件 3] 紫黑荷叶边魔女短裙 + 雪白蕾丝围裙 + 橙金蝴蝶结
      const sk = Math.round(-pose.leanX * 0.5 + sway * 0.6);
      p.poly([[bx - 5, 33 + by], [bx + 5, 33 + by], [bx + 10 + sk, 43 + by], [bx - 10 + sk, 43 + by]], '#241a38');
      p.poly([[bx - 3, 33 + by], [bx + 3, 33 + by], [bx + 7 + sk, 42 + by], [bx - 7 + sk, 42 + by]], '#423066');
      p.hline(bx - 9 + sk, 42 + by, 18, '#fff7eb');
      p.poly([[bx - 3, 33 + by], [bx + 3, 33 + by], [bx + 4 + sk, 41 + by], [bx - 4 + sk, 41 + by]], '#ffffff');
      p.rect(bx - 5, 26 + by, 10, 7, '#342652');
      p.hline(bx - 3, 26 + by, 6, '#ffffff');
      p.rect(bx - 2, 28 + by, 4, 2, '#ff9433');

      // [部件 4] 活泼可爱圆润脸庞 + 明亮水润翡翠金瞳 + 轻盈暖橘刘海（绝不遮眼！）
      const headY = 20 + by;
      drawAnimeHeadBase(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#b84b18', '#ffe066', pose);
      p.rect(bx - 6, headY - 5, 12, 3, '#eb8634');
      p.hline(bx - 4, headY - 5, 7, '#ffc76e');
      p.px(bx - 5, headY - 2, '#c96220');
      p.px(bx, headY - 2, '#eb8634');
      p.px(bx + 5, headY - 2, '#c96220');
      p.rect(bx - 6, headY - 2, 2, 7, '#d97126');
      p.rect(bx + 5, headY - 2, 2, 7, '#d97126');

      // [部件 5] 超大歪折尖顶星辰魔女帽 + 垂落闪亮小金星！
      const hatY = headY - 6;
      p.ellipse(bx, hatY, 12.8, 2.8, '#1f1633');
      p.ellipse(bx, hatY - 0.5, 11.0, 1.9, '#3e2d63');
      p.poly([[bx - 7, hatY - 1], [bx + 7, hatY - 1], [bx - 4 + sway, hatY - 11], [bx - 8 + sway, hatY - 7]], '#2c2047');
      p.poly([[bx - 5, hatY - 1], [bx + 3, hatY - 1], [bx - 3 + sway, hatY - 10]], '#533d82');
      p.rect(bx - 6, hatY - 4, 12, 2, '#f5a638');
      p.rect(bx + 2, hatY - 5, 4, 3, '#ffe478');
      p.rect(bx - 8 + sway, hatY - 7, 2, 2, '#fff099', true);
      p.px(bx - 7 + sway, hatY - 8, '#ffffff', true);

      // [部件 6] 斜握立体「星火魔法木扫帚」（扫帚尾拖曳星尘、前端聚能火球！）
      const swing = pose.armAction >= 0.6 ? 5 : pose.armAction <= -0.5 ? -3 : 0;
      p.line(bx - 13, 37 + by, bx + 12 + swing, 26 + by - Math.round(pose.armAction * 3), '#7a4722', 3);
      p.line(bx - 12, 36 + by, bx + 12 + swing, 25 + by - Math.round(pose.armAction * 3), '#c47e42', 1);
      // 立体金色麦穗扫帚尾 + 红绑带 + 星屑
      p.poly([[bx - 11, 34 + by], [bx - 19, 33 + by], [bx - 18, 42 + by], [bx - 9, 39 + by]], '#c9882b');
      p.poly([[bx - 11, 35 + by], [bx - 17, 35 + by], [bx - 16, 40 + by], [bx - 10, 38 + by]], '#ffe066');
      p.line(bx - 10, 34 + by, bx - 9, 39 + by, '#d9324b', 2);
      p.px(bx - 21, 36 + by + sway, '#ffe878', true);
      p.px(bx - 19, 43 + by - sway, '#ff8533', true);
      // 扫帚前端凝聚炽橙星火魔弹！
      const tipX = bx + 13 + swing;
      const tipY = 25 + by - Math.round(pose.armAction * 3);
      p.ellipse(tipX, tipY, 3.2, 3.2, '#ff6b2b', true);
      p.ellipse(tipX, tipY, 1.8, 1.8, '#fff7cc', true);
      if (pose.slashAlpha > 0.3) {
        p.line(tipX + 2, tipY, tipX + 9, tipY - 3, '#ffe875', 2, true);
        p.line(tipX + 2, tipY, tipX + 9, tipY + 3, '#ff6b2b', 2, true);
      }
    },
  },

  /** 混沌 T2-A：武装人形（精雕东方蓬莱人偶骑士 · 柔顺分缕金卷长发 + 绯红丝绒飘带结 + 多层蓝白蕾丝骑士裙 + 雕金红宝鸢盾与骑士刺剑突刺！） */
  creature_hourai_doll: {
    backdropTop: '#101833',
    backdropBottom: '#261e40',
    backdropGlow: '#82c4ff',
    avatarCrop: { x: 10, y: 5, size: 28 },
    portraitCrop: { x: 3, y: 3, w: 42, h: 47 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      // 突刺动作略左收基点，让长枪星芒冲击波完整呈现在画布内零裁切
      const bx = isAtk && (f === 1 || f === 2)
        ? 21
        : isAtk && f === 0
          ? 20
          : Math.round(23 + pose.leanX * 0.75);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.2);
      const stride = Math.round(pose.stride * 2.8);

      // [部件 1] 背后精致旋转的「黄铜魔导发条钥」（低调点明自律人偶构造体设定！）+ 柔顺分层后垂金发
      const keyAngle = pose.phase * Math.PI;
      const keyScale = Math.round(Math.cos(keyAngle) * 2);
      p.hline(bx - 10, 29 + by, 5, '#b88628');
      p.ellipse(bx - 12, 29 + by, 2.4, Math.max(1.2, Math.abs(keyScale) + 1.4), '#f2c85b');
      p.px(bx - 12, 29 + by, '#261e40'); // 发条环镂空孔

      // 优雅垂落的分缕奶油金长发（修身贴背微卷，彻底告别膨胀香蕉大圆坨！）
      const hSway = isAtk && f === 1 ? -3 : sway;
      // 左侧垂卷发缕
      p.poly([
        [bx - 6, 17 + by],
        [bx - 9 + hSway, 24 + by],
        [bx - 11 + hSway, 33 + by],
        [bx - 7 + hSway, 35 + by],
        [bx - 5, 26 + by],
      ], '#b57b1b');
      p.poly([
        [bx - 6, 18 + by],
        [bx - 8 + hSway, 24 + by],
        [bx - 9 + hSway, 32 + by],
        [bx - 7 + hSway, 33 + by],
        [bx - 5, 25 + by],
      ], '#f0bf42');
      p.vline(bx - 8 + hSway, 22 + by, 7, '#fff29c');
      // 右后侧隐约可见发尾卷翘
      p.poly([
        [bx + 5, 17 + by],
        [bx + 8 - hSway, 24 + by],
        [bx + 9 - hSway, 31 + by],
        [bx + 6 - hSway, 32 + by],
        [bx + 4, 24 + by],
      ], '#c98e24');
      p.vline(bx + 7 - hSway, 21 + by, 8, '#f7d25e');

      // [部件 2] 洁白蕾丝长筒袜与深蓝金扣玛丽珍鞋
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      const lx = bx - 4 - stride;
      const rx = bx + 2 + stride;
      p.rect(lx, 42 + lLift, 3, 5, '#e8eefc');
      p.vline(lx + 1, 42 + lLift, 4, '#ffffff');
      p.rect(lx - 1, 47 + lLift, 4, 2, '#1f3980');
      p.px(lx + 1, 47 + lLift, '#ffe073');
      p.rect(rx, 42 + rLift, 3, 5, '#f5f8ff');
      p.vline(rx + 1, 42 + rLift, 4, '#ffffff');
      p.rect(rx, 47 + rLift, 4, 2, '#2e52b3');
      p.px(rx + 2, 47 + rLift, '#ffe073');

      // [部件 3] 华丽多层哥特蓝白洛丽塔骑士裙（深蓝褶皱 + 纯白十字围裙 + 逐像素锯齿蕾丝花边！）
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      // 外层皇家蓝蓬蓬裙
      p.poly([
        [bx - 5, 32 + by],
        [bx + 5, 32 + by],
        [bx + 11 + sk, 43 + by],
        [bx - 10 + sk, 43 + by],
      ], '#1c357d');
      p.poly([
        [bx - 4, 32 + by],
        [bx + 4, 32 + by],
        [bx + 9 + sk, 42 + by],
        [bx - 8 + sk, 42 + by],
      ], '#3664cf');
      // 立体裙褶光影
      p.vline(bx - 5, 34 + by, 7, '#24459c');
      p.vline(bx + 5, 34 + by, 7, '#24459c');
      p.vline(bx - 3, 33 + by, 8, '#6ca0ff');
      p.vline(bx + 3, 33 + by, 8, '#6ca0ff');
      // 洁白前片围裙 + 金丝底边
      p.poly([
        [bx - 3, 32 + by],
        [bx + 3, 32 + by],
        [bx + 5 + sk, 41 + by],
        [bx - 4 + sk, 41 + by],
      ], '#f5f8ff');
      p.rect(bx - 2, 33 + by, 4, 7, '#ffffff');
      p.hline(bx - 4 + sk, 41 + by, 9, '#d6e4ff');
      // 逐像素精致波浪白蕾丝裙摆
      for (let x = bx - 10 + sk; x <= bx + 10 + sk; x++) {
        const isPeak = (x - bx) % 2 === 0;
        p.px(x, 43 + by, '#ffffff');
        if (isPeak) p.px(x, 44 + by, '#d9ebff');
      }

      // 收腰上身紧身衣 + 洁白蕾丝胸衬 + 泡泡袖 + 鲜红丝绒蝴蝶结领结
      p.rect(bx - 4, 25 + by, 9, 7, '#294eb0');
      p.rect(bx - 2, 26 + by, 5, 6, '#ffffff');
      p.hline(bx - 5, 32 + by, 10, '#f0c452'); // 鎏金腰带
      p.px(bx, 32 + by, '#e63250');
      // 精致白蓝双层泡泡袖
      p.ellipse(bx - 5, 27 + by, 2.2, 2.2, '#ffffff');
      p.hline(bx - 7, 28 + by, 3, '#4d7de6');
      p.ellipse(bx + 5, 27 + by, 2.2, 2.2, '#ffffff');
      p.hline(bx + 4, 28 + by, 3, '#4d7de6');
      // 绯红胸结与两条细红飘带
      p.rect(bx - 2, 26 + by, 5, 2, '#d92647');
      p.px(bx, 27 + by, '#ff738a');
      p.px(bx - 1, 28 + by, '#b81a38');
      p.px(bx + 1, 28 + by, '#e63250');

      // [部件 4] 瓷娃娃精致头部 + 蔚蓝星瞳 + 柔顺奶油金发冠 + 立体绯红丝绒蝴蝶结发带！
      const headY = 18 + by;
      drawAnimeHeadBase(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#1c52c9', '#8ce8ff', pose);
      drawSoftHairCrown(p, bx, headY, '#bf851d', '#f0c040', '#ffea85', '#ffffff');
      // 轻柔贴颊金发小卷鬓
      p.poly([[bx - 6, headY - 2], [bx - 4, headY - 2], [bx - 5, headY + 6], [bx - 7, headY + 5]], '#e0ac34');
      p.vline(bx - 5, headY, 4, '#fff29c');
      p.poly([[bx + 4, headY - 2], [bx + 6, headY - 2], [bx + 7, headY + 5], [bx + 5, headY + 6]], '#e0ac34');
      p.vline(bx + 5, headY, 4, '#fff29c');
      // 优雅立体绯红丝绒蝴蝶结（精致双耳褶皱 + 侧垂飘带，彻底替代红扁船！）
      p.hline(bx - 5, headY - 6, 10, '#c72240'); // 发箍底带
      // 左结耳
      p.poly([[bx - 6, headY - 10], [bx - 1, headY - 7], [bx - 2, headY - 5], [bx - 7, headY - 7]], '#b81c3a');
      p.poly([[bx - 5, headY - 9], [bx - 2, headY - 7], [bx - 5, headY - 6]], '#f24968');
      p.px(bx - 4, headY - 8, '#ff9eb0');
      // 右结耳
      p.poly([[bx + 6, headY - 10], [bx + 1, headY - 7], [bx + 2, headY - 5], [bx + 7, headY - 7]], '#cf2544');
      p.poly([[bx + 5, headY - 9], [bx + 2, headY - 7], [bx + 5, headY - 6]], '#ff5c7a');
      p.px(bx + 4, headY - 8, '#ffb3c1');
      // 中心立体蝴蝶结扣与垂尾
      p.rect(bx - 1, headY - 8, 3, 3, '#e62e4f');
      p.px(bx, headY - 7, '#ff94a8');
      p.line(bx - 6, headY - 6, bx - 9 + hSway, headY - 2, '#c72240', 1);

      // [部件 5] 右手「银白金雕骑士刺剑/细长枪」（4 帧灵巧突刺 + 星芒冲击波！）
      if (isAtk && f === 0) {
        // 蓄力帧 0：压肩拉枪后收，枪尖聚起青白星芒
        p.rect(bx + 4, 29 + by, 2, 2, '#ffe4cf');
        p.rect(bx + 2, 28 + by, 3, 3, '#f2c85b'); // 雕金护手篮
        p.line(bx + 4, 29 + by, bx + 15, 25 + by, '#a8d4ff', 2, true);
        p.line(bx + 5, 28 + by, bx + 15, 25 + by, '#ffffff', 1, true);
        p.px(bx + 16, 24 + by, '#ffffff', true);
        p.px(bx + 15, 23 + by, '#78d4ff', true);
        p.px(bx + 15, 26 + by, '#78d4ff', true);
      } else if (isAtk && f === 1) {
        // 突刺帧 1：骑士刺剑全力水平前突 + 流畅弧形破风气浪与锐利星芒锥（严格收于 x<=45 零裁切！）
        p.line(bx + 5, 28 + by, bx + 10, 28 + by, '#ffffff', 2);
        p.rect(bx + 9, 27 + by, 2, 2, '#ffe4cf');
        p.rect(bx + 10, 26 + by, 3, 4, '#ffe066');
        p.line(bx + 12, 28 + by, bx + 23, 28 + by, '#8cd6ff', 2, true);
        p.hline(bx + 13, 28 + by, 11, '#ffffff', true);
        // 破风弯弧气浪 + 银蓝锐芒刺尖
        p.line(bx + 14, 23 + by, bx + 17, 26 + by, '#9ce6ff', 1, true);
        p.line(bx + 17, 26 + by, bx + 17, 30 + by, '#ffffff', 1, true);
        p.line(bx + 17, 30 + by, bx + 14, 33 + by, '#9ce6ff', 1, true);
        p.poly([[bx + 17, 26 + by], [bx + 24, 28 + by], [bx + 17, 30 + by]], '#66c2ff', true);
        p.hline(bx + 18, 28 + by, 6, '#ffffff', true);
        p.px(bx + 22, 24 + by, '#ffe885', true);
        p.px(bx + 22, 32 + by, '#ffe885', true);
      } else if (isAtk && f === 2) {
        // 突刺帧 2：上挑收枪 + 弧形星尘残影
        p.rect(bx + 8, 27 + by, 2, 2, '#ffe4cf');
        p.rect(bx + 9, 26 + by, 3, 3, '#f2c85b');
        p.line(bx + 11, 27 + by, bx + 21, 21 + by, '#b8e2ff', 2, true);
        p.line(bx + 12, 26 + by, bx + 21, 21 + by, '#ffffff', 1, true);
        p.px(bx + 22, 24 + by, '#8cd6ff', true);
        p.px(bx + 20, 29 + by, '#ffe478', true);
      } else {
        // 待机 / 行走 / 受击：优雅斜提骑士刺剑（精细雕金篮状护手 + 绯红剑穗）
        const handX = bx + 7;
        const handY = 30 + by - Math.round(pose.armAction * 2);
        p.rect(handX - 1, handY - 1, 2, 2, '#ffe4cf');
        p.rect(handX, handY - 1, 3, 3, '#f2c85b');
        p.px(handX, handY + 2, '#e63250'); // 小红缨穗
        p.line(handX + 2, handY, handX + 13, handY - 7, '#8fb8eb', 2);
        p.line(handX + 2, handY - 1, handX + 14, handY - 8, '#ffffff', 1, true);
        if (pose.frame % 3 === 1) {
          p.px(handX + 14, handY - 8, '#9ce8ff', true);
        }
      }

      // [部件 6] 左手精雕「白银镶金蓝星鸢盾」（受击瞬间高举身前绽放绝对格挡青白结界！）
      const shX = isHit ? bx + 2 : isAtk && f === 0 ? bx - 5 : bx - 8;
      const shY = isHit ? 29 + by : 32 + by - Math.round(pose.armAction * 1.5);
      // 鎏金外框盾体（尖底骑士鸢盾轮廓）
      p.poly([
        [shX - 4, shY - 4],
        [shX + 4, shY - 4],
        [shX + 4, shY + 2],
        [shX, shY + 7],
        [shX - 4, shY + 2],
      ], '#c9962e');
      p.hline(shX - 4, shY - 4, 8, '#ffe885');
      // 宝石蓝盾面与银白十字辉纹
      p.poly([
        [shX - 3, shY - 3],
        [shX + 3, shY - 3],
        [shX + 3, shY + 1],
        [shX, shY + 5],
        [shX - 3, shY + 1],
      ], '#2659bf');
      p.vline(shX, shY - 2, 6, '#9ce0ff', true);
      p.hline(shX - 2, shY, 5, '#9ce0ff', true);
      p.px(shX, shY, '#ff4d6d', true); // 盾心红宝石
      p.px(shX - 1, shY - 1, '#ffffff', true);

      // 受击格挡态：鸢盾前方绽放连续晶莹青白能量弧盾（呼应「绝对格挡」！）
      if (isHit) {
        const segs = 8;
        for (let i = 0; i < segs; i++) {
          const a0 = -1.05 + (i / segs) * 2.1;
          const a1 = -1.05 + ((i + 1) / segs) * 2.1;
          const x0 = Math.round(shX + 3 + Math.cos(a0) * 8);
          const y0 = Math.round(shY + Math.sin(a0) * 9);
          const x1 = Math.round(shX + 3 + Math.cos(a1) * 8);
          const y1 = Math.round(shY + Math.sin(a1) * 9);
          p.line(x0, y0, x1, y1, i >= 2 && i <= 5 ? '#ffffff' : '#6ee4ff', i >= 2 && i <= 5 ? 2 : 1, true);
        }
      }
    },
  },

  /** 混沌 T3-A：梦境兽（2×1 东方梦境世界星梦喰梦兽 · 浮空纯金新月冠 + 环绕红白梦魂玉 + 星云梦雾长鬃尾 + 幻梦震慑波） */
  creature_nightmare: {
    backdropTop: '#0d0a26',
    backdropBottom: '#29174d',
    backdropGlow: '#ff70b8',
    avatarCrop: { x: 14, y: 4, size: 28 },
    portraitCrop: { x: 1, y: 2, w: 46, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAttack = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      const fl = Math.round(pose.flutter * 2.0);
      const orbitBase = pose.phase * Math.PI * 2;

      // 定制梦境兽四态星梦游弋/跃扑/梦魇波骨骼参数
      let hipX = 14;
      let hipY = 34;
      let chestX = 24;
      let chestY = 29;
      let headX = 28;
      let headY = 17;
      let farHind: [number, number] = [9, 45];
      let nearHind: [number, number] = [14, 46];
      let farFore: [number, number] = [27, 45];
      let nearForeKnee: [number, number] = [29, 36];
      let nearFore: [number, number] = [32, 42]; // 优雅微屈膝踏梦云
      let waveStage: 0 | 1 | 2 = 0;
      let eyeFlare = false;

      if (isAttack) {
        if (f === 0) {
          // 帧 0：昂首踏云蓄梦，新月冠与梦魂玉向内聚能！
          hipX = 14; hipY = 36; chestX = 20; chestY = 26; headX = 23; headY = 14;
          farHind = [9, 46]; nearHind = [14, 47];
          farFore = [28, 35]; nearForeKnee = [27, 30]; nearFore = [33, 28];
          eyeFlare = true;
        } else if (f === 1) {
          // 帧 1：凌空前冲释放幻梦震慑波！面部留出净空，前方绽放猩紫梦魇弧波与疾射梦魂玉！
          hipX = 11; hipY = 33; chestX = 21; chestY = 28; headX = 25; headY = 17;
          farHind = [5, 44]; nearHind = [10, 46];
          farFore = [29, 37]; nearForeKnee = [28, 32]; nearFore = [34, 33];
          waveStage = 1;
          eyeFlare = true;
        } else if (f === 2) {
          // 帧 2：梦魇弧波前涌扩散成漫天梦星！
          hipX = 13; hipY = 34; chestX = 23; chestY = 29; headX = 27; headY = 18;
          farHind = [7, 45]; nearHind = [12, 46];
          farFore = [29, 40]; nearForeKnee = [29, 35]; nearFore = [34, 38];
          waveStage = 2;
          eyeFlare = true;
        } else {
          hipX = 14; hipY = 35; chestX = 24; chestY = 30; headX = 28; headY = 18;
          farHind = [9, 45]; nearHind = [14, 46];
          farFore = [28, 45]; nearForeKnee = [29, 37]; nearFore = [32, 44];
        }
      } else if (isMove) {
        if (f === 0) {
          hipX = 12; hipY = 33; chestX = 23; chestY = 28; headX = 29; headY = 17;
          farHind = [6, 45]; nearHind = [10, 46]; farFore = [31, 43]; nearForeKnee = [30, 35]; nearFore = [35, 41];
        } else if (f === 1) {
          hipX = 14; hipY = 30; chestX = 24; chestY = 25; headX = 29; headY = 14;
          farHind = [9, 40]; nearHind = [13, 41]; farFore = [29, 38]; nearForeKnee = [30, 31]; nearFore = [34, 36];
        } else if (f === 2) {
          hipX = 16; hipY = 34; chestX = 25; chestY = 29; headX = 30; headY = 18;
          farHind = [12, 45]; nearHind = [16, 46]; farFore = [27, 45]; nearForeKnee = [29, 37]; nearFore = [31, 44];
        } else {
          hipX = 13; hipY = 32; chestX = 23; chestY = 27; headX = 29; headY = 16;
          farHind = [7, 43]; nearHind = [11, 44]; farFore = [32, 40]; nearForeKnee = [30, 33]; nearFore = [35, 38];
        }
      } else if (isHit) {
        const back = f === 0 ? -3 : -1;
        hipX = 13 + back; hipY = 36; chestX = 21 + back; chestY = 32; headX = 25 + back; headY = 21;
        farHind = [8 + back, 46]; nearHind = [12 + back, 47];
        farFore = [26 + back, 45]; nearForeKnee = [26 + back, 38]; nearFore = [29 + back, 43];
      } else {
        const by = Math.round(pose.breathY * 1.2);
        hipY = 34 + by;
        chestY = 29 + by;
        headY = 17 + by;
        nearForeKnee = [29, 36 + by];
        nearFore = [32, 41 + by];
      }

      // 辅助：绘制东方标志性琉璃「梦魂玉」（红粉/星蓝/金白三色漂浮球）
      const drawDreamOrb = (ox: number, oy: number, variant: number) => {
        const outer = variant === 0 ? '#ff3b78' : variant === 1 ? '#7d5cff' : '#ff99cc';
        const inner = variant === 0 ? '#ffb3cc' : variant === 1 ? '#d9ccff' : '#fff5c2';
        p.ellipse(ox, oy, 2.4, 2.4, outer, true);
        p.ellipse(ox, oy, 1.3, 1.3, inner, true);
        p.px(ox - 1, oy - 1, '#ffffff', true);
      };

      // [部件 1] 后景环绕梦魂玉（3 枚立体椭圆轨道后半段）
      const orbRadius = isAttack && f === 0 ? 11 : 15;
      for (let i = 0; i < 3; i++) {
        const a = orbitBase + (i * Math.PI * 2) / 3;
        if (Math.sin(a) < 0) {
          const ox = Math.round(chestX - 2 + Math.cos(a) * orbRadius);
          const oy = Math.round(chestY - 2 + Math.sin(a) * 6 - Math.cos(a) * 2.5);
          drawDreamOrb(ox, oy, i);
        }
      }

      // [部件 2] 飘逸舒展的星云梦雾大尾（暗夜蓝 → 柔薰衣草紫 → 幻梦粉云团与星尘！）
      const tx = Math.max(4, hipX - 10);
      const ty = Math.max(15, hipY - 9 + fl);
      p.line(hipX - 4, hipY, tx + 3, ty + 4, '#4b2c8c', 4);
      p.ellipse(tx + 2, ty + 2, 4.2, 3.6, '#6e3db8', true);
      p.ellipse(tx + 1, ty - 1, 3.2, 2.8, '#c98aff', true);
      p.ellipse(tx + 4, ty - 2, 2.2, 2.0, '#ff80c4', true);
      p.px(tx + 1, ty - 2, '#ffffff', true);
      p.px(Math.max(3, tx - 2), ty + 4, '#ffe699', true);

      // [部件 3] 远侧修长星夜腿部 + 浮云梦蹄
      p.line(hipX - 2, hipY + 3, farHind[0], farHind[1], '#24194d', 3);
      p.ellipse(farHind[0], farHind[1] + 1, 2.5, 1.6, '#9c82ff', true);
      p.line(chestX + 1, chestY + 2, farFore[0], farFore[1], '#2b1e5c', 3);
      p.ellipse(farFore[0], farFore[1] + 1, 2.5, 1.6, '#b89eff', true);

      // [部件 4] 优雅流线星夜梦境兽躯体（深靛夜空蓝 + 珍珠银月白胸腹 + 璀璨星点！）
      p.line(hipX, hipY, chestX, chestY, '#2b2063', 10);
      p.ellipse(hipX, hipY, 6.2, 5.2, '#2b2063');
      p.ellipse(hipX + 1, hipY - 1, 4.8, 3.8, '#4e3da3');
      p.ellipse(chestX, chestY, 6.8, 6.0, '#372978');
      p.ellipse(chestX + 1, chestY - 1, 5.2, 4.6, '#624ec4');
      p.ellipse(chestX + 2, chestY + 2, 4.2, 3.4, '#e6dfff');
      p.hline(chestX, chestY + 1, 4, '#ffffff');
      p.px(hipX - 1, hipY - 1, '#ff9ee0', true);
      p.px(hipX + 2, hipY - 2, '#ffe899', true);
      p.px(chestX - 2, chestY - 2, '#9ce8ff', true);

      // 颈间绯粉梦境缎带与星辰吊坠
      p.line(chestX - 4, chestY - 4, chestX + 5, chestY + 1, '#c7266b', 3);
      p.line(chestX - 3, chestY - 4, chestX + 4, chestY, '#ff73b3', 1);
      p.ellipse(chestX + 4, chestY + 2, 2.2, 2.2, '#ffe478', true);
      p.px(chestX + 4, chestY + 2, '#ffffff', true);

      // [部件 5] 近侧优雅屈膝兽肢 + 银白月环 + 踏梦星云光蹄
      p.ellipse(hipX, hipY + 3, 4.2, 4.4, '#473694');
      p.line(hipX, hipY + 5, nearHind[0], nearHind[1] - 1, '#5e4ab8', 3);
      p.hline(nearHind[0] - 1, nearHind[1] - 2, 3, '#f0e8ff');
      p.ellipse(nearHind[0] + 1, nearHind[1] + 1, 2.8, 1.8, '#c79eff', true);
      p.px(nearHind[0] + 1, nearHind[1], '#ffffff', true);

      // 近侧前腿带优美关节屈膝折角
      p.line(chestX + 2, chestY + 2, nearForeKnee[0], nearForeKnee[1], '#6854c9', 3);
      p.line(nearForeKnee[0], nearForeKnee[1], nearFore[0], nearFore[1] - 1, '#7c68db', 3);
      p.line(chestX + 3, chestY + 2, nearForeKnee[0], nearForeKnee[1] - 1, '#b3a3ff', 1);
      p.hline(nearFore[0] - 1, nearFore[1] - 2, 3, '#fff0ff');
      p.ellipse(nearFore[0] + 1, nearFore[1] + 1, 3.0, 2.0, '#ff6bb8', true);
      p.px(nearFore[0] + 1, nearFore[1], '#fff7cc', true);

      // [部件 6] 飘渺梦雾颈鬃 + 优雅喰梦兽头颅 + 镂空浮空纯金新月冠 + 猩红幻梦灵瞳！
      const hx = headX;
      const hy = headY;
      p.poly([
        [chestX - 6, chestY - 2],
        [hx - 9, hy + 1 + Math.round(fl * 0.5)],
        [hx - 6, hy - 5 + Math.round(fl * 0.4)],
        [hx + 1, hy - 4],
        [chestX + 1, chestY - 2],
      ], '#6e3db8');
      p.poly([
        [chestX - 3, chestY - 3],
        [hx - 7, hy + Math.round(fl * 0.5)],
        [hx - 4, hy - 4 + Math.round(fl * 0.3)],
        [hx, hy - 2],
      ], '#e880ff', true);
      p.px(hx - 6, hy - 2, '#fff0ff', true);

      // 高挑优美的灵兽长耳（柔紫绒尖，受击后折）
      const earDrop = isHit ? 3 : 0;
      p.poly([[hx - 4, hy - 3], [hx - 8, hy - 10 + earDrop], [hx - 1, hy - 5]], '#4a3699');
      p.px(hx - 6, hy - 7 + earDrop, '#ff99d6', true);
      p.poly([[hx + 1, hy - 4], [hx + 3, hy - 11 + earDrop], [hx + 5, hy - 4]], '#6a54cc');
      p.px(hx + 3, hy - 8 + earDrop, '#ff99d6', true);

      // 纯透明镂空精雕「浮空黄金新月冠」（绝无黑圆底块！）
      const my = hy - 9 + Math.round(Math.sin(orbitBase) * 0.8);
      const mx = hx - 1;
      p.px(mx + 1, my - 3, '#ffe478', true);
      p.px(mx - 1, my - 2, '#fff7cc', true);
      p.px(mx, my - 2, '#ffe478', true);
      p.rect(mx - 2, my - 1, 2, 3, '#ffe478', true);
      p.px(mx - 2, my, '#ffffff', true);
      p.px(mx - 1, my + 2, '#f5be41', true);
      p.px(mx, my + 2, '#ffe478', true);
      p.px(mx + 1, my + 2, '#fff7cc', true);

      // 修长精致珍珠白梦面具与灵兽吻部
      p.ellipse(hx + 1, hy, 6.2, 5.2, '#43328f');
      p.ellipse(hx + 2, hy - 0.5, 5.0, 4.2, '#dfd8ff');
      p.ellipse(hx + 6, hy + 1.5, 4.2, 2.8, '#ffffff');
      p.px(hx + 9, hy + 1, '#52347a');
      p.px(hx + 2, hy - 3, '#ff4d94', true);
      p.px(hx + 3, hy - 3, '#ffe478', true);

      // 标志性猩红金瞳
      if (pose.expr === 'hurt') {
        p.hline(hx + 2, hy, 3, '#261442');
      } else if (pose.blink) {
        p.hline(hx + 2, hy, 3, '#6347a6');
      } else {
        p.rect(hx + 2, hy - 1, 3, 2, eyeFlare ? '#ff1f66' : '#e62e6b', true);
        p.px(hx + 2, hy - 1, '#fff7b8', true);
        p.px(hx + 4, hy, '#ff99cc', true);
      }

      // [部件 7] 前景环绕梦魂玉（3 枚立体椭圆轨道前半段）
      for (let i = 0; i < 3; i++) {
        const a = orbitBase + (i * Math.PI * 2) / 3;
        if (Math.sin(a) >= 0) {
          const ox = Math.round(chestX - 2 + Math.cos(a) * orbRadius);
          const oy = Math.round(chestY - 2 + Math.sin(a) * 6 - Math.cos(a) * 2.5);
          drawDreamOrb(ox, oy, i);
        }
      }

      // [部件 8] 攻击帧净空圆弧梦魇震慑涟漪与疾射梦魂玉（x = 37..46，顺滑圆弧绝不遮脸！）
      if (waveStage === 1) {
        for (let k = -5; k <= 5; k++) {
          const arcX = Math.round(41 - (k * k) * 0.12);
          p.px(arcX, 22 + k, Math.abs(k) <= 2 ? '#fff2b8' : '#ff4599', true);
          p.px(arcX - 1, 22 + k, '#ff4599', true);
        }
        for (let k = -7; k <= 7; k++) {
          const arcX = Math.round(45 - (k * k) * 0.09);
          p.px(arcX, 22 + k, k % 2 === 0 ? '#c978ff' : '#ff99dd', true);
        }
        drawDreamOrb(42, 22, 0);
      } else if (waveStage === 2) {
        for (let k = -7; k <= 7; k++) {
          const arcX = Math.round(45 - (k * k) * 0.1);
          p.px(arcX, 22 + k, Math.abs(k) <= 2 ? '#ffe878' : '#c978ff', true);
        }
        p.px(43, 17, '#ffffff', true);
        p.px(44, 27, '#ff80c4', true);
      }
    },
  },
};

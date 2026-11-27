/**
 * 博丽神社 · 生命系低阶（T1-T2）精雕 48×54 像素立绘与骨骼动画像素绘谱
 * 包含：御札符箭使、镇守狛犬、阴阳玉浮游炮
 */

import {
  drawChibiFaceEyes,
  type PixelPainter,
  type RigPose,
  type SpriteRigSpec,
} from '../../voxelSprites';
import { drawAnimeHeadBase, drawSoftHairCrown } from './sharedHelpers';

export const LIFE_LOW_RIG_SPECS: Record<string, SpriteRigSpec> = {
  /** 生命 T1-B：御札符箭使（翠风林间羽弓手 · 湖青披肩与羽帽 + 亚麻金编发 + 灵木长弓翠金箭，彻底去灵梦换皮！） */
  creature_ofuda_archer: {
    backdropTop: '#0d1e24',
    backdropBottom: '#16332f',
    backdropGlow: '#5ce8c4',
    avatarCrop: { x: 8, y: 5, size: 28 },
    portraitCrop: { x: 2, y: 3, w: 44, h: 46 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(21 + pose.leanX * 0.9);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const stride = Math.round(pose.stride * 3.8);

      // [部件 1] 背后斜背的皮革箭筒（插满翠羽金矢）+ 飘扬翠绿游侠短披风
      p.poly([
        [bx - 5, 23 + by],
        [bx - 14 + sway, 32 + by],
        [bx - 12 + sway, 39 + by],
        [bx - 4, 34 + by],
      ], '#125247');
      p.poly([
        [bx - 5, 24 + by],
        [bx - 12 + sway, 32 + by],
        [bx - 9 + sway, 37 + by],
        [bx - 4, 33 + by],
      ], '#228775');
      p.hline(bx - 12 + sway, 38 + by, 8, '#f0c459');
      // 皮革箭筒与翠羽箭尾
      p.line(bx - 8, 22 + by, bx - 4, 33 + by, '#6e4226', 3);
      p.line(bx - 7, 22 + by, bx - 4, 31 + by, '#a86c3e', 1);
      p.px(bx - 9, 19 + by, '#7ff5c8', true);
      p.px(bx - 7, 18 + by, '#fff2b0', true);
      p.px(bx - 6, 20 + by, '#5ce8c4', true);

      // [部件 2] 轻捷棕色皮质游侠长靴迈步
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(bx - 4 - stride, 41 + lLift, 3, 7, '#5c3720');
      p.hline(bx - 4 - stride, 42 + lLift, 3, '#c99352');
      p.rect(bx + 2 + stride, 41 + rLift, 3, 7, '#7d4c2c');
      p.hline(bx + 2 + stride, 42 + rLift, 3, '#e6b86e');

      // [部件 3] 湖青翠绿褶裙 + 米白束腰游侠上衣 + 棕色皮带金扣（全新山林守护配色！）
      const sk = Math.round(-pose.leanX * 0.5 + sway * 0.6);
      p.poly([[bx - 5, 33 + by], [bx + 5, 33 + by], [bx + 9 + sk, 42 + by], [bx - 9 + sk, 42 + by]], '#135449');
      p.poly([[bx - 3, 33 + by], [bx + 3, 33 + by], [bx + 6 + sk, 41 + by], [bx - 6 + sk, 41 + by]], '#289c86');
      p.vline(bx - 2, 34 + by, 7, '#5ce8c4');
      p.hline(bx - 8 + sk, 41 + by, 16, '#f2cc66');
      // 米白束身猎装 + 翠绿肩领披肩 + 棕色皮质斜挎带
      p.poly([[bx - 5, 25 + by], [bx + 5, 25 + by], [bx + 5, 33 + by], [bx - 5, 33 + by]], '#f5eedc');
      p.rect(bx - 4, 26 + by, 4, 6, '#fffaf0');
      p.poly([[bx - 6, 25 + by], [bx + 6, 25 + by], [bx + 5, 29 + by], [bx - 5, 29 + by]], '#1e7a69');
      p.hline(bx - 5, 29 + by, 10, '#ffe073');
      p.line(bx - 4, 26 + by, bx + 4, 33 + by, '#7a4826', 1);
      p.hline(bx - 5, 33 + by, 10, '#693d20');
      p.rect(bx - 1, 33 + by, 2, 2, '#ffe073');

      // [部件 4] 灵气游侠少女脸庞 + 亚麻金短波浪发 + 俏皮侧斜羽饰翠绿猎帽！
      const headY = 18 + by;
      drawAnimeHeadBase(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#14735a', '#7ff5c8', pose);
      // 俏皮暖亚麻金短发与侧垂小麻花辫
      drawSoftHairCrown(p, bx, headY, '#947342', '#cfa963', '#f2d591', '#fff4c7');
      p.rect(bx - 6, headY - 2, 2, 9, '#b58d4e');
      p.px(bx - 5, headY + 2, '#f2d591');
      p.rect(bx + 5, headY - 2, 2, 6, '#b58d4e');
      // 标志性斜戴翠绿灵羽游侠小帽（一秒区分于任何巫女！）
      p.poly([[bx - 7, headY - 4], [bx + 6, headY - 5], [bx + 3, headY - 10], [bx - 6, headY - 8]], '#166355');
      p.poly([[bx - 5, headY - 5], [bx + 4, headY - 5], [bx + 2, headY - 9], [bx - 4, headY - 8]], '#2eab92');
      p.hline(bx - 6, headY - 5, 12, '#f2c85b');
      // 飘逸雪白金尖灵羽插在帽侧！
      p.line(bx - 5, headY - 7, bx - 12 + sway, headY - 12, '#ffffff', 2, true);
      p.px(bx - 12 + sway, headY - 12, '#7ff5c8', true);

      // [部件 5] 优雅修长「神木金纹大弓」+ 璀璨翠金灵箭（清晰负空间剪影！）
      const pull = pose.armAction <= -0.5 ? -3 : pose.armAction >= 0.7 ? 2 : 0;
      const bowX = bx + 14 + Math.max(0, pull);
      p.line(bx - 2, 28 + by, bx + 6 + pull, 28 + by, '#f5eedc', 2);
      p.rect(bx + 5 + pull, 27 + by, 2, 2, '#ffe4cf');
      p.line(bx + 4, 28 + by, bowX - 1, 28 + by, '#228775', 2);
      p.rect(bowX - 1, 27 + by, 2, 2, '#ffe4cf');
      // 雕花金木长弓
      p.line(bowX - 4, 14 + by, bowX + 1, 21 + by, '#9c6228', 2);
      p.line(bowX + 1, 21 + by, bowX + 1, 35 + by, '#e8b84d', 2);
      p.line(bowX + 1, 35 + by, bowX - 4, 42 + by, '#9c6228', 2);
      p.px(bowX - 4, 14 + by, '#80ffdb', true);
      p.px(bowX - 4, 42 + by, '#80ffdb', true);
      p.line(bowX - 4, 15 + by, bx + 6 + pull, 28 + by, '#e8f5f0', 1);
      p.line(bowX - 4, 41 + by, bx + 6 + pull, 28 + by, '#e8f5f0', 1);
      // 翠金破魔符箭
      p.line(bx + 6 + pull, 28 + by, bowX + 6, 28 + by, '#ffe885', 1, true);
      p.poly([[bowX + 5, 26 + by], [bowX + 10, 28 + by], [bowX + 5, 30 + by]], '#45f0c2', true);
      p.px(bowX + 7, 28 + by, '#ffffff', true);
      if (pose.slashAlpha > 0.3) {
        p.line(bowX + 9, 28 + by, Math.min(46, bowX + 15), 28 + by, '#b8ffee', 2, true);
        p.px(bowX + 11, 25 + by, '#ffe878', true);
        p.px(bowX + 11, 31 + by, '#ffe878', true);
      }
    },
  },

  /** 生命 T2-A：镇守狛犬（2×2 神社石狮神兽 · 抬腿人立蓄力 → 凶猛飞扑裂空爪击 · 注连绳大金铃纸垂 · 卷云浓金狮鬃与翡翠神焰尾） */
  creature_komainu: {
    backdropTop: '#101a28',
    backdropBottom: '#26212c',
    backdropGlow: '#6bf0c6',
    avatarCrop: { x: 14, y: 6, size: 28 },
    portraitCrop: { x: 2, y: 5, w: 44, h: 46 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const wave = Math.round(pose.flutter * 1.6);
      const isAttack = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const isHit = pose.state === 'hit';
      const f = pose.frame;

      // 四态四足神兽骨骼姿态参数（完全移除长矛，专注高抬前腿人立蓄力 → 凶猛飞扑挥爪！）
      let hipX = 14;
      let hipY = 36;
      let chestX = 24;
      let chestY = 30;
      let headX = 28;
      let headY = 19;
      let farHindPaw: [number, number] = [9, 46];
      let nearHindPaw: [number, number] = [13, 47];
      let farForeElbow: [number, number] = [26, 38];
      let farForePaw: [number, number] = [28, 46];
      let nearForeElbow: [number, number] = [28, 39];
      let nearForePaw: [number, number] = [32, 47];
      let tailSway = 0;
      let roarOpen = false;
      let clawGlow = false;
      let slashStage: 0 | 1 | 2 = 0;

      if (isAttack) {
        if (f === 0) {
          // 帧 0：后腿稳扎大地，上身大幅人立仰起！双前腿高高抬起亮爪怒吼蓄势！
          hipX = 15;
          hipY = 39;
          chestX = 19;
          chestY = 26;
          headX = 22;
          headY = 14;
          farHindPaw = [9, 47];
          nearHindPaw = [14, 47];
          // 远侧前爪高举护颊，近侧前爪高抬至胸前外展蓄力，轮廓极富张力！
          farForeElbow = [25, 25];
          farForePaw = [31, 18];
          nearForeElbow = [23, 30];
          nearForePaw = [33, 25];
          tailSway = 3;
          roarOpen = true;
          clawGlow = true;
        } else if (f === 1) {
          // 帧 1：后腿蹬地纵身飞扑！狮首居中怒吼不遮脸，双巨爪全力前探，爪前净空劈出三道弯月破魔爪芒！
          hipX = 11;
          hipY = 35;
          chestX = 21;
          chestY = 29;
          headX = 26;
          headY = 19;
          farHindPaw = [4, 45];
          nearHindPaw = [9, 47];
          farForeElbow = [28, 29];
          farForePaw = [35, 26];
          nearForeElbow = [29, 34];
          nearForePaw = [37, 34];
          tailSway = -3;
          roarOpen = true;
          clawGlow = true;
          slashStage = 1;
        } else if (f === 2) {
          // 帧 2：飞扑下压双爪横扫追击！三道翠金爪痕顺势向前延展消散
          hipX = 13;
          hipY = 36;
          chestX = 23;
          chestY = 31;
          headX = 28;
          headY = 21;
          farHindPaw = [7, 46];
          nearHindPaw = [12, 47];
          farForeElbow = [29, 34];
          farForePaw = [36, 35];
          nearForeElbow = [29, 38];
          nearForePaw = [37, 42];
          tailSway = -2;
          roarOpen = true;
          clawGlow = true;
          slashStage = 2;
        } else {
          // 帧 3：双爪重重踏地低伏收势，翡翠余芒微闪
          hipX = 14;
          hipY = 37;
          chestX = 24;
          chestY = 31;
          headX = 29;
          headY = 20;
          farHindPaw = [9, 46];
          nearHindPaw = [13, 47];
          farForeElbow = [28, 39];
          farForePaw = [31, 46];
          nearForeElbow = [30, 40];
          nearForePaw = [34, 47];
          tailSway = 1;
          clawGlow = true;
        }
      } else if (isMove) {
        if (f === 0) {
          // 奔袭帧 0：舒展大步前跨
          hipX = 12;
          hipY = 35;
          chestX = 23;
          chestY = 30;
          headX = 29;
          headY = 19;
          farHindPaw = [6, 46];
          nearHindPaw = [10, 47];
          farForeElbow = [29, 36];
          farForePaw = [34, 45];
          nearForeElbow = [27, 39];
          nearForePaw = [31, 47];
          tailSway = -3;
        } else if (f === 1) {
          // 奔袭帧 1：腾空跃步！四爪离地收拢
          hipX = 14;
          hipY = 32;
          chestX = 24;
          chestY = 27;
          headX = 29;
          headY = 17;
          farHindPaw = [9, 42];
          nearHindPaw = [12, 43];
          farForeElbow = [28, 34];
          farForePaw = [32, 40];
          nearForeElbow = [30, 35];
          nearForePaw = [35, 39];
          tailSway = -4;
        } else if (f === 2) {
          // 奔袭帧 2：前爪落地、后腿收腹前蹬
          hipX = 16;
          hipY = 36;
          chestX = 25;
          chestY = 31;
          headX = 30;
          headY = 20;
          farHindPaw = [12, 46];
          nearHindPaw = [16, 47];
          farForeElbow = [27, 39];
          farForePaw = [29, 47];
          nearForeElbow = [30, 39];
          nearForePaw = [33, 46];
          tailSway = -1;
        } else {
          // 奔袭帧 3：后肢发力纵跃起步
          hipX = 13;
          hipY = 34;
          chestX = 23;
          chestY = 28;
          headX = 29;
          headY = 18;
          farHindPaw = [7, 45];
          nearHindPaw = [10, 46];
          farForeElbow = [29, 35];
          farForePaw = [35, 42];
          nearForeElbow = [30, 36];
          nearForePaw = [36, 43];
          tailSway = -3;
        }
      } else if (isHit) {
        // 受击后缩低伏
        const back = f === 0 ? -3 : -1;
        hipX = 13 + back;
        hipY = 38;
        chestX = 21 + back;
        chestY = 34;
        headX = 25 + back;
        headY = 23;
        farHindPaw = [8 + back, 46];
        nearHindPaw = [11 + back, 47];
        farForeElbow = [25 + back, 40];
        farForePaw = [28 + back, 46];
        nearForeElbow = [27 + back, 39];
        nearForePaw = [31 + back, 44];
        tailSway = 3;
      } else {
        // 待机 6 帧：昂首镇守、胸腔微息、前爪微蓄势、神尾灵焰摇曳
        const by = Math.round(pose.breathY * 0.9);
        const pawFlex = f === 2 || f === 3 ? -1 : 0;
        hipY = 36 + by;
        chestY = 30 + by;
        headY = 19 + by;
        nearForePaw = [32, 47 + pawFlex];
        nearForeElbow = [28, 39 + by];
        farForeElbow = [26, 38 + by];
      }

      // 辅助：绘制雕塑感强健狮掌（带暖金足饰与锋利伸缩金爪）
      const drawLionPaw = (px: number, py: number, dark: boolean, spread: boolean) => {
        const base = dark ? '#b0a99c' : '#f2ede2';
        const hi = dark ? '#d4cdc0' : '#ffffff';
        // 腕踝暖金/暗朱护环（轻盈不割裂腿部线条）
        p.hline(px - 2, py - 3, 4, dark ? '#8c5319' : '#c72c48');
        p.px(px, py - 3, '#ffe270');
        // 饱满肉垫狮掌
        p.ellipse(px, py, spread ? 3.6 : 3.3, spread ? 2.6 : 2.2, base);
        p.hline(px - 2, py - 1, 4, hi);
        // 三枚锋利狮爪（蓄力与飞扑时绽放翠金神锋！）
        const clawCol = clawGlow ? '#8affdc' : '#f5c84c';
        if (spread) {
          p.line(px + 2, py - 2, px + 5, py - 3, clawCol, 1, clawGlow);
          p.line(px + 3, py, px + 6, py, '#ffe885', 1, clawGlow);
          p.line(px + 2, py + 2, px + 5, py + 3, clawCol, 1, clawGlow);
          if (clawGlow) p.px(px + 6, py, '#ffffff', true);
        } else {
          p.px(px + 3, py, clawCol, clawGlow);
          p.px(px + 2, py + 1, '#ffe073', clawGlow);
          p.px(px + 4, py + 1, clawCol, clawGlow);
        }
      };

      // [部件 1] 威风 S 形卷云石狮神尾 + 跃动火焰状翡翠尾焰（尖焰飘动，绝非圆球！）
      const tBaseX = hipX - 4;
      const tBaseY = hipY - 1;
      const tMidX = Math.max(4, hipX - 8);
      const tMidY = Math.max(18, hipY - 7 + tailSway);
      const tTopX = Math.max(5, hipX - 6 + Math.round(tailSway * 0.4));
      const tTopY = Math.max(11, tMidY - 8 + wave);
      p.line(tBaseX, tBaseY, tMidX, tMidY, '#8f887d', 4);
      p.line(tMidX, tMidY, tTopX, tTopY + 4, '#cfc8ba', 3);
      p.line(tMidX + 1, tMidY - 1, tTopX, tTopY + 4, '#f5f0e6', 1);
      // 尾端暖金卷云鬃簇 + 向上飘逸的尖形翡翠神火
      p.ellipse(tTopX, tTopY + 3, 3.0, 2.5, '#d4912a');
      p.hline(tTopX - 1, tTopY + 2, 3, '#ffe073');
      p.poly([
        [tTopX - 3, tTopY + 2],
        [tTopX - 4 + Math.round(wave * 0.5), tTopY - 3],
        [tTopX + Math.round(wave * 0.6), tTopY - 6],
        [tTopX + 3, tTopY - 2],
        [tTopX + 2, tTopY + 2],
      ], '#1fbf94', true);
      p.poly([
        [tTopX - 1, tTopY + 1],
        [tTopX - 2 + Math.round(wave * 0.4), tTopY - 2],
        [tTopX + Math.round(wave * 0.5), tTopY - 4],
        [tTopX + 1, tTopY + 1],
      ], '#a8ffe4', true);
      p.px(tTopX + Math.round(wave * 0.4), tTopY - 4, '#ffffff', true);

      // [部件 2] 远侧后腿与远侧前腿（深暖石影立体分层）
      p.ellipse(hipX - 2, hipY + 3, 4.0, 4.4, '#7d776e');
      p.line(hipX - 3, hipY + 4, farHindPaw[0], farHindPaw[1] - 1, '#8c867c', 4);
      drawLionPaw(farHindPaw[0] + 1, farHindPaw[1], true, false);

      const farSpread = isAttack && f <= 2;
      p.line(chestX + 2, chestY + 2, farForeElbow[0], farForeElbow[1], '#918a80', 4);
      p.line(farForeElbow[0], farForeElbow[1], farForePaw[0], farForePaw[1], '#b3aca0', 3);
      drawLionPaw(farForePaw[0], farForePaw[1], true, farSpread);

      // [部件 3] 雕塑感雄壮石狮躯干（宽胸收腰 + 细腻石肌明暗立体感）
      p.line(hipX, hipY, chestX, chestY, '#9e978b', 11);
      p.ellipse(hipX, hipY, 6.6, 5.6, '#9e978b');
      p.ellipse(hipX + 1, hipY - 1, 5.2, 4.2, '#dad3c6');
      p.ellipse(chestX, chestY, 7.6, 6.8, '#c7c0b2');
      p.ellipse(chestX + 1, chestY - 1.5, 5.8, 5.1, '#f5f0e6');
      // 腿臀处京都石狮暖金浅浮雕卷纹
      p.hline(hipX - 2, hipY - 1, 4, '#fffaf0');
      p.hline(hipX - 1, hipY + 1, 4, '#878075');
      p.hline(chestX - 1, chestY - 4, 4, '#ffffff');

      // [部件 4] 胸前粗实朱红金绞注连绳 + 摇曳神社纸垂 + 醒目大金铃（置于前胸外侧清晰可见！）
      p.line(chestX - 5, chestY - 4, chestX + 7, chestY + 2, '#8a162a', 4);
      p.line(chestX - 4, chestY - 4, chestX + 6, chestY + 1, '#e63956', 2);
      p.px(chestX - 2, chestY - 3, '#ffe073');
      p.px(chestX + 1, chestY - 1, '#ffe073');
      p.px(chestX + 4, chestY, '#ffe073');
      // 胸前摇曳白纸垂（Shide）
      const shX = chestX - 2;
      const shY = chestY + 1;
      p.rect(shX, shY, 2, 2, '#fffaf2');
      p.rect(shX - 1 + Math.round(wave * 0.4), shY + 2, 2, 2, '#e3dacb');
      p.rect(shX + Math.round(wave * 0.5), shY + 4, 2, 2, '#fffaf2');

      // [部件 5] 近侧强健猫科后肢（弯折蓄力蹬地！）
      p.ellipse(hipX, hipY + 3, 4.8, 5.0, '#d9d2c5');
      p.ellipse(hipX + 1, hipY + 1.5, 3.2, 3.2, '#f7f2e8');
      p.line(hipX, hipY + 5, nearHindPaw[0], nearHindPaw[1] - 1, '#ebe4d8', 4);
      p.line(hipX + 1, hipY + 5, nearHindPaw[0] + 1, nearHindPaw[1] - 1, '#ffffff', 1);
      drawLionPaw(nearHindPaw[0] + 1, nearHindPaw[1], false, false);

      // [部件 6] 近侧主角前腿与破魔巨爪（高高抬起 / 凶猛飞扑伸展，肌肉线条饱满有力！）
      const nearSpread = isAttack && f <= 2;
      p.ellipse(chestX + 1, chestY + 2, 4.2, 4.2, '#e8e2d5');
      p.line(chestX + 1, chestY + 2, nearForeElbow[0], nearForeElbow[1], '#e3dcd0', 5);
      p.line(nearForeElbow[0], nearForeElbow[1], nearForePaw[0], nearForePaw[1], '#f5f0e6', 4);
      p.line(chestX + 2, chestY + 2, nearForePaw[0], nearForePaw[1] - 1, '#ffffff', 1);
      drawLionPaw(nearForePaw[0], nearForePaw[1], false, nearSpread);

      // 醒目神社黄金大铃铛（悬于喉下前胸，绝不被肩膀遮挡！）
      const bellX = chestX + 6;
      const bellY = chestY + 3;
      p.ellipse(bellX, bellY, 3.2, 3.2, '#9e6616');
      p.ellipse(bellX, bellY - 0.4, 2.4, 2.4, '#ffe266', true);
      p.px(bellX - 1, bellY - 1, '#ffffff', true);
      p.hline(bellX - 1, bellY + 1, 3, '#4f2b12');

      // [部件 7] 华贵雕塑感暖金卷云狮鬃 + 威严大狮首（独立双耳 + 清晰面庞 + 浓烈战意！）
      const hx = headX;
      const hy = headY;
      // 深琥珀底鬃 + 暖金主鬃 + 卷云亮鬃（三层明暗告别平色块！）
      p.ellipse(hx - 2, hy + 1, 9.4, 8.8, '#804c14');
      p.ellipse(hx - 2, hy, 8.0, 7.5, '#cc8924');
      const maneCurls: Array<[number, number, number, number, string]> = [
        [hx - 9, hy - 2, 3.2, 3.0, '#f2b83d'],
        [hx - 9, hy + 3, 3.0, 2.8, '#d99626'],
        [hx - 5, hy - 6, 3.4, 2.8, '#ffd966'],
        [hx + 1, hy - 6, 3.0, 2.4, '#f2b83d'],
        [hx - 5, hy + 6, 3.2, 2.5, '#bf7a1b'],
      ];
      for (const [mx, my, rx, ry, col] of maneCurls) {
        p.ellipse(mx, my, rx, ry, col);
      }
      // 鬃毛高光与翡翠灵珠点缀
      p.hline(hx - 6, hy - 7, 4, '#fff2ad');
      p.hline(hx - 10, hy - 3, 2, '#ffe885');
      p.px(hx - 9, hy - 2, '#6bf0c6', true);
      p.px(hx - 5, hy - 6, '#6bf0c6', true);
      p.px(hx - 8, hy + 3, '#ffe885', true);

      // 独立高耸尖挺双狮耳（深轮廓与狮鬃分明，受击时压平后折！）
      const earDrop = isHit ? 3 : 0;
      p.poly([[hx - 5, hy - 5], [hx - 7, hy - 12 + earDrop], [hx - 1, hy - 7]], '#cfc8ba');
      p.poly([[hx - 4, hy - 6], [hx - 6, hy - 11 + earDrop], [hx - 2, hy - 7]], '#faf5eb');
      p.px(hx - 5, hy - 8 + earDrop, '#e86880');
      p.poly([[hx + 2, hy - 5], [hx + 6, hy - 12 + earDrop], [hx + 7, hy - 5]], '#e6dfd2');
      p.poly([[hx + 3, hy - 6], [hx + 6, hy - 11 + earDrop], [hx + 6, hy - 5]], '#ffffff');
      p.px(hx + 5, hy - 8 + earDrop, '#e86880');

      // 饱满石狮面庞与立体白狮吻
      p.ellipse(hx + 1.5, hy + 1, 6.6, 5.6, '#cfc8ba');
      p.ellipse(hx + 2.5, hy, 5.5, 4.8, '#f7f2e8');
      p.ellipse(hx + 5.5, hy + 2.5, 4.3, 3.1, '#ffffff');
      // 狮鼻
      p.rect(hx + 6, hy + 1, 3, 2, '#4d3530');
      p.px(hx + 7, hy + 1, '#94746d');
      // 浓金威严眉弓
      p.hline(hx + 1, hy - 3, 6, '#cc841d');
      p.hline(hx + 2, hy - 4, 4, '#ffe885');
      // 炯炯翡翠灵眸（待机第4帧自然眨眼，受击紧闭，攻击怒目发亮！）
      if (pose.expr === 'hurt') {
        p.hline(hx + 1, hy, 3, '#2b1e33');
        p.hline(hx + 5, hy, 2, '#2b1e33');
      } else if (pose.blink) {
        p.hline(hx + 1, hy, 3, '#3b2c3d');
        p.hline(hx + 5, hy, 2, '#3b2c3d');
      } else {
        const eyeCol = isAttack ? '#5effcf' : '#14c993';
        p.rect(hx + 1, hy - 1, 3, 2, eyeCol, true);
        p.px(hx + 1, hy - 1, '#ffffff', true);
        p.rect(hx + 5, hy - 1, 2, 2, eyeCol, true);
        p.px(hx + 5, hy - 1, '#ffffff', true);
      }
      // 阿形狮口（抬腿蓄力与飞扑时大张狮口露白牙咆哮！）
      if (roarOpen) {
        p.rect(hx + 3, hy + 4, 6, 4, '#6e1224');
        p.hline(hx + 4, hy + 6, 4, '#e63956');
        p.px(hx + 4, hy + 4, '#ffffff');
        p.px(hx + 8, hy + 4, '#ffffff');
        p.px(hx + 5, hy + 7, '#ffffff');
        p.px(hx + 7, hy + 7, '#ffffff');
      } else {
        p.hline(hx + 4, hy + 5, 5, '#7a6860');
        p.px(hx + 4, hy + 4, '#ffffff');
        p.px(hx + 8, hy + 4, '#ffffff');
      }

      // 抬腿人立蓄力帧：高举双爪周围环绕翠金灵芒火花（干净不遮挡面部！）
      if (isAttack && f === 0) {
        p.px(farForePaw[0] + 6, farForePaw[1] - 2, '#ffe878', true);
        p.px(farForePaw[0] + 7, farForePaw[1] + 1, '#6bf0c6', true);
        p.px(nearForePaw[0] + 7, nearForePaw[1] - 2, '#9effdf', true);
        p.px(nearForePaw[0] + 6, nearForePaw[1] + 4, '#ffe878', true);
      }

      // 飞扑与横扫瞬间：完全位于巨爪前方净空（x = 38..46）的三道利落弯月翠金破魔神爪罡气，绝不遮脸！
      if (slashStage === 1) {
        // 上爪弧
        p.line(38, 17, 44, 24, '#24d9a6', 2, true);
        p.line(44, 24, 46, 30, '#24d9a6', 1, true);
        p.line(39, 18, 44, 24, '#ffffff', 1, true);
        // 中主爪弧（璀璨暖金核心）
        p.line(39, 24, 45, 32, '#6bf0c6', 2, true);
        p.line(45, 32, 46, 38, '#ffe878', 1, true);
        p.line(40, 25, 45, 32, '#fff5b8', 1, true);
        // 下爪弧
        p.line(39, 32, 44, 39, '#24d9a6', 2, true);
        p.line(44, 39, 44, 44, '#9effdf', 1, true);
        p.px(43, 38, '#ffffff', true);
        // 后蹄发力蹬地的翠金尘埃
        p.px(6, 47, '#9effdf', true);
        p.px(12, 48, '#ffe878', true);
      } else if (slashStage === 2) {
        // 余芒延展消散爪痕
        p.line(40, 23, 45, 31, '#6bf0c6', 1, true);
        p.line(40, 30, 46, 38, '#ffe878', 2, true);
        p.line(40, 37, 45, 44, '#9effdf', 1, true);
        p.px(45, 34, '#ffffff', true);
        p.px(44, 42, '#ffffff', true);
      }
    },
  },

  /** 生命 T2-B：阴阳玉浮游炮（数学精确平滑太极核 + 雕花古金八角环 + 左右摇曳纸垂 + 四枚翼刃浮游炮） */
  creature_yinyang_turret: {
    backdropTop: '#160d24',
    backdropBottom: '#301428',
    backdropGlow: '#ff5270',
    avatarCrop: { x: 8, y: 11, size: 32 },
    portraitCrop: { x: 4, y: 6, w: 40, h: 42 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(24 + pose.leanX * 0.6);
      const by = Math.round(26 + pose.breathY * 1.4 - pose.stepLift);
      const angle = pose.phase * Math.PI * 2;
      const fl = Math.round(pose.flutter * 1.5);

      // [部件 1] 两侧与底端垂挂的神社雷纹白纸垂（Shide）
      const drawShide = (sx: number, sy: number) => {
        p.rect(sx - 1, sy, 2, 3, '#fff9f0');
        p.rect(sx + fl * 0.5, sy + 3, 2, 3, '#e8dfd3');
        p.rect(sx - 1 + fl, sy + 6, 2, 3, '#fff9f0');
      };
      drawShide(bx - 13, by + 6);
      drawShide(bx + 12, by + 6);
      // 底端朱红金穗流苏
      p.poly([[bx - 3, by + 12], [bx + 3, by + 12], [bx + 4 + fl, by + 20], [bx - 4 + fl, by + 20]], '#b8243b');
      p.rect(bx - 1 + Math.round(fl * 0.5), by + 13, 2, 6, '#fff8eb');
      p.hline(bx - 3 + fl, by + 19, 6, '#ffe073');

      // [部件 2] 精雕古金八角结界外环
      p.ellipse(bx, by, 14.2, 14.2, '#8c6022');
      p.ellipse(bx, by, 13.0, 13.0, '#edc159');
      p.ellipse(bx, by, 11.4, 11.4, '#1b1124');
      // 外环四方位亮金神钉
      p.rect(bx - 1, by - 14, 3, 2, '#fff5b8', true);
      p.rect(bx - 1, by + 13, 3, 2, '#fff5b8', true);
      p.rect(bx - 14, by - 1, 2, 3, '#fff5b8', true);
      p.rect(bx + 13, by - 1, 2, 3, '#fff5b8', true);

      // [部件 3] 数学精确光栅化「琉璃立体阴阳太极球」（丝滑完美 S 曲线 + 球面镜光！）
      const R = 9.4;
      const halfR = R * 0.5;
      for (let dy = -10; dy <= 10; dy++) {
        for (let dx = -10; dx <= 10; dx++) {
          const dist = Math.hypot(dx, dy);
          if (dist > R) continue;
          const dTop = Math.hypot(dx, dy + halfR);
          const dBot = Math.hypot(dx, dy - halfR);
          // 标准阴阳鱼区域判定：右侧为朱红阳鱼，上方凸半圆属阳，下方凸半圆属阴
          const isRed = (dx >= 0 && dBot > halfR) || dTop <= halfR;
          // 球面光影明暗（左上暖光，右下冷影）
          const shade = dx * 0.45 + dy * 0.55;
          let col: string;
          if (isRed) {
            col = shade < -2.2 ? '#ff637d' : shade < 2.8 ? '#e02d4c' : '#9c1730';
          } else {
            col = shade < -2.2 ? '#ffffff' : shade < 3.0 ? '#f5efe6' : '#cfc5d6';
          }
          p.px(bx + dx, by + dy, col);
        }
      }
      // 琉璃左上方光泽弧 + 发光双太极鱼眼
      p.px(bx - 5, by - 4, '#ffffff', true);
      p.px(bx - 4, by - 5, '#ffffff', true);
      p.ellipse(bx, by - 4.7, 1.8, 1.8, '#fff7cc', true);
      p.px(bx, by - 5, '#ffffff', true);
      p.ellipse(bx, by + 4.7, 1.8, 1.8, '#ff4769', true);
      p.px(bx, by + 4, '#ffc2cf', true);

      // [部件 4] 四枚旋转浮游赤金棱镜翼炮
      for (let i = 0; i < 4; i++) {
        const a = angle + (i * Math.PI) / 2 + 0.4;
        const px = Math.round(bx + Math.cos(a) * 16.0);
        const py = Math.round(by + Math.sin(a) * 14.2);
        p.poly([[px, py - 3], [px + 3, py], [px, py + 3], [px - 3, py]], '#c92642');
        p.rect(px - 1, py - 1, 2, 2, '#ffe885', true);
        p.px(px, py - 1, '#ffffff', true);
      }

      if (pose.armAction >= 0.4 || pose.slashAlpha > 0.2) {
        p.ellipse(bx + 14, by, 4.2, 4.6, '#ff4d6d', true);
        p.ellipse(bx + 14, by, 2.6, 2.8, '#fff7cc', true);
        p.line(bx + 16, by, bx + 23, by, '#ffe066', 3, true);
        p.hline(bx + 16, by, 7, '#ffffff', true);
      }
    },
  },
};

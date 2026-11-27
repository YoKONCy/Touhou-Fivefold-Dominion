/**
 * 博丽神社（生命系 7 位）+ 魔法之森（混沌系 6 位）· 大师级精雕纯代码 48×54 像素立绘与骨骼动画像素绘谱
 *
 * 视觉打磨准则（基于离线实拍 PNG 逐帧审稿重构）：
 * - 少女系兵种采用柔和圆润发冠、分缕斜刘海与灵动大瞳，绝不出现方帽头盔或贴脸杂物，武器与身躯留足负空间剪影！
 * - 圣兽与魔兽采用雕塑感动态蓄力/昂首构型（狛犬盘踞怒吼、天马扬蹄振翼、梦魇火鬃奔腾、炎灵旋涡魔焰、红莲魔龙展翼S颈），
 *   彻底杜绝直棍四腿、盒状块面与孤立三角贴片！
 * - 所有 avatarCrop / portraitCrop 严格对齐整数倍缩放与构图黄金焦点，零裁切零畸变。
 */

import {
  drawChibiFaceEyes,
  type PixelPainter,
  type RigPose,
  type SpriteRigSpec,
} from './voxelSprites';
import { ORDER_FACTION_RIG_SPECS } from './orderFactionSprites';
import { DEATH_FACTION_RIG_SPECS } from './deathFactionSprites';

/** 通用精致少女脸庞与细颈底绘（标准 5.4×5.0 柔和鹅蛋脸 + 下颌暖影） */
function drawAnimeHeadBase(p: PixelPainter, bx: number, headY: number): void {
  p.rect(bx - 1, headY + 4, 3, 3, '#e0ac92');
  p.ellipse(bx, headY, 5.4, 5.0, '#ffe9d9');
  p.hline(bx - 3, headY + 4, 7, '#ebb99d');
  p.px(bx - 4, headY + 3, '#f2c5aa');
  p.px(bx + 4, headY + 3, '#f2c5aa');
  p.hline(bx - 2, headY - 4, 4, '#fff4eb');
}

/** 通用柔顺圆顶少女发冠（彻底替代生硬方盒，呈现流畅日系像素弧顶与天使环高光） */
function drawSoftHairCrown(
  p: PixelPainter,
  bx: number,
  headY: number,
  dark: string,
  mid: string,
  light: string,
  spec: string,
): void {
  p.ellipse(bx, headY - 4.4, 6.2, 3.6, dark);
  p.ellipse(bx, headY - 4.8, 5.2, 2.7, mid);
  p.hline(bx - 4, headY - 6, 8, light);
  p.hline(bx - 2, headY - 7, 4, spec);
  // 轻盈自然分缕刘海（绝不遮盖眼睫毛！）
  p.px(bx - 5, headY - 2, dark);
  p.px(bx - 3, headY - 2, mid);
  p.px(bx, headY - 2, dark);
  p.px(bx + 3, headY - 2, mid);
  p.px(bx + 5, headY - 2, dark);
}

export const FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  ...ORDER_FACTION_RIG_SPECS,
  ...DEATH_FACTION_RIG_SPECS,
  // =========================================================================
  // 一、博丽神社 · 生命系精雕 7 位像素立绘
  // =========================================================================

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

  /** 生命 T3-A：退魔剑士（和风月银退魔双剑豪 · 飘扬月蓝高马尾 + 银月额饰 + 精雕月银胸甲与滚金深蓝阵羽织 + 辉金破魔太刀×冰蓝灵胁差双月连斩！） */
  creature_exorcist_blade: {
    backdropTop: '#0d152e',
    backdropBottom: '#1c2a4d',
    backdropGlow: '#78c4ff',
    avatarCrop: { x: 10, y: 5, size: 28 },
    portraitCrop: { x: 3, y: 3, w: 42, h: 47 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      // 攻击前冲时略左收基准位，为前方饱满弯月双斩剑气留出充裕净空（绝不裁边！）
      const bx = isAtk && (f === 1 || f === 2)
        ? 21
        : isAtk && f === 0
          ? 20
          : Math.round(23 + pose.leanX * 0.85);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.5);
      const stride = Math.round(pose.stride * 3.6);

      // [部件 1] 背后飒爽飞扬的「月蓝高马尾」与分层深蓝滚金「和风阵羽织披风」
      const tailSway = isAtk && f === 1 ? -4 : isAtk && f === 2 ? -2 : sway;
      // 高马尾发束（带柔顺S曲线与亮蓝银发丝层次）
      p.poly([
        [bx - 4, 14 + by],
        [bx - 12 + tailSway, 16 + by],
        [bx - 16 + tailSway, 24 + by],
        [bx - 13 + tailSway, 28 + by],
        [bx - 9 + tailSway, 22 + by],
        [bx - 5, 18 + by],
      ], '#1e2c59');
      p.poly([
        [bx - 5, 15 + by],
        [bx - 11 + tailSway, 17 + by],
        [bx - 14 + tailSway, 24 + by],
        [bx - 10 + tailSway, 21 + by],
      ], '#3b5ca8');
      p.line(bx - 6, 16 + by, bx - 12 + tailSway, 21 + by, '#8cb8ff', 1);
      // 绯红鎏金扎发结
      p.rect(bx - 6, 13 + by, 3, 3, '#d92b49');
      p.px(bx - 5, 14 + by, '#ffe478');

      // 分层随风翻卷的深蓝阵羽织披风（暗衬里 + 主布面 + 鎏金下摆纹）
      const capeBack = isAtk && f === 1 ? -5 : sway;
      p.poly([
        [bx - 4, 24 + by],
        [bx - 15 + capeBack, 31 + by],
        [bx - 16 + capeBack, 41 + by],
        [bx - 7, 39 + by],
      ], '#122454');
      p.poly([
        [bx - 4, 25 + by],
        [bx - 13 + capeBack, 31 + by],
        [bx - 13 + capeBack, 39 + by],
        [bx - 6, 37 + by],
      ], '#254a9e');
      p.line(bx - 13 + capeBack, 32 + by, bx - 7, 35 + by, '#4b7de0', 1);
      p.line(bx - 15 + capeBack, 40 + by, bx - 7, 38 + by, '#f0c452', 1);

      // [部件 2] 灵活分步的精钢护胫与和风系带战靴
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      const lFootX = bx - 5 - stride;
      const rFootX = bx + 2 + stride;
      // 后腿护胫
      p.rect(lFootX, 41 + lLift, 3, 6, '#394870');
      p.vline(lFootX + 1, 41 + lLift, 5, '#9cb3db');
      p.hline(lFootX, 43 + lLift, 3, '#e8bc4f');
      p.hline(lFootX - 1, 47 + lLift, 4, '#1b2647');
      // 前腿护胫（高亮月银）
      p.rect(rFootX, 41 + rLift, 3, 6, '#586d9e');
      p.vline(rFootX + 1, 41 + rLift, 5, '#d9e7ff');
      p.hline(rFootX, 43 + rLift, 3, '#ffe073');
      p.hline(rFootX, 47 + rLift, 4, '#243561');

      // [部件 3] 百褶深蓝剑道袴裙 + 绯白退魔腰带垂穗 + 精雕月银修身胸甲
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      // 剑道百褶战裙（清晰百褶明暗竖纹）
      p.poly([
        [bx - 5, 34 + by],
        [bx + 5, 34 + by],
        [bx + 9 + sk, 43 + by],
        [bx - 8 + sk, 43 + by],
      ], '#162d66');
      p.poly([
        [bx - 4, 34 + by],
        [bx + 4, 34 + by],
        [bx + 7 + sk, 42 + by],
        [bx - 6 + sk, 42 + by],
      ], '#2b55b3');
      p.vline(bx - 3, 35 + by, 7, '#4c80e6');
      p.vline(bx + 2, 35 + by, 7, '#193578');
      p.hline(bx - 7 + sk, 42 + by, 15, '#e8eefc');
      // 前垂白金退魔御札布（纤细修长不臃肿！）
      p.poly([
        [bx - 1, 34 + by],
        [bx + 2, 34 + by],
        [bx + 3 + sk, 42 + by],
        [bx - 1 + sk, 42 + by],
      ], '#f5f8ff');
      p.vline(bx + 1, 35 + by, 6, '#d92b49');
      p.px(bx + 1, 37 + by, '#ffe478', true);

      // 精雕月银收腰轻铠（3 阶冷金属高光 + 绯红内襟与鎏金护领）
      p.poly([
        [bx - 4, 25 + by],
        [bx + 4, 25 + by],
        [bx + 5, 33 + by],
        [bx - 5, 33 + by],
      ], '#556991');
      p.rect(bx - 3, 26 + by, 6, 6, '#a5badb');
      p.rect(bx - 2, 26 + by, 3, 4, '#ebf3ff');
      p.px(bx - 1, 27 + by, '#ffffff');
      // 绯红和风交领 + 金色退魔纹章
      p.line(bx - 3, 25 + by, bx, 28 + by, '#d92b49', 1);
      p.line(bx + 3, 25 + by, bx, 28 + by, '#f0425c', 1);
      p.px(bx, 29 + by, '#ffe478', true);
      // 绯金编织束腰与侧面退魔绳穗
      p.hline(bx - 5, 33 + by, 10, '#c4243f');
      p.hline(bx - 4, 32 + by, 8, '#f2c85b');
      p.rect(bx - 1, 32 + by, 3, 2, '#ffe885');
      p.line(bx - 4, 34 + by, bx - 5 + sway, 38 + by, '#f2c85b', 1);

      // 轻盈雕花月银双肩铠（收紧贴肩，彻底告别大圆球！）
      p.poly([[bx - 7, 25 + by], [bx - 4, 24 + by], [bx - 4, 28 + by], [bx - 7, 27 + by]], '#6f85b0');
      p.hline(bx - 7, 25 + by, 3, '#e3eeff');
      p.px(bx - 6, 27 + by, '#f2c85b');
      p.poly([[bx + 4, 24 + by], [bx + 7, 25 + by], [bx + 7, 27 + by], [bx + 4, 28 + by]], '#8ea6d4');
      p.hline(bx + 4, 25 + by, 3, '#ffffff');
      p.px(bx + 6, 27 + by, '#ffe073');

      // [部件 4] 左手「冰蓝灵胁差（副刃）」——随动作自然配合右刃形成二刀流层次！
      if (isAtk && f === 0) {
        // 蓄力帧：副刃横护身前下侧蓄势
        p.rect(bx - 6, 28 + by, 3, 3, '#586d9e');
        p.line(bx - 7, 30 + by, bx - 15, 25 + by, '#52b8ff', 2, true);
        p.line(bx - 8, 29 + by, bx - 15, 25 + by, '#e8f9ff', 1, true);
        p.rect(bx - 8, 29 + by, 2, 2, '#ffe073');
      } else if (isAtk && f === 1) {
        // 纵斩帧：副刃顺势后拉平衡，准备紧接第二段回旋连斩
        p.line(bx - 5, 29 + by, bx - 14, 34 + by, '#52b8ff', 2, true);
        p.line(bx - 6, 29 + by, bx - 14, 33 + by, '#def5ff', 1, true);
      } else if (isAtk && f === 2) {
        // 第二段回旋双连斩！左手冰蓝灵刃顺势向前横扫，切出苍蓝弯月剑气！
        p.rect(bx + 4, 30 + by, 3, 3, '#8ea6d4');
        p.line(bx + 6, 31 + by, bx + 18, 28 + by, '#59bfff', 2, true);
        p.line(bx + 7, 30 + by, bx + 18, 28 + by, '#ffffff', 1, true);
      } else {
        // 待机/行走/受击：左手自然反握冰蓝胁差斜指后下方，与主刀形成漂亮对角剪影
        const offArm = isHit ? -2 : Math.round(-pose.stride * 1.2);
        p.rect(bx - 7 + offArm, 29 + by, 3, 3, '#7b92bf');
        p.rect(bx - 8 + offArm, 31 + by, 2, 2, '#ffe4cf');
        p.rect(bx - 9 + offArm, 31 + by, 2, 2, '#f0c452');
        p.line(bx - 9 + offArm, 32 + by, bx - 16 + offArm, 37 + by, '#45a8ff', 2, true);
        p.line(bx - 10 + offArm, 32 + by, bx - 16 + offArm, 36 + by, '#e6f7ff', 1, true);
      }

      // [部件 5] 飒爽灵动少女脸庞 + 层次感月蓝短发 + 精致「和风白银新月退魔额饰」（彻底告别傻瓜牛角头盔！）
      const headY = 18 + by;
      drawAnimeHeadBase(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#1c54c4', '#8ce8ff', pose);
      drawSoftHairCrown(p, bx, headY, '#1c2a54', '#335299', '#6c96e6', '#cfe4ff');
      // 柔和包颊双鬓（修脸型、去方框感）
      p.poly([[bx - 6, headY - 3], [bx - 4, headY - 2], [bx - 5, headY + 6], [bx - 7, headY + 4]], '#263b73');
      p.vline(bx - 6, headY - 1, 5, '#4d73c2');
      p.poly([[bx + 4, headY - 2], [bx + 6, headY - 3], [bx + 7, headY + 4], [bx + 5, headY + 6]], '#263b73');
      p.vline(bx + 5, headY - 1, 4, '#5a82d1');
      // 精巧白银发箍 + 眉心鎏金新月退魔额饰（纤细高贵！）
      p.hline(bx - 5, headY - 5, 10, '#dce8fc');
      p.px(bx - 4, headY - 6, '#b8ccf0');
      p.px(bx + 4, headY - 6, '#b8ccf0');
      // 精致小巧新月冠（仅 5×4px，优雅不浮夸）
      p.px(bx - 2, headY - 8, '#ffe885', true);
      p.px(bx - 1, headY - 7, '#f2c85b', true);
      p.px(bx, headY - 6, '#fff8cc', true);
      p.px(bx + 1, headY - 7, '#f2c85b', true);
      p.px(bx + 2, headY - 8, '#ffe885', true);
      p.px(bx, headY - 7, '#e63250', true);

      // [部件 6] 右手「辉金破魔太刀（主刃）」+ 连续丝滑无裁切「双月连斩」光弧剑气！
      if (isAtk && f === 0) {
        // 蓄力帧 0：右手高举太刀收至右后上方（完全避开面部与额冠，剪影干净！）
        p.line(bx + 4, 27 + by, bx + 9, 21 + by, '#a5badb', 2);
        p.rect(bx + 8, 20 + by, 2, 2, '#ffe4cf');
        p.rect(bx + 7, 19 + by, 3, 2, '#f0c452');
        p.line(bx + 9, 19 + by, bx + 4, 6 + by, '#ffe066', 2, true);
        p.line(bx + 9, 18 + by, bx + 4, 6 + by, '#ffffff', 1, true);
        // 刀尖蓄力星芒
        p.px(bx + 4, 5 + by, '#ffffff', true);
        p.px(bx + 2, 6 + by, '#8cd6ff', true);
        p.px(bx + 6, 6 + by, '#ffe885', true);
      } else if (isAtk && f === 1) {
        // 攻击帧 1（第一段纵斩）：太刀猛然斜劈向下，前方绘出连续饱满的金色新月剑气弧！
        p.line(bx + 4, 27 + by, bx + 10, 30 + by, '#b5c8eb', 2);
        p.rect(bx + 9, 29 + by, 2, 2, '#ffe4cf');
        p.rect(bx + 10, 29 + by, 2, 2, '#f0c452');
        p.line(bx + 11, 30 + by, bx + 22, 36 + by, '#ffe066', 2, true);
        p.line(bx + 12, 30 + by, bx + 22, 35 + by, '#ffffff', 1, true);
        // 连续紧密连线的新月弯弧（外层炽金 + 内芯纯白，彻底告别虚线点点！）
        const arcCx = bx + 9;
        const arcCy = 26 + by;
        const segs = 12;
        for (let i = 0; i < segs; i++) {
          const a0 = -1.25 + (i / segs) * 2.15;
          const a1 = -1.25 + ((i + 1) / segs) * 2.15;
          const ox0 = Math.round(arcCx + Math.cos(a0) * 14);
          const oy0 = Math.round(arcCy + Math.sin(a0) * 15);
          const ox1 = Math.round(arcCx + Math.cos(a1) * 14);
          const oy1 = Math.round(arcCy + Math.sin(a1) * 15);
          const ix0 = Math.round(arcCx + Math.cos(a0) * 12);
          const iy0 = Math.round(arcCy + Math.sin(a0) * 13);
          const ix1 = Math.round(arcCx + Math.cos(a1) * 12);
          const iy1 = Math.round(arcCy + Math.sin(a1) * 13);
          const thick = i >= 3 && i <= 8 ? 2 : 1;
          p.line(ox0, oy0, ox1, oy1, '#ffcf40', thick, true);
          p.line(ix0, iy0, ix1, iy1, i >= 3 && i <= 9 ? '#ffffff' : '#fff0a6', 1, true);
        }
        p.px(bx + 20, 14 + by, '#9cd8ff', true);
        p.px(bx + 23, 25 + by, '#ffffff', true);
      } else if (isAtk && f === 2) {
        // 攻击帧 2（第二段回旋连斩）：太刀上撩收势 + 副刃连续苍蓝弯月反斩弧！
        p.line(bx + 4, 27 + by, bx + 9, 24 + by, '#b5c8eb', 2);
        p.line(bx + 9, 24 + by, bx + 19, 14 + by, '#ffe066', 2, true);
        p.line(bx + 10, 23 + by, bx + 19, 14 + by, '#ffffff', 1, true);
        const arcCx = bx + 9;
        const arcCy = 27 + by;
        const segs = 10;
        for (let i = 0; i < segs; i++) {
          const a0 = -0.82 + (i / segs) * 1.84;
          const a1 = -0.82 + ((i + 1) / segs) * 1.84;
          const ox0 = Math.round(arcCx + Math.cos(a0) * 14);
          const oy0 = Math.round(arcCy + Math.sin(a0) * 12);
          const ox1 = Math.round(arcCx + Math.cos(a1) * 14);
          const oy1 = Math.round(arcCy + Math.sin(a1) * 12);
          const ix0 = Math.round(arcCx + Math.cos(a0) * 12);
          const iy0 = Math.round(arcCy + Math.sin(a0) * 10);
          const ix1 = Math.round(arcCx + Math.cos(a1) * 12);
          const iy1 = Math.round(arcCy + Math.sin(a1) * 10);
          p.line(ox0, oy0, ox1, oy1, '#42b4ff', i >= 2 && i <= 7 ? 2 : 1, true);
          p.line(ix0, iy0, ix1, iy1, i >= 2 && i <= 7 ? '#ffffff' : '#b8eaff', 1, true);
        }
        p.px(bx + 21, 35 + by, '#ffe478', true);
      } else {
        // 待机 / 行走 / 收招：右手持辉金破魔太刀优雅斜指右上方，剑刃微弧、锷护手清晰
        const armLift = isHit ? -2 : Math.round(-pose.armAction * 2);
        const handX = bx + 8;
        const handY = 29 + by + armLift;
        p.line(bx + 4, 27 + by, handX, handY, '#9eb4de', 2);
        p.rect(handX - 1, handY - 1, 2, 2, '#ffe4cf');
        // 绯缠刀柄与十字鎏金锷
        p.line(handX - 2, handY + 2, handX + 1, handY - 1, '#a82038', 1);
        p.line(handX - 1, handY - 2, handX + 3, handY + 1, '#f5cc58', 1);
        // 细长优美微弧太刀刃（刀背浅蓝银 + 刀刃亮金白光！）
        p.line(handX + 1, handY - 1, handX + 11, handY - 13, '#8fb8e6', 2);
        p.line(handX + 2, handY - 1, handX + 12, handY - 14, '#ffe478', 1, true);
        p.line(handX + 3, handY - 2, handX + 12, handY - 14, '#ffffff', 1, true);
        // 刀尖星光微闪
        if (pose.frame % 3 === 1) {
          p.px(handX + 13, handY - 15, '#ffffff', true);
        }
      }
    },
  },

  /** 生命 T3-B：净邪祈祷巫女（琉璃月华莲僧祭司 · 浮空青莲底座 + 紫藤长辫 + 珍珠白翡翠金袈裟 + 六环金锡杖！） */
  creature_prayer_maiden: {
    backdropTop: '#0e1926',
    backdropBottom: '#1c2b3d',
    backdropGlow: '#78f5df',
    avatarCrop: { x: 10, y: 5, size: 28 },
    portraitCrop: { x: 3, y: 3, w: 42, h: 47 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(23 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 1.4 - pose.stepLift - 1);
      const sway = Math.round(pose.flutter * 1.3);

      // [部件 1] 脚下缓缓绽放的「青玉莲台浮空法阵」+ 背后悬空「鎏金念珠轮」（佛道神官专属禅韵！）
      p.ellipse(bx, 48, 10.5, 2.6, '#1f8a7d', true);
      p.ellipse(bx, 48, 6.8, 1.4, '#9effef', true);
      const ringY = 22 + by;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + pose.phase * 0.5;
        const rx = Math.round(bx + Math.cos(a) * 14.0);
        const ry = Math.round(ringY + Math.sin(a) * 13.5);
        p.px(rx, ry, i % 3 === 0 ? '#9effef' : '#ffe278', true);
      }

      // [部件 2] 柔美紫藤淡紫长发（垂落至腰间，彻底区分于灵梦黑发！）
      p.poly([[bx - 7, 17 + by], [bx + 7, 17 + by], [bx + 10 - sway, 36 + by], [bx - 10 + sway, 36 + by]], '#4d3a73');
      p.rect(bx - 6, 19 + by, 12, 15, '#7c62ab');
      p.vline(bx - 4, 21 + by, 12, '#b89ee6');

      // [部件 3] 琉璃珍珠白长祭司袍 + 斜披翡翠滚金「天女袈裟」+ 优雅青玉广袖（彻底去红白裙！）
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 10 + sk, 45 + by], [bx - 10 + sk, 45 + by]], '#cfd8e8');
      p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 8 + sk, 44 + by], [bx - 8 + sk, 44 + by]], '#ffffff');
      p.hline(bx - 9 + sk, 44 + by, 18, '#3ec9b4');
      p.hline(bx - 8 + sk, 43 + by, 16, '#ffe073');
      // 宽大垂落青玉色内袖
      p.poly([[bx - 5, 25 + by], [bx - 12 + sway, 30 + by], [bx - 11 + sway, 38 + by], [bx - 5, 35 + by]], '#28998c');
      p.hline(bx - 11 + sway, 37 + by, 6, '#ffe073');
      // 上身白玉禅衣 + 斜披金纹碧玉袈裟飘带
      p.rect(bx - 5, 25 + by, 10, 8, '#f7fbff');
      p.line(bx - 5, 26 + by, bx + 5, 33 + by, '#228c7f', 3);
      p.line(bx - 5, 26 + by, bx + 5, 33 + by, '#ffe278', 1);
      // 胸口莲花翡翠玉佩
      p.rect(bx - 1, 29 + by, 3, 2, '#78ffea', true);

      // [部件 4] 澄澈慈悲的神官少女面庞 + 紫藤柔发 + 莲花额心金钿
      const headY = 18 + by;
      drawAnimeHeadBase(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#1c8078', '#8cfff0', pose);
      drawSoftHairCrown(p, bx, headY, '#533e7a', '#856bb8', '#beaae8', '#eee6ff');
      p.rect(bx - 6, headY - 2, 2, 11, '#5e478a');
      p.rect(bx + 5, headY - 2, 2, 11, '#5e478a');
      // 精致金莲额冠（东方天女/高僧典雅造型）
      p.poly([[bx - 4, headY - 7], [bx, headY - 10], [bx + 4, headY - 7]], '#ffe066', true);
      p.px(bx, headY - 8, '#78ffea', true);
      p.px(bx - 6, headY + 4, '#ffe066');
      p.px(bx + 6, headY + 4, '#ffe066');

      // [部件 5] 右手优雅端持「六环鎏金大锡杖」（HoMM4 僧侣 × 东方神官最具辨识度法器！）
      const stX = bx + 12 + Math.round(pose.armAction * 3);
      const stY = 17 + by - Math.round(pose.armAction * 4);
      p.poly([[bx + 4, 26 + by], [stX - 2, stY + 9], [stX - 3, stY + 15], [bx + 3, 33 + by]], '#35b5a5');
      p.rect(stX - 2, stY + 9, 2, 2, '#ffe4cf');
      // 锡杖长柄
      p.line(stX - 1, stY + 26, stX, stY - 2, '#b8822a', 2);
      p.line(stX - 1, stY + 26, stX, stY - 2, '#ffe478', 1);
      // 锡杖顶部镂空金环与翠玉宝珠
      p.ellipse(stX, stY - 4, 4.4, 4.8, '#ffe066', true);
      p.ellipse(stX, stY - 4, 2.6, 3.0, '#132233');
      p.ellipse(stX, stY - 4, 1.5, 1.5, '#8cfff0', true);
      p.px(stX - 4, stY - 2, '#fff4b8', true);
      p.px(stX + 4, stY - 2, '#fff4b8', true);
      if (pose.slashAlpha > 0.3) {
        p.ellipse(stX + 1, stY - 4, 6.2, 6.2, '#9effef', true);
      }
    },
  },

  /** 生命 T4-A：御柱天马战神（鎏金重甲圣骑士 + 苍蓝翎羽全盔 + 冰蓝雪白装甲天马，彻底去红白巫女！） */
  creature_onbashira_steed: {
    backdropTop: '#0f1833',
    backdropBottom: '#1c2c4f',
    backdropGlow: '#82d4ff',
    avatarCrop: { x: 9, y: 2, size: 28 },
    portraitCrop: { x: 1, y: 2, w: 46, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(21 + pose.leanX * 1.0);
      const by = Math.round(pose.breathY - pose.stepLift * 1.1);
      const st = Math.round(pose.stride * 3.8);
      const fl = Math.round(pose.flutter * 2.0);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 2.8);

      // [部件 1] 冰蓝与珍珠白双色「圣翼天马羽翼」+ 流动雪青马尾
      p.poly([
        [bx - 2, 29 + by],
        [bx - 15, 13 + by + flap],
        [bx - 20, 17 + by + flap],
        [bx - 16, 26 + by + flap],
        [bx - 7, 30 + by],
      ], '#78b0e6');
      p.poly([
        [bx - 2, 28 + by],
        [bx - 14, 15 + by + flap],
        [bx - 18, 19 + by + flap],
        [bx - 13, 25 + by + flap],
        [bx - 6, 28 + by],
      ], '#f5fbff', true);
      p.line(bx - 3, 27 + by, bx - 15, 14 + by + flap, '#a8e8ff', 1, true);
      p.poly([[bx - 10, 32 + by], [bx - 20, 35 + by + fl], [bx - 18, 42 + by + fl], [bx - 9, 36 + by]], '#9ec4eb');
      p.poly([[bx - 10, 33 + by], [bx - 18, 35 + by + fl], [bx - 16, 39 + by + fl], [bx - 9, 35 + by]], '#ffffff');

      // [部件 2] 扬蹄冲锋的四肢（黄金马蹄 + 珍珠白冷银阴影）
      p.line(bx - 7, 36 + by, bx - 11 - st, 47, '#aebad4', 3);
      p.line(bx + 6, 35 + by, bx + 9 + st, 47, '#c2cee6', 3);
      p.poly([[bx - 10, 33 + by], [bx - 4, 34 + by], [bx - 6 + st, 41], [bx - 10 + st, 41]], '#e3ecfa');
      p.line(bx - 8 + st, 40, bx - 6 + st, 47, '#ffffff', 2);
      p.rect(bx - 7 + st, 46, 3, 2, '#e6b84c');
      const hoofLift = pose.armAction >= 0.5 ? -4 : -2;
      p.poly([[bx + 5, 32 + by], [bx + 10, 32 + by], [bx + 14 - st, 38 + hoofLift], [bx + 10 - st, 39 + hoofLift]], '#ffffff');
      p.line(bx + 12 - st, 38 + hoofLift, bx + 11 - st, 44 + hoofLift, '#e3ecfa', 2);
      p.rect(bx + 10 - st, 43 + hoofLift, 3, 2, '#ffe073');

      // [部件 3] 俊美神驹躯体 + 皇家苍蓝镶金骑士马衣（HoMM4 Champion 经典蓝金马铠！）
      p.ellipse(bx - 1, 33 + by, 11.8, 5.8, '#c7d4eb');
      p.ellipse(bx - 1, 32 + by, 10.6, 4.8, '#ffffff');
      p.poly([[bx - 8, 29 + by], [bx + 8, 29 + by], [bx + 9, 37 + by], [bx - 8, 37 + by]], '#1c4a9e');
      p.poly([[bx - 6, 29 + by], [bx + 6, 29 + by], [bx + 7, 36 + by], [bx - 6, 36 + by]], '#3882eb');
      p.hline(bx - 7, 36 + by, 16, '#ffe073');
      p.rect(bx - 1, 31 + by, 3, 3, '#fff5b8', true);

      // [部件 4] 昂首白玉马颈、冰青飘逸马鬃与鎏金马额甲
      p.poly([[bx + 5, 32 + by], [bx + 10, 21 + by], [bx + 15, 22 + by], [bx + 10, 34 + by]], '#dce7f7');
      p.poly([[bx + 7, 31 + by], [bx + 11, 22 + by], [bx + 14, 23 + by], [bx + 10, 32 + by]], '#ffffff');
      p.poly([[bx + 5, 27 + by], [bx + 9, 20 + by], [bx + 12, 21 + by], [bx + 8, 29 + by]], '#80d8ff');
      p.poly([[bx + 10, 20 + by], [bx + 19, 23 + by], [bx + 18, 27 + by], [bx + 10, 26 + by]], '#ffffff');
      p.hline(bx + 11, 26 + by, 7, '#b5c6e0');
      p.poly([[bx + 10, 20 + by], [bx + 12, 16 + by], [bx + 14, 20 + by]], '#ffffff');
      p.line(bx + 12, 21 + by, bx + 18, 24 + by, '#ffe066', 2);
      p.px(bx + 14, 22 + by, '#29d4ff', true);

      // [部件 5] 全身鎏金重甲「天穹冠军圣骑士」（飘扬苍蓝长羽饰全盔 + 黄金胸铠 + 皇家蓝披风！）
      p.poly([[bx - 4, 21 + by], [bx - 17 + fl, 24 + by], [bx - 15 + fl, 29 + by], [bx - 3, 27 + by]], '#2462c9');
      p.hline(bx - 16 + fl, 28 + by, 11, '#ffe073');
      // 黄金板甲胸铠与肩甲
      p.rect(bx - 4, 21 + by, 8, 9, '#c98e28');
      p.rect(bx - 3, 22 + by, 6, 7, '#f5c74c');
      p.vline(bx, 22 + by, 7, '#fff5b8');
      p.ellipse(bx - 4, 22 + by, 2.6, 2.2, '#ffe478');
      // 帅气鎏金羽翼骑士全盔 + 迎风飘荡的苍蓝长鬃羽！
      const hy = 15 + by;
      p.poly([[bx - 3, hy - 5], [bx - 14 + fl, hy - 7], [bx - 12 + fl, hy - 1], [bx - 4, hy - 1]], '#4da6ff', true);
      p.line(bx - 4, hy - 5, bx - 13 + fl, hy - 6, '#b8e8ff', 1, true);
      p.ellipse(bx, hy, 4.6, 4.4, '#d99e2e');
      p.ellipse(bx, hy - 0.5, 3.8, 3.6, '#ffe473');
      p.hline(bx - 2, hy - 3, 5, '#ffffff');
      // 骑士面甲幽蓝目镜光缝
      p.hline(bx, hy, 4, '#1b2c52');
      p.hline(bx + 1, hy, 3, '#78ecff', true);
      // 盔侧白金小翼饰
      p.poly([[bx - 3, hy - 3], [bx - 7, hy - 8], [bx - 1, hy - 5]], '#ffffff', true);

      // [部件 6] 裹苍蓝战旗的「御柱破魔骑士长枪」（高举斜前刺，气势如虹！）
      const thrust = pose.armAction >= 0.6 ? 4 : pose.armAction <= -0.5 ? -3 : 0;
      p.line(bx - 5 + thrust, 24 + by, bx + 19 + thrust, 11 + by, '#9c6826', 3);
      p.line(bx - 5 + thrust, 23 + by, bx + 19 + thrust, 10 + by, '#ffe073', 1);
      // 枪尖下方飘扬的苍蓝鎏金骑士三角旗
      p.poly([
        [bx + 11 + thrust, 15 + by],
        [bx + 17 + thrust, 12 + by],
        [bx + 12 + thrust, 20 + by + Math.round(fl * 0.4)],
      ], '#3888f0', true);
      p.px(bx + 13 + thrust, 15 + by, '#ffe880', true);
      // 璀璨星银长枪刃
      p.poly([
        [bx + 17 + thrust, 9 + by],
        [bx + 25 + thrust, 8 + by],
        [bx + 19 + thrust, 14 + by],
      ], '#d9f2ff', true);
      p.line(bx + 18 + thrust, 11 + by, bx + 24 + thrust, 8 + by, '#ffffff', 1, true);
      if (pose.slashAlpha > 0.3) {
        p.line(bx + 14, 13 + by, bx + 26, 7 + by, '#a6f0ff', 2, true);
      }
    },
  },

  /** 生命 T4-B：博丽大结界神使（炽光圣咏六翼大天使 · 铂银长发 + 鎏金胸甲圣袍 + 烈焰大天使圣剑！） */
  creature_hakurei_seraph: {
    backdropTop: '#10142e',
    backdropBottom: '#231e42',
    backdropGlow: '#fff0a6',
    avatarCrop: { x: 10, y: 4, size: 28 },
    portraitCrop: { x: 1, y: 2, w: 46, h: 49 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(24 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 1.5 - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 3.0);

      // [部件 1] 阶梯羽瓣雕刻感「六翼炽光大天使羽翼」（纯白×暖金×天青虹彩！）
      const drawFeatheredWing = (
        yBase: number,
        span: number,
        lift: number,
        shadow: string,
        main: string,
        tip: string,
      ) => {
        for (const dir of [-1, 1]) {
          p.poly([
            [bx + dir * 4, yBase],
            [bx + dir * span, yBase - lift],
            [bx + dir * (span - 2), yBase - lift + 5],
            [bx + dir * (span - 5), yBase - lift + 9],
            [bx + dir * 5, yBase + 5],
          ], shadow);
          p.poly([
            [bx + dir * 4, yBase],
            [bx + dir * (span - 1), yBase - lift + 1],
            [bx + dir * (span - 3), yBase - lift + 4],
            [bx + dir * (span - 6), yBase - lift + 7],
            [bx + dir * 5, yBase + 4],
          ], main, true);
          p.line(bx + dir * 5, yBase, bx + dir * (span - 1), yBase - lift + 1, tip, 1, true);
          p.px(bx + dir * (span + 1), yBase - lift - 1, tip, true);
        }
      };
      drawFeatheredWing(21 + by, 20, 10 - flap, '#99b5db', '#ffffff', '#a8f0ff');
      drawFeatheredWing(27 + by, 18, 2 + flap, '#bfa478', '#fff5cc', '#ffffff');
      drawFeatheredWing(33 + by, 13, -5 - flap, '#8ea4c9', '#d9f2ff', '#ffe885');

      // [部件 2] 飘逸天青鎏金「炽天使羽衣天带」
      p.line(bx - 12, 23 + by + sway, bx - 7, 29 + by, '#70dcff', 2, true);
      p.line(bx + 12, 23 + by - sway, bx + 7, 29 + by, '#70dcff', 2, true);
      p.line(bx - 12, 22 + by + sway, bx - 16, 30 + by + sway, '#ffe680', 1, true);
      p.line(bx + 12, 22 + by - sway, bx + 16, 30 + by - sway, '#ffe680', 1, true);

      // [部件 3] 丝滑铂金银白长发后发（与灵梦黑发、魔理沙金发截然不同！）
      p.poly([[bx - 7, 17 + by], [bx + 7, 17 + by], [bx + 10 - sway, 34 + by], [bx - 10 + sway, 34 + by]], '#94a6c7');
      p.rect(bx - 5, 19 + by, 10, 13, '#e3eeff');

      // [部件 4] 纯白鎏金大天使圣礼长袍 + 黄金束腰羽纹护胸（彻底去红白条！）
      p.rect(bx - 3, 45 + by, 2, 3, '#ffe9d9');
      p.rect(bx + 1, 46 + by, 2, 3, '#ffe9d9');
      const sk = Math.round(sway * 0.6);
      p.poly([[bx - 4, 31 + by], [bx + 4, 31 + by], [bx + 9 + sk, 45 + by], [bx - 9 + sk, 45 + by]], '#d2dff2');
      p.poly([[bx - 3, 31 + by], [bx + 3, 31 + by], [bx + 7 + sk, 44 + by], [bx - 7 + sk, 44 + by]], '#ffffff');
      // 中央淡天青鎏金星纹圣带
      p.poly([[bx - 2, 31 + by], [bx + 2, 31 + by], [bx + 3 + sk, 44 + by], [bx - 3 + sk, 44 + by]], '#3b82d6');
      p.vline(bx, 32 + by, 12, '#ffe880', true);
      p.hline(bx - 8 + sk, 44 + by, 16, '#ffe073');
      // 黄金羽翼雕纹大天使胸甲
      p.rect(bx - 4, 25 + by, 8, 7, '#e6b23e');
      p.rect(bx - 3, 26 + by, 6, 5, '#ffe880');
      p.px(bx, 27 + by, '#9ef0ff', true);
      p.poly([[bx - 4, 26 + by], [bx - 10, 31 + by], [bx - 8, 35 + by], [bx - 4, 32 + by]], '#f5f9ff');

      // [部件 5] 纤细星光圣环 + 圣洁绝美铂银长发大天使面庞
      const headY = 17 + by;
      p.hline(bx - 5, headY - 10, 10, '#ffe878', true);
      p.px(bx - 6, headY - 9, '#a8f0ff', true);
      p.px(bx + 6, headY - 9, '#a8f0ff', true);
      p.hline(bx - 4, headY - 8, 8, '#fff8d6', true);
      p.px(bx, headY - 11, '#ffffff', true);

      drawAnimeHeadBase(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#266cd9', '#9ef0ff', pose);
      drawSoftHairCrown(p, bx, headY, '#8e9fc2', '#c7d6f0', '#eef5ff', '#ffffff');
      p.rect(bx - 6, headY - 2, 2, 11, '#b0c2e0');
      p.rect(bx + 5, headY - 2, 2, 11, '#b0c2e0');
      // 黄金天使星冠
      p.hline(bx - 4, headY - 6, 8, '#ffe066', true);
      p.px(bx, headY - 7, '#ffffff', true);

      // [部件 6] 右手高擎「烈焰辉光大天使圣剑」（经典 HoMM4 Angel 灵魂神兵！）
      const swX = bx + 11 + Math.round(pose.armAction * 3);
      const swY = 16 + by - Math.round(pose.armAction * 4);
      p.line(bx + 4, 28 + by, swX - 1, swY + 9, '#f5f9ff', 2);
      p.rect(swX - 2, swY + 8, 2, 2, '#ffe4cf');
      // 圣剑金柄与宽大天使双翼护手
      p.vline(swX - 1, swY + 9, 5, '#d49428');
      p.hline(swX - 4, swY + 8, 7, '#ffe478', true);
      // 熊熊燃烧白金天火的大剑剑刃！
      p.line(swX - 1, swY + 7, swX, swY - 9, '#ff942b', 3, true);
      p.line(swX - 1, swY + 7, swX, swY - 9, '#ffe878', 2, true);
      p.line(swX - 1, swY + 6, swX, swY - 8, '#ffffff', 1, true);
      p.px(swX + 2, swY - 5 + sway, '#ffe880', true);
      p.px(swX - 3, swY - 2 - sway, '#9ef0ff', true);
      if (pose.slashAlpha > 0.3) {
        p.line(swX + 2, swY - 8, swX + 10, swY + 10, '#fff7cc', 2, true);
      }
    },
  },

  // =========================================================================
  // 二、魔法使派系 · 混沌系精雕 6 位像素立绘
  // =========================================================================

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

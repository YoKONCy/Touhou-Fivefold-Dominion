/**
 * 100% 纯代码零静态资源 · 骨骼解构多状态动画像素立绘引擎（48×54 精雕战棋三头身）
 *
 * 架构亮点：
 * - 单一纯代码像素画风源：战场棋子、顶部裁剪头像、右侧徽章、居中大详情动态立绘、魔导书与符卡特写同源共享！
 * - 真正的人物/造物部件解构（Rig Decomposition）：
 *   每个单位均由独立后景饰件、双腿（迈步行走周期）、躯干与衣摆（呼吸起伏与前倾冲锋）、
 *   独立双臂与手持武器（蓄力高举 → 挥击突刺+光弧残影 → 收招）、头部与五官（自然眨眼/战意/受击表情）组装而成！
 * - 统一在部件组装后执行 1px 深靛黑像素外轮廓与独立自发光层烘焙，彻底杜绝旋转错位像素（Mixels）！
 */

import * as PIXI from 'pixi.js';
import { FACTION_RIG_SPECS } from './factionSprites';
import { HD_DEATH_FACTION_RIG_SPECS } from './hdDeathFactionSprites';
import { HD_LIFE_FACTION_RIG_SPECS } from './hdLifeFactionSprites';
import { HD_ORDER_FACTION_RIG_SPECS } from './hdOrderFactionSprites';
import { HD_HERO_REIMU_SPEC, HD_HERO_REMILIA_SPEC } from './hdHeroSprites';
import { renderHdRigFrameToRgba, type HdPixelPainter } from './hdPixelEngine';

export type SpriteAnimState = 'idle' | 'move' | 'attack' | 'hit';

export interface SpriteFrameTextures {
  body: PIXI.Texture;
  glow: PIXI.Texture;
  flash: PIXI.Texture;
}

export interface BakedVoxelSpriteSet {
  /** 兼容默认静帧（取 idle 第 0 帧） */
  rightBody: PIXI.Texture;
  leftBody: PIXI.Texture;
  rightGlow: PIXI.Texture;
  leftGlow: PIXI.Texture;
  rightFlash: PIXI.Texture;
  leftFlash: PIXI.Texture;
  /** 按朝向与动作状态分组的完整多帧动画表 */
  animations: Record<'right' | 'left', Record<SpriteAnimState, SpriteFrameTextures[]>>;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  /** 战场渲染归一缩放倍率（48×54 旧版为 1.0；64×72 新版为 0.78，确保物理身高统一且细节翻倍） */
  renderScale?: number;
  /** 待机首帧真实非透明像素最顶端距脚底锚点的缩放后高度（供头顶箭头、点击盒与飘字精准定位，绝不压帽挡脸） */
  visualHeadHeight: number;
}

export interface PixelPainter {
  px: (x: number, y: number, color: string, emissive?: boolean) => void;
  rect: (x: number, y: number, w: number, h: number, color: string, emissive?: boolean) => void;
  hline: (x: number, y: number, len: number, color: string, emissive?: boolean) => void;
  vline: (x: number, y: number, len: number, color: string, emissive?: boolean) => void;
  ellipse: (cx: number, cy: number, rx: number, ry: number, color: string, emissive?: boolean) => void;
  poly: (pts: Array<[number, number]>, color: string, emissive?: boolean) => void;
  /** 像素线段（用于挥动武器柄、飘带与利刃光弧） */
  line: (x0: number, y0: number, x1: number, y1: number, color: string, thickness?: number, emissive?: boolean) => void;
}

/** 驱动全身骨骼解构部件的参数化姿态帧 */
export interface RigPose {
  state: SpriteAnimState;
  /** 本状态内帧序号 0..N-1 */
  frame: number;
  /** 0..1 归一化相位 */
  phase: number;
  /** 躯干呼吸竖直偏移（像素） */
  breathY: number;
  /** 身体前倾/后仰水平偏移（正值朝前、负值后撤） */
  leanX: number;
  /** 左/右腿迈步相位（-1..+1） */
  stride: number;
  /** 走路起伏弹跳 */
  stepLift: number;
  /** 飘带/头发/翅膀/尾焰次级波动相位 */
  flutter: number;
  /** 手臂与武器动作：0=自然垂放，-1=蓄力高举后拉，+1=向前挥击突刺，+0.5=收招 */
  armAction: number;
  /** 是否处于眨眼瞬间 */
  blink: boolean;
  /** 面部神态：normal / focus(攻防专注) / hurt(受击紧闭) */
  expr: 'normal' | 'focus' | 'hurt';
  /** 攻击挥砍光弧强度 0..1 */
  slashAlpha: number;
}

export interface SpriteRigSpec {
  /** 可选自定义画布尺寸与锚点（缺省为旧版 48×54；新一代精雕模型为 64×72） */
  width?: number;
  height?: number;
  originX?: number;
  originY?: number;
  renderScale?: number;
  backdropTop: string;
  backdropBottom: string;
  backdropGlow: string;
  avatarCrop: { x: number; y: number; size: number };
  portraitCrop: { x: number; y: number; w: number; h: number };
  draw: (p: PixelPainter, pose: RigPose) => void;
  /** 新一代零抗锯齿 + 部件分层自动内描边精雕绘谱入口（优先于旧版 draw） */
  hdDraw?: (p: HdPixelPainter, pose: RigPose) => void;
}

const SPRITE_WIDTH = 48;
const SPRITE_HEIGHT = 54;
const ORIGIN_X = 24;
const ORIGIN_Y = 49;

/** 构建 4 大动作状态的精确骨骼动画关键帧序列 */
function buildPoseSequence(state: SpriteAnimState): RigPose[] {
  if (state === 'idle') {
    // 6 帧循环：轻柔胸腔呼吸 + 飘带羽翼次级律动 + 第 4 帧自然眨眼！
    return [
      { state, frame: 0, phase: 0 / 6, breathY: 0, leanX: 0, stride: 0, stepLift: 0, flutter: 0, armAction: 0, blink: false, expr: 'normal', slashAlpha: 0 },
      { state, frame: 1, phase: 1 / 6, breathY: -0.6, leanX: 0, stride: 0, stepLift: 0, flutter: 0.7, armAction: 0.08, blink: false, expr: 'normal', slashAlpha: 0 },
      { state, frame: 2, phase: 2 / 6, breathY: -1.1, leanX: 0.4, stride: 0, stepLift: 0, flutter: 1.0, armAction: 0.14, blink: false, expr: 'normal', slashAlpha: 0 },
      { state, frame: 3, phase: 3 / 6, breathY: -0.8, leanX: 0.2, stride: 0, stepLift: 0, flutter: 0.3, armAction: 0.08, blink: false, expr: 'normal', slashAlpha: 0 },
      { state, frame: 4, phase: 4 / 6, breathY: -0.2, leanX: 0, stride: 0, stepLift: 0, flutter: -0.6, armAction: -0.05, blink: true, expr: 'normal', slashAlpha: 0 },
      { state, frame: 5, phase: 5 / 6, breathY: 0.2, leanX: -0.2, stride: 0, stepLift: 0, flutter: -0.9, armAction: -0.08, blink: false, expr: 'normal', slashAlpha: 0 },
    ];
  }
  if (state === 'move') {
    // 4 帧完整迈步/振翅冲刺循环：左脚前跨 → 过渡腾空 → 右脚前跨 → 过渡腾空
    return [
      { state, frame: 0, phase: 0.0, breathY: -0.5, leanX: 2.2, stride: 1.0, stepLift: 0, flutter: 1.0, armAction: 0.35, blink: false, expr: 'focus', slashAlpha: 0 },
      { state, frame: 1, phase: 0.25, breathY: -1.6, leanX: 2.6, stride: 0.2, stepLift: 1.8, flutter: 0.2, armAction: 0.1, blink: false, expr: 'focus', slashAlpha: 0 },
      { state, frame: 2, phase: 0.5, breathY: -0.5, leanX: 2.2, stride: -1.0, stepLift: 0, flutter: -1.0, armAction: -0.35, blink: false, expr: 'focus', slashAlpha: 0 },
      { state, frame: 3, phase: 0.75, breathY: -1.6, leanX: 2.6, stride: -0.2, stepLift: 1.8, flutter: -0.2, armAction: -0.1, blink: false, expr: 'focus', slashAlpha: 0 },
    ];
  }
  if (state === 'attack') {
    // 4 帧打击感经典四段：蓄力抬手后拉 → 猛然前倾挥击+像素剑气 → 满力释放定格 → 优雅收招
    return [
      { state, frame: 0, phase: 0.0, breathY: -1.2, leanX: -2.4, stride: -0.7, stepLift: 0.5, flutter: -1.0, armAction: -1.0, blink: false, expr: 'focus', slashAlpha: 0 },
      { state, frame: 1, phase: 0.35, breathY: 0.6, leanX: 4.0, stride: 1.1, stepLift: 0, flutter: 1.2, armAction: 1.0, blink: false, expr: 'focus', slashAlpha: 1.0 },
      { state, frame: 2, phase: 0.7, breathY: 0.3, leanX: 3.0, stride: 0.9, stepLift: 0, flutter: 0.8, armAction: 0.85, blink: false, expr: 'focus', slashAlpha: 0.6 },
      { state, frame: 3, phase: 1.0, breathY: -0.3, leanX: 0.8, stride: 0.3, stepLift: 0, flutter: 0.2, armAction: 0.25, blink: false, expr: 'normal', slashAlpha: 0 },
    ];
  }
  // hit：2 帧受击后仰皱眉
  return [
    { state, frame: 0, phase: 0.0, breathY: 1.0, leanX: -3.2, stride: -0.5, stepLift: 0, flutter: -1.1, armAction: -0.65, blink: true, expr: 'hurt', slashAlpha: 0 },
    { state, frame: 1, phase: 0.6, breathY: 0.5, leanX: -1.6, stride: -0.2, stepLift: 0, flutter: -0.4, armAction: -0.3, blink: true, expr: 'hurt', slashAlpha: 0 },
  ];
}

/** 绘制通用精致像素少女五官（精准 3/4 右向东方萌系大瞳：水润双高光 + 内收柔腮 + 微笑/眨眼/受击 > <） */
export function drawChibiFaceEyes(
  p: PixelPainter,
  cx: number,
  cy: number,
  irisDark: string,
  irisLight: string,
  pose: RigPose,
): void {
  if (pose.expr === 'hurt') {
    // 受击紧闭 > <（严格收于脸颊内侧，绝不越界！）
    p.px(cx - 3, cy - 1, '#261433');
    p.px(cx - 2, cy, '#261433');
    p.px(cx - 3, cy + 1, '#261433');
    p.px(cx + 2, cy - 1, '#261433');
    p.px(cx + 1, cy, '#261433');
    p.px(cx + 2, cy + 1, '#261433');
    p.px(cx - 4, cy + 2, '#ff9cb3');
    p.px(cx + 3, cy + 2, '#ff9cb3');
    p.hline(cx - 1, cy + 2, 2, '#c25764');
    return;
  }
  if (pose.blink) {
    // 温柔笑眼弯弧
    p.hline(cx - 3, cy + 1, 2, '#2b1838');
    p.hline(cx + 1, cy + 1, 2, '#2b1838');
    p.px(cx - 4, cy, '#593b6b');
    p.px(cx + 3, cy, '#593b6b');
    p.px(cx - 4, cy + 2, '#ffa1b8');
    p.px(cx + 3, cy + 2, '#ffa1b8');
    p.px(cx - 1, cy + 2, '#d47480');
    return;
  }

  // 2×3 经典 16-bit 日系宝石大瞳（深邃瞳仁 + 晶亮高光 + 浓郁虹膜下沿，彻底告别发白眯眼！）
  // 上沿深邃睫线
  p.hline(cx - 3, cy - 1, 2, '#1f102e');
  p.hline(cx + 1, cy - 1, 2, '#1f102e');
  // 中排：左上纯白星光高光 + 右侧浓郁深瞳核心
  p.px(cx - 3, cy, '#ffffff');
  p.px(cx - 2, cy, pose.expr === 'focus' ? '#140821' : '#241136');
  p.px(cx + 1, cy, '#ffffff');
  p.px(cx + 2, cy, pose.expr === 'focus' ? '#140821' : '#241136');
  // 下排：饱满宝石主色 + 亮色虹膜反光
  p.px(cx - 3, cy + 1, irisDark);
  p.px(cx - 2, cy + 1, irisLight);
  p.px(cx + 1, cy + 1, irisDark);
  p.px(cx + 2, cy + 1, irisLight);

  // 内收樱粉柔腮与精致小嘴
  p.px(cx - 4, cy + 2, '#ff99b3');
  p.px(cx + 3, cy + 2, '#ff99b3');
  p.px(cx - 1, cy + 2, pose.expr === 'focus' ? '#b34655' : '#d16b78');
  if (pose.expr !== 'focus') {
    p.px(cx, cy + 2, '#eb99a3');
  }
}

/**
 * 全部 9 位东方角色与兵种的骨骼解构多态动画绘谱（画布 48×54，脚底锚点 24, 49，默认朝右）
 */
export const RIG_SPECS: Record<string, SpriteRigSpec> = {
  /** 1. 博丽灵梦：精雕秀气三头身巫女立绘 + 立体双飘带博丽大蝴蝶结 + 分体宽振袖与锯齿大御币 + 环绕双色灵力勾玉！ */
  hero_reimu: {
    backdropTop: '#161029',
    backdropBottom: '#33162e',
    backdropGlow: '#ff5274',
    avatarCrop: { x: 10, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p, pose) => {
      const isAtk = pose.state === 'attack';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      // 攻击爆发时略微左收基准位，保证大御币挥斩光弧与双勾玉完整落于画布内零裁切
      const bx = isAtk && (f === 1 || f === 2)
        ? 21
        : isAtk && f === 0
          ? 20
          : Math.round(23 + pose.leanX * 0.75);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const legStride = Math.round(pose.stride * 3.8);

      // 辅助绘制精雕 C 形东方「灵力勾玉（曲玉）」：7×7 清晰丰满的圆润玉首 + 灵孔 + 优雅弯月钩尾（极高辨识度！）
      const drawMagatama = (
        cx: number,
        cy: number,
        bodyDark: string,
        bodyMain: string,
        bodyHigh: string,
        holeColor: string,
        flipTail: 1 | -1,
      ) => {
        // 圆润饱满玉首（上端）
        p.ellipse(cx, cy - 1.6, 2.6, 2.4, bodyDark, true);
        p.ellipse(cx, cy - 1.9, 2.0, 1.8, bodyMain, true);
        p.px(cx - 1, cy - 2, bodyHigh, true);
        p.px(cx, cy - 3, bodyHigh, true);
        // 优雅回勾的 C 形曲玉尾弧（中段渐细，尾尖微翘！）
        p.rect(cx + 1 * flipTail, cy, 2, 2, bodyDark, true);
        p.px(cx + 2 * flipTail, cy + 1, bodyMain, true);
        p.px(cx + 1 * flipTail, cy + 1, bodyMain, true);
        p.px(cx + 2 * flipTail, cy + 2, bodyDark, true);
        p.px(cx + 1 * flipTail, cy + 2, bodyMain, true);
        p.px(cx, cy + 3, bodyDark, true);
        p.px(cx, cy + 2, bodyMain, true);
        p.px(cx - 1 * flipTail, cy + 3, bodyMain, true);
        p.px(cx - 2 * flipTail, cy + 2, bodyHigh, true);
        // 玉首中央晶亮灵孔
        p.px(cx, cy - 1, holeColor, true);
      };

      // [部件 1] 后景轻盈随风飘散的「博丽大红蝴蝶结」（精致立体褶皱 + 白滚边 + 灵动收拢垂带，留足勾玉净空！）
      const headY = 19 + by;
      const bowY = headY - 7;
      // 飘逸轻盈双垂带（贴近肩后收拢，绝不与外侧勾玉重叠！）
      p.poly([
        [bx - 7, bowY + 3],
        [bx - 5, bowY + 3],
        [bx - 8 + Math.round(sway * 0.6), bowY + 10],
        [bx - 10 + Math.round(sway * 0.6), bowY + 9],
      ], '#9c1732');
      p.line(bx - 6, bowY + 4, bx - 9 + Math.round(sway * 0.6), bowY + 9, '#e63956', 1);
      p.poly([
        [bx + 5, bowY + 3],
        [bx + 7, bowY + 3],
        [bx + 10 - Math.round(sway * 0.6), bowY + 9],
        [bx + 8 - Math.round(sway * 0.6), bowY + 10],
      ], '#b51e3c');
      p.line(bx + 6, bowY + 4, bx + 9 - Math.round(sway * 0.6), bowY + 9, '#ff5c78', 1);

      // 立体左结耳（优雅收腰蝶翼形）
      p.poly([
        [bx - 10, bowY - 2 + Math.round(sway * 0.5)],
        [bx - 2, bowY + 1],
        [bx - 2, bowY + 4],
        [bx - 11, bowY + 4 + Math.round(sway * 0.5)],
      ], '#b51b38');
      p.poly([
        [bx - 9, bowY - 1 + Math.round(sway * 0.5)],
        [bx - 3, bowY + 1],
        [bx - 9, bowY + 3 + Math.round(sway * 0.5)],
      ], '#f03e5c');
      p.hline(bx - 9, bowY - 1 + Math.round(sway * 0.5), 4, '#ff8599');
      p.vline(bx - 10, bowY - 1 + Math.round(sway * 0.5), 4, '#fff5eb');

      // 立体右结耳
      p.poly([
        [bx + 10, bowY - 2 - Math.round(sway * 0.5)],
        [bx + 2, bowY + 1],
        [bx + 2, bowY + 4],
        [bx + 11, bowY + 4 - Math.round(sway * 0.5)],
      ], '#cc2142');
      p.poly([
        [bx + 9, bowY - 1 - Math.round(sway * 0.5)],
        [bx + 3, bowY + 1],
        [bx + 9, bowY + 3 - Math.round(sway * 0.5)],
      ], '#ff4f6d');
      p.hline(bx + 5, bowY - 1 - Math.round(sway * 0.5), 4, '#ff9eb0');
      p.vline(bx + 10, bowY - 1 - Math.round(sway * 0.5), 4, '#fff5eb');

      // [部件 2] 柔顺分缕后垂乌黑长发（自然收腰飘尾，绝非方块黑板！）
      p.poly([
        [bx - 6, headY],
        [bx + 6, headY],
        [bx + 8 - sway, 31 + by],
        [bx + 4 - sway, 34 + by],
        [bx - 4 + sway, 34 + by],
        [bx - 8 + sway, 31 + by],
      ], '#1b1226');
      p.poly([
        [bx - 5, headY + 1],
        [bx + 5, headY + 1],
        [bx + 6 - sway, 30 + by],
        [bx - 6 + sway, 30 + by],
      ], '#2b1d3b');
      p.vline(bx - 4, headY + 3, 9, '#483263');
      p.vline(bx + 4, headY + 3, 8, '#3b2852');

      // [部件 3] 独立迈步白足袋与朱红系带草履
      const backLegX = bx - 4 - legStride;
      const frontLegX = bx + 2 + legStride;
      const backLegLift = pose.stride > 0.3 ? -2 : 0;
      const frontLegLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(backLegX, 42 + backLegLift, 3, 5, '#dfd4ca');
      p.vline(backLegX + 1, 42 + backLegLift, 4, '#f5eee6');
      p.rect(backLegX - 1, 47 + backLegLift, 4, 2, '#991b34');
      p.px(backLegX + 1, 47 + backLegLift, '#fff3e6');
      p.rect(frontLegX, 42 + frontLegLift, 3, 5, '#f5efe8');
      p.vline(frontLegX + 1, 42 + frontLegLift, 4, '#ffffff');
      p.rect(frontLegX, 47 + frontLegLift, 4, 2, '#d42646');
      p.px(frontLegX + 2, 47 + frontLegLift, '#fff3e6');

      // [部件 4] 左手飘逸分体式红白宽振袖（后臂）
      const backArmSwing = isAtk && f === 1 ? -4 : isHit ? -2 : Math.round(-pose.armAction * 3 - pose.stride * 2);
      p.poly([
        [bx - 5, 27 + by],
        [bx - 10 + backArmSwing, 30 + by],
        [bx - 12 + backArmSwing, 37 + by],
        [bx - 6 + Math.round(backArmSwing * 0.4), 36 + by],
      ], '#ebe2d8');
      p.poly([
        [bx - 5, 27 + by],
        [bx - 8 + backArmSwing, 29 + by],
        [bx - 8 + backArmSwing, 33 + by],
        [bx - 5, 32 + by],
      ], '#d42646'); // 标志性分体露肩红袖上缘
      p.hline(bx - 12 + backArmSwing, 36 + by, 6, '#e63250');
      p.rect(bx - 10 + backArmSwing, 37 + by, 2, 2, '#ffe6d4');

      // [部件 5] 华丽百褶朱红巫女长裙 + 逐像素精致白蕾丝波浪衬裙底边
      const skirtSkew = Math.round(-pose.leanX * 0.5 + sway * 0.6);
      p.poly([
        [bx - 5, 33 + by],
        [bx + 5, 33 + by],
        [bx + 11 + skirtSkew, 44 + by],
        [bx - 10 + skirtSkew, 44 + by],
      ], '#9c1832');
      p.poly([
        [bx - 4, 33 + by],
        [bx + 4, 33 + by],
        [bx + 9 + skirtSkew, 43 + by],
        [bx - 8 + skirtSkew, 43 + by],
      ], '#d92948');
      // 精致立体裙褶光影
      p.vline(bx - 5, 35 + by, 7, '#b51d3a');
      p.vline(bx - 2, 34 + by, 8, '#ff617b');
      p.vline(bx + 2, 34 + by, 8, '#ff5470');
      p.vline(bx + 5, 35 + by, 7, '#8c142c');
      // 逐像素波浪白衬裙蕾丝下摆
      for (let x = bx - 10 + skirtSkew; x <= bx + 10 + skirtSkew; x++) {
        p.px(x, 44 + by, '#fff8f0');
        if ((x - bx) % 2 === 0) p.px(x, 45 + by, '#f0dcd5');
      }

      // [部件 6] 修身洁白巫女上衣 + 鲜红交领与立体胸口大蝴蝶结 + 金边腰带
      p.poly([
        [bx - 4, 25 + by],
        [bx + 4, 25 + by],
        [bx + 5, 33 + by],
        [bx - 5, 33 + by],
      ], '#f2eae0');
      p.rect(bx - 3, 26 + by, 5, 6, '#ffffff');
      // 绯红交领
      p.line(bx - 3, 25 + by, bx, 28 + by, '#d92948', 1);
      p.line(bx + 3, 25 + by, bx, 28 + by, '#f03e5c', 1);
      // 胸口精致红领结 + 鎏金胸铃点缀
      p.rect(bx - 2, 27 + by, 5, 2, '#e62e4f');
      p.px(bx, 28 + by, '#ffe478', true);
      p.px(bx - 1, 29 + by, '#ff6e87');
      p.px(bx + 1, 29 + by, '#c91f3d');
      // 绯红束腰带 + 纤细金缘
      p.hline(bx - 5, 33 + by, 10, '#a61934');
      p.hline(bx - 4, 32 + by, 8, '#ffe073');
      p.px(bx, 33 + by, '#ff6e87');

      // [部件 7] 精致秀气三头身少女头部 + 水润赤红大瞳 + 圆润流线发冠与分缕刘海 + 红白双发筒！
      p.rect(bx - 1, headY + 4, 3, 3, '#e0ac92'); // 秀气细颈
      p.ellipse(bx, headY, 5.2, 4.9, '#ffe9d9');
      p.hline(bx - 3, headY + 4, 7, '#ebb99d');
      p.px(bx - 4, headY + 3, '#f2c5aa');
      p.px(bx + 4, headY + 3, '#f2c5aa');
      drawChibiFaceEyes(p, bx + 1, headY, '#a61836', '#ff7a92', pose);
      // 柔顺圆弧乌黑发冠（彻底替代方盒锅盖头！）
      p.ellipse(bx, headY - 4.4, 6.0, 3.4, '#1f142b');
      p.ellipse(bx, headY - 4.8, 5.0, 2.5, '#312145');
      p.hline(bx - 4, headY - 6, 8, '#5a407a');
      p.hline(bx - 2, headY - 7, 4, '#9a80ba');
      // 轻盈自然分缕刘海（绝不遮眼、柔化额头！）
      p.px(bx - 5, headY - 2, '#1f142b');
      p.px(bx - 3, headY - 2, '#312145');
      p.px(bx, headY - 2, '#1f142b');
      p.px(bx + 3, headY - 2, '#312145');
      p.px(bx + 5, headY - 2, '#1f142b');
      // 贴颊轻盈双鬓 + 标志性红白发筒（纤细清雅，绝不厚重夹脸！）
      p.vline(bx - 6, headY - 2, 10, '#241733');
      p.vline(bx - 5, headY - 1, 7, '#3b2852');
      p.vline(bx + 5, headY - 2, 10, '#241733');
      p.vline(bx + 6, headY - 1, 7, '#3b2852');
      // 红白发管结
      p.rect(bx - 6, headY + 3, 2, 2, '#e63250');
      p.hline(bx - 6, headY + 2, 2, '#ffffff');
      p.hline(bx - 6, headY + 5, 2, '#ffffff');
      p.rect(bx + 5, headY + 3, 2, 2, '#e63250');
      p.hline(bx + 5, headY + 2, 2, '#ffffff');
      p.hline(bx + 5, headY + 5, 2, '#ffffff');
      // 蝴蝶结中心结扣（稳坐发冠后上方，不压扁发顶圆弧）
      p.rect(bx - 1, bowY, 3, 2, '#d92948');
      p.px(bx, bowY, '#ff8599');

      // [部件 8] 前臂飘逸振袖 + 精雕长柄「博丽大御币」（带多层 Z 字锯齿雪白纸垂 + 绝不挡脸！）
      const shX = bx + 4;
      const shY = 27 + by;
      let handX = bx + 9;
      let handY = 30 + by;
      let tipX = bx + 14;
      let tipY = 16 + by;

      if (isAtk && f === 0) {
        // 蓄力帧：优雅向右上方高举大御币，完全避开脸部！
        handX = bx + 9;
        handY = 22 + by;
        tipX = bx + 12;
        tipY = 7 + by;
      } else if (isAtk && f === 1) {
        // 挥斩帧 1：向前大弧横扫，放出朱金破魔新月光弧！
        handX = bx + 11;
        handY = 29 + by;
        tipX = bx + 20;
        tipY = 32 + by;
      } else if (isAtk && f === 2) {
        // 挥斩帧 2：御币上扬余韵收势
        handX = bx + 10;
        handY = 26 + by;
        tipX = bx + 18;
        tipY = 20 + by;
      } else if (isHit) {
        handX = bx + 8;
        handY = 29 + by;
        tipX = bx + 14;
        tipY = 17 + by;
      } else {
        handX = bx + 8 + Math.round(pose.stride * 1.6);
        handY = 30 + by - Math.round(pose.armAction * 2);
        tipX = handX + 5;
        tipY = handY - 13;
      }

      // 分体露肩红白前振袖 + 手掌
      p.poly([
        [shX, shY - 1],
        [handX, handY - 2],
        [handX - 1, handY + 5],
        [shX - 1, shY + 5],
      ], '#faf5ed');
      p.poly([
        [shX, shY - 1],
        [shX + 3, shY],
        [shX + 3, shY + 3],
        [shX, shY + 3],
      ], '#e63250');
      p.line(shX - 1, shY + 5, handX - 1, handY + 5, '#e63553', 1);
      p.rect(handX - 1, handY - 1, 2, 2, '#ffe6d4');

      // 博丽大御币朱木长柄 + 金箍
      p.line(
        Math.round(handX - (tipX - handX) * 0.25),
        Math.round(handY - (tipY - handY) * 0.25),
        tipX,
        tipY,
        '#9c6533',
        2,
      );
      p.line(handX, handY, tipX, tipY, '#d99e5b', 1);
      p.px(tipX, tipY, '#ffe073', true);
      // 标志性多层 Z 字锯齿雪白纸垂（しで，彻底取代白馒头！）
      const shideX = tipX;
      const shideY = tipY;
      p.rect(shideX, shideY + 1, 3, 2, '#ffffff', true);
      p.rect(shideX + 2, shideY + 3, 3, 2, '#fff5e6', true);
      p.rect(shideX + 1 + Math.round(sway * 0.5), shideY + 5, 3, 2, '#ffffff', true);
      p.rect(shideX + 3 + Math.round(sway * 0.5), shideY + 7, 2, 2, '#ffe6e6', true);
      p.rect(shideX - 2, shideY + 2, 2, 2, '#fff5e6', true);
      p.rect(shideX - 3, shideY + 4, 2, 2, '#ffffff', true);

      // [部件 9] 环绕博丽灵梦的「博丽双灵力勾玉（曲玉）」——独立净空展示！朱红阳勾玉 + 神社翡翠阴勾玉！
      const orb1X = isAtk && f === 1
        ? bx + 16
        : isAtk && f === 2
          ? bx + 19
          : Math.round(bx - 16 + Math.sin(phase) * 1.5);
      const orb1Y = isAtk && f === 0
        ? 16 + by
        : isAtk && f === 1
          ? 20 + by
          : Math.round(25 + by + Math.cos(phase) * 2.2);
      // 1 号主勾玉：朱红鎏金阳勾玉（悬于左侧净空，彻底避开飘带！）
      drawMagatama(orb1X, orb1Y, '#b51635', '#ff3b5c', '#fff2bd', '#fff8d6', 1);

      // 2 号副勾玉：八尺琼翡翠玉勾玉（悬于右下方净空，与左红勾玉遥相对称，待机与攻防皆极高辨识度！）
      const orb2X = isAtk && f === 1
        ? bx + 18
        : isAtk && f === 2
          ? bx + 16
          : Math.round(bx + 16 - Math.sin(phase) * 1.5);
      const orb2Y = isAtk && f === 0
        ? 35 + by
        : isAtk && f === 1
          ? 37 + by
          : Math.round(37 + by - Math.cos(phase) * 2.0);
      drawMagatama(orb2X, orb2Y, '#14876c', '#45e6b8', '#e6fff8', '#fff8d6', -1);

      // [部件 10] 挥击瞬间流畅连续的「朱金梦想封印结界弧光」（严格留在 x<=45 零裁切！）
      if (isAtk && (f === 1 || f === 2)) {
        const arcCx = bx + 9;
        const arcCy = 26 + by;
        const segs = 11;
        for (let i = 0; i < segs; i++) {
          const a0 = -1.15 + (i / segs) * 2.1;
          const a1 = -1.15 + ((i + 1) / segs) * 2.1;
          const ox0 = Math.round(arcCx + Math.cos(a0) * 14);
          const oy0 = Math.round(arcCy + Math.sin(a0) * 14);
          const ox1 = Math.round(arcCx + Math.cos(a1) * 14);
          const oy1 = Math.round(arcCy + Math.sin(a1) * 14);
          const ix0 = Math.round(arcCx + Math.cos(a0) * 12);
          const iy0 = Math.round(arcCy + Math.sin(a0) * 12);
          const ix1 = Math.round(arcCx + Math.cos(a1) * 12);
          const iy1 = Math.round(arcCy + Math.sin(a1) * 12);
          p.line(ox0, oy0, ox1, oy1, f === 1 ? '#ff3b60' : '#ff85a0', i >= 3 && i <= 8 ? 2 : 1, true);
          p.line(ix0, iy0, ix1, iy1, i >= 3 && i <= 8 ? '#fff6c2' : '#ffe073', 1, true);
        }
        p.px(bx + 22, 16 + by, '#ffffff', true);
        p.px(bx + 23, 34 + by, '#ffe885', true);
      }
    },
  },

  /** 2. 雾雨魔理沙：精雕俏丽金发麻花辫大魔女帽立绘 + 蕾丝围裙黑马甲 + 斜背扫帚 + 独立浮空精雕正八边形「迷你八卦炉」！ */
  hero_marisa: {
    backdropTop: '#0d1026',
    backdropBottom: '#2b1e3d',
    backdropGlow: '#f6c945',
    avatarCrop: { x: 9, y: 3, size: 29 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p, pose) => {
      const isAtk = pose.state === 'attack';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      // 攻击发射极限火花时左收基点，给精雕八卦炉与炽烈星炮留足充裕空间！
      const bx = isAtk && (f === 1 || f === 2)
        ? 19
        : isAtk && f === 0
          ? 20
          : Math.round(21 + pose.leanX * 0.75);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.3);
      const legStride = Math.round(pose.stride * 4.0);

      // [部件 1] 背后斜背的「魔法飞天扫帚」（胡桃木柄 + 金丝扎带 + 蓬松扫帚穗，极佳魔法使平衡剪影！）
      const broomShift = isAtk && f === 1 ? -2 : 0;
      p.line(bx - 13 + broomShift, 42 + by, bx + 4, 21 + by, '#6e4526', 2);
      p.line(bx - 12 + broomShift, 41 + by, bx + 3, 22 + by, '#a8703e', 1);
      // 蓬松扫帚尾穗（左下方）
      p.poly([
        [bx - 11 + broomShift, 38 + by],
        [bx - 17 + broomShift + Math.round(sway * 0.5), 42 + by],
        [bx - 14 + broomShift + Math.round(sway * 0.5), 46 + by],
        [bx - 9 + broomShift, 41 + by],
      ], '#a87324');
      p.poly([
        [bx - 11 + broomShift, 39 + by],
        [bx - 16 + broomShift + Math.round(sway * 0.5), 42 + by],
        [bx - 13 + broomShift + Math.round(sway * 0.5), 45 + by],
        [bx - 10 + broomShift, 41 + by],
      ], '#e6b245');
      p.line(bx - 11 + broomShift, 39 + by, bx - 9 + broomShift, 41 + by, '#ffe885', 1); // 金丝箍

      // [部件 2] 柔顺分缕后垂阳光金长发（修身贴背微飘，给右侧八卦炉留出纯净负空间！）
      p.poly([
        [bx - 6, 20 + by],
        [bx + 5, 20 + by],
        [bx + 6 - Math.round(sway * 0.6), 31 + by],
        [bx + 3 - Math.round(sway * 0.6), 34 + by],
        [bx - 5 + sway, 35 + by],
        [bx - 8 + sway, 32 + by],
      ], '#b57b1b');
      p.poly([
        [bx - 5, 21 + by],
        [bx + 4, 21 + by],
        [bx + 5 - Math.round(sway * 0.5), 30 + by],
        [bx - 6 + sway, 31 + by],
      ], '#f0bf3e');
      p.vline(bx - 5, 22 + by, 8, '#ffe885');
      p.vline(bx + 3, 22 + by, 7, '#ffd452');

      // [部件 3] 独立迈步白短袜与精巧黑皮金扣短靴
      const backLegX = bx - 4 - legStride;
      const frontLegX = bx + 2 + legStride;
      const backLegLift = pose.stride > 0.3 ? -2 : 0;
      const frontLegLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(backLegX, 42 + backLegLift, 3, 2, '#f0ebe4');
      p.rect(backLegX, 44 + backLegLift, 3, 4, '#1b1f33');
      p.hline(backLegX - 1, 47 + backLegLift, 4, '#2f3757');
      p.rect(frontLegX, 42 + frontLegLift, 3, 2, '#ffffff');
      p.rect(frontLegX, 44 + frontLegLift, 3, 4, '#242a45');
      p.hline(frontLegX, 47 + frontLegLift, 4, '#485482');
      p.px(frontLegX + 1, 45 + frontLegLift, '#ffd859');

      // [部件 4] 左手蓬松白泡泡袖（蓄力时弯曲手肘帅气轻压宽帽檐外缘，绝不贴脸！）
      if (isAtk && f === 0) {
        p.ellipse(bx - 6, 27 + by, 2.2, 2.2, '#f5f2eb');
        p.line(bx - 7, 27 + by, bx - 11, 22 + by, '#f5f2eb', 2);
        p.line(bx - 11, 22 + by, bx - 10, 16 + by, '#ffffff', 2);
        p.rect(bx - 11, 15 + by, 2, 2, '#ffe6d4');
      } else {
        const armBack = isHit ? -2 : Math.round(-pose.stride * 1.8);
        p.ellipse(bx - 6, 28 + by, 2.3, 2.3, '#f7f3eb');
        p.line(bx - 6, 29 + by, bx - 9 + armBack, 33 + by, '#ece6dc', 2);
        p.rect(bx - 9 + armBack, 33 + by, 2, 2, '#ffe6d4');
      }

      // [部件 5] 华丽黑白荷叶边魔女长裙 + 逐像素纯白蕾丝围裙与裙摆波浪花边
      const skirtSkew = Math.round(-pose.leanX * 0.5 + sway * 0.6);
      p.poly([
        [bx - 5, 33 + by],
        [bx + 5, 33 + by],
        [bx + 11 + skirtSkew, 43 + by],
        [bx - 10 + skirtSkew, 43 + by],
      ], '#16192b');
      p.poly([
        [bx - 4, 33 + by],
        [bx + 4, 33 + by],
        [bx + 9 + skirtSkew, 42 + by],
        [bx - 8 + skirtSkew, 42 + by],
      ], '#28304f');
      // 立体裙褶反光
      p.vline(bx - 5, 35 + by, 6, '#3e4a78');
      p.vline(bx + 5, 35 + by, 6, '#1b2038');
      // 标志性纯白荷叶围裙
      p.poly([
        [bx - 3, 33 + by],
        [bx + 4, 33 + by],
        [bx + 5 + skirtSkew, 41 + by],
        [bx - 4 + skirtSkew, 41 + by],
      ], '#f5f2eb');
      p.rect(bx - 2, 34 + by, 5, 6, '#ffffff');
      p.hline(bx - 4 + skirtSkew, 41 + by, 9, '#d9d4cc');
      // 逐像素精致纯白蕾丝裙摆花边
      for (let x = bx - 10 + skirtSkew; x <= bx + 10 + skirtSkew; x++) {
        p.px(x, 43 + by, '#ffffff');
        if ((x - bx) % 2 === 0) p.px(x, 44 + by, '#d6deed');
      }

      // [部件 6] 修身黑绒小马甲 + 白蕾丝领口 + 双排闪亮金扣 + 精致胸前金麻花辫！
      p.rect(bx - 4, 26 + by, 9, 7, '#1f253d');
      p.rect(bx - 3, 26 + by, 6, 6, '#2b3354');
      // 洁白翻领 + 金色小丝带结
      p.hline(bx - 3, 26 + by, 7, '#ffffff');
      p.rect(bx - 1, 27 + by, 3, 1, '#ffd859');
      // 双排鎏金纽扣
      p.px(bx - 2, 29 + by, '#ffe478');
      p.px(bx + 2, 29 + by, '#ffe478');
      p.px(bx - 2, 31 + by, '#ffe478');
      p.px(bx + 2, 31 + by, '#ffe478');
      p.hline(bx - 5, 33 + by, 10, '#f5f2eb'); // 围裙白腰带

      // 左胸前标志性立体编织麻花辫（细腻交叉纹路 + 白色蝶结扎尾！）
      const braidX = bx - 6 + Math.round(sway * 0.4);
      p.vline(braidX, 24 + by, 10, '#c78b1e');
      p.vline(braidX + 1, 24 + by, 10, '#f7ca45');
      p.px(braidX, 26 + by, '#fff4a6');
      p.px(braidX + 1, 28 + by, '#fff4a6');
      p.px(braidX, 30 + by, '#fff4a6');
      p.px(braidX + 1, 32 + by, '#fff4a6');
      p.rect(braidX - 1, 33 + by, 4, 2, '#ffffff'); // 精致白发结

      // [部件 7] 俏皮灵动三头身少女脸庞 + 灿烂琥珀金眸 + 自然分缕碎金刘海！
      const headY = 20 + by;
      p.rect(bx - 1, headY + 4, 3, 2, '#e0ac92');
      p.ellipse(bx, headY, 5.1, 4.8, '#ffe9d9');
      p.hline(bx - 3, headY + 4, 7, '#ebb99d');
      drawChibiFaceEyes(p, bx + 1, headY, '#b36b0b', '#ffeb66', pose);
      // 蓬松柔顺阳光金刘海（自然分缕，彻底告别生硬塑料横条！）
      p.ellipse(bx, headY - 4.2, 5.8, 2.8, '#cf911d');
      p.ellipse(bx, headY - 4.5, 4.8, 2.1, '#f5c742');
      p.hline(bx - 3, headY - 5, 6, '#fff3a6');
      p.px(bx - 5, headY - 2, '#d99a24');
      p.px(bx - 3, headY - 2, '#f5c742');
      p.px(bx, headY - 2, '#cf911d');
      p.px(bx + 3, headY - 2, '#f5c742');
      p.px(bx + 5, headY - 2, '#d99a24');
      // 柔和包颊碎金鬓
      p.vline(bx - 5, headY - 1, 7, '#ebba38');
      p.vline(bx + 5, headY - 1, 7, '#ebba38');

      // [部件 8] 超帅气倾斜大尖顶黑魔女帽 + 蓬松白蕾丝大蝴蝶结（优雅弯折帽尖，告别扁飞碟！）
      const hatTilt = isAtk && f === 1 ? 1 : pose.leanX > 1 ? 1 : 0;
      const hatY = headY - 6 + hatTilt;
      // 优雅微翘的宽大魔女帽檐（深靛蓝高光勾勒立体弧度）
      p.ellipse(bx, hatY, 12.8, 3.0, '#131626');
      p.ellipse(bx, hatY - 0.5, 11.4, 2.1, '#272f52');
      p.hline(bx - 9, hatY - 1, 8, '#465387');
      // 内檐柔软白蕾丝花边衬里
      for (let x = bx - 6; x <= bx + 6; x++) {
        p.px(x, hatY + 1, (x - bx) % 2 === 0 ? '#ffffff' : '#dce3f2');
      }
      // 经典潇洒高耸微弯的尖顶魔女帽冠（轮廓鲜明俏丽！）
      p.poly([
        [bx - 7, hatY - 1],
        [bx + 7, hatY - 1],
        [bx + 4, hatY - 8],
        [bx - 1 + hatTilt, hatY - 13],
        [bx - 5, hatY - 9],
      ], '#181c33');
      p.poly([
        [bx - 5, hatY - 1],
        [bx + 3, hatY - 1],
        [bx + 2, hatY - 8],
        [bx - 1 + hatTilt, hatY - 12],
        [bx - 3, hatY - 8],
      ], '#343f6b');
      // 俏皮向右后优雅弯垂的长帽尖
      p.poly([
        [bx - 2 + hatTilt, hatY - 12],
        [bx + 2 + hatTilt, hatY - 13],
        [bx + 8, hatY - 10],
        [bx + 4, hatY - 8],
      ], '#1f2642');
      p.line(bx + 1 + hatTilt, hatY - 12, bx + 7, hatY - 10, '#52639e', 1);
      // 标志性纯白宽帽带与侧方立体蓬松白蝴蝶结 + 金星扣
      p.hline(bx - 6, hatY - 3, 12, '#f5f2eb');
      p.hline(bx - 6, hatY - 2, 12, '#d4dbe8');
      p.poly([[bx + 2, hatY - 6], [bx + 8, hatY - 7], [bx + 7, hatY - 2], [bx + 2, hatY - 3]], '#ffffff');
      p.poly([[bx - 1, hatY - 5], [bx + 3, hatY - 4], [bx - 1, hatY - 2]], '#f2efe9');
      p.px(bx + 3, hatY - 4, '#ffd859', true); // 小金星扣

      // [部件 9] 右前臂泡泡袖（优雅举手操控身旁的「迷你八卦炉」！）
      const handX = isAtk && f === 1 ? bx + 9 : isAtk && f === 0 ? bx + 7 : bx + 7;
      const handY = isAtk && f === 0 ? 25 + by : isAtk && f === 1 ? 28 + by : 29 + by;
      p.ellipse(bx + 5, 27 + by, 2.2, 2.2, '#ffffff');
      p.line(bx + 5, 28 + by, handX, handY, '#f5f2eb', 2);
      p.rect(handX, handY - 1, 2, 2, '#ffe6d4');

      // [部件 10] 独立悬浮在魔理沙身旁的精雕正八边形「迷你八卦炉 (Mini-Hakkero)」！！
      const furnHover = Math.round(Math.sin(phase) * 1.8);
      const furnX = isAtk && f === 1
        ? bx + 14
        : isAtk && f === 2
          ? bx + 13
          : isAtk && f === 0
            ? bx + 12
            : bx + 15;
      const furnY = isAtk && f === 0
        ? 23 + by
        : isAtk && f === 1
          ? 27 + by
          : 27 + by + furnHover;

      // 精雕正八边形玄铁鎏金炉体（9×9 明确八角几何轮廓，绝不再像橙子圆球！）
      const r = isAtk && f === 1 ? 5 : 4;
      const c = isAtk && f === 1 ? 2 : 2;
      // 八角玄铁深影底座
      p.poly([
        [furnX - c, furnY - r],
        [furnX + c, furnY - r],
        [furnX + r, furnY - c],
        [furnX + r, furnY + c],
        [furnX + c, furnY + r],
        [furnX - c, furnY + r],
        [furnX - r, furnY + c],
        [furnX - r, furnY - c],
      ], '#2b2438');
      // 鎏金八角边框高光与八方八卦金刻纹
      p.hline(furnX - c, furnY - r, c * 2 + 1, '#f2c44d', true);
      p.hline(furnX - c, furnY + r, c * 2 + 1, '#c78c28');
      p.vline(furnX - r, furnY - c, c * 2 + 1, '#d99e32');
      p.vline(furnX + r, furnY - c, c * 2 + 1, '#ffe478', true);
      // 四斜角金棱点
      p.px(furnX - r + 1, furnY - r + 1, '#ffe885', true);
      p.px(furnX + r - 1, furnY - r + 1, '#ffffff', true);
      p.px(furnX - r + 1, furnY + r - 1, '#b87d20');
      p.px(furnX + r - 1, furnY + r - 1, '#f2c44d');
      // 炉体内部玄金凹槽 + 炽烈青白/星金八卦太极核心！
      p.rect(furnX - 2, furnY - 2, 5, 5, '#3e2d5c');
      p.px(furnX, furnY - 2, '#ffd859', true);
      p.px(furnX, furnY + 2, '#ffd859', true);
      p.px(furnX - 2, furnY, '#ffd859', true);
      p.px(furnX + 2, furnY, '#ffd859', true);
      // 炽亮八卦炉心（蓄力与发射时骤然升华至白金星核！）
      p.ellipse(furnX, furnY, 1.8, 1.8, isAtk && f <= 2 ? '#7ae8ff' : '#ffbf38', true);
      p.px(furnX, furnY, '#ffffff', true);

      // 身旁环绕星屑微光（呼应普通魔法使星辰弹幕气质）
      const spX = Math.round(Math.cos(phase) * 6);
      const spY = Math.round(Math.sin(phase) * 5);
      p.px(furnX + spX, furnY - 6 + Math.round(spY * 0.4), '#fff0a6', true);
      p.px(furnX - Math.round(spX * 0.7), furnY + 6, '#8ce8ff', true);

      // [部件 11] 八卦炉攻击爆发演出：蓄力八角光环 → 极限星符魔炮齐射（严格收于 x<=46 零裁切！）
      if (isAtk && f === 0) {
        // 蓄力帧：八卦炉四周浮现星金聚能十字芒
        p.px(furnX, furnY - 6, '#ffffff', true);
        p.px(furnX, furnY + 6, '#ffe066', true);
        p.px(furnX + 6, furnY, '#8ce8ff', true);
        p.px(furnX - 6, furnY, '#ffe066', true);
      } else if (isAtk && f === 1) {
        // 发射帧 1：从正八边形炉口轰出璀璨星金×虹蓝×纯白「星符极限火花」锥形魔炮！
        p.poly([[furnX + 4, furnY - 3], [46, furnY - 6], [46, furnY + 6], [furnX + 4, furnY + 3]], '#ff9e2c', true);
        p.poly([[furnX + 4, furnY - 2], [46, furnY - 3], [46, furnY + 3], [furnX + 4, furnY + 2]], '#ffe878', true);
        p.hline(furnX + 4, furnY, Math.max(1, 46 - (furnX + 4)), '#ffffff', true);
        // 伴生虹蓝小星弹
        p.px(furnX + 7, furnY - 5, '#7ae8ff', true);
        p.px(furnX + 10, furnY + 5, '#ff73c4', true);
        p.px(44, furnY - 5, '#ffffff', true);
      } else if (isAtk && f === 2) {
        // 余波帧 2：散逸星光射线与闪耀彩星
        p.line(furnX + 5, furnY - 2, 44, furnY - 4, '#ffe478', 1, true);
        p.line(furnX + 5, furnY + 2, 44, furnY + 4, '#7ae8ff', 1, true);
        p.px(43, furnY, '#ffffff', true);
        p.px(40, furnY - 5, '#ff73c4', true);
        p.px(41, furnY + 5, '#ffe066', true);
      }
    },
  },

  /** 3. 阴阳毛玉：挤压弹性跳动 + 波浪律动绒毛簇 + 旋转朱金太极核 + 环绕双灵火 */
  creature_kedama: {
    backdropTop: '#10152b',
    backdropBottom: '#212238',
    backdropGlow: '#ff6b84',
    avatarCrop: { x: 9, y: 17, size: 30 },
    portraitCrop: { x: 5, y: 14, w: 38, h: 35 },
    draw: (p, pose) => {
      const bx = Math.round(24 + pose.leanX * 1.1);
      const bounceY = Math.round(pose.breathY * 1.4 - pose.stepLift * 2.2);
      const squashX = pose.state === 'move' ? (pose.stepLift > 0.5 ? -1.2 : 1.6) : pose.state === 'attack' ? (pose.armAction > 0.5 ? 2.4 : -1.8) : pose.breathY * -0.5;
      const squashY = -squashX * 0.85;
      const cy = 36 + bounceY;
      const rx = 11.2 + squashX;
      const ry = 9.4 + squashY;
      const fl = Math.round(pose.flutter * 1.4);

      // 蓬松多层绒毛主体（随律动轻颤）
      p.ellipse(bx, cy + 1, rx, ry, '#a9b4d4');
      p.ellipse(bx - 1, cy - 1, rx - 0.8, ry - 0.8, '#e3e2ed');
      p.ellipse(bx - 1, cy - 2.5, rx - 2.4, ry - 2.4, '#faf7f2');
      p.ellipse(bx - 2, cy - 4.5, rx - 4.8, ry - 4.8, '#ffffff');
      // 外翘动感绒毛簇
      p.ellipse(bx - Math.round(rx) + 1, cy + fl, 3.4, 2.6, '#dde0eb');
      p.ellipse(bx + Math.round(rx) - 1, cy - fl, 3.4, 2.6, '#bcc4de');
      p.ellipse(bx + fl, cy - Math.round(ry), 4.2, 2.6, '#ffffff');

      // 旋转发光朱金阴阳太极晶核
      const coreR = pose.slashAlpha > 0.3 ? 5.6 : 4.6;
      const coreX = bx + Math.round(pose.leanX * 0.5);
      p.ellipse(coreX, cy - 1, coreR, coreR, '#ffe082', true);
      p.ellipse(coreX, cy - 1, coreR - 1, coreR - 1, '#e63050', true);
      const flipTaiji = pose.frame % 2 === 0 ? 1 : -1;
      p.poly([[coreX, cy - 5], [coreX + 4 * flipTaiji, cy - 1], [coreX, cy + 3]], '#fff2bf', true);
      p.px(coreX - flipTaiji, cy - 3, '#ffffff', true);
      p.px(coreX + flipTaiji, cy + 1, '#c4203b', true);

      // 双伴飞环绕灵火
      const wOff = Math.round(Math.sin(pose.phase * Math.PI * 2) * 3);
      p.ellipse(bx - 16, cy + 2 + wOff, 2.0, 2.5, '#ffad66', true);
      p.px(bx - 16, cy + 1 + wOff, '#ffffff', true);
      p.ellipse(bx + 16, cy - 1 - wOff, 1.8, 2.3, '#ff738a', true);
      p.px(bx + 16, cy - 2 - wOff, '#ffffff', true);

      if (pose.slashAlpha > 0.3) {
        p.line(bx + 11, cy - 7, bx + 20, cy - 1, '#ff6b84', 2, true);
        p.line(bx + 11, cy + 5, bx + 20, cy - 1, '#ffe680', 2, true);
      }
    },
  },

  /** 4. 向日葵妖精：软萌甜美花仙子 — 蓬松暖金卷发 + 斜戴盛开向日葵花卡 + 泡泡袖花瓣蓬蓬裙 + 闪亮青碧蝴蝶四翼 + 踢动小圆鞋 */
  creature_fairy: {
    backdropTop: '#0b1c2c',
    backdropBottom: '#15363b',
    backdropGlow: '#6bf0a8',
    avatarCrop: { x: 11, y: 7, size: 26 },
    portraitCrop: { x: 4, y: 5, w: 40, h: 44 },
    draw: (p, pose) => {
      const bx = Math.round(24 + pose.leanX);
      const by = Math.round(pose.breathY * 1.7 - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.3);
      const wingFlap = Math.round(Math.sin(pose.phase * Math.PI * 4) * 4.5 + (pose.state === 'move' ? 3 : 0));

      // [部件 1] 四枚柔美圆润的虹彩青碧蝴蝶妖精翅（带星光点缀）
      p.poly([[bx - 2, 27 + by], [bx - 16, 15 + by + wingFlap], [bx - 18, 22 + by + wingFlap], [bx - 13, 28 + by + Math.round(wingFlap * 0.6)], [bx - 5, 30 + by]], '#3ad9b8', true);
      p.poly([[bx - 3, 27 + by], [bx - 13, 18 + by + wingFlap], [bx - 14, 23 + by + wingFlap], [bx - 5, 29 + by]], '#d6fff7', true);
      p.poly([[bx + 2, 27 + by], [bx + 16, 15 + by + wingFlap], [bx + 18, 22 + by + wingFlap], [bx + 13, 28 + by + Math.round(wingFlap * 0.6)], [bx + 5, 30 + by]], '#3ad9b8', true);
      p.poly([[bx + 3, 27 + by], [bx + 13, 18 + by + wingFlap], [bx + 14, 23 + by + wingFlap], [bx + 5, 29 + by]], '#d6fff7', true);
      // 圆润小下翼
      p.ellipse(bx - 10, 34 + by - Math.round(wingFlap * 0.4), 5.0, 3.6, '#38c7a8', true);
      p.ellipse(bx - 9, 34 + by - Math.round(wingFlap * 0.4), 3.0, 2.0, '#c8fff2', true);
      p.ellipse(bx + 10, 34 + by - Math.round(wingFlap * 0.4), 5.0, 3.6, '#38c7a8', true);
      p.ellipse(bx + 9, 34 + by - Math.round(wingFlap * 0.4), 3.0, 2.0, '#c8fff2', true);
      p.px(bx - 14, 19 + by + wingFlap, '#fff7b8', true);
      p.px(bx + 14, 19 + by + wingFlap, '#fff7b8', true);

      // [部件 2] 蓬松暖金卷曲后发与耳侧小卷尾
      p.ellipse(bx, 22 + by, 8.2, 6.8, '#c9821e');
      p.ellipse(bx - 7 + sway, 27 + by, 3.4, 4.2, '#e8a832');
      p.ellipse(bx + 7 - sway, 27 + by, 3.4, 4.2, '#e8a832');
      p.px(bx - 7 + sway, 26 + by, '#ffe885');
      p.px(bx + 7 - sway, 26 + by, '#ffe885');

      // [部件 3] 凌空欢快晃动的小白袜与翡翠玛丽珍圆鞋
      const kick = Math.round(pose.stride * 3 + pose.flutter * 1.6);
      const lFootY = 43 + by + Math.round(kick * 0.35);
      const rFootY = 42 + by - Math.round(kick * 0.45);
      p.rect(bx - 4 - Math.round(kick * 0.4), lFootY - 2, 2, 4, '#fff8f0');
      p.hline(bx - 5 - Math.round(kick * 0.4), lFootY + 2, 3, '#1f8a54');
      p.rect(bx + 2 + Math.round(kick * 0.4), rFootY - 2, 2, 4, '#fff8f0');
      p.hline(bx + 2 + Math.round(kick * 0.4), rFootY + 2, 3, '#1f8a54');

      // [部件 4] 可爱泡泡袖层叠花瓣蓬蓬裙 + 暖金大蝴蝶结
      const skew = Math.round(-pose.leanX * 0.45 + sway * 0.5);
      p.poly([[bx - 6, 31 + by], [bx + 6, 31 + by], [bx + 11 + skew, 42 + by], [bx - 11 + skew, 42 + by]], '#1e8c57');
      p.poly([[bx - 5, 31 + by], [bx + 5, 31 + by], [bx + 8 + skew, 41 + by], [bx - 8 + skew, 41 + by]], '#42d988');
      // 奶油象牙花瓣裙心与白色蕾丝花边
      p.poly([[bx - 2, 32 + by], [bx + 2, 32 + by], [bx + 4 + skew, 41 + by], [bx - 4 + skew, 41 + by]], '#fff8de');
      p.hline(bx - 10 + skew, 41 + by, 20, '#fff7e6');
      p.px(bx - 7 + skew, 42 + by, '#4ce695');
      p.px(bx + 6 + skew, 42 + by, '#4ce695');
      // 泡泡短袖与白色荷叶小领
      p.ellipse(bx - 6, 30 + by, 2.8, 2.6, '#fff8eb');
      p.ellipse(bx + 6, 30 + by, 2.8, 2.6, '#fff8eb');
      p.hline(bx - 4, 29 + by, 8, '#ffffff');
      // 暖金腰间大蝴蝶结与小飘带
      p.rect(bx - 3, 33 + by, 6, 2, '#ffd44d');
      p.px(bx - 2, 33 + by, '#fff5a6');
      p.px(bx + 1, 33 + by, '#fff5a6');
      p.px(bx - 2 + sway, 35 + by, '#f0a830');
      p.px(bx + 1 + sway, 35 + by, '#f0a830');

      // [部件 5] 俏皮挥动小后手
      p.line(bx - 6, 31 + by, bx - 10, 34 + by - Math.round(pose.flutter), '#ffe6d4', 2);

      // [部件 6] 圆润软萌小脸庞 + 闪亮大翡翠星眸 + 粉嫩双颊
      const headY = 22 + by;
      p.ellipse(bx, headY, 5.8, 5.4, '#ffe8d6');
      p.hline(bx - 4, headY + 4, 8, '#f0c4ab');
      drawChibiFaceEyes(p, bx + 1, headY, '#148a4c', '#9effc8', pose);
      // 额外加深甜美樱粉腮红与甜笑
      p.hline(bx - 5, headY + 2, 2, '#ffa6b8');
      p.hline(bx + 4, headY + 2, 2, '#ffa6b8');

      // [部件 7] 柔顺金发圆润刘海 + 俏皮小呆毛 + 右侧斜戴向日葵大花卡！
      p.ellipse(bx, headY - 4.5, 6.6, 3.6, '#f0b835');
      p.rect(bx - 6, headY - 5, 12, 4, '#ffd454');
      p.hline(bx - 4, headY - 6, 8, '#fff7bd');
      // 蓬松贴颊小鬓发
      p.rect(bx - 7, headY - 2, 2, 7, '#f0b835');
      p.rect(bx + 5, headY - 2, 2, 7, '#f0b835');
      p.px(bx - 3, headY - 1, '#e6a82e');
      p.px(bx + 1, headY - 1, '#e6a82e');
      p.px(bx + 4, headY - 1, '#e6a82e');
      // 左侧俏皮小呆毛与嫩绿芽叶
      p.line(bx - 3, headY - 8, bx - 6, headY - 11 + sway, '#ffe073', 1);
      p.ellipse(bx - 6, headY - 6, 2.8, 2.0, '#44d17c');
      // 右上角斜戴盛开的大向日葵花饰（立体花瓣 + 暖褐花心 + 翠叶）
      const fx = bx + 5;
      const fy = headY - 7;
      p.ellipse(fx + 4, fy + 2, 2.8, 1.8, '#2ea862');
      p.ellipse(fx - 3, fy - 2, 2.6, 1.8, '#2ea862');
      p.ellipse(fx, fy, 5.2, 4.6, '#ffbd26', true);
      p.ellipse(fx, fy, 4.2, 3.6, '#fff078', true);
      p.ellipse(fx, fy, 2.2, 2.0, '#7d3d10');
      p.px(fx - 1, fy - 1, '#c46c2b');

      // [部件 8] 前手欢快挥舞发光向日葵小花杖（攻击时撒出金粉星花！）
      const wandHandX = pose.armAction >= 0.7 ? bx + 12 : pose.armAction <= -0.6 ? bx + 7 : bx + 9;
      const wandHandY = pose.armAction >= 0.7 ? 29 + by : pose.armAction <= -0.6 ? 22 + by : 32 + by;
      const wandTipX = pose.armAction >= 0.7 ? bx + 19 : pose.armAction <= -0.6 ? bx + 4 : bx + 15;
      const wandTipY = pose.armAction >= 0.7 ? 25 + by : pose.armAction <= -0.6 ? 13 + by : 24 + by;
      p.line(bx + 5, 30 + by, wandHandX, wandHandY, '#ffe8d6', 2);
      p.line(wandHandX, wandHandY, wandTipX, wandTipY, '#4fd17c', 2);
      p.ellipse(wandTipX, wandTipY, 3.0, 3.0, '#ffe052', true);
      p.px(wandTipX, wandTipY, '#9e4c14');
      if (pose.slashAlpha > 0.3) {
        p.px(wandTipX + 4, wandTipY - 3, '#fff599', true);
        p.px(wandTipX + 5, wandTipY + 1, '#ffb3d1', true);
        p.px(wandTipX + 3, wandTipY + 5, '#7fffe0', true);
      }
    },
  },

  /** 5. 竹林妖怪兔：超萌灵动和风兔娘 — 一立一微折粉白长兔耳 + 樱红耳根蝴蝶结 + 摇曳小白绒尾 + 甜美和风蓬蓬短裙 + 发光月纹小杵 */
  creature_rabbit: {
    backdropTop: '#0d142e',
    backdropBottom: '#1c2c52',
    backdropGlow: '#ff96c2',
    avatarCrop: { x: 10, y: 4, size: 28 },
    portraitCrop: { x: 4, y: 2, w: 40, h: 46 },
    draw: (p, pose) => {
      const bx = Math.round(24 + pose.leanX);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const earTilt = Math.round(-pose.leanX * 0.8 + pose.flutter * 1.3);

      // [部件 1] 超萌一立一微折毛茸茸双兔耳 + 樱红小蝴蝶结！
      // 左耳：根部竖起，耳尖俏皮向前/微弯软软晃动！
      p.poly([[bx - 6, 17 + by], [bx - 10 + earTilt, 7 + by], [bx - 6 + earTilt, 6 + by], [bx - 2, 17 + by]], '#edf2fc');
      p.poly([[bx - 10 + earTilt, 7 + by], [bx - 14 + earTilt, 10 + by + sway], [bx - 11 + earTilt, 12 + by + sway], [bx - 6 + earTilt, 8 + by]], '#ffffff');
      p.poly([[bx - 6, 16 + by], [bx - 9 + earTilt, 9 + by], [bx - 7 + earTilt, 8 + by], [bx - 4, 16 + by]], '#ff99bd', true);
      // 右耳：软萌圆润高耸挺立，内衬樱花粉！
      p.poly([[bx + 2, 17 + by], [bx + 5 + earTilt, 4 + by], [bx + 10 + earTilt, 5 + by], [bx + 6, 17 + by]], '#ffffff');
      p.ellipse(bx + 7 + earTilt, 5 + by, 2.4, 2.0, '#ffffff');
      p.poly([[bx + 3, 16 + by], [bx + 6 + earTilt, 7 + by], [bx + 8 + earTilt, 8 + by], [bx + 5, 16 + by]], '#ff94ba', true);
      // 右耳根系着超可爱的樱红小蝴蝶结！
      p.rect(bx + 2, 14 + by, 5, 2, '#ff4d79', true);
      p.px(bx + 4, 15 + by, '#ffe08a', true);

      // [部件 2] 背后摇曳软萌小白绒球兔尾 + 樱粉腰带飘带！
      const tailY = 39 + by + Math.round(pose.flutter);
      p.ellipse(bx - 10, tailY, 3.6, 3.4, '#e3ebfa');
      p.ellipse(bx - 10, tailY - 1, 2.6, 2.4, '#ffffff');
      p.poly([[bx - 6, 34 + by], [bx - 14, 36 + by + sway], [bx - 13, 40 + by + sway], [bx - 6, 37 + by]], '#ff78a5');

      // [部件 3] 白及膝袜 + 靛蓝绑带可爱小短靴（欢快小碎步奔跑！）
      const legStride = Math.round(pose.stride * 4.6);
      const backLift = pose.stride > 0.3 ? -2 : 0;
      const frontLift = pose.stride < -0.3 ? -2 : 0;
      // 后腿
      p.rect(bx - 4 - legStride, 41 + backLift, 3, 5, '#e8eefc');
      p.rect(bx - 5 - legStride, 45 + backLift, 4, 3, '#2b478c');
      p.px(bx - 3 - legStride, 45 + backLift, '#ff8fb5');
      // 前腿
      p.rect(bx + 2 + legStride, 41 + frontLift, 3, 5, '#ffffff');
      p.rect(bx + 2 + legStride, 45 + frontLift, 4, 3, '#3f68c7');
      p.px(bx + 4 + legStride, 45 + frontLift, '#ff8fb5');

      // [部件 4] 甜美和风兔娘迷你振袖蓬蓬短裙 + 白色蕾丝边 + 樱粉宽腰带
      const skirtSkew = Math.round(-pose.leanX * 0.5 + sway * 0.5);
      p.poly([[bx - 6, 33 + by], [bx + 6, 33 + by], [bx + 11 + skirtSkew, 43 + by], [bx - 11 + skirtSkew, 43 + by]], '#2b4a96');
      p.poly([[bx - 4, 33 + by], [bx + 4, 33 + by], [bx + 8 + skirtSkew, 42 + by], [bx - 8 + skirtSkew, 42 + by]], '#5785e6');
      p.vline(bx - 2, 34 + by, 7, '#87b0ff');
      p.hline(bx - 10 + skirtSkew, 42 + by, 20, '#ffffff'); // 可爱白色蕾丝蓬边
      // 洁白和风上衣 + 樱粉蝴蝶结腰封
      p.poly([[bx - 5, 27 + by], [bx + 5, 27 + by], [bx + 6, 34 + by], [bx - 6, 34 + by]], '#f5f8ff');
      p.hline(bx - 5, 33 + by, 10, '#ff6e9c');
      p.rect(bx - 2, 32 + by, 4, 3, '#ff94b8');
      p.px(bx, 33 + by, '#fff2c2');
      // 左侧可爱小振袖与后手
      p.poly([[bx - 5, 28 + by], [bx - 11 - Math.round(pose.stride * 2), 32 + by], [bx - 10 - Math.round(pose.stride * 2), 36 + by], [bx - 5, 34 + by]], '#4d78d6');
      p.hline(bx - 11 - Math.round(pose.stride * 2), 35 + by, 5, '#ffffff');
      p.rect(bx - 11 - Math.round(pose.stride * 2), 36 + by, 2, 2, '#ffe8dc');

      // [部件 5] 柔和月银淡紫波波头 + 软萌圆脸 + 闪亮草莓红大眼与樱粉腮红！
      const headY = 22 + by;
      p.ellipse(bx, headY - 1, 7.2, 6.4, '#92a4d4'); // 后发蓬松波波轮廓
      p.ellipse(bx, headY, 5.8, 5.4, '#ffe9de');
      p.hline(bx - 4, headY + 4, 8, '#f0c4b2');
      drawChibiFaceEyes(p, bx + 1, headY, '#c91a45', '#ff8cb0', pose);
      p.hline(bx - 5, headY + 2, 2, '#ffa3ba');
      p.hline(bx + 4, headY + 2, 2, '#ffa3ba');
      // 淡紫月银蓬松刘海与贴颊小发簇（与雪白兔耳形成温柔色彩对比！）
      p.ellipse(bx, headY - 4.5, 6.6, 3.4, '#b8c8eb');
      p.rect(bx - 6, headY - 5, 12, 4, '#dce6fa');
      p.hline(bx - 4, headY - 6, 8, '#ffffff');
      p.rect(bx - 7, headY - 2, 2, 8, '#c4d2f0');
      p.rect(bx + 5, headY - 2, 2, 8, '#c4d2f0');
      p.px(bx - 3, headY - 1, '#a3b5e0');
      p.px(bx + 1, headY - 1, '#a3b5e0');
      p.px(bx + 4, headY - 1, '#a3b5e0');

      // [部件 6] 前振袖握持发光「月纹捣药杵」（带摇曳樱粉挂穗！蓄力高举 → 银蓝星光先攻突刺！）
      let pStartX = bx + 5;
      let pStartY = 39 + by;
      let pEndX = bx + 13;
      let pEndY = 18 + by;
      let handX = bx + 8;
      let handY = 32 + by;

      if (pose.armAction <= -0.6) {
        handX = bx - 1;
        handY = 26 + by;
        pStartX = bx - 9;
        pStartY = 33 + by;
        pEndX = bx + 6;
        pEndY = 16 + by;
      } else if (pose.armAction >= 0.7) {
        handX = bx + 11;
        handY = 30 + by;
        pStartX = bx - 1;
        pStartY = 31 + by;
        pEndX = bx + 22;
        pEndY = 29 + by;
      } else {
        handX = bx + 7 + Math.round(pose.stride * 2);
        handY = 32 + by;
        pStartX = handX - 3;
        pStartY = handY + 7;
        pEndX = handX + 5;
        pEndY = handY - 13;
      }

      p.line(bx + 4, 29 + by, handX, handY, '#5785e6', 3);
      p.rect(handX - 1, handY - 1, 2, 2, '#ffe9de');
      p.line(pStartX, pStartY, pEndX, pEndY, '#75c8ff', 2, true);
      p.ellipse(pEndX, pEndY, 3.0, 3.0, '#e3f9ff', true);
      p.px(pEndX, pEndY, '#ffffff', true);
      // 杵尾摇曳樱粉小挂穗
      p.rect(pStartX - 1, pStartY + 1, 2, 3, '#ff78a5', true);
      if (pose.slashAlpha > 0.3) {
        p.hline(pEndX, pEndY - 1, 6, '#ffffff', true);
        p.hline(pEndX - 2, pEndY + 1, 7, '#ff9ec7', true);
      }
    },
  },

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

  /** 8. 地底怨灵（1×2 飞行）：三段扭动幽冥尾焰 + 伸展灵爪突袭 + 凛冽紫瞳与环绕鬼火 */
  creature_spirit: {
    backdropTop: '#080e20',
    backdropBottom: '#191836',
    backdropGlow: '#52f0df',
    avatarCrop: { x: 10, y: 8, size: 28 },
    portraitCrop: { x: 5, y: 6, w: 38, h: 43 },
    draw: (p, pose) => {
      const bx = Math.round(24 + pose.leanX * 1.2);
      const by = Math.round(pose.breathY * 1.8 - pose.stepLift);
      const w1 = Math.round(Math.sin(pose.phase * Math.PI * 2) * 3.5);
      const w2 = Math.round(Math.sin(pose.phase * Math.PI * 2 + 1.4) * 4.5);

      // [部件 1] 三段S形扭动幽紫灵尾
      p.poly([[bx - 3 + w2, 48 + by], [bx - 6 + w1, 39 + by], [bx + 5 + w1, 38 + by], [bx + 1 + w2, 48 + by]], '#52228f');
      p.poly([[bx - 8 + w1, 35 + by], [bx + 8 + w1, 35 + by], [bx + 4 + w1, 42 + by], [bx - 4 + w1, 42 + by]], '#2a809c');

      // [部件 2] 幽冥青碧灵焰主体 + 飘摇顶焰
      p.ellipse(bx, 26 + by, 8.6, 9.8, '#28b8b8', true);
      p.ellipse(bx, 24 + by, 6.8, 7.6, '#66f7e8', true);
      p.ellipse(bx, 22 + by, 4.8, 5.0, '#e3fffc', true);
      p.poly([[bx - 6, 18 + by], [bx - w1, 7 + by], [bx + 6, 18 + by]], '#4ce6d8', true);
      p.poly([[bx - 4, 18 + by], [bx - Math.round(w1 * 0.5), 11 + by], [bx + 4, 18 + by]], '#d4fffb', true);

      // [部件 3] 伸展幽冥利爪双臂（攻击时猛然扑抓！）
      const clawReach = pose.armAction >= 0.7 ? 10 : pose.armAction <= -0.6 ? -3 : 3;
      p.line(bx + 5, 27 + by, bx + 9 + clawReach, 25 + by - Math.round(pose.armAction * 4), '#66f7e8', 2, true);
      p.line(bx + 5, 30 + by, bx + 8 + clawReach, 31 + by - Math.round(pose.armAction * 2), '#b866ff', 2, true);

      // [部件 4] 凛冽紫晶双眸
      if (pose.expr !== 'hurt') {
        p.rect(bx - 5, 22 + by, 3, 2, '#9933ff', true);
        p.rect(bx + 2, 22 + by, 3, 2, '#9933ff', true);
        p.px(bx - 4, 22 + by, '#ffe0ff', true);
        p.px(bx + 3, 22 + by, '#ffe0ff', true);
      } else {
        p.hline(bx - 5, 23 + by, 3, '#5c1499');
        p.hline(bx + 2, 23 + by, 3, '#5c1499');
      }

      // [部件 5] 环绕双鬼火
      p.ellipse(bx - 14, 28 + by + w1, 2.4, 3.0, '#b866ff', true);
      p.px(bx - 14, 27 + by + w1, '#ffffff', true);
      p.ellipse(bx + 14, 23 + by - w1, 2.2, 2.8, '#5ef2e3', true);
      p.px(bx + 14, 22 + by - w1, '#ffffff', true);
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

function renderRigFrameToCanvas(
  spec: SpriteRigSpec,
  pose: RigPose,
  flipX: boolean,
  mode: 'body' | 'glow' | 'flash',
): HTMLCanvasElement {
  const width = spec.width ?? SPRITE_WIDTH;
  const height = spec.height ?? SPRITE_HEIGHT;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // 若启用新一代 64×72 零糊边分层绘谱，走纯整数光栅化 + 自动部件内描边管线！
  if (spec.hdDraw) {
    const rgba = renderHdRigFrameToRgba(spec.hdDraw, pose, flipX, mode, width, height);
    const imgData = ctx.createImageData(width, height);
    imgData.data.set(rgba);
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  const mapX = (x: number) => (flipX ? width - 1 - x : x);
  const shouldDraw = (emissive?: boolean) => (mode === 'glow' ? Boolean(emissive) : true);
  const pickColor = (color: string) => (mode === 'flash' ? '#ffffff' : color);

  const helpers: PixelPainter = {
    px: (x, y, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      ctx.fillRect(Math.round(mapX(x)), Math.round(y), 1, 1);
    },
    rect: (x, y, w, h, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      const rx = flipX ? width - x - w : x;
      ctx.fillRect(Math.round(rx), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    },
    hline: (x, y, len, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      const rx = flipX ? width - x - len : x;
      ctx.fillRect(Math.round(rx), Math.round(y), Math.max(1, Math.round(len)), 1);
    },
    vline: (x, y, len, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      ctx.fillRect(Math.round(mapX(x)), Math.round(y), 1, Math.max(1, Math.round(len)));
    },
    ellipse: (cx, cy, rx, ry, color, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      const minX = Math.floor(cx - rx);
      const maxX = Math.ceil(cx + rx);
      const minY = Math.floor(cy - ry);
      const maxY = Math.ceil(cy + ry);
      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const dx = (px - cx) / Math.max(0.5, rx);
          const dy = (py - cy) / Math.max(0.5, ry);
          if (dx * dx + dy * dy <= 1) {
            ctx.fillRect(Math.round(mapX(px)), Math.round(py), 1, 1);
          }
        }
      }
    },
    poly: (pts, color, emissive) => {
      if (!shouldDraw(emissive) || pts.length < 3) return;
      ctx.fillStyle = pickColor(color);
      ctx.beginPath();
      const firstX = flipX ? width - pts[0][0] : pts[0][0];
      ctx.moveTo(firstX, pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        const px = flipX ? width - pts[i][0] : pts[i][0];
        ctx.lineTo(px, pts[i][1]);
      }
      ctx.closePath();
      ctx.fill();
    },
    line: (x0, y0, x1, y1, color, thickness = 1, emissive) => {
      if (!shouldDraw(emissive)) return;
      ctx.fillStyle = pickColor(color);
      const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      const half = Math.floor(thickness / 2);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = Math.round(x0 + (x1 - x0) * t);
        const py = Math.round(y0 + (y1 - y0) * t);
        const rx = flipX ? width - px - thickness + half : px - half;
        ctx.fillRect(rx, py - half, thickness, thickness);
      }
    },
  };

  spec.draw(helpers, pose);

  // 组装完全身解构部件后统一执行 1px 深靛黑像素外轮廓（零 Mixels 完美锐利！）
  if (mode === 'body') {
    const img = ctx.getImageData(0, 0, width, height);
    const src = new Uint8ClampedArray(img.data);
    const out = img.data;
    const isOpaque = (px: number, py: number) => {
      if (px < 0 || py < 0 || px >= width || py >= height) return false;
      return src[(py * width + px) * 4 + 3] > 30;
    };

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const idx = (py * width + px) * 4;
        if (src[idx + 3] > 30) continue;
        if (
          isOpaque(px - 1, py) ||
          isOpaque(px + 1, py) ||
          isOpaque(px, py - 1) ||
          isOpaque(px, py + 1)
        ) {
          out[idx] = 12;
          out[idx + 1] = 13;
          out[idx + 2] = 28;
          out[idx + 3] = 242;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  return canvas;
}

function canvasToNearestTexture(canvas: HTMLCanvasElement): PIXI.Texture {
  const source = new PIXI.CanvasSource({
    resource: canvas,
    scaleMode: 'nearest',
  });
  return new PIXI.Texture({ source });
}

const spriteCache = new Map<string, BakedVoxelSpriteSet>();
const idleCanvasesCache = new Map<string, HTMLCanvasElement[]>();
const portraitFramesCache = new Map<string, string[]>();
const avatarDataCache = new Map<string, string>();

/** 新一代 64×72 精雕像素立绘注册表（优先于旧版 48×54，支持分批无缝替换！） */
const HD_RIG_SPECS: Record<string, SpriteRigSpec> = {
  hero_reimu: HD_HERO_REIMU_SPEC,
  hero_remilia: HD_HERO_REMILIA_SPEC,
  ...HD_LIFE_FACTION_RIG_SPECS,
  ...HD_DEATH_FACTION_RIG_SPECS,
  ...HD_ORDER_FACTION_RIG_SPECS,
};

function getRigSpec(blueprintId: string): SpriteRigSpec {
  return (
    HD_RIG_SPECS[blueprintId] ??
    RIG_SPECS[blueprintId] ??
    FACTION_RIG_SPECS[blueprintId] ??
    RIG_SPECS.creature_kedama
  );
}

/** 供离线像素审稿脚本读取任意单位骨骼规格 */
export function getVoxelSpriteSpecForAudit(blueprintId: string): SpriteRigSpec | undefined {
  return HD_RIG_SPECS[blueprintId] ?? RIG_SPECS[blueprintId] ?? FACTION_RIG_SPECS[blueprintId];
}

function getIdleBodyCanvases(blueprintId: string): HTMLCanvasElement[] {
  const cached = idleCanvasesCache.get(blueprintId);
  if (cached) return cached;
  const spec = getRigSpec(blueprintId);
  const poses = buildPoseSequence('idle');
  const canvases = poses.map((pose) => renderRigFrameToCanvas(spec, pose, false, 'body'));
  idleCanvasesCache.set(blueprintId, canvases);
  return canvases;
}

function drawSubtlePixelFrameBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spec: SpriteRigSpec,
  frameIdx = 0,
): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, spec.backdropTop);
  grad.addColorStop(0.68, spec.backdropBottom);
  grad.addColorStop(1, '#09070d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 柔和背光圣晕（突出角色主体轮廓与空气感）
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.44, w * 0.06, w * 0.5, h * 0.46, w * 0.54);
  glow.addColorStop(0, `${spec.backdropGlow}52`);
  glow.addColorStop(0.62, `${spec.backdropGlow}18`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // 雅致暗金结界细环底纹（像素齐整，不抢主角视觉）
  ctx.save();
  ctx.strokeStyle = `${spec.backdropGlow}2e`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(Math.round(w * 0.5), Math.round(h * 0.47), Math.round(w * 0.38), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(Math.round(w * 0.5), Math.round(h * 0.47), Math.round(w * 0.31), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 漂浮暗夜星尘微光（随 6 帧待机轻缓闪动）
  const starSeeds = [
    [0.16, 0.18],
    [0.82, 0.2],
    [0.14, 0.72],
    [0.86, 0.66],
    [0.26, 0.32],
    [0.76, 0.36],
  ];
  for (let i = 0; i < starSeeds.length; i++) {
    const twinkle = (i + frameIdx) % 3 === 0 ? 0.85 : 0.32;
    ctx.fillStyle = i % 2 === 0 ? `rgba(255, 242, 196, ${twinkle})` : `${spec.backdropGlow}${twinkle > 0.5 ? 'cc' : '55'}`;
    const sx = Math.round(starSeeds[i][0] * w);
    const sy = Math.round(starSeeds[i][1] * h);
    ctx.fillRect(sx, sy, 2, 2);
  }
}

/**
 * 导出同一份像素立绘的 6 帧动态待机立绘序列
 * 支持传入目标输出尺寸（如 96 / 112 / 144），严格采用整数倍像素放大且与 CSS 显示框 1:1 对齐，
 * 彻底杜绝浏览器二次近邻降采样造成的大小眼、断线与像素畸变！
 */
export function getVoxelPortraitFrames(blueprintId: string, outSize = 112): string[] {
  const cacheKey = `${blueprintId}@${outSize}`;
  const cached = portraitFramesCache.get(cacheKey);
  if (cached) return cached;

  const spec = getRigSpec(blueprintId);
  const frames = getIdleBodyCanvases(blueprintId);
  const outW = outSize;
  const outH = outSize;

  // 若目标画布适合完整展示（108~116px 时 2×=96×108），优先完整展示防裁切羽翼/长枪/龙角；
  // 较小圆形魔导书（<=96px）采用头部特写 2×，超大英雄档案（144px）采用 portraitCrop 3×！
  const specW = spec.width ?? SPRITE_WIDTH;
  const specH = spec.height ?? SPRITE_HEIGHT;
  const useAvatar = outSize <= 96;
  const useFullSprite = !useAvatar && outSize <= 116;
  const srcX = useAvatar ? spec.avatarCrop.x : useFullSprite ? 0 : spec.portraitCrop.x;
  const srcY = useAvatar ? spec.avatarCrop.y : useFullSprite ? 0 : spec.portraitCrop.y;
  const srcW = useAvatar ? spec.avatarCrop.size : useFullSprite ? specW : spec.portraitCrop.w;
  const srcH = useAvatar ? spec.avatarCrop.size : useFullSprite ? specH : spec.portraitCrop.h;

  const intScale = Math.max(1, Math.floor(Math.min(outW / srcW, outH / srcH)));
  const dw = srcW * intScale;
  const dh = srcH * intScale;
  const dx = Math.floor((outW - dw) / 2);
  const dy = Math.floor((outH - dh) / 2) + (useAvatar ? 0 : 1);

  const urls = frames.map((src, idx) => {
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    drawSubtlePixelFrameBackdrop(ctx, outW, outH, spec, idx);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, srcX, srcY, srcW, srcH, dx, dy, dw, dh);
    return canvas.toDataURL('image/png');
  });

  portraitFramesCache.set(cacheKey, urls);
  return urls;
}

/** 获取单帧清晰立绘（默认取待机第 0 帧） */
export function getVoxelPortraitDataUrl(blueprintId: string, outSize = 144): string {
  return getVoxelPortraitFrames(blueprintId, outSize)[0];
}

/**
 * 直接从同一份精雕像素立绘精准截取头部/核心特写头像
 * 支持指定输出尺寸（32 / 40 / 64 / 80 / 96），确保与 CSS 像素盒 1:1 整数倍完美对齐！
 */
export function getVoxelAvatarDataUrl(blueprintId: string, outSize = 64): string {
  const cacheKey = `${blueprintId}@${outSize}`;
  const cached = avatarDataCache.get(cacheKey);
  if (cached) return cached;

  const spec = getRigSpec(blueprintId);
  const src = getIdleBodyCanvases(blueprintId)[0];
  const canvas = document.createElement('canvas');
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext('2d')!;
  drawSubtlePixelFrameBackdrop(ctx, outSize, outSize, spec, 0);

  ctx.imageSmoothingEnabled = false;
  const c = spec.avatarCrop;
  const intScale = Math.max(1, Math.floor(outSize / c.size));
  const drawSize = c.size * intScale;
  const offset = Math.floor((outSize - drawSize) / 2);
  ctx.drawImage(src, c.x, c.y, c.size, c.size, offset, offset, drawSize, drawSize);

  const url = canvas.toDataURL('image/png');
  avatarDataCache.set(cacheKey, url);
  return url;
}

/**
 * 扫描像素画布待机首帧，精确寻找最顶端的非透明像素行 Y（用于自动对齐头顶箭头与飘字，彻底适配 48×54 与 64×72 双画风）
 */
function measureCanvasTopOpaqueY(canvas: HTMLCanvasElement, fallbackTopY: number): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return fallbackTopY;
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; y++) {
    const rowOff = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[rowOff + x * 4 + 3] > 20) {
        return y;
      }
    }
  }
  return fallbackTopY;
}

/**
 * 获取（并缓存）指定角色/兵种的全套正反面 4 状态多帧骨骼像素动画纹理
 */
export function getBakedVoxelSpriteSet(blueprintId: string): BakedVoxelSpriteSet {
  const cached = spriteCache.get(blueprintId);
  if (cached) return cached;

  const spec = getRigSpec(blueprintId);
  const idleRightBodies = getIdleBodyCanvases(blueprintId);

  const bakeSide = (flipX: boolean): Record<SpriteAnimState, SpriteFrameTextures[]> => {
    const states: SpriteAnimState[] = ['idle', 'move', 'attack', 'hit'];
    const result = {} as Record<SpriteAnimState, SpriteFrameTextures[]>;
    for (const st of states) {
      const poses = buildPoseSequence(st);
      result[st] = poses.map((pose, idx) => {
        const bodyCanvas =
          !flipX && st === 'idle' && idleRightBodies[idx]
            ? idleRightBodies[idx]
            : renderRigFrameToCanvas(spec, pose, flipX, 'body');
        return {
          body: canvasToNearestTexture(bodyCanvas),
          glow: canvasToNearestTexture(renderRigFrameToCanvas(spec, pose, flipX, 'glow')),
          flash: canvasToNearestTexture(renderRigFrameToCanvas(spec, pose, flipX, 'flash')),
        };
      });
    }
    return result;
  };

  const animations = {
    right: bakeSide(false),
    left: bakeSide(true),
  };

  const specW = spec.width ?? SPRITE_WIDTH;
  const specH = spec.height ?? SPRITE_HEIGHT;
  const specOx = spec.originX ?? ORIGIN_X;
  const specOy = spec.originY ?? ORIGIN_Y;
  const renderScale = spec.renderScale ?? 1;
  const topOpaqueY = idleRightBodies[0]
    ? measureCanvasTopOpaqueY(idleRightBodies[0], Math.round(specOy * 0.25))
    : Math.round(specOy * 0.25);
  const visualHeadHeight = Math.max(20, Math.round((specOy - topOpaqueY) * renderScale));

  const set: BakedVoxelSpriteSet = {
    rightBody: animations.right.idle[0].body,
    leftBody: animations.left.idle[0].body,
    rightGlow: animations.right.idle[0].glow,
    leftGlow: animations.left.idle[0].glow,
    rightFlash: animations.right.idle[0].flash,
    leftFlash: animations.left.idle[0].flash,
    animations,
    width: specW,
    height: specH,
    anchorX: specOx / specW,
    anchorY: specOy / specH,
    renderScale,
    visualHeadHeight,
  };

  spriteCache.set(blueprintId, set);
  return set;
}

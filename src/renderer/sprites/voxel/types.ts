/**
 * 像素骨骼立绘引擎核心类型与默认画布规格定义
 *
 * 供像素画笔、蓝图绘谱与纹理烘焙器共享使用。
 */

import type * as PIXI from 'pixi.js';
import type { HdPixelPainter } from '../../hdPixelEngine';

/** 默认旧版骨骼立绘画布宽度（像素） */
export const SPRITE_WIDTH = 48;
/** 默认旧版骨骼立绘画布高度（像素） */
export const SPRITE_HEIGHT = 54;
/** 默认旧版骨骼立绘脚底锚点 X 坐标 */
export const ORIGIN_X = 24;
/** 默认旧版骨骼立绘脚底锚点 Y 坐标 */
export const ORIGIN_Y = 49;

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

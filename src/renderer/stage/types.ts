/**
 * PixiJS 战斗舞台核心类型与投影常量定义
 */

import type * as PIXI from 'pixi.js';
import type { FootprintSize, HexCoord, HexProjectionConfig } from '@core/hex';
import type { AttackPreview, BattleState, BattleUnit, ProjectileTrajectoryPreview } from '@core/types';
import { SHRINE_FIELD_PROJECTION } from '@data/definitions';
import type { PixelFxStageBridge } from '../pixelfxBridge';
import type { RangedProjectileKind, resolveRangedShotSound } from '../rangedProjectileFx';
import type { SpriteAnimState } from '../voxelSprites';

export const VIRTUAL_WIDTH = 880;
export const VIRTUAL_HEIGHT = 495;

/**
 * 复用数据层唯一真相源「斜 45° + 侧俯压扁」投影配置（rotationRad = -0.56, ySquash = 0.58, radius = 12.2）
 * 近千格不规则斜向六边形几乎铺满整个暗夜实景地面，兼顾斜向战场美感与超广包抄纵深！
 */
export const STAGE_PROJECTION: HexProjectionConfig = SHRINE_FIELD_PROJECTION;

export type GridVisibilityMode = 'subtle' | 'clear' | 'hidden';

export interface StageOverlayHints {
  activeUnitId: string | null;
  selectedUnitId: string | null;
  hoveredHex: HexCoord | null;
  /** 当前鼠标悬停的单位 ID（用于临时图层前置与防遮挡高亮） */
  hoveredUnitId: string | null;
  reachableHexKeys: ReadonlySet<string>;
  attackableUnitIds: ReadonlySet<string>;
  attackPreview: AttackPreview | null;
  /** 远程射击或施法悬停时的飞行路径与阻挡点可视化数据 */
  trajectoryPreview: ProjectileTrajectoryPreview | null;
  /** 悬停可达空地时的移动路径预览 */
  movePathPreview: HexCoord[] | null;
  /** 近战攻击敌方时，全部可达的合法落脚邻格 */
  meleeCandidateHexes: HexCoord[];
  /** 当前鼠标方位锁定的近战落脚格与目标格 */
  meleeApproachHex: HexCoord | null;
  meleeTargetHex: HexCoord | null;
  targetingMode: 'normal' | 'spell_unit' | 'spell_aoe' | 'spell_empty_hex' | 'spell_card_line';
  spellRange: number;
  /** 当前选定法术是否无视视线阻挡 */
  spellIgnoreLos: boolean;
  aoeRadius: number;
  lineLength: number;
  validSpellUnitIds: ReadonlySet<string>;
  validEmptyHexKeys?: ReadonlySet<string>;
  /** 掷山大力鬼「飞石轰击」悬停 2 环落点范围预览（在瞄空模式与常规悬停敌军/敌人附近空地时均生效） */
  areaRangedPreview?: { centerHex: HexCoord; radius: number; valid: boolean } | null;
}

export const FOOTPRINT_VISUAL_SCALE: Record<FootprintSize, number> = {
  '1x1': 1.0,
  '1x2': 1.12,
  '2x1': 1.12,
  '2x2': 1.38,
};

export interface UnitVisualNode {
  unitId: string;
  blueprintId: string;
  facing: 'left' | 'right';
  footprint: FootprintSize;
  spriteScale: number;
  /** 角色真实像素头顶高度（缩放前虚拟像素，源自烘焙贴图实测） */
  visualHeadHeight: number;
  container: PIXI.Container;
  shadow: PIXI.Graphics;
  /** 当前行动单位旋转星芒光柱 / 悬停单位临时浮起描边层 */
  activeHalo: PIXI.Graphics;
  baseRing: PIXI.Graphics;
  /** 幻象单位专用后置重影残像层（柔焦冰青游移，强化虚幻无实体感） */
  illusionGhostSprite: PIXI.Sprite;
  bodySprite: PIXI.Sprite;
  glowSprite: PIXI.Sprite;
  flashSprite: PIXI.Sprite;
  badgeContainer: PIXI.Container;
  badgeBg: PIXI.Graphics;
  badgeText: PIXI.Text;
  hpBarBg: PIXI.Graphics;
  hpBarFill: PIXI.Graphics;
  mpBarBg: PIXI.Graphics;
  mpBarFill: PIXI.Graphics;
  hasManaBar: boolean;
  baseX: number;
  baseY: number;
  offsetX: number;
  offsetY: number;
  bobPhase: number;
  flashTimer: number;
  animState: SpriteAnimState;
  animTime: number;
  animFps: number;
  animLoop: boolean;
  isFloating: boolean;
  isHero: boolean;
  /** 当前节点是否为幻象分身（驱动柔焦虚化、半透明脉冲与残影相位漂移） */
  isIllusion: boolean;
  lightSprite?: PIXI.Sprite;
}

export interface AmbientMote {
  sprite: PIXI.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

export interface FloatingLabel {
  text: PIXI.Text;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface ProjectileTrail {
  graphic: PIXI.Graphics;
  kind: RangedProjectileKind;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  arcHeight: number;
  elapsed: number;
  duration: number;
}

export interface BattleStageCallbacks {
  onHoverHex: (
    coord: HexCoord | null,
    clientPos: { x: number; y: number } | null,
    virtualPos: { x: number; y: number } | null,
  ) => void;
  onClickHex: (coord: HexCoord) => void;
  onRightClickHex: (coord: HexCoord, clientPos: { x: number; y: number }) => void;
  /** 触控轻触棋盘六边形（二段确认：首触预览，再触执行） */
  onTouchTapHex?: (
    coord: HexCoord | null,
    clientPos: { x: number; y: number },
    virtualPos: { x: number; y: number } | null,
  ) => void;
  /** 触控拖动滑览抬手后锁定最后预览的六边形 */
  onTouchScrubEnd?: (
    coord: HexCoord | null,
    clientPos: { x: number; y: number },
    virtualPos: { x: number; y: number } | null,
  ) => void;
  /** 触控长按（等效右键：打开单位详情或取消施法瞄准） */
  onLongPressHex?: (coord: HexCoord | null, clientPos: { x: number; y: number }) => void;
  onSpellCardBanner: (info: {
    name: string;
    subtitle: string;
    themeColor: string;
    accentColor: string;
    casterBlueprintId?: string;
  }) => void;
}

/** 单位节点渲染子系统依赖上下文 */
export interface UnitNodeRenderContext {
  unitLayer: PIXI.Container;
  badgeLayer: PIXI.Container;
  lightLayer: PIXI.Container;
  lightTex: PIXI.Texture;
  illusionBodyBlurFilter: PIXI.BlurFilter;
  illusionGhostBlurFilter: PIXI.BlurFilter;
  getHoveredUnitId: () => string | null;
}

/** 战斗事件演出动画子系统共享上下文 */
export interface StageAnimationContext {
  unitNodes: Map<string, UnitVisualNode>;
  unitLayer: PIXI.Container;
  projectileLayer: PIXI.Container;
  fxBridge: PixelFxStageBridge;
  callbacks: BattleStageCallbacks;
  getCurrentState: () => BattleState | null;
  getUnitRangedShotSound: (node: UnitVisualNode) => ReturnType<typeof resolveRangedShotSound>;
  spawnUnitRangedShot: (fromNode: UnitVisualNode, toNode: UnitVisualNode) => number;
  spawnProjectile: (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: number,
    opts?: {
      kind?: RangedProjectileKind;
      accentColor?: number;
      arcHeight?: number;
      duration?: number;
    },
  ) => void;
  spawnFloatingText: (x: number, y: number, message: string, color: string) => void;
  triggerImpactJuice: (intensity: number, hitStopSeconds: number) => void;
  syncUnitNode: (node: UnitVisualNode, unit: BattleUnit, state: BattleState) => void;
  ensureAndSyncUnitNode: (unit: BattleUnit, state: BattleState) => UnitVisualNode;
}

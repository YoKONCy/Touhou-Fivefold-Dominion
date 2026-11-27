/**
 * PixiJS v8 暗夜灵光六边形战斗舞台总控
 *
 * 架构职责：
 * - 全局锁定 640×360 虚拟像素分辨率 + 最近邻采样，彻底杜绝混合像素（Mixels）
 * - 管理 9 大图层（暗夜远景 → 2.5D 六边形箱庭 → 旋转符卡大阵 → 战术高亮与 LoS 射线 →
 *   精雕体素棋子 → 实时 2D 点光源 → 流萤微光粒子 → pixelfx 双缓冲辉光 → 飘浮像素战报字）
 * - 消费核心引擎输出的 CombatEvent[] 编排打击感动画（移动弹跳、H4 同时反击双向冲锋/互射、顿帧、震屏）
 * - 完全不修改任何战斗逻辑状态，仅将用户的六边形点击与悬停透传给状态桥
 */

import * as PIXI from 'pixi.js';
import { soundEngine } from '@audio/index';
import { checkSpellLineOfSight, findUnitAtHex, getUnitOccupiedHexes } from '@core/combatEngine';
import {
  getFootprintHexes,
  getHexRange,
  getProjectedHexPolygon,
  hexDistance,
  hexKey,
  hexRay,
  hexToPixel,
  pixelToHex,
  type FootprintSize,
  type HexCoord,
  type HexProjectionConfig,
  type HexTile,
} from '@core/hex';
import { computeUnitStats } from '@core/modifiers';
import { resolveUnitSummonKind, type AttackPreview, type BattleState, type BattleUnit, type CombatEvent } from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { SHRINE_FIELD_PROJECTION } from '@data/definitions';
import {
  bakeLayeredEnvironmentTexture,
  bakeSubtleHexGridTexture,
  createSoftPointLightTexture,
  createTerrainPropTexture,
  SpellCardMagicCircleLayer,
} from './hexTerrainRenderer';
import { PixelFxStageBridge, TOUHOU_PALETTES } from './pixelfxBridge';
import {
  buildRangedProjectileGraphic,
  resolveRangedShotSound,
  resolveUnitRangedProjectile,
  type RangedProjectileKind,
} from './rangedProjectileFx';
import { getSpellVfxChoreography } from './spellVfxCatalog';
import { getBakedVoxelSpriteSet, type SpriteAnimState } from './voxelSprites';

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
  reachableHexKeys: ReadonlySet<string>;
  attackableUnitIds: ReadonlySet<string>;
  attackPreview: AttackPreview | null;
  /** 悬停可达空地时的移动路径预览 */
  movePathPreview: HexCoord[] | null;
  /** 近战攻击敌方时，全部可达的合法落脚邻格 */
  meleeCandidateHexes: HexCoord[];
  /** 当前鼠标方位锁定的近战落脚格与目标格 */
  meleeApproachHex: HexCoord | null;
  meleeTargetHex: HexCoord | null;
  targetingMode: 'normal' | 'spell_unit' | 'spell_aoe' | 'spell_empty_hex' | 'spell_card_line';
  spellRange: number;
  aoeRadius: number;
  lineLength: number;
  validSpellUnitIds: ReadonlySet<string>;
  validEmptyHexKeys?: ReadonlySet<string>;
}

const FOOTPRINT_VISUAL_SCALE: Record<FootprintSize, number> = {
  '1x1': 1.0,
  '1x2': 1.12,
  '2x1': 1.12,
  '2x2': 1.38,
};

/** 计算多格单位占据格的视觉几何质心坐标（支持 1×1 ~ 2×2 任意体积居中落位） */
function getFootprintCenterPixel(
  anchor: HexCoord,
  footprint: FootprintSize,
  tiles: Record<string, HexTile>,
): { x: number; y: number } {
  const hexes = getFootprintHexes(anchor, footprint);
  let sx = 0;
  let sy = 0;
  for (const h of hexes) {
    const elev = tiles[hexKey(h)]?.elevation ?? 1;
    const p = hexToPixel(h, STAGE_PROJECTION, elev);
    sx += p.x;
    sy += p.y;
  }
  const n = Math.max(1, hexes.length);
  return { x: Math.round(sx / n), y: Math.round(sy / n) };
}

interface UnitVisualNode {
  unitId: string;
  blueprintId: string;
  facing: 'left' | 'right';
  footprint: FootprintSize;
  spriteScale: number;
  /** 角色真实像素头顶高度（缩放前虚拟像素，源自烘焙贴图实测） */
  visualHeadHeight: number;
  container: PIXI.Container;
  shadow: PIXI.Graphics;
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

interface AmbientMote {
  sprite: PIXI.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

interface FloatingLabel {
  text: PIXI.Text;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface ProjectileTrail {
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

function hexPolyFlatFromCoord(
  coord: HexCoord,
  elevation: number,
  radiusScale = 0.96,
): number[] {
  const pts = getProjectedHexPolygon(coord, STAGE_PROJECTION, elevation, radiusScale);
  const flat: number[] = [];
  for (const p of pts) flat.push(p.x, p.y);
  return flat;
}

function parseColorNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface BattleStageCallbacks {
  onHoverHex: (
    coord: HexCoord | null,
    clientPos: { x: number; y: number } | null,
    virtualPos: { x: number; y: number } | null,
  ) => void;
  onClickHex: (coord: HexCoord) => void;
  onRightClickHex: (coord: HexCoord, clientPos: { x: number; y: number }) => void;
  onSpellCardBanner: (info: {
    name: string;
    subtitle: string;
    themeColor: string;
    accentColor: string;
    casterBlueprintId?: string;
  }) => void;
}

export class BattleStage {
  private readonly hostEl: HTMLElement;
  private readonly callbacks: BattleStageCallbacks;
  private app: PIXI.Application | null = null;
  private worldRoot = new PIXI.Container();
  private environmentLayer = new PIXI.Container();
  private gridLayer = new PIXI.Container();
  private magicCircle!: SpellCardMagicCircleLayer;
  /** 静态战术高亮层（仅在回合/状态/施法态变更时重绘，鼠标移动期间零重绘！） */
  private staticOverlayGraphics = new PIXI.Graphics();
  /** 轻量悬停动态层（仅绘制当前悬停格、路径线、近战落脚箭头与 LoS 射线） */
  private hoverOverlayGraphics = new PIXI.Graphics();
  private lastStaticOverlaySig = '';
  private lastHoverOverlaySig = '';
  private unitLayer = new PIXI.Container();
  private lightLayer = new PIXI.Container();
  /** 独立前景兵力角标层：棋子身体参与 2.5D 障碍遮挡，而兵力数字与血条永远清晰不遮挡 */
  private badgeLayer = new PIXI.Container();
  /** 幻象单位专用轻度柔焦虚化滤镜（边缘羽化如水月镜花，同时保持辨识度） */
  private readonly illusionBodyBlurFilter = new PIXI.BlurFilter({
    strength: 1.45,
    quality: 2,
    padding: 6,
  });
  /** 幻象后置残像重影层柔光虚化滤镜 */
  private readonly illusionGhostBlurFilter = new PIXI.BlurFilter({
    strength: 2.6,
    quality: 2,
    padding: 8,
  });
  private ambientLayer = new PIXI.Container();
  private projectileLayer = new PIXI.Container();
  private fxBridge!: PixelFxStageBridge;
  private floatingLayer = new PIXI.Container();

  private lightTex!: PIXI.Texture;
  private environmentSprite: PIXI.Sprite | null = null;
  private gridSprite: PIXI.Sprite | null = null;
  private terrainPropNodes: PIXI.Sprite[] = [];
  private gridMode: GridVisibilityMode = 'subtle';
  private unitNodes = new Map<string, UnitVisualNode>();
  /** 当前可操控单位头顶极其醒目的弹跳亮金大指示箭头 ▼ */
  private activePointerArrow = new PIXI.Graphics();
  private ambientMotes: AmbientMote[] = [];
  private floatingLabels: FloatingLabel[] = [];
  private projectiles: ProjectileTrail[] = [];

  private currentState: BattleState | null = null;
  private currentTilesMap = new Map<string, HexTile>();
  private currentHints: StageOverlayHints | null = null;

  /** 画面缩放与居中偏移，用于精准反算鼠标六边形坐标 */
  private viewScale = 1;
  private viewOffsetX = 0;
  private viewOffsetY = 0;
  private lastViewportW = 0;
  private lastViewportH = 0;

  /** 高刷新率鼠标 pointermove 帧合并缓冲（每帧至多响应一次，彻底消除画面抖动抽搐） */
  private pendingPointerClient: { x: number; y: number } | null = null;
  private pendingPointerRaf: number | null = null;

  /** 打击感控制：震屏与顿帧 */
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private hitStopTimer = 0;
  private globalTime = 0;
  private destroyed = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(hostEl: HTMLElement, callbacks: BattleStageCallbacks) {
    this.hostEl = hostEl;
    this.callbacks = callbacks;
  }

  public async init(initialState: BattleState): Promise<void> {
    const app = new PIXI.Application();
    const initW = Math.max(1, this.hostEl.clientWidth || window.innerWidth);
    const initH = Math.max(1, this.hostEl.clientHeight || window.innerHeight);
    await app.init({
      width: initW,
      height: initH,
      backgroundColor: 0x070912,
      antialias: false,
      roundPixels: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    if (this.destroyed) {
      app.destroy(true);
      return;
    }

    this.app = app;
    app.canvas.style.display = 'block';
    app.canvas.style.width = '100%';
    app.canvas.style.height = '100%';
    this.hostEl.innerHTML = '';
    this.hostEl.appendChild(app.canvas);

    // 1. 组装五层景深暗夜灵光虚拟像素舞台（实景大地 → 极淡六边形格 → 贴地符卡阵 → 静/动分离战术高亮 → 棋子与障碍混排 → 点光源 → 独立血蓝条 → 特效）
    app.stage.addChild(this.worldRoot);

    this.magicCircle = new SpellCardMagicCircleLayer(STAGE_PROJECTION.originX, STAGE_PROJECTION.originY);
    this.unitLayer.sortableChildren = true;
    this.fxBridge = new PixelFxStageBridge(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    this.lightTex = createSoftPointLightTexture(110);

    this.worldRoot.addChild(
      this.environmentLayer,
      this.gridLayer,
      this.magicCircle.container,
      this.staticOverlayGraphics,
      this.hoverOverlayGraphics,
      this.unitLayer,
      this.lightLayer,
      this.badgeLayer,
      this.ambientLayer,
      this.projectileLayer,
      this.fxBridge.sprite,
      this.floatingLayer,
    );

    this.badgeLayer.addChild(this.activePointerArrow);
    this.drawActivePointerArrow();
    this.setupStaticLights();
    this.setupAmbientMotes();
    this.syncState(initialState);
    this.updateViewportTransform();

    // 绑定自适应缩放监听与指针交互
    this.resizeObserver = new ResizeObserver(() => this.updateViewportTransform());
    this.resizeObserver.observe(this.hostEl);

    app.canvas.addEventListener('pointermove', this.handlePointerMove);
    app.canvas.addEventListener('pointerleave', this.handlePointerLeave);
    app.canvas.addEventListener('pointerdown', this.handlePointerDown);
    app.canvas.addEventListener('contextmenu', this.handleContextMenu);

    // 启动 60fps 主循环
    app.ticker.add((ticker) => {
      const dt = Math.min(0.05, ticker.deltaMS / 1000);
      this.tick(dt);
    });
  }

  /**
   * 布置暗夜幻想乡场景固定氛围点光源（贴合中景石灯笼、魔法屋、满月与中央灵泉位置）
   */
  private setupStaticLights(): void {
    const addLight = (x: number, y: number, color: number, scale: number, alpha: number) => {
      const sp = new PIXI.Sprite(this.lightTex);
      sp.anchor.set(0.5);
      sp.position.set(x, y);
      sp.tint = color;
      sp.scale.set(scale);
      sp.alpha = alpha;
      sp.blendMode = 'add';
      this.lightLayer.addChild(sp);
    };

    // 场边石灯笼与魔法屋暖橙点光源（贴合不规则林湾灯笼坐标）
    addLight(26, Math.round(VIRTUAL_HEIGHT * 0.31), 0xff9a4d, 1.15, 0.26);
    addLight(24, Math.round(VIRTUAL_HEIGHT * 0.75), 0xff9a4d, 1.1, 0.24);
    addLight(Math.round(VIRTUAL_WIDTH * 0.86), Math.round(VIRTUAL_HEIGHT * 0.21), 0xf6c945, 1.4, 0.22);
    addLight(VIRTUAL_WIDTH - 26, Math.round(VIRTUAL_HEIGHT * 0.31), 0xffb85c, 1.15, 0.24);
    addLight(VIRTUAL_WIDTH - 24, Math.round(VIRTUAL_HEIGHT * 0.75), 0xffb85c, 1.1, 0.22);
    // 中央灵泉幽青水光
    addLight(STAGE_PROJECTION.originX - 42, STAGE_PROJECTION.originY + 4, 0x4fc8ff, 1.3, 0.18);
    addLight(STAGE_PROJECTION.originX + 42, STAGE_PROJECTION.originY - 4, 0x4fc8ff, 1.3, 0.18);
    // 天顶满月洒下的银蓝月晕
    addLight(VIRTUAL_WIDTH * 0.56, Math.round(VIRTUAL_HEIGHT * 0.09), 0x99bdff, 2.9, 0.14);
  }

  /**
   * 暗夜漂浮流萤与星尘粒子
   */
  private setupAmbientMotes(): void {
    const colors = [0xffe7a8, 0x7ae8ff, 0xff8ea3, 0xb89cff];
    for (let i = 0; i < 28; i++) {
      const g = new PIXI.Graphics();
      const col = colors[i % colors.length];
      g.rect(0, 0, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1).fill({ color: col, alpha: 0.85 });
      const mote: AmbientMote = {
        sprite: g,
        x: (i * 53) % VIRTUAL_WIDTH,
        y: 38 + ((i * 37) % (VIRTUAL_HEIGHT - 60)),
        vx: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 1.4),
        vy: -2 - (i % 4) * 1.1,
        phase: i * 0.7,
      };
      g.position.set(mote.x, mote.y);
      this.ambientLayer.addChild(g);
      this.ambientMotes.push(mote);
    }
  }

  private updateViewportTransform(): void {
    if (!this.app) return;
    const w = Math.max(1, Math.round(this.hostEl.clientWidth || window.innerWidth));
    const h = Math.max(1, Math.round(this.hostEl.clientHeight || window.innerHeight));
    // 严格判重：容器尺寸未真正变化时不调用 renderer.resize，彻底杜绝 DPI 小数缩放引发的整屏闪动抽搐！
    if (w === this.lastViewportW && h === this.lastViewportH) return;
    this.lastViewportW = w;
    this.lastViewportH = h;

    this.app.renderer.resize(w, h);

    const scale = Math.min(w / VIRTUAL_WIDTH, h / VIRTUAL_HEIGHT);
    this.viewScale = Math.max(0.5, scale);
    this.viewOffsetX = Math.floor((w - VIRTUAL_WIDTH * this.viewScale) / 2);
    this.viewOffsetY = Math.floor((h - VIRTUAL_HEIGHT * this.viewScale) / 2);

    this.worldRoot.scale.set(this.viewScale);
    this.worldRoot.position.set(this.viewOffsetX, this.viewOffsetY);
  }

  private clientToVirtual(clientX: number, clientY: number): { x: number; y: number } | null {
    if (!this.app) return null;
    const rect = this.app.canvas.getBoundingClientRect();
    const x = (clientX - rect.left - this.viewOffsetX) / this.viewScale;
    const y = (clientY - rect.top - this.viewOffsetY) / this.viewScale;
    if (x < 0 || y < 0 || x > VIRTUAL_WIDTH || y > VIRTUAL_HEIGHT) return null;
    return { x, y };
  }

  /**
   * 精准解析鼠标命中格（彻底解决高大棋子遮挡与贴身混战选敌难题）：
   * 悬停/左键（!includeKnockedOut）时按以下优先级命中：
   * 1. 地面六边形直接站着敌方存活单位；
   * 2. 光标落在了某个敌方单位的前景躯干盒内（即使其上半身挡住了身后友军脚底格！）；
   * 3. 地面六边形站着友方存活单位；
   * 4. 光标落在了友方单位的前景躯干盒内；
   * 5. 返回地面空六边形格。
   * 右键查详情（includeKnockedOut = true）时优先返回地面存活/倒地单位，其次按前景顺序命中躯干。
   */
  private resolvePointerHex(vx: number, vy: number, includeKnockedOut = false): HexCoord | null {
    const state = this.currentState;
    const groundHex = pixelToHex(vx, vy, STAGE_PROJECTION, this.currentTilesMap);
    const groundValid = this.currentTilesMap.has(hexKey(groundHex));

    if (state) {
      const groundUnit = groundValid ? findUnitAtHex(state, groundHex, includeKnockedOut) : null;
      const activeUnit = state.activeUnitId ? state.units[state.activeUnitId] : null;
      const activeSide = activeUnit && activeUnit.status === 'alive' ? activeUnit.side : null;

      const hitTestTorso = (filter: (u: BattleUnit) => boolean): HexCoord | null => {
        const sortedNodes = Array.from(this.unitNodes.values())
          .filter((n) => n.container.visible)
          .sort((a, b) => b.baseY - a.baseY);
        for (const node of sortedNodes) {
          const unit = state.units[node.unitId];
          if (!unit || unit.status === 'dead') continue;
          if (!includeKnockedOut && unit.status !== 'alive') continue;
          if (!filter(unit)) continue;

          const halfW = 10 * node.spriteScale;
          const topH = Math.max(29, node.visualHeadHeight * 0.92) * node.spriteScale + (node.isFloating ? 5 : 0);
          if (
            vx >= node.baseX - halfW &&
            vx <= node.baseX + halfW &&
            vy >= node.baseY - topH &&
            vy <= node.baseY + 2
          ) {
            return { q: unit.pos.q, r: unit.pos.r };
          }
        }
        return null;
      };

      if (!includeKnockedOut && activeSide) {
        // 1. 地面直接踩中敌方存活单位
        if (groundUnit && groundUnit.side !== activeSide) {
          return groundHex;
        }
        // 2. 前景敌方躯干优先于身后友军脚底格，贴身混战也能精准锁敌
        const enemyTorso = hitTestTorso((u) => u.side !== activeSide);
        if (enemyTorso) {
          return enemyTorso;
        }
        // 3. 地面友方存活单位
        if (groundUnit) {
          return groundHex;
        }
        // 4. 友方躯干
        const allyTorso = hitTestTorso((u) => u.side === activeSide);
        if (allyTorso) {
          return allyTorso;
        }
      } else {
        // 右键查详情或非行动态：地面存活单位 → 任意前景躯干 → 地面倒地英雄
        if (groundUnit && groundUnit.status === 'alive') {
          return groundHex;
        }
        const anyTorso = hitTestTorso(() => true);
        if (anyTorso) {
          return anyTorso;
        }
        if (groundUnit) {
          return groundHex;
        }
      }
    }

    return groundValid ? groundHex : null;
  }

  private handlePointerMove = (e: PointerEvent): void => {
    this.pendingPointerClient = { x: e.clientX, y: e.clientY };
    if (this.pendingPointerRaf !== null) return;
    this.pendingPointerRaf = window.requestAnimationFrame(() => {
      this.pendingPointerRaf = null;
      if (this.destroyed || !this.pendingPointerClient) return;
      const client = this.pendingPointerClient;
      const pt = this.clientToVirtual(client.x, client.y);
      if (!pt) {
        this.callbacks.onHoverHex(null, null, null);
        return;
      }
      const resolvedHex = this.resolvePointerHex(pt.x, pt.y, false);
      this.callbacks.onHoverHex(resolvedHex, client, pt);
    });
  };

  private handlePointerLeave = (): void => {
    this.pendingPointerClient = null;
    if (this.pendingPointerRaf !== null) {
      window.cancelAnimationFrame(this.pendingPointerRaf);
      this.pendingPointerRaf = null;
    }
    this.callbacks.onHoverHex(null, null, null);
  };

  /** 绘制当前可控单位头顶的精致亮金指示箭头 ▼ */
  private drawActivePointerArrow(): void {
    const g = this.activePointerArrow;
    g.clear();
    g.poly([0, 7, -5, -1, -2, -1, -2, -5, 2, -5, 2, -1, 5, -1], true)
      .fill({ color: 0xffe46b, alpha: 0.98 })
      .stroke({ width: 1.25, color: 0x161224, alpha: 0.95 });
    g.poly([0, 4.5, -2.5, 0, 2.5, 0], true).fill({ color: 0xffffff, alpha: 0.9 });
    g.visible = false;
  }

  private handlePointerDown = (e: PointerEvent): void => {
    const pt = this.clientToVirtual(e.clientX, e.clientY);
    if (!pt) return;

    if (e.button === 0) {
      const resolved = this.resolvePointerHex(pt.x, pt.y, false);
      if (resolved) this.callbacks.onClickHex(resolved);
    }
  };

  /**
   * 在 contextmenu 阶段触发右键单位详情：
   * 彻底避免 Windows 下 pointerdown 刚挂载全屏居中大弹窗，同一次点击抬起时的 contextmenu 立刻把弹窗关掉的经典竞态 Bug！
   */
  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    const pt = this.clientToVirtual(e.clientX, e.clientY);
    if (!pt) return;
    const resolved = this.resolvePointerHex(pt.x, pt.y, true);
    if (resolved) this.callbacks.onRightClickHex(resolved, { x: e.clientX, y: e.clientY });
  };

  /**
   * 切换贴地六边形网格的视觉显隐档位（默认极淡 subtle，真正融入地面）
   */
  public setGridMode(mode: GridVisibilityMode): void {
    this.gridMode = mode;
    if (this.gridSprite) {
      this.gridSprite.alpha = mode === 'subtle' ? 0.085 : mode === 'clear' ? 0.28 : 0;
    }
  }

  /**
   * 同步最新逻辑状态至渲染舞台（重建或更新实景大地、立体障碍物、体素棋子与盘面结界）
   */
  public syncState(state: BattleState): void {
    this.currentState = state;
    this.currentTilesMap = new Map(Object.entries(state.tiles));

    // 首次烘焙五层景深暗夜实景大地 + 极淡贴地六边形网格 + 可深度混排的竹林/玄石碑
    if (!this.environmentSprite) {
      const envTex = bakeLayeredEnvironmentTexture(VIRTUAL_WIDTH, VIRTUAL_HEIGHT, state.tiles, STAGE_PROJECTION);
      this.environmentSprite = new PIXI.Sprite(envTex);
      this.environmentLayer.addChild(this.environmentSprite);

      const gridTex = bakeSubtleHexGridTexture(VIRTUAL_WIDTH, VIRTUAL_HEIGHT, state.tiles, STAGE_PROJECTION);
      this.gridSprite = new PIXI.Sprite(gridTex);
      this.gridSprite.alpha = this.gridMode === 'subtle' ? 0.085 : this.gridMode === 'clear' ? 0.28 : 0;
      this.gridLayer.addChild(this.gridSprite);

      // 将扎根大地的竹林与玄石碑放入 unitLayer 参与实时 Y 深度排序，形成真实 2.5D 遮挡！
      const forestTex = createTerrainPropTexture('forest');
      const rockTex = createTerrainPropTexture('rock');
      for (const tile of Object.values(state.tiles)) {
        if (tile.terrain !== 'forest' && tile.terrain !== 'rock') continue;
        const prop = new PIXI.Sprite(tile.terrain === 'forest' ? forestTex : rockTex);
        prop.anchor.set(0.5, 29 / 34);
        const pt = hexToPixel(tile, STAGE_PROJECTION, 1);
        prop.position.set(pt.x, pt.y + 3);
        prop.zIndex = Math.round(pt.y + 3);
        this.unitLayer.addChild(prop);
        this.terrainPropNodes.push(prop);
      }
    }

    // 同步符卡结界旋转大阵
    if (state.activeFieldAura) {
      this.magicCircle.setAura({
        pattern: state.activeFieldAura.pattern,
        themeColor: state.activeFieldAura.themeColor,
        accentColor: state.activeFieldAura.accentColor,
      });
    } else {
      this.magicCircle.setAura(null);
    }

    // 同步所有单位体素棋子
    const seen = new Set<string>();
    for (const unit of Object.values(state.units)) {
      seen.add(unit.id);
      let node = this.unitNodes.get(unit.id);
      if (!node) {
        node = this.createUnitVisualNode(unit);
        this.unitNodes.set(unit.id, node);
      }
      this.updateUnitVisualNode(node, unit, state);
    }

    for (const [id, node] of this.unitNodes.entries()) {
      if (!seen.has(id)) {
        // 销毁节点前先解绑共享滤镜引用，防止误毁全局共享 BlurFilter
        node.bodySprite.filters = null;
        node.illusionGhostSprite.filters = null;
        node.container.destroy({ children: true });
        node.badgeContainer.destroy({ children: true });
        node.lightSprite?.destroy();
        this.unitNodes.delete(id);
      }
    }

    if (this.currentHints) {
      this.updateOverlay(this.currentHints, true);
    }
  }

  private createUnitVisualNode(unit: BattleUnit): UnitVisualNode {
    const container = new PIXI.Container();
    const baked = getBakedVoxelSpriteSet(unit.voxelBlueprintId);
    const spriteScale = FOOTPRINT_VISUAL_SCALE[unit.footprint] ?? 1;

    const shadow = new PIXI.Graphics();
    const shadowRx = (unit.kind === 'hero' ? 11 : 9) * spriteScale;
    const shadowRy = 5 * spriteScale;
    shadow.ellipse(0, 2, shadowRx, shadowRy).fill({ color: 0x04060d, alpha: 0.62 });

    const baseRing = new PIXI.Graphics();
    const visualSpriteScale = spriteScale * (baked.renderScale ?? 1);
    const illusionGhostSprite = new PIXI.Sprite(unit.facing === 'right' ? baked.rightBody : baked.leftBody);
    illusionGhostSprite.anchor.set(baked.anchorX, baked.anchorY);
    illusionGhostSprite.scale.set(visualSpriteScale);
    illusionGhostSprite.blendMode = 'add';
    illusionGhostSprite.tint = 0x4deeff;
    illusionGhostSprite.alpha = 0;
    illusionGhostSprite.visible = false;

    const bodySprite = new PIXI.Sprite(unit.facing === 'right' ? baked.rightBody : baked.leftBody);
    bodySprite.anchor.set(baked.anchorX, baked.anchorY);
    bodySprite.scale.set(visualSpriteScale);

    const glowSprite = new PIXI.Sprite(unit.facing === 'right' ? baked.rightGlow : baked.leftGlow);
    glowSprite.anchor.set(baked.anchorX, baked.anchorY);
    glowSprite.scale.set(visualSpriteScale);
    glowSprite.blendMode = 'add';
    glowSprite.alpha = 0.72;

    const flashSprite = new PIXI.Sprite(unit.facing === 'right' ? baked.rightFlash : baked.leftFlash);
    flashSprite.anchor.set(baked.anchorX, baked.anchorY);
    flashSprite.scale.set(visualSpriteScale);
    flashSprite.alpha = 0;

    // 脚底一体化袖珍兵力角标 + 纤细高对比血蓝条（彻底解放角色头顶、帽檐与脸部，绝不遮挡像素立绘！）
    const badgeContainer = new PIXI.Container();
    const badgeBg = new PIXI.Graphics();
    const badgeText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'Cambria, Consolas, "Microsoft YaHei", serif',
        fontSize: 7,
        fontWeight: 'bold',
        fill: '#f7efd9',
      },
    });
    badgeText.anchor.set(0.5, 0.5);
    badgeText.resolution = 2;

    const hpBarBg = new PIXI.Graphics();
    const hpBarFill = new PIXI.Graphics();
    const mpBarBg = new PIXI.Graphics();
    const mpBarFill = new PIXI.Graphics();
    badgeContainer.addChild(hpBarBg, hpBarFill, mpBarBg, mpBarFill, badgeBg, badgeText);

    container.addChild(shadow, baseRing, illusionGhostSprite, bodySprite, glowSprite, flashSprite);
    this.unitLayer.addChild(container);
    this.badgeLayer.addChild(badgeContainer);

    let lightSprite: PIXI.Sprite | undefined;
    if (
      unit.kind === 'hero' ||
      unit.defId === 'vengeful_spirit' ||
      unit.defId === 'grimoire_familiar' ||
      unit.defId === 'hisoutensoku' ||
      unit.defId === 'arcane_colossus' ||
      unit.defId === 'yinyang_turret' ||
      unit.defId === 'hakurei_seraph' ||
      unit.defId === 'starfire_efreet' ||
      unit.defId === 'crimson_star_dragon' ||
      unit.defId === 'miasma_nightmare' ||
      unit.defId === 'wraith_spirit' ||
      unit.defId === 'bone_dragon' ||
      unit.defId === 'abyss_gap_devil' ||
      unit.defId === 'abyss_ice_demon'
    ) {
      lightSprite = new PIXI.Sprite(this.lightTex);
      lightSprite.anchor.set(0.5);
      lightSprite.tint = parseColorNumber(unit.themeColor);
      lightSprite.scale.set(unit.kind === 'hero' ? 1.05 : 0.65 * spriteScale);
      lightSprite.alpha = unit.kind === 'hero' ? 0.3 : 0.16;
      lightSprite.blendMode = 'add';
      this.lightLayer.addChild(lightSprite);
    }

    return {
      unitId: unit.id,
      blueprintId: unit.voxelBlueprintId,
      facing: unit.facing,
      footprint: unit.footprint,
      spriteScale,
      visualHeadHeight: baked.visualHeadHeight,
      container,
      shadow,
      baseRing,
      illusionGhostSprite,
      bodySprite,
      glowSprite,
      flashSprite,
      badgeContainer,
      badgeBg,
      badgeText,
      hpBarBg,
      hpBarFill,
      mpBarBg,
      mpBarFill,
      hasManaBar: unit.kind === 'hero' || unit.baseStats.maxMana > 0,
      baseX: 0,
      baseY: 0,
      offsetX: 0,
      offsetY: 0,
      bobPhase: Math.random() * Math.PI * 2,
      flashTimer: 0,
      animState: 'idle',
      animTime: Math.random() * 2,
      animFps: 6.5,
      animLoop: true,
      isFloating: Boolean(unit.abilities.flying),
      isHero: unit.kind === 'hero',
      isIllusion: resolveUnitSummonKind(unit) === 'illusion',
      lightSprite,
    };
  }

  /** 切换单位肢体动作状态并立即刷新第 0 帧（支持 idle / move / attack / hit） */
  private setNodeAnim(
    node: UnitVisualNode,
    state: SpriteAnimState,
    fps?: number,
    loop = true,
  ): void {
    node.animState = state;
    node.animTime = 0;
    node.animLoop = loop;
    node.animFps = fps ?? (state === 'move' ? 11 : state === 'attack' ? 10 : state === 'hit' ? 9 : 6.5);
    this.applyNodeAnimFrame(node, 0);
  }

  /** 将指定索引的精雕像素动作帧应用至主体/辉光/受击闪白三层精灵 */
  private applyNodeAnimFrame(node: UnitVisualNode, frameIdx: number): void {
    const baked = getBakedVoxelSpriteSet(node.blueprintId);
    const frames = baked.animations[node.facing][node.animState];
    if (!frames || frames.length === 0) return;
    const idx = Math.max(0, Math.min(frames.length - 1, frameIdx));
    const f = frames[idx];
    if (node.bodySprite.texture !== f.body) node.bodySprite.texture = f.body;
    if (node.isIllusion && node.illusionGhostSprite.texture !== f.body) {
      node.illusionGhostSprite.texture = f.body;
    }
    if (node.glowSprite.texture !== f.glow) node.glowSprite.texture = f.glow;
    if (node.flashSprite.texture !== f.flash) node.flashSprite.texture = f.flash;
  }

  /** 计算角色真实非透明头顶相对于脚底锚点 baseY 的竖直偏移（负数，含飞行悬浮顶峰余量） */
  private getSpriteHeadTopOffsetY(node: UnitVisualNode): number {
    const floatClearance = node.isFloating ? 6 : 0;
    return -Math.round(node.visualHeadHeight * node.spriteScale + floatClearance);
  }

  /** 计算脚底一体化状态托盘（兵力角标 + 纤细血蓝条）相对于脚底锚点 baseY 的紧凑偏移 */
  private getBadgeFootOffsetY(node: UnitVisualNode, isKnockedOut = false): number {
    if (isKnockedOut) return 2;
    // 飞行单位主体上浮 -5px，脚底托盘微收至 +3px 避免触碰下排单位头顶；陆地单位紧贴鞋底 +5px
    return node.isFloating ? 3 : 5;
  }

  private updateUnitVisualNode(node: UnitVisualNode, unit: BattleUnit, state: BattleState): void {
    const center = getFootprintCenterPixel(unit.pos, unit.footprint, state.tiles);
    node.baseX = center.x;
    node.baseY = center.y + 4;
    node.facing = unit.facing;
    node.blueprintId = unit.voxelBlueprintId;
    const baked = getBakedVoxelSpriteSet(node.blueprintId);
    node.visualHeadHeight = baked.visualHeadHeight;
    const visualSpriteScale = node.spriteScale * (baked.renderScale ?? 1);
    node.illusionGhostSprite.anchor.set(baked.anchorX, baked.anchorY);
    node.illusionGhostSprite.scale.set(visualSpriteScale);
    node.bodySprite.anchor.set(baked.anchorX, baked.anchorY);
    node.bodySprite.scale.set(visualSpriteScale);
    node.glowSprite.anchor.set(baked.anchorX, baked.anchorY);
    node.glowSprite.scale.set(visualSpriteScale);
    node.flashSprite.anchor.set(baked.anchorX, baked.anchorY);
    node.flashSprite.scale.set(visualSpriteScale);

    if (unit.status === 'dead') {
      node.container.visible = false;
      node.badgeContainer.visible = false;
      if (node.lightSprite) node.lightSprite.visible = false;
      return;
    }

    node.container.visible = true;
    node.badgeContainer.visible = true;
    if (node.lightSprite) {
      node.lightSprite.visible = unit.status === 'alive';
    }

    // 同步当前动作帧纹理（倒地时定格受击首帧）
    if (unit.status === 'knocked_out') {
      node.animState = 'hit';
      this.applyNodeAnimFrame(node, 0);
    } else {
      const len = baked.animations[node.facing][node.animState].length;
      const curIdx = Math.floor(node.animTime * node.animFps) % Math.max(1, len);
      this.applyNodeAnimFrame(node, curIdx);
    }

    const summonKind = resolveUnitSummonKind(unit);
    const isIllusion = summonKind === 'illusion';
    node.isIllusion = isIllusion;

    // 英雄倒地低对比压暗处理；幻象分身启用柔焦虚化滤镜 + 半透明冰青闪烁 + 后置漂移残影 + 淡化脚影！
    if (unit.status === 'knocked_out') {
      node.bodySprite.rotation = unit.side === 'left' ? -1.15 : 1.15;
      node.bodySprite.alpha = 0.38;
      node.bodySprite.tint = 0xffffff;
      node.bodySprite.filters = null;
      node.illusionGhostSprite.visible = false;
      node.illusionGhostSprite.filters = null;
      node.glowSprite.tint = 0xffffff;
      node.glowSprite.alpha = 0.06;
      node.shadow.alpha = 0.5;
      node.badgeText.text = '倒地';
    } else if (isIllusion) {
      node.bodySprite.rotation = 0;
      node.bodySprite.alpha = 0.52;
      node.bodySprite.tint = 0x9cf3ff;
      node.bodySprite.filters = [this.illusionBodyBlurFilter];
      node.illusionGhostSprite.texture = node.bodySprite.texture;
      node.illusionGhostSprite.visible = true;
      node.illusionGhostSprite.tint = 0x4deeff;
      node.illusionGhostSprite.alpha = 0.3;
      node.illusionGhostSprite.filters = [this.illusionGhostBlurFilter];
      node.glowSprite.tint = 0x78f8ff;
      node.glowSprite.alpha = 0.65;
      node.shadow.alpha = 0.24;
      node.badgeText.text = `${unit.count}`;
    } else {
      node.bodySprite.rotation = 0;
      node.bodySprite.alpha = 1;
      node.bodySprite.tint = 0xffffff;
      node.bodySprite.filters = null;
      node.illusionGhostSprite.visible = false;
      node.illusionGhostSprite.filters = null;
      node.glowSprite.tint = 0xffffff;
      node.glowSprite.alpha = 0.72;
      node.shadow.alpha = 1;
      node.badgeText.text = unit.kind === 'hero' ? `Lv${unit.level ?? 1}` : `${unit.count}`;
    }

    const isActive = state.activeUnitId === unit.id && unit.status === 'alive';
    const summonRingColor =
      summonKind === 'illusion'
        ? 0x4deeff
        : summonKind === 'summoned'
          ? 0xffb845
          : summonKind === 'raised'
            ? 0xb95eff
            : null;
    const ringColor = isActive
      ? 0xffe46b
      : summonRingColor !== null
        ? summonRingColor
        : unit.side === 'left'
          ? 0xe64c65
          : 0xf6c945;
    node.baseRing.clear();
    if (unit.status === 'alive') {
      const rx = (unit.kind === 'hero' ? 13 : 10) * node.spriteScale;
      const ry = (unit.kind === 'hero' ? 7 : 5.5) * node.spriteScale;
      node.baseRing
        .ellipse(0, 1, rx, ry)
        .stroke({
          width: isActive ? 2.2 : summonKind ? 1.25 : 1,
          color: ringColor,
          alpha: isActive ? 0.98 : summonKind ? 0.68 : 0.45,
        });
      if (isActive) {
        node.baseRing
          .ellipse(0, 1, rx + 3, ry + 2)
          .stroke({ width: 1, color: 0xffffff, alpha: 0.7 });
      } else if (isIllusion) {
        // 幻象脚底额外加一圈淡淡的冰青虚影涟漪环，强化镜像分身识别
        node.baseRing
          .ellipse(0, 1, rx + 2.5, ry + 1.4)
          .stroke({ width: 0.8, color: 0xa6f7ff, alpha: 0.35 });
      }
    }

    // 脚底一体化紧凑底座条：[兵力/等级角标] + [纤细血蓝条] 横向居中紧贴脚底，彻底解放角色头顶与面部！
    const stats = computeUnitStats(unit, state, TOUHOU_CATALOG);
    const hasMana = stats.maxMana > 0;
    node.hasManaBar = hasMana;

    const maxHp = Math.max(1, stats.maxHp);
    const hpRatio = Math.max(0, Math.min(1, unit.currentHp / maxHp));
    const isWounded = unit.status === 'alive' && hpRatio < 0.999;

    const footOffsetY = this.getBadgeFootOffsetY(node, unit.status === 'knocked_out');
    node.badgeContainer.position.set(node.baseX + node.offsetX, node.baseY + node.offsetY + footOffsetY);
    node.badgeContainer.alpha =
      unit.status === 'knocked_out' ? 0.58 : isActive || isWounded ? 0.98 : 0.88;
    node.badgeBg.clear();
    node.hpBarBg.clear();
    node.hpBarFill.clear();
    node.mpBarBg.clear();
    node.mpBarFill.clear();

    const frameBorder = isActive
      ? 0xffe478
      : summonKind === 'illusion'
        ? 0x5ceeff
        : summonKind === 'summoned'
          ? 0xffca5c
          : summonKind === 'raised'
            ? 0xd68aff
            : 0xc29e5c;
    const crestFill =
      unit.status === 'knocked_out'
        ? 0x26202b
        : unit.side === 'left'
          ? 0x8f1d30
          : 0x1e3f73;

    const labelStr = node.badgeText.text;
    const tagW = unit.status === 'knocked_out' ? 18 : unit.kind === 'hero' ? 15 : labelStr.length >= 3 ? 15 : 12;
    const tagH = 8;

    if (unit.status === 'alive') {
      const barW = unit.kind === 'hero' ? 20 : node.spriteScale > 1.2 ? 20 : 16;
      const hpH = hasMana ? 3 : 3.5;
      const mpH = hasMana ? 2 : 0;
      const barGap = hasMana ? 1 : 0;
      const totalBarH = hpH + barGap + mpH;
      const groupGap = 1.5;
      const totalGroupW = tagW + groupGap + barW;
      const groupLeft = -Math.round(totalGroupW / 2);

      // 左侧：阵营等级/兵力数角标
      const tagLeft = groupLeft;
      const tagCenterX = tagLeft + tagW / 2;
      node.badgeBg
        .rect(tagLeft, -tagH / 2, tagW, tagH)
        .fill({ color: crestFill, alpha: 0.94 })
        .stroke({ width: isActive ? 0.9 : 0.7, color: frameBorder, alpha: isActive ? 0.98 : 0.85 });
      node.badgeText.position.set(tagCenterX, 0.15);

      // 右侧：紧贴角标的纤细高对比血蓝条（四色身份编码：常规翠绿 / 幻象琉璃青 / 召唤星辉琥珀金 / 复生幽冥紫！）
      const barLeft = tagLeft + tagW + groupGap;
      const barTop = -totalBarH / 2;
      let hpColor: number;
      let hpHighlight: number;
      if (summonKind === 'illusion') {
        // 幻象分身：高通透琉璃冰青色系（随血量微调明度，绝不与普通绿血条混淆）
        hpColor = hpRatio > 0.55 ? 0x2ef2ff : hpRatio > 0.25 ? 0x4fd1f5 : 0x7ab4ff;
        hpHighlight = 0xd9feff;
      } else if (summonKind === 'summoned') {
        // 契约召唤物：星辉琥珀橙金色系
        hpColor = hpRatio > 0.55 ? 0xffae26 : hpRatio > 0.25 ? 0xff8524 : 0xff5433;
        hpHighlight = 0xfff2b3;
      } else if (summonKind === 'raised') {
        // 招魂/起尸复生单位：幽冥紫罗兰色系
        hpColor = hpRatio > 0.55 ? 0xc45cff : hpRatio > 0.25 ? 0xa644f0 : 0xe048b8;
        hpHighlight = 0xf2d6ff;
      } else {
        // 常规编队单位：经典绿 / 黄 / 红健康度血条
        hpColor = hpRatio > 0.55 ? 0x42e388 : hpRatio > 0.25 ? 0xf2c244 : 0xf0485e;
        hpHighlight = hpRatio > 0.55 ? 0xbdffda : hpRatio > 0.25 ? 0xfff2b8 : 0xffb8c2;
      }
      const hpFillW = hpRatio > 0 ? Math.max(1, Math.round(barW * hpRatio)) : 0;

      node.hpBarBg
        .rect(barLeft - 1, barTop - 1, barW + 2, totalBarH + 2)
        .fill({ color: 0x060408, alpha: 0.9 })
        .stroke({ width: isActive ? 0.85 : 0.55, color: frameBorder, alpha: isActive ? 0.95 : 0.55 });

      node.hpBarBg.rect(barLeft, barTop, barW, hpH).fill({ color: 0x1b1521, alpha: 0.96 });
      if (hpFillW > 0) {
        node.hpBarFill.rect(barLeft, barTop, hpFillW, hpH).fill({ color: hpColor, alpha: 1 });
        node.hpBarFill.rect(barLeft, barTop, hpFillW, 1).fill({ color: hpHighlight, alpha: 0.78 });
      }

      if (hasMana) {
        const mpY = barTop + hpH + barGap;
        const mpRatio = Math.max(0, Math.min(1, (unit.mana ?? 0) / Math.max(1, stats.maxMana)));
        const mpFillW = mpRatio > 0 ? Math.max(1, Math.round(barW * mpRatio)) : 0;
        node.mpBarBg.rect(barLeft, mpY, barW, mpH).fill({ color: 0x0c162b, alpha: 0.96 });
        if (mpFillW > 0) {
          node.mpBarFill.rect(barLeft, mpY, mpFillW, mpH).fill({ color: 0x4298ff, alpha: 1 });
          node.mpBarFill.rect(barLeft, mpY, mpFillW, 0.8).fill({ color: 0xc4e8ff, alpha: 0.85 });
        }
      }
    } else {
      // 英雄倒地时仅居中展示紧凑「倒地」铭牌
      node.badgeBg
        .rect(-tagW / 2, -tagH / 2, tagW, tagH)
        .fill({ color: crestFill, alpha: 0.9 })
        .stroke({ width: 0.7, color: frameBorder, alpha: 0.7 });
      node.badgeText.position.set(0, 0.15);
    }

    node.container.position.set(node.baseX + node.offsetX, node.baseY + node.offsetY);
    node.container.zIndex = Math.round(node.baseY);
    if (node.lightSprite) {
      node.lightSprite.position.set(node.baseX, node.baseY - 12 * node.spriteScale);
    }
  }

  /**
   * 静/动分离重绘战术高亮层：
   * - staticOverlayGraphics（可达格/可攻击敌军/多格脚印/当前行动金框）：仅在回合、战局或选法术态变更时重绘，鼠标移动时 0 开销！
   * - hoverOverlayGraphics（悬停格/路径预览/近战落脚箭头/LoS 衰减射线）：仅在悬停目标变更时轻量刷新！
   */
  public updateOverlay(hints: StageOverlayHints, forceStatic = false): void {
    this.currentHints = hints;
    const state = this.currentState;
    if (!state) return;

    const drawHexOn = (
      g: PIXI.Graphics,
      coord: HexCoord,
      fillColor: number,
      fillAlpha: number,
      strokeColor: number,
      strokeAlpha: number,
      strokeWidth = 1,
    ) => {
      const tile = state.tiles[hexKey(coord)];
      if (!tile) return;
      const pts = hexPolyFlatFromCoord(coord, tile.elevation, 0.94);
      g.poly(pts, true)
        .fill({ color: fillColor, alpha: fillAlpha })
        .stroke({ width: strokeWidth, color: strokeColor, alpha: strokeAlpha });
    };

    const activeUnit = hints.activeUnitId ? state.units[hints.activeUnitId] : null;

    // 1. 静态层签名判重：鼠标在棋盘内移动时完全跳过静态大面积六边形重绘！
    const staticSig = [
      state.commandSeq,
      state.round,
      hints.activeUnitId ?? '',
      hints.targetingMode,
      hints.spellRange,
      hints.reachableHexKeys.size,
      hints.attackableUnitIds.size,
      hints.validSpellUnitIds.size,
      hints.validEmptyHexKeys?.size ?? 0,
      state.battleSpellFlags?.quicksandHexKeys.length ?? 0,
    ].join('|');

    if (forceStatic || staticSig !== this.lastStaticOverlaySig) {
      this.lastStaticOverlaySig = staticSig;
      const sg = this.staticOverlayGraphics;
      sg.clear();

      // 绘制自然系「流沙陷阱 (Quicksand)」地面警示区
      for (const qk of state.battleSpellFlags?.quicksandHexKeys ?? []) {
        const qTile = state.tiles[qk];
        if (qTile) {
          drawHexOn(sg, qTile, 0xd4a44a, 0.28, 0xffdf85, 0.72, 1.4);
        }
      }

      // 绘制所有多格大体型单位的淡雅地面占位轮廓
      for (const u of Object.values(state.units)) {
        if (u.status !== 'alive' || u.footprint === '1x1') continue;
        const col = u.side === 'left' ? 0xe64c65 : 0x5ea2ff;
        for (const h of getUnitOccupiedHexes(u)) {
          drawHexOn(sg, h, col, 0.08, col, 0.34, 1);
        }
      }

      if (hints.targetingMode === 'normal') {
        for (const k of hints.reachableHexKeys) {
          const tile = state.tiles[k];
          if (!tile) continue;
          if (activeUnit && tile.q === activeUnit.pos.q && tile.r === activeUnit.pos.r) continue;
          drawHexOn(sg, tile, 0x62d6ff, 0.065, 0x8de6ff, 0.26, 1);
        }
        for (const targetId of hints.attackableUnitIds) {
          const u = state.units[targetId];
          if (u && u.status === 'alive') {
            for (const h of getUnitOccupiedHexes(u)) {
              drawHexOn(sg, h, 0xff4560, 0.16, 0xff7085, 0.8, 1.3);
            }
          }
        }
      } else if (hints.targetingMode === 'spell_unit') {
        for (const uid of hints.validSpellUnitIds) {
          const u = state.units[uid];
          if (u && u.status !== 'knocked_out') {
            for (const h of getUnitOccupiedHexes(u)) {
              drawHexOn(sg, h, 0x9966ff, 0.24, 0xd9b8ff, 0.9, 1.4);
            }
          }
        }
      } else if (hints.targetingMode === 'spell_empty_hex' && hints.validEmptyHexKeys) {
        for (const k of hints.validEmptyHexKeys) {
          const tile = state.tiles[k];
          if (tile) {
            drawHexOn(sg, tile, 0x5ee39a, 0.12, 0x9effc8, 0.42, 1.1);
          }
        }
      } else if (hints.targetingMode === 'spell_aoe' && activeUnit) {
        for (const tile of Object.values(state.tiles)) {
          if (
            hexDistance(activeUnit.pos, tile) <= hints.spellRange &&
            checkSpellLineOfSight(state, activeUnit, [tile]).canCast
          ) {
            drawHexOn(sg, tile, 0xffa63d, 0.08, 0xffbe5c, 0.25, 1);
          }
        }
      }

      if (activeUnit && activeUnit.status === 'alive') {
        for (const h of getUnitOccupiedHexes(activeUnit)) {
          drawHexOn(sg, h, 0xffe46b, 0.24, 0xfff4b0, 0.98, 2);
        }
      }
    }

    // 2. 轻量悬停层签名判重
    const hoverSig = [
      staticSig,
      hints.hoveredHex ? hexKey(hints.hoveredHex) : '',
      hints.meleeApproachHex ? hexKey(hints.meleeApproachHex) : '',
      hints.meleeTargetHex ? hexKey(hints.meleeTargetHex) : '',
      hints.movePathPreview ? hints.movePathPreview.length : 0,
      hints.attackPreview ? `${hints.attackPreview.valid}:${hints.attackPreview.isRanged}:${hints.attackPreview.rangedPenaltyTier}:${hints.attackPreview.losStatus}` : '',
    ].join('|');

    if (!forceStatic && hoverSig === this.lastHoverOverlaySig) {
      return;
    }
    this.lastHoverOverlaySig = hoverSig;

    const g = this.hoverOverlayGraphics;
    g.clear();

    if (hints.targetingMode === 'spell_aoe' && activeUnit) {
      if (
        hints.hoveredHex &&
        hexDistance(activeUnit.pos, hints.hoveredHex) <= hints.spellRange &&
        checkSpellLineOfSight(state, activeUnit, [hints.hoveredHex]).canCast
      ) {
        for (const h of getHexRange(hints.hoveredHex, hints.aoeRadius)) {
          drawHexOn(g, h, 0xff6b35, 0.34, 0xffe066, 0.95, 1.5);
        }
      }
    } else if (hints.targetingMode === 'spell_card_line' && activeUnit && hints.hoveredHex) {
      const ray = hexRay(
        activeUnit.pos,
        hints.hoveredHex,
        hints.lineLength,
        (c) => Boolean(state.tiles[hexKey(c)]),
      );
      for (const step of ray) {
        drawHexOn(g, step, 0xffcf40, 0.38, 0xfff5b8, 0.98, 1.8);
      }
    }

    if (hints.hoveredHex) {
      if (
        hints.targetingMode === 'normal' &&
        activeUnit &&
        hints.reachableHexKeys.has(hexKey(hints.hoveredHex))
      ) {
        for (const h of getFootprintHexes(hints.hoveredHex, activeUnit.footprint)) {
          drawHexOn(g, h, 0x99ecff, 0.22, 0xffffff, 0.9, 1.4);
        }
      } else {
        drawHexOn(g, hints.hoveredHex, 0xffffff, 0.14, 0xffffff, 0.78, 1.3);
      }
    }

    if (hints.movePathPreview && hints.movePathPreview.length > 1 && activeUnit) {
      if (activeUnit.abilities.teleport || activeUnit.abilities.globalTeleport) {
        const isAbyssTp = Boolean(activeUnit.abilities.globalTeleport);
        const pStart = getFootprintCenterPixel(hints.movePathPreview[0], activeUnit.footprint, state.tiles);
        const pEnd = getFootprintCenterPixel(
          hints.movePathPreview[hints.movePathPreview.length - 1],
          activeUnit.footprint,
          state.tiles,
        );
        const segments = 12;
        let prevX = pStart.x;
        let prevY = pStart.y - 6;
        for (let s = 1; s <= segments; s++) {
          const t = s / segments;
          const nx = pStart.x + (pEnd.x - pStart.x) * t;
          const ny = pStart.y + (pEnd.y - pStart.y) * t - 6;
          if (s % 2 === 1) {
            g.moveTo(prevX, prevY).lineTo(nx, ny).stroke({ width: 1.8, color: isAbyssTp ? 0xff4d88 : 0xc996ff, alpha: 0.92 });
          }
          prevX = nx;
          prevY = ny;
        }
        g.circle(pEnd.x, pEnd.y, 6.2).stroke({ width: 1.4, color: isAbyssTp ? 0xff6699 : 0xd9b8ff, alpha: 0.95 });
        g.circle(pEnd.x, pEnd.y, 2.8).fill({ color: isAbyssTp ? 0xffe066 : 0x9ceeff, alpha: 0.96 });
      } else if (activeUnit.abilities.flying) {
        const pStart = getFootprintCenterPixel(hints.movePathPreview[0], activeUnit.footprint, state.tiles);
        const pEnd = getFootprintCenterPixel(
          hints.movePathPreview[hints.movePathPreview.length - 1],
          activeUnit.footprint,
          state.tiles,
        );
        const segments = 16;
        const arcH = Math.min(28, 12 + Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y) * 0.08);
        let prevX = pStart.x;
        let prevY = pStart.y - 6;
        for (let s = 1; s <= segments; s++) {
          const t = s / segments;
          const nx = pStart.x + (pEnd.x - pStart.x) * t;
          const ny = pStart.y + (pEnd.y - pStart.y) * t - 6 - Math.sin(t * Math.PI) * arcH;
          if (s % 2 === 1) {
            g.moveTo(prevX, prevY).lineTo(nx, ny).stroke({ width: 1.8, color: 0x7ff6ff, alpha: 0.9 });
          }
          prevX = nx;
          prevY = ny;
        }
        g.circle(pEnd.x, pEnd.y, 3.5).fill({ color: 0xb8fbff, alpha: 0.95 });
      } else {
        for (let i = 1; i < hints.movePathPreview.length; i++) {
          const p0 = getFootprintCenterPixel(hints.movePathPreview[i - 1], activeUnit.footprint, state.tiles);
          const p1 = getFootprintCenterPixel(hints.movePathPreview[i], activeUnit.footprint, state.tiles);
          g.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).stroke({ width: 1.5, color: 0x8de6ff, alpha: 0.78 });
          g.circle(p1.x, p1.y, i === hints.movePathPreview.length - 1 ? 3 : 1.8).fill({
            color: i === hints.movePathPreview.length - 1 ? 0xd9f7ff : 0x8de6ff,
            alpha: 0.9,
          });
        }
      }
    }

    if (hints.meleeCandidateHexes.length > 0) {
      for (const cand of hints.meleeCandidateHexes) {
        drawHexOn(g, cand, 0xffe484, 0.08, 0xffe484, 0.36, 1);
      }
    }
    if (hints.meleeApproachHex && hints.meleeTargetHex && activeUnit) {
      for (const h of getFootprintHexes(hints.meleeApproachHex, activeUnit.footprint)) {
        drawHexOn(g, h, 0xffe484, 0.28, 0xfff3b8, 0.98, 1.8);
      }
      const p0 = getFootprintCenterPixel(hints.meleeApproachHex, activeUnit.footprint, state.tiles);
      const targetUnit = Object.values(state.units).find(
        (u) => u.status === 'alive' && u.pos.q === hints.meleeTargetHex!.q && u.pos.r === hints.meleeTargetHex!.r,
      );
      const p1 = targetUnit
        ? getFootprintCenterPixel(targetUnit.pos, targetUnit.footprint, state.tiles)
        : hexToPixel(hints.meleeTargetHex, STAGE_PROJECTION, state.tiles[hexKey(hints.meleeTargetHex)]?.elevation ?? 1);
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / dist;
      const uy = dy / dist;
      const tipX = p1.x - ux * 8;
      const tipY = p1.y - uy * 8;
      g.moveTo(p0.x, p0.y).lineTo(tipX, tipY).stroke({ width: 2.2, color: 0xffd859, alpha: 0.95 });
      const headLen = 6;
      const wingAngle = 0.55;
      const baseAngle = Math.atan2(uy, ux);
      g.moveTo(tipX, tipY)
        .lineTo(
          tipX - Math.cos(baseAngle - wingAngle) * headLen,
          tipY - Math.sin(baseAngle - wingAngle) * headLen,
        )
        .moveTo(tipX, tipY)
        .lineTo(
          tipX - Math.cos(baseAngle + wingAngle) * headLen,
          tipY - Math.sin(baseAngle + wingAngle) * headLen,
        )
        .stroke({ width: 2, color: 0xfff3b8, alpha: 0.98 });
    }

    if (hints.attackPreview && activeUnit) {
      const prev = hints.attackPreview;
      if (prev.movePath && prev.movePath.length > 1) {
        for (let i = 1; i < prev.movePath.length; i++) {
          const fromT = state.tiles[hexKey(prev.movePath[i - 1])];
          const toT = state.tiles[hexKey(prev.movePath[i])];
          const p0 = hexToPixel(prev.movePath[i - 1], STAGE_PROJECTION, fromT?.elevation ?? 1);
          const p1 = hexToPixel(prev.movePath[i], STAGE_PROJECTION, toT?.elevation ?? 1);
          g.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).stroke({ width: 2, color: 0xffe484, alpha: 0.85 });
        }
      }
      // 远程射击视线（LoS + 四阶衰减配色：全伤=翠青 / 1/2=琥珀 / 1/4=赤橙 / 1/8=绛紫 / 阻挡=猩红）
      if (prev.isRanged && hints.hoveredHex) {
        const hoveredUnit = findUnitAtHex(state, hints.hoveredHex, false);
        const p0 = getFootprintCenterPixel(activeUnit.pos, activeUnit.footprint, state.tiles);
        const p1 = hoveredUnit
          ? getFootprintCenterPixel(hoveredUnit.pos, hoveredUnit.footprint, state.tiles)
          : hexToPixel(hints.hoveredHex, STAGE_PROJECTION, state.tiles[hexKey(hints.hoveredHex)]?.elevation ?? 1);
        const lineCol =
          prev.losStatus === 'blocked'
            ? 0xff4560
            : prev.rangedPenaltyTier === 'full'
              ? 0x6bffd2
              : prev.rangedPenaltyTier === 'half'
                ? 0xffc857
                : prev.rangedPenaltyTier === 'quarter'
                  ? 0xff784f
                  : 0xd94873;
        g.moveTo(p0.x, p0.y - 10)
          .lineTo(p1.x, p1.y - 10)
          .stroke({ width: 1.5, color: lineCol, alpha: 0.88 });
      }
    }
  }

  /**
   * 顺序消费引擎产出的演出事件流，同步播放打击感动画、pixelfx 双缓冲辉光与立体声空间音效！
   */
  public async playEvents(events: CombatEvent[], finalState: BattleState): Promise<void> {
    for (const ev of events) {
      if (this.destroyed) return;

      if (ev.type === 'ROUND_STARTED') {
        if (ev.round > 1) {
          soundEngine.play('ui_round_bell');
        }
      } else if (ev.type === 'STATUS_DOT_TICK') {
        const node = this.unitNodes.get(ev.unitId);
        if (node) {
          soundEngine.playAtStageX('spell_debuff', node.baseX, VIRTUAL_WIDTH, { volume: 0.65 });
          node.flashTimer = 0.22;
          this.setNodeAnim(node, 'hit', 8, false);
          this.fxBridge.spawnEffect('status_poisoned', node.baseX, node.baseY - 12, {
            paletteKey: ev.kind === 'plague' ? 'yomi_plague' : 'suzuran_venom',
            light: 1.42,
            speedScale: 1.4,
            maxDuration: 0.95,
          });
          const dotLabel =
            ev.kind === 'plague' ? `瘟疫 -${ev.damage} ♥` : `剧毒 -${ev.damage} ♥`;
          this.spawnFloatingText(
            node.baseX,
            node.baseY - 34 * node.spriteScale,
            dotLabel,
            ev.kind === 'plague' ? '#c98aff' : '#7dff70',
          );
          if (!node.isHero && ev.kills > 0) {
            this.spawnFloatingText(
              node.baseX,
              node.baseY - 20 * node.spriteScale,
              `-${ev.kills} ☠`,
              '#a8ff80',
            );
          }
          await sleep(165);
          this.setNodeAnim(node, 'idle', 6.5, true);
        }
      } else if (ev.type === 'TURN_STARTED') {
        const nextUnit = finalState.units[ev.unitId];
        if (nextUnit && finalState.controllers[nextUnit.side] === 'human') {
          const node = this.unitNodes.get(ev.unitId);
          soundEngine.playAtStageX('ui_turn_ready', node?.baseX ?? VIRTUAL_WIDTH * 0.5, VIRTUAL_WIDTH);
        }
      } else if (ev.type === 'UNIT_DEFENDING') {
        const node = this.unitNodes.get(ev.unitId);
        soundEngine.playAtStageX('stance_defend', node?.baseX ?? VIRTUAL_WIDTH * 0.5, VIRTUAL_WIDTH);
      } else if (ev.type === 'UNIT_WAITING') {
        const node = this.unitNodes.get(ev.unitId);
        soundEngine.playAtStageX('stance_wait', node?.baseX ?? VIRTUAL_WIDTH * 0.5, VIRTUAL_WIDTH);
      } else if (ev.type === 'MORALE_TRIGGERED') {
        const node = this.unitNodes.get(ev.unitId);
        if (node) {
          if (ev.kind === 'good') {
            soundEngine.playAtStageX('spell_buff', node.baseX, VIRTUAL_WIDTH, { volume: 0.85 });
            this.fxBridge.spawnEffect('sunburst', node.baseX, node.baseY - 14, {
              paletteKey: 'shrine_gold',
              light: 1.4,
              speedScale: 1.45,
              maxDuration: 0.85,
            });
            node.offsetY = -5;
            this.spawnFloatingText(
              node.baseX,
              node.baseY - 34 * node.spriteScale,
              '士气高涨! 先手+25%',
              '#ffe466',
            );
            await sleep(90);
            node.offsetY = 0;
            await sleep(45);
          } else {
            soundEngine.playAtStageX('spell_debuff', node.baseX, VIRTUAL_WIDTH, { volume: 0.8 });
            this.fxBridge.spawnEffect('status_slowed', node.baseX, node.baseY - 16, {
              paletteKey: 'dusk_eclipse',
              light: 1.25,
              speedScale: 1.4,
              maxDuration: 0.85,
            });
            this.spawnFloatingText(
              node.baseX,
              node.baseY - 32 * node.spriteScale,
              '士气低落! 后手-20%',
              '#b89ce6',
            );
            await sleep(110);
          }
        }
      } else if (ev.type === 'MANA_LEECH') {
        const enemyNode = this.unitNodes.get(ev.enemyUnitId);
        const allyNode = ev.allyUnitId ? this.unitNodes.get(ev.allyUnitId) : null;
        if (enemyNode) {
          soundEngine.playAtStageX('spell_debuff', enemyNode.baseX, VIRTUAL_WIDTH, { volume: 0.68 });
          this.fxBridge.spawnEffect('mana_siphon_vortex', enemyNode.baseX, enemyNode.baseY - 12, {
            paletteKey: 'death_nether',
            light: 1.45,
            speedScale: 1.5,
            maxDuration: 0.95,
          });
          this.spawnFloatingText(enemyNode.baseX, enemyNode.baseY - 30 * enemyNode.spriteScale, `吸蓝 -${ev.amount}MP`, '#d08aff');
        }
        if (allyNode) {
          if (enemyNode) {
            this.spawnProjectile(enemyNode.baseX, enemyNode.baseY - 14, allyNode.baseX, allyNode.baseY - 14, 0x85e8ff);
          }
          this.fxBridge.spawnEffect('mana_burst', allyNode.baseX, allyNode.baseY - 12, {
            paletteKey: 'abyss_frost',
            light: 1.3,
            speedScale: 1.55,
            maxDuration: 0.75,
          });
          this.spawnFloatingText(allyNode.baseX, allyNode.baseY - 30 * allyNode.spriteScale, `+${ev.amount}MP`, '#85e8ff');
        }
        await sleep(220);
      } else if (ev.type === 'UNIT_SKIPPED_TURN') {
        const node = this.unitNodes.get(ev.unitId);
        if (node) {
          soundEngine.playAtStageX('spell_debuff', node.baseX, VIRTUAL_WIDTH, { volume: 0.75 });
          const skipLabel =
            ev.reason === 'terrified'
              ? '震慑跳过!'
              : ev.reason === 'frozen'
                ? '寒霜冰封!'
                : ev.reason === 'blind'
                  ? '宵暗跳过!'
                  : ev.reason === 'confusion'
                    ? '迷雾跳过!'
                    : ev.reason === 'berserk'
                      ? '月狂失控!'
                      : ev.reason === 'song_of_peace'
                        ? '镇魂跳过!'
                        : '定身跳过!';
          this.spawnFloatingText(
            node.baseX,
            node.baseY - 30 * node.spriteScale,
            skipLabel,
            ev.reason === 'frozen'
              ? '#80ebff'
              : ev.reason === 'terrified' || ev.reason === 'berserk'
                ? '#ff6699'
                : '#ffe073',
          );
          await sleep(300);
        }
      } else if (ev.type === 'UNIT_MOVED') {
        await this.animateMove(ev.unitId, ev.path);
      } else if (ev.type === 'COMBAT_EXCHANGE') {
        await this.animateCombatExchange(ev);
      } else if (ev.type === 'SPELL_CAST') {
        await this.animateSpellCast(ev, finalState);
      } else if (ev.type === 'SPELL_CARD_DECLARED') {
        await this.animateSpellCardDeclared(ev);
      } else if (ev.type === 'POTION_USED') {
        const node = this.unitNodes.get(ev.unitId);
        if (node) {
          soundEngine.playAtStageX('potion_drink', node.baseX, VIRTUAL_WIDTH);
          this.fxBridge.spawn('mana_burst', node.baseX, node.baseY - 12, {
            palette: TOUHOU_PALETTES.nature_emerald,
          });
          this.spawnFloatingText(node.baseX, node.baseY - 26, ev.summary, ev.color);
          await sleep(360);
        }
      } else if (ev.type === 'UNIT_KNOCKED_OUT' || ev.type === 'UNIT_DIED') {
        const node = this.unitNodes.get(ev.unitId);
        if (node) {
          soundEngine.playAtStageX(
            ev.type === 'UNIT_KNOCKED_OUT' ? 'unit_ko' : 'unit_death',
            node.baseX,
            VIRTUAL_WIDTH,
          );
          this.fxBridge.spawn('soul_rise', node.baseX, node.baseY - 8);
          this.spawnFloatingText(
            node.baseX,
            node.baseY - 30,
            ev.type === 'UNIT_KNOCKED_OUT' ? '满身疮痍!' : '全灭!',
            '#ff7b8a',
          );
        }
      } else if (ev.type === 'SPELL_CARD_CAPTURED') {
        soundEngine.play('spellcard_capture');
        this.spawnFloatingText(VIRTUAL_WIDTH / 2, 72, `★ 符卡收取: ${ev.spellCardName}`, '#ffe484');
        await sleep(500);
      } else if (ev.type === 'BATTLE_ENDED') {
        soundEngine.play(ev.winner === 'left' ? 'battle_victory' : 'battle_defeat');
      }
    }

    this.syncState(finalState);
  }

  /**
   * 魔王（深渊隙间恶魔）专属三段式「撕裂空间瞬移」电影级舞台演出：
   * 第一幕：起点半空斜劈耀眼锯齿裂痕并撕开深黑紫红深渊裂口（浮现睁开的金红魔瞳与崩碎空间菱片）→ 魔王吸入裂口闭合；
   * 第二幕：起终点之间短暂闪现一道锯齿紫白空间折跃裂痕残影；
   * 第三幕：终点凭空撕裂第二道巨幅深渊空间裂口 → 魔王踏出展开身形降临 → 裂口收拢闭合！
   */
  private async animateAbyssSpaceTearTeleport(
    node: UnitVisualNode,
    startCenter: { x: number; y: number },
    endCenter: { x: number; y: number },
  ): Promise<void> {
    const tearBack = new PIXI.Graphics();
    const tearFront = new PIXI.Graphics();
    this.unitLayer.addChild(tearBack);
    this.projectileLayer.addChild(tearFront);

    const drawRiftPortal = (
      cx: number,
      cy: number,
      openRatio: number,
      slashRatio: number,
      seedOffset: number,
    ) => {
      tearBack.clear();
      tearFront.clear();
      tearBack.zIndex = Math.round(cy + 14);
      const rLen = 28 * Math.max(0.15, slashRatio);
      const rWidth = 14 * Math.max(0, openRatio);
      const tilt = -0.32;
      const dx = Math.cos(tilt);
      const dy = Math.sin(tilt);
      const nx = -dy;
      const ny = dx;

      // 1. 背层深渊虚空大裂口（深黑紫虚空内腔 + 发光品红撕裂外缘 + 睁开的金红竖瞳魔眼！）
      if (rWidth > 0.6) {
        const outerPts = [
          cx - dx * rLen, cy - dy * rLen,
          cx - dx * rLen * 0.38 + nx * rWidth * 0.92, cy - dy * rLen * 0.38 + ny * rWidth * 0.92,
          cx + dx * rLen * 0.25 + nx * rWidth, cy + dy * rLen * 0.25 + ny * rWidth,
          cx + dx * rLen, cy + dy * rLen,
          cx + dx * rLen * 0.38 - nx * rWidth * 0.92, cy + dy * rLen * 0.38 - ny * rWidth * 0.92,
          cx - dx * rLen * 0.25 - nx * rWidth, cy - dy * rLen * 0.25 - ny * rWidth,
        ];
        tearBack
          .poly(outerPts, true)
          .fill({ color: 0x0b0214, alpha: 0.96 })
          .stroke({ width: 2.4, color: 0xff2b6e, alpha: 0.95 });

        const innerW = rWidth * 0.68;
        const innerPts = [
          cx - dx * rLen * 0.85, cy - dy * rLen * 0.85,
          cx + nx * innerW, cy + ny * innerW,
          cx + dx * rLen * 0.85, cy + dy * rLen * 0.85,
          cx - nx * innerW, cy - ny * innerW,
        ];
        tearBack
          .poly(innerPts, true)
          .fill({ color: 0x260536, alpha: 0.72 })
          .stroke({ width: 1.2, color: 0xd980ff, alpha: 0.85 });

        // 裂口两端经典绯红蝴蝶结丝带光点
        for (const side of [-1, 1]) {
          const rx = cx + dx * rLen * 0.88 * side;
          const ry = cy + dy * rLen * 0.88 * side;
          tearFront.rect(rx - 2, ry - 2, 4, 4).fill({ color: 0xff295e, alpha: 0.95 });
          tearFront.rect(rx - 1, ry - 1, 2, 2).fill({ color: 0xffe478, alpha: 0.95 });
        }

        // 裂口深处睁开的 2 枚金红竖瞳深渊魔眼！
        if (openRatio > 0.38) {
          const eyeAlpha = Math.min(1, (openRatio - 0.38) * 2.2);
          for (const off of [-9, 9]) {
            const ex = cx + dx * off;
            const ey = cy + dy * off;
            tearBack.ellipse(ex, ey, 3.6, 2.2 * eyeAlpha).fill({ color: 0xff3d66, alpha: 0.95 });
            tearBack.ellipse(ex, ey, 2.3, 1.6 * eyeAlpha).fill({ color: 0xffe052, alpha: 1 });
            tearBack.rect(ex - 0.6, ey - 1.5 * eyeAlpha, 1.2, 3 * eyeAlpha).fill({ color: 0x12031f, alpha: 1 });
          }
        }
      }

      // 2. 前景锯齿状紫白空间劈裂闪电主痕 + 崩碎飞散空间菱形碎片！
      const segs = 6;
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= segs; i++) {
        const u = (i / segs) * 2 - 1;
        const jitter = i === 0 || i === segs ? 0 : Math.sin(i * 2.9 + seedOffset) * (2.6 + (1 - openRatio) * 2.5);
        pts.push([cx + dx * rLen * u + nx * jitter, cy + dy * rLen * u + ny * jitter]);
      }
      tearFront.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) tearFront.lineTo(pts[i][0], pts[i][1]);
      tearFront.stroke({ width: 3.0 - openRatio * 1.4, color: 0xff4d94, alpha: 0.9 });
      tearFront.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) tearFront.lineTo(pts[i][0], pts[i][1]);
      tearFront.stroke({ width: 1.3, color: 0xffffff, alpha: 0.96 });

      // 空间玻璃碎裂菱片向四周崩散
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2 + seedOffset * 0.4;
        const dist = 10 + openRatio * (14 + (k % 3) * 6);
        const sx = cx + Math.cos(ang) * dist;
        const sy = cy + Math.sin(ang) * dist * 0.68;
        const sz = k % 2 === 0 ? 2.6 : 1.8;
        tearFront
          .poly([sx, sy - sz, sx + sz, sy, sx, sy + sz, sx - sz, sy], true)
          .fill({ color: k % 3 === 0 ? 0xffffff : k % 2 === 0 ? 0xff5296 : 0xb366ff, alpha: 0.88 * Math.max(0.25, openRatio) });
      }
    };

    try {
      const startRiftY = startCenter.y - 16;
      const endRiftY = endCenter.y - 16;
      this.setNodeAnim(node, 'move', 12, true);

      // ===== 第一幕：起点劈裂空间 → 撕开深渊裂口 → 魔王吸入消失 → 裂口闭合 =====
      soundEngine.playAtStageX('spell_lightning', startCenter.x, VIRTUAL_WIDTH, { volume: 0.62 });
      soundEngine.playAtStageX('spell_orb', startCenter.x, VIRTUAL_WIDTH, { volume: 0.82 });
      this.triggerImpactJuice(2.2, 0);
      this.fxBridge.spawnEffect('abyss_gap_rift', startCenter.x, startRiftY + 4, {
        paletteKey: 'scarlet_moon',
        light: 1.65,
        speedScale: 1.5,
        maxDuration: 0.95,
      });

      // 裂痕劈开与张口
      for (let s = 1; s <= 5; s++) {
        const t = s / 5;
        drawRiftPortal(startCenter.x, startRiftY, t, Math.min(1, t * 1.4), s * 0.6);
        node.offsetY = -t * 4;
        node.container.position.set(node.baseX, node.baseY + node.offsetY);
        await sleep(16);
      }
      // 魔王身形沿水平压缩吸入深渊裂口
      for (let s = 1; s <= 6; s++) {
        const t = s / 6;
        drawRiftPortal(startCenter.x, startRiftY, 1 - t * 0.72, 1 - t * 0.5, 3 + s * 0.5);
        node.container.scale.set(Math.max(0.08, 1 - t * 0.92), 1 + t * 0.18);
        node.container.alpha = Math.max(0, 1 - t * 1.1);
        node.badgeContainer.alpha = Math.max(0, 0.96 * (1 - t * 1.2));
        node.offsetY = -4 - t * 6;
        node.container.position.set(node.baseX, node.baseY + node.offsetY);
        await sleep(18);
      }

      // ===== 第二幕：起终点之间短暂闪现空间折跃锯齿裂痕 =====
      tearBack.clear();
      tearFront.clear();
      const midSegs = 8;
      const vx = endCenter.x - startCenter.x;
      const vy = endRiftY - startRiftY;
      const vLen = Math.max(1, Math.hypot(vx, vy));
      const pnx = -vy / vLen;
      const pny = vx / vLen;
      const bridgePts: Array<[number, number]> = [];
      for (let i = 0; i <= midSegs; i++) {
        const u = i / midSegs;
        const jig = i === 0 || i === midSegs ? 0 : Math.sin(i * 3.7) * 7.5;
        bridgePts.push([startCenter.x + vx * u + pnx * jig, startRiftY + vy * u + pny * jig]);
      }
      tearFront.moveTo(bridgePts[0][0], bridgePts[0][1]);
      for (let i = 1; i < bridgePts.length; i++) tearFront.lineTo(bridgePts[i][0], bridgePts[i][1]);
      tearFront.stroke({ width: 3.2, color: 0xc238ff, alpha: 0.78 });
      tearFront.moveTo(bridgePts[0][0], bridgePts[0][1]);
      for (let i = 1; i < bridgePts.length; i++) tearFront.lineTo(bridgePts[i][0], bridgePts[i][1]);
      tearFront.stroke({ width: 1.2, color: 0xffffff, alpha: 0.95 });
      await sleep(55);

      // ===== 第三幕：终点凭空撕裂空间 → 魔王展开身形降临 → 裂口优雅收合 =====
      node.baseX = endCenter.x;
      node.baseY = endCenter.y + 4;
      node.container.zIndex = Math.round(node.baseY);

      soundEngine.playAtStageX('spell_lightning', endCenter.x, VIRTUAL_WIDTH, { volume: 0.55 });
      soundEngine.playAtStageX('spell_buff', endCenter.x, VIRTUAL_WIDTH, { volume: 0.8 });
      this.triggerImpactJuice(2.6, 0);
      this.fxBridge.spawnEffect('abyss_gap_rift', endCenter.x, endRiftY + 4, {
        paletteKey: 'gap_violet',
        light: 1.7,
        speedScale: 1.45,
        maxDuration: 0.95,
      });

      // 终点裂隙骤然劈开
      for (let s = 1; s <= 4; s++) {
        const t = s / 4;
        drawRiftPortal(endCenter.x, endRiftY, t, Math.min(1, t * 1.5), 8 + s * 0.6);
        await sleep(16);
      }
      // 魔王自深渊空间裂隙展开踏出
      for (let s = 1; s <= 6; s++) {
        const t = s / 6;
        drawRiftPortal(endCenter.x, endRiftY, 1 - t * 0.25, 1, 11 + s * 0.5);
        node.container.scale.set(0.1 + t * 0.9, 1.15 - t * 0.15);
        node.container.alpha = Math.min(1, t * 1.15);
        node.badgeContainer.alpha = Math.min(0.96, t);
        node.offsetY = -(1 - t) * 7;
        node.container.position.set(node.baseX, node.baseY + node.offsetY);
        await sleep(18);
      }
      // 背后深渊空间裂缝迅速拉拢闭合消散
      for (let s = 1; s <= 4; s++) {
        const t = s / 4;
        drawRiftPortal(endCenter.x, endRiftY, Math.max(0, 0.75 * (1 - t)), 1 - t * 0.85, 16 + s * 0.4);
        await sleep(15);
      }
    } finally {
      node.container.scale.set(1, 1);
      node.container.alpha = 1;
      node.badgeContainer.alpha = 0.96;
      node.offsetY = 0;
      node.container.position.set(node.baseX, node.baseY);
      tearBack.destroy();
      tearFront.destroy();
    }
  }

  private async animateMove(unitId: string, path: HexCoord[]): Promise<void> {
    const node = this.unitNodes.get(unitId);
    const state = this.currentState;
    if (!node || !state || path.length <= 1) return;

    // 切换至迈步奔跑/振翅冲刺动作帧！
    const startCenter = getFootprintCenterPixel(path[0], node.footprint, state.tiles);
    const endCenter = getFootprintCenterPixel(path[path.length - 1], node.footprint, state.tiles);
    if (Math.abs(endCenter.x - startCenter.x) > 2) {
      node.facing = endCenter.x >= startCenter.x ? 'right' : 'left';
    }

    const bp = node.blueprintId;
    const isVampireBatFlight = !node.isHero && bp === 'creature_crimson_vampire';
    const isWraithOrbFlight = !node.isHero && bp === 'creature_wraith_spirit';
    const isWingFlapFlight =
      !node.isHero &&
      (bp === 'creature_koakuma_imp' ||
        bp === 'creature_hell_raven' ||
        bp === 'creature_bone_dragon' ||
        bp === 'creature_hakurei_seraph');

    const moveFps = isVampireBatFlight
      ? 15
      : isWraithOrbFlight
        ? 14
        : bp === 'creature_bone_dragon'
          ? 12.5
          : isWingFlapFlight
            ? 14
            : 11;
    this.setNodeAnim(node, 'move', moveFps, true);

    try {
      // 有限距离瞬移（Teleport）与魔王深渊全图瞬移（Global Teleport）：魔王触发专属三段式「撕裂空间瞬移」！
      if (state.units[unitId]?.abilities.teleport || state.units[unitId]?.abilities.globalTeleport) {
        const isAbyssTp = Boolean(state.units[unitId]?.abilities.globalTeleport);
        if (isAbyssTp) {
          await this.animateAbyssSpaceTearTeleport(node, startCenter, endCenter);
          return;
        }
        soundEngine.playAtStageX('spell_orb', startCenter.x, VIRTUAL_WIDTH, { volume: 0.88 });
        this.fxBridge.spawnEffect('blink_out', startCenter.x, startCenter.y - 10, {
          paletteKey: 'order_lunar',
          light: 1.5,
          speedScale: 1.65,
          maxDuration: 0.75,
        });
        for (let s = 1; s <= 5; s++) {
          const t = s / 5;
          node.container.alpha = Math.max(0, 1 - t);
          node.offsetY = -t * 5;
          node.container.position.set(node.baseX, node.baseY + node.offsetY);
          await sleep(18);
        }

        node.baseX = endCenter.x;
        node.baseY = endCenter.y + 4;
        node.offsetY = -5;
        node.container.position.set(node.baseX, node.baseY + node.offsetY);
        node.container.zIndex = Math.round(node.baseY);

        soundEngine.playAtStageX('spell_buff', endCenter.x, VIRTUAL_WIDTH, { volume: 0.76 });
        this.fxBridge.spawnEffect('blink_in', endCenter.x, endCenter.y - 10, {
          paletteKey: 'order_lunar',
          light: 1.55,
          speedScale: 1.65,
          maxDuration: 0.8,
        });
        for (let s = 1; s <= 5; s++) {
          const t = s / 5;
          node.container.alpha = Math.min(1, t);
          node.offsetY = -(1 - t) * 5;
          node.container.position.set(node.baseX, node.baseY + node.offsetY);
          await sleep(18);
        }
        node.container.alpha = 1;
        node.offsetY = 0;
        node.container.position.set(node.baseX, node.baseY);
        return;
      }

      // HoMM4 飞行单位演出：英雄保持默认曲线不变；死亡阵营飞行兵种启用专属化蝠 / 化灵 / 扑翼演出！
      if (node.isFloating) {
        const dist = Math.hypot(endCenter.x - startCenter.x, endCenter.y - startCenter.y);
        const flightSteps = Math.max(14, Math.min(28, Math.round(dist / 8)));
        const peakHeight = isWraithOrbFlight
          ? Math.min(24, 12 + dist * 0.05)
          : Math.min(34, 16 + dist * 0.08);

        soundEngine.playAtStageX('move_fly_whoosh', startCenter.x, VIRTUAL_WIDTH);

        if (isVampireBatFlight) {
          // 血族眷属起飞化蝠：猩红血雾与蝙蝠雾散爆发掩护人形→猩红大血蝠变身！
          this.fxBridge.spawnEffect('vampiric_claw_burst', startCenter.x, startCenter.y - 12, {
            paletteKey: 'crimson_blood',
            light: 1.55,
            speedScale: 1.75,
            maxDuration: 0.55,
          });
          await sleep(40);
        } else if (isWraithOrbFlight) {
          // 怨灵起飞化灵团：幽蓝灵雾聚敛化作流光灵团！
          this.fxBridge.spawnEffect('wisp', startCenter.x, startCenter.y - 12, {
            paletteKey: 'death_nether',
            light: 1.5,
            speedScale: 1.65,
            maxDuration: 0.55,
          });
        } else if (isWingFlapFlight) {
          // 小恶魔 / 地狱鸦 / 骨龙 / 神使振翅起飞：专属色羽风气流微爆！
          const flapPalette =
            bp === 'creature_hell_raven'
              ? TOUHOU_PALETTES.hell_inferno
              : bp === 'creature_bone_dragon'
                ? TOUHOU_PALETTES.black_void
                : bp === 'creature_hakurei_seraph'
                  ? TOUHOU_PALETTES.shrine_gold
                  : TOUHOU_PALETTES.gap_violet;
          this.fxBridge.spawn('mana_burst', startCenter.x, startCenter.y - 6, {
            palette: flapPalette,
            maxDuration: 0.48,
          });
        } else {
          // 英雄（含蕾米莉亚）与其他飞行单位保持原版默认飞行起飞特效不变
          this.fxBridge.spawn('mana_burst', startCenter.x, startCenter.y - 6, {
            palette: TOUHOU_PALETTES.graze_cyan,
            maxDuration: 0.45,
          });
        }

        for (let s = 1; s <= flightSteps; s++) {
          const t = s / flightSteps;
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const baseAlt = Math.sin(t * Math.PI) * peakHeight;
          // 扑腾翅膀加振翅拍击脉冲起伏；灵团加柔和双波浪漂浮起伏；英雄保持平滑弧线
          const extraWave = isWingFlapFlight
            ? Math.sin(t * Math.PI * 5) * 2.4
            : isWraithOrbFlight
              ? Math.sin(t * Math.PI * 3.5) * 3.2
              : isVampireBatFlight
                ? Math.sin(t * Math.PI * 4.5) * 2.6
                : 0;
          const altitude = Math.max(0, baseAlt + extraWave * Math.sin(t * Math.PI));

          node.baseX = startCenter.x + (endCenter.x - startCenter.x) * ease;
          node.baseY = startCenter.y + (endCenter.y - startCenter.y) * ease + 4;
          node.offsetY = -altitude;
          node.shadow.position.set(0, altitude);
          const shadowBase = node.isIllusion ? 0.24 : isWraithOrbFlight ? 0.34 : 0.65;
          node.shadow.alpha = Math.max(0.1, shadowBase - (altitude / 45) * 0.35);
          node.container.position.set(node.baseX, node.baseY + node.offsetY);
          node.container.zIndex = Math.round(node.baseY + 260);

          // 飞行途中播撒轻盈的专属轨迹残影微粒（血蝠血雾 / 怨灵灵尘 / 地狱鸦火星）
          if (s % 6 === 3 && s < flightSteps - 2) {
            if (isVampireBatFlight) {
              this.fxBridge.spawnEffect('hit_spark', node.baseX, node.baseY - altitude - 10, {
                paletteKey: 'crimson_blood',
                light: 1.2,
                speedScale: 1.7,
                maxDuration: 0.38,
              });
            } else if (isWraithOrbFlight) {
              this.fxBridge.spawnEffect('wisp', node.baseX, node.baseY - altitude - 10, {
                paletteKey: 'abyss_frost',
                light: 1.2,
                speedScale: 1.8,
                maxDuration: 0.42,
              });
            } else if (bp === 'creature_hell_raven') {
              this.fxBridge.spawnEffect('hit_spark', node.baseX, node.baseY - altitude - 10, {
                paletteKey: 'hell_inferno',
                light: 1.15,
                speedScale: 1.8,
                maxDuration: 0.36,
              });
            } else if (bp === 'creature_hakurei_seraph') {
              this.fxBridge.spawnEffect('feather_burst', node.baseX, node.baseY - altitude - 10, {
                paletteKey: 'shrine_gold',
                light: 1.25,
                speedScale: 1.65,
                maxDuration: 0.42,
              });
            }
          }

          await sleep(16);
        }

        // 落地还形转场：血蝠血雾爆散恢复血族少女 / 灵团幽蓝舒展恢复怨灵少女！
        if (isVampireBatFlight) {
          this.fxBridge.spawnEffect('vampiric_claw_burst', endCenter.x, endCenter.y - 12, {
            paletteKey: 'scarlet_moon',
            light: 1.5,
            speedScale: 1.7,
            maxDuration: 0.55,
          });
        } else if (isWraithOrbFlight) {
          this.fxBridge.spawnEffect('soul_rise', endCenter.x, endCenter.y - 10, {
            paletteKey: 'abyss_frost',
            light: 1.4,
            speedScale: 1.65,
            maxDuration: 0.55,
          });
        }

        node.offsetY = 0;
        node.shadow.position.set(0, 0);
        node.shadow.alpha = node.isIllusion ? 0.24 : 1;
        node.container.zIndex = Math.round(node.baseY);
        return;
      }

      // 陆地单位：配合 4 帧交替迈步动画平滑前进，按体型播放轻步或巨像沉步音效
      const isHeavyFoot = node.footprint === '2x2';
      for (let i = 1; i < path.length; i++) {
        const fromPos = getFootprintCenterPixel(path[i - 1], node.footprint, state.tiles);
        const toPos = getFootprintCenterPixel(path[i], node.footprint, state.tiles);
        if (Math.abs(toPos.x - fromPos.x) > 1) {
          node.facing = toPos.x >= fromPos.x ? 'right' : 'left';
        }
        soundEngine.playAtStageX(
          isHeavyFoot ? 'move_step_heavy' : 'move_step_light',
          toPos.x,
          VIRTUAL_WIDTH,
        );

        const steps = 8;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const stepBounce = Math.sin(t * Math.PI) * 2.5;
          node.baseX = fromPos.x + (toPos.x - fromPos.x) * t;
          node.baseY = fromPos.y + (toPos.y - fromPos.y) * t + 4;
          node.offsetY = -stepBounce;
          node.container.position.set(node.baseX, node.baseY + node.offsetY);
          node.container.zIndex = Math.round(node.baseY);
          await sleep(16);
        }
        node.offsetY = 0;
      }
    } finally {
      this.setNodeAnim(node, 'idle', 6.5, true);
    }
  }

  private async animateCombatExchange(
    ev: Extract<CombatEvent, { type: 'COMBAT_EXCHANGE' }>,
  ): Promise<void> {
    const atkNode = this.unitNodes.get(ev.attackerId);
    const defNode = this.unitNodes.get(ev.defenderId);
    if (!atkNode || !defNode) return;
    // 若触发远程反击前卫替伤，反击弹道与受击反馈均指向实际替伤前卫单位
    const retTargetNode =
      (ev.retaliationTargetId ? this.unitNodes.get(ev.retaliationTargetId) : undefined) ?? atkNode;

    const dx = defNode.baseX - atkNode.baseX;
    const dy = defNode.baseY - atkNode.baseY;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / len;
    const ny = dy / len;

    // 交锋双方正面对峙朝向
    atkNode.facing = dx >= 0 ? 'right' : 'left';
    defNode.facing = dx >= 0 ? 'left' : 'right';

    const triggerHitFeedback = (
      targetNode: UnitVisualNode,
      strike: NonNullable<typeof ev.attackerStrike>,
      fromNode: UnitVisualNode,
    ) => {
      // shield-block 穹顶默认朝右（+X），需迎向来袭攻击者方向：攻击方位于受击者左侧时水平翻转朝左
      const shieldFlip =
        fromNode.baseX !== targetNode.baseX
          ? fromNode.baseX < targetNode.baseX
          : targetNode.facing === 'left';

      // 远程反击被前卫挡箭替伤时，在替伤友军头顶呈现清晰的挡箭光环与飘字
      if (strike.interceptedByUnitId) {
        if (!strike.blocked) {
          this.fxBridge.spawn('graze_shield', targetNode.baseX, targetNode.baseY - 12, { flip: shieldFlip });
        }
        this.spawnFloatingText(
          targetNode.baseX,
          targetNode.baseY - 44 * targetNode.spriteScale,
          '前卫替伤!',
          '#7ef0d4',
        );
      }

      // H4 绝对格挡（Block）：铁盾抵御零伤演出！
      if (strike.blocked) {
        soundEngine.playAtStageX('stance_defend', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.05 });
        this.fxBridge.spawn('graze_shield', targetNode.baseX, targetNode.baseY - 12, { flip: shieldFlip });
        this.spawnFloatingText(
          targetNode.baseX,
          targetNode.baseY - 30 * targetNode.spriteScale,
          '绝对格挡!',
          '#ffe680',
        );
        return;
      }

      targetNode.flashTimer = 0.22;
      this.setNodeAnim(targetNode, 'hit', 9, false);
      const angle = Math.atan2(targetNode.baseY - fromNode.baseY, targetNode.baseX - fromNode.baseX);
      if (strike.grazed) {
        soundEngine.playAtStageX('graze_tick', targetNode.baseX, VIRTUAL_WIDTH);
        this.fxBridge.spawn('graze_shield', targetNode.baseX, targetNode.baseY - 12, { flip: shieldFlip });
        this.spawnFloatingText(targetNode.baseX, targetNode.baseY - 34, `GRAZE! +${strike.grazeManaGain}MP`, '#7ae8ff');
      } else if (strike.luckyCrit) {
        soundEngine.playAtStageX('hit_crit', targetNode.baseX, VIRTUAL_WIDTH);
        this.fxBridge.spawn('crit_hit', targetNode.baseX, targetNode.baseY - 12);
        this.spawnFloatingText(targetNode.baseX, targetNode.baseY - 36 * targetNode.spriteScale, '幸运暴击!', '#ffe45e');
      } else if (strike.unluckyHit) {
        soundEngine.playAtStageX('spell_debuff', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.7 });
        this.fxBridge.spawn('hit_spark', targetNode.baseX, targetNode.baseY - 12, { angle });
        this.spawnFloatingText(targetNode.baseX, targetNode.baseY - 36 * targetNode.spriteScale, '厄运 ×0.5', '#c299ff');
      } else if (strike.isRanged) {
        const fromUnit = this.currentState?.units[fromNode.unitId];
        const proj = resolveUnitRangedProjectile(fromUnit?.defId, fromNode.blueprintId);
        soundEngine.playAtStageX(
          proj.kind === 'explosive_shell' ? 'spell_aoe' : 'hit_impact',
          targetNode.baseX,
          VIRTUAL_WIDTH,
          { volume: proj.kind === 'explosive_shell' ? 0.95 : 0.88 },
        );
        this.fxBridge.spawnEffect(proj.impactFx, targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: proj.impactPalette,
          angle,
          flip: fromNode.baseX > targetNode.baseX,
          light: proj.impactLight,
          speedScale: proj.kind === 'arrow' ? 1.55 : 1.4,
          maxDuration: proj.kind === 'explosive_shell' ? 0.95 : 0.8,
        });
        if (proj.kind === 'explosive_shell') {
          this.triggerImpactJuice(3.8, 0.04);
        }
      } else if (fromNode.blueprintId === 'creature_komainu') {
        // 镇守狛犬专属破魔神爪撕裂特效（三道翠金爪痕！）
        soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.08 });
        this.fxBridge.spawnEffect('claw_swipe', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'spring_dew',
          flip: fromNode.baseX > targetNode.baseX,
          light: 1.55,
          speedScale: 1.35,
          maxDuration: 0.9,
        });
      } else if (fromNode.blueprintId === 'creature_efreet') {
        // 法界之火专属魔界紫金灵火爆裂特效
        soundEngine.playAtStageX('spell_aoe', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.8 });
        this.fxBridge.spawnEffect('spirit_flame', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'calamity_rose',
          light: 1.55,
          speedScale: 1.4,
          maxDuration: 0.9,
        });
      } else if (fromNode.blueprintId === 'creature_nightmare') {
        // 梦境兽专属幻梦紫红震慑涟漪特效
        soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.0 });
        this.fxBridge.spawnEffect('dark_explosion', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'gap_violet',
          light: 1.45,
          speedScale: 1.45,
          maxDuration: 0.9,
        });
      } else if (fromNode.blueprintId === 'hero_remilia') {
        // 蕾米莉亚近战专属绯红冈格尼尔血芒穿刺
        soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.05 });
        this.fxBridge.spawnEffect('vampiric_claw_burst', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'scarlet_moon',
          light: 1.55,
          speedScale: 1.4,
          maxDuration: 0.9,
        });
      } else if (fromNode.blueprintId === 'creature_crimson_vampire') {
        // 血族眷属专属徒手猩红血爪撕裂 + 血蝠群汲取特效！
        soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.0 });
        this.fxBridge.spawnEffect('vampiric_claw_burst', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'crimson_blood',
          light: 1.55,
          speedScale: 1.35,
          maxDuration: 1.0,
        });
      } else if (fromNode.blueprintId === 'creature_abyss_gap_devil') {
        // 深渊隙间恶魔专属绯金月镰空间斩裂！
        soundEngine.playAtStageX('attack_melee_heavy', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.05 });
        this.fxBridge.spawnEffect('scythe_reap', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'scarlet_moon',
          flip: fromNode.baseX > targetNode.baseX,
          light: 1.6,
          speedScale: 1.35,
          maxDuration: 0.95,
        });
      } else if (fromNode.blueprintId === 'creature_bone_dragon') {
        // 骸骨巨龙专属冥界亡灵骨焰咆哮！
        soundEngine.playAtStageX('attack_melee_heavy', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.08 });
        this.fxBridge.spawnEffect('necro_skulls', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'death_nether',
          light: 1.55,
          speedScale: 1.35,
          maxDuration: 0.95,
        });
      } else if (fromNode.blueprintId === 'creature_abyss_ice_demon') {
        // 深渊冰魔专属冰晶棱刺寒霜爆裂
        soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.95 });
        this.fxBridge.spawnEffect('ice_shatter', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'abyss_frost',
          light: 1.5,
          speedScale: 1.4,
          maxDuration: 0.9,
        });
      } else if (fromNode.blueprintId === 'creature_hell_raven') {
        // 地狱鸦专属炽红炎羽三爪撕裂
        soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.98 });
        this.fxBridge.spawnEffect('claw_swipe', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'hell_inferno',
          flip: fromNode.baseX > targetNode.baseX,
          light: 1.5,
          speedScale: 1.4,
          maxDuration: 0.85,
        });
      } else if (fromNode.blueprintId === 'creature_wraith_spirit') {
        // 怨灵专属苍紫幽魂噬心
        soundEngine.playAtStageX('spell_debuff', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.9 });
        this.fxBridge.spawnEffect('soul_drain', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'death_nether',
          light: 1.45,
          speedScale: 1.45,
          maxDuration: 0.9,
        });
      } else if (fromNode.blueprintId === 'creature_corpse_husk') {
        // 尸壳专属幽青冥铁骨刃斩击
        soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.95 });
        this.fxBridge.spawnEffect('sword_slash', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'death_nether',
          flip: fromNode.baseX > targetNode.baseX,
          light: 1.4,
          speedScale: 1.4,
          maxDuration: 0.85,
        });
      } else if (fromNode.blueprintId === 'creature_exorcist_blade' || fromNode.blueprintId === 'creature_combat_mk2') {
        // 退魔剑士 / 河童战斗 II 型专属连刃十字双斩
        soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.0 });
        this.fxBridge.spawnEffect('double_slash', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: fromNode.blueprintId === 'creature_combat_mk2' ? 'celestial_jade' : 'order_lunar',
          flip: fromNode.baseX > targetNode.baseX,
          light: 1.5,
          speedScale: 1.4,
          maxDuration: 0.9,
        });
      } else {
        soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH);
        this.fxBridge.spawn('melee_slash', targetNode.baseX, targetNode.baseY - 12, {
          flip: fromNode.baseX > targetNode.baseX,
        });
      }

      // 防守方幸运护身 / 厄运破防独立光环反馈
      if (strike.defenderLucky) {
        this.fxBridge.spawnEffect('halo', targetNode.baseX, targetNode.baseY - 14, {
          paletteKey: 'spring_dew',
          light: 1.35,
          speedScale: 1.5,
          maxDuration: 0.8,
        });
        this.spawnFloatingText(
          targetNode.baseX,
          targetNode.baseY - 46 * targetNode.spriteScale,
          '幸运护身!',
          '#8cf5b4',
        );
      } else if (strike.defenderUnlucky) {
        this.spawnFloatingText(
          targetNode.baseX,
          targetNode.baseY - 46 * targetNode.spriteScale,
          '厄运破防!',
          '#ff8099',
        );
      }

      // 原版 HoMM4 双行图标受击飘字：-XX ♥（伤害） + -N ☠（兵力折损）
      const dmgColor = strike.grazed
        ? '#9ae8ff'
        : strike.defenderLucky
          ? '#8cf5b4'
          : strike.luckyCrit
            ? '#ffe45e'
            : strike.unluckyHit
              ? '#c299ff'
              : '#ff6b7a';
      const prefix = strike.grazed
        ? '擦弹 '
        : strike.luckyCrit
          ? '暴击 '
          : strike.unluckyHit
            ? '厄运 '
            : '';
      this.spawnFloatingText(
        targetNode.baseX,
        targetNode.baseY - 30 * targetNode.spriteScale,
        `${prefix}-${strike.damage} ♥`,
        dmgColor,
      );
      if (!targetNode.isHero) {
        this.spawnFloatingText(
          targetNode.baseX,
          targetNode.baseY - 18 * targetNode.spriteScale,
          `-${strike.kills} ☠`,
          strike.kills > 0 ? '#ffd875' : '#9fb0d4',
        );
      }

      // 魔眼石化 / 定身 / 震慑附加特效反馈
      if (strike.petrifyKills && strike.petrifyKills > 0) {
        soundEngine.playAtStageX('spell_debuff', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.8 });
        this.spawnFloatingText(
          targetNode.baseX,
          targetNode.baseY - 42 * targetNode.spriteScale,
          `魔眼石化 -${strike.petrifyKills}!`,
          '#d999ff',
        );
      }
      if (strike.appliedStatus) {
        // 为五类命中附带异常状态触发各自专属的精致视觉特效！
        if (strike.appliedStatus === 'frozen') {
          this.fxBridge.spawnEffect('frost_prison_shatter', targetNode.baseX, targetNode.baseY - 10, {
            paletteKey: 'abyss_frost',
            light: 1.55,
            speedScale: 1.35,
            maxDuration: 1.15,
          });
        } else if (strike.appliedStatus === 'aged') {
          this.fxBridge.spawnEffect('wither_hourglass', targetNode.baseX, targetNode.baseY - 12, {
            paletteKey: 'death_nether',
            light: 1.45,
            speedScale: 1.35,
            maxDuration: 1.1,
          });
        } else if (strike.appliedStatus === 'poisoned') {
          if (strike.poisonInstantDamage && strike.poisonInstantDamage > 0) {
            soundEngine.playAtStageX('spell_debuff', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.55 });
          }
          this.fxBridge.spawnEffect('status_poisoned', targetNode.baseX, targetNode.baseY - 10, {
            paletteKey: 'suzuran_venom',
            light: 1.5,
            speedScale: 1.4,
            maxDuration: 1.1,
          });
        } else if (strike.appliedStatus === 'terrified') {
          this.fxBridge.spawnEffect('eyeball', targetNode.baseX, targetNode.baseY - 16, {
            paletteKey: 'madness_eye',
            light: 1.45,
            speedScale: 1.4,
            maxDuration: 0.95,
          });
        } else {
          this.fxBridge.spawnEffect('ofuda_seal_ring', targetNode.baseX, targetNode.baseY - 12, {
            paletteKey: 'shrine_gold',
            light: 1.45,
            speedScale: 1.45,
            maxDuration: 1.0,
          });
        }
        const stLabel =
          strike.appliedStatus === 'terrified'
            ? '噩梦震慑!'
            : strike.appliedStatus === 'frozen'
              ? '寒霜冰封!'
              : strike.appliedStatus === 'aged'
                ? '衰老凋零!'
                : strike.appliedStatus === 'poisoned'
                  ? strike.poisonInstantDamage && strike.poisonInstantDamage > 0
                    ? `剧毒 -${strike.poisonInstantDamage}♥${!targetNode.isHero && (strike.poisonInstantKills ?? 0) > 0 ? ` (-${strike.poisonInstantKills}☠)` : ''}`
                    : '剧毒侵蚀!'
                  : '符箓定身!';
        const stColor =
          strike.appliedStatus === 'terrified'
            ? '#ff6699'
            : strike.appliedStatus === 'frozen'
              ? '#80ebff'
              : strike.appliedStatus === 'aged'
                ? '#c89eff'
                : strike.appliedStatus === 'poisoned'
                  ? '#82ff78'
                  : '#ffe680';
        this.spawnFloatingText(
          targetNode.baseX,
          targetNode.baseY - 42 * targetNode.spriteScale,
          stLabel,
          stColor,
        );
      }

      // 伴生次级命中演出：周身全扫 / 龙息贯穿 / 烈焰护盾反灼！
      if (strike.secondaryHits && strike.secondaryHits.length > 0) {
        for (const sub of strike.secondaryHits) {
          const subNode = this.unitNodes.get(sub.targetId);
          if (!subNode) continue;
          if (sub.blocked) {
            const subShieldFlip =
              fromNode.baseX !== subNode.baseX
                ? fromNode.baseX < subNode.baseX
                : subNode.facing === 'left';
            soundEngine.playAtStageX('stance_defend', subNode.baseX, VIRTUAL_WIDTH, { volume: 0.85 });
            this.fxBridge.spawn('graze_shield', subNode.baseX, subNode.baseY - 12, { flip: subShieldFlip });
            this.spawnFloatingText(subNode.baseX, subNode.baseY - 28 * subNode.spriteScale, '格挡!', '#ffe680');
            continue;
          }
          subNode.flashTimer = 0.2;
          this.setNodeAnim(subNode, 'hit', 9, false);
          if (sub.kind === 'fire_shield') {
            soundEngine.playAtStageX('spell_aoe', subNode.baseX, VIRTUAL_WIDTH, { volume: 0.65 });
            this.fxBridge.spawnEffect('fire_ring', subNode.baseX, subNode.baseY - 10, {
              paletteKey: 'hell_inferno',
              light: 1.5,
              speedScale: 1.5,
              maxDuration: 0.85,
            });
            this.spawnFloatingText(
              subNode.baseX,
              subNode.baseY - 34 * subNode.spriteScale,
              `烈焰反伤 -${sub.damage}`,
              '#ff884d',
            );
          } else if (sub.kind === 'breath') {
            soundEngine.playAtStageX('spell_aoe', subNode.baseX, VIRTUAL_WIDTH, { volume: 0.85 });
            this.fxBridge.spawnEffect('fire_breath', subNode.baseX, subNode.baseY - 10, {
              paletteKey: 'phoenix_flame',
              light: 1.55,
              speedScale: 1.45,
              maxDuration: 0.9,
            });
            this.spawnFloatingText(
              subNode.baseX,
              subNode.baseY - 34 * subNode.spriteScale,
              `龙息贯穿 -${sub.damage}`,
              '#ff6633',
            );
          } else {
            this.fxBridge.spawnEffect(
              fromNode.blueprintId === 'creature_hell_raven' ? 'claw_swipe' : 'double_slash',
              subNode.baseX,
              subNode.baseY - 12,
              {
                paletteKey: fromNode.blueprintId === 'creature_hell_raven' ? 'hell_inferno' : 'reimu_crimson',
                light: 1.4,
                speedScale: 1.5,
                maxDuration: 0.8,
              },
            );
            this.spawnFloatingText(
              subNode.baseX,
              subNode.baseY - 32 * subNode.spriteScale,
              `横扫 -${sub.damage}`,
              '#ff9f5a',
            );
          }
          if (!subNode.isHero && sub.kills > 0) {
            this.spawnFloatingText(
              subNode.baseX,
              subNode.baseY - 20 * subNode.spriteScale,
              `-${sub.kills} ☠`,
              '#ffd875',
            );
          }
        }
      }
    };

    /** 若攻击方触发了「双重攻击」，衔接第二段追击动作（同时支持远程连射与近战连斩！）与飘字！ */
    const playDoubleStrikeFollowUp = async () => {
      const follow = ev.attackerStrike?.followUpStrike;
      if (!follow) return;
      const followRanged = Boolean(ev.attackerStrike?.isRanged);
      await sleep(90);
      this.setNodeAnim(atkNode, 'attack', 12, false);
      if (followRanged) {
        soundEngine.playAtStageX(this.getUnitRangedShotSound(atkNode), atkNode.baseX, VIRTUAL_WIDTH, { volume: 1.0 });
        const dur = this.spawnUnitRangedShot(atkNode, defNode);
        await sleep(Math.round(dur * 880));
      } else {
        soundEngine.playAtStageX('attack_melee_slash', atkNode.baseX, VIRTUAL_WIDTH, { volume: 1.05 });
        atkNode.offsetX = nx * 11;
        atkNode.offsetY = ny * 11;
        await sleep(95);
      }
      this.triggerImpactJuice(3.5, 0.06);
      if (follow.blocked) {
        const followShieldFlip =
          atkNode.baseX !== defNode.baseX
            ? atkNode.baseX < defNode.baseX
            : defNode.facing === 'left';
        soundEngine.playAtStageX('stance_defend', defNode.baseX, VIRTUAL_WIDTH);
        this.fxBridge.spawn('graze_shield', defNode.baseX, defNode.baseY - 12, { flip: followShieldFlip });
        this.spawnFloatingText(defNode.baseX, defNode.baseY - 34 * defNode.spriteScale, '二段格挡!', '#ffe680');
      } else {
        defNode.flashTimer = 0.22;
        this.setNodeAnim(defNode, 'hit', 9, false);
        if (followRanged) {
          const atkUnit = this.currentState?.units[atkNode.unitId];
          const proj = resolveUnitRangedProjectile(atkUnit?.defId, atkNode.blueprintId);
          const fAngle = Math.atan2(defNode.baseY - atkNode.baseY, defNode.baseX - atkNode.baseX);
          soundEngine.playAtStageX(proj.kind === 'explosive_shell' ? 'spell_aoe' : 'hit_impact', defNode.baseX, VIRTUAL_WIDTH, { volume: 1.0 });
          this.fxBridge.spawnEffect(proj.impactFx, defNode.baseX, defNode.baseY - 12, {
            paletteKey: proj.impactPalette,
            angle: fAngle,
            flip: atkNode.baseX > defNode.baseX,
            light: proj.impactLight,
            speedScale: 1.5,
            maxDuration: 0.8,
          });
        } else {
          soundEngine.playAtStageX('hit_impact', defNode.baseX, VIRTUAL_WIDTH, { volume: 1.08 });
          this.fxBridge.spawn('melee_slash', defNode.baseX, defNode.baseY - 12, { flip: atkNode.baseX <= defNode.baseX });
        }
        this.spawnFloatingText(
          defNode.baseX,
          defNode.baseY - 34 * defNode.spriteScale,
          `连击 -${follow.damage} ♥`,
          '#ffe478',
        );
        if (!defNode.isHero) {
          this.spawnFloatingText(
            defNode.baseX,
            defNode.baseY - 20 * defNode.spriteScale,
            `-${follow.kills} ☠`,
            follow.kills > 0 ? '#ffd875' : '#9fb0d4',
          );
        }
      }
      await sleep(160);
      atkNode.offsetX = 0;
      atkNode.offsetY = 0;
      this.setNodeAnim(atkNode, 'idle', 6.5, true);
      this.setNodeAnim(defNode, 'idle', 6.5, true);
    };

    const isRanged = Boolean(ev.attackerStrike?.isRanged || ev.defenderStrike?.isRanged);

    if (ev.mode === 'simultaneous') {
      // 【H4 同时反击视觉高光】：双方同步蓄力抬手 → 双向挥击/对射！
      const atkPounce = atkNode.blueprintId === 'creature_komainu' && !isRanged;
      const defPounce = defNode.blueprintId === 'creature_komainu' && !isRanged;
      this.setNodeAnim(atkNode, 'attack', 10, false);
      this.setNodeAnim(defNode, 'attack', 10, false);
      // 狛犬抬腿蓄力瞬间微微人立后仰起势！
      if (atkPounce) {
        atkNode.offsetX = -nx * 3;
        atkNode.offsetY = -4;
      }
      if (defPounce) {
        defNode.offsetX = nx * 3;
        defNode.offsetY = -4;
      }
      await sleep(110);

      if (isRanged) {
        soundEngine.playAtStageX(this.getUnitRangedShotSound(atkNode), atkNode.baseX, VIRTUAL_WIDTH);
        soundEngine.playAtStageX(this.getUnitRangedShotSound(defNode), defNode.baseX, VIRTUAL_WIDTH, { delay: 0.04 });
        const d1 = this.spawnUnitRangedShot(atkNode, defNode);
        const d2 = this.spawnUnitRangedShot(defNode, retTargetNode);
        await sleep(Math.round(Math.max(d1, d2) * 920));
      } else {
        const atkHeavy = atkNode.footprint === '2x2';
        soundEngine.playAtStageX(
          atkHeavy ? 'attack_melee_heavy' : 'attack_melee_slash',
          (atkNode.baseX + defNode.baseX) / 2,
          VIRTUAL_WIDTH,
        );
        atkNode.offsetX = nx * (atkPounce ? 14 : 9);
        atkNode.offsetY = ny * (atkPounce ? 14 : 9) - (atkPounce ? 4 : 0);
        defNode.offsetX = -nx * (defPounce ? 14 : 9);
        defNode.offsetY = -ny * (defPounce ? 14 : 9) - (defPounce ? 4 : 0);
        await sleep(110);
      }

      this.triggerImpactJuice(4.5, 0.08);
      soundEngine.playAtStageX('hit_simultaneous', (atkNode.baseX + defNode.baseX) / 2, VIRTUAL_WIDTH);
      if (ev.attackerStrike) triggerHitFeedback(defNode, ev.attackerStrike, atkNode);
      if (ev.defenderStrike) triggerHitFeedback(retTargetNode, ev.defenderStrike, defNode);
      this.spawnFloatingText(
        (atkNode.baseX + defNode.baseX) / 2,
        Math.min(atkNode.baseY, defNode.baseY) - 44,
        '同时反击!',
        '#f6d88b',
      );
      await sleep(190);
      atkNode.offsetX = 0;
      atkNode.offsetY = 0;
      defNode.offsetX = 0;
      defNode.offsetY = 0;
      this.setNodeAnim(atkNode, 'idle', 6.5, true);
      this.setNodeAnim(defNode, 'idle', 6.5, true);
      if (retTargetNode !== atkNode) {
        this.setNodeAnim(retTargetNode, 'idle', 6.5, true);
      }
      await playDoubleStrikeFollowUp();
      await sleep(160);
      return;
    }

    // 顺序结算：先攻或单向打击（清晰展现蓄力抬手 → 挥击/射击 → 对方受击后仰！）
    const ordered: Array<{
      from: UnitVisualNode;
      to: UnitVisualNode;
      strike: NonNullable<typeof ev.attackerStrike>;
    }> = [];
    if (ev.mode === 'defender_first') {
      if (ev.defenderStrike) ordered.push({ from: defNode, to: retTargetNode, strike: ev.defenderStrike });
      if (ev.attackerStrike) ordered.push({ from: atkNode, to: defNode, strike: ev.attackerStrike });
    } else {
      if (ev.attackerStrike) ordered.push({ from: atkNode, to: defNode, strike: ev.attackerStrike });
      if (ev.defenderStrike) ordered.push({ from: defNode, to: retTargetNode, strike: ev.defenderStrike });
    }

    for (const step of ordered) {
      step.from.facing = step.to.baseX >= step.from.baseX ? 'right' : 'left';
      const isKomainu = step.from.blueprintId === 'creature_komainu' && !step.strike.isRanged;
      const sdx = step.to.baseX - step.from.baseX;
      const sdy = step.to.baseY - step.from.baseY;
      const slen = Math.max(1, Math.hypot(sdx, sdy));
      this.setNodeAnim(step.from, 'attack', isKomainu ? 9.5 : 10, false);
      if (isKomainu) {
        // 镇守狛犬抬腿人立蓄力：微收后仰腾起，蓄满翡翠神威！
        step.from.offsetX = -(sdx / slen) * 4;
        step.from.offsetY = -5;
      }
      await sleep(isKomainu ? 130 : 115);

      if (step.strike.isRanged) {
        soundEngine.playAtStageX(this.getUnitRangedShotSound(step.from), step.from.baseX, VIRTUAL_WIDTH);
        const shotDur = this.spawnUnitRangedShot(step.from, step.to);
        await sleep(Math.round(shotDur * 900));
      } else {
        const heavy = step.from.footprint === '2x2';
        soundEngine.playAtStageX(heavy ? 'attack_melee_heavy' : 'attack_melee_slash', step.from.baseX, VIRTUAL_WIDTH);
        const isLongPoke = slen > 52;
        if (isKomainu) {
          // 镇守狛犬飞扑弧线：腾空跃扑前压，隔格攻击时纵跃扑袭并劈出裂空翡翠神爪！
          const lungeDist = isLongPoke ? 24 : 14;
          step.from.offsetX = (sdx / slen) * (lungeDist * 0.6);
          step.from.offsetY = (sdy / slen) * (lungeDist * 0.6) - 8;
          await sleep(60);
          step.from.offsetX = (sdx / slen) * lungeDist;
          step.from.offsetY = (sdy / slen) * lungeDist;
          if (isLongPoke) {
            this.fxBridge.spawnEffect('claw_swipe', (step.from.baseX + step.to.baseX) / 2, (step.from.baseY + step.to.baseY) / 2 - 14, {
              paletteKey: 'shrine_gold',
              flip: step.from.baseX > step.to.baseX,
              light: 1.45,
              speedScale: 1.4,
              maxDuration: 0.75,
            });
            this.spawnFloatingText(
              (step.from.baseX + step.to.baseX) / 2,
              Math.min(step.from.baseY, step.to.baseY) - 34,
              '神爪飞扑!',
              '#9effdf',
            );
          }
          await sleep(85);
        } else {
          const lungeDist = isLongPoke ? 16 : 10;
          step.from.offsetX = (sdx / slen) * lungeDist;
          step.from.offsetY = (sdy / slen) * lungeDist;
          if (isLongPoke) {
            this.spawnProjectile(step.from.baseX, step.from.baseY - 14, step.to.baseX, step.to.baseY - 14, 0x7ff2c9);
            this.spawnFloatingText(
              (step.from.baseX + step.to.baseX) / 2,
              Math.min(step.from.baseY, step.to.baseY) - 34,
              '长手突刺!',
              '#9effdf',
            );
          }
          await sleep(isLongPoke ? 135 : 95);
        }
      }

      this.triggerImpactJuice(3.2, 0.06);
      triggerHitFeedback(step.to, step.strike, step.from);
      await sleep(180);
      step.from.offsetX = 0;
      step.from.offsetY = 0;
      this.setNodeAnim(step.from, 'idle', 6.5, true);
      this.setNodeAnim(step.to, 'idle', 6.5, true);
      await sleep(130);
    }
    await playDoubleStrikeFollowUp();
  }

  private async animateSpellCast(
    ev: Extract<CombatEvent, { type: 'SPELL_CAST' }>,
    finalState: BattleState,
  ): Promise<void> {
    const state = this.currentState;
    if (!state) return;
    const tile = state.tiles[hexKey(ev.targetHex)];
    const targetPx = hexToPixel(ev.targetHex, STAGE_PROJECTION, tile?.elevation ?? 1);
    const choreo = getSpellVfxChoreography(ev.spellId);
    const casterNode = this.unitNodes.get(ev.casterId);
    const casterX = casterNode?.baseX ?? targetPx.x;
    const casterY = (casterNode?.baseY ?? targetPx.y) - 14;

    // 阶段 1：施法者转向抬手 + 专属起手阵/蓄力灵光
    if (casterNode) {
      if (Math.abs(targetPx.x - casterNode.baseX) > 2) {
        casterNode.facing = targetPx.x >= casterNode.baseX ? 'right' : 'left';
      }
      this.setNodeAnim(casterNode, 'attack', 9, false);
      if (choreo.casterFx) {
        this.fxBridge.spawnEffect(choreo.casterFx, casterNode.baseX, casterNode.baseY - 10, {
          paletteKey: choreo.casterPalette ?? choreo.impactPalette,
          light: (choreo.light ?? 1.35) * 0.9,
          speedScale: 1.55,
          maxDuration: 0.95,
        });
      }
      await sleep(115);
    }

    // 阶段 2：专属弹道 / 贯穿射线 / 连锁锯齿雷弧 / 业火六格环爆 / 双端隙间传送 / 吸魂回流 / 全屏天象
    const travel = choreo.travel ?? 'none';
    const travelCol = choreo.travelColor ?? 0xffe484;
    const castAngle = Math.atan2(targetPx.y - 10 - casterY, targetPx.x - casterX);

    if (travel === 'bolt' || travel === 'ofuda_arc') {
      soundEngine.playAtStageX(choreo.sound, casterX, VIRTUAL_WIDTH, { volume: 0.95 });
      const spellKind: RangedProjectileKind =
        travel === 'ofuda_arc'
          ? 'light_orb'
          : ev.spellId.startsWith('death_')
            ? 'dark_orb'
            : ev.spellId.includes('fire') || ev.spellId.includes('meteor')
              ? 'explosive_shell'
              : 'magic_wave';
      this.spawnProjectile(casterX, casterY, targetPx.x, targetPx.y - 12, travelCol, {
        kind: spellKind,
        arcHeight: spellKind === 'explosive_shell' ? 22 : spellKind === 'magic_wave' ? 5 : 11,
      });
      if (travel === 'ofuda_arc') {
        this.spawnProjectile(casterX, casterY - 5, targetPx.x, targetPx.y - 16, 0xffffff, {
          kind: 'light_orb',
          arcHeight: 15,
        });
      }
      await sleep(170);
    } else if (travel === 'beam') {
      soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
      this.fxBridge.spawnEffect(choreo.impactFx, casterX, casterY, {
        paletteKey: choreo.impactPalette,
        angle: castAngle,
        light: choreo.light ?? 1.6,
        speedScale: choreo.speedScale ?? 1.35,
        maxDuration: 1.15,
      });
      this.spawnProjectile(casterX, casterY, targetPx.x, targetPx.y - 12, travelCol);
      await sleep(140);
    } else if (travel === 'teleport_rift') {
      soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
      // 先在被传送单位原位置撕开隙间消隐
      const disp = ev.displacedUnits?.[0];
      const oldNode = disp ? this.unitNodes.get(disp.unitId) : null;
      if (oldNode) {
        this.fxBridge.spawnEffect('blink_out', oldNode.baseX, oldNode.baseY - 12, {
          paletteKey: choreo.casterPalette ?? 'gap_violet',
          light: 1.5,
          maxDuration: 0.9,
        });
        this.fxBridge.spawnEffect('portal', oldNode.baseX, oldNode.baseY - 12, {
          paletteKey: choreo.impactPalette,
          light: 1.45,
          maxDuration: 1.0,
        });
        await sleep(160);
      }
    } else if (travel === 'chain_arcs') {
      soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
      let prevX = casterX;
      let prevY = casterY;
      for (const uid of ev.affectedUnitIds) {
        const hopNode = this.unitNodes.get(uid);
        if (!hopNode) continue;
        this.spawnProjectile(prevX, prevY, hopNode.baseX, hopNode.baseY - 14, travelCol);
        const hopAngle = Math.atan2(hopNode.baseY - 14 - prevY, hopNode.baseX - prevX);
        this.fxBridge.spawnEffect('chain_lightning', (prevX + hopNode.baseX) / 2, (prevY + hopNode.baseY - 14) / 2, {
          paletteKey: choreo.impactPalette,
          angle: hopAngle,
          light: 1.65,
          speedScale: 1.6,
          maxDuration: 0.9,
        });
        prevX = hopNode.baseX;
        prevY = hopNode.baseY - 14;
        await sleep(80);
      }
    } else if (travel === 'ring_burst') {
      soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
      // 业火红环：围绕中心格的 6 个外环六边形逐格喷发火柱（保留中心格安全）
      const ringHexes = getHexRange(ev.targetHex, 1).filter((h) => hexDistance(ev.targetHex, h) === 1);
      for (const rh of ringHexes) {
        const rTile = state.tiles[hexKey(rh)];
        if (!rTile) continue;
        const rPx = hexToPixel(rh, STAGE_PROJECTION, rTile.elevation);
        this.fxBridge.spawnEffect(choreo.secondaryFx ?? 'flame_pillar', rPx.x, rPx.y - 8, {
          paletteKey: choreo.secondaryPalette ?? choreo.impactPalette,
          light: 1.5,
          speedScale: 1.55,
          maxDuration: 1.1,
        });
      }
    } else if (travel === 'meteor_rain') {
      soundEngine.playAtStageX(choreo.sound, VIRTUAL_WIDTH / 2, VIRTUAL_WIDTH);
      // 焦热地狱 / 末日审判：多点天降火流星轰炸！
      const points =
        ev.affectedUnitIds.length > 0
          ? ev.affectedUnitIds.slice(0, 6).map((uid) => {
              const n = this.unitNodes.get(uid);
              return n ? { x: n.baseX, y: n.baseY - 10 } : { x: targetPx.x, y: targetPx.y - 10 };
            })
          : [
              { x: targetPx.x - 28, y: targetPx.y - 16 },
              { x: targetPx.x + 26, y: targetPx.y - 8 },
              { x: targetPx.x, y: targetPx.y - 12 },
            ];
      for (const pt of points) {
        this.spawnProjectile(pt.x + 44, pt.y - 96, pt.x, pt.y, travelCol);
        this.fxBridge.spawnEffect(choreo.impactFx, pt.x, pt.y, {
          paletteKey: choreo.impactPalette,
          light: choreo.light ?? 1.65,
          speedScale: 1.45,
          maxDuration: 1.25,
        });
        await sleep(55);
      }
    } else if (travel === 'drain_return') {
      soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
      // 冥樱吸魂 / 噬灵魔蛭 / 窃法魔手：灵流从各目标倒灌回施法者！
      const drainSources = ev.affectedUnitIds.slice(0, 6);
      for (const uid of drainSources) {
        const srcNode = this.unitNodes.get(uid);
        if (srcNode && uid !== ev.casterId) {
          this.spawnProjectile(srcNode.baseX, srcNode.baseY - 12, casterX, casterY, travelCol);
        }
      }
    } else {
      soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
    }

    // 阶段 3：目标主爆发 + 副层叠特效 + 全屏中央天象
    if (travel !== 'beam') {
      this.fxBridge.spawnEffect(choreo.impactFx, targetPx.x, targetPx.y - 10, {
        paletteKey: choreo.impactPalette,
        angle: castAngle,
        light: choreo.light ?? 1.4,
        speedScale: choreo.speedScale ?? 1.45,
        maxDuration: 1.5,
      });
    }
    if (choreo.secondaryFx && travel !== 'ring_burst') {
      this.fxBridge.spawnEffect(choreo.secondaryFx, targetPx.x, targetPx.y - 12, {
        paletteKey: choreo.secondaryPalette ?? choreo.impactPalette,
        light: choreo.light ?? 1.4,
        speedScale: 1.45,
        maxDuration: 1.4,
      });
    }
    if (choreo.weatherFx) {
      const isFullScreenWeather =
        choreo.weatherFx === 'god_rays' ||
        choreo.weatherFx === 'cherry_blossoms' ||
        choreo.weatherFx === 'aurora' ||
        choreo.weatherFx === 'fog' ||
        choreo.weatherFx === 'shooting_stars' ||
        choreo.weatherFx === 'crimson_mist';
      this.fxBridge.spawnEffect(
        choreo.weatherFx,
        VIRTUAL_WIDTH / 2,
        isFullScreenWeather ? VIRTUAL_HEIGHT / 2 : VIRTUAL_HEIGHT * 0.52,
        {
          paletteKey: choreo.weatherPalette ?? choreo.impactPalette,
          light: isFullScreenWeather ? 1.35 : 1.5,
          speedScale: isFullScreenWeather ? 1.0 : 1.25,
          maxDuration: isFullScreenWeather ? 2.2 : 1.8,
        },
      );
    }
    // 群体/多目标逐单位绽放独立专属粒子（最多并行 8 支防全屏过密掉帧；meteor_rain 已逐目标落陨时防重复翻倍）
    if (choreo.perTargetFx && ev.affectedUnitIds.length > 0) {
      const perTargetCap = travel === 'meteor_rain' ? 4 : 8;
      for (const uid of ev.affectedUnitIds.slice(0, perTargetCap)) {
        const n = this.unitNodes.get(uid);
        if (!n) continue;
        this.fxBridge.spawnEffect(choreo.perTargetFx, n.baseX, n.baseY - 12, {
          paletteKey: choreo.perTargetPalette ?? choreo.impactPalette,
          light: 1.35,
          speedScale: 1.5,
          maxDuration: 1.2,
        });
      }
    }

    this.triggerImpactJuice(choreo.shake, choreo.hitStop ?? 0.05);
    await sleep(230);

    // 阶段 4：同步召唤/幻象/隙间瞬移与变身法术（如「兔化」）后的单位视觉节点并绽放登场灵光！
    if (casterNode) {
      const updatedCaster = finalState.units[ev.casterId];
      if (updatedCaster && updatedCaster.voxelBlueprintId !== casterNode.blueprintId) {
        this.updateUnitVisualNode(casterNode, updatedCaster, finalState);
      }
    }
    if (ev.summonedUnitIds && ev.summonedUnitIds.length > 0) {
      for (const sid of ev.summonedUnitIds) {
        const sUnit = finalState.units[sid];
        if (!sUnit) continue;
        let sNode = this.unitNodes.get(sid);
        if (!sNode) {
          sNode = this.createUnitVisualNode(sUnit);
          this.unitNodes.set(sid, sNode);
        }
        this.updateUnitVisualNode(sNode, sUnit, finalState);
        this.fxBridge.spawnEffect(choreo.impactFx, sNode.baseX, sNode.baseY - 12, {
          paletteKey: choreo.impactPalette,
          light: 1.5,
          maxDuration: 1.3,
        });
      }
    }
    if (ev.displacedUnits && ev.displacedUnits.length > 0) {
      for (const disp of ev.displacedUnits) {
        const dUnit = finalState.units[disp.unitId];
        const dNode = this.unitNodes.get(disp.unitId);
        if (dUnit && dNode) {
          this.updateUnitVisualNode(dNode, dUnit, finalState);
          this.fxBridge.spawnEffect(choreo.secondaryFx ?? 'blink_in', dNode.baseX, dNode.baseY - 12, {
            paletteKey: choreo.impactPalette,
            light: 1.5,
            maxDuration: 1.1,
          });
        }
      }
    }
    if (ev.noteText) {
      this.spawnFloatingText(targetPx.x, targetPx.y - 38, ev.noteText, '#ffe885');
    }

    if (ev.damageMap) {
      for (const [uid, info] of Object.entries(ev.damageMap)) {
        const node = this.unitNodes.get(uid);
        if (!node) continue;
        node.flashTimer = 0.22;
        this.setNodeAnim(node, 'hit', 9, false);
        if (info.grazed) {
          const spellShieldFlip =
            casterX !== node.baseX ? casterX < node.baseX : node.facing === 'left';
          soundEngine.playAtStageX('graze_tick', node.baseX, VIRTUAL_WIDTH);
          this.fxBridge.spawn('graze_shield', node.baseX, node.baseY - 12, { flip: spellShieldFlip });
          this.spawnFloatingText(node.baseX, node.baseY - 34, 'GRAZE!', '#7ae8ff');
        }
        this.spawnFloatingText(
          node.baseX,
          node.baseY - 30 * node.spriteScale,
          `${info.grazed ? '擦弹 ' : ''}-${info.damage} ♥`,
          '#ff8f6b',
        );
        if (!node.isHero) {
          this.spawnFloatingText(
            node.baseX,
            node.baseY - 18 * node.spriteScale,
            `-${info.kills} ☠`,
            info.kills > 0 ? '#ffd875' : '#9fb0d4',
          );
        }
      }
    }
    if (ev.reviveMap) {
      for (const [uid, info] of Object.entries(ev.reviveMap)) {
        const node = this.unitNodes.get(uid);
        if (!node) continue;
        if (info.revivedCount > 0) {
          this.spawnFloatingText(node.baseX, node.baseY - 34 * node.spriteScale, `苏生 +${info.revivedCount} 兵!`, '#ffe680');
        } else if (info.healedHp > 0) {
          this.spawnFloatingText(node.baseX, node.baseY - 26 * node.spriteScale, `+${info.healedHp} HP`, '#6effa8');
        }
      }
    } else if (ev.healMap) {
      for (const [uid, amount] of Object.entries(ev.healMap)) {
        const node = this.unitNodes.get(uid);
        if (!node) continue;
        this.spawnFloatingText(node.baseX, node.baseY - 24, `+${amount} HP`, '#6effa8');
      }
    }
    await sleep(320);
    if (casterNode) this.setNodeAnim(casterNode, 'idle', 6.5, true);
    if (ev.damageMap) {
      for (const uid of Object.keys(ev.damageMap)) {
        const n = this.unitNodes.get(uid);
        if (n) this.setNodeAnim(n, 'idle', 6.5, true);
      }
    }
  }

  private async animateSpellCardDeclared(
    ev: Extract<CombatEvent, { type: 'SPELL_CARD_DECLARED' }>,
  ): Promise<void> {
    const casterNode = this.unitNodes.get(ev.casterId);
    const state = this.currentState;

    // 1. 通知 Vue 叠层弹出华丽暗夜和风符卡宣言横幅，并同步奏响东方标志性符卡宣言神乐铃与缔太鼓！
    soundEngine.play('spellcard_declare');
    const casterUnit = state?.units[ev.casterId];
    this.callbacks.onSpellCardBanner({
      name: ev.spellCardName,
      subtitle: ev.subtitle,
      themeColor: ev.themeColor,
      accentColor: ev.accentColor,
      casterBlueprintId: casterUnit?.voxelBlueprintId,
    });

    if (casterNode) {
      this.setNodeAnim(casterNode, 'attack', 8, false);
    }

    await sleep(320);

    // 2. 在舞台上触发四位英雄各自独一无二的终极符卡特效与天象演出！
    if (ev.lineHexes && ev.lineHexes.length > 0 && casterNode && state) {
      const endHex = ev.lineHexes[ev.lineHexes.length - 1];
      const endPx = hexToPixel(endHex, STAGE_PROJECTION, state.tiles[hexKey(endHex)]?.elevation ?? 1);
      const angle = Math.atan2(endPx.y - casterNode.baseY, endPx.x - casterNode.baseX);
      const isRemiliaCard = ev.spellCardId === 'remilia_gungnir';

      if (isRemiliaCard) {
        // 蕾米莉亚《神枪「冈格尼尔之枪」》：绯红螺旋魔枪贯日 + 红雾异变全屏天象 + 专属哥特雷枪音效！
        soundEngine.playAtStageX('spellcard_gungnir', casterNode.baseX, VIRTUAL_WIDTH);
        this.fxBridge.spawnEffect('gungnir_lance', casterNode.baseX, casterNode.baseY - 14, {
          paletteKey: 'scarlet_moon',
          angle,
          light: 1.8,
          speedScale: 1.2,
          maxDuration: 1.5,
        });
        this.fxBridge.spawnEffect('crimson_mist', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
          paletteKey: 'scarlet_moon',
          light: 1.4,
          speedScale: 1.0,
          maxDuration: 2.2,
        });
        this.triggerImpactJuice(8.5, 0.1);

        for (let i = 0; i < ev.lineHexes.length; i += 2) {
          const h = ev.lineHexes[i];
          const px = hexToPixel(h, STAGE_PROJECTION, state.tiles[hexKey(h)]?.elevation ?? 1);
          this.fxBridge.spawnEffect('vampiric_claw_burst', px.x, px.y - 10, {
            paletteKey: 'scarlet_moon',
            light: 1.6,
            speedScale: 1.5,
            maxDuration: 0.9,
          });
          await sleep(70);
        }
      } else {
        // 魔理沙《极限火花》：极彩魔炮 + 沿途螺旋五芒星弹幕齐鸣！
        soundEngine.playAtStageX('spellcard_master_spark', casterNode.baseX, VIRTUAL_WIDTH);
        this.fxBridge.spawn('spellcard_marisa', casterNode.baseX, casterNode.baseY - 14, {
          angle,
          palette: TOUHOU_PALETTES.marisa_starlight,
          light: 1.7,
          maxDuration: 1.5,
        });
        this.triggerImpactJuice(8, 0.1);

        for (let i = 0; i < ev.lineHexes.length; i += 2) {
          const h = ev.lineHexes[i];
          const px = hexToPixel(h, STAGE_PROJECTION, state.tiles[hexKey(h)]?.elevation ?? 1);
          this.fxBridge.spawnEffect('star_danmaku_spiral', px.x, px.y - 10, {
            paletteKey: 'marisa_starlight',
            light: 1.55,
            speedScale: 1.45,
            maxDuration: 0.95,
          });
          await sleep(75);
        }
      }
    } else if (casterNode) {
      const isEirinCard = ev.spellCardId === 'eirin_astronomical_entombing';
      if (isEirinCard) {
        // 八意永琳《天文密葬法》：三层浑天星轨秘仪 + 全屏苍蓝流星天幕！
        soundEngine.play('spell_heal', { volume: 1.15 });
        this.fxBridge.spawnEffect('lunar_astrolabe_fx', casterNode.baseX, casterNode.baseY - 12, {
          paletteKey: 'order_lunar',
          light: 1.7,
          speedScale: 1.15,
          maxDuration: 1.8,
        });
        this.fxBridge.spawnEffect('lunar_astrolabe_fx', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT * 0.54, {
          paletteKey: 'frost_cyan',
          light: 1.6,
          speedScale: 1.1,
          maxDuration: 1.8,
        });
        this.fxBridge.spawnEffect('shooting_stars', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
          paletteKey: 'order_lunar',
          light: 1.4,
          speedScale: 1.0,
          maxDuration: 2.2,
        });
        this.triggerImpactJuice(5.8, 0.08);
      } else {
        // 博丽灵梦《梦想天生》：朱金太极阴阳玉大阵 + 八百万神降全屏圣光！
        soundEngine.play('spell_heal', { volume: 1.15 });
        this.fxBridge.spawnEffect('yin_yang_dream', casterNode.baseX, casterNode.baseY - 12, {
          paletteKey: 'reimu_crimson',
          light: 1.72,
          speedScale: 1.15,
          maxDuration: 1.9,
        });
        this.fxBridge.spawnEffect('ofuda_seal_ring', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT * 0.54, {
          paletteKey: 'shrine_gold',
          light: 1.55,
          speedScale: 1.2,
          maxDuration: 1.7,
        });
        this.fxBridge.spawnEffect('god_rays', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
          paletteKey: 'reimu_crimson',
          light: 1.4,
          speedScale: 1.0,
          maxDuration: 2.2,
        });
        this.triggerImpactJuice(5.5, 0.08);
      }
    }

    if (ev.damageMap) {
      for (const [uid, info] of Object.entries(ev.damageMap)) {
        const node = this.unitNodes.get(uid);
        if (!node) continue;
        node.flashTimer = 0.3;
        this.setNodeAnim(node, 'hit', 9, false);
        this.spawnFloatingText(
          node.baseX,
          node.baseY - 32 * node.spriteScale,
          `-${info.damage} ♥`,
          '#ffe45e',
        );
        if (!node.isHero) {
          this.spawnFloatingText(
            node.baseX,
            node.baseY - 20 * node.spriteScale,
            `-${info.kills} ☠`,
            info.kills > 0 ? '#ffd875' : '#9fb0d4',
          );
        }
      }
    }

    await sleep(620);
    if (casterNode) this.setNodeAnim(casterNode, 'idle', 6.5, true);
    if (ev.damageMap) {
      for (const uid of Object.keys(ev.damageMap)) {
        const n = this.unitNodes.get(uid);
        if (n) this.setNodeAnim(n, 'idle', 6.5, true);
      }
    }
  }

  /** 按攻击者远程弹道原型解析对应的物理建模发射音效 ID */
  private getUnitRangedShotSound(node: UnitVisualNode) {
    const unit = this.currentState?.units[node.unitId];
    const proj = resolveUnitRangedProjectile(unit?.defId, node.blueprintId);
    return resolveRangedShotSound(proj.kind);
  }

  /** 按攻击者身份自动发射五大经典远程弹道（箭矢 / 光球 / 暗球 / 魔法冲击波 / 爆裂弹），返回飞行时长 */
  private spawnUnitRangedShot(fromNode: UnitVisualNode, toNode: UnitVisualNode): number {
    const unit = this.currentState?.units[fromNode.unitId];
    const proj = resolveUnitRangedProjectile(unit?.defId, fromNode.blueprintId);
    this.spawnProjectile(
      fromNode.baseX,
      fromNode.baseY - 16,
      toNode.baseX,
      toNode.baseY - 16,
      proj.primaryColor,
      {
        kind: proj.kind,
        accentColor: proj.accentColor,
        arcHeight: proj.arcHeight,
        duration: proj.duration,
      },
    );
    return proj.duration;
  }

  private spawnProjectile(
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
  ): void {
    const kind = opts?.kind ?? 'light_orb';
    const arcHeight = opts?.arcHeight ?? 10;
    const duration = opts?.duration ?? 0.2;
    const g = buildRangedProjectileGraphic(kind, color, opts?.accentColor ?? 0xffffff);
    g.position.set(fromX, fromY);
    g.rotation = Math.atan2(toY - fromY - arcHeight * Math.PI * 0.5, toX - fromX);
    this.projectileLayer.addChild(g);
    this.projectiles.push({
      graphic: g,
      kind,
      fromX,
      fromY,
      toX,
      toY,
      arcHeight,
      elapsed: 0,
      duration,
    });
  }

  private spawnFloatingText(x: number, y: number, message: string, color: string): void {
    const text = new PIXI.Text({
      text: message,
      style: {
        fontFamily: '"Microsoft YaHei", Consolas, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: color,
        stroke: { color: '#070912', width: 3 },
      },
    });
    text.anchor.set(0.5);
    text.resolution = 2;
    text.position.set(x, y);
    this.floatingLayer.addChild(text);
    this.floatingLabels.push({
      text,
      vx: (Math.random() - 0.5) * 12,
      vy: -24,
      life: 0,
      maxLife: 1.05,
    });
  }

  private triggerImpactJuice(intensity: number, hitStopSeconds: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, 0.24);
    this.hitStopTimer = Math.max(this.hitStopTimer, hitStopSeconds);
  }

  private tick(dt: number): void {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return;
    }

    this.globalTime += dt;

    // 1. 震屏偏移更新
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const power = this.shakeIntensity * (this.shakeTimer / 0.24);
      const sx = (Math.random() - 0.5) * power * 2;
      const sy = (Math.random() - 0.5) * power * 2;
      this.worldRoot.position.set(this.viewOffsetX + sx, this.viewOffsetY + sy);
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
        this.worldRoot.position.set(this.viewOffsetX, this.viewOffsetY);
      }
    }

    // 2. 更新盘面符卡结界旋转大阵
    this.magicCircle.update(dt);

    // 3. 驱动全角色多状态骨骼像素帧动画（待机呼吸/眨眼/振翅、行走迈步、抬手挥击、受击后仰）！
    for (const node of this.unitNodes.values()) {
      if (!node.container.visible) continue;
      const unit = this.currentState?.units[node.unitId];

      if (unit && unit.status === 'alive') {
        node.animTime += dt;
        const baked = getBakedVoxelSpriteSet(node.blueprintId);
        const frames = baked.animations[node.facing][node.animState];
        if (frames && frames.length > 0) {
          const rawIdx = Math.floor(node.animTime * node.animFps);
          const idx = node.animLoop ? rawIdx % frames.length : Math.min(frames.length - 1, rawIdx);
          this.applyNodeAnimFrame(node, idx);
        }
      }

      // 陆地单位双脚稳稳扎根大地（动作全由内部骨骼帧驱动），仅飞行单位保留优雅离地悬浮感！
      const hoverY = node.isFloating
        ? -5 + Math.sin(this.globalTime * 2.8 + node.bobPhase) * 1.4
        : 0;
      node.bodySprite.position.y = hoverY;
      node.glowSprite.position.y = hoverY;
      node.flashSprite.position.y = hoverY;

      // 幻象模型动态虚化演出：半透明呼吸闪烁 + 柔焦重影层相位漂移，一眼区分真身与镜像！
      if (node.isIllusion && unit?.status === 'alive') {
        const illusionPhase = this.globalTime * 3.6 + node.bobPhase;
        const bodyShimmerX = Math.sin(illusionPhase * 0.85) * 0.45;
        node.bodySprite.position.x = bodyShimmerX;
        node.bodySprite.alpha = 0.52 + Math.sin(illusionPhase) * 0.08;
        node.illusionGhostSprite.position.set(
          Math.sin(illusionPhase * 1.15) * 2.4,
          hoverY + Math.cos(illusionPhase * 0.9) * 0.85,
        );
        node.illusionGhostSprite.alpha = 0.25 + Math.abs(Math.sin(illusionPhase * 1.3)) * 0.14;
        node.glowSprite.position.x = bodyShimmerX;
        node.glowSprite.alpha = 0.52 + Math.sin(illusionPhase * 1.5) * 0.24;
      } else {
        node.bodySprite.position.x = 0;
        node.glowSprite.position.x = 0;
        // 发光核心柔和脉冲
        node.glowSprite.alpha = 0.58 + Math.sin(this.globalTime * 4 + node.bobPhase) * 0.22;
      }

      if (node.flashTimer > 0) {
        node.flashTimer -= dt;
        node.flashSprite.alpha = Math.min(1, node.flashTimer * 5);
      } else {
        node.flashSprite.alpha = 0;
      }

      const footOffsetY = this.getBadgeFootOffsetY(node, unit?.status === 'knocked_out');
      node.container.position.set(node.baseX + node.offsetX, node.baseY + node.offsetY);
      node.badgeContainer.position.set(node.baseX + node.offsetX, node.baseY + node.offsetY + footOffsetY);
    }

    // 更新当前行动单位头顶的上下弹跳精致亮金指示箭头 ▼（精确锚定于真实头顶上方，绝不遮帽挡脸！）
    const activeId = this.currentState?.activeUnitId;
    const activeNode = activeId ? this.unitNodes.get(activeId) : null;
    if (activeNode && activeNode.container.visible && this.currentState?.phase === 'active') {
      const bounce = Math.sin(this.globalTime * 6.5) * 3.0;
      const headTopY = this.getSpriteHeadTopOffsetY(activeNode);
      this.activePointerArrow.visible = true;
      this.activePointerArrow.position.set(
        activeNode.baseX + activeNode.offsetX,
        activeNode.baseY + activeNode.offsetY + headTopY - 9 + bounce,
      );
    } else {
      this.activePointerArrow.visible = false;
    }

    // 4. 更新暗夜漂浮流萤
    for (const m of this.ambientMotes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt + Math.sin(this.globalTime * 2 + m.phase) * 3 * dt;
      if (m.x < -4) m.x = VIRTUAL_WIDTH + 4;
      if (m.x > VIRTUAL_WIDTH + 4) m.x = -4;
      if (m.y < 24) m.y = VIRTUAL_HEIGHT - 16;
      m.sprite.position.set(Math.round(m.x), Math.round(m.y));
      m.sprite.alpha = 0.3 + Math.abs(Math.sin(this.globalTime * 1.8 + m.phase)) * 0.65;
    }

    // 5. 更新五类远程弹道轨迹（按抛物线切线精确旋转朝向 + 能量核脉冲呼吸）
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.elapsed += dt;
      const t = Math.min(1, p.elapsed / p.duration);
      const px = p.fromX + (p.toX - p.fromX) * t;
      const py = p.fromY + (p.toY - p.fromY) * t - Math.sin(t * Math.PI) * p.arcHeight;
      const vx = p.toX - p.fromX;
      const vy = p.toY - p.fromY - Math.cos(t * Math.PI) * Math.PI * p.arcHeight;
      p.graphic.position.set(px, py);
      p.graphic.rotation = Math.atan2(vy, vx);
      if (p.kind === 'light_orb' || p.kind === 'dark_orb' || p.kind === 'explosive_shell') {
        const pulse = 0.92 + 0.16 * Math.sin(p.elapsed * 38);
        p.graphic.scale.set(pulse);
      } else if (p.kind === 'magic_wave') {
        const stretch = 0.95 + 0.25 * Math.sin(t * Math.PI);
        p.graphic.scale.set(stretch, 1 + 0.18 * t);
      }
      if (t >= 1) {
        p.graphic.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    // 6. 更新飘浮战报文字
    for (let i = this.floatingLabels.length - 1; i >= 0; i--) {
      const f = this.floatingLabels[i];
      f.life += dt;
      f.text.x += f.vx * dt;
      f.text.y += f.vy * dt;
      f.vy += 28 * dt;
      f.text.alpha = Math.max(0, 1 - Math.pow(f.life / f.maxLife, 1.8));
      if (f.life >= f.maxLife) {
        f.text.destroy();
        this.floatingLabels.splice(i, 1);
      }
    }

    // 7. 更新 pixelfx 双缓冲辉光层
    this.fxBridge.update(dt);
  }

  public destroy(): void {
    this.destroyed = true;
    if (this.pendingPointerRaf !== null) {
      window.cancelAnimationFrame(this.pendingPointerRaf);
      this.pendingPointerRaf = null;
    }
    this.resizeObserver?.disconnect();
    if (this.app) {
      this.app.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.app.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
      this.app.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.app.canvas.removeEventListener('contextmenu', this.handleContextMenu);
      for (const node of this.unitNodes.values()) {
        node.bodySprite.filters = null;
        node.illusionGhostSprite.filters = null;
      }
      this.illusionBodyBlurFilter.destroy();
      this.illusionGhostBlurFilter.destroy();
      this.fxBridge?.destroy();
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}

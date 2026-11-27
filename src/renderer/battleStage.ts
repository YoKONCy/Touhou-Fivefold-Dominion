/**
 * PixiJS v8 暗夜灵光六边形战斗舞台总控（协调入口）
 *
 * 架构职责：
 * - 全局锁定虚拟像素分辨率 + 最近邻采样，彻底杜绝混合像素（Mixels）
 * - 管理 9 大图层（暗夜远景 → 2.5D 六边形箱庭 → 旋转符卡大阵 → 战术高亮与 LoS 射线 →
 *   精雕体素棋子 → 实时 2D 点光源 → 流萤微光粒子 → pixelfx 双缓冲辉光 → 飘浮像素战报字）
 * - 委托 src/renderer/stage/* 子模块负责战术高亮、单位节点、移动/交锋/施法与符卡演出
 * - 完全不修改任何战斗逻辑状态，仅将用户的六边形点击与悬停透传给状态桥
 */

import * as PIXI from 'pixi.js';
import { soundEngine } from '@audio/index';
import { findUnitAtHex } from '@core/combatEngine';
import { hexKey, hexToPixel, pixelToHex, type HexCoord, type HexTile } from '@core/hex';
import type { BattleState, BattleUnit, CombatEvent } from '@core/types';
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
import { animateAreaRangedAttack, animateCombatExchange } from './stage/combatAnimations';
import { sleep } from './stage/geometry';
import { animateUnitMove } from './stage/moveAnimations';
import {
  computeHoverOverlaySignature,
  computeStaticOverlaySignature,
  drawActivePointerArrow,
  renderHoverOverlay,
  renderStaticOverlay,
} from './stage/overlayRenderer';
import { animateSpellCardDeclared, animateSpellCast } from './stage/spellAnimations';
import {
  STAGE_PROJECTION,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
  type AmbientMote,
  type BattleStageCallbacks,
  type FloatingLabel,
  type GridVisibilityMode,
  type ProjectileTrail,
  type StageAnimationContext,
  type StageOverlayHints,
  type UnitNodeRenderContext,
  type UnitVisualNode,
} from './stage/types';
import {
  applyNodeLayerPriority,
  createUnitVisualNode,
  setNodeAnim,
  tickUnitVisualNodes,
  updateUnitVisualNode,
} from './stage/unitNodeRenderer';

export {
  STAGE_PROJECTION,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
  type BattleStageCallbacks,
  type GridVisibilityMode,
  type StageOverlayHints,
};

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
  /** 轻量悬停动态层（贴地层：悬停格、路径线、近战落脚箭头与阻挡地格框） */
  private hoverOverlayGraphics = new PIXI.Graphics();
  /** 前景弹道与视线阻挡标记层（置于棋子与玄石碑之上，确保飞行轨迹与红色「✕」拦截点永不被遮挡！） */
  private trajectoryOverlayGraphics = new PIXI.Graphics();
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
  private gridMode: GridVisibilityMode = 'hidden';
  private unitNodes = new Map<string, UnitVisualNode>();
  /** 当前可操控单位头顶极其醒目的弹跳亮金大指示箭头 ▼ */
  private activePointerArrow = new PIXI.Graphics();
  /** 触控长按蓄力环（420ms 触发详情/取消时的即时视觉反馈） */
  private touchHoldRing = new PIXI.Graphics();
  private ambientMotes: AmbientMote[] = [];
  private floatingLabels: FloatingLabel[] = [];
  private projectiles: ProjectileTrail[] = [];

  private currentState: BattleState | null = null;
  private currentTilesMap = new Map<string, HexTile>();
  private currentHints: StageOverlayHints | null = null;
  /** 当前悬停单位 ID（触发临时层级浮起与防遮挡光环） */
  private hoveredUnitId: string | null = null;

  /** 画面缩放与居中偏移，用于精准反算鼠标六边形坐标 */
  private viewScale = 1;
  private viewOffsetX = 0;
  private viewOffsetY = 0;
  private lastViewportW = 0;
  private lastViewportH = 0;

  /** 高刷新率鼠标 pointermove 帧合并缓冲（每帧至多响应一次，彻底消除画面抖动抽搐） */
  private pendingPointerClient: { x: number; y: number } | null = null;
  private pendingPointerRaf: number | null = null;
  /** 容器尺寸变化合并定时器（使用 0ms 宏任务而非 rAF，确保后台节流环境与真实转屏均能立即重算并重绘） */
  private pendingResizeTimer: number | null = null;

  /** 触控手势状态机（区分轻触二段确认、滑动实时预览、420ms 长按等效右键） */
  private activeTouchPointerId: number | null = null;
  private touchStartClient: { x: number; y: number } | null = null;
  private touchStartVirtual: { x: number; y: number } | null = null;
  private touchStartTime = 0;
  private touchMoved = false;
  private touchLongPressFired = false;
  private touchLongPressTimer: number | null = null;
  private lastTouchTimestamp = 0;
  private lastScrubHex: HexCoord | null = null;

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

  /** 构建单位节点渲染子系统依赖上下文 */
  private getUnitRenderContext(): UnitNodeRenderContext {
    return {
      unitLayer: this.unitLayer,
      badgeLayer: this.badgeLayer,
      lightLayer: this.lightLayer,
      lightTex: this.lightTex,
      illusionBodyBlurFilter: this.illusionBodyBlurFilter,
      illusionGhostBlurFilter: this.illusionGhostBlurFilter,
      getHoveredUnitId: () => this.hoveredUnitId,
    };
  }

  /** 构建事件演出动画子系统共享上下文 */
  private getAnimationContext(): StageAnimationContext {
    return {
      unitNodes: this.unitNodes,
      unitLayer: this.unitLayer,
      projectileLayer: this.projectileLayer,
      fxBridge: this.fxBridge,
      callbacks: this.callbacks,
      getCurrentState: () => this.currentState,
      getUnitRangedShotSound: (node) => this.getUnitRangedShotSound(node),
      spawnUnitRangedShot: (fromNode, toNode) => this.spawnUnitRangedShot(fromNode, toNode),
      spawnProjectile: (fromX, fromY, toX, toY, color, opts) =>
        this.spawnProjectile(fromX, fromY, toX, toY, color, opts),
      spawnFloatingText: (x, y, message, color) => this.spawnFloatingText(x, y, message, color),
      triggerImpactJuice: (intensity, hitStopSeconds) => this.triggerImpactJuice(intensity, hitStopSeconds),
      syncUnitNode: (node, unit, state) => updateUnitVisualNode(node, unit, state, this.getUnitRenderContext()),
      ensureAndSyncUnitNode: (unit, state) => {
        const ctx = this.getUnitRenderContext();
        let node = this.unitNodes.get(unit.id);
        if (!node) {
          node = createUnitVisualNode(unit, ctx);
          this.unitNodes.set(unit.id, node);
        }
        updateUnitVisualNode(node, unit, state, ctx);
        return node;
      },
    };
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
    // 禁用浏览器默认滚动与双击缩放，交由战场触控手势状态机精准接管
    app.canvas.style.touchAction = 'none';
    this.hostEl.innerHTML = '';
    this.hostEl.appendChild(app.canvas);

    // 1. 组装五层景深暗夜灵光虚拟像素舞台（实景大地 → 极淡六边形格 → 贴地符卡阵 → 静/动分离战术高亮 → 棋子与障碍混排 → 点光源 → 独立血蓝条 → 特效）
    app.stage.addChild(this.worldRoot);

    this.magicCircle = new SpellCardMagicCircleLayer(STAGE_PROJECTION.originX, STAGE_PROJECTION.originY);
    this.unitLayer.sortableChildren = true;
    this.badgeLayer.sortableChildren = true;
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
      this.trajectoryOverlayGraphics,
      this.ambientLayer,
      this.projectileLayer,
      this.fxBridge.sprite,
      this.floatingLayer,
    );

    this.activePointerArrow.zIndex = 20000;
    this.badgeLayer.addChild(this.activePointerArrow);
    this.touchHoldRing.zIndex = 25000;
    this.badgeLayer.addChild(this.touchHoldRing);
    drawActivePointerArrow(this.activePointerArrow);
    this.setupStaticLights();
    this.setupAmbientMotes();
    this.syncState(initialState);
    this.updateViewportTransform();

    // 绑定自适应缩放监听与指针交互（同时兼容键鼠悬停与触屏轻触/滑览/长按）
    this.resizeObserver = new ResizeObserver(() => this.scheduleViewportTransform());
    this.resizeObserver.observe(this.hostEl);
    window.addEventListener('resize', this.handleWindowResize, { passive: true });
    window.addEventListener('orientationchange', this.handleWindowResize, { passive: true });

    app.canvas.addEventListener('pointermove', this.handlePointerMove);
    app.canvas.addEventListener('pointerleave', this.handlePointerLeave);
    app.canvas.addEventListener('pointerdown', this.handlePointerDown);
    app.canvas.addEventListener('pointerup', this.handlePointerUp);
    app.canvas.addEventListener('pointercancel', this.handlePointerCancel);
    app.canvas.addEventListener('contextmenu', this.handleContextMenu);
    app.canvas.addEventListener('webglcontextrestored', this.handleWebglContextRestored);

    // 启动 60fps 主循环
    app.ticker.add((ticker) => {
      const dt = Math.min(0.05, ticker.deltaMS / 1000);
      this.tick(dt);
    });
  }

  /** 布置暗夜幻想乡场景固定氛围点光源（贴合中景石灯笼、魔法屋、满月与中央灵泉位置） */
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

  /** 暗夜漂浮流萤与星尘粒子 */
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

  private handleWindowResize = (): void => {
    this.scheduleViewportTransform();
  };

  private scheduleViewportTransform(): void {
    if (this.destroyed || this.pendingResizeTimer !== null) return;
    this.pendingResizeTimer = window.setTimeout(() => {
      this.pendingResizeTimer = null;
      if (this.destroyed) return;
      this.updateViewportTransform();
    }, 0);
  }

  private handleWebglContextRestored = (): void => {
    if (this.destroyed || !this.app) return;
    this.app.renderer.resetState?.();
    this.app.render();
  };

  private updateViewportTransform(): void {
    if (!this.app) return;
    const w = Math.max(1, Math.round(this.hostEl.clientWidth || window.innerWidth));
    const h = Math.max(1, Math.round(this.hostEl.clientHeight || window.innerHeight));
    // 严格判重：容器尺寸未真正变化时不调用 renderer.resize，彻底杜绝 DPI 小数缩放引发的整屏闪动抽搐！
    if (w === this.lastViewportW && h === this.lastViewportH) return;
    this.lastViewportW = w;
    this.lastViewportH = h;

    this.app.renderer.resize(w, h);
    // 保持画布 CSS 随父容器自适应，避免 autoDensity 写入固定像素宽干扰移动端侧栏折展
    this.app.canvas.style.width = '100%';
    this.app.canvas.style.height = '100%';

    const scale = Math.min(w / VIRTUAL_WIDTH, h / VIRTUAL_HEIGHT);
    this.viewScale = Math.max(0.2, scale);
    this.viewOffsetX = Math.floor((w - VIRTUAL_WIDTH * this.viewScale) / 2);
    this.viewOffsetY = Math.floor((h - VIRTUAL_HEIGHT * this.viewScale) / 2);

    this.worldRoot.scale.set(this.viewScale);
    this.worldRoot.position.set(this.viewOffsetX, this.viewOffsetY);

    // 强制重置 GPU 视口缓存并立即提交一帧渲染，防止容器折展或转屏后画布残留黑帧或旧纵横比
    this.app.renderer.resetState?.();
    this.app.render();
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
   * 悬停/左键（!includeKnockedOut）按：地面敌方 → 前景敌方躯干 → 地面友方 → 友方躯干 → 空地；
   * 右键查详情（includeKnockedOut = true）按：地面存活 → 任意前景躯干 → 地面倒地英雄。
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
        if (groundUnit && groundUnit.side !== activeSide) return groundHex;
        const enemyTorso = hitTestTorso((u) => u.side !== activeSide);
        if (enemyTorso) return enemyTorso;
        if (groundUnit) return groundHex;
        const allyTorso = hitTestTorso((u) => u.side === activeSide);
        if (allyTorso) return allyTorso;
      } else {
        if (groundUnit && groundUnit.status === 'alive') return groundHex;
        const anyTorso = hitTestTorso(() => true);
        if (anyTorso) return anyTorso;
        if (groundUnit) return groundHex;
      }
    }

    return groundValid ? groundHex : null;
  }

  private clearTouchHoldTimer(): void {
    if (this.touchLongPressTimer !== null) {
      window.clearTimeout(this.touchLongPressTimer);
      this.touchLongPressTimer = null;
    }
    this.touchHoldRing.clear();
  }

  private renderTouchHoldRing(): void {
    this.touchHoldRing.clear();
    if (
      this.activeTouchPointerId === null ||
      this.touchMoved ||
      this.touchLongPressFired ||
      !this.touchStartVirtual
    ) {
      return;
    }
    const elapsed = performance.now() - this.touchStartTime;
    if (elapsed < 110) return;
    const progress = Math.min(1, (elapsed - 110) / 310);
    const { x, y } = this.touchStartVirtual;
    const radius = 11 + progress * 3;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * progress;

    this.touchHoldRing.circle(x, y, radius).stroke({ color: 0x0b0810, alpha: 0.65, width: 3.2 });
    this.touchHoldRing
      .moveTo(x + Math.cos(startAngle) * radius, y + Math.sin(startAngle) * radius)
      .arc(x, y, radius, startAngle, endAngle)
      .stroke({ color: 0xf5df9e, alpha: 0.95, width: 2 });
  }

  private scheduleHoverFromClient(client: { x: number; y: number }, isTouchScrub: boolean): void {
    this.pendingPointerClient = client;
    if (this.pendingPointerRaf !== null) return;
    this.pendingPointerRaf = window.requestAnimationFrame(() => {
      this.pendingPointerRaf = null;
      if (this.destroyed || !this.pendingPointerClient) return;
      const curClient = this.pendingPointerClient;
      const pt = this.clientToVirtual(curClient.x, curClient.y);
      if (!pt) {
        if (!isTouchScrub) {
          this.callbacks.onHoverHex(null, null, null);
        }
        return;
      }
      const resolvedHex = this.resolvePointerHex(pt.x, pt.y, false);
      if (isTouchScrub) {
        this.lastScrubHex = resolvedHex;
      }
      this.callbacks.onHoverHex(resolvedHex, curClient, pt);
    });
  }

  private handlePointerMove = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') {
      if (e.pointerId !== this.activeTouchPointerId || !this.touchStartClient) return;
      const dist = Math.hypot(e.clientX - this.touchStartClient.x, e.clientY - this.touchStartClient.y);
      if (!this.touchMoved && dist > 10) {
        this.touchMoved = true;
        this.clearTouchHoldTimer();
      }
      if (this.touchMoved && !this.touchLongPressFired) {
        this.scheduleHoverFromClient({ x: e.clientX, y: e.clientY }, true);
      }
      return;
    }

    this.scheduleHoverFromClient({ x: e.clientX, y: e.clientY }, false);
  };

  private handlePointerLeave = (e: PointerEvent): void => {
    // 移动端抬手后会紧跟触发 touch pointerleave，绝不可借此清空刚锁定的触控预览态
    if (e.pointerType === 'touch') return;
    this.pendingPointerClient = null;
    if (this.pendingPointerRaf !== null) {
      window.cancelAnimationFrame(this.pendingPointerRaf);
      this.pendingPointerRaf = null;
    }
    this.callbacks.onHoverHex(null, null, null);
  };

  private handlePointerDown = (e: PointerEvent): void => {
    const pt = this.clientToVirtual(e.clientX, e.clientY);
    if (e.pointerType === 'touch') {
      this.lastTouchTimestamp = performance.now();
      // 若第二根手指介入则取消长按蓄力，避免双指误触
      if (this.activeTouchPointerId !== null && this.activeTouchPointerId !== e.pointerId) {
        this.clearTouchHoldTimer();
        this.touchMoved = true;
        return;
      }
      this.activeTouchPointerId = e.pointerId;
      this.touchStartClient = { x: e.clientX, y: e.clientY };
      this.touchStartVirtual = pt;
      this.touchStartTime = performance.now();
      this.touchMoved = false;
      this.touchLongPressFired = false;
      this.lastScrubHex = null;
      try {
        this.app?.canvas.setPointerCapture?.(e.pointerId);
      } catch {
        // 部分模拟环境不支持 pointer capture，静默忽略
      }

      this.clearTouchHoldTimer();
      const downClient = { x: e.clientX, y: e.clientY };
      this.touchLongPressTimer = window.setTimeout(() => {
        this.touchLongPressTimer = null;
        if (this.destroyed || this.touchMoved || this.activeTouchPointerId !== e.pointerId) return;
        this.touchLongPressFired = true;
        this.touchHoldRing.clear();
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          const userActivation = (
            navigator as Navigator & { userActivation?: { hasBeenActive?: boolean } }
          ).userActivation;
          if (!userActivation || userActivation.hasBeenActive) {
            try {
              navigator.vibrate(18);
            } catch {
              // 忽略无震动权限设备
            }
          }
        }
        const resolved = pt ? this.resolvePointerHex(pt.x, pt.y, true) : null;
        if (this.callbacks.onLongPressHex) {
          this.callbacks.onLongPressHex(resolved, downClient);
        } else if (resolved) {
          this.callbacks.onRightClickHex(resolved, downClient);
        }
      }, 420);
      return;
    }

    if (!pt) return;
    if (e.button === 0) {
      const resolved = this.resolvePointerHex(pt.x, pt.y, false);
      if (resolved) this.callbacks.onClickHex(resolved);
    }
  };

  private finishTouchGesture(e: PointerEvent, cancelled: boolean): void {
    if (e.pointerType !== 'touch' || e.pointerId !== this.activeTouchPointerId) return;
    this.lastTouchTimestamp = performance.now();
    this.clearTouchHoldTimer();
    try {
      this.app?.canvas.releasePointerCapture?.(e.pointerId);
    } catch {
      // 静默忽略
    }

    const wasLongPress = this.touchLongPressFired;
    const wasMoved = this.touchMoved;
    const startClient = this.touchStartClient;
    const fallbackScrubHex = this.lastScrubHex;

    this.activeTouchPointerId = null;
    this.touchStartClient = null;
    this.touchStartVirtual = null;
    this.touchMoved = false;
    this.touchLongPressFired = false;
    this.lastScrubHex = null;

    if (cancelled || wasLongPress) return;

    const upClient = { x: e.clientX, y: e.clientY };
    const pt =
      this.clientToVirtual(upClient.x, upClient.y) ??
      (startClient ? this.clientToVirtual(startClient.x, startClient.y) : null);

    if (!wasMoved) {
      const resolved = pt ? this.resolvePointerHex(pt.x, pt.y, false) : null;
      if (this.callbacks.onTouchTapHex) {
        this.callbacks.onTouchTapHex(resolved, upClient, pt);
      } else if (resolved) {
        this.callbacks.onClickHex(resolved);
      }
    } else {
      const resolved = pt ? this.resolvePointerHex(pt.x, pt.y, false) : fallbackScrubHex;
      this.callbacks.onTouchScrubEnd?.(resolved, upClient, pt);
    }
  }

  private handlePointerUp = (e: PointerEvent): void => {
    this.finishTouchGesture(e, false);
  };

  private handlePointerCancel = (e: PointerEvent): void => {
    this.finishTouchGesture(e, true);
  };

  /** 在 contextmenu 阶段触发右键单位详情，彻底避免 Windows 下弹窗瞬关竞态 Bug，同时屏蔽触控长按触发的重复菜单 */
  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    if (performance.now() - this.lastTouchTimestamp < 650) return;
    const pt = this.clientToVirtual(e.clientX, e.clientY);
    if (!pt) return;
    const resolved = this.resolvePointerHex(pt.x, pt.y, true);
    if (resolved) this.callbacks.onRightClickHex(resolved, { x: e.clientX, y: e.clientY });
  };

  /** 切换贴地六边形网格的视觉显隐档位 */
  public setGridMode(mode: GridVisibilityMode): void {
    this.gridMode = mode;
    if (this.gridSprite) {
      this.gridSprite.alpha = mode === 'subtle' ? 0.085 : mode === 'clear' ? 0.28 : 0;
    }
  }

  /** 同步最新逻辑状态至渲染舞台（重建或更新实景大地、立体障碍物、体素棋子与盘面结界） */
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
    const renderCtx = this.getUnitRenderContext();
    const seen = new Set<string>();
    for (const unit of Object.values(state.units)) {
      seen.add(unit.id);
      let node = this.unitNodes.get(unit.id);
      if (!node) {
        node = createUnitVisualNode(unit, renderCtx);
        this.unitNodes.set(unit.id, node);
      }
      updateUnitVisualNode(node, unit, state, renderCtx);
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

  /** 批量刷新全部单位的图层置顶顺序 */
  private refreshAllNodeLayerPriorities(): void {
    const state = this.currentState;
    if (!state) return;
    for (const node of this.unitNodes.values()) {
      const u = state.units[node.unitId];
      if (!u) continue;
      applyNodeLayerPriority(node, u, state, this.hoveredUnitId);
    }
  }

  /** 静/动分离重绘战术高亮层 */
  public updateOverlay(hints: StageOverlayHints, forceStatic = false): void {
    const prevHoveredId = this.hoveredUnitId;
    this.currentHints = hints;
    this.hoveredUnitId = hints.hoveredUnitId;
    const state = this.currentState;
    if (!state) return;

    if (prevHoveredId !== this.hoveredUnitId || forceStatic) {
      this.refreshAllNodeLayerPriorities();
    }

    // 1. 静态层签名判重：鼠标在棋盘内移动时完全跳过静态大面积六边形重绘！
    const staticSig = computeStaticOverlaySignature(state, hints);
    if (forceStatic || staticSig !== this.lastStaticOverlaySig) {
      this.lastStaticOverlaySig = staticSig;
      renderStaticOverlay(this.staticOverlayGraphics, state, hints);
    }

    // 2. 轻量悬停层签名判重
    const hoverSig = computeHoverOverlaySignature(staticSig, hints);
    if (!forceStatic && hoverSig === this.lastHoverOverlaySig) {
      return;
    }
    this.lastHoverOverlaySig = hoverSig;
    renderHoverOverlay(this.hoverOverlayGraphics, this.trajectoryOverlayGraphics, state, hints);
  }

  /** 顺序消费引擎产出的演出事件流，同步播放打击感动画、pixelfx 双缓冲辉光与立体声空间音效！ */
  public async playEvents(events: CombatEvent[], finalState: BattleState): Promise<void> {
    const animCtx = this.getAnimationContext();

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
          setNodeAnim(node, 'hit', 8, false);
          this.fxBridge.spawnEffect('status_poisoned', node.baseX, node.baseY - 12, {
            paletteKey: ev.kind === 'plague' ? 'yomi_plague' : 'suzuran_venom',
            light: 1.42,
            speedScale: 1.4,
            maxDuration: 0.95,
          });
          const dotLabel = ev.kind === 'plague' ? `瘟疫 -${ev.damage} ♥` : `剧毒 -${ev.damage} ♥`;
          this.spawnFloatingText(
            node.baseX,
            node.baseY - 34 * node.spriteScale,
            dotLabel,
            ev.kind === 'plague' ? '#c98aff' : '#7dff70',
          );
          if (!node.isHero && ev.kills > 0) {
            this.spawnFloatingText(node.baseX, node.baseY - 20 * node.spriteScale, `-${ev.kills} ☠`, '#a8ff80');
          }
          await sleep(165);
          setNodeAnim(node, 'idle', 6.5, true);
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
            this.spawnFloatingText(node.baseX, node.baseY - 34 * node.spriteScale, '士气高涨! 先手+25%', '#ffe466');
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
            this.spawnFloatingText(node.baseX, node.baseY - 32 * node.spriteScale, '士气低落! 后手-20%', '#b89ce6');
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
        await animateUnitMove(animCtx, ev.unitId, ev.path);
      } else if (ev.type === 'COMBAT_EXCHANGE') {
        await animateCombatExchange(animCtx, ev);
      } else if (ev.type === 'AREA_RANGED_ATTACK') {
        await animateAreaRangedAttack(animCtx, ev);
      } else if (ev.type === 'DUEL_LOCKED') {
        const node = this.unitNodes.get(ev.unitId);
        if (node) {
          this.fxBridge.spawnEffect('fire_ring', node.baseX, node.baseY - 10, {
            paletteKey: 'hell_inferno',
            light: 1.5,
            speedScale: 1.5,
            maxDuration: 0.85,
          });
          this.spawnFloatingText(node.baseX, node.baseY - 38 * node.spriteScale, '🔥 死斗锁定!', '#ff7052');
          await sleep(160);
        }
      } else if (ev.type === 'DUEL_CLEARED') {
        const node = this.unitNodes.get(ev.unitId);
        if (node) {
          this.spawnFloatingText(node.baseX, node.baseY - 36 * node.spriteScale, '死斗解除', '#ffe082');
        }
      } else if (ev.type === 'SPELL_CAST') {
        await animateSpellCast(animCtx, ev, finalState);
      } else if (ev.type === 'SPELL_CARD_DECLARED') {
        await animateSpellCardDeclared(animCtx, ev);
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

    // 3. 驱动全角色多状态骨骼像素帧动画、脚底旋转法阵光环、幻象虚化与头顶剑菱指针
    tickUnitVisualNodes(
      this.unitNodes,
      this.activePointerArrow,
      this.currentState,
      this.hoveredUnitId,
      this.globalTime,
      dt,
    );

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

    // 7. 渲染触控长按蓄力光环并更新 pixelfx 双缓冲辉光层
    this.renderTouchHoldRing();
    this.fxBridge.update(dt);
  }

  public destroy(): void {
    this.destroyed = true;
    this.clearTouchHoldTimer();
    if (this.pendingResizeTimer !== null) {
      window.clearTimeout(this.pendingResizeTimer);
      this.pendingResizeTimer = null;
    }
    if (this.pendingPointerRaf !== null) {
      window.cancelAnimationFrame(this.pendingPointerRaf);
      this.pendingPointerRaf = null;
    }
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('orientationchange', this.handleWindowResize);
    this.resizeObserver?.disconnect();
    if (this.app) {
      this.app.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.app.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
      this.app.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.app.canvas.removeEventListener('pointerup', this.handlePointerUp);
      this.app.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
      this.app.canvas.removeEventListener('contextmenu', this.handleContextMenu);
      this.app.canvas.removeEventListener('webglcontextrestored', this.handleWebglContextRestored);
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

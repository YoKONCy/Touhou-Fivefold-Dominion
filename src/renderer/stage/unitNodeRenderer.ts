/**
 * 单位视觉节点构建、脚底状态托盘、图层优先级与逐帧动画更新子系统
 */

import * as PIXI from 'pixi.js';
import { computeUnitStats } from '@core/modifiers';
import { resolveUnitSummonKind, type BattleState, type BattleUnit } from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { getBakedVoxelSpriteSet, type SpriteAnimState } from '../voxelSprites';
import {
  getBadgeFootOffsetY,
  getFootprintCenterPixel,
  getSpriteHeadTopOffsetY,
  parseColorNumber,
} from './geometry';
import {
  FOOTPRINT_VISUAL_SCALE,
  type UnitNodeRenderContext,
  type UnitVisualNode,
} from './types';

/** 创建单位的体素精灵、脚底光环、一体化兵力血蓝条与氛围点光源节点 */
export function createUnitVisualNode(
  unit: BattleUnit,
  ctx: UnitNodeRenderContext,
): UnitVisualNode {
  const container = new PIXI.Container();
  const baked = getBakedVoxelSpriteSet(unit.voxelBlueprintId);
  const spriteScale = FOOTPRINT_VISUAL_SCALE[unit.footprint] ?? 1;

  const shadow = new PIXI.Graphics();
  const shadowRx = (unit.kind === 'hero' ? 11 : 9) * spriteScale;
  const shadowRy = 5 * spriteScale;
  shadow.ellipse(0, 2, shadowRx, shadowRy).fill({ color: 0x04060d, alpha: 0.62 });

  const activeHalo = new PIXI.Graphics();
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

  container.addChild(shadow, activeHalo, baseRing, illusionGhostSprite, bodySprite, glowSprite, flashSprite);
  ctx.unitLayer.addChild(container);
  ctx.badgeLayer.addChild(badgeContainer);

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
    lightSprite = new PIXI.Sprite(ctx.lightTex);
    lightSprite.anchor.set(0.5);
    lightSprite.tint = parseColorNumber(unit.themeColor);
    lightSprite.scale.set(unit.kind === 'hero' ? 1.05 : 0.65 * spriteScale);
    lightSprite.alpha = unit.kind === 'hero' ? 0.3 : 0.16;
    lightSprite.blendMode = 'add';
    ctx.lightLayer.addChild(lightSprite);
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
    activeHalo,
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
export function setNodeAnim(
  node: UnitVisualNode,
  state: SpriteAnimState,
  fps?: number,
  loop = true,
): void {
  node.animState = state;
  node.animTime = 0;
  node.animLoop = loop;
  node.animFps = fps ?? (state === 'move' ? 11 : state === 'attack' ? 10 : state === 'hit' ? 9 : 6.5);
  applyNodeAnimFrame(node, 0);
}

/** 将指定索引的精雕像素动作帧应用至主体/辉光/受击闪白三层精灵 */
export function applyNodeAnimFrame(node: UnitVisualNode, frameIdx: number): void {
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

/**
 * 统一计算单个单位的图层深度优先级：
 * - 当前轮次行动单位：最高置顶（+12000），本体与血条绝不被骨龙、巨像或邻格单位翅膀遮挡
 * - 鼠标悬停单位：次高临时浮起（+6000），扎堆混战时悬停即可清晰看见全身与状态条
 * - 普通单位：按脚底 Y 深度自然透视排序
 */
export function applyNodeLayerPriority(
  node: UnitVisualNode,
  unit: BattleUnit,
  state: BattleState,
  hoveredUnitId: string | null,
): void {
  const baseZ = Math.round(node.baseY);
  const isActive = state.activeUnitId === unit.id && unit.status === 'alive' && state.phase === 'active';
  const isHovered = hoveredUnitId === unit.id && unit.status !== 'dead';
  const boost = isActive ? 12000 : isHovered ? 6000 : 0;
  node.container.zIndex = boost + baseZ;
  node.badgeContainer.zIndex = boost + baseZ;
}

/** 同步单个单位节点的坐标、精灵外观、幻象滤镜、脚环与一体化血蓝条 */
export function updateUnitVisualNode(
  node: UnitVisualNode,
  unit: BattleUnit,
  state: BattleState,
  ctx: UnitNodeRenderContext,
): void {
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
    applyNodeAnimFrame(node, 0);
  } else {
    const len = baked.animations[node.facing][node.animState].length;
    const curIdx = Math.floor(node.animTime * node.animFps) % Math.max(1, len);
    applyNodeAnimFrame(node, curIdx);
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
    node.bodySprite.filters = [ctx.illusionBodyBlurFilter];
    node.illusionGhostSprite.texture = node.bodySprite.texture;
    node.illusionGhostSprite.visible = true;
    node.illusionGhostSprite.tint = 0x4deeff;
    node.illusionGhostSprite.alpha = 0.3;
    node.illusionGhostSprite.filters = [ctx.illusionGhostBlurFilter];
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

  const footOffsetY = getBadgeFootOffsetY(node, unit.status === 'knocked_out');
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
  applyNodeLayerPriority(node, unit, state, ctx.getHoveredUnitId());
  if (node.lightSprite) {
    node.lightSprite.position.set(node.baseX, node.baseY - 12 * node.spriteScale);
  }
}

/** 逐帧驱动全角色骨骼像素动画、脚底旋转法阵光环、幻象漂移虚化与头顶剑菱指针 */
export function tickUnitVisualNodes(
  unitNodes: Map<string, UnitVisualNode>,
  activePointerArrow: PIXI.Graphics,
  currentState: BattleState | null,
  hoveredUnitId: string | null,
  globalTime: number,
  dt: number,
): void {
  for (const node of unitNodes.values()) {
    if (!node.container.visible) continue;
    const unit = currentState?.units[node.unitId];

    if (unit && unit.status === 'alive') {
      node.animTime += dt;
      const baked = getBakedVoxelSpriteSet(node.blueprintId);
      const frames = baked.animations[node.facing][node.animState];
      if (frames && frames.length > 0) {
        const rawIdx = Math.floor(node.animTime * node.animFps);
        const idx = node.animLoop ? rawIdx % frames.length : Math.min(frames.length - 1, rawIdx);
        applyNodeAnimFrame(node, idx);
      }
    }

    // 陆地单位双脚稳稳扎根大地（动作全由内部骨骼帧驱动），仅飞行单位保留优雅离地悬浮感！
    const hoverY = node.isFloating
      ? -5 + Math.sin(globalTime * 2.8 + node.bobPhase) * 1.4
      : 0;
    node.bodySprite.position.y = hoverY;
    node.glowSprite.position.y = hoverY;
    node.flashSprite.position.y = hoverY;

    const isActiveNode =
      currentState?.phase === 'active' &&
      currentState?.activeUnitId === node.unitId &&
      unit?.status === 'alive';
    const isHoveredNode =
      !isActiveNode &&
      hoveredUnitId === node.unitId &&
      Boolean(unit && unit.status !== 'dead');

    // 当前待行动单位脚底多层贴地灵纹光环（100% 保持角色本体像素锐利不发糊，专注脚底法阵与头顶指针聚焦）
    node.activeHalo.clear();
    if (isActiveNode) {
      const pulse = 0.5 + 0.5 * Math.sin(globalTime * 4.6);
      const rx = (node.isHero ? 16.5 : 13.5) * node.spriteScale;
      const ry = (node.isHero ? 8.8 : 7.2) * node.spriteScale;

      // 1. 脚底柔和暖金内辉底座 + 高对比双层贴地金环
      node.activeHalo.ellipse(0, 1, rx * 0.96, ry * 0.96).fill({ color: 0xffdf66, alpha: 0.16 + pulse * 0.1 });
      node.activeHalo
        .ellipse(0, 1, rx * 0.82, ry * 0.82)
        .stroke({ width: 1.0, color: 0xfff4bd, alpha: 0.45 + pulse * 0.3 });

      // 2. 向外扩散并平滑淡出的动态金色涟漪波纹环
      const ripple = (globalTime * 0.72) % 1;
      const ripRx = rx * (0.95 + ripple * 0.48);
      const ripRy = ry * (0.95 + ripple * 0.48);
      const ripAlpha = (1 - ripple) * 0.72;
      if (ripAlpha > 0.04) {
        node.activeHalo
          .ellipse(0, 1, ripRx, ripRy)
          .stroke({ width: 1.35 * (1 - ripple * 0.35), color: 0xffe885, alpha: ripAlpha });
      }

      // 3. 顺时针缓转的四段式贴地法阵金弧 + 四角旋转白金菱星
      const rot = globalTime * 1.45;
      const arcRx = rx + 2.2;
      const arcRy = ry + 1.3;
      for (let k = 0; k < 4; k++) {
        const baseAng = rot + (k * Math.PI) / 2;
        const arcSpan = 0.82;
        const steps = 6;
        for (let s = 0; s <= steps; s++) {
          const a = baseAng + (s / steps) * arcSpan;
          const px = Math.cos(a) * arcRx;
          const py = 1 + Math.sin(a) * arcRy;
          if (s === 0) node.activeHalo.moveTo(px, py);
          else node.activeHalo.lineTo(px, py);
        }
        node.activeHalo.stroke({ width: 1.6, color: 0xffef9e, alpha: 0.76 + pulse * 0.2 });

        // 弧段之间缀以精致白金菱芒星
        const starAng = baseAng - 0.35;
        const sx = Math.cos(starAng) * (arcRx + 0.8);
        const sy = 1 + Math.sin(starAng) * (arcRy + 0.5);
        node.activeHalo
          .poly([sx, sy - 2.3, sx + 2.3, sy, sx, sy + 2.3, sx - 2.3, sy], true)
          .fill({ color: 0xffffff, alpha: 0.92 });
      }
    } else if (isHoveredNode && unit) {
      const pulse = 0.5 + 0.5 * Math.sin(globalTime * 6.0);
      const rx = (node.isHero ? 14.5 : 11.5) * node.spriteScale;
      const ry = (node.isHero ? 7.8 : 6.2) * node.spriteScale;
      const activeSide = currentState?.activeUnitId
        ? currentState.units[currentState.activeUnitId]?.side
        : 'left';
      const isEnemyHover = activeSide && unit.side !== activeSide;
      const hCol = isEnemyHover ? 0xff7890 : 0x8ef2ff;
      node.activeHalo.ellipse(0, 1, rx, ry).fill({ color: hCol, alpha: 0.12 + pulse * 0.08 });
      node.activeHalo
        .ellipse(0, 1, rx + 2 + pulse * 1.6, ry + 1.1 + pulse * 0.9)
        .stroke({ width: 1.4, color: hCol, alpha: 0.72 + pulse * 0.25 });
    }

    // 幻象模型动态虚化演出：半透明呼吸闪烁 + 柔焦重影层相位漂移，一眼区分真身与镜像！
    if (node.isIllusion && unit?.status === 'alive') {
      const illusionPhase = globalTime * 3.6 + node.bobPhase;
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
      // 保持像素清晰原色，发光核心轻柔脉冲
      node.glowSprite.alpha = 0.58 + Math.sin(globalTime * 4 + node.bobPhase) * 0.22;
    }

    if (node.flashTimer > 0) {
      node.flashTimer -= dt;
      node.flashSprite.alpha = Math.min(1, node.flashTimer * 5);
    } else {
      node.flashSprite.alpha = 0;
    }

    const footOffsetY = getBadgeFootOffsetY(node, unit?.status === 'knocked_out');
    node.container.position.set(node.baseX + node.offsetX, node.baseY + node.offsetY);
    node.badgeContainer.position.set(node.baseX + node.offsetX, node.baseY + node.offsetY + footOffsetY);
  }

  // 更新当前行动单位头顶的上下弹跳和风漆金剑菱指针 ▼（精确锚定于真实头顶上方，附轻柔呼吸脉冲）
  const activeId = currentState?.activeUnitId;
  const activeNode = activeId ? unitNodes.get(activeId) : null;
  if (activeNode && activeNode.container.visible && currentState?.phase === 'active') {
    const bounce = Math.sin(globalTime * 6.0) * 3.2;
    const pulseScale = 1 + Math.sin(globalTime * 4.5) * 0.06;
    const headTopY = getSpriteHeadTopOffsetY(activeNode);
    activePointerArrow.visible = true;
    activePointerArrow.scale.set(pulseScale);
    activePointerArrow.position.set(
      activeNode.baseX + activeNode.offsetX,
      activeNode.baseY + activeNode.offsetY + headTopY - 12 + bounce,
    );
  } else {
    activePointerArrow.visible = false;
  }
}

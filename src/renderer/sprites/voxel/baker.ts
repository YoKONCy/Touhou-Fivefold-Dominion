/**
 * 像素骨骼立绘总表装配、多状态纹理烘焙与立绘/头像导出缓存层
 */

import { FACTION_RIG_SPECS } from '../../factionSprites';
import { HD_CHAOS_FACTION_RIG_SPECS } from '../../hdChaosFactionSprites';
import { HD_DEATH_FACTION_RIG_SPECS } from '../../hdDeathFactionSprites';
import { HD_HERO_REIMU_SPEC, HD_HERO_REMILIA_SPEC } from '../../hdHeroSprites';
import { HD_LIFE_FACTION_RIG_SPECS } from '../../hdLifeFactionSprites';
import { HD_MIGHT_FACTION_RIG_SPECS } from '../../hdMightFactionSprites';
import { HD_ORDER_FACTION_RIG_SPECS } from '../../hdOrderFactionSprites';
import { RIG_SPECS } from './coreBlueprints';
import {
  buildPoseSequence,
  canvasToNearestTexture,
  drawSubtlePixelFrameBackdrop,
  measureCanvasTopOpaqueY,
  renderRigFrameToCanvas,
} from './painter';
import {
  ORIGIN_X,
  ORIGIN_Y,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  type BakedVoxelSpriteSet,
  type SpriteAnimState,
  type SpriteFrameTextures,
  type SpriteRigSpec,
} from './types';

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
  ...HD_CHAOS_FACTION_RIG_SPECS,
  ...HD_MIGHT_FACTION_RIG_SPECS,
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

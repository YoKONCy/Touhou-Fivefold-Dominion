/**
 * 100% 纯代码零静态资源 · 高精度程序化暗夜幻想乡立绘与头像渲染引擎（聚合入口）
 * 具体绘制器已按角色分类拆分至 src/renderer/portraits/*
 */

import { paintFairy, paintKedama, paintRabbit } from './portraits/creaturesBasic';
import { paintGolem, paintGrimoire, paintHisoutensoku, paintSpirit } from './portraits/creaturesHeavy';
import { createHiResCanvas, type ProceduralPortraitSet } from './portraits/helpers';
import { paintMarisa, paintReimu } from './portraits/heroes';

export type { ProceduralPortraitSet };

const PORTRAIT_PAINTERS: Record<string, (ctx: CanvasRenderingContext2D, s: number) => void> = {
  hero_reimu: paintReimu,
  hero_marisa: paintMarisa,
  creature_kedama: paintKedama,
  creature_fairy: paintFairy,
  creature_rabbit: paintRabbit,
  creature_golem: paintGolem,
  creature_grimoire: paintGrimoire,
  creature_spirit: paintSpirit,
  creature_hisoutensoku: paintHisoutensoku,
};

/** 头像面部特写裁剪框（标准化 0..1 坐标，确保圆形小头像完美聚焦五官/核心，不切头也不显小！） */
const AVATAR_CROP_RECTS: Record<string, { x: number; y: number; size: number }> = {
  hero_reimu: { x: 0.14, y: 0.1, size: 0.72 },
  hero_marisa: { x: 0.12, y: 0.1, size: 0.76 },
  creature_kedama: { x: 0.06, y: 0.06, size: 0.88 },
  creature_fairy: { x: 0.14, y: 0.1, size: 0.72 },
  creature_rabbit: { x: 0.12, y: 0.08, size: 0.74 },
  creature_golem: { x: 0.12, y: 0.1, size: 0.76 },
  creature_grimoire: { x: 0.06, y: 0.08, size: 0.88 },
  creature_spirit: { x: 0.12, y: 0.08, size: 0.76 },
  creature_hisoutensoku: { x: 0.14, y: 0.06, size: 0.72 },
};

const portraitSetCache = new Map<string, ProceduralPortraitSet>();

/**
 * 获取（并缓存）指定角色/兵种的 100% 纯代码高清立绘与面部特写头像 DataURL
 */
export function getProceduralPortraitSet(blueprintId: string): ProceduralPortraitSet {
  const cached = portraitSetCache.get(blueprintId);
  if (cached) return cached;

  const painter = PORTRAIT_PAINTERS[blueprintId] ?? paintKedama;
  const fullSize = 256;
  const { canvas: fullCanvas, ctx: fullCtx } = createHiResCanvas(fullSize);
  painter(fullCtx, fullSize);

  // 柔和暗夜内暗角压边，使立绘融入暗金卷轴画框更显高级
  const vig = fullCtx.createRadialGradient(
    fullSize * 0.5,
    fullSize * 0.45,
    fullSize * 0.34,
    fullSize * 0.5,
    fullSize * 0.5,
    fullSize * 0.64,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(6, 8, 18, 0.42)');
  fullCtx.fillStyle = vig;
  fullCtx.fillRect(0, 0, fullSize, fullSize);

  const crop = AVATAR_CROP_RECTS[blueprintId] ?? { x: 0.1, y: 0.1, size: 0.8 };
  const avatarSize = 128;
  const { canvas: avCanvas, ctx: avCtx } = createHiResCanvas(avatarSize);
  avCtx.drawImage(
    fullCanvas,
    crop.x * fullSize,
    crop.y * fullSize,
    crop.size * fullSize,
    crop.size * fullSize,
    0,
    0,
    avatarSize,
    avatarSize,
  );

  const result: ProceduralPortraitSet = {
    portraitUrl: fullCanvas.toDataURL('image/png'),
    avatarUrl: avCanvas.toDataURL('image/png'),
  };
  portraitSetCache.set(blueprintId, result);
  return result;
}

export function getUnitPortraitUrl(blueprintId: string): string {
  return getProceduralPortraitSet(blueprintId).portraitUrl;
}

export function getUnitAvatarUrl(blueprintId: string): string {
  return getProceduralPortraitSet(blueprintId).avatarUrl;
}

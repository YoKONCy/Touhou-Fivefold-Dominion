/**
 * 《Touhou-H4》自研纯净像素特效模块库聚合转发入口（100% 兼容 pixelfx 双缓冲 Painter 接口）
 *
 * 具体实现已按特效类型拆分至 `src/renderer/vfx/custom/`：
 * - `weather.ts`：五大 640×360 全屏透明东方天象特效
 * - `arcaneAndStatus.ts`：七套纯净东方魔导与状态局域特效
 * - `helpers.ts`：共享调色板解析、包络函数与 `mix` 重导出
 */

export {
  fxTouhouAurora,
  fxTouhouCherryBlossoms,
  fxTouhouFog,
  fxTouhouGodRays,
  fxTouhouShootingStars,
} from './vfx/custom/weather';

export {
  fxTouhouElectrified,
  fxTouhouForceField,
  fxTouhouHologram,
  fxTouhouPoisoned,
  fxTouhouSoulRise,
  fxTouhouSparkArc,
  fxTouhouWarpIn,
} from './vfx/custom/arcaneAndStatus';

export { mix } from './vfx/custom/helpers';

/** 导出全部定制特效键位集合，便于单元测试校验 */
export const TOUHOU_CUSTOM_FX_IDS = [
  'god_rays',
  'cherry_blossoms',
  'aurora',
  'fog',
  'shooting_stars',
  'spark_arc',
  'hologram',
  'warp_in',
  'force_field',
  'soul_rise',
  'electrified',
  'status_poisoned',
] as const;

export const TOUHOU_WEATHER_FX_SET = new Set<string>([
  'god_rays',
  'cherry_blossoms',
  'aurora',
  'fog',
  'shooting_stars',
  'crimson_mist',
]);

/**
 * 东方幻想战记 H4 · 音效配方注册表聚合转发入口
 *
 * 各类音效配方已按职责拆分至 `src/audio/sfx/` 子目录，
 * 本文件仅作统一聚合导出，保持既有导入路径完全兼容。
 */

export type {
  AudioBusName,
  CombatSoundId,
  SoundId,
  SoundRecipe,
  SoundRenderParams,
  SpellSoundId,
  UiSoundId,
} from './sfx';
export { DEFAULT_SFX_CATALOG } from './sfx';

/**
 * 法术 VFX 编排共享类型定义
 */

import type { SoundId } from '@audio/index';
import type { PixelFxEffectId, TouhouPaletteKey } from '../../pixelfxBridge';

export type SpellTravelStyle =
  | 'none'
  | 'bolt'
  | 'ofuda_arc'
  | 'beam'
  | 'chain_arcs'
  | 'ring_burst'
  | 'meteor_rain'
  | 'teleport_rift'
  | 'drain_return'
  | 'screen_weather';

export interface SpellVfxChoreography {
  /** 施法者起手瞬间的阵法/蓄力特效 */
  casterFx?: PixelFxEffectId;
  casterPalette?: TouhouPaletteKey;
  /** 从施法者至目标的弹道/空间/天象演出方式 */
  travel?: SpellTravelStyle;
  /** 弹道或连线粒子主色（十六进制） */
  travelColor?: number;
  /** 目标点核心主特效（132 种程序化像素模块之一） */
  impactFx: PixelFxEffectId;
  impactPalette: TouhouPaletteKey;
  /** 可选第二层复合叠加特效（打造 4~5 阶与特色术式的惊艳双层演出） */
  secondaryFx?: PixelFxEffectId;
  secondaryPalette?: TouhouPaletteKey;
  /** 群体/连击/召唤时在每个受影响单位身上同步触发的独立粒子 */
  perTargetFx?: PixelFxEffectId;
  perTargetPalette?: TouhouPaletteKey;
  /** 战场中央展开的全屏大阵或天象（神降、末日、永夜、冥樱、红雾、极光等） */
  weatherFx?: PixelFxEffectId;
  weatherPalette?: TouhouPaletteKey;
  /** 匹配的空间音效 */
  sound: SoundId;
  /** 震屏强度 */
  shake: number;
  /** 命中顿帧（秒） */
  hitStop?: number;
  /** 播放速度倍率 */
  speedScale?: number;
  /** 双缓冲发光强度 */
  light?: number;
}

/**
 * 音效合成共享的频率与音阶换算辅助函数
 */

import type { SoundRenderParams } from './types';

/** 基准古筝缓冲烘焙基频为 C5 (523.25Hz)，按目标音高精确换算倍速 */
export const KOTO_BASE_HZ = 523.25;

/** 按当前音高微扰系数换算目标频率 */
export function f(hz: number, p: SoundRenderParams): number {
  return hz * p.pitchScale;
}

/** 根据目标音高与微扰系数计算古筝采样缓冲播放倍速 */
export function kotoRate(targetHz: number, p: SoundRenderParams): number {
  return (targetHz / KOTO_BASE_HZ) * p.pitchScale;
}

/**
 * 确定性伪随机数生成器（基于 Mulberry32 算法）
 * 所有战斗判定、AI 推演与录像回放统一使用此 RNG，确保完全可复现。
 */
export interface RngState {
  seed: number;
}

export function createRngState(seed: number): RngState {
  // 确保种子为无符号 32 位整数
  return { seed: seed >>> 0 };
}

/**
 * 推进一次状态并返回 [0, 1) 区间的浮点数
 */
export function nextRandom(state: RngState): number {
  state.seed = (state.seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(state.seed ^ (state.seed >>> 15), 1 | state.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * 返回闭区间 [min, max] 内的随机整数
 */
export function nextInt(state: RngState, min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.floor(nextRandom(state) * (max - min + 1));
}

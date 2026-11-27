/**
 * HoMM4 六边形战术 AI 类型定义、三档难度配置与五系阵营战术性格
 *
 * 设计原则：先以最高级「宗师 (master)」为完整蓝本，再通过显式能力开关与权重缩放
 * 降维衍生出「精锐 (standard)」与「寻常 (casual)」两档，确保三档共享同一套稳定内核。
 */

import type { Alignment } from '@core/alignment';
import type { CombatCommand } from '@core/types';

/** 三档 AI 难度：寻常（初级） / 精锐（进阶） / 宗师（最高级） */
export type AiDifficulty = 'casual' | 'standard' | 'master';

/** 战术 AI 调用参数 */
export interface TacticalAiOptions {
  /** AI 难度档位，默认采用最高级宗师档 */
  difficulty?: AiDifficulty;
}

/** 供 UI 展示的三档 AI 元数据 */
export interface AiDifficultyMeta {
  id: AiDifficulty;
  name: string;
  short: string;
  description: string;
}

export const AI_DIFFICULTY_META: Record<AiDifficulty, AiDifficultyMeta> = {
  casual: {
    id: 'casual',
    name: '寻常',
    short: '寻常',
    description: '新手友好：仅使用 1–2 阶基础术式，不刻意切后排与躲避威胁区，偶有战术破绽。',
  },
  standard: {
    id: 'standard',
    name: '精锐',
    short: '精锐',
    description: '常规博弈：善用 1–4 阶主力术式与集火脆皮，但不做复杂等待节奏与极限多格微操。',
  },
  master: {
    id: 'master',
    name: '宗师',
    short: '宗师',
    description: '全系统筹：精通 1–5 阶高阶神术、切射手/法师、控场保睡、多格吐息全扫与等待二连动规划。',
  },
};

/** 单档 AI 的具体能力开关与数值权重（由宗师档逐级降维） */
export interface AiDifficultyProfile {
  id: AiDifficulty;
  /** 允许主动施放的最高法术阶位（1~5） */
  maxSpellLevel: 2 | 4 | 5;
  /** 射手/法师/辅助/英雄等目标优先级权重系数（0 = 退化为纯按血量选目标） */
  rolePriorityWeight: number;
  /** 贴脸锁死敌方远程单位的额外战术奖励系数 */
  rangedPinWeight: number;
  /** 是否构建并利用敌方 1 回合威胁热力图进行站位避险 */
  enableThreatMap: boolean;
  /** 威胁热力图避险权重（1.0 为满额避险） */
  threatAvoidanceWeight: number;
  /** 是否启用高阶 WAIT 等待节奏（等英雄拍群 Buff / 等敌进圈防单骑白给） */
  enableTacticalWait: boolean;
  /** 是否启用高阶法术原型（硬控、幻象、招魂、驱散、瞬移、替身、空地搜优 AOE、连锁闪电模拟） */
  enableAdvancedSpells: boolean;
  /** 是否允许双步联动高阶法术（隙间瞬移空投 / 替身雏偶 / 彼岸献祭）与空地搜优 AOE */
  enableMasterSpellCombos: boolean;
  /** 是否枚举全部合法近战落脚格以最大化周身全扫 / 三翼裂袭 / 贯穿吐息收益 */
  enableAreaMeleeOptimization: boolean;
  /** 是否启用动态蓝量节奏预算（避免乱挥霍高蓝法术） */
  enableManaBudgeting: boolean;
  /** 阵营性格偏好生效系数（0 = 关闭差异，1 = 满额差异） */
  factionPersonalityWeight: number;
  /** 反击与反伤风险规避权重 */
  retaliationRiskWeight: number;
  /** 避免误打醒致盲 / 镇魂神乐敌军的克制权重 */
  ccWakePenaltyWeight: number;
  /** 确定性评分扰动幅度（模拟低档位失误，使用纯哈希不消耗战斗 RNG） */
  noiseRatio: number;
}

/** 三档难度能力矩阵（大师满配 -> 精锐适度收缩 -> 寻常大幅阉割） */
export const AI_DIFFICULTY_PROFILES: Record<AiDifficulty, AiDifficultyProfile> = {
  master: {
    id: 'master',
    maxSpellLevel: 5,
    rolePriorityWeight: 1.0,
    rangedPinWeight: 1.0,
    enableThreatMap: true,
    threatAvoidanceWeight: 1.0,
    enableTacticalWait: true,
    enableAdvancedSpells: true,
    enableMasterSpellCombos: true,
    enableAreaMeleeOptimization: true,
    enableManaBudgeting: true,
    factionPersonalityWeight: 1.0,
    retaliationRiskWeight: 1.0,
    ccWakePenaltyWeight: 1.0,
    noiseRatio: 0,
  },
  standard: {
    id: 'standard',
    maxSpellLevel: 4,
    rolePriorityWeight: 0.65,
    rangedPinWeight: 0.55,
    enableThreatMap: true,
    threatAvoidanceWeight: 0.5,
    enableTacticalWait: false,
    enableAdvancedSpells: true,
    enableMasterSpellCombos: false,
    enableAreaMeleeOptimization: false,
    enableManaBudgeting: true,
    factionPersonalityWeight: 0.6,
    retaliationRiskWeight: 0.78,
    ccWakePenaltyWeight: 0.6,
    noiseRatio: 0.08,
  },
  casual: {
    id: 'casual',
    maxSpellLevel: 2,
    rolePriorityWeight: 0,
    rangedPinWeight: 0,
    enableThreatMap: false,
    threatAvoidanceWeight: 0,
    enableTacticalWait: false,
    enableAdvancedSpells: false,
    enableMasterSpellCombos: false,
    enableAreaMeleeOptimization: false,
    enableManaBudgeting: false,
    factionPersonalityWeight: 0,
    retaliationRiskWeight: 0.45,
    ccWakePenaltyWeight: 0.15,
    noiseRatio: 0.22,
  },
};

/** 阵营战术性格配置（赋予生命/秩序/混沌/死亡/自然截然不同的打法气质） */
export interface FactionPersonality {
  id: Alignment;
  /** 群体/单体增益与护盾偏好 */
  buffBias: number;
  /** 治疗、复活与驱魔保人偏好 */
  healCleanseBias: number;
  /** 直接伤害、连锁与范围轰击偏好 */
  nukeBias: number;
  /** 硬控（致盲/催眠/狂暴/遗忘/镇魂）与幻象偏好 */
  controlIllusionBias: number;
  /** 削弱、诅咒、瘴疫与招魂滚雪球偏好 */
  debuffNecroBias: number;
  /** 召唤助战偏好 */
  summonBias: number;
  /** 主动突脸压迫与切后排激进度（>1 偏激进，<1 偏阵地拉扯） */
  aggression: number;
  /** 防守阵型与避险保守度 */
  caution: number;
}

export const FACTION_PERSONALITIES: Record<Alignment, FactionPersonality> = {
  life: {
    id: 'life',
    buffBias: 1.24,
    healCleanseBias: 1.28,
    nukeBias: 0.92,
    controlIllusionBias: 1.0,
    debuffNecroBias: 0.9,
    summonBias: 1.0,
    aggression: 0.95,
    caution: 1.15,
  },
  order: {
    id: 'order',
    buffBias: 1.12,
    healCleanseBias: 1.05,
    nukeBias: 1.02,
    controlIllusionBias: 1.32,
    debuffNecroBias: 1.08,
    summonBias: 1.05,
    aggression: 0.92,
    caution: 1.18,
  },
  chaos: {
    id: 'chaos',
    buffBias: 1.14,
    healCleanseBias: 0.9,
    nukeBias: 1.28,
    controlIllusionBias: 1.06,
    debuffNecroBias: 1.0,
    summonBias: 1.0,
    aggression: 1.22,
    caution: 0.85,
  },
  death: {
    id: 'death',
    buffBias: 1.08,
    healCleanseBias: 1.0,
    nukeBias: 1.08,
    controlIllusionBias: 1.05,
    debuffNecroBias: 1.3,
    summonBias: 1.12,
    aggression: 1.14,
    caution: 0.92,
  },
  nature: {
    id: 'nature',
    buffBias: 1.18,
    healCleanseBias: 1.08,
    nukeBias: 1.0,
    controlIllusionBias: 1.04,
    debuffNecroBias: 0.95,
    summonBias: 1.32,
    aggression: 1.04,
    caution: 1.0,
  },
  might: {
    id: 'might',
    buffBias: 1.05,
    healCleanseBias: 1.0,
    nukeBias: 1.0,
    controlIllusionBias: 1.0,
    debuffNecroBias: 1.0,
    summonBias: 1.0,
    aggression: 1.15,
    caution: 0.95,
  },
};

/** 带有统一效用评分的候选战术指令 */
export interface ScoredAiCommand {
  command: CombatCommand;
  score: number;
  tag: string;
}

/** 混合难度系数后的有效阵营性格权重 */
export function blendPersonalityFactor(rawFactor: number, weight: number): number {
  return 1 + (rawFactor - 1) * weight;
}

/**
 * 纯确定性伪随机抖动系数（基于回合数、指令序号与候选键哈希）
 * 绝不消耗 state.rng，确保相同局面对同一难度 100% 可复现且不污染战斗掷骰。
 */
export function deterministicScoreJitter(
  seedSalt: number,
  key: string,
  noiseRatio: number,
): number {
  if (noiseRatio <= 0) return 1;
  let hash = (seedSalt ^ 0x9e3779b9) >>> 0;
  for (let i = 0; i < key.length; i++) {
    hash = Math.imul(hash ^ key.charCodeAt(i), 0x85ebca6b) >>> 0;
    hash = ((hash << 13) | (hash >>> 19)) >>> 0;
  }
  const norm = (hash % 10001) / 10000; // [0, 1]
  return 1 + (norm * 2 - 1) * noiseRatio;
}

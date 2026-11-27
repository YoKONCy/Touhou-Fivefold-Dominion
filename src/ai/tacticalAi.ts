/**
 * HoMM4 六边形战术 AI 总调度入口（纯逻辑，零视图依赖，单步耗时 < 15ms）
 *
 * 子系统职责拆分：
 * - `types.ts`：三档难度能力矩阵（寻常 / 精锐 / 宗师）与五系阵营战术性格
 * - `threatMap.ts`：角色威胁画像、英雄战斗/魔法前顶判据与 1 回合危险热力图
 * - `spellEvaluator.ts`：全 150 法术统一效用评估、腰带秘药与专属符卡决策
 * - `combatEvaluator.ts`：切射手/法师优先级、贴脸锁远程、多格全扫/吐息与控场保睡
 * - `planning.ts`：高阶 WAIT 节奏规划、后排安全走位、高台拉扯与卡位 DEFEND
 */

import { isEngagedInMelee, type CombatContentCatalog } from '@core/combatEngine';
import type { BattleState, CombatCommand } from '@core/types';
import { evaluateBestAttackAction } from './combatEvaluator';
import { evaluateBestMoveOrDefend, evaluateTacticalWait } from './planning';
import {
  evaluateBestSpellAction,
  evaluateHeroPotionCommand,
  evaluateSpellCardAction,
} from './spellEvaluator';
import { buildBattlefieldIntel } from './threatMap';
import {
  AI_DIFFICULTY_PROFILES,
  type ScoredAiCommand,
  type TacticalAiOptions,
} from './types';

export { isFrontlineCombatHero } from './threatMap';
export {
  AI_DIFFICULTY_META,
  AI_DIFFICULTY_PROFILES,
  FACTION_PERSONALITIES,
  type AiDifficulty,
  type AiDifficultyMeta,
  type AiDifficultyProfile,
  type FactionPersonality,
  type TacticalAiOptions,
} from './types';

/**
 * 为当前活跃单位计算最优战术指令（默认采用最高级宗师档，兼容全部既有调用方）
 */
export function chooseTacticalAiCommand(
  state: BattleState,
  catalog: CombatContentCatalog,
  options?: TacticalAiOptions,
): CombatCommand | null {
  if (state.phase !== 'active' || !state.activeUnitId) return null;
  const unit = state.units[state.activeUnitId];
  if (!unit || unit.status !== 'alive') return null;

  const profile = AI_DIFFICULTY_PROFILES[options?.difficulty ?? 'master'];
  const intel = buildBattlefieldIntel(state, unit, catalog, profile);
  if (intel.enemies.length === 0) return null;

  // 1. 英雄腰带秘药免费动作（不消耗本回合行动权，每名英雄每回合限用 1 次）
  const potionCmd = evaluateHeroPotionCommand(state, unit, intel, catalog);
  if (potionCmd) {
    return potionCmd;
  }

  // 2. 在同一把效用标尺上横评：专属符卡 / 全 150 战斗法术 / 直接攻击 / 战术等待
  const spellCardAction = evaluateSpellCardAction(state, unit, intel, catalog);
  const spellAction = evaluateBestSpellAction(state, unit, intel, catalog);
  const attackAction = evaluateBestAttackAction(state, unit, intel, catalog);
  const waitAction = evaluateTacticalWait(
    state,
    unit,
    intel,
    spellAction,
    attackAction,
    spellCardAction,
  );

  const candidates: ScoredAiCommand[] = [];
  if (spellCardAction) candidates.push(spellCardAction);
  if (spellAction) candidates.push(spellAction);
  // 攻击只有在净收益不是灾难性送头时才进入直选池（残局已贴身僵持的近战兵种主动搏命，避免无限对峙）
  const attackFloor = unit.kind === 'creature' && isEngagedInMelee(state, unit) && state.round >= 8 ? -95 : -20;
  if (attackAction && attackAction.score > attackFloor) candidates.push(attackAction);
  if (waitAction) candidates.push(waitAction);

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].command;
  }

  // 3. 当前无高价值出手时，执行智能走位（后排保命高台 / 射手拉扯 / 突击切后排）或卡位防御
  return evaluateBestMoveOrDefend(state, unit, intel, catalog);
}

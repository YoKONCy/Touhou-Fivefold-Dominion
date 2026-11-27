/**
 * 士气/幸运概率计算、三层士气出手队列排序、胜负判定与回合消耗子模块
 */

import { isImmuneToMorale } from '../creatureTypes';
import { computeUnitStats } from '../modifiers';
import { nextRandom } from '../rng';
import type { BattleState, BattleUnit, CombatEvent } from '../types';
import type { CombatContentCatalog, MoraleLuckRates } from './types';

/**
 * 统一核算士气（-10~+10）与幸运（-10~+10）的实时触发概率（引擎结算与 UI 提示单一事实来源）
 */
export function computeMoraleLuckRates(
  morale: number,
  luck: number,
  balancePreset: BattleState['balancePreset'] = 'equilibris_tuned',
  isMechanical = false,
): MoraleLuckRates {
  const isClassic = balancePreset === 'classic_h4';
  const clampedMorale = Math.max(-10, Math.min(10, Math.round(morale)));
  const clampedLuck = Math.max(-10, Math.min(10, Math.round(luck)));

  // 机械/器灵/亡灵免疫士气波动（固定处于平稳梯队）
  const goodMoraleChance =
    isMechanical || clampedMorale <= 0 ? 0 : Math.min(1, clampedMorale * 0.1);
  const badMoraleChance =
    isMechanical || clampedMorale >= 0 ? 0 : Math.min(1, -clampedMorale * 0.1);

  // 双向幸运概率封顶：equilibris_tuned 进攻上限 35% / 护身上限 30%；classic_h4 进攻上限 40% / 护身上限 35%
  const attackLuckChance =
    clampedLuck > 0 ? Math.min(isClassic ? 0.4 : 0.35, clampedLuck * (isClassic ? 0.04 : 0.035)) : 0;
  const attackBadLuckChance =
    clampedLuck < 0 ? Math.min(isClassic ? 0.35 : 0.3, -clampedLuck * (isClassic ? 0.035 : 0.03)) : 0;
  const defenseLuckChance =
    clampedLuck > 0 ? Math.min(isClassic ? 0.35 : 0.3, clampedLuck * (isClassic ? 0.035 : 0.03)) : 0;
  const defenseBadLuckChance =
    clampedLuck < 0 ? Math.min(isClassic ? 0.3 : 0.25, -clampedLuck * (isClassic ? 0.03 : 0.025)) : 0;

  return {
    goodMoraleChance,
    badMoraleChance,
    attackLuckChance,
    attackBadLuckChance,
    defenseLuckChance,
    defenseBadLuckChance,
  };
}

/** 为单个单位执行本回合的正统 HoMM4 士气检定 */
export function rollUnitRoundMorale(
  state: BattleState,
  unit: BattleUnit,
  catalog: CombatContentCatalog,
): { state: 'good' | 'neutral' | 'bad'; morale: number } {
  if (isImmuneToMorale(unit)) {
    return { state: 'neutral', morale: 0 };
  }
  const stats = computeUnitStats(unit, state, catalog);
  const rates = computeMoraleLuckRates(stats.morale, stats.luck, state.balancePreset, false);
  if (rates.goodMoraleChance > 0) {
    return {
      state: nextRandom(state.rng) < rates.goodMoraleChance ? 'good' : 'neutral',
      morale: stats.morale,
    };
  }
  if (rates.badMoraleChance > 0) {
    return {
      state: nextRandom(state.rng) < rates.badMoraleChance ? 'bad' : 'neutral',
      morale: stats.morale,
    };
  }
  return { state: 'neutral', morale: stats.morale };
}

/** 按正统 HoMM4 三层士气梯队（高士气先手梯队 → 普通梯队 → 低士气末位梯队）+ 有效主动性排序 */
export function sortUnitIdsByTurnPriority(
  unitIds: string[],
  state: BattleState,
  catalog: CombatContentCatalog,
): string[] {
  const tierOf = (u: BattleUnit): number =>
    u.roundMoraleState === 'good' ? 2 : u.roundMoraleState === 'bad' ? 0 : 1;

  return [...unitIds].sort((idA, idB) => {
    const a = state.units[idA];
    const b = state.units[idB];
    if (!a || !b) return idA.localeCompare(idB);
    const tierDiff = tierOf(b) - tierOf(a);
    if (tierDiff !== 0) return tierDiff;
    const sa = computeUnitStats(a, state, catalog);
    const sb = computeUnitStats(b, state, catalog);
    const scoreA = sa.initiative * 10 + sa.morale * 2 + (a.kind === 'hero' ? 1 : 0);
    const scoreB = sb.initiative * 10 + sb.morale * 2 + (b.kind === 'hero' ? 1 : 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.id.localeCompare(b.id);
  });
}

/** 构建本回合的行动顺序（可选在回合初统一结算全军士气检定） */
export function buildRoundTurnQueue(
  state: BattleState,
  catalog: CombatContentCatalog,
  events?: CombatEvent[],
  rollMorale = false,
): string[] {
  const alive = Object.values(state.units).filter((u) => u.status === 'alive');
  if (rollMorale) {
    const orderedForRoll = [...alive].sort((a, b) => a.id.localeCompare(b.id));
    for (const u of orderedForRoll) {
      const rolled = rollUnitRoundMorale(state, u, catalog);
      u.roundMoraleState = rolled.state;
      if (rolled.state === 'good') {
        events?.push({ type: 'MORALE_TRIGGERED', unitId: u.id, kind: 'good', morale: rolled.morale });
        state.actionLog.push(
          `🦅 ${u.name} 士气高涨（士气 +${rolled.morale}）：本回合抢占先手梯队且伤害 +25%！`,
        );
      } else if (rolled.state === 'bad') {
        events?.push({ type: 'MORALE_TRIGGERED', unitId: u.id, kind: 'bad', morale: rolled.morale });
        state.actionLog.push(
          `💔 ${u.name} 士气低落（士气 ${rolled.morale}）：本回合落入末位梯队且伤害 -20%！`,
        );
      }
    }
  }
  return sortUnitIdsByTurnPriority(
    alive.map((u) => u.id),
    state,
    catalog,
  );
}

/** 回合中因法术/驱散改变了目标有效士气时，立即重检受影响单位的本回合士气态并重排剩余队列 */
export function syncMidRoundMorale(
  state: BattleState,
  affectedUnitIds: string[],
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): void {
  let anyChanged = false;
  const uniqueIds = Array.from(new Set(affectedUnitIds));
  for (const uid of uniqueIds) {
    const u = state.units[uid];
    if (!u || u.status !== 'alive') continue;
    const prev = u.roundMoraleState ?? 'neutral';
    const rolled = rollUnitRoundMorale(state, u, catalog);
    if (rolled.state !== prev) {
      u.roundMoraleState = rolled.state;
      anyChanged = true;
      if (rolled.state === 'good') {
        events.push({ type: 'MORALE_TRIGGERED', unitId: u.id, kind: 'good', morale: rolled.morale });
        state.actionLog.push(
          `🦅 ${u.name} 士气振奋（士气 +${rolled.morale}）：本回合立即跃升先手梯队且伤害 +25%！`,
        );
      } else if (rolled.state === 'bad') {
        events.push({ type: 'MORALE_TRIGGERED', unitId: u.id, kind: 'bad', morale: rolled.morale });
        state.actionLog.push(
          `💔 ${u.name} 士气受挫（士气 ${rolled.morale}）：本回合滑落末位梯队且伤害 -20%！`,
        );
      }
    }
  }
  if (anyChanged && state.turnQueue.length > 1) {
    const pending = state.turnQueue.filter((id) => id !== state.activeUnitId);
    const reordered = sortUnitIdsByTurnPriority(pending, state, catalog);
    state.turnQueue =
      state.activeUnitId && state.turnQueue.includes(state.activeUnitId)
        ? [state.activeUnitId, ...reordered]
        : reordered;
  }
}

/** 将当前活跃单位标记为已行动并从队列中移除 */
export function consumeActiveUnitTurn(state: BattleState, unit: BattleUnit): void {
  unit.hasActedThisRound = true;
  state.turnQueue = state.turnQueue.filter((id) => id !== unit.id);
  state.waitQueue = state.waitQueue.filter((id) => id !== unit.id);
}

/** 检查战斗是否已分出胜负 */
export function checkVictory(state: BattleState, events: CombatEvent[]): boolean {
  const leftAlive = Object.values(state.units).some((u) => u.side === 'left' && u.status === 'alive');
  const rightAlive = Object.values(state.units).some((u) => u.side === 'right' && u.status === 'alive');

  if (!leftAlive || !rightAlive) {
    state.phase = 'finished';
    state.winner = leftAlive ? 'left' : 'right';
    state.activeUnitId = null;
    events.push({ type: 'BATTLE_ENDED', winner: state.winner });
    state.actionLog.push(
      state.winner === 'left'
        ? '★ 博丽神社阵营大获全胜！异变退治完成！'
        : '★ 雾雨魔导阵营大获全胜！火力就是正义！',
    );
    return true;
  }
  return false;
}

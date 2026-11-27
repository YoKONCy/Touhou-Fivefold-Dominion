/**
 * 《Touhou-H4》测试套件通用辅助工具
 * 提供地图清障、平地化、快捷施法及 AI 对局推演等无副作用测试样板辅助函数。
 */

import { expect } from 'vitest';
import { chooseTacticalAiCommand } from '@ai/tacticalAi';
import { dispatchCombatCommand } from '@core/combatEngine';
import { hexKey, offsetToAxial, type HexTile } from '@core/hex';
import type { BattleState, BattleUnit, CombatCommand } from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';

/** 将地图全部地块重置为平坦无阻挡地形（可按需指定统一高程） */
export function flattenAllMapTiles(tiles: Record<string, HexTile>, elevation?: number): void {
  for (const tile of Object.values(tiles)) {
    tile.terrain = 'plain';
    if (elevation !== undefined) {
      tile.elevation = elevation;
    }
    tile.blocksGround = false;
    tile.losObstruction = 'none';
    tile.moveCost = 1;
  }
}

/** 仅清理地图中的高耸障碍（可选一并清除半遮挡格或统一全图高程，默认保留高台） */
export function clearMapObstacles(
  tiles: Record<string, HexTile>,
  options: { includePartialLos?: boolean; flattenAllElevation?: number; resetMoveCost?: boolean } = {},
): void {
  const { includePartialLos = false, flattenAllElevation, resetMoveCost = false } = options;
  for (const tile of Object.values(tiles)) {
    if (flattenAllElevation !== undefined) {
      tile.elevation = flattenAllElevation;
    }
    const isBlocking =
      tile.terrain === 'rock' ||
      tile.terrain === 'wall' ||
      (includePartialLos && tile.losObstruction !== 'none');
    if (isBlocking) {
      tile.terrain = 'plain';
      if (flattenAllElevation === undefined) {
        tile.elevation = 1;
      }
      tile.blocksGround = false;
      tile.losObstruction = 'none';
      if (resetMoveCost) {
        tile.moveCost = 1;
      }
    }
  }
}

/** 将地图中指定行连续列区间清理为平地走廊 */
export function clearRowToPlain(
  tiles: Record<string, HexTile>,
  row: number,
  colStart: number,
  colEnd: number,
  elevation = 1,
): void {
  for (let col = colStart; col <= colEnd; col += 1) {
    const tile = tiles[hexKey(offsetToAxial(col, row))];
    if (tile) {
      tile.terrain = 'plain';
      tile.elevation = elevation;
      tile.losObstruction = 'none';
      tile.blocksGround = false;
    }
  }
}

/** 快捷驱动指定单位准备回合、补足法力并施放指定法术 */
export function castSpellAsUnit(
  state: BattleState,
  caster: BattleUnit,
  cmd: Omit<Extract<CombatCommand, { type: 'CAST_SPELL' }>, 'type' | 'unitId'>,
  options: { mana?: number; ensureKnown?: boolean } = {},
) {
  const { mana = 200, ensureKnown = false } = options;
  state.activeUnitId = caster.id;
  caster.mana = mana;
  caster.hasActedThisRound = false;
  if (ensureKnown && !caster.knownSpellIds.includes(cmd.spellId)) {
    caster.knownSpellIds.push(cmd.spellId);
  }
  return dispatchCombatCommand(state, { type: 'CAST_SPELL', unitId: caster.id, ...cmd }, TOUHOU_CATALOG);
}

/** 驱动双 AI 对局直至分出胜负或达到步数上限，并校验每一步指令均合法执行 */
export function runAiBattleToFinish(state: BattleState, maxSteps: number): number {
  let steps = 0;
  while (state.phase === 'active' && steps < maxSteps) {
    const cmd = chooseTacticalAiCommand(state, TOUHOU_CATALOG);
    expect(cmd).not.toBeNull();
    const res = dispatchCombatCommand(state, cmd!, TOUHOU_CATALOG);
    expect(res.ok).toBe(true);
    steps += 1;
  }
  return steps;
}

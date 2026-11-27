/**
 * 战场六边形空间查询、多格占位、贴身交战判定与移动/近战贴脸寻位子模块
 */

import { isSpecialNonLivingUnit } from '../creatureTypes';
import {
  computeReachableHexes,
  getFootprintHexes,
  hexEquals,
  hexKey,
  minHexSetDistance,
  type HexCoord,
  type HexTile,
} from '../hex';
import { computeUnitStats } from '../modifiers';
import { validateCorpseSpellTarget } from '../spells/helpers';
import { hasIgnoreTerrainPenaltyTrait } from '../traits';
import { getUnitMovementDomain, type BattleState, type BattleUnit, type SpellDef } from '../types';
import type { CombatContentCatalog } from './types';

const tileMapCache = new WeakMap<Record<string, HexTile>, { size: number; map: Map<string, HexTile> }>();

export function buildTileMap(state: BattleState): Map<string, HexTile> {
  const keys = Object.keys(state.tiles);
  const cached = tileMapCache.get(state.tiles);
  if (cached && cached.size === keys.length) {
    return cached.map;
  }
  const map = new Map<string, HexTile>();
  for (const k of keys) {
    map.set(k, state.tiles[k]);
  }
  tileMapCache.set(state.tiles, { size: keys.length, map });
  return map;
}

/** 获取单个单位当前占据的全部六边形坐标 */
export function getUnitOccupiedHexes(unit: BattleUnit): HexCoord[] {
  return getFootprintHexes(unit.pos, unit.footprint);
}

/** 计算两支单位所有占据格之间的最小六边形距离 */
export function getUnitMinDistance(a: BattleUnit, b: BattleUnit): number {
  return minHexSetDistance(getUnitOccupiedHexes(a), getUnitOccupiedHexes(b));
}

/** 根据指定六边形格反查站在该格上的单位（优先返回存活单位，仅在允许时返回倒地英雄） */
export function findUnitAtHex(
  state: BattleState,
  hex: HexCoord,
  includeKnockedOut = false,
): BattleUnit | null {
  let knockedOutFallback: BattleUnit | null = null;
  for (const unit of Object.values(state.units)) {
    if (unit.status === 'dead') continue;
    const occupied = getUnitOccupiedHexes(unit);
    if (!occupied.some((h) => hexEquals(h, hex))) continue;
    if (unit.status === 'alive') {
      return unit;
    }
    if (includeKnockedOut && !knockedOutFallback) {
      knockedOutFallback = unit;
    }
  }
  return knockedOutFallback;
}

/** 反查站在目标六边形上可用于招魂/操纵死尸的兵种单位（优先返回对当前法术合法的残骸，可选回退无效残骸供 UI 精准提示原因） */
export function findCorpseTargetAtHex(
  state: BattleState,
  hex: HexCoord,
  catalog?: CombatContentCatalog,
  opts?: {
    spell?: SpellDef;
    caster?: BattleUnit;
    includeInvalidFallback?: boolean;
  },
): BattleUnit | null {
  let validAlive: BattleUnit | null = null;
  let validDead: BattleUnit | null = null;
  let invalidFallback: BattleUnit | null = null;

  for (const unit of Object.values(state.units)) {
    if (unit.kind !== 'creature') continue;
    const occupied = getUnitOccupiedHexes(unit);
    if (!occupied.some((h) => hexEquals(h, hex))) continue;

    const lostModels = unit.status === 'dead' ? unit.maxCount : Math.max(0, unit.maxCount - unit.count);

    // 传入施法者与法术定义时，统一按 validateCorpseSpellTarget 校验（区分纯招魂与友方反魂起尸）
    if (opts?.spell && opts?.caster && catalog) {
      if (validateCorpseSpellTarget(opts.spell, opts.caster, unit, state, catalog).ok) {
        if (unit.status === 'alive' && unit.count < unit.maxCount) {
          validAlive ??= unit;
        } else if (unit.status === 'dead') {
          validDead ??= unit;
        }
      } else if (
        opts.includeInvalidFallback &&
        !invalidFallback &&
        (lostModels > 0 || Boolean(unit.statusEffects?.disintegrated))
      ) {
        invalidFallback = unit;
      }
      continue;
    }

    // 缺省模式仅匹配可供纯招魂提取的活体残骸（严禁机械、亡灵、元素、幻象）
    if (unit.statusEffects?.disintegrated) continue;
    if (isSpecialNonLivingUnit(unit)) continue;
    if (lostModels <= 0) continue;
    const maxHp = catalog
      ? Math.max(1, computeUnitStats(unit, state, catalog).maxHp)
      : Math.max(1, unit.baseStats.maxHp);
    const remainingCorpseHp = lostModels * maxHp - (unit.statusEffects?.consumedCorpseHp ?? 0);
    if (remainingCorpseHp <= 0) continue;
    if (unit.status === 'alive' && unit.count < unit.maxCount) {
      return unit;
    }
    if (unit.status === 'dead' && !validDead) {
      validDead = unit;
    }
  }

  return validAlive ?? validDead ?? (opts?.includeInvalidFallback ? invalidFallback : null);
}

export function getOccupiedHexKeys(state: BattleState, excludeUnitId?: string): Set<string> {
  const set = new Set<string>();
  for (const unit of Object.values(state.units)) {
    if (unit.status !== 'alive') continue;
    if (unit.id === excludeUnitId) continue;
    for (const h of getUnitOccupiedHexes(unit)) {
      set.add(hexKey(h));
    }
  }
  return set;
}

/** 判断单位是否处于敌军近战贴身压制状态（任意占据格与敌军占据格相邻） */
export function isEngagedInMelee(state: BattleState, unit: BattleUnit): boolean {
  const myHexes = getUnitOccupiedHexes(unit);
  for (const other of Object.values(state.units)) {
    if (other.status !== 'alive' || other.side === unit.side) continue;
    if (minHexSetDistance(myHexes, getUnitOccupiedHexes(other)) <= 1) return true;
  }
  return false;
}

/** 计算单位在当前状态下的全部可移动六边形（严格校验多格碰撞体积） */
export function getUnitReachableMap(
  state: BattleState,
  unit: BattleUnit,
  catalog: CombatContentCatalog,
) {
  const stats = computeUnitStats(unit, state, catalog);
  const tiles = buildTileMap(state);
  const occupied = getOccupiedHexKeys(state, unit.id);
  const domain = getUnitMovementDomain(unit);
  const allyPathfindingWalk = Object.values(state.units).some(
    (u) => u.side === unit.side && u.status === 'alive' && u.kind === 'hero' && (u.subSkills?.pathfinding ?? 0) >= 4,
  );
  const ignoreTerrain =
    hasIgnoreTerrainPenaltyTrait(unit) || Boolean(unit.statusEffects?.terrainWalk) || allyPathfindingWalk;

  // H4 自然法术「流沙陷阱 (Quicksand)」：非飞行且无地形通行的陆地单位踩入流沙格立即耗尽剩余移动力停步
  const qsKeys = state.battleSpellFlags?.quicksandHexKeys ?? [];
  let effectiveTiles = tiles;
  if (qsKeys.length > 0 && domain === 'ground' && !ignoreTerrain) {
    effectiveTiles = new Map(tiles);
    const stopCost = Math.max(1, stats.speed);
    for (const k of qsKeys) {
      const t = effectiveTiles.get(k);
      if (t) {
        effectiveTiles.set(k, { ...t, moveCost: Math.max(t.moveCost, stopCost) });
      }
    }
  }

  return computeReachableHexes(
    unit.pos,
    stats.speed,
    effectiveTiles,
    occupied,
    domain,
    ignoreTerrain,
    unit.footprint,
  );
}

/** 获取攻击者近战攻击目标时的全部合法可达落脚锚点（原生支持 1x1~2x2 多格体积与 H4 长武器隔格攻击） */
export function getValidMeleeApproachAnchors(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  catalog: CombatContentCatalog,
): HexCoord[] {
  const reachable = getUnitReachableMap(state, attacker, catalog);
  const defHexes = getUnitOccupiedHexes(defender);
  const maxReach = attacker.abilities.longWeapon ? 2 : 1;
  const result: HexCoord[] = [];

  for (const key of reachable.costs.keys()) {
    const tile = state.tiles[key];
    if (!tile) continue;
    const anchor: HexCoord = { q: tile.q, r: tile.r };
    const candidateHexes = getFootprintHexes(anchor, attacker.footprint);
    const dist = minHexSetDistance(candidateHexes, defHexes);
    if (dist >= 1 && dist <= maxReach) {
      result.push(anchor);
    }
  }
  return result;
}

/** 寻找攻击者近战攻击目标时战术最优的可落脚锚格（长武器单位优先停在隔 1 格免反击位） */
export function findBestMeleeApproachHex(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  catalog: CombatContentCatalog,
  preferredHex?: HexCoord,
): HexCoord | null {
  const candidates = getValidMeleeApproachAnchors(state, attacker, defender, catalog);
  if (candidates.length === 0) return null;

  if (preferredHex) {
    const matched = candidates.find((c) => hexEquals(c, preferredHex));
    if (matched) return matched;
  }

  // 若攻击者已在合法近战位且未指定改换方位，优先原地直接出手
  const stayHere = candidates.find((c) => hexEquals(c, attacker.pos));
  if (stayHere && (!preferredHex || hexEquals(preferredHex, attacker.pos))) {
    return stayHere;
  }

  const reachable = getUnitReachableMap(state, attacker, catalog);
  const defHexes = getUnitOccupiedHexes(defender);
  const preferSafePoke = Boolean(attacker.abilities.longWeapon) && !defender.abilities.longWeapon;

  let best: HexCoord | null = null;
  let bestScore = Infinity;
  for (const cand of candidates) {
    const k = hexKey(cand);
    const cost = reachable.costs.get(k) ?? 99;
    const candHexes = getFootprintHexes(cand, attacker.footprint);
    const elev = Math.max(...candHexes.map((h) => state.tiles[hexKey(h)]?.elevation ?? 1));
    const distToDef = minHexSetDistance(candHexes, defHexes);
    const safePokeBonus = preferSafePoke && distToDef === 2 ? 45 : 0;
    const score = cost * 10 - elev * 4 - safePokeBonus;
    if (score < bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  return best;
}

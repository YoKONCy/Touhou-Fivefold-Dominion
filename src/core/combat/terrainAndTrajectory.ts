/**
 * 地形战术情报、视线阻挡诊断、远程四阶衰减评估、弹道预览与前卫替伤远程反击判定子模块
 */

import {
  evaluateLineOfSight,
  hexDistance,
  hexEquals,
  hexKey,
  hexLine,
  minHexSetDistance,
  type HexCoord,
  type HexTile,
  type LineOfSightResult,
} from '../hex';
import { computeUnitStats } from '../modifiers';
import type {
  BattleState,
  BattleUnit,
  ProjectileTrajectoryPreview,
  RangedPenaltyTier,
  SideId,
  SpellDef,
  TrajectoryBlockerDetail,
} from '../types';
import {
  buildTileMap,
  findUnitAtHex,
  getOccupiedHexKeys,
  getUnitOccupiedHexes,
  isEngagedInMelee,
} from './spatial';
import type { CombatContentCatalog } from './types';

/** 获取地形格的战术中文名称与规则说明（供阻挡诊断与右侧地形情报卡统一复用） */
export function getTerrainTacticalInfo(tile: HexTile): {
  name: string;
  shortLabel: string;
  elevationLabel: string;
  moveDesc: string;
  losDesc: string;
  summary: string;
} {
  const elevLabel =
    tile.elevation >= 3
      ? '高耸 (Lv.3)'
      : tile.elevation === 2
        ? '高地 (Lv.2)'
        : tile.elevation <= 0
          ? '低洼 (Lv.0)'
          : '平地 (Lv.1)';

  switch (tile.terrain) {
    case 'rock':
      return {
        name: '高耸玄石碑',
        shortLabel: '玄石碑',
        elevationLabel: elevLabel,
        moveDesc: '陆空皆不可落足',
        losDesc: '彻底阻挡远程与法术视线',
        summary: '高耸实体石碑，完全遮断远程射击与定向施法弹道，需绕行或越过其视线阴影。',
      };
    case 'wall':
      return {
        name: '结界城墙',
        shortLabel: '城墙',
        elevationLabel: elevLabel,
        moveDesc: '陆空皆不可通行',
        losDesc: '彻底阻挡远程与法术视线',
        summary: '坚固防壁，阻断常规行军、飞行与远程/法术视线。',
      };
    case 'forest':
      return {
        name: '灵竹林',
        shortLabel: '灵竹林',
        elevationLabel: elevLabel,
        moveDesc: `移动消耗 ${tile.moveCost}（飞行无视）`,
        losDesc: '远程衰减降一档 · 不阻挡施法',
        summary: '茂密竹林掩体，陆行消耗额外移动力；穿透其间的远程射击伤害降一档，施法完全不受阻。',
      };
    case 'highland':
      return {
        name: '灵脉高台',
        shortLabel: '高台',
        elevationLabel: elevLabel,
        moveDesc: `移动消耗 ${tile.moveCost}`,
        losDesc: '承受低处远程伤害 -25% · 施法距离 +50%',
        summary: '地势高于平地，驻守其上可使来自低处的远程射击伤害降低 25%，且施法射程 +50%。',
      };
    case 'water':
      return {
        name: '灵泉水域',
        shortLabel: '水域',
        elevationLabel: elevLabel,
        moveDesc: '陆地不可通行（飞行可越过）',
        losDesc: '视野完全畅通',
        summary: '清冽灵泉，阻隔陆行部队，但飞行单位可悬停飞越，且绝不阻挡远程与施法视线。',
      };
    case 'tower':
      return {
        name: '守望箭楼',
        shortLabel: '箭楼',
        elevationLabel: elevLabel,
        moveDesc: `移动消耗 ${tile.moveCost}`,
        losDesc: '制高掩护 · 低处远程伤害 -25%',
        summary: '高耸阵地，驻守其上可减免 25% 来自低处的远程射击伤害并享有开阔射界。',
      };
    case 'gate':
      return {
        name: '结界隘门',
        shortLabel: '隘门',
        elevationLabel: elevLabel,
        moveDesc: `移动消耗 ${tile.moveCost}`,
        losDesc: '视野畅通',
        summary: '咽喉通道，可正常通行与施放攻击。',
      };
    case 'shrine_tile':
      return {
        name: '神社石阶',
        shortLabel: '石阶',
        elevationLabel: elevLabel,
        moveDesc: `移动消耗 ${tile.moveCost}`,
        losDesc: '视野畅通',
        summary: '平整神社青石铺地，行军与视野均无额外阻碍。',
      };
    default:
      return {
        name: '月夜荒原',
        shortLabel: '平地',
        elevationLabel: elevLabel,
        moveDesc: `移动消耗 ${tile.moveCost}`,
        losDesc: '视野畅通',
        summary: '开阔平地，无移动惩罚，远程与法术弹道均可自由穿透。',
      };
  }
}

/** 获取两组六边形间距离最近的一对起止格 */
function findClosestHexPair(
  fromHexes: readonly HexCoord[],
  toHexes: readonly HexCoord[],
): { fromHex: HexCoord; toHex: HexCoord } {
  let bestFrom = fromHexes[0] ?? { q: 0, r: 0 };
  let bestTo = toHexes[0] ?? { q: 0, r: 0 };
  let bestDist = Infinity;
  for (const a of fromHexes) {
    for (const b of toHexes) {
      const d = hexDistance(a, b);
      if (d < bestDist) {
        bestDist = d;
        bestFrom = a;
        bestTo = b;
      }
    }
  }
  return { fromHex: bestFrom, toHex: bestTo };
}

/** 解析视线结果中的具体阻挡体清单（精确识别高耸玄石碑、城墙、灵竹林、敌方单位、友军单位） */
export function diagnoseTrajectoryBlockers(
  state: BattleState,
  los: LineOfSightResult,
  actorSide: SideId,
  excludeUnitIds: ReadonlySet<string>,
): {
  blockers: TrajectoryBlockerDetail[];
  blockingHex: HexCoord | null;
  partialHexes: HexCoord[];
  primaryBlockReason?: string;
} {
  const blockers: TrajectoryBlockerDetail[] = [];
  const partialHexes: HexCoord[] = [];
  let blockingHex: HexCoord | null = null;

  for (const bHex of los.blockingHexes) {
    const key = hexKey(bHex);
    const tile = state.tiles[key];
    if (!tile) {
      if (!blockingHex && los.status === 'blocked') blockingHex = bHex;
      blockers.push({ hex: bHex, kind: 'out_of_bounds', label: '战场边界外' });
      continue;
    }

    const standing = findUnitAtHex(state, bHex, false);
    if (standing && !excludeUnitIds.has(standing.id)) {
      const isAlly = standing.side === actorSide;
      if (!blockingHex && los.status === 'blocked') blockingHex = bHex;
      blockers.push({
        hex: bHex,
        kind: isAlly ? 'ally_unit' : 'enemy_unit',
        label: `${isAlly ? '友军' : '敌军'}【${standing.name}】`,
        unitId: standing.id,
      });
      continue;
    }

    const tInfo = getTerrainTacticalInfo(tile);
    if (los.status === 'blocked' && tile.losObstruction === 'full') {
      if (!blockingHex) blockingHex = bHex;
      blockers.push({
        hex: bHex,
        kind: 'tall_obstacle',
        label: `【${tInfo.name}】`,
      });
    } else {
      partialHexes.push(bHex);
      blockers.push({
        hex: bHex,
        kind: 'partial_obstacle',
        label: `【${tInfo.name}】`,
      });
    }
  }

  let primaryBlockReason: string | undefined;
  if (los.status === 'blocked') {
    const primary = blockers.find((b) => b.kind !== 'partial_obstacle') ?? blockers[0];
    if (primary) {
      primaryBlockReason =
        primary.kind === 'ally_unit'
          ? `视线被${primary.label}遮挡（非相邻友军不可越肩）`
          : `视线被${primary.label}阻挡`;
    } else {
      primaryBlockReason = '视线被障碍物完全阻挡';
    }
  } else if (los.status === 'partial' && blockers.length > 0) {
    primaryBlockReason = `穿过${blockers[0].label}半遮挡（远程伤害降一档）`;
  }

  return { blockers, blockingHex, partialHexes, primaryBlockReason };
}

/** 施法视线判定（唯一真相源：普通障碍物绝不阻挡施法，仅高耸障碍物与存活单位阻挡） */
export function checkSpellLineOfSight(
  state: BattleState,
  caster: BattleUnit,
  targetHexes: readonly HexCoord[],
  targetUnit?: BattleUnit | null,
): { canCast: boolean; los: LineOfSightResult; fromHex: HexCoord; toHex: HexCoord } {
  const casterHexes = getUnitOccupiedHexes(caster);
  const closestPair = findClosestHexPair(casterHexes, targetHexes.length > 0 ? targetHexes : [caster.pos]);
  const emptyBlocked: LineOfSightResult = {
    canShoot: false,
    status: 'blocked',
    losMultiplier: 0,
    intermediateHexes: [],
    blockingHexes: [],
  };
  if (targetHexes.length === 0) {
    return { canCast: false, los: emptyBlocked, ...closestPair };
  }

  if (targetUnit && targetUnit.id === caster.id) {
    return {
      canCast: true,
      los: { canShoot: true, status: 'clear', losMultiplier: 1, intermediateHexes: [], blockingHexes: [] },
      fromHex: caster.pos,
      toHex: caster.pos,
    };
  }

  const tiles = buildTileMap(state);
  const occupied = getOccupiedHexKeys(state, caster.id);
  if (targetUnit) {
    for (const h of getUnitOccupiedHexes(targetUnit)) {
      occupied.delete(hexKey(h));
    }
  } else {
    for (const th of targetHexes) {
      occupied.delete(hexKey(th));
      const standing = findUnitAtHex(state, th, false);
      if (standing) {
        for (const h of getUnitOccupiedHexes(standing)) {
          occupied.delete(hexKey(h));
        }
      }
    }
  }

  let bestBlockedLos: LineOfSightResult = emptyBlocked;
  let bestBlockedFrom: HexCoord = closestPair.fromHex;
  let bestBlockedTo: HexCoord = closestPair.toHex;
  let bestBlockedDist = Infinity;

  for (const cHex of casterHexes) {
    for (const tHex of targetHexes) {
      const los = evaluateLineOfSight(cHex, tHex, tiles, occupied);
      if (los.status !== 'blocked') {
        return { canCast: true, los, fromHex: cHex, toHex: tHex };
      }
      const d = hexDistance(cHex, tHex);
      if (d < bestBlockedDist || (d === bestBlockedDist && los.blockingHexes.length > bestBlockedLos.blockingHexes.length)) {
        bestBlockedDist = d;
        bestBlockedLos = los;
        bestBlockedFrom = cHex;
        bestBlockedTo = tHex;
      }
    }
  }
  return { canCast: false, los: bestBlockedLos, fromHex: bestBlockedFrom, toHex: bestBlockedTo };
}

/** 统一计算 HoMM4 远程四阶衰减（距离档位 + 普通障碍降档） */
function computeRangedPenalty(
  shooter: BattleUnit,
  effectiveRange: number,
  distance: number,
  losStatus: 'clear' | 'partial' | 'blocked',
): { penaltyTier: RangedPenaltyTier; rangePenalty: number } {
  let distSteps = 0;
  if (shooter.abilities.longRange) {
    distSteps = 0;
  } else if (shooter.abilities.shortRange) {
    distSteps = distance <= effectiveRange ? 0 : distance <= Math.ceil(effectiveRange * 1.5) ? 1 : 2;
  } else {
    distSteps = distance <= effectiveRange ? 0 : distance <= effectiveRange * 2 ? 1 : 2;
  }
  const obstacleSteps = losStatus === 'partial' && !shooter.abilities.noObstaclePenalty ? 1 : 0;
  const totalSteps = Math.min(3, distSteps + obstacleSteps);
  const penaltyTier: RangedPenaltyTier =
    totalSteps === 0 ? 'full' : totalSteps === 1 ? 'half' : totalSteps === 2 ? 'quarter' : 'eighth';
  const rangePenalty =
    totalSteps === 0 ? 1 : totalSteps === 1 ? 0.5 : totalSteps === 2 ? 0.25 : 0.125;
  return { penaltyTier, rangePenalty };
}

/** 判断攻击者是否能对目标发起远程射击（HoMM4 四阶衰减 + 紧邻友军越肩射击） */
export function checkRangedCapability(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  catalog: CombatContentCatalog,
): {
  canRanged: boolean;
  los: LineOfSightResult;
  distance: number;
  rangePenalty: number;
  penaltyTier: RangedPenaltyTier;
  fromHex: HexCoord;
  toHex: HexCoord;
  blockedKind?: 'no_ranged' | 'no_ammo' | 'melee_engaged' | 'los_blocked';
  engagedByUnitName?: string;
} {
  const stats = computeUnitStats(attacker, state, catalog);
  const atkHexes = getUnitOccupiedHexes(attacker);
  const defHexes = getUnitOccupiedHexes(defender);
  const distance = minHexSetDistance(atkHexes, defHexes);
  const closestPair = findClosestHexPair(atkHexes, defHexes);
  const emptyLos: LineOfSightResult = {
    canShoot: false,
    status: 'blocked',
    losMultiplier: 0,
    intermediateHexes: [],
    blockingHexes: [],
  };

  const hasAmmo = Boolean(attacker.abilities.unlimitedShots) || attacker.ammo > 0;
  const canShootWhileEngaged = Boolean(attacker.abilities.noMelee);
  if (!attacker.abilities.ranged || attacker.abilities.noRanged) {
    return {
      canRanged: false,
      los: emptyLos,
      distance,
      rangePenalty: 0,
      penaltyTier: 'full',
      ...closestPair,
      blockedKind: 'no_ranged',
    };
  }
  if (!hasAmmo) {
    return {
      canRanged: false,
      los: emptyLos,
      distance,
      rangePenalty: 0,
      penaltyTier: 'full',
      ...closestPair,
      blockedKind: 'no_ammo',
    };
  }
  if (!canShootWhileEngaged && (distance <= 1 || isEngagedInMelee(state, attacker))) {
    let engagedName = distance <= 1 ? defender.name : undefined;
    if (!engagedName) {
      for (const other of Object.values(state.units)) {
        if (other.status !== 'alive' || other.side === attacker.side) continue;
        if (minHexSetDistance(atkHexes, getUnitOccupiedHexes(other)) <= 1) {
          engagedName = other.name;
          break;
        }
      }
    }
    return {
      canRanged: false,
      los: emptyLos,
      distance,
      rangePenalty: 0,
      penaltyTier: 'full',
      ...closestPair,
      blockedKind: 'melee_engaged',
      engagedByUnitName: engagedName,
    };
  }

  const tiles = buildTileMap(state);
  const occupied = getOccupiedHexKeys(state);
  for (const h of atkHexes) occupied.delete(hexKey(h));
  for (const h of defHexes) occupied.delete(hexKey(h));
  for (const ally of Object.values(state.units)) {
    if (ally.status !== 'alive' || ally.side !== attacker.side || ally.id === attacker.id) continue;
    const allyHexes = getUnitOccupiedHexes(ally);
    if (minHexSetDistance(atkHexes, allyHexes) <= 1) {
      for (const h of allyHexes) occupied.delete(hexKey(h));
    }
  }

  let bestLos: LineOfSightResult = emptyLos;
  let bestFrom: HexCoord = closestPair.fromHex;
  let bestTo: HexCoord = closestPair.toHex;
  let bestBlockedDist = Infinity;

  for (const aHex of atkHexes) {
    for (const dHex of defHexes) {
      const los = evaluateLineOfSight(aHex, dHex, tiles, occupied);
      if (los.losMultiplier > bestLos.losMultiplier || (los.canShoot && !bestLos.canShoot)) {
        bestLos = los;
        bestFrom = aHex;
        bestTo = dHex;
      } else if (!bestLos.canShoot && !los.canShoot) {
        const d = hexDistance(aHex, dHex);
        if (d < bestBlockedDist || (d === bestBlockedDist && los.blockingHexes.length > bestLos.blockingHexes.length)) {
          bestBlockedDist = d;
          bestLos = los;
          bestFrom = aHex;
          bestTo = dHex;
        }
      }
      if (bestLos.status === 'clear') break;
    }
    if (bestLos.status === 'clear') break;
  }

  const effectiveRange = Math.max(1, stats.range);
  const { penaltyTier, rangePenalty } = computeRangedPenalty(attacker, effectiveRange, distance, bestLos.status);

  return {
    canRanged: bestLos.canShoot,
    los: bestLos,
    distance,
    rangePenalty,
    penaltyTier,
    fromHex: bestFrom,
    toHex: bestTo,
    blockedKind: bestLos.canShoot ? undefined : 'los_blocked',
  };
}

/** 构建远程攻击可视化飞行路径与阻挡原因诊断 */
export function buildRangedTrajectoryPreview(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  rangedCheck: ReturnType<typeof checkRangedCapability>,
): ProjectileTrajectoryPreview {
  const excludeIds = new Set<string>([attacker.id, defender.id]);

  if (rangedCheck.blockedKind === 'no_ranged') {
    return {
      kind: 'ranged',
      fromHex: rangedCheck.fromHex,
      toHex: rangedCheck.toHex,
      blocked: true,
      reason: attacker.abilities.noRanged ? '处于远程禁手状态，无法射击' : '该单位无远程射击能力',
      losStatus: 'blocked',
      intermediateHexes: hexLine(rangedCheck.fromHex, rangedCheck.toHex).slice(1, -1),
      blockingHex: null,
      partialHexes: [],
      blockers: [],
    };
  }

  if (rangedCheck.blockedKind === 'no_ammo') {
    return {
      kind: 'ranged',
      fromHex: rangedCheck.fromHex,
      toHex: rangedCheck.toHex,
      blocked: true,
      reason: '弹药已耗尽，无法发起远程射击',
      losStatus: 'blocked',
      intermediateHexes: hexLine(rangedCheck.fromHex, rangedCheck.toHex).slice(1, -1),
      blockingHex: null,
      partialHexes: [],
      blockers: [],
    };
  }

  if (rangedCheck.blockedKind === 'melee_engaged') {
    const reason = rangedCheck.engagedByUnitName
      ? `被敌军【${rangedCheck.engagedByUnitName}】贴身交战，无法远程射击`
      : '与敌军贴身交战中，无法远程射击';
    return {
      kind: 'ranged',
      fromHex: rangedCheck.fromHex,
      toHex: rangedCheck.toHex,
      blocked: true,
      reason,
      losStatus: 'blocked',
      intermediateHexes: hexLine(rangedCheck.fromHex, rangedCheck.toHex).slice(1, -1),
      blockingHex: null,
      partialHexes: [],
      blockers: [],
    };
  }

  const diag = diagnoseTrajectoryBlockers(state, rangedCheck.los, attacker.side, excludeIds);
  const blocked = !rangedCheck.canRanged;

  return {
    kind: 'ranged',
    fromHex: rangedCheck.fromHex,
    toHex: rangedCheck.toHex,
    blocked,
    reason: diag.primaryBlockReason,
    losStatus: rangedCheck.los.status,
    rangedPenaltyTier: rangedCheck.penaltyTier,
    intermediateHexes: rangedCheck.los.intermediateHexes,
    blockingHex: blocked ? diag.blockingHex : null,
    partialHexes: diag.partialHexes,
    blockers: diag.blockers,
  };
}

/** 构建施法瞄准可视化飞行路径与阻挡/超射程诊断 */
export function buildSpellTrajectoryPreview(
  state: BattleState,
  caster: BattleUnit,
  spell: SpellDef,
  targetHex: HexCoord,
  targetUnit: BattleUnit | null,
  effRange: number,
  overrideBlockedReason?: string,
): ProjectileTrajectoryPreview | null {
  if (targetUnit && targetUnit.id === caster.id) return null;
  if (hexEquals(caster.pos, targetHex)) return null;

  const targetHexes = targetUnit ? getUnitOccupiedHexes(targetUnit) : [targetHex];
  const casterHexes = getUnitOccupiedHexes(caster);
  const distance = minHexSetDistance(casterHexes, targetHexes);
  const losRes = checkSpellLineOfSight(state, caster, targetHexes, targetUnit);

  const isOutOfRange = effRange > 0 && distance > effRange;
  const isLosBlocked = !spell.ignoreLos && !losRes.canCast;

  const excludeIds = new Set<string>([caster.id]);
  if (targetUnit) excludeIds.add(targetUnit.id);
  const diag = diagnoseTrajectoryBlockers(state, losRes.los, caster.side, excludeIds);

  const blocked = Boolean(overrideBlockedReason) || isOutOfRange || isLosBlocked;
  let reason = overrideBlockedReason;
  if (!reason) {
    if (isOutOfRange) {
      reason = `超出施法射程（当前距离 ${distance} 格 / 上限 ${effRange} 格）`;
    } else if (isLosBlocked) {
      reason = diag.primaryBlockReason
        ? diag.primaryBlockReason.replace('视线被', '施法视线被')
        : '施法视线被高耸障碍或单位阻挡';
    }
  }

  return {
    kind: 'spell',
    fromHex: losRes.fromHex,
    toHex: losRes.toHex,
    blocked,
    reason,
    losStatus: spell.ignoreLos ? 'clear' : isLosBlocked ? 'blocked' : 'clear',
    outOfRange: isOutOfRange ? { distance, maxRange: effRange } : undefined,
    intermediateHexes: losRes.los.intermediateHexes,
    blockingHex: isLosBlocked ? diag.blockingHex : null,
    partialHexes: [],
    blockers: isLosBlocked ? diag.blockers : [],
  };
}

/** 原版 HoMM4 远程反击与「前卫替伤」统一判定器 */
export function evaluateRangedRetaliation(
  state: BattleState,
  defender: BattleUnit,
  attacker: BattleUnit,
  catalog: CombatContentCatalog,
): {
  canRetaliate: boolean;
  actualTarget: BattleUnit;
  interceptedBy: BattleUnit | null;
  los: LineOfSightResult;
  distance: number;
  rangePenalty: number;
  penaltyTier: RangedPenaltyTier;
} {
  const stats = computeUnitStats(defender, state, catalog);
  const defHexes = getUnitOccupiedHexes(defender);
  const atkHexes = getUnitOccupiedHexes(attacker);
  const directDistance = minHexSetDistance(defHexes, atkHexes);
  const emptyLos: LineOfSightResult = {
    canShoot: false,
    status: 'blocked',
    losMultiplier: 0,
    intermediateHexes: [],
    blockingHexes: [],
  };

  const hasAmmo = Boolean(defender.abilities.unlimitedShots) || defender.ammo > 0;
  const canShootWhileEngaged = Boolean(defender.abilities.noMelee);
  if (!defender.abilities.ranged || defender.abilities.noRanged || !hasAmmo) {
    return {
      canRetaliate: false,
      actualTarget: attacker,
      interceptedBy: null,
      los: emptyLos,
      distance: directDistance,
      rangePenalty: 0,
      penaltyTier: 'full',
    };
  }
  if (!canShootWhileEngaged && (directDistance <= 1 || isEngagedInMelee(state, defender))) {
    return {
      canRetaliate: false,
      actualTarget: attacker,
      interceptedBy: null,
      los: emptyLos,
      distance: directDistance,
      rangePenalty: 0,
      penaltyTier: 'full',
    };
  }

  const tiles = buildTileMap(state);
  const hardUnitBlockerKeys = new Set<string>();
  const attackerAllyHexMap = new Map<string, BattleUnit>();

  for (const u of Object.values(state.units)) {
    if (u.status !== 'alive' || u.id === defender.id || u.id === attacker.id) continue;
    const uHexes = getUnitOccupiedHexes(u);
    if (u.side === defender.side) {
      if (minHexSetDistance(defHexes, uHexes) > 1) {
        for (const h of uHexes) hardUnitBlockerKeys.add(hexKey(h));
      }
    } else if (u.side === attacker.side) {
      if (u.statusEffects?.sanctuary) {
        for (const h of uHexes) hardUnitBlockerKeys.add(hexKey(h));
      } else {
        for (const h of uHexes) attackerAllyHexMap.set(hexKey(h), u);
      }
    }
  }

  interface RetaliationRayCandidate {
    interceptedBy: BattleUnit | null;
    interceptStep: number;
    los: LineOfSightResult;
  }

  let bestDirect: RetaliationRayCandidate | null = null;
  let bestIntercept: RetaliationRayCandidate | null = null;

  for (const dHex of defHexes) {
    const dElev = tiles.get(hexKey(dHex))?.elevation ?? 1;
    for (const aHex of atkHexes) {
      const aElev = tiles.get(hexKey(aHex))?.elevation ?? 1;
      const maxEndElev = Math.max(dElev, aElev);
      const path = hexLine(dHex, aHex);
      const intermediate = path.slice(1, -1);

      let blocked = false;
      let partialCount = 0;
      const blockingHexes: HexCoord[] = [];
      let hitAlly: BattleUnit | null = null;
      let hitStep = Infinity;

      for (let i = 0; i < intermediate.length; i += 1) {
        const hex = intermediate[i];
        const key = hexKey(hex);
        const tile = tiles.get(key);
        if (!tile) {
          blocked = true;
          break;
        }
        if (hardUnitBlockerKeys.has(key) && tile.elevation + 2 >= maxEndElev) {
          blocked = true;
          break;
        }
        if (tile.losObstruction === 'full' && tile.elevation >= maxEndElev) {
          blocked = true;
          break;
        }
        const ally = attackerAllyHexMap.get(key);
        if (ally && tile.elevation + 2 >= maxEndElev) {
          hitAlly = ally;
          hitStep = i + 1;
          break;
        }
        if (tile.losObstruction === 'partial' || tile.losObstruction === 'full') {
          partialCount += 1;
          blockingHexes.push(hex);
        }
      }

      if (blocked) continue;

      const los: LineOfSightResult =
        partialCount > 0
          ? {
              canShoot: true,
              status: 'partial',
              losMultiplier: 0.5,
              intermediateHexes: hitAlly ? intermediate.slice(0, hitStep - 1) : intermediate,
              blockingHexes,
            }
          : {
              canShoot: true,
              status: 'clear',
              losMultiplier: 1,
              intermediateHexes: hitAlly ? intermediate.slice(0, hitStep - 1) : intermediate,
              blockingHexes: [],
            };

      if (!hitAlly) {
        if (!bestDirect || los.losMultiplier > bestDirect.los.losMultiplier) {
          bestDirect = { interceptedBy: null, interceptStep: Infinity, los };
        }
      } else if (
        !bestIntercept ||
        los.losMultiplier > bestIntercept.los.losMultiplier ||
        (los.losMultiplier === bestIntercept.los.losMultiplier && hitStep < bestIntercept.interceptStep)
      ) {
        bestIntercept = { interceptedBy: hitAlly, interceptStep: hitStep, los };
      }
    }
  }

  const chosen = bestDirect ?? bestIntercept;
  if (!chosen) {
    return {
      canRetaliate: false,
      actualTarget: attacker,
      interceptedBy: null,
      los: emptyLos,
      distance: directDistance,
      rangePenalty: 0,
      penaltyTier: 'full',
    };
  }

  const actualTarget = chosen.interceptedBy ?? attacker;
  const actualDistance = minHexSetDistance(defHexes, getUnitOccupiedHexes(actualTarget));
  const effectiveRange = Math.max(1, stats.range);
  const { penaltyTier, rangePenalty } = computeRangedPenalty(
    defender,
    effectiveRange,
    actualDistance,
    chosen.los.status,
  );

  return {
    canRetaliate: true,
    actualTarget,
    interceptedBy: chosen.interceptedBy,
    los: chosen.los,
    distance: actualDistance,
    rangePenalty,
    penaltyTier,
  };
}

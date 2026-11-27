/**
 * 尖顶六边形（Pointy-Top）数学引擎与多层大地图坐标工具
 *
 * 约定：
 * - 战场统一使用轴坐标 (q, r)，立方坐标第三轴 s = -q - r
 * - 大地图扩展为 (layer, q, r)，原生支持地表、地下/地底、天界等多层世界
 * - 矩形战场通过 odd-r 偏移坐标与轴坐标互转，保持水平行整齐对齐左右对攻
 */

export interface HexCoord {
  q: number;
  r: number;
}

/** 多层大地图坐标（预留地表/地下/旧地底/天界） */
export interface WorldCoord extends HexCoord {
  layer: number;
}

export type TerrainType =
  | 'plain'
  | 'highland'
  | 'forest'
  | 'water'
  | 'rock'
  | 'shrine_tile'
  | 'wall'
  | 'gate'
  | 'tower';

export type MovementDomain = 'ground' | 'water' | 'flying' | 'teleport' | 'global_teleport';

export interface HexTile {
  q: number;
  r: number;
  terrain: TerrainType;
  /** 地形高程：0=水面低洼，1=平地，2=高地/塔楼，3=高耸岩柱/城墙 */
  elevation: number;
  /** 是否阻挡陆地移动 */
  blocksGround: boolean;
  /** 是否阻挡视线（全阻挡或半阻挡） */
  losObstruction: 'none' | 'partial' | 'full';
  /** 陆地移动消耗 */
  moveCost: number;
  /** 视觉装饰种子，用于纯代码程序化细节生成 */
  decorSeed: number;
}

/** 尖顶六边形 6 个邻接方向（顺时针，从右侧开始） */
export const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },   // 东（正右）
  { q: 1, r: -1 },  // 东北
  { q: 0, r: -1 },  // 西北
  { q: -1, r: 0 },  // 西（正左）
  { q: -1, r: 1 },  // 西南
  { q: 0, r: 1 },   // 东南
] as const;

export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

/** odd-r 偏移坐标转尖顶六边形轴坐标 */
export function offsetToAxial(col: number, row: number): HexCoord {
  const q = col - Math.floor((row - (row & 1)) / 2);
  const r = row;
  return { q, r };
}

/** 尖顶六边形轴坐标转 odd-r 偏移坐标 */
export function axialToOffset(coord: HexCoord): { col: number; row: number } {
  const col = coord.q + Math.floor((coord.r - (coord.r & 1)) / 2);
  const row = coord.r;
  return { col, row };
}

/** 计算两格之间的精确六边形步数距离 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -a.q - a.r - (-b.q - b.r);
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
}

/** 获取某个六边形的全部 6 个邻格 */
export function getHexNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map((d) => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

/** 获取指定半径内的全部六边形（含中心） */
export function getHexRange(center: HexCoord, radius: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let dq = -radius; dq <= radius; dq++) {
    const minDr = Math.max(-radius, -dq - radius);
    const maxDr = Math.min(radius, -dq + radius);
    for (let dr = minDr; dr <= maxDr; dr++) {
      results.push({ q: center.q + dq, r: center.r + dr });
    }
  }
  return results;
}

/** 浮点立方坐标四舍五入至最近整格六边形 */
function cubeRound(fq: number, fr: number, fs: number): HexCoord {
  let q = Math.round(fq);
  let r = Math.round(fr);
  const s = Math.round(fs);

  const qDiff = Math.abs(q - fq);
  const rDiff = Math.abs(r - fr);
  const sDiff = Math.abs(s - fs);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }
  return { q, r };
}

/**
 * 六边形两点间直线插值（用于远程视线检测与魔理沙《极限火花》直线贯通）
 */
export function hexLine(start: HexCoord, end: HexCoord): HexCoord[] {
  const dist = hexDistance(start, end);
  if (dist === 0) return [{ ...start }];

  const startS = -start.q - start.r;
  const endS = -end.q - end.r;
  // 加入极小偏移量消除穿过六边形公共边时的数值歧义
  const epsQ = 1e-6;
  const epsR = 2e-6;
  const epsS = -3e-6;

  const line: HexCoord[] = [];
  for (let i = 0; i <= dist; i++) {
    const t = i / dist;
    const fq = start.q + (end.q - start.q) * t + epsQ;
    const fr = start.r + (end.r - start.r) * t + epsR;
    const fs = startS + (endS - startS) * t + epsS;
    line.push(cubeRound(fq, fr, fs));
  }
  return line;
}

/**
 * 从起点沿指定目标方向延伸指定格数的直线（用于《极限火花》等贯穿符卡）
 */
export function hexRay(
  origin: HexCoord,
  towards: HexCoord,
  length: number,
  isValidTile: (c: HexCoord) => boolean,
): HexCoord[] {
  const baseDist = hexDistance(origin, towards);
  if (baseDist === 0) return [];

  // 放大终点向量以确保采样平滑指向目标方向
  const scale = Math.max(1, Math.ceil(length / baseDist) + 1);
  const farTarget: HexCoord = {
    q: origin.q + (towards.q - origin.q) * scale,
    r: origin.r + (towards.r - origin.r) * scale,
  };
  const rawLine = hexLine(origin, farTarget);
  const result: HexCoord[] = [];
  for (let i = 1; i < rawLine.length && result.length < length; i++) {
    const step = rawLine[i];
    if (!isValidTile(step)) break;
    result.push(step);
  }
  return result;
}

export interface LineOfSightResult {
  /** 是否允许进行远程攻击 */
  canShoot: boolean;
  /** 视线遮挡状态 */
  status: 'clear' | 'partial' | 'blocked';
  /** 远程伤害倍率（受视线遮挡、超距、高地影响前的视线系数） */
  losMultiplier: number;
  /** 射线途经的中间格（不含起止点） */
  intermediateHexes: HexCoord[];
  /** 触发阻挡的格子列表 */
  blockingHexes: HexCoord[];
}

/**
 * HoMM4 风格六边形视线判定（LoS）：
 * - 高耸障碍物（losObstruction === 'full'，如高耸玄石碑/城墙）与【所有存活单位】均视为高耸障碍物，
 *   会彻底阻挡远程射击与定向施法（status = 'blocked'）
 * - 普通障碍物（losObstruction === 'partial'，如灵竹林/低矮掩体）绝不完全阻挡远程或施法，
 *   仅使远程攻击衰减降级一档（1× → 1/2 → 1/4 → 1/8），且完全不影响施法！
 */
export function evaluateLineOfSight(
  from: HexCoord,
  to: HexCoord,
  tiles: ReadonlyMap<string, HexTile>,
  occupiedKeys: ReadonlySet<string>,
): LineOfSightResult {
  const path = hexLine(from, to);
  const fromTile = tiles.get(hexKey(from));
  const toTile = tiles.get(hexKey(to));
  const shooterElev = fromTile?.elevation ?? 1;
  const targetElev = toTile?.elevation ?? 1;

  const intermediate = path.slice(1, -1);
  const blockingHexes: HexCoord[] = [];
  let partialCount = 0;

  for (const hex of intermediate) {
    const key = hexKey(hex);
    const tile = tiles.get(key);
    if (!tile) {
      blockingHexes.push(hex);
      return {
        canShoot: false,
        status: 'blocked',
        losMultiplier: 0,
        intermediateHexes: intermediate,
        blockingHexes,
      };
    }

    const maxEndElev = Math.max(shooterElev, targetElev);

    // 1. 所有中间格存活单位一律视作高耸障碍物（有效高度 = 地表高程 + 2），直接阻挡远程与施法！
    if (occupiedKeys.has(key) && tile.elevation + 2 >= maxEndElev) {
      blockingHexes.push(hex);
      return {
        canShoot: false,
        status: 'blocked',
        losMultiplier: 0,
        intermediateHexes: intermediate,
        blockingHexes,
      };
    }

    // 2. 高耸地形障碍（如高耸玄石岩柱、城墙）直接阻挡远程与施法
    if (tile.losObstruction === 'full' && tile.elevation >= maxEndElev) {
      blockingHexes.push(hex);
      return {
        canShoot: false,
        status: 'blocked',
        losMultiplier: 0,
        intermediateHexes: intermediate,
        blockingHexes,
      };
    }

    // 3. 普通障碍物（或从极高处俯瞰高耸障碍）：绝不完全阻挡，仅记为普通遮挡（远程降级一档，施法不受影响）
    if (tile.losObstruction === 'partial' || tile.losObstruction === 'full') {
      partialCount += 1;
      blockingHexes.push(hex);
    }
  }

  if (partialCount > 0) {
    return {
      canShoot: true,
      status: 'partial',
      losMultiplier: 0.5,
      intermediateHexes: intermediate,
      blockingHexes,
    };
  }

  return {
    canShoot: true,
    status: 'clear',
    losMultiplier: 1,
    intermediateHexes: intermediate,
    blockingHexes,
  };
}

export interface ReachableMap {
  /** key -> 到达该格的最小移动力消耗 */
  costs: Map<string, number>;
  /** key -> 路径前驱节点 */
  cameFrom: Map<string, HexCoord | null>;
}

/**
 * 判断单位是否能“降落停驻”在目标六边形
 * - HoMM4 飞行单位：无视城墙以外的一切地形减速与水域/竹林阻挡，可悬停于平地、高地、竹林与水面，仅不可落入实体城墙或高耸岩柱内部
 */
export function canStepOnTile(
  tile: HexTile,
  domain: MovementDomain,
  ignoreTerrainPenalty: boolean,
): boolean {
  if (domain === 'flying') {
    return tile.terrain !== 'wall' && tile.terrain !== 'rock';
  }
  if (domain === 'water') {
    return tile.terrain === 'water';
  }
  if (ignoreTerrainPenalty) {
    return !tile.blocksGround;
  }
  return !tile.blocksGround;
}

/**
 * 判断飞行单位在空中途经时是否能飞越该格（HoMM4 铁律：无视城墙以外的一切地形、障碍与单位阻挡！）
 */
export function canFlyOverTile(tile: HexTile): boolean {
  return tile.terrain !== 'wall';
}

/**
 * 计算步入该格的实际移动力消耗（飞行单位与无视地形特质永远为 1，无视森林/山地减速！）
 */
export function getStepMoveCost(
  tile: HexTile,
  domain: MovementDomain,
  ignoreTerrainPenalty: boolean,
): number {
  if (domain === 'flying' || ignoreTerrainPenalty) return 1;
  return Math.max(1, tile.moveCost);
}

/** 单位碰撞体积规格（支持 H4 小型 / 纵型 / 横型 / 大型 4 种占位格） */
export type FootprintSize = '1x1' | '1x2' | '2x1' | '2x2';

export const FOOTPRINT_DIMS: Record<FootprintSize, { cols: number; rows: number; label: string }> = {
  '1x1': { cols: 1, rows: 1, label: '小型 (1×1)' },
  '1x2': { cols: 1, rows: 2, label: '纵型 (1×2)' },
  '2x1': { cols: 2, rows: 1, label: '横型 (2×1)' },
  '2x2': { cols: 2, rows: 2, label: '大型 (2×2)' },
};

/**
 * 展开指定锚格在 odd-r 偏移网格下占据的全部六边形轴坐标
 * - cols 沿水平列展开，rows 沿纵行展开，在斜 45° 战场上构成规整多格占位底座
 */
export function getFootprintHexes(anchor: HexCoord, footprint: FootprintSize = '1x1'): HexCoord[] {
  if (footprint === '1x1') return [{ q: anchor.q, r: anchor.r }];
  const { cols, rows } = FOOTPRINT_DIMS[footprint];
  const base = axialToOffset(anchor);
  const result: HexCoord[] = [];
  for (let dr = 0; dr < rows; dr++) {
    for (let dc = 0; dc < cols; dc++) {
      result.push(offsetToAxial(base.col + dc, base.row + dr));
    }
  }
  return result;
}

/**
 * 计算两组占据格之间的最小六边形步数距离
 */
export function minHexSetDistance(setA: readonly HexCoord[], setB: readonly HexCoord[]): number {
  let best = Infinity;
  for (const a of setA) {
    for (const b of setB) {
      const d = hexDistance(a, b);
      if (d < best) best = d;
    }
  }
  return best;
}

/**
 * 判断拥有指定碰撞体积的单位是否能以 anchor 为锚点合法站立
 */
export function canFootprintStandAt(
  anchor: HexCoord,
  footprint: FootprintSize,
  tiles: ReadonlyMap<string, HexTile>,
  blockedUnitKeys: ReadonlySet<string>,
  domain: MovementDomain,
  ignoreTerrainPenalty: boolean,
): { ok: boolean; maxStepCost: number } {
  const hexes = getFootprintHexes(anchor, footprint);
  let maxCost = 1;
  for (const h of hexes) {
    const k = hexKey(h);
    const tile = tiles.get(k);
    if (!tile) return { ok: false, maxStepCost: 99 };
    if (blockedUnitKeys.has(k)) return { ok: false, maxStepCost: 99 };
    if (!canStepOnTile(tile, domain, ignoreTerrainPenalty)) {
      return { ok: false, maxStepCost: 99 };
    }
    maxCost = Math.max(maxCost, getStepMoveCost(tile, domain, ignoreTerrainPenalty));
  }
  return { ok: true, maxStepCost: maxCost };
}

/**
 * 判断飞行单位以 anchor 为锚点是否可在空中途经（仅被城墙阻挡，无视水面、岩柱、森林与其他单位！）
 */
export function canFootprintFlyOver(
  anchor: HexCoord,
  footprint: FootprintSize,
  tiles: ReadonlyMap<string, HexTile>,
): boolean {
  const hexes = getFootprintHexes(anchor, footprint);
  for (const h of hexes) {
    const tile = tiles.get(hexKey(h));
    if (!tile || !canFlyOverTile(tile)) return false;
  }
  return true;
}

/**
 * 基于 Dijkstra 计算指定移动力与碰撞体积范围内的全部可达锚格与最短路前驱
 * - 陆地单位：严格校验全部占据格通行与地形减速（大型 2×2 无法挤过窄缝）
 * - HoMM4 飞行单位：空中途经无视城墙以外的一切地形障碍（水面/森林/岩柱）、单位阻挡与减速（每格恒耗 1 点），
 *   仅在最终降落锚点校验不与城墙/岩柱/其他存活单位重叠，且保留完整飞越轨迹供动画演出！
 */
export function computeReachableHexes(
  start: HexCoord,
  maxMove: number,
  tiles: ReadonlyMap<string, HexTile>,
  blockedUnitKeys: ReadonlySet<string>,
  domain: MovementDomain = 'ground',
  ignoreTerrainPenalty = false,
  footprint: FootprintSize = '1x1',
): ReachableMap {
  const transitCosts = new Map<string, number>();
  const cameFrom = new Map<string, HexCoord | null>();

  const startKey = hexKey(start);
  transitCosts.set(startKey, 0);
  cameFrom.set(startKey, null);

  // 全图深渊瞬移（Global Teleport，深渊隙间恶魔专属）：无移动距离限制，无视一切地形、城墙、水域、流沙与单位阻挡直达全图任意合法陆地空位！
  if (domain === 'global_teleport') {
    for (const [k, tile] of tiles.entries()) {
      if (k === startKey) continue;
      const dest: HexCoord = { q: tile.q, r: tile.r };
      const canLand = canFootprintStandAt(dest, footprint, tiles, blockedUnitKeys, 'ground', true);
      if (canLand.ok) {
        transitCosts.set(k, 1);
        cameFrom.set(k, start);
      }
    }
    return { costs: transitCosts, cameFrom };
  }

  // 有限距离瞬间移动（Teleport）：受最大移动力距离约束，无视一切中间地形、城墙、岩柱、水域、流沙与敌我单位阻挡，直接瞬移至射程内任意合法陆地空位！
  if (domain === 'teleport') {
    const radius = Math.max(0, Math.floor(maxMove));
    for (const h of getHexRange(start, radius)) {
      const k = hexKey(h);
      if (k === startKey) continue;
      const dist = hexDistance(start, h);
      if (dist <= 0 || dist > radius) continue;
      const canLand = canFootprintStandAt(h, footprint, tiles, blockedUnitKeys, 'ground', true);
      if (canLand.ok) {
        transitCosts.set(k, dist);
        cameFrom.set(k, start);
      }
    }
    return { costs: transitCosts, cameFrom };
  }

  const frontier: Array<{ coord: HexCoord; cost: number }> = [{ coord: start, cost: 0 }];

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.cost - b.cost);
    const current = frontier.shift()!;
    const curKey = hexKey(current.coord);
    const bestKnown = transitCosts.get(curKey) ?? Infinity;
    if (current.cost > bestKnown) continue;

    for (const next of getHexNeighbors(current.coord)) {
      const nextKey = hexKey(next);
      let stepCost = 1;

      if (domain === 'flying') {
        // 飞行途经：无视除城墙以外的一切地形、单位与减速！
        if (!canFootprintFlyOver(next, footprint, tiles)) continue;
        stepCost = 1;
      } else {
        const check = canFootprintStandAt(
          next,
          footprint,
          tiles,
          blockedUnitKeys,
          domain,
          ignoreTerrainPenalty,
        );
        if (!check.ok) continue;
        stepCost = check.maxStepCost;
      }

      const newCost = current.cost + stepCost;
      if (newCost > maxMove) continue;

      if (newCost < (transitCosts.get(nextKey) ?? Infinity)) {
        transitCosts.set(nextKey, newCost);
        cameFrom.set(nextKey, current.coord);
        frontier.push({ coord: next, cost: newCost });
      }
    }
  }

  if (domain !== 'flying') {
    return { costs: transitCosts, cameFrom };
  }

  // 飞行单位最终落脚过滤：仅保留可合法降落停驻的锚点（保留 cameFrom 中间飞越节点以还原直线飞越轨迹）
  const landingCosts = new Map<string, number>();
  landingCosts.set(startKey, 0);
  for (const [k, cost] of transitCosts.entries()) {
    if (k === startKey) continue;
    const anchorTile = tiles.get(k);
    if (!anchorTile) continue;
    const canLand = canFootprintStandAt(
      { q: anchorTile.q, r: anchorTile.r },
      footprint,
      tiles,
      blockedUnitKeys,
      'flying',
      true,
    );
    if (canLand.ok) {
      landingCosts.set(k, cost);
    }
  }

  return { costs: landingCosts, cameFrom };
}

/**
 * 从可达图还原完整移动路径（包含起点与终点）
 */
export function reconstructHexPath(
  reachable: ReachableMap,
  target: HexCoord,
): HexCoord[] | null {
  const targetKey = hexKey(target);
  if (!reachable.costs.has(targetKey)) return null;

  const path: HexCoord[] = [];
  let cursor: HexCoord | null = target;
  while (cursor) {
    path.push(cursor);
    cursor = reachable.cameFrom.get(hexKey(cursor)) ?? null;
  }
  path.reverse();
  return path;
}

/**
 * 像素坐标换算参数（支持 HoMM4 风格斜 45° 旋转 + 低角度侧俯压扁）
 */
export interface HexProjectionConfig {
  /** 六边形外接圆半径（像素） */
  radius: number;
  /** 纵轴侧俯压扁系数（如 0.56 呈现强烈的斜 45° 侧俯纵深感） */
  ySquash: number;
  /** 棋盘几何中心在屏幕上的锚点 */
  originX: number;
  originY: number;
  /** 每级高程抬升像素高度 */
  elevationHeight: number;
  /** 地面平面旋转角（弧度，负值如 -0.62 rad 使我方位于左下方、敌方位于右上方斜向对攻） */
  rotationRad?: number;
  /** 棋盘未旋转世界坐标系下的中心偏移，用于绕中心旋转 */
  centerWorldX?: number;
  centerWorldY?: number;
}

const SQRT3 = Math.sqrt(3);

/** 计算尖顶六边形在未旋转地面平面上的局部坐标（相对棋盘中心） */
export function hexToLocalWorld(coord: HexCoord, proj: HexProjectionConfig): { wx: number; wy: number } {
  const rawX = proj.radius * SQRT3 * (coord.q + coord.r / 2);
  const rawY = proj.radius * 1.5 * coord.r;
  return {
    wx: rawX - (proj.centerWorldX ?? 0),
    wy: rawY - (proj.centerWorldY ?? 0),
  };
}

/** 将未旋转地面平面点 (wx, wy) 经斜 45° 旋转与侧俯压扁投影为屏幕坐标 */
export function projectWorldPoint(
  wx: number,
  wy: number,
  proj: HexProjectionConfig,
  elevation = 1,
): { x: number; y: number } {
  const rot = proj.rotationRad ?? 0;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);
  const rx = wx * cosR - wy * sinR;
  const ry = wx * sinR + wy * cosR;
  const elevOffset = (elevation - 1) * proj.elevationHeight;
  return {
    x: proj.originX + rx,
    y: proj.originY + ry * proj.ySquash - elevOffset,
  };
}

/** 将六边形轴坐标投影为 2D 屏幕/舞台中心点 */
export function hexToPixel(
  coord: HexCoord,
  proj: HexProjectionConfig,
  elevation = 1,
): { x: number; y: number } {
  const { wx, wy } = hexToLocalWorld(coord, proj);
  const pt = projectWorldPoint(wx, wy, proj, elevation);
  return {
    x: Math.round(pt.x),
    y: Math.round(pt.y),
  };
}

/** 获取某个六边形在斜 45° + 侧俯投影下的精确 6 顶点坐标（100% 严丝合缝拼接） */
export function getProjectedHexPolygon(
  coord: HexCoord,
  proj: HexProjectionConfig,
  elevation = 1,
  radiusScale = 1,
): Array<{ x: number; y: number }> {
  const { wx, wy } = hexToLocalWorld(coord, proj);
  const r = proj.radius * radiusScale;
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const deg = 60 * i - 30;
    const rad = (Math.PI / 180) * deg;
    const vx = wx + r * Math.cos(rad);
    const vy = wy + r * Math.sin(rad);
    pts.push(projectWorldPoint(vx, vy, proj, elevation));
  }
  return pts;
}

/**
 * 将屏幕像素点精确反算至六边形轴坐标（完整支持斜 45° 逆旋转、侧俯压扁与高程命中）
 */
export function pixelToHex(
  px: number,
  py: number,
  proj: HexProjectionConfig,
  tiles?: ReadonlyMap<string, HexTile>,
): HexCoord {
  const rot = proj.rotationRad ?? 0;
  const cosNeg = Math.cos(-rot);
  const sinNeg = Math.sin(-rot);

  // 若提供地块映射，优先在去旋转后的标准地面空间执行带高程的精确最近格命中检测
  if (tiles) {
    let best: HexCoord | null = null;
    let bestDistSq = Infinity;
    for (const tile of tiles.values()) {
      const elevOffset = (tile.elevation - 1) * proj.elevationHeight;
      const dxScreen = px - proj.originX;
      const dyScreen = (py + elevOffset - proj.originY) / proj.ySquash;
      const wx = dxScreen * cosNeg - dyScreen * sinNeg;
      const wy = dxScreen * sinNeg + dyScreen * cosNeg;
      const tileWorld = hexToLocalWorld(tile, proj);
      const ddx = wx - tileWorld.wx;
      const ddy = wy - tileWorld.wy;
      const dSq = ddx * ddx + ddy * ddy;
      if (dSq <= proj.radius * proj.radius * 0.98 && dSq < bestDistSq) {
        bestDistSq = dSq;
        best = { q: tile.q, r: tile.r };
      }
    }
    if (best) return best;
  }

  const rx = px - proj.originX;
  const ry = (py - proj.originY) / proj.ySquash;
  const wx = rx * cosNeg - ry * sinNeg + (proj.centerWorldX ?? 0);
  const wy = rx * sinNeg + ry * cosNeg + (proj.centerWorldY ?? 0);
  const fq = ((SQRT3 / 3) * wx - (1 / 3) * wy) / proj.radius;
  const fr = ((2 / 3) * wy) / proj.radius;
  return cubeRound(fq, fr, -fq - fr);
}

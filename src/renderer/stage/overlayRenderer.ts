/**
 * 战斗舞台战术高亮、弹道轨迹、视线阻挡与头顶行动指针绘制子系统
 */

import type * as PIXI from 'pixi.js';
import { checkSpellLineOfSight, getUnitOccupiedHexes } from '@core/combatEngine';
import {
  getFootprintHexes,
  getHexNeighbors,
  getHexRange,
  getProjectedHexPolygon,
  hexKey,
  hexRay,
  hexToPixel,
  minHexSetDistance,
  type HexCoord,
} from '@core/hex';
import type { BattleState, ProjectileTrajectoryPreview } from '@core/types';
import { getFootprintCenterPixel, hexPolyFlatFromCoord } from './geometry';
import { STAGE_PROJECTION, type StageOverlayHints } from './types';

/** 绘制当前待行动单位头顶的精致和风漆金双层剑菱指针 ▼（高对比锐利轮廓，零干扰人物像素） */
export function drawActivePointerArrow(g: PIXI.Graphics): void {
  g.clear();
  // 柔雅外晕光圈，在暗夜背景上瞬间聚焦视线
  g.circle(0, -1, 10.5).fill({ color: 0xffe46b, alpha: 0.14 });
  // 外层深黑清晰压边 + 暖金剑菱主矢
  g.poly([0, 9.5, -6.5, -1, -2.6, -1, -2.6, -6.5, 0, -9, 2.6, -6.5, 2.6, -1, 6.5, -1], true)
    .fill({ color: 0xffd54f, alpha: 0.98 })
    .stroke({ width: 1.4, color: 0x120b1c, alpha: 0.98 });
  // 中层高光暖金切面
  g.poly([0, 7.2, -4.2, -0.3, -1.4, -0.3, -1.4, -5.4, 0, -7, 1.4, -5.4, 1.4, -0.3, 4.2, -0.3], true)
    .fill({ color: 0xfff0a6, alpha: 0.96 });
  // 中心纯净白金菱晶与顶冠金星
  g.poly([0, 5.2, -2.2, 0.4, 0, -3.2, 2.2, 0.4], true).fill({ color: 0xffffff, alpha: 0.96 });
  g.poly([0, -11.5, 1.6, -9.9, 0, -8.3, -1.6, -9.9], true)
    .fill({ color: 0xfff8cf, alpha: 0.95 })
    .stroke({ width: 0.8, color: 0x261808, alpha: 0.85 });
  g.visible = false;
}

/** 在指定图层绘制单个带填色与描边的斜向六边形高亮格 */
function drawHexOn(
  g: PIXI.Graphics,
  state: BattleState,
  coord: HexCoord,
  fillColor: number,
  fillAlpha: number,
  strokeColor: number,
  strokeAlpha: number,
  strokeWidth = 1,
): void {
  const tile = state.tiles[hexKey(coord)];
  if (!tile) return;
  const pts = hexPolyFlatFromCoord(coord, tile.elevation, 0.94);
  g.poly(pts, true)
    .fill({ color: fillColor, alpha: fillAlpha })
    .stroke({ width: strokeWidth, color: strokeColor, alpha: strokeAlpha });
}

/**
 * 绘制集合外圈六边形发光轮廓线（几何最近两顶点法，严格适配任意斜投影旋转与压扁）
 */
export function drawHexSetBoundary(
  g: PIXI.Graphics,
  coords: readonly HexCoord[],
  keySet: ReadonlySet<string>,
  state: BattleState,
  strokeColor: number,
  strokeAlpha: number,
  strokeWidth: number,
): void {
  for (const c of coords) {
    const tile = state.tiles[hexKey(c)];
    if (!tile) continue;
    const poly = getProjectedHexPolygon(c, STAGE_PROJECTION, tile.elevation, 0.96);
    const neighbors = getHexNeighbors(c);
    for (const nb of neighbors) {
      if (keySet.has(hexKey(nb))) continue;
      const nbElev = state.tiles[hexKey(nb)]?.elevation ?? tile.elevation;
      const nbPt = hexToPixel(nb, STAGE_PROJECTION, nbElev);
      // 找出距离该邻格中心最近的 2 个多边形顶点，即该方向的共享边
      let i1 = 0;
      let i2 = 1;
      let d1 = Infinity;
      let d2 = Infinity;
      for (let idx = 0; idx < poly.length; idx++) {
        const dx = poly[idx].x - nbPt.x;
        const dy = poly[idx].y - nbPt.y;
        const d = dx * dx + dy * dy;
        if (d < d1) {
          d2 = d1;
          i2 = i1;
          d1 = d;
          i1 = idx;
        } else if (d < d2) {
          d2 = d;
          i2 = idx;
        }
      }
      g.moveTo(poly[i1].x, poly[i1].y)
        .lineTo(poly[i2].x, poly[i2].y)
        .stroke({ width: strokeWidth, color: strokeColor, alpha: strokeAlpha });
    }
  }
}

/** 绘制虚线段工具（用于飞行路径与截断残线） */
function drawDashedLine(
  g: PIXI.Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  dashLen: number,
  gapLen: number,
  color: number,
  width: number,
  alpha: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const total = Math.hypot(dx, dy);
  if (total < 0.5) return;
  const ux = dx / total;
  const uy = dy / total;
  let dist = 0;
  while (dist < total) {
    const segEnd = Math.min(total, dist + dashLen);
    g.moveTo(x0 + ux * dist, y0 + uy * dist)
      .lineTo(x0 + ux * segEnd, y0 + uy * segEnd)
      .stroke({ width, color, alpha });
    dist += dashLen + gapLen;
  }
}

/** 在轨迹上绘制方向小箭镞 */
function drawTrajectoryChevron(
  g: PIXI.Graphics,
  cx: number,
  cy: number,
  angle: number,
  size: number,
  color: number,
  alpha: number,
): void {
  const wing = 0.58;
  g.moveTo(cx - Math.cos(angle - wing) * size, cy - Math.sin(angle - wing) * size)
    .lineTo(cx, cy)
    .lineTo(cx - Math.cos(angle + wing) * size, cy - Math.sin(angle + wing) * size)
    .stroke({ width: 1.8, color, alpha });
}

/** 绘制醒目红白双层「✕」阻挡拦截标记 */
function drawBlockedCrossMarker(g: PIXI.Graphics, cx: number, cy: number, radius = 6.5): void {
  g.circle(cx, cy, radius + 2.2)
    .fill({ color: 0x3b0711, alpha: 0.85 })
    .stroke({ width: 1.6, color: 0xff4560, alpha: 0.98 });
  g.circle(cx, cy, radius - 0.5).stroke({ width: 0.9, color: 0xffc4cd, alpha: 0.72 });
  const r = radius * 0.55;
  g.moveTo(cx - r, cy - r)
    .lineTo(cx + r, cy + r)
    .moveTo(cx + r, cy - r)
    .lineTo(cx - r, cy + r)
    .stroke({ width: 2.2, color: 0xffffff, alpha: 0.98 });
}

/**
 * 绘制远程射击与施法瞄准的统一飞行路径 + 阻挡点/半遮挡可视化
 * - groundG：贴地层（途径引导格、半遮挡琥珀框、全阻挡红框）
 * - fgG：前景层（飞行射线、箭镞、准星、红白「✕」拦截徽章，永不被玄石碑或翅膀遮挡）
 */
export function drawTrajectoryOverlay(
  groundG: PIXI.Graphics,
  fgG: PIXI.Graphics,
  state: BattleState,
  traj: ProjectileTrajectoryPreview,
): void {
  const fromElev = state.tiles[hexKey(traj.fromHex)]?.elevation ?? 1;
  const toElev = state.tiles[hexKey(traj.toHex)]?.elevation ?? 1;
  const fromGround = hexToPixel(traj.fromHex, STAGE_PROJECTION, fromElev);
  const toGround = hexToPixel(traj.toHex, STAGE_PROJECTION, toElev);
  const p0 = { x: fromGround.x, y: fromGround.y - 13 };
  const p1 = { x: toGround.x, y: toGround.y - 13 };

  // 1. 地面途经格柔和引导
  const partialSet = new Set(traj.partialHexes.map((h) => hexKey(h)));
  const blockKey = traj.blockingHex ? hexKey(traj.blockingHex) : null;
  for (const mid of traj.intermediateHexes) {
    const mk = hexKey(mid);
    if (mk === blockKey || partialSet.has(mk)) continue;
    if (traj.blocked) {
      drawHexOn(groundG, state, mid, 0xff4560, 0.06, 0xff7085, 0.2, 0.8);
    } else {
      const midCol = traj.kind === 'spell' ? 0xb388ff : 0x6bffd2;
      drawHexOn(groundG, state, mid, midCol, 0.075, midCol, 0.25, 0.8);
    }
  }

  // 2. 半遮挡普通障碍格（如灵竹林）：地面琥珀框 + 前景琥珀菱点
  for (const ph of traj.partialHexes) {
    drawHexOn(groundG, state, ph, 0xffb845, 0.2, 0xffdc82, 0.85, 1.4);
    const pe = state.tiles[hexKey(ph)]?.elevation ?? 1;
    const pp = hexToPixel(ph, STAGE_PROJECTION, pe);
    const px = pp.x;
    const py = pp.y - 12;
    fgG
      .poly([px, py - 4.5, px + 4.5, py, px, py + 4.5, px - 4.5, py], true)
      .fill({ color: 0xffc857, alpha: 0.92 })
      .stroke({ width: 1, color: 0x3b2106, alpha: 0.95 });
  }

  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);

  // 3. 彻底阻挡 / 无法命中：分段绘制亮红拦截轨迹与「✕」徽章
  if (traj.blocked) {
    if (traj.blockingHex) {
      // 阻挡格地面亮红高亮框
      drawHexOn(groundG, state, traj.blockingHex, 0xff304d, 0.28, 0xff8598, 0.98, 2);
      const be = state.tiles[hexKey(traj.blockingHex)]?.elevation ?? 1;
      const bpGround = hexToPixel(traj.blockingHex, STAGE_PROJECTION, be);
      const pb = { x: bpGround.x, y: bpGround.y - 13 };

      // 起飞至阻挡点：外发光 + 亮红实线
      fgG.moveTo(p0.x, p0.y).lineTo(pb.x, pb.y).stroke({ width: 4.5, color: 0xff304d, alpha: 0.26 });
      fgG.moveTo(p0.x, p0.y).lineTo(pb.x, pb.y).stroke({ width: 2.1, color: 0xff526a, alpha: 0.96 });
      if (Math.hypot(pb.x - p0.x, pb.y - p0.y) > 22) {
        drawTrajectoryChevron(
          fgG,
          (p0.x + pb.x) * 0.5,
          (p0.y + pb.y) * 0.5,
          Math.atan2(pb.y - p0.y, pb.x - p0.x),
          4.2,
          0xffb8c2,
          0.95,
        );
      }

      // 阻挡点至目标：暗红截断虚线 + 目标淡红小环
      drawDashedLine(fgG, pb.x, pb.y, p1.x, p1.y, 4, 4, 0xb8374b, 1.4, 0.68);
      fgG.circle(p1.x, p1.y, 4.8).stroke({ width: 1.2, color: 0xff6b81, alpha: 0.65 });

      // 阻挡格前景红白「✕」拦截点
      drawBlockedCrossMarker(fgG, pb.x, pb.y, 6.4);
    } else if (traj.outOfRange && traj.outOfRange.distance > 0) {
      // 超出射程：在射程尽头标出红金截断点
      const ratio = Math.max(0.16, Math.min(0.86, traj.outOfRange.maxRange / traj.outOfRange.distance));
      const pc = {
        x: p0.x + (p1.x - p0.x) * ratio,
        y: p0.y + (p1.y - p0.y) * ratio,
      };
      const inCol = traj.kind === 'spell' ? 0xb58aff : 0xffc857;
      drawDashedLine(fgG, p0.x, p0.y, pc.x, pc.y, 6, 3.5, inCol, 1.8, 0.85);
      drawDashedLine(fgG, pc.x, pc.y, p1.x, p1.y, 3.5, 4, 0xff4560, 1.7, 0.88);
      drawBlockedCrossMarker(fgG, pc.x, pc.y, 5.8);
      fgG.circle(p1.x, p1.y, 5.2).stroke({ width: 1.4, color: 0xff526a, alpha: 0.85 });
    } else {
      // 贴身交战 / 弹药耗尽 / 目标魔免等规则阻挡
      fgG.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).stroke({ width: 4, color: 0xff304d, alpha: 0.18 });
      drawDashedLine(fgG, p0.x, p0.y, p1.x, p1.y, 5, 4, 0xff526a, 1.9, 0.92);
      const isOriginBlocked = Boolean(
        traj.reason && (traj.reason.includes('贴身') || traj.reason.includes('弹药') || traj.reason.includes('禁手')),
      );
      const markPt = isOriginBlocked
        ? { x: p0.x + Math.cos(angle) * 14, y: p0.y + Math.sin(angle) * 14 }
        : p1;
      drawBlockedCrossMarker(fgG, markPt.x, markPt.y, 6.2);
    }
    return;
  }

  // 4. 畅通或半遮挡可命中弹道：发光底衬 + 流动虚线 + 方向箭镞 + 准星双环
  const lineCol =
    traj.kind === 'spell'
      ? 0xd0a2ff
      : traj.rangedPenaltyTier === 'full'
        ? 0x6bffd2
        : traj.rangedPenaltyTier === 'half'
          ? 0xffc857
          : traj.rangedPenaltyTier === 'quarter'
            ? 0xff784f
            : 0xe65389;

  fgG.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).stroke({ width: 4.4, color: lineCol, alpha: 0.22 });
  drawDashedLine(fgG, p0.x, p0.y, p1.x, p1.y, 6.5, 3.5, lineCol, 2.0, 0.95);

  const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  if (len > 30) {
    const steps = len > 110 ? [0.34, 0.66] : [0.5];
    for (const t of steps) {
      drawTrajectoryChevron(
        fgG,
        p0.x + (p1.x - p0.x) * t,
        p0.y + (p1.y - p0.y) * t,
        angle,
        4.2,
        0xffffff,
        0.9,
      );
    }
  }

  // 起点发射小亮珠 & 终点瞄准星环
  fgG.circle(p0.x, p0.y, 2.6).fill({ color: lineCol, alpha: 0.95 });
  fgG.circle(p1.x, p1.y, 6.5).stroke({ width: 1.5, color: lineCol, alpha: 0.95 });
  fgG.circle(p1.x, p1.y, 2.2).fill({ color: 0xffffff, alpha: 0.95 });
}

/** 计算静态战术层签名（用于判重，鼠标移动时零重绘） */
export function computeStaticOverlaySignature(state: BattleState, hints: StageOverlayHints): string {
  return [
    state.commandSeq,
    state.round,
    hints.activeUnitId ?? '',
    hints.targetingMode,
    hints.spellRange,
    hints.spellIgnoreLos ? '1' : '0',
    hints.reachableHexKeys.size,
    hints.attackableUnitIds.size,
    hints.validSpellUnitIds.size,
    hints.validEmptyHexKeys?.size ?? 0,
    state.battleSpellFlags?.quicksandHexKeys.length ?? 0,
  ].join('|');
}

/** 计算轻量悬停动态层签名 */
export function computeHoverOverlaySignature(staticSig: string, hints: StageOverlayHints): string {
  const traj = hints.trajectoryPreview;
  return [
    staticSig,
    hints.hoveredHex ? hexKey(hints.hoveredHex) : '',
    hints.hoveredUnitId ?? '',
    hints.meleeApproachHex ? hexKey(hints.meleeApproachHex) : '',
    hints.meleeTargetHex ? hexKey(hints.meleeTargetHex) : '',
    hints.movePathPreview ? hints.movePathPreview.length : 0,
    hints.attackPreview
      ? `${hints.attackPreview.valid}:${hints.attackPreview.isRanged}:${hints.attackPreview.rangedPenaltyTier}:${hints.attackPreview.losStatus}`
      : '',
    traj
      ? `${traj.kind}:${hexKey(traj.fromHex)}->${hexKey(traj.toHex)}:${traj.blocked}:${traj.losStatus}:${traj.blockingHex ? hexKey(traj.blockingHex) : ''}:${traj.rangedPenaltyTier ?? ''}:${traj.outOfRange?.distance ?? ''}`
      : '',
  ].join('|');
}

/** 重绘静态战术高亮层（可达格 / 可攻敌军 / 施法覆盖区与射程轮廓 / 当前行动金框 / 流沙陷阱） */
export function renderStaticOverlay(
  sg: PIXI.Graphics,
  state: BattleState,
  hints: StageOverlayHints,
): void {
  const activeUnit = hints.activeUnitId ? state.units[hints.activeUnitId] : null;
  sg.clear();

  // 绘制自然系「流沙陷阱 (Quicksand)」地面警示区
  for (const qk of state.battleSpellFlags?.quicksandHexKeys ?? []) {
    const qTile = state.tiles[qk];
    if (qTile) {
      drawHexOn(sg, state, qTile, 0xd4a44a, 0.28, 0xffdf85, 0.72, 1.4);
    }
  }

  // 绘制所有多格大体型单位的淡雅地面占位轮廓
  for (const u of Object.values(state.units)) {
    if (u.status !== 'alive' || u.footprint === '1x1') continue;
    const col = u.side === 'left' ? 0xe64c65 : 0x5ea2ff;
    for (const h of getUnitOccupiedHexes(u)) {
      drawHexOn(sg, state, h, col, 0.08, col, 0.34, 1);
    }
  }

  if (hints.targetingMode === 'normal') {
    for (const k of hints.reachableHexKeys) {
      const tile = state.tiles[k];
      if (!tile) continue;
      if (activeUnit && tile.q === activeUnit.pos.q && tile.r === activeUnit.pos.r) continue;
      drawHexOn(sg, state, tile, 0x62d6ff, 0.065, 0x8de6ff, 0.26, 1);
    }
    for (const targetId of hints.attackableUnitIds) {
      const u = state.units[targetId];
      if (u && u.status === 'alive') {
        for (const h of getUnitOccupiedHexes(u)) {
          drawHexOn(sg, state, h, 0xff4560, 0.16, 0xff7085, 0.8, 1.3);
        }
      }
    }
  } else if (
    (hints.targetingMode === 'spell_unit' ||
      hints.targetingMode === 'spell_aoe' ||
      hints.targetingMode === 'spell_empty_hex') &&
    activeUnit
  ) {
    // 所有受射程限制的施法选取态统一渲染「施法范围覆盖区 + 最外圈发光边界」！
    const casterHexes = getUnitOccupiedHexes(activeUnit);
    const hasFiniteRange = hints.spellRange > 0 && hints.spellRange < 40;
    if (hasFiniteRange) {
      const inRangeCoords: HexCoord[] = [];
      const inRangeSet = new Set<string>();
      for (const tile of Object.values(state.tiles)) {
        if (minHexSetDistance(casterHexes, [tile]) <= hints.spellRange) {
          inRangeCoords.push(tile);
          inRangeSet.add(hexKey(tile));
        }
      }
      const isAoe = hints.targetingMode === 'spell_aoe';
      const isEmpty = hints.targetingMode === 'spell_empty_hex';
      const fillCol = isAoe ? 0xffa63d : isEmpty ? 0x4cc99b : 0x8a63ff;
      const borderCol = isAoe ? 0xffcf70 : isEmpty ? 0x8effcf : 0xcba6ff;

      for (const tile of inRangeCoords) {
        // 仅在非空地召唤且不忽略视线时，将高障碍背后盲区略微压暗以区分射界
        const isLosBlind =
          !isEmpty &&
          !hints.spellIgnoreLos &&
          !checkSpellLineOfSight(state, activeUnit, [tile]).canCast;
        if (isLosBlind) {
          drawHexOn(sg, state, tile, 0x5c2334, 0.09, 0xa84c63, 0.16, 0.7);
        } else {
          drawHexOn(sg, state, tile, fillCol, isEmpty ? 0.055 : 0.085, borderCol, 0.2, 0.8);
        }
      }

      // 最外圈高对比发光轮廓线，一眼锁定当前法术极限射程边界
      drawHexSetBoundary(sg, inRangeCoords, inRangeSet, state, borderCol, 0.88, 2.0);
    }

    if (hints.targetingMode === 'spell_unit') {
      for (const uid of hints.validSpellUnitIds) {
        const u = state.units[uid];
        if (u && u.status !== 'knocked_out') {
          const isAllyTarget = u.side === activeUnit.side;
          for (const h of getUnitOccupiedHexes(u)) {
            drawHexOn(
              sg,
              state,
              h,
              isAllyTarget ? 0x58d6b8 : 0xa56eff,
              0.26,
              isAllyTarget ? 0xb5ffea : 0xe4ccff,
              0.94,
              1.6,
            );
          }
        }
      }
    } else if (hints.targetingMode === 'spell_empty_hex' && hints.validEmptyHexKeys) {
      for (const k of hints.validEmptyHexKeys) {
        const tile = state.tiles[k];
        if (tile) {
          drawHexOn(sg, state, tile, 0x5ee39a, 0.16, 0x9effc8, 0.56, 1.2);
        }
      }
    }
  }

  if (activeUnit && activeUnit.status === 'alive') {
    for (const h of getUnitOccupiedHexes(activeUnit)) {
      drawHexOn(sg, state, h, 0xffe46b, 0.26, 0xfff6bd, 0.98, 2.2);
    }
  }
}

/** 重绘轻量悬停动态层与前景弹道层（AOE 覆盖 / 符卡直线 / 移动路径 / 近战落脚箭 / 弹道阻挡线） */
export function renderHoverOverlay(
  g: PIXI.Graphics,
  fg: PIXI.Graphics,
  state: BattleState,
  hints: StageOverlayHints,
): void {
  const activeUnit = hints.activeUnitId ? state.units[hints.activeUnitId] : null;
  g.clear();
  fg.clear();

  if (hints.targetingMode === 'spell_aoe' && activeUnit) {
    if (hints.hoveredHex) {
      const casterHexes = getUnitOccupiedHexes(activeUnit);
      const inRange =
        hints.spellRange <= 0 || minHexSetDistance(casterHexes, [hints.hoveredHex]) <= hints.spellRange;
      const losOk = hints.spellIgnoreLos || checkSpellLineOfSight(state, activeUnit, [hints.hoveredHex]).canCast;
      if (inRange && losOk) {
        for (const h of getHexRange(hints.hoveredHex, hints.aoeRadius)) {
          drawHexOn(g, state, h, 0xff6b35, 0.34, 0xffe066, 0.95, 1.5);
        }
      } else {
        // 即使被阻挡或超距，仍用淡暗红显示预期爆炸范围，配合红色拦截路径秒懂原因
        for (const h of getHexRange(hints.hoveredHex, hints.aoeRadius)) {
          drawHexOn(g, state, h, 0xff3855, 0.12, 0xff6b81, 0.42, 1.0);
        }
      }
    }
  } else if (hints.targetingMode === 'spell_card_line' && activeUnit && hints.hoveredHex) {
    const ray = hexRay(
      activeUnit.pos,
      hints.hoveredHex,
      hints.lineLength,
      (c) => Boolean(state.tiles[hexKey(c)]),
    );
    for (const step of ray) {
      drawHexOn(g, state, step, 0xffcf40, 0.38, 0xfff5b8, 0.98, 1.8);
    }
  }

  if (hints.hoveredHex) {
    if (
      hints.targetingMode === 'normal' &&
      activeUnit &&
      hints.reachableHexKeys.has(hexKey(hints.hoveredHex))
    ) {
      for (const h of getFootprintHexes(hints.hoveredHex, activeUnit.footprint)) {
        drawHexOn(g, state, h, 0x99ecff, 0.22, 0xffffff, 0.9, 1.4);
      }
    } else {
      drawHexOn(g, state, hints.hoveredHex, 0xffffff, 0.14, 0xffffff, 0.78, 1.3);
    }
  }

  if (hints.movePathPreview && hints.movePathPreview.length > 1 && activeUnit) {
    if (activeUnit.abilities.teleport || activeUnit.abilities.globalTeleport) {
      const isAbyssTp = Boolean(activeUnit.abilities.globalTeleport);
      const pStart = getFootprintCenterPixel(hints.movePathPreview[0], activeUnit.footprint, state.tiles);
      const pEnd = getFootprintCenterPixel(
        hints.movePathPreview[hints.movePathPreview.length - 1],
        activeUnit.footprint,
        state.tiles,
      );
      const segments = 12;
      let prevX = pStart.x;
      let prevY = pStart.y - 6;
      for (let s = 1; s <= segments; s++) {
        const t = s / segments;
        const nx = pStart.x + (pEnd.x - pStart.x) * t;
        const ny = pStart.y + (pEnd.y - pStart.y) * t - 6;
        if (s % 2 === 1) {
          g.moveTo(prevX, prevY).lineTo(nx, ny).stroke({ width: 1.8, color: isAbyssTp ? 0xff4d88 : 0xc996ff, alpha: 0.92 });
        }
        prevX = nx;
        prevY = ny;
      }
      g.circle(pEnd.x, pEnd.y, 6.2).stroke({ width: 1.4, color: isAbyssTp ? 0xff6699 : 0xd9b8ff, alpha: 0.95 });
      g.circle(pEnd.x, pEnd.y, 2.8).fill({ color: isAbyssTp ? 0xffe066 : 0x9ceeff, alpha: 0.96 });
    } else if (activeUnit.abilities.flying) {
      const pStart = getFootprintCenterPixel(hints.movePathPreview[0], activeUnit.footprint, state.tiles);
      const pEnd = getFootprintCenterPixel(
        hints.movePathPreview[hints.movePathPreview.length - 1],
        activeUnit.footprint,
        state.tiles,
      );
      const segments = 16;
      const arcH = Math.min(28, 12 + Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y) * 0.08);
      let prevX = pStart.x;
      let prevY = pStart.y - 6;
      for (let s = 1; s <= segments; s++) {
        const t = s / segments;
        const nx = pStart.x + (pEnd.x - pStart.x) * t;
        const ny = pStart.y + (pEnd.y - pStart.y) * t - 6 - Math.sin(t * Math.PI) * arcH;
        if (s % 2 === 1) {
          g.moveTo(prevX, prevY).lineTo(nx, ny).stroke({ width: 1.8, color: 0x7ff6ff, alpha: 0.9 });
        }
        prevX = nx;
        prevY = ny;
      }
      g.circle(pEnd.x, pEnd.y, 3.5).fill({ color: 0xb8fbff, alpha: 0.95 });
    } else {
      for (let i = 1; i < hints.movePathPreview.length; i++) {
        const p0 = getFootprintCenterPixel(hints.movePathPreview[i - 1], activeUnit.footprint, state.tiles);
        const p1 = getFootprintCenterPixel(hints.movePathPreview[i], activeUnit.footprint, state.tiles);
        g.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).stroke({ width: 1.5, color: 0x8de6ff, alpha: 0.78 });
        g.circle(p1.x, p1.y, i === hints.movePathPreview.length - 1 ? 3 : 1.8).fill({
          color: i === hints.movePathPreview.length - 1 ? 0xd9f7ff : 0x8de6ff,
          alpha: 0.9,
        });
      }
    }
  }

  if (hints.meleeCandidateHexes.length > 0) {
    for (const cand of hints.meleeCandidateHexes) {
      drawHexOn(g, state, cand, 0xffe484, 0.08, 0xffe484, 0.36, 1);
    }
  }
  if (hints.meleeApproachHex && hints.meleeTargetHex && activeUnit) {
    for (const h of getFootprintHexes(hints.meleeApproachHex, activeUnit.footprint)) {
      drawHexOn(g, state, h, 0xffe484, 0.28, 0xfff3b8, 0.98, 1.8);
    }
    const p0 = getFootprintCenterPixel(hints.meleeApproachHex, activeUnit.footprint, state.tiles);
    const targetUnit = Object.values(state.units).find(
      (u) => u.status === 'alive' && u.pos.q === hints.meleeTargetHex!.q && u.pos.r === hints.meleeTargetHex!.r,
    );
    const p1 = targetUnit
      ? getFootprintCenterPixel(targetUnit.pos, targetUnit.footprint, state.tiles)
      : hexToPixel(hints.meleeTargetHex, STAGE_PROJECTION, state.tiles[hexKey(hints.meleeTargetHex)]?.elevation ?? 1);
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / dist;
    const uy = dy / dist;
    const tipX = p1.x - ux * 8;
    const tipY = p1.y - uy * 8;
    g.moveTo(p0.x, p0.y).lineTo(tipX, tipY).stroke({ width: 2.2, color: 0xffd859, alpha: 0.95 });
    const headLen = 6;
    const wingAngle = 0.55;
    const baseAngle = Math.atan2(uy, ux);
    g.moveTo(tipX, tipY)
      .lineTo(
        tipX - Math.cos(baseAngle - wingAngle) * headLen,
        tipY - Math.sin(baseAngle - wingAngle) * headLen,
      )
      .moveTo(tipX, tipY)
      .lineTo(
        tipX - Math.cos(baseAngle + wingAngle) * headLen,
        tipY - Math.sin(baseAngle + wingAngle) * headLen,
      )
      .stroke({ width: 2, color: 0xfff3b8, alpha: 0.98 });
  }

  if (hints.attackPreview && activeUnit) {
    const prev = hints.attackPreview;
    if (prev.movePath && prev.movePath.length > 1) {
      for (let i = 1; i < prev.movePath.length; i++) {
        const fromT = state.tiles[hexKey(prev.movePath[i - 1])];
        const toT = state.tiles[hexKey(prev.movePath[i])];
        const p0 = hexToPixel(prev.movePath[i - 1], STAGE_PROJECTION, fromT?.elevation ?? 1);
        const p1 = hexToPixel(prev.movePath[i], STAGE_PROJECTION, toT?.elevation ?? 1);
        g.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).stroke({ width: 2, color: 0xffe484, alpha: 0.85 });
      }
    }
  }

  // 统一前景飞行路径与阻挡点绘制（覆盖远程畅通/衰减/被挡 + 施法畅通/被挡/超射程）
  if (hints.trajectoryPreview) {
    drawTrajectoryOverlay(g, fg, state, hints.trajectoryPreview);
  }
}

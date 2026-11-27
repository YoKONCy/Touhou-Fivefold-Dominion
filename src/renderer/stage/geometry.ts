/**
 * 战斗舞台几何投影与通用基础辅助函数
 */

import {
  getFootprintHexes,
  getProjectedHexPolygon,
  hexKey,
  hexToPixel,
  type FootprintSize,
  type HexCoord,
  type HexTile,
} from '@core/hex';
import { STAGE_PROJECTION, type UnitVisualNode } from './types';

/** 计算多格单位占据格的视觉几何质心坐标（支持 1×1 ~ 2×2 任意体积居中落位） */
export function getFootprintCenterPixel(
  anchor: HexCoord,
  footprint: FootprintSize,
  tiles: Record<string, HexTile>,
): { x: number; y: number } {
  const hexes = getFootprintHexes(anchor, footprint);
  let sx = 0;
  let sy = 0;
  for (const h of hexes) {
    const elev = tiles[hexKey(h)]?.elevation ?? 1;
    const p = hexToPixel(h, STAGE_PROJECTION, elev);
    sx += p.x;
    sy += p.y;
  }
  const n = Math.max(1, hexes.length);
  return { x: Math.round(sx / n), y: Math.round(sy / n) };
}

/** 将六边形投影顶点展平为 PIXI.Graphics.poly 可直接消费的数字数组 */
export function hexPolyFlatFromCoord(
  coord: HexCoord,
  elevation: number,
  radiusScale = 0.96,
): number[] {
  const pts = getProjectedHexPolygon(coord, STAGE_PROJECTION, elevation, radiusScale);
  const flat: number[] = [];
  for (const p of pts) flat.push(p.x, p.y);
  return flat;
}

/** 将 #RRGGBB 字符串解析为十六进制整数颜色 */
export function parseColorNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/** 异步延迟工具（驱动演出节拍） */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 计算角色真实非透明头顶相对于脚底锚点 baseY 的竖直偏移（负数，含飞行悬浮顶峰余量） */
export function getSpriteHeadTopOffsetY(node: UnitVisualNode): number {
  const floatClearance = node.isFloating ? 6 : 0;
  return -Math.round(node.visualHeadHeight * node.spriteScale + floatClearance);
}

/** 计算脚底一体化状态托盘（兵力角标 + 纤细血蓝条）相对于脚底锚点 baseY 的紧凑偏移 */
export function getBadgeFootOffsetY(node: UnitVisualNode, isKnockedOut = false): number {
  if (isKnockedOut) return 2;
  // 飞行单位主体上浮 -5px，脚底托盘微收至 +3px 避免触碰下排单位头顶；陆地单位紧贴鞋底 +5px
  return node.isFloating ? 3 : 5;
}

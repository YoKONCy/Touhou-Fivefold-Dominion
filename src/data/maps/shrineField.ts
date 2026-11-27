/**
 * 暗夜幻想乡战场投影参数与默认地形生成器
 */

import {
  hexKey,
  hexToPixel,
  offsetToAxial,
  type HexProjectionConfig,
  type HexTile,
  type TerrainType,
} from '@core/hex';

/**
 * 暗夜幻想乡战场统一「斜 45° + 侧俯压扁」投影配置（渲染层、地图生成与单测唯一真相源）
 * - 严格保持经典的斜向视角（rotationRad = -0.56, ySquash = 0.58）
 * - 中心锚定在 offsetToAxial(10, 10) → 屏幕中心 (440, 302)，六边形半径 12.2px，
 *   让近千格斜向六边形完整铺满整个暗夜地面！
 */
export const SHRINE_FIELD_PROJECTION: HexProjectionConfig = (() => {
  const radius = 12.2;
  const centerAxial = offsetToAxial(10, 10);
  return {
    radius,
    ySquash: 0.58,
    originX: 440,
    originY: 302,
    elevationHeight: 9.0,
    rotationRad: -0.56,
    centerWorldX: radius * Math.sqrt(3) * (centerAxial.q + centerAxial.r / 2),
    centerWorldY: radius * 1.5 * centerAxial.r,
  };
})();

/**
 * 生成严格保持斜向（rotationRad = -0.56）且几乎铺满整个地面背景的超广阔不规则战场（~950+ 格！）
 * - 不再局限于局促的小斜矩形：直接在斜向旋转坐标系下将六边形向外延展至整个地面可视区域，
 *   并用多频有机轮廓曲线雕出自然起伏的林间空地边界（四角自然圆润收口，仅留适量风景留白）
 * - 完整保留所有经典战术地形与单测地标坐标（(6,6)玄石、(6,14)竹林、(8,3)高地、(8,10)灵泉等）
 */
export function buildShrineNightBattleMap(): {
  width: number;
  height: number;
  tiles: Record<string, HexTile>;
} {
  const width = 44;
  const height = 44;
  const tiles: Record<string, HexTile> = {};

  // 战略高地山坡（覆盖中央、南北两翼与斜向东西高坡）
  const highlands = new Set([
    // 中北高坡（含单测基准 (8,3)）
    '8,3', '9,3', '10,3', '11,3', '9,4', '10,4',
    // 中南高坡
    '9,16', '10,16', '11,16', '10,17', '11,17', '12,17',
    // 左翼与右翼外缘制高点
    '4,10', '5,10', '15,10', '16,10',
    '1,0', '2,0', '2,1', '3,1',
    '17,19', '18,19', '18,20', '19,20',
    '16,3', '17,3', '17,4',
    '3,17', '4,17', '4,18',
  ]);

  // 古老神社青石板参道（沿斜向主战轴线点缀）
  const shrineTiles = new Set([
    '-2,6', '-1,6', '-1,7',
    '10,10', '11,10',
    '21,13', '22,13', '22,14',
  ]);

  // 战略玄石全阻挡岩柱（精简中央主战带密度，保留 (6,6) 单测基准点与疏朗战术卡点）
  const rocks = new Set([
    '6,6', '14,14',
    '14,4', '6,16', '17,9',
  ]);

  // 暗夜灵竹林半遮挡与步兵减速区（疏通中央走廊，保留 (6,14) 单测基准点与翼侧林缘掩体）
  const forests = new Set([
    '6,14', '14,6',
    '8,16', '12,4', '5,3', '15,17',
    '1,5', '19,15', '11,1', '9,19',
  ]);

  // 中央与翼侧暗夜灵泉水域（(8,10) 为单测飞行悬停点，飞行单位可直接飞越并悬停）
  const waters = new Set([
    '8,10', '9,10', '11,10', '12,10', '9,11', '11,9',
    '15,6', '16,6', '4,15', '5,15',
  ]);

  // 在斜向投影下扫描宽广候选网格，按屏幕地面有机不规则轮廓裁切出近千格自然战场！
  for (let row = -18; row <= 38; row++) {
    for (let col = -16; col <= 36; col++) {
      const coord = offsetToAxial(col, row);
      const px = hexToPixel(coord, SHRINE_FIELD_PROJECTION, 1);

      // 归一化至地面可视范围：x ∈ [34..846]（宽 812px），y ∈ [132..474]（高 342px）
      const nx = (px.x - 440) / 402;
      const ny = (px.y - 304) / 168;
      const angle = Math.atan2(ny, nx);
      // 多频自然起伏：林间空地海湾凹口 + 突出草坡，彻底告别死板矩形！
      const organicRadius =
        1.0 +
        0.052 * Math.sin(angle * 3 + 0.65) +
        0.038 * Math.cos(angle * 5 - 1.15) +
        0.024 * Math.sin(angle * 7 + 2.2);
      // 指数 3.1 的柔角超椭圆：既充分填满地面四角，又有自然起伏的林缘呼吸留白
      const superDist = Math.pow(
        Math.pow(Math.abs(nx), 3.1) + Math.pow(Math.abs(ny), 3.1),
        1 / 3.1,
      );

      if (superDist > organicRadius || px.x < 28 || px.x > 852 || px.y < 126 || px.y > 476) {
        continue;
      }

      const tag = `${col},${row}`;
      let terrain: TerrainType = 'plain';
      let elevation = 1;
      let blocksGround = false;
      let losObstruction: 'none' | 'partial' | 'full' = 'none';
      let moveCost = 1;

      if (rocks.has(tag)) {
        terrain = 'rock';
        elevation = 3;
        blocksGround = true;
        losObstruction = 'full';
        moveCost = 99;
      } else if (waters.has(tag)) {
        terrain = 'water';
        elevation = 0;
        blocksGround = true;
        losObstruction = 'none';
        moveCost = 99;
      } else if (highlands.has(tag)) {
        terrain = 'highland';
        elevation = 2;
        moveCost = 1;
      } else if (forests.has(tag)) {
        terrain = 'forest';
        elevation = 1;
        losObstruction = 'partial';
        moveCost = 2;
      } else if (shrineTiles.has(tag)) {
        terrain = 'shrine_tile';
        elevation = 1;
        moveCost = 1;
      }

      const decorSeed = ((col + 31) * 73856093) ^ ((row + 29) * 19349663);
      tiles[hexKey(coord)] = {
        q: coord.q,
        r: coord.r,
        terrain,
        elevation,
        blocksGround,
        losObstruction,
        moveCost,
        decorSeed: decorSeed >>> 0,
      };
    }
  }

  return { width, height, tiles };
}

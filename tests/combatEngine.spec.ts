/**
 * 《Touhou-H4》核心战斗引擎 Vitest 自动化规则测试套件
 * 覆盖：阵营关系轮、尖顶六边形数学与远程视线遮挡 (LoS)、飞行与路径诊断、
 * 两阶段同时反击与先攻、单次反击、远程前卫替伤、强制近战、高台地形、多格碰撞体积与擦弹机制。
 */

import { describe, expect, it } from 'vitest';
import {
  computeArmyAlignmentMorale,
  getAdjacentMagicAlignments,
  getAlignmentRelation,
} from '@core/alignment';
import {
  buildSpellTrajectoryPreview,
  checkRangedCapability,
  checkSpellLineOfSight,
  createBattleState,
  dispatchCombatCommand,
  evaluateRangedRetaliation,
  findUnitAtHex,
  getTerrainTacticalInfo,
  getUnitOccupiedHexes,
  getUnitReachableMap,
  previewAttack,
} from '@core/combatEngine';
import {
  evaluateLineOfSight,
  getFootprintHexes,
  hexDistance,
  hexKey,
  hexRay,
  hexToPixel,
  offsetToAxial,
  pixelToHex,
} from '@core/hex';
import { createReimuVsMarisaBattle, TOUHOU_CATALOG } from '@data/battlePresets';
import { buildShrineNightBattleMap, SHRINE_FIELD_PROJECTION } from '@data/definitions';
import { buildUnitSpecialtyBadges, buildUnitStatusBadges } from '@ui/hudMetadata';
import { clearMapObstacles, clearRowToPlain, flattenAllMapTiles } from './helpers/testUtils';

describe('HoMM4 五角星 + 圆心力量阵营关系轮', () => {
  it('生命应与死亡、混沌敌对，与秩序、自然结盟', () => {
    expect(getAlignmentRelation('life', 'death')).toBe('enemy');
    expect(getAlignmentRelation('life', 'chaos')).toBe('enemy');
    expect(getAlignmentRelation('life', 'order')).toBe('allied');
    expect(getAlignmentRelation('life', 'nature')).toBe('allied');
    expect(getAlignmentRelation('life', 'life')).toBe('same');
  });

  it('力量位于圆心，应与全部五大魔法阵营互为盟友', () => {
    for (const m of ['life', 'order', 'death', 'chaos', 'nature'] as const) {
      expect(getAlignmentRelation('might', m)).toBe('allied');
      expect(getAlignmentRelation(m, 'might')).toBe('allied');
    }
  });

  it('城镇相邻魔法副塔与混编士气计算应准确无误', () => {
    expect(getAdjacentMagicAlignments('life').sort()).toEqual(['nature', 'order']);
    expect(getAdjacentMagicAlignments('might')).toEqual([]);

    expect(computeArmyAlignmentMorale(['life', 'life']).moraleDelta).toBe(1);
    expect(computeArmyAlignmentMorale(['life', 'order', 'might']).moraleDelta).toBe(-2);
    expect(computeArmyAlignmentMorale(['life', 'chaos']).moraleDelta).toBeLessThanOrEqual(-3);
  });
});

describe('尖顶六边形数学与远程视线遮挡 (LoS)', () => {
  it('平地高耸岩柱应完全阻挡射击视线，高地或清晰路径可穿透', () => {
    const map = buildShrineNightBattleMap();
    const tiles = new Map(Object.entries(map.tiles));
    const emptyOcc = new Set<string>();

    // (5,6) 射向 (7,6) 途经 (6,6) 玄石岩柱，应完全阻挡
    const fromRockLeft = offsetToAxial(5, 6);
    const toRockRight = offsetToAxial(7, 6);
    const blocked = evaluateLineOfSight(fromRockLeft, toRockRight, tiles, emptyOcc);
    expect(blocked.canShoot).toBe(false);
    expect(blocked.status).toBe('blocked');

    // (5,14) 射向 (7,14) 途经 (6,14) 灵竹林，应为半遮挡减伤
    const partial = evaluateLineOfSight(
      offsetToAxial(5, 14),
      offsetToAxial(7, 14),
      tiles,
      emptyOcc,
    );
    expect(partial.canShoot).toBe(true);
    expect(partial.status).toBe('partial');
    expect(partial.losMultiplier).toBeLessThan(1);

    // 《极限火花》六边形射线在 21×21 宽阔战场应可直穿 14 格
    const ray = hexRay(offsetToAxial(19, 10), offsetToAxial(15, 10), 14, (c) => tiles.has(hexKey(c)));
    expect(ray.length).toBeGreaterThanOrEqual(13);
    expect(hexDistance(offsetToAxial(19, 10), ray[ray.length - 1])).toBe(ray.length);
  });

  it('斜 45° 铺满地面的广阔不规则自然轮廓战场（>900格）全部地块投影与反算轴坐标应 100% 精准一致', () => {
    const map = buildShrineNightBattleMap();
    const tiles = new Map(Object.entries(map.tiles));
    // 严格验证：保持斜向视角 rotationRad < 0、地块数真正大幅扩增至 900+ 格且预设全员站位均在合法平地上！
    expect(SHRINE_FIELD_PROJECTION.rotationRad).toBeLessThan(-0.4);
    expect(tiles.size).toBeGreaterThan(900);

    for (const tile of tiles.values()) {
      const px = hexToPixel(tile, SHRINE_FIELD_PROJECTION, tile.elevation);
      const back = pixelToHex(px.x, px.y, SHRINE_FIELD_PROJECTION, tiles);
      expect(back).toEqual({ q: tile.q, r: tile.r });
    }

    // 校验预设编队所有单位（含 1×2 / 2×1 / 2×2 多格单位）出生占据格均合法且不落在障碍上
    const { state } = createReimuVsMarisaBattle({ mode: 'vs_ai', seed: 101 });
    for (const u of Object.values(state.units)) {
      for (const h of getUnitOccupiedHexes(u)) {
        const t = state.tiles[hexKey(h)];
        expect(t).toBeDefined();
        expect(t.blocksGround).toBe(false);
      }
    }
  });

  it('HoMM4 远程四阶衰减（1x / 1/2 / 1/4 / 1/8）：普通障碍降级而不阻挡，高耸障碍与任意单位同时阻挡远程与施法', () => {
    const map = buildShrineNightBattleMap();
    // 沿 row=12 空旷直线测试：向日葵妖精（range=7, maxMana=16）与博丽灵梦，中间穿行或置入普通障碍/单位/高耸障碍
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'sunflower_fairy', count: 20, col: 3, row: 12 },
          { kind: 'hero', defId: 'hero_reimu', count: 1, col: 3, row: 14 },
          { kind: 'creature', defId: 'kedama', count: 6, col: 10, row: 16 },
        ],
        rightSlots: [{ kind: 'creature', defId: 'kedama', count: 20, col: 8, row: 12 }],
        controllers: { left: 'human', right: 'human' },
      },
      TOUHOU_CATALOG,
    );

    const fairy = Object.values(state.units).find((u) => u.defId === 'sunflower_fairy')!;
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const blockerAlly = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'kedama')!;
    const target = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'kedama')!;

    // 施法系小兵应具备真实满蓝池
    expect(fairy.baseStats.maxMana).toBeGreaterThan(0);
    expect(fairy.mana).toBe(fairy.baseStats.maxMana);

    // 1. 距离 5 格 ≤ range(7) 且无障碍：默认全伤 1x
    const pFull = previewAttack(state, fairy.id, target.id, TOUHOU_CATALOG);
    expect(pFull.valid).toBe(true);
    expect(pFull.isRanged).toBe(true);
    expect(pFull.rangedPenaltyTier).toBe('full');
    expect(pFull.rangedMultiplier).toBe(1);

    // 2. 距离 11 格 (7 < 11 ≤ 14) 且无障碍：半伤衰减 1/2
    target.pos = offsetToAxial(14, 12);
    const pHalf = previewAttack(state, fairy.id, target.id, TOUHOU_CATALOG);
    expect(pHalf.valid).toBe(true);
    expect(pHalf.rangedPenaltyTier).toBe('half');
    expect(pHalf.rangedMultiplier).toBe(0.5);
    expect(pHalf.expectedMaxDamage).toBeLessThan(pFull.expectedMaxDamage);

    // 3. 距离 16 格 (> 14) 且无障碍：距离衰减至 1/4
    target.pos = offsetToAxial(19, 12);
    const pQuarter = previewAttack(state, fairy.id, target.id, TOUHOU_CATALOG);
    expect(pQuarter.valid).toBe(true);
    expect(pQuarter.rangedPenaltyTier).toBe('quarter');
    expect(pQuarter.rangedMultiplier).toBe(0.25);

    // 4. 在连线上 (6, 12) 放入普通障碍物（竹林 partial）：
    //    - 远程绝不被完全阻挡，而是从 1/4 进一步降级至 1/8！
    const midTile = state.tiles[hexKey(offsetToAxial(6, 12))];
    midTile.terrain = 'forest';
    midTile.losObstruction = 'partial';
    const pEighth = previewAttack(state, fairy.id, target.id, TOUHOU_CATALOG);
    expect(pEighth.valid).toBe(true);
    expect(pEighth.rangedPenaltyTier).toBe('eighth');
    expect(pEighth.rangedMultiplier).toBe(0.125);
    expect(pEighth.expectedMaxDamage).toBeLessThan(pQuarter.expectedMaxDamage);

    // 5. 施法不受普通障碍物（(6, 14) 竹林）阻挡！灵梦 (3,14) 隔着 (6,14) 竹林向 (9,14) 敌军施法应完全畅通
    target.pos = offsetToAxial(9, 14);
    expect(checkSpellLineOfSight(state, reimu, [target.pos], target).canCast).toBe(true);

    // 6. 所有存活单位均算作高耸障碍物：把友军毛玉放进 (6, 14) 挡在线上，远程射击与施法均应被彻底阻挡！
    blockerAlly.pos = offsetToAxial(6, 14);
    expect(checkSpellLineOfSight(state, reimu, [target.pos], target).canCast).toBe(false);
    state.activeUnitId = reimu.id;
    const blockedSpell = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'life_holy_word', targetUnitId: target.id },
      TOUHOU_CATALOG,
    );
    expect(blockedSpell.ok).toBe(false);
    expect(blockedSpell.error).toContain('阻挡');

    // 同样地，(3, 14) 的灵梦隔着 (6, 14) 存活单位无法远程射击 (9, 14) 的敌军
    const blockedShot = previewAttack(state, reimu.id, target.id, TOUHOU_CATALOG);
    expect(blockedShot.isRanged).toBe(false);

    // 7. 高耸玄石柱 (6, 6) 同样阻挡 (4, 6) -> (8, 6) 的施法
    reimu.pos = offsetToAxial(4, 6);
    target.pos = offsetToAxial(8, 6);
    expect(checkSpellLineOfSight(state, reimu, [target.pos], target).canCast).toBe(false);
  });

  it('H4 飞行单位应无视城墙以外的一切地形障碍（岩柱/水域/森林）、单位阻挡与减速，且被城墙阻挡', () => {
    const map = buildShrineNightBattleMap();
    // 在 (5, 14) 放飞行单位（向日葵妖精 speed=6），右侧紧邻 (6, 14) 森林(moveCost=2)
    // 另在 (5, 6) 放飞行单位测试飞越 (6, 6) 玄石岩柱，并把 (4, 6) 临时设为城墙测试城墙阻挡！
    map.tiles[hexKey(offsetToAxial(4, 6))].terrain = 'wall';
    map.tiles[hexKey(offsetToAxial(4, 6))].blocksGround = true;

    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'sunflower_fairy', count: 8, col: 5, row: 6 },
          { kind: 'creature', defId: 'kedama', count: 8, col: 5, row: 14 },
        ],
        rightSlots: [{ kind: 'creature', defId: 'sunflower_fairy', count: 8, col: 5, row: 13 }],
        controllers: { left: 'human', right: 'human' },
      },
      TOUHOU_CATALOG,
    );

    const flyer = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'sunflower_fairy')!;
    const flyerReach = getUnitReachableMap(state, flyer, TOUHOU_CATALOG);

    // 1. 直线飞越 (6, 6) 岩柱直达 (7, 6) 仅耗 2 步（不绕路！），但不可降落在岩柱 (6, 6) 内部
    expect(flyerReach.costs.has(hexKey(offsetToAxial(6, 6)))).toBe(false);
    expect(flyerReach.costs.get(hexKey(offsetToAxial(7, 6)))).toBe(2);

    // 2. 城墙 (4, 6) 不可穿行也不可落脚
    expect(flyerReach.costs.has(hexKey(offsetToAxial(4, 6)))).toBe(false);

    // 3. 飞行单位穿越森林 (6, 14) 仅消耗 1 点移动力（无视减速！），且可悬停于中央水面 (8, 10)
    const flyer2 = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'sunflower_fairy')!;
    const flyer2Reach = getUnitReachableMap(state, flyer2, TOUHOU_CATALOG);
    expect(flyer2Reach.costs.get(hexKey(offsetToAxial(6, 14)))).toBe(1);
    expect(flyer2Reach.costs.has(hexKey(offsetToAxial(8, 10)))).toBe(true);

    // 4. 对比：陆地单位毛玉在 (5, 14) 踏入 (6, 14) 森林必须支付 moveCost = 2 减速惩罚
    const ground = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const groundReach = getUnitReachableMap(state, ground, TOUHOU_CATALOG);
    expect(groundReach.costs.get(hexKey(offsetToAxial(6, 14)))).toBe(2);
  });

  it('远程射击与施法飞行路径诊断：精确识别高耸玄石碑、中间单位、灵竹林半遮挡与超射程截断原因', () => {
    const map = buildShrineNightBattleMap();
    flattenAllMapTiles(map.tiles, 1);

    // 在 (7, 10) 放置一座高耸玄石碑
    const rockHex = offsetToAxial(7, 10);
    const rockTile = map.tiles[hexKey(rockHex)]!;
    rockTile.terrain = 'rock';
    rockTile.elevation = 3;
    rockTile.blocksGround = true;
    rockTile.losObstruction = 'full';
    expect(getTerrainTacticalInfo(rockTile).name).toBe('高耸玄石碑');

    // 在 (7, 8) 放置一片灵竹林（普通障碍，半遮挡远程、不阻挡施法）
    const forestHex = offsetToAxial(7, 8);
    const forestTile = map.tiles[hexKey(forestHex)]!;
    forestTile.terrain = 'forest';
    forestTile.elevation = 1;
    forestTile.losObstruction = 'partial';
    forestTile.moveCost = 2;

    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'ofuda_archer', count: 10, col: 4, row: 10 },
          { kind: 'creature', defId: 'broom_caster', count: 10, col: 4, row: 8 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'kedama', count: 20, col: 10, row: 10 },
          { kind: 'creature', defId: 'kedama', count: 20, col: 10, row: 8 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 8801,
      },
      TOUHOU_CATALOG,
    );

    const archer = Object.values(state.units).find((u) => u.defId === 'ofuda_archer')!;
    const caster = Object.values(state.units).find((u) => u.defId === 'broom_caster')!;
    const enemyBehindRock = Object.values(state.units).find(
      (u) => u.side === 'right' && u.pos.r === rockHex.r,
    )!;
    const enemyBehindForest = Object.values(state.units).find(
      (u) => u.side === 'right' && u.pos.r === forestHex.r,
    )!;

    // 1A. 远程射击被高耸玄石碑阻挡但近战可绕行：转为近战突击，并保留明确 rangedBlockReason 说明为何未能远程
    const rockMeleeFallback = previewAttack(state, archer.id, enemyBehindRock.id, TOUHOU_CATALOG);
    expect(rockMeleeFallback.valid).toBe(true);
    expect(rockMeleeFallback.isRanged).toBe(false);
    expect(rockMeleeFallback.rangedBlockReason).toContain('高耸玄石碑');

    // 1B. 远程被高耸玄石碑阻挡且近战超出移动范围：返回带红色拦截点与明确玄石碑原因的 trajectory
    archer.baseStats.speed = 2;
    const rockPreview = previewAttack(state, archer.id, enemyBehindRock.id, TOUHOU_CATALOG);
    expect(rockPreview.valid).toBe(false);
    expect(rockPreview.trajectory?.blocked).toBe(true);
    expect(rockPreview.trajectory?.blockingHex).toEqual(rockHex);
    expect(rockPreview.reason).toContain('高耸玄石碑');

    // 2. 远程射击穿过灵竹林：可命中且标出半遮挡障碍格
    archer.pos = offsetToAxial(4, 8);
    caster.pos = offsetToAxial(4, 10);
    const forestPreview = previewAttack(state, archer.id, enemyBehindForest.id, TOUHOU_CATALOG);
    expect(forestPreview.valid).toBe(true);
    expect(forestPreview.isRanged).toBe(true);
    expect(forestPreview.trajectory?.blocked).toBe(false);
    expect(forestPreview.trajectory?.partialHexes.length).toBeGreaterThan(0);

    // 3. 施法被高耸玄石碑阻挡：buildSpellTrajectoryPreview 精确标注阻挡格与中文原因
    const magicArrow = TOUHOU_CATALOG.spells.chaos_magic_arrow;
    const spellBlocked = buildSpellTrajectoryPreview(
      state,
      caster,
      magicArrow,
      enemyBehindRock.pos,
      enemyBehindRock,
      10,
    );
    expect(spellBlocked?.blocked).toBe(true);
    expect(spellBlocked?.blockingHex).toEqual(rockHex);
    expect(spellBlocked?.reason).toContain('高耸玄石碑');

    // 4. 施法超出射程：标记 outOfRange 与明确距离/上限说明
    const spellOutOfRange = buildSpellTrajectoryPreview(
      state,
      caster,
      magicArrow,
      enemyBehindForest.pos,
      enemyBehindForest,
      3,
    );
    expect(spellOutOfRange?.blocked).toBe(true);
    expect(spellOutOfRange?.outOfRange?.maxRange).toBe(3);
    expect(spellOutOfRange?.reason).toContain('超出施法射程');
  });
});

describe('HoMM4 两阶段同时反击、先攻、不受反击与远程互射', () => {
  it('普通近战交锋应采用同时反击：防守方即使被全灭，仍以出手前满编数量打回反击', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'creature', defId: 'shrine_guardian_golem', count: 12, col: 3, row: 4 }],
        rightSlots: [{ kind: 'creature', defId: 'kedama', count: 6, col: 4, row: 4 }],
        controllers: { left: 'human', right: 'human' },
        seed: 42,
      },
      TOUHOU_CATALOG,
    );

    const golemId = Object.keys(state.units).find((id) => id.includes('golem'))!;
    const kedamaId = Object.keys(state.units).find((id) => id.includes('kedama'))!;
    // 强制让石狮子先手攻击毛玉
    state.activeUnitId = golemId;

    const preview = previewAttack(state, golemId, kedamaId, TOUHOU_CATALOG);
    expect(preview.exchangeMode).toBe('simultaneous');
    expect(preview.willRetaliate).toBe(true);

    const res = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: golemId, targetId: kedamaId },
      TOUHOU_CATALOG,
    );
    expect(res.ok).toBe(true);
    const exchange = res.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(exchange?.type).toBe('COMBAT_EXCHANGE');
    if (exchange?.type === 'COMBAT_EXCHANGE') {
      // 毛玉虽然被 12 只石狮子一击全灭，但因为 H4 同时反击，仍成功打出了反击伤害！
      expect(state.units[kedamaId].status).toBe('dead');
      expect(exchange.defenderStrike).not.toBeNull();
      expect(exchange.defenderStrike!.damage).toBeGreaterThan(0);
    }
  });

  it('先攻单位（非想天则）一击全灭低血敌军时，敌军无法反击', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'creature', defId: 'hisoutensoku', count: 2, col: 1, row: 4 }],
        rightSlots: [{ kind: 'creature', defId: 'kedama', count: 2, col: 4, row: 4 }],
        controllers: { left: 'human', right: 'human' },
        seed: 7,
      },
      TOUHOU_CATALOG,
    );

    const sokuId = Object.keys(state.units).find((id) => id.includes('hisoutensoku'))!;
    const kedamaId = Object.keys(state.units).find((id) => id.includes('kedama'))!;
    state.activeUnitId = sokuId;

    const res = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: sokuId, targetId: kedamaId },
      TOUHOU_CATALOG,
    );
    expect(res.ok).toBe(true);
    const exchange = res.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    if (exchange?.type === 'COMBAT_EXCHANGE') {
      expect(exchange.mode).toBe('attacker_first');
      expect(state.units[kedamaId].status).toBe('dead');
      expect(exchange.defenderStrike).toBeNull();
    }
  });

  it('高台机制：近战高打低不增伤且支持自选落脚格；低处远程仰射高台目标时伤害精确减少 25%', () => {
    const map = buildShrineNightBattleMap();
    // 清除视线阻挡，仅保留 (8,3) 为高台 (elevation=2)，其余为平地 (elevation=1)
    clearMapObstacles(map.tiles, { includePartialLos: true, resetMoveCost: true });
    const highlandApproach = offsetToAxial(8, 3);
    const plainApproach = offsetToAxial(7, 4);
    expect(map.tiles[hexKey(highlandApproach)].elevation).toBe(2);
    expect(map.tiles[hexKey(plainApproach)].elevation).toBe(1);

    // 1. 近战自选高地邻格 vs 平地邻格：精确落位到选定格，且高打低不再增伤
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'creature', defId: 'kedama', count: 14, col: 6, row: 3 }],
        rightSlots: [{ kind: 'creature', defId: 'kedama', count: 14, col: 8, row: 4 }],
        controllers: { left: 'human', right: 'human' },
        seed: 55,
      },
      TOUHOU_CATALOG,
    );

    const kedamaId = Object.keys(state.units).find((id) => id.startsWith('left_'))!;
    const targetId = Object.keys(state.units).find((id) => id.startsWith('right_'))!;
    state.activeUnitId = kedamaId;

    const highPreview = previewAttack(state, kedamaId, targetId, TOUHOU_CATALOG, highlandApproach);
    const plainPreview = previewAttack(state, kedamaId, targetId, TOUHOU_CATALOG, plainApproach);

    expect(highPreview.valid).toBe(true);
    expect(plainPreview.valid).toBe(true);
    expect(highPreview.highGroundBonus).toBe(false);
    expect(plainPreview.highGroundBonus).toBe(false);
    expect(highPreview.expectedMaxDamage).toBe(plainPreview.expectedMaxDamage);

    // 执行指定从高地落脚进攻，验证单位确实落到 (8,3) 高地格上！
    const res = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: kedamaId, targetId, moveTo: highlandApproach },
      TOUHOU_CATALOG,
    );
    expect(res.ok).toBe(true);
    expect(state.units[kedamaId].pos).toEqual(highlandApproach);

    // 2. 低处远程仰射高台目标：远程伤害精确减少 25%（×0.75）；高台俯射低处不增伤
    const { state: rState } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'creature', defId: 'ofuda_archer', count: 20, col: 4, row: 3 }],
        rightSlots: [{ kind: 'creature', defId: 'kedama', count: 30, col: 8, row: 3 }],
        controllers: { left: 'human', right: 'human' },
        seed: 56,
      },
      TOUHOU_CATALOG,
    );
    const archer = Object.values(rState.units).find((u) => u.defId === 'ofuda_archer')!;
    const defender = Object.values(rState.units).find((u) => u.defId === 'kedama')!;

    // 目标在高台 (8,3)，射手在平地 (4,3)
    const lowToHigh = previewAttack(rState, archer.id, defender.id, TOUHOU_CATALOG);
    expect(lowToHigh.valid).toBe(true);
    expect(lowToHigh.isRanged).toBe(true);
    expect(lowToHigh.highGroundBonus).toBe(true);
    expect(lowToHigh.notes.some((n) => n.includes('-25%'))).toBe(true);

    // 目标移至平地 (8,4)，对比等距无高台掩护的平射伤害
    defender.pos = offsetToAxial(8, 4);
    const plainShot = previewAttack(rState, archer.id, defender.id, TOUHOU_CATALOG);
    expect(plainShot.highGroundBonus).toBe(false);
    expect(lowToHigh.expectedMaxDamage / plainShot.expectedMaxDamage).toBeCloseTo(0.75, 1);

    // 射手站上高台 (8,3) 射低处平地 (4,3)：不再额外增伤（维持 1.0 倍）
    archer.pos = offsetToAxial(8, 3);
    defender.pos = offsetToAxial(4, 3);
    const highToLow = previewAttack(rState, archer.id, defender.id, TOUHOU_CATALOG);
    expect(highToLow.highGroundBonus).toBe(false);
    expect(highToLow.expectedMaxDamage).toBe(plainShot.expectedMaxDamage);
  });

  it('近战禁手（noMelee）正面机制与远程禁手（noRanged）：贴脸主动仍为远程，挨打保留 -60% 衰减近战反击', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'creature', defId: 'grimoire_familiar', count: 8, col: 4, row: 10 }],
        rightSlots: [{ kind: 'creature', defId: 'kedama', count: 8, col: 6, row: 10 }],
        controllers: { left: 'human', right: 'human' },
      },
      TOUHOU_CATALOG,
    );

    const grimoire = Object.values(state.units).find((u) => u.defId === 'grimoire_familiar')!;
    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;

    // 1. 贴脸时禁忌之书（近战禁手）主动攻击仍为远程射击，强制主动近战会被拦截
    const rangedWhileAdjacent = previewAttack(state, grimoire.id, kedama.id, TOUHOU_CATALOG);
    expect(rangedWhileAdjacent.valid).toBe(true);
    expect(rangedWhileAdjacent.isRanged).toBe(true);

    const meleeTry = previewAttack(state, grimoire.id, kedama.id, TOUHOU_CATALOG, grimoire.pos);
    expect(meleeTry.valid).toBe(false);
    expect(meleeTry.reason).toContain('近战禁手');

    // 2. 遭到敌军近战打击时仍会发动近战反击，且按无「近战无衰减」射手规则承受 -60% 衰减（40% 伤害）
    const kedamaAtk = previewAttack(state, kedama.id, grimoire.id, TOUHOU_CATALOG);
    expect(kedamaAtk.valid).toBe(true);
    expect(kedamaAtk.willRetaliate).toBe(true);
    expect(kedamaAtk.retaliationMaxDamage).toBeGreaterThan(0);

    grimoire.abilities.noMeleePenalty = true;
    const fullRetAtk = previewAttack(state, kedama.id, grimoire.id, TOUHOU_CATALOG);
    grimoire.abilities.noMeleePenalty = false;
    expect(kedamaAtk.retaliationMaxDamage / fullRetAtk.retaliationMaxDamage).toBeCloseTo(0.4, 1);

    // 3. UI 特技极性应归属正面 Buff（positive）而非负面 Debuff
    const noMeleeBadge = buildUnitSpecialtyBadges(grimoire).find((b) => b.id === 'noMelee');
    expect(noMeleeBadge?.polarity).toBe('positive');

    // 4. 拉开距离并施加远程禁手后，既无法远程射击也无法近战攻击
    kedama.pos = offsetToAxial(11, 10);
    expect(previewAttack(state, grimoire.id, kedama.id, TOUHOU_CATALOG).valid).toBe(true);
    grimoire.abilities.noRanged = true;
    expect(previewAttack(state, grimoire.id, kedama.id, TOUHOU_CATALOG).valid).toBe(false);
  });

  it('远程单位主动切换近战（forceMelee）：有远程且未近战禁手可强制贴身近战不扣弹药，近战禁手单位严格禁止', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_reimu', col: 5, row: 10 },
          { kind: 'creature', defId: 'grimoire_familiar', count: 5, col: 4, row: 12 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'starfire_efreet', count: 10, col: 8, row: 10 },
          { kind: 'creature', defId: 'starfire_efreet', count: 10, col: 25, row: 10 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 7100,
      },
      TOUHOU_CATALOG,
    );

    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const tome = Object.values(state.units).find((u) => u.defId === 'grimoire_familiar')!;
    const enemies = Object.values(state.units)
      .filter((u) => u.side === 'right')
      .sort((a, b) => a.pos.q - b.pos.q);
    const nearEnemy = enemies[0]!;
    const farEnemy = enemies[1]!;

    // 1. 默认模式：有远程且视线通畅时优先走远程射击
    const defaultPreview = previewAttack(state, reimu.id, nearEnemy.id, TOUHOU_CATALOG, undefined, false);
    expect(defaultPreview.valid).toBe(true);
    expect(defaultPreview.isRanged).toBe(true);

    // 2. 切换强制近战模式：近处敌人切换为近战移动突击，远处够不到的敌人不可回退成远程！
    const meleePreviewNear = previewAttack(state, reimu.id, nearEnemy.id, TOUHOU_CATALOG, undefined, true);
    expect(meleePreviewNear.valid).toBe(true);
    expect(meleePreviewNear.isRanged).toBe(false);

    const meleePreviewFar = previewAttack(state, reimu.id, farEnemy.id, TOUHOU_CATALOG, undefined, true);
    expect(meleePreviewFar.valid).toBe(false);
    expect(meleePreviewFar.isRanged).toBe(false);
    expect(meleePreviewFar.reason).toContain('近战移动范围');

    // 3. 正式派发 forceMelee 攻击：走近战交锋且不消耗弹药
    const ammoBefore = reimu.ammo;
    state.activeUnitId = reimu.id;
    const attackRes = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: reimu.id, targetId: nearEnemy.id, forceMelee: true },
      TOUHOU_CATALOG,
    );
    expect(attackRes.ok).toBe(true);
    expect(reimu.ammo).toBe(ammoBefore);
    const ex = attackRes.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(ex?.type === 'COMBAT_EXCHANGE' && ex.attackerStrike?.isRanged).toBe(false);

    // 4. 带近战禁手（noMelee）的远程兵种绝不允许强制近战
    expect(tome.abilities.ranged).toBe(true);
    expect(tome.abilities.noMelee).toBe(true);
    const tomeMeleePreview = previewAttack(state, tome.id, nearEnemy.id, TOUHOU_CATALOG, undefined, true);
    expect(tomeMeleePreview.valid).toBe(false);
    expect(tomeMeleePreview.reason).toContain('近战禁手');
  });

  it('HoMM4 每回合单次反击规则：普通单位近战与远程共用 1 次反击、无限反击特技不限次数、跨回合自动刷新', () => {
    const map = buildShrineNightBattleMap();
    flattenAllMapTiles(map.tiles);
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'kedama', count: 50, col: 5, row: 10 },
          { kind: 'creature', defId: 'exorcist_blade', count: 2, col: 5, row: 11 },
          { kind: 'creature', defId: 'ofuda_archer', count: 4, col: 2, row: 14 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'hourai_doll', count: 30, col: 6, row: 10 },
          { kind: 'creature', defId: 'broom_caster', count: 25, col: 8, row: 14 },
          { kind: 'creature', defId: 'miasma_nightmare', count: 4, col: 6, row: 9 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 7900,
      },
      TOUHOU_CATALOG,
    );

    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const blade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const archer = Object.values(state.units).find((u) => u.defId === 'ofuda_archer')!;
    const doll = Object.values(state.units).find((u) => u.defId === 'hourai_doll')!;
    const broom = Object.values(state.units).find((u) => u.defId === 'broom_caster')!;
    const nightmare = Object.values(state.units).find((u) => u.defId === 'miasma_nightmare')!;
    // 禁用格挡/定身/震慑，纯测反击次数
    doll.abilities.block = false;
    kedama.abilities.stunOnHit = false;
    nightmare.abilities.terrorOnHit = false;

    // 1. 普通单位（武装人形）首次遭近战打击会反击并消耗本回合配额，同回合第二次遭近战打击时不再反击！
    state.activeUnitId = kedama.id;
    const hit1 = dispatchCombatCommand(state, { type: 'ATTACK', unitId: kedama.id, targetId: doll.id }, TOUHOU_CATALOG);
    expect(hit1.ok).toBe(true);
    const ex1 = hit1.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(ex1?.type === 'COMBAT_EXCHANGE' && ex1.defenderStrike).not.toBeNull();
    expect(doll.hasRetaliatedThisRound).toBe(true);
    // 状态栏应正确显示「本回合已反击」微标且零括号
    const retBadge = buildUnitStatusBadges(doll, state).find((b) => b.id === 'status_retaliated');
    expect(retBadge).toBeDefined();
    expect(retBadge?.tooltip.badges?.length).toBeGreaterThan(0);

    const prevHit2 = previewAttack(state, blade.id, doll.id, TOUHOU_CATALOG);
    expect(prevHit2.valid).toBe(true);
    expect(prevHit2.willRetaliate).toBe(false);
    expect(prevHit2.exchangeMode).toBe('one_way');
    state.activeUnitId = blade.id;
    const hit2 = dispatchCombatCommand(state, { type: 'ATTACK', unitId: blade.id, targetId: doll.id }, TOUHOU_CATALOG);
    expect(hit2.ok).toBe(true);
    const ex2 = hit2.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(ex2?.type === 'COMBAT_EXCHANGE' && ex2.defenderStrike).toBeNull();

    // 2. 普通远程单位（魔法使）首次遭远程射击触发远程反击后，同回合再遭近战或远程均不再反击（近战/远程共用 1 次）！
    archer.abilities.rangedFirstStrike = false;
    state.activeUnitId = archer.id;
    const rHit1 = dispatchCombatCommand(state, { type: 'ATTACK', unitId: archer.id, targetId: broom.id }, TOUHOU_CATALOG);
    expect(rHit1.ok).toBe(true);
    const rEx1 = rHit1.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(rEx1?.type === 'COMBAT_EXCHANGE' && rEx1.defenderStrike).not.toBeNull();
    expect(broom.hasRetaliatedThisRound).toBe(true);
    // 同回合内魔法使被近战攻击也不得再反击
    const meleeAfterRanged = previewAttack(state, blade.id, broom.id, TOUHOU_CATALOG);
    expect(meleeAfterRanged.valid).toBe(true);
    expect(meleeAfterRanged.willRetaliate).toBe(false);

    // 3. 拥有「无限反击」的博丽毛玉同一回合内连续遭武装人形与梦境兽两次攻击，两次都必须触发反击！
    state.activeUnitId = doll.id;
    const kHit1 = dispatchCombatCommand(state, { type: 'ATTACK', unitId: doll.id, targetId: kedama.id }, TOUHOU_CATALOG);
    expect(kHit1.ok).toBe(true);
    const kEx1 = kHit1.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(kEx1?.type === 'COMBAT_EXCHANGE' && kEx1.defenderStrike).not.toBeNull();
    expect(kedama.hasRetaliatedThisRound).toBe(false);

    const prevKHit2 = previewAttack(state, nightmare.id, kedama.id, TOUHOU_CATALOG);
    expect(prevKHit2.valid).toBe(true);
    expect(prevKHit2.willRetaliate).toBe(true);
    state.activeUnitId = nightmare.id;
    const kHit2 = dispatchCombatCommand(state, { type: 'ATTACK', unitId: nightmare.id, targetId: kedama.id }, TOUHOU_CATALOG);
    expect(kHit2.ok).toBe(true);
    const kEx2 = kHit2.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(kEx2?.type === 'COMBAT_EXCHANGE' && kEx2.defenderStrike).not.toBeNull();

    // 4. 推进至下一回合后，普通单位（武装人形与魔法使）的反击配额自动刷新恢复！
    doll.hasRetaliatedThisRound = true;
    broom.hasRetaliatedThisRound = true;
    const roundBefore = state.round;
    for (const u of Object.values(state.units)) {
      u.hasActedThisRound = true;
    }
    state.turnQueue = [];
    state.waitQueue = [];
    broom.hasActedThisRound = false;
    state.activeUnitId = broom.id;
    const endRound = dispatchCombatCommand(state, { type: 'DEFEND', unitId: broom.id }, TOUHOU_CATALOG);
    expect(endRound.ok).toBe(true);
    expect(state.round).toBe(roundBefore + 1);
    expect(doll.hasRetaliatedThisRound).toBe(false);
    expect(broom.hasRetaliatedThisRound).toBe(false);
    expect(previewAttack(state, blade.id, doll.id, TOUHOU_CATALOG).willRetaliate).toBe(true);
  });

  it('原版 HoMM4 远程反击前卫替伤：紧邻前卫可越肩开火、敌方远程反击命中弹道首个友军并兼容远程先攻与净域护盾', () => {
    const map = buildShrineNightBattleMap();
    // 清理第 12 行的 (2..9, 12) 为平地，排除无关地形随机因素
    clearRowToPlain(map.tiles, 12, 2, 9);

    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          // 后排射手 B：向日葵妖精
          { kind: 'creature', defId: 'sunflower_fairy', count: 12, col: 2, row: 12 },
          // 紧邻前卫 C：毛玉站在 B 身前 1 格 (3, 12)
          { kind: 'creature', defId: 'kedama', count: 30, col: 3, row: 12 },
          // 备用前卫 C2：先放至远处 (2, 16) 不在弹道上
          { kind: 'creature', defId: 'exorcist_blade', count: 20, col: 2, row: 16 },
        ],
        rightSlots: [
          // 敌方远程 A：向日葵妖精站在 (8, 12)
          { kind: 'creature', defId: 'sunflower_fairy', count: 14, col: 8, row: 12 },
        ],
        controllers: { left: 'human', right: 'human' },
      },
      TOUHOU_CATALOG,
    );

    const shooterB = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'sunflower_fairy')!;
    const guardC = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'kedama')!;
    const guardC2 = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'exorcist_blade')!;
    const enemyA = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'sunflower_fairy')!;

    // 1. 己方后排射手 B 可越过紧邻友军前卫 C 射击敌方 A；但敌方 A 主动瞄准 B 时仍被 C 严密遮挡
    expect(checkRangedCapability(state, shooterB, enemyA, TOUHOU_CATALOG).canRanged).toBe(true);
    expect(checkRangedCapability(state, enemyA, shooterB, TOUHOU_CATALOG).canRanged).toBe(false);

    // 2. 攻击预览精准识别远程反击被前卫 C 替伤
    const prev = previewAttack(state, shooterB.id, enemyA.id, TOUHOU_CATALOG);
    expect(prev.valid).toBe(true);
    expect(prev.isRanged).toBe(true);
    expect(prev.willRetaliate).toBe(true);
    expect(prev.retaliationTargetId).toBe(guardC.id);
    expect(prev.retaliationTargetName).toBe(guardC.name);
    expect(prev.notes.some((n) => n.includes('前卫替伤'))).toBe(true);

    // 3. 正式交火（同时互射）：A 的远程反击全部打在替伤前卫 C 身上，后排射手 B 毫发无损！
    const bCountBefore = shooterB.count;
    const bHpBefore = shooterB.currentHp;
    const cCountBefore = guardC.count;
    const cHpBefore = guardC.currentHp;
    const aAmmoBefore = enemyA.ammo;

    state.activeUnitId = shooterB.id;
    const atkRes = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: shooterB.id, targetId: enemyA.id },
      TOUHOU_CATALOG,
    );
    expect(atkRes.ok).toBe(true);

    const exchangeEv = atkRes.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(exchangeEv && exchangeEv.type === 'COMBAT_EXCHANGE').toBe(true);
    if (exchangeEv && exchangeEv.type === 'COMBAT_EXCHANGE') {
      expect(exchangeEv.retaliationTargetId).toBe(guardC.id);
      expect(exchangeEv.defenderStrike?.defenderId).toBe(guardC.id);
      expect(exchangeEv.defenderStrike?.interceptedByUnitId).toBe(guardC.id);
      expect(exchangeEv.defenderStrike?.damage ?? 0).toBeGreaterThan(0);
    }

    // 射手 B 完全未受反击损伤；前卫 C 替 B 承伤；敌方 A 消耗 1 弹药并消耗本回合反击配额
    expect(shooterB.count).toBe(bCountBefore);
    expect(shooterB.currentHp).toBe(bHpBefore);
    expect(guardC.count < cCountBefore || guardC.currentHp < cHpBefore).toBe(true);
    expect(enemyA.ammo).toBe(aAmmoBefore - 1);
    expect(enemyA.hasRetaliatedThisRound).toBe(true);
    expect(state.actionLog.some((line) => line.includes('替伤挡下远程反击'))).toBe(true);

    // 4. 弹道上存在多个友军时，精准命中离反击者 A 最近的第一位友军 C2 (5, 12) 而非后方 C (3, 12)
    guardC2.pos = offsetToAxial(5, 12);
    const multiRet = evaluateRangedRetaliation(state, enemyA, shooterB, TOUHOU_CATALOG);
    expect(multiRet.canRetaliate).toBe(true);
    expect(multiRet.interceptedBy?.id).toBe(guardC2.id);
    expect(multiRet.actualTarget.id).toBe(guardC2.id);

    // 5. 若阻挡友军处于「常世净域」无敌状态，不得违反净域规则转嫁伤害
    guardC2.pos = offsetToAxial(2, 16);
    guardC.statusEffects.sanctuary = true;
    const sanctRet = evaluateRangedRetaliation(state, enemyA, shooterB, TOUHOU_CATALOG);
    expect(sanctRet.canRetaliate).toBe(false);
    guardC.statusEffects.sanctuary = false;

    // 6. 敌方持有「远程先攻」(defender_first) 时，先手反击依然被前卫 C 挡下，B 保持满编打出全额反击！
    enemyA.hasRetaliatedThisRound = false;
    enemyA.abilities.rangedFirstStrike = true;
    shooterB.abilities.rangedFirstStrike = false;
    const bCountBeforeFS = shooterB.count;
    const bHpBeforeFS = shooterB.currentHp;
    const cHpTotalBeforeFS = (guardC.count - 1) * guardC.baseStats.maxHp + guardC.currentHp;
    const aHpTotalBeforeFS = (enemyA.count - 1) * enemyA.baseStats.maxHp + enemyA.currentHp;

    const fsPreview = previewAttack(state, shooterB.id, enemyA.id, TOUHOU_CATALOG);
    expect(fsPreview.valid).toBe(true);
    expect(fsPreview.exchangeMode).toBe('defender_first');
    expect(fsPreview.retaliationTargetId).toBe(guardC.id);

    state.activeUnitId = shooterB.id;
    const fsRes = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: shooterB.id, targetId: enemyA.id },
      TOUHOU_CATALOG,
    );
    expect(fsRes.ok).toBe(true);
    const fsEv = fsRes.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(fsEv && fsEv.type === 'COMBAT_EXCHANGE' && fsEv.mode === 'defender_first').toBe(true);
    // 先手远程反击由前卫 C 吃下，B 满血存活且对 A 造成了真实伤害
    expect(shooterB.count).toBe(bCountBeforeFS);
    expect(shooterB.currentHp).toBe(bHpBeforeFS);
    const cHpTotalAfterFS = (guardC.count - 1) * guardC.baseStats.maxHp + guardC.currentHp;
    const aHpTotalAfterFS = (enemyA.count - 1) * enemyA.baseStats.maxHp + enemyA.currentHp;
    expect(cHpTotalAfterFS).toBeLessThan(cHpTotalBeforeFS);
    expect(aHpTotalAfterFS).toBeLessThan(aHpTotalBeforeFS);
  });
});

describe('四种碰撞体积（1×1 / 1×2 / 2×1 / 2×2）占位、卡位与直线命中不重算', () => {
  it('四种体积展开占据格数应严格为 1、2、2、4，且 2×2 非想天则可任意格反查', () => {
    const anchor = offsetToAxial(4, 4);
    expect(getFootprintHexes(anchor, '1x1')).toHaveLength(1);
    expect(getFootprintHexes(anchor, '1x2')).toHaveLength(2);
    expect(getFootprintHexes(anchor, '2x1')).toHaveLength(2);
    expect(getFootprintHexes(anchor, '2x2')).toHaveLength(4);

    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'creature', defId: 'hisoutensoku', count: 2, col: 1, row: 7 }],
        rightSlots: [{ kind: 'creature', defId: 'shrine_guardian_golem', count: 4, col: 15, row: 7 }],
        controllers: { left: 'human', right: 'human' },
      },
      TOUHOU_CATALOG,
    );

    const soku = Object.values(state.units).find((u) => u.defId === 'hisoutensoku')!;
    expect(soku.footprint).toBe('2x2');
    const occupied = getUnitOccupiedHexes(soku);
    expect(occupied).toHaveLength(4);
    for (const h of occupied) {
      expect(findUnitAtHex(state, h)?.id).toBe(soku.id);
    }

    // 大型单位不可重叠或踏入不可通行玄石/水域格
    const reachable = getUnitReachableMap(state, soku, TOUHOU_CATALOG);
    for (const key of reachable.costs.keys()) {
      const anchorTile = state.tiles[key];
      for (const cell of getFootprintHexes(anchorTile, '2x2')) {
        const t = state.tiles[hexKey(cell)];
        expect(t).toBeDefined();
        expect(t.blocksGround).toBe(false);
      }
    }
  });
});

describe('东方特色擦弹减伤机制', () => {
  it('擦弹机制：触发时应精确执行 25% 减伤（×0.75），且全部非英雄单位基础擦弹率统一为 5%（仅夜影使魔更高）', () => {
    // 1. 静态契约：全部非英雄生物除夜影使魔（forest_shadow_imp）外，基础擦弹率均严格为 0.05
    for (const def of Object.values(TOUHOU_CATALOG.creatures)) {
      if (def.id === 'forest_shadow_imp') {
        expect(def.baseStats.grazeChance, '夜影使魔应保持更高的基础擦弹率').toBeGreaterThan(0.05);
      } else {
        expect(def.baseStats.grazeChance, `非英雄单位 ${def.id} (${def.name}) 基础擦弹率应为 5%`).toBe(0.05);
      }
    }

    // 2. 远程物理攻击触发擦弹：对比同种子下 0% 擦弹 vs 85% 擦弹（消除幸运与伤害浮动，精准校验 25% 减伤 ×0.75）
    const runRangedShot = (targetGraze: number, seed: number) => {
      const map = buildShrineNightBattleMap();
      flattenAllMapTiles(map.tiles, 0);
      const { state } = createBattleState(
        {
          mapWidth: map.width,
          mapHeight: map.height,
          tiles: map.tiles,
          leftSlots: [{ kind: 'creature', defId: 'ofuda_archer', count: 10, col: 4, row: 10 }],
          rightSlots: [{ kind: 'creature', defId: 'corpse_husk', count: 20, col: 8, row: 10 }],
          controllers: { left: 'human', right: 'human' },
          seed,
        },
        TOUHOU_CATALOG,
      );
      const archer = Object.values(state.units).find((u) => u.defId === 'ofuda_archer')!;
      const target = Object.values(state.units).find((u) => u.defId === 'corpse_husk')!;
      archer.baseStats.minDamage = 10;
      archer.baseStats.maxDamage = 10;
      archer.baseStats.luck = 0;
      target.baseStats.luck = 0;
      target.baseStats.grazeChance = targetGraze;
      // 取消骸骨远程防御翻倍干扰，清晰对比擦弹减伤倍率
      target.abilities.skeletal = false;
      state.activeUnitId = archer.id;
      const res = dispatchCombatCommand(
        state,
        { type: 'ATTACK', unitId: archer.id, targetId: target.id },
        TOUHOU_CATALOG,
      );
      expect(res.ok, res.error).toBe(true);
      const atkEv = res.events.find((e) => e.type === 'COMBAT_EXCHANGE');
      expect(atkEv && atkEv.type === 'COMBAT_EXCHANGE').toBe(true);
      return atkEv && atkEv.type === 'COMBAT_EXCHANGE' ? atkEv.attackerStrike! : null;
    };

    let matchedRanged = false;
    for (let seed = 7771; seed < 7795; seed++) {
      const grazedStrike = runRangedShot(0.85, seed);
      if (grazedStrike?.grazed) {
        const normalStrike = runRangedShot(0, seed);
        expect(normalStrike?.grazed).toBe(false);
        expect(grazedStrike.damage).toBe(Math.max(1, Math.round(normalStrike!.damage * 0.75)));
        matchedRanged = true;
        break;
      }
    }
    expect(matchedRanged).toBe(true);

    // 3. 法术伤害触发擦弹：对 0 魔抗目标施放魔导星矢，验证擦弹精确执行 25% 减伤（×0.75）
    const runSpellCast = (targetGraze: number, seed: number) => {
      const map = buildShrineNightBattleMap();
      flattenAllMapTiles(map.tiles, 0);
      const { state } = createBattleState(
        {
          mapWidth: map.width,
          mapHeight: map.height,
          tiles: map.tiles,
          leftSlots: [{ kind: 'creature', defId: 'broom_caster', count: 20, col: 4, row: 10 }],
          rightSlots: [{ kind: 'creature', defId: 'kedama', count: 30, col: 8, row: 10 }],
          controllers: { left: 'human', right: 'human' },
          seed,
        },
        TOUHOU_CATALOG,
      );
      const caster = Object.values(state.units).find((u) => u.defId === 'broom_caster')!;
      const target = Object.values(state.units).find((u) => u.defId === 'kedama')!;
      target.baseStats.magicResistance = 0;
      target.baseStats.grazeChance = targetGraze;
      state.activeUnitId = caster.id;
      const res = dispatchCombatCommand(
        state,
        { type: 'CAST_SPELL', unitId: caster.id, spellId: 'chaos_magic_arrow', targetUnitId: target.id },
        TOUHOU_CATALOG,
      );
      expect(res.ok, res.error).toBe(true);
      const spellEv = res.events.find((e) => e.type === 'SPELL_CAST');
      return spellEv && spellEv.type === 'SPELL_CAST' ? spellEv.damageMap?.[target.id] : undefined;
    };

    let matchedSpell = false;
    for (let seed = 7772; seed < 7805; seed++) {
      const grazedSpell = runSpellCast(0.85, seed);
      if (grazedSpell?.grazed) {
        const normalSpell = runSpellCast(0, seed);
        expect(normalSpell?.grazed).toBe(false);
        expect(grazedSpell.damage).toBe(Math.max(1, Math.round(normalSpell!.damage * 0.75)));
        matchedSpell = true;
        break;
      }
    }
    expect(matchedSpell).toBe(true);
  });
});

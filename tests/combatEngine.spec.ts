/**
 * 《Touhou-H4》核心引擎 Vitest 自动化规则测试套件
 * 覆盖：尖顶六边形与 LoS 遮挡、HoMM4 五角星+圆心力量阵营轮、两阶段同时反击与先攻、
 * 远程互射、东方英雄固有特质钩子、组合神器套装、符卡宣言与收取 Bonus、以及完整 AI 对局推演。
 */

import { describe, expect, it } from 'vitest';
import { chooseTacticalAiCommand } from '@ai/tacticalAi';
import { resolveUnitSummonKind } from '@core/types';
import { resolveUnitRangedProjectile } from '@renderer/rangedProjectileFx';
import {
  ALIGNMENT_META,
  computeArmyAlignmentMorale,
  getAdjacentMagicAlignments,
  getAlignmentRelation,
} from '@core/alignment';
import {
  allocateHpPoolToStack,
  canModifyHeroClassOrBuild,
  checkRangedCapability,
  checkSpellLineOfSight,
  computeMoraleLuckRates,
  createBattleState,
  dispatchCombatCommand,
  evaluateIllusionSpell,
  evaluateRangedRetaliation,
  findUnitAtHex,
  getAvailableCorpseHp,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  getUnitOccupiedHexes,
  getUnitReachableMap,
  isUnitOnHighlandPlatform,
  previewAttack,
  selectHeroAdvancedClass,
  setHeroPrimarySkillRank,
  setHeroSecondarySkillRank,
} from '@core/combatEngine';
import {
  getCreatureTypeKind,
  isDarkBonusTarget,
  isDarkMagicVulnerable,
  isImmuneToLivingEffects,
  isImmuneToLivingHeal,
  isImmuneToMindSpells,
  isImmuneToMorale,
} from '@core/creatureTypes';
import {
  ALL_H4_ADVANCED_CLASS_IDS,
  ALL_H4_BASE_CLASS_IDS,
  ALL_PRIMARY_SKILL_IDS,
  ALL_SECONDARY_SKILL_IDS,
  canIncrementSubSkill,
  H4_ADVANCED_CLASSES,
  H4_BASE_CLASSES,
  resolveEligibleAdvancedClasses,
  SECONDARY_SKILL_META,
  SKILL_TREE_META,
} from '@core/h4Skills';
import {
  countActiveUnitStatusSlots,
  enforceUnitStatusSlotCap,
  listActiveUnitStatusSlots,
  markStatusEffectOrder,
  MAX_UNIT_BUFF_SLOTS,
  upsertUnitModifier,
} from '@core/statusCap';
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
import { computeUnitStats, resolveActiveArtifactSets, resolveAdvancedClass } from '@core/modifiers';
import { createReimuVsMarisaBattle, TOUHOU_CATALOG } from '@data/battlePresets';
import { buildShrineNightBattleMap, SHRINE_FIELD_PROJECTION } from '@data/definitions';
import { ALL_H4_COMBAT_SPELL_IDS, ALL_H4_SPELL_IDS, formatSpellCardTitle, H4_SPELLS } from '@data/h4Spells';
import {
  blendSanitizedScratchIntoFrame,
  installPixelFxPainterSafetyGuards,
  MODULE_POST_PROCESS_RULES,
  PIXELFX_MODULES,
  SILENT_PIXELFX_ACTOR,
  TOUHOU_PALETTES,
} from '@renderer/pixelfxBridge';
import { clearFrame, composite, createFrame, createFx, painterFor } from 'pixelfx';
import { TOUHOU_WEATHER_FX_SET } from '@renderer/touhouCustomFx';
import {
  ALL_SPELL_ICON_IDS,
  computeSpellIconPixelHash,
  getSpellIconPixels,
  SPELL_ICON_DRAWERS,
} from '@renderer/spellIcons';
import { ALL_SPELL_VFX_IDS, SPELL_VFX_CATALOG } from '@renderer/spellVfxCatalog';
import { SPELL_CARD_COPY_CATALOG, SPELL_COPY_CATALOG } from '@data/spellCopy';
import {
  buildHeroEquipmentSlots,
  buildHeroTraitBadges,
  buildSpellCardTooltipPayload,
  buildSpellTooltipPayload,
  buildUnitSpecialtyBadges,
  buildUnitStatusBadges,
  PRIMARY_SKILL_META,
} from '@ui/hudMetadata';
import {
  ALL_SPELL_POLARITIES,
  classifySpellPolarity,
  getUnitHeaderCreatureTags,
  SPELL_POLARITY_META,
  SUMMON_KIND_HP_THEME,
  tokenizeSemanticText,
} from '@ui/semanticFormat';

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

  it('近战自选不同落脚方位（高地邻格 vs 平地邻格）应精确改变高地增伤预估与实际落位', () => {
    const map = buildShrineNightBattleMap();
    // 目标为 1×1 单位纯踩在 (8,4) 平地，其邻格 (8,3) 为高地 (elevation=2)，邻格 (7,4) 为平地 (elevation=1)
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

    const highlandApproach = offsetToAxial(8, 3);
    const plainApproach = offsetToAxial(7, 4);

    const highPreview = previewAttack(state, kedamaId, targetId, TOUHOU_CATALOG, highlandApproach);
    const plainPreview = previewAttack(state, kedamaId, targetId, TOUHOU_CATALOG, plainApproach);

    expect(highPreview.valid).toBe(true);
    expect(plainPreview.valid).toBe(true);
    expect(highPreview.highGroundBonus).toBe(true);
    expect(plainPreview.highGroundBonus).toBe(false);
    expect(highPreview.expectedMaxDamage).toBeGreaterThan(plainPreview.expectedMaxDamage);

    // 执行指定从高地落脚进攻，验证单位确实落到 (8,3) 高地格上！
    const res = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: kedamaId, targetId, moveTo: highlandApproach },
      TOUHOU_CATALOG,
    );
    expect(res.ok).toBe(true);
    expect(state.units[kedamaId].pos).toEqual(highlandApproach);
  });

  it('近战禁手（noMelee）与远程禁手（noRanged）特技应准确拦截对应进攻与反击', () => {
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

    // 1. 贴脸时星屑魔导书（近战禁手）仍可远程射击，但强制近战会被拦截且遭近战攻击时不触发近战反击
    const rangedWhileAdjacent = previewAttack(state, grimoire.id, kedama.id, TOUHOU_CATALOG);
    expect(rangedWhileAdjacent.valid).toBe(true);
    expect(rangedWhileAdjacent.isRanged).toBe(true);

    const meleeTry = previewAttack(state, grimoire.id, kedama.id, TOUHOU_CATALOG, grimoire.pos);
    expect(meleeTry.valid).toBe(false);
    expect(meleeTry.reason).toContain('近战禁手');

    const kedamaAtk = previewAttack(state, kedama.id, grimoire.id, TOUHOU_CATALOG);
    expect(kedamaAtk.valid).toBe(true);
    expect(kedamaAtk.willRetaliate).toBe(false);

    // 2. 拉开距离并施加远程禁手后，既无法远程射击也无法近战攻击
    kedama.pos = offsetToAxial(11, 10);
    expect(previewAttack(state, grimoire.id, kedama.id, TOUHOU_CATALOG).valid).toBe(true);
    grimoire.abilities.noRanged = true;
    expect(previewAttack(state, grimoire.id, kedama.id, TOUHOU_CATALOG).valid).toBe(false);
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

describe('英雄固有特质、双修进阶职业、组合神器套装、药水与符卡收取', () => {
  it('灵梦与魔理沙应自动激活对应双修进阶职业、组合神器套装与特质属性', () => {
    const { state } = createReimuVsMarisaBattle({ mode: 'hotseat', seed: 100 });
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;

    // 灵梦五系魔法全宗师激活「万象结界大贤者」(archmage)，魔理沙激活「极彩星辰魔导」(fire_diviner)
    expect(
      resolveAdvancedClass(reimu.skills, TOUHOU_CATALOG.advancedClasses, reimu.subSkills, reimu.selectedAdvancedClassId)
        ?.id,
    ).toBe('archmage');
    const marisaCls = resolveAdvancedClass(
      marisa.skills,
      TOUHOU_CATALOG.advancedClasses,
      marisa.subSkills,
      marisa.selectedAdvancedClassId,
    );
    expect(marisaCls?.id).toBe('fire_diviner');
    expect(marisaCls?.name).toBe('极彩星辰魔导');
    expect(reimu.skills.life_magic).toBe(5);
    expect(reimu.skills.order_magic).toBe(5);
    expect(reimu.skills.death_magic).toBe(5);
    expect(reimu.skills.chaos_magic).toBe(5);
    expect(reimu.skills.nature_magic).toBe(5);
    expect(reimu.knownSpellIds).toHaveLength(142);

    expect(
      resolveActiveArtifactSets(reimu.equippedArtifactIds, TOUHOU_CATALOG.artifacts, TOUHOU_CATALOG.artifactSets),
    ).toHaveLength(1);
    expect(
      resolveActiveArtifactSets(marisa.equippedArtifactIds, TOUHOU_CATALOG.artifacts, TOUHOU_CATALOG.artifactSets),
    ).toHaveLength(1);

    // 灵梦固有特质 + 神器提供显著高于基础值的擦弹率
    const reimuStats = computeUnitStats(reimu, state, TOUHOU_CATALOG);
    expect(reimuStats.grazeChance).toBeGreaterThanOrEqual(0.45);
    // 魔理沙固有特质提升 P 点上限至 5.0
    expect(marisa.maxPowerPoints).toBe(5);
  });

  it('腰带药水应为免费自由动作，符卡宣言与击倒施法英雄应触发符卡收取 Bonus', () => {
    const { state } = createReimuVsMarisaBattle({ mode: 'hotseat', seed: 202 });
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;

    // 1. 喝药不消耗回合行动权
    state.activeUnitId = reimu.id;
    reimu.spellCardCharge = 70;
    const potRes = dispatchCombatCommand(
      state,
      { type: 'USE_POTION', unitId: reimu.id, potionId: 'spirit_draught' },
      TOUHOU_CATALOG,
    );
    expect(potRes.ok).toBe(true);
    expect(state.activeUnitId).toBe(reimu.id);
    expect(reimu.spellCardCharge).toBe(100);

    // 2. 灵梦发动《梦想天生》展开盘面结界领域
    const cardRes = dispatchCombatCommand(
      state,
      { type: 'DECLARE_SPELL_CARD', unitId: reimu.id },
      TOUHOU_CATALOG,
    );
    expect(cardRes.ok).toBe(true);
    expect(state.activeFieldAura?.spellCardId).toBe('reimu_fantasy_nature');

    // 3. 魔理沙满充能沿直线轰击《极限火花》击倒残血灵梦，验证符卡收取 Bonus 与英雄倒地状态
    reimu.currentHp = 20;
    state.activeUnitId = marisa.id;
    marisa.spellCardCharge = 100;
    marisa.mana = 30;
    // 将灵梦与魔理沙置于同行空旷直线上确保命中（避开其他单位多格占位）
    reimu.pos = offsetToAxial(7, 8);
    marisa.pos = offsetToAxial(12, 8);

    const sparkRes = dispatchCombatCommand(
      state,
      { type: 'DECLARE_SPELL_CARD', unitId: marisa.id, targetHex: reimu.pos },
      TOUHOU_CATALOG,
    );
    expect(sparkRes.ok).toBe(true);
    expect(reimu.status).toBe('knocked_out');
    expect(reimu.powerPoints).toBe(0);
    expect(sparkRes.events.some((e) => e.type === 'SPELL_CARD_CAPTURED')).toBe(true);
    // 4. 若存活敌军踏上倒地英雄所在格，findUnitAtHex 无论是否含倒地均应优先命中存活敌军，确保攻击不失效
    const aliveEnemy = Object.values(state.units).find((u) => u.side === 'right' && u.status === 'alive')!;
    aliveEnemy.pos = { ...reimu.pos };
    expect(findUnitAtHex(state, reimu.pos, false)?.id).toBe(aliveEnemy.id);
    expect(findUnitAtHex(state, reimu.pos, true)?.id).toBe(aliveEnemy.id);
  });

  it('战术 AI 完整对局推演应确定性收敛并分出胜负', () => {
    const { state } = createReimuVsMarisaBattle({ mode: 'vs_ai', seed: 999 });
    state.controllers = { left: 'ai', right: 'ai' };

    let steps = 0;
    while (state.phase === 'active' && steps < 260) {
      const cmd = chooseTacticalAiCommand(state, TOUHOU_CATALOG);
      expect(cmd).not.toBeNull();
      const res = dispatchCombatCommand(state, cmd!, TOUHOU_CATALOG);
      expect(res.ok).toBe(true);
      steps += 1;
    }

    expect(state.phase).toBe('finished');
    expect(state.winner === 'left' || state.winner === 'right').toBe(true);
  });
});

describe('博丽生命(8兵) vs 魔法使混沌(8兵) 7v7 双编队与全套 H4 特技实装', () => {
  it('A 阵与 B 阵均应为纯阵营 7v7 满编、零重叠合法落位、覆盖全部 16 兵种且 AI 推演收敛', () => {
    const seenDefIds = new Set<string>();

    for (const variant of ['A', 'B'] as const) {
      const { state } = createReimuVsMarisaBattle({ mode: 'vs_ai', lineupVariant: variant, seed: 300 + variant.charCodeAt(0) });
      const leftUnits = Object.values(state.units).filter((u) => u.side === 'left');
      const rightUnits = Object.values(state.units).filter((u) => u.side === 'right');

      expect(leftUnits).toHaveLength(7);
      expect(rightUnits).toHaveLength(7);
      expect(leftUnits.every((u) => u.alignment === 'life')).toBe(true);
      expect(rightUnits.every((u) => u.alignment === 'chaos')).toBe(true);

      // 所有多格占位均合法且互不重叠
      const occupied = new Set<string>();
      for (const u of Object.values(state.units)) {
        if (u.kind === 'creature') seenDefIds.add(u.defId);
        for (const h of getUnitOccupiedHexes(u)) {
          const k = hexKey(h);
          expect(occupied.has(k)).toBe(false);
          occupied.add(k);
          const tile = state.tiles[k];
          expect(tile).toBeDefined();
          expect(tile.blocksGround).toBe(false);
        }
      }

      // B 阵亦应稳定跑完完整 AI 推演
      if (variant === 'B') {
        state.controllers = { left: 'ai', right: 'ai' };
        let steps = 0;
        while (state.phase === 'active' && steps < 320) {
          const cmd = chooseTacticalAiCommand(state, TOUHOU_CATALOG);
          expect(cmd).not.toBeNull();
          const res = dispatchCombatCommand(state, cmd!, TOUHOU_CATALOG);
          expect(res.ok).toBe(true);
          steps += 1;
        }
        expect(state.phase).toBe('finished');
      }
    }

    // A + B 两阵合集应完整涵盖博丽生命 8 兵种 + 魔法之森混沌 8 兵种 = 16 个兵种！
    expect(seenDefIds.size).toBe(16);
  });

  it('精准射击、无视障碍、无限弹药、破先攻、冲锋与双重攻击应严格按 H4 规则生效', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'yinyang_turret', count: 8, col: 3, row: 12 },
          { kind: 'creature', defId: 'onbashira_steed', count: 3, col: 3, row: 9 },
          { kind: 'creature', defId: 'exorcist_blade', count: 6, col: 7, row: 10 },
          { kind: 'creature', defId: 'shrine_komainu', count: 6, col: 11, row: 14 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'miasma_nightmare', count: 8, col: 8, row: 10 },
          { kind: 'creature', defId: 'grimoire_familiar', count: 6, col: 18, row: 12 },
          { kind: 'creature', defId: 'onbashira_steed', count: 3, col: 13, row: 14 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 77,
      },
      TOUHOU_CATALOG,
    );

    const turret = Object.values(state.units).find((u) => u.defId === 'yinyang_turret')!;
    const steed = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'onbashira_steed')!;
    const blade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const komainu = Object.values(state.units).find((u) => u.defId === 'shrine_komainu')!;
    const nightmare = Object.values(state.units).find((u) => u.defId === 'miasma_nightmare')!;
    const grimoire = Object.values(state.units).find((u) => u.defId === 'grimoire_familiar')!;
    const enemySteed = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'onbashira_steed')!;

    // 1. 阴阳玉浮游炮：隔 15 格 + 途中置入普通竹林障碍，因精准(longRange)+穿障(noObstaclePenalty)仍保持 1x 全伤！
    const forestTile = state.tiles[hexKey(offsetToAxial(8, 12))];
    forestTile.terrain = 'forest';
    forestTile.losObstruction = 'partial';
    const turretPreview = previewAttack(state, turret.id, grimoire.id, TOUHOU_CATALOG);
    expect(turretPreview.valid).toBe(true);
    expect(turretPreview.isRanged).toBe(true);
    expect(turretPreview.rangedPenaltyTier).toBe('full');
    expect(turretPreview.rangedMultiplier).toBe(1);

    // 2. 无限弹药：魔眼禁书魔导书射击后弹药数不变
    const ammoBefore = grimoire.ammo;
    state.activeUnitId = grimoire.id;
    const grimShot = dispatchCombatCommand(state, { type: 'ATTACK', unitId: grimoire.id, targetId: turret.id }, TOUHOU_CATALOG);
    expect(grimShot.ok).toBe(true);
    expect(grimoire.ammo).toBe(ammoBefore);

    // 3. 破先攻：镇守狛犬对阵先攻单位御柱天马战神，强制拉回 simultaneous 同时交锋！
    const komainuVsSteed = previewAttack(state, komainu.id, enemySteed.id, TOUHOU_CATALOG);
    expect(komainuVsSteed.valid).toBe(true);
    expect(komainuVsSteed.exchangeMode).toBe('simultaneous');

    // 4. 冲锋增伤：御柱天马战神远程奔袭攻击的期望伤害严格高于紧邻原地砍击
    const chargePrev = previewAttack(state, steed.id, nightmare.id, TOUHOU_CATALOG);
    expect(chargePrev.valid).toBe(true);
    const savedPos = { ...steed.pos };
    steed.pos = offsetToAxial(6, 10);
    const stationaryPrev = previewAttack(state, steed.id, nightmare.id, TOUHOU_CATALOG);
    steed.pos = savedPos;
    expect(chargePrev.expectedMaxDamage).toBeGreaterThan(stationaryPrev.expectedMaxDamage);

    // 5. 双重攻击：退魔御魂剑士主动斩击无震慑控场的高血敌军（如非想天则），必定产出第二段追击 followUpStrike
    nightmare.abilities.terrorOnHit = false;
    state.activeUnitId = blade.id;
    const dblRes = dispatchCombatCommand(state, { type: 'ATTACK', unitId: blade.id, targetId: nightmare.id }, TOUHOU_CATALOG);
    expect(dblRes.ok).toBe(true);
    const dblEx = dblRes.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(dblEx?.type).toBe('COMBAT_EXCHANGE');
    if (dblEx?.type === 'COMBAT_EXCHANGE') {
      expect(dblEx.attackerStrike?.followUpStrike).toBeDefined();
      expect(dblEx.attackerStrike!.followUpStrike!.damage).toBeGreaterThan(0);
    }
  });

  it('烈焰护盾反伤、周身全扫、贯穿龙息、全魔免、返魂苏生与定身跳过回合应准确结算', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'hakurei_seraph', count: 2, col: 4, row: 12 },
          { kind: 'creature', defId: 'exorcist_blade', count: 10, col: 6, row: 12 },
          { kind: 'creature', defId: 'yinyang_turret', count: 6, col: 4, row: 14 },
          { kind: 'creature', defId: 'kedama', count: 20, col: 10, row: 10 },
          { kind: 'creature', defId: 'ofuda_archer', count: 16, col: 9, row: 10 },
          { kind: 'hero', defId: 'hero_reimu', count: 1, col: 11, row: 14 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'starfire_efreet', count: 4, col: 7, row: 12 },
          { kind: 'creature', defId: 'crimson_star_dragon', count: 1, col: 11, row: 10 },
          { kind: 'creature', defId: 'arcane_colossus', count: 2, col: 13, row: 12 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 88,
      },
      TOUHOU_CATALOG,
    );

    const seraph = Object.values(state.units).find((u) => u.defId === 'hakurei_seraph')!;
    const blade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const turret = Object.values(state.units).find((u) => u.defId === 'yinyang_turret')!;
    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const archer = Object.values(state.units).find((u) => u.defId === 'ofuda_archer')!;
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const efreet = Object.values(state.units).find((u) => u.defId === 'starfire_efreet')!;
    const dragon = Object.values(state.units).find((u) => u.defId === 'crimson_star_dragon')!;
    const colossus = Object.values(state.units).find((u) => u.defId === 'arcane_colossus')!;

    // 1. 烈焰护盾：退魔剑士近战斩击星火炎灵，必须收到 fire_shield 火焰反伤
    state.activeUnitId = blade.id;
    const fsRes = dispatchCombatCommand(state, { type: 'ATTACK', unitId: blade.id, targetId: efreet.id }, TOUHOU_CATALOG);
    expect(fsRes.ok).toBe(true);
    const fsEx = fsRes.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    if (fsEx?.type === 'COMBAT_EXCHANGE') {
      expect(fsEx.attackerStrike?.secondaryHits?.some((h) => h.kind === 'fire_shield' && h.targetId === blade.id)).toBe(true);
    }

    // 2. 贯穿吐息：极星红莲魔龙(11,10) 咬(10,10)毛玉，龙息应贯穿灼烧正后方(9,10)的御札符箭使！
    state.activeUnitId = dragon.id;
    const brRes = dispatchCombatCommand(state, { type: 'ATTACK', unitId: dragon.id, targetId: kedama.id }, TOUHOU_CATALOG);
    expect(brRes.ok).toBe(true);
    const brEx = brRes.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    if (brEx?.type === 'COMBAT_EXCHANGE') {
      expect(brEx.attackerStrike?.secondaryHits?.some((h) => h.kind === 'breath' && h.targetId === archer.id)).toBe(true);
    }

    // 3. 全魔法免疫（黑龙规则）：绝对拒绝一切敌方负面与己方正面单体法术，同时无视范围法术、符卡攻击与结界领域！
    state.activeUnitId = reimu.id;
    const enemySpellReject = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'life_holy_word', targetUnitId: dragon.id },
      TOUHOU_CATALOG,
    );
    expect(enemySpellReject.ok).toBe(false);
    const enemyChaosReject = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'chaos_magic_arrow', targetUnitId: dragon.id },
      TOUHOU_CATALOG,
    );
    expect(enemyChaosReject.ok).toBe(false);

    // 临时测试己方正面法术（治愈/神佑/复活）亦被黑龙全魔免拒绝
    const savedDragonSide = dragon.side;
    dragon.side = reimu.side;
    const allyBlessReject = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'life_bless', targetUnitId: dragon.id },
      TOUHOU_CATALOG,
    );
    expect(allyBlessReject.ok).toBe(false);
    const allyHealReject = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'life_heal', targetUnitId: dragon.id },
      TOUHOU_CATALOG,
    );
    expect(allyHealReject.ok).toBe(false);

    // 灵梦发动《梦想天生》全队回血 + 展开结界领域，友方黑龙既不吃回血也不吃领域正增益！
    const dragonHpBeforeAura = dragon.currentHp;
    dragon.currentHp = Math.max(10, dragon.currentHp - 100);
    const dragonDefBeforeAura = computeUnitStats(dragon, state, TOUHOU_CATALOG).defense;
    reimu.spellCardCharge = 100;
    reimu.mana = 60;
    const auraRes = dispatchCombatCommand(
      state,
      { type: 'DECLARE_SPELL_CARD', unitId: reimu.id },
      TOUHOU_CATALOG,
    );
    expect(auraRes.ok).toBe(true);
    expect(dragon.currentHp).toBe(Math.max(10, dragonHpBeforeAura - 100));
    expect(computeUnitStats(dragon, state, TOUHOU_CATALOG).defense).toBe(dragonDefBeforeAura);
    // 换回敌方阵营，亦不吃敌方领域的负向减益（保留无战术光环的原始基础防御）！
    dragon.side = savedDragonSide;
    const dragonEnemyDefWithAura = computeUnitStats(dragon, state, TOUHOU_CATALOG).defense;
    state.activeFieldAura = null;
    const dragonEnemyDefNoAura = computeUnitStats(dragon, state, TOUHOU_CATALOG).defense;
    expect(dragonEnemyDefWithAura).toBe(dragonEnemyDefNoAura);
    dragon.currentHp = dragonHpBeforeAura;

    // 4. 周身全扫：将毛玉与御札符箭使放至魔导巨像(13,12) 两侧紧邻格，魔导巨像打毛玉时同步横扫御札符箭使且无反击！
    kedama.pos = offsetToAxial(12, 12);
    archer.pos = offsetToAxial(12, 13);
    state.activeUnitId = colossus.id;
    const clRes = dispatchCombatCommand(state, { type: 'ATTACK', unitId: colossus.id, targetId: kedama.id }, TOUHOU_CATALOG);
    expect(clRes.ok).toBe(true);
    const clEx = clRes.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    if (clEx?.type === 'COMBAT_EXCHANGE') {
      expect(clEx.mode).toBe('one_way');
      expect(clEx.attackerStrike?.secondaryHits?.some((h) => h.kind === 'cleave' && h.targetId === archer.id)).toBe(true);
    }

    // 5. 返魂苏生：令退魔剑士先减员至 4 兵，博丽大结界神使施放「博丽返魂苏生」后应真实复活兵力，且拒绝机械目标！
    blade.count = 4;
    blade.currentHp = 20;
    state.activeUnitId = seraph.id;
    const mechReject = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: seraph.id, spellId: 'life_resurrection', targetUnitId: turret.id },
      TOUHOU_CATALOG,
    );
    expect(mechReject.ok).toBe(false);

    const revRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: seraph.id, spellId: 'life_resurrection', targetUnitId: blade.id },
      TOUHOU_CATALOG,
    );
    expect(revRes.ok).toBe(true);
    expect(blade.count).toBeGreaterThan(4);
    expect(blade.count).toBeLessThanOrEqual(blade.maxCount);

    // 6. 定身状态跳过回合验证：给下一位行动者施加定身，推进回合时应自动发射 UNIT_SKIPPED_TURN 并跳过之
    const nextUpId = state.turnQueue.find((id) => state.units[id]?.status === 'alive' && id !== state.activeUnitId);
    if (nextUpId && state.activeUnitId) {
      state.units[nextUpId].statusEffects.stunnedRounds = 1;
      state.turnQueue = [nextUpId, ...state.turnQueue.filter((id) => id !== nextUpId)];
      const skipRes = dispatchCombatCommand(state, { type: 'DEFEND', unitId: state.activeUnitId }, TOUHOU_CATALOG);
      expect(skipRes.ok).toBe(true);
      expect(skipRes.events.some((e) => e.type === 'UNIT_SKIPPED_TURN' && e.unitId === nextUpId)).toBe(true);
      expect(state.units[nextUpId].statusEffects.stunnedRounds).toBe(0);
    }
  });

  it('近战禁手被贴身仍可远程射击、魔理沙符卡遇黑龙全魔免归零、镇守狛犬长武器隔格攻击免反击', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'yinyang_turret', count: 6, col: 5, row: 10 },
          { kind: 'creature', defId: 'shrine_komainu', count: 8, col: 10, row: 12 },
          { kind: 'creature', defId: 'kedama', count: 10, col: 12, row: 12 },
          { kind: 'hero', defId: 'hero_marisa', count: 1, col: 3, row: 14 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'forest_shadow_imp', count: 8, col: 5, row: 11 },
          { kind: 'creature', defId: 'broom_caster', count: 8, col: 14, row: 10 },
          { kind: 'creature', defId: 'exorcist_blade', count: 6, col: 13, row: 12 },
          { kind: 'creature', defId: 'shrine_komainu', count: 6, col: 10, row: 15 },
          { kind: 'creature', defId: 'crimson_star_dragon', count: 1, col: 7, row: 14 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 108,
      },
      TOUHOU_CATALOG,
    );

    const turret = Object.values(state.units).find((u) => u.defId === 'yinyang_turret')!;
    const komainu = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'shrine_komainu')!;
    const enemyKomainu = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'shrine_komainu')!;
    const imp = Object.values(state.units).find((u) => u.defId === 'forest_shadow_imp')!;
    const broom = Object.values(state.units).find((u) => u.defId === 'broom_caster')!;
    const enemyBlade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;
    const dragon = Object.values(state.units).find((u) => u.defId === 'crimson_star_dragon')!;

    // 1. 近战禁手被贴身（imp 在 (5,11) 紧贴 turret(5,10)）依然能远程射击贴身目标与侧前方远距离目标！
    const shootAdjacent = previewAttack(state, turret.id, imp.id, TOUHOU_CATALOG);
    expect(shootAdjacent.valid).toBe(true);
    expect(shootAdjacent.isRanged).toBe(true);
    const shootFarWhileEngaged = previewAttack(state, turret.id, broom.id, TOUHOU_CATALOG);
    expect(shootFarWhileEngaged.valid).toBe(true);
    expect(shootFarWhileEngaged.isRanged).toBe(true);
    // 但若敌军近战攻击近战禁手单位，近战禁手单位绝不近战反击！
    const impMeleeTurret = previewAttack(state, imp.id, turret.id, TOUHOU_CATALOG);
    expect(impMeleeTurret.valid).toBe(true);
    expect(impMeleeTurret.isRanged).toBe(false);
    expect(impMeleeTurret.willRetaliate).toBe(false);

    // 2. 魔理沙直线大招《极限火花》轰击全魔免黑龙时，伤害必须为 0
    marisa.spellCardCharge = 100;
    marisa.mana = 60;
    state.activeUnitId = marisa.id;
    const dragonHpBeforeSpark = dragon.currentHp;
    const sparkRes = dispatchCombatCommand(
      state,
      { type: 'DECLARE_SPELL_CARD', unitId: marisa.id, targetHex: dragon.pos },
      TOUHOU_CATALOG,
    );
    expect(sparkRes.ok).toBe(true);
    expect(dragon.currentHp).toBe(dragonHpBeforeSpark);
    const scEv = sparkRes.events.find((e) => e.type === 'SPELL_CARD_DECLARED');
    if (scEv?.type === 'SPELL_CARD_DECLARED') {
      expect(scEv.damageMap?.[dragon.id]?.damage).toBe(0);
    }

    // 3. 镇守狛犬（2×2 位于 10,12 占 10~11,12~13）隔着友军毛玉(12,12) 攻击敌方退魔剑士(13,12)，距离恰好 2 格：
    //    原地即可直接长手突刺，且敌军非长手完全无法反击（one_way + isLongWeaponPoke）！
    const pokePrev = previewAttack(state, komainu.id, enemyBlade.id, TOUHOU_CATALOG);
    expect(pokePrev.valid).toBe(true);
    expect(pokePrev.isRanged).toBe(false);
    expect(pokePrev.moveTo).toBeUndefined();
    expect(pokePrev.isLongWeaponPoke).toBe(true);
    expect(pokePrev.willRetaliate).toBe(false);
    expect(pokePrev.exchangeMode).toBe('one_way');

    // 4. 若镇守狛犬隔 1 格攻击另一只同样拥有「长武器」的敌方狛犬(10,15)，对方够得着仍可同时反击！
    const mirrorPoke = previewAttack(state, komainu.id, enemyKomainu.id, TOUHOU_CATALOG);
    expect(mirrorPoke.valid).toBe(true);
    expect(mirrorPoke.isLongWeaponPoke).toBe(false);
    expect(mirrorPoke.willRetaliate).toBe(true);
    expect(mirrorPoke.exchangeMode).toBe('simultaneous');
  });
});

describe('HoMM4 全 142 法术体系与博丽灵梦五系宗师全解锁', () => {
  it('应完整注册官方全部 142 个法术（32生命+27秩序+25死亡+27混沌+31自然，137战斗+5大地图），且灵梦五系全宗师全解锁', () => {
    expect(ALL_H4_SPELL_IDS).toHaveLength(142);
    expect(new Set(ALL_H4_SPELL_IDS).size).toBe(142);
    expect(ALL_H4_COMBAT_SPELL_IDS).toHaveLength(137);

    const bySchool: Record<string, number> = { life: 0, order: 0, death: 0, chaos: 0, nature: 0 };
    const adventureSpells: string[] = [];
    for (const id of ALL_H4_SPELL_IDS) {
      const sp = H4_SPELLS[id];
      expect(sp).toBeDefined();
      expect(TOUHOU_CATALOG.spells[id]).toBeDefined();
      expect(sp.spellCardPrefix).toBeTruthy();
      expect(formatSpellCardTitle(sp)).toBe(`${sp.spellCardPrefix}「${sp.name}」`);
      bySchool[sp.alignment] += 1;
      if (sp.isAdventureOnly || sp.targetType === 'adventure') {
        adventureSpells.push(id);
      }
    }

    expect(bySchool).toEqual({ life: 32, order: 27, death: 25, chaos: 27, nature: 31 });
    expect(adventureSpells).toHaveLength(5);

    const { state } = createReimuVsMarisaBattle({ mode: 'hotseat', seed: 512 });
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    expect(reimu.skills.life_magic).toBe(5);
    expect(reimu.skills.order_magic).toBe(5);
    expect(reimu.skills.death_magic).toBe(5);
    expect(reimu.skills.chaos_magic).toBe(5);
    expect(reimu.skills.nature_magic).toBe(5);
    expect(reimu.knownSpellIds).toEqual(ALL_H4_SPELL_IDS);

    // 5 个大地图法术在战斗棋盘上应被优雅拒绝
    state.activeUnitId = reimu.id;
    for (const advId of adventureSpells) {
      const res = dispatchCombatCommand(state, { type: 'CAST_SPELL', unitId: reimu.id, spellId: advId }, TOUHOU_CATALOG);
      expect(res.ok).toBe(false);
      expect(res.error).toContain('大地图');
    }
  });

  it('生命与秩序系核心法术（祝福、圣盾、殉道、守护天使、圣域、传送、致盲、催眠、幻象、痛楚镜面、驱散）应真实生效', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_reimu', count: 1, col: 4, row: 9 },
          { kind: 'creature', defId: 'exorcist_blade', count: 12, col: 7, row: 11 },
          { kind: 'creature', defId: 'kedama', count: 20, col: 6, row: 13 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'starfire_efreet', count: 25, col: 11, row: 11 },
          { kind: 'creature', defId: 'forest_shadow_imp', count: 120, col: 11, row: 13 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 701,
      },
      TOUHOU_CATALOG,
    );

    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const blade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const efreet = Object.values(state.units).find((u) => u.defId === 'starfire_efreet')!;
    const imp = Object.values(state.units).find((u) => u.defId === 'forest_shadow_imp')!;

    const castAsReimu = (cmd: Omit<Extract<Parameters<typeof dispatchCombatCommand>[1], { type: 'CAST_SPELL' }>, 'type' | 'unitId'>) => {
      state.activeUnitId = reimu.id;
      reimu.mana = 200;
      reimu.hasActedThisRound = false;
      return dispatchCombatCommand(state, { type: 'CAST_SPELL', unitId: reimu.id, ...cmd }, TOUHOU_CATALOG);
    };

    // 1. 神圣祝福（Bless）锁定满伤害
    expect(castAsReimu({ spellId: 'life_bless', targetUnitId: blade.id }).ok).toBe(true);
    const blessedPrev = previewAttack(state, blade.id, efreet.id, TOUHOU_CATALOG);
    expect(blessedPrev.expectedMinDamage).toBe(blessedPrev.expectedMaxDamage);

    // 2. 天界圣盾（Heavenly Shield，H4 原版仅可对施法者自身施放）赋予灵梦临时护盾吸收伤害
    expect(castAsReimu({ spellId: 'life_heavenly_shield' }).ok).toBe(true);
    expect(reimu.statusEffects.tempShieldHp).toBeGreaterThan(0);

    // 3. 殉道替伤（Martyr）：毛玉为剑士承伤
    expect(castAsReimu({ spellId: 'life_martyr', targetUnitId: kedama.id, secondTargetUnitId: blade.id }).ok).toBe(true);
    expect(blade.statusEffects.martyrProtectedByUnitId).toBe(kedama.id);
    blade.statusEffects.martyrProtectedByUnitId = undefined;

    // 4. 守护天使（Guardian Angel）：濒死免全灭重聚兵力
    expect(castAsReimu({ spellId: 'life_guardian_angel', targetUnitId: kedama.id }).ok).toBe(true);
    expect(kedama.statusEffects.guardianAngelLives).toBeGreaterThanOrEqual(1);
    const prevLives = kedama.statusEffects.guardianAngelLives!;
    kedama.count = 1;
    kedama.currentHp = 1;
    // 用巨额法术直伤秒杀毛玉，验证守护天使救赎使其依然存活且救赎次数 -1！
    const nukeRes = castAsReimu({ spellId: 'chaos_armageddon' });
    expect(nukeRes.ok).toBe(true);
    expect(kedama.status).toBe('alive');
    expect(kedama.statusEffects.guardianAngelLives).toBe(prevLives - 1);

    // 5. 圣域庇护（Sanctuary）：免疫攻击与法术
    expect(castAsReimu({ spellId: 'life_sanctuary', targetUnitId: blade.id }).ok).toBe(true);
    expect(previewAttack(state, efreet.id, blade.id, TOUHOU_CATALOG).valid).toBe(false);
    blade.statusEffects.sanctuary = false;

    // 6. 瞬息传送（Teleport）二步定点传送
    const dest = offsetToAxial(5, 11);
    const tpRes = castAsReimu({ spellId: 'order_teleport', targetUnitId: blade.id, secondTargetHex: dest });
    expect(tpRes.ok).toBe(true);
    expect(blade.pos).toEqual(dest);

    // 7. 致盲术（Blind）与驱魔（Exorcism）净化
    expect(castAsReimu({ spellId: 'order_blind', targetUnitId: efreet.id }).ok).toBe(true);
    expect(efreet.statusEffects.blindRounds).toBeGreaterThan(0);

    // 8. 催眠术（Hypnotize）令敌方林妖暂时倒戈我方
    expect(castAsReimu({ spellId: 'order_hypnotize', targetUnitId: imp.id }).ok).toBe(true);
    expect(imp.side).toBe('left');
    expect(imp.statusEffects.hypnotizedOriginalSide).toBe('right');

    // 9. 制造幻象（Create Illusion）在战场生成真实半透明幻象堆叠
    const beforeUnits = Object.keys(state.units).length;
    const illuRes = castAsReimu({ spellId: 'order_create_illusion', targetUnitId: blade.id });
    expect(illuRes.ok).toBe(true);
    expect(Object.keys(state.units).length).toBe(beforeUnits + 1);
    const clone = Object.values(state.units).find((u) => u.isIllusion);
    expect(clone).toBeDefined();
    expect(clone!.side).toBe('left');

    // 10. 痛楚镜面（Pain Mirror）与驱散术（Dispel）
    expect(castAsReimu({ spellId: 'order_pain_mirror', targetUnitId: blade.id }).ok).toBe(true);
    expect(blade.statusEffects.painMirror).toBe(true);
    expect(castAsReimu({ spellId: 'order_dispel', targetUnitId: blade.id }).ok).toBe(true);
    expect(blade.statusEffects.painMirror).toBe(false);
  });

  it('死亡、混沌与自然系核心法术（死亡之手、招魂、血祭、吸血、连锁闪电、魔力涌动、猫之敏捷、召唤凤凰、神龙之力、反魔、流沙、禁绝亡灵）应真实生效', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_reimu', count: 1, col: 4, row: 9 },
          { kind: 'creature', defId: 'exorcist_blade', count: 10, col: 7, row: 11 },
          { kind: 'creature', defId: 'kedama', count: 12, col: 6, row: 13 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'forest_shadow_imp', count: 80, col: 11, row: 11 },
          { kind: 'creature', defId: 'broom_caster', count: 24, col: 12, row: 11 },
          { kind: 'creature', defId: 'crimson_star_dragon', count: 1, col: 15, row: 11 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 702,
      },
      TOUHOU_CATALOG,
    );

    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const blade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const imp = Object.values(state.units).find((u) => u.defId === 'forest_shadow_imp')!;
    const broom = Object.values(state.units).find((u) => u.defId === 'broom_caster')!;
    const dragon = Object.values(state.units).find((u) => u.defId === 'crimson_star_dragon')!;

    const castAsReimu = (cmd: Omit<Extract<Parameters<typeof dispatchCombatCommand>[1], { type: 'CAST_SPELL' }>, 'type' | 'unitId'>) => {
      state.activeUnitId = reimu.id;
      reimu.mana = 200;
      reimu.hasActedThisRound = false;
      return dispatchCombatCommand(state, { type: 'CAST_SPELL', unitId: reimu.id, ...cmd }, TOUHOU_CATALOG);
    };

    // 1. 死亡之手（Hand of Death）直接夺命减员
    const impCountBefore = imp.count;
    expect(castAsReimu({ spellId: 'death_hand_of_death', targetUnitId: imp.id }).ok).toBe(true);
    expect(imp.count).toBeLessThan(impCountBefore);

    // 2. 招魂·尸壳（Raise Skeletons）从减员残骸唤起正式死亡 T1 兵种尸壳
    const raisedRes = castAsReimu({ spellId: 'death_raise_skeletons', targetUnitId: imp.id });
    expect(raisedRes.ok).toBe(true);
    expect(Object.values(state.units).some((u) => u.defId === 'corpse_husk' && u.isSummoned)).toBe(true);

    // 3. 禁绝亡灵（Necromancy Ward）封印后续所有招魂法术
    expect(castAsReimu({ spellId: 'nature_necromancy_ward' }).ok).toBe(true);
    expect(castAsReimu({ spellId: 'death_raise_ghosts', targetUnitId: imp.id }).ok).toBe(false);

    // 4. 血祭复生（Sacrifice）：献祭毛玉复活已战损的剑士
    blade.count = 4;
    const sacRes = castAsReimu({ spellId: 'death_sacrifice', targetUnitId: kedama.id, secondTargetUnitId: blade.id });
    expect(sacRes.ok).toBe(true);
    expect(kedama.status).toBe('dead');
    expect(blade.count).toBeGreaterThan(4);

    // 5. 吸血鬼之触（Vampiric Touch）& 猫之敏捷（Cat's Reflexes 赋予双重攻击）
    expect(castAsReimu({ spellId: 'death_vampiric_touch', targetUnitId: blade.id }).ok).toBe(true);
    expect(blade.statusEffects.vampiricTouch).toBe(true);
    expect(castAsReimu({ spellId: 'chaos_cat_reflexes', targetUnitId: blade.id }).ok).toBe(true);
    expect(blade.abilities.doubleStrike).toBe(true);

    // 6. 魔力涌动（Mana Flare）：全场施法耗蓝降低 2 点（最低 1）
    const chainDef = TOUHOU_CATALOG.spells.chaos_chain_lightning;
    const costBefore = getEffectiveSpellManaCost(state, reimu, chainDef);
    expect(castAsReimu({ spellId: 'chaos_mana_flare' }).ok).toBe(true);
    expect(getEffectiveSpellManaCost(state, reimu, chainDef)).toBe(Math.max(1, costBefore - 2));

    // 7. 连锁闪电（Chain Lightning）应连续弹射到相邻敌军，且天生黑龙依然免疫末日审判！
    reimu.pos = offsetToAxial(11, 9);
    const broomBefore = broom.count;
    const clTarget = imp.status === 'alive' ? imp : broom;
    const clRes = castAsReimu({ spellId: 'chaos_chain_lightning', targetUnitId: clTarget.id });
    expect(clRes.ok, clRes.error).toBe(true);
    expect(broom.count).toBeLessThan(broomBefore);
    reimu.currentHp = computeUnitStats(reimu, state, TOUHOU_CATALOG).maxHp;
    const dragonHpBeforeArma = dragon.currentHp;
    expect(castAsReimu({ spellId: 'chaos_armageddon' }).ok).toBe(true);
    expect(dragon.currentHp).toBe(dragonHpBeforeArma);

    // 8. 召唤凤凰（Summon Phoenix）真实生成飞行凤凰堆叠
    reimu.pos = offsetToAxial(4, 9);
    const phoenixSpot = offsetToAxial(3, 8);
    const phRes = castAsReimu({ spellId: 'nature_summon_phoenix', targetHex: phoenixSpot });
    expect(phRes.ok, phRes.error).toBe(true);
    const phoenix = Object.values(state.units).find((u) => u.defId === 'summon_phoenix');
    expect(phoenix).toBeDefined();
    expect(phoenix!.abilities.flying).toBe(true);

    // 9. 神龙之力（Dragon Strength）让生命上限与伤害暴涨 +100%（对刚召唤的凤凰或存活剑士验证）
    const dragTarget = blade.status === 'alive' ? blade : phoenix!;
    const maxHpBeforeDrag = computeUnitStats(dragTarget, state, TOUHOU_CATALOG).maxHp;
    const dragRes = castAsReimu({ spellId: 'nature_dragon_strength', targetUnitId: dragTarget.id });
    expect(dragRes.ok, dragRes.error).toBe(true);
    expect(computeUnitStats(dragTarget, state, TOUHOU_CATALOG).maxHp).toBeGreaterThanOrEqual(Math.round(maxHpBeforeDrag * 1.9));

    // 10. 绝对反魔（Anti-Magic）赋予全魔免，且可被驱散术（Dispel）解除！
    const amRes = castAsReimu({ spellId: 'nature_anti_magic', targetUnitId: dragTarget.id });
    expect(amRes.ok, amRes.error).toBe(true);
    expect(dragTarget.abilities.magicImmune).toBe(true);
    expect(castAsReimu({ spellId: 'life_heal', targetUnitId: dragTarget.id }).ok).toBe(false);
    const dispRes = castAsReimu({ spellId: 'order_dispel', targetUnitId: dragTarget.id });
    expect(dispRes.ok, dispRes.error).toBe(true);
    expect(dragTarget.abilities.magicImmune).toBe(false);

    // 11. 流沙陷阱（Quicksand）成功在战场铺设多格流沙
    const qsRes = castAsReimu({ spellId: 'nature_quicksand', targetHex: offsetToAxial(9, 12) });
    expect(qsRes.ok).toBe(true);
    expect(state.battleSpellFlags.quicksandHexKeys.length).toBeGreaterThan(0);
  });

  it('全部 150 个法术应具备一对一专属 24×24 手绘像素图标且像素哈希 100% 零重复撞脸', () => {
    const allRegisteredIds = Object.keys(TOUHOU_CATALOG.spells);
    expect(allRegisteredIds).toHaveLength(150);
    expect(ALL_SPELL_ICON_IDS).toHaveLength(150);

    const hashToSpellId = new Map<string, string>();
    const collisions: Array<[string, string]> = [];

    for (const id of allRegisteredIds) {
      expect(SPELL_ICON_DRAWERS[id], `缺少法术专属图标绘制函数: ${id}`).toBeDefined();
      const pixels = getSpellIconPixels(id);
      expect(pixels, `法术图标光栅化失败: ${id}`).not.toBeNull();
      expect(pixels!.length).toBe(24 * 24 * 4);

      const hash = computeSpellIconPixelHash(id)!;
      const existing = hashToSpellId.get(hash);
      if (existing) {
        collisions.push([existing, id]);
      } else {
        hashToSpellId.set(hash, id);
      }
    }

    expect(collisions, `检测到重复撞脸法术图标: ${JSON.stringify(collisions)}`).toEqual([]);
    expect(hashToSpellId.size).toBe(150);
  });

  it('全部 150 个法术应具备一对一专属 pixelfx 多阶段特效编排且全部模块与调色板引用合法', () => {
    const allRegisteredIds = Object.keys(TOUHOU_CATALOG.spells);
    expect(allRegisteredIds).toHaveLength(150);
    expect(ALL_SPELL_VFX_IDS).toHaveLength(150);

    const moduleKeys = new Set(Object.keys(PIXELFX_MODULES));
    const paletteKeys = new Set(Object.keys(TOUHOU_PALETTES));
    expect(moduleKeys.size).toBeGreaterThanOrEqual(70);
    expect(paletteKeys.size).toBeGreaterThanOrEqual(24);

    for (const id of allRegisteredIds) {
      const choreo = SPELL_VFX_CATALOG[id];
      expect(choreo, `缺少法术专属特效编排: ${id}`).toBeDefined();
      expect(moduleKeys.has(choreo.impactFx), `${id} 引用了未知主特效模块 ${choreo.impactFx}`).toBe(true);
      expect(paletteKeys.has(choreo.impactPalette), `${id} 引用了未知主调色板 ${choreo.impactPalette}`).toBe(true);
      if (choreo.casterFx) {
        expect(moduleKeys.has(choreo.casterFx), `${id} 引用了未知起手模块 ${choreo.casterFx}`).toBe(true);
      }
      if (choreo.casterPalette) {
        expect(paletteKeys.has(choreo.casterPalette), `${id} 引用了未知起色调色板 ${choreo.casterPalette}`).toBe(true);
      }
      if (choreo.secondaryFx) {
        expect(moduleKeys.has(choreo.secondaryFx), `${id} 引用了未知副层模块 ${choreo.secondaryFx}`).toBe(true);
      }
      if (choreo.secondaryPalette) {
        expect(paletteKeys.has(choreo.secondaryPalette), `${id} 引用了未知副色调色板 ${choreo.secondaryPalette}`).toBe(true);
      }
      if (choreo.perTargetFx) {
        expect(moduleKeys.has(choreo.perTargetFx), `${id} 引用了未知逐目标模块 ${choreo.perTargetFx}`).toBe(true);
      }
      if (choreo.perTargetPalette) {
        expect(paletteKeys.has(choreo.perTargetPalette), `${id} 引用了未知逐目标调色板 ${choreo.perTargetPalette}`).toBe(true);
      }
      if (choreo.weatherFx) {
        expect(moduleKeys.has(choreo.weatherFx), `${id} 引用了未知天象模块 ${choreo.weatherFx}`).toBe(true);
      }
      if (choreo.weatherPalette) {
        expect(paletteKeys.has(choreo.weatherPalette), `${id} 引用了未知天象调色板 ${choreo.weatherPalette}`).toBe(true);
      }
    }
  });
});

describe('20 格 Buff/Debuff FIFO 上限、36 技能树与 48 职业战前自由切职', () => {
  it('单单位最多同时承载 20 个 Buff/Debuff 状态槽位，超出时严格按 FIFO 顶替最早临时状态', () => {
    const { state } = createReimuVsMarisaBattle({ mode: 'hotseat', seed: 4201 });
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const ally = Object.values(state.units).find((u) => u.side === 'left' && u.kind === 'creature')!;

    expect(MAX_UNIT_BUFF_SLOTS).toBe(20);
    const atkBefore = computeUnitStats(ally, state, TOUHOU_CATALOG).attack;

    // 1. 依次向同一兵种施加 20 个异源属性修饰器 + 2 个状态旗标 = 22 项独立状态
    for (let i = 1; i <= 20; i += 1) {
      upsertUnitModifier(ally, state, {
        id: `test_mod_${i}`,
        stat: 'attack',
        mode: 'flat',
        value: 1,
        sourceName: `测试符咒#${i}`,
        remainingRounds: 5,
        spellPolarity: 'positive',
      });
    }
    ally.statusEffects.regenPerRound = 12;
    markStatusEffectOrder(ally, state, 'regenPerRound');
    ally.statusEffects.poisonPower = 8;
    markStatusEffectOrder(ally, state, 'poisonPower');

    expect(countActiveUnitStatusSlots(ally)).toBe(22);

    // 2. 触发上限裁剪，应精准挤出最早的「测试符咒#1」与「测试符咒#2」，保留最新 20 项！
    const evicted = enforceUnitStatusSlotCap(ally);
    expect(evicted).toEqual(['测试符咒#1', '测试符咒#2']);
    expect(countActiveUnitStatusSlots(ally)).toBe(20);

    const remainingKeys = listActiveUnitStatusSlots(ally).map((r) => r.key);
    expect(remainingKeys).not.toContain('测试符咒#1');
    expect(remainingKeys).not.toContain('测试符咒#2');
    expect(remainingKeys).toContain('测试符咒#3');
    expect(remainingKeys).toContain('测试符咒#20');
    expect(remainingKeys).toContain('regenPerRound');
    expect(remainingKeys).toContain('poisonPower');

    // 确认被挤出的 2 条攻击修饰器已彻底清零（剩余 18 条 +1 攻击，绝无幽灵数值）
    expect(computeUnitStats(ally, state, TOUHOU_CATALOG).attack).toBe(atkBefore + 18);

    // 3. 通过真实施法追加第 21 个法术「灵符·神佑」，自动挤出最早的「测试符咒#3」，总槽位恒 <= 20！
    state.activeUnitId = reimu.id;
    reimu.mana = 200;
    const castRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'life_bless', targetUnitId: ally.id },
      TOUHOU_CATALOG,
    );
    expect(castRes.ok, castRes.error).toBe(true);
    expect(countActiveUnitStatusSlots(ally)).toBe(20);
    expect(listActiveUnitStatusSlots(ally).map((r) => r.key)).not.toContain('测试符咒#3');
  });

  it('HoMM4 全部 9 主 × 3 子 = 36 技能树应严格校验前置门槛、支持级联收敛并切实作用于战斗数值', () => {
    expect(ALL_PRIMARY_SKILL_IDS).toHaveLength(9);
    expect(ALL_SECONDARY_SKILL_IDS).toHaveLength(27);

    const { state } = createReimuVsMarisaBattle({ mode: 'hotseat', seed: 4202 });
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const ally = Object.values(state.units).find((u) => u.side === 'left' && u.kind === 'creature')!;

    // 1. 格斗主技能降至 2 阶时，第 3 槽子技能「魔抗 (magic_resistance)」必须级联归零并禁止加点
    expect(setHeroPrimarySkillRank(state, reimu.id, 'combat', 2, TOUHOU_CATALOG).ok).toBe(true);
    expect(reimu.subSkills.magic_resistance ?? 0).toBe(0);
    expect(canIncrementSubSkill(reimu.skills, reimu.subSkills, 'magic_resistance').ok).toBe(false);
    expect(setHeroSecondarySkillRank(state, reimu.id, 'magic_resistance', 1, TOUHOU_CATALOG).ok).toBe(false);

    // 2. 将格斗升至 5 阶并点满魔抗 5 阶，魔抗必须显著暴涨（含宗师魔抗数值）
    const mrBefore = computeUnitStats(reimu, state, TOUHOU_CATALOG).magicResistance;
    expect(setHeroPrimarySkillRank(state, reimu.id, 'combat', 5, TOUHOU_CATALOG).ok).toBe(true);
    expect(setHeroSecondarySkillRank(state, reimu.id, 'magic_resistance', 5, TOUHOU_CATALOG).ok).toBe(true);
    const mrAfter = computeUnitStats(reimu, state, TOUHOU_CATALOG).magicResistance;
    expect(mrAfter).toBeGreaterThan(mrBefore + 0.5);

    // 3. 战术子技能「进攻/防御/领导」与贵族子技能「理财/外交」必须真实提升己方全军攻防、士气与血量！
    expect(setHeroPrimarySkillRank(state, reimu.id, 'tactics', 5, TOUHOU_CATALOG).ok).toBe(true);
    const allyBeforeTactics = computeUnitStats(ally, state, TOUHOU_CATALOG);
    expect(setHeroSecondarySkillRank(state, reimu.id, 'offense', 5, TOUHOU_CATALOG).ok).toBe(true);
    expect(setHeroSecondarySkillRank(state, reimu.id, 'defense', 5, TOUHOU_CATALOG).ok).toBe(true);
    expect(setHeroSecondarySkillRank(state, reimu.id, 'leadership', 5, TOUHOU_CATALOG).ok).toBe(true);
    const allyAfterTactics = computeUnitStats(ally, state, TOUHOU_CATALOG);
    expect(allyAfterTactics.attack).toBeGreaterThan(allyBeforeTactics.attack);
    expect(allyAfterTactics.defense).toBeGreaterThan(allyBeforeTactics.defense);
    expect(allyAfterTactics.morale).toBeGreaterThan(allyBeforeTactics.morale);

    const allyHpBeforeNobility = computeUnitStats(ally, state, TOUHOU_CATALOG).maxHp;
    expect(setHeroPrimarySkillRank(state, reimu.id, 'nobility', 5, TOUHOU_CATALOG).ok).toBe(true);
    expect(setHeroSecondarySkillRank(state, reimu.id, 'estates', 5, TOUHOU_CATALOG).ok).toBe(true);
    expect(setHeroSecondarySkillRank(state, reimu.id, 'diplomacy', 5, TOUHOU_CATALOG).ok).toBe(true);
    expect(computeUnitStats(ally, state, TOUHOU_CATALOG).maxHp).toBeGreaterThan(allyHpBeforeNobility);

    // 4. 秩序子技能「巫术 (wizardry)」应真实拉高英雄最大灵力上限
    const manaBefore = computeUnitStats(reimu, state, TOUHOU_CATALOG).maxMana;
    expect(setHeroSecondarySkillRank(state, reimu.id, 'wizardry', 5, TOUHOU_CATALOG).ok).toBe(true);
    expect(computeUnitStats(reimu, state, TOUHOU_CATALOG).maxMana).toBeGreaterThan(manaBefore);
  });

  it('11 基础 + 37 进阶职业全量收录：战前整备支持大贤者在多满足职业间自由切职并生效被动，开战后自动锁定', () => {
    expect(ALL_H4_BASE_CLASS_IDS).toHaveLength(11);
    expect(ALL_H4_ADVANCED_CLASS_IDS).toHaveLength(37);
    expect(Object.keys(TOUHOU_CATALOG.advancedClasses)).toHaveLength(37);

    // 校验 36 对无序两两主技能组合 + 1 个全系大贤者 = 37 进阶职业无一遗漏、无一重复
    const pairKeys = new Set<string>();
    let archmageCount = 0;
    for (const cls of Object.values(H4_ADVANCED_CLASSES)) {
      if (cls.minMagicTrees && cls.minMagicTrees >= 3) {
        archmageCount += 1;
      } else {
        const pair = [cls.primaryA, cls.primaryB].sort().join('+');
        expect(pairKeys.has(pair), `检测到重复技能树组合: ${pair}`).toBe(false);
        pairKeys.add(pair);
      }
    }
    expect(archmageCount).toBe(1);
    expect(pairKeys.size).toBe(36);

    const { state } = createReimuVsMarisaBattle({ mode: 'hotseat', seed: 4203 });
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;

    // 战前整备阶段允许自由切职
    expect(state.hasCombatStarted).toBe(false);
    expect(canModifyHeroClassOrBuild(state)).toBe(true);

    // 灵梦初始五系全满 + 格斗/战术，至少应同时满足 15 个以上进阶职业资格！
    const eligible = resolveEligibleAdvancedClasses(reimu.skills, reimu.subSkills, TOUHOU_CATALOG.advancedClasses);
    expect(eligible.length).toBeGreaterThanOrEqual(15);
    expect(eligible.some((c) => c.id === 'archmage')).toBe(true);
    expect(eligible.some((c) => c.id === 'wizard')).toBe(true);
    expect(eligible.some((c) => c.id === 'paladin')).toBe(true);
    expect(eligible.some((c) => c.id === 'fireguard')).toBe(true);

    // 1. 自由切换至「星辰大魔导 (wizard)」：所有法术耗蓝应实打实减少 2 MP！
    const baseFireballCost = getEffectiveSpellManaCost(
      state,
      reimu,
      TOUHOU_CATALOG.spells.chaos_fireball,
      TOUHOU_CATALOG.advancedClasses,
    );
    expect(selectHeroAdvancedClass(state, reimu.id, 'wizard', TOUHOU_CATALOG).ok).toBe(true);
    expect(reimu.advancedClassId).toBe('wizard');
    expect(
      getEffectiveSpellManaCost(state, reimu, TOUHOU_CATALOG.spells.chaos_fireball, TOUHOU_CATALOG.advancedClasses),
    ).toBe(Math.max(1, baseFireballCost - 2));

    // 2. 自由切换至「退魔圣巫女 (paladin)」：自动获得抗死结界 deathWard
    expect(selectHeroAdvancedClass(state, reimu.id, 'paladin', TOUHOU_CATALOG).ok).toBe(true);
    expect(reimu.advancedClassId).toBe('paladin');
    expect(reimu.abilities.deathWard).toBe(true);
    expect(reimu.abilities.fireShield).toBeFalsy();

    // 3. 自由切换至「炽焰守卫 (fireguard)」：自动获得烈焰护盾与火抗，且旧职业抗死结界干净卸下！
    expect(selectHeroAdvancedClass(state, reimu.id, 'fireguard', TOUHOU_CATALOG).ok).toBe(true);
    expect(reimu.advancedClassId).toBe('fireguard');
    expect(reimu.abilities.fireShield).toBe(true);
    expect(reimu.abilities.fireResistant).toBe(true);
    expect(reimu.abilities.deathWard).toBeFalsy();

    // 4. 切换回「万象结界大贤者 (archmage)」并执行一次正式战斗指令进入交战状态
    expect(selectHeroAdvancedClass(state, reimu.id, 'archmage', TOUHOU_CATALOG).ok).toBe(true);
    const activeUnitId = state.activeUnitId!;
    const defendRes = dispatchCombatCommand(state, { type: 'DEFEND', unitId: activeUnitId }, TOUHOU_CATALOG);
    expect(defendRes.ok).toBe(true);
    expect(state.hasCombatStarted).toBe(true);
    expect(canModifyHeroClassOrBuild(state)).toBe(false);

    // 5. 交战中切职与改点均被引擎严格拒绝！
    const lockedSwitch = selectHeroAdvancedClass(state, reimu.id, 'wizard', TOUHOU_CATALOG);
    expect(lockedSwitch.ok).toBe(false);
    expect(reimu.advancedClassId).toBe('archmage');
    expect(setHeroPrimarySkillRank(state, reimu.id, 'nobility', 3, TOUHOU_CATALOG).ok).toBe(false);
    expect(setHeroSecondarySkillRank(state, reimu.id, 'sorcery', 5, TOUHOU_CATALOG).ok).toBe(false);
  });

  it('全量 106 个特效模块与 148 法术编排应零脏矩形黑底、零天象单体错配、零静默替身崩溃且光柱顶缘平滑羽化', () => {
    // 1. 严禁 148 法术把 5 大全屏天象误放入单体 casterFx / impactFx / secondaryFx / perTargetFx 槽位！
    for (const [spellId, choreo] of Object.entries(SPELL_VFX_CATALOG)) {
      for (const slotKey of ['casterFx', 'impactFx', 'secondaryFx', 'perTargetFx'] as const) {
        const fxId = choreo[slotKey];
        if (fxId) {
          expect(
            TOUHOU_WEATHER_FX_SET.has(fxId),
            `法术 ${spellId} 的局域槽位 ${slotKey} 误引用了全屏天象 ${fxId}`,
          ).toBe(false);
        }
      }
    }

    // 2. 全量 106 个模块均可在 SILENT_PIXELFX_ACTOR + 后处理净化管线下零崩溃安全光栅化
    const W = 640;
    const H = 360;
    const frame = createFrame(W, H, 0, 0);
    const scratch = createFrame(W, H, 0, 0);
    const rgba = new Uint8ClampedArray(W * H * 4);

    for (const [fxId, mod] of Object.entries(PIXELFX_MODULES)) {
      const originY = TOUHOU_WEATHER_FX_SET.has(fxId) ? 180 : 250;
      const instance = createFx(mod, {
        x: 320,
        y: originY,
        seed: 77,
        palette: [...TOUHOU_PALETTES.shrine_gold],
        light: 1.35,
        actor: SILENT_PIXELFX_ACTOR,
      } as Parameters<typeof createFx>[1]);
      instance.update(0.75);
      clearFrame(frame);
      const postRule = MODULE_POST_PROCESS_RULES.get(mod);
      if (postRule) {
        clearFrame(scratch);
        instance.draw(scratch);
        blendSanitizedScratchIntoFrame(scratch, frame, originY, postRule);
      } else {
        instance.draw(frame);
      }
      composite(frame, rgba, null, 1.25);

      // 5 大全屏天象（含八百万神降 god_rays、西行妖 cherry_blossoms）绝不可糊出大面积暗色底纹矩形！
      if (TOUHOU_WEATHER_FX_SET.has(fxId)) {
        let darkOpaqueCount = 0;
        let visibleCount = 0;
        for (let i = 0; i < W * H; i++) {
          const j = i * 4;
          const a = rgba[j + 3];
          if (a > 10) {
            visibleCount += 1;
            const lum = (rgba[j] + rgba[j + 1] + rgba[j + 2]) / 3;
            if (lum < 48 && a > 55) darkOpaqueCount += 1;
          }
        }
        expect(visibleCount, `全屏天象 ${fxId} 渲染结果不应为空`).toBeGreaterThan(200);
        expect(
          darkOpaqueCount / (W * H),
          `全屏天象 ${fxId} 存在大面积暗色底纹污染 (${darkOpaqueCount} px)`,
        ).toBeLessThan(0.02);
      }
    }

    // 3. 专门回归校验「八百万神降」圣柱 holy_pillar 经顶部羽化通道后，TOP=-204 处（屏幕 y=66）彻底平滑渐隐而非硬平切！
    const originY = 270;
    const pillarRule = MODULE_POST_PROCESS_RULES.get(PIXELFX_MODULES.holy_pillar)!;
    expect(pillarRule).toBeDefined();
    const pillar = createFx(PIXELFX_MODULES.holy_pillar, {
      x: 200,
      y: originY,
      seed: 13,
      palette: [...TOUHOU_PALETTES.shrine_gold],
      light: 1.5,
      actor: SILENT_PIXELFX_ACTOR,
    } as Parameters<typeof createFx>[1]);
    for (let s = 0; s < 12; s++) pillar.update(0.1);
    clearFrame(frame);
    clearFrame(scratch);
    pillar.draw(scratch);
    blendSanitizedScratchIntoFrame(scratch, frame, originY, pillarRule);
    composite(frame, rgba, null, 1.25);

    const topCutY = originY + pillarRule.topOffset; // y = 66
    let maxTopRowAlpha = 0;
    for (let x = 0; x < W; x++) {
      const a = rgba[(topCutY * W + x) * 4 + 3];
      if (a > maxTopRowAlpha) maxTopRowAlpha = a;
    }
    expect(maxTopRowAlpha, 'holy_pillar 顶部截断行应被柔和羽化至近乎透明').toBeLessThan(35);
  });

  it('全 150 法术与专属符卡 Hover 应严格遵循「简介 + 客观效果 + 可选斜体彩蛋」三段式且零冗余括号', () => {
    const bracketRe = /[()（）]/;
    const allSpells = Object.values(TOUHOU_CATALOG.spells);
    expect(allSpells).toHaveLength(150);

    let flavorCount = 0;
    for (const sp of allSpells) {
      const copy = SPELL_COPY_CATALOG[sp.id];
      expect(copy, `法术 ${sp.id} 缺少三段式文案条目`).toBeDefined();
      expect(copy.summary.trim().length, `法术 ${sp.id} 简介过短`).toBeGreaterThanOrEqual(6);
      expect(copy.effect.trim().length, `法术 ${sp.id} 客观效果过短`).toBeGreaterThanOrEqual(8);
      expect(bracketRe.test(copy.summary), `法术 ${sp.id} 简介含冗余括号: ${copy.summary}`).toBe(false);
      expect(bracketRe.test(copy.effect), `法术 ${sp.id} 客观效果含冗余括号: ${copy.effect}`).toBe(false);
      if (copy.flavor) {
        flavorCount += 1;
        expect(bracketRe.test(copy.flavor), `法术 ${sp.id} 彩蛋含冗余括号: ${copy.flavor}`).toBe(false);
      }

      const tip = buildSpellTooltipPayload(sp, { effectiveManaCost: Math.max(1, sp.manaCost - 2), currentMana: 20 });
      expect(tip.summary).toBe(copy.summary);
      expect(tip.lines).toEqual([copy.effect]);
      expect(tip.flavor).toBe(copy.flavor);
      expect(bracketRe.test(tip.subtitle ?? ''), `副标题含冗余括号: ${tip.subtitle}`).toBe(false);
      expect(bracketRe.test(tip.tag ?? ''), `角标含冗余括号: ${tip.tag}`).toBe(false);
    }

    // 精选部分法术配备斜体彩蛋（克制留白，并非全塞）
    expect(flavorCount).toBeGreaterThanOrEqual(20);
    expect(flavorCount).toBeLessThan(allSpells.length);

    // 校验全部专属符卡三段式文案与构造器
    for (const card of Object.values(TOUHOU_CATALOG.spellCards)) {
      const cardCopy = SPELL_CARD_COPY_CATALOG[card.id];
      expect(cardCopy, `专属符卡 ${card.id} 缺少三段式文案`).toBeDefined();
      const tip = buildSpellCardTooltipPayload(card, { currentMana: 20, currentCharge: 100 });
      expect(tip.summary).toBe(cardCopy.summary);
      expect(tip.lines).toEqual([cardCopy.effect]);
      expect(tip.flavor).toBe(cardCopy.flavor);
      expect(bracketRe.test(tip.summary ?? '')).toBe(false);
      expect(bracketRe.test(tip.lines.join(''))).toBe(false);
    }
  });

  it('正统 HoMM4 士气机制：高士气抢占先手梯队并增伤 +25%（不额外再动）、低士气落末位并减伤 -20%、百神狂欢回合中即时生效', () => {
    // 1. 概率公式单一事实来源校验：士气每点 10%（机械免疫），双向幸运已压缩上限
    const tunedMax = computeMoraleLuckRates(10, 10, 'equilibris_tuned', false);
    expect(tunedMax.goodMoraleChance).toBeCloseTo(1.0, 5);
    expect(tunedMax.attackLuckChance).toBeCloseTo(0.35, 5);
    expect(tunedMax.defenseLuckChance).toBeCloseTo(0.3, 5);
    const tunedMin = computeMoraleLuckRates(-10, -10, 'equilibris_tuned', false);
    expect(tunedMin.badMoraleChance).toBeCloseTo(1.0, 5);
    expect(tunedMin.attackBadLuckChance).toBeCloseTo(0.3, 5);
    expect(tunedMin.defenseBadLuckChance).toBeCloseTo(0.25, 5);
    const classicMax = computeMoraleLuckRates(10, 10, 'classic_h4', false);
    expect(classicMax.attackLuckChance).toBeCloseTo(0.4, 5);
    expect(classicMax.defenseLuckChance).toBeCloseTo(0.35, 5);
    const mechRates = computeMoraleLuckRates(-10, 10, 'classic_h4', true);
    expect(mechRates.goodMoraleChance).toBe(0);
    expect(mechRates.badMoraleChance).toBe(0);

    // 2. 满士气（+10）绝对不会获得额外回合（彻底杜绝群体振奋无限连动超模）
    const { state } = createReimuVsMarisaBattle({ mode: 'hotseat', seed: 5101 });
    const blade = Object.values(state.units).find((u) => u.side === 'left' && u.kind === 'creature')!;
    blade.baseStats.morale = 10;
    blade.roundMoraleState = 'good';
    state.activeUnitId = blade.id;

    const reach = getUnitReachableMap(state, blade, TOUHOU_CATALOG);
    const destKey = [...reach.costs.keys()].find((k) => k !== hexKey(blade.pos))!;
    const dest = state.tiles[destKey];
    const mv = dispatchCombatCommand(
      state,
      { type: 'MOVE', unitId: blade.id, to: { q: dest.q, r: dest.r } },
      TOUHOU_CATALOG,
    );
    expect(mv.ok).toBe(true);
    expect(state.activeUnitId).not.toBe(blade.id);

    // 3. 伤害增减成校验：高士气 +25%，低士气 -20%（实时反映在攻击预估与实际交锋中）
    const map = buildShrineNightBattleMap();
    const { state: dmgState } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'creature', defId: 'exorcist_blade', count: 20, col: 7, row: 10 }],
        rightSlots: [{ kind: 'creature', defId: 'starfire_efreet', count: 20, col: 8, row: 10 }],
        controllers: { left: 'human', right: 'human' },
        seed: 5150,
      },
      TOUHOU_CATALOG,
    );
    const atk = Object.values(dmgState.units).find((u) => u.side === 'left')!;
    const def = Object.values(dmgState.units).find((u) => u.side === 'right')!;
    atk.roundMoraleState = 'neutral';
    const neutralPreview = previewAttack(dmgState, atk.id, def.id, TOUHOU_CATALOG);
    atk.roundMoraleState = 'good';
    const goodPreview = previewAttack(dmgState, atk.id, def.id, TOUHOU_CATALOG);
    atk.roundMoraleState = 'bad';
    const badPreview = previewAttack(dmgState, atk.id, def.id, TOUHOU_CATALOG);

    expect(goodPreview.expectedMaxDamage).toBeGreaterThan(neutralPreview.expectedMaxDamage);
    expect(goodPreview.expectedMaxDamage / neutralPreview.expectedMaxDamage).toBeCloseTo(1.25, 1);
    expect(goodPreview.notes.some((n) => n.includes('高士气(+25%)'))).toBe(true);
    expect(badPreview.expectedMaxDamage).toBeLessThan(neutralPreview.expectedMaxDamage);
    expect(badPreview.expectedMaxDamage / neutralPreview.expectedMaxDamage).toBeCloseTo(0.8, 1);
    expect(badPreview.notes.some((n) => n.includes('低士气(-20%)'))).toBe(true);

    // 4. 三层行动梯队与回合中施放「百神狂欢」即时重排队列验证
    const { state: queueState } = createReimuVsMarisaBattle({ mode: 'hotseat', seed: 5200 });
    const reimu = Object.values(queueState.units).find((u) => u.defId === 'hero_reimu')!;
    const slowAlly = Object.values(queueState.units)
      .filter((u) => u.side === 'left' && u.kind === 'creature' && !u.abilities.mechanical)
      .sort((a, b) => a.baseStats.initiative - b.baseStats.initiative)[0]!;
    const fastEnemy = Object.values(queueState.units)
      .filter((u) => u.side === 'right' && !u.abilities.mechanical)
      .sort((a, b) => b.baseStats.initiative - a.baseStats.initiative)[0]!;
    // 压低 slowAlly 先攻、抬高 fastEnemy 先攻，确认常态下 slowAlly 原本排在 fastEnemy 之后
    slowAlly.baseStats.initiative = 2;
    fastEnemy.baseStats.initiative = 25;
    fastEnemy.roundMoraleState = 'neutral';
    slowAlly.roundMoraleState = 'neutral';
    reimu.mana = 50;
    if (!reimu.knownSpellIds.includes('life_mass_fervor')) {
      reimu.knownSpellIds.push('life_mass_fervor');
    }
    queueState.activeUnitId = reimu.id;
    queueState.turnQueue = [reimu.id, fastEnemy.id, slowAlly.id];

    const castRes = dispatchCombatCommand(
      queueState,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'life_mass_fervor' },
      TOUHOU_CATALOG,
    );
    expect(castRes.ok).toBe(true);
    expect(slowAlly.roundMoraleState).toBe('good');
    expect(castRes.events.some((e) => e.type === 'MORALE_TRIGGERED' && e.kind === 'good' && e.unitId === slowAlly.id)).toBe(true);
    // 百神狂欢生效后，高士气的 slowAlly 立刻跃升至 fastEnemy 之前拿到下一个行动权！
    expect(queueState.activeUnitId).toBe(slowAlly.id);
  });

  it('压缩上限后的双向幸运与厄运机制：四类判定均真实触发且满幸运绝非 100% 必暴', () => {
    const map = buildShrineNightBattleMap();
    let atkLuckyCount = 0;
    let atkUnluckyCount = 0;
    let defLuckyCount = 0;
    let defUnluckyCount = 0;
    const posTrials = 40;
    const negTrials = 40;

    for (let trial = 0; trial < posTrials + negTrials; trial++) {
      const { state } = createBattleState(
        {
          mapWidth: map.width,
          mapHeight: map.height,
          tiles: map.tiles,
          leftSlots: [{ kind: 'creature', defId: 'exorcist_blade', count: 20, col: 7, row: 10 }],
          rightSlots: [{ kind: 'creature', defId: 'starfire_efreet', count: 20, col: 8, row: 10 }],
          controllers: { left: 'human', right: 'human' },
          balancePreset: 'equilibris_tuned',
          seed: 6100 + trial,
        },
        TOUHOU_CATALOG,
      );
      const atk = Object.values(state.units).find((u) => u.side === 'left')!;
      const def = Object.values(state.units).find((u) => u.side === 'right')!;
      const sign = trial < posTrials ? 10 : -10;
      atk.baseStats.luck = sign;
      def.baseStats.luck = sign;
      state.activeUnitId = atk.id;

      const res = dispatchCombatCommand(state, { type: 'ATTACK', unitId: atk.id, targetId: def.id }, TOUHOU_CATALOG);
      expect(res.ok).toBe(true);
      const ex = res.events.find((e) => e.type === 'COMBAT_EXCHANGE');
      if (ex?.type === 'COMBAT_EXCHANGE' && ex.attackerStrike) {
        if (ex.attackerStrike.luckyCrit) atkLuckyCount += 1;
        if (ex.attackerStrike.unluckyHit) atkUnluckyCount += 1;
        if (ex.attackerStrike.defenderLucky) defLuckyCount += 1;
        if (ex.attackerStrike.defenderUnlucky) defUnluckyCount += 1;
      }
    }

    expect(atkLuckyCount).toBeGreaterThan(0);
    expect(atkLuckyCount).toBeLessThan(posTrials);
    expect(defLuckyCount).toBeGreaterThan(0);
    expect(defLuckyCount).toBeLessThan(posTrials);
    expect(atkUnluckyCount).toBeGreaterThan(0);
    expect(atkUnluckyCount).toBeLessThan(negTrials);
    expect(defUnluckyCount).toBeGreaterThan(0);
    expect(defUnluckyCount).toBeLessThan(negTrials);
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

  it('HoMM4 五大生物类型对齐（活体/机械/不死/元素/幻象）与不死友军 -2 士气光环、免疫矩阵应严格生效', () => {
    // 1. 静态图鉴配置校验：全图鉴由原混沌三暗系 + 幽冥公馆四暗系（小恶魔/血族眷属/深渊隙间恶魔/深渊冰魔）持有 darkNature
    const darkIds = Object.values(TOUHOU_CATALOG.creatures)
      .filter((c) => c.abilities.darkNature)
      .map((c) => c.id)
      .sort();
    expect(darkIds).toEqual([
      'abyss_gap_devil',
      'abyss_ice_demon',
      'crimson_vampire',
      'forest_shadow_imp',
      'grimoire_familiar',
      'koakuma_imp',
      'miasma_nightmare',
    ]);

    // 元素（法界之火 + 自然四大元素）、不死（地底怨灵 + 三阶招魂亡灵）、机械（四造物）归类准确
    expect(TOUHOU_CATALOG.creatures.starfire_efreet.abilities.elemental).toBe(true);
    expect(TOUHOU_CATALOG.creatures.summon_fire_elemental.abilities.elemental).toBe(true);
    expect(TOUHOU_CATALOG.creatures.summon_fire_elemental.abilities.mechanical).toBeFalsy();
    expect(TOUHOU_CATALOG.creatures.vengeful_spirit.abilities.undead).toBe(true);
    expect(TOUHOU_CATALOG.creatures.vengeful_spirit.abilities.darkNature).toBeFalsy();
    expect(TOUHOU_CATALOG.creatures.corpse_husk.abilities.undead).toBe(true);
    expect(TOUHOU_CATALOG.creatures.corpse_husk.abilities.darkNature).toBeFalsy();
    expect(TOUHOU_CATALOG.creatures.hourai_doll.abilities.mechanical).toBe(true);
    expect(TOUHOU_CATALOG.creatures.exorcist_blade.abilities.mechanical).toBeFalsy();
    expect(TOUHOU_CATALOG.creatures.exorcist_blade.abilities.undead).toBeFalsy();
    expect(TOUHOU_CATALOG.creatures.exorcist_blade.abilities.elemental).toBeFalsy();

    // 2. 实战构建五类单位：默认活体（退魔剑士）、机械（武装人形）、不死（地底怨灵）、元素（法界之火）+ 幻象分身
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_reimu', col: 5, row: 10 },
          { kind: 'creature', defId: 'exorcist_blade', count: 10, col: 3, row: 8 },
          { kind: 'creature', defId: 'hourai_doll', count: 8, col: 3, row: 10 },
          { kind: 'creature', defId: 'vengeful_spirit', count: 8, col: 3, row: 12 },
          { kind: 'creature', defId: 'starfire_efreet', count: 6, col: 5, row: 12 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'exorcist_blade', count: 10, col: 7, row: 8 },
          { kind: 'creature', defId: 'hourai_doll', count: 8, col: 7, row: 10 },
          { kind: 'creature', defId: 'vengeful_spirit', count: 8, col: 7, row: 12 },
          { kind: 'creature', defId: 'starfire_efreet', count: 6, col: 5, row: 8 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 7200,
      },
      TOUHOU_CATALOG,
    );

    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const allyLiving = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'exorcist_blade')!;
    const allyMech = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'hourai_doll')!;
    const allyUndead = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'vengeful_spirit')!;
    const allyElem = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'starfire_efreet')!;

    const enemyMech = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'hourai_doll')!;
    const enemyUndead = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'vengeful_spirit')!;
    const enemyElem = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'starfire_efreet')!;

    // 召唤一个退魔剑士幻象分身
    state.activeUnitId = reimu.id;
    reimu.mana = 200;
    expect(
      dispatchCombatCommand(
        state,
        { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'order_create_illusion', targetUnitId: allyLiving.id },
        TOUHOU_CATALOG,
      ).ok,
    ).toBe(true);
    const allyIllusion = Object.values(state.units).find((u) => u.isIllusion)!;
    expect(allyIllusion).toBeDefined();

    // 五大类型判定与免疫矩阵校验
    expect(getCreatureTypeKind(allyLiving)).toBe('living');
    expect(getCreatureTypeKind(allyMech)).toBe('mechanical');
    expect(getCreatureTypeKind(allyUndead)).toBe('undead');
    expect(getCreatureTypeKind(allyElem)).toBe('elemental');
    expect(getCreatureTypeKind(allyIllusion)).toBe('illusion');

    expect(isImmuneToMorale(allyMech)).toBe(true);
    expect(isImmuneToMorale(allyUndead)).toBe(true);
    expect(isImmuneToMorale(allyElem)).toBe(false);
    expect(isImmuneToMorale(allyLiving)).toBe(false);

    expect(isImmuneToMindSpells(allyMech)).toBe(true);
    expect(isImmuneToMindSpells(allyUndead)).toBe(true);
    expect(isImmuneToMindSpells(allyIllusion)).toBe(true);
    expect(isImmuneToMindSpells(allyElem)).toBe(false);

    for (const nonLiving of [allyMech, allyUndead, allyElem, allyIllusion]) {
      expect(isImmuneToLivingHeal(nonLiving)).toBe(true);
      expect(isImmuneToLivingEffects(nonLiving)).toBe(true);
    }

    // 3. 不死同队 -2 士气光环：非死亡友军（退魔剑士/法界之火）挂上「同队不死威压 (-2)」，机械与不死自身免疫士气不受影响
    const livingStats = computeUnitStats(allyLiving, state, TOUHOU_CATALOG);
    const elemStats = computeUnitStats(allyElem, state, TOUHOU_CATALOG);
    const mechStats = computeUnitStats(allyMech, state, TOUHOU_CATALOG);
    const undeadStats = computeUnitStats(allyUndead, state, TOUHOU_CATALOG);
    expect(livingStats.breakdowns.morale?.some((b) => b.sourceName.includes('同队不死威压') && b.deltaText === '-2')).toBe(true);
    expect(elemStats.breakdowns.morale?.some((b) => b.sourceName.includes('同队不死威压') && b.deltaText === '-2')).toBe(true);
    expect(mechStats.breakdowns.morale?.some((b) => b.sourceName.includes('同队不死威压')) ?? false).toBe(false);
    expect(undeadStats.breakdowns.morale?.some((b) => b.sourceName.includes('同队不死威压')) ?? false).toBe(false);

    // 4. 活体治愈（life_bind_wound）拒绝机械/不死/元素/幻象，但允许普通活体（断言拒绝原因为非活体，排除视线误判）
    const castAsReimu = (spellId: string, targetUnitId: string) => {
      state.activeUnitId = reimu.id;
      reimu.mana = 200;
      reimu.hasActedThisRound = false;
      return dispatchCombatCommand(state, { type: 'CAST_SPELL', unitId: reimu.id, spellId, targetUnitId }, TOUHOU_CATALOG);
    };
    // 清空场上高耸地形柱以免干扰施法视线校验
    for (const tile of Object.values(state.tiles)) {
      if (tile.terrain === 'rock' || tile.terrain === 'wall' || tile.losObstruction !== 'none') {
        tile.terrain = 'plain';
        tile.elevation = 1;
        tile.blocksGround = false;
        tile.losObstruction = 'none';
        tile.moveCost = 1;
      }
    }
    allyLiving.currentHp = 1;
    expect(castAsReimu('life_bind_wound', allyLiving.id).ok).toBe(true);
    for (const nonLiving of [allyMech, allyUndead, allyElem, allyIllusion]) {
      nonLiving.currentHp = 1;
      const healRes = castAsReimu('life_bind_wound', nonLiving.id);
      expect(healRes.ok).toBe(false);
      expect(healRes.error).toContain('活体治愈');
    }

    // 5. 心智法术（order_hypnotize）拒绝机械/不死，但对元素生效；活体生理法术（death_poison）拒绝机械/不死/元素
    const hypMech = castAsReimu('order_hypnotize', enemyMech.id);
    expect(hypMech.ok).toBe(false);
    expect(hypMech.error).toContain('心智魔法');
    const hypUndead = castAsReimu('order_hypnotize', enemyUndead.id);
    expect(hypUndead.ok).toBe(false);
    expect(hypUndead.error).toContain('心智魔法');
    expect(castAsReimu('order_hypnotize', enemyElem.id).ok).toBe(true);
    for (const nonLivingEnemy of [enemyMech, enemyUndead]) {
      const poisonRes = castAsReimu('death_poison', nonLivingEnemy.id);
      expect(poisonRes.ok).toBe(false);
      expect(poisonRes.error).toContain('活体生物');
    }
    // 将被催眠的元素暂时还原为敌方以检验剧毒拒绝元素
    enemyElem.side = 'right';
    const poisonElem = castAsReimu('death_poison', enemyElem.id);
    expect(poisonElem.ok).toBe(false);
    expect(poisonElem.error).toContain('活体生物');

    // 6. HUD 特技徽章正确展示四大特殊类型且默认活体不打类型标签
    expect(buildUnitSpecialtyBadges(allyMech).some((b) => b.id === 'mechanical')).toBe(true);
    expect(buildUnitSpecialtyBadges(allyUndead).some((b) => b.id === 'undead')).toBe(true);
    expect(buildUnitSpecialtyBadges(allyElem).some((b) => b.id === 'elemental')).toBe(true);
    expect(buildUnitSpecialtyBadges(allyIllusion).some((b) => b.id === 'illusion')).toBe(true);
    expect(
      buildUnitSpecialtyBadges(allyLiving).some((b) =>
        ['mechanical', 'undead', 'elemental', 'illusion'].includes(b.id),
      ),
    ).toBe(false);
  });

  it('东方暗系（darkNature）锚定规则：对非暗系普通活体增伤 +15%（对暗系与四大非活体不触发），且承受魔法伤害额外 +10%', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_marisa', col: 7, row: 11 },
          { kind: 'creature', defId: 'forest_shadow_imp', count: 20, col: 6, row: 10 },
          { kind: 'creature', defId: 'miasma_nightmare', count: 6, col: 5, row: 12 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'exorcist_blade', count: 20, col: 8, row: 10 }, // 普通活体（非暗系）
          { kind: 'creature', defId: 'forest_shadow_imp', count: 20, col: 8, row: 12 }, // 暗系活体
          { kind: 'creature', defId: 'hourai_doll', count: 20, col: 8, row: 8 }, // 机械
          { kind: 'creature', defId: 'vengeful_spirit', count: 20, col: 9, row: 10 }, // 不死
          { kind: 'creature', defId: 'starfire_efreet', count: 20, col: 9, row: 12 }, // 元素
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 7300,
      },
      TOUHOU_CATALOG,
    );

    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;
    const atkImp = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'forest_shadow_imp')!;
    const atkNightmare = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'miasma_nightmare')!;

    const defLiving = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'exorcist_blade')!;
    const defDark = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'forest_shadow_imp')!;
    const defMech = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'hourai_doll')!;
    const defUndead = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'vengeful_spirit')!;
    const defElem = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'starfire_efreet')!;

    // 统一平坦高程、清空阻挡地形与防御值，剔除高地(+25%)与抗死结界/潜行干扰，以精确检验暗系 +15% 增伤倍率
    for (const tile of Object.values(state.tiles)) {
      tile.elevation = 1;
      if (tile.terrain === 'rock' || tile.terrain === 'wall' || tile.losObstruction !== 'none') {
        tile.terrain = 'plain';
        tile.blocksGround = false;
        tile.losObstruction = 'none';
        tile.moveCost = 1;
      }
    }
    atkImp.roundMoraleState = 'neutral';
    for (const target of [defLiving, defDark, defMech, defUndead, defElem]) {
      target.baseStats.defense = 12;
      target.baseStats.grazeChance = 0;
      target.abilities.deathWard = false;
      target.abilities.stealth = false;
    }

    // 1. 判定函数与战斗预览校验：仅对「非暗系且普通活体」触发 暗系蚀生(+15%)
    expect(isDarkBonusTarget(atkImp, defLiving)).toBe(true);
    expect(isDarkBonusTarget(atkNightmare, defLiving)).toBe(true);
    expect(isDarkBonusTarget(atkImp, defDark)).toBe(false);
    expect(isDarkBonusTarget(atkImp, defMech)).toBe(false);
    expect(isDarkBonusTarget(atkImp, defUndead)).toBe(false);
    expect(isDarkBonusTarget(atkImp, defElem)).toBe(false);
    expect(isDarkBonusTarget(atkImp, { abilities: {}, isIllusion: true })).toBe(false);

    const vsLiving = previewAttack(state, atkImp.id, defLiving.id, TOUHOU_CATALOG);
    const vsDark = previewAttack(state, atkImp.id, defDark.id, TOUHOU_CATALOG);
    const vsMech = previewAttack(state, atkImp.id, defMech.id, TOUHOU_CATALOG);
    const vsUndead = previewAttack(state, atkImp.id, defUndead.id, TOUHOU_CATALOG);
    const vsElem = previewAttack(state, atkImp.id, defElem.id, TOUHOU_CATALOG);

    expect(vsLiving.notes).toContain('暗系蚀生(+15%)');
    expect(vsDark.notes).not.toContain('暗系蚀生(+15%)');
    expect(vsMech.notes).not.toContain('暗系蚀生(+15%)');
    expect(vsUndead.notes).not.toContain('暗系蚀生(+15%)');
    expect(vsElem.notes).not.toContain('暗系蚀生(+15%)');
    // 同防御、同平地，对普通活体期望伤害应精确为对暗系/机械/不死/元素的 ×1.15 倍（允许整型取整 ±1 误差）
    expect(vsLiving.expectedMaxDamage).toBeGreaterThan(vsDark.expectedMaxDamage);
    expect(Math.abs(vsLiving.expectedMaxDamage - vsDark.expectedMaxDamage * 1.15)).toBeLessThanOrEqual(1);
    expect(vsMech.expectedMaxDamage).toBe(vsDark.expectedMaxDamage);
    expect(vsUndead.expectedMaxDamage).toBe(vsDark.expectedMaxDamage);
    expect(vsElem.expectedMaxDamage).toBe(vsDark.expectedMaxDamage);

    // 2. 暗系魔法易伤（+10%）：魔理沙施放同一直接伤害法术（chaos_magic_arrow），暗系目标较非暗系目标多受 +10% 伤害
    expect(isDarkMagicVulnerable(defDark)).toBe(true);
    expect(isDarkMagicVulnerable(defLiving)).toBe(false);

    marisa.knownSpellIds = Array.from(new Set([...marisa.knownSpellIds, 'chaos_magic_arrow']));
    // 消除魔抗/火抗/擦弹与 P 点变化干扰，确保两者仅存在 darkNature 差异
    defLiving.baseStats.magicResistance = 0;
    defDark.baseStats.magicResistance = 0;
    defLiving.abilities.fireResistant = false;
    defDark.abilities.fireResistant = false;
    defLiving.baseStats.maxHp = 500;
    defLiving.currentHp = 500;
    defDark.baseStats.maxHp = 500;
    defDark.currentHp = 500;

    state.activeUnitId = marisa.id;
    marisa.mana = 200;
    marisa.powerPoints = 0;
    const castLiving = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: marisa.id, spellId: 'chaos_magic_arrow', targetUnitId: defLiving.id },
      TOUHOU_CATALOG,
    );
    expect(castLiving.ok).toBe(true);
    const evLiving = castLiving.events.find((e) => e.type === 'SPELL_CAST');
    const dmgLiving = evLiving?.type === 'SPELL_CAST' ? (evLiving.damageMap?.[defLiving.id]?.damage ?? 0) : 0;

    state.activeUnitId = marisa.id;
    marisa.mana = 200;
    marisa.powerPoints = 0;
    marisa.hasActedThisRound = false;
    const castDark = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: marisa.id, spellId: 'chaos_magic_arrow', targetUnitId: defDark.id },
      TOUHOU_CATALOG,
    );
    expect(castDark.ok).toBe(true);
    const evDark = castDark.events.find((e) => e.type === 'SPELL_CAST');
    const dmgDark = evDark?.type === 'SPELL_CAST' ? (evDark.damageMap?.[defDark.id]?.damage ?? 0) : 0;

    expect(dmgLiving).toBeGreaterThan(0);
    expect(dmgDark).toBe(Math.round(dmgLiving * 1.1));
  });

  it('六大阵营与东方势力统一命名、法术五类极性快筛及语义着色分词器（含生物类型内联微标）应严格一致', () => {
    // 1. 六大阵营二段式名 + 东方势力名单一事实来源校验
    expect(ALIGNMENT_META.life.name).toBe('生命·信仰');
    expect(ALIGNMENT_META.life.factionName).toBe('信仰圣域');
    expect(ALIGNMENT_META.order.name).toBe('秩序·幻月');
    expect(ALIGNMENT_META.order.factionName).toBe('幻月庭园');
    expect(ALIGNMENT_META.death.name).toBe('死亡·幽冥');
    expect(ALIGNMENT_META.death.factionName).toBe('幽冥楼府');
    expect(ALIGNMENT_META.chaos.name).toBe('混沌·魔导');
    expect(ALIGNMENT_META.chaos.factionName).toBe('魔导结社');
    expect(ALIGNMENT_META.nature.name).toBe('自然·灵森');
    expect(ALIGNMENT_META.nature.factionName).toBe('自然森境');
    expect(ALIGNMENT_META.might.name).toBe('力量·武艺');
    expect(ALIGNMENT_META.might.factionName).toBe('武艺旧都');

    // 2. 全 148 法术极性五分法校验（每类均有覆盖，关键法术归类精准）
    const counts: Record<string, number> = {};
    for (const pol of ALL_SPELL_POLARITIES) counts[pol] = 0;
    for (const sp of Object.values(TOUHOU_CATALOG.spells)) {
      const pol = classifySpellPolarity(sp);
      counts[pol] += 1;
      const tip = buildSpellTooltipPayload(sp);
      expect(tip.badges?.length).toBe(2);
      expect(tip.badges?.[0]?.label).toBe(ALIGNMENT_META[sp.alignment].name);
      expect(tip.badges?.[1]?.label).toBe(SPELL_POLARITY_META[pol].label);
      expect(tip.badges?.[1]?.icon).toBe(SPELL_POLARITY_META[pol].icon);
    }
    for (const pol of ALL_SPELL_POLARITIES) {
      expect(counts[pol], `极性 ${pol} 应至少包含一个法术`).toBeGreaterThan(0);
    }
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.life_heal)).toBe('heal');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.life_bless)).toBe('buff');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.chaos_magic_arrow)).toBe('damage');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.death_poison)).toBe('debuff');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.order_blind)).toBe('debuff');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.order_teleport)).toBe('utility');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.nature_summon_fire_elemental)).toBe('utility');

    // 3. 语义着色分词器：阵营着色、特殊生物类型挂专属微标，且绝不误伤「蓬莱不死鸟」「不死炽焰」
    const tokens = tokenizeSemanticText('对死亡系、不死、暗系与混沌系目标伤害 +35%，对机械/元素/幻象生效，减防 -20%');
    expect(tokens.some((t) => t.kind === 'alignment' && t.text === '死亡系' && t.color === ALIGNMENT_META.death.textColor)).toBe(true);
    expect(tokens.some((t) => t.kind === 'alignment' && t.text === '混沌系' && t.color === ALIGNMENT_META.chaos.textColor)).toBe(true);
    expect(tokens.some((t) => t.kind === 'creatureType' && t.text === '不死' && t.icon === 'undead')).toBe(true);
    expect(tokens.some((t) => t.kind === 'creatureType' && t.text === '暗系' && t.icon === 'darkNature')).toBe(true);
    expect(tokens.some((t) => t.kind === 'creatureType' && t.text === '机械' && t.icon === 'mechanical')).toBe(true);
    expect(tokens.some((t) => t.kind === 'creatureType' && t.text === '元素' && t.icon === 'elemental')).toBe(true);
    expect(tokens.some((t) => t.kind === 'creatureType' && t.text === '幻象' && t.icon === 'illusion')).toBe(true);
    expect(tokens.some((t) => t.kind === 'deltaPos' && t.text === '+35%')).toBe(true);
    expect(tokens.some((t) => t.kind === 'deltaNeg' && t.text === '-20%')).toBe(true);

    const phoenixTokens = tokenizeSemanticText('召请蓬莱不死鸟，附着不死炽焰');
    expect(phoenixTokens.some((t) => t.kind === 'creatureType')).toBe(false);

    // 4. 抬头生物类型微标提取：默认活体为空，特殊生物/暗系返回对应微标
    expect(getUnitHeaderCreatureTags({ abilities: {} })).toEqual([]);
    expect(getUnitHeaderCreatureTags({ abilities: { darkNature: true } }).map((t) => t.icon)).toEqual(['darkNature']);
    expect(getUnitHeaderCreatureTags({ abilities: { undead: true } }).map((t) => t.icon)).toEqual(['undead']);
    expect(getUnitHeaderCreatureTags({ abilities: { elemental: true } }).map((t) => t.icon)).toEqual(['elemental']);
    expect(getUnitHeaderCreatureTags({ abilities: {}, isIllusion: true }).map((t) => t.icon)).toEqual(['illusion']);
  });

  it('双轨法术威力公式（非英雄按人头线性缩放 vs 英雄等级成长）及精准/嗜血/10处法术目标与结算 Bug 修复验证', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_reimu', col: 5, row: 10 },
          { kind: 'creature', defId: 'exorcist_blade', count: 10, col: 3, row: 8 }, // 纯近战活体
          { kind: 'creature', defId: 'broom_caster', count: 10, col: 3, row: 10 }, // 远近双能
          { kind: 'creature', defId: 'grimoire_familiar', count: 1, col: 3, row: 12 }, // 近战禁手 + 施法兵种
          { kind: 'creature', defId: 'hourai_doll', count: 8, col: 5, row: 12 }, // 机械
          { kind: 'creature', defId: 'vengeful_spirit', count: 8, col: 5, row: 8 }, // 不死 + 飞行
        ],
        rightSlots: [
          { kind: 'hero', defId: 'hero_marisa', col: 9, row: 10 }, // 施法英雄
          { kind: 'creature', defId: 'exorcist_blade', count: 30, col: 7, row: 8 }, // 纯近战敌人
          { kind: 'creature', defId: 'ofuda_archer', count: 20, col: 7, row: 10 }, // 远程敌人
          { kind: 'creature', defId: 'kedama', count: 30, col: 7, row: 12 }, // 非施法活体
          { kind: 'creature', defId: 'hourai_doll', count: 10, col: 8, row: 12 }, // 敌方机械
          { kind: 'creature', defId: 'vengeful_spirit', count: 10, col: 8, row: 8 }, // 敌方不死
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 7500,
      },
      TOUHOU_CATALOG,
    );

    // 清空阻挡与高地干扰，确保每条施法与攻防校验纯粹精准
    for (const tile of Object.values(state.tiles)) {
      tile.elevation = 1;
      if (tile.terrain === 'rock' || tile.terrain === 'wall' || tile.losObstruction !== 'none') {
        tile.terrain = 'plain';
        tile.blocksGround = false;
        tile.losObstruction = 'none';
        tile.moveCost = 1;
      }
    }

    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const allyMelee = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'exorcist_blade')!;
    const allyHybrid = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'broom_caster')!;
    const allyTome = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'grimoire_familiar')!;
    const allyMech = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'hourai_doll')!;
    const allyUndead = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'vengeful_spirit')!;

    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;
    const enemyMelee = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'exorcist_blade')!;
    const enemyArcher = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'ofuda_archer')!;
    const enemyKedama = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'kedama')!;
    const enemyMech = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'hourai_doll')!;
    const enemyUndead = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'vengeful_spirit')!;

    const castAs = (
      caster: typeof reimu,
      spellId: string,
      extra: Partial<Extract<Parameters<typeof dispatchCombatCommand>[1], { type: 'CAST_SPELL' }>> = {},
    ) => {
      state.activeUnitId = caster.id;
      caster.mana = 200;
      caster.hasActedThisRound = false;
      if (!caster.knownSpellIds.includes(spellId)) {
        caster.knownSpellIds.push(spellId);
      }
      return dispatchCombatCommand(state, { type: 'CAST_SPELL', unitId: caster.id, spellId, ...extra }, TOUHOU_CATALOG);
    };

    // === 1. 双轨法术威力：非英雄施法按人头 count 线性缩放（10 本禁忌之书伤害 = 1 本的精确 10 倍） ===
    enemyKedama.baseStats.magicResistance = 0;
    enemyKedama.baseStats.grazeChance = 0;
    enemyKedama.baseStats.maxHp = 500;
    enemyKedama.currentHp = 500;
    // 确保禁忌之书到敌方毛玉视线完全通畅
    allyTome.pos = { ...enemyKedama.pos, q: enemyKedama.pos.q - 1 };

    allyTome.count = 1;
    const book1Res = castAs(allyTome, 'chaos_magic_arrow', { targetUnitId: enemyKedama.id });
    expect(book1Res.ok).toBe(true);
    const evBook1 = book1Res.events.find((e) => e.type === 'SPELL_CAST');
    const dmgBook1 = evBook1?.type === 'SPELL_CAST' ? (evBook1.damageMap?.[enemyKedama.id]?.damage ?? 0) : 0;

    allyTome.count = 10;
    const book10Res = castAs(allyTome, 'chaos_magic_arrow', { targetUnitId: enemyKedama.id });
    expect(book10Res.ok).toBe(true);
    const evBook10 = book10Res.events.find((e) => e.type === 'SPELL_CAST');
    const dmgBook10 = evBook10?.type === 'SPELL_CAST' ? (evBook10.damageMap?.[enemyKedama.id]?.damage ?? 0) : 0;

    expect(dmgBook1).toBeGreaterThan(0);
    expect(dmgBook1).toBeLessThan(25); // 1 只 T2 兵种施法威力温和，不会超过英雄
    expect(Math.abs(dmgBook10 - dmgBook1 * 10)).toBeLessThanOrEqual(5); // 线性 10 倍（含整型取整）

    // 英雄轨：同法强下，11 级英雄施放念力重拳（order_magic_fist）威力显著高于 1 级英雄
    reimu.level = 1;
    const lv1Res = castAs(reimu, 'order_magic_fist', { targetUnitId: enemyKedama.id });
    expect(lv1Res.ok).toBe(true);
    const evLv1 = lv1Res.events.find((e) => e.type === 'SPELL_CAST');
    const dmgLv1 = evLv1?.type === 'SPELL_CAST' ? (evLv1.damageMap?.[enemyKedama.id]?.damage ?? 0) : 0;

    reimu.level = 11;
    const lv11Res = castAs(reimu, 'order_magic_fist', { targetUnitId: enemyKedama.id });
    expect(lv11Res.ok).toBe(true);
    const evLv11 = lv11Res.events.find((e) => e.type === 'SPELL_CAST');
    const dmgLv11 = evLv11?.type === 'SPELL_CAST' ? (evLv11.damageMap?.[enemyKedama.id]?.damage ?? 0) : 0;
    expect(dmgLv11).toBeGreaterThan(dmgLv1 * 1.3);

    // === 2. 精准（order_precision）绝不可给纯近战放，且只加远程攻击绝不加近战伤害 ===
    expect(castAs(reimu, 'order_precision', { targetUnitId: allyMelee.id }).ok).toBe(false);

    // 测远近双能单位（allyHybrid）在施加精准前后的近战 vs 远程伤害（距敌 2 格且双方均对灵梦无遮挡）
    allyHybrid.roundMoraleState = 'neutral';
    allyHybrid.pos = offsetToAxial(3, 10);
    enemyArcher.pos = offsetToAxial(2, 12);
    const preRanged = previewAttack(state, allyHybrid.id, enemyArcher.id, TOUHOU_CATALOG, undefined, false);
    const preMelee = previewAttack(state, allyHybrid.id, enemyArcher.id, TOUHOU_CATALOG, undefined, true);
    expect(preRanged.valid && preRanged.isRanged).toBe(true);
    expect(preMelee.valid && !preMelee.isRanged).toBe(true);

    expect(castAs(reimu, 'order_precision', { targetUnitId: allyHybrid.id }).ok).toBe(true);
    const postRanged = previewAttack(state, allyHybrid.id, enemyArcher.id, TOUHOU_CATALOG, undefined, false);
    const postMelee = previewAttack(state, allyHybrid.id, enemyArcher.id, TOUHOU_CATALOG, undefined, true);
    expect(postRanged.notes).toContain('天眼狙定(+25%远攻)');
    expect(postRanged.expectedMaxDamage).toBeGreaterThan(preRanged.expectedMaxDamage);
    // 近战绝不被精准加成！
    expect(postMelee.notes).not.toContain('天眼狙定(+25%远攻)');
    expect(postMelee.expectedMaxDamage).toBe(preMelee.expectedMaxDamage);

    // === 3. 嗜血（chaos_bloodlust）绝不可给近战禁手放，且只加近战伤害绝不加远程射击 ===
    expect(castAs(reimu, 'chaos_bloodlust', { targetUnitId: allyTome.id }).ok).toBe(false);
    expect(castAs(reimu, 'chaos_bloodlust', { targetUnitId: allyHybrid.id }).ok).toBe(true);
    const bloodRanged = previewAttack(state, allyHybrid.id, enemyArcher.id, TOUHOU_CATALOG, undefined, false);
    const bloodMelee = previewAttack(state, allyHybrid.id, enemyArcher.id, TOUHOU_CATALOG, undefined, true);
    expect(bloodMelee.notes).toContain('鬼神狂战(+25%近战)');
    expect(bloodMelee.expectedMaxDamage).toBeGreaterThan(postMelee.expectedMaxDamage);
    expect(bloodRanged.notes).not.toContain('鬼神狂战(+25%近战)');
    expect(bloodRanged.expectedMaxDamage).toBe(postRanged.expectedMaxDamage);

    // === 4. 忘却弹幕（order_forgetfulness）拦截纯近战，允许远程，且封印后再放会拦截 ===
    expect(castAs(reimu, 'order_forgetfulness', { targetUnitId: enemyMelee.id }).ok).toBe(false);
    expect(castAs(reimu, 'order_forgetfulness', { targetUnitId: enemyArcher.id }).ok).toBe(true);
    expect(enemyArcher.abilities.noRanged).toBe(true);
    expect(castAs(reimu, 'order_forgetfulness', { targetUnitId: enemyArcher.id }).ok).toBe(false);

    // === 5. 近战附魔拦截近战禁手、吸血拦截机械但允许不死 ===
    expect(castAs(reimu, 'chaos_fire_aura', { targetUnitId: allyTome.id }).ok).toBe(false);
    expect(castAs(reimu, 'chaos_first_strike', { targetUnitId: allyTome.id }).ok).toBe(false);
    expect(castAs(reimu, 'death_vampiric_touch', { targetUnitId: allyTome.id }).ok).toBe(false);
    expect(castAs(reimu, 'death_vampiric_touch', { targetUnitId: allyMech.id }).ok).toBe(false);
    expect(castAs(reimu, 'death_vampiric_touch', { targetUnitId: allyUndead.id }).ok).toBe(true);

    // === 6. 施法反制诅咒拦截非施法兵种，允许施法英雄 ===
    expect(castAs(reimu, 'order_power_drain', { targetUnitId: enemyKedama.id }).ok).toBe(false);
    expect(castAs(reimu, 'death_magic_leech', { targetUnitId: enemyKedama.id }).ok).toBe(false);
    expect(castAs(reimu, 'chaos_spell_shackle', { targetUnitId: enemyKedama.id }).ok).toBe(false);
    marisa.pos = { ...reimu.pos, q: reimu.pos.q + 1 };
    expect(castAs(reimu, 'order_power_drain', { targetUnitId: marisa.id }).ok).toBe(true);

    // === 7. 士气法术拦截机械/不死，御神护命拦截非活体，御空/履平拦截天生飞行 ===
    expect(castAs(reimu, 'life_mirth', { targetUnitId: allyMech.id }).ok).toBe(false);
    expect(castAs(reimu, 'life_mirth', { targetUnitId: allyUndead.id }).ok).toBe(false);
    expect(castAs(reimu, 'life_guardian_angel', { targetUnitId: allyMech.id }).ok).toBe(false);
    expect(castAs(reimu, 'life_guardian_angel', { targetUnitId: allyUndead.id }).ok).toBe(false);
    expect(castAs(reimu, 'order_flight', { targetUnitId: allyUndead.id }).ok).toBe(false);
    expect(castAs(reimu, 'nature_terrain_walk', { targetUnitId: allyUndead.id }).ok).toBe(false);

    // === 8. 浓雾迷心（chaos_cloud_of_confusion）严格尊重心智免疫（机械与不死均不被迷惑） ===
    const mechTile = offsetToAxial(4, 11);
    const undeadTile = offsetToAxial(4, 9);
    enemyMech.pos = mechTile;
    enemyUndead.pos = undeadTile;
    const cloudRes = castAs(reimu, 'chaos_cloud_of_confusion', { targetHex: mechTile });
    expect(cloudRes.ok).toBe(true);
    expect(enemyMech.statusEffects.confusionRounds ?? 0).toBe(0);
    const cloudUndeadRes = castAs(reimu, 'chaos_cloud_of_confusion', { targetHex: undeadTile });
    expect(cloudUndeadRes.ok).toBe(true);
    expect(enemyUndead.statusEffects.confusionRounds ?? 0).toBe(0);

    // === 9. 冥府勾魂（death_hand_of_death）对兵种同样尊重魔抗与抗死结界 ===
    enemyMelee.pos = offsetToAxial(5, 9);
    enemyMelee.count = 30;
    enemyMelee.baseStats.maxHp = 50;
    enemyMelee.currentHp = 50;
    enemyMelee.abilities.deathWard = false;
    enemyMelee.baseStats.magicResistance = 0;
    const hodUnprotected = castAs(reimu, 'death_hand_of_death', { targetUnitId: enemyMelee.id });
    expect(hodUnprotected.ok, hodUnprotected.error).toBe(true);
    const killsRaw =
      hodUnprotected.events.find((e) => e.type === 'SPELL_CAST')?.type === 'SPELL_CAST'
        ? (hodUnprotected.events.find((e) => e.type === 'SPELL_CAST') as { damageMap?: Record<string, { kills: number }> })
            .damageMap?.[enemyMelee.id]?.kills ?? 0
        : 0;

    enemyMelee.count = 30;
    enemyMelee.currentHp = 50;
    enemyMelee.abilities.deathWard = true;
    enemyMelee.baseStats.magicResistance = 0.5;
    const hodProtected = castAs(reimu, 'death_hand_of_death', { targetUnitId: enemyMelee.id });
    expect(hodProtected.ok).toBe(true);
    const killsProtected =
      hodProtected.events.find((e) => e.type === 'SPELL_CAST')?.type === 'SPELL_CAST'
        ? (hodProtected.events.find((e) => e.type === 'SPELL_CAST') as { damageMap?: Record<string, { kills: number }> })
            .damageMap?.[enemyMelee.id]?.kills ?? 0
        : 0;

    expect(killsRaw).toBeGreaterThan(killsProtected);
  });

  it('全部 41 项单位特技与生物类型、实时状态、技能树、职业与英雄装备秘药文案均遵循三段式零冗余括号新规范', () => {
    const { state } = createReimuVsMarisaBattle({ mode: 'vs_ai', lineupVariant: 'A', seed: 7600 });
    const sample = Object.values(state.units).find((u) => u.kind === 'creature')!;
    const hero = Object.values(state.units).find((u) => u.kind === 'hero')!;
    // 开启全部 40 项能力标记 + 幻象标记（共 41 项特技与特殊生物类型），一次性全量扫描校验
    sample.isIllusion = true;
    sample.abilities = {
      flying: true,
      teleport: true,
      firstStrike: true,
      rangedFirstStrike: true,
      noRetaliation: true,
      unlimitedRetaliation: true,
      ranged: true,
      noMelee: true,
      noRanged: true,
      noMeleePenalty: true,
      siegeBreaker: true,
      magicImmune: true,
      darkNature: true,
      doubleStrike: true,
      longWeapon: true,
      negateFirstStrike: true,
      longRange: true,
      shortRange: true,
      noObstaclePenalty: true,
      unlimitedShots: true,
      charge: true,
      deathWard: true,
      block: true,
      stunOnHit: true,
      terrorOnHit: true,
      stoneGaze: true,
      fireShield: true,
      fireResistant: true,
      chaosResistant: true,
      lightningResistant: true,
      giantSlayer: true,
      orderPurgeRanged: true,
      multipleAttack: true,
      breathAttack: true,
      mechanical: true,
      undead: true,
      elemental: true,
      stealth: true,
      spellcaster: true,
      resurrection: true,
    };

    const specs = buildUnitSpecialtyBadges(sample);
    expect(specs.length).toBe(41);
    const forbiddenRe = /[()（）]|HoMM4|LoS|\bH4\b/;
    for (const badge of specs) {
      expect(badge.tooltip.badges?.length, `特技 ${badge.id} 缺少类别/生物类型彩色胶囊`).toBeGreaterThan(0);
      expect(badge.tooltip.summary?.trim().length, `特技 ${badge.id} 缺少简介段`).toBeGreaterThanOrEqual(6);
      expect(badge.tooltip.lines.length, `特技 ${badge.id} 缺少规则正文`).toBeGreaterThan(0);
      expect(forbiddenRe.test(badge.tooltip.title), `特技 ${badge.id} 标题含旧括号或开发缩写: ${badge.tooltip.title}`).toBe(false);
      expect(forbiddenRe.test(badge.tooltip.summary ?? ''), `特技 ${badge.id} 简介含冗余括号: ${badge.tooltip.summary}`).toBe(false);
      expect(forbiddenRe.test(badge.tooltip.lines.join('')), `特技 ${badge.id} 正文含冗余括号或旧缩写: ${badge.tooltip.lines.join('')}`).toBe(false);
    }

    // 状态徽章全量检验：挂上典型正负状态，确保全部携带阵营/极性胶囊且零冗余括号
    sample.statusEffects = {
      stunnedRounds: 1,
      terrifiedRounds: 1,
      blindRounds: 2,
      precisionRounds: 6,
      bloodlustRounds: 6,
      rabbitFormRounds: 3,
      bless: true,
      curse: true,
      blur: true,
      auraOfFear: true,
      vampiricTouch: true,
      fireAura: true,
    };
    const statuses = buildUnitStatusBadges(sample, state);
    expect(statuses.length).toBeGreaterThanOrEqual(10);
    for (const st of statuses) {
      expect(st.tooltip.badges?.length, `状态 ${st.id} 缺少阵营/极性彩色胶囊`).toBeGreaterThan(0);
      expect(forbiddenRe.test(st.tooltip.title), `状态 ${st.id} 标题含冗余括号: ${st.tooltip.title}`).toBe(false);
      expect(forbiddenRe.test(st.tooltip.lines.join('')), `状态 ${st.id} 正文含冗余括号: ${st.tooltip.lines.join('')}`).toBe(false);
    }

    // 英雄固有特质与已佩戴神器槽位应带彩色胶囊
    const heroTraits = buildHeroTraitBadges(hero);
    expect(heroTraits.length).toBeGreaterThan(0);
    for (const tr of heroTraits) {
      expect(tr.tooltip.badges?.length, `特质 ${tr.id} 缺少彩色胶囊`).toBeGreaterThan(0);
    }
    const equippedSlots = buildHeroEquipmentSlots(hero).filter((s) => s.artifact !== null);
    expect(equippedSlots.length).toBeGreaterThan(0);
    for (const slot of equippedSlots) {
      expect(slot.tooltip.badges?.length, `神器 ${slot.artifact?.id} 缺少彩色胶囊`).toBeGreaterThan(0);
      expect(slot.tooltip.summary?.trim().length).toBeGreaterThan(0);
    }

    // 9 主技能、27 二级专精、11 基础职业、37 进阶职业与腰带秘药均不得残留 HoMM4/H4 或冗余括号
    for (const m of Object.values(PRIMARY_SKILL_META)) {
      expect(forbiddenRe.test(m.desc), `主技能摘要含旧词或括号: ${m.desc}`).toBe(false);
    }
    for (const tree of Object.values(SKILL_TREE_META)) {
      expect(forbiddenRe.test(tree.desc), `主技能树 ${tree.id} 描述含旧词或括号: ${tree.desc}`).toBe(false);
    }
    for (const sub of Object.values(SECONDARY_SKILL_META)) {
      expect(forbiddenRe.test(sub.desc), `二级专精 ${sub.id} 描述含旧词或括号: ${sub.desc}`).toBe(false);
      expect(forbiddenRe.test(sub.combatEffect), `二级专精 ${sub.id} 实战效果含旧词或括号: ${sub.combatEffect}`).toBe(false);
    }
    for (const cls of [...Object.values(H4_BASE_CLASSES), ...Object.values(H4_ADVANCED_CLASSES)]) {
      expect(forbiddenRe.test(cls.description), `职业 ${cls.id} 描述含旧词或括号: ${cls.description}`).toBe(false);
    }
    for (const pot of Object.values(TOUHOU_CATALOG.potions)) {
      expect(forbiddenRe.test(pot.description), `秘药 ${pot.id} 描述含旧词或括号: ${pot.description}`).toBe(false);
    }
  });

  it('魔导书无限弹药显示无数字、御札弓手远程先攻双端生效（且不越界至近战）、博丽毛玉具备无限反击', () => {
    const map = buildShrineNightBattleMap();
    // 清理测试走廊障碍，确保远程互射直线畅通
    for (const t of Object.values(map.tiles)) {
      t.terrain = 'plain';
      t.blocksGround = false;
      t.losObstruction = 'none';
      t.moveCost = 1;
    }
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'ofuda_archer', count: 40, col: 4, row: 10 },
          { kind: 'creature', defId: 'kedama', count: 10, col: 4, row: 12 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'grimoire_familiar', count: 1, col: 9, row: 10 },
          { kind: 'creature', defId: 'broom_caster', count: 2, col: 9, row: 12 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 7800,
      },
      TOUHOU_CATALOG,
    );

    const archer = Object.values(state.units).find((u) => u.defId === 'ofuda_archer')!;
    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const tome = Object.values(state.units).find((u) => u.defId === 'grimoire_familiar')!;
    const broom = Object.values(state.units).find((u) => u.defId === 'broom_caster')!;

    // 1. 博丽毛玉具备无限反击与符箓定身
    expect(kedama.abilities.unlimitedRetaliation).toBe(true);
    expect(kedama.abilities.stunOnHit).toBe(true);

    // 2. 禁忌之书为无限弹药：ammo/maxAmmo 为 0 仍可正常远程射击与预估，且远程徽章副标题显示「无限弹药」而非数字
    expect(tome.abilities.unlimitedShots).toBe(true);
    expect(tome.ammo).toBe(0);
    expect(tome.maxAmmo).toBe(0);
    const tomeRangedBadge = buildUnitSpecialtyBadges(tome).find((b) => b.id === 'ranged');
    expect(tomeRangedBadge?.tooltip.subtitle).toContain('无限弹药');
    expect(tomeRangedBadge?.tooltip.subtitle).not.toMatch(/\d/);
    const tomePreview = previewAttack(state, tome.id, kedama.id, TOUHOU_CATALOG);
    expect(tomePreview.valid).toBe(true);
    expect(tomePreview.isRanged).toBe(true);

    // 3. 御札弓手具备远程先攻：主动远射无远程先攻的敌方禁忌之书时为 attacker_first，一箭秒杀则不受远程反击！
    expect(archer.abilities.rangedFirstStrike).toBe(true);
    const archerShootTome = previewAttack(state, archer.id, tome.id, TOUHOU_CATALOG);
    expect(archerShootTome.valid).toBe(true);
    expect(archerShootTome.isRanged).toBe(true);
    expect(archerShootTome.exchangeMode).toBe('attacker_first');
    state.activeUnitId = archer.id;
    const archerCountBefore = archer.count;
    const archerHpBefore = archer.currentHp;
    const shotRes = dispatchCombatCommand(state, { type: 'ATTACK', unitId: archer.id, targetId: tome.id }, TOUHOU_CATALOG);
    expect(shotRes.ok).toBe(true);
    expect(tome.status).toBe('dead');
    expect(archer.count).toBe(archerCountBefore);
    expect(archer.currentHp).toBe(archerHpBefore);
    const shotEx = shotRes.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(shotEx?.type === 'COMBAT_EXCHANGE' && shotEx.defenderStrike).toBeNull();

    // 4. 敌方无远程先攻射手（魔法使）主动远射御札弓手时，触发 defender_first：弓手先手反击秒杀敌方且自身零伤！
    const broomShootArcher = previewAttack(state, broom.id, archer.id, TOUHOU_CATALOG);
    expect(broomShootArcher.valid).toBe(true);
    expect(broomShootArcher.isRanged).toBe(true);
    expect(broomShootArcher.exchangeMode).toBe('defender_first');
    state.activeUnitId = broom.id;
    const broomShotRes = dispatchCombatCommand(state, { type: 'ATTACK', unitId: broom.id, targetId: archer.id }, TOUHOU_CATALOG);
    expect(broomShotRes.ok).toBe(true);
    expect(broom.status).toBe('dead');
    expect(archer.count).toBe(archerCountBefore);
    expect(archer.currentHp).toBe(archerHpBefore);

    // 5. 远程先攻绝不越界为近战先攻：御札弓手切近战砍敌方近战时，必须保持 simultaneous 同时反击
    broom.status = 'alive';
    broom.count = 10;
    broom.currentHp = broom.baseStats.maxHp;
    broom.pos = offsetToAxial(5, 10);
    const meleePrev = previewAttack(state, archer.id, broom.id, TOUHOU_CATALOG, undefined, true);
    expect(meleePrev.valid).toBe(true);
    expect(meleePrev.isRanged).toBe(false);
    expect(meleePrev.exchangeMode).toBe('simultaneous');
  });

  it('HoMM4 每回合单次反击规则：普通单位近战与远程共用 1 次反击、无限反击特技不限次数、跨回合自动刷新', () => {
    const map = buildShrineNightBattleMap();
    for (const t of Object.values(map.tiles)) {
      t.terrain = 'plain';
      t.blocksGround = false;
      t.losObstruction = 'none';
      t.moveCost = 1;
    }
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

  it('禁忌之书暗系特质生效；魔法使具备施法与 4 MP 上限，魔导星矢无抗性伤害严格等于满额远程最高值', () => {
    const map = buildShrineNightBattleMap();
    for (const t of Object.values(map.tiles)) {
      t.terrain = 'plain';
      t.blocksGround = false;
      t.losObstruction = 'none';
      t.moveCost = 1;
    }
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'broom_caster', count: 10, col: 4, row: 10 },
          { kind: 'creature', defId: 'grimoire_familiar', count: 4, col: 4, row: 12 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'kedama', count: 50, col: 11, row: 10 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 8001,
      },
      TOUHOU_CATALOG,
    );

    const broom = Object.values(state.units).find((u) => u.defId === 'broom_caster')!;
    const tome = Object.values(state.units).find((u) => u.defId === 'grimoire_familiar')!;
    const target = Object.values(state.units).find((u) => u.defId === 'kedama')!;

    // 1. 禁忌之书具备暗系特质，头标携带暗系图标，且吃暗系魔法易伤判定
    expect(tome.abilities.darkNature).toBe(true);
    expect(isDarkMagicVulnerable(tome)).toBe(true);
    expect(getUnitHeaderCreatureTags(tome).some((t) => t.id === 'darkNature')).toBe(true);

    // 2. 魔法使具备施法特技、4 MP 上限与魔导星矢
    expect(broom.abilities.spellcaster).toBe(true);
    expect(broom.mana).toBe(4);
    expect(broom.baseStats.maxMana).toBe(4);
    expect(broom.knownSpellIds).toContain('chaos_magic_arrow');

    // 3. 对 0 魔抗、0 擦弹活体目标施放魔导星矢，10 人应精确造成 5×10=50 点伤害，耗 2 MP 剩 2 MP
    target.baseStats.magicResistance = 0;
    target.baseStats.grazeChance = 0;
    target.baseStats.maxHp = 500;
    target.currentHp = 500;
    state.activeUnitId = broom.id;
    const cast1 = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: broom.id, spellId: 'chaos_magic_arrow', targetUnitId: target.id },
      TOUHOU_CATALOG,
    );
    expect(cast1.ok, cast1.error).toBe(true);
    expect(broom.mana).toBe(2);
    const ev1 = cast1.events.find((e) => e.type === 'SPELL_CAST');
    const dmg1 = ev1?.type === 'SPELL_CAST' ? (ev1.damageMap?.[target.id]?.damage ?? 0) : 0;
    expect(dmg1).toBe(broom.baseStats.maxDamage * 10);

    // 4. 23 名魔法使再放第二发，精确造成 5×23=115 点伤害且 MP 归零
    broom.count = 23;
    broom.hasActedThisRound = false;
    state.activeUnitId = broom.id;
    const cast2 = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: broom.id, spellId: 'chaos_magic_arrow', targetUnitId: target.id },
      TOUHOU_CATALOG,
    );
    expect(cast2.ok, cast2.error).toBe(true);
    expect(broom.mana).toBe(0);
    const ev2 = cast2.events.find((e) => e.type === 'SPELL_CAST');
    const dmg2 = ev2?.type === 'SPELL_CAST' ? (ev2.damageMap?.[target.id]?.damage ?? 0) : 0;
    expect(dmg2).toBe(broom.baseStats.maxDamage * 23);
  });

  it('腰带秘药不消耗行动权但每名英雄每回合严格限用 1 次（英雄间独立，等待不刷新，跨回合重置且 AI 不重饮）', () => {
    const { state } = createReimuVsMarisaBattle({ mode: 'hotseat', seed: 8100 });
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;

    // 1. 灵梦第 1 回合饮用 1 瓶治疗秘药：成功、不耗行动权、标记本回合已使用
    reimu.currentHp = 80;
    state.activeUnitId = reimu.id;
    const pot1 = dispatchCombatCommand(
      state,
      { type: 'USE_POTION', unitId: reimu.id, potionId: 'healing_elixir' },
      TOUHOU_CATALOG,
    );
    expect(pot1.ok).toBe(true);
    expect(state.activeUnitId).toBe(reimu.id);
    expect(reimu.hasUsedPotionThisRound).toBe(true);

    // 2. 灵梦同一回合再试图喝第 2 瓶（无论是同种或异种）：必须被拒绝且不扣瓶数
    const spiritBefore = reimu.potions.find((p) => p.potionId === 'spirit_draught')!.charges;
    const pot2Same = dispatchCombatCommand(
      state,
      { type: 'USE_POTION', unitId: reimu.id, potionId: 'healing_elixir' },
      TOUHOU_CATALOG,
    );
    expect(pot2Same.ok).toBe(false);
    const pot2Other = dispatchCombatCommand(
      state,
      { type: 'USE_POTION', unitId: reimu.id, potionId: 'spirit_draught' },
      TOUHOU_CATALOG,
    );
    expect(pot2Other.ok).toBe(false);
    expect(reimu.potions.find((p) => p.potionId === 'spirit_draught')!.charges).toBe(spiritBefore);

    // 3. AI 判定：残血灵梦本回合已喝过药时，战术 AI 绝不再返回 USE_POTION
    reimu.currentHp = 30;
    const aiCmd = chooseTacticalAiCommand(state, TOUHOU_CATALOG);
    expect(aiCmd?.type).not.toBe('USE_POTION');

    // 4. 等待后同一回合再次轮到灵梦，依然不能喝第 2 瓶；但另一名英雄魔理沙保有本回合独立的 1 次喝药配额
    const waitRes = dispatchCombatCommand(state, { type: 'WAIT', unitId: reimu.id }, TOUHOU_CATALOG);
    expect(waitRes.ok).toBe(true);
    state.activeUnitId = reimu.id;
    expect(
      dispatchCombatCommand(
        state,
        { type: 'USE_POTION', unitId: reimu.id, potionId: 'spirit_draught' },
        TOUHOU_CATALOG,
      ).ok,
    ).toBe(false);

    state.activeUnitId = marisa.id;
    const marisaPot1 = dispatchCombatCommand(
      state,
      { type: 'USE_POTION', unitId: marisa.id, potionId: 'iron_barrier_oil' },
      TOUHOU_CATALOG,
    );
    expect(marisaPot1.ok).toBe(true);
    expect(marisa.hasUsedPotionThisRound).toBe(true);
    expect(
      dispatchCombatCommand(
        state,
        { type: 'USE_POTION', unitId: marisa.id, potionId: 'spirit_draught' },
        TOUHOU_CATALOG,
      ).ok,
    ).toBe(false);

    // 5. 推进至第 2 回合后，所有英雄的秘药配额自动刷新，灵梦与魔理沙均可再次饮用 1 次
    const roundBefore = state.round;
    for (const u of Object.values(state.units)) {
      u.hasActedThisRound = true;
    }
    state.turnQueue = [];
    state.waitQueue = [];
    marisa.hasActedThisRound = false;
    state.activeUnitId = marisa.id;
    expect(dispatchCombatCommand(state, { type: 'DEFEND', unitId: marisa.id }, TOUHOU_CATALOG).ok).toBe(true);
    expect(state.round).toBe(roundBefore + 1);
    expect(reimu.hasUsedPotionThisRound).toBe(false);
    expect(marisa.hasUsedPotionThisRound).toBe(false);

    state.activeUnitId = reimu.id;
    const nextRoundPot = dispatchCombatCommand(
      state,
      { type: 'USE_POTION', unitId: reimu.id, potionId: 'spirit_draught' },
      TOUHOU_CATALOG,
    );
    expect(nextRoundPot.ok).toBe(true);
    expect(reimu.hasUsedPotionThisRound).toBe(true);

    // 顺带验证抗死结界（deathWard）对非法术攻击仅提供 +25% 有效防御（法术减伤仍维持 50%）
    const blade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade');
    const doll = Object.values(state.units).find((u) => u.defId === 'hourai_doll');
    if (blade && doll) {
      blade.abilities.deathWard = true;
      blade.statusEffects.schoolWards = undefined;
      blade.pos = offsetToAxial(7, 10);
      doll.pos = offsetToAxial(8, 10);
      const dwPrev = previewAttack(state, doll.id, blade.id, TOUHOU_CATALOG);
      expect(dwPrev.valid).toBe(true);
      expect(dwPrev.notes).toContain('敌方抗死结界(防+25%)');

      blade.statusEffects.schoolWards = { chaos: true };
      const swPrev = previewAttack(state, doll.id, blade.id, TOUHOU_CATALOG);
      expect(swPrev.notes).toContain('敌方派系守护(防+50%)');
      expect(swPrev.expectedMaxDamage).toBeLessThan(dwPrev.expectedMaxDamage);
    }

    // 校验全法术射程梯度：单体指向性 15~18 或长手 21，召请类 12
    for (const sp of Object.values(TOUHOU_CATALOG.spells)) {
      if (sp.targetType === 'hex_empty') {
        expect(sp.range, `召唤法术 ${sp.id} 射程应为 12`).toBe(12);
      } else if (sp.range > 0) {
        expect(
          (sp.range >= 15 && sp.range <= 18) || sp.range === 21,
          `法术 ${sp.id} 射程 ${sp.range} 不在 15~18 或长手 21 梯度内`,
        ).toBe(true);
      }
    }
    expect(TOUHOU_CATALOG.spells.chaos_lightning.range).toBe(21);
    expect(TOUHOU_CATALOG.spells.order_teleport.range).toBe(21);
    expect(TOUHOU_CATALOG.spells.death_hand_of_death.range).toBe(21);

    // 校验方案 B 战中回蓝规则：施法兵种 0 自动回蓝；英雄取消保底与宗师回蓝，仅巫术/冥想/魔导妖术师生效
    const broomUnit = Object.values(state.units).find((u) => u.defId === 'broom_caster');
    if (broomUnit) {
      broomUnit.mana = 0;
    }
    reimu.mana = 20;
    marisa.mana = 10;
    marisa.subSkills = { ...marisa.subSkills, wizardry: 0, meditation: 0 };
    marisa.selectedAdvancedClassId = 'fire_diviner';
    const reimuExpectedRegen = (reimu.subSkills?.wizardry ?? 0) + (reimu.subSkills?.meditation ?? 0);
    for (const u of Object.values(state.units)) {
      u.hasActedThisRound = true;
    }
    state.turnQueue = [];
    state.waitQueue = [];
    marisa.hasActedThisRound = false;
    state.activeUnitId = marisa.id;
    expect(dispatchCombatCommand(state, { type: 'DEFEND', unitId: marisa.id }, TOUHOU_CATALOG).ok).toBe(true);
    // 无巫术/冥想/魔导妖术师的英雄跨回合 0 自动回蓝
    expect(marisa.mana).toBe(10);
    // 有巫术(3)+冥想(3)的灵梦跨回合仅回复精确 6 点（无保底+4与宗师+4）
    expect(reimu.mana).toBe(20 + reimuExpectedRegen);
    // 施法兵种跨回合严格 0 自动回蓝
    if (broomUnit) {
      expect(broomUnit.mana).toBe(0);
    }
  });

  it('原版 HoMM4 远程反击前卫替伤：紧邻前卫可越肩开火、敌方远程反击命中弹道首个友军并兼容远程先攻与净域护盾', () => {
    const map = buildShrineNightBattleMap();
    // 清理第 12 行的 (2..9, 12) 为平地，排除无关地形随机因素
    for (let col = 2; col <= 9; col += 1) {
      const tile = map.tiles[hexKey(offsetToAxial(col, 12))];
      if (tile) {
        tile.terrain = 'plain';
        tile.elevation = 1;
        tile.losObstruction = 'none';
        tile.blocksGround = false;
      }
    }

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

  it('幻月庭园·秩序阵营 8 兵种 + 八意永琳：2×2 非想天则、1×2 战斗 II 型、净秽裁决(+20%)、混沌/雷电抗性(25%)、巨人杀手与三阵营满编落位收敛', () => {
    // 1. 校验秩序 8 兵种静态契约（按主人规格逐项核对）
    const orderIds = [
      'youkai_rabbit',
      'lunar_slinger',
      'tanuki_illusionist',
      'armored_lunar_guard',
      'lunar_genie',
      'combat_mk2',
      'purity_titan',
      'hisoutensoku',
    ] as const;
    for (const id of orderIds) {
      const def = TOUHOU_CATALOG.creatures[id];
      expect(def, `缺少秩序兵种 ${id}`).toBeDefined();
      expect(def.alignment).toBe('order');
    }
    expect(TOUHOU_CATALOG.creatures.youkai_rabbit.tier).toBe(1);
    expect(TOUHOU_CATALOG.creatures.youkai_rabbit.baseStats.magicResistance).toBe(0.3);
    expect(TOUHOU_CATALOG.creatures.youkai_rabbit.baseStats.maxMana).toBe(99);
    expect(TOUHOU_CATALOG.creatures.youkai_rabbit.abilities.spellcaster).toBe(true);
    expect(TOUHOU_CATALOG.creatures.youkai_rabbit.knownSpellIds).toContain('order_rabbit_transform');
    expect(TOUHOU_CATALOG.creatures.lunar_slinger.abilities.giantSlayer).toBe(true);
    expect(TOUHOU_CATALOG.creatures.tanuki_illusionist.abilities.spellcaster).toBe(true);
    expect(TOUHOU_CATALOG.creatures.armored_lunar_guard.abilities.mechanical).toBeFalsy();
    expect(TOUHOU_CATALOG.creatures.armored_lunar_guard.abilities.negateFirstStrike).toBe(true);
    expect(TOUHOU_CATALOG.creatures.armored_lunar_guard.baseStats.magicResistance).toBe(0.5);
    expect(TOUHOU_CATALOG.creatures.lunar_genie.abilities.flying).toBeFalsy();
    expect(TOUHOU_CATALOG.creatures.lunar_genie.abilities.teleport).toBe(true);
    expect(TOUHOU_CATALOG.creatures.lunar_genie.abilities.spellcaster).toBe(true);
    expect(TOUHOU_CATALOG.creatures.lunar_genie.baseStats.speed).toBe(4);
    expect(TOUHOU_CATALOG.creatures.combat_mk2.footprint).toBe('1x2');
    expect(TOUHOU_CATALOG.creatures.combat_mk2.abilities.mechanical).toBe(true);
    expect(TOUHOU_CATALOG.creatures.combat_mk2.abilities.noRetaliation).toBe(true);
    expect(TOUHOU_CATALOG.creatures.purity_titan.abilities.orderPurgeRanged).toBe(true);
    expect(TOUHOU_CATALOG.creatures.purity_titan.abilities.chaosResistant).toBe(true);
    expect(TOUHOU_CATALOG.creatures.purity_titan.abilities.lightningResistant).toBe(true);
    expect(TOUHOU_CATALOG.creatures.hisoutensoku.footprint).toBe('2x2');
    expect(TOUHOU_CATALOG.creatures.arcane_colossus.footprint).toBe('2x2');
    expect(TOUHOU_CATALOG.creatures.hisoutensoku.abilities.firstStrike).toBe(true);
    expect(TOUHOU_CATALOG.creatures.hisoutensoku.abilities.negateFirstStrike).toBe(true);

    // 2. 校验三阵营（生命 / 秩序 / 混沌）× A/B 阵型在左右战线全部 7 格满编、零重叠且落脚格完全合法
    const seenOrderDefs = new Set<string>();
    for (const faction of ['life', 'order', 'chaos'] as const) {
      for (const variant of ['A', 'B'] as const) {
        const opponent = faction === 'chaos' ? 'order' : 'chaos';
        const { state } = createReimuVsMarisaBattle({
          mode: 'vs_ai',
          leftFaction: faction,
          rightFaction: opponent,
          lineupVariant: variant,
          seed: 9010,
        });
        const leftUnits = Object.values(state.units).filter((u) => u.side === 'left');
        const rightUnits = Object.values(state.units).filter((u) => u.side === 'right');
        expect(leftUnits).toHaveLength(7);
        expect(rightUnits).toHaveLength(7);
        const occupiedAll = new Set<string>();
        for (const u of Object.values(state.units)) {
          if (u.alignment === 'order' && u.kind === 'creature') seenOrderDefs.add(u.defId);
          for (const cell of getUnitOccupiedHexes(u)) {
            const k = hexKey(cell);
            expect(occupiedAll.has(k), `阵营 ${faction}/${variant} 存在单位格重叠 ${k}`).toBe(false);
            occupiedAll.add(k);
            const t = state.tiles[k];
            expect(t, `阵营 ${faction}/${variant} 单位 ${u.defId} 落于界外 ${k}`).toBeDefined();
            if (!u.abilities.flying) {
              expect(t.blocksGround, `阵营 ${faction}/${variant} 陆地单位 ${u.defId} 落在障碍格 ${k}`).toBe(false);
            }
          }
        }
      }
    }
    expect(seenOrderDefs.size).toBe(8);

    // 3. 精准验证核心新特技实战结算：净秽裁决(+20% 非秩序远程)、巨人杀手(+50% 对 T4)、混沌抗性(25%) 与雷电抗性(25%)
    const map = buildShrineNightBattleMap();
    for (let col = 2; col <= 11; col += 1) {
      const tile = map.tiles[hexKey(offsetToAxial(col, 12))];
      if (tile) {
        tile.terrain = 'plain';
        tile.elevation = 1;
        tile.losObstruction = 'none';
        tile.blocksGround = false;
      }
    }
    const { state: sTest } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_eirin', col: 2, row: 10 },
          { kind: 'creature', defId: 'purity_titan', count: 3, col: 2, row: 12 },
          { kind: 'creature', defId: 'lunar_slinger', count: 20, col: 4, row: 14 },
          { kind: 'creature', defId: 'armored_lunar_guard', count: 10, col: 5, row: 10 },
        ],
        rightSlots: [
          { kind: 'hero', defId: 'hero_marisa', col: 10, row: 10 },
          { kind: 'creature', defId: 'arcane_colossus', count: 2, col: 9, row: 12 },
          { kind: 'creature', defId: 'hisoutensoku', count: 2, col: 9, row: 15 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 2026,
      },
      TOUHOU_CATALOG,
    );

    const eirin = Object.values(sTest.units).find((u) => u.defId === 'hero_eirin')!;
    const marisa = Object.values(sTest.units).find((u) => u.defId === 'hero_marisa')!;
    const titan = Object.values(sTest.units).find((u) => u.defId === 'purity_titan')!;
    const slinger = Object.values(sTest.units).find((u) => u.defId === 'lunar_slinger')!;
    const lunarGuard = Object.values(sTest.units).find((u) => u.defId === 'armored_lunar_guard')!;
    const chaosColossus = Object.values(sTest.units).find((u) => u.defId === 'arcane_colossus')!;
    const orderSoku = Object.values(sTest.units).find((u) => u.defId === 'hisoutensoku')!;

    // 3a. 净秽裁决：净秽者远程射击混沌魔导巨像（非秩序）触发 +20%，射击同防御的秩序非想天则（秩序）不触发！
    orderSoku.baseStats.defense = chaosColossus.baseStats.defense;
    const prevVsChaos = previewAttack(sTest, titan.id, chaosColossus.id, TOUHOU_CATALOG);
    const prevVsOrder = previewAttack(sTest, titan.id, orderSoku.id, TOUHOU_CATALOG);
    expect(prevVsChaos.valid).toBe(true);
    expect(prevVsOrder.valid).toBe(true);
    expect(prevVsChaos.notes).toContain('净秽裁决(+20%)');
    expect(prevVsOrder.notes).not.toContain('净秽裁决(+20%)');
    expect(prevVsChaos.expectedMaxDamage).toBeGreaterThan(prevVsOrder.expectedMaxDamage);

    // 3b. 玉兔掷弹兵「巨人杀手」：攻击 4 阶巨兽触发 +50%
    const slingerVsT4 = previewAttack(sTest, slinger.id, chaosColossus.id, TOUHOU_CATALOG);
    expect(slingerVsT4.valid).toBe(true);
    expect(slingerVsT4.notes).toContain('巨人杀手(+50%)');

    // 3c. 净秽者「混沌抗性 25%」与「雷电抗性 25%」：控制魔理沙 P 点一致，直接对比 SPELL_CAST 事件中绯想落雷的精确魔伤
    marisa.knownSpellIds = ['chaos_lightning', 'chaos_magic_arrow'];
    marisa.mana = 50;
    const marisaPBefore = marisa.powerPoints;
    titan.count = 10;
    titan.currentHp = titan.baseStats.maxHp;
    titan.baseStats.grazeChance = 0;
    titan.baseStats.magicResistance = 0;
    sTest.activeUnitId = marisa.id;
    const boltWithRes = dispatchCombatCommand(
      sTest,
      { type: 'CAST_SPELL', unitId: marisa.id, spellId: 'chaos_lightning', targetUnitId: titan.id },
      TOUHOU_CATALOG,
    );
    expect(boltWithRes.ok).toBe(true);
    const evWithRes = boltWithRes.events.find((e) => e.type === 'SPELL_CAST');
    const dmgWithBothRes =
      evWithRes && evWithRes.type === 'SPELL_CAST' ? (evWithRes.damageMap?.[titan.id]?.damage ?? 0) : 0;

    // 还原魔理沙 P 点并关闭两项抗性再测一次同法术，验证精确的 0.75 * 0.75 减伤比例
    titan.count = 10;
    titan.currentHp = titan.baseStats.maxHp;
    titan.abilities.chaosResistant = false;
    titan.abilities.lightningResistant = false;
    marisa.powerPoints = marisaPBefore;
    sTest.activeUnitId = marisa.id;
    const boltNoRes = dispatchCombatCommand(
      sTest,
      { type: 'CAST_SPELL', unitId: marisa.id, spellId: 'chaos_lightning', targetUnitId: titan.id },
      TOUHOU_CATALOG,
    );
    expect(boltNoRes.ok).toBe(true);
    const evNoRes = boltNoRes.events.find((e) => e.type === 'SPELL_CAST');
    const dmgNoRes =
      evNoRes && evNoRes.type === 'SPELL_CAST' ? (evNoRes.damageMap?.[titan.id]?.damage ?? 0) : 0;
    expect(dmgWithBothRes).toBeGreaterThan(0);
    expect(dmgWithBothRes).toBeLessThan(dmgNoRes);
    expect(Math.abs(dmgWithBothRes - Math.round(dmgNoRes * 0.75 * 0.75))).toBeLessThanOrEqual(2);

    // 3d. 重装月兔近卫为非机械活体：受伤后可正常接受生命治愈！
    lunarGuard.currentHp = 10;
    sTest.activeUnitId = eirin.id;
    const healGuard = dispatchCombatCommand(
      sTest,
      { type: 'CAST_SPELL', unitId: eirin.id, spellId: 'life_heal', targetUnitId: lunarGuard.id },
      TOUHOU_CATALOG,
    );
    expect(healGuard.ok).toBe(true);
    expect(lunarGuard.currentHp).toBeGreaterThan(10);

    // 3e. 八意永琳专属符卡《秘术「天文密葬法」》展开伪月星阵领域并触发星律回蓝
    eirin.spellCardCharge = 100;
    eirin.mana = 40;
    sTest.activeUnitId = eirin.id;
    const eirinCard = dispatchCombatCommand(
      sTest,
      { type: 'DECLARE_SPELL_CARD', unitId: eirin.id },
      TOUHOU_CATALOG,
    );
    expect(eirinCard.ok).toBe(true);
    expect(sTest.activeFieldAura?.spellCardId).toBe('eirin_astronomical_entombing');
    expect(sTest.activeFieldAura?.pattern).toBe('lunar_astrolabe');

    // 4. 秩序 vs 混沌（A 阵 + B 阵）AI 完整对局推演确定性收敛
    for (const variant of ['A', 'B'] as const) {
      const { state: aiBattle } = createReimuVsMarisaBattle({
        mode: 'vs_ai',
        leftFaction: 'order',
        rightFaction: 'chaos',
        lineupVariant: variant,
        seed: variant === 'A' ? 8811 : 8822,
      });
      aiBattle.controllers.left = 'ai';
      let steps = 0;
      while (aiBattle.phase === 'active' && steps < 260) {
        const cmd = chooseTacticalAiCommand(aiBattle, TOUHOU_CATALOG);
        if (!cmd) break;
        const r = dispatchCombatCommand(aiBattle, cmd, TOUHOU_CATALOG);
        expect(r.ok).toBe(true);
        steps += 1;
      }
      expect(aiBattle.phase).toBe('finished');
      expect(aiBattle.winner).toBeTruthy();
    }
  });

  it('幻月妖有限距离瞬移、重装月兔近卫反先攻(50%魔抗) 与竹林妖怪兔「兔化」99MP 变身全流程校验', () => {
    const map = buildShrineNightBattleMap();
    // 构造隔离岩石墙，验证幻月妖可穿墙瞬移（受移动力 4 格约束），且不可落入岩柱/水域
    for (let col = 4; col <= 12; col += 1) {
      for (let row = 8; row <= 14; row += 1) {
        const k = hexKey(offsetToAxial(col, row));
        const tile = map.tiles[k];
        if (!tile) continue;
        tile.terrain = col === 7 ? 'rock' : 'plain';
        tile.elevation = col === 7 ? 3 : 1;
        tile.blocksGround = col === 7;
        tile.losObstruction = col === 7 ? 'full' : 'none';
        tile.moveCost = 1;
      }
    }
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'lunar_genie', count: 4, col: 6, row: 10 },
          { kind: 'creature', defId: 'youkai_rabbit', count: 20, col: 5, row: 12 },
          { kind: 'creature', defId: 'armored_lunar_guard', count: 8, col: 8, row: 12 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'hisoutensoku', count: 2, col: 9, row: 12 },
          { kind: 'hero', defId: 'hero_eirin', col: 11, row: 10 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 202611,
      },
      TOUHOU_CATALOG,
    );

    const genie = Object.values(state.units).find((u) => u.defId === 'lunar_genie')!;
    const rabbit = Object.values(state.units).find((u) => u.defId === 'youkai_rabbit')!;
    const guard = Object.values(state.units).find((u) => u.defId === 'armored_lunar_guard')!;
    const soku = Object.values(state.units).find((u) => u.defId === 'hisoutensoku')!;
    const enemyEirin = Object.values(state.units).find((u) => u.defId === 'hero_eirin')!;

    // 1. 幻月妖有限距离瞬移：能直接越过整列 col=7 岩石墙抵达 col=8(距离 2 <= 4)，但无法抵达 col=12(距离 6 > 4)，也不能落在 col=7 岩石内！
    const genieReach = getUnitReachableMap(state, genie, TOUHOU_CATALOG);
    const beyondRockNear = offsetToAxial(8, 10); // 距离 2，隔着 col=7 岩石墙
    const rockTile = offsetToAxial(7, 10);
    const tooFarTile = offsetToAxial(12, 10); // 距离 6 > 4
    expect(genieReach.costs.has(hexKey(beyondRockNear))).toBe(true);
    expect(genieReach.costs.has(hexKey(rockTile))).toBe(false);
    expect(genieReach.costs.has(hexKey(tooFarTile))).toBe(false);

    state.activeUnitId = genie.id;
    const tpMove = dispatchCombatCommand(state, { type: 'MOVE', unitId: genie.id, to: beyondRockNear }, TOUHOU_CATALOG);
    expect(tpMove.ok, tpMove.error).toBe(true);
    expect(hexKey(genie.pos)).toBe(hexKey(beyondRockNear));

    // 2. 重装月兔近卫：50% 魔抗 + 反先攻，面对先攻非想天则强制拉回同时交锋！
    expect(computeUnitStats(guard, state, TOUHOU_CATALOG).magicResistance).toBeCloseTo(0.5, 4);
    const guardVsSoku = previewAttack(state, guard.id, soku.id, TOUHOU_CATALOG);
    expect(guardVsSoku.valid).toBe(true);
    expect(guardVsSoku.exchangeMode).toBe('simultaneous');

    // 3. 竹林妖怪兔：30% 魔抗 + 99 MP + 「兔化」仅能对自己施放 + 消耗 99 MP + 三项 +50% + 模型变形 + 3 回合后自动还原！
    const baseStats = computeUnitStats(rabbit, state, TOUHOU_CATALOG);
    expect(baseStats.magicResistance).toBeCloseTo(0.3, 4);
    expect(baseStats.maxMana).toBe(99);
    expect(rabbit.mana).toBe(99);
    expect(rabbit.voxelBlueprintId).toBe('creature_rabbit');

    // 3a. 严禁对他人施放「兔化」
    state.activeUnitId = rabbit.id;
    const badCast = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: rabbit.id, spellId: 'order_rabbit_transform', targetUnitId: guard.id },
      TOUHOU_CATALOG,
    );
    expect(badCast.ok).toBe(false);

    // 3b. 对自己施放「兔化」成功：耗尽 99 MP、模型切换为妖兔真身、位移/先手/擦弹全部 +50%
    const castRound = state.round;
    const okCast = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: rabbit.id, spellId: 'order_rabbit_transform' },
      TOUHOU_CATALOG,
    );
    expect(okCast.ok, okCast.error).toBe(true);
    expect(rabbit.mana).toBe(0);
    expect(rabbit.voxelBlueprintId).toBe('creature_rabbit_transformed');
    expect(rabbit.statusEffects.rabbitFormRounds).toBe(3);
    expect(rabbit.abilities.firstStrike).toBe(true);

    // 兔化期间对普通无破先攻敌军（如八意永琳）近战交锋应触发先攻（attacker_first）！
    enemyEirin.pos = offsetToAxial(6, 12);
    const rabbitPrev = previewAttack(state, rabbit.id, enemyEirin.id, TOUHOU_CATALOG, undefined, true);
    expect(rabbitPrev.valid).toBe(true);
    expect(rabbitPrev.exchangeMode).toBe('attacker_first');
    enemyEirin.pos = offsetToAxial(11, 10);

    const boosted = computeUnitStats(rabbit, state, TOUHOU_CATALOG);
    expect(boosted.speed).toBe(Math.round(baseStats.speed * 1.5)); // 6 -> 9
    expect(boosted.initiative).toBe(Math.round(baseStats.initiative * 1.5)); // 10 -> 15
    expect(boosted.grazeChance).toBeCloseTo(baseStats.grazeChance + 0.5, 3); // 0.05 -> 0.55

    // 3c. 无回蓝无法二次施放；持续 2 个完整后续回合（连同施法回合共 3 回合），第 4 回合开始自动到期还原原模型！
    const advanceToRound = (targetRound: number) => {
      let guardLoop = 0;
      while (state.round < targetRound && state.phase === 'active' && guardLoop < 60) {
        const cur = state.activeUnitId;
        if (!cur) break;
        const r = dispatchCombatCommand(state, { type: 'DEFEND', unitId: cur }, TOUHOU_CATALOG);
        expect(r.ok).toBe(true);
        guardLoop += 1;
      }
    };

    // 进入施法后第 1 回合（castRound + 1）：剩余 2 回合，仍为真身且三项 +50% 有效，且因 0 MP 不能再次施放
    advanceToRound(castRound + 1);
    expect(rabbit.statusEffects.rabbitFormRounds).toBe(2);
    expect(rabbit.voxelBlueprintId).toBe('creature_rabbit_transformed');
    expect(computeUnitStats(rabbit, state, TOUHOU_CATALOG).speed).toBe(boosted.speed);
    state.activeUnitId = rabbit.id;
    expect(
      dispatchCombatCommand(state, { type: 'CAST_SPELL', unitId: rabbit.id, spellId: 'order_rabbit_transform' }, TOUHOU_CATALOG).ok,
    ).toBe(false);

    // 进入施法后第 2 回合（castRound + 2）：剩余 1 回合，仍保持变形与全部加成
    advanceToRound(castRound + 2);
    expect(rabbit.statusEffects.rabbitFormRounds).toBe(1);
    expect(rabbit.voxelBlueprintId).toBe('creature_rabbit_transformed');
    expect(computeUnitStats(rabbit, state, TOUHOU_CATALOG).initiative).toBe(boosted.initiative);

    // 进入施法后第 3 回合（castRound + 3）：3 回合（施法回合 + 2 后续回合）期满，自动还原原模型、回收先攻与基础数值！
    advanceToRound(castRound + 3);
    expect(rabbit.statusEffects.rabbitFormRounds).toBe(0);
    expect(rabbit.voxelBlueprintId).toBe('creature_rabbit');
    expect(rabbit.abilities.firstStrike).toBe(false);
    expect(computeUnitStats(rabbit, state, TOUHOU_CATALOG).speed).toBe(baseStats.speed);
    expect(computeUnitStats(rabbit, state, TOUHOU_CATALOG).initiative).toBe(baseStats.initiative);
    expect(computeUnitStats(rabbit, state, TOUHOU_CATALOG).grazeChance).toBeCloseTo(baseStats.grazeChance, 3);

    // 3d. 若在兔化期间被「星律解咒」驱散，也会立刻还原模型并回收先攻！
    rabbit.mana = 99;
    state.activeUnitId = rabbit.id;
    expect(
      dispatchCombatCommand(state, { type: 'CAST_SPELL', unitId: rabbit.id, spellId: 'order_rabbit_transform' }, TOUHOU_CATALOG).ok,
    ).toBe(true);
    expect(rabbit.voxelBlueprintId).toBe('creature_rabbit_transformed');
    expect(rabbit.abilities.firstStrike).toBe(true);
    enemyEirin.pos = offsetToAxial(5, 10);
    enemyEirin.mana = 50;
    enemyEirin.knownSpellIds = ['order_dispel'];
    state.activeUnitId = enemyEirin.id;
    const disp = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: enemyEirin.id, spellId: 'order_dispel', targetUnitId: rabbit.id },
      TOUHOU_CATALOG,
    );
    expect(disp.ok, disp.error).toBe(true);
    expect(rabbit.statusEffects.rabbitFormRounds).toBe(0);
    expect(rabbit.voxelBlueprintId).toBe('creature_rabbit');
    expect(rabbit.abilities.firstStrike).toBe(false);
  });

  it('幽冥公馆·死亡系全 8 兵种 + 深渊冰魔 + 蕾米莉亚：暗系归属、全图瞬移、吸蓝诅咒、冰魔召唤、三翼裂袭与四阵营满编收敛', () => {
    // 1. 核验死亡系 8 城镇兵种 + 深渊冰魔的精确暗系/体型/特技归属
    expect(TOUHOU_CATALOG.heroes.hero_remilia.alignment).toBe('death');
    expect(TOUHOU_CATALOG.heroes.hero_remilia.signatureSpellCardId).toBe('remilia_gungnir');
    expect(TOUHOU_CATALOG.creatures.corpse_husk.abilities.undead).toBe(true);
    expect(TOUHOU_CATALOG.creatures.corpse_husk.abilities.skeletal).toBe(true);
    expect(TOUHOU_CATALOG.creatures.corpse_husk.abilities.darkNature).toBeFalsy();

    expect(TOUHOU_CATALOG.creatures.koakuma_imp.abilities.flying).toBe(true);
    expect(TOUHOU_CATALOG.creatures.koakuma_imp.abilities.manaLeech).toBe(true);
    expect(TOUHOU_CATALOG.creatures.koakuma_imp.abilities.spellcaster).toBe(true);
    expect(TOUHOU_CATALOG.creatures.koakuma_imp.abilities.darkNature).toBe(true);
    expect(TOUHOU_CATALOG.creatures.koakuma_imp.baseStats.maxMana).toBe(6);
    expect(TOUHOU_CATALOG.creatures.koakuma_imp.knownSpellIds).toEqual(['death_curse']);

    expect(TOUHOU_CATALOG.creatures.wraith_spirit.abilities.undead).toBe(true);
    expect(TOUHOU_CATALOG.creatures.wraith_spirit.abilities.insubstantial).toBe(true);
    expect(TOUHOU_CATALOG.creatures.wraith_spirit.abilities.agingOnHit).toBe(true);
    expect(TOUHOU_CATALOG.creatures.wraith_spirit.abilities.darkNature).toBeFalsy();

    expect(TOUHOU_CATALOG.creatures.hell_raven.footprint).toBe('2x1');
    expect(TOUHOU_CATALOG.creatures.hell_raven.abilities.flying).toBe(true);
    expect(TOUHOU_CATALOG.creatures.hell_raven.abilities.noRetaliation).toBe(true);
    expect(TOUHOU_CATALOG.creatures.hell_raven.abilities.threeHeadedAttack).toBe(true);
    expect(TOUHOU_CATALOG.creatures.hell_raven.abilities.darkNature).toBeFalsy();

    expect(TOUHOU_CATALOG.creatures.crimson_vampire.abilities.undead).toBe(true);
    expect(TOUHOU_CATALOG.creatures.crimson_vampire.abilities.lifeDraining).toBe(true);
    expect(TOUHOU_CATALOG.creatures.crimson_vampire.abilities.darkNature).toBe(true);

    expect(TOUHOU_CATALOG.creatures.miasma_venom_youkai.abilities.ranged).toBe(true);
    expect(TOUHOU_CATALOG.creatures.miasma_venom_youkai.abilities.poisonAttack).toBe(true);
    expect(TOUHOU_CATALOG.creatures.miasma_venom_youkai.abilities.darkNature).toBeFalsy();

    expect(TOUHOU_CATALOG.creatures.bone_dragon.footprint).toBe('2x2');
    expect(TOUHOU_CATALOG.creatures.bone_dragon.abilities.skeletal).toBe(true);
    expect(TOUHOU_CATALOG.creatures.bone_dragon.abilities.fearAttack).toBe(true);
    expect(TOUHOU_CATALOG.creatures.bone_dragon.abilities.darkNature).toBeFalsy();

    expect(TOUHOU_CATALOG.creatures.abyss_gap_devil.footprint).toBe('1x2');
    expect(TOUHOU_CATALOG.creatures.abyss_gap_devil.abilities.globalTeleport).toBe(true);
    expect(TOUHOU_CATALOG.creatures.abyss_gap_devil.abilities.lifeWard).toBe(true);
    expect(TOUHOU_CATALOG.creatures.abyss_gap_devil.abilities.darkNature).toBe(true);
    expect(TOUHOU_CATALOG.creatures.abyss_gap_devil.knownSpellIds).toContain('death_summon_ice_demon');

    expect(TOUHOU_CATALOG.creatures.abyss_ice_demon.abilities.darkNature).toBe(true);
    expect(TOUHOU_CATALOG.creatures.abyss_ice_demon.abilities.coldResistant).toBe(true);
    expect(TOUHOU_CATALOG.creatures.abyss_ice_demon.abilities.freezingAttack).toBe(true);

    // 2. 四阵营 A/B 满编合法零重叠落位校验
    for (const variant of ['A', 'B'] as const) {
      const { state } = createReimuVsMarisaBattle({
        mode: 'vs_ai',
        leftFaction: 'death',
        rightFaction: 'life',
        lineupVariant: variant,
        seed: 20261127,
      });
      const occupied = new Set<string>();
      for (const u of Object.values(state.units)) {
        for (const h of getUnitOccupiedHexes(u)) {
          const k = hexKey(h);
          expect(state.tiles[k], `${u.defId} 占据非法格子 ${k}`).toBeDefined();
          expect(occupied.has(k), `${u.defId} 存在重叠占位 ${k}`).toBe(false);
          occupied.add(k);
        }
      }
      expect(Object.values(state.units).filter((u) => u.side === 'left').length).toBe(7);
    }

    // 3. 实战验证：深渊全图瞬移（无视距离限制）、召唤深渊冰魔、冰魔寒冰免疫、小恶魔施放诅咒、血族吸血与毒瘴中毒
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        battleId: 'test_death_faction_mechanics',
        seed: 20261127,
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_remilia', col: 1, row: 10 },
          { kind: 'creature', defId: 'abyss_gap_devil', count: 2, col: 0, row: 10 },
          { kind: 'creature', defId: 'koakuma_imp', count: 20, col: 2, row: 8 },
          { kind: 'creature', defId: 'miasma_venom_youkai', count: 4, col: 2, row: 12 },
        ],
        rightSlots: [
          { kind: 'hero', defId: 'hero_eirin', col: 19, row: 10 },
          { kind: 'creature', defId: 'kedama', count: 20, col: 15, row: 10 },
          { kind: 'creature', defId: 'ofuda_archer', count: 16, col: 18, row: 8 },
        ],
        controllers: { left: 'human', right: 'human' },
      },
      TOUHOU_CATALOG,
    );

    const devil = Object.values(state.units).find((u) => u.defId === 'abyss_gap_devil')!;
    const imp = Object.values(state.units).find((u) => u.defId === 'koakuma_imp')!;
    const venom = Object.values(state.units).find((u) => u.defId === 'miasma_venom_youkai')!;
    const enemyEirin = Object.values(state.units).find((u) => u.defId === 'hero_eirin')!;
    const enemyKedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;

    // 3a. 深渊隙间恶魔「全图瞬移」：可一步瞬移到距离 > 12 格的远端合法空位
    const devilReach = getUnitReachableMap(state, devil, TOUHOU_CATALOG);
    const farDest = offsetToAxial(16, 12);
    expect(hexDistance(devil.pos, farDest)).toBeGreaterThan(10);
    expect(devilReach.costs.has(hexKey(farDest))).toBe(true);

    // 3b. 深渊隙间恶魔施放「深渊冰魔召唤」召出深渊冰魔，且冰魔完全免疫永琳的「极寒冰瀑」
    state.activeUnitId = devil.id;
    const summonTarget = offsetToAxial(4, 10);
    const summonRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: devil.id, spellId: 'death_summon_ice_demon', targetHex: summonTarget },
      TOUHOU_CATALOG,
    );
    expect(summonRes.ok, summonRes.error).toBe(true);
    const iceDemon = Object.values(state.units).find((u) => u.defId === 'abyss_ice_demon')!;
    expect(iceDemon).toBeDefined();
    expect(iceDemon.abilities.darkNature).toBe(true);
    expect(iceDemon.abilities.coldResistant).toBe(true);

    enemyEirin.pos = offsetToAxial(8, 10);
    enemyEirin.mana = 50;
    const hpBeforeIce = iceDemon.currentHp;
    const cntBeforeIce = iceDemon.count;
    state.activeUnitId = enemyEirin.id;
    const iceCast = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: enemyEirin.id, spellId: 'order_ice_bolt', targetUnitId: iceDemon.id },
      TOUHOU_CATALOG,
    );
    expect(iceCast.ok, iceCast.error).toBe(true);
    expect(iceDemon.count).toBe(cntBeforeIce);
    expect(iceDemon.currentHp).toBe(hpBeforeIce);

    // 3c. 小恶魔消耗 2 MP 施放「厄祟诅咒」（6 MP → 4 MP）
    imp.pos = offsetToAxial(12, 10);
    state.activeUnitId = imp.id;
    const curseRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: imp.id, spellId: 'death_curse', targetUnitId: enemyKedama.id },
      TOUHOU_CATALOG,
    );
    expect(curseRes.ok, curseRes.error).toBe(true);
    expect(imp.mana).toBe(4);
    expect(enemyKedama.statusEffects.curse).toBe(true);

    // 3d. 毒瘴妖面板为 15-20 伤，远程命中活体毛玉后瞬发「每只 13 点」无视防御剧毒扣血并挂上等额持续毒伤
    expect(TOUHOU_CATALOG.creatures.miasma_venom_youkai.baseStats.minDamage).toBe(15);
    expect(TOUHOU_CATALOG.creatures.miasma_venom_youkai.baseStats.maxDamage).toBe(20);
    venom.pos = offsetToAxial(10, 10);
    const kedamaMaxHp = TOUHOU_CATALOG.creatures.kedama.baseStats.maxHp;
    const kedamaTotalBefore = (enemyKedama.count - 1) * kedamaMaxHp + enemyKedama.currentHp;
    state.activeUnitId = venom.id;
    const venomAtk = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: venom.id, targetId: enemyKedama.id },
      TOUHOU_CATALOG,
    );
    expect(venomAtk.ok, venomAtk.error).toBe(true);
    const atkEv = venomAtk.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(atkEv && atkEv.type === 'COMBAT_EXCHANGE').toBe(true);
    if (atkEv && atkEv.type === 'COMBAT_EXCHANGE' && atkEv.attackerStrike) {
      const expectedPoison = Math.max(
        1,
        Math.round(4 * 13 * (1 - TOUHOU_CATALOG.creatures.kedama.baseStats.magicResistance)),
      );
      expect(atkEv.attackerStrike.poisonInstantDamage).toBe(expectedPoison);
      expect(enemyKedama.statusEffects.poisonPower).toBe(expectedPoison);
      const kedamaTotalAfter =
        enemyKedama.status === 'alive'
          ? (enemyKedama.count - 1) * kedamaMaxHp + enemyKedama.currentHp
          : 0;
      expect(kedamaTotalBefore - kedamaTotalAfter).toBe(
        atkEv.attackerStrike.damage + expectedPoison,
      );
    }
  });

  it('五大经典远程弹道体系（箭矢/光球/暗球/魔法冲击波/爆裂弹）应完整覆盖全部远程兵种与四位英雄', () => {
    const rangedUnits = [
      ...Object.values(TOUHOU_CATALOG.heroes),
      ...Object.values(TOUHOU_CATALOG.creatures).filter((c) => c.abilities.ranged),
    ];
    expect(rangedUnits.length).toBeGreaterThanOrEqual(16);

    const usedKinds = new Set<string>();
    const validModules = new Set(Object.keys(PIXELFX_MODULES));
    const validPalettes = new Set(Object.keys(TOUHOU_PALETTES));

    for (const u of rangedUnits) {
      const prof = resolveUnitRangedProjectile(u.id, u.voxelBlueprintId);
      usedKinds.add(prof.kind);
      expect(validModules.has(prof.impactFx), `${u.id} 的远程命中特效 ${prof.impactFx} 未注册`).toBe(true);
      expect(validPalettes.has(prof.impactPalette), `${u.id} 的远程调色板 ${prof.impactPalette} 未注册`).toBe(true);
    }

    expect([...usedKinds].sort()).toEqual(['arrow', 'dark_orb', 'explosive_shell', 'light_orb', 'magic_wave']);
    expect(resolveUnitRangedProjectile('ofuda_archer').kind).toBe('arrow');
    expect(resolveUnitRangedProjectile('hero_eirin').kind).toBe('arrow');
    expect(resolveUnitRangedProjectile('hero_reimu').kind).toBe('light_orb');
    expect(resolveUnitRangedProjectile('miasma_venom_youkai').kind).toBe('dark_orb');
    expect(resolveUnitRangedProjectile('grimoire_familiar').kind).toBe('dark_orb');
    expect(resolveUnitRangedProjectile('purity_titan').kind).toBe('magic_wave');
    expect(resolveUnitRangedProjectile('lunar_slinger').kind).toBe('explosive_shell');
    expect(resolveUnitRangedProjectile('yinyang_turret').kind).toBe('explosive_shell');
  });

  it('站台（高地）应赋予单位 +50% 有效施法距离，并同步引擎结算、状态徽章与法术悬浮提示', () => {
    const map = buildShrineNightBattleMap();
    // 清除中间格高耸障碍确保视线畅通，仅保留 (8,3) 为高地站台
    for (const tile of Object.values(map.tiles)) {
      if (tile.terrain === 'rock' || tile.terrain === 'wall') {
        tile.terrain = 'plain';
        tile.elevation = 1;
        tile.blocksGround = false;
        tile.losObstruction = 'none';
      }
    }
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'hero', defId: 'hero_marisa', col: 8, row: 5 }],
        rightSlots: [{ kind: 'creature', defId: 'kedama', count: 10, col: 25, row: 14 }],
        controllers: { left: 'human', right: 'human' },
        seed: 9101,
      },
      TOUHOU_CATALOG,
    );

    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;
    const enemy = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const arrowSpell = TOUHOU_CATALOG.spells.chaos_magic_arrow; // 基础射程 15
    const summonSpell = TOUHOU_CATALOG.spells.nature_summon_sprite; // 基础射程 12

    // 1. 先放在平地 (8,5) 并将敌军摆到距离 19 格处（大于平地 15 格，小于高地 23 格）
    const plainPos = offsetToAxial(8, 5);
    const highlandPos = offsetToAxial(8, 3);
    expect(state.tiles[hexKey(plainPos)].terrain).toBe('plain');
    expect(state.tiles[hexKey(highlandPos)].terrain).toBe('highland');

    // 找到距离 highlandPos 与 plainPos 均落在 (15, 22] 区间的合法格子
    const farTile = Object.values(state.tiles).find(
      (t) =>
        !t.blocksGround &&
        hexDistance(plainPos, t) >= 18 &&
        hexDistance(plainPos, t) <= 21 &&
        hexDistance(highlandPos, t) >= 18 &&
        hexDistance(highlandPos, t) <= 22,
    )!;
    expect(farTile).toBeDefined();
    enemy.pos = { q: farTile.q, r: farTile.r };

    // 平地上施法距离保持基础值 15，打 18+ 格远的目标应被拒绝
    marisa.pos = plainPos;
    expect(isUnitOnHighlandPlatform(state, marisa)).toBe(false);
    expect(getEffectiveSpellRange(state, marisa, arrowSpell)).toBe(15);
    expect(getEffectiveSpellRange(state, marisa, summonSpell)).toBe(12);
    state.activeUnitId = marisa.id;
    marisa.mana = 100;
    const plainCast = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: marisa.id, spellId: arrowSpell.id, targetUnitId: enemy.id },
      TOUHOU_CATALOG,
    );
    expect(plainCast.ok).toBe(false);
    expect(plainCast.error).toContain('超出施法距离');

    // 2. 登上 (8,3) 站台高地后，施法距离 +50%（15 → 23, 12 → 18），同距离成功命中！
    marisa.pos = highlandPos;
    expect(isUnitOnHighlandPlatform(state, marisa)).toBe(true);
    expect(getEffectiveSpellRange(state, marisa, arrowSpell)).toBe(23);
    expect(getEffectiveSpellRange(state, marisa, summonSpell)).toBe(18);

    // 验证 HUD 状态徽章与法术悬浮提示同步显示高台+50%
    const statusBadges = buildUnitStatusBadges(marisa, state);
    expect(statusBadges.some((b) => b.id === 'status_highland_platform')).toBe(true);
    const tip = buildSpellTooltipPayload(arrowSpell, {
      effectiveRange: getEffectiveSpellRange(state, marisa, arrowSpell),
    });
    expect(tip.subtitle).toContain('23格(高台+50%)');
    expect(tip.lines.some((l) => l.includes('+50%'))).toBe(true);

    state.activeUnitId = marisa.id;
    marisa.hasActedThisRound = false;
    const highlandCast = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: marisa.id, spellId: arrowSpell.id, targetUnitId: enemy.id },
      TOUHOU_CATALOG,
    );
    expect(highlandCast.ok, highlandCast.error).toBe(true);
  });

  it('尸壳防御与小恶魔攻击数值加强，且死亡系全部召唤/招魂术式均生成正式死亡阵营兵种并忠实结算残兵与残骸池', () => {
    // 1. 尸壳防御加强（11 -> 14）与小恶魔攻击加强（10 -> 13）
    expect(TOUHOU_CATALOG.creatures.corpse_husk.baseStats.defense).toBe(14);
    expect(TOUHOU_CATALOG.creatures.koakuma_imp.baseStats.attack).toBe(13);

    // 2. 图鉴中已彻底移除旧冒牌招魂模板，全部死亡招魂术指向幽冥公馆正式死亡兵种
    expect(TOUHOU_CATALOG.creatures.raise_skeleton).toBeUndefined();
    expect(TOUHOU_CATALOG.creatures.raise_ghost).toBeUndefined();
    expect(TOUHOU_CATALOG.creatures.raise_vampire).toBeUndefined();
    expect(TOUHOU_CATALOG.spells.death_raise_skeletons.summonTemplateId).toBe('corpse_husk');
    expect(TOUHOU_CATALOG.spells.death_raise_ghost.summonTemplateId).toBe('wraith_spirit');
    expect(TOUHOU_CATALOG.spells.death_raise_vampires.summonTemplateId).toBe('crimson_vampire');
    expect(TOUHOU_CATALOG.spells.death_summon_ice_demon.summonTemplateId).toBe('abyss_ice_demon');

    // 3. 验证 allocateHpPoolToStack 精确拆分残兵（绝不白嫖满血）
    expect(allocateHpPoolToStack(40, 78)).toEqual({ count: 1, currentHp: 40 });
    expect(allocateHpPoolToStack(100, 78)).toEqual({ count: 2, currentHp: 22 });
    expect(allocateHpPoolToStack(156, 78)).toEqual({ count: 2, currentHp: 78 });

    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_remilia', col: 5, row: 10 },
          { kind: 'creature', defId: 'bone_dragon', count: 1, col: 6, row: 12 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'koakuma_imp', count: 10, col: 8, row: 10 },
          { kind: 'creature', defId: 'kedama', count: 20, col: 9, row: 12 },
          { kind: 'creature', defId: 'exorcist_blade', count: 10, col: 9, row: 8 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 9102,
      },
      TOUHOU_CATALOG,
    );

    const remilia = Object.values(state.units).find((u) => u.defId === 'hero_remilia')!;
    const allyDragon = Object.values(state.units).find((u) => u.defId === 'bone_dragon')!;
    const enemyImp = Object.values(state.units).find((u) => u.defId === 'koakuma_imp')!;
    const enemyKedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const enemyBlade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;

    const castAsRemilia = (spellId: string, targetUnitId: string) => {
      state.activeUnitId = remilia.id;
      remilia.mana = 200;
      remilia.hasActedThisRound = false;
      return dispatchCombatCommand(
        state,
        { type: 'CAST_SPELL', unitId: remilia.id, spellId, targetUnitId },
        TOUHOU_CATALOG,
      );
    };

    // 4. 仅阵亡 2 只小恶魔（13×2 = 26 HP 残骸池），施放「招魂·血族」必须严格受残骸生命池截断，
    //    唤出 1 只 26/78 残血正式「血族眷属」（绝不白嫖 78/78 满血！），且该残骸随后被榨干不可重复招魂
    enemyImp.count = 8; // maxCount=10 -> 阵亡 2 只 = 26 HP 残骸
    expect(getAvailableCorpseHp(state, enemyImp, TOUHOU_CATALOG)).toBe(26);
    const vampRes = castAsRemilia('death_raise_vampires', enemyImp.id);
    expect(vampRes.ok, vampRes.error).toBe(true);
    const raisedVamp = Object.values(state.units).find((u) => u.defId === 'crimson_vampire' && u.isSummoned)!;
    expect(raisedVamp).toBeDefined();
    expect(raisedVamp.voxelBlueprintId).toBe('creature_crimson_vampire');
    expect(raisedVamp.count).toBe(1);
    expect(raisedVamp.currentHp).toBe(26);
    expect(raisedVamp.currentHp).toBeLessThan(TOUHOU_CATALOG.creatures.crimson_vampire.baseStats.maxHp);
    expect(getAvailableCorpseHp(state, enemyImp, TOUHOU_CATALOG)).toBe(0);
    // 已被榨干的残骸不可再次招魂
    const secondTry = castAsRemilia('death_raise_skeletons', enemyImp.id);
    expect(secondTry.ok).toBe(false);

    // 5. 「招魂·怨灵」唤出正式「怨灵 (wraith_spirit)」，「反魂起尸」转化敌残骸为正式「尸壳 (corpse_husk)」，
    //    「黄泉呼唤」转化敌残骸为正式「怨灵 (wraith_spirit)」
    enemyKedama.count = 15; // 阵亡 5 只毛玉 = 90 HP
    const ghostRes = castAsRemilia('death_raise_ghost', enemyKedama.id);
    expect(ghostRes.ok, ghostRes.error).toBe(true);
    const raisedGhost = Object.values(state.units).find((u) => u.defId === 'wraith_spirit' && u.isSummoned)!;
    expect(raisedGhost).toBeDefined();
    expect(raisedGhost.voxelBlueprintId).toBe('creature_wraith_spirit');
    // 90 HP / 28 HP = 3 满血 + 1 只 6/28 残兵
    expect(raisedGhost.count).toBe(4);
    expect(raisedGhost.currentHp).toBe(6);

    enemyBlade.count = 9; // 阵亡 1 只剑士，按其真实单兵生命池精确转化为正式「尸壳」含残兵
    const bladeHp = TOUHOU_CATALOG.creatures.exorcist_blade.baseStats.maxHp;
    const expectedHusk = allocateHpPoolToStack(bladeHp, TOUHOU_CATALOG.creatures.corpse_husk.baseStats.maxHp);
    const animEnemyRes = castAsRemilia('death_animate_dead', enemyBlade.id);
    expect(animEnemyRes.ok, animEnemyRes.error).toBe(true);
    const raisedHusk = Object.values(state.units).find((u) => u.defId === 'corpse_husk' && u.isSummoned)!;
    expect(raisedHusk).toBeDefined();
    expect(raisedHusk.voxelBlueprintId).toBe('creature_corpse_husk');
    expect(raisedHusk.count).toBe(expectedHusk.count);
    expect(raisedHusk.currentHp).toBe(expectedHusk.currentHp);
    expect(raisedHusk.currentHp).toBeLessThan(TOUHOU_CATALOG.creatures.corpse_husk.baseStats.maxHp);

    // 6. 友军尸体原地复活（「反魂起尸」复活阵亡的 225 HP 骸骨巨龙）：预算低于 225 HP 时精确复生为残血巨龙！
    allyDragon.count = 0;
    allyDragon.currentHp = 0;
    allyDragon.status = 'dead';
    // 调低蕾米法强与死灵子技能以测试预算低于 225 HP 的精确残血复生
    remilia.baseStats.spellPower = 4;
    remilia.subSkills.necromancy = 0;
    remilia.equippedArtifactIds = [];
    const revAllyRes = castAsRemilia('death_animate_dead', allyDragon.id);
    expect(revAllyRes.ok, revAllyRes.error).toBe(true);
    expect(allyDragon.status).toBe('alive');
    expect(allyDragon.count).toBe(1);
    expect(allyDragon.currentHp).toBeGreaterThan(0);
    expect(allyDragon.currentHp).toBeLessThan(TOUHOU_CATALOG.creatures.bone_dragon.baseStats.maxHp);
  });

  it('镜像/幻象复制（蜃楼幻影 / 月镜分身）应严格校验施法者实力强压门槛并忠实复制残兵、禁止套娃', () => {
    const map = buildShrineNightBattleMap();
    for (const tile of Object.values(map.tiles)) {
      if (tile.terrain === 'rock' || tile.terrain === 'wall') {
        tile.terrain = 'plain';
        tile.elevation = 1;
        tile.blocksGround = false;
        tile.losObstruction = 'none';
      }
    }
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_eirin', col: 5, row: 10 },
          { kind: 'creature', defId: 'lunar_genie', count: 1, col: 6, row: 8 },
          { kind: 'creature', defId: 'corpse_husk', count: 20, col: 7, row: 12 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'exorcist_blade', count: 6, col: 9, row: 8 },
          { kind: 'creature', defId: 'hisoutensoku', count: 1, col: 9, row: 10 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 9103,
      },
      TOUHOU_CATALOG,
    );

    const eirin = Object.values(state.units).find((u) => u.defId === 'hero_eirin')!;
    const genie = Object.values(state.units).find((u) => u.defId === 'lunar_genie')!;
    const husk = Object.values(state.units).find((u) => u.defId === 'corpse_husk')!;
    const blade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const titan = Object.values(state.units).find((u) => u.defId === 'hisoutensoku')!;

    // 1. 仅剩 1 只的 T3 幻月妖无法复制 T4 非想天则或 T2 退魔剑士（施法者实力远不足）
    state.activeUnitId = genie.id;
    genie.mana = 22;
    const genieVsTitan = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: genie.id, spellId: 'order_create_illusion', targetUnitId: titan.id },
      TOUHOU_CATALOG,
    );
    expect(genieVsTitan.ok).toBe(false);
    expect(genieVsTitan.error).toContain('过于强大');

    const genieVsBlade = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: genie.id, spellId: 'order_create_illusion', targetUnitId: blade.id },
      TOUHOU_CATALOG,
    );
    expect(genieVsBlade.ok).toBe(false);

    // 2. 1 只幻月妖远强于单只 T1 尸壳（16 HP），可成功释放复制，且严格按预算生成残兵堆叠（绝不白嫖满血！）
    const genieVsHusk = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: genie.id, spellId: 'order_create_illusion', targetUnitId: husk.id },
      TOUHOU_CATALOG,
    );
    expect(genieVsHusk.ok, genieVsHusk.error).toBe(true);
    const huskClone = Object.values(state.units).find((u) => u.isIllusion && u.defId === 'corpse_husk')!;
    expect(huskClone).toBeDefined();
    // 1 只幻月妖预算 = floor(36 * 0.59 * 1) = 21 HP -> 16 满血 + 5/16 残兵（count = 2, currentHp = 5）
    expect(huskClone.count).toBe(2);
    expect(huskClone.currentHp).toBe(5);

    // 3. 5 级八意永琳用 2 级「蜃楼幻影」无法复制 4 阶非想天则（需 ≥ 3.0× 支配力），
    //    但改用 4 级「月镜分身」（1.8× 门槛）可成功复制，且只生成残血非想天则幻象（绝不直接满血 255！）
    state.activeUnitId = eirin.id;
    eirin.mana = 100;
    const eirinLowVsTitan = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: eirin.id, spellId: 'order_create_illusion', targetUnitId: titan.id },
      TOUHOU_CATALOG,
    );
    expect(eirinLowVsTitan.ok).toBe(false);

    const eirinHighVsTitan = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: eirin.id, spellId: 'order_phantom_image', targetUnitId: titan.id },
      TOUHOU_CATALOG,
    );
    expect(eirinHighVsTitan.ok, eirinHighVsTitan.error).toBe(true);
    const titanClone = Object.values(state.units).find((u) => u.isIllusion && u.defId === 'hisoutensoku')!;
    expect(titanClone).toBeDefined();
    expect(titanClone.count).toBe(1);
    // 目标仅 1 只 255 HP，85% 上限 = 216 HP，必为残血非想天则幻象
    expect(titanClone.currentHp).toBeLessThan(TOUHOU_CATALOG.creatures.hisoutensoku.baseStats.maxHp);
    expect(titanClone.currentHp).toBeLessThanOrEqual(216);

    // 4. 禁止对幻象单位再次套娃复制
    const nestedEval = evaluateIllusionSpell(
      TOUHOU_CATALOG.spells.order_create_illusion,
      eirin,
      huskClone,
      state,
      TOUHOU_CATALOG,
    );
    expect(nestedEval.ok).toBe(false);
    if (!nestedEval.ok) {
      expect(nestedEval.shortLabel).toBe('不可复制幻象');
    }
  });

  it('枯荣凋零与全部群体/AOE法术特效应零死循环、零卡死且 Painter 底层安全拦截 NaN 坐标', () => {
    // 1. 校验 Painter 底层安全守卫：直接传入 NaN / Infinity 坐标给 p.line() 必须立刻返回，绝不进入 Bresenham 死循环！
    installPixelFxPainterSafetyGuards();
    const guardFrame = createFrame(64, 64, 0, 0);
    const guardPainter = painterFor(guardFrame);
    expect(() => {
      guardPainter.line(NaN, 2.5, NaN, 2.5, 0xffffffff, 1);
      guardPainter.line(-Infinity, 0, Infinity, 10, 0xffffffff, 1);
      guardPainter.beam(NaN, 0, 10, 10, 4, 0xffffffff, 1);
      guardPainter.glow(NaN, NaN, 20, 0xffffffff, 0.5);
    }).not.toThrow();

    // 2. 引擎端释放「枯荣凋零 (death_mass_weakness)」：全体非魔免敌军准确挂上 -25% 伤害减益且 AI 回合正常推进
    const { state } = createReimuVsMarisaBattle({
      mode: 'vs_ai',
      leftFaction: 'death',
      rightFaction: 'life',
      seed: 9201,
    });
    const remilia = Object.values(state.units).find((u) => u.defId === 'hero_remilia')!;
    const enemiesBefore = Object.values(state.units).filter((u) => u.side === 'right' && u.status === 'alive');
    state.activeUnitId = remilia.id;
    remilia.mana = 100;
    const castRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: remilia.id, spellId: 'death_mass_weakness' },
      TOUHOU_CATALOG,
    );
    expect(castRes.ok, castRes.error).toBe(true);
    const castEv = castRes.events.find((e) => e.type === 'SPELL_CAST');
    expect(castEv && castEv.type === 'SPELL_CAST').toBe(true);
    if (castEv && castEv.type === 'SPELL_CAST') {
      expect(castEv.affectedUnitIds.length).toBe(enemiesBefore.length);
    }
    for (const enemy of enemiesBefore) {
      expect(enemy.modifiers.some((m) => m.spellId === 'death_mass_weakness' && m.value === -0.25)).toBe(true);
    }

    // 3. 重点模拟「枯荣凋零」7 敌军同屏并发释放（含 casterFx + impactFx + 7×shadow_tendrils），60fps 跑满全程必须极快收敛且全部结束！
    const fxFrame = createFrame(320, 180, 0, 0);
    const weaknessSpec = SPELL_VFX_CATALOG.death_mass_weakness;
    const liveSlots: Array<{ inst: ReturnType<typeof createFx>; elapsed: number; maxDur: number }> = [];
    const spawnSlot = (key: keyof typeof PIXELFX_MODULES, x: number, y: number, palKey: keyof typeof TOUHOU_PALETTES, maxDur: number) => {
      liveSlots.push({
        inst: createFx(PIXELFX_MODULES[key], {
          x,
          y,
          seed: 1001 + liveSlots.length * 17,
          palette: [...TOUHOU_PALETTES[palKey]],
          light: 1.35,
          actor: SILENT_PIXELFX_ACTOR,
        } as Record<string, unknown>),
        elapsed: 0,
        maxDur,
      });
    };
    if (weaknessSpec.casterFx) spawnSlot(weaknessSpec.casterFx, 80, 90, weaknessSpec.casterPalette ?? weaknessSpec.impactPalette, 0.95);
    spawnSlot(weaknessSpec.impactFx, 160, 90, weaknessSpec.impactPalette, 1.5);
    for (let k = 0; k < 7; k++) {
      spawnSlot(weaknessSpec.perTargetFx!, 90 + k * 25, 80 + (k % 3) * 20, weaknessSpec.perTargetPalette ?? weaknessSpec.impactPalette, 1.2);
    }
    for (let f = 0; f < 120; f++) {
      clearFrame(fxFrame);
      for (let i = liveSlots.length - 1; i >= 0; i--) {
        const s = liveSlots[i];
        s.elapsed += 0.016;
        if (s.elapsed >= s.maxDur) s.inst.stop();
        s.inst.update(0.016 * 1.5);
        if (s.inst.done()) {
          liveSlots.splice(i, 1);
          continue;
        }
        s.inst.draw(fxFrame);
      }
      if (liveSlots.length === 0) break;
    }
    expect(liveSlots.length).toBe(0);

    // 4. 全量扫描全部群体/天象/AOE 法术的 VFX 编排，确认零死循环、零报错、全部正常渲染并完成收敛
    const aoeSpellEntries = Object.entries(SPELL_VFX_CATALOG).filter(
      ([, spec]) => Boolean(spec.perTargetFx || spec.weatherFx || spec.travel === 'screen_weather' || spec.travel === 'meteor_rain' || spec.travel === 'ring_burst'),
    );
    expect(aoeSpellEntries.length).toBeGreaterThanOrEqual(40);
    for (const [spellId, spec] of aoeSpellEntries) {
      const keys = [spec.casterFx, spec.impactFx, spec.secondaryFx, spec.perTargetFx, spec.weatherFx].filter(
        Boolean,
      ) as Array<keyof typeof PIXELFX_MODULES>;
      for (const k of keys) {
        const inst = createFx(PIXELFX_MODULES[k], {
          x: 160,
          y: 90,
          seed: 1103,
          palette: [...TOUHOU_PALETTES[spec.impactPalette]],
          light: 1.3,
          actor: SILENT_PIXELFX_ACTOR,
        } as Record<string, unknown>);
        expect(() => {
          for (let step = 0; step < 6; step++) {
            clearFrame(fxFrame);
            inst.update(0.22);
            if (!inst.done()) inst.draw(fxFrame);
          }
          inst.stop();
          inst.update(0.4);
        }, `群体法术 ${spellId} 的模块 ${k} 渲染异常`).not.toThrow();
        expect(inst.done(), `群体法术 ${spellId} 的模块 ${k} stop 后未正常退出`).toBe(true);
      }
    }
  });

  it('召唤物三分类来源标记（幻象/召唤/复生）应准确区分，并映射至互不相同的血条主题配色与抬头微标', () => {
    const map = buildShrineNightBattleMap();
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_reimu', col: 4, row: 10 },
          { kind: 'creature', defId: 'corpse_husk', count: 4, col: 4, row: 12 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'kedama', count: 2, col: 8, row: 10 },
          { kind: 'creature', defId: 'ofuda_archer', count: 6, col: 10, row: 12 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 9811,
      },
      TOUHOU_CATALOG,
    );

    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const allyCorpse = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'corpse_husk')!;
    const enemyKedama = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'kedama')!;
    const enemyArcher = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'ofuda_archer')!;

    // 给灵梦充足法力并击倒敌方毛玉留出残骸、同时令友方尸壳阵亡测试原地复生
    reimu.mana = 120;
    enemyKedama.count = 0;
    enemyKedama.currentHp = 0;
    enemyKedama.status = 'dead';
    allyCorpse.count = 0;
    allyCorpse.currentHp = 0;
    allyCorpse.status = 'dead';

    // 1. 召唤法术 → summonKind === 'summoned'
    state.activeUnitId = reimu.id;
    reimu.hasActedThisRound = false;
    const sumRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'nature_summon_wolf', targetHex: offsetToAxial(6, 9) },
      TOUHOU_CATALOG,
    );
    expect(sumRes.ok).toBe(true);
    const sumEv = sumRes.events.find((e) => e.type === 'SPELL_CAST');
    const sumId = sumEv?.type === 'SPELL_CAST' ? sumEv.summonedUnitIds?.[0] : undefined;
    const summonedUnit = sumId ? state.units[sumId] : undefined;
    expect(summonedUnit).toBeDefined();
    expect(summonedUnit?.isSummoned).toBe(true);
    expect(summonedUnit?.isIllusion).toBeFalsy();
    expect(resolveUnitSummonKind(summonedUnit!)).toBe('summoned');

    // 2. 招魂复生（从敌尸唤起尸壳）→ summonKind === 'raised'
    state.activeUnitId = reimu.id;
    reimu.hasActedThisRound = false;
    const raiseRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'death_raise_skeletons', targetUnitId: enemyKedama.id },
      TOUHOU_CATALOG,
    );
    expect(raiseRes.ok).toBe(true);
    const raiseEv = raiseRes.events.find((e) => e.type === 'SPELL_CAST');
    const raiseId = raiseEv?.type === 'SPELL_CAST' ? raiseEv.summonedUnitIds?.[0] : undefined;
    const raisedUnit = raiseId ? state.units[raiseId] : undefined;
    expect(raisedUnit).toBeDefined();
    expect(raisedUnit?.isSummoned).toBe(true);
    expect(resolveUnitSummonKind(raisedUnit!)).toBe('raised');

    // 3. 死亡操纵死尸（原地复生已全灭的友方残骸）→ summonKind === 'raised' 且不破坏常驻单位 isSummoned 标记
    state.activeUnitId = reimu.id;
    reimu.hasActedThisRound = false;
    const animRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'death_animate_dead', targetUnitId: allyCorpse.id },
      TOUHOU_CATALOG,
    );
    expect(animRes.ok).toBe(true);
    expect(allyCorpse.status).toBe('alive');
    expect(resolveUnitSummonKind(allyCorpse)).toBe('raised');
    expect(allyCorpse.isSummoned).toBeFalsy();

    // 4. 镜像幻象（对敌方御札弓手施放）→ summonKind === 'illusion' & isIllusion === true
    state.activeUnitId = reimu.id;
    reimu.hasActedThisRound = false;
    const illRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: reimu.id, spellId: 'order_phantom_image', targetUnitId: enemyArcher.id },
      TOUHOU_CATALOG,
    );
    expect(illRes.ok).toBe(true);
    const illEv = illRes.events.find((e) => e.type === 'SPELL_CAST');
    const illId = illEv?.type === 'SPELL_CAST' ? illEv.summonedUnitIds?.[0] : undefined;
    const illusionUnit = illId ? state.units[illId] : undefined;
    expect(illusionUnit).toBeDefined();
    expect(illusionUnit?.isIllusion).toBe(true);
    expect(resolveUnitSummonKind(illusionUnit!)).toBe('illusion');

    // 5. 视觉血条主题与抬头徽标应三类互不相同，常规单位不带召唤标记
    expect(resolveUnitSummonKind(reimu)).toBeNull();
    const gradients = new Set([
      SUMMON_KIND_HP_THEME.illusion.hpGradient,
      SUMMON_KIND_HP_THEME.summoned.hpGradient,
      SUMMON_KIND_HP_THEME.raised.hpGradient,
    ]);
    expect(gradients.size).toBe(3);
    expect(getUnitHeaderCreatureTags(illusionUnit!).some((t) => t.id === 'illusion')).toBe(true);
    expect(getUnitHeaderCreatureTags(summonedUnit!).some((t) => t.id === 'summoned')).toBe(true);
    expect(getUnitHeaderCreatureTags(raisedUnit!).some((t) => t.id === 'raised')).toBe(true);
  });

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
      for (const t of Object.values(map.tiles)) {
        t.terrain = 'plain';
        t.elevation = 0;
        t.blocksGround = false;
        t.losObstruction = 'none';
        t.moveCost = 1;
      }
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
      for (const t of Object.values(map.tiles)) {
        t.terrain = 'plain';
        t.elevation = 0;
        t.blocksGround = false;
        t.losObstruction = 'none';
        t.moveCost = 1;
      }
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

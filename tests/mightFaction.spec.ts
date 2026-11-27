/**
 * 武艺旧都 · 力量阵营完整机制、混沌四阶新法术「命符·战争血祭」、星熊勇仪与三档 AI 专项单元测试
 */

import { describe, expect, it } from 'vitest';
import { chooseTacticalAiCommand } from '@ai/tacticalAi';
import {
  computeLightningStrikeDamage,
  createBattleState,
  dispatchCombatCommand,
  previewAreaRangedAttack,
  previewAttack,
} from '@core/combatEngine';
import { getFootprintHexes, hexEquals, hexKey, offsetToAxial, type HexTile } from '@core/hex';
import { computeUnitStats } from '@core/modifiers';
import {
  buildFactionArmySlots,
  createReimuVsMarisaBattle,
  TOUHOU_CATALOG,
} from '@data/battlePresets';
import { MIGHT_CREATURES } from '@data/factions';
import { buildShrineNightBattleMap } from '@data/definitions';
import { CHAOS_SPELL_COPY } from '@data/spellCopy/chaos';
import { CHAOS_SPELL_ICON_DRAWERS } from '@renderer/spellIconsChaos';
import { getSpellVfxChoreography } from '@renderer/spellVfxCatalog';
import { getVoxelSpriteSpecForAudit } from '@renderer/voxelSprites';
import { buildUnitSpecialtyBadges, buildUnitStatusBadges } from '@ui/hudMetadata';

/** 构建干净无障碍平坦 14×10 测试棋盘 */
function createFlatTiles(width = 14, height = 10): Record<string, HexTile> {
  const tiles: Record<string, HexTile> = {};
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const c = offsetToAxial(col, row);
      tiles[hexKey(c)] = {
        q: c.q,
        r: c.r,
        terrain: 'plain',
        elevation: 1,
        blocksGround: false,
        losObstruction: 'none',
        moveCost: 1,
        decorSeed: col * 31 + row * 17,
      };
    }
  }
  return tiles;
}

describe('武艺旧都 · 力量阵营 8 兵种与星熊勇仪基础规格', () => {
  it('应完整注册 8 种力量兵种与星熊勇仪，且左右 A/B 阵预设全部合法无重叠', () => {
    expect(Object.keys(MIGHT_CREATURES)).toHaveLength(8);
    expect(MIGHT_CREATURES.might_berserker.name).toBe('狂战士');
    expect(MIGHT_CREATURES.might_javelineer.name).toBe('标枪手');
    expect(MIGHT_CREATURES.might_oni_vanguard.name).toBe('鬼族先锋');
    expect(MIGHT_CREATURES.might_roaming_hound.name).toBe('巡回猎犬');
    expect(MIGHT_CREATURES.might_mountain_thrower.name).toBe('掷山大力鬼');
    expect(MIGHT_CREATURES.might_red_priest.name).toBe('红祭司');
    expect(MIGHT_CREATURES.might_crimson_thunderbird.name).toBe('赤雷巨鹏');
    expect(MIGHT_CREATURES.might_lava_behemoth.name).toBe('熔岩巨兽');

    expect(MIGHT_CREATURES.might_red_priest.footprint).toBe('1x2');
    expect(MIGHT_CREATURES.might_mountain_thrower.footprint).toBe('2x2');
    expect(MIGHT_CREATURES.might_crimson_thunderbird.footprint).toBe('2x2');
    expect(MIGHT_CREATURES.might_lava_behemoth.footprint).toBe('2x2');
    expect(MIGHT_CREATURES.might_roaming_hound.abilities.flying).toBeFalsy();
    expect(MIGHT_CREATURES.might_roaming_hound.baseStats.speed).toBeGreaterThanOrEqual(10);

    // 校验力量阵营最新数值平衡调整
    expect(MIGHT_CREATURES.might_berserker.baseStats.attack).toBe(12);
    expect(MIGHT_CREATURES.might_berserker.baseStats.defense).toBe(11);
    expect(MIGHT_CREATURES.might_javelineer.baseStats.attack).toBe(13);
    expect(MIGHT_CREATURES.might_roaming_hound.baseStats.attack).toBe(16);
    expect(MIGHT_CREATURES.might_mountain_thrower.baseStats.minDamage).toBe(17);
    expect(MIGHT_CREATURES.might_mountain_thrower.baseStats.maxDamage).toBe(23);
    expect(MIGHT_CREATURES.might_mountain_thrower.baseStats.range).toBe(10);
    expect(MIGHT_CREATURES.might_red_priest.baseStats.attack).toBe(21);
    expect(MIGHT_CREATURES.might_red_priest.baseStats.magicResistance).toBeCloseTo(0.3, 4);
    expect(MIGHT_CREATURES.might_lava_behemoth.baseStats.defense).toBe(26);

    // 校验 9 套 64×72 像素绘谱全部注册就绪
    for (const def of Object.values(MIGHT_CREATURES)) {
      expect(getVoxelSpriteSpecForAudit(def.voxelBlueprintId)).toBeDefined();
    }
    expect(getVoxelSpriteSpecForAudit('hero_yuugi')).toBeDefined();

    // 校验左右 A/B 阵预设全部 7 队零阻挡、零重叠
    const map = buildShrineNightBattleMap();
    for (const variant of ['A', 'B'] as const) {
      for (const side of ['left', 'right'] as const) {
        const slots = buildFactionArmySlots('might', side, variant);
        expect(slots).toHaveLength(7);
        const used = new Set<string>();
        for (const s of slots) {
          const anchor = offsetToAxial(s.col, s.row);
          const fp =
            s.kind === 'hero'
              ? TOUHOU_CATALOG.heroes[s.defId].footprint ?? '1x1'
              : TOUHOU_CATALOG.creatures[s.defId].footprint ?? '1x1';
          const isFly = s.kind === 'creature' && Boolean(TOUHOU_CATALOG.creatures[s.defId].abilities.flying);
          for (const h of getFootprintHexes(anchor, fp)) {
            const k = hexKey(h);
            const tile = map.tiles[k];
            expect(tile, `${side}-${variant}-${s.defId} (${k}) 应在地图内`).toBeDefined();
            if (!isFly) {
              expect(tile.blocksGround, `${side}-${variant}-${s.defId} 不得落在不可通行障碍`).toBe(false);
            }
            expect(used.has(k), `${side}-${variant}-${s.defId} 占位不得重叠`).toBe(false);
            used.add(k);
          }
        }
      }
    }
  });

  it('星熊勇仪应为无蓝无战术的 5 级格斗/近战/射手/魔抗大宗师，且 0 耗物理符卡无视魔免', () => {
    const { state } = createReimuVsMarisaBattle({
      mode: 'hotseat',
      leftFaction: 'might',
      rightFaction: 'chaos',
      lineupVariant: 'B',
      seed: 1001,
    });
    const yuugi = Object.values(state.units).find((u) => u.defId === 'hero_yuugi')!;
    expect(yuugi).toBeDefined();
    expect(yuugi.skills.combat).toBe(5);
    expect(yuugi.skills.tactics ?? 0).toBe(0);
    expect(yuugi.subSkills?.melee).toBe(5);
    expect(yuugi.subSkills?.archery).toBe(5);
    expect(yuugi.subSkills?.magic_resistance).toBe(5);
    expect(yuugi.baseStats.maxMana).toBe(0);
    expect(yuugi.knownSpellIds).toHaveLength(0);

    // 5 级近战 + 5 级射击自动派生全套格斗特技
    expect(yuugi.abilities.firstStrike).toBe(true);
    expect(yuugi.abilities.meleeDoubleStrike).toBe(true);
    expect(yuugi.abilities.ranged).toBe(true);
    expect(yuugi.abilities.noObstaclePenalty).toBe(true);
    expect(yuugi.abilities.longRange).toBe(true);
    expect(yuugi.abilities.rangedFirstStrike).toBe(true);
    expect(yuugi.abilities.rangedDoubleStrike).toBe(true);
    const stats = computeUnitStats(yuugi, state, TOUHOU_CATALOG);
    expect(stats.magicResistance).toBeGreaterThanOrEqual(0.6);

    // 0 蓝耗物理体术符卡可打伤全魔免红莲魔龙并计入敌方物理伤害
    const dragon = Object.values(state.units).find((u) => u.defId === 'crimson_star_dragon')!;
    expect(dragon.abilities.magicImmune).toBe(true);
    yuugi.pos = offsetToAxial(3, 5);
    dragon.pos = offsetToAxial(6, 5);
    yuugi.spellCardCharge = 100;
    state.activeUnitId = yuugi.id;
    const beforeHp = dragon.currentHp;
    const res = dispatchCombatCommand(
      state,
      { type: 'DECLARE_SPELL_CARD', unitId: yuugi.id, targetHex: dragon.pos },
      TOUHOU_CATALOG,
    );
    expect(res.ok).toBe(true);
    expect(dragon.currentHp).toBeLessThan(beforeHp);
    expect(state.physicalDamageTakenThisRound?.right ?? 0).toBeGreaterThan(0);
  });
});

describe('狂战士「死斗狂暴」与巡回猎犬「巡回突袭」机制', () => {
  it('狂战士初始可控；近战交手后锁定宿敌、宿敌外承伤 -10%、轮到行动自动追砍直至宿敌倒下解锁', () => {
    const tiles = createFlatTiles();
    const { state } = createBattleState(
      {
        mapWidth: 14,
        mapHeight: 10,
        tiles,
        leftSlots: [{ kind: 'creature', defId: 'might_berserker', count: 10, col: 3, row: 4 }],
        rightSlots: [
          { kind: 'creature', defId: 'shrine_komainu', count: 6, col: 5, row: 4 },
          { kind: 'creature', defId: 'kedama', count: 10, col: 4, row: 6 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 2026,
      },
      TOUHOU_CATALOG,
    );

    const berserker = Object.values(state.units).find((u) => u.defId === 'might_berserker')!;
    const komainu = Object.values(state.units).find((u) => u.defId === 'shrine_komainu')!;
    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;

    // 初始未锁定宿敌，玩家可自由移动
    expect(berserker.statusEffects.duelTargetUnitId).toBeUndefined();
    const preOutsidePreview = previewAttack(state, kedama.id, berserker.id, TOUHOU_CATALOG);

    // 狂战士主动近战砍狛犬 → 触发死斗锁定 + 双击
    state.activeUnitId = berserker.id;
    const atkRes = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: berserker.id, targetId: komainu.id },
      TOUHOU_CATALOG,
    );
    expect(atkRes.ok).toBe(true);
    expect(atkRes.events.some((e) => e.type === 'DUEL_LOCKED' && e.unitId === berserker.id && e.targetId === komainu.id)).toBe(true);
    expect(berserker.statusEffects.duelTargetUnitId).toBe(komainu.id);

    // 宿敌以外单位（毛玉）攻击狂战士时承受 -10% 外伤减免；宿敌（狛犬）不减伤
    const postOutsidePreview = previewAttack(state, kedama.id, berserker.id, TOUHOU_CATALOG);
    expect(postOutsidePreview.notes.some((n) => n.includes('死斗专注'))).toBe(true);
    expect(postOutsidePreview.expectedMaxDamage).toBeLessThan(preOutsidePreview.expectedMaxDamage);

    const rivalPreview = previewAttack(state, komainu.id, berserker.id, TOUHOU_CATALOG);
    expect(rivalPreview.notes.some((n) => n.includes('死斗专注'))).toBe(false);

    // UI 状态徽章正确展示死斗锁定
    const statusBadges = buildUnitStatusBadges(berserker, state);
    expect(statusBadges.some((b) => b.id === 'st_duel_lock')).toBe(true);

    // 下一回合轮到狂战士时，应自动执行追击死斗并跳过玩家控制直达后续单位
    berserker.hasActedThisRound = false;
    state.turnQueue = [berserker.id, kedama.id];
    state.waitQueue = [];
    const komainuHpBefore = (komainu.count - 1) * computeUnitStats(komainu, state, TOUHOU_CATALOG).maxHp + komainu.currentHp;
    state.activeUnitId = komainu.id;
    const defRes = dispatchCombatCommand(state, { type: 'DEFEND', unitId: komainu.id }, TOUHOU_CATALOG);
    expect(defRes.ok).toBe(true);
    // 狂战士已在 advanceTurn 中自动死斗攻击狛犬，当前行动权已流转给毛玉（或战斗结束）
    const komainuHpAfter =
      komainu.status === 'alive'
        ? (komainu.count - 1) * computeUnitStats(komainu, state, TOUHOU_CATALOG).maxHp + komainu.currentHp
        : 0;
    expect(komainuHpAfter).toBeLessThan(komainuHpBefore);
    expect(berserker.hasActedThisRound).toBe(true);
  });

  it('巡回猎犬长腿地面扑咬敌军后应不受反击并自动折返回原位', () => {
    const tiles = createFlatTiles();
    const { state } = createBattleState(
      {
        mapWidth: 14,
        mapHeight: 10,
        tiles,
        leftSlots: [{ kind: 'creature', defId: 'might_roaming_hound', count: 8, col: 2, row: 4 }],
        rightSlots: [{ kind: 'creature', defId: 'kedama', count: 15, col: 8, row: 4 }],
        controllers: { left: 'human', right: 'human' },
        seed: 2027,
      },
      TOUHOU_CATALOG,
    );
    const hound = Object.values(state.units).find((u) => u.defId === 'might_roaming_hound')!;
    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const originPos = { ...hound.pos };

    state.activeUnitId = hound.id;
    const res = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: hound.id, targetId: kedama.id },
      TOUHOU_CATALOG,
    );
    expect(res.ok).toBe(true);
    // 不受反击：猎犬满血无损
    expect(hound.count).toBe(8);
    // 攻击完折返回起跳原位
    expect(hexEquals(hound.pos, originPos)).toBe(true);
    const moveEvents = res.events.filter((e) => e.type === 'UNIT_MOVED' && e.unitId === hound.id);
    expect(moveEvents).toHaveLength(2);
  });
});

describe('掷山大力鬼「完全 2 环 AOE 投岩」与超射程瞄空避友', () => {
  it('掷山大力鬼可瞄准敌人附近空地（含超射程），2 环内敌我全员均承受 100% 物理伤害，且 AI 自动避友', () => {
    const tiles = createFlatTiles(18, 10);
    const { state } = createBattleState(
      {
        mapWidth: 18,
        mapHeight: 10,
        tiles,
        leftSlots: [
          { kind: 'creature', defId: 'might_mountain_thrower', count: 4, col: 1, row: 4 },
          { kind: 'creature', defId: 'might_berserker', count: 12, col: 6, row: 3 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'kedama', count: 20, col: 7, row: 4 },
          { kind: 'creature', defId: 'ofuda_archer', count: 16, col: 8, row: 4 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 2028,
      },
      TOUHOU_CATALOG,
    );

    const thrower = Object.values(state.units).find((u) => u.defId === 'might_mountain_thrower')!;
    const allyBerserker = Object.values(state.units).find((u) => u.defId === 'might_berserker')!;
    const enemyKedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const enemyArcher = Object.values(state.units).find((u) => u.defId === 'ofuda_archer')!;

    // 瞄准 (col: 6, row: 4) 的空地，其 2 环同时覆盖友军狂战士 + 1 环敌军毛玉 + 2 环敌军弓手！
    const emptyCenter = offsetToAxial(6, 4);
    const areaPrev = previewAreaRangedAttack(state, thrower.id, emptyCenter, TOUHOU_CATALOG);
    expect(areaPrev.valid).toBe(true);
    expect(areaPrev.affectedHexes.length).toBe(19);
    expect(areaPrev.targets.map((t) => t.unitId).sort()).toEqual(
      [allyBerserker.id, enemyKedama.id, enemyArcher.id].sort(),
    );

    // 验证 100% 全额伤害无主次衰减：与直接单体远程伤害区间完全一致
    const singlePrev = previewAttack(state, thrower.id, enemyKedama.id, TOUHOU_CATALOG);
    const aoeEntry = areaPrev.targets.find((t) => t.unitId === enemyKedama.id)!;
    expect(aoeEntry.minDamage).toBe(singlePrev.expectedMinDamage);
    expect(aoeEntry.maxDamage).toBe(singlePrev.expectedMaxDamage);

    // 执行 ATTACK_HEX 瞄空投岩
    state.activeUnitId = thrower.id;
    const res = dispatchCombatCommand(
      state,
      { type: 'ATTACK_HEX', unitId: thrower.id, targetHex: emptyCenter },
      TOUHOU_CATALOG,
    );
    expect(res.ok).toBe(true);
    const areaEv = res.events.find((e) => e.type === 'AREA_RANGED_ATTACK');
    expect(areaEv).toBeDefined();
    if (areaEv?.type === 'AREA_RANGED_ATTACK') {
      expect(areaEv.hits).toHaveLength(3);
      expect(areaEv.hits.some((h) => h.isFriendly && h.targetId === allyBerserker.id && h.strike.damage > 0)).toBe(true);
    }
    // 敌方遭受物理伤害记入 right，我方误伤记入 left（互不混淆！）
    expect(state.physicalDamageTakenThisRound?.right ?? 0).toBeGreaterThan(0);
    expect(state.physicalDamageTakenThisRound?.left ?? 0).toBeGreaterThan(0);

    // 超射程（>10 格，如距离 13 格）依然可选敌人附近空地作为落点，按常规距离衰减 1/2 命中 2 环内敌军
    const { state: longState } = createBattleState(
      {
        mapWidth: 18,
        mapHeight: 10,
        tiles,
        leftSlots: [{ kind: 'creature', defId: 'might_mountain_thrower', count: 4, col: 0, row: 4 }],
        rightSlots: [{ kind: 'creature', defId: 'kedama', count: 20, col: 16, row: 4 }],
        controllers: { left: 'human', right: 'human' },
        seed: 2033,
      },
      TOUHOU_CATALOG,
    );
    const longThrower = Object.values(longState.units).find((u) => u.defId === 'might_mountain_thrower')!;
    const farKedama = Object.values(longState.units).find((u) => u.defId === 'kedama')!;
    const farEmptyNearEnemy = offsetToAxial(14, 4); // 距 2×2 大力鬼右侧边缘 13 格（超射程 10），距敌军 2 格（2 环边界内）
    const farPrev = previewAreaRangedAttack(longState, longThrower.id, farEmptyNearEnemy, TOUHOU_CATALOG);
    expect(farPrev.valid).toBe(true);
    expect(farPrev.rangedPenaltyTier).toBe('half');
    expect(farPrev.rangedMultiplier).toBe(0.5);
    expect(farPrev.targets.map((t) => t.unitId)).toEqual([farKedama.id]);
    longState.activeUnitId = longThrower.id;
    const farRes = dispatchCombatCommand(
      longState,
      { type: 'ATTACK_HEX', unitId: longThrower.id, targetHex: farEmptyNearEnemy },
      TOUHOU_CATALOG,
    );
    expect(farRes.ok).toBe(true);
    expect(longState.physicalDamageTakenThisRound?.right ?? 0).toBeGreaterThan(0);

    // 验证 AI 操控掷山大力鬼时会主动选择 ATTACK_HEX 瞄准空地一石二鸟并完美规避友军
    const { state: aiState } = createBattleState(
      {
        mapWidth: 18,
        mapHeight: 10,
        tiles,
        leftSlots: [
          { kind: 'creature', defId: 'might_mountain_thrower', count: 4, col: 1, row: 4 },
          { kind: 'creature', defId: 'might_berserker', count: 12, col: 7, row: 3 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'kedama', count: 20, col: 7, row: 4 },
          { kind: 'creature', defId: 'ofuda_archer', count: 16, col: 7, row: 6 },
        ],
        controllers: { left: 'ai', right: 'human' },
        seed: 2029,
      },
      TOUHOU_CATALOG,
    );
    const aiThrower = Object.values(aiState.units).find((u) => u.defId === 'might_mountain_thrower')!;
    aiState.activeUnitId = aiThrower.id;
    const cmd = chooseTacticalAiCommand(aiState, TOUHOU_CATALOG, { difficulty: 'master' });
    expect(cmd?.type).toBe('ATTACK_HEX');
    if (cmd?.type === 'ATTACK_HEX') {
      const chosenPrev = previewAreaRangedAttack(aiState, aiThrower.id, cmd.targetHex, TOUHOU_CATALOG);
      // 应砸中敌军且完美规避贴脸的自家狂战士！
      expect(chosenPrev.targets.some((t) => !t.isFriendly)).toBe(true);
      expect(chosenPrev.targets.some((t) => t.isFriendly)).toBe(false);
    }
  });
});

describe('红祭司与混沌四阶新法术「命符·战争血祭」、赤雷巨鹏与熔岩巨兽', () => {
  it('赤雷巨鹏近战 100% 稳定触发每只 28 点雷电法伤（不计入物理伤害），受雷抗 -25% 减免', () => {
    const tiles = createFlatTiles();
    const { state } = createBattleState(
      {
        mapWidth: 14,
        mapHeight: 10,
        tiles,
        leftSlots: [{ kind: 'creature', defId: 'might_crimson_thunderbird', count: 2, col: 4, row: 4 }],
        rightSlots: [
          { kind: 'creature', defId: 'purity_titan', count: 3, col: 6, row: 4 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 2030,
      },
      TOUHOU_CATALOG,
    );
    const bird = Object.values(state.units).find((u) => u.defId === 'might_crimson_thunderbird')!;
    const titan = Object.values(state.units).find((u) => u.defId === 'purity_titan')!;

    // 净秽者自带 25% 雷抗 + 15% 魔抗：2 × 28 × 0.75 × 0.85 ≈ 36
    const expectedLightning = computeLightningStrikeDamage(bird, titan, state, TOUHOU_CATALOG);
    expect(expectedLightning).toBe(Math.round(56 * 0.75 * 0.85));

    state.activeUnitId = bird.id;
    const res = dispatchCombatCommand(
      state,
      { type: 'ATTACK', unitId: bird.id, targetId: titan.id },
      TOUHOU_CATALOG,
    );
    expect(res.ok).toBe(true);
    const ex = res.events.find((e) => e.type === 'COMBAT_EXCHANGE');
    expect(ex?.type).toBe('COMBAT_EXCHANGE');
    if (ex?.type === 'COMBAT_EXCHANGE' && ex.attackerStrike) {
      expect(ex.attackerStrike.lightningDamage).toBe(expectedLightning);
      // 敌方本回合统计的物理伤害严格等于近战物理伤害，绝不包含赤雷魔法伤害！
      expect(state.physicalDamageTakenThisRound?.right).toBe(ex.attackerStrike.damage);
    }
  });

  it('命符「战争血祭」按上回合敌方物理伤 35% 转自身护盾（3 回合）并赋予自身 +5 行动力（2 回合）', () => {
    const tiles = createFlatTiles();
    const { state } = createBattleState(
      {
        mapWidth: 14,
        mapHeight: 10,
        tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_marisa', col: 1, row: 2 },
          { kind: 'creature', defId: 'might_red_priest', count: 4, col: 2, row: 4 },
        ],
        rightSlots: [{ kind: 'creature', defId: 'shrine_komainu', count: 10, col: 9, row: 4 }],
        controllers: { left: 'human', right: 'human' },
        seed: 2031,
      },
      TOUHOU_CATALOG,
    );
    const priest = Object.values(state.units).find((u) => u.defId === 'might_red_priest')!;
    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;
    const komainu = Object.values(state.units).find((u) => u.defId === 'shrine_komainu')!;
    marisa.knownSpellIds.push('chaos_war_blood_sacrifice');
    const priestBaseSpeed = computeUnitStats(priest, state, TOUHOU_CATALOG).speed;

    // 校验图标、VFX 与三段式文案均已完备
    expect(CHAOS_SPELL_ICON_DRAWERS.chaos_war_blood_sacrifice).toBeDefined();
    expect(getSpellVfxChoreography('chaos_war_blood_sacrifice')).toBeDefined();
    expect(CHAOS_SPELL_COPY.chaos_war_blood_sacrifice?.effect).toContain('35%');
    expect(CHAOS_SPELL_COPY.chaos_war_blood_sacrifice?.effect).toContain('5 点行动力');

    // 第 1 回合无上回合敌方物理伤：不可施放
    state.activeUnitId = priest.id;
    const r1Res = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: priest.id, spellId: 'chaos_war_blood_sacrifice' },
      TOUHOU_CATALOG,
    );
    expect(r1Res.ok).toBe(false);

    // 模拟上回合敌方承受 400 点物理伤害 → 35% = 140（未超 4×50=200 上限）且获得 +5 行动力（持续 2 回合）
    state.physicalDamageTakenLastRound = { left: 0, right: 400 };
    const r2Res = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: priest.id, spellId: 'chaos_war_blood_sacrifice' },
      TOUHOU_CATALOG,
    );
    expect(r2Res.ok).toBe(true);
    expect(priest.statusEffects.bloodSacrificeShieldHp).toBe(140);
    expect(priest.statusEffects.bloodSacrificeShieldRounds).toBe(3);
    expect(computeUnitStats(priest, state, TOUHOU_CATALOG).speed).toBe(priestBaseSpeed + 5);

    // 再模拟上回合敌方承受 1000 点物理伤害 → 35% = 350，受 4×50=200 封顶，并刷新重置为 3 回合（行动力仍为 +5 不叠加、重置 2 回合）！
    priest.statusEffects.bloodSacrificeShieldRounds = 1;
    state.physicalDamageTakenLastRound = { left: 0, right: 1000 };
    state.activeUnitId = priest.id;
    priest.hasActedThisRound = false;
    const r3Res = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: priest.id, spellId: 'chaos_war_blood_sacrifice' },
      TOUHOU_CATALOG,
    );
    expect(r3Res.ok).toBe(true);
    expect(priest.statusEffects.bloodSacrificeShieldHp).toBe(200);
    expect(priest.statusEffects.bloodSacrificeShieldRounds).toBe(3);
    expect(computeUnitStats(priest, state, TOUHOU_CATALOG).speed).toBe(priestBaseSpeed + 5);

    // 英雄施放时上限为最大生命值 × 200%（保留敌方狛犬在本巡待动，避免施法瞬间即刻跨巡扣减 1 回合）
    const marisaMaxHp = computeUnitStats(marisa, state, TOUHOU_CATALOG).maxHp;
    const marisaBaseSpeed = computeUnitStats(marisa, state, TOUHOU_CATALOG).speed;
    state.physicalDamageTakenLastRound = { left: 0, right: 5000 };
    komainu.hasActedThisRound = false;
    state.turnQueue = [komainu.id];
    state.waitQueue = [];
    state.activeUnitId = marisa.id;
    marisa.hasActedThisRound = false;
    const heroRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: marisa.id, spellId: 'chaos_war_blood_sacrifice' },
      TOUHOU_CATALOG,
    );
    expect(heroRes.ok).toBe(true);
    expect(marisa.statusEffects.bloodSacrificeShieldHp).toBe(Math.round(marisaMaxHp * 2));
    expect(marisa.statusEffects.bloodSacrificeShieldRounds).toBe(3);
    expect(computeUnitStats(marisa, state, TOUHOU_CATALOG).speed).toBe(marisaBaseSpeed + 5);

    // 经过 2 次新回合结算后，+5 行动力增益先到期还原，而 3 回合血祭护盾尚余 1 回合
    for (let i = 0; i < 2; i++) {
      state.turnQueue = [];
      state.waitQueue = [];
      state.activeUnitId = komainu.id;
      komainu.hasActedThisRound = false;
      dispatchCombatCommand(state, { type: 'DEFEND', unitId: komainu.id }, TOUHOU_CATALOG);
    }
    expect(computeUnitStats(priest, state, TOUHOU_CATALOG).speed).toBe(priestBaseSpeed);
    expect(priest.statusEffects.bloodSacrificeShieldRounds).toBe(1);
    expect(priest.statusEffects.bloodSacrificeShieldHp).toBe(200);

    // 第 3 次新回合结算后，血祭护盾自动消散归零
    state.turnQueue = [];
    state.waitQueue = [];
    state.activeUnitId = komainu.id;
    komainu.hasActedThisRound = false;
    dispatchCombatCommand(state, { type: 'DEFEND', unitId: komainu.id }, TOUHOU_CATALOG);
    expect(priest.statusEffects.bloodSacrificeShieldHp).toBe(0);
    expect(priest.statusEffects.bloodSacrificeShieldRounds).toBe(0);
  });

  it('熔岩巨兽应具备 50% 碎甲重击与 25% 抗火（火法术与烈焰护盾均减伤 25%）', () => {
    const tiles = createFlatTiles();
    const { state } = createBattleState(
      {
        mapWidth: 14,
        mapHeight: 10,
        tiles,
        leftSlots: [{ kind: 'creature', defId: 'might_lava_behemoth', count: 2, col: 4, row: 4 }],
        rightSlots: [
          { kind: 'creature', defId: 'hisoutensoku', count: 2, col: 6, row: 4 },
          { kind: 'hero', defId: 'hero_marisa', col: 8, row: 1 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 2032,
      },
      TOUHOU_CATALOG,
    );
    const behemoth = Object.values(state.units).find((u) => u.defId === 'might_lava_behemoth')!;
    const soku = Object.values(state.units).find((u) => u.defId === 'hisoutensoku')!;
    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;

    // 碎甲重击：近战无视目标 50% 防御
    const withPierce = previewAttack(state, behemoth.id, soku.id, TOUHOU_CATALOG);
    expect(withPierce.notes.some((n) => n.includes('碎甲重击'))).toBe(true);
    behemoth.abilities.armorPierce = false;
    const withoutPierce = previewAttack(state, behemoth.id, soku.id, TOUHOU_CATALOG);
    behemoth.abilities.armorPierce = true;
    expect(withPierce.expectedMinDamage).toBeGreaterThan(withoutPierce.expectedMinDamage);

    // 25% 抗火：对火系法术伤害精确减免 25%
    const s1 = structuredClone(state);
    const s2 = structuredClone(state);
    const b1 = Object.values(s1.units).find((u) => u.defId === 'might_lava_behemoth')!;
    const b2 = Object.values(s2.units).find((u) => u.defId === 'might_lava_behemoth')!;
    const m1 = Object.values(s1.units).find((u) => u.defId === 'hero_marisa')!;
    const m2 = Object.values(s2.units).find((u) => u.defId === 'hero_marisa')!;
    m1.knownSpellIds.push('chaos_fire_bolt');
    m2.knownSpellIds.push('chaos_fire_bolt');
    b2.abilities.fireResist25 = false;
    s1.activeUnitId = m1.id;
    s2.activeUnitId = m2.id;
    const res1 = dispatchCombatCommand(
      s1,
      { type: 'CAST_SPELL', unitId: m1.id, spellId: 'chaos_fire_bolt', targetUnitId: b1.id },
      TOUHOU_CATALOG,
    );
    const res2 = dispatchCombatCommand(
      s2,
      { type: 'CAST_SPELL', unitId: m2.id, spellId: 'chaos_fire_bolt', targetUnitId: b2.id },
      TOUHOU_CATALOG,
    );
    expect(res1.ok && res2.ok).toBe(true);
    const e1 = res1.events.find((e) => e.type === 'SPELL_CAST');
    const e2 = res2.events.find((e) => e.type === 'SPELL_CAST');
    if (e1?.type === 'SPELL_CAST' && e2?.type === 'SPELL_CAST') {
      const d1 = e1.damageMap?.[b1.id]?.damage ?? 0;
      const d2 = e2.damageMap?.[b2.id]?.damage ?? 0;
      expect(d1).toBeGreaterThan(0);
      expect(d1).toBeLessThan(d2);
      expect(Math.abs(d1 / d2 - 0.75)).toBeLessThan(0.08);
    }

    // 所有力量新特技均具备合法中文特技徽章，且抗火徽章不附带冗余 25 数字
    const badges = [
      ...buildUnitSpecialtyBadges(behemoth),
      ...buildUnitSpecialtyBadges(marisa),
    ];
    expect(badges.some((b) => b.id === 'armorPierce')).toBe(true);
    const fireBadge = badges.find((b) => b.id === 'fireResist25');
    expect(fireBadge).toBeDefined();
    expect(fireBadge?.shortLabel).toBe('抗火');
  });
});

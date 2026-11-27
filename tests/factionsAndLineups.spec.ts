/**
 * 《Touhou-H4》四大阵营编队、兵种专属特技与战术 AI 收敛测试套件
 * 覆盖：博丽生命(8兵)、魔法使混沌(8兵)、幻月庭园秩序(8兵 + 八意永琳)、幽冥公馆死亡(8兵 + 深渊冰魔 + 蕾米莉亚)，
 * 包含 7v7 A/B 阵型零重叠合法落位、全套兵种特技实装与双 AI 完整对局收敛校验。
 */

import { describe, expect, it } from 'vitest';
import { chooseTacticalAiCommand } from '@ai/tacticalAi';
import {
  computeStoneGazeCreatureKills,
  computeStoneGazeHeroDamage,
  computeStoneGazeThreshold,
  createBattleState,
  dispatchCombatCommand,
  getUnitOccupiedHexes,
  getUnitReachableMap,
  previewAttack,
  STONE_GAZE_THRESHOLD_PER_UNIT,
  STONE_GAZE_TRIGGER_CHANCE,
} from '@core/combatEngine';
import { isDarkMagicVulnerable } from '@core/creatureTypes';
import { hexDistance, hexKey, offsetToAxial } from '@core/hex';
import { computeUnitStats, getUnitEffectiveMagicResistance, isStealthDeepened } from '@core/modifiers';
import { createReimuVsMarisaBattle, TOUHOU_CATALOG } from '@data/battlePresets';
import { buildShrineNightBattleMap } from '@data/definitions';
import { buildUnitSpecialtyBadges, buildUnitStatusBadges } from '@ui/hudMetadata';
import { getUnitHeaderCreatureTags } from '@ui/semanticFormat';
import { clearRowToPlain, flattenAllMapTiles, runAiBattleToFinish } from './helpers/testUtils';

describe('博丽生命(8兵) vs 魔法使混沌(8兵) 7v7 双编队与全套 H4 特技实装', () => {
  it('战术 AI 完整对局推演应确定性收敛并分出胜负', () => {
    const { state } = createReimuVsMarisaBattle({ mode: 'vs_ai', seed: 999 });
    state.controllers = { left: 'ai', right: 'ai' };

    runAiBattleToFinish(state, 260);

    expect(state.phase).toBe('finished');
    expect(state.winner === 'left' || state.winner === 'right').toBe(true);
  });

  it('A 阵与 B 阵均应为纯阵营 7v7 满编、零重叠合法落位、覆盖全部 16 兵种且 AI 推演收敛', () => {
    const seenDefIds = new Set<string>();

    for (const variant of ['A', 'B'] as const) {
      const { state } = createReimuVsMarisaBattle({
        mode: 'vs_ai',
        lineupVariant: variant,
        seed: 300 + variant.charCodeAt(0),
      });
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
        runAiBattleToFinish(state, 320);
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
    // 敌军近战攻击近战禁手单位时，近战禁手单位仍会触发近战反击（并承受 -60% 射手近战衰减）！
    const impMeleeTurret = previewAttack(state, imp.id, turret.id, TOUHOU_CATALOG);
    expect(impMeleeTurret.valid).toBe(true);
    expect(impMeleeTurret.isRanged).toBe(false);
    expect(impMeleeTurret.willRetaliate).toBe(true);
    expect(impMeleeTurret.retaliationMaxDamage).toBeGreaterThan(0);

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

  it('魔导书无限弹药显示无数字、御札弓手远程先攻双端生效（且不越界至近战）、博丽毛玉具备无限反击', () => {
    const map = buildShrineNightBattleMap();
    // 清理测试走廊障碍，确保远程互射直线畅通
    flattenAllMapTiles(map.tiles);
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

  it('禁忌之书暗系特质生效；魔法使具备施法与 4 MP 上限，魔导星矢无抗性伤害严格等于满额远程最高值', () => {
    const map = buildShrineNightBattleMap();
    flattenAllMapTiles(map.tiles);
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
});

describe('幻月庭园·秩序阵营与幽冥公馆·死亡阵营编队及专属特技', () => {
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
    clearRowToPlain(map.tiles, 12, 2, 11);
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
      expect(
        aiBattle.phase,
        `[${variant}] round=${aiBattle.round} alive=${Object.values(aiBattle.units)
          .filter((u) => u.status === 'alive')
          .map((u) => `${u.side}:${u.name}x${u.count}(hp${u.currentHp},mp${u.mana},pos${u.pos.q},${u.pos.r})`)
          .join('|')} logs=${aiBattle.actionLog.slice(-10).join(' // ')}`,
      ).toBe('finished');
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

  it('退魔剑士与净邪巫女攻防下调 1 点，全非英雄单位魔抗严格遵循特例表与 5% 默认值且支持负魔抗', () => {
    // 1. 退魔剑士与净邪巫女基础攻防及全阵营最新平衡数值校验
    expect(TOUHOU_CATALOG.creatures.exorcist_blade.baseStats.attack).toBe(20);
    expect(TOUHOU_CATALOG.creatures.exorcist_blade.baseStats.defense).toBe(20);
    expect(TOUHOU_CATALOG.creatures.prayer_maiden.baseStats.attack).toBe(19);
    expect(TOUHOU_CATALOG.creatures.prayer_maiden.baseStats.defense).toBe(18);
    expect(TOUHOU_CATALOG.creatures.onbashira_steed.baseStats.minDamage).toBe(26);
    expect(TOUHOU_CATALOG.creatures.onbashira_steed.baseStats.maxDamage).toBe(35);
    expect(TOUHOU_CATALOG.creatures.hakurei_seraph.baseStats.maxHp).toBe(245);
    expect(TOUHOU_CATALOG.creatures.crimson_star_dragon.baseStats.maxHp).toBe(400);
    expect(TOUHOU_CATALOG.creatures.crimson_star_dragon.baseStats.attack).toBe(36);
    expect(TOUHOU_CATALOG.creatures.crimson_star_dragon.baseStats.speed).toBe(11);
    expect(TOUHOU_CATALOG.creatures.arcane_colossus.baseStats.defense).toBe(26);
    expect(TOUHOU_CATALOG.creatures.arcane_colossus.baseStats.minDamage).toBe(32);
    expect(TOUHOU_CATALOG.creatures.arcane_colossus.baseStats.maxDamage).toBe(49);
    expect(TOUHOU_CATALOG.creatures.arcane_colossus.baseStats.magicResistance).toBeCloseTo(0.35, 4);
    expect(TOUHOU_CATALOG.creatures.bone_dragon.baseStats.maxHp).toBe(275);
    expect(TOUHOU_CATALOG.creatures.abyss_gap_devil.baseStats.maxHp).toBe(215);
    expect(TOUHOU_CATALOG.creatures.combat_mk2.baseStats.maxHp).toBe(95);
    expect(TOUHOU_CATALOG.creatures.purity_titan.baseStats.maxHp).toBe(225);
    expect(TOUHOU_CATALOG.creatures.purity_titan.baseStats.attack).toBe(24);
    expect(TOUHOU_CATALOG.creatures.forest_shadow_imp.baseStats.speed).toBe(9);
    expect(TOUHOU_CATALOG.creatures.lunar_genie.baseStats.defense).toBe(14);
    expect(TOUHOU_CATALOG.creatures.ofuda_archer.baseStats.defense).toBe(9);
    expect(TOUHOU_CATALOG.creatures.yinyang_turret.baseStats.defense).toBe(12);
    expect(TOUHOU_CATALOG.creatures.yinyang_turret.baseStats.attack).toBe(15);
    expect(TOUHOU_CATALOG.creatures.hakurei_seraph.baseStats.minDamage).toBe(35);
    expect(TOUHOU_CATALOG.creatures.hakurei_seraph.baseStats.maxDamage).toBe(56);
    expect(TOUHOU_CATALOG.creatures.wraith_spirit.baseStats.defense).toBe(15);
    expect(TOUHOU_CATALOG.creatures.hell_raven.baseStats.maxHp).toBe(37);
    expect(TOUHOU_CATALOG.creatures.hell_raven.baseStats.defense).toBe(13);
    expect(TOUHOU_CATALOG.creatures.hell_raven.baseStats.minDamage).toBe(8);
    expect(TOUHOU_CATALOG.creatures.hell_raven.baseStats.maxDamage).toBe(11);
    expect(TOUHOU_CATALOG.heroes.hero_marisa.initialSkills.chaos_magic).toBe(5);
    expect(TOUHOU_CATALOG.heroes.hero_marisa.knownSpellIds).toContain('chaos_chain_lightning');
    expect(TOUHOU_CATALOG.heroes.hero_marisa.knownSpellIds).toContain('chaos_disintegrate');
    expect(TOUHOU_CATALOG.heroes.hero_marisa.knownSpellIds).toContain('chaos_armageddon');

    // 2. 全量非英雄单位（含四大阵营、中立储备与全部召唤模板）魔抗基线严格校验
    const specialMr: Record<string, number> = {
      youkai_rabbit: 0.3,
      armored_lunar_guard: 0.5,
      purity_titan: 0.15,
      combat_mk2: 0.1,
      crimson_star_dragon: 1,
      corpse_husk: -0.05,
      wraith_spirit: -0.05,
      hakurei_seraph: 0.15,
      hourai_doll: 0.1,
      arcane_colossus: 0.35,
      might_red_priest: 0.3,
    };

    for (const [id, def] of Object.entries(TOUHOU_CATALOG.creatures)) {
      const expected = specialMr[id] ?? 0.05;
      expect(def.baseStats.magicResistance, `兵种 ${id} (${def.name}) 魔抗不符`).toBeCloseTo(expected, 4);
    }

    // 3. 运行时负魔抗生效校验：尸壳与怨灵 computeUnitStats 保持 -0.05（不被误截断为 0），受直接魔伤多 +5%
    const map = buildShrineNightBattleMap();
    for (const t of Object.values(map.tiles)) {
      t.terrain = 'plain';
      t.elevation = 1;
    }
    const { state } = createBattleState(
      {
        battleId: 'test_negative_magic_resistance',
        seed: 20261128,
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'hero', defId: 'hero_marisa', col: 5, row: 10 }],
        rightSlots: [
          { kind: 'creature', defId: 'corpse_husk', count: 30, col: 8, row: 10 },
          { kind: 'creature', defId: 'wraith_spirit', count: 20, col: 8, row: 12 },
          { kind: 'creature', defId: 'kedama', count: 30, col: 8, row: 8 },
        ],
        controllers: { left: 'human', right: 'human' },
      },
      TOUHOU_CATALOG,
    );

    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;
    const husk = Object.values(state.units).find((u) => u.defId === 'corpse_husk')!;
    const wraith = Object.values(state.units).find((u) => u.defId === 'wraith_spirit')!;
    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;

    expect(computeUnitStats(husk, state, TOUHOU_CATALOG).magicResistance).toBeCloseTo(-0.05, 4);
    expect(computeUnitStats(wraith, state, TOUHOU_CATALOG).magicResistance).toBeCloseTo(-0.05, 4);
    expect(computeUnitStats(kedama, state, TOUHOU_CATALOG).magicResistance).toBeCloseTo(0.05, 4);

    // 对尸壳（-5% 魔抗）与毛玉（+5% 魔抗）分别施放同一发魔法矢，验证尸壳承受更高法伤
    const stateA = structuredClone(state);
    const stateB = structuredClone(state);
    stateA.activeUnitId = marisa.id;
    stateB.activeUnitId = marisa.id;
    stateA.units[marisa.id].mana = 50;
    stateB.units[marisa.id].mana = 50;

    const castHusk = dispatchCombatCommand(
      stateA,
      { type: 'CAST_SPELL', unitId: marisa.id, spellId: 'chaos_magic_arrow', targetUnitId: husk.id },
      TOUHOU_CATALOG,
    );
    const castKedama = dispatchCombatCommand(
      stateB,
      { type: 'CAST_SPELL', unitId: marisa.id, spellId: 'chaos_magic_arrow', targetUnitId: kedama.id },
      TOUHOU_CATALOG,
    );
    expect(castHusk.ok, castHusk.error).toBe(true);
    expect(castKedama.ok, castKedama.error).toBe(true);

    const evHusk = castHusk.events.find((e) => e.type === 'SPELL_CAST');
    const evKedama = castKedama.events.find((e) => e.type === 'SPELL_CAST');
    const dmgHusk = evHusk && evHusk.type === 'SPELL_CAST' ? evHusk.damageMap?.[husk.id]?.damage ?? 0 : 0;
    const dmgKedama = evKedama && evKedama.type === 'SPELL_CAST' ? evKedama.damageMap?.[kedama.id]?.damage ?? 0 : 0;
    expect(dmgHusk).toBeGreaterThan(dmgKedama);
    // 4. 潜行深潜规则校验：周围 6 格内无存活敌军时，影遁潜行擦弹与远程减伤均额外获得一倍效果（+32% 擦弹 / 远程 -30%）
    const { state: stealthState } = createBattleState(
      {
        battleId: 'test_stealth_deepened_6_hex',
        seed: 20261129,
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'creature', defId: 'forest_shadow_imp', count: 20, col: 4, row: 10 }],
        rightSlots: [{ kind: 'creature', defId: 'ofuda_archer', count: 20, col: 11, row: 10 }],
        controllers: { left: 'human', right: 'human' },
      },
      TOUHOU_CATALOG,
    );
    const imp = Object.values(stealthState.units).find((u) => u.defId === 'forest_shadow_imp')!;
    const archer = Object.values(stealthState.units).find((u) => u.defId === 'ofuda_archer')!;

    // 距离 7 格（>6）：触发深潜×2（基础 16% + 潜行 32% = 48% 擦弹，远程减伤 -30%）
    expect(hexDistance(imp.pos, archer.pos)).toBe(7);
    expect(isStealthDeepened(imp, stealthState)).toBe(true);
    expect(computeUnitStats(imp, stealthState, TOUHOU_CATALOG).grazeChance).toBeCloseTo(0.48, 3);
    expect(buildUnitStatusBadges(imp, stealthState).some((b) => b.id === 'status_stealth_deepened')).toBe(true);
    const deepPrev = previewAttack(stealthState, archer.id, imp.id, TOUHOU_CATALOG);
    expect(deepPrev.notes.some((n) => n.includes('影遁深潜(-30%)'))).toBe(true);

    // 敌军拉近到距离 6 格（<=6）：退回基础潜行（基础 16% + 潜行 16% = 32% 擦弹，远程减伤 -15%）
    archer.pos = offsetToAxial(10, 10);
    expect(hexDistance(imp.pos, archer.pos)).toBe(6);
    expect(isStealthDeepened(imp, stealthState)).toBe(false);
    expect(computeUnitStats(imp, stealthState, TOUHOU_CATALOG).grazeChance).toBeCloseTo(0.32, 3);
    expect(buildUnitStatusBadges(imp, stealthState).some((b) => b.id === 'status_stealth_deepened')).toBe(false);
    const nearPrev = previewAttack(stealthState, archer.id, imp.id, TOUHOU_CATALOG);
    expect(nearPrev.notes.some((n) => n.includes('影遁减伤(-15%)'))).toBe(true);
    expect(deepPrev.expectedMaxDamage).toBeLessThan(nearPrev.expectedMaxDamage);

    // 5. 禁忌之书「魔眼石化」按数量×12 生命阈值、35% 概率与英雄魔抗折算伤害精准校验
    expect(STONE_GAZE_TRIGGER_CHANCE).toBeCloseTo(0.35, 4);
    expect(STONE_GAZE_THRESHOLD_PER_UNIT).toBe(12);
    expect(computeStoneGazeThreshold(10)).toBe(120);
    // 首兵血量 121 > 120：无法触发；首兵血量 120：抹杀 1 名；每只 20 血：精确抹杀 6 名
    expect(computeStoneGazeCreatureKills(121, 180, 5, 120)).toBe(0);
    expect(computeStoneGazeCreatureKills(120, 180, 5, 120)).toBe(1);
    expect(computeStoneGazeCreatureKills(20, 20, 10, 120)).toBe(6);
    expect(computeStoneGazeHeroDamage(120, 0.25)).toBe(90);
    expect(computeStoneGazeHeroDamage(120, 0.5)).toBe(60);

    // 实战连射抽样验证：10 本禁忌之书射向 20 血活体小兵（命中后触发石化抹杀 6 名）、射向 >120 血首兵（0 触发）、射向英雄（精确 120×(1-魔抗)）
    let smallTriggerCount = 0;
    let smallExactSixKills = false;
    let tankTriggerCount = 0;
    let heroTriggerCount = 0;
    for (let i = 0; i < 60; i += 1) {
      const { state: sgState } = createBattleState(
        {
          battleId: `test_stone_gaze_${i}`,
          seed: 50000 + i * 37,
          mapWidth: map.width,
          mapHeight: map.height,
          tiles: map.tiles,
          leftSlots: [{ kind: 'creature', defId: 'grimoire_familiar', count: 10, col: 4, row: 10 }],
          rightSlots: [
            { kind: 'creature', defId: 'kedama', count: 30, col: 8, row: 10 },
            { kind: 'creature', defId: 'onbashira_steed', count: 5, col: 8, row: 12 },
            { kind: 'hero', defId: 'hero_reimu', col: 8, row: 8 },
          ],
          controllers: { left: 'human', right: 'human' },
        },
        TOUHOU_CATALOG,
      );
      const book = Object.values(sgState.units).find((u) => u.defId === 'grimoire_familiar')!;
      const smallTarget = Object.values(sgState.units).find((u) => u.defId === 'kedama')!;
      const tankTarget = Object.values(sgState.units).find((u) => u.defId === 'onbashira_steed')!;
      const heroTarget = Object.values(sgState.units).find((u) => u.defId === 'hero_reimu')!;
      // 设定小兵单兵 20 HP、极高防御确保普攻不至于清完堆叠且方便核对阈值抹杀
      smallTarget.baseStats.maxHp = 20;
      smallTarget.currentHp = 20;
      smallTarget.baseStats.defense = 200;
      smallTarget.baseStats.grazeChance = 0;
      // 设定肉盾单兵 400 HP（挨一发后首兵血量仍远 > 120）
      tankTarget.baseStats.maxHp = 400;
      tankTarget.currentHp = 400;
      tankTarget.baseStats.defense = 200;
      tankTarget.baseStats.grazeChance = 0;
      // 英雄留足血量验证 120 - 120×魔抗
      heroTarget.baseStats.maxHp = 800;
      heroTarget.currentHp = 800;
      heroTarget.baseStats.grazeChance = 0;

      // 1) 20 HP 活体兵种
      sgState.activeUnitId = book.id;
      const rSmall = dispatchCombatCommand(
        sgState,
        { type: 'ATTACK', unitId: book.id, targetId: smallTarget.id },
        TOUHOU_CATALOG,
      );
      const exSmall = rSmall.events.find((e) => e.type === 'COMBAT_EXCHANGE');
      if (exSmall?.type === 'COMBAT_EXCHANGE' && exSmall.attackerStrike?.petrifyKills) {
        smallTriggerCount += 1;
        // 普攻打残首兵后剩余首兵血量 <= 20，阈值 120 至少抹杀 6 名（残血首兵+5名满血，若首兵恰好 20 也是 6 名）
        if (exSmall.attackerStrike.petrifyKills === 6) {
          smallExactSixKills = true;
        }
      }

      // 2) 首兵残血仍 > 120 HP 的重装目标：绝不触发石化
      book.hasActedThisRound = false;
      sgState.activeUnitId = book.id;
      const rTank = dispatchCombatCommand(
        sgState,
        { type: 'ATTACK', unitId: book.id, targetId: tankTarget.id },
        TOUHOU_CATALOG,
      );
      const exTank = rTank.events.find((e) => e.type === 'COMBAT_EXCHANGE');
      if (exTank?.type === 'COMBAT_EXCHANGE' && exTank.attackerStrike?.petrifyKills) {
        tankTriggerCount += 1;
      }

      // 3) 英雄目标：触发时伤害严格等于 round(120 - 120 * 魔抗)
      book.hasActedThisRound = false;
      sgState.activeUnitId = book.id;
      const heroMr = getUnitEffectiveMagicResistance(heroTarget, sgState, TOUHOU_CATALOG);
      const expectedHeroPetrify = Math.round(120 - 120 * heroMr);
      const rHero = dispatchCombatCommand(
        sgState,
        { type: 'ATTACK', unitId: book.id, targetId: heroTarget.id },
        TOUHOU_CATALOG,
      );
      const exHero = rHero.events.find((e) => e.type === 'COMBAT_EXCHANGE');
      if (exHero?.type === 'COMBAT_EXCHANGE' && exHero.attackerStrike?.petrifyDamage) {
        heroTriggerCount += 1;
        expect(exHero.attackerStrike.petrifyDamage).toBe(expectedHeroPetrify);
      }
    }
    expect(smallTriggerCount).toBeGreaterThanOrEqual(8);
    expect(smallTriggerCount).toBeLessThanOrEqual(36);
    expect(smallExactSixKills).toBe(true);
    expect(tankTriggerCount).toBe(0);
    expect(heroTriggerCount).toBeGreaterThanOrEqual(8);
  });
});

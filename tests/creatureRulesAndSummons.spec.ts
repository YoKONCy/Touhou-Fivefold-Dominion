/**
 * 《Touhou-H4》生物生态规则、召唤招魂幻象与士气幸运测试套件
 * 覆盖：正统士气梯队与增减伤、双向幸运/厄运、五大生物类型免疫矩阵、东方暗系规则、
 * 死亡招魂残骸生命池拆分、镜像/幻象复制门槛校验与召唤物三分类血条主题映射。
 */

import { describe, expect, it } from 'vitest';
import {
  allocateHpPoolToStack,
  computeMoraleLuckRates,
  createBattleState,
  dispatchCombatCommand,
  evaluateIllusionSpell,
  findCorpseTargetAtHex,
  getAvailableCorpseHp,
  getEffectiveSpellRange,
  getUnitReachableMap,
  previewAttack,
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
import { hexKey, offsetToAxial } from '@core/hex';
import { computeUnitStats } from '@core/modifiers';
import { resolveUnitSummonKind } from '@core/types';
import { createReimuVsMarisaBattle, TOUHOU_CATALOG } from '@data/battlePresets';
import { buildShrineNightBattleMap } from '@data/definitions';
import { ALL_H4_SPELL_IDS } from '@data/h4Spells';
import { buildUnitSpecialtyBadges } from '@ui/hudMetadata';
import { getUnitHeaderCreatureTags, SUMMON_KIND_HP_THEME } from '@ui/semanticFormat';
import { buildBattleOverlayHints } from '@ui/store/overlayHints';
import { computeHoverSpellContext } from '@ui/store/targeting';
import { castSpellAsUnit, clearMapObstacles } from './helpers/testUtils';

describe('士气、双向幸运与厄运核心机制', () => {
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
});

describe('HoMM4 五大生物类型与东方暗系规则', () => {
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

    // 召唤一个退魔剑士幻象分身（本测试沙盒内临时赋予秩序幻象术）
    state.activeUnitId = reimu.id;
    reimu.mana = 200;
    reimu.skills.order_magic = 5;
    reimu.knownSpellIds = [...ALL_H4_SPELL_IDS];
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
    const castAsReimu = (spellId: string, targetUnitId: string) =>
      castSpellAsUnit(state, reimu, { spellId, targetUnitId });
    // 清空场上高耸地形柱以免干扰施法视线校验
    clearMapObstacles(state.tiles, { includePartialLos: true, resetMoveCost: true });
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
    clearMapObstacles(state.tiles, { includePartialLos: true, flattenAllElevation: 1, resetMoveCost: true });
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
});

describe('召唤、招魂残骸池、镜像幻象与召唤物三分类体系', () => {
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

    const castAsRemilia = (spellId: string, targetUnitId: string) =>
      castSpellAsUnit(state, remilia, { spellId, targetUnitId });

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
    const expectedGhost = allocateHpPoolToStack(90, TOUHOU_CATALOG.creatures.wraith_spirit.baseStats.maxHp);
    expect(raisedGhost.count).toBe(expectedGhost.count);
    expect(raisedGhost.currentHp).toBe(expectedGhost.currentHp);

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
    clearMapObstacles(map.tiles);
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
    // 目标仅 1 只非想天则，85% 生命上限内必为残血非想天则幻象
    const titanMaxHp = TOUHOU_CATALOG.creatures.hisoutensoku.baseStats.maxHp;
    expect(titanClone.currentHp).toBeLessThan(titanMaxHp);
    expect(titanClone.currentHp).toBeLessThanOrEqual(Math.floor(titanMaxHp * 0.85));

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

    // 给灵梦充足法力与跨系召唤/招魂测试法术，并击倒敌方毛玉留出残骸、同时令友方尸壳阵亡测试原地复生
    reimu.mana = 120;
    reimu.skills = { ...reimu.skills, order_magic: 5, death_magic: 5, nature_magic: 5 };
    reimu.knownSpellIds = [...ALL_H4_SPELL_IDS];
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

  it('死亡招魂系法术严禁从机械、亡灵、元素、幻象尸体招魂，并同步驱动棋盘高亮与悬停拒绝诊断', () => {
    const map = buildShrineNightBattleMap();
    clearMapObstacles(map.tiles);
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_remilia', col: 4, row: 10 },
          { kind: 'creature', defId: 'corpse_husk', count: 10, col: 5, row: 8 },
          { kind: 'creature', defId: 'arcane_colossus', count: 2, col: 5, row: 12 },
          { kind: 'creature', defId: 'starfire_efreet', count: 2, col: 3, row: 12 },
        ],
        rightSlots: [
          { kind: 'hero', defId: 'hero_marisa', col: 14, row: 10 },
          { kind: 'creature', defId: 'koakuma_imp', count: 10, col: 8, row: 10 },
          { kind: 'creature', defId: 'arcane_colossus', count: 2, col: 8, row: 6 },
          { kind: 'creature', defId: 'corpse_husk', count: 10, col: 8, row: 14 },
          { kind: 'creature', defId: 'starfire_efreet', count: 2, col: 10, row: 10 },
          { kind: 'creature', defId: 'kedama', count: 8, col: 10, row: 14 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 9527,
      },
      TOUHOU_CATALOG,
    );

    const remilia = Object.values(state.units).find((u) => u.defId === 'hero_remilia')!;
    const allyUndead = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'corpse_husk')!;
    const allyMech = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'arcane_colossus')!;
    const allyElem = Object.values(state.units).find((u) => u.side === 'left' && u.defId === 'starfire_efreet')!;

    const enemyLiving = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'koakuma_imp')!;
    const enemyMech = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'arcane_colossus')!;
    const enemyUndead = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'corpse_husk')!;
    const enemyElem = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'starfire_efreet')!;
    const enemyIllusion = Object.values(state.units).find((u) => u.side === 'right' && u.defId === 'kedama')!;
    enemyIllusion.isIllusion = true;
    enemyIllusion.summonKind = 'illusion';

    // 将测试目标全部置为阵亡/减员残骸态
    for (const u of [allyUndead, allyMech, allyElem, enemyLiving, enemyMech, enemyUndead, enemyElem, enemyIllusion]) {
      u.count = 0;
      u.currentHp = 0;
      u.status = 'dead';
    }

    // 1. 缺省残骸生命池仅认可活体，四类非活体一律返回 0
    expect(getAvailableCorpseHp(state, enemyLiving, TOUHOU_CATALOG)).toBeGreaterThan(0);
    expect(getAvailableCorpseHp(state, enemyMech, TOUHOU_CATALOG)).toBe(0);
    expect(getAvailableCorpseHp(state, enemyUndead, TOUHOU_CATALOG)).toBe(0);
    expect(getAvailableCorpseHp(state, enemyElem, TOUHOU_CATALOG)).toBe(0);
    expect(getAvailableCorpseHp(state, enemyIllusion, TOUHOU_CATALOG)).toBe(0);
    expect(getAvailableCorpseHp(state, allyUndead, TOUHOU_CATALOG)).toBe(0);
    // 友方原地复生模式放行亡灵，但仍严禁机械/元素/幻象
    expect(getAvailableCorpseHp(state, allyUndead, TOUHOU_CATALOG, { allowUndead: true })).toBeGreaterThan(0);
    expect(getAvailableCorpseHp(state, allyMech, TOUHOU_CATALOG, { allowUndead: true })).toBe(0);
    expect(getAvailableCorpseHp(state, allyElem, TOUHOU_CATALOG, { allowUndead: true })).toBe(0);
    expect(getAvailableCorpseHp(state, enemyIllusion, TOUHOU_CATALOG, { allowUndead: true })).toBe(0);

    // 2. 纯招魂三术（招魂·尸壳 / 怨灵 / 血族）对敌我机械、亡灵、元素、幻象一律失败
    for (const spellId of ['death_raise_skeletons', 'death_raise_ghost', 'death_raise_vampires'] as const) {
      for (const badTarget of [enemyMech, enemyUndead, enemyElem, enemyIllusion, allyUndead, allyMech, allyElem]) {
        const res = castSpellAsUnit(state, remilia, { spellId, targetUnitId: badTarget.id });
        expect(res.ok, `${spellId} 不应允许从 ${badTarget.name} 招魂`).toBe(false);
      }
    }

    // 3. 反魂起尸 / 黄泉呼唤：转化敌骸严禁机械/亡灵/元素/幻象；友军复生严禁机械/元素/幻象，允许己方亡灵复生
    for (const spellId of ['death_animate_dead', 'death_death_call'] as const) {
      for (const badEnemy of [enemyMech, enemyUndead, enemyElem, enemyIllusion]) {
        const res = castSpellAsUnit(state, remilia, { spellId, targetUnitId: badEnemy.id });
        expect(res.ok, `${spellId} 不应允许转化敌方非活体 ${badEnemy.name}`).toBe(false);
      }
      for (const badAlly of [allyMech, allyElem]) {
        const res = castSpellAsUnit(state, remilia, { spellId, targetUnitId: badAlly.id });
        expect(res.ok, `${spellId} 不应允许复生己方非活体 ${badAlly.name}`).toBe(false);
      }
    }

    // 4. 空间查骸、棋盘高亮与悬停诊断保持单一真相源
    const raiseSpell = TOUHOU_CATALOG.spells.death_raise_skeletons;
    const animateSpell = TOUHOU_CATALOG.spells.death_animate_dead;
    expect(findCorpseTargetAtHex(state, enemyMech.pos, TOUHOU_CATALOG)).toBeNull();
    expect(findCorpseTargetAtHex(state, enemyLiving.pos, TOUHOU_CATALOG)?.id).toBe(enemyLiving.id);

    const raiseHints = buildBattleOverlayHints({
      state,
      activeUnit: remilia,
      inspectedUnitId: remilia.id,
      hoveredHex: null,
      hoveredUnitId: null,
      isHumanTurn: true,
      isAnimating: false,
      declaringSpellCard: false,
      selectedSpellId: raiseSpell.id,
      pendingSpellFirstUnitId: null,
      hoverSpellContext: null,
      hoverAttackContext: null,
      activeReachableMap: null,
      activeReachableHexKeys: new Set(),
      activeAttackableUnitIds: new Set(),
    });
    expect(raiseHints.validSpellUnitIds.has(enemyLiving.id)).toBe(true);
    expect(raiseHints.validSpellUnitIds.has(enemyMech.id)).toBe(false);
    expect(raiseHints.validSpellUnitIds.has(enemyUndead.id)).toBe(false);
    expect(raiseHints.validSpellUnitIds.has(enemyElem.id)).toBe(false);
    expect(raiseHints.validSpellUnitIds.has(enemyIllusion.id)).toBe(false);
    expect(raiseHints.validSpellUnitIds.has(allyUndead.id)).toBe(false);

    const animateHints = buildBattleOverlayHints({
      state,
      activeUnit: remilia,
      inspectedUnitId: remilia.id,
      hoveredHex: null,
      hoveredUnitId: null,
      isHumanTurn: true,
      isAnimating: false,
      declaringSpellCard: false,
      selectedSpellId: animateSpell.id,
      pendingSpellFirstUnitId: null,
      hoverSpellContext: null,
      hoverAttackContext: null,
      activeReachableMap: null,
      activeReachableHexKeys: new Set(),
      activeAttackableUnitIds: new Set(),
    });
    expect(animateHints.validSpellUnitIds.has(enemyLiving.id)).toBe(true);
    expect(animateHints.validSpellUnitIds.has(allyUndead.id)).toBe(true);
    expect(animateHints.validSpellUnitIds.has(enemyUndead.id)).toBe(false);
    expect(animateHints.validSpellUnitIds.has(enemyMech.id)).toBe(false);
    expect(animateHints.validSpellUnitIds.has(enemyElem.id)).toBe(false);
    expect(animateHints.validSpellUnitIds.has(enemyIllusion.id)).toBe(false);
    expect(animateHints.validSpellUnitIds.has(allyMech.id)).toBe(false);
    expect(animateHints.validSpellUnitIds.has(allyElem.id)).toBe(false);

    // 悬停诊断精准给出四种中文拒绝标签
    const hoverMech = computeHoverSpellContext({
      state,
      activeUnit: remilia,
      spell: raiseSpell,
      hoveredHex: enemyMech.pos,
      pendingSpellFirstUnitId: null,
    });
    expect(hoverMech.canCast).toBe(false);
    expect(hoverMech.shortLabel).toBe('机械不可招魂');

    const hoverUndead = computeHoverSpellContext({
      state,
      activeUnit: remilia,
      spell: raiseSpell,
      hoveredHex: enemyUndead.pos,
      pendingSpellFirstUnitId: null,
    });
    expect(hoverUndead.canCast).toBe(false);
    expect(hoverUndead.shortLabel).toBe('亡灵不可招魂');

    const hoverElem = computeHoverSpellContext({
      state,
      activeUnit: remilia,
      spell: raiseSpell,
      hoveredHex: enemyElem.pos,
      pendingSpellFirstUnitId: null,
    });
    expect(hoverElem.canCast).toBe(false);
    expect(hoverElem.shortLabel).toBe('元素不可招魂');

    const hoverIllusion = computeHoverSpellContext({
      state,
      activeUnit: remilia,
      spell: raiseSpell,
      hoveredHex: enemyIllusion.pos,
      pendingSpellFirstUnitId: null,
    });
    expect(hoverIllusion.canCast).toBe(false);
    expect(hoverIllusion.shortLabel).toBe('幻象不可招魂');

    // 5. 正向对照：活体残骸可招魂，己方亡灵可反魂原地复生
    const okRaise = castSpellAsUnit(state, remilia, {
      spellId: 'death_raise_skeletons',
      targetUnitId: enemyLiving.id,
    });
    expect(okRaise.ok, okRaise.error).toBe(true);

    const okReviveAllyUndead = castSpellAsUnit(state, remilia, {
      spellId: 'death_animate_dead',
      targetUnitId: allyUndead.id,
    });
    expect(okReviveAllyUndead.ok, okReviveAllyUndead.error).toBe(true);
    expect(allyUndead.status).toBe('alive');
  });

  it('催眠（order_hypnotize）施法距离严格固定为 2 格（不受高台/被动扩张），且精准持续 3 回合后恢复原阵营', () => {
    const map = buildShrineNightBattleMap();
    clearMapObstacles(map.tiles, { includePartialLos: true, flattenAllElevation: 1, resetMoveCost: true });
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'hero', defId: 'hero_eirin', col: 5, row: 10 }],
        rightSlots: [
          { kind: 'creature', defId: 'exorcist_blade', count: 8, col: 7, row: 10 }, // 距永琳 2 格
          { kind: 'creature', defId: 'kedama', count: 12, col: 8, row: 10 }, // 距永琳 3 格
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 9601,
      },
      TOUHOU_CATALOG,
    );

    const eirin = Object.values(state.units).find((u) => u.defId === 'hero_eirin')!;
    const nearEnemy = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const farEnemy = Object.values(state.units).find((u) => u.defId === 'kedama')!;

    // 即使英雄站在高台且拉满魅力/侦查等副技能，催眠有效施法距离仍严格固定为 2 格
    state.tiles[hexKey(eirin.pos)].elevation = 2;
    state.tiles[hexKey(eirin.pos)].terrain = 'highland';
    eirin.skills = { ...eirin.skills, order_magic: 5, scouting: 5 };
    eirin.subSkills = { ...eirin.subSkills, charm: 5 };
    eirin.mana = 100;
    eirin.knownSpellIds = [...ALL_H4_SPELL_IDS];

    const hypSpell = TOUHOU_CATALOG.spells.order_hypnotize;
    expect(hypSpell.range).toBe(2);
    expect(getEffectiveSpellRange(state, eirin, hypSpell)).toBe(2);

    // 距离 3 格的敌军超出施法距离
    const farRes = castSpellAsUnit(state, eirin, { spellId: 'order_hypnotize', targetUnitId: farEnemy.id });
    expect(farRes.ok).toBe(false);
    expect(farRes.error).toContain('超出施法距离');

    // 距离 2 格的敌军成功催眠，精确持续 3 回合
    const nearRes = castSpellAsUnit(state, eirin, { spellId: 'order_hypnotize', targetUnitId: nearEnemy.id });
    expect(nearRes.ok, nearRes.error).toBe(true);
    expect(nearEnemy.side).toBe('left');
    expect(nearEnemy.statusEffects.hypnotizedRounds).toBe(3);

    // 通过连续防御推进 3 个完整回合：第 1、2 回合末仍归己方，第 3 回合末精准恢复原阵营
    const advanceOneFullRound = () => {
      const startRound = state.round;
      let guard = 0;
      while (state.round === startRound && state.phase === 'active' && guard < 40) {
        const actId = state.activeUnitId;
        if (!actId) break;
        const r = dispatchCombatCommand(state, { type: 'DEFEND', unitId: actId }, TOUHOU_CATALOG);
        expect(r.ok, r.error).toBe(true);
        guard += 1;
      }
      expect(state.round).toBe(startRound + 1);
    };

    advanceOneFullRound();
    expect(nearEnemy.side).toBe('left');
    expect(nearEnemy.statusEffects.hypnotizedRounds).toBe(2);

    advanceOneFullRound();
    expect(nearEnemy.side).toBe('left');
    expect(nearEnemy.statusEffects.hypnotizedRounds).toBe(1);

    advanceOneFullRound();
    expect(nearEnemy.side).toBe('right');
    expect(nearEnemy.statusEffects.hypnotizedRounds).toBe(0);
  });

  it('招魂、幻象与召唤若己方场上已有同种存活单位，应直接叠加数量与生命池至该单位而不分散生成', () => {
    const map = buildShrineNightBattleMap();
    clearMapObstacles(map.tiles, { includePartialLos: true, flattenAllElevation: 1, resetMoveCost: true });
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'hero', defId: 'hero_remilia', col: 5, row: 10 }],
        rightSlots: [
          { kind: 'creature', defId: 'exorcist_blade', count: 12, col: 8, row: 8 },
          { kind: 'creature', defId: 'kedama', count: 20, col: 8, row: 10 },
          { kind: 'creature', defId: 'ofuda_archer', count: 20, col: 8, row: 12 },
        ],
        controllers: { left: 'human', right: 'human' },
        seed: 9602,
      },
      TOUHOU_CATALOG,
    );

    const remilia = Object.values(state.units).find((u) => u.defId === 'hero_remilia')!;
    const enemyBlade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const enemyKedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const enemyArcher = Object.values(state.units).find((u) => u.defId === 'ofuda_archer')!;

    remilia.mana = 300;
    remilia.skills = { ...remilia.skills, death_magic: 5, order_magic: 5, nature_magic: 5 };
    remilia.knownSpellIds = [...ALL_H4_SPELL_IDS];

    // 1. 招魂·血族叠加验证：第一次招出吸血鬼后，第二次再招吸血鬼直接叠加在同一只吸血鬼身上
    const vampMaxHp = TOUHOU_CATALOG.creatures.crimson_vampire.baseStats.maxHp;
    const kedamaMaxHp = TOUHOU_CATALOG.creatures.kedama.baseStats.maxHp;
    const archerMaxHp = TOUHOU_CATALOG.creatures.ofuda_archer.baseStats.maxHp;
    enemyKedama.count = 15; // 阵亡 5 只毛玉
    enemyArcher.count = 14; // 阵亡 6 只弓手
    const expectedHp1 = 5 * kedamaMaxHp;
    const expectedHp2 = 6 * archerMaxHp;
    const raise1 = castSpellAsUnit(state, remilia, { spellId: 'death_raise_vampires', targetUnitId: enemyKedama.id });
    expect(raise1.ok, raise1.error).toBe(true);
    const vampsAfter1 = Object.values(state.units).filter(
      (u) => u.side === 'left' && u.defId === 'crimson_vampire' && u.summonKind === 'raised',
    );
    expect(vampsAfter1).toHaveLength(1);
    const vampStack = vampsAfter1[0];
    const hpAfter1 = (vampStack.count - 1) * vampMaxHp + vampStack.currentHp;
    expect(hpAfter1).toBe(expectedHp1);

    const raise2 = castSpellAsUnit(state, remilia, { spellId: 'death_raise_vampires', targetUnitId: enemyArcher.id });
    expect(raise2.ok, raise2.error).toBe(true);
    const vampsAfter2 = Object.values(state.units).filter(
      (u) => u.side === 'left' && u.defId === 'crimson_vampire' && u.summonKind === 'raised',
    );
    // 仍只有 1 支吸血鬼单位，数量与总生命精准叠加！
    expect(vampsAfter2).toHaveLength(1);
    expect(vampsAfter2[0].id).toBe(vampStack.id);
    const hpAfter2 = (vampStack.count - 1) * vampMaxHp + vampStack.currentHp;
    expect(hpAfter2).toBe(expectedHp1 + expectedHp2);
    expect(vampStack.count).toBe(Math.ceil((expectedHp1 + expectedHp2) / vampMaxHp));
    expect(vampStack.maxCount).toBe(vampStack.count);

    // 2. 幻象叠加验证：连续两次对同一目标施放幻象术，直接叠加到已有同种幻象单位上
    const ill1 = castSpellAsUnit(state, remilia, { spellId: 'order_phantom_image', targetUnitId: enemyBlade.id });
    expect(ill1.ok, ill1.error).toBe(true);
    const illsAfter1 = Object.values(state.units).filter(
      (u) => u.side === 'left' && u.defId === 'exorcist_blade' && u.isIllusion,
    );
    expect(illsAfter1).toHaveLength(1);
    const illStack = illsAfter1[0];
    const bladeMaxHp = TOUHOU_CATALOG.creatures.exorcist_blade.baseStats.maxHp;
    const illHp1 = (illStack.count - 1) * bladeMaxHp + illStack.currentHp;

    const ill2 = castSpellAsUnit(state, remilia, { spellId: 'order_phantom_image', targetUnitId: enemyBlade.id });
    expect(ill2.ok, ill2.error).toBe(true);
    const illsAfter2 = Object.values(state.units).filter(
      (u) => u.side === 'left' && u.defId === 'exorcist_blade' && u.isIllusion,
    );
    expect(illsAfter2).toHaveLength(1);
    expect(illsAfter2[0].id).toBe(illStack.id);
    const illHp2 = (illStack.count - 1) * bladeMaxHp + illStack.currentHp;
    expect(illHp2).toBe(illHp1 * 2);

    // 3. 召唤叠加验证 + UI 高亮/悬停联动：第二次施放同种召唤直接叠加到已有召唤单位上
    const sum1 = castSpellAsUnit(state, remilia, {
      spellId: 'nature_summon_wolf',
      targetHex: offsetToAxial(6, 10),
    });
    expect(sum1.ok, sum1.error).toBe(true);
    const wolvesAfter1 = Object.values(state.units).filter(
      (u) => u.side === 'left' && u.defId === 'summon_wolf' && u.summonKind === 'summoned',
    );
    expect(wolvesAfter1).toHaveLength(1);
    const wolfStack = wolvesAfter1[0];
    const wolfCount1 = wolfStack.count;

    // UI 高亮应把已有召唤单位纳入合法目标，悬停直接提示「叠加召唤」
    const summonSpell = TOUHOU_CATALOG.spells.nature_summon_wolf;
    const hints = buildBattleOverlayHints({
      state,
      activeUnit: remilia,
      inspectedUnitId: remilia.id,
      hoveredHex: null,
      hoveredUnitId: null,
      isHumanTurn: true,
      isAnimating: false,
      declaringSpellCard: false,
      selectedSpellId: summonSpell.id,
      pendingSpellFirstUnitId: null,
      hoverSpellContext: null,
      hoverAttackContext: null,
      activeReachableMap: null,
      activeReachableHexKeys: new Set(),
      activeAttackableUnitIds: new Set(),
    });
    expect(hints.validSpellUnitIds.has(wolfStack.id)).toBe(true);
    expect(hints.validEmptyHexKeys?.has(hexKey(wolfStack.pos))).toBe(true);

    const hoverExistingWolf = computeHoverSpellContext({
      state,
      activeUnit: remilia,
      spell: summonSpell,
      hoveredHex: wolfStack.pos,
      pendingSpellFirstUnitId: null,
    });
    expect(hoverExistingWolf.canCast).toBe(true);
    expect(hoverExistingWolf.shortLabel).toContain('叠加召唤');

    // 第二次直接点击已有召唤狼所在格施放召唤，数量翻倍且场上仍只有 1 支召唤狼
    const sum2 = castSpellAsUnit(state, remilia, {
      spellId: 'nature_summon_wolf',
      targetHex: wolfStack.pos,
    });
    expect(sum2.ok, sum2.error).toBe(true);
    const wolvesAfter2 = Object.values(state.units).filter(
      (u) => u.side === 'left' && u.defId === 'summon_wolf' && u.summonKind === 'summoned',
    );
    expect(wolvesAfter2).toHaveLength(1);
    expect(wolvesAfter2[0].id).toBe(wolfStack.id);
    expect(wolfStack.count).toBe(wolfCount1 * 2);
    expect(wolfStack.maxCount).toBe(wolfCount1 * 2);
  });
});

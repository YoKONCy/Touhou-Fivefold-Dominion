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
  getAvailableCorpseHp,
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
});

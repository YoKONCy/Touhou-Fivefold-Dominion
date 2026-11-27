/**
 * 《Touhou-H4》魔法体系、英雄符卡、36 技能树与 48 职业切职测试套件
 * 覆盖：英雄固有特质、双修进阶职业、神器套装、腰带秘药与符卡收取、五系全 142 法术、
 * 双轨法术威力公式、高台施法距离增益、20 格 Buff FIFO 上限与战前自由切职。
 */

import { describe, expect, it } from 'vitest';
import { chooseTacticalAiCommand } from '@ai/tacticalAi';
import {
  canModifyHeroClassOrBuild,
  createBattleState,
  dispatchCombatCommand,
  findUnitAtHex,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  isUnitOnHighlandPlatform,
  previewAttack,
  selectHeroAdvancedClass,
  setHeroPrimarySkillRank,
  setHeroSecondarySkillRank,
} from '@core/combatEngine';
import {
  ALL_H4_ADVANCED_CLASS_IDS,
  ALL_H4_BASE_CLASS_IDS,
  ALL_PRIMARY_SKILL_IDS,
  ALL_SECONDARY_SKILL_IDS,
  canIncrementSubSkill,
  H4_ADVANCED_CLASSES,
  resolveEligibleAdvancedClasses,
} from '@core/h4Skills';
import { hexDistance, hexKey, offsetToAxial } from '@core/hex';
import { computeUnitStats, resolveActiveArtifactSets, resolveAdvancedClass } from '@core/modifiers';
import {
  countActiveUnitStatusSlots,
  enforceUnitStatusSlotCap,
  listActiveUnitStatusSlots,
  markStatusEffectOrder,
  MAX_UNIT_BUFF_SLOTS,
  upsertUnitModifier,
} from '@core/statusCap';
import { createReimuVsMarisaBattle, TOUHOU_CATALOG } from '@data/battlePresets';
import { buildShrineNightBattleMap } from '@data/definitions';
import { ALL_H4_COMBAT_SPELL_IDS, ALL_H4_SPELL_IDS, formatSpellCardTitle, H4_SPELLS } from '@data/h4Spells';
import { buildSpellTooltipPayload, buildUnitStatusBadges } from '@ui/hudMetadata';
import { castSpellAsUnit, clearMapObstacles } from './helpers/testUtils';

describe('英雄固有特质、双修进阶职业、组合神器套装、药水与符卡收取', () => {
  it('灵梦与魔理沙应自动激活对应双修进阶职业、组合神器套装与特质属性', () => {
    const { state } = createReimuVsMarisaBattle({ mode: 'hotseat', seed: 100 });
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    const marisa = Object.values(state.units).find((u) => u.defId === 'hero_marisa')!;

    // 灵梦正统生命派系激活「退魔圣巫女」(paladin)，魔理沙激活「极彩星辰魔导」(fire_diviner)
    expect(
      resolveAdvancedClass(reimu.skills, TOUHOU_CATALOG.advancedClasses, reimu.subSkills, reimu.selectedAdvancedClassId)
        ?.id,
    ).toBe('paladin');
    const marisaCls = resolveAdvancedClass(
      marisa.skills,
      TOUHOU_CATALOG.advancedClasses,
      marisa.subSkills,
      marisa.selectedAdvancedClassId,
    );
    expect(marisaCls?.id).toBe('fire_diviner');
    expect(marisaCls?.name).toBe('极彩星辰魔导');
    expect(reimu.skills.life_magic).toBe(5);
    expect(reimu.skills.order_magic).toBeUndefined();
    expect(reimu.skills.death_magic).toBeUndefined();
    expect(reimu.skills.chaos_magic).toBeUndefined();
    expect(reimu.skills.nature_magic).toBeUndefined();
    expect(reimu.skills.tactics).toBeUndefined();
    expect(marisa.skills.tactics).toBeUndefined();
    expect(reimu.knownSpellIds.length).toBe(31);
    expect(reimu.knownSpellIds.every((id) => TOUHOU_CATALOG.spells[id]?.alignment === 'life')).toBe(true);
    // 校验战斗 II 型攻防调整（attack=22, defense=21）与初始符卡充能下调（15%）
    expect(TOUHOU_CATALOG.creatures.combat_mk2.baseStats.attack).toBe(22);
    expect(TOUHOU_CATALOG.creatures.combat_mk2.baseStats.defense).toBe(21);
    expect(reimu.spellCardCharge).toBe(15);
    // 校验移除英雄战术光环后，同队兵种攻防与基础定义完全一致（方便直观校调数值）
    const leftCreature = Object.values(state.units).find((u) => u.side === 'left' && u.kind === 'creature')!;
    const leftCreatureStats = computeUnitStats(leftCreature, state, TOUHOU_CATALOG);
    expect(leftCreatureStats.attack).toBe(leftCreature.baseStats.attack);
    expect(leftCreatureStats.defense).toBe(leftCreature.baseStats.defense);

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

    // 1. 喝药不消耗回合行动权（高纯灵力露符卡充能 +15%）
    state.activeUnitId = reimu.id;
    reimu.spellCardCharge = 85;
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
});

describe('HoMM4 全 142 法术体系与博丽灵梦正统生命派系', () => {
  it('应完整注册官方全部 142 个法术（32生命+27秩序+25死亡+27混沌+31自然，137战斗+5大地图），灵梦默认正统生命派系', () => {
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
    expect(reimu.knownSpellIds).toHaveLength(31);
    expect(reimu.knownSpellIds.every((id) => H4_SPELLS[id]?.alignment === 'life')).toBe(true);

    // 5 个大地图法术即便解锁，在战斗棋盘上也应被优雅拒绝
    reimu.knownSpellIds = [...ALL_H4_SPELL_IDS];
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
    // 本测试沙盒内赋予全系法术与满级精通，用于逐一验证跨系法术结算引擎
    reimu.knownSpellIds = [...ALL_H4_SPELL_IDS];
    reimu.skills = { ...reimu.skills, life_magic: 5, order_magic: 5, death_magic: 5, chaos_magic: 5, nature_magic: 5 };
    const blade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const efreet = Object.values(state.units).find((u) => u.defId === 'starfire_efreet')!;
    const imp = Object.values(state.units).find((u) => u.defId === 'forest_shadow_imp')!;

    const castAsReimu = (cmd: Parameters<typeof castSpellAsUnit>[2]) => castSpellAsUnit(state, reimu, cmd);

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
    reimu.knownSpellIds = [...ALL_H4_SPELL_IDS];
    reimu.skills = { ...reimu.skills, life_magic: 5, order_magic: 5, death_magic: 5, chaos_magic: 5, nature_magic: 5 };
    const blade = Object.values(state.units).find((u) => u.defId === 'exorcist_blade')!;
    const kedama = Object.values(state.units).find((u) => u.defId === 'kedama')!;
    const imp = Object.values(state.units).find((u) => u.defId === 'forest_shadow_imp')!;
    const broom = Object.values(state.units).find((u) => u.defId === 'broom_caster')!;
    const dragon = Object.values(state.units).find((u) => u.defId === 'crimson_star_dragon')!;

    const castAsReimu = (cmd: Parameters<typeof castSpellAsUnit>[2]) => castSpellAsUnit(state, reimu, cmd);

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
    clearMapObstacles(state.tiles, { includePartialLos: true, flattenAllElevation: 1, resetMoveCost: true });

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
    ) => castSpellAsUnit(state, caster, { spellId, ...extra }, { ensureKnown: true });

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

  it('站台（高地）应赋予单位 +50% 有效施法距离，并同步引擎结算、状态徽章与法术悬浮提示', () => {
    const map = buildShrineNightBattleMap();
    // 清除中间格高耸障碍确保视线畅通，仅保留 (8,3) 为高地站台
    clearMapObstacles(map.tiles);
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
    expect(setHeroPrimarySkillRank(state, reimu.id, 'order_magic', 5, TOUHOU_CATALOG).ok).toBe(true);
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

    // 战前整备阶段允许自由调点与切职：在沙盒中模拟修满五系魔法 + 格斗/战术，至少满足 15 个以上进阶职业资格！
    expect(state.hasCombatStarted).toBe(false);
    expect(canModifyHeroClassOrBuild(state)).toBe(true);
    for (const sk of ['order_magic', 'death_magic', 'chaos_magic', 'nature_magic', 'tactics'] as const) {
      expect(setHeroPrimarySkillRank(state, reimu.id, sk, 5, TOUHOU_CATALOG).ok).toBe(true);
    }

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
});

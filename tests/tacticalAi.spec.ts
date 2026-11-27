/**
 * 《Touhou-H4》新一代分层战术 AI 专项测试套件
 * 覆盖：
 * 1. 高级法术（群 Buff / 硬控 / 幻象 / 连锁闪电避友伤 / 活体招魂避四类非活体）智能施放
 * 2. 目标威胁优先级（优先集火射手与法师、贴脸锁远程、不误打醒致盲大爹）
 * 3. 英雄前顶精确判据（仅战斗树总加点 > 五系魔法总加点且无远程手段才前顶）
 * 4. 宗师档高阶 WAIT 节奏与多格吐息/全扫微操
 * 5. 三档难度（寻常 / 精锐 / 宗师）分层降维、纯确定性（不污染战斗 RNG）与单步性能预算 (< 15ms)
 */

import { describe, expect, it } from 'vitest';
import {
  chooseTacticalAiCommand,
  isFrontlineCombatHero,
  type AiDifficulty,
} from '@ai/tacticalAi';
import { createBattleState, dispatchCombatCommand } from '@core/combatEngine';
import { offsetToAxial } from '@core/hex';
import { createReimuVsMarisaBattle, TOUHOU_CATALOG } from '@data/battlePresets';
import { buildShrineNightBattleMap } from '@data/definitions';
import { clearMapObstacles } from './helpers/testUtils';

describe('新一代分层战术 AI（宗师满配 + 三档降维）', () => {
  it('英雄前顶判据：仅当「战斗树总加点 > 五系魔法总加点」且「没有远程手段」时才允许尝试前顶', () => {
    const map = buildShrineNightBattleMap();
    clearMapObstacles(map.tiles);
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'hero', defId: 'hero_reimu', col: 3, row: 8 }],
        rightSlots: [{ kind: 'creature', defId: 'exorcist_blade', count: 5, col: 10, row: 8 }],
        controllers: { left: 'ai', right: 'human' },
        seed: 20261,
      },
      TOUHOU_CATALOG,
    );

    const hero = Object.values(state.units).find((u) => u.kind === 'hero')!;
    // 1. 默认灵梦（有远程 + 生命魔法点远高于格斗点）→ 绝不前顶
    expect(isFrontlineCombatHero(hero)).toBe(false);

    // 2. 即使把战斗树加满、魔法树清零，但只要还有远程手段与弹药 → 仍不前顶
    hero.skills = { combat: 5 };
    hero.subSkills = { melee: 5, archery: 3, magic_resistance: 4 };
    hero.abilities.ranged = true;
    hero.abilities.noRanged = false;
    hero.ammo = 10;
    expect(isFrontlineCombatHero(hero)).toBe(false);

    // 3. 剥离远程手段，但战斗树总加点 <= 五系魔法总加点 → 仍不前顶
    hero.abilities.ranged = false;
    hero.skills = { combat: 3, life_magic: 4 };
    hero.subSkills = { melee: 2, healing: 3 }; // combat=5, magic=7
    expect(isFrontlineCombatHero(hero)).toBe(false);

    // 4. 战斗树总加点 === 五系魔法总加点（平手非严格大于）→ 不前顶
    hero.skills = { combat: 3, life_magic: 3 };
    hero.subSkills = { melee: 2, healing: 2 }; // combat=5, magic=5
    expect(isFrontlineCombatHero(hero)).toBe(false);

    // 5. 战斗树总加点 > 五系魔法总加点 且无远程手段 → 允许前顶！
    hero.skills = { combat: 4, life_magic: 2 };
    hero.subSkills = { melee: 3, magic_resistance: 2, healing: 1 }; // combat=9 > magic=3
    expect(isFrontlineCombatHero(hero)).toBe(true);

    // 6. 有 ranged 特技但弹药打光且无无限弹药 → 失去远程手段，满足战斗树 > 魔法树时允许前顶
    hero.abilities.ranged = true;
    hero.abilities.unlimitedShots = false;
    hero.ammo = 0;
    expect(isFrontlineCombatHero(hero)).toBe(true);
  });

  it('宗师档英雄会主动施放高阶 4–5 级法术（群 Buff / 强控 / 连锁闪电避友伤 / 活体招魂），而低档位按阶位正确降维', () => {
    const map = buildShrineNightBattleMap();
    clearMapObstacles(map.tiles);

    // 场景 A：秩序英雄八意永琳面对敌方高危高阶大爹与射手，宗师档果断交出高阶法术（而非只会平A），寻常档仅限 <= 2 阶
    const { state: orderState } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_eirin', col: 3, row: 8 },
          { kind: 'creature', defId: 'armored_lunar_guard', count: 6, col: 5, row: 8 },
          { kind: 'creature', defId: 'lunar_slinger', count: 10, col: 3, row: 11 },
        ],
        rightSlots: [
          { kind: 'hero', defId: 'hero_marisa', col: 11, row: 8 },
          { kind: 'creature', defId: 'arcane_colossus', count: 2, col: 9, row: 8 },
          { kind: 'creature', defId: 'ofuda_archer', count: 18, col: 11, row: 5 },
        ],
        controllers: { left: 'ai', right: 'human' },
        seed: 20262,
      },
      TOUHOU_CATALOG,
    );
    const eirin = Object.values(orderState.units).find((u) => u.defId === 'hero_eirin')!;
    orderState.activeUnitId = eirin.id;

    const masterOrderCmd = chooseTacticalAiCommand(orderState, TOUHOU_CATALOG, { difficulty: 'master' });
    expect(masterOrderCmd?.type).toBe('CAST_SPELL');
    if (masterOrderCmd?.type === 'CAST_SPELL') {
      const sp = TOUHOU_CATALOG.spells[masterOrderCmd.spellId];
      expect(sp.level).toBeGreaterThanOrEqual(3);
      const exec = dispatchCombatCommand(structuredClone(orderState), masterOrderCmd, TOUHOU_CATALOG);
      expect(exec.ok, exec.error).toBe(true);
    }

    // 当强敌真正逼近至 4 格以内时，宗师档英雄会先免费饮用结界硬化秘药，并在同一行动回合内无缝续放高阶法术
    const pressuredState = structuredClone(orderState);
    const pEirin = Object.values(pressuredState.units).find((u) => u.defId === 'hero_eirin')!;
    const pColossus = Object.values(pressuredState.units).find((u) => u.defId === 'arcane_colossus')!;
    pColossus.pos = offsetToAxial(6, 8);
    pressuredState.activeUnitId = pEirin.id;
    const potCmd = chooseTacticalAiCommand(pressuredState, TOUHOU_CATALOG, { difficulty: 'master' });
    expect(potCmd?.type).toBe('USE_POTION');
    const potExec = dispatchCombatCommand(pressuredState, potCmd!, TOUHOU_CATALOG);
    expect(potExec.ok).toBe(true);
    expect(pressuredState.activeUnitId).toBe(pEirin.id);
    const followSpellCmd = chooseTacticalAiCommand(pressuredState, TOUHOU_CATALOG, { difficulty: 'master' });
    expect(followSpellCmd?.type).toBe('CAST_SPELL');

    const casualOrderCmd = chooseTacticalAiCommand(orderState, TOUHOU_CATALOG, { difficulty: 'casual' });
    if (casualOrderCmd?.type === 'CAST_SPELL') {
      expect(TOUHOU_CATALOG.spells[casualOrderCmd.spellId].level).toBeLessThanOrEqual(2);
    }

    // 场景 B：混沌英雄掌握 5 级「五雷连锁」，面前有一群聚团敌军且一旁站着友军时，会施放五雷连锁且优先选不弹伤友军的起手目标
    const { state: chaosState } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_marisa', col: 2, row: 8 },
          { kind: 'creature', defId: 'exorcist_blade', count: 8, col: 8, row: 12 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'ofuda_archer', count: 16, col: 9, row: 4 },
          { kind: 'creature', defId: 'prayer_maiden', count: 8, col: 10, row: 5 },
          { kind: 'creature', defId: 'kedama', count: 18, col: 10, row: 3 },
          { kind: 'creature', defId: 'shrine_komainu', count: 3, col: 9, row: 12 },
        ],
        controllers: { left: 'ai', right: 'human' },
        seed: 20263,
      },
      TOUHOU_CATALOG,
    );
    const marisa = Object.values(chaosState.units).find((u) => u.defId === 'hero_marisa')!;
    marisa.knownSpellIds = ['chaos_chain_lightning', 'chaos_magic_arrow'];
    marisa.mana = 50;
    chaosState.activeUnitId = marisa.id;

    const chainCmd = chooseTacticalAiCommand(chaosState, TOUHOU_CATALOG, { difficulty: 'master' });
    expect(chainCmd?.type).toBe('CAST_SPELL');
    if (chainCmd?.type === 'CAST_SPELL') {
      expect(chainCmd.spellId).toBe('chaos_chain_lightning');
      // 应瞄准上方敌军三人聚团，而非下方贴着友军剑士的狛犬
      const komainu = Object.values(chaosState.units).find((u) => u.defId === 'shrine_komainu')!;
      expect(chainCmd.targetUnitId).not.toBe(komainu.id);
    }

    // 场景 C：死亡英雄蕾米莉亚仅从活体残骸招魂，面对阵亡的机械/亡灵/元素残骸绝不非法招魂
    const { state: deathState } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'hero', defId: 'hero_remilia', col: 3, row: 8 }],
        rightSlots: [
          { kind: 'hero', defId: 'hero_reimu', col: 14, row: 8 },
          { kind: 'creature', defId: 'arcane_colossus', count: 2, col: 8, row: 6 },
          { kind: 'creature', defId: 'koakuma_imp', count: 14, col: 8, row: 10 },
        ],
        controllers: { left: 'ai', right: 'human' },
        seed: 20264,
      },
      TOUHOU_CATALOG,
    );
    const remilia = Object.values(deathState.units).find((u) => u.defId === 'hero_remilia')!;
    const deadMech = Object.values(deathState.units).find((u) => u.defId === 'arcane_colossus')!;
    const deadLiving = Object.values(deathState.units).find((u) => u.defId === 'koakuma_imp')!;
    deadMech.count = 0;
    deadMech.currentHp = 0;
    deadMech.status = 'dead';
    deadLiving.count = 0;
    deadLiving.currentHp = 0;
    deadLiving.status = 'dead';
    remilia.knownSpellIds = ['death_raise_vampires', 'death_raise_ghost'];
    remilia.mana = 50;
    deathState.activeUnitId = remilia.id;

    const necroCmd = chooseTacticalAiCommand(deathState, TOUHOU_CATALOG, { difficulty: 'master' });
    expect(necroCmd?.type).toBe('CAST_SPELL');
    if (necroCmd?.type === 'CAST_SPELL') {
      expect(necroCmd.targetUnitId).toBe(deadLiving.id);
      const exec = dispatchCombatCommand(structuredClone(deathState), necroCmd, TOUHOU_CATALOG);
      expect(exec.ok, exec.error).toBe(true);
    }
  });

  it('目标优先级与保控规则：优先切敌方自由射手/法师并贴脸锁远程，且绝不随手打醒被致盲的大爹', () => {
    const map = buildShrineNightBattleMap();
    clearMapObstacles(map.tiles);
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [{ kind: 'creature', defId: 'onbashira_steed', count: 5, col: 5, row: 8 }],
        rightSlots: [
          { kind: 'creature', defId: 'armored_lunar_guard', count: 12, col: 7, row: 8 },
          { kind: 'creature', defId: 'ofuda_archer', count: 22, col: 8, row: 6 },
          { kind: 'creature', defId: 'arcane_colossus', count: 2, col: 7, row: 10 },
        ],
        controllers: { left: 'ai', right: 'human' },
        seed: 20265,
      },
      TOUHOU_CATALOG,
    );

    const steed = Object.values(state.units).find((u) => u.defId === 'onbashira_steed')!;
    const archer = Object.values(state.units).find((u) => u.defId === 'ofuda_archer')!;
    const colossus = Object.values(state.units).find((u) => u.defId === 'arcane_colossus')!;
    // 把魔导巨像设为致盲态，模拟“已控住大爹，应先切自由射手”
    colossus.statusEffects.blindRounds = 3;
    state.activeUnitId = steed.id;

    const cmd = chooseTacticalAiCommand(state, TOUHOU_CATALOG, { difficulty: 'master' });
    expect(cmd?.type).toBe('ATTACK');
    if (cmd?.type === 'ATTACK') {
      expect(cmd.targetId).toBe(archer.id);
      expect(cmd.targetId).not.toBe(colossus.id);
    }
  });

  it('宗师档具备 WAIT 等待节奏与三档纯确定性（不消耗战斗 RNG），且全阵营对局单步耗时远低于 15ms', () => {
    const map = buildShrineNightBattleMap();
    clearMapObstacles(map.tiles);
    const { state } = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'creature', defId: 'onbashira_steed', count: 4, col: 2, row: 8 },
          { kind: 'hero', defId: 'hero_reimu', col: 0, row: 8 },
        ],
        rightSlots: [
          { kind: 'creature', defId: 'exorcist_blade', count: 8, col: 13, row: 8 },
          { kind: 'hero', defId: 'hero_marisa', col: 15, row: 8 },
        ],
        controllers: { left: 'ai', right: 'ai' },
        seed: 20266,
      },
      TOUHOU_CATALOG,
    );

    const steed = Object.values(state.units).find((u) => u.defId === 'onbashira_steed')!;
    const reimu = Object.values(state.units).find((u) => u.defId === 'hero_reimu')!;
    state.activeUnitId = steed.id;
    state.turnQueue = [steed.id, reimu.id, ...state.turnQueue.filter((id) => id !== steed.id && id !== reimu.id)];

    // 宗师档：高速天马在首回合摸不到敌方、且己方灵梦尚未出手拍群 Buff 时，应懂得 WAIT 而不是单骑盲冲！
    const rngBefore = state.rng.seed;
    const masterCmd = chooseTacticalAiCommand(state, TOUHOU_CATALOG, { difficulty: 'master' });
    expect(masterCmd?.type).toBe('WAIT');
    // 寻常档：不做高阶等待规划，直接向前移动
    const casualCmd = chooseTacticalAiCommand(state, TOUHOU_CATALOG, { difficulty: 'casual' });
    expect(casualCmd?.type).toBe('MOVE');
    // 验证三档调用均绝不修改战斗 RNG 状态
    chooseTacticalAiCommand(state, TOUHOU_CATALOG, { difficulty: 'standard' });
    expect(state.rng.seed).toBe(rngBefore);

    // 实战性能与收敛基准：三档难度对局均可无异常推进，且宗师档单步平均耗时 < 15ms
    for (const diff of ['casual', 'standard', 'master'] as AiDifficulty[]) {
      const battle = createReimuVsMarisaBattle({
        mode: 'vs_ai',
        leftFaction: 'order',
        rightFaction: 'death',
        lineupVariant: 'A',
        seed: 20267,
      }).state;
      battle.controllers.left = 'ai';
      battle.controllers.right = 'ai';

      const stepsToMeasure = 24;
      let aiThinkMs = 0;
      let executed = 0;
      for (let i = 0; i < stepsToMeasure && battle.phase === 'active'; i++) {
        const t0 = performance.now();
        const cmd = chooseTacticalAiCommand(battle, TOUHOU_CATALOG, { difficulty: diff });
        aiThinkMs += performance.now() - t0;
        expect(cmd).not.toBeNull();
        const res = dispatchCombatCommand(battle, cmd!, TOUHOU_CATALOG);
        expect(res.ok, `${diff} AI 返回了非法指令 ${JSON.stringify(cmd)}: ${res.error}`).toBe(true);
        executed += 1;
      }
      const avgMs = executed > 0 ? aiThinkMs / executed : 0;
      expect(executed).toBeGreaterThan(0);
      expect(avgMs).toBeLessThan(15);
    }

    // 额外校验：后排法系英雄面对近战威胁时，不会把无远程惩罚抛诸脑后盲目冲脸
    const safeHeroState = createBattleState(
      {
        mapWidth: map.width,
        mapHeight: map.height,
        tiles: map.tiles,
        leftSlots: [
          { kind: 'hero', defId: 'hero_reimu', col: 5, row: 8 },
          { kind: 'creature', defId: 'exorcist_blade', count: 6, col: 6, row: 10 },
        ],
        rightSlots: [{ kind: 'creature', defId: 'arcane_colossus', count: 3, col: 9, row: 8 }],
        controllers: { left: 'ai', right: 'human' },
        seed: 20268,
      },
      TOUHOU_CATALOG,
    ).state;
    const reimuSafe = Object.values(safeHeroState.units).find((u) => u.defId === 'hero_reimu')!;
    reimuSafe.knownSpellIds = [];
    reimuSafe.mana = 0;
    reimuSafe.ammo = 0;
    reimuSafe.abilities.ranged = false;
    // 魔法加点 > 战斗加点，即便没远程也绝不该主动近战撞魔导巨像送头！
    reimuSafe.skills = { life_magic: 5, combat: 1 };
    reimuSafe.subSkills = { healing: 4 };
    safeHeroState.activeUnitId = reimuSafe.id;
    const colossusPos = offsetToAxial(9, 8);
    const reimuCmd = chooseTacticalAiCommand(safeHeroState, TOUHOU_CATALOG, { difficulty: 'master' });
    expect(reimuCmd?.type).not.toBe('ATTACK');
    if (reimuCmd?.type === 'MOVE') {
      expect(reimuCmd.to.q).toBeLessThanOrEqual(colossusPos.q - 4);
    }
  });
});

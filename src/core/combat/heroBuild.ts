/**
 * 英雄战前技能树配点、11 大基础职业模板切换、37 种进阶职业自由切换与派生属性同步子模块
 */

import {
  canIncrementPrimarySkill,
  canIncrementSubSkill,
  clampSkillsToPrerequisites,
  getPrimarySkillMaxAllowedRank,
  getSubSkillMaxAllowedRank,
  H4_BASE_CLASS_STARTER_BUILDS,
  MAGIC_PRIMARY_SKILL_IDS,
  PRIMARY_PREREQ_PAIR_MAP,
  resolveActiveHeroClass,
  resolveEligibleAdvancedClasses,
  SECONDARY_SKILL_META,
  SKILL_TREE_META,
} from '../h4Skills';
import { computeUnitStats } from '../modifiers';
import type {
  BattleState,
  BattleUnit,
  PrimarySkillId,
  SecondarySkillId,
  SkillRank,
} from '../types';
import { buildRoundTurnQueue } from './turnQueue';
import type { CombatContentCatalog } from './types';

/** 判断当前是否处于「战斗场景外」（战前整备阶段或战斗结束后），允许调整配点与切换进阶职业 */
export function canModifyHeroClassOrBuild(state: BattleState): boolean {
  return !state.hasCombatStarted || state.phase === 'finished';
}

/** 根据英雄当前 36 技能树与激活职业，执行双向阶梯收敛并无损重算派生特技与血蓝上限 */
export function syncHeroDerivedState(
  state: BattleState,
  hero: BattleUnit,
  catalog: CombatContentCatalog,
  refillIfPrep = false,
): void {
  if (hero.kind !== 'hero') return;

  const normalized = clampSkillsToPrerequisites(hero.skills, hero.subSkills ?? {});
  hero.skills = normalized.skills;
  hero.subSkills = normalized.subSkills;

  const eligible = resolveEligibleAdvancedClasses(hero.skills, hero.subSkills, catalog.advancedClasses);
  if (hero.selectedAdvancedClassId && !eligible.some((c) => c.id === hero.selectedAdvancedClassId)) {
    hero.selectedAdvancedClassId = null;
  }

  const activeCls = resolveActiveHeroClass(
    hero.skills,
    hero.subSkills,
    catalog.advancedClasses,
    hero.selectedAdvancedClassId,
  );
  hero.advancedClassId = activeCls?.id;

  const baseAb = hero.baseAbilities ?? { ...hero.abilities };
  hero.baseAbilities = { ...baseAb };
  const nextAb = { ...baseAb };
  const sub = hero.subSkills ?? {};
  const p = activeCls?.passive;

  // 1. 格斗·近战子技能派生态（3 阶先攻、5 阶近战双重攻击）
  if ((sub.melee ?? 0) >= 3) nextAb.firstStrike = true;
  if ((sub.melee ?? 0) >= 5) nextAb.meleeDoubleStrike = true;

  // 2. 格斗·射击子技能 & 游侠职业（1 阶解锁远程、2 阶无视障碍、3 阶精准射击、4 阶远程先攻、5 阶远程双重攻击）
  if ((sub.archery ?? 0) >= 1 || p?.grantRanged) {
    nextAb.ranged = true;
    hero.baseStats.range = Math.max(hero.baseStats.range, 8);
    if (hero.maxAmmo < 16) {
      hero.maxAmmo = 16;
      hero.ammo = Math.max(hero.ammo, 16);
    }
  }
  if ((sub.archery ?? 0) >= 2) nextAb.noObstaclePenalty = true;
  if ((sub.archery ?? 0) >= 3 || p?.grantLongRange) nextAb.longRange = true;
  if ((sub.archery ?? 0) >= 4) nextAb.rangedFirstStrike = true;
  if ((sub.archery ?? 0) >= 5) nextAb.rangedDoubleStrike = true;

  // 3. 侦查·潜行与进阶职业赋予的战斗特技
  if ((sub.stealth ?? 0) >= 3) nextAb.stealth = true;
  if (p?.grantDeathWard) nextAb.deathWard = true;
  if (p?.grantChaosWard) nextAb.chaosWard = true;
  if (p?.grantFireShield) nextAb.fireShield = true;
  if (p?.grantFireResistant) nextAb.fireResistant = true;
  if (p?.grantFirstStrike) nextAb.firstStrike = true;
  if (p?.grantStunOnHit) nextAb.stunOnHit = true;
  if (p?.grantAgingOnHit) nextAb.agingOnHit = true;
  if (p?.grantPoisonAttack) nextAb.poisonAttack = true;
  if (p?.grantFearAttack) nextAb.fearAttack = true;

  if (hero.statusEffects.grantedAbilities) {
    for (const ga of hero.statusEffects.grantedAbilities) {
      nextAb[ga] = true;
    }
  }
  hero.abilities = nextAb;

  const stats = computeUnitStats(hero, state, catalog);
  if (refillIfPrep && !state.hasCombatStarted) {
    hero.currentHp = stats.maxHp;
    hero.mana = stats.maxMana;
  } else {
    hero.currentHp = Math.min(hero.currentHp, stats.maxHp);
    if (hero.mana !== undefined) {
      hero.mana = Math.min(hero.mana, stats.maxMana);
    }
  }
}

/** 战前法术同步辅助：依据五系魔法主技能当前阶位解锁对应术式 */
function syncHeroMagicSpells(hero: BattleUnit, catalog: CombatContentCatalog): void {
  const known = new Set(hero.knownSpellIds);
  for (const mk of MAGIC_PRIMARY_SKILL_IDS) {
    const rank = hero.skills[mk] ?? 0;
    const meta = SKILL_TREE_META[mk];
    if (meta.magicSchool && rank > 0) {
      for (const sp of Object.values(catalog.spells)) {
        if (sp.alignment === meta.magicSchool && sp.level <= rank && !sp.isCreatureOnly) {
          known.add(sp.id);
        }
      }
    }
  }
  hero.knownSpellIds = Array.from(known);
}

/** 战前调整成功后统一刷新血蓝并重排开战行动队列 */
function refreshPrepStateAfterBuildChange(state: BattleState, catalog: CombatContentCatalog): void {
  if (!state.hasCombatStarted) {
    for (const u of Object.values(state.units)) {
      const s = computeUnitStats(u, state, catalog);
      u.currentHp = s.maxHp;
      if (s.maxMana > 0) u.mana = s.maxMana;
    }
    state.turnQueue = buildRoundTurnQueue(state, catalog);
    state.activeUnitId = state.turnQueue[0] ?? null;
  }
}

/** 战前整备调整英雄主技能阶位（0~5），严格执行 HoMM4 双向阶梯前置与向下级联收敛 */
export function setHeroPrimarySkillRank(
  state: BattleState,
  heroId: string,
  skillId: PrimarySkillId,
  rank: SkillRank,
  catalog: CombatContentCatalog,
): { ok: boolean; error?: string } {
  if (!canModifyHeroClassOrBuild(state)) {
    return { ok: false, error: '战斗进行中无法调整技能配点，请于战前整备或重开战局后调整' };
  }
  const hero = state.units[heroId];
  if (!hero || hero.kind !== 'hero') return { ok: false, error: '目标不是英雄单位' };

  const target = Math.max(0, Math.min(5, Math.round(rank))) as SkillRank;
  const cur = (hero.skills[skillId] ?? 0) as SkillRank;
  if (target > cur) {
    const maxAllowed = getPrimarySkillMaxAllowedRank(hero.skills, hero.subSkills, skillId);
    if (target > maxAllowed) {
      if (target === cur + 1) {
        const incCheck = canIncrementPrimarySkill(hero.skills, hero.subSkills, skillId);
        return { ok: false, error: incCheck.reason ?? '未满足前置子技能要求' };
      }
      const gate = PRIMARY_PREREQ_PAIR_MAP[skillId];
      if (gate) {
        const needSub = Math.max(1, target - gate.baseFreeRank);
        const subA = SECONDARY_SKILL_META[gate.pair[0]].name;
        const subB = SECONDARY_SKILL_META[gate.pair[1]].name;
        return {
          ok: false,
          error: `晋升${SKILL_TREE_META[skillId].name} Lv.${target} 需先将${subA}与${subB}升至 Lv.${needSub}`,
        };
      }
      return { ok: false, error: '未满足前置条件' };
    }
  }

  if (target === 0) {
    delete hero.skills[skillId];
  } else {
    hero.skills[skillId] = target;
  }

  syncHeroMagicSpells(hero, catalog);
  syncHeroDerivedState(state, hero, catalog, true);
  refreshPrepStateAfterBuildChange(state, catalog);
  return { ok: true };
}

/** 战前整备调整英雄二级子技能阶位（0~5），严格校验主技能前置并向下级联收敛高阶主技能 */
export function setHeroSecondarySkillRank(
  state: BattleState,
  heroId: string,
  subSkillId: SecondarySkillId,
  rank: SkillRank,
  catalog: CombatContentCatalog,
): { ok: boolean; error?: string } {
  if (!canModifyHeroClassOrBuild(state)) {
    return { ok: false, error: '战斗进行中无法调整子技能配点，请于战前整备或重开战局后调整' };
  }
  const hero = state.units[heroId];
  if (!hero || hero.kind !== 'hero') return { ok: false, error: '目标不是英雄单位' };

  const target = Math.max(0, Math.min(5, Math.round(rank))) as SkillRank;
  const current = hero.subSkills?.[subSkillId] ?? 0;
  if (target > current) {
    if (target === current + 1) {
      const check = canIncrementSubSkill(hero.skills, hero.subSkills ?? {}, subSkillId);
      if (!check.ok) return { ok: false, error: check.reason };
    } else {
      const maxAllowed = getSubSkillMaxAllowedRank(hero.skills, subSkillId);
      if (target > maxAllowed) {
        return { ok: false, error: `子技能最高仅可升至当前主技能解锁上限 Lv.${maxAllowed}` };
      }
    }
  }

  hero.subSkills = { ...(hero.subSkills ?? {}) };
  if (target === 0) {
    delete hero.subSkills[subSkillId];
  } else {
    hero.subSkills[subSkillId] = target;
  }

  syncHeroDerivedState(state, hero, catalog, true);
  refreshPrepStateAfterBuildChange(state, catalog);
  return { ok: true };
}

/** 战前套用 HoMM4 原版 11 大基础职业起始技能模板（供未来完整大地图建角与沙盒试玩一键洗点） */
export function applyHeroBaseClassTemplate(
  state: BattleState,
  heroId: string,
  baseClassId: string,
  catalog: CombatContentCatalog,
): { ok: boolean; error?: string } {
  if (!canModifyHeroClassOrBuild(state)) {
    return { ok: false, error: '战斗进行中不可重置基础职业模板' };
  }
  const hero = state.units[heroId];
  if (!hero || hero.kind !== 'hero') return { ok: false, error: '目标不是英雄单位' };
  const tpl = H4_BASE_CLASS_STARTER_BUILDS[baseClassId];
  if (!tpl) return { ok: false, error: '未找到指定的基础职业模板' };

  hero.skills = { ...tpl.skills };
  hero.subSkills = { ...tpl.subSkills };
  hero.selectedAdvancedClassId = null;
  syncHeroMagicSpells(hero, catalog);
  syncHeroDerivedState(state, hero, catalog, true);
  refreshPrepStateAfterBuildChange(state, catalog);
  return { ok: true };
}

/** 战斗场景外自由切换英雄进阶职业 */
export function selectHeroAdvancedClass(
  state: BattleState,
  heroId: string,
  classId: string | null,
  catalog: CombatContentCatalog,
): { ok: boolean; error?: string } {
  if (!canModifyHeroClassOrBuild(state)) {
    return { ok: false, error: '战斗进行中不可切换进阶职业，请于战前整备或战斗结束后切换' };
  }
  const hero = state.units[heroId];
  if (!hero || hero.kind !== 'hero') return { ok: false, error: '仅英雄可切换进阶职业' };

  if (classId !== null) {
    const eligible = resolveEligibleAdvancedClasses(hero.skills, hero.subSkills, catalog.advancedClasses);
    if (!eligible.some((c) => c.id === classId)) {
      return { ok: false, error: '尚未满足该进阶职业的技能树组合条件' };
    }
  }

  hero.selectedAdvancedClassId = classId;
  syncHeroDerivedState(state, hero, catalog, true);
  refreshPrepStateAfterBuildChange(state, catalog);
  const activeCls = resolveActiveHeroClass(
    hero.skills,
    hero.subSkills,
    catalog.advancedClasses,
    hero.selectedAdvancedClassId,
  );
  if (activeCls) {
    state.actionLog.push(`✦ ${hero.name} 于战前整备切换进阶职业为【${activeCls.name}】！`);
  }
  return { ok: true };
}

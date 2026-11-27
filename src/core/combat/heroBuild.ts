/**
 * 英雄战前技能树配点、进阶职业自由切换与派生属性同步子模块
 */

import {
  canIncrementSubSkill,
  clampSubSkillsToPrimaries,
  getSubSkillMaxAllowedRank,
  resolveActiveHeroClass,
  resolveEligibleAdvancedClasses,
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

/** 根据英雄当前 36 技能树与激活职业，无损重算派生特技与血蓝上限 */
export function syncHeroDerivedState(
  state: BattleState,
  hero: BattleUnit,
  catalog: CombatContentCatalog,
  refillIfPrep = false,
): void {
  if (hero.kind !== 'hero') return;
  hero.subSkills = clampSubSkillsToPrimaries(hero.skills, hero.subSkills ?? {});

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

  if ((sub.archery ?? 0) >= 1) {
    nextAb.ranged = true;
    hero.baseStats.range = Math.max(hero.baseStats.range, 8);
    if (hero.maxAmmo < 16) {
      hero.maxAmmo = 16;
      hero.ammo = Math.max(hero.ammo, 16);
    }
  }
  if ((sub.stealth ?? 0) >= 3) nextAb.stealth = true;
  if (p?.grantDeathWard) nextAb.deathWard = true;
  if (p?.grantFireShield) nextAb.fireShield = true;
  if (p?.grantFireResistant) nextAb.fireResistant = true;
  if (p?.grantLongRange) nextAb.longRange = true;
  if (p?.grantFirstStrike) nextAb.firstStrike = true;

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

/** 战前整备调整英雄主技能阶位（0~5），自动级联收敛子技能、同步法术与职业 */
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

  const clamped = Math.max(0, Math.min(5, Math.round(rank))) as SkillRank;
  if (clamped === 0) {
    delete hero.skills[skillId];
  } else {
    hero.skills[skillId] = clamped;
  }

  const meta = SKILL_TREE_META[skillId];
  if (meta.isMagic && meta.magicSchool && clamped > 0) {
    const known = new Set(hero.knownSpellIds);
    for (const sp of Object.values(catalog.spells)) {
      if (sp.alignment === meta.magicSchool && sp.level <= clamped && !sp.isCreatureOnly) {
        known.add(sp.id);
      }
    }
    hero.knownSpellIds = Array.from(known);
  }

  syncHeroDerivedState(state, hero, catalog, true);
  if (!state.hasCombatStarted) {
    for (const u of Object.values(state.units)) {
      const s = computeUnitStats(u, state, catalog);
      u.currentHp = s.maxHp;
      if (s.maxMana > 0) u.mana = s.maxMana;
    }
    state.turnQueue = buildRoundTurnQueue(state, catalog);
    state.activeUnitId = state.turnQueue[0] ?? null;
  }
  return { ok: true };
}

/** 战前整备调整英雄二级子技能阶位（0~5），严格校验 H4 主技能前置要求 */
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
    const check = canIncrementSubSkill(hero.skills, hero.subSkills ?? {}, subSkillId);
    if (!check.ok) return { ok: false, error: check.reason };
    const maxAllowed = getSubSkillMaxAllowedRank(hero.skills, subSkillId);
    if (target > maxAllowed) {
      return { ok: false, error: `子技能最高不可超过主技能当前阶位 (Lv.${maxAllowed})` };
    }
  }

  hero.subSkills = { ...(hero.subSkills ?? {}) };
  if (target === 0) {
    delete hero.subSkills[subSkillId];
  } else {
    hero.subSkills[subSkillId] = target;
  }

  syncHeroDerivedState(state, hero, catalog, true);
  if (!state.hasCombatStarted) {
    for (const u of Object.values(state.units)) {
      const s = computeUnitStats(u, state, catalog);
      u.currentHp = s.maxHp;
      if (s.maxMana > 0) u.mana = s.maxMana;
    }
    state.turnQueue = buildRoundTurnQueue(state, catalog);
    state.activeUnitId = state.turnQueue[0] ?? null;
  }
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
  if (!state.hasCombatStarted) {
    for (const u of Object.values(state.units)) {
      const s = computeUnitStats(u, state, catalog);
      u.currentHp = s.maxHp;
      if (s.maxMana > 0) u.mana = s.maxMana;
    }
    state.turnQueue = buildRoundTurnQueue(state, catalog);
    state.activeUnitId = state.turnQueue[0] ?? null;
  }
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

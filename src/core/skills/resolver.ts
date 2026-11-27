/**
 * HoMM4 英雄进阶职业推导与技能法术威力综合倍率计算器
 */

import type { Alignment } from '../alignment';
import type {
  AdvancedClassDef,
  PrimarySkillId,
  SecondarySkillId,
  SkillRank,
} from '../types';
import { H4_ADVANCED_CLASSES, H4_BASE_CLASSES } from './classes';
import {
  ALL_PRIMARY_SKILL_IDS,
  getSkillTreeTotal,
  MAGIC_EFFECT_BONUS_PCT_BY_RANK,
  MAGIC_PRIMARY_SKILL_IDS,
} from './skillTrees';

/** 进阶职业单树资格阈值：主技能 >= 1 且该树（主+3子）总投入 >= 2 */
export const ADVANCED_CLASS_TREE_THRESHOLD = 2;

/**
 * 计算英雄当前已满足解锁条件的全部进阶组合职业（供战斗场景外自由切换！）
 * 排序规则：按关联两棵技能树总投入之和从高到低排列（万象大贤者置顶）。
 */
export function resolveEligibleAdvancedClasses(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  advancedClasses: Record<string, AdvancedClassDef> = H4_ADVANCED_CLASSES,
): AdvancedClassDef[] {
  const treeTotals: Record<PrimarySkillId, number> = {} as Record<PrimarySkillId, number>;
  for (const id of ALL_PRIMARY_SKILL_IDS) {
    treeTotals[id] = getSkillTreeTotal(skills, subSkills, id);
  }

  const eligible: Array<{ cls: AdvancedClassDef; score: number }> = [];
  const qualifiedMagicTrees = MAGIC_PRIMARY_SKILL_IDS.filter(
    (m) => (skills[m] ?? 0) >= 3 || treeTotals[m] >= 5,
  );

  for (const cls of Object.values(advancedClasses)) {
    if (cls.isBaseClass) continue;
    if (cls.minMagicTrees && cls.minMagicTrees >= 3) {
      if (qualifiedMagicTrees.length >= cls.minMagicTrees) {
        const magicSum = qualifiedMagicTrees.reduce((acc, k) => acc + treeTotals[k], 0);
        eligible.push({ cls, score: 1000 + magicSum });
      }
      continue;
    }
    const rankA = skills[cls.primaryA] ?? 0;
    const rankB = skills[cls.primaryB] ?? 0;
    if (
      rankA >= 1 &&
      rankB >= 1 &&
      treeTotals[cls.primaryA] >= ADVANCED_CLASS_TREE_THRESHOLD &&
      treeTotals[cls.primaryB] >= ADVANCED_CLASS_TREE_THRESHOLD
    ) {
      eligible.push({ cls, score: treeTotals[cls.primaryA] + treeTotals[cls.primaryB] });
    }
  }

  eligible.sort((a, b) => b.score - a.score || a.cls.id.localeCompare(b.cls.id));
  return eligible.map((item) => item.cls);
}

/** 获取单系基础职业兜底（当尚未满足任何双修进阶职业条件时，按主导分支细分为对应 11 大基础职业） */
export function resolveBaseClass(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills?: Partial<Record<SecondarySkillId, SkillRank>>,
): AdvancedClassDef | null {
  const sorted = ALL_PRIMARY_SKILL_IDS
    .map((id) => ({ id, rank: skills[id] ?? 0, total: getSkillTreeTotal(skills, subSkills, id) }))
    .filter((item) => item.rank >= 1)
    .sort((a, b) => b.total - a.total || b.rank - a.rank);

  if (sorted.length === 0) return null;
  const top = sorted[0].id;
  if (top === 'combat' && (subSkills?.archery ?? 0) > (subSkills?.melee ?? 0)) {
    return H4_BASE_CLASSES.base_archer;
  }
  if (top === 'tactics' && (subSkills?.offense ?? 0) > (subSkills?.defense ?? 0)) {
    return H4_BASE_CLASSES.base_death_lord;
  }
  const map: Record<PrimarySkillId, string> = {
    tactics: 'base_knight',
    combat: 'base_barbarian',
    scouting: 'base_thief',
    nobility: 'base_lord',
    life_magic: 'base_priest',
    order_magic: 'base_mage',
    death_magic: 'base_necromancer',
    chaos_magic: 'base_sorcerer',
    nature_magic: 'base_druid',
  };
  return H4_BASE_CLASSES[map[top]] ?? null;
}

/** 单职业资格 O(1) 快速校验（避免每帧属性重算时全量枚举并排序 37 职业） */
export function isAdvancedClassQualified(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  cls: AdvancedClassDef,
): boolean {
  if (cls.isBaseClass) return false;
  if (cls.minMagicTrees && cls.minMagicTrees >= 3) {
    let qualifiedCount = 0;
    for (const m of MAGIC_PRIMARY_SKILL_IDS) {
      if ((skills[m] ?? 0) >= 3 || getSkillTreeTotal(skills, subSkills, m) >= 5) {
        qualifiedCount += 1;
        if (qualifiedCount >= cls.minMagicTrees) return true;
      }
    }
    return false;
  }
  const rankA = skills[cls.primaryA] ?? 0;
  const rankB = skills[cls.primaryB] ?? 0;
  if (rankA < 1 || rankB < 1) return false;
  return (
    getSkillTreeTotal(skills, subSkills, cls.primaryA) >= ADVANCED_CLASS_TREE_THRESHOLD &&
    getSkillTreeTotal(skills, subSkills, cls.primaryB) >= ADVANCED_CLASS_TREE_THRESHOLD
  );
}

/**
 * 解析英雄当前最终激活的职业：
 * 1. 若英雄已主动指定 `selectedClassId` 且当前仍满足该进阶职业条件 → O(1) 直接返回，免去全表排序！
 * 2. 否则返回默认最高分进阶组合职业；
 * 3. 若未达任何双修门槛 → 回退至对应单系基础职业。
 */
export function resolveActiveHeroClass(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  advancedClasses: Record<string, AdvancedClassDef> = H4_ADVANCED_CLASSES,
  selectedClassId?: string | null,
): AdvancedClassDef | null {
  if (selectedClassId) {
    const picked = advancedClasses[selectedClassId];
    if (picked && isAdvancedClassQualified(skills, subSkills, picked)) {
      return picked;
    }
  }
  const eligible = resolveEligibleAdvancedClasses(skills, subSkills, advancedClasses);
  if (eligible.length > 0) return eligible[0];
  return resolveBaseClass(skills, subSkills);
}

/** 计算指定法术在英雄原版 36 技能树 + 激活职业加成下的综合威力倍率 */
export function computeHeroSpellEffectivenessMultiplier(
  _skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  activeClass: AdvancedClassDef | null,
  school: Exclude<Alignment, 'might'>,
  category: 'damage' | 'heal' | 'revive' | 'summon' | 'raise' | 'mind' | 'buff_debuff',
  opts?: { spellId?: string; isFireSpell?: boolean; isIllusion?: boolean },
): number {
  let mult = 1;
  const sub = subSkills ?? {};

  // 1. 混沌子技能「魔力 (Sorcery)」：原版 HoMM4 规则下全五系直接伤害法术统一 +20%/阶（宗师 +100%）
  if (category === 'damage') {
    mult += MAGIC_EFFECT_BONUS_PCT_BY_RANK[sub.sorcery ?? 0];
  }

  // 2. 五系对称子技能精准增幅（1~5 阶分别对应 +20%/+40%/+60%/+80%/+100%）
  if (school === 'life') {
    mult += MAGIC_EFFECT_BONUS_PCT_BY_RANK[sub.healing ?? 0];
    if (category === 'revive') {
      mult += (sub.resurrection_skill ?? 0) * 0.15;
    }
  } else if (school === 'order') {
    mult += MAGIC_EFFECT_BONUS_PCT_BY_RANK[sub.enchantment ?? 0];
    if (category === 'mind') {
      mult += (sub.charm ?? 0) * 0.12;
    }
  } else if (school === 'death') {
    mult += MAGIC_EFFECT_BONUS_PCT_BY_RANK[sub.demonology ?? 0];
    if (category === 'raise') {
      mult += (sub.necromancy ?? 0) * 0.15;
    }
  } else if (school === 'chaos') {
    mult += MAGIC_EFFECT_BONUS_PCT_BY_RANK[sub.pyromancy ?? 0];
  } else if (school === 'nature') {
    if (category === 'summon') {
      mult += MAGIC_EFFECT_BONUS_PCT_BY_RANK[sub.summoning ?? 0];
    } else {
      mult += (sub.herbalism ?? 0) * 0.15;
    }
  }

  // 3. 激活进阶职业的专属法术被动
  const passive = activeClass?.passive;
  if (passive) {
    if (passive.allSpellBonusPct) mult += passive.allSpellBonusPct;
    if (passive.schoolSpellBonusPct?.[school]) mult += passive.schoolSpellBonusPct[school]!;
    if (opts?.isFireSpell && passive.fireSpellBonusPct) mult += passive.fireSpellBonusPct;
    if (opts?.isIllusion && passive.illusionBonusPct) mult += passive.illusionBonusPct;
    if (opts?.spellId && passive.specificSpellBonusPct?.[opts.spellId]) {
      mult += passive.specificSpellBonusPct[opts.spellId]!;
    }
    if ((category === 'heal' || category === 'revive') && passive.healingBonusPct) {
      mult += passive.healingBonusPct;
    }
    if (category === 'summon' && passive.summonBonusPct) {
      mult += passive.summonBonusPct;
    }
    if (category === 'raise' && passive.necromancyBonusPct) {
      mult += passive.necromancyBonusPct;
    }
  }

  return mult;
}

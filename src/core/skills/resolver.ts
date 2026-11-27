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

/** 获取单系基础职业兜底（当尚未满足任何双修进阶职业条件时） */
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

/**
 * 解析英雄当前最终激活的职业：
 * 1. 若英雄已主动指定 `selectedClassId` 且当前仍满足该进阶职业条件 → 尊重玩家自由切换结果！
 * 2. 否则返回默认最高分进阶组合职业；
 * 3. 若未达任何双修门槛 → 回退至对应单系基础职业。
 */
export function resolveActiveHeroClass(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  advancedClasses: Record<string, AdvancedClassDef> = H4_ADVANCED_CLASSES,
  selectedClassId?: string | null,
): AdvancedClassDef | null {
  const eligible = resolveEligibleAdvancedClasses(skills, subSkills, advancedClasses);
  if (selectedClassId) {
    const picked = eligible.find((c) => c.id === selectedClassId);
    if (picked) return picked;
  }
  if (eligible.length > 0) return eligible[0];
  return resolveBaseClass(skills, subSkills);
}

/** 计算指定法术在英雄 36 技能树 + 激活职业加成下的综合威力倍率 */
export function computeHeroSpellEffectivenessMultiplier(
  _skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  activeClass: AdvancedClassDef | null,
  school: Exclude<Alignment, 'might'>,
  category: 'damage' | 'heal' | 'revive' | 'summon' | 'raise' | 'mind' | 'buff_debuff',
): number {
  let mult = 1;
  const sub = subSkills ?? {};

  // 1. 混沌子技能「魔力 (Sorcery)」：全五系通用法术威力 +10%/阶
  mult += (sub.sorcery ?? 0) * 0.1;

  // 2. 各派系专属子技能精准增幅
  if (school === 'life') {
    mult += (sub.spirituality ?? 0) * 0.1;
    if (category === 'heal') mult += (sub.healing ?? 0) * 0.15;
    if (category === 'revive') mult += (sub.resurrection_skill ?? 0) * 0.18 + (sub.healing ?? 0) * 0.08;
  } else if (school === 'order') {
    mult += (sub.enchantment ?? 0) * 0.15;
    if (category === 'mind') mult += (sub.charm ?? 0) * 0.12;
  } else if (school === 'death') {
    mult += (sub.occultism ?? 0) * 0.12;
    if (category === 'damage' || category === 'buff_debuff') mult += (sub.demonology ?? 0) * 0.15;
    if (category === 'raise') mult += (sub.necromancy ?? 0) * 0.2;
  } else if (school === 'chaos') {
    if (category === 'damage') {
      mult += (sub.pyromancy ?? 0) * 0.16;
    } else {
      mult += (sub.conjuration ?? 0) * 0.12;
    }
  } else if (school === 'nature') {
    if (category === 'summon') {
      mult += (sub.summoning ?? 0) * 0.2;
    } else {
      mult += (sub.herbalism ?? 0) * 0.15;
    }
  }

  // 3. 激活进阶职业的专属法术被动
  const passive = activeClass?.passive;
  if (passive) {
    if (passive.allSpellBonusPct) mult += passive.allSpellBonusPct;
    if (passive.schoolSpellBonusPct?.[school]) mult += passive.schoolSpellBonusPct[school]!;
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

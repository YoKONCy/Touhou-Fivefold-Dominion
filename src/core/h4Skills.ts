/**
 * HoMM4 完整 36 技能树与 48 职业体系聚合导出入口
 * 实际拆分模块位于 `./skills/`（skillTrees / classes / resolver）。
 */

export {
  ALL_H4_ADVANCED_CLASS_IDS,
  ALL_H4_BASE_CLASS_IDS,
  H4_ADVANCED_CLASSES,
  H4_BASE_CLASSES,
} from './skills/classes';
export {
  ADVANCED_CLASS_TREE_THRESHOLD,
  computeHeroSpellEffectivenessMultiplier,
  resolveActiveHeroClass,
  resolveBaseClass,
  resolveEligibleAdvancedClasses,
} from './skills/resolver';
export {
  ALL_PRIMARY_SKILL_IDS,
  ALL_SECONDARY_SKILL_IDS,
  ARCHERY_ATTACK_FLAT_BY_RANK,
  ARCHERY_DEFENSE_DIVISOR_BY_RANK,
  canIncrementPrimarySkill,
  canIncrementSubSkill,
  clampSkillsToPrerequisites,
  clampSubSkillsToPrimaries,
  COMBAT_DEFENSE_PCT_BY_RANK,
  getPrimarySkillMaxAllowedRank,
  getRequiredPrimaryRankForSubRank,
  getSkillTreeTotal,
  getSubSkillMaxAllowedRank,
  getSubSkillUnlockPrimaryRank,
  H4_BASE_CLASS_STARTER_BUILDS,
  MAGIC_EFFECT_BONUS_PCT_BY_RANK,
  MAGIC_MANA_BONUS_BY_RANK,
  MAGIC_MANA_REGEN_BY_RANK,
  MAGIC_PRIMARY_SKILL_IDS,
  MAGIC_RESISTANCE_BY_RANK,
  MELEE_ATTACK_FLAT_BY_RANK,
  MELEE_DEFENSE_DIVISOR_BY_RANK,
  PRIMARY_PREREQ_PAIR_MAP,
  SECONDARY_SKILL_META,
  SKILL_TREE_META,
  TACTICS_DEFENSE_PCT_BY_RANK,
  TACTICS_INITIATIVE_BY_RANK,
  TACTICS_OFFENSE_PCT_BY_RANK,
  TACTICS_SPEED_BY_RANK,
} from './skills/skillTrees';
export type { PrimarySkillTreeMeta, SecondarySkillMeta } from './skills/skillTrees';

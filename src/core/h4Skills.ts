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
  canIncrementSubSkill,
  clampSubSkillsToPrimaries,
  getSkillTreeTotal,
  getSubSkillMaxAllowedRank,
  getSubSkillUnlockPrimaryRank,
  MAGIC_PRIMARY_SKILL_IDS,
  SECONDARY_SKILL_META,
  SKILL_TREE_META,
} from './skills/skillTrees';
export type { PrimarySkillTreeMeta, SecondarySkillMeta } from './skills/skillTrees';

/**
 * HUD 极简图标化数据与悬浮提示构造器聚合入口
 *
 * 统一对外转发 `src/ui/metadata/` 下的所有类型与构造函数，保持向后兼容。
 */

export type {
  HudIconBadge,
  HudTooltipMiniBadge,
  HudTooltipPayload,
} from './metadata/types';

export {
  getSkillRankLabel,
  PRIMARY_SKILL_META,
} from './metadata/skills';

export { buildUnitSpecialtyBadges } from './metadata/specialties';

export { buildUnitStatusBadges } from './metadata/statuses';

export {
  buildHeroEquipmentSlots,
  buildHeroTraitBadges,
} from './metadata/heroAndItems';

export {
  buildSpellCardTooltipPayload,
  buildSpellTooltipPayload,
  buildStatCellTooltip,
  getSpellIconKey,
  statKeyLabel,
} from './metadata/spellsAndStats';

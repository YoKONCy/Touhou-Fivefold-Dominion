/**
 * 单位特技图标与悬浮提示构造器（聚合转发入口）
 * 具体分类构造器已拆分至 src/ui/metadata/specialties/*
 */

import type { BattleUnit } from '@core/types';
import {
  appendCoreCombatSpecialtyBadges,
  appendMovementSpecialtyBadges,
  appendTacticalRangedAndStrikeBadges,
} from './specialties/combatAndMovement';
import {
  SPEC_BADGE_CONTROL,
  SPEC_BADGE_DEFENSE,
  SPEC_BADGE_HEAL,
  SPEC_BADGE_LIMIT,
  SPEC_BADGE_OFFENSE,
  SPEC_BADGE_UTILITY,
} from './specialties/constants';
import {
  appendControlAndResistanceBadges,
  appendCreatureTypeAndCasterBadges,
  appendHeavyOffenseAndUndeadSpecialtyBadges,
} from './specialties/controlAndTraits';
import type { HudIconBadge } from './types';

export {
  SPEC_BADGE_CONTROL,
  SPEC_BADGE_DEFENSE,
  SPEC_BADGE_HEAL,
  SPEC_BADGE_LIMIT,
  SPEC_BADGE_OFFENSE,
  SPEC_BADGE_UTILITY,
};

/** 构造单位全部特技图标列表（统一三段式详述 + 类别/生物类型彩色像素微标，零冗余括号） */
export function buildUnitSpecialtyBadges(unit: BattleUnit): HudIconBadge[] {
  const list: HudIconBadge[] = [];
  const ab = unit.abilities;

  appendMovementSpecialtyBadges(ab, list);
  appendCoreCombatSpecialtyBadges(unit, ab, list);
  appendTacticalRangedAndStrikeBadges(ab, list);
  appendControlAndResistanceBadges(ab, list);
  appendHeavyOffenseAndUndeadSpecialtyBadges(ab, list);
  appendCreatureTypeAndCasterBadges(unit, ab, list);

  return list;
}

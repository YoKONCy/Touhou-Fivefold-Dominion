/**
 * 战斗舞台战术高亮提示（StageOverlayHints）纯函数组装子系统
 */

import {
  canPlaceFootprintAt,
  checkSpellLineOfSight,
  getAvailableCorpseHp,
  getEffectiveSpellRange,
  getUnitMinDistance,
  getUnitOccupiedHexes,
  type getUnitReachableMap,
} from '@core/combatEngine';
import { validateSpellUnitTarget } from '@core/h4SpellExecutor';
import { hexKey, minHexSetDistance, reconstructHexPath, type HexCoord } from '@core/hex';
import type { BattleState, BattleUnit, ProjectileTrajectoryPreview } from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import type { StageOverlayHints } from '@renderer/battleStage';
import type { HoverAttackContext, HoverSpellContext } from './types';

/** 汇总当前回合与悬停交互态，生成供 PixiJS 舞台直接消费的战术高亮模型 */
export function buildBattleOverlayHints(params: {
  state: BattleState;
  activeUnit: BattleUnit | null;
  inspectedUnitId: string | null;
  hoveredHex: HexCoord | null;
  hoveredUnitId: string | null;
  isHumanTurn: boolean;
  isAnimating: boolean;
  declaringSpellCard: boolean;
  selectedSpellId: string | null;
  pendingSpellFirstUnitId: string | null;
  hoverSpellContext: HoverSpellContext | null;
  hoverAttackContext: HoverAttackContext | null;
  activeReachableMap: ReturnType<typeof getUnitReachableMap> | null;
  activeReachableHexKeys: ReadonlySet<string>;
  activeAttackableUnitIds: ReadonlySet<string>;
}): StageOverlayHints {
  const {
    state: st,
    activeUnit: act,
    inspectedUnitId,
    hoveredHex,
    hoveredUnitId,
    isHumanTurn,
    isAnimating,
    declaringSpellCard,
    selectedSpellId,
    pendingSpellFirstUnitId,
    hoverSpellContext,
    hoverAttackContext,
    activeReachableMap,
    activeReachableHexKeys,
    activeAttackableUnitIds,
  } = params;

  const emptySet = new Set<string>();
  const baseEmpty: StageOverlayHints = {
    activeUnitId: st.activeUnitId,
    selectedUnitId: inspectedUnitId,
    hoveredHex,
    hoveredUnitId,
    reachableHexKeys: emptySet,
    attackableUnitIds: emptySet,
    attackPreview: null,
    trajectoryPreview: null,
    movePathPreview: null,
    meleeCandidateHexes: [],
    meleeApproachHex: null,
    meleeTargetHex: null,
    targetingMode: 'normal',
    spellRange: 0,
    spellIgnoreLos: false,
    aoeRadius: 0,
    lineLength: 0,
    validSpellUnitIds: emptySet,
  };

  if (!act || !isHumanTurn || isAnimating || st.phase !== 'active') {
    return baseEmpty;
  }

  if (declaringSpellCard && act.signatureSpellCardId) {
    const card = TOUHOU_CATALOG.spellCards[act.signatureSpellCardId];
    if (card?.targetType === 'hex_line') {
      return {
        ...baseEmpty,
        targetingMode: 'spell_card_line',
        lineLength: card.lineLength ?? 14,
      };
    }
  }

  if (selectedSpellId) {
    const spell = TOUHOU_CATALOG.spells[selectedSpellId];
    if (spell) {
      const effRange = getEffectiveSpellRange(st, act, spell);
      const spellTraj = hoverSpellContext?.trajectory ?? null;
      if (spell.targetType === 'hex_aoe') {
        return {
          ...baseEmpty,
          targetingMode: 'spell_aoe',
          spellRange: effRange,
          spellIgnoreLos: Boolean(spell.ignoreLos),
          aoeRadius: spell.aoeRadius ?? 1,
          trajectoryPreview: spellTraj,
        };
      }
      if (spell.targetType === 'hex_empty') {
        const tmpl = spell.summonTemplateId ? TOUHOU_CATALOG.creatures[spell.summonTemplateId] : undefined;
        const casterHexes = getUnitOccupiedHexes(act);
        const emptyKeys = new Set<string>();
        for (const tile of Object.values(st.tiles)) {
          if (
            (effRange <= 0 || minHexSetDistance(casterHexes, [tile]) <= effRange) &&
            canPlaceFootprintAt(st, tile, tmpl?.footprint ?? '1x1', undefined, Boolean(tmpl?.abilities.flying))
          ) {
            emptyKeys.add(hexKey(tile));
          }
        }
        return {
          ...baseEmpty,
          targetingMode: 'spell_empty_hex',
          spellRange: effRange,
          spellIgnoreLos: true,
          validEmptyHexKeys: emptyKeys,
          trajectoryPreview: spellTraj,
        };
      }
      if (spell.targetType === 'unit_to_hex' && pendingSpellFirstUnitId) {
        const firstUnit = st.units[pendingSpellFirstUnitId];
        const emptyKeys = new Set<string>();
        if (firstUnit) {
          for (const tile of Object.values(st.tiles)) {
            if (canPlaceFootprintAt(st, tile, firstUnit.footprint, firstUnit.id, Boolean(firstUnit.abilities.flying))) {
              emptyKeys.add(hexKey(tile));
            }
          }
        }
        return {
          ...baseEmpty,
          targetingMode: 'spell_empty_hex',
          spellRange: 99,
          spellIgnoreLos: true,
          validEmptyHexKeys: emptyKeys,
          trajectoryPreview: spellTraj,
        };
      }
      if (spell.targetType === 'corpse_unit') {
        const validIds = new Set<string>();
        if (!st.battleSpellFlags?.necromancyWardActive) {
          for (const u of Object.values(st.units)) {
            if (u.kind !== 'creature' || u.statusEffects?.disintegrated) continue;
            if (effRange > 0 && getUnitMinDistance(act, u) > effRange) continue;
            if (getAvailableCorpseHp(st, u, TOUHOU_CATALOG) > 0) {
              validIds.add(u.id);
            }
          }
        }
        return {
          ...baseEmpty,
          targetingMode: 'spell_unit',
          spellRange: effRange,
          spellIgnoreLos: true,
          validSpellUnitIds: validIds,
          trajectoryPreview: spellTraj,
        };
      }

      const validIds = new Set<string>();
      for (const u of Object.values(st.units)) {
        if (u.status !== 'alive') continue;
        if (spell.targetType === 'unit_to_hex') {
          if (
            u.side === act.side &&
            !u.abilities.magicImmune &&
            !u.statusEffects?.sanctuary &&
            (effRange <= 0 || getUnitMinDistance(act, u) <= effRange)
          ) {
            validIds.add(u.id);
          }
          continue;
        }
        if (spell.targetType === 'ally_to_ally') {
          if (u.side !== act.side || u.abilities.magicImmune || u.statusEffects?.sanctuary) continue;
          if (effRange > 0 && getUnitMinDistance(act, u) > effRange) continue;
          if (!pendingSpellFirstUnitId && spell.specialEffect === 'sacrifice' && u.kind === 'hero') continue;
          if (pendingSpellFirstUnitId && u.id === pendingSpellFirstUnitId) continue;
          validIds.add(u.id);
          continue;
        }
        if (!validateSpellUnitTarget(spell, act, u, st, TOUHOU_CATALOG, false).ok) continue;
        if (
          (effRange <= 0 || getUnitMinDistance(act, u) <= effRange) &&
          (spell.ignoreLos || checkSpellLineOfSight(st, act, getUnitOccupiedHexes(u), u).canCast)
        ) {
          validIds.add(u.id);
        }
      }
      return {
        ...baseEmpty,
        targetingMode: 'spell_unit',
        spellRange: effRange,
        spellIgnoreLos: Boolean(spell.ignoreLos || spell.targetType === 'unit_to_hex' || spell.targetType === 'ally_to_ally'),
        validSpellUnitIds: validIds,
        trajectoryPreview: spellTraj,
      };
    }
  }

  const hoverCtx = hoverAttackContext;
  const isActAttacking = Boolean(hoverCtx && hoverCtx.isCurrentTurnAttacker && hoverCtx.preview.valid);

  // 远程射击畅通/半遮挡时绘制命中弹道；远程受阻且近战不可达时，依然强制绘制红色拦截轨迹以说明原因！
  let rangedTrajectory: ProjectileTrajectoryPreview | null = null;
  if (hoverCtx && hoverCtx.isCurrentTurnAttacker) {
    if (hoverCtx.preview.valid && hoverCtx.preview.isRanged) {
      rangedTrajectory = hoverCtx.preview.trajectory ?? null;
    } else if (!hoverCtx.preview.valid && hoverCtx.preview.trajectory) {
      rangedTrajectory = hoverCtx.preview.trajectory;
    }
  }

  let movePathPreview: HexCoord[] | null = null;
  if (!hoverCtx && hoveredHex && activeReachableMap && activeReachableMap.costs.has(hexKey(hoveredHex))) {
    movePathPreview = reconstructHexPath(activeReachableMap, hoveredHex);
  }

  return {
    ...baseEmpty,
    reachableHexKeys: activeReachableHexKeys,
    attackableUnitIds: activeAttackableUnitIds,
    attackPreview: isActAttacking ? hoverCtx!.preview : null,
    trajectoryPreview: rangedTrajectory,
    movePathPreview,
    meleeCandidateHexes: isActAttacking ? hoverCtx!.candidateApproachHexes : [],
    meleeApproachHex: isActAttacking ? hoverCtx!.chosenApproachHex : null,
    meleeTargetHex: isActAttacking && hoverCtx!.chosenApproachHex ? hoverCtx!.defender.pos : null,
  };
}

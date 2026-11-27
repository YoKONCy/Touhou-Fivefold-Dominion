/**
 * 战场悬停选位、施法瞄准诊断与 6 态战术指针纯函数计算子系统
 */

import {
  buildSpellTrajectoryPreview,
  canPlaceFootprintAt,
  checkSpellLineOfSight,
  findCorpseTargetAtHex,
  findUnitAtHex,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  getUnitMinDistance,
  getUnitOccupiedHexes,
  getValidMeleeApproachAnchors,
} from '@core/combatEngine';
import { validateSpellUnitTarget } from '@core/h4SpellExecutor';
import {
  getFootprintHexes,
  hexEquals,
  hexKey,
  hexToPixel,
  minHexSetDistance,
  type FootprintSize,
  type HexCoord,
} from '@core/hex';
import type { BattleState, BattleUnit, SpellDef } from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { STAGE_PROJECTION } from '@renderer/battleStage';
import type { HoverAttackContext, HoverSpellContext, TacticalCursorState } from './types';

function angleDiffAbs(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** 计算多格锚点在虚拟舞台中的中心像素 */
export function footprintCenterVirtual(
  state: BattleState,
  anchor: HexCoord,
  footprint: FootprintSize,
): { x: number; y: number } {
  const hexes = getFootprintHexes(anchor, footprint);
  let sx = 0;
  let sy = 0;
  for (const h of hexes) {
    const pt = hexToPixel(h, STAGE_PROJECTION, state.tiles[hexKey(h)]?.elevation ?? 1);
    sx += pt.x;
    sy += pt.y;
  }
  const n = Math.max(1, hexes.length);
  return { x: sx / n, y: sy / n };
}

/**
 * 原版 HoMM4 多格近战方位落脚选位算法
 */
export function pickDirectionalMeleeApproach(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  virtualPos: { x: number; y: number } | null,
): { chosen: HexCoord | null; candidates: HexCoord[] } {
  const rawCandidates = getValidMeleeApproachAnchors(state, attacker, defender, TOUHOU_CATALOG);
  if (rawCandidates.length === 0) return { chosen: null, candidates: [] };

  // H4 长武器（镇守狛犬）悬停选位优化：对非长手目标优先锁定隔 1 格（distance === 2）免反击突刺环，防止误走贴脸吃反击！
  let candidates = rawCandidates;
  if (attacker.abilities.longWeapon && !defender.abilities.longWeapon) {
    const defHexes = getUnitOccupiedHexes(defender);
    const safeDist2 = rawCandidates.filter(
      (c) => minHexSetDistance(getFootprintHexes(c, attacker.footprint), defHexes) === 2,
    );
    if (safeDist2.length > 0) {
      candidates = safeDist2;
    }
  }

  if (candidates.length === 1 || !virtualPos) {
    return { chosen: candidates[0], candidates };
  }

  const defCenter = footprintCenterVirtual(state, defender.pos, defender.footprint);
  const dx = virtualPos.x - defCenter.x;
  const dy = virtualPos.y - defCenter.y;
  const refPt =
    Math.hypot(dx, dy) >= 3
      ? virtualPos
      : footprintCenterVirtual(state, attacker.pos, attacker.footprint);
  const mouseAngle = Math.atan2(refPt.y - defCenter.y, refPt.x - defCenter.x);

  let best = candidates[0];
  let bestDiff = Infinity;
  for (const cand of candidates) {
    const cPt = footprintCenterVirtual(state, cand, attacker.footprint);
    const candAngle = Math.atan2(cPt.y - defCenter.y, cPt.x - defCenter.x);
    const diff = angleDiffAbs(mouseAngle, candAngle);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = cand;
    }
  }
  return { chosen: best, candidates };
}

/** 施法瞄准状态下的实时悬停诊断（射程、视线、具体阻挡体与飞行路径） */
export function computeHoverSpellContext(params: {
  state: BattleState;
  activeUnit: BattleUnit;
  spell: SpellDef;
  hoveredHex: HexCoord;
  pendingSpellFirstUnitId: string | null;
}): HoverSpellContext {
  const { state: st, activeUnit: act, spell, hoveredHex: hex, pendingSpellFirstUnitId } = params;
  const effRange = getEffectiveSpellRange(st, act, spell);
  const manaCost = getEffectiveSpellManaCost(st, act, spell);
  const casterHexes = getUnitOccupiedHexes(act);

  if (spell.targetType === 'hex_aoe') {
    const distance = minHexSetDistance(casterHexes, [hex]);
    const targetUnit = findUnitAtHex(st, hex, false);
    const traj = buildSpellTrajectoryPreview(st, act, spell, hex, null, effRange);
    const outOfRange = effRange > 0 && distance > effRange;
    const losBlocked = !spell.ignoreLos && !checkSpellLineOfSight(st, act, [hex]).canCast;
    const canCast = !outOfRange && !losBlocked;
    const reason = !canCast ? traj?.reason : undefined;
    const shortLabel = canCast ? spell.name : outOfRange ? '超出射程' : '视线受阻';
    return {
      spell,
      caster: act,
      manaCost,
      effRange,
      distance,
      targetHex: hex,
      targetUnit,
      canCast,
      reason,
      shortLabel,
      trajectory: traj,
    };
  }

  if (spell.targetType === 'hex_empty') {
    const distance = minHexSetDistance(casterHexes, [hex]);
    const tmpl = spell.summonTemplateId ? TOUHOU_CATALOG.creatures[spell.summonTemplateId] : undefined;
    const outOfRange = effRange > 0 && distance > effRange;
    const canDrop = canPlaceFootprintAt(st, hex, tmpl?.footprint ?? '1x1', undefined, Boolean(tmpl?.abilities.flying));
    const canCast = !outOfRange && canDrop;
    const reason = outOfRange
      ? `超出召唤射程（当前距离 ${distance} 格 / 上限 ${effRange} 格）`
      : !canDrop
        ? '该格存在障碍或已被占用，无法降落召唤单位'
        : undefined;
    const traj = buildSpellTrajectoryPreview(
      st,
      act,
      { ...spell, ignoreLos: true },
      hex,
      null,
      effRange,
      !canDrop && !outOfRange ? reason : undefined,
    );
    return {
      spell,
      caster: act,
      manaCost,
      effRange,
      distance,
      targetHex: hex,
      targetUnit: null,
      canCast,
      reason,
      shortLabel: canCast ? `召唤·${tmpl?.name ?? spell.name}` : outOfRange ? '超出射程' : '落点受阻',
      trajectory: traj,
    };
  }

  if (spell.targetType === 'corpse_unit') {
    const corpse = findCorpseTargetAtHex(st, hex, TOUHOU_CATALOG);
    const distance = corpse ? getUnitMinDistance(act, corpse) : minHexSetDistance(casterHexes, [hex]);
    if (st.battleSpellFlags?.necromancyWardActive) {
      return {
        spell,
        caster: act,
        manaCost,
        effRange,
        distance,
        targetHex: hex,
        targetUnit: corpse,
        canCast: false,
        reason: '战场处于「净土封冥」结界下，无法招魂复生',
        shortLabel: '净土封冥封印',
        trajectory: corpse
          ? buildSpellTrajectoryPreview(st, act, { ...spell, ignoreLos: true }, hex, corpse, effRange, '净土封冥结界封印')
          : null,
      };
    }
    if (!corpse) {
      return {
        spell,
        caster: act,
        manaCost,
        effRange,
        distance,
        targetHex: hex,
        targetUnit: null,
        canCast: false,
        reason: '请选择已阵亡或有减员的兵种残骸',
        shortLabel: '请选择残骸',
        trajectory: null,
      };
    }
    const outOfRange = effRange > 0 && distance > effRange;
    const reason = outOfRange ? `超出施法射程（当前距离 ${distance} 格 / 上限 ${effRange} 格）` : undefined;
    return {
      spell,
      caster: act,
      manaCost,
      effRange,
      distance,
      targetHex: hex,
      targetUnit: corpse,
      canCast: !outOfRange,
      reason,
      shortLabel: outOfRange ? '超出射程' : `招魂·${corpse.name}`,
      trajectory: buildSpellTrajectoryPreview(st, act, { ...spell, ignoreLos: true }, hex, corpse, effRange),
    };
  }

  if (spell.targetType === 'unit_to_hex') {
    if (!pendingSpellFirstUnitId) {
      const t = findUnitAtHex(st, hex, false);
      const distance = t ? getUnitMinDistance(act, t) : minHexSetDistance(casterHexes, [hex]);
      if (!t || t.side !== act.side) {
        return {
          spell,
          caster: act,
          manaCost,
          effRange,
          distance,
          targetHex: hex,
          targetUnit: t,
          canCast: false,
          reason: '【第1步】请选择一名己方友军作为传送对象',
          shortLabel: '请选择己方友军',
          trajectory: null,
        };
      }
      if (t.abilities.magicImmune || t.statusEffects?.sanctuary) {
        const reason = t.abilities.magicImmune ? `【${t.name}】魔法免疫，无法作为传送目标` : `【${t.name}】处于常世净域中`;
        return {
          spell,
          caster: act,
          manaCost,
          effRange,
          distance,
          targetHex: hex,
          targetUnit: t,
          canCast: false,
          reason,
          shortLabel: '目标免疫',
          trajectory: buildSpellTrajectoryPreview(st, act, { ...spell, ignoreLos: true }, hex, t, effRange, reason),
        };
      }
      const outOfRange = effRange > 0 && distance > effRange;
      return {
        spell,
        caster: act,
        manaCost,
        effRange,
        distance,
        targetHex: hex,
        targetUnit: t,
        canCast: !outOfRange,
        reason: outOfRange ? `超出施法射程（当前距离 ${distance} 格 / 上限 ${effRange} 格）` : undefined,
        shortLabel: outOfRange ? '超出射程' : '① 选择传送友军',
        trajectory: buildSpellTrajectoryPreview(st, act, { ...spell, ignoreLos: true }, hex, t, effRange),
      };
    }
    const firstUnit = st.units[pendingSpellFirstUnitId];
    const distance = firstUnit ? minHexSetDistance(getUnitOccupiedHexes(firstUnit), [hex]) : minHexSetDistance(casterHexes, [hex]);
    const canDrop = Boolean(
      firstUnit && canPlaceFootprintAt(st, hex, firstUnit.footprint, firstUnit.id, Boolean(firstUnit.abilities.flying)),
    );
    return {
      spell,
      caster: act,
      manaCost,
      effRange: 0,
      distance,
      targetHex: hex,
      targetUnit: firstUnit ?? null,
      canCast: canDrop,
      reason: canDrop ? undefined : '目标空地不可通行或空间不足以容纳该单位体积',
      shortLabel: canDrop ? '② 传送至此' : '落点不可通行',
      trajectory: firstUnit
        ? buildSpellTrajectoryPreview(
            st,
            firstUnit,
            { ...spell, ignoreLos: true },
            hex,
            null,
            0,
            canDrop ? undefined : '落点不可通行',
          )
        : null,
    };
  }

  if (spell.targetType === 'ally_to_ally') {
    const t = findUnitAtHex(st, hex, false);
    const distance = t ? getUnitMinDistance(act, t) : minHexSetDistance(casterHexes, [hex]);
    if (!pendingSpellFirstUnitId) {
      const validFirst = Boolean(
        t &&
          t.side === act.side &&
          !t.abilities.magicImmune &&
          !t.statusEffects?.sanctuary &&
          !(spell.specialEffect === 'sacrifice' && t.kind === 'hero'),
      );
      if (!validFirst || !t) {
        return {
          spell,
          caster: act,
          manaCost,
          effRange,
          distance,
          targetHex: hex,
          targetUnit: t,
          canCast: false,
          reason:
            t && spell.specialEffect === 'sacrifice' && t.kind === 'hero'
              ? '不可献祭英雄单位，请选择己方兵种'
              : '【第1步】请选择符合条件的己方友军',
          shortLabel: '请选择己方友军',
          trajectory: null,
        };
      }
      const outOfRange = effRange > 0 && distance > effRange;
      return {
        spell,
        caster: act,
        manaCost,
        effRange,
        distance,
        targetHex: hex,
        targetUnit: t,
        canCast: !outOfRange,
        reason: outOfRange ? `超出施法射程（当前距离 ${distance} 格 / 上限 ${effRange} 格）` : undefined,
        shortLabel: outOfRange
          ? '超出射程'
          : spell.specialEffect === 'sacrifice'
            ? '① 选择献祭友兵'
            : '① 选择替身友军',
        trajectory: buildSpellTrajectoryPreview(st, act, { ...spell, ignoreLos: true }, hex, t, effRange),
      };
    }
    const validSecond = Boolean(
      t &&
        t.side === act.side &&
        t.id !== pendingSpellFirstUnitId &&
        !t.abilities.magicImmune &&
        !t.statusEffects?.sanctuary,
    );
    if (!validSecond || !t) {
      return {
        spell,
        caster: act,
        manaCost,
        effRange,
        distance,
        targetHex: hex,
        targetUnit: t,
        canCast: false,
        reason: '【第2步】请选择另一名不同的己方友军',
        shortLabel: '请选择另一友军',
        trajectory: null,
      };
    }
    const outOfRange = effRange > 0 && distance > effRange;
    return {
      spell,
      caster: act,
      manaCost,
      effRange,
      distance,
      targetHex: hex,
      targetUnit: t,
      canCast: !outOfRange,
      reason: outOfRange ? `超出施法射程（当前距离 ${distance} 格 / 上限 ${effRange} 格）` : undefined,
      shortLabel: outOfRange
        ? '超出射程'
        : spell.specialEffect === 'sacrifice'
          ? '② 选择复生友军'
          : '② 选择被庇护者',
      trajectory: buildSpellTrajectoryPreview(st, act, { ...spell, ignoreLos: true }, hex, t, effRange),
    };
  }

  // 常规单体法术（enemy_unit / ally_unit / any_unit）
  const targetUnit = findUnitAtHex(st, hex, false);
  if (!targetUnit) {
    return {
      spell,
      caster: act,
      manaCost,
      effRange,
      distance: minHexSetDistance(casterHexes, [hex]),
      targetHex: hex,
      targetUnit: null,
      canCast: false,
      reason:
        spell.targetType === 'enemy_unit'
          ? '请将光标移至敌方单位上以选择施法目标'
          : spell.targetType === 'ally_unit'
            ? '请将光标移至己方友军上以选择施法目标'
            : '请将光标移至单位上以选择施法目标',
      shortLabel: '请选择目标',
      trajectory: null,
    };
  }

  const distance = getUnitMinDistance(act, targetUnit);
  const validCheck = validateSpellUnitTarget(spell, act, targetUnit, st, TOUHOU_CATALOG, false);
  const outOfRange = effRange > 0 && distance > effRange;
  const losBlocked =
    !spell.ignoreLos && !checkSpellLineOfSight(st, act, getUnitOccupiedHexes(targetUnit), targetUnit).canCast;

  // 即使目标不合法（如魔免）、超射程或视线被阻挡，只要符合阵营意图就绘制诊断飞行路径，让玩家秒懂原因！
  const matchesSideIntent =
    spell.targetType === 'any_unit' ||
    (spell.targetType === 'enemy_unit' && targetUnit.side !== act.side) ||
    (spell.targetType === 'ally_unit' && targetUnit.side === act.side);

  let overrideReason: string | undefined;
  if (!validCheck.ok) {
    overrideReason = validCheck.reason || validCheck.shortLabel;
  }

  const traj = matchesSideIntent
    ? buildSpellTrajectoryPreview(st, act, spell, hex, targetUnit, effRange, overrideReason)
    : null;

  const canCast = validCheck.ok && !outOfRange && !losBlocked;
  const reason = !canCast ? overrideReason ?? traj?.reason : undefined;
  const shortLabel = !validCheck.ok
    ? validCheck.shortLabel
    : outOfRange
      ? '超出射程'
      : losBlocked
        ? '视线受阻'
        : spell.name;

  return {
    spell,
    caster: act,
    manaCost,
    effRange,
    distance,
    targetHex: hex,
    targetUnit,
    canCast,
    reason,
    shortLabel,
    trajectory: traj,
  };
}

/** 计算当前悬停位置对应的 6 态像素战术指针类型、近战指向角度与提示标签 */
export function computeTacticalCursor(params: {
  state: BattleState;
  activeUnit: BattleUnit | null;
  isHumanTurn: boolean;
  hoveredHex: HexCoord | null;
  pointerPos: { x: number; y: number } | null;
  isAnimating: boolean;
  detailModalOpen: boolean;
  spellsDrawerOpen: boolean;
  declaringSpellCard: boolean;
  selectedSpellId: string | null;
  hoverSpellContext: HoverSpellContext | null;
  hoverAttackContext: HoverAttackContext | null;
  activeReachableHexKeys: ReadonlySet<string>;
}): TacticalCursorState {
  const {
    state: st,
    activeUnit: act,
    isHumanTurn,
    hoveredHex: hex,
    pointerPos,
    isAnimating,
    detailModalOpen,
    spellsDrawerOpen,
    declaringSpellCard,
    selectedSpellId,
    hoverSpellContext,
    hoverAttackContext,
    activeReachableHexKeys,
  } = params;

  if (
    !pointerPos ||
    !hex ||
    isAnimating ||
    st.phase !== 'active' ||
    detailModalOpen ||
    spellsDrawerOpen
  ) {
    return { kind: 'default', angleDeg: 0 };
  }

  if (declaringSpellCard && act && isHumanTurn) {
    if (getUnitOccupiedHexes(act).some((h) => hexEquals(h, hex))) {
      return { kind: 'blocked', angleDeg: 0 };
    }
    return { kind: 'spell', angleDeg: 0, label: '符卡宣言' };
  }

  if (selectedSpellId && act && isHumanTurn) {
    if (!hoverSpellContext) return { kind: 'default', angleDeg: 0 };
    return hoverSpellContext.canCast
      ? { kind: 'spell', angleDeg: 0, label: hoverSpellContext.shortLabel }
      : { kind: 'blocked', angleDeg: 0, label: hoverSpellContext.shortLabel };
  }

  const hoveredUnit = findUnitAtHex(st, hex, false);
  if (hoveredUnit && act && isHumanTurn) {
    if (hoveredUnit.side === act.side) {
      return { kind: 'inspect', angleDeg: 0, label: '查看友军' };
    }
    if (hoverAttackContext && hoverAttackContext.isCurrentTurnAttacker) {
      if (!hoverAttackContext.preview.valid) {
        return { kind: 'blocked', angleDeg: 0, label: '不可攻击' };
      }
      if (hoverAttackContext.preview.isRanged) {
        const tier = hoverAttackContext.preview.rangedPenaltyTier;
        const label =
          tier === 'full'
            ? '远程射击'
            : tier === 'half'
              ? '远程 1/2'
              : tier === 'quarter'
                ? '远程 1/4'
                : '远程 1/8';
        return {
          kind: tier === 'full' ? 'ranged' : 'ranged_penalty',
          angleDeg: 0,
          rangedPenaltyTier: tier,
          label,
        };
      }
      const fromAnchor = hoverAttackContext.chosenApproachHex ?? act.pos;
      const pFrom = footprintCenterVirtual(st, fromAnchor, act.footprint);
      const pTo = footprintCenterVirtual(st, hoveredUnit.pos, hoveredUnit.footprint);
      const angleDeg = (Math.atan2(pTo.y - pFrom.y, pTo.x - pFrom.x) * 180) / Math.PI;
      return {
        kind: 'melee',
        angleDeg,
        label: hoverAttackContext.preview.isLongWeaponPoke ? '长手隔格' : '近战突击',
      };
    }
  }

  if (act && isHumanTurn && !hoveredUnit) {
    if (activeReachableHexKeys.has(hexKey(hex)) && !hexEquals(hex, act.pos)) {
      return {
        kind: act.abilities.flying ? 'fly_move' : 'move',
        angleDeg: 0,
        label: act.abilities.flying ? '漂浮移动' : '移动',
      };
    }
    return { kind: 'blocked', angleDeg: 0, label: '不可通行' };
  }

  if (hoveredUnit) {
    return { kind: 'inspect', angleDeg: 0, label: '查看单位' };
  }
  return { kind: 'default', angleDeg: 0 };
}

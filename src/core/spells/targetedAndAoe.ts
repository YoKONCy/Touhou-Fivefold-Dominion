/**
 * 两步点选术式（隙间瞬移 / 替身雏偶 / 彼岸献祭）与区域范围术式（hex_aoe）执行器
 */

import { isImmuneToLivingHeal, isUndeadUnit } from '../creatureTypes';
import { getHexRange, hexDistance, hexKey } from '../hex';
import { computeUnitStats } from '../modifiers';
import type { SpellBranchOutcome, SpellCastContext } from './context';
import {
  canPlaceFootprintAt,
  computeAndApplySpellDamage,
  isTargetResistingHostileSpell,
  reviveAndHealUnit,
} from './helpers';

/** 两步点选：隙间瞬移（unit_to_hex） */
export function executeTeleportSpell(ctx: SpellCastContext): SpellBranchOutcome {
  const { state, unit, spell, command, deps, effectiveRange } = ctx;
  const tUnit = command.targetUnitId ? state.units[command.targetUnitId] : undefined;
  const dest = command.secondTargetHex ?? command.targetHex;
  if (!tUnit || tUnit.status !== 'alive' || tUnit.side !== unit.side) {
    return { ok: false, error: '请先选择一名己方存活单位作为传送目标', events: [] };
  }
  if (tUnit.abilities.magicImmune) {
    return { ok: false, error: '全魔法免疫目标无法被传送术指定', events: [] };
  }
  if (effectiveRange > 0 && deps.getUnitMinDistance(unit, tUnit) > effectiveRange) {
    return { ok: false, error: '传送目标超出施法距离', events: [] };
  }
  if (!dest || !canPlaceFootprintAt(state, dest, tUnit.footprint, tUnit.id, Boolean(tUnit.abilities.flying))) {
    return { ok: false, error: '目标落点不可通行或已被占据', events: [] };
  }
  tUnit.pos = { ...dest };
  ctx.targetHex = dest;
  ctx.affectedUnitIds.push(tUnit.id);
  ctx.displacedUnits.push({ unitId: tUnit.id, to: { ...dest } });
  ctx.noteText = '隙间瞬移!';
  state.actionLog.push(`✦ ${unit.name} 施放「${spell.name}」，撕开隙间将 ${tUnit.name} 瞬移至指定坐标！`);
  return null;
}

/** 两步点选：替身雏偶（Martyr）与彼岸献祭（Sacrifice） */
export function executeAllyToAllySpell(ctx: SpellCastContext): SpellBranchOutcome {
  const { state, unit, eff, command, catalog, events, deps, effectiveRange, schoolMult, touchStatusFlag } = ctx;
  const first = command.targetUnitId ? state.units[command.targetUnitId] : undefined;
  const second = command.secondTargetUnitId ? state.units[command.secondTargetUnitId] : undefined;
  if (!first || first.status !== 'alive' || first.side !== unit.side) {
    return { ok: false, error: '请先选择第一位己方友军单位', events: [] };
  }
  if (!second || second.status !== 'alive' || second.side !== unit.side || second.id === first.id) {
    return { ok: false, error: '请选择另一位不同的己方友军单位', events: [] };
  }
  if (first.abilities.magicImmune || second.abilities.magicImmune) {
    return { ok: false, error: '全魔法免疫单位不受该法术影响', events: [] };
  }
  if (
    effectiveRange > 0 &&
    (deps.getUnitMinDistance(unit, first) > effectiveRange ||
      deps.getUnitMinDistance(unit, second) > effectiveRange)
  ) {
    return { ok: false, error: '目标友军超出施法距离', events: [] };
  }
  ctx.targetHex = second.pos;
  ctx.affectedUnitIds.push(first.id, second.id);
  if (eff === 'martyr') {
    second.statusEffects.martyrProtectedByUnitId = first.id;
    touchStatusFlag(second, 'martyrProtectedByUnitId');
    ctx.noteText = `${first.name} 替身承伤!`;
    state.actionLog.push(`✝ ${unit.name} 施放「替身雏偶」：${second.name} 所受的一切伤害将由 ${first.name} 代为承受！`);
    return null;
  }

  if (first.kind === 'hero') {
    return { ok: false, error: '不可献祭英雄单位，请选择普通友军兵种', events: [] };
  }
  if (isImmuneToLivingHeal(second) && !isUndeadUnit(second)) {
    return { ok: false, error: '机械/元素/幻象单位无法接受彼岸献祭复生', events: [] };
  }
  const fStats = computeUnitStats(first, state, catalog);
  const sacrificedHp = (first.count - 1) * fStats.maxHp + first.currentHp;
  first.count = 0;
  first.currentHp = 0;
  first.status = 'dead';
  events.push({ type: 'UNIT_DIED', unitId: first.id });
  const res = reviveAndHealUnit(state, second, sacrificedHp * 1.25 * schoolMult, catalog, false);
  ctx.reviveMap[second.id] = res;
  if (res.healedHp > 0) ctx.healMap[second.id] = res.healedHp;
  ctx.noteText = `彼岸献祭 +${res.revivedCount}!`;
  state.actionLog.push(`☠ ${unit.name} 施放「彼岸献祭」，献祭 ${first.name}（${sacrificedHp} HP），令 ${second.name} 复生 ${res.revivedCount} 兵！`);
  return null;
}

/** 区域范围术式（Fireball / Inferno / Fire Ring / Cloud of Confusion / Quicksand） */
export function executeHexAoeSpell(ctx: SpellCastContext): SpellBranchOutcome {
  const {
    state,
    unit,
    spell,
    eff,
    command,
    catalog,
    events,
    deps,
    effectiveRange,
    mindDurationBonus,
    calcPower,
    touchStatusFlag,
    isTargetBlockedByLiving,
    isTargetBlockedByMind,
  } = ctx;
  const center = command.targetHex;
  if (!center || !state.tiles[hexKey(center)]) {
    return { ok: false, error: '请选择有效目标区域', events: [] };
  }
  if (effectiveRange > 0 && hexDistance(unit.pos, center) > effectiveRange) {
    return { ok: false, error: '目标区域超出射程', events: [] };
  }
  if (!spell.ignoreLos && !deps.checkSpellLineOfSight(state, unit, [center]).canCast) {
    return { ok: false, error: '视线被高耸障碍或单位阻挡，无法施法', events: [] };
  }
  ctx.targetHex = center;

  if (eff === 'quicksand') {
    const hexes = getHexRange(center, spell.aoeRadius ?? 1);
    let added = 0;
    for (const h of hexes) {
      const k = hexKey(h);
      const tile = state.tiles[k];
      if (!tile || tile.blocksGround) continue;
      if (!state.battleSpellFlags.quicksandHexKeys.includes(k)) {
        state.battleSpellFlags.quicksandHexKeys.push(k);
        added++;
      }
    }
    ctx.noteText = `泥沼区 (${added}格)!`;
    state.actionLog.push(`🏜 ${unit.name} 施放「泥沼陷地」，将目标区域化为吞噬脚步的流沙泥潭！`);
    return null;
  }

  const radius = spell.aoeRadius ?? 1;
  const areaHexes = getHexRange(center, radius).filter((h) =>
    eff === 'fire_ring' ? hexDistance(center, h) === 1 : true,
  );
  const areaKeys = new Set(areaHexes.map(hexKey));

  for (const candidate of Object.values(state.units)) {
    if (candidate.status !== 'alive' || candidate.side === unit.side) continue;
    const hitAny = deps.getUnitOccupiedHexes(candidate).some((h) => areaKeys.has(hexKey(h)));
    if (!hitAny) continue;
    ctx.affectedUnitIds.push(candidate.id);
    if (
      candidate.abilities.magicImmune ||
      candidate.statusEffects?.sanctuary ||
      isTargetResistingHostileSpell(state, unit, candidate, catalog)
    ) {
      ctx.damageMap[candidate.id] = { damage: 0, kills: 0, grazed: false };
      state.actionLog.push(`${candidate.name} 免疫并抵挡了「${spell.name}」！`);
      continue;
    }
    if (eff === 'cloud_of_confusion') {
      if (!isTargetBlockedByLiving(candidate) && !isTargetBlockedByMind(candidate)) {
        candidate.statusEffects.confusionRounds = Math.max(
          candidate.statusEffects.confusionRounds ?? 0,
          1 + mindDurationBonus,
        );
        touchStatusFlag(candidate, 'confusionRounds');
      }
      continue;
    }
    const raw = calcPower(spell.damageBase ?? 26, spell.level >= 4 ? 0.6 : 0.5);
    ctx.damageMap[candidate.id] = computeAndApplySpellDamage(
      state,
      unit,
      candidate,
      spell,
      raw,
      catalog,
      events,
      deps,
      0.8,
    );
  }
  state.actionLog.push(
    eff === 'cloud_of_confusion'
      ? `☁ ${unit.name} 释放「浓雾迷心」，令范围内 ${ctx.affectedUnitIds.length} 支敌军神志迷乱！`
      : `🔥 ${unit.name} 轰出范围术式「${spell.name}」，波及 ${ctx.affectedUnitIds.length} 支敌军！`,
  );
  return null;
}

/**
 * 随机打击掷骰、命中控场与异常、烈焰反伤、周身全扫/三翼裂袭/贯穿吐息与击杀/擦弹奖励子模块
 */

import { isImmuneToLivingEffects, isImmuneToMorale } from '../creatureTypes';
import { hexDistance, hexKey, hexRay, minHexSetDistance } from '../hex';
import { computeUnitStats } from '../modifiers';
import { nextInt, nextRandom } from '../rng';
import { enforceUnitStatusSlotCap, markStatusEffectOrder } from '../statusCap';
import { HERO_TRAIT_REGISTRY } from '../traits';
import type {
  BattleState,
  BattleUnit,
  CombatEvent,
  SecondaryHitReport,
  StatModifier,
  StrikeReport,
} from '../types';
import { applyDamageToUnit, calculateDamageRange } from './damage';
import { findUnitAtHex, getUnitOccupiedHexes } from './spatial';
import { computeMoraleLuckRates } from './turnQueue';
import type { CombatContentCatalog } from './types';

/** 按当前单位快照计算一次正式的打击伤害（支持两阶段同时反击与全 H4 特技） */
export function rollStrikeDamage(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  isRanged: boolean,
  isRetaliation: boolean,
  losMultiplier: number,
  losStatus: 'clear' | 'partial' | 'blocked',
  rangePenalty: number,
  catalog: CombatContentCatalog,
  chargeSteps = 0,
  extraMult = 1,
): StrikeReport {
  const range = calculateDamageRange(
    state,
    attacker,
    defender,
    attacker.pos,
    isRanged,
    losMultiplier,
    rangePenalty,
    catalog,
    chargeSteps,
  );
  const atkStats = computeUnitStats(attacker, state, catalog);
  const defStats = computeUnitStats(defender, state, catalog);

  if (defender.abilities.block && nextRandom(state.rng) < 0.35) {
    return {
      attackerId: attacker.id,
      defenderId: defender.id,
      damage: 0,
      kills: 0,
      isRanged,
      isRetaliation,
      grazed: false,
      grazeManaGain: 0,
      luckyCrit: false,
      highGroundBonus: range.highGroundBonus,
      losStatus,
      traitNotes: [...range.notes, '绝对格挡!'],
      blocked: true,
    };
  }

  let damage = Math.max(1, Math.round(nextInt(state.rng, range.minDamage, range.maxDamage) * extraMult));

  const atkRates = computeMoraleLuckRates(
    atkStats.morale,
    atkStats.luck,
    state.balancePreset,
    isImmuneToMorale(attacker),
  );
  const defRates = computeMoraleLuckRates(
    defStats.morale,
    defStats.luck,
    state.balancePreset,
    isImmuneToMorale(defender),
  );

  let luckyCrit = false;
  let unluckyHit = false;
  if (atkRates.attackLuckChance > 0 && nextRandom(state.rng) < atkRates.attackLuckChance) {
    luckyCrit = true;
    damage = Math.max(1, Math.round(damage * 1.5));
    range.notes.push('幸运暴击 ×1.5');
  } else if (atkRates.attackBadLuckChance > 0 && nextRandom(state.rng) < atkRates.attackBadLuckChance) {
    unluckyHit = true;
    damage = Math.max(1, Math.round(damage * 0.5));
    range.notes.push('厄运减半 ×0.5');
  }

  let defenderLucky = false;
  let defenderUnlucky = false;
  if (defRates.defenseLuckChance > 0 && nextRandom(state.rng) < defRates.defenseLuckChance) {
    defenderLucky = true;
    damage = Math.max(1, Math.round(damage * 0.5));
    range.notes.push('幸运护身 ×0.5');
  } else if (defRates.defenseBadLuckChance > 0 && nextRandom(state.rng) < defRates.defenseBadLuckChance) {
    defenderUnlucky = true;
    damage = Math.max(1, Math.round(damage * 1.25));
    range.notes.push('厄运破防 ×1.25');
  }

  let grazed = false;
  let grazeManaGain = 0;
  if (isRanged && defStats.grazeChance > 0) {
    if (nextRandom(state.rng) < defStats.grazeChance) {
      grazed = true;
      damage = Math.max(1, Math.round(damage * 0.75));
      grazeManaGain = 3;
    }
  }

  const immuneToControl = Boolean(isImmuneToLivingEffects(defender) || defender.abilities.magicImmune);
  let petrifyKills = 0;
  let appliedStatus: 'stunned' | 'terrified' | 'frozen' | 'aged' | 'poisoned' | undefined;

  if (!isRanged && attacker.abilities.freezingAttack && !defender.abilities.coldResistant && !defender.abilities.magicImmune) {
    if (nextRandom(state.rng) < 0.3) {
      appliedStatus = 'frozen';
    }
  }

  if (!immuneToControl) {
    if (attacker.abilities.stoneGaze && nextRandom(state.rng) < 0.18) {
      if (defender.kind === 'creature') {
        petrifyKills = nextInt(state.rng, 1, 2);
      } else {
        damage = Math.round(damage * 1.2);
      }
    }

    if (!appliedStatus && !isRanged && attacker.abilities.terrorOnHit && nextRandom(state.rng) < 0.38) {
      appliedStatus = 'terrified';
    } else if (!appliedStatus && !isRanged && attacker.abilities.stunOnHit) {
      const totalDefHp = Math.max(1, (defender.count - 1) * defStats.maxHp + defender.currentHp);
      const stunChance = Math.min(0.65, 0.28 + (damage / totalDefHp) * 0.35);
      if (nextRandom(state.rng) < stunChance) {
        appliedStatus = 'stunned';
      }
    } else if (!appliedStatus && !isRanged && attacker.abilities.agingOnHit && nextRandom(state.rng) < 0.35) {
      appliedStatus = 'aged';
    }
  }

  return {
    attackerId: attacker.id,
    defenderId: defender.id,
    damage,
    kills: 0,
    isRanged,
    isRetaliation,
    grazed,
    grazeManaGain,
    luckyCrit,
    unluckyHit: unluckyHit || undefined,
    defenderLucky: defenderLucky || undefined,
    defenderUnlucky: defenderUnlucky || undefined,
    highGroundBonus: range.highGroundBonus,
    losStatus,
    traitNotes: range.notes,
    blocked: false,
    petrifyKills: petrifyKills > 0 ? petrifyKills : undefined,
    appliedStatus,
  };
}

/** 对存活小兵堆叠施加石化即死等额外折损人数 */
export function applyBonusKills(
  state: BattleState,
  target: BattleUnit,
  bonusKills: number,
  events: CombatEvent[],
): number {
  if (target.status !== 'alive' || target.kind !== 'creature' || bonusKills <= 0) return 0;
  const actual = Math.min(target.count, bonusKills);
  target.count -= actual;
  if (target.count <= 0) {
    target.count = 0;
    target.currentHp = 0;
    target.status = 'dead';
    events.push({ type: 'UNIT_DIED', unitId: target.id });
    state.actionLog.push(`${target.name} 在魔眼石化下全军化作雕像！`);
  }
  return actual;
}

/** 命中后施加定身/震慑/冰封/衰老状态 */
export function applyHitStatusEffect(
  state: BattleState,
  target: BattleUnit,
  status: 'stunned' | 'terrified' | 'frozen' | 'aged' | 'poisoned' | undefined,
): void {
  if (!status || target.status !== 'alive') return;
  if (status === 'terrified') {
    target.statusEffects.terrifiedRounds = Math.max(target.statusEffects.terrifiedRounds, 1);
    markStatusEffectOrder(target, state, 'terrifiedRounds');
    enforceUnitStatusSlotCap(target);
    state.actionLog.push(`${target.name} 陷入「噩梦震慑」，下回合无法行动且防御下降！`);
  } else if (status === 'stunned') {
    target.statusEffects.stunnedRounds = Math.max(target.statusEffects.stunnedRounds, 1);
    markStatusEffectOrder(target, state, 'stunnedRounds');
    enforceUnitStatusSlotCap(target);
    state.actionLog.push(`${target.name} 被「符箓定身」，下回合将跳过行动！`);
  } else if (status === 'frozen') {
    target.statusEffects.frozenRounds = Math.max(target.statusEffects.frozenRounds ?? 0, 2);
    markStatusEffectOrder(target, state, 'frozenRounds');
    enforceUnitStatusSlotCap(target);
    state.actionLog.push(`❄ ${target.name} 被「寒霜冻结」，2 回合内无法行动！`);
  } else if (status === 'aged') {
    target.statusEffects.agedRounds = 3;
    target.modifiers = target.modifiers.filter((m) => m.spellId !== 'ability:aging');
    const ageMods: Array<Omit<StatModifier, 'id' | 'remainingRounds'>> = [
      { stat: 'attack', mode: 'percent', value: -0.25, sourceName: '特技·衰老触碰', spellPolarity: 'negative', spellId: 'ability:aging' },
      { stat: 'defense', mode: 'percent', value: -0.2, sourceName: '特技·衰老触碰', spellPolarity: 'negative', spellId: 'ability:aging' },
      { stat: 'speed', mode: 'percent', value: -0.5, sourceName: '特技·衰老触碰', spellPolarity: 'negative', spellId: 'ability:aging' },
      { stat: 'initiative', mode: 'percent', value: -0.5, sourceName: '特技·衰老触碰', spellPolarity: 'negative', spellId: 'ability:aging' },
    ];
    ageMods.forEach((m, idx) => {
      target.modifiers.push({
        ...m,
        id: `ability:aging:${state.commandSeq}:${idx}`,
        remainingRounds: 3,
      });
    });
    markStatusEffectOrder(target, state, 'agedRounds');
    enforceUnitStatusSlotCap(target);
    state.actionLog.push(`⏳ ${target.name} 遭受「衰老触碰」，3 回合内攻 -25%、防 -20%、速与先手减半！`);
  }
}

/** 结算近战命中「烈焰护盾」时的自动火焰反伤 */
export function resolveFireShield(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  strike: StrikeReport,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): void {
  if (strike.isRanged || strike.blocked || strike.damage <= 0) return;
  if (!defender.abilities.fireShield || attacker.status !== 'alive') return;
  if (attacker.abilities.fireResistant || attacker.abilities.magicImmune) return;

  const fsDamage = Math.max(1, Math.round(strike.damage * 0.22));
  const fsKills = applyDamageToUnit(state, attacker, fsDamage, catalog, events);
  strike.secondaryHits = strike.secondaryHits ?? [];
  strike.secondaryHits.push({
    targetId: attacker.id,
    damage: fsDamage,
    kills: fsKills,
    kind: 'fire_shield',
  });
  const loss = attacker.kind === 'creature' ? `（折损 ${fsKills} 兵）` : '';
  state.actionLog.push(`🔥 ${defender.name} 的「烈焰护盾」灼伤 ${attacker.name}，反弹 ${fsDamage} 点火焰伤害${loss}！`);
}

/** 擦弹成功后，为己方英雄补充灵力与符卡充能 */
export function grantGrazeReward(
  state: BattleState,
  defender: BattleUnit,
  manaGain: number,
  catalog: CombatContentCatalog,
): void {
  if (manaGain <= 0) return;
  const heroes = Object.values(state.units).filter(
    (u) => u.side === defender.side && u.status === 'alive' && u.kind === 'hero',
  );
  for (const h of heroes) {
    const hStats = computeUnitStats(h, state, catalog);
    h.mana = Math.min(hStats.maxMana, (h.mana ?? 0) + manaGain);
    h.spellCardCharge = Math.min(100, (h.spellCardCharge ?? 0) + 5);
  }
}

/** 击杀后触发 P 点成长、符卡充能与特质 onAfterKill 钩子 */
export function handlePostKillRewards(
  state: BattleState,
  killer: BattleUnit,
  victim: BattleUnit,
  kills: number,
): void {
  if (kills <= 0 || killer.status !== 'alive') return;
  if (killer.kind === 'hero') {
    const maxP = killer.maxPowerPoints ?? 4;
    killer.powerPoints = Math.min(maxP, Number(((killer.powerPoints ?? 0) + 0.35).toFixed(2)));
    killer.spellCardCharge = Math.min(100, (killer.spellCardCharge ?? 0) + 8);
  } else {
    for (const u of Object.values(state.units)) {
      if (u.side === killer.side && u.status === 'alive' && u.kind === 'hero') {
        u.spellCardCharge = Math.min(100, (u.spellCardCharge ?? 0) + 3);
      }
    }
  }

  for (const traitId of killer.innateTraitIds) {
    HERO_TRAIT_REGISTRY[traitId]?.onAfterKill?.({ state, killer, victim, kills });
  }
}

/** 结算主动近战附带的「周身全扫」「三翼裂袭」与「贯穿吐息」 */
export function resolveAreaMeleeEffects(
  state: BattleState,
  attacker: BattleUnit,
  primaryTarget: BattleUnit,
  strike: StrikeReport,
  chargeSteps: number,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): void {
  if (strike.isRanged) return;
  const secondaryHits: SecondaryHitReport[] = strike.secondaryHits ?? [];

  if (attacker.abilities.multipleAttack) {
    const atkHexes = getUnitOccupiedHexes(attacker);
    for (const candidate of Object.values(state.units)) {
      if (candidate.status !== 'alive' || candidate.side === attacker.side || candidate.id === primaryTarget.id) {
        continue;
      }
      if (minHexSetDistance(atkHexes, getUnitOccupiedHexes(candidate)) <= 1) {
        const sub = rollStrikeDamage(state, attacker, candidate, false, false, 1, 'clear', 1, catalog, chargeSteps, 0.85);
        const kills = sub.blocked ? 0 : applyDamageToUnit(state, candidate, sub.damage, catalog, events);
        secondaryHits.push({
          targetId: candidate.id,
          damage: sub.damage,
          kills,
          kind: 'cleave',
          blocked: sub.blocked,
        });
        if (!sub.blocked) {
          handlePostKillRewards(state, attacker, candidate, kills);
          resolveFireShield(state, attacker, candidate, { ...sub, secondaryHits }, catalog, events);
        }
      }
    }
  }

  if (attacker.abilities.threeHeadedAttack && !attacker.abilities.multipleAttack) {
    const atkHexes = getUnitOccupiedHexes(attacker);
    const tgtHexes = getUnitOccupiedHexes(primaryTarget);
    for (const candidate of Object.values(state.units)) {
      if (candidate.status !== 'alive' || candidate.side === attacker.side || candidate.id === primaryTarget.id) {
        continue;
      }
      const candHexes = getUnitOccupiedHexes(candidate);
      if (minHexSetDistance(atkHexes, candHexes) <= 1 && minHexSetDistance(tgtHexes, candHexes) <= 1) {
        const sub = rollStrikeDamage(state, attacker, candidate, false, false, 1, 'clear', 1, catalog, chargeSteps, 0.85);
        const kills = sub.blocked ? 0 : applyDamageToUnit(state, candidate, sub.damage, catalog, events);
        secondaryHits.push({
          targetId: candidate.id,
          damage: sub.damage,
          kills,
          kind: 'cleave',
          blocked: sub.blocked,
        });
        if (!sub.blocked) {
          handlePostKillRewards(state, attacker, candidate, kills);
          resolveFireShield(state, attacker, candidate, { ...sub, secondaryHits }, catalog, events);
        }
      }
    }
  }

  if (attacker.abilities.breathAttack) {
    const atkHexes = getUnitOccupiedHexes(attacker);
    const tgtHexes = getUnitOccupiedHexes(primaryTarget);
    const atkKeySet = new Set(atkHexes.map(hexKey));
    const tgtKeySet = new Set(tgtHexes.map(hexKey));

    let bestA = attacker.pos;
    let bestT = primaryTarget.pos;
    let bestD = Infinity;
    for (const ah of atkHexes) {
      for (const th of tgtHexes) {
        const d = hexDistance(ah, th);
        if (d < bestD) {
          bestD = d;
          bestA = ah;
          bestT = th;
        }
      }
    }
    const ray = hexRay(bestA, bestT, 4, (c) => Boolean(state.tiles[hexKey(c)]));
    const hitUnitIds = new Set<string>();
    for (const step of ray) {
      const k = hexKey(step);
      if (atkKeySet.has(k) || tgtKeySet.has(k)) continue;
      if (minHexSetDistance([step], tgtHexes) !== 1) continue;
      const behind = findUnitAtHex(state, step, false);
      if (behind && behind.id !== primaryTarget.id && behind.side !== attacker.side && !hitUnitIds.has(behind.id)) {
        hitUnitIds.add(behind.id);
        const fireMult = behind.abilities.fireResistant ? 0.5 : 1.0;
        const sub = rollStrikeDamage(state, attacker, behind, false, false, 1, 'clear', 1, catalog, 0, fireMult);
        const kills = sub.blocked ? 0 : applyDamageToUnit(state, behind, sub.damage, catalog, events);
        secondaryHits.push({
          targetId: behind.id,
          damage: sub.damage,
          kills,
          kind: 'breath',
          blocked: sub.blocked,
        });
        if (!sub.blocked) {
          handlePostKillRewards(state, attacker, behind, kills);
        }
        state.actionLog.push(
          `🐉 ${attacker.name} 的「贯穿吐息」波及身后 ${behind.name}，造成 ${sub.damage} 伤害！`,
        );
      }
      break;
    }
  }

  if (secondaryHits.length > 0) {
    strike.secondaryHits = secondaryHits;
  }
}

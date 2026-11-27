/**
 * 确定性战斗指令总分发器（MOVE / ATTACK / CAST_SPELL / DECLARE_SPELL_CARD / USE_POTION / WAIT / DEFEND）
 */

import {
  DARK_MAGIC_VULNERABILITY_MULT,
  isDarkMagicVulnerable,
  isImmuneToLivingEffects,
  isImmuneToLivingHeal,
  isImmuneToMorale,
  isUndeadUnit,
} from '../creatureTypes';
import { resolveActiveHeroClass } from '../h4Skills';
import { executeH4CastSpell } from '../h4SpellExecutor';
import { hexEquals, hexKey, hexRay, reconstructHexPath, type HexCoord } from '../hex';
import { computeUnitStats } from '../modifiers';
import { nextRandom } from '../rng';
import {
  enforceUnitStatusSlotCap,
  markStatusEffectOrder,
  upsertUnitModifier,
} from '../statusCap';
import { HERO_TRAIT_REGISTRY, type SpellPowerHookContext } from '../traits';
import type {
  BattleState,
  BattleUnit,
  CombatCommand,
  CombatEvent,
  CommandResult,
  StrikeReport,
} from '../types';
import {
  applyBonusKills,
  applyDamageToUnit,
  applyHitStatusEffect,
  computePoisonAttackDamage,
  grantGrazeReward,
  handlePostKillRewards,
  hasDoubleStrikeForMode,
  previewAttack,
  resolveAreaMeleeEffects,
  resolveFireShield,
  rollStrikeDamage,
} from './damage';
import {
  findUnitAtHex,
  getUnitMinDistance,
  getUnitOccupiedHexes,
  getUnitReachableMap,
} from './spatial';
import {
  checkRangedCapability,
  checkSpellLineOfSight,
  evaluateRangedRetaliation,
} from './terrainAndTrajectory';
import { advanceTurn } from './turnFlow';
import { consumeActiveUnitTurn, syncMidRoundMorale } from './turnQueue';
import type { CombatContentCatalog } from './types';

/** 唯一入口：执行任意确定性战斗指令，返回校验结果与结构化演出事件流 */
export function dispatchCombatCommand(
  state: BattleState,
  command: CombatCommand,
  catalog: CombatContentCatalog,
): CommandResult {
  if (state.phase !== 'active') {
    return { ok: false, error: '战斗已结束', events: [] };
  }
  if (state.activeUnitId !== command.unitId) {
    return { ok: false, error: '尚未轮到该单位行动', events: [] };
  }

  const unit = state.units[command.unitId];
  if (!unit || unit.status !== 'alive') {
    return { ok: false, error: '单位无法行动', events: [] };
  }

  const events: CombatEvent[] = [];
  state.commandSeq += 1;

  // ====== 1. 移动指令 ======
  if (command.type === 'MOVE') {
    const reachable = getUnitReachableMap(state, unit, catalog);
    const path = reconstructHexPath(reachable, command.to);
    if (!path || path.length <= 1) {
      return { ok: false, error: '目标格子不可到达', events: [] };
    }
    const prevQ = unit.pos.q;
    unit.pos = { ...command.to };
    if (unit.statusEffects?.sanctuary) {
      unit.statusEffects.sanctuary = false;
    }
    if (command.to.q !== prevQ) {
      unit.facing = command.to.q > prevQ ? 'right' : 'left';
    }
    events.push({ type: 'UNIT_MOVED', unitId: unit.id, path });
    state.hasCombatStarted = true;
    state.actionLog.push(
      unit.abilities.teleport || unit.abilities.globalTeleport
        ? `✦ ${unit.name} 瞬移至 (${command.to.q}, ${command.to.r})。`
        : `${unit.name} 移动至 (${command.to.q}, ${command.to.r})。`,
    );
    consumeActiveUnitTurn(state, unit);
    advanceTurn(state, catalog, events);
    return { ok: true, events };
  }

  // ====== 2. 攻击指令（含 HoMM4 两阶段同时反击与远程互射反击） ======
  if (command.type === 'ATTACK') {
    return executeAttackCommand(state, unit, command, catalog, events);
  }

  // ====== 3. 通用五系法术指令 ======
  if (command.type === 'CAST_SPELL') {
    const res = executeH4CastSpell(state, unit, command, catalog, events, {
      getUnitOccupiedHexes,
      getUnitMinDistance,
      findUnitAtHex,
      checkSpellLineOfSight,
      applyDamageToUnit,
      applyBonusKills,
      grantGrazeReward,
      handlePostKillRewards,
      consumeActiveUnitTurn,
      advanceTurn,
      syncMidRoundMorale,
    });
    if (res.ok) state.hasCombatStarted = true;
    return res;
  }

  // ====== 4. 东方专属符卡宣言指令 ======
  if (command.type === 'DECLARE_SPELL_CARD') {
    return executeSpellCardCommand(state, unit, command, catalog, events);
  }

  // ====== 5. 英雄腰带战斗秘药 ======
  if (command.type === 'USE_POTION') {
    return executePotionCommand(state, unit, command, catalog, events);
  }

  // ====== 6. 等待指令 ======
  if (command.type === 'WAIT') {
    if (unit.hasWaitedThisRound) {
      return { ok: false, error: '本回合已等待过一次', events: [] };
    }
    state.hasCombatStarted = true;
    unit.hasWaitedThisRound = true;
    state.turnQueue = state.turnQueue.filter((id) => id !== unit.id);
    state.waitQueue.unshift(unit.id);
    state.actionLog.push(`${unit.name} 暂缓行动，静待时机。`);
    events.push({ type: 'UNIT_WAITING', unitId: unit.id });
    advanceTurn(state, catalog, events);
    return { ok: true, events };
  }

  // ====== 7. 防御姿态指令 ======
  if (command.type === 'DEFEND') {
    state.hasCombatStarted = true;
    unit.isDefending = true;
    state.actionLog.push(`${unit.name} 进入防御姿态（护甲 +35%）。`);
    events.push({ type: 'UNIT_DEFENDING', unitId: unit.id });
    consumeActiveUnitTurn(state, unit);
    advanceTurn(state, catalog, events);
    return { ok: true, events };
  }

  return { ok: false, error: '未知指令类型', events: [] };
}

/** 执行近战/远程攻击与两阶段反击结算 */
function executeAttackCommand(
  state: BattleState,
  unit: BattleUnit,
  command: Extract<CombatCommand, { type: 'ATTACK' }>,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): CommandResult {
  const target = state.units[command.targetId];
  if (!target || target.status !== 'alive' || target.side === unit.side) {
    return { ok: false, error: '目标无效', events: [] };
  }

  const preview = previewAttack(
    state,
    unit.id,
    target.id,
    catalog,
    command.moveTo,
    Boolean(command.forceMelee),
  );
  if (!preview.valid) {
    return { ok: false, error: preview.reason ?? '无法攻击该目标', events: [] };
  }

  const chargeSteps = !preview.isRanged && preview.movePath && preview.movePath.length > 1 ? preview.movePath.length - 1 : 0;
  if (preview.moveTo && preview.movePath && preview.movePath.length > 1) {
    unit.pos = { ...preview.moveTo };
    events.push({ type: 'UNIT_MOVED', unitId: unit.id, path: preview.movePath });
  }
  if (unit.statusEffects?.sanctuary) {
    unit.statusEffects.sanctuary = false;
  }

  unit.facing = target.pos.q >= unit.pos.q ? 'right' : 'left';
  target.facing = unit.pos.q >= target.pos.q ? 'right' : 'left';

  const useRanged = preview.isRanged;
  const rangedCheck = useRanged ? checkRangedCapability(state, unit, target, catalog) : null;
  const defRangedCheck =
    useRanged && preview.willRetaliate ? evaluateRangedRetaliation(state, target, unit, catalog) : null;
  const retaliationInterceptor = defRangedCheck?.interceptedBy ?? null;
  const retaliationTarget = retaliationInterceptor ?? unit;

  let attackerStrike: StrikeReport | null = null;
  let defenderStrike: StrikeReport | null = null;

  const finalizeStrikeOnTarget = (
    striker: BattleUnit,
    victim: BattleUnit,
    strike: StrikeReport,
    strikerCountOverride?: number,
  ) => {
    if (strike.blocked) return;

    strike.kills = applyDamageToUnit(state, victim, strike.damage, catalog, events);
    if (strike.petrifyKills && victim.status === 'alive') {
      const pKills = applyBonusKills(state, victim, strike.petrifyKills, events);
      strike.petrifyKills = pKills;
      strike.kills += pKills;
    } else {
      strike.petrifyKills = undefined;
    }
    if (strike.grazed) grantGrazeReward(state, victim, strike.grazeManaGain, catalog);
    handlePostKillRewards(state, striker, victim, strike.kills);
    applyHitStatusEffect(state, victim, strike.appliedStatus);

    const strikerHeroCls =
      striker.kind === 'hero'
        ? resolveActiveHeroClass(
            striker.skills,
            striker.subSkills,
            catalog.advancedClasses,
            striker.selectedAdvancedClassId,
          )
        : null;

    if (
      striker.abilities.poisonAttack &&
      strike.damage > 0 &&
      victim.status === 'alive' &&
      !isImmuneToLivingEffects(victim) &&
      !victim.abilities.magicImmune
    ) {
      const pDmg = computePoisonAttackDamage(striker, victim, state, catalog, strikerCountOverride);
      if (pDmg > 0) {
        const pKills = applyDamageToUnit(state, victim, pDmg, catalog, events);
        strike.poisonInstantDamage = pDmg;
        strike.poisonInstantKills = pKills;
        handlePostKillRewards(state, striker, victim, pKills);
        if (victim.status === 'alive') {
          victim.statusEffects.poisonPower = Math.max(victim.statusEffects.poisonPower ?? 0, pDmg);
          markStatusEffectOrder(victim, state, 'poisonPower');
          enforceUnitStatusSlotCap(victim);
        }
        if (!strike.appliedStatus) strike.appliedStatus = 'poisoned';
        state.actionLog.push(
          `☠ ${striker.name} 触发「剧毒喷射」，瞬发毒伤 ${pDmg}${victim.kind === 'creature' ? `（折损 ${pKills} 兵）` : ''}${victim.status === 'alive' ? `，并令 ${victim.name} 每回合持续流失 ${victim.statusEffects.poisonPower} 生命！` : `，直接毒杀 ${victim.name}！`}`,
        );
      }
    }
    if (
      !strike.isRanged &&
      strike.damage > 0 &&
      victim.status === 'alive' &&
      strikerHeroCls?.passive?.inflictMinMoraleOnHit &&
      !isImmuneToMorale(victim) &&
      !victim.abilities.magicImmune
    ) {
      upsertUnitModifier(victim, state, {
        id: 'ability:inflict_min_morale',
        stat: 'morale',
        mode: 'flat',
        value: -20,
        sourceName: `职业·${strikerHeroCls.name}威压破胆`,
        remainingRounds: 3,
        spellPolarity: 'negative',
      });
      enforceUnitStatusSlotCap(victim);
      state.actionLog.push(`💀 ${striker.name} 的王者威压震撼 ${victim.name}，令其士气骤降至最低 -10（持续 3 回合）！`);
    }
    resolveFireShield(state, striker, victim, strike, catalog, events);

    if (strike.damage > 0 && striker.status === 'alive' && !striker.abilities.magicImmune && !striker.statusEffects?.sanctuary) {
      const mirrorRatio = victim.statusEffects?.painMirror
        ? 0.5
        : !strike.isRanged && victim.statusEffects?.retribution
          ? 0.35
          : 0;
      if (mirrorRatio > 0) {
        const refDmg = Math.max(1, Math.round(strike.damage * mirrorRatio));
        const refKills = applyDamageToUnit(state, striker, refDmg, catalog, events);
        strike.secondaryHits = strike.secondaryHits ?? [];
        strike.secondaryHits.push({
          targetId: striker.id,
          damage: refDmg,
          kills: refKills,
          kind: 'fire_shield',
        });
        state.actionLog.push(
          `🪞 ${victim.name} 的「${victim.statusEffects?.painMirror ? '因果水镜' : '因果报应'}」将 ${refDmg} 点伤害反射给 ${striker.name}！`,
        );
      }
    }

    const strikerClassVamp = Boolean(strikerHeroCls?.passive?.grantVampiric);
    if (
      !strike.isRanged &&
      strike.damage > 0 &&
      striker.status === 'alive' &&
      (striker.abilities.lifeDraining || striker.statusEffects?.vampiricTouch || strikerClassVamp) &&
      (!isImmuneToLivingHeal(striker) || isUndeadUnit(striker)) &&
      !isImmuneToLivingEffects(victim)
    ) {
      const drainRatio =
        striker.abilities.lifeDraining || striker.statusEffects?.vampiricTouch
          ? 0.5
          : strikerHeroCls?.passive?.vampiricRatio ?? 0.5;
      const drain = Math.max(1, Math.round(strike.damage * drainRatio));
      const sStats = computeUnitStats(striker, state, catalog);
      const maxHp = Math.max(1, sStats.maxHp);
      const curTotal = (striker.count - 1) * maxHp + striker.currentHp;
      const capTotal = striker.maxCount * maxHp;
      const nextTotal = Math.min(capTotal, curTotal + drain);
      if (nextTotal > curTotal) {
        const nextCount = Math.max(1, Math.ceil(nextTotal / maxHp));
        striker.count = nextCount;
        striker.currentHp = nextTotal - (nextCount - 1) * maxHp;
        state.actionLog.push(
          `🩸 ${striker.name} 触发「${striker.abilities.lifeDraining ? '吸血复苏' : '绯红吸血'}」，吸取了 ${nextTotal - curTotal} 点生命！`,
        );
      }
    }
  };

  if (preview.exchangeMode === 'simultaneous') {
    attackerStrike = rollStrikeDamage(
      state, unit, target, useRanged, false, 1,
      rangedCheck ? rangedCheck.los.status : 'clear',
      rangedCheck ? rangedCheck.rangePenalty : 1,
      catalog, chargeSteps,
    );
    defenderStrike = rollStrikeDamage(
      state, target, retaliationTarget, useRanged, true, 1,
      defRangedCheck ? defRangedCheck.los.status : 'clear',
      defRangedCheck ? defRangedCheck.rangePenalty : 1,
      catalog,
    );
    if (retaliationInterceptor) {
      defenderStrike.interceptedByUnitId = retaliationInterceptor.id;
    }
    const attackerPreCount = unit.count;
    const defenderPreCount = target.count;
    finalizeStrikeOnTarget(unit, target, attackerStrike, attackerPreCount);
    finalizeStrikeOnTarget(target, retaliationTarget, defenderStrike, defenderPreCount);
  } else if (preview.exchangeMode === 'attacker_first' || preview.exchangeMode === 'one_way') {
    attackerStrike = rollStrikeDamage(
      state, unit, target, useRanged, false, 1,
      rangedCheck ? rangedCheck.los.status : 'clear',
      rangedCheck ? rangedCheck.rangePenalty : 1,
      catalog, chargeSteps,
    );
    finalizeStrikeOnTarget(unit, target, attackerStrike);

    if (preview.exchangeMode === 'attacker_first' && target.status === 'alive') {
      defenderStrike = rollStrikeDamage(
        state, target, retaliationTarget, useRanged, true, 1,
        defRangedCheck ? defRangedCheck.los.status : 'clear',
        defRangedCheck ? defRangedCheck.rangePenalty : 1,
        catalog,
      );
      if (retaliationInterceptor) {
        defenderStrike.interceptedByUnitId = retaliationInterceptor.id;
      }
      finalizeStrikeOnTarget(target, retaliationTarget, defenderStrike);
    }
  } else {
    defenderStrike = rollStrikeDamage(
      state, target, retaliationTarget, useRanged, true, 1,
      defRangedCheck ? defRangedCheck.los.status : 'clear',
      defRangedCheck ? defRangedCheck.rangePenalty : 1,
      catalog,
    );
    if (retaliationInterceptor) {
      defenderStrike.interceptedByUnitId = retaliationInterceptor.id;
    }
    finalizeStrikeOnTarget(target, retaliationTarget, defenderStrike);

    if (unit.status === 'alive') {
      attackerStrike = rollStrikeDamage(
        state, unit, target, useRanged, false, 1,
        rangedCheck ? rangedCheck.los.status : 'clear',
        rangedCheck ? rangedCheck.rangePenalty : 1,
        catalog, chargeSteps,
      );
      finalizeStrikeOnTarget(unit, target, attackerStrike);
    }
  }

  if (useRanged && attackerStrike && !unit.abilities.unlimitedShots) {
    unit.ammo = Math.max(0, unit.ammo - 1);
  }
  if (defRangedCheck?.canRetaliate && defenderStrike && !target.abilities.unlimitedShots) {
    target.ammo = Math.max(0, target.ammo - 1);
  }
  if (defenderStrike && !target.abilities.unlimitedRetaliation) {
    target.hasRetaliatedThisRound = true;
  }

  if (attackerStrike && !useRanged) {
    resolveAreaMeleeEffects(state, unit, target, attackerStrike, chargeSteps, catalog, events);
  }

  if (
    attackerStrike &&
    hasDoubleStrikeForMode(unit, useRanged) &&
    unit.status === 'alive' &&
    target.status === 'alive' &&
    unit.statusEffects.stunnedRounds === 0 &&
    unit.statusEffects.terrifiedRounds === 0
  ) {
    const follow = rollStrikeDamage(
      state, unit, target, useRanged, false, 1,
      rangedCheck ? rangedCheck.los.status : 'clear',
      rangedCheck ? rangedCheck.rangePenalty : 1,
      catalog, 0,
    );
    finalizeStrikeOnTarget(unit, target, follow);
    attackerStrike.followUpStrike = {
      damage: follow.damage,
      kills: follow.kills,
      blocked: follow.blocked,
      luckyCrit: follow.luckyCrit,
      unluckyHit: follow.unluckyHit,
      defenderLucky: follow.defenderLucky,
      defenderUnlucky: follow.defenderUnlucky,
      grazed: follow.grazed,
      petrifyKills: follow.petrifyKills,
    };
    if (follow.secondaryHits && follow.secondaryHits.length > 0) {
      attackerStrike.secondaryHits = [...(attackerStrike.secondaryHits ?? []), ...follow.secondaryHits];
    }
  }

  const modeLabel =
    preview.exchangeMode === 'simultaneous'
      ? '同时交锋'
      : preview.exchangeMode === 'attacker_first'
        ? '先攻压制'
        : preview.exchangeMode === 'defender_first'
          ? '遭遇先攻反击'
          : useRanged
            ? '远程弹幕射击'
            : '单向突袭';
  const formatLoss = (victim: BattleUnit, kills: number) =>
    victim.kind === 'creature' ? `，折损 ${kills} 兵` : '';
  const describeStrike = (actor: BattleUnit, victim: BattleUnit, s: StrikeReport | null) => {
    if (!s) return `${actor.name} 未能出手`;
    if (s.blocked) return `${actor.name} 的攻击被 ${victim.name} 完全格挡!`;
    const followTxt = s.followUpStrike
      ? s.followUpStrike.blocked
        ? ' + 二段追击被格挡'
        : ` + 二段连击 ${s.followUpStrike.damage}${victim.kind === 'creature' ? `(-${s.followUpStrike.kills}兵)` : ''}`
      : '';
    const petrifyTxt = s.petrifyKills ? `(石化+${s.petrifyKills})` : '';
    const luckTags = [
      s.grazed ? '(擦弹!)' : '',
      s.luckyCrit ? '(幸运暴击!)' : '',
      s.unluckyHit ? '(厄运减半!)' : '',
      s.defenderLucky ? '(幸运护身!)' : '',
      s.defenderUnlucky ? '(厄运破防!)' : '',
    ].join('');
    return `${actor.name} 造成 ${s.damage} 伤害${formatLoss(victim, s.kills)}${petrifyTxt}${luckTags}${followTxt}`;
  };
  const atkSummary = describeStrike(unit, target, attackerStrike);
  const defSummary = defenderStrike
    ? retaliationInterceptor
      ? `；前卫 ${retaliationInterceptor.name} 替伤挡下远程反击，${describeStrike(target, retaliationTarget, defenderStrike)}`
      : `；${describeStrike(target, retaliationTarget, defenderStrike)}`
    : '';
  state.actionLog.push(`【${modeLabel}】${atkSummary}${defSummary}`);

  if (unit.status === 'alive' && unit.kind === 'hero') {
    unit.spellCardCharge = Math.min(100, (unit.spellCardCharge ?? 0) + 5);
  }
  if (target.status === 'alive' && target.kind === 'hero') {
    target.spellCardCharge = Math.min(100, (target.spellCardCharge ?? 0) + 6);
  }

  events.push({
    type: 'COMBAT_EXCHANGE',
    attackerId: unit.id,
    defenderId: target.id,
    retaliationTargetId: retaliationInterceptor ? retaliationInterceptor.id : undefined,
    mode: preview.exchangeMode,
    attackerStrike,
    defenderStrike,
  });

  state.hasCombatStarted = true;
  consumeActiveUnitTurn(state, unit);
  advanceTurn(state, catalog, events);
  return { ok: true, events };
}

/** 执行东方英雄专属符卡宣言指令 */
function executeSpellCardCommand(
  state: BattleState,
  unit: BattleUnit,
  command: Extract<CombatCommand, { type: 'DECLARE_SPELL_CARD' }>,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): CommandResult {
  if (unit.kind !== 'hero' || !unit.signatureSpellCardId) {
    return { ok: false, error: '该单位没有专属符卡', events: [] };
  }
  if (unit.statusEffects?.songOfPeaceRounds && unit.statusEffects.songOfPeaceRounds > 0) {
    return { ok: false, error: '受「镇魂神乐」安抚，当前无法宣言符卡', events: [] };
  }
  const card = catalog.spellCards[unit.signatureSpellCardId];
  if (!card) return { ok: false, error: '符卡数据缺失', events: [] };
  if ((unit.mana ?? 0) < card.manaCost) return { ok: false, error: '灵力不足', events: [] };
  if ((unit.spellCardCharge ?? 0) < card.chargeCost) {
    return { ok: false, error: `符卡充能不足 (${unit.spellCardCharge ?? 0}/${card.chargeCost}%)`, events: [] };
  }
  if (unit.statusEffects?.sanctuary) {
    unit.statusEffects.sanctuary = false;
  }

  const casterStats = computeUnitStats(unit, state, catalog);
  const castHook: SpellPowerHookContext = {
    state,
    caster: unit,
    isSpellCard: true,
    damageMultiplier: 1,
    notes: [],
  };
  for (const traitId of unit.innateTraitIds) {
    HERO_TRAIT_REGISTRY[traitId]?.onBeforeCast?.(castHook);
  }

  let lineHexes: HexCoord[] | undefined;
  const damageMap: Record<string, { damage: number; kills: number; grazed: boolean }> = {};

  if (card.targetType === 'hex_line') {
    const targetHex = command.targetHex;
    if (!targetHex || hexEquals(targetHex, unit.pos)) {
      return { ok: false, error: '请指定符卡炮击方向格', events: [] };
    }
    unit.facing = targetHex.q >= unit.pos.q ? 'right' : 'left';
    lineHexes = hexRay(
      unit.pos,
      targetHex,
      card.lineLength ?? 9,
      (c) => Boolean(state.tiles[hexKey(c)]),
    );
    const lineKeySet = new Set(lineHexes.map(hexKey));
    for (const candidate of Object.values(state.units)) {
      if (candidate.status !== 'alive' || candidate.side === unit.side) continue;
      const hitAny = getUnitOccupiedHexes(candidate).some((h) => lineKeySet.has(hexKey(h)));
      if (!hitAny) continue;

      if (candidate.abilities.magicImmune) {
        damageMap[candidate.id] = { damage: 0, kills: 0, grazed: false };
        state.actionLog.push(`${candidate.name} 全魔法免疫，完全无视了符卡【${card.name}】！`);
        continue;
      }

      const cStats = computeUnitStats(candidate, state, catalog);
      if (cStats.magicResistance >= 1) {
        damageMap[candidate.id] = { damage: 0, kills: 0, grazed: false };
        state.actionLog.push(`${candidate.name} 凭 100% 魔法抗性，完全抵挡了符卡【${card.name}】！`);
        continue;
      }
      let dmg = ((card.damageBase ?? 85) + casterStats.spellPower * 4.2) * castHook.damageMultiplier;
      if (isDarkMagicVulnerable(candidate)) {
        dmg *= DARK_MAGIC_VULNERABILITY_MULT;
      }
      if (candidate.abilities.chaosResistant && card.alignment === 'chaos') {
        dmg *= 0.75;
      }
      dmg *= 1 - cStats.magicResistance * 0.7;
      let grazed = false;
      if (cStats.grazeChance > 0 && nextRandom(state.rng) < cStats.grazeChance * 0.65) {
        grazed = true;
        dmg *= 0.75;
        grantGrazeReward(state, candidate, 4, catalog);
      }
      const finalDmg = Math.max(1, Math.round(dmg));
      const kills = applyDamageToUnit(state, candidate, finalDmg, catalog, events);
      damageMap[candidate.id] = { damage: finalDmg, kills, grazed };
      handlePostKillRewards(state, unit, candidate, kills);
    }
    if (card.id === 'remilia_gungnir' && unit.status === 'alive') {
      const totalLineDmg = Object.values(damageMap).reduce((sum, entry) => sum + entry.damage, 0);
      const vampHeal = Math.min(75, Math.round(totalLineDmg * 0.3));
      if (vampHeal > 0) {
        unit.currentHp = Math.min(casterStats.maxHp, unit.currentHp + vampHeal);
        state.actionLog.push(`🩸 蕾米莉亚以神枪汲取绯红生机，回复 ${vampHeal} 点生命！`);
      }
    }
  } else if (card.targetType === 'field_self') {
    for (const ally of Object.values(state.units)) {
      if (ally.status !== 'alive' || ally.side !== unit.side) continue;
      if (ally.abilities.magicImmune) continue;
      const aStats = computeUnitStats(ally, state, catalog);
      if (!isImmuneToLivingHeal(ally)) {
        ally.currentHp = Math.min(aStats.maxHp, ally.currentHp + 35);
      }
      if (card.id === 'eirin_astronomical_entombing' && aStats.maxMana > 0) {
        ally.mana = Math.min(aStats.maxMana, (ally.mana ?? 0) + 4);
      }
    }
  }

  if (card.fieldAura) {
    state.activeFieldAura = {
      id: card.fieldAura.id,
      spellCardId: card.id,
      name: card.fieldAura.name,
      casterUnitId: unit.id,
      casterSide: unit.side,
      remainingRounds: card.fieldAura.durationRounds,
      themeColor: card.fieldAura.themeColor,
      accentColor: card.fieldAura.accentColor,
      pattern: card.fieldAura.pattern,
      allyModifiers: card.fieldAura.allyModifiers,
      enemyModifiers: card.fieldAura.enemyModifiers,
      captured: false,
    };
  }

  unit.mana = Math.max(0, (unit.mana ?? 0) - card.manaCost);
  unit.spellCardCharge = 0;

  state.actionLog.push(`✦ 符卡宣言！${unit.name} 发动【${card.name}】！`);
  events.push({
    type: 'SPELL_CARD_DECLARED',
    casterId: unit.id,
    spellCardId: card.id,
    spellCardName: card.name,
    subtitle: card.subtitle,
    vfxKey: card.vfxKey,
    themeColor: card.fieldAura?.themeColor ?? unit.themeColor,
    accentColor: card.fieldAura?.accentColor ?? unit.accentColor,
    lineHexes,
    damageMap: Object.keys(damageMap).length > 0 ? damageMap : undefined,
    fieldActivated: Boolean(card.fieldAura),
  });

  state.hasCombatStarted = true;
  consumeActiveUnitTurn(state, unit);
  advanceTurn(state, catalog, events);
  return { ok: true, events };
}

/** 执行英雄腰带战斗秘药指令（不消耗行动权，每名英雄每回合限用 1 次） */
function executePotionCommand(
  state: BattleState,
  unit: BattleUnit,
  command: Extract<CombatCommand, { type: 'USE_POTION' }>,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): CommandResult {
  if (unit.kind !== 'hero') {
    return { ok: false, error: '仅英雄可使用腰带药水', events: [] };
  }
  if (unit.hasUsedPotionThisRound) {
    return { ok: false, error: '本回合已饮用过秘药，每名英雄每回合限用 1 次', events: [] };
  }
  const slot = unit.potions.find((p) => p.potionId === command.potionId && p.charges > 0);
  const def = catalog.potions[command.potionId];
  if (!slot || !def) {
    return { ok: false, error: '药水已耗尽', events: [] };
  }

  slot.charges -= 1;
  unit.hasUsedPotionThisRound = true;
  state.hasCombatStarted = true;
  const stats = computeUnitStats(unit, state, catalog);
  const herbMult = 1 + (unit.subSkills?.herbalism ?? 0) * 0.15;
  const scaledPower = Math.round(def.power * herbMult);
  let summary = '';

  if (def.effectType === 'heal') {
    const before = unit.currentHp;
    unit.currentHp = Math.min(stats.maxHp, unit.currentHp + scaledPower);
    summary = `回复 ${unit.currentHp - before} 生命`;
  } else if (def.effectType === 'mana_charge') {
    unit.mana = Math.min(stats.maxMana, (unit.mana ?? 0) + scaledPower);
    unit.spellCardCharge = Math.min(100, (unit.spellCardCharge ?? 0) + 15);
    summary = `灵力 +${scaledPower}、符卡充能 +15%`;
  } else {
    upsertUnitModifier(unit, state, {
      id: `potion:def:${state.commandSeq}`,
      stat: 'defense',
      mode: 'percent',
      value: scaledPower / 100,
      sourceName: `药水·${def.name}`,
      remainingRounds: 2,
      spellPolarity: 'positive',
    });
    upsertUnitModifier(unit, state, {
      id: `potion:graze:${state.commandSeq}`,
      stat: 'grazeChance',
      mode: 'flat',
      value: 0.15,
      sourceName: `药水·${def.name}`,
      remainingRounds: 2,
      spellPolarity: 'positive',
    });
    enforceUnitStatusSlotCap(unit);
    summary = `防御 +${scaledPower}%、擦弹 +15% (2回合)`;
  }

  state.actionLog.push(`${unit.name} 饮下「${def.name}」：${summary}。`);
  events.push({
    type: 'POTION_USED',
    unitId: unit.id,
    potionName: def.name,
    summary,
    color: def.color,
  });
  return { ok: true, events };
}

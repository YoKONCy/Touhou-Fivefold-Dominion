/**
 * 攻击预估器（悬停敌方单位时实时计算精确伤害、弹道阻挡诊断与反击风险）
 */

import { isImmuneToLivingEffects } from '../creatureTypes';
import {
  getFootprintHexes,
  hexEquals,
  minHexSetDistance,
  reconstructHexPath,
  type HexCoord,
} from '../hex';
import { computeUnitStats } from '../modifiers';
import type { AttackPreview, BattleState, BattleUnit } from '../types';
import {
  calculateDamageRange,
  canUnitRetaliateThisRound,
  computePoisonAttackDamage,
  resolveExchangeMode,
  simulateKills,
} from './damage';
import {
  findBestMeleeApproachHex,
  getUnitOccupiedHexes,
  getUnitReachableMap,
} from './spatial';
import {
  buildRangedTrajectoryPreview,
  checkRangedCapability,
  evaluateRangedRetaliation,
} from './terrainAndTrajectory';
import type { CombatContentCatalog } from './types';

/** 攻击预估器：悬停敌方单位时实时计算精确伤害、弹道阻挡诊断与反击风险 */
export function previewAttack(
  state: BattleState,
  attackerId: string,
  targetId: string,
  catalog: CombatContentCatalog,
  preferredMoveTo?: HexCoord,
  forceMelee = false,
): AttackPreview {
  const invalid = (reason: string): AttackPreview => ({
    valid: false,
    reason,
    isRanged: false,
    rangedPenaltyTier: 'full',
    rangedMultiplier: 1,
    exchangeMode: 'one_way',
    expectedMinDamage: 0,
    expectedMaxDamage: 0,
    expectedMinKills: 0,
    expectedMaxKills: 0,
    willRetaliate: false,
    retaliationMinDamage: 0,
    retaliationMaxDamage: 0,
    retaliationMinKills: 0,
    retaliationMaxKills: 0,
    losStatus: 'blocked',
    highGroundBonus: false,
    targetGrazeChance: 0,
    notes: [],
  });

  const attacker = state.units[attackerId];
  const defender = state.units[targetId];
  if (!attacker || !defender || attacker.status !== 'alive' || defender.status !== 'alive') {
    return invalid('无效目标');
  }
  if (attacker.side === defender.side) {
    return invalid('不可攻击友军');
  }
  if (defender.statusEffects?.sanctuary) {
    return invalid('目标隐于「常世净域」，不可被攻击');
  }
  if (attacker.statusEffects?.songOfPeaceRounds && attacker.statusEffects.songOfPeaceRounds > 0) {
    return invalid('受「镇魂神乐」安抚，当前无法发起攻击');
  }
  if (attacker.statusEffects?.cowardiceRounds && attacker.statusEffects.cowardiceRounds > 0) {
    const aS = computeUnitStats(attacker, state, catalog);
    const dS = computeUnitStats(defender, state, catalog);
    const atkTotalHp = (attacker.count - 1) * aS.maxHp + attacker.currentHp;
    const defTotalHp = (defender.count - 1) * dS.maxHp + defender.currentHp;
    if (defTotalHp > atkTotalHp) {
      return invalid('受「畏惧之瞳」震慑，不敢攻击总生命更高的敌军');
    }
  }

  const rangedCheck = checkRangedCapability(state, attacker, defender, catalog);
  const useRanged = !forceMelee && !preferredMoveTo && rangedCheck.canRanged;
  const rangedTrajectory =
    attacker.abilities.ranged && !forceMelee
      ? buildRangedTrajectoryPreview(state, attacker, defender, rangedCheck)
      : null;
  const rangedBlockReason =
    rangedTrajectory && rangedTrajectory.blocked ? rangedTrajectory.reason : undefined;

  let finalAtkPos = attacker.pos;
  let movePath: HexCoord[] | undefined;

  if (!useRanged) {
    if (attacker.abilities.noMelee) {
      const blockedReason = rangedBlockReason ?? '近战禁手：无法发起近战攻击';
      const baseInvalid = invalid(blockedReason);
      return {
        ...baseInvalid,
        rangedBlockReason,
        trajectory: rangedTrajectory,
        losStatus: rangedCheck.los.status,
      };
    }
    const approach = findBestMeleeApproachHex(state, attacker, defender, catalog, preferredMoveTo);
    if (!approach) {
      const blockedReason = forceMelee
        ? '超出本回合近战移动范围'
        : rangedBlockReason ?? '超出本回合移动与攻击范围';
      const atkHasAmmoHyp = Boolean(attacker.abilities.unlimitedShots) || attacker.ammo > 0;
      const defHasAmmoHyp = Boolean(defender.abilities.unlimitedShots) || defender.ammo > 0;
      const hypotheticalRanged = Boolean(
        !forceMelee && attacker.abilities.ranged && !attacker.abilities.noRanged && atkHasAmmoHyp && rangedCheck.distance > 1,
      );
      const hypAtk = calculateDamageRange(
        state,
        attacker,
        defender,
        attacker.pos,
        hypotheticalRanged,
        1,
        1,
        catalog,
      );
      const defStatsHyp = computeUnitStats(defender, state, catalog);
      const atkStatsHyp = computeUnitStats(attacker, state, catalog);
      const hypWillRet =
        !attacker.abilities.noRetaliation &&
        canUnitRetaliateThisRound(defender) &&
        (!hypotheticalRanged || Boolean(defender.abilities.ranged && !defender.abilities.noRanged && defHasAmmoHyp));
      const hypRet = hypWillRet
        ? calculateDamageRange(state, defender, attacker, defender.pos, hypotheticalRanged, 1, 1, catalog)
        : { minDamage: 0, maxDamage: 0 };
      const hypMode = resolveExchangeMode(attacker, defender, hypWillRet, hypotheticalRanged);
      return {
        valid: false,
        reason: blockedReason,
        rangedBlockReason,
        trajectory: rangedTrajectory,
        isRanged: hypotheticalRanged,
        rangedPenaltyTier: hypotheticalRanged ? rangedCheck.penaltyTier : 'full',
        rangedMultiplier: hypotheticalRanged ? Math.max(0.125, rangedCheck.rangePenalty || 1) : 1,
        exchangeMode: hypMode,
        expectedMinDamage: hypAtk.minDamage,
        expectedMaxDamage: hypAtk.maxDamage,
        expectedMinKills: simulateKills(defender, hypAtk.minDamage, defStatsHyp.maxHp),
        expectedMaxKills: simulateKills(defender, hypAtk.maxDamage, defStatsHyp.maxHp),
        willRetaliate: hypWillRet,
        retaliationMinDamage: hypRet.minDamage,
        retaliationMaxDamage: hypRet.maxDamage,
        retaliationMinKills: simulateKills(attacker, hypRet.minDamage, atkStatsHyp.maxHp),
        retaliationMaxKills: simulateKills(attacker, hypRet.maxDamage, atkStatsHyp.maxHp),
        losStatus: hypotheticalRanged ? rangedCheck.los.status : 'clear',
        highGroundBonus: hypAtk.highGroundBonus,
        targetGrazeChance: hypotheticalRanged ? defStatsHyp.grazeChance : 0,
        notes: [...hypAtk.notes, blockedReason],
      };
    }
    finalAtkPos = approach;
    if (!hexEquals(approach, attacker.pos)) {
      const reachable = getUnitReachableMap(state, attacker, catalog);
      movePath = reconstructHexPath(reachable, approach) ?? undefined;
    }
  }

  const chargeSteps = !useRanged && movePath && movePath.length > 1 ? movePath.length - 1 : 0;

  const atkRange = calculateDamageRange(
    state,
    attacker,
    defender,
    finalAtkPos,
    useRanged,
    1,
    useRanged ? rangedCheck.rangePenalty : 1,
    catalog,
    chargeSteps,
  );
  const defStats = computeUnitStats(defender, state, catalog);
  const atkStats = computeUnitStats(attacker, state, catalog);

  const strikeCountMult = attacker.abilities.doubleStrike ? 2 : 1;
  const totalMinDmg = atkRange.minDamage * strikeCountMult;
  const totalMaxDmg = atkRange.maxDamage * strikeCountMult;

  const finalMeleeDist = minHexSetDistance(
    getFootprintHexes(finalAtkPos, attacker.footprint),
    getUnitOccupiedHexes(defender),
  );
  const defenderMeleeReach = defender.abilities.longWeapon ? 2 : 1;
  const isLongWeaponPoke = !useRanged && finalMeleeDist > defenderMeleeReach;

  const fearSuppressRetaliation = Boolean(
    !useRanged &&
      (attacker.statusEffects?.auraOfFear || attacker.abilities.fearAttack) &&
      !isImmuneToLivingEffects(defender) &&
      !defender.abilities.magicImmune,
  );
  const defenderRetaliationReady = canUnitRetaliateThisRound(defender);
  let willRetaliate = false;
  let retaliationTarget: BattleUnit = attacker;
  let retaliationInterceptedBy: BattleUnit | null = null;
  let retRange = { minDamage: 0, maxDamage: 0, highGroundBonus: false, notes: [] as string[] };
  if (!attacker.abilities.noRetaliation && !fearSuppressRetaliation && defenderRetaliationReady) {
    if (!useRanged) {
      if (!isLongWeaponPoke) {
        willRetaliate = true;
        retRange = calculateDamageRange(state, defender, attacker, defender.pos, false, 1, 1, catalog);
      }
    } else {
      const defRet = evaluateRangedRetaliation(state, defender, attacker, catalog);
      if (defRet.canRetaliate) {
        willRetaliate = true;
        retaliationTarget = defRet.actualTarget;
        retaliationInterceptedBy = defRet.interceptedBy;
        retRange = calculateDamageRange(
          state,
          defender,
          retaliationTarget,
          defender.pos,
          true,
          1,
          defRet.rangePenalty,
          catalog,
        );
      }
    }
  }

  const retTargetStats =
    retaliationTarget.id === attacker.id
      ? atkStats
      : computeUnitStats(retaliationTarget, state, catalog);

  const exchangeMode = resolveExchangeMode(attacker, defender, willRetaliate, useRanged);
  const atkRawFS = useRanged
    ? Boolean(attacker.abilities.rangedFirstStrike)
    : Boolean(attacker.abilities.firstStrike);
  const defRawFS = useRanged
    ? Boolean(defender.abilities.rangedFirstStrike)
    : Boolean(defender.abilities.firstStrike);
  const notes = [...atkRange.notes];
  if (fearSuppressRetaliation) {
    notes.push(attacker.abilities.fearAttack ? '死灵恐惧(免反击)' : '幽冥威慑(免反击)');
  }
  if (!defenderRetaliationReady) notes.push('敌方本巡已反击');
  if (retaliationInterceptedBy) notes.push(`前卫替伤(${retaliationInterceptedBy.name})`);
  if (useRanged && rangedCheck.penaltyTier === 'half') notes.push('远程衰减 1/2');
  if (useRanged && rangedCheck.penaltyTier === 'quarter') notes.push('远程衰减 1/4');
  if (useRanged && rangedCheck.penaltyTier === 'eighth') notes.push('远程衰减 1/8');
  if (useRanged && attacker.abilities.longRange) notes.push('精准无衰减');
  if (useRanged && attacker.abilities.noObstaclePenalty) notes.push('无视普通障碍');
  if (isLongWeaponPoke) notes.push('长手隔格(免反击)');
  if (attacker.abilities.doubleStrike) notes.push('双重攻击(×2)');
  if (!useRanged && attacker.abilities.multipleAttack) notes.push('周身全扫');
  if (!useRanged && attacker.abilities.threeHeadedAttack) notes.push('三翼裂袭');
  if (!useRanged && attacker.abilities.breathAttack) notes.push('龙息贯穿');
  if (!useRanged && attacker.abilities.lifeDraining && !isImmuneToLivingEffects(defender)) notes.push('吸血复苏(50%)');
  if (attacker.abilities.poisonAttack && !isImmuneToLivingEffects(defender) && !defender.abilities.magicImmune) {
    const previewPoison = computePoisonAttackDamage(attacker, defender, state, catalog);
    notes.push(`剧毒喷射(瞬发+${previewPoison}/每回${previewPoison})`);
  }
  if (!useRanged && attacker.abilities.agingOnHit && !isImmuneToLivingEffects(defender) && !defender.abilities.magicImmune) notes.push('衰老触碰');
  if (!useRanged && attacker.abilities.freezingAttack && !defender.abilities.coldResistant && !defender.abilities.magicImmune) notes.push('寒霜冻结');
  if (!useRanged && defender.abilities.fireShield && !attacker.abilities.fireResistant && !attacker.abilities.magicImmune) {
    notes.push('敌方烈焰反伤!');
  }
  if (defender.abilities.block) notes.push('敌方格挡(35%)');
  if (attacker.abilities.noRetaliation) notes.push('不受反击');
  if (attacker.abilities.negateFirstStrike && defRawFS) notes.push('破先攻生效');
  if (defender.abilities.negateFirstStrike && atkRawFS) notes.push(useRanged ? '远程先攻被破除' : '先攻被破除');
  if (exchangeMode === 'simultaneous') notes.push('同时反击');
  if (exchangeMode === 'attacker_first') notes.push(useRanged ? '我方远程先攻压制' : '我方先攻压制');
  if (exchangeMode === 'defender_first') notes.push(useRanged ? '敌方远程先攻警告!' : '敌方先攻警告!');

  return {
    valid: true,
    rangedBlockReason: !useRanged ? rangedBlockReason : undefined,
    trajectory: useRanged ? rangedTrajectory : null,
    isRanged: useRanged,
    isLongWeaponPoke,
    rangedPenaltyTier: useRanged ? rangedCheck.penaltyTier : 'full',
    rangedMultiplier: useRanged ? rangedCheck.rangePenalty : 1,
    moveTo: hexEquals(finalAtkPos, attacker.pos) ? undefined : finalAtkPos,
    movePath,
    exchangeMode,
    expectedMinDamage: totalMinDmg,
    expectedMaxDamage: totalMaxDmg,
    expectedMinKills: simulateKills(defender, totalMinDmg, defStats.maxHp),
    expectedMaxKills: simulateKills(defender, totalMaxDmg, defStats.maxHp),
    willRetaliate,
    retaliationTargetId: retaliationInterceptedBy ? retaliationInterceptedBy.id : undefined,
    retaliationTargetName: retaliationInterceptedBy ? retaliationInterceptedBy.name : undefined,
    retaliationMinDamage: retRange.minDamage,
    retaliationMaxDamage: retRange.maxDamage,
    retaliationMinKills: simulateKills(retaliationTarget, retRange.minDamage, retTargetStats.maxHp),
    retaliationMaxKills: simulateKills(retaliationTarget, retRange.maxDamage, retTargetStats.maxHp),
    losStatus: useRanged ? rangedCheck.los.status : 'clear',
    highGroundBonus: atkRange.highGroundBonus,
    targetGrazeChance: useRanged ? defStats.grazeChance : 0,
    notes,
  };
}

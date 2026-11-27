/**
 * 战斗基础伤害区间计算与伤害/减员落地核心子模块
 * 攻击预览已拆分至 attackPreview.ts，随机打击掷骰与命中特技已拆分至 strikeEffects.ts，并在此统一重导出。
 */

import {
  DARK_VS_LIVING_DAMAGE_MULT,
  isDarkBonusTarget,
  isUndeadUnit,
} from '../creatureTypes';
import {
  ARCHERY_ATTACK_FLAT_BY_RANK,
  ARCHERY_DEFENSE_DIVISOR_BY_RANK,
  MELEE_ATTACK_FLAT_BY_RANK,
  MELEE_DEFENSE_DIVISOR_BY_RANK,
  resolveActiveHeroClass,
} from '../h4Skills';
import { getFootprintHexes, hexKey, type HexCoord } from '../hex';
import { computeUnitStats, getUnitEffectiveMagicResistance } from '../modifiers';
import { HERO_TRAIT_REGISTRY, type AttackHookContext } from '../traits';
import type { BattleState, BattleUnit, CombatEvent, SideId } from '../types';
import { getUnitOccupiedHexes } from './spatial';
import type { CombatContentCatalog } from './types';

export { previewAttack } from './attackPreview';
export {
  applyBonusKills,
  applyHitStatusEffect,
  grantGrazeReward,
  handlePostKillRewards,
  resolveAreaMeleeEffects,
  resolveFireShield,
  rollStrikeDamage,
} from './strikeEffects';

/** 毒瘴妖等「剧毒喷射」每单位基础剧毒威力 */
export const POISON_ATTACK_DAMAGE_PER_UNIT = 13;

/** 判定单位在本回合是否仍保有反击次数 */
export function canUnitRetaliateThisRound(unit: BattleUnit): boolean {
  return Boolean(unit.abilities.unlimitedRetaliation) || !unit.hasRetaliatedThisRound;
}

/** 判定单位在当前攻击模式（近战 / 远程）下是否触发二段连击（兼容近战宗师与射击宗师各自独立双打） */
export function hasDoubleStrikeForMode(
  unit: Pick<BattleUnit, 'abilities'>,
  isRanged: boolean,
): boolean {
  return Boolean(
    unit.abilities.doubleStrike ||
      (isRanged ? unit.abilities.rangedDoubleStrike : unit.abilities.meleeDoubleStrike),
  );
}

/** 判定攻防双方的结算模式（同时反击 / 攻击方先攻 / 防守方先攻 / 单向无反击） */
export function resolveExchangeMode(
  attacker: BattleUnit,
  defender: BattleUnit,
  willRetaliate: boolean,
  isRanged: boolean,
): 'simultaneous' | 'attacker_first' | 'defender_first' | 'one_way' {
  if (!willRetaliate) return 'one_way';
  const atkRawFS = isRanged
    ? Boolean(attacker.abilities.rangedFirstStrike)
    : Boolean(attacker.abilities.firstStrike);
  const defRawFS = isRanged
    ? Boolean(defender.abilities.rangedFirstStrike)
    : Boolean(defender.abilities.firstStrike);
  const atkFS = atkRawFS && !defender.abilities.negateFirstStrike;
  const defFS = defRawFS && !attacker.abilities.negateFirstStrike;
  if (atkFS && !defFS) return 'attacker_first';
  if (!atkFS && defFS) return 'defender_first';
  return 'simultaneous';
}

/** 计算剧毒喷射单次毒伤（按施毒方兵力独立结算，无视物理防御，受抗死结界与魔法抗性减免，异端者无视结界） */
export function computePoisonAttackDamage(
  striker: BattleUnit,
  victim: BattleUnit,
  state: BattleState,
  catalog: CombatContentCatalog,
  strikerCountOverride?: number,
): number {
  const victimMr = getUnitEffectiveMagicResistance(victim, state, catalog);
  if (victim.side !== striker.side && victimMr >= 1) {
    return 0;
  }
  const strikerCls =
    striker.kind === 'hero'
      ? resolveActiveHeroClass(
          striker.skills,
          striker.subSkills,
          catalog.advancedClasses,
          striker.selectedAdvancedClassId,
        )
      : null;
  const unitCount = Math.max(1, strikerCountOverride ?? striker.count);
  let dmg = unitCount * POISON_ATTACK_DAMAGE_PER_UNIT;
  if (
    !strikerCls?.passive?.ignoreEnemyWards &&
    (victim.abilities.deathWard || victim.statusEffects?.schoolWards?.death)
  ) {
    dmg *= 0.5;
  }
  dmg *= Math.max(0, 1 - victimMr);
  if (dmg <= 0) return 0;
  return Math.max(1, Math.round(dmg));
}

/** 计算一次打击的期望伤害区间（纯函数，用于攻击预测与正式结算） */
export function calculateDamageRange(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  attackerPos: HexCoord,
  isRanged: boolean,
  losMultiplier: number,
  rangePenalty: number,
  catalog: CombatContentCatalog,
  chargeSteps = 0,
): {
  minDamage: number;
  maxDamage: number;
  highGroundBonus: boolean;
  notes: string[];
} {
  const atkStats = computeUnitStats(attacker, state, catalog);
  const defStats = computeUnitStats(defender, state, catalog);

  const hookCtx: AttackHookContext = {
    state,
    attacker,
    defender,
    isRanged,
    damageMultiplier: 1,
    defensePenetration: 0,
    notes: [],
  };
  for (const traitId of attacker.innateTraitIds) {
    HERO_TRAIT_REGISTRY[traitId]?.onBeforeAttack?.(hookCtx);
  }

  const atkCls =
    attacker.kind === 'hero'
      ? resolveActiveHeroClass(
          attacker.skills,
          attacker.subSkills,
          catalog.advancedClasses,
          attacker.selectedAdvancedClassId,
        )
      : null;
  const defCls =
    defender.kind === 'hero'
      ? resolveActiveHeroClass(
          defender.skills,
          defender.subSkills,
          catalog.advancedClasses,
          defender.selectedAdvancedClassId,
        )
      : null;

  // 异端者（Heretic = 生命+混沌）无视敌方一切抗系结界与派系守护
  const ignoresWards = Boolean(atkCls?.passive?.ignoreEnemyWards);
  const deathWardActive =
    !ignoresWards &&
    Boolean(
      defender.abilities.deathWard &&
        (attacker.alignment === 'death' ||
          attacker.alignment === 'chaos' ||
          attacker.abilities.darkNature ||
          isUndeadUnit(attacker)),
    );
  const lifeWardActive = !ignoresWards && Boolean(defender.abilities.lifeWard && attacker.alignment === 'life');
  const chaosWardActive = !ignoresWards && Boolean(defender.abilities.chaosWard && attacker.alignment === 'chaos');
  const schoolWardActive = !ignoresWards && Boolean(defender.statusEffects?.schoolWards?.[attacker.alignment]);
  const wardDefenseMult = schoolWardActive || lifeWardActive || chaosWardActive ? 1.5 : deathWardActive ? 1.25 : 1;
  const bodyDefenseMult =
    (defender.abilities.insubstantial ? 2 : 1) * (isRanged && defender.abilities.skeletal ? 2 : 1);

  // 原版 HoMM4 格斗·近战/射击：按对应等级除以非英雄兵种的天然防御（下限保底 10），绝不削减敌方英雄防御！
  let creatureNatReduction = 0;
  if (attacker.kind === 'hero' && defender.kind === 'creature') {
    const defDivisor = !isRanged
      ? (MELEE_DEFENSE_DIVISOR_BY_RANK[attacker.subSkills?.melee ?? 0] ?? 1)
      : (ARCHERY_DEFENSE_DIVISOR_BY_RANK[attacker.subSkills?.archery ?? 0] ?? 1);
    if (defDivisor > 1 && defender.baseStats.defense > 10) {
      const reducedNatural = Math.max(10, defender.baseStats.defense / defDivisor);
      creatureNatReduction = defender.baseStats.defense - reducedNatural;
      hookCtx.notes.push(
        `${!isRanged ? '近战' : '射击'}破甲(÷${defDivisor}保底10)`,
      );
    }
  }
  const baseDefAfterHeroPierce = Math.max(
    Math.min(10, defStats.defense),
    defStats.defense - creatureNatReduction,
  );
  const effectiveDefense = Math.max(
    1,
    baseDefAfterHeroPierce * wardDefenseMult * bodyDefenseMult * (1 - hookCtx.defensePenetration),
  );
  if (ignoresWards && (defender.abilities.deathWard || defender.abilities.lifeWard || defender.abilities.chaosWard || defender.statusEffects?.schoolWards?.[attacker.alignment])) {
    hookCtx.notes.push('破界贯通(无视结界)');
  } else if (schoolWardActive) {
    hookCtx.notes.push('敌方派系守护(防+50%)');
  } else if (lifeWardActive) {
    hookCtx.notes.push('敌方抗生结界(防+50%)');
  } else if (chaosWardActive) {
    hookCtx.notes.push('敌方抗混结界(防+50%)');
  } else if (deathWardActive) {
    hookCtx.notes.push('敌方抗死结界(防+25%)');
  }
  if (defender.abilities.insubstantial) {
    hookCtx.notes.push('敌方虚无体质(双防+100%)');
  }
  if (isRanged && defender.abilities.skeletal) {
    hookCtx.notes.push('敌方骸骨体质(远防+100%)');
  }

  let heroModeAttackFlat = 0;
  if (attacker.kind === 'hero') {
    if (!isRanged) {
      const mRank = attacker.subSkills?.melee ?? 0;
      heroModeAttackFlat += MELEE_ATTACK_FLAT_BY_RANK[mRank] ?? 0;
      heroModeAttackFlat += atkCls?.passive?.heroMeleeAttackFlat ?? 0;
    } else {
      const aRank = attacker.subSkills?.archery ?? 0;
      heroModeAttackFlat += ARCHERY_ATTACK_FLAT_BY_RANK[aRank] ?? 0;
      heroModeAttackFlat += atkCls?.passive?.heroRangedAttackFlat ?? 0;
    }
    if (heroModeAttackFlat > 0) {
      hookCtx.notes.push(`${!isRanged ? '近战攻击' : '远程攻击'}+${heroModeAttackFlat}`);
    }
  }

  const precisionActive = Boolean(isRanged && (attacker.statusEffects?.precisionRounds ?? 0) > 0);
  const effectiveAttack = (precisionActive ? atkStats.attack * 1.25 : atkStats.attack) + heroModeAttackFlat;
  if (precisionActive) {
    hookCtx.notes.push('天眼狙定(+25%远攻)');
  }

  const atkDefRatio = Math.max(0.35, Math.min(2.6, (effectiveAttack + 10) / (effectiveDefense + 10)));

  // 高台远程减伤判定：目标处于更高地势且遭受来自低处的远程射击时，远程伤害 -25%（×0.75）
  const atkElev = Math.max(
    ...getFootprintHexes(attackerPos, attacker.footprint).map((h) => state.tiles[hexKey(h)]?.elevation ?? 1),
  );
  const defElev = Math.max(
    ...getUnitOccupiedHexes(defender).map((h) => state.tiles[hexKey(h)]?.elevation ?? 1),
  );
  const highGroundBonus = isRanged && defElev > atkElev;
  const highGroundMult = highGroundBonus ? 0.75 : 1;
  if (highGroundBonus) {
    hookCtx.notes.push('敌方高台掩护(-25%远伤)');
  }

  const chargeMult =
    !isRanged && attacker.abilities.charge && chargeSteps > 0
      ? 1 + Math.min(0.45, chargeSteps * 0.05)
      : 1;
  if (chargeMult > 1) {
    hookCtx.notes.push(`冲锋突击(+${Math.round((chargeMult - 1) * 100)}%)`);
  }

  const defenderTier = defender.kind === 'creature' ? catalog.creatures[defender.defId]?.tier ?? 1 : 0;
  const slayerMult = attacker.statusEffects?.slayer && defenderTier >= 4 ? 1.5 : 1;
  if (slayerMult > 1) {
    hookCtx.notes.push('屠龙魔刃(+50%)');
  }
  const giantSlayerMult = attacker.abilities.giantSlayer && defenderTier >= 4 ? 1.5 : 1;
  if (giantSlayerMult > 1) {
    hookCtx.notes.push('巨人杀手(+50%)');
  }

  const orderPurgeMult =
    isRanged && attacker.abilities.orderPurgeRanged && defender.alignment !== 'order' ? 1.2 : 1;
  if (orderPurgeMult > 1) {
    hookCtx.notes.push('净秽裁决(+20%)');
  }

  const fireAuraMult = !isRanged && attacker.statusEffects?.fireAura && !defender.abilities.fireResistant ? 1.25 : 1;
  if (fireAuraMult > 1) {
    hookCtx.notes.push('不死炎缠(+25%)');
  }

  const bloodlustMult =
    !isRanged && ((attacker.statusEffects?.bloodlustRounds ?? 0) > 0 || atkCls?.passive?.grantPermanentBloodlust)
      ? 1.25
      : 1;
  if (bloodlustMult > 1) {
    hookCtx.notes.push('鬼神狂战(+25%近战)');
  }

  const stealthMult = isRanged && defender.abilities.stealth ? 0.85 : 1;
  if (stealthMult < 1) {
    hookCtx.notes.push('影遁减伤(-15%)');
  }
  const defenderStealthSub = defender.kind === 'hero' ? (defender.subSkills?.stealth ?? 0) : 0;
  const subStealthMult = isRanged && defenderStealthSub > 0 ? Math.max(0.7, 1 - defenderStealthSub * 0.05) : 1;
  if (subStealthMult < 1) {
    hookCtx.notes.push(`潜行规避(-${Math.round((1 - subStealthMult) * 100)}%)`);
  }
  const blurMult = isRanged && (defender.statusEffects?.blur || defCls?.passive?.grantPermanentBlur) ? 0.65 : 1;
  if (blurMult < 1) {
    hookCtx.notes.push('蜃气残影(-35%)');
  }

  let heroCombatSkillMult = 1;
  if (atkCls?.passive) {
    if (!isRanged && atkCls.passive.heroMeleeDamagePct) {
      heroCombatSkillMult += atkCls.passive.heroMeleeDamagePct;
    } else if (isRanged && atkCls.passive.heroRangedDamagePct) {
      heroCombatSkillMult += atkCls.passive.heroRangedDamagePct;
    }
  }

  const powerMult = attacker.kind === 'hero' ? 1 + (attacker.powerPoints ?? 0) * 0.05 : 1;

  // 远程单位被迫近身肉搏时伤害衰减 -60%（英雄或拥有「近战无衰减」特技者免衰减）
  const meleePenalty =
    !isRanged && attacker.abilities.ranged && !attacker.abilities.noMeleePenalty && attacker.kind === 'creature'
      ? 0.4
      : 1;
  if (meleePenalty < 1) {
    hookCtx.notes.push('射手近战衰减(-60%)');
  }

  const moraleMult =
    attacker.roundMoraleState === 'good'
      ? 1.25
      : attacker.roundMoraleState === 'bad'
        ? 0.8
        : 1;
  if (moraleMult > 1) {
    hookCtx.notes.push('高士气(+25%)');
  } else if (moraleMult < 1) {
    hookCtx.notes.push('低士气(-20%)');
  }

  const darkVsLivingMult = isDarkBonusTarget(attacker, defender) ? DARK_VS_LIVING_DAMAGE_MULT : 1;
  if (darkVsLivingMult > 1) {
    hookCtx.notes.push('暗系蚀生(+15%)');
  }

  const coldResistMult = attacker.abilities.freezingAttack && defender.abilities.coldResistant ? 0.5 : 1;
  if (coldResistMult < 1) {
    hookCtx.notes.push('寒冰抗性(-50%)');
  }

  const balanceMult =
    state.balancePreset === 'equilibris_tuned' && attacker.kind === 'hero' ? 0.94 : 1;

  const totalMult =
    atkDefRatio *
    highGroundMult *
    chargeMult *
    slayerMult *
    giantSlayerMult *
    orderPurgeMult *
    fireAuraMult *
    bloodlustMult *
    stealthMult *
    subStealthMult *
    blurMult *
    heroCombatSkillMult *
    powerMult *
    meleePenalty *
    moraleMult *
    darkVsLivingMult *
    coldResistMult *
    balanceMult *
    (isRanged ? losMultiplier * rangePenalty : 1) *
    hookCtx.damageMultiplier;

  const count = Math.max(1, attacker.count);
  let minDamage = Math.max(1, Math.round(atkStats.minDamage * count * totalMult));
  let maxDamage = Math.max(minDamage, Math.round(atkStats.maxDamage * count * totalMult));

  if (attacker.statusEffects?.bless && !attacker.statusEffects?.curse) {
    minDamage = maxDamage;
    hookCtx.notes.push('神祝(满伤)');
  } else if (attacker.statusEffects?.curse && !attacker.statusEffects?.bless) {
    maxDamage = minDamage;
    hookCtx.notes.push('厄祟(低伤)');
  }

  return { minDamage, maxDamage, highGroundBonus, notes: hookCtx.notes };
}

/** 估算指定伤害对目标造成的减员数（不改动状态） */
export function simulateKills(
  target: BattleUnit,
  damage: number,
  maxHpPerUnit: number,
): number {
  if (target.status !== 'alive' || damage <= 0) return 0;
  const totalHp = (target.count - 1) * maxHpPerUnit + target.currentHp;
  const remaining = Math.max(0, totalHp - damage);
  if (remaining === 0) return target.count;
  const newCount = Math.ceil(remaining / maxHpPerUnit);
  return Math.max(0, target.count - newCount);
}

/** 真正将伤害施加到目标单位（含替身雏偶、致盲/和平破控、二重结界、御神护命、英雄倒地与符卡收取） */
export function applyDamageToUnit(
  state: BattleState,
  target: BattleUnit,
  damage: number,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
  allowMartyrRedirect = true,
): number {
  if (target.status !== 'alive' || damage <= 0) return 0;

  if (allowMartyrRedirect && target.statusEffects?.martyrProtectedByUnitId) {
    const martyr = state.units[target.statusEffects.martyrProtectedByUnitId];
    if (martyr && martyr.status === 'alive' && martyr.id !== target.id && martyr.side === target.side) {
      state.actionLog.push(`✝ 「替身雏偶」生效：${martyr.name} 替 ${target.name} 承受了 ${damage} 点伤害！`);
      return applyDamageToUnit(state, martyr, damage, catalog, events, false);
    }
    target.statusEffects.martyrProtectedByUnitId = undefined;
  }

  if (target.statusEffects?.blindRounds && target.statusEffects.blindRounds > 0) {
    target.statusEffects.blindRounds = 0;
    state.actionLog.push(`${target.name} 受创惊醒，破除了「宵暗蔽目」！`);
  }
  if (target.statusEffects?.songOfPeaceRounds && target.statusEffects.songOfPeaceRounds > 0) {
    target.statusEffects.songOfPeaceRounds = 0;
  }

  let effectiveDamage = damage;
  if (target.statusEffects?.tempShieldHp && target.statusEffects.tempShieldHp > 0) {
    const absorbed = Math.min(target.statusEffects.tempShieldHp, effectiveDamage);
    target.statusEffects.tempShieldHp -= absorbed;
    effectiveDamage -= absorbed;
    if (absorbed > 0) {
      state.actionLog.push(`🛡 「二重结界」为 ${target.name} 吸收了 ${absorbed} 点伤害（剩余护盾 ${target.statusEffects.tempShieldHp}）！`);
    }
    if (effectiveDamage <= 0) return 0;
  }

  const stats = computeUnitStats(target, state, catalog);
  const maxHp = stats.maxHp;
  const oldCount = target.count;
  const totalHp = (target.count - 1) * maxHp + target.currentHp;
  const remaining = Math.max(0, totalHp - effectiveDamage);

  if (remaining <= 0) {
    if (target.statusEffects?.guardianAngelLives && target.statusEffects.guardianAngelLives > 0) {
      target.statusEffects.guardianAngelLives -= 1;
      const savedCount = Math.max(1, Math.ceil(target.maxCount * 0.35));
      target.count = savedCount;
      target.currentHp = maxHp;
      state.actionLog.push(
        `👼 「御神护命」降临救赎 ${target.name}！抵消全灭并重聚 ${savedCount} 名战力（剩余护命 ${target.statusEffects.guardianAngelLives} 次）！`,
      );
      return Math.max(0, oldCount - savedCount);
    }

    target.count = 0;
    target.currentHp = 0;
    if (target.kind === 'hero') {
      target.status = 'knocked_out';
      target.powerPoints = 0;
      events.push({ type: 'UNIT_KNOCKED_OUT', unitId: target.id });
      state.actionLog.push(`${target.name} 满身疮痍倒下，P 点散落！`);

      if (
        state.activeFieldAura &&
        state.activeFieldAura.casterUnitId === target.id &&
        !state.activeFieldAura.captured
      ) {
        state.activeFieldAura.captured = true;
        const capturerSide: SideId = target.side === 'left' ? 'right' : 'left';
        const bonusText = '敌方符卡收取成功！己方存活英雄 P 点 +1.0、灵力 +10！';
        state.capturedSpellCards.push({
          spellCardName: state.activeFieldAura.name,
          bySide: capturerSide,
          bonusText,
        });
        for (const u of Object.values(state.units)) {
          if (u.side === capturerSide && u.status === 'alive' && u.kind === 'hero') {
            const uStats = computeUnitStats(u, state, catalog);
            u.powerPoints = Math.min(u.maxPowerPoints ?? 4, (u.powerPoints ?? 0) + 1.0);
            u.mana = Math.min(uStats.maxMana, (u.mana ?? 0) + 10);
          }
        }
        events.push({
          type: 'SPELL_CARD_CAPTURED',
          spellCardName: state.activeFieldAura.name,
          bySide: capturerSide,
          bonusText,
        });
        state.actionLog.push(`★ 符卡收取成功！击破 ${state.activeFieldAura.name}，${bonusText}`);
      }
    } else {
      target.status = 'dead';
      events.push({ type: 'UNIT_DIED', unitId: target.id });
      state.actionLog.push(`${target.name} 全军覆没。`);
    }
    return oldCount;
  }

  const newCount = Math.ceil(remaining / maxHp);
  const topHp = remaining - (newCount - 1) * maxHp;
  target.count = newCount;
  target.currentHp = topHp;
  return oldCount - newCount;
}

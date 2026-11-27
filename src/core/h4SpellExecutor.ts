/**
 * 《英雄无敌 IV (HoMM4)》全 142 法术统一结算总控入口
 *
 * 实际执行逻辑已按职责拆解至 `./spells/` 子目录：
 * - `helpers.ts`：射程/蓝耗/双轨威力/合法性校验/驱散/召唤与伤害通用辅助
 * - `summonAndNecromancy.ts`：自然召唤、死亡招魂复生、秩序幻象分身
 * - `targetedAndAoe.ts`：两步点选（瞬移/替身/献祭）与区域范围术式（hex_aoe）
 * - `selfAndMass.ts`：全场与自身即时术式
 * - `singleUnit.ts`：单体单位术式（特殊效果 + 标准结算）
 */

import type { CombatContentCatalog } from './combatEngine';
import {
  isImmuneToLivingEffects,
  isImmuneToMindSpells,
  isMindSpellDef,
} from './creatureTypes';
import {
  computeHeroSpellEffectivenessMultiplier,
  resolveActiveHeroClass,
} from './h4Skills';
import { computeUnitStats } from './modifiers';
import {
  enforceUnitStatusSlotCap,
  markStatusEffectOrder,
  upsertUnitModifier,
} from './statusCap';
import { HERO_TRAIT_REGISTRY, type SpellPowerHookContext } from './traits';
import type {
  BattleState,
  BattleUnit,
  CombatCommand,
  CombatEvent,
  CommandResult,
  StatModifier,
} from './types';
import type { SpellBranchOutcome, SpellCastContext, SpellExecutionDeps } from './spells/context';
import {
  computeDualTrackSpellPower,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  getSchoolSpellMultiplier,
  validateSpellUnitTarget,
} from './spells/helpers';
import { executeSelfAndMassSpell } from './spells/selfAndMass';
import { executeSingleUnitSpell } from './spells/singleUnit';
import {
  executeIllusionSpell,
  executeNecromancySpell,
  executeSummonCreatureSpell,
} from './spells/summonAndNecromancy';
import {
  executeAllyToAllySpell,
  executeHexAoeSpell,
  executeTeleportSpell,
} from './spells/targetedAndAoe';

export type { SpellExecutionDeps } from './spells/context';
export {
  allocateHpPoolToStack,
  canPlaceFootprintAt,
  cleanseNegativeEffects,
  cleansePositiveEffects,
  computeDualTrackSpellPower,
  evaluateIllusionSpell,
  findNearestOpenAnchor,
  getAvailableCorpseHp,
  getCasterSchoolRank,
  getCreaturePerUnitSpellFactor,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  getNecromancyCorpseRejection,
  getSchoolSpellMultiplier,
  isTargetResistingHostileSpell,
  isUnitOnHighlandPlatform,
  validateCorpseSpellTarget,
  validateSpellUnitTarget,
} from './spells/helpers';
export type { IllusionCastEvaluation, SpellTargetValidationResult } from './spells/helpers';

/** 统一执行任意 HoMM4 五系法术指令（CAST_SPELL） */
export function executeH4CastSpell(
  state: BattleState,
  unit: BattleUnit,
  command: Extract<CombatCommand, { type: 'CAST_SPELL' }>,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
  deps: SpellExecutionDeps,
): CommandResult {
  const spell = catalog.spells[command.spellId];
  if (!spell || !unit.knownSpellIds.includes(spell.id)) {
    return { ok: false, error: '未习得该术式', events: [] };
  }
  if (spell.isAdventureOnly || spell.targetType === 'adventure') {
    return { ok: false, error: `「${spell.name}」为大地图行军术式，战斗棋盘中不可施放`, events: [] };
  }
  if (unit.statusEffects?.songOfPeaceRounds && unit.statusEffects.songOfPeaceRounds > 0) {
    return { ok: false, error: '受「镇魂神乐」安抚，当前无法施放法术', events: [] };
  }

  const effectiveCost = getEffectiveSpellManaCost(state, unit, spell, catalog.advancedClasses);
  if ((unit.mana ?? 0) < effectiveCost) {
    return { ok: false, error: `灵力不足（需要 ${effectiveCost} MP）`, events: [] };
  }

  // 施法行动解除自身圣域庇护
  if (unit.statusEffects?.sanctuary) {
    unit.statusEffects.sanctuary = false;
  }

  const casterStats = computeUnitStats(unit, state, catalog);
  const castHook: SpellPowerHookContext = {
    state,
    caster: unit,
    isSpellCard: false,
    damageMultiplier: 1,
    notes: [],
  };
  for (const traitId of unit.innateTraitIds) {
    HERO_TRAIT_REGISTRY[traitId]?.onBeforeCast?.(castHook);
  }

  const eff = spell.specialEffect ?? 'standard';
  const schoolMult = getSchoolSpellMultiplier(unit, spell);

  const activeHeroClass =
    unit.kind === 'hero'
      ? resolveActiveHeroClass(unit.skills, unit.subSkills, catalog.advancedClasses, unit.selectedAdvancedClassId)
      : null;
  const spellCategory: 'damage' | 'heal' | 'revive' | 'summon' | 'raise' | 'mind' | 'buff_debuff' =
    eff === 'summon_creature'
      ? 'summon'
      : eff === 'raise_undead' || eff === 'animate_dead' || eff === 'death_call'
        ? 'raise'
        : spell.reviveBase || eff === 'divine_intervention' || eff === 'guardian_angel'
          ? 'revive'
          : spell.healBase || eff === 'heavenly_shield' || eff === 'regeneration'
            ? 'heal'
            : eff === 'blind' || eff === 'hypnotize' || eff === 'berserk' || eff === 'confusion' || eff === 'cloud_of_confusion' || eff === 'cowardice' || eff === 'song_of_peace'
              ? 'mind'
              : spell.damageBase || eff === 'holy_word' || eff === 'holy_shout' || eff === 'hand_of_death' || eff === 'disintegrate' || eff === 'chain_lightning' || eff === 'armageddon' || eff === 'life_drain' || eff === 'sparks' || eff === 'banish'
                ? 'damage'
                : 'buff_debuff';

  const subAndClassMult =
    unit.kind === 'hero' && spell.alignment !== 'might'
      ? computeHeroSpellEffectivenessMultiplier(
          unit.skills,
          unit.subSkills,
          activeHeroClass,
          spell.alignment,
          spellCategory,
          {
            spellId: spell.id,
            isFireSpell: Boolean(spell.isFireSpell),
            isIllusion: eff === 'create_illusion' || eff === 'phantom_image',
          },
        )
      : 1;
  const lifeDurationBonus =
    unit.kind === 'hero' && spell.alignment === 'life' && (unit.subSkills?.spirituality ?? 0) >= 3 ? 1 : 0;
  const mindDurationBonus =
    unit.kind === 'hero' && (unit.subSkills?.charm ?? 0) >= 3 ? 1 : 0;

  const calcPower = (baseValue: number, heroSpWeight: number): number =>
    computeDualTrackSpellPower({
      caster: unit,
      baseValue,
      heroSpWeight,
      casterSpellPower: casterStats.spellPower,
      schoolMult,
      subAndClassMult,
      traitMult: castHook.damageMultiplier,
      catalog,
    });

  // 记录施法前各存活单位的有效士气，以便士气法术或驱散后即时重排回合梯队
  const preMoraleByUnitId = new Map<string, number>();
  for (const u of Object.values(state.units)) {
    if (u.status === 'alive') {
      preMoraleByUnitId.set(u.id, computeUnitStats(u, state, catalog).morale);
    }
  }
  const statusModifiedTargets = new Set<BattleUnit>();
  const touchStatusFlag = (t: BattleUnit, flagKey: string) => {
    markStatusEffectOrder(t, state, flagKey);
    statusModifiedTargets.add(t);
  };
  const pushSpellModifier = (t: BattleUnit, mod: StatModifier) => {
    upsertUnitModifier(t, state, { ...mod, spellId: mod.spellId ?? spell.id });
    statusModifiedTargets.add(t);
  };

  const isMindSpell = spellCategory === 'mind' || isMindSpellDef(spell);
  const isTargetBlockedByLiving = (t: BattleUnit) => Boolean(spell.livingOnly && isImmuneToLivingEffects(t));
  const isTargetBlockedByMind = (t: BattleUnit) => Boolean(isMindSpell && isImmuneToMindSpells(t));
  const effectiveRange = getEffectiveSpellRange(state, unit, spell);

  const requireSingleUnit = (allowDead = false): BattleUnit | string => {
    const tUnit = command.targetUnitId ? state.units[command.targetUnitId] : undefined;
    if (!tUnit) return '请选择有效目标单位';
    const check = validateSpellUnitTarget(spell, unit, tUnit, state, catalog, allowDead);
    if (!check.ok) return check.reason;
    if (effectiveRange > 0 && deps.getUnitMinDistance(unit, tUnit) > effectiveRange) {
      return '目标超出施法距离';
    }
    if (!spell.ignoreLos && !allowDead && !deps.checkSpellLineOfSight(state, unit, deps.getUnitOccupiedHexes(tUnit), tUnit).canCast) {
      return '视线被高耸障碍或单位阻挡，无法施法';
    }
    return tUnit;
  };

  const ctx: SpellCastContext = {
    state,
    unit,
    spell,
    eff,
    command,
    catalog,
    events,
    deps,
    casterStats,
    castHook,
    schoolMult,
    lifeDurationBonus,
    mindDurationBonus,
    effectiveRange,
    calcPower,
    touchStatusFlag,
    pushSpellModifier,
    isTargetBlockedByLiving,
    isTargetBlockedByMind,
    requireSingleUnit,
    affectedUnitIds: [],
    damageMap: {},
    healMap: {},
    reviveMap: {},
    summonedUnitIds: [],
    displacedUnits: [],
    targetHex: unit.pos,
    noteText: undefined,
  };

  // 按目标模型与术式类型分发至对应子执行器
  let abortResult: SpellBranchOutcome = null;
  if (eff === 'summon_creature') {
    abortResult = executeSummonCreatureSpell(ctx);
  } else if (eff === 'raise_undead' || eff === 'animate_dead' || eff === 'death_call') {
    abortResult = executeNecromancySpell(ctx);
  } else if (eff === 'teleport') {
    abortResult = executeTeleportSpell(ctx);
  } else if (eff === 'martyr' || eff === 'sacrifice') {
    abortResult = executeAllyToAllySpell(ctx);
  } else if (eff === 'create_illusion' || eff === 'phantom_image') {
    abortResult = executeIllusionSpell(ctx);
  } else if (spell.targetType === 'hex_aoe') {
    abortResult = executeHexAoeSpell(ctx);
  } else if (spell.targetType === 'self') {
    abortResult = executeSelfAndMassSpell(ctx);
  } else {
    abortResult = executeSingleUnitSpell(ctx);
  }

  if (abortResult) {
    return abortResult;
  }

  // 统一执行单单位最多 20 个 Buff/Debuff 的 FIFO 自动顶替校验
  for (const modTarget of statusModifiedTargets) {
    const evicted = enforceUnitStatusSlotCap(modTarget);
    if (evicted.length > 0) {
      state.actionLog.push(`ℹ ${modTarget.name} 状态栏已满（20/20），自动顶替最早状态：${evicted.join('、')}。`);
    }
  }

  // 若法术或驱散改变了任何单位的有效士气，立即重检本回合士气态并刷新剩余行动梯队
  const moraleChangedIds: string[] = [];
  for (const [uid, prevMorale] of preMoraleByUnitId.entries()) {
    const u = state.units[uid];
    if (!u || u.status !== 'alive') continue;
    const nextMorale = computeUnitStats(u, state, catalog).morale;
    if (nextMorale !== prevMorale) {
      moraleChangedIds.push(uid);
    }
  }
  if (moraleChangedIds.length > 0) {
    deps.syncMidRoundMorale(state, moraleChangedIds, catalog, events);
  }

  // 结算灵力扣除、魔力虹吸与法术枷锁反伤
  unit.mana = Math.max(0, (unit.mana ?? 0) - effectiveCost);
  if (unit.kind === 'hero') {
    unit.spellCardCharge = Math.min(100, (unit.spellCardCharge ?? 0) + 5);
  }
  if (unit.statusEffects?.magicLeechCasterId) {
    const leecher = state.units[unit.statusEffects.magicLeechCasterId];
    if (leecher && leecher.status === 'alive') {
      const lStats = computeUnitStats(leecher, state, catalog);
      leecher.mana = Math.min(lStats.maxMana, (leecher.mana ?? 0) + effectiveCost);
      state.actionLog.push(`☠ 「噬灵魔蛭」从 ${unit.name} 处为 ${leecher.name} 吸取了 ${effectiveCost} 点灵力！`);
    }
  }
  if (unit.statusEffects?.spellShacklePower && unit.statusEffects.spellShacklePower > 0 && unit.status === 'alive') {
    const shackleDmg = Math.max(1, Math.round(unit.statusEffects.spellShacklePower * Math.max(1, effectiveCost / 3)));
    deps.applyDamageToUnit(state, unit, shackleDmg, catalog, events);
    ctx.damageMap[unit.id] = { damage: shackleDmg, kills: 0, grazed: false };
    state.actionLog.push(`⛓ 「咒缚反噬」灼伤施法者 ${unit.name}，造成 ${shackleDmg} 点法力反噬！`);
  }

  events.push({
    type: 'SPELL_CAST',
    casterId: unit.id,
    spellId: spell.id,
    spellName: spell.name,
    vfxKey: spell.vfxKey,
    targetHex: ctx.targetHex,
    affectedUnitIds: ctx.affectedUnitIds,
    damageMap: Object.keys(ctx.damageMap).length > 0 ? ctx.damageMap : undefined,
    healMap: Object.keys(ctx.healMap).length > 0 ? ctx.healMap : undefined,
    reviveMap: Object.keys(ctx.reviveMap).length > 0 ? ctx.reviveMap : undefined,
    summonedUnitIds: ctx.summonedUnitIds.length > 0 ? ctx.summonedUnitIds : undefined,
    displacedUnits: ctx.displacedUnits.length > 0 ? ctx.displacedUnits : undefined,
    noteText: ctx.noteText,
  });

  deps.consumeActiveUnitTurn(state, unit);
  deps.advanceTurn(state, catalog, events);
  return { ok: true, events };
}

/**
 * 全 150 HoMM4 五系法术、英雄腰带秘药与东方专属符卡统一效用评分引擎
 *
 * 按法术战术原型（群增益/群减益、硬控、高阶直伤/连锁/AOE、复生治疗驱散、召唤/幻象/招魂/瞬移）
 * 全部纳入与普攻可横向比较的统一效用标尺，并严格校验引擎目标合法性、魔抗、暗系易伤与误伤风险。
 */

import {
  allocateHpPoolToStack,
  canPlaceFootprintAt,
  checkSpellLineOfSight,
  evaluateIllusionSpell,
  findStackableSummonUnit,
  getAvailableCorpseHp,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  getUnitMinDistance,
  getUnitOccupiedHexes,
  isEngagedInMelee,
  validateCorpseSpellTarget,
  type CombatContentCatalog,
} from '@core/combatEngine';
import {
  DARK_MAGIC_VULNERABILITY_MULT,
  isDarkMagicVulnerable,
  isImmuneToLivingEffects,
  isImmuneToLivingHeal,
  isImmuneToMindSpells,
  isImmuneToMorale,
  isMindSpellDef,
  isUndeadUnit,
} from '@core/creatureTypes';
import {
  computeDualTrackSpellPower,
  getSchoolSpellMultiplier,
  validateSpellUnitTarget,
} from '@core/h4SpellExecutor';
import {
  getFootprintHexes,
  getHexNeighbors,
  getHexRange,
  hexDistance,
  hexKey,
  hexRay,
  minHexSetDistance,
  type HexCoord,
} from '@core/hex';
import { computeUnitStats } from '@core/modifiers';
import type { BattleState, BattleUnit, CombatCommand, SpellDef } from '@core/types';
import type { BattlefieldIntel, UnitThreatProfile } from './threatMap';
import { deterministicScoreJitter, type ScoredAiCommand } from './types';

/** 判断某单位是否已携带指定法术施加的持续修饰器（避免重复叠同一法术浪费回合） */
function hasSpellModifier(unit: BattleUnit, spellId: string): boolean {
  const prefix = `spell:${spellId}:`;
  return unit.modifiers.some((m) => m.spellId === spellId || m.id.startsWith(prefix));
}

/** 估算一次法术伤害在目标魔抗/魔免/结界/暗系易伤后的期望净伤害 */
function estimateNetSpellDamage(
  target: BattleUnit,
  targetProfile: UnitThreatProfile,
  spell: SpellDef,
  rawPower: number,
  allowMagicImmune = false,
): number {
  if (!allowMagicImmune && target.abilities.magicImmune) return 0;
  if (target.statusEffects?.sanctuary) return 0;
  if (targetProfile.stats.magicResistance >= 1) return 0;

  let dmg = rawPower;
  const isFire =
    Boolean(spell.isFireSpell) ||
    spell.vfxKey.includes('fire') ||
    spell.vfxKey.includes('flame') ||
    spell.vfxKey.includes('inferno') ||
    spell.vfxKey.includes('meteor') ||
    spell.specialEffect === 'armageddon' ||
    spell.specialEffect === 'fire_ring';
  const isCold = Boolean(spell.isColdSpell) || spell.vfxKey.includes('ice') || spell.vfxKey.includes('frost');

  if (isFire && target.abilities.fireResistant) dmg *= 0.5;
  else if (isFire && target.abilities.fireResist25) dmg *= 0.75;
  if (isCold && target.abilities.coldResistant) dmg *= 0.5;
  if (spell.alignment === 'death' && target.abilities.deathWard) dmg *= 0.5;
  if (spell.alignment === 'life' && target.abilities.lifeWard) dmg *= 0.5;
  if (spell.alignment === 'chaos' && target.abilities.chaosWard) dmg *= 0.5;
  if (target.statusEffects?.schoolWards?.[spell.alignment]) dmg *= 0.65;
  if (isDarkMagicVulnerable(target)) dmg *= DARK_MAGIC_VULNERABILITY_MULT;
  if (target.abilities.berserkDuel && target.statusEffects?.duelTargetUnitId) {
    dmg *= 0.9;
  }

  dmg *= Math.max(0, 1 - targetProfile.stats.magicResistance);
  // 估算擦弹折减期望（擦弹按约 40% 减伤）
  dmg *= 1 - Math.min(0.45, targetProfile.stats.grazeChance * 0.35);
  return Math.max(0, Math.round(dmg));
}

/** 将对单个敌方目标的净伤害转换为统一战术得分（含脆皮威胁权重、斩杀奖励、符卡收取与防打醒惩罚） */
function scoreDamageOnEnemy(
  state: BattleState,
  targetProfile: UnitThreatProfile,
  netDmg: number,
  intel: BattlefieldIntel,
): number {
  if (netDmg <= 0) return 0;
  const effectiveDmg = Math.min(netDmg, targetProfile.totalHp);
  const killsAll = netDmg >= targetProfile.totalHp;
  const kills =
    targetProfile.unit.kind === 'creature'
      ? Math.min(
          targetProfile.unit.count,
          killsAll
            ? targetProfile.unit.count
            : Math.max(0, targetProfile.unit.count - Math.ceil((targetProfile.totalHp - netDmg) / targetProfile.stats.maxHp)),
        )
      : killsAll
        ? 1
        : 0;

  let score = effectiveDmg * targetProfile.valuePerHp;
  if (killsAll) {
    score += targetProfile.unit.kind === 'hero' ? 240 : 95 * targetProfile.priorityMultiplier;
    if (
      targetProfile.unit.kind === 'hero' &&
      state.activeFieldAura &&
      state.activeFieldAura.casterUnitId === targetProfile.unit.id &&
      !state.activeFieldAura.captured
    ) {
      score += 130;
    }
  } else if (kills > 0) {
    score += kills * 14 * targetProfile.priorityMultiplier;
  }

  // 若目标正被致盲/镇魂神乐且本发无法将其直接斩杀，给予高额防误打醒惩罚
  if (targetProfile.isWakeOnDamageCC && !killsAll && !intel.allEnemiesWakeCCed) {
    score -= (140 + targetProfile.threatScore * 0.45) * intel.profile.ccWakePenaltyWeight;
  }
  return score;
}

/** 估算施法者对指定法术的法强原始值 */
function calcEstimatedPower(
  unit: BattleUnit,
  spell: SpellDef,
  baseValue: number,
  heroSpWeight: number,
  casterSpellPower: number,
  catalog: CombatContentCatalog,
): number {
  return computeDualTrackSpellPower({
    caster: unit,
    baseValue,
    heroSpWeight,
    casterSpellPower,
    schoolMult: getSchoolSpellMultiplier(unit, spell),
    subAndClassMult: 1,
    traitMult: 1,
    catalog,
  });
}

/** 1. 英雄腰带战斗秘药免费动作评估（每回合限用 1 次，不消耗行动权） */
export function evaluateHeroPotionCommand(
  state: BattleState,
  unit: BattleUnit,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): CombatCommand | null {
  if (unit.kind !== 'hero' || unit.hasUsedPotionThisRound) return null;
  const stats = intel.activeProfile.stats;
  const dangerHere = intel.getFootprintDanger(unit.pos, unit.footprint);
  const inDanger = dangerHere > 45 || isEngagedInMelee(state, unit);

  // 1a. 残血或身处危险区低血量时立刻喝治愈药
  const healThreshold = inDanger ? 0.74 : 0.56;
  if (unit.currentHp <= stats.maxHp * healThreshold) {
    const healPot = unit.potions.find(
      (p) => p.charges > 0 && catalog.potions[p.potionId]?.effectType === 'heal',
    );
    if (healPot) {
      return { type: 'USE_POTION', unitId: unit.id, potionId: healPot.potionId };
    }
  }

  // 1b. 符卡充能临门一脚（85%~99%）或蓝量见底且需要放高阶法术时喝灵力露
  const charge = unit.spellCardCharge ?? 0;
  const maxMana = Math.max(1, stats.maxMana);
  const manaLow = (unit.mana ?? 0) <= Math.max(8, maxMana * 0.28);
  const hasExpensiveSpell = unit.knownSpellIds.some((id) => {
    const sp = catalog.spells[id];
    return Boolean(sp && !sp.isAdventureOnly && sp.level >= 3 && sp.level <= intel.profile.maxSpellLevel);
  });
  if ((charge >= 85 && charge < 100) || (manaLow && hasExpensiveSpell && intel.profile.enableManaBudgeting)) {
    const manaPot = unit.potions.find(
      (p) => p.charges > 0 && catalog.potions[p.potionId]?.effectType === 'mana_charge',
    );
    if (manaPot) {
      return { type: 'USE_POTION', unitId: unit.id, potionId: manaPot.potionId };
    }
  }

  // 1c. 宗师/精锐模式：英雄被贴身、遭近距离强敌逼近、半血以下或准备前顶搏杀时，提前喝结界硬化秘药
  const minEnemyDist = Math.min(...intel.enemies.map((e) => getUnitMinDistance(unit, e)));
  const urgentDefense =
    isEngagedInMelee(state, unit) ||
    (dangerHere > 75 && minEnemyDist <= 5) ||
    unit.currentHp < stats.maxHp * 0.72;
  if (
    intel.profile.enableThreatMap &&
    (urgentDefense || (intel.activeProfile.isFrontlineHero && minEnemyDist <= 7)) &&
    !unit.modifiers.some((m) => m.id.startsWith('potion:def:'))
  ) {
    const elixir = unit.potions.find(
      (p) => p.charges > 0 && catalog.potions[p.potionId]?.effectType === 'combat_elixir',
    );
    if (elixir) {
      return { type: 'USE_POTION', unitId: unit.id, potionId: elixir.potionId };
    }
  }

  return null;
}

/** 2. 英雄专属符卡宣言统一评分评估 */
export function evaluateSpellCardAction(
  state: BattleState,
  unit: BattleUnit,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): ScoredAiCommand | null {
  if (unit.kind !== 'hero' || !unit.signatureSpellCardId) return null;
  if (unit.statusEffects?.songOfPeaceRounds && unit.statusEffects.songOfPeaceRounds > 0) return null;
  const card = catalog.spellCards[unit.signatureSpellCardId];
  if (!card) return null;
  if ((unit.mana ?? 0) < card.manaCost || (unit.spellCardCharge ?? 0) < card.chargeCost) return null;

  if (card.targetType === 'field_self') {
    if (state.activeFieldAura && state.activeFieldAura.casterSide === unit.side) return null;
    // 覆盖敌方领域符卡额外高加分！
    const overrideEnemyBonus = state.activeFieldAura && state.activeFieldAura.casterSide !== unit.side ? 90 : 0;
    const allyCountBonus = intel.allies.length * 26;
    const score = (180 + allyCountBonus + overrideEnemyBonus) * intel.personality.buffBias;
    return {
      command: { type: 'DECLARE_SPELL_CARD', unitId: unit.id },
      score,
      tag: `spellcard_field:${card.id}`,
    };
  }

  if (card.targetType === 'hex_line') {
    const candidateAimHexes = new Map<string, HexCoord>();
    for (const e of intel.enemies) {
      for (const h of getUnitOccupiedHexes(e)) {
        candidateAimHexes.set(hexKey(h), h);
      }
    }
    const isMightPhysicalCard = card.alignment === 'might';
    const baseDmg = isMightPhysicalCard
      ? (card.damageBase ?? 108) + intel.activeProfile.stats.attack * 2.8
      : (card.damageBase ?? 78) + intel.activeProfile.stats.spellPower * 2.4;
    let bestTargetHex: HexCoord | null = null;
    let bestScore = 0;

    for (const aim of candidateAimHexes.values()) {
      const ray = hexRay(unit.pos, aim, card.lineLength ?? 14, (c) => Boolean(state.tiles[hexKey(c)]));
      const raySet = new Set(ray.map(hexKey));
      let lineScore = 0;
      let hitCount = 0;
      for (const e of intel.enemies) {
        if ((!isMightPhysicalCard && e.abilities.magicImmune) || e.statusEffects?.sanctuary) continue;
        if (!getUnitOccupiedHexes(e).some((h) => raySet.has(hexKey(h)))) continue;
        const ep = intel.getProfile(e.id);
        if (!ep) continue;
        hitCount += 1;
        const netDmg = isMightPhysicalCard
          ? Math.round(baseDmg)
          : Math.round(baseDmg * Math.max(0, 1 - ep.stats.magicResistance));
        lineScore += scoreDamageOnEnemy(state, ep, netDmg, intel);
      }
      if (hitCount >= 2) lineScore += hitCount * 35;
      if (lineScore > bestScore) {
        bestScore = lineScore;
        bestTargetHex = aim;
      }
    }

    if (bestTargetHex && bestScore >= 95) {
      return {
        command: { type: 'DECLARE_SPELL_CARD', unitId: unit.id, targetHex: bestTargetHex },
        score: bestScore * intel.personality.nukeBias,
        tag: `spellcard_line:${card.id}`,
      };
    }
  }

  return null;
}

/** 3. 全 150 法术统一效用评估主入口 */
export function evaluateBestSpellAction(
  state: BattleState,
  unit: BattleUnit,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): ScoredAiCommand | null {
  if (unit.statusEffects?.songOfPeaceRounds && unit.statusEffects.songOfPeaceRounds > 0) return null;
  if (unit.knownSpellIds.length === 0 || (unit.mana ?? 0) <= 0) return null;

  const { profile, personality, allies, enemies } = intel;
  const casterStats = intel.activeProfile.stats;
  const maxMana = Math.max(1, casterStats.maxMana);
  const currentMana = unit.mana ?? 0;
  const manaRatio = currentMana / maxMana;
  // 蓝量越紧张，对高蓝耗法术的性价比门槛越高
  const manaCostPenaltyFactor = profile.enableManaBudgeting
    ? manaRatio < 0.25
      ? 7.5
      : manaRatio < 0.5
        ? 4.2
        : 2.2
    : 1.0;

  const seedSalt = state.round * 997 + state.commandSeq * 37 + unit.pos.q * 13 + unit.pos.r * 7;

  // 缓存单目标视线校验结果，避免 25+ 个法术对同一批目标反复重复执行射线检测
  const unitLosCache = new Map<string, boolean>();
  const canSeeTargetUnit = (target: BattleUnit): boolean => {
    const cached = unitLosCache.get(target.id);
    if (cached !== undefined) return cached;
    const ok = checkSpellLineOfSight(
      state,
      unit,
      intel.occupiedHexesByUnitId.get(target.id) ?? getUnitOccupiedHexes(target),
      target,
    ).canCast;
    unitLosCache.set(target.id, ok);
    return ok;
  };

  const shacklePower = unit.statusEffects?.spellShacklePower ?? 0;
  let best: ScoredAiCommand | null = null;
  const consider = (cmd: CombatCommand, rawScore: number, manaCost: number, tag: string) => {
    if (rawScore <= 0) return;
    let shacklePenalty = 0;
    if (shacklePower > 0 && manaCost > 0) {
      const estShackleDmg = Math.round(manaCost * shacklePower);
      const lethalShackle = estShackleDmg >= intel.activeProfile.totalHp * 0.85;
      // 身上背负「咒缚反噬」时，高耗蓝施法会引发剧烈乃至致命反噬，除非驱散自身咒缚且不致死，否则绝不自残送命！
      const isSelfCleanse =
        cmd.type === 'CAST_SPELL' &&
        (cmd.spellId === 'life_exorcism' || cmd.spellId === 'life_mass_exorcism' || cmd.spellId === 'order_dispel') &&
        (!cmd.targetUnitId || cmd.targetUnitId === unit.id);
      if (lethalShackle) {
        shacklePenalty = estShackleDmg * intel.activeProfile.valuePerHp * 1.6 + (unit.kind === 'hero' ? 360 : 140);
      } else {
        shacklePenalty = estShackleDmg * intel.activeProfile.valuePerHp * (isSelfCleanse ? 0.45 : 1.35);
      }
    }
    const netScore = rawScore - manaCost * manaCostPenaltyFactor - shacklePenalty;
    if (netScore <= 18) return;
    const jittered = netScore * deterministicScoreJitter(seedSalt, tag, profile.noiseRatio);
    if (!best || jittered > best.score) {
      best = { command: cmd, score: jittered, tag };
    }
  };

  for (const spellId of unit.knownSpellIds) {
    const spell = catalog.spells[spellId];
    if (!spell || spell.isAdventureOnly || spell.targetType === 'adventure') continue;
    if (spell.level > profile.maxSpellLevel) continue;

    const manaCost = getEffectiveSpellManaCost(state, unit, spell, catalog.advancedClasses);
    if (currentMana < manaCost) continue;

    const eff = spell.specialEffect ?? 'standard';
    const effRange = getEffectiveSpellRange(state, unit, spell);

    // 寻常（初级）难度下关闭高阶复杂原型，仅保留基础伤害/治疗/简单单 Buff/Debuff
    if (!profile.enableAdvancedSpells) {
      const isSimple =
        eff === 'standard' ||
        eff === 'bless' ||
        eff === 'curse' ||
        eff === 'holy_word' ||
        eff === 'rabbit_transform' ||
        eff === 'summon_creature';
      if (!isSimple) continue;
    }

    // ============ A. 自身与全战场即时法术 (targetType === 'self') ============
    if (spell.targetType === 'self') {
      const score = evaluateSelfOrMassSpell(state, unit, spell, eff, intel, catalog);
      if (score > 0) {
        consider({ type: 'CAST_SPELL', unitId: unit.id, spellId: spell.id }, score, manaCost, `spell:${spell.id}`);
      }
      continue;
    }

    // ============ B. 区域范围术式 (targetType === 'hex_aoe') ============
    if (spell.targetType === 'hex_aoe') {
      const aoeRes = evaluateHexAoeSpell(state, unit, spell, eff, effRange, intel, catalog);
      if (aoeRes) {
        consider(
          { type: 'CAST_SPELL', unitId: unit.id, spellId: spell.id, targetHex: aoeRes.center },
          aoeRes.score,
          manaCost,
          `spell_aoe:${spell.id}:${hexKey(aoeRes.center)}`,
        );
      }
      continue;
    }

    // ============ C. 空地召唤术式 (targetType === 'hex_empty') ============
    if (spell.targetType === 'hex_empty' && eff === 'summon_creature' && spell.summonTemplateId) {
      const sumRes = evaluateSummonSpell(state, unit, spell, effRange, intel, catalog);
      if (sumRes) {
        consider(
          { type: 'CAST_SPELL', unitId: unit.id, spellId: spell.id, targetHex: sumRes.anchor },
          sumRes.score,
          manaCost,
          `spell_summon:${spell.id}:${hexKey(sumRes.anchor)}`,
        );
      }
      continue;
    }

    // ============ D. 死亡招魂与反魂起尸 (targetType === 'corpse_unit') ============
    if (spell.targetType === 'corpse_unit') {
      const necroRes = evaluateNecromancySpell(state, unit, spell, eff, effRange, intel, catalog);
      if (necroRes) {
        consider(
          { type: 'CAST_SPELL', unitId: unit.id, spellId: spell.id, targetUnitId: necroRes.targetId },
          necroRes.score,
          manaCost,
          `spell_corpse:${spell.id}:${necroRes.targetId}`,
        );
      }
      continue;
    }

    // ============ E. 两步高阶组合术式（瞬移 / 替身 / 献祭，仅宗师档启用） ============
    if (spell.targetType === 'unit_to_hex' && eff === 'teleport') {
      if (!profile.enableMasterSpellCombos) continue;
      const tpRes = evaluateTeleportSpell(state, unit, effRange, intel);
      if (tpRes) {
        consider(
          {
            type: 'CAST_SPELL',
            unitId: unit.id,
            spellId: spell.id,
            targetUnitId: tpRes.allyId,
            secondTargetHex: tpRes.destHex,
          },
          tpRes.score * personality.controlIllusionBias,
          manaCost,
          `spell_tp:${tpRes.allyId}:${hexKey(tpRes.destHex)}`,
        );
      }
      continue;
    }

    if (spell.targetType === 'ally_to_ally') {
      if (!profile.enableMasterSpellCombos) continue;
      const linkRes = evaluateAllyToAllySpell(unit, eff, effRange, intel, catalog);
      if (linkRes) {
        consider(
          {
            type: 'CAST_SPELL',
            unitId: unit.id,
            spellId: spell.id,
            targetUnitId: linkRes.firstId,
            secondTargetUnitId: linkRes.secondId,
          },
          linkRes.score,
          manaCost,
          `spell_link:${spell.id}:${linkRes.firstId}:${linkRes.secondId}`,
        );
      }
      continue;
    }

    // ============ F. 幻象复制 (create_illusion / phantom_image) ============
    if (eff === 'create_illusion' || eff === 'phantom_image') {
      const illRes = evaluateIllusionAction(state, unit, spell, effRange, intel, catalog);
      if (illRes) {
        consider(
          { type: 'CAST_SPELL', unitId: unit.id, spellId: spell.id, targetUnitId: illRes.targetId },
          illRes.score * personality.controlIllusionBias,
          manaCost,
          `spell_illusion:${spell.id}:${illRes.targetId}`,
        );
      }
      continue;
    }

    // ============ G. 单体敌方 / 友方 / 任意目标法术 ============
    const candidates =
      spell.targetType === 'enemy_unit'
        ? enemies
        : spell.targetType === 'ally_unit'
          ? allies
          : [...allies, ...enemies];

    for (const target of candidates) {
      if (!validateSpellUnitTarget(spell, unit, target, state, catalog, false).ok) continue;
      if (effRange > 0 && getUnitMinDistance(unit, target) > effRange) continue;
      if (!spell.ignoreLos && !canSeeTargetUnit(target)) {
        continue;
      }

      const tp = intel.getProfile(target.id);
      if (!tp) continue;
      const score = evaluateSingleUnitSpell(state, unit, target, tp, spell, eff, intel, catalog);
      if (score > 0) {
        consider(
          { type: 'CAST_SPELL', unitId: unit.id, spellId: spell.id, targetUnitId: target.id },
          score,
          manaCost,
          `spell_unit:${spell.id}:${target.id}`,
        );
      }
    }
  }

  return best;
}

/** 评估 self / massScope 全场法术价值 */
function evaluateSelfOrMassSpell(
  state: BattleState,
  unit: BattleUnit,
  spell: SpellDef,
  eff: string,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): number {
  const { allies, enemies, personality } = intel;
  const sp = intel.activeProfile.stats.spellPower;

  if (eff === 'rabbit_transform') {
    if (unit.abilities.magicImmune) return 0;
    if (unit.statusEffects?.rabbitFormRounds && unit.statusEffects.rabbitFormRounds > 0) return 0;
    const minDist = Math.min(...enemies.map((e) => getUnitMinDistance(unit, e)));
    return minDist > 1 ? 155 : 40;
  }

  if (eff === 'heavenly_shield') {
    if ((unit.statusEffects?.tempShieldHp ?? 0) >= 35) return 0;
    const danger = intel.getFootprintDanger(unit.pos, unit.footprint);
    const missingRatio = 1 - unit.currentHp / Math.max(1, intel.activeProfile.stats.maxHp);
    if (danger < 25 && missingRatio < 0.2 && !isEngagedInMelee(state, unit)) return 0;
    const shield = calcEstimatedPower(unit, spell, spell.healBase ?? 48, 1.0, sp, catalog);
    return (shield * 1.15 + (inDangerBonus(danger, missingRatio))) * personality.buffBias;
  }

  if (eff === 'war_blood_sacrifice') {
    if (unit.abilities.magicImmune) return 0;
    const enemySide = unit.side === 'left' ? 'right' : 'left';
    const prevEnemyPhys = state.physicalDamageTakenLastRound?.[enemySide] ?? 0;
    if (prevEnemyPhys <= 0) return 0;
    const shieldCap =
      unit.kind === 'hero'
        ? Math.max(1, Math.round(intel.activeProfile.stats.maxHp * 2))
        : Math.max(1, unit.count) * 50;
    const nextShield = Math.max(1, Math.min(Math.round(prevEnemyPhys * 0.35), shieldCap));
    const curShield = unit.statusEffects?.bloodSacrificeShieldHp ?? 0;
    const curRounds = unit.statusEffects?.bloodSacrificeShieldRounds ?? 0;
    // 已有接近新值且持续时间充裕的血盾时避免浪费回合重放
    if (curShield >= nextShield * 0.85 && curRounds >= 2) return 0;
    if (nextShield < 20) return 0;
    const danger = intel.getFootprintDanger(unit.pos, unit.footprint);
    const missingRatio = 1 - unit.currentHp / Math.max(1, intel.activeProfile.stats.maxHp);
    const netGain = Math.max(nextShield * 0.55, nextShield - curShield * 0.6);
    const mobilityBonus = isEngagedInMelee(state, unit) ? 6 : 24;
    return (
      (netGain * intel.activeProfile.valuePerHp * 1.2 + inDangerBonus(danger, missingRatio) * 0.65 + mobilityBonus) *
      personality.buffBias
    );
  }

  if (eff === 'mana_flare') {
    if (state.battleSpellFlags?.manaFlareActive || state.round > 2) return 0;
    const allyMana = allies.reduce((s, a) => s + (a.mana ?? 0), 0);
    const enemyMana = enemies.reduce((s, e) => s + (e.mana ?? 0), 0);
    if (allyMana < enemyMana + 12) return 0;
    return 115 * personality.buffBias;
  }

  if (eff === 'necromancy_ward') {
    if (state.battleSpellFlags?.necromancyWardActive) return 0;
    const enemyHasNecro = enemies.some((e) =>
      e.knownSpellIds.some((id) => {
        const d = catalog.spells[id];
        return d?.targetType === 'corpse_unit';
      }),
    );
    return enemyHasNecro ? 145 * personality.buffBias : 0;
  }

  if (eff === 'divine_intervention') {
    let restoreValue = 0;
    for (const a of allies) {
      if (a.abilities.magicImmune || isImmuneToLivingHeal(a)) continue;
      const ap = intel.getProfile(a.id);
      if (!ap) continue;
      // 仅治疗当前受伤首兵/英雄至满血（不复活已阵亡兵力）并清祓全部负面与毒疫
      const missing = Math.max(0, ap.stats.maxHp - a.currentHp);
      const heroBoost = a.kind === 'hero' ? 1.35 : 0.95;
      restoreValue += missing * ap.valuePerHp * heroBoost + ap.negativeDebuffScore * 0.95;
    }
    return restoreValue >= 130 ? restoreValue * 1.1 * personality.healCleanseBias : 0;
  }

  if (eff === 'prayer') {
    let val = 0;
    let count = 0;
    for (const a of allies) {
      if (a.abilities.magicImmune || a.alignment !== 'life') continue;
      if (a.modifiers.some((m) => m.id.startsWith('spell:prayer:'))) continue;
      const ap = intel.getProfile(a.id);
      if (!ap) continue;
      count += 1;
      val += ap.expectedDps * 0.42 + ap.totalHp * 0.16;
    }
    return count >= 2 ? (45 + val) * personality.buffBias : 0;
  }

  if (eff === 'mass_bless') {
    let val = 0;
    for (const a of allies) {
      if (a.abilities.magicImmune || a.statusEffects?.bless) continue;
      const ap = intel.getProfile(a.id);
      if (!ap) continue;
      const spread = Math.max(0, ap.stats.maxDamage - ap.stats.minDamage) * a.count;
      val += spread * 0.65 + ap.expectedDps * 0.24 + (a.statusEffects?.curse ? 35 : 0);
    }
    return val * personality.buffBias;
  }

  if (eff === 'mass_curse') {
    let val = 0;
    for (const e of enemies) {
      if (e.abilities.magicImmune || e.statusEffects?.sanctuary || e.statusEffects?.curse) continue;
      const ep = intel.getProfile(e.id);
      if (!ep || ep.isHardCCed) continue;
      const spread = Math.max(0, ep.stats.maxDamage - ep.stats.minDamage) * e.count;
      val += spread * 0.55 + ep.expectedDps * 0.22 + (e.statusEffects?.bless ? 35 : 0);
    }
    return val * personality.debuffNecroBias;
  }

  if (eff === 'mass_bloodlust') {
    let val = 0;
    for (const a of allies) {
      if (a.abilities.magicImmune || a.abilities.noMelee || (a.statusEffects?.bloodlustRounds ?? 0) > 1) continue;
      const ap = intel.getProfile(a.id);
      if (!ap || ap.isActiveRanged) continue;
      val += ap.expectedDps * 0.45;
    }
    return val * personality.buffBias;
  }

  if (eff === 'mass_first_strike') {
    let val = 0;
    for (const a of allies) {
      if (a.abilities.magicImmune || a.abilities.noMelee || a.abilities.firstStrike) continue;
      const ap = intel.getProfile(a.id);
      if (!ap || ap.isActiveRanged) continue;
      val += ap.expectedDps * 0.36;
    }
    return val * personality.buffBias;
  }

  if (eff === 'mass_blur') {
    const enemyRangedDps = enemies.reduce((sum, e) => {
      const ep = intel.getProfile(e.id);
      return sum + (ep?.isActiveRanged && !ep.isHardCCed ? ep.expectedDps : 0);
    }, 0);
    if (enemyRangedDps < 30) return 0;
    const unblurred = allies.filter((a) => !a.abilities.magicImmune && !a.statusEffects?.blur).length;
    if (unblurred < 2) return 0;
    return (enemyRangedDps * 0.55 + unblurred * 18) * personality.buffBias;
  }

  if (eff === 'mass_precision') {
    let val = 0;
    for (const a of allies) {
      if (a.abilities.magicImmune || (a.statusEffects?.precisionRounds ?? 0) > 1) continue;
      const ap = intel.getProfile(a.id);
      if (!ap?.isActiveRanged) continue;
      val += ap.expectedDps * 0.65;
    }
    return val * personality.buffBias;
  }

  if (eff === 'mass_slayer') {
    const t4Enemies = enemies.filter((e) => (intel.getProfile(e.id)?.tierWeight ?? 1) >= 4);
    if (t4Enemies.length === 0) return 0;
    const unbuffed = allies.filter((a) => !a.abilities.magicImmune && !a.statusEffects?.slayer);
    return unbuffed.reduce((s, a) => s + (intel.getProfile(a.id)?.expectedDps ?? 0) * 0.32, 0) * personality.buffBias;
  }

  if (eff === 'defender') {
    if (state.round > 2) return 0;
    const eligible = allies.filter((a) => !a.abilities.magicImmune && !a.statusEffects?.defenderBonus).length;
    return eligible >= 4 ? eligible * 14 * personality.buffBias : 0;
  }

  if (eff === 'ward_mass' && spell.wardSchool) {
    const matchingThreat = enemies.reduce((sum, e) => {
      const ep = intel.getProfile(e.id);
      if (!ep) return sum;
      const matches = e.alignment === spell.wardSchool || (e.kind === 'hero' && e.alignment === spell.wardSchool);
      return sum + (matches ? ep.threatScore * 0.38 : 0);
    }, 0);
    if (matchingThreat < 40) return 0;
    const unwarded = allies.filter((a) => !a.abilities.magicImmune && !a.statusEffects?.schoolWards?.[spell.wardSchool!]).length;
    if (unwarded < 2) return 0;
    return matchingThreat * (0.34 + Math.min(0.48, unwarded * 0.08)) * personality.buffBias;
  }

  if (eff === 'mass_exorcism') {
    let cleanVal = 0;
    for (const a of allies) {
      if (a.abilities.magicImmune) continue;
      cleanVal += intel.getProfile(a.id)?.negativeDebuffScore ?? 0;
    }
    return cleanVal >= 65 ? cleanVal * 1.15 * personality.healCleanseBias : 0;
  }

  if (eff === 'mass_cancellation' || eff === 'steal_all_enchantments') {
    let stripVal = 0;
    for (const e of enemies) {
      if (e.abilities.magicImmune) continue;
      stripVal += intel.getProfile(e.id)?.positiveBuffScore ?? 0;
    }
    const mult = eff === 'steal_all_enchantments' ? 1.55 : 1.05;
    return stripVal >= 55 ? stripVal * mult * personality.controlIllusionBias : 0;
  }

  if (eff === 'mass_dispel') {
    let netVal = 0;
    for (const e of enemies) {
      if (e.abilities.magicImmune) continue;
      const ep = intel.getProfile(e.id);
      if (ep) netVal += ep.positiveBuffScore - ep.negativeDebuffScore * 0.7;
    }
    for (const a of allies) {
      if (a.abilities.magicImmune) continue;
      const ap = intel.getProfile(a.id);
      if (ap) netVal += ap.negativeDebuffScore * 0.85 - ap.positiveBuffScore * 1.05;
    }
    return netVal >= 75 ? netVal * personality.controlIllusionBias : 0;
  }

  if (eff === 'unholy_song') {
    let val = 0;
    for (const e of enemies) {
      if (e.abilities.magicImmune || e.alignment !== 'life') continue;
      if (e.modifiers.some((m) => m.id.startsWith('spell:unholy:'))) continue;
      const ep = intel.getProfile(e.id);
      if (ep) val += ep.expectedDps * 0.35 + ep.totalHp * 0.08;
    }
    return val * personality.debuffNecroBias;
  }

  if (eff === 'holy_shout') {
    let val = 0;
    for (const e of enemies) {
      const isUnholy = isUndeadUnit(e) || e.alignment === 'death' || e.abilities.darkNature;
      const isChaos = e.alignment === 'chaos';
      if (!isUnholy && !isChaos) continue;
      const ep = intel.getProfile(e.id);
      if (!ep) continue;
      const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 24, 0.5, sp, catalog) * (isUnholy ? 1.0 : 0.55);
      val += scoreDamageOnEnemy(state, ep, estimateNetSpellDamage(e, ep, spell, raw), intel);
    }
    return val * personality.nukeBias;
  }

  if (eff === 'life_drain') {
    let val = 0;
    let totalDmg = 0;
    for (const e of enemies) {
      if (isImmuneToLivingEffects(e)) continue;
      const ep = intel.getProfile(e.id);
      if (!ep) continue;
      const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 20, 0.45, sp, catalog);
      const net = estimateNetSpellDamage(e, ep, spell, raw);
      totalDmg += net;
      val += scoreDamageOnEnemy(state, ep, net, intel);
    }
    const selfMissing = Math.max(0, intel.activeProfile.stats.maxHp - unit.currentHp);
    const selfHeal = Math.min(selfMissing, Math.round(totalDmg * 0.5));
    return (val + selfHeal * 1.15) * personality.debuffNecroBias;
  }

  if (eff === 'plague') {
    let enemyVal = 0;
    let allyPenalty = 0;
    const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 14, 0.4, sp, catalog);
    for (const e of enemies) {
      if (e.abilities.magicImmune || isImmuneToLivingEffects(e) || e.statusEffects?.sanctuary) continue;
      if ((e.statusEffects?.plaguePower ?? 0) >= raw * 0.85) continue;
      const ep = intel.getProfile(e.id);
      if (!ep) continue;
      const net = estimateNetSpellDamage(e, ep, spell, raw);
      enemyVal += scoreDamageOnEnemy(state, ep, Math.round(net * 2.4), intel);
    }
    for (const a of allies) {
      if (a.abilities.magicImmune || isImmuneToLivingEffects(a) || a.statusEffects?.sanctuary) continue;
      const ap = intel.getProfile(a.id);
      if (!ap) continue;
      const net = estimateNetSpellDamage(a, ap, spell, raw);
      allyPenalty += net * 2.4 * ap.valuePerHp * (a.kind === 'hero' ? 1.35 : 1.0);
    }
    const diff = enemyVal - allyPenalty * 1.15;
    return diff > 60 ? diff * personality.debuffNecroBias : 0;
  }

  if (eff === 'sparks') {
    let val = 0;
    const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 18, 0.45, sp, catalog);
    for (const e of enemies) {
      if (getUnitMinDistance(unit, e) > 2) continue;
      const ep = intel.getProfile(e.id);
      if (!ep) continue;
      val += scoreDamageOnEnemy(state, ep, estimateNetSpellDamage(e, ep, spell, raw), intel);
    }
    return val * personality.nukeBias;
  }

  if (eff === 'armageddon') {
    let enemyVal = 0;
    let allyPenalty = 0;
    const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 52, 0.6, sp, catalog);
    for (const e of enemies) {
      const ep = intel.getProfile(e.id);
      if (!ep) continue;
      enemyVal += scoreDamageOnEnemy(state, ep, estimateNetSpellDamage(e, ep, spell, raw), intel);
    }
    for (const a of allies) {
      const ap = intel.getProfile(a.id);
      if (!ap) continue;
      const net = estimateNetSpellDamage(a, ap, spell, raw);
      const lethalSelf = net >= ap.totalHp ? (a.kind === 'hero' ? 350 : 120) : 0;
      allyPenalty += net * ap.valuePerHp + lethalSelf;
    }
    const diff = enemyVal - allyPenalty * 1.2;
    return diff > 95 ? diff * personality.nukeBias : 0;
  }

  // 标准群体 massScope（群体加速 / 群体减速 / 群体虚弱 / 群体治疗 / 群体士气 / 群体护甲等）
  if (spell.massScope) {
    const isMorale = Boolean(
      spell.buffModifiers?.some((m) => m.stat === 'morale') ||
        spell.debuffModifiers?.some((m) => m.stat === 'morale'),
    );
    const isMind = isMindSpellDef(spell);
    if (spell.massScope === 'all_allies') {
      let val = 0;
      for (const a of allies) {
        if (a.abilities.magicImmune || a.statusEffects?.sanctuary) continue;
        if (spell.livingOnly && isImmuneToLivingEffects(a)) continue;
        if (isMind && isImmuneToMindSpells(a)) continue;
        if (isMorale && isImmuneToMorale(a)) continue;
        const ap = intel.getProfile(a.id);
        if (!ap) continue;

        if (spell.healBase && !isImmuneToLivingHeal(a)) {
          const healAmt = calcEstimatedPower(unit, spell, spell.healBase, 0.5, sp, catalog);
          const missing = Math.max(0, ap.stats.maxHp - a.currentHp);
          const poisonBonus = (a.statusEffects?.poisonPower ?? 0) > 0 || (a.statusEffects?.plaguePower ?? 0) > 0 ? 40 : 0;
          val += Math.min(missing, healAmt) * ap.valuePerHp * (a.kind === 'hero' ? 1.35 : 0.9) + poisonBonus;
        }
        if (spell.buffModifiers?.length && !hasSpellModifier(a, spell.id)) {
          val += scoreModifierListOnAlly(spell.buffModifiers, ap, state);
        }
      }
      return val * (spell.healBase ? personality.healCleanseBias : personality.buffBias);
    }

    if (spell.massScope === 'all_enemies') {
      let val = 0;
      for (const e of enemies) {
        if (e.abilities.magicImmune || e.statusEffects?.sanctuary) continue;
        if (spell.livingOnly && isImmuneToLivingEffects(e)) continue;
        if (isMind && isImmuneToMindSpells(e)) continue;
        if (isMorale && isImmuneToMorale(e)) continue;
        if (hasSpellModifier(e, spell.id)) continue;
        const ep = intel.getProfile(e.id);
        if (!ep || ep.isHardCCed) continue;
        if (spell.debuffModifiers?.length) {
          val += scoreModifierListOnEnemy(spell.debuffModifiers, ep);
        }
      }
      return val * personality.debuffNecroBias;
    }
  }

  return 0;
}

function inDangerBonus(danger: number, missingRatio: number): number {
  return Math.min(60, danger * 0.4) + missingRatio * 65;
}

/** 评估一组增益修饰器对单名友军的价值 */
function scoreModifierListOnAlly(
  mods: NonNullable<SpellDef['buffModifiers']>,
  ap: UnitThreatProfile,
  state: BattleState,
): number {
  let score = 0;
  for (const m of mods) {
    if (m.stat === 'speed' || m.stat === 'initiative') {
      score += (ap.isActiveRanged ? 14 : 26) * (state.round <= 2 ? 1.35 : 0.9) + ap.expectedDps * 0.14;
    } else if (m.stat === 'minDamage' || m.stat === 'maxDamage' || m.stat === 'attack') {
      score += ap.expectedDps * Math.max(0.18, Math.abs(m.value) * 0.95);
    } else if (m.stat === 'defense' || m.stat === 'maxHp') {
      score += (ap.totalHp * 0.12 + 18) * (ap.unit.kind === 'hero' ? 1.3 : 1.0);
    } else if (m.stat === 'morale' || m.stat === 'luck') {
      score += ap.expectedDps * 0.18 + 14;
    } else {
      score += 18;
    }
  }
  return score;
}

/** 评估一组减益修饰器对单名敌军的价值 */
function scoreModifierListOnEnemy(
  mods: NonNullable<SpellDef['debuffModifiers']>,
  ep: UnitThreatProfile,
): number {
  let score = 0;
  for (const m of mods) {
    if (m.stat === 'speed' || m.stat === 'initiative') {
      score += ep.isActiveRanged ? 10 : 24 + ep.expectedDps * 0.2;
    } else if (m.stat === 'minDamage' || m.stat === 'maxDamage' || m.stat === 'attack') {
      score += ep.expectedDps * Math.max(0.22, Math.abs(m.value) * 1.1);
    } else if (m.stat === 'defense') {
      score += Math.min(55, ep.totalHp * 0.12) * ep.priorityMultiplier;
    } else if (m.stat === 'morale' || m.stat === 'luck') {
      score += ep.expectedDps * 0.24 + 12;
    } else {
      score += 16;
    }
  }
  return score;
}

/** 评估区域范围术式（含宗师档空地圆心搜优与火环圆环几何精确匹配） */
function evaluateHexAoeSpell(
  state: BattleState,
  unit: BattleUnit,
  spell: SpellDef,
  eff: string,
  effRange: number,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): { center: HexCoord; score: number } | null {
  const { enemies, profile, personality } = intel;
  const radius = spell.aoeRadius ?? 1;
  const sp = intel.activeProfile.stats.spellPower;

  // 收集候选中心格：宗师档扩大至每个敌军及其 1 格邻格（能精准瞄准空地夹心一炸三！）
  const candidateMap = new Map<string, HexCoord>();
  for (const e of enemies) {
    for (const h of getUnitOccupiedHexes(e)) {
      candidateMap.set(hexKey(h), h);
      if (profile.enableMasterSpellCombos || eff === 'fire_ring') {
        for (const nb of getHexNeighbors(h)) {
          const nk = hexKey(nb);
          if (state.tiles[nk]) candidateMap.set(nk, nb);
        }
      }
    }
  }

  let bestCenter: HexCoord | null = null;
  let bestScore = 0;

  if (eff === 'quicksand') {
    const existing = new Set(state.battleSpellFlags?.quicksandHexKeys ?? []);
    const groundEnemies = enemies.filter(
      (e) => !e.abilities.flying && !e.abilities.teleport && !e.abilities.globalTeleport && !intel.getProfile(e.id)?.isHardCCed,
    );
    if (groundEnemies.length === 0) return null;
    for (const center of candidateMap.values()) {
      if (effRange > 0 && hexDistance(unit.pos, center) > effRange) continue;
      if (!spell.ignoreLos && !checkSpellLineOfSight(state, unit, [center]).canCast) continue;
      const area = getHexRange(center, radius).filter(
        (h) => state.tiles[hexKey(h)] && !state.tiles[hexKey(h)].blocksGround && !existing.has(hexKey(h)),
      );
      if (area.length < 3) continue;
      let score = 0;
      for (const ge of groundEnemies) {
        const d = minHexSetDistance(getUnitOccupiedHexes(ge), area);
        if (d >= 1 && d <= 2) {
          score += (intel.getProfile(ge.id)?.expectedDps ?? 25) * 0.42;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestCenter = center;
      }
    }
    return bestCenter && bestScore >= 65 ? { center: bestCenter, score: bestScore * personality.controlIllusionBias } : null;
  }

  const rawPower =
    eff === 'cloud_of_confusion'
      ? 0
      : calcEstimatedPower(unit, spell, spell.damageBase ?? 26, spell.level >= 4 ? 0.6 : 0.5, sp, catalog);

  for (const center of candidateMap.values()) {
    if (effRange > 0 && hexDistance(unit.pos, center) > effRange) continue;
    if (!spell.ignoreLos && !checkSpellLineOfSight(state, unit, [center]).canCast) continue;

    const areaHexes = getHexRange(center, radius).filter((h) =>
      eff === 'fire_ring' ? hexDistance(center, h) === 1 : true,
    );
    const areaKeys = new Set(areaHexes.map(hexKey));

    let totalScore = 0;
    let affectedCount = 0;
    for (const e of enemies) {
      if (e.abilities.magicImmune || e.statusEffects?.sanctuary) continue;
      if (!getUnitOccupiedHexes(e).some((h) => areaKeys.has(hexKey(h)))) continue;
      const ep = intel.getProfile(e.id);
      if (!ep) continue;

      if (eff === 'cloud_of_confusion') {
        if (isImmuneToLivingEffects(e) || isImmuneToMindSpells(e) || ep.isHardCCed) continue;
        affectedCount += 1;
        totalScore += ep.threatScore * 0.82;
      } else {
        const netDmg = estimateNetSpellDamage(e, ep, spell, rawPower);
        if (netDmg <= 0) continue;
        affectedCount += 1;
        totalScore += scoreDamageOnEnemy(state, ep, netDmg, intel);
      }
    }

    if (affectedCount >= 2) {
      totalScore += affectedCount * 24;
    }
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCenter = center;
    }
  }

  const bias = eff === 'cloud_of_confusion' ? personality.controlIllusionBias : personality.nukeBias;
  return bestCenter && bestScore >= 55 ? { center: bestCenter, score: bestScore * bias } : null;
}

/** 评估空地召唤术式（优先拍在敌方未贴脸射手脸上卡死远程，其次护阵/压敌） */
function evaluateSummonSpell(
  state: BattleState,
  unit: BattleUnit,
  spell: SpellDef,
  effRange: number,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): { anchor: HexCoord; score: number } | null {
  const tmpl = spell.summonTemplateId ? catalog.creatures[spell.summonTemplateId] : undefined;
  if (!tmpl) return null;

  const sp = intel.activeProfile.stats.spellPower;
  const budgetHp = calcEstimatedPower(
    unit,
    spell,
    spell.level <= 1 ? 36 : spell.level <= 2 ? 52 : spell.level <= 3 ? 84 : spell.level === 4 ? 132 : 190,
    spell.level <= 2 ? 2.4 : spell.level === 3 ? 3.5 : spell.level === 4 ? 5.0 : 6.8,
    sp,
    catalog,
  );
  const allocated = allocateHpPoolToStack(budgetHp, tmpl.baseStats.maxHp);
  if (allocated.count <= 0) return null;

  // 若己方场上已有同种存活召唤单位且在射程内，直接叠加强化该堆叠（无需再找空地）
  const existingSummon = findStackableSummonUnit(state, unit.side, tmpl.id, 'summoned');
  if (existingSummon && (effRange <= 0 || getUnitMinDistance(unit, existingSummon) <= effRange)) {
    const summonDps = ((tmpl.baseStats.minDamage + tmpl.baseStats.maxDamage) / 2) * allocated.count;
    const baseValue = budgetHp * 0.78 + summonDps * 1.2 + 24;
    return { anchor: existingSummon.pos, score: baseValue * intel.personality.summonBias };
  }

  const casterHexes = getUnitOccupiedHexes(unit);
  const unpinnedShooters = intel.enemies.filter((e) => intel.getProfile(e.id)?.isUnpinnedRanged);
  const primaryEnemy = [...intel.enemies].sort(
    (a, b) => (intel.getProfile(b.id)?.threatScore ?? 0) - (intel.getProfile(a.id)?.threatScore ?? 0),
  )[0];
  if (!primaryEnemy) return null;

  // 只搜索高价值候选空地（敌军周围 1~2 格 + 己方后排保护格 + 施法者附近），避免全图盲搜
  const candidateHexes = new Map<string, HexCoord>();
  const seedUnits = [...unpinnedShooters, primaryEnemy, unit];
  for (const su of seedUnits) {
    for (const h of getHexRange(su.pos, 2)) {
      const k = hexKey(h);
      if (state.tiles[k]) candidateHexes.set(k, h);
    }
  }

  let bestAnchor: HexCoord | null = null;
  let bestPosBonus = -Infinity;

  for (const tile of candidateHexes.values()) {
    const tk = hexKey(tile);
    if (intel.occupiedHexKeys.has(tk)) continue;
    if (effRange > 0 && minHexSetDistance(casterHexes, [tile]) > effRange) continue;
    if (!canPlaceFootprintAt(state, tile, tmpl.footprint, undefined, Boolean(tmpl.abilities.flying))) continue;

    const foot = getFootprintHexes(tile, tmpl.footprint);
    let posBonus = 0;

    // 1. 贴死敌方自由远程的巨大战术红利！
    if (intel.profile.rangedPinWeight > 0) {
      for (const sh of unpinnedShooters) {
        if (minHexSetDistance(foot, getUnitOccupiedHexes(sh)) === 1) {
          posBonus += (intel.getProfile(sh.id)?.expectedDps ?? 40) * 0.75 * intel.profile.rangedPinWeight;
        }
      }
    }

    // 2. 若召唤物本身是远程，优选高台与安全距离；否则优选贴近最高威胁敌军
    const dPrimary = minHexSetDistance(foot, getUnitOccupiedHexes(primaryEnemy));
    if (tmpl.abilities.ranged) {
      const elev = Math.max(...foot.map((h) => state.tiles[hexKey(h)]?.elevation ?? 1));
      posBonus += elev * 18 - Math.abs(dPrimary - 6) * 5 - intel.getFootprintDanger(tile, tmpl.footprint) * 0.25;
    } else {
      posBonus += Math.max(0, 12 - dPrimary) * 4;
    }

    if (posBonus > bestPosBonus) {
      bestPosBonus = posBonus;
      bestAnchor = tile;
    }
  }

  if (!bestAnchor) return null;
  const summonDps = ((tmpl.baseStats.minDamage + tmpl.baseStats.maxDamage) / 2) * allocated.count;
  const baseValue = budgetHp * 0.75 + summonDps * 1.15 + Math.max(0, bestPosBonus);
  return { anchor: bestAnchor, score: baseValue * intel.personality.summonBias };
}

/** 评估死亡招魂 / 反魂起尸 / 黄泉呼唤（100% 遵守机械/亡灵/元素/幻象残骸禁令） */
function evaluateNecromancySpell(
  state: BattleState,
  unit: BattleUnit,
  spell: SpellDef,
  eff: string,
  effRange: number,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): { targetId: string; score: number } | null {
  if (state.battleSpellFlags?.necromancyWardActive) return null;
  const sp = intel.activeProfile.stats.spellPower;

  let bestTargetId: string | null = null;
  let bestScore = 0;

  for (const cand of Object.values(state.units)) {
    if (effRange > 0 && getUnitMinDistance(unit, cand) > effRange) continue;
    if (!validateCorpseSpellTarget(spell, unit, cand, state, catalog).ok) continue;

    let score = 0;
    const isAllyRevive = (eff === 'animate_dead' || eff === 'death_call') && cand.side === unit.side;

    if (isAllyRevive) {
      const cStats = computeUnitStats(cand, state, catalog);
      const curTotal = cand.status === 'dead' ? 0 : (cand.count - 1) * cStats.maxHp + cand.currentHp;
      const maxRecoverable = Math.max(
        curTotal,
        cand.maxCount * cStats.maxHp - (cand.statusEffects?.consumedCorpseHp ?? 0),
      );
      const missing = Math.max(0, maxRecoverable - curTotal);
      const budget = calcEstimatedPower(
        unit,
        spell,
        spell.reviveBase ?? 55,
        eff === 'death_call' ? 2.4 : 1.5,
        sp,
        catalog,
      );
      const restored = Math.min(missing, budget);
      const tier = catalog.creatures[cand.defId]?.tier ?? 2;
      const reviveDeadBonus = cand.status === 'dead' ? 45 + tier * 20 : 15;
      score = restored * (0.95 + tier * 0.16) + reviveDeadBonus;
    } else {
      const templateId =
        eff === 'raise_undead'
          ? spell.summonTemplateId
          : eff === 'death_call'
            ? 'wraith_spirit'
            : 'corpse_husk';
      const tmpl = templateId ? catalog.creatures[templateId] : undefined;
      if (!tmpl) continue;
      const availHp = getAvailableCorpseHp(state, cand, catalog);
      if (availHp <= 0) continue;
      const budgetHp =
        eff === 'raise_undead'
          ? calcEstimatedPower(
              unit,
              spell,
              spell.level <= 1 ? 32 : spell.level <= 3 ? 48 : 68,
              spell.level <= 1 ? 2.0 : spell.level <= 3 ? 2.8 : 3.8,
              sp,
              catalog,
            )
          : calcEstimatedPower(
              unit,
              spell,
              eff === 'death_call' ? 62 : 40,
              eff === 'death_call' ? 3.2 : 2.2,
              sp,
              catalog,
            );
      const pool = Math.floor(Math.min(availHp, budgetHp));
      // 避免拿昂贵高阶招魂去榨极碎的边角残骸
      if (pool < Math.min(24, tmpl.baseStats.maxHp * 0.45)) continue;
      const allocated = allocateHpPoolToStack(pool, tmpl.baseStats.maxHp);
      if (allocated.count <= 0) continue;
      const raisedDps = ((tmpl.baseStats.minDamage + tmpl.baseStats.maxDamage) / 2) * allocated.count;
      score = pool * 0.85 + raisedDps * 1.15 + tmpl.tier * 18;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTargetId = cand.id;
    }
  }

  return bestTargetId && bestScore >= 60
    ? { targetId: bestTargetId, score: bestScore * intel.personality.debuffNecroBias }
    : null;
}

/** 评估秩序幻象复制（Create Illusion / Phantom Image） */
function evaluateIllusionAction(
  state: BattleState,
  unit: BattleUnit,
  spell: SpellDef,
  effRange: number,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): { targetId: string; score: number } | null {
  let bestId: string | null = null;
  let bestScore = 0;

  for (const cand of [...intel.allies, ...intel.enemies]) {
    if (cand.kind !== 'creature') continue;
    if (effRange > 0 && getUnitMinDistance(unit, cand) > effRange) continue;
    if (!spell.ignoreLos && !checkSpellLineOfSight(state, unit, getUnitOccupiedHexes(cand), cand).canCast) continue;

    const evalRes = evaluateIllusionSpell(spell, unit, cand, state, catalog, 1);
    if (!evalRes.ok) continue;

    const cDef = catalog.creatures[cand.defId];
    if (!cDef) continue;
    const avgDmg = (cDef.baseStats.minDamage + cDef.baseStats.maxDamage) / 2;
    const illDps = avgDmg * evalRes.count * (cDef.abilities.doubleStrike ? 1.7 : 1);
    const roleBonus = cDef.abilities.ranged ? 42 : cDef.abilities.flying ? 32 : 14;
    const score = evalRes.illusionHpPool * 0.72 + illDps * 1.35 + roleBonus;
    if (score > bestScore) {
      bestScore = score;
      bestId = cand.id;
    }
  }

  return bestId && bestScore >= 85 ? { targetId: bestId, score: bestScore } : null;
}

/** 评估宗师档「隙间瞬移」：把强力慢速己方近战大爹空投至敌方自由射手/法系英雄身旁 */
function evaluateTeleportSpell(
  state: BattleState,
  unit: BattleUnit,
  effRange: number,
  intel: BattlefieldIntel,
): { allyId: string; destHex: HexCoord; score: number } | null {
  const unpinnedShooters = intel.enemies
    .filter((e) => {
      const ep = intel.getProfile(e.id);
      return Boolean(ep && (ep.isUnpinnedRanged || ep.role === 'caster_support' || ep.role === 'hero_caster'));
    })
    .sort((a, b) => (intel.getProfile(b.id)?.threatScore ?? 0) - (intel.getProfile(a.id)?.threatScore ?? 0))
    .slice(0, 3);
  if (unpinnedShooters.length === 0) return null;

  // 选出强力、未飞、且尚未贴到敌方主力的近战重装主力
  const bruisers = intel.allies.filter((a) => {
    if (a.id === unit.id || a.abilities.magicImmune || a.statusEffects?.sanctuary) return false;
    if (effRange > 0 && getUnitMinDistance(unit, a) > effRange) return false;
    const ap = intel.getProfile(a.id);
    if (!ap || ap.isHardCCed || ap.isActiveRanged || a.abilities.noMelee) return false;
    if (a.kind === 'hero' && !ap.isFrontlineHero) return false;
    if (isEngagedInMelee(state, a)) return false;
    return ap.expectedDps >= 45 && ap.totalHp >= 140;
  });

  let best: { allyId: string; destHex: HexCoord; score: number } | null = null;
  for (const ally of bruisers) {
    const ap = intel.getProfile(ally.id)!;
    for (const target of unpinnedShooters) {
      const curDist = getUnitMinDistance(ally, target);
      if (curDist <= ap.stats.speed + 1) continue; // 本来自己就能走到，没必要浪费瞬移
      const tp = intel.getProfile(target.id)!;
      for (const h of getHexRange(target.pos, 2)) {
        const hk = hexKey(h);
        const tile = state.tiles[hk];
        if (!tile || intel.occupiedHexKeys.has(hk)) continue;
        if (!canPlaceFootprintAt(state, h, ally.footprint, ally.id, Boolean(ally.abilities.flying))) continue;
        const foot = getFootprintHexes(h, ally.footprint);
        if (minHexSetDistance(foot, getUnitOccupiedHexes(target)) !== 1) continue;
        const pinBonus = tp.isUnpinnedRanged ? tp.expectedDps * 0.9 : tp.threatScore * 0.45;
        const timingBonus = ap.canActLaterThisRound ? 55 : 20;
        const score = ap.expectedDps * 0.75 + pinBonus + timingBonus - intel.getFootprintDanger(h, ally.footprint) * 0.15;
        if (!best || score > best.score) {
          best = { allyId: ally.id, destHex: h, score };
        }
      }
    }
  }

  return best && best.score >= 135 ? best : null;
}

/** 评估宗师档双选友军法术（替身雏偶 Martyr / 彼岸献祭 Sacrifice） */
function evaluateAllyToAllySpell(
  unit: BattleUnit,
  eff: string,
  effRange: number,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): { firstId: string; secondId: string; score: number } | null {
  const validAllies = intel.allies.filter(
    (a) =>
      !a.abilities.magicImmune &&
      !a.statusEffects?.sanctuary &&
      (effRange <= 0 || getUnitMinDistance(unit, a) <= effRange),
  );
  if (validAllies.length < 2) return null;

  if (eff === 'martyr') {
    const fragileCore = validAllies
      .filter((a) => {
        if (a.statusEffects?.martyrProtectedByUnitId) return false;
        const ap = intel.getProfile(a.id)!;
        const danger = intel.getFootprintDanger(a.pos, a.footprint);
        return (a.kind === 'hero' || ap.priorityMultiplier >= 1.35) && (danger > 40 || a.currentHp < ap.stats.maxHp * 0.65);
      })
      .sort((a, b) => (intel.getProfile(b.id)?.threatScore ?? 0) - (intel.getProfile(a.id)?.threatScore ?? 0))[0];
    if (!fragileCore) return null;

    const tank = validAllies
      .filter((a) => a.id !== fragileCore.id && a.kind === 'creature' && (intel.getProfile(a.id)?.totalHp ?? 0) >= 200)
      .sort((a, b) => (intel.getProfile(b.id)?.totalHp ?? 0) - (intel.getProfile(a.id)?.totalHp ?? 0))[0];
    if (!tank) return null;

    return {
      firstId: tank.id,
      secondId: fragileCore.id,
      score: 125 * intel.personality.healCleanseBias,
    };
  }

  if (eff === 'sacrifice') {
    // 仅当高阶核心主力折损惨重，且有极廉价炮灰兵种可献祭换大回血时触发
    const depletedCore = validAllies
      .filter((a) => {
        if (a.kind !== 'creature' || a.count >= a.maxCount) return false;
        if (isImmuneToLivingHeal(a) && !isUndeadUnit(a)) return false;
        const tier = catalog.creatures[a.defId]?.tier ?? 1;
        return tier >= 3 && a.maxCount - a.count >= 1;
      })
      .sort((a, b) => (intel.getProfile(b.id)?.tierWeight ?? 0) - (intel.getProfile(a.id)?.tierWeight ?? 0))[0];
    if (!depletedCore) return null;

    const dp = intel.getProfile(depletedCore.id)!;
    const missingHp = Math.max(0, depletedCore.maxCount * dp.stats.maxHp - dp.totalHp);
    if (missingHp < dp.stats.maxHp * 0.8) return null;

    const fodder = validAllies
      .filter((a) => {
        if (a.id === depletedCore.id || a.kind !== 'creature') return false;
        const tier = catalog.creatures[a.defId]?.tier ?? 2;
        return tier <= 1 || Boolean(a.isSummoned);
      })
      .sort((a, b) => (intel.getProfile(a.id)?.threatScore ?? 0) - (intel.getProfile(b.id)?.threatScore ?? 0))[0];
    if (!fodder) return null;

    const fp = intel.getProfile(fodder.id)!;
    const restored = Math.min(missingHp, fp.totalHp * 1.25);
    const netGain = restored * dp.valuePerHp - fp.totalHp * fp.valuePerHp;
    if (netGain < 90) return null;
    return {
      firstId: fodder.id,
      secondId: depletedCore.id,
      score: netGain * intel.personality.debuffNecroBias,
    };
  }

  return null;
}

/** 评估单体目标法术（涵盖全部控场、直杀、连锁、驱散、强力单 Buff/Debuff 与治疗苏生） */
function evaluateSingleUnitSpell(
  state: BattleState,
  unit: BattleUnit,
  target: BattleUnit,
  tp: UnitThreatProfile,
  spell: SpellDef,
  eff: string,
  intel: BattlefieldIntel,
  catalog: CombatContentCatalog,
): number {
  const { personality } = intel;
  const sp = intel.activeProfile.stats.spellPower;
  const isEnemy = target.side !== unit.side;

  // 敌方挂有贤者折光时，单体攻击法术会被反弹 50% 给施法者
  const mirrorRiskPenalty = (rawDmg: number) =>
    isEnemy && target.statusEffects?.magicMirror && !unit.abilities.magicImmune
      ? rawDmg * 0.5 * (unit.kind === 'hero' ? 1.45 : 0.9)
      : 0;

  // ====== 敌方硬控与点杀 ======
  if (isEnemy) {
    if (eff === 'hypnotize') {
      if (tp.isHardCCed) return 0;
      return (tp.threatScore * 1.55 + tp.expectedDps * 0.8) * personality.controlIllusionBias;
    }
    if (eff === 'berserk') {
      if (tp.isHardCCed || target.statusEffects?.berserkRounds) return 0;
      const nearbyOtherEnemies = intel.enemies.filter(
        (other) => other.id !== target.id && getUnitMinDistance(target, other) <= tp.stats.speed + 1,
      );
      if (nearbyOtherEnemies.length === 0) return 0;
      return (tp.threatScore * 1.25 + nearbyOtherEnemies.length * 38) * personality.controlIllusionBias;
    }
    if (eff === 'blind' || eff === 'song_of_peace') {
      if (tp.isHardCCed) return 0;
      const unactedBonus = tp.canActLaterThisRound ? 45 : 15;
      return (tp.threatScore * 1.05 + unactedBonus) * personality.controlIllusionBias;
    }
    if (eff === 'forgetfulness') {
      if (!tp.isActiveRanged || tp.isHardCCed) return 0;
      return (tp.expectedDps * 1.6 + (tp.isUnpinnedRanged ? 65 : 20)) * personality.controlIllusionBias;
    }
    if (eff === 'confusion') {
      if (tp.isHardCCed || !tp.canActLaterThisRound) return 0;
      return tp.threatScore * 0.85 * personality.controlIllusionBias;
    }
    if (eff === 'wasp_swarm') {
      const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 14, 0.4, sp, catalog);
      const dmgScore = scoreDamageOnEnemy(state, tp, estimateNetSpellDamage(target, tp, spell, raw), intel);
      const ccScore = !tp.isHardCCed && tp.canActLaterThisRound ? tp.threatScore * 0.65 : 0;
      return (dmgScore + ccScore) * personality.controlIllusionBias;
    }
    if (eff === 'cowardice') {
      if (tp.isHardCCed || tp.isActiveRanged || (target.statusEffects?.cowardiceRounds ?? 0) > 0) return 0;
      return tp.expectedDps * 0.72 * personality.controlIllusionBias;
    }
    if (eff === 'power_drain' || eff === 'magic_leech' || eff === 'spell_shackle') {
      if (!tp.isSpellcaster || (target.mana ?? 0) < 6) return 0;
      if ((eff === 'power_drain' || eff === 'magic_leech') && target.statusEffects?.powerDrain) return 0;
      if (eff === 'spell_shackle' && (target.statusEffects?.spellShacklePower ?? 0) > 0) return 0;
      const base = target.kind === 'hero' ? 125 : 75;
      return (base + Math.min(55, (target.mana ?? 0) * 1.2)) * personality.debuffNecroBias;
    }
    if (eff === 'displacement') {
      // 将贴脸压制我方脆皮射手/英雄的敌方近战震开！
      const pinningOurCarry = intel.allies.some(
        (a) =>
          (a.kind === 'hero' || intel.getProfile(a.id)?.isActiveRanged) &&
          getUnitMinDistance(a, target) === 1,
      );
      return pinningOurCarry ? (85 + tp.expectedDps * 0.45) * personality.controlIllusionBias : 0;
    }
    if (eff === 'cancellation' || eff === 'steal_enchantment') {
      if (tp.positiveBuffScore < 34) return 0;
      const mult = eff === 'steal_enchantment' ? 1.45 : 1.05;
      return tp.positiveBuffScore * mult * personality.controlIllusionBias;
    }
    if (eff === 'dispel') {
      const net = tp.positiveBuffScore - tp.negativeDebuffScore * 0.8;
      return net >= 42 ? net * personality.controlIllusionBias : 0;
    }
    if (eff === 'curse') {
      if (target.statusEffects?.curse || tp.isHardCCed) return 0;
      const spread = Math.max(0, tp.stats.maxDamage - tp.stats.minDamage) * target.count;
      return (spread * 0.75 + tp.expectedDps * 0.28 + (target.statusEffects?.bless ? 45 : 0)) * personality.debuffNecroBias;
    }
    if (eff === 'poison') {
      const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 15, 0.4, sp, catalog);
      if ((target.statusEffects?.poisonPower ?? 0) >= raw * 0.85) return 0;
      const net = estimateNetSpellDamage(target, tp, spell, raw);
      return scoreDamageOnEnemy(state, tp, Math.round(net * 2.5), intel) * personality.debuffNecroBias;
    }
    if (eff === 'banish') {
      const isTargetSummon = Boolean(target.isSummoned || target.isIllusion);
      const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 75, 0.9, sp, catalog) * (isTargetSummon ? 3.2 : 0.35);
      const net = estimateNetSpellDamage(target, tp, spell, raw);
      return scoreDamageOnEnemy(state, tp, net, intel) * (isTargetSummon ? 1.25 : 0.6) * personality.controlIllusionBias;
    }
    if (eff === 'holy_word') {
      const mult = isUndeadUnit(target) || target.alignment === 'death' || target.abilities.darkNature ? 1.25 : target.alignment === 'chaos' ? 0.85 : 0.5;
      const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 24, 0.5, sp, catalog) * mult;
      const net = estimateNetSpellDamage(target, tp, spell, raw);
      return Math.max(0, scoreDamageOnEnemy(state, tp, net, intel) - mirrorRiskPenalty(raw)) * personality.nukeBias;
    }
    if (eff === 'hand_of_death') {
      if (isImmuneToLivingEffects(target)) return 0;
      const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 76, 1.0, sp, catalog);
      let net = 0;
      if (target.kind === 'creature') {
        let effPow = raw;
        if (isDarkMagicVulnerable(target)) effPow *= DARK_MAGIC_VULNERABILITY_MULT;
        if (target.abilities.deathWard) effPow *= 0.5;
        else if (target.statusEffects?.schoolWards?.death) effPow *= 0.65;
        effPow *= Math.max(0, 1 - tp.stats.magicResistance);
        const kills = Math.max(1, Math.min(target.count, Math.floor(effPow / Math.max(12, tp.stats.maxHp))));
        net = kills * tp.stats.maxHp;
      } else {
        net = estimateNetSpellDamage(target, tp, spell, raw);
      }
      return Math.max(0, scoreDamageOnEnemy(state, tp, net, intel) - mirrorRiskPenalty(raw)) * personality.nukeBias;
    }
    if (eff === 'disintegrate') {
      const raw = calcEstimatedPower(unit, spell, spell.damageBase ?? 85, 1.0, sp, catalog);
      const net = estimateNetSpellDamage(target, tp, spell, raw);
      const antiNecroBonus =
        net >= tp.totalHp &&
        intel.enemies.some((e) => e.knownSpellIds.some((id) => catalog.spells[id]?.targetType === 'corpse_unit'))
          ? 35
          : 0;
      return Math.max(0, scoreDamageOnEnemy(state, tp, net, intel) + antiNecroBonus - mirrorRiskPenalty(raw)) * personality.nukeBias;
    }
    if (eff === 'chain_lightning') {
      // 完整模拟 4 次最近目标弹射，严格扣减弹回友军的误伤代价！
      const baseRaw = calcEstimatedPower(unit, spell, spell.damageBase ?? 68, 0.8, sp, catalog);
      const hitSet = new Set<string>([target.id]);
      let totalScore = scoreDamageOnEnemy(state, tp, estimateNetSpellDamage(target, tp, spell, baseRaw), intel) - mirrorRiskPenalty(baseRaw);

      let curr = target;
      let currRaw = baseRaw * 0.5;
      for (let bounce = 0; bounce < 4; bounce++) {
        const nextCand = Object.values(state.units)
          .filter((u) => u.status === 'alive' && !hitSet.has(u.id) && !u.abilities.magicImmune && !u.statusEffects?.sanctuary)
          .sort((a, b) => {
            const da = getUnitMinDistance(curr, a);
            const db = getUnitMinDistance(curr, b);
            if (da !== db) return da - db;
            return (a.side !== unit.side ? 0 : 1) - (b.side !== unit.side ? 0 : 1);
          })[0];
        if (!nextCand || getUnitMinDistance(curr, nextCand) > 6) break;
        hitSet.add(nextCand.id);
        const np = intel.getProfile(nextCand.id);
        if (np) {
          const bounceNet = estimateNetSpellDamage(nextCand, np, spell, currRaw);
          if (nextCand.side !== unit.side) {
            totalScore += scoreDamageOnEnemy(state, np, bounceNet, intel);
          } else {
            totalScore -= bounceNet * np.valuePerHp * (nextCand.kind === 'hero' ? 1.7 : 1.3);
          }
        }
        curr = nextCand;
        currRaw *= 0.5;
      }
      return Math.max(0, totalScore * personality.nukeBias);
    }

    // 标准敌方单体伤害 / 减益
    let score = 0;
    if (spell.damageBase) {
      const spW = spell.level >= 4 ? 0.8 : spell.level === 3 ? 0.6 : 0.5;
      const raw = calcEstimatedPower(unit, spell, spell.damageBase, spW, sp, catalog);
      const net = estimateNetSpellDamage(target, tp, spell, raw);
      score += Math.max(0, scoreDamageOnEnemy(state, tp, net, intel) - mirrorRiskPenalty(raw)) * personality.nukeBias;
    }
    if (spell.debuffModifiers?.length && !hasSpellModifier(target, spell.id) && !tp.isHardCCed) {
      score += scoreModifierListOnEnemy(spell.debuffModifiers, tp) * personality.debuffNecroBias;
    }
    return score;
  }

  // ====== 友方单体增益 / 保护 / 治疗 / 苏生 / 驱魔 ======
  if (eff === 'exorcism') {
    return tp.negativeDebuffScore >= 42 ? tp.negativeDebuffScore * 1.3 * personality.healCleanseBias : 0;
  }
  if (eff === 'dispel') {
    const net = tp.negativeDebuffScore - tp.positiveBuffScore * 0.95;
    return net >= 48 ? net * 1.2 * personality.healCleanseBias : 0;
  }
  if (eff === 'guardian_angel') {
    if ((target.statusEffects?.guardianAngelLives ?? 0) > 0) return 0;
    const danger = intel.getFootprintDanger(target.pos, target.footprint);
    const injured = target.count < target.maxCount || target.currentHp < tp.stats.maxHp * 0.72;
    if (!injured && danger < 45 && tp.tierWeight < 3) return 0;
    return (85 + tp.threatScore * 0.45 + (injured ? 45 : 0)) * personality.healCleanseBias;
  }
  if (eff === 'sanctuary') {
    if (target.statusEffects?.sanctuary) return 0;
    const danger = intel.getFootprintDanger(target.pos, target.footprint);
    if (target.kind === 'hero' && target.currentHp < tp.stats.maxHp * 0.45 && danger > 40) {
      return 165 * personality.healCleanseBias;
    }
    return 0;
  }
  if (eff === 'regeneration') {
    if ((target.statusEffects?.regenPerRound ?? 0) > 0) return 0;
    if (tp.totalHp < 110) return 0;
    const reg = calcEstimatedPower(unit, spell, spell.healBase ?? 20, 0.5, sp, catalog);
    return (reg * 2.1 + (target.kind === 'hero' ? 30 : 0)) * personality.healCleanseBias;
  }
  if (eff === 'cat_reflexes') {
    if (target.abilities.doubleStrike || tp.isHardCCed) return 0;
    return (tp.expectedDps * 0.95 + (tp.canActLaterThisRound ? 30 : 10)) * personality.buffBias;
  }
  if (eff === 'dragon_strength' || eff === 'giant_strength') {
    if (hasSpellModifier(target, spell.id) || tp.isHardCCed) return 0;
    const mult = eff === 'dragon_strength' ? 1.0 : 0.28;
    return (tp.expectedDps * mult * 0.95 + tp.totalHp * mult * 0.22) * personality.buffBias;
  }
  if (eff === 'vampiric_touch') {
    if (target.statusEffects?.vampiricTouch || target.abilities.lifeDraining || tp.isActiveRanged || target.abilities.noMelee) return 0;
    return (tp.expectedDps * 0.82 + tp.totalHp * 0.14) * personality.debuffNecroBias;
  }
  if (eff === 'bless') {
    if (target.statusEffects?.bless || tp.isHardCCed) return 0;
    const spread = Math.max(0, tp.stats.maxDamage - tp.stats.minDamage) * target.count;
    return (spread * 0.8 + tp.expectedDps * 0.28 + (target.statusEffects?.curse ? 45 : 0)) * personality.buffBias;
  }
  if (eff === 'precision') {
    if (!tp.isActiveRanged || tp.isHardCCed || (target.statusEffects?.precisionRounds ?? 0) > 1) return 0;
    return (tp.expectedDps * 0.85 + 25) * personality.buffBias;
  }
  if (eff === 'bloodlust' || eff === 'fire_aura') {
    if (tp.isActiveRanged || target.abilities.noMelee || tp.isHardCCed) return 0;
    if (eff === 'bloodlust' && (target.statusEffects?.bloodlustRounds ?? 0) > 1) return 0;
    if (eff === 'fire_aura' && target.statusEffects?.fireAura) return 0;
    return tp.expectedDps * 0.52 * personality.buffBias;
  }
  if (eff === 'first_strike') {
    if (target.abilities.firstStrike || tp.isActiveRanged || target.abilities.noMelee || tp.isHardCCed) return 0;
    return tp.expectedDps * 0.48 * personality.buffBias;
  }
  if (eff === 'aura_of_fear') {
    if (target.statusEffects?.auraOfFear || target.abilities.noRetaliation || tp.isActiveRanged || target.abilities.noMelee || tp.isHardCCed) return 0;
    return tp.expectedDps * 0.56 * personality.debuffNecroBias;
  }
  if (eff === 'flight') {
    if (target.abilities.flying || tp.isActiveRanged || target.abilities.noMelee || tp.isHardCCed) return 0;
    return (tp.expectedDps * 0.45 + 24) * personality.buffBias;
  }
  if (eff === 'blur') {
    if (target.statusEffects?.blur) return 0;
    const enemyRangedDps = intel.enemies.reduce((s, e) => s + (intel.getProfile(e.id)?.isActiveRanged ? intel.getProfile(e.id)!.expectedDps : 0), 0);
    if (enemyRangedDps < 30) return 0;
    return Math.min(95, enemyRangedDps * 0.4 + (target.kind === 'hero' ? 28 : 14)) * personality.buffBias;
  }
  if (eff === 'retribution' || eff === 'pain_mirror') {
    if (eff === 'retribution' && target.statusEffects?.retribution) return 0;
    if (eff === 'pain_mirror' && target.statusEffects?.painMirror) return 0;
    const danger = intel.getFootprintDanger(target.pos, target.footprint);
    if (danger < 35 && !isEngagedInMelee(state, target)) return 0;
    return (danger * (eff === 'pain_mirror' ? 0.72 : 0.48) + 22) * personality.buffBias;
  }
  if (eff === 'magic_mirror') {
    if (target.statusEffects?.magicMirror) return 0;
    const enemyCasterThreat = intel.enemies.some(
      (e) => intel.getProfile(e.id)?.isSpellcaster && getUnitMinDistance(target, e) <= 22,
    );
    return enemyCasterThreat && (target.kind === 'hero' || tp.tierWeight >= 3) ? 68 * personality.buffBias : 0;
  }
  if (eff === 'anti_magic') {
    if (target.abilities.magicImmune || target.statusEffects?.antiMagic) return 0;
    const enemyCasters = intel.enemies.filter((e) => intel.getProfile(e.id)?.isSpellcaster).length;
    if (enemyCasters === 0 || (target.kind !== 'hero' && tp.tierWeight < 3)) return 0;
    return (55 + enemyCasters * 26) * personality.buffBias;
  }
  if (eff === 'ward_single' && spell.wardSchool) {
    if (target.statusEffects?.schoolWards?.[spell.wardSchool]) return 0;
    const enemyHasSchool = intel.enemies.some((e) => e.alignment === spell.wardSchool);
    if (!enemyHasSchool || (target.kind !== 'hero' && tp.tierWeight < 3)) return 0;
    return 48 * personality.buffBias;
  }
  if (eff === 'slayer') {
    if (target.statusEffects?.slayer) return 0;
    const hasT4 = intel.enemies.some((e) => (intel.getProfile(e.id)?.tierWeight ?? 1) >= 4);
    return hasT4 ? tp.expectedDps * 0.42 * personality.buffBias : 0;
  }
  if (eff === 'terrain_walk') {
    if (target.abilities.flying || target.statusEffects?.terrainWalk) return 0;
    return (state.battleSpellFlags?.quicksandHexKeys?.length ?? 0) > 0 ? 55 : 0;
  }

  // 标准友方苏生 / 治疗 / 单体 Buff
  let score = 0;
  if (spell.reviveBase && !isImmuneToLivingHeal(target) && target.count < target.maxCount) {
    const revPow = calcEstimatedPower(unit, spell, spell.reviveBase, 1.2, sp, catalog);
    const missing = Math.max(0, target.maxCount * tp.stats.maxHp - tp.totalHp);
    const restored = Math.min(missing, revPow);
    score += (restored * tp.valuePerHp * 1.15 + 35) * personality.healCleanseBias;
  } else if (spell.healBase && !isImmuneToLivingHeal(target)) {
    const healPow = calcEstimatedPower(unit, spell, spell.healBase, 0.6, sp, catalog);
    const missing = Math.max(0, tp.stats.maxHp - target.currentHp);
    const poisonCleanse =
      spell.id === 'life_heal' && ((target.statusEffects?.poisonPower ?? 0) > 0 || (target.statusEffects?.plaguePower ?? 0) > 0)
        ? 45
        : 0;
    if (missing >= tp.stats.maxHp * 0.28 || poisonCleanse > 0) {
      const urgency = target.kind === 'hero' && target.currentHp < tp.stats.maxHp * 0.55 ? 1.55 : 1.05;
      score += (Math.min(missing, healPow) * tp.valuePerHp * urgency + poisonCleanse) * personality.healCleanseBias;
    }
  }
  if (spell.buffModifiers?.length && !hasSpellModifier(target, spell.id) && !tp.isHardCCed) {
    score += scoreModifierListOnAlly(spell.buffModifiers, tp, state) * personality.buffBias;
  }
  return score;
}

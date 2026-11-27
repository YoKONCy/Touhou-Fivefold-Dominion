/**
 * 统一属性修饰器管线（Modifier Stack）+ 全 36 技能树数值引擎 + 全 48 职业判定与光环引擎 + DLC 组合神器套装引擎
 */

import { computeArmyAlignmentMorale } from './alignment';
import { isImmuneToMorale, isUndeadUnit } from './creatureTypes';
import { getFootprintHexes, minHexSetDistance } from './hex';
import {
  ALL_PRIMARY_SKILL_IDS,
  ALL_SECONDARY_SKILL_IDS,
  COMBAT_DEFENSE_PCT_BY_RANK,
  MAGIC_MANA_BONUS_BY_RANK,
  MAGIC_PRIMARY_SKILL_IDS,
  MAGIC_RESISTANCE_BY_RANK,
  resolveActiveHeroClass,
  resolveEligibleAdvancedClasses,
  TACTICS_DEFENSE_PCT_BY_RANK,
  TACTICS_INITIATIVE_BY_RANK,
  TACTICS_OFFENSE_PCT_BY_RANK,
  TACTICS_SPEED_BY_RANK,
} from './h4Skills';
import { HERO_TRAIT_REGISTRY } from './traits';
import type {
  AdvancedClassDef,
  ArtifactDef,
  ArtifactSetDef,
  BattleState,
  BattleUnit,
  ComputedUnitStats,
  PrimarySkillId,
  SecondarySkillId,
  SkillRank,
  StatBreakdownItem,
  StatKey,
  StatModifier,
} from './types';

/**
 * 核心数据注册表接口（供引擎解耦注入，方便测试与后期扩展）
 */
export interface GameDataRegistry {
  advancedClasses: Record<string, AdvancedClassDef>;
  artifacts: Record<string, ArtifactDef>;
  artifactSets: Record<string, ArtifactSetDef>;
}

/**
 * 根据 HoMM4 完整 36 技能树规则实时判定英雄当前生效的进阶/基础职业
 * 支持玩家在战斗场景外主动切换至任意已满足条件的进阶组合职业（selectedClassId）。
 */
export function resolveAdvancedClass(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  advancedClasses: Record<string, AdvancedClassDef>,
  subSkills?: Partial<Record<SecondarySkillId, SkillRank>>,
  selectedClassId?: string | null,
): AdvancedClassDef | null {
  return resolveActiveHeroClass(skills, subSkills, advancedClasses, selectedClassId);
}

/** 便捷重导出：查询英雄已解锁的全部可切换进阶职业 */
export { resolveEligibleAdvancedClasses };

/**
 * 计算英雄当前激活的《极速风暴》组合神器套装
 */
export function resolveActiveArtifactSets(
  equippedIds: readonly string[],
  artifacts: Record<string, ArtifactDef>,
  sets: Record<string, ArtifactSetDef>,
): ArtifactSetDef[] {
  const countBySet = new Map<string, number>();
  for (const artId of equippedIds) {
    const def = artifacts[artId];
    if (!def?.setId) continue;
    countBySet.set(def.setId, (countBySet.get(def.setId) ?? 0) + 1);
  }

  const active: ArtifactSetDef[] = [];
  for (const [setId, count] of countBySet.entries()) {
    const setDef = sets[setId];
    if (setDef && count >= setDef.requiredCount) {
      active.push(setDef);
    }
  }
  return active;
}

/** 影遁潜行深潜安全距离：周围 6 格内无存活敌军时效果翻倍 */
export const STEALTH_DEEP_SAFE_RANGE = 6;

/** 判断具备「影遁潜行」的单位周围 6 格内是否没有任何存活敌军（满足时潜行额外获得一倍效果） */
export function isStealthDeepened(unit: BattleUnit, state: BattleState): boolean {
  if (!unit.abilities.stealth || unit.status !== 'alive') return false;
  const myHexes = getFootprintHexes(unit.pos, unit.footprint);
  for (const other of Object.values(state.units)) {
    if (other.status !== 'alive' || other.side === unit.side) continue;
    const otherHexes = getFootprintHexes(other.pos, other.footprint);
    if (minHexSetDistance(myHexes, otherHexes) <= STEALTH_DEEP_SAFE_RANGE) {
      return false;
    }
  }
  return true;
}

/** 计算某阶梯等级在给定阈值数组下达成的段数（例如 [2, 4, 5] 下 Lv.4 返回 2） */
function countThresholds(rank: number, thresholds: readonly number[]): number {
  let c = 0;
  for (const t of thresholds) {
    if (rank >= t) c += 1;
  }
  return c;
}

/**
 * 聚合单位当前全部生效的 StatModifier
 * 完整覆盖：阵营士气、同队英雄 36 技能全军光环、英雄个人技能树与 48 职业被动、
 * 敌方威压职业光环、特质、神器套装、符卡领域、防御姿态与 20 槽位运行时 Buff/Debuff。
 */
export function collectUnitModifiers(
  unit: BattleUnit,
  state: BattleState,
  registry: GameDataRegistry,
): StatModifier[] {
  const list: StatModifier[] = [];

  // 1. 阵营五角星混编士气修正（机械与不死完全免疫正负士气）
  const aliveAllies = Object.values(state.units).filter((u) => u.side === unit.side && u.status === 'alive');
  const allyAlignments = aliveAllies.map((u) => u.alignment);
  const alignmentMorale = computeArmyAlignmentMorale(allyAlignments);
  const moraleImmune = isImmuneToMorale(unit);
  if (alignmentMorale.moraleDelta !== 0 && !moraleImmune) {
    list.push({
      id: 'sys:alignment_morale',
      stat: 'morale',
      mode: 'flat',
      value: alignmentMorale.moraleDelta,
      sourceName: alignmentMorale.reason,
      remainingRounds: null,
    });
  }

  // 1b. 原版 HoMM4 不死同队士气惩罚：同队存在不死生物时，令所有非死亡阵营且吃士气的友军额外 -2 士气
  const hasAliveUndeadAlly = aliveAllies.some((a) => isUndeadUnit(a));
  if (hasAliveUndeadAlly && unit.alignment !== 'death' && !moraleImmune) {
    list.push({
      id: 'sys:undead_ally_morale',
      stat: 'morale',
      mode: 'flat',
      value: -2,
      sourceName: '同队不死威压 (-2)',
      remainingRounds: null,
    });
  }

  // 2. 同队存活英雄的 HoMM4 指挥型主/子技能全军光环 + 职业全军光环（取己方最高阶位防无限叠乘）
  const bestPrimary: Partial<Record<PrimarySkillId, number>> = {};
  const bestSub: Partial<Record<SecondarySkillId, number>> = {};
  let bestClassAllyMorale = 0;
  let bestClassAllyLuck = 0;
  let bestClassAllySpeed = 0;
  let bestClassAllyInit = 0;
  let bestClassAllyOff = 0;
  let bestClassAllyDef = 0;
  let bestClassAllyHp = 0;
  let worstEnemyMorale = 0;

  for (const other of Object.values(state.units)) {
    if (other.status !== 'alive' || other.kind !== 'hero') continue;
    const otherClass = resolveAdvancedClass(
      other.skills,
      registry.advancedClasses,
      other.subSkills,
      other.selectedAdvancedClassId,
    );
    const p = otherClass?.passive;

    if (other.side === unit.side) {
      for (const pk of ALL_PRIMARY_SKILL_IDS) {
        const r = other.skills[pk] ?? 0;
        if (r > (bestPrimary[pk] ?? 0)) bestPrimary[pk] = r;
      }
      if (other.subSkills) {
        for (const sk of ALL_SECONDARY_SKILL_IDS) {
          const r = other.subSkills[sk] ?? 0;
          if (r > (bestSub[sk] ?? 0)) bestSub[sk] = r;
        }
      }
      if (p) {
        bestClassAllyMorale = Math.max(bestClassAllyMorale, p.allyMoraleDelta ?? 0);
        bestClassAllyLuck = Math.max(bestClassAllyLuck, p.allyLuckDelta ?? 0);
        bestClassAllySpeed = Math.max(bestClassAllySpeed, p.allySpeedDelta ?? 0);
        bestClassAllyInit = Math.max(bestClassAllyInit, p.allyInitiativeDelta ?? 0);
        bestClassAllyOff = Math.max(bestClassAllyOff, p.allyOffensePct ?? 0);
        bestClassAllyDef = Math.max(bestClassAllyDef, p.allyDefensePct ?? 0);
        bestClassAllyHp = Math.max(bestClassAllyHp, p.allyHpPct ?? 0);
      }
    } else if (p?.enemyMoraleDelta) {
      worstEnemyMorale = Math.min(worstEnemyMorale, p.enemyMoraleDelta);
    }
  }

  // 2a. 战术主技能（移速 +1/+1/+2/+2/+3，先手 +1~+5）+ 进攻/防御/领导子技能全军光环
  const tacticsRank = bestPrimary.tactics ?? 0;
  if (tacticsRank > 0) {
    const tacSpd = TACTICS_SPEED_BY_RANK[tacticsRank] ?? 0;
    const tacInit = TACTICS_INITIATIVE_BY_RANK[tacticsRank] ?? 0;
    if (tacSpd > 0) {
      list.push({
        id: 'sys:tactics_spd',
        stat: 'speed',
        mode: 'flat',
        value: tacSpd,
        sourceName: `战术行军 Lv.${tacticsRank}`,
        remainingRounds: null,
      });
    }
    if (tacInit > 0) {
      list.push({
        id: 'sys:tactics_init',
        stat: 'initiative',
        mode: 'flat',
        value: tacInit,
        sourceName: `战术先手 Lv.${tacticsRank}`,
        remainingRounds: null,
      });
    }
  }
  const offenseRank = bestSub.offense ?? 0;
  if (offenseRank > 0) {
    list.push({
      id: 'sys:sub_offense',
      stat: 'attack',
      mode: 'percent',
      value: TACTICS_OFFENSE_PCT_BY_RANK[offenseRank] ?? offenseRank * 0.1,
      sourceName: `子技能·进攻 Lv.${offenseRank}`,
      remainingRounds: null,
    });
  }
  const defenseRank = bestSub.defense ?? 0;
  if (defenseRank > 0) {
    list.push({
      id: 'sys:sub_defense',
      stat: 'defense',
      mode: 'percent',
      value: TACTICS_DEFENSE_PCT_BY_RANK[defenseRank] ?? defenseRank * 0.1,
      sourceName: `子技能·防御 Lv.${defenseRank}`,
      remainingRounds: null,
    });
  }
  const leadershipRank = bestSub.leadership ?? 0;
  if (leadershipRank > 0) {
    if (!moraleImmune) {
      list.push({
        id: 'sys:sub_leadership_morale',
        stat: 'morale',
        mode: 'flat',
        value: leadershipRank,
        sourceName: `子技能·领导 Lv.${leadershipRank}`,
        remainingRounds: null,
      });
    }
    list.push({
      id: 'sys:sub_leadership_luck',
      stat: 'luck',
      mode: 'flat',
      value: leadershipRank,
      sourceName: `子技能·领导 Lv.${leadershipRank}`,
      remainingRounds: null,
    });
  }

  // 2b. 侦查下属全军光环（寻路移速 / 航海闪避敏捷）
  const pathRank = bestSub.pathfinding ?? 0;
  const pathSpd = countThresholds(pathRank, [3, 5]);
  if (pathSpd > 0) {
    list.push({
      id: 'sys:sub_pathfinding',
      stat: 'speed',
      mode: 'flat',
      value: pathSpd,
      sourceName: `子技能·寻路 Lv.${pathRank}`,
      remainingRounds: null,
    });
  }
  const seamRank = bestSub.seamanship ?? 0;
  if (seamRank > 0) {
    list.push(
      {
        id: 'sys:sub_seam_graze',
        stat: 'grazeChance',
        mode: 'flat',
        value: seamRank * 0.02,
        sourceName: `子技能·航海 Lv.${seamRank}`,
        remainingRounds: null,
      },
      {
        id: 'sys:sub_seam_atk',
        stat: 'attack',
        mode: 'percent',
        value: seamRank * 0.02,
        sourceName: `子技能·航海 Lv.${seamRank}`,
        remainingRounds: null,
      },
      {
        id: 'sys:sub_seam_def',
        stat: 'defense',
        mode: 'percent',
        value: seamRank * 0.02,
        sourceName: `子技能·航海 Lv.${seamRank}`,
        remainingRounds: null,
      },
    );
  }

  // 2c. 贵族主/子技能战斗等价（精锐动员/理财幸运/采矿锻甲/外交士气）
  const nobilityRank = bestPrimary.nobility ?? 0;
  if (nobilityRank > 0) {
    list.push({
      id: 'sys:nobility_hp',
      stat: 'maxHp',
      mode: 'percent',
      value: nobilityRank * 0.03,
      sourceName: `贵族·精锐动员 Lv.${nobilityRank}`,
      remainingRounds: null,
    });
  }
  const estatesRank = bestSub.estates ?? 0;
  const estatesLuck = countThresholds(estatesRank, [2, 4, 5]);
  if (estatesLuck > 0) {
    list.push({
      id: 'sys:sub_estates',
      stat: 'luck',
      mode: 'flat',
      value: estatesLuck,
      sourceName: `子技能·理财 Lv.${estatesRank}`,
      remainingRounds: null,
    });
  }
  const miningRank = bestSub.mining ?? 0;
  if (miningRank > 0) {
    list.push({
      id: 'sys:sub_mining',
      stat: 'defense',
      mode: 'percent',
      value: miningRank * 0.02,
      sourceName: `子技能·采矿锻甲 Lv.${miningRank}`,
      remainingRounds: null,
    });
  }
  const diploRank = bestSub.diplomacy ?? 0;
  const diploMorale = countThresholds(diploRank, [2, 4, 5]);
  if (diploMorale > 0 && !moraleImmune) {
    list.push({
      id: 'sys:sub_diplomacy',
      stat: 'morale',
      mode: 'flat',
      value: diploMorale,
      sourceName: `子技能·外交号召 Lv.${diploRank}`,
      remainingRounds: null,
    });
  }

  // 2d. 进阶职业全军光环（注意 H4 原版中 General / Lord Commander / Field Marshal / Warden 仅加成己方生物部队，不叠英雄本身）
  const isCreature = unit.kind === 'creature';
  if (bestClassAllyMorale > 0 && !moraleImmune && isCreature) {
    list.push({ id: 'class_aura:morale', stat: 'morale', mode: 'flat', value: bestClassAllyMorale, sourceName: '职业光环·战意鼓舞', remainingRounds: null });
  }
  if (bestClassAllyLuck > 0 && isCreature) {
    list.push({ id: 'class_aura:luck', stat: 'luck', mode: 'flat', value: bestClassAllyLuck, sourceName: '职业光环·福运伴身', remainingRounds: null });
  }
  if (bestClassAllySpeed > 0 && isCreature) {
    list.push({ id: 'class_aura:spd', stat: 'speed', mode: 'flat', value: bestClassAllySpeed, sourceName: '职业光环·疾行军令', remainingRounds: null });
  }
  if (bestClassAllyInit > 0 && isCreature) {
    list.push({ id: 'class_aura:init', stat: 'initiative', mode: 'flat', value: bestClassAllyInit, sourceName: '职业光环·奇袭先手', remainingRounds: null });
  }
  if (bestClassAllyOff > 0 && isCreature) {
    list.push({ id: 'class_aura:off', stat: 'attack', mode: 'percent', value: bestClassAllyOff, sourceName: '职业光环·全军突击', remainingRounds: null });
  }
  if (bestClassAllyDef > 0 && isCreature) {
    list.push({ id: 'class_aura:def', stat: 'defense', mode: 'percent', value: bestClassAllyDef, sourceName: '职业光环·铁壁方阵', remainingRounds: null });
  }
  if (bestClassAllyHp > 0 && isCreature) {
    list.push({ id: 'class_aura:hp', stat: 'maxHp', mode: 'percent', value: bestClassAllyHp, sourceName: '职业光环·军魂强体', remainingRounds: null });
  }
  if (worstEnemyMorale < 0 && !moraleImmune && !unit.abilities.magicImmune) {
    list.push({ id: 'class_aura:enemy_fear', stat: 'morale', mode: 'flat', value: worstEnemyMorale, sourceName: '敌方职业威压', remainingRounds: null });
  }

  // 3. 英雄固有特质静态加成
  for (const traitId of unit.innateTraitIds) {
    const trait = HERO_TRAIT_REGISTRY[traitId];
    if (trait?.getPassiveModifiers) {
      list.push(...trait.getPassiveModifiers(unit, state));
    }
  }

  // 4. 英雄个人 36 技能树静态加成 + 激活职业加成 + 神器套装
  let heroMaxMoraleOverride = false;
  let heroMaxLuckOverride = false;

  if (unit.kind === 'hero') {
    const sk = unit.skills;
    const sub = unit.subSkills ?? {};

    // 格斗主技能：个人防卫（+20% / +40% / +60% / +80% / +100% 防御）+ 魔抗（30/50/70/80/100%）
    const combatRank = sk.combat ?? 0;
    if (combatRank > 0) {
      list.push({
        id: 'hero_sk:combat_def',
        stat: 'defense',
        mode: 'percent',
        value: COMBAT_DEFENSE_PCT_BY_RANK[combatRank] ?? combatRank * 0.2,
        sourceName: `格斗防卫 Lv.${combatRank}`,
        remainingRounds: null,
      });
    }
    const mrRank = sub.magic_resistance ?? 0;
    if (mrRank > 0) {
      list.push({
        id: 'hero_sub:mres',
        stat: 'magicResistance',
        mode: 'flat',
        value: MAGIC_RESISTANCE_BY_RANK[mrRank] ?? mrRank * 0.2,
        sourceName: `子技能·魔抗 Lv.${mrRank}`,
        remainingRounds: null,
      });
    }

    // 侦查主技能 & 潜行子技能
    const scoutRank = sk.scouting ?? 0;
    if (scoutRank > 0) {
      list.push(
        { id: 'hero_sk:scout_init', stat: 'initiative', mode: 'flat', value: scoutRank, sourceName: `侦查 Lv.${scoutRank}`, remainingRounds: null },
        { id: 'hero_sk:scout_graze', stat: 'grazeChance', mode: 'flat', value: scoutRank * 0.03, sourceName: `侦查洞察 Lv.${scoutRank}`, remainingRounds: null },
      );
    }
    if ((sub.stealth ?? 0) > 0) {
      list.push({ id: 'hero_sub:stealth', stat: 'grazeChance', mode: 'flat', value: sub.stealth! * 0.05, sourceName: `子技能·潜行 Lv.${sub.stealth}`, remainingRounds: null });
    }

    // 五系魔法主技能法强 + 五系对称灵力上限子技能（灵性/巫术/神秘/魔咒/冥想：各 +10/阶 最大灵力）
    let magicRankSum = 0;
    for (const mk of MAGIC_PRIMARY_SKILL_IDS) {
      magicRankSum += sk[mk] ?? 0;
    }
    if (magicRankSum > 0) {
      const spBonus = Math.min(12, Math.floor(magicRankSum * 0.5));
      if (spBonus > 0) {
        list.push({ id: 'hero_sk:magic_sp', stat: 'spellPower', mode: 'flat', value: spBonus, sourceName: `五系魔导修为 (+${spBonus})`, remainingRounds: null });
      }
    }
    const manaSubList: Array<{ key: SecondarySkillId; name: string }> = [
      { key: 'spirituality', name: '灵性' },
      { key: 'wizardry', name: '巫术' },
      { key: 'occultism', name: '神秘' },
      { key: 'conjuration', name: '魔咒' },
      { key: 'meditation', name: '冥想' },
    ];
    for (const ms of manaSubList) {
      const r = sub[ms.key] ?? 0;
      if (r > 0) {
        list.push({
          id: `hero_sub:${ms.key}`,
          stat: 'maxMana',
          mode: 'flat',
          value: MAGIC_MANA_BONUS_BY_RANK[r] ?? r * 10,
          sourceName: `子技能·${ms.name} Lv.${r}`,
          remainingRounds: null,
        });
      }
    }

    // 激活进阶/基础职业属性加成与专属被动（如幻冥魔导常驻残影、先知灵甲）
    const advClass = resolveAdvancedClass(
      unit.skills,
      registry.advancedClasses,
      unit.subSkills,
      unit.selectedAdvancedClassId,
    );
    if (advClass) {
      advClass.bonuses.forEach((b, idx) => {
        list.push({
          ...b,
          id: `class:${advClass.id}:${idx}`,
          remainingRounds: null,
        });
      });
      if (advClass.passive?.grantPermanentBlur && !unit.statusEffects?.blur) {
        list.push({
          id: `class:${advClass.id}:blur_graze`,
          stat: 'grazeChance',
          mode: 'flat',
          value: 0.25,
          sourceName: `职业·${advClass.name}`,
          remainingRounds: null,
        });
      }
      if (advClass.passive?.heroMaxMorale) heroMaxMoraleOverride = true;
      if (advClass.passive?.heroMaxLuck) heroMaxLuckOverride = true;
    }

    // 5. 装备单件与组合神器套装加成
    for (const artId of unit.equippedArtifactIds) {
      const art = registry.artifacts[artId];
      if (!art) continue;
      art.modifiers.forEach((m, idx) => {
        list.push({ ...m, id: `art:${artId}:${idx}`, remainingRounds: null });
      });
    }
    const activeSets = resolveActiveArtifactSets(
      unit.equippedArtifactIds,
      registry.artifacts,
      registry.artifactSets,
    );
    for (const setDef of activeSets) {
      setDef.modifiers.forEach((m, idx) => {
        list.push({ ...m, id: `set:${setDef.id}:${idx}`, remainingRounds: null });
      });
    }
  }

  // 6. 战场符卡结界领域加成（全魔法免疫单位同时无视友方增益与敌方减益魔法结界！）
  if (state.activeFieldAura && !unit.abilities.magicImmune) {
    const aura = state.activeFieldAura;
    const mods = unit.side === aura.casterSide ? aura.allyModifiers : aura.enemyModifiers;
    mods.forEach((m, idx) => {
      list.push({ ...m, id: `aura:${aura.id}:${idx}`, remainingRounds: aura.remainingRounds });
    });
  }

  // 7. 单位自身运行时临时修饰器（法术、药水）
  list.push(...unit.modifiers);

  // 8. 防御姿态（叠加生命系「守护者 Defender」法术时额外再 +50% 防御！）
  if (unit.isDefending) {
    list.push({
      id: 'sys:defend_stance',
      stat: 'defense',
      mode: 'percent',
      value: 0.35,
      sourceName: '防御姿态 (+35%)',
      remainingRounds: 1,
    });
    if (unit.statusEffects?.defenderBonus) {
      list.push({
        id: 'sys:defender_spell_stance',
        stat: 'defense',
        mode: 'percent',
        value: 0.5,
        sourceName: '术式·不动如山 (+50%)',
        remainingRounds: 1,
      });
    }
  }

  // 9. 特技被动与异常状态修正
  if (unit.abilities.stealth) {
    const deepened = isStealthDeepened(unit, state);
    list.push({
      id: 'sys:stealth_graze',
      stat: 'grazeChance',
      mode: 'flat',
      value: deepened ? 0.32 : 0.16,
      sourceName: deepened ? '特技·影遁潜行·深潜×2' : '特技·影遁潜行',
      remainingRounds: null,
    });
  }
  if (unit.statusEffects?.blur) {
    list.push({
      id: 'sys:spell_blur_graze',
      stat: 'grazeChance',
      mode: 'flat',
      value: 0.25,
      sourceName: '术式·蜃气残影',
      remainingRounds: null,
    });
  }
  if (unit.statusEffects?.terrifiedRounds > 0) {
    list.push({
      id: 'sys:status_terrified',
      stat: 'defense',
      mode: 'percent',
      value: -0.15,
      sourceName: '状态·噩梦震慑 (-15%防)',
      remainingRounds: unit.statusEffects.terrifiedRounds,
    });
  }

  // 10. 博丽圣军师（极高士气）/ 幻想乐师（极高幸运）恒定上限锁定标记
  if (heroMaxMoraleOverride && !moraleImmune) {
    list.push({
      id: 'class:hero_max_morale',
      stat: 'morale',
      mode: 'flat',
      value: 10,
      sourceName: '职业·神佑信念(士气恒定满值)',
      remainingRounds: null,
    });
  }
  if (heroMaxLuckOverride) {
    list.push({
      id: 'class:hero_max_luck',
      stat: 'luck',
      mode: 'flat',
      value: 10,
      sourceName: '职业·神乐吉祥(幸运恒定满值)',
      remainingRounds: null,
    });
  }

  return list;
}

/**
 * 极速计算单位的实时有效魔法抗性（零堆分配，不触发全场单位扫描与阵营士气计算，供施法高频校验使用）
 */
export function getUnitEffectiveMagicResistance(
  unit: BattleUnit,
  state: BattleState,
  registry: GameDataRegistry,
): number {
  if (unit.abilities.magicImmune) return 1;
  let total = unit.baseStats.magicResistance;

  for (const traitId of unit.innateTraitIds) {
    const trait = HERO_TRAIT_REGISTRY[traitId];
    if (trait?.getPassiveModifiers) {
      for (const m of trait.getPassiveModifiers(unit, state)) {
        if (m.stat === 'magicResistance') {
          total += m.mode === 'percent' ? unit.baseStats.magicResistance * m.value : m.value;
        }
      }
    }
  }

  if (unit.kind === 'hero') {
    const mrRank = unit.subSkills?.magic_resistance ?? 0;
    if (mrRank > 0) {
      total += MAGIC_RESISTANCE_BY_RANK[mrRank] ?? mrRank * 0.2;
    }
    const advClass = resolveAdvancedClass(
      unit.skills,
      registry.advancedClasses,
      unit.subSkills,
      unit.selectedAdvancedClassId,
    );
    if (advClass) {
      for (const b of advClass.bonuses) {
        if (b.stat === 'magicResistance') {
          total += b.mode === 'percent' ? unit.baseStats.magicResistance * b.value : b.value;
        }
      }
    }
    for (const artId of unit.equippedArtifactIds) {
      const art = registry.artifacts[artId];
      if (!art) continue;
      for (const m of art.modifiers) {
        if (m.stat === 'magicResistance') {
          total += m.mode === 'percent' ? unit.baseStats.magicResistance * m.value : m.value;
        }
      }
    }
    for (const setDef of resolveActiveArtifactSets(unit.equippedArtifactIds, registry.artifacts, registry.artifactSets)) {
      for (const m of setDef.modifiers) {
        if (m.stat === 'magicResistance') {
          total += m.mode === 'percent' ? unit.baseStats.magicResistance * m.value : m.value;
        }
      }
    }
  }

  if (state.activeFieldAura && !unit.abilities.magicImmune) {
    const aura = state.activeFieldAura;
    const mods = unit.side === aura.casterSide ? aura.allyModifiers : aura.enemyModifiers;
    for (const m of mods) {
      if (m.stat === 'magicResistance') {
        total += m.mode === 'percent' ? unit.baseStats.magicResistance * m.value : m.value;
      }
    }
  }

  for (const m of unit.modifiers) {
    if (m.stat === 'magicResistance') {
      total += m.mode === 'percent' ? unit.baseStats.magicResistance * m.value : m.value;
    }
  }

  return Math.max(-0.5, Math.min(1.0, Number(total.toFixed(3))));
}

const STAT_KEYS: readonly StatKey[] = [
  'attack',
  'defense',
  'minDamage',
  'maxDamage',
  'maxHp',
  'speed',
  'initiative',
  'range',
  'morale',
  'luck',
  'magicResistance',
  'grazeChance',
  'spellPower',
  'maxMana',
];

/**
 * 计算单位的最终有效属性与每一条修饰器的中文明细
 */
export function computeUnitStats(
  unit: BattleUnit,
  state: BattleState,
  registry: GameDataRegistry,
): ComputedUnitStats {
  const mods = collectUnitModifiers(unit, state, registry);
  const breakdowns: Partial<Record<StatKey, StatBreakdownItem[]>> = {};

  const result = {
    attack: unit.baseStats.attack,
    defense: unit.baseStats.defense,
    minDamage: unit.baseStats.minDamage,
    maxDamage: unit.baseStats.maxDamage,
    maxHp: unit.baseStats.maxHp,
    speed: unit.baseStats.speed,
    initiative: unit.baseStats.initiative,
    range: unit.baseStats.range,
    morale: unit.baseStats.morale,
    luck: unit.baseStats.luck,
    magicResistance: unit.baseStats.magicResistance,
    grazeChance: unit.baseStats.grazeChance,
    spellPower: unit.baseStats.spellPower,
    maxMana: unit.baseStats.maxMana,
  };

  for (const key of STAT_KEYS) {
    const base = unit.baseStats[key];
    let percentSum = 0;
    let flatSum = 0;
    const items: StatBreakdownItem[] = [];

    for (const mod of mods) {
      if (mod.stat !== key) continue;
      if (mod.mode === 'percent') {
        percentSum += mod.value;
        const pct = Math.round(mod.value * 100);
        items.push({
          sourceName: mod.sourceName,
          deltaText: `${pct >= 0 ? '+' : ''}${pct}%`,
        });
      } else {
        flatSum += mod.value;
        const text =
          key === 'grazeChance' || key === 'magicResistance'
            ? `${mod.value >= 0 ? '+' : ''}${Math.round(mod.value * 100)}%`
            : `${mod.value >= 0 ? '+' : ''}${mod.value}`;
        items.push({
          sourceName: mod.sourceName,
          deltaText: text,
        });
      }
    }

    let finalVal = base * (1 + percentSum) + flatSum;
    if (key === 'grazeChance') {
      finalVal = Math.max(0, Math.min(0.85, Number(finalVal.toFixed(3))));
    } else if (key === 'magicResistance') {
      finalVal = unit.abilities.magicImmune
        ? 1
        : Math.max(-0.5, Math.min(1.0, Number(finalVal.toFixed(3))));
    } else if (key === 'morale' || key === 'luck') {
      finalVal = Math.max(-10, Math.min(10, Math.round(finalVal)));
    } else if (key === 'maxMana' || key === 'spellPower') {
      finalVal = Math.max(0, Math.round(finalVal));
    } else {
      finalVal = Math.max(1, Math.round(finalVal));
    }

    result[key] = finalVal;
    if (items.length > 0) {
      breakdowns[key] = items;
    }
  }

  if (result.maxDamage < result.minDamage) {
    result.maxDamage = result.minDamage;
  }

  return {
    ...result,
    breakdowns,
  };
}

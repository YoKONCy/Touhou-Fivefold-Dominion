/**
 * HoMM4 六边形战术 AI（纯逻辑，零视图依赖，未来可直接迁入 Web Worker）
 *
 * 策略能力：
 * 1. 英雄低血量/缺灵力时优先使用腰带药水（免费动作）
 * 2. 满充能时智能评估释放专属符卡：
 *    - 直线贯穿符卡（如魔理沙《极限火花》）自动遍历全图角度寻找贯穿敌军价值最高射线
 *    - 结界领域符卡（如灵梦《梦想天生》）在敌军逼近或远程威胁下果断展开
 * 3. 完整评估 H4 两阶段同时反击的得失比（不会拿脆皮无脑撞高反击前排）
 * 4. 优先抢占高台（减少 25% 低处远程伤害并提升施法距离）与保持远程清晰视线
 */

import {
  checkSpellLineOfSight,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  getUnitMinDistance,
  getUnitOccupiedHexes,
  getUnitReachableMap,
  getValidMeleeApproachAnchors,
  previewAttack,
  type CombatContentCatalog,
} from '@core/combatEngine';
import {
  DARK_MAGIC_VULNERABILITY_MULT,
  isDarkMagicVulnerable,
  isImmuneToLivingHeal,
} from '@core/creatureTypes';
import {
  computeDualTrackSpellPower,
  getSchoolSpellMultiplier,
  validateSpellUnitTarget,
} from '@core/h4SpellExecutor';
import { getFootprintHexes, hexDistance, hexKey, hexRay, minHexSetDistance, type HexCoord } from '@core/hex';
import { computeUnitStats } from '@core/modifiers';
import type { BattleState, BattleUnit, CombatCommand } from '@core/types';

function evaluateUnitValue(unit: BattleUnit, state: BattleState, catalog: CombatContentCatalog): number {
  const stats = computeUnitStats(unit, state, catalog);
  const totalHp = Math.max(1, (unit.count - 1) * stats.maxHp + unit.currentHp);
  return unit.kind === 'hero' ? totalHp * 2.2 + 120 : totalHp;
}

/**
 * 为当前活跃单位计算最优战术指令
 */
export function chooseTacticalAiCommand(
  state: BattleState,
  catalog: CombatContentCatalog,
): CombatCommand | null {
  if (state.phase !== 'active' || !state.activeUnitId) return null;
  const unit = state.units[state.activeUnitId];
  if (!unit || unit.status !== 'alive') return null;

  const stats = computeUnitStats(unit, state, catalog);
  const enemies = Object.values(state.units).filter(
    (u) => u.side !== unit.side && u.status === 'alive',
  );
  const allies = Object.values(state.units).filter(
    (u) => u.side === unit.side && u.status === 'alive',
  );
  if (enemies.length === 0) return null;

  // 1. 英雄药水检查（免费动作，每名英雄每回合限用 1 次：残血喝治疗，差一点满充能喝灵力露）
  if (unit.kind === 'hero' && !unit.hasUsedPotionThisRound) {
    if (unit.currentHp < stats.maxHp * 0.55) {
      const healPot = unit.potions.find(
        (p) => p.charges > 0 && catalog.potions[p.potionId]?.effectType === 'heal',
      );
      if (healPot) {
        return { type: 'USE_POTION', unitId: unit.id, potionId: healPot.potionId };
      }
    }
    if ((unit.spellCardCharge ?? 0) >= 85 && (unit.spellCardCharge ?? 0) < 100) {
      const manaPot = unit.potions.find(
        (p) => p.charges > 0 && catalog.potions[p.potionId]?.effectType === 'mana_charge',
      );
      if (manaPot) {
        return { type: 'USE_POTION', unitId: unit.id, potionId: manaPot.potionId };
      }
    }
  }

  // 2. 检查是否满足发动专属符卡条件（受和平之歌压制时跳过）
  const silencedByPeace = Boolean(unit.statusEffects?.songOfPeaceRounds && unit.statusEffects.songOfPeaceRounds > 0);
  if (!silencedByPeace && unit.kind === 'hero' && unit.signatureSpellCardId) {
    const card = catalog.spellCards[unit.signatureSpellCardId];
    if (
      card &&
      (unit.mana ?? 0) >= card.manaCost &&
      (unit.spellCardCharge ?? 0) >= card.chargeCost
    ) {
      if (card.targetType === 'field_self') {
        // 领域符卡在己方领域未激活时果断开启
        if (!state.activeFieldAura || state.activeFieldAura.casterSide !== unit.side) {
          return { type: 'DECLARE_SPELL_CARD', unitId: unit.id };
        }
      } else if (card.targetType === 'hex_line') {
        // 搜索能贯穿最多敌军（尤其敌方英雄）的最佳直线方向
        let bestTargetHex: HexCoord | null = null;
        let bestScore = 0;
        for (const enemy of enemies) {
          const ray = hexRay(
            unit.pos,
            enemy.pos,
            card.lineLength ?? 9,
            (c) => Boolean(state.tiles[hexKey(c)]),
          );
          const raySet = new Set(ray.map(hexKey));
          let score = 0;
          for (const e of enemies) {
            if (e.abilities.magicImmune || e.statusEffects?.sanctuary) continue;
            if (getUnitOccupiedHexes(e).some((h) => raySet.has(hexKey(h)))) {
              score += e.kind === 'hero' ? 140 : 75;
            }
          }
          if (score > bestScore) {
            bestScore = score;
            bestTargetHex = enemy.pos;
          }
        }
        if (bestTargetHex && bestScore >= 75) {
          return { type: 'DECLARE_SPELL_CARD', unitId: unit.id, targetHex: bestTargetHex };
        }
      }
    }
  }

  // 3. 英雄与施法兵种通用高价值法术评估（苏生复活 / 治疗 / 强力范围轰击；兼容全 142 法术且零卡顿！）
  if (!silencedByPeace && unit.knownSpellIds.length > 0 && (unit.mana ?? 0) >= 2) {
    const castableSpells = unit.knownSpellIds
      .map((id) => catalog.spells[id])
      .filter((sp) => {
        if (!sp || sp.isAdventureOnly || sp.targetType === 'adventure') return false;
        return (unit.mana ?? 0) >= getEffectiveSpellManaCost(state, unit, sp);
      });

    // 3a. 专属自用变身术（如竹林妖怪兔「兔化」）：尚未变身且本回合未紧贴敌军时抢先变身提速抢先手！
    const selfTransformSpell = castableSpells.find((sp) => sp.specialEffect === 'rabbit_transform');
    if (
      selfTransformSpell &&
      !(unit.statusEffects?.rabbitFormRounds && unit.statusEffects.rabbitFormRounds > 0) &&
      enemies.length > 0
    ) {
      const minEnemyDist = Math.min(...enemies.map((e) => getUnitMinDistance(unit, e)));
      if (minEnemyDist > 1) {
        return { type: 'CAST_SPELL', unitId: unit.id, spellId: selfTransformSpell.id };
      }
    }

    // 3a2. 召唤术式（如深渊隙间恶魔「深渊召唤·冰魔」）：当附近存在合法落点时果断召唤助战！
    const summonSpell = castableSpells.find(
      (sp) => sp.specialEffect === 'summon_creature' && sp.targetType === 'hex_empty' && sp.summonTemplateId,
    );
    if (summonSpell && enemies.length > 0) {
      const nearestEnemy = [...enemies].sort((a, b) => getUnitMinDistance(unit, a) - getUnitMinDistance(unit, b))[0];
      const occupied = new Set<string>();
      for (const u of Object.values(state.units)) {
        if (u.status === 'alive') {
          for (const h of getUnitOccupiedHexes(u)) occupied.add(hexKey(h));
        }
      }
      const summonEffRange = getEffectiveSpellRange(state, unit, summonSpell);
      let bestSummonHex: HexCoord | null = null;
      let bestDist = Infinity;
      for (const tile of Object.values(state.tiles)) {
        if (tile.blocksGround) continue;
        const k = hexKey(tile);
        if (occupied.has(k)) continue;
        if (summonEffRange > 0 && hexDistance(unit.pos, tile) > summonEffRange) continue;
        const dEnemy = hexDistance(tile, nearestEnemy.pos);
        if (dEnemy < bestDist) {
          bestDist = dEnemy;
          bestSummonHex = { q: tile.q, r: tile.r };
        }
      }
      if (bestSummonHex) {
        return { type: 'CAST_SPELL', unitId: unit.id, spellId: summonSpell.id, targetHex: bestSummonHex };
      }
    }

    // 3b. 优先苏生已严重减员的活体友军
    const reviveSpell = castableSpells
      .filter((sp) => sp.reviveBase && sp.targetType === 'ally_unit' && !sp.specialEffect)
      .sort((a, b) => (b.reviveBase ?? 0) - (a.reviveBase ?? 0))[0];
    if (reviveSpell) {
      const reviveEffRange = getEffectiveSpellRange(state, unit, reviveSpell);
      const depleted = allies
        .filter((a) => {
          if (isImmuneToLivingHeal(a) || a.abilities.magicImmune || a.statusEffects?.sanctuary) return false;
          return (
            a.count < a.maxCount &&
            (reviveEffRange <= 0 || getUnitMinDistance(unit, a) <= reviveEffRange) &&
            (reviveSpell.ignoreLos || checkSpellLineOfSight(state, unit, getUnitOccupiedHexes(a), a).canCast)
          );
        })
        .sort((a, b) => (b.maxCount - b.count) - (a.maxCount - a.count))[0];
      if (depleted) {
        return { type: 'CAST_SPELL', unitId: unit.id, spellId: reviveSpell.id, targetUnitId: depleted.id };
      }
    }

    // 3b. 优先治疗濒危核心友军
    const healSpell = castableSpells
      .filter((sp) => sp.healBase && sp.targetType === 'ally_unit' && !sp.specialEffect)
      .sort((a, b) => (b.healBase ?? 0) - (a.healBase ?? 0))[0];
    if (healSpell) {
      const healEffRange = getEffectiveSpellRange(state, unit, healSpell);
      const wounded = allies
        .filter((a) => {
          if (isImmuneToLivingHeal(a) || a.abilities.magicImmune || a.statusEffects?.sanctuary) return false;
          const aStats = computeUnitStats(a, state, catalog);
          return (
            (healEffRange <= 0 || getUnitMinDistance(unit, a) <= healEffRange) &&
            a.currentHp < aStats.maxHp * 0.6 &&
            (healSpell.ignoreLos || checkSpellLineOfSight(state, unit, getUnitOccupiedHexes(a), a).canCast)
          );
        })
        .sort((a, b) => a.currentHp - b.currentHp)[0];
      if (wounded) {
        return { type: 'CAST_SPELL', unitId: unit.id, spellId: healSpell.id, targetUnitId: wounded.id };
      }
    }

    // 3c. 高威力范围伤害术式（如流星雨、地狱火、火球术）命中 >= 2 支敌军
    const bestAoeSpell = castableSpells
      .filter((sp) => sp.targetType === 'hex_aoe' && (sp.damageBase ?? 0) >= 22 && !sp.specialEffect)
      .sort((a, b) => (b.damageBase ?? 0) - (a.damageBase ?? 0))[0];
    if (bestAoeSpell) {
      const aoeEffRange = getEffectiveSpellRange(state, unit, bestAoeSpell);
      let bestCenter: HexCoord | null = null;
      let bestHits = 0;
      for (const e of enemies) {
        if (aoeEffRange > 0 && hexDistance(unit.pos, e.pos) > aoeEffRange) continue;
        if (!bestAoeSpell.ignoreLos && !checkSpellLineOfSight(state, unit, [e.pos]).canCast) continue;
        const hits = enemies.filter(
          (other) =>
            !other.abilities.magicImmune &&
            !other.statusEffects?.sanctuary &&
            hexDistance(e.pos, other.pos) <= (bestAoeSpell.aoeRadius ?? 1),
        ).length;
        if (hits > bestHits) {
          bestHits = hits;
          bestCenter = e.pos;
        }
      }
      if (bestCenter && bestHits >= 2) {
        return { type: 'CAST_SPELL', unitId: unit.id, spellId: bestAoeSpell.id, targetHex: bestCenter };
      }
    }
  }

  // 4. 评估全部直接攻击选项（结合两阶段同时反击损益打分）
  let bestAttackCmd: CombatCommand | null = null;
  let bestAttackScore = -Infinity;

  for (const enemy of enemies) {
    let preview = previewAttack(state, unit.id, enemy.id, catalog);
    if (!preview.valid) continue;

    // 若 AI 操控拥有「长武器」的单位且当前默认走位会吃反击，尝试寻找隔 1 格无反击的精妙走位！
    if (unit.abilities.longWeapon && !preview.isRanged && preview.willRetaliate && !enemy.abilities.longWeapon) {
      const defHexes = getUnitOccupiedHexes(enemy);
      const safeCand = getValidMeleeApproachAnchors(state, unit, enemy, catalog).find(
        (c) => minHexSetDistance(getFootprintHexes(c, unit.footprint), defHexes) === 2,
      );
      if (safeCand) {
        const safePrev = previewAttack(state, unit.id, enemy.id, catalog, safeCand);
        if (safePrev.valid && !safePrev.willRetaliate) {
          preview = safePrev;
        }
      }
    }

    const avgDeal = (preview.expectedMinDamage + preview.expectedMaxDamage) / 2;
    const avgTaken = preview.willRetaliate
      ? (preview.retaliationMinDamage + preview.retaliationMaxDamage) / 2
      : 0;

    const killBonus =
      preview.expectedMinKills >= enemy.count
        ? enemy.kind === 'hero'
          ? 240
          : 110
        : preview.expectedMaxKills * 18;
    const heroFocus = enemy.kind === 'hero' ? 32 : 0;
    const retVictim =
      preview.retaliationTargetId && preview.retaliationTargetId !== unit.id
        ? state.units[preview.retaliationTargetId] ?? unit
        : unit;
    const selfRiskPenalty =
      retVictim.kind === 'hero' && avgTaken >= retVictim.currentHp * 0.65 ? 180 : avgTaken * 0.85;
    const rangedSafeBonus =
      (preview.isRanged || preview.isLongWeaponPoke) &&
      (!preview.willRetaliate || Boolean(preview.retaliationTargetId && preview.retaliationTargetId !== unit.id))
        ? 28
        : 0;

    const score = avgDeal * 1.15 + killBonus + heroFocus + rangedSafeBonus - selfRiskPenalty;
    if (score > bestAttackScore) {
      bestAttackScore = score;
      bestAttackCmd = {
        type: 'ATTACK',
        unitId: unit.id,
        targetId: enemy.id,
        moveTo: preview.moveTo,
      };
    }
  }

  // 5. 若是英雄或施法兵种且有强力单体攻击法术，取最高威力前 4 术式比较施法与普攻收益（与引擎统一目标与双轨威力公式！）
  if (!silencedByPeace && unit.knownSpellIds.length > 0) {
    const dmgSpells = unit.knownSpellIds
      .map((id) => catalog.spells[id])
      .filter((sp) => {
        if (!sp || sp.isAdventureOnly || sp.targetType !== 'enemy_unit' || !sp.damageBase) return false;
        if (sp.specialEffect === 'banish' || sp.specialEffect === 'poison') return false;
        return (unit.mana ?? 0) >= getEffectiveSpellManaCost(state, unit, sp);
      })
      .sort((a, b) => (b.damageBase ?? 0) - (a.damageBase ?? 0))
      .slice(0, 4);

    for (const spell of dmgSpells) {
      const spellEffRange = getEffectiveSpellRange(state, unit, spell);
      for (const enemy of enemies) {
        if (!validateSpellUnitTarget(spell, unit, enemy, state, catalog, false).ok) continue;
        if (spellEffRange > 0 && getUnitMinDistance(unit, enemy) > spellEffRange) continue;
        if (!spell.ignoreLos && !checkSpellLineOfSight(state, unit, getUnitOccupiedHexes(enemy), enemy).canCast) continue;
        const darkVulnMult = isDarkMagicVulnerable(enemy) ? DARK_MAGIC_VULNERABILITY_MULT : 1;
        const estDmg =
          computeDualTrackSpellPower({
            caster: unit,
            baseValue: spell.damageBase!,
            heroSpWeight: spell.level >= 4 ? 0.8 : spell.level === 3 ? 0.6 : 0.5,
            casterSpellPower: stats.spellPower,
            schoolMult: getSchoolSpellMultiplier(unit, spell),
            subAndClassMult: 1,
            traitMult: 1,
            catalog,
          }) * darkVulnMult;
        const spellScore = estDmg * 1.1 + (enemy.kind === 'hero' ? 40 : 10);
        if (spellScore > bestAttackScore + 18) {
          bestAttackScore = spellScore;
          bestAttackCmd = {
            type: 'CAST_SPELL',
            unitId: unit.id,
            spellId: spell.id,
            targetUnitId: enemy.id,
          };
        }
      }
    }
  }

  if (bestAttackCmd && bestAttackScore > -25) {
    return bestAttackCmd;
  }

  // 6. 无法安全攻击时，寻路推进或抢占高地
  const reachable = getUnitReachableMap(state, unit, catalog);
  const primaryTarget = enemies.sort(
    (a, b) => evaluateUnitValue(b, state, catalog) - evaluateUnitValue(a, state, catalog),
  )[0];

  let bestMove: HexCoord | null = null;
  let bestMoveScore = -Infinity;

  for (const key of reachable.costs.keys()) {
    const tile = state.tiles[key];
    if (!tile) continue;
    if (tile.q === unit.pos.q && tile.r === unit.pos.r) continue;

    const myHexes = getFootprintHexes(tile, unit.footprint);
    const distToEnemy = minHexSetDistance(myHexes, getUnitOccupiedHexes(primaryTarget));
    const maxElev = Math.max(...myHexes.map((h) => state.tiles[hexKey(h)]?.elevation ?? 1));
    const isCaster = unit.knownSpellIds.length > 0 && (unit.mana ?? 0) >= 2;
    let score = 0;
    if (unit.abilities.ranged) {
      const idealDist = Math.abs(distToEnemy - Math.max(5, stats.range - 2));
      score = maxElev * (isCaster ? 28 : 22) - idealDist * 10;
    } else if (isCaster) {
      score = -distToEnemy * 12 + maxElev * 24;
    } else {
      score = -distToEnemy * 16 + maxElev * 10;
    }
    if (score > bestMoveScore) {
      bestMoveScore = score;
      bestMove = { q: tile.q, r: tile.r };
    }
  }

  if (bestMove) {
    return { type: 'MOVE', unitId: unit.id, to: bestMove };
  }

  if (!unit.hasWaitedThisRound) {
    return { type: 'WAIT', unitId: unit.id };
  }
  return { type: 'DEFEND', unitId: unit.id };
}

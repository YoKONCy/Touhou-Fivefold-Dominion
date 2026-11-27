/**
 * 回合推进与新回合状态结算（控场跳过、狂暴、魔力吸取、持续状态衰减、毒疫与自愈回蓝）子模块
 */

import { isImmuneToLivingHeal } from '../creatureTypes';
import { resolveActiveHeroClass } from '../h4Skills';
import { getFootprintHexes, hexEquals, minHexSetDistance, reconstructHexPath } from '../hex';
import { computeUnitStats } from '../modifiers';
import type { BattleState, CombatEvent } from '../types';
import { performAttackResolution } from './commands';
import { applyDamageToUnit, clearDuelLocksOnTarget, previewAttack, rollStrikeDamage } from './damage';
import { getUnitMinDistance, getUnitOccupiedHexes, getUnitReachableMap } from './spatial';
import { buildRoundTurnQueue, checkVictory } from './turnQueue';
import type { CombatContentCatalog } from './types';

/** 推进至下一个有效行动单位或进入新回合 */
export function advanceTurn(
  state: BattleState,
  catalog: CombatContentCatalog,
  events: CombatEvent[],
): void {
  if (checkVictory(state, events)) return;

  const popNextAlive = (queue: string[]): string | null => {
    while (queue.length > 0) {
      const id = queue.shift()!;
      const u = state.units[id];
      if (u && u.status === 'alive' && !u.hasActedThisRound) {
        return id;
      }
    }
    return null;
  };

  for (let safety = 0; safety < 48; safety++) {
    let nextId = popNextAlive(state.turnQueue);
    if (!nextId) {
      nextId = popNextAlive(state.waitQueue);
    }

    if (nextId) {
      const nextUnit = state.units[nextId];
      nextUnit.isDefending = false;

      const se = nextUnit.statusEffects;
      if (
        se.terrifiedRounds > 0 ||
        se.stunnedRounds > 0 ||
        (se.frozenRounds ?? 0) > 0 ||
        (se.blindRounds ?? 0) > 0 ||
        (se.confusionRounds ?? 0) > 0
      ) {
        let reason: 'terrified' | 'stunned' | 'frozen' | 'blind' | 'confusion' = 'stunned';
        let label = '符箓定身';
        if (se.terrifiedRounds > 0) {
          reason = 'terrified';
          label = '噩梦震慑';
          se.terrifiedRounds = Math.max(0, se.terrifiedRounds - 1);
        } else if (se.stunnedRounds > 0) {
          reason = 'stunned';
          label = '符箓定身';
          se.stunnedRounds = Math.max(0, se.stunnedRounds - 1);
        } else if ((se.frozenRounds ?? 0) > 0) {
          reason = 'frozen';
          label = '寒霜冻结';
          se.frozenRounds = Math.max(0, (se.frozenRounds ?? 1) - 1);
        } else if ((se.blindRounds ?? 0) > 0) {
          reason = 'blind';
          label = '宵暗蔽目';
          se.blindRounds = Math.max(0, (se.blindRounds ?? 1) - 1);
        } else {
          reason = 'confusion';
          label = '迷乱魔雾';
          se.confusionRounds = Math.max(0, (se.confusionRounds ?? 1) - 1);
        }
        nextUnit.hasActedThisRound = true;
        events.push({ type: 'UNIT_SKIPPED_TURN', unitId: nextId, reason });
        state.actionLog.push(`${nextUnit.name} 处于「${label}」，跳过本巡行动！`);
        continue;
      }

      if ((se.berserkRounds ?? 0) > 0) {
        se.berserkRounds = Math.max(0, (se.berserkRounds ?? 1) - 1);
        const nearest = Object.values(state.units)
          .filter((u) => u.status === 'alive' && u.id !== nextUnit.id && !u.statusEffects?.sanctuary)
          .sort((a, b) => getUnitMinDistance(nextUnit, a) - getUnitMinDistance(nextUnit, b))[0];
        if (nearest) {
          const strike = rollStrikeDamage(state, nextUnit, nearest, false, false, 1, 'clear', 1, catalog);
          if (!strike.blocked) {
            strike.kills = applyDamageToUnit(state, nearest, strike.damage, catalog, events, true, 'physical');
          }
          events.push({
            type: 'COMBAT_EXCHANGE',
            attackerId: nextUnit.id,
            defenderId: nearest.id,
            mode: 'one_way',
            attackerStrike: strike,
            defenderStrike: null,
          });
          state.actionLog.push(
            `🔥 ${nextUnit.name} 受「月狂赤瞳」驱使发狂！不分敌我猛攻 ${nearest.name}，造成 ${strike.damage} 点伤害！`,
          );
        } else {
          events.push({ type: 'UNIT_SKIPPED_TURN', unitId: nextId, reason: 'berserk' });
        }
        nextUnit.hasActedThisRound = true;
        if (checkVictory(state, events)) return;
        continue;
      }

      // 狂战士「死斗狂暴」：锁定宿敌期间轮到其行动时自动追击死斗，堵路则顺劈挡路敌军
      if (nextUnit.abilities.berserkDuel && se.duelTargetUnitId) {
        const duelTarget = state.units[se.duelTargetUnitId];
        if (!duelTarget || duelTarget.status !== 'alive') {
          clearDuelLocksOnTarget(state, se.duelTargetUnitId, 'target_defeated', events);
        } else if (duelTarget.abilities.stealth || duelTarget.statusEffects?.sanctuary) {
          clearDuelLocksOnTarget(state, se.duelTargetUnitId, 'target_hidden', events);
        } else {
          const duelPreview = previewAttack(state, nextUnit.id, duelTarget.id, catalog, undefined, true);
          if (duelPreview.valid) {
            state.actionLog.push(`🔥 ${nextUnit.name} 狂暴锁定宿敌 ${duelTarget.name}，不顾一切发起死斗猛攻！`);
            performAttackResolution(state, nextUnit, duelTarget, duelPreview, catalog, events);
          } else {
            // 够不到宿敌：向宿敌全力逼近；若完全被敌军堵路，则顺手劈砍最近的挡路敌军
            const reachable = getUnitReachableMap(state, nextUnit, catalog);
            const duelHexes = getUnitOccupiedHexes(duelTarget);
            const curDist = minHexSetDistance(getUnitOccupiedHexes(nextUnit), duelHexes);
            let bestHex = nextUnit.pos;
            let bestDist = curDist;
            for (const key of reachable.costs.keys()) {
              const [qs, rs] = key.split(',');
              const coord = { q: Number(qs), r: Number(rs) };
              if (hexEquals(coord, nextUnit.pos)) continue;
              const d = minHexSetDistance(getFootprintHexes(coord, nextUnit.footprint), duelHexes);
              if (d < bestDist) {
                bestDist = d;
                bestHex = coord;
              }
            }
            if (!hexEquals(bestHex, nextUnit.pos)) {
              const path = reconstructHexPath(reachable, bestHex);
              if (path && path.length > 1) {
                const prevQ = nextUnit.pos.q;
                nextUnit.pos = { ...bestHex };
                if (bestHex.q !== prevQ) {
                  nextUnit.facing = bestHex.q > prevQ ? 'right' : 'left';
                }
                events.push({ type: 'UNIT_MOVED', unitId: nextUnit.id, path });
                state.actionLog.push(`🔥 ${nextUnit.name} 狂暴追击宿敌 ${duelTarget.name}，疾步逼近！`);
              }
            } else {
              const blocker = Object.values(state.units)
                .filter((u) => u.status === 'alive' && u.side !== nextUnit.side && !u.statusEffects?.sanctuary)
                .sort((a, b) => getUnitMinDistance(nextUnit, a) - getUnitMinDistance(nextUnit, b))
                .find((u) => previewAttack(state, nextUnit.id, u.id, catalog, undefined, true).valid);
              if (blocker) {
                const blockerPreview = previewAttack(state, nextUnit.id, blocker.id, catalog, undefined, true);
                state.actionLog.push(`🔥 ${nextUnit.name} 追击 ${duelTarget.name} 受阻，怒斩挡路的 ${blocker.name}！`);
                performAttackResolution(state, nextUnit, blocker, blockerPreview, catalog, events);
              } else {
                events.push({ type: 'UNIT_SKIPPED_TURN', unitId: nextUnit.id, reason: 'berserk' });
                state.actionLog.push(`🔥 ${nextUnit.name} 被战阵彻底卡死去路，对着 ${duelTarget.name} 狂吼蓄势！`);
              }
            }
          }
          state.hasCombatStarted = true;
          nextUnit.hasActedThisRound = true;
          if (checkVictory(state, events)) return;
          continue;
        }
      }

      if (nextUnit.abilities.manaLeech && !nextUnit.hasWaitedThisRound) {
        const enemyCasters = Object.values(state.units)
          .filter((u) => u.status === 'alive' && u.side !== nextUnit.side && (u.mana ?? 0) > 0)
          .sort((a, b) => (b.mana ?? 0) - (a.mana ?? 0));
        const enemyTarget = enemyCasters[0];
        if (enemyTarget && (enemyTarget.mana ?? 0) > 0) {
          const stealCap = Math.max(1, Math.floor(nextUnit.count * 0.2));
          const stolen = Math.min(enemyTarget.mana ?? 0, stealCap);
          if (stolen > 0) {
            enemyTarget.mana = Math.max(0, (enemyTarget.mana ?? 0) - stolen);
            const allyCasters = Object.values(state.units)
              .filter((u) => {
                if (u.status !== 'alive' || u.side !== nextUnit.side) return false;
                const aStats = computeUnitStats(u, state, catalog);
                return aStats.maxMana > 0 && (u.mana ?? 0) < aStats.maxMana;
              })
              .sort((a, b) => (a.kind === 'hero' ? -1 : b.kind === 'hero' ? 1 : (a.mana ?? 0) - (b.mana ?? 0)));
            const allyReceiver = allyCasters[0] ?? null;
            if (allyReceiver) {
              const rStats = computeUnitStats(allyReceiver, state, catalog);
              allyReceiver.mana = Math.min(rStats.maxMana, (allyReceiver.mana ?? 0) + stolen);
            }
            events.push({
              type: 'MANA_LEECH',
              sourceUnitId: nextUnit.id,
              enemyUnitId: enemyTarget.id,
              allyUnitId: allyReceiver?.id ?? null,
              amount: stolen,
            });
            state.actionLog.push(
              `😈 ${nextUnit.name} 发动「魔力吸取」，从 ${enemyTarget.name} 窃取了 ${stolen} 点灵力${allyReceiver ? `并注入 ${allyReceiver.name}` : ''}！`,
            );
          }
        }
      }

      state.activeUnitId = nextId;
      events.push({ type: 'TURN_STARTED', unitId: nextId });
      return;
    }

    // 本巡全员已行动完毕 → 进入新回合
    state.round += 1;
    // 滚动结算上一回合双方累计承受的物理伤害（供混沌四阶法术「命符·战争血祭」读取）
    state.physicalDamageTakenLastRound = {
      left: state.physicalDamageTakenThisRound?.left ?? 0,
      right: state.physicalDamageTakenThisRound?.right ?? 0,
    };
    state.physicalDamageTakenThisRound = { left: 0, right: 0 };

    if (state.activeFieldAura) {
      state.activeFieldAura.remainingRounds -= 1;
      if (state.activeFieldAura.remainingRounds <= 0) {
        state.actionLog.push(`${state.activeFieldAura.name} 灵光消散。`);
        state.activeFieldAura = null;
      }
    }

    for (const unit of Object.values(state.units)) {
      unit.hasActedThisRound = false;
      unit.hasWaitedThisRound = false;
      unit.isDefending = false;
      unit.hasRetaliatedThisRound = false;
      unit.hasUsedPotionThisRound = false;
      unit.roundMoraleState = 'neutral';
      unit.modifiers = unit.modifiers
        .map((m) =>
          m.remainingRounds === null ? m : { ...m, remainingRounds: m.remainingRounds - 1 },
        )
        .filter((m) => m.remainingRounds === null || m.remainingRounds > 0);

      const se = unit.statusEffects;
      if (se.songOfPeaceRounds && se.songOfPeaceRounds > 0) {
        se.songOfPeaceRounds = Math.max(0, se.songOfPeaceRounds - 1);
      }
      if (se.cowardiceRounds && se.cowardiceRounds > 0) {
        se.cowardiceRounds = Math.max(0, se.cowardiceRounds - 1);
      }
      if (se.precisionRounds && se.precisionRounds > 0) {
        se.precisionRounds = Math.max(0, se.precisionRounds - 1);
        if (se.precisionRounds === 0 && se.grantedAbilities) {
          for (const ab of ['longRange', 'noObstaclePenalty'] as const) {
            if (se.grantedAbilities.includes(ab)) {
              unit.abilities[ab] = false;
              se.grantedAbilities = se.grantedAbilities.filter((k) => k !== ab);
            }
          }
        }
      }
      if (se.bloodlustRounds && se.bloodlustRounds > 0) {
        se.bloodlustRounds = Math.max(0, se.bloodlustRounds - 1);
      }
      if (se.bloodSacrificeShieldRounds && se.bloodSacrificeShieldRounds > 0) {
        se.bloodSacrificeShieldRounds = Math.max(0, se.bloodSacrificeShieldRounds - 1);
        if (se.bloodSacrificeShieldRounds === 0 && (se.bloodSacrificeShieldHp ?? 0) > 0) {
          se.bloodSacrificeShieldHp = 0;
          state.actionLog.push(`🩸 ${unit.name} 的「战争血祭」护盾时限已满，血盾消散。`);
        }
      }
      if (se.agedRounds && se.agedRounds > 0) {
        se.agedRounds = Math.max(0, se.agedRounds - 1);
      }
      if (se.rabbitFormRounds && se.rabbitFormRounds > 0) {
        se.rabbitFormRounds = Math.max(0, se.rabbitFormRounds - 1);
        if (se.rabbitFormRounds === 0) {
          if (se.rabbitFormOriginalBlueprintId) {
            unit.voxelBlueprintId = se.rabbitFormOriginalBlueprintId;
            se.rabbitFormOriginalBlueprintId = undefined;
          }
          if (se.rabbitFormGrantedFirstStrike) {
            unit.abilities.firstStrike = false;
            se.rabbitFormGrantedFirstStrike = false;
            if (se.grantedAbilities) {
              se.grantedAbilities = se.grantedAbilities.filter((k) => k !== 'firstStrike');
            }
          }
          state.actionLog.push(`🐇 ${unit.name} 的「兔化」时间结束，恢复原本形态。`);
        }
      }
      if (se.hypnotizedRounds && se.hypnotizedRounds > 0) {
        se.hypnotizedRounds = Math.max(0, se.hypnotizedRounds - 1);
        if (se.hypnotizedRounds === 0 && se.hypnotizedOriginalSide) {
          unit.side = se.hypnotizedOriginalSide;
          unit.facing = unit.side === 'left' ? 'right' : 'left';
          se.hypnotizedOriginalSide = undefined;
          state.actionLog.push(`${unit.name} 摆脱「迷梦傀儡」操控，重归原阵营！`);
        }
      }

      if (unit.status === 'alive') {
        const stats = computeUnitStats(unit, state, catalog);
        if (se.regenPerRound && se.regenPerRound > 0 && !isImmuneToLivingHeal(unit)) {
          const beforeHp = unit.currentHp;
          unit.currentHp = Math.min(stats.maxHp, unit.currentHp + se.regenPerRound);
          const gained = unit.currentHp - beforeHp;
          if (gained > 0) {
            state.actionLog.push(`💚 ${unit.name} 的「生生不息」回复了 ${gained} 点生命。`);
          }
        }
        const poisonPart = se.poisonPower ?? 0;
        const plaguePart = se.plaguePower ?? 0;
        const dotDmg = poisonPart + plaguePart;
        if (dotDmg > 0 && !unit.abilities.magicImmune && !se.sanctuary) {
          const dotKills = applyDamageToUnit(state, unit, dotDmg, catalog, events);
          events.push({
            type: 'STATUS_DOT_TICK',
            unitId: unit.id,
            damage: dotDmg,
            kills: dotKills,
            kind: poisonPart >= plaguePart ? 'poison' : 'plague',
          });
          state.actionLog.push(
            `☠ ${unit.name} 遭受毒疫侵蚀，损失 ${dotDmg} 生命${unit.kind === 'creature' ? `（折损 ${dotKills} 兵）` : ''}！`,
          );
        }

        if (unit.status === 'alive' && unit.kind === 'hero') {
          const sub = unit.subSkills ?? {};
          const passiveHeal = (sub.healing ?? 0) * 3 + (sub.herbalism ?? 0) * 3;
          if (passiveHeal > 0 && unit.currentHp < stats.maxHp) {
            unit.currentHp = Math.min(stats.maxHp, unit.currentHp + passiveHeal);
          }
          const heroCls = resolveActiveHeroClass(
            unit.skills,
            unit.subSkills,
            catalog.advancedClasses,
            unit.selectedAdvancedClassId,
          );
          // HoMM4 五系对称自动回蓝（灵性 + 巫术 + 神秘 + 魔咒 + 冥想 各 +1 MP/阶，魔导妖术师 +1 MP/回合）
          const bonusManaRegen =
            (sub.spirituality ?? 0) +
            (sub.wizardry ?? 0) +
            (sub.occultism ?? 0) +
            (sub.conjuration ?? 0) +
            (sub.meditation ?? 0) +
            (heroCls?.passive?.manaRegenPerRound ?? 0);
          if (bonusManaRegen > 0) {
            unit.mana = Math.min(stats.maxMana, (unit.mana ?? 0) + bonusManaRegen);
          }
          unit.spellCardCharge = Math.min(100, (unit.spellCardCharge ?? 0) + 5);
        }
      }
    }

    if (checkVictory(state, events)) return;

    events.push({ type: 'ROUND_STARTED', round: state.round });
    state.actionLog.push(`—— 第 ${state.round} 回合开始 ——`);
    state.turnQueue = buildRoundTurnQueue(state, catalog, events, true);
    state.waitQueue = [];
  }
}

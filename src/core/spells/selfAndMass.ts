/**
 * 全场与自身即时术式（targetType === 'self'）执行器
 */

import {
  isImmuneToLivingEffects,
  isImmuneToLivingHeal,
  isImmuneToMorale,
  isUndeadUnit,
} from '../creatureTypes';
import { computeUnitStats } from '../modifiers';
import { nextRandom } from '../rng';
import type { StatModifier } from '../types';
import type { SpellBranchOutcome, SpellCastContext } from './context';
import {
  cleanseNegativeEffects,
  cleansePositiveEffects,
  computeAndApplySpellDamage,
  grantTempAbility,
  isTargetResistingHostileSpell,
  reviveAndHealUnit,
} from './helpers';

export function executeSelfAndMassSpell(ctx: SpellCastContext): SpellBranchOutcome {
  const {
    state,
    unit,
    spell,
    eff,
    command,
    catalog,
    events,
    deps,
    casterStats,
    lifeDurationBonus,
    calcPower,
    touchStatusFlag,
    pushSpellModifier,
    isTargetBlockedByLiving,
    isTargetBlockedByMind,
  } = ctx;

  ctx.targetHex = unit.pos;
  const allies = Object.values(state.units).filter((u) => u.status === 'alive' && u.side === unit.side);
  const enemies = Object.values(state.units).filter((u) => u.status === 'alive' && u.side !== unit.side);
  const allAlive = Object.values(state.units).filter((u) => u.status === 'alive');

  if (eff === 'rabbit_transform') {
    if (command.targetUnitId && command.targetUnitId !== unit.id) {
      return { ok: false, error: '「兔化」仅可对自己施放', events: [] };
    }
    if (unit.abilities.magicImmune) {
      return { ok: false, error: '全魔法免疫状态下无法施放「兔化」', events: [] };
    }
    const duration = 3;
    if (!unit.statusEffects.rabbitFormOriginalBlueprintId) {
      unit.statusEffects.rabbitFormOriginalBlueprintId = unit.voxelBlueprintId;
    }
    unit.voxelBlueprintId = 'creature_rabbit_transformed';
    unit.statusEffects.rabbitFormRounds = duration;
    if (!unit.abilities.firstStrike) {
      grantTempAbility(unit, 'firstStrike');
      unit.statusEffects.rabbitFormGrantedFirstStrike = true;
    }
    touchStatusFlag(unit, 'rabbitFormRounds');
    unit.modifiers = unit.modifiers.filter((m) => m.spellId !== spell.id);
    const rabbitMods: Array<Omit<StatModifier, 'id' | 'remainingRounds'>> = [
      { stat: 'speed', mode: 'percent', value: 0.5, sourceName: '兔符·兔化', spellPolarity: 'positive', spellId: spell.id },
      { stat: 'initiative', mode: 'percent', value: 0.5, sourceName: '兔符·兔化', spellPolarity: 'positive', spellId: spell.id },
      { stat: 'grazeChance', mode: 'flat', value: 0.5, sourceName: '兔符·兔化', spellPolarity: 'positive', spellId: spell.id },
    ];
    rabbitMods.forEach((m, idx) => {
      pushSpellModifier(unit, {
        ...m,
        id: `spell:${spell.id}:${state.commandSeq}:${idx}`,
        remainingRounds: duration,
      });
    });
    ctx.affectedUnitIds.push(unit.id);
    ctx.noteText = '兔化真身!';
    state.actionLog.push(
      `🐇 ${unit.name} 发动「兔化」，化作月光白兔真身！获得先攻且位移距离、先手主动与擦弹率 +50%（持续 3 回合）！`,
    );
    return null;
  }

  if (eff === 'heavenly_shield') {
    const shield = Math.round(calcPower(spell.healBase ?? 48, 1.0));
    unit.statusEffects.tempShieldHp = (unit.statusEffects.tempShieldHp ?? 0) + shield;
    touchStatusFlag(unit, 'tempShieldHp');
    ctx.affectedUnitIds.push(unit.id);
    ctx.noteText = `二重结界 +${shield}!`;
    state.actionLog.push(`🛡 ${unit.name} 展开「二重结界」，获得 ${shield} 点临时护盾生命！`);
  } else if (eff === 'mana_flare') {
    state.battleSpellFlags.manaFlareActive = true;
    ctx.affectedUnitIds.push(unit.id);
    ctx.noteText = '灵脉沸腾 -2MP!';
    state.actionLog.push(`⚡ ${unit.name} 发动「灵脉沸腾」，全场敌我一切法术灵力消耗永久 -2！`);
  } else if (eff === 'necromancy_ward') {
    state.battleSpellFlags.necromancyWardActive = true;
    ctx.affectedUnitIds.push(unit.id);
    ctx.noteText = '净土封冥!';
    state.actionLog.push(`🌿 ${unit.name} 张开「净土封冥」，本场战斗禁止一切冥府招魂与反魂起尸术！`);
  } else if (eff === 'defender') {
    for (const a of allies) {
      if (a.abilities.magicImmune) continue;
      a.statusEffects.defenderBonus = true;
      touchStatusFlag(a, 'defenderBonus');
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = '不动如山+50%!';
    state.actionLog.push(`🛡 ${unit.name} 施放「不动如山」，全队防御姿态护甲额外 +50%！`);
  } else if (eff === 'mass_bless') {
    for (const a of allies) {
      if (a.abilities.magicImmune) continue;
      a.statusEffects.bless = true;
      a.statusEffects.curse = false;
      touchStatusFlag(a, 'bless');
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = '八百万神祝!';
    state.actionLog.push(`✨ ${unit.name} 施放「八百万神祝」，全队攻击恒定打出最大伤害！`);
  } else if (eff === 'mass_curse') {
    for (const e of enemies) {
      if (e.abilities.magicImmune || e.statusEffects?.sanctuary || isTargetResistingHostileSpell(state, unit, e, catalog)) {
        continue;
      }
      e.statusEffects.curse = true;
      e.statusEffects.bless = false;
      touchStatusFlag(e, 'curse');
      ctx.affectedUnitIds.push(e.id);
    }
    ctx.noteText = '百鬼厄祟!';
    state.actionLog.push(`☠ ${unit.name} 施放「百鬼厄祟」，全体非免疫敌军只能打出最小伤害！`);
  } else if (eff === 'ward_mass' && spell.wardSchool) {
    for (const a of allies) {
      if (a.abilities.magicImmune) continue;
      a.statusEffects.schoolWards = { ...(a.statusEffects.schoolWards ?? {}), [spell.wardSchool]: true };
      touchStatusFlag(a, 'schoolWards');
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = `${spell.name}!`;
    state.actionLog.push(`🛡 ${unit.name} 展开「${spell.name}」，全队获得该系 50% 魔法与防卫抗性！`);
  } else if (eff === 'mass_exorcism') {
    let total = 0;
    for (const a of allies) {
      if (a.abilities.magicImmune) continue;
      total += cleanseNegativeEffects(a, true);
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = `大祓净世 (${total})!`;
    state.actionLog.push(`✨ ${unit.name} 举行「大祓净世」，净化全队 ${total} 项负面诅咒与异常状态！`);
  } else if (eff === 'mass_cancellation') {
    let total = 0;
    for (const e of enemies) {
      if (e.abilities.magicImmune || isTargetResistingHostileSpell(state, unit, e, catalog)) continue;
      total += cleansePositiveEffects(e).length;
      ctx.affectedUnitIds.push(e.id);
    }
    ctx.noteText = '幽冥剥法!';
    state.actionLog.push(`☠ ${unit.name} 施放「幽冥剥法」，剥除了敌军全部有益增益（${total} 项）！`);
  } else if (eff === 'mass_dispel') {
    for (const u of allAlive) {
      if (u.abilities.magicImmune || isTargetResistingHostileSpell(state, unit, u, catalog)) continue;
      cleansePositiveEffects(u);
      cleanseNegativeEffects(u, false); // H4 规则：驱散不解除中毒与瘟疫
      ctx.affectedUnitIds.push(u.id);
    }
    ctx.noteText = '万法归零!';
    state.actionLog.push(`✦ ${unit.name} 施放「万法归零」，涤荡了全场敌我法术状态！`);
  } else if (eff === 'steal_all_enchantments') {
    const eligibleAllies = allies.filter((a) => !a.abilities.magicImmune);
    let stolenCount = 0;
    for (const e of enemies) {
      if (e.abilities.magicImmune || isTargetResistingHostileSpell(state, unit, e, catalog)) continue;
      const stolen = cleansePositiveEffects(e);
      ctx.affectedUnitIds.push(e.id);
      for (const mod of stolen) {
        if (eligibleAllies.length === 0) break;
        const pick = eligibleAllies[Math.floor(nextRandom(state.rng) * eligibleAllies.length)];
        pushSpellModifier(pick, { ...mod, id: `stolen:${state.commandSeq}:${stolenCount}` });
        stolenCount++;
      }
    }
    ctx.noteText = `大盗窃法 ×${stolenCount}!`;
    state.actionLog.push(`✦ ${unit.name} 发动「大盗窃法」，共将 ${stolenCount} 项敌军增益夺归己用！`);
  } else if (eff === 'mass_blur') {
    for (const a of allies) {
      if (a.abilities.magicImmune) continue;
      a.statusEffects.blur = true;
      touchStatusFlag(a, 'blur');
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = '万象蜃楼!';
    state.actionLog.push(`✦ ${unit.name} 展开「万象蜃楼」，全队远程减伤与擦弹率大幅提升！`);
  } else if (eff === 'mass_precision') {
    for (const a of allies) {
      if (a.abilities.magicImmune || !a.abilities.ranged || a.abilities.noRanged) continue;
      a.statusEffects.precisionRounds = 6;
      touchStatusFlag(a, 'precisionRounds');
      grantTempAbility(a, 'longRange');
      grantTempAbility(a, 'noObstaclePenalty');
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = '百步星瞳!';
    state.actionLog.push(`✦ ${unit.name} 发动「百步星瞳」，全体有效远程友军远程攻击 +25% 且无视距离与普通障碍！`);
  } else if (eff === 'mass_bloodlust') {
    for (const a of allies) {
      if (a.abilities.magicImmune || a.abilities.noMelee) continue;
      a.statusEffects.bloodlustRounds = 6;
      touchStatusFlag(a, 'bloodlustRounds');
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = '百鬼狂潮+25%!';
    state.actionLog.push(`🔥 ${unit.name} 发动「百鬼狂潮」，全体近战友军近战伤害 +25%！`);
  } else if (eff === 'mass_first_strike') {
    for (const a of allies) {
      if (a.abilities.magicImmune || a.abilities.noMelee) continue;
      grantTempAbility(a, 'firstStrike');
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = `${spell.name}!`;
    state.actionLog.push(`⚡ ${unit.name} 施放「${spell.name}」，全体非魔免友军获得「先攻」特技！`);
  } else if (eff === 'mass_slayer') {
    for (const a of allies) {
      if (a.abilities.magicImmune) continue;
      a.statusEffects.slayer = true;
      touchStatusFlag(a, 'slayer');
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = '众刃屠龙+50%!';
    state.actionLog.push(`🔥 ${unit.name} 施放「众刃屠龙」，全队对 4 阶巨兽伤害 +50%！`);
  } else if (eff === 'prayer') {
    for (const a of allies) {
      if (a.abilities.magicImmune || a.alignment !== 'life') continue;
      const oldMax = computeUnitStats(a, state, catalog).maxHp;
      const dur = 6 + lifeDurationBonus;
      pushSpellModifier(a, { id: `spell:prayer:hp:${state.commandSeq}:${a.id}`, stat: 'maxHp', mode: 'percent', value: 0.25, sourceName: '祈符·巫女祈祷', remainingRounds: dur, spellPolarity: 'positive' });
      pushSpellModifier(a, { id: `spell:prayer:d1:${state.commandSeq}:${a.id}`, stat: 'minDamage', mode: 'percent', value: 0.25, sourceName: '祈符·巫女祈祷', remainingRounds: dur, spellPolarity: 'positive' });
      pushSpellModifier(a, { id: `spell:prayer:d2:${state.commandSeq}:${a.id}`, stat: 'maxDamage', mode: 'percent', value: 0.25, sourceName: '祈符·巫女祈祷', remainingRounds: dur, spellPolarity: 'positive' });
      const newMax = computeUnitStats(a, state, catalog).maxHp;
      a.currentHp = Math.min(newMax, a.currentHp + Math.max(0, newMax - oldMax));
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = '巫女祈祷+25%!';
    state.actionLog.push(`✝ ${unit.name} 献上「巫女祈祷」，己方全体生命系部队生命与伤害 +25%！`);
  } else if (eff === 'divine_intervention') {
    for (const a of allies) {
      if (a.abilities.magicImmune || isImmuneToLivingHeal(a)) continue;
      cleanseNegativeEffects(a, true);
      const aStats = computeUnitStats(a, state, catalog);
      const revPower = Math.max(calcPower(spell.reviveBase ?? 180, 2.0), aStats.maxHp * a.maxCount);
      const res = reviveAndHealUnit(state, a, revPower, catalog, false);
      a.currentHp = aStats.maxHp;
      ctx.reviveMap[a.id] = res;
      if (res.healedHp > 0) ctx.healMap[a.id] = res.healedHp;
      ctx.affectedUnitIds.push(a.id);
    }
    ctx.noteText = '八百万神降!';
    state.actionLog.push(`✨ ${unit.name} 发动终极神迹「八百万神降」，全军活体友军满血复生并彻底清祓一切厄祟！`);
  } else if (eff === 'holy_shout') {
    for (const e of enemies) {
      const isUnholy = isUndeadUnit(e) || e.alignment === 'death' || e.abilities.darkNature;
      const isChaos = e.alignment === 'chaos';
      if (!isUnholy && !isChaos) continue;
      ctx.affectedUnitIds.push(e.id);
      const mult = isUnholy ? 1.0 : 0.55;
      const raw = calcPower(spell.damageBase ?? 24, 0.5) * mult;
      ctx.damageMap[e.id] = computeAndApplySpellDamage(state, unit, e, spell, raw, catalog, events, deps, 0.5);
    }
    state.actionLog.push(`✝ ${unit.name} 发出「阴阳叱咤」，退魔灵光震慑全场 ${ctx.affectedUnitIds.length} 支异变敌军！`);
  } else if (eff === 'life_drain') {
    let totalDrained = 0;
    for (const e of enemies) {
      if (isImmuneToLivingEffects(e)) continue;
      ctx.affectedUnitIds.push(e.id);
      const raw = calcPower(spell.damageBase ?? 20, 0.45);
      const res = computeAndApplySpellDamage(state, unit, e, spell, raw, catalog, events, deps, 0.4);
      totalDrained += res.damage;
    }
    const selfHeal = Math.round(totalDrained * 0.5);
    if (selfHeal > 0 && !unit.abilities.magicImmune && (!isImmuneToLivingHeal(unit) || isUndeadUnit(unit))) {
      const before = unit.currentHp;
      unit.currentHp = Math.min(casterStats.maxHp, unit.currentHp + selfHeal);
      ctx.healMap[unit.id] = Math.max(0, unit.currentHp - before);
    }
    state.actionLog.push(`☠ ${unit.name} 施放「冥樱吸魂」，掠夺 ${totalDrained} 点生机并转化回复自身 ${ctx.healMap[unit.id] ?? 0} HP！`);
  } else if (eff === 'unholy_song') {
    for (const e of enemies) {
      if (e.abilities.magicImmune || e.alignment !== 'life' || isTargetResistingHostileSpell(state, unit, e, catalog)) {
        continue;
      }
      pushSpellModifier(e, { id: `spell:unholy:d1:${state.commandSeq}:${e.id}`, stat: 'minDamage', mode: 'percent', value: -0.2, sourceName: '幽曲·反魂幽曲', remainingRounds: 5, spellPolarity: 'negative' });
      pushSpellModifier(e, { id: `spell:unholy:d2:${state.commandSeq}:${e.id}`, stat: 'maxDamage', mode: 'percent', value: -0.2, sourceName: '幽曲·反魂幽曲', remainingRounds: 5, spellPolarity: 'negative' });
      pushSpellModifier(e, { id: `spell:unholy:def:${state.commandSeq}:${e.id}`, stat: 'defense', mode: 'percent', value: -0.2, sourceName: '幽曲·反魂幽曲', remainingRounds: 5, spellPolarity: 'negative' });
      ctx.affectedUnitIds.push(e.id);
    }
    ctx.noteText = '反魂幽曲!';
    state.actionLog.push(`☠ ${unit.name} 奏响「反魂幽曲」，压制敌方生命系单位伤害与防御 -20%！`);
  } else if (eff === 'plague') {
    const tickDmg = Math.round(calcPower(spell.damageBase ?? 14, 0.4));
    for (const u of allAlive) {
      if (u.abilities.magicImmune || isImmuneToLivingEffects(u) || u.statusEffects?.sanctuary) continue;
      if (isTargetResistingHostileSpell(state, unit, u, catalog)) continue;
      u.statusEffects.plaguePower = Math.max(u.statusEffects.plaguePower ?? 0, tickDmg);
      touchStatusFlag(u, 'plaguePower');
      ctx.affectedUnitIds.push(u.id);
      ctx.damageMap[u.id] = computeAndApplySpellDamage(state, unit, u, spell, tickDmg, catalog, events, deps, 0);
    }
    state.actionLog.push(`☣ ${unit.name} 散布禁术「黄泉瘴疫」，全场 ${ctx.affectedUnitIds.length} 支活体部队染疫流血！`);
  } else if (eff === 'sparks') {
    for (const e of enemies) {
      if (deps.getUnitMinDistance(unit, e) > 2) continue;
      ctx.affectedUnitIds.push(e.id);
      const raw = calcPower(spell.damageBase ?? 18, 0.45);
      ctx.damageMap[e.id] = computeAndApplySpellDamage(state, unit, e, spell, raw, catalog, events, deps, 0.5);
    }
    state.actionLog.push(`⚡ ${unit.name} 释放「星尘迸裂」，灼烧近身 ${ctx.affectedUnitIds.length} 支敌军！`);
  } else if (eff === 'armageddon') {
    for (const u of allAlive) {
      ctx.affectedUnitIds.push(u.id);
      const raw = calcPower(spell.damageBase ?? 52, 0.6);
      ctx.damageMap[u.id] = computeAndApplySpellDamage(state, unit, u, spell, raw, catalog, events, deps, 0.45);
    }
    state.actionLog.push(`☄ ${unit.name} 发动终极禁咒「星陨终末」！焚世陨星无差别席卷全战场 ${ctx.affectedUnitIds.length} 支单位！`);
  } else if (spell.massScope) {
    const pool =
      spell.massScope === 'all_allies' ? allies : spell.massScope === 'all_enemies' ? enemies : allAlive;
    const isMoraleMassSpell = Boolean(
      spell.buffModifiers?.some((m) => m.stat === 'morale') ||
        spell.debuffModifiers?.some((m) => m.stat === 'morale'),
    );
    for (const t of pool) {
      if (t.abilities.magicImmune || t.statusEffects?.sanctuary) continue;
      if (isTargetResistingHostileSpell(state, unit, t, catalog)) continue;
      if (isTargetBlockedByMind(t) || isTargetBlockedByLiving(t)) continue;
      if (spell.healBase && isImmuneToLivingHeal(t)) continue;
      if (isMoraleMassSpell && isImmuneToMorale(t)) continue;
      ctx.affectedUnitIds.push(t.id);
      if (spell.healBase) {
        const tStats = computeUnitStats(t, state, catalog);
        const amt = Math.round(calcPower(spell.healBase, 0.5));
        const before = t.currentHp;
        t.currentHp = Math.min(tStats.maxHp, t.currentHp + amt);
        ctx.healMap[t.id] = Math.max(0, t.currentHp - before);
        t.statusEffects.poisonPower = 0;
        t.statusEffects.plaguePower = 0;
      }
      if (spell.buffModifiers && spell.buffDuration) {
        spell.buffModifiers.forEach((m, idx) => {
          pushSpellModifier(t, {
            ...m,
            id: `spell:${spell.id}:${state.commandSeq}:${t.id}:${idx}`,
            remainingRounds: spell.buffDuration! + lifeDurationBonus,
            spellPolarity: m.spellPolarity ?? 'positive',
          });
        });
      }
      if (spell.debuffModifiers && spell.debuffDuration) {
        spell.debuffModifiers.forEach((m, idx) => {
          pushSpellModifier(t, {
            ...m,
            id: `spell:${spell.id}:${state.commandSeq}:${t.id}:${idx}`,
            remainingRounds: spell.debuffDuration!,
            spellPolarity: m.spellPolarity ?? 'negative',
          });
        });
      }
    }
    state.actionLog.push(`✦ ${unit.name} 施放群体术式「${spell.name}」，覆盖 ${ctx.affectedUnitIds.length} 支单位！`);
  }

  return null;
}

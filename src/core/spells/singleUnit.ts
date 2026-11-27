/**
 * 单体单位术式（ally_unit / enemy_unit / any_unit）执行器
 * 涵盖特殊效果（祝福/诅咒/驱散/结界/反伤/控场/魅惑/击退/勾魂/湮灭/连锁闪电）与标准治疗/增益/减益/伤害。
 */

import {
  DARK_MAGIC_VULNERABILITY_MULT,
  isDarkMagicVulnerable,
  isImmuneToLivingEffects,
  isUndeadUnit,
} from '../creatureTypes';
import { resolveActiveHeroClass } from '../h4Skills';
import { hexEquals, hexKey, hexRay } from '../hex';
import { computeUnitStats } from '../modifiers';
import { nextRandom } from '../rng';
import type { SpellBranchOutcome, SpellCastContext } from './context';
import {
  canPlaceFootprintAt,
  cleanseNegativeEffects,
  cleansePositiveEffects,
  computeAndApplySpellDamage,
  getCasterSchoolRank,
  grantTempAbility,
  isTargetResistingHostileSpell,
  reviveAndHealUnit,
} from './helpers';

export function executeSingleUnitSpell(ctx: SpellCastContext): SpellBranchOutcome {
  const {
    state,
    unit,
    spell,
    eff,
    catalog,
    events,
    deps,
    lifeDurationBonus,
    mindDurationBonus,
    calcPower,
    touchStatusFlag,
    pushSpellModifier,
    isTargetBlockedByLiving,
    isTargetBlockedByMind,
    requireSingleUnit,
  } = ctx;

  const tUnitOrErr = requireSingleUnit(false);
  if (typeof tUnitOrErr === 'string') {
    return { ok: false, error: tUnitOrErr, events: [] };
  }
  const tUnit = tUnitOrErr;
  ctx.targetHex = tUnit.pos;
  ctx.affectedUnitIds.push(tUnit.id);
  const tStats = computeUnitStats(tUnit, state, catalog);

  // 混沌系「贤者折光 Magic Mirror」：敌方单体伤害法术以 50% 威力反弹给施法者
  const triggerMagicMirror = (rawDmg: number) => {
    if (
      tUnit.side !== unit.side &&
      tUnit.statusEffects?.magicMirror &&
      !unit.abilities.magicImmune &&
      computeUnitStats(unit, state, catalog).magicResistance < 1 &&
      rawDmg > 0
    ) {
      const refl = computeAndApplySpellDamage(state, tUnit, unit, spell, rawDmg * 0.5, catalog, events, deps, 0);
      ctx.damageMap[unit.id] = refl;
      ctx.affectedUnitIds.push(unit.id);
      state.actionLog.push(`🪞 ${tUnit.name} 的「贤者折光」将「${spell.name}」半数威力反弹，重创 ${unit.name} ${refl.damage} 伤害！`);
    }
  };

  if (eff === 'bless') {
    tUnit.statusEffects.bless = true;
    tUnit.statusEffects.curse = false;
    touchStatusFlag(tUnit, 'bless');
    ctx.noteText = '神祝满伤!';
    state.actionLog.push(`✨ ${unit.name} 对 ${tUnit.name} 降下「神祝满盈」，每次攻击恒定最大伤害！`);
  } else if (eff === 'curse') {
    tUnit.statusEffects.curse = true;
    tUnit.statusEffects.bless = false;
    touchStatusFlag(tUnit, 'curse');
    ctx.noteText = '厄祟低伤!';
    state.actionLog.push(`☠ ${unit.name} 对 ${tUnit.name} 施加「厄祟缠身」，每次攻击只能打出最小伤害！`);
  } else if (eff === 'exorcism') {
    const n = cleanseNegativeEffects(tUnit, true);
    ctx.noteText = `御币清祓 (${n})!`;
    state.actionLog.push(`✨ ${unit.name} 对 ${tUnit.name} 施放「御币清祓」，净化了 ${n} 项负面状态！`);
  } else if (eff === 'cancellation') {
    const n = cleansePositiveEffects(tUnit).length;
    ctx.noteText = `蚀灵消咒 (${n})!`;
    state.actionLog.push(`☠ ${unit.name} 对 ${tUnit.name} 施放「蚀灵消咒」，剥除了 ${n} 项有益增益！`);
  } else if (eff === 'dispel') {
    cleansePositiveEffects(tUnit);
    cleanseNegativeEffects(tUnit, false);
    ctx.noteText = '星律解咒!';
    state.actionLog.push(`✦ ${unit.name} 对 ${tUnit.name} 施放「星律解咒」，清除了全部正负法术状态！`);
  } else if (eff === 'steal_enchantment') {
    const stolen = cleansePositiveEffects(tUnit);
    const allies = Object.values(state.units).filter((a) => a.status === 'alive' && a.side === unit.side && !a.abilities.magicImmune);
    if (stolen.length > 0 && allies.length > 0) {
      const pick = allies[Math.floor(nextRandom(state.rng) * allies.length)];
      pushSpellModifier(pick, { ...stolen[0], id: `stolen:${state.commandSeq}` });
      ctx.affectedUnitIds.push(pick.id);
      ctx.noteText = '窃法魔手!';
      state.actionLog.push(`✦ ${unit.name} 发动「窃法魔手」，顺手将 ${tUnit.name} 的增益转移至 ${pick.name} 身上！`);
    } else {
      ctx.noteText = '无可窃取增益';
      state.actionLog.push(`${unit.name} 对 ${tUnit.name} 施放「窃法魔手」，目标暂无可转移的增益修饰。`);
    }
  } else if (eff === 'ward_single' && spell.wardSchool) {
    tUnit.statusEffects.schoolWards = { ...(tUnit.statusEffects.schoolWards ?? {}), [spell.wardSchool]: true };
    touchStatusFlag(tUnit, 'schoolWards');
    ctx.noteText = `${spell.name}!`;
    state.actionLog.push(`🛡 ${unit.name} 为 ${tUnit.name} 展开「${spell.name}」（35% 对应系魔抗与防卫）！`);
  } else if (eff === 'retribution') {
    tUnit.statusEffects.retribution = true;
    touchStatusFlag(tUnit, 'retribution');
    ctx.noteText = '因果报应35%!';
    state.actionLog.push(`✝ ${unit.name} 为 ${tUnit.name} 施加「因果报应」，近战来犯者将受 35% 反弹伤害！`);
  } else if (eff === 'pain_mirror') {
    tUnit.statusEffects.painMirror = true;
    touchStatusFlag(tUnit, 'painMirror');
    ctx.noteText = '因果水镜50%!';
    state.actionLog.push(`🪞 ${unit.name} 为 ${tUnit.name} 立起「因果水镜」，所受一切攻击伤害 50% 反弹攻击者！`);
  } else if (eff === 'magic_mirror') {
    tUnit.statusEffects.magicMirror = true;
    touchStatusFlag(tUnit, 'magicMirror');
    ctx.noteText = '贤者折光50%!';
    state.actionLog.push(`🪞 ${unit.name} 为 ${tUnit.name} 展开「贤者折光」，将反射敌方单体攻击法术！`);
  } else if (eff === 'song_of_peace') {
    tUnit.statusEffects.songOfPeaceRounds = 2 + mindDurationBonus;
    touchStatusFlag(tUnit, 'songOfPeaceRounds');
    ctx.noteText = '镇魂神乐!';
    state.actionLog.push(`🎵 ${unit.name} 对 ${tUnit.name} 奏响「镇魂神乐」，${2 + mindDurationBonus} 回合内无法攻击或施法！`);
  } else if (eff === 'regeneration') {
    const reg = Math.round(calcPower(spell.healBase ?? 20, 0.5));
    tUnit.statusEffects.regenPerRound = reg;
    touchStatusFlag(tUnit, 'regenPerRound');
    ctx.noteText = `生生不息 +${reg}/回!`;
    state.actionLog.push(`💚 ${unit.name} 为 ${tUnit.name} 施放「生生不息」，每回合自动恢复 ${reg} HP！`);
  } else if (eff === 'guardian_angel') {
    const lives = Math.max(
      2,
      Math.floor(1 + getCasterSchoolRank(unit, 'life') * 0.6 + (unit.subSkills?.resurrection_skill ?? 0) * 0.35),
    );
    tUnit.statusEffects.guardianAngelLives = lives;
    touchStatusFlag(tUnit, 'guardianAngelLives');
    ctx.noteText = `御神护命×${lives}!`;
    state.actionLog.push(`👼 ${unit.name} 为 ${tUnit.name} 降下「御神护命」，赋予 ${lives} 次免死复生护命！`);
  } else if (eff === 'sanctuary') {
    for (const a of Object.values(state.units)) {
      if (a.side === unit.side) a.statusEffects.sanctuary = false;
    }
    tUnit.statusEffects.sanctuary = true;
    touchStatusFlag(tUnit, 'sanctuary');
    ctx.noteText = '常世净域!';
    state.actionLog.push(`✨ ${unit.name} 为 ${tUnit.name} 张开「常世净域」，行动前绝对免受攻击与法术！`);
  } else if (eff === 'blur') {
    tUnit.statusEffects.blur = true;
    touchStatusFlag(tUnit, 'blur');
    ctx.noteText = '蜃气残影!';
    state.actionLog.push(`✦ ${unit.name} 为 ${tUnit.name} 施加「蜃气残影」，远程减伤与高额擦弹生效！`);
  } else if (eff === 'precision') {
    tUnit.statusEffects.precisionRounds = 6;
    touchStatusFlag(tUnit, 'precisionRounds');
    grantTempAbility(tUnit, 'longRange');
    grantTempAbility(tUnit, 'noObstaclePenalty');
    ctx.noteText = '天眼狙定!';
    state.actionLog.push(`🎯 ${unit.name} 为 ${tUnit.name} 开启「天眼狙定」，远程攻击 +25% 且无视距离与普通障碍衰减！`);
  } else if (eff === 'bloodlust') {
    tUnit.statusEffects.bloodlustRounds = 6;
    touchStatusFlag(tUnit, 'bloodlustRounds');
    ctx.noteText = '鬼神狂战+25%!';
    state.actionLog.push(`🔥 ${unit.name} 为 ${tUnit.name} 施加「鬼神狂战」，持续 6 回合近战伤害 +25%！`);
  } else if (eff === 'displacement') {
    const awayRay = hexRay(unit.pos, tUnit.pos, deps.getUnitMinDistance(unit, tUnit) + 3, (c) => Boolean(state.tiles[hexKey(c)]));
    const tIdx = awayRay.findIndex((h) => hexEquals(h, tUnit.pos));
    let destPos = tUnit.pos;
    if (tIdx >= 0) {
      for (let step = 1; step <= 2; step++) {
        const cand = awayRay[tIdx + step];
        if (cand && canPlaceFootprintAt(state, cand, tUnit.footprint, tUnit.id, Boolean(tUnit.abilities.flying))) {
          destPos = cand;
        } else {
          break;
        }
      }
    }
    tUnit.pos = { ...destPos };
    ctx.targetHex = destPos;
    ctx.displacedUnits.push({ unitId: tUnit.id, to: { ...destPos } });
    ctx.noteText = '隙间斥退!';
    state.actionLog.push(`🌀 ${unit.name} 发动「隙间斥退」，将 ${tUnit.name} 强行震退！`);
  } else if (eff === 'cowardice') {
    tUnit.statusEffects.cowardiceRounds = 3 + mindDurationBonus;
    touchStatusFlag(tUnit, 'cowardiceRounds');
    ctx.noteText = `畏惧之瞳 ${3 + mindDurationBonus}回!`;
    state.actionLog.push(`😨 ${unit.name} 对 ${tUnit.name} 投下「畏惧之瞳」，${3 + mindDurationBonus} 回合内不敢攻击强敌！`);
  } else if (eff === 'flight') {
    grantTempAbility(tUnit, 'flying');
    ctx.noteText = '御空浮游!';
    state.actionLog.push(`🕊 ${unit.name} 为 ${tUnit.name} 施加「御空浮游」，无视障碍地形自由翱翔！`);
  } else if (eff === 'power_drain') {
    tUnit.statusEffects.powerDrain = true;
    touchStatusFlag(tUnit, 'powerDrain');
    ctx.noteText = '灵脉枯竭!';
    state.actionLog.push(`⚡ ${unit.name} 对 ${tUnit.name} 施放「灵脉枯竭」，其一切施法消耗翻倍！`);
  } else if (eff === 'magic_leech') {
    tUnit.statusEffects.magicLeechCasterId = unit.id;
    touchStatusFlag(tUnit, 'powerDrain');
    ctx.noteText = '噬灵魔蛭!';
    state.actionLog.push(`☠ ${unit.name} 对 ${tUnit.name} 寄生「噬灵魔蛭」，其施法消耗翻倍并虹吸蓝量给己方！`);
  } else if (eff === 'spell_shackle') {
    tUnit.statusEffects.spellShacklePower = Math.max(1, Math.round(calcPower(spell.damageBase ?? 8, 0.3)));
    touchStatusFlag(tUnit, 'spellShacklePower');
    ctx.noteText = '咒缚反噬!';
    state.actionLog.push(`⛓ ${unit.name} 对 ${tUnit.name} 结下「咒缚反噬」，施法即遭灵力灼伤！`);
  } else if (eff === 'forgetfulness') {
    grantTempAbility(tUnit, 'noRanged');
    ctx.noteText = '忘却弹幕!';
    state.actionLog.push(`🚫 ${unit.name} 对 ${tUnit.name} 施放「忘却弹幕」，本战封印其远程射击！`);
  } else if (eff === 'berserk') {
    tUnit.statusEffects.berserkRounds = 2 + mindDurationBonus;
    touchStatusFlag(tUnit, 'berserkRounds');
    ctx.noteText = '月狂赤瞳!';
    state.actionLog.push(`💢 ${unit.name} 对 ${tUnit.name} 发动「月狂赤瞳」，使其不分敌我猛攻最近单位！`);
  } else if (eff === 'blind') {
    tUnit.statusEffects.blindRounds = 3 + mindDurationBonus;
    touchStatusFlag(tUnit, 'blindRounds');
    ctx.noteText = `宵暗蔽目 ${3 + mindDurationBonus}回!`;
    state.actionLog.push(`👁 ${unit.name} 对 ${tUnit.name} 施放「宵暗蔽目」，${3 + mindDurationBonus} 回合无法行动（受伤即醒）！`);
  } else if (eff === 'confusion') {
    tUnit.statusEffects.confusionRounds = 1 + mindDurationBonus;
    touchStatusFlag(tUnit, 'confusionRounds');
    ctx.noteText = '迷乱魔雾!';
    state.actionLog.push(`😵 ${unit.name} 对 ${tUnit.name} 释放「迷乱魔雾」，令其丧失下一次行动！`);
  } else if (eff === 'wasp_swarm') {
    const raw = calcPower(spell.damageBase ?? 14, 0.4);
    ctx.damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0.5);
    tUnit.statusEffects.confusionRounds = 1;
    touchStatusFlag(tUnit, 'confusionRounds');
    ctx.noteText = '妖虫乱舞!';
    state.actionLog.push(`🐝 ${unit.name} 驱使「妖虫乱舞」，袭伤 ${tUnit.name} 并使其失去下次行动！`);
  } else if (eff === 'hypnotize') {
    if (!tUnit.statusEffects.hypnotizedOriginalSide) {
      tUnit.statusEffects.hypnotizedOriginalSide = tUnit.side;
    }
    tUnit.side = unit.side;
    tUnit.facing = unit.side === 'left' ? 'right' : 'left';
    // 催眠严格固定持续 3 回合（倒戈归入施法者阵营）
    tUnit.statusEffects.hypnotizedRounds = 3;
    touchStatusFlag(tUnit, 'hypnotizedRounds');
    ctx.noteText = '迷梦傀儡 3回!';
    state.actionLog.push(`🌀 ${unit.name} 发动「迷梦傀儡」，彻底魅惑 ${tUnit.name} 倒戈 3 回合！`);
  } else if (eff === 'aura_of_fear') {
    tUnit.statusEffects.auraOfFear = true;
    touchStatusFlag(tUnit, 'auraOfFear');
    ctx.noteText = '幽冥威慑!';
    state.actionLog.push(`☠ ${unit.name} 为 ${tUnit.name} 施加「幽冥威慑」，进攻非免疫敌军时压制其反击！`);
  } else if (eff === 'vampiric_touch') {
    tUnit.statusEffects.vampiricTouch = true;
    touchStatusFlag(tUnit, 'vampiricTouch');
    ctx.noteText = '绯红吸血50%!';
    state.actionLog.push(`🩸 ${unit.name} 为 ${tUnit.name} 施加「绯红吸血」，近战伤害 50% 转化为吸血复苏！`);
  } else if (eff === 'fire_aura') {
    tUnit.statusEffects.fireAura = true;
    touchStatusFlag(tUnit, 'fireAura');
    ctx.noteText = '不死炎缠+25%!';
    state.actionLog.push(`🔥 ${unit.name} 为 ${tUnit.name} 施加「不死炎缠」，近战额外附带 +25% 火焰灼烧！`);
  } else if (eff === 'slayer') {
    tUnit.statusEffects.slayer = true;
    touchStatusFlag(tUnit, 'slayer');
    ctx.noteText = '屠龙魔刃+50%!';
    state.actionLog.push(`⚔ ${unit.name} 为 ${tUnit.name} 赋予「屠龙魔刃」，对 4 阶巨兽伤害 +50%！`);
  } else if (eff === 'first_strike') {
    grantTempAbility(tUnit, 'firstStrike');
    ctx.noteText = `${spell.name}!`;
    state.actionLog.push(`⚡ ${unit.name} 为 ${tUnit.name} 施加「${spell.name}」，获得先攻特技！`);
  } else if (eff === 'cat_reflexes') {
    grantTempAbility(tUnit, 'doubleStrike');
    ctx.noteText = '火猫连击!';
    state.actionLog.push(`🐱 ${unit.name} 为 ${tUnit.name} 施加「火猫连击」，获得双重攻击连打！`);
  } else if (eff === 'terrain_walk') {
    tUnit.statusEffects.terrainWalk = true;
    touchStatusFlag(tUnit, 'terrainWalk');
    ctx.noteText = '山林履平!';
    state.actionLog.push(`🌿 ${unit.name} 为 ${tUnit.name} 施加「山林履平」，无视竹林与泥沼减速！`);
  } else if (eff === 'anti_magic') {
    tUnit.statusEffects.antiMagic = true;
    touchStatusFlag(tUnit, 'antiMagic');
    grantTempAbility(tUnit, 'magicImmune');
    ctx.noteText = '无魔绝域!';
    state.actionLog.push(`🛡 ${unit.name} 为 ${tUnit.name} 张开「无魔绝域」，进入全魔法免疫状态！`);
  } else if (eff === 'giant_strength' || eff === 'dragon_strength') {
    const pct = eff === 'dragon_strength' ? 1.0 : 0.25;
    const oldMax = tStats.maxHp;
    pushSpellModifier(tUnit, { id: `spell:${spell.id}:hp:${state.commandSeq}`, stat: 'maxHp', mode: 'percent', value: pct, sourceName: `${spell.spellCardPrefix ?? '术式'}·${spell.name}`, remainingRounds: 6, spellPolarity: 'positive' });
    pushSpellModifier(tUnit, { id: `spell:${spell.id}:d1:${state.commandSeq}`, stat: 'minDamage', mode: 'percent', value: pct, sourceName: `${spell.spellCardPrefix ?? '术式'}·${spell.name}`, remainingRounds: 6, spellPolarity: 'positive' });
    pushSpellModifier(tUnit, { id: `spell:${spell.id}:d2:${state.commandSeq}`, stat: 'maxDamage', mode: 'percent', value: pct, sourceName: `${spell.spellCardPrefix ?? '术式'}·${spell.name}`, remainingRounds: 6, spellPolarity: 'positive' });
    const newMax = computeUnitStats(tUnit, state, catalog).maxHp;
    tUnit.currentHp = Math.min(newMax, tUnit.currentHp + Math.max(0, newMax - oldMax));
    ctx.noteText = eff === 'dragon_strength' ? '古龙神力+100%!' : '鬼王巨力+25%!';
    state.actionLog.push(`🐉 ${unit.name} 为 ${tUnit.name} 施加「${spell.name}」，生命与伤害暴涨 +${Math.round(pct * 100)}%！`);
  } else if (eff === 'poison') {
    const pDmg = Math.max(1, Math.round(calcPower(spell.damageBase ?? 15, 0.4)));
    tUnit.statusEffects.poisonPower = Math.max(tUnit.statusEffects.poisonPower ?? 0, pDmg);
    touchStatusFlag(tUnit, 'poisonPower');
    ctx.damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, pDmg, catalog, events, deps, 0);
    ctx.noteText = `铃兰毒 ${pDmg}/回!`;
    state.actionLog.push(`☠ ${unit.name} 对 ${tUnit.name} 施放「铃兰剧毒」，每回合持续毒伤 ${pDmg}！`);
  } else if (eff === 'banish') {
    const mult = tUnit.isSummoned || tUnit.isIllusion ? 3.2 : 0.35;
    const raw = calcPower(spell.damageBase ?? 75, 0.9) * mult;
    ctx.damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0.2);
    state.actionLog.push(`✦ ${unit.name} 对 ${tUnit.name} 施放「放逐虚境」，造成 ${ctx.damageMap[tUnit.id].damage} 点放逐打击！`);
  } else if (eff === 'holy_word') {
    const mult = isUndeadUnit(tUnit) || tUnit.alignment === 'death' || tUnit.abilities.darkNature ? 1.25 : tUnit.alignment === 'chaos' ? 0.85 : 0.5;
    const raw = calcPower(spell.damageBase ?? 24, 0.5) * mult;
    ctx.damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0.5);
    triggerMagicMirror(raw);
    state.actionLog.push(`✝ ${unit.name} 念诵「破邪真言」，对 ${tUnit.name} 降下 ${ctx.damageMap[tUnit.id].damage} 点退魔惩戒！`);
  } else if (eff === 'hand_of_death') {
    if (isImmuneToLivingEffects(tUnit)) {
      return { ok: false, error: '机械/不死/元素/幻象单位免疫「冥府勾魂」', events: [] };
    }
    const raw = calcPower(spell.damageBase ?? 76, 1.0);
    if (tUnit.kind === 'creature' && !tUnit.abilities.magicImmune) {
      const casterHeroCls =
        unit.kind === 'hero'
          ? resolveActiveHeroClass(unit.skills, unit.subSkills, catalog.advancedClasses, unit.selectedAdvancedClassId)
          : null;
      const ignoresWards = Boolean(casterHeroCls?.passive?.ignoreEnemyWards);
      let effectivePower = raw;
      if (isDarkMagicVulnerable(tUnit)) effectivePower *= DARK_MAGIC_VULNERABILITY_MULT;
      if (!ignoresWards && tUnit.abilities.deathWard) effectivePower *= 0.5;
      if (!ignoresWards && tUnit.statusEffects?.schoolWards?.death) effectivePower *= 0.65;
      effectivePower *= Math.max(0, 1 - tStats.magicResistance);
      const directKills =
        effectivePower <= 0
          ? 0
          : Math.max(1, Math.min(tUnit.count, Math.floor(effectivePower / Math.max(12, tStats.maxHp))));
      const actual = deps.applyBonusKills(state, tUnit, directKills, events);
      ctx.damageMap[tUnit.id] = { damage: actual * tStats.maxHp, kills: actual, grazed: false };
      deps.handlePostKillRewards(state, unit, tUnit, actual);
      state.actionLog.push(`💀 ${unit.name} 施放「冥府勾魂」，直接夺命抹杀 ${tUnit.name} ${actual} 名兵力！`);
    } else {
      ctx.damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0);
      state.actionLog.push(`💀 ${unit.name} 施放「冥府勾魂」，重创 ${tUnit.name} ${ctx.damageMap[tUnit.id].damage} 伤害！`);
    }
    triggerMagicMirror(raw);
  } else if (eff === 'disintegrate') {
    const raw = calcPower(spell.damageBase ?? 85, 1.0);
    ctx.damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0.35);
    if (ctx.damageMap[tUnit.id].kills > 0 || tUnit.status === 'dead') {
      tUnit.statusEffects.disintegrated = true;
    }
    triggerMagicMirror(raw);
    state.actionLog.push(`💥 ${unit.name} 轰出「星穹湮灭」，对 ${tUnit.name} 造成 ${ctx.damageMap[tUnit.id].damage} 点湮灭伤害！`);
  } else if (eff === 'chain_lightning') {
    const baseRaw = calcPower(spell.damageBase ?? 68, 0.8);
    const hitSet = new Set<string>([tUnit.id]);
    ctx.damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, baseRaw, catalog, events, deps, 0.45);
    triggerMagicMirror(baseRaw);

    let curr = tUnit;
    let currRaw = baseRaw * 0.5;
    for (let bounce = 0; bounce < 4; bounce++) {
      const nextCand = Object.values(state.units)
        .filter(
          (u) =>
            u.status === 'alive' &&
            !hitSet.has(u.id) &&
            !u.abilities.magicImmune &&
            !u.statusEffects?.sanctuary &&
            !isTargetResistingHostileSpell(state, unit, u, catalog),
        )
        .sort((a, b) => {
          const da = deps.getUnitMinDistance(curr, a);
          const db = deps.getUnitMinDistance(curr, b);
          if (da !== db) return da - db;
          return (a.side !== unit.side ? 0 : 1) - (b.side !== unit.side ? 0 : 1);
        })[0];
      if (!nextCand || deps.getUnitMinDistance(curr, nextCand) > 6) break;
      hitSet.add(nextCand.id);
      ctx.affectedUnitIds.push(nextCand.id);
      ctx.damageMap[nextCand.id] = computeAndApplySpellDamage(state, unit, nextCand, spell, currRaw, catalog, events, deps, 0.35);
      curr = nextCand;
      currRaw *= 0.5;
    }
    state.actionLog.push(`⚡ ${unit.name} 轰出「五雷连锁」，高压紫雷连续贯穿 ${hitSet.size} 支目标！`);
  } else {
    // 标准单体治疗 / 苏生 / Buff / Debuff / 伤害
    if (spell.reviveBase) {
      const revPower = calcPower(spell.reviveBase, 1.2);
      const res = reviveAndHealUnit(state, tUnit, revPower, catalog, false);
      ctx.reviveMap[tUnit.id] = res;
      if (res.healedHp > 0) ctx.healMap[tUnit.id] = res.healedHp;
      state.actionLog.push(
        res.revivedCount > 0
          ? `✨ ${unit.name} 施放「${spell.name}」，令 ${tUnit.name} 苏生 ${res.revivedCount} 名兵力（共恢复 ${res.healedHp} HP）！`
          : `${unit.name} 施放「${spell.name}」，为 ${tUnit.name} 回复 ${res.healedHp} 生命。`,
      );
    } else if (spell.healBase) {
      const healAmount = Math.max(1, Math.round(calcPower(spell.healBase, 0.6)));
      const before = tUnit.currentHp;
      tUnit.currentHp = Math.min(tStats.maxHp, tUnit.currentHp + healAmount);
      ctx.healMap[tUnit.id] = Math.max(0, tUnit.currentHp - before);
      if (spell.id === 'life_heal') {
        tUnit.statusEffects.poisonPower = 0;
        tUnit.statusEffects.plaguePower = 0;
      }
      state.actionLog.push(`${unit.name} 施放「${spell.name}」，为 ${tUnit.name} 回复 ${ctx.healMap[tUnit.id]} 生命。`);
    }

    if (spell.buffModifiers && spell.buffDuration) {
      spell.buffModifiers.forEach((m, idx) => {
        pushSpellModifier(tUnit, {
          ...m,
          id: `spell:${spell.id}:${state.commandSeq}:${idx}`,
          remainingRounds: spell.buffDuration! + lifeDurationBonus,
          spellPolarity: m.spellPolarity ?? 'positive',
        });
      });
      state.actionLog.push(`${unit.name} 为 ${tUnit.name} 施加了「${spell.name}」。`);
    }

    if (spell.debuffModifiers && spell.debuffDuration) {
      if (isTargetBlockedByLiving(tUnit) || isTargetBlockedByMind(tUnit)) {
        state.actionLog.push(`${tUnit.name} 免疫了「${spell.name}」！`);
      } else {
        spell.debuffModifiers.forEach((m, idx) => {
          pushSpellModifier(tUnit, {
            ...m,
            id: `spell:${spell.id}:${state.commandSeq}:${idx}`,
            remainingRounds: spell.debuffDuration!,
            spellPolarity: m.spellPolarity ?? 'negative',
          });
        });
        state.actionLog.push(`${unit.name} 对 ${tUnit.name} 施加了「${spell.name}」。`);
      }
    }

    if (spell.damageBase) {
      const spWeight = spell.level >= 4 ? 0.8 : spell.level === 3 ? 0.6 : 0.5;
      const raw = calcPower(spell.damageBase, spWeight);
      ctx.damageMap[tUnit.id] = computeAndApplySpellDamage(state, unit, tUnit, spell, raw, catalog, events, deps, 0.7);
      triggerMagicMirror(raw);
      const lossText = tUnit.kind === 'creature' ? `（折损 ${ctx.damageMap[tUnit.id].kills} 兵）` : '';
      state.actionLog.push(
        `${unit.name} 施放「${spell.name}」，对 ${tUnit.name} 造成 ${ctx.damageMap[tUnit.id].damage} 伤害${lossText}${ctx.damageMap[tUnit.id].grazed ? '(擦弹!)' : ''}！`,
      );
    }
  }

  return null;
}

/**
 * 召唤、死亡招魂复生与秩序幻象分身法术执行器
 * 规则：召唤、招魂与幻象若己方场上已存在同种存活对应堆叠，则直接叠加数量与生命池至该单位，不分散生成多个单位。
 */

import { hexEquals, hexKey, minHexSetDistance } from '../hex';
import { computeUnitStats } from '../modifiers';
import type { SpellBranchOutcome, SpellCastContext } from './context';
import {
  allocateHpPoolToStack,
  canPlaceFootprintAt,
  evaluateIllusionSpell,
  findNearestOpenAnchor,
  findStackableSummonUnit,
  getAvailableCorpseHp,
  mergeHpPoolIntoExistingStack,
  reviveAndHealUnit,
  spawnSummonedStack,
  validateCorpseSpellTarget,
} from './helpers';

/** 1. 召唤类术式（自然 16 召唤 + 深渊冰魔召唤；已有同种存活召唤堆时直接叠加至该单位） */
export function executeSummonCreatureSpell(ctx: SpellCastContext): SpellBranchOutcome {
  const { state, unit, spell, command, catalog, deps, effectiveRange, calcPower } = ctx;
  const template = spell.summonTemplateId ? catalog.creatures[spell.summonTemplateId] : undefined;
  if (!template) return { ok: false, error: '未找到召唤生物模板', events: [] };

  const existing = findStackableSummonUnit(state, unit.side, template.id, 'summoned');
  const budgetHp = calcPower(45, 3) * (0.75 + spell.level * 0.25);
  const count = Math.max(1, Math.round(budgetHp / Math.max(10, template.baseStats.maxHp)));

  if (existing) {
    const reqHex = command.targetHex;
    const existingHexes = deps.getUnitOccupiedHexes(existing);
    const clickedExisting = Boolean(reqHex && existingHexes.some((h) => hexEquals(h, reqHex)));
    if (reqHex && !state.tiles[hexKey(reqHex)]) {
      return { ok: false, error: '请在射程内选择召唤落点或已有同种召唤单位', events: [] };
    }
    if (effectiveRange > 0) {
      const dist = clickedExisting || !reqHex
        ? deps.getUnitMinDistance(unit, existing)
        : minHexSetDistance(deps.getUnitOccupiedHexes(unit), [reqHex]);
      if (dist > effectiveRange) {
        return { ok: false, error: '召唤位置超出施法范围', events: [] };
      }
    }
    const unitMaxHp = Math.max(1, computeUnitStats(existing, state, catalog).maxHp);
    const merged = mergeHpPoolIntoExistingStack(state, existing, count * unitMaxHp, catalog);
    ctx.targetHex = existing.pos;
    ctx.summonedUnitIds.push(existing.id);
    ctx.affectedUnitIds.push(existing.id);
    ctx.noteText = `叠加 ${existing.name} +${merged.addedCount} (共×${existing.count})!`;
    state.actionLog.push(
      `✦ ${unit.name} 施放「${spell.name}」，将 ${merged.addedCount} 名召唤兵力叠加至已有 ${existing.name}（现共 ×${existing.count}）！`,
    );
    return null;
  }

  const reqHex = command.targetHex;
  if (!reqHex || !state.tiles[hexKey(reqHex)]) {
    return { ok: false, error: '请在战场空地选择召唤落点', events: [] };
  }
  if (effectiveRange > 0 && minHexSetDistance(deps.getUnitOccupiedHexes(unit), [reqHex]) > effectiveRange) {
    return { ok: false, error: '召唤位置超出施法范围', events: [] };
  }
  const spawnAnchor = canPlaceFootprintAt(state, reqHex, template.footprint, undefined, Boolean(template.abilities.flying))
    ? reqHex
    : findNearestOpenAnchor(state, reqHex, template.footprint, Boolean(template.abilities.flying), 2);
  if (!spawnAnchor) {
    return { ok: false, error: '目标区域空间不足，无法容纳该召唤生物', events: [] };
  }
  const spawned = spawnSummonedStack(state, unit.side, template, count, spawnAnchor, {
    isSummoned: true,
    summonKind: 'summoned',
  });
  ctx.targetHex = spawnAnchor;
  ctx.summonedUnitIds.push(spawned.id);
  ctx.affectedUnitIds.push(spawned.id);
  ctx.noteText = `召唤 ${spawned.name} ×${spawned.count}!`;
  state.actionLog.push(`✦ ${unit.name} 施放「${spell.name}」，召唤 ${spawned.name} ×${spawned.count} 降临战阵！`);
  return null;
}

/** 2. 死亡招魂 / 操纵死尸 / 黄泉呼唤（正式死亡兵种 + 严格残骸生命池截断 + 同种招魂自动叠加） */
export function executeNecromancySpell(ctx: SpellCastContext): SpellBranchOutcome {
  const { state, unit, spell, eff, command, catalog, deps, effectiveRange, calcPower } = ctx;
  if (state.battleSpellFlags?.necromancyWardActive) {
    return { ok: false, error: '战场受「净土封冥」封印，无法施放招魂术式！', events: [] };
  }
  const tUnit = command.targetUnitId ? state.units[command.targetUnitId] : undefined;
  if (!tUnit || tUnit.kind !== 'creature') {
    return { ok: false, error: '请选择一支已阵亡或有兵力折损的兵种残骸', events: [] };
  }
  const corpseCheck = validateCorpseSpellTarget(spell, unit, tUnit, state, catalog);
  if (!corpseCheck.ok) {
    return { ok: false, error: corpseCheck.reason, events: [] };
  }
  if (effectiveRange > 0 && deps.getUnitMinDistance(unit, tUnit) > effectiveRange) {
    return { ok: false, error: '目标残骸超出施法距离', events: [] };
  }
  ctx.targetHex = tUnit.pos;

  if (eff === 'raise_undead') {
    const template = spell.summonTemplateId ? catalog.creatures[spell.summonTemplateId] : undefined;
    if (!template) return { ok: false, error: '未找到招魂亡灵模板', events: [] };
    const availableCorpseHp = getAvailableCorpseHp(state, tUnit, catalog);
    if (availableCorpseHp <= 0) {
      return { ok: false, error: '该残骸的亡灵生机已被耗尽，无法再次招魂', events: [] };
    }
    const budgetHp =
      spell.level <= 1
        ? calcPower(32, 2.0)
        : spell.level <= 3
          ? calcPower(48, 2.8)
          : calcPower(68, 3.8);
    const effectiveHpPool = Math.floor(Math.min(availableCorpseHp, budgetHp));
    const allocated = allocateHpPoolToStack(effectiveHpPool, template.baseStats.maxHp);
    if (allocated.count <= 0) {
      return { ok: false, error: '招魂预算或残骸生机不足，无法唤起亡灵', events: [] };
    }

    const existing = findStackableSummonUnit(state, unit.side, template.id, 'raised');
    if (existing) {
      tUnit.statusEffects.consumedCorpseHp = (tUnit.statusEffects.consumedCorpseHp ?? 0) + effectiveHpPool;
      const merged = mergeHpPoolIntoExistingStack(state, existing, effectiveHpPool, catalog);
      ctx.targetHex = existing.pos;
      ctx.summonedUnitIds.push(existing.id);
      ctx.affectedUnitIds.push(existing.id);
      const woundedSuffix =
        existing.currentHp < merged.unitMaxHp
          ? `（首名残血 ${existing.currentHp}/${merged.unitMaxHp} HP）`
          : '';
      ctx.noteText =
        merged.addedCount > 0
          ? `招魂叠加 +${merged.addedCount} (共×${existing.count})!`
          : `招魂强化 +${effectiveHpPool} HP!`;
      state.actionLog.push(
        `☠ ${unit.name} 施放「${spell.name}」，从 ${tUnit.name} 的残骸中汲取 ${effectiveHpPool} HP 叠加至已有 ${existing.name}（+${merged.addedCount} 兵，现共 ×${existing.count}）${woundedSuffix}！`,
      );
      return null;
    }

    const anchor = findNearestOpenAnchor(state, tUnit.pos, template.footprint, Boolean(template.abilities.flying), 3);
    if (!anchor) return { ok: false, error: '目标残骸周围无空地可唤起亡灵', events: [] };
    tUnit.statusEffects.consumedCorpseHp = (tUnit.statusEffects.consumedCorpseHp ?? 0) + effectiveHpPool;
    const raised = spawnSummonedStack(state, unit.side, template, allocated.count, anchor, {
      isSummoned: true,
      summonKind: 'raised',
      initialCurrentHp: allocated.currentHp,
    });
    ctx.targetHex = anchor;
    ctx.summonedUnitIds.push(raised.id);
    ctx.affectedUnitIds.push(raised.id);
    const woundedSuffix =
      raised.currentHp < template.baseStats.maxHp
        ? `（首名残血 ${raised.currentHp}/${template.baseStats.maxHp} HP）`
        : '';
    ctx.noteText = `唤起 ${raised.name} ×${raised.count}!`;
    state.actionLog.push(
      `☠ ${unit.name} 施放「${spell.name}」，从 ${tUnit.name} 的残骸中唤起 ${raised.name} ×${raised.count}${woundedSuffix}（共 ${effectiveHpPool} HP）！`,
    );
    return null;
  }

  // Animate Dead / Death Call：友军战损/阵亡原地复生，敌军残骸转化为尸壳 / 怨灵（已有同种招魂堆时直接叠加）
  if (tUnit.side === unit.side && !tUnit.abilities.magicImmune) {
    const tMaxHp = Math.max(1, computeUnitStats(tUnit, state, catalog).maxHp);
    const curTotal = tUnit.status === 'dead' ? 0 : (tUnit.count - 1) * tMaxHp + tUnit.currentHp;
    const maxRecoverableTotal = Math.max(
      curTotal,
      tUnit.maxCount * tMaxHp - (tUnit.statusEffects?.consumedCorpseHp ?? 0),
    );
    const recoverableMissing = Math.max(0, maxRecoverableTotal - curTotal);
    if (recoverableMissing <= 0) {
      return { ok: false, error: '该友军残骸已无可复生的剩余生命', events: [] };
    }
    const spWeight = eff === 'death_call' ? 2.4 : 1.5;
    const revBudget = Math.min(
      recoverableMissing,
      Math.max(1, Math.round(calcPower(spell.reviveBase ?? 55, spWeight))),
    );
    const wasDead = tUnit.status === 'dead';
    const res = reviveAndHealUnit(state, tUnit, revBudget, catalog, true);
    if (tUnit.kind === 'creature' && !tUnit.abilities.undead) {
      tUnit.abilities.undead = true;
    }
    if (wasDead) {
      tUnit.summonKind = 'raised';
    }
    ctx.reviveMap[tUnit.id] = res;
    if (res.healedHp > 0) ctx.healMap[tUnit.id] = res.healedHp;
    ctx.affectedUnitIds.push(tUnit.id);
    const woundedSuffix =
      tUnit.currentHp < tMaxHp ? `（领队残血 ${tUnit.currentHp}/${tMaxHp} HP）` : '';
    ctx.noteText = `复生 +${res.revivedCount} 兵!`;
    state.actionLog.push(
      `☠ ${unit.name} 施放「${spell.name}」，令 ${tUnit.name} 复生 ${res.revivedCount} 名战力${woundedSuffix}（恢复 ${res.healedHp} HP）！`,
    );
    return null;
  }

  const template =
    eff === 'death_call' ? catalog.creatures.wraith_spirit : catalog.creatures.corpse_husk;
  if (!template) return { ok: false, error: '未找到死亡转化兵种模板', events: [] };
  const availableCorpseHp = getAvailableCorpseHp(state, tUnit, catalog);
  if (availableCorpseHp <= 0) {
    return { ok: false, error: '该敌军残骸的亡灵生机已被耗尽，无法继续转化', events: [] };
  }
  const budgetHp = eff === 'death_call' ? calcPower(62, 3.2) : calcPower(40, 2.2);
  const effectiveHpPool = Math.floor(Math.min(availableCorpseHp, budgetHp));
  const allocated = allocateHpPoolToStack(effectiveHpPool, template.baseStats.maxHp);
  if (allocated.count <= 0) {
    return { ok: false, error: '残骸生机或施法预算不足，无法转化亡灵', events: [] };
  }

  const existing = findStackableSummonUnit(state, unit.side, template.id, 'raised');
  if (existing) {
    tUnit.statusEffects.consumedCorpseHp = (tUnit.statusEffects.consumedCorpseHp ?? 0) + effectiveHpPool;
    const merged = mergeHpPoolIntoExistingStack(state, existing, effectiveHpPool, catalog);
    ctx.targetHex = existing.pos;
    ctx.summonedUnitIds.push(existing.id);
    ctx.affectedUnitIds.push(existing.id);
    const woundedSuffix =
      existing.currentHp < merged.unitMaxHp
        ? `（首名残血 ${existing.currentHp}/${merged.unitMaxHp} HP）`
        : '';
    ctx.noteText =
      merged.addedCount > 0
        ? `死灵叠加 +${merged.addedCount} (共×${existing.count})!`
        : `死灵强化 +${effectiveHpPool} HP!`;
    state.actionLog.push(
      `☠ ${unit.name} 施放「${spell.name}」，将 ${tUnit.name} 的亡骸（${effectiveHpPool} HP）转化并叠加至已有 ${existing.name}（+${merged.addedCount} 兵，现共 ×${existing.count}）${woundedSuffix}！`,
    );
    return null;
  }

  const anchor = findNearestOpenAnchor(state, tUnit.pos, template.footprint, Boolean(template.abilities.flying), 3);
  if (!anchor) return { ok: false, error: '残骸周围无空位可供招魂', events: [] };
  tUnit.statusEffects.consumedCorpseHp = (tUnit.statusEffects.consumedCorpseHp ?? 0) + effectiveHpPool;
  const raised = spawnSummonedStack(state, unit.side, template, allocated.count, anchor, {
    isSummoned: true,
    summonKind: 'raised',
    initialCurrentHp: allocated.currentHp,
  });
  ctx.targetHex = anchor;
  ctx.summonedUnitIds.push(raised.id);
  ctx.affectedUnitIds.push(raised.id);
  const woundedSuffix =
    raised.currentHp < template.baseStats.maxHp
      ? `（首名残血 ${raised.currentHp}/${template.baseStats.maxHp} HP）`
      : '';
  ctx.noteText = `死灵转化 ×${raised.count}!`;
  state.actionLog.push(
    `☠ ${unit.name} 施放「${spell.name}」，将 ${tUnit.name} 的亡骸转化为 ${raised.name} ×${raised.count}${woundedSuffix}（共 ${effectiveHpPool} HP）！`,
  );
  return null;
}

/** 3. 秩序幻象分身（Create Illusion / Phantom Image；已有同种存活幻象时直接叠加） */
export function executeIllusionSpell(ctx: SpellCastContext): SpellBranchOutcome {
  const { state, unit, spell, catalog, castHook, requireSingleUnit } = ctx;
  const tUnitOrErr = requireSingleUnit(false);
  if (typeof tUnitOrErr === 'string') return { ok: false, error: tUnitOrErr, events: [] };
  const evalRes = evaluateIllusionSpell(
    spell,
    unit,
    tUnitOrErr,
    state,
    catalog,
    castHook.damageMultiplier,
  );
  if (!evalRes.ok) {
    return { ok: false, error: evalRes.reason, events: [] };
  }
  const cDef = catalog.creatures[tUnitOrErr.defId];
  if (!cDef) return { ok: false, error: '缺少兵种蓝图数据', events: [] };

  const existing = findStackableSummonUnit(state, unit.side, cDef.id, 'illusion');
  if (existing) {
    const merged = mergeHpPoolIntoExistingStack(state, existing, evalRes.illusionHpPool, catalog);
    ctx.targetHex = existing.pos;
    ctx.summonedUnitIds.push(existing.id);
    ctx.affectedUnitIds.push(existing.id);
    const woundedSuffix =
      existing.currentHp < merged.unitMaxHp
        ? `（首名残血 ${existing.currentHp}/${merged.unitMaxHp} HP）`
        : '';
    ctx.noteText =
      merged.addedCount > 0
        ? `幻象叠加 +${merged.addedCount} (共×${existing.count})!`
        : `幻象强化 +${evalRes.illusionHpPool} HP!`;
    state.actionLog.push(
      `✦ ${unit.name} 施放「${spell.name}」，将新幻化出的 ${evalRes.illusionHpPool} HP 叠加至已有 ${existing.name}（+${merged.addedCount} 兵，现共 ×${existing.count}）${woundedSuffix}！`,
    );
    return null;
  }

  const anchor =
    findNearestOpenAnchor(state, tUnitOrErr.pos, cDef.footprint, Boolean(cDef.abilities.flying), 3) ??
    findNearestOpenAnchor(state, unit.pos, cDef.footprint, Boolean(cDef.abilities.flying), 3);
  if (!anchor) return { ok: false, error: '目标附近无空地可生成幻象', events: [] };
  const clone = spawnSummonedStack(state, unit.side, cDef, evalRes.count, anchor, {
    isSummoned: true,
    isIllusion: true,
    summonKind: 'illusion',
    initialCurrentHp: evalRes.currentHp,
    customName: `${tUnitOrErr.name}·幻象`,
  });
  ctx.targetHex = anchor;
  ctx.summonedUnitIds.push(clone.id);
  ctx.affectedUnitIds.push(clone.id);
  const woundedSuffix =
    clone.currentHp < cDef.baseStats.maxHp
      ? `（首名残血 ${clone.currentHp}/${cDef.baseStats.maxHp} HP）`
      : '';
  ctx.noteText = `幻象 ×${clone.count}!`;
  state.actionLog.push(
    `✦ ${unit.name} 施放「${spell.name}」，幻化出 ${clone.name} ×${clone.count}${woundedSuffix}（共 ${evalRes.illusionHpPool} HP）投入战阵！`,
  );
  return null;
}

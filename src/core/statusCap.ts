/**
 * 单位 Buff / Debuff 状态槽位统一上限控制器（单单位最多同时承载 20 个状态，FIFO 自动顶替）
 *
 * 设计要点：
 * - 统一核算单位身上全部独立 Buff/Debuff 槽位：
 *   1. `unit.statusEffects` 中每个激活的状态旗标（每项按唯一 statusKey 占 1 槽，五系御界每个派系可独立占位或合并）
 *   2. `unit.modifiers` 中按 `sourceName` 归组的临时属性修饰器（同源多属性法术如「祈祷」仅占 1 槽）
 * - 当总槽位数 > 20（MAX_UNIT_BUFF_SLOTS）时，按 `appliedOrder` 从小到大 FIFO 精准挤出最早施加的临时状态，
 *   同步清理对应的 `statusEffects` 旗标或 `unit.modifiers` 与临时赋予特技，绝不遗留幽灵数值！
 */

import type { BattleState, BattleUnit, StatModifier, UnitStatusEffects } from './types';

export const MAX_UNIT_BUFF_SLOTS = 20;

export interface ActiveStatusSlotRecord {
  key: string;
  kind: 'status_flag' | 'modifier_group';
  label: string;
  order: number;
  evictable: boolean;
}

/** 推进全局单调状态序号（用于精确 FIFO 排序） */
export function allocateStatusOrder(state: BattleState): number {
  const next = (state.nextStatusOrder ?? 0) + 1;
  state.nextStatusOrder = next;
  return next;
}

/** 标记 statusEffects 中某项状态的施加序号（刷新已存在状态时保留或更新序号） */
export function markStatusEffectOrder(
  unit: BattleUnit,
  state: BattleState,
  flagKey: string,
): void {
  if (!unit.statusEffects.entryOrder) {
    unit.statusEffects.entryOrder = {};
  }
  unit.statusEffects.entryOrder[flagKey] = allocateStatusOrder(state);
}

/** 枚举 statusEffects 上全部当前激活的独立状态槽位 */
const STATUS_FLAG_DETECTORS: Array<{
  key: string;
  label: string;
  isActive: (se: UnitStatusEffects) => boolean;
  clear: (unit: BattleUnit) => void;
}> = [
  {
    key: 'stunnedRounds',
    label: '符箓定身',
    isActive: (se) => se.stunnedRounds > 0,
    clear: (u) => { u.statusEffects.stunnedRounds = 0; },
  },
  {
    key: 'terrifiedRounds',
    label: '噩梦震慑',
    isActive: (se) => se.terrifiedRounds > 0,
    clear: (u) => { u.statusEffects.terrifiedRounds = 0; },
  },
  {
    key: 'frozenRounds',
    label: '寒霜冻结',
    isActive: (se) => Boolean(se.frozenRounds && se.frozenRounds > 0),
    clear: (u) => { u.statusEffects.frozenRounds = 0; },
  },
  {
    key: 'agedRounds',
    label: '衰老凋零',
    isActive: (se) => Boolean(se.agedRounds && se.agedRounds > 0),
    clear: (u) => {
      u.statusEffects.agedRounds = 0;
      u.modifiers = u.modifiers.filter((m) => m.spellId !== 'ability:aging');
    },
  },
  {
    key: 'blindRounds',
    label: '宵暗蔽目',
    isActive: (se) => Boolean(se.blindRounds && se.blindRounds > 0),
    clear: (u) => { u.statusEffects.blindRounds = 0; },
  },
  {
    key: 'confusionRounds',
    label: '迷乱魔雾',
    isActive: (se) => Boolean(se.confusionRounds && se.confusionRounds > 0),
    clear: (u) => { u.statusEffects.confusionRounds = 0; },
  },
  {
    key: 'songOfPeaceRounds',
    label: '镇魂神乐',
    isActive: (se) => Boolean(se.songOfPeaceRounds && se.songOfPeaceRounds > 0),
    clear: (u) => { u.statusEffects.songOfPeaceRounds = 0; },
  },
  {
    key: 'cowardiceRounds',
    label: '畏惧之瞳',
    isActive: (se) => Boolean(se.cowardiceRounds && se.cowardiceRounds > 0),
    clear: (u) => { u.statusEffects.cowardiceRounds = 0; },
  },
  {
    key: 'berserkRounds',
    label: '月狂赤瞳',
    isActive: (se) => Boolean(se.berserkRounds && se.berserkRounds > 0),
    clear: (u) => { u.statusEffects.berserkRounds = 0; },
  },
  {
    key: 'hypnotizedRounds',
    label: '迷梦傀儡',
    isActive: (se) => Boolean(se.hypnotizedRounds && se.hypnotizedRounds > 0),
    clear: (u) => {
      if (u.statusEffects.hypnotizedOriginalSide) {
        u.side = u.statusEffects.hypnotizedOriginalSide;
        u.statusEffects.hypnotizedOriginalSide = undefined;
      }
      u.statusEffects.hypnotizedRounds = 0;
    },
  },
  {
    key: 'poisonPower',
    label: '铃兰剧毒',
    isActive: (se) => Boolean(se.poisonPower && se.poisonPower > 0),
    clear: (u) => { u.statusEffects.poisonPower = 0; },
  },
  {
    key: 'plaguePower',
    label: '黄泉瘴疫',
    isActive: (se) => Boolean(se.plaguePower && se.plaguePower > 0),
    clear: (u) => { u.statusEffects.plaguePower = 0; },
  },
  {
    key: 'regenPerRound',
    label: '生生不息',
    isActive: (se) => Boolean(se.regenPerRound && se.regenPerRound > 0),
    clear: (u) => { u.statusEffects.regenPerRound = 0; },
  },
  {
    key: 'tempShieldHp',
    label: '二重结界',
    isActive: (se) => Boolean(se.tempShieldHp && se.tempShieldHp > 0),
    clear: (u) => { u.statusEffects.tempShieldHp = 0; },
  },
  {
    key: 'bloodSacrificeShieldHp',
    label: '战争血祭',
    isActive: (se) => Boolean(se.bloodSacrificeShieldHp && se.bloodSacrificeShieldHp > 0),
    clear: (u) => {
      u.statusEffects.bloodSacrificeShieldHp = 0;
      u.statusEffects.bloodSacrificeShieldRounds = 0;
    },
  },
  {
    key: 'guardianAngelLives',
    label: '御神护命',
    isActive: (se) => Boolean(se.guardianAngelLives && se.guardianAngelLives > 0),
    clear: (u) => { u.statusEffects.guardianAngelLives = 0; },
  },
  {
    key: 'sanctuary',
    label: '常世净域',
    isActive: (se) => Boolean(se.sanctuary),
    clear: (u) => { u.statusEffects.sanctuary = false; },
  },
  {
    key: 'martyrProtectedByUnitId',
    label: '替身雏偶',
    isActive: (se) => Boolean(se.martyrProtectedByUnitId),
    clear: (u) => { u.statusEffects.martyrProtectedByUnitId = undefined; },
  },
  {
    key: 'bless',
    label: '神祝满盈',
    isActive: (se) => Boolean(se.bless),
    clear: (u) => { u.statusEffects.bless = false; },
  },
  {
    key: 'curse',
    label: '厄祟缠身',
    isActive: (se) => Boolean(se.curse),
    clear: (u) => { u.statusEffects.curse = false; },
  },
  {
    key: 'retribution',
    label: '因果报应',
    isActive: (se) => Boolean(se.retribution),
    clear: (u) => { u.statusEffects.retribution = false; },
  },
  {
    key: 'painMirror',
    label: '因果水镜',
    isActive: (se) => Boolean(se.painMirror),
    clear: (u) => { u.statusEffects.painMirror = false; },
  },
  {
    key: 'magicMirror',
    label: '贤者折光',
    isActive: (se) => Boolean(se.magicMirror),
    clear: (u) => { u.statusEffects.magicMirror = false; },
  },
  {
    key: 'vampiricTouch',
    label: '绯红吸血',
    isActive: (se) => Boolean(se.vampiricTouch),
    clear: (u) => { u.statusEffects.vampiricTouch = false; },
  },
  {
    key: 'fireAura',
    label: '不死炎缠',
    isActive: (se) => Boolean(se.fireAura),
    clear: (u) => { u.statusEffects.fireAura = false; },
  },
  {
    key: 'auraOfFear',
    label: '幽冥威慑',
    isActive: (se) => Boolean(se.auraOfFear),
    clear: (u) => { u.statusEffects.auraOfFear = false; },
  },
  {
    key: 'slayer',
    label: '屠龙魔刃',
    isActive: (se) => Boolean(se.slayer),
    clear: (u) => { u.statusEffects.slayer = false; },
  },
  {
    key: 'blur',
    label: '蜃气残影',
    isActive: (se) => Boolean(se.blur),
    clear: (u) => { u.statusEffects.blur = false; },
  },
  {
    key: 'precisionRounds',
    label: '天眼狙定',
    isActive: (se) => Boolean(se.precisionRounds && se.precisionRounds > 0),
    clear: (u) => {
      u.statusEffects.precisionRounds = 0;
      if (u.statusEffects.grantedAbilities) {
        for (const ab of ['longRange', 'noObstaclePenalty'] as const) {
          if (u.statusEffects.grantedAbilities.includes(ab)) {
            u.abilities[ab] = false;
            u.statusEffects.grantedAbilities = u.statusEffects.grantedAbilities.filter((k) => k !== ab);
          }
        }
      }
    },
  },
  {
    key: 'bloodlustRounds',
    label: '鬼神狂战',
    isActive: (se) => Boolean(se.bloodlustRounds && se.bloodlustRounds > 0),
    clear: (u) => { u.statusEffects.bloodlustRounds = 0; },
  },
  {
    key: 'rabbitFormRounds',
    label: '兔符·兔化',
    isActive: (se) => Boolean(se.rabbitFormRounds && se.rabbitFormRounds > 0),
    clear: (u) => {
      u.statusEffects.rabbitFormRounds = 0;
      if (u.statusEffects.rabbitFormOriginalBlueprintId) {
        u.voxelBlueprintId = u.statusEffects.rabbitFormOriginalBlueprintId;
        u.statusEffects.rabbitFormOriginalBlueprintId = undefined;
      }
      if (u.statusEffects.rabbitFormGrantedFirstStrike) {
        u.abilities.firstStrike = false;
        u.statusEffects.rabbitFormGrantedFirstStrike = false;
        if (u.statusEffects.grantedAbilities) {
          u.statusEffects.grantedAbilities = u.statusEffects.grantedAbilities.filter((k) => k !== 'firstStrike');
        }
      }
      u.modifiers = u.modifiers.filter((m) => m.spellId !== 'order_rabbit_transform');
    },
  },
  {
    key: 'terrainWalk',
    label: '山林履平',
    isActive: (se) => Boolean(se.terrainWalk),
    clear: (u) => { u.statusEffects.terrainWalk = false; },
  },
  {
    key: 'powerDrain',
    label: '灵脉枯竭',
    isActive: (se) => Boolean(se.powerDrain || se.magicLeechCasterId),
    clear: (u) => {
      u.statusEffects.powerDrain = false;
      u.statusEffects.magicLeechCasterId = undefined;
    },
  },
  {
    key: 'spellShacklePower',
    label: '咒缚反噬',
    isActive: (se) => Boolean(se.spellShacklePower && se.spellShacklePower > 0),
    clear: (u) => { u.statusEffects.spellShacklePower = 0; },
  },
  {
    key: 'antiMagic',
    label: '绝对反魔',
    isActive: (se) => Boolean(se.antiMagic),
    clear: (u) => {
      u.statusEffects.antiMagic = false;
      if (u.statusEffects.grantedAbilities?.includes('magicImmune')) {
        u.abilities.magicImmune = false;
        u.statusEffects.grantedAbilities = u.statusEffects.grantedAbilities.filter((k) => k !== 'magicImmune');
      }
    },
  },
  {
    key: 'schoolWards',
    label: '御系大结界',
    isActive: (se) => Boolean(se.schoolWards && Object.keys(se.schoolWards).length > 0),
    clear: (u) => { u.statusEffects.schoolWards = undefined; },
  },
  {
    key: 'defenderBonus',
    label: '不动守护',
    isActive: (se) => Boolean(se.defenderBonus),
    clear: (u) => { u.statusEffects.defenderBonus = false; },
  },
];

/** 统计单位当前占用的全部独立 Buff/Debuff 槽位列表（按施加时间升序） */
export function listActiveUnitStatusSlots(unit: BattleUnit): ActiveStatusSlotRecord[] {
  const records: ActiveStatusSlotRecord[] = [];
  const se = unit.statusEffects;
  const orderMap = se.entryOrder ?? {};

  for (const det of STATUS_FLAG_DETECTORS) {
    if (det.isActive(se)) {
      records.push({
        key: det.key,
        kind: 'status_flag',
        label: det.label,
        order: orderMap[det.key] ?? 0,
        evictable: true,
      });
    }
  }

  // 按 sourceName 归组单位自身的临时属性修饰器（同源法术多条属性合计只占 1 槽）
  const modGroups = new Map<string, { order: number; evictable: boolean }>();
  for (const mod of unit.modifiers) {
    const existing = modGroups.get(mod.sourceName);
    const modOrder = mod.appliedOrder ?? 0;
    const evictable = mod.remainingRounds !== null || Boolean(mod.spellPolarity);
    if (!existing) {
      modGroups.set(mod.sourceName, { order: modOrder, evictable });
    } else {
      existing.order = Math.max(existing.order, modOrder);
      existing.evictable = existing.evictable || evictable;
    }
  }

  for (const [sourceName, info] of modGroups.entries()) {
    records.push({
      key: sourceName,
      kind: 'modifier_group',
      label: sourceName,
      order: info.order,
      evictable: info.evictable,
    });
  }

  records.sort((a, b) => a.order - b.order);
  return records;
}

/** 统计单位当前 Buff/Debuff 槽位总数 */
export function countActiveUnitStatusSlots(unit: BattleUnit): number {
  return listActiveUnitStatusSlots(unit).length;
}

/**
 * 写入或刷新单位属性修饰器（同名同属性自动覆盖刷新，不重复占位），并自动记录 FIFO 序号。
 */
export function upsertUnitModifier(
  unit: BattleUnit,
  state: BattleState,
  mod: StatModifier,
): void {
  const order = mod.appliedOrder ?? allocateStatusOrder(state);
  const enriched: StatModifier = { ...mod, appliedOrder: order };
  // 同来源同属性直接覆盖刷新，保留 1 槽位
  const idx = unit.modifiers.findIndex(
    (m) => m.sourceName === enriched.sourceName && m.stat === enriched.stat,
  );
  if (idx >= 0) {
    unit.modifiers[idx] = enriched;
  } else {
    unit.modifiers.push(enriched);
  }
}

/**
 * 强制执行「单单位最多 20 个 Buff/Debuff」FIFO 顶替规则！
 * 若当前槽位总数 > 20，自动按最早施加顺序挤出超出部分的可驱散/临时状态，并返回被挤出的状态名列表。
 */
export function enforceUnitStatusSlotCap(
  unit: BattleUnit,
  maxSlots = MAX_UNIT_BUFF_SLOTS,
): string[] {
  const evicted: string[] = [];
  let guard = 0;

  while (guard < 40) {
    guard += 1;
    const active = listActiveUnitStatusSlots(unit);
    if (active.length <= maxSlots) break;

    const candidate = active.find((r) => r.evictable) ?? active[0];
    if (!candidate) break;

    if (candidate.kind === 'modifier_group') {
      unit.modifiers = unit.modifiers.filter((m) => m.sourceName !== candidate.key);
    } else {
      const det = STATUS_FLAG_DETECTORS.find((d) => d.key === candidate.key);
      det?.clear(unit);
      if (unit.statusEffects.entryOrder) {
        delete unit.statusEffects.entryOrder[candidate.key];
      }
    }
    evicted.push(candidate.label);
  }

  return evicted;
}

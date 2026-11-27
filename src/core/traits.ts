/**
 * 事件驱动英雄固有特质钩子系统（Hero Trait Hooks）
 * 绝不在战斗主循环中写死具体角色判断，而是通过声明式钩子无缝介入 H4 结算管线。
 */

import type { BattleState, BattleUnit, StatModifier } from './types';

export interface AttackHookContext {
  state: BattleState;
  attacker: BattleUnit;
  defender: BattleUnit;
  isRanged: boolean;
  /** 伤害倍率累乘器 */
  damageMultiplier: number;
  /** 护甲穿透比例（0~1，例如 0.35 表示无视 35% 防御） */
  defensePenetration: number;
  /** 附加说明文本（用于战斗日志与攻击预估提示） */
  notes: string[];
}

export interface SpellPowerHookContext {
  state: BattleState;
  caster: BattleUnit;
  isSpellCard: boolean;
  damageMultiplier: number;
  notes: string[];
}

export interface KillHookContext {
  state: BattleState;
  killer: BattleUnit;
  victim: BattleUnit;
  kills: number;
}

export interface HeroTraitDef {
  id: string;
  name: string;
  description: string;
  /** 是否在战场/大地图中无视普通地形移动惩罚 */
  ignoreTerrainPenalty?: boolean;
  /** 提供的静态常驻属性修饰器 */
  getPassiveModifiers?: (unit: BattleUnit, state: BattleState) => StatModifier[];
  /** 发动攻击前触发（可修改伤害倍率、防御穿透等） */
  onBeforeAttack?: (ctx: AttackHookContext) => void;
  /** 施放法术或专属符卡前触发（可强化爆发倍率） */
  onBeforeCast?: (ctx: SpellPowerHookContext) => void;
  /** 造成击杀或击倒后触发（如魔理沙获取额外 P 点与灵力） */
  onAfterKill?: (ctx: KillHookContext) => void;
}

/**
 * 英雄特质注册表（数据驱动扩展）
 */
export const HERO_TRAIT_REGISTRY: Record<string, HeroTraitDef> = {
  reimu_floating_maiden: {
    id: 'reimu_floating_maiden',
    name: '乐园的巫女',
    description:
      '天生漂浮无视地形减速；固有 +28% 擦弹率；攻击无视目标 35% 防御，且对暗系、不死、死亡系与混沌系敌军伤害 +25%。',
    ignoreTerrainPenalty: true,
    getPassiveModifiers: () => [
      {
        id: 'trait:reimu:graze',
        stat: 'grazeChance',
        mode: 'flat',
        value: 0.28,
        sourceName: '特质·乐园的巫女',
        remainingRounds: null,
      },
    ],
    onBeforeAttack: (ctx) => {
      ctx.defensePenetration = Math.max(ctx.defensePenetration, 0.35);
      ctx.notes.push('破邪穿甲(无视35%防御)');
      if (
        ctx.defender.abilities.darkNature ||
        ctx.defender.abilities.undead ||
        ctx.defender.alignment === 'chaos' ||
        ctx.defender.alignment === 'death'
      ) {
        ctx.damageMultiplier *= 1.25;
        ctx.notes.push('退治破邪(+25%)');
      }
    },
  },

  marisa_firepower_doctrine: {
    id: 'marisa_firepower_doctrine',
    name: '火力主义',
    description:
      'P 点上限提升至 5.0；每 1.0 点 P 点提升法术与符卡威力 +12%、远程攻击 +6%；每次造成击杀额外回复 +0.6 P 点与 +3 灵力。',
    getPassiveModifiers: (unit) => {
      const p = unit.powerPoints ?? 0;
      const bonusSpell = Math.floor(p * 1.5);
      if (bonusSpell <= 0) return [];
      return [
        {
          id: 'trait:marisa:p_spell',
          stat: 'spellPower',
          mode: 'flat',
          value: bonusSpell,
          sourceName: `特质·火力主义 (${p.toFixed(1)}P)`,
          remainingRounds: null,
        },
      ];
    },
    onBeforeAttack: (ctx) => {
      const p = ctx.attacker.powerPoints ?? 0;
      if (ctx.isRanged && p > 0) {
        const mult = 1 + p * 0.06;
        ctx.damageMultiplier *= mult;
        ctx.notes.push(`星火增幅(+${Math.round(p * 6)}%)`);
      }
    },
    onBeforeCast: (ctx) => {
      const p = ctx.caster.powerPoints ?? 0;
      if (p > 0) {
        const mult = 1 + p * 0.12;
        ctx.damageMultiplier *= mult;
        ctx.notes.push(`满P火力(+${Math.round(p * 12)}%)`);
      }
    },
    onAfterKill: (ctx) => {
      if (ctx.kills <= 0 || ctx.killer.kind !== 'hero') return;
      const maxP = ctx.killer.maxPowerPoints ?? 5;
      ctx.killer.powerPoints = Math.min(maxP, Number(((ctx.killer.powerPoints ?? 0) + 0.6).toFixed(2)));
      ctx.killer.mana = Math.min(ctx.killer.baseStats.maxMana, (ctx.killer.mana ?? 0) + 3);
      ctx.killer.spellCardCharge = Math.min(100, (ctx.killer.spellCardCharge ?? 0) + 4);
    },
  },

  eirin_lunar_brain: {
    id: 'eirin_lunar_brain',
    name: '月之头脑',
    description:
      '固有法强 +3、魔法抗性 +15%；远程射击无视目标 20% 防御，并对身陷负面状态的敌军额外造成 +20% 远程伤害；施放秩序系与生命系法术时威力 +15%。',
    getPassiveModifiers: () => [
      {
        id: 'trait:eirin:spell_power',
        stat: 'spellPower',
        mode: 'flat',
        value: 3,
        sourceName: '特质·月之头脑',
        remainingRounds: null,
      },
      {
        id: 'trait:eirin:magic_res',
        stat: 'magicResistance',
        mode: 'flat',
        value: 0.15,
        sourceName: '特质·月之头脑',
        remainingRounds: null,
      },
    ],
    onBeforeAttack: (ctx) => {
      if (!ctx.isRanged) return;
      ctx.defensePenetration = Math.max(ctx.defensePenetration, 0.2);
      ctx.notes.push('天弓破甲(无视20%防御)');
      const se = ctx.defender.statusEffects;
      const hasDebuffMod = ctx.defender.modifiers.some((m) => m.spellPolarity === 'negative');
      const hasControlDebuff = Boolean(
        hasDebuffMod ||
          se.stunnedRounds > 0 ||
          se.terrifiedRounds > 0 ||
          (se.blindRounds ?? 0) > 0 ||
          (se.confusionRounds ?? 0) > 0 ||
          (se.songOfPeaceRounds ?? 0) > 0 ||
          (se.cowardiceRounds ?? 0) > 0 ||
          (se.berserkRounds ?? 0) > 0 ||
          (se.poisonPower ?? 0) > 0 ||
          (se.plaguePower ?? 0) > 0 ||
          se.curse ||
          se.powerDrain,
      );
      if (hasControlDebuff) {
        ctx.damageMultiplier *= 1.2;
        ctx.notes.push('秘药弱点追击(+20%)');
      }
    },
    onBeforeCast: (ctx) => {
      ctx.damageMultiplier *= 1.15;
      ctx.notes.push('月都秘术增幅(+15%)');
    },
  },

  remilia_scarlet_destiny: {
    id: 'remilia_scarlet_destiny',
    name: '操纵命运',
    description:
      '天生幸运 +2、擦弹率 +10%；神枪穿甲无视目标 20% 防御，对身负诅咒/剧毒/衰老等负面状态的敌军伤害 +20%；施放死亡系与混沌系法术威力 +12%。',
    getPassiveModifiers: () => [
      {
        id: 'trait:remilia:luck',
        stat: 'luck',
        mode: 'flat',
        value: 2,
        sourceName: '特质·操纵命运',
        remainingRounds: null,
      },
      {
        id: 'trait:remilia:graze',
        stat: 'grazeChance',
        mode: 'flat',
        value: 0.1,
        sourceName: '特质·操纵命运',
        remainingRounds: null,
      },
    ],
    onBeforeAttack: (ctx) => {
      ctx.defensePenetration = Math.max(ctx.defensePenetration, 0.2);
      ctx.notes.push('神枪穿甲(无视20%防御)');
      const se = ctx.defender.statusEffects;
      const hasNegMod = ctx.defender.modifiers.some((m) => m.spellPolarity === 'negative');
      const hasCurseOrDot = Boolean(
        hasNegMod ||
          se.curse ||
          (se.poisonPower ?? 0) > 0 ||
          (se.plaguePower ?? 0) > 0 ||
          (se.agedRounds ?? 0) > 0 ||
          (se.frozenRounds ?? 0) > 0,
      );
      if (hasCurseOrDot) {
        ctx.damageMultiplier *= 1.2;
        ctx.notes.push('红月命运裁决(+20%)');
      }
    },
    onBeforeCast: (ctx) => {
      ctx.damageMultiplier *= 1.12;
      ctx.notes.push('红魔冥律增幅(+12%)');
    },
  },
};

/**
 * 判断单位是否通过任意特质无视普通地形减速
 */
export function hasIgnoreTerrainPenaltyTrait(unit: BattleUnit): boolean {
  return unit.innateTraitIds.some((id) => Boolean(HERO_TRAIT_REGISTRY[id]?.ignoreTerrainPenalty));
}

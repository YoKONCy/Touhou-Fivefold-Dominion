/**
 * 原版 HoMM4 五大生物类型对齐（默认活体 / 机械 / 不死 / 元素 / 幻象）
 * + 东方原创「暗系 (Dark Nature)」特技判定单一事实来源
 */

import type { BattleUnit, SpellDef } from './types';

export type CreatureTypeKind = 'living' | 'mechanical' | 'undead' | 'elemental' | 'illusion';

const MIND_SPECIAL_EFFECTS = new Set([
  'blind',
  'hypnotize',
  'berserk',
  'confusion',
  'cloud_of_confusion',
  'cowardice',
  'song_of_peace',
  'forgetfulness',
]);

const MIND_SPELL_IDS = new Set([
  'death_sorrow',
  'death_mass_sorrow',
  'chaos_bloodlust',
  'chaos_bloodfrenzy',
  'order_precision',
  'order_mass_precision',
]);

/** 判断法术是否属于心智魔法（对机械 / 不死 / 幻象无效） */
export function isMindSpellDef(spell: Pick<SpellDef, 'id' | 'specialEffect'>): boolean {
  return Boolean(
    (spell.specialEffect && MIND_SPECIAL_EFFECTS.has(spell.specialEffect)) ||
      MIND_SPELL_IDS.has(spell.id),
  );
}

/** 机械 / 器灵构造体 */
export function isMechanicalUnit(unit: Pick<BattleUnit, 'abilities'>): boolean {
  return Boolean(unit.abilities.mechanical);
}

/** 不死 / 亡灵生物 */
export function isUndeadUnit(unit: Pick<BattleUnit, 'abilities'>): boolean {
  return Boolean(unit.abilities.undead);
}

/** 元素 / 纯灵生物 */
export function isElementalUnit(unit: Pick<BattleUnit, 'abilities'>): boolean {
  return Boolean(unit.abilities.elemental);
}

/** 幻象分身（由虚幻之镜/幻影召唤产生） */
export function isIllusionUnit(unit: Pick<BattleUnit, 'isIllusion'>): boolean {
  return Boolean(unit.isIllusion);
}

/** 是否属于四大特殊非活体类型之一（机械 / 不死 / 元素 / 幻象） */
export function isSpecialNonLivingUnit(unit: Pick<BattleUnit, 'abilities' | 'isIllusion'>): boolean {
  return (
    isMechanicalUnit(unit) ||
    isUndeadUnit(unit) ||
    isElementalUnit(unit) ||
    isIllusionUnit(unit)
  );
}

/** 是否为默认活体生物（非机械、非不死、非元素、非幻象） */
export function isLivingUnit(unit: Pick<BattleUnit, 'abilities' | 'isIllusion'>): boolean {
  return !isSpecialNonLivingUnit(unit);
}

/** 获取单位的主生物类型（默认活体无需打标签） */
export function getCreatureTypeKind(unit: Pick<BattleUnit, 'abilities' | 'isIllusion'>): CreatureTypeKind {
  if (isIllusionUnit(unit)) return 'illusion';
  if (isMechanicalUnit(unit)) return 'mechanical';
  if (isUndeadUnit(unit)) return 'undead';
  if (isElementalUnit(unit)) return 'elemental';
  return 'living';
}

/**
 * 是否免疫士气波动（严格遵循原版 HoMM4：机械与不死免疫正负士气，元素仍受士气感召）
 */
export function isImmuneToMorale(unit: Pick<BattleUnit, 'abilities'>): boolean {
  return isMechanicalUnit(unit) || isUndeadUnit(unit);
}

/**
 * 是否免疫心智魔法（机械、不死、幻象免疫催眠/狂暴/迷惑/悲歌/怯懦/遗忘/和平等心智法术）
 */
export function isImmuneToMindSpells(unit: Pick<BattleUnit, 'abilities' | 'isIllusion'>): boolean {
  return isMechanicalUnit(unit) || isUndeadUnit(unit) || isIllusionUnit(unit);
}

/**
 * 是否免疫生命系常规活体治愈、复活、再生与吸血回血（四大非活体均不可被活体治愈）
 */
export function isImmuneToLivingHeal(unit: Pick<BattleUnit, 'abilities' | 'isIllusion'>): boolean {
  return isSpecialNonLivingUnit(unit);
}

/**
 * 是否免疫活体生理限定效果（剧毒、瘟疫、死亡之手、被吸血、蜂群、石化/恐惧/定身/震慑）
 */
export function isImmuneToLivingEffects(unit: Pick<BattleUnit, 'abilities' | 'isIllusion'>): boolean {
  return isSpecialNonLivingUnit(unit);
}

/** 暗系进攻增伤倍率：对非暗系且非四大非活体的普通活体单位额外造成 +15% 伤害 */
export const DARK_VS_LIVING_DAMAGE_MULT = 1.15;

/** 暗系魔法易伤倍率：暗系单位承受所有魔法直接伤害时额外受到 +10% 伤害 */
export const DARK_MAGIC_VULNERABILITY_MULT = 1.1;

/**
 * 判断攻击者是否对目标触发「暗系蚀生 (+15%)」增伤：
 * 攻击者为暗系，且目标既非暗系、亦非四大特殊类型（机械/不死/元素/幻象），即纯普通活体单位。
 */
export function isDarkBonusTarget(
  attacker: Pick<BattleUnit, 'abilities'>,
  defender: Pick<BattleUnit, 'abilities' | 'isIllusion'>,
): boolean {
  return Boolean(attacker.abilities.darkNature && !defender.abilities.darkNature && isLivingUnit(defender));
}

/** 判断目标是否因「暗系」特质承受额外 10% 魔法伤害 */
export function isDarkMagicVulnerable(target: Pick<BattleUnit, 'abilities'>): boolean {
  return Boolean(target.abilities.darkNature);
}

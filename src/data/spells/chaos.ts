/**
 * 混沌派系法术数据表（27 术：全 27 战斗）
 * 主题：魔法之森星炮 · 七曜魔导 · 地底核焰 · 绯想天雷
 */

import type { SpellDef } from '@core/types';

export const CHAOS_H4_SPELLS: Record<string, SpellDef> = {
  chaos_bloodlust: {
    id: 'chaos_bloodlust', name: '鬼神狂战', spellCardPrefix: '鬼符', enName: 'Bloodlust',
    alignment: 'chaos', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    buffDuration: 6,
    vfxKey: 'marisa_bolt', specialEffect: 'bloodlust',
    description: '混沌 1 级：激荡鬼族般狂烈斗志，令一名具备近战能力的友军近战伤害提升 +25%（不加成远程射击）。',
  },
  chaos_fire_aura: {
    id: 'chaos_fire_aura', name: '不死炎缠', spellCardPrefix: '炎符', enName: 'Fire Aura',
    alignment: 'chaos', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    vfxKey: 'star_burst', specialEffect: 'fire_aura',
    description: '混沌 1 级：为友军兵器缠绕炽烈不死火，近战攻击额外附带 +25% 火焰灼烧伤害！',
  },
  chaos_haste: {
    id: 'chaos_haste', name: '星风疾行', spellCardPrefix: '星风', enName: 'Haste',
    alignment: 'chaos', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    buffDuration: 5,
    buffModifiers: [
      { stat: 'speed', mode: 'flat', value: 3, sourceName: '星风·星风疾行', spellPolarity: 'positive' },
      { stat: 'initiative', mode: 'flat', value: 3, sourceName: '星风·星风疾行', spellPolarity: 'positive' },
    ],
    vfxKey: 'marisa_bolt', specialEffect: 'standard',
    description: '混沌 1 级：御乘魔导星风疾驰，令一名友军移动力 +3、行动主动性 +3！',
  },
  chaos_magic_arrow: {
    id: 'chaos_magic_arrow', name: '魔导星矢', spellCardPrefix: '星符', enName: 'Magic Arrow',
    alignment: 'chaos', level: 1, manaCost: 2, targetType: 'enemy_unit', range: 15,
    damageBase: 20, vfxKey: 'marisa_bolt', specialEffect: 'standard',
    description: '混沌 1 级：凝结纯粹星光魔力飞矢，直击视线内一名敌军。',
  },
  chaos_slayer: {
    id: 'chaos_slayer', name: '屠龙魔刃', spellCardPrefix: '斩符', enName: 'Slayer',
    alignment: 'chaos', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    vfxKey: 'marisa_bolt', specialEffect: 'slayer',
    description: '混沌 1 级：赋予友军斩破巨妖的魔刃之力，对所有 4 阶终极巨兽/龙类伤害额外 +50%！',
  },
  chaos_sparks: {
    id: 'chaos_sparks', name: '星尘迸裂', spellCardPrefix: '恋符', enName: 'Sparks',
    alignment: 'chaos', level: 1, manaCost: 2, targetType: 'self', range: 0, ignoreLos: true,
    damageBase: 18, isFireSpell: true, vfxKey: 'star_burst', specialEffect: 'sparks',
    description: '混沌 1 级火系：向施法者周身 2 格内的所有敌军迸射炽热星尘火花弹幕！',
  },
  chaos_confusion: {
    id: 'chaos_confusion', name: '迷乱魔雾', spellCardPrefix: '迷符', enName: 'Confusion',
    alignment: 'chaos', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    vfxKey: 'death_curse', specialEffect: 'confusion',
    description: '混沌 2 级：以魔法之森的迷幻瘴雾扰乱一名非心智免疫敌军心智，使其丧失下一次行动回合！',
  },
  chaos_fire_bolt: {
    id: 'chaos_fire_bolt', name: '七曜火矢', spellCardPrefix: '火符', enName: 'Fire Bolt',
    alignment: 'chaos', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    damageBase: 32, isFireSpell: true, vfxKey: 'marisa_bolt', specialEffect: 'standard',
    description: '混沌 2 级火系：凝聚七曜火之魔导轰出烈焰飞矢灼烧单个敌军（火抗减半）。',
  },
  chaos_first_strike: {
    id: 'chaos_first_strike', name: '瞬闪先手', spellCardPrefix: '闪符', enName: 'First Strike',
    alignment: 'chaos', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    vfxKey: 'marisa_bolt', specialEffect: 'first_strike',
    description: '混沌 2 级：赋予一名友军电光火石般的「先攻压制」特技直至战斗结束。',
  },
  chaos_mana_flare: {
    id: 'chaos_mana_flare', name: '灵脉沸腾', spellCardPrefix: '脉符', enName: 'Mana Flare',
    alignment: 'chaos', level: 2, manaCost: 3, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'mana_burst', specialEffect: 'mana_flare',
    description: '混沌 2 级全域：激荡全场地下灵脉，令敌我全体施法者的全部法术灵力消耗永久 -2（最低 1 点）！',
  },
  chaos_misfortune: {
    id: 'chaos_misfortune', name: '厄运流转', spellCardPrefix: '厄符', enName: 'Misfortune',
    alignment: 'chaos', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    debuffDuration: 5,
    debuffModifiers: [{ stat: 'luck', mode: 'flat', value: -10, sourceName: '厄符·厄运流转', spellPolarity: 'negative' }],
    vfxKey: 'death_curse', specialEffect: 'standard',
    description: '混沌 2 级：将积蓄的厄运倾泻向一名敌军（幸运 -10），使其攻击大概率触发 0.5× 霉运衰减！',
  },
  chaos_spell_shackle: {
    id: 'chaos_spell_shackle', name: '咒缚反噬', spellCardPrefix: '缚符', enName: 'Spell Shackle',
    alignment: 'chaos', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    damageBase: 8, vfxKey: 'death_curse', specialEffect: 'spell_shackle',
    description: '混沌 2 级：对敌方施法者结下咒缚枷锁，其此后每消耗灵力施法都将承受剧烈反噬！',
  },
  chaos_bloodfrenzy: {
    id: 'chaos_bloodfrenzy', name: '百鬼狂潮', spellCardPrefix: '鬼宴', enName: 'Bloodfrenzy',
    alignment: 'chaos', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    massScope: 'all_allies', buffDuration: 6,
    vfxKey: 'marisa_bolt', specialEffect: 'mass_bloodlust',
    description: '混沌 3 级（全军）：点燃全军鬼神豪情，令所有非魔免且具备近战能力的友军近战伤害统一提升 +25%！',
  },
  chaos_fire_ring: {
    id: 'chaos_fire_ring', name: '业火红环', spellCardPrefix: '业火', enName: 'Fire Ring',
    alignment: 'chaos', level: 3, manaCost: 5, targetType: 'hex_aoe', range: 17, aoeRadius: 1,
    damageBase: 30, isFireSpell: true, vfxKey: 'star_burst', specialEffect: 'fire_ring',
    description: '混沌 3 级火系：在目标格周围一圈引爆炽红业火环，焚烧环上敌军而不伤及中心格！',
  },
  chaos_fireball: {
    id: 'chaos_fireball', name: '炽炎星爆', spellCardPrefix: '爆符', enName: 'Fireball',
    alignment: 'chaos', level: 3, manaCost: 5, targetType: 'hex_aoe', range: 17, aoeRadius: 1,
    damageBase: 28, isFireSpell: true, vfxKey: 'star_burst', specialEffect: 'standard',
    description: '混沌 3 级火系：轰出烈焰魔球于目标六边形炸裂，爆破半径 1 格内所有敌军（火抗减半）。',
  },
  chaos_lightning: {
    id: 'chaos_lightning', name: '绯想落雷', spellCardPrefix: '雷符', enName: 'Lightning',
    alignment: 'chaos', level: 3, manaCost: 5, targetType: 'enemy_unit', range: 21,
    damageBase: 45, isLightningSpell: true, vfxKey: 'marisa_bolt', specialEffect: 'standard',
    description: '混沌 3 级：自绯想天穹引落狂暴紫电劈斩视线内单个敌军，造成极高瞬间爆发！',
  },
  chaos_magic_mirror: {
    id: 'chaos_magic_mirror', name: '贤者折光', spellCardPrefix: '镜符', enName: 'Magic Mirror',
    alignment: 'chaos', level: 3, manaCost: 5, targetType: 'ally_unit', range: 17,
    vfxKey: 'order_slow', specialEffect: 'magic_mirror',
    description: '混沌 3 级：展开大贤者折光魔镜，敌方单体法术命中时将以 50% 威力反向弹回施法者！',
  },
  chaos_mass_slayer: {
    id: 'chaos_mass_slayer', name: '众刃屠龙', spellCardPrefix: '屠龙', enName: 'Mass Slayer',
    alignment: 'chaos', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'marisa_bolt', specialEffect: 'mass_slayer',
    description: '混沌 3 级（全军）：为全军赋予斩龙魔刃，所有非魔免友军对 4 阶巨兽伤害 +50%！',
  },
  chaos_cat_reflexes: {
    id: 'chaos_cat_reflexes', name: '火猫连击', spellCardPrefix: '猫符', enName: 'Cat Reflexes',
    alignment: 'chaos', level: 4, manaCost: 8, targetType: 'ally_unit', range: 18,
    vfxKey: 'marisa_bolt', specialEffect: 'cat_reflexes',
    description: '混沌 4 级王牌神技：赋予友军妖猫般灵巧的「双重攻击」特技，每次进攻连打两段。',
  },
  chaos_cloud_of_confusion: {
    id: 'chaos_cloud_of_confusion', name: '浓雾迷心', spellCardPrefix: '迷云', enName: 'Cloud of Confusion',
    alignment: 'chaos', level: 4, manaCost: 8, targetType: 'hex_aoe', range: 18, aoeRadius: 1,
    vfxKey: 'death_curse', specialEffect: 'cloud_of_confusion',
    description: '混沌 4 级群体控场：在目标周围 1 格掀起迷幻毒云，令范围内所有非心智免疫敌军丧失下一次行动！',
  },
  chaos_implosion: {
    id: 'chaos_implosion', name: '黑洞坍缩', spellCardPrefix: '星崩', enName: 'Implosion',
    alignment: 'chaos', level: 4, manaCost: 8, targetType: 'enemy_unit', range: 21,
    damageBase: 68, vfxKey: 'star_burst', specialEffect: 'standard',
    description: '混沌 4 级重炮：在目标周身引爆微型引力坍缩，对单个敌军造成恐怖单体法术破坏！',
  },
  chaos_inferno: {
    id: 'chaos_inferno', name: '焦热地狱', spellCardPrefix: '地狱', enName: 'Inferno',
    alignment: 'chaos', level: 4, manaCost: 8, targetType: 'hex_aoe', range: 18, aoeRadius: 2,
    damageBase: 38, isFireSpell: true, vfxKey: 'star_burst', specialEffect: 'standard',
    description: '混沌 4 级大范围火系：召出旧地狱炽核业火，焚尽半径 2 格辽阔区域内的全部敌军！',
  },
  chaos_mass_first_strike: {
    id: 'chaos_mass_first_strike', name: '星闪先制', spellCardPrefix: '极闪', enName: 'Mass First Strike',
    alignment: 'chaos', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'marisa_bolt', specialEffect: 'mass_first_strike',
    description: '混沌 4 级全军：星光闪耀全阵，赐予全队非魔免且具备近战能力的友军「先攻压制」特技。',
  },
  chaos_mass_misfortune: {
    id: 'chaos_mass_misfortune', name: '厄神灾厄', spellCardPrefix: '灾厄', enName: 'Mass Misfortune',
    alignment: 'chaos', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    massScope: 'all_enemies', debuffDuration: 5,
    debuffModifiers: [{ stat: 'luck', mode: 'flat', value: -10, sourceName: '灾厄·厄神灾厄', spellPolarity: 'negative' }],
    vfxKey: 'death_curse', specialEffect: 'standard',
    description: '混沌 4 级（全敌）：引动厄神旋涡诅咒敌阵，全体非魔免敌军陷入最大厄运（幸运 -10）！',
  },
  chaos_armageddon: {
    id: 'chaos_armageddon', name: '星陨终末', spellCardPrefix: '终末', enName: 'Armageddon',
    alignment: 'chaos', level: 5, manaCost: 12, targetType: 'self', range: 0, ignoreLos: true,
    damageBase: 52, isFireSpell: true, vfxKey: 'star_burst', specialEffect: 'armageddon',
    description: '混沌 5 级终极禁咒：召降焚世星陨风暴席卷全场非魔免单位（敌我不分，配合黑龙全魔免经典绝技！）！',
  },
  chaos_chain_lightning: {
    id: 'chaos_chain_lightning', name: '五雷连锁', spellCardPrefix: '天雷', enName: 'Chain Lightning',
    alignment: 'chaos', level: 5, manaCost: 12, targetType: 'enemy_unit', range: 21,
    damageBase: 68, isLightningSpell: true, vfxKey: 'marisa_bolt', specialEffect: 'chain_lightning',
    description: '混沌 5 级经典神技：高压紫雷贯穿主目标后依次向周围最近单位弹跳 4 次，威力逐跳递减一半！',
  },
  chaos_disintegrate: {
    id: 'chaos_disintegrate', name: '星穹湮灭', spellCardPrefix: '湮灭', enName: 'Disintegrate',
    alignment: 'chaos', level: 5, manaCost: 12, targetType: 'enemy_unit', range: 21,
    damageBase: 85, vfxKey: 'star_burst', specialEffect: 'disintegrate',
    description: '混沌 5 级终极单体毁灭：轰出归墟湮灭光束将敌军化为虚无，被湮灭残骸无法招魂或复活！',
  },
};

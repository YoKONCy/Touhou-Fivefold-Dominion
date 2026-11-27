/**
 * 死亡派系法术数据表（25 术：24 战斗 + 1 大地图）
 * 主题：白玉楼幽冥 · 彼岸黄泉 · 绯红夜
 */

import type { SpellDef } from '@core/types';

export const DEATH_H4_SPELLS: Record<string, SpellDef> = {
  death_cancellation: {
    id: 'death_cancellation', name: '蚀灵消咒', spellCardPrefix: '蚀符', enName: 'Cancellation',
    alignment: 'death', level: 1, manaCost: 2, targetType: 'enemy_unit', range: 15,
    vfxKey: 'death_curse', specialEffect: 'cancellation',
    description: '死亡 1 级：以冥界蚀灵雾气剥除一名敌军身上的全部有益增益法术。',
  },
  death_curse: {
    id: 'death_curse', name: '厄祟缠身', spellCardPrefix: '祟符', enName: 'Curse',
    alignment: 'death', level: 1, manaCost: 2, targetType: 'enemy_unit', range: 15,
    vfxKey: 'death_curse', specialEffect: 'curse',
    description: '死亡 1 级：降下不祥厄祟诅咒，令一名敌军每次攻击恒定只能打出最小伤害！',
  },
  death_disrupting_ray: {
    id: 'death_disrupting_ray', name: '腐骨阴线', spellCardPrefix: '骨符', enName: 'Disrupting Ray',
    alignment: 'death', level: 1, manaCost: 2, targetType: 'enemy_unit', range: 15,
    debuffDuration: 6,
    debuffModifiers: [{ stat: 'defense', mode: 'percent', value: -0.2, sourceName: '骨符·腐骨阴线', spellPolarity: 'negative' }],
    vfxKey: 'death_curse', specialEffect: 'standard',
    description: '死亡 1 级：射出幽冥阴线蚀碎敌军甲胄，令其防御下滑 -20%（可多次叠加！）。',
  },
  death_poison: {
    id: 'death_poison', name: '铃兰剧毒', spellCardPrefix: '毒符', enName: 'Poison',
    alignment: 'death', level: 1, manaCost: 2, targetType: 'enemy_unit', range: 15,
    damageBase: 15, livingOnly: true, vfxKey: 'death_curse', specialEffect: 'poison',
    description: '死亡 1 级：释放无名之丘的铃兰猛毒，立即毒伤活体敌军且每回合持续流血直至治愈！',
  },
  death_raise_skeletons: {
    id: 'death_raise_skeletons', name: '招魂·尸壳', spellCardPrefix: '骨符', enName: 'Raise Skeletons',
    alignment: 'death', level: 1, manaCost: 2, targetType: 'corpse_unit', range: 18, ignoreLos: true,
    summonTemplateId: 'corpse_husk', vfxKey: 'soul_rise', specialEffect: 'raise_undead',
    description: '死亡 1 级招魂术：消耗战场残骸的剩余生命池，按法强预算唤起幽冥公馆正式兵种「尸壳」（预算不足整兵时生成残血单位）！',
  },
  death_animate_dead: {
    id: 'death_animate_dead', name: '反魂起尸', spellCardPrefix: '返魂', enName: 'Animate Dead',
    alignment: 'death', level: 2, manaCost: 3, targetType: 'corpse_unit', range: 18, ignoreLos: true,
    reviveBase: 55, vfxKey: 'soul_rise', specialEffect: 'animate_dead',
    description: '死亡 2 级：按法强预算复生战损或阵亡的友军（不足整兵时复生残血单位）；作用于敌军残骸时则按剩余残骸生命转化为己方「尸壳」。',
  },
  death_fatigue: {
    id: 'death_fatigue', name: '冥雾倦怠', spellCardPrefix: '倦符', enName: 'Fatigue',
    alignment: 'death', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    livingOnly: true, debuffDuration: 4,
    debuffModifiers: [
      { stat: 'speed', mode: 'percent', value: -0.5, sourceName: '倦符·冥雾倦怠', spellPolarity: 'negative' },
      { stat: 'initiative', mode: 'percent', value: -0.35, sourceName: '倦符·冥雾倦怠', spellPolarity: 'negative' },
    ],
    vfxKey: 'death_curse', specialEffect: 'standard',
    description: '死亡 2 级：寒冥阴雾榨干活体敌军体力，使其战斗移动速度减半（对机械与亡灵无效）。',
  },
  death_life_drain: {
    id: 'death_life_drain', name: '冥樱吸魂', spellCardPrefix: '樱符', enName: 'Life Drain',
    alignment: 'death', level: 2, manaCost: 3, targetType: 'self', range: 0, ignoreLos: true,
    damageBase: 20, vfxKey: 'death_curse', specialEffect: 'life_drain',
    description: '死亡 2 级（全敌）：飘散西行妖般的吸魂冥樱，汲取全场活体敌军生机并将半数化为自身生命！',
  },
  death_mire: {
    id: 'death_mire', name: '三途泥沼', spellCardPrefix: '途符', enName: 'Mire',
    alignment: 'death', level: 2, manaCost: 3, targetType: 'adventure', range: 0,
    isAdventureOnly: true, vfxKey: 'death_curse', specialEffect: 'adventure_only',
    description: '死亡 2 级（大地图术式）：令冒险大地图目标军团如陷三途河泥沼、下回合行军减半，战斗中不可施放。',
  },
  death_sorrow: {
    id: 'death_sorrow', name: '彼岸悲歌', spellCardPrefix: '哀符', enName: 'Sorrow',
    alignment: 'death', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    debuffDuration: 5,
    debuffModifiers: [{ stat: 'morale', mode: 'flat', value: -10, sourceName: '哀符·彼岸悲歌', spellPolarity: 'negative' }],
    vfxKey: 'death_curse', specialEffect: 'standard',
    description: '死亡 2 级：低吟彼岸幽咽悲歌，使一名活体敌军士气瞬间坠至谷底（士气 -10）。',
  },
  death_unholy_song: {
    id: 'death_unholy_song', name: '反魂幽曲', spellCardPrefix: '幽曲', enName: 'Unholy Song',
    alignment: 'death', level: 2, manaCost: 3, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'death_curse', specialEffect: 'unholy_song',
    description: '死亡 2 级（全敌）：奏响幽冥反魂曲，压制敌方全体生命系单位伤害 -20%、防御 -20%！',
  },
  death_weakness: {
    id: 'death_weakness', name: '幽冥蚀力', spellCardPrefix: '衰符', enName: 'Weakness',
    alignment: 'death', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    debuffDuration: 5,
    debuffModifiers: [
      { stat: 'minDamage', mode: 'percent', value: -0.25, sourceName: '衰符·幽冥蚀力', spellPolarity: 'negative' },
      { stat: 'maxDamage', mode: 'percent', value: -0.25, sourceName: '衰符·幽冥蚀力', spellPolarity: 'negative' },
    ],
    vfxKey: 'death_curse', specialEffect: 'standard',
    description: '死亡 2 级：幽冥死气侵蚀敌军筋骨，使其造成的全部战斗伤害降低 -25%。',
  },
  death_aura_of_fear: {
    id: 'death_aura_of_fear', name: '幽冥威慑', spellCardPrefix: '怖符', enName: 'Aura of Fear',
    alignment: 'death', level: 3, manaCost: 5, targetType: 'ally_unit', range: 17,
    vfxKey: 'death_curse', specialEffect: 'aura_of_fear',
    description: '死亡 3 级：为友军披上百鬼夜行般的幽冥威压，主动进攻非免疫敌军时使其不敢反击！',
  },
  death_magic_leech: {
    id: 'death_magic_leech', name: '噬灵魔蛭', spellCardPrefix: '噬符', enName: 'Magic Leech',
    alignment: 'death', level: 3, manaCost: 5, targetType: 'enemy_unit', range: 17,
    vfxKey: 'death_curse', specialEffect: 'magic_leech',
    description: '死亡 3 级：寄生敌方施法者灵脉，使其每次施法耗蓝翻倍并将耗费灵力全数虹吸给己方！',
  },
  death_mass_cancellation: {
    id: 'death_mass_cancellation', name: '幽冥剥法', spellCardPrefix: '绝法', enName: 'Mass Cancellation',
    alignment: 'death', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'death_curse', specialEffect: 'mass_cancellation',
    description: '死亡 3 级（全敌）：幽冥浪潮席卷敌阵，瞬间剥除全体敌军身上的全部有益增益！',
  },
  death_mass_curse: {
    id: 'death_mass_curse', name: '百鬼厄祟', spellCardPrefix: '百鬼', enName: 'Mass Curse',
    alignment: 'death', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'death_curse', specialEffect: 'mass_curse',
    description: '死亡 3 级（全敌）：百鬼厄祟齐降敌阵，令全体非魔免敌军每次攻击恒定只打出最小伤害！',
  },
  death_plague: {
    id: 'death_plague', name: '黄泉瘴疫', spellCardPrefix: '瘴符', enName: 'Plague',
    alignment: 'death', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    damageBase: 14, livingOnly: true, vfxKey: 'death_curse', specialEffect: 'plague',
    description: '死亡 3 级禁术：自黄泉比良坂散播致命瘴疫，全战场所有活体单位（不分敌我）每回合持续失血！',
  },
  death_raise_ghost: {
    id: 'death_raise_ghost', name: '招魂·怨灵', spellCardPrefix: '亡灵', enName: 'Raise Ghost',
    alignment: 'death', level: 3, manaCost: 5, targetType: 'corpse_unit', range: 18, ignoreLos: true,
    summonTemplateId: 'wraith_spirit', vfxKey: 'soul_rise', specialEffect: 'raise_undead',
    description: '死亡 3 级招魂术：消耗战场残骸的剩余生命池，按法强预算唤起幽冥公馆正式兵种「怨灵」（飞行、虚无体质、衰老触碰，允许残兵）！',
  },
  death_death_call: {
    id: 'death_death_call', name: '黄泉呼唤', spellCardPrefix: '冥唤', enName: 'Death Call',
    alignment: 'death', level: 4, manaCost: 8, targetType: 'corpse_unit', range: 21, ignoreLos: true,
    reviveBase: 95, vfxKey: 'soul_rise', specialEffect: 'death_call',
    description: '死亡 4 级：倾听黄泉深处召唤，按高额法强预算强力复生战损/阵亡友军（支持残兵），作用于敌军残骸则转化为「怨灵」！',
  },
  death_mass_sorrow: {
    id: 'death_mass_sorrow', name: '万灵悲恸', spellCardPrefix: '冥哀', enName: 'Mass Sorrow',
    alignment: 'death', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    massScope: 'all_enemies', debuffDuration: 5,
    debuffModifiers: [{ stat: 'morale', mode: 'flat', value: -10, sourceName: '冥哀·万灵悲恸', spellPolarity: 'negative' }],
    vfxKey: 'death_curse', specialEffect: 'standard',
    description: '死亡 4 级（全敌）：冥界挽歌响彻苍穹，令全体活体非魔免敌军陷入绝望（士气 -10）。',
  },
  death_mass_weakness: {
    id: 'death_mass_weakness', name: '枯荣凋零', spellCardPrefix: '枯荣', enName: 'Mass Weakness',
    alignment: 'death', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    massScope: 'all_enemies', debuffDuration: 5,
    debuffModifiers: [
      { stat: 'minDamage', mode: 'percent', value: -0.25, sourceName: '枯荣·枯荣凋零', spellPolarity: 'negative' },
      { stat: 'maxDamage', mode: 'percent', value: -0.25, sourceName: '枯荣·枯荣凋零', spellPolarity: 'negative' },
    ],
    vfxKey: 'death_curse', specialEffect: 'standard',
    description: '死亡 4 级（全敌）：令万物生机枯竭凋零，全体非魔免敌军造成的战斗伤害统一降低 -25%！',
  },
  death_vampiric_touch: {
    id: 'death_vampiric_touch', name: '绯红吸血', spellCardPrefix: '红符', enName: 'Vampiric Touch',
    alignment: 'death', level: 4, manaCost: 8, targetType: 'ally_unit', range: 18,
    vfxKey: 'death_curse', specialEffect: 'vampiric_touch',
    description: '死亡 4 级神技：赋予友军红雾夜族的嗜血之力，每次近战伤害的 50% 转化为自身治疗与兵力复苏！',
  },
  death_hand_of_death: {
    id: 'death_hand_of_death', name: '冥府勾魂', spellCardPrefix: '死符', enName: 'Hand of Death',
    alignment: 'death', level: 5, manaCost: 12, targetType: 'enemy_unit', range: 21,
    damageBase: 76, vfxKey: 'death_curse', specialEffect: 'hand_of_death',
    description: '死亡 5 级禁咒：如引导死亡的冥府之手降临，直接勾魂抹杀多名敌兵（对英雄造成巨额冥伤）！',
  },
  death_raise_vampires: {
    id: 'death_raise_vampires', name: '招魂·血族', spellCardPrefix: '红夜', enName: 'Raise Vampires',
    alignment: 'death', level: 5, manaCost: 12, targetType: 'corpse_unit', range: 21, ignoreLos: true,
    summonTemplateId: 'crimson_vampire', vfxKey: 'soul_rise', specialEffect: 'raise_undead',
    description: '死亡 5 级招魂神术：消耗战场残骸的剩余生命池，按法强预算唤醒幽冥公馆正式兵种「血族眷属」（飞行、不受反击、吸血复苏，允许残兵）！',
  },
  death_sacrifice: {
    id: 'death_sacrifice', name: '彼岸献祭', spellCardPrefix: '祭符', enName: 'Sacrifice',
    alignment: 'death', level: 5, manaCost: 12, targetType: 'ally_to_ally', range: 18, ignoreLos: true,
    vfxKey: 'soul_rise', specialEffect: 'sacrifice',
    description: '死亡 5 级禁术（双选友军）：先选「献祭部队」，再选「复生友军」，以献祭者全部生机强力复活后者！',
  },
};

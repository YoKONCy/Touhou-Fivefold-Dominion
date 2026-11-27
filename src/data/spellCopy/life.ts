/**
 * 生命派系法术三段式文案表（35 术）
 */

import type { SpellCopyEntry } from './types';

export const LIFE_SPELL_COPY: Record<string, SpellCopyEntry> = {
  life_bind_wound: {
    summary: '贴附愈合灵札的轻度止伤术。',
    effect: '为一名活体友军恢复生命值，治疗量随法强与生命魔法等级提升。',
  },
  life_bless: {
    summary: '博丽神社降下的神圣祝佑。',
    effect: '使一名友军在本场战斗中每次攻击恒定造成最大伤害。',
    flavor: '“神社的御守到底灵不灵，全看当天巫女的心情。”',
  },
  life_exorcism: {
    summary: '挥动御币驱除附身邪祟。',
    effect: '清除一名友军身上的全部负面诅咒、控制与减益效果。',
  },
  life_holy_word: {
    summary: '直击妖邪本源的破邪真言。',
    effect: '对一名敌军造成神圣伤害，对死亡系、不死、暗系与混沌系目标造成全额伤害，对其余目标伤害减半。',
  },
  life_spiritual_armor: {
    summary: '以灵札环绕周身构筑护甲。',
    effect: '使一名友军的近战与远程防御提升 25%，持续 5 回合。',
  },
  life_summon_ship: {
    summary: '唤来渡水幽船的行军法术。',
    effect: '仅限战略大地图使用，在相邻水域岸边召唤一艘渡船。',
  },
  life_chaos_ward: {
    summary: '隔绝混沌魔法的单体结界。',
    effect: '使一名友军获得 50% 混沌魔法抗性，迎击混沌系单位时防御提升 50%。',
  },
  life_death_ward: {
    summary: '抵御幽冥死气的单体结界。',
    effect: '使一名友军获得 50% 死亡魔法抗性，迎击死亡系、不死与暗系单位时防御提升 50%。',
  },
  life_defender: {
    summary: '稳固全军阵线的守御加护。',
    effect: '使全队友军在进入防御姿态时额外获得 50% 防御加成。',
  },
  life_heal: {
    summary: '倾注神社清泉甘露的强力治疗。',
    effect: '为一名活体友军恢复大量生命值，并同时解除剧毒与瘴疫。',
  },
  life_heavenly_shield: {
    summary: '巫女护身的博丽二重结界。',
    effect: '仅作用于施法者自身，生成高额临时护盾吸收后续伤害。',
    flavor: '“只要结界够厚，站在原地喝茶也打不着。”',
  },
  life_martyr: {
    summary: '以雏偶丝线转嫁厄运的替身术。',
    effect: '先选替身友军、再选受护友军，受护者承受的一切伤害均转移给替身承担。',
    flavor: '“把灾厄都塞进草人里顺流漂走，是幻想乡最古老的规矩。”',
  },
  life_mirth: {
    summary: '振奋斗志的神社欢欣神乐。',
    effect: '使一名友军士气提升 10 点，持续 5 回合。',
  },
  life_nature_ward: {
    summary: '隔绝自然魔法的单体结界。',
    effect: '使一名友军获得 50% 自然魔法抗性，迎击自然系单位时防御提升 50%。',
  },
  life_order_ward: {
    summary: '隔绝秩序魔法的单体结界。',
    effect: '使一名友军获得 50% 秩序魔法抗性，迎击秩序系单位时防御提升 50%。',
  },
  life_retribution: {
    summary: '以攻代守的因果反噬之印。',
    effect: '为一名友军施加因果印记，近战攻击者将承受 35% 伤害反噬。',
  },
  life_song_of_peace: {
    summary: '平息战意的镇魂神乐。',
    effect: '使一名活体敌军在 2 回合内无法攻击或施法，受到伤害后立即解除。',
    flavor: '“笛声一响，连最爱闹事的妖精也只想打个盹。”',
  },
  life_celestial_armor: {
    summary: '披覆全军的天界灵光铠甲。',
    effect: '使全队所有非魔免友军防御提升 25%，持续 5 回合。',
  },
  life_holy_shout: {
    summary: '震荡全场的退魔灵喝。',
    effect: '对场上所有死亡系、不死与暗系敌军造成群体神圣伤害。',
  },
  life_mass_bless: {
    summary: '降临全阵的众神神祝。',
    effect: '使全队所有非魔免友军攻击恒定造成最大伤害。',
  },
  life_mass_healing: {
    summary: '遍洒战场的常世神泉甘露。',
    effect: '为全体活体非魔免友军恢复生命值，并解除剧毒与瘴疫。',
  },
  life_regeneration: {
    summary: '引动常青灵脉的持续自愈术。',
    effect: '使一名友军在每回合开始时自动恢复生命值。',
  },
  life_mass_chaos_ward: {
    summary: '护持全阵的御混大结界。',
    effect: '使全体友军获得 50% 混沌魔法抗性，迎击混沌系单位时防御提升 50%。',
  },
  life_mass_death_ward: {
    summary: '护持全阵的御冥大结界。',
    effect: '使全体友军获得 50% 死亡魔法抗性，迎击死亡系、不死与暗系单位时防御提升 50%。',
  },
  life_mass_exorcism: {
    summary: '涤荡全阵厄祟的神社大祓。',
    effect: '清除全体友军身上的全部负面诅咒、控制与减益效果。',
  },
  life_mass_fervor: {
    summary: '如祭典宴会般昂扬的全军鼓舞。',
    effect: '使全体非魔免友军士气提升 10 点，持续 5 回合。',
    flavor: '“只要打完仗有宴会和甜酒，大家就会格外卖力。”',
  },
  life_mass_nature_ward: {
    summary: '护持全阵的御森大结界。',
    effect: '使全体友军获得 50% 自然魔法抗性，迎击自然系单位时防御提升 50%。',
  },
  life_mass_order_ward: {
    summary: '护持全阵的御律大结界。',
    effect: '使全体友军获得 50% 秩序魔法抗性，迎击秩序系单位时防御提升 50%。',
  },
  life_prayer: {
    summary: '凝聚神道愿力的全阵祈祷。',
    effect: '使己方全体生命系单位的生命上限与伤害各提升 25%。',
  },
  life_divine_intervention: {
    summary: '请动八百万神明降世的终极神迹。',
    effect: '使全体活体非魔免友军强力恢复并苏生阵亡兵力，同时净化一切负面状态与毒疫。',
    flavor: '“赛钱箱里偶尔多出一枚铜板时，神明也会格外慷慨。”',
  },
  life_guardian_angel: {
    summary: '垂落天羽庇护的护命神术。',
    effect: '赋予一名活体友军御神护命，濒临覆灭时自动触发救赎并重聚 35% 兵力。',
    flavor: '“别急着退场，博丽的神使还没签收你的名字。”',
  },
  life_sanctuary: {
    summary: '隔绝尘世纷争的常世净域。',
    effect: '使一名友军免疫一切攻击与法术直至主动行动，全队同时至多生效 1 个目标。',
    flavor: '“暂且歇口气吧，外面的弹幕可还没停呢。”',
  },
  life_ward: {
    summary: '贴身流转的博丽护身结界。',
    effect: '使一名友军防御提升 30%、擦弹率提升 18%，持续 3 回合。',
  },
  life_exorcism_orb: {
    summary: '追踪妖气的阴阳封魔灵弹。',
    effect: '对一名敌军造成灵力伤害，对暗系、不死、死亡系与混沌系目标额外提升 35% 伤害。',
  },
  life_resurrection: {
    summary: '召回离散魂魄的返魂苏生术。',
    effect: '复生一名活体友军已阵亡的兵力，上限为初始满编人数，满员时转为治疗。',
  },
};

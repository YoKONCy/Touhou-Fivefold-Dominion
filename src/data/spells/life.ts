/**
 * 生命派系法术数据表（32 术：31 战斗 + 1 大地图）
 * 主题：博丽 / 守矢神道 · 御札清祓 · 神社结界
 */

import type { SpellDef } from '@core/types';

export const LIFE_H4_SPELLS: Record<string, SpellDef> = {
  life_bind_wound: {
    id: 'life_bind_wound', name: '灵札止痛', spellCardPrefix: '愈符', enName: 'Bind Wound',
    alignment: 'life', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    healBase: 20, vfxKey: 'holy_heal', specialEffect: 'standard',
    description: '生命 1 级：贴附灵札为一名活体友军止伤回血，效果随施法者等级、法强与治愈专精提升。',
  },
  life_bless: {
    id: 'life_bless', name: '神祝满盈', spellCardPrefix: '祝符', enName: 'Bless',
    alignment: 'life', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    vfxKey: 'holy_ward', specialEffect: 'bless',
    description: '生命 1 级：向一名友军降下神社神祝，使其在本次战斗中每次攻击恒定打出最大伤害！',
  },
  life_exorcism: {
    id: 'life_exorcism', name: '御币清祓', spellCardPrefix: '祓符', enName: 'Exorcism',
    alignment: 'life', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    vfxKey: 'holy_heal', specialEffect: 'exorcism',
    description: '生命 1 级：挥动御币清祓邪祟，净化一名友军身上的全部负面诅咒、控制与减益法术。',
  },
  life_holy_word: {
    id: 'life_holy_word', name: '破邪真言', spellCardPrefix: '言符', enName: 'Holy Word',
    alignment: 'life', level: 1, manaCost: 2, targetType: 'enemy_unit', range: 15,
    damageBase: 24, vfxKey: 'reimu_orb', specialEffect: 'holy_word',
    description: '生命 1 级：吟唱退魔真言，对单个死亡/暗黑/混沌异变敌军降下惩戒（对普通生命/自然目标减半）。',
  },
  life_spiritual_armor: {
    id: 'life_spiritual_armor', name: '灵札护身', spellCardPrefix: '护符', enName: 'Spiritual Armor',
    alignment: 'life', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    buffDuration: 5,
    buffModifiers: [{ stat: 'defense', mode: 'percent', value: 0.25, sourceName: '护符·灵札护身', spellPolarity: 'positive' }],
    vfxKey: 'holy_ward', specialEffect: 'standard',
    description: '生命 1 级：以灵韵护札环绕一名友军，提升其近战与远程防御 +25%。',
  },
  life_summon_ship: {
    id: 'life_summon_ship', name: '幽船渡水', spellCardPrefix: '舟符', enName: 'Summon Ship',
    alignment: 'life', level: 1, manaCost: 2, targetType: 'adventure', range: 0,
    isAdventureOnly: true, vfxKey: 'holy_ward', specialEffect: 'adventure_only',
    description: '生命 1 级（大地图术式）：在冒险大地图水域岸边唤来渡船，战斗棋盘中不可施放。',
  },
  life_chaos_ward: {
    id: 'life_chaos_ward', name: '御混结界', spellCardPrefix: '结界', enName: 'Chaos Ward',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    wardSchool: 'chaos', vfxKey: 'holy_ward', specialEffect: 'ward_single',
    description: '生命 2 级：为友军展开御混结界，获得混沌法术 35% 抗性且迎击混沌生物时防御 +35%。',
  },
  life_death_ward: {
    id: 'life_death_ward', name: '御冥结界', spellCardPrefix: '结界', enName: 'Death Ward',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    wardSchool: 'death', vfxKey: 'holy_ward', specialEffect: 'ward_single',
    description: '生命 2 级：为友军展开御冥结界，获得死亡法术 35% 抗性且迎击死亡/暗系生物时防御 +35%。',
  },
  life_defender: {
    id: 'life_defender', name: '不动如山', spellCardPrefix: '守符', enName: 'Defender',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'holy_ward', specialEffect: 'defender',
    description: '生命 2 级：令全队友军稳守如岳，进入防御姿态时额外获得 +50% 护甲加成！',
  },
  life_heal: {
    id: 'life_heal', name: '甘露回春', spellCardPrefix: '愈符', enName: 'Heal',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    healBase: 38, vfxKey: 'holy_heal', specialEffect: 'standard',
    description: '生命 2 级：倾注清泉甘露为一名活体友军回复大量生命，并同时根治铃兰剧毒与黄泉瘴疫。',
  },
  life_heavenly_shield: {
    id: 'life_heavenly_shield', name: '二重结界', spellCardPrefix: '结界', enName: 'Heavenly Shield',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'self', range: 0, ignoreLos: true,
    healBase: 48, vfxKey: 'holy_ward', specialEffect: 'heavenly_shield',
    description: '生命 2 级：仅可对施法者自身施放，展开博丽二重结界构筑高额临时护盾吸收伤害。',
  },
  life_martyr: {
    id: 'life_martyr', name: '替身雏偶', spellCardPrefix: '偶符', enName: 'Martyr',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'ally_to_ally', range: 16,
    vfxKey: 'holy_ward', specialEffect: 'martyr',
    description: '生命 2 级（双选友军）：先选「代受厄伤的替身友军」，再选「受护友军」，后者所受一切伤害均由前者代承！',
  },
  life_mirth: {
    id: 'life_mirth', name: '神乐欢欣', spellCardPrefix: '乐符', enName: 'Mirth',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    buffDuration: 5,
    buffModifiers: [{ stat: 'morale', mode: 'flat', value: 10, sourceName: '乐符·神乐欢欣', spellPolarity: 'positive' }],
    vfxKey: 'holy_ward', specialEffect: 'standard',
    description: '生命 2 级：奏响神社欢欣神乐，赋予一名友军满额高昂士气（士气 +10）。',
  },
  life_nature_ward: {
    id: 'life_nature_ward', name: '御森结界', spellCardPrefix: '结界', enName: 'Nature Ward',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    wardSchool: 'nature', vfxKey: 'holy_ward', specialEffect: 'ward_single',
    description: '生命 2 级：为友军展开御森结界，获得自然法术 35% 抗性且迎击自然生物时防御 +35%。',
  },
  life_order_ward: {
    id: 'life_order_ward', name: '御律结界', spellCardPrefix: '结界', enName: 'Order Ward',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    wardSchool: 'order', vfxKey: 'holy_ward', specialEffect: 'ward_single',
    description: '生命 2 级：为友军展开御律结界，获得秩序法术 35% 抗性且迎击秩序生物时防御 +35%。',
  },
  life_retribution: {
    id: 'life_retribution', name: '因果报应', spellCardPrefix: '罚符', enName: 'Retribution',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    vfxKey: 'holy_ward', specialEffect: 'retribution',
    description: '生命 2 级：为友军结下因果报应之印，任何近战进犯者都将承受 35% 伤害反噬！',
  },
  life_song_of_peace: {
    id: 'life_song_of_peace', name: '镇魂神乐', spellCardPrefix: '镇符', enName: 'Song of Peace',
    alignment: 'life', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    vfxKey: 'holy_ward', specialEffect: 'song_of_peace',
    description: '生命 2 级：以平和神乐安抚一名非心智免疫敌军，使其 2 回合内无法攻击或施法（受伤即破除）。',
  },
  life_celestial_armor: {
    id: 'life_celestial_armor', name: '天界灵铠', spellCardPrefix: '天甲', enName: 'Celestial Armor',
    alignment: 'life', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    massScope: 'all_allies', buffDuration: 5,
    buffModifiers: [{ stat: 'defense', mode: 'percent', value: 0.25, sourceName: '天甲·天界灵铠', spellPolarity: 'positive' }],
    vfxKey: 'holy_ward', specialEffect: 'standard',
    description: '生命 3 级（全军）：降下天界灵光铠甲，令全队所有非魔免友军同时提升防御 +25%。',
  },
  life_holy_shout: {
    id: 'life_holy_shout', name: '阴阳叱咤', spellCardPrefix: '破邪', enName: 'Holy Shout',
    alignment: 'life', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    damageBase: 24, vfxKey: 'reimu_orb', specialEffect: 'holy_shout',
    description: '生命 3 级（全敌）：以震慑天地的退魔灵喝席卷全场，重创所有死亡与暗黑异变敌军！',
  },
  life_mass_bless: {
    id: 'life_mass_bless', name: '八百万神祝', spellCardPrefix: '大祝', enName: 'Mass Bless',
    alignment: 'life', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'holy_ward', specialEffect: 'mass_bless',
    description: '生命 3 级（全军）：请八百万神明共赐祝福，全队非魔免友军每次攻击恒定打出最大伤害！',
  },
  life_mass_healing: {
    id: 'life_mass_healing', name: '常世甘露', spellCardPrefix: '大愈', enName: 'Mass Healing',
    alignment: 'life', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    massScope: 'all_allies', healBase: 28, vfxKey: 'holy_heal', specialEffect: 'standard',
    description: '生命 3 级（全军）：挥洒常世神泉甘露，同时治愈全体活体非魔免友军并根除毒疫。',
  },
  life_regeneration: {
    id: 'life_regeneration', name: '生生不息', spellCardPrefix: '生符', enName: 'Regeneration',
    alignment: 'life', level: 3, manaCost: 5, targetType: 'ally_unit', range: 17,
    healBase: 20, vfxKey: 'holy_heal', specialEffect: 'regeneration',
    description: '生命 3 级：注入常青灵脉之力，令一名友军每回合开始时自动回复大量生命值！',
  },
  life_mass_chaos_ward: {
    id: 'life_mass_chaos_ward', name: '大界·御混', spellCardPrefix: '大界', enName: 'Mass Chaos Ward',
    alignment: 'life', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    wardSchool: 'chaos', vfxKey: 'holy_ward', specialEffect: 'ward_mass',
    description: '生命 4 级（全军）：张开博丽大结界护持全军，全体友军对混沌法术抗性 +35%、迎战混沌防御 +35%。',
  },
  life_mass_death_ward: {
    id: 'life_mass_death_ward', name: '大界·御冥', spellCardPrefix: '大界', enName: 'Mass Death Ward',
    alignment: 'life', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    wardSchool: 'death', vfxKey: 'holy_ward', specialEffect: 'ward_mass',
    description: '生命 4 级（全军）：张开博丽大结界护持全军，全体友军对死亡法术抗性 +35%、迎战冥暗防御 +35%。',
  },
  life_mass_exorcism: {
    id: 'life_mass_exorcism', name: '大祓净世', spellCardPrefix: '大祓', enName: 'Mass Exorcism',
    alignment: 'life', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'holy_heal', specialEffect: 'mass_exorcism',
    description: '生命 4 级（全军）：举行神社大祓仪轨，彻底净化全体友军身上的全部诅咒、异常控制与减益！',
  },
  life_mass_fervor: {
    id: 'life_mass_fervor', name: '百神狂欢', spellCardPrefix: '大乐', enName: 'Mass Fervor',
    alignment: 'life', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    massScope: 'all_allies', buffDuration: 5,
    buffModifiers: [{ stat: 'morale', mode: 'flat', value: 10, sourceName: '大乐·百神狂欢', spellPolarity: 'positive' }],
    vfxKey: 'holy_ward', specialEffect: 'standard',
    description: '生命 4 级（全军）：如宴会祭典般鼓舞全军，令所有非魔免友军士气直达满额（+10）！',
  },
  life_mass_nature_ward: {
    id: 'life_mass_nature_ward', name: '大界·御森', spellCardPrefix: '大界', enName: 'Mass Nature Ward',
    alignment: 'life', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    wardSchool: 'nature', vfxKey: 'holy_ward', specialEffect: 'ward_mass',
    description: '生命 4 级（全军）：张开博丽大结界护持全军，全体友军对自然法术抗性 +35%、迎战自然防御 +35%。',
  },
  life_mass_order_ward: {
    id: 'life_mass_order_ward', name: '大界·御律', spellCardPrefix: '大界', enName: 'Mass Order Ward',
    alignment: 'life', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    wardSchool: 'order', vfxKey: 'holy_ward', specialEffect: 'ward_mass',
    description: '生命 4 级（全军）：张开博丽大结界护持全军，全体友军对秩序法术抗性 +35%、迎战秩序防御 +35%。',
  },
  life_prayer: {
    id: 'life_prayer', name: '巫女祈祷', spellCardPrefix: '祈符', enName: 'Prayer',
    alignment: 'life', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'holy_ward', specialEffect: 'prayer',
    description: '生命 4 级（全军）：献上虔诚神道祈愿，令己方全体生命阵营单位生命上限与伤害同增 +25%！',
  },
  life_divine_intervention: {
    id: 'life_divine_intervention', name: '八百万神降', spellCardPrefix: '神迹', enName: 'Divine Intervention',
    alignment: 'life', level: 5, manaCost: 12, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'holy_heal', specialEffect: 'divine_intervention',
    description: '生命 5 级终极神迹：神灵降世庇佑全军，将全体活体非魔免友军当前受伤单位与英雄回复至满血，并彻底清祓一切厄祟与毒疫（不复活已阵亡兵力）。',
  },
  life_guardian_angel: {
    id: 'life_guardian_angel', name: '御神护命', spellCardPrefix: '神使', enName: 'Guardian Angel',
    alignment: 'life', level: 5, manaCost: 12, targetType: 'ally_unit', range: 18,
    vfxKey: 'holy_ward', specialEffect: 'guardian_angel',
    description: '生命 5 级神术：降下多重御神护命光环，目标濒临覆灭时自动触发神使救赎重聚 35% 兵力！',
  },
  life_sanctuary: {
    id: 'life_sanctuary', name: '常世净域', spellCardPrefix: '净域', enName: 'Sanctuary',
    alignment: 'life', level: 5, manaCost: 12, targetType: 'ally_unit', range: 18,
    vfxKey: 'holy_ward', specialEffect: 'sanctuary',
    description: '生命 5 级神术：将一名友军隐入常世净域，绝对免受一切攻击与法术直至其主动行动（全队至多 1 人）。',
  },
};

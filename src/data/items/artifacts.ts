/**
 * 东方英雄专属神器与组合套装数据表
 */

import type { ArtifactDef, ArtifactSetDef } from '@core/types';

/** 资料片《极速风暴》风格组合神器套装原型 */
export const ARTIFACTS: Record<string, ArtifactDef> = {
  hakurei_gohei: {
    id: 'hakurei_gohei',
    name: '博丽御币',
    slot: 'weapon',
    setId: 'hakurei_regalia',
    description: '博丽神社代代相传的退治法具，攻守兼备。',
    modifiers: [
      { stat: 'attack', mode: 'flat', value: 3, sourceName: '神器·博丽御币' },
      { stat: 'spellPower', mode: 'flat', value: 2, sourceName: '神器·博丽御币' },
    ],
  },
  yin_yang_orb_charm: {
    id: 'yin_yang_orb_charm',
    name: '迷你阴阳玉护符',
    slot: 'accessory',
    setId: 'hakurei_regalia',
    description: '蕴含结界之力的灵玉，提升擦弹率与防御。',
    modifiers: [
      { stat: 'defense', mode: 'flat', value: 2, sourceName: '神器·阴阳玉护符' },
      { stat: 'grazeChance', mode: 'flat', value: 0.08, sourceName: '神器·阴阳玉护符' },
    ],
  },
  mini_hakkero: {
    id: 'mini_hakkero',
    name: '迷你八卦炉',
    slot: 'weapon',
    setId: 'kirisame_arsenal',
    description: '高输出魔导增幅炉，显著强化弹幕威力。',
    modifiers: [
      { stat: 'spellPower', mode: 'flat', value: 4, sourceName: '神器·迷你八卦炉' },
      { stat: 'attack', mode: 'flat', value: 2, sourceName: '神器·迷你八卦炉' },
    ],
  },
  witch_star_hat: {
    id: 'witch_star_hat',
    name: '星尘尖顶帽',
    slot: 'head',
    setId: 'kirisame_arsenal',
    description: '魔法使最爱的黑色大帽，积蓄灵力与魔抗。',
    modifiers: [
      { stat: 'maxMana', mode: 'flat', value: 12, sourceName: '神器·星尘尖顶帽' },
      { stat: 'magicResistance', mode: 'flat', value: 0.1, sourceName: '神器·星尘尖顶帽' },
    ],
  },
  eirin_celestial_bow: {
    id: 'eirin_celestial_bow',
    name: '天弓「天文密葬」',
    slot: 'weapon',
    setId: 'eirin_lunar_regalia',
    description: '八意永琳御用的月都星轨长弓，提升攻击、法术强度与远程射程。',
    modifiers: [
      { stat: 'attack', mode: 'flat', value: 2, sourceName: '神器·天弓「天文密葬」' },
      { stat: 'spellPower', mode: 'flat', value: 3, sourceName: '神器·天弓「天文密葬」' },
      { stat: 'range', mode: 'flat', value: 1, sourceName: '神器·天弓「天文密葬」' },
    ],
  },
  hourai_apothecary_vial: {
    id: 'hourai_apothecary_vial',
    name: '蓬莱秘药匣',
    slot: 'accessory',
    setId: 'eirin_lunar_regalia',
    description: '盛放永远亭精炼秘药的玉匣，扩充灵力上限并强化护甲与魔抗。',
    modifiers: [
      { stat: 'maxMana', mode: 'flat', value: 12, sourceName: '神器·蓬莱秘药匣' },
      { stat: 'defense', mode: 'flat', value: 2, sourceName: '神器·蓬莱秘药匣' },
      { stat: 'magicResistance', mode: 'flat', value: 0.08, sourceName: '神器·蓬莱秘药匣' },
    ],
  },
  gungnir_spear: {
    id: 'gungnir_spear',
    name: '神枪「冈格尼尔」',
    slot: 'weapon',
    setId: 'scarlet_manor_regalia',
    description: '红魔馆之主御用的鲜红命运之枪，提升攻击、法术强度与远程投掷射程。',
    modifiers: [
      { stat: 'attack', mode: 'flat', value: 3, sourceName: '神器·神枪「冈格尼尔」' },
      { stat: 'spellPower', mode: 'flat', value: 2, sourceName: '神器·神枪「冈格尼尔」' },
      { stat: 'range', mode: 'flat', value: 1, sourceName: '神器·神枪「冈格尼尔」' },
    ],
  },
  scarlet_tea_cup: {
    id: 'scarlet_tea_cup',
    name: '鲜红红茶杯',
    slot: 'accessory',
    setId: 'scarlet_manor_regalia',
    description: '盛满 B 型红茶的镀金瓷杯，扩充灵力上限并提升防御与擦弹身法。',
    modifiers: [
      { stat: 'maxMana', mode: 'flat', value: 10, sourceName: '神器·鲜红红茶杯' },
      { stat: 'defense', mode: 'flat', value: 2, sourceName: '神器·鲜红红茶杯' },
      { stat: 'grazeChance', mode: 'flat', value: 0.08, sourceName: '神器·鲜红红茶杯' },
    ],
  },
  oni_shackle_chains: {
    id: 'oni_shackle_chains',
    name: '鬼王玄铁锁链',
    slot: 'weapon',
    setId: 'yuugi_oni_regalia',
    description: '缠绕于星熊勇仪双腕的沉重旧都玄铁锁链，极大强化近战与投掷打击威势。',
    modifiers: [
      { stat: 'attack', mode: 'flat', value: 4, sourceName: '神器·鬼王玄铁锁链' },
      { stat: 'defense', mode: 'flat', value: 1, sourceName: '神器·鬼王玄铁锁链' },
    ],
  },
  hoshiguma_dish: {
    id: 'hoshiguma_dish',
    name: '星熊杯',
    slot: 'accessory',
    setId: 'yuugi_oni_regalia',
    description: '盛满大江山烈酒的三足朱漆大杯，激荡鬼神豪气，稳固生命与护甲并振奋士气。',
    modifiers: [
      { stat: 'maxHp', mode: 'flat', value: 25, sourceName: '神器·星熊杯' },
      { stat: 'defense', mode: 'flat', value: 3, sourceName: '神器·星熊杯' },
      { stat: 'morale', mode: 'flat', value: 2, sourceName: '神器·星熊杯' },
    ],
  },
};

export const ARTIFACT_SETS: Record<string, ArtifactSetDef> = {
  hakurei_regalia: {
    id: 'hakurei_regalia',
    name: '博丽退治套装 (2/2)',
    requiredCount: 2,
    description: '套装激活：全属性灵韵涌动，生命上限 +35，幸运 +2。',
    modifiers: [
      { stat: 'maxHp', mode: 'flat', value: 35, sourceName: '套装·博丽退治套装' },
      { stat: 'luck', mode: 'flat', value: 2, sourceName: '套装·博丽退治套装' },
    ],
  },
  kirisame_arsenal: {
    id: 'kirisame_arsenal',
    name: '雾雨魔导套装 (2/2)',
    requiredCount: 2,
    description: '套装激活：极端火力解放，法术强度 +3，速度 +1。',
    modifiers: [
      { stat: 'spellPower', mode: 'flat', value: 3, sourceName: '套装·雾雨魔导套装' },
      { stat: 'speed', mode: 'flat', value: 1, sourceName: '套装·雾雨魔导套装' },
    ],
  },
  eirin_lunar_regalia: {
    id: 'eirin_lunar_regalia',
    name: '月都贤者套装 (2/2)',
    requiredCount: 2,
    description: '套装激活：月都星轨共鸣，法术强度 +2，生命上限 +25，先手主动性 +1。',
    modifiers: [
      { stat: 'spellPower', mode: 'flat', value: 2, sourceName: '套装·月都贤者套装' },
      { stat: 'maxHp', mode: 'flat', value: 25, sourceName: '套装·月都贤者套装' },
      { stat: 'initiative', mode: 'flat', value: 1, sourceName: '套装·月都贤者套装' },
    ],
  },
  scarlet_manor_regalia: {
    id: 'scarlet_manor_regalia',
    name: '红魔公馆威仪 (2/2)',
    requiredCount: 2,
    description: '套装激活：鲜红幼月降临，生命上限 +25，幸运 +2，移动速度 +1。',
    modifiers: [
      { stat: 'maxHp', mode: 'flat', value: 25, sourceName: '套装·红魔公馆威仪' },
      { stat: 'luck', mode: 'flat', value: 2, sourceName: '套装·红魔公馆威仪' },
      { stat: 'speed', mode: 'flat', value: 1, sourceName: '套装·红魔公馆威仪' },
    ],
  },
  yuugi_oni_regalia: {
    id: 'yuugi_oni_regalia',
    name: '山岳四天王威仪',
    requiredCount: 2,
    description: '套装激活：鬼神一滴不洒，生命上限 +35，攻击 +2，移动速度 +1。',
    modifiers: [
      { stat: 'maxHp', mode: 'flat', value: 35, sourceName: '套装·山岳四天王威仪' },
      { stat: 'attack', mode: 'flat', value: 2, sourceName: '套装·山岳四天王威仪' },
      { stat: 'speed', mode: 'flat', value: 1, sourceName: '套装·山岳四天王威仪' },
    ],
  },
};

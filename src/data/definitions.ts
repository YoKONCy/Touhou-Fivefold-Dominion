/**
 * 《Touhou-H4》首批数据表（全数据驱动配置层）
 *
 * 严格遵循定稿铁律：
 * - 英雄 = 东方有名有姓唯一角色（博丽灵梦、雾雨魔理沙），拥有固有特质钩子与专属符卡
 * - 兵种 = 非角色量产杂鱼/族群/造物（阴阳毛玉、向日葵妖精、妖怪兔、星屑魔导书、地狱怨灵、神社石傀儡）
 */

import { H4_ADVANCED_CLASSES } from '@core/h4Skills';
import {
  hexKey,
  hexToPixel,
  offsetToAxial,
  type HexProjectionConfig,
  type HexTile,
  type TerrainType,
} from '@core/hex';
import type { GameDataRegistry } from '@core/modifiers';
import type {
  AdvancedClassDef,
  ArtifactDef,
  ArtifactSetDef,
  CreatureDefinition,
  HeroDefinition,
  PotionDef,
  SpellCardDef,
  SpellDef,
} from '@core/types';
import { ALL_H4_SPELL_IDS, H4_SPELLS, H4_SUMMON_TEMPLATES } from './h4Spells';

/** HoMM4 全量 37 种双修/全能进阶组合职业（C(9,2)=36 两两双修 + 万象大贤者，东方双层风味命名） */
export const ADVANCED_CLASSES: Record<string, AdvancedClassDef> = H4_ADVANCED_CLASSES;

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
};

export const GAME_DATA_REGISTRY: GameDataRegistry = {
  advancedClasses: ADVANCED_CLASSES,
  artifacts: ARTIFACTS,
  artifactSets: ARTIFACT_SETS,
};

/** 英雄腰带战斗秘药 */
export const POTIONS: Record<string, PotionDef> = {
  healing_elixir: {
    id: 'healing_elixir',
    name: '蓬莱治愈药',
    description: '饮用后立即恢复英雄 75 点生命值，不消耗本回合行动权。',
    effectType: 'heal',
    power: 75,
    color: '#e6556b',
  },
  spirit_draught: {
    id: 'spirit_draught',
    name: '高纯灵力露',
    description: '饮用后恢复 18 点灵力并立即增加 +35% 符卡充能，不消耗本回合行动权。',
    effectType: 'mana_charge',
    power: 18,
    color: '#5fa8ff',
  },
  iron_barrier_oil: {
    id: 'iron_barrier_oil',
    name: '结界硬化秘药',
    description: '饮用后持续 2 回合防御 +35%、擦弹率 +15%，不消耗本回合行动权。',
    effectType: 'combat_elixir',
    power: 35,
    color: '#e8c468',
  },
};

/** 通用五系法术总录（包含全部 142 个 HoMM4 官方五系法术 + 东方专属兵种术式兼容保留） */
export const SPELLS: Record<string, SpellDef> = {
  ...H4_SPELLS,
  life_ward: {
    id: 'life_ward',
    name: '博丽护身结界',
    spellCardPrefix: '结界',
    alignment: 'life',
    level: 2,
    manaCost: 8,
    targetType: 'ally_unit',
    range: 16,
    buffDuration: 3,
    buffModifiers: [
      { stat: 'defense', mode: 'percent', value: 0.3, sourceName: '结界·博丽护身结界', spellPolarity: 'positive' },
      { stat: 'grazeChance', mode: 'flat', value: 0.18, sourceName: '结界·博丽护身结界', spellPolarity: 'positive' },
    ],
    vfxKey: 'holy_ward',
    description: '生命系 2 级术式：赋予友方单位 3 回合护甲 +30% 与擦弹 +18%。',
  },
  life_exorcism_orb: {
    id: 'life_exorcism_orb',
    name: '阴阳封魔弹',
    spellCardPrefix: '灵符',
    alignment: 'life',
    level: 2,
    manaCost: 7,
    targetType: 'enemy_unit',
    range: 16,
    damageBase: 26,
    vfxKey: 'reimu_orb',
    description: '生命系 2 级术式：发射追踪封魔灵弹，对暗系、不死、死亡系与混沌系目标伤害额外 +35%。',
  },
  life_resurrection: {
    id: 'life_resurrection',
    name: '博丽返魂苏生',
    spellCardPrefix: '苏生',
    alignment: 'life',
    level: 4,
    manaCost: 10,
    targetType: 'ally_unit',
    range: 21,
    reviveBase: 90,
    vfxKey: 'holy_heal',
    description: '生命系 4 级神术：令已减员的活体友军重新苏生阵亡兵力（上限为初始满编人数），满员时转为强力治疗。',
  },
  chaos_star_bolt: {
    id: 'chaos_star_bolt',
    name: '星屑魔矢',
    spellCardPrefix: '星符',
    alignment: 'chaos',
    level: 1,
    manaCost: 6,
    targetType: 'enemy_unit',
    range: 15,
    damageBase: 28,
    vfxKey: 'marisa_bolt',
    description: '混沌系 1 级术式：轰出高爆发星光射线，精准打击单个目标。',
  },
  chaos_meteor_burst: {
    id: 'chaos_meteor_burst',
    name: '星火连弹',
    spellCardPrefix: '恋符',
    alignment: 'chaos',
    level: 3,
    manaCost: 11,
    targetType: 'hex_aoe',
    range: 17,
    aoeRadius: 1,
    damageBase: 26,
    isFireSpell: true,
    vfxKey: 'star_burst',
    description: '混沌系 3 级火系术式：在目标六边形及周围 1 环引爆星火弹幕（可被擦弹，火抗减半）。',
  },
  nature_haste: {
    id: 'nature_haste',
    name: '妖怪山疾风',
    spellCardPrefix: '风符',
    alignment: 'nature',
    level: 1,
    manaCost: 5,
    targetType: 'ally_unit',
    range: 15,
    buffDuration: 2,
    buffModifiers: [
      { stat: 'speed', mode: 'flat', value: 2, sourceName: '风符·妖怪山疾风', spellPolarity: 'positive' },
      { stat: 'initiative', mode: 'flat', value: 2, sourceName: '风符·妖怪山疾风', spellPolarity: 'positive' },
    ],
    vfxKey: 'nature_haste',
    description: '自然系 1 级术式：赋予友军疾风加护，移动力与先手主动性 +2。',
  },
  order_rabbit_transform: {
    id: 'order_rabbit_transform',
    name: '兔化',
    spellCardPrefix: '兔符',
    enName: 'Lunar Hare Form',
    alignment: 'order',
    level: 1,
    manaCost: 99,
    targetType: 'self',
    range: 0,
    ignoreLos: true,
    isCreatureOnly: true,
    specialEffect: 'rabbit_transform',
    vfxKey: 'order_rabbit_transform',
    description: '竹林妖怪兔专属自用变身术：消耗 99 MP 化作月光白兔真身，获得「先攻」且自身位移距离、先手主动与擦弹率各提升 50%，持续 2 回合（含施法本回合共 3 回合）。',
  },
  death_summon_ice_demon: {
    id: 'death_summon_ice_demon',
    name: '深渊冰魔召唤',
    spellCardPrefix: '魔召',
    enName: 'Summon Ice Demons',
    alignment: 'death',
    level: 3,
    manaCost: 8,
    targetType: 'hex_empty',
    range: 12,
    ignoreLos: true,
    isCreatureOnly: true,
    summonTemplateId: 'abyss_ice_demon',
    specialEffect: 'summon_creature',
    vfxKey: 'death_curse',
    description: '深渊隙间恶魔专属召唤术：撕裂深渊寒霜隙间，在指定空地召出暗系「深渊冰魔」战队（具备寒冰抗性与寒霜冻结）助战！',
  },
};

/** 东方英雄专属符卡宣言 */
export const SPELL_CARDS: Record<string, SpellCardDef> = {
  reimu_fantasy_nature: {
    id: 'reimu_fantasy_nature',
    name: '灵符「梦想天生」',
    subtitle: 'Dream Seal · 博丽大结界展开',
    ownerHeroDefId: 'hero_reimu',
    alignment: 'life',
    manaCost: 12,
    chargeCost: 100,
    targetType: 'field_self',
    fieldAura: {
      id: 'aura_fantasy_nature',
      name: '结界领域「梦想天生」',
      durationRounds: 3,
      themeColor: '#e64c65',
      accentColor: '#ffe08a',
      pattern: 'yin_yang',
      allyModifiers: [
        { stat: 'grazeChance', mode: 'flat', value: 0.25, sourceName: '符卡领域·梦想天生' },
        { stat: 'defense', mode: 'percent', value: 0.25, sourceName: '符卡领域·梦想天生' },
        { stat: 'luck', mode: 'flat', value: 2, sourceName: '符卡领域·梦想天生' },
      ],
      enemyModifiers: [
        { stat: 'attack', mode: 'percent', value: -0.15, sourceName: '符卡威压·梦想天生' },
      ],
    },
    vfxKey: 'spellcard_reimu',
    description:
      '宣言专属符卡！盘面展开朱金阴阳大结界（持续 3 回合）：全队擦弹 +25%、护甲 +25%、幸运 +2，压制敌方攻击 -15%，并为全队小幅恢复生命。',
  },

  marisa_master_spark: {
    id: 'marisa_master_spark',
    name: '恋符「极限火花」',
    subtitle: 'Master Spark · 八卦魔炮贯通',
    ownerHeroDefId: 'hero_marisa',
    alignment: 'chaos',
    manaCost: 14,
    chargeCost: 100,
    targetType: 'hex_line',
    lineLength: 14,
    damageBase: 96,
    fieldAura: {
      id: 'aura_master_spark',
      name: '星尘余晖「极彩魔域」',
      durationRounds: 2,
      themeColor: '#f6c945',
      accentColor: '#ff6d4d',
      pattern: 'hakke_star',
      allyModifiers: [
        { stat: 'attack', mode: 'percent', value: 0.2, sourceName: '符卡领域·极彩魔域' },
        { stat: 'spellPower', mode: 'flat', value: 4, sourceName: '符卡领域·极彩魔域' },
      ],
      enemyModifiers: [
        { stat: 'defense', mode: 'percent', value: -0.15, sourceName: '符卡焦灼·极彩魔域' },
      ],
    },
    vfxKey: 'spellcard_marisa',
    description:
      '宣言专属符卡！沿指定方向发射贯穿 14 格六边形的极彩魔炮轰击路径全部敌军，并在盘面留下 2 回合八卦星辉领域（我方攻击 +20%、法强 +4）。',
  },

  eirin_astronomical_entombing: {
    id: 'eirin_astronomical_entombing',
    name: '秘术「天文密葬法」',
    subtitle: 'Astronomical Entombing · 月都伪月星阵展开',
    ownerHeroDefId: 'hero_eirin',
    alignment: 'order',
    manaCost: 13,
    chargeCost: 100,
    targetType: 'field_self',
    fieldAura: {
      id: 'aura_astronomical_entombing',
      name: '伪月领域「天文密葬法」',
      durationRounds: 3,
      themeColor: '#5c8cff',
      accentColor: '#e6f0ff',
      pattern: 'lunar_astrolabe',
      allyModifiers: [
        { stat: 'spellPower', mode: 'flat', value: 3, sourceName: '符卡领域·天文密葬法' },
        { stat: 'defense', mode: 'percent', value: 0.18, sourceName: '符卡领域·天文密葬法' },
        { stat: 'magicResistance', mode: 'flat', value: 0.12, sourceName: '符卡领域·天文密葬法' },
      ],
      enemyModifiers: [
        { stat: 'initiative', mode: 'flat', value: -2, sourceName: '符卡星滞·天文密葬法' },
        { stat: 'speed', mode: 'flat', value: -1, sourceName: '符卡星滞·天文密葬法' },
      ],
    },
    vfxKey: 'spellcard_reimu',
    description:
      '宣言专属符卡！于战场天穹铺展月都星轨密葬大阵（持续 3 回合）：我方全军法强 +3、护甲 +18%、魔抗 +12%，敌军主动性 -2、移速 -1，并同时回复全队活体生命与施法单位 4 点灵力。',
  },

  remilia_gungnir: {
    id: 'remilia_gungnir',
    name: '神枪「冈格尼尔之枪」',
    subtitle: 'Spear the Gungnir · 鲜红幼月贯通',
    ownerHeroDefId: 'hero_remilia',
    alignment: 'death',
    manaCost: 13,
    chargeCost: 100,
    targetType: 'hex_line',
    lineLength: 14,
    damageBase: 92,
    fieldAura: {
      id: 'aura_scarlet_moon',
      name: '红雾领域「鲜红不夜城」',
      durationRounds: 3,
      themeColor: '#d92659',
      accentColor: '#ff9eb8',
      pattern: 'scarlet_moon',
      allyModifiers: [
        { stat: 'attack', mode: 'percent', value: 0.15, sourceName: '符卡领域·鲜红不夜城' },
        { stat: 'grazeChance', mode: 'flat', value: 0.12, sourceName: '符卡领域·鲜红不夜城' },
        { stat: 'luck', mode: 'flat', value: 2, sourceName: '符卡领域·鲜红不夜城' },
      ],
      enemyModifiers: [
        { stat: 'defense', mode: 'percent', value: -0.15, sourceName: '符卡红雾·鲜红不夜城' },
      ],
    },
    vfxKey: 'spellcard_marisa',
    description:
      '宣言专属符卡！投掷必中鲜红神枪贯穿 14 格六边形敌军并按总伤 30%（上限 75）汲取自身生命，同时展开 3 回合红雾领域（我方攻击 +15%、擦弹 +12%、幸运 +2，敌方防御 -15%）。',
  },
};

/** 首批原型东方英雄（博丽灵梦 vs 雾雨魔理沙，机动与射程适配 21×13 辽阔战场） */
export const HERO_DEFINITIONS: Record<string, HeroDefinition> = {
  hero_reimu: {
    id: 'hero_reimu',
    name: '博丽灵梦',
    title: '乐园的可爱巫女',
    alignment: 'life',
    level: 5,
    baseStats: {
      attack: 16,
      defense: 14,
      minDamage: 23,
      maxDamage: 31,
      maxHp: 212,
      speed: 7,
      initiative: 12,
      range: 8,
      ammo: 12,
      morale: 2,
      luck: 3,
      magicResistance: 0.16,
      grazeChance: 0.12,
      spellPower: 12,
      maxMana: 96,
    },
    abilities: {
      ranged: true,
      flying: true,
      noMeleePenalty: true,
      unlimitedRetaliation: true,
    },
    innateTraitIds: ['reimu_floating_maiden'],
    // 全 H4 五系 142 法术完全解锁 + 五系魔法全宗师级（Rank 5）！
    knownSpellIds: [...ALL_H4_SPELL_IDS],
    signatureSpellCardId: 'reimu_fantasy_nature',
    initialSkills: {
      life_magic: 5,
      order_magic: 5,
      death_magic: 5,
      chaos_magic: 5,
      nature_magic: 5,
      combat: 3,
      tactics: 3,
    },
    initialSubSkills: {
      healing: 4,
      spirituality: 4,
      resurrection_skill: 3,
      enchantment: 3,
      wizardry: 3,
      charm: 2,
      occultism: 2,
      necromancy: 2,
      pyromancy: 3,
      sorcery: 4,
      herbalism: 2,
      meditation: 3,
      summoning: 3,
      melee: 2,
      archery: 2,
      magic_resistance: 3,
      offense: 2,
      defense: 2,
      leadership: 2,
    },
    initialPotions: [
      { potionId: 'healing_elixir', charges: 2 },
      { potionId: 'spirit_draught', charges: 1 },
      { potionId: 'iron_barrier_oil', charges: 1 },
    ],
    initialArtifacts: ['hakurei_gohei', 'yin_yang_orb_charm'],
    footprint: '1x1',
    voxelBlueprintId: 'hero_reimu',
    themeColor: '#e64c65',
    accentColor: '#ffe08a',
  },

  hero_marisa: {
    id: 'hero_marisa',
    name: '雾雨魔理沙',
    title: '普通的魔法使',
    alignment: 'chaos',
    level: 5,
    baseStats: {
      attack: 18,
      defense: 14,
      minDamage: 28,
      maxDamage: 38,
      maxHp: 218,
      speed: 8,
      initiative: 13,
      range: 9,
      ammo: 14,
      morale: 2,
      luck: 2,
      magicResistance: 0.15,
      grazeChance: 0.15,
      spellPower: 14,
      maxMana: 62,
    },
    abilities: {
      ranged: true,
      flying: true,
      noMeleePenalty: true,
      unlimitedRetaliation: true,
    },
    innateTraitIds: ['marisa_firepower_doctrine'],
    knownSpellIds: [
      'chaos_star_bolt',
      'chaos_meteor_burst',
      'death_curse',
      'order_slow',
      'chaos_magic_arrow',
      'chaos_haste',
      'chaos_bloodlust',
      'chaos_lightning',
      'chaos_fireball',
      'chaos_first_strike',
      'chaos_confusion',
      'chaos_magic_mirror',
    ],
    signatureSpellCardId: 'marisa_master_spark',
    initialSkills: {
      chaos_magic: 4,
      scouting: 3,
      order_magic: 2,
      combat: 3,
      tactics: 3,
    },
    initialSubSkills: {
      conjuration: 3,
      pyromancy: 4,
      sorcery: 3,
      pathfinding: 2,
      seamanship: 2,
      stealth: 2,
      enchantment: 2,
      wizardry: 2,
      melee: 1,
      archery: 2,
      magic_resistance: 2,
      offense: 2,
      defense: 2,
    },
    initialSelectedClassId: 'fire_diviner',
    initialPotions: [
      { potionId: 'healing_elixir', charges: 2 },
      { potionId: 'spirit_draught', charges: 1 },
      { potionId: 'iron_barrier_oil', charges: 1 },
    ],
    initialArtifacts: ['mini_hakkero', 'witch_star_hat'],
    footprint: '1x1',
    voxelBlueprintId: 'hero_marisa',
    themeColor: '#f6c945',
    accentColor: '#ff6f59',
  },

  hero_eirin: {
    id: 'hero_eirin',
    name: '八意永琳',
    title: '月之头脑 · 蓬莱药师',
    alignment: 'order',
    level: 5,
    baseStats: {
      attack: 16,
      defense: 15,
      minDamage: 24,
      maxDamage: 34,
      maxHp: 215,
      speed: 7,
      initiative: 12,
      range: 9,
      ammo: 16,
      morale: 2,
      luck: 2,
      magicResistance: 0.16,
      grazeChance: 0.14,
      spellPower: 14,
      maxMana: 58,
    },
    abilities: {
      ranged: true,
      noMeleePenalty: true,
      unlimitedRetaliation: true,
    },
    innateTraitIds: ['eirin_lunar_brain'],
    knownSpellIds: [
      'order_magic_fist',
      'order_blur',
      'order_dispel',
      'order_precision',
      'order_displacement',
      'order_ice_bolt',
      'order_slow',
      'order_create_illusion',
      'order_cowardice',
      'order_power_drain',
      'order_steal_enchantment',
      'order_teleport',
      'order_mass_blur',
      'order_mass_precision',
      'order_mass_dispel',
      'order_forgetfulness',
      'order_banish',
      'order_blind',
      'order_mass_slow',
      'order_phantom_image',
      'order_berserk',
      'order_pain_mirror',
      'order_hypnotize',
      'order_steal_all_enchantments',
      'life_heal',
      'life_exorcism',
      'life_spiritual_armor',
      'life_mass_healing',
      'life_guardian_angel',
      'life_sanctuary',
    ],
    signatureSpellCardId: 'eirin_astronomical_entombing',
    initialSkills: {
      order_magic: 5,
      life_magic: 4,
      combat: 3,
      tactics: 3,
    },
    initialSubSkills: {
      enchantment: 4,
      wizardry: 4,
      charm: 3,
      healing: 3,
      spirituality: 3,
      resurrection_skill: 2,
      archery: 3,
      magic_resistance: 2,
      defense: 2,
      leadership: 2,
    },
    initialSelectedClassId: 'enchanter',
    initialPotions: [
      { potionId: 'healing_elixir', charges: 2 },
      { potionId: 'spirit_draught', charges: 1 },
      { potionId: 'iron_barrier_oil', charges: 1 },
    ],
    initialArtifacts: ['eirin_celestial_bow', 'hourai_apothecary_vial'],
    footprint: '1x1',
    voxelBlueprintId: 'hero_eirin',
    themeColor: '#6699ff',
    accentColor: '#e6f0ff',
  },

  hero_remilia: {
    id: 'hero_remilia',
    name: '蕾米莉亚',
    title: '永远鲜红的幼月 · 红魔馆之主',
    alignment: 'death',
    level: 5,
    baseStats: {
      attack: 17,
      defense: 14,
      minDamage: 25,
      maxDamage: 35,
      maxHp: 210,
      speed: 8,
      initiative: 13,
      range: 8,
      ammo: 14,
      morale: 2,
      luck: 3,
      magicResistance: 0.16,
      grazeChance: 0.14,
      spellPower: 13,
      maxMana: 58,
    },
    abilities: {
      ranged: true,
      flying: true,
      noMeleePenalty: true,
      unlimitedRetaliation: true,
      lifeDraining: true,
    },
    innateTraitIds: ['remilia_scarlet_destiny'],
    knownSpellIds: [
      'death_curse',
      'death_cancellation',
      'death_disrupting_ray',
      'death_poison',
      'death_raise_skeletons',
      'death_animate_dead',
      'death_fatigue',
      'death_life_drain',
      'death_sorrow',
      'death_unholy_song',
      'death_weakness',
      'death_aura_of_fear',
      'death_magic_leech',
      'death_mass_cancellation',
      'death_mass_curse',
      'death_plague',
      'death_raise_ghost',
      'death_death_call',
      'death_mass_sorrow',
      'death_mass_weakness',
      'death_vampiric_touch',
      'death_hand_of_death',
      'death_raise_vampires',
      'death_sacrifice',
      'chaos_magic_arrow',
      'chaos_haste',
      'chaos_bloodlust',
      'chaos_fire_bolt',
    ],
    signatureSpellCardId: 'remilia_gungnir',
    initialSkills: {
      death_magic: 5,
      nobility: 3,
      combat: 3,
      tactics: 3,
    },
    initialSubSkills: {
      occultism: 4,
      demonology: 3,
      necromancy: 3,
      estates: 2,
      diplomacy: 2,
      melee: 2,
      archery: 2,
      magic_resistance: 2,
      offense: 2,
      defense: 2,
    },
    initialSelectedClassId: 'shadow_lord',
    initialPotions: [
      { potionId: 'healing_elixir', charges: 2 },
      { potionId: 'spirit_draught', charges: 1 },
      { potionId: 'iron_barrier_oil', charges: 1 },
    ],
    initialArtifacts: ['gungnir_spear', 'scarlet_tea_cup'],
    footprint: '1x1',
    voxelBlueprintId: 'hero_remilia',
    themeColor: '#d92659',
    accentColor: '#ff9eb8',
  },
};

/**
 * 全量量产兵种静态定义（方案 C：H4 生态骨架与数值预算同构 + 东方幻想乡深度重塑）
 * - 完整收录：信仰圣域 · 生命系（8 兵种）+ 魔导结社 · 混沌系（8 兵种）+ 储备他系兵种
 */
export const CREATURE_DEFINITIONS: Record<string, CreatureDefinition> = {
  // =========================================================================
  // 一、信仰圣域 · 生命系（完整 8 兵种：T1 双建 + T2/T3/T4 二选一互斥）
  // =========================================================================

  /** 生命 T1-A：博丽毛玉 · 符箓定身 + 无限反击 */
  kedama: {
    id: 'kedama',
    name: '博丽毛玉',
    tier: 1,
    alignment: 'life',
    branchTag: 't1_a',
    footprint: '1x1',
    description: '信仰圣域 1 阶生命系近战群兵：成群弹跳突进，具备「无限反击」，撞击时有概率触发「符箓定身」封锁敌军 1 回合。',
    baseStats: {
      attack: 9,
      defense: 11,
      minDamage: 3,
      maxDamage: 4,
      maxHp: 18,
      speed: 6,
      initiative: 9,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 1,
      magicResistance: 0.05,
      grazeChance: 0.05,
    },
    abilities: {
      stunOnHit: true,
      unlimitedRetaliation: true,
    },
    voxelBlueprintId: 'creature_kedama',
    themeColor: '#f0ece1',
    accentColor: '#e64c65',
  },

  /** 生命 T1-B（对标 H4 Crossbowman）：御札弓手 · 精准无衰减 + 远程先攻 */
  ofuda_archer: {
    id: 'ofuda_archer',
    name: '御札弓手',
    tier: 1,
    alignment: 'life',
    branchTag: 't1_b',
    footprint: '1x1',
    description: '信仰圣域 1 阶生命系远程主力：投射贯穿灵札，「精准射击」无视一切距离衰减，且具备「远程先攻」在远程互射中抢先压制敌方还击。',
    baseStats: {
      attack: 11,
      defense: 10,
      minDamage: 3,
      maxDamage: 5,
      maxHp: 15,
      speed: 6,
      initiative: 9,
      range: 8,
      ammo: 12,
      morale: 1,
      luck: 1,
      magicResistance: 0.05,
      grazeChance: 0.05,
    },
    abilities: {
      ranged: true,
      longRange: true,
      rangedFirstStrike: true,
    },
    voxelBlueprintId: 'creature_ofuda_archer',
    themeColor: '#f2e8d5',
    accentColor: '#d93d54',
  },

  /** 生命 T2-A（对标 H4 Pikeman）：镇守狛犬 · 长武器(隔格免反击) + 破先攻 */
  shrine_komainu: {
    id: 'shrine_komainu',
    name: '镇守狛犬',
    tier: 2,
    alignment: 'life',
    branchTag: 'a',
    footprint: '2x2',
    description: '信仰圣域 2 阶生命系重装护卫：大型 2×2 神社石狮神兽，拥有稀有「长武器」特技可隔格扑击且不受非长手反击，同时自带「破先攻」！',
    baseStats: {
      attack: 13,
      defense: 16,
      minDamage: 7,
      maxDamage: 10,
      maxHp: 45,
      speed: 6,
      initiative: 9,
      range: 1,
      ammo: 0,
      morale: 2,
      luck: 1,
      magicResistance: 0.12,
      grazeChance: 0.05,
    },
    abilities: {
      longWeapon: true,
      negateFirstStrike: true,
    },
    voxelBlueprintId: 'creature_komainu',
    themeColor: '#d8cfb8',
    accentColor: '#e64c65',
  },

  /** 生命 T2-B（对标 H4 Ballista）：阴阳浮游炮 · 器灵 + 精准 + 无视障碍 */
  yinyang_turret: {
    id: 'yinyang_turret',
    name: '阴阳浮游炮',
    tier: 2,
    alignment: 'life',
    branchTag: 'b',
    footprint: '1x1',
    description: '信仰圣域 2 阶生命系精准炮台：悬浮机械造物，「精准射击」且「无视障碍」衰减，免疫士气波动与心智魔法！',
    baseStats: {
      attack: 16,
      defense: 16,
      minDamage: 8,
      maxDamage: 11,
      maxHp: 42,
      speed: 5,
      initiative: 9,
      range: 9,
      ammo: 20,
      morale: 0,
      luck: 0,
      magicResistance: 0.25,
      grazeChance: 0.05,
    },
    abilities: {
      ranged: true,
      flying: true,
      mechanical: true,
      longRange: true,
      noObstaclePenalty: true,
      noMelee: true,
    },
    voxelBlueprintId: 'creature_yinyang_turret',
    themeColor: '#f7f1e1',
    accentColor: '#d4354c',
  },

  /** 生命 T3-A（对标 H4 Crusader）：退魔剑士 · 双重攻击 + 抗死结界 */
  exorcist_blade: {
    id: 'exorcist_blade',
    name: '退魔剑士',
    tier: 3,
    alignment: 'life',
    branchTag: 'a',
    footprint: '1x1',
    description: '信仰圣域 3 阶生命系破邪精英：主动攻伐连续挥出「双重攻击」，自带「抗死结界」克制死亡系、混沌系与暗系敌军！',
    baseStats: {
      attack: 21,
      defense: 21,
      minDamage: 12,
      maxDamage: 17,
      maxHp: 75,
      speed: 7,
      initiative: 12,
      range: 1,
      ammo: 0,
      morale: 2,
      luck: 1,
      magicResistance: 0.15,
      grazeChance: 0.05,
    },
    abilities: {
      doubleStrike: true,
      deathWard: true,
    },
    voxelBlueprintId: 'creature_exorcist_blade',
    themeColor: '#f5d27a',
    accentColor: '#d9384f',
  },

  /** 生命 T3-B（对标 H4 Monk）：净邪巫女 · 远程施法 + 抗死结界 */
  prayer_maiden: {
    id: 'prayer_maiden',
    name: '净邪巫女',
    tier: 3,
    alignment: 'life',
    branchTag: 'b',
    footprint: '1x1',
    description: '信仰圣域 3 阶生命系神术射手：远程净化弹幕与「抗死结界」，且可开启魔导折本施放生命魔法治愈与护身结界！',
    baseStats: {
      attack: 20,
      defense: 19,
      minDamage: 13,
      maxDamage: 18,
      maxHp: 62,
      speed: 6,
      initiative: 11,
      range: 9,
      ammo: 14,
      morale: 2,
      luck: 2,
      magicResistance: 0.2,
      grazeChance: 0.05,
      spellPower: 5,
      maxMana: 18,
    },
    abilities: {
      ranged: true,
      deathWard: true,
      spellcaster: true,
    },
    knownSpellIds: ['life_heal', 'life_ward'],
    voxelBlueprintId: 'creature_prayer_maiden',
    themeColor: '#f5e9dc',
    accentColor: '#e64c65',
  },

  /** 生命 T4-A（对标 H4 Champion · 2000金高产4阶）：御柱天马 · 先攻 + 冲锋增伤 */
  onbashira_steed: {
    id: 'onbashira_steed',
    name: '御柱天马',
    tier: 4,
    alignment: 'life',
    branchTag: 'a',
    footprint: '2x1',
    description: '信仰圣域 4 阶生命系突击神骑：2×1 疾驰御柱天马，「先攻」配合「冲锋增伤」长驱直入一枪破阵！',
    baseStats: {
      attack: 22,
      defense: 22,
      minDamage: 27,
      maxDamage: 39,
      maxHp: 180,
      speed: 8,
      initiative: 13,
      range: 1,
      ammo: 0,
      morale: 2,
      luck: 2,
      magicResistance: 0.22,
      grazeChance: 0.05,
    },
    abilities: {
      firstStrike: true,
      charge: true,
    },
    voxelBlueprintId: 'creature_onbashira_steed',
    themeColor: '#ffe082',
    accentColor: '#e64c65',
  },

  /** 生命 T4-B（对标 H4 Angel）：神使 · 飞行 + 返魂苏生复活 */
  hakurei_seraph: {
    id: 'hakurei_seraph',
    name: '神使',
    tier: 4,
    alignment: 'life',
    branchTag: 'b',
    footprint: '1x2',
    description: '信仰圣域 4 阶生命系终极神使：凌空振翅「飞行」，掌握高阶生命魔法「博丽返魂苏生」，可令阵亡活体友军重返战阵！',
    baseStats: {
      attack: 27,
      defense: 28,
      minDamage: 34,
      maxDamage: 52,
      maxHp: 215,
      speed: 9,
      initiative: 15,
      range: 1,
      ammo: 0,
      morale: 3,
      luck: 2,
      magicResistance: 0.25,
      grazeChance: 0.05,
      spellPower: 9,
      maxMana: 24,
    },
    abilities: {
      flying: true,
      resurrection: true,
      spellcaster: true,
    },
    knownSpellIds: ['life_resurrection', 'life_heal'],
    voxelBlueprintId: 'creature_hakurei_seraph',
    themeColor: '#fff0b8',
    accentColor: '#ff526b',
  },

  // =========================================================================
  // 二、魔导结社 · 混沌系（完整 8 兵种：T1 双建 + T2/T3/T4 二选一互斥）
  // =========================================================================

  /** 混沌 T1-A：夜影使魔 · 影遁潜行 + 暗系 */
  forest_shadow_imp: {
    id: 'forest_shadow_imp',
    name: '夜影使魔',
    tier: 1,
    alignment: 'chaos',
    branchTag: 't1_a',
    footprint: '1x1',
    description: '魔导结社 1 阶混沌系暗袭刺客：「影遁潜行」赋予极高擦弹与先手，具备暗系特质对普通活体额外增伤，专切脆弱后排！',
    baseStats: {
      attack: 10,
      defense: 9,
      minDamage: 3,
      maxDamage: 4,
      maxHp: 14,
      speed: 8,
      initiative: 13,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 2,
      magicResistance: 0.05,
      grazeChance: 0.16,
    },
    abilities: {
      stealth: true,
      darkNature: true,
    },
    voxelBlueprintId: 'creature_shadow_imp',
    themeColor: '#8d66e8',
    accentColor: '#f6c945',
  },

  /** 混沌 T1-B（对标 H4 Orc）：魔法使 · 短程弹幕 + 近战无衰减 + 施法(魔导星矢) */
  broom_caster: {
    id: 'broom_caster',
    name: '魔法使',
    tier: 1,
    alignment: 'chaos',
    branchTag: 't1_b',
    footprint: '1x1',
    description: '魔导结社 1 阶混沌系施法游击术师：虽属「短程弹幕」但贴脸「近战无衰减」，且具备 4 点灵力可施放混沌魔法「魔导星矢」，无抗性时造成等同于满额远程最高伤害的稳定法伤。',
    baseStats: {
      attack: 11,
      defense: 9,
      minDamage: 3,
      maxDamage: 5,
      maxHp: 15,
      speed: 6,
      initiative: 10,
      range: 5,
      ammo: 8,
      morale: 1,
      luck: 1,
      magicResistance: 0.08,
      grazeChance: 0.05,
      spellPower: 2,
      maxMana: 4,
    },
    abilities: {
      ranged: true,
      shortRange: true,
      noMeleePenalty: true,
      spellcaster: true,
    },
    knownSpellIds: ['chaos_magic_arrow'],
    voxelBlueprintId: 'creature_broom_caster',
    themeColor: '#f2b84b',
    accentColor: '#e85d3f',
  },

  /** 混沌 T2-A（对标 H4 Minotaur）：武装人形 · 绝对格挡 + 机械构造 */
  hourai_doll: {
    id: 'hourai_doll',
    name: '武装人形',
    tier: 2,
    alignment: 'chaos',
    branchTag: 'a',
    footprint: '1x1',
    description: '魔导结社 2 阶混沌系自律前排：魔导操控的机械武装人形，35% 概率触发「绝对格挡」完全无伤挡下重击！',
    baseStats: {
      attack: 16,
      defense: 15,
      minDamage: 7,
      maxDamage: 11,
      maxHp: 46,
      speed: 6,
      initiative: 10,
      range: 1,
      ammo: 0,
      morale: 0,
      luck: 1,
      magicResistance: 0.15,
      grazeChance: 0.05,
    },
    abilities: {
      block: true,
      mechanical: true,
    },
    voxelBlueprintId: 'creature_hourai_doll',
    themeColor: '#7898f0',
    accentColor: '#f5d061',
  },

  /** 混沌 T2-B（对标 H4 Medusa/Mage）：禁忌之书 · 暗系 + 无限弹药 + 魔眼石化 + 施法 */
  grimoire_familiar: {
    id: 'grimoire_familiar',
    name: '禁忌之书',
    tier: 2,
    alignment: 'chaos',
    branchTag: 'b',
    footprint: '2x1',
    description: '魔导结社 2 阶混沌系暗系魔导炮台：2×1 浮空禁忌魔典，「无限弹药」且命中概率触发「魔眼石化」即死，兼可施放混沌魔法与死亡魔法。',
    baseStats: {
      attack: 16,
      defense: 12,
      minDamage: 7,
      maxDamage: 10,
      maxHp: 30,
      speed: 7,
      initiative: 12,
      range: 8,
      ammo: 0,
      morale: 1,
      luck: 1,
      magicResistance: 0.2,
      grazeChance: 0.05,
      spellPower: 5,
      maxMana: 24,
    },
    abilities: {
      ranged: true,
      flying: true,
      noMelee: true,
      unlimitedShots: true,
      stoneGaze: true,
      spellcaster: true,
      darkNature: true,
    },
    knownSpellIds: ['death_curse', 'chaos_star_bolt'],
    voxelBlueprintId: 'creature_grimoire',
    themeColor: '#a86bf5',
    accentColor: '#f6c945',
  },

  /** 混沌 T3-A（对标 H4 Nightmare）：梦境兽 · 噩梦震慑 */
  miasma_nightmare: {
    id: 'miasma_nightmare',
    name: '梦境兽',
    tier: 3,
    alignment: 'chaos',
    branchTag: 'a',
    footprint: '2x1',
    description: '魔导结社 3 阶混沌系梦境奇兽：2×1 暗系星梦喰梦兽，高生命高攻且近战命中概率触发「噩梦震慑」令活体敌军坠入梦魇跳过回合！',
    baseStats: {
      attack: 22,
      defense: 20,
      minDamage: 14,
      maxDamage: 24,
      maxHp: 115,
      speed: 8,
      initiative: 13,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 1,
      magicResistance: 0.22,
      grazeChance: 0.05,
    },
    abilities: {
      terrorOnHit: true,
      darkNature: true,
    },
    voxelBlueprintId: 'creature_nightmare',
    themeColor: '#8b70ff',
    accentColor: '#ff70b8',
  },

  /** 混沌 T3-B（对标 H4 Efreet）：法界之火 · 飞行 + 烈焰护盾 + 炽焰抗性 */
  starfire_efreet: {
    id: 'starfire_efreet',
    name: '法界之火',
    tier: 3,
    alignment: 'chaos',
    branchTag: 'b',
    footprint: '1x2',
    description: '魔导结社 3 阶混沌系魔界元素：源自魔界法界的永燃炎灵，凌空「飞行」且免疫火焰伤害，缠身「烈焰护盾」反灼一切近战来犯者！',
    baseStats: {
      attack: 23,
      defense: 20,
      minDamage: 14,
      maxDamage: 22,
      maxHp: 88,
      speed: 8,
      initiative: 13,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 2,
      magicResistance: 0.2,
      grazeChance: 0.05,
    },
    abilities: {
      flying: true,
      fireShield: true,
      fireResistant: true,
      elemental: true,
    },
    voxelBlueprintId: 'creature_efreet',
    themeColor: '#f04299',
    accentColor: '#ffe066',
  },

  /** 混沌 T4-A（对标 H4 Hydra）：魔导巨像 · 不受反击 + 周身全扫 + 攻城破墙 + 器灵构造 */
  arcane_colossus: {
    id: 'arcane_colossus',
    name: '魔导巨像',
    tier: 4,
    alignment: 'chaos',
    branchTag: 'a',
    footprint: '2x2',
    description: '魔导结社 4 阶混沌系魔晶巨像：由黑曜符文石与高能星辉魔晶构筑的 2×2 机械巨神，「不受反击」且「周身全扫」横扫四周全部敌军！',
    baseStats: {
      attack: 25,
      defense: 25,
      minDamage: 28,
      maxDamage: 46,
      maxHp: 260,
      speed: 7,
      initiative: 11,
      range: 1,
      ammo: 0,
      morale: 0,
      luck: 1,
      magicResistance: 0.5,
      grazeChance: 0.05,
    },
    abilities: {
      noRetaliation: true,
      multipleAttack: true,
      siegeBreaker: true,
      mechanical: true,
    },
    voxelBlueprintId: 'creature_arcane_colossus',
    themeColor: '#9c5cff',
    accentColor: '#ffe073',
  },

  /** 混沌 T4-B（对标 H4 Black Dragon）：红莲魔龙 · 飞行 + 全魔法免疫 + 贯穿吐息 */
  crimson_star_dragon: {
    id: 'crimson_star_dragon',
    name: '红莲魔龙',
    tier: 4,
    alignment: 'chaos',
    branchTag: 'b',
    footprint: '2x2',
    description: '魔导结社 4 阶混沌系终极霸主：2×2 凌空巨龙，「全魔法免疫」绝对无视一切敌我法术与符卡结界，「贯穿吐息」一击焚尽前后两排！',
    baseStats: {
      attack: 34,
      defense: 34,
      minDamage: 52,
      maxDamage: 92,
      maxHp: 370,
      speed: 9,
      initiative: 14,
      range: 1,
      ammo: 0,
      morale: 2,
      luck: 2,
      magicResistance: 1,
      grazeChance: 0.05,
    },
    abilities: {
      flying: true,
      magicImmune: true,
      breathAttack: true,
      fireResistant: true,
    },
    voxelBlueprintId: 'creature_crimson_dragon',
    themeColor: '#d9293e',
    accentColor: '#ffcf56',
  },

  // =========================================================================
  // 三、既有储备他系兵种（留待自然/秩序/死亡/守矢阵营与单测兼容使用，零回归）
  // =========================================================================

  /** 储备 2×2 攻城机兵与召唤模板 */
  ...H4_SUMMON_TEMPLATES,

  // =========================================================================
  // 三、幻月庭园 · 秩序系（完整 8 兵种：T1 双建 + T2/T3/T4 二选一互斥）
  // =========================================================================

  /** 秩序 T1-A（对标 H4 Dwarf + 原创妖兔变身）：竹林妖怪兔 · 30% 魔抗 + 99MP 专属变身术「兔化」 */
  youkai_rabbit: {
    id: 'youkai_rabbit',
    name: '竹林妖怪兔',
    tier: 1,
    alignment: 'order',
    branchTag: 't1_a',
    footprint: '1x1',
    description: '幻月庭园 1 阶秩序系抗魔施法妖兔：天生 30% 魔法抗性与 99 MP 灵力池，可施放自用变身术「兔化」化作妖兔真身，获得「先攻」且位移距离、先手主动与擦弹率各 +50%（持续 3 回合）。',
    baseStats: {
      attack: 10,
      defense: 11,
      minDamage: 3,
      maxDamage: 4,
      maxHp: 18,
      speed: 5,
      initiative: 9,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 2,
      magicResistance: 0.3,
      grazeChance: 0.05,
      spellPower: 3,
      maxMana: 99,
    },
    abilities: {
      spellcaster: true,
    },
    knownSpellIds: ['order_rabbit_transform'],
    voxelBlueprintId: 'creature_rabbit',
    themeColor: '#8ab4ff',
    accentColor: '#ffd0e0',
  },

  /** 秩序 T1-B（对标 H4 Halfling）：玉兔掷弹兵 · 弹弓远程 + 巨人杀手（对 4 阶 +50%） */
  lunar_slinger: {
    id: 'lunar_slinger',
    name: '玉兔掷弹兵',
    tier: 1,
    alignment: 'order',
    branchTag: 't1_b',
    footprint: '1x1',
    description: '幻月庭园 1 阶秩序系弹弓射手：以灵巧月木弹弓甩射星石弹丸，具备「巨人杀手」专克 4 阶庞然巨兽。',
    baseStats: {
      attack: 10,
      defense: 9,
      minDamage: 2,
      maxDamage: 5,
      maxHp: 13,
      speed: 6,
      initiative: 11,
      range: 6,
      ammo: 14,
      morale: 1,
      luck: 3,
      magicResistance: 0.1,
      grazeChance: 0.05,
    },
    abilities: {
      ranged: true,
      giantSlayer: true,
    },
    voxelBlueprintId: 'creature_lunar_slinger',
    themeColor: '#7eb2ff',
    accentColor: '#ffe299',
  },

  /** 秩序 T2-A（对标 H4 Mage）：幻法狸妖 · 远程 + 秩序施法者 */
  tanuki_illusionist: {
    id: 'tanuki_illusionist',
    name: '幻法狸妖',
    tier: 2,
    alignment: 'order',
    branchTag: 'a',
    footprint: '1x1',
    description: '幻月庭园 2 阶秩序系远程术士：善使叶化幻法与星律咒术，可远程投射妖火并施放念力重拳、蜃气残影、星律解咒与畏惧之瞳。',
    baseStats: {
      attack: 12,
      defense: 11,
      minDamage: 6,
      maxDamage: 8,
      maxHp: 31,
      speed: 6,
      initiative: 11,
      range: 7,
      ammo: 10,
      morale: 1,
      luck: 1,
      magicResistance: 0.15,
      grazeChance: 0.05,
      spellPower: 5,
      maxMana: 14,
    },
    abilities: {
      ranged: true,
      spellcaster: true,
    },
    knownSpellIds: ['order_magic_fist', 'order_blur', 'order_dispel', 'order_cowardice'],
    voxelBlueprintId: 'creature_tanuki_illusionist',
    themeColor: '#8d9cff',
    accentColor: '#7ce8c8',
  },

  /** 秩序 T2-B（对标 H4 Gold Golem 非机械大改）：重装月兔近卫 · 活体 50% 魔抗 + 破先攻铁壁 */
  armored_lunar_guard: {
    id: 'armored_lunar_guard',
    name: '重装月兔近卫',
    tier: 2,
    alignment: 'order',
    branchTag: 'b',
    footprint: '1x1',
    description: '幻月庭园 2 阶秩序系重甲活体铁壁：披挂月都秘银大铠与新月鸢盾，享有 50% 魔法抗性与「破先攻」稳健反制，且仍可受士气鼓舞与生命治愈。',
    baseStats: {
      attack: 15,
      defense: 18,
      minDamage: 8,
      maxDamage: 12,
      maxHp: 56,
      speed: 5,
      initiative: 8,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 1,
      magicResistance: 0.5,
      grazeChance: 0.05,
    },
    abilities: {
      negateFirstStrike: true,
    },
    voxelBlueprintId: 'creature_armored_lunar_guard',
    themeColor: '#9ab6f5',
    accentColor: '#f5d98c',
  },

  /** 秩序 T3-A（对标 H4 Genie 移除飞行 + 有限距离瞬移）：幻月妖 · 短距瞬移全能秩序施法核心 */
  lunar_genie: {
    id: 'lunar_genie',
    name: '幻月妖',
    tier: 3,
    alignment: 'order',
    branchTag: 'a',
    footprint: '1x1',
    description: '幻月庭园 3 阶秩序系陆行施法核心：具备受移动力约束的「瞬间移动」可越障闪现至 4 格内陆地空位，精通极寒冰瀑、蜃楼幻影、时计缓流、镇魂神乐与神乐欢欣五大战术神术。',
    baseStats: {
      attack: 16,
      defense: 16,
      minDamage: 10,
      maxDamage: 14,
      maxHp: 56,
      speed: 4,
      initiative: 12,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 2,
      magicResistance: 0.25,
      grazeChance: 0.05,
      spellPower: 7,
      maxMana: 22,
    },
    abilities: {
      spellcaster: true,
      teleport: true,
    },
    knownSpellIds: ['order_ice_bolt', 'order_create_illusion', 'order_slow', 'life_song_of_peace', 'life_mirth'],
    voxelBlueprintId: 'creature_lunar_genie',
    themeColor: '#78b0ff',
    accentColor: '#e2d4ff',
  },

  /** 秩序 T3-B（对标 H4 Naga）：战斗 II 型 · 河童重工六臂人形机械，1×2 高挑机身，机械 + 不受反击 */
  combat_mk2: {
    id: 'combat_mk2',
    name: '战斗 II 型',
    tier: 3,
    alignment: 'order',
    branchTag: 'b',
    footprint: '1x2',
    description: '幻月庭园 3 阶秩序系河童重工六臂人形机械：1×2 高挑高机动装甲机身，六柄高频光刃齐斩「不受反击」，以机械构造免疫心智与士气动摇。',
    baseStats: {
      attack: 21,
      defense: 19,
      minDamage: 15,
      maxDamage: 22,
      maxHp: 90,
      speed: 6,
      initiative: 11,
      range: 1,
      ammo: 0,
      morale: 0,
      luck: 1,
      magicResistance: 0.2,
      grazeChance: 0.05,
    },
    abilities: {
      mechanical: true,
      noRetaliation: true,
    },
    voxelBlueprintId: 'creature_combat_mk2',
    themeColor: '#5cb8d6',
    accentColor: '#ffd166',
  },

  /** 秩序 T4-A（对标 H4 Titan + 原创净秽增强）：净秽者 · 远程重炮 + 近战无衰减 + 净秽裁决(+20%) + 混沌/雷电抗性(25%) */
  purity_titan: {
    id: 'purity_titan',
    name: '净秽者',
    tier: 4,
    alignment: 'order',
    branchTag: 'a',
    footprint: '1x2',
    description: '幻月庭园 4 阶秩序系月都终极射手：1×2 高挑净世圣铠，远程打击对非秩序阵营额外造成 +20% 净秽裁决伤害，且近战无衰减、兼备 25% 混沌与雷电抗性。',
    baseStats: {
      attack: 26,
      defense: 24,
      minDamage: 32,
      maxDamage: 46,
      maxHp: 210,
      speed: 6,
      initiative: 11,
      range: 9,
      ammo: 14,
      morale: 1,
      luck: 2,
      magicResistance: 0.15,
      grazeChance: 0.05,
    },
    abilities: {
      ranged: true,
      noMeleePenalty: true,
      orderPurgeRanged: true,
      chaosResistant: true,
      lightningResistant: true,
    },
    voxelBlueprintId: 'creature_purity_titan',
    themeColor: '#c9dcff',
    accentColor: '#74d2ff',
  },

  /** 秩序 T4-B（对标 H4 Dragon Golem）：非想天则 · 2×2 机关巨神，机械 + 先攻 + 破先攻 + 攻城破墙 */
  hisoutensoku: {
    id: 'hisoutensoku',
    name: '非想天则',
    tier: 4,
    alignment: 'order',
    branchTag: 'b',
    footprint: '2x2',
    description: '幻月庭园 4 阶秩序系 2×2 机关巨神：雄伟挺拔的蒸汽星辉巨躯，集机械构造、先攻、破先攻与攻城破墙于一身，专以铁拳压制一切先手强敌。',
    baseStats: {
      attack: 28,
      defense: 27,
      minDamage: 36,
      maxDamage: 55,
      maxHp: 255,
      speed: 6,
      initiative: 11,
      range: 1,
      ammo: 0,
      morale: 0,
      luck: 1,
      magicResistance: 0.3,
      grazeChance: 0.05,
    },
    abilities: {
      mechanical: true,
      firstStrike: true,
      negateFirstStrike: true,
      siegeBreaker: true,
    },
    voxelBlueprintId: 'creature_hisoutensoku',
    themeColor: '#e87a3e',
    accentColor: '#ffd95a',
  },

  // =========================================================================
  // 四、幽冥公馆 · 死亡系（完整 8 城镇兵种 + 深渊冰魔召唤物）
  // =========================================================================

  /** 死亡 T1-A（对标 H4 Skeleton）：尸壳 · 不死 + 骸骨体质（远程防御 +100%） */
  corpse_husk: {
    id: 'corpse_husk',
    name: '尸壳',
    tier: 1,
    alignment: 'death',
    branchTag: 't1_a',
    footprint: '1x1',
    description: '幽冥公馆 1 阶死亡系不死前排：贴附冥界灵符苏醒的娇小尸壳傀儡，兼具「不死」免疫心智与「骸骨体质」承受远程打击时有效防御 +100%。',
    baseStats: {
      attack: 10,
      defense: 14,
      minDamage: 3,
      maxDamage: 4,
      maxHp: 16,
      speed: 5,
      initiative: 8,
      range: 1,
      ammo: 0,
      morale: 0,
      luck: 1,
      magicResistance: 0.05,
      grazeChance: 0.05,
    },
    abilities: {
      undead: true,
      skeletal: true,
    },
    voxelBlueprintId: 'creature_corpse_husk',
    themeColor: '#8e82b8',
    accentColor: '#f5e49c',
  },

  /** 死亡 T1-B（对标 H4 Imp）：小恶魔 · 飞行 + 魔力吸取 + 施法(诅咒 6MP) + 暗系 */
  koakuma_imp: {
    id: 'koakuma_imp',
    name: '小恶魔',
    tier: 1,
    alignment: 'death',
    branchTag: 't1_b',
    footprint: '1x1',
    description: '幽冥公馆 1 阶死亡系红魔馆暗系使魔：灵巧「飞行」且每回合行动前自动触发「魔力吸取」窃取敌方施法者灵力供给友军，自带 6 MP 可施放「厄祟诅咒」。',
    baseStats: {
      attack: 13,
      defense: 9,
      minDamage: 2,
      maxDamage: 4,
      maxHp: 13,
      speed: 7,
      initiative: 12,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 2,
      magicResistance: 0.12,
      grazeChance: 0.05,
      spellPower: 2,
      maxMana: 6,
    },
    abilities: {
      flying: true,
      manaLeech: true,
      spellcaster: true,
      darkNature: true,
    },
    knownSpellIds: ['death_curse'],
    voxelBlueprintId: 'creature_koakuma_imp',
    themeColor: '#e04f6b',
    accentColor: '#ffd4e0',
  },

  /** 死亡 T2-A（对标 H4 Ghost）：怨灵 · 飞行 + 不死 + 衰老触碰 + 虚无体质（双防 +100%） */
  wraith_spirit: {
    id: 'wraith_spirit',
    name: '怨灵',
    tier: 2,
    alignment: 'death',
    branchTag: 'a',
    footprint: '1x2',
    description: '幽冥公馆 2 阶死亡系幽灵战力：1×2 轻盈漂浮的「不死」灵体，凭「虚无体质」令近战与远程有效防御翻倍，近战命中附带概率「衰老触碰」大幅削弱活体敌军！',
    baseStats: {
      attack: 14,
      defense: 13,
      minDamage: 6,
      maxDamage: 9,
      maxHp: 28,
      speed: 7,
      initiative: 12,
      range: 1,
      ammo: 0,
      morale: 0,
      luck: 1,
      magicResistance: 0.15,
      grazeChance: 0.05,
    },
    abilities: {
      flying: true,
      undead: true,
      agingOnHit: true,
      insubstantial: true,
    },
    voxelBlueprintId: 'creature_wraith_spirit',
    themeColor: '#6de8f2',
    accentColor: '#c39bff',
  },

  /** 死亡 T2-B（对标 H4 Cerberus + 额外飞行）：地狱鸦 · 2×1 飞行 + 不受反击 + 三翼裂袭 */
  hell_raven: {
    id: 'hell_raven',
    name: '地狱鸦',
    tier: 2,
    alignment: 'death',
    branchTag: 'b',
    footprint: '2x1',
    description: '幽冥公馆 2 阶死亡系高速突袭群鸦：2×1 展翼黑羽地狱鸦群，凌空「飞行」并兼备「不受反击」与「三翼裂袭」横扫主目标两侧邻格，高机动脆身板专割后排！',
    baseStats: {
      attack: 16,
      defense: 12,
      minDamage: 7,
      maxDamage: 10,
      maxHp: 34,
      speed: 8,
      initiative: 13,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 1,
      magicResistance: 0.1,
      grazeChance: 0.05,
    },
    abilities: {
      flying: true,
      noRetaliation: true,
      threeHeadedAttack: true,
    },
    voxelBlueprintId: 'creature_hell_raven',
    themeColor: '#3f3454',
    accentColor: '#ff526b',
  },

  /** 死亡 T3-A（对标 H4 Vampire）：血族眷属 · 不死 + 飞行 + 不受反击 + 吸血复苏 + 暗系 */
  crimson_vampire: {
    id: 'crimson_vampire',
    name: '血族眷属',
    tier: 3,
    alignment: 'death',
    branchTag: 'a',
    footprint: '1x1',
    description: '幽冥公馆 3 阶死亡系红魔夜族精锐：「不死」「暗系」「飞行」且「不受反击」，近战命中活体目标自动触发「吸血复苏」将 50% 伤害化为生命并复活阵亡同袍！',
    baseStats: {
      attack: 21,
      defense: 19,
      minDamage: 13,
      maxDamage: 19,
      maxHp: 78,
      speed: 8,
      initiative: 13,
      range: 1,
      ammo: 0,
      morale: 0,
      luck: 2,
      magicResistance: 0.15,
      grazeChance: 0.05,
    },
    abilities: {
      undead: true,
      flying: true,
      noRetaliation: true,
      lifeDraining: true,
      darkNature: true,
    },
    voxelBlueprintId: 'creature_crimson_vampire',
    themeColor: '#d4335c',
    accentColor: '#ffd4e2',
  },

  /** 死亡 T3-B（对标 H4 Venom Spawn）：毒瘴妖 · 高血远程 + 瞬发剧毒喷射 */
  miasma_venom_youkai: {
    id: 'miasma_venom_youkai',
    name: '毒瘴妖',
    tier: 3,
    alignment: 'death',
    branchTag: 'b',
    footprint: '1x1',
    description: '幽冥公馆 3 阶死亡系铃兰瘴毒射手：高生命耐打体魄，远程投射剧毒瘴弹，命中活体目标必瞬发「剧毒喷射」（每只 13 点无视防御毒伤）并每回合持续流血！',
    baseStats: {
      attack: 17,
      defense: 19,
      minDamage: 15,
      maxDamage: 20,
      maxHp: 95,
      speed: 6,
      initiative: 10,
      range: 7,
      ammo: 14,
      morale: 1,
      luck: 1,
      magicResistance: 0.15,
      grazeChance: 0.05,
    },
    abilities: {
      ranged: true,
      poisonAttack: true,
    },
    voxelBlueprintId: 'creature_miasma_venom',
    themeColor: '#75c86b',
    accentColor: '#c87cff',
  },

  /** 死亡 T4-A（对标 H4 Bone Dragon）：骸骨巨龙 · 2×2 飞行 + 不死 + 骸骨体质 + 死灵恐惧 */
  bone_dragon: {
    id: 'bone_dragon',
    name: '骸骨巨龙',
    tier: 4,
    alignment: 'death',
    branchTag: 'a',
    footprint: '2x2',
    description: '幽冥公馆 4 阶死亡系冥界骨龙：2×2 凌空翱翔的紫焰晶骨巨龙，「不死」且自带「骸骨体质」（远程防 +100%）与「死灵恐惧」（令非免疫敌军不敢反击）！',
    baseStats: {
      attack: 26,
      defense: 25,
      minDamage: 32,
      maxDamage: 48,
      maxHp: 225,
      speed: 8,
      initiative: 13,
      range: 1,
      ammo: 0,
      morale: 0,
      luck: 1,
      magicResistance: 0.25,
      grazeChance: 0.05,
    },
    abilities: {
      flying: true,
      undead: true,
      skeletal: true,
      fearAttack: true,
    },
    voxelBlueprintId: 'creature_bone_dragon',
    themeColor: '#dcd6f0',
    accentColor: '#b56bff',
  },

  /** 死亡 T4-B（对标 H4 Devil）：深渊隙间恶魔 · 1×2 全图瞬移 + 抗生结界 + 召唤深渊冰魔 + 暗系 */
  abyss_gap_devil: {
    id: 'abyss_gap_devil',
    name: '深渊隙间恶魔',
    tier: 4,
    alignment: 'death',
    branchTag: 'b',
    footprint: '1x2',
    description: '幽冥公馆 4 阶死亡系深渊暗系魔王：1×2 高挑魔姬，拥有无视距离限制的「深渊瞬移」一步直达全图任意空位，自带「抗生结界」（克生命系）与 8 MP「深渊冰魔召唤」！',
    baseStats: {
      attack: 27,
      defense: 25,
      minDamage: 31,
      maxDamage: 47,
      maxHp: 205,
      speed: 7,
      initiative: 14,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 2,
      magicResistance: 0.2,
      grazeChance: 0.05,
      spellPower: 8,
      maxMana: 8,
    },
    abilities: {
      globalTeleport: true,
      lifeWard: true,
      spellcaster: true,
      darkNature: true,
    },
    knownSpellIds: ['death_summon_ice_demon'],
    voxelBlueprintId: 'creature_abyss_gap_devil',
    themeColor: '#b8255f',
    accentColor: '#ffd466',
  },

  /** 死亡召唤物（对标 H4 Ice Demon）：深渊冰魔 · 暗系 + 寒冰抗性 + 寒霜冻结 */
  abyss_ice_demon: {
    id: 'abyss_ice_demon',
    name: '深渊冰魔',
    tier: 3,
    alignment: 'death',
    branchTag: 'neutral',
    footprint: '1x1',
    description: '深渊隙间恶魔唤来的 3 阶暗系冰魔少女：天生「寒冰抗性」（免疫冰系法术且寒冰承伤减半），近战命中触发「寒霜冻结」有概率冰封目标 2 回合！',
    baseStats: {
      attack: 19,
      defense: 18,
      minDamage: 12,
      maxDamage: 17,
      maxHp: 72,
      speed: 6,
      initiative: 11,
      range: 1,
      ammo: 0,
      morale: 1,
      luck: 1,
      magicResistance: 0.15,
      grazeChance: 0.05,
    },
    abilities: {
      darkNature: true,
      coldResistant: true,
      freezingAttack: true,
    },
    voxelBlueprintId: 'creature_abyss_ice_demon',
    themeColor: '#66ccff',
    accentColor: '#d09cff',
  },

  // =========================================================================
  // 五、其他阵营储备兵种（待后续扩展自然 / 力量完整 8 兵种）
  // =========================================================================
  sunflower_fairy: {
    id: 'sunflower_fairy',
    name: '向日葵妖精',
    tier: 2,
    alignment: 'nature',
    branchTag: 'neutral',
    footprint: '1x1',
    description: '自然森境 2 阶自然系轻盈射手：凌空飞行并挥洒密集花瓣弹幕。',
    baseStats: {
      attack: 12,
      defense: 9,
      minDamage: 5,
      maxDamage: 8,
      maxHp: 22,
      speed: 6,
      initiative: 11,
      range: 7,
      ammo: 12,
      morale: 1,
      luck: 2,
      magicResistance: 0.1,
      grazeChance: 0.05,
      spellPower: 3,
      maxMana: 16,
    },
    abilities: {
      ranged: true,
      flying: true,
    },
    voxelBlueprintId: 'creature_fairy',
    themeColor: '#5ee39a',
    accentColor: '#ffd95a',
  },

  shrine_guardian_golem: {
    id: 'shrine_guardian_golem',
    name: '御柱石狮子',
    tier: 3,
    alignment: 'life',
    branchTag: 'neutral',
    footprint: '2x2',
    description: '信仰圣域 3 阶生命系重装守护兽：2×2 玄石镇守巨兽，具备「无限反击」。',
    baseStats: {
      attack: 15,
      defense: 19,
      minDamage: 14,
      maxDamage: 19,
      maxHp: 72,
      speed: 6,
      initiative: 7,
      range: 1,
      ammo: 0,
      morale: 2,
      luck: 0,
      magicResistance: 0.2,
      grazeChance: 0.05,
    },
    abilities: {
      unlimitedRetaliation: true,
    },
    voxelBlueprintId: 'creature_golem',
    themeColor: '#d9c9a3',
    accentColor: '#e64c65',
  },

  vengeful_spirit: {
    id: 'vengeful_spirit',
    name: '地底怨灵',
    tier: 2,
    alignment: 'death',
    branchTag: 'neutral',
    footprint: '1x2',
    description: '幽冥楼府 2 阶死亡系不死灵体：1×2 拖曳幽冥尾焰漂浮，凌空「飞行」且「不受反击」。',
    baseStats: {
      attack: 15,
      defense: 10,
      minDamage: 8,
      maxDamage: 12,
      maxHp: 26,
      speed: 8,
      initiative: 13,
      range: 1,
      ammo: 0,
      morale: 0,
      luck: 1,
      magicResistance: 0.15,
      grazeChance: 0.05,
    },
    abilities: {
      flying: true,
      noRetaliation: true,
      undead: true,
    },
    voxelBlueprintId: 'creature_spirit',
    themeColor: '#56e8d5',
    accentColor: '#b366ff',
  },
};

/**
 * 暗夜幻想乡战场统一「斜 45° + 侧俯压扁」投影配置（渲染层、地图生成与单测唯一真相源）
 * - 严格保持经典的斜向视角（rotationRad = -0.56, ySquash = 0.58）
 * - 中心锚定在 offsetToAxial(10, 10) → 屏幕中心 (440, 302)，六边形半径 12.2px，
 *   让近千格斜向六边形完整铺满整个暗夜地面！
 */
export const SHRINE_FIELD_PROJECTION: HexProjectionConfig = (() => {
  const radius = 12.2;
  const centerAxial = offsetToAxial(10, 10);
  return {
    radius,
    ySquash: 0.58,
    originX: 440,
    originY: 302,
    elevationHeight: 9.0,
    rotationRad: -0.56,
    centerWorldX: radius * Math.sqrt(3) * (centerAxial.q + centerAxial.r / 2),
    centerWorldY: radius * 1.5 * centerAxial.r,
  };
})();

/**
 * 生成严格保持斜向（rotationRad = -0.56）且几乎铺满整个地面背景的超广阔不规则战场（~950+ 格！）
 * - 不再局限于局促的小斜矩形：直接在斜向旋转坐标系下将六边形向外延展至整个地面可视区域，
 *   并用多频有机轮廓曲线雕出自然起伏的林间空地边界（四角自然圆润收口，仅留适量风景留白）
 * - 完整保留所有经典战术地形与单测地标坐标（(6,6)玄石、(6,14)竹林、(8,3)高地、(8,10)灵泉等）
 */
export function buildShrineNightBattleMap(): {
  width: number;
  height: number;
  tiles: Record<string, HexTile>;
} {
  const width = 44;
  const height = 44;
  const tiles: Record<string, HexTile> = {};

  // 战略高地山坡（覆盖中央、南北两翼与斜向东西高坡）
  const highlands = new Set([
    // 中北高坡（含单测基准 (8,3)）
    '8,3', '9,3', '10,3', '11,3', '9,4', '10,4',
    // 中南高坡
    '9,16', '10,16', '11,16', '10,17', '11,17', '12,17',
    // 左翼与右翼外缘制高点
    '4,10', '5,10', '15,10', '16,10',
    '1,0', '2,0', '2,1', '3,1',
    '17,19', '18,19', '18,20', '19,20',
    '16,3', '17,3', '17,4',
    '3,17', '4,17', '4,18',
  ]);

  // 古老神社青石板参道（沿斜向主战轴线点缀）
  const shrineTiles = new Set([
    '-2,6', '-1,6', '-1,7',
    '10,10', '11,10',
    '21,13', '22,13', '22,14',
  ]);

  // 战略玄石全阻挡岩柱（精简中央主战带密度，保留 (6,6) 单测基准点与疏朗战术卡点）
  const rocks = new Set([
    '6,6', '14,14',
    '14,4', '6,16', '17,9',
  ]);

  // 暗夜灵竹林半遮挡与步兵减速区（疏通中央走廊，保留 (6,14) 单测基准点与翼侧林缘掩体）
  const forests = new Set([
    '6,14', '14,6',
    '8,16', '12,4', '5,3', '15,17',
    '1,5', '19,15', '11,1', '9,19',
  ]);

  // 中央与翼侧暗夜灵泉水域（(8,10) 为单测飞行悬停点，飞行单位可直接飞越并悬停）
  const waters = new Set([
    '8,10', '9,10', '11,10', '12,10', '9,11', '11,9',
    '15,6', '16,6', '4,15', '5,15',
  ]);

  // 在斜向投影下扫描宽广候选网格，按屏幕地面有机不规则轮廓裁切出近千格自然战场！
  for (let row = -18; row <= 38; row++) {
    for (let col = -16; col <= 36; col++) {
      const coord = offsetToAxial(col, row);
      const px = hexToPixel(coord, SHRINE_FIELD_PROJECTION, 1);

      // 归一化至地面可视范围：x ∈ [34..846]（宽 812px），y ∈ [132..474]（高 342px）
      const nx = (px.x - 440) / 402;
      const ny = (px.y - 304) / 168;
      const angle = Math.atan2(ny, nx);
      // 多频自然起伏：林间空地海湾凹口 + 突出草坡，彻底告别死板矩形！
      const organicRadius =
        1.0 +
        0.052 * Math.sin(angle * 3 + 0.65) +
        0.038 * Math.cos(angle * 5 - 1.15) +
        0.024 * Math.sin(angle * 7 + 2.2);
      // 指数 3.1 的柔角超椭圆：既充分填满地面四角，又有自然起伏的林缘呼吸留白
      const superDist = Math.pow(
        Math.pow(Math.abs(nx), 3.1) + Math.pow(Math.abs(ny), 3.1),
        1 / 3.1,
      );

      if (superDist > organicRadius || px.x < 28 || px.x > 852 || px.y < 126 || px.y > 476) {
        continue;
      }

      const tag = `${col},${row}`;
      let terrain: TerrainType = 'plain';
      let elevation = 1;
      let blocksGround = false;
      let losObstruction: 'none' | 'partial' | 'full' = 'none';
      let moveCost = 1;

      if (rocks.has(tag)) {
        terrain = 'rock';
        elevation = 3;
        blocksGround = true;
        losObstruction = 'full';
        moveCost = 99;
      } else if (waters.has(tag)) {
        terrain = 'water';
        elevation = 0;
        blocksGround = true;
        losObstruction = 'none';
        moveCost = 99;
      } else if (highlands.has(tag)) {
        terrain = 'highland';
        elevation = 2;
        moveCost = 1;
      } else if (forests.has(tag)) {
        terrain = 'forest';
        elevation = 1;
        losObstruction = 'partial';
        moveCost = 2;
      } else if (shrineTiles.has(tag)) {
        terrain = 'shrine_tile';
        elevation = 1;
        moveCost = 1;
      }

      const decorSeed = ((col + 31) * 73856093) ^ ((row + 29) * 19349663);
      tiles[hexKey(coord)] = {
        q: coord.q,
        r: coord.r,
        terrain,
        elevation,
        blocksGround,
        losObstruction,
        moveCost,
        decorSeed: decorSeed >>> 0,
      };
    }
  }

  return { width, height, tiles };
}

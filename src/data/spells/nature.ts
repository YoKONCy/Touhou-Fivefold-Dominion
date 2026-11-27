/**
 * 自然派系法术数据表（31 术：30 战斗 + 1 大地图）
 * 主题：妖怪之山 · 天狗疾风 · 迷途竹林 · 式神召请
 */

import type { SpellDef } from '@core/types';

export const NATURE_H4_SPELLS: Record<string, SpellDef> = {
  nature_pathfinding: {
    id: 'nature_pathfinding', name: '秘境踏青', spellCardPrefix: '山符', enName: 'Pathfinding',
    alignment: 'nature', level: 1, manaCost: 2, targetType: 'adventure', range: 0,
    isAdventureOnly: true, vfxKey: 'nature_haste', specialEffect: 'adventure_only',
    description: '自然 1 级（大地图术式）：令冒险大地图军团畅行山林无视崎岖行军惩罚，战斗中不可施放。',
  },
  nature_speed: {
    id: 'nature_speed', name: '天狗疾风', spellCardPrefix: '风符', enName: 'Speed',
    alignment: 'nature', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    buffDuration: 5,
    buffModifiers: [
      { stat: 'speed', mode: 'flat', value: 3, sourceName: '风符·天狗疾风', spellPolarity: 'positive' },
      { stat: 'initiative', mode: 'flat', value: 3, sourceName: '风符·天狗疾风', spellPolarity: 'positive' },
    ],
    vfxKey: 'nature_haste', specialEffect: 'standard',
    description: '自然 1 级：借来妖怪之山的天狗团扇疾风，令一名友军移动力 +3、主动性 +3！',
  },
  nature_stoneskin: {
    id: 'nature_stoneskin', name: '磐岩灵肤', spellCardPrefix: '岩符', enName: 'Stoneskin',
    alignment: 'nature', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    buffDuration: 6,
    buffModifiers: [{ stat: 'defense', mode: 'percent', value: 0.25, sourceName: '岩符·磐岩灵肤', spellPolarity: 'positive' }],
    vfxKey: 'nature_haste', specialEffect: 'standard',
    description: '自然 1 级：以山岩地脉之气护体，令一名友军近战与远程防御 +25%。',
  },
  nature_summon_sprite: {
    id: 'nature_summon_sprite', name: '召请·妖精', spellCardPrefix: '妖符', enName: 'Summon Sprite',
    alignment: 'nature', level: 1, manaCost: 2, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_sprite', vfxKey: 'holy_heal', specialEffect: 'summon_creature',
    description: '自然 1 级式神召请：在指定空地召请一队「雾湖妖精」（飞行、不受反击）！',
  },
  nature_summon_wolf: {
    id: 'nature_summon_wolf', name: '召请·白狼', spellCardPrefix: '兽符', enName: 'Summon Wolf',
    alignment: 'nature', level: 1, manaCost: 2, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_wolf', vfxKey: 'holy_heal', specialEffect: 'summon_creature',
    description: '自然 1 级式神召请：在指定空地召请一队「白狼妖犬」（双重攻击连咬）！',
  },
  nature_summon_leprechaun: {
    id: 'nature_summon_leprechaun', name: '召请·童子', spellCardPrefix: '福符', enName: 'Summon Leprechaun',
    alignment: 'nature', level: 1, manaCost: 2, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_leprechaun', vfxKey: 'holy_heal', specialEffect: 'summon_creature',
    description: '自然 1 级式神召请：在指定空地召请一队高幸运「座敷童子」！',
  },
  nature_terrain_walk: {
    id: 'nature_terrain_walk', name: '山林履平', spellCardPrefix: '步符', enName: 'Terrain Walk',
    alignment: 'nature', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    vfxKey: 'nature_haste', specialEffect: 'terrain_walk',
    description: '自然 1 级：赐予友军如履平地之步，在竹林、泥沼陷地等复杂地形上移动零减速！',
  },
  nature_fortune: {
    id: 'nature_fortune', name: '因幡鸿运', spellCardPrefix: '运符', enName: 'Fortune',
    alignment: 'nature', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    buffDuration: 5,
    buffModifiers: [{ stat: 'luck', mode: 'flat', value: 10, sourceName: '运符·因幡鸿运', spellPolarity: 'positive' }],
    vfxKey: 'nature_haste', specialEffect: 'standard',
    description: '自然 2 级：降下迷途竹林幸运兔的鸿运加持（幸运 +10），大幅提高 1.5× 幸运暴击率！',
  },
  nature_giant_strength: {
    id: 'nature_giant_strength', name: '鬼王巨力', spellCardPrefix: '力符', enName: 'Giant Strength',
    alignment: 'nature', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    vfxKey: 'nature_haste', specialEffect: 'giant_strength',
    description: '自然 2 级：灌注怪力乱神之力强化友军体魄，生命上限与伤害同时提升 +25%！',
  },
  nature_quicksand: {
    id: 'nature_quicksand', name: '泥沼陷地', spellCardPrefix: '沼符', enName: 'Quicksand',
    alignment: 'nature', level: 2, manaCost: 3, targetType: 'hex_aoe', range: 16, aoeRadius: 1, ignoreLos: true,
    vfxKey: 'nature_haste', specialEffect: 'quicksand',
    description: '自然 2 级地形术：在目标区域布设流沙泥沼，陆行单位踏入后立刻耗尽本回合剩余移动力！',
  },
  nature_snake_strike: {
    id: 'nature_snake_strike', name: '白蛇迅击', spellCardPrefix: '蛇符', enName: 'Snake Strike',
    alignment: 'nature', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    vfxKey: 'nature_haste', specialEffect: 'first_strike',
    description: '自然 2 级：赋予友军守矢白蛇般迅疾的「先攻压制」特技。',
  },
  nature_summon_elf: {
    id: 'nature_summon_elf', name: '召请·灵弓', spellCardPrefix: '弓符', enName: 'Summon Elf',
    alignment: 'nature', level: 2, manaCost: 3, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_elf', vfxKey: 'holy_heal', specialEffect: 'summon_creature',
    description: '自然 2 级式神召请：在指定空地召请一队「竹林灵弓」（远程双重攻击）！',
  },
  nature_summon_satyr: {
    id: 'nature_summon_satyr', name: '召请·河童', spellCardPrefix: '河符', enName: 'Summon Satyr',
    alignment: 'nature', level: 2, manaCost: 3, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_satyr', vfxKey: 'holy_heal', specialEffect: 'summon_creature',
    description: '自然 2 级式神召请：在指定空地召请一队高士气「溪谷河童」！',
  },
  nature_summon_white_tiger: {
    id: 'nature_summon_white_tiger', name: '召请·白虎', spellCardPrefix: '虎符', enName: 'Summon White Tiger',
    alignment: 'nature', level: 2, manaCost: 3, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_white_tiger', vfxKey: 'holy_heal', specialEffect: 'summon_creature',
    description: '自然 2 级式神召请：在指定空地召请一队「雪山白虎」（先攻突击）！',
  },
  nature_wasp_swarm: {
    id: 'nature_wasp_swarm', name: '妖虫乱舞', spellCardPrefix: '虫符', enName: 'Wasp Swarm',
    alignment: 'nature', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    damageBase: 14, livingOnly: true, vfxKey: 'nature_haste', specialEffect: 'wasp_swarm',
    description: '自然 2 级：驱使暗夜妖虫群袭咬视线内一名活体敌军，造成伤害并使其丧失下一次行动！',
  },
  nature_anti_magic: {
    id: 'nature_anti_magic', name: '无魔绝域', spellCardPrefix: '绝魔', enName: 'Anti-Magic',
    alignment: 'nature', level: 3, manaCost: 5, targetType: 'ally_unit', range: 17,
    vfxKey: 'nature_haste', specialEffect: 'anti_magic',
    description: '自然 3 级神技：赋予一名友军「全魔法免疫」直至战斗结束，彻底隔绝一切敌我法术！',
  },
  nature_mass_speed: {
    id: 'nature_mass_speed', name: '鸦风骤起', spellCardPrefix: '暴风', enName: 'Mass Speed',
    alignment: 'nature', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    massScope: 'all_allies', buffDuration: 5,
    buffModifiers: [
      { stat: 'speed', mode: 'flat', value: 3, sourceName: '暴风·鸦风骤起', spellPolarity: 'positive' },
      { stat: 'initiative', mode: 'flat', value: 3, sourceName: '暴风·鸦风骤起', spellPolarity: 'positive' },
    ],
    vfxKey: 'nature_haste', specialEffect: 'standard',
    description: '自然 3 级（全军）：刮起席卷山谷的鸦天狗暴风，全队非魔免友军移动力 +3、主动性 +3！',
  },
  nature_necromancy_ward: {
    id: 'nature_necromancy_ward', name: '净土封冥', spellCardPrefix: '净土', enName: 'Necromancy Ward',
    alignment: 'nature', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'nature_haste', specialEffect: 'necromancy_ward',
    description: '自然 3 级全域：张开生机净土结界，本场战斗内彻底封印一切冥府招魂与反魂起尸术！',
  },
  nature_summon_air_elemental: {
    id: 'nature_summon_air_elemental', name: '召请·风精', spellCardPrefix: '风符', enName: 'Summon Air Elemental',
    alignment: 'nature', level: 3, manaCost: 5, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_air_elemental', vfxKey: 'holy_heal', specialEffect: 'summon_creature',
    description: '自然 3 级元素召请：在指定空地召请高机动飞行「七曜风精」部队！',
  },
  nature_summon_earth_elemental: {
    id: 'nature_summon_earth_elemental', name: '召请·土精', spellCardPrefix: '土符', enName: 'Summon Earth Elemental',
    alignment: 'nature', level: 3, manaCost: 5, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_earth_elemental', vfxKey: 'holy_heal', specialEffect: 'summon_creature',
    description: '自然 3 级元素召请：在指定空地召请高护甲高魔抗「七曜土精」重装前排！',
  },
  nature_summon_fire_elemental: {
    id: 'nature_summon_fire_elemental', name: '召请·火精', spellCardPrefix: '火符', enName: 'Summon Fire Elemental',
    alignment: 'nature', level: 3, manaCost: 5, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_fire_elemental', vfxKey: 'star_burst', specialEffect: 'summon_creature',
    description: '自然 3 级元素召请：在指定空地召请自带烈焰护盾的「七曜火精」部队！',
  },
  nature_summon_water_elemental: {
    id: 'nature_summon_water_elemental', name: '召请·水精', spellCardPrefix: '水符', enName: 'Summon Water Elemental',
    alignment: 'nature', level: 3, manaCost: 5, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_water_elemental', vfxKey: 'order_slow', specialEffect: 'summon_creature',
    description: '自然 3 级元素召请：在指定空地召请远程寒冰「七曜水精」部队！',
  },
  nature_mass_fortune: {
    id: 'nature_mass_fortune', name: '万福降临', spellCardPrefix: '鸿福', enName: 'Mass Fortune',
    alignment: 'nature', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    massScope: 'all_allies', buffDuration: 5,
    buffModifiers: [{ stat: 'luck', mode: 'flat', value: 10, sourceName: '鸿福·万福降临', spellPolarity: 'positive' }],
    vfxKey: 'nature_haste', specialEffect: 'standard',
    description: '自然 4 级（全军）：万福瑞气笼罩全军，全体非魔免友军获得最大幸运（幸运 +10）！',
  },
  nature_mass_snake_strike: {
    id: 'nature_mass_snake_strike', name: '群蛇先击', spellCardPrefix: '御蛇', enName: 'Mass Snake Strike',
    alignment: 'nature', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'nature_haste', specialEffect: 'mass_first_strike',
    description: '自然 4 级（全军）：以守矢御蛇之灵加持全队，所有非魔免友军同时获得「先攻」特技！',
  },
  nature_summon_griffin: {
    id: 'nature_summon_griffin', name: '召请·天狗', spellCardPrefix: '天狗', enName: 'Summon Griffin',
    alignment: 'nature', level: 4, manaCost: 8, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_griffin', vfxKey: 'holy_heal', specialEffect: 'summon_creature',
    description: '自然 4 级式神召请：在指定空地召请飞行且「无限反击」的「鸦天狗众」！',
  },
  nature_summon_unicorn: {
    id: 'nature_summon_unicorn', name: '召请·白泽', spellCardPrefix: '圣兽', enName: 'Summon Unicorn',
    alignment: 'nature', level: 4, manaCost: 8, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_unicorn', vfxKey: 'holy_heal', specialEffect: 'summon_creature',
    description: '自然 4 级式神召请：在指定空地召请高魔抗带定身的瑞兽「圣林白泽」！',
  },
  nature_summon_waspwort: {
    id: 'nature_summon_waspwort', name: '召请·魔花', spellCardPrefix: '花符', enName: 'Summon Waspwort',
    alignment: 'nature', level: 4, manaCost: 8, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_waspwort', vfxKey: 'nature_haste', specialEffect: 'summon_creature',
    description: '自然 4 级式神召请：在指定空地召请远程穿障炮台「幽香魔花」！',
  },
  nature_dragon_strength: {
    id: 'nature_dragon_strength', name: '古龙神力', spellCardPrefix: '龙力', enName: 'Dragon Strength',
    alignment: 'nature', level: 5, manaCost: 12, targetType: 'ally_unit', range: 18,
    vfxKey: 'nature_haste', specialEffect: 'dragon_strength',
    description: '自然 5 级终极强化：引动幻想乡古龙伟力加持友军，生命上限与伤害同时翻倍 (+100%)！',
  },
  nature_summon_faerie_dragon: {
    id: 'nature_summon_faerie_dragon', name: '召请·飞龙', spellCardPrefix: '龙符', enName: 'Summon Faerie Dragon',
    alignment: 'nature', level: 5, manaCost: 12, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_faerie_dragon', vfxKey: 'mana_burst', specialEffect: 'summon_creature',
    description: '自然 5 级终极召请：召请高魔抗远程飞龙「妖精飞龙」降临战阵！',
  },
  nature_summon_mantis: {
    id: 'nature_summon_mantis', name: '召请·螳螂', spellCardPrefix: '虫王', enName: 'Summon Mantis',
    alignment: 'nature', level: 5, manaCost: 12, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_mantis', vfxKey: 'nature_haste', specialEffect: 'summon_creature',
    description: '自然 5 级终极召请：召请先攻定身的 4 阶巨兽「山神螳螂」降临战阵！',
  },
  nature_summon_phoenix: {
    id: 'nature_summon_phoenix', name: '召请·凤翼', spellCardPrefix: '不死', enName: 'Summon Phoenix',
    alignment: 'nature', level: 5, manaCost: 12, targetType: 'hex_empty', range: 12, ignoreLos: true,
    summonTemplateId: 'summon_phoenix', vfxKey: 'star_burst', specialEffect: 'summon_creature',
    description: '自然 5 级终极召请：召请极速先攻、贯穿火息且火免的「蓬莱不死鸟」降临战阵！',
  },
};

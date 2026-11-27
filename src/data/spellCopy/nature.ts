/**
 * 自然派系法术三段式文案表（32 术）
 */

import type { SpellCopyEntry } from './types';

export const NATURE_SPELL_COPY: Record<string, SpellCopyEntry> = {
  nature_pathfinding: {
    summary: '令军团畅行险峰山林的行军术。',
    effect: '仅限战略大地图使用，消除军团经过崎岖地形时的移动惩罚。',
  },
  nature_speed: {
    summary: '借自妖怪之山的天狗团扇疾风。',
    effect: '使一名友军的移动力与先手主动性各提升 3 点，持续 5 回合。',
    flavor: '“报纸还没印好，天狗已经飞过整座山头了。”',
  },
  nature_stoneskin: {
    summary: '凝聚山岩地脉之气的护体术。',
    effect: '使一名友军的近战与远程防御提升 25%，持续 6 回合。',
  },
  nature_summon_sprite: {
    summary: '自雾之湖畔唤来的轻盈妖精群。',
    effect: '在指定空地召请一队雾湖妖精，具备飞行与不受反击特技。',
  },
  nature_summon_wolf: {
    summary: '巡守妖怪之山的迅猛白狼群。',
    effect: '在指定空地召请一队白狼妖犬，具备双重攻击特技。',
  },
  nature_summon_leprechaun: {
    summary: '寄宿古宅灵脉的招福座敷童子。',
    effect: '在指定空地召请一队座敷童子，具备高幸运与潜行特技。',
  },
  nature_terrain_walk: {
    summary: '令脚步轻捷如履平地的山林秘法。',
    effect: '使一名友军穿越竹林、泥沼等复杂地形时不再减速。',
  },
  nature_fortune: {
    summary: '来自迷途竹林幸运兔的鸿运加持。',
    effect: '使一名友军幸运提升 10 点，持续 5 回合，提高幸运暴击与幸运护身触发概率。',
    flavor: '“幸运兔的祝福很灵验，前提是别踩进她挖的陷阱。”',
  },
  nature_giant_strength: {
    summary: '灌注鬼王怪力的体魄强化术。',
    effect: '使一名友军的生命上限与攻击伤害各提升 25%。',
  },
  nature_quicksand: {
    summary: '隐伏于战场地面之下的流沙泥沼。',
    effect: '在目标区域铺设流沙陷阱，陆行单位踏入后立即耗尽本回合剩余移动力。',
  },
  nature_snake_strike: {
    summary: '如守矢白蛇出击般迅猛的先手加护。',
    effect: '赋予一名友军先攻特技直至战斗结束。',
  },
  nature_summon_elf: {
    summary: '隐居迷途竹林的精锐弓手。',
    effect: '在指定空地召请一队竹林灵弓，具备远程射击与双重攻击特技。',
  },
  nature_summon_satyr: {
    summary: '出身玄武之泽的豪迈河童众。',
    effect: '在指定空地召请一队高士气溪谷河童。',
  },
  nature_summon_white_tiger: {
    summary: '驰骋雪岭的迅捷灵兽白虎。',
    effect: '在指定空地召请一队雪山白虎，具备先攻特技。',
  },
  nature_wasp_swarm: {
    summary: '自夜色草丛涌出的暗夜妖虫群。',
    effect: '对一名活体敌军造成伤害，并使其丧失下一次行动回合。',
  },
  nature_anti_magic: {
    summary: '隔绝一切灵力波纹的无魔绝域。',
    effect: '赋予一名友军全魔法免疫直至战斗结束，免疫一切敌我法术。',
    flavor: '“无论诅咒还是祝福，统统挡在结界之外。”',
  },
  nature_mass_speed: {
    summary: '席卷山谷的鸦天狗暴风。',
    effect: '使全队非魔免友军的移动力与先手主动性各提升 3 点，持续 5 回合。',
  },
  nature_necromancy_ward: {
    summary: '生机盎然的净土封冥结界。',
    effect: '本场战斗内全面封印所有招魂与反魂起尸类法术。',
  },
  nature_summon_air_elemental: {
    summary: '由风曜灵力凝成的高速风精。',
    effect: '在指定空地召请一队七曜风精元素，具备飞行并免疫活体生理负面效果。',
  },
  nature_summon_earth_elemental: {
    summary: '由土曜巨岩塑形的重装守护者。',
    effect: '在指定空地召请一队七曜土精元素，具备高额防御与 50% 魔法抗性。',
  },
  nature_summon_fire_elemental: {
    summary: '由火曜业焰化成的炽烈灵体。',
    effect: '在指定空地召请一队七曜火精元素，具备飞行、烈焰护盾与火焰抗性。',
  },
  nature_summon_water_elemental: {
    summary: '由水曜灵泉凝聚的远程水精。',
    effect: '在指定空地召请一队七曜水精元素，可进行远程寒冰水弹射击。',
  },
  nature_mass_fortune: {
    summary: '遍洒全军的万福瑞气。',
    effect: '使全队非魔免友军幸运提升 10 点，持续 5 回合。',
  },
  nature_mass_snake_strike: {
    summary: '以守矢御蛇灵威加持全阵。',
    effect: '赋予全队非魔免友军先攻特技直至战斗结束。',
  },
  nature_summon_griffin: {
    summary: '翱翔群山之巅的鸦天狗精锐。',
    effect: '在指定空地召请一队鸦天狗众，具备飞行与无限反击特技。',
  },
  nature_summon_unicorn: {
    summary: '博闻通灵的圣林瑞兽白泽。',
    effect: '在指定空地召请一队圣林白泽，具备 40% 魔法抗性与命中定身特技。',
  },
  nature_summon_waspwort: {
    summary: '绽放于太阳花田的狂野魔花。',
    effect: '在指定空地召请一队幽香魔花，可无视普通障碍进行远程毒刺射击。',
    flavor: '“未经允许折断太阳花的人，通常没机会走回花田边缘。”',
  },
  nature_dragon_strength: {
    summary: '引动幻想乡古龙伟力的终极强化。',
    effect: '使一名友军的生命上限与攻击伤害同时翻倍。',
    flavor: '“幻想乡的天际偶尔掠过龙影，连群山都会为之屏息。”',
  },
  nature_summon_faerie_dragon: {
    summary: '沐浴丰沛魔力诞生的幻想飞龙。',
    effect: '在指定空地召请妖精飞龙，具备飞行、无限弹药远程与 50% 魔抗。',
  },
  nature_summon_mantis: {
    summary: '潜伏深山密林的四阶掠食巨兽。',
    effect: '在指定空地召请山神螳螂，具备飞行、先攻与命中定身特技。',
  },
  nature_summon_phoenix: {
    summary: '携蓬莱不灭烈焰降临的不死圣鸟。',
    effect: '在指定空地召请蓬莱不死鸟，具备飞行、先攻、贯穿吐息与火焰免疫。',
    flavor: '“烧尽之后再从余烬里站起，对蓬莱之火不过是家常便饭。”',
  },
  nature_haste: {
    summary: '拂过竹林山径的轻灵疾风。',
    effect: '使一名友军的移动力与先手主动性各提升 2 点，持续 2 回合。',
  },
};

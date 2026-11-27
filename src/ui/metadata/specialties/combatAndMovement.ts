/**
 * 单位机动、核心战斗、射程修正与防御姿态类特技徽章构造器
 */

import type { BattleUnit } from '@core/types';
import { SPECIAL_CREATURE_TAG_META } from '@ui/semanticFormat';
import type { HudIconBadge } from '../types';
import {
  SPEC_BADGE_DEFENSE,
  SPEC_BADGE_LIMIT,
  SPEC_BADGE_OFFENSE,
  SPEC_BADGE_UTILITY,
} from './constants';

type UnitAbilities = BattleUnit['abilities'];

/** 构造飞行与空间瞬移类机动特技徽章 */
export function appendMovementSpecialtyBadges(ab: UnitAbilities, list: HudIconBadge[]): void {
  if (ab.flying) {
    list.push({
      id: 'flying',
      icon: 'flying',
      polarity: 'positive',
      shortLabel: '飞行',
      accent: '#a4eef5',
      bg: 'rgba(17, 42, 48, 0.94)',
      border: '#57aab8',
      tooltip: {
        title: '御空飞行',
        tag: '机动特技',
        accent: '#9cf2f7',
        badges: [SPEC_BADGE_UTILITY],
        summary: '凌空越障的自由机动能力。',
        lines: [
          '无视城墙外的一切地形障碍、单位阻挡与减速，移动每格恒耗 1 点移动力，可悬停于水面与竹林。',
        ],
      },
    });
  }

  if (ab.globalTeleport) {
    list.push({
      id: 'globalTeleport',
      icon: 'globalTeleport',
      polarity: 'positive',
      shortLabel: '深渊瞬移',
      accent: '#ff8fb8',
      bg: 'rgba(54, 14, 38, 0.94)',
      border: '#d93870',
      tooltip: {
        title: '深渊全图瞬移',
        tag: '机动特技',
        accent: '#ff70a0',
        badges: [SPEC_BADGE_UTILITY],
        summary: '撕裂深渊隙间的无距离限制跃迁。',
        lines: ['不受移动距离限制，无视一切地形、城墙、水域与敌我单位阻挡，一步直达全战场任意合法陆地空位。'],
      },
    });
  }

  if (ab.teleport) {
    list.push({
      id: 'teleport',
      icon: 'teleport',
      polarity: 'positive',
      shortLabel: '瞬移',
      accent: '#d4b8ff',
      bg: 'rgba(34, 20, 62, 0.94)',
      border: '#9c72e6',
      tooltip: {
        title: '瞬间移动',
        tag: '机动特技',
        accent: '#c9a6ff',
        badges: [SPEC_BADGE_UTILITY],
        summary: '受移动距离约束的短距空间跃迁。',
        lines: [
          '可在当前移动力范围内无视城墙、岩柱、水域、流沙与敌我单位阻挡，直接瞬移至任意合法陆地空位。',
        ],
      },
    });
  }
}

/** 构造先攻、反击、远程射击、破城、全魔免与暗系体等核心战斗特技徽章 */
export function appendCoreCombatSpecialtyBadges(unit: BattleUnit, ab: UnitAbilities, list: HudIconBadge[]): void {
  if (ab.firstStrike) {
    list.push({
      id: 'firstStrike',
      icon: 'firstStrike',
      polarity: 'positive',
      shortLabel: '先攻',
      accent: '#f7df99',
      bg: 'rgba(54, 39, 16, 0.94)',
      border: '#cfa34e',
      tooltip: {
        title: '先攻压制',
        tag: '进攻特技',
        accent: '#f5df9e',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '打破同时反击规则的先手制敌。',
        lines: [
          '近战交锋时率先结算伤害并立刻削减敌方兵力，敌军仅能以残余人数还击，若一击全灭则不受反击。',
        ],
      },
    });
  }

  if (ab.rangedFirstStrike) {
    list.push({
      id: 'rangedFirstStrike',
      icon: 'rangedFirstStrike',
      polarity: 'positive',
      shortLabel: '远先',
      accent: '#9cf2ff',
      bg: 'rgba(18, 44, 58, 0.94)',
      border: '#5ec7e6',
      tooltip: {
        title: '远程先攻',
        tag: '进攻特技',
        accent: '#82ebff',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '在远程互射中抢先放箭压制敌方还击。',
        lines: [
          '远程互射交锋时率先结算射击伤害并立刻削减敌方兵力，敌军仅能以残余人数还击，若一击全灭则不受远程反击；遭敌方远程射击触发反击时亦优先出手。',
        ],
      },
    });
  }

  if (ab.noRetaliation) {
    list.push({
      id: 'noRetaliation',
      icon: 'noRetaliation',
      polarity: 'positive',
      shortLabel: '禁反',
      accent: '#dfc4f7',
      bg: 'rgba(42, 24, 56, 0.94)',
      border: '#9d72c9',
      tooltip: {
        title: '不受反击',
        tag: '进攻特技',
        accent: '#d9b8f5',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '令敌军无法还手的突袭技法。',
        lines: ['主动发起攻击时完全压制目标反击，实现零反伤打击。'],
      },
    });
  }

  if (ab.unlimitedRetaliation) {
    list.push({
      id: 'unlimitedRetaliation',
      icon: 'unlimitedRetaliation',
      polarity: 'positive',
      shortLabel: '无限反',
      accent: '#f5cfa0',
      bg: 'rgba(52, 29, 16, 0.94)',
      border: '#c78748',
      tooltip: {
        title: '无限反击',
        tag: '防御特技',
        accent: '#f0be82',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '迎击一切来犯者的铁壁反手。',
        lines: ['每回合反击不受次数限制，对任意可反击的进犯目标持续还击。'],
      },
    });
  }

  if (ab.ranged) {
    list.push({
      id: 'ranged',
      icon: 'ranged',
      polarity: 'positive',
      shortLabel: '远程',
      accent: '#bdd9f7',
      bg: 'rgba(22, 36, 58, 0.94)',
      border: '#6c96c9',
      tooltip: {
        title: '远程弹幕',
        subtitle: ab.unlimitedShots ? '无限弹药 · 永不耗尽' : `剩余弹药 ${unit.ammo} / ${unit.maxAmmo}`,
        tag: '进攻特技',
        accent: '#9cc3f0',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '可发动远距离弹幕射击与远程互射。',
        lines: [
          '受视线遮挡、距离衰减与高台减伤影响；遭敌方远程射击且视线畅通时自动触发远程同时反击。',
        ],
      },
    });
  }

  if (ab.noMelee) {
    list.push({
      id: 'noMelee',
      icon: 'noMelee',
      polarity: 'positive',
      shortLabel: '近禁',
      accent: '#b8f0d8',
      bg: 'rgba(18, 46, 38, 0.94)',
      border: '#54b892',
      tooltip: {
        title: '近战禁手',
        tag: '进攻特技',
        accent: '#7fe0ae',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '无视敌军贴身纠缠、始终保持远程弹幕压制的强力射手特技。',
        lines: [
          '被敌军贴脸时主动攻击仍可照常发动满威力远程射击，不会被迫转为肉搏。',
          '遭到敌军近战打击时仍会发动近战反击，并按射手规则承受 -60% 近战伤害衰减。',
        ],
      },
    });
  }

  if (ab.noRanged) {
    list.push({
      id: 'noRanged',
      icon: 'noRanged',
      polarity: 'negative',
      shortLabel: '远禁',
      accent: '#f2c7b3',
      bg: 'rgba(56, 24, 18, 0.94)',
      border: '#c77050',
      tooltip: {
        title: '远程禁手',
        tag: '行动限制',
        tagTone: 'danger',
        accent: '#e88d6b',
        badges: [SPEC_BADGE_LIMIT],
        summary: '弹幕射击能力处于封印状态。',
        lines: ['当前无法发动远程攻击或远程反击，也无法接受天眼狙定等远程加持。'],
      },
    });
  }

  if (ab.noMeleePenalty && ab.ranged) {
    list.push({
      id: 'noMeleePenalty',
      icon: 'noMeleePenalty',
      polarity: 'positive',
      shortLabel: '近无衰',
      accent: '#bcefd4',
      bg: 'rgba(18, 46, 36, 0.94)',
      border: '#55ab80',
      tooltip: {
        title: '近战无衰减',
        tag: '进攻特技',
        accent: '#7fe0ae',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '远近兼修的肉搏自保技艺。',
        lines: ['被敌军贴身纠缠或主动切换近战时，近战格斗仍保持 100% 全额威力。'],
      },
    });
  }

  if (ab.siegeBreaker) {
    list.push({
      id: 'siegeBreaker',
      icon: 'siegeBreaker',
      polarity: 'positive',
      shortLabel: '攻城',
      accent: '#f5cba6',
      bg: 'rgba(56, 26, 16, 0.94)',
      border: '#cc7a45',
      tooltip: {
        title: '攻城破墙',
        tag: '进攻特技',
        accent: '#eba06c',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '专为击碎城防而造的重型破坏力。',
        lines: ['对城墙、城门与防御塔楼造成毁灭性额外破城伤害。'],
      },
    });
  }

  if (ab.magicImmune) {
    list.push({
      id: 'magicImmune',
      icon: 'magicImmune',
      polarity: 'positive',
      shortLabel: '全魔免',
      accent: '#e3cbf7',
      bg: 'rgba(42, 22, 58, 0.94)',
      border: '#a575cc',
      tooltip: {
        title: '全魔法免疫',
        tag: '防御特技',
        accent: '#d6a8f5',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '隔绝一切灵力术式波纹的绝对抗魔体质。',
        lines: [
          '免疫全部敌方伤害与减益魔法，同时也免疫己方一切正面增益、治愈、苏生复活与战场符卡领域。',
        ],
      },
    });
  }

  if (ab.darkNature) {
    const m = SPECIAL_CREATURE_TAG_META.darkNature;
    list.push({
      id: 'darkNature',
      icon: 'darkNature',
      shortLabel: '暗系',
      accent: m.color,
      bg: m.bg,
      border: m.border,
      tooltip: {
        title: '暗系体',
        tag: '东方特殊特质',
        accent: '#a996f5',
        badges: [
          { label: '暗系特质', icon: 'darkNature', color: m.color, bg: m.bg, border: m.border },
          { label: '蚀生 +15% · 魔伤 +10%', icon: 'polarity_damage', color: '#f5d98a', bg: 'rgba(46, 34, 16, 0.9)', border: '#a8843c' },
        ],
        summary: '侵蚀常世生灵却畏惧纯净魔力的暗夜体质。',
        lines: [
          '攻击非暗系且非机械、不死、元素、幻象的普通活体时，伤害额外 +15%。',
          '承受所有直接法术与符卡魔法伤害额外 +10%，且受生命系破邪与抗死结界克制。',
        ],
      },
    });
  }
}

/** 构造连击、长手、射程修正、冲锋、抗死结界与格挡特技徽章 */
export function appendTacticalRangedAndStrikeBadges(ab: UnitAbilities, list: HudIconBadge[]): void {
  if (ab.doubleStrike) {
    list.push({
      id: 'doubleStrike',
      icon: 'doubleStrike',
      polarity: 'positive',
      shortLabel: '双打',
      accent: '#f5d99a',
      bg: 'rgba(54, 34, 16, 0.94)',
      border: '#cc9745',
      tooltip: {
        title: '双重攻击',
        tag: '进攻特技',
        accent: '#edb968',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '首击后无缝衔接追斩的二连攻势。',
        lines: ['主动进攻且首段交锋后双方均存活时，立即追加第二段不触发反击的连击。'],
      },
    });
  }

  if (ab.longWeapon) {
    list.push({
      id: 'longWeapon',
      icon: 'longWeapon',
      polarity: 'positive',
      shortLabel: '长手',
      accent: '#a6ffdf',
      bg: 'rgba(14, 48, 40, 0.94)',
      border: '#4fd1a5',
      tooltip: {
        title: '长武器',
        tag: '进攻特技',
        accent: '#7ff2c9',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '超越寻常近战步距的隔格突刺优势。',
        lines: ['近战攻击距离 +1，可隔 1 格发起突袭；隔格打击非长手目标时敌军因够不到而无法反击。'],
      },
    });
  }

  if (ab.negateFirstStrike) {
    list.push({
      id: 'negateFirstStrike',
      icon: 'negateFirstStrike',
      polarity: 'positive',
      shortLabel: '破先',
      accent: '#f5cb9c',
      bg: 'rgba(52, 30, 18, 0.94)',
      border: '#cc8645',
      tooltip: {
        title: '破先攻',
        tag: '防御特技',
        accent: '#f0b878',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '化解敌方抢攻节奏的稳守反制。',
        lines: ['无效化敌方的先攻压制特技，将交锋强制拉回常规同时反击。'],
      },
    });
  }

  if (ab.longRange) {
    list.push({
      id: 'longRange',
      icon: 'longRange',
      polarity: 'positive',
      shortLabel: '精准',
      accent: '#a8f0da',
      bg: 'rgba(16, 46, 40, 0.94)',
      border: '#4db896',
      tooltip: {
        title: '精准射击',
        tag: '进攻特技',
        accent: '#7fe8c5',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '百步穿杨的零距离衰减弹道。',
        lines: ['彻底无视远程距离衰减，无论相隔多远皆保持 100% 距离威力。'],
      },
    });
  }

  if (ab.shortRange) {
    list.push({
      id: 'shortRange',
      icon: 'shortRange',
      polarity: 'negative',
      shortLabel: '短程',
      accent: '#f2c1a2',
      bg: 'rgba(54, 28, 18, 0.94)',
      border: '#c2744a',
      tooltip: {
        title: '短程弹幕',
        tag: '行动限制',
        tagTone: 'danger',
        accent: '#eb9d70',
        badges: [SPEC_BADGE_LIMIT],
        summary: '射程偏短、适合中近距离游击的弹幕特性。',
        lines: ['超出标准射程后距离衰减更为剧烈，需贴近战线发挥全额射击威力。'],
      },
    });
  }

  if (ab.noObstaclePenalty) {
    list.push({
      id: 'noObstaclePenalty',
      icon: 'noObstaclePenalty',
      polarity: 'positive',
      shortLabel: '穿障',
      accent: '#b8e8ff',
      bg: 'rgba(18, 38, 56, 0.94)',
      border: '#5ea4d9',
      tooltip: {
        title: '无视障碍射击',
        tag: '进攻特技',
        accent: '#8cd4ff',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '无视树林掩体损耗的高抛弹道。',
        lines: ['弹幕穿透竹林等普通障碍物时不会降级衰减，但高耸岩柱与存活单位仍会阻挡视线。'],
      },
    });
  }

  if (ab.unlimitedShots) {
    list.push({
      id: 'unlimitedShots',
      icon: 'unlimitedShots',
      polarity: 'positive',
      shortLabel: '无限弹',
      accent: '#e0c7ff',
      bg: 'rgba(38, 22, 58, 0.94)',
      border: '#9d6be0',
      tooltip: {
        title: '无限弹药',
        tag: '战术特技',
        accent: '#cfa6ff',
        badges: [SPEC_BADGE_UTILITY],
        summary: '生生不息的永续弹幕供给。',
        lines: ['远程射击与远程反击永不消耗弹药，可持续压制全场。'],
      },
    });
  }

  if (ab.charge) {
    list.push({
      id: 'charge',
      icon: 'charge',
      polarity: 'positive',
      shortLabel: '冲锋',
      accent: '#ffe299',
      bg: 'rgba(58, 34, 16, 0.94)',
      border: '#e0a23d',
      tooltip: {
        title: '冲锋增伤',
        tag: '进攻特技',
        accent: '#ffd466',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '借疾驰冲势倍增破坏力的突击技艺。',
        lines: ['近战突进时每移动 1 格伤害额外 +5%，最高叠加至 +45%。'],
      },
    });
  }

  if (ab.deathWard) {
    list.push({
      id: 'deathWard',
      icon: 'deathWard',
      polarity: 'positive',
      shortLabel: '抗死',
      accent: '#fff0bd',
      bg: 'rgba(54, 42, 18, 0.94)',
      border: '#d9b859',
      tooltip: {
        title: '抗死结界',
        tag: '防御特技',
        accent: '#ffe899',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '抵御幽冥与异变侵蚀的神圣护佑。',
        lines: ['面对死亡系、不死、暗系与混沌系敌军时防御 +25%，承受死亡魔法与混沌魔法伤害减半。'],
      },
    });
  }

  if (ab.block) {
    list.push({
      id: 'block',
      icon: 'block',
      polarity: 'positive',
      shortLabel: '格挡',
      accent: '#b8dcff',
      bg: 'rgba(20, 36, 58, 0.94)',
      border: '#669ce0',
      tooltip: {
        title: '绝对格挡',
        tag: '防御特技',
        accent: '#8ec7ff',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '举盾完全化解物理打击的铁壁守势。',
        lines: ['遭受近战或远程物理攻击时有 35% 概率完全招架，此次伤害归零。'],
      },
    });
  }
}

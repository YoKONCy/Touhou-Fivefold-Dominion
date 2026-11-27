/**
 * HUD 极简图标化数据与悬浮提示构造器
 *
 * 将所有单位特技、实时状态、主技能树与神器纸娃娃槽位抽象为统一图标条目，
 * 主面板仅显示雕刻图标与核心数值，全部文字说明收敛至 Hover 悬浮浮窗！
 */

import { ALIGNMENT_META } from '@core/alignment';
import { isUnitOnHighlandPlatform } from '@core/h4SpellExecutor';
import { HERO_TRAIT_REGISTRY } from '@core/traits';
import type {
  ArtifactDef,
  BattleState,
  BattleUnit,
  ComputedUnitStats,
  PrimarySkillId,
  SkillRank,
  SpellCardDef,
  SpellDef,
  StatKey,
} from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { formatSpellCardTitle } from '@data/h4Spells';
import { getSpellCardCopy, getSpellCopy } from '@data/spellCopy';
import {
  classifySpellCardPolarity,
  classifySpellPolarity,
  SPELL_POLARITY_META,
  SPECIAL_CREATURE_TAG_META,
} from '@ui/semanticFormat';

export interface HudTooltipMiniBadge {
  label: string;
  icon?: string;
  color: string;
  bg: string;
  border: string;
}

export interface HudTooltipPayload {
  title: string;
  subtitle?: string;
  tag?: string;
  tagTone?: 'default' | 'danger' | 'muted';
  accent?: string;
  /** 标题下方胶囊徽章（如阵营色胶囊 + 极性图标胶囊 / 生物类型图标胶囊） */
  badges?: HudTooltipMiniBadge[];
  /** 可选简介段（置于客观效果上方） */
  summary?: string;
  /** 客观效果正文行 */
  lines: string[];
  /** 可选斜体小字彩蛋文本（置于底部） */
  flavor?: string;
}

export interface HudIconBadge {
  id: string;
  icon: string;
  /** 若该状态源自特定法术，直接渲染对应的 24×24 手绘专属法术像素图标 */
  spellIconId?: string;
  /** 可选角标（例如剩余回合数 "3" 或护命次数 "×2"） */
  roundsBadge?: string;
  polarity?: 'positive' | 'negative';
  shortLabel?: string;
  accent: string;
  bg: string;
  border: string;
  tooltip: HudTooltipPayload;
}

export const PRIMARY_SKILL_META: Record<
  PrimarySkillId,
  { name: string; short: string; icon: string; color: string; desc: string }
> = {
  tactics: {
    name: '战术',
    short: '战术',
    icon: 'tactics',
    color: '#ffcf66',
    desc: '强化己方全军攻防、移速与先手光环，下辖进攻、防御、领导。',
  },
  combat: {
    name: '格斗',
    short: '格斗',
    icon: 'combat',
    color: '#ff7888',
    desc: '强化英雄个人防卫、生命韧性与战斗专精，下辖近战、射击、魔抗。',
  },
  scouting: {
    name: '侦查',
    short: '侦查',
    icon: 'scouting',
    color: '#7ef0b5',
    desc: '扩大视野并提升先手主动、移速与擦弹潜行，下辖寻路、渡雾、潜行。',
  },
  nobility: {
    name: '贵族',
    short: '贵族',
    icon: 'nobility',
    color: '#f2c97d',
    desc: '统御领地资源并强化全军士气、幸运与护甲，下辖理财、采矿、外交。',
  },
  life_magic: {
    name: '生命魔法',
    short: '生命',
    icon: 'life_magic',
    color: ALIGNMENT_META.life.themeColor,
    desc: '掌控生命系结界守护、治疗净化与苏生神术，下辖治疗、灵性、复活。',
  },
  order_magic: {
    name: '秩序魔法',
    short: '秩序',
    icon: 'order_magic',
    color: ALIGNMENT_META.order.themeColor,
    desc: '掌控秩序系时滞控制、幻象分身与法力增幅，下辖附魔、巫术、魅惑。',
  },
  death_magic: {
    name: '死亡魔法',
    short: '死亡',
    icon: 'death_magic',
    color: ALIGNMENT_META.death.themeColor,
    desc: '掌控死亡系衰弱诅咒、吸魂与招魂术式，下辖神秘、恶魔、招魂。',
  },
  chaos_magic: {
    name: '混沌魔法',
    short: '混沌',
    icon: 'chaos_magic',
    color: ALIGNMENT_META.chaos.themeColor,
    desc: '掌控混沌系高爆发星光破坏与全系魔力增幅，下辖魔咒、烈焰、魔力。',
  },
  nature_magic: {
    name: '自然魔法',
    short: '自然',
    icon: 'nature_magic',
    color: ALIGNMENT_META.nature.themeColor,
    desc: '掌控自然系灵草回复、冥想回蓝与生灵召请，下辖草药、冥想、召唤。',
  },
};

const SKILL_RANK_NAMES: Record<SkillRank, string> = {
  0: '未习得',
  1: '基础',
  2: '进阶',
  3: '专家',
  4: '大师',
  5: '宗师',
};

export function getSkillRankLabel(rank: SkillRank): string {
  return SKILL_RANK_NAMES[rank] ?? `Lv.${rank}`;
}

const SPEC_BADGE_OFFENSE: HudTooltipMiniBadge = {
  label: '进攻特技',
  icon: SPELL_POLARITY_META.damage.icon,
  color: SPELL_POLARITY_META.damage.color,
  bg: SPELL_POLARITY_META.damage.bg,
  border: SPELL_POLARITY_META.damage.border,
};

const SPEC_BADGE_DEFENSE: HudTooltipMiniBadge = {
  label: '防御特技',
  icon: SPELL_POLARITY_META.buff.icon,
  color: SPELL_POLARITY_META.buff.color,
  bg: SPELL_POLARITY_META.buff.bg,
  border: SPELL_POLARITY_META.buff.border,
};

const SPEC_BADGE_CONTROL: HudTooltipMiniBadge = {
  label: '控场特效',
  icon: SPELL_POLARITY_META.debuff.icon,
  color: SPELL_POLARITY_META.debuff.color,
  bg: SPELL_POLARITY_META.debuff.bg,
  border: SPELL_POLARITY_META.debuff.border,
};

const SPEC_BADGE_UTILITY: HudTooltipMiniBadge = {
  label: '战术机动',
  icon: SPELL_POLARITY_META.utility.icon,
  color: SPELL_POLARITY_META.utility.color,
  bg: SPELL_POLARITY_META.utility.bg,
  border: SPELL_POLARITY_META.utility.border,
};

const SPEC_BADGE_HEAL: HudTooltipMiniBadge = {
  label: '治愈神术',
  icon: SPELL_POLARITY_META.heal.icon,
  color: SPELL_POLARITY_META.heal.color,
  bg: SPELL_POLARITY_META.heal.bg,
  border: SPELL_POLARITY_META.heal.border,
};

const SPEC_BADGE_LIMIT: HudTooltipMiniBadge = {
  label: '行动限制',
  icon: SPELL_POLARITY_META.debuff.icon,
  color: '#ff9aa8',
  bg: 'rgba(62, 18, 28, 0.92)',
  border: '#c74c5e',
};

/** 构造单位全部特技图标列表（统一三段式详述 + 类别/生物类型彩色像素微标，零冗余括号） */
export function buildUnitSpecialtyBadges(unit: BattleUnit): HudIconBadge[] {
  const list: HudIconBadge[] = [];
  const ab = unit.abilities;

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
          '受视线遮挡、距离衰减与高地压制影响；遭敌方远程射击且视线畅通时自动触发远程同时反击。',
        ],
      },
    });
  }

  if (ab.noMelee) {
    list.push({
      id: 'noMelee',
      icon: 'noMelee',
      polarity: 'negative',
      shortLabel: '近禁',
      accent: '#f5b8c1',
      bg: 'rgba(58, 17, 25, 0.94)',
      border: '#c74c5e',
      tooltip: {
        title: '近战禁手',
        tag: '行动限制',
        tagTone: 'danger',
        accent: '#eb6e80',
        badges: [SPEC_BADGE_LIMIT],
        summary: '放弃肉搏而专注弹幕压制的受限体制。',
        lines: [
          '不会主动近战也不进行近战反击，无法受益于近战专属附魔；但即便被贴身仍可照常发动远程射击与远程互射。',
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

  if (ab.stunOnHit) {
    list.push({
      id: 'stunOnHit',
      icon: 'stunOnHit',
      polarity: 'positive',
      shortLabel: '定身',
      accent: '#fff0a6',
      bg: 'rgba(56, 40, 16, 0.94)',
      border: '#d9b148',
      tooltip: {
        title: '符箓定身',
        tag: '控场特技',
        accent: '#ffe270',
        badges: [SPEC_BADGE_CONTROL],
        summary: '贴附灵符令活体敌军瞬间僵直。',
        lines: ['近战命中活体目标时按伤害占比有 28% 至 65% 概率使其定身 1 回合跳过行动，对机械、不死、元素、幻象无效。'],
      },
    });
  }

  if (ab.terrorOnHit) {
    list.push({
      id: 'terrorOnHit',
      icon: 'terrorOnHit',
      polarity: 'positive',
      shortLabel: '震慑',
      accent: '#ffadc4',
      bg: 'rgba(56, 16, 36, 0.94)',
      border: '#d94878',
      tooltip: {
        title: '噩梦震慑',
        tag: '控场特技',
        accent: '#ff7aa0',
        badges: [SPEC_BADGE_CONTROL],
        summary: '拖拽敌军坠入梦魇的骇人威压。',
        lines: ['近战命中活体目标时有 38% 概率使其陷入震慑，跳过下回合行动且防御 -15%，对机械、不死、元素、幻象无效。'],
      },
    });
  }

  if (ab.stoneGaze) {
    list.push({
      id: 'stoneGaze',
      icon: 'stoneGaze',
      polarity: 'positive',
      shortLabel: '石化',
      accent: '#e0b8ff',
      bg: 'rgba(42, 18, 56, 0.94)',
      border: '#ab5ce0',
      tooltip: {
        title: '魔眼石化',
        tag: '控场特技',
        accent: '#d094ff',
        badges: [SPEC_BADGE_CONTROL, SPEC_BADGE_OFFENSE],
        summary: '凝视瞬间化血肉为玄石的禁忌魔瞳。',
        lines: ['命中活体非魔免敌军时有 18% 概率额外石化即死 1 至 2 名兵力，对英雄转为 +20% 咒伤，对机械、不死、元素、幻象无效。'],
      },
    });
  }

  if (ab.fireShield) {
    list.push({
      id: 'fireShield',
      icon: 'fireShield',
      polarity: 'positive',
      shortLabel: '炎盾',
      accent: '#ffc199',
      bg: 'rgba(60, 22, 14, 0.94)',
      border: '#e66733',
      tooltip: {
        title: '烈焰护盾',
        tag: '防御特技',
        accent: '#ff8a52',
        badges: [SPEC_BADGE_DEFENSE, SPEC_BADGE_OFFENSE],
        summary: '缠绕周身灼烧一切近战来犯者的魔焰屏障。',
        lines: ['遭受近战打击时自动向攻击方反弹 22% 火焰伤害，即便自身阵亡依然触发。'],
      },
    });
  }

  if (ab.fireResistant) {
    list.push({
      id: 'fireResistant',
      icon: 'fireResistant',
      polarity: 'positive',
      shortLabel: '火免',
      accent: '#ffd4a6',
      bg: 'rgba(58, 28, 16, 0.94)',
      border: '#db8242',
      tooltip: {
        title: '炽焰抗性',
        tag: '防御特技',
        accent: '#ffa866',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '对业火与烈焰灼烧具备极高耐性。',
        lines: ['免疫烈焰护盾反伤与不死炎缠附伤，承受龙息与混沌系火焰魔法伤害减半。'],
      },
    });
  }

  if (ab.chaosResistant) {
    list.push({
      id: 'chaosResistant',
      icon: 'chaosResistant',
      polarity: 'positive',
      shortLabel: '抗混',
      accent: '#ffe399',
      bg: 'rgba(54, 40, 18, 0.94)',
      border: '#d6a44b',
      tooltip: {
        title: '混沌抗性',
        tag: '防御特技',
        accent: '#ffd46b',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '以严密秩序律法削弱混沌星火侵蚀。',
        lines: ['承受混沌系伤害法术与混沌专属符卡伤害时，最终魔伤降低 25%。'],
      },
    });
  }

  if (ab.lightningResistant) {
    list.push({
      id: 'lightningResistant',
      icon: 'lightningResistant',
      polarity: 'positive',
      shortLabel: '抗雷',
      accent: '#a6e8ff',
      bg: 'rgba(18, 38, 58, 0.94)',
      border: '#5ca9e6',
      tooltip: {
        title: '雷电抗性',
        tag: '防御特技',
        accent: '#7cd8ff',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '周身月都导流铠甲可有效消解天雷轰击。',
        lines: ['承受雷电系法术伤害时，最终魔伤降低 25%。'],
      },
    });
  }

  if (ab.giantSlayer) {
    list.push({
      id: 'giantSlayer',
      icon: 'giantSlayer',
      polarity: 'positive',
      shortLabel: '弑巨',
      accent: '#ffd185',
      bg: 'rgba(56, 32, 16, 0.94)',
      border: '#db8c3d',
      tooltip: {
        title: '巨人杀手',
        tag: '进攻特技',
        accent: '#ffba5c',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '专以巧劲瞄准庞然巨兽要害的精准打击。',
        lines: ['攻击 4 阶巨兽兵种时，造成的物理与远程伤害额外提升 50%。'],
      },
    });
  }

  if (ab.orderPurgeRanged) {
    list.push({
      id: 'orderPurgeRanged',
      icon: 'orderPurgeRanged',
      polarity: 'positive',
      shortLabel: '净秽',
      accent: '#b8e4ff',
      bg: 'rgba(20, 36, 66, 0.94)',
      border: '#66a3ff',
      tooltip: {
        title: '净秽裁决',
        tag: '进攻特技',
        accent: '#8cd4ff',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '月都净世雷光对污秽异端的无情裁断。',
        lines: ['向所有非秩序阵营的目标发动远程射击时，额外造成 20% 伤害。'],
      },
    });
  }

  if (ab.multipleAttack) {
    list.push({
      id: 'multipleAttack',
      icon: 'multipleAttack',
      polarity: 'positive',
      shortLabel: '全扫',
      accent: '#ffb899',
      bg: 'rgba(58, 24, 16, 0.94)',
      border: '#e0663d',
      tooltip: {
        title: '周身全扫',
        tag: '进攻特技',
        accent: '#ff8a66',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '以庞然巨躯横扫周身群敌的广域攻势。',
        lines: ['主动近战攻伐时同时波及自身周围所有相邻敌军，副目标不触发反击。'],
      },
    });
  }

  if (ab.breathAttack) {
    list.push({
      id: 'breathAttack',
      icon: 'breathAttack',
      polarity: 'positive',
      shortLabel: '龙息',
      accent: '#ff9ca8',
      bg: 'rgba(60, 14, 22, 0.94)',
      border: '#e63950',
      tooltip: {
        title: '贯穿吐息',
        tag: '进攻特技',
        accent: '#ff6678',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '喷吐烈焰洞穿前后两排的毁灭吐息。',
        lines: ['主动近战攻伐时沿进攻方向一并灼烧主目标身后紧邻格上的敌军。'],
      },
    });
  }

  if (ab.skeletal) {
    list.push({
      id: 'skeletal',
      icon: 'skeletal',
      polarity: 'positive',
      shortLabel: '骸骨',
      accent: '#e2dcf5',
      bg: 'rgba(34, 30, 52, 0.94)',
      border: '#9e92cc',
      tooltip: {
        title: '骸骨体质',
        tag: '防御特技',
        accent: '#d4cbf0',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '箭矢弹幕难以命中镂空骨骸的天然抗射体魄。',
        lines: ['承受一切远程物理射击时，有效防御力额外提升 100%。'],
      },
    });
  }

  if (ab.insubstantial) {
    list.push({
      id: 'insubstantial',
      icon: 'insubstantial',
      polarity: 'positive',
      shortLabel: '虚无',
      accent: '#9cf2ff',
      bg: 'rgba(18, 36, 58, 0.94)',
      border: '#66c2e6',
      tooltip: {
        title: '虚无体质',
        tag: '防御特技',
        accent: '#82ebff',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '飘渺难触的半透明幽灵躯体。',
        lines: ['承受近战与远程物理攻击时，有效防御力统一提升 100%。'],
      },
    });
  }

  if (ab.manaLeech) {
    list.push({
      id: 'manaLeech',
      icon: 'manaLeech',
      polarity: 'positive',
      shortLabel: '吸蓝',
      accent: '#dca6ff',
      bg: 'rgba(42, 18, 60, 0.94)',
      border: '#b56bff',
      tooltip: {
        title: '魔力吸取',
        tag: '战术特技',
        accent: '#cf8aff',
        badges: [SPEC_BADGE_UTILITY],
        summary: '悄然窃取敌方灵力反哺己方的红魔馆使魔绝技。',
        lines: ['每回合行动开始时自动触发（不耗行动权）：从敌方施法者窃取灵力并注入己方缺蓝施法者。'],
      },
    });
  }

  if (ab.agingOnHit) {
    list.push({
      id: 'agingOnHit',
      icon: 'agingOnHit',
      polarity: 'positive',
      shortLabel: '衰老',
      accent: '#d1b3ff',
      bg: 'rgba(36, 22, 54, 0.94)',
      border: '#9966cc',
      tooltip: {
        title: '衰老触碰',
        tag: '控场特效',
        accent: '#c299ff',
        badges: [SPEC_BADGE_CONTROL],
        summary: '抽离生命精气的幽冥寒手。',
        lines: ['近战命中活体目标时 35% 概率触发 3 回合衰老：攻击 -25%、防御 -20%、移速与先手减半。'],
      },
    });
  }

  if (ab.threeHeadedAttack) {
    list.push({
      id: 'threeHeadedAttack',
      icon: 'threeHeadedAttack',
      polarity: 'positive',
      shortLabel: '三翼',
      accent: '#ff8a9e',
      bg: 'rgba(54, 16, 28, 0.94)',
      border: '#e04260',
      tooltip: {
        title: '三翼裂袭',
        tag: '进攻特技',
        accent: '#ff6680',
        badges: [SPEC_BADGE_OFFENSE],
        summary: '群鸦俯冲同时撕裂正面与两翼的扇形顺劈。',
        lines: ['主动近战命中主目标时，同时横扫与自身和主目标共同相邻的左右侧敌军（副目标免反击）。'],
      },
    });
  }

  if (ab.lifeDraining) {
    list.push({
      id: 'lifeDraining',
      icon: 'lifeDraining',
      polarity: 'positive',
      shortLabel: '吸血',
      accent: '#ff8aa8',
      bg: 'rgba(62, 14, 28, 0.94)',
      border: '#e62e59',
      tooltip: {
        title: '吸血复苏',
        tag: '治愈神术',
        accent: '#ff5c82',
        badges: [SPEC_BADGE_HEAL],
        summary: '汲取鲜红生机愈合创伤与重聚眷属的血族本能。',
        lines: ['近战命中活体敌军时，将造成伤害的 50% 转化为自身生命回复，并复活已阵亡的同堆叠兵力。'],
      },
    });
  }

  if (ab.poisonAttack) {
    list.push({
      id: 'poisonAttack',
      icon: 'poisonAttack',
      polarity: 'positive',
      shortLabel: '剧毒',
      accent: '#9eff8a',
      bg: 'rgba(20, 48, 22, 0.94)',
      border: '#5ec952',
      tooltip: {
        title: '剧毒喷射',
        tag: '控场特效',
        accent: '#7dff66',
        badges: [SPEC_BADGE_CONTROL],
        summary: '浸染无名之丘铃兰瘴气的瞬发剧毒攻势。',
        lines: [
          '远程或近战命中活体非魔免目标时，无视物理防御瞬发每只 13 点基础剧毒伤害，受魔抗与抗死结界减免。',
          '同时令目标陷入持续剧毒，每回合开始自动承受等额毒伤直至被治愈！',
        ],
      },
    });
  }

  if (ab.fearAttack) {
    list.push({
      id: 'fearAttack',
      icon: 'fearAttack',
      polarity: 'positive',
      shortLabel: '恐惧',
      accent: '#d4a3ff',
      bg: 'rgba(38, 16, 56, 0.94)',
      border: '#a352e0',
      tooltip: {
        title: '死灵恐惧',
        tag: '控场特效',
        accent: '#c285ff',
        badges: [SPEC_BADGE_CONTROL],
        summary: '震慑生灵心魄的冥界龙威。',
        lines: ['主动近战进攻非免疫活体敌军时，完全压制敌方的反击行动（对机械、不死、元素、幻象无效）。'],
      },
    });
  }

  if (ab.lifeWard) {
    list.push({
      id: 'lifeWard',
      icon: 'lifeWard',
      polarity: 'positive',
      shortLabel: '抗生',
      accent: '#ff9ec2',
      bg: 'rgba(54, 16, 40, 0.94)',
      border: '#d64582',
      tooltip: {
        title: '抗生结界',
        tag: '防御特技',
        accent: '#ff70a6',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '深渊魔姬抵御神圣生命灵光的暗域结界。',
        lines: ['承受生命系法术伤害降低 50%，迎战生命阵营敌军时有效防御提升 50%。'],
      },
    });
  }

  if (ab.coldResistant) {
    list.push({
      id: 'coldResistant',
      icon: 'coldResistant',
      polarity: 'positive',
      shortLabel: '抗寒',
      accent: '#a8f0ff',
      bg: 'rgba(18, 42, 66, 0.94)',
      border: '#5cc4f5',
      tooltip: {
        title: '寒冰抗性',
        tag: '防御特技',
        accent: '#82e6ff',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '与极寒冰霜融为一体的深渊冰魔体魄。',
        lines: ['完全免疫极寒冰瀑等寒冰系法术，且承受寒霜物理打击伤害减半。'],
      },
    });
  }

  if (ab.freezingAttack) {
    list.push({
      id: 'freezingAttack',
      icon: 'freezingAttack',
      polarity: 'positive',
      shortLabel: '冰封',
      accent: '#8ceeff',
      bg: 'rgba(16, 38, 64, 0.94)',
      border: '#4db8f0',
      tooltip: {
        title: '寒霜冻结',
        tag: '控场特效',
        accent: '#66d9ff',
        badges: [SPEC_BADGE_CONTROL],
        summary: '将敌军瞬间封入深渊玄冰的极寒一击。',
        lines: ['近战命中非寒冰抗性且非全魔免的目标时，有 30% 概率将其冰封 2 回合无法行动。'],
      },
    });
  }

  if (ab.mechanical) {
    const m = SPECIAL_CREATURE_TAG_META.mechanical;
    list.push({
      id: 'mechanical',
      icon: 'mechanical',
      shortLabel: '机械',
      accent: m.color,
      bg: m.bg,
      border: m.border,
      tooltip: {
        title: '机械构造体',
        tag: '特殊生物类型',
        accent: '#b4c4db',
        badges: [{ label: '机械生物', icon: 'mechanical', color: m.color, bg: m.bg, border: m.border }],
        summary: '无血肉心智的自律机关与器灵造物。',
        lines: [
          '免疫正负士气波动与心智魔法，免疫剧毒、瘟疫、吸血、死亡之手及定身、震慑、石化等活体效果。',
          '无法接受生命系活体治愈、苏生复活与御神护命。',
        ],
      },
    });
  }

  if (ab.undead) {
    const m = SPECIAL_CREATURE_TAG_META.undead;
    list.push({
      id: 'undead',
      icon: 'undead',
      shortLabel: '不死',
      accent: m.color,
      bg: m.bg,
      border: m.border,
      tooltip: {
        title: '不死生物',
        tag: '特殊生物类型',
        accent: '#c094ff',
        badges: [{ label: '不死生物', icon: 'undead', color: m.color, bg: m.bg, border: m.border }],
        summary: '游离生死之外的幽冥亡灵之躯。',
        lines: [
          '免疫正负士气、心智魔法、剧毒、瘟疫、死亡之手与生命系活体治愈，可被死亡魔法招魂复生。',
          '同队不死威压会令己方所有非死亡系且非士气免疫的友军士气 -2，且受生命系破邪与圣言克制。',
        ],
      },
    });
  }

  if (ab.elemental) {
    const m = SPECIAL_CREATURE_TAG_META.elemental;
    list.push({
      id: 'elemental',
      icon: 'elemental',
      shortLabel: '元素',
      accent: m.color,
      bg: m.bg,
      border: m.border,
      tooltip: {
        title: '元素生物',
        tag: '特殊生物类型',
        accent: '#6ee6dc',
        badges: [{ label: '元素生物', icon: 'elemental', color: m.color, bg: m.bg, border: m.border }],
        summary: '由纯粹天地灵素凝结而成的非活体灵躯。',
        lines: [
          '免疫剧毒、瘟疫、吸血、死亡之手与生命系活体治愈，但不同于机械与不死，仍保留士气感召与心智响应。',
        ],
      },
    });
  }

  if (unit.isIllusion) {
    const m = SPECIAL_CREATURE_TAG_META.illusion;
    list.push({
      id: 'illusion',
      icon: 'illusion',
      shortLabel: '幻象',
      accent: m.color,
      bg: m.bg,
      border: m.border,
      tooltip: {
        title: '幻象分身',
        tag: '特殊生物类型',
        accent: '#8ce8ff',
        badges: [{ label: '幻象生物', icon: 'illusion', color: m.color, bg: m.bg, border: m.border }],
        summary: '由秩序魔法幻化投影的虚实分身。',
        lines: [
          '免疫心智魔法、活体生理效果及一切治愈与复活；遭受秩序魔法放逐虚境时承受 3.2 倍重创，战后自动消散。',
        ],
      },
    });
  }

  if (ab.stealth) {
    list.push({
      id: 'stealth',
      icon: 'stealth',
      polarity: 'positive',
      shortLabel: '潜行',
      accent: '#c7b8ff',
      bg: 'rgba(28, 20, 48, 0.94)',
      border: '#826bd6',
      tooltip: {
        title: '影遁潜行',
        tag: '防御特技',
        accent: '#a994ff',
        badges: [SPEC_BADGE_DEFENSE],
        summary: '隐匿于暗影之中的轻灵身法。',
        lines: ['常驻 +16% 擦弹率，且遭受远程弹幕射击时伤害额外 -15%。'],
      },
    });
  }

  if (ab.spellcaster) {
    list.push({
      id: 'spellcaster',
      icon: 'spellcaster',
      polarity: 'positive',
      shortLabel: '施法',
      accent: '#a8d4ff',
      bg: 'rgba(20, 34, 58, 0.94)',
      border: '#5c9be6',
      tooltip: {
        title: '施法兵种',
        tag: '战术特技',
        accent: '#82beff',
        badges: [SPEC_BADGE_UTILITY],
        summary: '能在战阵中直接咏唱术式的魔导兵队。',
        lines: ['轮到本队行动时可打开魔导折本消耗灵力施法，威力按存活兵力人头数线性提升。'],
      },
    });
  }

  if (ab.resurrection) {
    list.push({
      id: 'resurrection',
      icon: 'resurrection',
      polarity: 'positive',
      shortLabel: '苏生',
      accent: '#fff5b8',
      bg: 'rgba(58, 46, 18, 0.94)',
      border: '#f0cc5e',
      tooltip: {
        title: '战场苏生',
        tag: '治愈特技',
        accent: '#ffe885',
        badges: [SPEC_BADGE_HEAL],
        summary: '唤回阵亡活体魂魄的高阶神术。',
        lines: ['掌握生命魔法「博丽返魂苏生」，可在战场上复生已减员的活体友军，对机械、不死、元素、幻象无效。'],
      },
    });
  }

  return list;
}

/** 构造单位当前激活的实时状态/法术/结界光环图标列表（统一阵营与极性胶囊、零冗余括号） */
export function buildUnitStatusBadges(unit: BattleUnit, state: BattleState): HudIconBadge[] {
  const list: HudIconBadge[] = [];

  if (unit.statusEffects?.stunnedRounds > 0) {
    list.push({
      id: 'status_stunned',
      icon: 'stunOnHit',
      polarity: 'negative',
      roundsBadge: `${unit.statusEffects.stunnedRounds}`,
      shortLabel: '定身',
      accent: '#ffe680',
      bg: 'rgba(58, 42, 16, 0.95)',
      border: '#e6be4c',
      tooltip: {
        title: '符箓定身中',
        tag: `剩余 ${unit.statusEffects.stunnedRounds} 回合`,
        tagTone: 'danger',
        accent: '#ffe680',
        badges: [SPEC_BADGE_CONTROL],
        lines: ['下次轮到行动时将被强制跳过行动权并解除定身。'],
      },
    });
  }

  if (unit.statusEffects?.terrifiedRounds > 0) {
    list.push({
      id: 'status_terrified',
      icon: 'terrorOnHit',
      polarity: 'negative',
      roundsBadge: `${unit.statusEffects.terrifiedRounds}`,
      shortLabel: '震慑',
      accent: '#ff80a8',
      bg: 'rgba(60, 16, 36, 0.95)',
      border: '#e64578',
      tooltip: {
        title: '噩梦震慑中',
        tag: `剩余 ${unit.statusEffects.terrifiedRounds} 回合`,
        tagTone: 'danger',
        accent: '#ff80a8',
        badges: [SPEC_BADGE_CONTROL],
        lines: ['防御力 -15%，且下次轮到行动时将被强制跳过行动权。'],
      },
    });
  }

  const se = unit.statusEffects;
  const pushStatus = (
    id: string,
    icon: string,
    shortLabel: string,
    title: string,
    tag: string,
    lines: string[],
    positive: boolean,
    spellIconId?: string,
    roundsBadge?: string,
  ) => {
    const sp = spellIconId ? TOUHOU_CATALOG.spells[spellIconId] : undefined;
    const badges: HudTooltipMiniBadge[] = [];
    if (sp) {
      const am = ALIGNMENT_META[sp.alignment];
      badges.push({
        label: am.name,
        color: am.textColor,
        bg: 'rgba(22, 16, 26, 0.92)',
        border: am.themeColor,
      });
    }
    const polMeta = positive
      ? sp && (sp.healBase || sp.reviveBase || sp.specialEffect === 'regeneration' || sp.specialEffect === 'guardian_angel')
        ? SPELL_POLARITY_META.heal
        : SPELL_POLARITY_META.buff
      : SPELL_POLARITY_META.debuff;
    badges.push({
      label: polMeta.label,
      icon: polMeta.icon,
      color: polMeta.color,
      bg: polMeta.bg,
      border: polMeta.border,
    });

    list.push({
      id,
      icon,
      spellIconId,
      roundsBadge,
      polarity: positive ? 'positive' : 'negative',
      shortLabel,
      accent: positive ? '#b8f0d0' : '#f5b8e8',
      bg: positive ? 'rgba(18, 46, 36, 0.94)' : 'rgba(54, 18, 46, 0.94)',
      border: positive ? '#56ab80' : '#c95ca8',
      tooltip: {
        title,
        tag,
        tagTone: positive ? 'default' : 'danger',
        accent: sp ? ALIGNMENT_META[sp.alignment].textColor : positive ? '#84e8b4' : '#f29ee0',
        badges,
        lines,
      },
    });
  };

  if (se?.blindRounds && se.blindRounds > 0) {
    pushStatus('st_blind', 'spell_slow', '宵暗', '闇符「宵暗蔽目」', `剩余 ${se.blindRounds} 回合`, ['深陷宵暗跳过行动，受到任意伤害立刻惊醒解除。'], false, 'order_blind', `${se.blindRounds}`);
  }
  if (se?.confusionRounds && se.confusionRounds > 0) {
    pushStatus('st_confuse', 'spell_curse', '迷雾', '迷符「迷乱魔雾」', `剩余 ${se.confusionRounds} 回合`, ['神志迷乱，轮到行动时跳过本巡。'], false, 'chaos_confusion', `${se.confusionRounds}`);
  }
  if (se?.songOfPeaceRounds && se.songOfPeaceRounds > 0) {
    pushStatus('st_peace', 'spell_ward', '镇魂', '镇符「镇魂神乐」', `剩余 ${se.songOfPeaceRounds} 回合`, ['无法发起攻击或施放法术，受伤即破除。'], false, 'life_song_of_peace', `${se.songOfPeaceRounds}`);
  }
  if (se?.cowardiceRounds && se.cowardiceRounds > 0) {
    pushStatus('st_coward', 'terrorOnHit', '畏惧', '怯符「畏惧之瞳」', `剩余 ${se.cowardiceRounds} 回合`, ['不敢主动攻击总生命高于自身的敌军。'], false, 'order_cowardice', `${se.cowardiceRounds}`);
  }
  if (se?.berserkRounds && se.berserkRounds > 0) {
    pushStatus('st_berserk', 'spell_aoe', '月狂', '狂符「月狂赤瞳」', `剩余 ${se.berserkRounds} 回合`, ['理智崩坏，自动猛攻最近的任意单位，不分敌我。'], false, 'order_berserk', `${se.berserkRounds}`);
  }
  if (se?.hypnotizedRounds && se.hypnotizedRounds > 0) {
    pushStatus('st_hypno', 'spell_curse', '傀儡', '梦符「迷梦傀儡」', `剩余 ${se.hypnotizedRounds} 回合`, ['已被敌方迷梦操控，暂时转为对方阵营作战。'], false, 'order_hypnotize', `${se.hypnotizedRounds}`);
  }
  if (se?.poisonPower && se.poisonPower > 0) {
    pushStatus('st_poison', 'spell_curse', '铃兰毒', '毒符「铃兰剧毒」', `-${se.poisonPower}/回`, ['每回合开始承受持续剧毒流血伤害。'], false, 'death_poison', '毒');
  }
  if (se?.plaguePower && se.plaguePower > 0) {
    pushStatus('st_plague', 'death_magic', '瘴疫', '瘴符「黄泉瘴疫」', `-${se.plaguePower}/回`, ['每回合开始承受持续黄泉瘴疫折损。'], false, 'death_plague', '疫');
  }
  if (se?.frozenRounds && se.frozenRounds > 0) {
    pushStatus('st_frozen', 'freezingAttack', '冰封', '寒霜冻结', `剩余 ${se.frozenRounds} 回合`, ['被深渊寒冰彻底冻结，轮到行动时强制跳过。'], false, undefined, `${se.frozenRounds}`);
  }
  if (se?.agedRounds && se.agedRounds > 0) {
    pushStatus('st_aged', 'agingOnHit', '衰老', '衰老触碰', `剩余 ${se.agedRounds} 回合`, ['攻击 -25%、防御 -20%、移速与先手减半。'], false, undefined, `${se.agedRounds}`);
  }
  if (se?.regenPerRound && se.regenPerRound > 0) {
    pushStatus('st_regen', 'spell_heal', '不息', '生符「生生不息」', `+${se.regenPerRound}/回`, ['每回合开始自动恢复首兵生命值。'], true, 'life_regeneration', '+');
  }
  if (se?.tempShieldHp && se.tempShieldHp > 0) {
    pushStatus('st_hshield', 'spell_ward', '二重界', '结界「二重结界」', `护盾 ${se.tempShieldHp}`, ['优先吸收一切物理与法术伤害直至耗尽。'], true, 'life_heavenly_shield', '盾');
  }
  if (se?.guardianAngelLives && se.guardianAngelLives > 0) {
    pushStatus('st_gangel', 'resurrection', '护命', '神使「御神护命」', `余 ${se.guardianAngelLives} 次`, ['濒临全灭瞬间神使降临，抵消毁灭并重聚 35% 兵力。'], true, 'life_guardian_angel', `×${se.guardianAngelLives}`);
  }
  if (se?.sanctuary) {
    pushStatus('st_sanctuary', 'spell_ward', '净域', '净域「常世净域」', '绝对无敌', ['隐入常世免疫一切攻击与法术，一旦移动、攻击或施法即解除。'], true, 'life_sanctuary', '绝');
  }
  if (se?.martyrProtectedByUnitId) {
    const protector = state.units[se.martyrProtectedByUnitId];
    if (protector && protector.status === 'alive') {
      pushStatus('st_martyr', 'life_magic', '替身', '偶符「替身雏偶」', `由 ${protector.name} 承伤`, ['本单位所受的一切伤害均转嫁给替身友军承受。'], true, 'life_martyr', '替');
    }
  }
  if (se?.bless) {
    pushStatus('st_bless', 'life_magic', '神祝', '祝符「神祝满盈」', '满额伤害', ['近战与远程攻击恒定打出最大伤害。'], true, 'life_bless');
  }
  if (se?.curse) {
    pushStatus('st_curse', 'death_magic', '厄祟', '祟符「厄祟缠身」', '最低伤害', ['近战与远程攻击恒定只打出最小伤害。'], false, 'death_curse');
  }
  if (se?.retribution) {
    pushStatus('st_retrib', 'fireShield', '报应', '罚符「因果报应」', '反伤 35%', ['遭受近战打击时将 35% 伤害反射给攻击方。'], true, 'life_retribution');
  }
  if (se?.painMirror) {
    pushStatus('st_pmirror', 'order_magic', '水镜', '痛镜「因果水镜」', '反伤 50%', ['遭受近战或远程打击时将 50% 伤害反射给攻击方。'], true, 'order_pain_mirror');
  }
  if (se?.magicMirror) {
    pushStatus('st_mmirror', 'magicImmune', '折光', '镜符「贤者折光」', '50% 弹反', ['遭敌方单体伤害法术指定时，将 50% 威力反向弹回施法者。'], true, 'chaos_magic_mirror');
  }
  if (se?.vampiricTouch) {
    pushStatus('st_vamp', 'death_magic', '绯血', '红符「绯红吸血」', '吸血 50%', ['近战攻击活体目标时，将造成伤害的 50% 转化为自身回复与兵力复苏。'], true, 'death_vampiric_touch');
  }
  if (se?.fireAura) {
    pushStatus('st_faura', 'chaos_magic', '炎缠', '炎符「不死炎缠」', '近战 +25%', ['近战攻击附带额外 +25% 火焰灼烧伤害，不加成远程射击。'], true, 'chaos_fire_aura');
  }
  if (se?.auraOfFear) {
    pushStatus('st_fear', 'terrorOnHit', '威慑', '怖符「幽冥威慑」', '免反击', ['进攻活体非魔免敌军时完全压制对方反击，对机械、不死、元素、幻象无效。'], true, 'death_aura_of_fear');
  }
  if (se?.slayer) {
    pushStatus('st_slayer', 'atk', '屠龙', '斩符「屠龙魔刃」', '对 4 阶 +50%', ['攻击 4 阶巨兽与龙类单位时伤害额外 +50%。'], true, 'chaos_slayer');
  }
  if (se?.blur) {
    pushStatus('st_blur', 'stealth', '蜃影', '幻符「蜃气残影」', '远程 -35%', ['擦弹率 +25%，且遭受远程射击伤害额外 -35%。'], true, 'order_blur');
  }
  if (se?.precisionRounds && se.precisionRounds > 0) {
    pushStatus('st_precision', 'longRange', '狙定', '瞳符「天眼狙定」', `剩余 ${se.precisionRounds} 回合`, ['仅远程射击时攻击 +25%，并无视距离与普通障碍衰减，不加成近战。'], true, 'order_precision', `${se.precisionRounds}`);
  }
  if (se?.bloodlustRounds && se.bloodlustRounds > 0) {
    pushStatus('st_bloodlust', 'chaos_magic', '狂战', '鬼符「鬼神狂战」', `剩余 ${se.bloodlustRounds} 回合`, ['仅近战攻击伤害 +25%，不加成远程射击。'], true, 'chaos_bloodlust', `${se.bloodlustRounds}`);
  }
  if (se?.rabbitFormRounds && se.rabbitFormRounds > 0) {
    pushStatus(
      'st_rabbit_form',
      'spell_haste',
      '兔化',
      '兔符「兔化」',
      `剩余 ${se.rabbitFormRounds} 回合`,
      ['月影白兔真身形态生效中，到期或遭驱散后自动还原原形态。', '获得先攻压制 · 位移距离 +50% · 先手主动 +50% · 擦弹率 +50%。'],
      true,
      'order_rabbit_transform',
      `${se.rabbitFormRounds}`,
    );
  }
  if (se?.terrainWalk) {
    pushStatus('st_twalk', 'nature_magic', '履平', '步符「山林履平」', '无视减速', ['移动无视竹林与泥沼陷地等地面减速惩罚。'], true, 'nature_terrain_walk');
  }
  if (se?.powerDrain || se?.magicLeechCasterId) {
    pushStatus('st_pdrain', 'order_magic', '耗蓝×2', se.magicLeechCasterId ? '噬符「噬灵魔蛭」' : '涸符「灵脉枯竭」', '法力翻倍', ['施放法术消耗灵力翻倍。'], false, se.magicLeechCasterId ? 'death_magic_leech' : 'order_power_drain');
  }
  if (se?.spellShacklePower && se.spellShacklePower > 0) {
    pushStatus('st_shackle', 'chaos_magic', '咒缚', '缚符「咒缚反噬」', '施法反噬', ['每次施放法术都将按耗蓝承受剧烈灵力灼伤。'], false, 'chaos_spell_shackle');
  }
  if (se?.antiMagic) {
    pushStatus('st_antimagic', 'magicImmune', '反魔', '绝符「无魔绝域」', '全魔免', ['临时免疫一切正负面法术，可被星律解咒解除。'], true, 'nature_anti_magic');
  }
  if (se?.defenderBonus) {
    pushStatus('st_defender', 'defending', '不动', '守符「不动如山」', '防御 +50%', ['进入防御姿态时额外获得 +50% 护甲加成。'], true, 'life_defender');
  }
  if (se?.schoolWards && Object.keys(se.schoolWards).length > 0) {
    const firstSchool = Object.keys(se.schoolWards)[0];
    const wardIcon =
      firstSchool === 'death'
        ? 'life_death_ward'
        : firstSchool === 'order'
          ? 'life_order_ward'
          : firstSchool === 'nature'
            ? 'life_nature_ward'
            : 'life_chaos_ward';
    const names = Object.keys(se.schoolWards)
      .map((k) => ALIGNMENT_META[k as keyof typeof ALIGNMENT_META]?.systemLabel ?? k)
      .join(' / ');
    pushStatus('st_swards', 'spell_ward', '御界', '结界「御系大结界」', '防 +50% · 魔伤减半', [`已激活防护：${names}`], true, wardIcon);
  }

  if (unit.status === 'alive' && isUnitOnHighlandPlatform(state, unit)) {
    list.push({
      id: 'status_highland_platform',
      icon: 'ranged',
      polarity: 'positive',
      shortLabel: '高台',
      accent: '#9be7ff',
      bg: 'rgba(18, 42, 58, 0.94)',
      border: '#58b3d8',
      tooltip: {
        title: '站台高地加成',
        subtitle: '制高点视野与法术增幅',
        tag: '施法+50%',
        accent: '#9be7ff',
        badges: [SPEC_BADGE_DEFENSE],
        lines: [
          '• 攻击低处目标时触发高地压制，物理伤害 +25%。',
          '• 施放全部有射程术式时，有效施法距离 +50%。',
        ],
      },
    });
  }

  if (unit.isDefending) {
    list.push({
      id: 'status_defending',
      icon: 'defending',
      polarity: 'positive',
      roundsBadge: '1',
      shortLabel: '防御',
      accent: '#b9f0d2',
      bg: 'rgba(20, 48, 36, 0.94)',
      border: '#58b384',
      tooltip: {
        title: '防御姿态',
        tag: '剩余 1 回合',
        accent: '#82e0b0',
        badges: [SPEC_BADGE_DEFENSE],
        lines: ['当前防御力 +35%，持续至下次行动开始。'],
      },
    });
  }

  if (unit.hasRetaliatedThisRound && !unit.abilities.unlimitedRetaliation) {
    list.push({
      id: 'status_retaliated',
      icon: 'noRetaliation',
      polarity: 'negative',
      shortLabel: '已反',
      accent: '#f5b8c1',
      bg: 'rgba(56, 18, 28, 0.94)',
      border: '#c74c5e',
      tooltip: {
        title: '本回合已反击',
        tag: '本巡无反击',
        tagTone: 'danger',
        accent: '#eb6e80',
        badges: [SPEC_BADGE_LIMIT],
        lines: ['本回合近战与远程反击次数已耗尽，待下回合开始重新恢复；拥有无限反击特技的单位不受此限。'],
      },
    });
  }

  if (state.activeFieldAura) {
    const aura = state.activeFieldAura;
    const isAlly = aura.casterSide === unit.side;
    const mods = isAlly ? aura.allyModifiers : aura.enemyModifiers;
    const polMeta = isAlly ? SPELL_POLARITY_META.buff : SPELL_POLARITY_META.debuff;
    list.push({
      id: `aura_${aura.id}`,
      icon: 'aura',
      polarity: isAlly ? 'positive' : 'negative',
      roundsBadge: `${aura.remainingRounds}`,
      shortLabel: '结界',
      accent: aura.accentColor,
      bg: 'rgba(40, 18, 34, 0.95)',
      border: aura.themeColor,
      tooltip: {
        title: aura.name,
        subtitle: isAlly ? '友方结界领域增益' : '敌方符卡领域威压',
        tag: `剩余 ${aura.remainingRounds} 回合`,
        tagTone: isAlly ? 'default' : 'danger',
        accent: aura.accentColor,
        badges: [{ label: isAlly ? '领域增益' : '领域威压', icon: polMeta.icon, color: polMeta.color, bg: polMeta.bg, border: polMeta.border }],
        lines: mods.map((m) => {
          const val = m.mode === 'percent' ? `${m.value >= 0 ? '+' : ''}${Math.round(m.value * 100)}%` : `${m.value >= 0 ? '+' : ''}${m.value}`;
          return `${statKeyLabel(m.stat)} ${val}`;
        }),
      },
    });
  }

  // 按 sourceName 合并同类临时术式 Buff/Debuff，并继承 spellId 显示 24×24 专属法术图标
  const grouped = new Map<string, { remaining: number | null; positive: boolean; spellId?: string; lines: string[] }>();
  for (const mod of unit.modifiers) {
    // 兔化与衰老已由专属状态徽标统一承载详述，避免重复渲染多枚相同图标
    if (mod.spellId === 'order_rabbit_transform' && se?.rabbitFormRounds && se.rabbitFormRounds > 0) {
      continue;
    }
    if (mod.spellId === 'ability:aging' && se?.agedRounds && se.agedRounds > 0) {
      continue;
    }
    const entry = grouped.get(mod.sourceName) ?? {
      remaining: mod.remainingRounds,
      positive: mod.spellPolarity ? mod.spellPolarity === 'positive' : mod.value >= 0,
      spellId: mod.spellId,
      lines: [],
    };
    if (!entry.spellId && mod.spellId) entry.spellId = mod.spellId;
    const val =
      mod.mode === 'percent'
        ? `${mod.value >= 0 ? '+' : ''}${Math.round(mod.value * 100)}%`
        : `${mod.value >= 0 ? '+' : ''}${mod.value}`;
    entry.lines.push(`${statKeyLabel(mod.stat)} ${val}`);
    grouped.set(mod.sourceName, entry);
  }

  for (const [sourceName, info] of grouped.entries()) {
    const sp = info.spellId ? TOUHOU_CATALOG.spells[info.spellId] : undefined;
    const polMeta = info.positive ? SPELL_POLARITY_META.buff : SPELL_POLARITY_META.debuff;
    const badges: HudTooltipMiniBadge[] = [];
    if (sp) {
      const am = ALIGNMENT_META[sp.alignment];
      badges.push({ label: am.name, color: am.textColor, bg: 'rgba(22, 16, 26, 0.92)', border: am.themeColor });
    }
    badges.push({ label: polMeta.label, icon: polMeta.icon, color: polMeta.color, bg: polMeta.bg, border: polMeta.border });
    list.push({
      id: `mod_${sourceName}`,
      icon: info.positive ? 'buff' : 'debuff',
      spellIconId: info.spellId,
      roundsBadge: info.remaining != null ? `${info.remaining}` : undefined,
      polarity: info.positive ? 'positive' : 'negative',
      shortLabel: sourceName.replace(/^[^·]+·/, '').slice(0, 3),
      accent: info.positive ? '#b8f0d0' : '#e6bcf5',
      bg: info.positive ? 'rgba(18, 46, 36, 0.94)' : 'rgba(48, 20, 56, 0.94)',
      border: info.positive ? '#56ab80' : '#a862c7',
      tooltip: {
        title: sourceName,
        tag: info.remaining != null ? `剩余 ${info.remaining} 回合` : '持续效果',
        tagTone: info.positive ? 'default' : 'danger',
        accent: sp ? ALIGNMENT_META[sp.alignment].textColor : info.positive ? '#7fe0ae' : '#d699f0',
        badges,
        lines: info.lines,
      },
    });
  }

  return list.slice(0, 20);
}

/** 构造英雄固有特质徽章列表 */
export function buildHeroTraitBadges(unit: BattleUnit): HudIconBadge[] {
  const am = ALIGNMENT_META[unit.alignment];
  return unit.innateTraitIds
    .map((id) => HERO_TRAIT_REGISTRY[id])
    .filter(Boolean)
    .map((tr) => ({
      id: `trait_${tr.id}`,
      icon: 'trait',
      polarity: 'positive' as const,
      shortLabel: tr.name.slice(0, 4),
      accent: '#f5df9e',
      bg: 'rgba(60, 20, 30, 0.95)',
      border: '#cfa75b',
      tooltip: {
        title: `固有特质 · ${tr.name}`,
        tag: '英雄专属',
        accent: '#f5df9e',
        badges: [
          { label: `${am.factionName} · ${am.name}`, color: am.textColor, bg: 'rgba(22, 16, 26, 0.92)', border: am.themeColor },
          SPEC_BADGE_UTILITY,
        ],
        lines: [tr.description],
      },
    }));
}

/** 英雄纸娃娃 5 大装备槽位快照 */
export function buildHeroEquipmentSlots(unit: BattleUnit): Array<{
  slot: ArtifactDef['slot'];
  slotName: string;
  icon: string;
  artifact: ArtifactDef | null;
  tooltip: HudTooltipPayload;
}> {
  const slotDefs: Array<{ slot: ArtifactDef['slot']; slotName: string; icon: string }> = [
    { slot: 'weapon', slotName: '主手', icon: 'art_weapon' },
    { slot: 'head', slotName: '头冠', icon: 'art_head' },
    { slot: 'armor', slotName: '护甲', icon: 'art_armor' },
    { slot: 'accessory', slotName: '饰品', icon: 'art_accessory' },
    { slot: 'ring', slotName: '指环', icon: 'art_ring' },
  ];

  const equipped = unit.equippedArtifactIds
    .map((id) => TOUHOU_CATALOG.artifacts[id])
    .filter(Boolean);

  return slotDefs.map((s) => {
    const art = equipped.find((a) => a.slot === s.slot) ?? null;
    if (!art) {
      return {
        ...s,
        artifact: null,
        tooltip: {
          title: `${s.slotName}装备槽`,
          tag: '未装备',
          accent: '#9aa6c4',
          lines: ['当前未佩戴该部位神器。'],
        },
      };
    }
    const modLines = art.modifiers.map((m) => {
      const val =
        m.mode === 'percent'
          ? `${m.value >= 0 ? '+' : ''}${Math.round(m.value * 100)}%`
          : `${m.value >= 0 ? '+' : ''}${m.value}`;
      return `• ${statKeyLabel(m.stat)} ${val}`;
    });
    const badges: HudTooltipMiniBadge[] = [
      {
        label: `${s.slotName}神器`,
        icon: s.icon,
        color: '#f5df9e',
        bg: 'rgba(46, 34, 16, 0.92)',
        border: '#a8843c',
      },
    ];
    if (art.setId) {
      badges.push({
        label: '套装部件',
        icon: SPELL_POLARITY_META.buff.icon,
        color: '#a6f0ff',
        bg: 'rgba(18, 42, 54, 0.92)',
        border: '#5fa8c4',
      });
    }
    return {
      ...s,
      artifact: art,
      tooltip: {
        title: art.name,
        subtitle: art.setId ? `隶属套装 · ${TOUHOU_CATALOG.artifactSets[art.setId]?.name ?? ''}` : `${s.slotName}装备`,
        tag: s.slotName,
        accent: '#ffe28a',
        badges,
        summary: art.description,
        lines: modLines,
      },
    };
  });
}

/** 根据术式属性映射专属像素法术图标 ID（完整区分全部 142 个 HoMM4 术式类型） */
export function getSpellIconKey(spell: SpellDef): string {
  if (spell.isAdventureOnly || spell.targetType === 'adventure') return 'scouting';
  if (spell.specialEffect === 'summon_creature') return 'nature_magic';
  if (spell.specialEffect === 'raise_undead' || spell.specialEffect === 'animate_dead' || spell.specialEffect === 'death_call') {
    return 'death_magic';
  }
  if (spell.specialEffect === 'create_illusion' || spell.specialEffect === 'phantom_image' || spell.specialEffect === 'teleport') {
    return 'order_magic';
  }
  if (spell.reviveBase || spell.specialEffect === 'guardian_angel' || spell.specialEffect === 'divine_intervention') {
    return 'resurrection';
  }
  if (spell.healBase || spell.specialEffect === 'regeneration') return 'spell_heal';
  if (spell.targetType === 'hex_aoe' || spell.specialEffect === 'armageddon' || spell.specialEffect === 'fire_ring') {
    return 'spell_aoe';
  }
  if (spell.specialEffect === 'ward_single' || spell.specialEffect === 'ward_mass' || spell.specialEffect === 'heavenly_shield' || spell.specialEffect === 'sanctuary' || spell.specialEffect === 'anti_magic' || spell.id.includes('ward')) {
    return 'spell_ward';
  }
  if (spell.specialEffect === 'first_strike' || spell.specialEffect === 'cat_reflexes' || spell.id.includes('haste') || spell.id.includes('speed')) {
    return 'spell_haste';
  }
  if (spell.specialEffect === 'blind' || spell.specialEffect === 'confusion' || spell.specialEffect === 'song_of_peace' || spell.id.includes('slow')) {
    return 'spell_slow';
  }
  if (spell.debuffModifiers || spell.specialEffect === 'curse' || spell.specialEffect === 'poison' || spell.specialEffect === 'plague' || spell.specialEffect === 'berserk' || spell.specialEffect === 'hypnotize' || spell.id.includes('curse')) {
    return 'spell_curse';
  }
  if (spell.alignment === 'life') return 'spell_orb';
  if (spell.alignment === 'order') return 'order_magic';
  if (spell.alignment === 'death') return 'death_magic';
  if (spell.alignment === 'nature') return 'nature_magic';
  return 'spell_bolt';
}

export function statKeyLabel(key: StatKey): string {
  const map: Record<StatKey, string> = {
    attack: '攻击力',
    defense: '防御力',
    minDamage: '最小伤害',
    maxDamage: '最大伤害',
    maxHp: '生命上限',
    speed: '移动力',
    initiative: '先手主动',
    range: '远程射程',
    morale: '部队士气',
    luck: '战斗幸运',
    magicResistance: '魔法抗性',
    grazeChance: '擦弹减伤',
    spellPower: '法术强度',
    maxMana: '灵力上限',
  };
  return map[key] ?? key;
}

/** 构造单个属性方格的悬浮公式明细 */
export function buildStatCellTooltip(
  label: string,
  valueText: string,
  statKeys: StatKey[],
  stats: ComputedUnitStats,
  extraLines: string[] = [],
): HudTooltipPayload {
  const lines: string[] = [...extraLines];
  const seen = new Set<string>();
  for (const k of statKeys) {
    const items = stats.breakdowns[k];
    if (!items) continue;
    for (const it of items) {
      const tag = `${it.sourceName}:${it.deltaText}`;
      if (seen.has(tag)) continue;
      seen.add(tag);
      lines.push(`• ${it.sourceName}  ${it.deltaText}`);
    }
  }
  if (lines.length === 0) {
    lines.push('当前为基础面板数值，暂无额外修正。');
  }
  return {
    title: `${label}：${valueText}`,
    tag: '实时属性明细',
    accent: '#ffe484',
    lines,
  };
}

function spellTargetLabel(type: SpellDef['targetType']): string {
  switch (type) {
    case 'ally_unit':
      return '单体友军';
    case 'enemy_unit':
      return '单体敌军';
    case 'any_unit':
      return '任意单位';
    case 'hex_aoe':
      return '区域范围';
    case 'hex_empty':
      return '空地召唤';
    case 'unit_to_hex':
      return '目标至空地';
    case 'ally_to_ally':
      return '双友联动';
    case 'corpse_unit':
      return '战场残骸';
    case 'adventure':
      return '大地图术式';
    default:
      return '即刻施放';
  }
}

/** 构造统一精炼的法术三段式悬浮提示（阵营与极性彩色胶囊 + 简介 + 客观效果 + 可选斜体小字彩蛋，零冗余括号） */
export function buildSpellTooltipPayload(
  spell: SpellDef,
  opts: {
    effectiveManaCost?: number;
    currentMana?: number;
    effectiveRange?: number;
  } = {},
): HudTooltipPayload {
  const isAdv = Boolean(spell.isAdventureOnly || spell.targetType === 'adventure');
  const cost = opts.effectiveManaCost ?? spell.manaCost;
  const manaShort = !isAdv && opts.currentMana !== undefined && opts.currentMana < cost;
  const copy = getSpellCopy(spell);
  const align = ALIGNMENT_META[spell.alignment];
  const pol = SPELL_POLARITY_META[classifySpellPolarity(spell)];

  const effRange = opts.effectiveRange ?? spell.range;
  const hasHighlandRangeBoost = spell.range > 0 && effRange > spell.range;
  const subParts = [
    align.name,
    `Lv.${spell.level}`,
    spellTargetLabel(spell.targetType),
  ];
  if (spell.range > 0) {
    subParts.push(hasHighlandRangeBoost ? `${effRange}格(高台+50%)` : `${effRange}格`);
  }

  const lines = [copy.effect];
  if (hasHighlandRangeBoost) {
    lines.push(`站台高地增益：有效施法距离 +50%（${spell.range} → ${effRange} 格）。`);
  }

  return {
    title: formatSpellCardTitle(spell),
    subtitle: subParts.join(' · '),
    tag: isAdv ? '大地图' : `${cost} MP`,
    tagTone: isAdv ? 'muted' : manaShort ? 'danger' : 'default',
    accent: align.themeColor,
    badges: [
      {
        label: align.name,
        color: align.textColor,
        bg: 'rgba(22, 16, 26, 0.92)',
        border: align.themeColor,
      },
      {
        label: pol.label,
        icon: pol.icon,
        color: pol.color,
        bg: pol.bg,
        border: pol.border,
      },
    ],
    summary: copy.summary,
    lines,
    flavor: copy.flavor,
  };
}

/** 构造统一精炼的英雄专属符卡三段式悬浮提示 */
export function buildSpellCardTooltipPayload(
  card: SpellCardDef,
  opts: {
    currentMana?: number;
    currentCharge?: number;
  } = {},
): HudTooltipPayload {
  const copy = getSpellCardCopy(card);
  const align = ALIGNMENT_META[card.alignment];
  const pol = SPELL_POLARITY_META[classifySpellCardPolarity(card)];
  const ready =
    opts.currentMana !== undefined &&
    opts.currentCharge !== undefined &&
    opts.currentMana >= card.manaCost &&
    opts.currentCharge >= card.chargeCost;
  const chargeText = opts.currentCharge !== undefined ? `${opts.currentCharge}%` : `${card.chargeCost}%`;

  return {
    title: card.name,
    subtitle: `${align.name} · 专属符卡`,
    tag: `${card.manaCost} MP · ${chargeText}`,
    tagTone: opts.currentMana !== undefined && !ready ? 'muted' : 'default',
    accent: '#f5df9e',
    badges: [
      {
        label: align.name,
        color: align.textColor,
        bg: 'rgba(22, 16, 26, 0.92)',
        border: align.themeColor,
      },
      {
        label: `${pol.label}符卡`,
        icon: pol.icon,
        color: pol.color,
        bg: pol.bg,
        border: pol.border,
      },
    ],
    summary: copy.summary,
    lines: [copy.effect],
    flavor: copy.flavor,
  };
}

/**
 * 单位控场、元素抗性、不死/重型特技与生物类型徽章构造器
 */

import type { BattleUnit } from '@core/types';
import { SPECIAL_CREATURE_TAG_META } from '@ui/semanticFormat';
import type { HudIconBadge } from '../types';
import {
  SPEC_BADGE_CONTROL,
  SPEC_BADGE_DEFENSE,
  SPEC_BADGE_HEAL,
  SPEC_BADGE_OFFENSE,
  SPEC_BADGE_UTILITY,
} from './constants';

type UnitAbilities = BattleUnit['abilities'];

/** 构造命中控场与元素/派系抗性特技徽章 */
export function appendControlAndResistanceBadges(ab: UnitAbilities, list: HudIconBadge[]): void {
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
        lines: ['承受混沌系伤害法术与混沌专属符卡伤害时，最终魔伤 -25%。'],
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
        lines: ['承受雷电系法术伤害时，最终魔伤 -25%。'],
      },
    });
  }
}

/** 构造重型进攻、不死/亡灵特质、剧毒恐惧与深渊寒霜特技徽章 */
export function appendHeavyOffenseAndUndeadSpecialtyBadges(ab: UnitAbilities, list: HudIconBadge[]): void {
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
        lines: ['攻击 4 阶巨兽兵种时，造成的物理与远程伤害额外 +50%。'],
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
        lines: ['向所有非秩序阵营的目标发动远程射击时，伤害额外 +20%。'],
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
        lines: ['承受一切远程物理射击时，有效防御力 +100%。'],
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
        lines: ['承受近战与远程物理攻击时，有效防御力 +100%。'],
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
        lines: ['每回合行动开始时自动触发且不耗行动权，从敌方施法者窃取灵力并注入己方缺蓝施法者。'],
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
        lines: ['主动近战命中主目标时，同时横扫与自身和主目标共同相邻的左右侧敌军，副目标免反击。'],
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
        lines: ['主动近战进攻非免疫活体敌军时完全压制敌方反击，对机械、不死、元素、幻象无效。'],
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
        lines: ['承受生命系法术伤害 -50%，迎战生命阵营敌军时有效防御 +50%。'],
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
}

/** 构造特殊生物类型、潜行、施法与战场苏生特技徽章 */
export function appendCreatureTypeAndCasterBadges(unit: BattleUnit, ab: UnitAbilities, list: HudIconBadge[]): void {
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
}

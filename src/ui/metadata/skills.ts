/**
 * 英雄主技能树展示元数据与熟练度阶位名称
 */

import { ALIGNMENT_META } from '@core/alignment';
import type { PrimarySkillId, SkillRank } from '@core/types';

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

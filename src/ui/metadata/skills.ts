/**
 * 英雄主技能树展示元数据与熟练度阶位名称（零冗余括号与 H4 缩写）
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
    desc: '强化全军移动力与先手主动，下辖进攻、防御与领导，晋升高阶需同步修习进攻与防御。',
  },
  combat: {
    name: '格斗',
    short: '格斗',
    icon: 'combat',
    color: '#ff7888',
    desc: '提升英雄个人防卫能力至最高 100%，下辖近战、射击与魔抗三大个人战斗专精。',
  },
  scouting: {
    name: '侦查',
    short: '侦查',
    icon: 'scouting',
    color: '#7ef0b5',
    desc: '扩大视野并提升先手、移速与擦弹潜行，下辖寻路、航海与潜行。',
  },
  nobility: {
    name: '贵族',
    short: '贵族',
    icon: 'nobility',
    color: '#f2c97d',
    desc: '统筹领地资源产量并强化全军生命、幸运、护甲与士气，下辖理财、采矿与外交。',
  },
  life_magic: {
    name: '生命魔法',
    short: '生命',
    icon: 'life_magic',
    color: ALIGNMENT_META.life.themeColor,
    desc: '掌控生命系治愈、保护结界与苏生神术，下辖治疗、灵性与复活。',
  },
  order_magic: {
    name: '秩序魔法',
    short: '秩序',
    icon: 'order_magic',
    color: ALIGNMENT_META.order.themeColor,
    desc: '掌控秩序系幻象、心智控制与时空术式，下辖附魔、巫术与魅惑。',
  },
  death_magic: {
    name: '死亡魔法',
    short: '死亡',
    icon: 'death_magic',
    color: ALIGNMENT_META.death.themeColor,
    desc: '掌控死亡系诅咒、剧毒吸魂与招魂术式，下辖神秘、恶魔与招魂。',
  },
  chaos_magic: {
    name: '混沌魔法',
    short: '混沌',
    icon: 'chaos_magic',
    color: ALIGNMENT_META.chaos.themeColor,
    desc: '掌控混沌系破坏星火与全系直接伤害增幅，下辖魔咒、烈焰与魔力。',
  },
  nature_magic: {
    name: '自然魔法',
    short: '自然',
    icon: 'nature_magic',
    color: ALIGNMENT_META.nature.themeColor,
    desc: '掌控自然系生灵召唤、冥想回蓝与草药回复，下辖草药、冥想与召唤。',
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

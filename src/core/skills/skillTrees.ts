/**
 * HoMM4 完整「9 大主技能 × 3 子技能 = 36 技能树」元数据与前置解锁规则
 */

import type { Alignment } from '../alignment';
import type { PrimarySkillId, SecondarySkillId, SkillRank } from '../types';

export interface PrimarySkillTreeMeta {
  id: PrimarySkillId;
  name: string;
  short: string;
  h4Name: string;
  icon: string;
  color: string;
  isMagic: boolean;
  magicSchool?: Exclude<Alignment, 'might'>;
  subSkills: readonly [SecondarySkillId, SecondarySkillId, SecondarySkillId];
  desc: string;
}

export interface SecondarySkillMeta {
  id: SecondarySkillId;
  parent: PrimarySkillId;
  /** 在所属主树中的序号 1 / 2 / 3（分别需主技能 Lv.1 / Lv.2 / Lv.3 解锁） */
  slotIndex: 1 | 2 | 3;
  name: string;
  short: string;
  h4Name: string;
  desc: string;
  /** 纯战斗沙盒内效果摘要 */
  combatEffect: string;
  /** 是否含大地图专属效果（同时附带沙盒风味实战彩蛋） */
  isAdventureFlavored?: boolean;
}

export const ALL_PRIMARY_SKILL_IDS: readonly PrimarySkillId[] = [
  'combat',
  'tactics',
  'scouting',
  'nobility',
  'life_magic',
  'order_magic',
  'death_magic',
  'chaos_magic',
  'nature_magic',
] as const;

export const MAGIC_PRIMARY_SKILL_IDS: readonly PrimarySkillId[] = [
  'life_magic',
  'order_magic',
  'death_magic',
  'chaos_magic',
  'nature_magic',
] as const;

/** 9 大主技能树完整定义（含各自下属 3 项二级专精） */
export const SKILL_TREE_META: Record<PrimarySkillId, PrimarySkillTreeMeta> = {
  combat: {
    id: 'combat',
    name: '格斗',
    short: '格斗',
    h4Name: 'Combat',
    icon: 'combat',
    color: '#ff7888',
    isMagic: false,
    subSkills: ['melee', 'archery', 'magic_resistance'],
    desc: '强化英雄个人体术生存：每阶 +8% 防御与 +12% 生命上限，并解锁近战/射击/魔抗专精。',
  },
  tactics: {
    id: 'tactics',
    name: '战术',
    short: '战术',
    h4Name: 'Tactics',
    icon: 'tactics',
    color: '#ffcf66',
    isMagic: false,
    subSkills: ['offense', 'defense', 'leadership'],
    desc: '英雄随军指挥光环：每阶赋予己方全军 +5% 攻防与 +1 先手，1/3/5 阶各 +1 移速。',
  },
  scouting: {
    id: 'scouting',
    name: '侦查',
    short: '侦查',
    h4Name: 'Scouting',
    icon: 'scouting',
    color: '#7ef0b5',
    isMagic: false,
    subSkills: ['pathfinding', 'seamanship', 'stealth'],
    desc: '扩大战场洞察与身法：每阶赋予英雄 +1 先手主动与 +4% 擦弹率。',
  },
  nobility: {
    id: 'nobility',
    name: '贵族',
    short: '贵族',
    h4Name: 'Nobility',
    icon: 'nobility',
    color: '#f2c97d',
    isMagic: false,
    subSkills: ['estates', 'mining', 'diplomacy'],
    desc: '大地图城镇产兵治理核心；战斗沙盒中赋予全军「精锐动员」每阶 +4% 生命上限。',
  },
  life_magic: {
    id: 'life_magic',
    name: '生命魔法',
    short: '生命',
    h4Name: 'Life Magic',
    icon: 'life_magic',
    color: '#e04f5f',
    isMagic: true,
    magicSchool: 'life',
    subSkills: ['healing', 'spirituality', 'resurrection_skill'],
    desc: '解锁 1~5 阶生命结界与神圣回复术式，每阶额外 +1 法术强度。',
  },
  order_magic: {
    id: 'order_magic',
    name: '秩序魔法',
    short: '秩序',
    h4Name: 'Order Magic',
    icon: 'order_magic',
    color: '#6699ff',
    isMagic: true,
    magicSchool: 'order',
    subSkills: ['enchantment', 'wizardry', 'charm'],
    desc: '解锁 1~5 阶秩序幻象与时空术式，每阶额外 +1 法术强度。',
  },
  death_magic: {
    id: 'death_magic',
    name: '死亡魔法',
    short: '死亡',
    h4Name: 'Death Magic',
    icon: 'death_magic',
    color: '#8d65d6',
    isMagic: true,
    magicSchool: 'death',
    subSkills: ['occultism', 'demonology', 'necromancy'],
    desc: '解锁 1~5 阶幽冥诅咒与招魂术式，每阶额外 +1 法术强度。',
  },
  chaos_magic: {
    id: 'chaos_magic',
    name: '混沌魔法',
    short: '混沌',
    h4Name: 'Chaos Magic',
    icon: 'chaos_magic',
    color: '#f6c945',
    isMagic: true,
    magicSchool: 'chaos',
    subSkills: ['conjuration', 'pyromancy', 'sorcery'],
    desc: '解锁 1~5 阶混沌星炮与爆炎破坏术式，每阶额外 +1 法术强度。',
  },
  nature_magic: {
    id: 'nature_magic',
    name: '自然魔法',
    short: '自然',
    h4Name: 'Nature Magic',
    icon: 'nature_magic',
    color: '#4fd18b',
    isMagic: true,
    magicSchool: 'nature',
    subSkills: ['herbalism', 'meditation', 'summoning'],
    desc: '解锁 1~5 阶自然强化与生灵召请术式，每阶额外 +1 法术强度。',
  },
};

/** 全部 27 项二级子技能完整定义（9×3 = 27） */
export const SECONDARY_SKILL_META: Record<SecondarySkillId, SecondarySkillMeta> = {
  // === 格斗 (Combat) ===
  melee: {
    id: 'melee',
    parent: 'combat',
    slotIndex: 1,
    name: '近战',
    short: '近战',
    h4Name: 'Melee',
    desc: '锤炼英雄近身格斗技，大幅增强英雄近战攻击与杀伤。',
    combatEffect: '英雄攻击 +2/阶，近战伤害 +12%/阶。',
  },
  archery: {
    id: 'archery',
    parent: 'combat',
    slotIndex: 2,
    name: '射击',
    short: '射击',
    h4Name: 'Archery',
    desc: '精通灵弹与弓矢远射，赋予英雄远程射击能力并提升远射杀伤。',
    combatEffect: '解锁英雄远程弹幕，基础射程 8 格，攻击 +2/阶，远程伤害 +12%/阶。',
  },
  magic_resistance: {
    id: 'magic_resistance',
    parent: 'combat',
    slotIndex: 3,
    name: '魔抗',
    short: '魔抗',
    h4Name: 'Magic Resistance',
    desc: '以强韧意志抵御魔力侵蚀，大幅提高英雄个人魔法抗性。',
    combatEffect: '英雄个人魔法抗性 +14%/阶，宗师叠加最高可达 95%。',
  },

  // === 战术 (Tactics) ===
  offense: {
    id: 'offense',
    parent: 'tactics',
    slotIndex: 1,
    name: '进攻',
    short: '进攻',
    h4Name: 'Offense',
    desc: '指挥己方全军发动凌厉攻势，全面强化全军物理与远程进攻力。',
    combatEffect: '己方全军攻击 +10%/阶。',
  },
  defense: {
    id: 'defense',
    parent: 'tactics',
    slotIndex: 2,
    name: '防御',
    short: '防御',
    h4Name: 'Defense',
    desc: '构筑严密防线阵型，全面提升己方全军物理防御力。',
    combatEffect: '己方全军防御 +10%/阶。',
  },
  leadership: {
    id: 'leadership',
    parent: 'tactics',
    slotIndex: 3,
    name: '领导',
    short: '领导',
    h4Name: 'Leadership',
    desc: '统御三军提振战意，显著拉升全军士气并缓和跨阵营混编惩罚。',
    combatEffect: '己方全军士气 +1/阶。',
  },

  // === 侦查 (Scouting) ===
  pathfinding: {
    id: 'pathfinding',
    parent: 'scouting',
    slotIndex: 1,
    name: '寻路',
    short: '寻路',
    h4Name: 'Pathfinding',
    desc: '熟稔山林小径，降低复杂地形移动消耗并提升全军机动力。',
    combatEffect: '全军 3/5 阶各 +1 移速，4 阶以上赋予全军无视地面减速。',
  },
  seamanship: {
    id: 'seamanship',
    parent: 'scouting',
    slotIndex: 2,
    name: '渡雾',
    short: '渡雾',
    h4Name: 'Seamanship',
    desc: '大地图水域航行与迷雾穿行专精，战斗中提升全军灵动闪避与攻防身法。',
    combatEffect: '己方全军擦弹 +3%/阶，攻击与防御 +2%/阶。',
    isAdventureFlavored: true,
  },
  stealth: {
    id: 'stealth',
    parent: 'scouting',
    slotIndex: 3,
    name: '潜行',
    short: '潜行',
    h4Name: 'Stealth',
    desc: '暗夜隐匿气息，大幅强化英雄擦弹率与远程减伤，3 阶激活影遁潜行特技。',
    combatEffect: '英雄擦弹 +6%/阶，受远程伤害 -6%/阶，3 阶激活影遁潜行。',
  },

  // === 贵族 (Nobility) ===
  estates: {
    id: 'estates',
    parent: 'nobility',
    slotIndex: 1,
    name: '理财',
    short: '理财',
    h4Name: 'Estates',
    desc: '大地图每日赛钱收益增长，战斗中以丰厚军饷提振全军福运。',
    combatEffect: '己方全军 2/4/5 阶各获得幸运 +1。',
    isAdventureFlavored: true,
  },
  mining: {
    id: 'mining',
    parent: 'nobility',
    slotIndex: 2,
    name: '采矿',
    short: '采矿',
    h4Name: 'Mining',
    desc: '大地图每日产出玄石与魔晶，战斗中以精良锻造甲胄强化全军护甲。',
    combatEffect: '己方全军防御 +3%/阶。',
    isAdventureFlavored: true,
  },
  diplomacy: {
    id: 'diplomacy',
    parent: 'nobility',
    slotIndex: 3,
    name: '外交',
    short: '外交',
    h4Name: 'Diplomacy',
    desc: '大地图招降中立族群，战斗中以人格威望鼓舞全军战意。',
    combatEffect: '己方全军 2/4/5 阶各获得士气 +1。',
    isAdventureFlavored: true,
  },

  // === 生命魔法 (Life Magic) ===
  healing: {
    id: 'healing',
    parent: 'life_magic',
    slotIndex: 1,
    name: '治疗',
    short: '治疗',
    h4Name: 'Healing',
    desc: '精通生命魔法治愈与护盾术式，并赋予英雄每回合自然恢复生命。',
    combatEffect: '治疗、护盾与再生术效力 +15%/阶，英雄每回合自愈 4×阶 HP。',
  },
  spirituality: {
    id: 'spirituality',
    parent: 'life_magic',
    slotIndex: 2,
    name: '灵性',
    short: '灵性',
    h4Name: 'Spirituality',
    desc: '深修神社灵韵，拓宽灵力上限并强化生命系增益与结界术式。',
    combatEffect: '最大灵力 +6/阶，生命系术式威力 +10%/阶，3 阶起增益持续 +1 回合。',
  },
  resurrection_skill: {
    id: 'resurrection_skill',
    parent: 'life_magic',
    slotIndex: 3,
    name: '复活',
    short: '复活',
    h4Name: 'Resurrection',
    desc: '参透返魂苏生奥义，显著放大生命系苏生、御神护命与净域类神术效果。',
    combatEffect: '苏生与护命类神术效果 +18%/阶，英雄倒地后每回合额外积累灵力。',
  },

  // === 秩序魔法 (Order Magic) ===
  enchantment: {
    id: 'enchantment',
    parent: 'order_magic',
    slotIndex: 1,
    name: '附魔',
    short: '附魔',
    h4Name: 'Enchantment',
    desc: '精于秩序魔法附魔与镜面幻象，提升所有秩序系增益、减益与幻象强度。',
    combatEffect: '秩序系法术威力与幻象规模 +15%/阶。',
  },
  wizardry: {
    id: 'wizardry',
    parent: 'order_magic',
    slotIndex: 2,
    name: '巫术',
    short: '巫术',
    h4Name: 'Wizardry',
    desc: '博通魔导学理，大幅扩充英雄最大灵力池并加速回合回蓝。',
    combatEffect: '最大灵力 +10/阶，英雄每回合开始自动恢复 1×阶 MP。',
  },
  charm: {
    id: 'charm',
    parent: 'order_magic',
    slotIndex: 3,
    name: '魅惑',
    short: '魅惑',
    h4Name: 'Charm',
    desc: '摄魂惑心之秘术，强化催眠、致盲、狂暴与畏惧等心智控制术式。',
    combatEffect: '心智控制法术威力 +12%/阶，3 阶起控场持续 +1 回合。',
  },

  // === 死亡魔法 (Death Magic) ===
  occultism: {
    id: 'occultism',
    parent: 'death_magic',
    slotIndex: 1,
    name: '神秘',
    short: '神秘',
    h4Name: 'Occultism',
    desc: '窥探幽冥秘法，拓宽灵力上限并增强死亡系直伤与吸魂威力。',
    combatEffect: '最大灵力 +8/阶，死亡系法术威力 +12%/阶。',
  },
  demonology: {
    id: 'demonology',
    parent: 'death_magic',
    slotIndex: 2,
    name: '恶魔',
    short: '恶魔',
    h4Name: 'Demonology',
    desc: '驾驭魔界瘴毒与诅咒契约，强化剧毒、瘴疫与恶魔召请术。',
    combatEffect: '剧毒、瘴疫与恶魔召唤术威力 +15%/阶。',
  },
  necromancy: {
    id: 'necromancy',
    parent: 'death_magic',
    slotIndex: 3,
    name: '招魂',
    short: '招魂',
    h4Name: 'Necromancy',
    desc: '唤起战场亡骸为己所用，显著提高一切不死亡灵唤起与复生兵力数。',
    combatEffect: '唤起骷髅、幽灵、吸血鬼与不死复生数量 +20%/阶。',
  },

  // === 混沌魔法 (Chaos Magic) ===
  conjuration: {
    id: 'conjuration',
    parent: 'chaos_magic',
    slotIndex: 1,
    name: '魔咒',
    short: '魔咒',
    h4Name: 'Conjuration',
    desc: '精炼混沌咒文，提升灵力上限并增幅混沌系辅助、控场与范围咒术。',
    combatEffect: '最大灵力 +6/阶，混沌系非直伤与范围咒术威力 +12%/阶。',
  },
  pyromancy: {
    id: 'pyromancy',
    parent: 'chaos_magic',
    slotIndex: 2,
    name: '烈焰',
    short: '烈焰',
    h4Name: 'Pyromancy',
    desc: '焚尽八荒的星火破坏专精，专项大幅增幅全部混沌系直伤法术。',
    combatEffect: '混沌系直伤法术伤害 +16%/阶。',
  },
  sorcery: {
    id: 'sorcery',
    parent: 'chaos_magic',
    slotIndex: 3,
    name: '魔力',
    short: '魔力',
    h4Name: 'Sorcery',
    desc: '贯通万象的全系魔导增幅专精，无分派系全面提升全部五系法术威力。',
    combatEffect: '全部五系法术最终威力 +10%/阶，宗师可提供全系 +50%。',
  },

  // === 自然魔法 (Nature Magic) ===
  herbalism: {
    id: 'herbalism',
    parent: 'nature_magic',
    slotIndex: 1,
    name: '草药',
    short: '草药',
    h4Name: 'Herbalism',
    desc: '深谙灵草秘药调配，强化腰带药水、自然系增益与剧毒，并附带每回合自愈。',
    combatEffect: '自然系增益与腰带药水效力 +15%/阶，英雄每回合自愈 3×阶 HP。',
  },
  meditation: {
    id: 'meditation',
    parent: 'nature_magic',
    slotIndex: 2,
    name: '冥想',
    short: '冥想',
    h4Name: 'Meditation',
    desc: '凝神吐纳天地灵气，大幅扩充最大灵力上限并提升每回合自动回蓝。',
    combatEffect: '最大灵力 +12/阶，英雄每回合开始自动恢复 1×阶 MP。',
  },
  summoning: {
    id: 'summoning',
    parent: 'nature_magic',
    slotIndex: 3,
    name: '召唤',
    short: '召唤',
    h4Name: 'Summoning',
    desc: '沟通幻想乡万灵，大幅提升所有自然系召唤妖精、圣兽与元素兵力。',
    combatEffect: '自然系全部召唤生物兵力规模 +20%/阶。',
  },
};

export const ALL_SECONDARY_SKILL_IDS: readonly SecondarySkillId[] = Object.keys(
  SECONDARY_SKILL_META,
) as SecondarySkillId[];

/** 获取某子技能的解锁所需主技能阶位（slot1=1, slot2=2, slot3=3） */
export function getSubSkillUnlockPrimaryRank(subId: SecondarySkillId): SkillRank {
  return SECONDARY_SKILL_META[subId].slotIndex as SkillRank;
}

/** 计算某子技能在当前主技能等级下允许达到的最高阶位（0 表示未解锁） */
export function getSubSkillMaxAllowedRank(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subId: SecondarySkillId,
): SkillRank {
  const meta = SECONDARY_SKILL_META[subId];
  const parentRank = skills[meta.parent] ?? 0;
  if (parentRank < meta.slotIndex) return 0;
  return parentRank;
}

/** 校验某子技能是否可以 +1，并返回原因说明 */
export function canIncrementSubSkill(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>>,
  subId: SecondarySkillId,
): { ok: boolean; reason?: string } {
  const current = subSkills[subId] ?? 0;
  if (current >= 5) return { ok: false, reason: '已达宗师上限 (Lv.5)' };
  const meta = SECONDARY_SKILL_META[subId];
  const parentMeta = SKILL_TREE_META[meta.parent];
  const parentRank = skills[meta.parent] ?? 0;
  if (parentRank < meta.slotIndex) {
    return { ok: false, reason: `需先将主技能「${parentMeta.name}」升至 Lv.${meta.slotIndex}` };
  }
  if (current + 1 > parentRank) {
    return { ok: false, reason: `子技能阶位不可超过主技能「${parentMeta.name}」(Lv.${parentRank})` };
  }
  return { ok: true };
}

/** 当主技能降低时，自动级联收敛下属子技能阶位以维持 H4 合法前置约束 */
export function clampSubSkillsToPrimaries(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>>,
): Partial<Record<SecondarySkillId, SkillRank>> {
  const next: Partial<Record<SecondarySkillId, SkillRank>> = { ...subSkills };
  for (const subId of ALL_SECONDARY_SKILL_IDS) {
    const maxAllowed = getSubSkillMaxAllowedRank(skills, subId);
    const cur = next[subId] ?? 0;
    if (cur > maxAllowed) {
      if (maxAllowed === 0) {
        delete next[subId];
      } else {
        next[subId] = maxAllowed;
      }
    }
  }
  return next;
}

/** 计算单棵技能树的总投入点数（主技能 + 下属 3 子技能总和，满分 20） */
export function getSkillTreeTotal(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  treeId: PrimarySkillId,
): number {
  let total = skills[treeId] ?? 0;
  const subs = SKILL_TREE_META[treeId].subSkills;
  if (subSkills) {
    for (const sid of subs) {
      total += subSkills[sid] ?? 0;
    }
  }
  return total;
}

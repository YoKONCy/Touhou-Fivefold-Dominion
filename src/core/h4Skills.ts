/**
 * HoMM4 完整「9 大主技能 × 3 子技能 = 36 技能树」与「11 基础职业 + 37 进阶组合职业 = 48 职业」核心引擎
 *
 * 架构职责：
 * - 100% 忠实还原 HoMM4 九系技能树结构与前置等级门槛（每系 1 主技能 + 3 子技能，0~5 阶）
 * - 收录全部 37 种双修/全能进阶职业（C(9,2)=36 两两双修 + 三系以上魔法宗师「万象大贤者」）与 11 种基础职业
 * - 东方双层风味命名（东方风味主职业名 + H4 原版中英文副标题）
 * - 支持「多职业资格检测」与「战斗场景外自由切换已解锁的进阶职业」
 */

import type { Alignment } from './alignment';
import type {
  AdvancedClassDef,
  PrimarySkillId,
  SecondarySkillId,
  SkillRank,
} from './types';

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

// =========================================================================
// 11 基础职业 + 37 种 HoMM4 官方双修/全能进阶组合职业（东方双层风味命名）
// =========================================================================

/** 11 种基础职业（含 9 单系基础职业 + 2 经典初始变体） */
export const H4_BASE_CLASSES: Record<string, AdvancedClassDef> = {
  base_knight: {
    id: 'base_knight',
    name: '退魔武士',
    h4Name: '骑士 / Knight',
    isBaseClass: true,
    primaryA: 'tactics',
    primaryB: 'tactics',
    description: '单系战术指挥基础职业，稳健统领前线兵团，英雄防御 +2。',
    bonuses: [{ stat: 'defense', mode: 'flat', value: 2, sourceName: '职业·退魔武士' }],
  },
  base_barbarian: {
    id: 'base_barbarian',
    name: '刚烈武人',
    h4Name: '野蛮人 / Barbarian',
    isBaseClass: true,
    primaryA: 'combat',
    primaryB: 'combat',
    description: '单系格斗体术基础职业，以纯粹武艺冲阵搏杀，英雄攻击 +2。',
    bonuses: [{ stat: 'attack', mode: 'flat', value: 2, sourceName: '职业·刚烈武人' }],
  },
  base_thief: {
    id: 'base_thief',
    name: '暗夜行者',
    h4Name: '盗贼 / Thief',
    isBaseClass: true,
    primaryA: 'scouting',
    primaryB: 'scouting',
    description: '单系侦查潜行基础职业，灵动迅捷擅长先手切入，先手主动 +1。',
    bonuses: [{ stat: 'initiative', mode: 'flat', value: 1, sourceName: '职业·暗夜行者' }],
  },
  base_lord: {
    id: 'base_lord',
    name: '幻想领主',
    h4Name: '领主 / Lord',
    isBaseClass: true,
    primaryA: 'nobility',
    primaryB: 'nobility',
    description: '单系贵族治理基础职业，擅长统筹领地与军备后勤，部队士气 +1。',
    bonuses: [{ stat: 'morale', mode: 'flat', value: 1, sourceName: '职业·幻想领主' }],
  },
  base_priest: {
    id: 'base_priest',
    name: '神社巫女',
    h4Name: '牧师 / Priest',
    isBaseClass: true,
    primaryA: 'life_magic',
    primaryB: 'life_magic',
    description: '单系生命魔法基础职业，专司治退异变与结界守护，灵力上限 +8。',
    bonuses: [{ stat: 'maxMana', mode: 'flat', value: 8, sourceName: '职业·神社巫女' }],
  },
  base_mage: {
    id: 'base_mage',
    name: '幻月术师',
    h4Name: '法师 / Mage',
    isBaseClass: true,
    primaryA: 'order_magic',
    primaryB: 'order_magic',
    description: '单系秩序魔法基础职业，操控幻象与时空法则，法术强度 +1。',
    bonuses: [{ stat: 'spellPower', mode: 'flat', value: 1, sourceName: '职业·幻月术师' }],
  },
  base_necromancer: {
    id: 'base_necromancer',
    name: '幽冥死灵使',
    h4Name: '死灵法师 / Necromancer',
    isBaseClass: true,
    primaryA: 'death_magic',
    primaryB: 'death_magic',
    description: '单系死亡魔法基础职业，研习幽冥诅咒与不死亡灵秘法，法术强度 +1。',
    bonuses: [{ stat: 'spellPower', mode: 'flat', value: 1, sourceName: '职业·幽冥死灵使' }],
  },
  base_sorcerer: {
    id: 'base_sorcerer',
    name: '星辰魔法使',
    h4Name: '术士 / Sorcerer',
    isBaseClass: true,
    primaryA: 'chaos_magic',
    primaryB: 'chaos_magic',
    description: '单系混沌魔法基础职业，倾泻炽烈星光破坏魔弹，法术强度 +1。',
    bonuses: [{ stat: 'spellPower', mode: 'flat', value: 1, sourceName: '职业·星辰魔法使' }],
  },
  base_druid: {
    id: 'base_druid',
    name: '山林自然使',
    h4Name: '德鲁伊 / Druid',
    isBaseClass: true,
    primaryA: 'nature_magic',
    primaryB: 'nature_magic',
    description: '单系自然魔法基础职业，亲和妖精与幻想乡万物生灵，灵力上限 +8。',
    bonuses: [{ stat: 'maxMana', mode: 'flat', value: 8, sourceName: '职业·山林自然使' }],
  },
  base_archer: {
    id: 'base_archer',
    name: '弹幕游击手',
    h4Name: '弓箭手 / Archer',
    isBaseClass: true,
    primaryA: 'combat',
    primaryB: 'combat',
    description: '格斗与射击侧重的基础远程职业，以精准射击牵制敌军阵型，攻击 +2。',
    bonuses: [{ stat: 'attack', mode: 'flat', value: 2, sourceName: '职业·弹幕游击手' }],
  },
  base_death_lord: {
    id: 'base_death_lord',
    name: '冥界暗骑士',
    h4Name: '暗骑士 / Dark Knight',
    isBaseClass: true,
    primaryA: 'death_magic',
    primaryB: 'death_magic',
    description: '死亡系武斗变体基础职业，以幽冥寒气震慑敌手，攻击 +2。',
    bonuses: [{ stat: 'attack', mode: 'flat', value: 2, sourceName: '职业·冥界暗骑士' }],
  },
};

/** 全部 37 种 HoMM4 官方双修/全能进阶组合职业（C(9,2)=36 组两两组合 + 万象大贤者） */
export const H4_ADVANCED_CLASSES: Record<string, AdvancedClassDef> = {
  // ===== 0. 终极三系及以上魔法大职业（第 37 职） =====
  archmage: {
    id: 'archmage',
    name: '万象大贤者',
    h4Name: '大法师 / Archmage',
    primaryA: 'life_magic',
    primaryB: 'order_magic',
    minMagicTrees: 3,
    description: '三系及以上高阶魔法贯通：全部五系法术威力 +20%、最大灵力 +25、法强 +5、全系魔抗 +15%。',
    bonuses: [
      { stat: 'spellPower', mode: 'flat', value: 5, sourceName: '职业·万象大贤者' },
      { stat: 'maxMana', mode: 'flat', value: 25, sourceName: '职业·万象大贤者' },
      { stat: 'magicResistance', mode: 'flat', value: 0.15, sourceName: '职业·万象大贤者' },
    ],
    passive: { allSpellBonusPct: 0.2 },
  },

  // ===== 一、格斗 Combat 组合（8 职） =====
  general: {
    id: 'general',
    name: '幻想大将',
    h4Name: '大将军 / General',
    primaryA: 'combat',
    primaryB: 'tactics',
    description: '格斗 + 战术：全军士气 +1、全军攻防 +10%，英雄攻防 +3。',
    bonuses: [
      { stat: 'attack', mode: 'flat', value: 3, sourceName: '职业·幻想大将' },
      { stat: 'defense', mode: 'flat', value: 3, sourceName: '职业·幻想大将' },
    ],
    passive: { allyMoraleDelta: 1, allyOffensePct: 0.1, allyDefensePct: 0.1 },
  },
  ranger: {
    id: 'ranger',
    name: '疾风神射手',
    h4Name: '游侠 / Ranger',
    primaryA: 'combat',
    primaryB: 'scouting',
    description: '格斗 + 侦查：英雄获得精准射击无视距离衰减，攻击 +5、先手 +2、远程伤害 +15%。',
    bonuses: [
      { stat: 'attack', mode: 'flat', value: 5, sourceName: '职业·疾风神射手' },
      { stat: 'initiative', mode: 'flat', value: 2, sourceName: '职业·疾风神射手' },
    ],
    passive: { grantLongRange: true, heroRangedDamagePct: 0.15 },
  },
  warlord: {
    id: 'warlord',
    name: '霸道军神',
    h4Name: '军阀 / Warlord',
    primaryA: 'combat',
    primaryB: 'nobility',
    description: '格斗 + 贵族：英雄攻击 +5、近战伤害 +15%，并鼓舞全军生命上限 +10%。',
    bonuses: [{ stat: 'attack', mode: 'flat', value: 5, sourceName: '职业·霸道军神' }],
    passive: { heroMeleeDamagePct: 0.15, allyHpPct: 0.1 },
  },
  paladin: {
    id: 'paladin',
    name: '退魔圣巫女',
    h4Name: '圣骑士 / Paladin',
    primaryA: 'combat',
    primaryB: 'life_magic',
    description: '格斗 + 生命魔法：英雄自带抗死结界，克制死亡系、不死、暗系与混沌系敌军，防御 +4、魔抗 +15%。',
    bonuses: [
      { stat: 'defense', mode: 'flat', value: 4, sourceName: '职业·退魔圣巫女' },
      { stat: 'magicResistance', mode: 'flat', value: 0.15, sourceName: '职业·退魔圣巫女' },
    ],
    passive: { grantDeathWard: true },
  },
  battle_mage: {
    id: 'battle_mage',
    name: '幻月战法师',
    h4Name: '战斗法师 / Battle Mage',
    primaryA: 'combat',
    primaryB: 'order_magic',
    description: '格斗 + 秩序魔法：魔武兼修，英雄全法术伤害与控制威力 +20%、攻击 +3、法强 +3。',
    bonuses: [
      { stat: 'attack', mode: 'flat', value: 3, sourceName: '职业·幻月战法师' },
      { stat: 'spellPower', mode: 'flat', value: 3, sourceName: '职业·幻月战法师' },
    ],
    passive: { allSpellBonusPct: 0.2 },
  },
  reaver: {
    id: 'reaver',
    name: '冥刃掠夺者',
    h4Name: '掠夺者 / Reaver',
    primaryA: 'combat',
    primaryB: 'death_magic',
    description: '格斗 + 死亡魔法：英雄近战与远程伤害 +15%，且近战攻击活体目标时自动汲取生命回复自身。',
    bonuses: [{ stat: 'attack', mode: 'flat', value: 4, sourceName: '职业·冥刃掠夺者' }],
    passive: { heroMeleeDamagePct: 0.15, heroRangedDamagePct: 0.15, grantVampiric: true },
  },
  fireguard: {
    id: 'fireguard',
    name: '炽焰守卫',
    h4Name: '烈焰守卫 / Fireguard',
    primaryA: 'combat',
    primaryB: 'chaos_magic',
    description: '格斗 + 混沌魔法：英雄自带炽焰抗性与烈焰护盾反灼来敌，防御 +4、法强 +2。',
    bonuses: [
      { stat: 'defense', mode: 'flat', value: 4, sourceName: '职业·炽焰守卫' },
      { stat: 'spellPower', mode: 'flat', value: 2, sourceName: '职业·炽焰守卫' },
    ],
    passive: { grantFireResistant: true, grantFireShield: true },
  },
  warden: {
    id: 'warden',
    name: '山林守望者',
    h4Name: '守望者 / Warden',
    primaryA: 'combat',
    primaryB: 'nature_magic',
    description: '格斗 + 自然魔法：自然护佑身躯，英雄防御 +5、生命 +20%，自然魔法威力 +15%。',
    bonuses: [
      { stat: 'defense', mode: 'flat', value: 5, sourceName: '职业·山林守望者' },
      { stat: 'maxHp', mode: 'percent', value: 0.2, sourceName: '职业·山林守望者' },
    ],
    passive: { schoolSpellBonusPct: { nature: 0.15 } },
  },

  // ===== 二、战术 Tactics 组合（7 职，已含 combat+tactics） =====
  field_marshal: {
    id: 'field_marshal',
    name: '奇袭大元帅',
    h4Name: '元帅 / Field Marshal',
    primaryA: 'tactics',
    primaryB: 'scouting',
    description: '战术 + 侦查：全军行军如风，己方全军移速 +1、先手 +2。',
    bonuses: [{ stat: 'initiative', mode: 'flat', value: 2, sourceName: '职业·奇袭大元帅' }],
    passive: { allySpeedDelta: 1, allyInitiativeDelta: 2 },
  },
  lord_commander: {
    id: 'lord_commander',
    name: '御前大统领',
    h4Name: '领主统帅 / Lord Commander',
    primaryA: 'tactics',
    primaryB: 'nobility',
    description: '战术 + 贵族：全军军纪严明，己方全军士气 +2、防御 +12%。',
    bonuses: [{ stat: 'defense', mode: 'flat', value: 3, sourceName: '职业·御前大统领' }],
    passive: { allyMoraleDelta: 2, allyDefensePct: 0.12 },
  },
  crusader: {
    id: 'crusader',
    name: '博丽圣军师',
    h4Name: '十字军 / Crusader',
    primaryA: 'tactics',
    primaryB: 'life_magic',
    description: '战术 + 生命魔法：圣光照耀三军，己方全军士气 +2、英雄防御 +3、生命魔法威力 +15%。',
    bonuses: [
      { stat: 'defense', mode: 'flat', value: 3, sourceName: '职业·博丽圣军师' },
      { stat: 'morale', mode: 'flat', value: 2, sourceName: '职业·博丽圣军师' },
    ],
    passive: { allyMoraleDelta: 2, schoolSpellBonusPct: { life: 0.15 } },
  },
  illusionist: {
    id: 'illusionist',
    name: '隙间幻术师',
    h4Name: '幻术师 / Illusionist',
    primaryA: 'tactics',
    primaryB: 'order_magic',
    description: '战术 + 秩序魔法：秩序魔法与幻象类法术威力 +25%，法强 +3。',
    bonuses: [{ stat: 'spellPower', mode: 'flat', value: 3, sourceName: '职业·隙间幻术师' }],
    passive: { schoolSpellBonusPct: { order: 0.25 } },
  },
  death_knight: {
    id: 'death_knight',
    name: '幽冥死骑统帅',
    h4Name: '死亡骑士 / Death Knight',
    primaryA: 'tactics',
    primaryB: 'death_magic',
    description: '战术 + 死亡魔法：散发幽冥威压，令敌方全军士气 -2，英雄攻击 +4、死亡魔法威力 +15%。',
    bonuses: [{ stat: 'attack', mode: 'flat', value: 4, sourceName: '职业·幽冥死骑统帅' }],
    passive: { enemyMoraleDelta: -2, schoolSpellBonusPct: { death: 0.15 } },
  },
  pyromancer: {
    id: 'pyromancer',
    name: '爆炎军师',
    h4Name: '烈焰术帅 / Pyromancer',
    primaryA: 'tactics',
    primaryB: 'chaos_magic',
    description: '战术 + 混沌魔法：混沌魔法与火焰破坏法术伤害 +25%，法强 +3。',
    bonuses: [{ stat: 'spellPower', mode: 'flat', value: 3, sourceName: '职业·爆炎军师' }],
    passive: { schoolSpellBonusPct: { chaos: 0.25 } },
  },
  beastmaster: {
    id: 'beastmaster',
    name: '百妖御主',
    h4Name: '驯兽师 / Beastmaster',
    primaryA: 'tactics',
    primaryB: 'nature_magic',
    description: '战术 + 自然魔法：自然系召唤规模 +25%、己方全军攻击 +8%，英雄防御 +3。',
    bonuses: [{ stat: 'defense', mode: 'flat', value: 3, sourceName: '职业·百妖御主' }],
    passive: { summonBonusPct: 0.25, allyOffensePct: 0.08 },
  },

  // ===== 三、侦查 Scouting 组合（6 职） =====
  guildmaster: {
    id: 'guildmaster',
    name: '商道秘仪总管',
    h4Name: '行会大师 / Guildmaster',
    primaryA: 'scouting',
    primaryB: 'nobility',
    description: '侦查 + 贵族：左右逢源，英雄幸运 +3、全军幸运 +1、擦弹 +12%。',
    bonuses: [
      { stat: 'luck', mode: 'flat', value: 3, sourceName: '职业·商道秘仪总管' },
      { stat: 'grazeChance', mode: 'flat', value: 0.12, sourceName: '职业·商道秘仪总管' },
    ],
    passive: { allyLuckDelta: 1 },
  },
  prophet: {
    id: 'prophet',
    name: '秘仪大先知',
    h4Name: '先知 / Prophet',
    primaryA: 'scouting',
    primaryB: 'life_magic',
    description: '侦查 + 生命魔法：洞彻先机，生命魔法威力 +25%、英雄先手 +2、法强 +2。',
    bonuses: [
      { stat: 'initiative', mode: 'flat', value: 2, sourceName: '职业·秘仪大先知' },
      { stat: 'spellPower', mode: 'flat', value: 2, sourceName: '职业·秘仪大先知' },
    ],
    passive: { schoolSpellBonusPct: { life: 0.25 } },
  },
  seer: {
    id: 'seer',
    name: '洞察预言贤者',
    h4Name: '预言家 / Seer',
    primaryA: 'scouting',
    primaryB: 'order_magic',
    description: '侦查 + 秩序魔法：看穿弹幕轨迹，英雄擦弹 +18%、射程 +2、秩序魔法威力 +20%。',
    bonuses: [
      { stat: 'grazeChance', mode: 'flat', value: 0.18, sourceName: '职业·洞察预言贤者' },
      { stat: 'range', mode: 'flat', value: 2, sourceName: '职业·洞察预言贤者' },
    ],
    passive: { schoolSpellBonusPct: { order: 0.2 } },
  },
  ninja: {
    id: 'ninja',
    name: '暗夜忍使',
    h4Name: '忍者 / Ninja',
    primaryA: 'scouting',
    primaryB: 'death_magic',
    description: '侦查 + 死亡魔法：英雄获得先攻压制特技，擦弹 +20%、先手 +3、攻击 +3。',
    bonuses: [
      { stat: 'attack', mode: 'flat', value: 3, sourceName: '职业·暗夜忍使' },
      { stat: 'initiative', mode: 'flat', value: 3, sourceName: '职业·暗夜忍使' },
      { stat: 'grazeChance', mode: 'flat', value: 0.2, sourceName: '职业·暗夜忍使' },
    ],
    passive: { grantFirstStrike: true },
  },
  fire_diviner: {
    id: 'fire_diviner',
    name: '极彩星辰魔导',
    h4Name: '炎卜师 / Fire Diviner',
    primaryA: 'scouting',
    primaryB: 'chaos_magic',
    description: '侦查 + 混沌魔法：星火先机，混沌魔法伤害 +20%、法强 +4、先手主动 +2。',
    bonuses: [
      { stat: 'spellPower', mode: 'flat', value: 4, sourceName: '职业·极彩星辰魔导' },
      { stat: 'initiative', mode: 'flat', value: 2, sourceName: '职业·极彩星辰魔导' },
    ],
    passive: { schoolSpellBonusPct: { chaos: 0.2 } },
  },
  bard: {
    id: 'bard',
    name: '幻想乐师',
    h4Name: '吟游诗人 / Bard',
    primaryA: 'scouting',
    primaryB: 'nature_magic',
    description: '侦查 + 自然魔法：奏响幻想乡神乐，己方全军幸运 +2、自然魔法威力 +15%。',
    bonuses: [{ stat: 'luck', mode: 'flat', value: 2, sourceName: '职业·幻想乐师' }],
    passive: { allyLuckDelta: 2, schoolSpellBonusPct: { nature: 0.15 } },
  },

  // ===== 四、贵族 Nobility 组合（5 职） =====
  cardinal: {
    id: 'cardinal',
    name: '大社主持',
    h4Name: '红衣主教 / Cardinal',
    primaryA: 'nobility',
    primaryB: 'life_magic',
    description: '贵族 + 生命魔法：执掌神社神恩，治疗与苏生类法术威力 +25%、全军士气 +1、灵力上限 +15。',
    bonuses: [{ stat: 'maxMana', mode: 'flat', value: 15, sourceName: '职业·大社主持' }],
    passive: { healingBonusPct: 0.25, allyMoraleDelta: 1 },
  },
  lord: {
    id: 'lord',
    name: '月都贤领',
    h4Name: '领主 / Lord',
    primaryA: 'nobility',
    primaryB: 'order_magic',
    description: '贵族 + 秩序魔法：秩序治世，己方全军防御 +10%、英雄防御 +3、灵力上限 +20。',
    bonuses: [
      { stat: 'maxMana', mode: 'flat', value: 20, sourceName: '职业·月都贤领' },
      { stat: 'defense', mode: 'flat', value: 3, sourceName: '职业·月都贤领' },
    ],
    passive: { allyDefensePct: 0.1 },
  },
  shadow_lord: {
    id: 'shadow_lord',
    name: '幽冥暗主',
    h4Name: '暗影领主 / Shadow Lord',
    primaryA: 'nobility',
    primaryB: 'death_magic',
    description: '贵族 + 死亡魔法：令敌方全军士气 -1、招魂与死亡魔法威力 +20%、法强 +3。',
    bonuses: [{ stat: 'spellPower', mode: 'flat', value: 3, sourceName: '职业·幽冥暗主' }],
    passive: { enemyMoraleDelta: -1, necromancyBonusPct: 0.2, schoolSpellBonusPct: { death: 0.2 } },
  },
  witch_king: {
    id: 'witch_king',
    name: '魔导霸王',
    h4Name: '巫王 / Witch King',
    primaryA: 'nobility',
    primaryB: 'chaos_magic',
    description: '贵族 + 混沌魔法：散发霸道魔威，敌方全军士气 -2、混沌魔法威力 +20%、攻击 +3、法强 +3。',
    bonuses: [
      { stat: 'attack', mode: 'flat', value: 3, sourceName: '职业·魔导霸王' },
      { stat: 'spellPower', mode: 'flat', value: 3, sourceName: '职业·魔导霸王' },
    ],
    passive: { enemyMoraleDelta: -2, schoolSpellBonusPct: { chaos: 0.2 } },
  },
  beast_lord: {
    id: 'beast_lord',
    name: '妖山领主',
    h4Name: '兽王 / Beast Lord',
    primaryA: 'nobility',
    primaryB: 'nature_magic',
    description: '贵族 + 自然魔法：统率山野妖众，自然系召唤规模 +25%、己方全军生命上限 +10%。',
    bonuses: [{ stat: 'maxHp', mode: 'percent', value: 0.15, sourceName: '职业·妖山领主' }],
    passive: { summonBonusPct: 0.25, allyHpPct: 0.1 },
  },

  // ===== 五、五系魔法两两双修（10 职） =====
  monk: {
    id: 'monk',
    name: '结界大僧正',
    h4Name: '武僧 / Monk',
    primaryA: 'life_magic',
    primaryB: 'order_magic',
    description: '生命魔法 + 秩序魔法：净心结界，自带抗死结界，魔法抗性 +25%、防御 +4、灵力上限 +15。',
    bonuses: [
      { stat: 'magicResistance', mode: 'flat', value: 0.25, sourceName: '职业·结界大僧正' },
      { stat: 'defense', mode: 'flat', value: 4, sourceName: '职业·结界大僧正' },
      { stat: 'maxMana', mode: 'flat', value: 15, sourceName: '职业·结界大僧正' },
    ],
    passive: { grantDeathWard: true },
  },
  dark_priest: {
    id: 'dark_priest',
    name: '阴阳双生巫师',
    h4Name: '暗黑祭司 / Dark Priest',
    primaryA: 'life_magic',
    primaryB: 'death_magic',
    description: '生命魔法 + 死亡魔法：生灭同源，英雄近战自动吸血，生命系治疗与死亡魔法威力 +20%。',
    bonuses: [{ stat: 'spellPower', mode: 'flat', value: 3, sourceName: '职业·阴阳双生巫师' }],
    passive: { grantVampiric: true, healingBonusPct: 0.2, schoolSpellBonusPct: { death: 0.2 } },
  },
  heretic: {
    id: 'heretic',
    name: '禁忌破界使',
    h4Name: '异端者 / Heretic',
    primaryA: 'life_magic',
    primaryB: 'chaos_magic',
    description: '生命魔法 + 混沌魔法：光炎对冲爆裂，全法术穿透增伤 +20%、法强 +4。',
    bonuses: [{ stat: 'spellPower', mode: 'flat', value: 4, sourceName: '职业·禁忌破界使' }],
    passive: { allSpellBonusPct: 0.2 },
  },
  summoner: {
    id: 'summoner',
    name: '神灵召主',
    h4Name: '召唤师 / Summoner',
    primaryA: 'life_magic',
    primaryB: 'nature_magic',
    description: '生命魔法 + 自然魔法：召唤规模 +25%、治疗与苏生威力 +20%、灵力上限 +15。',
    bonuses: [{ stat: 'maxMana', mode: 'flat', value: 15, sourceName: '职业·神灵召主' }],
    passive: { summonBonusPct: 0.25, healingBonusPct: 0.2 },
  },
  shadow_mage: {
    id: 'shadow_mage',
    name: '幻冥魔导',
    h4Name: '暗影法师 / Shadow Mage',
    primaryA: 'order_magic',
    primaryB: 'death_magic',
    description: '秩序魔法 + 死亡魔法：秩序与死亡魔法威力 +25%，法强 +3、灵力上限 +15。',
    bonuses: [
      { stat: 'spellPower', mode: 'flat', value: 3, sourceName: '职业·幻冥魔导' },
      { stat: 'maxMana', mode: 'flat', value: 15, sourceName: '职业·幻冥魔导' },
    ],
    passive: { schoolSpellBonusPct: { order: 0.25, death: 0.25 } },
  },
  wizard: {
    id: 'wizard',
    name: '星辰大魔导',
    h4Name: '巫师 / Wizard',
    primaryA: 'order_magic',
    primaryB: 'chaos_magic',
    description: '秩序魔法 + 混沌魔法：施放全部法术耗蓝恒定 -2 MP，最低消耗 1 MP，最大灵力 +20、法强 +3。',
    bonuses: [
      { stat: 'maxMana', mode: 'flat', value: 20, sourceName: '职业·星辰大魔导' },
      { stat: 'spellPower', mode: 'flat', value: 3, sourceName: '职业·星辰大魔导' },
    ],
    passive: { manaCostDelta: -2 },
  },
  enchanter: {
    id: 'enchanter',
    name: '万象附魔师',
    h4Name: '附魔师 / Enchanter',
    primaryA: 'order_magic',
    primaryB: 'nature_magic',
    description: '秩序魔法 + 自然魔法：秩序魔法与自然魔法威力 +20%、召唤规模 +20%、灵力上限 +15。',
    bonuses: [
      { stat: 'maxMana', mode: 'flat', value: 15, sourceName: '职业·万象附魔师' },
      { stat: 'spellPower', mode: 'flat', value: 2, sourceName: '职业·万象附魔师' },
    ],
    passive: { schoolSpellBonusPct: { order: 0.2, nature: 0.2 }, summonBonusPct: 0.2 },
  },
  lich: {
    id: 'lich',
    name: '永夜魔导王',
    h4Name: '巫妖 / Lich',
    primaryA: 'death_magic',
    primaryB: 'chaos_magic',
    description: '死亡魔法 + 混沌魔法：毁灭与枯萎交响，死亡魔法与混沌魔法威力 +25%、法强 +4。',
    bonuses: [{ stat: 'spellPower', mode: 'flat', value: 4, sourceName: '职业·永夜魔导王' }],
    passive: { schoolSpellBonusPct: { death: 0.25, chaos: 0.25 } },
  },
  demonologist: {
    id: 'demonologist',
    name: '魔界召主',
    h4Name: '恶魔学者 / Demonologist',
    primaryA: 'death_magic',
    primaryB: 'nature_magic',
    description: '死亡魔法 + 自然魔法：同时增幅招魂不死与自然系召唤规模 +30%，灵力上限 +15。',
    bonuses: [{ stat: 'maxMana', mode: 'flat', value: 15, sourceName: '职业·魔界召主' }],
    passive: { summonBonusPct: 0.3, necromancyBonusPct: 0.3 },
  },
  warlock: {
    id: 'warlock',
    name: '魔导妖术师',
    h4Name: '术士 / Warlock',
    primaryA: 'chaos_magic',
    primaryB: 'nature_magic',
    description: '混沌魔法 + 自然魔法：灵力泉涌，最大灵力 +20、每回合自动回蓝 +2、全法术威力 +12%。',
    bonuses: [
      { stat: 'maxMana', mode: 'flat', value: 20, sourceName: '职业·魔导妖术师' },
      { stat: 'spellPower', mode: 'flat', value: 3, sourceName: '职业·魔导妖术师' },
    ],
    passive: { allSpellBonusPct: 0.12, manaRegenPerRound: 2 },
  },
};

export const ALL_H4_ADVANCED_CLASS_IDS: readonly string[] = Object.keys(H4_ADVANCED_CLASSES);
export const ALL_H4_BASE_CLASS_IDS: readonly string[] = Object.keys(H4_BASE_CLASSES);

/** 进阶职业单树资格阈值：主技能 >= 1 且该树（主+3子）总投入 >= 2 */
export const ADVANCED_CLASS_TREE_THRESHOLD = 2;

/**
 * 计算英雄当前已满足解锁条件的全部进阶组合职业（供战斗场景外自由切换！）
 * 排序规则：按关联两棵技能树总投入之和从高到低排列（万象大贤者置顶）。
 */
export function resolveEligibleAdvancedClasses(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  advancedClasses: Record<string, AdvancedClassDef> = H4_ADVANCED_CLASSES,
): AdvancedClassDef[] {
  const treeTotals: Record<PrimarySkillId, number> = {} as Record<PrimarySkillId, number>;
  for (const id of ALL_PRIMARY_SKILL_IDS) {
    treeTotals[id] = getSkillTreeTotal(skills, subSkills, id);
  }

  const eligible: Array<{ cls: AdvancedClassDef; score: number }> = [];
  const qualifiedMagicTrees = MAGIC_PRIMARY_SKILL_IDS.filter(
    (m) => (skills[m] ?? 0) >= 3 || treeTotals[m] >= 5,
  );

  for (const cls of Object.values(advancedClasses)) {
    if (cls.isBaseClass) continue;
    if (cls.minMagicTrees && cls.minMagicTrees >= 3) {
      if (qualifiedMagicTrees.length >= cls.minMagicTrees) {
        const magicSum = qualifiedMagicTrees.reduce((acc, k) => acc + treeTotals[k], 0);
        eligible.push({ cls, score: 1000 + magicSum });
      }
      continue;
    }
    const rankA = skills[cls.primaryA] ?? 0;
    const rankB = skills[cls.primaryB] ?? 0;
    if (
      rankA >= 1 &&
      rankB >= 1 &&
      treeTotals[cls.primaryA] >= ADVANCED_CLASS_TREE_THRESHOLD &&
      treeTotals[cls.primaryB] >= ADVANCED_CLASS_TREE_THRESHOLD
    ) {
      eligible.push({ cls, score: treeTotals[cls.primaryA] + treeTotals[cls.primaryB] });
    }
  }

  eligible.sort((a, b) => b.score - a.score || a.cls.id.localeCompare(b.cls.id));
  return eligible.map((item) => item.cls);
}

/** 获取单系基础职业兜底（当尚未满足任何双修进阶职业条件时） */
export function resolveBaseClass(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills?: Partial<Record<SecondarySkillId, SkillRank>>,
): AdvancedClassDef | null {
  const sorted = ALL_PRIMARY_SKILL_IDS
    .map((id) => ({ id, rank: skills[id] ?? 0, total: getSkillTreeTotal(skills, subSkills, id) }))
    .filter((item) => item.rank >= 1)
    .sort((a, b) => b.total - a.total || b.rank - a.rank);

  if (sorted.length === 0) return null;
  const top = sorted[0].id;
  if (top === 'combat' && (subSkills?.archery ?? 0) > (subSkills?.melee ?? 0)) {
    return H4_BASE_CLASSES.base_archer;
  }
  const map: Record<PrimarySkillId, string> = {
    tactics: 'base_knight',
    combat: 'base_barbarian',
    scouting: 'base_thief',
    nobility: 'base_lord',
    life_magic: 'base_priest',
    order_magic: 'base_mage',
    death_magic: 'base_necromancer',
    chaos_magic: 'base_sorcerer',
    nature_magic: 'base_druid',
  };
  return H4_BASE_CLASSES[map[top]] ?? null;
}

/**
 * 解析英雄当前最终激活的职业：
 * 1. 若英雄已主动指定 `selectedClassId` 且当前仍满足该进阶职业条件 → 尊重玩家自由切换结果！
 * 2. 否则返回默认最高分进阶组合职业；
 * 3. 若未达任何双修门槛 → 回退至对应单系基础职业。
 */
export function resolveActiveHeroClass(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  advancedClasses: Record<string, AdvancedClassDef> = H4_ADVANCED_CLASSES,
  selectedClassId?: string | null,
): AdvancedClassDef | null {
  const eligible = resolveEligibleAdvancedClasses(skills, subSkills, advancedClasses);
  if (selectedClassId) {
    const picked = eligible.find((c) => c.id === selectedClassId);
    if (picked) return picked;
  }
  if (eligible.length > 0) return eligible[0];
  return resolveBaseClass(skills, subSkills);
}

/** 计算指定法术在英雄 36 技能树 + 激活职业加成下的综合威力倍率 */
export function computeHeroSpellEffectivenessMultiplier(
  _skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  activeClass: AdvancedClassDef | null,
  school: Exclude<Alignment, 'might'>,
  category: 'damage' | 'heal' | 'revive' | 'summon' | 'raise' | 'mind' | 'buff_debuff',
): number {
  let mult = 1;
  const sub = subSkills ?? {};

  // 1. 混沌子技能「魔力 (Sorcery)」：全五系通用法术威力 +10%/阶
  mult += (sub.sorcery ?? 0) * 0.1;

  // 2. 各派系专属子技能精准增幅
  if (school === 'life') {
    mult += (sub.spirituality ?? 0) * 0.1;
    if (category === 'heal') mult += (sub.healing ?? 0) * 0.15;
    if (category === 'revive') mult += (sub.resurrection_skill ?? 0) * 0.18 + (sub.healing ?? 0) * 0.08;
  } else if (school === 'order') {
    mult += (sub.enchantment ?? 0) * 0.15;
    if (category === 'mind') mult += (sub.charm ?? 0) * 0.12;
  } else if (school === 'death') {
    mult += (sub.occultism ?? 0) * 0.12;
    if (category === 'damage' || category === 'buff_debuff') mult += (sub.demonology ?? 0) * 0.15;
    if (category === 'raise') mult += (sub.necromancy ?? 0) * 0.2;
  } else if (school === 'chaos') {
    if (category === 'damage') {
      mult += (sub.pyromancy ?? 0) * 0.16;
    } else {
      mult += (sub.conjuration ?? 0) * 0.12;
    }
  } else if (school === 'nature') {
    if (category === 'summon') {
      mult += (sub.summoning ?? 0) * 0.2;
    } else {
      mult += (sub.herbalism ?? 0) * 0.15;
    }
  }

  // 3. 激活进阶职业的专属法术被动
  const passive = activeClass?.passive;
  if (passive) {
    if (passive.allSpellBonusPct) mult += passive.allSpellBonusPct;
    if (passive.schoolSpellBonusPct?.[school]) mult += passive.schoolSpellBonusPct[school]!;
    if ((category === 'heal' || category === 'revive') && passive.healingBonusPct) {
      mult += passive.healingBonusPct;
    }
    if (category === 'summon' && passive.summonBonusPct) {
      mult += passive.summonBonusPct;
    }
    if (category === 'raise' && passive.necromancyBonusPct) {
      mult += passive.necromancyBonusPct;
    }
  }

  return mult;
}

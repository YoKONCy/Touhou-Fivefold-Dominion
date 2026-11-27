/**
 * HoMM4 完整「9 大主技能 × 3 子技能 = 36 技能树」元数据、原版查表数值与双向阶梯前置约束
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
  /** 在所属主树中的展示序号 1 / 2 / 3（原版前置由主技能阶梯统一决定） */
  slotIndex: 1 | 2 | 3;
  name: string;
  short: string;
  h4Name: string;
  desc: string;
  /** 纯战斗沙盒内效果摘要 */
  combatEffect: string;
  /** 是否含大地图专属效果（采用原版主体 + 温和战斗等价效果保留玩法） */
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

// ===== HoMM4 原版权威阶位数值查表（下标 0~5 分别对应 未习得 / 基础 / 进阶 / 专家 / 大师 / 宗师） =====

/** 格斗主技能：英雄自身物理防御加成（近战与远程通用） */
export const COMBAT_DEFENSE_PCT_BY_RANK = [0, 0.2, 0.4, 0.6, 0.8, 1.0] as const;

/** 近战子技能：英雄近战固定攻击力加成 */
export const MELEE_ATTACK_FLAT_BY_RANK = [0, 5, 10, 20, 30, 30] as const;

/** 近战子技能：击中非英雄兵种时无视其天然防御的分母（天然防御 ÷ divisor，最低保留 10） */
export const MELEE_DEFENSE_DIVISOR_BY_RANK = [1, 1.5, 2, 3, 4, 4] as const;

/** 射击子技能：英雄远程固定攻击力加成 */
export const ARCHERY_ATTACK_FLAT_BY_RANK = [0, 0, 5, 10, 20, 20] as const;

/** 射击子技能：射中非英雄兵种时无视其天然防御的分母（天然防御 ÷ divisor，最低保留 10） */
export const ARCHERY_DEFENSE_DIVISOR_BY_RANK = [1, 1, 1.5, 2, 2, 2] as const;

/** 魔抗子技能：英雄魔法抗性（Lv.5 宗师达 100%，完全免疫敌对法术，仍接受友方增益与治疗） */
export const MAGIC_RESISTANCE_BY_RANK = [0, 0.3, 0.5, 0.7, 0.8, 1.0] as const;

/** 战术主技能：全军移速加成 */
export const TACTICS_SPEED_BY_RANK = [0, 1, 1, 2, 2, 3] as const;

/** 战术主技能：全军先手主动加成 */
export const TACTICS_INITIATIVE_BY_RANK = [0, 1, 2, 3, 4, 5] as const;

/** 进攻子技能：己方全军统一近战 + 远程攻击力加成 */
export const TACTICS_OFFENSE_PCT_BY_RANK = [0, 0.1, 0.2, 0.3, 0.4, 0.5] as const;

/** 防御子技能：己方全军统一近战 + 远程防御力加成 */
export const TACTICS_DEFENSE_PCT_BY_RANK = [0, 0.1, 0.2, 0.3, 0.4, 0.5] as const;

/** 魔法灵力系子技能（灵性/巫术/神秘/魔咒/冥想）：最大灵力池加成 */
export const MAGIC_MANA_BONUS_BY_RANK = [0, 10, 20, 30, 40, 50] as const;

/** 魔法灵力系子技能（灵性/巫术/神秘/魔咒/冥想）：战中每回合自动回蓝 */
export const MAGIC_MANA_REGEN_BY_RANK = [0, 1, 2, 3, 4, 5] as const;

/** 魔法增幅系子技能（治疗/附魔/恶魔/烈焰/召唤/魔力）：法术效果倍率加成 */
export const MAGIC_EFFECT_BONUS_PCT_BY_RANK = [0, 0.2, 0.4, 0.6, 0.8, 1.0] as const;

/** 具备双向阶梯前置的主技能及其绑定双子技能（升级主技能高阶位前需同步提升此二子技能） */
export const PRIMARY_PREREQ_PAIR_MAP: Partial<
  Record<PrimarySkillId, { baseFreeRank: 1 | 2; pair: readonly [SecondarySkillId, SecondarySkillId] }>
> = {
  tactics: { baseFreeRank: 2, pair: ['offense', 'defense'] },
  life_magic: { baseFreeRank: 1, pair: ['healing', 'spirituality'] },
  order_magic: { baseFreeRank: 1, pair: ['enchantment', 'wizardry'] },
  death_magic: { baseFreeRank: 1, pair: ['occultism', 'demonology'] },
  chaos_magic: { baseFreeRank: 1, pair: ['conjuration', 'pyromancy'] },
  nature_magic: { baseFreeRank: 1, pair: ['herbalism', 'meditation'] },
};

/** HoMM4 原版 11 大基础职业起始技能预设模板（兼顾战前沙盒试验与未来完整大地图开局职业） */
export const H4_BASE_CLASS_STARTER_BUILDS: Record<
  string,
  {
    alignment: Alignment;
    skills: Partial<Record<PrimarySkillId, SkillRank>>;
    subSkills: Partial<Record<SecondarySkillId, SkillRank>>;
  }
> = {
  base_knight: { alignment: 'life', skills: { tactics: 1 }, subSkills: { defense: 1 } },
  base_priest: { alignment: 'life', skills: { life_magic: 1 }, subSkills: { healing: 1 } },
  base_lord: { alignment: 'order', skills: { nobility: 1 }, subSkills: { estates: 1 } },
  base_mage: { alignment: 'order', skills: { order_magic: 1 }, subSkills: { enchantment: 1 } },
  base_death_lord: { alignment: 'death', skills: { tactics: 1 }, subSkills: { offense: 1 } },
  base_necromancer: { alignment: 'death', skills: { death_magic: 1 }, subSkills: { occultism: 1 } },
  base_thief: { alignment: 'chaos', skills: { scouting: 1 }, subSkills: { stealth: 1 } },
  base_sorcerer: { alignment: 'chaos', skills: { chaos_magic: 1 }, subSkills: { conjuration: 1 } },
  base_archer: { alignment: 'nature', skills: { combat: 1 }, subSkills: { archery: 1 } },
  base_druid: { alignment: 'nature', skills: { nature_magic: 1 }, subSkills: { herbalism: 1 } },
  base_barbarian: { alignment: 'might', skills: { combat: 1 }, subSkills: { melee: 1 } },
};

/** 9 大主技能树完整定义（零冗余括号与旧称缩写） */
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
    desc: '强化英雄个人防卫能力，1至5阶分别提升英雄防御力 20%、40%、60%、80%、100%，并逐阶解锁近战、射击与魔抗专精。',
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
    desc: '英雄指挥光环，全军移速依次 +1/+1/+2/+2/+3、先手 +1至+5；晋升 3至5 阶需同期修习进攻与防御子技能。',
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
    desc: '大地图扩大探索视野与情报洞察；战斗沙盒中赋予英雄每阶 +1 先手主动与 +3% 擦弹率。',
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
    desc: '大地图城镇产量治理核心；战斗沙盒中赋予全军精锐动员效果，每阶提升全军 3% 生命上限。',
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
    desc: '解锁 1至5 阶生命魔法术式；2至5 阶晋升需治疗与灵性同步跟进，每阶主技能并强化全法术基础法强。',
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
    desc: '解锁 1至5 阶秩序魔法术式；2至5 阶晋升需附魔与巫术同步跟进。',
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
    desc: '解锁 1至5 阶死亡魔法术式；2至5 阶晋升需神秘与恶魔同步跟进。',
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
    desc: '解锁 1至5 阶混沌魔法术式；2至5 阶晋升需魔咒与烈焰同步跟进。',
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
    desc: '解锁 1至5 阶自然魔法术式；2至5 阶晋升需草药与冥想同步跟进。',
  },
};

/** 全部 27 项二级子技能完整定义（严格对齐原版数值与机制，零括号零缩写） */
export const SECONDARY_SKILL_META: Record<SecondarySkillId, SecondarySkillMeta> = {
  // === 格斗 Combat ===
  melee: {
    id: 'melee',
    parent: 'combat',
    slotIndex: 1,
    name: '近战',
    short: '近战',
    h4Name: 'Melee',
    desc: '锤炼英雄近身格斗技，逐阶大幅拉升近战攻击力并穿透非英雄兵种天然护甲。',
    combatEffect: '近战攻击力依次 +5/+10/+20/+30/+30；无视兵种天然防御除以 1.5/2/3/4/4 下限保底 10，绝不削减英雄防御；3 阶获得近战先攻，5 阶获得近战双重攻击。',
  },
  archery: {
    id: 'archery',
    parent: 'combat',
    slotIndex: 2,
    name: '射击',
    short: '射击',
    h4Name: 'Archery',
    desc: '精通弹幕远射技艺，赋予英雄远程能力、无视掩体与距离衰减并逐阶穿透兵种天然防御。',
    combatEffect: '1 阶解锁 8 格远程弹幕与 16 发备弹；远程攻击力依次 +0/+5/+10/+20/+20；2至5 阶兵种天然防御除以 1.5/2/2/2 下限保底 10；2 阶无视障碍、3 阶精准射击、4 阶远程先攻、5 阶远程双重攻击。',
  },
  magic_resistance: {
    id: 'magic_resistance',
    parent: 'combat',
    slotIndex: 3,
    name: '魔抗',
    short: '魔抗',
    h4Name: 'Magic Resistance',
    desc: '以强韧意志抵御敌方术式侵蚀，逐阶拉升英雄魔法抗性且不影响友军施加正面增益与治愈。',
    combatEffect: '英雄魔法抗性依次为 30%、50%、70%、80%、100%；满抗 100% 时完全免疫一切敌方伤害与控制减益法术，仍正常接受友军治愈与增益。',
  },

  // === 战术 Tactics ===
  offense: {
    id: 'offense',
    parent: 'tactics',
    slotIndex: 1,
    name: '进攻',
    short: '进攻',
    h4Name: 'Offense',
    desc: '统御三军凌厉攻势，统一全面增幅己方全军近战与远程攻击力。',
    combatEffect: '己方全军近战与远程攻击力统一 +10%、+20%、+30%、+40%、+50%。',
  },
  defense: {
    id: 'defense',
    parent: 'tactics',
    slotIndex: 2,
    name: '防御',
    short: '防御',
    h4Name: 'Defense',
    desc: '构筑严密铁壁战阵，全面提升己方全军近战与远程物理防御力。',
    combatEffect: '己方全军近战与远程防御力统一 +10%、+20%、+30%、+40%、+50%。',
  },
  leadership: {
    id: 'leadership',
    parent: 'tactics',
    slotIndex: 3,
    name: '领导',
    short: '领导',
    h4Name: 'Leadership',
    desc: '统御威望同时提振全军斗志与气运，缓和跨阵营混编带来的负面惩罚。',
    combatEffect: '己方全军士气每阶 +1 并且幸运同步每阶 +1，最高士气与幸运各 +5。',
  },

  // === 侦查 Scouting ===
  pathfinding: {
    id: 'pathfinding',
    parent: 'scouting',
    slotIndex: 1,
    name: '寻路',
    short: '寻路',
    h4Name: 'Pathfinding',
    desc: '大地图大幅削减恶劣地形行军消耗；战斗中提升机动力与穿林越沼能力。',
    combatEffect: '全军 3 阶与 5 阶各 +1 移速，4 阶起赋予全军无视战场地面减速。',
    isAdventureFlavored: true,
  },
  seamanship: {
    id: 'seamanship',
    parent: 'scouting',
    slotIndex: 2,
    name: '航海',
    short: '航海',
    h4Name: 'Seamanship',
    desc: '大地图海上航行移速与海战攻防专精；战斗沙盒中提升全军灵巧闪避身法。',
    combatEffect: '己方全军擦弹率 +2%/阶，全军近战攻防 +2%/阶。',
    isAdventureFlavored: true,
  },
  stealth: {
    id: 'stealth',
    parent: 'scouting',
    slotIndex: 3,
    name: '潜行',
    short: '潜行',
    h4Name: 'Stealth',
    desc: '大地图匿踪避开野外哨卡与弱敌警戒；战斗沙盒中显著强化英雄灵巧身法。',
    combatEffect: '英雄擦弹率 +5%/阶，承受远程伤害 -5%/阶，3 阶激活影遁潜行特技。',
    isAdventureFlavored: true,
  },

  // === 贵族 Nobility ===
  estates: {
    id: 'estates',
    parent: 'nobility',
    slotIndex: 1,
    name: '理财',
    short: '理财',
    h4Name: 'Estates',
    desc: '大地图每日提供丰厚赛钱与金币税收；战斗沙盒中以优渥军饷提振全军福运。',
    combatEffect: '己方全军 2 阶、4 阶、5 阶各获得幸运 +1。',
    isAdventureFlavored: true,
  },
  mining: {
    id: 'mining',
    parent: 'nobility',
    slotIndex: 2,
    name: '采矿',
    short: '采矿',
    h4Name: 'Mining',
    desc: '大地图每日持续产出珍稀矿石与灵晶；战斗沙盒中以精良锻造甲胄守护全军。',
    combatEffect: '己方全军防御力 +2%/阶。',
    isAdventureFlavored: true,
  },
  diplomacy: {
    id: 'diplomacy',
    parent: 'nobility',
    slotIndex: 3,
    name: '外交',
    short: '外交',
    h4Name: 'Diplomacy',
    desc: '大地图感化招募中立野兵随行出征；战斗沙盒中以仁德声望鼓舞全军战意。',
    combatEffect: '己方全军 2 阶、4 阶、5 阶各获得士气 +1。',
    isAdventureFlavored: true,
  },

  // === 生命魔法 Life Magic ===
  healing: {
    id: 'healing',
    parent: 'life_magic',
    slotIndex: 1,
    name: '治疗',
    short: '治疗',
    h4Name: 'Healing',
    desc: '深修神圣治愈与护盾奥义，全面增幅生命系全部术式效能并每日自愈。',
    combatEffect: '全部生命系法术效果每阶 +20% 最高 +100%，英雄每回合自愈 3×阶 HP。',
  },
  spirituality: {
    id: 'spirituality',
    parent: 'life_magic',
    slotIndex: 2,
    name: '灵性',
    short: '灵性',
    h4Name: 'Spirituality',
    desc: '扩充神道灵力本源并加速灵力回复，稳固高阶生命结界持续时长。',
    combatEffect: '最大灵力 +10/+20/+30/+40/+50，每回合自动回蓝 +1/+2/+3/+4/+5 MP，3 阶起生命系增益 +1 回合。',
  },
  resurrection_skill: {
    id: 'resurrection_skill',
    parent: 'life_magic',
    slotIndex: 3,
    name: '复活',
    short: '复活',
    h4Name: 'Resurrection',
    desc: '大地图战后自动按比例救回己方阵亡生灵；战斗沙盒中增幅苏生与护命神术。',
    combatEffect: '战斗内返魂苏生与御神护命等复活类神术效力额外 +15%/阶。',
    isAdventureFlavored: true,
  },

  // === 秩序魔法 Order Magic ===
  enchantment: {
    id: 'enchantment',
    parent: 'order_magic',
    slotIndex: 1,
    name: '附魔',
    short: '附魔',
    h4Name: 'Enchantment',
    desc: '精炼秩序系时空、幻象与直伤符术，逐阶全面放大秩序系全部法术效用。',
    combatEffect: '全部秩序系法术威力、幻象生命预算与控制效力每阶 +20% 最高 +100%。',
  },
  wizardry: {
    id: 'wizardry',
    parent: 'order_magic',
    slotIndex: 2,
    name: '巫术',
    short: '巫术',
    h4Name: 'Wizardry',
    desc: '博通魔导数理法阵，对称拓宽英雄最大灵力池并加速回合自动回蓝。',
    combatEffect: '最大灵力 +10/+20/+30/+40/+50，英雄每回合开始自动恢复 +1/+2/+3/+4/+5 MP。',
  },
  charm: {
    id: 'charm',
    parent: 'order_magic',
    slotIndex: 3,
    name: '魅惑',
    short: '魅惑',
    h4Name: 'Charm',
    desc: '大地图每日自发吸引游离中立族群效忠；战斗沙盒中强化心智迷魂控制术式。',
    combatEffect: '催眠、致盲、狂暴、迷乱与镇魂神乐等心智控制法术威力 +12%/阶，3 阶起持续 +1 回合。',
    isAdventureFlavored: true,
  },

  // === 死亡魔法 Death Magic ===
  occultism: {
    id: 'occultism',
    parent: 'death_magic',
    slotIndex: 1,
    name: '神秘',
    short: '神秘',
    h4Name: 'Occultism',
    desc: '汲取幽冥地脉死灵气场，拓宽英雄最大灵力池并加速战中每回合自动回蓝。',
    combatEffect: '最大灵力 +10/+20/+30/+40/+50，英雄每回合开始自动恢复 +1/+2/+3/+4/+5 MP。',
  },
  demonology: {
    id: 'demonology',
    parent: 'death_magic',
    slotIndex: 2,
    name: '恶魔',
    short: '恶魔',
    h4Name: 'Demonology',
    desc: '驾驭冥界毒瘴、枯萎诅咒与魔界秘术，逐阶全面放大死亡系全部法术效用。',
    combatEffect: '全部死亡系法术伤害、吸魂、剧毒与冥界咒术效果每阶 +20% 最高 +100%。',
  },
  necromancy: {
    id: 'necromancy',
    parent: 'death_magic',
    slotIndex: 3,
    name: '招魂',
    short: '招魂',
    h4Name: 'Necromancy',
    desc: '大地图战后将敌军活体残骸转化为己方不死亡灵；战斗中放大战阵招魂复生。',
    combatEffect: '战斗中招魂唤起与反魂复生类亡灵法术兵力转化预算额外 +15%/阶。',
    isAdventureFlavored: true,
  },

  // === 混沌魔法 Chaos Magic ===
  conjuration: {
    id: 'conjuration',
    parent: 'chaos_magic',
    slotIndex: 1,
    name: '魔咒',
    short: '魔咒',
    h4Name: 'Conjuration',
    desc: '铭刻狂暴混沌魔纹，对称拓宽英雄最大灵力池并加速战中每回合自动回蓝。',
    combatEffect: '最大灵力 +10/+20/+30/+40/+50，英雄每回合开始自动恢复 +1/+2/+3/+4/+5 MP。',
  },
  pyromancy: {
    id: 'pyromancy',
    parent: 'chaos_magic',
    slotIndex: 2,
    name: '烈焰',
    short: '烈焰',
    h4Name: 'Pyromancy',
    desc: '炽烈破坏星火专精，逐阶大幅强化全部混沌系法术伤害与爆裂效能。',
    combatEffect: '全部混沌系法术威力与破坏伤害每阶 +20% 最高 +100%。',
  },
  sorcery: {
    id: 'sorcery',
    parent: 'chaos_magic',
    slotIndex: 3,
    name: '魔力',
    short: '魔力',
    h4Name: 'Sorcery',
    desc: '贯通破坏法则的全能魔导专精，无分派系直接增幅全部五系直接伤害法术。',
    combatEffect: '全部五系直接伤害法术最终伤害每阶 +20%，宗师满级高达 +100%。',
  },

  // === 自然魔法 Nature Magic ===
  herbalism: {
    id: 'herbalism',
    parent: 'nature_magic',
    slotIndex: 1,
    name: '草药',
    short: '草药',
    h4Name: 'Herbalism',
    desc: '调配灵草回复秘药与每日伤势休养，增强自然系增益回复与腰带药水效力。',
    combatEffect: '自然系回复与增益术及腰带药水效力 +15%/阶，英雄每回合自愈 3×阶 HP。',
    isAdventureFlavored: true,
  },
  meditation: {
    id: 'meditation',
    parent: 'nature_magic',
    slotIndex: 2,
    name: '冥想',
    short: '冥想',
    h4Name: 'Meditation',
    desc: '静心吐纳天地万象灵气，对称拓宽英雄最大灵力上限并提升每回合自动回蓝。',
    combatEffect: '最大灵力 +10/+20/+30/+40/+50，英雄每回合开始自动恢复 +1/+2/+3/+4/+5 MP。',
  },
  summoning: {
    id: 'summoning',
    parent: 'nature_magic',
    slotIndex: 3,
    name: '召唤',
    short: '召唤',
    h4Name: 'Summoning',
    desc: '共鸣幻想乡森林万灵与自然元素，逐阶大幅扩大自然系全部召唤生物军团规模。',
    combatEffect: '自然系全部召唤生物数量每阶 +20%，宗师满级提升至 +100%。',
  },
};

export const ALL_SECONDARY_SKILL_IDS: readonly SecondarySkillId[] = Object.keys(
  SECONDARY_SKILL_META,
) as SecondarySkillId[];

/** 获取某子技能升至指定目标阶位时，所需的所属主技能最低阶位 */
export function getRequiredPrimaryRankForSubRank(
  subId: SecondarySkillId,
  targetSubRank: SkillRank,
): SkillRank {
  if (targetSubRank <= 0) return 0;
  const parent = SECONDARY_SKILL_META[subId].parent;
  const isMagic = SKILL_TREE_META[parent].isMagic;
  if (isMagic) {
    // 魔法子技能阶梯：主 Lv.1 解锁 1~2；主 Lv.2 -> 3；主 Lv.3 -> 4；主 Lv.4 -> 5
    if (targetSubRank <= 2) return 1;
    if (targetSubRank === 3) return 2;
    if (targetSubRank === 4) return 3;
    return 4;
  }
  // 力量/战术/侦查/贵族子技能阶梯：主 Lv.1 解锁 1~2；主 Lv.2 解锁 3~4；主 Lv.3 解锁 5
  if (targetSubRank <= 2) return 1;
  if (targetSubRank <= 4) return 2;
  return 3;
}

/** 兼容辅助：获取学习该子技能 1 阶所需的主技能最低阶位 */
export function getSubSkillUnlockPrimaryRank(subId: SecondarySkillId): SkillRank {
  return getRequiredPrimaryRankForSubRank(subId, 1);
}

/** 根据双向阶梯前置，计算某主技能在当前子技能配置下可达到的最高合法阶位 */
export function getPrimarySkillMaxAllowedRank(
  _skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  primaryId: PrimarySkillId,
): SkillRank {
  const gate = PRIMARY_PREREQ_PAIR_MAP[primaryId];
  if (!gate) return 5;
  const rankA = subSkills?.[gate.pair[0]] ?? 0;
  const rankB = subSkills?.[gate.pair[1]] ?? 0;
  const minSub = Math.min(rankA, rankB);
  return Math.min(5, gate.baseFreeRank + minSub) as SkillRank;
}

/** 校验某主技能是否允许 +1，并给出精准的双向阶梯前置提示 */
export function canIncrementPrimarySkill(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>> | undefined,
  primaryId: PrimarySkillId,
): { ok: boolean; reason?: string } {
  const cur = (skills[primaryId] ?? 0) as SkillRank;
  if (cur >= 5) return { ok: false, reason: '已达宗师上限 Lv.5' };
  const maxAllowed = getPrimarySkillMaxAllowedRank(skills, subSkills, primaryId);
  if (cur + 1 <= maxAllowed) return { ok: true };

  const gate = PRIMARY_PREREQ_PAIR_MAP[primaryId]!;
  const needSubRank = cur + 1 - gate.baseFreeRank;
  const subNameA = SECONDARY_SKILL_META[gate.pair[0]].name;
  const subNameB = SECONDARY_SKILL_META[gate.pair[1]].name;
  const treeName = SKILL_TREE_META[primaryId].name;
  return {
    ok: false,
    reason: `晋升${treeName} Lv.${cur + 1} 需先将${subNameA}与${subNameB}均升至 Lv.${needSubRank}`,
  };
}

/** 计算某子技能在当前主技能等级下允许达到的最高阶位（0 表示尚未学习所属主技能） */
export function getSubSkillMaxAllowedRank(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subId: SecondarySkillId,
): SkillRank {
  const meta = SECONDARY_SKILL_META[subId];
  const parentRank = skills[meta.parent] ?? 0;
  if (parentRank <= 0) return 0;

  if (SKILL_TREE_META[meta.parent].isMagic) {
    if (parentRank >= 4) return 5;
    if (parentRank === 3) return 4;
    if (parentRank === 2) return 3;
    return 2;
  }

  if (parentRank >= 3) return 5;
  if (parentRank === 2) return 4;
  return 2;
}

/** 校验某子技能是否可以 +1，并返回清晰无括号的前置说明 */
export function canIncrementSubSkill(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>>,
  subId: SecondarySkillId,
): { ok: boolean; reason?: string } {
  const current = subSkills[subId] ?? 0;
  if (current >= 5) return { ok: false, reason: '已达宗师上限 Lv.5' };
  const meta = SECONDARY_SKILL_META[subId];
  const parentMeta = SKILL_TREE_META[meta.parent];
  const nextRank = (current + 1) as SkillRank;
  const maxAllowed = getSubSkillMaxAllowedRank(skills, subId);
  if (nextRank > maxAllowed) {
    const reqPrimary = getRequiredPrimaryRankForSubRank(subId, nextRank);
    return {
      ok: false,
      reason: `晋升${meta.name} Lv.${nextRank} 需先将主技能${parentMeta.name}升至 Lv.${reqPrimary}`,
    };
  }
  return { ok: true };
}

/**
 * 双向阶梯前置不动点级联收敛：
 * 当任意主技能或子技能下调时，循环收敛主/子双方直至全技能树满足严格的 HoMM4 原版前置合法状态。
 */
export function clampSkillsToPrerequisites(
  skills: Partial<Record<PrimarySkillId, SkillRank>>,
  subSkills: Partial<Record<SecondarySkillId, SkillRank>>,
): {
  skills: Partial<Record<PrimarySkillId, SkillRank>>;
  subSkills: Partial<Record<SecondarySkillId, SkillRank>>;
} {
  const nextSkills: Partial<Record<PrimarySkillId, SkillRank>> = { ...skills };
  const nextSub: Partial<Record<SecondarySkillId, SkillRank>> = { ...subSkills };

  let changed = true;
  while (changed) {
    changed = false;
    for (const pk of ALL_PRIMARY_SKILL_IDS) {
      const maxP = getPrimarySkillMaxAllowedRank(nextSkills, nextSub, pk);
      const curP = nextSkills[pk] ?? 0;
      if (curP > maxP) {
        if (maxP === 0) {
          delete nextSkills[pk];
        } else {
          nextSkills[pk] = maxP;
        }
        changed = true;
      }
    }
    for (const sk of ALL_SECONDARY_SKILL_IDS) {
      const maxS = getSubSkillMaxAllowedRank(nextSkills, sk);
      const curS = nextSub[sk] ?? 0;
      if (curS > maxS) {
        if (maxS === 0) {
          delete nextSub[sk];
        } else {
          nextSub[sk] = maxS;
        }
        changed = true;
      }
    }
  }

  return { skills: nextSkills, subSkills: nextSub };
}

/** 向后兼容别名：按当前主技能阶位收敛子技能 */
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

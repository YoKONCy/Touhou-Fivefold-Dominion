/**
 * HoMM4 五角星 + 圆心力量 阵营关系轮
 *
 * 外环顺时针：生命(life) — 秩序(order) — 死亡(death) — 混沌(chaos) — 自然(nature)
 * 圆心：力量(might) 与全部五系相邻（无敌对关系）
 */

export type Alignment = 'life' | 'order' | 'death' | 'chaos' | 'nature' | 'might';

export type AlignmentRelation = 'same' | 'allied' | 'enemy';

export const MAGIC_ALIGNMENT_RING: readonly Exclude<Alignment, 'might'>[] = [
  'life',
  'order',
  'death',
  'chaos',
  'nature',
] as const;

export interface AlignmentMeta {
  id: Alignment;
  /** 二段式标准阵营名（用于标题、铭牌、法术书分页与徽章） */
  name: string;
  /** 两字阵营简称 */
  shortName: string;
  /** 单字篆印缩写（用于法术书丝绸书签与紧凑造诣槽） */
  kanji: string;
  /** 文案正文统一简写（如「生命系」「混沌系」） */
  systemLabel: string;
  /** 对应的东方城镇/势力名（与原版 H4 六大城镇同构） */
  factionName: string;
  /** 对应的魔法学派名称 */
  magicSchoolName: string;
  /** 主题边框/徽章色 */
  themeColor: string;
  /** 深底高可读文字高亮色 */
  textColor: string;
  /** 辅助点缀色 */
  accentColor: string;
}

export const ALIGNMENT_META: Record<Alignment, AlignmentMeta> = {
  life: {
    id: 'life',
    name: '生命·信仰',
    shortName: '生命',
    kanji: '生',
    systemLabel: '生命系',
    factionName: '信仰圣域',
    magicSchoolName: '生命魔法',
    themeColor: '#e04f5f',
    textColor: '#ff8593',
    accentColor: '#f6d88b',
  },
  order: {
    id: 'order',
    name: '秩序·幻月',
    shortName: '秩序',
    kanji: '序',
    systemLabel: '秩序系',
    factionName: '幻月庭园',
    magicSchoolName: '秩序魔法',
    themeColor: '#6699ff',
    textColor: '#8ab8ff',
    accentColor: '#d9e6ff',
  },
  death: {
    id: 'death',
    name: '死亡·幽冥',
    shortName: '死亡',
    kanji: '死',
    systemLabel: '死亡系',
    factionName: '幽冥楼府',
    magicSchoolName: '死亡魔法',
    themeColor: '#8d65d6',
    textColor: '#c5a3ff',
    accentColor: '#7be8d8',
  },
  chaos: {
    id: 'chaos',
    name: '混沌·魔导',
    shortName: '混沌',
    kanji: '混',
    systemLabel: '混沌系',
    factionName: '魔导结社',
    magicSchoolName: '混沌魔法',
    themeColor: '#f6c945',
    textColor: '#ffd06b',
    accentColor: '#ff5c4d',
  },
  nature: {
    id: 'nature',
    name: '自然·灵森',
    shortName: '自然',
    kanji: '自',
    systemLabel: '自然系',
    factionName: '自然森境',
    magicSchoolName: '自然魔法',
    themeColor: '#4fd18b',
    textColor: '#75ebaa',
    accentColor: '#f59f45',
  },
  might: {
    id: 'might',
    name: '力量·武艺',
    shortName: '力量',
    kanji: '力',
    systemLabel: '力量系',
    factionName: '武艺旧都',
    magicSchoolName: '反魔体术（无魔法）',
    themeColor: '#e87a3e',
    textColor: '#ffa46b',
    accentColor: '#c9cfd8',
  },
};

/**
 * 查询两个阵营之间的关系（严格遵循 HoMM4 五角星 + 圆心力量）
 */
export function getAlignmentRelation(a: Alignment, b: Alignment): AlignmentRelation {
  if (a === b) return 'same';
  // 力量位于圆心，与全部五大魔法阵营皆为盟友/邻近关系
  if (a === 'might' || b === 'might') return 'allied';

  const idxA = MAGIC_ALIGNMENT_RING.indexOf(a);
  const idxB = MAGIC_ALIGNMENT_RING.indexOf(b);
  const diff = Math.abs(idxA - idxB);
  // 五元环中，索引差 1 或 4 即为相邻盟友；差 2 或 3 即为敌对
  return diff === 1 || diff === 4 ? 'allied' : 'enemy';
}

/**
 * 获取城镇魔法公会允许建造的跨系相邻副塔
 */
export function getAdjacentMagicAlignments(alignment: Alignment): Exclude<Alignment, 'might'>[] {
  if (alignment === 'might') return [];
  const idx = MAGIC_ALIGNMENT_RING.indexOf(alignment);
  const len = MAGIC_ALIGNMENT_RING.length;
  return [
    MAGIC_ALIGNMENT_RING[(idx - 1 + len) % len],
    MAGIC_ALIGNMENT_RING[(idx + 1) % len],
  ];
}

/**
 * 根据队伍中所有存活单位的阵营分布，计算 HoMM4 混编士气修正
 * - 全员同阵营：+1 士气
 * - 混编但全部互为盟友（含力量）：每个额外阵营 -1（最多 -2）
 * - 存在敌对阵营混编：每对敌对阵营组合 -3（重罚！）
 */
export function computeArmyAlignmentMorale(alignments: readonly Alignment[]): {
  moraleDelta: number;
  reason: string;
} {
  const unique = Array.from(new Set(alignments));
  if (unique.length <= 1) {
    return { moraleDelta: 1, reason: '纯阵营编制 (+1)' };
  }

  let enemyPairs = 0;
  let alliedPairs = 0;
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const rel = getAlignmentRelation(unique[i], unique[j]);
      if (rel === 'enemy') enemyPairs += 1;
      else if (rel === 'allied') alliedPairs += 1;
    }
  }

  if (enemyPairs > 0) {
    const delta = -Math.min(6, enemyPairs * 3 + Math.min(1, alliedPairs));
    return { moraleDelta: delta, reason: `敌对阵营混编 (${delta})` };
  }

  const delta = -Math.min(2, unique.length - 1);
  return { moraleDelta: delta, reason: `盟友阵营混编 (${delta})` };
}

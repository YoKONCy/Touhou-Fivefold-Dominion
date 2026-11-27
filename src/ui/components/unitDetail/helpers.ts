/**
 * 单位详情大窗（UnitDetailModal）视图模型与悬浮提示纯函数构造器
 *
 * 将 2×7 属性数表、立绘悬浮卡、英雄 9×3=36 技能树、进阶组合职业悬浮卡，
 * 以及英雄已习得术式/符卡/腰带秘药等派生数据从组件模板中抽离，便于独立维护。
 */

import { ALIGNMENT_META } from '@core/alignment';
import {
  computeMoraleLuckRates,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
} from '@core/combatEngine';
import { isImmuneToMorale, isUndeadUnit } from '@core/creatureTypes';
import {
  ALL_PRIMARY_SKILL_IDS,
  canIncrementPrimarySkill,
  canIncrementSubSkill,
  getRequiredPrimaryRankForSubRank,
  getSkillTreeTotal,
  SECONDARY_SKILL_META,
  SKILL_TREE_META,
} from '@core/h4Skills';
import { FOOTPRINT_DIMS } from '@core/hex';
import type {
  AdvancedClassDef,
  BattleState,
  BattleUnit,
  ComputedUnitStats,
  CreatureDefinition,
  PrimarySkillId,
  SecondarySkillId,
  SkillRank,
  SpellCardDef,
  StatKey,
} from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import {
  buildHeroEquipmentSlots,
  buildSpellCardTooltipPayload,
  buildSpellTooltipPayload,
  buildStatCellTooltip,
  getSkillRankLabel,
  PRIMARY_SKILL_META,
  type HudTooltipMiniBadge,
  type HudTooltipPayload,
} from '@ui/hudMetadata';
import { getUnitHeaderCreatureTags, SPELL_POLARITY_META } from '@ui/semanticFormat';

const TIER_ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V'];
const TIER_CN = ['零', '一', '二', '三', '四', '五'];

/** 2×7 属性数表单格视图项 */
export interface StatCellItem {
  key: string;
  icon: string;
  value: string;
  accent: string;
  muted?: boolean;
  tooltip: HudTooltipPayload;
}

/** 英雄二级专精技能视图项 */
export interface HeroSkillSubItem {
  id: SecondarySkillId;
  name: string;
  short: string;
  h4Name: string;
  slotIndex: 1 | 2 | 3;
  rank: SkillRank;
  locked: boolean;
  canInc: boolean;
  incReason?: string;
  tooltip: HudTooltipPayload;
}

/** 英雄主技能树视图项 */
export interface HeroSkillTreeItem {
  id: PrimarySkillId;
  name: string;
  short: string;
  h4Name: string;
  icon: string;
  color: string;
  rank: SkillRank;
  total: number;
  canInc: boolean;
  incReason?: string;
  subItems: HeroSkillSubItem[];
  tooltip: HudTooltipPayload;
}

/** 英雄快捷栏已习得术式视图项 */
export interface HeroKnownSpellItem {
  id: string;
  name: string;
  manaCost: number;
  color: string;
  tooltip: HudTooltipPayload;
}

/** 英雄快捷栏专属符卡视图项 */
export interface HeroSignatureCardItem {
  card: SpellCardDef;
  tooltip: HudTooltipPayload;
}

/** 英雄快捷栏腰带秘药视图项 */
export interface HeroPotionItem {
  id: string;
  charges: number;
  icon: string;
  tooltip: HudTooltipPayload;
}

/** 英雄纸娃娃单格神器装备快照类型 */
export type HeroEquipmentSlotItem = ReturnType<typeof buildHeroEquipmentSlots>[number];

/** 获取兵种等阶罗马数字文本 */
export function getCreatureTierRoman(tier: number): string {
  return TIER_ROMAN[tier] ?? `${tier}`;
}

/** 获取兵种等阶中文 + 罗马数字组合标签 */
export function getCreatureTierLabel(tier: number): string {
  return `${TIER_CN[tier] ?? tier}阶 · ${getCreatureTierRoman(tier)}`;
}

/** 格式化进阶职业解锁所需的技能树组合描述 */
export function formatClassRequirement(cls: AdvancedClassDef): string {
  if (cls.minMagicTrees && cls.minMagicTrees >= 3) {
    return '任意 3 系魔法达专家 Lv.3 或单树总分 ≥ 5';
  }
  const nameA = PRIMARY_SKILL_META[cls.primaryA]?.short ?? cls.primaryA;
  const nameB = PRIMARY_SKILL_META[cls.primaryB]?.short ?? cls.primaryB;
  return `${nameA} + ${nameB}`;
}

/** 构造英雄基础/进阶职业的统一彩色微标悬浮提示 */
export function buildClassTooltip(
  cls: AdvancedClassDef,
  opts: { subtitle: string; tag: string; tagTone?: 'default' | 'danger' | 'muted'; accent?: string },
): HudTooltipPayload {
  const badges: HudTooltipMiniBadge[] = [
    {
      label: cls.isBaseClass ? '单系基础职业' : cls.minMagicTrees ? '全能高阶职业' : '双修进阶职业',
      icon: SPELL_POLARITY_META.utility.icon,
      color: '#a6d4ff',
      bg: 'rgba(18, 32, 52, 0.92)',
      border: '#5c9be6',
    },
  ];
  const treeIds = cls.isBaseClass || cls.primaryA === cls.primaryB ? [cls.primaryA] : [cls.primaryA, cls.primaryB];
  for (const tid of treeIds) {
    const meta = SKILL_TREE_META[tid];
    if (!meta) continue;
    badges.push({
      label: meta.name,
      icon: meta.icon,
      color: meta.magicSchool ? ALIGNMENT_META[meta.magicSchool].textColor : meta.color,
      bg: 'rgba(22, 16, 26, 0.92)',
      border: meta.magicSchool ? ALIGNMENT_META[meta.magicSchool].themeColor : meta.color,
    });
  }
  return {
    title: cls.name,
    subtitle: opts.subtitle,
    tag: opts.tag,
    tagTone: opts.tagTone,
    accent: opts.accent ?? '#f5df9e',
    badges,
    lines: [cls.description],
  };
}

/** 构造英雄完整 9 大主技能 × 3 子技能树（共 36 项）视图模型 */
export function buildHeroSkillTrees(unit: BattleUnit, includeUnlearned: boolean): HeroSkillTreeItem[] {
  if (unit.kind !== 'hero') return [];
  const subMap = unit.subSkills ?? {};

  const trees: HeroSkillTreeItem[] = ALL_PRIMARY_SKILL_IDS.map((primaryId) => {
    const treeMeta = SKILL_TREE_META[primaryId];
    const rank = (unit.skills[primaryId] ?? 0) as SkillRank;
    const total = getSkillTreeTotal(unit.skills, subMap, primaryId);
    const treeBadges: HudTooltipMiniBadge[] = treeMeta.magicSchool
      ? [
          {
            label: ALIGNMENT_META[treeMeta.magicSchool].name,
            color: ALIGNMENT_META[treeMeta.magicSchool].textColor,
            bg: 'rgba(22, 16, 26, 0.92)',
            border: ALIGNMENT_META[treeMeta.magicSchool].themeColor,
          },
          {
            label: '魔法主技能',
            icon: treeMeta.icon,
            color: treeMeta.color,
            bg: 'rgba(22, 18, 28, 0.92)',
            border: treeMeta.color,
          },
        ]
      : [
          {
            label: '武艺战术主技能',
            icon: treeMeta.icon,
            color: treeMeta.color,
            bg: 'rgba(26, 20, 18, 0.92)',
            border: treeMeta.color,
          },
        ];

    const subItems: HeroSkillSubItem[] = treeMeta.subSkills.map((subId) => {
      const sm = SECONDARY_SKILL_META[subId];
      const sRank = (subMap[subId] ?? 0) as SkillRank;
      const incCheck = canIncrementSubSkill(unit.skills, subMap, subId);
      const locked = rank === 0;
      const reqForNext =
        sRank < 5 ? getRequiredPrimaryRankForSubRank(subId, (sRank + 1) as SkillRank) : 5;
      const subBadges: HudTooltipMiniBadge[] = [
        ...(treeMeta.magicSchool
          ? [
              {
                label: ALIGNMENT_META[treeMeta.magicSchool].name,
                color: ALIGNMENT_META[treeMeta.magicSchool].textColor,
                bg: 'rgba(22, 16, 26, 0.92)',
                border: ALIGNMENT_META[treeMeta.magicSchool].themeColor,
              },
            ]
          : []),
        {
          label: `${treeMeta.name} · 专精`,
          icon: treeMeta.icon,
          color: treeMeta.color,
          bg: 'rgba(22, 18, 26, 0.92)',
          border: treeMeta.color,
        },
      ];
      return {
        id: subId,
        name: sm.name,
        short: sm.short,
        h4Name: sm.h4Name,
        slotIndex: sm.slotIndex,
        rank: sRank,
        locked,
        canInc: incCheck.ok,
        incReason: incCheck.reason,
        tooltip: {
          title: `${sm.name} · ${getSkillRankLabel(sRank)}`,
          subtitle:
            sRank >= 5
              ? `隶属主技能 ${treeMeta.name} · 已达最高阶位`
              : `下阶 Lv.${sRank + 1} 需主技能${treeMeta.name} Lv.${reqForNext}`,
          tag: locked ? '未解锁' : `Lv.${sRank}/5`,
          tagTone: locked ? 'muted' : 'default',
          accent: treeMeta.color,
          badges: subBadges,
          summary: sm.desc,
          lines: [`实战效果：${sm.combatEffect}`],
        } satisfies HudTooltipPayload,
      };
    });

    const primaryIncCheck = canIncrementPrimarySkill(unit.skills, subMap, primaryId);

    return {
      id: primaryId,
      name: treeMeta.name,
      short: treeMeta.short,
      h4Name: treeMeta.h4Name,
      icon: treeMeta.icon,
      color: treeMeta.color,
      rank,
      total,
      canInc: primaryIncCheck.ok,
      incReason: primaryIncCheck.reason,
      subItems,
      tooltip: {
        title: `${treeMeta.name} · ${getSkillRankLabel(rank)}`,
        subtitle: `本系总投入 ${total}/20 · 达 2 点即具双修转职资格`,
        tag: `Lv.${rank}/5`,
        accent: treeMeta.color,
        badges: treeBadges,
        summary: treeMeta.desc,
        lines: [
          `下辖专精：${subItems.map((s) => `${s.name} Lv.${s.rank}`).join(' · ')}`,
          ...(primaryIncCheck.reason ? [`前置提示：${primaryIncCheck.reason}`] : []),
        ],
      } satisfies HudTooltipPayload,
    };
  });

  if (includeUnlearned) return trees;
  return trees.filter((t) => t.rank > 0);
}

/** 构造英雄已习得术式微缩列表 */
export function buildHeroKnownSpells(unit: BattleUnit, battleState: BattleState): HeroKnownSpellItem[] {
  if (unit.kind !== 'hero') return [];
  return unit.knownSpellIds
    .map((id) => TOUHOU_CATALOG.spells[id])
    .filter(Boolean)
    .map((sp) => ({
      id: sp.id,
      name: sp.name,
      manaCost: sp.manaCost,
      color: ALIGNMENT_META[sp.alignment].themeColor,
      tooltip: buildSpellTooltipPayload(sp, {
        effectiveManaCost: getEffectiveSpellManaCost(battleState, unit, sp),
        currentMana: unit.mana,
        effectiveRange: getEffectiveSpellRange(battleState, unit, sp),
      }),
    }));
}

/** 当英雄习得超过 6 个术式时，构造「万象魔导总录」聚合悬浮提示 */
export function buildHeroSpellSummaryTooltip(
  unit: BattleUnit,
  knownCount: number,
): HudTooltipPayload | null {
  if (knownCount <= 6) return null;
  const counts: Record<string, number> = { life: 0, order: 0, death: 0, chaos: 0, nature: 0 };
  for (const id of unit.knownSpellIds ?? []) {
    const sp = TOUHOU_CATALOG.spells[id];
    if (sp && sp.alignment in counts) counts[sp.alignment] += 1;
  }
  return {
    title: `万象魔导总录 · 已习得 ${knownCount} 术`,
    subtitle: '五系魔法贯通 · 可于右侧「魔导」折本分类检索',
    tag: `${knownCount} 术`,
    accent: '#f5df9e',
    lines: [
      `• 生命魔法：${counts.life} 术   • 秩序魔法：${counts.order} 术`,
      `• 死亡魔法：${counts.death} 术   • 混沌魔法：${counts.chaos} 术`,
      `• 自然魔法：${counts.nature} 术`,
    ],
  };
}

/** 构造英雄专属符卡快捷项 */
export function buildHeroSignatureCard(unit: BattleUnit): HeroSignatureCardItem | null {
  if (unit.kind !== 'hero' || !unit.signatureSpellCardId) return null;
  const card = TOUHOU_CATALOG.spellCards[unit.signatureSpellCardId];
  if (!card) return null;
  return {
    card,
    tooltip: buildSpellCardTooltipPayload(card, {
      currentMana: unit.mana,
      currentCharge: unit.spellCardCharge,
    }),
  };
}

/** 构造英雄腰带秘药快捷列表 */
export function buildHeroPotions(unit: BattleUnit): HeroPotionItem[] {
  if (unit.kind !== 'hero') return [];
  return unit.potions
    .map((slot) => {
      const def = TOUHOU_CATALOG.potions[slot.potionId];
      if (!def) return null;
      const icon =
        def.effectType === 'heal'
          ? 'potion_heal'
          : def.effectType === 'mana_charge'
            ? 'potion_mana'
            : 'potion_barrier';
      const polMeta =
        def.effectType === 'heal'
          ? SPELL_POLARITY_META.heal
          : def.effectType === 'mana_charge'
            ? SPELL_POLARITY_META.utility
            : SPELL_POLARITY_META.buff;
      return {
        id: slot.potionId,
        charges: slot.charges,
        icon,
        tooltip: {
          title: `腰带秘药 · ${def.name}`,
          tag: `余 ${slot.charges} 瓶`,
          accent: def.color,
          badges: [
            {
              label: `${polMeta.label}秘药`,
              icon: polMeta.icon,
              color: polMeta.color,
              bg: polMeta.bg,
              border: polMeta.border,
            },
          ],
          summary: def.description,
          lines: [
            '战斗中饮用不消耗本回合行动权，每名英雄每回合限用 1 次，且受自然魔法草药专精增幅。',
            ...(unit.hasUsedPotionThisRound ? ['本回合已饮用过秘药，待下回合开始恢复使用。'] : []),
          ],
        } satisfies HudTooltipPayload,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

/** 构造 2×7 精简黄铜连体属性数表（每格仅图标 + 凝练数值，Hover 展示完整修饰明细） */
export function buildStatRows(
  unit: BattleUnit,
  stats: ComputedUnitStats,
  battleState: BattleState,
  creatureDef: CreatureDefinition | null,
): { top: StatCellItem[]; bottom: StatCellItem[] } {
  const footprintInfo = FOOTPRINT_DIMS[unit.footprint];
  const creatureTierRoman = getCreatureTierRoman(creatureDef?.tier ?? 1);

  const mk = (
    key: string,
    icon: string,
    label: string,
    value: string,
    accent: string,
    statKeys: StatKey[],
    extra: string[] = [],
    muted = false,
  ): StatCellItem => ({
    key,
    icon,
    value,
    accent,
    muted,
    tooltip: buildStatCellTooltip(label, value, statKeys, stats, extra),
  });

  const top: StatCellItem[] = [
    mk('atk', 'atk', '攻击力', `${stats.attack}`, '#f0a695', ['attack']),
    mk('def', 'def', '防御力', `${stats.defense}`, '#9ac4ed', ['defense']),
    mk(
      'dmg',
      'dmg',
      '单兵基础伤害',
      `${stats.minDamage}-${stats.maxDamage}`,
      '#f2d68a',
      ['minDamage', 'maxDamage'],
      unit.kind === 'creature'
        ? [`全队 ×${unit.count} 基础期望：${stats.minDamage * unit.count} ~ ${stats.maxDamage * unit.count}`]
        : [],
    ),
    mk(
      'hp',
      'hp',
      unit.kind === 'hero' ? '英雄生命值' : '单兵生命值',
      `${unit.currentHp}/${stats.maxHp}`,
      '#84e0a8',
      ['maxHp'],
      unit.kind === 'creature'
        ? [`当前堆叠总生命：${(unit.count - 1) * stats.maxHp + unit.currentHp} / ${unit.maxCount * stats.maxHp}`]
        : [],
    ),
    mk(
      'spd',
      unit.abilities.flying ? 'flying' : 'speed',
      unit.abilities.flying ? '飞行移动力' : '陆行移动力',
      `${stats.speed}`,
      unit.abilities.flying ? '#8ae8f0' : '#ebd094',
      ['speed'],
      [unit.abilities.flying ? '御空飞行：无视城墙外地形障碍与减速' : '陆地行军：竹林与泥沼等地形将消耗额外移动力'],
    ),
    mk('morale', 'morale', '部队士气', `${stats.morale >= 0 ? '+' : ''}${stats.morale}`, '#f5dc82', ['morale'], (() => {
      if (isImmuneToMorale(unit)) {
        return isUndeadUnit(unit)
          ? ['不死生物免疫正负士气波动，同时令同队非死亡系友军士气 -2']
          : ['机械构造体免疫正负士气波动'];
      }
      const r = computeMoraleLuckRates(stats.morale, stats.luck, battleState.balancePreset, false);
      const lines: string[] = [];
      if (unit.roundMoraleState === 'good') {
        lines.push('本回合已触发高士气：第一先手梯队，攻击伤害 +25%');
      } else if (unit.roundMoraleState === 'bad') {
        lines.push('本回合已触发低士气：最末行动梯队，攻击伤害 -20%');
      }
      if (stats.morale > 0) {
        lines.push(`高士气触发率 ${Math.round(r.goodMoraleChance * 100)}%，每回合判定抢占先手梯队且伤害 +25%`);
      } else if (stats.morale < 0) {
        lines.push(`低士气触发率 ${Math.round(r.badMoraleChance * 100)}%，每回合判定落入末位梯队且伤害 -20%`);
      } else {
        lines.push('当前士气平稳，按常规主动性排序且无士气伤害修正');
      }
      return lines;
    })()),
    mk('luck', 'luck', '战斗幸运', `${stats.luck >= 0 ? '+' : ''}${stats.luck}`, '#a6e89b', ['luck'], (() => {
      const r = computeMoraleLuckRates(stats.morale, stats.luck, battleState.balancePreset, isImmuneToMorale(unit));
      if (stats.luck > 0) {
        return [
          `进攻幸运 ×1.5 暴击率 ${Math.round(r.attackLuckChance * 100)}%`,
          `受击幸运护身 ×0.5 减伤率 ${Math.round(r.defenseLuckChance * 100)}%`,
        ];
      }
      if (stats.luck < 0) {
        return [
          `进攻厄运 ×0.5 衰减率 ${Math.round(r.attackBadLuckChance * 100)}%`,
          `受击厄运破防 ×1.25 增伤率 ${Math.round(r.defenseBadLuckChance * 100)}%`,
        ];
      }
      return ['当前幸运平稳，攻防无额外暴击或护身修正'];
    })()),
  ];

  const fpCells = (footprintInfo?.cols ?? 1) * (footprintInfo?.rows ?? 1);
  const bottom: StatCellItem[] = [
    mk(
      'range',
      'range',
      '远程射程',
      unit.abilities.ranged && !unit.abilities.noRanged ? `${stats.range}` : '—',
      '#94c0ed',
      ['range'],
      unit.abilities.noRanged ? ['远程禁手：无法射击'] : !unit.abilities.ranged ? ['近战单位，无远程攻击'] : [],
      !unit.abilities.ranged || Boolean(unit.abilities.noRanged),
    ),
    mk(
      'ammo',
      'ammo',
      unit.abilities.ranged && unit.abilities.unlimitedShots ? '无限弹药' : '剩余弹药',
      !unit.abilities.ranged ? '—' : unit.abilities.unlimitedShots ? '∞' : `${unit.ammo}/${unit.maxAmmo}`,
      unit.abilities.ranged && unit.abilities.unlimitedShots ? '#dfc4ff' : '#ebd394',
      [],
      !unit.abilities.ranged
        ? ['无弹药需求']
        : unit.abilities.unlimitedShots
          ? ['无限弹药：远程射击与远程反击永不消耗弹药']
          : unit.abilities.noMelee
            ? ['弹药耗尽后因近战禁手将无法发起普通攻击']
            : ['弹药耗尽后仅能转入近战交锋'],
      !unit.abilities.ranged,
    ),
    mk('init', 'init', '先手主动', `${stats.initiative}`, '#f2cf72', ['initiative']),
    mk(
      'graze',
      'graze',
      '擦弹率',
      `${Math.round(stats.grazeChance * 100)}%`,
      '#8ce6ed',
      ['grazeChance'],
      ['受远程/范围弹幕攻击时触发 25% 减伤并反哺灵力与符卡充能'],
    ),
    mk(
      'mres',
      'mres',
      '魔法抗性',
      `${Math.round(stats.magicResistance * 100)}%`,
      stats.magicResistance < 0 ? '#f08090' : '#cbb0eb',
      ['magicResistance'],
      stats.magicResistance < 0 ? ['负魔抗会使承受的直接法术与符卡伤害额外提升'] : [],
    ),
    unit.kind === 'hero'
      ? mk('sp', 'sp', '法术强度', `${stats.spellPower}`, '#a0bdf0', ['spellPower'], [`灵力上限 ${stats.maxMana} MP`])
      : mk(
          'size',
          'size',
          '占位体积',
          unit.footprint.replace('x', '×'),
          '#edc185',
          [],
          [`${footprintInfo?.label ?? ''}，占据 ${fpCells} 个六边形格`],
        ),
    unit.kind === 'hero'
      ? mk(
          'power',
          'power',
          '火力 P 点',
          `${(unit.powerPoints ?? 0).toFixed(1)}`,
          '#eb8d9a',
          [],
          [`上限 ${(unit.maxPowerPoints ?? 4).toFixed(1)} P · 每 1.0P 提供 +5% 全伤害`],
        )
      : mk(
          'tier',
          'tier',
          '兵种等阶',
          creatureTierRoman,
          '#f5dc82',
          [],
          [creatureDef?.description ?? '幻想乡量产兵种'],
        ),
  ];

  return { top, bottom };
}

/** 构造立绘悬停详情卡（区分量产兵种与英雄指挥官） */
export function buildPortraitTooltip(
  unit: BattleUnit,
  creatureDef: CreatureDefinition | null,
  advancedClass: AdvancedClassDef | null,
): HudTooltipPayload {
  const am = ALIGNMENT_META[unit.alignment];
  const footprintInfo = FOOTPRINT_DIMS[unit.footprint];

  if (unit.kind === 'creature' && creatureDef) {
    const headerCreatureTags = getUnitHeaderCreatureTags(unit);
    return {
      title: `${unit.name} · ${footprintInfo?.label ?? ''}`,
      subtitle: am ? `${am.factionName} · ${am.name}` : undefined,
      tag: getCreatureTierLabel(creatureDef.tier ?? 1),
      accent: am?.themeColor,
      badges: [
        ...(am
          ? [
              {
                label: `${am.factionName} · ${am.name}`,
                color: am.textColor,
                bg: 'rgba(22, 16, 26, 0.92)',
                border: am.themeColor,
              },
            ]
          : []),
        ...headerCreatureTags.map((t) => ({
          label: t.label,
          icon: t.icon,
          color: t.color,
          bg: t.bg,
          border: t.border,
        })),
      ],
      lines: [creatureDef.description],
    };
  }

  return {
    title: `Lv.${unit.level} ${unit.name}`,
    subtitle: advancedClass ? `${unit.title} · ${advancedClass.name}` : unit.title,
    tag: advancedClass?.name ?? '英雄',
    accent: am?.themeColor,
    badges: am
      ? [
          {
            label: `${am.factionName} · ${am.name}`,
            color: am.textColor,
            bg: 'rgba(22, 16, 26, 0.92)',
            border: am.themeColor,
          },
        ]
      : undefined,
    lines: advancedClass
      ? [advancedClass.description]
      : ['东方唯一英雄单位，可亲自上场作战、施法与宣言专属符卡。'],
  };
}

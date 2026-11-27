<script setup lang="ts">
/**
 * 双轨典藏单位详情居中大 HUD（幽夜蒔絵 × 博麗木刻 × HoMM4 雕版数表）
 * - 兵种大窗（方案 A）：动态立绘 + 落款朱印横匾 + 20 格法术专属图标状态矩阵(2×10) + 2×7 铭文数表 + 七宝烧特技槽
 * - 英雄档案（方案 B）：动态立绘 + 十字星阵神器纸娃娃 + 2×7 铭文数表 + 20 格独立状态矩阵 +
 *   战斗场景外自由切换「全部 37 种进阶组合职业」+ 完整「9 主技能 × 3 子技能 = 36 技能树」与沙盒实时调点器！
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ALIGNMENT_META } from '@core/alignment';
import {
  computeMoraleLuckRates,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
} from '@core/combatEngine';
import { isImmuneToMorale, isUndeadUnit } from '@core/creatureTypes';
import {
  ALL_H4_ADVANCED_CLASS_IDS,
  ALL_PRIMARY_SKILL_IDS,
  canIncrementSubSkill,
  getSkillTreeTotal,
  H4_ADVANCED_CLASSES,
  SECONDARY_SKILL_META,
  SKILL_TREE_META,
} from '@core/h4Skills';
import { FOOTPRINT_DIMS } from '@core/hex';
import { MAX_UNIT_BUFF_SLOTS } from '@core/statusCap';
import type {
  AdvancedClassDef,
  ArtifactDef,
  PrimarySkillId,
  SecondarySkillId,
  SkillRank,
  StatKey,
} from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { getSpellIconDataUrl } from '@renderer/spellIcons';
import { getVoxelPortraitFrames } from '@renderer/voxelSprites';
import { useBattleStore } from '@ui/battleStore';
import HudHoverTooltip from '@ui/components/HudHoverTooltip.vue';
import OrnamentalFrame from '@ui/components/OrnamentalFrame.vue';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import {
  buildHeroEquipmentSlots,
  buildHeroTraitBadges,
  buildSpellCardTooltipPayload,
  buildSpellTooltipPayload,
  buildStatCellTooltip,
  buildUnitSpecialtyBadges,
  buildUnitStatusBadges,
  getSkillRankLabel,
  PRIMARY_SKILL_META,
  type HudTooltipMiniBadge,
  type HudTooltipPayload,
} from '@ui/hudMetadata';
import { getUnitHeaderCreatureTags, SPELL_POLARITY_META } from '@ui/semanticFormat';

const store = useBattleStore();
const animFrameIdx = ref(0);
let animTimer: number | null = null;

/** 英雄档案交互面板状态：进阶职业切换谱 / 36 技能树沙盒调点模式 */
const showClassPicker = ref(false);
const showLockedClasses = ref(false);
const skillEditMode = ref(false);

const hoverTip = ref<HudTooltipPayload | null>(null);
const tipPos = ref({ x: 0, y: 0 });

function showTip(payload: HudTooltipPayload, e: MouseEvent): void {
  hoverTip.value = payload;
  tipPos.value = { x: e.clientX, y: e.clientY };
}

function moveTip(e: MouseEvent): void {
  if (!hoverTip.value) return;
  tipPos.value = { x: e.clientX, y: e.clientY };
}

function hideTip(): void {
  hoverTip.value = null;
}

function closeModal(): void {
  hideTip();
  showClassPicker.value = false;
  skillEditMode.value = false;
  store.closeUnitDetail();
}

watch(
  () => store.detailModal?.unitId,
  () => {
    showClassPicker.value = false;
    showLockedClasses.value = false;
    skillEditMode.value = false;
  },
);

onMounted(() => {
  animTimer = window.setInterval(() => {
    animFrameIdx.value = (animFrameIdx.value + 1) % 6;
  }, 165);
});

onBeforeUnmount(() => {
  if (animTimer !== null) window.clearInterval(animTimer);
});

const unit = computed(() => store.detailModalUnit);
const stats = computed(() => store.detailModalStats);
const alignMeta = computed(() => (unit.value ? ALIGNMENT_META[unit.value.alignment] : null));
const footprintInfo = computed(() => (unit.value ? FOOTPRINT_DIMS[unit.value.footprint] : null));

const creatureDef = computed(() => {
  const u = unit.value;
  if (!u || u.kind !== 'creature') return null;
  return TOUHOU_CATALOG.creatures[u.defId] ?? null;
});

const TIER_KANJI = ['零', '壱', '弐', '参', '肆', '伍'];

const creatureTierKanji = computed(() => {
  const tier = creatureDef.value?.tier ?? 1;
  return `${TIER_KANJI[tier] ?? tier}阶`;
});

const factionStamp = computed(() => (unit.value?.side === 'left' ? '博麗' : '霧雨'));

const portraitUrl = computed(() => {
  if (!unit.value) return '';
  const targetSize = unit.value.kind === 'hero' ? 144 : 112;
  const frames = getVoxelPortraitFrames(unit.value.voxelBlueprintId, targetSize);
  return frames[animFrameIdx.value % frames.length] ?? frames[0];
});

const specialtyBadges = computed(() => (unit.value ? buildUnitSpecialtyBadges(unit.value) : []));
const headerCreatureTags = computed(() => (unit.value ? getUnitHeaderCreatureTags(unit.value) : []));
const statusBadges = computed(() =>
  unit.value ? buildUnitStatusBadges(unit.value, store.battleState) : [],
);
const traitBadges = computed(() => (unit.value ? buildHeroTraitBadges(unit.value) : []));
const equipSlots = computed(() =>
  unit.value && unit.value.kind === 'hero' ? buildHeroEquipmentSlots(unit.value) : [],
);

/** 按部位索引 5 格神器纸娃娃（用于十字星阵人偶排布） */
const equipSlotMap = computed(() => {
  const map: Partial<Record<ArtifactDef['slot'], (typeof equipSlots.value)[number]>> = {};
  for (const s of equipSlots.value) {
    map[s.slot] = s;
  }
  return map;
});

/** 英雄完整 9 大主技能 × 3 子技能树（共 36 项）视图模型 */
const heroSkillTrees = computed(() => {
  const u = unit.value;
  if (!u || u.kind !== 'hero') return [];
  const subMap = u.subSkills ?? {};

  const trees = ALL_PRIMARY_SKILL_IDS.map((primaryId) => {
    const treeMeta = SKILL_TREE_META[primaryId];
    const rank = (u.skills[primaryId] ?? 0) as SkillRank;
    const total = getSkillTreeTotal(u.skills, subMap, primaryId);
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

    const subItems = treeMeta.subSkills.map((subId) => {
      const sm = SECONDARY_SKILL_META[subId];
      const sRank = (subMap[subId] ?? 0) as SkillRank;
      const incCheck = canIncrementSubSkill(u.skills, subMap, subId);
      const locked = rank < sm.slotIndex;
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
          label: `${treeMeta.name} · 第 ${sm.slotIndex} 专精`,
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
          subtitle: `需主技能${treeMeta.name}达到 Lv.${sm.slotIndex} 解锁`,
          tag: locked ? '未解锁' : `Lv.${sRank}/5`,
          tagTone: locked ? 'muted' : 'default',
          accent: treeMeta.color,
          badges: subBadges,
          summary: sm.desc,
          lines: [`实战效果：${sm.combatEffect}`],
        } satisfies HudTooltipPayload,
      };
    });

    return {
      id: primaryId,
      name: treeMeta.name,
      short: treeMeta.short,
      h4Name: treeMeta.h4Name,
      icon: treeMeta.icon,
      color: treeMeta.color,
      rank,
      total,
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
        ],
      } satisfies HudTooltipPayload,
    };
  });

  if (skillEditMode.value) return trees;
  return trees.filter((t) => t.rank > 0);
});

/** 未解锁的其余进阶职业（供玩家查看全部 37 职业配方） */
const lockedAdvancedClasses = computed<AdvancedClassDef[]>(() => {
  const eligibleIds = new Set(store.detailModalEligibleClasses.map((c) => c.id));
  return ALL_H4_ADVANCED_CLASS_IDS.filter((id) => !eligibleIds.has(id)).map((id) => H4_ADVANCED_CLASSES[id]);
});

function formatClassRequirement(cls: AdvancedClassDef): string {
  if (cls.minMagicTrees && cls.minMagicTrees >= 3) {
    return '任意 3 系魔法达专家 Lv.3 或单树总分 ≥ 5';
  }
  const nameA = PRIMARY_SKILL_META[cls.primaryA]?.short ?? cls.primaryA;
  const nameB = PRIMARY_SKILL_META[cls.primaryB]?.short ?? cls.primaryB;
  return `${nameA} + ${nameB}`;
}

/** 构造英雄基础/进阶职业的统一彩色微标悬浮提示 */
function buildClassTooltip(
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

function handleToggleEditMode(): void {
  if (!unit.value || unit.value.kind !== 'hero') return;
  if (!store.canModifyHeroBuild) {
    store.returnToPreBattlePrep(unit.value.id);
    skillEditMode.value = true;
    return;
  }
  skillEditMode.value = !skillEditMode.value;
}

function handleStepPrimary(primaryId: PrimarySkillId, delta: 1 | -1): void {
  const u = unit.value;
  if (!u || u.kind !== 'hero') return;
  const cur = (u.skills[primaryId] ?? 0) as SkillRank;
  const next = Math.max(0, Math.min(5, cur + delta)) as SkillRank;
  if (next === cur) return;
  store.adjustHeroPrimarySkill(u.id, primaryId, next);
}

function handleStepSubSkill(subId: SecondarySkillId, delta: 1 | -1): void {
  const u = unit.value;
  if (!u || u.kind !== 'hero') return;
  const cur = (u.subSkills?.[subId] ?? 0) as SkillRank;
  const next = Math.max(0, Math.min(5, cur + delta)) as SkillRank;
  if (next === cur) return;
  store.adjustHeroSecondarySkill(u.id, subId, next);
}

function handlePickClass(classId: string | null): void {
  const u = unit.value;
  if (!u || u.kind !== 'hero') return;
  store.switchHeroAdvancedClass(u.id, classId);
}

/** 英雄已习得术式、符卡与腰带药水微缩图标 */
const heroKnownSpells = computed(() => {
  const u = unit.value;
  if (!u || u.kind !== 'hero') return [];
  return u.knownSpellIds
    .map((id) => TOUHOU_CATALOG.spells[id])
    .filter(Boolean)
    .map((sp) => ({
      id: sp.id,
      name: sp.name,
      manaCost: sp.manaCost,
      color: ALIGNMENT_META[sp.alignment].themeColor,
      tooltip: buildSpellTooltipPayload(sp, {
        effectiveManaCost: getEffectiveSpellManaCost(store.battleState, u, sp),
        currentMana: u.mana,
        effectiveRange: getEffectiveSpellRange(store.battleState, u, sp),
      }),
    }));
});

const heroSpellSummaryTooltip = computed<HudTooltipPayload | null>(() => {
  const list = heroKnownSpells.value;
  if (list.length <= 6) return null;
  const counts: Record<string, number> = { life: 0, order: 0, death: 0, chaos: 0, nature: 0 };
  for (const id of unit.value?.knownSpellIds ?? []) {
    const sp = TOUHOU_CATALOG.spells[id];
    if (sp && sp.alignment in counts) counts[sp.alignment] += 1;
  }
  return {
    title: `万象魔导总录 · 已习得 ${list.length} 术`,
    subtitle: '五系魔法贯通 · 可于右侧「魔导」折本分类检索',
    tag: `${list.length} 术`,
    accent: '#f5df9e',
    lines: [
      `• 生命魔法：${counts.life} 术   • 秩序魔法：${counts.order} 术`,
      `• 死亡魔法：${counts.death} 术   • 混沌魔法：${counts.chaos} 术`,
      `• 自然魔法：${counts.nature} 术`,
    ],
  };
});

const heroSignatureCard = computed(() => {
  const u = unit.value;
  if (!u || u.kind !== 'hero' || !u.signatureSpellCardId) return null;
  const card = TOUHOU_CATALOG.spellCards[u.signatureSpellCardId];
  if (!card) return null;
  return {
    card,
    tooltip: buildSpellCardTooltipPayload(card, {
      currentMana: u.mana,
      currentCharge: u.spellCardCharge,
    }),
  };
});

const heroPotions = computed(() => {
  const u = unit.value;
  if (!u || u.kind !== 'hero') return [];
  return u.potions
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
            ...(u.hasUsedPotionThisRound ? ['本回合已饮用过秘药，待下回合开始恢复使用。'] : []),
          ],
        } satisfies HudTooltipPayload,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
});

interface StatCellItem {
  key: string;
  icon: string;
  value: string;
  accent: string;
  muted?: boolean;
  tooltip: HudTooltipPayload;
}

/** 2×7 精简黄铜连体属性数表（每格仅图标 + 凝练数值，Hover 展示完整修饰明细） */
const statRows = computed<{ top: StatCellItem[]; bottom: StatCellItem[] }>(() => {
  const u = unit.value;
  const s = stats.value;
  if (!u || !s) return { top: [], bottom: [] };

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
    tooltip: buildStatCellTooltip(label, value, statKeys, s, extra),
  });

  const top: StatCellItem[] = [
    mk('atk', 'atk', '攻击力', `${s.attack}`, '#f0a695', ['attack']),
    mk('def', 'def', '防御力', `${s.defense}`, '#9ac4ed', ['defense']),
    mk(
      'dmg',
      'dmg',
      '单兵基础伤害',
      `${s.minDamage}-${s.maxDamage}`,
      '#f2d68a',
      ['minDamage', 'maxDamage'],
      u.kind === 'creature' ? [`全队 ×${u.count} 基础期望：${s.minDamage * u.count} ~ ${s.maxDamage * u.count}`] : [],
    ),
    mk(
      'hp',
      'hp',
      u.kind === 'hero' ? '英雄生命值' : '单兵生命值',
      `${u.currentHp}/${s.maxHp}`,
      '#84e0a8',
      ['maxHp'],
      u.kind === 'creature'
        ? [`当前堆叠总生命：${(u.count - 1) * s.maxHp + u.currentHp} / ${u.maxCount * s.maxHp}`]
        : [],
    ),
    mk(
      'spd',
      u.abilities.flying ? 'flying' : 'speed',
      u.abilities.flying ? '飞行移动力' : '陆行移动力',
      `${s.speed}`,
      u.abilities.flying ? '#8ae8f0' : '#ebd094',
      ['speed'],
      [u.abilities.flying ? '御空飞行：无视城墙外地形障碍与减速' : '陆地行军：竹林与泥沼等地形将消耗额外移动力'],
    ),
    mk('morale', 'morale', '部队士气', `${s.morale >= 0 ? '+' : ''}${s.morale}`, '#f5dc82', ['morale'], (() => {
      if (isImmuneToMorale(u)) {
        return isUndeadUnit(u)
          ? ['不死生物免疫正负士气波动，同时令同队非死亡系友军士气 -2']
          : ['机械构造体免疫正负士气波动'];
      }
      const r = computeMoraleLuckRates(s.morale, s.luck, store.battleState.balancePreset, false);
      const lines: string[] = [];
      if (u.roundMoraleState === 'good') {
        lines.push('本回合已触发高士气：第一先手梯队，攻击伤害 +25%');
      } else if (u.roundMoraleState === 'bad') {
        lines.push('本回合已触发低士气：最末行动梯队，攻击伤害 -20%');
      }
      if (s.morale > 0) {
        lines.push(`高士气触发率 ${Math.round(r.goodMoraleChance * 100)}%，每回合判定抢占先手梯队且伤害 +25%`);
      } else if (s.morale < 0) {
        lines.push(`低士气触发率 ${Math.round(r.badMoraleChance * 100)}%，每回合判定落入末位梯队且伤害 -20%`);
      } else {
        lines.push('当前士气平稳，按常规主动性排序且无士气伤害修正');
      }
      return lines;
    })()),
    mk('luck', 'luck', '战斗幸运', `${s.luck >= 0 ? '+' : ''}${s.luck}`, '#a6e89b', ['luck'], (() => {
      const r = computeMoraleLuckRates(s.morale, s.luck, store.battleState.balancePreset, isImmuneToMorale(u));
      if (s.luck > 0) {
        return [
          `进攻幸运 ×1.5 暴击率 ${Math.round(r.attackLuckChance * 100)}%`,
          `受击幸运护身 ×0.5 减伤率 ${Math.round(r.defenseLuckChance * 100)}%`,
        ];
      }
      if (s.luck < 0) {
        return [
          `进攻厄运 ×0.5 衰减率 ${Math.round(r.attackBadLuckChance * 100)}%`,
          `受击厄运破防 ×1.25 增伤率 ${Math.round(r.defenseBadLuckChance * 100)}%`,
        ];
      }
      return ['当前幸运平稳，攻防无额外暴击或护身修正'];
    })()),
  ];

  const fpCells = (footprintInfo.value?.cols ?? 1) * (footprintInfo.value?.rows ?? 1);
  const bottom: StatCellItem[] = [
    mk(
      'range',
      'range',
      '远程射程',
      u.abilities.ranged && !u.abilities.noRanged ? `${s.range}` : '—',
      '#94c0ed',
      ['range'],
      u.abilities.noRanged ? ['远程禁手：无法射击'] : !u.abilities.ranged ? ['近战单位，无远程攻击'] : [],
      !u.abilities.ranged || Boolean(u.abilities.noRanged),
    ),
    mk(
      'ammo',
      'ammo',
      u.abilities.ranged && u.abilities.unlimitedShots ? '无限弹药' : '剩余弹药',
      !u.abilities.ranged ? '—' : u.abilities.unlimitedShots ? '∞' : `${u.ammo}/${u.maxAmmo}`,
      u.abilities.ranged && u.abilities.unlimitedShots ? '#dfc4ff' : '#ebd394',
      [],
      !u.abilities.ranged
        ? ['无弹药需求']
        : u.abilities.unlimitedShots
          ? ['无限弹药：远程射击与远程反击永不消耗弹药']
          : u.abilities.noMelee
            ? ['弹药耗尽后因近战禁手将无法发起普通攻击']
            : ['弹药耗尽后仅能转入近战交锋'],
      !u.abilities.ranged,
    ),
    mk('init', 'init', '先手主动', `${s.initiative}`, '#f2cf72', ['initiative']),
    mk(
      'graze',
      'graze',
      '擦弹率',
      `${Math.round(s.grazeChance * 100)}%`,
      '#8ce6ed',
      ['grazeChance'],
      ['受远程/范围弹幕攻击时触发 25% 减伤并反哺灵力与符卡充能'],
    ),
    mk('mres', 'mres', '魔法抗性', `${Math.round(s.magicResistance * 100)}%`, '#cbb0eb', ['magicResistance']),
    u.kind === 'hero'
      ? mk('sp', 'sp', '法术强度', `${s.spellPower}`, '#a0bdf0', ['spellPower'], [`灵力上限 ${s.maxMana} MP`])
      : mk(
          'size',
          'size',
          '占位体积',
          u.footprint.replace('x', '×'),
          '#edc185',
          [],
          [`${footprintInfo.value?.label ?? ''}，占据 ${fpCells} 个六边形格`],
        ),
    u.kind === 'hero'
      ? mk(
          'power',
          'power',
          '火力 P 点',
          `${(u.powerPoints ?? 0).toFixed(1)}`,
          '#eb8d9a',
          [],
          [`上限 ${(u.maxPowerPoints ?? 4).toFixed(1)} P · 每 1.0P 提供 +5% 全伤害`],
        )
      : mk(
          'tier',
          'tier',
          '兵种等阶',
          `T${creatureDef.value?.tier ?? 1}`,
          '#f5dc82',
          [],
          [creatureDef.value?.description ?? '幻想乡量产兵种'],
        ),
  ];

  return { top, bottom };
});

const portraitTooltip = computed<HudTooltipPayload | null>(() => {
  const u = unit.value;
  if (!u) return null;
  if (u.kind === 'creature' && creatureDef.value) {
    const am = alignMeta.value;
    return {
      title: `${u.name} · ${footprintInfo.value?.label ?? ''}`,
      subtitle: am ? `${am.factionName} · ${am.name}` : undefined,
      tag: creatureTierKanji.value,
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
        ...headerCreatureTags.value.map((t) => ({
          label: t.label,
          icon: t.icon,
          color: t.color,
          bg: t.bg,
          border: t.border,
        })),
      ],
      lines: [creatureDef.value.description],
    };
  }
  const cls = store.detailModalAdvancedClass;
  const am = alignMeta.value;
  return {
    title: `Lv.${u.level} ${u.name}`,
    subtitle: cls ? `${u.title} · ${cls.name}` : u.title,
    tag: cls?.name ?? '英雄',
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
    lines: cls ? [cls.description] : ['东方唯一英雄单位，可亲自上场作战、施法与宣言专属符卡。'],
  };
});
</script>

<template>
  <transition name="h4-modal-fade">
    <div
      v-if="store.detailModal && unit && stats"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/68 lg:pr-[96px]"
      @click="closeModal()"
      @contextmenu.prevent.stop="closeModal()"
      @mousemove="moveTip"
    >
      <!-- ==================== 方案 A：极简典藏兵种雕版大窗（升级 20 格法术图标状态矩阵！） ==================== -->
      <section
        v-if="unit.kind === 'creature'"
        class="urushi-frame relative flex w-[588px] max-w-[95vw] flex-col p-4 text-xs select-none"
        @click.stop
        @contextmenu.prevent.stop="closeModal()"
      >
        <OrnamentalFrame variant="corners" />

        <!-- 顶段：切角古金立绘龛 + 落款朱印名匾 + 20 格状态矩阵 (2×10) -->
        <div class="relative z-10 flex items-stretch gap-3.5">
          <div
            class="sacred-mirror-frame relative h-[112px] w-[112px] shrink-0 cursor-help overflow-hidden"
            :style="{ borderColor: unit.side === 'left' ? '#c93848' : '#588fd1' }"
            @mouseenter="portraitTooltip && showTip(portraitTooltip, $event)"
            @mouseleave="hideTip"
          >
            <img
              :src="portraitUrl"
              :alt="unit.name"
              class="pixel-art h-full w-full object-cover transition"
              :class="unit.isIllusion ? 'opacity-72 blur-[0.75px] saturate-125 brightness-110' : ''"
              :style="unit.isIllusion ? { filter: 'blur(0.75px) drop-shadow(0 0 6px rgba(72, 240, 255, 0.7)) hue-rotate(8deg)' } : undefined"
            />
            <span
              class="font-num absolute bottom-0 right-0 border-l border-t border-[#cfa75b]/70 bg-[#120d14]/92 px-1.5 py-0.5 text-[11px] font-bold text-[#f5df9e]"
            >
              ×{{ unit.count }}
            </span>
            <span
              v-if="stats.maxMana > 0"
              class="font-num absolute left-0 top-0 border-b border-r border-[#5c94d4]/70 bg-[#0d192e]/92 px-1.5 py-0.5 text-[9.5px] font-bold text-[#99ccff]"
            >
              {{ unit.mana ?? 0 }}/{{ stats.maxMana }} MP
            </span>
          </div>

          <div class="flex min-w-0 flex-1 flex-col justify-between gap-2">
            <!-- 兵种名匾 -->
            <div class="urushi-plaque flex items-center justify-between gap-2 px-3 py-1.5">
              <div class="flex min-w-0 items-center gap-2">
                <span class="th-hanko shrink-0 px-1.5 py-0.5 text-[9.5px]">{{ factionStamp }}</span>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h2 class="font-display truncate text-[15px] font-black text-[#f5edd8]">
                      {{ unit.name }}
                    </h2>
                    <span
                      class="font-display shrink-0 border border-[#cfa75b]/45 bg-[#18121a] px-1.5 py-0.5 text-[9.5px] text-[#e6cfa0]"
                    >
                      {{ creatureTierKanji }}
                    </span>
                    <span class="font-num shrink-0 text-[10px] text-[#a99b87]">
                      {{ unit.footprint.replace('x', '×') }}
                    </span>
                  </div>
                  <div v-if="alignMeta" class="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span class="flex items-center gap-1 font-semibold">
                      <span
                        class="inline-block h-1.5 w-1.5 rotate-45"
                        :style="{ backgroundColor: alignMeta.themeColor }"
                      />
                      <span :style="{ color: alignMeta.textColor }">
                        {{ alignMeta.factionName }} · {{ alignMeta.name }}
                      </span>
                    </span>
                    <span
                      v-for="ct in headerCreatureTags"
                      :key="ct.id"
                      class="font-display inline-flex items-center gap-0.5 border px-1 py-0 text-[9px] font-semibold leading-tight"
                      :style="{ color: ct.color, backgroundColor: ct.bg, borderColor: ct.border }"
                    >
                      <PixelBadgeIcon :name="ct.icon" size-class="h-2.5 w-2.5 shrink-0" />
                      <span>{{ ct.label }}</span>
                    </span>
                    <span class="font-num text-[9.5px] text-[#9b8c78]">
                      状态 {{ statusBadges.length }}/{{ MAX_UNIT_BUFF_SLOTS }}
                    </span>
                  </div>
                </div>
              </div>

              <button
                class="brass-action-btn flex h-6 w-6 shrink-0 items-center justify-center"
                title="关闭 (Esc)"
                @click="closeModal()"
              >
                <svg viewBox="0 0 12 12" class="h-3 w-3" fill="none">
                  <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="#d9c8a8" stroke-width="1.3" />
                </svg>
              </button>
            </div>

            <!-- 20 格 Buff/Debuff 专属图标矩阵（2×10 雕版微格，FIFO 顶替上限 20！） -->
            <div class="grid grid-cols-10 gap-1">
              <div
                v-for="idx in MAX_UNIT_BUFF_SLOTS"
                :key="idx"
                class="enamel-crest relative flex h-[28px] w-full items-center justify-center border transition"
                :class="statusBadges[idx - 1] ? 'cursor-help hover:scale-105' : ''"
                :style="
                  statusBadges[idx - 1]
                    ? {
                        backgroundColor: statusBadges[idx - 1].bg,
                        borderColor: statusBadges[idx - 1].border,
                      }
                    : {
                        backgroundColor: 'rgba(13, 10, 16, 0.92)',
                        borderColor: 'rgba(153, 118, 58, 0.24)',
                      }
                "
                @mouseenter="statusBadges[idx - 1] && showTip(statusBadges[idx - 1].tooltip, $event)"
                @mouseleave="hideTip"
              >
                <template v-if="statusBadges[idx - 1]">
                  <img
                    v-if="statusBadges[idx - 1].spellIconId"
                    :src="getSpellIconDataUrl(statusBadges[idx - 1].spellIconId!)"
                    :alt="statusBadges[idx - 1].shortLabel"
                    class="pixel-art h-6 w-6"
                  />
                  <PixelBadgeIcon v-else :name="statusBadges[idx - 1].icon" size-class="h-4.5 w-4.5" />
                  <span
                    v-if="statusBadges[idx - 1].roundsBadge"
                    class="font-num absolute bottom-0 right-0 bg-[#0b0910]/90 px-0.5 text-[7.5px] font-bold leading-none text-[#f5df9e]"
                  >
                    {{ statusBadges[idx - 1].roundsBadge }}
                  </span>
                </template>
                <svg v-else viewBox="0 0 12 12" class="h-2 w-2 opacity-18" fill="none">
                  <path d="M6 2V10M2 6H10" stroke="#cfa75b" stroke-width="0.9" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 中段：HoMM4 连体黄铜 2×7 雕刻属性数表 -->
        <div class="brass-ledger relative z-10 mt-3.5 grid grid-cols-7 gap-px">
          <div
            v-for="cell in statRows.top"
            :key="cell.key"
            class="brass-ledger-cell flex cursor-help flex-col items-center justify-center py-2"
            @mouseenter="showTip(cell.tooltip, $event)"
            @mouseleave="hideTip"
          >
            <PixelBadgeIcon :name="cell.icon" size-class="h-5.5 w-5.5" />
            <div class="font-num mt-1 text-[12.5px] font-bold leading-none" :style="{ color: cell.accent }">
              {{ cell.value }}
            </div>
          </div>

          <div
            v-for="cell in statRows.bottom"
            :key="cell.key"
            class="brass-ledger-cell flex cursor-help flex-col items-center justify-center py-2"
            :class="{ 'opacity-40': cell.muted }"
            @mouseenter="showTip(cell.tooltip, $event)"
            @mouseleave="hideTip"
          >
            <PixelBadgeIcon :name="cell.icon" size-class="h-5.5 w-5.5" />
            <div
              class="font-num mt-1 text-[12px] font-bold leading-none"
              :style="{ color: cell.muted ? '#75685a' : cell.accent }"
            >
              {{ cell.value }}
            </div>
          </div>
        </div>

        <!-- 底段：七宝烧特技槽 + 翡翠玉玺确认键 -->
        <div class="relative z-10 mt-3.5 flex items-center justify-between gap-3">
          <div class="washi-recess flex min-h-[44px] flex-1 items-center px-2.5 py-1.5">
            <div v-if="specialtyBadges.length > 0" class="flex flex-wrap items-center gap-1.5">
              <div
                v-for="badge in specialtyBadges"
                :key="badge.id"
                class="enamel-crest relative flex h-10 w-10 cursor-help flex-col items-center justify-center overflow-hidden border transition hover:-translate-y-0.5"
                :style="{ backgroundColor: badge.bg, borderColor: badge.border }"
                @mouseenter="showTip(badge.tooltip, $event)"
                @mouseleave="hideTip"
              >
                <PixelBadgeIcon :name="badge.icon" size-class="h-5 w-5" />
                <span class="font-display mt-0.5 text-[8.5px] leading-none" :style="{ color: badge.accent }">
                  {{ badge.shortLabel }}
                </span>
                <span
                  v-if="badge.polarity === 'negative'"
                  class="absolute inset-x-0 bottom-0 h-[2px] bg-[#ff5c72]"
                />
              </div>
            </div>
            <div v-else class="font-display text-[11px] text-[#6d6052]">无固有兵种特技</div>
          </div>

          <button
            class="jade-seal-btn flex h-11 w-12 shrink-0 items-center justify-center"
            title="确认 (Esc)"
            @click="closeModal()"
          >
            <svg viewBox="0 0 18 18" class="h-5 w-5" fill="none">
              <path
                d="M3.5 9.5L7.5 13.5L14.5 4.8"
                stroke="#e8fff3"
                stroke-width="2.1"
                stroke-linecap="square"
              />
            </svg>
          </button>
        </div>
      </section>

      <!-- ==================== 方案 B：高密度专属英雄指挥官档案（Hero Dossier） ==================== -->
      <section
        v-else
        class="urushi-frame relative flex max-h-[92vh] w-[886px] max-w-[96vw] flex-col overflow-hidden p-4 text-xs select-none"
        @click.stop
        @contextmenu.prevent.stop="closeModal()"
      >
        <OrnamentalFrame variant="corners" />

        <!-- 顶段：指挥官御览横匾 + 可交互「37 进阶职业自由切换签」 -->
        <div class="urushi-plaque relative z-20 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="th-hanko px-1.5 py-0.5 text-[10px]">{{ factionStamp }}</span>
            <span
              class="font-num border border-[#cfa75b]/60 bg-[#1a1316] px-2 py-0.5 text-[11.5px] font-bold text-[#f5df9e]"
            >
              Lv.{{ unit.level }}
            </span>
            <h2 class="font-display text-[17px] font-black tracking-wider text-[#f5edd8]">
              {{ unit.name }}
            </h2>

            <!-- H4 37 种进阶组合职业切换签（战斗场景外可自由切换至任意已满足条件的职业！） -->
            <button
              v-if="store.detailModalAdvancedClass"
              class="font-display flex items-center gap-1.5 border px-2.5 py-0.5 text-[11px] transition"
              :class="
                showClassPicker
                  ? 'border-[#f5df9e] bg-[#2a3b52] text-[#fff2c2]'
                  : 'border-[#6ca6e8]/55 bg-[#152233] text-[#bddcf7] hover:border-[#a6d4ff]'
              "
              @click="showClassPicker = !showClassPicker"
              @mouseenter="
                showTip(
                  buildClassTooltip(store.detailModalAdvancedClass, {
                    subtitle: store.canModifyHeroBuild
                      ? `战前整备中 · 点击于 ${store.detailModalEligibleClasses.length} 种已达标进阶职业间切换`
                      : `战斗中职业已锁定 · 已达标 ${store.detailModalEligibleClasses.length} 职，可退回战前整备切职`,
                    tag: store.canModifyHeroBuild ? '点击切换职业' : '战斗锁定',
                    tagTone: store.canModifyHeroBuild ? 'default' : 'muted',
                    accent: '#a6d4ff',
                  }),
                  $event,
                )
              "
              @mouseleave="hideTip"
            >
              <span class="h-1.5 w-1.5 rotate-45 bg-[#8cc8ff]" />
              <span>{{ store.detailModalAdvancedClass.name }}</span>
              <span class="font-num text-[9.5px] text-[#8cc8ff]">
                ({{ store.detailModalEligibleClasses.length }}职{{ showClassPicker ? '▴' : '▾' }})
              </span>
            </button>

            <span
              v-if="alignMeta"
              class="font-display inline-flex items-center gap-1 text-[10.5px] font-semibold"
              :style="{ color: alignMeta.textColor }"
            >
              <span class="inline-block h-1.5 w-1.5 rotate-45" :style="{ backgroundColor: alignMeta.themeColor }" />
              <span>{{ alignMeta.factionName }} · {{ alignMeta.name }}</span>
            </span>
          </div>

          <div class="flex items-center gap-2">
            <!-- 战前整备状态指示 / 一键退回战前整备切职调点 -->
            <span
              v-if="store.canModifyHeroBuild"
              class="font-display border border-[#56ab80]/60 bg-[#122e24] px-2 py-0.5 text-[10px] text-[#8cf0ba]"
            >
              战前整备 · 自由切职配点中
            </span>
            <button
              v-else
              class="font-display border border-[#cfa75b]/60 bg-[#2a1d14] px-2 py-0.5 text-[10px] text-[#f5df9e] transition hover:border-[#fff0b8] hover:bg-[#3d291c]"
              title="保留当前英雄技能配点，退回第 1 回合战前整备室以自由切换进阶职业与加点"
              @click="store.returnToPreBattlePrep(unit.id)"
            >
              回战前整备切职
            </button>

            <button
              class="brass-action-btn flex h-6 w-6 shrink-0 items-center justify-center"
              title="关闭 (Esc)"
              @click="closeModal()"
            >
              <svg viewBox="0 0 12 12" class="h-3 w-3" fill="none">
                <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="#d9c8a8" stroke-width="1.3" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 折叠式「进阶组合职业自由切换谱」（展示全部已解锁可切职业 + 其余 37 职业配方） -->
        <div
          v-if="showClassPicker"
          class="washi-recess relative z-20 mt-2 max-h-[210px] overflow-y-auto border border-[#6ca6e8]/55 bg-[#101724]/98 p-2.5"
        >
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#6ca6e8]/30 pb-1.5">
            <div class="flex items-center gap-2">
              <span class="font-display text-[11px] font-bold text-[#a6d4ff]">
                进阶组合职业切换谱 · 已达标 {{ store.detailModalEligibleClasses.length }} / 37 职
              </span>
              <span v-if="!store.canModifyHeroBuild" class="text-[10px] text-[#e69a8a]">
                （战斗进行中不可切换，点击右上「回战前整备切职」即可保留配点自由切换）
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                v-if="store.canModifyHeroBuild && unit.selectedAdvancedClassId"
                class="font-display border border-[#99763a]/55 bg-[#1b151e] px-2 py-0.5 text-[9.5px] text-[#e6cfa0] hover:border-[#f5df9e]"
                @click="handlePickClass(null)"
              >
                恢复自动判定
              </button>
              <button
                class="font-display border border-[#6ca6e8]/45 bg-[#142236] px-2 py-0.5 text-[9.5px] text-[#a6d4ff] hover:border-[#a6d4ff]"
                @click="showLockedClasses = !showLockedClasses"
              >
                {{ showLockedClasses ? '隐藏未解锁' : `查看未解锁 (${lockedAdvancedClasses.length})` }}
              </button>
            </div>
          </div>

          <!-- 已达标职业网格 -->
          <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
            <button
              v-for="cls in store.detailModalEligibleClasses"
              :key="cls.id"
              class="flex flex-col items-start border px-2 py-1.5 text-left transition"
              :class="[
                store.detailModalAdvancedClass?.id === cls.id
                  ? 'border-[#f5df9e] bg-[#2a2216] shadow-[0_0_8px_rgba(245,223,158,0.28)]'
                  : store.canModifyHeroBuild
                    ? 'border-[#6ca6e8]/40 bg-[#152033] hover:border-[#a6d4ff] hover:bg-[#1c2c45]'
                    : 'cursor-not-allowed border-[#6ca6e8]/25 bg-[#131b29] opacity-75',
              ]"
              @click="store.canModifyHeroBuild && handlePickClass(cls.id)"
              @mouseenter="
                showTip(
                  buildClassTooltip(cls, {
                    subtitle: `组合条件：${formatClassRequirement(cls)}`,
                    tag: store.detailModalAdvancedClass?.id === cls.id ? '当前生效' : store.canModifyHeroBuild ? '点击切换' : '战中锁定',
                    tagTone: store.detailModalAdvancedClass?.id === cls.id || store.canModifyHeroBuild ? 'default' : 'muted',
                    accent: '#f5df9e',
                  }),
                  $event,
                )
              "
              @mouseleave="hideTip"
            >
              <div class="flex w-full items-center justify-between gap-1">
                <span class="font-display truncate text-[10.5px] font-bold text-[#f5edd8]">{{ cls.name }}</span>
                <span
                  v-if="store.detailModalAdvancedClass?.id === cls.id"
                  class="shrink-0 bg-[#cfa75b] px-1 text-[8px] font-bold text-[#140e08]"
                >
                  当前
                </span>
              </div>
              <div class="mt-0.5 truncate text-[9px] text-[#8cc8ff]">
                {{ formatClassRequirement(cls) }}
              </div>
            </button>
          </div>

          <!-- 可选展开未解锁职业图鉴 -->
          <div v-if="showLockedClasses && lockedAdvancedClasses.length > 0" class="mt-2 border-t border-[#99763a]/25 pt-2">
            <div class="mb-1 text-[9.5px] text-[#8d7f6e]">未达标进阶职业（提升对应两系主/子技能即可解锁）：</div>
            <div class="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
              <div
                v-for="cls in lockedAdvancedClasses"
                :key="cls.id"
                class="cursor-help border border-[#5e5245]/35 bg-[#121018]/80 px-2 py-1 opacity-60 hover:opacity-95"
                @mouseenter="
                  showTip(
                    buildClassTooltip(cls, {
                      subtitle: `解锁条件：${formatClassRequirement(cls)} · 每系主子总投入 ≥ 2`,
                      tag: '未达标',
                      tagTone: 'muted',
                      accent: '#a99b87',
                    }),
                    $event,
                  )
                "
                @mouseleave="hideTip"
              >
                <div class="font-display truncate text-[10px] text-[#c7b9a5]">{{ cls.name }}</div>
                <div class="truncate text-[8.5px] text-[#8a7d6d]">{{ formatClassRequirement(cls) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 主体双栏：左「指挥官肖像与十字神器阵图」 / 右「属性数表 + 20 格状态槽 + 36 技能树」 -->
        <div class="relative z-10 mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-[224px_1fr]">
          <!-- 左栏 -->
          <div class="washi-recess flex flex-col justify-between gap-2.5 p-3">
            <div class="flex flex-col items-center">
              <div class="relative flex items-center justify-center">
                <svg viewBox="0 0 164 164" class="pointer-events-none absolute h-[156px] w-[156px] opacity-25" fill="none">
                  <circle cx="82" cy="82" r="78" stroke="#cfa75b" stroke-width="0.7" stroke-dasharray="3 3" />
                  <path d="M82 4L89 18L82 32L75 18Z" fill="#cfa75b" fill-opacity="0.35" />
                </svg>

                <div
                  class="sacred-mirror-frame relative h-[136px] w-[136px] cursor-help overflow-hidden"
                  :style="{ borderColor: unit.side === 'left' ? '#c93848' : '#588fd1' }"
                  @mouseenter="portraitTooltip && showTip(portraitTooltip, $event)"
                  @mouseleave="hideTip"
                >
                  <img
              :src="portraitUrl"
              :alt="unit.name"
              class="pixel-art h-full w-full object-cover transition"
              :class="unit.isIllusion ? 'opacity-72 blur-[0.75px] saturate-125 brightness-110' : ''"
              :style="unit.isIllusion ? { filter: 'blur(0.75px) drop-shadow(0 0 6px rgba(72, 240, 255, 0.7)) hue-rotate(8deg)' } : undefined"
            />
                  <span
                    v-if="unit.status === 'knocked_out'"
                    class="font-display absolute inset-x-0 bottom-0 bg-[#54141e]/92 py-0.5 text-center text-[10px] font-bold text-[#f7c1c9]"
                  >
                    重伤倒地
                  </span>
                </div>
              </div>

              <!-- 标尺式 HP / MP / P点 / 符卡充能 -->
              <div class="mt-2.5 w-full space-y-1.5 text-[10px]">
                <div>
                  <div class="font-num flex justify-between text-[#a0e6be]">
                    <span class="tracking-widest">HP</span>
                    <span>{{ unit.currentHp }} / {{ stats.maxHp }}</span>
                  </div>
                  <div class="relative mt-0.5 h-1.5 w-full bg-[#09070b] ring-1 ring-[#99763a]/40">
                    <div
                      class="h-full bg-gradient-to-r from-[#287a52] to-[#74db9f]"
                      :style="{ width: `${Math.min(100, Math.round((unit.currentHp / Math.max(1, stats.maxHp)) * 100))}%` }"
                    />
                  </div>
                </div>

                <div>
                  <div class="font-num flex justify-between text-[#a3c7f0]">
                    <span class="tracking-widest">MP</span>
                    <span>{{ unit.mana ?? 0 }} / {{ stats.maxMana }}</span>
                  </div>
                  <div class="relative mt-0.5 h-1.5 w-full bg-[#09070b] ring-1 ring-[#99763a]/40">
                    <div
                      class="h-full bg-gradient-to-r from-[#3465ad] to-[#86bdf2]"
                      :style="{ width: `${Math.min(100, Math.round(((unit.mana ?? 0) / Math.max(1, stats.maxMana)) * 100))}%` }"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-1.5 pt-0.5">
                  <div class="border border-[#99763a]/35 bg-[#120e15] px-2 py-1 text-center font-num">
                    <span class="text-[#d97784]">P </span>
                    <strong class="text-[#f5df9e]">{{ (unit.powerPoints ?? 0).toFixed(1) }}</strong>
                  </div>
                  <div class="border border-[#99763a]/35 bg-[#120e15] px-2 py-1 text-center font-num">
                    <span class="text-[#cfa75b]">符 </span>
                    <strong class="text-[#f5df9e]">{{ unit.spellCardCharge ?? 0 }}%</strong>
                  </div>
                </div>
              </div>
            </div>

            <OrnamentalFrame variant="divider" />

            <!-- 十字星阵 5 格神器纸娃娃 -->
            <div>
              <div class="mb-1.5 flex items-center justify-between">
                <span class="font-display text-[10.5px] text-[#cabba2]">神器阵位</span>
                <span
                  v-for="setDef in store.detailModalArtifactSets"
                  :key="setDef.id"
                  class="font-display cursor-help border border-[#72c4d9]/60 bg-[#142d38] px-1.5 py-0.5 text-[9px] text-[#a6f0ff]"
                  @mouseenter="
                    showTip(
                      {
                        title: `套装共鸣 · ${setDef.name}`,
                        tag: '组合套装激活',
                        accent: '#9cf2ff',
                        badges: [
                          {
                            label: '套装共鸣',
                            icon: SPELL_POLARITY_META.buff.icon,
                            color: '#a6f0ff',
                            bg: 'rgba(18, 42, 54, 0.92)',
                            border: '#5fa8c4',
                          },
                        ],
                        lines: [setDef.description],
                      },
                      $event,
                    )
                  "
                  @mouseleave="hideTip"
                >
                  共鸣生效
                </span>
              </div>

              <div class="relative mx-auto flex h-[118px] w-[148px] flex-col items-center justify-between py-0.5">
                <svg viewBox="0 0 156 126" class="pointer-events-none absolute inset-0 h-full w-full" fill="none">
                  <line x1="78" y1="20" x2="78" y2="106" stroke="#99763a" stroke-opacity="0.55" stroke-width="1" />
                  <line x1="26" y1="63" x2="130" y2="63" stroke="#99763a" stroke-opacity="0.55" stroke-width="1" />
                  <path d="M78 26L116 63L78 100L40 63Z" stroke="#cfa75b" stroke-opacity="0.22" stroke-width="0.8" />
                </svg>

                <div
                  v-if="equipSlotMap.head"
                  class="enamel-crest relative z-10 flex h-8.5 w-8.5 cursor-help items-center justify-center border transition hover:scale-105"
                  :class="equipSlotMap.head.artifact ? 'border-[#cfa75b] bg-[#2a1f28]' : 'border-[#99763a]/28 bg-[#0f0c12] opacity-40'"
                  @mouseenter="showTip(equipSlotMap.head.tooltip, $event)"
                  @mouseleave="hideTip"
                >
                  <PixelBadgeIcon :name="equipSlotMap.head.icon" size-class="h-4.5 w-4.5" />
                </div>

                <div class="relative z-10 flex w-full items-center justify-between px-2">
                  <div
                    v-for="slotKey in (['weapon', 'armor', 'accessory'] as const)"
                    :key="slotKey"
                    class="enamel-crest flex h-8.5 w-8.5 cursor-help items-center justify-center border transition hover:scale-105"
                    :class="equipSlotMap[slotKey]?.artifact ? 'border-[#cfa75b] bg-[#2a1f28]' : 'border-[#99763a]/28 bg-[#0f0c12] opacity-40'"
                    @mouseenter="equipSlotMap[slotKey] && showTip(equipSlotMap[slotKey]!.tooltip, $event)"
                    @mouseleave="hideTip"
                  >
                    <PixelBadgeIcon v-if="equipSlotMap[slotKey]" :name="equipSlotMap[slotKey]!.icon" size-class="h-4.5 w-4.5" />
                  </div>
                </div>

                <div
                  v-if="equipSlotMap.ring"
                  class="enamel-crest relative z-10 flex h-8.5 w-8.5 cursor-help items-center justify-center border transition hover:scale-105"
                  :class="equipSlotMap.ring.artifact ? 'border-[#cfa75b] bg-[#2a1f28]' : 'border-[#99763a]/28 bg-[#0f0c12] opacity-40'"
                  @mouseenter="showTip(equipSlotMap.ring.tooltip, $event)"
                  @mouseleave="hideTip"
                >
                  <PixelBadgeIcon :name="equipSlotMap.ring.icon" size-class="h-4.5 w-4.5" />
                </div>
              </div>
            </div>
          </div>

          <!-- 右栏：属性数表 + 20 格独立状态槽 + 完整 9×3=36 技能树 + 底段军备轨 -->
          <div class="flex min-h-0 flex-col justify-between gap-2">
            <!-- 1. 英雄 2×7 连体黄铜属性数表 -->
            <div class="brass-ledger grid grid-cols-7 gap-px">
              <div
                v-for="cell in statRows.top"
                :key="cell.key"
                class="brass-ledger-cell flex cursor-help flex-col items-center justify-center py-1.5"
                @mouseenter="showTip(cell.tooltip, $event)"
                @mouseleave="hideTip"
              >
                <PixelBadgeIcon :name="cell.icon" size-class="h-4.5 w-4.5" />
                <div class="font-num mt-0.5 text-[11.5px] font-bold leading-none" :style="{ color: cell.accent }">
                  {{ cell.value }}
                </div>
              </div>
              <div
                v-for="cell in statRows.bottom"
                :key="cell.key"
                class="brass-ledger-cell flex cursor-help flex-col items-center justify-center py-1.5"
                :class="{ 'opacity-40': cell.muted }"
                @mouseenter="showTip(cell.tooltip, $event)"
                @mouseleave="hideTip"
              >
                <PixelBadgeIcon :name="cell.icon" size-class="h-4.5 w-4.5" />
                <div
                  class="font-num mt-0.5 text-[11px] font-bold leading-none"
                  :style="{ color: cell.muted ? '#75685a' : cell.accent }"
                >
                  {{ cell.value }}
                </div>
              </div>
            </div>

            <!-- 2. 特质特技条 + 独立 20 格 Buff/Debuff 状态矩阵（2×10） -->
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-[200px_1fr]">
              <!-- 特质与派生特技 -->
              <div class="washi-recess p-2">
                <div class="font-display mb-1.5 flex items-center justify-between border-b border-[#99763a]/30 pb-1 text-[10px] text-[#d9be86]">
                  <span>固有特质 · 特技</span>
                  <span class="font-num text-[9px] text-[#7e7060]">{{ traitBadges.length + specialtyBadges.length }}</span>
                </div>
                <div class="flex flex-wrap gap-1">
                  <div
                    v-for="tr in traitBadges"
                    :key="tr.id"
                    class="enamel-crest flex h-8 w-8 cursor-help flex-col items-center justify-center border shadow-[0_0_8px_rgba(207,167,91,0.28)]"
                    :style="{ backgroundColor: tr.bg, borderColor: tr.border }"
                    @mouseenter="showTip(tr.tooltip, $event)"
                    @mouseleave="hideTip"
                  >
                    <PixelBadgeIcon :name="tr.icon" size-class="h-4.5 w-4.5" />
                  </div>
                  <div
                    v-for="sp in specialtyBadges"
                    :key="sp.id"
                    class="enamel-crest flex h-8 w-8 cursor-help flex-col items-center justify-center border"
                    :style="{ backgroundColor: sp.bg, borderColor: sp.border }"
                    @mouseenter="showTip(sp.tooltip, $event)"
                    @mouseleave="hideTip"
                  >
                    <PixelBadgeIcon :name="sp.icon" size-class="h-4 w-4" />
                    <span class="font-display text-[7px] leading-none" :style="{ color: sp.accent }">
                      {{ sp.shortLabel }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 20 格 Buff/Debuff 状态矩阵（2×10，直接渲染 24×24 法术专属像素图标！） -->
              <div class="washi-recess p-2">
                <div class="font-display mb-1.5 flex items-center justify-between border-b border-[#99763a]/30 pb-1 text-[10px] text-[#9be8be]">
                  <span>实时状态栏</span>
                  <span class="font-num text-[9px] text-[#8d7f6e]">
                    {{ statusBadges.length }} / {{ MAX_UNIT_BUFF_SLOTS }}
                  </span>
                </div>
                <div class="grid grid-cols-10 gap-1">
                  <div
                    v-for="idx in MAX_UNIT_BUFF_SLOTS"
                    :key="idx"
                    class="enamel-crest relative flex h-[27px] w-full items-center justify-center border transition"
                    :class="statusBadges[idx - 1] ? 'cursor-help hover:scale-105' : ''"
                    :style="
                      statusBadges[idx - 1]
                        ? {
                            backgroundColor: statusBadges[idx - 1].bg,
                            borderColor: statusBadges[idx - 1].border,
                          }
                        : {
                            backgroundColor: 'rgba(13, 10, 16, 0.92)',
                            borderColor: 'rgba(153, 118, 58, 0.22)',
                          }
                    "
                    @mouseenter="statusBadges[idx - 1] && showTip(statusBadges[idx - 1].tooltip, $event)"
                    @mouseleave="hideTip"
                  >
                    <template v-if="statusBadges[idx - 1]">
                      <img
                        v-if="statusBadges[idx - 1].spellIconId"
                        :src="getSpellIconDataUrl(statusBadges[idx - 1].spellIconId!)"
                        :alt="statusBadges[idx - 1].shortLabel"
                        class="pixel-art h-6 w-6"
                      />
                      <PixelBadgeIcon v-else :name="statusBadges[idx - 1].icon" size-class="h-4.5 w-4.5" />
                      <span
                        v-if="statusBadges[idx - 1].roundsBadge"
                        class="font-num absolute bottom-0 right-0 bg-[#0b0910]/90 px-0.5 text-[7.5px] font-bold leading-none text-[#f5df9e]"
                      >
                        {{ statusBadges[idx - 1].roundsBadge }}
                      </span>
                    </template>
                    <svg v-else viewBox="0 0 12 12" class="h-2 w-2 opacity-18" fill="none">
                      <path d="M6 2V10M2 6H10" stroke="#cfa75b" stroke-width="0.9" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. H4 完整 9 大主技能 × 3 子技能 = 36 技能树（支持战前沙盒实时加点调配！） -->
            <div class="washi-recess flex min-h-0 flex-1 flex-col p-2.5">
              <div class="mb-2 flex items-center justify-between border-b border-[#99763a]/30 pb-1">
                <div class="flex items-center gap-2">
                  <span class="font-display text-[10.5px] text-[#a3c7f0]">
                    九系技能树 · 主技能与 27 项二级专精
                  </span>
                  <span class="font-num text-[9px] text-[#7e7060]">
                    {{ heroSkillTrees.length }} 系展示
                  </span>
                </div>
                <button
                  class="font-display border px-2 py-0.5 text-[9.5px] transition"
                  :class="
                    skillEditMode
                      ? 'border-[#f5df9e] bg-[#3b2a14] text-[#fff2bd]'
                      : 'border-[#99763a]/55 bg-[#1a141c] text-[#e6cfa0] hover:border-[#f5df9e]'
                  "
                  @click="handleToggleEditMode"
                >
                  {{ skillEditMode ? '完成配点' : store.canModifyHeroBuild ? '沙盒配点 · 36 技' : '回整备配点' }}
                </button>
              </div>

              <div class="grid max-h-[205px] grid-cols-1 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="tree in heroSkillTrees"
                  :key="tree.id"
                  class="flex flex-col border bg-[#151018] p-1.5 transition"
                  :class="tree.rank > 0 ? 'border-[#99763a]/45' : 'border-[#544638]/30 opacity-70'"
                >
                  <!-- 主技能顶行 -->
                  <div
                    class="flex cursor-help items-center justify-between gap-1"
                    @mouseenter="showTip(tree.tooltip, $event)"
                    @mouseleave="hideTip"
                  >
                    <div class="flex min-w-0 items-center gap-1.5">
                      <PixelBadgeIcon :name="tree.icon" size-class="h-4.5 w-4.5 shrink-0" />
                      <div class="min-w-0">
                        <div class="flex items-center gap-1">
                          <span class="font-display truncate text-[10.5px] font-bold" :style="{ color: tree.color }">
                            {{ tree.short }}
                          </span>
                          <span class="font-num text-[8.5px] text-[#8d7f6e]">总{{ tree.total }}</span>
                        </div>
                        <div class="mt-0.5 flex items-center gap-0.5">
                          <span
                            v-for="pip in 5"
                            :key="pip"
                            class="inline-block h-1.5 w-1.5 rotate-45 border"
                            :class="
                              pip <= tree.rank
                                ? 'border-[#f5df9e] bg-[#cfa75b]'
                                : 'border-[#57462d] bg-transparent'
                            "
                          />
                        </div>
                      </div>
                    </div>

                    <!-- 主技能沙盒调点按钮 -->
                    <div v-if="skillEditMode" class="flex shrink-0 items-center gap-0.5">
                      <button
                        class="font-num flex h-4.5 w-4.5 items-center justify-center border border-[#99763a]/55 bg-[#1f1822] text-[10px] text-[#e6cfa0] hover:border-[#f5df9e] disabled:opacity-25"
                        :disabled="tree.rank <= 0"
                        @click.stop="handleStepPrimary(tree.id, -1)"
                      >
                        -
                      </button>
                      <button
                        class="font-num flex h-4.5 w-4.5 items-center justify-center border border-[#99763a]/55 bg-[#291e14] text-[10px] text-[#f5df9e] hover:border-[#fff0b8] disabled:opacity-25"
                        :disabled="tree.rank >= 5"
                        @click.stop="handleStepPrimary(tree.id, 1)"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <!-- 下属 3 项二级子技能 -->
                  <div class="mt-1.5 space-y-1 border-t border-[#99763a]/20 pt-1">
                    <div
                      v-for="sub in tree.subItems"
                      :key="sub.id"
                      class="flex cursor-help items-center justify-between gap-1 text-[9.5px]"
                      :class="sub.locked ? 'opacity-38' : ''"
                      @mouseenter="showTip(sub.tooltip, $event)"
                      @mouseleave="hideTip"
                    >
                      <div class="flex min-w-0 items-center gap-1">
                        <span class="font-display w-[26px] shrink-0 truncate text-[#d8cbb8]">{{ sub.short }}</span>
                        <div class="flex items-center gap-0.5">
                          <span
                            v-for="p in 5"
                            :key="p"
                            class="inline-block h-1.5 w-2 rounded-[1px]"
                            :class="p <= sub.rank ? 'bg-[#86c9a5]' : 'bg-[#2a2430]'"
                          />
                        </div>
                      </div>

                      <div v-if="skillEditMode" class="flex shrink-0 items-center gap-0.5">
                        <button
                          class="font-num flex h-4 w-4 items-center justify-center border border-[#786858]/45 bg-[#18141c] text-[9px] text-[#cabba2] hover:border-[#f5df9e] disabled:opacity-20"
                          :disabled="sub.rank <= 0"
                          @click.stop="handleStepSubSkill(sub.id, -1)"
                        >
                          -
                        </button>
                        <button
                          class="font-num flex h-4 w-4 items-center justify-center border border-[#56ab80]/55 bg-[#122620] text-[9px] text-[#8cf0ba] hover:border-[#b8ffd6] disabled:opacity-20"
                          :disabled="!sub.canInc"
                          :title="sub.incReason"
                          @click.stop="handleStepSubSkill(sub.id, 1)"
                        >
                          +
                        </button>
                      </div>
                      <span v-else class="font-num text-[8.5px] text-[#9b8c78]">{{ sub.rank }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. 底段快捷军备轨（符卡 + 术式印 + 秘药 + 翡翠玉玺确认键） -->
            <div class="flex items-end gap-2.5">
              <div class="washi-recess flex flex-1 flex-wrap items-center justify-between gap-2 px-2.5 py-1.5">
                <div class="flex items-center gap-1.5">
                  <div
                    v-if="heroSignatureCard"
                    class="enamel-crest flex h-8.5 w-8.5 cursor-help items-center justify-center border border-[#f5df9e] bg-gradient-to-br from-[#5c1a2a] to-[#302014] shadow-[0_0_10px_rgba(240,195,74,0.3)]"
                    @mouseenter="showTip(heroSignatureCard.tooltip, $event)"
                    @mouseleave="hideTip"
                  >
                    <PixelBadgeIcon name="spell_card" size-class="h-4.5 w-4.5" />
                  </div>
                  <div
                    v-if="heroKnownSpells.length > 6 && heroSpellSummaryTooltip"
                    class="enamel-crest flex h-8.5 cursor-help items-center gap-1.5 border border-[#cfa75b] bg-gradient-to-r from-[#2c1b28] via-[#1c1a2e] to-[#1a2b24] px-2.5"
                    @mouseenter="showTip(heroSpellSummaryTooltip, $event)"
                    @mouseleave="hideTip"
                  >
                    <PixelBadgeIcon name="spell_orb" size-class="h-4.5 w-4.5" />
                    <div class="leading-tight">
                      <div class="font-display text-[9.5px] font-bold text-[#f5df9e]">万象魔导总录</div>
                      <div class="font-num text-[8.5px] text-[#9bc4ed]">已习得 {{ heroKnownSpells.length }} 术</div>
                    </div>
                  </div>
                  <template v-else>
                    <div
                      v-for="sp in heroKnownSpells"
                      :key="sp.id"
                      class="enamel-crest relative flex h-8.5 w-8.5 cursor-help items-center justify-center border bg-[#16121b]"
                      :style="{ borderColor: `${sp.color}88` }"
                      @mouseenter="showTip(sp.tooltip, $event)"
                      @mouseleave="hideTip"
                    >
                      <img :src="getSpellIconDataUrl(sp.id)" :alt="sp.name" class="pixel-art h-6 w-6" />
                      <span class="font-num absolute bottom-0 right-0.5 text-[8px] font-bold text-[#9bc4ed]">
                        {{ sp.manaCost }}
                      </span>
                    </div>
                  </template>
                </div>

                <!-- 秘药槽 -->
                <div class="flex items-center gap-1.5 border-l border-[#99763a]/35 pl-2.5">
                  <div
                    v-for="pot in heroPotions"
                    :key="pot.id"
                    class="enamel-crest relative flex h-8.5 w-8.5 cursor-help items-center justify-center border bg-[#121c18]"
                    :class="pot.charges > 0 ? 'border-[#52b386]/70' : 'border-[#99763a]/25 opacity-35'"
                    @mouseenter="showTip(pot.tooltip, $event)"
                    @mouseleave="hideTip"
                  >
                    <PixelBadgeIcon :name="pot.icon" size-class="h-4.5 w-4.5" />
                    <span class="font-num absolute right-0.5 top-0 text-[8px] font-bold text-[#a8f0c8]">
                      {{ pot.charges }}
                    </span>
                  </div>
                </div>
              </div>

              <button
                class="jade-seal-btn flex h-10 w-12 shrink-0 items-center justify-center"
                :title="store.isPreBattlePrep ? '确认整备并开战 (Esc)' : '确认 (Esc)'"
                @click="closeModal()"
              >
                <svg viewBox="0 0 18 18" class="h-5 w-5" fill="none">
                  <path
                    d="M3.5 9.5L7.5 13.5L14.5 4.8"
                    stroke="#e8fff3"
                    stroke-width="2.1"
                    stroke-linecap="square"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <HudHoverTooltip :payload="hoverTip" :x="tipPos.x" :y="tipPos.y" />
    </div>
  </transition>
</template>

<style scoped>
.h4-modal-fade-enter-active,
.h4-modal-fade-leave-active {
  transition: opacity 0.14s ease, transform 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}
.h4-modal-fade-enter-from,
.h4-modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>

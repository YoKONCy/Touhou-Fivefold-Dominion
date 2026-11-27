<script setup lang="ts">
/**
 * 和风线装万象魔导折本居中大 HUD（纯代码合成双页摊开古书）
 * - 完整承载 HoMM4 全部 142 个五系法术（32生命 + 27秩序 + 25死亡 + 27混沌 + 31自然）
 * - 顶部悬垂五系燕尾丝绸书签（实时显示各系习得术数） + 右页等阶快捷筛选（全阶 / 壱~伍阶）
 * - 左页展示施法者铜镜、五系魔导造诣印记（灵梦五系宗师 V 阶全满！）与专属符卡御札
 * - 右页为 4 列独立滚动雕版术式封印阵，实时计算动态耗蓝（魔力涌动/魔力枯竭），Hover 展全详述
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { soundEngine } from '@audio/index';
import { ALIGNMENT_META, type Alignment } from '@core/alignment';
import { getEffectiveSpellManaCost, getEffectiveSpellRange } from '@core/combatEngine';
import { computeUnitStats } from '@core/modifiers';
import type { PrimarySkillId, SkillRank, SpellDef } from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { getSpellIconDataUrl } from '@renderer/spellIcons';
import { getVoxelPortraitFrames } from '@renderer/voxelSprites';
import { useBattleStore } from '@ui/battleStore';
import HudHoverTooltip from '@ui/components/HudHoverTooltip.vue';
import OrnamentalFrame from '@ui/components/OrnamentalFrame.vue';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import RichSemanticText from '@ui/components/RichSemanticText.vue';
import { useViewportInput } from '@ui/composables/useViewportInput';
import {
  buildSpellCardTooltipPayload,
  buildSpellTooltipPayload,
  getSkillRankLabel,
  type HudTooltipPayload,
} from '@ui/hudMetadata';
import {
  ALL_SPELL_POLARITIES,
  classifySpellPolarity,
  SPELL_POLARITY_META,
  type SpellPolarityKind,
} from '@ui/semanticFormat';

type MagicSchool = Exclude<Alignment, 'might'>;

const store = useBattleStore();
const { isTouchMode, isCompactLandscape, isTinyHeight, sidebarWidthPx } = useViewportInput();
const schoolFilter = ref<'all' | MagicSchool>('all');
const levelFilter = ref<0 | 1 | 2 | 3 | 4 | 5>(0);
const polarityFilter = ref<'all' | SpellPolarityKind>('all');
const animFrameIdx = ref(0);
let animTimer: number | null = null;

const hoverTip = ref<HudTooltipPayload | null>(null);
const tipPos = ref({ x: 0, y: 0 });
const tipPinned = ref(false);
/** 触控端二段预览：首触展示内嵌术式/符卡详述条，再触或点击确认按钮施放 */
const previewedSpellId = ref<string | null>(null);
const previewedSpellCard = ref(false);

const LEVEL_KANJI = ['全', '壱', '弐', '参', '肆', '伍'];
const ROMAN_RANK = ['—', 'I', 'II', 'III', 'IV', 'V'];
const SCHOOL_ORDER: Record<Alignment, number> = {
  life: 0,
  order: 1,
  death: 2,
  chaos: 3,
  nature: 4,
  might: 5,
};

function showTip(payload: HudTooltipPayload, e: MouseEvent): void {
  if (isTouchMode.value) return;
  tipPinned.value = false;
  hoverTip.value = payload;
  tipPos.value = { x: e.clientX, y: e.clientY };
}

function moveTip(e: MouseEvent): void {
  if (tipPinned.value || !hoverTip.value) return;
  tipPos.value = { x: e.clientX, y: e.clientY };
}

function hideTip(): void {
  if (tipPinned.value) return;
  hoverTip.value = null;
}

function forceHideTip(): void {
  tipPinned.value = false;
  hoverTip.value = null;
}

function tapTip(payload: HudTooltipPayload, e: MouseEvent): void {
  if (!isTouchMode.value) return;
  if (tipPinned.value && hoverTip.value?.title === payload.title) {
    forceHideTip();
    return;
  }
  tipPinned.value = true;
  hoverTip.value = payload;
  tipPos.value = { x: e.clientX, y: e.clientY };
}

function closeBook(): void {
  forceHideTip();
  previewedSpellId.value = null;
  previewedSpellCard.value = false;
  store.closeDrawer();
}

onMounted(() => {
  animTimer = window.setInterval(() => {
    animFrameIdx.value = (animFrameIdx.value + 1) % 6;
  }, 165);
});

onBeforeUnmount(() => {
  if (animTimer !== null) window.clearInterval(animTimer);
});

const hero = computed(() => {
  void store.stateVersion;
  const u = store.activeUnit;
  return u && (u.kind === 'hero' || u.knownSpellIds.length > 0) ? u : null;
});

const heroComputedStats = computed(() => {
  void store.stateVersion;
  if (!hero.value) return null;
  return computeUnitStats(hero.value, store.battleState, TOUHOU_CATALOG);
});

const isOpen = computed(() => store.activeDrawer === 'spells' && Boolean(hero.value));

watch(
  () => hero.value?.id,
  () => {
    schoolFilter.value = 'all';
    levelFilter.value = 0;
    polarityFilter.value = 'all';
    previewedSpellId.value = null;
    previewedSpellCard.value = false;
    forceHideTip();
  },
);

watch(isOpen, (open) => {
  if (!open) {
    previewedSpellId.value = null;
    previewedSpellCard.value = false;
    forceHideTip();
  }
});

const portraitUrl = computed(() => {
  if (!hero.value) return '';
  const frames = getVoxelPortraitFrames(hero.value.voxelBlueprintId, 80);
  return frames[animFrameIdx.value % frames.length] ?? frames[0];
});

const signatureCard = computed(() => {
  const h = hero.value;
  if (!h?.signatureSpellCardId) return null;
  return TOUHOU_CATALOG.spellCards[h.signatureSpellCardId] ?? null;
});

const canFireSpellCard = computed(() => {
  const h = hero.value;
  const card = signatureCard.value;
  if (!h || !card || !store.isHumanTurn || store.isAnimating) return false;
  return (h.mana ?? 0) >= card.manaCost && (h.spellCardCharge ?? 0) >= card.chargeCost;
});

const allKnownSpells = computed<SpellDef[]>(() => {
  const h = hero.value;
  if (!h) return [];
  return h.knownSpellIds
    .map((id) => TOUHOU_CATALOG.spells[id])
    .filter((sp): sp is SpellDef => Boolean(sp))
    .sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      const sa = SCHOOL_ORDER[a.alignment] ?? 9;
      const sb = SCHOOL_ORDER[b.alignment] ?? 9;
      if (sa !== sb) return sa - sb;
      return a.manaCost - b.manaCost;
    });
});

const schoolCounts = computed<Record<'all' | MagicSchool, number>>(() => {
  const counts: Record<'all' | MagicSchool, number> = {
    all: allKnownSpells.value.length,
    life: 0,
    order: 0,
    death: 0,
    chaos: 0,
    nature: 0,
  };
  for (const sp of allKnownSpells.value) {
    if (sp.alignment !== 'might') {
      counts[sp.alignment] += 1;
    }
  }
  return counts;
});

const schoolAndLevelSpells = computed(() => {
  return allKnownSpells.value.filter((sp) => {
    if (schoolFilter.value !== 'all' && sp.alignment !== schoolFilter.value) return false;
    if (levelFilter.value !== 0 && sp.level !== levelFilter.value) return false;
    return true;
  });
});

const polarityCounts = computed<Record<'all' | SpellPolarityKind, number>>(() => {
  const counts: Record<'all' | SpellPolarityKind, number> = {
    all: schoolAndLevelSpells.value.length,
    damage: 0,
    heal: 0,
    buff: 0,
    debuff: 0,
    utility: 0,
  };
  for (const sp of schoolAndLevelSpells.value) {
    counts[classifySpellPolarity(sp)] += 1;
  }
  return counts;
});

const filteredSpells = computed(() => {
  if (polarityFilter.value === 'all') return schoolAndLevelSpells.value;
  return schoolAndLevelSpells.value.filter((sp) => classifySpellPolarity(sp) === polarityFilter.value);
});

const schoolTabs: Array<{
  id: 'all' | MagicSchool;
  label: string;
  fullName: string;
  ribbonBg: string;
  ribbonEdge: string;
}> = [
  { id: 'all', label: '全', fullName: '全系总录', ribbonBg: '#664a20', ribbonEdge: '#f5df9e' },
  { id: 'life', label: ALIGNMENT_META.life.kanji, fullName: ALIGNMENT_META.life.name, ribbonBg: '#8c2231', ribbonEdge: '#f08a96' },
  { id: 'order', label: ALIGNMENT_META.order.kanji, fullName: ALIGNMENT_META.order.name, ribbonBg: '#244778', ribbonEdge: '#9ac4f5' },
  { id: 'death', label: ALIGNMENT_META.death.kanji, fullName: ALIGNMENT_META.death.name, ribbonBg: '#4c2b6b', ribbonEdge: '#cba6f0' },
  { id: 'chaos', label: ALIGNMENT_META.chaos.kanji, fullName: ALIGNMENT_META.chaos.name, ribbonBg: '#8c421b', ribbonEdge: '#f5b878' },
  { id: 'nature', label: ALIGNMENT_META.nature.kanji, fullName: ALIGNMENT_META.nature.name, ribbonBg: '#205e42', ribbonEdge: '#8ae0b3' },
];

const heroMagicMasteries = computed(() => {
  const h = hero.value;
  if (!h || h.kind !== 'hero') return [];
  const schools: Array<{ id: MagicSchool; short: string; skillId: PrimarySkillId; color: string }> = [
    { id: 'life', short: '生', skillId: 'life_magic', color: ALIGNMENT_META.life.themeColor },
    { id: 'order', short: '序', skillId: 'order_magic', color: ALIGNMENT_META.order.themeColor },
    { id: 'death', short: '死', skillId: 'death_magic', color: ALIGNMENT_META.death.themeColor },
    { id: 'chaos', short: '混', skillId: 'chaos_magic', color: ALIGNMENT_META.chaos.themeColor },
    { id: 'nature', short: '自', skillId: 'nature_magic', color: ALIGNMENT_META.nature.themeColor },
  ];
  return schools.map((s) => {
    const rank = (h.skills[s.skillId] ?? 0) as SkillRank;
    return {
      ...s,
      rank,
      roman: ROMAN_RANK[rank] ?? '—',
      tooltip: {
        title: `${ALIGNMENT_META[s.id].name} · ${getSkillRankLabel(rank)}`,
        tag: rank >= 5 ? '宗师满阶' : `Lv.${rank}`,
        accent: s.color,
        lines: [
          rank >= 5
            ? '已达五阶宗师造诣：可施放全阶 1~5 级术式，且该派系术式威力享 +70% 宗师增幅！'
            : rank > 0
              ? `当前造诣提供 +${rank * 14}% 派系术式威力加成。`
              : '尚未专精该魔法派系。',
        ],
      } satisfies HudTooltipPayload,
    };
  });
});

const currentSchoolName = computed(
  () => schoolTabs.find((t) => t.id === schoolFilter.value)?.fullName ?? '全系总录',
);

function getSpellCost(sp: SpellDef): number {
  if (!hero.value) return sp.manaCost;
  return getEffectiveSpellManaCost(store.battleState, hero.value, sp);
}

function canCastSpell(sp: SpellDef): boolean {
  if (!hero.value || store.isAnimating) return false;
  if (sp.isAdventureOnly || sp.targetType === 'adventure') return false;
  return (hero.value.mana ?? 0) >= getSpellCost(sp);
}

function buildSpellTooltip(sp: SpellDef): HudTooltipPayload {
  const caster = hero.value;
  return buildSpellTooltipPayload(sp, {
    effectiveManaCost: getSpellCost(sp),
    currentMana: caster?.mana,
    effectiveRange: caster ? getEffectiveSpellRange(store.battleState, caster, sp) : sp.range,
  });
}

const spellCardTooltip = computed<HudTooltipPayload | null>(() => {
  const card = signatureCard.value;
  const h = hero.value;
  if (!card || !h) return null;
  return buildSpellCardTooltipPayload(card, {
    currentMana: h.mana ?? 0,
    currentCharge: h.spellCardCharge ?? 0,
  });
});

const previewedSpell = computed<SpellDef | null>(() => {
  if (!previewedSpellId.value) return null;
  return allKnownSpells.value.find((s) => s.id === previewedSpellId.value) ?? null;
});

const touchInspector = computed<{
  kind: 'spell' | 'card';
  payload: HudTooltipPayload;
  canAct: boolean;
  actionLabel: string;
  spell?: SpellDef;
} | null>(() => {
  if (!isTouchMode.value) return null;
  if (previewedSpellCard.value && signatureCard.value && spellCardTooltip.value) {
    const h = hero.value;
    const manaLack = (h?.mana ?? 0) < signatureCard.value.manaCost;
    const chargeLack = (h?.spellCardCharge ?? 0) < signatureCard.value.chargeCost;
    return {
      kind: 'card',
      payload: spellCardTooltip.value,
      canAct: canFireSpellCard.value,
      actionLabel: canFireSpellCard.value ? '宣言符卡' : chargeLack ? '充能未满' : manaLack ? '灵力不足' : '暂不可用',
    };
  }
  const sp = previewedSpell.value;
  if (!sp) return null;
  const castable = canCastSpell(sp);
  const isAdv = Boolean(sp.isAdventureOnly || sp.targetType === 'adventure');
  return {
    kind: 'spell',
    payload: buildSpellTooltip(sp),
    canAct: castable,
    actionLabel: castable ? '施放此术' : isAdv ? '大地图专用' : '灵力不足',
    spell: sp,
  };
});

function pickSpell(sp: SpellDef): void {
  if (!canCastSpell(sp)) return;
  forceHideTip();
  previewedSpellId.value = null;
  previewedSpellCard.value = false;
  store.selectSpell(sp.id);
}

function handleSpellTileClick(sp: SpellDef): void {
  if (!isTouchMode.value) {
    pickSpell(sp);
    return;
  }
  forceHideTip();
  if (previewedSpellId.value === sp.id) {
    if (canCastSpell(sp)) {
      pickSpell(sp);
    } else {
      soundEngine.play('ui_blocked');
    }
    return;
  }
  previewedSpellCard.value = false;
  previewedSpellId.value = sp.id;
  soundEngine.play('ui_click');
}

function fireCard(): void {
  forceHideTip();
  previewedSpellId.value = null;
  previewedSpellCard.value = false;
  store.triggerSpellCard();
}

function handleSpellCardClick(): void {
  if (!isTouchMode.value) {
    fireCard();
    return;
  }
  forceHideTip();
  if (previewedSpellCard.value && canFireSpellCard.value) {
    fireCard();
    return;
  }
  previewedSpellId.value = null;
  previewedSpellCard.value = true;
  soundEngine.play('ui_click');
}

function confirmTouchInspector(): void {
  const ins = touchInspector.value;
  if (!ins || !ins.canAct) return;
  if (ins.kind === 'card') {
    fireCard();
  } else if (ins.spell) {
    pickSpell(ins.spell);
  }
}
</script>

<template>
  <transition name="book-modal-fade">
    <div
      v-if="isOpen && hero"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-2 py-1.5"
      :style="!isCompactLandscape ? { paddingRight: `${Math.min(sidebarWidthPx, 128)}px` } : undefined"
      @click="closeBook()"
      @contextmenu.prevent.stop="closeBook()"
      @mousemove="moveTip"
    >
      <!-- 外层定位包装（承载顶部垂落的五系燕尾丝绸书签，自适应短高横屏无裁切） -->
      <div
        class="relative flex max-h-[95dvh] w-[792px] max-w-[97vw] flex-col select-none"
        :class="isTinyHeight ? 'pt-6' : 'pt-7'"
        @click.stop="tipPinned && forceHideTip()"
        @contextmenu.prevent.stop="closeBook()"
      >
        <!-- 顶部悬垂燕尾五系丝绸书签（含每系已习得术数微标） -->
        <div
          class="absolute top-0 z-20 flex items-start"
          :class="isTinyHeight ? 'right-4 gap-1' : 'right-8 gap-1.5'"
        >
          <button
            v-for="tab in schoolTabs"
            :key="tab.id"
            class="silk-bookmark font-display flex flex-col items-center justify-start border-x border-t pt-1 font-bold"
            :class="[
              isTinyHeight ? 'w-8.5 text-[10px]' : 'w-10 text-[11px]',
              schoolFilter === tab.id
                ? isTinyHeight
                  ? 'h-9 translate-y-0 brightness-115'
                  : 'h-11 translate-y-0 brightness-115'
                : isTinyHeight
                  ? 'h-7.5 translate-y-1 opacity-78'
                  : 'h-9 translate-y-1 opacity-78 hover:translate-y-0.5 hover:opacity-100',
            ]"
            :style="{
              backgroundColor: tab.ribbonBg,
              borderColor: schoolFilter === tab.id ? '#f5df9e' : tab.ribbonEdge,
              color: '#f8eed8',
            }"
            :title="`${tab.fullName}（${schoolCounts[tab.id]} 术）`"
            @click="schoolFilter = tab.id; soundEngine.play('ui_book_tab')"
          >
            <span class="leading-none">{{ tab.label }}</span>
            <span class="font-num mt-0.5 text-[8px] leading-none opacity-85">{{ schoolCounts[tab.id] }}</span>
          </button>
        </div>

        <!-- 硬壳玄漆金边古书封皮 -->
        <section
          class="grimoire-cover relative flex min-h-0 flex-1 flex-col overflow-hidden text-xs"
          :class="isTinyHeight ? 'p-2' : 'p-3.5'"
        >
          <OrnamentalFrame variant="corners" :compact="isTinyHeight" />

          <!-- 左右摊开的双页书体 + 中央四目线装书脊（手机横屏亦保持精致对开页） -->
          <div
            class="relative z-10 grid min-h-0 flex-1 grid-cols-1 min-[560px]:grid-cols-[176px_10px_1fr] lg:grid-cols-[228px_14px_1fr]"
          >
            <!-- ========== 左页：施法者铜镜、五系造诣印与竖式符卡札 ========== -->
            <div
              class="grimoire-page-left touch-scroll relative flex min-h-0 flex-col justify-between overflow-y-auto"
              :class="isTinyHeight ? 'gap-1.5 px-2.5 py-2' : 'gap-2.5 px-4 py-4'"
            >
              <!-- 左页暗金罗盘法阵底纹 -->
              <svg
                viewBox="0 0 180 180"
                class="pointer-events-none absolute left-1/2 top-16 h-44 w-44 -translate-x-1/2 opacity-[0.07]"
                fill="none"
              >
                <circle cx="90" cy="90" r="82" stroke="#cfa75b" stroke-width="1" />
                <circle cx="90" cy="90" r="64" stroke="#cfa75b" stroke-width="0.7" stroke-dasharray="4 4" />
                <path d="M90 8L108 72L172 90L108 108L90 172L72 108L8 90L72 72Z" stroke="#cfa75b" stroke-width="0.9" />
              </svg>

              <!-- 施法者肖像与灵力标尺 -->
              <div class="relative z-10 flex flex-col items-center">
                <div
                  class="sacred-mirror-frame overflow-hidden rounded-full"
                  :class="isTinyHeight ? 'h-[54px] w-[54px]' : 'h-[80px] w-[80px]'"
                >
                  <img :src="portraitUrl" :alt="hero.name" class="pixel-art h-full w-full object-cover" />
                </div>

                <div
                  class="font-display font-black text-[#f5edd8]"
                  :class="isTinyHeight ? 'mt-1 text-xs' : 'mt-2 text-sm'"
                >
                  {{ hero.name }}
                </div>
                <div class="font-num mt-0.5 text-[9.5px] tracking-wider text-[#9ec4ed]">
                  法强 SP {{ heroComputedStats?.spellPower ?? hero.baseStats.spellPower }}
                  <span v-if="store.battleState.battleSpellFlags?.manaFlareActive" class="ml-1 text-[#ffe082]">· 灵脉沸腾-2MP</span>
                </div>

                <!-- 五系魔法造诣条（点按在触控端弹出造诣详情笺） -->
                <div v-if="heroMagicMasteries.length > 0" class="mt-1.5 grid w-full grid-cols-5 gap-1">
                  <div
                    v-for="m in heroMagicMasteries"
                    :key="m.id"
                    class="flex cursor-help flex-col items-center border py-0.5 text-center transition hover:brightness-125"
                    :class="m.rank >= 5 ? 'bg-[#2a1f16]' : m.rank > 0 ? 'bg-[#17121b]' : 'bg-[#0e0b12] opacity-40'"
                    :style="{ borderColor: m.rank >= 5 ? '#f5df9e' : `${m.color}70` }"
                    @mouseenter="showTip(m.tooltip, $event)"
                    @mouseleave="hideTip"
                    @click.stop="tapTip(m.tooltip, $event)"
                  >
                    <span class="font-display text-[9px] font-bold leading-none" :style="{ color: m.color }">{{ m.short }}</span>
                    <span
                      class="font-num mt-0.5 text-[8.5px] font-bold leading-none"
                      :class="m.rank >= 5 ? 'text-[#ffe484]' : 'text-[#b5a998]'"
                    >
                      {{ m.roman }}
                    </span>
                  </div>
                </div>

                <div class="w-full font-num text-[10px]" :class="isTinyHeight ? 'mt-1.5 space-y-1' : 'mt-2.5 space-y-2'">
                  <div>
                    <div class="flex justify-between text-[#a3c7f0]">
                      <span>灵力 MP</span>
                      <span>{{ hero.mana ?? 0 }} / {{ heroComputedStats?.maxMana ?? hero.baseStats.maxMana }}</span>
                    </div>
                    <div class="mt-0.5 h-1.5 w-full bg-[#0a080c] ring-1 ring-[#99763a]/40">
                      <div
                        class="h-full bg-gradient-to-r from-[#3465ad] to-[#86bdf2]"
                        :style="{
                          width: `${Math.min(100, Math.round(((hero.mana ?? 0) / Math.max(1, heroComputedStats?.maxMana ?? hero.baseStats.maxMana)) * 100))}%`,
                        }"
                      />
                    </div>
                  </div>
                  <div v-if="hero.kind === 'hero'">
                    <div class="flex justify-between text-[#f2d282]">
                      <span>符卡充能</span>
                      <span>{{ hero.spellCardCharge ?? 0 }}%</span>
                    </div>
                    <div class="mt-0.5 h-1.5 w-full bg-[#0a080c] ring-1 ring-[#99763a]/40">
                      <div
                        class="h-full bg-gradient-to-r from-[#b92c3b] via-[#de9f3e] to-[#f5df9e]"
                        :style="{ width: `${Math.min(100, hero.spellCardCharge ?? 0)}%` }"
                      />
                    </div>
                  </div>
                  <div
                    v-else
                    class="washi-recess border-l-2 border-l-[#6eb8ff] px-2 py-1 text-[9.5px] leading-relaxed text-[#b4d6fa]"
                  >
                    施法兵种（×{{ hero.count }}）：术式威力随本队兵力规模自动增幅。
                  </div>
                </div>
              </div>

              <!-- 专属符卡御札（传统神社符札竖式排版） -->
              <button
                v-if="signatureCard"
                class="relative z-10 flex flex-col items-center border text-center transition"
                :class="[
                  isTinyHeight ? 'p-1.5' : 'p-2.5',
                  previewedSpellCard
                    ? 'border-[#fff2b8] bg-[#4a1f2d] ring-1 ring-[#f5df9e]'
                    : canFireSpellCard
                      ? 'animate-makie-ready border-[#f5df9e] bg-gradient-to-b from-[#4f1726] via-[#2c131d] to-[#261a12] hover:brightness-115'
                      : 'border-[#99763a]/45 bg-[#151016]/90 opacity-80 hover:border-[#cfa75b]',
                ]"
                @mouseenter="spellCardTooltip && showTip(spellCardTooltip, $event)"
                @mouseleave="hideTip"
                @click.stop="handleSpellCardClick()"
              >
                <span class="pointer-events-none absolute inset-1 border border-[#cfa75b]/30" />

                <div class="flex w-full items-center justify-between px-1">
                  <span class="th-hanko px-1 py-0.5 text-[8.5px]">符卡</span>
                  <span class="font-num text-[9.5px] font-bold text-[#f5df9e]">
                    {{ signatureCard.manaCost }} MP
                  </span>
                </div>

                <div :class="isTinyHeight ? 'my-0.5' : 'my-1'">
                  <PixelBadgeIcon name="spell_card" :size-class="isTinyHeight ? 'h-5 w-5' : 'h-7 w-7'" />
                </div>

                <div class="font-display text-[11px] font-bold text-[#f7eedc]">
                  {{ signatureCard.name }}
                </div>
                <div
                  class="font-display mt-0.5 text-[9px]"
                  :class="canFireSpellCard ? 'text-[#f5df9e]' : 'text-[#8c7e6c]'"
                >
                  {{
                    canFireSpellCard
                      ? isTouchMode
                        ? previewedSpellCard
                          ? '再触立即宣言'
                          : '印成 · 轻触预览'
                        : '印成 · 点击宣言'
                      : '蓄势充能中'
                  }}
                </div>
              </button>
            </div>

            <!-- ========== 中央四目线装和綴じ书脊（纯 SVG 折痕与金丝缝线） ========== -->
            <div
              class="hidden flex-col items-center justify-between bg-gradient-to-r from-[#09070a] via-[#1c1518] to-[#09070a] py-3 min-[560px]:flex"
            >
              <svg viewBox="0 0 14 280" class="h-full w-3" fill="none">
                <line x1="7" y1="0" x2="7" y2="280" stroke="#050406" stroke-width="2" />
                <g stroke="#cfa75b" stroke-width="1.2">
                  <path d="M2 34H12M3 38H11" />
                  <path d="M2 104H12M3 108H11" />
                  <path d="M2 174H12M3 178H11" />
                  <path d="M2 244H12M3 248H11" />
                </g>
              </svg>
            </div>

            <!-- ========== 右页：全 142 术式雕版封印阵（含等阶筛选、卷内滚动与触控详述条） ========== -->
            <div
              class="grimoire-page-right flex min-h-0 flex-col justify-between overflow-hidden lg:min-h-[456px]"
              :class="isTinyHeight ? 'px-2.5 py-2' : 'px-4 py-3.5'"
            >
              <div class="flex min-h-0 flex-1 flex-col">
                <!-- 书页天头版心标题 + 壱~伍阶快捷筛选 -->
                <div
                  class="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#99763a]/45"
                  :class="isTinyHeight ? 'pb-1.5' : 'pb-2'"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="th-hanko-outline px-1.5 py-0.5 text-[9.5px]">巻</span>
                    <h3
                      class="font-display font-bold text-[#f3ead8]"
                      :class="isTinyHeight ? 'text-xs' : 'text-sm'"
                    >
                      魔导术式录 ·
                      <span
                        :style="{
                          color: schoolFilter === 'all' ? '#e6c985' : ALIGNMENT_META[schoolFilter].textColor,
                        }"
                      >
                        {{ currentSchoolName }}
                      </span>
                    </h3>
                  </div>

                  <!-- 1~5 阶快捷筛选按钮 -->
                  <div class="flex items-center gap-1">
                    <button
                      v-for="lv in ([0, 1, 2, 3, 4, 5] as const)"
                      :key="lv"
                      class="font-display border px-1.5 py-0.5 text-[9.5px] font-bold transition"
                      :class="
                        levelFilter === lv
                          ? 'border-[#f5df9e] bg-[#453118] text-[#fff2c2]'
                          : 'border-[#99763a]/40 bg-[#141017] text-[#a39481] hover:border-[#cfa75b] hover:text-[#f3ead8]'
                      "
                      @click="levelFilter = lv; soundEngine.play('ui_click')"
                    >
                      {{ lv === 0 ? '全阶' : `${LEVEL_KANJI[lv]}阶` }}
                    </button>
                  </div>
                </div>

                <!-- 极性快筛条（全类 / 伤害 / 治愈 / 增益 / 减益 / 战术） -->
                <div
                  class="touch-scroll-x flex items-center gap-1 overflow-x-auto pb-0.5 sm:flex-wrap"
                  :class="isTinyHeight ? 'mt-1.5' : 'mt-2'"
                >
                  <button
                    class="font-display inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-[9.5px] font-bold transition"
                    :class="
                      polarityFilter === 'all'
                        ? 'border-[#f5df9e] bg-[#362716] text-[#fff2c2]'
                        : 'border-[#99763a]/35 bg-[#141017] text-[#a39481] hover:border-[#cfa75b] hover:text-[#f3ead8]'
                    "
                    @click="polarityFilter = 'all'; soundEngine.play('ui_click')"
                  >
                    <span>全类</span>
                    <span class="font-num text-[8.5px] opacity-80">{{ polarityCounts.all }}</span>
                  </button>
                  <button
                    v-for="polId in ALL_SPELL_POLARITIES"
                    :key="polId"
                    class="font-display inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-[9.5px] font-bold transition"
                    :style="
                      polarityFilter === polId
                        ? {
                            borderColor: SPELL_POLARITY_META[polId].border,
                            backgroundColor: SPELL_POLARITY_META[polId].bg,
                            color: SPELL_POLARITY_META[polId].color,
                          }
                        : {
                            borderColor: 'rgba(153, 118, 58, 0.32)',
                            backgroundColor: '#141017',
                            color: '#a39481',
                          }
                    "
                    @click="polarityFilter = polId; soundEngine.play('ui_click')"
                  >
                    <PixelBadgeIcon :name="SPELL_POLARITY_META[polId].icon" size-class="h-3 w-3 shrink-0" />
                    <span>{{ SPELL_POLARITY_META[polId].label }}</span>
                    <span class="font-num text-[8.5px] opacity-80">{{ polarityCounts[polId] }}</span>
                  </button>
                </div>

                <!-- 独立滚动术式封印阵（自动填满可用高度，彻底杜绝短屏溢出） -->
                <div
                  v-if="filteredSpells.length > 0"
                  class="grimoire-scroll touch-scroll mt-1.5 grid min-h-0 flex-1 grid-cols-3 content-start gap-1.5 overflow-y-auto pr-1 sm:grid-cols-4"
                >
                  <button
                    v-for="sp in filteredSpells"
                    :key="sp.id"
                    class="enamel-crest group relative flex flex-col items-center justify-center overflow-hidden border px-1.5 transition"
                    :class="[
                      isTinyHeight ? 'pb-1.5 pt-1.5' : 'pb-2.5 pt-2',
                      !canCastSpell(sp) && !isTouchMode ? 'cursor-not-allowed opacity-40' : '',
                      !canCastSpell(sp) && isTouchMode ? 'opacity-55' : '',
                      previewedSpellId === sp.id
                        ? 'border-[#fff2b8] bg-[#36243a] shadow-[0_0_12px_rgba(245,223,158,0.45)]'
                        : store.selectedSpellId === sp.id
                          ? 'border-[#f5df9e] bg-[#2e2030] shadow-[0_0_12px_rgba(245,223,158,0.3)]'
                          : canCastSpell(sp)
                            ? 'border-[#99763a]/55 bg-[#151017]/95 hover:-translate-y-0.5 hover:border-[#f5df9e] hover:bg-[#221922]'
                            : 'border-[#57462d]/40 bg-[#110d13]',
                    ]"
                    :disabled="!isTouchMode && !canCastSpell(sp)"
                    @mouseenter="showTip(buildSpellTooltip(sp), $event)"
                    @mouseleave="hideTip"
                    @click.stop="handleSpellTileClick(sp)"
                  >
                    <!-- 左上和风阶位印（按派系高亮色着色） -->
                    <span
                      class="font-display absolute left-1.5 top-1 text-[8.5px] font-bold"
                      :style="{ color: ALIGNMENT_META[sp.alignment].textColor }"
                    >
                      {{ LEVEL_KANJI[sp.level] ?? sp.level }}
                    </span>

                    <!-- 右上灵力耗值或「大地图」朱印 -->
                    <span
                      v-if="sp.isAdventureOnly || sp.targetType === 'adventure'"
                      class="font-display absolute right-1 top-1 border border-[#cfa75b]/45 bg-[#291e12] px-1 text-[7.5px] text-[#e0c387]"
                    >
                      大地图
                    </span>
                    <span
                      v-else
                      class="font-num absolute right-1.5 top-1 text-[9px] font-bold"
                      :class="
                        getSpellCost(sp) < sp.manaCost
                          ? 'text-[#7ef5b5]'
                          : getSpellCost(sp) > sp.manaCost
                            ? 'text-[#ff7890]'
                            : 'text-[#95c0ed]'
                      "
                    >
                      {{ getSpellCost(sp) }}
                    </span>

                    <!-- 左下角法术极性微标 -->
                    <span
                      class="absolute bottom-1.5 left-1 flex h-4 w-4 items-center justify-center border"
                      :style="{
                        backgroundColor: SPELL_POLARITY_META[classifySpellPolarity(sp)].bg,
                        borderColor: `${SPELL_POLARITY_META[classifySpellPolarity(sp)].border}bb`,
                      }"
                    >
                      <PixelBadgeIcon
                        :name="SPELL_POLARITY_META[classifySpellPolarity(sp)].icon"
                        size-class="h-2.5 w-2.5"
                      />
                    </span>

                    <img
                      :src="getSpellIconDataUrl(sp.id)"
                      :alt="sp.name"
                      class="pixel-art mt-1 shrink-0 transition-transform group-hover:scale-105"
                      :class="isTinyHeight ? 'h-[36px] w-[36px]' : 'h-[48px] w-[48px]'"
                    />
                    <div class="font-display mt-1 max-w-full truncate text-[10px] font-bold text-[#f3ead8] group-hover:text-[#f5df9e]">
                      {{ sp.name }}
                    </div>

                    <!-- 底部 2px 极性色光条 -->
                    <span
                      class="absolute inset-x-0 bottom-0 h-[2px]"
                      :style="{ backgroundColor: SPELL_POLARITY_META[classifySpellPolarity(sp)].barColor }"
                    />
                  </button>
                </div>

                <div
                  v-else
                  class="font-display flex flex-1 items-center justify-center text-xs text-[#7a6c5d]"
                >
                  此系此阶尚无抄录术式
                </div>

                <!-- 触控专属：内嵌术式/符卡详述确认条（完美替代无 Hover 悬停查阅） -->
                <div
                  v-if="touchInspector"
                  class="washi-recess mt-1.5 flex shrink-0 items-center justify-between gap-2 border-l-2 border-l-[#f5df9e] px-2.5 py-1.5"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span
                        class="font-display text-[11px] font-bold"
                        :style="{ color: touchInspector.payload.accent ?? '#f5df9e' }"
                      >
                        {{ touchInspector.payload.title }}
                      </span>
                      <span
                        v-if="touchInspector.payload.tag"
                        class="font-num border border-[#99763a]/50 bg-[#1a141c] px-1 py-px text-[8.5px] text-[#e6d6b8]"
                      >
                        {{ touchInspector.payload.tag }}
                      </span>
                      <span
                        v-for="(b, idx) in (touchInspector.payload.badges ?? []).slice(0, 2)"
                        :key="idx"
                        class="font-display inline-flex items-center gap-0.5 border px-1 py-px text-[8.5px]"
                        :style="{ color: b.color, backgroundColor: b.bg, borderColor: b.border }"
                      >
                        {{ b.label }}
                      </span>
                    </div>
                    <div class="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#d6cab7]">
                      <RichSemanticText
                        :text="touchInspector.payload.summary || touchInspector.payload.lines.join(' ')"
                      />
                    </div>
                  </div>
                  <button
                    class="font-display min-h-[30px] shrink-0 px-3 text-[11px] font-bold"
                    :class="
                      touchInspector.canAct
                        ? 'jade-seal-btn text-[#eafff4]'
                        : 'brass-action-btn opacity-55 text-[#cbbca6]'
                    "
                    :disabled="!touchInspector.canAct"
                    @click.stop="confirmTouchInspector()"
                  >
                    {{ touchInspector.actionLabel }}
                  </button>
                </div>
              </div>

              <!-- 书页地脚：术数统计 + 合卷铜扣 -->
              <div
                class="flex shrink-0 items-center justify-between border-t border-[#99763a]/30"
                :class="isTinyHeight ? 'mt-1.5 pt-1.5' : 'mt-2.5 pt-2'"
              >
                <span class="font-num truncate text-[9.5px] text-[#9b8c78]">
                  共展示 {{ filteredSpells.length }} / {{ allKnownSpells.length }} 术 ·
                  {{ isTouchMode ? '轻触查详述 · 再触或点确认施放' : '悬停查全详述' }}
                </span>
                <button
                  class="brass-action-btn font-display shrink-0 px-3.5 py-1 text-[11px] font-bold text-[#f5df9e]"
                  @click="closeBook()"
                >
                  合卷
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <HudHoverTooltip
        :payload="hoverTip"
        :x="tipPos.x"
        :y="tipPos.y"
        :pinned="tipPinned"
        @close="forceHideTip()"
      />
    </div>
  </transition>
</template>

<style scoped>
.book-modal-fade-enter-active,
.book-modal-fade-leave-active {
  transition: opacity 0.14s ease, transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
.book-modal-fade-enter-from,
.book-modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
.grimoire-scroll::-webkit-scrollbar {
  width: 5px;
}
.grimoire-scroll::-webkit-scrollbar-track {
  background: rgba(12, 9, 15, 0.65);
}
.grimoire-scroll::-webkit-scrollbar-thumb {
  background: rgba(176, 138, 72, 0.55);
}
.grimoire-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(245, 223, 158, 0.8);
}
</style>

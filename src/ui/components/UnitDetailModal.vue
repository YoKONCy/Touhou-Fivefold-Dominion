<script setup lang="ts">
/**
 * 双轨典藏单位详情居中大 HUD（幽夜蒔絵 × 博麗木刻 × HoMM4 雕版数表）
 * - 兵种大窗（方案 A）：动态立绘 + 落款朱印横匾 + 20 格法术专属图标状态矩阵(2×10) + 2×7 铭文数表 + 七宝烧特技槽
 * - 英雄档案（方案 B）：动态立绘 + 十字星阵神器纸娃娃 + 2×7 铭文数表 + 20 格独立状态矩阵 +
 *   战斗场景外自由切换「全部 37 种进阶组合职业」+ 完整「9 主技能 × 3 子技能 = 36 技能树」与沙盒实时调点器！
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ALIGNMENT_META } from '@core/alignment';
import { MAX_UNIT_BUFF_SLOTS } from '@core/statusCap';
import type { ArtifactDef, PrimarySkillId, SecondarySkillId, SkillRank } from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { getVoxelPortraitFrames } from '@renderer/voxelSprites';
import { useBattleStore } from '@ui/battleStore';
import HudHoverTooltip from '@ui/components/HudHoverTooltip.vue';
import OrnamentalFrame from '@ui/components/OrnamentalFrame.vue';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import TierBadgeIcon from '@ui/components/TierBadgeIcon.vue';
import { useViewportInput } from '@ui/composables/useViewportInput';
import {
  buildHeroEquipmentSlots,
  buildHeroTraitBadges,
  buildUnitSpecialtyBadges,
  buildUnitStatusBadges,
  type HudTooltipPayload,
} from '@ui/hudMetadata';
import { getUnitHeaderCreatureTags } from '@ui/semanticFormat';
import HeroClassHeader from './unitDetail/HeroClassHeader.vue';
import HeroEquipmentSection from './unitDetail/HeroEquipmentSection.vue';
import HeroLoadoutBar from './unitDetail/HeroLoadoutBar.vue';
import HeroSkillTreeSection from './unitDetail/HeroSkillTreeSection.vue';
import UnitStatLedger from './unitDetail/UnitStatLedger.vue';
import UnitStatusGrid from './unitDetail/UnitStatusGrid.vue';
import {
  buildHeroKnownSpells,
  buildHeroPotions,
  buildHeroSignatureCard,
  buildHeroSkillTrees,
  buildHeroSpellSummaryTooltip,
  buildPortraitTooltip,
  buildStatRows,
  type HeroEquipmentSlotItem,
} from './unitDetail/helpers';

const store = useBattleStore();
const { isTouchMode, isCompactLandscape, isTinyHeight, sidebarWidthPx } = useViewportInput();
const animFrameIdx = ref(0);
let animTimer: number | null = null;

/** 英雄档案交互面板状态：进阶职业切换谱 / 36 技能树沙盒调点模式 */
const showClassPicker = ref(false);
const skillEditMode = ref(false);

const hoverTip = ref<HudTooltipPayload | null>(null);
const tipPos = ref({ x: 0, y: 0 });
const tipPinned = ref(false);

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

/** 触控端轻触任意属性/特技/状态/装备/技能即钉住详述笺，再触同一项或轻触空白收起 */
function tapTip(payload: HudTooltipPayload, e: MouseEvent): void {
  if (!isTouchMode.value) return;
  if (
    tipPinned.value &&
    hoverTip.value?.title === payload.title &&
    hoverTip.value?.subtitle === payload.subtitle
  ) {
    forceHideTip();
    return;
  }
  tipPinned.value = true;
  hoverTip.value = payload;
  tipPos.value = { x: e.clientX, y: e.clientY };
}

function closeModal(): void {
  forceHideTip();
  showClassPicker.value = false;
  skillEditMode.value = false;
  store.closeUnitDetail();
}

watch(
  () => store.detailModal?.unitId,
  () => {
    forceHideTip();
    showClassPicker.value = false;
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

const creatureDef = computed(() => {
  const u = unit.value;
  if (!u || u.kind !== 'creature') return null;
  return TOUHOU_CATALOG.creatures[u.defId] ?? null;
});

const factionStamp = computed(() => (unit.value?.side === 'left' ? '博麗' : '霧雨'));

const portraitUrl = computed(() => {
  void store.stateVersion;
  if (!unit.value) return '';
  const targetSize = unit.value.kind === 'hero' ? 144 : 112;
  const frames = getVoxelPortraitFrames(unit.value.voxelBlueprintId, targetSize);
  return frames[animFrameIdx.value % frames.length] ?? frames[0];
});

const specialtyBadges = computed(() => {
  void store.stateVersion;
  return unit.value ? buildUnitSpecialtyBadges(unit.value) : [];
});
const headerCreatureTags = computed(() => {
  void store.stateVersion;
  return unit.value ? getUnitHeaderCreatureTags(unit.value) : [];
});
const statusBadges = computed(() => {
  void store.stateVersion;
  return unit.value ? buildUnitStatusBadges(unit.value, store.battleState) : [];
});
const traitBadges = computed(() => {
  void store.stateVersion;
  return unit.value ? buildHeroTraitBadges(unit.value) : [];
});
const equipSlots = computed(() => {
  void store.stateVersion;
  return unit.value && unit.value.kind === 'hero' ? buildHeroEquipmentSlots(unit.value) : [];
});

/** 按部位索引 5 格神器纸娃娃（用于十字星阵人偶排布） */
const equipSlotMap = computed(() => {
  const map: Partial<Record<ArtifactDef['slot'], HeroEquipmentSlotItem>> = {};
  for (const s of equipSlots.value) {
    map[s.slot] = s;
  }
  return map;
});

/** 英雄完整 9 大主技能 × 3 子技能树（共 36 项）视图模型 */
const heroSkillTrees = computed(() => {
  void store.stateVersion;
  return unit.value ? buildHeroSkillTrees(unit.value, skillEditMode.value) : [];
});

/** 英雄已习得术式、符卡与腰带药水微缩视图 */
const heroKnownSpells = computed(() => {
  void store.stateVersion;
  return unit.value ? buildHeroKnownSpells(unit.value, store.battleState) : [];
});
const heroSpellSummaryTooltip = computed(() => {
  void store.stateVersion;
  return unit.value ? buildHeroSpellSummaryTooltip(unit.value, heroKnownSpells.value.length) : null;
});
const heroSignatureCard = computed(() => {
  void store.stateVersion;
  return unit.value ? buildHeroSignatureCard(unit.value) : null;
});
const heroPotions = computed(() => {
  void store.stateVersion;
  return unit.value ? buildHeroPotions(unit.value) : [];
});

/** 2×7 精简黄铜连体属性数表 */
const statRows = computed(() => {
  void store.stateVersion;
  if (!unit.value || !stats.value) return { top: [], bottom: [] };
  return buildStatRows(unit.value, stats.value, store.battleState, creatureDef.value);
});

/** 立绘悬停卡提示载荷 */
const portraitTooltip = computed<HudTooltipPayload | null>(() => {
  void store.stateVersion;
  if (!unit.value) return null;
  return buildPortraitTooltip(unit.value, creatureDef.value, store.detailModalAdvancedClass);
});

/** 英雄手动选定的进阶职业 ID（随 stateVersion 实时同步） */
const selectedAdvancedClassId = computed(() => {
  void store.stateVersion;
  return unit.value?.selectedAdvancedClassId;
});

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

function handleReturnToPrep(): void {
  if (!unit.value) return;
  store.returnToPreBattlePrep(unit.value.id);
}
</script>

<template>
  <transition name="h4-modal-fade">
    <div
      v-if="store.detailModal && unit && stats"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/68 px-2 py-1.5"
      :style="!isCompactLandscape ? { paddingRight: `${Math.min(sidebarWidthPx, 128)}px` } : undefined"
      @click="closeModal()"
      @contextmenu.prevent.stop="closeModal()"
      @mousemove="moveTip"
    >
      <!-- ==================== 方案 A：极简典藏兵种雕版大窗（升级 20 格法术图标状态矩阵！） ==================== -->
      <section
        v-if="unit.kind === 'creature'"
        class="urushi-frame touch-scroll relative flex max-h-[94dvh] w-[588px] max-w-[96vw] flex-col overflow-y-auto text-xs select-none"
        :class="isTinyHeight ? 'p-2.5' : 'p-4'"
        @click.stop="tipPinned && forceHideTip()"
        @contextmenu.prevent.stop="closeModal()"
      >
        <OrnamentalFrame variant="corners" :compact="isTinyHeight" />

        <!-- 顶段：切角古金立绘龛 + 落款朱印名匾 + 20 格状态矩阵 (2×10) -->
        <div class="relative z-10 flex items-stretch" :class="isTinyHeight ? 'gap-2.5' : 'gap-3.5'">
          <div
            class="sacred-mirror-frame relative shrink-0 cursor-help overflow-hidden"
            :class="isTinyHeight ? 'h-[82px] w-[82px]' : 'h-[112px] w-[112px]'"
            :style="{ borderColor: unit.side === 'left' ? '#c93848' : '#588fd1' }"
            @mouseenter="portraitTooltip && showTip(portraitTooltip, $event)"
            @mouseleave="hideTip"
            @click.stop="portraitTooltip && tapTip(portraitTooltip, $event)"
          >
            <img
              :src="portraitUrl"
              :alt="unit.name"
              class="pixel-art h-full w-full object-cover transition"
              :class="unit.isIllusion ? 'opacity-72 blur-[0.75px] saturate-125 brightness-110' : ''"
              :style="
                unit.isIllusion
                  ? { filter: 'blur(0.75px) drop-shadow(0 0 6px rgba(72, 240, 255, 0.7)) hue-rotate(8deg)' }
                  : undefined
              "
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
                    <TierBadgeIcon :tier="creatureDef?.tier ?? 1" size="md" />
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
            <UnitStatusGrid
              :status-badges="statusBadges"
              variant="creature"
              @show-tip="showTip"
              @hide-tip="hideTip"
              @tap-tip="tapTip"
            />
          </div>
        </div>

        <!-- 中段：HoMM4 连体黄铜 2×7 雕刻属性数表 -->
        <UnitStatLedger
          :stat-rows="statRows"
          variant="creature"
          :creature-tier="creatureDef?.tier ?? 1"
          @show-tip="showTip"
          @hide-tip="hideTip"
          @tap-tip="tapTip"
        />

        <!-- 底段：七宝烧特技槽 + 翡翠玉玺确认键 -->
        <div
          class="relative z-10 flex items-center justify-between gap-3"
          :class="isTinyHeight ? 'mt-2' : 'mt-3.5'"
        >
          <div class="washi-recess flex min-h-[42px] flex-1 flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5">
            <div v-if="specialtyBadges.length > 0" class="flex flex-wrap items-center gap-1.5">
              <div
                v-for="badge in specialtyBadges"
                :key="badge.id"
                class="enamel-crest relative flex cursor-help flex-col items-center justify-center overflow-hidden border transition hover:-translate-y-0.5"
                :class="isTinyHeight ? 'h-9 w-9' : 'h-10 w-10'"
                :style="{ backgroundColor: badge.bg, borderColor: badge.border }"
                @mouseenter="showTip(badge.tooltip, $event)"
                @mouseleave="hideTip"
                @click.stop="tapTip(badge.tooltip, $event)"
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
            <span v-if="isTouchMode" class="font-display text-[9px] text-[#8d7f6e]">
              轻触属性/图标查详述
            </span>
          </div>

          <button
            class="jade-seal-btn flex shrink-0 items-center justify-center"
            :class="isTinyHeight ? 'h-10 w-11' : 'h-11 w-12'"
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
        class="urushi-frame relative flex max-h-[94dvh] w-[886px] max-w-[97vw] flex-col overflow-hidden text-xs select-none"
        :class="isTinyHeight ? 'p-2.5' : 'p-4'"
        @click.stop="tipPinned && forceHideTip()"
        @contextmenu.prevent.stop="closeModal()"
      >
        <OrnamentalFrame variant="corners" :compact="isTinyHeight" />

        <!-- 顶段：指挥官御览横匾 + 可折叠 37 进阶职业自由切换谱 -->
        <HeroClassHeader
          v-model:show-class-picker="showClassPicker"
          :unit="unit"
          :faction-stamp="factionStamp"
          :align-meta="alignMeta"
          :advanced-class="store.detailModalAdvancedClass"
          :eligible-classes="store.detailModalEligibleClasses"
          :selected-advanced-class-id="selectedAdvancedClassId"
          :can-modify-hero-build="store.canModifyHeroBuild"
          @pick-class="handlePickClass"
          @return-to-prep="handleReturnToPrep"
          @close="closeModal()"
          @show-tip="showTip"
          @hide-tip="hideTip"
          @tap-tip="tapTip"
        />

        <!-- 主体双栏：左「指挥官肖像与十字神器阵图」 / 右「属性数表 + 20 格状态槽 + 36 技能树」 -->
        <div
          class="touch-scroll relative z-10 grid min-h-0 flex-1 grid-cols-1 overflow-y-auto min-[620px]:grid-cols-[188px_1fr] lg:grid-cols-[224px_1fr]"
          :class="isTinyHeight ? 'mt-2 gap-2' : 'mt-3 gap-3'"
        >
          <!-- 左栏：立绘 + 四维条 + 十字星阵 5 格神器纸娃娃 -->
          <HeroEquipmentSection
            :unit="unit"
            :stats="stats"
            :portrait-url="portraitUrl"
            :portrait-tooltip="portraitTooltip"
            :artifact-sets="store.detailModalArtifactSets"
            :equip-slot-map="equipSlotMap"
            @show-tip="showTip"
            @hide-tip="hideTip"
            @tap-tip="tapTip"
          />

          <!-- 右栏：属性数表 + 20 格独立状态槽 + 完整 9×3=36 技能树 + 底段军备轨 -->
          <div class="flex min-h-0 flex-col justify-between gap-2">
            <!-- 1. 英雄 2×7 连体黄铜属性数表 -->
            <UnitStatLedger
              :stat-rows="statRows"
              variant="hero"
              @show-tip="showTip"
              @hide-tip="hideTip"
              @tap-tip="tapTip"
            />

            <!-- 2. 特质特技条 + 独立 20 格 Buff/Debuff 状态矩阵（2×10） -->
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-[200px_1fr]">
              <!-- 特质与派生特技 -->
              <div class="washi-recess p-2">
                <div class="font-display mb-1.5 flex items-center justify-between border-b border-[#99763a]/30 pb-1 text-[10px] text-[#d9be86]">
                  <span>固有特质 · 特技</span>
                  <span class="font-num text-[9px] text-[#7e7060]">
                    {{ traitBadges.length + specialtyBadges.length }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-1">
                  <div
                    v-for="tr in traitBadges"
                    :key="tr.id"
                    class="enamel-crest flex h-8 w-8 cursor-help flex-col items-center justify-center border shadow-[0_0_8px_rgba(207,167,91,0.28)]"
                    :style="{ backgroundColor: tr.bg, borderColor: tr.border }"
                    @mouseenter="showTip(tr.tooltip, $event)"
                    @mouseleave="hideTip"
                    @click.stop="tapTip(tr.tooltip, $event)"
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
                    @click.stop="tapTip(sp.tooltip, $event)"
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
                <UnitStatusGrid
                  :status-badges="statusBadges"
                  variant="hero"
                  @show-tip="showTip"
                  @hide-tip="hideTip"
                  @tap-tip="tapTip"
                />
              </div>
            </div>

            <!-- 3. H4 完整 9 大主技能 × 3 子技能 = 36 技能树（支持战前沙盒实时加点调配！） -->
            <HeroSkillTreeSection
              :skill-trees="heroSkillTrees"
              :skill-edit-mode="skillEditMode"
              :can-modify-hero-build="store.canModifyHeroBuild"
              @toggle-edit-mode="handleToggleEditMode"
              @step-primary="handleStepPrimary"
              @step-sub-skill="handleStepSubSkill"
              @show-tip="showTip"
              @hide-tip="hideTip"
              @tap-tip="tapTip"
            />

            <!-- 4. 底段快捷军备轨（符卡 + 术式印 + 秘药 + 翡翠玉玺确认键） -->
            <HeroLoadoutBar
              :signature-card="heroSignatureCard"
              :known-spells="heroKnownSpells"
              :spell-summary-tooltip="heroSpellSummaryTooltip"
              :potions="heroPotions"
              :is-pre-battle-prep="store.isPreBattlePrep"
              @close="closeModal()"
              @show-tip="showTip"
              @hide-tip="hideTip"
              @tap-tip="tapTip"
            />
          </div>
        </div>
      </section>

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

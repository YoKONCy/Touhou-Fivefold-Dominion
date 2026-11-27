<script setup lang="ts">
/**
 * 英雄指挥官顶栏御览横匾 + 折叠式「进阶组合职业自由切换谱」
 *
 * 负责展示英雄等级、名讳、阵营标识、战前整备切职状态，
 * 以及战斗场景外自由切换全部 37 种进阶组合职业与查看未解锁职业图鉴。
 */
import { computed, ref, watch } from 'vue';
import type { AlignmentMeta } from '@core/alignment';
import { ALL_H4_ADVANCED_CLASS_IDS, H4_ADVANCED_CLASSES } from '@core/h4Skills';
import type { AdvancedClassDef, BattleUnit } from '@core/types';
import type { HudTooltipPayload } from '@ui/hudMetadata';
import { buildClassTooltip, formatClassRequirement } from './helpers';

const props = defineProps<{
  /** 当前展示的英雄单位 */
  unit: BattleUnit;
  /** 阵营落款朱印文案（博麗 / 霧雨） */
  factionStamp: string;
  /** 单位阵营视觉元数据 */
  alignMeta: AlignmentMeta | null;
  /** 当前生效的基础或进阶职业 */
  advancedClass: AdvancedClassDef | null;
  /** 已满足技能点条件、可切换的全部进阶职业列表 */
  eligibleClasses: AdvancedClassDef[];
  /** 玩家手动指定的进阶职业 ID（与 unit 同步以保证响应式追踪） */
  selectedAdvancedClassId: string | null | undefined;
  /** 当前是否处于战前整备/战后可自由切职配点状态 */
  canModifyHeroBuild: boolean;
  /** 是否展开进阶职业切换谱 */
  showClassPicker: boolean;
}>();

const emit = defineEmits<{
  'update:showClassPicker': [value: boolean];
  pickClass: [classId: string | null];
  returnToPrep: [];
  close: [];
  showTip: [payload: HudTooltipPayload, event: MouseEvent];
  hideTip: [];
  tapTip: [payload: HudTooltipPayload, event: MouseEvent];
}>();

/** 是否在职业切换谱底部展开未解锁职业图鉴 */
const showLockedClasses = ref(false);

watch(
  () => props.unit.id,
  () => {
    showLockedClasses.value = false;
  },
);

/** 未解锁的其余进阶职业（供玩家查看全部 37 职业配方） */
const lockedAdvancedClasses = computed<AdvancedClassDef[]>(() => {
  const eligibleIds = new Set(props.eligibleClasses.map((c) => c.id));
  return ALL_H4_ADVANCED_CLASS_IDS.filter((id) => !eligibleIds.has(id)).map((id) => H4_ADVANCED_CLASSES[id]);
});
</script>

<template>
  <!-- 顶段：指挥官御览横匾 + 可交互「37 进阶职业自由切换签」 -->
  <div class="urushi-plaque relative z-20 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2">
    <div class="flex flex-wrap items-center gap-2">
      <span class="th-hanko px-1.5 py-0.5 text-[10px]">{{ props.factionStamp }}</span>
      <span
        class="font-num border border-[#cfa75b]/60 bg-[#1a1316] px-2 py-0.5 text-[11.5px] font-bold text-[#f5df9e]"
      >
        Lv.{{ props.unit.level }}
      </span>
      <h2 class="font-display text-[17px] font-black tracking-wider text-[#f5edd8]">
        {{ props.unit.name }}
      </h2>

      <!-- H4 37 种进阶组合职业切换签（战斗场景外可自由切换至任意已满足条件的职业！） -->
      <button
        v-if="props.advancedClass"
        class="font-display flex items-center gap-1.5 border px-2.5 py-0.5 text-[11px] transition"
        :class="
          props.showClassPicker
            ? 'border-[#f5df9e] bg-[#2a3b52] text-[#fff2c2]'
            : 'border-[#6ca6e8]/55 bg-[#152233] text-[#bddcf7] hover:border-[#a6d4ff]'
        "
        @click="emit('update:showClassPicker', !props.showClassPicker)"
        @mouseenter="
          emit(
            'showTip',
            buildClassTooltip(props.advancedClass, {
              subtitle: props.canModifyHeroBuild
                ? `战前整备中 · 点击于 ${props.eligibleClasses.length} 种已达标进阶职业间切换`
                : `战斗中职业已锁定 · 已达标 ${props.eligibleClasses.length} 职，可退回战前整备切职`,
              tag: props.canModifyHeroBuild ? '点击切换职业' : '战斗锁定',
              tagTone: props.canModifyHeroBuild ? 'default' : 'muted',
              accent: '#a6d4ff',
            }),
            $event,
          )
        "
        @mouseleave="emit('hideTip')"
      >
        <span class="h-1.5 w-1.5 rotate-45 bg-[#8cc8ff]" />
        <span>{{ props.advancedClass.name }}</span>
        <span class="font-num text-[9.5px] text-[#8cc8ff]">
          ({{ props.eligibleClasses.length }}职{{ props.showClassPicker ? '▴' : '▾' }})
        </span>
      </button>

      <span
        v-if="props.alignMeta"
        class="font-display inline-flex items-center gap-1 text-[10.5px] font-semibold"
        :style="{ color: props.alignMeta.textColor }"
      >
        <span class="inline-block h-1.5 w-1.5 rotate-45" :style="{ backgroundColor: props.alignMeta.themeColor }" />
        <span>{{ props.alignMeta.factionName }} · {{ props.alignMeta.name }}</span>
      </span>
    </div>

    <div class="flex items-center gap-2">
      <!-- 战前整备状态指示 / 一键退回战前整备切职调点 -->
      <span
        v-if="props.canModifyHeroBuild"
        class="font-display border border-[#56ab80]/60 bg-[#122e24] px-2 py-0.5 text-[10px] text-[#8cf0ba]"
      >
        战前整备 · 自由切职配点中
      </span>
      <button
        v-else
        class="font-display border border-[#cfa75b]/60 bg-[#2a1d14] px-2 py-0.5 text-[10px] text-[#f5df9e] transition hover:border-[#fff0b8] hover:bg-[#3d291c]"
        title="保留当前英雄技能配点，退回第 1 回合战前整备室以自由切换进阶职业与加点"
        @click="emit('returnToPrep')"
      >
        回战前整备切职
      </button>

      <button
        class="brass-action-btn flex h-6 w-6 shrink-0 items-center justify-center"
        title="关闭 (Esc)"
        @click="emit('close')"
      >
        <svg viewBox="0 0 12 12" class="h-3 w-3" fill="none">
          <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="#d9c8a8" stroke-width="1.3" />
        </svg>
      </button>
    </div>
  </div>

  <!-- 折叠式「进阶组合职业自由切换谱」（展示全部已解锁可切职业 + 其余 37 职业配方） -->
  <div
    v-if="props.showClassPicker"
    class="washi-recess touch-scroll relative z-20 mt-2 max-h-[175px] overflow-y-auto border border-[#6ca6e8]/55 bg-[#101724]/98 p-2.5 sm:max-h-[210px]"
  >
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#6ca6e8]/30 pb-1.5">
      <div class="flex items-center gap-2">
        <span class="font-display text-[11px] font-bold text-[#a6d4ff]">
          进阶组合职业切换谱 · 已达标 {{ props.eligibleClasses.length }} / 37 职
        </span>
        <span v-if="!props.canModifyHeroBuild" class="text-[10px] text-[#e69a8a]">
          （战斗进行中不可切换，点击右上「回战前整备切职」即可保留配点自由切换）
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          v-if="props.canModifyHeroBuild && props.selectedAdvancedClassId"
          class="font-display border border-[#99763a]/55 bg-[#1b151e] px-2 py-0.5 text-[9.5px] text-[#e6cfa0] hover:border-[#f5df9e]"
          @click="emit('pickClass', null)"
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
        v-for="cls in props.eligibleClasses"
        :key="cls.id"
        class="flex flex-col items-start border px-2 py-1.5 text-left transition"
        :class="[
          props.advancedClass?.id === cls.id
            ? 'border-[#f5df9e] bg-[#2a2216] shadow-[0_0_8px_rgba(245,223,158,0.28)]'
            : props.canModifyHeroBuild
              ? 'border-[#6ca6e8]/40 bg-[#152033] hover:border-[#a6d4ff] hover:bg-[#1c2c45]'
              : 'cursor-not-allowed border-[#6ca6e8]/25 bg-[#131b29] opacity-75',
        ]"
        @click.stop="
          props.canModifyHeroBuild
            ? emit('pickClass', cls.id)
            : emit(
                'tapTip',
                buildClassTooltip(cls, {
                  subtitle: `组合条件：${formatClassRequirement(cls)}`,
                  tag: props.advancedClass?.id === cls.id ? '当前生效' : '战中锁定',
                  tagTone: props.advancedClass?.id === cls.id ? 'default' : 'muted',
                  accent: '#f5df9e',
                }),
                $event,
              )
        "
        @mouseenter="
          emit(
            'showTip',
            buildClassTooltip(cls, {
              subtitle: `组合条件：${formatClassRequirement(cls)}`,
              tag: props.advancedClass?.id === cls.id ? '当前生效' : props.canModifyHeroBuild ? '点击切换' : '战中锁定',
              tagTone: props.advancedClass?.id === cls.id || props.canModifyHeroBuild ? 'default' : 'muted',
              accent: '#f5df9e',
            }),
            $event,
          )
        "
        @mouseleave="emit('hideTip')"
      >
        <div class="flex w-full items-center justify-between gap-1">
          <span class="font-display truncate text-[10.5px] font-bold text-[#f5edd8]">{{ cls.name }}</span>
          <span
            v-if="props.advancedClass?.id === cls.id"
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
            emit(
              'showTip',
              buildClassTooltip(cls, {
                subtitle: `解锁条件：${formatClassRequirement(cls)} · 每系主子总投入 ≥ 2`,
                tag: '未达标',
                tagTone: 'muted',
                accent: '#a99b87',
              }),
              $event,
            )
          "
          @mouseleave="emit('hideTip')"
          @click.stop="
            emit(
              'tapTip',
              buildClassTooltip(cls, {
                subtitle: `解锁条件：${formatClassRequirement(cls)} · 每系主子总投入 ≥ 2`,
                tag: '未达标',
                tagTone: 'muted',
                accent: '#a99b87',
              }),
              $event,
            )
          "
        >
          <div class="font-display truncate text-[10px] text-[#c7b9a5]">{{ cls.name }}</div>
          <div class="truncate text-[8.5px] text-[#8a7d6d]">{{ formatClassRequirement(cls) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

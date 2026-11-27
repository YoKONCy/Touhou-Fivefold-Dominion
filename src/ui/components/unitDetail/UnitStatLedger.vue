<script setup lang="ts">
/**
 * HoMM4 连体黄铜 2×7 雕刻属性数表
 *
 * 兵种大窗（宽版，末格展示兵种等阶徽章）与英雄档案（紧凑版）共用此组件。
 */
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import TierBadgeIcon from '@ui/components/TierBadgeIcon.vue';
import { useViewportInput } from '@ui/composables/useViewportInput';
import type { HudTooltipPayload } from '@ui/hudMetadata';
import type { StatCellItem } from './helpers';

const props = withDefaults(
  defineProps<{
    /** 上下两行共 14 格属性数据 */
    statRows: { top: StatCellItem[]; bottom: StatCellItem[] };
    /** 布局变体：creature 宽版 / hero 紧凑版 */
    variant: 'creature' | 'hero';
    /** 兵种等阶（仅 creature 变体的 tier 格使用） */
    creatureTier?: number;
  }>(),
  {
    creatureTier: 1,
  },
);

const emit = defineEmits<{
  showTip: [payload: HudTooltipPayload, event: MouseEvent];
  hideTip: [];
  tapTip: [payload: HudTooltipPayload, event: MouseEvent];
}>();

const { isTinyHeight } = useViewportInput();
</script>

<template>
  <div
    class="brass-ledger grid grid-cols-7 gap-px"
    :class="props.variant === 'creature' ? (isTinyHeight ? 'relative z-10 mt-2' : 'relative z-10 mt-3.5') : ''"
  >
    <div
      v-for="cell in props.statRows.top"
      :key="cell.key"
      class="brass-ledger-cell flex cursor-help flex-col items-center justify-center"
      :class="props.variant === 'creature' ? (isTinyHeight ? 'py-1.5' : 'py-2') : (isTinyHeight ? 'py-1' : 'py-1.5')"
      @mouseenter="emit('showTip', cell.tooltip, $event)"
      @mouseleave="emit('hideTip')"
      @click.stop="emit('tapTip', cell.tooltip, $event)"
    >
      <PixelBadgeIcon :name="cell.icon" :size-class="props.variant === 'creature' && !isTinyHeight ? 'h-5.5 w-5.5' : 'h-4.5 w-4.5'" />
      <div
        class="font-num font-bold leading-none"
        :class="props.variant === 'creature' && !isTinyHeight ? 'mt-1 text-[12.5px]' : 'mt-0.5 text-[11px]'"
        :style="{ color: cell.accent }"
      >
        {{ cell.value }}
      </div>
    </div>

    <div
      v-for="cell in props.statRows.bottom"
      :key="cell.key"
      class="brass-ledger-cell flex cursor-help flex-col items-center justify-center"
      :class="[
        props.variant === 'creature' ? (isTinyHeight ? 'py-1.5' : 'py-2') : (isTinyHeight ? 'py-1' : 'py-1.5'),
        { 'opacity-40': cell.muted },
      ]"
      @mouseenter="emit('showTip', cell.tooltip, $event)"
      @mouseleave="emit('hideTip')"
      @click.stop="emit('tapTip', cell.tooltip, $event)"
    >
      <template v-if="props.variant === 'creature' && cell.key === 'tier'">
        <TierBadgeIcon :tier="props.creatureTier" :size="isTinyHeight ? 'sm' : 'md'" :show-title="false" />
        <div class="font-display mt-0.5 text-[9.5px] font-semibold leading-none text-[#d7c6a5]">
          等阶
        </div>
      </template>
      <template v-else>
        <PixelBadgeIcon
          :name="cell.icon"
          :size-class="props.variant === 'creature' && !isTinyHeight ? 'h-5.5 w-5.5' : 'h-4.5 w-4.5'"
        />
        <div
          class="font-num font-bold leading-none"
          :class="props.variant === 'creature' && !isTinyHeight ? 'mt-1 text-[12px]' : 'mt-0.5 text-[10.5px]'"
          :style="{ color: cell.muted ? '#75685a' : cell.accent }"
        >
          {{ cell.value }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 20 格 Buff/Debuff 专属图标状态矩阵（2×10 雕版微格，FIFO 顶替上限 20）
 *
 * 兵种大窗与英雄档案复用同一矩阵结构，仅通过 variant 区分微格高度与空槽描边透明度。
 */
import { MAX_UNIT_BUFF_SLOTS } from '@core/statusCap';
import { getSpellIconDataUrl } from '@renderer/spellIcons';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import { useViewportInput } from '@ui/composables/useViewportInput';
import type { HudIconBadge, HudTooltipPayload } from '@ui/hudMetadata';

const props = defineProps<{
  /** 当前生效的状态徽章列表（按进入顺序排布） */
  statusBadges: HudIconBadge[];
  /** 样式变体：兵种大窗 28px 高 / 英雄档案 27px 高 */
  variant: 'creature' | 'hero';
}>();

const emit = defineEmits<{
  showTip: [payload: HudTooltipPayload, event: MouseEvent];
  hideTip: [];
  tapTip: [payload: HudTooltipPayload, event: MouseEvent];
}>();

const { isTinyHeight } = useViewportInput();
</script>

<template>
  <div class="grid grid-cols-10 gap-1">
    <div
      v-for="idx in MAX_UNIT_BUFF_SLOTS"
      :key="idx"
      class="enamel-crest relative flex w-full items-center justify-center border transition"
      :class="[
        isTinyHeight ? 'h-[23px]' : props.variant === 'creature' ? 'h-[28px]' : 'h-[27px]',
        props.statusBadges[idx - 1] ? 'cursor-help hover:scale-105' : '',
      ]"
      :style="
        props.statusBadges[idx - 1]
          ? {
              backgroundColor: props.statusBadges[idx - 1].bg,
              borderColor: props.statusBadges[idx - 1].border,
            }
          : {
              backgroundColor: 'rgba(13, 10, 16, 0.92)',
              borderColor:
                props.variant === 'creature'
                  ? 'rgba(153, 118, 58, 0.24)'
                  : 'rgba(153, 118, 58, 0.22)',
            }
      "
      @mouseenter="props.statusBadges[idx - 1] && emit('showTip', props.statusBadges[idx - 1].tooltip, $event)"
      @mouseleave="emit('hideTip')"
      @click.stop="props.statusBadges[idx - 1] && emit('tapTip', props.statusBadges[idx - 1].tooltip, $event)"
    >
      <template v-if="props.statusBadges[idx - 1]">
        <img
          v-if="props.statusBadges[idx - 1].spellIconId"
          :src="getSpellIconDataUrl(props.statusBadges[idx - 1].spellIconId!)"
          :alt="props.statusBadges[idx - 1].shortLabel"
          class="pixel-art h-6 w-6"
        />
        <PixelBadgeIcon v-else :name="props.statusBadges[idx - 1].icon" size-class="h-4.5 w-4.5" />
        <span
          v-if="props.statusBadges[idx - 1].roundsBadge"
          class="font-num absolute bottom-0 right-0 bg-[#0b0910]/90 px-0.5 text-[7.5px] font-bold leading-none text-[#f5df9e]"
        >
          {{ props.statusBadges[idx - 1].roundsBadge }}
        </span>
      </template>
      <svg v-else viewBox="0 0 12 12" class="h-2 w-2 opacity-18" fill="none">
        <path d="M6 2V10M2 6H10" stroke="#cfa75b" stroke-width="0.9" />
      </svg>
    </div>
  </div>
</template>

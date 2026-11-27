<script setup lang="ts">
/**
 * 英雄底段快捷军备轨（专属符卡 + 已习得术式印/万象魔导总录 + 腰带秘药槽 + 翡翠玉玺确认键）
 */
import { getSpellIconDataUrl } from '@renderer/spellIcons';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import type { HudTooltipPayload } from '@ui/hudMetadata';
import type { HeroKnownSpellItem, HeroPotionItem, HeroSignatureCardItem } from './helpers';

const props = defineProps<{
  /** 英雄专属符卡项 */
  signatureCard: HeroSignatureCardItem | null;
  /** 已习得术式列表 */
  knownSpells: HeroKnownSpellItem[];
  /** 超过 6 术时的「万象魔导总录」聚合提示 */
  spellSummaryTooltip: HudTooltipPayload | null;
  /** 腰带战斗秘药槽列表 */
  potions: HeroPotionItem[];
  /** 当前是否处于战前整备模式（决定确认按钮提示文案） */
  isPreBattlePrep: boolean;
}>();

const emit = defineEmits<{
  close: [];
  showTip: [payload: HudTooltipPayload, event: MouseEvent];
  hideTip: [];
  tapTip: [payload: HudTooltipPayload, event: MouseEvent];
}>();
</script>

<template>
  <div class="flex items-end gap-2.5">
    <div class="washi-recess flex flex-1 flex-wrap items-center justify-between gap-2 px-2.5 py-1.5">
      <div class="flex items-center gap-1.5">
        <div
          v-if="props.signatureCard"
          class="enamel-crest flex h-8.5 w-8.5 cursor-help items-center justify-center border border-[#f5df9e] bg-gradient-to-br from-[#5c1a2a] to-[#302014] shadow-[0_0_10px_rgba(240,195,74,0.3)]"
          @mouseenter="emit('showTip', props.signatureCard.tooltip, $event)"
          @mouseleave="emit('hideTip')"
          @click.stop="emit('tapTip', props.signatureCard.tooltip, $event)"
        >
          <PixelBadgeIcon name="spell_card" size-class="h-4.5 w-4.5" />
        </div>
        <div
          v-if="props.knownSpells.length > 6 && props.spellSummaryTooltip"
          class="enamel-crest flex h-8.5 cursor-help items-center gap-1.5 border border-[#cfa75b] bg-gradient-to-r from-[#2c1b28] via-[#1c1a2e] to-[#1a2b24] px-2.5"
          @mouseenter="emit('showTip', props.spellSummaryTooltip, $event)"
          @mouseleave="emit('hideTip')"
          @click.stop="emit('tapTip', props.spellSummaryTooltip, $event)"
        >
          <PixelBadgeIcon name="spell_orb" size-class="h-4.5 w-4.5" />
          <div class="leading-tight">
            <div class="font-display text-[9.5px] font-bold text-[#f5df9e]">万象魔导总录</div>
            <div class="font-num text-[8.5px] text-[#9bc4ed]">已习得 {{ props.knownSpells.length }} 术</div>
          </div>
        </div>
        <template v-else>
          <div
            v-for="sp in props.knownSpells"
            :key="sp.id"
            class="enamel-crest relative flex h-8.5 w-8.5 cursor-help items-center justify-center border bg-[#16121b]"
            :style="{ borderColor: `${sp.color}88` }"
            @mouseenter="emit('showTip', sp.tooltip, $event)"
            @mouseleave="emit('hideTip')"
            @click.stop="emit('tapTip', sp.tooltip, $event)"
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
          v-for="pot in props.potions"
          :key="pot.id"
          class="enamel-crest relative flex h-8.5 w-8.5 cursor-help items-center justify-center border bg-[#121c18]"
          :class="pot.charges > 0 ? 'border-[#52b386]/70' : 'border-[#99763a]/25 opacity-35'"
          @mouseenter="emit('showTip', pot.tooltip, $event)"
          @mouseleave="emit('hideTip')"
          @click.stop="emit('tapTip', pot.tooltip, $event)"
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
      :title="props.isPreBattlePrep ? '确认整备并开战 (Esc)' : '确认 (Esc)'"
      @click="emit('close')"
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
</template>

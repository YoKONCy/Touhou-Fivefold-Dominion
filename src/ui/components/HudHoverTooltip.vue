<script setup lang="ts">
/**
 * 雕版漆金鉴赏笺（Hover 统一悬浮详情浮窗）
 * 支持「双胶囊（阵营 + 极性/生物类型）+ 简介 + 语义着色客观效果 + 可选斜体小字彩蛋」排版，并自动防屏幕边缘裁切。
 */
import { computed } from 'vue';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import RichSemanticText from '@ui/components/RichSemanticText.vue';
import type { HudTooltipPayload } from '@ui/hudMetadata';

const props = defineProps<{
  payload: HudTooltipPayload | null;
  x: number;
  y: number;
}>();

const boxStyle = computed(() => {
  const w = 290;
  const p = props.payload;
  const approxH =
    98 +
    (p?.badges?.length ? 22 : 0) +
    (p?.summary ? 26 : 0) +
    (p?.lines.length ?? 0) * 21 +
    (p?.flavor ? 32 : 0);
  const maxX = Math.max(12, window.innerWidth - w - 16);
  const maxY = Math.max(12, window.innerHeight - approxH - 16);
  const left = props.x + 18 + w > window.innerWidth ? Math.max(12, props.x - w - 14) : Math.min(maxX, props.x + 16);
  const top = Math.min(maxY, Math.max(12, props.y - 14));
  return { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` };
});

const tagClass = computed(() => {
  if (props.payload?.tagTone === 'danger') {
    return 'border-[#d65a6c]/65 bg-[#31131a] text-[#ff9aa8]';
  }
  if (props.payload?.tagTone === 'muted') {
    return 'border-[#6d6375]/50 bg-[#1a1620] text-[#a9a0b2]';
  }
  return 'border-[#99763a]/50 bg-[#1c151c] text-[#e6d6b8]';
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="payload"
      class="urushi-slip pointer-events-none fixed z-[80] w-[290px] px-3.5 py-2.5 text-[11px]"
      :style="boxStyle"
    >
      <!-- 左侧朱砂/主题色垂直饰条 -->
      <span
        class="absolute inset-y-1.5 left-0 w-[2.5px]"
        :style="{ backgroundColor: payload.accent ?? '#cfa75b' }"
      />

      <!-- 极简四角黄铜微钉 -->
      <span class="absolute right-1 top-1 h-1 w-1 rotate-45 bg-[#cfa75b]/65" />
      <span class="absolute bottom-1 right-1 h-1 w-1 rotate-45 bg-[#cfa75b]/65" />

      <div class="flex items-start justify-between gap-2 border-b border-[#99763a]/40 pb-1.5">
        <div class="min-w-0">
          <div
            class="font-display text-[12.5px] font-bold leading-snug"
            :style="{ color: payload.accent ?? '#f5df9e' }"
          >
            {{ payload.title }}
          </div>
          <div v-if="payload.subtitle" class="mt-0.5 text-[10px] text-[#a99b87]">
            <RichSemanticText :text="payload.subtitle" :show-inline-icons="false" />
          </div>
        </div>
        <span
          v-if="payload.tag"
          class="font-num shrink-0 border px-1.5 py-0.5 text-[9.5px] font-semibold"
          :class="tagClass"
        >
          {{ payload.tag }}
        </span>
      </div>

      <!-- 阵营 / 极性 / 生物类型彩色胶囊行 -->
      <div v-if="payload.badges && payload.badges.length > 0" class="mt-1.5 flex flex-wrap items-center gap-1">
        <span
          v-for="(b, bIdx) in payload.badges"
          :key="bIdx"
          class="font-display inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9.5px] font-semibold leading-none"
          :style="{ color: b.color, backgroundColor: b.bg, borderColor: b.border }"
        >
          <PixelBadgeIcon v-if="b.icon" :name="b.icon" size-class="h-3 w-3 shrink-0" />
          <span>{{ b.label }}</span>
        </span>
      </div>

      <!-- 一、简短简介 -->
      <div
        v-if="payload.summary"
        class="mt-1.5 text-[11px] font-medium leading-snug text-[#f2e6cf]"
      >
        <RichSemanticText :text="payload.summary" />
      </div>

      <!-- 二、客观效果（自动着色阵营/生物类型/数值） -->
      <div
        v-if="payload.lines.length > 0"
        class="space-y-1 leading-relaxed text-[#cfc4b2]"
        :class="payload.summary ? 'mt-1' : 'mt-1.5'"
      >
        <div v-for="(line, idx) in payload.lines" :key="idx">
          <RichSemanticText :text="line" />
        </div>
      </div>

      <!-- 三、可选斜体小字彩蛋文本 -->
      <div
        v-if="payload.flavor"
        class="mt-2 border-t border-[#99763a]/28 pt-1.5 text-[10px] italic leading-snug text-[#9d8f79]"
      >
        {{ payload.flavor }}
      </div>
    </div>
  </Teleport>
</template>

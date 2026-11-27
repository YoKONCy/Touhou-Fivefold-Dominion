<script setup lang="ts">
/**
 * 语义着色富文本渲染器（纯 Token 遍历，零 v-html）
 * 自动将六大阵营、东方势力、特殊生物类型（含内联像素微标）与正负数值增减高亮渲染。
 */
import { computed } from 'vue';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import { tokenizeSemanticText } from '@ui/semanticFormat';

const props = withDefaults(
  defineProps<{
    text: string;
    showInlineIcons?: boolean;
  }>(),
  {
    showInlineIcons: true,
  },
);

const tokens = computed(() => tokenizeSemanticText(props.text));
</script>

<template>
  <span>
    <template v-for="(tok, idx) in tokens" :key="idx">
      <span v-if="tok.kind === 'plain'">{{ tok.text }}</span>
      <span
        v-else-if="tok.kind === 'alignment'"
        class="font-semibold"
        :style="{ color: tok.color }"
      >{{ tok.text }}</span>
      <span
        v-else-if="tok.kind === 'creatureType'"
        class="inline-flex items-center font-semibold"
        :style="{ color: tok.color }"
      >
        <PixelBadgeIcon
          v-if="showInlineIcons && tok.icon"
          :name="tok.icon"
          size-class="mr-0.5 inline-block h-3 w-3 shrink-0"
        />{{ tok.text }}
      </span>
      <span
        v-else
        class="font-num font-semibold"
        :style="{ color: tok.color }"
      >{{ tok.text }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
/**
 * 兵种等阶罗马数字漆金徽章（I / II / III / IV）
 * - 纯矢量切角八角印章底托 + 雕刻衬线罗马数字，任何尺寸下锐利清晰、零字体回退偏差
 * - 四阶独立材质配色：一阶古铜 / 二阶月银 / 三阶鎏金 / 四阶绯金御印
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    tier: number;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** 是否显示原生中文悬停提示 */
    showTitle?: boolean;
  }>(),
  {
    size: 'md',
    showTitle: true,
  },
);

const clampedTier = computed(() => Math.max(1, Math.min(4, Math.round(props.tier || 1))));

const ROMAN_META: Record<
  number,
  {
    roman: string;
    label: string;
    bgTop: string;
    bgBot: string;
    border: string;
    innerBorder: string;
    glyph: string;
    glyphShadow: string;
    cornerGem: string;
  }
> = {
  1: {
    roman: 'I',
    label: '一阶兵种 (Tier I)',
    bgTop: '#2c221b',
    bgBot: '#18120e',
    border: '#b58d5e',
    innerBorder: 'rgba(218, 182, 134, 0.35)',
    glyph: '#e8cfa6',
    glyphShadow: '#3d2814',
    cornerGem: '#c9a06d',
  },
  2: {
    roman: 'II',
    label: '二阶兵种 (Tier II)',
    bgTop: '#1d2a38',
    bgBot: '#101720',
    border: '#98bdd9',
    innerBorder: 'rgba(186, 224, 250, 0.42)',
    glyph: '#e2f2ff',
    glyphShadow: '#162d45',
    cornerGem: '#8ad4ff',
  },
  3: {
    roman: 'III',
    label: '三阶精锐兵种 (Tier III)',
    bgTop: '#382914',
    bgBot: '#1d140a',
    border: '#eab955',
    innerBorder: 'rgba(255, 228, 150, 0.48)',
    glyph: '#fff0b3',
    glyphShadow: '#4a2f08',
    cornerGem: '#ffd86b',
  },
  4: {
    roman: 'IV',
    label: '四阶终极兵种 (Tier IV)',
    bgTop: '#4a1423',
    bgBot: '#210912',
    border: '#f0b85b',
    innerBorder: 'rgba(255, 128, 152, 0.55)',
    glyph: '#ffe8a3',
    glyphShadow: '#5e0f20',
    cornerGem: '#ff667e',
  },
};

const meta = computed(() => ROMAN_META[clampedTier.value] ?? ROMAN_META[1]);

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-[18px] w-[24px]';
    case 'sm':
      return 'h-[20px] w-[28px]';
    case 'lg':
      return 'h-[28px] w-[40px]';
    default:
      return 'h-[24px] w-[34px]';
  }
});
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center select-none"
    :class="sizeClass"
    :title="showTitle ? meta.label : undefined"
    :aria-label="meta.label"
  >
    <svg viewBox="0 0 36 24" class="h-full w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">
      <defs>
        <linearGradient :id="`tier-bg-${clampedTier}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="meta.bgTop" />
          <stop offset="100%" :stop-color="meta.bgBot" />
        </linearGradient>
      </defs>

      <!-- 外层切角八角漆金印章底座 -->
      <polygon
        points="5,1 31,1 35,5 35,19 31,23 5,23 1,19 1,5"
        :fill="`url(#tier-bg-${clampedTier})`"
        :stroke="meta.border"
        stroke-width="1.4"
      />
      <!-- 内嵌细金框 -->
      <polygon
        points="6.5,3 29.5,3 33,6.5 33,17.5 29.5,21 6.5,21 3,17.5 3,6.5"
        fill="none"
        :stroke="meta.innerBorder"
        stroke-width="0.75"
      />
      <!-- 左右细菱钉点缀 -->
      <polygon points="5,12 6.4,10.6 7.8,12 6.4,13.4" :fill="meta.cornerGem" opacity="0.85" />
      <polygon points="28.2,12 29.6,10.6 31,12 29.6,13.4" :fill="meta.cornerGem" opacity="0.85" />

      <!-- 雕刻衬线罗马数字（双层阴影 + 亮面主体，精准居中） -->
      <g v-if="clampedTier === 1">
        <!-- I -->
        <g transform="translate(0, 0.8)" :fill="meta.glyphShadow">
          <rect x="14.2" y="6.2" width="7.6" height="1.8" />
          <rect x="16.8" y="7.5" width="2.4" height="9" />
          <rect x="14.2" y="16" width="7.6" height="1.8" />
        </g>
        <g :fill="meta.glyph">
          <rect x="14.2" y="6.2" width="7.6" height="1.7" />
          <rect x="16.8" y="7.4" width="2.4" height="9.2" />
          <rect x="14.2" y="16" width="7.6" height="1.7" />
        </g>
      </g>

      <g v-else-if="clampedTier === 2">
        <!-- II -->
        <g transform="translate(0, 0.8)" :fill="meta.glyphShadow">
          <rect x="12.2" y="6.2" width="11.6" height="1.7" />
          <rect x="14.2" y="7.4" width="2.3" height="9.2" />
          <rect x="19.5" y="7.4" width="2.3" height="9.2" />
          <rect x="12.2" y="16" width="11.6" height="1.7" />
        </g>
        <g :fill="meta.glyph">
          <rect x="12.2" y="6.2" width="11.6" height="1.65" />
          <rect x="14.2" y="7.4" width="2.3" height="9.2" />
          <rect x="19.5" y="7.4" width="2.3" height="9.2" />
          <rect x="12.2" y="16" width="11.6" height="1.65" />
        </g>
      </g>

      <g v-else-if="clampedTier === 3">
        <!-- III -->
        <g transform="translate(0, 0.8)" :fill="meta.glyphShadow">
          <rect x="10.2" y="6.2" width="15.6" height="1.7" />
          <rect x="11.9" y="7.4" width="2.1" height="9.2" />
          <rect x="16.95" y="7.4" width="2.1" height="9.2" />
          <rect x="22" y="7.4" width="2.1" height="9.2" />
          <rect x="10.2" y="16" width="15.6" height="1.7" />
        </g>
        <g :fill="meta.glyph">
          <rect x="10.2" y="6.2" width="15.6" height="1.65" />
          <rect x="11.9" y="7.4" width="2.1" height="9.2" />
          <rect x="16.95" y="7.4" width="2.1" height="9.2" />
          <rect x="22" y="7.4" width="2.1" height="9.2" />
          <rect x="10.2" y="16" width="15.6" height="1.65" />
        </g>
      </g>

      <g v-else>
        <!-- IV -->
        <g transform="translate(0, 0.8)" :fill="meta.glyphShadow">
          <rect x="10.2" y="6.2" width="5.2" height="1.65" />
          <rect x="11.8" y="7.4" width="2.1" height="9.2" />
          <rect x="10.2" y="16" width="5.2" height="1.65" />
          <polygon points="16.4,6.2 19.2,6.2 21.5,14.1 23.8,6.2 26.4,6.2 22.7,17.7 20.3,17.7" />
          <rect x="15.8" y="6.2" width="4.2" height="1.5" />
          <rect x="23" y="6.2" width="4" height="1.5" />
        </g>
        <g :fill="meta.glyph">
          <rect x="10.2" y="6.2" width="5.2" height="1.6" />
          <rect x="11.8" y="7.4" width="2.1" height="9.2" />
          <rect x="10.2" y="16" width="5.2" height="1.6" />
          <polygon points="16.4,6.2 19.1,6.2 21.5,14.2 23.9,6.2 26.4,6.2 22.7,17.7 20.3,17.7" />
          <rect x="15.8" y="6.2" width="4.1" height="1.45" />
          <rect x="23" y="6.2" width="3.9" height="1.45" />
        </g>
      </g>
    </svg>
  </span>
</template>

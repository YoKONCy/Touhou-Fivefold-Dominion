<script setup lang="ts">
/**
 * 纯代码和风古金雕花角饰与分隔纹样组件（零静态图，任意 DPI 矢量化锐利）
 * - corners: 四角阶梯黄铜回纹 + 菱形铆钉 + 细金内线
 * - divider: 中央菱纹双细金分隔线
 * - roller: 传统和风挂轴木杆端头（用于右侧指令柱上下收口）
 */
defineProps<{
  variant: 'corners' | 'divider' | 'roller';
  compact?: boolean;
}>();

// 避免同一页面渲染多根挂轴木杆时 SVG 渐变 ID 冲突
const rollerGradId = `rollerGrad_${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <!-- 1. 四角古金回纹角饰（绝对定位覆盖在任意漆金面板上，完全不阻挡交互） -->
  <div v-if="variant === 'corners'" class="pointer-events-none absolute inset-0 overflow-hidden">
    <!-- 左上角 -->
    <svg
      :class="compact ? 'h-4 w-4' : 'h-6 w-6'"
      class="absolute left-0.5 top-0.5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M1 18V5L5 1H18" stroke="#cfa75b" stroke-width="1.4" />
      <path d="M4 14V7L7 4H14" stroke="#f5df9e" stroke-opacity="0.55" stroke-width="0.8" />
      <rect x="4" y="4" width="2.4" height="2.4" transform="rotate(45 5.2 5.2)" fill="#f5df9e" />
    </svg>
    <!-- 右上角 -->
    <svg
      :class="compact ? 'h-4 w-4' : 'h-6 w-6'"
      class="absolute right-0.5 top-0.5 -scale-x-100"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M1 18V5L5 1H18" stroke="#cfa75b" stroke-width="1.4" />
      <path d="M4 14V7L7 4H14" stroke="#f5df9e" stroke-opacity="0.55" stroke-width="0.8" />
      <rect x="4" y="4" width="2.4" height="2.4" transform="rotate(45 5.2 5.2)" fill="#f5df9e" />
    </svg>
    <!-- 左下角 -->
    <svg
      :class="compact ? 'h-4 w-4' : 'h-6 w-6'"
      class="absolute bottom-0.5 left-0.5 -scale-y-100"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M1 18V5L5 1H18" stroke="#cfa75b" stroke-width="1.4" />
      <path d="M4 14V7L7 4H14" stroke="#f5df9e" stroke-opacity="0.55" stroke-width="0.8" />
      <rect x="4" y="4" width="2.4" height="2.4" transform="rotate(45 5.2 5.2)" fill="#f5df9e" />
    </svg>
    <!-- 右下角 -->
    <svg
      :class="compact ? 'h-4 w-4' : 'h-6 w-6'"
      class="absolute bottom-0.5 right-0.5 -scale-x-100 -scale-y-100"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M1 18V5L5 1H18" stroke="#cfa75b" stroke-width="1.4" />
      <path d="M4 14V7L7 4H14" stroke="#f5df9e" stroke-opacity="0.55" stroke-width="0.8" />
      <rect x="4" y="4" width="2.4" height="2.4" transform="rotate(45 5.2 5.2)" fill="#f5df9e" />
    </svg>
  </div>

  <!-- 2. 菱纹古金分隔线 -->
  <div v-else-if="variant === 'divider'" class="flex w-full items-center gap-2 select-none">
    <div class="h-px flex-1 bg-gradient-to-r from-transparent via-[#99763a]/70 to-[#cfa75b]" />
    <svg viewBox="0 0 18 10" class="h-2.5 w-4.5 shrink-0" fill="none">
      <path d="M9 1L14 5L9 9L4 5Z" stroke="#cfa75b" stroke-width="1" fill="#2b1f1a" />
      <circle cx="9" cy="5" r="1.3" fill="#f5df9e" />
      <circle cx="1.5" cy="5" r="0.9" fill="#99763a" />
      <circle cx="16.5" cy="5" r="0.9" fill="#99763a" />
    </svg>
    <div class="h-px flex-1 bg-gradient-to-l from-transparent via-[#99763a]/70 to-[#cfa75b]" />
  </div>

  <!-- 3. 传统和风漆木挂轴横杆（带黄铜轴头与朱绳结） -->
  <div v-else class="flex w-full items-center justify-center px-1 select-none">
    <svg viewBox="0 0 84 12" class="h-3 w-[82px]" fill="none">
      <!-- 左右黄铜卷轴端帽 -->
      <rect x="1" y="2" width="6" height="8" rx="1" fill="#8f6b32" stroke="#f5df9e" stroke-width="0.6" />
      <rect x="77" y="2" width="6" height="8" rx="1" fill="#8f6b32" stroke="#f5df9e" stroke-width="0.6" />
      <!-- 主漆木轴杆 -->
      <rect x="7" y="3" width="70" height="6" :fill="`url(#${rollerGradId})`" stroke="#57401e" stroke-width="0.7" />
      <!-- 左右朱砂细绳圈 -->
      <rect x="12" y="3" width="2.2" height="6" fill="#b92c3b" />
      <rect x="69.8" y="3" width="2.2" height="6" fill="#b92c3b" />
      <!-- 中央金菱徽 -->
      <path d="M42 2.2L46 6L42 9.8L38 6Z" fill="#cfa75b" stroke="#22170e" stroke-width="0.7" />
      <circle cx="42" cy="6" r="1.2" fill="#fff3cc" />
      <defs>
        <linearGradient :id="rollerGradId" x1="0" y1="3" x2="0" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#4e3722" />
          <stop offset="35%" stop-color="#7c5b34" />
          <stop offset="65%" stop-color="#3c2918" />
          <stop offset="100%" stop-color="#1e130c" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

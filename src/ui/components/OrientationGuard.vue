<script setup lang="ts">
/**
 * 移动端竖屏旋转建议遮罩
 * 当检测到用户在窄屏手机上竖屏打开游戏时，以幽夜蒔絵风格提示横屏游览以获得完整六边形战场视野；
 * 同时保留「仍以竖屏继续」按钮，不强行阻断用户临时查阅。
 */
import OrnamentalFrame from '@ui/components/OrnamentalFrame.vue';
import { useViewportInput } from '@ui/composables/useViewportInput';

const { isPortraitMobile, portraitPromptDismissed, dismissPortraitPrompt } = useViewportInput();
</script>

<template>
  <transition name="orient-fade">
    <div
      v-if="isPortraitMobile && !portraitPromptDismissed"
      class="portrait-only-guard fixed inset-0 z-[95] flex items-center justify-center bg-[#07050a]/92 px-6 select-none"
    >
      <div class="urushi-frame relative flex w-full max-w-[320px] flex-col items-center px-6 py-6 text-center">
        <OrnamentalFrame variant="corners" compact />

        <span class="th-hanko px-2.5 py-1 text-xs">横屏推荐</span>

        <!-- 动态旋转设备像素风线框图标 -->
        <div class="mt-4 flex h-16 w-16 items-center justify-center border border-[#cfa75b]/45 bg-[#140f17]">
          <svg
            viewBox="0 0 36 36"
            class="h-11 w-11 animate-rotate-device text-[#f5df9e]"
            fill="none"
          >
            <rect
              x="10"
              y="5"
              width="16"
              height="26"
              rx="2"
              stroke="#cfa75b"
              stroke-width="2"
              fill="#221922"
            />
            <line x1="15" y1="27.5" x2="21" y2="27.5" stroke="#f5df9e" stroke-width="1.6" stroke-linecap="round" />
            <path d="M5 13C4.5 9.5 6.8 6.5 10 5.5" stroke="#8be8be" stroke-width="1.5" stroke-linecap="round" />
            <path d="M3.5 11.5L5.2 13.8L7.2 11.4" stroke="#8be8be" stroke-width="1.4" stroke-linecap="round" />
          </svg>
        </div>

        <h2 class="font-display mt-3.5 text-base font-black tracking-wider text-[#f5edd8]">
          请将设备横置以展开幻想棋盘
        </h2>
        <p class="mt-2 text-[11px] leading-relaxed text-[#cabba2]">
          《东方五律战记》已专为移动端横屏优化：支持轻触预览 + 二次轻触确认、滑动棋盘实时算伤、长按单位查看完整档案。
        </p>

        <div class="my-3.5 w-full">
          <OrnamentalFrame variant="divider" />
        </div>

        <button
          class="brass-action-btn font-display w-full py-2 text-xs font-bold text-[#e5d5b5]"
          @click="dismissPortraitPrompt()"
        >
          仍以竖屏继续浏览
        </button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.orient-fade-enter-active,
.orient-fade-leave-active {
  transition: opacity 0.2s ease;
}
.orient-fade-enter-from,
.orient-fade-leave-to {
  opacity: 0;
}
@keyframes rotateDevice {
  0%,
  22% {
    transform: rotate(0deg);
  }
  55%,
  80% {
    transform: rotate(-90deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
.animate-rotate-device {
  animation: rotateDevice 2.6s ease-in-out infinite;
}
/* 双重兜底：横屏媒体查询下绝不显示竖屏提示遮罩 */
@media (orientation: landscape) {
  .portrait-only-guard {
    display: none !important;
  }
}
</style>

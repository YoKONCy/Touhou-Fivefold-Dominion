<script setup lang="ts">
/**
 * 移动端触控战术确认条（TouchActionBar）
 *
 * 专为触屏无 Hover / 无右键场景打造：
 * - 轻触任意棋盘格/单位后，于舞台底端居中浮出，清晰展示移动/攻击预估伤/施法诊断
 * - 提供「确认执行」「换落脚（近战多向）」「详情（替代右键）」「取消（替代右键/Esc）」一键操作
 * - 再次轻触同一目标格亦可直接确认，兼顾零误触与高节奏手操体验
 */
import { computed } from 'vue';
import { useBattleStore } from '@ui/battleStore';

const store = useBattleStore();
const summary = computed(() => store.touchActionSummary);

const badgeCls = computed(() => {
  const tone = summary.value?.badgeTone;
  if (tone === 'danger') return 'border-[#e04b5a]/75 bg-[#3d1019] text-[#ffb8c2]';
  if (tone === 'warn') return 'border-[#e0a84c]/75 bg-[#3d2910] text-[#ffe19c]';
  if (tone === 'jade') return 'border-[#54d4a8]/70 bg-[#10382e] text-[#a6ffdf]';
  if (tone === 'mana') return 'border-[#8a6ce0]/70 bg-[#23153b] text-[#dfc4ff]';
  return 'border-[#cfa75b]/70 bg-[#2e2214] text-[#f5df9e]';
});

function handleInspect(): void {
  const uid = summary.value?.inspectUnitId;
  if (!uid) return;
  store.openUnitDetail(uid, {
    x: Math.round(window.innerWidth * 0.5),
    y: Math.round(window.innerHeight * 0.5),
  });
}
</script>

<template>
  <transition name="touch-bar-slide">
    <div
      v-if="summary"
      class="pointer-events-none absolute inset-x-2 bottom-2 z-30 flex justify-center select-none"
      style="padding-bottom: env(safe-area-inset-bottom, 0px);"
    >
      <div
        class="urushi-slip pointer-events-auto flex max-w-full flex-wrap items-center justify-between gap-2 border-[#cfa75b]/80 px-2.5 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.88)]"
      >
        <!-- 左侧：战术状态摘要 -->
        <div class="flex min-w-0 max-w-[300px] flex-col">
          <div class="flex items-center gap-1.5">
            <span
              v-if="summary.badgeText"
              class="font-num shrink-0 border px-1 py-px text-[9px] font-bold leading-tight"
              :class="badgeCls"
            >
              {{ summary.badgeText }}
            </span>
            <span class="font-display truncate text-[11.5px] font-bold text-[#f7eedc]">
              {{ summary.title }}
            </span>
          </div>
          <div class="font-num mt-0.5 truncate text-[10px] text-[#cbbca6]">
            {{ summary.detail }}
          </div>
        </div>

        <!-- 右侧：一键触控动作按钮群 -->
        <div class="flex shrink-0 items-center gap-1.5">
          <!-- 近战多落脚点切换按钮 -->
          <button
            v-if="summary.approachCount > 1"
            class="brass-action-btn font-display flex min-h-[30px] items-center gap-1 px-2 text-[10.5px] font-bold text-[#ffe5a3]"
            @click.stop="store.cycleMeleeApproach()"
          >
            <span>换位</span>
            <span class="font-num text-[9.5px] text-[#d6be86]">
              {{ summary.approachIndex + 1 }}/{{ summary.approachCount }}
            </span>
          </button>

          <!-- 单位详情按钮（显式替代右键查档案） -->
          <button
            v-if="summary.inspectUnitId"
            class="brass-action-btn font-display min-h-[30px] px-2.5 text-[10.5px] font-bold text-[#bde0ff]"
            @click.stop="handleInspect()"
          >
            详情
          </button>

          <!-- 确认执行主按钮 -->
          <button
            v-if="summary.canConfirm"
            class="jade-seal-btn font-display min-h-[30px] px-3 text-[11px] font-bold text-[#ecfff5]"
            @click.stop="store.confirmTouchAction()"
          >
            {{ summary.confirmLabel }}
          </button>

          <!-- 取消按钮（替代右键取消 / Esc） -->
          <button
            class="brass-action-btn font-display min-h-[30px] px-2 text-[10.5px] text-[#f0b4bc]"
            @click.stop="store.cancelTouchPreview()"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.touch-bar-slide-enter-active,
.touch-bar-slide-leave-active {
  transition: opacity 0.16s ease, transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
.touch-bar-slide-enter-from,
.touch-bar-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

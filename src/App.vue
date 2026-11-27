<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { soundEngine } from '@audio/index';
import { BattleStage } from '@renderer/battleStage';
import { useBattleStore } from '@ui/battleStore';
import AttackPreviewTooltip from '@ui/components/AttackPreviewTooltip.vue';
import OrientationGuard from '@ui/components/OrientationGuard.vue';
import OrnamentalFrame from '@ui/components/OrnamentalFrame.vue';
import RightCommandSidebar from '@ui/components/RightCommandSidebar.vue';
import SecondaryDrawerHud from '@ui/components/SecondaryDrawerHud.vue';
import SpellbookModal from '@ui/components/SpellbookModal.vue';
import SpellCardBanner from '@ui/components/SpellCardBanner.vue';
import TacticalCursor from '@ui/components/TacticalCursor.vue';
import TopTurnBar from '@ui/components/TopTurnBar.vue';
import TouchActionBar from '@ui/components/TouchActionBar.vue';
import UnitDetailModal from '@ui/components/UnitDetailModal.vue';
import { useViewportInput } from '@ui/composables/useViewportInput';

const store = useBattleStore();
const { isTouchMode, isCompactLandscape, sidebarWidthPx } = useViewportInput();
const stageHostRef = ref<HTMLElement | null>(null);
let stage: BattleStage | null = null;

function handleContextMenu(e: MouseEvent): void {
  e.preventDefault();
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    if (store.detailModal) store.closeUnitDetail();
    else if (store.selectedSpellId || store.declaringSpellCard) store.clearTargeting();
    else if (store.activeDrawer !== 'none') store.closeDrawer();
    return;
  }
  if (
    (e.key === 'm' || e.key === 'M') &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.metaKey &&
    !store.detailModal &&
    store.activeDrawer !== 'spells' &&
    store.canToggleAttackMode
  ) {
    store.toggleAttackMode();
  }
}

onMounted(async () => {
  soundEngine.installAutoUnlock();
  soundEngine.startBgm();
  window.addEventListener('keydown', handleKeyDown);
  if (!stageHostRef.value) return;
  stage = new BattleStage(stageHostRef.value, {
    onHoverHex: (hex, clientPos, virtualPos) => store.handleHoverHex(hex, clientPos, virtualPos),
    onClickHex: (hex) => store.handleClickHex(hex),
    onRightClickHex: (hex, clientPos) => store.handleRightClickHex(hex, clientPos),
    onTouchTapHex: (hex, clientPos, virtualPos) => store.handleTouchTapHex(hex, clientPos, virtualPos),
    onTouchScrubEnd: (hex, clientPos, virtualPos) => store.handleTouchScrubEnd(hex, clientPos, virtualPos),
    onLongPressHex: (hex, clientPos) => store.handleLongPressHex(hex, clientPos),
    onSpellCardBanner: (info) => store.showSpellCardBanner(info),
  });
  await stage.init(store.battleState);
  store.attachStage(stage);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  soundEngine.stopBgm();
  store.attachStage(null);
  stage?.destroy();
  stage = null;
});
</script>

<template>
  <!-- 原版 HoMM4 经典左右布局：左侧极大化纯净暗夜战场 + 右侧自适应幽夜木刻挂轴柱 -->
  <main
    class="safe-area-shell flex h-[100dvh] w-[100vw] overflow-hidden bg-[#08060a]"
    @contextmenu="handleContextMenu"
  >
    <!-- 左侧主战场舞台区 -->
    <div class="relative min-w-0 flex-1 overflow-hidden">
      <div
        ref="stageHostRef"
        class="h-full w-full"
        :class="!isTouchMode && store.tacticalCursor.kind !== 'default' ? 'cursor-none' : 'cursor-pointer'"
      />

      <TopTurnBar />
      <SecondaryDrawerHud />
      <TouchActionBar />
      <SpellCardBanner />

      <!-- 底部漆木提示笺（触控确认栏展开时自动上移避让，防止重叠） -->
      <transition name="fade">
        <div
          v-if="store.toastMessage"
          class="urushi-slip font-display pointer-events-none absolute left-1/2 z-40 max-w-[92%] -translate-x-1/2 truncate border-[#cfa75b] px-4 py-1.5 text-xs tracking-wider text-[#f5df9e]"
          :class="store.touchActionSummary ? 'bottom-16' : 'bottom-4'"
        >
          {{ store.toastMessage }}
        </div>
      </transition>
    </div>

    <!-- 右侧幽夜木刻挂轴指令与战术情报栏（桌面 256px / 移动端横屏紧凑且可折叠） -->
    <RightCommandSidebar />

    <!-- 居中双轨单位详情大窗、和风线装魔导折本、算伤令笺与动态像素指针 -->
    <UnitDetailModal />
    <SpellbookModal />
    <AttackPreviewTooltip />
    <TacticalCursor />
    <OrientationGuard />

    <!-- 终局胜负裁决御览窗 -->
    <div
      v-if="store.battleState.phase === 'finished'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-3"
      :style="!isCompactLandscape ? { paddingRight: `${sidebarWidthPx}px` } : undefined"
    >
      <div class="urushi-frame touch-scroll relative max-h-[92dvh] w-full max-w-md overflow-y-auto px-5 py-4 text-center sm:px-7 sm:py-6">
        <OrnamentalFrame variant="corners" />

        <div class="relative z-10 flex flex-col items-center">
          <span class="th-hanko px-2.5 py-1 text-xs">
            {{ store.battleState.winner === 'left' ? '博麗凱旋' : '霧雨凱旋' }}
          </span>

          <div class="font-num mt-2.5 text-[10px] tracking-[0.34em] text-[#b89756]">
            BATTLE CONCLUDED
          </div>
          <h1 class="font-display mt-1 text-2xl font-black text-[#f5edd8]">
            {{
              store.battleState.winner === 'left'
                ? '博丽神社阵营 获胜'
                : '雾雨魔导阵营 获胜'
            }}
          </h1>

          <div class="my-3 w-full">
            <OrnamentalFrame variant="divider" />
          </div>

          <p class="font-num text-xs text-[#cabba2]">
            历战 {{ store.battleState.round }} 巡 · 符卡收取 {{ store.battleState.capturedSpellCards.length }} 次
          </p>

          <div
            v-if="store.battleState.capturedSpellCards.length > 0"
            class="washi-recess mt-3 w-full space-y-1 px-3 py-2 text-left text-xs text-[#f5df9e]"
          >
            <div v-for="(cap, idx) in store.battleState.capturedSpellCards" :key="idx">
              <span class="th-hanko-outline mr-1.5 px-1 py-0.5 text-[9px]">收</span>
              <span class="font-display">{{ cap.spellCardName }}</span>
              <span class="text-[#cabba2]"> — {{ cap.bonusText }}</span>
            </div>
          </div>

          <div class="mt-5 flex justify-center gap-3">
            <button
              class="jade-seal-btn font-display px-6 py-2 text-sm font-bold text-[#eafff4]"
              @click="store.restartBattle()"
            >
              再战一局
            </button>
            <button
              class="brass-action-btn font-display px-4 py-2 text-sm text-[#e0d2ba]"
              @click="store.restartBattle(store.mode === 'vs_ai' ? 'hotseat' : 'vs_ai')"
            >
              切换{{ store.mode === 'vs_ai' ? '热座双人' : '人机对弈' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

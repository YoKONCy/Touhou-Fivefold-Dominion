<script setup lang="ts">
/**
 * 东方符卡宣言 Cut-in 剧场横幅
 * 玄漆流金横带 + 巨大墨迹底纹篆字 + 朱砂竖印 + 切角铜镜立绘特写
 */
import { computed } from 'vue';
import { getVoxelPortraitDataUrl } from '@renderer/voxelSprites';
import { useBattleStore } from '@ui/battleStore';

const store = useBattleStore();

const cutInPortrait = computed(() => {
  const id = store.spellCardBanner.casterBlueprintId;
  return id ? getVoxelPortraitDataUrl(id, 112) : '';
});
</script>

<template>
  <transition name="spell-banner">
    <div
      v-if="store.spellCardBanner.visible"
      class="pointer-events-none fixed inset-x-0 top-[30%] z-40 flex items-center justify-center select-none"
    >
      <div
        class="relative flex w-full max-w-4xl items-center justify-center gap-6 overflow-hidden border-y-2 px-10 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.92)]"
        :style="{
          background:
            'linear-gradient(90deg, rgba(8,6,10,0) 0%, rgba(20,14,20,0.96) 14%, rgba(24,16,22,0.98) 50%, rgba(20,14,20,0.96) 86%, rgba(8,6,10,0) 100%)',
          borderColor: store.spellCardBanner.themeColor,
        }"
      >
        <!-- 内层双古金细线 -->
        <div class="pointer-events-none absolute inset-x-16 top-1.5 h-px bg-gradient-to-r from-transparent via-[#f5df9e]/65 to-transparent" />
        <div class="pointer-events-none absolute inset-x-16 bottom-1.5 h-px bg-gradient-to-r from-transparent via-[#f5df9e]/65 to-transparent" />

        <!-- 背景巨大淡墨「符」字印记 -->
        <div
          class="font-display pointer-events-none absolute right-24 top-1/2 -translate-y-1/2 text-[110px] font-black leading-none opacity-[0.07]"
          :style="{ color: store.spellCardBanner.accentColor }"
        >
          符
        </div>

        <!-- 施法者像素立绘切角金框特写 -->
        <div
          v-if="cutInPortrait"
          class="sacred-mirror-frame relative h-[112px] w-[112px] shrink-0 overflow-hidden"
          :style="{ borderColor: store.spellCardBanner.accentColor }"
        >
          <img
            :src="cutInPortrait"
            :alt="store.spellCardBanner.name"
            class="pixel-art h-full w-full object-cover"
          />
        </div>

        <!-- 竖排朱砂落款印 -->
        <div class="th-hanko flex flex-col px-1.5 py-2 text-[11px] leading-tight">
          <span>符</span>
          <span>卡</span>
          <span>宣</span>
          <span>言</span>
        </div>

        <!-- 剧场大标题 -->
        <div class="relative z-10 flex flex-col items-start">
          <div
            class="font-num text-[10.5px] font-semibold tracking-[0.34em] uppercase"
            :style="{ color: store.spellCardBanner.accentColor }"
          >
            SPELL CARD DECLARATION
          </div>
          <div
            class="font-display mt-1 text-3xl font-black tracking-[0.14em] text-[#f7eedc] drop-shadow-[0_2px_14px_rgba(240,195,74,0.45)]"
          >
            {{ store.spellCardBanner.name }}
          </div>
          <div class="mt-1 text-xs tracking-widest text-[#cbbda7]">
            {{ store.spellCardBanner.subtitle }}
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.spell-banner-enter-active,
.spell-banner-leave-active {
  transition: opacity 0.24s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.spell-banner-enter-from,
.spell-banner-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>

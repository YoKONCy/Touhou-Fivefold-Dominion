<script setup lang="ts">
/**
 * 顶部「符札先手序列轨」（极简纯头像行动序 + 结界符札横幅）
 * - 摒弃通用毛玻璃圆胶囊，改为切角玄漆黄铜导轨 + 切角八边漆木肖像札
 * - 直接复用纯代码精雕像素立绘头像（零静态资源，画风 100% 一体化）
 */
import { resolveUnitSummonKind } from '@core/types';
import { getVoxelAvatarDataUrl } from '@renderer/voxelSprites';
import { useBattleStore } from '@ui/battleStore';
import { SUMMON_KIND_HP_THEME } from '@ui/semanticFormat';

const store = useBattleStore();

function getSummonTheme(unit: Parameters<typeof resolveUnitSummonKind>[0]) {
  const kind = resolveUnitSummonKind(unit);
  return kind ? SUMMON_KIND_HP_THEME[kind] : null;
}
</script>

<template>
  <header class="pointer-events-none absolute top-2 left-0 right-0 z-20 flex flex-col items-center gap-1.5 px-4 select-none">
    <!-- 符札先手序列轨主体 -->
    <div class="relative flex max-w-full items-center">
      <!-- 左右两端装饰黄铜箭簇 -->
      <svg viewBox="0 0 14 34" class="h-[34px] w-3.5 shrink-0" fill="none">
        <path d="M14 1H7L1 17L7 33H14" fill="#141016" stroke="#99763a" stroke-width="1.2" />
        <path d="M11 17L7 13L3 17L7 21Z" fill="#cfa75b" />
      </svg>

      <div
        class="urushi-slip pointer-events-auto relative flex max-w-full items-center gap-1.5 overflow-x-auto border-x-0 px-2.5 py-1.5"
      >
        <!-- 贯穿队列背后的古金先手丝线 -->
        <div
          class="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-[#cfa75b]/55 via-[#99763a]/30 to-transparent"
        />

        <button
          v-for="item in store.turnStripUnits.slice(0, 12)"
          :key="item.unit.id"
          class="group relative z-10 flex shrink-0 flex-col items-center transition-transform duration-150 hover:-translate-y-0.5"
          :title="`${item.unit.name}${item.unit.kind === 'hero' ? ` Lv.${item.unit.level}` : ` ×${item.unit.count}`}${item.unit.roundMoraleState === 'good' ? ' · 高士气（先手梯队 / 伤害+25%）' : item.unit.roundMoraleState === 'bad' ? ' · 低士气（末位梯队 / 伤害-20%）' : ''}${item.isWaiting ? '（等待中）' : ''} · 点击或右击查看详情`"
          @click="store.openUnitDetail(item.unit.id, { x: $event.clientX, y: $event.clientY })"
          @contextmenu.prevent.stop="store.openUnitDetail(item.unit.id, { x: $event.clientX, y: $event.clientY })"
        >
          <!-- 当前行动者顶部古金倒三角冠饰 -->
          <svg
            v-if="item.isCurrent"
            viewBox="0 0 12 6"
            class="mb-0.5 h-1.5 w-3 drop-shadow-[0_0_4px_rgba(245,223,158,0.8)]"
            fill="none"
          >
            <path d="M1 0.5H11L6 5.5Z" fill="#f5df9e" />
          </svg>

          <!-- 切角漆木头像札 -->
          <div
            class="enamel-crest relative flex items-center justify-center overflow-hidden border transition"
            :class="[
              item.isCurrent
                ? 'h-10 w-10 border-[#f5df9e] bg-[#2a1f24] shadow-[0_0_12px_rgba(245,223,158,0.45)]'
                : 'h-8 w-8 border-[#99763a]/75 bg-[#151118] group-hover:border-[#f5df9e]',
              item.isWaiting ? 'opacity-65' : '',
            ]"
          >
            <img
              :src="getVoxelAvatarDataUrl(item.unit.voxelBlueprintId, item.isCurrent ? 40 : 32)"
              :alt="item.unit.name"
              class="pixel-art h-full w-full object-cover"
              :class="item.unit.isIllusion ? 'opacity-72' : ''"
              :style="item.unit.isIllusion ? { filter: 'blur(0.65px) drop-shadow(0 0 4px rgba(72, 240, 255, 0.75))' } : undefined"
            />
            <!-- 底端阵营朱砂/青金珐琅细条（召唤/幻象/复生单位在左侧附加对应身份色小点标识） -->
            <span
              class="absolute inset-x-0 bottom-0 h-[3px]"
              :style="{ backgroundColor: item.unit.side === 'left' ? '#c93647' : '#568fd6' }"
            />
            <span
              v-if="getSummonTheme(item.unit)"
              class="absolute bottom-[3px] inset-x-0 h-[2px]"
              :style="{ background: getSummonTheme(item.unit)!.hpGradient }"
            />
            <!-- 等待态右上角极小靛蓝「待」字微印 -->
            <span
              v-if="item.isWaiting"
              class="font-display absolute right-0 top-0 bg-[#13223b]/92 px-0.5 text-[7.5px] leading-tight text-[#9ac8ff]"
            >
              待
            </span>
            <!-- 正统 HoMM4 回合士气梯队左上角微印（昂=先手+25% / 沮=后手-20%） -->
            <span
              v-if="item.unit.roundMoraleState === 'good'"
              class="font-display absolute left-0 top-0 bg-[#3a2a0a]/92 px-0.5 text-[7.5px] leading-tight text-[#ffe466]"
            >
              昂
            </span>
            <span
              v-else-if="item.unit.roundMoraleState === 'bad'"
              class="font-display absolute left-0 top-0 bg-[#2a1638]/92 px-0.5 text-[7.5px] leading-tight text-[#d2b3ff]"
            >
              沮
            </span>
          </div>
        </button>
      </div>

      <svg viewBox="0 0 14 34" class="h-[34px] w-3.5 shrink-0 -scale-x-100" fill="none">
        <path d="M14 1H7L1 17L7 33H14" fill="#141016" stroke="#99763a" stroke-width="1.2" />
        <path d="M11 17L7 13L3 17L7 21Z" fill="#cfa75b" />
      </svg>
    </div>

    <!-- 激活中的符卡结界符札横幅 -->
    <div
      v-if="store.battleState.activeFieldAura"
      class="urushi-slip pointer-events-auto flex items-center gap-2.5 whitespace-nowrap px-3.5 py-1 text-[11px]"
      :style="{ borderColor: store.battleState.activeFieldAura.themeColor }"
    >
      <span class="th-hanko px-1.5 py-0.5 text-[9.5px]">结界</span>
      <span
        class="font-display font-bold tracking-wider"
        :style="{ color: store.battleState.activeFieldAura.accentColor }"
      >
        {{ store.battleState.activeFieldAura.name }}
      </span>
      <span class="font-num text-[10.5px] text-[#cabba2]">
        余 {{ store.battleState.activeFieldAura.remainingRounds }} 巡
      </span>
      <span
        v-if="!store.battleState.activeFieldAura.captured"
        class="border-l border-[#cfa75b]/30 pl-2 text-[10px] text-[#f5df9e]"
      >
        击倒施法者可收取符卡
      </span>
    </div>

    <!-- 施法 / 符卡瞄准态令条 -->
    <div
      v-if="store.selectedSpellId || store.declaringSpellCard"
      class="urushi-slip pointer-events-auto flex items-center gap-2.5 border-[#cfa75b] px-3.5 py-1 text-xs"
    >
      <span class="th-hanko px-1.5 py-0.5 text-[9.5px]">
        {{ store.declaringSpellCard ? '符卡' : '术式' }}
      </span>
      <span class="font-display text-[#f3ead8]">
        {{ store.declaringSpellCard ? '请于棋盘择定符卡展开方位' : '请于棋盘择定术式施放目标' }}
      </span>
      <button
        class="brass-action-btn px-2 py-0.5 text-[10px] text-[#f0b4bc]"
        @click="store.clearTargeting()"
      >
        取消（右击）
      </button>
    </div>
  </header>
</template>

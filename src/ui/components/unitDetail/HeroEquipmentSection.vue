<script setup lang="ts">
/**
 * 英雄左栏：指挥官立绘神镜、四维能量标尺与十字星阵 5 格神器纸娃娃
 *
 * 包含立绘光环、重伤倒地标牌、HP/MP/P 点/符卡充能读数、组合神器套装共鸣徽章与 5 部位装备槽。
 */
import type { ArtifactDef, ArtifactSetDef, BattleUnit, ComputedUnitStats } from '@core/types';
import OrnamentalFrame from '@ui/components/OrnamentalFrame.vue';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import { useViewportInput } from '@ui/composables/useViewportInput';
import type { HudTooltipPayload } from '@ui/hudMetadata';
import { SPELL_POLARITY_META } from '@ui/semanticFormat';
import type { HeroEquipmentSlotItem } from './helpers';

const props = defineProps<{
  /** 当前英雄单位 */
  unit: BattleUnit;
  /** 英雄实时计算属性 */
  stats: ComputedUnitStats;
  /** 动态像素立绘当前帧 DataURL */
  portraitUrl: string;
  /** 立绘悬停提示载荷 */
  portraitTooltip: HudTooltipPayload | null;
  /** 当前已激活的组合神器套装列表 */
  artifactSets: ArtifactSetDef[];
  /** 按部位索引的 5 格神器装备槽映射 */
  equipSlotMap: Partial<Record<ArtifactDef['slot'], HeroEquipmentSlotItem>>;
}>();

const emit = defineEmits<{
  showTip: [payload: HudTooltipPayload, event: MouseEvent];
  hideTip: [];
  tapTip: [payload: HudTooltipPayload, event: MouseEvent];
}>();

const { isTinyHeight } = useViewportInput();
</script>

<template>
  <div class="washi-recess flex flex-col justify-between" :class="isTinyHeight ? 'gap-2 p-2' : 'gap-2.5 p-3'">
    <div class="flex flex-col items-center">
      <div class="relative flex items-center justify-center">
        <svg
          viewBox="0 0 164 164"
          class="pointer-events-none absolute opacity-25"
          :class="isTinyHeight ? 'h-[112px] w-[112px]' : 'h-[156px] w-[156px]'"
          fill="none"
        >
          <circle cx="82" cy="82" r="78" stroke="#cfa75b" stroke-width="0.7" stroke-dasharray="3 3" />
          <path d="M82 4L89 18L82 32L75 18Z" fill="#cfa75b" fill-opacity="0.35" />
        </svg>

        <div
          class="sacred-mirror-frame relative cursor-help overflow-hidden"
          :class="isTinyHeight ? 'h-[96px] w-[96px]' : 'h-[136px] w-[136px]'"
          :style="{ borderColor: props.unit.side === 'left' ? '#c93848' : '#588fd1' }"
          @mouseenter="props.portraitTooltip && emit('showTip', props.portraitTooltip, $event)"
          @mouseleave="emit('hideTip')"
          @click.stop="props.portraitTooltip && emit('tapTip', props.portraitTooltip, $event)"
        >
          <img
            :src="props.portraitUrl"
            :alt="props.unit.name"
            class="pixel-art h-full w-full object-cover transition"
            :class="props.unit.isIllusion ? 'opacity-72 blur-[0.75px] saturate-125 brightness-110' : ''"
            :style="
              props.unit.isIllusion
                ? { filter: 'blur(0.75px) drop-shadow(0 0 6px rgba(72, 240, 255, 0.7)) hue-rotate(8deg)' }
                : undefined
            "
          />
          <span
            v-if="props.unit.status === 'knocked_out'"
            class="font-display absolute inset-x-0 bottom-0 bg-[#54141e]/92 py-0.5 text-center text-[10px] font-bold text-[#f7c1c9]"
          >
            重伤倒地
          </span>
        </div>
      </div>

      <!-- 标尺式 HP / MP / P点 / 符卡充能 -->
      <div class="mt-2.5 w-full space-y-1.5 text-[10px]">
        <div>
          <div class="font-num flex justify-between text-[#a0e6be]">
            <span class="tracking-widest">HP</span>
            <span>{{ props.unit.currentHp }} / {{ props.stats.maxHp }}</span>
          </div>
          <div class="relative mt-0.5 h-1.5 w-full bg-[#09070b] ring-1 ring-[#99763a]/40">
            <div
              class="h-full bg-gradient-to-r from-[#287a52] to-[#74db9f]"
              :style="{
                width: `${Math.min(100, Math.round((props.unit.currentHp / Math.max(1, props.stats.maxHp)) * 100))}%`,
              }"
            />
          </div>
        </div>

        <div>
          <div class="font-num flex justify-between text-[#a3c7f0]">
            <span class="tracking-widest">MP</span>
            <span>{{ props.unit.mana ?? 0 }} / {{ props.stats.maxMana }}</span>
          </div>
          <div class="relative mt-0.5 h-1.5 w-full bg-[#09070b] ring-1 ring-[#99763a]/40">
            <div
              class="h-full bg-gradient-to-r from-[#3465ad] to-[#86bdf2]"
              :style="{
                width: `${Math.min(100, Math.round(((props.unit.mana ?? 0) / Math.max(1, props.stats.maxMana)) * 100))}%`,
              }"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-1.5 pt-0.5">
          <div class="border border-[#99763a]/35 bg-[#120e15] px-2 py-1 text-center font-num">
            <span class="text-[#d97784]">P </span>
            <strong class="text-[#f5df9e]">{{ (props.unit.powerPoints ?? 0).toFixed(1) }}</strong>
          </div>
          <div class="border border-[#99763a]/35 bg-[#120e15] px-2 py-1 text-center font-num">
            <span class="text-[#cfa75b]">符 </span>
            <strong class="text-[#f5df9e]">{{ props.unit.spellCardCharge ?? 0 }}%</strong>
          </div>
        </div>
      </div>
    </div>

    <OrnamentalFrame variant="divider" />

    <!-- 十字星阵 5 格神器纸娃娃 -->
    <div>
      <div class="mb-1.5 flex items-center justify-between">
        <span class="font-display text-[10.5px] text-[#cabba2]">神器阵位</span>
        <span
          v-for="setDef in props.artifactSets"
          :key="setDef.id"
          class="font-display cursor-help border border-[#72c4d9]/60 bg-[#142d38] px-1.5 py-0.5 text-[9px] text-[#a6f0ff]"
          @mouseenter="
            emit(
              'showTip',
              {
                title: `套装共鸣 · ${setDef.name}`,
                tag: '组合套装激活',
                accent: '#9cf2ff',
                badges: [
                  {
                    label: '套装共鸣',
                    icon: SPELL_POLARITY_META.buff.icon,
                    color: '#a6f0ff',
                    bg: 'rgba(18, 42, 54, 0.92)',
                    border: '#5fa8c4',
                  },
                ],
                lines: [setDef.description],
              },
              $event,
            )
          "
          @mouseleave="emit('hideTip')"
          @click.stop="
            emit(
              'tapTip',
              {
                title: `套装共鸣 · ${setDef.name}`,
                tag: '组合套装激活',
                accent: '#9cf2ff',
                badges: [
                  {
                    label: '套装共鸣',
                    icon: SPELL_POLARITY_META.buff.icon,
                    color: '#a6f0ff',
                    bg: 'rgba(18, 42, 54, 0.92)',
                    border: '#5fa8c4',
                  },
                ],
                lines: [setDef.description],
              },
              $event,
            )
          "
        >
          共鸣生效
        </span>
      </div>

      <div class="relative mx-auto flex h-[112px] w-[144px] flex-col items-center justify-between py-0.5">
        <svg viewBox="0 0 156 126" class="pointer-events-none absolute inset-0 h-full w-full" fill="none">
          <line x1="78" y1="20" x2="78" y2="106" stroke="#99763a" stroke-opacity="0.55" stroke-width="1" />
          <line x1="26" y1="63" x2="130" y2="63" stroke="#99763a" stroke-opacity="0.55" stroke-width="1" />
          <path d="M78 26L116 63L78 100L40 63Z" stroke="#cfa75b" stroke-opacity="0.22" stroke-width="0.8" />
        </svg>

        <div
          v-if="props.equipSlotMap.head"
          class="enamel-crest relative z-10 flex h-8.5 w-8.5 cursor-help items-center justify-center border transition hover:scale-105"
          :class="
            props.equipSlotMap.head.artifact
              ? 'border-[#cfa75b] bg-[#2a1f28]'
              : 'border-[#99763a]/28 bg-[#0f0c12] opacity-40'
          "
          @mouseenter="emit('showTip', props.equipSlotMap.head.tooltip, $event)"
          @mouseleave="emit('hideTip')"
          @click.stop="emit('tapTip', props.equipSlotMap.head.tooltip, $event)"
        >
          <PixelBadgeIcon :name="props.equipSlotMap.head.icon" size-class="h-4.5 w-4.5" />
        </div>

        <div class="relative z-10 flex w-full items-center justify-between px-2">
          <div
            v-for="slotKey in (['weapon', 'armor', 'accessory'] as const)"
            :key="slotKey"
            class="enamel-crest flex h-8.5 w-8.5 cursor-help items-center justify-center border transition hover:scale-105"
            :class="
              props.equipSlotMap[slotKey]?.artifact
                ? 'border-[#cfa75b] bg-[#2a1f28]'
                : 'border-[#99763a]/28 bg-[#0f0c12] opacity-40'
            "
            @mouseenter="props.equipSlotMap[slotKey] && emit('showTip', props.equipSlotMap[slotKey]!.tooltip, $event)"
            @mouseleave="emit('hideTip')"
            @click.stop="props.equipSlotMap[slotKey] && emit('tapTip', props.equipSlotMap[slotKey]!.tooltip, $event)"
          >
            <PixelBadgeIcon
              v-if="props.equipSlotMap[slotKey]"
              :name="props.equipSlotMap[slotKey]!.icon"
              size-class="h-4.5 w-4.5"
            />
          </div>
        </div>

        <div
          v-if="props.equipSlotMap.ring"
          class="enamel-crest relative z-10 flex h-8.5 w-8.5 cursor-help items-center justify-center border transition hover:scale-105"
          :class="
            props.equipSlotMap.ring.artifact
              ? 'border-[#cfa75b] bg-[#2a1f28]'
              : 'border-[#99763a]/28 bg-[#0f0c12] opacity-40'
          "
          @mouseenter="emit('showTip', props.equipSlotMap.ring.tooltip, $event)"
          @mouseleave="emit('hideTip')"
          @click.stop="emit('tapTip', props.equipSlotMap.ring.tooltip, $event)"
        >
          <PixelBadgeIcon :name="props.equipSlotMap.ring.icon" size-class="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  </div>
</template>

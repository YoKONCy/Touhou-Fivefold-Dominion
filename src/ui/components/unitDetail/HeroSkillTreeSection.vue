<script setup lang="ts">
/**
 * 英雄九系 36 技能树面板（9 大主技能 × 27 项二级专精）
 *
 * 支持在战斗场景外（战前整备或战后）开启沙盒配点模式实时增减主技能与子技能等级。
 */
import type { PrimarySkillId, SecondarySkillId } from '@core/types';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import type { HudTooltipPayload } from '@ui/hudMetadata';
import type { HeroSkillTreeItem } from './helpers';

const props = defineProps<{
  /** 当前展示的技能树列表（调点模式下展示全部 9 系，常规展示已习得系） */
  skillTrees: HeroSkillTreeItem[];
  /** 是否处于 36 技能树沙盒调点模式 */
  skillEditMode: boolean;
  /** 当前是否允许直接修改英雄构筑（战前整备或战后） */
  canModifyHeroBuild: boolean;
}>();

const emit = defineEmits<{
  toggleEditMode: [];
  stepPrimary: [primaryId: PrimarySkillId, delta: 1 | -1];
  stepSubSkill: [subId: SecondarySkillId, delta: 1 | -1];
  showTip: [payload: HudTooltipPayload, event: MouseEvent];
  hideTip: [];
  tapTip: [payload: HudTooltipPayload, event: MouseEvent];
}>();
</script>

<template>
  <div class="washi-recess flex min-h-0 flex-1 flex-col p-2.5">
    <div class="mb-2 flex items-center justify-between border-b border-[#99763a]/30 pb-1">
      <div class="flex items-center gap-2">
        <span class="font-display text-[10.5px] text-[#a3c7f0]">
          九系技能树 · 主技能与 27 项二级专精
        </span>
        <span class="font-num text-[9px] text-[#7e7060]">
          {{ props.skillTrees.length }} 系展示
        </span>
      </div>
      <button
        class="font-display border px-2 py-0.5 text-[9.5px] transition"
        :class="
          props.skillEditMode
            ? 'border-[#f5df9e] bg-[#3b2a14] text-[#fff2bd]'
            : 'border-[#99763a]/55 bg-[#1a141c] text-[#e6cfa0] hover:border-[#f5df9e]'
        "
        @click="emit('toggleEditMode')"
      >
        {{ props.skillEditMode ? '完成配点' : props.canModifyHeroBuild ? '沙盒配点 · 36 技' : '回整备配点' }}
      </button>
    </div>

    <div class="touch-scroll grid max-h-[168px] grid-cols-1 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2 lg:max-h-[205px] lg:grid-cols-3">
      <div
        v-for="tree in props.skillTrees"
        :key="tree.id"
        class="flex flex-col border bg-[#151018] p-1.5 transition"
        :class="tree.rank > 0 ? 'border-[#99763a]/45' : 'border-[#544638]/30 opacity-70'"
      >
        <!-- 主技能顶行 -->
        <div
          class="flex cursor-help items-center justify-between gap-1"
          @mouseenter="emit('showTip', tree.tooltip, $event)"
          @mouseleave="emit('hideTip')"
          @click.stop="emit('tapTip', tree.tooltip, $event)"
        >
          <div class="flex min-w-0 items-center gap-1.5">
            <PixelBadgeIcon :name="tree.icon" size-class="h-4.5 w-4.5 shrink-0" />
            <div class="min-w-0">
              <div class="flex items-center gap-1">
                <span class="font-display truncate text-[10.5px] font-bold" :style="{ color: tree.color }">
                  {{ tree.short }}
                </span>
                <span class="font-num text-[8.5px] text-[#8d7f6e]">总{{ tree.total }}</span>
              </div>
              <div class="mt-0.5 flex items-center gap-0.5">
                <span
                  v-for="pip in 5"
                  :key="pip"
                  class="inline-block h-1.5 w-1.5 rotate-45 border"
                  :class="
                    pip <= tree.rank
                      ? 'border-[#f5df9e] bg-[#cfa75b]'
                      : 'border-[#57462d] bg-transparent'
                  "
                />
              </div>
            </div>
          </div>

          <!-- 主技能沙盒调点按钮 -->
          <div v-if="props.skillEditMode" class="flex shrink-0 items-center gap-0.5">
            <button
              class="font-num flex h-6 w-6 items-center justify-center border border-[#99763a]/55 bg-[#1f1822] text-[10px] text-[#e6cfa0] hover:border-[#f5df9e] disabled:opacity-25 lg:h-4.5 lg:w-4.5"
              :disabled="tree.rank <= 0"
              @click.stop="emit('stepPrimary', tree.id, -1)"
            >
              -
            </button>
            <button
              class="font-num flex h-6 w-6 items-center justify-center border border-[#99763a]/55 bg-[#291e14] text-[10px] text-[#f5df9e] hover:border-[#fff0b8] disabled:opacity-25 lg:h-4.5 lg:w-4.5"
              :disabled="tree.rank >= 5"
              @click.stop="emit('stepPrimary', tree.id, 1)"
            >
              +
            </button>
          </div>
        </div>

        <!-- 下属 3 项二级子技能 -->
        <div class="mt-1.5 space-y-1 border-t border-[#99763a]/20 pt-1">
          <div
            v-for="sub in tree.subItems"
            :key="sub.id"
            class="flex cursor-help items-center justify-between gap-1 text-[9.5px]"
            :class="sub.locked ? 'opacity-38' : ''"
            @mouseenter="emit('showTip', sub.tooltip, $event)"
            @mouseleave="emit('hideTip')"
            @click.stop="emit('tapTip', sub.tooltip, $event)"
          >
            <div class="flex min-w-0 items-center gap-1">
              <span class="font-display w-[26px] shrink-0 truncate text-[#d8cbb8]">{{ sub.short }}</span>
              <div class="flex items-center gap-0.5">
                <span
                  v-for="p in 5"
                  :key="p"
                  class="inline-block h-1.5 w-2 rounded-[1px]"
                  :class="p <= sub.rank ? 'bg-[#86c9a5]' : 'bg-[#2a2430]'"
                />
              </div>
            </div>

            <div v-if="props.skillEditMode" class="flex shrink-0 items-center gap-0.5">
              <button
                class="font-num flex h-5.5 w-5.5 items-center justify-center border border-[#786858]/45 bg-[#18141c] text-[9.5px] text-[#cabba2] hover:border-[#f5df9e] disabled:opacity-20 lg:h-4 lg:w-4 lg:text-[9px]"
                :disabled="sub.rank <= 0"
                @click.stop="emit('stepSubSkill', sub.id, -1)"
              >
                -
              </button>
              <button
                class="font-num flex h-5.5 w-5.5 items-center justify-center border border-[#56ab80]/55 bg-[#122620] text-[9.5px] text-[#8cf0ba] hover:border-[#b8ffd6] disabled:opacity-20 lg:h-4 lg:w-4 lg:text-[9px]"
                :disabled="!sub.canInc"
                :title="sub.incReason"
                @click.stop="emit('stepSubSkill', sub.id, 1)"
              >
                +
              </button>
            </div>
            <span v-else class="font-num text-[8.5px] text-[#9b8c78]">{{ sub.rank }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

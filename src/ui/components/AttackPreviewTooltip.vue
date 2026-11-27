<script setup lang="ts">
/**
 * 原版 HoMM4 极简伤害范围浮标（零杂乱文本！）
 * - 悬停可攻击敌军时：仅展示「图标 + 伤害范围」，若射手触发距离/遮挡衰减则附带极简 1/2 或 1/4 印标
 * - 使用 GPU 合成 transform: translate3d 跟随光标，杜绝触发浏览器布局重排导致画面抽搐
 */
import { computed } from 'vue';
import { useBattleStore } from '@ui/battleStore';
import { useViewportInput } from '@ui/composables/useViewportInput';

const store = useBattleStore();
const { isTouchMode, sidebarWidthPx } = useViewportInput();
const ctx = computed(() => (isTouchMode.value ? null : store.hoverAttackContext));
const spellCtx = computed(() => {
  if (isTouchMode.value) return null;
  const s = store.hoverSpellContext;
  if (!s) return null;
  // 施法态下：悬停在单位上、处于 AOE/召唤落点、或有明确阻挡/超距轨迹时显示简洁光标浮标
  if (s.trajectory || s.targetUnit || !s.canCast) {
    // 若仅悬停空地且提示“请将光标移至单位”则不弹多余浮标，保持画面清爽
    if (!s.trajectory && !s.targetUnit && s.shortLabel.startsWith('请选择')) return null;
    return s;
  }
  return null;
});

/** 远程反击被己方前卫挡箭替伤时的极简微标 */
const interceptTag = computed(() => {
  const p = ctx.value?.preview;
  if (!p || !p.valid || !p.isRanged || !p.retaliationTargetName) return null;
  return { text: '前卫替伤', cls: 'border-[#54d4a8] bg-[#10382e] text-[#a6ffdf]' };
});

/** 施法受阻时的极简短因（同步阻挡体名称或超射程格数） */
const spellShortReason = computed(() => {
  const s = spellCtx.value;
  if (!s || s.canCast) return '';
  const traj = s.trajectory;
  if (traj?.outOfRange) {
    return `超出射程 (${traj.outOfRange.distance}/${traj.outOfRange.maxRange})`;
  }
  if (traj?.blocked && traj.blockers.length > 0) {
    const primary = traj.blockers.find((b) => b.kind !== 'partial_obstacle') ?? traj.blockers[0];
    if (primary) return `被${primary.label}阻挡`;
  }
  return s.shortLabel || s.reason || '无法施放';
});

/** 紧贴光标右下角定位，自动避让 256px 右侧栏与屏幕底边 */
const tooltipStyle = computed(() => {
  const pos = store.pointerPos;
  if (!pos) {
    return { transform: 'translate3d(24px, 64px, 0)' };
  }
  let estW = 152;
  if (spellCtx.value) {
    const textLen = spellCtx.value.canCast
      ? spellCtx.value.shortLabel.length + 4
      : spellShortReason.value.length + 2;
    estW = Math.min(260, Math.max(120, textLen * 11.5 + 32));
  } else if (ctx.value) {
    estW = !ctx.value.preview.valid
      ? Math.min(250, Math.max(120, blockedLabel.value.length * 12 + 28))
      : interceptTag.value
        ? 204
        : 152;
  }
  const estH = 34;
  const maxX = Math.max(12, window.innerWidth - sidebarWidthPx.value - 10 - estW);
  const maxY = Math.max(12, window.innerHeight - estH - 12);

  const left = pos.x + 22 <= maxX ? pos.x + 22 : Math.max(12, pos.x - estW - 16);
  const top = Math.min(maxY, Math.max(48, pos.y + 14));
  return {
    transform: `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`,
  };
});

/** 远程衰减档位或长武器隔格免反击微标 */
const penaltyTag = computed(() => {
  const p = ctx.value?.preview;
  if (!p || !p.valid) return null;
  if (!p.isRanged && p.isLongWeaponPoke) {
    return { text: '长手免反', cls: 'border-[#54d4a8] bg-[#10382e] text-[#a6ffdf]' };
  }
  if (!p.isRanged) return null;
  if (p.rangedPenaltyTier === 'half') {
    return { text: '1/2', cls: 'border-[#e0a84c] bg-[#3d2910] text-[#ffe19c]' };
  }
  if (p.rangedPenaltyTier === 'quarter') {
    return { text: '1/4', cls: 'border-[#e05a4c] bg-[#451714] text-[#ffb8ae]' };
  }
  if (p.rangedPenaltyTier === 'eighth') {
    return { text: '1/8', cls: 'border-[#d94873] bg-[#3d1024] text-[#ffb3cb]' };
  }
  return null;
});

/** 不可攻击时的精准简短原因（直接指出具体阻挡物/贴身/弹药/范围，让玩家一秒明白为何无法命中） */
const blockedLabel = computed(() => {
  const p = ctx.value?.preview;
  if (!p || p.valid) return '';
  const traj = p.trajectory;
  if (traj?.blocked && traj.blockers.length > 0) {
    const primary = traj.blockers.find((b) => b.kind !== 'partial_obstacle') ?? traj.blockers[0];
    if (primary) {
      return `被${primary.label}阻挡`;
    }
  }
  if (p.reason?.includes('贴身')) return p.reason.replace('，无法远程射击', '');
  if (p.reason?.includes('弹药')) return '弹药已耗尽';
  if (p.reason?.includes('视线')) return p.reason;
  if (p.reason?.includes('禁手')) return '近战禁手';
  if (p.reason?.includes('净域')) return '常世净域无敌';
  return '超出移动与射程';
});
</script>

<template>
  <!-- 脱离主舞台 flex 流，直接挂载至 body，绝不挤占战场宽度！ -->
  <Teleport to="body">
    <!-- 施法瞄准浮标（直出可施放 / 精准阻挡体 / 超出射程格数） -->
    <div
      v-if="spellCtx"
      class="urushi-slip pointer-events-none fixed left-0 top-0 z-50 flex items-center gap-2 px-2.5 py-1.5 will-change-transform"
      :style="tooltipStyle"
    >
      <span
        class="absolute inset-y-1 left-0 w-[2.5px]"
        :style="{ backgroundColor: spellCtx.canCast ? '#b98cff' : '#e04b5a' }"
      />
      <template v-if="spellCtx.canCast">
        <span class="font-display pl-0.5 text-[11px] font-bold text-[#e5d1ff]">
          {{ spellCtx.shortLabel }}
        </span>
        <span class="font-num border border-[#6ca6e8]/55 bg-[#122238] px-1 py-px text-[9.5px] font-bold text-[#a8d5ff]">
          {{ spellCtx.manaCost }} MP
        </span>
      </template>
      <span v-else class="font-display pl-0.5 text-[11px] font-semibold text-[#ffb8c2]">
        ✕ {{ spellShortReason }}
      </span>
    </div>

    <!-- 常规远程 / 近战交锋浮标 -->
    <div
      v-else-if="ctx"
      class="urushi-slip pointer-events-none fixed left-0 top-0 z-50 flex items-center gap-2 px-2.5 py-1.5 will-change-transform"
      :style="tooltipStyle"
    >
      <!-- 左侧极细锋刃色条 -->
      <span
        class="absolute inset-y-1 left-0 w-[2.5px]"
        :style="{
          backgroundColor: !ctx.preview.valid
            ? '#a83c48'
            : ctx.preview.rangedPenaltyTier === 'eighth'
              ? '#d94873'
              : ctx.preview.rangedPenaltyTier === 'quarter'
                ? '#e05a4c'
                : ctx.preview.rangedPenaltyTier === 'half'
                  ? '#e0a84c'
                  : '#cfa75b',
        }"
      />

      <!-- 可攻击态：仅展示极简图标 + 伤害范围 + 必要时的 1/2 / 1/4 远程衰减印标 -->
      <template v-if="ctx.preview.valid">
        <svg
          v-if="ctx.preview.isRanged"
          viewBox="0 0 16 16"
          shape-rendering="crispEdges"
          class="h-3.5 w-3.5 shrink-0"
        >
          <rect x="4" y="2" width="3" height="2" fill="#cfa75b" />
          <rect x="2" y="4" width="2" height="8" fill="#cfa75b" />
          <rect x="4" y="12" width="3" height="2" fill="#cfa75b" />
          <rect x="6" y="7" width="7" height="2" fill="#90e8d4" />
          <rect x="12" y="6" width="2" height="4" fill="#ffffff" />
        </svg>
        <svg
          v-else
          viewBox="0 0 16 16"
          shape-rendering="crispEdges"
          class="h-3.5 w-3.5 shrink-0"
        >
          <rect x="2" y="11" width="3" height="3" fill="#99643a" />
          <rect x="4" y="9" width="3" height="3" fill="#cfa75b" />
          <rect x="7" y="6" width="3" height="3" fill="#f3ead8" />
          <rect x="10" y="3" width="4" height="4" fill="#ffe699" />
        </svg>

        <span class="font-num text-[13px] font-bold tracking-wide text-[#f5ecd6]">
          {{ ctx.preview.expectedMinDamage }}–{{ ctx.preview.expectedMaxDamage }}
        </span>

        <span
          v-if="penaltyTag"
          class="font-num border px-1 py-px text-[10px] font-bold leading-none"
          :class="penaltyTag.cls"
        >
          {{ penaltyTag.text }}
        </span>

        <span
          v-if="interceptTag"
          class="border px-1 py-px text-[10px] font-bold leading-none"
          :class="interceptTag.cls"
        >
          {{ interceptTag.text }}
        </span>
      </template>

      <!-- 不可直达态：仅极简 4 字提示，绝不铺陈长文本 -->
      <span v-else class="font-display pl-0.5 text-[11px] text-[#e09ca5]">
        {{ blockedLabel }}
      </span>
    </div>
  </Teleport>
</template>

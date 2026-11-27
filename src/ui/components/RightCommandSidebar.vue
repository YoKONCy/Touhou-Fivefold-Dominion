<script setup lang="ts">
/**
 * 幽夜漆金战术指令与情报右侧栏（256px 上「UI 控制区」+ 下「战术信息区」）
 * - 上半区：回合铭牌、2 列切角漆金战术指令匾、动态施法瞄准条（阵营与 A/B 路线配置统一收纳于「规仪」抽屉）
 * - 下半区（参考《圣女战旗》悬停即读交互）：
 *   1. 悬停敌军交锋 / 施法瞄准时：顶部实时展开「双栏攻防预测 / 施法阻挡解析卡」
 *   2. 悬停任意战场单位时：实时切换为该单位情报简报（含罗马数字阶位徽章、HP/MP/弹药/充能、六维、特技与 Buff）
 *   3. 悬停空地或障碍物时：底部浮出地形战术卡（高程、通行与视线阻挡说明）
 *   4. 贴底常驻 2 行最新战报流，点击直达完整战录抽屉
 */
import { computed } from 'vue';
import { ALIGNMENT_META } from '@core/alignment';
import { getEffectiveSpellManaCost, getEffectiveSpellRange } from '@core/combatEngine';
import { computeUnitStats } from '@core/modifiers';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { getSpellIconDataUrl } from '@renderer/spellIcons';
import { getVoxelAvatarDataUrl } from '@renderer/voxelSprites';
import { useBattleStore } from '@ui/battleStore';
import OrnamentalFrame from '@ui/components/OrnamentalFrame.vue';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import TierBadgeIcon from '@ui/components/TierBadgeIcon.vue';
import { useViewportInput } from '@ui/composables/useViewportInput';
import { buildUnitSpecialtyBadges, buildUnitStatusBadges } from '@ui/hudMetadata';

const store = useBattleStore();
const {
  isTouchMode,
  isCompactLandscape,
  isTinyHeight,
  canCollapseSidebar,
  sidebarCollapsed,
  sidebarWidthPx,
  toggleSidebarCollapsed,
} = useViewportInput();

const isHeroActing = computed(
  () => Boolean(store.activeUnit && store.activeUnit.kind === 'hero' && store.isHumanTurn),
);

const canOpenSpellbook = computed(() =>
  Boolean(
    store.activeUnit &&
      store.isHumanTurn &&
      (store.activeUnit.kind === 'hero' || store.activeUnit.knownSpellIds.length > 0),
  ),
);

const spellCardReady = computed(() => {
  const u = store.activeUnit;
  if (!u || u.kind !== 'hero' || !u.signatureSpellCardId) return false;
  const card = TOUHOU_CATALOG.spellCards[u.signatureSpellCardId];
  if (!card) return false;
  return (u.mana ?? 0) >= card.manaCost && (u.spellCardCharge ?? 0) >= card.chargeCost;
});

const totalPotionCharges = computed(() => {
  const u = store.activeUnit;
  if (!u || u.kind !== 'hero') return 0;
  return u.potions.reduce((sum, p) => sum + p.charges, 0);
});

const heroUsedPotionThisRound = computed(() => {
  const u = store.activeUnit;
  return Boolean(u && u.kind === 'hero' && u.hasUsedPotionThisRound);
});

const statusWord = computed(() => {
  if (store.battleState.phase === 'finished') return '战局终结';
  if (!store.activeUnit) return '';
  if (!store.isHumanTurn) return '敌阵演算';
  if (store.declaringSpellCard) return '符卡瞄准';
  if (store.selectedSpellId) return '术式选点';
  if (store.canToggleAttackMode && store.effectiveAttackMode === 'melee') return '近战模式';
  return '静候指令';
});

const attackModeTitle = computed(() => {
  if (store.rangedBlockedReason) {
    return `${store.rangedBlockedReason}（当前无法切回远程）`;
  }
  return store.effectiveAttackMode === 'melee'
    ? '当前：近战突击（点击或按 M 切回远程射击）'
    : '当前：远程射击（点击或按 M 切换近战突击）';
});

/** 当前激活的法术瞄准信息条（含有效消耗与射程） */
const activeTargetingBanner = computed(() => {
  void store.stateVersion;
  const act = store.activeUnit;
  if (!act) return null;
  if (store.declaringSpellCard && act.signatureSpellCardId) {
    const card = TOUHOU_CATALOG.spellCards[act.signatureSpellCardId];
    if (card) {
      return {
        title: `符卡 · ${card.name}`,
        meta: `${card.manaCost} MP · 直线 ${card.lineLength ?? 14} 格`,
        iconUrl: null as string | null,
        accent: '#f5df9e',
      };
    }
  }
  if (store.selectedSpell) {
    const sp = store.selectedSpell;
    const cost = getEffectiveSpellManaCost(store.battleState, act, sp);
    const range = getEffectiveSpellRange(store.battleState, act, sp);
    return {
      title: sp.name,
      meta: `${cost} MP · ${range > 0 ? `射程 ${range} 格` : '全图施放'}${sp.ignoreLos ? ' · 无视视线' : ''}`,
      iconUrl: getSpellIconDataUrl(sp.id),
      accent: '#cfa8ff',
    };
  }
  return null;
});

/** 下方信息区展示的主单位：鼠标悬停任意单位时即时切过去，移出后平滑回到当前行动单位 */
const displayUnit = computed(() => {
  void store.stateVersion;
  return store.hoveredUnit ?? store.activeUnit;
});

const isShowingHoveredUnit = computed(() => Boolean(store.hoveredUnit));

const displayUnitRelation = computed(() => {
  const u = displayUnit.value;
  if (!u) return { label: '', cls: '' };
  const prefix = isTouchMode.value ? '已选' : '悬停';
  if (u.id === store.activeUnit?.id) {
    return {
      label: isShowingHoveredUnit.value ? `${prefix} · 当前行动` : '当前行动',
      cls: 'border-[#e6be6a]/65 bg-[#382914] text-[#ffe9a6]',
    };
  }
  const activeSide = store.activeUnit?.side ?? 'left';
  if (u.side === activeSide) {
    return {
      label: `${prefix} · 我方友军`,
      cls: 'border-[#54c49c]/60 bg-[#103026] text-[#9ff5d4]',
    };
  }
  return {
    label: `${prefix} · 敌方目标`,
    cls: 'border-[#e0586c]/65 bg-[#3b121c] text-[#ffb8c4]',
  };
});

const displayStats = computed(() => {
  void store.stateVersion;
  const u = displayUnit.value;
  if (!u) return null;
  return computeUnitStats(u, store.battleState, TOUHOU_CATALOG);
});

const displayCreatureDef = computed(() => {
  const u = displayUnit.value;
  if (!u || u.kind !== 'creature') return null;
  return TOUHOU_CATALOG.creatures[u.defId] ?? null;
});

const displayAlignMeta = computed(() =>
  displayUnit.value ? ALIGNMENT_META[displayUnit.value.alignment] : null,
);

const displayPortraitUrl = computed(() => {
  const u = displayUnit.value;
  if (!u) return '';
  return getVoxelAvatarDataUrl(u.voxelBlueprintId, 56);
});

const displayHpPct = computed(() => {
  const u = displayUnit.value;
  const s = displayStats.value;
  if (!u || !s || u.status !== 'alive') return 0;
  return Math.max(0, Math.min(100, Math.round((u.currentHp / Math.max(1, s.maxHp)) * 100)));
});

const displayMpPct = computed(() => {
  const u = displayUnit.value;
  const s = displayStats.value;
  if (!u || !s || s.maxMana <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((u.mana ?? 0) / Math.max(1, s.maxMana)) * 100)));
});

const displaySpecialties = computed(() => {
  void store.stateVersion;
  const u = displayUnit.value;
  if (!u) return [];
  return buildUnitSpecialtyBadges(u).slice(0, 5);
});

const displayStatusBadges = computed(() => {
  void store.stateVersion;
  const u = displayUnit.value;
  if (!u) return [];
  return buildUnitStatusBadges(u, store.battleState).slice(0, 8);
});

/** 交锋预测上下文（《圣女战旗》式双栏对比） */
const atkCtx = computed(() => store.hoverAttackContext);
const spellCtx = computed(() => store.hoverSpellContext);

const atkAvatarLeft = computed(() =>
  atkCtx.value ? getVoxelAvatarDataUrl(atkCtx.value.attacker.voxelBlueprintId, 36) : '',
);
const atkAvatarRight = computed(() =>
  atkCtx.value ? getVoxelAvatarDataUrl(atkCtx.value.defender.voxelBlueprintId, 36) : '',
);

const atkPenaltyBadge = computed(() => {
  const p = atkCtx.value?.preview;
  if (!p) return null;
  if (!p.valid) return { text: '无法命中', cls: 'border-[#e04b5a] bg-[#3d1019] text-[#ffb8c2]' };
  if (!p.isRanged && p.isLongWeaponPoke) {
    return { text: '长手免反', cls: 'border-[#54d4a8] bg-[#10382e] text-[#a6ffdf]' };
  }
  if (!p.isRanged) return { text: '近战突击', cls: 'border-[#cfa75b] bg-[#2e2214] text-[#f5df9e]' };
  if (p.rangedPenaltyTier === 'full') return { text: '全伤 1×', cls: 'border-[#54d4a8] bg-[#10382e] text-[#a6ffdf]' };
  if (p.rangedPenaltyTier === 'half') return { text: '衰减 1/2', cls: 'border-[#e0a84c] bg-[#3d2910] text-[#ffe19c]' };
  if (p.rangedPenaltyTier === 'quarter') return { text: '衰减 1/4', cls: 'border-[#e05a4c] bg-[#451714] text-[#ffb8ae]' };
  return { text: '衰减 1/8', cls: 'border-[#d94873] bg-[#3d1024] text-[#ffb3cb]' };
});

const exchangeModeLabel = computed(() => {
  const p = atkCtx.value?.preview;
  if (!p || !p.willRetaliate) return '单向无反击';
  if (p.exchangeMode === 'attacker_first') return '我方先攻压制';
  if (p.exchangeMode === 'defender_first') return '敌方先攻警告';
  return '同时反击';
});

/** 鼠标悬停空地/障碍格时的地形战术情报 */
const showTerrainCard = computed(() => Boolean(store.hoveredTile && store.hoveredTileInfo && !store.hoveredUnit));

/** 贴底最新 2 条精简战报 */
const miniLogs = computed(() => {
  void store.stateVersion;
  return store.battleState.actionLog.slice(-2).reverse();
});

function inspectDisplayUnit(e: MouseEvent): void {
  const u = displayUnit.value;
  if (!u) return;
  store.openUnitDetail(u.id, { x: Math.max(40, e.clientX - 420), y: Math.max(60, e.clientY - 220) });
}
</script>

<template>
  <!-- 移动端紧凑横屏折叠态：右侧边缘悬浮展开把手，释放 100% 棋盘视野 -->
  <button
    v-if="canCollapseSidebar && sidebarCollapsed"
    class="urushi-slip fixed right-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1.5 border-r-0 px-1.5 py-3 text-[#f5df9e] shadow-[-6px_0_20px_rgba(0,0,0,0.8)] select-none"
    style="margin-right: env(safe-area-inset-right, 0px);"
    title="展开右侧战术指令栏"
    @click="toggleSidebarCollapsed()"
  >
    <span
      v-if="spellCardReady"
      class="h-2 w-2 rounded-full bg-[#ffe46b] shadow-[0_0_8px_#ffe46b]"
    />
    <span class="font-display text-[10px] font-bold leading-tight">◂</span>
    <span class="font-display text-[10px] font-bold leading-tight [writing-mode:vertical-rl]">
      指令栏
    </span>
    <span class="font-num text-[9px] text-[#cbb898]">{{ store.battleState.round }}巡</span>
  </button>

  <aside
    v-else
    class="shrine-scroll-pillar relative z-30 flex h-full shrink-0 flex-col justify-between overflow-hidden select-none"
    :class="isTinyHeight ? 'px-1.5 py-1' : 'px-2.5 py-2'"
    :style="{ width: `${sidebarWidthPx}px` }"
  >
    <!-- ==================== 上半区：UI 控制区 ==================== -->
    <div class="flex shrink-0 flex-col">
      <OrnamentalFrame v-if="!isTinyHeight" variant="roller" />

      <!-- 顶栏：巡数铭牌 + 当前状态短语 + 静音铃扣 + 紧凑端收起把手 -->
      <div
        class="urushi-plaque flex items-center justify-between gap-1"
        :class="isTinyHeight ? 'mt-0.5 px-1.5 py-0.5' : 'mt-1.5 px-2 py-1'"
      >
        <div class="flex min-w-0 items-center gap-1">
          <span class="font-display shrink-0 text-[11px] font-bold text-[#f3df9e]">
            第<span class="font-num mx-0.5 text-[12px]">{{ store.battleState.round }}</span>巡
          </span>
          <span
            class="truncate border border-[#99763a]/45 bg-[#120d15] px-1 py-px text-[9px] text-[#cbb898]"
          >
            {{ statusWord }}
          </span>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <span v-if="!isCompactLandscape" class="font-display text-[9px] text-[#8f7f6b]">
            {{ store.mode === 'vs_ai' ? '人机' : '热座' }}
          </span>
          <button
            class="flex h-6 w-6 shrink-0 items-center justify-center border border-[#99763a]/55 bg-[#120d14] transition hover:border-[#f5df9e]"
            :title="store.audioSettings.muted ? '已静音（点击恢复鸣音）' : '鸣音中（点击静音）'"
            @click="store.toggleAudioMute()"
          >
            <svg viewBox="0 0 12 12" shape-rendering="crispEdges" class="h-3 w-3">
              <rect x="1" y="4" width="2" height="4" fill="#cfa75b" />
              <rect x="3" y="3" width="2" height="6" fill="#f5df9e" />
              <rect x="5" y="2" width="1" height="8" fill="#f5df9e" />
              <template v-if="!store.audioSettings.muted">
                <rect x="8" y="4" width="1" height="4" fill="#90e8d4" />
                <rect x="10" y="2" width="1" height="8" fill="#70c4b8" />
              </template>
              <template v-else>
                <rect x="7" y="4" width="1" height="1" fill="#e04b5a" />
                <rect x="8" y="5" width="1" height="2" fill="#e04b5a" />
                <rect x="9" y="4" width="1" height="1" fill="#e04b5a" />
                <rect x="7" y="7" width="1" height="1" fill="#e04b5a" />
                <rect x="9" y="7" width="1" height="1" fill="#e04b5a" />
              </template>
            </svg>
          </button>
          <button
            v-if="canCollapseSidebar"
            class="font-display flex h-6 w-6 shrink-0 items-center justify-center border border-[#99763a]/55 bg-[#120d14] text-[10px] text-[#e6cfa0] transition hover:border-[#f5df9e]"
            title="折叠指令栏以全屏观察战场"
            @click="toggleSidebarCollapsed()"
          >
            ▸
          </button>
        </div>
      </div>

      <!-- 2 列切角黄铜嵌木战术指令网格 -->
      <div class="grid grid-cols-2" :class="isTinyHeight ? 'mt-1 gap-1' : 'mt-2 gap-1.5'">
        <!-- 远程 / 近战切换（仅具备远程且未被近战禁手时占位左侧；否则魔导跨 2 列） -->
        <button
          v-if="store.canToggleAttackMode"
          class="lacquer-plaque-btn group flex h-8.5 items-center justify-center gap-1.5 px-2 disabled:opacity-55"
          :class="{
            'lacquer-plaque-btn-active': store.effectiveAttackMode === 'melee' && !store.rangedBlockedReason,
          }"
          :disabled="store.isAnimating || Boolean(store.rangedBlockedReason)"
          :title="attackModeTitle"
          @click="store.toggleAttackMode()"
        >
          <span
            v-if="store.effectiveAttackMode === 'melee' && !store.rangedBlockedReason"
            class="absolute inset-y-1.5 left-0.5 w-[2.5px] bg-[#e04b5a]"
          />
          <span
            v-else-if="store.effectiveAttackMode === 'ranged'"
            class="absolute inset-y-1.5 left-0.5 w-[2.5px] bg-[#78c8e6]"
          />
          <svg
            v-if="store.effectiveAttackMode === 'ranged'"
            viewBox="0 0 16 16"
            shape-rendering="crispEdges"
            class="h-4 w-4 shrink-0"
          >
            <rect x="4" y="2" width="2" height="2" fill="#cfa75b" />
            <rect x="3" y="4" width="2" height="8" fill="#cfa75b" />
            <rect x="4" y="12" width="2" height="2" fill="#cfa75b" />
            <rect x="6" y="4" width="1" height="8" fill="#8c7352" />
            <rect x="4" y="7" width="8" height="2" fill="#90e8ff" />
            <rect x="11" y="5" width="2" height="6" fill="#f5df9e" />
            <rect x="13" y="7" width="2" height="2" fill="#ffffff" />
          </svg>
          <svg v-else viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-4 w-4 shrink-0">
            <rect x="11" y="2" width="3" height="2" fill="#fff3d1" />
            <rect x="9" y="4" width="3" height="2" fill="#f5df9e" />
            <rect x="7" y="6" width="3" height="2" fill="#e6b85c" />
            <rect x="5" y="8" width="3" height="2" fill="#cfa75b" />
            <rect x="3" y="8" width="2" height="2" fill="#e04b5a" />
            <rect x="6" y="11" width="2" height="2" fill="#e04b5a" />
            <rect x="2" y="11" width="3" height="3" fill="#8c4c3a" />
          </svg>
          <span
            class="font-display text-[11px] font-bold"
            :class="store.effectiveAttackMode === 'melee' ? 'text-[#ffcf9e]' : 'text-[#a8e2f5]'"
          >
            {{ store.effectiveAttackMode === 'melee' ? '近战' : '远程' }}
          </span>
          <span
            class="font-num absolute right-1.5 top-0.5 text-[8.5px]"
            :class="store.rangedBlockedReason ? 'text-[#c97e86]' : 'text-[#b59c72]'"
          >
            {{ store.rangedBlockedReason ? '锁' : '⇄' }}
          </span>
        </button>

        <!-- 魔导折本 / 符卡 -->
        <button
          class="lacquer-plaque-btn group flex h-8.5 items-center justify-center gap-1.5 px-2 disabled:opacity-32"
          :class="{
            'col-span-2': !store.canToggleAttackMode,
            'lacquer-plaque-btn-active': store.activeDrawer === 'spells' || Boolean(store.selectedSpellId),
            'animate-makie-ready border-[#f5df9e]': spellCardReady,
          }"
          :disabled="!canOpenSpellbook || store.isAnimating"
          title="展开魔导折本与专属术式"
          @click="store.toggleDrawer('spells')"
        >
          <span
            v-if="store.activeDrawer === 'spells' || store.selectedSpellId"
            class="absolute inset-y-1.5 left-0.5 w-[2.5px] bg-[#e04b5a]"
          />
          <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-4 w-4 shrink-0">
            <rect x="1" y="3" width="6" height="10" fill="#6d3a54" />
            <rect x="9" y="3" width="6" height="10" fill="#7d4360" />
            <rect x="7" y="4" width="2" height="9" fill="#cfa75b" />
            <rect x="2" y="4" width="5" height="8" fill="#f3ead8" />
            <rect x="9" y="4" width="5" height="8" fill="#e6d3b3" />
            <rect x="3" y="6" width="3" height="1" fill="#8c3242" />
            <rect x="10" y="6" width="3" height="1" fill="#5a4526" />
            <rect v-if="spellCardReady" x="7" y="1" width="2" height="2" fill="#f5df9e" />
          </svg>
          <span class="font-display text-[11px] font-bold text-[#e5d5b5] group-hover:text-[#f5df9e]">
            {{ store.canToggleAttackMode ? '魔导' : '魔导折本 · 符卡' }}
          </span>
          <span
            v-if="spellCardReady"
            class="th-hanko absolute right-1.5 top-1 h-3.5 w-3.5 text-[8px]"
          >
            符
          </span>
        </button>

        <!-- 结界防御 -->
        <button
          class="lacquer-plaque-btn group flex h-8 items-center justify-center gap-1.5 px-2 disabled:opacity-32"
          :disabled="!store.isHumanTurn || store.isAnimating"
          title="防御姿态 (+35% 防御)"
          @click="store.defendTurn()"
        >
          <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-3.5 w-3.5 shrink-0">
            <rect x="3" y="2" width="10" height="2" fill="#cfa75b" />
            <rect x="3" y="4" width="10" height="6" fill="#5e6b85" />
            <rect x="4" y="10" width="8" height="2" fill="#47536b" />
            <rect x="6" y="12" width="4" height="2" fill="#323b4f" />
            <rect x="7" y="4" width="2" height="7" fill="#f5df9e" />
            <rect x="5" y="6" width="6" height="2" fill="#f5df9e" />
          </svg>
          <span class="font-display text-[10.5px] text-[#d9c8a8] group-hover:text-[#f5df9e]">防御</span>
        </button>

        <!-- 伺机等待 -->
        <button
          class="lacquer-plaque-btn group flex h-8 items-center justify-center gap-1.5 px-2 disabled:opacity-32"
          :disabled="!store.isHumanTurn || store.isAnimating || Boolean(store.activeUnit?.hasWaitedThisRound)"
          title="等待（延迟至本巡末尾行动）"
          @click="store.waitTurn()"
        >
          <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-3.5 w-3.5 shrink-0">
            <rect x="3" y="2" width="10" height="2" fill="#cfa75b" />
            <rect x="3" y="12" width="10" height="2" fill="#cfa75b" />
            <rect x="5" y="4" width="6" height="2" fill="#7aa8de" />
            <rect x="6" y="6" width="4" height="1" fill="#cfe2fa" />
            <rect x="7" y="7" width="2" height="2" fill="#f5df9e" />
            <rect x="6" y="9" width="4" height="1" fill="#7aa8de" />
            <rect x="5" y="10" width="6" height="2" fill="#e6c470" />
          </svg>
          <span class="font-display text-[10.5px] text-[#d9c8a8] group-hover:text-[#f5df9e]">等待</span>
        </button>

        <!-- 腰带秘药 -->
        <button
          class="lacquer-plaque-btn group flex h-8 items-center justify-center gap-1.5 px-2 disabled:opacity-32"
          :class="{ 'lacquer-plaque-btn-active': store.activeDrawer === 'potions' }"
          :disabled="!isHeroActing || store.isAnimating || totalPotionCharges <= 0 || heroUsedPotionThisRound"
          :title="
            heroUsedPotionThisRound
              ? '本回合已饮用秘药，下回合恢复使用'
              : '英雄腰带秘药袋（不消耗行动权，每回合限 1 次）'
          "
          @click="store.toggleDrawer('potions')"
        >
          <span
            v-if="store.activeDrawer === 'potions'"
            class="absolute inset-y-1.5 left-0.5 w-[2.5px] bg-[#55b887]"
          />
          <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-3.5 w-3.5 shrink-0">
            <rect x="6" y="2" width="4" height="2" fill="#cfa75b" />
            <rect x="7" y="4" width="2" height="2" fill="#d9e5f0" />
            <rect x="4" y="6" width="8" height="7" fill="#276e53" />
            <rect x="5" y="7" width="6" height="5" fill="#52c493" />
            <rect x="6" y="8" width="2" height="2" fill="#d8ffee" />
          </svg>
          <span class="font-display text-[10.5px] text-[#d9c8a8] group-hover:text-[#f5df9e]">秘药</span>
          <span
            v-if="heroUsedPotionThisRound"
            class="font-display text-[8.5px] text-[#e69a8a]"
          >
            已用
          </span>
          <span v-else-if="totalPotionCharges > 0" class="font-num text-[10px] font-bold text-[#8be8be]">
            ×{{ totalPotionCharges }}
          </span>
        </button>

        <!-- 暗夜战录 -->
        <button
          class="lacquer-plaque-btn group flex h-8 items-center justify-center gap-1.5 px-2"
          :class="{ 'lacquer-plaque-btn-active': store.activeDrawer === 'logs' }"
          title="展开完整暗夜战报录"
          @click="store.toggleDrawer('logs')"
        >
          <span
            v-if="store.activeDrawer === 'logs'"
            class="absolute inset-y-1.5 left-0.5 w-[2.5px] bg-[#cfa75b]"
          />
          <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-3.5 w-3.5 shrink-0">
            <rect x="3" y="2" width="10" height="12" fill="#d9c6a3" />
            <rect x="2" y="2" width="12" height="2" fill="#99763a" />
            <rect x="2" y="12" width="12" height="2" fill="#99763a" />
            <rect x="5" y="5" width="6" height="1" fill="#3a2b20" />
            <rect x="5" y="7" width="5" height="1" fill="#3a2b20" />
            <rect x="5" y="9" width="6" height="1" fill="#3a2b20" />
          </svg>
          <span class="font-display text-[10.5px] text-[#bca98c] group-hover:text-[#f5df9e]">战录</span>
        </button>

        <!-- 战局规仪 -->
        <button
          class="lacquer-plaque-btn group flex h-7.5 items-center justify-center gap-1.5 px-2"
          :class="{ 'lacquer-plaque-btn-active': store.activeDrawer === 'settings' }"
          title="战局规则与网格配置"
          @click="store.toggleDrawer('settings')"
        >
          <span
            v-if="store.activeDrawer === 'settings'"
            class="absolute inset-y-1.5 left-0.5 w-[2.5px] bg-[#cfa75b]"
          />
          <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-3.5 w-3.5 shrink-0">
            <rect x="6" y="2" width="4" height="2" fill="#cfa75b" />
            <rect x="6" y="12" width="4" height="2" fill="#cfa75b" />
            <rect x="2" y="6" width="2" height="4" fill="#cfa75b" />
            <rect x="12" y="6" width="2" height="4" fill="#cfa75b" />
            <rect x="4" y="4" width="8" height="8" fill="#8f6e3a" />
            <rect x="6" y="6" width="4" height="4" fill="#141016" />
          </svg>
          <span class="font-display text-[10px] text-[#bca98c] group-hover:text-[#f5df9e]">规仪</span>
        </button>

        <!-- 重开战局 -->
        <button
          class="lacquer-plaque-btn group flex h-7.5 items-center justify-center gap-1.5 px-2"
          title="重开本场战局"
          @click="store.restartBattle()"
        >
          <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-3.5 w-3.5 shrink-0">
            <rect x="3" y="2" width="2" height="12" fill="#cfa75b" />
            <rect x="5" y="3" width="8" height="5" fill="#b92c3b" />
            <rect x="7" y="4" width="5" height="3" fill="#e86472" />
          </svg>
          <span class="font-display text-[10px] text-[#bca98c] group-hover:text-[#f5df9e]">重战</span>
        </button>
      </div>

      <!-- 施法 / 符卡瞄准态快捷取消横条 -->
      <div
        v-if="activeTargetingBanner"
        class="mt-1.5 flex items-center justify-between gap-1.5 border border-[#b488ff]/65 bg-[#20132e] px-2 py-1"
      >
        <div class="flex min-w-0 items-center gap-1.5">
          <img
            v-if="activeTargetingBanner.iconUrl"
            :src="activeTargetingBanner.iconUrl"
            alt=""
            class="pixel-art h-5 w-5 shrink-0 border border-[#b488ff]/50 bg-[#120b1c]"
          />
          <div class="min-w-0">
            <div
              class="font-display truncate text-[10.5px] font-bold leading-tight"
              :style="{ color: activeTargetingBanner.accent }"
            >
              {{ activeTargetingBanner.title }}
            </div>
            <div class="font-num truncate text-[9px] text-[#bca7d6]">
              {{ activeTargetingBanner.meta }}
            </div>
          </div>
        </div>
        <button
          class="shrink-0 border border-[#d66d7e]/60 bg-[#36111a] px-1.5 py-0.5 text-[9.5px] text-[#ffd1d9] transition hover:border-[#ffa3b2]"
          title="取消施法选点 (Esc / 右键)"
          @click="store.clearTargeting()"
        >
          取消
        </button>
      </div>
    </div>

    <div class="shrink-0" :class="isTinyHeight ? 'my-1' : 'my-2'">
      <OrnamentalFrame variant="divider" />
    </div>

    <!-- ==================== 下半区：战术信息区（悬停情报 + 双栏交锋/施法预测） ==================== -->
    <div
      class="sidebar-info-scroll touch-scroll flex min-h-0 flex-1 flex-col overflow-y-auto pr-0.5"
      :class="isTinyHeight ? 'gap-1.5' : 'gap-2'"
    >
      <!-- ①-A 施法瞄准预测与阻挡诊断卡 -->
      <section
        v-if="spellCtx"
        class="washi-recess border-l-2 p-2 text-[10.5px]"
        :class="spellCtx.canCast ? 'border-l-[#b88aff]' : 'border-l-[#e04b5a]'"
      >
        <div class="flex items-center justify-between gap-1">
          <span class="font-display font-bold text-[#e2ccff]">
            施法预测 · {{ spellCtx.spell.name }}
          </span>
          <span
            class="font-num border px-1 py-px text-[9px] font-bold"
            :class="
              spellCtx.canCast
                ? 'border-[#54d4a8]/65 bg-[#10382e] text-[#a6ffdf]'
                : 'border-[#e04b5a]/70 bg-[#3d1019] text-[#ffb8c2]'
            "
          >
            {{ spellCtx.effRange > 0 ? `${spellCtx.distance}/${spellCtx.effRange}格` : '全图' }}
          </span>
        </div>

        <div v-if="spellCtx.targetUnit" class="mt-1 flex items-center justify-between text-[10px] text-[#cabba2]">
          <span class="truncate">目标：{{ spellCtx.targetUnit.name }}</span>
          <span class="font-num shrink-0 text-[#8ac2ff]">-{{ spellCtx.manaCost }} MP</span>
        </div>

        <div
          v-if="!spellCtx.canCast && spellCtx.reason"
          class="mt-1.5 border border-[#e04b5a]/60 bg-[#360e17] px-2 py-1 text-[10px] leading-snug text-[#ffc2cb]"
        >
          ✕ {{ spellCtx.reason }}
        </div>
        <div
          v-else
          class="mt-1.5 border border-[#54d4a8]/45 bg-[#0f2c23] px-2 py-1 text-[10px] leading-snug text-[#b4fae0]"
        >
          {{ isTouchMode ? '✓ 视线与射程畅通，再触或点确认施放' : '✓ 视线与射程畅通，左键立即施放' }}
        </div>
      </section>

      <!-- ①-B 《圣女战旗》式双栏攻防交锋预测卡 -->
      <section
        v-else-if="atkCtx"
        class="washi-recess border-l-2 p-2 text-[10.5px]"
        :class="atkCtx.preview.valid ? 'border-l-[#e6bd63]' : 'border-l-[#e04b5a]'"
      >
        <div class="flex items-center justify-between gap-1">
          <span class="font-display text-[11px] font-bold text-[#f5df9e]">
            {{ atkCtx.preview.valid ? '交锋预测' : '射击 / 攻击受阻' }}
          </span>
          <span
            v-if="atkPenaltyBadge"
            class="font-num border px-1.5 py-px text-[9px] font-bold leading-tight"
            :class="atkPenaltyBadge.cls"
          >
            {{ atkPenaltyBadge.text }}
          </span>
        </div>

        <!-- 无法命中时的醒目原因诊断匣 -->
        <div
          v-if="!atkCtx.preview.valid && atkCtx.preview.reason"
          class="mt-1.5 border border-[#e04b5a]/65 bg-[#380f18] px-2 py-1.5 text-[10px] font-semibold leading-snug text-[#ffc4cd]"
        >
          ✕ {{ atkCtx.preview.reason }}
        </div>

        <!-- 远程受阻但已自动转为近战突击时的贴心说明 -->
        <div
          v-else-if="atkCtx.preview.valid && !atkCtx.preview.isRanged && atkCtx.preview.rangedBlockReason"
          class="mt-1 border border-[#cfa75b]/55 bg-[#2e2010] px-1.5 py-1 text-[9.5px] leading-snug text-[#ffe1a6]"
        >
          ⚠ {{ atkCtx.preview.rangedBlockReason }}，已切近战
        </div>

        <!-- 双栏攻守对称预测（有伤害推演数据时展示） -->
        <div
          v-if="atkCtx.preview.expectedMaxDamage > 0"
          class="mt-1.5 grid grid-cols-2 gap-1.5"
        >
          <!-- 左：我方攻势 -->
          <div class="border border-[#99763a]/40 bg-[#140f17] p-1.5">
            <div class="flex items-center gap-1">
              <img
                :src="atkAvatarLeft"
                alt=""
                class="pixel-art h-5 w-5 shrink-0 border border-[#d44252]/70 bg-[#0d0a10]"
              />
              <span class="font-display truncate text-[9.5px] text-[#e6d3b3]">
                {{ atkCtx.attacker.name }}
              </span>
            </div>
            <div class="font-num mt-1 text-[13px] font-black leading-none text-[#ffe28a]">
              {{ atkCtx.preview.expectedMinDamage }}–{{ atkCtx.preview.expectedMaxDamage }}
            </div>
            <div class="font-num mt-0.5 text-[9.5px] text-[#f0a5ad]">
              <template v-if="atkCtx.defender.kind === 'creature'">
                预计折损 {{ atkCtx.preview.expectedMinKills }}–{{ atkCtx.preview.expectedMaxKills }}
              </template>
              <template v-else>
                对英雄伤害
              </template>
            </div>
          </div>

          <!-- 右：敌方反击 -->
          <div class="border border-[#99763a]/40 bg-[#140f17] p-1.5">
            <div class="flex items-center gap-1">
              <img
                :src="atkAvatarRight"
                alt=""
                class="pixel-art h-5 w-5 shrink-0 border border-[#5e9ae0]/70 bg-[#0d0a10]"
              />
              <span class="font-display truncate text-[9.5px] text-[#c7d8ee]">
                {{ atkCtx.defender.name }}
              </span>
            </div>
            <template v-if="atkCtx.preview.willRetaliate">
              <div class="font-num mt-1 text-[13px] font-black leading-none text-[#ff8798]">
                {{ atkCtx.preview.retaliationMinDamage }}–{{ atkCtx.preview.retaliationMaxDamage }}
              </div>
              <div class="font-num mt-0.5 truncate text-[9.5px] text-[#d6a3ab]">
                <template v-if="atkCtx.preview.retaliationTargetName">
                  替伤：{{ atkCtx.preview.retaliationTargetName }}
                </template>
                <template v-else-if="atkCtx.attacker.kind === 'creature'">
                  反击折损 {{ atkCtx.preview.retaliationMinKills }}–{{ atkCtx.preview.retaliationMaxKills }}
                </template>
                <template v-else>
                  敌方反击伤害
                </template>
              </div>
            </template>
            <template v-else>
              <div class="font-display mt-1.5 text-[11px] font-bold text-[#7ce8be]">无反击</div>
              <div class="mt-0.5 text-[9px] text-[#84a89a]">安全出手</div>
            </template>
          </div>
        </div>

        <!-- 结算次序、擦弹与关键修正标签 -->
        <div class="mt-1.5 flex flex-wrap items-center gap-1 text-[9px]">
          <span class="border border-[#99763a]/45 bg-[#1b141e] px-1 py-px text-[#d9c8a8]">
            {{ exchangeModeLabel }}
          </span>
          <span
            v-if="atkCtx.preview.isRanged && atkCtx.preview.targetGrazeChance > 0"
            class="font-num border border-[#62d6ff]/45 bg-[#0f2430] px-1 py-px text-[#9eeaff]"
          >
            擦弹 {{ Math.round(atkCtx.preview.targetGrazeChance * 100) }}%
          </span>
          <span
            v-if="atkCtx.preview.highGroundBonus"
            class="border border-[#e08a58]/60 bg-[#361b12] px-1 py-px text-[#ffc8a6]"
          >
            敌处高台 -25%
          </span>
          <span
            v-for="(note, nIdx) in atkCtx.preview.notes.slice(0, 3)"
            :key="nIdx"
            class="border border-[#78654b]/40 bg-[#17121a] px-1 py-px text-[#bca98c]"
          >
            {{ note }}
          </span>
        </div>
      </section>

      <!-- ② 当前行动 / 悬停单位常驻情报卡片 -->
      <section v-if="displayUnit && displayStats" class="washi-recess p-2">
        <!-- 顶部身份标签 + 完整档案入口 -->
        <div class="mb-1.5 flex items-center justify-between gap-1">
          <span
            class="font-display border px-1.5 py-px text-[9px] font-bold leading-tight"
            :class="displayUnitRelation.cls"
          >
            {{ displayUnitRelation.label }}
          </span>
          <button
            class="font-display transition hover:text-[#f5df9e]"
            :class="
              isTouchMode
                ? 'border border-[#99763a]/55 bg-[#1e1720] px-1.5 py-0.5 text-[9.5px] font-bold text-[#f0dca8]'
                : 'text-[9.5px] text-[#c7b38e] underline decoration-[#99763a]/55 underline-offset-2'
            "
            :title="isTouchMode ? '点击打开完整单位档案（长按战场棋子亦可直接查看）' : '打开完整单位档案（战场上右键任意单位也可直接查看）'"
            @click="inspectDisplayUnit"
          >
            完整档案
          </button>
        </div>

        <!-- 单位肖像 + 名称 + 罗马数字阶位徽章 -->
        <div class="flex items-center gap-2">
          <button
            class="sacred-mirror-frame shrink-0 overflow-hidden rounded-full transition hover:brightness-110"
            :class="isTinyHeight ? 'h-[40px] w-[40px]' : 'h-[52px] w-[52px]'"
            :style="{ borderColor: displayUnit.side === 'left' ? '#d44252' : '#5e9ae0' }"
            :title="`点击查看 ${displayUnit.name} 完整详情`"
            @click="inspectDisplayUnit"
          >
            <img
              v-if="displayPortraitUrl"
              :src="displayPortraitUrl"
              :alt="displayUnit.name"
              class="pixel-art h-full w-full object-cover"
            />
          </button>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <div class="font-display truncate text-[12.5px] font-black text-[#f5ecd6]">
                {{ displayUnit.name }}
              </div>
              <TierBadgeIcon
                v-if="displayUnit.kind === 'creature'"
                :tier="displayCreatureDef?.tier ?? 1"
                size="xs"
              />
              <span
                v-else
                class="font-num shrink-0 border border-[#f0c34a]/65 bg-[#362510] px-1 py-px text-[9px] font-bold text-[#ffe699]"
              >
                Lv.{{ displayUnit.level ?? 1 }}
              </span>
            </div>

            <div class="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9.5px]">
              <span v-if="displayAlignMeta" :style="{ color: displayAlignMeta.textColor }">
                {{ displayAlignMeta.factionName }}
              </span>
              <span class="font-num text-[#a99b87]">
                {{ displayUnit.footprint.replace('x', '×') }}
              </span>
              <span
                v-if="displayUnit.kind === 'creature'"
                class="font-num font-bold text-[#f5df9e]"
              >
                ×{{ displayUnit.count }} 兵
              </span>
              <span v-else-if="displayUnit.status === 'knocked_out'" class="text-[#e06a78]">
                倒地
              </span>
            </div>
          </div>
        </div>

        <!-- HP / MP / 弹药 / 符卡充能进度条 -->
        <div class="mt-2 space-y-1">
          <!-- HP 条 -->
          <div>
            <div class="mb-0.5 flex items-center justify-between text-[9.5px]">
              <span class="text-[#a99b87]">生命 HP</span>
              <span class="font-num font-bold text-[#e6f5ea]">
                {{ displayUnit.currentHp }} / {{ displayStats.maxHp }}
              </span>
            </div>
            <div class="h-1.5 w-full overflow-hidden border border-[#5e4d34]/70 bg-[#0d0a10]">
              <div
                class="h-full transition-all duration-150"
                :style="{
                  width: `${displayHpPct}%`,
                  backgroundColor:
                    displayHpPct > 55 ? '#42e388' : displayHpPct > 25 ? '#f2c244' : '#f0485e',
                }"
              />
            </div>
          </div>

          <!-- MP 条（施法单位 / 英雄显示） -->
          <div v-if="displayStats.maxMana > 0">
            <div class="mb-0.5 flex items-center justify-between text-[9.5px]">
              <span class="text-[#94b2d8]">灵力 MP</span>
              <span class="font-num font-bold text-[#a6d4ff]">
                {{ displayUnit.mana ?? 0 }} / {{ displayStats.maxMana }}
              </span>
            </div>
            <div class="h-1.5 w-full overflow-hidden border border-[#3e587d]/70 bg-[#0a101c]">
              <div
                class="h-full bg-[#4ca0ff] transition-all duration-150"
                :style="{ width: `${displayMpPct}%` }"
              />
            </div>
          </div>

          <!-- 弹药 / 符卡充能紧凑双槽 -->
          <div
            v-if="displayUnit.abilities.ranged || displayUnit.kind === 'hero'"
            class="flex items-center justify-between gap-2 pt-0.5 text-[9.5px]"
          >
            <div v-if="displayUnit.abilities.ranged" class="flex items-center gap-1 text-[#d9c8a8]">
              <span class="text-[#9b8c78]">弹药</span>
              <span
                class="font-num font-bold"
                :class="
                  displayUnit.abilities.unlimitedShots
                    ? 'text-[#dfc4ff]'
                    : displayUnit.ammo <= 0
                      ? 'text-[#ff6b81]'
                      : 'text-[#f5df9e]'
                "
              >
                {{
                  displayUnit.abilities.unlimitedShots
                    ? '∞ 无限'
                    : `${displayUnit.ammo} / ${displayUnit.maxAmmo}`
                }}
              </span>
            </div>

            <div v-if="displayUnit.kind === 'hero'" class="flex items-center gap-1 text-[#d9c8a8]">
              <span class="text-[#9b8c78]">符卡</span>
              <span
                class="font-num font-bold"
                :class="(displayUnit.spellCardCharge ?? 0) >= 100 ? 'text-[#ffe46b]' : 'text-[#f0b884]'"
              >
                {{ displayUnit.spellCardCharge ?? 0 }}%
              </span>
            </div>
          </div>
        </div>

        <!-- 3×2 黄铜雕版六维属性速览 -->
        <div class="brass-ledger mt-2 grid grid-cols-3 gap-px text-center">
          <div class="brass-ledger-cell py-1">
            <div class="text-[8.5px] text-[#9b8c78]">攻击</div>
            <div class="font-num text-[11.5px] font-bold text-[#f2b885]">
              {{ displayStats.attack }}
            </div>
          </div>
          <div class="brass-ledger-cell py-1">
            <div class="text-[8.5px] text-[#9b8c78]">防御</div>
            <div class="font-num text-[11.5px] font-bold text-[#9bc6f0]">
              {{ displayStats.defense }}
            </div>
          </div>
          <div class="brass-ledger-cell py-1">
            <div class="text-[8.5px] text-[#9b8c78]">伤害</div>
            <div class="font-num text-[11px] font-bold text-[#f5df9e]">
              {{ displayStats.minDamage }}–{{ displayStats.maxDamage }}
            </div>
          </div>
          <div class="brass-ledger-cell py-1">
            <div class="text-[8.5px] text-[#9b8c78]">{{ displayUnit.abilities.flying ? '飞行' : '移动' }}</div>
            <div class="font-num text-[11.5px] font-bold text-[#90e8d4]">
              {{ displayStats.speed }}
            </div>
          </div>
          <div class="brass-ledger-cell py-1">
            <div class="text-[8.5px] text-[#9b8c78]">射程</div>
            <div
              class="font-num text-[11.5px] font-bold"
              :class="displayUnit.abilities.ranged && !displayUnit.abilities.noRanged ? 'text-[#a3d4ff]' : 'text-[#6c6054]'"
            >
              {{ displayUnit.abilities.ranged && !displayUnit.abilities.noRanged ? displayStats.range : '近战' }}
            </div>
          </div>
          <div class="brass-ledger-cell py-1">
            <div class="text-[8.5px] text-[#9b8c78]">擦弹</div>
            <div class="font-num text-[11.5px] font-bold text-[#8ce6ed]">
              {{ Math.round(displayStats.grazeChance * 100) }}%
            </div>
          </div>
        </div>

        <!-- 固有特技微胶囊 -->
        <div v-if="displaySpecialties.length > 0" class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="badge in displaySpecialties"
            :key="badge.id"
            class="inline-flex items-center gap-0.5 border px-1 py-0.5 text-[9px] leading-none"
            :style="{ backgroundColor: badge.bg, borderColor: badge.border, color: badge.accent }"
            :title="`${badge.tooltip.title}：${badge.tooltip.summary}`"
          >
            <PixelBadgeIcon :name="badge.icon" size-class="h-2.5 w-2.5 shrink-0" />
            <span>{{ badge.shortLabel }}</span>
          </span>
        </div>

        <!-- 当前生效 Buff/Debuff 像素图标微栏 -->
        <div v-if="displayStatusBadges.length > 0" class="mt-1.5 border-t border-[#99763a]/25 pt-1.5">
          <div class="mb-1 text-[8.5px] text-[#9b8c78]">当前状态</div>
          <div class="flex flex-wrap gap-1">
            <div
              v-for="st in displayStatusBadges"
              :key="st.id"
              class="relative flex h-6 w-6 items-center justify-center border"
              :style="{ backgroundColor: st.bg, borderColor: st.border }"
              :title="`${st.tooltip.title}：${st.tooltip.summary}`"
            >
              <img
                v-if="st.spellIconId"
                :src="getSpellIconDataUrl(st.spellIconId)"
                :alt="st.shortLabel"
                class="pixel-art h-5 w-5"
              />
              <PixelBadgeIcon v-else :name="st.icon" size-class="h-3.5 w-3.5" />
              <span
                v-if="st.roundsBadge"
                class="font-num absolute bottom-0 right-0 bg-[#0b0910]/90 px-0.5 text-[7px] font-bold leading-none text-[#f5df9e]"
              >
                {{ st.roundsBadge }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- ③ 悬停空地 / 障碍物地形战术情报卡（《圣女战旗》地形卡） -->
      <section v-if="showTerrainCard && store.hoveredTileInfo" class="washi-recess border-l-2 border-l-[#6fc7d4] p-2">
        <div class="flex items-center justify-between gap-1">
          <span class="font-display text-[11px] font-bold text-[#d2f5fa]">
            地形 · {{ store.hoveredTileInfo.name }}
          </span>
          <span class="font-num border border-[#6fc7d4]/45 bg-[#0e2026] px-1 py-px text-[8.5px] text-[#9fe8f2]">
            {{ store.hoveredTileInfo.elevationLabel }}
          </span>
        </div>
        <div class="mt-1 space-y-0.5 text-[9.5px] leading-snug text-[#b9c7cc]">
          <div>通行：{{ store.hoveredTileInfo.moveDesc }}</div>
          <div>视野：{{ store.hoveredTileInfo.losDesc }}</div>
        </div>
      </section>
    </div>

    <!-- ==================== 贴底：紧凑最新战报条 + 挂轴底杆 ==================== -->
    <div class="mt-1.5 shrink-0">
      <button
        class="washi-recess w-full px-2 py-1.5 text-left transition hover:border-[#cfa75b]"
        title="点击展开完整暗夜战录"
        @click="store.toggleDrawer('logs')"
      >
        <div class="mb-0.5 flex items-center justify-between text-[8.5px] text-[#9b8c78]">
          <span class="font-display">最新战报</span>
          <span class="text-[#c9a969]">战录 ▸</span>
        </div>
        <div
          v-for="(line, idx) in miniLogs"
          :key="idx"
          class="truncate text-[9.5px] leading-snug"
          :class="idx === 0 ? 'text-[#f2dfa8]' : 'text-[#9a8d7a]'"
        >
          {{ line }}
        </div>
        <div v-if="miniLogs.length === 0" class="text-[9.5px] text-[#75685a]">战局已启，静候首轮出手</div>
      </button>

      <div v-if="!isTinyHeight" class="mt-1.5">
        <OrnamentalFrame variant="roller" />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-info-scroll::-webkit-scrollbar {
  width: 4px;
}
.sidebar-info-scroll::-webkit-scrollbar-track {
  background: rgba(13, 10, 16, 0.5);
}
.sidebar-info-scroll::-webkit-scrollbar-thumb {
  background: rgba(153, 118, 58, 0.45);
}
.sidebar-info-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(207, 167, 91, 0.72);
}
</style>

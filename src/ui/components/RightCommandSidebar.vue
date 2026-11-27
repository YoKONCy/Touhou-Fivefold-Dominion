<script setup lang="ts">
/**
 * 幽夜漆金木刻挂轴右侧栏（96px 建筑级和风雕版柱）
 * - 融合原版 HoMM4 经典右侧竖排指令卷轴与东方博丽神社挂轴（掛軸）意象
 * - 上下两端为纯 SVG 雕刻木杆与朱砂绳结，中央为 7 枚切角黄铜嵌木指令匾，底部为八咫铜镜当前单位肖像
 */
import { computed } from 'vue';
import {
  LINEUP_VARIANT_META,
  PLAYABLE_FACTION_META,
  TOUHOU_CATALOG,
  type PlayableFactionId,
} from '@data/battlePresets';
import { getVoxelAvatarDataUrl } from '@renderer/voxelSprites';
import { useBattleStore } from '@ui/battleStore';
import OrnamentalFrame from '@ui/components/OrnamentalFrame.vue';

const store = useBattleStore();

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

const activePortraitUrl = computed(() => {
  const u = store.activeUnit;
  if (!u) return '';
  return getVoxelAvatarDataUrl(u.voxelBlueprintId, 64);
});

const statusWord = computed(() => {
  if (store.battleState.phase === 'finished') return '战局终结';
  if (!store.activeUnit) return '';
  if (!store.isHumanTurn) return '敌阵演算';
  if (store.declaringSpellCard) return '符卡瞄准';
  if (store.selectedSpellId) return '术式选点';
  if (store.tacticalCursor.label) return store.tacticalCursor.label;
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

const factionRimColor = computed(() =>
  store.activeUnit?.side === 'left' ? '#d44252' : '#5e9ae0',
);

function inspectActiveUnit(e: MouseEvent): void {
  const u = store.activeUnit;
  if (!u) return;
  store.openUnitDetail(u.id, { x: e.clientX - 380, y: Math.max(80, e.clientY - 220) });
}
</script>

<template>
  <aside
    class="shrine-scroll-pillar relative z-30 flex h-full w-[96px] shrink-0 flex-col items-center justify-between py-2.5 select-none"
  >
    <!-- 上半区：木刻挂轴顶杆 + 古金回合牌 + 7 枚切角黄铜嵌木指令匾 -->
    <div class="flex w-full flex-col items-center">
      <OrnamentalFrame variant="roller" />

      <!-- 回合铭牌 + 右侧一键静音小铃扣 -->
      <div class="urushi-plaque mt-2 flex w-[76px] items-center justify-between gap-1 px-1.5 py-1">
        <span class="font-display text-[10.5px] font-bold text-[#f3df9e]">
          第<span class="font-num mx-0.5 text-[11.5px]">{{ store.battleState.round }}</span>巡
        </span>
        <button
          class="flex h-4.5 w-4.5 shrink-0 items-center justify-center border border-[#99763a]/55 bg-[#120d14] transition hover:border-[#f5df9e]"
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
      </div>

      <!-- 我方阵营一键篆印切换（生命 / 秩序 / 混沌 / 死亡） -->
      <div class="urushi-plaque mt-1.5 grid w-[76px] grid-cols-4 overflow-hidden p-0.5">
        <button
          v-for="f in (['life', 'order', 'chaos', 'death'] as PlayableFactionId[])"
          :key="f"
          class="font-display py-0.5 text-[9px] font-bold transition"
          :class="
            store.leftFaction === f
              ? 'text-[#f8ebcc] shadow-[inset_0_0_0_1px_rgba(245,223,158,0.55)]'
              : 'text-[#8c7e6c] hover:text-[#e6d3b3]'
          "
          :style="
            store.leftFaction === f
              ? { backgroundColor: `${PLAYABLE_FACTION_META[f].themeColor}55` }
              : undefined
          "
          :title="`切换我方阵营：${PLAYABLE_FACTION_META[f].name}（${PLAYABLE_FACTION_META[f].heroName}）`"
          @click="store.switchLeftFaction(f)"
        >
          {{ PLAYABLE_FACTION_META[f].short.slice(0, 1) }}
        </button>
      </div>

      <!-- 极简 A / B 阵营编队切换铭片（一键体验各阵营全部 8 兵种） -->
      <div class="urushi-plaque mt-1 grid w-[76px] grid-cols-2 overflow-hidden p-0.5">
        <button
          v-for="v in (['A', 'B'] as const)"
          :key="v"
          class="font-display py-0.5 text-[9.5px] font-bold transition"
          :class="
            store.lineupVariant === v
              ? 'bg-[#6b1d2b] text-[#f5df9e] shadow-[inset_0_0_0_1px_rgba(245,223,158,0.5)]'
              : 'text-[#8c7e6c] hover:text-[#e6d3b3]'
          "
          :title="`${LINEUP_VARIANT_META[v].title}：${LINEUP_VARIANT_META[v].summary}`"
          @click="store.switchLineupVariant(v)"
        >
          {{ LINEUP_VARIANT_META[v].short }}
        </button>
      </div>

      <!-- 切角漆木指令匾区（最上方为远程/近战切换匾，带悬浮微标与朱红激活卡榫） -->
      <div class="mt-1.5 flex w-full flex-col items-center gap-1 px-2">
        <!-- 0. 远程 / 近战攻击模式切换（仅当前行动单位具备远程且未被近战禁手时显示） -->
        <button
          v-if="store.canToggleAttackMode"
          class="lacquer-plaque-btn group flex h-9.5 w-[72px] items-center justify-center disabled:opacity-55"
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
          <div class="flex items-center gap-1">
            <!-- 远程模式：古金灵弓与碧蓝矢箭；近战模式：炽金太刀刃 -->
            <svg
              v-if="store.effectiveAttackMode === 'ranged'"
              viewBox="0 0 16 16"
              shape-rendering="crispEdges"
              class="h-4.5 w-4.5"
            >
              <rect x="4" y="2" width="2" height="2" fill="#cfa75b" />
              <rect x="3" y="4" width="2" height="8" fill="#cfa75b" />
              <rect x="4" y="12" width="2" height="2" fill="#cfa75b" />
              <rect x="6" y="4" width="1" height="8" fill="#8c7352" />
              <rect x="4" y="7" width="8" height="2" fill="#90e8ff" />
              <rect x="11" y="5" width="2" height="6" fill="#f5df9e" />
              <rect x="13" y="7" width="2" height="2" fill="#ffffff" />
            </svg>
            <svg
              v-else
              viewBox="0 0 16 16"
              shape-rendering="crispEdges"
              class="h-4.5 w-4.5"
            >
              <rect x="11" y="2" width="3" height="2" fill="#fff3d1" />
              <rect x="9" y="4" width="3" height="2" fill="#f5df9e" />
              <rect x="7" y="6" width="3" height="2" fill="#e6b85c" />
              <rect x="5" y="8" width="3" height="2" fill="#cfa75b" />
              <rect x="3" y="8" width="2" height="2" fill="#e04b5a" />
              <rect x="6" y="11" width="2" height="2" fill="#e04b5a" />
              <rect x="2" y="11" width="3" height="3" fill="#8c4c3a" />
            </svg>
            <span
              class="font-display text-[10.5px] font-bold"
              :class="
                store.effectiveAttackMode === 'melee'
                  ? 'text-[#ffcf9e] group-hover:text-[#ffe6c4]'
                  : 'text-[#a8e2f5] group-hover:text-[#dff7ff]'
              "
            >
              {{ store.effectiveAttackMode === 'melee' ? '近战' : '远程' }}
            </span>
          </div>
          <span
            class="font-num absolute right-1 top-0.5 text-[8px] leading-none"
            :class="store.rangedBlockedReason ? 'text-[#c97e86]' : 'text-[#b59c72]'"
          >
            {{ store.rangedBlockedReason ? '锁' : '⇄' }}
          </span>
        </button>

        <!-- 1. 魔导折本 / 符卡（英雄与施法兵种皆可开启） -->
        <button
          class="lacquer-plaque-btn group flex h-10 w-[72px] items-center justify-center disabled:opacity-32"
          :class="{
            'lacquer-plaque-btn-active': store.activeDrawer === 'spells',
            'animate-makie-ready border-[#f5df9e]': spellCardReady,
          }"
          :disabled="!canOpenSpellbook || store.isAnimating"
          title="展开魔导折本与专属术式"
          @click="store.toggleDrawer('spells')"
        >
          <span
            v-if="store.activeDrawer === 'spells'"
            class="absolute inset-y-1.5 left-0.5 w-[2.5px] bg-[#e04b5a]"
          />
          <div class="flex flex-col items-center">
            <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-4.5 w-4.5">
              <rect x="1" y="3" width="6" height="10" fill="#6d3a54" />
              <rect x="9" y="3" width="6" height="10" fill="#7d4360" />
              <rect x="7" y="4" width="2" height="9" fill="#cfa75b" />
              <rect x="2" y="4" width="5" height="8" fill="#f3ead8" />
              <rect x="9" y="4" width="5" height="8" fill="#e6d3b3" />
              <rect x="3" y="6" width="3" height="1" fill="#8c3242" />
              <rect x="10" y="6" width="3" height="1" fill="#5a4526" />
              <rect v-if="spellCardReady" x="7" y="1" width="2" height="2" fill="#f5df9e" />
            </svg>
            <span class="font-display mt-0.5 text-[9px] leading-none text-[#d7c6a5] group-hover:text-[#f5df9e]">
              魔导
            </span>
          </div>
          <!-- 符卡满格朱印提示 -->
          <span
            v-if="spellCardReady"
            class="th-hanko absolute right-1 top-1 h-3.5 w-3.5 text-[8px]"
          >
            符
          </span>
        </button>

        <!-- 2. 结界防御 -->
        <button
          class="lacquer-plaque-btn group flex h-9 w-[72px] items-center justify-center disabled:opacity-32"
          :disabled="!store.isHumanTurn || store.isAnimating"
          title="防御姿态 (+35% 防御)"
          @click="store.defendTurn()"
        >
          <div class="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-4.5 w-4.5">
              <rect x="3" y="2" width="10" height="2" fill="#cfa75b" />
              <rect x="3" y="4" width="10" height="6" fill="#5e6b85" />
              <rect x="4" y="10" width="8" height="2" fill="#47536b" />
              <rect x="6" y="12" width="4" height="2" fill="#323b4f" />
              <rect x="7" y="4" width="2" height="7" fill="#f5df9e" />
              <rect x="5" y="6" width="6" height="2" fill="#f5df9e" />
            </svg>
            <span class="font-display text-[10.5px] text-[#d9c8a8] group-hover:text-[#f5df9e]">防御</span>
          </div>
        </button>

        <!-- 3. 伺机等待 -->
        <button
          class="lacquer-plaque-btn group flex h-9 w-[72px] items-center justify-center disabled:opacity-32"
          :disabled="!store.isHumanTurn || store.isAnimating || Boolean(store.activeUnit?.hasWaitedThisRound)"
          title="等待（延迟至本巡末尾行动）"
          @click="store.waitTurn()"
        >
          <div class="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-4.5 w-4.5">
              <rect x="3" y="2" width="10" height="2" fill="#cfa75b" />
              <rect x="3" y="12" width="10" height="2" fill="#cfa75b" />
              <rect x="5" y="4" width="6" height="2" fill="#7aa8de" />
              <rect x="6" y="6" width="4" height="1" fill="#cfe2fa" />
              <rect x="7" y="7" width="2" height="2" fill="#f5df9e" />
              <rect x="6" y="9" width="4" height="1" fill="#7aa8de" />
              <rect x="5" y="10" width="6" height="2" fill="#e6c470" />
            </svg>
            <span class="font-display text-[10.5px] text-[#d9c8a8] group-hover:text-[#f5df9e]">等待</span>
          </div>
        </button>

        <!-- 4. 腰带秘药 -->
        <button
          class="lacquer-plaque-btn group flex h-9 w-[72px] items-center justify-center disabled:opacity-32"
          :class="{ 'lacquer-plaque-btn-active': store.activeDrawer === 'potions' }"
          :disabled="!isHeroActing || store.isAnimating || totalPotionCharges <= 0 || heroUsedPotionThisRound"
          :title="
            heroUsedPotionThisRound
              ? '本回合已饮用秘药，下回合恢复使用（每名英雄每回合限 1 次）'
              : '英雄腰带秘药袋（不消耗行动权，每回合限用 1 次）'
          "
          @click="store.toggleDrawer('potions')"
        >
          <span
            v-if="store.activeDrawer === 'potions'"
            class="absolute inset-y-1.5 left-0.5 w-[2.5px] bg-[#55b887]"
          />
          <div class="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-4.5 w-4.5">
              <rect x="6" y="2" width="4" height="2" fill="#cfa75b" />
              <rect x="7" y="4" width="2" height="2" fill="#d9e5f0" />
              <rect x="4" y="6" width="8" height="7" fill="#276e53" />
              <rect x="5" y="7" width="6" height="5" fill="#52c493" />
              <rect x="6" y="8" width="2" height="2" fill="#d8ffee" />
            </svg>
            <span class="font-display text-[10.5px] text-[#d9c8a8] group-hover:text-[#f5df9e]">秘药</span>
          </div>
          <span
            v-if="heroUsedPotionThisRound"
            class="font-display absolute right-1 top-0.5 text-[8px] font-bold text-[#e69a8a]"
          >
            已用
          </span>
          <span
            v-else-if="totalPotionCharges > 0"
            class="font-num absolute right-1 top-0.5 text-[9.5px] font-bold text-[#8be8be]"
          >
            {{ totalPotionCharges }}
          </span>
        </button>

        <div class="my-0.5 w-[64px]">
          <OrnamentalFrame variant="divider" />
        </div>

        <!-- 5. 战报卷轴 -->
        <button
          class="lacquer-plaque-btn group flex h-8.5 w-[72px] items-center justify-center"
          :class="{ 'lacquer-plaque-btn-active': store.activeDrawer === 'logs' }"
          title="展开暗夜战报录"
          @click="store.toggleDrawer('logs')"
        >
          <span
            v-if="store.activeDrawer === 'logs'"
            class="absolute inset-y-1.5 left-0.5 w-[2.5px] bg-[#cfa75b]"
          />
          <div class="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-4 w-4">
              <rect x="3" y="2" width="10" height="12" fill="#d9c6a3" />
              <rect x="2" y="2" width="12" height="2" fill="#99763a" />
              <rect x="2" y="12" width="12" height="2" fill="#99763a" />
              <rect x="5" y="5" width="6" height="1" fill="#3a2b20" />
              <rect x="5" y="7" width="5" height="1" fill="#3a2b20" />
              <rect x="5" y="9" width="6" height="1" fill="#3a2b20" />
            </svg>
            <span class="font-display text-[10px] text-[#bca98c] group-hover:text-[#f5df9e]">战录</span>
          </div>
        </button>

        <!-- 6. 规则配置 -->
        <button
          class="lacquer-plaque-btn group flex h-8.5 w-[72px] items-center justify-center"
          :class="{ 'lacquer-plaque-btn-active': store.activeDrawer === 'settings' }"
          title="战局规则与网格配置"
          @click="store.toggleDrawer('settings')"
        >
          <span
            v-if="store.activeDrawer === 'settings'"
            class="absolute inset-y-1.5 left-0.5 w-[2.5px] bg-[#cfa75b]"
          />
          <div class="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-4 w-4">
              <rect x="6" y="2" width="4" height="2" fill="#cfa75b" />
              <rect x="6" y="12" width="4" height="2" fill="#cfa75b" />
              <rect x="2" y="6" width="2" height="4" fill="#cfa75b" />
              <rect x="12" y="6" width="2" height="4" fill="#cfa75b" />
              <rect x="4" y="4" width="8" height="8" fill="#8f6e3a" />
              <rect x="6" y="6" width="4" height="4" fill="#141016" />
            </svg>
            <span class="font-display text-[10px] text-[#bca98c] group-hover:text-[#f5df9e]">规仪</span>
          </div>
        </button>

        <!-- 7. 重启对局 -->
        <button
          class="lacquer-plaque-btn group flex h-8.5 w-[72px] items-center justify-center"
          title="重开本场战局"
          @click="store.restartBattle()"
        >
          <div class="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="h-4 w-4">
              <rect x="3" y="2" width="2" height="12" fill="#cfa75b" />
              <rect x="5" y="3" width="8" height="5" fill="#b92c3b" />
              <rect x="7" y="4" width="5" height="3" fill="#e86472" />
            </svg>
            <span class="font-display text-[10px] text-[#bca98c] group-hover:text-[#f5df9e]">重战</span>
          </div>
        </button>
      </div>
    </div>

    <!-- 下半区：八咫铜镜当前行动肖像 + 铭文名牌 + 底端挂轴木杆 -->
    <div class="flex w-full flex-col items-center px-1.5">
      <div class="mb-2.5 w-[74px]">
        <OrnamentalFrame variant="divider" />
      </div>

      <!-- 八咫铜镜肖像框（双环古金 + 四向菱钉） -->
      <button
        v-if="store.activeUnit"
        class="group relative flex h-[72px] w-[72px] items-center justify-center transition hover:brightness-110"
        :title="`当前行动：${store.activeUnit.name}（点击展开详情）`"
        @click="inspectActiveUnit"
      >
        <div
          class="sacred-mirror-frame h-[64px] w-[64px] overflow-hidden rounded-full"
          :style="{ borderColor: factionRimColor }"
        >
          <img
            v-if="activePortraitUrl"
            :src="activePortraitUrl"
            :alt="store.activeUnit.name"
            class="pixel-art h-full w-full object-cover"
          />
        </div>
        <!-- 四方位雕花黄铜铆钉外环 -->
        <svg viewBox="0 0 72 72" class="pointer-events-none absolute inset-0 h-full w-full" fill="none">
          <circle cx="36" cy="36" r="34" stroke="#99763a" stroke-opacity="0.65" stroke-width="1" />
          <path d="M36 0.5L39 4L36 7.5L33 4Z" fill="#f5df9e" stroke="#22170e" stroke-width="0.7" />
          <path d="M36 64.5L39 68L36 71.5L33 68Z" fill="#cfa75b" stroke="#22170e" stroke-width="0.7" />
          <path d="M0.5 36L4 39L7.5 36L4 33Z" fill="#cfa75b" stroke="#22170e" stroke-width="0.7" />
          <path d="M64.5 36L68 39L71.5 36L68 33Z" fill="#cfa75b" stroke="#22170e" stroke-width="0.7" />
        </svg>
      </button>

      <!-- 当前单位刻名匾 -->
      <div v-if="store.activeUnit" class="mt-1.5 w-full px-1 text-center">
        <div class="font-display truncate text-[11.5px] font-bold text-[#f3ead8]">
          {{ store.activeUnit.name }}
        </div>
        <div class="mt-0.5 h-3.5 truncate text-[9.5px] leading-3.5 tracking-wider text-[#b39f82]">
          {{ statusWord }}
        </div>

        <!-- 英雄或带蓝条小兵专属：极细漆金灵力（及英雄符卡充能）标尺 -->
        <div
          v-if="store.activeUnit.kind === 'hero' || store.activeUnit.baseStats.maxMana > 0"
          class="mx-auto mt-1.5 w-[68px] space-y-1"
        >
          <div class="h-[3.5px] w-full bg-[#09070b] ring-1 ring-[#99763a]/35">
            <div
              class="h-full bg-gradient-to-r from-[#3a6cb8] to-[#87bdf5]"
              :style="{
                width: `${Math.min(100, Math.round(((store.activeUnit.mana ?? 0) / Math.max(1, store.activeUnit.baseStats.maxMana)) * 100))}%`,
              }"
            />
          </div>
          <div
            v-if="store.activeUnit.kind === 'hero'"
            class="h-[3.5px] w-full bg-[#09070b] ring-1 ring-[#99763a]/35"
          >
            <div
              class="h-full bg-gradient-to-r from-[#b92c3b] via-[#e3a844] to-[#f5df9e]"
              :style="{ width: `${store.activeUnit.spellCardCharge ?? 0}%` }"
            />
          </div>
        </div>
      </div>

      <div class="mt-2 mb-2 text-center text-[8.5px] leading-tight tracking-wider text-[#6e6154]">
        右击棋子鉴查
      </div>

      <OrnamentalFrame variant="roller" />
    </div>
  </aside>
</template>

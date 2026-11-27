<script setup lang="ts">
import { computed, ref } from 'vue';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { getSpellCopy } from '@data/spellCopy';
import { useBattleStore } from '@ui/battleStore';

const store = useBattleStore();
const showLog = ref(true);

const activeHeroCard = computed(() => {
  const u = store.activeUnit;
  if (!u || u.kind !== 'hero' || !u.signatureSpellCardId) return null;
  return TOUHOU_CATALOG.spellCards[u.signatureSpellCardId] ?? null;
});

const canFireSpellCard = computed(() => {
  const u = store.activeUnit;
  const card = activeHeroCard.value;
  if (!u || !card || !store.isHumanTurn || store.isAnimating) return false;
  return (u.mana ?? 0) >= card.manaCost && (u.spellCardCharge ?? 0) >= card.chargeCost;
});

const knownSpells = computed(() => {
  const u = store.activeUnit;
  if (!u || u.kind !== 'hero') return [];
  return u.knownSpellIds.map((id) => TOUHOU_CATALOG.spells[id]).filter(Boolean);
});

const activePotions = computed(() => {
  const u = store.activeUnit;
  if (!u || u.kind !== 'hero') return [];
  return u.potions
    .map((slot) => ({ slot, def: TOUHOU_CATALOG.potions[slot.potionId] }))
    .filter((item) => Boolean(item.def));
});

const recentLogs = computed(() => {
  void store.stateVersion;
  return store.battleState.actionLog.slice(-5).reverse();
});
</script>

<template>
  <footer class="pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex items-end justify-between gap-2 px-3 pb-2.5">
    <!-- 左下安全占位（对齐 248px 单位详单） -->
    <div class="w-[252px] shrink-0" />

    <!-- 中下：规整双行和风指令台（绝不杂乱折行） -->
    <div
      v-if="store.activeUnit && store.battleState.phase === 'active'"
      class="th-panel th-panel-glow pointer-events-auto flex max-w-[660px] flex-col gap-1.5 rounded-xl px-3 py-2"
    >
      <!-- 第一行：行动提示 + 经典等待/防御 + 药水 -->
      <div class="flex items-center justify-between gap-2 border-b border-[#e4c16f]/15 pb-1.5">
        <div class="flex min-w-0 items-center gap-1.5 text-xs">
          <span
            class="inline-block h-2 w-2 shrink-0 rounded-full"
            :style="{ backgroundColor: store.activeUnit.themeColor }"
          />
          <span class="shrink-0 font-bold text-[#fff4d4]">{{ store.activeUnit.name }}</span>
          <span class="truncate text-[11px] text-[#9aa6c4]">
            {{
              store.isHumanTurn
                ? store.declaringSpellCard
                  ? '点击六边形选定发射方向'
                  : store.selectedSpellId
                    ? '点击战场目标施放术式'
                    : '青框移动 · 红框交锋'
                : 'AI 战术推演中...'
            }}
          </span>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <button
            v-if="store.selectedSpellId || store.declaringSpellCard"
            class="rounded bg-[#ff5c72]/25 px-2 py-0.5 text-[11px] text-[#ffb0bb] hover:bg-[#ff5c72]/40"
            @click="store.clearTargeting()"
          >
            取消
          </button>
          <button
            class="rounded border border-[#7ea8ff]/40 bg-[#15203b] px-2.5 py-0.5 text-[11px] font-semibold text-[#cde0ff] transition hover:bg-[#1f3059] disabled:opacity-40"
            :disabled="!store.isHumanTurn || store.isAnimating || store.activeUnit.hasWaitedThisRound"
            title="HoMM4 等待：推迟至本回合末后手行动"
            @click="store.waitTurn()"
          >
            等待
          </button>
          <button
            class="rounded border border-[#e4c16f]/45 bg-[#292318] px-2.5 py-0.5 text-[11px] font-semibold text-[#ffe8ad] transition hover:bg-[#3d3422] disabled:opacity-40"
            :disabled="!store.isHumanTurn || store.isAnimating"
            title="防御姿态：本轮防御 +35%"
            @click="store.defendTurn()"
          >
            防御
          </button>
        </div>
      </div>

      <!-- 第二行（英雄专属）：符卡宣言 + 通用术式 + 腰带免费药水 -->
      <div v-if="store.activeUnit.kind === 'hero'" class="flex flex-wrap items-center gap-1.5">
        <button
          v-if="activeHeroCard"
          class="relative overflow-hidden rounded-lg border px-2.5 py-1 text-left transition"
          :class="
            canFireSpellCard
              ? 'border-[#ffe484] bg-gradient-to-r from-[#52182b] to-[#3b2912] text-[#fff6d6] shadow-[0_0_14px_rgba(255,212,96,0.4)] hover:brightness-115'
              : 'border-[#e4c16f]/25 bg-[#121626] text-[#8d97b3]'
          "
          :title="activeHeroCard.description"
          @click="store.triggerSpellCard()"
        >
          <div class="flex items-center gap-2 text-[11px] font-bold">
            <span>✦ {{ activeHeroCard.name }}</span>
            <span class="font-mono text-[10px]">
              {{ store.activeUnit.spellCardCharge ?? 0 }}% · {{ activeHeroCard.manaCost }}MP
            </span>
          </div>
          <div class="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-black/50">
            <div
              class="h-full transition-all duration-300"
              :style="{
                width: `${store.activeUnit.spellCardCharge ?? 0}%`,
                backgroundColor: activeHeroCard.fieldAura?.themeColor ?? '#f6c945',
              }"
            />
          </div>
        </button>

        <button
          v-for="spell in knownSpells"
          :key="spell.id"
          class="rounded-md border px-2 py-1 text-[11px] transition"
          :class="[
            store.selectedSpellId === spell.id
              ? 'border-[#9ec5ff] bg-[#2a4073] text-white'
              : (store.activeUnit.mana ?? 0) >= spell.manaCost && store.isHumanTurn
                ? 'border-[#6aa9ff]/35 bg-[#141c33] text-[#d6e4ff] hover:border-[#9ec5ff]'
                : 'border-white/10 bg-[#0d111e] text-[#636e8a]',
          ]"
          :disabled="!store.isHumanTurn || store.isAnimating || (store.activeUnit.mana ?? 0) < spell.manaCost"
          :title="`${getSpellCopy(spell).summary}\n${getSpellCopy(spell).effect}`"
          @click="store.selectSpell(spell.id)"
        >
          <span class="font-semibold">{{ spell.name }}</span>
          <span class="ml-1 font-mono text-[10px] text-[#8db8ff]">{{ spell.manaCost }}</span>
        </button>

        <div v-if="activePotions.length > 0" class="flex items-center gap-1 border-l border-[#e4c16f]/20 pl-1.5">
          <button
            v-for="{ slot, def } in activePotions"
            :key="slot.potionId"
            class="rounded-md border px-1.5 py-1 text-[10px] transition"
            :class="
              slot.charges > 0 && store.isHumanTurn
                ? 'border-[#5ee39a]/40 bg-[#10261f] text-[#c9ffe0] hover:border-[#8dffbf]'
                : 'border-white/10 bg-[#0c101a] text-[#555f78]'
            "
            :disabled="slot.charges <= 0 || !store.isHumanTurn || store.isAnimating"
            :title="`${def.name}（免费自由动作）：${def.description}`"
            @click="store.usePotion(slot.potionId)"
          >
            {{ def.name.slice(0, 4) }}×{{ slot.charges }}
          </button>
        </div>
      </div>
    </div>

    <!-- 右下：紧凑暗夜实时战报 -->
    <div class="th-panel pointer-events-auto w-[252px] shrink-0 rounded-xl px-2.5 py-2">
      <div class="flex items-center justify-between text-[11px]">
        <span class="font-semibold text-[#e4c16f]">暗夜战报</span>
        <button class="text-[10px] text-[#8d99b8] hover:text-white" @click="showLog = !showLog">
          {{ showLog ? '收起' : '展开' }}
        </button>
      </div>
      <ul v-if="showLog" class="mt-1 max-h-[72px] space-y-0.5 overflow-y-auto pr-1 text-[10.5px] leading-snug text-[#c6cfe6]">
        <li
          v-for="(line, idx) in recentLogs"
          :key="idx"
          :class="idx === 0 ? 'text-[#fff2c6] font-medium' : 'opacity-75'"
        >
          {{ line }}
        </li>
      </ul>
    </div>
  </footer>
</template>

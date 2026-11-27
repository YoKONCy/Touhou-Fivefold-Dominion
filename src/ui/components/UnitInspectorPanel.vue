<script setup lang="ts">
import { computed, ref } from 'vue';
import { ALIGNMENT_META } from '@core/alignment';
import { HERO_TRAIT_REGISTRY } from '@core/traits';
import { resolveUnitSummonKind } from '@core/types';
import { useBattleStore } from '@ui/battleStore';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import RichSemanticText from '@ui/components/RichSemanticText.vue';
import { getUnitHeaderCreatureTags, SUMMON_KIND_HP_THEME } from '@ui/semanticFormat';

const store = useBattleStore();
/** 特质与加成明细默认收起，保证棋盘左下视野 100% 零遮挡，点击可随时展开细查 */
const showDetails = ref(false);

const unit = computed(() => store.inspectedUnit);
const stats = computed(() => store.inspectedStats);
const alignMeta = computed(() => (unit.value ? ALIGNMENT_META[unit.value.alignment] : null));
const summonHpTheme = computed(() => {
  const kind = unit.value ? resolveUnitSummonKind(unit.value) : null;
  return kind ? SUMMON_KIND_HP_THEME[kind] : null;
});
const headerCreatureTags = computed(() => (unit.value ? getUnitHeaderCreatureTags(unit.value) : []));
const traits = computed(() =>
  (unit.value?.innateTraitIds ?? []).map((id) => HERO_TRAIT_REGISTRY[id]).filter(Boolean),
);

const statRows = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { label: '攻/防', value: `${s.attack}/${s.defense}` },
    { label: '伤害', value: `${s.minDamage}-${s.maxDamage}` },
    { label: '移/先', value: `${s.speed}/${s.initiative}` },
    { label: '擦/抗', value: `${Math.round(s.grazeChance * 100)}%/${Math.round(s.magicResistance * 100)}%` },
    { label: '士/运', value: `${s.morale >= 0 ? '+' : ''}${s.morale}/${s.luck >= 0 ? '+' : ''}${s.luck}` },
    { label: '法强', value: `${s.spellPower}` },
  ];
});

const modifierSummaries = computed(() => {
  const s = stats.value;
  if (!s) return [];
  const seen = new Set<string>();
  const list: Array<{ sourceName: string; deltaText: string }> = [];
  for (const arr of Object.values(s.breakdowns)) {
    if (!arr) continue;
    for (const item of arr) {
      const k = `${item.sourceName}:${item.deltaText}`;
      if (seen.has(k)) continue;
      seen.add(k);
      list.push(item);
    }
  }
  return list.slice(0, 6);
});
</script>

<template>
  <aside
    v-if="unit && stats"
    class="th-panel pointer-events-auto fixed bottom-2.5 left-3 z-20 w-[248px] rounded-xl p-2.5 text-xs"
  >
    <!-- 展开的特质/套装/加成详单气泡（向上展开） -->
    <div
      v-if="showDetails"
      class="th-panel mb-2 space-y-1.5 rounded-lg p-2 text-[10px] leading-snug"
    >
      <div v-for="tr in traits" :key="tr.id" class="rounded bg-[#1a1526]/80 p-1.5">
        <div class="font-semibold text-[#ffe399]">★ 固有特质 · {{ tr.name }}</div>
        <div class="mt-0.5 text-[#c0c8de]">
          <RichSemanticText :text="tr.description" />
        </div>
      </div>

      <div
        v-for="setDef in store.inspectedArtifactSets"
        :key="setDef.id"
        class="rounded bg-[#101e30]/80 px-1.5 py-1 text-[#bdefff]"
      >
        ◆ 组合神器：{{ setDef.name }}
      </div>

      <div v-if="modifierSummaries.length > 0">
        <div class="font-semibold text-[#94a0be]">生效加成明细</div>
        <div class="mt-1 flex flex-wrap gap-1">
          <span
            v-for="(m, idx) in modifierSummaries"
            :key="idx"
            class="rounded bg-white/8 px-1.5 py-0.5 text-[9.5px] text-[#d6def2]"
          >
            {{ m.sourceName }} {{ m.deltaText }}
          </span>
        </div>
      </div>
    </div>

    <!-- 紧凑头部 -->
    <div class="flex items-center justify-between gap-1.5 border-b border-[#e4c16f]/20 pb-1.5">
      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <span
            class="inline-block h-2 w-2 shrink-0 rounded-sm"
            :style="{ backgroundColor: unit.themeColor }"
          />
          <h2 class="truncate text-xs font-bold text-[#fff4d4]">{{ unit.name }}</h2>
          <span
            v-if="unit.kind === 'hero'"
            class="shrink-0 rounded bg-[#e4c16f]/20 px-1 text-[10px] font-semibold text-[#ffe6a3]"
          >
            Lv.{{ unit.level }}
          </span>
          <span v-else class="shrink-0 rounded bg-white/10 px-1 text-[10px] text-[#cfd8ee]">
            ×{{ unit.count }}
          </span>
        </div>
        <div class="mt-0.5 flex flex-wrap items-center gap-1 text-[10px]">
          <span v-if="alignMeta" class="font-semibold" :style="{ color: alignMeta.textColor }">
            {{ alignMeta.factionName }} · {{ alignMeta.name }}
          </span>
          <span
            v-for="ct in headerCreatureTags"
            :key="ct.id"
            class="inline-flex items-center gap-0.5 rounded-sm border px-1 text-[9px] font-semibold leading-tight"
            :style="{ color: ct.color, backgroundColor: ct.bg, borderColor: ct.border }"
          >
            <PixelBadgeIcon :name="ct.icon" size-class="h-2.5 w-2.5 shrink-0" />
            <span>{{ ct.label }}</span>
          </span>
          <span v-if="store.inspectedAdvancedClass" class="text-[#c7d4f5]">
            · {{ store.inspectedAdvancedClass.name }}
          </span>
        </div>
      </div>

      <button
        class="shrink-0 rounded border border-[#e4c16f]/35 bg-[#1b2136] px-1.5 py-0.5 text-[10px] text-[#ffe399] hover:bg-[#283152]"
        @click="showDetails = !showDetails"
      >
        {{ showDetails ? '收起' : '特质/详情' }}
      </button>
    </div>

    <!-- 紧凑生命 / 灵力 / P点条 -->
    <div class="mt-1.5 space-y-1">
      <div class="flex items-center gap-2 text-[10px]">
        <span class="w-7 text-[#98a6c4]">HP</span>
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-black/55">
          <div
            class="h-full"
            :style="{
              width: `${Math.min(100, Math.round((unit.currentHp / stats.maxHp) * 100))}%`,
              background: summonHpTheme?.hpGradient ?? 'linear-gradient(90deg, #38c172 0%, #7ef5ae 100%)',
            }"
          />
        </div>
        <span
          class="w-12 text-right font-mono"
          :style="{ color: summonHpTheme?.hpTextColor ?? '#d9ffe7' }"
        >{{ unit.currentHp }}/{{ stats.maxHp }}</span>
      </div>

      <div v-if="unit.kind === 'hero'" class="grid grid-cols-2 gap-2 text-[10px]">
        <div class="flex items-center justify-between rounded bg-[#0c1529] px-1.5 py-0.5 text-[#9bc6ff]">
          <span>MP</span>
          <span class="font-mono font-semibold">{{ unit.mana ?? 0 }}/{{ stats.maxMana }}</span>
        </div>
        <div class="flex items-center justify-between rounded bg-[#24131c] px-1.5 py-0.5 text-[#ffcf8a]">
          <span>P点</span>
          <span class="font-mono font-semibold">{{ (unit.powerPoints ?? 0).toFixed(1) }}/{{ (unit.maxPowerPoints ?? 4).toFixed(1) }}</span>
        </div>
      </div>
    </div>

    <!-- 3×2 极简核心属性网格 -->
    <div class="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-[#070a14]/75 px-2 py-1.5 text-[10px]">
      <div v-for="row in statRows" :key="row.label" class="flex flex-col">
        <span class="text-[9px] text-[#7f8cad]">{{ row.label }}</span>
        <span class="font-mono font-semibold text-[#ece6d8]">{{ row.value }}</span>
      </div>
    </div>
  </aside>
</template>

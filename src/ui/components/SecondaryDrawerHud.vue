<script setup lang="ts">
/**
 * 侧翼漆金卷匣（紧贴右侧 96px 挂轴柱滑出）
 * 承载 3 类辅助抽屉：腰带秘药匣 / 暗夜战录卷 / 战局规仪录
 */
import { computed } from 'vue';
import { AI_DIFFICULTY_META, type AiDifficulty } from '@ai/tacticalAi';
import {
  PLAYABLE_FACTION_META,
  TOUHOU_CATALOG,
  type PlayableFactionId,
} from '@data/battlePresets';
import { useBattleStore } from '@ui/battleStore';
import OrnamentalFrame from '@ui/components/OrnamentalFrame.vue';
import PixelBadgeIcon from '@ui/components/PixelBadgeIcon.vue';
import { useViewportInput } from '@ui/composables/useViewportInput';

const store = useBattleStore();
const { isCompactLandscape, isTinyHeight } = useViewportInput();

const hero = computed(() => {
  const u = store.activeUnit;
  return u && u.kind === 'hero' ? u : null;
});

const heroPotions = computed(() => {
  const h = hero.value;
  if (!h) return [];
  return h.potions
    .map((slot) => {
      const def = TOUHOU_CATALOG.potions[slot.potionId];
      if (!def) return null;
      const icon =
        def.effectType === 'heal'
          ? 'potion_heal'
          : def.effectType === 'mana_charge'
            ? 'potion_mana'
            : 'potion_elixir';
      return { slot, def, icon };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
});

const recentLogs = computed(() => {
  void store.stateVersion;
  return store.battleState.actionLog.slice(-26).reverse();
});

const drawerMeta = computed(() => {
  if (store.activeDrawer === 'potions') return { stamp: '薬', title: '腰带秘药匣' };
  if (store.activeDrawer === 'logs') return { stamp: '録', title: '暗夜战录卷' };
  if (store.activeDrawer === 'settings') return { stamp: '規', title: '战局规仪置' };
  return { stamp: '', title: '' };
});

const canShowDrawer = computed(() => {
  if (store.activeDrawer === 'none' || store.activeDrawer === 'spells') return false;
  if (store.activeDrawer === 'potions') return Boolean(hero.value);
  return true;
});
</script>

<template>
  <!-- 紧凑横屏下轻触战场空白处可一键收起抽屉 -->
  <div
    v-if="canShowDrawer && isCompactLandscape"
    class="absolute inset-0 z-20 bg-black/32"
    @click="store.closeDrawer()"
  />

  <transition name="drawer-slide">
    <section
      v-if="canShowDrawer"
      class="urushi-frame absolute z-30 flex flex-col overflow-hidden text-xs"
      :class="
        isCompactLandscape
          ? 'bottom-2 right-2 top-2 max-h-[calc(100%-16px)] w-[min(340px,calc(100%-16px))] p-2.5'
          : 'right-3 top-14 max-h-[calc(100%-74px)] w-[328px] p-4'
      "
    >
      <OrnamentalFrame variant="corners" compact />

      <!-- 卷匣顶匾 -->
      <div
        class="relative z-10 flex items-center justify-between gap-2"
        :class="isTinyHeight ? 'pb-1.5' : 'pb-2.5'"
      >
        <div class="flex items-center gap-2">
          <span class="th-hanko h-6 w-6 text-xs">{{ drawerMeta.stamp }}</span>
          <div>
            <div class="font-display text-sm font-bold text-[#f3ead8]">{{ drawerMeta.title }}</div>
            <div
              v-if="hero && store.activeDrawer === 'potions'"
              class="font-num mt-0.5 text-[10px] text-[#b5a894]"
            >
              {{ hero.name }} · {{ hero.mana ?? 0 }} MP · 充能 {{ hero.spellCardCharge ?? 0 }}%
            </div>
          </div>
        </div>
        <button
          class="brass-action-btn font-display min-h-[28px] px-2.5 py-0.5 text-[10.5px] text-[#d9c8a8]"
          @click="store.closeDrawer()"
        >
          收卷
        </button>
      </div>

      <OrnamentalFrame variant="divider" />

      <!-- 可滚动主体内容 -->
      <div
        class="touch-scroll relative z-10 min-h-0 flex-1 overflow-y-auto pr-0.5"
        :class="isTinyHeight ? 'mt-2' : 'mt-3'"
      >
        <!-- 页面 A：腰带秘药匣 -->
        <div v-if="store.activeDrawer === 'potions' && hero" class="space-y-2.5">
          <div
            class="washi-recess border-l-2 px-2.5 py-1.5 text-[10.5px]"
            :class="
              hero.hasUsedPotionThisRound
                ? 'border-l-[#d96a6a] text-[#f5c0c0]'
                : 'border-l-[#52b386] text-[#bcefd4]'
            "
          >
            {{
              hero.hasUsedPotionThisRound
                ? '本回合已饮用过秘药，待下回合开始恢复使用。'
                : '饮用腰带秘药不消耗本巡移动、攻伐或施法权，每名英雄每回合限用 1 次。'
            }}
          </div>

          <button
            v-for="{ slot, def, icon } in heroPotions"
            :key="slot.potionId"
            class="washi-recess group flex w-full items-start gap-2.5 p-2.5 text-left transition disabled:opacity-35"
            :class="slot.charges > 0 && !hero.hasUsedPotionThisRound ? 'hover:border-[#cfa75b]' : ''"
            :disabled="slot.charges <= 0 || Boolean(hero.hasUsedPotionThisRound) || store.isAnimating"
            @click="store.usePotion(slot.potionId)"
          >
            <div
              class="enamel-crest flex h-10 w-10 shrink-0 items-center justify-center border border-[#99763a]/70 bg-[#151118]"
            >
              <PixelBadgeIcon :name="icon" size-class="h-6 w-6" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <span class="font-display text-xs font-bold text-[#f3ead8] group-hover:text-[#f5df9e]">
                  {{ def.name }}
                </span>
                <span class="font-num text-[10.5px] font-bold text-[#8be8be]">
                  ×{{ slot.charges }}
                </span>
              </div>
              <p class="mt-1 text-[10.5px] leading-relaxed text-[#b5a894]">{{ def.description }}</p>
            </div>
          </button>
        </div>

        <!-- 页面 B：暗夜战录卷 -->
        <div v-else-if="store.activeDrawer === 'logs'" class="relative pl-3">
          <div class="absolute bottom-1 left-1 top-1 w-px bg-[#99763a]/40" />
          <ul class="space-y-1.5 text-[11px] leading-relaxed">
            <li
              v-for="(line, idx) in recentLogs"
              :key="idx"
              class="relative border-b border-[#99763a]/15 pb-1.5 pl-1"
              :class="idx === 0 ? 'text-[#f5df9e]' : 'text-[#beb09c]'"
            >
              <span
                class="absolute -left-[10.5px] top-1.5 h-1.5 w-1.5 rotate-45"
                :class="idx === 0 ? 'bg-[#e04b5a]' : 'bg-[#7d6237]'"
              />
              {{ line }}
            </li>
          </ul>
        </div>

        <!-- 页面 C：战局规仪置 -->
        <div v-else-if="store.activeDrawer === 'settings'" class="space-y-3.5">
          <div>
            <div class="font-display mb-1.5 text-[11px] text-[#cabba2]">我方阵营（左翼）</div>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="f in (['life', 'order', 'chaos', 'death', 'might'] as PlayableFactionId[])"
                :key="`left-${f}`"
                class="lacquer-plaque-btn font-display py-1.5 text-[10.5px]"
                :class="store.leftFaction === f ? 'lacquer-plaque-btn-active text-[#f5df9e]' : 'text-[#a89a86]'"
                @click="store.switchLeftFaction(f)"
              >
                {{ PLAYABLE_FACTION_META[f].short }}·{{ PLAYABLE_FACTION_META[f].heroName }}
              </button>
            </div>
          </div>

          <div>
            <div class="font-display mb-1.5 text-[11px] text-[#cabba2]">敌方阵营（右翼）</div>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="f in (['life', 'order', 'chaos', 'death', 'might'] as PlayableFactionId[])"
                :key="`right-${f}`"
                class="lacquer-plaque-btn font-display py-1.5 text-[10.5px]"
                :class="store.rightFaction === f ? 'lacquer-plaque-btn-active text-[#f5df9e]' : 'text-[#a89a86]'"
                @click="store.switchRightFaction(f)"
              >
                {{ PLAYABLE_FACTION_META[f].short }}·{{ PLAYABLE_FACTION_META[f].heroName }}
              </button>
            </div>
          </div>

          <div>
            <div class="font-display mb-1.5 text-[11px] text-[#cabba2]">7 vs 7 互斥兵营路线</div>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="v in (['A', 'B'] as const)"
                :key="v"
                class="lacquer-plaque-btn font-display py-2 text-[11px]"
                :class="store.lineupVariant === v ? 'lacquer-plaque-btn-active text-[#f5df9e]' : 'text-[#a89a86]'"
                @click="store.switchLineupVariant(v)"
              >
                {{
                  v === 'A'
                    ? `A 阵 · ${PLAYABLE_FACTION_META[store.leftFaction].variantAName}`
                    : `B 阵 · ${PLAYABLE_FACTION_META[store.leftFaction].variantBName}`
                }}
              </button>
            </div>
            <p class="mt-1.5 text-[10px] leading-relaxed text-[#9e8f7b]">
              {{
                store.lineupVariant === 'A'
                  ? `${PLAYABLE_FACTION_META[store.leftFaction].variantASummary}；对手：${PLAYABLE_FACTION_META[store.rightFaction].variantASummary}`
                  : `${PLAYABLE_FACTION_META[store.leftFaction].variantBSummary}；对手：${PLAYABLE_FACTION_META[store.rightFaction].variantBSummary}`
              }}
            </p>
          </div>

          <div>
            <div class="font-display mb-1.5 text-[11px] text-[#cabba2]">对阵方式</div>
            <div class="grid grid-cols-2 gap-2">
              <button
                class="lacquer-plaque-btn font-display py-2 text-[11px]"
                :class="store.mode === 'vs_ai' ? 'lacquer-plaque-btn-active text-[#f5df9e]' : 'text-[#a89a86]'"
                @click="store.restartBattle('vs_ai')"
              >
                人机对弈
              </button>
              <button
                class="lacquer-plaque-btn font-display py-2 text-[11px]"
                :class="store.mode === 'hotseat' ? 'lacquer-plaque-btn-active text-[#f5df9e]' : 'text-[#a89a86]'"
                @click="store.restartBattle('hotseat')"
              >
                双人热座
              </button>
            </div>
          </div>

          <div v-if="store.mode === 'vs_ai'">
            <div class="font-display mb-1.5 text-[11px] text-[#cabba2]">敌方 AI 战术强度</div>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="lvl in (['casual', 'standard', 'master'] as AiDifficulty[])"
                :key="lvl"
                class="lacquer-plaque-btn font-display py-1.5 text-[11px]"
                :class="store.aiDifficulty === lvl ? 'lacquer-plaque-btn-active text-[#f5df9e]' : 'text-[#a89a86]'"
                @click="store.setAiDifficulty(lvl)"
              >
                {{ AI_DIFFICULTY_META[lvl].name }}
              </button>
            </div>
            <p class="mt-1.5 text-[10px] leading-relaxed text-[#9e8f7b]">
              {{ AI_DIFFICULTY_META[store.aiDifficulty].description }}
            </p>
          </div>

          <div>
            <div class="font-display mb-1.5 text-[11px] text-[#cabba2]">地脉六角格显隐</div>
            <button
              class="brass-action-btn flex w-full items-center justify-between px-3 py-2 text-[11px]"
              @click="store.cycleGridMode()"
            >
              <span class="text-[#b5a894]">当前格线</span>
              <span class="font-display font-bold text-[#f5df9e]">
                {{ store.gridMode === 'subtle' ? '微隐融合' : store.gridMode === 'clear' ? '清晰刻线' : '完全隐匿' }}
              </span>
            </button>
          </div>

          <div>
            <div class="font-display mb-1.5 text-[11px] text-[#cabba2]">HoMM4 演算规则集</div>
            <div class="grid grid-cols-2 gap-2">
              <button
                class="lacquer-plaque-btn font-display py-2 text-[11px]"
                :class="
                  store.balancePreset === 'equilibris_tuned'
                    ? 'lacquer-plaque-btn-active text-[#f5df9e]'
                    : 'text-[#a89a86]'
                "
                @click="store.restartBattle(undefined, 'equilibris_tuned')"
              >
                Equilibris 调优
              </button>
              <button
                class="lacquer-plaque-btn font-display py-2 text-[11px]"
                :class="
                  store.balancePreset === 'classic_h4'
                    ? 'lacquer-plaque-btn-active text-[#f5df9e]'
                    : 'text-[#a89a86]'
                "
                @click="store.restartBattle(undefined, 'classic_h4')"
              >
                原版经典 H4
              </button>
            </div>
          </div>

          <OrnamentalFrame variant="divider" />

          <!-- 幽夜音律司：纯代码 Web Audio 四总线调音台 -->
          <div class="washi-recess space-y-2.5 p-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="th-hanko-outline px-1 py-0.5 text-[9px]">律</span>
                <span class="font-display text-[11px] font-bold text-[#f3ead8]">幽夜音律司</span>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  class="brass-action-btn font-display px-2 py-0.5 text-[10px] text-[#f5df9e]"
                  @click="store.previewAudioBell()"
                >
                  试听战鼓
                </button>
                <button
                  class="brass-action-btn font-display px-2 py-0.5 text-[10px]"
                  :class="store.audioSettings.muted ? 'text-[#f0909c]' : 'text-[#9ae8be]'"
                  @click="store.toggleAudioMute()"
                >
                  {{ store.audioSettings.muted ? '已静音' : '鸣音中' }}
                </button>
              </div>
            </div>

            <div class="space-y-2 text-[10.5px]">
              <label class="block">
                <div class="flex justify-between text-[#cabba2]">
                  <span>总音量</span>
                  <span class="font-num text-[#f5df9e]">{{ Math.round(store.audioSettings.masterVolume * 100) }}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  :value="store.audioSettings.masterVolume"
                  class="mt-1 h-1 w-full cursor-pointer accent-[#cfa75b]"
                  @input="store.updateAudioSettings({ masterVolume: Number(($event.target as HTMLInputElement).value), muted: false })"
                />
              </label>

              <!-- 战阵背景音乐播放器（顺序循环 + 手动切歌） -->
              <div class="border border-[#99763a]/40 bg-[#120d16] p-2">
                <div class="flex items-center justify-between gap-1 text-[#cabba2]">
                  <span class="font-display text-[10.5px] font-bold text-[#f3ead8]">
                    战阵背景音乐
                  </span>
                  <div class="flex items-center gap-1.5">
                    <span class="font-num text-[9.5px] text-[#b89d72]">
                      顺序循环 {{ store.bgmState.currentIndex + 1 }}/{{ store.bgmState.tracks.length }}
                    </span>
                    <button
                      class="border border-[#99763a]/50 bg-[#18121a] px-1.5 py-px text-[9.5px]"
                      :class="store.audioSettings.bgmEnabled ? 'text-[#9ae8be]' : 'text-[#8a7b69]'"
                      @click.prevent="store.updateAudioSettings({ bgmEnabled: !store.audioSettings.bgmEnabled })"
                    >
                      {{ store.audioSettings.bgmEnabled ? '开启' : '关闭' }}
                    </button>
                  </div>
                </div>

                <!-- 当前曲目信息与切歌控制条 -->
                <div class="mt-1.5 flex items-center justify-between gap-2 border border-[#99763a]/25 bg-[#191220] px-2 py-1.5">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <span
                        class="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        :class="
                          store.audioSettings.bgmEnabled && !store.audioSettings.muted
                            ? 'bg-[#f5df9e] shadow-[0_0_6px_#f5df9e]'
                            : 'bg-[#6e6050]'
                        "
                      />
                      <span class="font-display truncate text-[11px] font-bold text-[#f5df9e]">
                        {{ store.bgmState.currentTrack.title }}
                      </span>
                    </div>
                    <div class="font-num mt-0.5 truncate pl-3 text-[9.5px] text-[#a69680]">
                      {{ store.bgmState.currentTrack.artist }} · {{ store.bgmState.currentTrack.durationText }}
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-1">
                    <button
                      class="brass-action-btn font-num flex h-6 w-6 items-center justify-center text-[10px] text-[#e5d5b5] hover:text-[#f5df9e]"
                      title="上一曲"
                      @click.prevent="store.prevBgmTrack()"
                    >
                      ◂◂
                    </button>
                    <button
                      class="brass-action-btn font-num flex h-6 w-6 items-center justify-center text-[10px]"
                      :class="
                        store.audioSettings.bgmEnabled && !store.audioSettings.muted
                          ? 'text-[#9ae8be]'
                          : 'text-[#f5df9e]'
                      "
                      :title="
                        store.audioSettings.bgmEnabled && !store.audioSettings.muted
                          ? '暂停背景音乐'
                          : '播放背景音乐'
                      "
                      @click.prevent="store.toggleBgmPlayback()"
                    >
                      {{ store.audioSettings.bgmEnabled && !store.audioSettings.muted ? '❚❚' : '▸' }}
                    </button>
                    <button
                      class="brass-action-btn font-num flex h-6 w-6 items-center justify-center text-[10px] text-[#e5d5b5] hover:text-[#f5df9e]"
                      title="下一曲"
                      @click.prevent="store.nextBgmTrack()"
                    >
                      ▸▸
                    </button>
                  </div>
                </div>

                <!-- 可点选歌单（按顺序播放） -->
                <div class="mt-1.5 space-y-1">
                  <button
                    v-for="(track, idx) in store.bgmState.tracks"
                    :key="track.id"
                    class="flex w-full items-center justify-between gap-2 border px-2 py-1 text-left transition"
                    :class="
                      store.bgmState.currentIndex === idx
                        ? 'border-[#cfa75b]/80 bg-[#271d18] text-[#f5df9e]'
                        : 'border-[#99763a]/20 bg-[#15101a]/75 text-[#b5a894] hover:border-[#99763a]/55 hover:text-[#efe2c6]'
                    "
                    @click.prevent="store.selectBgmTrack(track.id)"
                  >
                    <div class="flex min-w-0 items-center gap-1.5">
                      <span
                        class="font-num w-4 shrink-0 text-[9.5px]"
                        :class="store.bgmState.currentIndex === idx ? 'font-bold text-[#f5df9e]' : 'text-[#847563]'"
                      >
                        {{ String(idx + 1).padStart(2, '0') }}
                      </span>
                      <span class="font-display truncate text-[10.5px]">
                        {{ track.title }}
                      </span>
                    </div>
                    <div class="flex shrink-0 items-center gap-1.5">
                      <span
                        v-if="store.bgmState.currentIndex === idx"
                        class="font-display text-[9px] text-[#9ae8be]"
                      >
                        {{ store.audioSettings.bgmEnabled && !store.audioSettings.muted ? '播' : '选' }}
                      </span>
                      <span class="font-num text-[9.5px] text-[#9a8b77]">{{ track.durationText }}</span>
                    </div>
                  </button>
                </div>

                <label class="mt-2 block">
                  <div class="flex items-center justify-between text-[#cabba2]">
                    <span>BGM 音量</span>
                    <span class="font-num text-[#f5df9e]">{{ Math.round(store.audioSettings.bgmVolume * 100) }}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    :disabled="!store.audioSettings.bgmEnabled"
                    :value="store.audioSettings.bgmVolume"
                    class="mt-1 h-1 w-full cursor-pointer accent-[#e88a64] disabled:opacity-35"
                    @input="store.updateAudioSettings({ bgmVolume: Number(($event.target as HTMLInputElement).value), bgmEnabled: true, muted: false })"
                  />
                </label>
              </div>

              <label class="block">
                <div class="flex justify-between text-[#cabba2]">
                  <span>战局与符卡音效</span>
                  <span class="font-num text-[#f5df9e]">{{ Math.round(store.audioSettings.sfxVolume * 100) }}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  :value="store.audioSettings.sfxVolume"
                  class="mt-1 h-1 w-full cursor-pointer accent-[#cfa75b]"
                  @input="store.updateAudioSettings({ sfxVolume: Number(($event.target as HTMLInputElement).value) })"
                />
              </label>

              <label class="block">
                <div class="flex justify-between text-[#cabba2]">
                  <span>漆木界面与折本</span>
                  <span class="font-num text-[#f5df9e]">{{ Math.round(store.audioSettings.uiVolume * 100) }}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  :value="store.audioSettings.uiVolume"
                  class="mt-1 h-1 w-full cursor-pointer accent-[#cfa75b]"
                  @input="store.updateAudioSettings({ uiVolume: Number(($event.target as HTMLInputElement).value) })"
                />
              </label>

              <label class="block">
                <div class="flex items-center justify-between text-[#cabba2]">
                  <span>暗夜战鼓氛围</span>
                  <button
                    class="border border-[#99763a]/50 bg-[#18121a] px-1.5 py-px text-[9.5px]"
                    :class="store.audioSettings.ambienceEnabled ? 'text-[#9ae8be]' : 'text-[#8a7b69]'"
                    @click.prevent="store.updateAudioSettings({ ambienceEnabled: !store.audioSettings.ambienceEnabled })"
                  >
                    {{ store.audioSettings.ambienceEnabled ? '开启' : '关闭' }}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  :disabled="!store.audioSettings.ambienceEnabled"
                  :value="store.audioSettings.ambienceVolume"
                  class="mt-1 h-1 w-full cursor-pointer accent-[#6ca6e8] disabled:opacity-35"
                  @input="store.updateAudioSettings({ ambienceVolume: Number(($event.target as HTMLInputElement).value) })"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  </transition>
</template>

<style scoped>
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: opacity 0.16s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  opacity: 0;
  transform: translateX(14px);
}
</style>

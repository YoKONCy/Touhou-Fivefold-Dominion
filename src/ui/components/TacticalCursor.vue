<script setup lang="ts">
/**
 * 原版 HoMM4 风格纯代码像素动画战术光标组件
 * - 移动：跃动像素骏马（飞行/漂浮单位带灵翼）
 * - 近战攻击：随鼠标落脚方位实时旋转剑锋指向敌人的像素斩剑（附突刺脉动动画）
 * - 远程攻击：拉弓蓄力像素弓箭（半遮挡/超距时显示琥珀折箭提醒）
 * - 施法/符卡：悬浮翻页发光魔导法术书
 * - 阻挡：暗红禁止印记
 */
import { computed } from 'vue';
import { useBattleStore } from '@ui/battleStore';
import { useViewportInput } from '@ui/composables/useViewportInput';

const store = useBattleStore();
const { isTouchMode } = useViewportInput();

const visible = computed(() => {
  if (isTouchMode.value) return false;
  return Boolean(store.pointerPos && store.tacticalCursor.kind !== 'default');
});

const cursorStyle = computed(() => {
  const pos = store.pointerPos;
  if (!pos) return {};
  return {
    transform: `translate3d(${Math.round(pos.x - 16)}px, ${Math.round(pos.y - 16)}px, 0)`,
  };
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="pointer-events-none fixed left-0 top-0 z-[60] h-8 w-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] will-change-transform"
      :style="cursorStyle"
    >
    <!-- 1A. 陆地移动：跃动像素骏马（原版 🐴 经典致敬） -->
    <svg
      v-if="store.tacticalCursor.kind === 'move'"
      viewBox="0 0 16 16"
      shape-rendering="crispEdges"
      class="h-8 w-8 animate-gallop"
    >
      <!-- 骏马轮廓与星金色鬃毛 -->
      <rect x="9" y="2" width="3" height="2" fill="#ffe799" />
      <rect x="11" y="3" width="3" height="3" fill="#e8b85a" />
      <rect x="13" y="5" width="2" height="2" fill="#d4963b" />
      <rect x="10" y="4" width="1" height="1" fill="#141829" />
      <rect x="4" y="5" width="7" height="4" fill="#f3d285" />
      <rect x="2" y="6" width="2" height="3" fill="#c98532" />
      <!-- 奔跑四蹄 -->
      <rect x="4" y="9" width="2" height="4" fill="#d4963b" />
      <rect x="2" y="11" width="2" height="2" fill="#fff0b8" />
      <rect x="9" y="9" width="2" height="4" fill="#d4963b" />
      <rect x="11" y="11" width="2" height="2" fill="#fff0b8" />
    </svg>

    <!-- 1B. H4 飞行单位专属：振翅灵翼光标（无视城墙以外地形与减速！） -->
    <svg
      v-else-if="store.tacticalCursor.kind === 'fly_move'"
      viewBox="0 0 16 16"
      shape-rendering="crispEdges"
      class="h-8 w-8 animate-wing-flap"
    >
      <!-- 左翼 -->
      <rect x="1" y="3" width="5" height="2" fill="#b8fbff" />
      <rect x="2" y="5" width="5" height="2" fill="#6be2ff" />
      <rect x="3" y="7" width="4" height="2" fill="#3bb6f0" />
      <rect x="4" y="9" width="3" height="2" fill="#7ff0ff" />
      <!-- 右翼 -->
      <rect x="10" y="3" width="5" height="2" fill="#b8fbff" />
      <rect x="9" y="5" width="5" height="2" fill="#6be2ff" />
      <rect x="9" y="7" width="4" height="2" fill="#3bb6f0" />
      <rect x="9" y="9" width="3" height="2" fill="#7ff0ff" />
      <!-- 金羽核心 -->
      <rect x="7" y="4" width="2" height="7" fill="#ffe680" />
      <rect x="7" y="5" width="2" height="3" fill="#ffffff" />
      <rect x="6" y="11" width="4" height="2" fill="#d4a446" />
    </svg>

    <!-- 2. 定向近战攻击：剑尖随落脚方位实时指向目标的动态劈斩圣剑（原版 ⚔️ 方位攻击） -->
    <div
      v-else-if="store.tacticalCursor.kind === 'melee'"
      class="h-8 w-8"
      :style="{ transform: `rotate(${store.tacticalCursor.angleDeg}deg)` }"
    >
      <svg
        viewBox="0 0 16 16"
        shape-rendering="crispEdges"
        class="h-8 w-8 animate-thrust"
      >
        <!-- 剑柄与金护手（位于玩家选中的落脚一侧） -->
        <rect x="1" y="7" width="3" height="2" fill="#8f2d3e" />
        <rect x="4" y="5" width="2" height="6" fill="#ffd859" />
        <!-- 发光剑刃（剑尖直指右侧 0° = 指向敌方单位！） -->
        <rect x="6" y="7" width="7" height="2" fill="#fff5d6" />
        <rect x="6" y="6" width="6" height="1" fill="#ff7386" />
        <rect x="13" y="7" width="2" height="2" fill="#ffffff" />
        <rect x="14" y="7" width="1" height="1" fill="#ffe45e" />
      </svg>
    </div>

    <!-- 3. 远程射击：拉弓蓄力像素弓箭（HoMM4 默认全伤 / 1/2 琥珀折箭 / 1/4 赤橙碎箭 / 1/8 绛红极衰箭） -->
    <div
      v-else-if="store.tacticalCursor.kind === 'ranged' || store.tacticalCursor.kind === 'ranged_penalty'"
      class="relative h-8 w-8"
    >
      <svg
        viewBox="0 0 16 16"
        shape-rendering="crispEdges"
        class="h-8 w-8 animate-aim"
      >
        <!-- 弓臂与弓弦 -->
        <rect
          x="5"
          y="2"
          width="3"
          height="2"
          :fill="
            store.tacticalCursor.kind === 'ranged'
              ? '#e8c068'
              : store.tacticalCursor.rangedPenaltyTier === 'eighth'
                ? '#b83564'
                : store.tacticalCursor.rangedPenaltyTier === 'quarter'
                  ? '#c74c3b'
                  : '#d98a36'
          "
        />
        <rect
          x="3"
          y="4"
          width="2"
          height="8"
          :fill="
            store.tacticalCursor.kind === 'ranged'
              ? '#e8c068'
              : store.tacticalCursor.rangedPenaltyTier === 'eighth'
                ? '#b83564'
                : store.tacticalCursor.rangedPenaltyTier === 'quarter'
                  ? '#c74c3b'
                  : '#d98a36'
          "
        />
        <rect
          x="5"
          y="12"
          width="3"
          height="2"
          :fill="
            store.tacticalCursor.kind === 'ranged'
              ? '#e8c068'
              : store.tacticalCursor.rangedPenaltyTier === 'eighth'
                ? '#b83564'
                : store.tacticalCursor.rangedPenaltyTier === 'quarter'
                  ? '#c74c3b'
                  : '#d98a36'
          "
        />
        <rect x="7" y="4" width="1" height="8" fill="#cbd8f0" />
        <!-- 蓄力光箭（1/2 折箭，1/4 & 1/8 碎箭） -->
        <rect
          x="4"
          y="7"
          width="4"
          height="2"
          :fill="
            store.tacticalCursor.kind === 'ranged'
              ? '#7fffe0'
              : store.tacticalCursor.rangedPenaltyTier === 'eighth'
                ? '#ff6b9d'
                : store.tacticalCursor.rangedPenaltyTier === 'quarter'
                  ? '#ff7a66'
                  : '#ffb84d'
          "
        />
        <rect
          v-if="store.tacticalCursor.kind === 'ranged'"
          x="8"
          y="7"
          width="5"
          height="2"
          fill="#d9fff5"
        />
        <rect
          v-else-if="store.tacticalCursor.rangedPenaltyTier === 'eighth' || store.tacticalCursor.rangedPenaltyTier === 'quarter'"
          x="10"
          y="9"
          width="3"
          height="2"
          :fill="store.tacticalCursor.rangedPenaltyTier === 'eighth' ? '#ff4d88' : '#ff5c47'"
        />
        <rect
          v-else
          x="9"
          y="8"
          width="4"
          height="2"
          fill="#ff8547"
        />
        <rect
          x="13"
          y="6"
          width="2"
          height="4"
          :fill="store.tacticalCursor.kind === 'ranged' ? '#ffffff' : '#ffcf54'"
        />
      </svg>

      <!-- HoMM4 远程衰减角标（默认全伤不显示，1/2 / 1/4 / 1/8 紧贴光标右下角） -->
      <span
        v-if="
          store.tacticalCursor.rangedPenaltyTier === 'half' ||
          store.tacticalCursor.rangedPenaltyTier === 'quarter' ||
          store.tacticalCursor.rangedPenaltyTier === 'eighth'
        "
        class="font-num absolute -bottom-1 -right-2 border px-1 py-px text-[9px] font-black leading-none shadow"
        :class="
          store.tacticalCursor.rangedPenaltyTier === 'eighth'
            ? 'border-[#ff6b9d] bg-[#3b0e22] text-[#ffc4da]'
            : store.tacticalCursor.rangedPenaltyTier === 'quarter'
              ? 'border-[#ff7b6b] bg-[#3d1112] text-[#ffc4ba]'
              : 'border-[#f5cf72] bg-[#36230c] text-[#ffe8a6]'
        "
      >
        {{
          store.tacticalCursor.rangedPenaltyTier === 'eighth'
            ? '1/8'
            : store.tacticalCursor.rangedPenaltyTier === 'quarter'
              ? '1/4'
              : '1/2'
        }}
      </span>
    </div>

    <!-- 4. 施法 / 符卡瞄准：悬浮翻页发光魔导法术书（原版 📖） -->
    <svg
      v-else-if="store.tacticalCursor.kind === 'spell'"
      viewBox="0 0 16 16"
      shape-rendering="crispEdges"
      class="h-8 w-8 animate-float-book"
    >
      <!-- 紫金封皮 -->
      <rect x="1" y="5" width="6" height="8" fill="#6b38b5" />
      <rect x="9" y="5" width="6" height="8" fill="#8249d6" />
      <rect x="7" y="6" width="2" height="7" fill="#ffd95a" />
      <!-- 发光翻开书页 -->
      <rect x="2" y="6" width="5" height="6" fill="#fff3c4" />
      <rect x="9" y="6" width="5" height="6" fill="#ffe599" />
      <!-- 悬浮魔法星芒 -->
      <rect x="7" y="1" width="2" height="3" fill="#7ae8ff" />
      <rect x="6" y="2" width="4" height="1" fill="#ffffff" />
      <rect x="3" y="2" width="1" height="1" fill="#ffe680" />
      <rect x="12" y="3" width="1" height="1" fill="#ff8ea3" />
    </svg>

    <!-- 5. 查看友军：星芒晶镜 -->
    <svg
      v-else-if="store.tacticalCursor.kind === 'inspect'"
      viewBox="0 0 16 16"
      shape-rendering="crispEdges"
      class="h-7 w-7"
    >
      <rect x="4" y="3" width="6" height="1" fill="#9ec5ff" />
      <rect x="3" y="4" width="1" height="6" fill="#9ec5ff" />
      <rect x="10" y="4" width="1" height="6" fill="#9ec5ff" />
      <rect x="4" y="10" width="6" height="1" fill="#9ec5ff" />
      <rect x="5" y="5" width="4" height="4" fill="#4f8cff" fill-opacity="0.35" />
      <rect x="10" y="10" width="2" height="2" fill="#e8c068" />
      <rect x="12" y="12" width="2" height="2" fill="#e8c068" />
    </svg>

    <!-- 6. 不可达 / 视线阻挡：暗红禁止印记 -->
    <svg
      v-else-if="store.tacticalCursor.kind === 'blocked'"
      viewBox="0 0 16 16"
      shape-rendering="crispEdges"
      class="h-7 w-7 opacity-85"
    >
      <rect x="4" y="2" width="8" height="2" fill="#ff526c" />
      <rect x="4" y="12" width="8" height="2" fill="#ff526c" />
      <rect x="2" y="4" width="2" height="8" fill="#ff526c" />
      <rect x="12" y="4" width="2" height="8" fill="#ff526c" />
      <rect x="5" y="5" width="2" height="2" fill="#ff8598" />
      <rect x="7" y="7" width="2" height="2" fill="#ff8598" />
      <rect x="9" y="9" width="2" height="2" fill="#ff8598" />
    </svg>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes gallop {
  0%, 100% { transform: translateY(0px) rotate(-3deg); }
  50% { transform: translateY(-2.5px) rotate(4deg); }
}
@keyframes wingFlap {
  0%, 100% { transform: translateY(0px) scaleY(1); }
  50% { transform: translateY(-3px) scaleY(0.84); }
}
@keyframes thrust {
  0%, 100% { transform: translateX(-2px); }
  50% { transform: translateX(3px); }
}
@keyframes aim {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
@keyframes floatBook {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}

.animate-gallop {
  animation: gallop 0.42s ease-in-out infinite;
}
.animate-wing-flap {
  animation: wingFlap 0.36s ease-in-out infinite;
}
.animate-thrust {
  animation: thrust 0.48s ease-in-out infinite;
}
.animate-aim {
  animation: aim 0.6s ease-in-out infinite;
}
.animate-float-book {
  animation: floatBook 0.9s ease-in-out infinite;
}
</style>

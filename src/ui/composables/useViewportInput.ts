/**
 * 移动端横屏视口与触控/键鼠混合输入感知底座
 *
 * 职责：
 * - 自动检测当前设备是否为触控主导（coarse pointer / hover: none），并在运行时根据真实 pointerType 无缝热切换
 * - 实时追踪视口宽高、紧凑横屏态（如 667×375 / 844×390 / 915×412）与竖屏提醒态
 * - 统一管理移动端紧凑侧边栏折叠状态与动态宽度，避免各 HUD 浮层写死 256px 造成遮挡或裁切
 * - 严格兼容 SSR / Vitest Node 无浏览器测试环境
 */

import { computed, ref } from 'vue';

export type PointerInputMode = 'mouse' | 'touch';

const hasWindow = typeof window !== 'undefined';

function detectInitialInputMode(): PointerInputMode {
  if (!hasWindow) return 'mouse';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const noHover = window.matchMedia?.('(hover: none)').matches ?? false;
  return coarse || noHover ? 'touch' : 'mouse';
}

const viewportWidth = ref(hasWindow ? window.innerWidth : 1280);
const viewportHeight = ref(hasWindow ? window.innerHeight : 720);
const inputMode = ref<PointerInputMode>(detectInitialInputMode());
const sidebarCollapsed = ref(false);
const portraitPromptDismissed = ref(false);

let listenersInstalled = false;

function syncViewportSize(): void {
  if (!hasWindow) return;
  // 优先采用浏览器权威布局视口（避免部分移动模拟器/WebView 中 visualViewport 在 resize 瞬间滞后）
  const nextW = Math.round(window.innerWidth || document.documentElement.clientWidth || 1280);
  const nextH = Math.round(window.innerHeight || document.documentElement.clientHeight || 720);
  viewportWidth.value = Math.max(1, nextW);
  viewportHeight.value = Math.max(1, nextH);

  // 切回桌面宽屏时自动展开右侧栏，确保桌面端体验零回归
  if (nextW > 1024 && nextH > 540) {
    sidebarCollapsed.value = false;
  }
  // 旋转回横屏时重置竖屏提醒关闭标记，方便再次竖握时按需提示
  if (nextW >= nextH) {
    portraitPromptDismissed.value = false;
  }
}

function handleGlobalPointerDown(e: PointerEvent): void {
  if (e.pointerType === 'touch') {
    inputMode.value = 'touch';
  } else if (e.pointerType === 'mouse') {
    inputMode.value = 'mouse';
  }
}

function handleGlobalTouchStart(): void {
  inputMode.value = 'touch';
}

function ensureGlobalListeners(): void {
  if (!hasWindow || listenersInstalled) return;
  listenersInstalled = true;
  syncViewportSize();
  window.addEventListener('resize', syncViewportSize, { passive: true });
  window.addEventListener('orientationchange', syncViewportSize, { passive: true });
  window.visualViewport?.addEventListener('resize', syncViewportSize, { passive: true });
  const orientMql = window.matchMedia?.('(orientation: portrait)');
  orientMql?.addEventListener?.('change', syncViewportSize);
  if (typeof ResizeObserver !== 'undefined' && document.documentElement) {
    const rootRo = new ResizeObserver(() => syncViewportSize());
    rootRo.observe(document.documentElement);
  }
  window.addEventListener('pointerdown', handleGlobalPointerDown, { capture: true, passive: true });
  window.addEventListener('touchstart', handleGlobalTouchStart, { capture: true, passive: true });
}

/** 是否为触控交互模式（启用二段确认、长按详情、点按查悬浮笺并隐藏桌面鼠标指针） */
const isTouchMode = computed(() => inputMode.value === 'touch');

/** 是否处于移动端/小屏紧凑横屏视口（短高 ≤540px 或宽度 ≤1024px 且横向） */
const isCompactLandscape = computed(
  () => viewportWidth.value >= viewportHeight.value && (viewportHeight.value <= 540 || viewportWidth.value <= 1024),
);

/** 是否处于超紧凑竖向高度（主流手机横屏 360px ~ 430px） */
const isTinyHeight = computed(() => viewportHeight.value <= 440);

/** 是否为手机竖屏态（触发典雅东方横屏建议遮罩，可一键暂时关闭） */
const isPortraitMobile = computed(
  () => viewportHeight.value > viewportWidth.value && viewportWidth.value <= 768,
);

/** 右侧栏是否允许折叠（仅在紧凑横屏或小屏设备提供折叠把手，桌面宽屏始终常驻 256px） */
const canCollapseSidebar = computed(() => isCompactLandscape.value || viewportWidth.value <= 960);

/** 右侧指令栏当前实际占用像素宽度（供浮标避让与弹窗居中偏移使用） */
const sidebarWidthPx = computed(() => {
  if (canCollapseSidebar.value && sidebarCollapsed.value) return 0;
  if (!isCompactLandscape.value && viewportWidth.value > 1024) return 256;
  if (viewportWidth.value < 740) return 184;
  return 204;
});

export function toggleSidebarCollapsed(): void {
  if (!canCollapseSidebar.value) {
    sidebarCollapsed.value = false;
    return;
  }
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

export function setSidebarCollapsed(collapsed: boolean): void {
  sidebarCollapsed.value = canCollapseSidebar.value ? collapsed : false;
}

export function dismissPortraitPrompt(): void {
  portraitPromptDismissed.value = true;
}

/** 供测试或调试工具显式切换键鼠/触控模式 */
export function setInputMode(mode: PointerInputMode): void {
  inputMode.value = mode;
}

export function useViewportInput() {
  ensureGlobalListeners();
  return {
    viewportWidth,
    viewportHeight,
    inputMode,
    isTouchMode,
    isCompactLandscape,
    isTinyHeight,
    isPortraitMobile,
    canCollapseSidebar,
    sidebarCollapsed,
    sidebarWidthPx,
    portraitPromptDismissed,
    toggleSidebarCollapsed,
    setSidebarCollapsed,
    dismissPortraitPrompt,
    setInputMode,
  };
}

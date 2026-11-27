/**
 * Vue 3 + Pinia 战斗状态桥
 * 完整支持：
 * - 4 种多格碰撞体积（1×1 / 1×2 / 2×1 / 2×2）精准点选与多向近战落脚选位
 * - 原版 HoMM4 极简和风卷轴右侧栏 + 4 类按需展开二级 HUD（术式符卡 / 药水 / 战报 / 设置）
 * - 原版 HoMM4 右键任意单位弹出单位详情卡（UnitDetailModal）
 * - 光标跟随预估伤害范围与兵力折损浮标 + 6 态像素动画战术指针
 * - 悬停选位、施法诊断、指针计算与舞台高亮构建已拆分至 src/ui/store/*
 */

import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import { chooseTacticalAiCommand } from '@ai/tacticalAi';
import { soundEngine, type AudioSettings } from '@audio/index';
import {
  canModifyHeroClassOrBuild,
  checkRangedCapability,
  dispatchCombatCommand,
  findCorpseTargetAtHex,
  findUnitAtHex,
  getEffectiveSpellManaCost,
  getTerrainTacticalInfo,
  getUnitOccupiedHexes,
  getUnitReachableMap,
  isEngagedInMelee,
  previewAttack,
  selectHeroAdvancedClass,
  setHeroPrimarySkillRank,
  setHeroSecondarySkillRank,
  syncHeroDerivedState,
} from '@core/combatEngine';
import { getFootprintHexes, hexEquals, hexKey, type HexCoord, type HexTile } from '@core/hex';
import {
  computeUnitStats,
  resolveActiveArtifactSets,
  resolveAdvancedClass,
  resolveEligibleAdvancedClasses,
} from '@core/modifiers';
import type {
  BattleState,
  BattleUnit,
  CombatCommand,
  PrimarySkillId,
  SecondarySkillId,
  SkillRank,
  SpellDef,
} from '@core/types';
import {
  createReimuVsMarisaBattle,
  TOUHOU_CATALOG,
  type LineupVariant,
  type PlayableFactionId,
} from '@data/battlePresets';
import type { BattleStage, GridVisibilityMode, StageOverlayHints } from '@renderer/battleStage';
import { useViewportInput } from '@ui/composables/useViewportInput';
import { buildBattleOverlayHints } from './store/overlayHints';
import {
  computeHoverSpellContext,
  computeTacticalCursor,
  pickDirectionalMeleeApproach,
} from './store/targeting';
import type {
  HoverAttackContext,
  HoverSpellContext,
  SecondaryDrawerType,
  SpellCardBannerState,
  TacticalCursorKind,
  TacticalCursorState,
  TouchActionSummary,
  UnitDetailModalState,
} from './store/types';

export type {
  HoverAttackContext,
  HoverSpellContext,
  SecondaryDrawerType,
  SpellCardBannerState,
  TacticalCursorKind,
  TacticalCursorState,
  TouchActionSummary,
  UnitDetailModalState,
};

export const useBattleStore = defineStore('battle', () => {
  const mode = ref<'vs_ai' | 'hotseat'>('vs_ai');
  const balancePreset = ref<'classic_h4' | 'equilibris_tuned'>('equilibris_tuned');
  const lineupVariant = ref<LineupVariant>('A');
  const leftFaction = ref<PlayableFactionId>('death');
  const rightFaction = ref<PlayableFactionId>('life');
  const gridMode = ref<GridVisibilityMode>('hidden');
  const audioSettings = ref<AudioSettings>(soundEngine.getSettings());

  const battleState = shallowRef<BattleState>(
    createReimuVsMarisaBattle({
      mode: mode.value,
      balancePreset: balancePreset.value,
      lineupVariant: lineupVariant.value,
      leftFaction: leftFaction.value,
      rightFaction: rightFaction.value,
    }).state,
  );
  const stateVersion = ref(1);

  const { isTouchMode } = useViewportInput();
  const isAnimating = ref(false);
  const hoveredHex = ref<HexCoord | null>(null);
  const pointerPos = ref<{ x: number; y: number } | null>(null);
  const hoverVirtualPos = ref<{ x: number; y: number } | null>(null);
  /** 触控模式下已轻触锁定的预览六边形（二段确认：首触预览，再触或点确认执行） */
  const touchPreviewHex = ref<HexCoord | null>(null);
  /** 触控/手动指定的近战落脚格（支持点选高亮金格或点击「换位」按钮切换方向） */
  const manualApproachHex = ref<HexCoord | null>(null);
  const inspectedUnitId = ref<string | null>(null);
  const selectedSpellId = ref<string | null>(null);
  /** 二步法术（如瞬息传送 unit_to_hex、殉道替伤/血祭复生 ally_to_ally）已选定的第一位单位 ID */
  const pendingSpellFirstUnitId = ref<string | null>(null);
  const declaringSpellCard = ref(false);
  /** 远程单位（且未被近战禁手）主动切换的强制近战模式 */
  const forceMeleeMode = ref(false);
  const activeDrawer = ref<SecondaryDrawerType>('none');
  /** 原版 HoMM4 右键任意单位弹出的详情浮窗 */
  const detailModal = ref<UnitDetailModalState | null>(null);
  /** 战前整备暂停 AI 开关（打开英雄整备期间允许自由切换已解锁进阶职业与调点，关窗后恢复开战） */
  const isPreBattlePrep = ref(false);
  const toastMessage = ref<string | null>(null);

  const spellCardBanner = ref<SpellCardBannerState>({
    visible: false,
    name: '',
    subtitle: '',
    themeColor: '#e64c65',
    accentColor: '#ffe08a',
  });

  let stageRef: BattleStage | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  let bannerTimer: ReturnType<typeof setTimeout> | null = null;

  const activeUnit = computed<BattleUnit | null>(() => {
    void stateVersion.value;
    const id = battleState.value.activeUnitId;
    return id ? battleState.value.units[id] ?? null : null;
  });

  const isHumanTurn = computed(() => {
    void stateVersion.value;
    const u = activeUnit.value;
    if (!u || battleState.value.phase !== 'active') return false;
    return battleState.value.controllers[u.side] === 'human';
  });

  /** 当前行动单位是否具备「远程 / 近战」切换前提（有远程且没有被近战禁手） */
  const canToggleAttackMode = computed(() => {
    void stateVersion.value;
    const u = activeUnit.value;
    return Boolean(
      u &&
        u.status === 'alive' &&
        isHumanTurn.value &&
        battleState.value.phase === 'active' &&
        u.abilities.ranged &&
        !u.abilities.noMelee,
    );
  });

  /** 若满足切换前提但当前因禁射/无弹/贴身而无法远程射击，返回具体原因 */
  const rangedBlockedReason = computed<string | null>(() => {
    void stateVersion.value;
    if (!canToggleAttackMode.value || !activeUnit.value) return null;
    const u = activeUnit.value;
    if (u.abilities.noRanged) return '远程禁手中，仅可近战';
    if (!u.abilities.unlimitedShots && u.ammo <= 0) return '弹药已耗尽，仅可近战';
    if (isEngagedInMelee(battleState.value, u)) return '敌军贴身接战，仅可近战';
    return null;
  });

  /** 当前行动单位的有效攻击模式（供右侧切换匾与预览逻辑共用） */
  const effectiveAttackMode = computed<'ranged' | 'melee'>(() => {
    if (!canToggleAttackMode.value) {
      return activeUnit.value?.abilities.ranged && !activeUnit.value.abilities.noRanged ? 'ranged' : 'melee';
    }
    return forceMeleeMode.value || Boolean(rangedBlockedReason.value) ? 'melee' : 'ranged';
  });

  /** 按回合缓存当前行动单位的可达六边形图与可攻击敌军列表 */
  const activeReachableMap = computed(() => {
    void stateVersion.value;
    const st = battleState.value;
    const act = activeUnit.value;
    if (!act || !isHumanTurn.value || isAnimating.value || st.phase !== 'active') {
      return null;
    }
    return getUnitReachableMap(st, act, TOUHOU_CATALOG);
  });

  const activeReachableHexKeys = computed<ReadonlySet<string>>(() => {
    const map = activeReachableMap.value;
    return map ? new Set(map.costs.keys()) : new Set<string>();
  });

  const activeAttackableUnitIds = computed<ReadonlySet<string>>(() => {
    void stateVersion.value;
    const st = battleState.value;
    const act = activeUnit.value;
    const set = new Set<string>();
    if (!act || !isHumanTurn.value || isAnimating.value || st.phase !== 'active') {
      return set;
    }
    const useForceMelee = canToggleAttackMode.value && forceMeleeMode.value;
    for (const enemy of Object.values(st.units)) {
      if (enemy.status !== 'alive' || enemy.side === act.side) continue;
      if (previewAttack(st, act.id, enemy.id, TOUHOU_CATALOG, undefined, useForceMelee).valid) {
        set.add(enemy.id);
      }
    }
    return set;
  });

  const inspectedUnit = computed<BattleUnit | null>(() => {
    void stateVersion.value;
    const id = inspectedUnitId.value ?? battleState.value.activeUnitId;
    return id ? battleState.value.units[id] ?? null : null;
  });

  const inspectedStats = computed(() => {
    void stateVersion.value;
    const u = inspectedUnit.value;
    if (!u) return null;
    return computeUnitStats(u, battleState.value, TOUHOU_CATALOG);
  });

  const inspectedAdvancedClass = computed(() => {
    void stateVersion.value;
    const u = inspectedUnit.value;
    if (!u || u.kind !== 'hero') return null;
    return resolveAdvancedClass(
      u.skills,
      TOUHOU_CATALOG.advancedClasses,
      u.subSkills,
      u.selectedAdvancedClassId,
    );
  });

  const inspectedArtifactSets = computed(() => {
    void stateVersion.value;
    const u = inspectedUnit.value;
    if (!u || u.kind !== 'hero') return [];
    return resolveActiveArtifactSets(
      u.equippedArtifactIds,
      TOUHOU_CATALOG.artifacts,
      TOUHOU_CATALOG.artifactSets,
    );
  });

  /** 右键详情卡对应的完整单位与属性快照 */
  const detailModalUnit = computed<BattleUnit | null>(() => {
    void stateVersion.value;
    if (!detailModal.value) return null;
    return battleState.value.units[detailModal.value.unitId] ?? null;
  });

  const detailModalStats = computed(() => {
    void stateVersion.value;
    const u = detailModalUnit.value;
    if (!u) return null;
    return computeUnitStats(u, battleState.value, TOUHOU_CATALOG);
  });

  const detailModalAdvancedClass = computed(() => {
    void stateVersion.value;
    const u = detailModalUnit.value;
    if (!u || u.kind !== 'hero') return null;
    return resolveAdvancedClass(
      u.skills,
      TOUHOU_CATALOG.advancedClasses,
      u.subSkills,
      u.selectedAdvancedClassId,
    );
  });

  /** 详情英雄当前已满足解锁条件的全部可切换进阶职业 */
  const detailModalEligibleClasses = computed(() => {
    void stateVersion.value;
    const u = detailModalUnit.value;
    if (!u || u.kind !== 'hero') return [];
    return resolveEligibleAdvancedClasses(u.skills, u.subSkills, TOUHOU_CATALOG.advancedClasses);
  });

  /** 当前是否处于战斗场景外（战前整备或战后），允许自由切换进阶职业与调整 36 技能树 */
  const canModifyHeroBuild = computed(() => {
    void stateVersion.value;
    return isPreBattlePrep.value || canModifyHeroClassOrBuild(battleState.value);
  });

  const detailModalArtifactSets = computed(() => {
    void stateVersion.value;
    const u = detailModalUnit.value;
    if (!u || u.kind !== 'hero') return [];
    return resolveActiveArtifactSets(
      u.equippedArtifactIds,
      TOUHOU_CATALOG.artifacts,
      TOUHOU_CATALOG.artifactSets,
    );
  });

  const turnStripUnits = computed<Array<{ unit: BattleUnit; isCurrent: boolean; isWaiting: boolean }>>(() => {
    void stateVersion.value;
    const st = battleState.value;
    const result: Array<{ unit: BattleUnit; isCurrent: boolean; isWaiting: boolean }> = [];
    const seen = new Set<string>();

    const push = (id: string | null, isCurrent: boolean, isWaiting: boolean) => {
      if (!id || seen.has(id)) return;
      const u = st.units[id];
      if (!u || u.status !== 'alive') return;
      seen.add(id);
      result.push({ unit: u, isCurrent, isWaiting });
    };

    push(st.activeUnitId, true, false);
    for (const id of st.turnQueue) push(id, false, false);
    for (const id of st.waitQueue) push(id, false, true);
    return result;
  });

  /** 悬停敌方单位时的交锋预估上下文 */
  const hoverAttackContext = computed<HoverAttackContext | null>(() => {
    void stateVersion.value;
    if (
      isAnimating.value ||
      battleState.value.phase !== 'active' ||
      detailModal.value ||
      activeDrawer.value === 'spells'
    ) {
      return null;
    }
    if (selectedSpellId.value || declaringSpellCard.value) return null;

    const hex = hoveredHex.value;
    if (!hex) return null;

    const st = battleState.value;
    const targetUnit = findUnitAtHex(st, hex, false);
    if (!targetUnit) return null;

    let attacker: BattleUnit | null = null;
    if (
      isHumanTurn.value &&
      activeUnit.value &&
      activeUnit.value.status === 'alive' &&
      activeUnit.value.side !== targetUnit.side
    ) {
      attacker = activeUnit.value;
    } else {
      const insp = inspectedUnit.value;
      if (insp && insp.status === 'alive' && insp.side !== targetUnit.side) {
        attacker = insp;
      } else if (
        activeUnit.value &&
        activeUnit.value.status === 'alive' &&
        activeUnit.value.side !== targetUnit.side
      ) {
        attacker = activeUnit.value;
      }
    }
    if (!attacker) return null;

    const isCurrentTurnAttacker = attacker.id === st.activeUnitId && isHumanTurn.value;
    const useForceMelee = isCurrentTurnAttacker && canToggleAttackMode.value && forceMeleeMode.value;
    const rangedCap = checkRangedCapability(st, attacker, targetUnit, TOUHOU_CATALOG);
    let chosenApproachHex: HexCoord | null = null;
    let candidateApproachHexes: HexCoord[] = [];

    if (useForceMelee || !rangedCap.canRanged) {
      const pick = pickDirectionalMeleeApproach(st, attacker, targetUnit, hoverVirtualPos.value);
      candidateApproachHexes = pick.candidates;
      if (
        manualApproachHex.value &&
        candidateApproachHexes.some((c) => hexEquals(c, manualApproachHex.value!))
      ) {
        chosenApproachHex = manualApproachHex.value;
      } else {
        chosenApproachHex = pick.chosen;
      }
    }

    const preview = previewAttack(
      st,
      attacker.id,
      targetUnit.id,
      TOUHOU_CATALOG,
      chosenApproachHex ?? undefined,
      useForceMelee,
    );

    return {
      attacker,
      defender: targetUnit,
      preview,
      isCurrentTurnAttacker,
      chosenApproachHex: preview.valid && !preview.isRanged ? chosenApproachHex : null,
      candidateApproachHexes: preview.valid && !preview.isRanged ? candidateApproachHexes : [],
    };
  });

  const selectedSpell = computed<SpellDef | null>(() => {
    if (!selectedSpellId.value) return null;
    return TOUHOU_CATALOG.spells[selectedSpellId.value] ?? null;
  });

  /** 当前鼠标悬停的战场单位（含倒地英雄，供舞台临时置顶与右侧信息区实时联动） */
  const hoveredUnit = computed<BattleUnit | null>(() => {
    void stateVersion.value;
    const hex = hoveredHex.value;
    if (!hex || detailModal.value) return null;
    return findUnitAtHex(battleState.value, hex, true);
  });

  /** 当前鼠标悬停的六边形地格及其战术情报 */
  const hoveredTile = computed<HexTile | null>(() => {
    void stateVersion.value;
    const hex = hoveredHex.value;
    if (!hex || detailModal.value) return null;
    return battleState.value.tiles[hexKey(hex)] ?? null;
  });

  const hoveredTileInfo = computed(() => {
    const tile = hoveredTile.value;
    return tile ? getTerrainTacticalInfo(tile) : null;
  });

  /** 施法瞄准状态下的实时悬停诊断（委托纯函数子系统） */
  const hoverSpellContext = computed<HoverSpellContext | null>(() => {
    void stateVersion.value;
    if (
      isAnimating.value ||
      battleState.value.phase !== 'active' ||
      detailModal.value ||
      activeDrawer.value === 'spells' ||
      !isHumanTurn.value
    ) {
      return null;
    }
    const spell = selectedSpell.value;
    const act = activeUnit.value;
    const hex = hoveredHex.value;
    if (!spell || !act || !hex) return null;

    return computeHoverSpellContext({
      state: battleState.value,
      activeUnit: act,
      spell,
      hoveredHex: hex,
      pendingSpellFirstUnitId: pendingSpellFirstUnitId.value,
    });
  });

  /** 6 态像素战术指针状态（委托纯函数子系统；触控模式下自动隐藏桌面像素光标） */
  const tacticalCursor = computed<TacticalCursorState>(() => {
    void stateVersion.value;
    if (isTouchMode.value) {
      return { kind: 'default', angleDeg: 0 };
    }
    return computeTacticalCursor({
      state: battleState.value,
      activeUnit: activeUnit.value,
      isHumanTurn: isHumanTurn.value,
      hoveredHex: hoveredHex.value,
      pointerPos: pointerPos.value,
      isAnimating: isAnimating.value,
      detailModalOpen: Boolean(detailModal.value),
      spellsDrawerOpen: activeDrawer.value === 'spells',
      declaringSpellCard: declaringSpellCard.value,
      selectedSpellId: selectedSpellId.value,
      hoverSpellContext: hoverSpellContext.value,
      hoverAttackContext: hoverAttackContext.value,
      activeReachableHexKeys: activeReachableHexKeys.value,
    });
  });

  /** 触控底部战术确认栏实时摘要（无 Hover/右键环境下的二段确认与详情/换位入口） */
  const touchActionSummary = computed<TouchActionSummary | null>(() => {
    void stateVersion.value;
    if (
      !isTouchMode.value ||
      battleState.value.phase !== 'active' ||
      isAnimating.value ||
      detailModal.value ||
      activeDrawer.value === 'spells'
    ) {
      return null;
    }

    const previewHex = touchPreviewHex.value;
    const isTargeting = Boolean(selectedSpellId.value || declaringSpellCard.value);
    if (!previewHex && !isTargeting) return null;

    const st = battleState.value;
    const act = activeUnit.value;

    // 1. 符卡直线宣言态
    if (declaringSpellCard.value && act && isHumanTurn.value) {
      const card = act.signatureSpellCardId ? TOUHOU_CATALOG.spellCards[act.signatureSpellCardId] : null;
      const cardName = card?.name ?? '专属符卡';
      const onSelf = Boolean(previewHex && getUnitOccupiedHexes(act).some((h) => hexEquals(h, previewHex)));
      if (previewHex && !onSelf) {
        return {
          mode: 'spell_card',
          title: `符卡 · ${cardName}`,
          detail: '已锁定展开方位 · 再次轻触或点确认立即宣言',
          badgeText: '符卡',
          badgeTone: 'gold',
          canConfirm: true,
          confirmLabel: '宣言符卡',
          inspectUnitId: null,
          approachCount: 0,
          approachIndex: 0,
          isTargeting: true,
        };
      }
      return {
        mode: 'targeting_idle',
        title: `符卡 · ${cardName}`,
        detail: '轻触棋盘择定符卡展开方位（长按任意处亦可取消）',
        badgeText: '符卡选向',
        badgeTone: 'gold',
        canConfirm: false,
        confirmLabel: '宣言符卡',
        inspectUnitId: null,
        approachCount: 0,
        approachIndex: 0,
        isTargeting: true,
      };
    }

    // 2. 魔导术式选点态
    if (selectedSpellId.value && act && isHumanTurn.value) {
      const sp = selectedSpell.value;
      const spCtx = hoverSpellContext.value;
      if (sp && previewHex && spCtx) {
        const isFirstStep =
          (sp.targetType === 'unit_to_hex' || sp.targetType === 'ally_to_ally') &&
          !pendingSpellFirstUnitId.value;
        const targetName = spCtx.targetUnit ? `目标：${spCtx.targetUnit.name} · ` : '';
        return {
          mode: 'spell',
          title: `术式 · ${sp.name}`,
          detail: spCtx.canCast
            ? `${targetName}-${spCtx.manaCost} MP · ${isFirstStep ? '锁定首位目标' : '再触或点确认施放'}`
            : spCtx.reason ?? spCtx.shortLabel,
          badgeText: spCtx.canCast ? `${spCtx.manaCost} MP` : '无法施放',
          badgeTone: spCtx.canCast ? 'mana' : 'danger',
          canConfirm: spCtx.canCast,
          confirmLabel: isFirstStep ? '锁定第1步' : '确认施放',
          inspectUnitId: spCtx.targetUnit?.id ?? null,
          approachCount: 0,
          approachIndex: 0,
          isTargeting: true,
        };
      }
      return {
        mode: 'targeting_idle',
        title: `术式 · ${sp?.name ?? '施法'}`,
        detail: pendingSpellFirstUnitId.value
          ? '【第2步】请轻触棋盘择定第二目标'
          : '轻触棋盘目标以预览范围与视线，再点确认施放',
        badgeText: '术式选点',
        badgeTone: 'mana',
        canConfirm: false,
        confirmLabel: '确认施放',
        inspectUnitId: null,
        approachCount: 0,
        approachIndex: 0,
        isTargeting: true,
      };
    }

    if (!previewHex) return null;

    // 3. 敌军交锋预览态
    const atk = hoverAttackContext.value;
    if (atk && atk.isCurrentTurnAttacker) {
      const p = atk.preview;
      if (p.valid) {
        const penaltyLabel = !p.isRanged
          ? p.isLongWeaponPoke
            ? '长手免反'
            : '近战'
          : p.rangedPenaltyTier === 'full'
            ? '全伤'
            : p.rangedPenaltyTier === 'half'
              ? '1/2伤'
              : p.rangedPenaltyTier === 'quarter'
                ? '1/4伤'
                : '1/8伤';
        const killStr =
          atk.defender.kind === 'creature' ? ` · 折损 ${p.expectedMinKills}–${p.expectedMaxKills}` : '';
        const retStr = p.willRetaliate
          ? ` · 反击 ${p.retaliationMinDamage}–${p.retaliationMaxDamage}`
          : ' · 无反击';
        const approachCount = p.isRanged ? 0 : atk.candidateApproachHexes.length;
        const approachIndex =
          approachCount > 0 && atk.chosenApproachHex
            ? Math.max(
                0,
                atk.candidateApproachHexes.findIndex((c) => hexEquals(c, atk.chosenApproachHex!)),
              )
            : 0;
        return {
          mode: 'attack',
          title: `${p.isRanged ? '射击' : p.isLongWeaponPoke ? '长手突刺' : '近战'} · ${atk.defender.name}`,
          detail: `预计 ${p.expectedMinDamage}–${p.expectedMaxDamage} 伤${killStr}${retStr}`,
          badgeText: penaltyLabel,
          badgeTone:
            !p.isRanged
              ? p.isLongWeaponPoke
                ? 'jade'
                : 'gold'
              : p.rangedPenaltyTier === 'full'
                ? 'jade'
                : 'warn',
          canConfirm: true,
          confirmLabel: p.isRanged ? '确认射击' : '确认攻击',
          inspectUnitId: atk.defender.id,
          approachCount,
          approachIndex,
          isTargeting: false,
        };
      }
      return {
        mode: 'blocked',
        title: atk.defender.name,
        detail: p.reason ?? '目标暂不可攻击',
        badgeText: '无法命中',
        badgeTone: 'danger',
        canConfirm: false,
        confirmLabel: '无法攻击',
        inspectUnitId: atk.defender.id,
        approachCount: 0,
        approachIndex: 0,
        isTargeting: false,
      };
    }

    // 4. 友军 / 倒地单位 / 敌回合检视态
    const unitAtHex = findUnitAtHex(st, previewHex, true);
    if (unitAtHex) {
      const isSelf = unitAtHex.id === act?.id;
      return {
        mode: 'inspect',
        title: `${unitAtHex.name}${unitAtHex.kind === 'creature' ? ` ×${unitAtHex.count}` : ` Lv.${unitAtHex.level}`}`,
        detail: isSelf ? '当前行动单位 · 点「详情」或长按查完整档案' : '轻触「详情」或长按棋子查完整档案',
        badgeText: isSelf ? '当前行动' : unitAtHex.side === (act?.side ?? 'left') ? '友军' : '敌军',
        badgeTone: isSelf ? 'gold' : unitAtHex.side === (act?.side ?? 'left') ? 'jade' : 'danger',
        canConfirm: false,
        confirmLabel: '详情',
        inspectUnitId: unitAtHex.id,
        approachCount: 0,
        approachIndex: 0,
        isTargeting: false,
      };
    }

    // 5. 空地移动预览态
    if (act && isHumanTurn.value && activeReachableHexKeys.value.has(hexKey(previewHex)) && !hexEquals(previewHex, act.pos)) {
      const tileInfo = hoveredTileInfo.value;
      return {
        mode: 'move',
        title: act.abilities.flying ? '飞行至目标格' : '移动至目标格',
        detail: tileInfo
          ? `${tileInfo.name}（${tileInfo.elevationLabel}）· 再触或点确认执行`
          : '再次轻触同一格或点确认执行移动',
        badgeText: act.abilities.flying ? '飞行' : '移动',
        badgeTone: 'jade',
        canConfirm: true,
        confirmLabel: act.abilities.flying ? '确认飞行' : '确认移动',
        inspectUnitId: null,
        approachCount: 0,
        approachIndex: 0,
        isTargeting: false,
      };
    }

    // 6. 不可通行空地/障碍地形检视态
    const tileInfo = hoveredTileInfo.value;
    return {
      mode: 'blocked',
      title: tileInfo ? `地形 · ${tileInfo.name}` : '不可通行',
      detail: tileInfo ? `${tileInfo.moveDesc} · ${tileInfo.losDesc}` : '超出本巡移动力或受障碍阻挡',
      badgeText: tileInfo?.elevationLabel ?? '地形',
      badgeTone: 'warn',
      canConfirm: false,
      confirmLabel: '确认',
      inspectUnitId: null,
      approachCount: 0,
      approachIndex: 0,
      isTargeting: false,
    };
  });

  function showToast(msg: string): void {
    toastMessage.value = msg;
    if (toastTimer) globalThis.clearTimeout(toastTimer);
    toastTimer = globalThis.setTimeout(() => {
      toastMessage.value = null;
    }, 2400);
  }

  function showSpellCardBanner(info: {
    name: string;
    subtitle: string;
    themeColor: string;
    accentColor: string;
    casterBlueprintId?: string;
  }): void {
    spellCardBanner.value = { visible: true, ...info };
    if (bannerTimer) globalThis.clearTimeout(bannerTimer);
    bannerTimer = globalThis.setTimeout(() => {
      spellCardBanner.value.visible = false;
    }, 2100);
  }

  function updateAudioSettings(patch: Partial<AudioSettings>): void {
    audioSettings.value = soundEngine.updateSettings(patch);
  }

  function toggleAudioMute(): void {
    soundEngine.toggleMute();
    audioSettings.value = soundEngine.getSettings();
    if (!audioSettings.value.muted) {
      soundEngine.play('ui_click');
    }
  }

  function previewAudioBell(): void {
    soundEngine.unlock();
    soundEngine.play('spellcard_declare');
  }

  function toggleDrawer(drawer: SecondaryDrawerType): void {
    detailModal.value = null;
    touchPreviewHex.value = null;
    manualApproachHex.value = null;
    const next = activeDrawer.value === drawer ? 'none' : drawer;
    activeDrawer.value = next;
    if (next === 'none') {
      soundEngine.play('ui_panel_close');
    } else if (next === 'spells') {
      soundEngine.play('ui_book_open');
    } else {
      soundEngine.play('ui_panel_open');
    }
  }

  function closeDrawer(): void {
    if (activeDrawer.value !== 'none') {
      soundEngine.play('ui_panel_close');
    }
    activeDrawer.value = 'none';
  }

  function openUnitDetail(unitId: string, clientPos: { x: number; y: number }): void {
    touchPreviewHex.value = null;
    manualApproachHex.value = null;
    detailModal.value = { unitId, x: clientPos.x, y: clientPos.y };
    soundEngine.play('ui_panel_open');
  }

  function closeUnitDetail(): void {
    if (detailModal.value) {
      soundEngine.play('ui_panel_close');
    }
    detailModal.value = null;
    if (isPreBattlePrep.value) {
      isPreBattlePrep.value = false;
      refreshStageOverlay();
      void driveAiLoop();
    }
  }

  /** 战前整备 / 战斗场景外：调整英雄主技能阶位（0~5） */
  function adjustHeroPrimarySkill(heroId: string, skillId: PrimarySkillId, rank: SkillRank): void {
    const res = setHeroPrimarySkillRank(battleState.value, heroId, skillId, rank, TOUHOU_CATALOG);
    if (!res.ok) {
      soundEngine.play('ui_blocked');
      showToast(res.error ?? '当前无法调整主技能');
      return;
    }
    soundEngine.play('ui_click');
    stateVersion.value += 1;
    stageRef?.syncState(battleState.value);
    refreshStageOverlay();
  }

  /** 战前整备 / 战斗场景外：调整英雄二级子技能阶位（0~5） */
  function adjustHeroSecondarySkill(heroId: string, subSkillId: SecondarySkillId, rank: SkillRank): void {
    const res = setHeroSecondarySkillRank(battleState.value, heroId, subSkillId, rank, TOUHOU_CATALOG);
    if (!res.ok) {
      soundEngine.play('ui_blocked');
      showToast(res.error ?? '未满足子技能前置条件');
      return;
    }
    soundEngine.play('ui_click');
    stateVersion.value += 1;
    stageRef?.syncState(battleState.value);
    refreshStageOverlay();
  }

  /** 战斗场景外自由切换英雄已满足条件的进阶组合职业 */
  function switchHeroAdvancedClass(heroId: string, classId: string | null): void {
    const res = selectHeroAdvancedClass(battleState.value, heroId, classId, TOUHOU_CATALOG);
    if (!res.ok) {
      soundEngine.play('ui_blocked');
      showToast(res.error ?? '当前无法切换进阶职业');
      return;
    }
    soundEngine.play('ui_book_open');
    stateVersion.value += 1;
    stageRef?.syncState(battleState.value);
    refreshStageOverlay();
    const u = battleState.value.units[heroId];
    const cls = u
      ? resolveAdvancedClass(u.skills, TOUHOU_CATALOG.advancedClasses, u.subSkills, u.selectedAdvancedClassId)
      : null;
    if (cls && u) {
      showToast(`${u.name} 已转职为【${cls.name}】！`);
    }
  }

  /** 战斗中一键退回「战前整备」并完整保留当前双英雄的技能配点与职业选择，方便立即切职调点再开战！ */
  function returnToPreBattlePrep(keepHeroId?: string): void {
    const oldState = battleState.value;
    const savedBuilds = new Map<
      string,
      {
        skills: Partial<Record<PrimarySkillId, SkillRank>>;
        subSkills: Partial<Record<SecondarySkillId, SkillRank>>;
        selectedAdvancedClassId?: string | null;
        knownSpellIds: string[];
      }
    >();
    for (const u of Object.values(oldState.units)) {
      if (u.kind === 'hero') {
        savedBuilds.set(u.defId, {
          skills: { ...u.skills },
          subSkills: { ...(u.subSkills ?? {}) },
          selectedAdvancedClassId: u.selectedAdvancedClassId ?? null,
          knownSpellIds: [...u.knownSpellIds],
        });
      }
    }

    const fresh = createReimuVsMarisaBattle({
      mode: mode.value,
      balancePreset: balancePreset.value,
      lineupVariant: lineupVariant.value,
      leftFaction: leftFaction.value,
      rightFaction: rightFaction.value,
      seed: Date.now() & 0xffffff,
    });
    for (const u of Object.values(fresh.state.units)) {
      if (u.kind === 'hero') {
        const saved = savedBuilds.get(u.defId);
        if (saved) {
          u.skills = { ...saved.skills };
          u.subSkills = { ...saved.subSkills };
          u.selectedAdvancedClassId = saved.selectedAdvancedClassId;
          u.knownSpellIds = [...saved.knownSpellIds];
          syncHeroDerivedState(fresh.state, u, TOUHOU_CATALOG, true);
        }
      }
    }
    for (const u of Object.values(fresh.state.units)) {
      const s = computeUnitStats(u, fresh.state, TOUHOU_CATALOG);
      u.currentHp = s.maxHp;
      if (s.maxMana > 0) u.mana = s.maxMana;
    }

    isPreBattlePrep.value = true;
    forceMeleeMode.value = false;
    battleState.value = fresh.state;
    stateVersion.value += 1;
    inspectedUnitId.value = keepHeroId ?? fresh.state.activeUnitId;
    isAnimating.value = false;
    clearTargeting();
    stageRef?.syncState(fresh.state);
    refreshStageOverlay();
    if (keepHeroId && fresh.state.units[keepHeroId]) {
      detailModal.value = { unitId: keepHeroId, x: 400, y: 240 };
    }
    soundEngine.play('ui_round_bell');
    showToast('已进入战前整备：可自由切换进阶职业与调整 36 技能树，关闭档案即开战！');
  }

  function buildOverlayHints(): StageOverlayHints {
    return buildBattleOverlayHints({
      state: battleState.value,
      activeUnit: activeUnit.value,
      inspectedUnitId: inspectedUnitId.value,
      hoveredHex: hoveredHex.value,
      hoveredUnitId: hoveredUnit.value?.id ?? null,
      isHumanTurn: isHumanTurn.value,
      isAnimating: isAnimating.value,
      declaringSpellCard: declaringSpellCard.value,
      selectedSpellId: selectedSpellId.value,
      pendingSpellFirstUnitId: pendingSpellFirstUnitId.value,
      hoverSpellContext: hoverSpellContext.value,
      hoverAttackContext: hoverAttackContext.value,
      activeReachableMap: activeReachableMap.value,
      activeReachableHexKeys: activeReachableHexKeys.value,
      activeAttackableUnitIds: activeAttackableUnitIds.value,
    });
  }

  function refreshStageOverlay(): void {
    stageRef?.updateOverlay(buildOverlayHints());
  }

  function attachStage(stage: BattleStage | null): void {
    stageRef = stage;
    if (stageRef) {
      stageRef.setGridMode(gridMode.value);
      stageRef.syncState(battleState.value);
      refreshStageOverlay();
      void driveAiLoop();
    }
  }

  function cycleGridMode(): void {
    const order: GridVisibilityMode[] = ['subtle', 'clear', 'hidden'];
    const next = order[(order.indexOf(gridMode.value) + 1) % order.length];
    gridMode.value = next;
    stageRef?.setGridMode(next);
    soundEngine.play('ui_click');
  }

  function clearTargeting(): void {
    selectedSpellId.value = null;
    pendingSpellFirstUnitId.value = null;
    declaringSpellCard.value = false;
    touchPreviewHex.value = null;
    manualApproachHex.value = null;
    refreshStageOverlay();
  }

  /** 在远程与近战模式之间切换（仅当前单位具备远程且未被近战禁手时可用） */
  function toggleAttackMode(): void {
    if (!canToggleAttackMode.value || isAnimating.value) return;
    if (rangedBlockedReason.value) {
      soundEngine.play('ui_blocked');
      showToast(rangedBlockedReason.value);
      return;
    }
    forceMeleeMode.value = !forceMeleeMode.value;
    selectedSpellId.value = null;
    pendingSpellFirstUnitId.value = null;
    declaringSpellCard.value = false;
    manualApproachHex.value = null;
    soundEngine.play('ui_click');
    showToast(
      forceMeleeMode.value
        ? isTouchMode.value
          ? '已切换为【近战突击】模式'
          : '已切换为【近战突击】模式（按 M 可切回远程）'
        : isTouchMode.value
          ? '已切换为【远程射击】模式'
          : '已切换为【远程射击】模式（按 M 可切换近战）',
    );
    refreshStageOverlay();
  }

  async function executeCommand(cmd: CombatCommand): Promise<void> {
    if (isAnimating.value) return;

    const nextState = structuredClone(battleState.value);
    const res = dispatchCombatCommand(nextState, cmd, TOUHOU_CATALOG);
    if (!res.ok) {
      soundEngine.play('ui_blocked');
      showToast(res.error ?? '操作无效');
      return;
    }

    clearTargeting();
    hoveredHex.value = null;
    pointerPos.value = null;
    closeUnitDetail();
    if (cmd.type !== 'USE_POTION') {
      forceMeleeMode.value = false;
    }
    closeDrawer();
    isAnimating.value = true;
    refreshStageOverlay();

    try {
      if (stageRef) {
        await stageRef.playEvents(res.events, nextState);
      }
    } catch (err) {
      console.error('战斗动画演出异常，已安全同步至最新战局状态:', err);
      stageRef?.syncState(nextState);
    } finally {
      battleState.value = nextState;
      stateVersion.value += 1;
      inspectedUnitId.value = nextState.activeUnitId;
      isAnimating.value = false;
      refreshStageOverlay();
    }

    void driveAiLoop();
  }

  async function driveAiLoop(): Promise<void> {
    while (
      battleState.value.phase === 'active' &&
      !isAnimating.value &&
      !isPreBattlePrep.value &&
      activeUnit.value &&
      battleState.value.controllers[activeUnit.value.side] === 'ai'
    ) {
      await new Promise((r) => setTimeout(r, 340));
      if (isPreBattlePrep.value) break;
      const cmd = chooseTacticalAiCommand(battleState.value, TOUHOU_CATALOG);
      if (!cmd) break;
      await executeCommand(cmd);
    }
  }

  function handleHoverHex(
    hex: HexCoord | null,
    clientPos: { x: number; y: number } | null,
    virtualPos: { x: number; y: number } | null,
  ): void {
    const prevHex = hoveredHex.value;
    const hexChanged =
      (prevHex === null) !== (hex === null) ||
      (prevHex !== null && hex !== null && !hexEquals(prevHex, hex));

    if (hexChanged) {
      hoveredHex.value = hex;
      manualApproachHex.value = null;
      // 鼠标移入新的可达或可攻击六边形时，轻敲一声极柔和的漆木子微响（带 55ms 冷却）
      if (hex && isHumanTurn.value && !isAnimating.value && !detailModal.value) {
        const k = hexKey(hex);
        const hUnit = findUnitAtHex(battleState.value, hex, false);
        const isActionable =
          activeReachableHexKeys.value.has(k) ||
          Boolean(hUnit && activeAttackableUnitIds.value.has(hUnit.id));
        if (isActionable && virtualPos) {
          soundEngine.playAtStageX('ui_hover_hex', virtualPos.x, 880);
        }
      }
    }

    pointerPos.value = clientPos;

    // 仅在真正悬停敌方且需近战方位选位时同步 virtualPos，减少无关响应链抖动
    const hoveringEnemy = Boolean(hex && findUnitAtHex(battleState.value, hex, false));
    if (hoveringEnemy || hexChanged) {
      hoverVirtualPos.value = virtualPos;
    }

    if (hexChanged || hoveringEnemy) {
      refreshStageOverlay();
    }
  }

  /** 原版 HoMM4 右键交互：选点态优先取消，常规态右键任意单位仅展开详情卡，不干扰当前行动操控 */
  function handleRightClickHex(hex: HexCoord, clientPos: { x: number; y: number }): void {
    if (selectedSpellId.value || declaringSpellCard.value) {
      clearTargeting();
      return;
    }
    const target = findUnitAtHex(battleState.value, hex, true);
    if (target) {
      openUnitDetail(target.id, clientPos);
    } else {
      closeUnitDetail();
      if (activeDrawer.value !== 'none') closeDrawer();
    }
  }

  /** 触控长按交互（420ms 等效桌面右键）：取消施法瞄准或直接弹出完整单位档案 */
  function handleLongPressHex(hex: HexCoord | null, clientPos: { x: number; y: number }): void {
    touchPreviewHex.value = null;
    manualApproachHex.value = null;
    if (selectedSpellId.value || declaringSpellCard.value) {
      clearTargeting();
      hoveredHex.value = null;
      soundEngine.play('ui_panel_close');
      showToast('已取消术式选点');
      return;
    }
    if (hex) {
      handleRightClickHex(hex, clientPos);
    } else {
      closeUnitDetail();
      if (activeDrawer.value !== 'none') closeDrawer();
    }
  }

  /** 取消当前触控预览态（或在施法/符卡瞄准态下直接退出瞄准） */
  function cancelTouchPreview(): void {
    if (selectedSpellId.value || declaringSpellCard.value) {
      clearTargeting();
      hoveredHex.value = null;
      pointerPos.value = null;
      soundEngine.play('ui_panel_close');
      return;
    }
    touchPreviewHex.value = null;
    manualApproachHex.value = null;
    hoveredHex.value = null;
    pointerPos.value = null;
    soundEngine.play('ui_click');
    refreshStageOverlay();
  }

  /** 触控循环切换近战多向落脚位（等效桌面绕敌移动鼠标选攻击方向） */
  function cycleMeleeApproach(): void {
    const atk = hoverAttackContext.value;
    if (!atk || !atk.isCurrentTurnAttacker || !atk.preview.valid || atk.preview.isRanged) return;
    const cands = atk.candidateApproachHexes;
    if (cands.length <= 1) return;
    const curIdx = atk.chosenApproachHex
      ? cands.findIndex((c) => hexEquals(c, atk.chosenApproachHex!))
      : 0;
    const nextIdx = (curIdx + 1) % cands.length;
    manualApproachHex.value = cands[nextIdx];
    soundEngine.play('ui_click');
    refreshStageOverlay();
  }

  /** 触控确认执行当前已预览锁定的行动（移动 / 攻击 / 施法 / 符卡） */
  function confirmTouchAction(): void {
    const targetHex = touchPreviewHex.value;
    if (!targetHex) return;
    const prevPendingFirst = pendingSpellFirstUnitId.value;
    handleClickHex(targetHex);
    // 二步法术完成第 1 步选定后清空预览格，准备迎接第 2 步轻触
    if (!prevPendingFirst && pendingSpellFirstUnitId.value) {
      touchPreviewHex.value = null;
      hoveredHex.value = null;
      refreshStageOverlay();
    }
  }

  /** 触控拖动滑览抬手后锁定最后预览的目标格，避免误执行并保留底部确认条 */
  function handleTouchScrubEnd(
    hex: HexCoord | null,
    clientPos: { x: number; y: number },
    virtualPos: { x: number; y: number } | null,
  ): void {
    if (detailModal.value || isAnimating.value) return;
    if (!hex) return;
    touchPreviewHex.value = hex;
    hoveredHex.value = hex;
    pointerPos.value = clientPos;
    hoverVirtualPos.value = virtualPos;
    const u = findUnitAtHex(battleState.value, hex, true);
    if (u && (!isHumanTurn.value || u.side === activeUnit.value?.side)) {
      inspectedUnitId.value = u.id;
    }
    refreshStageOverlay();
  }

  /**
   * 触控轻触六边形（二段确认机制）：
   * - 首次轻触：锁定目标并展示路径/弹道/攻防预测与底部操作条
   * - 若已锁定近战敌军且点击其周围金色候选落脚格：直接切换攻击落脚方位
   * - 二次轻触同一目标（含多格生物同体不同格）：若操作合法则立即执行
   */
  function handleTouchTapHex(
    hex: HexCoord | null,
    clientPos: { x: number; y: number },
    virtualPos: { x: number; y: number } | null,
  ): void {
    if (detailModal.value) {
      closeUnitDetail();
      return;
    }
    if (isAnimating.value) return;
    if (activeDrawer.value !== 'none' && activeDrawer.value !== 'spells') {
      closeDrawer();
    }
    if (!hex) {
      if (!selectedSpellId.value && !declaringSpellCard.value) {
        cancelTouchPreview();
      }
      return;
    }

    const st = battleState.value;
    const act = activeUnit.value;

    // 1. 若当前已锁定近战敌军，且玩家轻触其周围高亮的金色候选落脚格，则切换至该落脚方位
    if (
      act &&
      isHumanTurn.value &&
      !selectedSpellId.value &&
      !declaringSpellCard.value &&
      touchPreviewHex.value &&
      hoverAttackContext.value &&
      hoverAttackContext.value.isCurrentTurnAttacker &&
      hoverAttackContext.value.preview.valid &&
      !hoverAttackContext.value.preview.isRanged &&
      hoverAttackContext.value.candidateApproachHexes.length > 1
    ) {
      const defHexes = getUnitOccupiedHexes(hoverAttackContext.value.defender);
      const tappedDefender = defHexes.some((h) => hexEquals(h, hex));
      if (!tappedDefender) {
        const cands = hoverAttackContext.value.candidateApproachHexes;
        const exactMatch = cands.find((c) => hexEquals(c, hex));
        const footprintMatch =
          exactMatch ?? cands.find((c) => getFootprintHexes(c, act.footprint).some((h) => hexEquals(h, hex)));
        if (footprintMatch) {
          manualApproachHex.value = footprintMatch;
          soundEngine.play('ui_click');
          refreshStageOverlay();
          return;
        }
      }
    }

    // 2. 判断是否二次轻触同一预览目标（对多格单位自动归一化至同一单位 ID）
    const prevHex = touchPreviewHex.value;
    let isSameTarget = false;
    if (prevHex) {
      if (hexEquals(prevHex, hex)) {
        isSameTarget = true;
      } else {
        const prevUnit = findUnitAtHex(st, prevHex, true);
        const curUnit = findUnitAtHex(st, hex, true);
        if (prevUnit && curUnit && prevUnit.id === curUnit.id) {
          isSameTarget = true;
        }
      }
    }

    if (isSameTarget) {
      const summary = touchActionSummary.value;
      if (summary?.canConfirm) {
        confirmTouchAction();
        return;
      }
      if (summary?.mode === 'blocked') {
        soundEngine.play('ui_blocked');
        if (summary.detail) showToast(summary.detail);
        return;
      }
      return;
    }

    // 3. 首次轻触新目标：进入预览态，渲染路径/弹道/攻防预测与底部触控确认栏
    manualApproachHex.value = null;
    touchPreviewHex.value = hex;
    hoveredHex.value = hex;
    pointerPos.value = clientPos;
    hoverVirtualPos.value = virtualPos;

    const tappedUnit = findUnitAtHex(st, hex, true);
    if (tappedUnit && (!isHumanTurn.value || tappedUnit.side === act?.side)) {
      inspectedUnitId.value = tappedUnit.id;
    }

    soundEngine.play('ui_click');
    refreshStageOverlay();
  }

  function handleClickHex(hex: HexCoord): void {
    if (detailModal.value) {
      closeUnitDetail();
      return;
    }
    if (isAnimating.value) return;
    const st = battleState.value;
    const act = activeUnit.value;

    const clickedAliveUnit = findUnitAtHex(st, hex, false);
    const clickedAnyUnit = clickedAliveUnit ?? findUnitAtHex(st, hex, true);

    if (!act || !isHumanTurn.value) {
      if (clickedAnyUnit) inspectedUnitId.value = clickedAnyUnit.id;
      return;
    }

    if (declaringSpellCard.value) {
      if (getUnitOccupiedHexes(act).some((h) => hexEquals(h, hex))) {
        clearTargeting();
        return;
      }
      void executeCommand({ type: 'DECLARE_SPELL_CARD', unitId: act.id, targetHex: hex });
      return;
    }

    if (selectedSpellId.value) {
      const spell = TOUHOU_CATALOG.spells[selectedSpellId.value];
      if (!spell) {
        clearTargeting();
        return;
      }
      if (spell.targetType === 'hex_aoe' || spell.targetType === 'hex_empty') {
        void executeCommand({
          type: 'CAST_SPELL',
          unitId: act.id,
          spellId: spell.id,
          targetHex: hex,
        });
      } else if (spell.targetType === 'corpse_unit') {
        const corpse = findCorpseTargetAtHex(st, hex, TOUHOU_CATALOG);
        if (corpse) {
          void executeCommand({
            type: 'CAST_SPELL',
            unitId: act.id,
            spellId: spell.id,
            targetUnitId: corpse.id,
          });
        } else {
          soundEngine.play('ui_blocked');
          showToast('请点击已阵亡或有减员的兵种残骸（右键取消）');
        }
      } else if (spell.targetType === 'unit_to_hex') {
        if (!pendingSpellFirstUnitId.value) {
          if (clickedAliveUnit && clickedAliveUnit.side === act.side && !clickedAliveUnit.abilities.magicImmune) {
            pendingSpellFirstUnitId.value = clickedAliveUnit.id;
            soundEngine.play('ui_click');
            showToast(`【第2步】已锁定 ${clickedAliveUnit.name}，请点击传送目标空地！`);
            refreshStageOverlay();
          } else {
            soundEngine.play('ui_blocked');
            showToast('【第1步】请先点击要传送的己方友军（右键取消）');
          }
        } else {
          void executeCommand({
            type: 'CAST_SPELL',
            unitId: act.id,
            spellId: spell.id,
            targetUnitId: pendingSpellFirstUnitId.value,
            secondTargetHex: hex,
          });
        }
      } else if (spell.targetType === 'ally_to_ally') {
        if (!pendingSpellFirstUnitId.value) {
          if (clickedAliveUnit && clickedAliveUnit.side === act.side && !clickedAliveUnit.abilities.magicImmune) {
            if (spell.specialEffect === 'sacrifice' && clickedAliveUnit.kind === 'hero') {
              soundEngine.play('ui_blocked');
              showToast('不可献祭英雄单位，请选择普通友军兵种');
              return;
            }
            pendingSpellFirstUnitId.value = clickedAliveUnit.id;
            soundEngine.play('ui_click');
            showToast(
              spell.specialEffect === 'sacrifice'
                ? `【第2步】已选定献祭 ${clickedAliveUnit.name}，请点击要复生的另一名友军！`
                : `【第2步】已选定 ${clickedAliveUnit.name} 为替身雏偶，请点击要庇护的友军！`,
            );
            refreshStageOverlay();
          } else {
            soundEngine.play('ui_blocked');
            showToast('【第1步】请先选择第一位己方友军（右键取消）');
          }
        } else if (clickedAliveUnit && clickedAliveUnit.side === act.side && clickedAliveUnit.id !== pendingSpellFirstUnitId.value) {
          void executeCommand({
            type: 'CAST_SPELL',
            unitId: act.id,
            spellId: spell.id,
            targetUnitId: pendingSpellFirstUnitId.value,
            secondTargetUnitId: clickedAliveUnit.id,
          });
        } else {
          soundEngine.play('ui_blocked');
          showToast('【第2步】请点击另一名不同的己方友军（右键取消）');
        }
      } else if (clickedAliveUnit) {
        void executeCommand({
          type: 'CAST_SPELL',
          unitId: act.id,
          spellId: spell.id,
          targetUnitId: clickedAliveUnit.id,
        });
      } else {
        clearTargeting();
      }
      return;
    }

    if (clickedAliveUnit) {
      if (clickedAliveUnit.side !== act.side) {
        const hoverCtx = hoverAttackContext.value;
        const useForceMelee = canToggleAttackMode.value && forceMeleeMode.value;
        const rangedCap = checkRangedCapability(st, act, clickedAliveUnit, TOUHOU_CATALOG);
        let chosenApproach: HexCoord | undefined;
        if (useForceMelee || !rangedCap.canRanged) {
          if (hoverCtx && hoverCtx.isCurrentTurnAttacker && hoverCtx.defender.id === clickedAliveUnit.id) {
            chosenApproach = hoverCtx.chosenApproachHex ?? undefined;
          } else {
            chosenApproach =
              pickDirectionalMeleeApproach(st, act, clickedAliveUnit, hoverVirtualPos.value).chosen ?? undefined;
          }
        }
        const check = previewAttack(
          st,
          act.id,
          clickedAliveUnit.id,
          TOUHOU_CATALOG,
          chosenApproach,
          useForceMelee,
        );
        if (check.valid) {
          void executeCommand({
            type: 'ATTACK',
            unitId: act.id,
            targetId: clickedAliveUnit.id,
            moveTo: check.isRanged ? undefined : chosenApproach,
            forceMelee: useForceMelee || undefined,
          });
        } else {
          soundEngine.play('ui_blocked');
          showToast(check.reason ?? '目标暂不可攻击（右键可查看单位详情）');
        }
        return;
      }
      soundEngine.play('ui_click');
      inspectedUnitId.value = clickedAliveUnit.id;
      return;
    }

    const reachable = activeReachableMap.value ?? getUnitReachableMap(st, act, TOUHOU_CATALOG);
    if (reachable.costs.has(hexKey(hex)) && !hexEquals(hex, act.pos)) {
      void executeCommand({ type: 'MOVE', unitId: act.id, to: hex });
    } else if (!hexEquals(hex, act.pos)) {
      soundEngine.play('ui_blocked');
    }
  }

  function selectSpell(spellId: string): void {
    const act = activeUnit.value;
    if (!act || !isHumanTurn.value || isAnimating.value) return;
    const spell = TOUHOU_CATALOG.spells[spellId];
    if (!spell) return;

    if (spell.isAdventureOnly || spell.targetType === 'adventure') {
      soundEngine.play('ui_blocked');
      showToast(`「${spell.name}」为战略大地图术式，战斗棋盘中不可施放`);
      return;
    }
    const cost = getEffectiveSpellManaCost(battleState.value, act, spell);
    if ((act.mana ?? 0) < cost) {
      soundEngine.play('ui_blocked');
      showToast(`灵力不足，施放「${spell.name}」需要 ${cost} MP`);
      return;
    }

    // 全场/群体/自身即刻术式：点击后直接施放，无需再选点！
    if (spell.targetType === 'self') {
      activeDrawer.value = 'none';
      void executeCommand({ type: 'CAST_SPELL', unitId: act.id, spellId: spell.id });
      return;
    }

    soundEngine.play('ui_click');
    declaringSpellCard.value = false;
    pendingSpellFirstUnitId.value = null;
    selectedSpellId.value = selectedSpellId.value === spellId ? null : spellId;
    if (selectedSpellId.value) {
      activeDrawer.value = 'none';
      if (spell.targetType === 'unit_to_hex') {
        showToast(`【第1步】请点击要施放「${spell.name}」传送的己方友军`);
      } else if (spell.targetType === 'ally_to_ally') {
        showToast(
          spell.specialEffect === 'sacrifice'
            ? '【第1步】请先选择要献祭的己方兵种'
            : '【第1步】请先选择代为承伤的替身友军',
        );
      } else if (spell.targetType === 'hex_empty') {
        showToast(`请在战场空地选择「${spell.name}」的召唤落点`);
      } else if (spell.targetType === 'corpse_unit') {
        showToast(`请点击战场上的阵亡或减员兵种残骸施放「${spell.name}」`);
      }
    }
    refreshStageOverlay();
  }

  function triggerSpellCard(): void {
    const act = activeUnit.value;
    if (!act || !isHumanTurn.value || isAnimating.value || !act.signatureSpellCardId) return;
    const card = TOUHOU_CATALOG.spellCards[act.signatureSpellCardId];
    if (!card) return;
    if ((act.mana ?? 0) < card.manaCost) {
      soundEngine.play('ui_blocked');
      showToast(`灵力不足，需要 ${card.manaCost} 点灵力`);
      return;
    }
    if ((act.spellCardCharge ?? 0) < card.chargeCost) {
      soundEngine.play('ui_blocked');
      showToast(`符卡充能不足 (${act.spellCardCharge ?? 0}% / 100%)`);
      return;
    }

    selectedSpellId.value = null;
    activeDrawer.value = 'none';
    if (card.targetType === 'field_self') {
      void executeCommand({ type: 'DECLARE_SPELL_CARD', unitId: act.id });
    } else {
      soundEngine.play('ui_click');
      declaringSpellCard.value = !declaringSpellCard.value;
      if (declaringSpellCard.value) {
        showToast(`请在战场点击发射方向，轰出【${card.name}】！`);
      }
      refreshStageOverlay();
    }
  }

  function usePotion(potionId: string): void {
    const act = activeUnit.value;
    if (!act || !isHumanTurn.value || isAnimating.value) return;
    void executeCommand({ type: 'USE_POTION', unitId: act.id, potionId });
  }

  function waitTurn(): void {
    const act = activeUnit.value;
    if (!act || !isHumanTurn.value || isAnimating.value) return;
    void executeCommand({ type: 'WAIT', unitId: act.id });
  }

  function defendTurn(): void {
    const act = activeUnit.value;
    if (!act || !isHumanTurn.value || isAnimating.value) return;
    void executeCommand({ type: 'DEFEND', unitId: act.id });
  }

  function restartBattle(
    newMode?: 'vs_ai' | 'hotseat',
    newBalance?: 'classic_h4' | 'equilibris_tuned',
    newLineup?: LineupVariant,
    newLeftFaction?: PlayableFactionId,
    newRightFaction?: PlayableFactionId,
  ): void {
    soundEngine.play('ui_round_bell');
    if (newMode) mode.value = newMode;
    if (newBalance) balancePreset.value = newBalance;
    if (newLineup) lineupVariant.value = newLineup;
    if (newLeftFaction) leftFaction.value = newLeftFaction;
    if (newRightFaction) rightFaction.value = newRightFaction;

    const fresh = createReimuVsMarisaBattle({
      mode: mode.value,
      balancePreset: balancePreset.value,
      lineupVariant: lineupVariant.value,
      leftFaction: leftFaction.value,
      rightFaction: rightFaction.value,
      seed: Date.now() & 0xffffff,
    });
    battleState.value = fresh.state;
    stateVersion.value += 1;
    inspectedUnitId.value = fresh.state.activeUnitId;
    isAnimating.value = false;
    forceMeleeMode.value = false;
    closeUnitDetail();
    closeDrawer();
    clearTargeting();
    stageRef?.syncState(fresh.state);
    refreshStageOverlay();
    void driveAiLoop();
  }

  function switchLineupVariant(variant: LineupVariant): void {
    if (lineupVariant.value === variant) return;
    restartBattle(undefined, undefined, variant);
  }

  function switchLeftFaction(faction: PlayableFactionId): void {
    if (leftFaction.value === faction) return;
    restartBattle(undefined, undefined, undefined, faction, undefined);
  }

  function switchRightFaction(faction: PlayableFactionId): void {
    if (rightFaction.value === faction) return;
    restartBattle(undefined, undefined, undefined, undefined, faction);
  }

  return {
    mode,
    balancePreset,
    lineupVariant,
    leftFaction,
    rightFaction,
    gridMode,
    audioSettings,
    battleState,
    stateVersion,
    isAnimating,
    hoveredHex,
    pointerPos,
    touchPreviewHex,
    touchActionSummary,
    inspectedUnitId,
    selectedSpellId,
    selectedSpell,
    declaringSpellCard,
    forceMeleeMode,
    canToggleAttackMode,
    rangedBlockedReason,
    effectiveAttackMode,
    activeDrawer,
    detailModal,
    toastMessage,
    spellCardBanner,
    activeUnit,
    isHumanTurn,
    hoveredUnit,
    hoveredTile,
    hoveredTileInfo,
    inspectedUnit,
    inspectedStats,
    inspectedAdvancedClass,
    inspectedArtifactSets,
    detailModalUnit,
    detailModalStats,
    detailModalAdvancedClass,
    detailModalEligibleClasses,
    detailModalArtifactSets,
    canModifyHeroBuild,
    isPreBattlePrep,
    turnStripUnits,
    hoverAttackContext,
    hoverSpellContext,
    tacticalCursor,
    attachStage,
    handleHoverHex,
    handleClickHex,
    handleRightClickHex,
    handleTouchTapHex,
    handleTouchScrubEnd,
    handleLongPressHex,
    confirmTouchAction,
    cycleMeleeApproach,
    cancelTouchPreview,
    openUnitDetail,
    closeUnitDetail,
    adjustHeroPrimarySkill,
    adjustHeroSecondarySkill,
    switchHeroAdvancedClass,
    returnToPreBattlePrep,
    updateAudioSettings,
    toggleAudioMute,
    previewAudioBell,
    toggleDrawer,
    closeDrawer,
    selectSpell,
    triggerSpellCard,
    usePotion,
    waitTurn,
    defendTurn,
    toggleAttackMode,
    clearTargeting,
    cycleGridMode,
    restartBattle,
    switchLineupVariant,
    switchLeftFaction,
    switchRightFaction,
    showSpellCardBanner,
  };
});

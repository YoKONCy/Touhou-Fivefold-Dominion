/**
 * Vue 3 + Pinia 战斗状态桥
 * 完整支持：
 * - 4 种多格碰撞体积（1×1 / 1×2 / 2×1 / 2×2）精准点选与多向近战落脚选位
 * - 原版 HoMM4 极简和风卷轴右侧栏 + 4 类按需展开二级 HUD（术式符卡 / 药水 / 战报 / 设置）
 * - 原版 HoMM4 右键任意单位弹出单位详情卡（UnitDetailModal）
 * - 光标跟随预估伤害范围与兵力折损浮标 + 6 态像素动画战术指针
 */

import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import { chooseTacticalAiCommand } from '@ai/tacticalAi';
import { soundEngine, type AudioSettings } from '@audio/index';
import {
  canModifyHeroClassOrBuild,
  canPlaceFootprintAt,
  checkRangedCapability,
  checkSpellLineOfSight,
  dispatchCombatCommand,
  findCorpseTargetAtHex,
  findUnitAtHex,
  getAvailableCorpseHp,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  getUnitMinDistance,
  getUnitOccupiedHexes,
  getUnitReachableMap,
  getValidMeleeApproachAnchors,
  isEngagedInMelee,
  previewAttack,
  selectHeroAdvancedClass,
  setHeroPrimarySkillRank,
  setHeroSecondarySkillRank,
  syncHeroDerivedState,
} from '@core/combatEngine';
import { validateSpellUnitTarget } from '@core/h4SpellExecutor';
import {
  getFootprintHexes,
  hexDistance,
  hexEquals,
  hexKey,
  hexToPixel,
  minHexSetDistance,
  reconstructHexPath,
  type FootprintSize,
  type HexCoord,
} from '@core/hex';
import {
  computeUnitStats,
  resolveActiveArtifactSets,
  resolveAdvancedClass,
  resolveEligibleAdvancedClasses,
} from '@core/modifiers';
import type {
  AttackPreview,
  BattleState,
  BattleUnit,
  CombatCommand,
  PrimarySkillId,
  RangedPenaltyTier,
  SecondarySkillId,
  SkillRank,
} from '@core/types';
import {
  createReimuVsMarisaBattle,
  TOUHOU_CATALOG,
  type LineupVariant,
  type PlayableFactionId,
} from '@data/battlePresets';
import {
  STAGE_PROJECTION,
  type BattleStage,
  type GridVisibilityMode,
  type StageOverlayHints,
} from '@renderer/battleStage';

export type SecondaryDrawerType = 'none' | 'spells' | 'potions' | 'logs' | 'settings';

export type TacticalCursorKind =
  | 'default'
  | 'move'
  | 'fly_move'
  | 'melee'
  | 'ranged'
  | 'ranged_penalty'
  | 'spell'
  | 'blocked'
  | 'inspect';

export interface TacticalCursorState {
  kind: TacticalCursorKind;
  angleDeg: number;
  label?: string;
  /** 远程射击时的 HoMM4 原版距离/遮挡衰减档位（默认 full / 1/2 / 最低 1/4） */
  rangedPenaltyTier?: RangedPenaltyTier;
}

export interface SpellCardBannerState {
  visible: boolean;
  name: string;
  subtitle: string;
  themeColor: string;
  accentColor: string;
  casterBlueprintId?: string;
}

export interface UnitDetailModalState {
  unitId: string;
  x: number;
  y: number;
}

export interface HoverAttackContext {
  attacker: BattleUnit;
  defender: BattleUnit;
  preview: AttackPreview;
  isCurrentTurnAttacker: boolean;
  chosenApproachHex: HexCoord | null;
  candidateApproachHexes: HexCoord[];
}

function angleDiffAbs(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** 计算多格锚点在虚拟舞台中的中心像素 */
function footprintCenterVirtual(
  state: BattleState,
  anchor: HexCoord,
  footprint: FootprintSize,
): { x: number; y: number } {
  const hexes = getFootprintHexes(anchor, footprint);
  let sx = 0;
  let sy = 0;
  for (const h of hexes) {
    const pt = hexToPixel(h, STAGE_PROJECTION, state.tiles[hexKey(h)]?.elevation ?? 1);
    sx += pt.x;
    sy += pt.y;
  }
  const n = Math.max(1, hexes.length);
  return { x: sx / n, y: sy / n };
}

/**
 * 原版 HoMM4 多格近战方位落脚选位算法
 */
function pickDirectionalMeleeApproach(
  state: BattleState,
  attacker: BattleUnit,
  defender: BattleUnit,
  virtualPos: { x: number; y: number } | null,
): { chosen: HexCoord | null; candidates: HexCoord[] } {
  const rawCandidates = getValidMeleeApproachAnchors(state, attacker, defender, TOUHOU_CATALOG);
  if (rawCandidates.length === 0) return { chosen: null, candidates: [] };

  // H4 长武器（镇守狛犬）悬停选位优化：对非长手目标优先锁定隔 1 格（distance === 2）免反击突刺环，防止误走贴脸吃反击！
  let candidates = rawCandidates;
  if (attacker.abilities.longWeapon && !defender.abilities.longWeapon && !defender.abilities.noMelee) {
    const defHexes = getUnitOccupiedHexes(defender);
    const safeDist2 = rawCandidates.filter(
      (c) => minHexSetDistance(getFootprintHexes(c, attacker.footprint), defHexes) === 2,
    );
    if (safeDist2.length > 0) {
      candidates = safeDist2;
    }
  }

  if (candidates.length === 1 || !virtualPos) {
    return { chosen: candidates[0], candidates };
  }

  const defCenter = footprintCenterVirtual(state, defender.pos, defender.footprint);
  const dx = virtualPos.x - defCenter.x;
  const dy = virtualPos.y - defCenter.y;
  const refPt =
    Math.hypot(dx, dy) >= 3
      ? virtualPos
      : footprintCenterVirtual(state, attacker.pos, attacker.footprint);
  const mouseAngle = Math.atan2(refPt.y - defCenter.y, refPt.x - defCenter.x);

  let best = candidates[0];
  let bestDiff = Infinity;
  for (const cand of candidates) {
    const cPt = footprintCenterVirtual(state, cand, attacker.footprint);
    const candAngle = Math.atan2(cPt.y - defCenter.y, cPt.x - defCenter.x);
    const diff = angleDiffAbs(mouseAngle, candAngle);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = cand;
    }
  }
  return { chosen: best, candidates };
}

export const useBattleStore = defineStore('battle', () => {
  const mode = ref<'vs_ai' | 'hotseat'>('vs_ai');
  const balancePreset = ref<'classic_h4' | 'equilibris_tuned'>('equilibris_tuned');
  const lineupVariant = ref<LineupVariant>('A');
  const leftFaction = ref<PlayableFactionId>('death');
  const rightFaction = ref<PlayableFactionId>('life');
  const gridMode = ref<GridVisibilityMode>('subtle');
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

  const isAnimating = ref(false);
  const hoveredHex = ref<HexCoord | null>(null);
  const pointerPos = ref<{ x: number; y: number } | null>(null);
  const hoverVirtualPos = ref<{ x: number; y: number } | null>(null);
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
  let toastTimer: number | null = null;
  let bannerTimer: number | null = null;

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

  /**
   * 按回合缓存当前行动单位的可达六边形图与可攻击敌军列表：
   * 仅在战局版本号、当前行动者、攻击模式或动画状态变化时重算，彻底消灭鼠标移动期间每秒数十次的重复 Dijkstra 寻路卡顿！
   */
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

  /**
   * 选中单位 hover 敌方单位（支持悬停在多格单位的任意占据格！）时的交锋预估上下文
   * 铁律：只要当前是人类行动回合，悬停敌方单位时永远无条件优先以当前行动单位 activeUnit 为攻击者！
   */
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
    const hoveredUnit = findUnitAtHex(st, hex, false);
    if (!hoveredUnit) return null;

    let attacker: BattleUnit | null = null;
    // 1. 人类行动回合优先锁定当前可操控单位，防止右键查详情或点选友军后丢失攻击指示！
    if (
      isHumanTurn.value &&
      activeUnit.value &&
      activeUnit.value.status === 'alive' &&
      activeUnit.value.side !== hoveredUnit.side
    ) {
      attacker = activeUnit.value;
    } else {
      // 2. 非行动方（如 AI 回合期间）允许用用户查看的单位做假设推演预览
      const insp = inspectedUnit.value;
      if (insp && insp.status === 'alive' && insp.side !== hoveredUnit.side) {
        attacker = insp;
      } else if (
        activeUnit.value &&
        activeUnit.value.status === 'alive' &&
        activeUnit.value.side !== hoveredUnit.side
      ) {
        attacker = activeUnit.value;
      }
    }
    if (!attacker) return null;

    const isCurrentTurnAttacker = attacker.id === st.activeUnitId && isHumanTurn.value;
    const useForceMelee = isCurrentTurnAttacker && canToggleAttackMode.value && forceMeleeMode.value;
    const rangedCap = checkRangedCapability(st, attacker, hoveredUnit, TOUHOU_CATALOG);
    let chosenApproachHex: HexCoord | null = null;
    let candidateApproachHexes: HexCoord[] = [];

    if (useForceMelee || !rangedCap.canRanged) {
      const pick = pickDirectionalMeleeApproach(st, attacker, hoveredUnit, hoverVirtualPos.value);
      chosenApproachHex = pick.chosen;
      candidateApproachHexes = pick.candidates;
    }

    const preview = previewAttack(
      st,
      attacker.id,
      hoveredUnit.id,
      TOUHOU_CATALOG,
      chosenApproachHex ?? undefined,
      useForceMelee,
    );

    return {
      attacker,
      defender: hoveredUnit,
      preview,
      isCurrentTurnAttacker,
      chosenApproachHex: preview.valid && !preview.isRanged ? chosenApproachHex : null,
      candidateApproachHexes: preview.valid && !preview.isRanged ? candidateApproachHexes : [],
    };
  });

  const tacticalCursor = computed<TacticalCursorState>(() => {
    void stateVersion.value;
    const st = battleState.value;
    const act = activeUnit.value;
    const hex = hoveredHex.value;

    if (
      !pointerPos.value ||
      !hex ||
      isAnimating.value ||
      st.phase !== 'active' ||
      detailModal.value ||
      activeDrawer.value === 'spells'
    ) {
      return { kind: 'default', angleDeg: 0 };
    }

    if (declaringSpellCard.value && act && isHumanTurn.value) {
      if (getUnitOccupiedHexes(act).some((h) => hexEquals(h, hex))) {
        return { kind: 'blocked', angleDeg: 0 };
      }
      return { kind: 'spell', angleDeg: 0, label: '符卡宣言' };
    }

    if (selectedSpellId.value && act && isHumanTurn.value) {
      const spell = TOUHOU_CATALOG.spells[selectedSpellId.value];
      if (!spell) return { kind: 'default', angleDeg: 0 };
      const effRange = getEffectiveSpellRange(st, act, spell);

      if (spell.targetType === 'hex_aoe') {
        if (effRange > 0 && hexDistance(act.pos, hex) > effRange) {
          return { kind: 'blocked', angleDeg: 0, label: '超出射程' };
        }
        if (!spell.ignoreLos && !checkSpellLineOfSight(st, act, [hex]).canCast) {
          return { kind: 'blocked', angleDeg: 0, label: '视线受阻' };
        }
        return { kind: 'spell', angleDeg: 0, label: spell.name };
      }

      if (spell.targetType === 'hex_empty') {
        if (effRange > 0 && hexDistance(act.pos, hex) > effRange) {
          return { kind: 'blocked', angleDeg: 0, label: '超出射程' };
        }
        const tmpl = spell.summonTemplateId ? TOUHOU_CATALOG.creatures[spell.summonTemplateId] : undefined;
        const canDrop = canPlaceFootprintAt(st, hex, tmpl?.footprint ?? '1x1', undefined, Boolean(tmpl?.abilities.flying));
        return canDrop
          ? { kind: 'spell', angleDeg: 0, label: `召唤·${tmpl?.name ?? spell.name}` }
          : { kind: 'blocked', angleDeg: 0, label: '落点受阻' };
      }

      if (spell.targetType === 'corpse_unit') {
        if (st.battleSpellFlags?.necromancyWardActive) {
          return { kind: 'blocked', angleDeg: 0, label: '净土封冥封印' };
        }
        const corpse = findCorpseTargetAtHex(st, hex, TOUHOU_CATALOG);
        if (corpse) {
          if (effRange > 0 && getUnitMinDistance(act, corpse) > effRange) {
            return { kind: 'blocked', angleDeg: 0, label: '超出射程' };
          }
          return { kind: 'spell', angleDeg: 0, label: `招魂·${corpse.name}` };
        }
        return { kind: 'blocked', angleDeg: 0, label: '请选择阵亡/战损兵种' };
      }

      if (spell.targetType === 'unit_to_hex') {
        if (!pendingSpellFirstUnitId.value) {
          const t = findUnitAtHex(st, hex, false);
          if (t && t.side === act.side && !t.abilities.magicImmune) {
            if (effRange > 0 && getUnitMinDistance(act, t) > effRange) {
              return { kind: 'blocked', angleDeg: 0, label: '超出射程' };
            }
            return { kind: 'spell', angleDeg: 0, label: '① 选择传送友军' };
          }
          return { kind: 'blocked', angleDeg: 0, label: '请选择己方友军' };
        }
        const firstUnit = st.units[pendingSpellFirstUnitId.value];
        if (firstUnit && canPlaceFootprintAt(st, hex, firstUnit.footprint, firstUnit.id, Boolean(firstUnit.abilities.flying))) {
          return { kind: 'spell', angleDeg: 0, label: '② 传送至此' };
        }
        return { kind: 'blocked', angleDeg: 0, label: '落点不可通行' };
      }

      if (spell.targetType === 'ally_to_ally') {
        const t = findUnitAtHex(st, hex, false);
        if (!pendingSpellFirstUnitId.value) {
          if (t && t.side === act.side && !t.abilities.magicImmune && !(spell.specialEffect === 'sacrifice' && t.kind === 'hero')) {
            if (effRange > 0 && getUnitMinDistance(act, t) > effRange) {
              return { kind: 'blocked', angleDeg: 0, label: '超出射程' };
            }
            return { kind: 'spell', angleDeg: 0, label: spell.specialEffect === 'sacrifice' ? '① 选择献祭友兵' : '① 选择替身友军' };
          }
          return { kind: 'blocked', angleDeg: 0, label: '请选择己方友军' };
        }
        if (t && t.side === act.side && t.id !== pendingSpellFirstUnitId.value && !t.abilities.magicImmune) {
          if (effRange > 0 && getUnitMinDistance(act, t) > effRange) {
            return { kind: 'blocked', angleDeg: 0, label: '超出射程' };
          }
          return { kind: 'spell', angleDeg: 0, label: spell.specialEffect === 'sacrifice' ? '② 选择复生友军' : '② 选择被庇护者' };
        }
        return { kind: 'blocked', angleDeg: 0, label: '请选择另一名友军' };
      }

      const targetUnit = findUnitAtHex(st, hex, false);
      if (targetUnit) {
        const validCheck = validateSpellUnitTarget(spell, act, targetUnit, st, TOUHOU_CATALOG, false);
        if (!validCheck.ok) {
          return { kind: 'blocked', angleDeg: 0, label: validCheck.shortLabel };
        }
        if (effRange > 0 && getUnitMinDistance(act, targetUnit) > effRange) {
          return { kind: 'blocked', angleDeg: 0, label: '超出射程' };
        }
        if (!spell.ignoreLos && !checkSpellLineOfSight(st, act, getUnitOccupiedHexes(targetUnit), targetUnit).canCast) {
          return { kind: 'blocked', angleDeg: 0, label: '视线受阻' };
        }
        return { kind: 'spell', angleDeg: 0, label: spell.name };
      }
      return { kind: 'blocked', angleDeg: 0 };
    }

    const hoveredUnit = findUnitAtHex(st, hex, false);
    if (hoveredUnit && act && isHumanTurn.value) {
      if (hoveredUnit.side === act.side) {
        return { kind: 'inspect', angleDeg: 0, label: '查看友军' };
      }
      const ctx = hoverAttackContext.value;
      if (ctx && ctx.isCurrentTurnAttacker) {
        if (!ctx.preview.valid) {
          return { kind: 'blocked', angleDeg: 0, label: '不可攻击' };
        }
        if (ctx.preview.isRanged) {
          const tier = ctx.preview.rangedPenaltyTier;
          const label =
            tier === 'full'
              ? '远程射击'
              : tier === 'half'
                ? '远程 1/2'
                : tier === 'quarter'
                  ? '远程 1/4'
                  : '远程 1/8';
          return {
            kind: tier === 'full' ? 'ranged' : 'ranged_penalty',
            angleDeg: 0,
            rangedPenaltyTier: tier,
            label,
          };
        }
        const fromAnchor = ctx.chosenApproachHex ?? act.pos;
        const pFrom = footprintCenterVirtual(st, fromAnchor, act.footprint);
        const pTo = footprintCenterVirtual(st, hoveredUnit.pos, hoveredUnit.footprint);
        const angleDeg = (Math.atan2(pTo.y - pFrom.y, pTo.x - pFrom.x) * 180) / Math.PI;
        return {
          kind: 'melee',
          angleDeg,
          label: ctx.preview.isLongWeaponPoke ? '长手隔格' : '近战突击',
        };
      }
    }

    if (act && isHumanTurn.value && !hoveredUnit) {
      if (activeReachableHexKeys.value.has(hexKey(hex)) && !hexEquals(hex, act.pos)) {
        return {
          kind: act.abilities.flying ? 'fly_move' : 'move',
          angleDeg: 0,
          label: act.abilities.flying ? '漂浮移动' : '移动',
        };
      }
      return { kind: 'blocked', angleDeg: 0, label: '不可通行' };
    }

    if (hoveredUnit) {
      return { kind: 'inspect', angleDeg: 0, label: '查看单位' };
    }
    return { kind: 'default', angleDeg: 0 };
  });

  function showToast(msg: string): void {
    toastMessage.value = msg;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
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
    if (bannerTimer) window.clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(() => {
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
    const st = battleState.value;
    const act = activeUnit.value;
    const emptySet = new Set<string>();
    const baseEmpty: StageOverlayHints = {
      activeUnitId: st.activeUnitId,
      selectedUnitId: inspectedUnitId.value,
      hoveredHex: hoveredHex.value,
      reachableHexKeys: emptySet,
      attackableUnitIds: emptySet,
      attackPreview: null,
      movePathPreview: null,
      meleeCandidateHexes: [],
      meleeApproachHex: null,
      meleeTargetHex: null,
      targetingMode: 'normal',
      spellRange: 0,
      aoeRadius: 0,
      lineLength: 0,
      validSpellUnitIds: emptySet,
    };

    if (!act || !isHumanTurn.value || isAnimating.value || st.phase !== 'active') {
      return baseEmpty;
    }

    if (declaringSpellCard.value && act.signatureSpellCardId) {
      const card = TOUHOU_CATALOG.spellCards[act.signatureSpellCardId];
      if (card?.targetType === 'hex_line') {
        return {
          ...baseEmpty,
          targetingMode: 'spell_card_line',
          lineLength: card.lineLength ?? 14,
        };
      }
    }

    if (selectedSpellId.value) {
      const spell = TOUHOU_CATALOG.spells[selectedSpellId.value];
      if (spell) {
        const effRange = getEffectiveSpellRange(st, act, spell);
        if (spell.targetType === 'hex_aoe') {
          return {
            ...baseEmpty,
            targetingMode: 'spell_aoe',
            spellRange: effRange,
            aoeRadius: spell.aoeRadius ?? 1,
          };
        }
        if (spell.targetType === 'hex_empty') {
          const tmpl = spell.summonTemplateId ? TOUHOU_CATALOG.creatures[spell.summonTemplateId] : undefined;
          const emptyKeys = new Set<string>();
          for (const tile of Object.values(st.tiles)) {
            if (
              hexDistance(act.pos, tile) <= effRange &&
              canPlaceFootprintAt(st, tile, tmpl?.footprint ?? '1x1', undefined, Boolean(tmpl?.abilities.flying))
            ) {
              emptyKeys.add(hexKey(tile));
            }
          }
          return {
            ...baseEmpty,
            targetingMode: 'spell_empty_hex',
            spellRange: effRange,
            validEmptyHexKeys: emptyKeys,
          };
        }
        if (spell.targetType === 'unit_to_hex' && pendingSpellFirstUnitId.value) {
          const firstUnit = st.units[pendingSpellFirstUnitId.value];
          const emptyKeys = new Set<string>();
          if (firstUnit) {
            for (const tile of Object.values(st.tiles)) {
              if (canPlaceFootprintAt(st, tile, firstUnit.footprint, firstUnit.id, Boolean(firstUnit.abilities.flying))) {
                emptyKeys.add(hexKey(tile));
              }
            }
          }
          return {
            ...baseEmpty,
            targetingMode: 'spell_empty_hex',
            spellRange: 99,
            validEmptyHexKeys: emptyKeys,
          };
        }
        if (spell.targetType === 'corpse_unit') {
          const validIds = new Set<string>();
          if (!st.battleSpellFlags?.necromancyWardActive) {
            for (const u of Object.values(st.units)) {
              if (u.kind !== 'creature' || u.statusEffects?.disintegrated) continue;
              if (effRange > 0 && getUnitMinDistance(act, u) > effRange) continue;
              if (getAvailableCorpseHp(st, u, TOUHOU_CATALOG) > 0) {
                validIds.add(u.id);
              }
            }
          }
          return {
            ...baseEmpty,
            targetingMode: 'spell_unit',
            spellRange: effRange,
            validSpellUnitIds: validIds,
          };
        }

        const validIds = new Set<string>();
        for (const u of Object.values(st.units)) {
          if (u.status !== 'alive') continue;
          if (spell.targetType === 'unit_to_hex') {
            if (
              u.side === act.side &&
              !u.abilities.magicImmune &&
              !u.statusEffects?.sanctuary &&
              (effRange <= 0 || getUnitMinDistance(act, u) <= effRange)
            ) {
              validIds.add(u.id);
            }
            continue;
          }
          if (spell.targetType === 'ally_to_ally') {
            if (u.side !== act.side || u.abilities.magicImmune || u.statusEffects?.sanctuary) continue;
            if (effRange > 0 && getUnitMinDistance(act, u) > effRange) continue;
            if (!pendingSpellFirstUnitId.value && spell.specialEffect === 'sacrifice' && u.kind === 'hero') continue;
            if (pendingSpellFirstUnitId.value && u.id === pendingSpellFirstUnitId.value) continue;
            validIds.add(u.id);
            continue;
          }
          if (!validateSpellUnitTarget(spell, act, u, st, TOUHOU_CATALOG, false).ok) continue;
          if (
            (effRange <= 0 || getUnitMinDistance(act, u) <= effRange) &&
            (spell.ignoreLos || checkSpellLineOfSight(st, act, getUnitOccupiedHexes(u), u).canCast)
          ) {
            validIds.add(u.id);
          }
        }
        return {
          ...baseEmpty,
          targetingMode: 'spell_unit',
          spellRange: effRange,
          validSpellUnitIds: validIds,
        };
      }
    }

    const reachable = activeReachableMap.value;
    const hoverCtx = hoverAttackContext.value;
    const isActAttacking = Boolean(hoverCtx && hoverCtx.isCurrentTurnAttacker && hoverCtx.preview.valid);

    let movePathPreview: HexCoord[] | null = null;
    if (!hoverCtx && hoveredHex.value && reachable && reachable.costs.has(hexKey(hoveredHex.value))) {
      movePathPreview = reconstructHexPath(reachable, hoveredHex.value);
    }

    return {
      ...baseEmpty,
      reachableHexKeys: activeReachableHexKeys.value,
      attackableUnitIds: activeAttackableUnitIds.value,
      attackPreview: isActAttacking ? hoverCtx!.preview : null,
      movePathPreview,
      meleeCandidateHexes: isActAttacking ? hoverCtx!.candidateApproachHexes : [],
      meleeApproachHex: isActAttacking ? hoverCtx!.chosenApproachHex : null,
      meleeTargetHex: isActAttacking && hoverCtx!.chosenApproachHex ? hoverCtx!.defender.pos : null,
    };
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
    soundEngine.play('ui_click');
    showToast(
      forceMeleeMode.value
        ? '已切换为【近战突击】模式（按 M 可切回远程）'
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
    inspectedUnitId,
    selectedSpellId,
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
    tacticalCursor,
    attachStage,
    handleHoverHex,
    handleClickHex,
    handleRightClickHex,
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

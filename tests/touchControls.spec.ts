/**
 * 移动端触控交互、二段确认、近战换位与长按等效右键单元测试
 */

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { findUnitAtHex, getUnitReachableMap, previewAttack } from '@core/combatEngine';
import { hexEquals, type HexCoord } from '@core/hex';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { useBattleStore } from '@ui/battleStore';
import { setInputMode } from '@ui/composables/useViewportInput';

function pickFirstReachableEmptyHex(store: ReturnType<typeof useBattleStore>): HexCoord {
  const act = store.activeUnit!;
  const map = getUnitReachableMap(store.battleState, act, TOUHOU_CATALOG);
  for (const [key, cost] of map.costs.entries()) {
    if (cost <= 0) continue;
    const [q, r] = key.split(',').map(Number);
    const coord = { q, r };
    if (!hexEquals(coord, act.pos) && !findUnitAtHex(store.battleState, coord, true)) {
      return coord;
    }
  }
  throw new Error('未找到当前单位可达的空地测试格');
}

describe('移动端触控交互与二段确认状态机', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setInputMode('touch');
  });

  it('触控模式首触可达空地仅进入预览并弹出确认栏，再触同格才执行移动', async () => {
    const store = useBattleStore();
    store.restartBattle('hotseat');
    const act = store.activeUnit!;
    const originPos = { ...act.pos };
    const targetHex = pickFirstReachableEmptyHex(store);

    // 首次轻触：锁定预览态，不立即执行移动
    store.handleTouchTapHex(targetHex, { x: 240, y: 200 }, { x: 420, y: 240 });
    expect(store.touchPreviewHex).toEqual(targetHex);
    expect(store.touchActionSummary?.mode).toBe('move');
    expect(store.touchActionSummary?.canConfirm).toBe(true);
    expect(store.battleState.units[act.id].pos).toEqual(originPos);
    // 触控模式下桌面自定义像素指针保持隐藏
    expect(store.tacticalCursor.kind).toBe('default');

    // 二次轻触同一目标格：确认执行移动
    store.handleTouchTapHex(targetHex, { x: 240, y: 200 }, { x: 420, y: 240 });
    await Promise.resolve();
    expect(store.battleState.units[act.id].pos).toEqual(targetHex);
    expect(store.touchPreviewHex).toBeNull();
  });

  it('触控长按任意单位等效桌面右键直接展开详情窗，施法瞄准态长按则优先取消瞄准', () => {
    const store = useBattleStore();
    store.restartBattle('hotseat');
    const act = store.activeUnit!;

    // 常规态长按单位 → 打开单位详情大窗
    store.handleLongPressHex(act.pos, { x: 300, y: 180 });
    expect(store.detailModal?.unitId).toBe(act.id);

    store.closeUnitDetail();
    expect(store.detailModal).toBeNull();

    // 若当前单位拥有法术，验证施法瞄准态长按优先取消瞄准而非弹窗
    const heroUnit = Object.values(store.battleState.units).find(
      (u) => u.status === 'alive' && u.knownSpellIds.length > 0,
    );
    if (heroUnit) {
      store.battleState.activeUnitId = heroUnit.id;
      store.stateVersion += 1;
      const castableSpellId = heroUnit.knownSpellIds.find((id) => {
        const sp = TOUHOU_CATALOG.spells[id];
        return sp && !sp.isAdventureOnly && sp.targetType !== 'self' && sp.targetType !== 'adventure';
      });
      if (castableSpellId) {
        store.selectSpell(castableSpellId);
        expect(store.selectedSpellId).toBe(castableSpellId);
        expect(store.touchActionSummary?.isTargeting).toBe(true);

        store.handleLongPressHex(heroUnit.pos, { x: 300, y: 180 });
        expect(store.selectedSpellId).toBeNull();
        expect(store.detailModal).toBeNull();
      }
    }
  });

  it('触控近战预览支持点击金色候选落脚格或「换位」按钮切换攻击落脚方位', () => {
    const store = useBattleStore();
    store.restartBattle('hotseat');
    const st = store.battleState;

    // 寻找一名近战存活单位与一名敌军，将两者摆到足够近的位置以产生多个合法落脚邻格
    const attacker = Object.values(st.units).find(
      (u) => u.status === 'alive' && u.side === 'left' && !u.abilities.ranged,
    );
    const defender = Object.values(st.units).find(
      (u) => u.status === 'alive' && u.side === 'right' && u.footprint === '1x1',
    );
    expect(attacker).toBeTruthy();
    expect(defender).toBeTruthy();

    st.activeUnitId = attacker!.id;
    // 将敌军挪至攻方 2 格内且确保周围有多处空位
    const reachMap = getUnitReachableMap(st, attacker!, TOUHOU_CATALOG);
    const candidateNear = Array.from(reachMap.costs.entries()).find(([, cost]) => cost === 2);
    expect(candidateNear).toBeTruthy();
    const [dq, dr] = candidateNear![0].split(',').map(Number);
    defender!.pos = { q: dq, r: dr };
    store.stateVersion += 1;

    const preview = previewAttack(st, attacker!.id, defender!.id, TOUHOU_CATALOG);
    expect(preview.valid).toBe(true);

    // 轻触敌军进入近战预览态
    store.handleTouchTapHex(defender!.pos, { x: 320, y: 200 }, { x: 460, y: 240 });
    const ctx1 = store.hoverAttackContext;
    expect(ctx1?.preview.valid).toBe(true);
    expect(store.touchActionSummary?.mode).toBe('attack');
    expect(store.touchActionSummary?.inspectUnitId).toBe(defender!.id);

    if ((ctx1?.candidateApproachHexes.length ?? 0) > 1) {
      const initialApproach = ctx1!.chosenApproachHex!;
      store.cycleMeleeApproach();
      const nextApproach = store.hoverAttackContext!.chosenApproachHex!;
      expect(hexEquals(initialApproach, nextApproach)).toBe(false);

      // 直接点按初始候选落脚格切回原方位
      store.handleTouchTapHex(initialApproach, { x: 300, y: 200 }, { x: 440, y: 240 });
      expect(hexEquals(store.hoverAttackContext!.chosenApproachHex!, initialApproach)).toBe(true);
    }
  });

  it('切换回桌面鼠标模式后，动态像素光标与单次左键直接移动零回归', async () => {
    setInputMode('mouse');
    const store = useBattleStore();
    store.restartBattle('hotseat');
    const act = store.activeUnit!;
    const targetHex = pickFirstReachableEmptyHex(store);

    // 桌面鼠标悬停 → 显示移动像素指针，不弹出触控底部确认栏
    store.handleHoverHex(targetHex, { x: 300, y: 220 }, { x: 420, y: 250 });
    expect(['move', 'fly_move']).toContain(store.tacticalCursor.kind);
    expect(store.touchActionSummary).toBeNull();

    // 桌面左键单次点击 → 直接执行移动
    store.handleClickHex(targetHex);
    await Promise.resolve();
    expect(store.battleState.units[act.id].pos).toEqual(targetHex);
  });
});

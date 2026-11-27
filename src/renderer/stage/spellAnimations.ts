/**
 * 五系魔法施放编排与四大英雄终极符卡宣言演出子系统
 */

import { soundEngine } from '@audio/index';
import { getHexRange, hexDistance, hexKey, hexToPixel } from '@core/hex';
import type { BattleState, CombatEvent } from '@core/types';
import { TOUHOU_PALETTES } from '../pixelfxBridge';
import type { RangedProjectileKind } from '../rangedProjectileFx';
import { getSpellVfxChoreography } from '../spellVfxCatalog';
import { sleep } from './geometry';
import {
  STAGE_PROJECTION,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
  type StageAnimationContext,
} from './types';
import { setNodeAnim } from './unitNodeRenderer';

/** 播放常规五系魔法四段式施放演出（起手阵 → 弹道/射线/连锁/天降 → 目标爆发与全屏天象 → 召唤/位移/伤害与治疗飘字） */
export async function animateSpellCast(
  ctx: StageAnimationContext,
  ev: Extract<CombatEvent, { type: 'SPELL_CAST' }>,
  finalState: BattleState,
): Promise<void> {
  const state = ctx.getCurrentState();
  if (!state) return;
  const tile = state.tiles[hexKey(ev.targetHex)];
  const targetPx = hexToPixel(ev.targetHex, STAGE_PROJECTION, tile?.elevation ?? 1);
  const choreo = getSpellVfxChoreography(ev.spellId);
  const casterNode = ctx.unitNodes.get(ev.casterId);
  const casterX = casterNode?.baseX ?? targetPx.x;
  const casterY = (casterNode?.baseY ?? targetPx.y) - 14;

  // 阶段 1：施法者转向抬手 + 专属起手阵/蓄力灵光
  if (casterNode) {
    if (Math.abs(targetPx.x - casterNode.baseX) > 2) {
      casterNode.facing = targetPx.x >= casterNode.baseX ? 'right' : 'left';
    }
    setNodeAnim(casterNode, 'attack', 9, false);
    if (choreo.casterFx) {
      ctx.fxBridge.spawnEffect(choreo.casterFx, casterNode.baseX, casterNode.baseY - 10, {
        paletteKey: choreo.casterPalette ?? choreo.impactPalette,
        light: (choreo.light ?? 1.35) * 0.9,
        speedScale: 1.55,
        maxDuration: 0.95,
      });
    }
    await sleep(115);
  }

  // 阶段 2：专属弹道 / 贯穿射线 / 连锁锯齿雷弧 / 业火六格环爆 / 双端隙间传送 / 吸魂回流 / 全屏天象
  const travel = choreo.travel ?? 'none';
  const travelCol = choreo.travelColor ?? 0xffe484;
  const castAngle = Math.atan2(targetPx.y - 10 - casterY, targetPx.x - casterX);

  if (travel === 'bolt' || travel === 'ofuda_arc') {
    soundEngine.playAtStageX(choreo.sound, casterX, VIRTUAL_WIDTH, { volume: 0.95 });
    const spellKind: RangedProjectileKind =
      travel === 'ofuda_arc'
        ? 'light_orb'
        : ev.spellId.startsWith('death_')
          ? 'dark_orb'
          : ev.spellId.includes('fire') || ev.spellId.includes('meteor')
            ? 'explosive_shell'
            : 'magic_wave';
    ctx.spawnProjectile(casterX, casterY, targetPx.x, targetPx.y - 12, travelCol, {
      kind: spellKind,
      arcHeight: spellKind === 'explosive_shell' ? 22 : spellKind === 'magic_wave' ? 5 : 11,
    });
    if (travel === 'ofuda_arc') {
      ctx.spawnProjectile(casterX, casterY - 5, targetPx.x, targetPx.y - 16, 0xffffff, {
        kind: 'light_orb',
        arcHeight: 15,
      });
    }
    await sleep(170);
  } else if (travel === 'beam') {
    soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
    ctx.fxBridge.spawnEffect(choreo.impactFx, casterX, casterY, {
      paletteKey: choreo.impactPalette,
      angle: castAngle,
      light: choreo.light ?? 1.6,
      speedScale: choreo.speedScale ?? 1.35,
      maxDuration: 1.15,
    });
    ctx.spawnProjectile(casterX, casterY, targetPx.x, targetPx.y - 12, travelCol);
    await sleep(140);
  } else if (travel === 'teleport_rift') {
    soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
    // 先在被传送单位原位置撕开隙间消隐
    const disp = ev.displacedUnits?.[0];
    const oldNode = disp ? ctx.unitNodes.get(disp.unitId) : null;
    if (oldNode) {
      ctx.fxBridge.spawnEffect('blink_out', oldNode.baseX, oldNode.baseY - 12, {
        paletteKey: choreo.casterPalette ?? 'gap_violet',
        light: 1.5,
        maxDuration: 0.9,
      });
      ctx.fxBridge.spawnEffect('portal', oldNode.baseX, oldNode.baseY - 12, {
        paletteKey: choreo.impactPalette,
        light: 1.45,
        maxDuration: 1.0,
      });
      await sleep(160);
    }
  } else if (travel === 'chain_arcs') {
    soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
    let prevX = casterX;
    let prevY = casterY;
    for (const uid of ev.affectedUnitIds) {
      const hopNode = ctx.unitNodes.get(uid);
      if (!hopNode) continue;
      ctx.spawnProjectile(prevX, prevY, hopNode.baseX, hopNode.baseY - 14, travelCol);
      const hopAngle = Math.atan2(hopNode.baseY - 14 - prevY, hopNode.baseX - prevX);
      ctx.fxBridge.spawnEffect('chain_lightning', (prevX + hopNode.baseX) / 2, (prevY + hopNode.baseY - 14) / 2, {
        paletteKey: choreo.impactPalette,
        angle: hopAngle,
        light: 1.65,
        speedScale: 1.6,
        maxDuration: 0.9,
      });
      prevX = hopNode.baseX;
      prevY = hopNode.baseY - 14;
      await sleep(80);
    }
  } else if (travel === 'ring_burst') {
    soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
    // 业火红环：围绕中心格的 6 个外环六边形逐格喷发火柱（保留中心格安全）
    const ringHexes = getHexRange(ev.targetHex, 1).filter((h) => hexDistance(ev.targetHex, h) === 1);
    for (const rh of ringHexes) {
      const rTile = state.tiles[hexKey(rh)];
      if (!rTile) continue;
      const rPx = hexToPixel(rh, STAGE_PROJECTION, rTile.elevation);
      ctx.fxBridge.spawnEffect(choreo.secondaryFx ?? 'flame_pillar', rPx.x, rPx.y - 8, {
        paletteKey: choreo.secondaryPalette ?? choreo.impactPalette,
        light: 1.5,
        speedScale: 1.55,
        maxDuration: 1.1,
      });
    }
  } else if (travel === 'meteor_rain') {
    soundEngine.playAtStageX(choreo.sound, VIRTUAL_WIDTH / 2, VIRTUAL_WIDTH);
    // 焦热地狱 / 末日审判：多点天降火流星轰炸！
    const points =
      ev.affectedUnitIds.length > 0
        ? ev.affectedUnitIds.slice(0, 6).map((uid) => {
            const n = ctx.unitNodes.get(uid);
            return n ? { x: n.baseX, y: n.baseY - 10 } : { x: targetPx.x, y: targetPx.y - 10 };
          })
        : [
            { x: targetPx.x - 28, y: targetPx.y - 16 },
            { x: targetPx.x + 26, y: targetPx.y - 8 },
            { x: targetPx.x, y: targetPx.y - 12 },
          ];
    for (const pt of points) {
      ctx.spawnProjectile(pt.x + 44, pt.y - 96, pt.x, pt.y, travelCol);
      ctx.fxBridge.spawnEffect(choreo.impactFx, pt.x, pt.y, {
        paletteKey: choreo.impactPalette,
        light: choreo.light ?? 1.65,
        speedScale: 1.45,
        maxDuration: 1.25,
      });
      await sleep(55);
    }
  } else if (travel === 'drain_return') {
    soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
    // 冥樱吸魂 / 噬灵魔蛭 / 窃法魔手：灵流从各目标倒灌回施法者！
    const drainSources = ev.affectedUnitIds.slice(0, 6);
    for (const uid of drainSources) {
      const srcNode = ctx.unitNodes.get(uid);
      if (srcNode && uid !== ev.casterId) {
        ctx.spawnProjectile(srcNode.baseX, srcNode.baseY - 12, casterX, casterY, travelCol);
      }
    }
  } else {
    soundEngine.playAtStageX(choreo.sound, targetPx.x, VIRTUAL_WIDTH);
  }

  // 阶段 3：目标主爆发 + 副层叠特效 + 全屏中央天象
  if (travel !== 'beam') {
    ctx.fxBridge.spawnEffect(choreo.impactFx, targetPx.x, targetPx.y - 10, {
      paletteKey: choreo.impactPalette,
      angle: castAngle,
      light: choreo.light ?? 1.4,
      speedScale: choreo.speedScale ?? 1.45,
      maxDuration: 1.5,
    });
  }
  if (choreo.secondaryFx && travel !== 'ring_burst') {
    ctx.fxBridge.spawnEffect(choreo.secondaryFx, targetPx.x, targetPx.y - 12, {
      paletteKey: choreo.secondaryPalette ?? choreo.impactPalette,
      light: choreo.light ?? 1.4,
      speedScale: 1.45,
      maxDuration: 1.4,
    });
  }
  if (choreo.weatherFx) {
    const isFullScreenWeather =
      choreo.weatherFx === 'god_rays' ||
      choreo.weatherFx === 'cherry_blossoms' ||
      choreo.weatherFx === 'aurora' ||
      choreo.weatherFx === 'fog' ||
      choreo.weatherFx === 'shooting_stars' ||
      choreo.weatherFx === 'crimson_mist';
    ctx.fxBridge.spawnEffect(
      choreo.weatherFx,
      VIRTUAL_WIDTH / 2,
      isFullScreenWeather ? VIRTUAL_HEIGHT / 2 : VIRTUAL_HEIGHT * 0.52,
      {
        paletteKey: choreo.weatherPalette ?? choreo.impactPalette,
        light: isFullScreenWeather ? 1.35 : 1.5,
        speedScale: isFullScreenWeather ? 1.0 : 1.25,
        maxDuration: isFullScreenWeather ? 2.2 : 1.8,
      },
    );
  }
  // 群体/多目标逐单位绽放独立专属粒子（最多并行 8 支防全屏过密掉帧；meteor_rain 已逐目标落陨时防重复翻倍）
  if (choreo.perTargetFx && ev.affectedUnitIds.length > 0) {
    const perTargetCap = travel === 'meteor_rain' ? 4 : 8;
    for (const uid of ev.affectedUnitIds.slice(0, perTargetCap)) {
      const n = ctx.unitNodes.get(uid);
      if (!n) continue;
      ctx.fxBridge.spawnEffect(choreo.perTargetFx, n.baseX, n.baseY - 12, {
        paletteKey: choreo.perTargetPalette ?? choreo.impactPalette,
        light: 1.35,
        speedScale: 1.5,
        maxDuration: 1.2,
      });
    }
  }

  ctx.triggerImpactJuice(choreo.shake, choreo.hitStop ?? 0.05);
  await sleep(230);

  // 阶段 4：同步召唤/幻象/隙间瞬移与变身法术（如「兔化」）后的单位视觉节点并绽放登场灵光！
  if (casterNode) {
    const updatedCaster = finalState.units[ev.casterId];
    if (updatedCaster && updatedCaster.voxelBlueprintId !== casterNode.blueprintId) {
      ctx.syncUnitNode(casterNode, updatedCaster, finalState);
    }
  }
  if (ev.summonedUnitIds && ev.summonedUnitIds.length > 0) {
    for (const sid of ev.summonedUnitIds) {
      const sUnit = finalState.units[sid];
      if (!sUnit) continue;
      const sNode = ctx.ensureAndSyncUnitNode(sUnit, finalState);
      ctx.fxBridge.spawnEffect(choreo.impactFx, sNode.baseX, sNode.baseY - 12, {
        paletteKey: choreo.impactPalette,
        light: 1.5,
        maxDuration: 1.3,
      });
    }
  }
  if (ev.displacedUnits && ev.displacedUnits.length > 0) {
    for (const disp of ev.displacedUnits) {
      const dUnit = finalState.units[disp.unitId];
      const dNode = ctx.unitNodes.get(disp.unitId);
      if (dUnit && dNode) {
        ctx.syncUnitNode(dNode, dUnit, finalState);
        ctx.fxBridge.spawnEffect(choreo.secondaryFx ?? 'blink_in', dNode.baseX, dNode.baseY - 12, {
          paletteKey: choreo.impactPalette,
          light: 1.5,
          maxDuration: 1.1,
        });
      }
    }
  }
  if (ev.noteText) {
    ctx.spawnFloatingText(targetPx.x, targetPx.y - 38, ev.noteText, '#ffe885');
  }

  if (ev.damageMap) {
    for (const [uid, info] of Object.entries(ev.damageMap)) {
      const node = ctx.unitNodes.get(uid);
      if (!node) continue;
      node.flashTimer = 0.22;
      setNodeAnim(node, 'hit', 9, false);
      if (info.grazed) {
        const spellShieldFlip =
          casterX !== node.baseX ? casterX < node.baseX : node.facing === 'left';
        soundEngine.playAtStageX('graze_tick', node.baseX, VIRTUAL_WIDTH);
        ctx.fxBridge.spawn('graze_shield', node.baseX, node.baseY - 12, { flip: spellShieldFlip });
        ctx.spawnFloatingText(node.baseX, node.baseY - 34, 'GRAZE!', '#7ae8ff');
      }
      ctx.spawnFloatingText(
        node.baseX,
        node.baseY - 30 * node.spriteScale,
        `${info.grazed ? '擦弹 ' : ''}-${info.damage} ♥`,
        '#ff8f6b',
      );
      if (!node.isHero) {
        ctx.spawnFloatingText(
          node.baseX,
          node.baseY - 18 * node.spriteScale,
          `-${info.kills} ☠`,
          info.kills > 0 ? '#ffd875' : '#9fb0d4',
        );
      }
    }
  }
  if (ev.reviveMap) {
    for (const [uid, info] of Object.entries(ev.reviveMap)) {
      const node = ctx.unitNodes.get(uid);
      if (!node) continue;
      if (info.revivedCount > 0) {
        ctx.spawnFloatingText(node.baseX, node.baseY - 34 * node.spriteScale, `苏生 +${info.revivedCount} 兵!`, '#ffe680');
      } else if (info.healedHp > 0) {
        ctx.spawnFloatingText(node.baseX, node.baseY - 26 * node.spriteScale, `+${info.healedHp} HP`, '#6effa8');
      }
    }
  } else if (ev.healMap) {
    for (const [uid, amount] of Object.entries(ev.healMap)) {
      const node = ctx.unitNodes.get(uid);
      if (!node) continue;
      ctx.spawnFloatingText(node.baseX, node.baseY - 24, `+${amount} HP`, '#6effa8');
    }
  }
  await sleep(320);
  if (casterNode) setNodeAnim(casterNode, 'idle', 6.5, true);
  if (ev.damageMap) {
    for (const uid of Object.keys(ev.damageMap)) {
      const n = ctx.unitNodes.get(uid);
      if (n) setNodeAnim(n, 'idle', 6.5, true);
    }
  }
}

/** 播放四大英雄终极符卡宣言横幅与专属全屏大招天象演出 */
export async function animateSpellCardDeclared(
  ctx: StageAnimationContext,
  ev: Extract<CombatEvent, { type: 'SPELL_CARD_DECLARED' }>,
): Promise<void> {
  const casterNode = ctx.unitNodes.get(ev.casterId);
  const state = ctx.getCurrentState();

  // 1. 通知 Vue 叠层弹出华丽暗夜和风符卡宣言横幅，并同步奏响东方标志性符卡宣言神乐铃与缔太鼓！
  soundEngine.play('spellcard_declare');
  const casterUnit = state?.units[ev.casterId];
  ctx.callbacks.onSpellCardBanner({
    name: ev.spellCardName,
    subtitle: ev.subtitle,
    themeColor: ev.themeColor,
    accentColor: ev.accentColor,
    casterBlueprintId: casterUnit?.voxelBlueprintId,
  });

  if (casterNode) {
    setNodeAnim(casterNode, 'attack', 8, false);
  }

  await sleep(320);

  // 2. 在舞台上触发四位英雄各自独一无二的终极符卡特效与天象演出！
  if (ev.lineHexes && ev.lineHexes.length > 0 && casterNode && state) {
    const endHex = ev.lineHexes[ev.lineHexes.length - 1];
    const endPx = hexToPixel(endHex, STAGE_PROJECTION, state.tiles[hexKey(endHex)]?.elevation ?? 1);
    const angle = Math.atan2(endPx.y - casterNode.baseY, endPx.x - casterNode.baseX);
    const isRemiliaCard = ev.spellCardId === 'remilia_gungnir';

    if (isRemiliaCard) {
      // 蕾米莉亚《神枪「冈格尼尔之枪」》：绯红螺旋魔枪贯日 + 红雾异变全屏天象 + 专属哥特雷枪音效！
      soundEngine.playAtStageX('spellcard_gungnir', casterNode.baseX, VIRTUAL_WIDTH);
      ctx.fxBridge.spawnEffect('gungnir_lance', casterNode.baseX, casterNode.baseY - 14, {
        paletteKey: 'scarlet_moon',
        angle,
        light: 1.8,
        speedScale: 1.2,
        maxDuration: 1.5,
      });
      ctx.fxBridge.spawnEffect('crimson_mist', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
        paletteKey: 'scarlet_moon',
        light: 1.4,
        speedScale: 1.0,
        maxDuration: 2.2,
      });
      ctx.triggerImpactJuice(8.5, 0.1);

      for (let i = 0; i < ev.lineHexes.length; i += 2) {
        const h = ev.lineHexes[i];
        const px = hexToPixel(h, STAGE_PROJECTION, state.tiles[hexKey(h)]?.elevation ?? 1);
        ctx.fxBridge.spawnEffect('vampiric_claw_burst', px.x, px.y - 10, {
          paletteKey: 'scarlet_moon',
          light: 1.6,
          speedScale: 1.5,
          maxDuration: 0.9,
        });
        await sleep(70);
      }
    } else {
      // 魔理沙《极限火花》：极彩魔炮 + 沿途螺旋五芒星弹幕齐鸣！
      soundEngine.playAtStageX('spellcard_master_spark', casterNode.baseX, VIRTUAL_WIDTH);
      ctx.fxBridge.spawn('spellcard_marisa', casterNode.baseX, casterNode.baseY - 14, {
        angle,
        palette: TOUHOU_PALETTES.marisa_starlight,
        light: 1.7,
        maxDuration: 1.5,
      });
      ctx.triggerImpactJuice(8, 0.1);

      for (let i = 0; i < ev.lineHexes.length; i += 2) {
        const h = ev.lineHexes[i];
        const px = hexToPixel(h, STAGE_PROJECTION, state.tiles[hexKey(h)]?.elevation ?? 1);
        ctx.fxBridge.spawnEffect('star_danmaku_spiral', px.x, px.y - 10, {
          paletteKey: 'marisa_starlight',
          light: 1.55,
          speedScale: 1.45,
          maxDuration: 0.95,
        });
        await sleep(75);
      }
    }
  } else if (casterNode) {
    const isEirinCard = ev.spellCardId === 'eirin_astronomical_entombing';
    if (isEirinCard) {
      // 八意永琳《天文密葬法》：三层浑天星轨秘仪 + 全屏苍蓝流星天幕！
      soundEngine.play('spell_heal', { volume: 1.15 });
      ctx.fxBridge.spawnEffect('lunar_astrolabe_fx', casterNode.baseX, casterNode.baseY - 12, {
        paletteKey: 'order_lunar',
        light: 1.7,
        speedScale: 1.15,
        maxDuration: 1.8,
      });
      ctx.fxBridge.spawnEffect('lunar_astrolabe_fx', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT * 0.54, {
        paletteKey: 'frost_cyan',
        light: 1.6,
        speedScale: 1.1,
        maxDuration: 1.8,
      });
      ctx.fxBridge.spawnEffect('shooting_stars', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
        paletteKey: 'order_lunar',
        light: 1.4,
        speedScale: 1.0,
        maxDuration: 2.2,
      });
      ctx.triggerImpactJuice(5.8, 0.08);
    } else {
      // 博丽灵梦《梦想天生》：朱金太极阴阳玉大阵 + 八百万神降全屏圣光！
      soundEngine.play('spell_heal', { volume: 1.15 });
      ctx.fxBridge.spawnEffect('yin_yang_dream', casterNode.baseX, casterNode.baseY - 12, {
        paletteKey: 'reimu_crimson',
        light: 1.72,
        speedScale: 1.15,
        maxDuration: 1.9,
      });
      ctx.fxBridge.spawnEffect('ofuda_seal_ring', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT * 0.54, {
        paletteKey: 'shrine_gold',
        light: 1.55,
        speedScale: 1.2,
        maxDuration: 1.7,
      });
      ctx.fxBridge.spawnEffect('god_rays', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
        paletteKey: 'reimu_crimson',
        light: 1.4,
        speedScale: 1.0,
        maxDuration: 2.2,
      });
      ctx.triggerImpactJuice(5.5, 0.08);
    }
  }

  if (ev.damageMap) {
    for (const [uid, info] of Object.entries(ev.damageMap)) {
      const node = ctx.unitNodes.get(uid);
      if (!node) continue;
      node.flashTimer = 0.3;
      setNodeAnim(node, 'hit', 9, false);
      ctx.spawnFloatingText(
        node.baseX,
        node.baseY - 32 * node.spriteScale,
        `-${info.damage} ♥`,
        '#ffe45e',
      );
      if (!node.isHero) {
        ctx.spawnFloatingText(
          node.baseX,
          node.baseY - 20 * node.spriteScale,
          `-${info.kills} ☠`,
          info.kills > 0 ? '#ffd875' : '#9fb0d4',
        );
      }
    }
  }

  await sleep(620);
  if (casterNode) setNodeAnim(casterNode, 'idle', 6.5, true);
  if (ev.damageMap) {
    for (const uid of Object.keys(ev.damageMap)) {
      const n = ctx.unitNodes.get(uid);
      if (n) setNodeAnim(n, 'idle', 6.5, true);
    }
  }
}

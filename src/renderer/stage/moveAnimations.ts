/**
 * 单位移动、飞行、常规瞬移与深渊隙间撕裂瞬移演出动画子系统
 */

import * as PIXI from 'pixi.js';
import { soundEngine } from '@audio/index';
import type { HexCoord } from '@core/hex';
import { TOUHOU_PALETTES } from '../pixelfxBridge';
import { getFootprintCenterPixel, sleep } from './geometry';
import { VIRTUAL_WIDTH, type StageAnimationContext, type UnitVisualNode } from './types';
import { setNodeAnim } from './unitNodeRenderer';

/**
 * 魔王（深渊隙间恶魔）专属三段式「撕裂空间瞬移」电影级舞台演出：
 * 第一幕：起点半空斜劈耀眼锯齿裂痕并撕开深黑紫红深渊裂口（浮现睁开的金红魔瞳与崩碎空间菱片）→ 魔王吸入裂口闭合；
 * 第二幕：起终点之间短暂闪现一道锯齿紫白空间折跃裂痕残影；
 * 第三幕：终点凭空撕裂第二道巨幅深渊空间裂口 → 魔王踏出展开身形降临 → 裂口收拢闭合！
 */
export async function animateAbyssSpaceTearTeleport(
  ctx: StageAnimationContext,
  node: UnitVisualNode,
  startCenter: { x: number; y: number },
  endCenter: { x: number; y: number },
): Promise<void> {
  const tearBack = new PIXI.Graphics();
  const tearFront = new PIXI.Graphics();
  ctx.unitLayer.addChild(tearBack);
  ctx.projectileLayer.addChild(tearFront);

  const drawRiftPortal = (
    cx: number,
    cy: number,
    openRatio: number,
    slashRatio: number,
    seedOffset: number,
  ) => {
    tearBack.clear();
    tearFront.clear();
    tearBack.zIndex = Math.round(cy + 14);
    const rLen = 28 * Math.max(0.15, slashRatio);
    const rWidth = 14 * Math.max(0, openRatio);
    const tilt = -0.32;
    const dx = Math.cos(tilt);
    const dy = Math.sin(tilt);
    const nx = -dy;
    const ny = dx;

    // 1. 背层深渊虚空大裂口（深黑紫虚空内腔 + 发光品红撕裂外缘 + 睁开的金红竖瞳魔眼！）
    if (rWidth > 0.6) {
      const outerPts = [
        cx - dx * rLen, cy - dy * rLen,
        cx - dx * rLen * 0.38 + nx * rWidth * 0.92, cy - dy * rLen * 0.38 + ny * rWidth * 0.92,
        cx + dx * rLen * 0.25 + nx * rWidth, cy + dy * rLen * 0.25 + ny * rWidth,
        cx + dx * rLen, cy + dy * rLen,
        cx + dx * rLen * 0.38 - nx * rWidth * 0.92, cy + dy * rLen * 0.38 - ny * rWidth * 0.92,
        cx - dx * rLen * 0.25 - nx * rWidth, cy - dy * rLen * 0.25 - ny * rWidth,
      ];
      tearBack
        .poly(outerPts, true)
        .fill({ color: 0x0b0214, alpha: 0.96 })
        .stroke({ width: 2.4, color: 0xff2b6e, alpha: 0.95 });

      const innerW = rWidth * 0.68;
      const innerPts = [
        cx - dx * rLen * 0.85, cy - dy * rLen * 0.85,
        cx + nx * innerW, cy + ny * innerW,
        cx + dx * rLen * 0.85, cy + dy * rLen * 0.85,
        cx - nx * innerW, cy - ny * innerW,
      ];
      tearBack
        .poly(innerPts, true)
        .fill({ color: 0x260536, alpha: 0.72 })
        .stroke({ width: 1.2, color: 0xd980ff, alpha: 0.85 });

      // 裂口两端经典绯红蝴蝶结丝带光点
      for (const side of [-1, 1]) {
        const rx = cx + dx * rLen * 0.88 * side;
        const ry = cy + dy * rLen * 0.88 * side;
        tearFront.rect(rx - 2, ry - 2, 4, 4).fill({ color: 0xff295e, alpha: 0.95 });
        tearFront.rect(rx - 1, ry - 1, 2, 2).fill({ color: 0xffe478, alpha: 0.95 });
      }

      // 裂口深处睁开的 2 枚金红竖瞳深渊魔眼！
      if (openRatio > 0.38) {
        const eyeAlpha = Math.min(1, (openRatio - 0.38) * 2.2);
        for (const off of [-9, 9]) {
          const ex = cx + dx * off;
          const ey = cy + dy * off;
          tearBack.ellipse(ex, ey, 3.6, 2.2 * eyeAlpha).fill({ color: 0xff3d66, alpha: 0.95 });
          tearBack.ellipse(ex, ey, 2.3, 1.6 * eyeAlpha).fill({ color: 0xffe052, alpha: 1 });
          tearBack.rect(ex - 0.6, ey - 1.5 * eyeAlpha, 1.2, 3 * eyeAlpha).fill({ color: 0x12031f, alpha: 1 });
        }
      }
    }

    // 2. 前景锯齿状紫白空间劈裂闪电主痕 + 崩碎飞散空间菱形碎片！
    const segs = 6;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= segs; i++) {
      const u = (i / segs) * 2 - 1;
      const jitter = i === 0 || i === segs ? 0 : Math.sin(i * 2.9 + seedOffset) * (2.6 + (1 - openRatio) * 2.5);
      pts.push([cx + dx * rLen * u + nx * jitter, cy + dy * rLen * u + ny * jitter]);
    }
    tearFront.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) tearFront.lineTo(pts[i][0], pts[i][1]);
    tearFront.stroke({ width: 3.0 - openRatio * 1.4, color: 0xff4d94, alpha: 0.9 });
    tearFront.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) tearFront.lineTo(pts[i][0], pts[i][1]);
    tearFront.stroke({ width: 1.3, color: 0xffffff, alpha: 0.96 });

    // 空间玻璃碎裂菱片向四周崩散
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2 + seedOffset * 0.4;
      const dist = 10 + openRatio * (14 + (k % 3) * 6);
      const sx = cx + Math.cos(ang) * dist;
      const sy = cy + Math.sin(ang) * dist * 0.68;
      const sz = k % 2 === 0 ? 2.6 : 1.8;
      tearFront
        .poly([sx, sy - sz, sx + sz, sy, sx, sy + sz, sx - sz, sy], true)
        .fill({ color: k % 3 === 0 ? 0xffffff : k % 2 === 0 ? 0xff5296 : 0xb366ff, alpha: 0.88 * Math.max(0.25, openRatio) });
    }
  };

  try {
    const startRiftY = startCenter.y - 16;
    const endRiftY = endCenter.y - 16;
    setNodeAnim(node, 'move', 12, true);

    // ===== 第一幕：起点劈裂空间 → 撕开深渊裂口 → 魔王吸入消失 → 裂口闭合 =====
    soundEngine.playAtStageX('spell_lightning', startCenter.x, VIRTUAL_WIDTH, { volume: 0.62 });
    soundEngine.playAtStageX('spell_orb', startCenter.x, VIRTUAL_WIDTH, { volume: 0.82 });
    ctx.triggerImpactJuice(2.2, 0);
    ctx.fxBridge.spawnEffect('abyss_gap_rift', startCenter.x, startRiftY + 4, {
      paletteKey: 'scarlet_moon',
      light: 1.65,
      speedScale: 1.5,
      maxDuration: 0.95,
    });

    // 裂痕劈开与张口
    for (let s = 1; s <= 5; s++) {
      const t = s / 5;
      drawRiftPortal(startCenter.x, startRiftY, t, Math.min(1, t * 1.4), s * 0.6);
      node.offsetY = -t * 4;
      node.container.position.set(node.baseX, node.baseY + node.offsetY);
      await sleep(16);
    }
    // 魔王身形沿水平压缩吸入深渊裂口
    for (let s = 1; s <= 6; s++) {
      const t = s / 6;
      drawRiftPortal(startCenter.x, startRiftY, 1 - t * 0.72, 1 - t * 0.5, 3 + s * 0.5);
      node.container.scale.set(Math.max(0.08, 1 - t * 0.92), 1 + t * 0.18);
      node.container.alpha = Math.max(0, 1 - t * 1.1);
      node.badgeContainer.alpha = Math.max(0, 0.96 * (1 - t * 1.2));
      node.offsetY = -4 - t * 6;
      node.container.position.set(node.baseX, node.baseY + node.offsetY);
      await sleep(18);
    }

    // ===== 第二幕：起终点之间短暂闪现空间折跃锯齿裂痕 =====
    tearBack.clear();
    tearFront.clear();
    const midSegs = 8;
    const vx = endCenter.x - startCenter.x;
    const vy = endRiftY - startRiftY;
    const vLen = Math.max(1, Math.hypot(vx, vy));
    const pnx = -vy / vLen;
    const pny = vx / vLen;
    const bridgePts: Array<[number, number]> = [];
    for (let i = 0; i <= midSegs; i++) {
      const u = i / midSegs;
      const jig = i === 0 || i === midSegs ? 0 : Math.sin(i * 3.7) * 7.5;
      bridgePts.push([startCenter.x + vx * u + pnx * jig, startRiftY + vy * u + pny * jig]);
    }
    tearFront.moveTo(bridgePts[0][0], bridgePts[0][1]);
    for (let i = 1; i < bridgePts.length; i++) tearFront.lineTo(bridgePts[i][0], bridgePts[i][1]);
    tearFront.stroke({ width: 3.2, color: 0xc238ff, alpha: 0.78 });
    tearFront.moveTo(bridgePts[0][0], bridgePts[0][1]);
    for (let i = 1; i < bridgePts.length; i++) tearFront.lineTo(bridgePts[i][0], bridgePts[i][1]);
    tearFront.stroke({ width: 1.2, color: 0xffffff, alpha: 0.95 });
    await sleep(55);

    // ===== 第三幕：终点凭空撕裂空间 → 魔王展开身形降临 → 裂口优雅收合 =====
    node.baseX = endCenter.x;
    node.baseY = endCenter.y + 4;
    node.container.zIndex = Math.round(node.baseY);

    soundEngine.playAtStageX('spell_lightning', endCenter.x, VIRTUAL_WIDTH, { volume: 0.55 });
    soundEngine.playAtStageX('spell_buff', endCenter.x, VIRTUAL_WIDTH, { volume: 0.8 });
    ctx.triggerImpactJuice(2.6, 0);
    ctx.fxBridge.spawnEffect('abyss_gap_rift', endCenter.x, endRiftY + 4, {
      paletteKey: 'gap_violet',
      light: 1.7,
      speedScale: 1.45,
      maxDuration: 0.95,
    });

    // 终点裂隙骤然劈开
    for (let s = 1; s <= 4; s++) {
      const t = s / 4;
      drawRiftPortal(endCenter.x, endRiftY, t, Math.min(1, t * 1.5), 8 + s * 0.6);
      await sleep(16);
    }
    // 魔王自深渊空间裂隙展开踏出
    for (let s = 1; s <= 6; s++) {
      const t = s / 6;
      drawRiftPortal(endCenter.x, endRiftY, 1 - t * 0.25, 1, 11 + s * 0.5);
      node.container.scale.set(0.1 + t * 0.9, 1.15 - t * 0.15);
      node.container.alpha = Math.min(1, t * 1.15);
      node.badgeContainer.alpha = Math.min(0.96, t);
      node.offsetY = -(1 - t) * 7;
      node.container.position.set(node.baseX, node.baseY + node.offsetY);
      await sleep(18);
    }
    // 背后深渊空间裂缝迅速拉拢闭合消散
    for (let s = 1; s <= 4; s++) {
      const t = s / 4;
      drawRiftPortal(endCenter.x, endRiftY, Math.max(0, 0.75 * (1 - t)), 1 - t * 0.85, 16 + s * 0.4);
      await sleep(15);
    }
  } finally {
    node.container.scale.set(1, 1);
    node.container.alpha = 1;
    node.badgeContainer.alpha = 0.96;
    node.offsetY = 0;
    node.container.position.set(node.baseX, node.baseY);
    tearBack.destroy();
    tearFront.destroy();
  }
}

/** 驱动单位沿路径执行瞬移、飞行或陆地步进演出 */
export async function animateUnitMove(
  ctx: StageAnimationContext,
  unitId: string,
  path: HexCoord[],
): Promise<void> {
  const node = ctx.unitNodes.get(unitId);
  const state = ctx.getCurrentState();
  if (!node || !state || path.length <= 1) return;

  // 切换至迈步奔跑/振翅冲刺动作帧！
  const startCenter = getFootprintCenterPixel(path[0], node.footprint, state.tiles);
  const endCenter = getFootprintCenterPixel(path[path.length - 1], node.footprint, state.tiles);
  if (Math.abs(endCenter.x - startCenter.x) > 2) {
    node.facing = endCenter.x >= startCenter.x ? 'right' : 'left';
  }

  const bp = node.blueprintId;
  const isVampireBatFlight = !node.isHero && bp === 'creature_crimson_vampire';
  const isWraithOrbFlight = !node.isHero && bp === 'creature_wraith_spirit';
  const isWingFlapFlight =
    !node.isHero &&
    (bp === 'creature_koakuma_imp' ||
      bp === 'creature_hell_raven' ||
      bp === 'creature_bone_dragon' ||
      bp === 'creature_hakurei_seraph');

  const moveFps = isVampireBatFlight
    ? 15
    : isWraithOrbFlight
      ? 14
      : bp === 'creature_bone_dragon'
        ? 12.5
        : isWingFlapFlight
          ? 14
          : 11;
  setNodeAnim(node, 'move', moveFps, true);

  try {
    // 有限距离瞬移（Teleport）与魔王深渊全图瞬移（Global Teleport）：魔王触发专属三段式「撕裂空间瞬移」！
    if (state.units[unitId]?.abilities.teleport || state.units[unitId]?.abilities.globalTeleport) {
      const isAbyssTp = Boolean(state.units[unitId]?.abilities.globalTeleport);
      if (isAbyssTp) {
        await animateAbyssSpaceTearTeleport(ctx, node, startCenter, endCenter);
        return;
      }
      soundEngine.playAtStageX('spell_orb', startCenter.x, VIRTUAL_WIDTH, { volume: 0.88 });
      ctx.fxBridge.spawnEffect('blink_out', startCenter.x, startCenter.y - 10, {
        paletteKey: 'order_lunar',
        light: 1.5,
        speedScale: 1.65,
        maxDuration: 0.75,
      });
      for (let s = 1; s <= 5; s++) {
        const t = s / 5;
        node.container.alpha = Math.max(0, 1 - t);
        node.offsetY = -t * 5;
        node.container.position.set(node.baseX, node.baseY + node.offsetY);
        await sleep(18);
      }

      node.baseX = endCenter.x;
      node.baseY = endCenter.y + 4;
      node.offsetY = -5;
      node.container.position.set(node.baseX, node.baseY + node.offsetY);
      node.container.zIndex = Math.round(node.baseY);

      soundEngine.playAtStageX('spell_buff', endCenter.x, VIRTUAL_WIDTH, { volume: 0.76 });
      ctx.fxBridge.spawnEffect('blink_in', endCenter.x, endCenter.y - 10, {
        paletteKey: 'order_lunar',
        light: 1.55,
        speedScale: 1.65,
        maxDuration: 0.8,
      });
      for (let s = 1; s <= 5; s++) {
        const t = s / 5;
        node.container.alpha = Math.min(1, t);
        node.offsetY = -(1 - t) * 5;
        node.container.position.set(node.baseX, node.baseY + node.offsetY);
        await sleep(18);
      }
      node.container.alpha = 1;
      node.offsetY = 0;
      node.container.position.set(node.baseX, node.baseY);
      return;
    }

    // HoMM4 飞行单位演出：英雄保持默认曲线不变；死亡阵营飞行兵种启用专属化蝠 / 化灵 / 扑翼演出！
    if (node.isFloating) {
      const dist = Math.hypot(endCenter.x - startCenter.x, endCenter.y - startCenter.y);
      const flightSteps = Math.max(14, Math.min(28, Math.round(dist / 8)));
      const peakHeight = isWraithOrbFlight
        ? Math.min(24, 12 + dist * 0.05)
        : Math.min(34, 16 + dist * 0.08);

      soundEngine.playAtStageX('move_fly_whoosh', startCenter.x, VIRTUAL_WIDTH);

      if (isVampireBatFlight) {
        // 血族眷属起飞化蝠：猩红血雾与蝙蝠雾散爆发掩护人形→猩红大血蝠变身！
        ctx.fxBridge.spawnEffect('vampiric_claw_burst', startCenter.x, startCenter.y - 12, {
          paletteKey: 'crimson_blood',
          light: 1.55,
          speedScale: 1.75,
          maxDuration: 0.55,
        });
        await sleep(40);
      } else if (isWraithOrbFlight) {
        // 怨灵起飞化灵团：幽蓝灵雾聚敛化作流光灵团！
        ctx.fxBridge.spawnEffect('wisp', startCenter.x, startCenter.y - 12, {
          paletteKey: 'death_nether',
          light: 1.5,
          speedScale: 1.65,
          maxDuration: 0.55,
        });
      } else if (isWingFlapFlight) {
        // 小恶魔 / 地狱鸦 / 骨龙 / 神使振翅起飞：专属色羽风气流微爆！
        const flapPalette =
          bp === 'creature_hell_raven'
            ? TOUHOU_PALETTES.hell_inferno
            : bp === 'creature_bone_dragon'
              ? TOUHOU_PALETTES.black_void
              : bp === 'creature_hakurei_seraph'
                ? TOUHOU_PALETTES.shrine_gold
                : TOUHOU_PALETTES.gap_violet;
        ctx.fxBridge.spawn('mana_burst', startCenter.x, startCenter.y - 6, {
          palette: flapPalette,
          maxDuration: 0.48,
        });
      } else {
        // 英雄（含蕾米莉亚）与其他飞行单位保持原版默认飞行起飞特效不变
        ctx.fxBridge.spawn('mana_burst', startCenter.x, startCenter.y - 6, {
          palette: TOUHOU_PALETTES.graze_cyan,
          maxDuration: 0.45,
        });
      }

      for (let s = 1; s <= flightSteps; s++) {
        const t = s / flightSteps;
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const baseAlt = Math.sin(t * Math.PI) * peakHeight;
        // 扑腾翅膀加振翅拍击脉冲起伏；灵团加柔和双波浪漂浮起伏；英雄保持平滑弧线
        const extraWave = isWingFlapFlight
          ? Math.sin(t * Math.PI * 5) * 2.4
          : isWraithOrbFlight
            ? Math.sin(t * Math.PI * 3.5) * 3.2
            : isVampireBatFlight
              ? Math.sin(t * Math.PI * 4.5) * 2.6
              : 0;
        const altitude = Math.max(0, baseAlt + extraWave * Math.sin(t * Math.PI));

        node.baseX = startCenter.x + (endCenter.x - startCenter.x) * ease;
        node.baseY = startCenter.y + (endCenter.y - startCenter.y) * ease + 4;
        node.offsetY = -altitude;
        node.shadow.position.set(0, altitude);
        const shadowBase = node.isIllusion ? 0.24 : isWraithOrbFlight ? 0.34 : 0.65;
        node.shadow.alpha = Math.max(0.1, shadowBase - (altitude / 45) * 0.35);
        node.container.position.set(node.baseX, node.baseY + node.offsetY);
        node.container.zIndex = Math.round(node.baseY + 260);

        // 飞行途中播撒轻盈的专属轨迹残影微粒（血蝠血雾 / 怨灵灵尘 / 地狱鸦火星）
        if (s % 6 === 3 && s < flightSteps - 2) {
          if (isVampireBatFlight) {
            ctx.fxBridge.spawnEffect('hit_spark', node.baseX, node.baseY - altitude - 10, {
              paletteKey: 'crimson_blood',
              light: 1.2,
              speedScale: 1.7,
              maxDuration: 0.38,
            });
          } else if (isWraithOrbFlight) {
            ctx.fxBridge.spawnEffect('wisp', node.baseX, node.baseY - altitude - 10, {
              paletteKey: 'abyss_frost',
              light: 1.2,
              speedScale: 1.8,
              maxDuration: 0.42,
            });
          } else if (bp === 'creature_hell_raven') {
            ctx.fxBridge.spawnEffect('hit_spark', node.baseX, node.baseY - altitude - 10, {
              paletteKey: 'hell_inferno',
              light: 1.15,
              speedScale: 1.8,
              maxDuration: 0.36,
            });
          } else if (bp === 'creature_hakurei_seraph') {
            ctx.fxBridge.spawnEffect('feather_burst', node.baseX, node.baseY - altitude - 10, {
              paletteKey: 'shrine_gold',
              light: 1.25,
              speedScale: 1.65,
              maxDuration: 0.42,
            });
          }
        }

        await sleep(16);
      }

      // 落地还形转场：血蝠血雾爆散恢复血族少女 / 灵团幽蓝舒展恢复怨灵少女！
      if (isVampireBatFlight) {
        ctx.fxBridge.spawnEffect('vampiric_claw_burst', endCenter.x, endCenter.y - 12, {
          paletteKey: 'scarlet_moon',
          light: 1.5,
          speedScale: 1.7,
          maxDuration: 0.55,
        });
      } else if (isWraithOrbFlight) {
        ctx.fxBridge.spawnEffect('soul_rise', endCenter.x, endCenter.y - 10, {
          paletteKey: 'abyss_frost',
          light: 1.4,
          speedScale: 1.65,
          maxDuration: 0.55,
        });
      }

      node.offsetY = 0;
      node.shadow.position.set(0, 0);
      node.shadow.alpha = node.isIllusion ? 0.24 : 1;
      node.container.zIndex = Math.round(node.baseY);
      return;
    }

    // 陆地单位：配合 4 帧交替迈步动画平滑前进，按体型播放轻步或巨像沉步音效
    const isHeavyFoot = node.footprint === '2x2';
    for (let i = 1; i < path.length; i++) {
      const fromPos = getFootprintCenterPixel(path[i - 1], node.footprint, state.tiles);
      const toPos = getFootprintCenterPixel(path[i], node.footprint, state.tiles);
      if (Math.abs(toPos.x - fromPos.x) > 1) {
        node.facing = toPos.x >= fromPos.x ? 'right' : 'left';
      }
      soundEngine.playAtStageX(
        isHeavyFoot ? 'move_step_heavy' : 'move_step_light',
        toPos.x,
        VIRTUAL_WIDTH,
      );

      const steps = 8;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const stepBounce = Math.sin(t * Math.PI) * 2.5;
        node.baseX = fromPos.x + (toPos.x - fromPos.x) * t;
        node.baseY = fromPos.y + (toPos.y - fromPos.y) * t + 4;
        node.offsetY = -stepBounce;
        node.container.position.set(node.baseX, node.baseY + node.offsetY);
        node.container.zIndex = Math.round(node.baseY);
        await sleep(16);
      }
      node.offsetY = 0;
    }
  } finally {
    setNodeAnim(node, 'idle', 6.5, true);
  }
}

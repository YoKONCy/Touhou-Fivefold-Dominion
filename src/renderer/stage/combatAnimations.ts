/**
 * 近战与远程交锋、同时反击、连击、格挡与异常命中反馈演出子系统
 */

import { soundEngine } from '@audio/index';
import type { CombatEvent } from '@core/types';
import { resolveUnitRangedProjectile } from '../rangedProjectileFx';
import { sleep } from './geometry';
import { VIRTUAL_WIDTH, type StageAnimationContext, type UnitVisualNode } from './types';
import { setNodeAnim } from './unitNodeRenderer';

/** 播放 COMBAT_EXCHANGE 战斗交锋演出（支持 H4 同时反击、先攻顺序结算、双重追击与全兵种专属打击特效） */
export async function animateCombatExchange(
  ctx: StageAnimationContext,
  ev: Extract<CombatEvent, { type: 'COMBAT_EXCHANGE' }>,
): Promise<void> {
  const atkNode = ctx.unitNodes.get(ev.attackerId);
  const defNode = ctx.unitNodes.get(ev.defenderId);
  if (!atkNode || !defNode) return;
  // 若触发远程反击前卫替伤，反击弹道与受击反馈均指向实际替伤前卫单位
  const retTargetNode =
    (ev.retaliationTargetId ? ctx.unitNodes.get(ev.retaliationTargetId) : undefined) ?? atkNode;

  const dx = defNode.baseX - atkNode.baseX;
  const dy = defNode.baseY - atkNode.baseY;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = dx / len;
  const ny = dy / len;

  // 交锋双方正面对峙朝向
  atkNode.facing = dx >= 0 ? 'right' : 'left';
  defNode.facing = dx >= 0 ? 'left' : 'right';

  const triggerHitFeedback = (
    targetNode: UnitVisualNode,
    strike: NonNullable<typeof ev.attackerStrike>,
    fromNode: UnitVisualNode,
  ) => {
    // shield-block 穹顶默认朝右（+X），需迎向来袭攻击者方向：攻击方位于受击者左侧时水平翻转朝左
    const shieldFlip =
      fromNode.baseX !== targetNode.baseX
        ? fromNode.baseX < targetNode.baseX
        : targetNode.facing === 'left';

    // 远程反击被前卫挡箭替伤时，在替伤友军头顶呈现清晰的挡箭光环与飘字
    if (strike.interceptedByUnitId) {
      if (!strike.blocked) {
        ctx.fxBridge.spawn('graze_shield', targetNode.baseX, targetNode.baseY - 12, { flip: shieldFlip });
      }
      ctx.spawnFloatingText(
        targetNode.baseX,
        targetNode.baseY - 44 * targetNode.spriteScale,
        '前卫替伤!',
        '#7ef0d4',
      );
    }

    // H4 绝对格挡（Block）：铁盾抵御零伤演出！
    if (strike.blocked) {
      soundEngine.playAtStageX('stance_defend', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.05 });
      ctx.fxBridge.spawn('graze_shield', targetNode.baseX, targetNode.baseY - 12, { flip: shieldFlip });
      ctx.spawnFloatingText(
        targetNode.baseX,
        targetNode.baseY - 30 * targetNode.spriteScale,
        '绝对格挡!',
        '#ffe680',
      );
      return;
    }

    targetNode.flashTimer = 0.22;
    setNodeAnim(targetNode, 'hit', 9, false);
    const angle = Math.atan2(targetNode.baseY - fromNode.baseY, targetNode.baseX - fromNode.baseX);
    if (strike.grazed) {
      soundEngine.playAtStageX('graze_tick', targetNode.baseX, VIRTUAL_WIDTH);
      ctx.fxBridge.spawn('graze_shield', targetNode.baseX, targetNode.baseY - 12, { flip: shieldFlip });
      ctx.spawnFloatingText(targetNode.baseX, targetNode.baseY - 34, `GRAZE! +${strike.grazeManaGain}MP`, '#7ae8ff');
    } else if (strike.luckyCrit) {
      soundEngine.playAtStageX('hit_crit', targetNode.baseX, VIRTUAL_WIDTH);
      ctx.fxBridge.spawn('crit_hit', targetNode.baseX, targetNode.baseY - 12);
      ctx.spawnFloatingText(targetNode.baseX, targetNode.baseY - 36 * targetNode.spriteScale, '幸运暴击!', '#ffe45e');
    } else if (strike.unluckyHit) {
      soundEngine.playAtStageX('spell_debuff', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.7 });
      ctx.fxBridge.spawn('hit_spark', targetNode.baseX, targetNode.baseY - 12, { angle });
      ctx.spawnFloatingText(targetNode.baseX, targetNode.baseY - 36 * targetNode.spriteScale, '厄运 ×0.5', '#c299ff');
    } else if (strike.isRanged) {
      const fromUnit = ctx.getCurrentState()?.units[fromNode.unitId];
      const proj = resolveUnitRangedProjectile(fromUnit?.defId, fromNode.blueprintId);
      soundEngine.playAtStageX(
        proj.kind === 'explosive_shell' ? 'spell_aoe' : 'hit_impact',
        targetNode.baseX,
        VIRTUAL_WIDTH,
        { volume: proj.kind === 'explosive_shell' ? 0.95 : 0.88 },
      );
      ctx.fxBridge.spawnEffect(proj.impactFx, targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: proj.impactPalette,
        angle,
        flip: fromNode.baseX > targetNode.baseX,
        light: proj.impactLight,
        speedScale: proj.kind === 'arrow' ? 1.55 : 1.4,
        maxDuration: proj.kind === 'explosive_shell' ? 0.95 : 0.8,
      });
      if (proj.kind === 'explosive_shell') {
        ctx.triggerImpactJuice(3.8, 0.04);
      }
    } else if (fromNode.blueprintId === 'creature_komainu') {
      // 镇守狛犬专属破魔神爪撕裂特效（三道翠金爪痕！）
      soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.08 });
      ctx.fxBridge.spawnEffect('claw_swipe', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'spring_dew',
        flip: fromNode.baseX > targetNode.baseX,
        light: 1.55,
        speedScale: 1.35,
        maxDuration: 0.9,
      });
    } else if (fromNode.blueprintId === 'creature_efreet') {
      // 法界之火专属魔界紫金灵火爆裂特效
      soundEngine.playAtStageX('spell_aoe', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.8 });
      ctx.fxBridge.spawnEffect('spirit_flame', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'calamity_rose',
        light: 1.55,
        speedScale: 1.4,
        maxDuration: 0.9,
      });
    } else if (fromNode.blueprintId === 'creature_nightmare') {
      // 梦境兽专属幻梦紫红震慑涟漪特效
      soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.0 });
      ctx.fxBridge.spawnEffect('dark_explosion', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'gap_violet',
        light: 1.45,
        speedScale: 1.45,
        maxDuration: 0.9,
      });
    } else if (fromNode.blueprintId === 'hero_remilia') {
      // 蕾米莉亚近战专属绯红冈格尼尔血芒穿刺
      soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.05 });
      ctx.fxBridge.spawnEffect('vampiric_claw_burst', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'scarlet_moon',
        light: 1.55,
        speedScale: 1.4,
        maxDuration: 0.9,
      });
    } else if (fromNode.blueprintId === 'creature_crimson_vampire') {
      // 血族眷属专属徒手猩红血爪撕裂 + 血蝠群汲取特效！
      soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.0 });
      ctx.fxBridge.spawnEffect('vampiric_claw_burst', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'crimson_blood',
        light: 1.55,
        speedScale: 1.35,
        maxDuration: 1.0,
      });
    } else if (fromNode.blueprintId === 'creature_abyss_gap_devil') {
      // 深渊隙间恶魔专属绯金月镰空间斩裂！
      soundEngine.playAtStageX('attack_melee_heavy', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.05 });
      ctx.fxBridge.spawnEffect('scythe_reap', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'scarlet_moon',
        flip: fromNode.baseX > targetNode.baseX,
        light: 1.6,
        speedScale: 1.35,
        maxDuration: 0.95,
      });
    } else if (fromNode.blueprintId === 'creature_bone_dragon') {
      // 骸骨巨龙专属冥界亡灵骨焰咆哮！
      soundEngine.playAtStageX('attack_melee_heavy', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.08 });
      ctx.fxBridge.spawnEffect('necro_skulls', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'death_nether',
        light: 1.55,
        speedScale: 1.35,
        maxDuration: 0.95,
      });
    } else if (fromNode.blueprintId === 'creature_abyss_ice_demon') {
      // 深渊冰魔专属冰晶棱刺寒霜爆裂
      soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.95 });
      ctx.fxBridge.spawnEffect('ice_shatter', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'abyss_frost',
        light: 1.5,
        speedScale: 1.4,
        maxDuration: 0.9,
      });
    } else if (fromNode.blueprintId === 'creature_hell_raven') {
      // 地狱鸦专属炽红炎羽三爪撕裂
      soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.98 });
      ctx.fxBridge.spawnEffect('claw_swipe', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'hell_inferno',
        flip: fromNode.baseX > targetNode.baseX,
        light: 1.5,
        speedScale: 1.4,
        maxDuration: 0.85,
      });
    } else if (fromNode.blueprintId === 'creature_wraith_spirit') {
      // 怨灵专属苍紫幽魂噬心
      soundEngine.playAtStageX('spell_debuff', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.9 });
      ctx.fxBridge.spawnEffect('soul_drain', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'death_nether',
        light: 1.45,
        speedScale: 1.45,
        maxDuration: 0.9,
      });
    } else if (fromNode.blueprintId === 'creature_corpse_husk') {
      // 尸壳专属幽青冥铁骨刃斩击
      soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.95 });
      ctx.fxBridge.spawnEffect('sword_slash', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: 'death_nether',
        flip: fromNode.baseX > targetNode.baseX,
        light: 1.4,
        speedScale: 1.4,
        maxDuration: 0.85,
      });
    } else if (fromNode.blueprintId === 'creature_exorcist_blade' || fromNode.blueprintId === 'creature_combat_mk2') {
      // 退魔剑士 / 河童战斗 II 型专属连刃十字双斩
      soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH, { volume: 1.0 });
      ctx.fxBridge.spawnEffect('double_slash', targetNode.baseX, targetNode.baseY - 12, {
        paletteKey: fromNode.blueprintId === 'creature_combat_mk2' ? 'celestial_jade' : 'order_lunar',
        flip: fromNode.baseX > targetNode.baseX,
        light: 1.5,
        speedScale: 1.4,
        maxDuration: 0.9,
      });
    } else {
      soundEngine.playAtStageX('hit_impact', targetNode.baseX, VIRTUAL_WIDTH);
      ctx.fxBridge.spawn('melee_slash', targetNode.baseX, targetNode.baseY - 12, {
        flip: fromNode.baseX > targetNode.baseX,
      });
    }

    // 防守方幸运护身 / 厄运破防独立光环反馈
    if (strike.defenderLucky) {
      ctx.fxBridge.spawnEffect('halo', targetNode.baseX, targetNode.baseY - 14, {
        paletteKey: 'spring_dew',
        light: 1.35,
        speedScale: 1.5,
        maxDuration: 0.8,
      });
      ctx.spawnFloatingText(
        targetNode.baseX,
        targetNode.baseY - 46 * targetNode.spriteScale,
        '幸运护身!',
        '#8cf5b4',
      );
    } else if (strike.defenderUnlucky) {
      ctx.spawnFloatingText(
        targetNode.baseX,
        targetNode.baseY - 46 * targetNode.spriteScale,
        '厄运破防!',
        '#ff8099',
      );
    }

    // 原版 HoMM4 双行图标受击飘字：-XX ♥（伤害） + -N ☠（兵力折损）
    const dmgColor = strike.grazed
      ? '#9ae8ff'
      : strike.defenderLucky
        ? '#8cf5b4'
        : strike.luckyCrit
          ? '#ffe45e'
          : strike.unluckyHit
            ? '#c299ff'
            : '#ff6b7a';
    const prefix = strike.grazed
      ? '擦弹 '
      : strike.luckyCrit
        ? '暴击 '
        : strike.unluckyHit
          ? '厄运 '
          : '';
    ctx.spawnFloatingText(
      targetNode.baseX,
      targetNode.baseY - 30 * targetNode.spriteScale,
      `${prefix}-${strike.damage} ♥`,
      dmgColor,
    );
    if (!targetNode.isHero) {
      ctx.spawnFloatingText(
        targetNode.baseX,
        targetNode.baseY - 18 * targetNode.spriteScale,
        `-${strike.kills} ☠`,
        strike.kills > 0 ? '#ffd875' : '#9fb0d4',
      );
    }

    // 魔眼石化 / 定身 / 震慑附加特效反馈
    if (strike.petrifyKills && strike.petrifyKills > 0) {
      soundEngine.playAtStageX('spell_debuff', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.8 });
      ctx.spawnFloatingText(
        targetNode.baseX,
        targetNode.baseY - 42 * targetNode.spriteScale,
        `魔眼石化 -${strike.petrifyKills}!`,
        '#d999ff',
      );
    }
    if (strike.appliedStatus) {
      // 为五类命中附带异常状态触发各自专属的精致视觉特效！
      if (strike.appliedStatus === 'frozen') {
        ctx.fxBridge.spawnEffect('frost_prison_shatter', targetNode.baseX, targetNode.baseY - 10, {
          paletteKey: 'abyss_frost',
          light: 1.55,
          speedScale: 1.35,
          maxDuration: 1.15,
        });
      } else if (strike.appliedStatus === 'aged') {
        ctx.fxBridge.spawnEffect('wither_hourglass', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'death_nether',
          light: 1.45,
          speedScale: 1.35,
          maxDuration: 1.1,
        });
      } else if (strike.appliedStatus === 'poisoned') {
        if (strike.poisonInstantDamage && strike.poisonInstantDamage > 0) {
          soundEngine.playAtStageX('spell_debuff', targetNode.baseX, VIRTUAL_WIDTH, { volume: 0.55 });
        }
        ctx.fxBridge.spawnEffect('status_poisoned', targetNode.baseX, targetNode.baseY - 10, {
          paletteKey: 'suzuran_venom',
          light: 1.5,
          speedScale: 1.4,
          maxDuration: 1.1,
        });
      } else if (strike.appliedStatus === 'terrified') {
        ctx.fxBridge.spawnEffect('eyeball', targetNode.baseX, targetNode.baseY - 16, {
          paletteKey: 'madness_eye',
          light: 1.45,
          speedScale: 1.4,
          maxDuration: 0.95,
        });
      } else {
        ctx.fxBridge.spawnEffect('ofuda_seal_ring', targetNode.baseX, targetNode.baseY - 12, {
          paletteKey: 'shrine_gold',
          light: 1.45,
          speedScale: 1.45,
          maxDuration: 1.0,
        });
      }
      const stLabel =
        strike.appliedStatus === 'terrified'
          ? '噩梦震慑!'
          : strike.appliedStatus === 'frozen'
            ? '寒霜冰封!'
            : strike.appliedStatus === 'aged'
              ? '衰老凋零!'
              : strike.appliedStatus === 'poisoned'
                ? strike.poisonInstantDamage && strike.poisonInstantDamage > 0
                  ? `剧毒 -${strike.poisonInstantDamage}♥${!targetNode.isHero && (strike.poisonInstantKills ?? 0) > 0 ? ` (-${strike.poisonInstantKills}☠)` : ''}`
                  : '剧毒侵蚀!'
                : '符箓定身!';
      const stColor =
        strike.appliedStatus === 'terrified'
          ? '#ff6699'
          : strike.appliedStatus === 'frozen'
            ? '#80ebff'
            : strike.appliedStatus === 'aged'
              ? '#c89eff'
              : strike.appliedStatus === 'poisoned'
                ? '#82ff78'
                : '#ffe680';
      ctx.spawnFloatingText(
        targetNode.baseX,
        targetNode.baseY - 42 * targetNode.spriteScale,
        stLabel,
        stColor,
      );
    }

    // 伴生次级命中演出：周身全扫 / 龙息贯穿 / 烈焰护盾反灼！
    if (strike.secondaryHits && strike.secondaryHits.length > 0) {
      for (const sub of strike.secondaryHits) {
        const subNode = ctx.unitNodes.get(sub.targetId);
        if (!subNode) continue;
        if (sub.blocked) {
          const subShieldFlip =
            fromNode.baseX !== subNode.baseX
              ? fromNode.baseX < subNode.baseX
              : subNode.facing === 'left';
          soundEngine.playAtStageX('stance_defend', subNode.baseX, VIRTUAL_WIDTH, { volume: 0.85 });
          ctx.fxBridge.spawn('graze_shield', subNode.baseX, subNode.baseY - 12, { flip: subShieldFlip });
          ctx.spawnFloatingText(subNode.baseX, subNode.baseY - 28 * subNode.spriteScale, '格挡!', '#ffe680');
          continue;
        }
        subNode.flashTimer = 0.2;
        setNodeAnim(subNode, 'hit', 9, false);
        if (sub.kind === 'fire_shield') {
          soundEngine.playAtStageX('spell_aoe', subNode.baseX, VIRTUAL_WIDTH, { volume: 0.65 });
          ctx.fxBridge.spawnEffect('fire_ring', subNode.baseX, subNode.baseY - 10, {
            paletteKey: 'hell_inferno',
            light: 1.5,
            speedScale: 1.5,
            maxDuration: 0.85,
          });
          ctx.spawnFloatingText(
            subNode.baseX,
            subNode.baseY - 34 * subNode.spriteScale,
            `烈焰反伤 -${sub.damage}`,
            '#ff884d',
          );
        } else if (sub.kind === 'breath') {
          soundEngine.playAtStageX('spell_aoe', subNode.baseX, VIRTUAL_WIDTH, { volume: 0.85 });
          ctx.fxBridge.spawnEffect('fire_breath', subNode.baseX, subNode.baseY - 10, {
            paletteKey: 'phoenix_flame',
            light: 1.55,
            speedScale: 1.45,
            maxDuration: 0.9,
          });
          ctx.spawnFloatingText(
            subNode.baseX,
            subNode.baseY - 34 * subNode.spriteScale,
            `龙息贯穿 -${sub.damage}`,
            '#ff6633',
          );
        } else {
          ctx.fxBridge.spawnEffect(
            fromNode.blueprintId === 'creature_hell_raven' ? 'claw_swipe' : 'double_slash',
            subNode.baseX,
            subNode.baseY - 12,
            {
              paletteKey: fromNode.blueprintId === 'creature_hell_raven' ? 'hell_inferno' : 'reimu_crimson',
              light: 1.4,
              speedScale: 1.5,
              maxDuration: 0.8,
            },
          );
          ctx.spawnFloatingText(
            subNode.baseX,
            subNode.baseY - 32 * subNode.spriteScale,
            `横扫 -${sub.damage}`,
            '#ff9f5a',
          );
        }
        if (!subNode.isHero && sub.kills > 0) {
          ctx.spawnFloatingText(
            subNode.baseX,
            subNode.baseY - 20 * subNode.spriteScale,
            `-${sub.kills} ☠`,
            '#ffd875',
          );
        }
      }
    }
  };

  /** 若攻击方触发了「双重攻击」，衔接第二段追击动作（同时支持远程连射与近战连斩！）与飘字！ */
  const playDoubleStrikeFollowUp = async () => {
    const follow = ev.attackerStrike?.followUpStrike;
    if (!follow) return;
    const followRanged = Boolean(ev.attackerStrike?.isRanged);
    await sleep(90);
    setNodeAnim(atkNode, 'attack', 12, false);
    if (followRanged) {
      soundEngine.playAtStageX(ctx.getUnitRangedShotSound(atkNode), atkNode.baseX, VIRTUAL_WIDTH, { volume: 1.0 });
      const dur = ctx.spawnUnitRangedShot(atkNode, defNode);
      await sleep(Math.round(dur * 880));
    } else {
      soundEngine.playAtStageX('attack_melee_slash', atkNode.baseX, VIRTUAL_WIDTH, { volume: 1.05 });
      atkNode.offsetX = nx * 11;
      atkNode.offsetY = ny * 11;
      await sleep(95);
    }
    ctx.triggerImpactJuice(3.5, 0.06);
    if (follow.blocked) {
      const followShieldFlip =
        atkNode.baseX !== defNode.baseX
          ? atkNode.baseX < defNode.baseX
          : defNode.facing === 'left';
      soundEngine.playAtStageX('stance_defend', defNode.baseX, VIRTUAL_WIDTH);
      ctx.fxBridge.spawn('graze_shield', defNode.baseX, defNode.baseY - 12, { flip: followShieldFlip });
      ctx.spawnFloatingText(defNode.baseX, defNode.baseY - 34 * defNode.spriteScale, '二段格挡!', '#ffe680');
    } else {
      defNode.flashTimer = 0.22;
      setNodeAnim(defNode, 'hit', 9, false);
      if (followRanged) {
        const atkUnit = ctx.getCurrentState()?.units[atkNode.unitId];
        const proj = resolveUnitRangedProjectile(atkUnit?.defId, atkNode.blueprintId);
        const fAngle = Math.atan2(defNode.baseY - atkNode.baseY, defNode.baseX - atkNode.baseX);
        soundEngine.playAtStageX(proj.kind === 'explosive_shell' ? 'spell_aoe' : 'hit_impact', defNode.baseX, VIRTUAL_WIDTH, { volume: 1.0 });
        ctx.fxBridge.spawnEffect(proj.impactFx, defNode.baseX, defNode.baseY - 12, {
          paletteKey: proj.impactPalette,
          angle: fAngle,
          flip: atkNode.baseX > defNode.baseX,
          light: proj.impactLight,
          speedScale: 1.5,
          maxDuration: 0.8,
        });
      } else {
        soundEngine.playAtStageX('hit_impact', defNode.baseX, VIRTUAL_WIDTH, { volume: 1.08 });
        ctx.fxBridge.spawn('melee_slash', defNode.baseX, defNode.baseY - 12, { flip: atkNode.baseX <= defNode.baseX });
      }
      ctx.spawnFloatingText(
        defNode.baseX,
        defNode.baseY - 34 * defNode.spriteScale,
        `连击 -${follow.damage} ♥`,
        '#ffe478',
      );
      if (!defNode.isHero) {
        ctx.spawnFloatingText(
          defNode.baseX,
          defNode.baseY - 20 * defNode.spriteScale,
          `-${follow.kills} ☠`,
          follow.kills > 0 ? '#ffd875' : '#9fb0d4',
        );
      }
    }
    await sleep(160);
    atkNode.offsetX = 0;
    atkNode.offsetY = 0;
    setNodeAnim(atkNode, 'idle', 6.5, true);
    setNodeAnim(defNode, 'idle', 6.5, true);
  };

  const isRanged = Boolean(ev.attackerStrike?.isRanged || ev.defenderStrike?.isRanged);

  if (ev.mode === 'simultaneous') {
    // 【H4 同时反击视觉高光】：双方同步蓄力抬手 → 双向挥击/对射！
    const atkPounce = atkNode.blueprintId === 'creature_komainu' && !isRanged;
    const defPounce = defNode.blueprintId === 'creature_komainu' && !isRanged;
    setNodeAnim(atkNode, 'attack', 10, false);
    setNodeAnim(defNode, 'attack', 10, false);
    // 狛犬抬腿蓄力瞬间微微人立后仰起势！
    if (atkPounce) {
      atkNode.offsetX = -nx * 3;
      atkNode.offsetY = -4;
    }
    if (defPounce) {
      defNode.offsetX = nx * 3;
      defNode.offsetY = -4;
    }
    await sleep(110);

    if (isRanged) {
      soundEngine.playAtStageX(ctx.getUnitRangedShotSound(atkNode), atkNode.baseX, VIRTUAL_WIDTH);
      soundEngine.playAtStageX(ctx.getUnitRangedShotSound(defNode), defNode.baseX, VIRTUAL_WIDTH, { delay: 0.04 });
      const d1 = ctx.spawnUnitRangedShot(atkNode, defNode);
      const d2 = ctx.spawnUnitRangedShot(defNode, retTargetNode);
      await sleep(Math.round(Math.max(d1, d2) * 920));
    } else {
      const atkHeavy = atkNode.footprint === '2x2';
      soundEngine.playAtStageX(
        atkHeavy ? 'attack_melee_heavy' : 'attack_melee_slash',
        (atkNode.baseX + defNode.baseX) / 2,
        VIRTUAL_WIDTH,
      );
      atkNode.offsetX = nx * (atkPounce ? 14 : 9);
      atkNode.offsetY = ny * (atkPounce ? 14 : 9) - (atkPounce ? 4 : 0);
      defNode.offsetX = -nx * (defPounce ? 14 : 9);
      defNode.offsetY = -ny * (defPounce ? 14 : 9) - (defPounce ? 4 : 0);
      await sleep(110);
    }

    ctx.triggerImpactJuice(4.5, 0.08);
    soundEngine.playAtStageX('hit_simultaneous', (atkNode.baseX + defNode.baseX) / 2, VIRTUAL_WIDTH);
    if (ev.attackerStrike) triggerHitFeedback(defNode, ev.attackerStrike, atkNode);
    if (ev.defenderStrike) triggerHitFeedback(retTargetNode, ev.defenderStrike, defNode);
    ctx.spawnFloatingText(
      (atkNode.baseX + defNode.baseX) / 2,
      Math.min(atkNode.baseY, defNode.baseY) - 44,
      '同时反击!',
      '#f6d88b',
    );
    await sleep(190);
    atkNode.offsetX = 0;
    atkNode.offsetY = 0;
    defNode.offsetX = 0;
    defNode.offsetY = 0;
    setNodeAnim(atkNode, 'idle', 6.5, true);
    setNodeAnim(defNode, 'idle', 6.5, true);
    if (retTargetNode !== atkNode) {
      setNodeAnim(retTargetNode, 'idle', 6.5, true);
    }
    await playDoubleStrikeFollowUp();
    await sleep(160);
    return;
  }

  // 顺序结算：先攻或单向打击（清晰展现蓄力抬手 → 挥击/射击 → 对方受击后仰！）
  const ordered: Array<{
    from: UnitVisualNode;
    to: UnitVisualNode;
    strike: NonNullable<typeof ev.attackerStrike>;
  }> = [];
  if (ev.mode === 'defender_first') {
    if (ev.defenderStrike) ordered.push({ from: defNode, to: retTargetNode, strike: ev.defenderStrike });
    if (ev.attackerStrike) ordered.push({ from: atkNode, to: defNode, strike: ev.attackerStrike });
  } else {
    if (ev.attackerStrike) ordered.push({ from: atkNode, to: defNode, strike: ev.attackerStrike });
    if (ev.defenderStrike) ordered.push({ from: defNode, to: retTargetNode, strike: ev.defenderStrike });
  }

  for (const step of ordered) {
    step.from.facing = step.to.baseX >= step.from.baseX ? 'right' : 'left';
    const isKomainu = step.from.blueprintId === 'creature_komainu' && !step.strike.isRanged;
    const sdx = step.to.baseX - step.from.baseX;
    const sdy = step.to.baseY - step.from.baseY;
    const slen = Math.max(1, Math.hypot(sdx, sdy));
    setNodeAnim(step.from, 'attack', isKomainu ? 9.5 : 10, false);
    if (isKomainu) {
      // 镇守狛犬抬腿人立蓄力：微收后仰腾起，蓄满翡翠神威！
      step.from.offsetX = -(sdx / slen) * 4;
      step.from.offsetY = -5;
    }
    await sleep(isKomainu ? 130 : 115);

    if (step.strike.isRanged) {
      soundEngine.playAtStageX(ctx.getUnitRangedShotSound(step.from), step.from.baseX, VIRTUAL_WIDTH);
      const shotDur = ctx.spawnUnitRangedShot(step.from, step.to);
      await sleep(Math.round(shotDur * 900));
    } else {
      const heavy = step.from.footprint === '2x2';
      soundEngine.playAtStageX(heavy ? 'attack_melee_heavy' : 'attack_melee_slash', step.from.baseX, VIRTUAL_WIDTH);
      const isLongPoke = slen > 52;
      if (isKomainu) {
        // 镇守狛犬飞扑弧线：腾空跃扑前压，隔格攻击时纵跃扑袭并劈出裂空翡翠神爪！
        const lungeDist = isLongPoke ? 24 : 14;
        step.from.offsetX = (sdx / slen) * (lungeDist * 0.6);
        step.from.offsetY = (sdy / slen) * (lungeDist * 0.6) - 8;
        await sleep(60);
        step.from.offsetX = (sdx / slen) * lungeDist;
        step.from.offsetY = (sdy / slen) * lungeDist;
        if (isLongPoke) {
          ctx.fxBridge.spawnEffect('claw_swipe', (step.from.baseX + step.to.baseX) / 2, (step.from.baseY + step.to.baseY) / 2 - 14, {
            paletteKey: 'shrine_gold',
            flip: step.from.baseX > step.to.baseX,
            light: 1.45,
            speedScale: 1.4,
            maxDuration: 0.75,
          });
          ctx.spawnFloatingText(
            (step.from.baseX + step.to.baseX) / 2,
            Math.min(step.from.baseY, step.to.baseY) - 34,
            '神爪飞扑!',
            '#9effdf',
          );
        }
        await sleep(85);
      } else {
        const lungeDist = isLongPoke ? 16 : 10;
        step.from.offsetX = (sdx / slen) * lungeDist;
        step.from.offsetY = (sdy / slen) * lungeDist;
        if (isLongPoke) {
          ctx.spawnProjectile(step.from.baseX, step.from.baseY - 14, step.to.baseX, step.to.baseY - 14, 0x7ff2c9);
          ctx.spawnFloatingText(
            (step.from.baseX + step.to.baseX) / 2,
            Math.min(step.from.baseY, step.to.baseY) - 34,
            '长手突刺!',
            '#9effdf',
          );
        }
        await sleep(isLongPoke ? 135 : 95);
      }
    }

    ctx.triggerImpactJuice(3.2, 0.06);
    triggerHitFeedback(step.to, step.strike, step.from);
    await sleep(180);
    step.from.offsetX = 0;
    step.from.offsetY = 0;
    setNodeAnim(step.from, 'idle', 6.5, true);
    setNodeAnim(step.to, 'idle', 6.5, true);
    await sleep(130);
  }
  await playDoubleStrikeFollowUp();
}

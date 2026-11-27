/**
 * 《Touhou-H4》视觉特效 (PixelFX)、图标弹道与 HUD 元数据文案规范测试套件
 * 覆盖：150 法术手绘图标像素哈希防重、106+ PixelFX 模块与 148+ 法术 VFX 编排、
 * 五大远程弹道映射、AOE/群体特效零死循环与 Painter NaN 防护，以及全量三段式文案与语义分词校验。
 */

import { describe, expect, it } from 'vitest';
import { clearFrame, composite, createFrame, createFx, painterFor } from 'pixelfx';
import { ALIGNMENT_META } from '@core/alignment';
import { dispatchCombatCommand } from '@core/combatEngine';
import {
  H4_ADVANCED_CLASSES,
  H4_BASE_CLASSES,
  SECONDARY_SKILL_META,
  SKILL_TREE_META,
} from '@core/h4Skills';
import { createReimuVsMarisaBattle, TOUHOU_CATALOG } from '@data/battlePresets';
import { SPELL_CARD_COPY_CATALOG, SPELL_COPY_CATALOG } from '@data/spellCopy';
import {
  blendSanitizedScratchIntoFrame,
  installPixelFxPainterSafetyGuards,
  MODULE_POST_PROCESS_RULES,
  PIXELFX_MODULES,
  SILENT_PIXELFX_ACTOR,
  TOUHOU_PALETTES,
} from '@renderer/pixelfxBridge';
import { resolveUnitRangedProjectile } from '@renderer/rangedProjectileFx';
import {
  ALL_SPELL_ICON_IDS,
  computeSpellIconPixelHash,
  getSpellIconPixels,
  SPELL_ICON_DRAWERS,
} from '@renderer/spellIcons';
import { ALL_SPELL_VFX_IDS, SPELL_VFX_CATALOG } from '@renderer/spellVfxCatalog';
import { TOUHOU_WEATHER_FX_SET } from '@renderer/touhouCustomFx';
import {
  buildHeroEquipmentSlots,
  buildHeroTraitBadges,
  buildSpellCardTooltipPayload,
  buildSpellTooltipPayload,
  buildUnitSpecialtyBadges,
  buildUnitStatusBadges,
  PRIMARY_SKILL_META,
} from '@ui/hudMetadata';
import {
  ALL_SPELL_POLARITIES,
  classifySpellPolarity,
  getUnitHeaderCreatureTags,
  SPELL_POLARITY_META,
  tokenizeSemanticText,
} from '@ui/semanticFormat';

describe('PixelFX 视觉特效、手绘法术图标、远程弹道与安全守卫', () => {
  it('全部 150 个法术应具备一对一专属 24×24 手绘像素图标且像素哈希 100% 零重复撞脸', () => {
    const allRegisteredIds = Object.keys(TOUHOU_CATALOG.spells);
    expect(allRegisteredIds).toHaveLength(150);
    expect(ALL_SPELL_ICON_IDS).toHaveLength(150);

    const hashToSpellId = new Map<string, string>();
    const collisions: Array<[string, string]> = [];

    for (const id of allRegisteredIds) {
      expect(SPELL_ICON_DRAWERS[id], `缺少法术专属图标绘制函数: ${id}`).toBeDefined();
      const pixels = getSpellIconPixels(id);
      expect(pixels, `法术图标光栅化失败: ${id}`).not.toBeNull();
      expect(pixels!.length).toBe(24 * 24 * 4);

      const hash = computeSpellIconPixelHash(id)!;
      const existing = hashToSpellId.get(hash);
      if (existing) {
        collisions.push([existing, id]);
      } else {
        hashToSpellId.set(hash, id);
      }
    }

    expect(collisions, `检测到重复撞脸法术图标: ${JSON.stringify(collisions)}`).toEqual([]);
    expect(hashToSpellId.size).toBe(150);
  });

  it('全部 150 个法术应具备一对一专属 pixelfx 多阶段特效编排且全部模块与调色板引用合法', () => {
    const allRegisteredIds = Object.keys(TOUHOU_CATALOG.spells);
    expect(allRegisteredIds).toHaveLength(150);
    expect(ALL_SPELL_VFX_IDS).toHaveLength(150);

    const moduleKeys = new Set(Object.keys(PIXELFX_MODULES));
    const paletteKeys = new Set(Object.keys(TOUHOU_PALETTES));
    expect(moduleKeys.size).toBeGreaterThanOrEqual(70);
    expect(paletteKeys.size).toBeGreaterThanOrEqual(24);

    for (const id of allRegisteredIds) {
      const choreo = SPELL_VFX_CATALOG[id];
      expect(choreo, `缺少法术专属特效编排: ${id}`).toBeDefined();
      expect(moduleKeys.has(choreo.impactFx), `${id} 引用了未知主特效模块 ${choreo.impactFx}`).toBe(true);
      expect(paletteKeys.has(choreo.impactPalette), `${id} 引用了未知主调色板 ${choreo.impactPalette}`).toBe(true);
      if (choreo.casterFx) {
        expect(moduleKeys.has(choreo.casterFx), `${id} 引用了未知起手模块 ${choreo.casterFx}`).toBe(true);
      }
      if (choreo.casterPalette) {
        expect(paletteKeys.has(choreo.casterPalette), `${id} 引用了未知起色调色板 ${choreo.casterPalette}`).toBe(true);
      }
      if (choreo.secondaryFx) {
        expect(moduleKeys.has(choreo.secondaryFx), `${id} 引用了未知副层模块 ${choreo.secondaryFx}`).toBe(true);
      }
      if (choreo.secondaryPalette) {
        expect(paletteKeys.has(choreo.secondaryPalette), `${id} 引用了未知副色调色板 ${choreo.secondaryPalette}`).toBe(true);
      }
      if (choreo.perTargetFx) {
        expect(moduleKeys.has(choreo.perTargetFx), `${id} 引用了未知逐目标模块 ${choreo.perTargetFx}`).toBe(true);
      }
      if (choreo.perTargetPalette) {
        expect(paletteKeys.has(choreo.perTargetPalette), `${id} 引用了未知逐目标调色板 ${choreo.perTargetPalette}`).toBe(true);
      }
      if (choreo.weatherFx) {
        expect(moduleKeys.has(choreo.weatherFx), `${id} 引用了未知天象模块 ${choreo.weatherFx}`).toBe(true);
      }
      if (choreo.weatherPalette) {
        expect(paletteKeys.has(choreo.weatherPalette), `${id} 引用了未知天象调色板 ${choreo.weatherPalette}`).toBe(true);
      }
    }
  });

  it('全量 106 个特效模块与 148 法术编排应零脏矩形黑底、零天象单体错配、零静默替身崩溃且光柱顶缘平滑羽化', () => {
    // 1. 严禁 148 法术把 5 大全屏天象误放入单体 casterFx / impactFx / secondaryFx / perTargetFx 槽位！
    for (const [spellId, choreo] of Object.entries(SPELL_VFX_CATALOG)) {
      for (const slotKey of ['casterFx', 'impactFx', 'secondaryFx', 'perTargetFx'] as const) {
        const fxId = choreo[slotKey];
        if (fxId) {
          expect(
            TOUHOU_WEATHER_FX_SET.has(fxId),
            `法术 ${spellId} 的局域槽位 ${slotKey} 误引用了全屏天象 ${fxId}`,
          ).toBe(false);
        }
      }
    }

    // 2. 全量 106 个模块均可在 SILENT_PIXELFX_ACTOR + 后处理净化管线下零崩溃安全光栅化
    const W = 640;
    const H = 360;
    const frame = createFrame(W, H, 0, 0);
    const scratch = createFrame(W, H, 0, 0);
    const rgba = new Uint8ClampedArray(W * H * 4);

    for (const [fxId, mod] of Object.entries(PIXELFX_MODULES)) {
      const originY = TOUHOU_WEATHER_FX_SET.has(fxId) ? 180 : 250;
      const instance = createFx(mod, {
        x: 320,
        y: originY,
        seed: 77,
        palette: [...TOUHOU_PALETTES.shrine_gold],
        light: 1.35,
        actor: SILENT_PIXELFX_ACTOR,
      } as Parameters<typeof createFx>[1]);
      instance.update(0.75);
      clearFrame(frame);
      const postRule = MODULE_POST_PROCESS_RULES.get(mod);
      if (postRule) {
        clearFrame(scratch);
        instance.draw(scratch);
        blendSanitizedScratchIntoFrame(scratch, frame, originY, postRule);
      } else {
        instance.draw(frame);
      }
      composite(frame, rgba, null, 1.25);

      // 5 大全屏天象（含八百万神降 god_rays、西行妖 cherry_blossoms）绝不可糊出大面积暗色底纹矩形！
      if (TOUHOU_WEATHER_FX_SET.has(fxId)) {
        let darkOpaqueCount = 0;
        let visibleCount = 0;
        for (let i = 0; i < W * H; i++) {
          const j = i * 4;
          const a = rgba[j + 3];
          if (a > 10) {
            visibleCount += 1;
            const lum = (rgba[j] + rgba[j + 1] + rgba[j + 2]) / 3;
            if (lum < 48 && a > 55) darkOpaqueCount += 1;
          }
        }
        expect(visibleCount, `全屏天象 ${fxId} 渲染结果不应为空`).toBeGreaterThan(200);
        expect(
          darkOpaqueCount / (W * H),
          `全屏天象 ${fxId} 存在大面积暗色底纹污染 (${darkOpaqueCount} px)`,
        ).toBeLessThan(0.02);
      }
    }

    // 3. 专门回归校验「八百万神降」圣柱 holy_pillar 经顶部羽化通道后，TOP=-204 处（屏幕 y=66）彻底平滑渐隐而非硬平切！
    const originY = 270;
    const pillarRule = MODULE_POST_PROCESS_RULES.get(PIXELFX_MODULES.holy_pillar)!;
    expect(pillarRule).toBeDefined();
    const pillar = createFx(PIXELFX_MODULES.holy_pillar, {
      x: 200,
      y: originY,
      seed: 13,
      palette: [...TOUHOU_PALETTES.shrine_gold],
      light: 1.5,
      actor: SILENT_PIXELFX_ACTOR,
    } as Parameters<typeof createFx>[1]);
    for (let s = 0; s < 12; s++) pillar.update(0.1);
    clearFrame(frame);
    clearFrame(scratch);
    pillar.draw(scratch);
    blendSanitizedScratchIntoFrame(scratch, frame, originY, pillarRule);
    composite(frame, rgba, null, 1.25);

    const topCutY = originY + pillarRule.topOffset; // y = 66
    let maxTopRowAlpha = 0;
    for (let x = 0; x < W; x++) {
      const a = rgba[(topCutY * W + x) * 4 + 3];
      if (a > maxTopRowAlpha) maxTopRowAlpha = a;
    }
    expect(maxTopRowAlpha, 'holy_pillar 顶部截断行应被柔和羽化至近乎透明').toBeLessThan(35);
  });

  it('五大经典远程弹道体系（箭矢/光球/暗球/魔法冲击波/爆裂弹）应完整覆盖全部远程兵种与四位英雄', () => {
    const rangedUnits = [
      ...Object.values(TOUHOU_CATALOG.heroes),
      ...Object.values(TOUHOU_CATALOG.creatures).filter((c) => c.abilities.ranged),
    ];
    expect(rangedUnits.length).toBeGreaterThanOrEqual(16);

    const usedKinds = new Set<string>();
    const validModules = new Set(Object.keys(PIXELFX_MODULES));
    const validPalettes = new Set(Object.keys(TOUHOU_PALETTES));

    for (const u of rangedUnits) {
      const prof = resolveUnitRangedProjectile(u.id, u.voxelBlueprintId);
      usedKinds.add(prof.kind);
      expect(validModules.has(prof.impactFx), `${u.id} 的远程命中特效 ${prof.impactFx} 未注册`).toBe(true);
      expect(validPalettes.has(prof.impactPalette), `${u.id} 的远程调色板 ${prof.impactPalette} 未注册`).toBe(true);
    }

    expect([...usedKinds].sort()).toEqual(['arrow', 'dark_orb', 'explosive_shell', 'light_orb', 'magic_wave']);
    expect(resolveUnitRangedProjectile('ofuda_archer').kind).toBe('arrow');
    expect(resolveUnitRangedProjectile('hero_eirin').kind).toBe('arrow');
    expect(resolveUnitRangedProjectile('hero_reimu').kind).toBe('light_orb');
    expect(resolveUnitRangedProjectile('miasma_venom_youkai').kind).toBe('dark_orb');
    expect(resolveUnitRangedProjectile('grimoire_familiar').kind).toBe('dark_orb');
    expect(resolveUnitRangedProjectile('purity_titan').kind).toBe('magic_wave');
    expect(resolveUnitRangedProjectile('lunar_slinger').kind).toBe('explosive_shell');
    expect(resolveUnitRangedProjectile('yinyang_turret').kind).toBe('explosive_shell');
  });

  it('枯荣凋零与全部群体/AOE法术特效应零死循环、零卡死且 Painter 底层安全拦截 NaN 坐标', () => {
    // 1. 校验 Painter 底层安全守卫：直接传入 NaN / Infinity 坐标给 p.line() 必须立刻返回，绝不进入 Bresenham 死循环！
    installPixelFxPainterSafetyGuards();
    const guardFrame = createFrame(64, 64, 0, 0);
    const guardPainter = painterFor(guardFrame);
    expect(() => {
      guardPainter.line(NaN, 2.5, NaN, 2.5, 0xffffffff, 1);
      guardPainter.line(-Infinity, 0, Infinity, 10, 0xffffffff, 1);
      guardPainter.beam(NaN, 0, 10, 10, 4, 0xffffffff, 1);
      guardPainter.glow(NaN, NaN, 20, 0xffffffff, 0.5);
    }).not.toThrow();

    // 2. 引擎端释放「枯荣凋零 (death_mass_weakness)」：全体非魔免敌军准确挂上 -25% 伤害减益且 AI 回合正常推进
    const { state } = createReimuVsMarisaBattle({
      mode: 'vs_ai',
      leftFaction: 'death',
      rightFaction: 'life',
      seed: 9201,
    });
    const remilia = Object.values(state.units).find((u) => u.defId === 'hero_remilia')!;
    const enemiesBefore = Object.values(state.units).filter((u) => u.side === 'right' && u.status === 'alive');
    state.activeUnitId = remilia.id;
    remilia.mana = 100;
    const castRes = dispatchCombatCommand(
      state,
      { type: 'CAST_SPELL', unitId: remilia.id, spellId: 'death_mass_weakness' },
      TOUHOU_CATALOG,
    );
    expect(castRes.ok, castRes.error).toBe(true);
    const castEv = castRes.events.find((e) => e.type === 'SPELL_CAST');
    expect(castEv && castEv.type === 'SPELL_CAST').toBe(true);
    if (castEv && castEv.type === 'SPELL_CAST') {
      expect(castEv.affectedUnitIds.length).toBe(enemiesBefore.length);
    }
    for (const enemy of enemiesBefore) {
      expect(enemy.modifiers.some((m) => m.spellId === 'death_mass_weakness' && m.value === -0.25)).toBe(true);
    }

    // 3. 重点模拟「枯荣凋零」7 敌军同屏并发释放（含 casterFx + impactFx + 7×shadow_tendrils），60fps 跑满全程必须极快收敛且全部结束！
    const fxFrame = createFrame(320, 180, 0, 0);
    const weaknessSpec = SPELL_VFX_CATALOG.death_mass_weakness;
    const liveSlots: Array<{ inst: ReturnType<typeof createFx>; elapsed: number; maxDur: number }> = [];
    const spawnSlot = (key: keyof typeof PIXELFX_MODULES, x: number, y: number, palKey: keyof typeof TOUHOU_PALETTES, maxDur: number) => {
      liveSlots.push({
        inst: createFx(PIXELFX_MODULES[key], {
          x,
          y,
          seed: 1001 + liveSlots.length * 17,
          palette: [...TOUHOU_PALETTES[palKey]],
          light: 1.35,
          actor: SILENT_PIXELFX_ACTOR,
        } as Record<string, unknown>),
        elapsed: 0,
        maxDur,
      });
    };
    if (weaknessSpec.casterFx) spawnSlot(weaknessSpec.casterFx, 80, 90, weaknessSpec.casterPalette ?? weaknessSpec.impactPalette, 0.95);
    spawnSlot(weaknessSpec.impactFx, 160, 90, weaknessSpec.impactPalette, 1.5);
    for (let k = 0; k < 7; k++) {
      spawnSlot(weaknessSpec.perTargetFx!, 90 + k * 25, 80 + (k % 3) * 20, weaknessSpec.perTargetPalette ?? weaknessSpec.impactPalette, 1.2);
    }
    for (let f = 0; f < 120; f++) {
      clearFrame(fxFrame);
      for (let i = liveSlots.length - 1; i >= 0; i--) {
        const s = liveSlots[i];
        s.elapsed += 0.016;
        if (s.elapsed >= s.maxDur) s.inst.stop();
        s.inst.update(0.016 * 1.5);
        if (s.inst.done()) {
          liveSlots.splice(i, 1);
          continue;
        }
        s.inst.draw(fxFrame);
      }
      if (liveSlots.length === 0) break;
    }
    expect(liveSlots.length).toBe(0);

    // 4. 全量扫描全部群体/天象/AOE 法术的 VFX 编排，确认零死循环、零报错、全部正常渲染并完成收敛
    const aoeSpellEntries = Object.entries(SPELL_VFX_CATALOG).filter(
      ([, spec]) => Boolean(spec.perTargetFx || spec.weatherFx || spec.travel === 'screen_weather' || spec.travel === 'meteor_rain' || spec.travel === 'ring_burst'),
    );
    expect(aoeSpellEntries.length).toBeGreaterThanOrEqual(40);
    for (const [spellId, spec] of aoeSpellEntries) {
      const keys = [spec.casterFx, spec.impactFx, spec.secondaryFx, spec.perTargetFx, spec.weatherFx].filter(
        Boolean,
      ) as Array<keyof typeof PIXELFX_MODULES>;
      for (const k of keys) {
        const inst = createFx(PIXELFX_MODULES[k], {
          x: 160,
          y: 90,
          seed: 1103,
          palette: [...TOUHOU_PALETTES[spec.impactPalette]],
          light: 1.3,
          actor: SILENT_PIXELFX_ACTOR,
        } as Record<string, unknown>);
        expect(() => {
          for (let step = 0; step < 6; step++) {
            clearFrame(fxFrame);
            inst.update(0.22);
            if (!inst.done()) inst.draw(fxFrame);
          }
          inst.stop();
          inst.update(0.4);
        }, `群体法术 ${spellId} 的模块 ${k} 渲染异常`).not.toThrow();
        expect(inst.done(), `群体法术 ${spellId} 的模块 ${k} stop 后未正常退出`).toBe(true);
      }
    }
  });
});

describe('HUD 元数据文案规范、阵营命名与语义着色分词器', () => {
  it('全 150 法术与专属符卡 Hover 应严格遵循「简介 + 客观效果 + 可选斜体彩蛋」三段式且零冗余括号', () => {
    const bracketRe = /[()（）]/;
    const allSpells = Object.values(TOUHOU_CATALOG.spells);
    expect(allSpells).toHaveLength(150);

    let flavorCount = 0;
    for (const sp of allSpells) {
      const copy = SPELL_COPY_CATALOG[sp.id];
      expect(copy, `法术 ${sp.id} 缺少三段式文案条目`).toBeDefined();
      expect(copy.summary.trim().length, `法术 ${sp.id} 简介过短`).toBeGreaterThanOrEqual(6);
      expect(copy.effect.trim().length, `法术 ${sp.id} 客观效果过短`).toBeGreaterThanOrEqual(8);
      expect(bracketRe.test(copy.summary), `法术 ${sp.id} 简介含冗余括号: ${copy.summary}`).toBe(false);
      expect(bracketRe.test(copy.effect), `法术 ${sp.id} 客观效果含冗余括号: ${copy.effect}`).toBe(false);
      if (copy.flavor) {
        flavorCount += 1;
        expect(bracketRe.test(copy.flavor), `法术 ${sp.id} 彩蛋含冗余括号: ${copy.flavor}`).toBe(false);
      }

      const tip = buildSpellTooltipPayload(sp, { effectiveManaCost: Math.max(1, sp.manaCost - 2), currentMana: 20 });
      expect(tip.summary).toBe(copy.summary);
      expect(tip.lines).toEqual([copy.effect]);
      expect(tip.flavor).toBe(copy.flavor);
      expect(bracketRe.test(tip.subtitle ?? ''), `副标题含冗余括号: ${tip.subtitle}`).toBe(false);
      expect(bracketRe.test(tip.tag ?? ''), `角标含冗余括号: ${tip.tag}`).toBe(false);
    }

    // 精选部分法术配备斜体彩蛋（克制留白，并非全塞）
    expect(flavorCount).toBeGreaterThanOrEqual(20);
    expect(flavorCount).toBeLessThan(allSpells.length);

    // 校验全部专属符卡三段式文案与构造器
    for (const card of Object.values(TOUHOU_CATALOG.spellCards)) {
      const cardCopy = SPELL_CARD_COPY_CATALOG[card.id];
      expect(cardCopy, `专属符卡 ${card.id} 缺少三段式文案`).toBeDefined();
      const tip = buildSpellCardTooltipPayload(card, { currentMana: 20, currentCharge: 100 });
      expect(tip.summary).toBe(cardCopy.summary);
      expect(tip.lines).toEqual([cardCopy.effect]);
      expect(tip.flavor).toBe(cardCopy.flavor);
      expect(bracketRe.test(tip.summary ?? '')).toBe(false);
      expect(bracketRe.test(tip.lines.join(''))).toBe(false);
    }
  });

  it('六大阵营与东方势力统一命名、法术五类极性快筛及语义着色分词器（含生物类型内联微标）应严格一致', () => {
    // 1. 六大阵营二段式名 + 东方势力名单一事实来源校验
    expect(ALIGNMENT_META.life.name).toBe('生命·信仰');
    expect(ALIGNMENT_META.life.factionName).toBe('信仰圣域');
    expect(ALIGNMENT_META.order.name).toBe('秩序·幻月');
    expect(ALIGNMENT_META.order.factionName).toBe('幻月庭园');
    expect(ALIGNMENT_META.death.name).toBe('死亡·幽冥');
    expect(ALIGNMENT_META.death.factionName).toBe('幽冥楼府');
    expect(ALIGNMENT_META.chaos.name).toBe('混沌·魔导');
    expect(ALIGNMENT_META.chaos.factionName).toBe('魔导结社');
    expect(ALIGNMENT_META.nature.name).toBe('自然·灵森');
    expect(ALIGNMENT_META.nature.factionName).toBe('自然森境');
    expect(ALIGNMENT_META.might.name).toBe('力量·武艺');
    expect(ALIGNMENT_META.might.factionName).toBe('武艺旧都');

    // 2. 全 148 法术极性五分法校验（每类均有覆盖，关键法术归类精准）
    const counts: Record<string, number> = {};
    for (const pol of ALL_SPELL_POLARITIES) counts[pol] = 0;
    for (const sp of Object.values(TOUHOU_CATALOG.spells)) {
      const pol = classifySpellPolarity(sp);
      counts[pol] += 1;
      const tip = buildSpellTooltipPayload(sp);
      expect(tip.badges?.length).toBe(2);
      expect(tip.badges?.[0]?.label).toBe(ALIGNMENT_META[sp.alignment].name);
      expect(tip.badges?.[1]?.label).toBe(SPELL_POLARITY_META[pol].label);
      expect(tip.badges?.[1]?.icon).toBe(SPELL_POLARITY_META[pol].icon);
    }
    for (const pol of ALL_SPELL_POLARITIES) {
      expect(counts[pol], `极性 ${pol} 应至少包含一个法术`).toBeGreaterThan(0);
    }
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.life_heal)).toBe('heal');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.life_bless)).toBe('buff');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.chaos_magic_arrow)).toBe('damage');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.death_poison)).toBe('debuff');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.order_blind)).toBe('debuff');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.order_teleport)).toBe('utility');
    expect(classifySpellPolarity(TOUHOU_CATALOG.spells.nature_summon_fire_elemental)).toBe('utility');

    // 3. 语义着色分词器：阵营着色、特殊生物类型挂专属微标，且绝不误伤「蓬莱不死鸟」「不死炽焰」
    const tokens = tokenizeSemanticText('对死亡系、不死、暗系与混沌系目标伤害 +35%，对机械/元素/幻象生效，减防 -20%');
    expect(tokens.some((t) => t.kind === 'alignment' && t.text === '死亡系' && t.color === ALIGNMENT_META.death.textColor)).toBe(true);
    expect(tokens.some((t) => t.kind === 'alignment' && t.text === '混沌系' && t.color === ALIGNMENT_META.chaos.textColor)).toBe(true);
    expect(tokens.some((t) => t.kind === 'creatureType' && t.text === '不死' && t.icon === 'undead')).toBe(true);
    expect(tokens.some((t) => t.kind === 'creatureType' && t.text === '暗系' && t.icon === 'darkNature')).toBe(true);
    expect(tokens.some((t) => t.kind === 'creatureType' && t.text === '机械' && t.icon === 'mechanical')).toBe(true);
    expect(tokens.some((t) => t.kind === 'creatureType' && t.text === '元素' && t.icon === 'elemental')).toBe(true);
    expect(tokens.some((t) => t.kind === 'creatureType' && t.text === '幻象' && t.icon === 'illusion')).toBe(true);
    expect(tokens.some((t) => t.kind === 'deltaPos' && t.text === '+35%')).toBe(true);
    expect(tokens.some((t) => t.kind === 'deltaNeg' && t.text === '-20%')).toBe(true);

    const phoenixTokens = tokenizeSemanticText('召请蓬莱不死鸟，附着不死炽焰');
    expect(phoenixTokens.some((t) => t.kind === 'creatureType')).toBe(false);

    // 3b. 扩展阵营短语（秩序阵营 / 生命阵营 / 幽冥公馆 / 混沌专属符卡）与增减数值应全部命中语义着色
    const purgeTokens = tokenizeSemanticText('向所有非秩序阵营的目标发动远程射击时，伤害额外 +20%。');
    expect(purgeTokens.some((t) => t.kind === 'alignment' && t.text === '秩序阵营' && t.color === ALIGNMENT_META.order.textColor)).toBe(true);
    expect(purgeTokens.some((t) => t.kind === 'deltaPos' && t.text === '+20%')).toBe(true);

    const wardTokens = tokenizeSemanticText('幽冥公馆抗生结界：迎战生命阵营敌军防御 +50%，承受混沌专属符卡魔伤 -25%。');
    expect(wardTokens.some((t) => t.kind === 'alignment' && t.text === '幽冥公馆' && t.color === ALIGNMENT_META.death.textColor)).toBe(true);
    expect(wardTokens.some((t) => t.kind === 'alignment' && t.text === '生命阵营' && t.color === ALIGNMENT_META.life.textColor)).toBe(true);
    expect(wardTokens.some((t) => t.kind === 'alignment' && t.text === '混沌专属符卡' && t.color === ALIGNMENT_META.chaos.textColor)).toBe(true);
    expect(wardTokens.some((t) => t.kind === 'deltaPos' && t.text === '+50%')).toBe(true);
    expect(wardTokens.some((t) => t.kind === 'deltaNeg' && t.text === '-25%')).toBe(true);

    // 4. 抬头生物类型微标提取：默认活体为空，特殊生物/暗系返回对应微标
    expect(getUnitHeaderCreatureTags({ abilities: {} })).toEqual([]);
    expect(getUnitHeaderCreatureTags({ abilities: { darkNature: true } }).map((t) => t.icon)).toEqual(['darkNature']);
    expect(getUnitHeaderCreatureTags({ abilities: { undead: true } }).map((t) => t.icon)).toEqual(['undead']);
    expect(getUnitHeaderCreatureTags({ abilities: { elemental: true } }).map((t) => t.icon)).toEqual(['elemental']);
    expect(getUnitHeaderCreatureTags({ abilities: {}, isIllusion: true }).map((t) => t.icon)).toEqual(['illusion']);
  });

  it('全部 41 项单位特技与生物类型、实时状态、技能树、职业与英雄装备秘药文案均遵循三段式零冗余括号新规范', () => {
    const { state } = createReimuVsMarisaBattle({ mode: 'vs_ai', lineupVariant: 'A', seed: 7600 });
    const sample = Object.values(state.units).find((u) => u.kind === 'creature')!;
    const hero = Object.values(state.units).find((u) => u.kind === 'hero')!;
    // 开启全部 40 项能力标记 + 幻象标记（共 41 项特技与特殊生物类型），一次性全量扫描校验
    sample.isIllusion = true;
    sample.abilities = {
      flying: true,
      teleport: true,
      firstStrike: true,
      rangedFirstStrike: true,
      noRetaliation: true,
      unlimitedRetaliation: true,
      ranged: true,
      noMelee: true,
      noRanged: true,
      noMeleePenalty: true,
      siegeBreaker: true,
      magicImmune: true,
      darkNature: true,
      doubleStrike: true,
      longWeapon: true,
      negateFirstStrike: true,
      longRange: true,
      shortRange: true,
      noObstaclePenalty: true,
      unlimitedShots: true,
      charge: true,
      deathWard: true,
      block: true,
      stunOnHit: true,
      terrorOnHit: true,
      stoneGaze: true,
      fireShield: true,
      fireResistant: true,
      chaosResistant: true,
      lightningResistant: true,
      giantSlayer: true,
      orderPurgeRanged: true,
      multipleAttack: true,
      breathAttack: true,
      mechanical: true,
      undead: true,
      elemental: true,
      stealth: true,
      spellcaster: true,
      resurrection: true,
    };

    const specs = buildUnitSpecialtyBadges(sample);
    expect(specs.length).toBe(41);
    const forbiddenRe = /[()（）]|HoMM4|LoS|\bH4\b/;
    for (const badge of specs) {
      expect(badge.tooltip.badges?.length, `特技 ${badge.id} 缺少类别/生物类型彩色胶囊`).toBeGreaterThan(0);
      expect(badge.tooltip.summary?.trim().length, `特技 ${badge.id} 缺少简介段`).toBeGreaterThanOrEqual(6);
      expect(badge.tooltip.lines.length, `特技 ${badge.id} 缺少规则正文`).toBeGreaterThan(0);
      expect(forbiddenRe.test(badge.tooltip.title), `特技 ${badge.id} 标题含旧括号或开发缩写: ${badge.tooltip.title}`).toBe(false);
      expect(forbiddenRe.test(badge.tooltip.summary ?? ''), `特技 ${badge.id} 简介含冗余括号: ${badge.tooltip.summary}`).toBe(false);
      expect(forbiddenRe.test(badge.tooltip.lines.join('')), `特技 ${badge.id} 正文含冗余括号或旧缩写: ${badge.tooltip.lines.join('')}`).toBe(false);
    }

    // 状态徽章全量检验：挂上典型正负状态，确保全部携带阵营/极性胶囊且零冗余括号
    sample.statusEffects = {
      stunnedRounds: 1,
      terrifiedRounds: 1,
      blindRounds: 2,
      precisionRounds: 6,
      bloodlustRounds: 6,
      rabbitFormRounds: 3,
      bless: true,
      curse: true,
      blur: true,
      auraOfFear: true,
      vampiricTouch: true,
      fireAura: true,
    };
    const statuses = buildUnitStatusBadges(sample, state);
    expect(statuses.length).toBeGreaterThanOrEqual(10);
    for (const st of statuses) {
      expect(st.tooltip.badges?.length, `状态 ${st.id} 缺少阵营/极性彩色胶囊`).toBeGreaterThan(0);
      expect(forbiddenRe.test(st.tooltip.title), `状态 ${st.id} 标题含冗余括号: ${st.tooltip.title}`).toBe(false);
      expect(forbiddenRe.test(st.tooltip.lines.join('')), `状态 ${st.id} 正文含冗余括号: ${st.tooltip.lines.join('')}`).toBe(false);
    }

    // 英雄固有特质与已佩戴神器槽位应带彩色胶囊
    const heroTraits = buildHeroTraitBadges(hero);
    expect(heroTraits.length).toBeGreaterThan(0);
    for (const tr of heroTraits) {
      expect(tr.tooltip.badges?.length, `特质 ${tr.id} 缺少彩色胶囊`).toBeGreaterThan(0);
    }
    const equippedSlots = buildHeroEquipmentSlots(hero).filter((s) => s.artifact !== null);
    expect(equippedSlots.length).toBeGreaterThan(0);
    for (const slot of equippedSlots) {
      expect(slot.tooltip.badges?.length, `神器 ${slot.artifact?.id} 缺少彩色胶囊`).toBeGreaterThan(0);
      expect(slot.tooltip.summary?.trim().length).toBeGreaterThan(0);
    }

    // 9 主技能、27 二级专精、11 基础职业、37 进阶职业与腰带秘药均不得残留 HoMM4/H4 或冗余括号
    for (const m of Object.values(PRIMARY_SKILL_META)) {
      expect(forbiddenRe.test(m.desc), `主技能摘要含旧词或括号: ${m.desc}`).toBe(false);
    }
    for (const tree of Object.values(SKILL_TREE_META)) {
      expect(forbiddenRe.test(tree.desc), `主技能树 ${tree.id} 描述含旧词或括号: ${tree.desc}`).toBe(false);
    }
    for (const sub of Object.values(SECONDARY_SKILL_META)) {
      expect(forbiddenRe.test(sub.desc), `二级专精 ${sub.id} 描述含旧词或括号: ${sub.desc}`).toBe(false);
      expect(forbiddenRe.test(sub.combatEffect), `二级专精 ${sub.id} 实战效果含旧词或括号: ${sub.combatEffect}`).toBe(false);
    }
    for (const cls of [...Object.values(H4_BASE_CLASSES), ...Object.values(H4_ADVANCED_CLASSES)]) {
      expect(forbiddenRe.test(cls.description), `职业 ${cls.id} 描述含旧词或括号: ${cls.description}`).toBe(false);
    }
    for (const pot of Object.values(TOUHOU_CATALOG.potions)) {
      expect(forbiddenRe.test(pot.description), `秘药 ${pot.id} 描述含旧词或括号: ${pot.description}`).toBe(false);
    }
  });
});

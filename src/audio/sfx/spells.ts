/**
 * 五系术式、元素专效、秘药、战术姿态、东方符卡宣言与胜负终局管弦战号类音效配方
 */

import {
  createVoiceInput,
  scheduleBufferHit,
  scheduleNoiseBurst,
  schedulePunchKick,
  scheduleTaikoDrum,
  scheduleWarmEnsembleNote,
  scheduleWhoosh,
} from '../synthPrimitives';
import { f, kotoRate } from './helpers';
import type { SoundRecipe, SpellSoundId } from './types';

/** 法术、秘药、姿态与符卡终局演出音效表 */
export const SPELL_SFX_CATALOG: Record<SpellSoundId, SoundRecipe> = {
  // ==================== 四、五系术式、元素专效、秘药与姿态 ====================

  spell_heal: {
    bus: 'sfx',
    cooldownMs: 95,
    defaultGain: 0.56,
    reverbSend: 0.22,
    render: (env, p) => {
      // 幻想乡神社圣疗：真实和风古筝五声音阶琶音 + 丝绒圣光和声铺底 + 晶莹水灵微光（宽广厅堂混响）
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.22,
        hallSend: 0.52,
      });
      // 温暖丝绒圣光基底（D4 + A4）
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(293.66, p),
        duration: 0.68,
        attack: 0.06,
        peak: 0.26,
        timbre: 'pad',
        detuneCents: 10,
      });
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(440.0, p),
        delay: 0.04,
        duration: 0.64,
        attack: 0.06,
        peak: 0.24,
        timbre: 'pad',
        detuneCents: 10,
      });
      // Karplus-Strong 和风古筝逐弦拨响（D5 - F#5 - A5 - D6，声像由左向右优雅流淌）
      const arp = [
        { hz: 587.33, d: 0.0, pan: -0.3 },
        { hz: 739.99, d: 0.055, pan: -0.1 },
        { hz: 880.0, d: 0.11, pan: 0.12 },
        { hz: 1174.66, d: 0.165, pan: 0.32 },
      ];
      for (const n of arp) {
        scheduleBufferHit(env.ctx, out, env.bank.kotoPluck, p.now, {
          playbackRate: kotoRate(n.hz, p),
          delay: n.d,
          duration: 0.56,
          peak: 0.36,
          pan: n.pan,
        });
      }
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 1.18 * p.pitchScale,
        delay: 0.14,
        duration: 0.48,
        peak: 0.26,
      });
    },
  },

  spell_buff: {
    bus: 'sfx',
    cooldownMs: 95,
    defaultGain: 0.58,
    reverbSend: 0.2,
    render: (env, p) => {
      // 战术祝福/结界强化：缔太鼓起势 + 宽宏上扬立体声铜管五度 + 晶石护盾锁合
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.2,
        hallSend: 0.38,
        drive: 1.3,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'shime',
        peak: 0.62,
        pitchScale: p.pitchScale,
      });
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(293.66, p),
        freqEnd: f(440.0, p),
        delay: 0.02,
        duration: 0.42,
        attack: 0.035,
        peak: 0.3,
        timbre: 'brass',
      });
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(440.0, p),
        freqEnd: f(587.33, p),
        delay: 0.05,
        duration: 0.42,
        attack: 0.035,
        peak: 0.26,
        timbre: 'pad',
      });
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 1.06 * p.pitchScale,
        delay: 0.14,
        duration: 0.42,
        peak: 0.44,
      });
    },
  },

  spell_debuff: {
    bus: 'sfx',
    cooldownMs: 95,
    defaultGain: 0.6,
    reverbSend: 0.22,
    render: (env, p) => {
      // 冥界诅咒/衰弱/时滞：深渊低音弦乐下行增四度 + 阴冷低涡暗风 + 闷重丧铜钟鸣
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.22,
        hallSend: 0.42,
        drive: 2.0,
        lowpassHz: 4200,
      });
      scheduleWhoosh(env, out, p.now, {
        color: 'brown',
        duration: 0.42,
        peakTimeRatio: 0.3,
        freqStart: 820,
        freqPeak: 380,
        freqEnd: 120,
        q: 2.1,
        peak: 0.64,
        airMix: 0.18,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bronzeGong, p.now, {
        playbackRate: 0.68 * p.pitchScale,
        playbackRateEnd: 0.56 * p.pitchScale,
        duration: 0.56,
        peak: 0.48,
        decayTail: true,
        filterFreq: 860,
      });
      // 压迫感下行三全音弦乐群（Eb4→D4，A3→Ab3）
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(311.13, p),
        freqEnd: f(277.18, p),
        delay: 0.02,
        duration: 0.48,
        peak: 0.28,
        timbre: 'dark_strings',
      });
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(220.0, p),
        freqEnd: f(185.0, p),
        delay: 0.05,
        duration: 0.5,
        peak: 0.28,
        timbre: 'dark_strings',
      });
    },
  },

  spell_orb: {
    bus: 'sfx',
    cooldownMs: 85,
    defaultGain: 0.66,
    reverbSend: 0.2,
    render: (env, p) => {
      // 博丽阴阳封魔弹/破邪爆发：扎实灵力冲击 + 神乐铜鸣 + 晶莹爆裂封魔环
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.2,
        hallSend: 0.28,
        drive: 2.0,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 195,
        endHz: 40,
        duration: 0.22,
        peak: 0.92,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bronzeGong, p.now, {
        playbackRate: 1.38 * p.pitchScale,
        duration: 0.36,
        peak: 0.52,
        decayTail: true,
      });
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 1.02 * p.pitchScale,
        delay: 0.008,
        duration: 0.34,
        peak: 0.54,
      });
      scheduleBufferHit(env.ctx, out, env.bank.shatterDebris, p.now, {
        playbackRate: 1.15 * p.pitchScale,
        delay: 0.015,
        duration: 0.18,
        peak: 0.32,
      });
      scheduleWhoosh(env, out, p.now, {
        duration: 0.18,
        peakTimeRatio: 0.24,
        freqStart: 2200,
        freqPeak: 3600,
        freqEnd: 520,
        q: 1.5,
        peak: 0.42,
      });
    },
  },

  spell_star_bolt: {
    bus: 'sfx',
    cooldownMs: 80,
    defaultGain: 0.66,
    reverbSend: 0.18,
    render: (env, p) => {
      // 星屑魔矢/魔法飞弹：三重星晶闪耀发射 + 迅猛破空冲刺 + 扎实魔能引爆
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.18,
        hallSend: 0.24,
        drive: 1.8,
      });
      // 三连星辉微颤
      [
        { rate: 1.42, d: 0.0, pan: -0.22 },
        { rate: 1.72, d: 0.026, pan: 0.22 },
        { rate: 2.04, d: 0.052, pan: 0 },
      ].forEach((s) => {
        scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
          playbackRate: s.rate * p.pitchScale,
          delay: s.d,
          duration: 0.22,
          peak: 0.42,
          decayTail: true,
          pan: s.pan,
        });
      });
      scheduleWhoosh(env, out, p.now, {
        duration: 0.22,
        peakTimeRatio: 0.28,
        freqStart: 880,
        freqPeak: 3900,
        freqEnd: 580,
        q: 2.1,
        peak: 0.66,
        airMix: 0.5,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 195,
        endHz: 38,
        delay: 0.035,
        duration: 0.2,
        peak: 0.86,
      });
    },
  },

  spell_aoe: {
    bus: 'sfx',
    cooldownMs: 110,
    defaultGain: 0.76,
    reverbSend: 0.24,
    render: (env, p) => {
      // 大型范围爆炎/流星轰炸：高空呼啸下坠 → 双重震天大太鼓核爆 + 布朗燃爆冲击波 + 立体声烈焰噼啪！
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.24,
        hallSend: 0.44,
        drive: 2.8,
      });
      // 高空俯冲呼啸
      scheduleWhoosh(env, out, p.now, {
        duration: 0.18,
        peakTimeRatio: 0.4,
        freqStart: 2400,
        freqPeak: 1150,
        freqEnd: 260,
        q: 1.8,
        peak: 0.56,
        airMix: 0.4,
      });
      // 双重轰击震波
      scheduleTaikoDrum(env, out, p.now, {
        size: 'odaiko',
        delay: 0.075,
        peak: 0.96,
        pitchScale: 0.92 * p.pitchScale,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'odaiko',
        delay: 0.19,
        peak: 0.88,
        pitchScale: 0.78 * p.pitchScale,
      });
      // 持续布朗低频爆炸气浪
      scheduleNoiseBurst(env, out, p.now, {
        color: 'brown',
        filterType: 'lowpass',
        freqStart: 1450,
        freqEnd: 115,
        q: 1.0,
        delay: 0.075,
        attack: 0.012,
        duration: 0.68,
        peak: 0.92,
      });
      // 左右声道火焰爆裂与飞溅火星
      scheduleBufferHit(env.ctx, out, env.bank.fireCrackle, p.now, {
        playbackRate: 1.08 * p.pitchScale,
        delay: 0.09,
        duration: 0.48,
        peak: 0.58,
        pan: -0.28,
      });
      scheduleBufferHit(env.ctx, out, env.bank.fireCrackle, p.now, {
        playbackRate: 0.86 * p.pitchScale,
        delay: 0.16,
        duration: 0.48,
        peak: 0.54,
        pan: 0.28,
      });
    },
  },

  spell_ice: {
    bus: 'sfx',
    cooldownMs: 90,
    defaultGain: 0.66,
    reverbSend: 0.22,
    render: (env, p) => {
      // 【冰霜专效】冰枪/深渊冰魔/冻结：极寒风啸 + 晶莹双冰铃凝结 + 立体声冰层咔嚓爆碎！
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.22,
        hallSend: 0.42,
      });
      // 极寒凛风
      scheduleWhoosh(env, out, p.now, {
        color: 'white',
        duration: 0.24,
        peakTimeRatio: 0.32,
        freqStart: 1900,
        freqPeak: 5400,
        freqEnd: 1500,
        q: 2.2,
        peak: 0.46,
        airMix: 0.35,
      });
      // 冰晶凝结双音共鸣
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 1.36 * p.pitchScale,
        duration: 0.46,
        peak: 0.64,
        pan: -0.2,
      });
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 1.82 * p.pitchScale,
        delay: 0.028,
        duration: 0.44,
        peak: 0.54,
        pan: 0.2,
      });
      // 冰层裂爆微瞬态颗粒 + 深冰裂底震
      scheduleBufferHit(env.ctx, out, env.bank.shatterDebris, p.now, {
        playbackRate: 1.2 * p.pitchScale,
        delay: 0.035,
        duration: 0.34,
        peak: 0.62,
        pan: -0.24,
      });
      scheduleBufferHit(env.ctx, out, env.bank.shatterDebris, p.now, {
        playbackRate: 0.94 * p.pitchScale,
        delay: 0.08,
        duration: 0.32,
        peak: 0.52,
        pan: 0.24,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 155,
        endHz: 42,
        delay: 0.03,
        duration: 0.16,
        peak: 0.58,
      });
    },
  },

  spell_lightning: {
    bus: 'sfx',
    cooldownMs: 90,
    defaultGain: 0.72,
    reverbSend: 0.24,
    render: (env, p) => {
      // 【雷电专效】闪电箭/连锁闪电/天雷：高压瞬态电鞭劈裂 + 连续电弧噼啪 + 滚滚布朗雷鸣回荡！
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.24,
        hallSend: 0.48,
        drive: 2.6,
      });
      // 瞬态：刺目高压击穿尖劈
      scheduleNoiseBurst(env, out, p.now, {
        color: 'white',
        filterType: 'highpass',
        freqStart: 2800,
        attack: 0.0015,
        duration: 0.07,
        peak: 0.72,
      });
      scheduleBufferHit(env.ctx, out, env.bank.fireCrackle, p.now, {
        playbackRate: 1.68 * p.pitchScale,
        duration: 0.18,
        peak: 0.76,
        filterType: 'highpass',
        filterFreq: 1900,
        pan: -0.2,
      });
      // 实体：二次电弧飞溅 + 雷击重底鼓
      scheduleBufferHit(env.ctx, out, env.bank.fireCrackle, p.now, {
        playbackRate: 1.18 * p.pitchScale,
        delay: 0.06,
        duration: 0.34,
        peak: 0.62,
        pan: 0.24,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 180,
        endHz: 28,
        delay: 0.015,
        duration: 0.32,
        peak: 0.94,
      });
      // 尾音：苍穹滚雷
      scheduleNoiseBurst(env, out, p.now, {
        color: 'brown',
        filterType: 'lowpass',
        freqStart: 560,
        freqEnd: 82,
        q: 0.9,
        delay: 0.04,
        attack: 0.025,
        duration: 0.72,
        peak: 0.85,
      });
    },
  },

  potion_drink: {
    bus: 'sfx',
    cooldownMs: 110,
    defaultGain: 0.5,
    reverbSend: 0.14,
    render: (env, p) => {
      // 真实秘药饮用拟音：琉璃瓶轻碰 + 真实液体咕嘟气泡 + 沁润回气清弦
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.14,
        hallSend: 0.14,
      });
      scheduleBufferHit(env.ctx, out, env.bank.glassClink, p.now, {
        playbackRate: 1.06 * p.pitchScale,
        duration: 0.15,
        peak: 0.58,
      });
      scheduleBufferHit(env.ctx, out, env.bank.liquidBubble, p.now, {
        playbackRate: 0.96 * p.pitchScale,
        delay: 0.045,
        duration: 0.22,
        peak: 0.78,
      });
      scheduleBufferHit(env.ctx, out, env.bank.liquidBubble, p.now, {
        playbackRate: 1.16 * p.pitchScale,
        delay: 0.155,
        duration: 0.18,
        peak: 0.62,
      });
      scheduleBufferHit(env.ctx, out, env.bank.kotoPluck, p.now, {
        playbackRate: kotoRate(880.0, p),
        delay: 0.21,
        duration: 0.32,
        peak: 0.3,
      });
    },
  },

  stance_defend: {
    bus: 'sfx',
    cooldownMs: 95,
    defaultGain: 0.64,
    reverbSend: 0.18,
    render: (env, p) => {
      // 重盾顿地立阵：长胴战鼓沉稳砸地 + 实心冷钢护盾嗡鸣 + 砾石摩擦定锚
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.18,
        drive: 1.8,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'nagado',
        peak: 0.86,
        pitchScale: 0.92 * p.pitchScale,
      });
      scheduleBufferHit(env.ctx, out, env.bank.steelClang, p.now, {
        playbackRate: 0.76 * p.pitchScale,
        delay: 0.008,
        duration: 0.34,
        peak: 0.68,
        filterFreq: 3400,
      });
      scheduleNoiseBurst(env, out, p.now, {
        color: 'pink',
        filterType: 'bandpass',
        freqStart: 1200,
        freqEnd: 420,
        q: 1.3,
        duration: 0.11,
        peak: 0.36,
      });
    },
  },

  stance_wait: {
    bus: 'sfx',
    cooldownMs: 95,
    defaultGain: 0.42,
    reverbSend: 0.12,
    render: (env, p) => {
      // 精密战术黄铜怀表嘀嗒双响（木质擒纵 + 玻璃表壳清脆共鸣）
      const out = createVoiceInput(env, { pan: p.pan, gain: p.gain, reverbSend: 0.12 });
      // 嘀
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 1.78 * p.pitchScale,
        duration: 0.035,
        peak: 0.56,
      });
      scheduleBufferHit(env.ctx, out, env.bank.glassClink, p.now, {
        playbackRate: 1.48 * p.pitchScale,
        duration: 0.045,
        peak: 0.34,
        decayTail: true,
      });
      // 嗒
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 1.38 * p.pitchScale,
        delay: 0.095,
        duration: 0.04,
        peak: 0.48,
      });
      scheduleBufferHit(env.ctx, out, env.bank.glassClink, p.now, {
        playbackRate: 1.18 * p.pitchScale,
        delay: 0.095,
        duration: 0.055,
        peak: 0.3,
        decayTail: true,
      });
    },
  },

  // ==================== 五、东方符卡宣言与终局管弦战号 ====================

  spellcard_declare: {
    bus: 'sfx',
    cooldownMs: 280,
    defaultGain: 0.8,
    reverbSend: 0.24,
    render: (env, p) => {
      // 【东方 Boss 级符卡宣言】震天大太鼓 + 古社巨铜锣 + 结界展开晶莹星风 + 立体声宏大铜管五度齐鸣！
      const out = createVoiceInput(env, {
        pan: 0,
        gain: p.gain,
        reverbSend: 0.24,
        hallSend: 0.62,
        drive: 1.8,
      });
      // 1. 震天大太鼓 + 巨铜锣瞬间镇场
      scheduleTaikoDrum(env, out, p.now, {
        size: 'odaiko',
        peak: 0.98,
        pitchScale: p.pitchScale,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bronzeGong, p.now, {
        playbackRate: 0.95 * p.pitchScale,
        duration: 1.05,
        peak: 0.56,
      });
      // 2. 幻想乡结界张开：高速星风扫过 + 双晶铃闪耀
      scheduleWhoosh(env, out, p.now, {
        color: 'white',
        duration: 0.34,
        peakTimeRatio: 0.38,
        freqStart: 760,
        freqPeak: 5200,
        freqEnd: 1850,
        q: 1.9,
        peak: 0.52,
        airMix: 0.4,
      });
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 1.25 * p.pitchScale,
        delay: 0.03,
        duration: 0.52,
        peak: 0.46,
        pan: -0.28,
      });
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 1.68 * p.pitchScale,
        delay: 0.075,
        duration: 0.54,
        peak: 0.44,
        pan: 0.28,
      });
      // 3. 电影级立体声宽宏铜管五度定音（D4 + A4 + D5）
      [293.66, 440.0, 587.33].forEach((hz, idx) => {
        scheduleWarmEnsembleNote(env.ctx, out, p.now, {
          freq: f(hz, p),
          delay: 0.11,
          attack: 0.04,
          duration: 0.72,
          peak: idx === 0 ? 0.3 : 0.24,
          timbre: 'brass',
          detuneCents: 10,
          spread: 0.44,
        });
      });
    },
  },

  spellcard_master_spark: {
    bus: 'sfx',
    cooldownMs: 380,
    defaultGain: 0.84,
    reverbSend: 0.26,
    render: (env, p) => {
      // 【恋符「极限火花」】八卦炉涡轮星辉蓄能 → 核爆级魔炮射流 + 立体声巨型管弦力量和弦 + 火星四溅！
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.26,
        hallSend: 0.58,
        drive: 3.0,
      });
      // Phase 1：八卦炉星辉涡轮拉升（0 ~ 0.23s）
      scheduleWhoosh(env, out, p.now, {
        duration: 0.24,
        peakTimeRatio: 0.7,
        freqStart: 360,
        freqPeak: 3800,
        freqEnd: 1600,
        q: 2.2,
        peak: 0.62,
        airMix: 0.5,
      });
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(293.66, p),
        freqEnd: f(587.33, p),
        duration: 0.23,
        attack: 0.03,
        peak: 0.28,
        timbre: 'pad',
      });
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 1.55 * p.pitchScale,
        delay: 0.06,
        duration: 0.2,
        peak: 0.44,
      });

      // Phase 2：极彩魔炮全屏轰发（0.21s 起）
      scheduleTaikoDrum(env, out, p.now, {
        size: 'odaiko',
        delay: 0.21,
        peak: 1.0,
        pitchScale: 0.88 * p.pitchScale,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 185,
        endHz: 26,
        delay: 0.21,
        duration: 0.52,
        peak: 0.96,
      });
      // 双层魔炮等离子射流（布朗次低频轰鸣 + 粉红高频喷射气浪）
      scheduleNoiseBurst(env, out, p.now, {
        color: 'brown',
        filterType: 'lowpass',
        freqStart: 980,
        freqEnd: 140,
        q: 0.85,
        delay: 0.21,
        attack: 0.025,
        duration: 1.08,
        peak: 0.94,
      });
      scheduleNoiseBurst(env, out, p.now, {
        color: 'pink',
        filterType: 'bandpass',
        freqStart: 2800,
        freqEnd: 520,
        q: 0.9,
        delay: 0.21,
        attack: 0.03,
        duration: 0.98,
        peak: 0.62,
      });
      // 立体声失谐宏大能量墙（D2 + D3 + A3 + D4 + F#4）
      [
        { hz: 73.42, peak: 0.34, timbre: 'dark_strings' as const },
        { hz: 146.83, peak: 0.28, timbre: 'brass' as const },
        { hz: 220.0, peak: 0.24, timbre: 'brass' as const },
        { hz: 293.66, peak: 0.22, timbre: 'brass' as const },
        { hz: 369.99, peak: 0.18, timbre: 'pad' as const },
      ].forEach((v) => {
        scheduleWarmEnsembleNote(env.ctx, out, p.now, {
          freq: f(v.hz, p),
          freqEnd: f(v.hz * 0.96, p),
          delay: 0.21,
          attack: 0.035,
          duration: 1.02,
          peak: v.peak,
          timbre: v.timbre,
          detuneCents: 13,
          spread: 0.5,
        });
      });
      scheduleBufferHit(env.ctx, out, env.bank.fireCrackle, p.now, {
        playbackRate: 1.25 * p.pitchScale,
        delay: 0.23,
        duration: 0.5,
        peak: 0.44,
      });
    },
  },

  spellcard_gungnir: {
    bus: 'sfx',
    cooldownMs: 360,
    defaultGain: 0.84,
    reverbSend: 0.26,
    render: (env, p) => {
      // 【神枪「冈格尼尔」】蕾米莉亚红魔馆哥特猩红雷枪：暗红旋风聚枪 → 超音速神枪撕裂空气 → 猩红落雷轰贯天地！
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.26,
        hallSend: 0.65,
        drive: 2.8,
      });
      // Phase 1：哥特暗红弦乐与旋风蓄枪（0 ~ 0.18s）
      scheduleWhoosh(env, out, p.now, {
        duration: 0.19,
        peakTimeRatio: 0.65,
        freqStart: 280,
        freqPeak: 2500,
        freqEnd: 880,
        q: 2.1,
        peak: 0.58,
        airMix: 0.42,
      });
      [146.83, 220.0, 349.23].forEach((hz) => {
        // Dm 哥特小调和弦（D3 + A3 + F4）
        scheduleWarmEnsembleNote(env.ctx, out, p.now, {
          freq: f(hz, p),
          duration: 0.78,
          attack: 0.04,
          peak: 0.22,
          timbre: 'dark_strings',
          detuneCents: 11,
          spread: 0.46,
        });
      });
      // Phase 2：超音速猩红长枪掷出与雷爆贯地（0.16s 起）
      scheduleWhoosh(env, out, p.now, {
        color: 'white',
        delay: 0.15,
        duration: 0.24,
        peakTimeRatio: 0.18,
        freqStart: 4400,
        freqPeak: 3200,
        freqEnd: 460,
        q: 1.9,
        peak: 0.74,
        airMix: 0.62,
      });
      scheduleBufferHit(env.ctx, out, env.bank.steelClang, p.now, {
        playbackRate: 1.24 * p.pitchScale,
        delay: 0.16,
        duration: 0.42,
        peak: 0.74,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'odaiko',
        delay: 0.19,
        peak: 1.0,
        pitchScale: 0.84 * p.pitchScale,
      });
      scheduleNoiseBurst(env, out, p.now, {
        color: 'brown',
        filterType: 'lowpass',
        freqStart: 920,
        freqEnd: 88,
        delay: 0.19,
        attack: 0.015,
        duration: 0.76,
        peak: 0.9,
      });
      scheduleBufferHit(env.ctx, out, env.bank.fireCrackle, p.now, {
        playbackRate: 1.48 * p.pitchScale,
        delay: 0.18,
        duration: 0.36,
        peak: 0.56,
        filterType: 'highpass',
        filterFreq: 1600,
      });
    },
  },

  spellcard_capture: {
    bus: 'sfx',
    cooldownMs: 280,
    defaultGain: 0.7,
    reverbSend: 0.22,
    render: (env, p) => {
      // 符卡收取凯旋：和太鼓双响 + 喜悦古筝上行华彩 + 明亮立体声大调铜管齐奏
      const out = createVoiceInput(env, {
        pan: 0,
        gain: p.gain,
        reverbSend: 0.22,
        hallSend: 0.54,
        drive: 1.4,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'shime',
        peak: 0.72,
        pitchScale: p.pitchScale,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'nagado',
        delay: 0.2,
        peak: 0.88,
        pitchScale: p.pitchScale,
      });
      // 古筝清亮五声上行华彩（D5 - E5 - F#5 - A5 - D6）
      const kotoRun = [587.33, 659.25, 739.99, 880.0, 1174.66];
      kotoRun.forEach((hz, idx) => {
        scheduleBufferHit(env.ctx, out, env.bank.kotoPluck, p.now, {
          playbackRate: kotoRate(hz, p),
          delay: idx * 0.048,
          duration: 0.52,
          peak: 0.36,
          pan: -0.32 + idx * 0.16,
        });
      });
      // 明亮大调铜管定音（D4 + F#4 + A4）
      [293.66, 369.99, 440.0].forEach((hz) => {
        scheduleWarmEnsembleNote(env.ctx, out, p.now, {
          freq: f(hz, p),
          delay: 0.2,
          attack: 0.035,
          duration: 0.68,
          peak: 0.26,
          timbre: 'brass',
          spread: 0.44,
        });
      });
    },
  },

  battle_victory: {
    bus: 'sfx',
    cooldownMs: 450,
    defaultGain: 0.74,
    reverbSend: 0.24,
    render: (env, p) => {
      // 英雄无敌 IV 风格辉煌管弦凯旋：长胴/大太鼓三连进军 + 宽广立体声铜管凯旋号角 + 铜锣古筝礼赞！
      const out = createVoiceInput(env, {
        pan: 0,
        gain: p.gain,
        reverbSend: 0.24,
        hallSend: 0.64,
        drive: 1.5,
      });
      scheduleTaikoDrum(env, out, p.now, { size: 'nagado', delay: 0.0, peak: 0.76, pitchScale: p.pitchScale });
      scheduleTaikoDrum(env, out, p.now, { size: 'nagado', delay: 0.16, peak: 0.82, pitchScale: p.pitchScale });
      scheduleTaikoDrum(env, out, p.now, { size: 'odaiko', delay: 0.32, peak: 0.98, pitchScale: p.pitchScale });
      scheduleBufferHit(env.ctx, out, env.bank.bronzeGong, p.now, {
        playbackRate: 1.15 * p.pitchScale,
        delay: 0.32,
        duration: 1.1,
        peak: 0.42,
      });

      // 宏大立体声铜管号角：D4 → A4 → 辉煌 D大调全和弦（D3 + D4 + F#4 + A4 + D5）
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(293.66, p),
        delay: 0.0,
        duration: 0.22,
        attack: 0.025,
        peak: 0.28,
        timbre: 'brass',
      });
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(440.0, p),
        delay: 0.16,
        duration: 0.22,
        attack: 0.025,
        peak: 0.3,
        timbre: 'brass',
      });
      [
        { hz: 146.83, peak: 0.26 },
        { hz: 293.66, peak: 0.26 },
        { hz: 369.99, peak: 0.24 },
        { hz: 440.0, peak: 0.24 },
        { hz: 587.33, peak: 0.26 },
      ].forEach((n) => {
        scheduleWarmEnsembleNote(env.ctx, out, p.now, {
          freq: f(n.hz, p),
          delay: 0.32,
          attack: 0.04,
          duration: 1.05,
          peak: n.peak,
          timbre: 'brass',
          detuneCents: 10,
          spread: 0.48,
        });
      });

      // 古筝清弦点缀收尾
      [587.33, 880.0, 1174.66].forEach((hz, idx) => {
        scheduleBufferHit(env.ctx, out, env.bank.kotoPluck, p.now, {
          playbackRate: kotoRate(hz, p),
          delay: 0.34 + idx * 0.055,
          duration: 0.72,
          peak: 0.26,
          pan: -0.25 + idx * 0.25,
        });
      });
    },
  },

  battle_defeat: {
    bus: 'sfx',
    cooldownMs: 450,
    defaultGain: 0.68,
    reverbSend: 0.24,
    render: (env, p) => {
      // 战败挽歌：沉缓丧鼓 + 低沉古铜钟余韵 + 立体声深渊低音弦乐小调下行
      const out = createVoiceInput(env, {
        pan: 0,
        gain: p.gain,
        reverbSend: 0.24,
        hallSend: 0.65,
        drive: 1.4,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'odaiko',
        peak: 0.88,
        pitchScale: 0.82 * p.pitchScale,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bronzeGong, p.now, {
        playbackRate: 0.74 * p.pitchScale,
        duration: 1.15,
        peak: 0.5,
        filterFreq: 1800,
        filterEndFreq: 480,
      });
      // 低音 D2 持续沉重底弦
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(73.42, p),
        delay: 0.05,
        attack: 0.08,
        duration: 1.25,
        peak: 0.3,
        timbre: 'dark_strings',
        spread: 0.44,
      });
      // 悲怆下行弦乐旋律（D4 → C4 → Bb3 → A3）
      [293.66, 261.63, 233.08, 220.0].forEach((hz, idx) => {
        scheduleWarmEnsembleNote(env.ctx, out, p.now, {
          freq: f(hz, p),
          delay: 0.04 + idx * 0.2,
          attack: 0.045,
          duration: idx === 3 ? 0.82 : 0.42,
          peak: 0.26,
          timbre: 'dark_strings',
          detuneCents: 11,
          spread: 0.42,
        });
      });
    },
  },
};

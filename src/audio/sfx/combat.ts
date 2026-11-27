/**
 * 行军移动、物理交锋、五类远程弹道、同时反击、擦弹与倒地/阵亡类音效配方
 */

import {
  createVoiceInput,
  scheduleBufferHit,
  scheduleNoiseBurst,
  schedulePunchKick,
  scheduleTaikoDrum,
  scheduleTone,
  scheduleWarmEnsembleNote,
  scheduleWhoosh,
} from '../synthPrimitives';
import { f, kotoRate } from './helpers';
import type { CombatSoundId, SoundRecipe } from './types';

/** 移动与战斗物理交锋音效表 */
export const COMBAT_SFX_CATALOG: Record<CombatSoundId, SoundRecipe> = {
  // ==================== 二、行军踏地与高速掠空 ====================

  move_step_light: {
    bus: 'sfx',
    cooldownMs: 70,
    defaultGain: 0.38,
    reverbSend: 0.08,
    pitchJitter: 0.11,
    render: (env, p) => {
      // 真实林地碎石靴步：轻实脚跟落地 + 樱木闷触 + 细碎沙砾摩挲
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.08,
        lowpassHz: 4200,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 132,
        endHz: 48,
        duration: 0.058,
        peak: 0.52,
      });
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 0.8 * p.pitchScale,
        duration: 0.045,
        peak: 0.36,
        filterFreq: 1400,
      });
      scheduleNoiseBurst(env, out, p.now, {
        color: 'pink',
        filterType: 'bandpass',
        freqStart: 1350,
        freqEnd: 520,
        q: 1.2,
        duration: 0.048,
        peak: 0.34,
      });
    },
  },

  move_step_heavy: {
    bus: 'sfx',
    cooldownMs: 105,
    defaultGain: 0.66,
    reverbSend: 0.18,
    pitchJitter: 0.06,
    render: (env, p) => {
      // 巨像/骨龙/石狮震地重踏：大太鼓级地表冲击 + 布朗低频地震波 + 碎石崩落 + 沉重甲胄微鸣
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.18,
        hallSend: 0.12,
        drive: 2.0,
        lowpassHz: 3800,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'odaiko',
        peak: 0.92,
        pitchScale: 0.86 * p.pitchScale,
      });
      scheduleNoiseBurst(env, out, p.now, {
        color: 'brown',
        filterType: 'lowpass',
        freqStart: 420,
        freqEnd: 78,
        q: 1.1,
        duration: 0.28,
        peak: 0.72,
      });
      scheduleBufferHit(env.ctx, out, env.bank.shatterDebris, p.now, {
        playbackRate: 0.58 * p.pitchScale,
        delay: 0.015,
        duration: 0.14,
        peak: 0.28,
        decayTail: true,
        filterFreq: 1800,
      });
      scheduleBufferHit(env.ctx, out, env.bank.steelClang, p.now, {
        playbackRate: 0.48 * p.pitchScale,
        duration: 0.14,
        peak: 0.22,
        decayTail: true,
        filterFreq: 1100,
      });
    },
  },

  move_fly_whoosh: {
    bus: 'sfx',
    cooldownMs: 120,
    defaultGain: 0.5,
    reverbSend: 0.2,
    pitchJitter: 0.07,
    render: (env, p) => {
      // 振翅疾冲：双层空气动力学破风呼啸 + 起飞气压微震 + 尾部风涡回旋
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.2,
        hallSend: 0.1,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 140,
        endHz: 54,
        duration: 0.095,
        peak: 0.42,
      });
      scheduleWhoosh(env, out, p.now, {
        duration: 0.27,
        peakTimeRatio: 0.34,
        freqStart: 280,
        freqPeak: 2150,
        freqEnd: 520,
        q: 1.7,
        peak: 0.68,
        airMix: 0.44,
      });
      scheduleWhoosh(env, out, p.now, {
        delay: 0.09,
        duration: 0.18,
        peakTimeRatio: 0.3,
        freqStart: 950,
        freqPeak: 1750,
        freqEnd: 420,
        q: 2.0,
        peak: 0.32,
        airMix: 0.25,
      });
    },
  },

  // ==================== 三、HoMM4 物理交锋、五类远程弹道、同时反击与擦弹 ====================

  attack_melee_slash: {
    bus: 'sfx',
    cooldownMs: 55,
    defaultGain: 0.64,
    reverbSend: 0.15,
    pitchJitter: 0.07,
    render: (env, p) => {
      // 真实冷锋斩击：高速破空双层剑风 + 银刃寒光多模态微颤 + 发力短促瞬态
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.15,
        drive: 1.8,
        lowpassHz: 9500,
      });
      scheduleWhoosh(env, out, p.now, {
        duration: 0.165,
        peakTimeRatio: 0.26,
        freqStart: 540,
        freqPeak: 3350,
        freqEnd: 740,
        q: 1.7,
        peak: 0.78,
        airMix: 0.56,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bladeRing, p.now, {
        playbackRate: 1.12 * p.pitchScale,
        playbackRateEnd: 0.94 * p.pitchScale,
        delay: 0.012,
        duration: 0.16,
        peak: 0.48,
        decayTail: true,
        filterType: 'bandpass',
        filterFreq: 2800,
        filterQ: 0.9,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 165,
        endHz: 62,
        duration: 0.07,
        peak: 0.44,
      });
    },
  },

  attack_melee_heavy: {
    bus: 'sfx',
    cooldownMs: 75,
    defaultGain: 0.72,
    reverbSend: 0.2,
    pitchJitter: 0.05,
    render: (env, p) => {
      // 重锤/龙爪/巨像猛挥：浑厚布朗气浪撕裂 + 低音气压震波 + 沉铁回震
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.2,
        hallSend: 0.12,
        drive: 2.6,
        lowpassHz: 5600,
      });
      scheduleWhoosh(env, out, p.now, {
        color: 'brown',
        duration: 0.28,
        peakTimeRatio: 0.34,
        freqStart: 165,
        freqPeak: 960,
        freqEnd: 170,
        q: 1.4,
        peak: 0.9,
        airMix: 0.3,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 145,
        endHz: 32,
        delay: 0.03,
        duration: 0.26,
        peak: 0.92,
      });
      scheduleBufferHit(env.ctx, out, env.bank.steelClang, p.now, {
        playbackRate: 0.54 * p.pitchScale,
        delay: 0.04,
        duration: 0.22,
        peak: 0.34,
        decayTail: true,
        filterFreq: 1650,
      });
    },
  },

  attack_ranged_shot: {
    bus: 'sfx',
    cooldownMs: 50,
    defaultGain: 0.58,
    reverbSend: 0.14,
    pitchJitter: 0.07,
    render: (env, p) => {
      // 通用默认远程发射：真实物理拨弦弹射 + 迅捷破空尾风
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.14,
        drive: 1.4,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bowTwang, p.now, {
        playbackRate: 1.18 * p.pitchScale,
        duration: 0.18,
        peak: 0.72,
      });
      scheduleWhoosh(env, out, p.now, {
        duration: 0.13,
        peakTimeRatio: 0.24,
        freqStart: 950,
        freqPeak: 3100,
        freqEnd: 980,
        q: 2.2,
        peak: 0.58,
        airMix: 0.45,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 190,
        endHz: 74,
        duration: 0.055,
        peak: 0.34,
      });
    },
  },

  // --- 五大经典远程弹道原型专效 ---

  shot_arrow: {
    bus: 'sfx',
    cooldownMs: 48,
    defaultGain: 0.62,
    reverbSend: 0.14,
    pitchJitter: 0.06,
    render: (env, p) => {
      // 【1. 箭矢】Karplus-Strong 真实硬弓绷弦震鸣 + 弓弰扣弦轻响 + 羽箭破空尖啸！
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.14,
        drive: 1.3,
        lowpassHz: 9600,
      });
      // 瞬态：硬木弓弰回弹
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 1.55 * p.pitchScale,
        duration: 0.032,
        peak: 0.44,
      });
      // 实体：Karplus-Strong 物理粗弓弦震动
      scheduleBufferHit(env.ctx, out, env.bank.bowTwang, p.now, {
        playbackRate: 1.04 * p.pitchScale,
        duration: 0.25,
        peak: 0.88,
        filterType: 'lowpass',
        filterFreq: 3400,
      });
      // 尾音：羽箭撕裂空气的高速风啸
      scheduleWhoosh(env, out, p.now, {
        delay: 0.012,
        duration: 0.17,
        peakTimeRatio: 0.22,
        freqStart: 1250,
        freqPeak: 3750,
        freqEnd: 1380,
        q: 2.5,
        peak: 0.62,
        airMix: 0.52,
      });
    },
  },

  shot_light_orb: {
    bus: 'sfx',
    cooldownMs: 48,
    defaultGain: 0.56,
    reverbSend: 0.18,
    pitchJitter: 0.06,
    render: (env, p) => {
      // 【2. 光球】圣洁水晶灵铃弹射 + 清亮古筝高次泛音 + 轻盈光流推送
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.18,
        hallSend: 0.22,
      });
      // 瞬态：璀璨光核凝聚清响
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 1.3 * p.pitchScale,
        duration: 0.24,
        peak: 0.64,
        decayTail: true,
      });
      scheduleBufferHit(env.ctx, out, env.bank.kotoPluck, p.now, {
        playbackRate: kotoRate(1046.5, p), // C6
        duration: 0.18,
        peak: 0.34,
        decayTail: true,
      });
      // 实体：柔和推进底盘
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 185,
        endHz: 92,
        duration: 0.075,
        peak: 0.36,
      });
      // 尾音：丝滑灵光尾流
      scheduleWhoosh(env, out, p.now, {
        color: 'white',
        duration: 0.16,
        peakTimeRatio: 0.28,
        freqStart: 1300,
        freqPeak: 4100,
        freqEnd: 1700,
        q: 2.0,
        peak: 0.34,
        airMix: 0.22,
      });
    },
  },

  shot_dark_orb: {
    bus: 'sfx',
    cooldownMs: 48,
    defaultGain: 0.6,
    reverbSend: 0.2,
    pitchJitter: 0.06,
    render: (env, p) => {
      // 【3. 暗球】幽暗深渊吸气般的低频涡流 + 沉闷冥界铜鸣 + 毒瘴微嘶
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.2,
        hallSend: 0.2,
        drive: 2.0,
        lowpassHz: 4600,
      });
      // 瞬态 + 实体：阴沉压迫脉冲与布朗暗流
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 132,
        endHz: 36,
        duration: 0.15,
        peak: 0.66,
      });
      scheduleWhoosh(env, out, p.now, {
        color: 'brown',
        duration: 0.22,
        peakTimeRatio: 0.42,
        freqStart: 185,
        freqPeak: 920,
        freqEnd: 155,
        q: 2.7,
        peak: 0.72,
        airMix: 0.22,
      });
      // 尾音：压低音色的空洞冥界铜振 + 细微毒瘴噼啪
      scheduleBufferHit(env.ctx, out, env.bank.bronzeGong, p.now, {
        playbackRate: 0.72 * p.pitchScale,
        playbackRateEnd: 0.58 * p.pitchScale,
        duration: 0.24,
        peak: 0.38,
        decayTail: true,
        filterType: 'bandpass',
        filterFreq: 560,
        filterEndFreq: 210,
        filterQ: 1.8,
      });
      scheduleBufferHit(env.ctx, out, env.bank.fireCrackle, p.now, {
        playbackRate: 1.45 * p.pitchScale,
        delay: 0.02,
        duration: 0.16,
        peak: 0.22,
        decayTail: true,
        filterType: 'highpass',
        filterFreq: 2200,
      });
    },
  },

  shot_magic_wave: {
    bus: 'sfx',
    cooldownMs: 48,
    defaultGain: 0.62,
    reverbSend: 0.18,
    pitchJitter: 0.06,
    render: (env, p) => {
      // 【4. 魔法冲击波】新月奥术气刃切风 + 银刃高频共鸣 + 丝滑魔力谐波核
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.18,
        hallSend: 0.18,
        drive: 1.6,
      });
      // 瞬态：高 Q 谐振月牙斩风
      scheduleWhoosh(env, out, p.now, {
        duration: 0.19,
        peakTimeRatio: 0.25,
        freqStart: 680,
        freqPeak: 3900,
        freqEnd: 980,
        q: 3.0,
        peak: 0.74,
        airMix: 0.52,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bladeRing, p.now, {
        playbackRate: 1.32 * p.pitchScale,
        playbackRateEnd: 1.02 * p.pitchScale,
        duration: 0.18,
        peak: 0.46,
        decayTail: true,
      });
      // 实体：短促立体声奥术能量核心 + 推送感
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(587.33, p),
        freqEnd: f(440.0, p),
        duration: 0.16,
        attack: 0.01,
        peak: 0.22,
        timbre: 'pad',
        detuneCents: 12,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 175,
        endHz: 62,
        duration: 0.085,
        peak: 0.42,
      });
    },
  },

  shot_explosive_shell: {
    bus: 'sfx',
    cooldownMs: 52,
    defaultGain: 0.64,
    reverbSend: 0.18,
    pitchJitter: 0.06,
    render: (env, p) => {
      // 【5. 爆裂弹】迫击炮/重型弹射筒闷响 + 高抛弧线风啸 + 滋滋燃烧引信火星！
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.18,
        hallSend: 0.12,
        drive: 2.2,
      });
      // 瞬态 + 实体：沉重弹射炮口压缩气爆
      scheduleTaikoDrum(env, out, p.now, {
        size: 'nagado',
        peak: 0.86,
        pitchScale: 0.88 * p.pitchScale,
      });
      scheduleNoiseBurst(env, out, p.now, {
        color: 'brown',
        filterType: 'lowpass',
        freqStart: 640,
        freqEnd: 135,
        q: 1.2,
        duration: 0.15,
        peak: 0.62,
      });
      // 尾音：滋滋燃烧引信颗粒 + 抛物线重弹破空
      scheduleBufferHit(env.ctx, out, env.bank.fireCrackle, p.now, {
        playbackRate: 1.38 * p.pitchScale,
        delay: 0.025,
        duration: 0.23,
        peak: 0.44,
        decayTail: true,
        filterType: 'highpass',
        filterFreq: 1750,
      });
      scheduleWhoosh(env, out, p.now, {
        delay: 0.02,
        duration: 0.2,
        peakTimeRatio: 0.38,
        freqStart: 560,
        freqPeak: 1450,
        freqEnd: 460,
        q: 2.0,
        peak: 0.36,
        airMix: 0.28,
      });
    },
  },

  hit_impact: {
    bus: 'sfx',
    cooldownMs: 40,
    defaultGain: 0.68,
    reverbSend: 0.14,
    pitchJitter: 0.07,
    render: (env, p) => {
      // 拳拳到肉实战受击：干净胸腔重击 + 实木/皮革钝响瞬态 + 细微护甲骨裂屑
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.14,
        drive: 2.4,
        lowpassHz: 7600,
      });
      // 瞬态：接触点脆裂打击
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 0.9 * p.pitchScale,
        duration: 0.055,
        peak: 0.62,
      });
      scheduleNoiseBurst(env, out, p.now, {
        color: 'pink',
        filterType: 'bandpass',
        freqStart: 2200,
        freqEnd: 480,
        q: 1.1,
        attack: 0.0015,
        duration: 0.068,
        peak: 0.64,
      });
      // 实体：厚实低频胸腔震感
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 180,
        endHz: 38,
        duration: 0.155,
        peak: 0.94,
      });
      // 尾音：短促甲胄微碎
      scheduleBufferHit(env.ctx, out, env.bank.shatterDebris, p.now, {
        playbackRate: 0.8 * p.pitchScale,
        delay: 0.006,
        duration: 0.095,
        peak: 0.34,
        decayTail: true,
        filterFreq: 3200,
      });
    },
  },

  hit_crit: {
    bus: 'sfx',
    cooldownMs: 60,
    defaultGain: 0.78,
    reverbSend: 0.22,
    render: (env, p) => {
      // 致命暴击破甲：震撼次低频深坠 + 冷锻钢甲崩裂 + 立体声碎屑四溅 + 厅堂回响！
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.22,
        hallSend: 0.26,
        drive: 3.0,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 215,
        endHz: 30,
        duration: 0.27,
        peak: 1.0,
      });
      scheduleBufferHit(env.ctx, out, env.bank.steelClang, p.now, {
        playbackRate: 1.16 * p.pitchScale,
        duration: 0.36,
        peak: 0.72,
      });
      scheduleBufferHit(env.ctx, out, env.bank.shatterDebris, p.now, {
        playbackRate: 1.06 * p.pitchScale,
        delay: 0.01,
        duration: 0.26,
        peak: 0.56,
        pan: -0.22,
      });
      scheduleBufferHit(env.ctx, out, env.bank.shatterDebris, p.now, {
        playbackRate: 0.88 * p.pitchScale,
        delay: 0.025,
        duration: 0.24,
        peak: 0.46,
        pan: 0.22,
      });
      scheduleNoiseBurst(env, out, p.now, {
        color: 'brown',
        filterType: 'lowpass',
        freqStart: 620,
        freqEnd: 95,
        duration: 0.22,
        peak: 0.56,
      });
    },
  },

  hit_simultaneous: {
    bus: 'sfx',
    cooldownMs: 85,
    defaultGain: 0.74,
    reverbSend: 0.2,
    render: (env, p) => {
      // HoMM4 灵魂「同时反击」：双剑硬碰金铁交鸣（左右声道微错位双钢刃）+ 火星溅射 + 沉重震波！
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.2,
        hallSend: 0.16,
        drive: 2.6,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 190,
        endHz: 42,
        duration: 0.19,
        peak: 0.86,
      });
      // 左刃钢鸣
      scheduleBufferHit(env.ctx, out, env.bank.steelClang, p.now, {
        playbackRate: 0.94 * p.pitchScale,
        duration: 0.34,
        peak: 0.68,
        pan: -0.26,
      });
      // 右刃 16ms 后错峰对撞（真实双武器相格听感！）
      scheduleBufferHit(env.ctx, out, env.bank.steelClang, p.now, {
        playbackRate: 1.18 * p.pitchScale,
        delay: 0.016,
        duration: 0.32,
        peak: 0.64,
        pan: 0.26,
      });
      // 刃锋擦火
      scheduleBufferHit(env.ctx, out, env.bank.bladeRing, p.now, {
        playbackRate: 1.28 * p.pitchScale,
        delay: 0.008,
        duration: 0.22,
        peak: 0.48,
      });
      scheduleBufferHit(env.ctx, out, env.bank.shatterDebris, p.now, {
        playbackRate: 1.35 * p.pitchScale,
        delay: 0.012,
        duration: 0.16,
        peak: 0.4,
        filterType: 'highpass',
        filterFreq: 2400,
      });
    },
  },

  graze_tick: {
    bus: 'sfx',
    cooldownMs: 38,
    defaultGain: 0.48,
    reverbSend: 0.06,
    pitchJitter: 0.08,
    render: (env, p) => {
      // 东方正作级清冽 GRAZE 擦弹：晶莹微瞬态火花 + 高频气流掠过，清脆上瘾绝不刺耳！
      const out = createVoiceInput(env, { pan: p.pan, gain: p.gain, reverbSend: 0.06 });
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 2.25 * p.pitchScale,
        duration: 0.052,
        peak: 0.54,
        decayTail: true,
        filterType: 'highpass',
        filterFreq: 2200,
      });
      scheduleNoiseBurst(env, out, p.now, {
        color: 'white',
        filterType: 'highpass',
        freqStart: 5200,
        attack: 0.0015,
        duration: 0.036,
        peak: 0.4,
      });
      scheduleTone(env.ctx, out, p.now, {
        type: 'sine',
        freq: f(2950, p),
        freqEnd: f(4300, p),
        attack: 0.0015,
        duration: 0.038,
        peak: 0.18,
      });
    },
  },

  unit_ko: {
    bus: 'sfx',
    cooldownMs: 130,
    defaultGain: 0.68,
    reverbSend: 0.22,
    render: (env, p) => {
      // 英雄重伤倒地：大太鼓重坠 + 钢甲倾落 + 深沉大提琴群哀鸣
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.22,
        hallSend: 0.34,
        drive: 1.8,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'odaiko',
        peak: 0.9,
        pitchScale: 0.85 * p.pitchScale,
      });
      scheduleBufferHit(env.ctx, out, env.bank.steelClang, p.now, {
        playbackRate: 0.66 * p.pitchScale,
        delay: 0.035,
        duration: 0.32,
        peak: 0.42,
        filterFreq: 2200,
      });
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(261.63, p),
        freqEnd: f(174.61, p),
        delay: 0.04,
        duration: 0.56,
        peak: 0.28,
        timbre: 'dark_strings',
      });
      scheduleWarmEnsembleNote(env.ctx, out, p.now, {
        freq: f(196.0, p),
        freqEnd: f(130.81, p),
        delay: 0.04,
        duration: 0.6,
        peak: 0.26,
        timbre: 'dark_strings',
      });
    },
  },

  unit_death: {
    bus: 'sfx',
    cooldownMs: 110,
    defaultGain: 0.6,
    reverbSend: 0.22,
    render: (env, p) => {
      // 兵团覆灭消散：沉重击坠 + 灵骸崩碎微粒 + 沙尘落定 + 暗铜尾音
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.22,
        hallSend: 0.2,
        drive: 1.6,
      });
      schedulePunchKick(env.ctx, out, p.now, {
        startHz: 150,
        endHz: 34,
        duration: 0.22,
        peak: 0.82,
      });
      scheduleBufferHit(env.ctx, out, env.bank.shatterDebris, p.now, {
        playbackRate: 0.82 * p.pitchScale,
        delay: 0.015,
        duration: 0.32,
        peak: 0.54,
      });
      scheduleNoiseBurst(env, out, p.now, {
        color: 'pink',
        filterType: 'bandpass',
        freqStart: 1450,
        freqEnd: 220,
        q: 1.1,
        duration: 0.34,
        peak: 0.46,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bronzeGong, p.now, {
        playbackRate: 0.64 * p.pitchScale,
        delay: 0.02,
        duration: 0.42,
        peak: 0.34,
        decayTail: true,
        filterFreq: 950,
      });
    },
  },
};

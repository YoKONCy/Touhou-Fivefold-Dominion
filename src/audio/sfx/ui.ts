/**
 * 军阵漆木 UI、魔导折本、回合提示与钟声类音效配方
 */

import {
  createVoiceInput,
  scheduleBufferHit,
  scheduleTaikoDrum,
  scheduleWhoosh,
} from '../synthPrimitives';
import { kotoRate } from './helpers';
import type { SoundRecipe, UiSoundId } from './types';

/** UI 交互与回合提示音效表 */
export const UI_SFX_CATALOG: Record<UiSoundId, SoundRecipe> = {
  // ==================== 一、军阵漆木 UI 与魔导折本 ====================

  ui_hover_hex: {
    bus: 'ui',
    cooldownMs: 55,
    defaultGain: 0.17,
    reverbSend: 0.03,
    pitchJitter: 0.05,
    render: (env, p) => {
      // 温润干脆的樱木围棋子轻触棋盘，零电子蜂鸣感
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.03,
        lowpassHz: 3200,
      });
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 1.62 * p.pitchScale,
        duration: 0.04,
        peak: 0.58,
      });
    },
  },

  ui_click: {
    bus: 'ui',
    cooldownMs: 35,
    defaultGain: 0.44,
    reverbSend: 0.08,
    pitchJitter: 0.035,
    render: (env, p) => {
      // 精致漆木卡榫咬合 + 微弱琉璃/黄铜清扣
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.08,
        lowpassHz: 6500,
      });
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 1.16 * p.pitchScale,
        duration: 0.065,
        peak: 0.85,
      });
      scheduleBufferHit(env.ctx, out, env.bank.glassClink, p.now, {
        playbackRate: 1.24 * p.pitchScale,
        delay: 0.004,
        duration: 0.055,
        peak: 0.24,
        decayTail: true,
        filterType: 'bandpass',
        filterFreq: 2600,
        filterQ: 1.2,
      });
    },
  },

  ui_panel_open: {
    bus: 'ui',
    cooldownMs: 75,
    defaultGain: 0.4,
    reverbSend: 0.14,
    render: (env, p) => {
      // 羊皮军卷舒展 + 实木轴扣 + 一缕清雅和风古筝泛音
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.14,
        hallSend: 0.08,
      });
      scheduleWhoosh(env, out, p.now, {
        duration: 0.13,
        peakTimeRatio: 0.36,
        freqStart: 460,
        freqPeak: 1900,
        freqEnd: 880,
        q: 1.5,
        peak: 0.44,
        airMix: 0.25,
      });
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 1.22 * p.pitchScale,
        delay: 0.015,
        duration: 0.055,
        peak: 0.42,
      });
      scheduleBufferHit(env.ctx, out, env.bank.kotoPluck, p.now, {
        playbackRate: kotoRate(587.33, p), // D5
        delay: 0.03,
        duration: 0.26,
        peak: 0.22,
        decayTail: true,
        filterFreq: 3200,
      });
    },
  },

  ui_panel_close: {
    bus: 'ui',
    cooldownMs: 70,
    defaultGain: 0.36,
    reverbSend: 0.08,
    render: (env, p) => {
      // 军卷利落收合 + 沉稳木轴落锁
      const out = createVoiceInput(env, { pan: p.pan, gain: p.gain, reverbSend: 0.08 });
      scheduleWhoosh(env, out, p.now, {
        duration: 0.1,
        peakTimeRatio: 0.28,
        freqStart: 1650,
        freqPeak: 920,
        freqEnd: 360,
        q: 1.6,
        peak: 0.38,
        airMix: 0.2,
      });
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 0.84 * p.pitchScale,
        delay: 0.025,
        duration: 0.075,
        peak: 0.56,
      });
    },
  },

  ui_book_open: {
    bus: 'ui',
    cooldownMs: 100,
    defaultGain: 0.48,
    reverbSend: 0.18,
    render: (env, p) => {
      // 精装魔导书翻开：厚纸双层翻页拟音 + 和风古筝五度拨弦 + 晶莹奥术微光
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.18,
        hallSend: 0.2,
      });
      scheduleWhoosh(env, out, p.now, {
        duration: 0.15,
        peakTimeRatio: 0.34,
        freqStart: 780,
        freqPeak: 2550,
        freqEnd: 1050,
        q: 1.3,
        peak: 0.52,
        airMix: 0.38,
      });
      scheduleBufferHit(env.ctx, out, env.bank.kotoPluck, p.now, {
        playbackRate: kotoRate(587.33, p), // D5
        delay: 0.035,
        duration: 0.42,
        peak: 0.32,
        pan: -0.18,
      });
      scheduleBufferHit(env.ctx, out, env.bank.kotoPluck, p.now, {
        playbackRate: kotoRate(880.0, p), // A5
        delay: 0.085,
        duration: 0.46,
        peak: 0.28,
        pan: 0.18,
      });
      scheduleBufferHit(env.ctx, out, env.bank.crystalChime, p.now, {
        playbackRate: 1.12 * p.pitchScale,
        delay: 0.09,
        duration: 0.32,
        peak: 0.18,
        decayTail: true,
      });
    },
  },

  ui_book_tab: {
    bus: 'ui',
    cooldownMs: 40,
    defaultGain: 0.34,
    reverbSend: 0.08,
    pitchJitter: 0.05,
    render: (env, p) => {
      // 清脆书页速翻 + 轻微纸张折角声
      const out = createVoiceInput(env, { pan: p.pan, gain: p.gain, reverbSend: 0.08 });
      scheduleWhoosh(env, out, p.now, {
        duration: 0.075,
        peakTimeRatio: 0.3,
        freqStart: 1200,
        freqPeak: 3100,
        freqEnd: 1100,
        q: 1.6,
        peak: 0.42,
        airMix: 0.42,
      });
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 1.52 * p.pitchScale,
        delay: 0.01,
        duration: 0.04,
        peak: 0.3,
      });
    },
  },

  ui_blocked: {
    bus: 'ui',
    cooldownMs: 110,
    defaultGain: 0.44,
    reverbSend: 0.08,
    render: (env, p) => {
      // 沉稳重木门闩与闷铜双顿响（体面且有分量的拒绝反馈，告别刺耳蜂鸣器）
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.08,
        lowpassHz: 1800,
      });
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 0.68 * p.pitchScale,
        duration: 0.08,
        peak: 0.78,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bronzeGong, p.now, {
        playbackRate: 0.74 * p.pitchScale,
        duration: 0.11,
        peak: 0.38,
        decayTail: true,
        filterFreq: 680,
      });
      scheduleBufferHit(env.ctx, out, env.bank.woodTap, p.now, {
        playbackRate: 0.56 * p.pitchScale,
        delay: 0.078,
        duration: 0.09,
        peak: 0.72,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bronzeGong, p.now, {
        playbackRate: 0.62 * p.pitchScale,
        delay: 0.078,
        duration: 0.14,
        peak: 0.36,
        decayTail: true,
        filterFreq: 560,
      });
    },
  },

  ui_turn_ready: {
    bus: 'ui',
    cooldownMs: 160,
    defaultGain: 0.4,
    reverbSend: 0.16,
    render: (env, p) => {
      // 东方战棋回合就绪：紧脆缔太鼓单点 + 清亮古筝纯五度起手
      const out = createVoiceInput(env, {
        pan: p.pan,
        gain: p.gain,
        reverbSend: 0.16,
        hallSend: 0.12,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'shime',
        peak: 0.58,
        pitchScale: p.pitchScale,
      });
      scheduleBufferHit(env.ctx, out, env.bank.kotoPluck, p.now, {
        playbackRate: kotoRate(587.33, p), // D5
        delay: 0.025,
        duration: 0.32,
        peak: 0.38,
        pan: -0.14,
      });
      scheduleBufferHit(env.ctx, out, env.bank.kotoPluck, p.now, {
        playbackRate: kotoRate(880.0, p), // A5
        delay: 0.075,
        duration: 0.38,
        peak: 0.36,
        pan: 0.14,
      });
    },
  },

  ui_round_bell: {
    bus: 'ui',
    cooldownMs: 360,
    defaultGain: 0.58,
    reverbSend: 0.24,
    render: (env, p) => {
      // 新巡开战：长胴太鼓 + 震天大太鼓连敲，伴随古社大铜锣在幻想乡夜空厅堂轰然荡开！
      const out = createVoiceInput(env, {
        pan: 0,
        gain: p.gain,
        reverbSend: 0.24,
        hallSend: 0.48,
        drive: 1.4,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'nagado',
        peak: 0.78,
        pitchScale: p.pitchScale,
      });
      scheduleTaikoDrum(env, out, p.now, {
        size: 'odaiko',
        delay: 0.135,
        peak: 0.96,
        pitchScale: p.pitchScale,
      });
      scheduleBufferHit(env.ctx, out, env.bank.bronzeGong, p.now, {
        playbackRate: 0.96 * p.pitchScale,
        delay: 0.135,
        duration: 1.1,
        peak: 0.62,
        filterFreq: 3800,
        filterEndFreq: 950,
      });
    },
  },
};

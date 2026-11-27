/**
 * 电影级纯代码 Web Audio 声学合成积木库（物理建模 PCM + 实时分层混音）
 *
 * 严格遵循 AAA 游戏音效「瞬态 Transient + 实体 Body + 空间尾音 Tail」三层声学设计规范：
 * - 离线 PCM 物理建模样本播放（scheduleBufferHit）：零延迟触发 Karplus-Strong 拨弦、多模态钢/铜/冰/木/琉璃共振、微瞬态颗粒拟音
 * - 空气动力学双层破风扫频（scheduleWhoosh）：铃形包络 + 多普勒带通扫频，呈现真实剑风、羽箭、疾冲与魔浪
 * - 日本和太鼓物理合成（scheduleTaikoDrum）：木槌敲击瞬态 + 圆膜贝塞尔非谐波泛音 [1, 1.59, 2.14] + 鼓腔低频共鸣
 * - 立体声多声部失谐铜管/弦乐群奏（scheduleWarmEnsembleNote）：三声部左右失谐 unison + 动态滤波呼吸，彻底告别塑料单锯齿波电子琴
 * - 温润模拟软饱和（WaveShaperNode）+ 可选主低通去毛刺 + 双空间混响（紧致战场早期反射 + 宏大夜空厅堂）
 */

import {
  createSpatialImpulseResponse,
  type PhysicalSoundBank,
} from './physicalModels';

export interface SynthEnv {
  ctx: AudioContext;
  /** 目标干声总线（如 sfxGain / uiGain） */
  dryBus: AudioNode;
  /** 紧致战场早期反射混响发送总线（0.68s，近场空间定位） */
  wetBus: AudioNode | null;
  /** 宏大幻想乡夜空厅堂混响发送总线（1.85s，用于符卡宣言、大型魔法与凯旋号角） */
  hallWetBus: AudioNode | null;
  /** 共享预烘焙白噪缓冲 */
  whiteNoise: AudioBuffer;
  /** 共享预烘焙粉红噪缓冲（-3dB/oct） */
  pinkNoise: AudioBuffer;
  /** 共享预烘焙布朗噪缓冲（-6dB/oct，雷鸣与重击低盘） */
  brownNoise: AudioBuffer;
  /** 共享预烘焙物理建模与拟音颗粒 PCM 采样库 */
  bank: PhysicalSoundBank;
}

export interface VoiceRouteOptions {
  /** 立体声声像 [-1 左, 1 右] */
  pan?: number;
  /** 紧致战场混响发送比例 [0, 1] */
  reverbSend?: number;
  /** 宏大厅堂混响发送比例 [0, 1] */
  hallSend?: number;
  /** 整体音量系数 */
  gain?: number;
  /** 温和模拟电子管软饱和强度（0 = 清澈透明，1~5 = 温润谐波厚度；避免高频刺耳削波） */
  drive?: number;
  /** 可选声部主低通截止频率（Hz），滤除尖锐数字毛刺 */
  lowpassHz?: number;
}

const driveCurveCache = new Map<number, Float32Array<ArrayBuffer>>();

/** 生成并缓存温和模拟软饱和曲线（平滑过渡，防止硬削波产生塑料蜂鸣毛刺） */
function getDriveCurve(amount: number): Float32Array<ArrayBuffer> {
  const key = Math.max(0.5, Math.min(8, Math.round(amount * 2) / 2));
  const cached = driveCurveCache.get(key);
  if (cached) return cached;

  const samples = 512;
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  // 温和映射系数（0.55x），让 drive 1.5~4.5 带来真实磁带/电子管厚度而非刺耳失真
  const k = Math.max(0.45, key * 0.55);
  const norm = Math.tanh(k);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1;
    // 微量偶次谐波不对称偏置，赋予更暖的模拟质感
    curve[i] = Math.tanh((x + 0.04 * x * x) * k) / norm;
  }
  driveCurveCache.set(key, curve);
  return curve;
}

/** 生成 2 秒可循环白噪声缓冲区 */
export function createWhiteNoiseBuffer(ctx: AudioContext, durationSec = 2): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 0x51a7c3d9;
  for (let i = 0; i < length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = (seed / 4294967296) * 2 - 1;
  }
  return buffer;
}

/** 生成 2 秒温暖粉红噪声缓冲区（-3dB/oct，用于破风、剑气、碎石与气浪） */
export function createPinkNoiseBuffer(ctx: AudioContext, durationSec = 2): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let seed = 0x92b4e137;
  for (let i = 0; i < length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const white = (seed / 4294967296) * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[i] = Math.max(-1, Math.min(1, pink * 0.11));
  }
  return buffer;
}

/**
 * 兼容导出：生成紧致干练的暗夜神社庭院立体声早期反射脉冲响应
 */
export function createShrineImpulseResponse(ctx: AudioContext): AudioBuffer {
  return createSpatialImpulseResponse(ctx, 'battlefield');
}

/** 为单次发声创建软饱和 + 可选高频柔化 + 立体声声像 + 双空间混响路由节点 */
export function createVoiceInput(env: SynthEnv, opts: VoiceRouteOptions = {}): GainNode {
  const input = env.ctx.createGain();
  input.gain.value = opts.gain ?? 1;

  let cur: AudioNode = input;

  if (opts.drive && opts.drive > 0.4 && typeof env.ctx.createWaveShaper === 'function') {
    const shaper = env.ctx.createWaveShaper();
    shaper.curve = getDriveCurve(opts.drive);
    shaper.oversample = '2x';
    cur.connect(shaper);
    cur = shaper;
  }

  if (opts.lowpassHz && opts.lowpassHz > 120 && typeof env.ctx.createBiquadFilter === 'function') {
    const lp = env.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = opts.lowpassHz;
    lp.Q.value = 0.7;
    cur.connect(lp);
    cur = lp;
  }

  if (typeof env.ctx.createStereoPanner === 'function') {
    const panner = env.ctx.createStereoPanner();
    panner.pan.value = Math.max(-0.85, Math.min(0.85, opts.pan ?? 0));
    cur.connect(panner);
    cur = panner;
  }

  cur.connect(env.dryBus);

  const reverbSend = opts.reverbSend ?? 0;
  if (env.wetBus && reverbSend > 0.005) {
    const sendGain = env.ctx.createGain();
    sendGain.gain.value = reverbSend;
    cur.connect(sendGain);
    sendGain.connect(env.wetBus);
  }

  const hallSend = opts.hallSend ?? 0;
  if (env.hallWetBus && hallSend > 0.005) {
    const hallGain = env.ctx.createGain();
    hallGain.gain.value = hallSend;
    cur.connect(hallGain);
    hallGain.connect(env.hallWetBus);
  }

  return input;
}

export interface BufferHitOptions {
  /** 播放倍速（决定音高，如古筝 C5=523.25Hz，rate=freq/523.25 即可弹出精准五声音阶！） */
  playbackRate?: number;
  /** 末端变调倍速（可选，模拟击打后微坠或能量上扬） */
  playbackRateEnd?: number;
  delay?: number;
  offset?: number;
  duration?: number;
  attack?: number;
  peak?: number;
  /** 是否叠加额外指数衰减（适合截短长共鸣缓冲） */
  decayTail?: boolean;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  filterEndFreq?: number;
  filterQ?: number;
  /** 可选单层立体声微偏移（相对父 voice 声像） */
  pan?: number;
}

/**
 * 零开销播放预烘焙物理建模 / 颗粒拟音 PCM 缓冲（Karplus-Strong 弦、钢/铜/冰/木/琉璃多模态、碎裂/火星/气泡）
 */
export function scheduleBufferHit(
  ctx: AudioContext,
  dest: AudioNode,
  buffer: AudioBuffer,
  now: number,
  opts: BufferHitOptions = {},
): void {
  const rate = Math.max(0.25, Math.min(4.0, opts.playbackRate ?? 1));
  const t0 = now + (opts.delay ?? 0);
  const offset = Math.max(0, Math.min(buffer.duration - 0.01, opts.offset ?? 0));
  const naturalDur = Math.max(0.02, (buffer.duration - offset) / rate);
  const dur = Math.min(naturalDur, Math.max(0.02, opts.duration ?? naturalDur));
  const tEnd = t0 + dur;
  const peak = Math.max(0.001, opts.peak ?? 0.72);
  const atk = Math.max(0.001, Math.min(dur * 0.45, opts.attack ?? 0.002));

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.setValueAtTime(rate, t0);
  if (opts.playbackRateEnd && opts.playbackRateEnd !== rate) {
    src.playbackRate.exponentialRampToValueAtTime(
      Math.max(0.2, Math.min(4.0, opts.playbackRateEnd)),
      tEnd,
    );
  }

  let cur: AudioNode = src;

  if (opts.filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType ?? 'lowpass';
    filter.Q.value = opts.filterQ ?? 1.0;
    filter.frequency.setValueAtTime(Math.max(40, opts.filterFreq), t0);
    if (opts.filterEndFreq && opts.filterEndFreq !== opts.filterFreq) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.filterEndFreq), tEnd);
    }
    cur.connect(filter);
    cur = filter;
  }

  const gain = ctx.createGain();
  if (atk <= 0.0025) {
    gain.gain.setValueAtTime(peak, t0);
  } else {
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + atk);
  }

  if (opts.decayTail) {
    gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);
  } else {
    // 保留物理缓冲自身完美的自然衰减曲线，仅在末尾 18ms 平滑收口防咔嗒
    const fadeStart = Math.max(t0 + atk, tEnd - Math.min(0.024, dur * 0.25));
    gain.gain.setValueAtTime(peak, fadeStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);
  }

  cur.connect(gain);
  cur = gain;

  if (opts.pan && Math.abs(opts.pan) > 0.01 && typeof ctx.createStereoPanner === 'function') {
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-0.85, Math.min(0.85, opts.pan));
    cur.connect(panner);
    cur = panner;
  }

  cur.connect(dest);
  src.start(t0, offset, dur * rate + 0.03);
}

export interface WhooshOptions {
  delay?: number;
  duration: number;
  /** 响度达峰时刻比例 0.1..0.7（默认 0.32，呈现自然破风涌起→掠过） */
  peakTimeRatio?: number;
  freqStart: number;
  freqPeak: number;
  freqEnd: number;
  q?: number;
  peak?: number;
  color?: 'pink' | 'brown' | 'white';
  /** 高频风切边缘混入比例 [0, 1]（默认 0.34） */
  airMix?: number;
}

/**
 * 空气动力学双层破风扫频（铃形响度包络 + 多普勒三点频率曲线，专为挥刃、羽箭、疾冲、魔浪与暗流定制）
 */
export function scheduleWhoosh(
  env: SynthEnv,
  dest: AudioNode,
  now: number,
  opts: WhooshOptions,
): void {
  const ctx = env.ctx;
  const t0 = now + (opts.delay ?? 0);
  const dur = Math.max(0.04, opts.duration);
  const peakRatio = Math.max(0.08, Math.min(0.72, opts.peakTimeRatio ?? 0.32));
  const tPeak = t0 + dur * peakRatio;
  const tEnd = t0 + dur;
  const peak = Math.max(0.001, opts.peak ?? 0.55);

  const pickBuf = (c: 'pink' | 'brown' | 'white') =>
    c === 'brown' ? env.brownNoise : c === 'white' ? env.whiteNoise : env.pinkNoise;

  // 第一层：主气流推动声（粉红/布朗噪声 + 多普勒三点带通扫频）
  const bodySrc = ctx.createBufferSource();
  bodySrc.buffer = pickBuf(opts.color ?? 'pink');
  const offset1 = Math.random() * Math.max(0.05, bodySrc.buffer.duration - dur - 0.06);

  const bp1 = ctx.createBiquadFilter();
  bp1.type = 'bandpass';
  bp1.Q.value = opts.q ?? 1.8;
  bp1.frequency.setValueAtTime(Math.max(45, opts.freqStart), t0);
  bp1.frequency.exponentialRampToValueAtTime(Math.max(45, opts.freqPeak), tPeak);
  bp1.frequency.exponentialRampToValueAtTime(Math.max(45, opts.freqEnd), tEnd);

  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(0.0001, t0);
  g1.gain.linearRampToValueAtTime(peak, tPeak);
  g1.gain.exponentialRampToValueAtTime(0.0001, tEnd);

  bodySrc.connect(bp1);
  bp1.connect(g1);
  g1.connect(dest);
  bodySrc.start(t0, offset1, dur + 0.04);

  // 第二层：高速锋刃空气湍流边缘（较高频带通，在达峰瞬间赋予锐利空气撕裂感）
  const airMix = opts.airMix ?? 0.34;
  if (airMix > 0.03) {
    const airSrc = ctx.createBufferSource();
    airSrc.buffer = env.whiteNoise;
    const offset2 = Math.random() * Math.max(0.05, airSrc.buffer.duration - dur - 0.06);

    const bp2 = ctx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.Q.value = (opts.q ?? 1.8) * 1.25;
    bp2.frequency.setValueAtTime(Math.min(11000, Math.max(120, opts.freqStart * 1.9)), t0);
    bp2.frequency.exponentialRampToValueAtTime(Math.min(12000, Math.max(120, opts.freqPeak * 2.15)), tPeak);
    bp2.frequency.exponentialRampToValueAtTime(Math.min(9000, Math.max(120, opts.freqEnd * 1.5)), tEnd);

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t0);
    g2.gain.linearRampToValueAtTime(peak * airMix, tPeak);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.88);

    airSrc.connect(bp2);
    bp2.connect(g2);
    g2.connect(dest);
    airSrc.start(t0, offset2, dur + 0.04);
  }
}

export interface TaikoOptions {
  /** 鼓型尺寸：shime(紧脆缔太鼓) | nagado(标准长胴战鼓) | odaiko(震天巨型大太鼓) */
  size?: 'shime' | 'nagado' | 'odaiko';
  delay?: number;
  peak?: number;
  pitchScale?: number;
}

/**
 * 真实日本和太鼓声学模型：
 * - 瞬态层：硬木鼓槌（Bachi）击打实木鼓框与绷紧牛皮的干脆触感
 * - 鼓面层：圆形膜振动贝塞尔非谐波泛音比 [1.0, 1.59, 2.14] + 冲击张力音高微坠
 * - 鼓腔层：浑厚次低频空气共振与布朗低音炮尾震
 */
export function scheduleTaikoDrum(
  env: SynthEnv,
  dest: AudioNode,
  now: number,
  opts: TaikoOptions = {},
): void {
  const ctx = env.ctx;
  const size = opts.size ?? 'nagado';
  const t0 = now + (opts.delay ?? 0);
  const peak = opts.peak ?? 0.85;
  const ps = opts.pitchScale ?? 1;

  const cfg =
    size === 'shime'
      ? { fStart: 280, fBody: 145, dur: 0.18, woodRate: 1.45, skinFreq: 1950, subMix: 0.25 }
      : size === 'odaiko'
        ? { fStart: 138, fBody: 52, dur: 0.56, woodRate: 0.72, skinFreq: 920, subMix: 0.62 }
        : { fStart: 195, fBody: 78, dur: 0.34, woodRate: 1.0, skinFreq: 1350, subMix: 0.45 };

  // 1. 瞬态层：木槌击打牛皮瞬态（复用物理木声 + 极短牛皮拍击噪）
  scheduleBufferHit(ctx, dest, env.bank.woodTap, now, {
    delay: opts.delay,
    playbackRate: cfg.woodRate * ps,
    peak: peak * 0.46,
    duration: 0.055,
    filterType: 'bandpass',
    filterFreq: cfg.skinFreq,
    filterQ: 0.9,
  });
  scheduleNoiseBurst(env, dest, now, {
    color: 'pink',
    filterType: 'bandpass',
    freqStart: cfg.skinFreq * 1.15,
    freqEnd: cfg.skinFreq * 0.45,
    q: 1.1,
    delay: opts.delay,
    attack: 0.0015,
    duration: 0.032,
    peak: peak * 0.36,
  });

  // 2. 鼓面基频与圆膜非谐波模态（1.0 / 1.59 / 2.14 真实圆形鼓膜比例）
  const headOsc = ctx.createOscillator();
  headOsc.type = 'sine';
  headOsc.frequency.setValueAtTime(cfg.fStart * ps, t0);
  headOsc.frequency.exponentialRampToValueAtTime(cfg.fBody * ps, t0 + Math.min(0.055, cfg.dur * 0.25));
  headOsc.frequency.exponentialRampToValueAtTime(Math.max(26, cfg.fBody * 0.78 * ps), t0 + cfg.dur);

  const headGain = ctx.createGain();
  headGain.gain.setValueAtTime(0.0001, t0);
  headGain.gain.linearRampToValueAtTime(peak * 0.88, t0 + 0.004);
  headGain.gain.exponentialRampToValueAtTime(0.0001, t0 + cfg.dur);
  headOsc.connect(headGain);
  headGain.connect(dest);
  headOsc.start(t0);
  headOsc.stop(t0 + cfg.dur + 0.03);

  // 圆膜高次模态（赋予真实皮革绷紧张力，快速衰减不发嗡）
  const mode1 = ctx.createOscillator();
  mode1.type = 'triangle';
  mode1.frequency.setValueAtTime(cfg.fBody * 1.59 * ps, t0);
  mode1.frequency.exponentialRampToValueAtTime(cfg.fBody * 1.48 * ps, t0 + cfg.dur * 0.42);
  const mode1Gain = ctx.createGain();
  mode1Gain.gain.setValueAtTime(0.0001, t0);
  mode1Gain.gain.linearRampToValueAtTime(peak * 0.26, t0 + 0.003);
  mode1Gain.gain.exponentialRampToValueAtTime(0.0001, t0 + cfg.dur * 0.42);
  mode1.connect(mode1Gain);
  mode1Gain.connect(dest);
  mode1.start(t0);
  mode1.stop(t0 + cfg.dur * 0.45);

  // 3. 鼓腔次低频布朗空气冲击
  scheduleNoiseBurst(env, dest, now, {
    color: 'brown',
    filterType: 'lowpass',
    freqStart: size === 'odaiko' ? 190 : 260,
    freqEnd: 75,
    q: 0.9,
    delay: opts.delay,
    attack: 0.004,
    duration: cfg.dur * 0.82,
    peak: peak * cfg.subMix,
  });
}

export interface EnsembleNoteOptions {
  freq: number;
  freqEnd?: number;
  delay?: number;
  attack?: number;
  duration: number;
  peak?: number;
  /** 音色原型：brass(宽宏铜管号角) | pad(神圣丝绒和声) | dark_strings(深渊低音大提琴群) | choir(空灵人声共振峰) */
  timbre?: 'brass' | 'pad' | 'dark_strings' | 'choir';
  /** 立体声失谐音分（默认 9 cents，制造真实管弦乐群奏宽度） */
  detuneCents?: number;
  /** 立体声声场展开宽度 [0, 0.7] */
  spread?: number;
}

/**
 * 立体声三声部失谐群奏合成器（铜管/圣光和声/深渊弦乐）
 * 彻底取代“干瘪单锯齿波电子贺卡音效”，用三声部微失谐 + 动态滤波呼吸塑造电影级宏大配乐感！
 */
export function scheduleWarmEnsembleNote(
  ctx: AudioContext,
  dest: AudioNode,
  now: number,
  opts: EnsembleNoteOptions,
): void {
  const t0 = now + (opts.delay ?? 0);
  const dur = Math.max(0.08, opts.duration);
  const tEnd = t0 + dur;
  const peak = Math.max(0.001, opts.peak ?? 0.28);
  const timbre = opts.timbre ?? 'brass';
  const detune = opts.detuneCents ?? (timbre === 'brass' ? 8 : 11);
  const spread = opts.spread ?? 0.36;

  const atk = Math.max(
    0.008,
    opts.attack ?? (timbre === 'brass' ? 0.028 : timbre === 'dark_strings' ? 0.05 : 0.06),
  );

  // 动态滤波呼吸轮廓（模拟铜管吹奏吐音亮起 / 丝绒和声渐展）
  const filter = ctx.createBiquadFilter();
  if (timbre === 'choir') {
    filter.type = 'bandpass';
    filter.Q.value = 1.6;
    filter.frequency.setValueAtTime(Math.max(420, Math.min(1800, opts.freq * 2.2)), t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(380, Math.min(1400, opts.freq * 1.6)), tEnd);
  } else {
    filter.type = 'lowpass';
    filter.Q.value = timbre === 'brass' ? 1.15 : 0.8;
    const fStart =
      timbre === 'brass'
        ? Math.min(1200, opts.freq * 2.2)
        : timbre === 'dark_strings'
          ? Math.min(700, opts.freq * 1.9)
          : Math.min(1400, opts.freq * 2.5);
    const fPeak =
      timbre === 'brass'
        ? Math.min(3600, opts.freq * 6.5)
        : timbre === 'dark_strings'
          ? Math.min(1650, opts.freq * 4.2)
          : Math.min(2600, opts.freq * 5.0);
    const fEnd = Math.max(240, fStart * 0.72);
    const swellT = t0 + Math.min(dur * 0.35, atk + 0.06);

    filter.frequency.setValueAtTime(Math.max(120, fStart), t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(180, fPeak), swellT);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, fEnd), tEnd);
  }

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(0.0001, t0);
  envGain.gain.linearRampToValueAtTime(peak, t0 + atk);
  // 保持自然饱满的能量平台，后半段柔和淡出
  const sustainUntil = t0 + Math.max(atk + 0.01, dur * 0.58);
  envGain.gain.setValueAtTime(peak * 0.86, sustainUntil);
  envGain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

  filter.connect(envGain);
  envGain.connect(dest);

  const voices: Array<{ type: OscillatorType; cents: number; pan: number; vol: number }> =
    timbre === 'pad'
      ? [
          { type: 'triangle', cents: -detune, pan: -spread, vol: 0.42 },
          { type: 'sine', cents: 0, pan: 0, vol: 0.48 },
          { type: 'triangle', cents: detune, pan: spread, vol: 0.42 },
        ]
      : timbre === 'dark_strings'
        ? [
            { type: 'sawtooth', cents: -detune * 1.2, pan: -spread, vol: 0.34 },
            { type: 'triangle', cents: 0, pan: 0, vol: 0.48 },
            { type: 'sawtooth', cents: detune * 1.2, pan: spread, vol: 0.34 },
          ]
        : [
            { type: 'sawtooth', cents: -detune, pan: -spread, vol: 0.35 },
            { type: 'triangle', cents: 0, pan: 0, vol: 0.42 },
            { type: 'sawtooth', cents: detune, pan: spread, vol: 0.35 },
          ];

  for (const v of voices) {
    const osc = ctx.createOscillator();
    osc.type = v.type;
    osc.frequency.setValueAtTime(Math.max(24, opts.freq), t0);
    if (opts.freqEnd && opts.freqEnd !== opts.freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, opts.freqEnd), tEnd);
    }
    osc.detune.setValueAtTime(v.cents, t0);

    const vg = ctx.createGain();
    vg.gain.value = v.vol;
    osc.connect(vg);

    if (Math.abs(v.pan) > 0.01 && typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = v.pan;
      vg.connect(p);
      p.connect(filter);
    } else {
      vg.connect(filter);
    }

    osc.start(t0);
    osc.stop(tEnd + 0.03);
  }
}

export interface ToneOptions {
  type?: OscillatorType;
  freq: number;
  freqEnd?: number;
  delay?: number;
  attack?: number;
  duration: number;
  peak?: number;
  fmRatio?: number;
  fmIndex?: number;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  filterEndFreq?: number;
  filterQ?: number;
}

/** 播放单个带包络、滑音与可选 FM/滤波的合成乐音 */
export function scheduleTone(
  ctx: AudioContext,
  dest: AudioNode,
  now: number,
  opts: ToneOptions,
): void {
  const t0 = now + (opts.delay ?? 0);
  const atk = Math.max(0.0015, opts.attack ?? 0.004);
  const dur = Math.max(0.02, opts.duration);
  const tEnd = t0 + dur;
  const peak = Math.max(0.001, opts.peak ?? 0.35);

  const osc = ctx.createOscillator();
  osc.type = opts.type ?? 'triangle';
  osc.frequency.setValueAtTime(Math.max(20, opts.freq), t0);
  if (opts.freqEnd && opts.freqEnd !== opts.freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), tEnd);
  }

  if (opts.fmRatio && opts.fmIndex) {
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    mod.type = 'sine';
    mod.frequency.setValueAtTime(Math.max(20, opts.freq * opts.fmRatio), t0);
    modGain.gain.setValueAtTime(opts.fmIndex, t0);
    modGain.gain.exponentialRampToValueAtTime(Math.max(1, opts.fmIndex * 0.06), tEnd);
    mod.connect(modGain);
    modGain.connect(osc.frequency);
    mod.start(t0);
    mod.stop(tEnd + 0.02);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + atk);
  gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

  if (opts.filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType ?? 'lowpass';
    filter.Q.value = opts.filterQ ?? 1.2;
    filter.frequency.setValueAtTime(opts.filterFreq, t0);
    if (opts.filterEndFreq) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(60, opts.filterEndFreq), tEnd);
    }
    osc.connect(filter);
    filter.connect(gain);
  } else {
    osc.connect(gain);
  }

  gain.connect(dest);
  osc.start(t0);
  osc.stop(tEnd + 0.03);
}

/** 专用硬核次低频胸腔冲击基元（快速瞬态下潜 + 干净低频震波，绝不混浊） */
export function schedulePunchKick(
  ctx: AudioContext,
  dest: AudioNode,
  now: number,
  opts: {
    startHz?: number;
    endHz?: number;
    delay?: number;
    duration?: number;
    peak?: number;
  } = {},
): void {
  const t0 = now + (opts.delay ?? 0);
  const dur = opts.duration ?? 0.16;
  const startHz = opts.startHz ?? 165;
  const endHz = opts.endHz ?? 38;
  const peak = opts.peak ?? 0.85;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startHz, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(24, endHz * 1.45), t0 + Math.min(0.036, dur * 0.28));
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), t0 + dur);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.0025);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export interface NoiseBurstOptions {
  color?: 'white' | 'pink' | 'brown';
  filterType?: BiquadFilterType;
  freqStart: number;
  freqEnd?: number;
  q?: number;
  delay?: number;
  attack?: number;
  duration: number;
  peak?: number;
}

/** 播放滤波噪声瞬态（支持白噪/粉红噪/布朗低频雷鸣噪） */
export function scheduleNoiseBurst(
  env: SynthEnv,
  dest: AudioNode,
  now: number,
  opts: NoiseBurstOptions,
): void {
  const ctx = env.ctx;
  const t0 = now + (opts.delay ?? 0);
  const atk = Math.max(0.0015, opts.attack ?? 0.004);
  const dur = Math.max(0.018, opts.duration);
  const tEnd = t0 + dur;
  const peak = Math.max(0.001, opts.peak ?? 0.35);

  const src = ctx.createBufferSource();
  src.buffer =
    opts.color === 'white'
      ? env.whiteNoise
      : opts.color === 'brown'
        ? env.brownNoise
        : env.pinkNoise;
  const maxOffset = Math.max(0.05, src.buffer.duration - dur - 0.05);
  const offset = Math.random() * maxOffset;

  const filter = ctx.createBiquadFilter();
  filter.type = opts.filterType ?? 'bandpass';
  filter.Q.value = opts.q ?? 1.4;
  filter.frequency.setValueAtTime(Math.max(40, opts.freqStart), t0);
  if (opts.freqEnd && opts.freqEnd !== opts.freqStart) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), tEnd);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + atk);
  gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(t0, offset, dur + 0.03);
}

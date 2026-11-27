/**
 * 离线 PCM 物理建模与拟音颗粒声学合成库（零静态音频依赖）
 *
 * 根治传统 Web Audio「塑料电子蜂鸣器」的四大声学基石：
 * 1. Karplus-Strong 真实物理拨弦算法（硬弓绷弦、和风古筝、魔导晶弦）：在 44.1kHz 浮点 PCM 上直接求解延迟滤波反馈方程，
 *    完全规避实时 AudioWorklet / DelayNode 128-sample 最小块延迟瓶颈，音准精确且泛音衰减极度自然！
 * 2. Modal Synthesis 多模态实测材质共振（钢刃、古铜锣、冰晶、实木、琉璃）：基于真实物理模态频率比与按频率递减的阻尼常数，
 *    经短瞬态敲击激励，发出真实的金属/木石/冰晶共鸣而非电子正弦波！
 * 3. Granular Foley 微瞬态拟音簇（冰霜咔嚓碎裂、火焰噼啪爆裂、碎石/甲胄溅落、药水咕嘟）：模拟真实世界的离散微观碰撞事件！
 * 4. 双空间立体声早期反射脉冲响应（紧致战场早期反射 0.68s + 宏大幻想乡夜空厅堂 1.85s）：赋予干湿层次与电影级宽广声场！
 */

export type ModalMaterial = 'steel' | 'bronze' | 'crystal' | 'wood' | 'glass';

/** 确定性伪随机数发生器（LCG），确保所有预烘焙缓冲波形纯净稳定 */
function makePrng(initialSeed: number): () => number {
  let s = initialSeed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 峰值归一化并施加轻柔软限幅（防止单缓冲内部出现刺耳数字削波） */
function normalizeBufferData(data: Float32Array, targetPeak = 0.88): void {
  let maxAbs = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > maxAbs) maxAbs = a;
  }
  if (maxAbs < 1e-6) return;
  const scale = targetPeak / maxAbs;
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.tanh(data[i] * scale * 1.15) / Math.tanh(1.15);
  }
}

/**
 * 生成 2 秒布朗低频雷鸣噪声缓冲区（-6dB/oct，专为重击轰鸣、爆炸滚雷、巨像震地与魔炮气压定制）
 */
export function createBrownNoiseBuffer(ctx: AudioContext, durationSec = 2): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const rnd = makePrng(0x7c3e91a5);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = rnd() * 2 - 1;
    last = (last + 0.025 * white) / 1.025;
    data[i] = last * 3.2;
  }
  normalizeBufferData(data, 0.85);
  return buffer;
}

/**
 * 1. Karplus-Strong 真实物理拨弦合成器（离线浮点 PCM 求解）
 * @param freq 基频（Hz），如硬弓弦 145Hz、和风古筝 440Hz
 * @param durationSec 持续时长（秒）
 * @param damping 阻尼系数 0.05..0.55（越小延音越清亮金属，越大越闷厚像粗弓弦/木琴）
 * @param brightness 初始拨弦激励高频亮度 0.2..1.0
 */
export function renderKarplusStringBuffer(
  ctx: AudioContext,
  opts: {
    freq: number;
    durationSec: number;
    damping?: number;
    brightness?: number;
    pluckPos?: number;
    seed?: number;
  },
): AudioBuffer {
  const sr = ctx.sampleRate;
  const length = Math.max(64, Math.floor(sr * opts.durationSec));
  const buffer = ctx.createBuffer(1, length, sr);
  const out = buffer.getChannelData(0);
  const rnd = makePrng(opts.seed ?? 0x31415926);

  const period = Math.max(8, Math.round(sr / Math.max(40, opts.freq)));
  const ring = new Float32Array(period);
  const brightness = Math.max(0.15, Math.min(1, opts.brightness ?? 0.72));
  const decayFactor = 1 - Math.max(0.0008, Math.min(0.035, (opts.damping ?? 0.16) * 0.04));
  const pluckIdx = Math.max(1, Math.min(period - 1, Math.floor(period * (opts.pluckPos ?? 0.28))));

  // 1) 初始化拨弦激励波（经一阶低通柔化的噪声 + 拨弦位置梳状滤波，还原真实手指/箭羽拨弦音色！）
  let lp = 0;
  for (let i = 0; i < period; i++) {
    const w = rnd() * 2 - 1;
    lp += (w - lp) * brightness;
    ring[i] = lp;
  }
  // 模拟拨弦位置造成的谐波凹口（梳状相消，消除生硬全频白噪感）
  const excited = new Float32Array(period);
  for (let i = 0; i < period; i++) {
    excited[i] = ring[i] - 0.65 * ring[(i + pluckIdx) % period];
  }
  ring.set(excited);

  // 2) Karplus-Strong 延迟环递推迭代（两点平均阻尼滤波器自然吸收高频能量）
  let ptr = 0;
  let prevSample = ring[period - 1];
  for (let i = 0; i < length; i++) {
    const cur = ring[ptr];
    // 真实弓弦/琴弦的自然高频吸收：随着时间推移能量平滑衰减
    const filtered = (cur * 0.54 + prevSample * 0.46) * decayFactor;
    ring[ptr] = filtered;
    prevSample = cur;
    // 末端 30ms 平滑淡出，杜绝截断咔嗒
    const tailFade = i > length - sr * 0.03 ? (length - i) / (sr * 0.03) : 1;
    out[i] = cur * Math.max(0, tailFade);
    ptr = (ptr + 1) % period;
  }

  normalizeBufferData(out, 0.88);
  return buffer;
}

/** 实测物理材料的多模态共振参数表（非谐波频率比、相对振幅、衰减速率倍率） */
const MODAL_PROFILES: Record<
  ModalMaterial,
  {
    ratios: number[];
    amps: number[];
    decayRates: number[];
    clickMs: number;
    clickGain: number;
  }
> = {
  // 冷锻钢刃（清脆冷冽的高频非整数泛音，真实刀剑交鸣）
  steel: {
    ratios: [1.0, 2.756, 4.18, 5.404, 7.21, 8.933, 11.42],
    amps: [0.55, 0.88, 0.65, 0.72, 0.44, 0.36, 0.22],
    decayRates: [4.2, 5.8, 7.6, 10.5, 14.0, 18.5, 24.0],
    clickMs: 6,
    clickGain: 0.75,
  },
  // 古社铜锣 / 黄铜卡榫（丰满中频泛音 + 微弱拍频震颤）
  bronze: {
    ratios: [1.0, 1.008, 2.02, 2.76, 3.89, 5.14, 6.72],
    amps: [0.9, 0.52, 0.68, 0.56, 0.38, 0.26, 0.15],
    decayRates: [2.2, 2.4, 3.8, 5.2, 7.4, 10.5, 14.0],
    clickMs: 9,
    clickGain: 0.52,
  },
  // 极寒冰晶 / 奥术水晶（晶莹剔透的超高泛音簇，几乎无低频闷噪）
  crystal: {
    ratios: [1.0, 2.32, 3.58, 4.91, 6.74, 9.18, 12.05],
    amps: [0.45, 0.85, 0.78, 0.66, 0.52, 0.38, 0.25],
    decayRates: [3.2, 4.4, 6.0, 8.2, 11.0, 15.0, 20.0],
    clickMs: 4,
    clickGain: 0.6,
  },
  // 实心樱木 / 漆木战棋落子（短促紧实的温润中低频共振）
  wood: {
    ratios: [1.0, 2.57, 4.64, 6.82],
    amps: [1.0, 0.62, 0.34, 0.16],
    decayRates: [24.0, 42.0, 68.0, 95.0],
    clickMs: 5,
    clickGain: 0.65,
  },
  // 秘药玻璃瓶（清亮短促双峰共振）
  glass: {
    ratios: [1.0, 2.41, 4.28, 6.95],
    amps: [0.72, 0.9, 0.54, 0.28],
    decayRates: [9.0, 13.5, 20.0, 30.0],
    clickMs: 4,
    clickGain: 0.55,
  },
};

/**
 * 2. 多模态材质物理撞击合成器（离线 PCM 精确叠加多模态衰减正弦 + 接触瞬态）
 * 彻底替代“单锯齿波 + FM 瞎猜”的塑料金属声！
 */
export function renderModalImpactBuffer(
  ctx: AudioContext,
  opts: {
    material: ModalMaterial;
    baseFreq: number;
    durationSec: number;
    pitchBend?: number;
    seed?: number;
  },
): AudioBuffer {
  const sr = ctx.sampleRate;
  const length = Math.max(64, Math.floor(sr * opts.durationSec));
  const buffer = ctx.createBuffer(1, length, sr);
  const out = buffer.getChannelData(0);
  const profile = MODAL_PROFILES[opts.material];
  const rnd = makePrng(opts.seed ?? 0x27182818);

  const phases = profile.ratios.map(() => rnd() * Math.PI * 2);
  const bend = opts.pitchBend ?? 0;
  const clickSamples = Math.max(12, Math.floor((profile.clickMs / 1000) * sr));

  // 接触瞬态噪声激励（前几毫秒的物理表面撞击摩擦声）
  let prevN = 0;
  for (let i = 0; i < Math.min(length, clickSamples * 2); i++) {
    const u = i / clickSamples;
    const env = Math.exp(-u * 3.4);
    const w = rnd() * 2 - 1;
    // 钢/水晶保留高频尖锐瞬态，木/铜偏温润中频
    const hp = opts.material === 'steel' || opts.material === 'crystal' ? w - prevN * 0.72 : (w + prevN) * 0.5;
    prevN = w;
    out[i] += hp * env * profile.clickGain;
  }

  // 多模态阻尼振子精准叠加（包含撞击瞬间微小的结构形变音高微坠）
  const modeCount = profile.ratios.length;
  for (let m = 0; m < modeCount; m++) {
    const f0 = opts.baseFreq * profile.ratios[m];
    if (f0 > sr * 0.44) continue;
    const amp = profile.amps[m];
    const decay = profile.decayRates[m];
    let ph = phases[m];
    const twoPiOverSr = (Math.PI * 2) / sr;
    for (let i = 0; i < length; i++) {
      const t = i / sr;
      const env = Math.exp(-decay * t);
      if (env < 0.0004) break;
      const freqNow = bend !== 0 ? f0 * (1 + bend * Math.exp(-t * 28)) : f0;
      ph += freqNow * twoPiOverSr;
      // 极短 1.5ms 起振柔化防爆点
      const atk = i < 64 ? i / 64 : 1;
      out[i] += Math.sin(ph) * amp * env * atk;
    }
  }

  // 尾部柔和收口
  const fadeN = Math.min(length, Math.floor(sr * 0.025));
  for (let i = 0; i < fadeN; i++) {
    out[length - 1 - i] *= i / fadeN;
  }

  normalizeBufferData(out, 0.88);
  return buffer;
}

/**
 * 3. 颗粒拟音微瞬态簇合成器（冰碎咔嚓、火焰噼啪、碎石溅落、液体冒泡）
 */
export function renderGranularCrackleBuffer(
  ctx: AudioContext,
  opts: {
    durationSec: number;
    grainCount: number;
    minFreq: number;
    maxFreq: number;
    grainMs: number;
    style: 'shatter' | 'crackle' | 'bubble';
    seed?: number;
  },
): AudioBuffer {
  const sr = ctx.sampleRate;
  const length = Math.max(64, Math.floor(sr * opts.durationSec));
  const buffer = ctx.createBuffer(1, length, sr);
  const out = buffer.getChannelData(0);
  const rnd = makePrng(opts.seed ?? 0x89abcdef);

  for (let g = 0; g < opts.grainCount; g++) {
    // 越靠前的微粒越密集，自然呈现爆发→散落的物理节奏！
    const timeNorm = Math.pow(rnd(), opts.style === 'bubble' ? 1.0 : 1.75);
    const startIdx = Math.floor(timeNorm * Math.max(1, length - sr * 0.04));
    const grainLen = Math.max(
      24,
      Math.floor(((opts.grainMs * (0.65 + rnd() * 0.85)) / 1000) * sr),
    );
    const fStart = opts.minFreq + rnd() * (opts.maxFreq - opts.minFreq);
    const amp = (0.35 + rnd() * 0.65) * (1 - timeNorm * 0.45);
    let ph = rnd() * Math.PI * 2;
    const twoPiOverSr = (Math.PI * 2) / sr;

    for (let i = 0; i < grainLen; i++) {
      const idx = startIdx + i;
      if (idx >= length) break;
      const u = i / grainLen;
      const env = Math.sin(u * Math.PI) * Math.exp(-u * (opts.style === 'bubble' ? 1.2 : 3.2));
      if (opts.style === 'bubble') {
        // 液体冒泡：音高迅速上扬的短正弦气泡（真实药水咕嘟声！）
        const fNow = fStart * (1 + u * 1.45);
        ph += fNow * twoPiOverSr;
        out[idx] += Math.sin(ph) * env * amp;
      } else if (opts.style === 'shatter') {
        // 冰晶/护甲崩碎：高 Q 双音谐波 + 锐利微点击
        ph += fStart * twoPiOverSr;
        const click = i < 14 ? (rnd() * 2 - 1) * (1 - i / 14) : 0;
        out[idx] += (Math.sin(ph) * 0.7 + Math.sin(ph * 2.37) * 0.35 + click * 0.6) * env * amp;
      } else {
        // 火焰/电弧噼啪：短脉冲噪声尖峰 + 轻微高音脆裂
        const snap = (rnd() * 2 - 1) * (i < 22 ? 1.2 : 0.45);
        ph += fStart * twoPiOverSr;
        out[idx] += (snap * 0.7 + Math.sin(ph) * 0.3) * env * amp;
      }
    }
  }

  normalizeBufferData(out, 0.86);
  return buffer;
}

/**
 * 4. 立体声真实空间脉冲响应（含精确早期反射 Tap + 频变高频空气吸收尾音）
 * - battlefield (0.68s)：紧致干练的暗夜神社庭院早期反射，拳拳到肉且立体通透；
 * - hall (1.85s)：宽阔华丽的幻想乡夜空大殿大厅混响，赋予符卡、圣疗、号角电影级气势！
 */
export function createSpatialImpulseResponse(
  ctx: AudioContext,
  preset: 'battlefield' | 'hall',
): AudioBuffer {
  const sr = ctx.sampleRate;
  const durationSec = preset === 'hall' ? 1.85 : 0.68;
  const length = Math.max(1, Math.floor(sr * durationSec));
  const buffer = ctx.createBuffer(2, length, sr);

  // 左右声道错开的早期反射点阵（ms），制造真实宽广立体声像！
  const earlyTapsL =
    preset === 'hall'
      ? [
          { ms: 14, g: 0.48 },
          { ms: 29, g: 0.36 },
          { ms: 47, g: 0.28 },
          { ms: 68, g: 0.22 },
          { ms: 94, g: 0.16 },
        ]
      : [
          { ms: 9, g: 0.42 },
          { ms: 19, g: 0.28 },
          { ms: 33, g: 0.18 },
        ];
  const earlyTapsR =
    preset === 'hall'
      ? [
          { ms: 18, g: 0.46 },
          { ms: 35, g: 0.34 },
          { ms: 54, g: 0.26 },
          { ms: 77, g: 0.2 },
          { ms: 105, g: 0.15 },
        ]
      : [
          { ms: 12, g: 0.4 },
          { ms: 24, g: 0.26 },
          { ms: 39, g: 0.17 },
        ];

  const decayExp = preset === 'hall' ? 2.6 : 3.4;
  const preDelaySamples = Math.floor(((preset === 'hall' ? 16 : 6) / 1000) * sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    const rnd = makePrng(ch === 0 ? 0x13579bdf : 0x2468ace1);
    const taps = ch === 0 ? earlyTapsL : earlyTapsR;

    // 1) 注入早期反射离散脉冲（经 3 采样柔化防金属梳状尖峰）
    for (const tap of taps) {
      const idx = Math.floor((tap.ms / 1000) * sr);
      if (idx + 3 < length) {
        data[idx] += tap.g * 0.55;
        data[idx + 1] += tap.g * 0.85;
        data[idx + 2] += tap.g * 0.45;
      }
    }

    // 2) 随时间平滑增强高频吸收的扩散尾音（模拟空气与木石墙壁吸声，温润不发刺！）
    let lp1 = 0;
    let lp2 = 0;
    for (let i = preDelaySamples; i < length; i++) {
      const u = (i - preDelaySamples) / Math.max(1, length - preDelaySamples);
      const env = Math.pow(1 - u, decayExp) * Math.min(1, (i - preDelaySamples) / (sr * 0.025));
      const white = rnd() * 2 - 1;
      // 高频空气吸收随时间加深
      const cutoffAlpha = (preset === 'hall' ? 0.34 : 0.28) * (1 - u * 0.78);
      lp1 += (white - lp1) * cutoffAlpha;
      lp2 += (lp1 - lp2) * (cutoffAlpha * 1.15);
      data[i] += lp2 * env * (preset === 'hall' ? 0.62 : 0.54);
    }
  }

  return buffer;
}

/** 预烘焙物理建模样本库（引擎启动 unlock 时一次性合成缓存，毫秒级耗时、播放零计算开销！） */
export interface PhysicalSoundBank {
  /** 硬弓绷弦发箭（150Hz 厚实弓弦） */
  bowTwang: AudioBuffer;
  /** 东方和风古筝/清弦（523Hz C5） */
  kotoPluck: AudioBuffer;
  /** 冷锻钢刃金铁交鸣（520Hz 基频多模态） */
  steelClang: AudioBuffer;
  /** 轻盈银刃划破（860Hz 高频多模态） */
  bladeRing: AudioBuffer;
  /** 古社大铜锣/神乐铜鸣（165Hz 浑厚多模态） */
  bronzeGong: AudioBuffer;
  /** 极寒冰晶/护盾水晶清鸣（780Hz 晶莹多模态） */
  crystalChime: AudioBuffer;
  /** 实心樱木棋子/卡榫敲击（310Hz 干脆木声） */
  woodTap: AudioBuffer;
  /** 秘药玻璃瓶轻碰（980Hz 琉璃双峰） */
  glassClink: AudioBuffer;
  /** 冰晶/甲胄微瞬态碎裂簇 */
  shatterDebris: AudioBuffer;
  /** 火焰/电弧噼啪爆裂微瞬态簇 */
  fireCrackle: AudioBuffer;
  /** 秘药液体咕嘟冒泡簇 */
  liquidBubble: AudioBuffer;
}

/** 一次性预烘焙全套 11 组高精度物理建模与拟音 PCM 采样 */
export function buildPhysicalSoundBank(ctx: AudioContext): PhysicalSoundBank {
  return {
    bowTwang: renderKarplusStringBuffer(ctx, {
      freq: 152,
      durationSec: 0.28,
      damping: 0.34,
      brightness: 0.62,
      pluckPos: 0.22,
      seed: 101,
    }),
    kotoPluck: renderKarplusStringBuffer(ctx, {
      freq: 523.25,
      durationSec: 0.75,
      damping: 0.09,
      brightness: 0.85,
      pluckPos: 0.18,
      seed: 202,
    }),
    steelClang: renderModalImpactBuffer(ctx, {
      material: 'steel',
      baseFreq: 510,
      durationSec: 0.42,
      pitchBend: 0.035,
      seed: 303,
    }),
    bladeRing: renderModalImpactBuffer(ctx, {
      material: 'steel',
      baseFreq: 860,
      durationSec: 0.28,
      pitchBend: 0.025,
      seed: 404,
    }),
    bronzeGong: renderModalImpactBuffer(ctx, {
      material: 'bronze',
      baseFreq: 162,
      durationSec: 1.15,
      pitchBend: -0.015,
      seed: 505,
    }),
    crystalChime: renderModalImpactBuffer(ctx, {
      material: 'crystal',
      baseFreq: 780,
      durationSec: 0.62,
      pitchBend: 0.01,
      seed: 606,
    }),
    woodTap: renderModalImpactBuffer(ctx, {
      material: 'wood',
      baseFreq: 315,
      durationSec: 0.11,
      pitchBend: 0.04,
      seed: 707,
    }),
    glassClink: renderModalImpactBuffer(ctx, {
      material: 'glass',
      baseFreq: 960,
      durationSec: 0.18,
      seed: 808,
    }),
    shatterDebris: renderGranularCrackleBuffer(ctx, {
      durationSec: 0.42,
      grainCount: 28,
      minFreq: 1400,
      maxFreq: 5200,
      grainMs: 14,
      style: 'shatter',
      seed: 909,
    }),
    fireCrackle: renderGranularCrackleBuffer(ctx, {
      durationSec: 0.52,
      grainCount: 34,
      minFreq: 500,
      maxFreq: 3400,
      grainMs: 11,
      style: 'crackle',
      seed: 1010,
    }),
    liquidBubble: renderGranularCrackleBuffer(ctx, {
      durationSec: 0.34,
      grainCount: 11,
      minFreq: 260,
      maxFreq: 720,
      grainMs: 26,
      style: 'bubble',
      seed: 1111,
    }),
  };
}

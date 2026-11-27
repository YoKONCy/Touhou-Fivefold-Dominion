/**
 * 电影级物理建模 Web Audio 音效引擎单元测试（含离线 PCM 声学波形体检与全 42 配方调度验证）
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildPhysicalSoundBank,
  createBrownNoiseBuffer,
  createSpatialImpulseResponse,
  DEFAULT_BGM_PLAYLIST,
  DEFAULT_SFX_CATALOG,
  SoundEngine,
  type SynthEnv,
} from '@audio/index';
import { createPinkNoiseBuffer, createWhiteNoiseBuffer } from '@audio/synthPrimitives';

/** 构建轻量级无头 AudioContext 桩对象，真实校验浮点 PCM 缓冲区与全部 Web Audio 参数边界 */
function createMockAudioContext(sampleRate = 44100): AudioContext {
  const makeParam = (initial = 0) => {
    const param = {
      value: initial,
      setValueAtTime: (v: number, t: number) => {
        if (!Number.isFinite(v) || !Number.isFinite(t) || t < 0) {
          throw new Error(`非法 AudioParam setValueAtTime(${v}, ${t})`);
        }
        param.value = v;
      },
      linearRampToValueAtTime: (v: number, t: number) => {
        if (!Number.isFinite(v) || !Number.isFinite(t) || t < 0) {
          throw new Error(`非法 AudioParam linearRamp(${v}, ${t})`);
        }
        param.value = v;
      },
      exponentialRampToValueAtTime: (v: number, t: number) => {
        // Web Audio 规范严格要求指数斜坡目标值必须 > 0
        if (!Number.isFinite(v) || v <= 0 || !Number.isFinite(t) || t < 0) {
          throw new Error(`非法 AudioParam exponentialRamp(${v}, ${t})`);
        }
        param.value = v;
      },
      setTargetAtTime: (v: number, t: number, tc: number) => {
        if (!Number.isFinite(v) || !Number.isFinite(t) || tc <= 0) {
          throw new Error(`非法 AudioParam setTarget(${v}, ${t}, ${tc})`);
        }
        param.value = v;
      },
    };
    return param;
  };

  const makeNode = () => ({
    connect: () => {},
    disconnect: () => {},
  });

  const ctx = {
    sampleRate,
    currentTime: 0.1,
    state: 'running',
    destination: makeNode(),
    createBuffer: (channels: number, length: number, sr: number) => {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return {
        numberOfChannels: channels,
        length,
        sampleRate: sr,
        duration: length / sr,
        getChannelData: (ch: number) => data[ch],
      } as unknown as AudioBuffer;
    },
    createGain: () => ({ ...makeNode(), gain: makeParam(1) }),
    createStereoPanner: () => ({ ...makeNode(), pan: makeParam(0) }),
    createWaveShaper: () => ({ ...makeNode(), curve: null, oversample: 'none' }),
    createBiquadFilter: () => ({
      ...makeNode(),
      type: 'lowpass',
      frequency: makeParam(1000),
      Q: makeParam(1),
      gain: makeParam(0),
    }),
    createOscillator: () => ({
      ...makeNode(),
      type: 'sine',
      frequency: makeParam(440),
      detune: makeParam(0),
      start: (t = 0) => {
        if (!Number.isFinite(t) || t < 0) throw new Error(`非法 osc.start(${t})`);
      },
      stop: (t = 0) => {
        if (!Number.isFinite(t) || t < 0) throw new Error(`非法 osc.stop(${t})`);
      },
    }),
    createBufferSource: () => ({
      ...makeNode(),
      buffer: null as AudioBuffer | null,
      loop: false,
      playbackRate: makeParam(1),
      start: (t = 0, offset = 0, dur?: number) => {
        if (!Number.isFinite(t) || t < 0 || offset < 0 || (dur !== undefined && dur < 0)) {
          throw new Error(`非法 src.start(${t}, ${offset}, ${dur})`);
        }
      },
      stop: () => {},
    }),
  };
  return ctx as unknown as AudioContext;
}

describe('电影级物理建模音效引擎 (SoundEngine)', () => {
  it('应完整注册全部 42 组东方×H4音色配方（含五类远程弹道、冰霜/雷电与神枪冈格尼尔），无头安全零报错', () => {
    const engine = new SoundEngine({ muted: false, masterVolume: 0.8, sfxVolume: 0.9, uiVolume: 0.8 });
    const ids = Object.keys(DEFAULT_SFX_CATALOG);
    expect(ids.length).toBeGreaterThanOrEqual(42);

    const requiredNewIds = [
      'shot_arrow',
      'shot_light_orb',
      'shot_dark_orb',
      'shot_magic_wave',
      'shot_explosive_shell',
      'spell_ice',
      'spell_lightning',
      'spellcard_gungnir',
    ];
    for (const reqId of requiredNewIds) {
      expect(engine.hasRecipe(reqId)).toBe(true);
    }

    for (const id of ids) {
      expect(engine.hasRecipe(id)).toBe(true);
      expect(engine.play(id)).toBe(true);
    }
    expect(engine.getPlayCount()).toBe(ids.length);
  });

  it('离线预烘焙物理建模 PCM 库与双空间卷积混响 IR 应零 NaN、零削波且能量饱满', () => {
    const mockCtx = createMockAudioContext(44100);
    const bank = buildPhysicalSoundBank(mockCtx);
    const brown = createBrownNoiseBuffer(mockCtx, 1);
    const roomIr = createSpatialImpulseResponse(mockCtx, 'battlefield');
    const hallIr = createSpatialImpulseResponse(mockCtx, 'hall');

    const checkBuffer = (name: string, buf: AudioBuffer, expectedChannels = 1) => {
      expect(buf.numberOfChannels, `${name} 声道数`).toBe(expectedChannels);
      expect(buf.length, `${name} 采样长度`).toBeGreaterThan(64);
      for (let ch = 0; ch < buf.numberOfChannels; ch++) {
        const samples = buf.getChannelData(ch);
        let peak = 0;
        let energySum = 0;
        let nonFiniteCount = 0;
        for (let i = 0; i < samples.length; i++) {
          const s = samples[i];
          if (!Number.isFinite(s)) {
            nonFiniteCount += 1;
            continue;
          }
          const a = Math.abs(s);
          if (a > peak) peak = a;
          energySum += s * s;
        }
        const rms = Math.sqrt(energySum / samples.length);
        expect(nonFiniteCount, `${name}[ch${ch}] 含 NaN/Infinity`).toBe(0);
        expect(peak, `${name} 峰值超 1.0 发生数字削波`).toBeLessThanOrEqual(1.0);
        expect(rms, `${name} 静音无能量`).toBeGreaterThan(0.005);
      }
    };

    for (const [key, buf] of Object.entries(bank)) {
      checkBuffer(`bank.${key}`, buf, 1);
    }
    checkBuffer('brownNoise', brown, 1);
    checkBuffer('roomIr', roomIr, 2);
    checkBuffer('hallIr', hallIr, 2);
  });

  it('全部 42 组配方在真实节点参数调度（含指数斜坡正值校验）下应零异常完成渲染', () => {
    const mockCtx = createMockAudioContext(44100);
    const env: SynthEnv = {
      ctx: mockCtx,
      dryBus: mockCtx.createGain(),
      wetBus: mockCtx.createGain(),
      hallWetBus: mockCtx.createGain(),
      whiteNoise: createWhiteNoiseBuffer(mockCtx, 2),
      pinkNoise: createPinkNoiseBuffer(mockCtx, 2),
      brownNoise: createBrownNoiseBuffer(mockCtx, 2),
      bank: buildPhysicalSoundBank(mockCtx),
    };

    for (const [id, recipe] of Object.entries(DEFAULT_SFX_CATALOG)) {
      expect(
        () =>
          recipe.render(env, {
            pan: 0.25,
            gain: recipe.defaultGain,
            pitchScale: 1.03,
            now: 0.2,
          }),
        `配方 ${id} 节点参数调度异常`,
      ).not.toThrow();
    }
  });

  it('同类音效防连发冷却、静音门控、总线音量钳制与外部配方热扩展应准确生效', () => {
    const engine = new SoundEngine({ muted: false, masterVolume: 0.7, sfxVolume: 0.8, uiVolume: 0.7 });

    // 1. 冷却期拦截同一音效连发（ui_click 冷却 35ms）
    expect(engine.play('ui_click')).toBe(true);
    expect(engine.play('ui_click')).toBe(false);

    // 2. 静音门控与一键切换
    expect(engine.toggleMute()).toBe(true);
    expect(engine.play('spellcard_declare')).toBe(false);
    expect(engine.toggleMute()).toBe(false);
    expect(engine.play('spellcard_declare')).toBe(true);

    // 3. 音量边界自动钳制在 [0, 1]
    const clamped = engine.updateSettings({ masterVolume: 2.5, uiVolume: -0.4 });
    expect(clamped.masterVolume).toBe(1);
    expect(clamped.uiVolume).toBe(0);
    // ui 总线为 0 时拒绝触发 ui 音效，但 sfx 音效仍可正常播放
    expect(engine.play('ui_panel_open')).toBe(false);
    expect(engine.playAtStageX('graze_tick', 220, 880)).toBe(true);

    // 4. Phase 2 复用扩展口：热注册新音效配方
    engine.registerRecipe('world_caravan_bell', {
      bus: 'sfx',
      cooldownMs: 0,
      defaultGain: 0.4,
      reverbSend: 0.3,
      render: () => {},
    });
    expect(engine.hasRecipe('world_caravan_bell')).toBe(true);
    expect(engine.play('world_caravan_bell')).toBe(true);
    expect(engine.play('world_caravan_bell')).toBe(true);

    // 5. BGM 通道配置、音轨切换、音量钳制与无头环境零报错验证
    expect(engine.getBgmTrackUrl()).toContain('assets/audio/battle_bgm.mp3');
    const bgmUpdated = engine.updateSettings({ bgmVolume: 1.8, bgmEnabled: true });
    expect(bgmUpdated.bgmVolume).toBe(1);
    expect(bgmUpdated.bgmEnabled).toBe(true);
    engine.setBgmTrack('/assets/audio/custom_theme.mp3');
    expect(engine.getBgmTrackUrl()).toBe('/assets/audio/custom_theme.mp3');
    expect(() => engine.startBgm()).not.toThrow();
    expect(() => engine.stopBgm()).not.toThrow();
  });

  it('BGM 三曲顺序播放列表应指向真实音频文件，并支持播毕自动顺延循环与手动切歌订阅', () => {
    expect(DEFAULT_BGM_PLAYLIST.map((t) => t.id)).toEqual([
      'pixelized_pressure',
      'quantized_pressure',
      'battle_1_yokoncy',
    ]);
    for (const track of DEFAULT_BGM_PLAYLIST) {
      const relPath = track.url.replace(/^\/+/, '');
      const fullPath = resolve(process.cwd(), 'public', relPath);
      expect(existsSync(fullPath), `缺少 BGM 文件：${fullPath}`).toBe(true);
    }

    // 搭建轻量级浏览器 Audio 桩对象，真实验证 ended 顺序切歌与切歌回绕
    const listenersMap = new Map<string, Set<() => void>>();
    const playedSrcHistory: string[] = [];
    let latestAudio: {
      src: string;
      loop: boolean;
      preload: string;
      volume: number;
      muted: boolean;
      paused: boolean;
      currentTime: number;
      emit: (event: string) => void;
    } | null = null;

    class MockHtmlAudio {
      public src: string;
      public loop = false;
      public preload = '';
      public volume = 1;
      public muted = false;
      public paused = true;
      public currentTime = 0;

      constructor(url = '') {
        this.src = url;
        latestAudio = this;
      }

      public addEventListener(event: string, fn: () => void): void {
        if (!listenersMap.has(event)) listenersMap.set(event, new Set());
        listenersMap.get(event)!.add(fn);
      }

      public removeEventListener(event: string, fn: () => void): void {
        listenersMap.get(event)?.delete(fn);
      }

      public load(): void {
        this.currentTime = 0;
      }

      public play(): Promise<void> {
        this.paused = false;
        playedSrcHistory.push(this.src);
        this.emit('play');
        return Promise.resolve();
      }

      public pause(): void {
        this.paused = true;
        this.emit('pause');
      }

      public emit(event: string): void {
        for (const fn of listenersMap.get(event) ?? []) {
          fn();
        }
      }
    }

    const g = globalThis as unknown as {
      window?: unknown;
      Audio?: unknown;
    };
    const prevWindow = g.window;
    const prevAudio = g.Audio;
    g.window = {
      setInterval: globalThis.setInterval.bind(globalThis),
      clearInterval: globalThis.clearInterval.bind(globalThis),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    };
    g.Audio = MockHtmlAudio;

    try {
      const engine = new SoundEngine({
        muted: false,
        masterVolume: 0.8,
        bgmVolume: 0.6,
        bgmEnabled: true,
      });
      const observedTrackIds: string[] = [];
      const unsubscribe = engine.subscribeBgmChange((snap) => {
        observedTrackIds.push(snap.currentTrack.id);
      });

      // 启动第 1 首时不应单曲 loop，而应监听 ended 顺序顺延
      expect(engine.startBgm()).toBe(true);
      expect(latestAudio).not.toBeNull();
      expect(latestAudio!.loop).toBe(false);
      expect(engine.getCurrentBgmTrack().id).toBe('pixelized_pressure');

      // 第 1 首播毕 -> 自动切到第 2 首（Quantized Pressure）
      latestAudio!.emit('ended');
      expect(engine.getBgmTrackIndex()).toBe(1);
      expect(engine.getCurrentBgmTrack().id).toBe('quantized_pressure');
      expect(latestAudio!.src).toContain('battle_bgm_quantized_pressure.mp3');

      // 第 2 首播毕 -> 自动切到第 3 首（Battle I）
      latestAudio!.emit('ended');
      expect(engine.getBgmTrackIndex()).toBe(2);
      expect(engine.getCurrentBgmTrack().id).toBe('battle_1_yokoncy');
      expect(latestAudio!.src).toContain('battle_bgm_battle_1.mp3');

      // 第 3 首播毕 -> 自动回绕至第 1 首（顺序循环）
      latestAudio!.emit('ended');
      expect(engine.getBgmTrackIndex()).toBe(0);
      expect(engine.getCurrentBgmTrack().id).toBe('pixelized_pressure');
      expect(playedSrcHistory.slice(0, 4)).toEqual([
        DEFAULT_BGM_PLAYLIST[0].url,
        DEFAULT_BGM_PLAYLIST[1].url,
        DEFAULT_BGM_PLAYLIST[2].url,
        DEFAULT_BGM_PLAYLIST[0].url,
      ]);

      // 手动上一曲（从第 1 首回绕至第 3 首）与按 ID 点选第 2 首
      expect(engine.prevBgmTrack(true).id).toBe('battle_1_yokoncy');
      expect(engine.getBgmTrackIndex()).toBe(2);
      expect(engine.selectBgmTrack('quantized_pressure', true)?.id).toBe('quantized_pressure');
      expect(engine.getBgmTrackIndex()).toBe(1);
      expect(observedTrackIds).toContain('quantized_pressure');
      expect(observedTrackIds).toContain('battle_1_yokoncy');

      // 销毁后应移除 ended 监听，不再响应后续媒体事件
      unsubscribe();
      engine.destroy();
      expect(listenersMap.get('ended')?.size ?? 0).toBe(0);
    } finally {
      g.window = prevWindow;
      g.Audio = prevAudio;
    }
  });
});

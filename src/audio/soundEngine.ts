/**
 * 可复用电影级 Web Audio 音效引擎（SoundEngine）
 *
 * 工程与混音母带特性：
 * - 多总线母带架构：SFX（带低频暖厚+去3.1kHz刺耳毛刺+丝绒空气感三段均衡）/ UI（高频丝滑柔化）/ Ambience
 *   + 双空间立体声早期反射卷积混响（0.68s 紧致战场庭院 + 1.85s 宏大幻想乡厅堂，均配 Abbey Road 低切防浑浊）
 *   → Master → 音乐化黏合压缩器（Glue Compressor）→ 防数字削波安全限制器（Limiter）
 * - 一次性离线 PCM 预烘焙物理采样库（Karplus-Strong 拨弦、多模态金属/木/冰/铜/琉璃、颗粒拟音簇），播放零 GC 抖动
 * - 空间立体声定位：按虚拟舞台 X 坐标映射左右声像（playAtStageX）
 * - 自动防连发节流（per-sound cooldown）与音高微扰（pitchJitter），杜绝机械重复感
 * - 100% 兼容无头 Node / Vitest 环境（无 AudioContext 时安全降级记录，零报错）
 */

import {
  buildPhysicalSoundBank,
  createBrownNoiseBuffer,
  createSpatialImpulseResponse,
  type PhysicalSoundBank,
} from './physicalModels';
import {
  DEFAULT_SFX_CATALOG,
  type SoundId,
  type SoundRecipe,
} from './sfxCatalog';
import {
  createPinkNoiseBuffer,
  createVoiceInput,
  createWhiteNoiseBuffer,
  scheduleTaikoDrum,
  type SynthEnv,
} from './synthPrimitives';

export interface AudioSettings {
  muted: boolean;
  masterVolume: number;
  bgmVolume: number;
  bgmEnabled: boolean;
  sfxVolume: number;
  uiVolume: number;
  ambienceVolume: number;
  ambienceEnabled: boolean;
}

export interface PlaySoundOptions {
  /** 立体声声像 [-1 左, 1 右] */
  pan?: number;
  /** 额外音量乘数 */
  volume?: number;
  /** 音高微扰覆盖 */
  pitchJitter?: number;
  /** 额外延时（秒） */
  delay?: number;
}

export interface BgmTrack {
  id: string;
  title: string;
  artist: string;
  durationText: string;
  url: string;
}

export interface BgmPlaybackState {
  tracks: readonly BgmTrack[];
  currentIndex: number;
  currentTrack: BgmTrack;
  isPlaying: boolean;
}

const STORAGE_KEY = 'touhou_h4_audio_settings_v1';

const AUDIO_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL) ||
  '/';

/** 战阵背景音乐默认顺序播放列表（播毕自动顺延至下一首并循环） */
export const DEFAULT_BGM_PLAYLIST: readonly BgmTrack[] = [
  {
    id: 'pixelized_pressure',
    title: 'Pixelized Pressure',
    artist: 'yokoncy',
    durationText: '03:32',
    url: `${AUDIO_BASE_URL}assets/audio/battle_bgm.mp3`,
  },
  {
    id: 'quantized_pressure',
    title: 'Quantized Pressure',
    artist: 'yokoncy',
    durationText: '03:12',
    url: `${AUDIO_BASE_URL}assets/audio/battle_bgm_quantized_pressure.mp3`,
  },
  {
    id: 'battle_1_yokoncy',
    title: 'Battle I',
    artist: 'yokoncy · Paul Romero 等原曲',
    durationText: '03:14',
    url: `${AUDIO_BASE_URL}assets/audio/battle_bgm_battle_1.mp3`,
  },
];

const DEFAULT_BGM_URL = DEFAULT_BGM_PLAYLIST[0].url;

const DEFAULT_SETTINGS: AudioSettings = {
  muted: false,
  masterVolume: 0.72,
  bgmVolume: 0.45,
  bgmEnabled: true,
  sfxVolume: 0.85,
  uiVolume: 0.72,
  ambienceVolume: 0.28,
  ambienceEnabled: true,
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}

export class SoundEngine {
  private recipes = new Map<string, SoundRecipe>();
  private settings: AudioSettings;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private uiGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  /** 紧致战场短混响发送总线（0.68s） */
  private reverbInput: GainNode | null = null;
  /** 宏大幻想乡厅堂混响发送总线（1.85s） */
  private hallReverbInput: GainNode | null = null;
  private whiteNoise: AudioBuffer | null = null;
  private pinkNoise: AudioBuffer | null = null;
  private brownNoise: AudioBuffer | null = null;
  private soundBank: PhysicalSoundBank | null = null;

  /** 同类音效最后播放时间戳（ms），用于防连发节流 */
  private lastPlayedAt = new Map<string, number>();
  /** 暗夜战场氛围循环句柄 */
  private ambienceWindSrc: AudioBufferSourceNode | null = null;
  private ambienceChimeTimer: number | null = null;
  private ambienceRunning = false;
  /** 背景音乐（BGM）顺序播放列表、流式播放句柄与渐入定时器 */
  private bgmPlaylist: BgmTrack[] = DEFAULT_BGM_PLAYLIST.map((track) => ({ ...track }));
  private bgmTrackIndex = 0;
  private bgmTrackUrl: string = DEFAULT_BGM_URL;
  private bgmLoadedTrackUrl = '';
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmFadeTimer: number | null = null;
  private bgmPendingAutoplay = false;
  private bgmChangeListeners = new Set<(state: BgmPlaybackState) => void>();
  /** 调试/单测统计计数 */
  private playCounter = 0;
  private gestureListenersInstalled = false;

  /** 当前 BGM 曲目播毕时自动顺序切换至下一首 */
  private readonly handleBgmEnded = (): void => {
    if (!this.settings.bgmEnabled || this.settings.muted) {
      this.emitBgmChange();
      return;
    }
    if (this.bgmPlaylist.length > 1 && this.isCurrentTrackInPlaylist()) {
      this.nextBgmTrack(true);
      return;
    }
    this.emitBgmChange();
  };

  /** 监听底层媒体元素播放/暂停事件以实时同步播放器界面 */
  private readonly handleBgmPlaybackEvent = (): void => {
    this.emitBgmChange();
  };

  constructor(initialSettings?: Partial<AudioSettings>) {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...this.loadPersistedSettings(),
      ...initialSettings,
    };

    for (const [id, recipe] of Object.entries(DEFAULT_SFX_CATALOG)) {
      this.recipes.set(id, recipe);
    }
  }

  /** 注册或覆盖自定义音效配方（供 Phase 2 大地图/城镇/新符卡复用扩展） */
  public registerRecipe(id: string, recipe: SoundRecipe): void {
    this.recipes.set(id, recipe);
  }

  public hasRecipe(id: string): boolean {
    return this.recipes.has(id);
  }

  public getRegisteredIds(): string[] {
    return Array.from(this.recipes.keys());
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public getPlayCount(): number {
    return this.playCounter;
  }

  /** 绑定首次用户手势自动唤醒浏览器 Web Audio 上下文与背景音乐 */
  public installAutoUnlock(): void {
    if (this.gestureListenersInstalled || typeof window === 'undefined') return;
    this.gestureListenersInstalled = true;
    const onGesture = () => {
      this.unlock();
      if (this.settings.bgmEnabled && !this.settings.muted) {
        this.startBgm();
      }
      window.removeEventListener('pointerdown', onGesture, true);
      window.removeEventListener('keydown', onGesture, true);
    };
    window.addEventListener('pointerdown', onGesture, { capture: true, passive: true });
    window.addEventListener('keydown', onGesture, { capture: true, passive: true });
  }

  /** 获取完整 BGM 顺序播放列表 */
  public getBgmPlaylist(): BgmTrack[] {
    return this.bgmPlaylist.map((track) => ({ ...track }));
  }

  /** 获取当前播放曲目在播放列表中的序号 */
  public getBgmTrackIndex(): number {
    return this.bgmTrackIndex;
  }

  /** 获取当前 BGM 曲目元信息 */
  public getCurrentBgmTrack(): BgmTrack {
    const listed = this.bgmPlaylist[this.bgmTrackIndex];
    if (listed && listed.url === this.bgmTrackUrl) {
      return { ...listed };
    }
    return {
      id: 'custom_bgm',
      title: '自定义曲目',
      artist: '',
      durationText: '--:--',
      url: this.bgmTrackUrl,
    };
  }

  /** 获取当前 BGM 播放器完整快照（供界面订阅实时同步） */
  public getBgmPlaybackState(): BgmPlaybackState {
    return {
      tracks: this.getBgmPlaylist(),
      currentIndex: this.bgmTrackIndex,
      currentTrack: this.getCurrentBgmTrack(),
      isPlaying: Boolean(
        this.bgmAudio && !this.bgmAudio.paused && this.settings.bgmEnabled && !this.settings.muted,
      ),
    };
  }

  /** 订阅 BGM 切歌与播停状态变化，返回取消订阅函数 */
  public subscribeBgmChange(listener: (state: BgmPlaybackState) => void): () => void {
    this.bgmChangeListeners.add(listener);
    return () => {
      this.bgmChangeListeners.delete(listener);
    };
  }

  /** 获取当前配置的 BGM 音轨路径 */
  public getBgmTrackUrl(): string {
    return this.bgmTrackUrl;
  }

  /** 按序号或曲目 ID 切换至指定 BGM（默认自动从头衔接播放） */
  public selectBgmTrack(indexOrId: number | string, autoPlay = true): BgmTrack | null {
    const len = this.bgmPlaylist.length;
    if (len === 0) return null;

    let nextIndex = -1;
    if (typeof indexOrId === 'number') {
      if (!Number.isFinite(indexOrId)) return null;
      nextIndex = ((Math.trunc(indexOrId) % len) + len) % len;
    } else {
      nextIndex = this.bgmPlaylist.findIndex((track) => track.id === indexOrId);
      if (nextIndex < 0) return null;
    }

    const target = this.bgmPlaylist[nextIndex];
    const wasPlaying = Boolean(this.bgmAudio && !this.bgmAudio.paused);
    const shouldReload =
      this.bgmTrackIndex !== nextIndex ||
      this.bgmTrackUrl !== target.url ||
      this.bgmLoadedTrackUrl !== target.url;

    this.stopBgm();
    this.bgmTrackIndex = nextIndex;
    this.bgmTrackUrl = target.url;

    if (this.bgmAudio) {
      this.bgmAudio.loop = this.shouldLoopSingleTrack();
      if (shouldReload) {
        this.bgmAudio.src = target.url;
        this.bgmLoadedTrackUrl = target.url;
        this.bgmAudio.load();
      }
      try {
        this.bgmAudio.currentTime = 0;
      } catch {
        // 媒体尚未就绪或无头桩对象不允许写入 currentTime 时静默忽略
      }
    }

    if ((autoPlay || wasPlaying) && this.settings.bgmEnabled && !this.settings.muted) {
      this.startBgm();
    } else {
      this.emitBgmChange();
    }

    return { ...target };
  }

  /** 顺序切换至下一首 BGM（末尾自动循环回到第 1 首） */
  public nextBgmTrack(autoPlay = true): BgmTrack {
    const nextIndex = (this.bgmTrackIndex + 1) % Math.max(1, this.bgmPlaylist.length);
    return this.selectBgmTrack(nextIndex, autoPlay) ?? this.getCurrentBgmTrack();
  }

  /** 切换至上一首 BGM（第 1 首自动回绕至末尾曲目） */
  public prevBgmTrack(autoPlay = true): BgmTrack {
    const len = Math.max(1, this.bgmPlaylist.length);
    const prevIndex = (this.bgmTrackIndex - 1 + len) % len;
    return this.selectBgmTrack(prevIndex, autoPlay) ?? this.getCurrentBgmTrack();
  }

  /** 切换背景音乐音轨（兼容外部自定义 URL，切换时若处于播放状态将自动衔接新曲） */
  public setBgmTrack(url: string): void {
    if (!url || this.bgmTrackUrl === url) return;
    const matchedIdx = this.bgmPlaylist.findIndex((track) => track.url === url);
    if (matchedIdx >= 0) {
      const wasPlaying = Boolean(this.bgmAudio && !this.bgmAudio.paused);
      this.selectBgmTrack(matchedIdx, wasPlaying);
      return;
    }

    const wasPlaying = Boolean(this.bgmAudio && !this.bgmAudio.paused);
    this.stopBgm();
    this.bgmTrackUrl = url;
    if (this.bgmAudio) {
      this.bgmAudio.loop = this.shouldLoopSingleTrack();
      this.bgmAudio.src = url;
      this.bgmLoadedTrackUrl = url;
      this.bgmAudio.load();
      try {
        this.bgmAudio.currentTime = 0;
      } catch {
        // 忽略无头或未就绪节点异常
      }
    }
    if (wasPlaying && this.settings.bgmEnabled && !this.settings.muted) {
      this.startBgm();
    } else {
      this.emitBgmChange();
    }
  }

  /** 启动或恢复战斗背景音乐顺序循环播放（带 450ms 平滑淡入，并自动兼容浏览器自动播放拦截） */
  public startBgm(): boolean {
    if (!this.settings.bgmEnabled || this.settings.muted) {
      this.emitBgmChange();
      return false;
    }
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      this.emitBgmChange();
      return false;
    }

    if (!this.bgmAudio) {
      const audio = new Audio(this.bgmTrackUrl);
      audio.loop = this.shouldLoopSingleTrack();
      audio.preload = 'auto';
      audio.volume = 0;
      audio.addEventListener('ended', this.handleBgmEnded);
      audio.addEventListener('play', this.handleBgmPlaybackEvent);
      audio.addEventListener('pause', this.handleBgmPlaybackEvent);
      this.bgmLoadedTrackUrl = this.bgmTrackUrl;
      this.bgmAudio = audio;
    } else if (this.bgmLoadedTrackUrl !== this.bgmTrackUrl) {
      this.bgmAudio.loop = this.shouldLoopSingleTrack();
      this.bgmAudio.src = this.bgmTrackUrl;
      this.bgmLoadedTrackUrl = this.bgmTrackUrl;
      this.bgmAudio.load();
    } else {
      this.bgmAudio.loop = this.shouldLoopSingleTrack();
    }

    const targetVol = this.computeEffectiveBgmVolume();
    this.bgmAudio.muted = false;

    if (!this.bgmAudio.paused) {
      this.bgmAudio.volume = targetVol;
      this.bgmPendingAutoplay = false;
      this.emitBgmChange();
      return true;
    }

    this.bgmAudio.volume = 0;
    const playPromise = this.bgmAudio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          this.bgmPendingAutoplay = false;
          this.fadeBgmTo(this.computeEffectiveBgmVolume(), 450);
          this.emitBgmChange();
        })
        .catch(() => {
          this.bgmPendingAutoplay = true;
          this.emitBgmChange();
        });
    } else {
      this.bgmPendingAutoplay = false;
      this.fadeBgmTo(targetVol, 450);
      this.emitBgmChange();
    }
    return true;
  }

  /** 暂停背景音乐并清理淡入定时器 */
  public stopBgm(): void {
    this.bgmPendingAutoplay = false;
    this.clearBgmFadeTimer();
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
      } catch {
        // 忽略无头或已释放媒体节点异常
      }
    }
    this.emitBgmChange();
  }

  /** 初始化并唤醒电影级双混响母带管线（安全幂等，无头环境自动静默跳过） */
  public unlock(): boolean {
    if (typeof window === 'undefined') return false;
    const AudioCtxCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxCtor) return false;

    if (!this.ctx) {
      const ctx = new AudioCtxCtor();

      // 两级母带动态控制：音乐化黏合压缩 + 防削波砖墙安全限幅
      const glueCompressor = ctx.createDynamicsCompressor();
      glueCompressor.threshold.value = -14;
      glueCompressor.knee.value = 14;
      glueCompressor.ratio.value = 3.5;
      glueCompressor.attack.value = 0.005;
      glueCompressor.release.value = 0.16;

      const safetyLimiter = ctx.createDynamicsCompressor();
      safetyLimiter.threshold.value = -1.5;
      safetyLimiter.knee.value = 1;
      safetyLimiter.ratio.value = 20;
      safetyLimiter.attack.value = 0.001;
      safetyLimiter.release.value = 0.05;

      const master = ctx.createGain();
      const sfx = ctx.createGain();
      const ui = ctx.createGain();
      const ambience = ctx.createGain();

      // SFX 总线三段影院均衡：增厚次低频、削平 3.1kHz 数字尖刺、微抬 9.5kHz 空气泛音
      const sfxLowWarm = ctx.createBiquadFilter();
      sfxLowWarm.type = 'lowshelf';
      sfxLowWarm.frequency.value = 95;
      sfxLowWarm.gain.value = 2.2;

      const sfxDeHarsh = ctx.createBiquadFilter();
      sfxDeHarsh.type = 'peaking';
      sfxDeHarsh.frequency.value = 3100;
      sfxDeHarsh.Q.value = 1.1;
      sfxDeHarsh.gain.value = -2.0;

      const sfxAir = ctx.createBiquadFilter();
      sfxAir.type = 'highshelf';
      sfxAir.frequency.value = 9500;
      sfxAir.gain.value = 1.4;

      sfx.connect(sfxLowWarm);
      sfxLowWarm.connect(sfxDeHarsh);
      sfxDeHarsh.connect(sfxAir);
      sfxAir.connect(master);

      // UI 总线温和低通柔化，确保界面交互触感精致润泽不刺耳
      const uiSilk = ctx.createBiquadFilter();
      uiSilk.type = 'lowpass';
      uiSilk.frequency.value = 11000;
      uiSilk.Q.value = 0.7;
      ui.connect(uiSilk);
      uiSilk.connect(master);

      ambience.connect(master);

      // 空间混响一：0.68s 紧致战场早期反射（配 140Hz 低切防低频浑浊）
      const roomSend = ctx.createGain();
      roomSend.gain.value = 0.34;
      const roomConv = ctx.createConvolver();
      roomConv.buffer = createSpatialImpulseResponse(ctx, 'battlefield');
      const roomHp = ctx.createBiquadFilter();
      roomHp.type = 'highpass';
      roomHp.frequency.value = 140;
      roomSend.connect(roomConv);
      roomConv.connect(roomHp);
      roomHp.connect(master);

      // 空间混响二：1.85s 宏大幻想乡夜空厅堂（配 180Hz 低切，专供符卡、圣疗、大魔法与凯旋号角）
      const hallSend = ctx.createGain();
      hallSend.gain.value = 0.4;
      const hallConv = ctx.createConvolver();
      hallConv.buffer = createSpatialImpulseResponse(ctx, 'hall');
      const hallHp = ctx.createBiquadFilter();
      hallHp.type = 'highpass';
      hallHp.frequency.value = 180;
      hallSend.connect(hallConv);
      hallConv.connect(hallHp);
      hallHp.connect(master);

      master.connect(glueCompressor);
      glueCompressor.connect(safetyLimiter);
      safetyLimiter.connect(ctx.destination);

      this.ctx = ctx;
      this.masterGain = master;
      this.sfxGain = sfx;
      this.uiGain = ui;
      this.ambienceGain = ambience;
      this.reverbInput = roomSend;
      this.hallReverbInput = hallSend;
      this.whiteNoise = createWhiteNoiseBuffer(ctx, 2);
      this.pinkNoise = createPinkNoiseBuffer(ctx, 2);
      this.brownNoise = createBrownNoiseBuffer(ctx, 2);
      this.soundBank = buildPhysicalSoundBank(ctx);
      this.applyBusVolumes();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {
        // 浏览器拦截自动播放时静默忽略，待下次用户交互自然唤醒
      });
    }

    if (this.settings.ambienceEnabled && !this.settings.muted && !this.ambienceRunning) {
      this.startAmbience();
    }
    if (
      this.settings.bgmEnabled &&
      !this.settings.muted &&
      (this.bgmPendingAutoplay || !this.bgmAudio || this.bgmAudio.paused)
    ) {
      this.startBgm();
    }

    return true;
  }

  /** 更新音频设置并即时同步至各总线与持久化存储 */
  public updateSettings(patch: Partial<AudioSettings>): AudioSettings {
    this.settings = {
      muted: patch.muted ?? this.settings.muted,
      masterVolume: clamp01(patch.masterVolume ?? this.settings.masterVolume),
      bgmVolume: clamp01(patch.bgmVolume ?? this.settings.bgmVolume),
      bgmEnabled: patch.bgmEnabled ?? this.settings.bgmEnabled,
      sfxVolume: clamp01(patch.sfxVolume ?? this.settings.sfxVolume),
      uiVolume: clamp01(patch.uiVolume ?? this.settings.uiVolume),
      ambienceVolume: clamp01(patch.ambienceVolume ?? this.settings.ambienceVolume),
      ambienceEnabled: patch.ambienceEnabled ?? this.settings.ambienceEnabled,
    };
    this.applyBusVolumes();
    this.syncBgmPlaybackState();
    this.persistSettings();

    if (this.settings.ambienceEnabled && !this.settings.muted) {
      if (this.ctx && !this.ambienceRunning) this.startAmbience();
    } else if (this.ambienceRunning) {
      this.stopAmbience();
    }

    return this.getSettings();
  }

  public toggleMute(): boolean {
    this.updateSettings({ muted: !this.settings.muted });
    return this.settings.muted;
  }

  /**
   * 播放指定音效（含冷却防连发、音高自然微扰、立体声定位）
   * 返回是否实际触发了播放
   */
  public play(id: SoundId | (string & {}), options: PlaySoundOptions = {}): boolean {
    const recipe = this.recipes.get(id);
    if (!recipe) return false;
    if (this.settings.muted || this.settings.masterVolume <= 0.001) return false;

    const busVol = recipe.bus === 'ui' ? this.settings.uiVolume : this.settings.sfxVolume;
    if (busVol <= 0.001) return false;

    const nowMs = Date.now();
    const prevMs = this.lastPlayedAt.get(id) ?? 0;
    if (recipe.cooldownMs > 0 && nowMs - prevMs < recipe.cooldownMs) {
      return false;
    }
    this.lastPlayedAt.set(id, nowMs);
    this.playCounter += 1;

    // 浏览器环境尝试懒唤醒；无头环境仅计数后安全返回
    if (!this.ctx && !this.unlock()) {
      return true;
    }
    if (
      !this.ctx ||
      !this.sfxGain ||
      !this.uiGain ||
      !this.whiteNoise ||
      !this.pinkNoise ||
      !this.brownNoise ||
      !this.soundBank
    ) {
      return true;
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }

    const dryBus = recipe.bus === 'ui' ? this.uiGain : this.sfxGain;
    const env: SynthEnv = {
      ctx: this.ctx,
      dryBus,
      wetBus: this.reverbInput,
      hallWetBus: this.hallReverbInput,
      whiteNoise: this.whiteNoise,
      pinkNoise: this.pinkNoise,
      brownNoise: this.brownNoise,
      bank: this.soundBank,
    };

    const jitter = options.pitchJitter ?? recipe.pitchJitter ?? 0;
    const pitchScale = jitter > 0 ? 1 + (Math.random() * 2 - 1) * jitter : 1;
    const gain = recipe.defaultGain * (options.volume ?? 1);
    const pan = Math.max(-0.85, Math.min(0.85, options.pan ?? 0));
    const now = this.ctx.currentTime + (options.delay ?? 0);

    try {
      recipe.render(env, { pan, gain, pitchScale, now });
    } catch {
      // 防止极端音频调度边界影响主游戏逻辑
    }

    return true;
  }

  /** 便捷空间立体声播放：将虚拟舞台 X 坐标映射为 [-0.72, +0.72] 柔和声像 */
  public playAtStageX(
    id: SoundId | (string & {}),
    virtualX: number,
    stageWidth = 880,
    options: Omit<PlaySoundOptions, 'pan'> = {},
  ): boolean {
    const norm = Math.max(-1, Math.min(1, (virtualX / Math.max(1, stageWidth)) * 2 - 1));
    return this.play(id, { ...options, pan: norm * 0.72 });
  }

  /** 启动低沉克制的暗夜战场氛围（微弱布朗夜风低鸣 + 远方厅堂大太鼓缓击） */
  public startAmbience(): void {
    if (
      this.ambienceRunning ||
      !this.ctx ||
      !this.ambienceGain ||
      !this.pinkNoise ||
      !this.whiteNoise ||
      !this.brownNoise ||
      !this.soundBank
    ) {
      return;
    }
    this.ambienceRunning = true;

    // 1. 低沉暗夜山风背景底噪（布朗噪声低通，温润不发沙）
    const src = this.ctx.createBufferSource();
    src.buffer = this.brownNoise;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 210;
    filter.Q.value = 0.9;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.09;

    src.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.ambienceGain);
    src.start();
    this.ambienceWindSrc = src;

    // 2. 偶发极克制的远方大太鼓闷震（经宏大厅堂混响渲染出苍茫夜战气氛）
    const scheduleNextPulse = () => {
      if (!this.ambienceRunning || typeof window === 'undefined') return;
      const waitMs = 7200 + Math.floor(Math.random() * 5800);
      this.ambienceChimeTimer = window.setTimeout(() => {
        if (
          !this.ambienceRunning ||
          !this.ctx ||
          !this.ambienceGain ||
          !this.whiteNoise ||
          !this.pinkNoise ||
          !this.brownNoise ||
          !this.soundBank
        ) {
          return;
        }
        if (this.ctx.state === 'running' && !this.settings.muted && this.settings.ambienceEnabled) {
          const env: SynthEnv = {
            ctx: this.ctx,
            dryBus: this.ambienceGain,
            wetBus: this.reverbInput,
            hallWetBus: this.hallReverbInput,
            whiteNoise: this.whiteNoise,
            pinkNoise: this.pinkNoise,
            brownNoise: this.brownNoise,
            bank: this.soundBank,
          };
          const out = createVoiceInput(env, {
            pan: (Math.random() * 2 - 1) * 0.35,
            gain: 0.2,
            hallSend: 0.55,
            lowpassHz: 420,
          });
          scheduleTaikoDrum(env, out, this.ctx.currentTime, {
            size: 'odaiko',
            peak: 0.42,
            pitchScale: 0.92 + Math.random() * 0.14,
          });
        }
        scheduleNextPulse();
      }, waitMs);
    };
    scheduleNextPulse();
  }

  public stopAmbience(): void {
    this.ambienceRunning = false;
    if (this.ambienceChimeTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.ambienceChimeTimer);
      this.ambienceChimeTimer = null;
    }
    if (this.ambienceWindSrc) {
      try {
        this.ambienceWindSrc.stop();
        this.ambienceWindSrc.disconnect();
      } catch {
        // 忽略已停止节点异常
      }
      this.ambienceWindSrc = null;
    }
  }

  public destroy(): void {
    this.stopBgm();
    if (this.bgmAudio) {
      this.bgmAudio.removeEventListener('ended', this.handleBgmEnded);
      this.bgmAudio.removeEventListener('play', this.handleBgmPlaybackEvent);
      this.bgmAudio.removeEventListener('pause', this.handleBgmPlaybackEvent);
      this.bgmAudio = null;
      this.bgmLoadedTrackUrl = '';
    }
    this.bgmChangeListeners.clear();
    this.stopAmbience();
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  private isCurrentTrackInPlaylist(): boolean {
    const listed = this.bgmPlaylist[this.bgmTrackIndex];
    return Boolean(listed && listed.url === this.bgmTrackUrl);
  }

  private shouldLoopSingleTrack(): boolean {
    return this.bgmPlaylist.length <= 1 || !this.isCurrentTrackInPlaylist();
  }

  private emitBgmChange(): void {
    if (this.bgmChangeListeners.size === 0) return;
    const snapshot = this.getBgmPlaybackState();
    for (const listener of this.bgmChangeListeners) {
      try {
        listener(snapshot);
      } catch {
        // 隔离外部界面订阅异常，避免影响音频播放流
      }
    }
  }

  private computeEffectiveBgmVolume(): number {
    if (this.settings.muted || !this.settings.bgmEnabled) return 0;
    return clamp01(this.settings.masterVolume * this.settings.bgmVolume);
  }

  private clearBgmFadeTimer(): void {
    if (this.bgmFadeTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmFadeTimer);
      this.bgmFadeTimer = null;
    }
  }

  private fadeBgmTo(targetVol: number, durationMs: number): void {
    if (!this.bgmAudio || typeof window === 'undefined') return;
    this.clearBgmFadeTimer();
    const audio = this.bgmAudio;
    const startVol = audio.volume;
    const safeTarget = clamp01(targetVol);
    if (durationMs <= 20 || Math.abs(safeTarget - startVol) < 0.005) {
      audio.volume = safeTarget;
      return;
    }
    const startAt = Date.now();
    this.bgmFadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - startAt) / durationMs);
      audio.volume = clamp01(startVol + (safeTarget - startVol) * progress);
      if (progress >= 1) {
        this.clearBgmFadeTimer();
      }
    }, 25);
  }

  private syncBgmPlaybackState(): void {
    if (typeof window === 'undefined') return;
    const targetVol = this.computeEffectiveBgmVolume();
    if (!this.settings.bgmEnabled || this.settings.muted || targetVol <= 0.001) {
      this.clearBgmFadeTimer();
      if (this.bgmAudio) {
        this.bgmAudio.volume = 0;
        this.bgmAudio.muted = true;
        if (!this.settings.bgmEnabled) {
          this.stopBgm();
          return;
        }
      }
      this.emitBgmChange();
      return;
    }
    if (!this.bgmAudio || this.bgmAudio.paused) {
      this.startBgm();
      return;
    }
    this.clearBgmFadeTimer();
    this.bgmAudio.muted = false;
    this.bgmAudio.volume = targetVol;
    this.emitBgmChange();
  }

  private applyBusVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.uiGain || !this.ambienceGain) {
      return;
    }
    const t = this.ctx.currentTime;
    const master = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(master, t, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, t, 0.02);
    this.uiGain.gain.setTargetAtTime(this.settings.uiVolume, t, 0.02);
    this.ambienceGain.gain.setTargetAtTime(
      this.settings.ambienceEnabled ? this.settings.ambienceVolume : 0,
      t,
      0.04,
    );
  }

  private loadPersistedSettings(): Partial<AudioSettings> {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Partial<AudioSettings>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private persistSettings(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // 隐私模式下忽略存储受限
    }
  }
}

/** 全局共享可复用音效引擎单例 */
export const soundEngine = new SoundEngine();

/**
 * 《Touhou-H4》电影级纯代码可复用音频子系统统一出口
 */

export {
  buildPhysicalSoundBank,
  createBrownNoiseBuffer,
  createSpatialImpulseResponse,
  renderGranularCrackleBuffer,
  renderKarplusStringBuffer,
  renderModalImpactBuffer,
  type ModalMaterial,
  type PhysicalSoundBank,
} from './physicalModels';
export {
  DEFAULT_SFX_CATALOG,
  type AudioBusName,
  type SoundId,
  type SoundRecipe,
  type SoundRenderParams,
} from './sfxCatalog';
export {
  SoundEngine,
  soundEngine,
  type AudioSettings,
  type PlaySoundOptions,
} from './soundEngine';
export {
  createVoiceInput,
  scheduleBufferHit,
  scheduleNoiseBurst,
  schedulePunchKick,
  scheduleTaikoDrum,
  scheduleTone,
  scheduleWhoosh,
  scheduleWarmEnsembleNote,
  type BufferHitOptions,
  type EnsembleNoteOptions,
  type NoiseBurstOptions,
  type SynthEnv,
  type TaikoOptions,
  type ToneOptions,
  type VoiceRouteOptions,
  type WhooshOptions,
} from './synthPrimitives';

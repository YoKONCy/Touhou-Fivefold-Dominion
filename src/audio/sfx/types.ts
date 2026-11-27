/**
 * 东方幻想战记 H4 · 电影级物理建模×三层声学音效类型定义
 */

import type { SynthEnv } from '../synthPrimitives';

/** 音频总线的逻辑分组 */
export type AudioBusName = 'ui' | 'sfx';

/** UI 交互、翻页、开闭面板、受阻、回合提示与钟声类音效标识 */
export type UiSoundId =
  // 一、军阵漆木 UI 与魔导折本（9）
  | 'ui_hover_hex'
  | 'ui_click'
  | 'ui_panel_open'
  | 'ui_panel_close'
  | 'ui_book_open'
  | 'ui_book_tab'
  | 'ui_blocked'
  | 'ui_turn_ready'
  | 'ui_round_bell';

/** 移动脚步、飞行、近战/远程攻击、弹幕发射、受击、擦弹与倒地/阵亡类音效标识 */
export type CombatSoundId =
  // 二、行军踏地与高速掠空（3）
  | 'move_step_light'
  | 'move_step_heavy'
  | 'move_fly_whoosh'
  // 三、HoMM4 物理交锋、五类远程弹道、同时反击与擦弹（14）
  | 'attack_melee_slash'
  | 'attack_melee_heavy'
  | 'attack_ranged_shot'
  | 'shot_arrow'
  | 'shot_light_orb'
  | 'shot_dark_orb'
  | 'shot_magic_wave'
  | 'shot_explosive_shell'
  | 'hit_impact'
  | 'hit_crit'
  | 'hit_simultaneous'
  | 'graze_tick'
  | 'unit_ko'
  | 'unit_death';

/** 法术、秘药、姿态、符卡宣言与胜负终局演出类音效标识 */
export type SpellSoundId =
  // 四、五系术式、元素专效、秘药与姿态（11）
  | 'spell_heal'
  | 'spell_buff'
  | 'spell_debuff'
  | 'spell_orb'
  | 'spell_star_bolt'
  | 'spell_aoe'
  | 'spell_ice'
  | 'spell_lightning'
  | 'potion_drink'
  | 'stance_defend'
  | 'stance_wait'
  // 五、东方符卡宣言与终局管弦战号（6）
  | 'spellcard_declare'
  | 'spellcard_master_spark'
  | 'spellcard_gungnir'
  | 'spellcard_capture'
  | 'battle_victory'
  | 'battle_defeat';

/** 全量音效唯一标识 */
export type SoundId = UiSoundId | CombatSoundId | SpellSoundId;

/** 单次音效渲染时传入的声像、音量、音高与时间参数 */
export interface SoundRenderParams {
  pan: number;
  gain: number;
  pitchScale: number;
  now: number;
}

/** 音效合成配方描述 */
export interface SoundRecipe {
  bus: AudioBusName;
  /** 同类音效防连发最小冷却（毫秒） */
  cooldownMs: number;
  /** 默认增益系数 */
  defaultGain: number;
  /** 默认战场混响发送量 */
  reverbSend: number;
  /** 默认音高微扰幅度 */
  pitchJitter?: number;
  /** 纯代码声学合成器 */
  render: (env: SynthEnv, params: SoundRenderParams) => void;
}

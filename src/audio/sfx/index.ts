/**
 * 东方幻想战记 H4 · 电影级物理建模×三层声学音效配方注册表（共 42 组）
 *
 * 全面淘汰传统 Web Audio「单锯齿波硬削波塑料蜂鸣」路线，
 * 每一条音效均遵循 AAA 游戏声学「瞬态 Transient + 实体 Body + 空间尾音 Tail」三层结构：
 * - 真实材质物理建模：Karplus-Strong 弓弦/古筝拨弦、冷锻钢刃、古社铜锣、极寒冰晶、樱木落子、秘药琉璃瓶
 * - 真实拟音微瞬态颗粒：冰甲碎裂屑、火焰/雷电噼啪弧、秘药咕嘟气泡
 * - 真实管弦与和风打击乐：贝塞尔圆膜和太鼓、立体声三声部失谐铜管/弦乐/圣光和声群奏
 * - 双空间立体声混响分工：紧致战场早期反射（0.68s）负责打击立体感，宏大幻想乡厅堂（1.85s）赋予符卡/大法术/凯旋电影气势
 * - 专设五类经典远程弹道发射音效（箭矢/光球/暗球/魔法冲击波/爆裂弹）+ 冰霜/雷电专效 + 蕾米莉亚神枪冈格尼尔专效！
 */

import { COMBAT_SFX_CATALOG } from './combat';
import { SPELL_SFX_CATALOG } from './spells';
import type { SoundId, SoundRecipe } from './types';
import { UI_SFX_CATALOG } from './ui';

export type {
  AudioBusName,
  CombatSoundId,
  SoundId,
  SoundRecipe,
  SoundRenderParams,
  SpellSoundId,
  UiSoundId,
} from './types';

export { COMBAT_SFX_CATALOG } from './combat';
export { SPELL_SFX_CATALOG } from './spells';
export { UI_SFX_CATALOG } from './ui';

/** 汇总全部分类的默认音效合成配方注册表 */
export const DEFAULT_SFX_CATALOG: Record<SoundId, SoundRecipe> = {
  ...UI_SFX_CATALOG,
  ...COMBAT_SFX_CATALOG,
  ...SPELL_SFX_CATALOG,
};

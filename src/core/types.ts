/**
 * 《Touhou-H4》核心引擎统一领域类型契约
 * 严格面向完整 HoMM4（本体 + 两部资料片）+ 东方融合架构，引擎层零视图依赖。
 */

import type { Alignment } from './alignment';
import type { FootprintSize, HexCoord, HexTile, MovementDomain } from './hex';
import type { RngState } from './rng';

/** 阵营归属（支持双人与未来多人热座/联机） */
export type SideId = 'left' | 'right';

export type ControllerType = 'human' | 'ai';

/** 7 种资源定义（为 Phase 2 大地图与城镇预留完整契约） */
export type ResourceType =
  | 'saisen'      // 赛钱（金币）
  | 'bamboo'      // 灵竹（木材）
  | 'obsidian'    // 玄石（矿石）
  | 'ice_crystal' // 冰晶（水晶）
  | 'yin_yang'    // 宝玉（宝石）
  | 'hellfire'    // 地狱火核（硫磺）
  | 'lunar_elixir'; // 月之秘药（水银）

/** 属性键（走统一 Modifier Stack 可溯源管线） */
export type StatKey =
  | 'attack'
  | 'defense'
  | 'minDamage'
  | 'maxDamage'
  | 'maxHp'
  | 'speed'
  | 'initiative'
  | 'range'
  | 'morale'
  | 'luck'
  | 'magicResistance'
  | 'grazeChance'
  | 'spellPower'
  | 'maxMana';

export interface StatModifier {
  id: string;
  stat: StatKey;
  /** flat: 直接加减；percent: 按基础值百分比加减（例如 0.25 表示 +25%） */
  mode: 'flat' | 'percent';
  value: number;
  sourceName: string;
  /** 剩余持续回合，null 表示永久/光环效果 */
  remainingRounds: number | null;
  /** 法术修饰器极性标记（用于驱魔 Exorcism / 魔力消除 Cancellation / 窃取附魔 / 驱散 Dispel 精确判定） */
  spellPolarity?: 'positive' | 'negative';
  /** 关联法术 ID（用于在 20 格状态槽直接呈现对应的 24×24 专属像素法术图标） */
  spellId?: string;
  /** 施加单调递增序号（用于 20 格 Buff/Debuff 上限的 FIFO 顶替排序） */
  appliedOrder?: number;
}

export interface StatBreakdownItem {
  sourceName: string;
  deltaText: string;
}

export interface ComputedUnitStats {
  attack: number;
  defense: number;
  minDamage: number;
  maxDamage: number;
  maxHp: number;
  speed: number;
  initiative: number;
  range: number;
  morale: number;
  luck: number;
  magicResistance: number;
  grazeChance: number;
  spellPower: number;
  maxMana: number;
  breakdowns: Partial<Record<StatKey, StatBreakdownItem[]>>;
}

/** 单位通用特技标签（完整覆盖 H4 本体 + 两部资料片经典特技体系） */
export interface UnitAbilities {
  firstStrike?: boolean;          // 先攻（近战交锋时优先削减敌军反击兵力）
  rangedFirstStrike?: boolean;    // 远程先攻（远程互射与远程反击时优先结算，削减敌方还击兵力）
  negateFirstStrike?: boolean;    // 破先攻（无效化敌方先攻，强制拉回同时交锋）
  longWeapon?: boolean;           // 长武器（H4 枪兵专属稀有特技：近战攻击距离 +1，隔 1 格突刺且不受非长手目标反击）
  noRetaliation?: boolean;        // 不受反击
  unlimitedRetaliation?: boolean; // 无限反击（护卫型单位每回合不限次数强力反击）
  ranged?: boolean;               // 远程射击与 H4 远程互射反击
  longRange?: boolean;            // 精准射击（无视远程距离衰减）
  shortRange?: boolean;           // 短程弹幕（超距衰减更严苛）
  noObstaclePenalty?: boolean;    // 无视障碍射击（穿透普通掩体不降级）
  unlimitedShots?: boolean;       // 无限弹药（射击与远程反击永不耗弹）
  noMelee?: boolean;              // 近战禁手（正面特技：被贴身时主动攻击仍可照常发动远程射击，遭近战打击时仍会进行衰减近战反击）
  noRanged?: boolean;             // 远程禁手（封锁远程攻击与远程反击）
  noMeleePenalty?: boolean;       // 近战无衰减（射手贴身肉搏伤害不打折）
  flying?: boolean;               // 飞行（无视城墙以外地形、障碍与减速）
  teleport?: boolean;             // 瞬间移动（受移动距离限制，无视中间全部地形障碍、城墙、流沙与单位阻挡直达合法陆地空位）
  globalTeleport?: boolean;       // 深渊全图瞬移（无移动距离限制，无视全部障碍直达全战场任意合法陆地空位）
  siegeBreaker?: boolean;         // 攻城破墙（《暴风前夕》独立攻城巨像）
  magicImmune?: boolean;          // 全魔法免疫（黑龙专属：绝对免疫一切敌方与己方正面/负面法术、符卡魔力与结界领域）
  darkNature?: boolean;           // 暗系（对非暗系、非四大特殊类型的活体单位额外造成 +15% 伤害，承受魔法伤害额外 +10%，且受生命破邪克制）
  doubleStrike?: boolean;         // 双重攻击（通用/天生连击或火猫连击赋予，近战与远程皆连打两段）
  meleeDoubleStrike?: boolean;    // 近战双重攻击（格斗·近战宗师 Lv.5 专属，仅主动近战时连打两段）
  rangedDoubleStrike?: boolean;   // 远程双重攻击（格斗·射击宗师 Lv.5 专属，仅主动远程时连射两段）
  charge?: boolean;               // 冲锋增伤（近战突进每格伤害 +5%）
  deathWard?: boolean;            // 抗死结界（对死亡/不死/混沌/暗系敌军非法术防御 +25%，死亡与混沌魔法减伤 50%）
  lifeWard?: boolean;             // 抗生结界（承受生命系法术伤害 -50%，迎战生命阵营敌军时有效防御 +50%）
  chaosWard?: boolean;            // 抗混结界（承受混沌系法术伤害 -50%，迎战混沌阵营敌军时有效防御 +50%）
  skeletal?: boolean;             // 骸骨体质（承受远程打击时有效防御 +100%）
  insubstantial?: boolean;        // 虚无体质（承受近战与远程物理打击时有效防御 +100%）
  manaLeech?: boolean;            // 魔力吸取（每回合行动前自动从敌方施法者窃取灵力并输送给己方施法者）
  agingOnHit?: boolean;           // 衰老触碰（近战命中概率施加衰老：攻 -25%、防 -20%、速/先 -50%）
  threeHeadedAttack?: boolean;    // 三翼裂袭（主动近战同时横扫与自身和主目标共同相邻的左右侧敌军）
  lifeDraining?: boolean;         // 吸血复苏（近战伤害的 50% 转化为自身治疗并复活同堆叠阵亡兵力）
  poisonAttack?: boolean;         // 剧毒喷射（远程或近战命中活体目标时附加持续剧毒流血）
  fearAttack?: boolean;           // 死灵恐惧（主动近战攻击非心智免疫目标时压制敌方反击）
  coldResistant?: boolean;        // 寒冰抗性（免疫寒冰系法术，承受寒冰打击伤害减半）
  freezingAttack?: boolean;       // 寒霜冻结（近战命中概率冰封目标 2 回合跳过行动）
  block?: boolean;                // 绝对格挡（35% 概率完全免疫一次物理或远程打击）
  stunOnHit?: boolean;            // 符箓定身（命中概率定身敌军 1 回合）
  terrorOnHit?: boolean;          // 噩梦震慑（命中概率震慑敌军 1 回合并降防）
  stoneGaze?: boolean;            // 魔眼石化（命中概率额外石化击杀低阶敌兵）
  fireShield?: boolean;           // 烈焰护盾（受近战攻击时反弹 22% 烈焰反伤）
  fireResistant?: boolean;        // 炽焰抗性（免疫烈焰反伤与龙息余烬，混沌火系法术减半）
  chaosResistant?: boolean;       // 混沌抗性（承受混沌系法术与混沌符卡伤害 -25%）
  lightningResistant?: boolean;   // 雷电抗性（承受雷电系法术伤害 -25%）
  giantSlayer?: boolean;          // 巨人杀手（攻击 4 阶巨兽时额外造成 +50% 伤害）
  orderPurgeRanged?: boolean;     // 净秽裁决（远程攻击非秩序阵营单位时额外造成 +20% 伤害）
  multipleAttack?: boolean;       // 周身全扫（主动近战同时横扫周围全部相邻敌军）
  breathAttack?: boolean;         // 贯穿吐息（主动近战沿攻势方向贯穿灼烧目标身后一格）
  mechanical?: boolean;           // 机械 / 器灵构造体（原版生物类型：免疫士气、心智、活体生理效果与活体治疗）
  undead?: boolean;               // 不死 / 亡灵（原版生物类型：免疫士气、心智与活体治疗，给非死亡友军 -2 士气，吃圣言/招魂复生）
  elemental?: boolean;            // 元素 / 纯灵（原版生物类型：免疫毒/瘟疫/吸血/死亡之手与活体治疗，保留士气感召）
  stealth?: boolean;              // 影遁潜行（受远程打击减伤 15%，身法灵动）
  spellcaster?: boolean;          // 施法兵种（可在战斗中打开魔导折本施放专属术式）
  resurrection?: boolean;         // 战场复活（可施放苏生神术令友军阵亡兵力重返战阵）
}

/** 单位受控异常与法术附魔状态（完整覆盖 HoMM4 五系 142 法术全机制！） */
export interface UnitStatusEffects {
  /** 定身剩余回合（轮到行动时强制跳过并解除） */
  stunnedRounds: number;
  /** 震慑剩余回合（跳过行动且防御下滑） */
  terrifiedRounds: number;
  /** 寒霜冻结剩余回合（跳过行动） */
  frozenRounds?: number;
  /** 衰老凋零剩余回合（攻 -25%、防 -20%、移速/先手 -50%） */
  agedRounds?: number;
  /** 致盲（Blind）：跳过行动，受伤害立即解除 */
  blindRounds?: number;
  /** 混乱/蜂群干扰（Confusion / Wasp Swarm）：跳过下一次行动 */
  confusionRounds?: number;
  /** 和平之歌（Song of Peace）：无法攻击或施法，受伤即破除 */
  songOfPeaceRounds?: number;
  /** 怯懦（Cowardice）：3 回合内不可攻击总生命值高于自身的敌军 */
  cowardiceRounds?: number;
  /** 狂暴（Berserk）：轮到行动时自动攻击最近任意单位（不分敌我） */
  berserkRounds?: number;
  /** 催眠（Hypnotize）：暂时倒戈至施法者阵营 */
  hypnotizedRounds?: number;
  hypnotizedOriginalSide?: SideId;
  /** 持续伤害与再生（中毒/瘟疫/生命再生） */
  poisonPower?: number;
  plaguePower?: number;
  regenPerRound?: number;
  /** 圣盾临时额外生命（Heavenly Shield） */
  tempShieldHp?: number;
  /** 守护天使额外复生次数（Guardian Angel） */
  guardianAngelLives?: number;
  /** 圣域庇护（Sanctuary）：免疫一切攻击与法术，行动后解除 */
  sanctuary?: boolean;
  /** 殉道者（Martyr）：该单位承受的全部伤害转移给指定友军承担 */
  martyrProtectedByUnitId?: string;
  /** 反伤与镜面结界 */
  retribution?: boolean;
  painMirror?: boolean;
  magicMirror?: boolean;
  /** 战斗物理附魔 */
  vampiricTouch?: boolean;
  fireAura?: boolean;
  auraOfFear?: boolean;
  slayer?: boolean;
  bless?: boolean;
  curse?: boolean;
  defenderBonus?: boolean;
  terrainWalk?: boolean;
  blur?: boolean;
  /** 天眼狙定（Precision）：剩余回合内仅远程攻击 +25%，绝不加成近战 */
  precisionRounds?: number;
  /** 鬼神狂战 / 百鬼狂潮（Bloodlust / Bloodfrenzy）：剩余回合内仅近战伤害 +25%，绝不加成远程 */
  bloodlustRounds?: number;
  /** 兔化变身剩余回合（竹林妖怪兔专属：持续期间切换为妖兔真身模型并获得先攻，到期或驱散后自动还原） */
  rabbitFormRounds?: number;
  /** 兔化变身前的原始模型蓝图 ID（用于还原形态） */
  rabbitFormOriginalBlueprintId?: string;
  /** 本次兔化是否临时赋予了先攻特技（用于到期精准回收） */
  rabbitFormGrantedFirstStrike?: boolean;
  /** 施法反制诅咒 */
  powerDrain?: boolean;
  magicLeechCasterId?: string;
  spellShacklePower?: number;
  /** 战斗临时反魔与解离标记 */
  antiMagic?: boolean;
  disintegrated?: boolean;
  /** 已被招魂或死灵转化消耗掉的阵亡残骸生命池（防止同一残骸被无限白嫖招魂） */
  consumedCorpseHp?: number;
  /** 五系派系守护（Chaos/Death/Nature/Order Ward：对应系法术减伤 50% + 对应系敌军攻击时防御 +50%） */
  schoolWards?: Partial<Record<Alignment, boolean>>;
  /** 动态法术赋予的临时特技标记（用于驱散时精准回收） */
  grantedAbilities?: Array<'firstStrike' | 'doubleStrike' | 'flying' | 'noRanged' | 'longRange' | 'noObstaclePenalty' | 'magicImmune'>;
  /** 各状态旗标的施加单调序号（用于 20 格状态上限 FIFO 顶替） */
  entryOrder?: Record<string, number>;
}

/** HoMM4 9 大主技能树骨架（支持 37 种双修进阶职业） */
export type PrimarySkillId =
  | 'tactics'
  | 'combat'
  | 'scouting'
  | 'nobility'
  | 'life_magic'
  | 'order_magic'
  | 'death_magic'
  | 'chaos_magic'
  | 'nature_magic';

/** HoMM4 全量 27 项二级子技能（9 主技能 × 3 子技能 = 36 技能完整体系） */
export type SecondarySkillId =
  // 格斗 Combat
  | 'melee'
  | 'archery'
  | 'magic_resistance'
  // 战术 Tactics
  | 'offense'
  | 'defense'
  | 'leadership'
  // 侦查 Scouting
  | 'pathfinding'
  | 'seamanship'
  | 'stealth'
  // 贵族 Nobility
  | 'estates'
  | 'mining'
  | 'diplomacy'
  // 生命魔法 Life Magic
  | 'healing'
  | 'spirituality'
  | 'resurrection_skill'
  // 秩序魔法 Order Magic
  | 'enchantment'
  | 'wizardry'
  | 'charm'
  // 死亡魔法 Death Magic
  | 'occultism'
  | 'demonology'
  | 'necromancy'
  // 混沌魔法 Chaos Magic
  | 'conjuration'
  | 'pyromancy'
  | 'sorcery'
  // 自然魔法 Nature Magic
  | 'herbalism'
  | 'meditation'
  | 'summoning';

export type SkillRank = 0 | 1 | 2 | 3 | 4 | 5;

/** 进阶职业专属机制被动（全 37 种组合职业精确对齐 H4 原版实战能力） */
export interface HeroClassPassiveEffects {
  manaCostDelta?: number;
  manaRegenPerRound?: number;
  allSpellBonusPct?: number;
  schoolSpellBonusPct?: Partial<Record<Exclude<Alignment, 'might'>, number>>;
  fireSpellBonusPct?: number;
  illusionBonusPct?: number;
  specificSpellBonusPct?: Record<string, number>;
  healingBonusPct?: number;
  summonBonusPct?: number;
  necromancyBonusPct?: number;
  heroMeleeAttackFlat?: number;
  heroRangedAttackFlat?: number;
  heroMeleeDamagePct?: number;
  heroRangedDamagePct?: number;
  heroDefensePct?: number;
  heroMaxMorale?: boolean;
  heroMaxLuck?: boolean;
  allyMoraleDelta?: number;
  allyLuckDelta?: number;
  enemyMoraleDelta?: number;
  allySpeedDelta?: number;
  allyInitiativeDelta?: number;
  allyOffensePct?: number;
  allyDefensePct?: number;
  allyHpPct?: number;
  spellRangeDelta?: number;
  grantRanged?: boolean;
  grantDeathWard?: boolean;
  grantChaosWard?: boolean;
  grantFireShield?: boolean;
  grantFireResistant?: boolean;
  grantFireSpellImmune?: boolean;
  grantLongRange?: boolean;
  grantVampiric?: boolean;
  vampiricRatio?: number;
  grantFirstStrike?: boolean;
  grantPermanentBloodlust?: boolean;
  grantPermanentBlur?: boolean;
  grantStunOnHit?: boolean;
  grantAgingOnHit?: boolean;
  grantPoisonAttack?: boolean;
  grantFearAttack?: boolean;
  inflictMinMoraleOnHit?: boolean;
  ignoreEnemyWards?: boolean;
}

export interface AdvancedClassDef {
  id: string;
  name: string;
  /** HoMM4 原版中英文双语职业参考名 */
  h4Name?: string;
  /** 是否为基础单系职业 */
  isBaseClass?: boolean;
  /** 特殊全能门槛（如大法师需要 3 系及以上高阶魔法） */
  minMagicTrees?: number;
  primaryA: PrimarySkillId;
  primaryB: PrimarySkillId;
  description: string;
  bonuses: Omit<StatModifier, 'id' | 'remainingRounds'>[];
  passive?: HeroClassPassiveEffects;
}

/** 资料片《极速风暴》组合神器套装骨架 */
export interface ArtifactDef {
  id: string;
  name: string;
  slot: 'weapon' | 'armor' | 'head' | 'accessory' | 'ring';
  setId?: string;
  description: string;
  modifiers: Omit<StatModifier, 'id' | 'remainingRounds'>[];
}

export interface ArtifactSetDef {
  id: string;
  name: string;
  requiredCount: number;
  description: string;
  modifiers: Omit<StatModifier, 'id' | 'remainingRounds'>[];
}

/** HoMM4 英雄腰带战斗药水 */
export interface PotionDef {
  id: string;
  name: string;
  description: string;
  effectType: 'heal' | 'mana_charge' | 'combat_elixir';
  power: number;
  color: string;
}

export interface PotionSlot {
  potionId: string;
  charges: number;
}

/** 通用五系法术目标类型（完整支持 H4 单体/全体/区域/召唤/传送/双选/尸体/大地图） */
export type SpellTargetType =
  | 'enemy_unit'
  | 'ally_unit'
  | 'any_unit'
  | 'self'
  | 'hex_line'
  | 'hex_aoe'
  | 'hex_empty'
  | 'unit_to_hex'
  | 'ally_to_ally'
  | 'corpse_unit'
  | 'adventure';

/** HoMM4 专项法术结算原语（确保 142 个法术全部走真实引擎逻辑，零空壳！） */
export type SpellSpecialEffect =
  | 'standard'
  | 'bless'
  | 'mass_bless'
  | 'curse'
  | 'mass_curse'
  | 'exorcism'
  | 'mass_exorcism'
  | 'cancellation'
  | 'mass_cancellation'
  | 'dispel'
  | 'mass_dispel'
  | 'steal_enchantment'
  | 'steal_all_enchantments'
  | 'holy_word'
  | 'holy_shout'
  | 'heavenly_shield'
  | 'martyr'
  | 'retribution'
  | 'song_of_peace'
  | 'regeneration'
  | 'prayer'
  | 'divine_intervention'
  | 'guardian_angel'
  | 'sanctuary'
  | 'ward_single'
  | 'ward_mass'
  | 'defender'
  | 'blur'
  | 'mass_blur'
  | 'precision'
  | 'mass_precision'
  | 'displacement'
  | 'cowardice'
  | 'create_illusion'
  | 'phantom_image'
  | 'flight'
  | 'power_drain'
  | 'banish'
  | 'forgetfulness'
  | 'teleport'
  | 'berserk'
  | 'blind'
  | 'hypnotize'
  | 'pain_mirror'
  | 'poison'
  | 'plague'
  | 'life_drain'
  | 'unholy_song'
  | 'aura_of_fear'
  | 'magic_leech'
  | 'vampiric_touch'
  | 'hand_of_death'
  | 'sacrifice'
  | 'raise_undead'
  | 'animate_dead'
  | 'death_call'
  | 'bloodlust'
  | 'mass_bloodlust'
  | 'fire_aura'
  | 'slayer'
  | 'mass_slayer'
  | 'sparks'
  | 'confusion'
  | 'cloud_of_confusion'
  | 'first_strike'
  | 'mass_first_strike'
  | 'mana_flare'
  | 'spell_shackle'
  | 'fire_ring'
  | 'magic_mirror'
  | 'cat_reflexes'
  | 'armageddon'
  | 'chain_lightning'
  | 'disintegrate'
  | 'terrain_walk'
  | 'giant_strength'
  | 'dragon_strength'
  | 'quicksand'
  | 'wasp_swarm'
  | 'anti_magic'
  | 'necromancy_ward'
  | 'summon_creature'
  | 'rabbit_transform'
  | 'adventure_only';

export interface SpellDef {
  id: string;
  name: string;
  /** 东方双层符卡前缀（两字符头，如「结界」「境符」「雷符」，悬停时组合成 结界「二重结界」） */
  spellCardPrefix?: string;
  /** 官方 H4 英文原名（供悬停考据展示） */
  enName?: string;
  alignment: Alignment;
  level: 1 | 2 | 3 | 4 | 5;
  manaCost: number;
  targetType: SpellTargetType;
  range: number;
  aoeRadius?: number;
  lineLength?: number;
  /** 一句话精炼简介（不含等级/派系前缀与多余括号） */
  summary?: string;
  /** 客观精准的规则效果描述 */
  effect?: string;
  /** 可选东方彩蛋风味文本（渲染为底部斜体小字，仅精选部分法术配备） */
  flavor?: string;
  description: string;
  /** 视觉特效映射键（由 pixelfx 适配层消费） */
  vfxKey: string;
  /** H4 专项机制原语 */
  specialEffect?: SpellSpecialEffect;
  /** 群体施法目标域（搭配 standard 修饰器/治疗使用） */
  massScope?: 'all_allies' | 'all_enemies' | 'all_units';
  /** 派系守护目标阵营（Chaos/Death/Nature/Order Ward） */
  wardSchool?: Alignment;
  /** 召唤 / 招魂使用的生物模板 ID */
  summonTemplateId?: string;
  /** 仅影响活体（如疲劳/瘟疫/蜂群对机械与亡灵无效） */
  livingOnly?: boolean;
  /** 是否属于大地图专用术式（战斗内仅陈列于魔导书供检阅） */
  isAdventureOnly?: boolean;
  /** 是否属于兵种专属天生术式（不随英雄提升魔法技能自动解锁） */
  isCreatureOnly?: boolean;
  /** 效果参数 */
  damageBase?: number;
  healBase?: number;
  /** 复活治疗量（可令阵亡友军小兵堆叠重返战阵，上限为初始 maxCount） */
  reviveBase?: number;
  /** 是否属于火焰系法术（受火抗减伤） */
  isFireSpell?: boolean;
  /** 是否属于雷电系法术（受雷电抗性减伤） */
  isLightningSpell?: boolean;
  /** 是否属于寒冰系法术（受寒冰抗性免疫） */
  isColdSpell?: boolean;
  /** 是否忽略视线阻挡（如全域群体术式、大地图术式、传送、召唤） */
  ignoreLos?: boolean;
  buffModifiers?: Omit<StatModifier, 'id' | 'remainingRounds'>[];
  buffDuration?: number;
  debuffModifiers?: Omit<StatModifier, 'id' | 'remainingRounds'>[];
  debuffDuration?: number;
}

/** 东方英雄专属符卡宣言定义 */
export interface SpellCardDef {
  id: string;
  name: string;
  subtitle: string;
  ownerHeroDefId: string;
  alignment: Alignment;
  manaCost: number;
  /** 需要符卡充能值（0~100） */
  chargeCost: number;
  targetType: 'field_self' | 'hex_line';
  lineLength?: number;
  damageBase?: number;
  /** 展开的战场结界领域配置 */
  fieldAura?: {
    id: string;
    name: string;
    durationRounds: number;
    themeColor: string;
    accentColor: string;
    pattern: 'yin_yang' | 'hakke_star' | 'lunar_astrolabe' | 'scarlet_moon';
    allyModifiers: Omit<StatModifier, 'id' | 'remainingRounds'>[];
    enemyModifiers: Omit<StatModifier, 'id' | 'remainingRounds'>[];
  };
  /** 一句话精炼简介 */
  summary?: string;
  /** 客观规则效果描述 */
  effect?: string;
  /** 底部斜体小字彩蛋文本 */
  flavor?: string;
  description: string;
  vfxKey: string;
}

/** 英雄静态定义（唯一角色） */
export interface HeroDefinition {
  id: string;
  name: string;
  title: string;
  alignment: Alignment;
  level: number;
  baseStats: {
    attack: number;
    defense: number;
    minDamage: number;
    maxDamage: number;
    maxHp: number;
    speed: number;
    initiative: number;
    range: number;
    ammo: number;
    morale: number;
    luck: number;
    magicResistance: number;
    grazeChance: number;
    spellPower: number;
    maxMana: number;
  };
  abilities: UnitAbilities;
  innateTraitIds: string[];
  knownSpellIds: string[];
  signatureSpellCardId: string;
  initialSkills: Partial<Record<PrimarySkillId, SkillRank>>;
  initialSubSkills?: Partial<Record<SecondarySkillId, SkillRank>>;
  initialSelectedClassId?: string;
  initialPotions: PotionSlot[];
  initialArtifacts?: string[];
  footprint?: FootprintSize;
  voxelBlueprintId: string;
  themeColor: string;
  accentColor: string;
}

/** 量产兵种静态定义（非东方有名角色：杂鱼/族群/造物） */
export interface CreatureDefinition {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  alignment: Alignment;
  description: string;
  footprint: FootprintSize;
  baseStats: {
    attack: number;
    defense: number;
    minDamage: number;
    maxDamage: number;
    maxHp: number;
    speed: number;
    initiative: number;
    range: number;
    ammo: number;
    morale: number;
    luck: number;
    magicResistance: number;
    grazeChance: number;
    /** 可选：具备灵力/施法特性的兵种蓝条上限与法强 */
    spellPower?: number;
    maxMana?: number;
  };
  abilities: UnitAbilities;
  /** 可选：施法兵种天生掌握的术式 ID 列表 */
  knownSpellIds?: string[];
  /** H4 阵营科技线标记（t1_a / t1_b / a / b / neutral） */
  branchTag?: 't1_a' | 't1_b' | 'a' | 'b' | 'neutral';
  voxelBlueprintId: string;
  themeColor: string;
  accentColor: string;
}

/** 战场运行时单位实体（英雄与兵种统一置于 7 格编队） */
export interface BattleUnit {
  id: string;
  defId: string;
  kind: 'hero' | 'creature';
  side: SideId;
  name: string;
  title?: string;
  alignment: Alignment;
  /** 位置与状态（pos 为多格体积左上锚格，footprint 决定占据格数） */
  pos: HexCoord;
  footprint: FootprintSize;
  facing: 'right' | 'left';
  status: 'alive' | 'knocked_out' | 'dead';
  /** 数量与生命（英雄固定 count=1，兵种可堆叠） */
  count: number;
  maxCount: number;
  currentHp: number;
  /** 基础属性快照 */
  baseStats: {
    attack: number;
    defense: number;
    minDamage: number;
    maxDamage: number;
    maxHp: number;
    speed: number;
    initiative: number;
    range: number;
    morale: number;
    luck: number;
    magicResistance: number;
    grazeChance: number;
    spellPower: number;
    maxMana: number;
  };
  abilities: UnitAbilities;
  /** 单位原始基础特技快照（供英雄切换职业/子技能时干净重算派生特技） */
  baseAbilities?: UnitAbilities;
  ammo: number;
  maxAmmo: number;
  /** 运行时临时修饰器（法术 Buff/Debuff、防御姿态、药水） */
  modifiers: StatModifier[];
  /** 运行时控制异常状态（定身/震慑） */
  statusEffects: UnitStatusEffects;
  /** 回合行动状态 */
  hasActedThisRound: boolean;
  hasWaitedThisRound: boolean;
  isDefending: boolean;
  /** 本回合是否已消耗默认 1 次反击配额（近战与远程反击共用，带 unlimitedRetaliation 则不受此限） */
  hasRetaliatedThisRound?: boolean;
  /** 本回合是否已饮用腰带秘药（不消耗行动权，但每名英雄每回合限用 1 次，下回合刷新） */
  hasUsedPotionThisRound?: boolean;
  /** 本回合士气检定结果（正统 HoMM4 机制：good = 先手第一梯队 & 伤害 +25%；bad = 末位梯队 & 伤害 -20%） */
  roundMoraleState?: 'good' | 'neutral' | 'bad';
  /** 英雄专属运行时状态 */
  level?: number;
  mana?: number;
  powerPoints?: number;
  maxPowerPoints?: number;
  spellCardCharge?: number;
  innateTraitIds: string[];
  knownSpellIds: string[];
  signatureSpellCardId?: string;
  potions: PotionSlot[];
  skills: Partial<Record<PrimarySkillId, SkillRank>>;
  subSkills: Partial<Record<SecondarySkillId, SkillRank>>;
  advancedClassId?: string;
  /** 玩家在战斗场景外主动选定的进阶组合职业（留空则按最高两系自动判定） */
  selectedAdvancedClassId?: string | null;
  equippedArtifactIds: string[];
  /** 视觉引用 */
  voxelBlueprintId: string;
  themeColor: string;
  accentColor: string;
  /** 战场召唤物或幻象标记（受秩序「驱逐 Banish」克制） */
  isSummoned?: boolean;
  isIllusion?: boolean;
  /** 战场召唤来源细分：幻象(illusion) / 召唤(summoned) / 复生招魂(raised)，用于血条颜色与视觉表现区分 */
  summonKind?: SummonKind;
}

/** 战场召唤来源细分类型（幻象 / 召唤 / 复生） */
export type SummonKind = 'illusion' | 'summoned' | 'raised';

/** 统一解析单位的召唤来源类别（兼容仅标记 isIllusion / isSummoned 的历史或测试快照） */
export function resolveUnitSummonKind(
  unit: Pick<BattleUnit, 'summonKind' | 'isIllusion' | 'isSummoned'>,
): SummonKind | null {
  if (unit.summonKind) return unit.summonKind;
  if (unit.isIllusion) return 'illusion';
  if (unit.isSummoned) return 'summoned';
  return null;
}

/** 激活中的战场符卡结界领域 */
export interface ActiveFieldAura {
  id: string;
  spellCardId: string;
  name: string;
  casterUnitId: string;
  casterSide: SideId;
  remainingRounds: number;
  themeColor: string;
  accentColor: string;
  pattern: 'yin_yang' | 'hakke_star' | 'lunar_astrolabe' | 'scarlet_moon';
  allyModifiers: Omit<StatModifier, 'id' | 'remainingRounds'>[];
  enemyModifiers: Omit<StatModifier, 'id' | 'remainingRounds'>[];
  captured: boolean;
}

/** 单场战斗的完整确定性状态树 */
export interface BattleState {
  battleId: string;
  mapWidth: number;
  mapHeight: number;
  tiles: Record<string, HexTile>;
  units: Record<string, BattleUnit>;
  /** 行动顺序队列（存放单位 ID） */
  turnQueue: string[];
  /** 本回合选择“等待”的延迟队列 */
  waitQueue: string[];
  activeUnitId: string | null;
  round: number;
  phase: 'active' | 'finished';
  winner: SideId | null;
  controllers: Record<SideId, ControllerType>;
  activeFieldAura: ActiveFieldAura | null;
  /** 战斗平衡模式开关（原版公式 / 调优平衡） */
  balancePreset: 'classic_h4' | 'equilibris_tuned';
  /** 战场全局法术状态（魔力涌动 Mana Flare / 亡灵结界 Necromancy Ward / 流沙区 Quicksand） */
  battleSpellFlags: {
    manaFlareActive: boolean;
    necromancyWardActive: boolean;
    quicksandHexKeys: string[];
  };
  /** 符卡收取荣誉记录 */
  capturedSpellCards: Array<{ spellCardName: string; bySide: SideId; bonusText: string }>;
  rng: RngState;
  actionLog: string[];
  /** 累计命令计数，用于生成确定性 ID */
  commandSeq: number;
  /** 战斗是否已正式打响（false 表示处于战前整备阶段，允许自由切换已解锁进阶职业与试配加点） */
  hasCombatStarted?: boolean;
  /** 全局 Buff/Debuff 施加顺序单调计数器（供 20 格 FIFO 顶替排序使用） */
  nextStatusOrder?: number;
}

/** 玩家/AI 派发至引擎的确定性指令 */
export type CombatCommand =
  | { type: 'MOVE'; unitId: string; to: HexCoord }
  | { type: 'ATTACK'; unitId: string; targetId: string; moveTo?: HexCoord; forceMelee?: boolean }
  | {
      type: 'CAST_SPELL';
      unitId: string;
      spellId: string;
      targetUnitId?: string;
      targetHex?: HexCoord;
      secondTargetUnitId?: string;
      secondTargetHex?: HexCoord;
    }
  | { type: 'DECLARE_SPELL_CARD'; unitId: string; targetHex?: HexCoord }
  | { type: 'USE_POTION'; unitId: string; potionId: string }
  | { type: 'WAIT'; unitId: string }
  | { type: 'DEFEND'; unitId: string };

/** 额外次级打击记录（周身全扫 Multiple Attack / 龙息贯穿 Breath Attack / 烈焰护盾反伤） */
export interface SecondaryHitReport {
  targetId: string;
  damage: number;
  kills: number;
  kind: 'cleave' | 'breath' | 'fire_shield';
  blocked?: boolean;
}

/** 单次打击的详细结果（供 UI 与特效表现层消费） */
export interface StrikeReport {
  attackerId: string;
  defenderId: string;
  damage: number;
  kills: number;
  isRanged: boolean;
  isRetaliation: boolean;
  grazed: boolean;
  grazeManaGain: number;
  luckyCrit: boolean;
  /** 攻击方触发负面厄运（伤害减半） */
  unluckyHit?: boolean;
  /** 防守方触发正面幸运护身（所受物理伤害减半） */
  defenderLucky?: boolean;
  /** 防守方触发负面厄运破防（所受物理伤害 +25%） */
  defenderUnlucky?: boolean;
  /** 是否触发高台掩护减伤（目标地势高于低处射手，远程伤害 -25%） */
  highGroundBonus: boolean;
  losStatus: 'clear' | 'partial' | 'blocked';
  traitNotes: string[];
  /** 是否被目标「绝对格挡」完全抵消 */
  blocked?: boolean;
  /** 魔眼石化额外即死兵力数 */
  petrifyKills?: number;
  /** 命中附加的异常状态名称（如定身/震慑/冰封/衰老/剧毒） */
  appliedStatus?: 'stunned' | 'terrified' | 'frozen' | 'aged' | 'poisoned';
  /** 剧毒喷射命中时瞬发结算的首段毒伤与折损兵力（无视物理防御） */
  poisonInstantDamage?: number;
  poisonInstantKills?: number;
  /** 触发双重攻击时的第二段追击报告 */
  followUpStrike?: {
    damage: number;
    kills: number;
    blocked?: boolean;
    luckyCrit: boolean;
    unluckyHit?: boolean;
    defenderLucky?: boolean;
    defenderUnlucky?: boolean;
    grazed: boolean;
    petrifyKills?: number;
  };
  /** 伴随本次打击触发的周身横扫、龙息贯穿或烈焰护盾反伤 */
  secondaryHits?: SecondaryHitReport[];
  /** 若本次远程反击被敌方前卫友军挡箭替伤，记录实际替伤友军 ID */
  interceptedByUnitId?: string;
}

/** 引擎执行后吐出的结构化演出事件流 */
export type CombatEvent =
  | { type: 'ROUND_STARTED'; round: number }
  | {
      type: 'STATUS_DOT_TICK';
      unitId: string;
      damage: number;
      kills: number;
      kind: 'poison' | 'plague';
    }
  | { type: 'TURN_STARTED'; unitId: string }
  | {
      type: 'UNIT_SKIPPED_TURN';
      unitId: string;
      reason: 'stunned' | 'terrified' | 'frozen' | 'blind' | 'confusion' | 'song_of_peace' | 'berserk';
    }
  | {
      type: 'MANA_LEECH';
      sourceUnitId: string;
      enemyUnitId: string;
      allyUnitId: string | null;
      amount: number;
    }
  | {
      type: 'MORALE_TRIGGERED';
      unitId: string;
      kind: 'good' | 'bad';
      morale: number;
    }
  | { type: 'UNIT_MOVED'; unitId: string; path: HexCoord[] }
  | {
      type: 'COMBAT_EXCHANGE';
      attackerId: string;
      defenderId: string;
      /** 反击实际命中单位 ID（触发远程反击前卫替伤时为替伤友军 ID，否则同 attackerId） */
      retaliationTargetId?: string;
      mode: 'simultaneous' | 'attacker_first' | 'defender_first' | 'one_way';
      attackerStrike: StrikeReport | null;
      defenderStrike: StrikeReport | null;
    }
  | {
      type: 'SPELL_CAST';
      casterId: string;
      spellId: string;
      spellName: string;
      vfxKey: string;
      targetHex: HexCoord;
      affectedUnitIds: string[];
      damageMap?: Record<string, { damage: number; kills: number; grazed: boolean }>;
      healMap?: Record<string, number>;
      reviveMap?: Record<string, { revivedCount: number; healedHp: number }>;
      summonedUnitIds?: string[];
      displacedUnits?: Array<{ unitId: string; to: HexCoord }>;
      noteText?: string;
    }
  | {
      type: 'SPELL_CARD_DECLARED';
      casterId: string;
      spellCardId: string;
      spellCardName: string;
      subtitle: string;
      vfxKey: string;
      themeColor: string;
      accentColor: string;
      lineHexes?: HexCoord[];
      damageMap?: Record<string, { damage: number; kills: number; grazed: boolean }>;
      fieldActivated: boolean;
    }
  | {
      type: 'SPELL_CARD_CAPTURED';
      spellCardName: string;
      bySide: SideId;
      bonusText: string;
    }
  | { type: 'POTION_USED'; unitId: string; potionName: string; summary: string; color: string }
  | { type: 'UNIT_WAITING'; unitId: string }
  | { type: 'UNIT_DEFENDING'; unitId: string }
  | { type: 'UNIT_KNOCKED_OUT'; unitId: string }
  | { type: 'UNIT_DIED'; unitId: string }
  | { type: 'BATTLE_ENDED'; winner: SideId };

/** HoMM4 原版远程距离与普通障碍物综合衰减档位（默认全伤 1x / 1/2 / 1/4 / 叠加普通障碍最低 1/8） */
export type RangedPenaltyTier = 'full' | 'half' | 'quarter' | 'eighth';

/** 射线阻挡体明细（用于明确告知玩家被何种障碍或哪支单位阻挡） */
export interface TrajectoryBlockerDetail {
  hex: HexCoord;
  kind: 'tall_obstacle' | 'partial_obstacle' | 'ally_unit' | 'enemy_unit' | 'out_of_bounds';
  label: string;
  unitId?: string;
}

/** 远程射击与施法瞄准统一飞行路径可视化模型 */
export interface ProjectileTrajectoryPreview {
  kind: 'ranged' | 'spell';
  fromHex: HexCoord;
  toHex: HexCoord;
  /** 路径是否被完全阻挡或因规则限制无法命中 */
  blocked: boolean;
  /** 无法命中或衰减的具体中文说明 */
  reason?: string;
  /** 视线遮挡状态 */
  losStatus: 'clear' | 'partial' | 'blocked';
  /** 远程衰减档位（仅远程射击填充） */
  rangedPenaltyTier?: RangedPenaltyTier;
  /** 若因超出射程被截断，记录有效射程与当前实际格距 */
  outOfRange?: { distance: number; maxRange: number };
  /** 射线途经的全部中间格（不含起止点） */
  intermediateHexes: HexCoord[];
  /** 触发完全阻挡的首个格子（舞台绘制醒目红框与 ✕ 拦截标记） */
  blockingHex?: HexCoord | null;
  /** 触发半遮挡降档的普通障碍格（舞台绘制琥珀菱形提示） */
  partialHexes: HexCoord[];
  /** 阻挡体清单 */
  blockers: TrajectoryBlockerDetail[];
}

/** 攻击预览（悬停敌方单位时展示精准同时反击与远程衰减估算） */
export interface AttackPreview {
  valid: boolean;
  reason?: string;
  /** 远程单位因受阻被迫转入近战或无法射击时的具体原因说明 */
  rangedBlockReason?: string;
  /** 远程飞行路径与阻挡诊断（畅通/半遮挡/彻底受阻时均填充，供战场与右侧情报区渲染） */
  trajectory?: ProjectileTrajectoryPreview | null;
  isRanged: boolean;
  /** 是否触发 H4「长武器」隔格无反击突刺 */
  isLongWeaponPoke?: boolean;
  /** 远程距离与普通障碍物综合衰减档位（近战恒为 full） */
  rangedPenaltyTier: RangedPenaltyTier;
  /** 远程衰减倍率（1 / 0.5 / 0.25 / 0.125） */
  rangedMultiplier: number;
  moveTo?: HexCoord;
  movePath?: HexCoord[];
  exchangeMode: 'simultaneous' | 'attacker_first' | 'defender_first' | 'one_way';
  expectedMinDamage: number;
  expectedMaxDamage: number;
  expectedMinKills: number;
  expectedMaxKills: number;
  willRetaliate: boolean;
  /** 反击实际命中单位 ID（触发远程反击前卫替伤时为替伤友军 ID） */
  retaliationTargetId?: string;
  /** 反击实际替伤前卫单位名称（仅触发前卫替伤时填充） */
  retaliationTargetName?: string;
  retaliationMinDamage: number;
  retaliationMaxDamage: number;
  retaliationMinKills: number;
  retaliationMaxKills: number;
  losStatus: 'clear' | 'partial' | 'blocked';
  /** 是否触发高台掩护减伤（目标地势高于低处射手，远程伤害 -25%） */
  highGroundBonus: boolean;
  targetGrazeChance: number;
  notes: string[];
}

export interface CommandResult {
  ok: boolean;
  error?: string;
  events: CombatEvent[];
}

export function getUnitMovementDomain(unit: BattleUnit): MovementDomain {
  if (unit.abilities.globalTeleport) return 'global_teleport';
  if (unit.abilities.teleport) return 'teleport';
  return unit.abilities.flying ? 'flying' : 'ground';
}

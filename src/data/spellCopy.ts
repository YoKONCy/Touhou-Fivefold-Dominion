/**
 * 《Touhou-H4》全 148 法术与专属符卡三段式精炼文案总表
 *
 * 文案铁律：
 * 1. summary：一句话简短简介，不复读副标题已有的派系与等级；
 * 2. effect：客观、精准陈述规则效果，零感叹号与零括号补充文本；
 * 3. flavor：仅精选部分代表性法术与符卡配备斜体小字东方彩蛋，留白克制。
 */

import type { SpellCardDef, SpellDef } from '@core/types';

export interface SpellCopyEntry {
  summary: string;
  effect: string;
  flavor?: string;
}

/** 全部 148 个注册法术的三段式文案表（35 生命 + 27 秩序 + 25 死亡 + 29 混沌 + 32 自然） */
export const SPELL_COPY_CATALOG: Record<string, SpellCopyEntry> = {
  // =========================================================================
  // 一、生命系 Life（32 H4 + 3 博丽固有 = 35 术）
  // =========================================================================
  life_bind_wound: {
    summary: '贴附愈合灵札的轻度止伤术。',
    effect: '为一名活体友军恢复生命值，治疗量随法强与生命魔法等级提升。',
  },
  life_bless: {
    summary: '博丽神社降下的神圣祝佑。',
    effect: '使一名友军在本场战斗中每次攻击恒定造成最大伤害。',
    flavor: '“神社的御守到底灵不灵，全看当天巫女的心情。”',
  },
  life_exorcism: {
    summary: '挥动御币驱除附身邪祟。',
    effect: '清除一名友军身上的全部负面诅咒、控制与减益效果。',
  },
  life_holy_word: {
    summary: '直击妖邪本源的破邪真言。',
    effect: '对一名敌军造成神圣伤害，对死亡系、不死、暗系与混沌系目标造成全额伤害，对其余目标伤害减半。',
  },
  life_spiritual_armor: {
    summary: '以灵札环绕周身构筑护甲。',
    effect: '使一名友军的近战与远程防御提升 25%，持续 5 回合。',
  },
  life_summon_ship: {
    summary: '唤来渡水幽船的行军法术。',
    effect: '仅限战略大地图使用，在相邻水域岸边召唤一艘渡船。',
  },
  life_chaos_ward: {
    summary: '隔绝混沌魔法的单体结界。',
    effect: '使一名友军获得 50% 混沌魔法抗性，迎击混沌系单位时防御提升 50%。',
  },
  life_death_ward: {
    summary: '抵御幽冥死气的单体结界。',
    effect: '使一名友军获得 50% 死亡魔法抗性，迎击死亡系、不死与暗系单位时防御提升 50%。',
  },
  life_defender: {
    summary: '稳固全军阵线的守御加护。',
    effect: '使全队友军在进入防御姿态时额外获得 50% 防御加成。',
  },
  life_heal: {
    summary: '倾注神社清泉甘露的强力治疗。',
    effect: '为一名活体友军恢复大量生命值，并同时解除剧毒与瘴疫。',
  },
  life_heavenly_shield: {
    summary: '巫女护身的博丽二重结界。',
    effect: '仅作用于施法者自身，生成高额临时护盾吸收后续伤害。',
    flavor: '“只要结界够厚，站在原地喝茶也打不着。”',
  },
  life_martyr: {
    summary: '以雏偶丝线转嫁厄运的替身术。',
    effect: '先选替身友军、再选受护友军，受护者承受的一切伤害均转移给替身承担。',
    flavor: '“把灾厄都塞进草人里顺流漂走，是幻想乡最古老的规矩。”',
  },
  life_mirth: {
    summary: '振奋斗志的神社欢欣神乐。',
    effect: '使一名友军士气提升 10 点，持续 5 回合。',
  },
  life_nature_ward: {
    summary: '隔绝自然魔法的单体结界。',
    effect: '使一名友军获得 50% 自然魔法抗性，迎击自然系单位时防御提升 50%。',
  },
  life_order_ward: {
    summary: '隔绝秩序魔法的单体结界。',
    effect: '使一名友军获得 50% 秩序魔法抗性，迎击秩序系单位时防御提升 50%。',
  },
  life_retribution: {
    summary: '以攻代守的因果反噬之印。',
    effect: '为一名友军施加因果印记，近战攻击者将承受 35% 伤害反噬。',
  },
  life_song_of_peace: {
    summary: '平息战意的镇魂神乐。',
    effect: '使一名活体敌军在 2 回合内无法攻击或施法，受到伤害后立即解除。',
    flavor: '“笛声一响，连最爱闹事的妖精也只想打个盹。”',
  },
  life_celestial_armor: {
    summary: '披覆全军的天界灵光铠甲。',
    effect: '使全队所有非魔免友军防御提升 25%，持续 5 回合。',
  },
  life_holy_shout: {
    summary: '震荡全场的退魔灵喝。',
    effect: '对场上所有死亡系、不死与暗系敌军造成群体神圣伤害。',
  },
  life_mass_bless: {
    summary: '降临全阵的众神神祝。',
    effect: '使全队所有非魔免友军攻击恒定造成最大伤害。',
  },
  life_mass_healing: {
    summary: '遍洒战场的常世神泉甘露。',
    effect: '为全体活体非魔免友军恢复生命值，并解除剧毒与瘴疫。',
  },
  life_regeneration: {
    summary: '引动常青灵脉的持续自愈术。',
    effect: '使一名友军在每回合开始时自动恢复生命值。',
  },
  life_mass_chaos_ward: {
    summary: '护持全阵的御混大结界。',
    effect: '使全体友军获得 50% 混沌魔法抗性，迎击混沌系单位时防御提升 50%。',
  },
  life_mass_death_ward: {
    summary: '护持全阵的御冥大结界。',
    effect: '使全体友军获得 50% 死亡魔法抗性，迎击死亡系、不死与暗系单位时防御提升 50%。',
  },
  life_mass_exorcism: {
    summary: '涤荡全阵厄祟的神社大祓。',
    effect: '清除全体友军身上的全部负面诅咒、控制与减益效果。',
  },
  life_mass_fervor: {
    summary: '如祭典宴会般昂扬的全军鼓舞。',
    effect: '使全体非魔免友军士气提升 10 点，持续 5 回合。',
    flavor: '“只要打完仗有宴会和甜酒，大家就会格外卖力。”',
  },
  life_mass_nature_ward: {
    summary: '护持全阵的御森大结界。',
    effect: '使全体友军获得 50% 自然魔法抗性，迎击自然系单位时防御提升 50%。',
  },
  life_mass_order_ward: {
    summary: '护持全阵的御律大结界。',
    effect: '使全体友军获得 50% 秩序魔法抗性，迎击秩序系单位时防御提升 50%。',
  },
  life_prayer: {
    summary: '凝聚神道愿力的全阵祈祷。',
    effect: '使己方全体生命系单位的生命上限与伤害各提升 25%。',
  },
  life_divine_intervention: {
    summary: '请动八百万神明降世的终极神迹。',
    effect: '使全体活体非魔免友军强力恢复并苏生阵亡兵力，同时净化一切负面状态与毒疫。',
    flavor: '“赛钱箱里偶尔多出一枚铜板时，神明也会格外慷慨。”',
  },
  life_guardian_angel: {
    summary: '垂落天羽庇护的护命神术。',
    effect: '赋予一名活体友军御神护命，濒临覆灭时自动触发救赎并重聚 35% 兵力。',
    flavor: '“别急着退场，博丽的神使还没签收你的名字。”',
  },
  life_sanctuary: {
    summary: '隔绝尘世纷争的常世净域。',
    effect: '使一名友军免疫一切攻击与法术直至主动行动，全队同时至多生效 1 个目标。',
    flavor: '“暂且歇口气吧，外面的弹幕可还没停呢。”',
  },
  life_ward: {
    summary: '贴身流转的博丽护身结界。',
    effect: '使一名友军防御提升 30%、擦弹率提升 18%，持续 3 回合。',
  },
  life_exorcism_orb: {
    summary: '追踪妖气的阴阳封魔灵弹。',
    effect: '对一名敌军造成灵力伤害，对暗系、不死、死亡系与混沌系目标额外提升 35% 伤害。',
  },
  life_resurrection: {
    summary: '召回离散魂魄的返魂苏生术。',
    effect: '复生一名活体友军已阵亡的兵力，上限为初始满编人数，满员时转为治疗。',
  },

  // =========================================================================
  // 二、秩序系 Order（27 术：25 战斗 + 2 大地图）
  // =========================================================================
  order_blur: {
    summary: '令身形如蜃气般虚实难辨的幻术。',
    effect: '使一名友军受到的远程伤害降低 35%，并显著提升擦弹闪避率。',
  },
  order_dispel: {
    summary: '拨动星律洗去附魔的解咒术。',
    effect: '清除任意单个单位身上的全部正面与负面法术效果，不解除剧毒与瘴疫。',
  },
  order_displacement: {
    summary: '折迭空间边界的斥退术式。',
    effect: '将一名敌军沿远离施法者的方向击退 2 格。',
  },
  order_magic_fist: {
    summary: '隔空凝形的无形念力重击。',
    effect: '对视线内一名敌军造成直接魔法冲击伤害。',
  },
  order_precision: {
    summary: '以天眼锁定弹道的精准加持。',
    effect: '使一名具备远程能力的友军远程攻击提升 25%，并获得精准射击与无视普通障碍特技。',
  },
  order_visions: {
    summary: '洞穿虚实的月都千里慧眼。',
    effect: '仅限战略大地图使用，探查目标敌军的兵力编成与英雄技能。',
  },
  order_cowardice: {
    summary: '动摇敌方胆魄的威慑幻瞳。',
    effect: '使一名活体敌军陷入胆怯 3 回合，无法主动攻击总生命值高于自身的单位。',
  },
  order_create_illusion: {
    summary: '折射蜃楼光影的造像幻术。',
    effect: '施法者实力显著高于目标单兵时，按目标当前血量与法强预算在旁侧生成可控幻象，预算不足整兵时生成残血幻象，不可复制幻象或过强高阶目标。',
  },
  order_flight: {
    summary: '挣脱大地束缚的浮游秘术。',
    effect: '赋予一名友军飞行特技，无视地形障碍直至战斗结束。',
    flavor: '“在幻想乡里，能飞不过是出门散步的基本礼仪。”',
  },
  order_ice_bolt: {
    summary: '凝霜成枪的极寒贯刺魔法。',
    effect: '对视线内一名敌军造成高额寒冰魔法伤害。',
  },
  order_power_drain: {
    summary: '截断灵脉回流的枯竭咒印。',
    effect: '使一名敌方施法者此后施放任意法术的灵力消耗翻倍。',
  },
  order_slow: {
    summary: '拨慢周身表盘的时滞术式。',
    effect: '使一名敌军的移动力与先手主动性各降低 50%，持续 4 回合。',
    flavor: '“慢半拍的时间，足够把整套银刃摆好角度。”',
  },
  order_steal_enchantment: {
    summary: '顺手牵羊的窃法秘技。',
    effect: '夺取一名敌军身上的有益法术增益，随机转移给一名己方友军。',
    flavor: '“只是借来参考一下，等我研究完就会还的。”',
  },
  order_banish: {
    summary: '撕裂境界裂隙的放逐禁术。',
    effect: '对敌方召唤物与幻象单位造成巨额放逐伤害。',
  },
  order_forgetfulness: {
    summary: '令射手忘却弹幕技艺的遗忘术。',
    effect: '使一名敌方远程单位在本场战斗中陷入远程禁手，无法进行远程射击。',
  },
  order_mass_blur: {
    summary: '覆盖全阵的蜃楼迷雾。',
    effect: '使全队非魔免友军获得远程减伤与高额擦弹率加成。',
  },
  order_mass_dispel: {
    summary: '重启全场灵律的归零大咒。',
    effect: '清除场上敌我全体单位的一切正负面法术效果，不解除剧毒与瘴疫。',
  },
  order_mass_precision: {
    summary: '笼罩全军的星瞳狙定。',
    effect: '使全体远程友军远程攻击提升 25%，并获得精准射击与无视障碍特技。',
  },
  order_teleport: {
    summary: '贯通两点的空间隙间传送。',
    effect: '先选一名己方友军、再选目标空地，将其瞬间传送至指定格位。',
    flavor: '“脚下忽然裂开一条缝隙时，最好别低头往里看。”',
  },
  order_town_gate: {
    summary: '直通据点的归乡隙间。',
    effect: '仅限战略大地图使用，将英雄与部队传送回最近的己方城镇。',
  },
  order_berserk: {
    summary: '扰乱心智的月狂赤瞳。',
    effect: '使一名活体敌军陷入狂暴，轮到行动时不分敌我攻击最近单位。',
    flavor: '“盯着满月看太久，连身旁的同伴也会显得格外刺眼。”',
  },
  order_blind: {
    summary: '以深沉宵暗吞没视野的蔽目术。',
    effect: '使一名活体敌军在 3 回合内无法行动，受到伤害后立即惊醒。',
    flavor: '“伸手不见五指的时候，连是不是十进制都数不清了。”',
  },
  order_mass_slow: {
    summary: '凝固整片战场的永夜时律。',
    effect: '使全体非魔免敌军的移动力与先手主动性各降低 50%，持续 4 回合。',
    flavor: '“把今夜拉得再长一点，直到满月落下之前。”',
  },
  order_phantom_image: {
    summary: '映照月华水镜的高阶镜像术。',
    effect: '施法者实力足够压制目标单兵时，高比例映照并按法强预算在旁侧生成强力幻象分身，预算不足整兵时生成残血单位且不可复制幻象。',
  },
  order_hypnotize: {
    summary: '牵引心神的迷梦傀儡戏。',
    effect: '使一名活体敌军在 3 回合内倒戈，归入施法者阵营听候调遣。',
  },
  order_pain_mirror: {
    summary: '映返痛楚的因果水镜。',
    effect: '为一名友军立起水镜，承受的一切近战与远程伤害 50% 反弹给攻击者。',
  },
  order_steal_all_enchantments: {
    summary: '席卷敌阵的大盗窃法秘术。',
    effect: '剥除敌方全体单位的有益法术增益，并逐一转移分配给己方友军。',
    flavor: '“全收进怀里才算得上体面的魔导收集家。”',
  },
  order_rabbit_transform: {
    summary: '解放竹林妖兔血脉的自用真身变身术。',
    effect: '仅可对自己施放，化作月影白兔真身并获得先攻，同时位移距离、先手主动与擦弹率各提升 50%，包含施法回合在内共持续 3 回合。',
    flavor: '“别小看竹林里蹦蹦跳跳的兔子，跑起来连月光都追不上呢！”',
  },

  // =========================================================================
  // 三、死亡系 Death（25 术：24 战斗 + 1 大地图）
  // =========================================================================
  death_cancellation: {
    summary: '以冥雾侵蚀附魔的消咒术。',
    effect: '剥除一名敌军身上的全部有益法术增益。',
  },
  death_curse: {
    summary: '招致霉运与衰败的厄祟诅咒。',
    effect: '使一名敌军在本场战斗中每次攻击恒定造成最小伤害。',
  },
  death_disrupting_ray: {
    summary: '蚀碎甲胄的幽冥阴线。',
    effect: '使一名敌军防御降低 20%，持续 6 回合，可多次叠加。',
  },
  death_poison: {
    summary: '萃取自无名之丘的铃兰剧毒。',
    effect: '立即对一名活体敌军造成毒伤，并在每回合持续扣血直至治愈。',
    flavor: '“无名之丘的花香很淡，察觉时往往已经太迟。”',
  },
  death_raise_skeletons: {
    summary: '唤醒战场亡骸的低阶招魂术。',
    effect: '消耗阵亡或减员残骸的剩余生命池，按法强预算在旁侧唤起不死「尸壳」，预算不足整兵时生成残血单位。',
  },
  death_animate_dead: {
    summary: '逆转生死的反魂起尸秘术。',
    effect: '按法强预算复生战损或阵亡友军并转为不死，不足整兵时复生残血单位；作用于敌方残骸时按残骸剩余生命转化为不死「尸壳」。',
  },
  death_fatigue: {
    summary: '榨干体力的寒冥倦雾。',
    effect: '使一名活体敌军移动力降低 50%、主动性降低 35%，持续 4 回合。',
  },
  death_life_drain: {
    summary: '汲取生机的西行妖冥樱。',
    effect: '对场上所有活体敌军造成幽冥伤害，并将总伤害的 50% 转化为施法者生命。',
    flavor: '“若西行妖再度满开，今夜的樱色便会更深一分。”',
  },
  death_mire: {
    summary: '拖慢敌军脚步的三途泥沼。',
    effect: '仅限战略大地图使用，使目标军团下回合行军移动力减半。',
  },
  death_sorrow: {
    summary: '令人心神溃散的彼岸悲歌。',
    effect: '使一名活体敌军士气降低 10 点，持续 5 回合。',
  },
  death_unholy_song: {
    summary: '克制神圣之力的幽冥反魂曲。',
    effect: '使敌方全体生命系单位的伤害与防御各降低 20%。',
  },
  death_weakness: {
    summary: '侵蚀筋骨气力的幽冥衰咒。',
    effect: '使一名敌军造成的全部战斗伤害降低 25%，持续 5 回合。',
  },
  death_aura_of_fear: {
    summary: '如百鬼夜行般的幽冥威压。',
    effect: '赋予一名友军恐惧光环，主动进攻非免疫敌军时压制对方反击。',
  },
  death_magic_leech: {
    summary: '寄生施法者灵脉的噬灵魔蛭。',
    effect: '使一名敌方施法者耗蓝翻倍，并将其消耗的灵力全数虹吸给施法者。',
  },
  death_mass_cancellation: {
    summary: '席卷敌阵的幽冥剥法浪潮。',
    effect: '剥除全体敌军身上的全部有益法术增益。',
  },
  death_mass_curse: {
    summary: '覆盖敌阵的百鬼厄祟。',
    effect: '使全体非魔免敌军每次攻击恒定造成最小伤害。',
  },
  death_plague: {
    summary: '漫延自黄泉比良坂的致命瘴疫。',
    effect: '敌我不分，令全战场所有活体单位陷入瘴疫，每回合持续损失生命。',
    flavor: '“黄泉的风从不挑拣吹向谁的衣袖。”',
  },
  death_raise_ghost: {
    summary: '自亡骸唤出游魂的中阶招魂术。',
    effect: '消耗战场残骸的剩余生命池，按法强预算唤起具备飞行、虚无体质与衰老触碰的不死「怨灵」，预算不足整兵时生成残血单位。',
  },
  death_death_call: {
    summary: '回应黄泉深处低语的召灵术。',
    effect: '按高额法强预算强力复生战损或阵亡友军并支持残血复生，作用于敌方残骸时按残骸剩余生命转化为不死「怨灵」。',
  },
  death_mass_sorrow: {
    summary: '响彻暗夜穹顶的冥界挽歌。',
    effect: '使全体活体非魔免敌军士气降低 10 点，持续 5 回合。',
  },
  death_mass_weakness: {
    summary: '令万物生机凋零的枯荣诅咒。',
    effect: '使全体非魔免敌军造成的战斗伤害降低 25%，持续 5 回合。',
  },
  death_vampiric_touch: {
    summary: '赐予嗜血本能的红雾密约。',
    effect: '赋予一名友军吸血能力，将每次近战伤害的 50% 转化为自身治疗与兵力复苏。',
    flavor: '“红茶凉了没关系，反正真正解渴的并不是茶。”',
  },
  death_hand_of_death: {
    summary: '直取寿数的冥府勾魂禁咒。',
    effect: '直接抹杀目标敌军多名士兵，对英雄目标造成巨额幽冥伤害。',
    flavor: '“寿数既尽，再华丽的弹幕也留不住离身的魂魄。”',
  },
  death_raise_vampires: {
    summary: '于暗夜血雾中苏醒的高阶招魂术。',
    effect: '消耗战场残骸的剩余生命池，按法强预算唤醒具备飞行、不受反击与吸血复苏的不死「血族眷属」，预算不足整兵时生成残血单位。',
  },
  death_sacrifice: {
    summary: '以命换命的彼岸献祭禁术。',
    effect: '先选献祭友军、再选复生友军，牺牲前者全部生机以强力复活后者。',
    flavor: '“彼岸的天平一向公平，只是代价总由生者称量。”',
  },
  death_summon_ice_demon: {
    summary: '深渊隙间恶魔召请极寒魔仆的专属术式。',
    effect: '消耗 8 MP 撕开冰霜深渊隙间，在指定空地召唤暗系「深渊冰魔」战队，具备寒冰抗性与寒霜冻结特技。',
    flavor: '“从深渊裂隙里钻出来的可不止红雾，还有冻彻骨髓的寒霜哦。”',
  },

  // =========================================================================
  // 四、混沌系 Chaos（27 H4 + 2 魔理沙固有 = 29 术）
  // =========================================================================
  chaos_bloodlust: {
    summary: '激荡狂烈战意的鬼神加持。',
    effect: '使一名友军的近战伤害提升 25%，持续 6 回合，不加成远程射击。',
  },
  chaos_fire_aura: {
    summary: '附着于兵刃之上的不死炽焰。',
    effect: '使一名友军的近战攻击额外附带 25% 火焰伤害。',
  },
  chaos_haste: {
    summary: '御风疾驰的魔导星风术。',
    effect: '使一名友军的移动力与先手主动性各提升 3 点，持续 5 回合。',
  },
  chaos_magic_arrow: {
    summary: '凝结星光魔力的基础飞矢。',
    effect: '对视线内一名敌军造成直接魔法伤害。',
  },
  chaos_slayer: {
    summary: '专斩巨妖与魔龙的锋锐魔刃。',
    effect: '使一名友军对所有 4 阶巨兽与龙类单位造成的伤害提升 50%。',
  },
  chaos_sparks: {
    summary: '近身迸射的星尘火花弹幕。',
    effect: '对施法者周身 2 格内的所有敌军造成火焰魔法伤害。',
  },
  chaos_confusion: {
    summary: '飘荡于魔法之森的迷幻魔雾。',
    effect: '扰乱一名活体敌军心智，使其丧失下一次行动回合。',
  },
  chaos_fire_bolt: {
    summary: '凝聚七曜火曜魔力的烈焰飞矢。',
    effect: '对视线内一名敌军造成高额火焰伤害，受火焰抗性减免。',
  },
  chaos_first_strike: {
    summary: '快若电光的抢攻身法。',
    effect: '赋予一名友军先攻特技直至战斗结束。',
  },
  chaos_mana_flare: {
    summary: '激荡地下灵脉的全域增幅。',
    effect: '本场战斗内，敌我全体施法者的法术灵力消耗永久减少 2 点，最低为 1 点。',
    flavor: '“魔法之森的发光蘑菇今晚格外耀眼。”',
  },
  chaos_misfortune: {
    summary: '倾泻积蓄厄运的流转诅咒。',
    effect: '使一名敌军幸运降低 10 点，持续 5 回合，提高攻防双向厄运触发概率。',
    flavor: '“把厄运顺着袖口转出去，顺便再转一圈。”',
  },
  chaos_spell_shackle: {
    summary: '反噬施法者的咒缚枷锁。',
    effect: '束缚一名敌方施法者，其此后每次消耗灵力施法都会承受反噬伤害。',
  },
  chaos_bloodfrenzy: {
    summary: '点燃全阵斗志的鬼宴狂潮。',
    effect: '使全队非魔免友军的近战伤害提升 25%，持续 6 回合，不加成远程射击。',
  },
  chaos_fire_ring: {
    summary: '避开中心格引爆的炽红业火环。',
    effect: '对目标格周围 1 环上的全部敌军造成火焰伤害，不波及中心格。',
  },
  chaos_fireball: {
    summary: '在目标点炸裂的炽炎星爆。',
    effect: '对目标格及周围 1 格内所有敌军造成火焰伤害，受火焰抗性减免。',
    flavor: '“魔法使之间解决争端，终究还是靠火力说话。”',
  },
  chaos_lightning: {
    summary: '自绯想天穹引落的狂暴紫电。',
    effect: '对视线内一名敌军造成高额雷电魔法伤害。',
  },
  chaos_magic_mirror: {
    summary: '折射敌方咒术的贤者魔镜。',
    effect: '为一名友军展开魔镜，敌方单体法术命中时以 50% 威力反弹回施法者。',
  },
  chaos_mass_slayer: {
    summary: '武装全军的屠龙魔刃阵。',
    effect: '使全队非魔免友军对所有 4 阶巨兽与龙类伤害提升 50%。',
  },
  chaos_cat_reflexes: {
    summary: '如妖猫般迅疾灵巧的连击秘技。',
    effect: '赋予一名友军双重攻击特技，每次主动进攻连续攻击两次。',
    flavor: '“别被她蹦蹦跳跳的样子骗了，第二爪永远比想象更快。”',
  },
  chaos_cloud_of_confusion: {
    summary: '笼罩一片区域的迷心毒云。',
    effect: '使目标周围 1 格内所有活体敌军陷入混乱，丧失下一次行动回合。',
  },
  chaos_implosion: {
    summary: '向一点极限坍缩的重力星崩。',
    effect: '对视线内一名敌军造成巨额单体魔法伤害。',
    flavor: '“当所有星屑都塌向同一个坐标，连逃跑的空间也不复存在。”',
  },
  chaos_inferno: {
    summary: '焚尽广袤区域的旧地狱核焰。',
    effect: '对目标格及周围 2 格内所有敌军造成大范围火焰魔法伤害。',
    flavor: '“地底灼热炉心的一缕余温，就足以烤焦整片树林。”',
  },
  chaos_mass_first_strike: {
    summary: '点亮全阵的极闪先制术。',
    effect: '赋予全队非魔免友军先攻特技直至战斗结束。',
  },
  chaos_mass_misfortune: {
    summary: '席卷敌阵的厄神灾厄旋涡。',
    effect: '使全体非魔免敌军幸运降低 10 点，持续 5 回合。',
  },
  chaos_armageddon: {
    summary: '召降焚世星陨的混沌终末禁咒。',
    effect: '敌我不分，对全战场所有非魔免单位造成巨额火焰伤害。',
    flavor: '“只要黑龙还在阵前，星火落遍全场也无妨。”',
  },
  chaos_chain_lightning: {
    summary: '在敌群间肆意跃动的五雷连锁。',
    effect: '重创主目标后依次向周围最近单位弹跳 4 次，每次弹跳威力减半。',
  },
  chaos_disintegrate: {
    summary: '令物质归于虚无的星穹湮灭光束。',
    effect: '对一名敌军造成毁灭性单体伤害，被湮灭的残骸无法招魂或复活。',
    flavor: '“连灰都不剩的话，打扫战场倒是轻松了不少。”',
  },
  chaos_star_bolt: {
    summary: '魔理沙惯用的高爆发星光魔矢。',
    effect: '对视线内一名敌军造成高额星光魔法伤害。',
  },
  chaos_meteor_burst: {
    summary: '倾泻一片星火的恋符连弹。',
    effect: '对目标格及周围 1 格内所有敌军造成火焰弹幕伤害，可被擦弹与火抗减免。',
  },

  // =========================================================================
  // 五、自然系 Nature（31 H4 + 1 固有 = 32 术）
  // =========================================================================
  nature_pathfinding: {
    summary: '令军团畅行险峰山林的行军术。',
    effect: '仅限战略大地图使用，消除军团经过崎岖地形时的移动惩罚。',
  },
  nature_speed: {
    summary: '借自妖怪之山的天狗团扇疾风。',
    effect: '使一名友军的移动力与先手主动性各提升 3 点，持续 5 回合。',
    flavor: '“报纸还没印好，天狗已经飞过整座山头了。”',
  },
  nature_stoneskin: {
    summary: '凝聚山岩地脉之气的护体术。',
    effect: '使一名友军的近战与远程防御提升 25%，持续 6 回合。',
  },
  nature_summon_sprite: {
    summary: '自雾之湖畔唤来的轻盈妖精群。',
    effect: '在指定空地召请一队雾湖妖精，具备飞行与不受反击特技。',
  },
  nature_summon_wolf: {
    summary: '巡守妖怪之山的迅猛白狼群。',
    effect: '在指定空地召请一队白狼妖犬，具备双重攻击特技。',
  },
  nature_summon_leprechaun: {
    summary: '寄宿古宅灵脉的招福座敷童子。',
    effect: '在指定空地召请一队座敷童子，具备高幸运与潜行特技。',
  },
  nature_terrain_walk: {
    summary: '令脚步轻捷如履平地的山林秘法。',
    effect: '使一名友军穿越竹林、泥沼等复杂地形时不再减速。',
  },
  nature_fortune: {
    summary: '来自迷途竹林幸运兔的鸿运加持。',
    effect: '使一名友军幸运提升 10 点，持续 5 回合，提高幸运暴击与幸运护身触发概率。',
    flavor: '“幸运兔的祝福很灵验，前提是别踩进她挖的陷阱。”',
  },
  nature_giant_strength: {
    summary: '灌注鬼王怪力的体魄强化术。',
    effect: '使一名友军的生命上限与攻击伤害各提升 25%。',
  },
  nature_quicksand: {
    summary: '隐伏于战场地面之下的流沙泥沼。',
    effect: '在目标区域铺设流沙陷阱，陆行单位踏入后立即耗尽本回合剩余移动力。',
  },
  nature_snake_strike: {
    summary: '如守矢白蛇出击般迅猛的先手加护。',
    effect: '赋予一名友军先攻特技直至战斗结束。',
  },
  nature_summon_elf: {
    summary: '隐居迷途竹林的精锐弓手。',
    effect: '在指定空地召请一队竹林灵弓，具备远程射击与双重攻击特技。',
  },
  nature_summon_satyr: {
    summary: '出身玄武之泽的豪迈河童众。',
    effect: '在指定空地召请一队高士气溪谷河童。',
  },
  nature_summon_white_tiger: {
    summary: '驰骋雪岭的迅捷灵兽白虎。',
    effect: '在指定空地召请一队雪山白虎，具备先攻特技。',
  },
  nature_wasp_swarm: {
    summary: '自夜色草丛涌出的暗夜妖虫群。',
    effect: '对一名活体敌军造成伤害，并使其丧失下一次行动回合。',
  },
  nature_anti_magic: {
    summary: '隔绝一切灵力波纹的无魔绝域。',
    effect: '赋予一名友军全魔法免疫直至战斗结束，免疫一切敌我法术。',
    flavor: '“无论诅咒还是祝福，统统挡在结界之外。”',
  },
  nature_mass_speed: {
    summary: '席卷山谷的鸦天狗暴风。',
    effect: '使全队非魔免友军的移动力与先手主动性各提升 3 点，持续 5 回合。',
  },
  nature_necromancy_ward: {
    summary: '生机盎然的净土封冥结界。',
    effect: '本场战斗内全面封印所有招魂与反魂起尸类法术。',
  },
  nature_summon_air_elemental: {
    summary: '由风曜灵力凝成的高速风精。',
    effect: '在指定空地召请一队七曜风精元素，具备飞行并免疫活体生理负面效果。',
  },
  nature_summon_earth_elemental: {
    summary: '由土曜巨岩塑形的重装守护者。',
    effect: '在指定空地召请一队七曜土精元素，具备高额防御与 50% 魔法抗性。',
  },
  nature_summon_fire_elemental: {
    summary: '由火曜业焰化成的炽烈灵体。',
    effect: '在指定空地召请一队七曜火精元素，具备飞行、烈焰护盾与火焰抗性。',
  },
  nature_summon_water_elemental: {
    summary: '由水曜灵泉凝聚的远程水精。',
    effect: '在指定空地召请一队七曜水精元素，可进行远程寒冰水弹射击。',
  },
  nature_mass_fortune: {
    summary: '遍洒全军的万福瑞气。',
    effect: '使全队非魔免友军幸运提升 10 点，持续 5 回合。',
  },
  nature_mass_snake_strike: {
    summary: '以守矢御蛇灵威加持全阵。',
    effect: '赋予全队非魔免友军先攻特技直至战斗结束。',
  },
  nature_summon_griffin: {
    summary: '翱翔群山之巅的鸦天狗精锐。',
    effect: '在指定空地召请一队鸦天狗众，具备飞行与无限反击特技。',
  },
  nature_summon_unicorn: {
    summary: '博闻通灵的圣林瑞兽白泽。',
    effect: '在指定空地召请一队圣林白泽，具备 40% 魔法抗性与命中定身特技。',
  },
  nature_summon_waspwort: {
    summary: '绽放于太阳花田的狂野魔花。',
    effect: '在指定空地召请一队幽香魔花，可无视普通障碍进行远程毒刺射击。',
    flavor: '“未经允许折断太阳花的人，通常没机会走回花田边缘。”',
  },
  nature_dragon_strength: {
    summary: '引动幻想乡古龙伟力的终极强化。',
    effect: '使一名友军的生命上限与攻击伤害同时翻倍。',
    flavor: '“幻想乡的天际偶尔掠过龙影，连群山都会为之屏息。”',
  },
  nature_summon_faerie_dragon: {
    summary: '沐浴丰沛魔力诞生的幻想飞龙。',
    effect: '在指定空地召请妖精飞龙，具备飞行、无限弹药远程与 50% 魔抗。',
  },
  nature_summon_mantis: {
    summary: '潜伏深山密林的四阶掠食巨兽。',
    effect: '在指定空地召请山神螳螂，具备飞行、先攻与命中定身特技。',
  },
  nature_summon_phoenix: {
    summary: '携蓬莱不灭烈焰降临的不死圣鸟。',
    effect: '在指定空地召请蓬莱不死鸟，具备飞行、先攻、贯穿吐息与火焰免疫。',
    flavor: '“烧尽之后再从余烬里站起，对蓬莱之火不过是家常便饭。”',
  },
  nature_haste: {
    summary: '拂过竹林山径的轻灵疾风。',
    effect: '使一名友军的移动力与先手主动性各提升 2 点，持续 2 回合。',
  },
};

/** 英雄专属符卡的三段式精炼文案 */
export const SPELL_CARD_COPY_CATALOG: Record<string, SpellCopyEntry> = {
  reimu_fantasy_nature: {
    summary: '展开朱金阴阳大结界的博丽秘仪。',
    effect: '持续 3 回合：我方全军擦弹 +25%、防御 +25%、幸运 +2 并回复少量生命，敌方攻击 -15%。',
    flavor: '“飘浮在现实之外，连重力与弹幕都追不上她的衣角。”',
  },
  marisa_master_spark: {
    summary: '以迷你八卦炉全力倾泻的极彩魔炮。',
    effect: '沿指定直线贯穿 14 格轰击路径全部敌军，并在 2 回合内使我方攻击 +20%、法强 +4、敌方防御 -15%。',
    flavor: '“所谓弹幕就是火力，一炮轰过去就完事了。”',
  },
  eirin_astronomical_entombing: {
    summary: '将战场笼罩于伪月星轨中的月都秘术。',
    effect: '持续 3 回合：我方全军法强 +3、防御 +18%、魔抗 +12%，敌军主动性 -2、移速 -1，并回复全队生命与施法单位 4 点灵力。',
    flavor: '“在密闭的假月之下，连星辰运转的轨迹都在我的掌心之中。”',
  },
  remilia_gungnir: {
    summary: '红魔馆之主投掷命运鲜红魔枪的必杀符卡。',
    effect: '沿指定直线贯穿 14 格敌军并按总伤害 30% 汲取自身生命、单次最高回复 75 点，同时展开 3 回合红雾领域，使我方攻击 +15%、擦弹 +12%、幸运 +2 且敌方防御 -15%。',
    flavor: '“这么美丽的红月之夜，不稍微染红一下大地怎么行呢？”',
  },
};

/** 获取任意法术的标准三段式文案（优先取总表，兜底兼容内联字段） */
export function getSpellCopy(spell: SpellDef): SpellCopyEntry {
  const entry = SPELL_COPY_CATALOG[spell.id];
  if (entry) return entry;
  return {
    summary: spell.summary ?? spell.name,
    effect: spell.effect ?? spell.description,
    flavor: spell.flavor,
  };
}

/** 获取专属符卡的标准三段式文案 */
export function getSpellCardCopy(card: SpellCardDef): SpellCopyEntry {
  const entry = SPELL_CARD_COPY_CATALOG[card.id];
  if (entry) return entry;
  return {
    summary: card.summary ?? card.subtitle,
    effect: card.effect ?? card.description,
    flavor: card.flavor,
  };
}

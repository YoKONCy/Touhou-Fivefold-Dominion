/**
 * 秩序派系法术三段式文案表（28 术）
 */

import type { SpellCopyEntry } from './types';

export const ORDER_SPELL_COPY: Record<string, SpellCopyEntry> = {
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
    effect: '施法者实力显著高于目标单兵时，按目标当前血量与法强预算生成可控幻象，若己方已有同种存活幻象则直接叠加至该单位，预算不足整兵时生成残血单位，不可复制幻象或过强高阶目标。',
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
    effect: '施法者实力足够压制目标单兵时，高比例映照并按法强预算生成强力幻象分身，若己方已有同种存活幻象则直接叠加至该单位，预算不足整兵时生成残血单位且不可复制幻象。',
  },
  order_hypnotize: {
    summary: '牵引心神的迷梦傀儡戏。',
    effect: '仅限 2 格近距施放，使一名活体敌军在 3 回合内倒戈，归入施法者阵营听候调遣。',
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
};

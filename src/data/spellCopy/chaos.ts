/**
 * 混沌派系法术三段式文案表（29 术）
 */

import type { SpellCopyEntry } from './types';

export const CHAOS_SPELL_COPY: Record<string, SpellCopyEntry> = {
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
  chaos_war_blood_sacrifice: {
    summary: '汲取战阵鲜血化作护体血盾并激发疾步战意的狂烈祭仪。',
    effect: '仅对自身施放，将上一回合敌方全体所受物理伤害的 35% 转化为自身额外护盾，持续 3 回合，同时额外提升自身 5 点行动力，持续 2 回合；红祭司等兵种护盾上限为当前存活数量乘 50，英雄上限为最大生命值 200%，重施刷新护盾与行动力并重置持续回合。',
    flavor: '“前排劈出的每一道伤痕，都会化作旧都祭司身前最炽热的护壁。”',
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
};

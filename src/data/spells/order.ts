/**
 * 秩序派系法术数据表（27 术：25 战斗 + 2 大地图）
 * 主题：隙间时空 · 月都幻瞳 · 红魔时律
 */

import type { SpellDef } from '@core/types';

export const ORDER_H4_SPELLS: Record<string, SpellDef> = {
  order_blur: {
    id: 'order_blur', name: '蜃气残影', spellCardPrefix: '幻符', enName: 'Blur',
    alignment: 'order', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    vfxKey: 'order_slow', specialEffect: 'blur',
    description: '秩序 1 级：令友军轮廓如蜃气般虚实难辨，远程减伤 -35% 且擦弹闪避率大幅跃升。',
  },
  order_dispel: {
    id: 'order_dispel', name: '星律解咒', spellCardPrefix: '解符', enName: 'Dispel',
    alignment: 'order', level: 1, manaCost: 2, targetType: 'any_unit', range: 17,
    vfxKey: 'order_slow', specialEffect: 'dispel',
    description: '秩序 1 级：拨动星律清除任意单个敌我目标身上的全部正负面法术效果（不解除剧毒/瘴疫）。',
  },
  order_displacement: {
    id: 'order_displacement', name: '隙间斥退', spellCardPrefix: '境符', enName: 'Displacement',
    alignment: 'order', level: 1, manaCost: 2, targetType: 'enemy_unit', range: 15,
    vfxKey: 'order_slow', specialEffect: 'displacement',
    description: '秩序 1 级：扭曲空间边界将敌方目标沿远离施法者的方向强行震退 2 格！',
  },
  order_magic_fist: {
    id: 'order_magic_fist', name: '念力重拳', spellCardPrefix: '念符', enName: 'Magic Fist',
    alignment: 'order', level: 1, manaCost: 2, targetType: 'enemy_unit', range: 15,
    damageBase: 20, vfxKey: 'order_slow', specialEffect: 'standard',
    description: '秩序 1 级：隔空凝结无形念动力铁拳，轰击视线内一名敌军造成高额魔法冲击伤害。',
  },
  order_precision: {
    id: 'order_precision', name: '天眼狙定', spellCardPrefix: '瞳符', enName: 'Precision',
    alignment: 'order', level: 1, manaCost: 2, targetType: 'ally_unit', range: 15,
    vfxKey: 'order_slow', specialEffect: 'precision',
    description: '秩序 1 级：开启天眼锁定敌踪，友军远程攻击 +25% 且获得「精准射击」与「穿障」特技！',
  },
  order_visions: {
    id: 'order_visions', name: '千里月瞳', spellCardPrefix: '察符', enName: 'Visions',
    alignment: 'order', level: 1, manaCost: 2, targetType: 'adventure', range: 0,
    isAdventureOnly: true, vfxKey: 'order_slow', specialEffect: 'adventure_only',
    description: '秩序 1 级（大地图术式）：以月都慧眼洞察大地图敌军精确兵力与英雄技能，战斗中不可施放。',
  },
  order_cowardice: {
    id: 'order_cowardice', name: '畏惧之瞳', spellCardPrefix: '怯符', enName: 'Cowardice',
    alignment: 'order', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    vfxKey: 'order_slow', specialEffect: 'cowardice',
    description: '秩序 2 级：令非心智免疫敌军心生胆怯 3 回合，不敢主动攻击总生命值高于自身的强敌。',
  },
  order_create_illusion: {
    id: 'order_create_illusion', name: '蜃楼幻影', spellCardPrefix: '镜符', enName: 'Create Illusion',
    alignment: 'order', level: 2, manaCost: 3, targetType: 'any_unit', range: 16,
    vfxKey: 'soul_rise', specialEffect: 'create_illusion',
    description: '秩序 2 级：当施法者实力显著高于目标单兵时，按目标当前血量与法强预算在旁侧幻化可控幻象（允许生成残兵，不可复制过强高阶目标或幻象）！',
  },
  order_flight: {
    id: 'order_flight', name: '御空浮游', spellCardPrefix: '空符', enName: 'Flight',
    alignment: 'order', level: 2, manaCost: 3, targetType: 'ally_unit', range: 16,
    vfxKey: 'order_slow', specialEffect: 'flight',
    description: '秩序 2 级：赐予一名友军幻想乡御空浮游之力（永久获得「飞行」特技直至战斗结束）！',
  },
  order_ice_bolt: {
    id: 'order_ice_bolt', name: '极寒冰瀑', spellCardPrefix: '冰符', enName: 'Ice Bolt',
    alignment: 'order', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    damageBase: 30, isColdSpell: true, vfxKey: 'order_slow', specialEffect: 'standard',
    description: '秩序 2 级：凝聚凌冽霜华射出极寒冰枪，贯穿视线内一名敌军造成高额寒冰伤害。',
  },
  order_power_drain: {
    id: 'order_power_drain', name: '灵脉枯竭', spellCardPrefix: '涸符', enName: 'Power Drain',
    alignment: 'order', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    vfxKey: 'order_slow', specialEffect: 'power_drain',
    description: '秩序 2 级：截断敌方施法者的灵力回流，使其此后施放任意法术的灵力消耗翻倍！',
  },
  order_slow: {
    id: 'order_slow', name: '时计缓流', spellCardPrefix: '时符', enName: 'Slow',
    alignment: 'order', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    debuffDuration: 4,
    debuffModifiers: [
      { stat: 'speed', mode: 'percent', value: -0.5, sourceName: '时符·时计缓流', spellPolarity: 'negative' },
      { stat: 'initiative', mode: 'percent', value: -0.5, sourceName: '时符·时计缓流', spellPolarity: 'negative' },
    ],
    vfxKey: 'order_slow', specialEffect: 'standard',
    description: '秩序 2 级：拨慢目标周身的时间流速，令一名敌军移动速度与行动主动性减半！',
  },
  order_steal_enchantment: {
    id: 'order_steal_enchantment', name: '窃法魔手', spellCardPrefix: '盗符', enName: 'Steal Enchantment',
    alignment: 'order', level: 2, manaCost: 3, targetType: 'enemy_unit', range: 16,
    vfxKey: 'order_slow', specialEffect: 'steal_enchantment',
    description: '秩序 2 级：「借走」一名敌军身上的有益法术增益，顺手转移施加给己方随机友军！',
  },
  order_banish: {
    id: 'order_banish', name: '放逐虚境', spellCardPrefix: '逐符', enName: 'Banish',
    alignment: 'order', level: 3, manaCost: 5, targetType: 'enemy_unit', range: 21,
    damageBase: 75, vfxKey: 'order_slow', specialEffect: 'banish',
    description: '秩序 3 级：专克式神召唤与幻象分身！撕开境界裂隙对召唤物与幻象造成毁灭性放逐伤害。',
  },
  order_forgetfulness: {
    id: 'order_forgetfulness', name: '忘却弹幕', spellCardPrefix: '忘符', enName: 'Forgetfulness',
    alignment: 'order', level: 3, manaCost: 5, targetType: 'enemy_unit', range: 17,
    vfxKey: 'order_slow', specialEffect: 'forgetfulness',
    description: '秩序 3 级：抹除一名敌方非心智免疫射手的弹幕技艺，使其本战陷入「远程禁手」！',
  },
  order_mass_blur: {
    id: 'order_mass_blur', name: '万象蜃楼', spellCardPrefix: '大幻', enName: 'Mass Blur',
    alignment: 'order', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'order_slow', specialEffect: 'mass_blur',
    description: '秩序 3 级（全军）：以蜃楼迷雾笼罩全阵，全队非魔免友军同时获得远程减伤与高额擦弹！',
  },
  order_mass_dispel: {
    id: 'order_mass_dispel', name: '万法归零', spellCardPrefix: '归零', enName: 'Mass Dispel',
    alignment: 'order', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'order_slow', specialEffect: 'mass_dispel',
    description: '秩序 3 级（全场）：重启战场灵律，一次性清除敌我全体单位的一切正负法术状态（不含毒疫）。',
  },
  order_mass_precision: {
    id: 'order_mass_precision', name: '百步星瞳', spellCardPrefix: '星瞳', enName: 'Mass Precision',
    alignment: 'order', level: 3, manaCost: 5, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'order_slow', specialEffect: 'mass_precision',
    description: '秩序 3 级（全军）：赋予全体远程友军星瞳狙定，远程攻击 +25% 且享精准无衰减与穿障！',
  },
  order_teleport: {
    id: 'order_teleport', name: '隙间瞬移', spellCardPrefix: '境符', enName: 'Teleport',
    alignment: 'order', level: 3, manaCost: 5, targetType: 'unit_to_hex', range: 21, ignoreLos: true,
    vfxKey: 'order_slow', specialEffect: 'teleport',
    description: '秩序 3 级（两步点选）：撕开空间隙间——先点选一名己方友军，再点击任意空地瞬间传送到位！',
  },
  order_town_gate: {
    id: 'order_town_gate', name: '隙间归城', spellCardPrefix: '归境', enName: 'Town Gate',
    alignment: 'order', level: 3, manaCost: 5, targetType: 'adventure', range: 0,
    isAdventureOnly: true, vfxKey: 'order_slow', specialEffect: 'adventure_only',
    description: '秩序 3 级（大地图术式）：开启归乡隙间将大地图军团传回己方最近据点，战斗中不可施放。',
  },
  order_berserk: {
    id: 'order_berserk', name: '月狂赤瞳', spellCardPrefix: '狂符', enName: 'Berserk',
    alignment: 'order', level: 4, manaCost: 8, targetType: 'enemy_unit', range: 18,
    vfxKey: 'death_curse', specialEffect: 'berserk',
    description: '秩序 4 级心智控场：以狂气赤瞳令非心智免疫敌军理智崩坏，轮到行动时不分敌我猛攻最近单位！',
  },
  order_blind: {
    id: 'order_blind', name: '宵暗蔽目', spellCardPrefix: '闇符', enName: 'Blind',
    alignment: 'order', level: 4, manaCost: 8, targetType: 'enemy_unit', range: 18,
    vfxKey: 'order_slow', specialEffect: 'blind',
    description: '秩序 4 级控场：以深沉宵暗吞没敌军视野（对机械/不死/幻象无效），使其 3 回合无法行动（一旦受伤害立即惊醒）！',
  },
  order_mass_slow: {
    id: 'order_mass_slow', name: '永夜停摆', spellCardPrefix: '永夜', enName: 'Mass Slow',
    alignment: 'order', level: 4, manaCost: 8, targetType: 'self', range: 0, ignoreLos: true,
    massScope: 'all_enemies', debuffDuration: 4,
    debuffModifiers: [
      { stat: 'speed', mode: 'percent', value: -0.5, sourceName: '永夜·永夜停摆', spellPolarity: 'negative' },
      { stat: 'initiative', mode: 'percent', value: -0.5, sourceName: '永夜·永夜停摆', spellPolarity: 'negative' },
    ],
    vfxKey: 'order_slow', specialEffect: 'standard',
    description: '秩序 4 级（全敌）：凝滞整片战场的黑夜时光，令全体非魔免敌军移动速度与主动性减半！',
  },
  order_phantom_image: {
    id: 'order_phantom_image', name: '月镜分身', spellCardPrefix: '月镜', enName: 'Phantom Image',
    alignment: 'order', level: 4, manaCost: 8, targetType: 'any_unit', range: 18,
    vfxKey: 'soul_rise', specialEffect: 'phantom_image',
    description: '秩序 4 级：当施法者实力足够压制目标单兵时，高比例映照并按法强预算生成强力幻象分身（不足整兵时生成残血幻象）！',
  },
  order_hypnotize: {
    id: 'order_hypnotize', name: '迷梦傀儡', spellCardPrefix: '梦符', enName: 'Hypnotize',
    alignment: 'order', level: 5, manaCost: 12, targetType: 'enemy_unit', range: 2, fixedRange: true,
    vfxKey: 'order_slow', specialEffect: 'hypnotize',
    description: '秩序 5 级终极心智：仅限 2 格近距施放，将一名非心智免疫敌军拖入迷梦傀儡戏，令其 3 回合内倒戈归入己方阵营作战！',
  },
  order_pain_mirror: {
    id: 'order_pain_mirror', name: '因果水镜', spellCardPrefix: '痛镜', enName: 'Pain Mirror',
    alignment: 'order', level: 5, manaCost: 12, targetType: 'ally_unit', range: 18,
    vfxKey: 'order_slow', specialEffect: 'pain_mirror',
    description: '秩序 5 级终极护佑：为友军立起因果水镜，承受的一切近战与远程伤害 50% 反弹给攻击者！',
  },
  order_steal_all_enchantments: {
    id: 'order_steal_all_enchantments', name: '大盗窃法', spellCardPrefix: '秘盗', enName: 'Steal All Enchantments',
    alignment: 'order', level: 5, manaCost: 12, targetType: 'self', range: 0, ignoreLos: true,
    vfxKey: 'order_slow', specialEffect: 'steal_all_enchantments',
    description: '秩序 5 级（全场）：将敌军全体身上的有益附魔一扫而空，尽数转移分配给己方部队！',
  },
};

/**
 * 死亡派系法术三段式文案表（26 术）
 */

import type { SpellCopyEntry } from './types';

export const DEATH_SPELL_COPY: Record<string, SpellCopyEntry> = {
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
    summary: '唤醒活体亡骸的低阶招魂术。',
    effect: '消耗活体阵亡或减员残骸的剩余生命池，按法强预算唤起不死「尸壳」，若己方已有招魂尸壳则直接叠加至该单位，预算不足整兵时生成残血单位；机械、亡灵、元素与幻象尸体不可招魂。',
  },
  death_animate_dead: {
    summary: '逆转生死的反魂起尸秘术。',
    effect: '按法强预算复生战损或阵亡友军并转为不死，对机械、元素与幻象无效；作用于敌方活体残骸时按剩余生命转化为不死「尸壳」并叠加至已有招魂尸壳，不可从机械、亡灵、元素或幻象尸体中招魂。',
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
    summary: '自活体亡骸唤出游魂的中阶招魂术。',
    effect: '消耗活体战场残骸的剩余生命池，按法强预算唤起具备飞行、虚无体质与衰老触碰的不死「怨灵」，若己方已有招魂怨灵则直接叠加至该单位，预算不足整兵时生成残血单位；机械、亡灵、元素与幻象尸体不可招魂。',
  },
  death_death_call: {
    summary: '回应黄泉深处低语的召灵术。',
    effect: '按高额法强预算强力复生战损或阵亡友军，对机械、元素与幻象无效；作用于敌方活体残骸时按剩余生命转化为不死「怨灵」并叠加至已有招魂怨灵，不可从机械、亡灵、元素或幻象尸体中招魂。',
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
    effect: '消耗活体战场残骸的剩余生命池，按法强预算唤醒具备飞行、不受反击与吸血复苏的不死「血族眷属」，若己方已有招魂血族则直接叠加至该单位，预算不足整兵时生成残血单位；机械、亡灵、元素与幻象尸体不可招魂。',
  },
  death_sacrifice: {
    summary: '以命换命的彼岸献祭禁术。',
    effect: '先选献祭友军、再选复生友军，牺牲前者全部生机以强力复活后者。',
    flavor: '“彼岸的天平一向公平，只是代价总由生者称量。”',
  },
  death_summon_ice_demon: {
    summary: '深渊隙间恶魔召请极寒魔仆的专属术式。',
    effect: '消耗 8 MP 撕开冰霜深渊隙间召唤暗系「深渊冰魔」战队，若己方已有召唤冰魔则直接叠加至该单位，具备寒冰抗性与寒霜冻结特技。',
    flavor: '“从深渊裂隙里钻出来的可不止红雾，还有冻彻骨髓的寒霜哦。”',
  },
};

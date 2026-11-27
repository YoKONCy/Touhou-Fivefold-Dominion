/**
 * 混沌系 Chaos 全部 29 个法术（27 H4 + 2 魔理沙固有术式）专属 24×24 手雕像素图标
 * 母题：魔法之森星炮、七曜魔导火焰、绯想天雷、黑洞核焰、妖猫利爪、厄神灾轮
 */

import type { SpellIconDrawFn } from './spellIconCore';

export const CHAOS_SPELL_ICON_DRAWERS: Record<string, SpellIconDrawFn> = {
  // 1. 鬼符「鬼神狂战」Bloodlust：缠绕猩红战气的鬼族双角战斧
  chaos_bloodlust: (p) => {
    p.glow(11.5, 11, 9, '#ff4733', 0.58);
    p.line(5, 19, 17, 6, '#b87638', 2);
    // 双刃血斧头
    p.poly(
      [
        [10, 6],
        [16, 4],
        [19, 10],
        [13, 12],
      ],
      '#ff5252',
    );
    p.poly(
      [
        [11, 7],
        [15, 6],
        [17, 9],
        [13, 10],
      ],
      '#ffe082',
    );
    p.sparkle(6, 7, '#ff6e40', 1);
  },

  // 2. 炎符「不死炎缠」Fire Aura：烈焰熊熊燃烧的斜举太刀
  chaos_fire_aura: (p) => {
    p.glow(12, 11, 9, '#ff6d2e', 0.6);
    // 外层烈焰光舌
    p.line(5, 18, 18, 5, '#ff5722', 2);
    p.line(4, 16, 16, 4, '#ffab40', 1);
    p.line(7, 19, 19, 7, '#ffd740', 1);
    // 炽白太刀身
    p.line(6, 17, 17, 6, '#ffffff', 1);
    p.rect(4, 16, 4, 4, '#cfa75b');
  },

  // 3. 星风「星风疾行」Haste：飞驰彗星与三道金黄疾风尾迹
  chaos_haste: (p) => {
    p.glow(14, 11, 9, '#ffd447', 0.55);
    // 疾风横拖尾
    p.hline(3, 8, 9, '#ff9800');
    p.hline(4, 11.5, 10, '#ffe066');
    p.hline(3, 15, 9, '#ff9800');
    // 前冲飞星箭头
    p.poly(
      [
        [20, 11.5],
        [13, 6],
        [15, 11.5],
        [13, 17],
      ],
      '#fff5b8',
    );
    p.px(17, 11.5, '#ffffff');
  },

  // 4. 星符「魔导星矢」Magic Arrow：拖曳五彩尾光的金星魔力长箭
  chaos_magic_arrow: (p) => {
    p.glow(12, 11.5, 9, '#ffbe3b', 0.55);
    p.line(4, 19, 17, 6, '#ff8f33', 2);
    p.line(5, 18, 17, 6, '#fff29c', 1);
    // 箭矢星簇羽尾与尖锋
    p.poly(
      [
        [19, 4],
        [13, 5],
        [18, 10],
      ],
      '#ffffff',
    );
    p.sparkle(5, 18, '#ff7043', 1);
  },

  // 5. 斩符「屠龙魔刃」Slayer：劈裂猩红龙鳞的巨型斩龙大剑
  chaos_slayer: (p) => {
    p.glow(11.5, 11.5, 9, '#ff5c33', 0.55);
    // 背后红龙菱鳞
    p.diamond(11.5, 12, 6.8, 6.2, '#8c1d2b');
    // 垂直劈下的斩龙金剑
    p.rect(10.5, 3, 3, 13, '#ffffff');
    p.vline(11.5, 4, 11, '#ffe066');
    p.hline(7, 15, 10, '#f0ae3c');
    p.rect(11, 16, 2, 4, '#b85a2b');
  },

  // 6. 恋符「星尘迸裂」Sparks：从中心向八方炸开的五角星尘火花
  chaos_sparks: (p) => {
    p.glow(11.5, 11.5, 10, '#ffcf40', 0.65);
    p.sparkle(11.5, 11.5, '#ffe066', 2);
    p.sparkle(6, 6, '#ff7a45', 1);
    p.sparkle(17, 6, '#70e0ff', 1);
    p.sparkle(6, 17, '#ff70a8', 1);
    p.sparkle(17, 17, '#9cf58c', 1);
    p.px(11.5, 4, '#ffffff');
    p.px(11.5, 19, '#ffffff');
    p.px(4, 11.5, '#ffffff');
    p.px(19, 11.5, '#ffffff');
  },

  // 7. 迷符「迷乱魔雾」Confusion：品红与紫罗兰交缠的眩晕迷幻螺旋
  chaos_confusion: (p) => {
    p.glow(11.5, 11.5, 9, '#e65cff', 0.55);
    p.ring(11.5, 11.5, 7.2, '#d95cff', 1.2);
    p.ring(11.5, 11.5, 4.4, '#ff85c0', 1.2);
    p.circle(11.5, 11.5, 1.8, '#ffe066');
    p.sparkle(5, 5, '#ffb8e8', 1);
    p.sparkle(18, 18, '#ffb8e8', 1);
  },

  // 8. 火符「七曜火矢」Fire Bolt：咆哮烈焰包裹的赤金火弹火箭
  chaos_fire_bolt: (p) => {
    p.glow(12, 11.5, 10, '#ff5722', 0.65);
    p.poly(
      [
        [4, 19],
        [9, 11],
        [18, 5],
        [13, 14],
      ],
      '#ff3d1f',
    );
    p.poly(
      [
        [7, 16],
        [11, 11],
        [17, 6],
        [13, 13],
      ],
      '#ffae33',
    );
    p.circle(15.5, 7.5, 2.6, '#fff5b8');
    p.px(16, 7, '#ffffff');
  },

  // 9. 闪符「瞬闪先手」First Strike：迅疾斜劈的一闪金雷折线
  chaos_first_strike: (p) => {
    p.glow(11.5, 11.5, 9, '#ffe047', 0.62);
    p.line(15, 3, 8, 11, '#ffe066', 2);
    p.line(8, 11, 14, 11, '#ffffff', 2);
    p.line(14, 11, 7, 20, '#ff9800', 2);
    p.sparkle(15, 4, '#ffffff', 1);
  },

  // 10. 脉符「灵脉沸腾」Mana Flare（全域）：喷涌而起的蓝金双色地脉光喷泉
  chaos_mana_flare: (p) => {
    p.massAura('#5ea8ff', '#ffe066');
    p.rect(9, 7, 6, 13, '#4794ff');
    p.rect(10.5, 5, 3, 15, '#c2f0ff');
    p.line(10, 9, 5, 5, '#ffe066', 1);
    p.line(13, 9, 18, 5, '#ffe066', 1);
    p.sparkle(11.5, 4, '#ffffff', 2);
    p.hline(5, 19, 14, '#ff8f33');
  },

  // 11. 厄符「厄运流转」Misfortune：倒扣裂开的乌黑厄运马蹄铁 + 飘散红厄火花
  chaos_misfortune: (p) => {
    p.glow(11.5, 11.5, 9, '#d93866', 0.52);
    // 倒U形黑紫马蹄铁
    p.ring(11.5, 12, 6.2, '#8c4da8', 2);
    p.rect(6, 14, 12, 6, '#21100b', true);
    p.rect(6, 12, 3, 6, '#8c4da8');
    p.rect(15, 12, 3, 6, '#8c4da8');
    // 断裂赤电
    p.line(10, 5, 13, 9, '#ff3355', 1);
    p.sparkle(11.5, 15, '#ff5c78', 1);
  },

  // 12. 缚符「咒缚反噬」Spell Shackle：扣紧炽红魔力球的玄铁锯齿锁链
  chaos_spell_shackle: (p) => {
    p.glow(11.5, 11.5, 9, '#ff5733', 0.55);
    p.circle(11.5, 11.5, 4.5, '#52a8ff');
    p.circle(11.5, 11.5, 2.5, '#ffffff');
    // 交叉玄铁枷锁
    p.line(4, 6, 19, 17, '#c7cbd9', 2);
    p.line(19, 6, 4, 17, '#9da4b8', 2);
    p.px(11.5, 11.5, '#ff3d55');
  },

  // 13. 鬼宴「百鬼狂潮」Bloodfrenzy（全军）：炽燃双鬼斧交叉 + 怒焰血环
  chaos_bloodfrenzy: (p) => {
    p.massAura('#ff4733', '#ffe066');
    p.line(5, 18, 18, 5, '#d98c4a', 2);
    p.line(18, 18, 5, 5, '#d98c4a', 2);
    p.circle(7, 7, 3.2, '#ff4d4d');
    p.circle(16, 7, 3.2, '#ff4d4d');
    p.circle(11.5, 11.5, 2.8, '#ffe066');
  },

  // 14. 业火「业火红环」Fire Ring：特征极鲜明的空心炽红业火甜甜圈环！
  chaos_fire_ring: (p) => {
    p.glow(11.5, 11.5, 10, '#ff4d1f', 0.65);
    p.ring(11.5, 11.5, 7.6, '#ff3d1a', 2.4);
    p.ring(11.5, 11.5, 6.8, '#ffb833', 1.2);
    // 中心安全空洞点缀一粒冷青原点示意“不伤中心”
    p.circle(11.5, 11.5, 2.2, '#1f100b');
    p.px(11.5, 11.5, '#70e0ff');
  },

  // 15. 爆符「炽炎星爆」Fireball：爆燃的实心金白炽火巨球 + 飞溅火星
  chaos_fireball: (p) => {
    p.glow(11.5, 11.5, 10, '#ff5c1f', 0.7);
    p.circle(11.5, 11.5, 7, '#e63317');
    p.circle(11.5, 11.5, 5.2, '#ff8f26');
    p.circle(11.5, 11.5, 3.2, '#ffe878');
    p.circle(11.5, 11.5, 1.6, '#ffffff');
    p.px(4, 5, '#ffae33');
    p.px(19, 6, '#ffae33');
    p.px(5, 19, '#ff5722');
    p.px(18, 18, '#ffae33');
  },

  // 16. 雷符「绯想落雷」Lightning：自绯云直劈而下的粗壮苍白紫雷柱
  chaos_lightning: (p) => {
    p.glow(11.5, 11.5, 10, '#85d4ff', 0.65);
    p.ellipse(11.5, 4.5, 7, 2.4, '#6b5699');
    p.line(12, 5, 8, 11, '#70d4ff', 2);
    p.line(8, 11, 14, 12, '#ffffff', 2);
    p.line(14, 12, 10, 20, '#9ce8ff', 2);
    p.sparkle(10, 19, '#ffe066', 1);
  },

  // 17. 镜符「贤者折光」Magic Mirror：六边形炫彩棱镜 + 入射与反射七彩折光线
  chaos_magic_mirror: (p) => {
    p.glow(11.5, 11.5, 9, '#9ce8ff', 0.58);
    p.poly(
      [
        [11.5, 4],
        [18, 8],
        [18, 15],
        [11.5, 19],
        [5, 15],
        [5, 8],
      ],
      '#94d9ff',
    );
    p.poly(
      [
        [11.5, 6],
        [16, 9],
        [16, 14],
        [11.5, 17],
        [7, 14],
        [7, 9],
      ],
      '#284980',
    );
    // 折射光束
    p.line(3, 9, 11.5, 11.5, '#ff70a8', 1);
    p.line(11.5, 11.5, 20, 8, '#ffe066', 1);
    p.line(11.5, 11.5, 20, 15, '#7ef5b5', 1);
  },

  // 18. 屠龙「众刃屠龙」Mass Slayer（全军）：交错双金巨刃 + 炽燃龙目徽记
  chaos_mass_slayer: (p) => {
    p.massAura('#ff7033', '#ffe066');
    p.line(5, 5, 18, 18, '#ffffff', 2);
    p.line(18, 5, 5, 18, '#ffe066', 2);
    p.diamond(11.5, 11.5, 3.5, 4.5, '#ff334d');
    p.vline(11.5, 9, 5, '#ffe894');
  },

  // 19. 猫符「火猫连击」Cat Reflexes（4级）：炽燃金橘三道狂野妖猫利爪双连抓痕！
  chaos_cat_reflexes: (p) => {
    p.glow(11.5, 11.5, 10, '#ff8f33', 0.62);
    // 三道锐利燃烧猫爪痕
    p.line(4, 7, 17, 4, '#ff5722', 2);
    p.line(4, 12, 19, 9, '#ffae33', 2);
    p.line(5, 17, 18, 14, '#ffe066', 2);
    // 二段连击交叉白闪光
    p.line(7, 19, 18, 6, '#ffffff', 1);
    p.sparkle(18, 8, '#ffffff', 1);
  },

  // 20. 迷云「浓雾迷心」Cloud of Confusion（4级）：翻滚品紫毒雾云团 + 眩晕问号星
  chaos_cloud_of_confusion: (p) => {
    p.glow(11.5, 11.5, 10, '#c75cff', 0.6);
    p.circle(7.5, 13, 4.8, '#7a2fa8');
    p.circle(15.5, 13, 4.8, '#7a2fa8');
    p.circle(11.5, 9.5, 5.2, '#b04de6');
    p.circle(11.5, 12, 4, '#d98cff');
    // 眩晕金星
    p.sparkle(8, 8, '#ffe066', 1);
    p.sparkle(15, 9, '#ffe066', 1);
    p.sparkle(11.5, 14, '#ffffff', 1);
  },

  // 21. 星崩「黑洞坍缩」Implosion（4级）：吞噬周围星光的深邃引力黑洞 + 吸积紫金盘
  chaos_implosion: (p) => {
    p.glow(11.5, 11.5, 10, '#8c3dff', 0.72);
    // 吸积光盘
    p.ellipse(11.5, 11.5, 9.2, 3.2, '#ff944d');
    p.ellipse(11.5, 11.5, 7.6, 2, '#ffe082');
    // 漆黑奇点核与白边视界
    p.circle(11.5, 11.5, 5, '#b86bff');
    p.circle(11.5, 11.5, 4, '#08040f');
    // 向心坍缩四向引力箭头
    p.px(4, 4, '#ffffff');
    p.px(19, 4, '#ffffff');
    p.px(4, 19, '#ffffff');
    p.px(19, 19, '#ffffff');
  },

  // 22. 地狱「焦热地狱」Inferno（4级）：冲天而起的地底核焰火柱与熔岩喷发
  chaos_inferno: (p) => {
    p.glow(11.5, 12, 10, '#ff3d1a', 0.72);
    // 底部熔岩裂地
    p.ellipse(11.5, 18.5, 8.5, 2.5, '#b82414');
    // 三簇腾空烈焰核柱
    p.poly(
      [
        [5, 18],
        [8, 6],
        [11.5, 12],
        [14.5, 4],
        [18, 18],
      ],
      '#ff4d1a',
    );
    p.poly(
      [
        [7, 18],
        [11.5, 7],
        [16, 18],
      ],
      '#ffbe33',
    );
    p.poly(
      [
        [9.5, 18],
        [11.5, 11],
        [13.5, 18],
      ],
      '#ffffff',
    );
  },

  // 23. 极闪「星闪先制」Mass First Strike（4级全军）：双道同步疾劈星雷 + 先攻极光环
  chaos_mass_first_strike: (p) => {
    p.massAura('#ffe047', '#ffffff');
    p.line(10, 4, 6, 11, '#ffe066', 2);
    p.line(6, 11, 10, 18, '#ff9800', 2);
    p.line(17, 4, 13, 11, '#ffffff', 2);
    p.line(13, 11, 17, 18, '#ffe066', 2);
  },

  // 24. 灾厄「厄神灾厄」Mass Misfortune（4级全敌）：旋转红黑厄神风车灾轮
  chaos_mass_misfortune: (p) => {
    p.massAura('#e62e5c', '#a852cc');
    p.circle(11.5, 11.5, 3, '#1a0814');
    p.ring(11.5, 11.5, 3.2, '#ff3d68', 1.2);
    // 四片旋转灾厄镰叶
    p.poly(
      [
        [11.5, 8],
        [14, 3],
        [17, 6],
      ],
      '#d93866',
    );
    p.poly(
      [
        [15, 11.5],
        [20, 14],
        [17, 17],
      ],
      '#a842c7',
    );
    p.poly(
      [
        [11.5, 15],
        [9, 20],
        [6, 17],
      ],
      '#d93866',
    );
    p.poly(
      [
        [8, 11.5],
        [3, 9],
        [6, 6],
      ],
      '#a842c7',
    );
  },

  // 25. 终末「星陨终末」Armageddon（5级禁咒）：燃烧尾焰天降的巨型末日陨星群！
  chaos_armageddon: (p) => {
    p.massAura('#ff3d1a', '#ffe885');
    p.glow(10, 13, 11, '#ff4d1a', 0.78);
    // 陨石斜落火尾
    p.line(19, 4, 9, 14, '#ff471a', 2);
    p.line(17, 3, 7, 13, '#ffae33', 2);
    p.line(20, 6, 11, 15, '#ffe066', 1);
    // 炽热主陨石核
    p.circle(9, 15, 4.8, '#661a14');
    p.ring(9, 15, 4.8, '#ff7033', 1.2);
    p.px(8, 14, '#ffe885');
    p.px(10, 16, '#ff5722');
    // 伴生小陨星
    p.circle(17, 16, 2, '#ff9800');
    p.line(20, 13, 17, 16, '#ffe066', 1);
  },

  // 26. 天雷「五雷连锁」Chain Lightning（5级）：连接三枚电核的耀眼锯齿连锁雷弧
  chaos_chain_lightning: (p) => {
    p.glow(11.5, 11.5, 10, '#66d9ff', 0.72);
    // 三节点弹射电弧
    p.line(5, 6, 15, 9, '#70d4ff', 2);
    p.line(15, 9, 7, 17, '#ffffff', 2);
    p.line(7, 17, 18, 17, '#70d4ff', 2);
    p.circle(5, 6, 2.2, '#ffe066');
    p.circle(15, 9, 2.4, '#ffffff');
    p.circle(7, 17, 2.2, '#ffe066');
    p.circle(18, 17, 2, '#9ce8ff');
  },

  // 27. 湮灭「星穹湮灭」Disintegrate（5级）：白炽品紫毁灭射线将目标碎成飞灰像素
  chaos_disintegrate: (p) => {
    p.glow(12, 11.5, 10, '#e64dff', 0.72);
    // 左侧高压紫光炮束
    p.line(3, 11.5, 13, 11.5, '#c94dff', 2);
    p.hline(3, 11.5, 11, '#ffffff');
    // 右侧正在崩解化灰的菱形碎粒
    p.rect(13, 8, 3, 7, '#ff70c4');
    p.px(17, 7, '#ffe082');
    p.px(19, 9, '#e68aff');
    p.px(18, 12, '#ffffff');
    p.px(20, 14, '#ff70c4');
    p.px(17, 16, '#cfa6ff');
  },

  // 28. 固有术式·星符「星屑魔矢」chaos_star_bolt：魔理沙招牌八芒金星射线弹
  chaos_star_bolt: (p) => {
    p.glow(12, 11.5, 9, '#ffe047', 0.65);
    p.line(3, 16, 12, 11.5, '#ffae33', 2);
    p.sparkle(14, 10.5, '#ffe066', 2);
    p.diamond(14, 10.5, 4.2, 4.2, '#ffe066');
    p.diamond(14, 10.5, 2.2, 2.2, '#ffffff');
  },

  // 29. 固有术式·恋符「星火连弹」chaos_meteor_burst：三颗并行坠落的炽金星火弹幕
  chaos_meteor_burst: (p) => {
    p.glow(11.5, 11.5, 10, '#ff8f33', 0.65);
    p.line(16, 4, 8, 11, '#ff7033', 2);
    p.circle(8, 11, 2.4, '#ffe885');
    p.line(20, 9, 13, 16, '#ffae33', 2);
    p.circle(13, 16, 2.6, '#ffffff');
    p.line(10, 5, 5, 15, '#ff5722', 1);
    p.circle(5, 15, 2, '#ffcf40');
  },

  // 30. 命符「战争血祭」War Blood Sacrifice（4级）：猩红血盾环绕的炽金祭仪血核
  chaos_war_blood_sacrifice: (p) => {
    p.glow(11.5, 11.5, 10, '#ff2e4c', 0.72);
    // 外圈赤金血祭护盾棱框
    p.poly(
      [
        [11.5, 3],
        [19, 6.5],
        [17.5, 15.5],
        [11.5, 20.5],
        [5.5, 15.5],
        [4, 6.5],
      ],
      '#7a0f22',
    );
    p.ring(11.5, 11.5, 7.6, '#ff4d63', 1.5);
    // 盾心凝血晶核与金纹
    p.diamond(11.5, 11.5, 4.4, 5.2, '#ff2e4c');
    p.diamond(11.5, 11, 2.2, 2.6, '#ffe082');
    p.px(11.5, 10, '#ffffff');
    p.sparkle(6, 6, '#ffd166', 1);
    p.sparkle(17, 16, '#ff8096', 1);
  },
};

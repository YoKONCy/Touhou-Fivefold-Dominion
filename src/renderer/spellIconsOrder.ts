/**
 * 秩序系 Order 全部 27 个法术专属 24×24 手雕像素图标
 * 母题：八云隙间、月都幻瞳、红魔时计、蜃楼水镜、极寒冰瀑、宵暗、狂气赤瞳
 */

import type { SpellIconDrawFn } from './spellIconCore';

export const ORDER_SPELL_ICON_DRAWERS: Record<string, SpellIconDrawFn> = {
  // 1. 幻符「蜃气残影」Blur：三重错位半透明蓝白人形残影
  order_blur: (p) => {
    p.glow(12, 11.5, 9, '#66b8ff', 0.45);
    // 后残影（深青）
    p.circle(7.5, 7, 2.2, '#3a6db8');
    p.rect(6, 10, 3, 8, '#3a6db8');
    // 中残影（亮蓝）
    p.circle(11.5, 7, 2.4, '#70c4ff');
    p.rect(10, 10, 3, 9, '#70c4ff');
    // 前本体（纯白）
    p.circle(15.5, 7, 2.5, '#ffffff');
    p.rect(14, 10, 3, 9, '#dff4ff');
    p.hline(4, 14, 5, '#9ce0ff');
  },

  // 2. 解符「星律解咒」Dispel：被清澈星光劈成两半的紫色咒印环
  order_dispel: (p) => {
    p.glow(11.5, 11.5, 9, '#9ce8ff', 0.5);
    p.ring(11.5, 11.5, 6.5, '#9c78f0', 1.3);
    p.line(5, 18, 18, 5, '#ffffff', 2);
    p.line(6, 17, 17, 6, '#70e0ff', 1);
    p.sparkle(7, 7, '#ffffff', 1);
    p.sparkle(16, 16, '#9ceeff', 1);
  },

  // 3. 境符「隙间斥退」Displacement：紫红隙间裂口向外轰出三层弧形斥力冲击波
  order_displacement: (p) => {
    p.glow(11, 11.5, 9, '#8c6bff', 0.5);
    // 左侧隙间裂口
    p.ellipse(6.5, 11.5, 2.5, 6.8, '#2b1042');
    p.line(5, 5, 7, 18, '#ff4d79', 1);
    // 向右扩散三层斥力波
    p.line(11, 7, 13, 11.5, '#9ce0ff', 1);
    p.line(13, 11.5, 11, 16, '#9ce0ff', 1);
    p.line(15, 6, 18, 11.5, '#ffffff', 2);
    p.line(18, 11.5, 15, 17, '#ffffff', 2);
  },

  // 4. 念符「念力重拳」Magic Fist：缠绕星蓝念力光环的凌空冲击铁拳
  order_magic_fist: (p) => {
    p.glow(12, 11.5, 9, '#5ea8ff', 0.55);
    p.line(3, 15, 9, 12, '#70b8ff', 1);
    p.line(4, 18, 10, 14, '#b8e4ff', 1);
    // 握紧的念力重拳
    p.rect(9, 7, 9, 8, '#c2e4ff');
    p.rect(10, 8, 7, 6, '#ffffff');
    p.hline(9, 10, 8, '#5a94e6');
    p.vline(12, 7, 4, '#5a94e6');
    p.vline(15, 7, 4, '#5a94e6');
    p.rect(7, 11, 3, 4, '#94c8ff');
  },

  // 5. 瞳符「天眼狙定」Precision：星蓝准星十字瞄准环 + 锐利中心瞳核
  order_precision: (p) => {
    p.glow(11.5, 11.5, 8, '#6be6ff', 0.5);
    p.ring(11.5, 11.5, 7, '#70c4ff', 1.2);
    p.hline(3, 11.5, 6, '#ffffff');
    p.hline(15, 11.5, 6, '#ffffff');
    p.vline(11.5, 3, 6, '#ffffff');
    p.vline(11.5, 15, 6, '#ffffff');
    p.circle(11.5, 11.5, 2.5, '#ffe066');
    p.px(11.5, 11.5, '#ff4d6d');
  },

  // 6. 察符「千里月瞳」Visions（大地图）：月光大瞳孔 + 外围星轨探测弧
  order_visions: (p) => {
    p.glow(11.5, 10.5, 9, '#9ce0ff', 0.5);
    p.ellipse(11.5, 10.5, 8, 4.5, '#e8f5ff');
    p.circle(11.5, 10.5, 3.6, '#4d82e0');
    p.circle(11.5, 10.5, 1.8, '#ffe680');
    p.px(10.5, 9.5, '#ffffff');
    p.sparkle(6, 5, '#b8ecff', 1);
  },

  // 7. 怯符「畏惧之瞳」Cowardice：惊恐颤抖的蓝紫小眼 + 向下冷汗滴
  order_cowardice: (p) => {
    p.glow(11.5, 11.5, 8, '#7a75d9', 0.45);
    p.ellipse(11.5, 11, 7, 5, '#c9d8f5');
    p.circle(11.5, 11, 2.2, '#2a2254');
    p.px(11, 10, '#ffffff');
    // 顶部颤抖纹
    p.line(5, 5, 8, 7, '#a8b8ff', 1);
    p.line(18, 5, 15, 7, '#a8b8ff', 1);
    // 蓝色冷汗滴
    p.poly(
      [
        [17, 13],
        [19, 17],
        [15, 17],
      ],
      '#66c8ff',
    );
  },

  // 8. 镜符「蜃楼幻影」Create Illusion：竖立冰蓝水晶镜面 + 镜内外一实一虚双晶影
  order_create_illusion: (p) => {
    p.glow(11.5, 11.5, 9, '#7af0ff', 0.55);
    // 中央水镜竖轴
    p.vline(11, 3, 18, '#ffffff');
    p.vline(12, 3, 18, '#70e0ff');
    // 左实晶菱
    p.diamond(6.5, 11.5, 3.2, 5.2, '#9ce8ff');
    p.diamond(6.5, 11.5, 1.6, 2.8, '#ffffff');
    // 右虚幻空心菱
    p.diamond(16.5, 11.5, 3.2, 5.2, '#70b8ff', true);
    p.sparkle(16.5, 11.5, '#c2f7ff', 1);
  },

  // 9. 空符「御空浮游」Flight：乘风舒展的澄蓝透明双光翼 + 上升浮游气流
  order_flight: (p) => {
    p.glow(11.5, 11, 9, '#8ce8ff', 0.55);
    p.poly(
      [
        [11, 11],
        [3, 5],
        [4, 11],
        [8, 13],
      ],
      '#b8f2ff',
    );
    p.poly(
      [
        [12, 11],
        [20, 5],
        [19, 11],
        [15, 13],
      ],
      '#b8f2ff',
    );
    p.line(4, 7, 10, 11, '#ffffff', 1);
    p.line(19, 7, 13, 11, '#ffffff', 1);
    // 底部上升气旋
    p.hline(8, 16, 8, '#66c4ff');
    p.hline(10, 19, 4, '#ffffff');
  },

  // 10. 冰符「极寒冰瀑」Ice Bolt：凌厉斜刺的结晶冰枪 + 周围六角霜花碎晶
  order_ice_bolt: (p) => {
    p.glow(12, 11.5, 9, '#66e0ff', 0.6);
    p.line(4, 19, 18, 5, '#66ccff', 2);
    p.line(5, 18, 19, 4, '#ffffff', 1);
    // 锋锐枪头
    p.poly(
      [
        [20, 3],
        [14, 5],
        [18, 9],
      ],
      '#dff9ff',
    );
    p.sparkle(7, 7, '#a8f0ff', 1);
    p.sparkle(16, 16, '#a8f0ff', 1);
  },

  // 11. 涸符「灵脉枯竭」Power Drain：裂开漏尽蓝光的魔法漏瓶 + 下坠残滴
  order_power_drain: (p) => {
    p.glow(11.5, 11.5, 8, '#5a82e6', 0.45);
    p.rect(9, 4, 6, 2, '#c9b07a');
    p.ellipse(11.5, 11.5, 5.2, 5.8, '#304985');
    p.ellipse(11.5, 13, 3.6, 3.2, '#66b8ff');
    // 裂缝锯齿与漏滴
    p.line(9, 8, 13, 12, '#120c21', 1);
    p.line(13, 12, 10, 15, '#120c21', 1);
    p.px(11, 19, '#70c4ff');
    p.px(11, 20, '#ffffff');
  },

  // 12. 时符「时计缓流」Slow：红魔银金怀表 + 凝滞垂落的蓝光指针
  order_slow: (p) => {
    p.glow(11.5, 12, 9, '#66a8ff', 0.48);
    p.rect(10, 3, 4, 2, '#f0cc6e');
    p.circle(11.5, 12.5, 7, '#d9b566');
    p.circle(11.5, 12.5, 5.5, '#1a274d');
    p.ring(11.5, 12.5, 5.5, '#9ce0ff', 0.8);
    // 表针指向 8:15 缓流态
    p.line(11.5, 12.5, 11.5, 8.5, '#ffffff', 1);
    p.line(11.5, 12.5, 15, 14, '#70c4ff', 1);
    p.px(11.5, 12.5, '#ffe066');
  },

  // 13. 盗符「窃法魔手」Steal Enchantment：探入星环抓取金色魔力星的剪影手掌
  order_steal_enchantment: (p) => {
    p.glow(13, 9, 8, '#ffe066', 0.5);
    // 抓取中的金色星芒
    p.sparkle(14, 7, '#ffe066', 2);
    // 蓝紫魔手
    p.rect(6, 12, 7, 6, '#7c9eff');
    p.vline(6, 8, 5, '#b8d4ff');
    p.vline(8, 7, 6, '#b8d4ff');
    p.vline(10, 7, 6, '#b8d4ff');
    p.vline(12, 9, 4, '#b8d4ff');
    p.hline(13, 14, 4, '#b8d4ff');
  },

  // 14. 逐符「放逐虚境」Banish：吸入碎片的深空螺旋虚空裂隙
  order_banish: (p) => {
    p.glow(11.5, 11.5, 10, '#7852ff', 0.6);
    p.ellipse(11.5, 11.5, 4.5, 8.5, '#8c6bff');
    p.ellipse(11.5, 11.5, 2.8, 6.8, '#160a2e');
    p.vline(11.5, 5, 13, '#d9c2ff');
    // 飞散碎片
    p.px(5, 7, '#a8e0ff');
    p.px(18, 8, '#a8e0ff');
    p.px(4, 15, '#cfa6ff');
    p.px(19, 16, '#cfa6ff');
  },

  // 15. 忘符「忘却弹幕」Forgetfulness：被交叉紫红封条打叉封印的弓箭弹幕
  order_forgetfulness: (p) => {
    p.glow(11.5, 11.5, 8, '#c770ff', 0.45);
    // 弹幕箭矢
    p.line(5, 12, 18, 12, '#94c0ed', 2);
    p.poly(
      [
        [19, 12],
        [15, 9],
        [15, 15],
      ],
      '#dff0ff',
    );
    // 交叉忘却红紫封叉
    p.line(5, 5, 18, 18, '#ff4d79', 2);
    p.line(18, 5, 5, 18, '#c95cff', 2);
  },

  // 16. 大幻「万象蜃楼」Mass Blur（全军）：云雾托起的悬浮水晶楼阁剪影
  order_mass_blur: (p) => {
    p.massAura('#70d4ff', '#ffffff');
    // 悬浮楼阁
    p.poly(
      [
        [11.5, 4],
        [17, 9],
        [6, 9],
      ],
      '#b8f0ff',
    );
    p.rect(8, 9, 7, 6, '#70b8ff');
    p.rect(10, 11, 3, 4, '#ffffff');
    // 底部蜃气云带
    p.hline(4, 16, 16, '#dff6ff');
    p.hline(6, 18, 12, '#70c4ff');
  },

  // 17. 归零「万法归零」Mass Dispel（全场）：纯白极光扩环 + 空心“〇”星律印
  order_mass_dispel: (p) => {
    p.massAura('#ffffff', '#9ce8ff');
    p.ring(11.5, 11.5, 7.6, '#ffffff', 1.6);
    p.ring(11.5, 11.5, 4.4, '#70d4ff', 1.1);
    p.sparkle(11.5, 11.5, '#ffffff', 2);
  },

  // 18. 星瞳「百步星瞳」Mass Precision（全军）：三箭齐发穿星轨瞄准光瞳
  order_mass_precision: (p) => {
    p.massAura('#70d4ff', '#ffe680');
    p.ring(11.5, 11.5, 6.8, '#8ce0ff', 1.1);
    p.line(4, 15, 18, 6, '#ffffff', 1);
    p.line(5, 18, 19, 9, '#ffe066', 1);
    p.line(3, 12, 16, 4, '#9ce8ff', 1);
    p.sparkle(17, 7, '#ffe680', 1);
  },

  // 19. 境符「隙间瞬移」Teleport：八云标志性紫红蝴蝶结隙间 + 跃出青蓝流光
  order_teleport: (p) => {
    p.glow(11.5, 11.5, 10, '#b85cff', 0.6);
    // 隙间黑缝与白边
    p.ellipse(11.5, 11.5, 8.2, 4.8, '#d95cff');
    p.ellipse(11.5, 11.5, 6.8, 3.4, '#140826');
    // 隙间内注视的神秘红眼
    p.ellipse(11.5, 11.5, 2.8, 1.8, '#ffe894');
    p.px(11.5, 11.5, '#e63956');
    // 上下红色蝴蝶结缎带
    p.hline(9, 6, 6, '#ff4d6d');
    p.hline(9, 17, 6, '#ff4d6d');
    p.sparkle(5, 5, '#9ceeff', 1);
    p.sparkle(18, 18, '#9ceeff', 1);
  },

  // 20. 归境「隙间归城」Town Gate（大地图）：星门内映出的古雅城郭屋檐
  order_town_gate: (p) => {
    p.glow(11.5, 11, 9, '#70b8ff', 0.55);
    p.ring(11.5, 11, 7.6, '#9ce0ff', 1.3);
    p.poly(
      [
        [11.5, 6],
        [16, 10],
        [7, 10],
      ],
      '#ffe073',
    );
    p.rect(8, 10, 7, 6, '#dceeff');
    p.rect(10, 12, 3, 4, '#26468c');
  },

  // 21. 狂符「月狂赤瞳」Berserk（4级）：燃烧狂气的充血猩红兔子月瞳 + 裂纹光弧
  order_berserk: (p) => {
    p.glow(11.5, 11.5, 10, '#ff2e55', 0.65);
    p.ellipse(11.5, 11.5, 8.2, 5.2, '#ffcbd6');
    p.circle(11.5, 11.5, 4, '#e62244');
    p.circle(11.5, 11.5, 2, '#1a0814');
    p.px(10.5, 10, '#ffffff');
    // 四散狂气锯齿电纹
    p.line(3, 5, 7, 8, '#ff4d6d', 1);
    p.line(20, 5, 16, 8, '#ff4d6d', 1);
    p.line(3, 18, 7, 15, '#ff4d6d', 1);
    p.line(20, 18, 16, 15, '#ff4d6d', 1);
  },

  // 22. 闇符「宵暗蔽目」Blind（4级）：深沉漆黑宵暗球吞噬一轮弯月
  order_blind: (p) => {
    p.glow(11.5, 11.5, 9, '#4c3899', 0.55);
    // 背后月轮
    p.circle(13.5, 10.5, 6.2, '#ffe899');
    // 前景深沉暗球遮蔽
    p.circle(10.5, 12, 6.6, '#140c26');
    p.ring(10.5, 12, 6.6, '#8266d9', 1);
    // 斜遮暗带
    p.line(4, 17, 19, 6, '#302059', 2);
  },

  // 23. 永夜「永夜停摆」Mass Slow（4级全敌）：满月冻结的大时钟盘 + 四方霜晶停摆
  order_mass_slow: (p) => {
    p.massAura('#70b8ff', '#ffe899');
    p.circle(11.5, 11.5, 7.6, '#213a75');
    p.ring(11.5, 11.5, 7.6, '#ffe073', 1.3);
    // 十二时辰刻度
    p.px(11.5, 5, '#ffffff');
    p.px(11.5, 18, '#ffffff');
    p.px(5, 11.5, '#ffffff');
    p.px(18, 11.5, '#ffffff');
    // 冰封定格双针
    p.line(11.5, 11.5, 11.5, 6.5, '#b8f2ff', 2);
    p.line(11.5, 11.5, 16, 11.5, '#b8f2ff', 1);
    p.px(11.5, 11.5, '#ffe066');
  },

  // 24. 月镜「月镜分身」Phantom Image（4级）：雕花金框满月明镜 + 耀眼双身光影
  order_phantom_image: (p) => {
    p.glow(11.5, 11.5, 10, '#a8e8ff', 0.65);
    p.ellipse(11.5, 11.5, 6.5, 8.2, '#f2cf72');
    p.ellipse(11.5, 11.5, 5.2, 6.8, '#26549c');
    // 镜内双影星辉
    p.ellipse(9.5, 11.5, 2, 4.5, '#9ce8ff');
    p.ellipse(13.5, 11.5, 2, 4.5, '#ffffff');
    p.sparkle(11.5, 4, '#ffe680', 1);
  },

  // 25. 梦符「迷梦傀儡」Hypnotize（5级）：提线傀儡木十字架 + 垂落粉紫催眠魔丝与螺旋心轮
  order_hypnotize: (p) => {
    p.glow(11.5, 12, 10, '#d970ff', 0.62);
    // 傀儡操控木十字
    p.line(5, 6, 18, 6, '#e8c474', 2);
    p.line(9, 4, 14, 9, '#c48d46', 1);
    // 垂落魔丝
    p.vline(7, 7, 8, '#e8a8ff');
    p.vline(11.5, 7, 6, '#ffffff');
    p.vline(16, 7, 8, '#e8a8ff');
    // 下方被操控的螺旋迷梦环
    p.ring(11.5, 15.5, 4.2, '#e678ff', 1.2);
    p.circle(11.5, 15.5, 1.8, '#ff4d94');
  },

  // 26. 痛镜「因果水镜」Pain Mirror（5级）：裂纹反刺的湛蓝水银棱镜 + 双向对冲激光
  order_pain_mirror: (p) => {
    p.glow(11.5, 11.5, 10, '#70e8ff', 0.62);
    // 菱形水银厚镜
    p.diamond(11.5, 11.5, 6.5, 8.2, '#b8f2ff');
    p.diamond(11.5, 11.5, 4.6, 6.2, '#3d7ae0');
    // 镜面痛裂红电纹
    p.line(9, 7, 13, 11, '#ff5278', 1);
    p.line(13, 11, 10, 15, '#ff5278', 1);
    // 双向弹反箭头
    p.line(3, 11.5, 7, 11.5, '#ffe073', 2);
    p.line(16, 11.5, 20, 11.5, '#ffffff', 2);
  },

  // 27. 秘盗「大盗窃法」Steal All Enchantments（5级全场）：绽放五色宝光的星辰大布袋 + 吸星涡流
  order_steal_all_enchantments: (p) => {
    p.massAura('#ffe073', '#9ce8ff');
    // 魔导锦囊袋身
    p.ellipse(11.5, 14.5, 6, 5.2, '#5e42a8');
    p.hline(8, 9, 8, '#ffe066');
    p.poly(
      [
        [8, 9],
        [6, 6],
        [17, 6],
        [15, 9],
      ],
      '#8262d6',
    );
    // 吸入袋口的多彩魔星
    p.sparkle(11.5, 4, '#ffe680', 2);
    p.px(6, 4, '#7ef5b5');
    p.px(17, 4, '#ff7a99');
    p.px(11.5, 13, '#ffe073');
  },

  // 28. 兔符「兔化」Lunar Hare Form（竹林妖怪兔专属）：金蓝弯月辉映下的飞跃雪白灵兔 + 樱红项结与疾风流光
  order_rabbit_transform: (p) => {
    p.glow(11.5, 12, 10, '#ff8fc4', 0.6);
    // 背后月轮光晕
    p.circle(12.5, 11.5, 7.6, '#26458a');
    p.ring(12.5, 11.5, 7.6, '#ffe073', 1.2);
    // 左后疾风速度线
    p.hline(3, 9, 4, '#8ceeff');
    p.hline(2, 13, 5, '#ffa6d0');
    p.hline(4, 16, 3, '#8ceeff');
    // 飞跃雪白妖兔剪影（圆尾 + 流线体 + 兔头 + 后掠双耳）
    p.circle(7.5, 14.5, 2.0, '#ffffff');
    p.ellipse(11.5, 14, 4.2, 2.7, '#ffffff');
    p.circle(15, 11.5, 2.6, '#ffffff');
    p.line(14, 9.5, 10, 5.5, '#ffffff', 2);
    p.line(15.5, 9.5, 13, 4.5, '#ff9ec4', 1.5);
    // 樱红项结与绯红兔眸
    p.hline(12.5, 13, 3, '#ff4d7d');
    p.px(16, 11, '#ff3366');
    p.sparkle(18.5, 6.5, '#ffe885', 1);
  },
};

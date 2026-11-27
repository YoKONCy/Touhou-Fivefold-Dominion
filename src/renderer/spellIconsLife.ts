/**
 * 生命系 Life 全部 35 个法术（32 个 H4 官方生命术 + 3 个博丽固有术式）专属 24×24 手雕像素图标
 * 母题：博丽 / 守矢神道、御札、御币、神乐铃、结界、甘露、替身雏偶、八百万神降
 */

import type { SpellIconDrawFn, SpellIconPainter } from './spellIconCore';

/** 辅助：绘制生命系派系守护盾底胚 + 中央专属派系纹章 */
function drawWardShield(p: SpellIconPainter, rim: string, fill: string, core: string, isMass: boolean): void {
  if (isMass) {
    p.massAura(core, '#fff5cc');
    // 顶部注连绳饰（博丽大结界特征）
    p.hline(4, 3, 16, '#e8c474');
    p.px(6, 4, '#fff2c2');
    p.px(11, 4, '#fff2c2');
    p.px(12, 4, '#fff2c2');
    p.px(17, 4, '#fff2c2');
  }
  p.glow(11.5, 12, 9, core, 0.42);
  p.poly(
    [
      [5, 5],
      [18, 5],
      [18, 13],
      [11.5, 20],
      [5, 13],
    ],
    rim,
  );
  p.poly(
    [
      [6, 6],
      [17, 6],
      [17, 12.5],
      [11.5, 18.5],
      [6, 12.5],
    ],
    fill,
  );
}

export const LIFE_SPELL_ICON_DRAWERS: Record<string, SpellIconDrawFn> = {
  // 1. 愈符「灵札止痛」Bind Wound：交叉白布绷带 + 中央赤红灵札 + 翠绿止痛微光
  life_bind_wound: (p) => {
    p.glow(11.5, 11.5, 8, '#5ee69c', 0.45);
    p.line(5, 6, 18, 17, '#f5eedc', 2);
    p.line(18, 6, 5, 17, '#e6dcc5', 2);
    p.ofuda(9, 6, 6, 11, '#fffaf0', '#d93855');
    p.sparkle(18, 5, '#7ef5b5', 1);
    p.sparkle(5, 18, '#7ef5b5', 1);
  },

  // 2. 祝符「神祝满盈」Bless：朝阳金轮光芒四射 + 中央圣洁金菱印
  life_bless: (p) => {
    p.glow(11.5, 11.5, 10, '#ffd452', 0.55);
    p.line(11.5, 3, 11.5, 20, '#ffe478', 1);
    p.line(3, 11.5, 20, 11.5, '#ffe478', 1);
    p.line(5, 5, 18, 18, '#f0ae3c', 1);
    p.line(18, 5, 5, 18, '#f0ae3c', 1);
    p.diamond(11.5, 11.5, 5, 6, '#ffe680');
    p.diamond(11.5, 11.5, 3, 4, '#ffffff');
    p.px(11, 11, '#ff667d');
    p.px(12, 11, '#ff667d');
  },

  // 3. 祓符「御币清祓」Exorcism：倾斜木柄御币 + 层叠白纸垂 + 净化青光星点
  life_exorcism: (p) => {
    p.glow(13, 10, 9, '#9cf5ff', 0.45);
    p.line(5, 19, 13, 10, '#c48945', 2);
    // 左垂锯齿白纸垂
    p.rect(10, 4, 4, 3, '#ffffff');
    p.rect(8, 7, 4, 3, '#ebf4ff');
    p.rect(6, 10, 3, 3, '#d4e8ff');
    // 右垂锯齿白纸垂
    p.rect(14, 5, 4, 3, '#ffffff');
    p.rect(15, 8, 4, 3, '#ebf4ff');
    p.rect(16, 11, 3, 3, '#d4e8ff');
    p.rect(12, 8, 2, 2, '#e64c65');
    p.sparkle(6, 5, '#a8f5ff', 1);
    p.sparkle(18, 17, '#ffe680', 1);
  },

  // 4. 言符「破邪真言」Holy Word：赤金悬浮真言宝珠 + 四方破邪符篆光柱
  life_holy_word: (p) => {
    p.glow(11.5, 11.5, 9, '#ff5c78', 0.55);
    p.vline(11, 3, 18, '#ffd466');
    p.vline(12, 3, 18, '#ffd466');
    p.circle(11.5, 11.5, 6, '#e63956');
    p.circle(11.5, 11.5, 4.2, '#ffe073');
    // 中心“破”字微雕符纹
    p.hline(9, 10, 6, '#ffffff');
    p.vline(11, 9, 6, '#ffffff');
    p.px(10, 13, '#ffffff');
    p.px(13, 13, '#ffffff');
    p.sparkle(5, 6, '#ffe680', 1);
    p.sparkle(18, 17, '#ffe680', 1);
  },

  // 5. 护符「灵札护身」Spiritual Armor：和风大铠胸甲 + 中央朱金护身御札
  life_spiritual_armor: (p) => {
    p.glow(11.5, 11.5, 8, '#ffe082', 0.4);
    p.poly(
      [
        [5, 6],
        [9, 4],
        [14, 4],
        [18, 6],
        [19, 11],
        [16, 19],
        [7, 19],
        [4, 11],
      ],
      '#d9b56c',
    );
    p.rect(7, 7, 10, 10, '#f2e8d0');
    p.hline(7, 10, 10, '#c74c5e');
    p.hline(7, 14, 10, '#c74c5e');
    p.ofuda(10, 8, 4, 8, '#ffffff', '#e63956');
  },

  // 6. 舟符「幽船渡水」Summon Ship（大地图）：月光碧波上的和风木舟与白帆
  life_summon_ship: (p) => {
    p.glow(11.5, 10, 8, '#7ad4ff', 0.45);
    // 白帆与桅杆
    p.vline(11, 4, 11, '#c48d48');
    p.poly(
      [
        [12, 4],
        [18, 11],
        [12, 13],
      ],
      '#fff8e6',
    );
    p.poly(
      [
        [10, 6],
        [6, 12],
        [10, 13],
      ],
      '#dceeff',
    );
    // 舟身
    p.poly(
      [
        [4, 14],
        [19, 14],
        [16, 18],
        [7, 18],
      ],
      '#b5763a',
    );
    p.hline(5, 15, 13, '#e8b36b');
    // 水波
    p.hline(3, 19, 17, '#4fa8e8');
    p.hline(5, 20, 12, '#9ce0ff');
  },

  // 7. 结界「御混结界」Chaos Ward：朱红护盾 + 混沌火焰核心印
  life_chaos_ward: (p) => {
    drawWardShield(p, '#f2b857', '#4a1b1b', '#ff6e38', false);
    p.poly(
      [
        [11.5, 7],
        [14.5, 12],
        [11.5, 16],
        [8.5, 12],
      ],
      '#ff7033',
    );
    p.diamond(11.5, 12, 1.8, 2.5, '#fff099');
  },

  // 8. 结界「御冥结界」Death Ward：金边护盾 + 封禁紫骷冥纹
  life_death_ward: (p) => {
    drawWardShield(p, '#e6c56e', '#26183d', '#b580ff', false);
    p.circle(11.5, 10.5, 3, '#dfc7ff');
    p.rect(10, 13, 3, 2, '#dfc7ff');
    p.px(10, 10, '#26183d');
    p.px(13, 10, '#26183d');
    p.line(8, 8, 15, 15, '#ffe066', 1);
  },

  // 9. 守符「不动如山」Defender：巍峨青金双峰岳山 + 底部坚盾基石
  life_defender: (p) => {
    p.glow(11.5, 12, 9, '#f0c869', 0.4);
    p.poly(
      [
        [3, 19],
        [11.5, 5],
        [20, 19],
      ],
      '#9da9c2',
    );
    p.poly(
      [
        [6, 19],
        [11.5, 9],
        [17, 19],
      ],
      '#69758f',
    );
    // 雪顶与金印
    p.poly(
      [
        [9.5, 8],
        [11.5, 5],
        [13.5, 8],
      ],
      '#ffffff',
    );
    p.hline(3, 19, 18, '#e8c46b');
    p.diamond(11.5, 14.5, 2.2, 2.2, '#ffe478');
  },

  // 10. 愈符「甘露回春」Heal：白玉净瓶倾倒翠绿甘露光滴 + 绽放光十字
  life_heal: (p) => {
    p.glow(11.5, 12, 9, '#52e69c', 0.52);
    p.rect(9, 4, 6, 3, '#f5d47a');
    p.ellipse(11.5, 13, 5.2, 6, '#e8fff5');
    p.ellipse(11.5, 13.5, 3.8, 4.5, '#59e69e');
    // 十字生机纹
    p.rect(11, 10, 2, 7, '#ffffff');
    p.rect(9, 12, 6, 2, '#ffffff');
    p.sparkle(5, 7, '#a8ffd0', 1);
    p.sparkle(18, 8, '#ffe680', 1);
  },

  // 11. 结界「二重结界」Heavenly Shield：博丽朱红+鎏金同心双层圆结界阵
  life_heavenly_shield: (p) => {
    p.glow(11.5, 11.5, 10, '#ff6b84', 0.55);
    p.ring(11.5, 11.5, 8.5, '#ffe073', 1.2);
    p.ring(11.5, 11.5, 5.8, '#ff4d6d', 1.4);
    p.circle(11.5, 11.5, 3.2, '#fff5cc');
    p.px(11, 11, '#e63956');
    p.px(12, 12, '#e63956');
    // 四方结界铆钉
    p.sparkle(11.5, 3, '#ffe680', 1);
    p.sparkle(11.5, 20, '#ffe680', 1);
    p.sparkle(3, 11.5, '#ffe680', 1);
    p.sparkle(20, 11.5, '#ffe680', 1);
  },

  // 12. 偶符「替身雏偶」Martyr：和风红色纸人替身雏偶 + 护身因果丝线
  life_martyr: (p) => {
    p.glow(11.5, 11.5, 8, '#ff7890', 0.45);
    // 头部与发饰
    p.circle(11.5, 6.5, 2.8, '#fff2df');
    p.hline(9, 4, 6, '#523442');
    p.px(10, 6, '#261822');
    p.px(13, 6, '#261822');
    // 和服振袖躯身
    p.poly(
      [
        [6, 11],
        [17, 11],
        [15, 20],
        [8, 20],
      ],
      '#e63956',
    );
    p.hline(8, 13, 8, '#ffe073');
    // 替身红丝连线环绕
    p.line(4, 15, 8, 13, '#ffb3c0', 1);
    p.line(19, 15, 15, 13, '#ffb3c0', 1);
  },

  // 13. 乐符「神乐欢欣」Mirth：金色神社神乐舞铃 + 舞动红白丝带
  life_mirth: (p) => {
    p.glow(11.5, 10, 8, '#ffe066', 0.5);
    p.vline(11, 13, 7, '#a85c32');
    p.vline(12, 13, 7, '#d98c4a');
    // 三层金铃簇
    p.circle(11.5, 5.5, 2.2, '#ffe680');
    p.circle(8.5, 9, 2.2, '#f5c242');
    p.circle(14.5, 9, 2.2, '#f5c242');
    p.circle(11.5, 11.5, 2.4, '#fff2a6');
    // 飘带
    p.line(12, 15, 18, 18, '#ff4d6d', 1);
    p.line(11, 16, 6, 19, '#ffffff', 1);
  },

  // 14. 结界「御森结界」Nature Ward：翠金护盾 + 新绿双叶森纹
  life_nature_ward: (p) => {
    drawWardShield(p, '#e6c56e', '#133b28', '#52e698', false);
    p.ellipse(10.5, 11, 2.2, 3.2, '#6bf5a8');
    p.ellipse(13.5, 12, 2.2, 2.8, '#3cc97d');
    p.vline(11.5, 11, 5, '#e8ffdf');
  },

  // 15. 结界「御律结界」Order Ward：银蓝护盾 + 六芒星律纹章
  life_order_ward: (p) => {
    drawWardShield(p, '#d9e8ff', '#16284f', '#66a8ff', false);
    p.diamond(11.5, 11.5, 3.8, 3.8, '#9ce0ff', true);
    p.circle(11.5, 11.5, 1.6, '#ffffff');
  },

  // 16. 罚符「因果报应」Retribution：金色因果天平 + 反向回刺赤剑
  life_retribution: (p) => {
    p.glow(11.5, 11.5, 9, '#ff8f52', 0.48);
    // 反向弧形箭头 + 利刃
    p.ring(11.5, 11.5, 6.5, '#ffe073', 1.2);
    p.line(6, 17, 17, 6, '#ffffff', 2);
    p.line(7, 16, 16, 7, '#ff526c', 1);
    p.poly(
      [
        [18, 5],
        [13, 6],
        [17, 10],
      ],
      '#ffe680',
    );
    p.rect(5, 16, 3, 3, '#c48945');
  },

  // 17. 镇符「镇魂神乐」Song of Peace：横笛 + 飘浮金色休止音符与安宁月环
  life_song_of_peace: (p) => {
    p.glow(11.5, 11.5, 8, '#a6e8ff', 0.45);
    // 雅乐横笛
    p.line(4, 16, 19, 10, '#f2d99b', 2);
    p.px(8, 14, '#7a4b14');
    p.px(11, 13, '#7a4b14');
    p.px(14, 12, '#7a4b14');
    // 飘浮音符
    p.circle(9, 8, 2, '#9ceeff');
    p.vline(10, 4, 5, '#9ceeff');
    p.hline(10, 4, 4, '#ffffff');
    p.circle(15, 6, 1.5, '#ffe680');
  },

  // 18. 天甲「天界灵铠」Celestial Armor（全军）：带双圣翼的流光银金甲胄
  life_celestial_armor: (p) => {
    p.massAura('#ffe680', '#ffffff');
    // 两侧圣翼
    p.symPx(3, 8, '#ffffff');
    p.symPx(4, 7, '#ffffff');
    p.symPx(4, 9, '#d9efff');
    p.symPx(5, 8, '#d9efff');
    p.symPx(5, 10, '#a8d4ff');
    // 中央光铠
    p.poly(
      [
        [7, 6],
        [16, 6],
        [17, 13],
        [11.5, 19],
        [6, 13],
      ],
      '#ffe073',
    );
    p.poly(
      [
        [8, 7],
        [15, 7],
        [15, 12],
        [11.5, 17],
        [8, 12],
      ],
      '#fff9e6',
    );
    p.rect(11, 8, 2, 7, '#ff4d6d');
    p.hline(9, 11, 6, '#ff4d6d');
  },

  // 19. 破邪「阴阳叱咤」Holy Shout（全敌）：扩散的朱金音波涟漪 + 中央阴阳太极核心
  life_holy_shout: (p) => {
    p.massAura('#ff5773', '#ffe680');
    p.ring(11.5, 11.5, 8.8, '#ff5c78', 1);
    p.ring(11.5, 11.5, 6.2, '#ffd466', 1.2);
    p.circle(11.5, 11.5, 3.8, '#ffffff');
    p.poly(
      [
        [11.5, 8],
        [15, 11.5],
        [11.5, 15],
      ],
      '#e63956',
    );
    p.px(10, 10, '#e63956');
    p.px(13, 13, '#ffffff');
  },

  // 20. 大祝「八百万神祝」Mass Bless（全军）：灿烂十二道金光太阳轮 + 三枚齐飞神祝印
  life_mass_bless: (p) => {
    p.massAura('#ffe066', '#ffffff');
    p.circle(11.5, 11.5, 6.8, '#ffbe3b');
    p.circle(11.5, 11.5, 4.6, '#fff5b8');
    p.circle(11.5, 11.5, 2.4, '#ffffff');
    p.sparkle(5, 5, '#fff099', 2);
    p.sparkle(18, 5, '#fff099', 1);
    p.sparkle(18, 18, '#fff099', 2);
    p.sparkle(5, 18, '#fff099', 1);
  },

  // 21. 大愈「常世甘露」Mass Healing（全军）：三股喷涌翠白灵泉 + 金色莲台
  life_mass_healing: (p) => {
    p.massAura('#5ee69c', '#d9ffeb');
    // 莲花托盘
    p.poly(
      [
        [5, 17],
        [18, 17],
        [15, 20],
        [8, 20],
      ],
      '#f5d47a',
    );
    // 涌泉三柱
    p.rect(10, 6, 4, 11, '#7ef5b5');
    p.rect(11, 5, 2, 12, '#ffffff');
    p.line(10, 8, 6, 13, '#52d992', 1);
    p.line(13, 8, 17, 13, '#52d992', 1);
    p.sparkle(6, 8, '#b8ffd9', 1);
    p.sparkle(17, 8, '#b8ffd9', 1);
  },

  // 22. 生符「生生不息」Regeneration：环绕红心的常青绿藤与萌发双芽
  life_regeneration: (p) => {
    p.glow(11.5, 11.5, 9, '#52e685', 0.48);
    // 中心生命之心
    p.circle(9.5, 10, 2.8, '#ff5c78');
    p.circle(13.5, 10, 2.8, '#ff5c78');
    p.poly(
      [
        [7, 11],
        [16, 11],
        [11.5, 17],
      ],
      '#e63956',
    );
    // 缠绕生机绿藤
    p.ring(11.5, 12, 7.6, '#4be08a', 1);
    p.rect(16, 5, 3, 2, '#9cf5b8');
    p.rect(5, 17, 3, 2, '#9cf5b8');
  },

  // 23. 大界「大界·御混」Mass Chaos Ward（全军）：注连绳大结界盾 + 火焰双星印
  life_mass_chaos_ward: (p) => {
    drawWardShield(p, '#ffe073', '#5c1e16', '#ff7033', true);
    p.circle(11.5, 11.5, 3.6, '#ff6a33');
    p.diamond(11.5, 11.5, 2.2, 3, '#fff099');
    p.px(11.5, 11.5, '#ffffff');
  },

  // 24. 大界「大界·御冥」Mass Death Ward（全军）：注连绳大结界盾 + 圣金封冥十字
  life_mass_death_ward: (p) => {
    drawWardShield(p, '#ffe073', '#2e164d', '#c78cff', true);
    p.circle(11.5, 11.5, 3.8, '#c79cff');
    p.rect(11, 8, 2, 7, '#ffe680');
    p.rect(8, 11, 7, 2, '#ffe680');
  },

  // 25. 大祓「大祓净世」Mass Exorcism（全军）：交叉双御币 + 耀目苍白大祓光环
  life_mass_exorcism: (p) => {
    p.massAura('#9ceeff', '#ffffff');
    p.line(5, 18, 17, 6, '#d9a452', 2);
    p.line(18, 18, 6, 6, '#d9a452', 2);
    p.ring(11.5, 11.5, 5.5, '#ffffff', 1.3);
    p.circle(11.5, 11.5, 2.5, '#ff4d6d');
    p.sparkle(11.5, 4, '#ffffff', 2);
    p.sparkle(11.5, 19, '#9ceeff', 1);
  },

  // 26. 大乐「百神狂欢」Mass Fervor（全军）：和风祭典朱金太鼓 + 双木鼓槌 + 欢腾星花
  life_mass_fervor: (p) => {
    p.massAura('#ff994d', '#ffe680');
    p.circle(11.5, 12, 6.2, '#b82c3f');
    p.circle(11.5, 12, 4.8, '#faf0d7');
    // 太鼓三巴纹点缀
    p.px(11, 9, '#d93855');
    p.px(9, 13, '#d93855');
    p.px(13, 13, '#d93855');
    // 交叉双鼓槌
    p.line(5, 5, 10, 10, '#f2c866', 1);
    p.line(18, 5, 13, 10, '#f2c866', 1);
    p.sparkle(11.5, 4, '#ffe680', 1);
  },

  // 27. 大界「大界·御森」Mass Nature Ward（全军）：注连绳大结界盾 + 翠绿四叶神木印
  life_mass_nature_ward: (p) => {
    drawWardShield(p, '#ffe073', '#14422c', '#59f0a0', true);
    p.circle(11.5, 9.5, 2, '#7ef5b5');
    p.circle(9.5, 12, 2, '#52d992');
    p.circle(13.5, 12, 2, '#52d992');
    p.vline(11.5, 12, 5, '#e8ffdf');
  },

  // 28. 大界「大界·御律」Mass Order Ward（全军）：注连绳大结界盾 + 璀璨星律八芒印
  life_mass_order_ward: (p) => {
    drawWardShield(p, '#ffe073', '#162d5c', '#70b8ff', true);
    p.hline(8, 11.5, 8, '#a8e0ff');
    p.vline(11.5, 8, 8, '#a8e0ff');
    p.diamond(11.5, 11.5, 3, 3, '#ffffff');
  },

  // 29. 祈符「巫女祈祷」Prayer：绽放朱白圣洁八瓣莲华 + 上升金光祈愿柱
  life_prayer: (p) => {
    p.massAura('#ff9cb3', '#ffe680');
    p.rect(10, 3, 4, 10, '#ffe894', true);
    // 莲华花瓣
    p.poly(
      [
        [11.5, 6],
        [14.5, 14],
        [11.5, 17],
        [8.5, 14],
      ],
      '#fff5f8',
    );
    p.poly(
      [
        [5, 11],
        [10, 13],
        [9, 17],
        [6, 16],
      ],
      '#ff8da8',
    );
    p.poly(
      [
        [18, 11],
        [13, 13],
        [14, 17],
        [17, 16],
      ],
      '#ff8da8',
    );
    p.hline(6, 18, 12, '#f5d47a');
    p.sparkle(11.5, 4, '#ffffff', 2);
  },

  // 30. 神迹「八百万神降」Divine Intervention（5级）：天降圣金光门 + 六芒神光柱 + 满屏羽辉
  life_divine_intervention: (p) => {
    p.massAura('#ffe885', '#ffffff');
    p.glow(11.5, 11.5, 11, '#ffe478', 0.72);
    // 贯天圣光柱
    p.rect(8, 2, 8, 20, '#ffd466');
    p.rect(10, 2, 4, 20, '#ffffff');
    // 天界圆轮与横光翼
    p.ring(11.5, 9, 6.2, '#ffe894', 1.3);
    p.line(3, 10, 8, 12, '#ffffff', 2);
    p.line(20, 10, 15, 12, '#ffffff', 2);
    p.sparkle(5, 5, '#ffffff', 2);
    p.sparkle(18, 5, '#ffffff', 2);
    p.sparkle(6, 18, '#ffe680', 1);
    p.sparkle(17, 18, '#ffe680', 1);
  },

  // 31. 神使「御神护命」Guardian Angel（5级）：金色头顶光环 + 展开六片雪白天使羽翼
  life_guardian_angel: (p) => {
    p.glow(11.5, 11, 10, '#fff2b3', 0.6);
    // 天使光环
    p.ellipse(11.5, 5, 5, 1.8, '#ffe066');
    p.ellipse(11.5, 5, 3, 0.8, '#3a1421');
    // 三层展开双翼
    p.poly(
      [
        [10, 11],
        [3, 7],
        [4, 13],
        [9, 15],
      ],
      '#ffffff',
    );
    p.poly(
      [
        [13, 11],
        [20, 7],
        [19, 13],
        [14, 15],
      ],
      '#ffffff',
    );
    p.poly(
      [
        [10, 14],
        [5, 15],
        [6, 19],
        [10, 17],
      ],
      '#d9ecff',
    );
    p.poly(
      [
        [13, 14],
        [18, 15],
        [17, 19],
        [13, 17],
      ],
      '#d9ecff',
    );
    // 中央护命核心
    p.diamond(11.5, 13, 2.5, 4.5, '#ffe073');
    p.px(11.5, 12.5, '#ffffff');
  },

  // 32. 净域「常世净域」Sanctuary（5级）：博丽朱红大鸟居 + 绝对无敌澄蓝水晶穹顶
  life_sanctuary: (p) => {
    p.glow(11.5, 12, 10, '#9ceeff', 0.58);
    // 穹顶水晶弧
    p.ring(11.5, 13, 8.8, '#b8f2ff', 1.2);
    // 内部朱红鸟居
    p.hline(5, 8, 14, '#ff4d6d');
    p.hline(6, 9, 12, '#c92642');
    p.hline(7, 11, 10, '#ff4d6d');
    p.vline(8, 9, 10, '#e63956');
    p.vline(15, 9, 10, '#e63956');
    p.hline(4, 19, 16, '#ffe680');
    p.sparkle(11.5, 5, '#ffffff', 1);
  },

  // 33. 固有术式·结界「博丽护身结界」life_ward：菱形朱金博丽御札盾
  life_ward: (p) => {
    p.glow(11.5, 11.5, 9, '#ff6680', 0.5);
    p.diamond(11.5, 11.5, 8, 8.5, '#ffe073');
    p.diamond(11.5, 11.5, 6.2, 6.6, '#d93855');
    p.ofuda(9.5, 7, 5, 9, '#fff9eb', '#e63956');
  },

  // 34. 固有术式·灵符「阴阳封魔弹」life_exorcism_orb：高速旋转的红白阴阳玉追踪弹
  life_exorcism_orb: (p) => {
    p.glow(12, 11.5, 9, '#ff4d6d', 0.6);
    p.line(3, 18, 9, 13, '#ffe073', 2);
    p.line(5, 20, 11, 15, '#ff6b84', 1);
    p.circle(13, 10, 6, '#ffe680');
    p.circle(13, 10, 5, '#ffffff');
    p.poly(
      [
        [13, 5],
        [18, 10],
        [13, 15],
      ],
      '#e63956',
    );
    p.circle(13, 7.8, 1.3, '#e63956');
    p.circle(13, 12.2, 1.3, '#ffffff');
  },

  // 35. 固有术式·苏生「博丽返魂苏生」life_resurrection：盛放金莲托举腾空的返魂朱雀灵光
  life_resurrection: (p) => {
    p.glow(11.5, 11, 10, '#ffe885', 0.65);
    p.vline(11, 4, 15, '#fff5b8');
    p.vline(12, 4, 15, '#fff5b8');
    p.poly(
      [
        [11.5, 4],
        [17, 10],
        [11.5, 12],
        [6, 10],
      ],
      '#ffffff',
    );
    p.poly(
      [
        [6, 16],
        [17, 16],
        [14, 20],
        [9, 20],
      ],
      '#ff5c78',
    );
    p.hline(7, 16, 10, '#ffe066');
    p.sparkle(5, 6, '#ffe680', 1);
    p.sparkle(18, 6, '#ffe680', 1);
  },
};

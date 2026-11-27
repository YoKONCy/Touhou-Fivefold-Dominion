/**
 * 内置幻想乡精怪与妖怪生物 48×54 骨骼解构多态动画绘谱（阴阳毛玉、向日葵妖精、竹林妖怪兔、地底怨灵）
 */

import { drawChibiFaceEyes } from './painter';
import type { SpriteRigSpec } from './types';

/** 基础精怪与妖怪生物骨骼绘谱表 */
export const CREATURE_RIG_SPECS: Record<
  'creature_kedama' | 'creature_fairy' | 'creature_rabbit' | 'creature_spirit',
  SpriteRigSpec
> = {
  /** 3. 阴阳毛玉：挤压弹性跳动 + 波浪律动绒毛簇 + 旋转朱金太极核 + 环绕双灵火 */
  creature_kedama: {
    backdropTop: '#10152b',
    backdropBottom: '#212238',
    backdropGlow: '#ff6b84',
    avatarCrop: { x: 9, y: 17, size: 30 },
    portraitCrop: { x: 5, y: 14, w: 38, h: 35 },
    draw: (p, pose) => {
      const bx = Math.round(24 + pose.leanX * 1.1);
      const bounceY = Math.round(pose.breathY * 1.4 - pose.stepLift * 2.2);
      const squashX = pose.state === 'move' ? (pose.stepLift > 0.5 ? -1.2 : 1.6) : pose.state === 'attack' ? (pose.armAction > 0.5 ? 2.4 : -1.8) : pose.breathY * -0.5;
      const squashY = -squashX * 0.85;
      const cy = 36 + bounceY;
      const rx = 11.2 + squashX;
      const ry = 9.4 + squashY;
      const fl = Math.round(pose.flutter * 1.4);

      // 蓬松多层绒毛主体（随律动轻颤）
      p.ellipse(bx, cy + 1, rx, ry, '#a9b4d4');
      p.ellipse(bx - 1, cy - 1, rx - 0.8, ry - 0.8, '#e3e2ed');
      p.ellipse(bx - 1, cy - 2.5, rx - 2.4, ry - 2.4, '#faf7f2');
      p.ellipse(bx - 2, cy - 4.5, rx - 4.8, ry - 4.8, '#ffffff');
      // 外翘动感绒毛簇
      p.ellipse(bx - Math.round(rx) + 1, cy + fl, 3.4, 2.6, '#dde0eb');
      p.ellipse(bx + Math.round(rx) - 1, cy - fl, 3.4, 2.6, '#bcc4de');
      p.ellipse(bx + fl, cy - Math.round(ry), 4.2, 2.6, '#ffffff');

      // 旋转发光朱金阴阳太极晶核
      const coreR = pose.slashAlpha > 0.3 ? 5.6 : 4.6;
      const coreX = bx + Math.round(pose.leanX * 0.5);
      p.ellipse(coreX, cy - 1, coreR, coreR, '#ffe082', true);
      p.ellipse(coreX, cy - 1, coreR - 1, coreR - 1, '#e63050', true);
      const flipTaiji = pose.frame % 2 === 0 ? 1 : -1;
      p.poly([[coreX, cy - 5], [coreX + 4 * flipTaiji, cy - 1], [coreX, cy + 3]], '#fff2bf', true);
      p.px(coreX - flipTaiji, cy - 3, '#ffffff', true);
      p.px(coreX + flipTaiji, cy + 1, '#c4203b', true);

      // 双伴飞环绕灵火
      const wOff = Math.round(Math.sin(pose.phase * Math.PI * 2) * 3);
      p.ellipse(bx - 16, cy + 2 + wOff, 2.0, 2.5, '#ffad66', true);
      p.px(bx - 16, cy + 1 + wOff, '#ffffff', true);
      p.ellipse(bx + 16, cy - 1 - wOff, 1.8, 2.3, '#ff738a', true);
      p.px(bx + 16, cy - 2 - wOff, '#ffffff', true);

      if (pose.slashAlpha > 0.3) {
        p.line(bx + 11, cy - 7, bx + 20, cy - 1, '#ff6b84', 2, true);
        p.line(bx + 11, cy + 5, bx + 20, cy - 1, '#ffe680', 2, true);
      }
    },
  },

  /** 4. 向日葵妖精：软萌甜美花仙子 — 蓬松暖金卷发 + 斜戴盛开向日葵花卡 + 泡泡袖花瓣蓬蓬裙 + 闪亮青碧蝴蝶四翼 + 踢动小圆鞋 */
  creature_fairy: {
    backdropTop: '#0b1c2c',
    backdropBottom: '#15363b',
    backdropGlow: '#6bf0a8',
    avatarCrop: { x: 11, y: 7, size: 26 },
    portraitCrop: { x: 4, y: 5, w: 40, h: 44 },
    draw: (p, pose) => {
      const bx = Math.round(24 + pose.leanX);
      const by = Math.round(pose.breathY * 1.7 - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.3);
      const wingFlap = Math.round(Math.sin(pose.phase * Math.PI * 4) * 4.5 + (pose.state === 'move' ? 3 : 0));

      // [部件 1] 四枚柔美圆润的虹彩青碧蝴蝶妖精翅（带星光点缀）
      p.poly([[bx - 2, 27 + by], [bx - 16, 15 + by + wingFlap], [bx - 18, 22 + by + wingFlap], [bx - 13, 28 + by + Math.round(wingFlap * 0.6)], [bx - 5, 30 + by]], '#3ad9b8', true);
      p.poly([[bx - 3, 27 + by], [bx - 13, 18 + by + wingFlap], [bx - 14, 23 + by + wingFlap], [bx - 5, 29 + by]], '#d6fff7', true);
      p.poly([[bx + 2, 27 + by], [bx + 16, 15 + by + wingFlap], [bx + 18, 22 + by + wingFlap], [bx + 13, 28 + by + Math.round(wingFlap * 0.6)], [bx + 5, 30 + by]], '#3ad9b8', true);
      p.poly([[bx + 3, 27 + by], [bx + 13, 18 + by + wingFlap], [bx + 14, 23 + by + wingFlap], [bx + 5, 29 + by]], '#d6fff7', true);
      // 圆润小下翼
      p.ellipse(bx - 10, 34 + by - Math.round(wingFlap * 0.4), 5.0, 3.6, '#38c7a8', true);
      p.ellipse(bx - 9, 34 + by - Math.round(wingFlap * 0.4), 3.0, 2.0, '#c8fff2', true);
      p.ellipse(bx + 10, 34 + by - Math.round(wingFlap * 0.4), 5.0, 3.6, '#38c7a8', true);
      p.ellipse(bx + 9, 34 + by - Math.round(wingFlap * 0.4), 3.0, 2.0, '#c8fff2', true);
      p.px(bx - 14, 19 + by + wingFlap, '#fff7b8', true);
      p.px(bx + 14, 19 + by + wingFlap, '#fff7b8', true);

      // [部件 2] 蓬松暖金卷曲后发与耳侧小卷尾
      p.ellipse(bx, 22 + by, 8.2, 6.8, '#c9821e');
      p.ellipse(bx - 7 + sway, 27 + by, 3.4, 4.2, '#e8a832');
      p.ellipse(bx + 7 - sway, 27 + by, 3.4, 4.2, '#e8a832');
      p.px(bx - 7 + sway, 26 + by, '#ffe885');
      p.px(bx + 7 - sway, 26 + by, '#ffe885');

      // [部件 3] 凌空欢快晃动的小白袜与翡翠玛丽珍圆鞋
      const kick = Math.round(pose.stride * 3 + pose.flutter * 1.6);
      const lFootY = 43 + by + Math.round(kick * 0.35);
      const rFootY = 42 + by - Math.round(kick * 0.45);
      p.rect(bx - 4 - Math.round(kick * 0.4), lFootY - 2, 2, 4, '#fff8f0');
      p.hline(bx - 5 - Math.round(kick * 0.4), lFootY + 2, 3, '#1f8a54');
      p.rect(bx + 2 + Math.round(kick * 0.4), rFootY - 2, 2, 4, '#fff8f0');
      p.hline(bx + 2 + Math.round(kick * 0.4), rFootY + 2, 3, '#1f8a54');

      // [部件 4] 可爱泡泡袖层叠花瓣蓬蓬裙 + 暖金大蝴蝶结
      const skew = Math.round(-pose.leanX * 0.45 + sway * 0.5);
      p.poly([[bx - 6, 31 + by], [bx + 6, 31 + by], [bx + 11 + skew, 42 + by], [bx - 11 + skew, 42 + by]], '#1e8c57');
      p.poly([[bx - 5, 31 + by], [bx + 5, 31 + by], [bx + 8 + skew, 41 + by], [bx - 8 + skew, 41 + by]], '#42d988');
      // 奶油象牙花瓣裙心与白色蕾丝花边
      p.poly([[bx - 2, 32 + by], [bx + 2, 32 + by], [bx + 4 + skew, 41 + by], [bx - 4 + skew, 41 + by]], '#fff8de');
      p.hline(bx - 10 + skew, 41 + by, 20, '#fff7e6');
      p.px(bx - 7 + skew, 42 + by, '#4ce695');
      p.px(bx + 6 + skew, 42 + by, '#4ce695');
      // 泡泡短袖与白色荷叶小领
      p.ellipse(bx - 6, 30 + by, 2.8, 2.6, '#fff8eb');
      p.ellipse(bx + 6, 30 + by, 2.8, 2.6, '#fff8eb');
      p.hline(bx - 4, 29 + by, 8, '#ffffff');
      // 暖金腰间大蝴蝶结与小飘带
      p.rect(bx - 3, 33 + by, 6, 2, '#ffd44d');
      p.px(bx - 2, 33 + by, '#fff5a6');
      p.px(bx + 1, 33 + by, '#fff5a6');
      p.px(bx - 2 + sway, 35 + by, '#f0a830');
      p.px(bx + 1 + sway, 35 + by, '#f0a830');

      // [部件 5] 俏皮挥动小后手
      p.line(bx - 6, 31 + by, bx - 10, 34 + by - Math.round(pose.flutter), '#ffe6d4', 2);

      // [部件 6] 圆润软萌小脸庞 + 闪亮大翡翠星眸 + 粉嫩双颊
      const headY = 22 + by;
      p.ellipse(bx, headY, 5.8, 5.4, '#ffe8d6');
      p.hline(bx - 4, headY + 4, 8, '#f0c4ab');
      drawChibiFaceEyes(p, bx + 1, headY, '#148a4c', '#9effc8', pose);
      // 额外加深甜美樱粉腮红与甜笑
      p.hline(bx - 5, headY + 2, 2, '#ffa6b8');
      p.hline(bx + 4, headY + 2, 2, '#ffa6b8');

      // [部件 7] 柔顺金发圆润刘海 + 俏皮小呆毛 + 右侧斜戴向日葵大花卡！
      p.ellipse(bx, headY - 4.5, 6.6, 3.6, '#f0b835');
      p.rect(bx - 6, headY - 5, 12, 4, '#ffd454');
      p.hline(bx - 4, headY - 6, 8, '#fff7bd');
      // 蓬松贴颊小鬓发
      p.rect(bx - 7, headY - 2, 2, 7, '#f0b835');
      p.rect(bx + 5, headY - 2, 2, 7, '#f0b835');
      p.px(bx - 3, headY - 1, '#e6a82e');
      p.px(bx + 1, headY - 1, '#e6a82e');
      p.px(bx + 4, headY - 1, '#e6a82e');
      // 左侧俏皮小呆毛与嫩绿芽叶
      p.line(bx - 3, headY - 8, bx - 6, headY - 11 + sway, '#ffe073', 1);
      p.ellipse(bx - 6, headY - 6, 2.8, 2.0, '#44d17c');
      // 右上角斜戴盛开的大向日葵花饰（立体花瓣 + 暖褐花心 + 翠叶）
      const fx = bx + 5;
      const fy = headY - 7;
      p.ellipse(fx + 4, fy + 2, 2.8, 1.8, '#2ea862');
      p.ellipse(fx - 3, fy - 2, 2.6, 1.8, '#2ea862');
      p.ellipse(fx, fy, 5.2, 4.6, '#ffbd26', true);
      p.ellipse(fx, fy, 4.2, 3.6, '#fff078', true);
      p.ellipse(fx, fy, 2.2, 2.0, '#7d3d10');
      p.px(fx - 1, fy - 1, '#c46c2b');

      // [部件 8] 前手欢快挥舞发光向日葵小花杖（攻击时撒出金粉星花！）
      const wandHandX = pose.armAction >= 0.7 ? bx + 12 : pose.armAction <= -0.6 ? bx + 7 : bx + 9;
      const wandHandY = pose.armAction >= 0.7 ? 29 + by : pose.armAction <= -0.6 ? 22 + by : 32 + by;
      const wandTipX = pose.armAction >= 0.7 ? bx + 19 : pose.armAction <= -0.6 ? bx + 4 : bx + 15;
      const wandTipY = pose.armAction >= 0.7 ? 25 + by : pose.armAction <= -0.6 ? 13 + by : 24 + by;
      p.line(bx + 5, 30 + by, wandHandX, wandHandY, '#ffe8d6', 2);
      p.line(wandHandX, wandHandY, wandTipX, wandTipY, '#4fd17c', 2);
      p.ellipse(wandTipX, wandTipY, 3.0, 3.0, '#ffe052', true);
      p.px(wandTipX, wandTipY, '#9e4c14');
      if (pose.slashAlpha > 0.3) {
        p.px(wandTipX + 4, wandTipY - 3, '#fff599', true);
        p.px(wandTipX + 5, wandTipY + 1, '#ffb3d1', true);
        p.px(wandTipX + 3, wandTipY + 5, '#7fffe0', true);
      }
    },
  },

  /** 5. 竹林妖怪兔：超萌灵动和风兔娘 — 一立一微折粉白长兔耳 + 樱红耳根蝴蝶结 + 摇曳小白绒尾 + 甜美和风蓬蓬短裙 + 发光月纹小杵 */
  creature_rabbit: {
    backdropTop: '#0d142e',
    backdropBottom: '#1c2c52',
    backdropGlow: '#ff96c2',
    avatarCrop: { x: 10, y: 4, size: 28 },
    portraitCrop: { x: 4, y: 2, w: 40, h: 46 },
    draw: (p, pose) => {
      const bx = Math.round(24 + pose.leanX);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const earTilt = Math.round(-pose.leanX * 0.8 + pose.flutter * 1.3);

      // [部件 1] 超萌一立一微折毛茸茸双兔耳 + 樱红小蝴蝶结！
      // 左耳：根部竖起，耳尖俏皮向前/微弯软软晃动！
      p.poly([[bx - 6, 17 + by], [bx - 10 + earTilt, 7 + by], [bx - 6 + earTilt, 6 + by], [bx - 2, 17 + by]], '#edf2fc');
      p.poly([[bx - 10 + earTilt, 7 + by], [bx - 14 + earTilt, 10 + by + sway], [bx - 11 + earTilt, 12 + by + sway], [bx - 6 + earTilt, 8 + by]], '#ffffff');
      p.poly([[bx - 6, 16 + by], [bx - 9 + earTilt, 9 + by], [bx - 7 + earTilt, 8 + by], [bx - 4, 16 + by]], '#ff99bd', true);
      // 右耳：软萌圆润高耸挺立，内衬樱花粉！
      p.poly([[bx + 2, 17 + by], [bx + 5 + earTilt, 4 + by], [bx + 10 + earTilt, 5 + by], [bx + 6, 17 + by]], '#ffffff');
      p.ellipse(bx + 7 + earTilt, 5 + by, 2.4, 2.0, '#ffffff');
      p.poly([[bx + 3, 16 + by], [bx + 6 + earTilt, 7 + by], [bx + 8 + earTilt, 8 + by], [bx + 5, 16 + by]], '#ff94ba', true);
      // 右耳根系着超可爱的樱红小蝴蝶结！
      p.rect(bx + 2, 14 + by, 5, 2, '#ff4d79', true);
      p.px(bx + 4, 15 + by, '#ffe08a', true);

      // [部件 2] 背后摇曳软萌小白绒球兔尾 + 樱粉腰带飘带！
      const tailY = 39 + by + Math.round(pose.flutter);
      p.ellipse(bx - 10, tailY, 3.6, 3.4, '#e3ebfa');
      p.ellipse(bx - 10, tailY - 1, 2.6, 2.4, '#ffffff');
      p.poly([[bx - 6, 34 + by], [bx - 14, 36 + by + sway], [bx - 13, 40 + by + sway], [bx - 6, 37 + by]], '#ff78a5');

      // [部件 3] 白及膝袜 + 靛蓝绑带可爱小短靴（欢快小碎步奔跑！）
      const legStride = Math.round(pose.stride * 4.6);
      const backLift = pose.stride > 0.3 ? -2 : 0;
      const frontLift = pose.stride < -0.3 ? -2 : 0;
      // 后腿
      p.rect(bx - 4 - legStride, 41 + backLift, 3, 5, '#e8eefc');
      p.rect(bx - 5 - legStride, 45 + backLift, 4, 3, '#2b478c');
      p.px(bx - 3 - legStride, 45 + backLift, '#ff8fb5');
      // 前腿
      p.rect(bx + 2 + legStride, 41 + frontLift, 3, 5, '#ffffff');
      p.rect(bx + 2 + legStride, 45 + frontLift, 4, 3, '#3f68c7');
      p.px(bx + 4 + legStride, 45 + frontLift, '#ff8fb5');

      // [部件 4] 甜美和风兔娘迷你振袖蓬蓬短裙 + 白色蕾丝边 + 樱粉宽腰带
      const skirtSkew = Math.round(-pose.leanX * 0.5 + sway * 0.5);
      p.poly([[bx - 6, 33 + by], [bx + 6, 33 + by], [bx + 11 + skirtSkew, 43 + by], [bx - 11 + skirtSkew, 43 + by]], '#2b4a96');
      p.poly([[bx - 4, 33 + by], [bx + 4, 33 + by], [bx + 8 + skirtSkew, 42 + by], [bx - 8 + skirtSkew, 42 + by]], '#5785e6');
      p.vline(bx - 2, 34 + by, 7, '#87b0ff');
      p.hline(bx - 10 + skirtSkew, 42 + by, 20, '#ffffff'); // 可爱白色蕾丝蓬边
      // 洁白和风上衣 + 樱粉蝴蝶结腰封
      p.poly([[bx - 5, 27 + by], [bx + 5, 27 + by], [bx + 6, 34 + by], [bx - 6, 34 + by]], '#f5f8ff');
      p.hline(bx - 5, 33 + by, 10, '#ff6e9c');
      p.rect(bx - 2, 32 + by, 4, 3, '#ff94b8');
      p.px(bx, 33 + by, '#fff2c2');
      // 左侧可爱小振袖与后手
      p.poly([[bx - 5, 28 + by], [bx - 11 - Math.round(pose.stride * 2), 32 + by], [bx - 10 - Math.round(pose.stride * 2), 36 + by], [bx - 5, 34 + by]], '#4d78d6');
      p.hline(bx - 11 - Math.round(pose.stride * 2), 35 + by, 5, '#ffffff');
      p.rect(bx - 11 - Math.round(pose.stride * 2), 36 + by, 2, 2, '#ffe8dc');

      // [部件 5] 柔和月银淡紫波波头 + 软萌圆脸 + 闪亮草莓红大眼与樱粉腮红！
      const headY = 22 + by;
      p.ellipse(bx, headY - 1, 7.2, 6.4, '#92a4d4'); // 后发蓬松波波轮廓
      p.ellipse(bx, headY, 5.8, 5.4, '#ffe9de');
      p.hline(bx - 4, headY + 4, 8, '#f0c4b2');
      drawChibiFaceEyes(p, bx + 1, headY, '#c91a45', '#ff8cb0', pose);
      p.hline(bx - 5, headY + 2, 2, '#ffa3ba');
      p.hline(bx + 4, headY + 2, 2, '#ffa3ba');
      // 淡紫月银蓬松刘海与贴颊小发簇（与雪白兔耳形成温柔色彩对比！）
      p.ellipse(bx, headY - 4.5, 6.6, 3.4, '#b8c8eb');
      p.rect(bx - 6, headY - 5, 12, 4, '#dce6fa');
      p.hline(bx - 4, headY - 6, 8, '#ffffff');
      p.rect(bx - 7, headY - 2, 2, 8, '#c4d2f0');
      p.rect(bx + 5, headY - 2, 2, 8, '#c4d2f0');
      p.px(bx - 3, headY - 1, '#a3b5e0');
      p.px(bx + 1, headY - 1, '#a3b5e0');
      p.px(bx + 4, headY - 1, '#a3b5e0');

      // [部件 6] 前振袖握持发光「月纹捣药杵」（带摇曳樱粉挂穗！蓄力高举 → 银蓝星光先攻突刺！）
      let pStartX = bx + 5;
      let pStartY = 39 + by;
      let pEndX = bx + 13;
      let pEndY = 18 + by;
      let handX = bx + 8;
      let handY = 32 + by;

      if (pose.armAction <= -0.6) {
        handX = bx - 1;
        handY = 26 + by;
        pStartX = bx - 9;
        pStartY = 33 + by;
        pEndX = bx + 6;
        pEndY = 16 + by;
      } else if (pose.armAction >= 0.7) {
        handX = bx + 11;
        handY = 30 + by;
        pStartX = bx - 1;
        pStartY = 31 + by;
        pEndX = bx + 22;
        pEndY = 29 + by;
      } else {
        handX = bx + 7 + Math.round(pose.stride * 2);
        handY = 32 + by;
        pStartX = handX - 3;
        pStartY = handY + 7;
        pEndX = handX + 5;
        pEndY = handY - 13;
      }

      p.line(bx + 4, 29 + by, handX, handY, '#5785e6', 3);
      p.rect(handX - 1, handY - 1, 2, 2, '#ffe9de');
      p.line(pStartX, pStartY, pEndX, pEndY, '#75c8ff', 2, true);
      p.ellipse(pEndX, pEndY, 3.0, 3.0, '#e3f9ff', true);
      p.px(pEndX, pEndY, '#ffffff', true);
      // 杵尾摇曳樱粉小挂穗
      p.rect(pStartX - 1, pStartY + 1, 2, 3, '#ff78a5', true);
      if (pose.slashAlpha > 0.3) {
        p.hline(pEndX, pEndY - 1, 6, '#ffffff', true);
        p.hline(pEndX - 2, pEndY + 1, 7, '#ff9ec7', true);
      }
    },
  },

  /** 8. 地底怨灵（1×2 飞行）：三段扭动幽冥尾焰 + 伸展灵爪突袭 + 凛冽紫瞳与环绕鬼火 */
  creature_spirit: {
    backdropTop: '#080e20',
    backdropBottom: '#191836',
    backdropGlow: '#52f0df',
    avatarCrop: { x: 10, y: 8, size: 28 },
    portraitCrop: { x: 5, y: 6, w: 38, h: 43 },
    draw: (p, pose) => {
      const bx = Math.round(24 + pose.leanX * 1.2);
      const by = Math.round(pose.breathY * 1.8 - pose.stepLift);
      const w1 = Math.round(Math.sin(pose.phase * Math.PI * 2) * 3.5);
      const w2 = Math.round(Math.sin(pose.phase * Math.PI * 2 + 1.4) * 4.5);

      // [部件 1] 三段S形扭动幽紫灵尾
      p.poly([[bx - 3 + w2, 48 + by], [bx - 6 + w1, 39 + by], [bx + 5 + w1, 38 + by], [bx + 1 + w2, 48 + by]], '#52228f');
      p.poly([[bx - 8 + w1, 35 + by], [bx + 8 + w1, 35 + by], [bx + 4 + w1, 42 + by], [bx - 4 + w1, 42 + by]], '#2a809c');

      // [部件 2] 幽冥青碧灵焰主体 + 飘摇顶焰
      p.ellipse(bx, 26 + by, 8.6, 9.8, '#28b8b8', true);
      p.ellipse(bx, 24 + by, 6.8, 7.6, '#66f7e8', true);
      p.ellipse(bx, 22 + by, 4.8, 5.0, '#e3fffc', true);
      p.poly([[bx - 6, 18 + by], [bx - w1, 7 + by], [bx + 6, 18 + by]], '#4ce6d8', true);
      p.poly([[bx - 4, 18 + by], [bx - Math.round(w1 * 0.5), 11 + by], [bx + 4, 18 + by]], '#d4fffb', true);

      // [部件 3] 伸展幽冥利爪双臂（攻击时猛然扑抓！）
      const clawReach = pose.armAction >= 0.7 ? 10 : pose.armAction <= -0.6 ? -3 : 3;
      p.line(bx + 5, 27 + by, bx + 9 + clawReach, 25 + by - Math.round(pose.armAction * 4), '#66f7e8', 2, true);
      p.line(bx + 5, 30 + by, bx + 8 + clawReach, 31 + by - Math.round(pose.armAction * 2), '#b866ff', 2, true);

      // [部件 4] 凛冽紫晶双眸
      if (pose.expr !== 'hurt') {
        p.rect(bx - 5, 22 + by, 3, 2, '#9933ff', true);
        p.rect(bx + 2, 22 + by, 3, 2, '#9933ff', true);
        p.px(bx - 4, 22 + by, '#ffe0ff', true);
        p.px(bx + 3, 22 + by, '#ffe0ff', true);
      } else {
        p.hline(bx - 5, 23 + by, 3, '#5c1499');
        p.hline(bx + 2, 23 + by, 3, '#5c1499');
      }

      // [部件 5] 环绕双鬼火
      p.ellipse(bx - 14, 28 + by + w1, 2.4, 3.0, '#b866ff', true);
      p.px(bx - 14, 27 + by + w1, '#ffffff', true);
      p.ellipse(bx + 14, 23 + by - w1, 2.2, 2.8, '#5ef2e3', true);
      p.px(bx + 14, 22 + by - w1, '#ffffff', true);
    },
  },
};

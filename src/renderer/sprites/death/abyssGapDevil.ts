/**
 * 8. 深渊隙间恶魔 / 魔王（T4-B · 1×2 高挑深渊暗系魔王：修长高开衩黑金魔王长礼服 + 漆黑金环双魔角 + 尖锐撕裂空间隙间魔瞳 + 黑曜鎏金深渊月镰！）
 */

import {
  drawCleanAnimeHair64,
  drawGothicBatWings64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSlashArc64,
  drawSoftChibiArm64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawWrappedHand, HD_BASE } from './helpers';

export const abyssGapDevilSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#14051f',
  backdropBottom: '#330a38',
  backdropGlow: '#ff2b6e',
  avatarCrop: { x: 13, y: 2, size: 36 },
  portraitCrop: { x: 2, y: 1, w: 60, h: 68 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const bx = isAtk && (f === 1 || f === 2) ? 24 : isMove ? 28 : Math.round(28 + pose.leanX * 0.9);
    const by = isMove
      ? [-2, -4, -3, -1][f % 4]
      : Math.round(pose.breathY * 1.0 - pose.stepLift * 1.1);
    const flap = isMove ? [-6, 5, -2, -5][f % 4] : Math.round(Math.sin(phase) * 2.4 + pose.flutter);
    const sway = isMove ? 2.6 : pose.flutter * 1.7;
    // 1×2 高挑魔王专属御姐比例：头位比常规单位高出 4px，气场瞬间鹤立鸡群！
    const headY = 19 + by;

    // [1] 背后斜向撕裂空间的「尖锐深渊隙间裂隙 + 竖瞳金红魔眼 + 绯红丝带小蝴蝶结」（瞬移裂界态时剧烈扩张撕裂！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const gapY = 23 + by + Math.round(Math.sin(phase) * 1.4);
    const tearBoost = isMove ? 5 : 0;
    p.poly(
      [
        [Math.max(1, bx - 25 - tearBoost), gapY + 3],
        [bx - 12, gapY - 6 - Math.round(tearBoost * 0.6)],
        [bx + 12, gapY - 5 - Math.round(tearBoost * 0.6)],
        [Math.min(62, bx + 25 + tearBoost), gapY + 1],
        [bx + 11, gapY + 8 + Math.round(tearBoost * 0.6)],
        [bx - 11, gapY + 9 + Math.round(tearBoost * 0.6)],
      ],
      '#8c1148',
    );
    p.poly(
      [
        [Math.max(3, bx - 22 - tearBoost), gapY + 2],
        [bx - 11, gapY - 4 - Math.round(tearBoost * 0.5)],
        [bx + 11, gapY - 3 - Math.round(tearBoost * 0.5)],
        [Math.min(60, bx + 22 + tearBoost), gapY + 1],
        [bx + 10, gapY + 6 + Math.round(tearBoost * 0.5)],
        [bx - 10, gapY + 7 + Math.round(tearBoost * 0.5)],
      ],
      '#11041c',
    );
    p.line(Math.max(2, bx - 23 - tearBoost), gapY + 2, bx - 12, gapY - 5 - Math.round(tearBoost * 0.5), '#ff3878', 1, true);
    p.line(bx + 12, gapY - 4 - Math.round(tearBoost * 0.5), Math.min(61, bx + 23 + tearBoost), gapY + 1, '#ff3878', 1, true);
    if (isMove) {
      // 撕裂空间态：额外飞舞紫红与纯白空间碎裂菱片！
      p.setPart(SPRITE_PART.GLOW_FX);
      p.line(Math.max(2, bx - 26), gapY + 4, bx - 16, gapY - 8, '#ffffff', 1, true);
      p.line(bx + 16, gapY - 7, Math.min(61, bx + 27), gapY + 2, '#ffd6e8', 1, true);
      p.px(Math.max(3, bx - 22), gapY - 9 + (f % 2) * 3, '#ff66a3', true);
      p.px(Math.min(60, bx + 24), gapY + 9 - (f % 2) * 3, '#c77dff', true);
      p.setPart(SPRITE_PART.BACK_ACC);
    }
    p.rect(Math.max(2, bx - 23 - Math.round(tearBoost * 0.5)), gapY + 1, 2, 3, '#ff2459');
    p.rect(Math.min(60, bx + 21 + Math.round(tearBoost * 0.5)), gapY, 2, 3, '#ff2459');
    // 左右两枚犀利凝视的竖瞳金红深渊魔眼（瞬移态怒睁！）
    p.setPart(SPRITE_PART.GLOW_FX);
    const drawGapEye = (ex: number, ey: number) => {
      p.ellipse(ex, ey, isMove ? 3.8 : 3.2, isMove ? 2.2 : 1.8, '#ff4769', true);
      p.ellipse(ex, ey, isMove ? 2.6 : 2.2, isMove ? 1.7 : 1.4, '#ffe052', true);
      p.vline(ex, ey - 1, 3, '#170421');
      p.px(ex - 1, ey - 1, '#ffffff', true);
    };
    drawGapEye(bx - 16, gapY + 2);
    drawGapEye(bx + 19, gapY + 1);

    // 宽大威严黑曜鎏金深渊魔王大蝠翼（翼骨镶鎏金，王者风范！）
    drawGothicBatWings64(p, bx - 1, 36 + by, {
      leftSpan: 24,
      rightSpan: 17,
      height: 16,
      flap,
      boneDark: '#170521',
      boneLight: '#ffd459',
      webDark: '#26082e',
      webMain: '#631144',
      webLight: '#b8256a',
      webGlow: '#ff70a6',
    });

    // [2] 瀑布般倾泻至脚踝的纯净雪白银紫魔王长后发（极高明暗对比！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 11 - sway * 0.4, 52 + by],
        [bx + 5 - sway * 0.6, 59 + by],
        [bx - 10 + sway * 0.8, 60 + by],
        [bx - 15 + sway * 0.9, 49 + by],
        [bx - 12 + sway * 0.5, 34 + by],
      ],
      '#7e72a6',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 9 - sway * 0.3, 51 + by],
        [bx - 11 + sway * 0.6, 53 + by],
      ],
      '#e8e4ff',
    );
    p.bezierRibbon([bx - 9, headY + 6], [bx - 12 + sway * 0.6, 40 + by], [bx - 12 + sway * 0.9, 56 + by], 2.4, 0.8, '#ffffff');

    // [3] 1×2 修长魔姬玉腿 + 黑金高跟战靴（瞬移裂界态从容凌空悬步，尽显跨界王威！）
    p.setPart(SPRITE_PART.LEGS);
    const stride = isMove ? 0 : Math.round(pose.stride * 3.4);
    const bLift = isMove ? -1 : pose.stride > 0.25 ? -2 : 0;
    const fLift = isMove ? -2 : pose.stride < -0.25 ? -2 : 0;
    // 左后长腿 + 黑金过膝高跟靴
    p.rect(bx - 6 - stride, 48 + by + bLift, 4, 9, '#311a47');
    p.rect(bx - 6 - stride, 56 + bLift, 4, 8, '#1a0a26');
    p.poly([[bx - 7 - stride, 62 + bLift], [bx - 1 - stride, 62 + bLift], [bx + 1 - stride, 65 + bLift], [bx - 7 - stride, 65 + bLift]], '#6e0d2a');
    p.hline(bx - 6 - stride, 56 + bLift, 4, '#ffd452');
    // 右前修长白皙长腿（高开衩露腿）+ 黑红鎏金长靴
    p.rect(bx + 2 + stride, 46 + by + fLift, 4, 11, '#fff0ec');
    p.vline(bx + 2 + stride, 46 + by + fLift, 11, '#e3b5bc');
    p.rect(bx + 2 + stride, 57 + fLift, 4, 7, '#260d33');
    p.hline(bx + 2 + stride, 57 + fLift, 4, '#ffd966');
    p.poly([[bx + 2 + stride, 63 + fLift], [bx + 7 + stride, 63 + fLift], [bx + 9 + stride, 66 + fLift], [bx + 2 + stride, 66 + fLift]], '#c91642');
    p.px(bx + 6 + stride, 64 + fLift, '#ffe885');

    // [4] 左后臂：暗紫鎏金肩甲泡泡袖 + 2px 娇美玉臂优雅托起亮金白芯紫红隙间魔焰（瞬移态高扬撕裂虚空！）
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 31.5 + by, '#1f0b2e', '#4f1e6b', '#ffd452', 'left');
    const lHandX = isMove ? bx - 16 : bx - 15;
    const lHandY = isMove ? 31 + by : 36 + by;
    drawSoftChibiArm64(p, bx - 8, 33 + by, lHandX, lHandY, '#fff2ee', '#e3b5bc');
    p.rect(lHandX - 2, lHandY - 1, 3, 2, '#fff2ee');
    p.setPart(SPRITE_PART.GLOW_FX);
    const orbR = isMove ? 3.5 : 2.6;
    p.ellipse(lHandX - 3, lHandY - 4, orbR, orbR, '#ff2666', true);
    p.ellipse(lHandX - 3, lHandY - 4.5, orbR * 0.55, orbR * 0.55, '#ffe885', true);
    p.px(lHandX - 3, lHandY - 5, '#ffffff', true);
    if (isMove) {
      // 裂界指尖放射紫白空间裂纹！
      p.line(lHandX - 6, lHandY - 9, lHandX, lHandY + 1, '#ffd4e6', 1, true);
    }

    // [5] 华贵「黑曜丝绒绛红 · 立体柔褶高开衩曳地魔王长礼服」（丝绒暗褶 + 温润古金渐变滚边！）
    p.setPart(SPRITE_PART.SKIRT);
    const skSway = Math.round(-pose.leanX * 0.5 + sway * 0.85);
    // 曳地黑曜暗紫大长袍外裙摆（左侧曳地长拖尾 + 右侧优雅高开衩露出白皙长腿！）
    p.poly(
      [
        [bx - 6, 38 + by],
        [bx + 6, 38 + by],
        [bx + 12 + skSway, 55 + by],
        [bx + 8 + skSway, 53 + by],
        [bx + 2 + skSway, 46 + by], // 高开衩切口！
        [bx - 1 + skSway, 59 + by],
        [bx - 13 + skSway, 61 + by],
        [bx - 17 + skSway, 56 + by],
      ],
      '#1b0826',
    );
    // 华丽深绛红丝绒内衬长裙面（四阶立体垂坠明暗！）
    p.poly(
      [
        [bx - 5, 38 + by],
        [bx + 5, 38 + by],
        [bx + 9 + skSway, 52 + by],
        [bx + 2 + skSway, 45 + by],
        [bx - 2 + skSway, 57 + by],
        [bx - 11 + skSway, 58 + by],
        [bx - 13 + skSway, 53 + by],
      ],
      '#850f33',
    );
    p.poly(
      [
        [bx - 4, 39 + by],
        [bx + 3, 39 + by],
        [bx - 1 + skSway, 54 + by],
        [bx - 9 + skSway, 55 + by],
      ],
      '#c21b4a',
    );
    // 丝绒垂坠暗褶沟 + 柔润绯红绸光（彻底告别平面多边形感！）
    p.bezierRibbon([bx - 3, 40 + by], [bx - 6 + skSway * 0.5, 48 + by], [bx - 10 + skSway, 57 + by], 1.8, 1.0, '#630926');
    p.bezierRibbon([bx + 1, 40 + by], [bx - 1 + skSway * 0.5, 49 + by], [bx - 3 + skSway, 57 + by], 1.5, 0.9, '#6e0b2a');
    p.bezierRibbon([bx - 1, 40 + by], [bx - 4 + skSway * 0.5, 48 + by], [bx - 6 + skSway, 55 + by], 2.0, 0.8, '#e8386a');
    p.bezierRibbon([bx - 5, 41 + by], [bx - 9 + skSway * 0.5, 49 + by], [bx - 12 + skSway, 54 + by], 1.4, 0.6, '#f25785');
    // 温润古金渐变精致滚边（暗金底 + 亮金转折点高光，优雅不生硬！）
    p.line(bx - 15 + skSway, 56 + by, bx - 12 + skSway, 60 + by, '#ba8624', 1);
    p.line(bx - 12 + skSway, 60 + by, bx - 1 + skSway, 58 + by, '#d9a436', 1);
    p.line(bx - 1 + skSway, 58 + by, bx + 2 + skSway, 46 + by, '#f0c452', 1);
    p.line(bx + 2 + skSway, 46 + by, bx + 11 + skSway, 54 + by, '#c9932c', 1);
    p.px(bx - 12 + skSway, 60 + by, '#fff0a6');
    p.px(bx + 2 + skSway, 46 + by, '#fff5bd');
    p.px(bx - 1 + skSway, 58 + by, '#ffe885');

    // [6] 修长黑金魔姬束腰礼服上衣 + 高贵紫红立领 + 璀璨深渊红宝石胸饰！
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 29 + by], [bx + 5, 29 + by], [bx + 6, 38 + by], [bx - 5, 38 + by]], '#190826');
    p.poly([[bx - 4, 29 + by], [bx + 4, 29 + by], [bx + 4, 37 + by], [bx - 4, 37 + by]], '#36124d');
    // 魔王金色胸甲饰线与高领
    p.line(bx - 5, 29 + by, bx + 1, 33 + by, '#ffd452', 1);
    p.line(bx + 5, 29 + by, bx + 1, 33 + by, '#ffd452', 1);
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.hline(bx - 5, 38 + by, 11, '#ffd452');
    p.rect(bx - 1, 37 + by, 3, 3, '#ff265e');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx + 1, 33 + by, 1.8, 1.8, '#ff245c', true);
    p.px(bx + 1, 32 + by, '#fff5a6', true);

    // [7] 魅惑尊贵魔王颜 + 炽金猩红 4×4 大眼 + 纯净雪白银紫长发 + 漆黑金环外掠大魔角 + 悬浮红金魔冠印！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#ffffff',
      skinMain: '#fff2ef',
      skinShade: '#e3b5bc',
      lashColor: '#240829',
      irisDark: '#9e102c',
      irisMid: '#f2304d',
      irisGlow: '#ffe466',
      blushColor: '#ff8fb3',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#786ca3',
      dark: '#afa6d4',
      mid: '#e0dcfa',
      light: '#f7f5ff',
      spec: '#ffffff',
      leftLockLen: 14,
      rightLockLen: 12,
      fluff: 2,
      sway,
    });
    // 威严大幅外掠「漆黑鎏金环大魔角」+ 额顶悬浮深渊红金魔冠微印！
    p.setPart(SPRITE_PART.HEADWEAR);
    // 左大弯角
    p.bezierRibbon([bx - 6, headY - 8], [bx - 14, headY - 11], [bx - 16, headY - 17], 3.4, 0.9, '#1f0721');
    p.bezierRibbon([bx - 6, headY - 9], [bx - 13, headY - 12], [bx - 15, headY - 16], 1.4, 0.5, '#ff3366');
    p.line(bx - 11, headY - 12, bx - 10, headY - 9, '#ffd659', 1); // 鎏金角环！
    p.px(bx - 16, headY - 17, '#ffe885', true);
    // 右大弯角
    p.bezierRibbon([bx + 6, headY - 8], [bx + 14, headY - 11], [bx + 16, headY - 17], 3.4, 0.9, '#1f0721');
    p.bezierRibbon([bx + 6, headY - 9], [bx + 13, headY - 12], [bx + 15, headY - 16], 1.4, 0.5, '#ff3366');
    p.line(bx + 11, headY - 12, bx + 10, headY - 9, '#ffd659', 1); // 鎏金角环！
    p.px(bx + 16, headY - 17, '#ffe885', true);
    // 悬浮深渊菱形王冠微印
    p.setPart(SPRITE_PART.GLOW_FX);
    p.poly([[bx, headY - 16], [bx + 2, headY - 13], [bx, headY - 11], [bx - 2, headY - 13]], '#ffd659', true);
    p.px(bx, headY - 13, '#ff265e', true);

    // [8] 右前臂黑金泡泡袖 + 2px 纤长玉臂真握持「黑曜鎏金深渊月镰」！
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 31.5 + by, '#1f0b2e', '#4f1e6b', '#ffd452', 'right');
    const handX = isAtk && (f === 1 || f === 2) ? bx + 14 : isAtk && f === 0 ? bx + 13 : bx + 12;
    const handY = isAtk && f === 0 ? 29 + by : 36 + by - Math.round(pose.armAction * 2);
    drawSoftChibiArm64(p, bx + 8, 34 + by, handX, handY, '#fff2ef', '#e3b5bc');

    // 彻底升级神器级「黑曜雕花玄铁长杆 + 鎏金魔冠镰顶 + 巨幅深弯月血金巨镰刃」
    p.setPart(SPRITE_PART.WEAPON);
    if (isAtk && f === 0) {
      // 蓄力帧：向右上方高昂拉弓举镰，镰刃朝右外上方大张蓄势，100% 避开雪白秀发与面容！
      const topX = Math.min(54, handX + 10);
      const topY = 8 + by;
      const buttX = handX - 6;
      const buttY = handY + 13;
      p.line(buttX, buttY, topX, topY, '#261133', 3);
      p.line(buttX + 1, buttY - 1, topX, topY, '#8b57b0', 1);
      p.px(Math.round((handX + topX) * 0.5), Math.round((handY + topY) * 0.5), '#ffd659');
      p.ellipse(topX, topY, 2.4, 2.4, '#ffd659');
      p.px(topX, topY, '#ff265e', true);
      p.bezierRibbon([topX, topY], [Math.min(60, topX + 9), topY + 2], [Math.min(61, topX + 9), topY + 16], 4.6, 0.9, '#b80f3c');
      p.bezierRibbon([topX + 1, topY + 1], [Math.min(59, topX + 8), topY + 3], [Math.min(60, topX + 8), topY + 15], 2.2, 0.5, '#ff4d7a', true);
    } else if (isAtk && (f === 1 || f === 2)) {
      // 高速挥斩撕裂虚空：黑曜玄铁长杆精准过掌 + 巨大深弯月猩红镰刃紧贴三色虚空斩弧！
      const tipX = Math.min(57, handX + 17);
      const tipY = handY - 12;
      const buttX = handX - 9;
      const buttY = handY + 7;
      p.line(buttX, buttY, tipX, tipY, '#261133', 3);
      p.line(buttX + 1, buttY - 1, tipX, tipY, '#9966bd', 1);
      p.px(buttX, buttY, '#ffd659');
      p.ellipse(tipX, tipY, 2.5, 2.5, '#ffd659');
      p.px(tipX, tipY, '#ff265e', true);
      p.bezierRibbon([tipX, tipY], [tipX + 3, tipY + 13], [tipX - 9, tipY + 23], 4.8, 0.9, '#b30d38');
      p.bezierRibbon([tipX, tipY + 1], [tipX + 2, tipY + 13], [tipX - 8, tipY + 22], 2.2, 0.5, '#ff5983', true);
      drawSlashArc64(p, bx + 15, 33 + by, 21, 19, -1.2, 0.95, '#7a17e6', '#ff245e', '#ffe885');
    } else {
      // 尊贵斜立黑曜鎏金深渊月镰（下端立于右靴外侧地面，完全不挡白皙开衩长腿与右靴！）
      const topX = handX + 4;
      const topY = 9 + by;
      const botX = handX - 1;
      const botY = 63;
      p.line(botX, botY, topX, topY, '#220e30', 3);
      p.line(botX + 1, botY - 1, topX, topY, '#754896', 1);
      // 杆身鎏金螺旋饰环 + 矛尾金尖
      for (const t of [0.18, 0.42, 0.72, 0.88]) {
        const rx = Math.round(botX + (topX - botX) * t);
        const ry = Math.round(botY + (topY - botY) * t);
        p.hline(rx - 1, ry, 3, '#ffd659');
      }
      p.poly([[botX - 2, botY - 1], [botX + 2, botY - 1], [botX, botY + 3]], '#ffd659');
      // 华丽恶魔展翼金冠镰顶 + 燃血核心红宝石
      p.poly([[topX - 4, topY + 2], [topX, topY - 3], [topX + 4, topY + 2], [topX, topY + 4]], '#d99e26');
      p.poly([[topX - 2, topY + 1], [topX, topY - 2], [topX + 2, topY + 1]], '#ffe885');
      p.px(topX, topY + 1, '#ff265e', true);
      // 绝世巨大深弯月血金死神镰刃（弧长饱满、刀背黑金、刀锋锐利炽红发光！）
      p.bezierRibbon([topX + 1, topY], [topX + 13, topY + 1], [Math.min(61, topX + 17), topY + 16], 5.0, 0.9, '#240926');
      p.bezierRibbon([topX + 2, topY], [topX + 13, topY + 2], [Math.min(60, topX + 16), topY + 15], 3.2, 0.7, '#d91644', true);
      p.bezierRibbon([topX + 3, topY + 1], [topX + 13, topY + 3], [Math.min(60, topX + 16), topY + 15], 1.3, 0.4, '#ffdfe9', true);
      // 刀背鎏金雕纹弧线
      p.bezierRibbon([topX + 1, topY - 1], [topX + 11, topY], [Math.min(58, topX + 14), topY + 7], 1.1, 0.5, '#ffd659');
    }
    drawWrappedHand(p, handX, handY, '#fff2ef', '#ffffff', '#e3b5bc');
  },
};

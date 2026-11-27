/**
 * 8. 神使（T4-B · 1×2 终极飞行大天使 · 返魂苏生 + 施法）64×72 HD 像素精灵绘谱
 * 高挑炽光六翼大天使 · 铂银瀑布长发 + 真镂空星光金环 + 鎏金胸甲圣袍 + 锐锋天火圣剑 + 专属 4 帧六翼振翅飞行！
 */

import {
  drawCleanAnimeHair64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSlashArc64,
  drawSoftChibiArm64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import {
  drawHollowGoldRing64,
  drawSeraphWingSide64,
  drawWrappedHand,
  HD_BASE,
} from './helpers';

export const creatureHakureiSeraphSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0e1430',
  backdropBottom: '#261f4a',
  backdropGlow: '#fff0a6',
  avatarCrop: { x: 13, y: 2, size: 36 },
  portraitCrop: { x: 2, y: 1, w: 60, h: 68 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx = isAtk && (f === 1 || f === 2) ? 25 : isMove ? 31 : Math.round(29 + pose.leanX * 0.85);
    const by = isMove
      ? [-2, 1, -1, -1][f % 4]
      : Math.round(Math.sin(phase) * 1.6 + pose.breathY * 1.1 - pose.stepLift);
    const sway = isMove ? 2.6 : pose.flutter * 1.6;
    // 飞行时六翼交替强劲大振幅振翅扑展！
    const mainFlap = isMove ? [-8, 10, 4, -5][f % 4] : Math.round(Math.sin(phase) * 2.8);
    const midFlap = isMove ? [-5, 8, 3, -3][f % 4] : Math.round(Math.cos(phase) * 2.3);
    // 1×2 高挑神使御姐比例（为头顶真镂空圣环留出充裕顶边呼吸感，零裁切！）
    const headY = 20 + by;

    // [1] 宏伟层次雕刻感「六翼炽光大天使羽翼」（加重天青/古金羽影对比，与雪白圣袍彻底拉出立体纵深！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const upperColors = { deep: '#4c75bd', mid: '#c4e4ff', light: '#ffffff', tip: '#a6f2ff', gold: '#ffe680' };
    const midColors = { deep: '#9e7232', mid: '#f2d58f', light: '#fff7d4', tip: '#ffffff', gold: '#ffdf66' };
    const lowerColors = { deep: '#5570a8', mid: '#bdd6fa', light: '#edf6ff', tip: '#ffe885' };

    // 下翼（轻盈舒展）
    drawSeraphWingSide64(p, bx - 3, 42 + by, -1, 17, 10, -Math.round(midFlap * 0.6), lowerColors, false);
    drawSeraphWingSide64(p, bx + 3, 42 + by, 1, 13, 9, -Math.round(midFlap * 0.6), lowerColors, false);
    // 中翼（暖金珍珠华美主羽）
    drawSeraphWingSide64(p, bx - 4, 35 + by, -1, isMove ? 24 : 22, 14, midFlap, midColors, true);
    drawSeraphWingSide64(p, bx + 4, 35 + by, 1, isMove ? 19 : 17, 13, midFlap, midColors, true);
    // 上翼（最高耸宏大的洁白冰青圣羽！）
    drawSeraphWingSide64(p, bx - 4, 28 + by, -1, isMove ? 25 : 23, 18, mainFlap, upperColors, true);
    drawSeraphWingSide64(p, bx + 4, 28 + by, 1, isMove ? 20 : 18, 17, mainFlap, upperColors, true);

    // 飞行全力下拍帧（f === 1）：洒出金白圣羽微光风弧！
    if (isMove && f === 1) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.bezierRibbon([bx - 24, 35 + by], [bx - 26, 44 + by], [bx - 17, 50 + by], 1.8, 0.5, '#ffe880', true);
      p.bezierRibbon([bx + 19, 35 + by], [bx + 21, 43 + by], [bx + 14, 49 + by], 1.6, 0.5, '#9ef0ff', true);
      p.px(bx - 14, 53 + by, '#ffffff', true);
      p.px(bx + 12, 51 + by, '#ffe880', true);
    }

    // 飘逸天青鎏金「炽天使羽衣天带」
    p.setPart(SPRITE_PART.BACK_ACC);
    p.bezierRibbon([bx - 7, 35 + by], [bx - 18, 30 + by + sway], [Math.max(4, bx - 21), 41 + by + sway], 2.8, 1.1, '#47c8ff', true);
    p.bezierRibbon([bx - 7, 34 + by], [bx - 17, 29 + by + sway], [Math.max(5, bx - 20), 40 + by + sway], 1.1, 0.5, '#ffe885', true);
    p.bezierRibbon([bx + 7, 35 + by], [bx + 16, 30 + by - sway * 0.7], [Math.min(59, bx + 19), 40 + by - sway], 2.4, 1.0, '#47c8ff', true);
    p.bezierRibbon([bx + 7, 34 + by], [bx + 15, 29 + by - sway * 0.7], [Math.min(58, bx + 18), 39 + by - sway], 1.0, 0.5, '#ffe885', true);

    // [2] 瀑布般倾泻至脚踝的丝滑铂金银白长后发
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 11 - sway * 0.4, 52 + by],
        [bx + 5 - sway * 0.6, 59 + by],
        [bx - 10 + sway * 0.8, 60 + by],
        [bx - 14 + sway * 0.8, 50 + by],
      ],
      '#7e93bd',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 9 - sway * 0.3, 51 + by],
        [bx - 11 + sway * 0.6, 53 + by],
      ],
      '#e8f2ff',
    );
    p.bezierRibbon([bx - 8, headY + 6], [bx - 11 + sway * 0.5, 41 + by], [bx - 11 + sway * 0.8, 55 + by], 2.2, 0.8, '#ffffff');

    // [3] 1×2 悬空圣洁玉腿与修长 3/4 鎏金尖头圣靴（优雅斜错，飞行时微屈后收！）
    p.setPart(SPRITE_PART.LEGS);
    if (isMove) {
      p.line(bx - 4, 52 + by, bx - 8, 60 + by, '#ffe8dc', 3);
      p.poly([[bx - 10, 59 + by], [bx - 5, 59 + by], [bx - 4, 62 + by], [bx - 10, 62 + by]], '#c78c20');
      p.hline(bx - 9, 59 + by, 4, '#fff8cc');
      p.line(bx + 3, 52 + by, bx, 62 + by, '#fff4ed', 3);
      p.poly([[bx - 2, 61 + by], [bx + 3, 61 + by], [bx + 5, 64 + by], [bx - 2, 64 + by]], '#f2c449');
      p.hline(bx - 1, 61 + by, 4, '#ffffff');
    } else {
      const stride = Math.round(pose.stride * 2.8);
      p.rect(bx - 5 - stride, 51 + by, 3, 10, '#ecd3c7');
      p.poly([[bx - 6 - stride, 60 + by], [bx - 2 - stride, 60 + by], [bx - stride, 64 + by], [bx - 6 - stride, 64 + by]], '#bf851d');
      p.hline(bx - 5 - stride, 60 + by, 4, '#fff5b8');
      p.rect(bx + 2 + stride, 51 + by, 3, 11, '#fff2eb');
      p.poly([[bx + 2 + stride, 61 + by], [bx + 6 + stride, 61 + by], [bx + 8 + stride, 65 + by], [bx + 2 + stride, 65 + by]], '#f2c449');
      p.hline(bx + 3 + stride, 61 + by, 4, '#ffffff');
    }

    // [4] 左后臂：纯白鎏金飘逸羽袖 + 2px 娇美玉臂轻托圣洁复苏金球
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 32.5 + by, '#c7d9f2', '#ffffff', '#ffe066', 'left');
    drawSoftChibiArm64(p, bx - 8, 34 + by, bx - 14, 38 + by, '#fff6f0', '#e6b8a8');
    p.rect(bx - 16, 36 + by, 3, 2, '#fff6f0');
    p.setPart(SPRITE_PART.GLOW_FX);
    const healOrbY = 32 + by + Math.round(Math.sin(phase) * 1.6);
    p.ellipse(bx - 17, healOrbY, 2.8, 2.8, '#ffe066', true);
    p.ellipse(bx - 17, healOrbY - 0.5, 1.5, 1.5, '#ffffff', true);
    p.px(bx - 17, healOrbY - 4, '#9ef0ff', true);

    // [5] 圣洁高贵「纯白鎏金大天使曳地长礼袍」（柔美垂坠衣褶 + 中央宝蓝金纹圣带 + 鎏金下摆滚边！）
    p.setPart(SPRITE_PART.SKIRT);
    const skSway = Math.round(-pose.leanX * 0.45 + sway * 0.8);
    p.poly(
      [
        [bx - 6, 39 + by],
        [bx + 6, 39 + by],
        [bx + 13 + skSway, 58 + by],
        [bx + 7 + skSway, 56 + by],
        [bx + 2 + skSway, 48 + by],
        [bx - 1 + skSway, 60 + by],
        [bx - 13 + skSway, 61 + by],
        [bx - 16 + skSway, 56 + by],
      ],
      '#a8bddb',
    );
    p.poly(
      [
        [bx - 5, 39 + by],
        [bx + 5, 39 + by],
        [bx + 11 + skSway, 56 + by],
        [bx + 2 + skSway, 47 + by],
        [bx - 2 + skSway, 59 + by],
        [bx - 11 + skSway, 59 + by],
        [bx - 13 + skSway, 55 + by],
      ],
      '#f2f7ff',
    );
    p.poly(
      [
        [bx - 4, 40 + by],
        [bx + 3, 40 + by],
        [bx - 1 + skSway, 56 + by],
        [bx - 9 + skSway, 57 + by],
      ],
      '#ffffff',
    );
    p.bezierRibbon([bx - 3, 41 + by], [bx - 6 + skSway * 0.5, 50 + by], [bx - 9 + skSway, 58 + by], 1.6, 0.9, '#b8cde8');
    // 中央皇家天青鎏金圣纹垂带
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly(
      [
        [bx - 2, 39 + by],
        [bx + 3, 39 + by],
        [bx + 4 + skSway, 57 + by],
        [bx - 1 + skSway, 57 + by],
      ],
      '#2464cf',
    );
    p.vline(bx + 1 + Math.round(skSway * 0.5), 40 + by, 16, '#ffe880', true);
    p.line(bx - 15 + skSway, 56 + by, bx - 12 + skSway, 60 + by, '#d9a432', 1);
    p.line(bx - 12 + skSway, 60 + by, bx - 1 + skSway, 59 + by, '#ffe478', 1);
    p.line(bx + 2 + skSway, 48 + by, bx + 12 + skSway, 57 + by, '#f2c852', 1);

    // [6] 精雕黄金羽纹大天使胸甲 + 天青核心宝钻 + 黄金束腰
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 30 + by], [bx + 5, 30 + by], [bx + 6, 39 + by], [bx - 5, 39 + by]], '#bf841d');
    p.poly([[bx - 4, 30 + by], [bx + 4, 30 + by], [bx + 4, 38 + by], [bx - 4, 38 + by]], '#f7cb4d');
    p.hline(bx - 3, 31 + by, 7, '#fff6c2');
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.hline(bx - 5, 39 + by, 11, '#ffe478');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx + 1, 34 + by, 2.0, 2.0, '#78eeff', true);
    p.px(bx + 1, 33 + by, '#ffffff', true);

    // [7] 圣洁绝美神使颜 + 苍穹蔚蓝 4×4 宝石大眼 + 铂银大集群萌发 + 黄金天使星冠 + 真镂空璀璨炽金圣环！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#ffffff',
      skinMain: '#fff2ea',
      skinShade: '#e3b8ad',
      lashColor: '#1f2347',
      irisDark: '#1b55c7',
      irisMid: '#4296ff',
      irisGlow: '#b5f5ff',
      blushColor: '#ff9cb8',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#788cb8',
      dark: '#acc0e3',
      mid: '#dce8ff',
      light: '#f5f9ff',
      spec: '#ffffff',
      leftLockLen: 14,
      rightLockLen: 12,
      fluff: 2,
      sway,
    });
    // 黄金天使星冠
    p.setPart(SPRITE_PART.HEADWEAR);
    p.hline(bx - 6, headY - 8, 12, '#f5c749', true);
    p.poly([[bx - 2, headY - 8], [bx, headY - 11], [bx + 2, headY - 8]], '#fff6c2', true);
    p.px(bx, headY - 9, '#8cf0ff', true);
    // 真·镂空璀璨炽金星芒圣环（与发冠留出清晰 2~3px 悬浮净空，环心 100% 透明！）
    p.setPart(SPRITE_PART.GLOW_FX);
    const haloY = Math.max(4, headY - 15);
    drawHollowGoldRing64(p, bx, haloY, 8.2, 2.0, 0.56, '#e6a825', '#ffe466', '#ffffff', true);
    p.px(bx - 9, haloY, '#9ef0ff', true);
    p.px(bx + 9, haloY, '#9ef0ff', true);

    // [8] 右前臂白金羽袖 + 2px 纤长玉臂高擎「锐锋白金天火大天使圣剑」（精雕收尖双刃剑脊 + 跃动炽焰舌，告别橘色冰棒！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 32.5 + by, '#c7d9f2', '#ffffff', '#ffe066', 'right');

    if (isAtk && f === 0) {
      // 蓄力高举锐锋天火圣剑引落炽光！
      const handX = bx + 11;
      const handY = 27 + by;
      drawSoftChibiArm64(p, bx + 8, 34 + by, handX, handY, '#fff2ea', '#e3b8ad');
      p.setPart(SPRITE_PART.WEAPON);
      p.vline(handX, handY + 1, 5, '#b87d1a');
      p.poly([[handX - 5, handY - 3], [handX, handY - 1], [handX + 6, handY - 3], [handX + 4, handY], [handX - 3, handY]], '#ffe678', true);
      // 锐利收尖天火大剑刃
      const tipX = handX + 2;
      const tipY = 5 + by;
      p.poly([[handX - 2, handY - 2], [handX + 3, handY - 2], [tipX + 2, tipY + 6], [tipX, tipY], [tipX - 2, tipY + 6]], '#ff7b24', true);
      p.poly([[handX - 1, handY - 2], [handX + 2, handY - 2], [tipX + 1, tipY + 5], [tipX, tipY + 1], [tipX - 1, tipY + 5]], '#ffe878', true);
      p.line(handX, handY - 2, tipX, tipY + 1, '#ffffff', 1, true);
      drawWrappedHand(p, handX, handY, '#fff2ea', '#ffffff', '#e3b8ad');
    } else if (isAtk && (f === 1 || f === 2)) {
      // 炽光天火大满月重斩！
      const handX = bx + 13;
      const handY = 36 + by;
      drawSoftChibiArm64(p, bx + 8, 35 + by, handX, handY, '#fff2ea', '#e3b8ad');
      p.setPart(SPRITE_PART.WEAPON);
      const tipX = Math.min(60, handX + 20);
      const tipY = handY - 5;
      p.line(handX - 4, handY + 1, handX, handY, '#b87d1a', 2);
      p.vline(handX + 2, handY - 5, 10, '#ffe880', true);
      p.poly(
        [
          [handX + 2, handY - 3],
          [tipX - 5, tipY - 1],
          [tipX, tipY],
          [tipX - 5, tipY + 3],
          [handX + 2, handY + 3],
        ],
        '#ff7721',
        true,
      );
      p.poly(
        [
          [handX + 3, handY - 2],
          [tipX - 4, tipY],
          [tipX, tipY],
          [tipX - 4, tipY + 2],
          [handX + 3, handY + 2],
        ],
        '#ffe878',
        true,
      );
      p.line(handX + 3, handY, tipX, tipY, '#ffffff', 1, true);
      drawWrappedHand(p, handX, handY, '#fff2ea', '#ffffff', '#e3b8ad');
      drawSlashArc64(p, bx + 16, 34 + by, 21, 20, -1.25, 0.95, '#ff7b24', '#ffe878', '#ffffff');
    } else {
      // 圣威凛凛斜擎锐利收尖「白金天火大天使圣剑」（精雕收尖剑身 + 跃动火焰舌 + 展翼金护手！）
      const handX = bx + 12;
      const handY = 38 + by - Math.round(pose.armAction * 2);
      drawSoftChibiArm64(p, bx + 8, 35 + by, handX, handY, '#fff2ea', '#e3b8ad');
      p.setPart(SPRITE_PART.WEAPON);
      // 圣剑金柄与展开的天使双翼剑格
      p.line(handX - 1, handY + 6, handX + 1, handY - 1, '#b87d1a', 2);
      p.ellipse(handX - 1, handY + 7, 1.6, 1.6, '#ffe885', true);
      p.poly(
        [
          [handX - 5, handY - 4],
          [handX + 1, handY - 1],
          [handX + 8, handY - 4],
          [handX + 5, handY],
          [handX - 2, handY],
        ],
        '#e6ab2e',
      );
      p.line(handX - 4, handY - 3, handX + 1, handY - 1, '#fff8cc', 1, true);
      p.line(handX + 1, handY - 1, handX + 7, handY - 3, '#fff8cc', 1, true);
      p.px(handX + 1, handY - 1, '#78eeff', true);
      // 锐利棱面收尖大剑刃（剑根宽、剑尖锋利收尖，带炽橙火舌缠绕边缘！）
      const tipX = Math.min(58, handX + 6);
      const tipY = Math.max(7, handY - 27);
      // 剑身两侧跳跃的炽橙天火火舌
      p.setPart(SPRITE_PART.GLOW_FX);
      const flWave = Math.round(Math.sin(phase * 2) * 1.2);
      p.poly([[handX, handY - 6], [handX - 2, handY - 13 + flWave], [handX + 2, handY - 15]], '#ff661a', true);
      p.poly([[handX + 4, handY - 9], [handX + 8, handY - 16 - flWave], [handX + 5, handY - 21]], '#ff7b24', true);
      p.px(tipX + 2, tipY + 4 + flWave, '#ffe880', true);
      p.px(tipX - 3, tipY + 9 - flWave, '#9ef0ff', true);
      // 主剑刃：锋利菱形收尖白金圣剑体
      p.setPart(SPRITE_PART.WEAPON);
      p.poly(
        [
          [handX - 1, handY - 2],
          [handX + 4, handY - 2],
          [tipX + 2, tipY + 7],
          [tipX, tipY],
          [tipX - 2, tipY + 7],
        ],
        '#ff8c2b',
        true,
      );
      p.poly(
        [
          [handX, handY - 2],
          [handX + 3, handY - 2],
          [tipX + 1, tipY + 6],
          [tipX, tipY + 1],
          [tipX - 1, tipY + 6],
        ],
        '#fff099',
        true,
      );
      p.line(handX + 1, handY - 2, tipX, tipY + 1, '#ffffff', 1, true);
      drawWrappedHand(p, handX, handY, '#fff2ea', '#ffffff', '#e3b8ad');
    }
  },
};

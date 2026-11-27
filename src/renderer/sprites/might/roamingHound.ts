/**
 * 5. 巡回猎犬（武艺旧都 T2-B · 1×1 · 陆地超长机动 + 不受反击 + 巡回突袭折返）
 * 对标梦境兽骨骼精度重构的旧地狱「赤焰奔雷猎妖狼犬」：
 * 深胸收腰猎豹爆发体态 + 4帧完整腾跃屈节四肢 + 白玉裂地狼爪 + 青铜尖刺鬼铁断链项圈 +
 * 俊厉黑红恶狼首与寒光獠牙 + 烈焰大狼尾 + 疾扑三道炽橙爪光！
 */

import { drawSlashArc64, SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawIronChain64, drawSparkStar64, HD_MIGHT_BASE } from './helpers';

export const roamingHoundSpec: SpriteRigSpec = {
  ...HD_MIGHT_BASE,
  backdropTop: '#1c0c08',
  backdropBottom: '#421c10',
  backdropGlow: '#ff7b29',
  avatarCrop: { x: 22, y: 12, size: 34 },
  portraitCrop: { x: 2, y: 8, w: 60, h: 58 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const fl = Math.round(pose.flutter * 2.2);

    // 精确骨骼关键帧（深胸收腰四足猎犬动态体系，彻底告别直木棍腿！）
    let hipX = 18;
    let hipY = 47;
    let chestX = 33;
    let chestY = 42;
    let headX = 41;
    let headY = 29;
    let farHind: [number, number] = [10, 63];
    let nearHind: [number, number] = [17, 65];
    let farFore: [number, number] = [36, 63];
    let nearForeKnee: [number, number] = [41, 52];
    let nearFore: [number, number] = [44, 63];
    let jawOpen = 1;
    let clawFlash = false;

    if (isAtk) {
      if (f === 0) {
        // 蓄力伏低扑跃前摇
        hipX = 16; hipY = 50; chestX = 30; chestY = 47; headX = 39; headY = 36;
        farHind = [9, 63]; nearHind = [16, 65];
        farFore = [37, 63]; nearForeKnee = [36, 56]; nearFore = [43, 64];
        jawOpen = 3;
      } else if (f === 1 || f === 2) {
        // 凌空腾扑咬击 + 利爪前挥！
        hipX = 15; hipY = 46; chestX = 30; chestY = 38; headX = 40; headY = 26;
        farHind = [7, 61]; nearHind = [13, 64];
        farFore = [41, 47]; nearForeKnee = [40, 40]; nearFore = [48, 39];
        jawOpen = 5;
        clawFlash = true;
      } else {
        hipX = 18; hipY = 48; chestX = 33; chestY = 43; headX = 41; headY = 30;
        farHind = [11, 63]; nearHind = [18, 65];
        farFore = [36, 63]; nearForeKnee = [40, 53]; nearFore = [44, 62];
      }
    } else if (isMove) {
      // 4 帧完整猎豹极速狂奔（舒展腾空 → 前爪抓地 → 团身折叠 → 后腿爆蹬！）
      if (f === 0) {
        hipX = 16; hipY = 46; chestX = 33; chestY = 40; headX = 43; headY = 29;
        farHind = [6, 59]; nearHind = [11, 61];
        farFore = [45, 55]; nearForeKnee = [42, 46]; nearFore = [51, 52];
        jawOpen = 2;
      } else if (f === 1) {
        hipX = 19; hipY = 42; chestX = 34; chestY = 38; headX = 43; headY = 27;
        farHind = [12, 57]; nearHind = [17, 59];
        farFore = [39, 57]; nearForeKnee = [41, 48]; nearFore = [45, 58];
        jawOpen = 2;
      } else if (f === 2) {
        hipX = 21; hipY = 47; chestX = 33; chestY = 42; headX = 42; headY = 31;
        farHind = [20, 62]; nearHind = [26, 63];
        farFore = [31, 62]; nearForeKnee = [35, 53]; nearFore = [36, 63];
        jawOpen = 1;
      } else {
        hipX = 17; hipY = 44; chestX = 33; chestY = 39; headX = 43; headY = 28;
        farHind = [8, 61]; nearHind = [14, 63];
        farFore = [43, 52]; nearForeKnee = [41, 44]; nearFore = [49, 49];
        jawOpen = 2;
      }
    } else if (isHit) {
      hipX = 15; hipY = 50; chestX = 28; chestY = 46; headX = 36; headY = 34;
      farHind = [8, 63]; nearHind = [15, 65];
      farFore = [34, 63]; nearForeKnee = [35, 54]; nearFore = [39, 62];
      jawOpen = 3;
    } else {
      const by = Math.round(pose.breathY * 1.2);
      hipY = 47 + by;
      chestY = 42 + by;
      headY = 29 + by;
      nearForeKnee = [40, 52 + by];
      nearFore = [43, 64];
    }

    const drawWolfPaw = (px: number, py: number, isNear: boolean) => {
      p.poly(
        [
          [px - 2, py - 2],
          [px + 3, py - 2],
          [px + 5, py + 1],
          [px - 2, py + 1],
        ],
        isNear ? '#4a1b12' : '#2b100b',
      );
      p.hline(px - 1, py - 1, 4, isNear ? '#a64222' : '#632414');
      p.px(px + 4, py, isNear ? '#fff5d6' : '#d4c2a3');
      p.px(px + 2, py + 1, isNear ? '#ffe8b8' : '#b8a488');
    };

    // [1] 蓬松炽燃流火大狼尾（多簇蓬松焰毛，黑红根部 → 炽橙流火 → 金白焰尾！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const tailTipX = Math.max(3, hipX - 15);
    const tailTipY = Math.max(19, hipY - 15 + fl);
    p.bezierRibbon([hipX - 5, hipY - 1], [hipX - 14, hipY - 2], [tailTipX + 2, tailTipY + 4], 6.4, 2.2, '#47120c');
    p.bezierRibbon([hipX - 6, hipY - 2], [hipX - 14, hipY - 5], [tailTipX + 1, tailTipY + 1], 4.2, 1.5, '#e64d1f');
    p.bezierRibbon([hipX - 7, hipY - 3], [hipX - 13, hipY - 7], [tailTipX, tailTipY], 2.0, 0.8, '#ffba38', true);
    p.poly([[tailTipX + 4, tailTipY + 3], [tailTipX, tailTipY - 2], [tailTipX + 6, tailTipY + 1]], '#ff7b29', true);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(tailTipX, tailTipY - 1, '#fff8bd', true);
    p.px(Math.max(3, tailTipX + 2), tailTipY - 3, '#ffe066', true);

    // [2] 远侧屈节暗影兽肢（清晰大腿/前肩 → 关节转折 → 利爪）
    p.setPart(SPRITE_PART.LEGS);
    const fHockX = Math.round((hipX + farHind[0]) * 0.5) - 3;
    const fHockY = Math.round((hipY + farHind[1]) * 0.5);
    p.bezierRibbon([hipX - 2, hipY + 3], [fHockX, fHockY], [farHind[0], farHind[1] - 1], 5.4, 2.2, '#3d150e');
    drawWolfPaw(farHind[0], farHind[1], false);
    p.bezierRibbon([chestX + 1, chestY + 3], [Math.round((chestX + farFore[0]) * 0.5) + 1, Math.round((chestY + farFore[1]) * 0.5)], [farFore[0], farFore[1] - 1], 4.6, 2.1, '#471911');
    drawWolfPaw(farFore[0], farFore[1], false);

    // [3] 猎豹×恶狼流线深胸收腰躯干（深黑赤脊毛 + 炽褐强健肌理 + 暖金白胸腹毛！）
    p.setPart(SPRITE_PART.TORSO);
    // 强壮前胸与紧凑收腰
    p.bezierRibbon([hipX, hipY], [Math.round((hipX + chestX) * 0.5), Math.round((hipY + chestY) * 0.5) + 1], [chestX, chestY], 10.6, 13.5, '#3b130c');
    p.ellipse(hipX, hipY, 7.4, 5.8, '#591e12');
    p.ellipse(hipX + 1.5, hipY - 1.5, 5.4, 4.0, '#b8421f');
    p.ellipse(chestX, chestY, 8.8, 7.4, '#6e2314');
    p.ellipse(chestX + 1, chestY - 1.5, 6.8, 5.4, '#cf4d23');
    // 脊背深黑曜刺毛与暖橙肩脊反光
    p.bezierRibbon([hipX - 4, hipY - 4], [Math.round((hipX + chestX) * 0.5), chestY - 5], [chestX + 3, chestY - 6], 2.8, 3.2, '#2b0d0a');
    p.bezierRibbon([hipX - 1, hipY - 3], [Math.round((hipX + chestX) * 0.5), chestY - 3], [chestX + 2, chestY - 4], 1.4, 1.8, '#ff8f47');
    // 胸前与腹底柔和米金短绒毛
    p.ellipse(chestX + 4, chestY + 3, 5.2, 3.8, '#e8c499');
    p.ellipse(chestX + 4, chestY + 2, 3.2, 2.2, '#fff2d6');
    p.bezierRibbon([hipX + 2, hipY + 4], [Math.round((hipX + chestX) * 0.5), hipY + 3], [chestX + 1, chestY + 5], 2.2, 2.6, '#d9ab7c');

    // [4] 近侧健美屈节四肢（饱满股肌 → 锐利飞节 → 紧实脚踝 → 锋利雪白狼爪！）
    p.setPart(SPRITE_PART.LEGS);
    const nHockX = Math.round((hipX + nearHind[0]) * 0.5) - 4;
    const nHockY = Math.round((hipY + nearHind[1]) * 0.5) + 1;
    p.bezierRibbon([hipX + 1, hipY + 2], [nHockX, nHockY], [nearHind[0], nearHind[1] - 2], 7.0, 2.4, '#6e2314');
    p.bezierRibbon([hipX + 2, hipY + 1], [nHockX + 1, nHockY], [nearHind[0] + 1, nearHind[1] - 2], 3.8, 1.3, '#de5d2c');
    p.line(hipX + 3, hipY + 1, nHockX + 2, nHockY - 1, '#ff9d59', 1);
    drawWolfPaw(nearHind[0], nearHind[1], true);

    p.setPart(SPRITE_PART.FRONT_ARM);
    p.bezierRibbon([chestX + 2, chestY + 2], [nearForeKnee[0], nearForeKnee[1]], [nearFore[0], nearFore[1] - 2], 6.0, 2.3, '#822b18');
    p.bezierRibbon([chestX + 3, chestY + 1], [nearForeKnee[0] + 1, nearForeKnee[1] - 1], [nearFore[0] + 1, nearFore[1] - 2], 3.2, 1.2, '#ed6e35');
    p.line(chestX + 4, chestY + 1, nearForeKnee[0] + 1, nearForeKnee[1] - 1, '#ffae66', 1);
    drawWolfPaw(nearFore[0], nearFore[1], true);

    // [5] 飘逸锯齿状燃火狼颈鬃 + 青铜尖刺重项圈 + 甩动半截旧地狱玄铁断链！
    p.setPart(SPRITE_PART.HEADWEAR);
    // 三缕向后飘甩的流畅烈焰狼鬃（彻底告别生硬大红三角领！）
    p.bezierRibbon([chestX + 2, chestY - 7], [chestX - 4, chestY - 10], [chestX - 11 + fl * 0.4, chestY - 8], 4.6, 1.2, '#6e1410');
    p.bezierRibbon([chestX + 2, chestY - 7], [chestX - 3, chestY - 9], [chestX - 9 + fl * 0.4, chestY - 8], 2.4, 0.8, '#eb4824');
    p.bezierRibbon([chestX + 1, chestY - 3], [chestX - 4, chestY - 5], [chestX - 10 + fl * 0.5, chestY - 3], 3.8, 1.0, '#851812');
    p.bezierRibbon([chestX + 1, chestY - 3], [chestX - 3, chestY - 5], [chestX - 8 + fl * 0.5, chestY - 3], 1.8, 0.7, '#ff9d3b');
    // 重型黑铁青铜尖刺项圈
    p.line(chestX - 1, chestY - 6, chestX + 8, chestY + 2, '#2a2220', 4);
    p.line(chestX, chestY - 6, chestX + 7, chestY + 1, '#a66b2e', 2);
    // 两枚锐利金铜尖刺
    p.poly([[chestX + 1, chestY - 4], [chestX + 4, chestY - 8], [chestX + 4, chestY - 2]], '#ffe478');
    p.poly([[chestX + 5, chestY - 1], [chestX + 8, chestY - 4], [chestX + 7, chestY + 2]], '#ffe478');
    // 胸前垂挂甩动的两环玄铁断链！
    drawIronChain64(
      p,
      [
        [chestX + 7, chestY + 5],
        [chestX + 5 + Math.round(fl * 0.5), chestY + 10],
      ],
      SPRITE_PART.WEAPON,
    );

    // [6] 俊厉凶悍恶狼头颅（修长狼吻 + 折角双尖耳 + 炽金燃瞳 + 咆哮白獠牙！）
    p.setPart(SPRITE_PART.NECK_HEAD);
    const hx = headX;
    const hy = headY;
    // 强健粗颈衔接
    p.bezierRibbon([chestX + 1, chestY - 3], [chestX + 4, Math.round((chestY + hy) * 0.5)], [hx - 1, hy + 2], 8.6, 5.8, '#5e1d12');
    p.bezierRibbon([chestX + 2, chestY - 3], [chestX + 5, Math.round((chestY + hy) * 0.5)], [hx, hy + 2], 5.6, 3.6, '#cf4d23');

    // 后掠锋锐狼耳（外黑红、内暖粉橙）
    p.setPart(SPRITE_PART.HEADWEAR);
    const earDrop = isHit ? 4 : 0;
    p.poly([[hx - 5, hy - 3], [hx - 11, hy - 13 + earDrop], [hx - 1, hy - 7]], '#3b110c');
    p.poly([[hx - 5, hy - 4], [hx - 9, hy - 11 + earDrop], [hx - 2, hy - 7]], '#ff8859');
    p.poly([[hx, hy - 4], [hx - 2, hy - 14 + earDrop], [hx + 5, hy - 5]], '#782414');
    p.poly([[hx, hy - 5], [hx - 1, hy - 11 + earDrop], [hx + 3, hy - 5]], '#ffb885');

    // 棱角凌厉恶狼头骨与修长吻鼻（彻底告别两颗圆球！）
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.poly(
      [
        [hx - 6, hy - 5],
        [hx + 3, hy - 6],
        [hx + 13, hy - 1],
        [hx + 14, hy + 2],
        [hx + 4, hy + 4],
        [hx - 5, hy + 3],
      ],
      '#4d170e',
    );
    p.poly(
      [
        [hx - 5, hy - 4],
        [hx + 3, hy - 5],
        [hx + 12, hy - 1],
        [hx + 13, hy + 2],
        [hx + 3, hy + 3],
        [hx - 4, hy + 2],
      ],
      '#d95326',
    );
    // 鼻梁受光橙金高光 + 侧颊暖白毛
    p.line(hx + 2, hy - 4, hx + 12, hy - 1, '#ffaa66', 1);
    p.poly([[hx - 2, hy + 1], [hx + 6, hy + 1], [hx + 4, hy + 4], [hx - 4, hy + 3]], '#f2d3ad');
    // 黑漆狼鼻尖
    p.rect(hx + 12, hy - 1, 2, 2, '#1f0a0a');

    // 怒张咆哮狼口 + 锋利错落雪白犬齿
    p.poly(
      [
        [hx + 1, hy + 2],
        [hx + 12, hy + 2],
        [hx + 10, hy + 4 + jawOpen],
        [hx, hy + 4 + jawOpen],
      ],
      '#47090e',
    );
    p.poly(
      [
        [hx - 1, hy + 3 + jawOpen],
        [hx + 11, hy + 3 + jawOpen],
        [hx + 9, hy + 6 + jawOpen],
        [hx - 2, hy + 5 + jawOpen],
      ],
      '#8c2c16',
    );
    p.hline(hx + 1, hy + 4 + jawOpen, 8, '#f0ccb0');
    p.vline(hx + 10, hy + 2, 2, '#ffffff');
    p.vline(hx + 6, hy + 2, 2, '#ffffff');
    p.px(hx + 8, hy + 3 + jawOpen, '#ffffff');
    p.px(hx + 4, hy + 3 + jawOpen, '#ffffff');

    // 凶戾压眉下的炽金妖瞳
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.line(hx, hy - 3, hx + 5, hy - 2, '#240808', 2);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.hline(hx + 1, hy - 2, 4, '#ffae1a', true);
    p.hline(hx + 2, hy - 2, 2, '#fff8a6', true);
    p.px(hx + 4, hy - 2, '#240808');

    // [7] 攻击帧「疾扑撕裂炽橙三连爪痕」（严格收于 x<=61！）
    if (clawFlash) {
      drawSlashArc64(p, 48, 34, 9, 11, -1.15, 1.0, '#d9261c', '#ff8024', '#fff5b8');
      drawSlashArc64(p, 52, 36, 8, 10, -1.05, 0.95, '#ff5924', '#ffe066', '#ffffff');
      drawSparkStar64(p, 58, 28, 2, '#ffe878');
      drawSparkStar64(p, 58, 43, 2, '#ff7b29');
    }
  },
};

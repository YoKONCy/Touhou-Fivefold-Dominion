/**
 * 3. 镇守狛犬（T2-A · 2×2 大型神兽 · 长武器 + 破先攻）64×72 HD 像素精灵绘谱
 * 京都神社汉白玉石狮 · 浓金卷云鬃 · 注连绳金铃纸垂 · 翡翠尾焰 · 人立飞扑裂空爪！
 */

import { SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawShideTassel64, HD_BASE } from './helpers';

export const creatureKomainuSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#101a2a',
  backdropBottom: '#26212e',
  backdropGlow: '#6bf0c6',
  avatarCrop: { x: 20, y: 8, size: 34 },
  portraitCrop: { x: 2, y: 6, w: 60, h: 62 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const wave = Math.round(pose.flutter * 2.0);
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;

    // 64×72 全幅雕塑级四足石狮骨骼节点
    let hipX = 19;
    let hipY = 48;
    let chestX = 33;
    let chestY = 40;
    let headX = 39;
    let headY = 25;
    let farHindPaw: [number, number] = [13, 62];
    let nearHindPaw: [number, number] = [18, 64];
    let farForeElbow: [number, number] = [36, 51];
    let farForePaw: [number, number] = [39, 62];
    let nearForeElbow: [number, number] = [38, 52];
    let nearForePaw: [number, number] = [43, 64];
    let tailSway = 0;
    let roarOpen = false;
    let clawGlow = false;
    let slashStage: 0 | 1 | 2 = 0;

    if (isAtk) {
      if (f === 0) {
        // 蓄力帧 0：后腿稳扎大地，上身雄壮人立仰起！双前爪高举亮锋咆哮蓄力！
        hipX = 20;
        hipY = 52;
        chestX = 26;
        chestY = 34;
        headX = 31;
        headY = 18;
        farHindPaw = [13, 63];
        nearHindPaw = [20, 64];
        farForeElbow = [34, 33];
        farForePaw = [42, 24];
        nearForeElbow = [32, 40];
        nearForePaw = [45, 34];
        tailSway = 4;
        roarOpen = true;
        clawGlow = true;
      } else if (f === 1) {
        // 飞扑帧 1：后爪蹬地凌空飞扑，双巨爪全力前探，爪前净空撕裂三道弯月翠金神爪！
        hipX = 15;
        hipY = 46;
        chestX = 28;
        chestY = 38;
        headX = 35;
        headY = 24;
        farHindPaw = [7, 60];
        nearHindPaw = [13, 63];
        farForeElbow = [37, 38];
        farForePaw = [47, 34];
        nearForeElbow = [39, 45];
        nearForePaw = [49, 45];
        tailSway = -4;
        roarOpen = true;
        clawGlow = true;
        slashStage = 1;
      } else if (f === 2) {
        // 横扫追击帧 2：双爪猛压横扫，三道爪芒延展消散
        hipX = 17;
        hipY = 48;
        chestX = 31;
        chestY = 41;
        headX = 37;
        headY = 27;
        farHindPaw = [10, 62];
        nearHindPaw = [16, 64];
        farForeElbow = [39, 45];
        farForePaw = [48, 47];
        nearForeElbow = [40, 51];
        nearForePaw = [49, 57];
        tailSway = -2;
        roarOpen = true;
        clawGlow = true;
        slashStage = 2;
      } else {
        hipX = 19;
        hipY = 49;
        chestX = 33;
        chestY = 41;
        headX = 39;
        headY = 26;
        farHindPaw = [13, 62];
        nearHindPaw = [18, 64];
        farForeElbow = [38, 52];
        farForePaw = [42, 62];
        nearForeElbow = [41, 53];
        nearForePaw = [46, 64];
        tailSway = 1;
        clawGlow = true;
      }
    } else if (isMove) {
      if (f === 0) {
        hipX = 16; hipY = 47; chestX = 31; chestY = 40; headX = 39; headY = 25;
        farHindPaw = [9, 62]; nearHindPaw = [14, 64];
        farForeElbow = [39, 48]; farForePaw = [46, 61];
        nearForeElbow = [37, 52]; nearForePaw = [42, 64];
        tailSway = -4;
      } else if (f === 1) {
        hipX = 19; hipY = 42; chestX = 33; chestY = 35; headX = 40; headY = 21;
        farHindPaw = [12, 56]; nearHindPaw = [16, 58];
        farForeElbow = [38, 45]; farForePaw = [44, 54];
        nearForeElbow = [41, 47]; nearForePaw = [48, 53];
        tailSway = -5;
      } else if (f === 2) {
        hipX = 22; hipY = 48; chestX = 34; chestY = 41; headX = 41; headY = 26;
        farHindPaw = [16, 62]; nearHindPaw = [22, 64];
        farForeElbow = [37, 52]; farForePaw = [40, 63];
        nearForeElbow = [41, 52]; nearForePaw = [45, 62];
        tailSway = -1;
      } else {
        hipX = 18; hipY = 45; chestX = 31; chestY = 37; headX = 39; headY = 23;
        farHindPaw = [10, 60]; nearHindPaw = [14, 62];
        farForeElbow = [39, 47]; farForePaw = [47, 57];
        nearForeElbow = [41, 48]; nearForePaw = [49, 58];
        tailSway = -4;
      }
    } else if (isHit) {
      const back = f === 0 ? -4 : -2;
      hipX = 18 + back; hipY = 51; chestX = 29 + back; chestY = 45; headX = 34 + back; headY = 30;
      farHindPaw = [11 + back, 62]; nearHindPaw = [16 + back, 64];
      farForeElbow = [34 + back, 53]; farForePaw = [38 + back, 62];
      nearForeElbow = [37 + back, 52]; nearForePaw = [42 + back, 60];
      tailSway = 4;
    } else {
      const by = Math.round(pose.breathY * 1.1);
      const pawFlex = f === 2 || f === 3 ? -1 : 0;
      hipY = 48 + by;
      chestY = 40 + by;
      headY = 25 + by;
      nearForePaw = [43, 64 + pawFlex];
      nearForeElbow = [38, 52 + by];
      farForeElbow = [36, 51 + by];
    }

    const drawLionPaw = (px: number, py: number, dark: boolean, spread: boolean) => {
      const base = dark ? '#a69e91' : '#f2ece1';
      const hi = dark ? '#cfc8ba' : '#ffffff';
      // 朱金神兽踝环
      p.hline(px - 3, py - 4, 6, dark ? '#8c5319' : '#cc2947');
      p.hline(px - 1, py - 4, 3, '#ffe473');
      // 强健厚实狮掌肉垫
      p.ellipse(px, py, spread ? 4.8 : 4.4, spread ? 3.3 : 2.8, base);
      p.hline(px - 2, py - 1, 5, hi);
      // 三枚锋利破魔爪
      const clawCol = clawGlow ? '#8affdc' : '#f2c44d';
      if (spread) {
        p.line(px + 3, py - 2, px + 7, py - 4, clawCol, 2, clawGlow);
        p.line(px + 4, py, px + 8, py, '#ffe885', 2, clawGlow);
        p.line(px + 3, py + 2, px + 7, py + 4, clawCol, 1, clawGlow);
        if (clawGlow) p.px(px + 8, py, '#ffffff', true);
      } else {
        p.line(px + 3, py - 1, px + 5, py, clawCol, 1, clawGlow);
        p.line(px + 3, py + 1, px + 6, py + 1, '#ffe478', 1, clawGlow);
        p.px(px + 4, py + 2, clawCol, clawGlow);
      }
    };

    // [1] 威风 S 形卷云石狮神尾 + 跃动翡翠神焰尖火
    p.setPart(SPRITE_PART.BACK_ACC);
    const tBaseX = hipX - 6;
    const tBaseY = hipY - 2;
    const tMidX = Math.max(5, hipX - 11);
    const tMidY = Math.max(22, hipY - 10 + tailSway);
    const tTopX = Math.max(6, hipX - 8 + Math.round(tailSway * 0.4));
    const tTopY = Math.max(13, tMidY - 11 + wave);
    p.bezierRibbon([tBaseX, tBaseY], [tMidX - 2, tMidY + 2], [tTopX, tTopY + 5], 6.0, 3.6, '#8c8579');
    p.bezierRibbon([tBaseX + 1, tBaseY - 1], [tMidX, tMidY], [tTopX, tTopY + 5], 3.2, 2.0, '#e3dcd0');
    p.bezierRibbon([tMidX + 1, tMidY - 1], [tTopX - 1, tTopY + 8], [tTopX, tTopY + 5], 1.4, 1.0, '#ffffff');
    // 尾端暖金卷云鬃簇
    p.ellipse(tTopX, tTopY + 4, 4.2, 3.4, '#c7811f');
    p.ellipse(tTopX - 0.5, tTopY + 3, 2.6, 2.0, '#ffe073');
    // 跃动翡翠尖形神火
    p.setPart(SPRITE_PART.GLOW_FX);
    p.poly(
      [
        [tTopX - 4, tTopY + 3],
        [tTopX - 5 + Math.round(wave * 0.5), tTopY - 4],
        [tTopX + Math.round(wave * 0.7), tTopY - 9],
        [tTopX + 4, tTopY - 3],
        [tTopX + 3, tTopY + 3],
      ],
      '#17bd91',
      true,
    );
    p.poly(
      [
        [tTopX - 2, tTopY + 2],
        [tTopX - 2 + Math.round(wave * 0.4), tTopY - 3],
        [tTopX + Math.round(wave * 0.5), tTopY - 6],
        [tTopX + 2, tTopY + 1],
      ],
      '#a8ffe4',
      true,
    );
    p.px(tTopX + Math.round(wave * 0.5), tTopY - 6, '#ffffff', true);

    // [2] 远侧后腿与远侧前腿（深暖石影立体分层）
    p.setPart(SPRITE_PART.LEGS);
    p.ellipse(hipX - 3, hipY + 4, 5.2, 5.8, '#787168');
    p.line(hipX - 4, hipY + 5, farHindPaw[0], farHindPaw[1] - 1, '#8c857b', 5);
    drawLionPaw(farHindPaw[0] + 1, farHindPaw[1], true, false);

    const farSpread = isAtk && f <= 2;
    p.setPart(SPRITE_PART.BACK_ARM);
    p.line(chestX + 2, chestY + 2, farForeElbow[0], farForeElbow[1], '#8c857b', 5);
    p.line(farForeElbow[0], farForeElbow[1], farForePaw[0], farForePaw[1], '#b3aba0', 4);
    drawLionPaw(farForePaw[0], farForePaw[1], true, farSpread);

    // [3] 雕塑感雄壮汉白玉石狮躯干（宽胸收腰 + 京都石雕云纹！）
    p.setPart(SPRITE_PART.TORSO);
    p.line(hipX, hipY, chestX, chestY, '#999286', 14);
    p.ellipse(hipX, hipY, 8.8, 7.6, '#968f83');
    p.ellipse(hipX + 1.5, hipY - 1.5, 6.8, 5.6, '#dcd5c8');
    p.ellipse(chestX, chestY, 10.2, 9.0, '#c4bdb0');
    p.ellipse(chestX + 1.5, chestY - 2, 7.8, 6.8, '#f7f2e8');
    p.ellipse(chestX + 2, chestY - 4, 4.8, 3.6, '#ffffff');
    // 臀侧京都石狮浅浮雕卷云纹
    p.bezierRibbon([hipX - 3, hipY - 2], [hipX + 1, hipY - 3], [hipX + 2, hipY + 1], 1.4, 1.0, '#ffffff');
    p.line(hipX - 2, hipY + 1, hipX + 2, hipY + 2, '#827b70', 1);

    // [4] 粗实朱红金绞注连绳 + 摇曳雪白纸垂 + 醒目黄金大铃铛
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.line(chestX - 7, chestY - 6, chestX + 9, chestY + 3, '#8a142a', 5);
    p.line(chestX - 6, chestY - 6, chestX + 8, chestY + 2, '#eb3454', 3);
    for (const t of [0.2, 0.45, 0.7, 0.9]) {
      const rx = Math.round(chestX - 6 + 14 * t);
      const ry = Math.round(chestY - 6 + 8 * t);
      p.px(rx, ry, '#ffe678');
      p.px(rx + 1, ry + 1, '#fff8c7');
    }
    drawShideTassel64(p, chestX - 3, chestY + 1, wave * 0.45, 3);

    // [5] 近侧强健猫科后肢
    p.setPart(SPRITE_PART.LEGS);
    p.ellipse(hipX, hipY + 4, 6.4, 6.6, '#d9d1c3');
    p.ellipse(hipX + 1.5, hipY + 2, 4.4, 4.2, '#faf5ec');
    p.line(hipX, hipY + 7, nearHindPaw[0], nearHindPaw[1] - 1, '#ebe4d8', 5);
    p.line(hipX + 1, hipY + 7, nearHindPaw[0] + 1, nearHindPaw[1] - 1, '#ffffff', 2);
    drawLionPaw(nearHindPaw[0] + 1, nearHindPaw[1], false, false);

    // [6] 近侧主角前腿与破魔巨爪
    p.setPart(SPRITE_PART.FRONT_ARM);
    const nearSpread = isAtk && f <= 2;
    p.ellipse(chestX + 1, chestY + 3, 5.6, 5.4, '#e6dfd1');
    p.line(chestX + 1, chestY + 3, nearForeElbow[0], nearForeElbow[1], '#e3dcd0', 6);
    p.line(nearForeElbow[0], nearForeElbow[1], nearForePaw[0], nearForePaw[1], '#f7f2e8', 5);
    p.line(chestX + 2, chestY + 2, nearForePaw[0], nearForePaw[1] - 1, '#ffffff', 2);
    drawLionPaw(nearForePaw[0], nearForePaw[1], false, nearSpread);

    // 胸前璀璨黄金大神社铃铛
    p.setPart(SPRITE_PART.APRON_WAIST);
    const bellX = chestX + 8;
    const bellY = chestY + 4;
    p.ellipse(bellX, bellY, 4.2, 4.2, '#996012');
    p.ellipse(bellX - 0.3, bellY - 0.5, 3.2, 3.2, '#ffe066', true);
    p.px(bellX - 1, bellY - 2, '#ffffff', true);
    p.hline(bellX - 2, bellY + 1, 5, '#4f2b12');
    p.px(bellX, bellY + 2, '#4f2b12');

    // [7] 华贵雕塑感浓金卷云狮鬃 + 威严大狮首（独立尖挺双狮耳 + 翡翠灵眸 + 咆哮獠牙口！）
    p.setPart(SPRITE_PART.NECK_HEAD);
    const hx = headX;
    const hy = headY;
    // 多层立体暖金卷云鬃毛
    p.ellipse(hx - 3, hy + 1, 12.6, 11.8, '#7a450f');
    p.ellipse(hx - 3, hy, 10.6, 10.0, '#c9821e');
    const maneCurls: Array<[number, number, number, number, string]> = [
      [hx - 12, hy - 3, 4.4, 4.0, '#f2b83d'],
      [hx - 12, hy + 4, 4.2, 3.8, '#d99121'],
      [hx - 7, hy - 8, 4.6, 3.8, '#ffd966'],
      [hx + 1, hy - 8, 4.0, 3.2, '#f2b83d'],
      [hx - 7, hy + 8, 4.4, 3.4, '#bd7517'],
      [hx - 2, hy + 9, 4.0, 3.0, '#d99121'],
    ];
    for (const [mx, my, rx, ry, col] of maneCurls) {
      p.ellipse(mx, my, rx, ry, col);
    }
    // 鬃毛卷云暗纹立体层次与翡翠灵珠点缀
    p.bezierRibbon([hx - 11, hy - 5], [hx - 8, hy - 2], [hx - 12, hy + 2], 1.3, 1.0, '#8a4f12');
    p.bezierRibbon([hx - 6, hy - 9], [hx - 4, hy - 5], [hx - 8, hy - 4], 1.2, 0.9, '#8a4f12');
    p.hline(hx - 8, hy - 10, 5, '#fff5ba');
    p.hline(hx - 13, hy - 4, 3, '#ffe885');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(hx - 12, hy - 3, '#6bf0c6', true);
    p.px(hx - 7, hy - 8, '#6bf0c6', true);

    // 独立高耸双狮耳
    p.setPart(SPRITE_PART.HEADWEAR);
    const earDrop = isHit ? 4 : 0;
    p.poly([[hx - 6, hy - 6], [hx - 9, hy - 16 + earDrop], [hx - 1, hy - 9]], '#cfc8ba');
    p.poly([[hx - 5, hy - 7], [hx - 8, hy - 14 + earDrop], [hx - 2, hy - 9]], '#faf5eb');
    p.poly([[hx - 6, hy - 8 + earDrop], [hx - 7, hy - 12 + earDrop], [hx - 4, hy - 9 + earDrop]], '#eb6e87');
    p.poly([[hx + 3, hy - 7], [hx + 8, hy - 16 + earDrop], [hx + 9, hy - 6]], '#e6dfd2');
    p.poly([[hx + 4, hy - 8], [hx + 7, hy - 14 + earDrop], [hx + 8, hy - 7]], '#ffffff');
    p.poly([[hx + 6, hy - 8 + earDrop], [hx + 7, hy - 12 + earDrop], [hx + 7, hy - 7 + earDrop]], '#eb6e87');

    // 饱满温润石狮面庞与雕塑感立体白狮吻（加暖灰腮影与鼻梁转折，威严高贵不呆板！）
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.ellipse(hx + 2, hy + 1, 8.8, 7.6, '#c4bcb0');
    p.ellipse(hx + 2.8, hy - 0.3, 7.3, 6.2, '#f5efe6');
    p.ellipse(hx + 7.5, hy + 3.0, 5.4, 3.8, '#e3dcd0');
    p.ellipse(hx + 7.5, hy + 2.2, 4.8, 3.0, '#ffffff');
    // 狮鼻与英武上挑浓金威严眉弓
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.poly([[hx + 8, hy + 1], [hx + 12, hy + 1], [hx + 11, hy + 4], [hx + 9, hy + 4]], '#47302b');
    p.hline(hx + 9, hy + 1, 2, '#9e7d75');
    p.line(hx + 1, hy - 4, hx + 5, hy - 3, '#b87114', 2);
    p.line(hx + 6, hy - 3, hx + 10, hy - 5, '#b87114', 2);
    p.line(hx + 1, hy - 5, hx + 5, hy - 4, '#ffe885', 1);
    p.line(hx + 6, hy - 4, hx + 9, hy - 5, '#ffe885', 1);
    // 炯炯翡翠神兽双眸
    if (pose.expr === 'hurt') {
      p.hline(hx + 1, hy, 4, '#2b1e33');
      p.hline(hx + 7, hy, 3, '#2b1e33');
    } else if (pose.blink) {
      p.hline(hx + 1, hy, 4, '#3d2c3f');
      p.hline(hx + 7, hy, 3, '#3d2c3f');
    } else {
      const eyeCol = isAtk ? '#5effcf' : '#12c790';
      p.rect(hx + 1, hy - 2, 4, 3, '#1a2e2b');
      p.rect(hx + 2, hy - 1, 3, 2, eyeCol, true);
      p.px(hx + 2, hy - 1, '#ffffff', true);
      p.rect(hx + 7, hy - 2, 3, 3, '#1a2e2b');
      p.rect(hx + 8, hy - 1, 2, 2, eyeCol, true);
      p.px(hx + 8, hy - 1, '#ffffff', true);
    }
    // 阿形咆哮狮口与锋利白獠牙！
    if (roarOpen) {
      p.rect(hx + 4, hy + 5, 8, 5, '#6b1022');
      p.hline(hx + 5, hy + 8, 6, '#e83856');
      p.vline(hx + 5, hy + 5, 2, '#ffffff');
      p.vline(hx + 10, hy + 5, 2, '#ffffff');
      p.px(hx + 6, hy + 9, '#ffffff');
      p.px(hx + 9, hy + 9, '#ffffff');
    } else {
      p.hline(hx + 5, hy + 6, 7, '#75645c');
      p.px(hx + 5, hy + 5, '#ffffff');
      p.px(hx + 10, hy + 5, '#ffffff');
    }

    // [8] 人立蓄力火花（干净移至巨爪前端外侧，绝不遮挡咆哮狮口！）& 飞扑三道弯月翠金神爪！
    if (isAtk && f === 0) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.px(farForePaw[0] + 9, farForePaw[1] - 3, '#ffe878', true);
      p.ellipse(nearForePaw[0] + 9, nearForePaw[1] + 1, 1.8, 1.8, '#8affdc', true);
      p.px(nearForePaw[0] + 9, nearForePaw[1] + 1, '#ffffff', true);
    } else if (slashStage === 1) {
      p.setPart(SPRITE_PART.GLOW_FX);
      // 三道饱满锐利弯月爪痕（位于巨爪前方净空 x=49..62，绝不遮脸！）
      p.bezierRibbon([49, 22], [58, 29], [61, 39], 3.2, 0.9, '#1fd4a1', true);
      p.bezierRibbon([50, 23], [57, 29], [60, 38], 1.3, 0.5, '#ffffff', true);
      p.bezierRibbon([50, 31], [59, 39], [61, 49], 3.6, 1.0, '#6bf0c6', true);
      p.bezierRibbon([51, 32], [58, 39], [60, 48], 1.6, 0.6, '#fff5b8', true);
      p.bezierRibbon([50, 41], [58, 49], [59, 57], 2.8, 0.8, '#1fd4a1', true);
      p.bezierRibbon([51, 42], [57, 49], [58, 56], 1.1, 0.5, '#ffffff', true);
      p.px(9, 63, '#9effdf', true);
      p.px(16, 65, '#ffe878', true);
    } else if (slashStage === 2) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.bezierRibbon([52, 29], [59, 38], [61, 46], 2.0, 0.6, '#6bf0c6', true);
      p.bezierRibbon([52, 38], [60, 47], [61, 56], 2.4, 0.7, '#ffe878', true);
      p.bezierRibbon([51, 48], [58, 55], [59, 61], 1.8, 0.5, '#9effdf', true);
    }
  },
};

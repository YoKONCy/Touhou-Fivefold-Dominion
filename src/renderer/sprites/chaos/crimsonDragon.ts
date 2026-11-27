/**
 * 9. 红莲魔龙（混沌 T4-B · 2×2 飞行全魔免终极霸主）
 * 宽展遮天双膜龙翼 + 修长真龙体态 + 黑红叠鳞金腹 + 健美黄金龙爪 + 贵族红莲龙王首。
 */

import { SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawSparkStar64, HD_BASE } from './helpers';

/** 红莲魔龙（creature_crimson_dragon）HD 像素绘谱 */
export const CREATURE_CRIMSON_DRAGON_RIG_SPEC: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#140510',
  backdropBottom: '#3d0a1c',
  backdropGlow: '#ff3852',
  avatarCrop: { x: 22, y: 4, size: 36 },
  portraitCrop: { x: 1, y: 1, w: 62, h: 70 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;

    const bx = isAtk && (f === 1 || f === 2) ? 23 : Math.round(28 + pose.leanX * 0.8);
    // 飞行态高频大振翅起伏，严格控制边界零裁切！
    const by = isMove
      ? [-4, -1, 1, -2][f % 4]
      : Math.round(pose.breathY * 1.2 - pose.stepLift * 0.9);
    const flap = isMove ? [-7, 7, 1, -5][f % 4] : Math.round(Math.sin(phase) * 3.4);
    const tw = Math.round(pose.flutter * 2.2);

    // [1] 远侧高展「苍穹右龙翼」（大幅跃出颈后上空，塑造真正西方龙王双翼张开的震撼剪影！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const rwPeakX = Math.min(52, bx + 18);
    const rwPeakY = Math.max(4, 5 + by + Math.round(flap * 0.65));
    const rwTipX = Math.min(58, bx + 26);
    const rwTipY = Math.max(8, 16 + by + Math.round(flap * 0.78));
    const rwMidX = Math.min(53, bx + 20);
    const rwMidY = Math.min(34, 24 + by + Math.round(flap * 0.45));
    p.poly(
      [
        [bx + 3, 33 + by],
        [rwPeakX, rwPeakY],
        [rwTipX, rwTipY],
        [rwMidX + 2, rwMidY - 3],
        [rwMidX, rwMidY],
        [bx + 11, 29 + by + Math.round(flap * 0.3)],
        [bx + 4, 38 + by],
      ],
      '#240511',
    );
    p.poly(
      [
        [bx + 4, 33 + by],
        [rwPeakX - 1, rwPeakY + 3],
        [rwTipX - 3, rwTipY],
        [rwMidX - 1, rwMidY - 2],
        [bx + 10, 29 + by + Math.round(flap * 0.25)],
      ],
      '#8f132a',
    );
    p.poly(
      [
        [bx + 6, 32 + by],
        [rwPeakX - 2, rwPeakY + 6],
        [rwTipX - 6, rwTipY - 1],
        [bx + 12, 28 + by + Math.round(flap * 0.2)],
      ],
      '#cf2140',
    );
    p.bezierRibbon([bx + 3, 33 + by], [bx + 11, Math.max(5, 16 + by + flap * 0.5)], [rwPeakX, rwPeakY], 3.0, 1.4, '#470b1f');
    p.line(rwPeakX, rwPeakY, rwTipX, rwTipY, '#5e1129', 2);
    p.line(rwPeakX - 1, rwPeakY + 2, rwMidX, rwMidY, '#3d091b', 1);
    p.poly([[rwPeakX, rwPeakY], [rwPeakX + 2, Math.max(2, rwPeakY - 3)], [rwPeakX - 2, rwPeakY + 1]], '#ffe478', true);

    // [2] 近侧遮天拱形「红莲巨龙主翼」（宽阔拱顶 + 4 根扇展指骨 + 凹弧熔焰红莲翼膜，彻底告别窄纸扇！）
    const wElbowX = Math.max(10, bx - 14);
    const wElbowY = Math.max(5, 8 + by + Math.round(flap * 0.85));
    const wOuterX = Math.max(3, bx - 25);
    const wOuterY = Math.max(7, 15 + by + flap);
    const wLow1X = Math.max(4, bx - 23);
    const wLow1Y = Math.min(44, 31 + by + Math.round(flap * 0.9));
    const wLow2X = Math.max(8, bx - 15);
    const wLow2Y = Math.min(48, 39 + by + Math.round(flap * 0.55));
    const wInnerX = bx - 8;
    const wInnerY = Math.min(50, 41 + by + Math.round(flap * 0.3));

    // 凹弧暗黑翼膜外框
    p.poly(
      [
        [bx - 2, 34 + by],
        [wElbowX, wElbowY],
        [wOuterX, wOuterY],
        [wOuterX + 4, Math.round((wOuterY + wLow1Y) * 0.5)],
        [wLow1X, wLow1Y],
        [Math.round((wLow1X + wLow2X) * 0.5) + 1, Math.round((wLow1Y + wLow2Y) * 0.5) - 3],
        [wLow2X, wLow2Y],
        [Math.round((wLow2X + wInnerX) * 0.5) + 1, Math.round((wLow2Y + wInnerY) * 0.5) - 3],
        [wInnerX, wInnerY],
        [bx - 4, 41 + by],
      ],
      '#290512',
    );
    // 浓郁绯红中层翼膜
    p.poly(
      [
        [bx - 4, 34 + by],
        [wElbowX, wElbowY + 3],
        [wOuterX + 3, wOuterY + 2],
        [wLow1X + 3, wLow1Y - 3],
        [wLow2X + 2, wLow2Y - 4],
        [bx - 6, 38 + by],
      ],
      '#b51632',
    );
    // 炽焰绯橙内发光翼膜高光区（红莲火焰透光感！）
    p.poly(
      [
        [bx - 6, 32 + by],
        [wElbowX + 1, wElbowY + 7],
        [wOuterX + 7, wOuterY + 6],
        [wLow1X + 6, wLow1Y - 7],
        [bx - 8, 35 + by],
      ],
      '#f23a52',
    );
    p.line(wElbowX + 1, wElbowY + 9, wLow1X + 6, wLow1Y - 7, '#ff8c38', 1, true);
    p.line(wElbowX + 2, wElbowY + 10, wLow2X + 2, wLow2Y - 6, '#ff6a33', 1, true);
    // 粗壮拱形黑曜主翼臂 + 翼顶黄金锋爪 + 4 根清晰扇展指骨！
    p.bezierRibbon([bx - 2, 34 + by], [bx - 8, Math.max(5, 19 + by + flap * 0.65)], [wElbowX, wElbowY], 4.4, 2.4, '#38091a');
    p.bezierRibbon([bx - 2, 33 + by], [bx - 8, Math.max(5, 18 + by + flap * 0.65)], [wElbowX, wElbowY], 1.8, 1.0, '#a61e3c');
    p.bezierRibbon([wElbowX, wElbowY], [Math.round((wElbowX + wOuterX) * 0.5), wElbowY - 1], [wOuterX, wOuterY], 2.8, 1.2, '#470c21');
    p.line(wElbowX, wElbowY + 1, wLow1X, wLow1Y, '#470c21', 2);
    p.line(wElbowX + 1, wElbowY + 2, wLow2X, wLow2Y, '#3d0a1c', 2);
    p.line(wElbowX + 2, wElbowY + 3, wInnerX, wInnerY, '#38091a', 1);
    // 翼肘锐利黄金钩爪
    p.poly([[wElbowX, wElbowY], [wElbowX - 2, Math.max(2, wElbowY - 4)], [wElbowX + 3, Math.max(3, wElbowY - 1)]], '#ffe878', true);

    if (isMove && f === 1) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.bezierRibbon([wLow1X + 1, wLow1Y + 4], [wLow2X - 1, wLow2Y + 6], [bx - 4, wInnerY + 3], 2.4, 0.7, '#ff592b', true);
      p.bezierRibbon([wLow1X + 3, wLow1Y + 3], [wLow2X + 1, wLow2Y + 5], [bx - 6, wInnerY + 2], 1.2, 0.5, '#ffe878', true);
    }

    // [3] 蜿蜒盘卷「黑红长棘龙尾」+ 倒刺炽金红莲尾矛！
    p.setPart(SPRITE_PART.BACK_ACC);
    const tTipX = Math.max(5, bx - 22);
    const tTipY = Math.min(58, 49 + by + tw);
    p.bezierRibbon([bx - 9, 49 + by], [bx - 19, 60 + by], [tTipX + 2, tTipY], 5.6, 1.8, '#260512');
    p.bezierRibbon([bx - 9, 48 + by], [bx - 18, 58 + by], [tTipX + 2, tTipY - 1], 3.2, 1.0, '#a81733');
    p.bezierRibbon([bx - 9, 47 + by], [bx - 17, 57 + by], [tTipX + 3, tTipY - 1], 1.2, 0.5, '#ff5c77');
    // 尾部两枚鎏金背棘
    p.px(bx - 15, 55 + by, '#ffe066');
    p.px(bx - 19, 53 + by, '#ffe478');
    // 锐利炽金火矛尾刃
    p.setPart(SPRITE_PART.GLOW_FX);
    p.poly([[tTipX + 3, tTipY - 4], [Math.max(2, tTipX - 3), tTipY - 1], [tTipX + 2, tTipY + 4], [tTipX + 1, tTipY]], '#ff4d24', true);
    p.px(tTipX, tTipY - 1, '#fff8cc', true);

    // [4] 雄健四足真龙后肢（健壮后腿踏地抓岩；飞行态掠空流线收爪！）
    p.setPart(SPRITE_PART.LEGS);
    if (isMove) {
      p.bezierRibbon([bx - 8, 48 + by], [bx - 15, 54 + by], [bx - 12, 58 + by], 5.8, 3.2, '#42091c');
      p.bezierRibbon([bx - 8, 47 + by], [bx - 14, 53 + by], [bx - 12, 57 + by], 3.0, 1.8, '#bf1c3b');
      p.line(bx - 12, 57 + by, bx - 6, 61 + by, '#de2c4c', 3);
      p.line(bx - 6, 61 + by, bx - 2, 62 + by, '#ffe878', 2);
    } else {
      // 远侧后腿暗影
      p.line(bx - 4, 50 + by, bx - 2, 62, '#3d081a', 4);
      p.hline(bx - 3, 63, 5, '#d99a2e');
      // 近侧肌肉后肢 + 三趾黄金利爪
      p.bezierRibbon([bx - 9, 47 + by], [bx - 16, 54 + by], [bx - 12, 58], 6.4, 3.6, '#3d081a');
      p.bezierRibbon([bx - 9, 46 + by], [bx - 15, 53 + by], [bx - 12, 57], 3.6, 2.0, '#bd1c3b');
      p.line(bx - 12, 57, bx - 8, 63, '#d92646', 4);
      p.line(bx - 11, 57, bx - 8, 62, '#ff6680', 1);
      p.poly([[bx - 12, 63], [bx - 4, 62], [bx - 1, 65], [bx - 11, 65]], '#8c142d');
      p.px(bx - 12, 65, '#ffe478');
      p.px(bx - 7, 65, '#ffe885');
      p.px(bx - 1, 65, '#fff5bd');
    }

    // [5] 修长健美「西方黑红魔龙躯干」（深阔龙胸 + 猎豹般收腰 + 黑曜红背甲 + 璀璨熔金叠鳞腹！）
    p.setPart(SPRITE_PART.TORSO);
    // 臀腰流线衔接宽厚前胸（告别臃肿红鸡蛋！）
    p.bezierRibbon([bx - 10, 48 + by], [bx - 1, 46 + by], [bx + 5, 39 + by], 11.2, 14.5, '#2b0614');
    p.bezierRibbon([bx - 9, 48 + by], [bx, 45 + by], [bx + 5, 39 + by], 8.0, 11.0, '#9c1632');
    // 深黑酒红脊背甲与高光脊棱
    p.bezierRibbon([bx - 10, 45 + by], [bx - 2, 41 + by], [bx + 4, 34 + by], 3.8, 3.4, '#470a1e');
    p.bezierRibbon([bx - 8, 46 + by], [bx - 1, 42 + by], [bx + 5, 36 + by], 1.8, 1.6, '#f24460');
    // 宽阔威严的熔金胸腹龙鳞甲片（顺着胸廓弧度流畅延展！）
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly(
      [
        [bx + 3, 35 + by],
        [bx + 11, 37 + by],
        [bx + 9, 48 + by],
        [bx + 1, 51 + by],
      ],
      '#a85714',
    );
    p.hline(bx + 4, 37 + by, 6, '#ffe059');
    p.hline(bx + 3, 40 + by, 7, '#fff299', true);
    p.hline(bx + 3, 43 + by, 7, '#ffe059');
    p.hline(bx + 2, 46 + by, 6, '#ebb238');
    p.hline(bx + 2, 49 + by, 5, '#c97b24');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(bx + 6, 40 + by, '#ffffff', true);

    // [6] 威猛屈肘「真龙前肢与黄金破甲巨爪」（自然屈肘踏地蓄力，四足稳重如山，彻底告别斜直棍！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    if (isMove) {
      // 掠空飞行姿态：健壮前爪凌空屈肘探出蓄势！
      p.bezierRibbon([bx + 5, 42 + by], [bx + 7, 49 + by], [bx + 15, 51 + by], 5.0, 3.0, '#6e1026');
      p.bezierRibbon([bx + 6, 41 + by], [bx + 8, 48 + by], [bx + 15, 50 + by], 2.6, 1.6, '#eb3452');
      p.line(bx + 15, 50 + by, bx + 20, 49 + by, '#ffe878', 2);
      p.line(bx + 15, 51 + by, bx + 21, 53 + by, '#fff5bd', 1);
      p.line(bx + 14, 52 + by, bx + 17, 55 + by, '#e8b63a', 1);
    } else if (isAtk && f <= 2) {
      // 攻击昂首抬爪威慑态！
      const lift = f === 0 ? -7 : -4;
      const shX = bx + 5;
      const shY = 42 + by;
      const elX = bx + 6;
      const elY = 50 + by + Math.round(lift * 0.5);
      const pawX = bx + 15;
      const pawY = 55 + by + lift;
      p.bezierRibbon([shX, shY], [elX, elY], [pawX - 1, pawY], 5.4, 3.2, '#5c0d22');
      p.bezierRibbon([shX + 1, shY], [elX + 1, elY - 1], [pawX, pawY - 1], 3.0, 1.8, '#e62b4a');
      p.line(pawX, pawY - 1, pawX + 5, pawY - 2, '#ffe878', 2);
      p.line(pawX, pawY + 1, pawX + 6, pawY + 2, '#fff6bd', 1);
      p.line(pawX - 1, pawY + 2, pawX + 2, pawY + 5, '#e6b238', 1);
    } else {
      // 待机四足稳重踏地态：健美龙肩 → 后收肘节 → 雄健前臂 → 稳抓地面 y=64 的黄金龙爪！
      const shX = bx + 5;
      const shY = 42 + by;
      const elX = bx + 5;
      const elY = 53 + by;
      const wristX = bx + 11;
      const wristY = 62;
      p.bezierRibbon([shX, shY], [elX - 1, elY], [wristX - 1, wristY], 5.8, 3.4, '#590d22');
      p.bezierRibbon([shX + 1, shY], [elX, elY], [wristX, wristY - 1], 3.2, 2.0, '#de2847');
      p.line(elX + 1, elY, wristX, wristY - 1, '#ff7890', 1);
      // 紧抓地面的三趾黄金巨龙爪（与后爪同处地面水平线！）
      p.poly([[wristX - 2, 62], [wristX + 4, 62], [wristX + 7, 65], [wristX - 2, 65]], '#a61834');
      p.line(wristX + 2, 63, wristX + 7, 64, '#ffe878', 2);
      p.px(wristX + 7, 65, '#fff6bd');
      p.px(wristX + 3, 65, '#ffe478');
      p.px(wristX - 1, 65, '#e6b238');
    }

    // [7] 优雅威武「S 形修长龙颈 + 黄金脊背鳍」+ 精致比例「贵族黑红魔龙王首」（绝不大头娃娃！）
    const hx = bx + 13 + (isAtk && (f === 1 || f === 2) ? 2 : isAtk && f === 0 ? -3 : 0);
    const hy = 21 + by + (isAtk && f === 0 ? -3 : 0);
    p.setPart(SPRITE_PART.NECK_HEAD);
    // 优美后弓再前探的真龙 S 颈（曲线纤韧有力！）
    p.bezierRibbon([bx + 5, 37 + by], [bx + 3, 28 + by], [hx - 3, hy + 2], 6.8, 4.4, '#300715');
    p.bezierRibbon([bx + 6, 36 + by], [bx + 5, 28 + by], [hx - 2, hy + 2], 4.2, 2.8, '#c41c3b');
    p.bezierRibbon([bx + 7, 35 + by], [bx + 6, 28 + by], [hx - 1, hy + 1], 1.6, 1.0, '#ff637d');
    // 颈腹细密熔金喉鳞
    p.bezierRibbon([bx + 8, 36 + by], [bx + 8, 29 + by], [hx - 1, hy + 4], 1.8, 1.1, '#f2bd41');
    // 颈背三道锐利黄金龙脊鳍
    p.setPart(SPRITE_PART.HEADWEAR);
    p.poly([[bx + 2, 33 + by], [bx - 2, 30 + by], [bx + 4, 29 + by]], '#ffe478', true);
    p.poly([[bx + 3, 27 + by], [bx, 23 + by], [bx + 6, 24 + by]], '#ffe885', true);
    p.poly([[hx - 5, hy + 1], [hx - 7, hy - 3], [hx - 2, hy - 1]], '#fff5bd', true);

    // 双对优雅长后掠「S 弯象牙金龙角 + 尖锐龙颊棘」
    p.bezierRibbon([hx - 3, hy - 2], [hx - 11, hy - 10], [hx - 17, Math.max(4, hy - 8)], 3.2, 0.8, '#b5741a');
    p.bezierRibbon([hx - 3, hy - 3], [hx - 10, hy - 10], [hx - 16, Math.max(4, hy - 8)], 1.4, 0.5, '#fff4ad', true);
    p.bezierRibbon([hx, hy - 3], [hx - 5, hy - 11], [hx - 11, Math.max(3, hy - 12)], 2.8, 0.7, '#d9982b');
    p.bezierRibbon([hx, hy - 4], [hx - 5, hy - 11], [hx - 10, Math.max(3, hy - 12)], 1.2, 0.5, '#ffffff', true);
    p.poly([[hx - 3, hy + 2], [hx - 8, hy + 4], [hx - 3, hy + 5]], '#ffe066');

    // 纤长俊厉贵族黑红龙首（精致 14×7 黄金比例，彻底告别大头霸王龙！）
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.poly(
      [
        [hx - 5, hy - 3],
        [hx + 2, hy - 5],
        [hx + 12, hy - 1],
        [hx + 14, hy + 2],
        [hx + 11, hy + 3],
        [hx - 4, hy + 3],
      ],
      '#300715',
    );
    p.poly(
      [
        [hx - 4, hy - 2],
        [hx + 2, hy - 4],
        [hx + 11, hy - 1],
        [hx + 13, hy + 2],
        [hx - 2, hy + 2],
      ],
      '#d92140',
    );
    p.line(hx - 3, hy - 2, hx + 2, hy - 4, '#ff788e', 1);
    p.line(hx + 2, hy - 4, hx + 11, hy - 1, '#ff788e', 1);
    p.line(hx + 10, hy - 1, hx + 13, hy - 3, '#ffe478', 1);
    p.px(hx + 11, hy + 1, '#fff8cc', true);

    // 咆哮龙口（深红喉腔纵深 + 吐息前端炽亮光核 + 锐利雪白错落犬齿！）
    const jawOpen = isAtk && (f === 1 || f === 2) ? 5 : isAtk && f === 0 ? 2 : 1;
    p.poly(
      [
        [hx - 1, hy + 2],
        [hx + 11, hy + 2],
        [hx + 9, hy + 5 + jawOpen],
        [hx - 2, hy + 5 + jawOpen],
      ],
      isAtk ? '#6e0d22' : '#18040e',
    );
    if (isAtk) {
      p.poly(
        [
          [hx + 3, hy + 3],
          [hx + 11, hy + 3],
          [hx + 10, hy + 4 + jawOpen],
          [hx + 3, hy + 4 + jawOpen],
        ],
        '#ff6a24',
        true,
      );
    }
    p.poly(
      [
        [hx - 3, hy + 4 + jawOpen],
        [hx + 10, hy + 4 + jawOpen],
        [hx + 8, hy + 7 + jawOpen],
        [hx - 3, hy + 6 + jawOpen],
      ],
      '#590d22',
    );
    p.hline(hx - 1, hy + 5 + jawOpen, 9, '#c92240');
    p.vline(hx + 10, hy + 2, 3, '#ffffff');
    p.vline(hx + 6, hy + 2, 2, '#ffffff');
    p.vline(hx + 3, hy + 2, 2, '#f2e8eb');
    p.vline(hx + 8, hy + 3 + jawOpen, 2, '#ffffff');
    p.px(hx + 5, hy + 4 + jawOpen, '#ffffff');

    // 威严斜眉脊下的狭长炽金龙瞳
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.line(hx - 1, hy - 2, hx + 5, hy - 1, '#1f040d', 2);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.line(hx + 1, hy - 1, hx + 4, hy, '#ffae1a', 1, true);
    p.hline(hx + 1, hy - 1, 3, '#fff899', true);
    p.px(hx + 3, hy, '#290710');
    p.px(hx + 1, hy - 1, '#ffffff', true);

    // [8] 攻击演出：蓄焰喉光 → 毁天灭地「极星红莲炽焰龙息」（严格收在 x<=61！）
    if (isAtk && f === 0) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(hx + 12, hy + 3, 3.8, 3.8, '#ff5924', true);
      p.ellipse(hx + 12, hy + 3, 2.0, 2.0, '#fff7bd', true);
      drawSparkStar64(p, hx + 15, hy, 2, '#ffe878');
    } else if (isAtk && (f === 1 || f === 2)) {
      p.setPart(SPRITE_PART.GLOW_FX);
      const endX = 61;
      const spread = f === 1 ? 13 : 8;
      p.poly([[hx + 9, hy + 2], [endX, hy + 3 - spread], [endX, hy + 5 + spread], [hx + 9, hy + 6]], '#e62038', true);
      p.poly([[hx + 10, hy + 3], [endX, hy + 3 - Math.round(spread * 0.68)], [endX, hy + 5 + Math.round(spread * 0.68)], [hx + 10, hy + 5]], '#ff8f24', true);
      p.poly([[hx + 10, hy + 3], [endX - 1, hy + 3 - Math.round(spread * 0.36)], [endX - 1, hy + 5 + Math.round(spread * 0.36)], [hx + 10, hy + 5]], '#fff499', true);
      p.line(hx + 11, hy + 4, endX - 1, hy + 4, '#ffffff', 2, true);
      drawSparkStar64(p, endX - 4, hy + 3 - spread + 2, 2, '#ffe878');
      drawSparkStar64(p, endX - 3, hy + 4 + spread - 2, 2, '#ffffff');
    }
  },
};

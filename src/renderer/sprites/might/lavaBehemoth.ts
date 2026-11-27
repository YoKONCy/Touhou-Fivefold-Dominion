/**
 * 9. 熔岩巨兽（武艺旧都 T4-B · 2×2 · 比蒙原型：碎甲重击无视 50% 防御 + 25% 抗火）
 * 史诗级重铸「地底火山巨兽 · 黑曜比蒙王」：
 * 雄浑银背大猩猩式前倾猛兽体态 + 高耸多面体黑曜岩甲肩峰与火山晶棘 + 多分支脉动地幔熔岩裂隙 +
 * 粗壮屈膝踏地岩甲巨足 + 低吼弯角熔炉巨口兽首 + 不成比例的超巨型弯曲碎甲熔金镰刀爪！
 */

import { drawSlashArc64, SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawSparkStar64, HD_MIGHT_BASE } from './helpers';

export const lavaBehemothSpec: SpriteRigSpec = {
  ...HD_MIGHT_BASE,
  backdropTop: '#170607',
  backdropBottom: '#3d0e0a',
  backdropGlow: '#ff661a',
  avatarCrop: { x: 18, y: 10, size: 36 },
  portraitCrop: { x: 1, y: 2, w: 62, h: 67 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const stride = isMove ? Math.round(pose.stride * 5.8) : 0;
    const lStepLift = isMove && pose.stride < 0 ? 3 : 0;
    const rStepLift = isMove && pose.stride > 0 ? 3 : 0;

    const bx =
      isAtk && (f === 1 || f === 2)
        ? 27
        : isAtk && f === 0
          ? 29
          : isHit
            ? 26
            : Math.round(29 + pose.leanX * 0.6);
    const by = Math.max(-1, Math.round(pose.breathY * 1.1 - pose.stepLift * 0.5));

    // 辅助函数：绘制黑曜石比蒙标志性「三根修长弯曲破甲熔金镰刀巨爪」（严格收于边界内！）
    const drawBehemothClaws = (wx: number, wy: number, spreadDeg: 'idle' | 'raise' | 'slash') => {
      const cx = (x: number) => Math.max(3, Math.min(60, Math.round(x)));
      const cy = (y: number) => Math.max(3, Math.min(66, Math.round(y)));
      p.setPart(SPRITE_PART.WEAPON);
      const specs: Array<{ mx: number; my: number; tx: number; ty: number }> =
        spreadDeg === 'slash'
          ? [
              { mx: wx + 7, my: wy - 7, tx: wx + 15, ty: wy - 4 },
              { mx: wx + 8, my: wy - 1, tx: wx + 16, ty: wy + 4 },
              { mx: wx + 6, my: wy + 5, tx: wx + 13, ty: wy + 12 },
            ]
          : spreadDeg === 'raise'
            ? [
                { mx: wx + 3, my: wy - 8, tx: wx + 11, ty: wy - 13 },
                { mx: wx + 6, my: wy - 4, tx: wx + 14, ty: wy - 6 },
                { mx: wx + 5, my: wy + 1, tx: wx + 12, ty: wy + 2 },
              ]
            : [
                { mx: wx + 6, my: wy - 3, tx: wx + 13, ty: wy + 3 },
                { mx: wx + 4, my: wy + 3, tx: wx + 11, ty: wy + 9 },
                { mx: wx + 1, my: wy + 6, tx: wx + 6, ty: wy + 13 },
              ];
      for (const c of specs) {
        p.bezierRibbon([cx(wx), cy(wy)], [cx(c.mx), cy(c.my)], [cx(c.tx), cy(c.ty)], 3.8, 0.9, '#5e140c');
        p.bezierRibbon([cx(wx + 1), cy(wy)], [cx(c.mx), cy(c.my - 1)], [cx(c.tx), cy(c.ty)], 2.2, 0.7, '#ff6e1a', true);
        p.bezierRibbon([cx(wx + 1), cy(wy - 1)], [cx(c.mx), cy(c.my - 1)], [cx(c.tx), cy(c.ty)], 1.0, 0.5, '#fff299', true);
        p.px(cx(c.tx), cy(c.ty), '#ffffff', true);
      }
    };

    // [1] 后景：喷涌火山火星的「锯齿状黑曜石背脊火山晶棘」+ 粗壮熔岩重尾！
    p.setPart(SPRITE_PART.BACK_ACC);
    // 粗犷岩甲短重尾（平衡巨兽重心！）
    const tailX = Math.max(4, bx - 22);
    p.bezierRibbon([bx - 12, 47 + by], [bx - 20, 52 + by], [tailX, 45 + by], 6.0, 2.2, '#211418');
    p.bezierRibbon([bx - 12, 46 + by], [bx - 19, 51 + by], [tailX + 1, 45 + by], 2.8, 1.0, '#4f353d');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.px(tailX, 45 + by, '#ff661a', true);

    // 4 座高低错落的黑曜火山背棘（带棱面受光与岩浆脊裂纹！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const spikes: Array<[number, number, number, number, number, number]> = [
      [bx - 19, 31 + by, Math.max(4, bx - 24), 19 + by, bx - 12, 24 + by],
      [bx - 13, 23 + by, bx - 16, Math.max(6, 10 + by), bx - 5, 18 + by],
      [bx - 4, 19 + by, bx - 4, Math.max(5, 7 + by), bx + 5, 18 + by],
      [bx + 4, 21 + by, bx + 9, Math.max(8, 10 + by), bx + 12, 22 + by],
    ];
    for (const [x1, y1, tx, ty, x2, y2] of spikes) {
      p.poly([[x1, y1], [tx, ty], [x2, y2]], '#24161b');
      p.poly([[Math.round((x1 + x2) * 0.5), Math.round((y1 + y2) * 0.5)], [tx, ty], [x2, y2]], '#523840');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.line(Math.round((x1 + x2) * 0.5), Math.round((y1 + y2) * 0.5) - 1, tx, ty + 2, '#ff661a', 1, true);
      p.px(tx, ty + 1, '#ffe066', true);
      p.setPart(SPRITE_PART.BACK_ACC);
    }

    // [2] 远侧后巨臂（蓄力时稳稳撑势，绝不与高举的近侧主爪在头顶重叠打架！）
    p.setPart(SPRITE_PART.BACK_ARM);
    const bHandX = isAtk && f === 0 ? bx + 16 : isAtk && (f === 1 || f === 2) ? bx + 18 : bx + 15;
    const bHandY = isAtk && f === 0 ? 48 + by : isAtk && (f === 1 || f === 2) ? 49 + by : 53 + by;
    p.bezierRibbon([bx + 8, 29 + by], [bx + 17, Math.round((29 + bHandY) * 0.5) + by], [bHandX, bHandY], 7.4, 5.4, '#1f1216');
    p.bezierRibbon([bx + 9, 29 + by], [bx + 17, Math.round((28 + bHandY) * 0.5) + by], [bHandX, bHandY - 1], 3.8, 2.8, '#4d333b');
    // 远侧利爪微探撑势
    p.setPart(SPRITE_PART.WEAPON);
    p.line(bHandX, bHandY, Math.min(58, bHandX + 7), Math.min(64, bHandY + 3), '#ff8024', 2, true);
    p.line(bHandX - 1, bHandY + 2, Math.min(56, bHandX + 5), Math.min(65, bHandY + 6), '#ffe066', 1, true);

    // [3] 强劲微屈蓄力的双后肢与黑曜熔岩兽足（4帧重兽踏地奔袭！）
    p.setPart(SPRITE_PART.LEGS);
    const lFootX = Math.max(8, bx - 15 - Math.round(stride * 0.75));
    const rFootX = Math.min(46, bx + 5 + Math.round(stride * 0.75));
    const lFootY = 66 - lStepLift;
    const rFootY = 66 - rStepLift;
    // 后方左后腿
    p.bezierRibbon([bx - 12, 46 + by], [bx - 19, 54 + by - Math.round(lStepLift * 0.5)], [lFootX, lFootY - 4], 9.4, 6.4, '#1e1215');
    p.bezierRibbon([bx - 11, 46 + by], [bx - 17, 54 + by - Math.round(lStepLift * 0.5)], [lFootX + 1, lFootY - 5], 5.4, 3.6, '#4a3139');
    p.poly([[lFootX - 5, lFootY - 5], [lFootX + 6, lFootY - 5], [lFootX + 8, lFootY], [lFootX - 6, lFootY]], '#2b1b20');
    p.px(lFootX + 7, lFootY - 1, '#ff9d2e', true);
    p.px(lFootX + 3, lFootY - 1, '#ffe066', true);
    // 前方右后腿（多面体石护膝 + 发光裂缝）
    p.bezierRibbon([bx - 2, 48 + by], [bx + 2, 55 + by - Math.round(rStepLift * 0.5)], [rFootX, rFootY - 4], 10.2, 6.8, '#26171c');
    p.bezierRibbon([bx - 1, 47 + by], [bx + 3, 54 + by - Math.round(rStepLift * 0.5)], [rFootX + 1, rFootY - 5], 6.0, 4.0, '#63444e');
    p.line(bx + 2, 52 + by, bx + 4, 57 + by - Math.round(rStepLift * 0.5), '#946e78', 1);
    p.poly([[rFootX - 5, rFootY - 5], [rFootX + 7, rFootY - 5], [rFootX + 9, rFootY], [rFootX - 6, rFootY]], '#332026');
    p.hline(rFootX - 4, rFootY - 4, 10, '#785560');
    p.px(rFootX + 8, rFootY - 1, '#ffe878', true);
    p.px(rFootX + 4, rFootY - 1, '#ff8f24', true);
    p.px(rFootX, rFootY - 1, '#ff591a', true);

    // [4] 雄浑驼峰山岳式「多面体黑曜岩甲躯干 + 多分支地幔熔岩裂隙网」（彻底告别黑椭圆+加号！）
    p.setPart(SPRITE_PART.TORSO);
    // 高耸宽阔前倾肩背 → 收束强健腰臀的猛兽轮廓
    p.poly(
      [
        [bx - 17, 45 + by],
        [bx - 20, 31 + by],
        [bx - 12, 19 + by],
        [bx + 4, 17 + by],
        [bx + 15, 25 + by],
        [bx + 14, 41 + by],
        [bx + 4, 50 + by],
        [bx - 10, 51 + by],
      ],
      '#1a0f13',
    );
    // 重叠黑曜岩甲块面（中灰紫岩 + 高光棱线）
    p.poly(
      [
        [bx - 15, 43 + by],
        [bx - 18, 31 + by],
        [bx - 11, 21 + by],
        [bx + 3, 19 + by],
        [bx + 12, 26 + by],
        [bx + 11, 40 + by],
        [bx + 2, 47 + by],
        [bx - 9, 48 + by],
      ],
      '#362329',
    );
    // 顶部与肩脊锐利石甲切面受光（一眼辨识坚硬厚重岩甲！）
    p.poly(
      [
        [bx - 15, 30 + by],
        [bx - 10, 21 + by],
        [bx + 2, 20 + by],
        [bx + 7, 26 + by],
        [bx - 4, 31 + by],
      ],
      '#593e47',
    );
    p.line(bx - 10, 21 + by, bx + 2, 20 + by, '#94707a', 1);
    p.line(bx - 15, 30 + by, bx - 10, 21 + by, '#7d5b65', 1);
    // 胸前棱角岩板 + 熔岩反光暗红底缘
    p.poly([[bx - 2, 33 + by], [bx + 11, 30 + by], [bx + 11, 41 + by], [bx + 1, 44 + by]], '#4d2b30');
    p.hline(bx, 42 + by, 9, '#9e2b18');

    // 地幔奔涌熔岩裂隙网（沿着岩甲板缝有机分叉，内炽金白核，极具高级熔岩质感！）
    p.setPart(SPRITE_PART.GLOW_FX);
    // 主裂谷：从左肩斜贯胸心至右肋
    p.bezierRibbon([bx - 12, 29 + by], [bx - 2, 35 + by], [bx + 10, 34 + by], 2.8, 1.4, '#e62e12', true);
    p.bezierRibbon([bx - 10, 29 + by], [bx - 1, 35 + by], [bx + 9, 34 + by], 1.2, 0.7, '#ffe059', true);
    // 上分支裂纹与下分支腹脉
    p.line(bx - 3, 25 + by, bx - 1, 35 + by, '#ff591a', 2, true);
    p.line(bx - 3, 26 + by, bx - 1, 35 + by, '#fff5a6', 1, true);
    p.line(bx - 1, 35 + by, bx - 5, 45 + by, '#ff4d1a', 2, true);
    p.line(bx - 1, 35 + by, bx + 4, 44 + by, '#ff8024', 1, true);
    // 胸膛熔炉心炽白爆光核
    p.ellipse(bx + 1, 35 + by, 2.4, 2.2, '#ffaa24', true);
    p.px(bx + 1, 35 + by, '#ffffff', true);

    // [5] 嵌在雄伟岩肩间前探低吼的「比蒙狮魔火山兽首」（粗犷岩甲狮鬃 + 双弯巨角 + V形熔炉咆哮獠牙口！）
    const hx = bx + 11 + (isAtk && (f === 1 || f === 2) ? 3 : 0);
    const hy = 27 + by + (isAtk && f === 0 ? -2 : 0);
    p.setPart(SPRITE_PART.NECK_HEAD);
    // 雄狮般粗犷棱角岩甲兽颅 + 突出吻梁（告别扁方盒头！）
    p.poly(
      [
        [hx - 10, hy - 7],
        [hx + 1, hy - 9],
        [hx + 11, hy - 4],
        [hx + 14, hy + 1],
        [hx + 10, hy + 9],
        [hx + 1, hy + 10],
        [hx - 9, hy + 7],
      ],
      '#1e1115',
    );
    p.poly(
      [
        [hx - 8, hy - 6],
        [hx + 1, hy - 8],
        [hx + 10, hy - 3],
        [hx + 12, hy + 1],
        [hx + 8, hy + 7],
        [hx + 1, hy + 8],
        [hx - 7, hy + 5],
      ],
      '#543942',
    );
    // 鼻梁与岩眉高光雕塑切面
    p.line(hx - 6, hy - 6, hx + 1, hy - 8, '#a6828e', 1);
    p.line(hx + 1, hy - 8, hx + 11, hy - 3, '#94707c', 1);
    p.poly([[hx - 7, hy + 1], [hx - 3, hy + 7], [hx - 9, hy + 5]], '#785560');
    // 凶悍双弯黑曜红纹巨角（清晰舒展，不挡眼！）
    p.setPart(SPRITE_PART.HEADWEAR);
    p.bezierRibbon([hx - 5, hy - 6], [hx - 12, hy - 12], [hx - 7, Math.max(5, hy - 16)], 4.0, 1.0, '#362126');
    p.bezierRibbon([hx - 5, hy - 7], [hx - 11, hy - 12], [hx - 7, Math.max(5, hy - 16)], 1.6, 0.6, '#ff7b29', true);
    p.bezierRibbon([hx + 1, hy - 7], [hx + 8, hy - 14], [Math.min(58, hx + 14), Math.max(5, hy - 12)], 3.8, 1.0, '#4d323a');
    p.bezierRibbon([hx + 1, hy - 8], [hx + 8, hy - 14], [Math.min(58, hx + 14), Math.max(5, hy - 12)], 1.6, 0.6, '#ffe066', true);
    // 锯齿斜角熔炉咆哮兽口 + 锐利交错大犬齿（告别方红盒！）
    p.setPart(SPRITE_PART.NECK_HEAD);
    const jawDrop = isAtk ? 3 : 1;
    p.poly(
      [
        [hx - 1, hy + 1],
        [hx + 12, hy + 1],
        [hx + 11, hy + 4 + jawDrop],
        [hx + 3, hy + 6 + jawDrop],
        [hx - 2, hy + 4],
      ],
      '#7a0f0c',
    );
    p.setPart(SPRITE_PART.GLOW_FX);
    p.poly([[hx + 1, hy + 2], [hx + 10, hy + 2], [hx + 8, hy + 4 + jawDrop], [hx + 2, hy + 4 + jawDrop]], '#ff6e1a', true);
    p.hline(hx + 3, hy + 3, 6, '#ffe878', true);
    // 突出下颌岩骨包住口底
    p.setPart(SPRITE_PART.NECK_HEAD);
    p.poly([[hx - 1, hy + 4 + jawDrop], [hx + 10, hy + 4 + jawDrop], [hx + 7, hy + 8 + jawDrop], [hx, hy + 7 + jawDrop]], '#3d282f');
    p.hline(hx + 1, hy + 5 + jawDrop, 7, '#6e4e58');
    // 锐利交错大白獠牙
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.vline(hx + 10, hy + 1, 3, '#ffffff');
    p.vline(hx + 6, hy + 1, 2, '#ffffff');
    p.vline(hx + 2, hy + 1, 2, '#ffffff');
    p.vline(hx + 8, hy + 3 + jawDrop, 2, '#ffffff');
    p.vline(hx + 4, hy + 3 + jawDrop, 2, '#ffffff');
    // 凶恶斜压厚岩眉 + 炽白火山竖瞳
    p.line(hx - 1, hy - 4, hx + 5, hy - 2, '#170a0d', 2);
    p.line(hx + 5, hy - 2, hx + 11, hy - 3, '#170a0d', 2);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.rect(hx + 2, hy - 2, 3, 2, '#ffe866', true);
    p.rect(hx + 7, hy - 2, 3, 2, '#ffe866', true);
    p.px(hx + 3, hy - 2, '#ffffff', true);
    p.px(hx + 8, hy - 2, '#ffffff', true);

    // [6] 近侧超雄壮屈肘岩甲前臂 + 比蒙究极招牌「遮天碎甲黑曜熔金巨镰爪」！！
    p.setPart(SPRITE_PART.FRONT_ARM);
    let elX = bx - 10;
    let elY = 44 + by;
    let wrX = bx + 2;
    let wrY = 48 + by;
    let clawMode: 'idle' | 'raise' | 'slash' = 'idle';
    if (isAtk && f === 0) {
      // 高举蓄力撕甲咆哮（单举近侧巨爪清晰亮剑，绝不与远手缠绕！）
      elX = bx - 9;
      elY = 26 + by;
      wrX = bx - 2;
      wrY = 17 + by;
      clawMode = 'raise';
    } else if (isAtk && (f === 1 || f === 2)) {
      // 狂暴挥爪撕裂铁甲（严格收于 x<=60 零裁切！）
      elX = bx + 3;
      elY = 42 + by;
      wrX = bx + 16;
      wrY = 40 + by;
      clawMode = 'slash';
    }
    // 粗犷厚重前臂石甲 + 腕甲熔岩纹
    p.bezierRibbon([bx - 8, 31 + by], [elX, elY], [wrX, wrY], 10.0, 7.6, '#1f1216');
    p.bezierRibbon([bx - 7, 30 + by], [elX + 1, elY - 1], [wrX, wrY - 1], 6.4, 4.8, '#4a323a');
    p.bezierRibbon([bx - 6, 29 + by], [elX + 2, elY - 2], [wrX, wrY - 2], 2.4, 1.8, '#7a5863');
    // 臂甲炽橙熔岩裂缝
    p.setPart(SPRITE_PART.GLOW_FX);
    p.line(bx - 6, 33 + by, elX + 2, elY, '#ff591a', 1, true);
    p.line(elX + 2, elY, wrX - 1, wrY - 1, '#ffaa24', 1, true);
    // 巨爪根部岩甲护腕
    p.setPart(SPRITE_PART.FRONT_ARM);
    p.ellipse(wrX, wrY, 5.0, 4.4, '#2e1d23');
    p.ellipse(wrX + 0.5, wrY - 0.5, 3.6, 3.0, '#63444e');
    // 伸出三根修长弯曲、炽热熔金白刃的「碎甲巨镰爪」！
    drawBehemothClaws(wrX, wrY, clawMode);

    // [7] 攻击帧「碎甲重击 · 三重炽橙白金裂空爪痕波」（严格收于 x<=61！）
    if (isAtk && f === 0) {
      drawSparkStar64(p, wrX + 10, Math.max(5, wrY - 11), 2, '#ffe878');
      drawSparkStar64(p, bx + 1, 35 + by, 2, '#ffffff');
    } else if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, wrX + 3, wrY, 13, 15, -1.25, 1.15, '#c91c12', '#ff6e1a', '#ffe878');
      drawSlashArc64(p, wrX + 5, wrY + 1, 10, 12, -1.1, 1.0, '#ff4d1a', '#ffd147', '#ffffff');
      drawSparkStar64(p, 58, Math.max(6, wrY - 11), 2, '#ffe878');
      drawSparkStar64(p, 59, Math.min(62, wrY + 12), 2, '#ff6e1a');
    }
  },
};

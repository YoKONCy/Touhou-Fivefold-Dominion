/**
 * 2. 狂战士（武艺旧都 T1-A · 1×1 · 双击 + 死斗狂暴）
 * v5 彻底重铸「白狼毛披肩 × 炭黑漆甲 × 烈焰绯橙狂发 × 寒银月牙双巨斧」狂战少女：
 * 打破单调全红死闷配色，用雪白蓬松大狼皮毛领衬托炽亮烈焰长发与暗黑鎏金重甲，
 * 左手反握副月牙战斧、右手斜擎主月牙大重斧，双斧开合大开大合，爆发冰银×赤金十字双斩！
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawKawaiiHead64,
  drawSlashArc64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import {
  drawOniHorn64,
  drawSparkStar64,
  drawWrappedHand64,
  HD_MIGHT_BASE,
} from './helpers';

export const berserkerSpec: SpriteRigSpec = {
  ...HD_MIGHT_BASE,
  backdropTop: '#170a14',
  backdropBottom: '#3b141c',
  backdropGlow: '#ff6640',
  avatarCrop: { x: 13, y: 4, size: 37 },
  portraitCrop: { x: 2, y: 2, w: 60, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;

    const bx =
      isAtk && (f === 1 || f === 2)
        ? 27
        : isAtk && f === 0
          ? 28
          : isHit
            ? 27
            : Math.round(29 + pose.leanX * 0.95);
    const by = Math.max(-2, Math.round(pose.breathY * 1.0 - pose.stepLift * 0.9));
    const sway = pose.flutter * 1.8 + (isMove ? -2.2 : 0);
    const headY = 25 + by;

    /** 辅助绘制精致「真·半月弧刃重战斧」（黑钢斧脊 + 冰银渐层弧刃 + 炽红血槽 + 鎏金斧颈！） */
    const drawCrescentAxe = (
      hx: number,
      hy: number,
      dirX: number,
      dirY: number,
      bladeSide: 1 | -1,
      scale = 1.0,
      emissive = false,
    ) => {
      const len = Math.max(1, Math.hypot(dirX, dirY));
      const ux = dirX / len;
      const uy = dirY / len;
      const nx = -uy * bladeSide;
      const ny = ux * bladeSide;
      const clampX = (x: number) => Math.max(3, Math.min(60, Math.round(x)));
      const clampY = (y: number) => Math.max(3, Math.min(66, Math.round(y)));

      const buttX = clampX(hx - ux * 7 * scale);
      const buttY = clampY(hy - uy * 7 * scale);
      const topX = clampX(hx + ux * 11 * scale);
      const topY = clampY(hy + uy * 11 * scale);
      const neckX = clampX(hx + ux * 7.5 * scale);
      const neckY = clampY(hy + uy * 7.5 * scale);

      p.setPart(SPRITE_PART.WEAPON);
      // 深胡桃木包铁战斧长柄
      p.line(buttX, buttY, topX, topY, '#381912', 3);
      p.line(buttX, buttY - 1, topX, topY - 1, '#9e542a', 1);
      p.px(buttX, buttY, '#ffe078');
      p.ellipse(neckX, neckY, 2.0, 2.0, '#ffe078');
      // 斧背反尖刺（配重铁锥）
      p.poly(
        [
          [clampX(neckX - nx * 1), clampY(neckY - ny * 1)],
          [clampX(neckX - nx * 4.5 * scale + ux * 1.5), clampY(neckY - ny * 4.5 * scale + uy * 1.5)],
          [clampX(topX - ux * 1), clampY(topY - uy * 1)],
        ],
        '#475578',
      );
      // 宽阔犀利「半月弯弧钢刃」（外凸弧锋 + 内收弯颈，彻底告别方形白纸旗！）
      const hornTopX = clampX(topX + ux * 3.5 * scale + nx * 6.5 * scale);
      const hornTopY = clampY(topY + uy * 3.5 * scale + ny * 6.5 * scale);
      const edgeMidX = clampX(neckX + ux * 1.2 * scale + nx * 9.0 * scale);
      const edgeMidY = clampY(neckY + uy * 1.2 * scale + ny * 9.0 * scale);
      const hornBotX = clampX(neckX - ux * 4.2 * scale + nx * 6.2 * scale);
      const hornBotY = clampY(neckY - uy * 4.2 * scale + ny * 6.2 * scale);

      p.poly(
        [
          [clampX(topX + nx * 1), clampY(topY + ny * 1)],
          [hornTopX, hornTopY],
          [edgeMidX, edgeMidY],
          [hornBotX, hornBotY],
          [clampX(neckX - ux * 2.5 * scale + nx * 1.5), clampY(neckY - uy * 2.5 * scale + ny * 1.5)],
        ],
        '#28334d',
      );
      p.poly(
        [
          [clampX(topX + nx * 2), clampY(topY + ny * 2)],
          [hornTopX, hornTopY],
          [edgeMidX, edgeMidY],
          [hornBotX, hornBotY],
          [clampX(neckX - ux * 1.5 * scale + nx * 3.5 * scale), clampY(neckY - uy * 1.5 * scale + ny * 3.5 * scale)],
        ],
        '#b8d0f2',
        emissive,
      );
      // 雪白寒光半月锋刃外缘
      p.line(hornTopX, hornTopY, edgeMidX, edgeMidY, '#ffffff', 1, true);
      p.line(edgeMidX, edgeMidY, hornBotX, hornBotY, '#ffffff', 1, true);
      // 斧身内侧一抹醒目绯红血槽
      p.line(
        clampX(neckX + ux * 1.5 * scale + nx * 4.5 * scale),
        clampY(neckY + uy * 1.5 * scale + ny * 4.5 * scale),
        clampX(neckX - ux * 1.5 * scale + nx * 4.5 * scale),
        clampY(neckY - uy * 1.5 * scale + ny * 4.5 * scale),
        '#ff3b30',
        1,
      );
    };

    // [1] 后景：狂猎疾风翻飞的「炭黑红里破损短斗篷」+ 飘扬绯金头巾双长尾！
    p.setPart(SPRITE_PART.BACK_ACC);
    const capeX = Math.max(4, bx - 19 + Math.round(sway * 1.1));
    p.poly(
      [
        [bx - 7, 34 + by],
        [bx + 6, 34 + by],
        [bx + 6, 52 + by],
        [bx - 8 + Math.round(sway * 0.6), 55 + by],
        [capeX, 51 + by],
        [Math.max(5, capeX + 2), 41 + by],
      ],
      '#171826',
    );
    p.poly(
      [
        [bx - 6, 35 + by],
        [bx + 4, 35 + by],
        [bx - 7 + Math.round(sway * 0.5), 52 + by],
        [Math.max(6, capeX + 3), 49 + by],
      ],
      '#363b57',
    );
    p.line(Math.max(5, capeX + 2), 50 + by, bx - 7 + Math.round(sway * 0.6), 54 + by, '#e63946', 1);
    // 飘扬的绯金侧头巾尾带
    const tip1X = Math.max(4, bx - 20 + Math.round(sway));
    p.bezierRibbon([bx - 7, headY - 5], [bx - 14, headY - 2 + sway * 0.5], [tip1X, headY + 4 + sway], 2.8, 0.9, '#c91c2b');
    p.bezierRibbon([bx - 7, headY - 5], [bx - 13, headY - 3 + sway * 0.5], [tip1X + 1, headY + 3 + sway], 1.2, 0.6, '#ff9466');

    // [2] 炽亮层次感「烈焰绯橙挑金狼尾后发」（高亮度与暗黑战袍强对比！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY - 1],
        [bx + 9, headY - 1],
        [bx + 12 - sway * 0.3, 38 + by],
        [bx + 7 - sway * 0.4, 44 + by],
        [bx - 11 + sway * 0.6, 45 + by],
        [bx - 13 + sway * 0.6, 36 + by],
      ],
      '#7a1514',
    );
    p.poly(
      [
        [bx - 9, headY],
        [bx + 8, headY],
        [bx + 10 - sway * 0.3, 37 + by],
        [bx - 10 + sway * 0.5, 40 + by],
      ],
      '#e64526',
    );
    p.bezierRibbon([bx - 8, headY + 4], [bx - 12 + sway * 0.5, 36 + by], [bx - 10 + sway * 0.6, 43 + by], 2.0, 0.8, '#ffba52');

    // [3] 3/4 飒爽战步：雪白绷带缠腿 + 炭黑鎏金扣重铁短靴！
    drawStaggeredLegs64(p, bx, 53, 66, pose, {
      skinColor: '#ffe0cf',
      sockShadow: '#cbd4e6',
      sockLight: '#ffffff',
      shoeDark: '#161926',
      shoeMain: '#333b57',
      shoeHighlight: '#ffe078',
    });

    // [4] 左后臂：反握斜下伸出「副手半月寒银战斧」（拉出极帅不对称叉角剪影，绝不糊脸！）
    p.setPart(SPRITE_PART.BACK_ARM);
    const lHandX = isAtk && f === 0 ? Math.max(10, bx - 14) : isAtk && (f === 1 || f === 2) ? Math.max(11, bx - 13) : Math.max(12, bx - 12);
    const lHandY = isAtk && f === 0 ? 35 + by : 42 + by;
    drawSoftChibiArm64(p, bx - 7, 36 + by, lHandX, lHandY, '#ffe3d4', '#deb09c');
    if (isAtk && f === 0) {
      drawCrescentAxe(lHandX, lHandY, -0.7, -0.8, -1, 0.88, false);
    } else if (isAtk && (f === 1 || f === 2)) {
      drawCrescentAxe(lHandX, lHandY, -0.85, 0.55, 1, 0.88, false);
    } else {
      drawCrescentAxe(lHandX, lHandY, -0.7, 0.72, 1, 0.9, false);
    }
    drawWrappedHand64(p, lHandX, lHandY, '#1c2030', '#4d587a', '#ffe078');

    // [5] 高对比「炭黑底 × 绯红镶金锯齿战裙 + 雪白狼尾绒毛滚边」（层次分明拒绝一坨红！）
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 42 + by,
      waistW: 11.0,
      hemY: 54 + by,
      hemW: 29,
      tiltRight: 1.0,
      archDepth: 2.3,
      waveLobes: 4,
      waveAmp: 1.9,
      swayX: -pose.leanX * 0.5 + sway * 0.8,
      colors: {
        deep: '#121524',
        shadow: '#222840',
        main: '#3a4266',
        light: '#5a6696',
        highlight: '#8998cf',
      },
      trimBand: {
        offsetFromHem: 2.0,
        thickness: 1.5,
        color: '#ff4747',
        shadowColor: '#8c151f',
      },
      petticoat: {
        peekDepth: 2.0,
        shade: '#cfd8eb',
        main: '#f5f8ff',
        highlight: '#ffffff',
      },
    });
    // 正前方绯红虎纹挂腰甲片 + 耀眼黄金腰扣
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly([[bx - 4, 42 + by], [bx + 5, 42 + by], [bx + 6 + sway * 0.2, 51 + by], [bx + 1 + sway * 0.2, 53 + by], [bx - 5 + sway * 0.2, 51 + by]], '#a61b26');
    p.line(bx - 4, 42 + by, bx - 5 + sway * 0.2, 51 + by, '#ffe078', 1);
    p.line(bx + 5, 42 + by, bx + 6 + sway * 0.2, 51 + by, '#ffe078', 1);
    p.hline(bx - 6, 41 + by, 13, '#1f2436');
    p.hline(bx - 6, 42 + by, 13, '#f2c44d');
    p.rect(bx - 2, 41 + by, 5, 3, '#fff5b8');
    p.px(bx, 42 + by, '#ff3326', true);

    // [6] 炭黑收腰战甲胸铠 + 超高颜值「蓬松雪白大狼毛披肩领」（一秒打破全红沉闷！）
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 34 + by], [bx + 6, 34 + by], [bx + 6, 42 + by], [bx - 5, 42 + by]], '#181c2b');
    p.poly([[bx - 4, 34 + by], [bx + 5, 34 + by], [bx + 4, 41 + by], [bx - 4, 41 + by]], '#303752');
    // 胸前炽红交叉绑带与金饰
    p.line(bx - 4, 35 + by, bx + 5, 41 + by, '#e6323e', 1);
    p.line(bx + 5, 35 + by, bx - 4, 41 + by, '#ff6363', 1);
    p.px(bx, 38 + by, '#ffe878');
    // 标志性奢华蓬松雪白狼毛肩领（强反差高光环绕双肩，狂野维京×旧都鬼族美感！）
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly(
      [
        [bx - 12, 34 + by],
        [bx - 6, 32 + by],
        [bx + 6, 32 + by],
        [bx + 12, 34 + by],
        [bx + 10, 39 + by],
        [bx + 4, 37 + by],
        [bx, 39 + by],
        [bx - 4, 37 + by],
        [bx - 10, 39 + by],
      ],
      '#b8c4db',
    );
    p.poly(
      [
        [bx - 11, 34 + by],
        [bx - 5, 33 + by],
        [bx + 5, 33 + by],
        [bx + 11, 34 + by],
        [bx + 9, 37 + by],
        [bx, 37 + by],
        [bx - 9, 37 + by],
      ],
      '#ffffff',
    );
    p.px(bx - 9, 36 + by, '#dbe4f5');
    p.px(bx + 9, 36 + by, '#dbe4f5');

    // [7] 俏丽嚣张狂战少女颜 + 琥珀赤金大眼 + 小虎牙 + 烈焰绯橙挑金发 + 黑曜鎏金立体弯角！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff7f0',
      skinMain: '#ffe3d4',
      skinShade: '#deb09c',
      lashColor: '#290e1a',
      irisDark: '#8c1a0a',
      irisMid: '#ff5224',
      irisGlow: '#fff278',
      blushColor: '#ff8a8a',
      vampireFang: true,
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#6e1212',
      dark: '#b8281c',
      mid: '#f25c2e',
      light: '#ffa64d',
      spec: '#fff2a6',
      leftLockLen: 11,
      rightLockLen: 10,
      fluff: 1,
      bobFlare: true,
      sway,
    });
    // 精致贴合弧形黑金鬼纹额饰 + 饱满立体弯翘黑红金纹双鬼角（自然贴合发际线生长！）
    p.setPart(SPRITE_PART.HEADWEAR);
    p.hline(bx - 5, headY - 8, 10, '#261724');
    p.hline(bx - 3, headY - 9, 6, '#ffe078');
    p.px(bx, headY - 8, '#ff3344', true);
    drawOniHorn64(p, bx - 5, headY - 7, bx - 11, headY - 11, bx - 10, Math.max(4, headY - 17), {
      baseWidth: 3.4,
      shadowColor: '#241024',
      mainColor: '#8c2234',
      hiColor: '#ffb099',
      ringColor: '#ffe478',
    });
    drawOniHorn64(p, bx + 5, headY - 7, bx + 11, headY - 11, bx + 10, Math.max(4, headY - 17), {
      baseWidth: 3.4,
      shadowColor: '#241024',
      mainColor: '#8c2234',
      hiColor: '#ffb099',
      ringColor: '#ffe478',
    });

    // [8] 右前臂：大开大合斜擎「主手寒银血槽半月大重斧」+ 冰银赤金双层暴裂旋斩！
    p.setPart(SPRITE_PART.FRONT_ARM);
    let rHandX = bx + 12;
    let rHandY = 40 + by - Math.round(pose.armAction * 1.5);
    if (isAtk && f === 0) {
      // 蓄力帧：右臂向身侧外上方高扬拉满（绝不把斧头插到脸前面！）
      rHandX = bx + 14;
      rHandY = 33 + by;
    } else if (isAtk && (f === 1 || f === 2)) {
      rHandX = bx + 15;
      rHandY = 39 + by;
    }
    drawSoftChibiArm64(p, bx + 7, 36 + by, rHandX, rHandY, '#ffe3d4', '#deb09c');

    if (isAtk && f === 0) {
      drawCrescentAxe(rHandX, rHandY, 0.55, -0.85, 1, 1.0, false);
    } else if (isAtk && (f === 1 || f === 2)) {
      drawCrescentAxe(rHandX, rHandY, 0.9, 0.4, 1, 1.0, true);
    } else {
      drawCrescentAxe(rHandX, rHandY, 0.65, -0.78, 1, 1.0, false);
    }
    drawWrappedHand64(p, rHandX, rHandY, '#1c2030', '#4d587a', '#ffe078');

    // 蓄力与爆发双色高级斩光（冰蓝寒锋 × 炽红金焰，零裁切！）
    if (isAtk && f === 0) {
      drawSparkStar64(p, Math.min(59, rHandX + 9), Math.max(5, rHandY - 11), 2, '#ffe878');
      drawSparkStar64(p, Math.max(4, lHandX - 6), Math.max(5, lHandY - 9), 2, '#ff5940');
    } else if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, bx + 18, 37 + by, 13, 15, -1.2, 1.05, '#c91c2b', '#ff6624', '#ffe878');
      drawSlashArc64(p, bx + 20, 38 + by, 10, 12, -1.05, 0.9, '#59b8ff', '#dcf5ff', '#ffffff');
      drawSparkStar64(p, Math.min(59, bx + 31), 25 + by, 2, '#ffe878');
      drawSparkStar64(p, Math.min(59, bx + 30), 48 + by, 2, '#ff5247');
    }
  },
};

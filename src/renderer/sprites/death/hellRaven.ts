/**
 * 4. 地狱鸦（T2-B · 2×1 飞行三翼裂袭：4层分叉飞羽炽焰大鸦翼 + 飘扬烈焰领巾 + 酷飒狩衣鸦娘 + 双伴飞炽瞳渡鸦！）
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawCuteRibbonBow64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSlashArc64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawFlyingTuckedLegs64, HD_BASE } from './helpers';

export const hellRavenSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#1c0a14',
  backdropBottom: '#3d1424',
  backdropGlow: '#ff5c33',
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const bx = isAtk && (f === 1 || f === 2) ? 26 : isMove ? 31 : Math.round(29 + pose.leanX * 0.9);
    const by = isMove
      ? [-4, 1, 0, -3][f % 4]
      : Math.round(Math.sin(phase) * 1.8 + pose.breathY - pose.stepLift - 1);
    // 飞行时 4 帧剧烈扑腾大鸦翼：0高展冲顶 → 1全力下扫拍风甩火星 → 2低掠滑翔 → 3回扬振羽！
    const flap = isMove ? [-7, 11, 4, -5][f % 4] : Math.round(Math.sin(phase) * 3.0 + pose.flutter * 1.4);
    const sway = isMove ? 2.8 + (f % 2 === 0 ? 0.8 : -0.5) : pose.flutter * 1.8;
    const headY = 22 + by;

    // [1] 华丽「浑厚层叠黑羽 · 4 尾分叉炽焰大鸦翼」（翼体饱满连贯，仅外 25% 优雅分叉出焰羽梢！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const drawFeatheredRavenWing = (dir: -1 | 1, span: number, liftY: number) => {
      const shX = bx + dir * 4;
      const shY = 33 + by + Math.round(liftY * 0.35);
      const elbowX = bx + dir * Math.round(span * 0.58);
      const elbowY = 22 + by + liftY + Math.round(flap * 0.65);
      const feathers: Array<[number, number]> = [
        [span, 18 + liftY + flap],
        [Math.round(span * 1.03), 24 + liftY + Math.round(flap * 0.95)],
        [Math.round(span * 0.88), 30 + liftY + Math.round(flap * 0.7)],
        [Math.round(span * 0.65), 36 + liftY + Math.round(flap * 0.45)],
      ];
      // 浑厚饱满的主翼羽面（深靛黑基底 + 清晰蓝紫覆羽层，彻底告别散碎火柴棒！）
      p.poly(
        [
          [shX, shY],
          [elbowX, elbowY],
          [bx + dir * Math.round(span * 0.92), feathers[0][1] + by],
          [bx + dir * Math.round(span * 0.94), feathers[1][1] + by],
          [bx + dir * Math.round(span * 0.82), feathers[2][1] + by],
          [bx + dir * Math.round(span * 0.58), feathers[3][1] + by],
          [bx + dir * Math.round(span * 0.35), 39 + by + Math.round(liftY * 0.4)],
          [shX, shY + 6],
        ],
        '#1b142b',
      );
      // 中层覆羽蓝紫羽面层次（大色块羽层立体光！）
      p.poly(
        [
          [shX + dir * 2, shY + 1],
          [elbowX, elbowY + 1],
          [bx + dir * Math.round(span * 0.76), feathers[1][1] + by - 1],
          [bx + dir * Math.round(span * 0.6), feathers[2][1] + by - 1],
          [shX + dir * 4, shY + 4],
        ],
        '#3a2c5e',
      );
      // 外沿 4 根优雅收尖的弧形飞羽羽尖 + 深红→橙金自然燃焰过渡！
      for (let i = 0; i < feathers.length; i++) {
        const [fxDist, fyBase] = feathers[i];
        const tx = bx + dir * fxDist;
        const ty = fyBase + by;
        const rootX = bx + dir * Math.round(fxDist * 0.65);
        const rootY = Math.round((shY + ty) * 0.52);
        p.bezierRibbon([rootX, rootY], [Math.round((rootX + tx) * 0.52), Math.round((rootY + ty) * 0.52) - 1], [tx, ty], 3.4, 1.0, '#241b3b');
        p.line(Math.round((rootX + tx) * 0.55), Math.round((rootY + ty) * 0.55), tx, ty, '#c92639', 1);
        p.line(Math.round(rootX * 0.25 + tx * 0.75), Math.round(rootY * 0.25 + ty * 0.75), tx, ty, i < 2 ? '#ff5929' : '#ff8c38', 1, true);
        p.px(tx, ty, i < 2 ? '#ffe478' : '#ffb84d', true);
      }
      // 上缘覆羽柔和蓝紫脊光
      p.bezierRibbon([shX + dir, shY], [elbowX, elbowY], [bx + dir * Math.round(span * 0.88), feathers[0][1] + by], 2.0, 0.9, '#6e57a6');
    };
    drawFeatheredRavenWing(-1, isMove ? 26 : 25, isMove ? -1 : -1);
    drawFeatheredRavenWing(1, isMove ? 22 : 21, isMove ? -6 : -7);
    // 飞行猛烈下拍帧（f === 1）：双大鸦翼下方甩出炽红金焰拍风气浪与火星！
    if (isMove && f === 1) {
      p.setPart(SPRITE_PART.GLOW_FX);
      p.bezierRibbon([bx - 24, 33 + by], [bx - 25, 42 + by], [bx - 16, 47 + by], 1.8, 0.5, '#ff5929', true);
      p.bezierRibbon([bx + 19, 30 + by], [bx + 22, 38 + by], [bx + 15, 44 + by], 1.6, 0.5, '#ffb84d', true);
      p.px(bx - 25, 38 + by, '#ffe885', true);
      p.px(bx + 21, 34 + by, '#ffffff', true);
    }

    // 从腰后优雅 S 型轻扬的深红腰带缎尾（彻底避开左手臂，绝不显得像左手拿棍子！）
    p.setPart(SPRITE_PART.BACK_ACC);
    p.bezierRibbon([bx - 5, 42 + by], [bx - 12 + sway * 0.7, 45 + by], [bx - 17 + sway, 49 + by], 3.0, 1.0, '#9e142f');
    p.bezierRibbon([bx - 6, 42 + by], [bx - 12 + sway * 0.7, 45 + by], [bx - 16 + sway, 48 + by], 1.4, 0.6, '#ff3d57');

    // [2] 乌黑带靛紫羽毛光泽的飘逸后发
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 10 - sway * 0.4, 40 + by],
        [bx + 4 - sway * 0.5, 44 + by],
        [bx - 9 + sway * 0.7, 45 + by],
        [bx - 12 + sway * 0.7, 38 + by],
      ],
      '#191429',
    );
    p.poly([[bx - 8, headY + 1], [bx + 7, headY + 1], [bx + 7, 38 + by], [bx - 9, 39 + by]], '#332852');

    // [3] 双腿（待机/攻击 3/4 斜错步；飞行时微屈后收轻盈掠空！）
    const ravenLegColors = {
      sockShadow: '#231b38',
      sockLight: '#47386e',
      shoeDark: '#8c1026',
      shoeMain: '#eb2845',
      shoeHighlight: '#ffd966',
      skinColor: '#ffe3d1',
    };
    if (isMove) {
      drawFlyingTuckedLegs64(p, bx, 51, by, ravenLegColors);
    } else {
      drawStaggeredLegs64(p, bx, 51, 65, pose, ravenLegColors);
    }

    // [4] 左后臂：雪白短袖 + 2px 软萌少女小臂（优雅外展控鸦！）
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 34.5 + by, '#d6cee3', '#ffffff', '#e62945', 'left');
    drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 13, 39 + by);
    p.rect(bx - 15, 37 + by, 3, 2, '#ffe3d1');

    // [5] 酷飒靛黑紫和风狩衣蓬蓬短裙 + 炽红与鎏金双色裙边 + 雪白蓬纱衬裙！
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 40 + by,
      waistW: 10,
      hemY: 50 + by,
      hemW: 27,
      tiltRight: 1.0,
      archDepth: 2.4,
      waveLobes: 3.5,
      waveAmp: 1.6,
      swayX: -pose.leanX * 0.5 + sway * 0.8,
      colors: {
        deep: '#1a142e',
        shadow: '#2c224d',
        main: '#453573',
        light: '#6852a6',
        highlight: '#967fd6',
      },
      trimBand: {
        offsetFromHem: 2.0,
        thickness: 1.4,
        color: '#ff4252',
        shadowColor: '#b31b31',
      },
      petticoat: {
        peekDepth: 2.1,
        shade: '#d4cadb',
        main: '#fff8f5',
        highlight: '#ffffff',
      },
    });

    // [6] 洁白和风交领狩衣上衣 + 鲜红收腰护胸 + 鎏金太阳腰扣
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 31 + by], [bx + 5, 31 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#ffffff');
    p.poly([[bx - 4, 34 + by], [bx + 5, 34 + by], [bx + 5, 40 + by], [bx - 4, 40 + by]], '#cc1e3b');
    p.poly([[bx - 3, 35 + by], [bx + 4, 35 + by], [bx + 4, 39 + by], [bx - 3, 39 + by]], '#f03551');
    // 洁白交领 V 襟
    p.poly([[bx - 4, 31 + by], [bx + 4, 31 + by], [bx + 1, 35 + by], [bx, 35 + by]], '#ffffff');
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.hline(bx - 5, 40 + by, 11, '#ffd452');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(bx + 1, 37 + by, 1.8, 1.8, '#ff7326', true);
    p.px(bx + 1, 37 + by, '#fff5a6', true);

    // [7] 活泼飒爽鸦娘圆脸 + 炽金赤红 4×4 锐瞳 + 蓝紫光泽黑羽发 + 灵动呆毛 + 鲜红大蝴蝶结！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#fff6ee',
      skinMain: '#ffe2d1',
      skinShade: '#e8ad99',
      lashColor: '#241029',
      irisDark: '#a61229',
      irisMid: '#f23838',
      irisGlow: '#ffdb59',
      blushColor: '#ff91a6',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#19142b',
      dark: '#2d234a',
      mid: '#4a3b75',
      light: '#7b66b3',
      spec: '#c7b8f0',
      leftLockLen: 11,
      rightLockLen: 10,
      fluff: 2,
      sway,
    });
    // 头顶灵动羽状呆毛
    p.setPart(SPRITE_PART.FRONT_HAIR);
    p.bezierRibbon([bx + 1, headY - 10], [bx + 5, headY - 15], [bx + 8, headY - 13], 1.6, 0.7, '#3c2e61');
    p.px(bx + 4, headY - 14, '#9a84d6');
    // 俏丽鲜红大丝带蝴蝶结
    drawCuteRibbonBow64(p, bx - 7, headY - 9, {
      leftSpan: 5.5,
      rightSpan: 4.5,
      wingHeight: 4.5,
      tailLen: 7,
      sway,
      dark: '#a31029',
      main: '#f22749',
      light: '#ff8599',
      part: SPRITE_PART.HEADWEAR,
    });

    // [8] 右前臂泡泡袖 + 2px 软萌少女小臂燃起炽焰利爪
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 34.5 + by, '#d6cee3', '#ffffff', '#e62945', 'right');
    const handX = isAtk && (f === 1 || f === 2) ? bx + 15 : bx + 11;
    const handY = isAtk && f === 0 ? 30 + by : 38 + by;
    drawSoftChibiArm64(p, bx + 8, 36 + by, handX, handY);
    p.rect(handX - 1, handY - 1, 3, 2, '#ffe2d1');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.ellipse(handX + 3, handY, 2.5, 2.3, '#ff4824', true);
    p.ellipse(handX + 3, handY - 0.4, 1.3, 1.2, '#ffe885', true);
    p.px(handX + 3, handY - 1, '#ffffff', true);

    // [9] 灵魂标志：两只清晰展翅飞翔的「炽瞳小地狱渡鸦」（经典双翼展翅鸟影 + 独立干净净空站位！）
    const drawMiniRaven = (cx: number, cy: number, wingTilt: number) => {
      p.setPart(SPRITE_PART.WEAPON);
      // 后远小翼 + 前近展翅大翼（清晰飞鸟双翼轮廓，绝不再像黑墨团！）
      p.poly([[cx + 1, cy - 1], [cx + 5, cy - 5 + wingTilt], [cx + 4, cy - 1]], '#2b2047');
      p.poly([[cx - 1, cy - 1], [cx - 7, cy - 6 + wingTilt], [cx - 5, cy], [cx - 2, cy + 1]], '#1a132e');
      p.line(cx - 1, cy - 1, cx - 6, cy - 5 + wingTilt, '#6d57a6', 1);
      p.px(cx - 7, cy - 6 + wingTilt, '#ff5938', true);
      // 纤巧鸟尾羽 + 立体黑蓝圆身 + 尖锐亮金鸟喙 + 炽红灵眸！
      p.line(cx - 2, cy + 1, cx - 6, cy + 3, '#2b2047', 2);
      p.ellipse(cx, cy, 3.2, 2.2, '#231a3d');
      p.ellipse(cx + 0.5, cy - 0.5, 2.0, 1.3, '#574487');
      p.poly([[cx + 2, cy - 2], [cx + 6, cy - 1], [cx + 3, cy + 1]], '#ffd252'); // 清晰尖鸟喙
      p.setPart(SPRITE_PART.GLOW_FX);
      p.px(cx + 2, cy - 1, '#ff2e4d', true); // 炽红鸟瞳
    };
    const rBob = Math.round(Math.sin(phase + 1.2) * 1.8);
    const miniFlap = isMove ? [-5, 5, 2, -3][f % 4] : Math.round(flap * 0.35);
    // 左下伴鸦（独立清爽落位在裙摆左下方，飞行时同步剧烈扑翼！）
    drawMiniRaven(Math.max(9, bx - 19), 56 + by + rBob, miniFlap);
    // 右下/右前伴鸦（待机悬于右下净空，攻击时低空疾掠突袭避开右翼与上爪弧！）
    const r2x = Math.min(55, isAtk && (f === 1 || f === 2) ? bx + 25 : bx + 22);
    const r2y = (isAtk && (f === 1 || f === 2) ? 53 : 53) + by - rBob;
    drawMiniRaven(r2x, r2y, -miniFlap);

    // 攻击爆发：三翼裂袭炽红金白三重爪弧！
    if (isAtk && (f === 1 || f === 2)) {
      p.setPart(SPRITE_PART.GLOW_FX);
      drawSlashArc64(p, bx + 16, 35 + by, 19, 17, -1.15, 0.9, '#ff2614', '#ffa833', '#ffffff');
      drawSlashArc64(p, bx + 13, 35 + by, 15, 13, -1.0, 0.8, '#ff4d29', '#ffe066', '#ffffff');
    }
  },
};

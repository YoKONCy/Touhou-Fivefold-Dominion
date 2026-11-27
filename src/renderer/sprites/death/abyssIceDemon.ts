/**
 * 9. 深渊冰魔（T3 召唤 · 暗系寒冰抗性：冰晶角与冰翼冰魔少女 + 冰蓝蓬裙 + 晶棱冰枪）
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawGothicBatWings64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSlashArc64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawWrappedHand, HD_BASE } from './helpers';

export const abyssIceDemonSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0b1833',
  backdropBottom: '#193566',
  backdropGlow: '#66f0ff',
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const phase = pose.phase * Math.PI * 2;
    const bx = isAtk && (f === 1 || f === 2) ? 27 : Math.round(30 + pose.leanX * 0.9);
    const by = Math.round(pose.breathY * 1.2 - pose.stepLift * 1.2);
    const flap = Math.round(Math.sin(phase) * 2.5 + pose.flutter);
    const sway = pose.flutter * 1.6;
    const headY = 23 + by;

    // [1] 璀璨棱晶极寒冰翼（3/4 展开的冰蓝恶魔晶翼！）
    drawGothicBatWings64(p, bx - 1, 36 + by, {
      leftSpan: 22,
      rightSpan: 16,
      height: 15,
      flap,
      boneDark: '#162859',
      boneLight: '#82f0ff',
      webDark: '#234a8f',
      webMain: '#4794eb',
      webLight: '#9ee8ff',
      webGlow: '#ffffff',
    });

    // [2] 冰晶湛蓝长后发
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 9, headY],
        [bx + 10 - sway * 0.4, 42 + by],
        [bx + 5 - sway * 0.5, 48 + by],
        [bx - 8 + sway * 0.6, 49 + by],
        [bx - 12 + sway * 0.7, 41 + by],
      ],
      '#1b408a',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 7, headY + 1],
        [bx + 8 - sway * 0.3, 41 + by],
        [bx - 9 + sway * 0.5, 42 + by],
      ],
      '#3d7de0',
    );

    // [3] 3/4 斜错步雪白过膝袜 + 湛蓝冰晶小鞋
    drawStaggeredLegs64(p, bx, 51, 65, pose, {
      sockShadow: '#cde0f5',
      sockLight: '#ffffff',
      shoeDark: '#193b80',
      shoeMain: '#3875e0',
      shoeHighlight: '#b8f7ff',
    });

    // [4] 左后臂：雪白泡泡袖 + 2px 软萌少女小臂（左上方悬浮透亮棱晶冰块！）
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6.5, 34.5 + by, '#c7ddf5', '#ffffff', '#3896f0', 'left');
    drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 13, 39 + by, '#fff5f5', '#d9c2d4');
    p.rect(bx - 15, 37 + by, 3, 2, '#fff5f5');
    p.setPart(SPRITE_PART.GLOW_FX);
    const shardY = 23 + by + Math.round(Math.sin(phase) * 1.8);
    p.poly([[bx - 21, shardY - 4], [bx - 18, shardY], [bx - 21, shardY + 4], [bx - 24, shardY]], '#38ccff', true);
    p.poly([[bx - 21, shardY - 3], [bx - 19, shardY], [bx - 21, shardY + 2], [bx - 23, shardY]], '#c2f7ff', true);
    p.px(bx - 21, shardY - 1, '#ffffff', true);

    // [5] 晶莹天蓝波浪哥特冰霜洋装 + 雪白霜纹滚边 + 冰白蕾丝衬裙！
    drawCleanAnimeSkirt64(p, {
      waistX: bx + 0.5,
      waistY: 40 + by,
      waistW: 10,
      hemY: 51 + by,
      hemW: 30,
      tiltRight: 1.0,
      archDepth: 2.5,
      waveLobes: 3.5,
      waveAmp: 1.6,
      swayX: -pose.leanX * 0.5 + sway * 0.85,
      colors: {
        deep: '#1f4e99',
        shadow: '#3b82d6',
        main: '#66bdf7',
        light: '#a3e2ff',
        highlight: '#e3f9ff',
      },
      trimBand: {
        offsetFromHem: 2.0,
        thickness: 1.3,
        color: '#ffffff',
        shadowColor: '#bfe3ff',
      },
      petticoat: {
        peekDepth: 2.2,
        shade: '#bfd8f2',
        main: '#f2fbff',
        highlight: '#ffffff',
      },
    });

    // [6] 深蓝束腰冰魔礼服上衣 + 冰晶菱石胸针 + 洁白蕾丝领
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#1e3c7a');
    p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#3566bd');
    p.hline(bx - 4, 32 + by, 8, '#ffffff');
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.hline(bx - 5, 40 + by, 11, '#b8f2ff');
    p.setPart(SPRITE_PART.GLOW_FX);
    p.poly([[bx + 1, 34 + by], [bx + 3, 36 + by], [bx + 1, 38 + by], [bx - 1, 36 + by]], '#70f5ff', true);
    p.px(bx + 1, 35 + by, '#ffffff', true);

    // [7] 娇俏雪肤圆脸 + 璀璨深海冰蓝 4×4 宝石大眼 + 冰蓝大集群发冠 + 一对晶莹发光冰晶魔角！
    drawKawaiiHead64(p, bx, headY, pose, {
      skinLight: '#ffffff',
      skinMain: '#fff2f5',
      skinShade: '#d9bdd4',
      lashColor: '#17234d',
      irisDark: '#1246a6',
      irisMid: '#2e8cf5',
      irisGlow: '#99f7ff',
      blushColor: '#ff9ec2',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#193b82',
      dark: '#2b5ec2',
      mid: '#4d94f0',
      light: '#8cd4ff',
      spec: '#ebfbff',
      leftLockLen: 12,
      rightLockLen: 10,
      fluff: 2,
      sway,
    });
    // 一对修长微弯璀璨冰晶魔角（深海冰底托 + 透亮青晶 + 雪白晶尖，立体不撞猫耳！）
    p.setPart(SPRITE_PART.HEADWEAR);
    p.bezierRibbon([bx - 6, headY - 9], [bx - 12, headY - 14], [bx - 10, headY - 19], 3.2, 0.8, '#173a82');
    p.bezierRibbon([bx - 6, headY - 10], [bx - 11, headY - 14], [bx - 10, headY - 18], 1.8, 0.6, '#59e3ff', true);
    p.px(bx - 10, headY - 18, '#ffffff', true);
    p.bezierRibbon([bx + 6, headY - 9], [bx + 12, headY - 14], [bx + 10, headY - 19], 3.2, 0.8, '#173a82');
    p.bezierRibbon([bx + 6, headY - 10], [bx + 11, headY - 14], [bx + 10, headY - 18], 1.8, 0.6, '#59e3ff', true);
    p.px(bx + 10, headY - 18, '#ffffff', true);

    // [8] 右前臂泡泡袖 + 2px 软萌小臂真握持「极寒雪花晶棱冰枪」！
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6.5, 34.5 + by, '#c7ddf5', '#ffffff', '#3896f0', 'right');
    const handX = isAtk && (f === 1 || f === 2) ? bx + 14 : bx + 11;
    const handY = isAtk && f === 0 ? 28 + by : 39 + by - Math.round(pose.armAction * 2);
    drawSoftChibiArm64(p, bx + 8, 37 + by, handX, handY, '#fff2f5', '#d9bdd4');

    p.setPart(SPRITE_PART.WEAPON);
    if (isAtk && f === 0) {
      const topX = Math.min(58, handX + 12);
      const topY = handY - 14;
      p.line(handX - 6, handY + 7, topX, topY, '#1f59a8', 3);
      p.line(handX - 5, handY + 6, topX, topY, '#8cf5ff', 1, true);
      p.poly([[topX + 4, topY - 4], [topX - 3, topY], [topX + 1, topY + 4]], '#66eeff', true);
    } else if (isAtk && (f === 1 || f === 2)) {
      const tipX = Math.min(61, handX + 20);
      p.line(handX - 5, handY + 1, tipX - 6, handY - 2, '#1f59a8', 3);
      p.line(handX - 4, handY, tipX - 4, handY - 2, '#8cf5ff', 1, true);
      // 雪花晶棱护手 + 极寒冰枪刃
      p.vline(tipX - 9, handY - 6, 9, '#d6fbff', true);
      p.poly([[tipX, handY - 3], [tipX - 9, handY - 6], [tipX - 7, handY - 2], [tipX - 9, handY + 2]], '#59e8ff', true);
      p.line(tipX - 9, handY - 2, tipX, handY - 3, '#ffffff', 1, true);
      drawSlashArc64(p, bx + 17, 35 + by, 17, 14, -0.9, 0.85, '#33a3ff', '#99f7ff', '#ffffff');
    } else {
      const upLen = 19;
      const downLen = 19;
      const ux = 0.32;
      const topX = Math.min(57, Math.round(handX + upLen * ux));
      const topY = handY - upLen;
      const botX = Math.round(handX - downLen * ux);
      const botY = Math.min(64, handY + downLen);
      p.line(botX, botY, topX, topY, '#1f59a8', 3);
      p.line(botX + 1, botY - 1, topX, topY, '#75ebff', 1, true);
      // 精致冰晶十字雪花护手 + 透亮棱晶矛尖！
      p.line(topX - 4, topY + 2, topX + 4, topY + 4, '#ffffff', 1, true);
      p.poly([[topX + 2, topY - 7], [topX - 3, topY + 2], [topX, topY + 5], [topX + 4, topY + 2]], '#47dbff', true);
      p.poly([[topX + 2, topY - 6], [topX - 1, topY + 1], [topX + 2, topY + 2]], '#d9fbff', true);
      p.line(topX, topY + 2, topX + 2, topY - 6, '#ffffff', 1, true);
    }
    drawWrappedHand(p, handX, handY, '#fff2f5', '#ffffff', '#d9bdd4');
  },
};

/**
 * 秩序阵营 T2-A 兵种：幻法狸妖（creature_tanuki_illusionist）HD 像素绘谱。
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawKawaiiHead64,
  drawSlashArc64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawWrappedHand, HD_BASE } from './helpers';

/**
 * 5. 幻法狸妖（秩序 T2-A · 1×1 远程幻术施法）：
 *    栗棕卷发圆狸耳 + 发光翡翠变身神叶 + 超蓬松条纹大狸尾 + 蓝靛金纹振袖羽织 + 绘月大折扇与青金狸火！
 */
export const tanukiIllusionistRigSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0d192b',
  backdropBottom: '#1d3645',
  backdropGlow: '#66f0c8',
  avatarCrop: { x: 14, y: 5, size: 36 },
  portraitCrop: { x: 4, y: 3, w: 56, h: 64 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const bx = isAtk && (f === 1 || f === 2) ? 26 : Math.round(31 + pose.leanX * 0.85);
    const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.1);
    const sway = pose.flutter * 1.5;
    const headY = 25 + by;

    // [1] 超蓬松摇曳「条纹大狸猫尾」（深褐 + 焦糖棕交错粗环纹 + 奶油毛尖，招牌萌点！）
    p.setPart(SPRITE_PART.BACK_ACC);
    const tailWag = Math.round(Math.sin(pose.phase * Math.PI * 2) * 3.0);
    p.bezierRibbon([bx - 8, 50 + by], [bx - 19, 48 + by + tailWag * 0.5], [bx - 21, 34 + by + tailWag], 9.5, 6.2, '#5c361e');
    p.bezierRibbon([bx - 9, 49 + by], [bx - 18, 47 + by + tailWag * 0.5], [bx - 20, 35 + by + tailWag], 6.8, 4.4, '#b8763e');
    // 清晰狸尾深色环纹
    p.line(bx - 16, 48 + by + tailWag * 0.4, bx - 12, 43 + by + tailWag * 0.4, '#472613', 3);
    p.line(bx - 22, 42 + by + tailWag * 0.7, bx - 16, 40 + by + tailWag * 0.7, '#472613', 3);
    p.ellipse(bx - 21, 33 + by + tailWag, 3.6, 3.2, '#f5e1be'); // 奶油蓬松尾尖

    // [2] 栗棕微卷后发大发团
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.ellipse(bx - 1, headY + 4, 12.0, 10.6, '#59331c');
    p.ellipse(bx - 1, headY + 2, 10.4, 9.0, '#8f552e');

    // [3] 3/4 斜错步：洁白足袋 + 朱红系带精致木屐
    drawStaggeredLegs64(p, bx, 52, 65, pose, {
      sockShadow: '#d9d3e0',
      sockLight: '#ffffff',
      shoeDark: '#6b3b1e',
      shoeMain: '#b8733d',
      shoeHighlight: '#eb3856',
    });

    // [4] 后臂宽振袖 + 掌心托起一团跳动「青金幻术狸妖火」！
    p.setPart(SPRITE_PART.BACK_ARM);
    p.poly([[bx - 6, 36 + by], [bx - 14, 38 + by], [bx - 16, 46 + by], [bx - 8, 46 + by]], '#1b356e');
    p.poly([[bx - 6, 37 + by], [bx - 13, 39 + by], [bx - 14, 44 + by], [bx - 8, 44 + by]], '#305db3');
    p.line(bx - 15, 45 + by, bx - 9, 45 + by, '#ffe078', 1);
    p.ellipse(bx - 14, 38 + by, 2.0, 1.8, '#ffe6dc');
    p.setPart(SPRITE_PART.GLOW_FX);
    const fireBob = Math.round(Math.sin(pose.phase * Math.PI * 2 + 1.0) * 1.8);
    p.ellipse(bx - 15, 33 + by + fireBob, 3.2, 3.8, '#2be0b3', true);
    p.poly([[bx - 18, 33 + by + fireBob], [bx - 15, 27 + by + fireBob], [bx - 12, 33 + by + fireBob]], '#66ffe0', true);
    p.ellipse(bx - 15, 33 + by + fireBob, 1.6, 1.8, '#fff7bd', true);

    // [5] 紫绀和裙 + 蓝靛鎏金羽织上衣 + 绯红宽带蝴蝶结
    drawCleanAnimeSkirt64(p, {
      waistX: bx,
      waistY: 41 + by,
      waistW: 12.6,
      hemY: 54 + by,
      hemW: 30,
      swayX: sway,
      colors: {
        deep: '#191a42',
        shadow: '#272961',
        main: '#424796',
        light: '#6970cc',
        highlight: '#9fa6f2',
      },
      trimBand: {
        offsetFromHem: 2,
        thickness: 1.4,
        color: '#ffe078',
        shadowColor: '#cc9c35',
      },
      petticoat: {
        peekDepth: 1.8,
        shade: '#dfd5c5',
        main: '#faf5eb',
        highlight: '#ffffff',
      },
    });
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 7, 34 + by], [bx + 7, 34 + by], [bx + 8, 43 + by], [bx - 8, 43 + by]], '#1c3b7a');
    p.poly([[bx - 5, 35 + by], [bx + 5, 35 + by], [bx + 6, 42 + by], [bx - 6, 42 + by]], '#3263bf');
    // 交领白襟与金色边饰
    p.line(bx - 3, 34 + by, bx + 2, 40 + by, '#fff8eb', 2);
    p.line(bx + 3, 34 + by, bx - 1, 39 + by, '#ffe078', 1);
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.rect(bx - 7, 40 + by, 14, 4, '#bf2647');
    p.hline(bx - 6, 41 + by, 12, '#ff6685');
    p.rect(bx - 2, 40 + by, 4, 4, '#ffd966');

    // [6] 灵动金琥珀眼狡黠萌脸 + 栗棕蓬松卷刘海
    drawKawaiiHead64(p, bx, headY, pose, {
      irisDark: '#7a450e',
      irisMid: '#d98a1c',
      irisGlow: '#ffe878',
      lashColor: '#3d2010',
      blushColor: '#ffa3b0',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#472512',
      dark: '#6e3d20',
      mid: '#a66236',
      light: '#d68e58',
      spec: '#ffddb0',
      leftLockLen: 11,
      rightLockLen: 10,
      bobFlare: true,
      sway,
    });

    // [7] 毛茸茸圆润双狸耳 + 头顶发光「翡翠变身神叶」！
    p.setPart(SPRITE_PART.HEADWEAR);
    // 左圆狸耳
    p.ellipse(bx - 8, headY - 8, 4.0, 3.8, '#59331c');
    p.ellipse(bx - 8, headY - 8, 2.8, 2.6, '#b06d3c');
    p.ellipse(bx - 8, headY - 7, 1.6, 1.5, '#f2d9b8');
    // 右圆狸耳
    p.ellipse(bx + 7, headY - 8, 4.0, 3.8, '#59331c');
    p.ellipse(bx + 7, headY - 8, 2.8, 2.6, '#c47b47');
    p.ellipse(bx + 7, headY - 7, 1.6, 1.5, '#f5e1c4');
    // 发光翡翠变身神叶（顶于头心微倾！）
    const leafTilt = Math.round(sway * 0.5);
    p.poly(
      [
        [bx - 2, headY - 10],
        [bx + 3 + leafTilt, headY - 16],
        [bx + 8 + leafTilt, headY - 13],
        [bx + 2, headY - 9],
      ],
      '#198f58',
    );
    p.poly(
      [
        [bx - 1, headY - 10],
        [bx + 3 + leafTilt, headY - 15],
        [bx + 6 + leafTilt, headY - 13],
        [bx + 2, headY - 10],
      ],
      '#4cf29f',
      true,
    );
    p.line(bx, headY - 10, bx + 5 + leafTilt, headY - 14, '#d4ffeb', 1, true);

    // [8] 前振袖展开华丽「绘月金骨大折扇」+ 攻击挥洒青金幻术妖火！
    p.setPart(SPRITE_PART.FRONT_ARM);
    const fanPivotX = isAtk && f === 0 ? bx + 6 : isAtk && (f === 1 || f === 2) ? bx + 15 : bx + 11;
    const fanPivotY = isAtk && f === 0 ? 35 + by : 39 + by;
    p.poly([[bx + 5, 36 + by], [fanPivotX, fanPivotY - 2], [fanPivotX - 2, fanPivotY + 5], [bx + 5, 43 + by]], '#3263bf');
    p.line(fanPivotX, fanPivotY - 2, fanPivotX - 2, fanPivotY + 5, '#ffe078', 1);

    p.setPart(SPRITE_PART.WEAPON);
    const fanSpread = isAtk && (f === 1 || f === 2) ? 1.25 : 1.0;
    const fx = fanPivotX + 2;
    const fy = fanPivotY - 2;
    // 扇面深海月蓝 + 鎏金扇骨 + 发光弯月徽纹
    p.poly(
      [
        [fx, fy + 2],
        [fx - Math.round(4 * fanSpread), fy - Math.round(10 * fanSpread)],
        [fx + Math.round(5 * fanSpread), fy - Math.round(12 * fanSpread)],
        [fx + Math.round(12 * fanSpread), fy - Math.round(6 * fanSpread)],
        [fx + Math.round(10 * fanSpread), fy + 2],
      ],
      '#162e66',
    );
    p.poly(
      [
        [fx + 1, fy + 1],
        [fx - Math.round(2 * fanSpread), fy - Math.round(9 * fanSpread)],
        [fx + Math.round(5 * fanSpread), fy - Math.round(10 * fanSpread)],
        [fx + Math.round(10 * fanSpread), fy - Math.round(5 * fanSpread)],
        [fx + Math.round(8 * fanSpread), fy + 1],
      ],
      '#2b58b3',
    );
    // 鎏金扇骨与扇面新月
    p.line(fx, fy + 2, fx - Math.round(3 * fanSpread), fy - Math.round(9 * fanSpread), '#ffd966', 1);
    p.line(fx, fy + 2, fx + Math.round(10 * fanSpread), fy + 1, '#ffd966', 1);
    p.line(fx, fy + 2, fx + Math.round(4 * fanSpread), fy - Math.round(10 * fanSpread), '#ffe48a', 1);
    p.ellipse(fx + Math.round(5 * fanSpread), fy - Math.round(5 * fanSpread), 2.3, 2.3, '#ffe885', true);
    p.ellipse(fx + Math.round(6 * fanSpread), fy - Math.round(6 * fanSpread), 1.6, 1.6, '#2b58b3');
    drawWrappedHand(p, fanPivotX, fanPivotY);

    if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, bx + 19, 34 + by, 13, 13, -1.15, 0.95, '#29d9a8', '#ffe680', '#ffffff');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(Math.min(57, bx + 25), 30 + by, 2.5, 2.5, '#66ffe0', true);
      p.px(Math.min(57, bx + 25), 30 + by, '#ffffff', true);
      p.ellipse(Math.min(56, bx + 23), 40 + by, 2.1, 2.1, '#ffe880', true);
    }
  },
};

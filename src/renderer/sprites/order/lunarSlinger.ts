/**
 * 秩序阵营 T1-B 兵种：玉兔掷弹兵（creature_lunar_slinger）HD 像素绘谱。
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawFluffyBunnyEars64, drawWrappedHand, HD_BASE } from './helpers';

/**
 * 4. 玉兔掷弹兵（秩序 T1-B · 1×1 远程巨人杀手）：
 *    彻底大改与竹林妖怪兔拉开鲜明辨识度！—— 暖蜜桃金俏皮侧马尾 + 额间星晶侦察护目镜 + 翡翠游侠短披肩 +
 *    蓬松小白兔尾 + 斜挎红棕皮质星石弹药袋 + 大号雕花红木鎏金战弹弓随时拉弦瞄准炽金星石弹丸！
 */
export const lunarSlingerRigSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0b1833',
  backdropBottom: '#1c3457',
  backdropGlow: '#ffe078',
  avatarCrop: { x: 14, y: 4, size: 36 },
  portraitCrop: { x: 4, y: 2, w: 56, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const bx = isAtk && (f === 1 || f === 2) ? 24 : isAtk && f === 0 ? 25 : Math.round(27 + pose.leanX * 0.9);
    const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.1);
    const sway = pose.flutter * 1.5;
    const earTilt = Math.round(-pose.leanX * 0.6 + pose.flutter * 1.1);
    const headY = 26 + by;

    // [1] 背后灵动飞扬的翡翠青金边游侠短披风 + 蓬松雪白小绒尾 + 俏皮左侧高马尾！
    p.setPart(SPRITE_PART.BACK_ACC);
    // 俏皮外扬的翡翠游侠短披风（与竹林兔的蓝裙完全区隔，充满斥候游侠灵气！）
    p.poly(
      [
        [bx - 6, 36 + by],
        [bx + 5, 36 + by],
        [bx - 14 + sway, 49 + by],
        [bx - 18 + sway, 44 + by],
      ],
      '#14665e',
    );
    p.poly(
      [
        [bx - 5, 37 + by],
        [bx + 4, 37 + by],
        [bx - 13 + sway, 47 + by],
        [bx - 16 + sway, 44 + by],
      ],
      '#259c8c',
    );
    p.line(bx - 17 + sway, 45 + by, bx - 10 + sway * 0.7, 48 + by, '#ffe078', 1);
    // 软萌雪白小绒球兔尾
    p.ellipse(bx - 11, 50 + by + Math.round(pose.flutter), 4.2, 3.8, '#dce5f7');
    p.ellipse(bx - 11, 49 + by + Math.round(pose.flutter), 2.8, 2.5, '#ffffff');

    // 暖蜜桃金活泼侧马尾（从左脑后俏皮甩出！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.bezierRibbon([bx - 8, headY - 2], [bx - 16 + sway * 0.5, headY + 4], [bx - 18 + sway, headY + 13], 5.4, 1.8, '#a66824');
    p.bezierRibbon([bx - 8, headY - 1], [bx - 15 + sway * 0.4, headY + 4], [bx - 16 + sway * 0.8, headY + 11], 3.2, 1.1, '#f2b852');
    p.bezierRibbon([bx - 9, headY], [bx - 13 + sway * 0.3, headY + 3], [bx - 14 + sway * 0.6, headY + 7], 1.5, 0.7, '#ffe89c');
    p.ellipse(bx - 1, headY + 1, 10.4, 9.0, '#a66824');
    p.ellipse(bx - 1, headY, 9.0, 7.6, '#e8ad4a');

    // [2] 3/4 矫健游侠斜错步：雪白及膝袜 + 红棕色翻边鎏金扣游侠短靴！
    drawStaggeredLegs64(p, bx, 52, 65, pose, {
      sockShadow: '#d4dce8',
      sockLight: '#ffffff',
      shoeDark: '#633319',
      shoeMain: '#a65c32',
      shoeHighlight: '#ffe485',
      skinColor: '#ffe0cc',
    });

    // [3] 俏皮分层百褶游侠短裙（米白×暖褐金边×青碧荷叶内衬）+ 红棕斜背带与星石弹袋！
    drawCleanAnimeSkirt64(p, {
      waistX: bx,
      waistY: 43 + by,
      waistW: 12.2,
      hemY: 53 + by,
      hemW: 27,
      swayX: sway,
      colors: {
        deep: '#104a47',
        shadow: '#1b6e66',
        main: '#2ea394',
        light: '#5ed4c0',
        highlight: '#a6fff0',
      },
      trimBand: {
        offsetFromHem: 1.8,
        thickness: 1.5,
        color: '#ffe078',
        shadowColor: '#cc9c35',
      },
      petticoat: {
        peekDepth: 1.8,
        shade: '#e0d3c3',
        main: '#fff9ed',
        highlight: '#ffffff',
      },
    });
    // 米白猎装短罩衫 + 翡翠游侠短披肩领 + 棕皮斜背带与鼓鼓的发光黄金星石弹药袋！
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 6, 35 + by], [bx + 6, 35 + by], [bx + 6, 44 + by], [bx - 6, 44 + by]], '#e6dec8');
    p.poly([[bx - 5, 36 + by], [bx + 5, 36 + by], [bx + 5, 43 + by], [bx - 5, 43 + by]], '#fffcf2');
    p.poly([[bx - 8, 34 + by], [bx + 8, 34 + by], [bx + 6, 39 + by], [bx - 7, 39 + by]], '#1e7d73');
    p.hline(bx - 7, 38 + by, 14, '#ffe078');
    // 胸前斜挎深棕皮带
    p.line(bx - 5, 35 + by, bx + 5, 43 + by, '#7a4421', 2);
    p.px(bx, 39 + by, '#ffe478');
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.hline(bx - 6, 43 + by, 12, '#693a1b');
    // 腰侧鼓鼓的红棕皮质星石弹药袋（探出闪亮炽金星石弹丸！）
    p.rect(bx - 10, 43 + by, 7, 7, '#592e15');
    p.rect(bx - 9, 44 + by, 5, 5, '#9e592d');
    p.hline(bx - 9, 44 + by, 5, '#e09a5c');
    p.ellipse(bx - 7, 43 + by, 1.8, 1.6, '#ffe052', true);
    p.px(bx - 7, 43 + by, '#ffffff', true);

    // [4] 活泼草莓红宝石大眼萌脸 + 蜜桃金活力刘海 + 额间招牌「游侠黄铜青镜护目镜」+ 双立雪白兔耳！
    drawKawaiiHead64(p, bx, headY, pose, {
      irisDark: '#a31842',
      irisMid: '#eb3b6a',
      irisGlow: '#ff9ec0',
      lashColor: '#452414',
      blushColor: '#ffa3b5',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#915b1e',
      dark: '#c28332',
      mid: '#f2be59',
      light: '#ffe499',
      spec: '#fff9de',
      leftLockLen: 7,
      rightLockLen: 7,
      bobFlare: true,
      sway,
    });
    drawFluffyBunnyEars64(p, bx, headY - 9, {
      earTilt,
      leftFolded: false,
      earLen: 12,
    });
    // 额前超辨识度「斥候黄铜青光护目镜」（一下子把侦察掷弹兵的人设立得活灵活现！）
    p.setPart(SPRITE_PART.HEADWEAR);
    p.hline(bx - 9, headY - 8, 18, '#6e3d1e');
    p.ellipse(bx - 4, headY - 8, 3.0, 2.4, '#c7902e');
    p.ellipse(bx - 4, headY - 8, 1.9, 1.5, '#59e8ff', true);
    p.px(bx - 5, headY - 9, '#ffffff', true);
    p.ellipse(bx + 4, headY - 8, 3.0, 2.4, '#e0a93b');
    p.ellipse(bx + 4, headY - 8, 1.9, 1.5, '#59e8ff', true);
    p.px(bx + 3, headY - 9, '#ffffff', true);
    p.hline(bx - 1, headY - 8, 3, '#ffe480');

    // [5] 左后臂（主动拉紧弹弓金弦瞄准！）+ 右前臂高举大号雕花「月木鎏金战弹弓」！
    const forkX = isAtk && (f === 1 || f === 2) ? bx + 18 : isAtk && f === 0 ? bx + 18 : bx + 17;
    const forkY = isAtk ? 36 + by : 37 + by;
    const pouchX = isAtk && f === 0 ? bx + 5 : isAtk && (f === 1 || f === 2) ? forkX : bx + 9;
    const pouchY = isAtk && f === 0 ? forkY - 4 : forkY - 5;

    // 后臂拉弓手（待机拉弦瞄准，发射后利落向后甩臂释放弹性！）
    p.setPart(SPRITE_PART.BACK_ARM);
    drawPuffSleeve64(p, bx - 6, 36 + by, '#16635b', '#2ea394', '#ffe078', 'left');
    if (isAtk && (f === 1 || f === 2)) {
      drawSoftChibiArm64(p, bx - 6, 37 + by, bx - 13, 39 + by);
      p.rect(bx - 15, 38 + by, 3, 2, '#ffe6dc');
      p.px(bx - 14, 38 + by, '#fff7f2');
    } else {
      drawSoftChibiArm64(p, bx - 6, 37 + by, pouchX - 1, pouchY + 1);
    }

    // 前臂伸直稳举大号雕花月木战弹弓
    p.setPart(SPRITE_PART.FRONT_ARM);
    drawPuffSleeve64(p, bx + 6, 36 + by, '#16635b', '#2ea394', '#ffe078', 'right');
    drawSoftChibiArm64(p, bx + 6, 37 + by, forkX, forkY + 3);

    // 大号精致红木鎏金 Y 字战弹弓（轮廓粗实清晰，绝不糊成小细棍！）
    p.setPart(SPRITE_PART.WEAPON);
    p.line(forkX, forkY + 7, forkX, forkY - 1, '#6e3a19', 4);
    p.line(forkX, forkY + 6, forkX, forkY, '#bd753c', 2);
    // 宽张左右弓叉 + 鎏金叉头
    p.bezierRibbon([forkX, forkY], [forkX - 3, forkY - 4], [forkX - 5, forkY - 10], 3.0, 2.0, '#7d441f');
    p.bezierRibbon([forkX, forkY], [forkX - 2, forkY - 4], [forkX - 4, forkY - 9], 1.5, 1.0, '#d98f4e');
    p.bezierRibbon([forkX, forkY], [forkX + 4, forkY - 4], [forkX + 6, forkY - 10], 3.0, 2.0, '#8f4f24');
    p.bezierRibbon([forkX, forkY], [forkX + 3, forkY - 4], [forkX + 5, forkY - 9], 1.5, 1.0, '#f0a860');
    p.ellipse(forkX - 5, forkY - 10, 1.8, 1.6, '#ffe478', true);
    p.ellipse(forkX + 6, forkY - 10, 1.8, 1.6, '#ffe478', true);
    drawWrappedHand(p, forkX, forkY + 3);

    // 发光鎏金弹筋 + 炽金破甲星石弹丸（待机拉弦发光 → 蓄力爆亮 → 轰射破甲炮弹！）
    p.setPart(SPRITE_PART.GLOW_FX);
    if (isAtk && (f === 1 || f === 2)) {
      p.line(forkX - 5, forkY - 10, forkX + 6, forkY - 10, '#ffe885', 1, true);
      const shotX = Math.min(58, forkX + (f === 1 ? 15 : 19));
      const shotY = forkY - 8;
      p.line(forkX + 1, shotY, shotX, shotY, '#ffaa24', 4, true);
      p.hline(forkX + 3, shotY, Math.max(2, shotX - forkX - 3), '#ffffff', true);
      p.ellipse(shotX, shotY, 3.6, 3.2, '#ffe052', true);
      p.ellipse(shotX, shotY, 2.0, 1.8, '#ffffff', true);
      // 弹弓口十字破空闪光
      p.vline(forkX + 1, shotY - 5, 11, '#8cf4ff', true);
      p.px(forkX + 4, shotY - 4, '#ffe885', true);
      p.px(forkX + 4, shotY + 4, '#ffe885', true);
    } else {
      p.line(forkX - 5, forkY - 10, pouchX, pouchY, '#ffe478', 1, true);
      p.line(forkX + 6, forkY - 10, pouchX, pouchY, '#ffe478', 1, true);
      const orbR = isAtk && f === 0 ? 3.2 : 2.4;
      p.ellipse(pouchX, pouchY, orbR, orbR, '#ffaa24', true);
      p.ellipse(pouchX, pouchY, orbR * 0.6, orbR * 0.6, '#fff399', true);
      p.px(pouchX - 1, pouchY - 1, '#ffffff', true);
      drawWrappedHand(p, pouchX - 1, pouchY + 1);
    }
  },
};

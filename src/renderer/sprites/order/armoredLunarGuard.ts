/**
 * 秩序阵营 T2-B 兵种：重装月兔近卫（creature_armored_lunar_guard）HD 像素绘谱。
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
import { drawFluffyBunnyEars64, drawWrappedHand, HD_BASE } from './helpers';

/**
 * 6. 重装月兔近卫（秩序 T2-B · 1×1 50% 魔抗活体铁壁女骑）：
 *    彻底大改消除“灰白糊成一团”！—— 高对比铃仙系深靛紫波浪长发 × 璀璨宝石红眸 × 流线蓝金护耳雪白长兔耳 ×
 *    宽阔深绯红近卫重披风 × 深藏蓝金边重甲战裙与纯白绯红月纹前绶带 × 镜面冷银收腰胸铠 × 斜护蓝金秘银鸢盾 + 45° 红缨月牙重戟！
 */
export const armoredLunarGuardRigSpec: SpriteRigSpec = {
  ...HD_BASE,
  backdropTop: '#0d1430',
  backdropBottom: '#232452',
  backdropGlow: '#82b6ff',
  avatarCrop: { x: 14, y: 4, size: 36 },
  portraitCrop: { x: 4, y: 2, w: 56, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const f = pose.frame;
    const bx = isAtk && (f === 1 || f === 2) ? 24 : Math.round(29 + pose.leanX * 0.85);
    const by = Math.round(pose.breathY * 0.9 - pose.stepLift * 0.9);
    const sway = pose.flutter * 1.4;
    const earTilt = Math.round(-pose.leanX * 0.5 + pose.flutter * 0.8);
    const headY = 25 + by;

    // [1] 宽阔飞扬的深绯红×深海蓝双面皇宫近卫重披风（强对比反衬亮银铠与白兔耳！）
    p.setPart(SPRITE_PART.BACK_ACC);
    p.poly(
      [
        [bx - 8, 34 + by],
        [bx + 7, 34 + by],
        [bx + 9 - sway * 0.3, 58 + by],
        [bx - 18 + sway, 56 + by],
        [bx - 15 + sway * 0.6, 44 + by],
      ],
      '#5c0f24',
    );
    p.poly(
      [
        [bx - 7, 35 + by],
        [bx + 6, 35 + by],
        [bx + 7 - sway * 0.3, 55 + by],
        [bx - 15 + sway, 54 + by],
      ],
      '#a81e3f',
    );
    p.line(bx - 17 + sway, 55 + by, bx - 6 + sway * 0.4, 57 + by, '#ffe078', 1);

    // [2] 飘逸后扬的深靛紫波浪长发背影（铃仙/月都禁卫高对比黑紫发色！）
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 10, headY],
        [bx + 8, headY],
        [bx + 8, 42 + by],
        [bx - 13 + sway * 0.6, 46 + by],
        [bx - 16 + sway * 0.8, 37 + by],
      ],
      '#1b1540',
    );
    p.poly(
      [
        [bx - 8, headY + 1],
        [bx + 6, headY + 1],
        [bx + 6, 39 + by],
        [bx - 12 + sway * 0.5, 42 + by],
      ],
      '#3a307a',
    );
    p.bezierRibbon([bx - 8, headY + 4], [bx - 14 + sway * 0.5, headY + 12], [bx - 16 + sway, headY + 20], 3.2, 1.0, '#6a5ec2');

    // [3] 3/4 英姿跨步过膝镜面冷银骑士重长靴（深海蓝鞋底 + 亮银护胫 + 鎏金护膝！）
    drawStaggeredLegs64(p, bx, 51, 65, pose, {
      sockShadow: '#42568a',
      sockLight: '#c4dafc',
      shoeDark: '#172b61',
      shoeMain: '#2e55b5',
      shoeHighlight: '#ffe480',
    });
    p.setPart(SPRITE_PART.LEGS);
    p.px(bx - 4 - Math.round(pose.stride * 3.8), 55, '#ffe480');
    p.px(bx + 4 + Math.round(pose.stride * 3.8), 57, '#ffe480');

    // [4] 深皇室藏蓝战裙 + 纯白绯红月纹骑士前绶带 + 两侧锋利斜切镜面银挂甲！
    drawCleanAnimeSkirt64(p, {
      waistX: bx,
      waistY: 42 + by,
      waistW: 13.0,
      hemY: 54 + by,
      hemW: 29,
      swayX: sway * 0.4,
      colors: {
        deep: '#0e1b47',
        shadow: '#172f73',
        main: '#264fa8',
        light: '#4d7fe0',
        highlight: '#8cb5ff',
      },
      trimBand: {
        offsetFromHem: 1.8,
        thickness: 1.5,
        color: '#ffe078',
        shadowColor: '#cc9c35',
      },
      petticoat: {
        peekDepth: 1.5,
        shade: '#b5c6e3',
        main: '#e8f0ff',
        highlight: '#ffffff',
      },
    });
    // 中央高对比纯白绯红月纹前绶带（对标退魔剑士的高贵红白金焦点！）
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly([[bx - 2, 42 + by], [bx + 3, 42 + by], [bx + 4 + sway * 0.2, 55 + by], [bx - 2 + sway * 0.2, 55 + by]], '#ffffff');
    p.vline(bx + 1, 43 + by, 11, '#d9264a');
    p.px(bx + 1, 46 + by, '#ffe885', true);
    p.hline(bx - 2 + sway * 0.2, 54 + by, 6, '#ffe078');
    // 两侧锋利斜切镜面银挂甲裙片（带深钢蓝描影，告别灰糊！）
    p.poly([[bx - 10, 42 + by], [bx - 4, 42 + by], [bx - 6, 51 + by], [bx - 12, 49 + by]], '#586d9e');
    p.poly([[bx - 9, 43 + by], [bx - 5, 43 + by], [bx - 7, 49 + by], [bx - 11, 48 + by]], '#e6f0ff');
    p.poly([[bx + 4, 42 + by], [bx + 10, 42 + by], [bx + 12, 49 + by], [bx + 6, 51 + by]], '#6f87bd');
    p.poly([[bx + 5, 43 + by], [bx + 9, 43 + by], [bx + 11, 48 + by], [bx + 7, 49 + by]], '#ffffff');

    // [5] 3 阶镜面冷银收腰女骑士重胸铠 + 鲜明绯红骑士领结 + 雕金弧形重肩铠！
    p.setPart(SPRITE_PART.TORSO);
    p.poly([[bx - 7, 34 + by], [bx + 7, 34 + by], [bx + 6, 43 + by], [bx - 6, 43 + by]], '#45598a');
    p.poly([[bx - 6, 35 + by], [bx + 6, 35 + by], [bx + 5, 41 + by], [bx - 5, 41 + by]], '#c9dcf7');
    p.poly([[bx - 5, 35 + by], [bx + 3, 35 + by], [bx + 2, 39 + by], [bx - 4, 39 + by]], '#ffffff');
    // 绯红骑士V形领巾 + 鎏金胸章与腰带
    p.line(bx - 5, 34 + by, bx, 38 + by, '#d92347', 2);
    p.line(bx + 5, 34 + by, bx, 38 + by, '#ff4d70', 2);
    p.ellipse(bx, 38 + by, 2.0, 2.0, '#ffe478', true);
    p.px(bx, 38 + by, '#66e8ff', true);
    p.hline(bx - 6, 42 + by, 12, '#f2c44d');
    // 弧形蓝银镶金重肩铠
    p.poly([[bx - 11, 34 + by], [bx - 5, 33 + by], [bx - 5, 38 + by], [bx - 10, 39 + by]], '#355294');
    p.hline(bx - 10, 34 + by, 5, '#e8f2ff');
    p.hline(bx - 10, 38 + by, 5, '#ffe078');
    p.poly([[bx + 5, 33 + by], [bx + 11, 34 + by], [bx + 10, 39 + by], [bx + 5, 38 + by]], '#4a70bd');
    p.hline(bx + 5, 34 + by, 5, '#ffffff');
    p.hline(bx + 5, 38 + by, 5, '#ffe078');

    // [6] 超高对比铃仙系宝石红大眼少女颜 + 深靛紫柔顺前发 + 蓝钢金边贴耳护耳环与雪白兔耳！
    drawKawaiiHead64(p, bx, headY, pose, {
      irisDark: '#8f1238',
      irisMid: '#e0295c',
      irisGlow: '#ff94b5',
      lashColor: '#1f1238',
      blushColor: '#ff9eb8',
    });
    drawCleanAnimeHair64(p, bx, headY, {
      deep: '#19133d',
      dark: '#2c2463',
      mid: '#4d4199',
      light: '#7d72cf',
      spec: '#c8c2ff',
      leftLockLen: 11,
      rightLockLen: 10,
      sway,
    });
    drawFluffyBunnyEars64(p, bx, headY - 9, {
      earTilt,
      leftFolded: false,
      earLen: 12,
    });
    // 精致贴合耳根的蓝钢金边护耳环 + 细白金新月发箍（彻底告别笨重黄奶酪方块！）
    p.setPart(SPRITE_PART.HEADWEAR);
    p.hline(bx - 7, headY - 8, 14, '#e6f0ff');
    p.px(bx, headY - 9, '#66e8ff', true);
    p.px(bx - 2, headY - 9, '#ffe478', true);
    p.px(bx + 2, headY - 9, '#ffe478', true);
    // 左耳流线蓝钢护耳环
    p.line(bx - 8, headY - 10, bx - 3, headY - 9, '#2b4a94', 2);
    p.line(bx - 8, headY - 11, bx - 3, headY - 10, '#ffe078', 1);
    // 右耳流线蓝钢护耳环
    p.line(bx + 3, headY - 9, bx + 8, headY - 10, '#3a62bd', 2);
    p.line(bx + 3, headY - 10, bx + 8, headY - 11, '#ffe480', 1);

    // [7] 左前 3/4 立体斜护「深海蓝×鎏金秘银鸢形盾」（斜角透视立体护身，凸显 50% 魔抗铁壁！）
    p.setPart(SPRITE_PART.FRONT_ARM);
    const shX = bx - 12;
    const shY = 43 + by;
    p.poly(
      [
        [shX - 5, shY - 6],
        [shX + 5, shY - 9],
        [shX + 7, shY + 1],
        [shX + 1, shY + 10],
        [shX - 6, shY + 3],
      ],
      '#d9a434',
    );
    p.poly(
      [
        [shX - 4, shY - 5],
        [shX + 4, shY - 8],
        [shX + 6, shY + 1],
        [shX + 1, shY + 8],
        [shX - 5, shY + 2],
      ],
      '#193b87',
    );
    p.poly(
      [
        [shX - 3, shY - 4],
        [shX + 2, shY - 6],
        [shX + 2, shY + 3],
        [shX - 4, shY + 1],
      ],
      '#3d75e0',
    );
    p.line(shX - 5, shY - 6, shX + 5, shY - 9, '#ffffff', 1, true);
    // 盾心闪耀鎏金弯月纹章
    p.ellipse(shX + 1, shY - 1, 2.7, 2.7, '#ffe680', true);
    p.ellipse(shX + 2, shY - 2, 1.9, 1.9, '#193b87');
    p.px(shX, shY - 1, '#ffffff', true);

    // [8] 右臂银护手飒爽 45° 对角斜擎「绯缨寒光月牙重戟」！
    p.setPart(SPRITE_PART.FRONT_ARM);
    let handX = bx + 11;
    let handY = 40 + by;
    let shaftBotX = bx - 2;
    let shaftBotY = 58 + by;
    let shaftTopX = bx + 22;
    let shaftTopY = 17 + by;
    if (isAtk && f === 0) {
      handX = bx + 7;
      handY = 36 + by;
      shaftBotX = bx - 8;
      shaftBotY = 46 + by;
      shaftTopX = bx + 18;
      shaftTopY = 18 + by;
    } else if (isAtk && (f === 1 || f === 2)) {
      handX = bx + 14;
      handY = 40 + by;
      shaftBotX = bx - 4;
      shaftBotY = 42 + by;
      shaftTopX = bx + 27;
      shaftTopY = 36 + by;
    }
    p.line(bx + 7, 36 + by, handX, handY, '#8da4d1', 3);
    p.line(bx + 7, 35 + by, handX, handY - 1, '#ffffff', 1);

    p.setPart(SPRITE_PART.WEAPON);
    // 深金铜长戟杆（与银铠形成金属色差对比，清晰度拉满！）
    p.line(shaftBotX, shaftBotY, shaftTopX, shaftTopY, '#7a521b', 3);
    p.line(shaftBotX, shaftBotY - 1, shaftTopX, shaftTopY - 1, '#f2c966', 1);
    const dx = shaftTopX - shaftBotX;
    const dy = shaftTopY - shaftBotY;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    const neckX = Math.round(shaftTopX - ux * 6);
    const neckY = Math.round(shaftTopY - uy * 6);
    // 醒目自然垂落的仪仗绯红长枪缨（偏离戟杆柔和飘垂，绝不贴杆成袖套！）
    p.bezierRibbon([neckX, neckY], [neckX + 1, neckY + 5], [neckX - 2 + sway * 0.5, neckY + 10], 2.5, 0.9, '#b81a3c');
    p.bezierRibbon([neckX, neckY], [neckX + 2, neckY + 4], [neckX + 1 + sway * 0.4, neckY + 9], 1.6, 0.6, '#ff4d73');
    p.px(neckX, neckY + 1, '#ffe478');
    // 锋利寒光刺枪尖 + 苍蓝新月双斧刃
    p.poly(
      [
        [neckX + nx * 2.2, neckY + ny * 2.2],
        [shaftTopX + ux * 6, shaftTopY + uy * 6],
        [neckX - nx * 2.2, neckY - ny * 2.2],
      ],
      '#eef7ff',
      isAtk,
    );
    p.poly(
      [
        [neckX, neckY],
        [neckX + nx * 8 - ux * 2, neckY + ny * 8 - uy * 2],
        [shaftTopX + nx * 5.5 - ux * 1, shaftTopY + ny * 5.5 - uy * 1],
        [shaftTopX - ux * 2, shaftTopY - uy * 2],
      ],
      '#66c2ff',
      isAtk,
    );
    p.line(
      neckX + nx * 8 - ux * 2,
      neckY + ny * 8 - uy * 2,
      shaftTopX + nx * 5.5 - ux * 1,
      shaftTopY + ny * 5.5 - uy * 1,
      '#ffffff',
      1,
      true,
    );
    p.ellipse(neckX, neckY, 2.2, 2.2, '#ffe478');
    drawWrappedHand(p, handX, handY, '#cbd8f2', '#ffffff', '#6d7fa6');

    if (isAtk && (f === 1 || f === 2)) {
      drawSlashArc64(p, bx + 21, 36 + by, 13, 14, -1.15, 0.95, '#3b9eff', '#b8f0ff', '#ffffff');
      drawSlashArc64(p, bx + 23, 36 + by, 10, 11, -0.9, 0.85, '#ffe478', '#ffffff', '#ffffff');
    }
  },
};

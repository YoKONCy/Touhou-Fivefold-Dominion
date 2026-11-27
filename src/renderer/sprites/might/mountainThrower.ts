/**
 * 6. 掷山大力鬼（武艺旧都 T3-A · 2×2 · 远程完全 1 环 AOE 投岩 + 近战无衰减 + 攻城破障）
 * 彻底重铸的旧地狱「搬山泰坦鬼王」：
 * 倒三角铁塔赤红筋肉巨躯 + 狂野雪白狮鬃长发与弯翘象牙牛魔角 + 青铜鬼面肩铠与斜挎黑铁锁链 +
 * 立体垂褶虎皮战裙与注连绳赤玉腰带 + 单肩扛山（多面体熔岩裂脉巍峨山岩，绝不挡脸、零裁切！）
 */

import { drawSlashArc64, SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import {
  drawHollowRing64,
  drawIronChain64,
  drawOniHorn64,
  drawSparkStar64,
  HD_MIGHT_BASE,
} from './helpers';

export const mountainThrowerSpec: SpriteRigSpec = {
  ...HD_MIGHT_BASE,
  backdropTop: '#1f0e0a',
  backdropBottom: '#471e12',
  backdropGlow: '#ff8a3d',
  avatarCrop: { x: 18, y: 12, size: 34 },
  portraitCrop: { x: 1, y: 2, w: 62, h: 66 },
  hdDraw: (p: HdPixelPainter, pose: RigPose) => {
    const isAtk = pose.state === 'attack';
    const isMove = pose.state === 'move';
    const isHit = pose.state === 'hit';
    const f = pose.frame;
    const stride = isMove ? Math.round(pose.stride * 6.0) : 0;
    const lStepLift = isMove && pose.stride < 0 ? 3 : 0;
    const rStepLift = isMove && pose.stride > 0 ? 3 : 0;

    // 整体中心巧妙偏右留出左肩扛山的雄浑舞台，攻击时弓步前倾！
    const bx =
      isAtk && (f === 1 || f === 2)
        ? 27
        : isAtk && f === 0
          ? 34
          : isHit
            ? 28
            : Math.round(33 + pose.leanX * 0.7);
    const by = Math.max(-1, Math.round(pose.breathY * 1.1 - pose.stepLift * 0.7));
    const sway = pose.flutter * 1.5;

    // 辅助函数：绘制峻峭峥嵘的双峰不规则断崖山岩（告别圆铅球感，一眼认出劈下来的整块山峰！）
    const drawMountainBoulder = (cx: number, cy: number, radiusScale = 1.0, hot = false) => {
      const s = radiusScale;
      const clampX = (x: number) => Math.max(3, Math.min(60, Math.round(x)));
      const clampY = (y: number) => Math.max(3, Math.min(64, Math.round(y)));
      p.setPart(SPRITE_PART.WEAPON);
      // 峻峭九边形双峰岩崖轮廓（左主峰尖峭 + 右副岩台 + 锯齿底裂）
      p.poly(
        [
          [clampX(cx - 13 * s), clampY(cy + 3 * s)],
          [clampX(cx - 11 * s), clampY(cy - 3 * s)],
          [clampX(cx - 5 * s), clampY(cy - 11 * s)],
          [clampX(cx + 1 * s), clampY(cy - 7 * s)],
          [clampX(cx + 7 * s), clampY(cy - 10 * s)],
          [clampX(cx + 13 * s), clampY(cy - 2 * s)],
          [clampX(cx + 10 * s), clampY(cy + 6 * s)],
          [clampX(cx + 1 * s), clampY(cy + 9 * s)],
          [clampX(cx - 8 * s), clampY(cy + 7 * s)],
        ],
        '#282330',
      );
      // 中层棱面山岩块（暗灰紫底岩）
      p.poly(
        [
          [clampX(cx - 11 * s), clampY(cy + 2 * s)],
          [clampX(cx - 9 * s), clampY(cy - 3 * s)],
          [clampX(cx - 4 * s), clampY(cy - 9 * s)],
          [clampX(cx + 1 * s), clampY(cy - 6 * s)],
          [clampX(cx + 6 * s), clampY(cy - 8 * s)],
          [clampX(cx + 10 * s), clampY(cy - 1 * s)],
          [clampX(cx + 7 * s), clampY(cy + 5 * s)],
          [clampX(cx - 6 * s), clampY(cy + 5 * s)],
        ],
        '#574f66',
      );
      // 左侧尖峰强烈受光亮岩斜面（硬朗雕塑质感！）
      p.poly(
        [
          [clampX(cx - 9 * s), clampY(cy - 2 * s)],
          [clampX(cx - 4 * s), clampY(cy - 9 * s)],
          [clampX(cx + 1 * s), clampY(cy - 5 * s)],
          [clampX(cx - 2 * s), clampY(cy + 1 * s)],
        ],
        '#9c92b0',
      );
      // 右侧副峰次受光岩面
      p.poly(
        [
          [clampX(cx + 2 * s), clampY(cy - 5 * s)],
          [clampX(cx + 6 * s), clampY(cy - 8 * s)],
          [clampX(cx + 9 * s), clampY(cy - 2 * s)],
          [clampX(cx + 4 * s), clampY(cy)],
        ],
        '#7d7391',
      );
      p.line(clampX(cx - 9 * s), clampY(cy - 2 * s), clampX(cx - 4 * s), clampY(cy - 9 * s), '#e6dff2', 1);
      p.line(clampX(cx + 2 * s), clampY(cy - 6 * s), clampX(cx + 6 * s), clampY(cy - 8 * s), '#d4cce6', 1);
      // 岩体内部崩裂炽热熔岩裂脉（三叉裂纹！）
      p.setPart(SPRITE_PART.GLOW_FX);
      p.line(clampX(cx - 7 * s), clampY(cy + 3 * s), clampX(cx), clampY(cy), '#ff591a', 2, true);
      p.line(clampX(cx), clampY(cy), clampX(cx + 8 * s), clampY(cy + 2 * s), '#ff6e24', 1, true);
      p.line(clampX(cx), clampY(cy), clampX(cx + 1 * s), clampY(cy - 6 * s), '#ff9d2e', 1, true);
      p.px(clampX(cx), clampY(cy), hot ? '#ffffff' : '#ffe878', true);
      if (hot) {
        p.px(clampX(cx - 4 * s), clampY(cy + 1 * s), '#fff5b8', true);
      }
    };

    // [1] 后景：狂野飞扬的雪白狮鬃长后发
    p.setPart(SPRITE_PART.BACK_HAIR);
    p.poly(
      [
        [bx - 12, 20 + by],
        [bx + 10, 20 + by],
        [bx + 14 - sway * 0.3, 35 + by],
        [bx + 9, 41 + by],
        [bx - 13 + sway * 0.5, 42 + by],
        [bx - 16 + sway * 0.6, 31 + by],
      ],
      '#7a748c',
    );
    p.poly(
      [
        [bx - 10, 21 + by],
        [bx + 8, 21 + by],
        [bx + 11 - sway * 0.3, 34 + by],
        [bx - 11 + sway * 0.4, 37 + by],
      ],
      '#ebe6f5',
    );

    // [2] 粗壮屈膝扎马步的巨鬼双腿 + 黑铁铆钉重护胫与踏地战靴（4帧沉重泰坦大步迈进！）
    p.setPart(SPRITE_PART.LEGS);
    const lFootX = Math.max(11, bx - 12 - Math.round(stride * 0.85));
    const rFootX = Math.min(52, bx + 11 + Math.round(stride * 0.85));
    const lFootY = 66 - lStepLift;
    const rFootY = 66 - rStepLift;
    // 左后腿（暗面筋肉 + 铁护胫）
    p.bezierRibbon([bx - 8, 49 + by], [bx - 13, 56 + by - Math.round(lStepLift * 0.5)], [lFootX, lFootY - 4], 8.2, 5.8, '#6e1c16');
    p.bezierRibbon([bx - 7, 49 + by], [bx - 12, 56 + by - Math.round(lStepLift * 0.5)], [lFootX + 1, lFootY - 5], 4.8, 3.4, '#b83526');
    p.poly([[lFootX - 4, lFootY - 9], [lFootX + 4, lFootY - 9], [lFootX + 5, lFootY - 3], [lFootX - 5, lFootY - 3]], '#2e3345');
    p.hline(lFootX - 4, lFootY - 8, 8, '#7c88ab');
    p.poly([[lFootX - 5, lFootY - 4], [lFootX + 6, lFootY - 4], [lFootX + 7, lFootY], [lFootX - 6, lFootY]], '#3d2218');
    p.hline(lFootX - 4, lFootY - 3, 9, '#d99634');
    // 右前腿（受光筋肉 + 铁护胫）
    p.bezierRibbon([bx + 7, 49 + by], [bx + 12, 56 + by - Math.round(rStepLift * 0.5)], [rFootX, rFootY - 4], 8.6, 6.0, '#7a2018');
    p.bezierRibbon([bx + 8, 49 + by], [bx + 13, 56 + by - Math.round(rStepLift * 0.5)], [rFootX + 1, rFootY - 5], 5.2, 3.6, '#d9452e');
    p.line(bx + 11, 51 + by, bx + 13, 56 + by - Math.round(rStepLift * 0.5), '#ff8059', 1);
    p.poly([[rFootX - 4, rFootY - 9], [rFootX + 4, rFootY - 9], [rFootX + 5, rFootY - 3], [rFootX - 5, rFootY - 3]], '#384057');
    p.hline(rFootX - 4, rFootY - 8, 8, '#a6b5db');
    p.poly([[rFootX - 5, rFootY - 4], [rFootX + 7, rFootY - 4], [rFootX + 8, rFootY], [rFootX - 5, rFootY]], '#4a281c');
    p.hline(rFootX - 3, rFootY - 3, 10, '#ffe078');

    // [3] 立体波浪垂褶「东方虎皮鬼王战裙 + 粗麻注连绳赤玉大腰带」（彻底告别警戒线斑马短裤！）
    p.setPart(SPRITE_PART.APRON_WAIST);
    // 锯齿状自然虎皮下摆阴影与皮毛
    p.poly(
      [
        [bx - 13, 44 + by],
        [bx + 13, 44 + by],
        [bx + 17, 55 + by],
        [bx + 11, 58 + by],
        [bx + 6, 54 + by],
        [bx, 58 + by],
        [bx - 6, 54 + by],
        [bx - 12, 58 + by],
        [bx - 17, 55 + by],
      ],
      '#6e3a10',
    );
    p.poly(
      [
        [bx - 12, 44 + by],
        [bx + 12, 44 + by],
        [bx + 15, 54 + by],
        [bx + 10, 56 + by],
        [bx + 5, 52 + by],
        [bx, 56 + by],
        [bx - 5, 52 + by],
        [bx - 11, 56 + by],
        [bx - 15, 54 + by],
      ],
      '#e69e2e',
    );
    p.poly(
      [
        [bx - 7, 45 + by],
        [bx + 8, 45 + by],
        [bx + 10, 52 + by],
        [bx - 6, 52 + by],
      ],
      '#ffd166',
    );
    // 有机自然弧形虎斑（暗深棕渐变短纹，不再是斜直线警戒线！）
    p.bezierRibbon([bx - 11, 47 + by], [bx - 10, 50 + by], [bx - 13, 53 + by], 2.0, 0.8, '#2e150c');
    p.bezierRibbon([bx - 4, 47 + by], [bx - 2, 50 + by], [bx - 4, 52 + by], 2.2, 0.8, '#2e150c');
    p.bezierRibbon([bx + 4, 46 + by], [bx + 7, 49 + by], [bx + 5, 52 + by], 2.2, 0.8, '#2e150c');
    p.bezierRibbon([bx + 10, 48 + by], [bx + 12, 51 + by], [bx + 11, 54 + by], 1.8, 0.7, '#2e150c');
    // 粗犷麻金注连绳腰带 + 硕大鬼王金环扣 + 中央红穗
    p.rect(bx - 13, 42 + by, 26, 4, '#592914');
    p.hline(bx - 13, 43 + by, 26, '#f5d482');
    p.hline(bx - 12, 45 + by, 24, '#b87a24');
    p.ellipse(bx, 44 + by, 4.2, 3.2, '#ffd966');
    p.ellipse(bx, 44 + by, 2.2, 1.8, '#c91c2b');
    p.px(bx, 43 + by, '#fff8bd', true);

    // [4] 雄伟倒三角铁塔「赤红筋肉巨躯」（分明胸大肌、斜方肌、腹肌雕线 + 斜跨黑铁锁链！）
    p.setPart(SPRITE_PART.TORSO);
    p.poly(
      [
        [bx - 16, 28 + by],
        [bx + 16, 28 + by],
        [bx + 13, 43 + by],
        [bx - 13, 43 + by],
      ],
      '#781b16',
    );
    p.poly(
      [
        [bx - 14, 28 + by],
        [bx + 14, 28 + by],
        [bx + 11, 42 + by],
        [bx - 11, 42 + by],
      ],
      '#c93626',
    );
    // 立体左右饱满胸大肌与高光块面
    p.ellipse(bx - 6, 33 + by, 6.2, 4.4, '#e65539');
    p.ellipse(bx + 6, 33 + by, 6.2, 4.4, '#f26544');
    p.hline(bx - 9, 31 + by, 5, '#ff946b');
    p.hline(bx + 4, 31 + by, 5, '#ffa67a');
    // 清晰雕刻六块腹肌阴线
    p.vline(bx, 31 + by, 11, '#781b16');
    p.hline(bx - 7, 37 + by, 14, '#8c221a');
    p.hline(bx - 6, 40 + by, 12, '#8c221a');
    p.rect(bx - 5, 38 + by, 4, 2, '#eb6344');
    p.rect(bx + 2, 38 + by, 4, 2, '#f26e4b');
    // 斜跨胸膛的沉重玄铁鬼链
    drawIronChain64(
      p,
      [
        [bx + 10, 29 + by],
        [bx + 5, 33 + by],
        [bx, 37 + by],
        [bx - 5, 41 + by],
      ],
      SPRITE_PART.APRON_WAIST,
    );
    // 右肩威猛「青铜獠牙鬼面重肩铠」
    p.setPart(SPRITE_PART.APRON_WAIST);
    p.poly(
      [
        [bx + 10, 27 + by],
        [bx + 19, 29 + by],
        [bx + 18, 37 + by],
        [bx + 9, 36 + by],
      ],
      '#3d291c',
    );
    p.poly(
      [
        [bx + 11, 28 + by],
        [bx + 18, 30 + by],
        [bx + 17, 35 + by],
        [bx + 10, 35 + by],
      ],
      '#b8742c',
    );
    p.hline(bx + 11, 29 + by, 6, '#ffe078');
    p.poly([[bx + 14, 28 + by], [bx + 18, 24 + by], [bx + 17, 30 + by]], '#fff5d6');

    // [5] 威严凶悍「赤面鬼王巨首」（浓白狮眉 + 炽金怒瞳 + 暴喝獠牙大口 + 雄伟双弯象牙大牛角！）
    const hx = bx + (isAtk && (f === 1 || f === 2) ? 2 : 0);
    const hy = 22 + by;
    p.setPart(SPRITE_PART.NECK_HEAD);
    // 粗壮斜方肌颈托
    p.rect(hx - 6, hy + 4, 12, 5, '#9e261c');
    // 方阔有棱角的雄猛鬼面（告别圆卤蛋！）
    p.poly(
      [
        [hx - 9, hy - 5],
        [hx + 9, hy - 5],
        [hx + 10, hy + 4],
        [hx + 6, hy + 8],
        [hx - 6, hy + 8],
        [hx - 10, hy + 4],
      ],
      '#821d16',
    );
    p.poly(
      [
        [hx - 8, hy - 4],
        [hx + 8, hy - 4],
        [hx + 9, hy + 3],
        [hx + 5, hy + 7],
        [hx - 5, hy + 7],
        [hx - 9, hy + 3],
      ],
      '#de4831',
    );
    p.ellipse(hx, hy - 2, 6.2, 3.2, '#f56e4c');
    // 凌乱霸气雪白额前狮鬃与倒三角短须
    p.setPart(SPRITE_PART.FRONT_HAIR);
    p.poly([[hx - 9, hy - 4], [hx - 4, hy - 10], [hx + 1, hy - 7], [hx + 6, hy - 10], [hx + 9, hy - 4], [hx + 4, hy - 5], [hx, hy - 3], [hx - 5, hy - 5]], '#ebe6f5');
    p.hline(hx - 6, hy - 7, 12, '#ffffff');
    p.poly([[hx - 6, hy + 6], [hx + 6, hy + 6], [hx + 3, hy + 10], [hx, hy + 11], [hx - 3, hy + 10]], '#e8e2f2');
    // 浓白怒斜眉 + 炽金威目 + 尖耳
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.line(hx - 7, hy - 3, hx - 2, hy - 1, '#ffffff', 2);
    p.line(hx + 7, hy - 3, hx + 2, hy - 1, '#ffffff', 2);
    p.setPart(SPRITE_PART.GLOW_FX);
    p.rect(hx - 5, hy - 1, 3, 2, '#ffe866', true);
    p.rect(hx + 3, hy - 1, 3, 2, '#ffe866', true);
    p.px(hx - 4, hy - 1, '#ffffff', true);
    p.px(hx + 4, hy - 1, '#ffffff', true);
    // 咆哮大口与交错雪白獠牙
    p.setPart(SPRITE_PART.FACE_FEATURES);
    p.rect(hx - 5, hy + 2, 10, isAtk ? 4 : 3, '#38090c');
    p.hline(hx - 4, hy + 4, 8, '#a61c24');
    p.vline(hx - 4, hy + 2, 2, '#ffffff');
    p.vline(hx + 3, hy + 2, 2, '#ffffff');
    p.px(hx - 2, hy + 4, '#ffffff');
    p.px(hx + 1, hy + 4, '#ffffff');
    // 雄伟弯翘「象牙鎏金双牛魔角」（从额角向外弯再上挑，气势如虹且 y>=5 零裁切！）
    drawOniHorn64(p, hx - 7, hy - 4, hx - 14, hy - 6, Math.max(4, hx - 16), Math.max(5, hy - 14), {
      baseWidth: 4.2,
      shadowColor: '#7a6345',
      mainColor: '#e8d5b0',
      hiColor: '#ffffff',
      ringColor: '#f2b838',
    });
    drawOniHorn64(p, hx + 7, hy - 4, hx + 14, hy - 6, Math.min(59, hx + 16), Math.max(5, hy - 14), {
      baseWidth: 4.2,
      shadowColor: '#7a6345',
      mainColor: '#e8d5b0',
      hiColor: '#ffffff',
      ringColor: '#f2b838',
    });

    // [6] 筋肉虬结双巨臂 + 「单肩扛山 / 蓄力举山 / 狂暴掷山」全动态演出！！
    if (isAtk && f === 0) {
      // 蓄力帧：左巨臂高擎山岩燃起爆气环，右巨臂沉腰拉后蓄力（绝不横切挡住威猛鬼面！）
      const rockX = 16;
      const rockY = 17 + by;
      p.setPart(SPRITE_PART.BACK_ARM);
      p.bezierRibbon([bx - 12, 31 + by], [bx - 21, 27 + by], [rockX - 2, rockY + 6], 6.8, 5.0, '#8f221a');
      p.bezierRibbon([bx - 12, 30 + by], [bx - 20, 26 + by], [rockX - 2, rockY + 5], 4.0, 3.0, '#db452e');
      drawMountainBoulder(rockX, rockY, 1.0, true);
      p.setPart(SPRITE_PART.FRONT_ARM);
      p.bezierRibbon([bx + 13, 32 + by], [bx + 21, 36 + by], [bx + 16, 44 + by], 7.0, 5.2, '#a6291e');
      p.bezierRibbon([bx + 13, 31 + by], [bx + 20, 35 + by], [bx + 16, 43 + by], 4.2, 3.0, '#f2613f');
      p.ellipse(bx + 16, 44 + by, 4.4, 3.8, '#eb593b');
      // 蓄力赤金震荡气环
      drawHollowRing64(p, rockX, rockY, 13.5, 11.5, 0.88, '#ff4d1a', '#ffe066', '#ffffff');
    } else if (isAtk && (f === 1 || f === 2)) {
      // 投掷爆发帧：左臂后甩稳重心，右巨臂怒推出巍峨裂岩至前方，炸开碎石与破空气浪（严格 x<=60）！
      p.setPart(SPRITE_PART.BACK_ARM);
      p.bezierRibbon([bx - 12, 32 + by], [bx - 19, 39 + by], [Math.max(5, bx - 17), 47 + by], 6.4, 4.8, '#7a1c16');
      p.bezierRibbon([bx - 12, 31 + by], [bx - 18, 38 + by], [Math.max(6, bx - 16), 46 + by], 3.8, 2.8, '#c93826');
      const rockX = 48;
      const rockY = 26 + by;
      p.setPart(SPRITE_PART.FRONT_ARM);
      p.bezierRibbon([bx + 12, 32 + by], [bx + 20, 32 + by], [rockX - 8, rockY + 2], 7.0, 5.2, '#a6291e');
      p.bezierRibbon([bx + 12, 31 + by], [bx + 20, 31 + by], [rockX - 8, rockY + 1], 4.4, 3.0, '#f56542');
      // 臂环铁护腕
      p.setPart(SPRITE_PART.WEAPON);
      p.rect(bx + 16, 29 + by, 4, 6, '#363f57');
      p.vline(bx + 18, 29 + by, 6, '#ffe078');
      drawMountainBoulder(rockX, rockY, 0.96, true);
      // 投岩音爆赤金弧浪 + 崩飞碎石火星
      drawSlashArc64(p, rockX - 3, rockY, 12, 13, -1.15, 1.15, '#e6391a', '#ffaa24', '#fff7bd');
      drawSparkStar64(p, 58, 17 + by, 2, '#ffe878');
      drawSparkStar64(p, 59, 36 + by, 2, '#ff7338');
    } else {
      // 待机 & 行进：左肩后上方霸气单肩扛起巨山岩（绝不挡脸！），右巨臂垂握铁腕重拳威震四方！
      const rockX = Math.max(14, bx - 17);
      const rockY = 20 + by;
      // 左托举巨臂（托在山岩底部）
      p.setPart(SPRITE_PART.BACK_ARM);
      p.bezierRibbon([bx - 13, 32 + by], [Math.max(6, bx - 22), 34 + by], [rockX - 1, rockY + 6], 6.6, 5.0, '#852018');
      p.bezierRibbon([bx - 13, 31 + by], [Math.max(7, bx - 21), 33 + by], [rockX - 1, rockY + 5], 4.0, 3.0, '#d9452e');
      p.setPart(SPRITE_PART.WEAPON);
      p.rect(Math.max(6, rockX - 4), rockY + 5, 6, 4, '#363f57');
      p.hline(Math.max(6, rockX - 4), rockY + 5, 6, '#ffe078');
      // 扛在左肩后上方的峻峭崩裂巨山岩（完整露出威武鬼王面庞！）
      drawMountainBoulder(rockX, rockY, 0.95, false);

      // 右前臂自然屈肘垂护身侧 + 黑铁铆钉护腕 + 硕大重拳
      p.setPart(SPRITE_PART.FRONT_ARM);
      const rFistX = Math.min(55, bx + 17);
      const rFistY = 46 + by - Math.round(pose.armAction * 2);
      p.bezierRibbon([bx + 13, 32 + by], [bx + 20, 38 + by], [rFistX, rFistY], 7.0, 5.4, '#8f221a');
      p.bezierRibbon([bx + 13, 31 + by], [bx + 19, 37 + by], [rFistX, rFistY - 1], 4.4, 3.4, '#eb593b');
      p.line(bx + 16, 33 + by, bx + 20, 38 + by, '#ff946b', 1);
      // 铁护腕与巨拳指节
      p.setPart(SPRITE_PART.WEAPON);
      p.rect(rFistX - 3, rFistY - 5, 6, 4, '#333b52');
      p.hline(rFistX - 3, rFistY - 4, 6, '#ffe078');
      p.setPart(SPRITE_PART.FRONT_ARM);
      p.ellipse(rFistX, rFistY + 1, 4.4, 3.8, '#8f221a');
      p.ellipse(rFistX + 0.5, rFistY, 3.4, 2.8, '#f26544');
      p.hline(rFistX - 2, rFistY + 2, 5, '#6e1914');
    }
  },
};

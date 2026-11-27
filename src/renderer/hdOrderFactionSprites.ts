/**
 * 幻月庭园 · 秩序阵营全量 10 套 64×72 新一代精雕像素绘谱（与 v8 灵梦 / 蕾米 / 生命 / 死亡 100% 统一画风！）
 *
 * 完整覆盖秩序阵营全部 10 个模型蓝图：
 * 1. hero_eirin                 — 八意永琳（秩序英雄 · 1×1 远程天弓「天文密葬」）
 * 2. creature_rabbit            — 竹林妖怪兔（秩序 T1-A · 1×1 抗魔施法萌兔）
 * 3. creature_rabbit_transformed— 兔化真身（T1-A「兔化」变身专属 · 四足飞跃月影灵兔）
 * 4. creature_lunar_slinger     — 玉兔掷弹兵（秩序 T1-B · 1×1 远程巨人杀手）
 * 5. creature_tanuki_illusionist— 幻法狸妖（秩序 T2-A · 1×1 绘月折扇远程幻术师）
 * 6. creature_armored_lunar_guard— 重装月兔近卫（秩序 T2-B · 1×1 秘银鸢盾长戟重甲女骑）
 * 7. creature_lunar_genie       — 幻月妖（秩序 T3-A · 1×1 瞬移星纱天女与真·镂空新月星轮）
 * 8. creature_combat_mk2        — 战斗 II 型（秩序 T3-B · 1×2 河童重工六臂阿修罗武士机甲）
 * 9. creature_purity_titan      — 净秽者（秩序 T4-A · 1×2 月都苍雷天神将与真·镂空日晷神轮）
 * 10. creature_hisoutensoku     — 非想天则（秩序 T4-B · 2×2 勇者系蒸汽核动力先攻机神）
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
  HD_ORIGIN_X,
  HD_ORIGIN_Y,
  HD_RENDER_SCALE,
  HD_SPRITE_HEIGHT,
  HD_SPRITE_WIDTH,
  SPRITE_PART,
  type HdPixelPainter,
} from './hdPixelEngine';
import type { RigPose, SpriteRigSpec } from './voxelSprites';

const HD_BASE = {
  width: HD_SPRITE_WIDTH,
  height: HD_SPRITE_HEIGHT,
  originX: HD_ORIGIN_X,
  originY: HD_ORIGIN_Y,
  renderScale: HD_RENDER_SCALE,
  avatarCrop: { x: 14, y: 5, size: 36 },
  portraitCrop: { x: 4, y: 3, w: 56, h: 64 },
  draw: () => {},
} as const;

/** 绘制环握武器柄的正面上层 3×2 娇小玉手（杜绝握柄穿手！） */
function drawWrappedHand(
  p: HdPixelPainter,
  gx: number,
  gy: number,
  skin = '#ffe6dc',
  hi = '#fff7f2',
  sh = '#e8b3ad',
): void {
  p.setPart(SPRITE_PART.WEAPON);
  p.rect(gx - 1, gy - 1, 3, 2, skin);
  p.hline(gx - 1, gy - 1, 2, hi);
  p.hline(gx - 1, gy + 1, 2, sh);
}

/**
 * 真·镂空鎏金/星银环（内部 100% 透明不画实心暗片，彻底避免地图上的“黑圆贴片”！）
 */
function drawHollowRing64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  innerRatio: number,
  outerCol: string,
  midCol: string,
  hiCol: string,
  emissive = true,
): void {
  const limX = Math.ceil(rx) + 1;
  const limY = Math.ceil(ry) + 1;
  for (let dy = -limY; dy <= limY; dy++) {
    for (let dx = -limX; dx <= limX; dx++) {
      const d = Math.hypot(dx / rx, dy / ry);
      if (d <= 1.0 && d >= innerRatio) {
        const isTopLeft = dx + dy < -rx * 0.35;
        const isOuterEdge = d > 1.0 - (1.0 - innerRatio) * 0.32;
        const col = isTopLeft ? hiCol : isOuterEdge ? outerCol : midCol;
        p.px(cx + dx, cy + dy, col, emissive);
      }
    }
  }
}

/**
 * 东方萌系雪白毛茸茸长兔耳（支持双立耳或左折右立，内衬柔美樱花粉与光泽高光！）
 */
function drawFluffyBunnyEars64(
  p: HdPixelPainter,
  bx: number,
  topY: number,
  opts: {
    earTilt: number;
    leftFolded?: boolean;
    earLen?: number;
    outerShade?: string;
    outerLight?: string;
    innerPink?: string;
    innerLight?: string;
  },
): void {
  const tilt = opts.earTilt;
  const len = opts.earLen ?? 14;
  const shade = opts.outerShade ?? '#d4ddf0';
  const white = opts.outerLight ?? '#ffffff';
  const pink = opts.innerPink ?? '#ff8cb5';
  const pinkHi = opts.innerLight ?? '#ffc4da';

  p.setPart(SPRITE_PART.HEADWEAR);

  // 左耳（靠后侧，可选俏皮半折垂尖）
  if (opts.leftFolded) {
    // 根部竖起
    p.poly(
      [
        [bx - 7, topY + 2],
        [bx - 10 + tilt * 0.5, topY - Math.round(len * 0.65)],
        [bx - 5 + tilt * 0.5, topY - Math.round(len * 0.72)],
        [bx - 2, topY + 2],
      ],
      shade,
    );
    p.poly(
      [
        [bx - 6, topY + 1],
        [bx - 9 + tilt * 0.5, topY - Math.round(len * 0.6)],
        [bx - 6 + tilt * 0.5, topY - Math.round(len * 0.66)],
        [bx - 3, topY + 1],
      ],
      white,
    );
    // 俏皮向左外折的毛茸茸耳尖
    const foldX = bx - 10 + Math.round(tilt * 0.6);
    const foldY = topY - Math.round(len * 0.65);
    p.poly(
      [
        [foldX + 4, foldY - 1],
        [foldX - 7, foldY + 4],
        [foldX - 5, foldY + 8],
        [foldX + 2, foldY + 3],
      ],
      shade,
    );
    p.poly(
      [
        [foldX + 3, foldY],
        [foldX - 6, foldY + 4],
        [foldX - 4, foldY + 7],
        [foldX + 1, foldY + 2],
      ],
      white,
    );
    p.line(bx - 5, topY, foldX + 1, foldY + 2, pink, 2);
    p.px(foldX - 3, foldY + 5, pinkHi);
  } else {
    p.poly(
      [
        [bx - 7, topY + 2],
        [bx - 11 + tilt, topY - len],
        [bx - 6 + tilt, topY - len - 1],
        [bx - 2, topY + 2],
      ],
      shade,
    );
    p.poly(
      [
        [bx - 6, topY + 1],
        [bx - 10 + tilt, topY - len + 1],
        [bx - 7 + tilt, topY - len],
        [bx - 3, topY + 1],
      ],
      white,
    );
    p.ellipse(bx - 8.5 + tilt, topY - len, 2.3, 2.1, white);
    p.poly(
      [
        [bx - 6, topY + 1],
        [bx - 9 + tilt, topY - len + 3],
        [bx - 7 + tilt, topY - len + 2],
        [bx - 4, topY + 1],
      ],
      pink,
    );
    p.px(bx - 8 + tilt, topY - len + 4, pinkHi);
  }

  // 右耳（高耸挺立，受光雪白饱满！）
  p.poly(
    [
      [bx + 2, topY + 2],
      [bx + 5 + tilt, topY - len - 1],
      [bx + 10 + tilt, topY - len],
      [bx + 7, topY + 2],
    ],
    shade,
  );
  p.poly(
    [
      [bx + 3, topY + 1],
      [bx + 6 + tilt, topY - len],
      [bx + 9 + tilt, topY - len + 1],
      [bx + 6, topY + 1],
    ],
    white,
  );
  p.ellipse(bx + 7.5 + tilt, topY - len, 2.4, 2.2, white);
  p.poly(
    [
      [bx + 4, topY + 1],
      [bx + 6 + tilt, topY - len + 3],
      [bx + 8 + tilt, topY - len + 3],
      [bx + 6, topY + 1],
    ],
    pink,
  );
  p.px(bx + 7 + tilt, topY - len + 4, pinkHi);
}

export const HD_ORDER_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  /**
   * 1. 八意永琳（秩序系英雄 · 1×1 远程）：
   *    彻底大改还原东方原设神韵 —— 优雅深海蓝药师礼帽（宽柔折檐 + 亮红帽带 + 正中璀璨红金星辰药师徽章，告别红蓝小丑瓜皮帽！）+
   *    无缝 3D 垂褶左蓝右红星象波浪大洋裙 + 背后垂腰粗珍珠银麻花长辫与绯红大结 + 温婉深绯红大眼 + 舒展反曲天弓「天文密葬」！
   */
  hero_eirin: {
    ...HD_BASE,
    backdropTop: '#0b1230',
    backdropBottom: '#211c45',
    backdropGlow: '#82beff',
    avatarCrop: { x: 14, y: 4, size: 36 },
    portraitCrop: { x: 4, y: 2, w: 56, h: 66 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 24 : isAtk && f === 0 ? 25 : Math.round(28 + pose.leanX * 0.8);
      const by = Math.round(pose.breathY * 1.0 - pose.stepLift * 1.0);
      const sway = pose.flutter * 1.4;
      const headY = 24 + by;

      // [1] 柔顺高贵银白长发背影 + 招牌左侧背后垂腰粗实珍珠银麻花长辫（不再挡脸挡肩，仪态万方！）
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 9, headY],
          [bx + 9 - sway * 0.3, 41 + by],
          [bx + 5 - sway * 0.4, 48 + by],
          [bx - 9 + sway * 0.5, 48 + by],
          [bx - 11 + sway * 0.5, 39 + by],
        ],
        '#7e93bd',
      );
      p.poly(
        [
          [bx - 8, headY + 1],
          [bx + 7, headY + 1],
          [bx + 7 - sway * 0.3, 39 + by],
          [bx - 8 + sway * 0.4, 41 + by],
        ],
        '#cfdef7',
      );
      // 垂于左后侧优雅摇曳的珍珠银粗麻花辫（饱满节段光泽 + 尾端大绯红蝴蝶结！）
      const braidBaseX = bx - 12;
      for (let i = 0; i < 6; i++) {
        const segY = headY + 7 + i * 4.2;
        const segX = braidBaseX - Math.sin(i * 0.55) * 1.8 + sway * (0.22 * i) + (i % 2 === 0 ? -0.6 : 0.6);
        p.ellipse(segX, segY, 3.0, 2.5, '#869cc7');
        p.ellipse(segX - 0.4, segY - 0.5, 2.0, 1.7, '#e6f0ff');
        p.px(Math.round(segX - 1), Math.round(segY - 1), '#ffffff');
      }
      const knotX = Math.round(braidBaseX - 1 + sway * 1.1);
      const knotY = Math.round(headY + 31);
      drawCuteRibbonBow64(p, knotX, knotY, {
        leftSpan: 4.5,
        rightSpan: 3.8,
        wingHeight: 3.8,
        tailLen: 6,
        sway: sway * 0.5,
        dark: '#8f1334',
        main: '#e02850',
        light: '#ff7a98',
        part: SPRITE_PART.BACK_HAIR,
      });
      p.px(knotX, knotY, '#ffe680', true);
      p.poly([[knotX - 2, knotY + 2], [knotX + 2, knotY + 2], [knotX + Math.round(sway * 0.3), knotY + 7]], '#dce8fa');

      // [2] 3/4 端庄斜错步：纯白过膝长袜 + 优雅海蓝金扣皮鞋
      drawStaggeredLegs64(p, bx, 52, 65, pose, {
        sockShadow: '#cfd8eb',
        sockLight: '#ffffff',
        shoeDark: '#172b61',
        shoeMain: '#2b52ad',
        shoeHighlight: '#ffe485',
      });

      // [3] 像素级无缝 3D 左蓝右红「星象双色波浪大洋裙」（同一套柔和垂褶 + 雪白蓬松荷叶衬裙，彻底告别拼接贴片！）
      // 先画柔和雪白探底荷叶衬裙
      p.setPart(SPRITE_PART.PETTICOAT);
      const skirtWaistY = 40 + by;
      const skirtHemY = 54 + by;
      const waistW = 12.6;
      const hemW = 32;
      const tiltSway = sway * 0.8 + 0.8;
      const getHemYAtU = (u: number) => {
        const cu = Math.max(-1, Math.min(1, u));
        const dome = (1 - cu * cu) * 2.5;
        const slant = cu * 0.7;
        const wave = Math.sin((cu + 1) * 0.5 * 3.5 * Math.PI) * 0.85 + 0.85;
        return skirtHemY + dome + slant + wave;
      };
      const petHalfW = hemW * 0.5 - 1.2;
      const petCenter = bx + tiltSway;
      for (let x = Math.floor(petCenter - petHalfW); x <= Math.ceil(petCenter + petHalfW); x++) {
        const u = (x - petCenter) / Math.max(1, petHalfW);
        if (Math.abs(u) > 1) continue;
        const edgeSoft = Math.sqrt(Math.max(0, 1 - u * u * 0.9));
        const outerHem = getHemYAtU(u * 0.94);
        const wave = Math.abs(Math.sin((u + 1) * 0.5 * 5 * Math.PI + 0.3));
        const peek = (2.1 + wave * 1.1) * (0.4 + 0.6 * edgeSoft);
        for (let y = Math.floor(outerHem - 1); y <= Math.round(outerHem + peek); y++) {
          const col = y <= Math.floor(outerHem) || u > 0.42 ? '#d4dceb' : y === Math.round(outerHem + peek) ? '#ffffff' : '#fafcff';
          p.px(x, y, col);
        }
      }
      // 无缝红蓝星象外裙（u < 0.04 左侧深海星蓝、u >= 0.04 右侧高贵绯红，还原原设经典左蓝右红！）
      p.setPart(SPRITE_PART.SKIRT);
      const totalH = Math.max(5, skirtHemY - skirtWaistY);
      for (let y = Math.floor(skirtWaistY); y <= Math.ceil(skirtHemY + 6); y++) {
        const v = Math.max(0, Math.min(1.2, (y - skirtWaistY) / totalH));
        const flare = Math.pow(Math.min(1, v), 0.82);
        const halfW = (waistW * (1 - flare) + hemW * flare) * 0.5;
        const center = bx + tiltSway * flare;
        const xLeft = center - halfW;
        const xRight = center + halfW;
        const span = Math.max(1, xRight - xLeft);
        for (let x = Math.floor(xLeft); x <= Math.ceil(xRight); x++) {
          const u = ((x - xLeft) / span) * 2 - 1;
          if (u < -1 || u > 1) continue;
          const hemAtX = getHemYAtU(u);
          if (y > Math.round(hemAtX)) continue;
          const distFromHem = hemAtX - y;

          // 中缝精致鎏金垂带 + 底缘波浪金边
          if (Math.abs(u - 0.04) < 0.075 && v > 0.06) {
            p.px(x, y, distFromHem < 2.4 ? '#fff4b8' : '#f2c85c');
            continue;
          }
          if (distFromHem >= 1.6 && distFromHem < 3.1) {
            p.px(x, y, u > 0.38 ? '#cc9c35' : '#ffe485');
            continue;
          }

          const fold1 = Math.exp(-Math.pow((u + 0.36) / 0.14, 2)) * Math.pow(Math.min(1, v), 0.75);
          const fold2 = Math.exp(-Math.pow((u - 0.34) / 0.14, 2)) * Math.pow(Math.min(1, v), 0.75);
          let lum = 0.62 - u * 0.28 - Math.max(fold1, fold2) * 0.34 - (v < 0.14 ? 0.12 : 0);
          if (distFromHem < 1.2) lum -= 0.08;

          if (u < 0.04) {
            // 左侧：深海星蓝
            const col = lum < 0.28 ? '#112259' : lum < 0.45 ? '#1c3b8a' : lum > 0.78 ? '#78a8ff' : lum > 0.64 ? '#4274db' : '#2954b8';
            p.px(x, y, col);
          } else {
            // 右侧：蓬莱绯红
            const col = lum < 0.28 ? '#5e0e26' : lum < 0.45 ? '#91193b' : lum > 0.78 ? '#ff829c' : lum > 0.64 ? '#ed4a6d' : '#cc274a';
            p.px(x, y, col);
          }
        }
      }
      // 裙摆精致金丝十二宫十字星纹（左蓝右红对称点缀！）
      p.setPart(SPRITE_PART.APRON_WAIST);
      const drawStarCross = (cx: number, cy: number) => {
        p.px(cx, cy, '#fff6c4', true);
        p.px(cx - 1, cy, '#ffd966');
        p.px(cx + 1, cy, '#ffd966');
        p.px(cx, cy - 1, '#ffd966');
        p.px(cx, cy + 1, '#ffd966');
      };
      drawStarCross(bx - 7, 48 + by);
      drawStarCross(bx + 8, 48 + by);

      // [4] 左后臂：优雅蓝袖灯笼袖 + 拉弓玉手
      p.setPart(SPRITE_PART.BACK_ARM);
      drawPuffSleeve64(p, bx - 6.5, 35 + by, '#1a387d', '#3364cc', '#ffffff', 'left');
      const pullHandX = isAtk && f === 0 ? bx + 5 : isAtk && f === 1 ? bx - 9 : bx - 9;
      const pullHandY = isAtk && f === 0 ? 35 + by : isAtk && f === 1 ? 36 + by : 42 + by;
      drawSoftChibiArm64(p, bx - 6.5, 36 + by, pullHandX, pullHandY);

      // [5] 修身左蓝右红宫廷上衣 + 雪白大水手披肩领 + 璀璨金星丝绸胸结
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 6, 33 + by], [bx + 1, 33 + by], [bx + 1, 41 + by], [bx - 6, 41 + by]], '#1e4296');
      p.poly([[bx - 5, 34 + by], [bx, 34 + by], [bx, 40 + by], [bx - 5, 40 + by]], '#3568d1');
      p.poly([[bx + 1, 33 + by], [bx + 6, 33 + by], [bx + 6, 41 + by], [bx + 1, 41 + by]], '#a81f3f');
      p.poly([[bx + 1, 34 + by], [bx + 5, 34 + by], [bx + 5, 40 + by], [bx + 1, 40 + by]], '#e03b5d');
      // 宽优雅雪白圆角水手披肩领 + 红色细边 + 中央鎏金星扣
      p.poly([[bx - 7, 32 + by], [bx + 7, 32 + by], [bx + 5, 37 + by], [bx, 38 + by], [bx - 5, 37 + by]], '#edf3ff');
      p.poly([[bx - 6, 32 + by], [bx + 6, 32 + by], [bx + 4, 36 + by], [bx, 37 + by], [bx - 4, 36 + by]], '#ffffff');
      p.line(bx - 5, 36 + by, bx, 37 + by, '#d92b4e', 1);
      p.line(bx + 5, 36 + by, bx, 37 + by, '#d92b4e', 1);
      p.ellipse(bx, 36 + by, 1.8, 1.8, '#ffe680', true);
      p.hline(bx - 6, 40 + by, 12, '#f2c85c');

      // [6] 温婉睿智蓬莱药师美人颜（原设温柔深绯红大眼！）+ 轻柔亮泽月银空气刘海
      drawKawaiiHead64(p, bx, headY, pose, {
        irisDark: '#7a1234',
        irisMid: '#c72658',
        irisGlow: '#ff8fb3',
        lashColor: '#301428',
        blushColor: '#ffadbd',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#6b7fa8',
        dark: '#92a8cf',
        mid: '#cdddf7',
        light: '#eef5ff',
        spec: '#ffffff',
        leftLockLen: 12,
        rightLockLen: 11,
        fluff: 1,
        sway,
      });

      // [7] 彻底重塑！！东方永夜抄原设级高贵「八意永琳药师礼帽」（柔和微拱圆锥穹顶 + 优雅宽折绯红帽檐 + 金白红十字药师徽章 + 右侧双红丝带，彻底告别平顶大盖帽与小丑帽！）
      p.setPart(SPRITE_PART.HEADWEAR);
      const hatCx = bx - 0.5;
      const hatY = headY - 9.2;
      // 7a. 柔美微拱收尖的深海宝蓝丝绸药师帽冠（下宽贴檐、上端柔和优雅收拱成古典宫廷药师帽穹顶！）
      const cRx = 9.0;
      const cH = 9.5;
      for (let y = Math.floor(hatY - cH); y <= Math.ceil(hatY + 0.5); y++) {
        const t = Math.max(0, Math.min(1, (hatY - y) / cH)); // 0=帽带底, 1=帽顶
        // 经典柔和微尖穹顶轮廓：底部饱满圆润，上半段优雅内收形成柔美小尖拱（绝不平头方帽！）
        const rowHalfW = cRx * Math.pow(Math.max(0, 1 - Math.pow(t, 1.55)), 0.58);
        if (rowHalfW < 0.7) continue;
        // 轻微优雅向后倾（左偏 1.2px），3/4 侧颜视角高级感拉满！
        const rowCx = hatCx - t * 1.4;
        for (let x = Math.floor(rowCx - rowHalfW); x <= Math.ceil(rowCx + rowHalfW); x++) {
          const dx = (x - rowCx) / Math.max(1, rowHalfW);
          if (Math.abs(dx) > 1) continue;
          const fold = Math.max(0, Math.cos(dx * 2.4 * Math.PI)) * (1 - t * 0.65) * 0.16;
          let lum = 0.6 - dx * 0.34 + t * 0.2 - fold;
          if (y >= Math.floor(hatY - 0.8)) lum -= 0.16;
          const col =
            lum < 0.3 ? '#0f1e52' : lum < 0.48 ? '#1b3987' : lum > 0.78 ? '#78aaff' : lum > 0.64 ? '#4274db' : '#2954b8';
          p.px(x, y, col);
        }
      }
      // 7b. 宽柔优雅的绯红折边帽檐（比帽冠宽出 2.5px 形成优雅阶梯帽檐 + 上沿细金滚边 + 两侧微翘弧！）
      for (let x = Math.floor(hatCx - 11.4); x <= Math.ceil(hatCx + 11.4); x++) {
        const u = (x - hatCx) / 11.4;
        if (Math.abs(u) > 1) continue;
        const brimArc = u * u * 1.8;
        const topY = Math.round(hatY - 0.5 + brimArc);
        const botY = Math.round(hatY + 2.4 + brimArc);
        for (let y = topY; y <= botY; y++) {
          let col = '#d4244a';
          if (y === topY) col = '#ffe485';
          else if (y === botY || u > 0.42) col = '#8a112e';
          else if (u < -0.1) col = '#f55879';
          p.px(x, y, col);
        }
      }
      // 7c. 帽冠正前方高贵「蓬莱金白十字星药师徽章」+ 右侧飘扬双红绸结丝带！
      const embX = Math.round(hatCx);
      const embY = Math.round(hatY - 3.6);
      p.ellipse(embX, embY, 2.8, 2.6, '#8f1334');
      p.ellipse(embX, embY, 2.0, 1.9, '#ffe685', true);
      p.vline(embX, embY - 2, 5, '#ffffff', true);
      p.hline(embX - 2, embY, 5, '#ffffff', true);
      p.px(embX, embY, '#ff3366', true);
      // 右檐优雅垂落双红绸飘带
      p.bezierRibbon([hatCx + 8, hatY + 2], [hatCx + 11, hatY + 5], [hatCx + 12 + sway * 0.4, hatY + 9], 1.6, 0.7, '#d4244a');
      p.bezierRibbon([hatCx + 7, hatY + 2], [hatCx + 9, hatY + 6], [hatCx + 10 + sway * 0.3, hatY + 10], 1.3, 0.6, '#ff6e8c');
      p.px(Math.round(hatCx + 9), Math.round(hatY + 2), '#ffe680');

      // [8] 右前臂（绯红优雅泡泡袖）+ 宏伟舒展反曲天弓「天文密葬」与苍月星矢！
      p.setPart(SPRITE_PART.FRONT_ARM);
      drawPuffSleeve64(p, bx + 6.5, 35 + by, '#991838', '#e03b5d', '#ffffff', 'right');
      const bowHoldX = isAtk && f === 0 ? bx + 15 : isAtk && (f === 1 || f === 2) ? bx + 17 : bx + 15;
      const bowHoldY = isAtk ? 34 + by : 37 + by;
      drawSoftChibiArm64(p, bx + 6.5, 36 + by, bowHoldX, bowHoldY);

      p.setPart(SPRITE_PART.WEAPON);
      // 优美舒展的反曲天弓双翼（月银×海蓝双层弧骨 + 鎏金反曲梢头！）
      const bowTopX = bowHoldX - 4;
      const bowTopY = bowHoldY - 19;
      const bowBotX = bowHoldX - 4;
      const bowBotY = bowHoldY + 18;
      p.bezierRibbon([bowHoldX + 1, bowHoldY], [bowHoldX + 8, bowHoldY - 11], [bowTopX, bowTopY], 3.0, 1.2, '#214ca6');
      p.bezierRibbon([bowHoldX + 1, bowHoldY], [bowHoldX + 7, bowHoldY - 11], [bowTopX + 1, bowTopY + 1], 1.5, 0.7, '#d4ecff');
      p.bezierRibbon([bowHoldX + 1, bowHoldY], [bowHoldX + 8, bowHoldY + 10], [bowBotX, bowBotY], 3.0, 1.2, '#214ca6');
      p.bezierRibbon([bowHoldX + 1, bowHoldY], [bowHoldX + 7, bowHoldY + 10], [bowBotX + 1, bowBotY - 1], 1.5, 0.7, '#d4ecff');
      // 弓梢鎏金新月饰与握把苍蓝星核
      p.ellipse(bowTopX, bowTopY, 1.8, 1.6, '#ffe478', true);
      p.ellipse(bowBotX, bowBotY, 1.8, 1.6, '#ffe478', true);
      p.ellipse(bowHoldX + 2, bowHoldY, 2.4, 3.2, '#ffe073');
      p.px(bowHoldX + 3, bowHoldY, '#7ceeff', true);
      // 晶莹紧绷星光弓弦
      const stringPullX = isAtk && f === 0 ? bowHoldX - 10 : bowHoldX - 5;
      p.line(bowTopX, bowTopY + 1, stringPullX, bowHoldY, '#a6f0ff', 1, true);
      p.line(stringPullX, bowHoldY, bowBotX, bowBotY - 1, '#a6f0ff', 1, true);
      drawWrappedHand(p, bowHoldX, bowHoldY);

      // 天文密葬苍月星矢（待机也微搭半透明星矢显现弓手气质，蓄力拉满、释放破空！）
      p.setPart(SPRITE_PART.GLOW_FX);
      if (isAtk && f === 0) {
        p.line(stringPullX, bowHoldY, bowHoldX + 10, bowHoldY, '#7ce8ff', 2, true);
        p.hline(stringPullX + 2, bowHoldY, bowHoldX + 8 - stringPullX, '#ffffff', true);
        p.poly([[bowHoldX + 8, bowHoldY - 3], [bowHoldX + 14, bowHoldY], [bowHoldX + 8, bowHoldY + 3]], '#ffe680', true);
        p.px(bowHoldX + 13, bowHoldY, '#ffffff', true);
        drawWrappedHand(p, stringPullX, bowHoldY);
      } else if (isAtk && (f === 1 || f === 2)) {
        const tipX = Math.min(60, bowHoldX + (f === 1 ? 18 : 20));
        p.line(bowHoldX + 2, bowHoldY, tipX, bowHoldY, '#4cb8ff', 3, true);
        p.hline(bowHoldX + 3, bowHoldY, Math.max(2, tipX - bowHoldX - 3), '#ffffff', true);
        p.poly([[tipX - 5, bowHoldY - 3], [tipX + 1, bowHoldY], [tipX - 5, bowHoldY + 3]], '#ffe885', true);
        p.px(bowHoldX + 8, bowHoldY - 5, '#b8f4ff', true);
        p.px(bowHoldX + 10, bowHoldY + 5, '#ffe885', true);
        p.px(bowHoldX + 5, bowHoldY - 3, '#ffffff', true);
      } else if (!isHit) {
        // 待机微搭光矢于弓心，一眼即识远程弓手大贤者！
        p.line(stringPullX + 1, bowHoldY, bowHoldX + 8, bowHoldY, '#8cf0ff', 1, true);
        p.poly([[bowHoldX + 6, bowHoldY - 2], [bowHoldX + 10, bowHoldY], [bowHoldX + 6, bowHoldY + 2]], '#ffe885', true);
        p.px(bowTopX, bowTopY, '#ffffff', true);
      }
    },
  },

  /**
   * 2. 竹林妖怪兔（秩序 T1-A · 1×1 抗魔施法）：
   *    一立一微折粉白毛茸茸长兔耳 + 樱红金铃蝴蝶结 + 淡紫月银萌波波头 + 蓬松小白绒尾 + 和风蓝白蕾丝短裙 + 月纹捣药杵！
   */
  creature_rabbit: {
    ...HD_BASE,
    backdropTop: '#0d1530',
    backdropBottom: '#1d2e57',
    backdropGlow: '#ff96c2',
    avatarCrop: { x: 14, y: 4, size: 36 },
    portraitCrop: { x: 4, y: 2, w: 56, h: 66 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 25 : isAtk && f === 0 ? 29 : Math.round(31 + pose.leanX * 1.0);
      const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.3);
      const sway = pose.flutter * 1.5;
      const earTilt = Math.round(-pose.leanX * 0.6 + pose.flutter * 1.3);
      const headY = 26 + by;

      // [1] 背后超蓬松雪白绒球兔尾 + 樱粉蝴蝶结腰飘带
      p.setPart(SPRITE_PART.BACK_ACC);
      const tailY = 48 + by + Math.round(pose.flutter);
      p.ellipse(bx - 12, tailY, 5.2, 4.8, '#d4dff5');
      p.ellipse(bx - 12, tailY - 1, 3.8, 3.5, '#ffffff');
      p.px(bx - 13, tailY - 3, '#ffffff');
      p.bezierRibbon([bx - 7, 43 + by], [bx - 14 + sway * 0.5, 46 + by], [bx - 17 + sway, 52 + by], 3.2, 1.2, '#e84d7e');
      p.bezierRibbon([bx - 7, 43 + by], [bx - 13 + sway * 0.4, 45 + by], [bx - 15 + sway * 0.8, 50 + by], 1.5, 0.6, '#ff9ec0');

      // [2] 淡紫月银蓬松波波后发
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.ellipse(bx - 1, headY + 2, 11.4, 9.6, '#7f93c4');
      p.ellipse(bx - 1, headY + 1, 9.8, 8.2, '#b9c8eb');

      // [3] 3/4 欢快碎步双腿：白及膝袜 + 靛蓝樱粉绑带可爱小短靴
      drawStaggeredLegs64(p, bx, 52, 65, pose, {
        sockShadow: '#d4ddf0',
        sockLight: '#ffffff',
        shoeDark: '#233c7a',
        shoeMain: '#3e69cc',
        shoeHighlight: '#ff9ec2',
      });

      // [4] 左后小振袖 + 娇俏小手
      p.setPart(SPRITE_PART.BACK_ARM);
      const backSwing = Math.round(-pose.stride * 2.5);
      p.poly(
        [
          [bx - 6, 37 + by],
          [bx - 13 + backSwing, 41 + by],
          [bx - 14 + backSwing, 47 + by],
          [bx - 7, 45 + by],
        ],
        '#365eb8',
      );
      p.poly(
        [
          [bx - 6, 38 + by],
          [bx - 12 + backSwing, 41 + by],
          [bx - 12 + backSwing, 45 + by],
          [bx - 7, 44 + by],
        ],
        '#6490eb',
      );
      p.line(bx - 14 + backSwing, 46 + by, bx - 8, 45 + by, '#ffffff', 2);
      p.ellipse(bx - 13 + backSwing, 48 + by, 1.8, 1.6, '#ffe6dc');

      // [5] 甜美和风兔娘蓬蓬靛蓝短裙 + 雪白波浪蕾丝边 + 樱粉宽腰封金铃
      drawCleanAnimeSkirt64(p, {
        waistX: bx,
        waistY: 42 + by,
        waistW: 13,
        hemY: 53 + by,
        hemW: 29,
        swayX: sway,
        colors: {
          deep: '#192d66',
          shadow: '#274694',
          main: '#4d7ce0',
          light: '#80adff',
          highlight: '#bfd8ff',
        },
        trimBand: {
          offsetFromHem: 1.5,
          thickness: 1.6,
          color: '#ffffff',
          shadowColor: '#d4ddf0',
        },
        petticoat: {
          peekDepth: 2.0,
          shade: '#e6d5e0',
          main: '#fff7fb',
          highlight: '#ffffff',
        },
      });
      // 洁白和风上衣 + 樱粉蝴蝶结腰封
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 6, 36 + by], [bx + 6, 36 + by], [bx + 7, 43 + by], [bx - 7, 43 + by]], '#eaf1ff');
      p.poly([[bx - 5, 36 + by], [bx + 5, 36 + by], [bx + 5, 42 + by], [bx - 5, 42 + by]], '#ffffff');
      p.line(bx - 3, 36 + by, bx + 2, 41 + by, '#ff8cb5', 1);
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.rect(bx - 7, 41 + by, 14, 3, '#f05485');
      p.hline(bx - 6, 41 + by, 12, '#ff94b8');
      p.rect(bx - 2, 41 + by, 5, 3, '#ff78a5');
      p.ellipse(bx, 43 + by, 1.6, 1.6, '#ffe478', true);

      // [6] 软萌草莓红大眼圆脸 + 淡紫月银蓬松空气刘海
      drawKawaiiHead64(p, bx, headY, pose, {
        irisDark: '#a8143c',
        irisMid: '#e83868',
        irisGlow: '#ffa6c4',
        lashColor: '#451a33',
        blushColor: '#ff99b8',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#6678ad',
        dark: '#889cd1',
        mid: '#c4d3f5',
        light: '#e8f0ff',
        spec: '#ffffff',
        leftLockLen: 9,
        rightLockLen: 8,
        bobFlare: true,
        sway,
      });

      // [7] 标志性一立一俏皮微折长兔耳 + 右耳根樱红金铃蝴蝶结！
      drawFluffyBunnyEars64(p, bx, headY - 9, {
        earTilt,
        leftFolded: true,
        earLen: 14,
      });
      drawCuteRibbonBow64(p, bx + 5, headY - 10, {
        leftSpan: 4.5,
        rightSpan: 4.5,
        wingHeight: 4.2,
        tailLen: 4,
        sway: sway * 0.4,
        dark: '#b81d49',
        main: '#ff4778',
        light: '#ff96b5',
        part: SPRITE_PART.HEADWEAR,
      });
      p.px(bx + 5, headY - 10, '#ffe885', true);

      // [8] 前振袖 + 温润葫芦腰形「月纹玉兔捣药杵」（蓄力高举 → 完整零裁切月华星屑弧光！）
      p.setPart(SPRITE_PART.FRONT_ARM);
      let handX = bx + 10 + Math.round(pose.stride * 1.8);
      let handY = 42 + by;
      let p0x = bx + 6;
      let p0y = 50 + by;
      let p1x = bx + 18;
      let p1y = 28 + by;
      if (isAtk && f === 0) {
        handX = bx + 5;
        handY = 34 + by;
        p0x = bx - 4;
        p0y = 40 + by;
        p1x = bx + 12;
        p1y = 21 + by;
      } else if (isAtk && (f === 1 || f === 2)) {
        handX = bx + 13;
        handY = 39 + by;
        p0x = bx + 3;
        p0y = 41 + by;
        p1x = bx + 24;
        p1y = 37 + by;
      }
      p.poly([[bx + 5, 37 + by], [handX, handY - 2], [handX - 2, handY + 4], [bx + 5, 43 + by]], '#4d7ce0');
      p.line(handX, handY - 2, handX - 2, handY + 4, '#ffffff', 2);

      // 捣药杵（暖米木/月玉双头微膨葫芦腰造型 + 中腰樱红缠绳 + 发光鎏金月纹！）
      p.setPart(SPRITE_PART.WEAPON);
      const mx = Math.round((p0x + p1x) * 0.5);
      const my = Math.round((p0y + p1y) * 0.5);
      p.line(p0x, p0y, p1x, p1y, '#c9ab88', 3);
      p.line(p0x, p0y - 1, p1x, p1y - 1, '#fff3db', 1);
      // 杵尾与杵头饱满圆膨造型（典型日式木玉捣药杵！）
      p.ellipse(p0x, p0y, 3.2, 3.0, '#d9bc98');
      p.ellipse(p0x - 0.5, p0y - 0.5, 2.0, 1.8, '#fff7e8');
      p.ellipse(p1x, p1y, 4.0, 3.8, '#e3c7a3');
      p.ellipse(p1x - 1, p1y - 1, 2.6, 2.4, '#fffaf0');
      // 杵中樱红缠绳结 + 杵头发光金月印
      p.ellipse(mx, my, 2.0, 2.0, '#eb3b6a');
      p.line(p1x - 2, p1y + 1, p1x + 1, p1y - 2, '#ffd966', 2, true);
      p.px(p1x, p1y, '#99e6ff', true);
      // 杵尾樱红流苏挂穗
      p.line(p0x, p0y + 2, p0x - 2 + Math.round(sway * 0.5), p0y + 6, '#ff4d7e', 2);
      drawWrappedHand(p, handX, handY);

      if (isAtk && (f === 1 || f === 2)) {
        drawSlashArc64(p, bx + 17, 37 + by, 12, 12, -1.15, 0.95, '#ff6ba0', '#9ee6ff', '#ffffff');
      }
    },
  },

  /**
   * 3. 兔化真身（T1-A「兔化」变身专属形态 · 四足飞跃月影灵兔！）：
   *    极速扑跃的雪白流线妖兔 + 迎风后掠超长粉白双耳 + 招牌樱红金铃蝴蝶结 + 绯红月瞳 + 蓬松大雪球尾 + 流动月华疾影光带！
   */
  creature_rabbit_transformed: {
    ...HD_BASE,
    backdropTop: '#0b1433',
    backdropBottom: '#231b4d',
    backdropGlow: '#99e6ff',
    avatarCrop: { x: 16, y: 12, size: 36 },
    portraitCrop: { x: 4, y: 8, w: 56, h: 56 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const hop = isAtk && (f === 1 || f === 2)
        ? -6
        : isMove
          ? Math.round(-Math.abs(Math.sin(phase)) * 6 - 1)
          : Math.round(Math.sin(phase) * 2.2 - 1);
      // 攻击时机身居中微偏左，后脚与前爪双层月影爪斩 100% 留白零裁切！
      const bx = isAtk && (f === 1 || f === 2) ? 28 : isAtk && f === 0 ? 27 : 30;
      const by = 43 + hop;
      const stretch = isAtk && (f === 1 || f === 2) ? 3 : isMove ? Math.round(Math.sin(phase) * 3.5) : 0;

      // [1] 背后灵动飘逸的「月青星华疾风气流」与星屑残影（彻底告别脚底滑板线！）
      p.setPart(SPRITE_PART.GLOW_FX);
      p.bezierRibbon([bx - 21, by - 4], [bx - 12, by - 12], [bx + 3, by - 11], 2.0, 0.6, '#54b8ff', true);
      p.bezierRibbon([bx - 20, by + 4], [bx - 14, by + 1], [bx - 5, by - 3], 2.4, 0.7, '#9ef2ff', true);
      p.px(bx - 22, by - 7, '#ffe899', true);
      p.px(bx - 17, by + 10, '#ff8cb8', true);
      p.px(bx + 15, by - 16, '#b8f4ff', true);

      // [2] 远侧后腿与前爪（阴影区分前后肢深度！）
      p.setPart(SPRITE_PART.BACK_ACC);
      const hindExt = isAtk && f === 1 ? -4 : -stretch;
      const foreExt = isAtk && f === 1 ? 5 : stretch;
      // 远侧后腿
      p.bezierRibbon([bx - 8, by + 2], [bx - 14 + hindExt, by + 9], [bx - 18 + hindExt, by + 14], 4.6, 2.3, '#b8c8e6');
      // 远侧前爪
      p.bezierRibbon([bx + 8, by + 2], [bx + 14 + foreExt, by + 6], [bx + 19 + foreExt, by + 8], 3.8, 1.9, '#c4d2ed');

      // [3] 超级蓬松圆滚滚大雪球兔尾
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.ellipse(bx - 14, by - 2, 6.0, 5.6, '#c7d5f0');
      p.ellipse(bx - 14, by - 3, 4.6, 4.4, '#eef5ff');
      p.ellipse(bx - 15, by - 4, 2.5, 2.3, '#ffffff');

      // [4] 健美流线飞跃雪白灵兔身躯（弓背跃动感 + 左上月光高光 + 腹部柔影）
      p.setPart(SPRITE_PART.TORSO);
      p.ellipse(bx - 1, by + 1, 13.8 + Math.max(0, stretch * 0.4), 8.0, '#ccd8f0');
      p.ellipse(bx, by - 1, 12.4 + Math.max(0, stretch * 0.4), 6.6, '#f0f6ff');
      p.ellipse(bx + 1, by - 3, 9.6, 4.0, '#ffffff');
      // 蓬松雪白胸毛团
      p.ellipse(bx + 9, by + 1, 5.5, 5.0, '#e6efff');
      p.ellipse(bx + 10, by, 4.0, 3.6, '#ffffff');

      // [5] 近侧强健后蹬大长腿 + 前伸凌空扑击前爪（配粉嫩小肉垫！）
      p.setPart(SPRITE_PART.LEGS);
      p.ellipse(bx - 8, by + 3, 6.2, 5.4, '#d8e3f7');
      p.ellipse(bx - 7, by + 2, 4.6, 4.0, '#ffffff');
      p.bezierRibbon([bx - 10, by + 6], [bx - 13 + hindExt, by + 12], [bx - 19 + hindExt, by + 16], 4.6, 2.5, '#eef5ff');
      p.ellipse(bx - 19 + hindExt, by + 16, 2.9, 1.9, '#ffffff');
      p.px(bx - 20 + hindExt, by + 17, '#ff9ec2');
      // 矫健近侧前腿与扑击前爪
      p.bezierRibbon([bx + 8, by + 2], [bx + 14 + foreExt, by + 8], [bx + 20 + foreExt, by + 10], 4.4, 2.2, '#f2f7ff');
      p.ellipse(bx + 20 + foreExt, by + 10, 2.7, 2.0, '#ffffff');
      p.px(bx + 21 + foreExt, by + 11, '#ff9ec2');

      // [6] 招牌颈间「樱红金铃大蝴蝶结」（与竹林妖怪兔一脉相承的萌系标志！）
      drawCuteRibbonBow64(p, bx + 10, by - 4, {
        leftSpan: 7.0,
        rightSpan: 5.2,
        wingHeight: 5.6,
        tailLen: 8,
        sway: -pose.flutter * 1.4 - (isAtk ? 3 : 0),
        dark: '#b31b46',
        main: '#ff4275',
        light: '#ff96b8',
        part: SPRITE_PART.APRON_WAIST,
      });
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx + 12, by - 2, 2.0, 2.0, '#ffe478', true);
      p.px(bx + 12, by - 3, '#ffffff', true);

      // [7] 灵动雪白妖兔头颅 + 清晰 V 字分开的迎风双长兔耳 + 闪耀绯红月瞳与俏皮三瓣嘴！
      p.setPart(SPRITE_PART.NECK_HEAD);
      const hx = bx + 13;
      const hy = by - 9;
      p.ellipse(hx, hy, 7.4, 6.4, '#d6e2f7');
      p.ellipse(hx + 0.5, hy - 0.8, 6.3, 5.4, '#ffffff');
      p.ellipse(hx + 6, hy + 1, 3.1, 2.5, '#ffffff');
      p.px(hx + 8, hy, '#ff7ba8');
      p.px(hx + 7, hy + 2, '#b86e82');

      // 清晰 V 字张开的一对后掠毛茸茸长兔耳（远耳高扬、近耳平掠，双耳分明绝不重叠！）
      p.setPart(SPRITE_PART.HEADWEAR);
      const earWave = Math.round(Math.sin(phase) * 2);
      // 远侧高扬长耳
      p.poly(
        [
          [hx - 2, hy - 5],
          [hx - 12, hy - 20 + earWave],
          [hx - 16, hy - 17 + earWave],
          [hx - 4, hy - 2],
        ],
        '#c4d4f0',
      );
      p.poly(
        [
          [hx - 3, hy - 4],
          [hx - 12, hy - 18 + earWave],
          [hx - 14, hy - 16 + earWave],
          [hx - 4, hy - 2],
        ],
        '#ff94ba',
      );
      // 近侧受光平掠雪白长耳
      p.poly(
        [
          [hx - 2, hy - 4],
          [hx - 19, hy - 12 - earWave],
          [hx - 21, hy - 8 - earWave],
          [hx - 4, hy],
        ],
        '#dde7fa',
      );
      p.poly(
        [
          [hx - 3, hy - 3],
          [hx - 18, hy - 11 - earWave],
          [hx - 19, hy - 8 - earWave],
          [hx - 4, hy - 1],
        ],
        '#ffffff',
      );
      p.line(hx - 5, hy - 3, hx - 17, hy - 9 - earWave, '#ff8cb5', 2);
      // 额心发光新月妖印
      p.setPart(SPRITE_PART.GLOW_FX);
      p.px(hx + 3, hy - 4, '#ffe680', true);
      p.px(hx + 2, hy - 3, '#ffe680', true);
      p.px(hx + 3, hy - 2, '#ffe680', true);

      // 炯炯有神的绯红宝石妖兔大眼
      p.setPart(SPRITE_PART.FACE_FEATURES);
      if (pose.blink || pose.expr === 'hurt') {
        p.hline(hx + 1, hy, 4, '#591833');
      } else {
        p.rect(hx + 1, hy - 2, 4, 4, '#9e113b');
        p.rect(hx + 2, hy - 1, 3, 3, '#ff2e63', true);
        p.px(hx + 2, hy - 1, '#ffffff', true);
        p.px(hx + 4, hy + 1, '#ff9ec2', true);
      }
      p.hline(hx + 1, hy + 3, 2, '#ffa8c4');

      // [8] 攻击爆发：先攻月影高速双爪斩弧（100% 完整在画布内绽放！）
      if (isAtk && (f === 1 || f === 2)) {
        drawSlashArc64(p, bx + 19, by - 1, 12, 13, -1.2, 1.0, '#ff4d88', '#8cf0ff', '#ffffff');
        drawSlashArc64(p, bx + 22, by + 2, 9, 9, -0.95, 0.85, '#ffe078', '#ffffff', '#ffffff');
      }
    },
  },

  /**
   * 4. 玉兔掷弹兵（秩序 T1-B · 1×1 远程巨人杀手）：
   *    彻底大改与竹林妖怪兔拉开鲜明辨识度！—— 暖蜜桃金俏皮侧马尾 + 额间星晶侦察护目镜 + 翡翠游侠短披肩 +
   *    蓬松小白兔尾 + 斜挎红棕皮质星石弹药袋 + 大号雕花红木鎏金战弹弓随时拉弦瞄准炽金星石弹丸！
   */
  creature_lunar_slinger: {
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
  },

  /**
   * 5. 幻法狸妖（秩序 T2-A · 1×1 远程幻术施法）：
   *    栗棕卷发圆狸耳 + 发光翡翠变身神叶 + 超蓬松条纹大狸尾 + 蓝靛金纹振袖羽织 + 绘月大折扇与青金狸火！
   */
  creature_tanuki_illusionist: {
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
  },

  /**
   * 6. 重装月兔近卫（秩序 T2-B · 1×1 50% 魔抗活体铁壁女骑）：
   *    彻底大改消除“灰白糊成一团”！—— 高对比铃仙系深靛紫波浪长发 × 璀璨宝石红眸 × 流线蓝金护耳雪白长兔耳 ×
   *    宽阔深绯红近卫重披风 × 深藏蓝金边重甲战裙与纯白绯红月纹前绶带 × 镜面冷银收腰胸铠 × 斜护蓝金秘银鸢盾 + 45° 红缨月牙重戟！
   */
  creature_armored_lunar_guard: {
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
  },

  /**
   * 7. 幻月妖（秩序 T3-A · 1×1 短距瞬移全能施法天女）：
   *    彻底大改消除“蓝麻袋 + 大粗框仙带”！—— 真正古典飞天 S 型轻盈半透流光羽衣仙带（留足空气负空间！）+
   *    星夜紫银渐变蓬松长卷发 + 纤巧镂空鎏金弦月冠 + 分层高开叉月华星纱仙女裙（深星空外裙 + 雪白轻纱前裙摆 + 隐约踏月丝履）+
   *    半透月白广袖 + 华美月牙抱星镂空星轮法杖！
   */
  creature_lunar_genie: {
    ...HD_BASE,
    backdropTop: '#0a0f30',
    backdropBottom: '#221c54',
    backdropGlow: '#b8a8ff',
    avatarCrop: { x: 14, y: 4, size: 36 },
    portraitCrop: { x: 4, y: 2, w: 56, h: 66 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const floatY = Math.round(Math.sin(phase) * 2.0 - (isMove ? 3 : 1));
      const bx = isAtk && (f === 1 || f === 2) ? 24 : Math.round(28 + pose.leanX * 0.8);
      const by = floatY;
      const sway = Math.sin(phase) * 2.2 + pose.flutter * 1.4;
      const headY = 23 + by;

      // [1] 轻盈曼妙的「古典飞天弧形月华羽衣仙带」（越过肩背划出大弧云拱、左侧柔美 S 弯轻扬飘散，绝不折成竖直回形针！）
      p.setPart(SPRITE_PART.BACK_ACC);
      // 脑后高拱半透明云纱仙弧（托起天女仙姿！）
      p.bezierRibbon(
        [bx - 16 + sway * 0.4, 21 + by],
        [bx - 2, 6 + by],
        [bx + 15 - sway * 0.4, 20 + by],
        2.2,
        2.0,
        '#7d8cff',
      );
      p.bezierRibbon(
        [bx - 15 + sway * 0.4, 21 + by],
        [bx - 2, 7 + by],
        [bx + 14 - sway * 0.4, 20 + by],
        1.0,
        0.9,
        '#e8f6ff',
        true,
      );
      // 左侧优雅外展 S 弯云纱飘尾（自然垂落外扬，留足空气负空间！）
      p.bezierRibbon(
        [bx - 16 + sway * 0.4, 21 + by],
        [bx - 24 + sway * 0.7, 32 + by],
        [bx - 18 + sway, 49 + by],
        3.0,
        1.0,
        '#697ef0',
      );
      p.bezierRibbon(
        [bx - 15 + sway * 0.4, 21 + by],
        [bx - 22 + sway * 0.7, 32 + by],
        [bx - 18 + sway, 48 + by],
        1.3,
        0.5,
        '#dceeff',
        true,
      );
      // 右侧自然下垂微扬的尾纱与飘散星尘
      p.bezierRibbon(
        [bx + 15 - sway * 0.4, 20 + by],
        [bx + 21 - sway * 0.5, 36 + by],
        [bx + 16 - sway * 0.7, 53 + by],
        2.4,
        0.9,
        '#7b68eb',
      );
      p.bezierRibbon(
        [bx + 14 - sway * 0.4, 20 + by],
        [bx + 20 - sway * 0.5, 36 + by],
        [bx + 16 - sway * 0.7, 52 + by],
        1.0,
        0.4,
        '#ebd9ff',
        true,
      );
      p.setPart(SPRITE_PART.GLOW_FX);
      p.px(bx - 18 + Math.round(sway * 0.6), 17 + by, '#ffe899', true);
      p.px(bx - 20 + Math.round(sway), 48 + by, '#ffffff', true);
      p.px(bx + 17 - Math.round(sway * 0.6), 52 + by, '#ffe899', true);

      // [2] 如瀑梦幻「星夜薰衣草紫×月银」大波浪长仙发背影
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 9, headY],
          [bx + 11 - sway * 0.4, 43 + by],
          [bx + 8 - sway * 0.5, 53 + by],
          [bx - 10 + sway * 0.6, 54 + by],
          [bx - 13 + sway * 0.6, 41 + by],
        ],
        '#343c8c',
      );
      p.poly(
        [
          [bx - 8, headY + 1],
          [bx + 7, headY + 1],
          [bx + 9 - sway * 0.3, 41 + by],
          [bx - 10 + sway * 0.5, 44 + by],
        ],
        '#697de0',
      );
      p.bezierRibbon([bx - 9, headY + 6], [bx - 14 + sway * 0.5, 43 + by], [bx - 14 + sway, 54 + by], 3.8, 1.1, '#a6b8ff');

      // [3] 优雅凌波踏月足尖：白皙纤细小腿 + 银月绑带仙履（清晰秀气，告别断脚！）
      drawStaggeredLegs64(p, bx, 52 + Math.min(0, by), 65 + Math.round(by * 0.3), pose, {
        sockShadow: '#f2c8bc',
        sockLight: '#ffe6dc',
        shoeDark: '#263a94',
        shoeMain: '#668ef5',
        shoeHighlight: '#ffe885',
      });
      p.setPart(SPRITE_PART.GLOW_FX);
      p.px(bx - 9, 65, '#9ee8ff', true);
      p.px(bx + 8, 66, '#ffe885', true);
      if (isMove) {
        p.hline(bx - 12, 64, 24, '#8cc8ff', true);
      }

      // [4] 后臂轻舒星纱广袖（掌心绽放一朵微光冰蓝月莲星屑！）
      p.setPart(SPRITE_PART.BACK_ARM);
      p.poly([[bx - 6, 34 + by], [bx - 14, 37 + by], [bx - 16, 46 + by], [bx - 8, 44 + by]], '#4d6fd9');
      p.poly([[bx - 6, 35 + by], [bx - 13, 37 + by], [bx - 14, 44 + by], [bx - 8, 43 + by]], '#8cb4ff');
      p.line(bx - 15, 45 + by, bx - 9, 44 + by, '#ffffff', 1);
      drawSoftChibiArm64(p, bx - 6, 35 + by, bx - 15, 37 + by);
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx - 16, 34 + by, 2.2, 2.2, '#7ce8ff', true);
      p.px(bx - 16, 34 + by, '#ffffff', true);

      // [5] 多层次绝美「月宫星纱天女礼裙」（深星空外裙 + 雪白流光前开轻纱 + 鎏金月相飘带，彻底摆脱蓝麻袋！）
      drawCleanAnimeSkirt64(p, {
        waistX: bx,
        waistY: 40 + by,
        waistW: 11.4,
        hemY: 54 + by,
        hemW: 31,
        swayX: sway,
        colors: {
          deep: '#10184a',
          shadow: '#1b2b7a',
          main: '#3152c4',
          light: '#648ef2',
          highlight: '#adcaff',
        },
        trimBand: {
          offsetFromHem: 2,
          thickness: 1.5,
          color: '#ffe485',
          shadowColor: '#cc9c35',
        },
        petticoat: {
          peekDepth: 2.2,
          shade: '#c7d8fa',
          main: '#f2f7ff',
          highlight: '#ffffff',
        },
      });
      // 正前方优雅层叠的雪白月华轻纱前摆（大提亮度与层次感，仙气十足！）
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.poly(
        [
          [bx - 4, 40 + by],
          [bx + 4, 40 + by],
          [bx + 8 + sway * 0.4, 54 + by],
          [bx + 1 + sway * 0.3, 56 + by],
          [bx - 5 + sway * 0.3, 53 + by],
        ],
        '#d4e5ff',
      );
      p.poly(
        [
          [bx - 3, 41 + by],
          [bx + 3, 41 + by],
          [bx + 6 + sway * 0.35, 53 + by],
          [bx + 1 + sway * 0.25, 55 + by],
          [bx - 4 + sway * 0.25, 52 + by],
        ],
        '#ffffff',
      );
      // 前摆两侧垂落的精致鎏金流苏飘带 + 星空裙面星辰微光
      p.line(bx - 4, 41 + by, bx - 5 + sway * 0.3, 53 + by, '#ffe078', 1);
      p.line(bx + 4, 41 + by, bx + 7 + sway * 0.4, 54 + by, '#ffe078', 1);
      p.setPart(SPRITE_PART.GLOW_FX);
      p.px(bx - 9, 49 + by, '#fff4b8', true);
      p.px(bx + 10, 48 + by, '#99f0ff', true);
      p.px(bx + 1, 47 + by, '#8cd6ff', true);
      // 月白收腰交领仙衣 + 靛蓝星辰胸带 + 发光星月胸宝石
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5.5, 33 + by], [bx + 5.5, 33 + by], [bx + 5.5, 41 + by], [bx - 5.5, 41 + by]], '#d6e3fa');
      p.poly([[bx - 4.5, 34 + by], [bx + 4.5, 34 + by], [bx + 4.5, 40 + by], [bx - 4.5, 40 + by]], '#ffffff');
      p.line(bx - 4, 34 + by, bx, 39 + by, '#355ec9', 1);
      p.line(bx + 4, 34 + by, bx, 39 + by, '#355ec9', 1);
      p.hline(bx - 6, 40 + by, 12, '#ffe078');
      p.ellipse(bx, 39 + by, 2.0, 2.0, '#ffd966', true);
      p.px(bx, 39 + by, '#8cf2ff', true);

      // [6] 绝美星海紫罗兰大眼仙颜 + 梦幻紫蓝渐层蓬松空气发 + 纤巧镂空鎏金弦月仙冠！
      drawKawaiiHead64(p, bx, headY, pose, {
        irisDark: '#361f8a',
        irisMid: '#7354eb',
        irisGlow: '#d9c4ff',
        lashColor: '#241852',
        blushColor: '#ffb0cc',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#333d8f',
        dark: '#5769c7',
        mid: '#8ea4f5',
        light: '#cbd9ff',
        spec: '#ffffff',
        leftLockLen: 12,
        rightLockLen: 11,
        bobFlare: true,
        sway,
      });
      // 精致绝美的双弯尖镂空鎏金弦月额冠（告别笨重三角小饭团！）
      p.setPart(SPRITE_PART.HEADWEAR);
      p.hline(bx - 6, headY - 8, 12, '#e8b846');
      p.line(bx - 5, headY - 12, bx - 2, headY - 9, '#ffe680', 2, true);
      p.line(bx + 5, headY - 12, bx + 2, headY - 9, '#ffe680', 2, true);
      p.hline(bx - 3, headY - 9, 7, '#ffe680', true);
      p.px(bx - 5, headY - 13, '#ffffff', true);
      p.px(bx + 5, headY - 13, '#ffffff', true);
      p.ellipse(bx, headY - 10, 1.5, 1.5, '#8cf2ff', true);
      p.px(bx, headY - 10, '#ffffff', true);

      // [7] 前臂自然微垂的仙女星纱广袖优雅端持「月牙抱星真·镂空鎏金星轮法杖」！
      p.setPart(SPRITE_PART.FRONT_ARM);
      const staffX = isAtk && (f === 1 || f === 2) ? bx + 17 : bx + 15;
      const staffHandY = isAtk ? 36 + by : 40 + by;
      p.poly(
        [
          [bx + 5, 34 + by],
          [staffX - 1, staffHandY - 1],
          [staffX - 2, staffHandY + 6],
          [bx + 7, 45 + by],
          [bx + 5, 42 + by],
        ],
        '#5982e8',
      );
      p.poly(
        [
          [bx + 6, 35 + by],
          [staffX - 2, staffHandY],
          [staffX - 3, staffHandY + 4],
          [bx + 7, 43 + by],
        ],
        '#9ec2ff',
      );
      p.line(staffX - 1, staffHandY - 1, staffX - 2, staffHandY + 6, '#ffffff', 1);
      drawSoftChibiArm64(p, bx + 6, 36 + by, staffX, staffHandY);

      p.setPart(SPRITE_PART.WEAPON);
      const ringCY = isAtk ? 18 + by : 21 + by;
      // 纤雅鎏金杖杆 + 杖颈飘逸星纱丝带结
      p.line(staffX - 1, 62 + by, staffX, ringCY + 6, '#b5842c', 2);
      p.line(staffX, 61 + by, staffX, ringCY + 6, '#ffe685', 1);
      p.bezierRibbon([staffX, ringCY + 8], [staffX - 3, ringCY + 13], [staffX - 5 + sway * 0.4, ringCY + 18], 1.8, 0.7, '#b5a6ff');
      // 杖首真·镂空鎏金星轮（纯镂空精致金环 + 外侧辉光新月弧 + 中心悬浮璀璨蓝白星核！）
      drawHollowRing64(p, staffX, ringCY, 6.4, 6.4, 0.74, '#c9932e', '#ffe066', '#ffffff', true);
      // 外侧新月金芒与环顶星冠
      p.px(staffX, ringCY - 7, '#ffffff', true);
      p.px(staffX - 7, ringCY, '#ffe885', true);
      p.px(staffX + 7, ringCY, '#ffe885', true);
      p.ellipse(staffX, ringCY, isAtk ? 2.8 : 2.1, isAtk ? 2.8 : 2.1, '#66d9ff', true);
      p.px(staffX, ringCY, '#ffffff', true);
      drawWrappedHand(p, staffX, staffHandY);

      // [8] 攻击爆发：星轮绽放双层镂空星阵与璀璨星月光束！
      if (isAtk && (f === 1 || f === 2)) {
        p.setPart(SPRITE_PART.GLOW_FX);
        drawHollowRing64(p, staffX, ringCY, 9.2, 9.2, 0.84, '#7d66ff', '#a8f0ff', '#ffffff', true);
        const beamEnd = Math.min(59, staffX + 16);
        p.line(staffX + 3, ringCY, beamEnd, ringCY + 4, '#5cb8ff', 3, true);
        p.line(staffX + 3, ringCY, beamEnd, ringCY + 4, '#ffffff', 1, true);
        p.px(beamEnd, ringCY + 4, '#ffe885', true);
      }
    },
  },

  /**
   * 8. 战斗 II 型（秩序 T3-B · 1×2 高挑机身！）：
   *    河童重工六臂阿修罗武士机甲 — 3/4 英雄外八跨步站姿、钛白×河童翠青×枪灰骨架×黄铜铆钉、
   *    河童发光水碟高达头雕、清晰弯肘机械关节挂载 4 副臂 + 2 主臂共 6 柄锐利尖锋等离子光刃！
   */
  creature_combat_mk2: {
    ...HD_BASE,
    backdropTop: '#081b26',
    backdropBottom: '#133747',
    backdropGlow: '#4df5d0',
    avatarCrop: { x: 14, y: 2, size: 36 },
    portraitCrop: { x: 2, y: 1, w: 60, h: 69 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 25 : Math.round(31 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 0.9 - pose.stepLift * 0.8);
      const stride = Math.round(pose.stride * 3.2);
      const headY = 18 + by;

      // 辅助函数：绘制一柄锐利收尖的高频翠蓝等离子光刃（彻底告别钝头棒！）
      const drawPlasmaBlade = (
        hx: number,
        hy: number,
        tx: number,
        ty: number,
        halfW = 1.6,
      ) => {
        p.setPart(SPRITE_PART.WEAPON);
        const dx = tx - hx;
        const dy = ty - hy;
        const len = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny = ux;
        // 枪灰金箍剑柄 + 护手
        p.line(hx - ux * 3, hy - uy * 3, hx + ux * 2, hy + uy * 2, '#344454', 2);
        p.line(hx + ux * 2 - nx * 2, hy + uy * 2 - ny * 2, hx + ux * 2 + nx * 2, hy + uy * 2 + ny * 2, '#ffd966', 1);
        // 锋利菱尖等离子刃体（先画翠青外焰多边形，再画纯白锐利芯刃！）
        p.setPart(SPRITE_PART.GLOW_FX);
        const baseX = hx + ux * 2.5;
        const baseY = hy + uy * 2.5;
        const midX = hx + ux * (len * 0.72);
        const midY = hy + uy * (len * 0.72);
        p.poly(
          [
            [baseX + nx * halfW, baseY + ny * halfW],
            [midX + nx * (halfW * 0.85), midY + ny * (halfW * 0.85)],
            [tx, ty],
            [midX - nx * (halfW * 0.85), midY - ny * (halfW * 0.85)],
            [baseX - nx * halfW, baseY - ny * halfW],
          ],
          '#18c2ab',
          true,
        );
        p.line(baseX + ux, baseY + uy, tx, ty, '#8cfff2', 1, true);
        p.line(baseX + ux * 2, baseY + uy * 2, midX, midY, '#ffffff', 1, true);
      };

      // [1] 背部双联阿修罗副机械臂挂载架（4 条分明弯肘副臂 + 4 柄高频尖刃）
      p.setPart(SPRITE_PART.BACK_ACC);
      p.poly([[bx - 10, 24 + by], [bx + 10, 24 + by], [bx + 8, 35 + by], [bx - 8, 35 + by]], '#304052');
      p.hline(bx - 9, 25 + by, 18, '#289e8c');
      p.px(bx - 7, 27 + by, '#ffe078');
      p.px(bx + 6, 27 + by, '#ffe078');

      // 副臂 1（左上高举臂）
      const sub1ElbowX = bx - 16;
      const sub1ElbowY = 21 + by;
      const sub1HandX = isAtk && f === 1 ? bx - 5 : bx - 18;
      const sub1HandY = isAtk && f === 1 ? 12 + by : 14 + by;
      p.line(bx - 8, 26 + by, sub1ElbowX, sub1ElbowY, '#495a6e', 3);
      p.line(sub1ElbowX, sub1ElbowY, sub1HandX, sub1HandY, '#c9d8e6', 3);
      p.ellipse(sub1ElbowX, sub1ElbowY, 2.2, 2.2, '#d9a844');
      drawPlasmaBlade(
        sub1HandX,
        sub1HandY,
        isAtk && f === 1 ? bx + 15 : bx - 25,
        isAtk && f === 1 ? 9 + by : 5 + by,
        1.7,
      );

      // 副臂 2（左中平展臂）
      p.setPart(SPRITE_PART.BACK_ACC);
      const sub2ElbowX = bx - 17;
      const sub2ElbowY = 34 + by;
      const sub2HandX = isAtk && f === 1 ? bx - 11 : bx - 21;
      const sub2HandY = 37 + by;
      p.line(bx - 8, 31 + by, sub2ElbowX, sub2ElbowY, '#495a6e', 3);
      p.line(sub2ElbowX, sub2ElbowY, sub2HandX, sub2HandY, '#c9d8e6', 3);
      p.ellipse(sub2ElbowX, sub2ElbowY, 2.0, 2.0, '#d9a844');
      drawPlasmaBlade(
        sub2HandX,
        sub2HandY,
        isAtk && f === 1 ? bx - 22 : bx - 27,
        isAtk && f === 1 ? 25 + by : 27 + by,
        1.6,
      );

      // 副臂 3（右上高举臂）
      p.setPart(SPRITE_PART.BACK_ACC);
      const sub3ElbowX = bx + 15;
      const sub3ElbowY = 21 + by;
      const sub3HandX = isAtk && f === 1 ? bx + 20 : bx + 17;
      const sub3HandY = isAtk && f === 1 ? 15 + by : 13 + by;
      p.line(bx + 8, 26 + by, sub3ElbowX, sub3ElbowY, '#495a6e', 3);
      p.line(sub3ElbowX, sub3ElbowY, sub3HandX, sub3HandY, '#e3eef7', 3);
      p.ellipse(sub3ElbowX, sub3ElbowY, 2.2, 2.2, '#ffd966');
      drawPlasmaBlade(
        sub3HandX,
        sub3HandY,
        isAtk && f === 1 ? Math.min(59, bx + 32) : bx + 26,
        isAtk && f === 1 ? 19 + by : 5 + by,
        1.7,
      );

      // 副臂 4（右中前袭臂）
      p.setPart(SPRITE_PART.BACK_ACC);
      const sub4ElbowX = bx + 15;
      const sub4ElbowY = 34 + by;
      const sub4HandX = isAtk && f === 1 ? bx + 21 : bx + 19;
      const sub4HandY = isAtk && f === 1 ? 31 + by : 36 + by;
      p.line(bx + 8, 31 + by, sub4ElbowX, sub4ElbowY, '#495a6e', 3);
      p.line(sub4ElbowX, sub4ElbowY, sub4HandX, sub4HandY, '#e3eef7', 3);
      p.ellipse(sub4ElbowX, sub4ElbowY, 2.0, 2.0, '#ffd966');
      drawPlasmaBlade(
        sub4HandX,
        sub4HandY,
        isAtk && f === 1 ? Math.min(59, bx + 33) : Math.min(58, bx + 28),
        isAtk && f === 1 ? 27 + by : 25 + by,
        1.6,
      );

      // [2] 超帅 3/4 英雄外八跨步机动长腿（彻底告别立正军姿！外斜撑地 + 尖锐翠青护膝与侧喷翼！）
      p.setPart(SPRITE_PART.LEGS);
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      // 后撤外斜左机械长腿
      p.poly(
        [
          [bx - 8 - stride, 43 + lLift],
          [bx - 2 - stride, 43 + lLift],
          [bx - 7 - stride, 62 + lLift],
          [bx - 14 - stride, 62 + lLift],
        ],
        '#44566b',
      );
      p.poly(
        [
          [bx - 7 - stride, 44 + lLift],
          [bx - 3 - stride, 44 + lLift],
          [bx - 8 - stride, 60 + lLift],
          [bx - 13 - stride, 60 + lLift],
        ],
        '#bdcee0',
      );
      // 尖锐左翠青护膝与外侧机翼鳍
      p.poly([[bx - 11 - stride, 49 + lLift], [bx - 4 - stride, 48 + lLift], [bx - 6 - stride, 54 + lLift], [bx - 11 - stride, 53 + lLift]], '#1f9682');
      p.hline(bx - 10 - stride, 49 + lLift, 5, '#78ffe8');
      p.poly([[bx - 16 - stride, 61 + lLift], [bx - 5 - stride, 61 + lLift], [bx - 4 - stride, 66 + lLift], [bx - 17 - stride, 66 + lLift]], '#2c3a4a');
      p.hline(bx - 15 - stride, 62 + lLift, 10, '#2ec2a8');

      // 前跨霸气外八右机械长腿（受光高亮钛白 + 侧喷装甲鳍！）
      p.poly(
        [
          [bx + 2 + stride, 43 + rLift],
          [bx + 8 + stride, 43 + rLift],
          [bx + 15 + stride, 63 + rLift],
          [bx + 7 + stride, 63 + rLift],
        ],
        '#536780',
      );
      p.poly(
        [
          [bx + 3 + stride, 44 + rLift],
          [bx + 7 + stride, 44 + rLift],
          [bx + 13 + stride, 61 + rLift],
          [bx + 8 + stride, 61 + rLift],
        ],
        '#edf6ff',
      );
      // 右小腿外侧机动装甲鳍
      p.poly([[bx + 11 + stride, 52 + rLift], [bx + 16 + stride, 55 + rLift], [bx + 14 + stride, 60 + rLift]], '#24a68e');
      p.poly([[bx + 4 + stride, 48 + rLift], [bx + 11 + stride, 49 + rLift], [bx + 11 + stride, 54 + rLift], [bx + 6 + stride, 54 + rLift]], '#2ac4a8');
      p.hline(bx + 5 + stride, 49 + rLift, 5, '#c4fff5');
      p.poly([[bx + 6 + stride, 62 + rLift], [bx + 17 + stride, 62 + rLift], [bx + 19 + stride, 67 + rLift], [bx + 6 + stride, 67 + rLift]], '#35485e');
      p.hline(bx + 7 + stride, 63 + rLift, 10, '#78ffea');

      // [3] 精悍机械收腰 + 分体机动前裙甲 + 倒三角钛白翠青胸甲 + 河童水力核炉！
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.rect(bx - 6, 37 + by, 12, 6, '#303f52'); // 机械收腰骨架
      p.poly([[bx - 10, 40 + by], [bx - 3, 40 + by], [bx - 5, 47 + by], [bx - 12, 46 + by]], '#d2e1f0');
      p.poly([[bx + 3, 40 + by], [bx + 10, 40 + by], [bx + 12, 46 + by], [bx + 5, 47 + by]], '#ffffff');
      p.rect(bx - 2, 39 + by, 5, 8, '#229c87');
      p.hline(bx - 2, 39 + by, 5, '#ffe078');

      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 11, 24 + by], [bx + 11, 24 + by], [bx + 7, 38 + by], [bx - 7, 38 + by]], '#35475c');
      p.poly([[bx - 10, 25 + by], [bx + 10, 25 + by], [bx + 6, 37 + by], [bx - 6, 37 + by]], '#e6f2fc');
      p.poly([[bx - 9, 25 + by], [bx + 9, 25 + by], [bx + 5, 29 + by], [bx - 5, 29 + by]], '#ffffff');
      // 河童重工斜切翠青胸肋装甲与金饰
      p.poly([[bx - 9, 28 + by], [bx - 3, 30 + by], [bx - 4, 36 + by], [bx - 7, 34 + by]], '#229c87');
      p.poly([[bx + 9, 28 + by], [bx + 3, 30 + by], [bx + 4, 36 + by], [bx + 7, 34 + by]], '#2ec4a8');
      p.hline(bx - 10, 25 + by, 20, '#ffd966');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx, 31 + by, 3.2, 3.0, '#147a73');
      p.ellipse(bx, 31 + by, 2.3, 2.1, '#4dfce8', true);
      p.px(bx, 30 + by, '#ffffff', true);

      // [4] 帅气「河童发光水碟 × 武士高达双角天线」头雕！
      p.setPart(SPRITE_PART.HEADWEAR);
      p.poly([[bx - 6, headY - 4], [bx + 6, headY - 4], [bx + 5, headY + 4], [bx, headY + 6], [bx - 5, headY + 4]], '#394b5e');
      p.poly([[bx - 5, headY - 3], [bx + 5, headY - 3], [bx + 4, headY + 3], [bx, headY + 5], [bx - 4, headY + 3]], '#eef6ff');
      p.ellipse(bx, headY - 4, 5.2, 2.2, '#ffd966');
      p.ellipse(bx, headY - 4, 3.8, 1.4, '#4dfce8', true);
      p.hline(bx - 2, headY - 4, 4, '#ffffff', true);
      p.line(bx, headY - 3, bx - 7, headY - 9, '#ffd966', 2);
      p.line(bx, headY - 3, bx + 7, headY - 9, '#ffe885', 2);
      p.px(bx - 7, headY - 9, '#ffffff', true);
      p.px(bx + 7, headY - 9, '#ffffff', true);
      p.rect(bx - 4, headY - 1, 8, 3, '#101c26');
      p.hline(bx - 3, headY, 6, '#4dfce8', true);
      p.px(bx + 1, headY, '#ffffff', true);
      p.hline(bx - 2, headY + 3, 4, '#24a68e');

      // [5] 2 条粗壮主机械臂（外翘斜切翠青大肩甲 + 2 柄锋锐主光刃！）
      p.setPart(SPRITE_PART.BACK_ARM);
      p.poly([[bx - 15, 22 + by], [bx - 8, 24 + by], [bx - 8, 31 + by], [bx - 14, 30 + by]], '#229c87');
      p.hline(bx - 15, 23 + by, 7, '#ffe078');
      const lMainHandX = isAtk && f === 1 ? bx - 5 : bx - 15;
      const lMainHandY = isAtk && f === 1 ? 43 + by : 44 + by;
      p.line(bx - 11, 29 + by, lMainHandX, lMainHandY, '#667a8f', 3);
      p.ellipse(lMainHandX, lMainHandY, 2.3, 2.3, '#dce8f5');
      drawPlasmaBlade(
        lMainHandX,
        lMainHandY,
        isAtk && f === 1 ? bx + 13 : bx - 23,
        isAtk && f === 1 ? 47 + by : 52 + by,
        1.8,
      );

      p.setPart(SPRITE_PART.FRONT_ARM);
      p.poly([[bx + 8, 24 + by], [bx + 16, 22 + by], [bx + 15, 30 + by], [bx + 8, 31 + by]], '#2ec4a8');
      p.hline(bx + 8, 23 + by, 8, '#ffe885');
      const rMainHandX = isAtk && f === 0 ? bx + 11 : isAtk && (f === 1 || f === 2) ? bx + 18 : bx + 15;
      const rMainHandY = isAtk && f === 0 ? 33 + by : isAtk && (f === 1 || f === 2) ? 40 + by : 42 + by;
      p.line(bx + 11, 29 + by, rMainHandX, rMainHandY, '#9eb3c9', 4);
      p.line(bx + 11, 28 + by, rMainHandX, rMainHandY - 1, '#ffffff', 1);
      p.ellipse(rMainHandX, rMainHandY, 2.5, 2.5, '#eef6ff');
      drawPlasmaBlade(
        rMainHandX,
        rMainHandY,
        isAtk && f === 0 ? bx + 20 : isAtk && (f === 1 || f === 2) ? Math.min(60, bx + 33) : Math.min(58, bx + 27),
        isAtk && f === 0 ? 20 + by : isAtk && (f === 1 || f === 2) ? 45 + by : 47 + by,
        2.1,
      );

      // [6] 攻击爆发：六刃齐斩无反击高频翠白光网（100% 完整在画幅内零裁切！）
      if (isAtk && (f === 1 || f === 2)) {
        drawSlashArc64(p, bx + 17, 30 + by, 14, 18, -1.25, 1.1, '#19bfa8', '#78fff0', '#ffffff');
        drawSlashArc64(p, bx + 21, 38 + by, 11, 12, -0.9, 1.05, '#ffe478', '#b8fff5', '#ffffff');
      }
    },
  },

  /**
   * 9. 净秽者（秩序 T4-A · 1×2 高挑远程月都苍雷天神将）：
   *    背后真·镂空鎏金日晷星神轮 + 柔和飘逸深夜星空大披风 + 侧披铂银神发 + 雕金洁白神假面与苍蓝星瞳 +
   *    鎏金双翼新月冕 + 修长深蓝白金神铠与长胫甲 + 左掌苍雷星核 + 右手苍雷三叉天戟！
   */
  creature_purity_titan: {
    ...HD_BASE,
    backdropTop: '#081029',
    backdropBottom: '#192a5e',
    backdropGlow: '#78d8ff',
    avatarCrop: { x: 14, y: 2, size: 36 },
    portraitCrop: { x: 2, y: 1, w: 60, h: 69 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 24 : Math.round(29 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 0.9 - pose.stepLift * 0.8);
      const sway = pose.flutter * 1.4;
      const headY = 17 + by;

      // [1] 背后宏伟「真·镂空鎏金日晷星神轮」（纯镂空金环 + 8 道锐利星芒刻针，零黑片！）
      p.setPart(SPRITE_PART.BACK_ACC);
      const haloCY = 22 + by;
      drawHollowRing64(p, bx, haloCY, 15.2, 15.2, 0.85, '#c28b29', '#ffe066', '#ffffff', true);
      drawHollowRing64(p, bx, haloCY, 11.0, 11.0, 0.87, '#4fa8ff', '#a8e8ff', '#ffffff', true);
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4 + phase * 0.1;
        const r0 = 15.0;
        const r1 = i % 2 === 0 ? 18.8 : 17.2;
        p.line(
          bx + Math.cos(ang) * r0,
          haloCY + Math.sin(ang) * r0,
          bx + Math.cos(ang) * r1,
          haloCY + Math.sin(ang) * r1,
          i % 2 === 0 ? '#ffe885' : '#8ce0ff',
          1,
          true,
        );
      }

      // [2] 优雅飘扬的「深夜星空大披风」（柔和波浪斜收尾，彻底告别生硬黄横棍！）
      p.poly(
        [
          [bx - 10, 26 + by],
          [bx + 9, 26 + by],
          [bx + 13 - sway * 0.3, 56 + by],
          [bx + 6 - sway * 0.2, 61 + by],
          [bx - 9 + sway * 0.6, 61 + by],
          [bx - 17 + sway, 57 + by],
        ],
        '#142152',
      );
      p.poly(
        [
          [bx - 8, 27 + by],
          [bx + 7, 27 + by],
          [bx + 10 - sway * 0.3, 54 + by],
          [bx - 13 + sway * 0.8, 56 + by],
        ],
        '#203b85',
      );
      p.setPart(SPRITE_PART.GLOW_FX);
      p.px(bx - 11 + Math.round(sway * 0.5), 48 + by, '#fff4b8', true);
      p.px(bx - 8 + Math.round(sway * 0.4), 55 + by, '#8ce8ff', true);
      p.px(bx + 9, 50 + by, '#ffffff', true);

      // [3] 飘逸在肩侧后方的铂银长发缕（彻底消除下巴下方的灰白胡子围兜！）
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.bezierRibbon([bx - 6, headY + 2], [bx - 11, headY + 11], [bx - 13 + sway * 0.5, headY + 19], 3.4, 1.0, '#a8bce0');
      p.bezierRibbon([bx - 5, headY + 2], [bx - 9, headY + 10], [bx - 11 + sway * 0.4, headY + 17], 1.6, 0.6, '#eef5ff');
      p.bezierRibbon([bx + 6, headY + 2], [bx + 10, headY + 10], [bx + 12 - sway * 0.4, headY + 17], 3.0, 1.0, '#b8cae8');

      // [4] 修长威严 3/4 跨步深海蓝×白金神胫甲与高筒圣靴（彻底摆脱灯笼阔腿裤！）
      p.setPart(SPRITE_PART.LEGS);
      const stride = Math.round(pose.stride * 2.8);
      // 后撑左神腿
      p.poly(
        [
          [bx - 7 - stride, 43],
          [bx - 2 - stride, 43],
          [bx - 5 - stride, 62],
          [bx - 10 - stride, 62],
        ],
        '#213878',
      );
      p.poly(
        [
          [bx - 6 - stride, 49],
          [bx - 2 - stride, 49],
          [bx - 5 - stride, 61],
          [bx - 9 - stride, 61],
        ],
        '#c2d4f2',
      );
      p.rect(bx - 9 - stride, 49, 6, 3, '#e0af42'); // 金护膝
      p.poly([[bx - 11 - stride, 61], [bx - 3 - stride, 61], [bx - 3 - stride, 66], [bx - 12 - stride, 66]], '#dce7fc');
      p.hline(bx - 10 - stride, 62, 7, '#ffe078');
      // 前跨右神腿
      p.poly(
        [
          [bx + 2 + stride, 43],
          [bx + 7 + stride, 43],
          [bx + 11 + stride, 63],
          [bx + 5 + stride, 63],
        ],
        '#2b4a9c',
      );
      p.poly(
        [
          [bx + 3 + stride, 49],
          [bx + 8 + stride, 49],
          [bx + 10 + stride, 62],
          [bx + 5 + stride, 62],
        ],
        '#edf5ff',
      );
      p.rect(bx + 3 + stride, 49, 6, 3, '#ffd966');
      p.poly([[bx + 5 + stride, 62], [bx + 13 + stride, 62], [bx + 14 + stride, 67], [bx + 5 + stride, 67]], '#ffffff');
      p.hline(bx + 6 + stride, 63, 7, '#ffe680');

      // [5] 修长霸气分体神将战裙甲 + 窄长中央金纹战旌 + V 字白金蓝胸铠！
      p.setPart(SPRITE_PART.SKIRT);
      // 两侧修长外斜雕金裙甲
      p.poly([[bx - 8, 40 + by], [bx - 3, 40 + by], [bx - 7, 54 + by], [bx - 13 + sway * 0.3, 52 + by]], '#d9e4f7');
      p.poly([[bx - 7, 41 + by], [bx - 4, 41 + by], [bx - 8, 52 + by], [bx - 11 + sway * 0.3, 51 + by]], '#ffffff');
      p.line(bx - 12 + sway * 0.3, 52 + by, bx - 7, 54 + by, '#ffe078', 1);
      p.poly([[bx + 3, 40 + by], [bx + 8, 40 + by], [bx + 13 - sway * 0.2, 52 + by], [bx + 7, 54 + by]], '#d9e4f7');
      p.poly([[bx + 4, 41 + by], [bx + 7, 41 + by], [bx + 11 - sway * 0.2, 51 + by], [bx + 8, 52 + by]], '#ffffff');
      p.line(bx + 7, 54 + by, bx + 12 - sway * 0.2, 52 + by, '#ffe078', 1);
      // 中央修长月蓝金边神将战旌（优雅垂于双膝间！）
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.poly([[bx - 3, 40 + by], [bx + 3, 40 + by], [bx + 2, 56 + by], [bx, 59 + by], [bx - 2, 56 + by]], '#24479e');
      p.vline(bx, 42 + by, 14, '#ffe278');
      p.px(bx, 47 + by, '#8ce8ff', true);

      // 立体 V 字白金胸铠 + 深海蓝颈甲衬领 + 胸口苍雷核心 + 双翼金肩甲
      p.setPart(SPRITE_PART.TORSO);
      p.rect(bx - 3, 22 + by, 6, 4, '#1b3578'); // 清晰优雅的深海蓝神铠立领！
      p.hline(bx - 4, 24 + by, 8, '#ffe078');
      p.poly([[bx - 10, 25 + by], [bx + 10, 25 + by], [bx + 6, 41 + by], [bx - 6, 41 + by]], '#9fb4db');
      p.poly([[bx - 9, 26 + by], [bx + 9, 26 + by], [bx + 5, 39 + by], [bx - 5, 39 + by]], '#ffffff');
      p.poly([[bx - 7, 27 + by], [bx + 7, 27 + by], [bx + 4, 33 + by], [bx - 4, 33 + by]], '#254ba3');
      p.hline(bx - 9, 26 + by, 18, '#ffd966');
      p.hline(bx - 6, 40 + by, 12, '#ffd966');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx, 31 + by, 3.0, 3.4, '#369cff', true);
      p.ellipse(bx, 31 + by, 1.6, 2.0, '#ffffff', true);
      // 威武双翼雕金重肩甲
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 15, 24 + by], [bx - 7, 25 + by], [bx - 7, 32 + by], [bx - 13, 31 + by]], '#e0af42');
      p.poly([[bx - 14, 25 + by], [bx - 8, 26 + by], [bx - 8, 30 + by], [bx - 12, 29 + by]], '#fff4bf');
      p.poly([[bx + 7, 25 + by], [bx + 15, 24 + by], [bx + 13, 31 + by], [bx + 7, 32 + by]], '#e0af42');
      p.poly([[bx + 8, 26 + by], [bx + 14, 25 + by], [bx + 12, 29 + by], [bx + 8, 30 + by]], '#fff8d6');

      // [6] 左臂前掌托浮滋滋跃动的「苍雷净秽星核」！
      p.setPart(SPRITE_PART.BACK_ARM);
      const orbX = isAtk && f === 0 ? bx - 12 : bx - 14;
      const orbY = isAtk ? 31 + by : 36 + by;
      p.line(bx - 10, 29 + by, orbX + 1, orbY + 4, '#cfdcf5', 3);
      p.ellipse(orbX + 1, orbY + 4, 2.2, 2.0, '#ffffff');
      p.setPart(SPRITE_PART.GLOW_FX);
      const orbR = isAtk ? 4.2 : 3.2;
      p.ellipse(orbX, orbY - 1, orbR, orbR, '#3da8ff', true);
      p.ellipse(orbX, orbY - 1, orbR * 0.55, orbR * 0.55, '#ffffff', true);
      p.line(orbX - 4, orbY - 4, orbX - 1, orbY - 2, '#b8f4ff', 1, true);
      p.line(orbX + 4, orbY + 2, orbX + 2, orbY, '#b8f4ff', 1, true);

      // [7] 流线雕金洁白神假面与苍蓝星神双瞳 + 鎏金双翼新月神冕！
      p.setPart(SPRITE_PART.NECK_HEAD);
      p.poly([[bx - 6, headY - 5], [bx + 6, headY - 5], [bx + 5, headY + 4], [bx, headY + 6], [bx - 5, headY + 4]], '#cddbf2');
      p.poly([[bx - 5, headY - 4], [bx + 5, headY - 4], [bx + 4, headY + 3], [bx, headY + 5], [bx - 4, headY + 3]], '#ffffff');
      p.line(bx - 4, headY - 2, bx, headY, '#ffd966', 1);
      p.line(bx + 4, headY - 2, bx, headY, '#ffd966', 1);
      p.vline(bx, headY, 5, '#e8b846');
      p.setPart(SPRITE_PART.FACE_FEATURES);
      if (pose.expr !== 'hurt') {
        p.rect(bx - 4, headY, 3, 2, '#29b6ff', true);
        p.rect(bx + 1, headY, 3, 2, '#29b6ff', true);
        p.px(bx - 3, headY, '#ffffff', true);
        p.px(bx + 2, headY, '#ffffff', true);
      } else {
        p.hline(bx - 4, headY + 1, 3, '#4f6494');
        p.hline(bx + 1, headY + 1, 3, '#4f6494');
      }
      p.setPart(SPRITE_PART.HEADWEAR);
      p.poly([[bx - 7, headY - 4], [bx - 11, headY - 11], [bx - 4, headY - 7]], '#ffd966', true);
      p.poly([[bx + 7, headY - 4], [bx + 11, headY - 11], [bx + 4, headY - 7]], '#ffe885', true);
      p.ellipse(bx, headY - 7, 3.4, 3.0, '#ffe478', true);
      p.ellipse(bx, headY - 8, 2.2, 2.0, '#142152');
      p.px(bx, headY - 6, '#99f0ff', true);

      // [8] 右臂高擎宏伟「苍雷三叉天戟」+ 完整零裁切净秽裁决苍雷长枪光束！
      p.setPart(SPRITE_PART.FRONT_ARM);
      const handX = isAtk && f === 0 ? bx + 11 : isAtk && (f === 1 || f === 2) ? bx + 15 : bx + 14;
      const handY = isAtk ? 33 + by : 37 + by;
      p.line(bx + 10, 29 + by, handX, handY, '#dce7fc', 3);
      p.line(bx + 10, 28 + by, handX, handY - 1, '#ffffff', 1);

      p.setPart(SPRITE_PART.WEAPON);
      if (isAtk && (f === 1 || f === 2)) {
        const tipX = bx + 24;
        const tipY = handY - 2;
        p.line(bx - 2, handY + 2, tipX, tipY, '#d9a436', 2);
        p.line(bx - 1, handY + 1, tipX, tipY - 1, '#fff2ad', 1);
        p.poly([[tipX - 3, tipY - 5], [tipX + 3, tipY - 4], [tipX, tipY - 1]], '#ffe478', true);
        p.poly([[tipX - 3, tipY + 5], [tipX + 3, tipY + 4], [tipX, tipY + 1]], '#ffe478', true);
        p.poly([[tipX - 2, tipY - 2], [tipX + 6, tipY], [tipX - 2, tipY + 2]], '#99f0ff', true);
        drawWrappedHand(p, handX, handY, '#dce7fc', '#ffffff', '#7a8eb8');

        p.setPart(SPRITE_PART.GLOW_FX);
        const beamEnd = Math.min(60, tipX + 12);
        p.line(tipX + 3, tipY, beamEnd, tipY, '#339eff', 4, true);
        p.hline(tipX + 4, tipY, Math.max(2, beamEnd - tipX - 4), '#ffffff', true);
        p.line(tipX + 2, tipY - 5, tipX + 7, tipY - 2, '#99f4ff', 1, true);
        p.line(tipX + 7, tipY - 2, beamEnd - 2, tipY - 4, '#ffffff', 1, true);
        p.line(tipX + 3, tipY + 5, tipX + 8, tipY + 2, '#99f4ff', 1, true);
      } else {
        const poleX = handX + 1;
        p.line(poleX, 64 + by, poleX, 14 + by, '#c9942e', 2);
        p.vline(poleX + 1, 14 + by, 49, '#fff2ad');
        p.poly([[poleX - 6, 17 + by], [poleX - 5, 8 + by], [poleX - 2, 16 + by]], '#ffe066', true);
        p.poly([[poleX + 6, 17 + by], [poleX + 5, 8 + by], [poleX + 2, 16 + by]], '#ffe066', true);
        p.poly([[poleX - 3, 16 + by], [poleX, 4 + by], [poleX + 3, 16 + by]], '#8ce8ff', true);
        p.vline(poleX, 6 + by, 10, '#ffffff', true);
        p.hline(poleX - 6, 16 + by, 13, '#ffe478', true);
        drawWrappedHand(p, handX, handY, '#dce7fc', '#ffffff', '#7a8eb8');
        p.setPart(SPRITE_PART.GLOW_FX);
        p.px(poleX - 5, 7 + by, '#b8f4ff', true);
        p.px(poleX + 5, 7 + by, '#b8f4ff', true);
        p.px(poleX, 4 + by, '#ffffff', true);
      }
    },
  },

  /**
   * 10. 非想天则（秩序 T4-B · 2×2 勇者系超级蒸汽机神！）：
   *     高耸双联黄铜蒸汽大烟囱与立体白雾 + 棱角锐利武士金月高冠头雕 + 倒三角 V 字朱漆金边胸铠 +
   *     璀璨炽白太阳核心核动力反应炉 + 精悍收腰机械腹甲 + 雄迈 3/4 重装战胫 + 喷焰先攻火箭铁拳！
   */
  creature_hisoutensoku: {
    ...HD_BASE,
    backdropTop: '#0b1026',
    backdropBottom: '#2b182e',
    backdropGlow: '#ffad33',
    avatarCrop: { x: 12, y: 3, size: 40 },
    portraitCrop: { x: 1, y: 1, w: 62, h: 70 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      // 攻击时左右双肩甲与前冲火箭铁拳+冲击波全部严格留白于 [3..61]，100% 零裁切！
      const bx = isAtk && (f === 1 || f === 2) ? 26 : Math.round(31 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 0.85 - pose.stepLift * 0.6) + 2;
      const legStride = Math.round(pose.stride * 3.8);

      // [1] 背部双联黄铜重型蒸汽大烟囱 + 立体蓬松白雾蒸汽（留足顶部空间零贴顶！）
      p.setPart(SPRITE_PART.BACK_ACC);
      const steamShift = (pose.frame * 2) % 4;
      p.rect(bx - 16, 9 + by, 6, 16, '#323d59');
      p.rect(bx - 15, 10 + by, 3, 13, '#6b7ca8');
      p.hline(bx - 16, 9 + by, 6, '#ffe073');
      p.hline(bx - 16, 13 + by, 6, '#b8852b');

      p.rect(bx + 10, 9 + by, 6, 16, '#323d59');
      p.rect(bx + 11, 10 + by, 3, 13, '#8496c7');
      p.hline(bx + 10, 9 + by, 6, '#ffe885');
      p.hline(bx + 10, 13 + by, 6, '#c79234');

      p.ellipse(bx - 13, 6 + by - Math.min(2, steamShift * 0.5), 3.4, 2.2, '#b9cfe8');
      p.ellipse(bx - 14, 5 + by - Math.min(2, steamShift * 0.5), 2.1, 1.4, '#eef6ff');
      p.ellipse(bx + 13, 6 + by - Math.min(2, ((steamShift + 2) % 4) * 0.5), 3.2, 2.0, '#b9cfe8');
      p.ellipse(bx + 12, 5 + by - Math.min(2, ((steamShift + 2) % 4) * 0.5), 2.0, 1.3, '#ffffff');

      // [2] 雄迈 3/4 跨步超级系外八重装战胫（厚重钢铁蓝胫甲 + 尖锐金护膝 + 朱漆大重靴！）
      p.setPart(SPRITE_PART.LEGS);
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      // 左后蹬重腿
      p.poly(
        [
          [bx - 11 - legStride, 43 + lLift],
          [bx - 3 - legStride, 43 + lLift],
          [bx - 6 - legStride, 62 + lLift],
          [bx - 17 - legStride, 62 + lLift],
        ],
        '#252e47',
      );
      p.poly(
        [
          [bx - 10 - legStride, 44 + lLift],
          [bx - 4 - legStride, 44 + lLift],
          [bx - 7 - legStride, 60 + lLift],
          [bx - 14 - legStride, 60 + lLift],
        ],
        '#5a6a94',
      );
      p.poly(
        [
          [bx - 13 - legStride, 48 + lLift],
          [bx - 4 - legStride, 47 + lLift],
          [bx - 6 - legStride, 54 + lLift],
          [bx - 11 - legStride, 54 + lLift],
        ],
        '#deb043',
      );
      p.hline(bx - 12 - legStride, 48 + lLift, 7, '#fff3b0');
      p.poly(
        [
          [bx - 18 - legStride, 60 + lLift],
          [bx - 4 - legStride, 60 + lLift],
          [bx - 4 - legStride, 66 + lLift],
          [bx - 20 - legStride, 66 + lLift],
        ],
        '#9e1e36',
      );
      p.hline(bx - 17 - legStride, 61 + lLift, 12, '#f25c78');
      p.hline(bx - 19 - legStride, 65 + lLift, 15, '#591120');

      // 右前跨重腿（受光高亮立体面！）
      p.poly(
        [
          [bx + 3 + legStride, 43 + rLift],
          [bx + 11 + legStride, 43 + rLift],
          [bx + 18 + legStride, 63 + rLift],
          [bx + 6 + legStride, 63 + rLift],
        ],
        '#323f61',
      );
      p.poly(
        [
          [bx + 4 + legStride, 44 + rLift],
          [bx + 10 + legStride, 44 + rLift],
          [bx + 15 + legStride, 61 + rLift],
          [bx + 7 + legStride, 61 + rLift],
        ],
        '#8598c9',
      );
      p.line(bx + 9 + legStride, 45 + rLift, bx + 13 + legStride, 60 + rLift, '#c4d4f7', 2);
      p.poly(
        [
          [bx + 4 + legStride, 47 + rLift],
          [bx + 13 + legStride, 48 + rLift],
          [bx + 12 + legStride, 54 + rLift],
          [bx + 6 + legStride, 54 + rLift],
        ],
        '#ffd466',
      );
      p.hline(bx + 5 + legStride, 48 + rLift, 7, '#ffffff');
      p.poly(
        [
          [bx + 5 + legStride, 61 + rLift],
          [bx + 19 + legStride, 61 + rLift],
          [bx + 21 + legStride, 67 + rLift],
          [bx + 5 + legStride, 67 + rLift],
        ],
        '#cc2b49',
      );
      p.hline(bx + 6 + legStride, 62 + rLift, 13, '#ff859b');
      p.hline(bx + 6 + legStride, 66 + rLift, 15, '#6e1325');

      // [3] 精悍收腰机械腹甲 + 分体红金前裙甲 + 强倒三角 3D V 字朱漆胸铠 + 炽白太阳核心反应炉！
      p.setPart(SPRITE_PART.APRON_WAIST);
      // 机械钢灰液压收腰（凸显勇者系超级机神健美倒三角轮廓，彻底告别方砖！）
      p.rect(bx - 8, 34 + by, 16, 6, '#354263');
      p.vline(bx - 5, 35 + by, 4, '#889bc9');
      p.vline(bx + 5, 35 + by, 4, '#889bc9');
      // 分体式前裙甲
      p.poly([[bx - 13, 38 + by], [bx - 4, 38 + by], [bx - 5, 45 + by], [bx - 14, 44 + by]], '#a82039');
      p.hline(bx - 13, 39 + by, 8, '#f25c78');
      p.poly([[bx + 4, 38 + by], [bx + 13, 38 + by], [bx + 14, 44 + by], [bx + 5, 45 + by]], '#cf2d4b');
      p.hline(bx + 5, 39 + by, 8, '#ff8299');
      p.rect(bx - 4, 38 + by, 8, 8, '#d9a438');
      p.rect(bx - 3, 39 + by, 6, 4, '#fff099');

      // 宏伟强倒三角 V 字立体朱漆胸铠
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 16, 18 + by], [bx + 16, 18 + by], [bx + 10, 35 + by], [bx - 10, 35 + by]], '#222b42');
      p.poly([[bx - 15, 19 + by], [bx + 15, 19 + by], [bx + 9, 34 + by], [bx - 9, 34 + by]], '#a81e37');
      p.poly([[bx - 14, 20 + by], [bx + 14, 20 + by], [bx + 8, 31 + by], [bx - 8, 31 + by]], '#de3554');
      p.poly([[bx - 12, 20 + by], [bx + 12, 20 + by], [bx + 7, 24 + by], [bx - 7, 24 + by]], '#ff7890');
      // 胸口 V 型黄金护胸棱线
      p.line(bx - 14, 20 + by, bx - 9, 33 + by, '#ffe073', 2);
      p.line(bx + 14, 20 + by, bx + 9, 33 + by, '#ffe885', 2);
      p.hline(bx - 14, 19 + by, 28, '#ffe073');
      // 胸口炽烈通透太阳核心核动力反应炉（无粗十字挡芯，炽白核光芒四射！）
      p.setPart(SPRITE_PART.GLOW_FX);
      const corePulse = isAtk ? 1.5 : pose.flutter > 0.4 ? 0.6 : 0;
      p.ellipse(bx, 26 + by, 6.2, 5.2, '#3d2218');
      p.ellipse(bx, 26 + by, 5.2 + corePulse, 4.3 + corePulse * 0.6, '#ff8c1a', true);
      p.ellipse(bx, 26 + by, 3.8 + corePulse * 0.5, 3.2 + corePulse * 0.5, '#ffe866', true);
      p.ellipse(bx, 26 + by, 2.2 + corePulse * 0.3, 1.9 + corePulse * 0.3, '#ffffff', true);
      // 精致外围左右玄铁卡爪（不遮核心！）
      p.setPart(SPRITE_PART.TORSO);
      p.rect(bx - 6, 25 + by, 2, 3, '#3b2319');
      p.rect(bx + 5, 25 + by, 2, 3, '#3b2319');

      // [4] 威武超级系和风武士大金月高冠头雕 + 翠青发光双目镜！
      p.setPart(SPRITE_PART.HEADWEAR);
      const headY = 13 + by;
      p.poly([[bx - 8, headY - 4], [bx + 8, headY - 4], [bx + 7, headY + 5], [bx, headY + 7], [bx - 7, headY + 5]], '#2b3552');
      p.poly([[bx - 7, headY - 3], [bx + 7, headY - 3], [bx + 6, headY + 4], [bx, headY + 6], [bx - 6, headY + 4]], '#8295c7');
      p.hline(bx - 5, headY - 3, 10, '#c8d6fa');
      p.poly(
        [
          [bx - 12, headY - 5],
          [bx - 7, headY - 10],
          [bx, headY - 5],
          [bx + 7, headY - 10],
          [bx + 12, headY - 5],
          [bx, headY - 2],
        ],
        '#e8b238',
        true,
      );
      p.line(bx - 11, headY - 6, bx - 7, headY - 10, '#fff7bd', 1, true);
      p.line(bx + 7, headY - 10, bx + 11, headY - 6, '#fff7bd', 1, true);
      p.ellipse(bx, headY - 6, 1.8, 1.8, '#ffffff', true);
      p.rect(bx - 5, headY, 10, 3, '#101524');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.rect(bx - 4, headY, 3, 2, '#59fff0', true);
      p.rect(bx + 1, headY, 3, 2, '#59fff0', true);
      p.px(bx - 3, headY, '#ffffff', true);
      p.px(bx + 2, headY, '#ffffff', true);
      p.setPart(SPRITE_PART.HEADWEAR);
      p.hline(bx - 4, headY + 4, 8, '#e3ecff');
      p.rect(bx - 1, headY + 5, 2, 2, '#d9304f');

      // [5] 外翘斜切霸气黄金大肩甲 + 雄壮屈肘格斗架势液压双臂与先攻火箭铁拳！
      p.setPart(SPRITE_PART.BACK_ARM);
      const lShOut = isAtk && (f === 1 || f === 2) ? 21 : 24;
      p.poly([[bx - lShOut, 15 + by], [bx - 14, 18 + by], [bx - 14, 29 + by], [bx - (lShOut - 1), 27 + by]], '#a66e20');
      p.poly([[bx - (lShOut - 1), 16 + by], [bx - 15, 19 + by], [bx - 15, 27 + by], [bx - (lShOut - 2), 25 + by]], '#f2c154');
      p.hline(bx - (lShOut - 1), 16 + by, lShOut - 15, '#fff5b8');
      const lFistX = isAtk && (f === 1 || f === 2) ? bx - 17 : bx - 19;
      const lFistY = 34 + by - Math.round(pose.stride * 2.5);
      p.line(bx - (lShOut - 5), 27 + by, lFistX, lFistY + 2, '#465478', 6);
      p.line(bx - (lShOut - 6), 27 + by, lFistX + 1, lFistY + 2, '#8295c4', 2);
      p.rect(lFistX - 5, lFistY - 1, 10, 10, '#b52440');
      p.rect(lFistX - 4, lFistY, 8, 6, '#f2c052');
      p.hline(lFistX - 3, lFistY, 6, '#fff6c2');

      p.setPart(SPRITE_PART.FRONT_ARM);
      p.poly([[bx + 14, 18 + by], [bx + 24, 15 + by], [bx + 23, 27 + by], [bx + 14, 29 + by]], '#ba7e26');
      p.poly([[bx + 15, 19 + by], [bx + 23, 16 + by], [bx + 22, 25 + by], [bx + 15, 27 + by]], '#ffd96b');
      p.hline(bx + 15, 16 + by, 8, '#ffffff');

      // 待机略微前抬屈肘蓄势拳架，攻击蓄力后拉 → 肘后喷焰先攻火箭重拳轰击！
      let fistX = bx + 20;
      let fistY = 33 + by + Math.round(pose.stride * 2.2);
      if (isAtk && f === 0) {
        fistX = bx + 13;
        fistY = 26 + by;
      } else if (isAtk && (f === 1 || f === 2)) {
        fistX = Math.min(50, bx + 23);
        fistY = 28 + by;
      }
      p.line(bx + 18, 27 + by, fistX, fistY + 2, '#52628c', 6);
      p.line(bx + 18, 26 + by, fistX, fistY + 1, '#99addb', 2);
      p.setPart(SPRITE_PART.WEAPON);
      p.rect(fistX - 4, fistY - 2, 10, 10, '#cc2b49');
      p.rect(fistX - 3, fistY - 1, 8, 6, '#ffe073');
      p.hline(fistX - 3, fistY - 1, 7, '#ffffff');
      p.hline(fistX - 3, fistY + 5, 8, '#7a1529');

      // 先攻火箭铁拳推进烈焰 + 拳锋金翠双重冲击波（左右双侧均 100% 零裁切！）
      if (isAtk && (f === 1 || f === 2)) {
        p.setPart(SPRITE_PART.GLOW_FX);
        p.poly([[bx + 17, 27 + by], [bx + 8, 24 + by], [bx + 11, 31 + by]], '#ff6624', true);
        p.poly([[bx + 16, 27 + by], [bx + 11, 26 + by], [bx + 12, 29 + by]], '#fff4a6', true);
        drawSlashArc64(p, Math.min(52, fistX + 3), fistY + 3, 8, 12, -1.25, 1.25, '#ff9824', '#ffe878', '#ffffff');
        drawSlashArc64(p, Math.min(54, fistX + 5), fistY + 3, 6, 9, -1.0, 1.0, '#4dfce8', '#ffffff', '#ffffff');
      }
    },
  },
};

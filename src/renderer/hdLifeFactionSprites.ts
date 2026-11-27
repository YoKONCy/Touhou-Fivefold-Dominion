/**
 * 博丽神社 · 信仰圣域（生命阵营）全量 8 大兵种 64×72 新一代精雕像素绘谱（与 v8 灵梦 & 死亡阵营 100% 统一画风！）
 *
 * 严格遵循 v8 黄金像素美学标准：
 * - 4 位东方萌系美少女（御札弓手 / 退魔剑士 / 净邪巫女 / 1×2 六翼炽光神使）：
 *   2.3 头身圆润苹果脸 + 4×4 水灵朝右宝石大眼 + 干净大色块发团与波浪裙摆 + 3/4 斜错步 + 2px 软萌少女小臂 + 环握玉手！
 * - 2 位宏伟神兽与圣骑（2×2 镇守狛犬 / 2×1 御柱天马圣骑）：
 *   全画幅立体雕塑感体态、四足动态奔袭/人立飞扑/冲锋刺枪、层次丰富的毛发/石肌/羽翼/鎏金铠甲，威武华丽！
 * - 2 位神社经典灵物与圣器（博丽毛玉 / 阴阳浮游炮）：
 *   数学精确光栅化立体琉璃太极核、高弹性挤压拉伸云团绒毛、雕花古金八卦环与 3D 公转棱镜浮游炮！
 */

import {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
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
  skin = '#ffe4d4',
  hi = '#fff6ed',
  sh = '#e8ad99',
): void {
  p.setPart(SPRITE_PART.WEAPON);
  p.rect(gx - 1, gy - 1, 3, 2, skin);
  p.hline(gx - 1, gy - 1, 2, hi);
  p.hline(gx - 1, gy + 1, 2, sh);
}

/** 数学精确光栅化立体琉璃阴阳太极球（丝滑完美 S 曲线 + 左上镜面高光 + 发光双太极鱼眼！） */
function drawGlossyTaijiOrb64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  radius: number,
  rotRad: number,
  emissiveEyes = true,
): void {
  const halfR = radius * 0.5;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);
  const lim = Math.ceil(radius);

  for (let dy = -lim; dy <= lim; dy++) {
    for (let dx = -lim; dx <= lim; dx++) {
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;

      // 旋转到太极局部坐标，让阴阳双鱼流畅缓缓旋转
      const lx = dx * cosR - dy * sinR;
      const ly = dx * sinR + dy * cosR;
      const dTop = Math.hypot(lx, ly + halfR);
      const dBot = Math.hypot(lx, ly - halfR);
      const isYang = (lx >= 0 && dBot > halfR) || dTop <= halfR;

      // 左上受光球面明暗场（3D 琉璃通透感）
      const nx = dx / radius;
      const ny = dy / radius;
      const shade = nx * 0.45 + ny * 0.55 + (dist / radius) * 0.25;

      let col: string;
      if (isYang) {
        if (shade < -0.25) col = '#ff7d95';
        else if (shade < 0.28) col = '#eb264b';
        else if (shade < 0.65) col = '#b81434';
        else col = '#7a0b22';
      } else {
        if (shade < -0.2) col = '#ffffff';
        else if (shade < 0.35) col = '#faf5ee';
        else if (shade < 0.68) col = '#dfd6e3';
        else col = '#b6acc4';
      }
      p.px(cx + dx, cy + dy, col);
    }
  }

  // 旋转后的双太极鱼眼（金白阳眼 + 绯红阴眼）
  const eyeOff = halfR;
  const topEyeX = Math.round(cx + eyeOff * sinR);
  const topEyeY = Math.round(cy - eyeOff * cosR);
  const botEyeX = Math.round(cx - eyeOff * sinR);
  const botEyeY = Math.round(cy + eyeOff * cosR);
  const eyeR = Math.max(1.3, radius * 0.19);
  p.ellipse(topEyeX, topEyeY, eyeR, eyeR, '#fff4b8', emissiveEyes);
  p.px(topEyeX, topEyeY, '#ffffff', emissiveEyes);
  p.ellipse(botEyeX, botEyeY, eyeR, eyeR, '#ff335c', emissiveEyes);
  p.px(botEyeX, botEyeY, '#ffc7d4', emissiveEyes);

  // 左上方琉璃通透高光弧
  const hiX = Math.round(cx - radius * 0.42);
  const hiY = Math.round(cy - radius * 0.44);
  p.px(hiX, hiY, '#ffffff', true);
  p.px(hiX + 1, hiY - 1, '#ffffff', true);
  if (radius >= 9) {
    p.px(hiX - 1, hiY + 1, '#fff6e8', true);
  }
}

/** 绘制神社经典 Z 字锯齿白纸垂（Shide） */
function drawShideTassel64(
  p: HdPixelPainter,
  sx: number,
  sy: number,
  sway: number,
  segments = 3,
): void {
  for (let i = 0; i < segments; i++) {
    const zig = i % 2 === 0 ? -1 : 1;
    const ox = Math.round(sx + zig * 1.4 + sway * (i * 0.45));
    const oy = sy + i * 3;
    p.rect(ox - 1, oy, 3, 3, i % 2 === 0 ? '#ffffff' : '#e6dce6');
    p.px(ox, oy, '#ffffff');
  }
}

/** 绘制真·镂空鎏金圣环（只渲染环体像素，环心 100% 透明绝无深色贴纸！） */
function drawHollowGoldRing64(
  p: HdPixelPainter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  innerRatio: number,
  darkCol: string,
  mainCol: string,
  hiCol: string,
  emissive = true,
): void {
  const maxX = Math.ceil(rx);
  const maxY = Math.ceil(ry);
  for (let dy = -maxY; dy <= maxY; dy++) {
    for (let dx = -maxX; dx <= maxX; dx++) {
      const d = Math.hypot(dx / rx, dy / ry);
      if (d > 1.0 || d < innerRatio) continue;
      let col = mainCol;
      if (dy < -ry * 0.25 && dx < rx * 0.4) col = hiCol;
      else if (dy > ry * 0.45 && dx > -rx * 0.2) col = darkCol;
      p.px(cx + dx, cy + dy, col, emissive);
    }
  }
}

/** 精雕层次感洁白暖金大天使羽翼（供神使六翼 & 御柱天马双翼复用，羽瓣分明、层次奢华！） */
function drawSeraphWingSide64(
  p: HdPixelPainter,
  rootX: number,
  rootY: number,
  dir: -1 | 1,
  span: number,
  height: number,
  flapY: number,
  colors: {
    deep: string;
    mid: string;
    light: string;
    tip: string;
    gold?: string;
  },
  emissiveTip = true,
): void {
  const elbowX = rootX + dir * Math.round(span * 0.48);
  const elbowY = rootY - Math.round(height * 0.72) + Math.round(flapY * 0.65);
  const tipX = Math.max(3, Math.min(60, rootX + dir * span));
  const tipY = Math.max(4, Math.min(64, rootY - Math.round(height * 0.45) + flapY));

  const f1X = Math.max(3, Math.min(60, rootX + dir * Math.round(span * 0.9)));
  const f1Y = tipY + 5;
  const f2X = Math.max(3, Math.min(60, rootX + dir * Math.round(span * 0.74)));
  const f2Y = tipY + 10;
  const f3X = Math.max(3, Math.min(60, rootX + dir * Math.round(span * 0.52)));
  const f3Y = rootY + Math.round(height * 0.35) + Math.round(flapY * 0.35);

  // 底层深羽影剪影（带 3 级清晰阶梯羽尖轮廓）
  p.poly(
    [
      [rootX, rootY - 1],
      [elbowX, elbowY - 1],
      [tipX, tipY],
      [f1X - dir * 3, f1Y - 2],
      [f1X, f1Y],
      [f2X - dir * 3, f2Y - 2],
      [f2X, f2Y],
      [f3X, f3Y],
      [rootX, rootY + 5],
    ],
    colors.deep,
  );
  // 中层丰满羽片
  p.poly(
    [
      [rootX + dir * 1, rootY],
      [elbowX, elbowY],
      [tipX - dir * 1, tipY + 1],
      [f1X - dir * 1, f1Y - 1],
      [f2X - dir * 1, f2Y - 2],
      [f3X - dir * 1, f3Y - 2],
      [rootX + dir * 1, rootY + 3],
    ],
    colors.mid,
  );
  // 上层受光洁白暖羽
  p.poly(
    [
      [rootX + dir * 2, rootY],
      [elbowX, elbowY + 1],
      [Math.round((elbowX + tipX) * 0.6), Math.round((elbowY + tipY) * 0.6) + 1],
      [f2X - dir * 2, f2Y - 4],
      [rootX + dir * 2, rootY + 2],
    ],
    colors.light,
    emissiveTip,
  );

  // 清晰翼肩鎏金脊羽线条 + 羽片分缝暗线与羽尖辉光点缀
  p.bezierRibbon([rootX, rootY - 1], [elbowX, elbowY - 1], [tipX, tipY], 2.2, 0.9, colors.gold ?? colors.light, emissiveTip);
  p.line(elbowX, elbowY + 3, f1X - dir * 2, f1Y - 1, colors.deep, 1);
  p.line(Math.round((rootX + elbowX) * 0.65), Math.round((rootY + elbowY) * 0.65) + 3, f2X - dir * 2, f2Y - 1, colors.deep, 1);
  p.line(elbowX, elbowY + 2, f1X, f1Y, colors.tip, 1, emissiveTip);
  p.px(tipX, tipY, colors.tip, emissiveTip);
  p.px(f1X, f1Y, colors.tip, emissiveTip);
}

export const HD_LIFE_FACTION_RIG_SPECS: Record<string, SpriteRigSpec> = {
  // =========================================================================
  // 1. 博丽毛玉（T1-A · 符箓定身 + 无限反击：高弹性蓬松云朵绒毛团 + 立体琉璃阴阳玉核 + 神社朱红结绳纸垂 + 双灵火）
  // =========================================================================
  creature_kedama: {
    ...HD_BASE,
    backdropTop: '#10152b',
    backdropBottom: '#23203b',
    backdropGlow: '#ff6685',
    avatarCrop: { x: 12, y: 20, size: 40 },
    portraitCrop: { x: 6, y: 16, w: 52, h: 52 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;

      // 富有 Q 弹张力的 Squash & Stretch 挤压拉伸节奏！
      let bx = Math.round(32 + pose.leanX * 1.15);
      let bounceY = Math.round(pose.breathY * 1.6);
      let sqX = 0;
      let sqY = 0;
      if (isMove) {
        // 4 帧 Q 弹弹跳：压扁蓄力 → 高高跃起拉长 → 空中前扑 → 缓冲落地压扁
        const jumpY = [2, -9, -4, 1][f % 4];
        bounceY = jumpY;
        sqX = [2.6, -2.0, -0.8, 2.2][f % 4];
        sqY = [-2.2, 2.4, 1.0, -1.8][f % 4];
      } else if (isAtk) {
        if (f === 0) {
          bx = 26;
          bounceY = 3;
          sqX = -2.4;
          sqY = 2.6;
        } else if (f === 1 || f === 2) {
          // 攻击前冲略微收位，确保前方朱金定身符箓与光弧完整展现零裁边！
          bx = 32;
          bounceY = -4;
          sqX = 2.8;
          sqY = -2.1;
        } else {
          bx = 32;
          bounceY = 1;
          sqX = 1.2;
          sqY = -1.0;
        }
      } else if (isHit) {
        bx = 27;
        bounceY = 2;
        sqX = 2.8;
        sqY = -2.4;
      } else {
        sqX = Math.sin(phase) * 0.9;
        sqY = -sqX * 0.85;
      }

      const cy = 48 + bounceY;
      const rx = 15.2 + sqX;
      const ry = 13.6 + sqY;
      const fl = Math.round(pose.flutter * 1.6);

      // [1] 背面环绕灵火（后景柔和双色神社狐火）
      p.setPart(SPRITE_PART.BACK_ACC);
      const wOff = Math.round(Math.sin(phase) * 3.5);
      p.ellipse(Math.max(5, bx - 22), cy - 2 + wOff, 3.0, 3.6, '#ff8547', true);
      p.ellipse(Math.max(5, bx - 22), cy - 3 + wOff, 1.6, 2.0, '#fff4b8', true);
      p.px(Math.max(5, bx - 22), cy - 4 + wOff, '#ffffff', true);

      // [2] 多层蓬松云朵绒毛团主体（4 阶温润奶油白×淡蓝紫投影 + 8 簇生动蓬翘外绒毛！）
      p.setPart(SPRITE_PART.TORSO);
      // 底层冷蓝紫毛底与蓬松边缘毛簇
      p.ellipse(bx, cy + 1.5, rx, ry, '#8f9bbf');
      p.ellipse(bx - Math.round(rx * 0.85), cy + 2 + fl, 5.2, 4.4, '#9ba6c9');
      p.ellipse(bx + Math.round(rx * 0.82), cy + 1 - fl, 5.0, 4.2, '#8b96ba');
      p.ellipse(bx - Math.round(rx * 0.62), cy - Math.round(ry * 0.65), 5.4, 4.4, '#c7cee3');
      p.ellipse(bx + Math.round(rx * 0.62), cy - Math.round(ry * 0.6), 5.0, 4.2, '#b8c0db');
      p.ellipse(bx + Math.round(fl * 0.6), cy - Math.round(ry * 0.92), 6.2, 4.0, '#d8dced');
      p.ellipse(bx - Math.round(rx * 0.55), cy + Math.round(ry * 0.68), 5.2, 3.6, '#8894b8');
      p.ellipse(bx + Math.round(rx * 0.55), cy + Math.round(ry * 0.68), 5.0, 3.6, '#7d88ad');

      // 中层柔滑珍珠暖灰白主体
      p.ellipse(bx - 0.8, cy - 0.5, rx - 1.4, ry - 1.3, '#dcdbe8');
      p.ellipse(bx - Math.round(rx * 0.78), cy + 1 + fl, 4.0, 3.2, '#e8e6f0');
      p.ellipse(bx + Math.round(rx * 0.75), cy - fl, 3.8, 3.0, '#d4d4e3');
      p.ellipse(bx + Math.round(fl * 0.5), cy - Math.round(ry * 0.86), 5.0, 3.0, '#f5f2f7');

      // 上层洁白暖绒受光大集群 + 纯白绒顶高光
      p.ellipse(bx - 1.5, cy - 2.2, rx - 3.2, ry - 3.0, '#faf7f5');
      p.ellipse(bx - 3.5, cy - 5.2, rx - 6.8, ry - 6.5, '#ffffff');
      p.ellipse(bx - Math.round(rx * 0.55), cy - Math.round(ry * 0.55), 3.6, 2.8, '#ffffff');
      p.hline(bx - 6, cy - Math.round(ry) + 1, 8, '#ffffff');

      // [3] 头顶俏皮「神社注连红绳结 + 迷你白纸垂」（一眼认出是博丽神社的毛玉，超萌！）
      p.setPart(SPRITE_PART.HEADWEAR);
      const knotX = bx - 5;
      const knotY = cy - Math.round(ry) + 1;
      p.poly(
        [
          [knotX, knotY],
          [knotX - 6, knotY - 4 + Math.round(fl * 0.4)],
          [knotX - 7, knotY + 1 + Math.round(fl * 0.4)],
          [knotX - 2, knotY + 2],
        ],
        '#c41639',
      );
      p.poly(
        [
          [knotX - 1, knotY],
          [knotX - 5, knotY - 3 + Math.round(fl * 0.4)],
          [knotX - 5, knotY + Math.round(fl * 0.4)],
        ],
        '#ff4d70',
      );
      p.poly(
        [
          [knotX + 1, knotY],
          [knotX + 6, knotY - 4 - Math.round(fl * 0.3)],
          [knotX + 7, knotY + 1 - Math.round(fl * 0.3)],
          [knotX + 2, knotY + 2],
        ],
        '#c41639',
      );
      p.poly(
        [
          [knotX + 1, knotY],
          [knotX + 5, knotY - 3 - Math.round(fl * 0.3)],
          [knotX + 5, knotY - Math.round(fl * 0.3)],
        ],
        '#ff6685',
      );
      p.rect(knotX - 1, knotY - 1, 3, 3, '#ffe066');
      // 一小片灵动垂在绒毛旁的迷你白纸垂
      p.rect(knotX - 6, knotY + 3, 2, 2, '#ffffff');
      p.rect(knotX - 7, knotY + 5, 2, 2, '#e6dce8');

      // [4] 镶嵌于绒毛团正面的「立体琉璃发光阴阳太极玉核」+ 金玉包边！
      p.setPart(SPRITE_PART.FACE_FEATURES);
      const coreX = bx + 2 + Math.round(pose.leanX * 0.4);
      const coreY = cy - 1;
      const coreR = isAtk && (f === 1 || f === 2) ? 7.4 : 6.4;
      // 鎏金镶边托环
      p.ellipse(coreX, coreY, coreR + 1.3, coreR + 1.3, '#b88021');
      p.ellipse(coreX - 0.3, coreY - 0.4, coreR + 0.7, coreR + 0.7, '#ffe066', true);
      // 数学精确光栅化旋转太极核
      const rot = isAtk ? pose.frame * 0.9 : phase * 0.5;
      drawGlossyTaijiOrb64(p, coreX, coreY, coreR, rot, true);

      // [5] 前景伴飞绯红小灵火 + 攻击「符箓定身」爆发朱金封印灵符与星环！
      p.setPart(SPRITE_PART.GLOW_FX);
      const rightOrbX = Math.min(59, bx + 21);
      const rightOrbY = cy - 4 - wOff;
      p.ellipse(rightOrbX, rightOrbY, 2.8, 3.4, '#ff3366', true);
      p.ellipse(rightOrbX, rightOrbY - 0.5, 1.5, 1.8, '#ffe6ee', true);
      p.px(rightOrbX, rightOrbY - 1, '#ffffff', true);

      if (isAtk && (f === 1 || f === 2)) {
        drawSlashArc64(p, bx + 10, cy - 2, 16, 15, -1.1, 1.1, '#ff2452', '#ffe066', '#ffffff');
        // 飞射而出的迷你发光定身御札（严格位于画布内零裁边！）
        p.rect(Math.min(54, bx + 17), cy - 11, 4, 6, '#fff8e8', true);
        p.vline(Math.min(55, bx + 18), cy - 10, 4, '#ff2452', true);
        p.px(Math.min(57, bx + 20), cy + 6, '#ffe885', true);
      }
    },
  },

  // =========================================================================
  // 2. 御札弓手（T1-B · 精准射击 + 远程先攻：翠风林间灵羽弓少女 · 亚麻金柔发 + 翠羽游侠小帽 + 箭筒短斗篷 + 雕花神木大弓）
  // =========================================================================
  creature_ofuda_archer: {
    ...HD_BASE,
    backdropTop: '#0b1e24',
    backdropBottom: '#163830',
    backdropGlow: '#5ce8c4',
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 25 : isAtk && f === 0 ? 24 : Math.round(28 + pose.leanX * 0.9);
      const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.2);
      const sway = pose.flutter * 1.6;
      const headY = 23 + by;

      // [1] 背后斜背皮革箭筒（插满三支翠羽金矢）+ 飘扬翠绿游侠短披风
      p.setPart(SPRITE_PART.BACK_ACC);
      p.poly(
        [
          [bx - 4, 31 + by],
          [bx - 17 + sway * 0.9, 41 + by],
          [bx - 16 + sway, 51 + by],
          [bx - 6 + sway * 0.4, 49 + by],
          [bx - 3, 40 + by],
        ],
        '#0f4d42',
      );
      p.poly(
        [
          [bx - 4, 32 + by],
          [bx - 14 + sway * 0.8, 41 + by],
          [bx - 12 + sway * 0.8, 48 + by],
          [bx - 5, 46 + by],
        ],
        '#208572',
      );
      p.bezierRibbon(
        [bx - 16 + sway, 50 + by],
        [bx - 11 + sway * 0.6, 51 + by],
        [bx - 6 + sway * 0.4, 48 + by],
        1.5,
        1.2,
        '#f2c85b',
      );
      // 皮革箭筒与三枚翠白羽箭尾
      p.line(bx - 11, 25 + by, bx - 5, 40 + by, '#5c341d', 4);
      p.line(bx - 10, 26 + by, bx - 5, 39 + by, '#9e6238', 2);
      p.hline(bx - 12, 26 + by, 4, '#f2c85b');
      p.line(bx - 11, 25 + by, bx - 15, 20 + by, '#66f5cc', 2, true);
      p.line(bx - 10, 24 + by, bx - 12, 19 + by, '#fff5c2', 1, true);
      p.line(bx - 9, 25 + by, bx - 9, 20 + by, '#4ce6b8', 1, true);

      // [2] 蓬松暖亚麻金过肩后发
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 8, headY],
          [bx + 9 - sway * 0.4, 37 + by],
          [bx + 4 - sway * 0.5, 42 + by],
          [bx - 9 + sway * 0.6, 42 + by],
          [bx - 12 + sway * 0.6, 36 + by],
        ],
        '#8c6430',
      );
      p.poly(
        [
          [bx - 8, headY + 1],
          [bx + 6, headY + 1],
          [bx + 7 - sway * 0.3, 36 + by],
          [bx - 9 + sway * 0.4, 37 + by],
        ],
        '#cf9e52',
      );

      // [3] 3/4 斜错步雪白过膝袜 + 棕色皮质金扣游侠短靴
      drawStaggeredLegs64(p, bx, 51, 65, pose, {
        sockShadow: '#d4ddd8',
        sockLight: '#fffaf2',
        shoeDark: '#4f2c18',
        shoeMain: '#8f552e',
        shoeHighlight: '#ffe073',
        skinColor: '#ffe2cc',
      });

      // [4] 干净大色块 3/4 湖青翠绿波浪褶裙 + 鎏金滚边 + 象牙白衬裙
      drawCleanAnimeSkirt64(p, {
        waistX: bx + 0.5,
        waistY: 40 + by,
        waistW: 10,
        hemY: 51 + by,
        hemW: 28,
        tiltRight: 1.0,
        archDepth: 2.5,
        waveLobes: 3.5,
        waveAmp: 1.5,
        swayX: -pose.leanX * 0.5 + sway * 0.75,
        colors: {
          deep: '#0f473e',
          shadow: '#1a6e60',
          main: '#289c87',
          light: '#4cd1b6',
          highlight: '#8cf5df',
        },
        trimBand: {
          offsetFromHem: 2.0,
          thickness: 1.3,
          color: '#ffe073',
          shadowColor: '#b88d32',
        },
        petticoat: {
          peekDepth: 2.0,
          shade: '#d6d0c7',
          main: '#fffaf0',
          highlight: '#ffffff',
        },
      });

      // [5] 米白束身猎装 + 翠绿鎏金小披肩 + 棕色皮带与斜挎箭囊带
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#ede3d1');
      p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#fffaf0');
      // 翠绿鎏金披肩
      p.poly([[bx - 6, 31 + by], [bx + 6, 31 + by], [bx + 6, 36 + by], [bx, 37 + by], [bx - 6, 36 + by]], '#197060');
      p.poly([[bx - 5, 31 + by], [bx + 5, 31 + by], [bx + 4, 35 + by], [bx, 36 + by], [bx - 4, 35 + by]], '#2ca68f');
      p.hline(bx - 5, 36 + by, 10, '#ffe073');
      // 皮质斜挎带与金扣腰带
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.line(bx - 4, 32 + by, bx + 4, 40 + by, '#734222', 2);
      p.hline(bx - 5, 40 + by, 11, '#5e351a');
      p.rect(bx - 1, 39 + by, 3, 2, '#ffe478');

      // [6] 灵气清甜游侠少女脸 + 璀璨祖母绿 4×4 大眼 + 亚麻金萌发与精致左侧小麻花辫！
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#fff6ed',
        skinMain: '#ffe2cc',
        skinShade: '#e6ad95',
        lashColor: '#291a14',
        irisDark: '#0f6b51',
        irisMid: '#24bd8e',
        irisGlow: '#99ffe0',
        blushColor: '#ff96ad',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#825b27',
        dark: '#b3833e',
        mid: '#deb262',
        light: '#f7d894',
        spec: '#fff7d4',
        leftLockLen: 12,
        rightLockLen: 9,
        fluff: 1,
        sway,
      });
      // 左侧垂落小麻花辫 + 翠绿小发带
      p.setPart(SPRITE_PART.FRONT_HAIR);
      const braidX = bx - 9;
      p.vline(braidX, headY + 6, 9, '#9e6f31');
      p.vline(braidX + 1, headY + 6, 9, '#f2cc79');
      p.px(braidX, headY + 8, '#fff2b8');
      p.px(braidX + 1, headY + 11, '#fff2b8');
      p.rect(braidX - 1, headY + 13, 3, 2, '#2eb89c');

      // [7] 精雕立体斜戴「翠绿灵羽游侠小帽」（4 阶丝绒湖青 + 鎏金帽带 + 飘逸雪白翠尖长灵羽！）
      p.setPart(SPRITE_PART.HEADWEAR);
      const hatY = headY - 9;
      p.poly(
        [
          [bx - 12, hatY + 3],
          [bx - 10, hatY - 4],
          [bx + 3, hatY - 7],
          [bx + 10, hatY - 2],
          [bx + 11, hatY + 2],
          [bx, hatY + 3],
        ],
        '#0f4d42',
      );
      p.poly(
        [
          [bx - 10, hatY + 2],
          [bx - 8, hatY - 3],
          [bx + 2, hatY - 6],
          [bx + 8, hatY - 2],
          [bx + 9, hatY + 1],
        ],
        '#258c79',
      );
      p.poly(
        [
          [bx - 8, hatY - 2],
          [bx + 1, hatY - 5],
          [bx + 5, hatY - 2],
          [bx - 4, hatY],
        ],
        '#47c7ad',
      );
      p.hline(bx - 10, hatY + 1, 20, '#d9a434');
      p.hline(bx - 8, hatY, 15, '#ffe680');
      // 飘逸雪白翠尖大灵羽插于帽侧，迎风舒展！
      p.bezierRibbon(
        [bx - 8, hatY - 2],
        [bx - 16 + sway * 0.6, hatY - 8],
        [bx - 21 + sway, hatY - 12],
        3.6,
        1.1,
        '#45e8be',
        true,
      );
      p.bezierRibbon(
        [bx - 8, hatY - 2],
        [bx - 15 + sway * 0.5, hatY - 7],
        [bx - 19 + sway * 0.9, hatY - 10],
        2.0,
        0.6,
        '#ffffff',
        true,
      );
      p.rect(bx - 9, hatY - 2, 3, 2, '#ffe478'); // 帽扣金徽

      // [8] 双臂拉弓射击 + 雕花神木金纹长弓 + 璀璨翠金破魔符箭（完全清晰净空剪影！）
      const pull = isAtk && f === 0 ? -5 : isAtk && (f === 1 || f === 2) ? 2 : 0;
      const bowX = Math.min(48, bx + 17 + (isAtk && (f === 1 || f === 2) ? 2 : 0));
      const bowY = 37 + by;

      // 后臂（左臂）：拉弦手 + 2px 软萌少女小臂
      p.setPart(SPRITE_PART.BACK_ARM);
      drawPuffSleeve64(p, bx - 6, 34 + by, '#197060', '#33b39a', '#ffe073', 'left');
      const pullHandX = bx + 5 + pull;
      const pullHandY = bowY;
      drawSoftChibiArm64(p, bx - 4, 36 + by, pullHandX, pullHandY);

      // 前臂（右臂）：伸直托弓手 + 2px 软萌少女小臂
      p.setPart(SPRITE_PART.FRONT_ARM);
      drawPuffSleeve64(p, bx + 6, 34 + by, '#197060', '#33b39a', '#ffe073', 'right');
      drawSoftChibiArm64(p, bx + 7, 36 + by, bowX - 1, bowY);

      // 精雕神木金纹反曲大长弓
      p.setPart(SPRITE_PART.WEAPON);
      const bowTopX = bowX - 6;
      const bowTopY = bowY - 17;
      const bowBotX = bowX - 6;
      const bowBotY = bowY + 17;
      // 弓弦（蓄力时明显向后绷紧！）
      const stringX = isAtk && (f === 1 || f === 2) ? bowTopX + 1 : pullHandX;
      p.line(bowTopX, bowTopY + 1, stringX, bowY, '#e3faf5', 1);
      p.line(bowBotX, bowBotY - 1, stringX, bowY, '#e3faf5', 1);
      // 优雅反曲雕花弓臂
      p.bezierRibbon([bowTopX, bowTopY], [bowX + 3, bowY - 8], [bowX + 1, bowY], 2.4, 2.8, '#7a471d');
      p.bezierRibbon([bowTopX + 1, bowTopY + 1], [bowX + 3, bowY - 8], [bowX + 1, bowY], 1.1, 1.2, '#f2c85b');
      p.bezierRibbon([bowX + 1, bowY], [bowX + 3, bowY + 8], [bowBotX, bowBotY], 2.8, 2.4, '#7a471d');
      p.bezierRibbon([bowX + 1, bowY], [bowX + 3, bowY + 8], [bowBotX + 1, bowBotY - 1], 1.2, 1.1, '#f2c85b');
      // 弓梢翠玉灵珠
      p.ellipse(bowTopX, bowTopY, 1.6, 1.6, '#66ffdb', true);
      p.ellipse(bowBotX, bowBotY, 1.6, 1.6, '#66ffdb', true);

      // 翠金破魔御札灵箭（待机与蓄力搭在弓上，发射帧激射璀璨破魔箭光！）
      const arrowTailX = isAtk && (f === 1 || f === 2) ? bowX + 2 : pullHandX;
      const arrowTipX = Math.min(60, bowX + (isAtk && (f === 1 || f === 2) ? 14 : 9));
      p.line(arrowTailX, bowY, arrowTipX - 3, bowY, '#ffe680', 1, true);
      // 箭身小御札纸条
      p.rect(Math.min(54, bowX + 2), bowY - 2, 2, 4, '#fffaf0', true);
      p.px(Math.min(54, bowX + 2), bowY, '#ff3b5c', true);
      // 锋利发光翠金箭簇
      p.poly(
        [
          [arrowTipX, bowY],
          [arrowTipX - 5, bowY - 3],
          [arrowTipX - 4, bowY],
          [arrowTipX - 5, bowY + 3],
        ],
        '#3df5c4',
        true,
      );
      p.line(arrowTipX - 4, bowY, arrowTipX, bowY, '#ffffff', 1, true);

      drawWrappedHand(p, bowX, bowY);
      drawWrappedHand(p, pullHandX, pullHandY);

      if (isAtk && f === 0) {
        // 蓄力满弓翠金十字星芒
        p.setPart(SPRITE_PART.GLOW_FX);
        p.hline(arrowTipX - 2, bowY, 6, '#ffffff', true);
        p.vline(arrowTipX + 1, bowY - 3, 7, '#75ffe0', true);
      } else if (isAtk && (f === 1 || f === 2)) {
        // 离弦翠金星风破空波纹！
        p.setPart(SPRITE_PART.GLOW_FX);
        drawSlashArc64(p, bowX + 4, bowY, 11, 13, -0.95, 0.95, '#29d9a8', '#ffe878', '#ffffff');
        p.line(bowX + 4, bowY, 61, bowY, '#99ffe6', 2, true);
        p.hline(bowX + 6, bowY, Math.max(1, 61 - (bowX + 6)), '#ffffff', true);
      }
    },
  },

  // =========================================================================
  // 3. 镇守狛犬（T2-A · 2×2 大型神兽 · 长武器 + 破先攻：京都神社汉白玉石狮 · 浓金卷云鬃 · 注连绳金铃纸垂 · 翡翠尾焰 · 人立飞扑裂空爪！）
  // =========================================================================
  creature_komainu: {
    ...HD_BASE,
    backdropTop: '#101a2a',
    backdropBottom: '#26212e',
    backdropGlow: '#6bf0c6',
    avatarCrop: { x: 20, y: 8, size: 34 },
    portraitCrop: { x: 2, y: 6, w: 60, h: 62 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const wave = Math.round(pose.flutter * 2.0);
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const isHit = pose.state === 'hit';
      const f = pose.frame;

      // 64×72 全幅雕塑级四足石狮骨骼节点
      let hipX = 19;
      let hipY = 48;
      let chestX = 33;
      let chestY = 40;
      let headX = 39;
      let headY = 25;
      let farHindPaw: [number, number] = [13, 62];
      let nearHindPaw: [number, number] = [18, 64];
      let farForeElbow: [number, number] = [36, 51];
      let farForePaw: [number, number] = [39, 62];
      let nearForeElbow: [number, number] = [38, 52];
      let nearForePaw: [number, number] = [43, 64];
      let tailSway = 0;
      let roarOpen = false;
      let clawGlow = false;
      let slashStage: 0 | 1 | 2 = 0;

      if (isAtk) {
        if (f === 0) {
          // 蓄力帧 0：后腿稳扎大地，上身雄壮人立仰起！双前爪高举亮锋咆哮蓄力！
          hipX = 20;
          hipY = 52;
          chestX = 26;
          chestY = 34;
          headX = 31;
          headY = 18;
          farHindPaw = [13, 63];
          nearHindPaw = [20, 64];
          farForeElbow = [34, 33];
          farForePaw = [42, 24];
          nearForeElbow = [32, 40];
          nearForePaw = [45, 34];
          tailSway = 4;
          roarOpen = true;
          clawGlow = true;
        } else if (f === 1) {
          // 飞扑帧 1：后爪蹬地凌空飞扑，双巨爪全力前探，爪前净空撕裂三道弯月翠金神爪！
          hipX = 15;
          hipY = 46;
          chestX = 28;
          chestY = 38;
          headX = 35;
          headY = 24;
          farHindPaw = [7, 60];
          nearHindPaw = [13, 63];
          farForeElbow = [37, 38];
          farForePaw = [47, 34];
          nearForeElbow = [39, 45];
          nearForePaw = [49, 45];
          tailSway = -4;
          roarOpen = true;
          clawGlow = true;
          slashStage = 1;
        } else if (f === 2) {
          // 横扫追击帧 2：双爪猛压横扫，三道爪芒延展消散
          hipX = 17;
          hipY = 48;
          chestX = 31;
          chestY = 41;
          headX = 37;
          headY = 27;
          farHindPaw = [10, 62];
          nearHindPaw = [16, 64];
          farForeElbow = [39, 45];
          farForePaw = [48, 47];
          nearForeElbow = [40, 51];
          nearForePaw = [49, 57];
          tailSway = -2;
          roarOpen = true;
          clawGlow = true;
          slashStage = 2;
        } else {
          hipX = 19;
          hipY = 49;
          chestX = 33;
          chestY = 41;
          headX = 39;
          headY = 26;
          farHindPaw = [13, 62];
          nearHindPaw = [18, 64];
          farForeElbow = [38, 52];
          farForePaw = [42, 62];
          nearForeElbow = [41, 53];
          nearForePaw = [46, 64];
          tailSway = 1;
          clawGlow = true;
        }
      } else if (isMove) {
        if (f === 0) {
          hipX = 16; hipY = 47; chestX = 31; chestY = 40; headX = 39; headY = 25;
          farHindPaw = [9, 62]; nearHindPaw = [14, 64];
          farForeElbow = [39, 48]; farForePaw = [46, 61];
          nearForeElbow = [37, 52]; nearForePaw = [42, 64];
          tailSway = -4;
        } else if (f === 1) {
          hipX = 19; hipY = 42; chestX = 33; chestY = 35; headX = 40; headY = 21;
          farHindPaw = [12, 56]; nearHindPaw = [16, 58];
          farForeElbow = [38, 45]; farForePaw = [44, 54];
          nearForeElbow = [41, 47]; nearForePaw = [48, 53];
          tailSway = -5;
        } else if (f === 2) {
          hipX = 22; hipY = 48; chestX = 34; chestY = 41; headX = 41; headY = 26;
          farHindPaw = [16, 62]; nearHindPaw = [22, 64];
          farForeElbow = [37, 52]; farForePaw = [40, 63];
          nearForeElbow = [41, 52]; nearForePaw = [45, 62];
          tailSway = -1;
        } else {
          hipX = 18; hipY = 45; chestX = 31; chestY = 37; headX = 39; headY = 23;
          farHindPaw = [10, 60]; nearHindPaw = [14, 62];
          farForeElbow = [39, 47]; farForePaw = [47, 57];
          nearForeElbow = [41, 48]; nearForePaw = [49, 58];
          tailSway = -4;
        }
      } else if (isHit) {
        const back = f === 0 ? -4 : -2;
        hipX = 18 + back; hipY = 51; chestX = 29 + back; chestY = 45; headX = 34 + back; headY = 30;
        farHindPaw = [11 + back, 62]; nearHindPaw = [16 + back, 64];
        farForeElbow = [34 + back, 53]; farForePaw = [38 + back, 62];
        nearForeElbow = [37 + back, 52]; nearForePaw = [42 + back, 60];
        tailSway = 4;
      } else {
        const by = Math.round(pose.breathY * 1.1);
        const pawFlex = f === 2 || f === 3 ? -1 : 0;
        hipY = 48 + by;
        chestY = 40 + by;
        headY = 25 + by;
        nearForePaw = [43, 64 + pawFlex];
        nearForeElbow = [38, 52 + by];
        farForeElbow = [36, 51 + by];
      }

      const drawLionPaw = (px: number, py: number, dark: boolean, spread: boolean) => {
        const base = dark ? '#a69e91' : '#f2ece1';
        const hi = dark ? '#cfc8ba' : '#ffffff';
        // 朱金神兽踝环
        p.hline(px - 3, py - 4, 6, dark ? '#8c5319' : '#cc2947');
        p.hline(px - 1, py - 4, 3, '#ffe473');
        // 强健厚实狮掌肉垫
        p.ellipse(px, py, spread ? 4.8 : 4.4, spread ? 3.3 : 2.8, base);
        p.hline(px - 2, py - 1, 5, hi);
        // 三枚锋利破魔爪
        const clawCol = clawGlow ? '#8affdc' : '#f2c44d';
        if (spread) {
          p.line(px + 3, py - 2, px + 7, py - 4, clawCol, 2, clawGlow);
          p.line(px + 4, py, px + 8, py, '#ffe885', 2, clawGlow);
          p.line(px + 3, py + 2, px + 7, py + 4, clawCol, 1, clawGlow);
          if (clawGlow) p.px(px + 8, py, '#ffffff', true);
        } else {
          p.line(px + 3, py - 1, px + 5, py, clawCol, 1, clawGlow);
          p.line(px + 3, py + 1, px + 6, py + 1, '#ffe478', 1, clawGlow);
          p.px(px + 4, py + 2, clawCol, clawGlow);
        }
      };

      // [1] 威风 S 形卷云石狮神尾 + 跃动翡翠神焰尖火
      p.setPart(SPRITE_PART.BACK_ACC);
      const tBaseX = hipX - 6;
      const tBaseY = hipY - 2;
      const tMidX = Math.max(5, hipX - 11);
      const tMidY = Math.max(22, hipY - 10 + tailSway);
      const tTopX = Math.max(6, hipX - 8 + Math.round(tailSway * 0.4));
      const tTopY = Math.max(13, tMidY - 11 + wave);
      p.bezierRibbon([tBaseX, tBaseY], [tMidX - 2, tMidY + 2], [tTopX, tTopY + 5], 6.0, 3.6, '#8c8579');
      p.bezierRibbon([tBaseX + 1, tBaseY - 1], [tMidX, tMidY], [tTopX, tTopY + 5], 3.2, 2.0, '#e3dcd0');
      p.bezierRibbon([tMidX + 1, tMidY - 1], [tTopX - 1, tTopY + 8], [tTopX, tTopY + 5], 1.4, 1.0, '#ffffff');
      // 尾端暖金卷云鬃簇
      p.ellipse(tTopX, tTopY + 4, 4.2, 3.4, '#c7811f');
      p.ellipse(tTopX - 0.5, tTopY + 3, 2.6, 2.0, '#ffe073');
      // 跃动翡翠尖形神火
      p.setPart(SPRITE_PART.GLOW_FX);
      p.poly(
        [
          [tTopX - 4, tTopY + 3],
          [tTopX - 5 + Math.round(wave * 0.5), tTopY - 4],
          [tTopX + Math.round(wave * 0.7), tTopY - 9],
          [tTopX + 4, tTopY - 3],
          [tTopX + 3, tTopY + 3],
        ],
        '#17bd91',
        true,
      );
      p.poly(
        [
          [tTopX - 2, tTopY + 2],
          [tTopX - 2 + Math.round(wave * 0.4), tTopY - 3],
          [tTopX + Math.round(wave * 0.5), tTopY - 6],
          [tTopX + 2, tTopY + 1],
        ],
        '#a8ffe4',
        true,
      );
      p.px(tTopX + Math.round(wave * 0.5), tTopY - 6, '#ffffff', true);

      // [2] 远侧后腿与远侧前腿（深暖石影立体分层）
      p.setPart(SPRITE_PART.LEGS);
      p.ellipse(hipX - 3, hipY + 4, 5.2, 5.8, '#787168');
      p.line(hipX - 4, hipY + 5, farHindPaw[0], farHindPaw[1] - 1, '#8c857b', 5);
      drawLionPaw(farHindPaw[0] + 1, farHindPaw[1], true, false);

      const farSpread = isAtk && f <= 2;
      p.setPart(SPRITE_PART.BACK_ARM);
      p.line(chestX + 2, chestY + 2, farForeElbow[0], farForeElbow[1], '#8c857b', 5);
      p.line(farForeElbow[0], farForeElbow[1], farForePaw[0], farForePaw[1], '#b3aba0', 4);
      drawLionPaw(farForePaw[0], farForePaw[1], true, farSpread);

      // [3] 雕塑感雄壮汉白玉石狮躯干（宽胸收腰 + 京都石雕云纹！）
      p.setPart(SPRITE_PART.TORSO);
      p.line(hipX, hipY, chestX, chestY, '#999286', 14);
      p.ellipse(hipX, hipY, 8.8, 7.6, '#968f83');
      p.ellipse(hipX + 1.5, hipY - 1.5, 6.8, 5.6, '#dcd5c8');
      p.ellipse(chestX, chestY, 10.2, 9.0, '#c4bdb0');
      p.ellipse(chestX + 1.5, chestY - 2, 7.8, 6.8, '#f7f2e8');
      p.ellipse(chestX + 2, chestY - 4, 4.8, 3.6, '#ffffff');
      // 臀侧京都石狮浅浮雕卷云纹
      p.bezierRibbon([hipX - 3, hipY - 2], [hipX + 1, hipY - 3], [hipX + 2, hipY + 1], 1.4, 1.0, '#ffffff');
      p.line(hipX - 2, hipY + 1, hipX + 2, hipY + 2, '#827b70', 1);

      // [4] 粗实朱红金绞注连绳 + 摇曳雪白纸垂 + 醒目黄金大铃铛
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.line(chestX - 7, chestY - 6, chestX + 9, chestY + 3, '#8a142a', 5);
      p.line(chestX - 6, chestY - 6, chestX + 8, chestY + 2, '#eb3454', 3);
      for (const t of [0.2, 0.45, 0.7, 0.9]) {
        const rx = Math.round(chestX - 6 + 14 * t);
        const ry = Math.round(chestY - 6 + 8 * t);
        p.px(rx, ry, '#ffe678');
        p.px(rx + 1, ry + 1, '#fff8c7');
      }
      drawShideTassel64(p, chestX - 3, chestY + 1, wave * 0.45, 3);

      // [5] 近侧强健猫科后肢
      p.setPart(SPRITE_PART.LEGS);
      p.ellipse(hipX, hipY + 4, 6.4, 6.6, '#d9d1c3');
      p.ellipse(hipX + 1.5, hipY + 2, 4.4, 4.2, '#faf5ec');
      p.line(hipX, hipY + 7, nearHindPaw[0], nearHindPaw[1] - 1, '#ebe4d8', 5);
      p.line(hipX + 1, hipY + 7, nearHindPaw[0] + 1, nearHindPaw[1] - 1, '#ffffff', 2);
      drawLionPaw(nearHindPaw[0] + 1, nearHindPaw[1], false, false);

      // [6] 近侧主角前腿与破魔巨爪
      p.setPart(SPRITE_PART.FRONT_ARM);
      const nearSpread = isAtk && f <= 2;
      p.ellipse(chestX + 1, chestY + 3, 5.6, 5.4, '#e6dfd1');
      p.line(chestX + 1, chestY + 3, nearForeElbow[0], nearForeElbow[1], '#e3dcd0', 6);
      p.line(nearForeElbow[0], nearForeElbow[1], nearForePaw[0], nearForePaw[1], '#f7f2e8', 5);
      p.line(chestX + 2, chestY + 2, nearForePaw[0], nearForePaw[1] - 1, '#ffffff', 2);
      drawLionPaw(nearForePaw[0], nearForePaw[1], false, nearSpread);

      // 胸前璀璨黄金大神社铃铛
      p.setPart(SPRITE_PART.APRON_WAIST);
      const bellX = chestX + 8;
      const bellY = chestY + 4;
      p.ellipse(bellX, bellY, 4.2, 4.2, '#996012');
      p.ellipse(bellX - 0.3, bellY - 0.5, 3.2, 3.2, '#ffe066', true);
      p.px(bellX - 1, bellY - 2, '#ffffff', true);
      p.hline(bellX - 2, bellY + 1, 5, '#4f2b12');
      p.px(bellX, bellY + 2, '#4f2b12');

      // [7] 华贵雕塑感浓金卷云狮鬃 + 威严大狮首（独立尖挺双狮耳 + 翡翠灵眸 + 咆哮獠牙口！）
      p.setPart(SPRITE_PART.NECK_HEAD);
      const hx = headX;
      const hy = headY;
      // 多层立体暖金卷云鬃毛
      p.ellipse(hx - 3, hy + 1, 12.6, 11.8, '#7a450f');
      p.ellipse(hx - 3, hy, 10.6, 10.0, '#c9821e');
      const maneCurls: Array<[number, number, number, number, string]> = [
        [hx - 12, hy - 3, 4.4, 4.0, '#f2b83d'],
        [hx - 12, hy + 4, 4.2, 3.8, '#d99121'],
        [hx - 7, hy - 8, 4.6, 3.8, '#ffd966'],
        [hx + 1, hy - 8, 4.0, 3.2, '#f2b83d'],
        [hx - 7, hy + 8, 4.4, 3.4, '#bd7517'],
        [hx - 2, hy + 9, 4.0, 3.0, '#d99121'],
      ];
      for (const [mx, my, rx, ry, col] of maneCurls) {
        p.ellipse(mx, my, rx, ry, col);
      }
      // 鬃毛卷云暗纹立体层次与翡翠灵珠点缀
      p.bezierRibbon([hx - 11, hy - 5], [hx - 8, hy - 2], [hx - 12, hy + 2], 1.3, 1.0, '#8a4f12');
      p.bezierRibbon([hx - 6, hy - 9], [hx - 4, hy - 5], [hx - 8, hy - 4], 1.2, 0.9, '#8a4f12');
      p.hline(hx - 8, hy - 10, 5, '#fff5ba');
      p.hline(hx - 13, hy - 4, 3, '#ffe885');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.px(hx - 12, hy - 3, '#6bf0c6', true);
      p.px(hx - 7, hy - 8, '#6bf0c6', true);

      // 独立高耸双狮耳
      p.setPart(SPRITE_PART.HEADWEAR);
      const earDrop = isHit ? 4 : 0;
      p.poly([[hx - 6, hy - 6], [hx - 9, hy - 16 + earDrop], [hx - 1, hy - 9]], '#cfc8ba');
      p.poly([[hx - 5, hy - 7], [hx - 8, hy - 14 + earDrop], [hx - 2, hy - 9]], '#faf5eb');
      p.poly([[hx - 6, hy - 8 + earDrop], [hx - 7, hy - 12 + earDrop], [hx - 4, hy - 9 + earDrop]], '#eb6e87');
      p.poly([[hx + 3, hy - 7], [hx + 8, hy - 16 + earDrop], [hx + 9, hy - 6]], '#e6dfd2');
      p.poly([[hx + 4, hy - 8], [hx + 7, hy - 14 + earDrop], [hx + 8, hy - 7]], '#ffffff');
      p.poly([[hx + 6, hy - 8 + earDrop], [hx + 7, hy - 12 + earDrop], [hx + 7, hy - 7 + earDrop]], '#eb6e87');

      // 饱满温润石狮面庞与雕塑感立体白狮吻（加暖灰腮影与鼻梁转折，威严高贵不呆板！）
      p.setPart(SPRITE_PART.NECK_HEAD);
      p.ellipse(hx + 2, hy + 1, 8.8, 7.6, '#c4bcb0');
      p.ellipse(hx + 2.8, hy - 0.3, 7.3, 6.2, '#f5efe6');
      p.ellipse(hx + 7.5, hy + 3.0, 5.4, 3.8, '#e3dcd0');
      p.ellipse(hx + 7.5, hy + 2.2, 4.8, 3.0, '#ffffff');
      // 狮鼻与英武上挑浓金威严眉弓
      p.setPart(SPRITE_PART.FACE_FEATURES);
      p.poly([[hx + 8, hy + 1], [hx + 12, hy + 1], [hx + 11, hy + 4], [hx + 9, hy + 4]], '#47302b');
      p.hline(hx + 9, hy + 1, 2, '#9e7d75');
      p.line(hx + 1, hy - 4, hx + 5, hy - 3, '#b87114', 2);
      p.line(hx + 6, hy - 3, hx + 10, hy - 5, '#b87114', 2);
      p.line(hx + 1, hy - 5, hx + 5, hy - 4, '#ffe885', 1);
      p.line(hx + 6, hy - 4, hx + 9, hy - 5, '#ffe885', 1);
      // 炯炯翡翠神兽双眸
      if (pose.expr === 'hurt') {
        p.hline(hx + 1, hy, 4, '#2b1e33');
        p.hline(hx + 7, hy, 3, '#2b1e33');
      } else if (pose.blink) {
        p.hline(hx + 1, hy, 4, '#3d2c3f');
        p.hline(hx + 7, hy, 3, '#3d2c3f');
      } else {
        const eyeCol = isAtk ? '#5effcf' : '#12c790';
        p.rect(hx + 1, hy - 2, 4, 3, '#1a2e2b');
        p.rect(hx + 2, hy - 1, 3, 2, eyeCol, true);
        p.px(hx + 2, hy - 1, '#ffffff', true);
        p.rect(hx + 7, hy - 2, 3, 3, '#1a2e2b');
        p.rect(hx + 8, hy - 1, 2, 2, eyeCol, true);
        p.px(hx + 8, hy - 1, '#ffffff', true);
      }
      // 阿形咆哮狮口与锋利白獠牙！
      if (roarOpen) {
        p.rect(hx + 4, hy + 5, 8, 5, '#6b1022');
        p.hline(hx + 5, hy + 8, 6, '#e83856');
        p.vline(hx + 5, hy + 5, 2, '#ffffff');
        p.vline(hx + 10, hy + 5, 2, '#ffffff');
        p.px(hx + 6, hy + 9, '#ffffff');
        p.px(hx + 9, hy + 9, '#ffffff');
      } else {
        p.hline(hx + 5, hy + 6, 7, '#75645c');
        p.px(hx + 5, hy + 5, '#ffffff');
        p.px(hx + 10, hy + 5, '#ffffff');
      }

      // [8] 人立蓄力火花（干净移至巨爪前端外侧，绝不遮挡咆哮狮口！）& 飞扑三道弯月翠金神爪！
      if (isAtk && f === 0) {
        p.setPart(SPRITE_PART.GLOW_FX);
        p.px(farForePaw[0] + 9, farForePaw[1] - 3, '#ffe878', true);
        p.ellipse(nearForePaw[0] + 9, nearForePaw[1] + 1, 1.8, 1.8, '#8affdc', true);
        p.px(nearForePaw[0] + 9, nearForePaw[1] + 1, '#ffffff', true);
      } else if (slashStage === 1) {
        p.setPart(SPRITE_PART.GLOW_FX);
        // 三道饱满锐利弯月爪痕（位于巨爪前方净空 x=49..62，绝不遮脸！）
        p.bezierRibbon([49, 22], [58, 29], [61, 39], 3.2, 0.9, '#1fd4a1', true);
        p.bezierRibbon([50, 23], [57, 29], [60, 38], 1.3, 0.5, '#ffffff', true);
        p.bezierRibbon([50, 31], [59, 39], [61, 49], 3.6, 1.0, '#6bf0c6', true);
        p.bezierRibbon([51, 32], [58, 39], [60, 48], 1.6, 0.6, '#fff5b8', true);
        p.bezierRibbon([50, 41], [58, 49], [59, 57], 2.8, 0.8, '#1fd4a1', true);
        p.bezierRibbon([51, 42], [57, 49], [58, 56], 1.1, 0.5, '#ffffff', true);
        p.px(9, 63, '#9effdf', true);
        p.px(16, 65, '#ffe878', true);
      } else if (slashStage === 2) {
        p.setPart(SPRITE_PART.GLOW_FX);
        p.bezierRibbon([52, 29], [59, 38], [61, 46], 2.0, 0.6, '#6bf0c6', true);
        p.bezierRibbon([52, 38], [60, 47], [61, 56], 2.4, 0.7, '#ffe878', true);
        p.bezierRibbon([51, 48], [58, 55], [59, 61], 1.8, 0.5, '#9effdf', true);
      }
    },
  },

  // =========================================================================
  // 4. 阴阳浮游炮（T2-B · 飞行精准器灵：数学精确立体琉璃阴阳玉 + 雕花古金八卦结界环 + 纸垂流苏 + 四枚 3D 公转赤金棱镜浮游炮！）
  // =========================================================================
  creature_yinyang_turret: {
    ...HD_BASE,
    backdropTop: '#160d24',
    backdropBottom: '#33142a',
    backdropGlow: '#ff5270',
    avatarCrop: { x: 12, y: 14, size: 40 },
    portraitCrop: { x: 4, y: 8, w: 56, h: 56 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 27 : Math.round(31 + pose.leanX * 0.75);
      const by = Math.round(33 + Math.sin(phase) * 2.4 + pose.breathY * 1.4 - pose.stepLift);
      const fl = Math.round(pose.flutter * 1.8 + (isMove ? -2.2 : 0));
      // 移动时高速旋转棱镜炮，待机时优雅公转
      const orbitAngle = isMove ? (f / 4) * Math.PI * 2 + 0.35 : phase + 0.4;

      const drawPrismBit = (px: number, py: number, isFront: boolean) => {
        p.setPart(isFront ? SPRITE_PART.WEAPON : SPRITE_PART.BACK_ACC);
        p.poly([[px, py - 5], [px + 4, py], [px, py + 5], [px - 4, py]], isFront ? '#a81434' : '#6e0d24');
        p.poly([[px, py - 4], [px + 3, py], [px, py + 4], [px - 3, py]], isFront ? '#eb2a4e' : '#a81c3a');
        p.rect(px - 1, py - 2, 2, 4, '#ffe478', true);
        p.px(px, py - 1, '#ffffff', true);
        if (isMove) {
          p.setPart(SPRITE_PART.GLOW_FX);
          p.px(px - 5, py, '#ff7597', true);
        }
      };

      // [1] 后半轨道旋转棱镜炮（实现真实 3D 环绕前后层次！）
      const bits: Array<{ px: number; py: number; z: number }> = [];
      if (isAtk && (f === 1 || f === 2)) {
        // 攻击发射态：四枚浮游炮向前齐聚形成聚能炮阵！
        bits.push(
          { px: bx + 16, py: by - 13, z: 1 },
          { px: bx + 16, py: by + 13, z: 1 },
          { px: bx + 20, py: by - 6, z: 1 },
          { px: bx + 20, py: by + 6, z: 1 },
        );
      } else {
        for (let i = 0; i < 4; i++) {
          const a = orbitAngle + (i * Math.PI) / 2;
          bits.push({
            px: Math.max(4, Math.min(60, Math.round(bx + Math.cos(a) * 23))),
            py: Math.max(6, Math.min(62, Math.round(by + Math.sin(a) * 16))),
            z: Math.sin(a),
          });
        }
      }
      for (const b of bits) {
        if (b.z < 0) drawPrismBit(b.px, b.py, false);
      }

      // [2] 两侧摇曳神社白纸垂（Shide）+ 底部双层朱红鎏金华丽流苏穗
      p.setPart(SPRITE_PART.BACK_ACC);
      drawShideTassel64(p, bx - 18, by + 10, fl * 0.65, 3);
      drawShideTassel64(p, bx + 18, by + 10, fl * 0.65, 3);

      // 底部朱红鎏金大流苏穗（带立体金铃扣与飘逸丝穗）
      p.poly(
        [
          [bx - 4, by + 17],
          [bx + 4, by + 17],
          [bx + 6 + fl, by + 28],
          [bx + 1 + fl, by + 26],
          [bx - 1 + fl, by + 29],
          [bx - 6 + fl, by + 27],
        ],
        '#8f132e',
      );
      p.poly(
        [
          [bx - 3, by + 18],
          [bx + 3, by + 18],
          [bx + 4 + fl, by + 26],
          [bx - 4 + fl, by + 26],
        ],
        '#eb2a4e',
      );
      p.vline(bx + Math.round(fl * 0.5), by + 19, 8, '#fff5cc');
      p.hline(bx - 4, by + 18, 9, '#ffe066');
      p.ellipse(bx, by + 17, 3.0, 2.4, '#ffe478', true);

      // [3] 精雕古金八角八卦结界外环（双层浮雕鎏金框 + 八方位神钉 + 暗紫结界槽）
      p.setPart(SPRITE_PART.TORSO);
      p.ellipse(bx, by, 18.6, 18.6, '#7a4f16');
      p.ellipse(bx, by, 17.4, 17.4, '#d9a438');
      p.ellipse(bx - 0.5, by - 0.5, 16.4, 16.4, '#ffe278');
      p.ellipse(bx, by, 15.0, 15.0, '#1c1026');
      p.ellipse(bx, by, 13.8, 13.8, '#361a40');

      // 八方位精雕神钉与亮金八卦符点
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const nx = Math.round(bx + Math.cos(a) * 16.6);
        const ny = Math.round(by + Math.sin(a) * 16.6);
        p.rect(nx - 1, ny - 1, 2, 2, i % 2 === 0 ? '#ffffff' : '#ffe478', true);
      }

      // [4] 核心：数学精确光栅化超大「琉璃立体阴阳太极球」（R = 12.6，丝滑惊艳！）
      p.setPart(SPRITE_PART.FACE_FEATURES);
      const taijiRot = isMove ? f * 0.78 : phase * 0.5;
      drawGlossyTaijiOrb64(p, bx, by, 12.6, taijiRot, true);

      // [5] 前半轨道旋转棱镜炮
      for (const b of bits) {
        if (b.z >= 0) drawPrismBit(b.px, b.py, true);
      }

      // [6] 蓄力 & 齐射炽烈朱金白芯太极灵炮！
      p.setPart(SPRITE_PART.GLOW_FX);
      if (isAtk && f === 0) {
        p.ellipse(bx + 17, by, 4.5, 4.5, '#ff3366', true);
        p.ellipse(bx + 17, by, 2.4, 2.4, '#fff7cc', true);
        p.px(bx + 17, by, '#ffffff', true);
      } else if (isAtk && (f === 1 || f === 2)) {
        p.ellipse(bx + 18, by, 6.0, 6.6, '#ff2b59', true);
        p.ellipse(bx + 18, by, 3.6, 4.0, '#ffe878', true);
        p.poly(
          [
            [bx + 18, by - 5],
            [62, by - 9],
            [62, by + 9],
            [bx + 18, by + 5],
          ],
          '#ff3366',
          true,
        );
        p.poly(
          [
            [bx + 18, by - 3],
            [62, by - 5],
            [62, by + 5],
            [bx + 18, by + 3],
          ],
          '#ffe680',
          true,
        );
        p.line(bx + 18, by, 62, by, '#ffffff', 2, true);
      }
    },
  },

  // =========================================================================
  // 5. 退魔剑士（T3-A · 双重攻击 + 抗死结界：月银和风二刀流女剑豪 · 月蓝高马尾 + 新月额饰 + 精雕月银胸甲 + 辉金太刀×冰蓝胁差双月连斩！）
  // =========================================================================
  creature_exorcist_blade: {
    ...HD_BASE,
    backdropTop: '#0c142e',
    backdropBottom: '#1c2b52',
    backdropGlow: '#78c4ff',
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      const bx = isAtk && (f === 1 || f === 2) ? 26 : isAtk && f === 0 ? 25 : Math.round(29 + pose.leanX * 0.9);
      const by = Math.round(pose.breathY * 1.1 - pose.stepLift * 1.2);
      const sway = pose.flutter * 1.7;
      const headY = 23 + by;

      // [1] 背后飒爽飞扬的「月蓝大高马尾」+ 飘逸深蓝鎏金「和风阵羽织短披风」
      p.setPart(SPRITE_PART.BACK_ACC);
      const tailSway = isAtk && f === 1 ? -4.5 : sway;
      // 动感 S 弧月蓝高马尾
      p.bezierRibbon(
        [bx - 7, headY - 6],
        [bx - 19 + tailSway * 0.6, headY - 2],
        [bx - 21 + tailSway, headY + 12],
        6.5,
        1.6,
        '#1a2957',
      );
      p.bezierRibbon(
        [bx - 7, headY - 5],
        [bx - 17 + tailSway * 0.5, headY - 1],
        [bx - 19 + tailSway * 0.9, headY + 10],
        3.8,
        1.0,
        '#3b63b8',
      );
      p.bezierRibbon(
        [bx - 8, headY - 5],
        [bx - 15 + tailSway * 0.4, headY - 2],
        [bx - 17 + tailSway * 0.7, headY + 5],
        1.5,
        0.5,
        '#94c2ff',
      );
      // 绯红鎏金高马尾扎结
      p.rect(bx - 9, headY - 8, 4, 4, '#d92649');
      p.px(bx - 8, headY - 7, '#ffe680');

      // 飘扬深蓝滚金阵羽织披风
      const capeBack = isAtk && f === 1 ? -5 : sway;
      p.poly(
        [
          [bx - 4, 32 + by],
          [bx - 19 + capeBack, 41 + by],
          [bx - 21 + capeBack, 54 + by],
          [bx - 9 + capeBack * 0.4, 52 + by],
          [bx - 4, 42 + by],
        ],
        '#112252',
      );
      p.poly(
        [
          [bx - 4, 33 + by],
          [bx - 16 + capeBack * 0.9, 41 + by],
          [bx - 17 + capeBack * 0.9, 51 + by],
          [bx - 7, 49 + by],
        ],
        '#254da6',
      );
      p.bezierRibbon(
        [bx - 20 + capeBack, 53 + by],
        [bx - 14 + capeBack * 0.7, 53 + by],
        [bx - 9 + capeBack * 0.4, 51 + by],
        1.6,
        1.2,
        '#f2c852',
      );

      // [2] 3/4 斜错步精钢月银护胫 + 深蓝系带战靴
      drawStaggeredLegs64(p, bx, 51, 65, pose, {
        sockShadow: '#6479a8',
        sockLight: '#dce8ff',
        shoeDark: '#172347',
        shoeMain: '#304985',
        shoeHighlight: '#ffe478',
      });

      // [3] 左后臂（副手）：精雕月银袖护 + 2px 软萌少女小臂 + 「冰蓝灵胁差（二刀流副刃）」！
      p.setPart(SPRITE_PART.BACK_ARM);
      drawPuffSleeve64(p, bx - 6.5, 34 + by, '#495d87', '#c2d5f5', '#f2c852', 'left');
      if (isAtk && f === 0) {
        drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 13, 39 + by);
        p.setPart(SPRITE_PART.WEAPON);
        p.line(bx - 13, 39 + by, bx - 22, 31 + by, '#4db8ff', 3, true);
        p.line(bx - 13, 38 + by, bx - 22, 31 + by, '#ebfbff', 1, true);
        p.rect(bx - 14, 38 + by, 2, 2, '#ffe066');
      } else if (isAtk && f === 1) {
        // 第一段纵斩：副刃后拉蓄势准备第二段连斩
        drawSoftChibiArm64(p, bx - 8, 36 + by, bx - 13, 41 + by);
        p.setPart(SPRITE_PART.WEAPON);
        p.line(bx - 13, 41 + by, bx - 22, 46 + by, '#4db8ff', 2, true);
        p.line(bx - 13, 40 + by, bx - 22, 45 + by, '#e8faff', 1, true);
      } else if (isAtk && f === 2) {
        // 第二段回旋双连斩！副刃冰蓝灵胁差顺势前横扫切出苍蓝弯月剑气！
        drawSoftChibiArm64(p, bx - 7, 36 + by, bx + 9, 39 + by);
        p.setPart(SPRITE_PART.WEAPON);
        p.line(bx + 9, 39 + by, bx + 25, 34 + by, '#3db4ff', 3, true);
        p.line(bx + 10, 38 + by, bx + 25, 34 + by, '#ffffff', 1, true);
        drawWrappedHand(p, bx + 9, 39 + by);
      } else {
        // 待机/移动：左手反握冰蓝灵胁差优雅斜指后下方，二刀流剪影超飒！
        const offArm = isHit ? -2 : Math.round(-pose.stride * 1.4);
        const lhX = bx - 12 + offArm;
        const lhY = 40 + by;
        drawSoftChibiArm64(p, bx - 8, 36 + by, lhX, lhY);
        p.setPart(SPRITE_PART.WEAPON);
        p.line(lhX, lhY, Math.max(4, lhX - 11), lhY + 8, '#38a3ff', 3, true);
        p.line(lhX - 1, lhY, Math.max(4, lhX - 11), lhY + 7, '#e8fbff', 1, true);
        p.line(lhX - 1, lhY - 2, lhX + 2, lhY + 2, '#f5cc58', 1);
        drawWrappedHand(p, lhX, lhY);
      }

      // [4] 干净大色块 3/4 深蓝百褶剑道袴裙 + 洁白滚边 + 前垂纤长白金退魔御札布！
      drawCleanAnimeSkirt64(p, {
        waistX: bx + 0.5,
        waistY: 40 + by,
        waistW: 10,
        hemY: 51 + by,
        hemW: 29,
        tiltRight: 1.0,
        archDepth: 2.5,
        waveLobes: 3.5,
        waveAmp: 1.5,
        swayX: -pose.leanX * 0.5 + sway * 0.75,
        colors: {
          deep: '#122454',
          shadow: '#1e3c80',
          main: '#2e5ec2',
          light: '#5287ed',
          highlight: '#8cb8ff',
        },
        trimBand: {
          offsetFromHem: 2.0,
          thickness: 1.3,
          color: '#f2f7ff',
          shadowColor: '#b3c6e8',
        },
        petticoat: {
          peekDepth: 1.8,
          shade: '#b8c8e6',
          main: '#f5f9ff',
          highlight: '#ffffff',
        },
      });
      // 前垂纤长白金退魔御札布（干净点缀正中，不挡腿）
      p.setPart(SPRITE_PART.APRON_WAIST);
      const tabSway = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      p.poly(
        [
          [bx - 2, 41 + by],
          [bx + 3, 41 + by],
          [bx + 4 + tabSway, 53 + by],
          [bx - 1 + tabSway, 53 + by],
        ],
        '#f5f8ff',
      );
      p.vline(bx + 1 + Math.round(tabSway * 0.5), 42 + by, 10, '#e0284a');
      p.px(bx + 1 + Math.round(tabSway * 0.5), 45 + by, '#ffe680', true);

      // [5] 精雕月银修身轻胸甲 + 绯红和风交领 + 立体护甲下沿折线 + 金色退魔纹章与束腰！
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#425680');
      p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#a5bce0');
      p.rect(bx - 3, 33 + by, 4, 4, '#edf4ff');
      p.px(bx - 2, 34 + by, '#ffffff');
      // 胸甲立体金属折面暗线（强化轻铠金属雕塑感！）
      p.hline(bx - 4, 37 + by, 9, '#5e74a1');
      p.hline(bx - 3, 38 + by, 7, '#d4e4ff');
      // 绯红和风交领
      p.line(bx - 4, 32 + by, bx + 1, 36 + by, '#d92647', 1);
      p.line(bx + 4, 32 + by, bx + 1, 36 + by, '#f54263', 1);
      p.px(bx + 1, 37 + by, '#ffe478', true);
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.hline(bx - 5, 40 + by, 11, '#c91e3e');
      p.hline(bx - 4, 39 + by, 9, '#f2c852');
      p.rect(bx - 1, 39 + by, 3, 2, '#fff099');

      // [6] 飒爽英气少女脸 + 璀璨苍穹蓝 4×4 大眼 + 月蓝大集群发冠 + 白银发箍与鎏金新月红玉额饰！
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#fff6ee',
        skinMain: '#ffe2ce',
        skinShade: '#e6ad98',
        lashColor: '#1b1d3d',
        irisDark: '#1646ad',
        irisMid: '#3682f5',
        irisGlow: '#9eeaff',
        blushColor: '#ff96b0',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#192752',
        dark: '#284285',
        mid: '#426ec7',
        light: '#78a8f5',
        spec: '#d6eaff',
        leftLockLen: 11,
        rightLockLen: 10,
        fluff: 2,
        sway,
      });
      // 白银细发箍 + 眉心精巧鎏金新月退魔额冠
      p.setPart(SPRITE_PART.HEADWEAR);
      p.hline(bx - 7, headY - 8, 14, '#dce8fc');
      p.hline(bx - 5, headY - 9, 10, '#ffffff');
      p.poly(
        [
          [bx - 4, headY - 12],
          [bx - 1, headY - 9],
          [bx + 1, headY - 9],
          [bx + 4, headY - 12],
          [bx + 2, headY - 8],
          [bx - 2, headY - 8],
        ],
        '#ffe478',
        true,
      );
      p.px(bx, headY - 9, '#ff2652', true);

      // [7] 右前臂月银小肩甲 + 2px 少女小臂真握持「辉金破魔太刀（主刃）」+ 双月连斩光弧！
      p.setPart(SPRITE_PART.FRONT_ARM);
      drawPuffSleeve64(p, bx + 6.5, 34 + by, '#5c729e', '#d6e6ff', '#ffe073', 'right');

      if (isAtk && f === 0) {
        // 蓄力帧：右手高举辉金太刀向右上蓄势，避开脸庞！
        const handX = bx + 11;
        const handY = 27 + by;
        drawSoftChibiArm64(p, bx + 8, 35 + by, handX, handY);
        p.setPart(SPRITE_PART.WEAPON);
        p.line(handX - 2, handY + 3, handX + 1, handY - 1, '#a81c38', 2);
        p.line(handX - 2, handY - 2, handX + 4, handY + 1, '#ffe066', 2);
        p.line(handX + 1, handY - 1, handX - 5, 8 + by, '#f5b82e', 3, true);
        p.line(handX + 1, handY - 2, handX - 5, 8 + by, '#ffffff', 1, true);
        drawWrappedHand(p, handX, handY);
        p.setPart(SPRITE_PART.GLOW_FX);
        p.px(handX - 5, 7 + by, '#ffffff', true);
        p.px(handX - 7, 8 + by, '#8cd6ff', true);
      } else if (isAtk && f === 1) {
        // 第一段纵斩：太刀猛然斜劈，前方划出饱满炽金白芯大满月斩弧！
        const handX = bx + 13;
        const handY = 39 + by;
        drawSoftChibiArm64(p, bx + 8, 36 + by, handX, handY);
        p.setPart(SPRITE_PART.WEAPON);
        p.line(handX - 2, handY - 1, handX + 1, handY + 1, '#a81c38', 2);
        p.line(handX + 1, handY + 1, Math.min(58, handX + 19), handY + 7, '#f5b82e', 3, true);
        p.line(handX + 2, handY, Math.min(58, handX + 19), handY + 6, '#ffffff', 1, true);
        p.vline(handX + 2, handY - 2, 6, '#ffe478');
        drawWrappedHand(p, handX, handY);
        drawSlashArc64(p, bx + 13, 34 + by, 21, 20, -1.25, 0.95, '#ff9e24', '#ffe878', '#ffffff');
      } else if (isAtk && f === 2) {
        // 第二段回旋双连斩：太刀上撩收势 + 配合副手苍蓝新月反斩弧！
        const handX = bx + 12;
        const handY = 31 + by;
        drawSoftChibiArm64(p, bx + 8, 35 + by, handX, handY);
        p.setPart(SPRITE_PART.WEAPON);
        p.line(handX, handY, Math.min(58, handX + 16), handY - 13, '#f5c038', 3, true);
        p.line(handX + 1, handY - 1, Math.min(58, handX + 16), handY - 13, '#ffffff', 1, true);
        drawWrappedHand(p, handX, handY);
        drawSlashArc64(p, bx + 14, 35 + by, 20, 17, -0.95, 1.05, '#2694ff', '#99ebff', '#ffffff');
      } else {
        // 待机/行走：右手持修长微弧「辉金破魔太刀」斜指右上方，剑姿绝美！
        const handX = bx + 11;
        const handY = 38 + by - Math.round(pose.armAction * 2);
        drawSoftChibiArm64(p, bx + 8, 36 + by, handX, handY);
        p.setPart(SPRITE_PART.WEAPON);
        p.line(handX - 4, handY + 4, handX + 1, handY - 1, '#9e1b35', 2);
        p.line(handX - 2, handY - 3, handX + 4, handY + 2, '#f5cc58', 2);
        // 修长微弧太刀刃（冷银刀背 + 炽金白光刀锋！）
        const tipX = Math.min(59, handX + 16);
        const tipY = Math.max(10, handY - 20);
        p.bezierRibbon([handX + 1, handY - 1], [handX + 10, handY - 9], [tipX, tipY], 2.8, 1.1, '#78a8db');
        p.bezierRibbon([handX + 2, handY - 1], [handX + 11, handY - 9], [tipX, tipY], 1.7, 0.7, '#ffe473', true);
        p.bezierRibbon([handX + 3, handY - 2], [handX + 11, handY - 10], [tipX, tipY], 0.9, 0.4, '#ffffff', true);
        drawWrappedHand(p, handX, handY);
        if (pose.frame % 3 === 1) {
          p.setPart(SPRITE_PART.GLOW_FX);
          p.px(tipX + 1, tipY - 1, '#ffffff', true);
        }
      }
    },
  },

  // =========================================================================
  // 6. 净邪巫女（T3-B · 远程施法 + 抗死结界：东方琉璃莲僧神官少女 · 紫藤长发 + 莲花金钿 + 翡翠滚金袈裟白袍 + 鎏金念珠法轮 + 六环大锡杖！）
  // =========================================================================
  creature_prayer_maiden: {
    ...HD_BASE,
    backdropTop: '#0d1929',
    backdropBottom: '#1a2f42',
    backdropGlow: '#78f5df',
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      const bx = isAtk && (f === 1 || f === 2) ? 26 : Math.round(29 + pose.leanX * 0.8);
      const by = Math.round(pose.breathY * 1.3 - pose.stepLift * 1.1 - 1);
      const sway = pose.flutter * 1.5;
      const headY = 23 + by;

      // [1] 脚下缓缓绽放的「青玉莲光浮空法阵」+ 背后悬空公转「12 珠鎏金翡翠念珠轮」！
      p.setPart(SPRITE_PART.BACK_ACC);
      p.ellipse(bx, 64, 15.0, 3.4, '#1a7d70', true);
      p.ellipse(bx, 64, 10.5, 2.0, '#78ffe8', true);
      p.hline(bx - 6, 64, 12, '#e6fffb', true);

      const ringY = 27 + by;
      p.setPart(SPRITE_PART.GLOW_FX);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + phase * 0.5;
        const rx = Math.max(3, Math.min(60, Math.round(bx + Math.cos(a) * 19.5)));
        const ry = Math.max(3, Math.min(58, Math.round(ringY + Math.sin(a) * 18.5)));
        if (i % 3 === 0) {
          p.ellipse(rx, ry, 1.8, 1.8, '#59f5db', true);
          p.px(rx, ry - 1, '#ffffff', true);
        } else {
          p.rect(rx - 1, ry - 1, 2, 2, '#ffe066', true);
        }
      }

      // [2] 瀑布般柔美紫藤丁香长后发（优雅区别于灵梦乌黑长发！）
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 9, headY],
          [bx + 11 - sway * 0.4, 45 + by],
          [bx + 6 - sway * 0.6, 52 + by],
          [bx - 9 + sway * 0.7, 53 + by],
          [bx - 13 + sway * 0.8, 44 + by],
        ],
        '#4b3773',
      );
      p.poly(
        [
          [bx - 8, headY + 1],
          [bx + 7, headY + 1],
          [bx + 8 - sway * 0.3, 44 + by],
          [bx - 10 + sway * 0.5, 45 + by],
        ],
        '#7e63b0',
      );
      p.bezierRibbon([bx - 8, headY + 6], [bx - 11 + sway * 0.5, 40 + by], [bx - 11 + sway * 0.8, 50 + by], 2.2, 0.8, '#c2aaf0');

      // [3] 3/4 斜错步雪白足袋 + 青玉滚金神官鞋
      drawStaggeredLegs64(p, bx, 52, 64, pose, {
        sockShadow: '#cedae6',
        sockLight: '#ffffff',
        shoeDark: '#16635b',
        shoeMain: '#2db5a5',
        shoeHighlight: '#ffe885',
      });

      // [4] 左后臂：优雅垂坠青玉鎏金广袖 + 娇嫩柔手结净灵祈愿手印
      p.setPart(SPRITE_PART.BACK_ARM);
      p.poly(
        [
          [bx - 5, 33 + by],
          [bx - 14 + sway * 0.4, 37 + by],
          [bx - 17 + sway * 0.6, 48 + by],
          [bx - 10 + sway * 0.4, 50 + by],
          [bx - 6, 44 + by],
        ],
        '#19756b',
      );
      p.poly(
        [
          [bx - 5, 34 + by],
          [bx - 12 + sway * 0.4, 38 + by],
          [bx - 14 + sway * 0.5, 47 + by],
          [bx - 8, 44 + by],
        ],
        '#34b8a8',
      );
      p.bezierRibbon(
        [bx - 16 + sway * 0.6, 48 + by],
        [bx - 12 + sway * 0.5, 49 + by],
        [bx - 8, 45 + by],
        1.6,
        1.2,
        '#ffe478',
      );
      p.ellipse(bx - 15 + Math.round(sway * 0.4), 41 + by, 1.8, 1.8, '#ffe6d6');
      // 祈愿指尖轻浮碧玉莲光微点
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx - 17 + Math.round(sway * 0.4), 37 + by, 2.0, 2.0, '#66ffea', true);
      p.px(bx - 17 + Math.round(sway * 0.4), 37 + by, '#ffffff', true);

      // [5] 干净大色块 3/4 琉璃珍珠白长祭司裙袍 + 翡翠鎏金双层滚边！
      drawCleanAnimeSkirt64(p, {
        waistX: bx + 0.5,
        waistY: 40 + by,
        waistW: 10,
        hemY: 53 + by,
        hemW: 30,
        tiltRight: 0.8,
        archDepth: 2.6,
        waveLobes: 3.5,
        waveAmp: 1.5,
        swayX: -pose.leanX * 0.4 + sway * 0.75,
        colors: {
          deep: '#adbdd6',
          shadow: '#d5e0f0',
          main: '#f2f7ff',
          light: '#fafdff',
          highlight: '#ffffff',
        },
        trimBand: {
          offsetFromHem: 2.2,
          thickness: 1.8,
          color: '#2dc2b0',
          shadowColor: '#197d71',
        },
        petticoat: {
          peekDepth: 1.8,
          shade: '#d4b357',
          main: '#ffe885',
          highlight: '#fff9cc',
        },
      });

      // [6] 洁白禅衣上身 + 斜披翡翠鎏金「天女袈裟」+ 胸口莲花翡翠玉佩
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 6, 40 + by], [bx - 5, 40 + by]], '#e6eef7');
      p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 4, 39 + by], [bx - 4, 39 + by]], '#ffffff');
      // 斜披碧玉鎏金袈裟绶带
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.line(bx - 5, 32 + by, bx + 5, 40 + by, '#1a7d71', 4);
      p.line(bx - 5, 32 + by, bx + 5, 40 + by, '#3ad1bf', 2);
      p.line(bx - 5, 31 + by, bx + 5, 39 + by, '#ffe478', 1);
      p.hline(bx - 5, 40 + by, 11, '#24998b');
      p.hline(bx - 4, 40 + by, 9, '#ffe880');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx + 1, 36 + by, 2.0, 2.0, '#66ffea', true);
      p.px(bx + 1, 35 + by, '#ffffff', true);

      // [7] 澄澈温婉神官少女脸 + 翡翠碧波 4×4 大眼 + 紫藤长发 + 精雕金莲额冠与双鬓金铃饰！
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#fff8f2',
        skinMain: '#ffe6d6',
        skinShade: '#e6b29e',
        lashColor: '#291c40',
        irisDark: '#12736b',
        irisMid: '#26c9b8',
        irisGlow: '#a6fff4',
        blushColor: '#ff9cb5',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#4a3673',
        dark: '#7256a3',
        mid: '#9f82d4',
        light: '#cfb8f7',
        spec: '#f2ebff',
        leftLockLen: 13,
        rightLockLen: 12,
        fluff: 2,
        sway,
      });
      // 精致金莲翡翠额冠 + 双鬓金色小莲坠
      p.setPart(SPRITE_PART.HEADWEAR);
      p.poly(
        [
          [bx - 6, headY - 8],
          [bx - 3, headY - 12],
          [bx, headY - 14],
          [bx + 3, headY - 12],
          [bx + 6, headY - 8],
        ],
        '#d9a12b',
      );
      p.poly(
        [
          [bx - 5, headY - 8],
          [bx - 2, headY - 11],
          [bx, headY - 13],
          [bx + 2, headY - 11],
          [bx + 5, headY - 8],
        ],
        '#ffe678',
        true,
      );
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx, headY - 10, 1.8, 1.8, '#75ffeb', true);
      p.px(bx, headY - 11, '#ffffff', true);
      p.setPart(SPRITE_PART.HEADWEAR);
      p.rect(bx - 11, headY + 6, 2, 3, '#ffe066');
      p.rect(bx + 9, headY + 6, 2, 3, '#ffe066');

      // [8] 右前臂青玉广袖 + 2px 软萌小臂优雅端持「六环鎏金大锡杖」！
      p.setPart(SPRITE_PART.FRONT_ARM);
      const handX = isAtk && (f === 1 || f === 2) ? bx + 15 : isAtk && f === 0 ? bx + 12 : bx + 13;
      const handY = isAtk && f === 0 ? 31 + by : isAtk && (f === 1 || f === 2) ? 35 + by : 39 + by - Math.round(pose.armAction * 2);
      p.poly(
        [
          [bx + 5, 33 + by],
          [handX, handY - 2],
          [handX - 1, handY + 6],
          [bx + 7, handY + 7],
          [bx + 5, 40 + by],
        ],
        '#2ab0a0',
      );
      p.line(bx + 7, handY + 6, handX - 1, handY + 6, '#ffe478', 1);
      drawSoftChibiArm64(p, bx + 7, 36 + by, handX, handY);

      // 六环鎏金大锡杖（修长金柄 + 顶部镂空莲环 + 六枚晃动小金环 + 发光净灵翠玉核！）
      p.setPart(SPRITE_PART.WEAPON);
      const staffTopX = Math.min(54, handX + (isAtk && (f === 1 || f === 2) ? 6 : 2));
      const staffTopY = Math.max(10, handY - (isAtk && f === 0 ? 19 : 21));
      const staffBotX = handX - (isAtk && (f === 1 || f === 2) ? 4 : 1);
      const staffBotY = Math.min(64, handY + 23);
      p.line(staffBotX, staffBotY, staffTopX, staffTopY + 5, '#996719', 3);
      p.line(staffBotX + 1, staffBotY - 1, staffTopX, staffTopY + 5, '#ffe478', 1);
      // 锡杖顶真·镂空大金环（内部完全透明！绝无不透明黑圆贴片！）+ 顶部金莲尖
      drawHollowGoldRing64(p, staffTopX, staffTopY, 6.2, 6.8, 0.64, '#b87d1a', '#ffe478', '#fffad1', true);
      p.poly([[staffTopX - 2, staffTopY - 6], [staffTopX, staffTopY - 10], [staffTopX + 2, staffTopY - 6]], '#ffe885', true);
      // 两侧叮当作响的 6 枚小金环（左右各 3 环）
      const jingle = Math.round(Math.sin(phase * 2) * 1);
      for (const dy of [-2, 1, 4]) {
        p.ellipse(staffTopX - 5, staffTopY + dy + jingle, 1.5, 1.5, '#fff0a6', true);
        p.ellipse(staffTopX + 5, staffTopY + dy - jingle, 1.5, 1.5, '#fff0a6', true);
      }
      // 锡杖中央悬浮璀璨净灵翠玉核心
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(staffTopX, staffTopY, 2.2, 2.2, '#59ffea', true);
      p.px(staffTopX, staffTopY - 1, '#ffffff', true);

      drawWrappedHand(p, handX, handY);

      if (isAtk && (f === 1 || f === 2)) {
        // 施法净化爆发青金圣环与光波（严格收于画布上沿 y>=3 内零裁边！）
        p.setPart(SPRITE_PART.GLOW_FX);
        drawSlashArc64(p, staffTopX - 2, staffTopY + 5, 13, 14, -1.1, 1.1, '#24d9be', '#ffe885', '#ffffff');
      }
    },
  },

  // =========================================================================
  // 7. 御柱天马（T4-A · 2×1 疾驰圣骑 · 先攻 + 冲锋增伤：真骑乘构型！高大雪白圣翼天马 + 深红高桥马鞍 + 清晰弯曲重铠腿踩马镫 + 左手拉缰绳 + 鎏金羽盔圣骑士高擎御柱长枪！）
  // =========================================================================
  creature_onbashira_steed: {
    ...HD_BASE,
    backdropTop: '#0d1733',
    backdropBottom: '#1c2f59',
    backdropGlow: '#82d4ff',
    avatarCrop: { x: 12, y: 4, size: 38 },
    portraitCrop: { x: 1, y: 4, w: 62, h: 64 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;

      // 马体略偏左中，为右侧修长昂首白马颈头与前方冲锋枪锋留出充裕空间！
      const bx = isAtk && (f === 1 || f === 2) ? 24 : Math.round(26 + pose.leanX * 0.75);
      const by = isMove
        ? [0, -3, -1, 1][f % 4]
        : Math.round(pose.breathY * 1.0 - pose.stepLift * 1.1);
      const fl = Math.round(pose.flutter * 2.1 + (isMove ? -2.4 : 0));
      const flap = isMove ? [-7, 6, 2, -4][f % 4] : Math.round(Math.sin(phase) * 2.8);
      const gallop = isMove ? [5, 2, -5, -2][f % 4] : Math.round(pose.stride * 4.0);

      // 骑手明确后坐于马背中后鞍窝（与前方高耸马颈拉开 10px 以上净空，彻底杜绝半人马错觉！）
      const riderX = bx - 3 + (isAtk && (f === 1 || f === 2) ? 2 : 0);
      const riderY = by + (isMove ? [0, -1, 0, 1][f % 4] : 0);

      // [1] 后景：明确从「天马肩胛后背」长出的宏伟双层雪白冰青天马圣翼（无披风遮挡，羽翼净空展开！）
      p.setPart(SPRITE_PART.BACK_ACC);
      // 远侧副翼（从马肩微向上展露双翼纵深）
      drawSeraphWingSide64(p, bx + 4, 37 + by, -1, 18, 19, Math.round(flap * 0.75) - 4, {
        deep: '#3f6db0',
        mid: '#9bcbf5',
        light: '#dceeff',
        tip: '#ffffff',
      }, false);
      // 主圣翼（清晰锚定于马肩脊背，向左上高扬舒展，彻底摆脱披风遮挡！）
      drawSeraphWingSide64(p, bx + 1, 39 + by, -1, 24, 24, flap, {
        deep: '#4c80c4',
        mid: '#c4e6ff',
        light: '#f5fbff',
        tip: '#ffffff',
        gold: '#ffe478',
      });
      // 飘逸雪青长马尾（从马臀后端流畅垂摆）
      p.bezierRibbon(
        [bx - 13, 44 + by],
        [Math.max(4, bx - 21), 47 + by + Math.round(fl * 0.5)],
        [Math.max(3, bx - 23), 57 + by + fl],
        5.5,
        1.4,
        '#7daee0',
      );
      p.bezierRibbon(
        [bx - 13, 44 + by],
        [Math.max(5, bx - 19), 47 + by + Math.round(fl * 0.4)],
        [Math.max(4, bx - 21), 54 + by + Math.round(fl * 0.7)],
        2.8,
        0.8,
        '#ffffff',
      );

      // [2] 远侧后腿 & 远侧前腿（黄金马蹄 + 冰银阴影）
      p.setPart(SPRITE_PART.LEGS);
      const farHindX = Math.max(5, bx - 15 - gallop);
      const farForeX = Math.min(54, bx + 14 + gallop);
      const farForeY = isMove && (f === 1 || f === 3) ? 59 : 63;
      p.line(bx - 10, 49 + by, farHindX + 2, 56, '#93a3c2', 4);
      p.line(farHindX + 2, 56, farHindX, 63, '#b5c4de', 3);
      p.rect(farHindX - 1, 62, 4, 2, '#c48f25');
      p.line(bx + 9, 48 + by, farForeX - 1, 56, '#a5b5d4', 4);
      p.line(farForeX - 1, 56, farForeX, farForeY, '#c9d7ed', 3);
      p.rect(farForeX - 1, farForeY - 1, 4, 2, '#d9a432');

      // [3] 修长高大的雪白天马躯干 + 皇家苍蓝镶金骑士马衣（完整连续水平马背线条！）
      p.setPart(SPRITE_PART.TORSO);
      // 浑厚白马胸腹与修长水平马背（横跨 bx-14 .. bx+15）
      p.ellipse(bx, 45 + by, 15.8, 7.2, '#b2c2de');
      p.ellipse(bx, 43.6 + by, 14.2, 5.8, '#f5f9ff');
      p.ellipse(bx + 2, 41.8 + by, 11.2, 3.6, '#ffffff');
      // 清晰独立的马胸前肌
      p.ellipse(bx + 11, 44 + by, 5.8, 5.8, '#dce8f7');
      p.ellipse(bx + 12, 42.5 + by, 4.4, 4.4, '#ffffff');
      // 皇家苍蓝鎏金骑士马衣（贴合马腹与马臀，下方留出洁白骏马肌肉线条！）
      p.poly(
        [
          [bx - 12, 41 + by],
          [bx + 11, 41 + by],
          [bx + 13, 51 + by],
          [bx + 4, 50 + by],
          [bx - 11, 52 + by],
        ],
        '#143b85',
      );
      p.poly(
        [
          [bx - 10, 41 + by],
          [bx + 9, 41 + by],
          [bx + 10, 49 + by],
          [bx - 9, 50 + by],
        ],
        '#2b6ed9',
      );
      p.line(bx - 11, 51 + by, bx + 12, 50 + by, '#ffe066', 2);
      // 马胸前的鎏金蓝色胸带（Breastplate Strap）
      p.line(bx + 8, 42 + by, bx + 16, 44 + by, '#1e54b5', 3);
      p.line(bx + 8, 42 + by, bx + 16, 44 + by, '#ffe478', 1);

      // [4] 昂扬修长的「白玉天鹅颈马脖」+ 飘逸冰青马鬃 + 俊美雕花白马头 + 鎏金笼头衔铁！
      //     （明确前伸于 bx+12 .. bx+30，与骑士躯干彻底分开，一看就是独立高头大马！）
      const neckBaseX = bx + 10;
      const neckBaseY = 42 + by;
      const headPivotX = bx + 18;
      const headPivotY = 26 + by;
      p.poly(
        [
          [neckBaseX, neckBaseY],
          [headPivotX - 1, headPivotY],
          [headPivotX + 6, headPivotY + 2],
          [neckBaseX + 7, neckBaseY + 3],
        ],
        '#cbdcf2',
      );
      p.poly(
        [
          [neckBaseX + 2, neckBaseY - 1],
          [headPivotX + 1, headPivotY + 1],
          [headPivotX + 5, headPivotY + 3],
          [neckBaseX + 6, neckBaseY + 1],
        ],
        '#ffffff',
      );
      // 冰青璀璨飘逸马鬃（沿马颈后缘优雅垂流！）
      p.bezierRibbon([headPivotX - 1, headPivotY + 1], [bx + 11, 32 + by], [bx + 8, 39 + by], 4.6, 2.0, '#42b0ff');
      p.bezierRibbon([headPivotX, headPivotY + 2], [bx + 12, 32 + by], [bx + 10, 38 + by], 2.0, 0.8, '#c7f4ff');
      // 修长俊美的骏马头部（清晰鼻梁弧度、收敛马吻、鼻孔、双立耳！）
      const muzzleX = Math.min(59, headPivotX + 14);
      const muzzleY = headPivotY + 7;
      p.poly(
        [
          [headPivotX - 1, headPivotY],
          [headPivotX + 6, headPivotY],
          [muzzleX, muzzleY],
          [muzzleX - 2, muzzleY + 4],
          [headPivotX + 6, headPivotY + 8],
          [headPivotX + 1, headPivotY + 6],
        ],
        '#d2e0f5',
      );
      p.poly(
        [
          [headPivotX, headPivotY],
          [headPivotX + 6, headPivotY + 1],
          [muzzleX - 1, muzzleY],
          [headPivotX + 7, headPivotY + 7],
          [headPivotX + 2, headPivotY + 5],
        ],
        '#ffffff',
      );
      // 一对尖挺白马耳
      p.poly([[headPivotX, headPivotY], [headPivotX + 1, headPivotY - 6], [headPivotX + 4, headPivotY + 1]], '#e8f2ff');
      p.poly([[headPivotX + 3, headPivotY], [headPivotX + 5, headPivotY - 5], [headPivotX + 6, headPivotY + 1]], '#ffffff');
      // 鎏金马面甲（Chanfron）+ 苍蓝神马灵瞳 + 暗棕笼头鼻革与嘴角黄金衔铁环！
      p.line(headPivotX + 4, headPivotY + 1, muzzleX - 1, muzzleY, '#ffe066', 2);
      p.px(headPivotX + 7, headPivotY + 3, '#24d2ff', true);
      p.px(headPivotX + 7, headPivotY + 2, '#ffffff', true);
      p.line(muzzleX - 4, muzzleY - 1, muzzleX - 5, muzzleY + 3, '#6e3f1c', 1); // 鼻革
      p.px(muzzleX - 2, muzzleY + 2, '#5c7299'); // 鼻孔
      const bitX = muzzleX - 5;
      const bitY = muzzleY + 2;
      p.rect(bitX - 1, bitY - 1, 2, 2, '#ffe478'); // 黄金衔铁环

      // [5] 近侧强健奔腾前后骏腿（肌肉弧度 + 扬蹄冲锋 + 璀璨黄金马蹄！）
      p.setPart(SPRITE_PART.LEGS);
      const nearHindX = Math.max(7, bx - 10 + gallop);
      p.poly([[bx - 13, 46 + by], [bx - 6, 46 + by], [nearHindX + 2, 56], [nearHindX - 3, 56]], '#dde8f7');
      p.line(nearHindX - 1, 55, nearHindX + 1, 64, '#ffffff', 3);
      p.rect(nearHindX, 63, 4, 3, '#f2c44d');
      p.hline(nearHindX + 1, 63, 3, '#fff5b8');

      const hoofLift = isAtk && (f === 0 || f === 1) ? -7 : isMove && f === 1 ? -5 : -2;
      const nearKneeX = bx + 16 - Math.round(gallop * 0.6);
      const nearKneeY = 51 + by + hoofLift;
      const nearHoofX = Math.min(54, nearKneeX + 2);
      const nearHoofY = Math.min(64, 60 + hoofLift);
      p.poly([[bx + 8, 44 + by], [bx + 14, 44 + by], [nearKneeX + 2, nearKneeY], [nearKneeX - 3, nearKneeY + 1]], '#ffffff');
      p.line(nearKneeX, nearKneeY, nearHoofX, nearHoofY, '#e3eeff', 3);
      p.line(nearKneeX + 1, nearKneeY, nearHoofX + 1, nearHoofY - 1, '#ffffff', 1);
      p.rect(nearHoofX - 1, nearHoofY - 1, 4, 3, '#ffe066');

      // [6] 核心破除半人马铁证 ①：深绯鎏金高桥骑士马鞍（清晰翘起的前/后鞍桥将人马截然分层！）
      p.setPart(SPRITE_PART.APRON_WAIST);
      // 后高鞍桥（Cantle）+ 鞍座 + 前高鞍桥（Pommel）
      p.poly(
        [
          [riderX - 7, 36 + by],
          [riderX - 4, 36 + by],
          [riderX - 3, 40 + by],
          [riderX + 4, 40 + by],
          [riderX + 6, 37 + by],
          [riderX + 8, 38 + by],
          [riderX + 6, 43 + by],
          [riderX - 6, 43 + by],
        ],
        '#6e1a2a',
      );
      p.hline(riderX - 6, 36 + by, 3, '#ffe066'); // 后鞍桥金边
      p.hline(riderX + 6, 37 + by, 2, '#ffe066'); // 前鞍桥金边
      p.hline(riderX - 5, 42 + by, 11, '#c9932c'); // 鞍垫金线

      // [7] 骑士纤细收腰蓝金披带（收于鞍后下方，绝不遮挡雪白天马圣翼！）+ 左远臂「紧拉棕金缰绳连至马嘴衔铁」（核心破除半人马铁证 ②！）
      p.setPart(SPRITE_PART.BACK_ARM);
      p.bezierRibbon(
        [riderX - 4, 34 + riderY],
        [Math.max(6, riderX - 11 + fl * 0.4), 37 + riderY],
        [Math.max(5, riderX - 15 + fl * 0.7), 40 + riderY],
        3.2,
        1.2,
        '#1648a8',
      );
      p.bezierRibbon(
        [riderX - 4, 35 + riderY],
        [Math.max(7, riderX - 10 + fl * 0.4), 38 + riderY],
        [Math.max(6, riderX - 14 + fl * 0.6), 40 + riderY],
        1.2,
        0.6,
        '#ffe073',
      );

      // 左前臂前伸拉缰绳！
      const reinHandX = riderX + 8;
      const reinHandY = 31 + riderY;
      p.line(riderX + 3, 29 + riderY, reinHandX, reinHandY, '#c78c20', 2);
      p.rect(reinHandX - 1, reinHandY - 1, 2, 2, '#ffe885');
      // 清晰纤细的「皮质鎏金缰绳」从骑士左手一路拉到白马嘴角衔铁！
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.bezierRibbon(
        [reinHandX, reinHandY + 1],
        [Math.round((reinHandX + bitX) * 0.5), Math.max(reinHandY + 3, bitY + 2)],
        [bitX, bitY],
        1.1,
        0.9,
        '#6e3d1a',
      );
      p.px(Math.round((reinHandX + bitX) * 0.5), Math.max(reinHandY + 3, bitY + 1), '#ffe066');

      // [8] 精干挺拔的「天穹冠军圣骑士」上身重铠 + 白银护颈 + 棱角羽翼银金全盔！
      p.setPart(SPRITE_PART.NECK_HEAD);
      // 精钢白银护颈（Gorget），干净衔接全盔与黄金胸甲！
      p.hline(riderX - 2, 25 + riderY, 6, '#d9e8ff');
      // 骑士精干鎏金胸铠与绯蓝腰裙（比例收精致，凸显高头大马！）
      p.poly(
        [
          [riderX - 4, 26 + riderY],
          [riderX + 4, 26 + riderY],
          [riderX + 5, 37 + riderY],
          [riderX - 4, 37 + riderY],
        ],
        '#a86e18',
      );
      p.poly(
        [
          [riderX - 3, 27 + riderY],
          [riderX + 3, 27 + riderY],
          [riderX + 4, 36 + riderY],
          [riderX - 3, 36 + riderY],
        ],
        '#f5c749',
      );
      p.rect(riderX - 1, 28 + riderY, 3, 6, '#fff4b8');
      p.px(riderX + 1, 30 + riderY, '#42e0ff', true);
      p.hline(riderX - 4, 36 + riderY, 9, '#8c1933'); // 深红骑士腰带
      p.ellipse(riderX - 4, 28 + riderY, 3.0, 2.4, '#c78c20');
      p.ellipse(riderX - 4, 27.5 + riderY, 2.0, 1.5, '#ffe885');

      // 核心破除半人马铁证 ③：清晰跨坐于马鞍外侧的「弯曲黄金重铠腿 + 护膝 + 战靴踩鎏金马镫」！！
      // （独立使用 FRONT_ARM 高层级，在深蓝马衣外侧自动产生锐利 Sel-out 分离线，0.01 秒看清骑士整条腿！）
      p.setPart(SPRITE_PART.FRONT_ARM);
      // 镫革垂带（从马鞍垂到马镫）
      p.line(riderX + 1, 41 + by, riderX + 3, 52 + by, '#4d2612', 1);
      // 骑士臀甲与向前斜伸的大腿重铠（亮金高光在深蓝马衣上对比度爆表！）
      const hipRx = riderX + 1;
      const hipRy = 38 + riderY;
      const kneeRx = riderX + 6;
      const kneeRy = 44 + by;
      const ankleRx = riderX + 3;
      const ankleRy = 51 + by;
      p.line(hipRx, hipRy, kneeRx, kneeRy, '#b87d1c', 4);
      p.line(hipRx + 1, hipRy, kneeRx, kneeRy - 1, '#ffe473', 2);
      // 亮银闪光球形护膝甲
      p.ellipse(kneeRx, kneeRy, 2.2, 2.2, '#ffffff');
      p.px(kneeRx, kneeRy, '#ffe885');
      // 向后微屈的黄金胫甲小腿
      p.line(kneeRx, kneeRy + 1, ankleRx, ankleRy, '#b87d1c', 3);
      p.line(kneeRx, kneeRy + 1, ankleRx + 1, ankleRy, '#ffe880', 1);
      // 踩在鎏金马镫中的尖头骑士战靴！
      p.poly(
        [
          [ankleRx - 2, ankleRy],
          [ankleRx + 3, ankleRy],
          [ankleRx + 6, ankleRy + 2],
          [ankleRx + 5, ankleRy + 3],
          [ankleRx - 2, ankleRy + 3],
        ],
        '#8c5a14',
      );
      p.hline(ankleRx - 1, ankleRy + 1, 5, '#ffe885');
      // 清晰脚下金属马镫底环
      p.hline(ankleRx, ankleRy + 3, 5, '#dceeff');

      // 精雕棱角银金羽翼骑士全盔（尺寸精悍约 9×9，配飘扬苍蓝长羽翎！）
      p.setPart(SPRITE_PART.HEADWEAR);
      const hy = 20 + riderY;
      p.bezierRibbon([riderX - 2, hy - 5], [riderX - 12 + fl * 0.6, hy - 8], [Math.max(4, riderX - 17 + fl), hy - 2], 4.2, 1.2, '#2475e8', true);
      p.bezierRibbon([riderX - 2, hy - 5], [riderX - 11 + fl * 0.5, hy - 7], [Math.max(5, riderX - 15 + fl * 0.8), hy - 3], 1.9, 0.6, '#9ee8ff', true);
      p.poly(
        [
          [riderX - 4, hy - 3],
          [riderX - 1, hy - 5],
          [riderX + 4, hy - 4],
          [riderX + 6, hy],
          [riderX + 5, hy + 4],
          [riderX + 1, hy + 5],
          [riderX - 3, hy + 4],
        ],
        '#946014',
      );
      p.poly(
        [
          [riderX - 3, hy - 3],
          [riderX, hy - 4],
          [riderX + 3, hy - 3],
          [riderX + 5, hy],
          [riderX + 4, hy + 3],
          [riderX + 1, hy + 4],
          [riderX - 2, hy + 3],
        ],
        '#f5c749',
      );
      p.line(riderX - 1, hy - 4, riderX + 4, hy - 2, '#fff8cc', 1);
      // 幽蓝骑士目镜缝与面甲呼吸棱
      p.hline(riderX + 1, hy, 5, '#142245');
      p.hline(riderX + 2, hy, 4, '#66eeff', true);
      p.px(riderX + 3, hy, '#ffffff', true);
      p.vline(riderX + 3, hy + 1, 3, '#9e6514');
      // 盔侧雪白小羽翼饰
      p.poly([[riderX - 2, hy - 3], [riderX - 8, hy - 9], [riderX - 5, hy - 2], [riderX, hy - 4]], '#ffffff', true);
      p.line(riderX - 2, hy - 3, riderX - 7, hy - 8, '#9ee8ff', 1, true);

      // [9] 右臂金肩甲护手 + 裹苍蓝战旗的「御柱破魔骑士长枪」（腋下夹持斜举于马首上方净空，攻防皆极潇洒！）
      p.setPart(SPRITE_PART.FRONT_ARM);
      const thrust = isAtk && (f === 1 || f === 2) ? 6 : isAtk && f === 0 ? -3 : 0;
      const rHandX = riderX + 7 + Math.round(thrust * 0.45);
      const rHandY = isAtk && (f === 1 || f === 2) ? 33 + riderY : 32 + riderY;
      p.ellipse(riderX + 4, 28 + riderY, 2.8, 2.3, '#ffe066');
      p.line(riderX + 4, 29 + riderY, rHandX, rHandY, '#f2c144', 3);

      p.setPart(SPRITE_PART.WEAPON);
      if (isAtk && (f === 1 || f === 2)) {
        // 冲锋平举破阵突刺！长枪略微抬高于马眼上方，战旗向枪上方招展，完整露出神马俊颜！
        const tailX = Math.max(4, riderX - 8 + thrust);
        const tipX = 62;
        const spearY = 29 + riderY;
        p.line(tailX, spearY + 2, tipX - 10, spearY, '#8c5a1f', 3);
        p.line(tailX + 1, spearY + 1, tipX - 9, spearY - 1, '#ffe478', 1);
        p.ellipse(rHandX + 3, spearY + 1, 2.4, 3.2, '#ffe066');
        // 冲锋战旗向枪身上方猎猎飞扬（绝不挡白马眼眸！）
        p.poly([[bx + 17, spearY - 1], [bx + 25, spearY - 1], [bx + 15 + Math.round(fl * 0.3), spearY - 8]], '#2e82f2', true);
        p.px(bx + 20, spearY - 3, '#ffe885', true);
        p.poly([[tipX - 10, spearY - 4], [tipX, spearY], [tipX - 10, spearY + 4]], '#8cd8ff', true);
        p.line(tipX - 9, spearY, tipX, spearY, '#ffffff', 2, true);
        p.setPart(SPRITE_PART.GLOW_FX);
        p.bezierRibbon([tipX - 15, spearY - 9], [tipX - 4, spearY - 5], [tipX, spearY], 2.2, 0.7, '#66e6ff', true);
        p.bezierRibbon([tipX - 15, spearY + 9], [tipX - 4, spearY + 5], [tipX, spearY], 2.2, 0.7, '#ffe878', true);
      } else {
        // 威武斜擎御柱破魔圣枪（清晰越过天马耳顶之上，苍蓝鎏金战旗紧贴枪锋招展于右上净空，零碰马耳！）
        const tailX = riderX - 7 + thrust;
        const tailY = 39 + riderY;
        const tipX = Math.min(60, riderX + 36 + thrust);
        const tipY = Math.max(4, 7 + riderY);
        p.line(tailX, tailY, tipX - 6, tipY + 4, '#8c5a1f', 3);
        p.line(tailX + 1, tailY - 1, tipX - 5, tipY + 3, '#ffe478', 1);
        // 骑士长枪经典圆锥形鎏金护手盘（Vamplate）
        p.poly(
          [
            [rHandX + 1, rHandY - 4],
            [rHandX + 7, rHandY - 5],
            [rHandX + 4, rHandY + 1],
          ],
          '#ffe066',
        );
        // 苍蓝鎏金骑士三角战旗（紧凑挂于枪尖下方偏右，与白马耳顶留出干净 3~4px 净空！）
        p.poly(
          [
            [tipX - 11, tipY + 8],
            [tipX - 5, tipY + 4],
            [tipX - 9 + Math.round(fl * 0.35), tipY + 13 + Math.round(fl * 0.25)],
          ],
          '#2978eb',
          true,
        );
        p.line(tipX - 10, tipY + 8, tipX - 6, tipY + 5, '#ffe878', 1, true);
        p.px(tipX - 9, tipY + 9, '#fff8cc', true);
        // 璀璨星银长枪刃
        p.poly([[tipX - 8, tipY + 1], [tipX + 1, tipY - 2], [tipX - 4, tipY + 7]], '#b8ecff', true);
        p.line(tipX - 6, tipY + 3, tipX + 1, tipY - 2, '#ffffff', 1, true);
      }
      // 黄金铁手套握于枪柄前方
      p.setPart(SPRITE_PART.WEAPON);
      p.rect(rHandX - 1, rHandY - 1, 3, 3, '#ffe478');
      p.px(rHandX, rHandY - 1, '#ffffff');
    },
  },

  // =========================================================================
  // 8. 神使（T4-B · 1×2 终极飞行大天使 · 返魂苏生 + 施法：高挑炽光六翼大天使 · 铂银瀑布长发 + 真镂空星光金环 + 鎏金胸甲圣袍 + 锐锋天火圣剑 + 专属 4 帧六翼振翅飞行！）
  // =========================================================================
  creature_hakurei_seraph: {
    ...HD_BASE,
    backdropTop: '#0e1430',
    backdropBottom: '#261f4a',
    backdropGlow: '#fff0a6',
    avatarCrop: { x: 13, y: 2, size: 36 },
    portraitCrop: { x: 2, y: 1, w: 60, h: 68 },
    hdDraw: (p: HdPixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isMove = pose.state === 'move';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;

      const bx = isAtk && (f === 1 || f === 2) ? 25 : isMove ? 31 : Math.round(29 + pose.leanX * 0.85);
      const by = isMove
        ? [-2, 1, -1, -1][f % 4]
        : Math.round(Math.sin(phase) * 1.6 + pose.breathY * 1.1 - pose.stepLift);
      const sway = isMove ? 2.6 : pose.flutter * 1.6;
      // 飞行时六翼交替强劲大振幅振翅扑展！
      const mainFlap = isMove ? [-8, 10, 4, -5][f % 4] : Math.round(Math.sin(phase) * 2.8);
      const midFlap = isMove ? [-5, 8, 3, -3][f % 4] : Math.round(Math.cos(phase) * 2.3);
      // 1×2 高挑神使御姐比例（为头顶真镂空圣环留出充裕顶边呼吸感，零裁切！）
      const headY = 20 + by;

      // [1] 宏伟层次雕刻感「六翼炽光大天使羽翼」（加重天青/古金羽影对比，与雪白圣袍彻底拉出立体纵深！）
      p.setPart(SPRITE_PART.BACK_ACC);
      const upperColors = { deep: '#4c75bd', mid: '#c4e4ff', light: '#ffffff', tip: '#a6f2ff', gold: '#ffe680' };
      const midColors = { deep: '#9e7232', mid: '#f2d58f', light: '#fff7d4', tip: '#ffffff', gold: '#ffdf66' };
      const lowerColors = { deep: '#5570a8', mid: '#bdd6fa', light: '#edf6ff', tip: '#ffe885' };

      // 下翼（轻盈舒展）
      drawSeraphWingSide64(p, bx - 3, 42 + by, -1, 17, 10, -Math.round(midFlap * 0.6), lowerColors, false);
      drawSeraphWingSide64(p, bx + 3, 42 + by, 1, 13, 9, -Math.round(midFlap * 0.6), lowerColors, false);
      // 中翼（暖金珍珠华美主羽）
      drawSeraphWingSide64(p, bx - 4, 35 + by, -1, isMove ? 24 : 22, 14, midFlap, midColors, true);
      drawSeraphWingSide64(p, bx + 4, 35 + by, 1, isMove ? 19 : 17, 13, midFlap, midColors, true);
      // 上翼（最高耸宏大的洁白冰青圣羽！）
      drawSeraphWingSide64(p, bx - 4, 28 + by, -1, isMove ? 25 : 23, 18, mainFlap, upperColors, true);
      drawSeraphWingSide64(p, bx + 4, 28 + by, 1, isMove ? 20 : 18, 17, mainFlap, upperColors, true);

      // 飞行全力下拍帧（f === 1）：洒出金白圣羽微光风弧！
      if (isMove && f === 1) {
        p.setPart(SPRITE_PART.GLOW_FX);
        p.bezierRibbon([bx - 24, 35 + by], [bx - 26, 44 + by], [bx - 17, 50 + by], 1.8, 0.5, '#ffe880', true);
        p.bezierRibbon([bx + 19, 35 + by], [bx + 21, 43 + by], [bx + 14, 49 + by], 1.6, 0.5, '#9ef0ff', true);
        p.px(bx - 14, 53 + by, '#ffffff', true);
        p.px(bx + 12, 51 + by, '#ffe880', true);
      }

      // 飘逸天青鎏金「炽天使羽衣天带」
      p.setPart(SPRITE_PART.BACK_ACC);
      p.bezierRibbon([bx - 7, 35 + by], [bx - 18, 30 + by + sway], [Math.max(4, bx - 21), 41 + by + sway], 2.8, 1.1, '#47c8ff', true);
      p.bezierRibbon([bx - 7, 34 + by], [bx - 17, 29 + by + sway], [Math.max(5, bx - 20), 40 + by + sway], 1.1, 0.5, '#ffe885', true);
      p.bezierRibbon([bx + 7, 35 + by], [bx + 16, 30 + by - sway * 0.7], [Math.min(59, bx + 19), 40 + by - sway], 2.4, 1.0, '#47c8ff', true);
      p.bezierRibbon([bx + 7, 34 + by], [bx + 15, 29 + by - sway * 0.7], [Math.min(58, bx + 18), 39 + by - sway], 1.0, 0.5, '#ffe885', true);

      // [2] 瀑布般倾泻至脚踝的丝滑铂金银白长后发
      p.setPart(SPRITE_PART.BACK_HAIR);
      p.poly(
        [
          [bx - 10, headY],
          [bx + 9, headY],
          [bx + 11 - sway * 0.4, 52 + by],
          [bx + 5 - sway * 0.6, 59 + by],
          [bx - 10 + sway * 0.8, 60 + by],
          [bx - 14 + sway * 0.8, 50 + by],
        ],
        '#7e93bd',
      );
      p.poly(
        [
          [bx - 8, headY + 1],
          [bx + 7, headY + 1],
          [bx + 9 - sway * 0.3, 51 + by],
          [bx - 11 + sway * 0.6, 53 + by],
        ],
        '#e8f2ff',
      );
      p.bezierRibbon([bx - 8, headY + 6], [bx - 11 + sway * 0.5, 41 + by], [bx - 11 + sway * 0.8, 55 + by], 2.2, 0.8, '#ffffff');

      // [3] 1×2 悬空圣洁玉腿与修长 3/4 鎏金尖头圣靴（优雅斜错，飞行时微屈后收！）
      p.setPart(SPRITE_PART.LEGS);
      if (isMove) {
        p.line(bx - 4, 52 + by, bx - 8, 60 + by, '#ffe8dc', 3);
        p.poly([[bx - 10, 59 + by], [bx - 5, 59 + by], [bx - 4, 62 + by], [bx - 10, 62 + by]], '#c78c20');
        p.hline(bx - 9, 59 + by, 4, '#fff8cc');
        p.line(bx + 3, 52 + by, bx, 62 + by, '#fff4ed', 3);
        p.poly([[bx - 2, 61 + by], [bx + 3, 61 + by], [bx + 5, 64 + by], [bx - 2, 64 + by]], '#f2c449');
        p.hline(bx - 1, 61 + by, 4, '#ffffff');
      } else {
        const stride = Math.round(pose.stride * 2.8);
        p.rect(bx - 5 - stride, 51 + by, 3, 10, '#ecd3c7');
        p.poly([[bx - 6 - stride, 60 + by], [bx - 2 - stride, 60 + by], [bx - stride, 64 + by], [bx - 6 - stride, 64 + by]], '#bf851d');
        p.hline(bx - 5 - stride, 60 + by, 4, '#fff5b8');
        p.rect(bx + 2 + stride, 51 + by, 3, 11, '#fff2eb');
        p.poly([[bx + 2 + stride, 61 + by], [bx + 6 + stride, 61 + by], [bx + 8 + stride, 65 + by], [bx + 2 + stride, 65 + by]], '#f2c449');
        p.hline(bx + 3 + stride, 61 + by, 4, '#ffffff');
      }

      // [4] 左后臂：纯白鎏金飘逸羽袖 + 2px 娇美玉臂轻托圣洁复苏金球
      p.setPart(SPRITE_PART.BACK_ARM);
      drawPuffSleeve64(p, bx - 6.5, 32.5 + by, '#c7d9f2', '#ffffff', '#ffe066', 'left');
      drawSoftChibiArm64(p, bx - 8, 34 + by, bx - 14, 38 + by, '#fff6f0', '#e6b8a8');
      p.rect(bx - 16, 36 + by, 3, 2, '#fff6f0');
      p.setPart(SPRITE_PART.GLOW_FX);
      const healOrbY = 32 + by + Math.round(Math.sin(phase) * 1.6);
      p.ellipse(bx - 17, healOrbY, 2.8, 2.8, '#ffe066', true);
      p.ellipse(bx - 17, healOrbY - 0.5, 1.5, 1.5, '#ffffff', true);
      p.px(bx - 17, healOrbY - 4, '#9ef0ff', true);

      // [5] 圣洁高贵「纯白鎏金大天使曳地长礼袍」（柔美垂坠衣褶 + 中央宝蓝金纹圣带 + 鎏金下摆滚边！）
      p.setPart(SPRITE_PART.SKIRT);
      const skSway = Math.round(-pose.leanX * 0.45 + sway * 0.8);
      p.poly(
        [
          [bx - 6, 39 + by],
          [bx + 6, 39 + by],
          [bx + 13 + skSway, 58 + by],
          [bx + 7 + skSway, 56 + by],
          [bx + 2 + skSway, 48 + by],
          [bx - 1 + skSway, 60 + by],
          [bx - 13 + skSway, 61 + by],
          [bx - 16 + skSway, 56 + by],
        ],
        '#a8bddb',
      );
      p.poly(
        [
          [bx - 5, 39 + by],
          [bx + 5, 39 + by],
          [bx + 11 + skSway, 56 + by],
          [bx + 2 + skSway, 47 + by],
          [bx - 2 + skSway, 59 + by],
          [bx - 11 + skSway, 59 + by],
          [bx - 13 + skSway, 55 + by],
        ],
        '#f2f7ff',
      );
      p.poly(
        [
          [bx - 4, 40 + by],
          [bx + 3, 40 + by],
          [bx - 1 + skSway, 56 + by],
          [bx - 9 + skSway, 57 + by],
        ],
        '#ffffff',
      );
      p.bezierRibbon([bx - 3, 41 + by], [bx - 6 + skSway * 0.5, 50 + by], [bx - 9 + skSway, 58 + by], 1.6, 0.9, '#b8cde8');
      // 中央皇家天青鎏金圣纹垂带
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.poly(
        [
          [bx - 2, 39 + by],
          [bx + 3, 39 + by],
          [bx + 4 + skSway, 57 + by],
          [bx - 1 + skSway, 57 + by],
        ],
        '#2464cf',
      );
      p.vline(bx + 1 + Math.round(skSway * 0.5), 40 + by, 16, '#ffe880', true);
      p.line(bx - 15 + skSway, 56 + by, bx - 12 + skSway, 60 + by, '#d9a432', 1);
      p.line(bx - 12 + skSway, 60 + by, bx - 1 + skSway, 59 + by, '#ffe478', 1);
      p.line(bx + 2 + skSway, 48 + by, bx + 12 + skSway, 57 + by, '#f2c852', 1);

      // [6] 精雕黄金羽纹大天使胸甲 + 天青核心宝钻 + 黄金束腰
      p.setPart(SPRITE_PART.TORSO);
      p.poly([[bx - 5, 30 + by], [bx + 5, 30 + by], [bx + 6, 39 + by], [bx - 5, 39 + by]], '#bf841d');
      p.poly([[bx - 4, 30 + by], [bx + 4, 30 + by], [bx + 4, 38 + by], [bx - 4, 38 + by]], '#f7cb4d');
      p.hline(bx - 3, 31 + by, 7, '#fff6c2');
      p.setPart(SPRITE_PART.APRON_WAIST);
      p.hline(bx - 5, 39 + by, 11, '#ffe478');
      p.setPart(SPRITE_PART.GLOW_FX);
      p.ellipse(bx + 1, 34 + by, 2.0, 2.0, '#78eeff', true);
      p.px(bx + 1, 33 + by, '#ffffff', true);

      // [7] 圣洁绝美神使颜 + 苍穹蔚蓝 4×4 宝石大眼 + 铂银大集群萌发 + 黄金天使星冠 + 真镂空璀璨炽金圣环！
      drawKawaiiHead64(p, bx, headY, pose, {
        skinLight: '#ffffff',
        skinMain: '#fff2ea',
        skinShade: '#e3b8ad',
        lashColor: '#1f2347',
        irisDark: '#1b55c7',
        irisMid: '#4296ff',
        irisGlow: '#b5f5ff',
        blushColor: '#ff9cb8',
      });
      drawCleanAnimeHair64(p, bx, headY, {
        deep: '#788cb8',
        dark: '#acc0e3',
        mid: '#dce8ff',
        light: '#f5f9ff',
        spec: '#ffffff',
        leftLockLen: 14,
        rightLockLen: 12,
        fluff: 2,
        sway,
      });
      // 黄金天使星冠
      p.setPart(SPRITE_PART.HEADWEAR);
      p.hline(bx - 6, headY - 8, 12, '#f5c749', true);
      p.poly([[bx - 2, headY - 8], [bx, headY - 11], [bx + 2, headY - 8]], '#fff6c2', true);
      p.px(bx, headY - 9, '#8cf0ff', true);
      // 真·镂空璀璨炽金星芒圣环（与发冠留出清晰 2~3px 悬浮净空，环心 100% 透明！）
      p.setPart(SPRITE_PART.GLOW_FX);
      const haloY = Math.max(4, headY - 15);
      drawHollowGoldRing64(p, bx, haloY, 8.2, 2.0, 0.56, '#e6a825', '#ffe466', '#ffffff', true);
      p.px(bx - 9, haloY, '#9ef0ff', true);
      p.px(bx + 9, haloY, '#9ef0ff', true);

      // [8] 右前臂白金羽袖 + 2px 纤长玉臂高擎「锐锋白金天火大天使圣剑」（精雕收尖双刃剑脊 + 跃动炽焰舌，告别橘色冰棒！）
      p.setPart(SPRITE_PART.FRONT_ARM);
      drawPuffSleeve64(p, bx + 6.5, 32.5 + by, '#c7d9f2', '#ffffff', '#ffe066', 'right');

      if (isAtk && f === 0) {
        // 蓄力高举锐锋天火圣剑引落炽光！
        const handX = bx + 11;
        const handY = 27 + by;
        drawSoftChibiArm64(p, bx + 8, 34 + by, handX, handY, '#fff2ea', '#e3b8ad');
        p.setPart(SPRITE_PART.WEAPON);
        p.vline(handX, handY + 1, 5, '#b87d1a');
        p.poly([[handX - 5, handY - 3], [handX, handY - 1], [handX + 6, handY - 3], [handX + 4, handY], [handX - 3, handY]], '#ffe678', true);
        // 锐利收尖天火大剑刃
        const tipX = handX + 2;
        const tipY = 5 + by;
        p.poly([[handX - 2, handY - 2], [handX + 3, handY - 2], [tipX + 2, tipY + 6], [tipX, tipY], [tipX - 2, tipY + 6]], '#ff7b24', true);
        p.poly([[handX - 1, handY - 2], [handX + 2, handY - 2], [tipX + 1, tipY + 5], [tipX, tipY + 1], [tipX - 1, tipY + 5]], '#ffe878', true);
        p.line(handX, handY - 2, tipX, tipY + 1, '#ffffff', 1, true);
        drawWrappedHand(p, handX, handY, '#fff2ea', '#ffffff', '#e3b8ad');
      } else if (isAtk && (f === 1 || f === 2)) {
        // 炽光天火大满月重斩！
        const handX = bx + 13;
        const handY = 36 + by;
        drawSoftChibiArm64(p, bx + 8, 35 + by, handX, handY, '#fff2ea', '#e3b8ad');
        p.setPart(SPRITE_PART.WEAPON);
        const tipX = Math.min(60, handX + 20);
        const tipY = handY - 5;
        p.line(handX - 4, handY + 1, handX, handY, '#b87d1a', 2);
        p.vline(handX + 2, handY - 5, 10, '#ffe880', true);
        p.poly(
          [
            [handX + 2, handY - 3],
            [tipX - 5, tipY - 1],
            [tipX, tipY],
            [tipX - 5, tipY + 3],
            [handX + 2, handY + 3],
          ],
          '#ff7721',
          true,
        );
        p.poly(
          [
            [handX + 3, handY - 2],
            [tipX - 4, tipY],
            [tipX, tipY],
            [tipX - 4, tipY + 2],
            [handX + 3, handY + 2],
          ],
          '#ffe878',
          true,
        );
        p.line(handX + 3, handY, tipX, tipY, '#ffffff', 1, true);
        drawWrappedHand(p, handX, handY, '#fff2ea', '#ffffff', '#e3b8ad');
        drawSlashArc64(p, bx + 16, 34 + by, 21, 20, -1.25, 0.95, '#ff7b24', '#ffe878', '#ffffff');
      } else {
        // 圣威凛凛斜擎锐利收尖「白金天火大天使圣剑」（精雕收尖剑身 + 跃动火焰舌 + 展翼金护手！）
        const handX = bx + 12;
        const handY = 38 + by - Math.round(pose.armAction * 2);
        drawSoftChibiArm64(p, bx + 8, 35 + by, handX, handY, '#fff2ea', '#e3b8ad');
        p.setPart(SPRITE_PART.WEAPON);
        // 圣剑金柄与展开的天使双翼剑格
        p.line(handX - 1, handY + 6, handX + 1, handY - 1, '#b87d1a', 2);
        p.ellipse(handX - 1, handY + 7, 1.6, 1.6, '#ffe885', true);
        p.poly(
          [
            [handX - 5, handY - 4],
            [handX + 1, handY - 1],
            [handX + 8, handY - 4],
            [handX + 5, handY],
            [handX - 2, handY],
          ],
          '#e6ab2e',
        );
        p.line(handX - 4, handY - 3, handX + 1, handY - 1, '#fff8cc', 1, true);
        p.line(handX + 1, handY - 1, handX + 7, handY - 3, '#fff8cc', 1, true);
        p.px(handX + 1, handY - 1, '#78eeff', true);
        // 锐利棱面收尖大剑刃（剑根宽、剑尖锋利收尖，带炽橙火舌缠绕边缘！）
        const tipX = Math.min(58, handX + 6);
        const tipY = Math.max(7, handY - 27);
        // 剑身两侧跳跃的炽橙天火火舌
        p.setPart(SPRITE_PART.GLOW_FX);
        const flWave = Math.round(Math.sin(phase * 2) * 1.2);
        p.poly([[handX, handY - 6], [handX - 2, handY - 13 + flWave], [handX + 2, handY - 15]], '#ff661a', true);
        p.poly([[handX + 4, handY - 9], [handX + 8, handY - 16 - flWave], [handX + 5, handY - 21]], '#ff7b24', true);
        p.px(tipX + 2, tipY + 4 + flWave, '#ffe880', true);
        p.px(tipX - 3, tipY + 9 - flWave, '#9ef0ff', true);
        // 主剑刃：锋利菱形收尖白金圣剑体
        p.setPart(SPRITE_PART.WEAPON);
        p.poly(
          [
            [handX - 1, handY - 2],
            [handX + 4, handY - 2],
            [tipX + 2, tipY + 7],
            [tipX, tipY],
            [tipX - 2, tipY + 7],
          ],
          '#ff8c2b',
          true,
        );
        p.poly(
          [
            [handX, handY - 2],
            [handX + 3, handY - 2],
            [tipX + 1, tipY + 6],
            [tipX, tipY + 1],
            [tipX - 1, tipY + 6],
          ],
          '#fff099',
          true,
        );
        p.line(handX + 1, handY - 2, tipX, tipY + 1, '#ffffff', 1, true);
        drawWrappedHand(p, handX, handY, '#fff2ea', '#ffffff', '#e3b8ad');
      }
    },
  },
};

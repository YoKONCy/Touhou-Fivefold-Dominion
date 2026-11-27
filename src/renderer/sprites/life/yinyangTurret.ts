/**
 * 4. 阴阳浮游炮（T2-B · 飞行精准器灵）64×72 HD 像素精灵绘谱
 * 数学精确立体琉璃阴阳玉 + 雕花古金八卦结界环 + 纸垂流苏 + 四枚 3D 公转赤金棱镜浮游炮！
 */

import { SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawGlossyTaijiOrb64, drawShideTassel64, HD_BASE } from './helpers';

export const creatureYinyangTurretSpec: SpriteRigSpec = {
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
};

/**
 * 1. 博丽毛玉（T1-A · 符箓定身 + 无限反击）64×72 HD 像素精灵绘谱
 * 高弹性蓬松云朵绒毛团 + 立体琉璃阴阳玉核 + 神社朱红结绳纸垂 + 双灵火
 */

import {
  drawSlashArc64,
  SPRITE_PART,
  type HdPixelPainter,
} from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawGlossyTaijiOrb64, HD_BASE } from './helpers';

export const creatureKedamaSpec: SpriteRigSpec = {
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
};

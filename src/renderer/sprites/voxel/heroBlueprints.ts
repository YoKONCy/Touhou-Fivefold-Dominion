/**
 * 内置基础英雄角色 48×54 骨骼解构多态动画绘谱（博丽灵梦、雾雨魔理沙）
 */

import { drawChibiFaceEyes } from './painter';
import type { SpriteRigSpec } from './types';

/** 基础英雄角色骨骼绘谱表 */
export const HERO_RIG_SPECS: Record<'hero_reimu' | 'hero_marisa', SpriteRigSpec> = {
  /** 1. 博丽灵梦：精雕秀气三头身巫女立绘 + 立体双飘带博丽大蝴蝶结 + 分体宽振袖与锯齿大御币 + 环绕双色灵力勾玉！ */
  hero_reimu: {
    backdropTop: '#161029',
    backdropBottom: '#33162e',
    backdropGlow: '#ff5274',
    avatarCrop: { x: 10, y: 4, size: 28 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p, pose) => {
      const isAtk = pose.state === 'attack';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      // 攻击爆发时略微左收基准位，保证大御币挥斩光弧与双勾玉完整落于画布内零裁切
      const bx = isAtk && (f === 1 || f === 2)
        ? 21
        : isAtk && f === 0
          ? 20
          : Math.round(23 + pose.leanX * 0.75);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const legStride = Math.round(pose.stride * 3.8);

      // 辅助绘制精雕 C 形东方「灵力勾玉（曲玉）」：7×7 清晰丰满的圆润玉首 + 灵孔 + 优雅弯月钩尾（极高辨识度！）
      const drawMagatama = (
        cx: number,
        cy: number,
        bodyDark: string,
        bodyMain: string,
        bodyHigh: string,
        holeColor: string,
        flipTail: 1 | -1,
      ) => {
        // 圆润饱满玉首（上端）
        p.ellipse(cx, cy - 1.6, 2.6, 2.4, bodyDark, true);
        p.ellipse(cx, cy - 1.9, 2.0, 1.8, bodyMain, true);
        p.px(cx - 1, cy - 2, bodyHigh, true);
        p.px(cx, cy - 3, bodyHigh, true);
        // 优雅回勾的 C 形曲玉尾弧（中段渐细，尾尖微翘！）
        p.rect(cx + 1 * flipTail, cy, 2, 2, bodyDark, true);
        p.px(cx + 2 * flipTail, cy + 1, bodyMain, true);
        p.px(cx + 1 * flipTail, cy + 1, bodyMain, true);
        p.px(cx + 2 * flipTail, cy + 2, bodyDark, true);
        p.px(cx + 1 * flipTail, cy + 2, bodyMain, true);
        p.px(cx, cy + 3, bodyDark, true);
        p.px(cx, cy + 2, bodyMain, true);
        p.px(cx - 1 * flipTail, cy + 3, bodyMain, true);
        p.px(cx - 2 * flipTail, cy + 2, bodyHigh, true);
        // 玉首中央晶亮灵孔
        p.px(cx, cy - 1, holeColor, true);
      };

      // [部件 1] 后景轻盈随风飘散的「博丽大红蝴蝶结」（精致立体褶皱 + 白滚边 + 灵动收拢垂带，留足勾玉净空！）
      const headY = 19 + by;
      const bowY = headY - 7;
      // 飘逸轻盈双垂带（贴近肩后收拢，绝不与外侧勾玉重叠！）
      p.poly([
        [bx - 7, bowY + 3],
        [bx - 5, bowY + 3],
        [bx - 8 + Math.round(sway * 0.6), bowY + 10],
        [bx - 10 + Math.round(sway * 0.6), bowY + 9],
      ], '#9c1732');
      p.line(bx - 6, bowY + 4, bx - 9 + Math.round(sway * 0.6), bowY + 9, '#e63956', 1);
      p.poly([
        [bx + 5, bowY + 3],
        [bx + 7, bowY + 3],
        [bx + 10 - Math.round(sway * 0.6), bowY + 9],
        [bx + 8 - Math.round(sway * 0.6), bowY + 10],
      ], '#b51e3c');
      p.line(bx + 6, bowY + 4, bx + 9 - Math.round(sway * 0.6), bowY + 9, '#ff5c78', 1);

      // 立体左结耳（优雅收腰蝶翼形）
      p.poly([
        [bx - 10, bowY - 2 + Math.round(sway * 0.5)],
        [bx - 2, bowY + 1],
        [bx - 2, bowY + 4],
        [bx - 11, bowY + 4 + Math.round(sway * 0.5)],
      ], '#b51b38');
      p.poly([
        [bx - 9, bowY - 1 + Math.round(sway * 0.5)],
        [bx - 3, bowY + 1],
        [bx - 9, bowY + 3 + Math.round(sway * 0.5)],
      ], '#f03e5c');
      p.hline(bx - 9, bowY - 1 + Math.round(sway * 0.5), 4, '#ff8599');
      p.vline(bx - 10, bowY - 1 + Math.round(sway * 0.5), 4, '#fff5eb');

      // 立体右结耳
      p.poly([
        [bx + 10, bowY - 2 - Math.round(sway * 0.5)],
        [bx + 2, bowY + 1],
        [bx + 2, bowY + 4],
        [bx + 11, bowY + 4 - Math.round(sway * 0.5)],
      ], '#cc2142');
      p.poly([
        [bx + 9, bowY - 1 - Math.round(sway * 0.5)],
        [bx + 3, bowY + 1],
        [bx + 9, bowY + 3 - Math.round(sway * 0.5)],
      ], '#ff4f6d');
      p.hline(bx + 5, bowY - 1 - Math.round(sway * 0.5), 4, '#ff9eb0');
      p.vline(bx + 10, bowY - 1 - Math.round(sway * 0.5), 4, '#fff5eb');

      // [部件 2] 柔顺分缕后垂乌黑长发（自然收腰飘尾，绝非方块黑板！）
      p.poly([
        [bx - 6, headY],
        [bx + 6, headY],
        [bx + 8 - sway, 31 + by],
        [bx + 4 - sway, 34 + by],
        [bx - 4 + sway, 34 + by],
        [bx - 8 + sway, 31 + by],
      ], '#1b1226');
      p.poly([
        [bx - 5, headY + 1],
        [bx + 5, headY + 1],
        [bx + 6 - sway, 30 + by],
        [bx - 6 + sway, 30 + by],
      ], '#2b1d3b');
      p.vline(bx - 4, headY + 3, 9, '#483263');
      p.vline(bx + 4, headY + 3, 8, '#3b2852');

      // [部件 3] 独立迈步白足袋与朱红系带草履
      const backLegX = bx - 4 - legStride;
      const frontLegX = bx + 2 + legStride;
      const backLegLift = pose.stride > 0.3 ? -2 : 0;
      const frontLegLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(backLegX, 42 + backLegLift, 3, 5, '#dfd4ca');
      p.vline(backLegX + 1, 42 + backLegLift, 4, '#f5eee6');
      p.rect(backLegX - 1, 47 + backLegLift, 4, 2, '#991b34');
      p.px(backLegX + 1, 47 + backLegLift, '#fff3e6');
      p.rect(frontLegX, 42 + frontLegLift, 3, 5, '#f5efe8');
      p.vline(frontLegX + 1, 42 + frontLegLift, 4, '#ffffff');
      p.rect(frontLegX, 47 + frontLegLift, 4, 2, '#d42646');
      p.px(frontLegX + 2, 47 + frontLegLift, '#fff3e6');

      // [部件 4] 左手飘逸分体式红白宽振袖（后臂）
      const backArmSwing = isAtk && f === 1 ? -4 : isHit ? -2 : Math.round(-pose.armAction * 3 - pose.stride * 2);
      p.poly([
        [bx - 5, 27 + by],
        [bx - 10 + backArmSwing, 30 + by],
        [bx - 12 + backArmSwing, 37 + by],
        [bx - 6 + Math.round(backArmSwing * 0.4), 36 + by],
      ], '#ebe2d8');
      p.poly([
        [bx - 5, 27 + by],
        [bx - 8 + backArmSwing, 29 + by],
        [bx - 8 + backArmSwing, 33 + by],
        [bx - 5, 32 + by],
      ], '#d42646'); // 标志性分体露肩红袖上缘
      p.hline(bx - 12 + backArmSwing, 36 + by, 6, '#e63250');
      p.rect(bx - 10 + backArmSwing, 37 + by, 2, 2, '#ffe6d4');

      // [部件 5] 华丽百褶朱红巫女长裙 + 逐像素精致白蕾丝波浪衬裙底边
      const skirtSkew = Math.round(-pose.leanX * 0.5 + sway * 0.6);
      p.poly([
        [bx - 5, 33 + by],
        [bx + 5, 33 + by],
        [bx + 11 + skirtSkew, 44 + by],
        [bx - 10 + skirtSkew, 44 + by],
      ], '#9c1832');
      p.poly([
        [bx - 4, 33 + by],
        [bx + 4, 33 + by],
        [bx + 9 + skirtSkew, 43 + by],
        [bx - 8 + skirtSkew, 43 + by],
      ], '#d92948');
      // 精致立体裙褶光影
      p.vline(bx - 5, 35 + by, 7, '#b51d3a');
      p.vline(bx - 2, 34 + by, 8, '#ff617b');
      p.vline(bx + 2, 34 + by, 8, '#ff5470');
      p.vline(bx + 5, 35 + by, 7, '#8c142c');
      // 逐像素波浪白衬裙蕾丝下摆
      for (let x = bx - 10 + skirtSkew; x <= bx + 10 + skirtSkew; x++) {
        p.px(x, 44 + by, '#fff8f0');
        if ((x - bx) % 2 === 0) p.px(x, 45 + by, '#f0dcd5');
      }

      // [部件 6] 修身洁白巫女上衣 + 鲜红交领与立体胸口大蝴蝶结 + 金边腰带
      p.poly([
        [bx - 4, 25 + by],
        [bx + 4, 25 + by],
        [bx + 5, 33 + by],
        [bx - 5, 33 + by],
      ], '#f2eae0');
      p.rect(bx - 3, 26 + by, 5, 6, '#ffffff');
      // 绯红交领
      p.line(bx - 3, 25 + by, bx, 28 + by, '#d92948', 1);
      p.line(bx + 3, 25 + by, bx, 28 + by, '#f03e5c', 1);
      // 胸口精致红领结 + 鎏金胸铃点缀
      p.rect(bx - 2, 27 + by, 5, 2, '#e62e4f');
      p.px(bx, 28 + by, '#ffe478', true);
      p.px(bx - 1, 29 + by, '#ff6e87');
      p.px(bx + 1, 29 + by, '#c91f3d');
      // 绯红束腰带 + 纤细金缘
      p.hline(bx - 5, 33 + by, 10, '#a61934');
      p.hline(bx - 4, 32 + by, 8, '#ffe073');
      p.px(bx, 33 + by, '#ff6e87');

      // [部件 7] 精致秀气三头身少女头部 + 水润赤红大瞳 + 圆润流线发冠与分缕刘海 + 红白双发筒！
      p.rect(bx - 1, headY + 4, 3, 3, '#e0ac92'); // 秀气细颈
      p.ellipse(bx, headY, 5.2, 4.9, '#ffe9d9');
      p.hline(bx - 3, headY + 4, 7, '#ebb99d');
      p.px(bx - 4, headY + 3, '#f2c5aa');
      p.px(bx + 4, headY + 3, '#f2c5aa');
      drawChibiFaceEyes(p, bx + 1, headY, '#a61836', '#ff7a92', pose);
      // 柔顺圆弧乌黑发冠（彻底替代方盒锅盖头！）
      p.ellipse(bx, headY - 4.4, 6.0, 3.4, '#1f142b');
      p.ellipse(bx, headY - 4.8, 5.0, 2.5, '#312145');
      p.hline(bx - 4, headY - 6, 8, '#5a407a');
      p.hline(bx - 2, headY - 7, 4, '#9a80ba');
      // 轻盈自然分缕刘海（绝不遮眼、柔化额头！）
      p.px(bx - 5, headY - 2, '#1f142b');
      p.px(bx - 3, headY - 2, '#312145');
      p.px(bx, headY - 2, '#1f142b');
      p.px(bx + 3, headY - 2, '#312145');
      p.px(bx + 5, headY - 2, '#1f142b');
      // 贴颊轻盈双鬓 + 标志性红白发筒（纤细清雅，绝不厚重夹脸！）
      p.vline(bx - 6, headY - 2, 10, '#241733');
      p.vline(bx - 5, headY - 1, 7, '#3b2852');
      p.vline(bx + 5, headY - 2, 10, '#241733');
      p.vline(bx + 6, headY - 1, 7, '#3b2852');
      // 红白发管结
      p.rect(bx - 6, headY + 3, 2, 2, '#e63250');
      p.hline(bx - 6, headY + 2, 2, '#ffffff');
      p.hline(bx - 6, headY + 5, 2, '#ffffff');
      p.rect(bx + 5, headY + 3, 2, 2, '#e63250');
      p.hline(bx + 5, headY + 2, 2, '#ffffff');
      p.hline(bx + 5, headY + 5, 2, '#ffffff');
      // 蝴蝶结中心结扣（稳坐发冠后上方，不压扁发顶圆弧）
      p.rect(bx - 1, bowY, 3, 2, '#d92948');
      p.px(bx, bowY, '#ff8599');

      // [部件 8] 前臂飘逸振袖 + 精雕长柄「博丽大御币」（带多层 Z 字锯齿雪白纸垂 + 绝不挡脸！）
      const shX = bx + 4;
      const shY = 27 + by;
      let handX = bx + 9;
      let handY = 30 + by;
      let tipX = bx + 14;
      let tipY = 16 + by;

      if (isAtk && f === 0) {
        // 蓄力帧：优雅向右上方高举大御币，完全避开脸部！
        handX = bx + 9;
        handY = 22 + by;
        tipX = bx + 12;
        tipY = 7 + by;
      } else if (isAtk && f === 1) {
        // 挥斩帧 1：向前大弧横扫，放出朱金破魔新月光弧！
        handX = bx + 11;
        handY = 29 + by;
        tipX = bx + 20;
        tipY = 32 + by;
      } else if (isAtk && f === 2) {
        // 挥斩帧 2：御币上扬余韵收势
        handX = bx + 10;
        handY = 26 + by;
        tipX = bx + 18;
        tipY = 20 + by;
      } else if (isHit) {
        handX = bx + 8;
        handY = 29 + by;
        tipX = bx + 14;
        tipY = 17 + by;
      } else {
        handX = bx + 8 + Math.round(pose.stride * 1.6);
        handY = 30 + by - Math.round(pose.armAction * 2);
        tipX = handX + 5;
        tipY = handY - 13;
      }

      // 分体露肩红白前振袖 + 手掌
      p.poly([
        [shX, shY - 1],
        [handX, handY - 2],
        [handX - 1, handY + 5],
        [shX - 1, shY + 5],
      ], '#faf5ed');
      p.poly([
        [shX, shY - 1],
        [shX + 3, shY],
        [shX + 3, shY + 3],
        [shX, shY + 3],
      ], '#e63250');
      p.line(shX - 1, shY + 5, handX - 1, handY + 5, '#e63553', 1);
      p.rect(handX - 1, handY - 1, 2, 2, '#ffe6d4');

      // 博丽大御币朱木长柄 + 金箍
      p.line(
        Math.round(handX - (tipX - handX) * 0.25),
        Math.round(handY - (tipY - handY) * 0.25),
        tipX,
        tipY,
        '#9c6533',
        2,
      );
      p.line(handX, handY, tipX, tipY, '#d99e5b', 1);
      p.px(tipX, tipY, '#ffe073', true);
      // 标志性多层 Z 字锯齿雪白纸垂（しで，彻底取代白馒头！）
      const shideX = tipX;
      const shideY = tipY;
      p.rect(shideX, shideY + 1, 3, 2, '#ffffff', true);
      p.rect(shideX + 2, shideY + 3, 3, 2, '#fff5e6', true);
      p.rect(shideX + 1 + Math.round(sway * 0.5), shideY + 5, 3, 2, '#ffffff', true);
      p.rect(shideX + 3 + Math.round(sway * 0.5), shideY + 7, 2, 2, '#ffe6e6', true);
      p.rect(shideX - 2, shideY + 2, 2, 2, '#fff5e6', true);
      p.rect(shideX - 3, shideY + 4, 2, 2, '#ffffff', true);

      // [部件 9] 环绕博丽灵梦的「博丽双灵力勾玉（曲玉）」——独立净空展示！朱红阳勾玉 + 神社翡翠阴勾玉！
      const orb1X = isAtk && f === 1
        ? bx + 16
        : isAtk && f === 2
          ? bx + 19
          : Math.round(bx - 16 + Math.sin(phase) * 1.5);
      const orb1Y = isAtk && f === 0
        ? 16 + by
        : isAtk && f === 1
          ? 20 + by
          : Math.round(25 + by + Math.cos(phase) * 2.2);
      // 1 号主勾玉：朱红鎏金阳勾玉（悬于左侧净空，彻底避开飘带！）
      drawMagatama(orb1X, orb1Y, '#b51635', '#ff3b5c', '#fff2bd', '#fff8d6', 1);

      // 2 号副勾玉：八尺琼翡翠玉勾玉（悬于右下方净空，与左红勾玉遥相对称，待机与攻防皆极高辨识度！）
      const orb2X = isAtk && f === 1
        ? bx + 18
        : isAtk && f === 2
          ? bx + 16
          : Math.round(bx + 16 - Math.sin(phase) * 1.5);
      const orb2Y = isAtk && f === 0
        ? 35 + by
        : isAtk && f === 1
          ? 37 + by
          : Math.round(37 + by - Math.cos(phase) * 2.0);
      drawMagatama(orb2X, orb2Y, '#14876c', '#45e6b8', '#e6fff8', '#fff8d6', -1);

      // [部件 10] 挥击瞬间流畅连续的「朱金梦想封印结界弧光」（严格留在 x<=45 零裁切！）
      if (isAtk && (f === 1 || f === 2)) {
        const arcCx = bx + 9;
        const arcCy = 26 + by;
        const segs = 11;
        for (let i = 0; i < segs; i++) {
          const a0 = -1.15 + (i / segs) * 2.1;
          const a1 = -1.15 + ((i + 1) / segs) * 2.1;
          const ox0 = Math.round(arcCx + Math.cos(a0) * 14);
          const oy0 = Math.round(arcCy + Math.sin(a0) * 14);
          const ox1 = Math.round(arcCx + Math.cos(a1) * 14);
          const oy1 = Math.round(arcCy + Math.sin(a1) * 14);
          const ix0 = Math.round(arcCx + Math.cos(a0) * 12);
          const iy0 = Math.round(arcCy + Math.sin(a0) * 12);
          const ix1 = Math.round(arcCx + Math.cos(a1) * 12);
          const iy1 = Math.round(arcCy + Math.sin(a1) * 12);
          p.line(ox0, oy0, ox1, oy1, f === 1 ? '#ff3b60' : '#ff85a0', i >= 3 && i <= 8 ? 2 : 1, true);
          p.line(ix0, iy0, ix1, iy1, i >= 3 && i <= 8 ? '#fff6c2' : '#ffe073', 1, true);
        }
        p.px(bx + 22, 16 + by, '#ffffff', true);
        p.px(bx + 23, 34 + by, '#ffe885', true);
      }
    },
  },

  /** 2. 雾雨魔理沙：精雕俏丽金发麻花辫大魔女帽立绘 + 蕾丝围裙黑马甲 + 斜背扫帚 + 独立浮空精雕正八边形「迷你八卦炉」！ */
  hero_marisa: {
    backdropTop: '#0d1026',
    backdropBottom: '#2b1e3d',
    backdropGlow: '#f6c945',
    avatarCrop: { x: 9, y: 3, size: 29 },
    portraitCrop: { x: 2, y: 2, w: 44, h: 48 },
    draw: (p, pose) => {
      const isAtk = pose.state === 'attack';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      const phase = pose.phase * Math.PI * 2;
      // 攻击发射极限火花时左收基点，给精雕八卦炉与炽烈星炮留足充裕空间！
      const bx = isAtk && (f === 1 || f === 2)
        ? 19
        : isAtk && f === 0
          ? 20
          : Math.round(21 + pose.leanX * 0.75);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.3);
      const legStride = Math.round(pose.stride * 4.0);

      // [部件 1] 背后斜背的「魔法飞天扫帚」（胡桃木柄 + 金丝扎带 + 蓬松扫帚穗，极佳魔法使平衡剪影！）
      const broomShift = isAtk && f === 1 ? -2 : 0;
      p.line(bx - 13 + broomShift, 42 + by, bx + 4, 21 + by, '#6e4526', 2);
      p.line(bx - 12 + broomShift, 41 + by, bx + 3, 22 + by, '#a8703e', 1);
      // 蓬松扫帚尾穗（左下方）
      p.poly([
        [bx - 11 + broomShift, 38 + by],
        [bx - 17 + broomShift + Math.round(sway * 0.5), 42 + by],
        [bx - 14 + broomShift + Math.round(sway * 0.5), 46 + by],
        [bx - 9 + broomShift, 41 + by],
      ], '#a87324');
      p.poly([
        [bx - 11 + broomShift, 39 + by],
        [bx - 16 + broomShift + Math.round(sway * 0.5), 42 + by],
        [bx - 13 + broomShift + Math.round(sway * 0.5), 45 + by],
        [bx - 10 + broomShift, 41 + by],
      ], '#e6b245');
      p.line(bx - 11 + broomShift, 39 + by, bx - 9 + broomShift, 41 + by, '#ffe885', 1); // 金丝箍

      // [部件 2] 柔顺分缕后垂阳光金长发（修身贴背微飘，给右侧八卦炉留出纯净负空间！）
      p.poly([
        [bx - 6, 20 + by],
        [bx + 5, 20 + by],
        [bx + 6 - Math.round(sway * 0.6), 31 + by],
        [bx + 3 - Math.round(sway * 0.6), 34 + by],
        [bx - 5 + sway, 35 + by],
        [bx - 8 + sway, 32 + by],
      ], '#b57b1b');
      p.poly([
        [bx - 5, 21 + by],
        [bx + 4, 21 + by],
        [bx + 5 - Math.round(sway * 0.5), 30 + by],
        [bx - 6 + sway, 31 + by],
      ], '#f0bf3e');
      p.vline(bx - 5, 22 + by, 8, '#ffe885');
      p.vline(bx + 3, 22 + by, 7, '#ffd452');

      // [部件 3] 独立迈步白短袜与精巧黑皮金扣短靴
      const backLegX = bx - 4 - legStride;
      const frontLegX = bx + 2 + legStride;
      const backLegLift = pose.stride > 0.3 ? -2 : 0;
      const frontLegLift = pose.stride < -0.3 ? -2 : 0;
      p.rect(backLegX, 42 + backLegLift, 3, 2, '#f0ebe4');
      p.rect(backLegX, 44 + backLegLift, 3, 4, '#1b1f33');
      p.hline(backLegX - 1, 47 + backLegLift, 4, '#2f3757');
      p.rect(frontLegX, 42 + frontLegLift, 3, 2, '#ffffff');
      p.rect(frontLegX, 44 + frontLegLift, 3, 4, '#242a45');
      p.hline(frontLegX, 47 + frontLegLift, 4, '#485482');
      p.px(frontLegX + 1, 45 + frontLegLift, '#ffd859');

      // [部件 4] 左手蓬松白泡泡袖（蓄力时弯曲手肘帅气轻压宽帽檐外缘，绝不贴脸！）
      if (isAtk && f === 0) {
        p.ellipse(bx - 6, 27 + by, 2.2, 2.2, '#f5f2eb');
        p.line(bx - 7, 27 + by, bx - 11, 22 + by, '#f5f2eb', 2);
        p.line(bx - 11, 22 + by, bx - 10, 16 + by, '#ffffff', 2);
        p.rect(bx - 11, 15 + by, 2, 2, '#ffe6d4');
      } else {
        const armBack = isHit ? -2 : Math.round(-pose.stride * 1.8);
        p.ellipse(bx - 6, 28 + by, 2.3, 2.3, '#f7f3eb');
        p.line(bx - 6, 29 + by, bx - 9 + armBack, 33 + by, '#ece6dc', 2);
        p.rect(bx - 9 + armBack, 33 + by, 2, 2, '#ffe6d4');
      }

      // [部件 5] 华丽黑白荷叶边魔女长裙 + 逐像素纯白蕾丝围裙与裙摆波浪花边
      const skirtSkew = Math.round(-pose.leanX * 0.5 + sway * 0.6);
      p.poly([
        [bx - 5, 33 + by],
        [bx + 5, 33 + by],
        [bx + 11 + skirtSkew, 43 + by],
        [bx - 10 + skirtSkew, 43 + by],
      ], '#16192b');
      p.poly([
        [bx - 4, 33 + by],
        [bx + 4, 33 + by],
        [bx + 9 + skirtSkew, 42 + by],
        [bx - 8 + skirtSkew, 42 + by],
      ], '#28304f');
      // 立体裙褶反光
      p.vline(bx - 5, 35 + by, 6, '#3e4a78');
      p.vline(bx + 5, 35 + by, 6, '#1b2038');
      // 标志性纯白荷叶围裙
      p.poly([
        [bx - 3, 33 + by],
        [bx + 4, 33 + by],
        [bx + 5 + skirtSkew, 41 + by],
        [bx - 4 + skirtSkew, 41 + by],
      ], '#f5f2eb');
      p.rect(bx - 2, 34 + by, 5, 6, '#ffffff');
      p.hline(bx - 4 + skirtSkew, 41 + by, 9, '#d9d4cc');
      // 逐像素精致纯白蕾丝裙摆花边
      for (let x = bx - 10 + skirtSkew; x <= bx + 10 + skirtSkew; x++) {
        p.px(x, 43 + by, '#ffffff');
        if ((x - bx) % 2 === 0) p.px(x, 44 + by, '#d6deed');
      }

      // [部件 6] 修身黑绒小马甲 + 白蕾丝领口 + 双排闪亮金扣 + 精致胸前金麻花辫！
      p.rect(bx - 4, 26 + by, 9, 7, '#1f253d');
      p.rect(bx - 3, 26 + by, 6, 6, '#2b3354');
      // 洁白翻领 + 金色小丝带结
      p.hline(bx - 3, 26 + by, 7, '#ffffff');
      p.rect(bx - 1, 27 + by, 3, 1, '#ffd859');
      // 双排鎏金纽扣
      p.px(bx - 2, 29 + by, '#ffe478');
      p.px(bx + 2, 29 + by, '#ffe478');
      p.px(bx - 2, 31 + by, '#ffe478');
      p.px(bx + 2, 31 + by, '#ffe478');
      p.hline(bx - 5, 33 + by, 10, '#f5f2eb'); // 围裙白腰带

      // 左胸前标志性立体编织麻花辫（细腻交叉纹路 + 白色蝶结扎尾！）
      const braidX = bx - 6 + Math.round(sway * 0.4);
      p.vline(braidX, 24 + by, 10, '#c78b1e');
      p.vline(braidX + 1, 24 + by, 10, '#f7ca45');
      p.px(braidX, 26 + by, '#fff4a6');
      p.px(braidX + 1, 28 + by, '#fff4a6');
      p.px(braidX, 30 + by, '#fff4a6');
      p.px(braidX + 1, 32 + by, '#fff4a6');
      p.rect(braidX - 1, 33 + by, 4, 2, '#ffffff'); // 精致白发结

      // [部件 7] 俏皮灵动三头身少女脸庞 + 灿烂琥珀金眸 + 自然分缕碎金刘海！
      const headY = 20 + by;
      p.rect(bx - 1, headY + 4, 3, 2, '#e0ac92');
      p.ellipse(bx, headY, 5.1, 4.8, '#ffe9d9');
      p.hline(bx - 3, headY + 4, 7, '#ebb99d');
      drawChibiFaceEyes(p, bx + 1, headY, '#b36b0b', '#ffeb66', pose);
      // 蓬松柔顺阳光金刘海（自然分缕，彻底告别生硬塑料横条！）
      p.ellipse(bx, headY - 4.2, 5.8, 2.8, '#cf911d');
      p.ellipse(bx, headY - 4.5, 4.8, 2.1, '#f5c742');
      p.hline(bx - 3, headY - 5, 6, '#fff3a6');
      p.px(bx - 5, headY - 2, '#d99a24');
      p.px(bx - 3, headY - 2, '#f5c742');
      p.px(bx, headY - 2, '#cf911d');
      p.px(bx + 3, headY - 2, '#f5c742');
      p.px(bx + 5, headY - 2, '#d99a24');
      // 柔和包颊碎金鬓
      p.vline(bx - 5, headY - 1, 7, '#ebba38');
      p.vline(bx + 5, headY - 1, 7, '#ebba38');

      // [部件 8] 超帅气倾斜大尖顶黑魔女帽 + 蓬松白蕾丝大蝴蝶结（优雅弯折帽尖，告别扁飞碟！）
      const hatTilt = isAtk && f === 1 ? 1 : pose.leanX > 1 ? 1 : 0;
      const hatY = headY - 6 + hatTilt;
      // 优雅微翘的宽大魔女帽檐（深靛蓝高光勾勒立体弧度）
      p.ellipse(bx, hatY, 12.8, 3.0, '#131626');
      p.ellipse(bx, hatY - 0.5, 11.4, 2.1, '#272f52');
      p.hline(bx - 9, hatY - 1, 8, '#465387');
      // 内檐柔软白蕾丝花边衬里
      for (let x = bx - 6; x <= bx + 6; x++) {
        p.px(x, hatY + 1, (x - bx) % 2 === 0 ? '#ffffff' : '#dce3f2');
      }
      // 经典潇洒高耸微弯的尖顶魔女帽冠（轮廓鲜明俏丽！）
      p.poly([
        [bx - 7, hatY - 1],
        [bx + 7, hatY - 1],
        [bx + 4, hatY - 8],
        [bx - 1 + hatTilt, hatY - 13],
        [bx - 5, hatY - 9],
      ], '#181c33');
      p.poly([
        [bx - 5, hatY - 1],
        [bx + 3, hatY - 1],
        [bx + 2, hatY - 8],
        [bx - 1 + hatTilt, hatY - 12],
        [bx - 3, hatY - 8],
      ], '#343f6b');
      // 俏皮向右后优雅弯垂的长帽尖
      p.poly([
        [bx - 2 + hatTilt, hatY - 12],
        [bx + 2 + hatTilt, hatY - 13],
        [bx + 8, hatY - 10],
        [bx + 4, hatY - 8],
      ], '#1f2642');
      p.line(bx + 1 + hatTilt, hatY - 12, bx + 7, hatY - 10, '#52639e', 1);
      // 标志性纯白宽帽带与侧方立体蓬松白蝴蝶结 + 金星扣
      p.hline(bx - 6, hatY - 3, 12, '#f5f2eb');
      p.hline(bx - 6, hatY - 2, 12, '#d4dbe8');
      p.poly([[bx + 2, hatY - 6], [bx + 8, hatY - 7], [bx + 7, hatY - 2], [bx + 2, hatY - 3]], '#ffffff');
      p.poly([[bx - 1, hatY - 5], [bx + 3, hatY - 4], [bx - 1, hatY - 2]], '#f2efe9');
      p.px(bx + 3, hatY - 4, '#ffd859', true); // 小金星扣

      // [部件 9] 右前臂泡泡袖（优雅举手操控身旁的「迷你八卦炉」！）
      const handX = isAtk && f === 1 ? bx + 9 : isAtk && f === 0 ? bx + 7 : bx + 7;
      const handY = isAtk && f === 0 ? 25 + by : isAtk && f === 1 ? 28 + by : 29 + by;
      p.ellipse(bx + 5, 27 + by, 2.2, 2.2, '#ffffff');
      p.line(bx + 5, 28 + by, handX, handY, '#f5f2eb', 2);
      p.rect(handX, handY - 1, 2, 2, '#ffe6d4');

      // [部件 10] 独立悬浮在魔理沙身旁的精雕正八边形「迷你八卦炉 (Mini-Hakkero)」！！
      const furnHover = Math.round(Math.sin(phase) * 1.8);
      const furnX = isAtk && f === 1
        ? bx + 14
        : isAtk && f === 2
          ? bx + 13
          : isAtk && f === 0
            ? bx + 12
            : bx + 15;
      const furnY = isAtk && f === 0
        ? 23 + by
        : isAtk && f === 1
          ? 27 + by
          : 27 + by + furnHover;

      // 精雕正八边形玄铁鎏金炉体（9×9 明确八角几何轮廓，绝不再像橙子圆球！）
      const r = isAtk && f === 1 ? 5 : 4;
      const c = isAtk && f === 1 ? 2 : 2;
      // 八角玄铁深影底座
      p.poly([
        [furnX - c, furnY - r],
        [furnX + c, furnY - r],
        [furnX + r, furnY - c],
        [furnX + r, furnY + c],
        [furnX + c, furnY + r],
        [furnX - c, furnY + r],
        [furnX - r, furnY + c],
        [furnX - r, furnY - c],
      ], '#2b2438');
      // 鎏金八角边框高光与八方八卦金刻纹
      p.hline(furnX - c, furnY - r, c * 2 + 1, '#f2c44d', true);
      p.hline(furnX - c, furnY + r, c * 2 + 1, '#c78c28');
      p.vline(furnX - r, furnY - c, c * 2 + 1, '#d99e32');
      p.vline(furnX + r, furnY - c, c * 2 + 1, '#ffe478', true);
      // 四斜角金棱点
      p.px(furnX - r + 1, furnY - r + 1, '#ffe885', true);
      p.px(furnX + r - 1, furnY - r + 1, '#ffffff', true);
      p.px(furnX - r + 1, furnY + r - 1, '#b87d20');
      p.px(furnX + r - 1, furnY + r - 1, '#f2c44d');
      // 炉体内部玄金凹槽 + 炽烈青白/星金八卦太极核心！
      p.rect(furnX - 2, furnY - 2, 5, 5, '#3e2d5c');
      p.px(furnX, furnY - 2, '#ffd859', true);
      p.px(furnX, furnY + 2, '#ffd859', true);
      p.px(furnX - 2, furnY, '#ffd859', true);
      p.px(furnX + 2, furnY, '#ffd859', true);
      // 炽亮八卦炉心（蓄力与发射时骤然升华至白金星核！）
      p.ellipse(furnX, furnY, 1.8, 1.8, isAtk && f <= 2 ? '#7ae8ff' : '#ffbf38', true);
      p.px(furnX, furnY, '#ffffff', true);

      // 身旁环绕星屑微光（呼应普通魔法使星辰弹幕气质）
      const spX = Math.round(Math.cos(phase) * 6);
      const spY = Math.round(Math.sin(phase) * 5);
      p.px(furnX + spX, furnY - 6 + Math.round(spY * 0.4), '#fff0a6', true);
      p.px(furnX - Math.round(spX * 0.7), furnY + 6, '#8ce8ff', true);

      // [部件 11] 八卦炉攻击爆发演出：蓄力八角光环 → 极限星符魔炮齐射（严格收于 x<=46 零裁切！）
      if (isAtk && f === 0) {
        // 蓄力帧：八卦炉四周浮现星金聚能十字芒
        p.px(furnX, furnY - 6, '#ffffff', true);
        p.px(furnX, furnY + 6, '#ffe066', true);
        p.px(furnX + 6, furnY, '#8ce8ff', true);
        p.px(furnX - 6, furnY, '#ffe066', true);
      } else if (isAtk && f === 1) {
        // 发射帧 1：从正八边形炉口轰出璀璨星金×虹蓝×纯白「星符极限火花」锥形魔炮！
        p.poly([[furnX + 4, furnY - 3], [46, furnY - 6], [46, furnY + 6], [furnX + 4, furnY + 3]], '#ff9e2c', true);
        p.poly([[furnX + 4, furnY - 2], [46, furnY - 3], [46, furnY + 3], [furnX + 4, furnY + 2]], '#ffe878', true);
        p.hline(furnX + 4, furnY, Math.max(1, 46 - (furnX + 4)), '#ffffff', true);
        // 伴生虹蓝小星弹
        p.px(furnX + 7, furnY - 5, '#7ae8ff', true);
        p.px(furnX + 10, furnY + 5, '#ff73c4', true);
        p.px(44, furnY - 5, '#ffffff', true);
      } else if (isAtk && f === 2) {
        // 余波帧 2：散逸星光射线与闪耀彩星
        p.line(furnX + 5, furnY - 2, 44, furnY - 4, '#ffe478', 1, true);
        p.line(furnX + 5, furnY + 2, 44, furnY + 4, '#7ae8ff', 1, true);
        p.px(43, furnY, '#ffffff', true);
        p.px(40, furnY - 5, '#ff73c4', true);
        p.px(41, furnY + 5, '#ffe066', true);
      }
    },
  },
};

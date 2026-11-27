/**
 * 博丽神社 · 生命系高阶（T3-T4）精雕 48×54 像素立绘与骨骼动画像素绘谱
 * 包含：退魔剑士、净邪祈祷巫女、御柱天马战神、博丽大结界神使
 */

import {
  drawChibiFaceEyes,
  type PixelPainter,
  type RigPose,
  type SpriteRigSpec,
} from '../../voxelSprites';
import { drawAnimeHeadBase, drawSoftHairCrown } from './sharedHelpers';

export const LIFE_HIGH_RIG_SPECS: Record<string, SpriteRigSpec> = {
  /** 生命 T3-A：退魔剑士（和风月银退魔双剑豪 · 飘扬月蓝高马尾 + 银月额饰 + 精雕月银胸甲与滚金深蓝阵羽织 + 辉金破魔太刀×冰蓝灵胁差双月连斩！） */
  creature_exorcist_blade: {
    backdropTop: '#0d152e',
    backdropBottom: '#1c2a4d',
    backdropGlow: '#78c4ff',
    avatarCrop: { x: 10, y: 5, size: 28 },
    portraitCrop: { x: 3, y: 3, w: 42, h: 47 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const isAtk = pose.state === 'attack';
      const isHit = pose.state === 'hit';
      const f = pose.frame;
      // 攻击前冲时略左收基准位，为前方饱满弯月双斩剑气留出充裕净空（绝不裁边！）
      const bx = isAtk && (f === 1 || f === 2)
        ? 21
        : isAtk && f === 0
          ? 20
          : Math.round(23 + pose.leanX * 0.85);
      const by = Math.round(pose.breathY - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.5);
      const stride = Math.round(pose.stride * 3.6);

      // [部件 1] 背后飒爽飞扬的「月蓝高马尾」与分层深蓝滚金「和风阵羽织披风」
      const tailSway = isAtk && f === 1 ? -4 : isAtk && f === 2 ? -2 : sway;
      // 高马尾发束（带柔顺S曲线与亮蓝银发丝层次）
      p.poly([
        [bx - 4, 14 + by],
        [bx - 12 + tailSway, 16 + by],
        [bx - 16 + tailSway, 24 + by],
        [bx - 13 + tailSway, 28 + by],
        [bx - 9 + tailSway, 22 + by],
        [bx - 5, 18 + by],
      ], '#1e2c59');
      p.poly([
        [bx - 5, 15 + by],
        [bx - 11 + tailSway, 17 + by],
        [bx - 14 + tailSway, 24 + by],
        [bx - 10 + tailSway, 21 + by],
      ], '#3b5ca8');
      p.line(bx - 6, 16 + by, bx - 12 + tailSway, 21 + by, '#8cb8ff', 1);
      // 绯红鎏金扎发结
      p.rect(bx - 6, 13 + by, 3, 3, '#d92b49');
      p.px(bx - 5, 14 + by, '#ffe478');

      // 分层随风翻卷的深蓝阵羽织披风（暗衬里 + 主布面 + 鎏金下摆纹）
      const capeBack = isAtk && f === 1 ? -5 : sway;
      p.poly([
        [bx - 4, 24 + by],
        [bx - 15 + capeBack, 31 + by],
        [bx - 16 + capeBack, 41 + by],
        [bx - 7, 39 + by],
      ], '#122454');
      p.poly([
        [bx - 4, 25 + by],
        [bx - 13 + capeBack, 31 + by],
        [bx - 13 + capeBack, 39 + by],
        [bx - 6, 37 + by],
      ], '#254a9e');
      p.line(bx - 13 + capeBack, 32 + by, bx - 7, 35 + by, '#4b7de0', 1);
      p.line(bx - 15 + capeBack, 40 + by, bx - 7, 38 + by, '#f0c452', 1);

      // [部件 2] 灵活分步的精钢护胫与和风系带战靴
      const lLift = pose.stride > 0.3 ? -2 : 0;
      const rLift = pose.stride < -0.3 ? -2 : 0;
      const lFootX = bx - 5 - stride;
      const rFootX = bx + 2 + stride;
      // 后腿护胫
      p.rect(lFootX, 41 + lLift, 3, 6, '#394870');
      p.vline(lFootX + 1, 41 + lLift, 5, '#9cb3db');
      p.hline(lFootX, 43 + lLift, 3, '#e8bc4f');
      p.hline(lFootX - 1, 47 + lLift, 4, '#1b2647');
      // 前腿护胫（高亮月银）
      p.rect(rFootX, 41 + rLift, 3, 6, '#586d9e');
      p.vline(rFootX + 1, 41 + rLift, 5, '#d9e7ff');
      p.hline(rFootX, 43 + rLift, 3, '#ffe073');
      p.hline(rFootX, 47 + rLift, 4, '#243561');

      // [部件 3] 百褶深蓝剑道袴裙 + 绯白退魔腰带垂穗 + 精雕月银修身胸甲
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      // 剑道百褶战裙（清晰百褶明暗竖纹）
      p.poly([
        [bx - 5, 34 + by],
        [bx + 5, 34 + by],
        [bx + 9 + sk, 43 + by],
        [bx - 8 + sk, 43 + by],
      ], '#162d66');
      p.poly([
        [bx - 4, 34 + by],
        [bx + 4, 34 + by],
        [bx + 7 + sk, 42 + by],
        [bx - 6 + sk, 42 + by],
      ], '#2b55b3');
      p.vline(bx - 3, 35 + by, 7, '#4c80e6');
      p.vline(bx + 2, 35 + by, 7, '#193578');
      p.hline(bx - 7 + sk, 42 + by, 15, '#e8eefc');
      // 前垂白金退魔御札布（纤细修长不臃肿！）
      p.poly([
        [bx - 1, 34 + by],
        [bx + 2, 34 + by],
        [bx + 3 + sk, 42 + by],
        [bx - 1 + sk, 42 + by],
      ], '#f5f8ff');
      p.vline(bx + 1, 35 + by, 6, '#d92b49');
      p.px(bx + 1, 37 + by, '#ffe478', true);

      // 精雕月银收腰轻铠（3 阶冷金属高光 + 绯红内襟与鎏金护领）
      p.poly([
        [bx - 4, 25 + by],
        [bx + 4, 25 + by],
        [bx + 5, 33 + by],
        [bx - 5, 33 + by],
      ], '#556991');
      p.rect(bx - 3, 26 + by, 6, 6, '#a5badb');
      p.rect(bx - 2, 26 + by, 3, 4, '#ebf3ff');
      p.px(bx - 1, 27 + by, '#ffffff');
      // 绯红和风交领 + 金色退魔纹章
      p.line(bx - 3, 25 + by, bx, 28 + by, '#d92b49', 1);
      p.line(bx + 3, 25 + by, bx, 28 + by, '#f0425c', 1);
      p.px(bx, 29 + by, '#ffe478', true);
      // 绯金编织束腰与侧面退魔绳穗
      p.hline(bx - 5, 33 + by, 10, '#c4243f');
      p.hline(bx - 4, 32 + by, 8, '#f2c85b');
      p.rect(bx - 1, 32 + by, 3, 2, '#ffe885');
      p.line(bx - 4, 34 + by, bx - 5 + sway, 38 + by, '#f2c85b', 1);

      // 轻盈雕花月银双肩铠（收紧贴肩，彻底告别大圆球！）
      p.poly([[bx - 7, 25 + by], [bx - 4, 24 + by], [bx - 4, 28 + by], [bx - 7, 27 + by]], '#6f85b0');
      p.hline(bx - 7, 25 + by, 3, '#e3eeff');
      p.px(bx - 6, 27 + by, '#f2c85b');
      p.poly([[bx + 4, 24 + by], [bx + 7, 25 + by], [bx + 7, 27 + by], [bx + 4, 28 + by]], '#8ea6d4');
      p.hline(bx + 4, 25 + by, 3, '#ffffff');
      p.px(bx + 6, 27 + by, '#ffe073');

      // [部件 4] 左手「冰蓝灵胁差（副刃）」——随动作自然配合右刃形成二刀流层次！
      if (isAtk && f === 0) {
        // 蓄力帧：副刃横护身前下侧蓄势
        p.rect(bx - 6, 28 + by, 3, 3, '#586d9e');
        p.line(bx - 7, 30 + by, bx - 15, 25 + by, '#52b8ff', 2, true);
        p.line(bx - 8, 29 + by, bx - 15, 25 + by, '#e8f9ff', 1, true);
        p.rect(bx - 8, 29 + by, 2, 2, '#ffe073');
      } else if (isAtk && f === 1) {
        // 纵斩帧：副刃顺势后拉平衡，准备紧接第二段回旋连斩
        p.line(bx - 5, 29 + by, bx - 14, 34 + by, '#52b8ff', 2, true);
        p.line(bx - 6, 29 + by, bx - 14, 33 + by, '#def5ff', 1, true);
      } else if (isAtk && f === 2) {
        // 第二段回旋双连斩！左手冰蓝灵刃顺势向前横扫，切出苍蓝弯月剑气！
        p.rect(bx + 4, 30 + by, 3, 3, '#8ea6d4');
        p.line(bx + 6, 31 + by, bx + 18, 28 + by, '#59bfff', 2, true);
        p.line(bx + 7, 30 + by, bx + 18, 28 + by, '#ffffff', 1, true);
      } else {
        // 待机/行走/受击：左手自然反握冰蓝胁差斜指后下方，与主刀形成漂亮对角剪影
        const offArm = isHit ? -2 : Math.round(-pose.stride * 1.2);
        p.rect(bx - 7 + offArm, 29 + by, 3, 3, '#7b92bf');
        p.rect(bx - 8 + offArm, 31 + by, 2, 2, '#ffe4cf');
        p.rect(bx - 9 + offArm, 31 + by, 2, 2, '#f0c452');
        p.line(bx - 9 + offArm, 32 + by, bx - 16 + offArm, 37 + by, '#45a8ff', 2, true);
        p.line(bx - 10 + offArm, 32 + by, bx - 16 + offArm, 36 + by, '#e6f7ff', 1, true);
      }

      // [部件 5] 飒爽灵动少女脸庞 + 层次感月蓝短发 + 精致「和风白银新月退魔额饰」（彻底告别傻瓜牛角头盔！）
      const headY = 18 + by;
      drawAnimeHeadBase(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#1c54c4', '#8ce8ff', pose);
      drawSoftHairCrown(p, bx, headY, '#1c2a54', '#335299', '#6c96e6', '#cfe4ff');
      // 柔和包颊双鬓（修脸型、去方框感）
      p.poly([[bx - 6, headY - 3], [bx - 4, headY - 2], [bx - 5, headY + 6], [bx - 7, headY + 4]], '#263b73');
      p.vline(bx - 6, headY - 1, 5, '#4d73c2');
      p.poly([[bx + 4, headY - 2], [bx + 6, headY - 3], [bx + 7, headY + 4], [bx + 5, headY + 6]], '#263b73');
      p.vline(bx + 5, headY - 1, 4, '#5a82d1');
      // 精巧白银发箍 + 眉心鎏金新月退魔额饰（纤细高贵！）
      p.hline(bx - 5, headY - 5, 10, '#dce8fc');
      p.px(bx - 4, headY - 6, '#b8ccf0');
      p.px(bx + 4, headY - 6, '#b8ccf0');
      // 精致小巧新月冠（仅 5×4px，优雅不浮夸）
      p.px(bx - 2, headY - 8, '#ffe885', true);
      p.px(bx - 1, headY - 7, '#f2c85b', true);
      p.px(bx, headY - 6, '#fff8cc', true);
      p.px(bx + 1, headY - 7, '#f2c85b', true);
      p.px(bx + 2, headY - 8, '#ffe885', true);
      p.px(bx, headY - 7, '#e63250', true);

      // [部件 6] 右手「辉金破魔太刀（主刃）」+ 连续丝滑无裁切「双月连斩」光弧剑气！
      if (isAtk && f === 0) {
        // 蓄力帧 0：右手高举太刀收至右后上方（完全避开面部与额冠，剪影干净！）
        p.line(bx + 4, 27 + by, bx + 9, 21 + by, '#a5badb', 2);
        p.rect(bx + 8, 20 + by, 2, 2, '#ffe4cf');
        p.rect(bx + 7, 19 + by, 3, 2, '#f0c452');
        p.line(bx + 9, 19 + by, bx + 4, 6 + by, '#ffe066', 2, true);
        p.line(bx + 9, 18 + by, bx + 4, 6 + by, '#ffffff', 1, true);
        // 刀尖蓄力星芒
        p.px(bx + 4, 5 + by, '#ffffff', true);
        p.px(bx + 2, 6 + by, '#8cd6ff', true);
        p.px(bx + 6, 6 + by, '#ffe885', true);
      } else if (isAtk && f === 1) {
        // 攻击帧 1（第一段纵斩）：太刀猛然斜劈向下，前方绘出连续饱满的金色新月剑气弧！
        p.line(bx + 4, 27 + by, bx + 10, 30 + by, '#b5c8eb', 2);
        p.rect(bx + 9, 29 + by, 2, 2, '#ffe4cf');
        p.rect(bx + 10, 29 + by, 2, 2, '#f0c452');
        p.line(bx + 11, 30 + by, bx + 22, 36 + by, '#ffe066', 2, true);
        p.line(bx + 12, 30 + by, bx + 22, 35 + by, '#ffffff', 1, true);
        // 连续紧密连线的新月弯弧（外层炽金 + 内芯纯白，彻底告别虚线点点！）
        const arcCx = bx + 9;
        const arcCy = 26 + by;
        const segs = 12;
        for (let i = 0; i < segs; i++) {
          const a0 = -1.25 + (i / segs) * 2.15;
          const a1 = -1.25 + ((i + 1) / segs) * 2.15;
          const ox0 = Math.round(arcCx + Math.cos(a0) * 14);
          const oy0 = Math.round(arcCy + Math.sin(a0) * 15);
          const ox1 = Math.round(arcCx + Math.cos(a1) * 14);
          const oy1 = Math.round(arcCy + Math.sin(a1) * 15);
          const ix0 = Math.round(arcCx + Math.cos(a0) * 12);
          const iy0 = Math.round(arcCy + Math.sin(a0) * 13);
          const ix1 = Math.round(arcCx + Math.cos(a1) * 12);
          const iy1 = Math.round(arcCy + Math.sin(a1) * 13);
          const thick = i >= 3 && i <= 8 ? 2 : 1;
          p.line(ox0, oy0, ox1, oy1, '#ffcf40', thick, true);
          p.line(ix0, iy0, ix1, iy1, i >= 3 && i <= 9 ? '#ffffff' : '#fff0a6', 1, true);
        }
        p.px(bx + 20, 14 + by, '#9cd8ff', true);
        p.px(bx + 23, 25 + by, '#ffffff', true);
      } else if (isAtk && f === 2) {
        // 攻击帧 2（第二段回旋连斩）：太刀上撩收势 + 副刃连续苍蓝弯月反斩弧！
        p.line(bx + 4, 27 + by, bx + 9, 24 + by, '#b5c8eb', 2);
        p.line(bx + 9, 24 + by, bx + 19, 14 + by, '#ffe066', 2, true);
        p.line(bx + 10, 23 + by, bx + 19, 14 + by, '#ffffff', 1, true);
        const arcCx = bx + 9;
        const arcCy = 27 + by;
        const segs = 10;
        for (let i = 0; i < segs; i++) {
          const a0 = -0.82 + (i / segs) * 1.84;
          const a1 = -0.82 + ((i + 1) / segs) * 1.84;
          const ox0 = Math.round(arcCx + Math.cos(a0) * 14);
          const oy0 = Math.round(arcCy + Math.sin(a0) * 12);
          const ox1 = Math.round(arcCx + Math.cos(a1) * 14);
          const oy1 = Math.round(arcCy + Math.sin(a1) * 12);
          const ix0 = Math.round(arcCx + Math.cos(a0) * 12);
          const iy0 = Math.round(arcCy + Math.sin(a0) * 10);
          const ix1 = Math.round(arcCx + Math.cos(a1) * 12);
          const iy1 = Math.round(arcCy + Math.sin(a1) * 10);
          p.line(ox0, oy0, ox1, oy1, '#42b4ff', i >= 2 && i <= 7 ? 2 : 1, true);
          p.line(ix0, iy0, ix1, iy1, i >= 2 && i <= 7 ? '#ffffff' : '#b8eaff', 1, true);
        }
        p.px(bx + 21, 35 + by, '#ffe478', true);
      } else {
        // 待机 / 行走 / 收招：右手持辉金破魔太刀优雅斜指右上方，剑刃微弧、锷护手清晰
        const armLift = isHit ? -2 : Math.round(-pose.armAction * 2);
        const handX = bx + 8;
        const handY = 29 + by + armLift;
        p.line(bx + 4, 27 + by, handX, handY, '#9eb4de', 2);
        p.rect(handX - 1, handY - 1, 2, 2, '#ffe4cf');
        // 绯缠刀柄与十字鎏金锷
        p.line(handX - 2, handY + 2, handX + 1, handY - 1, '#a82038', 1);
        p.line(handX - 1, handY - 2, handX + 3, handY + 1, '#f5cc58', 1);
        // 细长优美微弧太刀刃（刀背浅蓝银 + 刀刃亮金白光！）
        p.line(handX + 1, handY - 1, handX + 11, handY - 13, '#8fb8e6', 2);
        p.line(handX + 2, handY - 1, handX + 12, handY - 14, '#ffe478', 1, true);
        p.line(handX + 3, handY - 2, handX + 12, handY - 14, '#ffffff', 1, true);
        // 刀尖星光微闪
        if (pose.frame % 3 === 1) {
          p.px(handX + 13, handY - 15, '#ffffff', true);
        }
      }
    },
  },

  /** 生命 T3-B：净邪祈祷巫女（琉璃月华莲僧祭司 · 浮空青莲底座 + 紫藤长辫 + 珍珠白翡翠金袈裟 + 六环金锡杖！） */
  creature_prayer_maiden: {
    backdropTop: '#0e1926',
    backdropBottom: '#1c2b3d',
    backdropGlow: '#78f5df',
    avatarCrop: { x: 10, y: 5, size: 28 },
    portraitCrop: { x: 3, y: 3, w: 42, h: 47 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(23 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 1.4 - pose.stepLift - 1);
      const sway = Math.round(pose.flutter * 1.3);

      // [部件 1] 脚下缓缓绽放的「青玉莲台浮空法阵」+ 背后悬空「鎏金念珠轮」（佛道神官专属禅韵！）
      p.ellipse(bx, 48, 10.5, 2.6, '#1f8a7d', true);
      p.ellipse(bx, 48, 6.8, 1.4, '#9effef', true);
      const ringY = 22 + by;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + pose.phase * 0.5;
        const rx = Math.round(bx + Math.cos(a) * 14.0);
        const ry = Math.round(ringY + Math.sin(a) * 13.5);
        p.px(rx, ry, i % 3 === 0 ? '#9effef' : '#ffe278', true);
      }

      // [部件 2] 柔美紫藤淡紫长发（垂落至腰间，彻底区分于灵梦黑发！）
      p.poly([[bx - 7, 17 + by], [bx + 7, 17 + by], [bx + 10 - sway, 36 + by], [bx - 10 + sway, 36 + by]], '#4d3a73');
      p.rect(bx - 6, 19 + by, 12, 15, '#7c62ab');
      p.vline(bx - 4, 21 + by, 12, '#b89ee6');

      // [部件 3] 琉璃珍珠白长祭司袍 + 斜披翡翠滚金「天女袈裟」+ 优雅青玉广袖（彻底去红白裙！）
      const sk = Math.round(-pose.leanX * 0.4 + sway * 0.5);
      p.poly([[bx - 5, 32 + by], [bx + 5, 32 + by], [bx + 10 + sk, 45 + by], [bx - 10 + sk, 45 + by]], '#cfd8e8');
      p.poly([[bx - 4, 32 + by], [bx + 4, 32 + by], [bx + 8 + sk, 44 + by], [bx - 8 + sk, 44 + by]], '#ffffff');
      p.hline(bx - 9 + sk, 44 + by, 18, '#3ec9b4');
      p.hline(bx - 8 + sk, 43 + by, 16, '#ffe073');
      // 宽大垂落青玉色内袖
      p.poly([[bx - 5, 25 + by], [bx - 12 + sway, 30 + by], [bx - 11 + sway, 38 + by], [bx - 5, 35 + by]], '#28998c');
      p.hline(bx - 11 + sway, 37 + by, 6, '#ffe073');
      // 上身白玉禅衣 + 斜披金纹碧玉袈裟飘带
      p.rect(bx - 5, 25 + by, 10, 8, '#f7fbff');
      p.line(bx - 5, 26 + by, bx + 5, 33 + by, '#228c7f', 3);
      p.line(bx - 5, 26 + by, bx + 5, 33 + by, '#ffe278', 1);
      // 胸口莲花翡翠玉佩
      p.rect(bx - 1, 29 + by, 3, 2, '#78ffea', true);

      // [部件 4] 澄澈慈悲的神官少女面庞 + 紫藤柔发 + 莲花额心金钿
      const headY = 18 + by;
      drawAnimeHeadBase(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#1c8078', '#8cfff0', pose);
      drawSoftHairCrown(p, bx, headY, '#533e7a', '#856bb8', '#beaae8', '#eee6ff');
      p.rect(bx - 6, headY - 2, 2, 11, '#5e478a');
      p.rect(bx + 5, headY - 2, 2, 11, '#5e478a');
      // 精致金莲额冠（东方天女/高僧典雅造型）
      p.poly([[bx - 4, headY - 7], [bx, headY - 10], [bx + 4, headY - 7]], '#ffe066', true);
      p.px(bx, headY - 8, '#78ffea', true);
      p.px(bx - 6, headY + 4, '#ffe066');
      p.px(bx + 6, headY + 4, '#ffe066');

      // [部件 5] 右手优雅端持「六环鎏金大锡杖」（HoMM4 僧侣 × 东方神官最具辨识度法器！）
      const stX = bx + 12 + Math.round(pose.armAction * 3);
      const stY = 17 + by - Math.round(pose.armAction * 4);
      p.poly([[bx + 4, 26 + by], [stX - 2, stY + 9], [stX - 3, stY + 15], [bx + 3, 33 + by]], '#35b5a5');
      p.rect(stX - 2, stY + 9, 2, 2, '#ffe4cf');
      // 锡杖长柄
      p.line(stX - 1, stY + 26, stX, stY - 2, '#b8822a', 2);
      p.line(stX - 1, stY + 26, stX, stY - 2, '#ffe478', 1);
      // 锡杖顶部镂空金环与翠玉宝珠
      p.ellipse(stX, stY - 4, 4.4, 4.8, '#ffe066', true);
      p.ellipse(stX, stY - 4, 2.6, 3.0, '#132233');
      p.ellipse(stX, stY - 4, 1.5, 1.5, '#8cfff0', true);
      p.px(stX - 4, stY - 2, '#fff4b8', true);
      p.px(stX + 4, stY - 2, '#fff4b8', true);
      if (pose.slashAlpha > 0.3) {
        p.ellipse(stX + 1, stY - 4, 6.2, 6.2, '#9effef', true);
      }
    },
  },

  /** 生命 T4-A：御柱天马战神（鎏金重甲圣骑士 + 苍蓝翎羽全盔 + 冰蓝雪白装甲天马，彻底去红白巫女！） */
  creature_onbashira_steed: {
    backdropTop: '#0f1833',
    backdropBottom: '#1c2c4f',
    backdropGlow: '#82d4ff',
    avatarCrop: { x: 9, y: 2, size: 28 },
    portraitCrop: { x: 1, y: 2, w: 46, h: 48 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(21 + pose.leanX * 1.0);
      const by = Math.round(pose.breathY - pose.stepLift * 1.1);
      const st = Math.round(pose.stride * 3.8);
      const fl = Math.round(pose.flutter * 2.0);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 2.8);

      // [部件 1] 冰蓝与珍珠白双色「圣翼天马羽翼」+ 流动雪青马尾
      p.poly([
        [bx - 2, 29 + by],
        [bx - 15, 13 + by + flap],
        [bx - 20, 17 + by + flap],
        [bx - 16, 26 + by + flap],
        [bx - 7, 30 + by],
      ], '#78b0e6');
      p.poly([
        [bx - 2, 28 + by],
        [bx - 14, 15 + by + flap],
        [bx - 18, 19 + by + flap],
        [bx - 13, 25 + by + flap],
        [bx - 6, 28 + by],
      ], '#f5fbff', true);
      p.line(bx - 3, 27 + by, bx - 15, 14 + by + flap, '#a8e8ff', 1, true);
      p.poly([[bx - 10, 32 + by], [bx - 20, 35 + by + fl], [bx - 18, 42 + by + fl], [bx - 9, 36 + by]], '#9ec4eb');
      p.poly([[bx - 10, 33 + by], [bx - 18, 35 + by + fl], [bx - 16, 39 + by + fl], [bx - 9, 35 + by]], '#ffffff');

      // [部件 2] 扬蹄冲锋的四肢（黄金马蹄 + 珍珠白冷银阴影）
      p.line(bx - 7, 36 + by, bx - 11 - st, 47, '#aebad4', 3);
      p.line(bx + 6, 35 + by, bx + 9 + st, 47, '#c2cee6', 3);
      p.poly([[bx - 10, 33 + by], [bx - 4, 34 + by], [bx - 6 + st, 41], [bx - 10 + st, 41]], '#e3ecfa');
      p.line(bx - 8 + st, 40, bx - 6 + st, 47, '#ffffff', 2);
      p.rect(bx - 7 + st, 46, 3, 2, '#e6b84c');
      const hoofLift = pose.armAction >= 0.5 ? -4 : -2;
      p.poly([[bx + 5, 32 + by], [bx + 10, 32 + by], [bx + 14 - st, 38 + hoofLift], [bx + 10 - st, 39 + hoofLift]], '#ffffff');
      p.line(bx + 12 - st, 38 + hoofLift, bx + 11 - st, 44 + hoofLift, '#e3ecfa', 2);
      p.rect(bx + 10 - st, 43 + hoofLift, 3, 2, '#ffe073');

      // [部件 3] 俊美神驹躯体 + 皇家苍蓝镶金骑士马衣（HoMM4 Champion 经典蓝金马铠！）
      p.ellipse(bx - 1, 33 + by, 11.8, 5.8, '#c7d4eb');
      p.ellipse(bx - 1, 32 + by, 10.6, 4.8, '#ffffff');
      p.poly([[bx - 8, 29 + by], [bx + 8, 29 + by], [bx + 9, 37 + by], [bx - 8, 37 + by]], '#1c4a9e');
      p.poly([[bx - 6, 29 + by], [bx + 6, 29 + by], [bx + 7, 36 + by], [bx - 6, 36 + by]], '#3882eb');
      p.hline(bx - 7, 36 + by, 16, '#ffe073');
      p.rect(bx - 1, 31 + by, 3, 3, '#fff5b8', true);

      // [部件 4] 昂首白玉马颈、冰青飘逸马鬃与鎏金马额甲
      p.poly([[bx + 5, 32 + by], [bx + 10, 21 + by], [bx + 15, 22 + by], [bx + 10, 34 + by]], '#dce7f7');
      p.poly([[bx + 7, 31 + by], [bx + 11, 22 + by], [bx + 14, 23 + by], [bx + 10, 32 + by]], '#ffffff');
      p.poly([[bx + 5, 27 + by], [bx + 9, 20 + by], [bx + 12, 21 + by], [bx + 8, 29 + by]], '#80d8ff');
      p.poly([[bx + 10, 20 + by], [bx + 19, 23 + by], [bx + 18, 27 + by], [bx + 10, 26 + by]], '#ffffff');
      p.hline(bx + 11, 26 + by, 7, '#b5c6e0');
      p.poly([[bx + 10, 20 + by], [bx + 12, 16 + by], [bx + 14, 20 + by]], '#ffffff');
      p.line(bx + 12, 21 + by, bx + 18, 24 + by, '#ffe066', 2);
      p.px(bx + 14, 22 + by, '#29d4ff', true);

      // [部件 5] 全身鎏金重甲「天穹冠军圣骑士」（飘扬苍蓝长羽饰全盔 + 黄金胸铠 + 皇家蓝披风！）
      p.poly([[bx - 4, 21 + by], [bx - 17 + fl, 24 + by], [bx - 15 + fl, 29 + by], [bx - 3, 27 + by]], '#2462c9');
      p.hline(bx - 16 + fl, 28 + by, 11, '#ffe073');
      // 黄金板甲胸铠与肩甲
      p.rect(bx - 4, 21 + by, 8, 9, '#c98e28');
      p.rect(bx - 3, 22 + by, 6, 7, '#f5c74c');
      p.vline(bx, 22 + by, 7, '#fff5b8');
      p.ellipse(bx - 4, 22 + by, 2.6, 2.2, '#ffe478');
      // 帅气鎏金羽翼骑士全盔 + 迎风飘荡的苍蓝长鬃羽！
      const hy = 15 + by;
      p.poly([[bx - 3, hy - 5], [bx - 14 + fl, hy - 7], [bx - 12 + fl, hy - 1], [bx - 4, hy - 1]], '#4da6ff', true);
      p.line(bx - 4, hy - 5, bx - 13 + fl, hy - 6, '#b8e8ff', 1, true);
      p.ellipse(bx, hy, 4.6, 4.4, '#d99e2e');
      p.ellipse(bx, hy - 0.5, 3.8, 3.6, '#ffe473');
      p.hline(bx - 2, hy - 3, 5, '#ffffff');
      // 骑士面甲幽蓝目镜光缝
      p.hline(bx, hy, 4, '#1b2c52');
      p.hline(bx + 1, hy, 3, '#78ecff', true);
      // 盔侧白金小翼饰
      p.poly([[bx - 3, hy - 3], [bx - 7, hy - 8], [bx - 1, hy - 5]], '#ffffff', true);

      // [部件 6] 裹苍蓝战旗的「御柱破魔骑士长枪」（高举斜前刺，气势如虹！）
      const thrust = pose.armAction >= 0.6 ? 4 : pose.armAction <= -0.5 ? -3 : 0;
      p.line(bx - 5 + thrust, 24 + by, bx + 19 + thrust, 11 + by, '#9c6826', 3);
      p.line(bx - 5 + thrust, 23 + by, bx + 19 + thrust, 10 + by, '#ffe073', 1);
      // 枪尖下方飘扬的苍蓝鎏金骑士三角旗
      p.poly([
        [bx + 11 + thrust, 15 + by],
        [bx + 17 + thrust, 12 + by],
        [bx + 12 + thrust, 20 + by + Math.round(fl * 0.4)],
      ], '#3888f0', true);
      p.px(bx + 13 + thrust, 15 + by, '#ffe880', true);
      // 璀璨星银长枪刃
      p.poly([
        [bx + 17 + thrust, 9 + by],
        [bx + 25 + thrust, 8 + by],
        [bx + 19 + thrust, 14 + by],
      ], '#d9f2ff', true);
      p.line(bx + 18 + thrust, 11 + by, bx + 24 + thrust, 8 + by, '#ffffff', 1, true);
      if (pose.slashAlpha > 0.3) {
        p.line(bx + 14, 13 + by, bx + 26, 7 + by, '#a6f0ff', 2, true);
      }
    },
  },

  /** 生命 T4-B：博丽大结界神使（炽光圣咏六翼大天使 · 铂银长发 + 鎏金胸甲圣袍 + 烈焰大天使圣剑！） */
  creature_hakurei_seraph: {
    backdropTop: '#10142e',
    backdropBottom: '#231e42',
    backdropGlow: '#fff0a6',
    avatarCrop: { x: 10, y: 4, size: 28 },
    portraitCrop: { x: 1, y: 2, w: 46, h: 49 },
    draw: (p: PixelPainter, pose: RigPose) => {
      const bx = Math.round(24 + pose.leanX * 0.7);
      const by = Math.round(pose.breathY * 1.5 - pose.stepLift);
      const sway = Math.round(pose.flutter * 1.4);
      const flap = Math.round(Math.sin(pose.phase * Math.PI * 2) * 3.0);

      // [部件 1] 阶梯羽瓣雕刻感「六翼炽光大天使羽翼」（纯白×暖金×天青虹彩！）
      const drawFeatheredWing = (
        yBase: number,
        span: number,
        lift: number,
        shadow: string,
        main: string,
        tip: string,
      ) => {
        for (const dir of [-1, 1]) {
          p.poly([
            [bx + dir * 4, yBase],
            [bx + dir * span, yBase - lift],
            [bx + dir * (span - 2), yBase - lift + 5],
            [bx + dir * (span - 5), yBase - lift + 9],
            [bx + dir * 5, yBase + 5],
          ], shadow);
          p.poly([
            [bx + dir * 4, yBase],
            [bx + dir * (span - 1), yBase - lift + 1],
            [bx + dir * (span - 3), yBase - lift + 4],
            [bx + dir * (span - 6), yBase - lift + 7],
            [bx + dir * 5, yBase + 4],
          ], main, true);
          p.line(bx + dir * 5, yBase, bx + dir * (span - 1), yBase - lift + 1, tip, 1, true);
          p.px(bx + dir * (span + 1), yBase - lift - 1, tip, true);
        }
      };
      drawFeatheredWing(21 + by, 20, 10 - flap, '#99b5db', '#ffffff', '#a8f0ff');
      drawFeatheredWing(27 + by, 18, 2 + flap, '#bfa478', '#fff5cc', '#ffffff');
      drawFeatheredWing(33 + by, 13, -5 - flap, '#8ea4c9', '#d9f2ff', '#ffe885');

      // [部件 2] 飘逸天青鎏金「炽天使羽衣天带」
      p.line(bx - 12, 23 + by + sway, bx - 7, 29 + by, '#70dcff', 2, true);
      p.line(bx + 12, 23 + by - sway, bx + 7, 29 + by, '#70dcff', 2, true);
      p.line(bx - 12, 22 + by + sway, bx - 16, 30 + by + sway, '#ffe680', 1, true);
      p.line(bx + 12, 22 + by - sway, bx + 16, 30 + by - sway, '#ffe680', 1, true);

      // [部件 3] 丝滑铂金银白长发后发（与灵梦黑发、魔理沙金发截然不同！）
      p.poly([[bx - 7, 17 + by], [bx + 7, 17 + by], [bx + 10 - sway, 34 + by], [bx - 10 + sway, 34 + by]], '#94a6c7');
      p.rect(bx - 5, 19 + by, 10, 13, '#e3eeff');

      // [部件 4] 纯白鎏金大天使圣礼长袍 + 黄金束腰羽纹护胸（彻底去红白条！）
      p.rect(bx - 3, 45 + by, 2, 3, '#ffe9d9');
      p.rect(bx + 1, 46 + by, 2, 3, '#ffe9d9');
      const sk = Math.round(sway * 0.6);
      p.poly([[bx - 4, 31 + by], [bx + 4, 31 + by], [bx + 9 + sk, 45 + by], [bx - 9 + sk, 45 + by]], '#d2dff2');
      p.poly([[bx - 3, 31 + by], [bx + 3, 31 + by], [bx + 7 + sk, 44 + by], [bx - 7 + sk, 44 + by]], '#ffffff');
      // 中央淡天青鎏金星纹圣带
      p.poly([[bx - 2, 31 + by], [bx + 2, 31 + by], [bx + 3 + sk, 44 + by], [bx - 3 + sk, 44 + by]], '#3b82d6');
      p.vline(bx, 32 + by, 12, '#ffe880', true);
      p.hline(bx - 8 + sk, 44 + by, 16, '#ffe073');
      // 黄金羽翼雕纹大天使胸甲
      p.rect(bx - 4, 25 + by, 8, 7, '#e6b23e');
      p.rect(bx - 3, 26 + by, 6, 5, '#ffe880');
      p.px(bx, 27 + by, '#9ef0ff', true);
      p.poly([[bx - 4, 26 + by], [bx - 10, 31 + by], [bx - 8, 35 + by], [bx - 4, 32 + by]], '#f5f9ff');

      // [部件 5] 纤细星光圣环 + 圣洁绝美铂银长发大天使面庞
      const headY = 17 + by;
      p.hline(bx - 5, headY - 10, 10, '#ffe878', true);
      p.px(bx - 6, headY - 9, '#a8f0ff', true);
      p.px(bx + 6, headY - 9, '#a8f0ff', true);
      p.hline(bx - 4, headY - 8, 8, '#fff8d6', true);
      p.px(bx, headY - 11, '#ffffff', true);

      drawAnimeHeadBase(p, bx, headY);
      drawChibiFaceEyes(p, bx + 1, headY, '#266cd9', '#9ef0ff', pose);
      drawSoftHairCrown(p, bx, headY, '#8e9fc2', '#c7d6f0', '#eef5ff', '#ffffff');
      p.rect(bx - 6, headY - 2, 2, 11, '#b0c2e0');
      p.rect(bx + 5, headY - 2, 2, 11, '#b0c2e0');
      // 黄金天使星冠
      p.hline(bx - 4, headY - 6, 8, '#ffe066', true);
      p.px(bx, headY - 7, '#ffffff', true);

      // [部件 6] 右手高擎「烈焰辉光大天使圣剑」（经典 HoMM4 Angel 灵魂神兵！）
      const swX = bx + 11 + Math.round(pose.armAction * 3);
      const swY = 16 + by - Math.round(pose.armAction * 4);
      p.line(bx + 4, 28 + by, swX - 1, swY + 9, '#f5f9ff', 2);
      p.rect(swX - 2, swY + 8, 2, 2, '#ffe4cf');
      // 圣剑金柄与宽大天使双翼护手
      p.vline(swX - 1, swY + 9, 5, '#d49428');
      p.hline(swX - 4, swY + 8, 7, '#ffe478', true);
      // 熊熊燃烧白金天火的大剑剑刃！
      p.line(swX - 1, swY + 7, swX, swY - 9, '#ff942b', 3, true);
      p.line(swX - 1, swY + 7, swX, swY - 9, '#ffe878', 2, true);
      p.line(swX - 1, swY + 6, swX, swY - 8, '#ffffff', 1, true);
      p.px(swX + 2, swY - 5 + sway, '#ffe880', true);
      p.px(swX - 3, swY - 2 - sway, '#9ef0ff', true);
      if (pose.slashAlpha > 0.3) {
        p.line(swX + 2, swY - 8, swX + 10, swY + 10, '#fff7cc', 2, true);
      }
    },
  },
};

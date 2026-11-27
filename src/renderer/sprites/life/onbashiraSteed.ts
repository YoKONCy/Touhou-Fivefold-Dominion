/**
 * 7. 御柱天马（T4-A · 2×1 疾驰圣骑 · 先攻 + 冲锋增伤）64×72 HD 像素精灵绘谱
 * 真骑乘构型！高大雪白圣翼天马 + 深红高桥马鞍 + 清晰弯曲重铠腿踩马镫 + 左手拉缰绳 + 鎏金羽盔圣骑士高擎御柱长枪！
 */

import { SPRITE_PART, type HdPixelPainter } from '../../hdPixelEngine';
import type { RigPose, SpriteRigSpec } from '../../voxelSprites';
import { drawSeraphWingSide64, HD_BASE } from './helpers';

export const creatureOnbashiraSteedSpec: SpriteRigSpec = {
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
};

/**
 * 新一代 64×72 纯代码精雕像素立绘引擎 v3（聚合转发入口）
 * 底层光栅化与语义 Sel-out 管线已拆分至 src/renderer/pixelEngine/rasterizer.ts，
 * 3/4 侧身萌系精雕积木已拆分至 src/renderer/pixelEngine/animePrimitives.ts。
 */

export {
  HD_ORIGIN_X,
  HD_ORIGIN_Y,
  HD_RENDER_SCALE,
  HD_SPRITE_HEIGHT,
  HD_SPRITE_WIDTH,
  renderHdRigFrameToRgba,
  SPRITE_PART,
  type HdPixelPainter,
  type SpritePartId,
} from './pixelEngine/rasterizer';

export {
  drawCleanAnimeHair64,
  drawCleanAnimeSkirt64,
  drawCuteRibbonBow64,
  drawGothicBatWings64,
  drawKawaiiHead64,
  drawPuffSleeve64,
  drawSlashArc64,
  drawSoftChibiArm64,
  drawStaggeredLegs64,
  type CleanAnimeHairOptions,
  type CleanAnimeSkirtOptions,
  type KawaiiHeadOptions,
} from './pixelEngine/animePrimitives';

/**
 * 100% 纯代码零静态资源 · 骨骼解构多状态动画像素立绘引擎聚合转发入口
 *
 * 具体实现已按职责拆分至 `./sprites/voxel/` 目录：
 * - `types.ts`：核心类型定义与默认画布锚点常量
 * - `painter.ts`：动作姿态序列、少女五官画笔、离屏光栅化、外轮廓与背景烘焙辅助
 * - `heroBlueprints.ts` / `creatureBlueprints.ts` / `constructBlueprints.ts` / `coreBlueprints.ts`：内置 9 位基础角色与兵种骨骼绘谱
 * - `baker.ts`：HD/阵营蓝图装配、多状态像素纹理烘焙与立绘/头像导出缓存
 */

export type {
  BakedVoxelSpriteSet,
  PixelPainter,
  RigPose,
  SpriteAnimState,
  SpriteFrameTextures,
  SpriteRigSpec,
} from './sprites/voxel/types';

export { drawChibiFaceEyes } from './sprites/voxel/painter';

export { RIG_SPECS } from './sprites/voxel/coreBlueprints';

export {
  getBakedVoxelSpriteSet,
  getVoxelAvatarDataUrl,
  getVoxelPortraitDataUrl,
  getVoxelPortraitFrames,
  getVoxelSpriteSpecForAudit,
} from './sprites/voxel/baker';

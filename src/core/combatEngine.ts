/**
 * HoMM4 核心六边形战斗引擎聚合导出入口
 *
 * 各子系统已按职责拆解至 `./combat/` 子目录：
 * - `types.ts`：战斗目录、布阵槽位、初始化参数与士气幸运概率类型
 * - `spatial.ts`：多格占位、空间距离、尸体/目标查找、可达图与贴脸寻位
 * - `turnQueue.ts`：士气/幸运检定、三层出手队列、胜负检查
 * - `heroBuild.ts`：战前英雄技能树配点、进阶职业切换与派生同步
 * - `battleSetup.ts`：英雄与兵种实例化及 `createBattleState`
 * - `terrainAndTrajectory.ts`：地形战术说明、视线阻挡诊断、弹道预览与远程反击判定
 * - `damage.ts`：伤害公式、伤害落地、攻击预览、随机掷骰与命中特技
 * - `turnFlow.ts`：回合推进、控场跳过与新回合状态结算
 * - `commands.ts`：`dispatchCombatCommand` 指令总调度
 */

export {
  allocateHpPoolToStack,
  canPlaceFootprintAt,
  evaluateIllusionSpell,
  findStackableSummonUnit,
  getAvailableCorpseHp,
  getCasterSchoolRank,
  getEffectiveSpellManaCost,
  getEffectiveSpellRange,
  getNecromancyCorpseRejection,
  isTargetResistingHostileSpell,
  isUnitOnHighlandPlatform,
  mergeHpPoolIntoExistingStack,
  validateCorpseSpellTarget,
} from './h4SpellExecutor';

export { createBattleState } from './combat/battleSetup';
export { dispatchCombatCommand } from './combat/commands';
export {
  AREA_RANGED_RADIUS,
  canUnitRetaliateThisRound,
  computeLightningStrikeDamage,
  computePoisonAttackDamage,
  computeStoneGazeCreatureKills,
  computeStoneGazeHeroDamage,
  computeStoneGazeThreshold,
  hasDoubleStrikeForMode,
  LIGHTNING_STRIKE_DAMAGE_PER_UNIT,
  POISON_ATTACK_DAMAGE_PER_UNIT,
  previewAreaRangedAttack,
  previewAttack,
  STONE_GAZE_THRESHOLD_PER_UNIT,
  STONE_GAZE_TRIGGER_CHANCE,
} from './combat/damage';
export {
  applyHeroBaseClassTemplate,
  canModifyHeroClassOrBuild,
  selectHeroAdvancedClass,
  setHeroPrimarySkillRank,
  setHeroSecondarySkillRank,
  syncHeroDerivedState,
} from './combat/heroBuild';
export {
  findBestMeleeApproachHex,
  findCorpseTargetAtHex,
  findUnitAtHex,
  getUnitMinDistance,
  getUnitOccupiedHexes,
  getUnitReachableMap,
  getValidMeleeApproachAnchors,
  isEngagedInMelee,
} from './combat/spatial';
export {
  buildAreaRangedTrajectoryPreview,
  buildRangedTrajectoryPreview,
  buildSpellTrajectoryPreview,
  checkAreaRangedCapability,
  checkRangedCapability,
  checkSpellLineOfSight,
  diagnoseTrajectoryBlockers,
  evaluateRangedRetaliation,
  getTerrainTacticalInfo,
} from './combat/terrainAndTrajectory';
export { computeMoraleLuckRates } from './combat/turnQueue';
export type {
  ArmyPlacementSlot,
  CombatContentCatalog,
  CreateBattleOptions,
  MoraleLuckRates,
} from './combat/types';

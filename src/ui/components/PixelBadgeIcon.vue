<script setup lang="ts">
/**
 * 100% 纯代码 16×16 雕刻像素图标库（特技 / 属性 / 法术 / 主技能 / 神器 / 药水统一复用）
 * 严格使用 shape-rendering="crispEdges"，与暗夜和风卷轴 UI 浑然一体。
 */
defineProps<{
  name: string;
  sizeClass?: string;
}>();
</script>

<template>
  <svg
    viewBox="0 0 16 16"
    shape-rendering="crispEdges"
    :class="sizeClass ?? 'h-6 w-6'"
  >
    <!-- ===== 一、H4 单位特技图标 ===== -->
    <!-- 飞行：振翅青翼 -->
    <template v-if="name === 'flying' || name === 'spd_fly'">
      <rect x="1" y="3" width="5" height="2" fill="#c2fbff" />
      <rect x="2" y="5" width="5" height="2" fill="#6be2ff" />
      <rect x="3" y="7" width="4" height="2" fill="#32b0eb" />
      <rect x="10" y="3" width="5" height="2" fill="#c2fbff" />
      <rect x="9" y="5" width="5" height="2" fill="#6be2ff" />
      <rect x="9" y="7" width="4" height="2" fill="#32b0eb" />
      <rect x="7" y="4" width="2" height="8" fill="#ffe680" />
      <rect x="7" y="5" width="2" height="3" fill="#ffffff" />
    </template>

    <!-- 先攻：闪电快刃 -->
    <template v-else-if="name === 'firstStrike'">
      <rect x="9" y="1" width="4" height="2" fill="#fff7b8" />
      <rect x="7" y="3" width="4" height="2" fill="#ffe066" />
      <rect x="4" y="5" width="8" height="2" fill="#ffffff" />
      <rect x="6" y="7" width="5" height="2" fill="#ffd447" />
      <rect x="4" y="9" width="5" height="2" fill="#ffae33" />
      <rect x="3" y="11" width="4" height="2" fill="#ff8533" />
      <rect x="2" y="13" width="2" height="2" fill="#ff5c33" />
    </template>

    <!-- 远程先攻：雷电神弓迅矢 -->
    <template v-else-if="name === 'rangedFirstStrike'">
      <rect x="3" y="2" width="3" height="2" fill="#ffe066" />
      <rect x="2" y="4" width="2" height="8" fill="#e8b84a" />
      <rect x="3" y="12" width="3" height="2" fill="#ffe066" />
      <rect x="5" y="4" width="1" height="8" fill="#fff3c4" />
      <rect x="4" y="7" width="8" height="2" fill="#70f0ff" />
      <rect x="11" y="5" width="2" height="6" fill="#ffe878" />
      <rect x="13" y="7" width="2" height="2" fill="#ffffff" />
      <rect x="8" y="2" width="3" height="2" fill="#fff7b8" />
      <rect x="7" y="4" width="3" height="2" fill="#ffd447" />
      <rect x="7" y="10" width="3" height="2" fill="#ffd447" />
      <rect x="9" y="12" width="3" height="2" fill="#ff9e33" />
    </template>

    <!-- 不受反击：碎裂紫盾 -->
    <template v-else-if="name === 'noRetaliation'">
      <rect x="3" y="2" width="4" height="9" fill="#9c6eff" />
      <rect x="9" y="2" width="4" height="9" fill="#7c4dff" />
      <rect x="4" y="11" width="3" height="2" fill="#6838d9" />
      <rect x="9" y="11" width="3" height="2" fill="#592cc4" />
      <!-- 中央闪电劈裂 -->
      <rect x="7" y="1" width="2" height="4" fill="#ffe680" />
      <rect x="6" y="5" width="2" height="4" fill="#ffffff" />
      <rect x="8" y="9" width="2" height="5" fill="#ffe680" />
    </template>

    <!-- 无限反击：回旋双剑盾 -->
    <template v-else-if="name === 'unlimitedRetaliation'">
      <rect x="4" y="2" width="8" height="2" fill="#ffd866" />
      <rect x="2" y="4" width="2" height="5" fill="#ffad42" />
      <rect x="12" y="7" width="2" height="5" fill="#ffad42" />
      <rect x="4" y="12" width="8" height="2" fill="#ffd866" />
      <rect x="11" y="1" width="3" height="3" fill="#fff5b8" />
      <rect x="2" y="12" width="3" height="3" fill="#fff5b8" />
      <rect x="6" y="5" width="4" height="6" fill="#e65c4f" />
      <rect x="7" y="6" width="2" height="4" fill="#ffe699" />
    </template>

    <!-- 远程射击/互射 -->
    <template v-else-if="name === 'ranged' || name === 'range'">
      <rect x="4" y="2" width="3" height="2" fill="#e8c068" />
      <rect x="2" y="4" width="2" height="8" fill="#e8c068" />
      <rect x="4" y="12" width="3" height="2" fill="#e8c068" />
      <rect x="6" y="4" width="1" height="8" fill="#b8cce8" />
      <rect x="5" y="7" width="7" height="2" fill="#82c4ff" />
      <rect x="12" y="6" width="2" height="4" fill="#ffffff" />
    </template>

    <!-- 近战禁手：断剑红叉 -->
    <template v-else-if="name === 'noMelee'">
      <rect x="4" y="10" width="3" height="3" fill="#9ca8bf" />
      <rect x="6" y="8" width="3" height="3" fill="#cfd8eb" />
      <rect x="9" y="4" width="3" height="3" fill="#eef4ff" />
      <!-- 猩红禁手叉 -->
      <rect x="2" y="2" width="3" height="2" fill="#ff4763" />
      <rect x="4" y="4" width="3" height="2" fill="#ff4763" />
      <rect x="7" y="7" width="3" height="2" fill="#ff4763" />
      <rect x="10" y="10" width="3" height="2" fill="#ff4763" />
      <rect x="12" y="12" width="2" height="2" fill="#ff4763" />
      <rect x="11" y="2" width="3" height="2" fill="#ff6b81" />
      <rect x="2" y="12" width="3" height="2" fill="#ff6b81" />
    </template>

    <!-- 远程禁手：折弓红叉 -->
    <template v-else-if="name === 'noRanged'">
      <rect x="3" y="3" width="2" height="4" fill="#c9a152" />
      <rect x="3" y="9" width="2" height="4" fill="#c9a152" />
      <rect x="6" y="7" width="3" height="2" fill="#ffb866" />
      <rect x="10" y="8" width="3" height="2" fill="#ff8547" />
      <rect x="2" y="2" width="3" height="2" fill="#ff4763" />
      <rect x="5" y="5" width="3" height="2" fill="#ff4763" />
      <rect x="8" y="8" width="3" height="2" fill="#ff4763" />
      <rect x="11" y="11" width="3" height="2" fill="#ff4763" />
    </template>

    <!-- 近战无衰减：翠金剑盾 -->
    <template v-else-if="name === 'noMeleePenalty'">
      <rect x="2" y="11" width="3" height="3" fill="#c99542" />
      <rect x="4" y="9" width="3" height="3" fill="#ffe066" />
      <rect x="6" y="7" width="3" height="3" fill="#7cf5ae" />
      <rect x="8" y="5" width="3" height="3" fill="#c2ffdc" />
      <rect x="11" y="2" width="3" height="3" fill="#ffffff" />
    </template>

    <!-- 攻城破墙巨像：重锤破壁 -->
    <template v-else-if="name === 'siegeBreaker'">
      <rect x="2" y="9" width="4" height="5" fill="#707891" />
      <rect x="10" y="9" width="4" height="5" fill="#707891" />
      <rect x="4" y="2" width="8" height="5" fill="#e87a3e" />
      <rect x="5" y="3" width="6" height="3" fill="#ffd466" />
      <rect x="7" y="7" width="2" height="7" fill="#c48d3b" />
    </template>

    <!-- 高阶魔免：反魔菱盾 -->
    <template v-else-if="name === 'magicImmune'">
      <rect x="6" y="1" width="4" height="2" fill="#e6ccff" />
      <rect x="4" y="3" width="8" height="2" fill="#b875ff" />
      <rect x="2" y="5" width="12" height="6" fill="#8b42e6" />
      <rect x="4" y="11" width="8" height="2" fill="#b875ff" />
      <rect x="6" y="13" width="4" height="2" fill="#e6ccff" />
      <rect x="6" y="6" width="4" height="4" fill="#ffffff" />
    </template>

    <!-- 暗系特质：幽紫蚀月冥核（小尺寸亦极高辨识度） -->
    <template v-else-if="name === 'darkNature'">
      <rect x="4" y="2" width="8" height="2" fill="#9c75ff" />
      <rect x="2" y="4" width="4" height="8" fill="#8254eb" />
      <rect x="4" y="12" width="8" height="2" fill="#9c75ff" />
      <rect x="6" y="4" width="4" height="8" fill="#462285" />
      <rect x="10" y="5" width="3" height="6" fill="#231042" />
      <rect x="4" y="6" width="3" height="4" fill="#e5d4ff" />
      <rect x="11" y="7" width="2" height="2" fill="#ff7ad9" />
    </template>

    <!-- 二连击 -->
    <template v-else-if="name === 'doubleStrike'">
      <rect x="2" y="11" width="2" height="3" fill="#d99e42" />
      <rect x="4" y="8" width="3" height="3" fill="#ffe680" />
      <rect x="7" y="5" width="3" height="3" fill="#ffffff" />
      <rect x="12" y="11" width="2" height="3" fill="#d99e42" />
      <rect x="9" y="8" width="3" height="3" fill="#ffe680" />
      <rect x="6" y="5" width="3" height="3" fill="#fff5cc" />
    </template>

    <!-- 破先攻：碎电盾枪 -->
    <template v-else-if="name === 'negateFirstStrike'">
      <rect x="3" y="3" width="10" height="10" fill="#543828" />
      <rect x="4" y="4" width="8" height="8" fill="#c98642" />
      <rect x="7" y="2" width="2" height="12" fill="#ffe699" />
      <rect x="2" y="7" width="12" height="2" fill="#ff596e" />
    </template>

    <!-- 精准射击：无衰减靶心长箭 -->
    <template v-else-if="name === 'longRange'">
      <rect x="5" y="2" width="6" height="2" fill="#5ce6b8" />
      <rect x="2" y="5" width="2" height="6" fill="#5ce6b8" />
      <rect x="12" y="5" width="2" height="6" fill="#5ce6b8" />
      <rect x="5" y="12" width="6" height="2" fill="#5ce6b8" />
      <rect x="6" y="6" width="4" height="4" fill="#ffe478" />
      <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
    </template>

    <!-- 短程弹幕 -->
    <template v-else-if="name === 'shortRange'">
      <rect x="2" y="6" width="6" height="4" fill="#f09c5a" />
      <rect x="8" y="4" width="2" height="8" fill="#ffe082" />
      <rect x="11" y="5" width="2" height="2" fill="#ff664d" />
      <rect x="11" y="9" width="2" height="2" fill="#ff664d" />
    </template>

    <!-- 无视障碍射击：穿透青矢 -->
    <template v-else-if="name === 'noObstaclePenalty'">
      <rect x="7" y="2" width="2" height="12" fill="#576985" />
      <rect x="2" y="7" width="10" height="2" fill="#70d4ff" />
      <rect x="10" y="5" width="4" height="6" fill="#ffffff" />
      <rect x="6" y="6" width="4" height="4" fill="#a8ecff" />
    </template>

    <!-- 无限弹药：无穷金环 -->
    <template v-else-if="name === 'unlimitedShots'">
      <rect x="2" y="5" width="5" height="6" fill="#b885ff" />
      <rect x="9" y="5" width="5" height="6" fill="#b885ff" />
      <rect x="4" y="7" width="2" height="2" fill="#181026" />
      <rect x="10" y="7" width="2" height="2" fill="#181026" />
      <rect x="7" y="6" width="2" height="4" fill="#ffe885" />
    </template>

    <!-- 冲锋增伤：疾驰金枪 -->
    <template v-else-if="name === 'charge'">
      <rect x="1" y="10" width="5" height="2" fill="#ff9d42" />
      <rect x="2" y="7" width="7" height="2" fill="#ffe066" />
      <rect x="4" y="4" width="6" height="2" fill="#ff9d42" />
      <rect x="9" y="5" width="4" height="6" fill="#ffe680" />
      <rect x="13" y="6" width="2" height="4" fill="#ffffff" />
    </template>

    <!-- 抗死结界：圣光菱盾 -->
    <template v-else-if="name === 'deathWard'">
      <rect x="4" y="2" width="8" height="12" fill="#d9b452" />
      <rect x="5" y="3" width="6" height="10" fill="#fff3c4" />
      <rect x="7" y="4" width="2" height="8" fill="#e64c65" />
      <rect x="5" y="6" width="6" height="2" fill="#e64c65" />
    </template>

    <!-- 绝对格挡：闪耀铁圆盾 -->
    <template v-else-if="name === 'block'">
      <rect x="4" y="2" width="8" height="12" fill="#669ce0" />
      <rect x="2" y="4" width="12" height="8" fill="#669ce0" />
      <rect x="4" y="4" width="8" height="8" fill="#b8e0ff" />
      <rect x="6" y="6" width="4" height="4" fill="#ffffff" />
    </template>

    <!-- 符箓定身：镇魔符星 -->
    <template v-else-if="name === 'stunOnHit'">
      <rect x="4" y="2" width="8" height="12" fill="#f7eed8" />
      <rect x="5" y="3" width="6" height="10" fill="#ffe885" />
      <rect x="7" y="4" width="2" height="5" fill="#d92b45" />
      <rect x="7" y="10" width="2" height="2" fill="#d92b45" />
    </template>

    <!-- 噩梦震慑：猩红魔瞳 -->
    <template v-else-if="name === 'terrorOnHit'">
      <rect x="2" y="5" width="12" height="6" fill="#8f2454" />
      <rect x="4" y="4" width="8" height="8" fill="#d93870" />
      <rect x="6" y="5" width="4" height="6" fill="#ffe066" />
      <rect x="7" y="5" width="2" height="6" fill="#170a14" />
    </template>

    <!-- 魔眼石化：紫晶魔眼 -->
    <template v-else-if="name === 'stoneGaze'">
      <rect x="2" y="6" width="12" height="4" fill="#9c52e0" />
      <rect x="4" y="4" width="8" height="8" fill="#c78cff" />
      <rect x="6" y="6" width="4" height="4" fill="#211230" />
      <rect x="7" y="7" width="2" height="2" fill="#fff0ff" />
    </template>

    <!-- 烈焰护盾：火环护盾 -->
    <template v-else-if="name === 'fireShield'">
      <rect x="3" y="2" width="10" height="2" fill="#ff6626" />
      <rect x="2" y="4" width="2" height="8" fill="#ff8f33" />
      <rect x="12" y="4" width="2" height="8" fill="#ff8f33" />
      <rect x="4" y="12" width="8" height="2" fill="#ff6626" />
      <rect x="5" y="5" width="6" height="6" fill="#ffd952" />
      <rect x="7" y="6" width="2" height="4" fill="#ffffff" />
    </template>

    <!-- 炽焰抗性 -->
    <template v-else-if="name === 'fireResistant'">
      <rect x="6" y="2" width="4" height="4" fill="#ff7b33" />
      <rect x="4" y="5" width="8" height="7" fill="#d94226" />
      <rect x="6" y="7" width="4" height="4" fill="#ffe680" />
      <rect x="2" y="12" width="12" height="2" fill="#70b8ff" />
    </template>

    <!-- 混沌抗性：护金混沌纹盾 -->
    <template v-else-if="name === 'chaosResistant'">
      <rect x="3" y="2" width="10" height="8" fill="#593c14" />
      <rect x="4" y="3" width="8" height="6" fill="#d69c38" />
      <rect x="5" y="10" width="6" height="3" fill="#a87324" />
      <rect x="7" y="13" width="2" height="1" fill="#7d5218" />
      <rect x="6" y="4" width="4" height="4" fill="#ff594d" />
      <rect x="7" y="5" width="2" height="2" fill="#fff2ad" />
    </template>

    <!-- 雷电抗性：避雷苍盾 -->
    <template v-else-if="name === 'lightningResistant'">
      <rect x="3" y="2" width="10" height="8" fill="#1c3e66" />
      <rect x="4" y="3" width="8" height="6" fill="#5ca9e6" />
      <rect x="5" y="10" width="6" height="3" fill="#3a7ab8" />
      <rect x="8" y="3" width="3" height="2" fill="#fff4a8" />
      <rect x="6" y="5" width="4" height="2" fill="#ffffff" />
      <rect x="7" y="7" width="3" height="3" fill="#ffe066" />
    </template>

    <!-- 巨人杀手：破巨星石弹弧 -->
    <template v-else-if="name === 'giantSlayer'">
      <rect x="9" y="2" width="5" height="5" fill="#9c4242" />
      <rect x="10" y="3" width="3" height="3" fill="#e06652" />
      <rect x="2" y="10" width="4" height="4" fill="#c78c44" />
      <rect x="4" y="8" width="4" height="2" fill="#ffe073" />
      <rect x="6" y="6" width="4" height="2" fill="#ffffff" />
      <rect x="11" y="4" width="2" height="2" fill="#fff5b8" />
    </template>

    <!-- 净秽裁决：月都苍蓝准星圣光 -->
    <template v-else-if="name === 'orderPurgeRanged'">
      <rect x="7" y="1" width="2" height="14" fill="#7cc8ff" />
      <rect x="1" y="7" width="14" height="2" fill="#7cc8ff" />
      <rect x="4" y="4" width="8" height="8" fill="#2c5ba8" />
      <rect x="5" y="5" width="6" height="6" fill="#9be4ff" />
      <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
    </template>

    <!-- 周身全扫：环形旋刃 -->
    <template v-else-if="name === 'multipleAttack'">
      <rect x="4" y="2" width="8" height="2" fill="#ff9452" />
      <rect x="2" y="4" width="2" height="8" fill="#ffd466" />
      <rect x="12" y="4" width="2" height="8" fill="#ffd466" />
      <rect x="4" y="12" width="8" height="2" fill="#ff9452" />
      <rect x="6" y="6" width="4" height="4" fill="#ffffff" />
    </template>

    <!-- 贯穿吐息：红莲龙息 -->
    <template v-else-if="name === 'breathAttack'">
      <rect x="2" y="6" width="4" height="4" fill="#fff0a6" />
      <rect x="5" y="4" width="5" height="8" fill="#ff7b26" />
      <rect x="9" y="2" width="5" height="12" fill="#e62e42" />
      <rect x="8" y="6" width="5" height="4" fill="#ffe066" />
    </template>

    <!-- 深渊全图瞬移：绯红隙间裂瞳 -->
    <template v-else-if="name === 'globalTeleport'">
      <rect x="1" y="5" width="14" height="6" fill="#590d32" />
      <rect x="3" y="4" width="10" height="8" fill="#d92666" />
      <rect x="5" y="5" width="6" height="6" fill="#ffe066" />
      <rect x="7" y="5" width="2" height="6" fill="#1a0510" />
      <rect x="2" y="2" width="2" height="2" fill="#ff70a6" />
      <rect x="12" y="12" width="2" height="2" fill="#ff70a6" />
    </template>

    <!-- 骸骨体质：白骨防矢盾 -->
    <template v-else-if="name === 'skeletal'">
      <rect x="4" y="2" width="8" height="7" fill="#ede8fa" />
      <rect x="5" y="9" width="6" height="4" fill="#cfc7e6" />
      <rect x="5" y="4" width="2" height="2" fill="#2e2447" />
      <rect x="9" y="4" width="2" height="2" fill="#2e2447" />
      <rect x="6" y="11" width="1" height="2" fill="#2e2447" />
      <rect x="9" y="11" width="1" height="2" fill="#2e2447" />
    </template>

    <!-- 虚无体质：半透明灵雾环 -->
    <template v-else-if="name === 'insubstantial'">
      <rect x="4" y="2" width="8" height="9" fill="#78e8ff" />
      <rect x="5" y="3" width="6" height="7" fill="#e8fbff" />
      <rect x="3" y="11" width="3" height="3" fill="#9c80ff" />
      <rect x="7" y="11" width="3" height="2" fill="#78e8ff" />
      <rect x="11" y="11" width="2" height="3" fill="#9c80ff" />
    </template>

    <!-- 魔力吸取：紫晶吸灵涡 -->
    <template v-else-if="name === 'manaLeech'">
      <rect x="6" y="2" width="4" height="12" fill="#8e42d9" />
      <rect x="2" y="6" width="12" height="4" fill="#b86bff" />
      <rect x="5" y="5" width="6" height="6" fill="#70ebff" />
      <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
    </template>

    <!-- 衰老触碰：幽紫枯萎沙漏 -->
    <template v-else-if="name === 'agingOnHit'">
      <rect x="4" y="2" width="8" height="2" fill="#c79eff" />
      <rect x="5" y="4" width="6" height="3" fill="#7842b8" />
      <rect x="7" y="7" width="2" height="2" fill="#ffe085" />
      <rect x="5" y="9" width="6" height="3" fill="#9c66e0" />
      <rect x="4" y="12" width="8" height="2" fill="#c79eff" />
    </template>

    <!-- 三翼裂袭：三道赤红爪痕 -->
    <template v-else-if="name === 'threeHeadedAttack'">
      <rect x="2" y="3" width="2" height="9" fill="#ff4d6b" />
      <rect x="3" y="5" width="2" height="7" fill="#ffd466" />
      <rect x="7" y="2" width="2" height="11" fill="#ff3355" />
      <rect x="11" y="4" width="2" height="9" fill="#ff4d6b" />
      <rect x="12" y="6" width="2" height="7" fill="#ffd466" />
    </template>

    <!-- 吸血复苏：绯红血珠獠牙 -->
    <template v-else-if="name === 'lifeDraining'">
      <rect x="3" y="2" width="10" height="2" fill="#ff4d79" />
      <rect x="4" y="4" width="3" height="6" fill="#ffffff" />
      <rect x="9" y="4" width="3" height="6" fill="#ffffff" />
      <rect x="5" y="11" width="2" height="3" fill="#e61c48" />
      <rect x="10" y="11" width="2" height="3" fill="#e61c48" />
    </template>

    <!-- 剧毒喷射：翠绿毒珠 -->
    <template v-else-if="name === 'poisonAttack'">
      <rect x="6" y="2" width="4" height="3" fill="#b8ff85" />
      <rect x="4" y="5" width="8" height="7" fill="#4cd945" />
      <rect x="6" y="6" width="4" height="4" fill="#c8ff8c" />
      <rect x="11" y="3" width="3" height="3" fill="#b86bff" />
    </template>

    <!-- 死灵恐惧：紫焰骷髅龙眼 -->
    <template v-else-if="name === 'fearAttack'">
      <rect x="2" y="4" width="12" height="8" fill="#3a1659" />
      <rect x="4" y="5" width="8" height="6" fill="#9c42e6" />
      <rect x="6" y="6" width="4" height="4" fill="#80f5ff" />
      <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
    </template>

    <!-- 抗生结界：绯暗反圣盾 -->
    <template v-else-if="name === 'lifeWard'">
      <rect x="4" y="2" width="8" height="12" fill="#4d1236" />
      <rect x="5" y="3" width="6" height="10" fill="#c72e6b" />
      <rect x="7" y="4" width="2" height="8" fill="#ffe085" />
      <rect x="5" y="6" width="6" height="2" fill="#ffe085" />
    </template>

    <!-- 寒冰抗性：冰晶雪盾 -->
    <template v-else-if="name === 'coldResistant'">
      <rect x="3" y="2" width="10" height="9" fill="#1e4d8c" />
      <rect x="4" y="3" width="8" height="7" fill="#66d4ff" />
      <rect x="6" y="11" width="4" height="3" fill="#3b82cc" />
      <rect x="7" y="4" width="2" height="5" fill="#ffffff" />
      <rect x="5" y="6" width="6" height="1" fill="#ffffff" />
    </template>

    <!-- 寒霜冻结：冰棱结晶 -->
    <template v-else-if="name === 'freezingAttack'">
      <rect x="7" y="1" width="2" height="14" fill="#78e8ff" />
      <rect x="2" y="7" width="12" height="2" fill="#78e8ff" />
      <rect x="4" y="4" width="8" height="8" fill="#4ca6f0" />
      <rect x="6" y="6" width="4" height="4" fill="#ffffff" />
    </template>

    <!-- 机械/器灵构造体：黄铜齿轮 -->
    <template v-else-if="name === 'mechanical'">
      <rect x="6" y="1" width="4" height="14" fill="#9fb0c9" />
      <rect x="1" y="6" width="14" height="4" fill="#9fb0c9" />
      <rect x="3" y="3" width="10" height="10" fill="#c2d1e6" />
      <rect x="6" y="6" width="4" height="4" fill="#232a3b" />
    </template>

    <!-- 不死/亡灵：幽冥骷髅与紫魂火 -->
    <template v-else-if="name === 'undead'">
      <rect x="4" y="2" width="8" height="2" fill="#e6dcff" />
      <rect x="3" y="4" width="10" height="6" fill="#d3c4f5" />
      <rect x="5" y="10" width="6" height="4" fill="#b39ce0" />
      <rect x="5" y="6" width="2" height="2" fill="#221036" />
      <rect x="9" y="6" width="2" height="2" fill="#221036" />
      <rect x="5" y="6" width="1" height="1" fill="#80ffaa" />
      <rect x="9" y="6" width="1" height="1" fill="#80ffaa" />
      <rect x="7" y="9" width="2" height="1" fill="#2b1742" />
      <rect x="6" y="12" width="1" height="2" fill="#2b1742" />
      <rect x="9" y="12" width="1" height="2" fill="#2b1742" />
    </template>

    <!-- 元素/纯灵：四灵棱晶核 -->
    <template v-else-if="name === 'elemental'">
      <rect x="7" y="1" width="2" height="2" fill="#ff9452" />
      <rect x="5" y="3" width="6" height="3" fill="#ffe066" />
      <rect x="2" y="6" width="4" height="4" fill="#5ce6d8" />
      <rect x="10" y="6" width="4" height="4" fill="#ff6678" />
      <rect x="5" y="10" width="6" height="3" fill="#52b8ff" />
      <rect x="7" y="13" width="2" height="2" fill="#3885e6" />
      <rect x="6" y="6" width="4" height="4" fill="#ffffff" />
    </template>

    <!-- 幻象分身：青白虚影双棱镜 -->
    <template v-else-if="name === 'illusion'">
      <rect x="3" y="3" width="6" height="10" fill="#4aa6cc" />
      <rect x="4" y="4" width="4" height="8" fill="#8ce8ff" />
      <rect x="7" y="2" width="6" height="12" fill="#6fd4f2" />
      <rect x="8" y="4" width="4" height="8" fill="#d9f9ff" />
      <rect x="9" y="6" width="2" height="4" fill="#ffffff" />
    </template>

    <!-- 影遁潜行：幽月影兜 -->
    <template v-else-if="name === 'stealth'">
      <rect x="5" y="2" width="6" height="4" fill="#6b4bb8" />
      <rect x="3" y="6" width="10" height="8" fill="#462e82" />
      <rect x="5" y="7" width="2" height="2" fill="#ffe466" />
      <rect x="9" y="7" width="2" height="2" fill="#ffe466" />
    </template>

    <!-- 施法兵种：星辰法杖 -->
    <template v-else-if="name === 'spellcaster'">
      <rect x="3" y="10" width="3" height="4" fill="#b8843b" />
      <rect x="6" y="7" width="3" height="4" fill="#d9a652" />
      <rect x="9" y="3" width="4" height="5" fill="#6eb8ff" />
      <rect x="10" y="4" width="2" height="3" fill="#ffffff" />
    </template>

    <!-- 长武器（H4 稀有隔格长手突刺）：斜举翠金长枪 -->
    <template v-else-if="name === 'longWeapon'">
      <rect x="2" y="12" width="2" height="2" fill="#9c6838" />
      <rect x="4" y="10" width="2" height="2" fill="#c78a4a" />
      <rect x="6" y="8" width="2" height="2" fill="#e6b05c" />
      <rect x="8" y="6" width="2" height="2" fill="#ffe073" />
      <rect x="10" y="3" width="3" height="3" fill="#7ff2c9" />
      <rect x="12" y="1" width="3" height="3" fill="#ffffff" />
      <rect x="9" y="5" width="2" height="2" fill="#ff5773" />
    </template>

    <!-- 战场苏生：金羽十字圣光 -->
    <template v-else-if="name === 'resurrection'">
      <rect x="6" y="1" width="4" height="14" fill="#ffe478" />
      <rect x="2" y="5" width="12" height="4" fill="#ffe478" />
      <rect x="7" y="2" width="2" height="12" fill="#ffffff" />
      <rect x="4" y="6" width="8" height="2" fill="#ffffff" />
    </template>

    <!-- 防御姿态 -->
    <template v-else-if="name === 'defending' || name === 'def'">
      <rect x="3" y="2" width="10" height="2" fill="#e8c068" />
      <rect x="3" y="4" width="10" height="6" fill="#5280b8" />
      <rect x="4" y="10" width="8" height="2" fill="#3c6294" />
      <rect x="6" y="12" width="4" height="2" fill="#2c4970" />
      <rect x="7" y="4" width="2" height="7" fill="#ffe699" />
      <rect x="5" y="6" width="6" height="2" fill="#ffe699" />
    </template>

    <!-- 符卡领域大阵 -->
    <template v-else-if="name === 'aura' || name === 'spell_card'">
      <rect x="5" y="1" width="6" height="2" fill="#ffe066" />
      <rect x="5" y="13" width="6" height="2" fill="#ffe066" />
      <rect x="1" y="5" width="2" height="6" fill="#ffe066" />
      <rect x="13" y="5" width="2" height="6" fill="#ffe066" />
      <rect x="4" y="4" width="8" height="8" fill="#e64c65" />
      <rect x="6" y="6" width="4" height="4" fill="#fff6cc" />
    </template>

    <!-- 增益 / 减益 -->
    <template v-else-if="name === 'buff'">
      <rect x="7" y="2" width="2" height="12" fill="#6bf2a8" />
      <rect x="5" y="4" width="6" height="2" fill="#b8ffd9" />
      <rect x="3" y="6" width="10" height="2" fill="#6bf2a8" />
    </template>
    <template v-else-if="name === 'debuff'">
      <rect x="7" y="2" width="2" height="12" fill="#d975ff" />
      <rect x="3" y="8" width="10" height="2" fill="#d975ff" />
      <rect x="5" y="10" width="6" height="2" fill="#f0c4ff" />
    </template>

    <!-- 英雄固有特质星徽 -->
    <template v-else-if="name === 'trait'">
      <rect x="7" y="1" width="2" height="14" fill="#ffe066" />
      <rect x="1" y="7" width="14" height="2" fill="#ffe066" />
      <rect x="4" y="4" width="8" height="8" fill="#ff5270" />
      <rect x="6" y="6" width="4" height="4" fill="#fff7d6" />
    </template>

    <!-- ===== 二、核心属性图标 ===== -->
    <template v-else-if="name === 'atk' || name === 'combat'">
      <rect x="2" y="11" width="3" height="3" fill="#a86432" />
      <rect x="4" y="9" width="3" height="3" fill="#e8c068" />
      <rect x="6" y="7" width="3" height="3" fill="#d9e5ff" />
      <rect x="8" y="5" width="3" height="3" fill="#ffffff" />
      <rect x="11" y="2" width="3" height="3" fill="#ffe680" />
    </template>
    <template v-else-if="name === 'dmg'">
      <rect x="7" y="1" width="2" height="4" fill="#ff7386" />
      <rect x="7" y="11" width="2" height="4" fill="#ff7386" />
      <rect x="1" y="7" width="4" height="2" fill="#ff7386" />
      <rect x="11" y="7" width="4" height="2" fill="#ff7386" />
      <rect x="5" y="5" width="6" height="6" fill="#ffd859" />
      <rect x="6" y="6" width="4" height="4" fill="#fff7d6" />
    </template>
    <template v-else-if="name === 'hp'">
      <rect x="3" y="4" width="4" height="3" fill="#e64c65" />
      <rect x="9" y="4" width="4" height="3" fill="#e64c65" />
      <rect x="2" y="6" width="12" height="3" fill="#ff6b81" />
      <rect x="4" y="9" width="8" height="2" fill="#e64c65" />
      <rect x="6" y="11" width="4" height="2" fill="#c9364e" />
      <rect x="4" y="5" width="2" height="1" fill="#ffc4ce" />
    </template>
    <template v-else-if="name === 'spd_ground'">
      <rect x="5" y="3" width="6" height="6" fill="#d9a452" />
      <rect x="4" y="9" width="9" height="4" fill="#b87c35" />
      <rect x="6" y="10" width="6" height="2" fill="#ffe099" />
    </template>
    <template v-else-if="name === 'morale'">
      <rect x="2" y="4" width="4" height="3" fill="#ff8f4d" />
      <rect x="10" y="4" width="4" height="3" fill="#ff8f4d" />
      <rect x="5" y="5" width="6" height="5" fill="#ffd859" />
      <rect x="7" y="3" width="2" height="2" fill="#fff6cc" />
      <rect x="6" y="10" width="4" height="3" fill="#d96b38" />
    </template>
    <template v-else-if="name === 'luck'">
      <rect x="6" y="2" width="4" height="4" fill="#6bf29c" />
      <rect x="2" y="6" width="4" height="4" fill="#46cc79" />
      <rect x="10" y="6" width="4" height="4" fill="#46cc79" />
      <rect x="6" y="10" width="4" height="4" fill="#2ea85d" />
      <rect x="6" y="6" width="4" height="4" fill="#b8ffd0" />
    </template>
    <template v-else-if="name === 'ammo'">
      <rect x="4" y="3" width="2" height="10" fill="#d9a452" />
      <rect x="7" y="2" width="2" height="11" fill="#ffe299" />
      <rect x="10" y="3" width="2" height="10" fill="#d9a452" />
      <rect x="3" y="8" width="10" height="4" fill="#6b4a26" />
    </template>
    <template v-else-if="name === 'init'">
      <rect x="8" y="1" width="4" height="3" fill="#fff2a6" />
      <rect x="6" y="4" width="5" height="3" fill="#ffd859" />
      <rect x="5" y="7" width="6" height="2" fill="#ffe680" />
      <rect x="7" y="9" width="4" height="3" fill="#ffad42" />
      <rect x="5" y="12" width="3" height="3" fill="#ff8a3d" />
    </template>
    <template v-else-if="name === 'graze'">
      <rect x="5" y="2" width="6" height="2" fill="#7ff6ff" />
      <rect x="3" y="4" width="2" height="8" fill="#52c8ff" />
      <rect x="11" y="4" width="2" height="8" fill="#52c8ff" />
      <rect x="5" y="12" width="6" height="2" fill="#7ff6ff" />
      <rect x="6" y="6" width="4" height="4" fill="#d6fcff" />
    </template>
    <template v-else-if="name === 'mres'">
      <rect x="7" y="2" width="2" height="12" fill="#cfa6ff" />
      <rect x="2" y="7" width="12" height="2" fill="#cfa6ff" />
      <rect x="5" y="5" width="6" height="6" fill="#8b5cf6" />
      <rect x="6" y="6" width="4" height="4" fill="#f0e3ff" />
    </template>
    <template v-else-if="name === 'sp'">
      <rect x="2" y="4" width="5" height="9" fill="#6f42c1" />
      <rect x="9" y="4" width="5" height="9" fill="#8a5ce6" />
      <rect x="7" y="5" width="2" height="8" fill="#e8c068" />
      <rect x="3" y="5" width="4" height="7" fill="#fff0c4" />
      <rect x="9" y="5" width="4" height="7" fill="#ffe194" />
    </template>
    <template v-else-if="name === 'size'">
      <rect x="3" y="3" width="4" height="4" fill="#ffcf87" />
      <rect x="9" y="3" width="4" height="4" fill="#e89a4d" />
      <rect x="3" y="9" width="4" height="4" fill="#e89a4d" />
      <rect x="9" y="9" width="4" height="4" fill="#ffcf87" />
    </template>
    <template v-else-if="name === 'tier' || name === 'nobility'">
      <rect x="2" y="11" width="12" height="3" fill="#e8b84d" />
      <rect x="3" y="6" width="2" height="5" fill="#ffe073" />
      <rect x="7" y="4" width="2" height="7" fill="#fff2a6" />
      <rect x="11" y="6" width="2" height="5" fill="#ffe073" />
      <rect x="5" y="8" width="6" height="3" fill="#e64c65" />
    </template>
    <template v-else-if="name === 'power'">
      <rect x="3" y="2" width="10" height="12" fill="#d9324e" />
      <rect x="4" y="3" width="8" height="10" fill="#ff5770" />
      <rect x="6" y="4" width="2" height="8" fill="#ffffff" />
      <rect x="8" y="4" width="2" height="4" fill="#ffffff" />
    </template>

    <!-- ===== 三、主技能与装备纸娃娃槽位图标 ===== -->
    <template v-else-if="name === 'tactics'">
      <rect x="3" y="2" width="2" height="12" fill="#e8c068" />
      <rect x="5" y="3" width="8" height="5" fill="#e64c65" />
      <rect x="7" y="4" width="4" height="3" fill="#ffe082" />
    </template>
    <template v-else-if="name === 'scouting'">
      <rect x="4" y="4" width="8" height="8" fill="#329c70" />
      <rect x="6" y="6" width="4" height="4" fill="#b8ffd9" />
      <rect x="7" y="2" width="2" height="2" fill="#ffe066" />
      <rect x="7" y="12" width="2" height="2" fill="#ffe066" />
      <rect x="2" y="7" width="2" height="2" fill="#ffe066" />
      <rect x="12" y="7" width="2" height="2" fill="#ffe066" />
    </template>
    <template v-else-if="name === 'life_magic'">
      <rect x="6" y="2" width="4" height="12" fill="#ff6b81" />
      <rect x="2" y="6" width="12" height="4" fill="#ff6b81" />
      <rect x="6" y="6" width="4" height="4" fill="#fff5cc" />
    </template>
    <template v-else-if="name === 'order_magic'">
      <rect x="4" y="4" width="8" height="8" fill="#5e96ff" />
      <rect x="6" y="6" width="4" height="4" fill="#ffffff" />
      <rect x="7" y="1" width="2" height="3" fill="#a8ccff" />
      <rect x="7" y="12" width="2" height="3" fill="#a8ccff" />
    </template>
    <template v-else-if="name === 'death_magic'">
      <rect x="4" y="3" width="8" height="7" fill="#b89cff" />
      <rect x="5" y="10" width="6" height="3" fill="#8f6be6" />
      <rect x="5" y="5" width="2" height="2" fill="#171226" />
      <rect x="9" y="5" width="2" height="2" fill="#171226" />
    </template>
    <template v-else-if="name === 'chaos_magic'">
      <rect x="6" y="2" width="4" height="4" fill="#ff7043" />
      <rect x="3" y="6" width="10" height="5" fill="#ffd447" />
      <rect x="5" y="11" width="6" height="3" fill="#ff5722" />
      <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
    </template>
    <template v-else-if="name === 'nature_magic'">
      <rect x="7" y="2" width="4" height="4" fill="#5ee39a" />
      <rect x="4" y="5" width="6" height="5" fill="#32b870" />
      <rect x="6" y="10" width="2" height="4" fill="#c48d46" />
    </template>

    <!-- 装备槽图标 -->
    <template v-else-if="name === 'art_weapon'">
      <rect x="3" y="10" width="3" height="4" fill="#9c6838" />
      <rect x="5" y="7" width="3" height="4" fill="#f0c866" />
      <rect x="8" y="3" width="5" height="6" fill="#fff5cc" />
      <rect x="9" y="4" width="3" height="4" fill="#ff6b84" />
    </template>
    <template v-else-if="name === 'art_head'">
      <rect x="2" y="10" width="12" height="2" fill="#3b4266" />
      <rect x="4" y="7" width="8" height="3" fill="#f2ece0" />
      <rect x="5" y="3" width="6" height="4" fill="#4f5a8a" />
      <rect x="7" y="1" width="2" height="2" fill="#ffe066" />
    </template>
    <template v-else-if="name === 'art_armor'">
      <rect x="3" y="3" width="10" height="4" fill="#7c8bb0" />
      <rect x="4" y="7" width="8" height="6" fill="#5b688a" />
      <rect x="7" y="5" width="2" height="6" fill="#ffe082" />
    </template>
    <template v-else-if="name === 'art_accessory'">
      <rect x="5" y="3" width="6" height="10" fill="#ffe078" />
      <rect x="6" y="4" width="4" height="8" fill="#ff4d6d" />
      <rect x="7" y="5" width="2" height="3" fill="#ffffff" />
    </template>
    <template v-else-if="name === 'art_ring'">
      <rect x="5" y="5" width="6" height="2" fill="#e8c068" />
      <rect x="4" y="7" width="2" height="4" fill="#e8c068" />
      <rect x="10" y="7" width="2" height="4" fill="#e8c068" />
      <rect x="5" y="11" width="6" height="2" fill="#e8c068" />
      <rect x="7" y="3" width="2" height="3" fill="#7ff6ff" />
    </template>
    <template v-else-if="name === 'art_set'">
      <rect x="7" y="1" width="2" height="3" fill="#7ff6ff" />
      <rect x="5" y="4" width="6" height="8" fill="#3bb6f0" />
      <rect x="7" y="6" width="2" height="4" fill="#ffffff" />
      <rect x="7" y="12" width="2" height="3" fill="#7ff6ff" />
    </template>

    <!-- 药水图标 -->
    <template v-else-if="name === 'potion_heal' || name === 'potion_mana' || name === 'potion_elixir'">
      <rect x="6" y="2" width="4" height="2" fill="#c79b52" />
      <rect x="7" y="4" width="2" height="2" fill="#cfe2ff" />
      <rect
        x="4"
        y="6"
        width="8"
        height="7"
        :fill="name === 'potion_heal' ? '#d93855' : name === 'potion_mana' ? '#3678e6' : '#c9932b'"
      />
      <rect
        x="5"
        y="7"
        width="6"
        height="5"
        :fill="name === 'potion_heal' ? '#ff6e87' : name === 'potion_mana' ? '#70b3ff' : '#ffe066'"
      />
      <rect x="6" y="8" width="2" height="2" fill="#ffffff" />
    </template>

    <!-- ===== 四、五系法术图标 ===== -->
    <template v-else-if="name === 'spell_heal'">
      <rect x="6" y="2" width="4" height="12" fill="#6bf2a8" />
      <rect x="2" y="6" width="12" height="4" fill="#6bf2a8" />
      <rect x="7" y="4" width="2" height="8" fill="#ebfff4" />
    </template>
    <template v-else-if="name === 'spell_ward'">
      <rect x="4" y="2" width="8" height="2" fill="#ffe082" />
      <rect x="3" y="4" width="10" height="7" fill="#e64c65" />
      <rect x="5" y="11" width="6" height="3" fill="#ffe082" />
      <rect x="6" y="5" width="4" height="4" fill="#fff7d6" />
    </template>
    <template v-else-if="name === 'spell_orb'">
      <rect x="4" y="3" width="8" height="10" fill="#ffe680" />
      <rect x="3" y="4" width="10" height="8" fill="#ff4763" />
      <rect x="8" y="4" width="4" height="4" fill="#fff5cc" />
      <rect x="5" y="8" width="2" height="2" fill="#fff5cc" />
    </template>
    <template v-else-if="name === 'spell_bolt'">
      <rect x="7" y="1" width="2" height="14" fill="#ffe066" />
      <rect x="1" y="7" width="14" height="2" fill="#ffe066" />
      <rect x="4" y="4" width="8" height="8" fill="#ff8f42" />
      <rect x="6" y="6" width="4" height="4" fill="#ffffff" />
    </template>
    <template v-else-if="name === 'spell_aoe'">
      <rect x="6" y="1" width="4" height="4" fill="#ff5722" />
      <rect x="2" y="5" width="12" height="6" fill="#ff9800" />
      <rect x="5" y="4" width="6" height="8" fill="#ffe066" />
      <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
    </template>
    <template v-else-if="name === 'spell_slow'">
      <rect x="4" y="2" width="8" height="2" fill="#94c2ff" />
      <rect x="5" y="4" width="6" height="3" fill="#528cff" />
      <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
      <rect x="5" y="9" width="6" height="3" fill="#528cff" />
      <rect x="4" y="12" width="8" height="2" fill="#94c2ff" />
    </template>
    <template v-else-if="name === 'spell_curse'">
      <rect x="4" y="3" width="8" height="9" fill="#823bd6" />
      <rect x="6" y="5" width="4" height="5" fill="#181226" />
      <rect x="6" y="6" width="1" height="2" fill="#ff6699" />
      <rect x="9" y="6" width="1" height="2" fill="#ff6699" />
    </template>
    <template v-else-if="name === 'spell_haste'">
      <rect x="2" y="4" width="9" height="2" fill="#7ef5b5" />
      <rect x="5" y="7" width="9" height="2" fill="#d9ffeb" />
      <rect x="3" y="10" width="8" height="2" fill="#52d992" />
    </template>
    <!-- 瞬间移动：紫蓝空间裂隙星门 + 闪现残影箭 -->
    <template v-else-if="name === 'teleport'">
      <rect x="2" y="4" width="3" height="8" fill="#7c52d9" />
      <rect x="3" y="5" width="1" height="6" fill="#d9c2ff" />
      <rect x="11" y="4" width="3" height="8" fill="#529eff" />
      <rect x="12" y="5" width="1" height="6" fill="#e6f5ff" />
      <rect x="5" y="7" width="6" height="2" fill="#ffffff" />
      <rect x="8" y="5" width="2" height="2" fill="#ffe485" />
      <rect x="8" y="9" width="2" height="2" fill="#ffe485" />
      <rect x="7" y="2" width="2" height="2" fill="#b899ff" />
      <rect x="7" y="12" width="2" height="2" fill="#8ce8ff" />
    </template>

    <!-- ===== 五、法术极性微标（伤害 / 治愈 / 增益 / 减益 / 战术） ===== -->
    <!-- 伤害极性：绯赤爆裂星刃 -->
    <template v-else-if="name === 'polarity_damage'">
      <rect x="7" y="1" width="2" height="14" fill="#ff596e" />
      <rect x="1" y="7" width="14" height="2" fill="#ff596e" />
      <rect x="3" y="3" width="3" height="3" fill="#ff94a2" />
      <rect x="10" y="3" width="3" height="3" fill="#ff94a2" />
      <rect x="3" y="10" width="3" height="3" fill="#ff94a2" />
      <rect x="10" y="10" width="3" height="3" fill="#ff94a2" />
      <rect x="6" y="6" width="4" height="4" fill="#fff0f3" />
    </template>

    <!-- 治愈极性：翡翠圣光十字 -->
    <template v-else-if="name === 'polarity_heal'">
      <rect x="6" y="2" width="4" height="12" fill="#3ee092" />
      <rect x="2" y="6" width="12" height="4" fill="#3ee092" />
      <rect x="7" y="3" width="2" height="10" fill="#b8ffda" />
      <rect x="3" y="7" width="10" height="2" fill="#b8ffda" />
      <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
    </template>

    <!-- 增益极性：暖碧双翼上箭头 -->
    <template v-else-if="name === 'polarity_buff'">
      <rect x="7" y="2" width="2" height="2" fill="#ffffff" />
      <rect x="5" y="4" width="6" height="2" fill="#88f5e6" />
      <rect x="3" y="6" width="3" height="2" fill="#4fd9c8" />
      <rect x="10" y="6" width="3" height="2" fill="#4fd9c8" />
      <rect x="7" y="7" width="2" height="2" fill="#b8fff5" />
      <rect x="5" y="9" width="6" height="2" fill="#5ce6d5" />
      <rect x="3" y="11" width="3" height="2" fill="#3ab8a9" />
      <rect x="10" y="11" width="3" height="2" fill="#3ab8a9" />
    </template>

    <!-- 减益极性：妖绯紫下压咒箭 -->
    <template v-else-if="name === 'polarity_debuff'">
      <rect x="3" y="3" width="3" height="2" fill="#b84cc4" />
      <rect x="10" y="3" width="3" height="2" fill="#b84cc4" />
      <rect x="5" y="5" width="6" height="2" fill="#e07ae6" />
      <rect x="7" y="7" width="2" height="2" fill="#f7c2ff" />
      <rect x="3" y="8" width="3" height="2" fill="#cc5cd9" />
      <rect x="10" y="8" width="3" height="2" fill="#cc5cd9" />
      <rect x="5" y="10" width="6" height="2" fill="#eb96f5" />
      <rect x="7" y="12" width="2" height="2" fill="#ffffff" />
    </template>

    <!-- 战术/召唤极性：鎏金四芒星阵 -->
    <template v-else-if="name === 'polarity_utility'">
      <rect x="7" y="1" width="2" height="4" fill="#ffe48a" />
      <rect x="7" y="11" width="2" height="4" fill="#ffe48a" />
      <rect x="1" y="7" width="4" height="2" fill="#ffe48a" />
      <rect x="11" y="7" width="4" height="2" fill="#ffe48a" />
      <rect x="5" y="5" width="6" height="6" fill="#e0b24c" />
      <rect x="6" y="6" width="4" height="4" fill="#fff7d6" />
    </template>

    <!-- 兜底星徽 -->
    <template v-else>
      <rect x="5" y="5" width="6" height="6" fill="#e4c16f" />
      <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
    </template>
  </svg>
</template>

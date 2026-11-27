# 《英雄无敌 4》（HoMM4 + 风暴聚集 + 疾风战场）全量数值与设定参考库

> 数据来源：Might & Magic Wiki (https://mightandmagic.fandom.com) via MediaWiki API（CC-BY-SA 3.0 (data & text reference only; zero copyrighted images/audio)）
> 抓取时间：`2026-11-25T04:50:37.072Z` · 更新命令：`node scripts/fetch-h4-reference.mjs`

## 一、文件索引与规模总览

| 文件名 | 内容说明 | 条目数 |
| :--- | :--- | ---: |
| `creatures.json` | 6 大阵营 48 城镇兵种 + 26 野外/资料片兵种完整数值与特技 | **74** |
| `abilities.json` | 全去重 H4 兵种特技词典（完整官方机制说明 + 持有兵种与差异注释） | **75** |
| `spells.json` | 生命/秩序/死亡/混乱/自然 五系 1~5 级完整法术与耗蓝 | **142** |
| `artifacts.json` | 普通装备、22 种战斗药水、珍宝/次级/主级/遗物宝物与 5 套组合神器 | **208 件 + 5 套** |
| `skills.json` | 9 主技能 + 27 次技能（初级→宗师 5 档精确加成） | **36** |
| `classes.json` | 11 基础职业 + 37 进阶职业（含合成矩阵、被动特效与升级权重） | **48** |
| `towns.json` | 6 大阵营城镇建筑树、互斥兵营、魔法塔与圣杯建筑 | **6 城 / 172 建筑** |
| `metadata.json` | 数据量统计与字段完整性自检报告 | 1 |

## 二、全阵营兵种数值速查表（74 兵种）

### 生命（圣堂 Haven）（共 10 种）

| 归属 | 级 | 兵种 | HP | 伤害 | 近攻/防 | 远攻/防(弹) | 速/移 | 蓝 | 周产 | 造价 | 核心特技 |
| :--- | :-: | :--- | --: | :-: | :-: | :-: | :-: | --: | --: | :--- | :--- |
| 城镇 | T1 | **Squire** | 10 | 2-3 | 9/11 | -/11 | 5/19 | - | 21 | 26g | Stun |
| 城镇 | T1 | **Crossbowman** | 10 | 2-3 | 4/11 | 9/11(10) | 2/19 | - | 16 | 32g | Ranged, Long Range |
| 城镇 | T2 | **Pikeman** | 30 | 6-8 | 12/14 | -/14 | 4/19 | - | 9 | 150g | Long Weapon, Negate First Strike |
| 城镇 | T2 | **Ballista** | 28 | 5-7 | 8/16 | 15/16(20) | 0/15 | - | 7 | 190g | Ranged, Mechanical, Long Range, No Obstacle Penalty |
| 城镇 | T3 | **Crusader** | 65 | 10-16 | 22/23 | -/23 | 7/19 | - | 5 | 650g | Two Attacks, Death Ward |
| 城镇 | T3 | **Monk** | 55 | 10-15 | 10/22 | 20/22(12) | 5/19 | - | 6 | 550g | Ranged, Death Ward |
| 城镇 | T4 | **Champion** | 150 | 24-36 | 25/25 | -/25 | 6/25 | - | 4 | 2000g+2wood+2ore | First Strike, Charge |
| 城镇 | T4 | **Angel** | 230 | 40-65 | 30/34 | -/34 | 10/30 | 20 | 2 | 4000g+2crystal | Flying, Resurrection |
| 野外 | T1 | **Peasant** | 10 | 2-3 | 6/7 | -/7 | 2/18 | - | 36 | 15g | Taxpayer |
| 野外 | T4 | **Catapult** | 200 | 20-34 | 14/28 | 28/28(12) | 0/17 | - | 3 | 3000g+6wood+2ore | Ranged, Mechanical, Siege Capable, Greek Fire |

### 秩序（学院 Academy）（共 9 种）

| 归属 | 级 | 兵种 | HP | 伤害 | 近攻/防 | 远攻/防(弹) | 速/移 | 蓝 | 周产 | 造价 | 核心特技 |
| :--- | :-: | :--- | --: | :-: | :-: | :-: | :-: | --: | --: | :--- | :--- |
| 城镇 | T1 | **Dwarf** | 12 | 2-3 | 11/11 | -/11 | 3/18 | - | 18 | 28g | Magic Resistance |
| 城镇 | T1 | **Halfling** | 8 | 1-2 | 5/10 | 10/10(10) | 6/18 | - | 23 | 22g | Ranged, Giantslayer |
| 城镇 | T2 | **Gold golem** | 50 | 8-12 | 16/16 | -/16 | 3/19 | - | 6 | 240g | Magic Resistance, Mechanical |
| 城镇 | T2 | **Mage** | 16 | 3-4 | 6/12 | -/12 | 5/19 | 16 | 8 | 160g | Spellcaster |
| 城镇 | T3 | **Naga** | 90 | 14-22 | 22/22 | -/22 | 7/20 | - | 4 | 850g | No Retaliation |
| 城镇 | T3 | **Genie** | 60 | 9-12 | 10/18 | -/18 | 6/25 | 24 | 6 | 550g | Spellcaster |
| 城镇 | T4 | **Dragon golem** | 220 | 36-55 | 34/34 | -/34 | 9/27 | - | 2 | 4000g+4ore | First Strike, Negate First Strike, Mechanical |
| 城镇 | T4 | **Titan** | 210 | 34-50 | 32/32 | 32/32(16) | 6/21 | - | 2 | 4000g+2gems | Chaos Ward, Ranged, Normal Melee |
| 野外 | T4 | **Evil sorceress** | 100 | 20-34 | 28/28 | -/28 | 7/30 | 50 | 2 | 4000g+2mercury | Teleport, Spellcaster, Magic Mirror |

### 死亡（墓园 Necropolis）（共 13 种）

| 归属 | 级 | 兵种 | HP | 伤害 | 近攻/防 | 远攻/防(弹) | 速/移 | 蓝 | 周产 | 造价 | 核心特技 |
| :--- | :-: | :--- | --: | :-: | :-: | :-: | :-: | --: | --: | :--- | :--- |
| 城镇 | T1 | **Skeleton** | 8 | 1-2 | 12/12 | -/24 | 4/19 | - | 25 | 22g | Undead, Skeletal |
| 城镇 | T1 | **Imp** | 7 | 1-2 | 10/10 | -/10 | 6/28 | - | 28 | 18g | Flying, Mana Leech |
| 城镇 | T2 | **Ghost** | 15 | 2-4 | 15/30 | -/30 | 6/28 | - | 9 | 140g | Flying, Undead, Aging, Insubstantial |
| 城镇 | T2 | **Cerberus** | 24 | 4-6 | 16/16 | -/16 | 6/21 | - | 7 | 190g | No Retaliation, 3-Headed Attack |
| 城镇 | T3 | **Vampire** | 75 | 12-18 | 30/30 | -/30 | 6/28 | - | 3 | 1100g | Undead, Flying, No Retaliation, Life Draining |
| 城镇 | T3 | **Venom spawn** | 100 | 16-24 | 13/26 | 26/26(15) | 6/19 | - | 3 | 1100g | Ranged, Poison |
| 城镇 | T4 | **Bone dragon** | 275 | 45-65 | 30/30 | -/60 | 5/28 | - | 2 | 4000g+2crystal | Flying, Undead, Skeletal, Fear |
| 城镇 | T4 | **Devil** | 210 | 34-50 | 33/33 | -/33 | 7/30 | 8 | 2 | 4000g+2sulfur | Teleport, Summon Demons, Life Ward |
| 野外 | T1 | **Zombie** | 24 | 2-4 | 8/10 | -/10 | 1/18 | - | 15 | 35g | Undead, Toughness |
| 野外 | T2 | **Gargoyle** | 22 | 4-6 | 14/16 | -/16 | 7/29 | - | 8 | 160g | Flying, Elemental, Stone Skin |
| 野外 | T2 | **Mummy** | 30 | 5-8 | 15/16 | -/16 | 4/19 | - | 8 | 170g | Undead, Curse |
| 野外 | T3 | **Ice demon** | 70 | 12-16 | 30/30 | -/30 | 5/19 | - | 4 | 850g | Freezing Attack, Cold Attack, Cold Resistance |
| 野外 | T4 | **Dark champion** | 200 | 30-42 | 40/40 | -/40 | 6/30 | 18 | 2 | 4000g+4ore | Charge, Undead, Terror, Regeneration |

### 混乱（疯人院 Asylum）（共 14 种）

| 归属 | 级 | 兵种 | HP | 伤害 | 近攻/防 | 远攻/防(弹) | 速/移 | 蓝 | 周产 | 造价 | 核心特技 |
| :--- | :-: | :--- | --: | :-: | :-: | :-: | :-: | --: | --: | :--- | :--- |
| 城镇 | T1 | **Bandit** | 10 | 1-3 | 9/9 | -/9 | 7/23 | - | 26 | 20g | Stealth |
| 城镇 | T1 | **Orc** | 12 | 1-3 | 11/9 | 11/9(6) | 4/19 | - | 16 | 34g | Ranged, Normal Melee, Short Range |
| 城镇 | T2 | **Medusa** | 24 | 3-6 | 19/17 | 19/17(∞) | 5/19 | - | 6 | 220g | Ranged, Normal Melee, Unlimited Shots, Stone Gaze |
| 城镇 | T2 | **Minotaur** | 38 | 5-6 | 16/15 | -/15 | 6/19 | - | 6 | 230g | Block |
| 城镇 | T3 | **Nightmare** | 110 | 12-26 | 23/20 | -/20 | 6/23 | 6 | 4 | 800g | Terror |
| 城镇 | T3 | **Efreet** | 80 | 10-20 | 25/23 | -/23 | 6/29 | - | 4 | 850g | Flying, Fire Shield, Fire Attack, Fire Resistance |
| 城镇 | T4 | **Hydra** | 250 | 28-60 | 30/26 | -/26 | 6/21 | - | 2 | 4000g+2mercury | No Retaliation, Multiple Attack |
| 城镇 | T4 | **Black dragon** | 400 | 55-110 | 40/40 | -/40 | 7/30 | - | 1 | 8000g+4sulfur | Flying, Immune to Magic, Breath Attack |
| 野外 | T1 | **Pirate** | 10 | 1-2 | 11/9 | -/9 | 5/19 | - | 24 | 22g | Bonuses at Sea |
| 野外 | T1 | **Troglodyte** | 14 | 2-3 | 11/9 | -/9 | 5/19 | - | 19 | 28g | Immune to Visual Attacks |
| 野外 | T2 | **Evil eye** | 26 | 3-7 | 8/15 | 16/15(15) | 6/19 | - | 6 | 220g | Ranged, Flying, Random Harmful Spells |
| 野外 | T2 | **Troll** | 45 | 6-12 | 16/15 | -/15 | 3/18 | - | 6 | 230g | Regeneration |
| 野外 | T3 | **Goblin knight** | 120 | 16-30 | 20/26 | -/26 | 7/27 | - | 4 | 1000g | Magic Resistance, Stone Skin, Negate First Strike |
| 野外 | T4 | **Megadragon** | 1000 | 50-100 | 50/50 | -/50 | 7/30 | - | - | 野外专属 | Breath Attack, Magic Resistance |

### 自然（自然保护区 Preserve）（共 17 种）

| 归属 | 级 | 兵种 | HP | 伤害 | 近攻/防 | 远攻/防(弹) | 速/移 | 蓝 | 周产 | 造价 | 核心特技 |
| :--- | :-: | :--- | --: | :-: | :-: | :-: | :-: | --: | --: | :--- | :--- |
| 城镇 | T1 | **Wolf** | 12 | 2-3 | 9/9 | -/9 | 7/21 | - | 15 | 36g | Two Attacks |
| 城镇 | T1 | **Sprite** | 7 | 1-2 | 10/10 | -/10 | 6/29 | - | 23 | 22g | Flying, No Retaliation |
| 城镇 | T2 | **White tiger** | 35 | 6-8 | 19/19 | -/19 | 8/24 | - | 6 | 220g | First Strike |
| 城镇 | T2 | **Elf** | 18 | 3-4 | 8/16 | 16/16(24) | 6/19 | - | 7 | 190g | Ranged, Shoots Twice, Ranged First Strike |
| 城镇 | T3 | **Griffin** | 95 | 16-22 | 19/19 | -/19 | 6/29 | - | 4 | 800g | Flying, Unlimited Retaliation |
| 城镇 | T3 | **Unicorn** | 80 | 12-20 | 20/20 | -/20 | 6/25 | - | 5 | 650g | Blind |
| 城镇 | T4 | **Phoenix** | 275 | 45-65 | 28/28 | -/28 | 12/30 | 12 | 2 | 4000g+2mercury | Flying, Rebirth, Breath Attack, Fire Resistance |
| 城镇 | T4 | **Faerie dragon** | 220 | 34-50 | 15/29 | -/29 | 7/29 | 40 | 2 | 4000g+2gems | Flying, Spellcaster, Magic Mirror |
| 野外 | T1 | **Leprechaun** | 8 | 1-2 | 10/10 | -/10 | 6/19 | 3 | 22 | 24g | Fortune |
| 野外 | T2 | **Satyr** | 36 | 5-8 | 14/13 | -/13 | 6/20 | 6 | 8 | 170g | Mirth |
| 野外 | T3 | **Air elemental** | 40 | 6-10 | 16/32 | -/32 | 7/29 | - | 6 | 350g | Flying, Elemental, Insubstantial |
| 野外 | T3 | **Water elemental** | 38 | 6-9 | 17/17 | -/17 | 5/19 | 24 | 6 | 350g | Elemental, Spellcaster, Cold Attack, Cold Resistance |
| 野外 | T3 | **Fire elemental** | 50 | 7-10 | 10/18 | 20/18(20) | 6/20 | - | 6 | 350g | Ranged, Elemental, Fire Attack, Fire Resistance |
| 野外 | T3 | **Earth elemental** | 50 | 9-14 | 18/20 | -/20 | 1/18 | - | 6 | 375g | Elemental, Magic Resistance |
| 野外 | T3 | **Waspwort** | 60 | 10-14 | 11/22 | 22/22(20) | 4/15 | - | 6 | 550g | Ranged, Weakness |
| 野外 | T4 | **Mantis** | 210 | 34-50 | 34/34 | -/34 | 8/29 | - | 2 | 4000g+2gems | Flying, First Strike, Binding |
| 野外 | T4 | **Gargantuan** | 300 | 28-40 | 32/32 | 32/32(16) | 4/21 | - | 2 | 4000g+2crystal | Ranged, Shoots Twice, Area Attack, Normal Melee |

### 力量（据点 Stronghold）（共 11 种）

| 归属 | 级 | 兵种 | HP | 伤害 | 近攻/防 | 远攻/防(弹) | 速/移 | 蓝 | 周产 | 造价 | 核心特技 |
| :--- | :-: | :--- | --: | :-: | :-: | :-: | :-: | --: | --: | :--- | :--- |
| 城镇 | T1 | **Berserker** | 18 | 2-3 | 12/8 | -/8 | 6/20 | - | 19 | 20g | Two Attacks, Berserk |
| 城镇 | T1 | **Centaur** | 20 | 3-5 | 10/10 | 10/10(4) | 4/25 | - | 9 | 40g | Ranged, Normal Melee, Short Range |
| 城镇 | T2 | **Harpy** | 24 | 4-5 | 16/15 | -/15 | 5/28 | - | 8 | 110g | Flying, No Retaliation, Strike and Return |
| 城镇 | T2 | **Nomad** | 45 | 6-9 | 16/13 | -/13 | 8/27 | - | 6 | 150g | First Strike |
| 城镇 | T3 | **Ogre mage** | 85 | 12-18 | 18/16 | -/16 | 4/19 | 6 | 6 | 350g | Bloodlust |
| 城镇 | T3 | **Cyclops** | 95 | 12-18 | 15/24 | 30/24(8) | 4/21 | - | 3 | 750g | Ranged, Area Attack |
| 城镇 | T4 | **Thunderbird** | 170 | 24-40 | 30/30 | -/30 | 6/29 | - | 3 | 1800g+2mercury | Flying, Lightning Attack |
| 城镇 | T4 | **Behemoth** | 240 | 55-80 | 36/34 | -/34 | 6/21 | - | 2 | 2750g+2crystal | Strength |
| 野外 | T2 | **Mermaid** | 38 | 5-8 | 15/13 | -/13 | 5/19 | - | - | 野外专属 | Hypnotize |
| 野外 | T4 | **Sea monster** | 275 | 45-65 | 35/34 | -/34 | 5/24 | - | - | 野外专属 | Devouring |
| 野外 | T4 | **Frenzied gnasher** | 300 | 40-55 | 40/40 | -/40 | 4/21 | - | 2 | 4000g+2crystal | Immune to Magic, Berserk |

## 三、五系法术分布（142 法术）

> H4 原版蓝耗规则：1 级 = `2 MP`，2 级 = `3 MP`，3 级 = `5 MP`，4 级 = `8 MP`，5 级 = `12 MP`。

### 生命魔法 Life（32 个）
- **L1（2 MP，6 个）**：Bind wound、Bless、Exorcism、Holy word、Spiritual armor、Summon ship
- **L2（3 MP，11 个）**：Chaos ward、Death ward、Defender、Heal、Heavenly shield、Martyr、Mirth、Nature ward、Order ward、Retribution、Song of Peace
- **L3（5 MP，5 个）**：Celestial armor、Holy shout、Mass bless、Mass healing、Regeneration
- **L4（8 MP，7 个）**：Mass Chaos ward、Mass Death ward、Mass exorcism、Mass fervor、Mass Nature ward、Mass Order ward、Prayer
- **L5（12 MP，3 个）**：Divine intervention、Guardian angel、Sanctuary

### 秩序魔法 Order（27 个）
- **L1（2 MP，6 个）**：Blur、Dispel、Displacement、Magic fist、Precision、Visions
- **L2（3 MP，7 个）**：Cowardice、Create illusion、Flight、Ice bolt、Power drain、Slow、Steal enchantment
- **L3（5 MP，7 个）**：Banish、Forgetfulness、Mass blur、Mass dispel、Mass precision、Teleport、Town gate
- **L4（8 MP，4 个）**：Berserk、Blind、Mass slow、Phantom image
- **L5（12 MP，3 个）**：Hypnotize、Pain mirror、Steal all enchantments

### 死亡魔法 Death（25 个）
- **L1（2 MP，5 个）**：Cancellation、Curse、Disrupting ray、Poison、Raise skeletons
- **L2（3 MP，7 个）**：Animate dead、Fatigue、Life drain、Mire、Sorrow、Unholy song、Weakness
- **L3（5 MP，6 个）**：Aura of fear、Magic leech、Mass cancellation、Mass curse、Plague、Raise ghost
- **L4（8 MP，4 个）**：Death call、Mass sorrow、Mass weakness、Vampiric touch
- **L5（12 MP，3 个）**：Hand of Death、Raise vampires、Sacrifice

### 混乱魔法 Chaos（27 个）
- **L1（2 MP，6 个）**：Bloodlust、Fire aura、Haste、Magic arrow、Slayer、Sparks
- **L2（3 MP，6 个）**：Confusion、Fire bolt、First strike、Mana flare、Misfortune、Spell shackle
- **L3（5 MP，6 个）**：Bloodfrenzy、Fire ring、Fireball、Lightning、Magic mirror、Mass slayer
- **L4（8 MP，6 个）**：Cat reflexes、Cloud of confusion、Implosion、Inferno、Mass first strike、Mass misfortune
- **L5（12 MP，3 个）**：Armageddon、Chain lightning、Disintegrate

### 自然魔法 Nature（31 个）
- **L1（2 MP，7 个）**：Pathfinding、Speed、Stoneskin、Summon sprite、Summon wolf、Summon leprechaun、Terrain walk
- **L2（3 MP，8 个）**：Fortune、Giant strength、Quicksand、Snake strike、Summon elf、Summon satyr、Summon white tiger、Wasp swarm
- **L3（5 MP，7 个）**：Anti-magic、Mass speed、Necromancy ward、Summon air elemental、Summon earth elemental、Summon fire elemental、Summon water elemental
- **L4（8 MP，5 个）**：Mass fortune、Mass snake strike、Summon griffin、Summon unicorn、Summon waspwort
- **L5（12 MP，4 个）**：Dragon strength、Summon faerie dragon、Summon mantis、Summon phoenix

## 四、战斗药水（22 种）与 5 套组合神器

### 战斗药水（Potions）

| 药水名称 | 效果说明 |
| :--- | :--- |
| **Cloud of Despair** | When thrown at a creature or space, all creatures within a 3x3 yard area get a negative 10 to their morale. |
| **Demon Fire** | When thrown at a target it causes a 3x3 yard explosion of flames (same as the Fireball spell) around a target within the line of sight of the caster, doing fire damage to all targets within its blast. |
| **Holy Water** | When a hero drinks it, it casts Death ward and Bless on the recipient. When thrown at an enemy, it acts as the Holy Word spell. |
| **Potion of Cold** | The melee attacks of the hero who drinks this potion gain the Freeze ability for the duration of one combat. |
| **Potion of Endurance** | The army who drinks this potion gains +3 movement. Only one potion may be used per day per party. |
| **Potion of Fire Resistance** | The hero who drinks this potion gains the special Fire Resistance ability for the duration of one combat. |
| **Potion of Healing** | Heals al of the hero's wounds, and also cures Poison and Plague. It can only be used on the owner. |
| **Potion of Luck** | Gives the hero who drinks this potion maximum positive luck. |
| **Potion of Mana** | The mana of the hero who drinks this potion increases by 25 points. The spell point total can exceed the hero's normal maximum. It can be used both on the Adventure Map and the Combat Map. |
| **Potion of Mirth** | Gives the hero who drinks this potion maximum positive morale. |
| **Potion of Immortality** | When a hero who drinks a Potion of Immortality dies in combat, he will instantly return to life. This potion can be used before a battle, and only wears off when the hero dies. It resurrects the hero only once. |
| **Potion of Quickness** | The hero who drinks this potion gains an extra attack for 2 full rounds. Similar to a limited version of the Chaos spell Cat Reflexes. |
| **Potion of Resistance** | The hero who drinks this potion gains 50% magic resistance for the duration of one combat. |
| **Potion of Restoration** | All negative spell effects are removed from the hero who drinks this potion. |
| **Potion of Speed** | The speed of the hero who drinks this potion is increased by 3 for the duration of one combat. The effects are not cumulative. |
| **Potion of Strength** | The melee damage of the hero who drinks this potion temporarily increases by 25% for the duration of one combat. The effects are not cumulative. |
| **Potion of Toughness** | The hit points of the hero who drinks this potion temporarily increases by 25% for the duration of one combat. The effect is not cumulative. |
| **Vial of Acid** | When thrown on living targets, it reduces their Melee and Ranged Defense by 20%. When thrown on a dead stack, it destroys it. |
| **Vial of Binding Liquid** | When thrown at a creature, it acts as a Slow spell and also restricts a creature's ability to fly. |
| **Vial of Blinding Smoke** | When thrown, all ranged attacks within a 3x3 yard area do 50% less damage. |
| **Vial of Choking Gas** | The enemy target does 15% less damage and their Melee and Ranged Defense are reduced by 15%. Does not work on Mechanical, Undead or Elemental creatures. |
| **Vial of Poison** | Causes the user's attacks to become poisonous. Any target struck by the user in melee or ranged combat will suffer the effects of the Poison spell. |

### 5 套经典组合神器（The Gathering Storm）

| 套装名 | 组成部件 | 套装额外效果 |
| :--- | :--- | :--- |
| **Masters of Magic** | Archmages' Hat + Staff of Disruption + Wayfaring Boots + Ring of Flares + Angelfeather Cloak | A hero wearing the five artifacts above is granted the ability to ignore an enemy hero's or creature's magic resistance. |
| **Opposites Attract** | Flame of Chaos + Ice Scales + Necklace of Balance | A hero wearing the three artifacts above is granted Magic Mirror. |
| **Another Bard's Tale** | Harmonic Chainmail + Necklace of Muses + Aiffe's Mandolin | Targets attacked by a hero wearing the three artifacts above are effected by Song of Peace, as if the spell was cast on them. |
| **Might Makes Right** | Tiger Armor + Tiger Helm + Frost Hammer | A hero wearing the three artifacts above is granted Regeneration and Dragon strength. |
| **A Matter of Life and Death** | Cloak of Darkness + Ring of Light | A hero wearing the two artifacts above is granted one Guardian Angel at the start of every combat. |

## 五、9 主技能 × 27 次技能与 37 进阶职业

### 技能树总览

- **Tactics**：Offense / Defense / Leadership
- **Combat**：Melee / Archery / Magic Resistance
- **Scouting**：Pathfinding / Seamanship / Stealth
- **Nobility**：Estates / Mining / Diplomacy
- **Life Magic**：Healing / Spirituality / Resurrection
- **Order Magic**：Enchantment / Wizardry / Charm
- **Death Magic**：Occultism / Demonology / Necromancy
- **Chaos Magic**：Pyromancy / Sorcery / Conjuration
- **Nature Magic**：Herbalism / Meditation / Summoning

### 37 个进阶职业全表

| 进阶职业 | 所需主技能组合 | 专属被动/特效 |
| :--- | :--- | :--- |
| **Archmage** | Any 3 of 5 Magic Skills | An Archmage sees the effectiveness of all their spells increase by 20%. |
| **Assassin** | Combat + Death Magic | An Assassin has permanent Haste cast upon them, giving a +3 bonus to speed and movement, allowing them to usually strike first. |
| **Bard** | Scouting + Nature Magic | The class bonus for bard grants them Fortune, which sets their Luck at maximum (+10). The Bard is also immune to the misfortune spell. |
| **Battle Mage** | Combat + Order Magic | The class bonus for the battle mage grants +20% damage to the ice bolt and magic fist Order Magic spells. |
| **Beast Lord** | Nobility + Nature Magic | The class bonus for the Beast Lord lets them cast the summon wolf and summon white tiger spells with 20% more power. |
| **Beastmaster** | Combat + Nature Magic | Beastmasters get a 20% bonus to the summon wolf spell. |
| **Cardinal** | Nobility + Life Magic | Cardinals get a 5% bonus to the Resurrection skill. |
| **Crusader** | Tactics + Life Magic | A Crusader always has the mirth ability, which grants maximum morale (+10). The Crusader is also immune to the sorrow spell. |
| **Dark Lord** | Nobility + Death Magic | When the Dark Lord attacks, the sorrow spell is cast on their target. |
| **Dark Priest** | Life Magic + Death Magic | A Dark Priest hero gains vampirism: for every 2 HP of Damage inflicted to the enemy in melee combat, 1 HP is recovered. |
| **Demonologist** | Nature Magic + Death Magic | The bonus of the Demonologist gives +50% efficiency to demon summoning spells (summon imp, cerberus, ice demon, venom spawn and devil). |
| **Enchanter** | Order Magic + Nature Magic | The bonus of the Enchanter gives +20% to summoning and illusion spells. |
| **Field Marshal** | Tactics + Scouting | The bonus of the Field Marshal gives +10% to the attack of the hero's creatures. |
| **Fire Diviner** | Chaos Magic + Scouting | The bonus of the Fire Diviner lets them do 20% more damage with all fire spells. |
| **Fireguard** | Combat + Chaos Magic | A fireguard is immune to fire effects (just like efreeti and phoenixes). |
| **General** | Combat + Tactics | The General gives +1 morale for all friendly units, including the hero themselves. |
| **Guildmaster** | Scouting + Nobility | The bonus of the Guildmaster gives a chance to stun with every melee attack, like a Squire. |
| **Heretic** | Life Magic + Chaos Magic | The bonus of the Heretic lets them ignore all Wards when casting spells. |
| **Illusionist** | Tactics + Order Magic | The bonus of the Illusionist gives +20% to the hero's Illusion spells: create illusion and phantom image. |
| **Lich** | Chaos Magic + Death Magic | Liches can temporarily age enemies by attacking them in melee. Aged enemies have their attack reduced by 25%, their defense reduced by 20%, and their speed and movement reduced by 50%. |
| **Lord Commander** | Tactics + Nobility | The bonus of the Lord Commander gives all friendly creatures +2 morale. |
| **Monk** | Life Magic + Order Magic | A Monk has Chaos ward at all times, which makes them 50% resistant to Chaos spells, and increases melee and ranged defense by 50% against Chaos-aligned opponents. |
| **Ninja** | Death Magic + Scouting | A ninja's attacks inflict poison on their target. |
| **Paladin** | Life Magic + Combat | A Paladin has Death ward at all times, which makes them 50% resistant to Death spells, and increases melee and ranged defense by 50% against Death-aligned opponents. |
| **Prophet** | Life Magic + Scouting | Prophets have the spiritual armor spell on at all times, which increases Ranged and Melee Defense by 25%. |
| **Pyromancer** | Chaos Magic + Tactics | Any unit that performs a melee attack on a pyromancer takes fire damage, just like with the efreeti's Fire Shield ability. |
| **Ranger** | Combat + Scouting | A ranger has their ranged attack increased by +5, and always has a ranged attack even without Archery skill or items. |
| **Reaver** | Tactics + Death Magic skills | A Reaver has permanent bloodlust cast upon them, giving a +25% bonus to melee damage. |
| **Seer** | Order Magic + Scouting | The bonus of the Seer gives a +2 Scouting radius. |
| **Shadow Mage** | Order Magic + Death Magic | A Shadow Mage has permanent blur cast upon them, giving a +50% bonus to ranged defense. |
| **Summoner** | Life Magic + Nature Magic | The bonus of the Summoner gives them +20 experience points worth of creatures summoned every day. It functions like Basic Summoning, if the hero lacks the skill. |
| **Warden** | Tactics + Nature Magic | The bonus of the Warden gives +10% to the defense of the hero's creatures. |
| **Warlock** | Nature Magic + Chaos Magic | The Spell points of a Warlock increase by 10 and spell points regenerate by 1 per day. |
| **Warlord** | Combat + Nobility | The bonus of the Warlord gives +5 to melee attack. |
| **Witch King** | Nobility + Chaos Magic | The bonus of the Witch King lets them cause Fear in melee targets, which causes the target to run away for a short distance and prevents it from retaliating. |
| **Wizard** | Order Magic + Chaos Magic | The bonus of the Wizard reduces the cost of all spells by two points. |
| **Wizard King** | Nobility + Order Magic | The bonus of the Wizard King gives targets struck by its melee or ranged attacks maximum bad luck (which is -10). This is the same as being struck by misfortune spell. |

## 六、6 大阵营城镇一览

| 阵营城镇 | 魔法阵营 | 原生地形 | 基础英雄职业 | 可建魔法学院 | 圣杯建筑 | 建筑总数 |
| :--- | :--- | :--- | :--- | :--- | :--- | --: |
| **Haven** | 生命（圣堂 Haven） | Grass | Knight (might) / Priest (magic) | Life / Nature / Order | Holy avatar | 30 |
| **Academy** | 秩序（学院 Academy） | Snow | Lord (might) / Mage (magic) | Order / Death / Life | Great library | 29 |
| **Necropolis** | 死亡（墓园 Necropolis） | Volcanic | Death Knight (might) / Necromancer (magic) | Death / Chaos / Order | Infernal effigy | 29 |
| **Asylum** | 混乱（疯人院 Asylum） | Swamp | Thief (might) / Sorcerer (magic) | Chaos / Death / Nature | Eye of Chaos | 30 |
| **Preserve** | 自然（自然保护区 Preserve） | Grass | Archer (might) / Druid (magic) | Nature / Chaos / Life | Summoning stone | 30 |
| **Stronghold** | 力量（据点 Stronghold） | Rough | Barbarians | 无（纯物理） | Festival of Life | 24 |

## 七、全兵种特技词典（共 75 种，0 缺漏）

| 特技名称 | 持有兵种 | 机制说明 |
| :--- | :--- | :--- |
| **3-Headed Attack** | Cerberus | With the 3-Headed Attack all enemies standing to the left, front and right of the creature are attacked simultaneously. |
| **Aging** | Ghost | This creature's attack has a chance of temporarily Aging the enemy. An Aged target has its Attack skill decreased by 25%, its Defense skill decreased by 20%, and its Speed and Movement decreased by 50%. |
| **Area Attack** | Gargantuan, Cyclops | This creature's Area Attack allows its ranged attacks to strike all targets, friendly or hostile, in a small area (3x3 yards). |
| **Berserk** | Berserker, Frenzied gnasher | A Berserk creature must attack or move to attack every turn. They cannot wait. They are also immune to all forms of fear. |
| **Binding** | Mantis | Binding allows the creature to Bind the last creature it attacks with its forelimbs. Bound enemies cannot move, though they can still attack, retaliate and cast spells. Bound creatures do half damage when they attack. If the attacking creature moves, the Binding is also removed. |
| **Blind** | Unicorn | This creature's attack has a chance of Blinding an enemy. |
| **Block** | Minotaur | Block gives this creature a chance of completely blocking any melee, ranged, or area effect attack. Even if the attack is blocked, the target will receive damage from the Stone Gaze ability. |
| **Bloodlust** | Ogre mage | This creature can cast the Chaos Magic spell Bloodlust. |
| **Bonuses at Sea** | Pirate | Bonuses at Sea makes this creature faster and allows it to do more damage when fighting on the deck of a ship. Its Melee and Ranged Defense also increases. |
| **Breath Attack** | Black dragon, Megadragon, Phoenix | This creature's Breath Attack allows it to attack with a blast of fire that may also harm creatures directly behind an enemy target. |
| **Chaos Ward** | Titan | Chaos Ward makes this creature 50% resistant to Chaos spells, and its Melee and Ranged Defense is increased by 50% against Chaos-aligned opponents. |
| **Charge** | Champion, Dark champion | Charge allows this creature to do more damage after it charges for a long distance before attacking. |
| **Cold Attack** | Ice demon, Water elemental | In combat, this creature's normal attack is a Cold Attack, so targets with Cold Resistance will take less damage. |
| **Cold Resistance** | Ice demon, Water elemental | Cold Resistance makes this creature immune to cold-based spells. It also takes half damage from enemies with cold-based attacks. |
| **Curse** | Mummy | Curse causes this creature's normal attack to also act as the Death Magic spell Curse. |
| **Death Ward** | Crusader, Monk | Death Ward makes this creature 50% resistant to Death spells, and its Melee and Ranged Defense is increased by 50% against Death-aligned opponents. |
| **Devouring** | Sea monster | This creature's Devouring ability gives it a chance of swallowing an enemy whole when it attacks. |
| **Elemental** | Gargoyle, Air elemental, Water elemental, Fire elemental, Earth elemental | Elementals are immune to certain spells (such as Poison) that only work on normal, living creatures. |
| **Fear** | Bone dragon | Fear prevents the opponent from retaliating. Anyone struck by fear runs away a short distance. |
| **Fire Attack** | Efreet, Fire elemental | In combat, this creature's normal attack is a Fire Attack, so targets with Fire Resistance will take less damage. |
| **Fire Resistance** | Efreet, Phoenix, Fire elemental | Fire Resistance makes this creature immune to fire-based spells, and to damage from breath attacks if the creature is a secondary target. The creature also takes half damage from enemies with fire-based attacks. |
| **Fire Shield** | Efreet | Fire Shield surrounds this creature in a wall of fire, allowing it to do fire damage in addition to its normal attack to an enemy. |
| **First Strike** | Champion, Dragon golem, White tiger, Mantis, Nomad | First Strike allows this creature to strike an opponent in melee combat before it can retaliate. |
| **Flying** | Angel, Imp, Ghost, Vampire, Bone dragon, Gargoyle, Efreet, Black dragon, Evil eye, Sprite, Griffin, Phoenix, Faerie dragon, Air elemental, Mantis, Harpy, Thunderbird | Flying allows this creature to fly over obstacles, creatures, heroes, and castle walls. |
| **Fortune** | Leprechaun | Fortune allows this creature to cast the Nature Magic spell Fortune. |
| **Freezing Attack** | Ice demon | This creature's Freezing Attack has a chance of freezing an enemy in a block of ice for two turns. |
| **Giantslayer** | Halfling | Giantslayer allows this creature to do extra damage to 4th level creatures. |
| **Greek Fire** | Catapult | This creature's Area Attack allows its ranged attacks to strike all targets, friendly or hostile near the target, with deadly fire. |
| **Hypnotize** | Mermaid | In addition to this creature's normal attack, its Hypnotize ability has a chance of taking control of an enemy opponent for one turn. |
| **Immune to Magic** | Black dragon, Frenzied gnasher | This creature is completely Immune to Magic, including spells cast by friendly troops. |
| **Immune to Visual Attacks** | Troglodyte | Naturally blind creatures are Immune to Visual Attacks. All abilities and spells that influence vision (like Blind and Stone Gaze) do not work on it. |
| **Insubstantial** | Ghost, Air elemental | Insubstantial increases this creature's Melee and Ranged Defense by 100%. |
| **Life Draining** | Vampire | This creature's Life Draining attack sucks the life force from its enemies. This life force will heal damage received in combat and even resurrect those who have died. |
| **Life Ward** | Devil | Life Ward makes this creature 50% resistant to Life spells, and its Melee and Ranged Defense is increased by 50% against Life-aligned opponents. |
| **Lightning Attack** | Thunderbird | This creature's Lightning Attack summons a bolt of lightning that strikes its opponent immediately after its normal attack. |
| **Long Range** | Crossbowman, Ballista | Long Range allows this creature to ignore all ranged attack damage penalties for distance. |
| **Long Weapon** | Pikeman | Long Weapon allows this creature to attack enemies that are at a short distance out of reach of normal melee attacks. |
| **Magic Mirror** | Evil sorceress, Faerie dragon | This creature's Magic Mirror ability allows it to reflect hostile spells back upon the caster like the Magic Mirror spell. |
| **Magic Resistance** | Dwarf, Gold golem, Goblin knight, Megadragon, Earth elemental | The Dwarf is 50% likely to resist offensive spells, and will only take half damage from Direct Damage spells. |
| **Mana Leech** | Imp | Mana Leech allows this creature to drain mana from enemy spellcasters each turn and transfer it to a nearby friendly spellcaster. |
| **Mechanical** | Ballista, Catapult, Gold golem, Dragon golem | Mechanical creatures are not affected by morale, or by spells or abilities that only work on living creatures. |
| **Mirth** | Satyr | Mirth allows this creature to cast the Life Magic spell Mirth. |
| **Multiple Attack** | Hydra | Multiple Attack allows this creature to attack all nearby enemies simultaneously. |
| **Negate First Strike** | Pikeman, Dragon golem, Goblin knight | Negate First Strike allows this creature to counter First Strike abilities or spells. |
| **No Obstacle Penalty** | Ballista | No Obstacle Penalty allows this creature to do full damage to targets behind castle walls and other obstacles. |
| **No Retaliation** | Naga, Cerberus, Vampire, Hydra, Sprite, Harpy | This creature's No Retaliation ability allows it to attack without any chance of retaliation. |
| **Normal Melee** | Titan, Orc, Medusa, Gargantuan, Centaur | This creature's Normal Melee means it doesn't suffer the melee combat damage penalty suffered by most ranged creatures. |
| **Poison** | Venom spawn | This creature's Poison attack damages a target and then do additional damage every turn until combat ends (as long as that target is living). |
| **Random Harmful Spells** | Evil eye | This creature attacks with random Harmful Spells, casting a random Chaos Magic or Death Magic spell on its enemy. |
| **Ranged** | Crossbowman, Ballista, Monk, Catapult, Halfling, Titan, Venom spawn, Orc, Medusa, Evil eye, Elf, Fire elemental, Waspwort, Gargantuan, Centaur, Cyclops | The Ranged ability allows this creature to attack enemies at a distance, but in melee combat this creature does half damage unless it has the Normal Melee ability. |
| **Ranged First Strike** | Elf | Ranged First Strike allows this creature to strike a target in ranged combat before its target can retaliate. |
| **Rebirth** | Phoenix | This creature can use the Rebirth ability to return to life after it is killed in combat. If all are killed before they have used this ability, a portion will automatically be reborn. |
| **Regeneration** | Dark champion, Troll | This creature's Regeneration ability allows it to completely heal all of its wounds at the end of each turn. Regenerates up to 50 hit points per turn. |
| **Resurrection** | Angel | Resurrection ability allows it to target friendly dead creatures and bring them back to life. |
| **Shoots Twice** | Elf, Gargantuan | Shoots Twice allows this ranged creature to fire twice each time it attacks. The second attack occurs after any enemy retaliation. |
| **Short Range** | Orc, Centaur | Short Range dramatically decreases the damage of this ranged creature's attack at long range. |
| **Siege Capable** | Catapult | This creature ignores all ranged attack damage penalties for distance and does full damage to targets behind castle walls and other obstacles. |
| **Skeletal** | Skeleton, Bone dragon | Skeletal increases this creature's Ranged Defense by 100%. |
| **Spellcaster** | Mage, Genie, Evil sorceress, Faerie dragon, Water elemental | Mages can cast Blur, Magic Fist, Curse, Poison, and Raise skeletons. Each mage does 4.8 points of damage with Magic Fist, 2.4 points of Poison damage, and can raise 1.6 Skeletons. Each stack will start combat with 18 spell points. |
| **Stealth** | Bandit | With Stealth, this creature is invisible at a distance on the Adventure Map to 2nd level creatures and heroes with Basic Scouting. The creature is invisible to adjacent 1st level creatures and heroes with no Scouting. |
| **Stone Gaze** | Medusa | This creature's Stone Gaze attack has a chance (depending on the strength of the creature) of killing enemies instantly by turning them into stone. The Stone Gaze damaged is dealt even if the target blocked the normal attack. |
| **Stone Skin** | Gargoyle, Goblin knight | This creature's Stone Skin increases its Melee and Ranged Defense by 25%. The Stoneskin spell has no additional effect. |
| **Strength** | Behemoth | Strength increases the creature's combat damage. |
| **Strike and Return** | Harpy | Strike and Return allows this creature to fly back to its starting point after attacking. |
| **Stun** | Squire | This creature's Stun ability gives it a chance of stunning enemies when it attacks in melee combat. Stunned enemies cannot take any action or retaliate for one turn. |
| **Summon Demons** | Devil | Summon Demons allows this creature to summon Ice Demons during combat. |
| **Taxpayer** | Peasant | Taxpayer allows this creature to generate 1 gold per day for every individual unit the player controls. |
| **Teleport** | Evil sorceress, Devil | Teleport allows this creature to move instantly to any point on the battlefield. |
| **Terror** | Dark champion, Nightmare | Terror allows this creature to cast Terror on an opponent. Enemies who are frozen by Terror cannot take any actions for one turn. |
| **Toughness** | Zombie | Toughness increases this creature's hit points. |
| **Two Attacks** | Crusader, Wolf, Berserker | Two Attacks allows this creature to attack twice in melee combat. The second attack occurs after the enemy's retaliation. |
| **Undead** | Skeleton, Ghost, Vampire, Bone dragon, Zombie, Mummy, Dark champion | Undead creatures are not affected by morale, or by spells and abilities that only work on living creatures. Some spells and artifacts (such as Holy Water) have special effects on Undead creatures. Undead creatures, however, give an additional -2 morale penalty to all non-Death creatures. |
| **Unlimited Retaliation** | Griffin | Unlimited Retaliation allows this creature to retaliate against any number of attacks in a single turn. |
| **Unlimited Shots** | Medusa | Unlimited Shots assures that this creature never runs out of ammunition when making ranged attacks. |
| **Weakness** | Waspwort | Weakness causes this creature's attack to cast the Weakness spell on its target. Weakened creatures do less damage in combat. |

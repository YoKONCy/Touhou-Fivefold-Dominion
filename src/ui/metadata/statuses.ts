/**
 * 单位实时 Buff / Debuff、地形加成与结界光环状态徽章构造器
 */

import { ALIGNMENT_META } from '@core/alignment';
import { isUnitOnHighlandPlatform } from '@core/h4SpellExecutor';
import type { BattleState, BattleUnit } from '@core/types';
import { TOUHOU_CATALOG } from '@data/battlePresets';
import { SPELL_POLARITY_META } from '@ui/semanticFormat';
import { SPEC_BADGE_CONTROL, SPEC_BADGE_DEFENSE, SPEC_BADGE_LIMIT } from './specialties';
import { statKeyLabel } from './spellsAndStats';
import type { HudIconBadge, HudTooltipMiniBadge } from './types';

/** 构造附带阵营与极性微标的术式状态推送函数 */
function createStatusPusher(list: HudIconBadge[]) {
  return (
    id: string,
    icon: string,
    shortLabel: string,
    title: string,
    tag: string,
    lines: string[],
    positive: boolean,
    spellIconId?: string,
    roundsBadge?: string,
  ): void => {
    const sp = spellIconId ? TOUHOU_CATALOG.spells[spellIconId] : undefined;
    const badges: HudTooltipMiniBadge[] = [];
    if (sp) {
      const am = ALIGNMENT_META[sp.alignment];
      badges.push({
        label: am.name,
        color: am.textColor,
        bg: 'rgba(22, 16, 26, 0.92)',
        border: am.themeColor,
      });
    }
    const polMeta = positive
      ? sp && (sp.healBase || sp.reviveBase || sp.specialEffect === 'regeneration' || sp.specialEffect === 'guardian_angel')
        ? SPELL_POLARITY_META.heal
        : SPELL_POLARITY_META.buff
      : SPELL_POLARITY_META.debuff;
    badges.push({
      label: polMeta.label,
      icon: polMeta.icon,
      color: polMeta.color,
      bg: polMeta.bg,
      border: polMeta.border,
    });

    list.push({
      id,
      icon,
      spellIconId,
      roundsBadge,
      polarity: positive ? 'positive' : 'negative',
      shortLabel,
      accent: positive ? '#b8f0d0' : '#f5b8e8',
      bg: positive ? 'rgba(18, 46, 36, 0.94)' : 'rgba(54, 18, 46, 0.94)',
      border: positive ? '#56ab80' : '#c95ca8',
      tooltip: {
        title,
        tag,
        tagTone: positive ? 'default' : 'danger',
        accent: sp ? ALIGNMENT_META[sp.alignment].textColor : positive ? '#84e8b4' : '#f29ee0',
        badges,
        lines,
      },
    });
  };
}

/** 构造单位当前激活的控场与术式状态效果徽章 */
function appendStatusEffectBadges(unit: BattleUnit, state: BattleState, list: HudIconBadge[]): void {
  if (unit.statusEffects?.stunnedRounds > 0) {
    list.push({
      id: 'status_stunned',
      icon: 'stunOnHit',
      polarity: 'negative',
      roundsBadge: `${unit.statusEffects.stunnedRounds}`,
      shortLabel: '定身',
      accent: '#ffe680',
      bg: 'rgba(58, 42, 16, 0.95)',
      border: '#e6be4c',
      tooltip: {
        title: '符箓定身中',
        tag: `剩余 ${unit.statusEffects.stunnedRounds} 回合`,
        tagTone: 'danger',
        accent: '#ffe680',
        badges: [SPEC_BADGE_CONTROL],
        lines: ['下次轮到行动时将被强制跳过行动权并解除定身。'],
      },
    });
  }

  if (unit.statusEffects?.terrifiedRounds > 0) {
    list.push({
      id: 'status_terrified',
      icon: 'terrorOnHit',
      polarity: 'negative',
      roundsBadge: `${unit.statusEffects.terrifiedRounds}`,
      shortLabel: '震慑',
      accent: '#ff80a8',
      bg: 'rgba(60, 16, 36, 0.95)',
      border: '#e64578',
      tooltip: {
        title: '噩梦震慑中',
        tag: `剩余 ${unit.statusEffects.terrifiedRounds} 回合`,
        tagTone: 'danger',
        accent: '#ff80a8',
        badges: [SPEC_BADGE_CONTROL],
        lines: ['防御力 -15%，且下次轮到行动时将被强制跳过行动权。'],
      },
    });
  }

  const se = unit.statusEffects;
  const pushStatus = createStatusPusher(list);

  if (se?.blindRounds && se.blindRounds > 0) {
    pushStatus('st_blind', 'spell_slow', '宵暗', '闇符「宵暗蔽目」', `剩余 ${se.blindRounds} 回合`, ['深陷宵暗跳过行动，受到任意伤害立刻惊醒解除。'], false, 'order_blind', `${se.blindRounds}`);
  }
  if (se?.confusionRounds && se.confusionRounds > 0) {
    pushStatus('st_confuse', 'spell_curse', '迷雾', '迷符「迷乱魔雾」', `剩余 ${se.confusionRounds} 回合`, ['神志迷乱，轮到行动时跳过本巡。'], false, 'chaos_confusion', `${se.confusionRounds}`);
  }
  if (se?.songOfPeaceRounds && se.songOfPeaceRounds > 0) {
    pushStatus('st_peace', 'spell_ward', '镇魂', '镇符「镇魂神乐」', `剩余 ${se.songOfPeaceRounds} 回合`, ['无法发起攻击或施放法术，受伤即破除。'], false, 'life_song_of_peace', `${se.songOfPeaceRounds}`);
  }
  if (se?.cowardiceRounds && se.cowardiceRounds > 0) {
    pushStatus('st_coward', 'terrorOnHit', '畏惧', '怯符「畏惧之瞳」', `剩余 ${se.cowardiceRounds} 回合`, ['不敢主动攻击总生命高于自身的敌军。'], false, 'order_cowardice', `${se.cowardiceRounds}`);
  }
  if (se?.berserkRounds && se.berserkRounds > 0) {
    pushStatus('st_berserk', 'spell_aoe', '月狂', '狂符「月狂赤瞳」', `剩余 ${se.berserkRounds} 回合`, ['理智崩坏，自动猛攻最近的任意单位，不分敌我。'], false, 'order_berserk', `${se.berserkRounds}`);
  }
  if (se?.hypnotizedRounds && se.hypnotizedRounds > 0) {
    pushStatus('st_hypno', 'spell_curse', '傀儡', '梦符「迷梦傀儡」', `剩余 ${se.hypnotizedRounds} 回合`, ['已被敌方迷梦操控，暂时转为对方阵营作战。'], false, 'order_hypnotize', `${se.hypnotizedRounds}`);
  }
  if (se?.poisonPower && se.poisonPower > 0) {
    pushStatus('st_poison', 'spell_curse', '铃兰毒', '毒符「铃兰剧毒」', `-${se.poisonPower}/回`, ['每回合开始承受持续剧毒流血伤害。'], false, 'death_poison', '毒');
  }
  if (se?.plaguePower && se.plaguePower > 0) {
    pushStatus('st_plague', 'death_magic', '瘴疫', '瘴符「黄泉瘴疫」', `-${se.plaguePower}/回`, ['每回合开始承受持续黄泉瘴疫折损。'], false, 'death_plague', '疫');
  }
  if (se?.frozenRounds && se.frozenRounds > 0) {
    pushStatus('st_frozen', 'freezingAttack', '冰封', '寒霜冻结', `剩余 ${se.frozenRounds} 回合`, ['被深渊寒冰彻底冻结，轮到行动时强制跳过。'], false, undefined, `${se.frozenRounds}`);
  }
  if (se?.agedRounds && se.agedRounds > 0) {
    pushStatus('st_aged', 'agingOnHit', '衰老', '衰老触碰', `剩余 ${se.agedRounds} 回合`, ['攻击 -25%、防御 -20%、移速与先手减半。'], false, undefined, `${se.agedRounds}`);
  }
  if (se?.regenPerRound && se.regenPerRound > 0) {
    pushStatus('st_regen', 'spell_heal', '不息', '生符「生生不息」', `+${se.regenPerRound}/回`, ['每回合开始自动恢复首兵生命值。'], true, 'life_regeneration', '+');
  }
  if (se?.tempShieldHp && se.tempShieldHp > 0) {
    pushStatus('st_hshield', 'spell_ward', '二重界', '结界「二重结界」', `护盾 ${se.tempShieldHp}`, ['优先吸收一切物理与法术伤害直至耗尽。'], true, 'life_heavenly_shield', '盾');
  }
  if (se?.guardianAngelLives && se.guardianAngelLives > 0) {
    pushStatus('st_gangel', 'resurrection', '护命', '神使「御神护命」', `余 ${se.guardianAngelLives} 次`, ['濒临全灭瞬间神使降临，抵消毁灭并重聚 35% 兵力。'], true, 'life_guardian_angel', `×${se.guardianAngelLives}`);
  }
  if (se?.sanctuary) {
    pushStatus('st_sanctuary', 'spell_ward', '净域', '净域「常世净域」', '绝对无敌', ['隐入常世免疫一切攻击与法术，一旦移动、攻击或施法即解除。'], true, 'life_sanctuary', '绝');
  }
  if (se?.martyrProtectedByUnitId) {
    const protector = state.units[se.martyrProtectedByUnitId];
    if (protector && protector.status === 'alive') {
      pushStatus('st_martyr', 'life_magic', '替身', '偶符「替身雏偶」', `由 ${protector.name} 承伤`, ['本单位所受的一切伤害均转嫁给替身友军承受。'], true, 'life_martyr', '替');
    }
  }
  if (se?.bless) {
    pushStatus('st_bless', 'life_magic', '神祝', '祝符「神祝满盈」', '满额伤害', ['近战与远程攻击恒定打出最大伤害。'], true, 'life_bless');
  }
  if (se?.curse) {
    pushStatus('st_curse', 'death_magic', '厄祟', '祟符「厄祟缠身」', '最低伤害', ['近战与远程攻击恒定只打出最小伤害。'], false, 'death_curse');
  }
  if (se?.retribution) {
    pushStatus('st_retrib', 'fireShield', '报应', '罚符「因果报应」', '反伤 35%', ['遭受近战打击时将 35% 伤害反射给攻击方。'], true, 'life_retribution');
  }
  if (se?.painMirror) {
    pushStatus('st_pmirror', 'order_magic', '水镜', '痛镜「因果水镜」', '反伤 50%', ['遭受近战或远程打击时将 50% 伤害反射给攻击方。'], true, 'order_pain_mirror');
  }
  if (se?.magicMirror) {
    pushStatus('st_mmirror', 'magicImmune', '折光', '镜符「贤者折光」', '50% 弹反', ['遭敌方单体伤害法术指定时，将 50% 威力反向弹回施法者。'], true, 'chaos_magic_mirror');
  }
  if (se?.vampiricTouch) {
    pushStatus('st_vamp', 'death_magic', '绯血', '红符「绯红吸血」', '吸血 50%', ['近战攻击活体目标时，将造成伤害的 50% 转化为自身回复与兵力复苏。'], true, 'death_vampiric_touch');
  }
  if (se?.fireAura) {
    pushStatus('st_faura', 'chaos_magic', '炎缠', '炎符「不死炎缠」', '近战 +25%', ['近战攻击附带额外 +25% 火焰灼烧伤害，不加成远程射击。'], true, 'chaos_fire_aura');
  }
  if (se?.auraOfFear) {
    pushStatus('st_fear', 'terrorOnHit', '威慑', '怖符「幽冥威慑」', '免反击', ['进攻活体非魔免敌军时完全压制对方反击，对机械、不死、元素、幻象无效。'], true, 'death_aura_of_fear');
  }
  if (se?.slayer) {
    pushStatus('st_slayer', 'atk', '屠龙', '斩符「屠龙魔刃」', '对 4 阶 +50%', ['攻击 4 阶巨兽与龙类单位时伤害额外 +50%。'], true, 'chaos_slayer');
  }
  if (se?.blur) {
    pushStatus('st_blur', 'stealth', '蜃影', '幻符「蜃气残影」', '远程 -35%', ['擦弹率 +25%，且遭受远程射击伤害额外 -35%。'], true, 'order_blur');
  }
  if (se?.precisionRounds && se.precisionRounds > 0) {
    pushStatus('st_precision', 'longRange', '狙定', '瞳符「天眼狙定」', `剩余 ${se.precisionRounds} 回合`, ['仅远程射击时攻击 +25%，并无视距离与普通障碍衰减，不加成近战。'], true, 'order_precision', `${se.precisionRounds}`);
  }
  if (se?.bloodlustRounds && se.bloodlustRounds > 0) {
    pushStatus('st_bloodlust', 'chaos_magic', '狂战', '鬼符「鬼神狂战」', `剩余 ${se.bloodlustRounds} 回合`, ['仅近战攻击伤害 +25%，不加成远程射击。'], true, 'chaos_bloodlust', `${se.bloodlustRounds}`);
  }
  if (se?.rabbitFormRounds && se.rabbitFormRounds > 0) {
    pushStatus(
      'st_rabbit_form',
      'spell_haste',
      '兔化',
      '兔符「兔化」',
      `剩余 ${se.rabbitFormRounds} 回合`,
      ['月影白兔真身形态生效中，到期或遭驱散后自动还原原形态。', '获得先攻压制 · 位移距离 +50% · 先手主动 +50% · 擦弹率 +50%。'],
      true,
      'order_rabbit_transform',
      `${se.rabbitFormRounds}`,
    );
  }
  if (se?.terrainWalk) {
    pushStatus('st_twalk', 'nature_magic', '履平', '步符「山林履平」', '无视减速', ['移动无视竹林与泥沼陷地等地面减速惩罚。'], true, 'nature_terrain_walk');
  }
  if (se?.powerDrain || se?.magicLeechCasterId) {
    pushStatus('st_pdrain', 'order_magic', '耗蓝×2', se.magicLeechCasterId ? '噬符「噬灵魔蛭」' : '涸符「灵脉枯竭」', '法力翻倍', ['施放法术消耗灵力翻倍。'], false, se.magicLeechCasterId ? 'death_magic_leech' : 'order_power_drain');
  }
  if (se?.spellShacklePower && se.spellShacklePower > 0) {
    pushStatus('st_shackle', 'chaos_magic', '咒缚', '缚符「咒缚反噬」', '施法反噬', ['每次施放法术都将按耗蓝承受剧烈灵力灼伤。'], false, 'chaos_spell_shackle');
  }
  if (se?.antiMagic) {
    pushStatus('st_antimagic', 'magicImmune', '反魔', '绝符「无魔绝域」', '全魔免', ['临时免疫一切正负面法术，可被星律解咒解除。'], true, 'nature_anti_magic');
  }
  if (se?.defenderBonus) {
    pushStatus('st_defender', 'defending', '不动', '守符「不动如山」', '防御 +50%', ['进入防御姿态时额外获得 +50% 护甲加成。'], true, 'life_defender');
  }
  if (se?.schoolWards && Object.keys(se.schoolWards).length > 0) {
    const firstSchool = Object.keys(se.schoolWards)[0];
    const wardIcon =
      firstSchool === 'death'
        ? 'life_death_ward'
        : firstSchool === 'order'
          ? 'life_order_ward'
          : firstSchool === 'nature'
            ? 'life_nature_ward'
            : 'life_chaos_ward';
    const names = Object.keys(se.schoolWards)
      .map((k) => ALIGNMENT_META[k as keyof typeof ALIGNMENT_META]?.systemLabel ?? k)
      .join(' / ');
    pushStatus('st_swards', 'spell_ward', '御界', '结界「御系大结界」', '防 +50% · 魔伤减半', [`已激活防护：${names}`], true, wardIcon);
  }
}

/** 构造高台加成、防御姿态、已反击标记与战场结界光环徽章 */
function appendBattlefieldAndAuraStatuses(unit: BattleUnit, state: BattleState, list: HudIconBadge[]): void {
  if (unit.status === 'alive' && isUnitOnHighlandPlatform(state, unit)) {
    list.push({
      id: 'status_highland_platform',
      icon: 'ranged',
      polarity: 'positive',
      shortLabel: '高台',
      accent: '#9be7ff',
      bg: 'rgba(18, 42, 58, 0.94)',
      border: '#58b3d8',
      tooltip: {
        title: '站台高地加成',
        subtitle: '制高点视野与法术增幅',
        tag: '施法+50%',
        accent: '#9be7ff',
        badges: [SPEC_BADGE_DEFENSE],
        lines: [
          '• 承受来自低处的远程射击伤害 -25%。',
          '• 施放全部有射程术式时，有效施法距离 +50%。',
        ],
      },
    });
  }

  if (unit.isDefending) {
    list.push({
      id: 'status_defending',
      icon: 'defending',
      polarity: 'positive',
      roundsBadge: '1',
      shortLabel: '防御',
      accent: '#b9f0d2',
      bg: 'rgba(20, 48, 36, 0.94)',
      border: '#58b384',
      tooltip: {
        title: '防御姿态',
        tag: '剩余 1 回合',
        accent: '#82e0b0',
        badges: [SPEC_BADGE_DEFENSE],
        lines: ['当前防御力 +35%，持续至下次行动开始。'],
      },
    });
  }

  if (unit.hasRetaliatedThisRound && !unit.abilities.unlimitedRetaliation) {
    list.push({
      id: 'status_retaliated',
      icon: 'noRetaliation',
      polarity: 'negative',
      shortLabel: '已反',
      accent: '#f5b8c1',
      bg: 'rgba(56, 18, 28, 0.94)',
      border: '#c74c5e',
      tooltip: {
        title: '本回合已反击',
        tag: '本巡无反击',
        tagTone: 'danger',
        accent: '#eb6e80',
        badges: [SPEC_BADGE_LIMIT],
        lines: ['本回合近战与远程反击次数已耗尽，待下回合开始重新恢复；拥有无限反击特技的单位不受此限。'],
      },
    });
  }

  if (state.activeFieldAura) {
    const aura = state.activeFieldAura;
    const isAlly = aura.casterSide === unit.side;
    const mods = isAlly ? aura.allyModifiers : aura.enemyModifiers;
    const polMeta = isAlly ? SPELL_POLARITY_META.buff : SPELL_POLARITY_META.debuff;
    list.push({
      id: `aura_${aura.id}`,
      icon: 'aura',
      polarity: isAlly ? 'positive' : 'negative',
      roundsBadge: `${aura.remainingRounds}`,
      shortLabel: '结界',
      accent: aura.accentColor,
      bg: 'rgba(40, 18, 34, 0.95)',
      border: aura.themeColor,
      tooltip: {
        title: aura.name,
        subtitle: isAlly ? '友方结界领域增益' : '敌方符卡领域威压',
        tag: `剩余 ${aura.remainingRounds} 回合`,
        tagTone: isAlly ? 'default' : 'danger',
        accent: aura.accentColor,
        badges: [{ label: isAlly ? '领域增益' : '领域威压', icon: polMeta.icon, color: polMeta.color, bg: polMeta.bg, border: polMeta.border }],
        lines: mods.map((m) => {
          const val = m.mode === 'percent' ? `${m.value >= 0 ? '+' : ''}${Math.round(m.value * 100)}%` : `${m.value >= 0 ? '+' : ''}${m.value}`;
          return `${statKeyLabel(m.stat)} ${val}`;
        }),
      },
    });
  }
}

/** 按来源名称合并同类临时术式 Buff/Debuff，并继承 spellId 显示 24×24 专属法术图标 */
function appendGroupedModifierStatuses(unit: BattleUnit, list: HudIconBadge[]): void {
  const se = unit.statusEffects;
  const grouped = new Map<string, { remaining: number | null; positive: boolean; spellId?: string; lines: string[] }>();
  for (const mod of unit.modifiers) {
    // 兔化与衰老已由专属状态徽标统一承载详述，避免重复渲染多枚相同图标
    if (mod.spellId === 'order_rabbit_transform' && se?.rabbitFormRounds && se.rabbitFormRounds > 0) {
      continue;
    }
    if (mod.spellId === 'ability:aging' && se?.agedRounds && se.agedRounds > 0) {
      continue;
    }
    const entry = grouped.get(mod.sourceName) ?? {
      remaining: mod.remainingRounds,
      positive: mod.spellPolarity ? mod.spellPolarity === 'positive' : mod.value >= 0,
      spellId: mod.spellId,
      lines: [],
    };
    if (!entry.spellId && mod.spellId) entry.spellId = mod.spellId;
    const val =
      mod.mode === 'percent'
        ? `${mod.value >= 0 ? '+' : ''}${Math.round(mod.value * 100)}%`
        : `${mod.value >= 0 ? '+' : ''}${mod.value}`;
    entry.lines.push(`${statKeyLabel(mod.stat)} ${val}`);
    grouped.set(mod.sourceName, entry);
  }

  for (const [sourceName, info] of grouped.entries()) {
    const sp = info.spellId ? TOUHOU_CATALOG.spells[info.spellId] : undefined;
    const polMeta = info.positive ? SPELL_POLARITY_META.buff : SPELL_POLARITY_META.debuff;
    const badges: HudTooltipMiniBadge[] = [];
    if (sp) {
      const am = ALIGNMENT_META[sp.alignment];
      badges.push({ label: am.name, color: am.textColor, bg: 'rgba(22, 16, 26, 0.92)', border: am.themeColor });
    }
    badges.push({ label: polMeta.label, icon: polMeta.icon, color: polMeta.color, bg: polMeta.bg, border: polMeta.border });
    list.push({
      id: `mod_${sourceName}`,
      icon: info.positive ? 'buff' : 'debuff',
      spellIconId: info.spellId,
      roundsBadge: info.remaining != null ? `${info.remaining}` : undefined,
      polarity: info.positive ? 'positive' : 'negative',
      shortLabel: sourceName.replace(/^[^·]+·/, '').slice(0, 3),
      accent: info.positive ? '#b8f0d0' : '#e6bcf5',
      bg: info.positive ? 'rgba(18, 46, 36, 0.94)' : 'rgba(48, 20, 56, 0.94)',
      border: info.positive ? '#56ab80' : '#a862c7',
      tooltip: {
        title: sourceName,
        tag: info.remaining != null ? `剩余 ${info.remaining} 回合` : '持续效果',
        tagTone: info.positive ? 'default' : 'danger',
        accent: sp ? ALIGNMENT_META[sp.alignment].textColor : info.positive ? '#7fe0ae' : '#d699f0',
        badges,
        lines: info.lines,
      },
    });
  }
}

/** 构造单位当前激活的实时状态/法术/结界光环图标列表（统一阵营与极性胶囊、零冗余括号） */
export function buildUnitStatusBadges(unit: BattleUnit, state: BattleState): HudIconBadge[] {
  const list: HudIconBadge[] = [];

  appendStatusEffectBadges(unit, state, list);
  appendBattlefieldAndAuraStatuses(unit, state, list);
  appendGroupedModifierStatuses(unit, list);

  return list.slice(0, 20);
}

/**
 * HUD 悬浮提示与图标徽章的公共类型定义
 */

export interface HudTooltipMiniBadge {
  label: string;
  icon?: string;
  color: string;
  bg: string;
  border: string;
}

export interface HudTooltipPayload {
  title: string;
  subtitle?: string;
  tag?: string;
  tagTone?: 'default' | 'danger' | 'muted';
  accent?: string;
  /** 标题下方胶囊徽章（如阵营色胶囊 + 极性图标胶囊 / 生物类型图标胶囊） */
  badges?: HudTooltipMiniBadge[];
  /** 可选简介段（置于客观效果上方） */
  summary?: string;
  /** 客观效果正文行 */
  lines: string[];
  /** 可选斜体小字彩蛋文本（置于底部） */
  flavor?: string;
}

export interface HudIconBadge {
  id: string;
  icon: string;
  /** 若该状态源自特定法术，直接渲染对应的 24×24 手绘专属法术像素图标 */
  spellIconId?: string;
  /** 可选角标（例如剩余回合数 "3" 或护命次数 "×2"） */
  roundsBadge?: string;
  polarity?: 'positive' | 'negative';
  shortLabel?: string;
  accent: string;
  bg: string;
  border: string;
  tooltip: HudTooltipPayload;
}

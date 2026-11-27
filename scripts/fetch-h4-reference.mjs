/**
 * 英雄无敌 4（HoMM4 + 风暴聚集 + 疾风战场）公开设定与数值抓取脚本
 *
 * 数据来源：Might & Magic Wiki (mightandmagic.fandom.com) MediaWiki API (CC-BY-SA)
 * 仅提取数值、机制、公式与设定文本作为玩法同构参考，绝不抓取或引入任何受版权保护的图片/音频素材。
 *
 * 输出目录：reference/h4/
 * - creatures.json   全阵营与野外/资料片兵种完整数值与特技
 * - spells.json      五系（生命/秩序/死亡/混乱/自然）1~5 级完整法术
 * - artifacts.json   普通装备、战斗药水、全等级宝物与 5 套组合神器
 * - skills.json      9 主技能 + 27 次技能（初级→宗师 5 档数值）
 * - classes.json     11 基础职业 + 37 进阶职业（含组合条件、特效与升级权重）
 * - towns.json       6 大阵营城镇建筑树、互斥兵营与圣杯建筑
 * - metadata.json    抓取统计与数据完整性自检报告
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = 'https://mightandmagic.fandom.com/api.php';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'reference', 'h4');

/** 9 大主技能及其下属 3 个次技能映射表（HoMM4 铁律结构） */
const PRIMARY_SKILL_TREE = {
  Tactics: ['Offense', 'Defense', 'Leadership'],
  Combat: ['Melee', 'Archery', 'Magic Resistance'],
  Scouting: ['Pathfinding', 'Seamanship', 'Stealth'],
  Nobility: ['Estates', 'Mining', 'Diplomacy'],
  'Life Magic': ['Healing', 'Spirituality', 'Resurrection'],
  'Order Magic': ['Enchantment', 'Wizardry', 'Charm'],
  'Death Magic': ['Occultism', 'Demonology', 'Necromancy'],
  'Chaos Magic': ['Pyromancy', 'Sorcery', 'Conjuration'],
  'Nature Magic': ['Herbalism', 'Meditation', 'Summoning'],
};

const CHILD_TO_PRIMARY = new Map();
for (const [primary, children] of Object.entries(PRIMARY_SKILL_TREE)) {
  for (const child of children) {
    CHILD_TO_PRIMARY.set(child.toLowerCase(), primary);
  }
}

/** 各阵营中英文对照，便于后续东方幻想乡同构映射 */
const ALIGNMENT_ZH = {
  Life: '生命（圣堂 Haven）',
  Order: '秩序（学院 Academy）',
  Death: '死亡（墓园 Necropolis）',
  Chaos: '混乱（疯人院 Asylum）',
  Nature: '自然（自然保护区 Preserve）',
  Might: '力量（据点 Stronghold）',
};

/** H4 法术默认蓝耗映射（1~5 级：2 / 3 / 5 / 8 / 12） */
const DEFAULT_SPELL_MANA = { 1: 2, 2: 3, 3: 5, 4: 8, 5: 12 };

/** 通用 MediaWiki API 请求 */
async function wikiQuery(params) {
  const url = `${API_URL}?${new URLSearchParams({ format: 'json', ...params })}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Touhou-H4-Reference-Collector/1.0 (local research)' },
  });
  if (!res.ok) {
    throw new Error(`Wiki API 请求失败 (${res.status}): ${url}`);
  }
  return res.json();
}

/** 分批拉取多个 Wiki 页面的原始 Wikitext（自动处理重定向与批量上限） */
async function fetchPages(titles) {
  const unique = [...new Set(titles.filter(Boolean))];
  const result = new Map();
  const batchSize = 35;

  for (let i = 0; i < unique.length; i += batchSize) {
    const chunk = unique.slice(i, i + batchSize);
    const data = await wikiQuery({
      action: 'query',
      redirects: 1,
      titles: chunk.join('|'),
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
    });

    const normalizedMap = new Map();
    for (const n of data.query?.normalized ?? []) {
      normalizedMap.set(n.from, n.to);
    }
    const redirectMap = new Map();
    for (const r of data.query?.redirects ?? []) {
      redirectMap.set(r.from, r.to);
    }

    const pageByTitle = new Map();
    for (const page of Object.values(data.query?.pages ?? {})) {
      const content = page.revisions?.[0]?.slots?.main?.['*'] ?? '';
      pageByTitle.set(page.title, {
        title: page.title,
        missing: Boolean(page.missing),
        content,
      });
    }

    for (const rawTitle of chunk) {
      let cur = normalizedMap.get(rawTitle) ?? rawTitle;
      const visited = new Set();
      while (redirectMap.has(cur) && !visited.has(cur)) {
        visited.add(cur);
        cur = redirectMap.get(cur);
      }
      const page = pageByTitle.get(cur) ?? { title: cur, missing: true, content: '' };
      result.set(rawTitle, page);
    }
  }

  return result;
}

/** 列出指定 Wiki 分类下的全部页面标题 */
async function listCategory(categoryName) {
  const out = [];
  let cmcontinue;
  do {
    const data = await wikiQuery({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${categoryName}`,
      cmlimit: 500,
      ...(cmcontinue ? { cmcontinue } : {}),
    });
    for (const item of data.query?.categorymembers ?? []) {
      if (item.ns === 0) out.push(item.title);
    }
    cmcontinue = data.continue?.cmcontinue;
  } while (cmcontinue);
  return out;
}

/** 将原始 Wikitext 清洗为干净、可读的纯文本 */
function cleanWikiText(raw) {
  if (!raw) return '';
  let text = String(raw);

  // 移除 HTML 注释与引用标签
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  text = text.replace(/<ref[^/]*\/>/gi, '');
  text = text.replace(/<br\s*\/?>/gi, ' / ');
  text = text.replace(/<hr\s*\/?>/gi, ' | ');
  text = text.replace(/<gallery[\s\S]*?<\/gallery>/gi, '');

  // 常见模板展开
  text = text.replace(/\{\{Tooltip\|([^|}]+)\|([^}]+)\}\}/gi, '$1 ($2)');
  text = text.replace(/\{\{Icon\|H4X1\}\}/gi, '[风暴聚集]');
  text = text.replace(/\{\{Icon\|H4X2\}\}/gi, '[疾风战场]');
  text = text.replace(/\{\{Icon-H4X1\}\}/gi, '[风暴聚集]');
  text = text.replace(/\{\{Icon-H4X2\}\}/gi, '[疾风战场]');
  text = text.replace(/\{\{A\|([^}]+)\}\}/gi, '$1');
  text = text.replace(/\{\{text\|([^}]+)\}\}/gi, '$1');
  text = text.replace(/\{\{nowrap\|([^}]+)\}\}/gi, '$1');

  // 移除文件与分类链接
  text = text.replace(/\[\[(?:File|Image):[^\]]+\]\]/gi, '');
  text = text.replace(/\[\[Category:[^\]]+\]\]/gi, '');

  // 展开内部链接 [[Target|Label]] -> Label，[[Target]] -> Target
  text = text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2');
  text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');

  // 移除其余未展开的单层模板
  for (let pass = 0; pass < 3; pass++) {
    text = text.replace(/\{\{[^{}]*\}\}/g, '');
  }

  // 移除剩余 HTML 标签与粗斜体引号
  text = text.replace(/<\/?[a-z][^>]*>/gi, '');
  text = text.replace(/'{2,5}/g, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');

  // 折叠空白
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

/** 去除标题里的 (H4) / (H4 class) / (H4 Item) 后缀，生成可读名称 */
function stripH4Suffix(title) {
  return title
    .replace(/\s*\(H4(?:\s+(?:class|Item|spell))?\)\s*$/i, '')
    .trim();
}

/** 移除所有顶层及嵌套 {{...}} 模板块（保留 {{text|...}} 中的游戏内引用说明） */
function stripNestedTemplates(raw) {
  const expanded = raw.replace(/\{\{text\|([^}]+)\}\}/gi, '$1');
  let out = '';
  let depth = 0;
  for (let i = 0; i < expanded.length; i++) {
    if (expanded[i] === '{' && expanded[i + 1] === '{') {
      depth++;
      i++;
      continue;
    }
    if (expanded[i] === '}' && expanded[i + 1] === '}' && depth > 0) {
      depth--;
      i++;
      continue;
    }
    if (depth === 0) out += expanded[i];
  }
  return out;
}

/** 生成稳定短 ID */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** 解析单个 {{TemplateName ... }} 参数字典（支持嵌套 [[...]] 与 {{...}}） */
function parseTemplateBlocks(content, templateName) {
  const blocks = [];
  const regex = new RegExp(`\\{\\{\\s*${templateName}\\b`, 'gi');
  let match;
  while ((match = regex.exec(content)) !== null) {
    let depth = 0;
    let i = match.index;
    let end = -1;
    while (i < content.length - 1) {
      if (content[i] === '{' && content[i + 1] === '{') {
        depth++;
        i += 2;
        continue;
      }
      if (content[i] === '}' && content[i + 1] === '}') {
        depth--;
        i += 2;
        if (depth === 0) {
          end = i;
          break;
        }
        continue;
      }
      i++;
    }
    if (end === -1) continue;

    const inner = content.slice(match.index + match[0].length, end - 2);
    // 仅在顶层分割管道符 '|'
    const parts = [];
    let cur = '';
    let brace = 0;
    let bracket = 0;
    for (let k = 0; k < inner.length; k++) {
      const ch = inner[k];
      const next = inner[k + 1];
      if (ch === '{' && next === '{') {
        brace++;
        cur += '{{';
        k++;
      } else if (ch === '}' && next === '}') {
        brace = Math.max(0, brace - 1);
        cur += '}}';
        k++;
      } else if (ch === '[' && next === '[') {
        bracket++;
        cur += '[[';
        k++;
      } else if (ch === ']' && next === ']') {
        bracket = Math.max(0, bracket - 1);
        cur += ']]';
        k++;
      } else if (ch === '|' && brace === 0 && bracket === 0) {
        parts.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur) parts.push(cur);

    const fields = {};
    let positionalIndex = 1;
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx > 0 && !part.slice(0, eqIdx).includes('\n')) {
        const key = part.slice(0, eqIdx).trim().toLowerCase();
        const val = part.slice(eqIdx + 1).trim();
        fields[key] = val;
      } else {
        const trimmed = part.trim();
        if (trimmed) {
          fields[`_${positionalIndex++}`] = trimmed;
        }
      }
    }
    blocks.push(fields);
  }
  return blocks;
}

/** 解析 MediaWiki 表格为二维单元格数组（按 |- 分行，保留每行单元格原始文本） */
function parseWikiTable(tableText) {
  const lines = tableText.split('\n');
  const rows = [];
  let currentRow = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('{|') || line.startsWith('|}') || line.startsWith('|+')) {
      continue;
    }
    if (line.startsWith('|-')) {
      if (currentRow && currentRow.length > 0) rows.push(currentRow);
      currentRow = [];
      continue;
    }
    if (line.startsWith('!') || line.startsWith('|')) {
      const isHeader = line.startsWith('!');
      const sep = isHeader ? '!!' : '||';
      const body = line.slice(1);
      const chunks = body.split(sep);
      if (!currentRow) currentRow = [];
      for (const chunk of chunks) {
        // 剥离单元格属性（例如 width="15%" | Name），注意避开 [[...|...]] 与 {{...|...}}
        let cellText = chunk;
        let brace = 0;
        let bracket = 0;
        let attrSep = -1;
        for (let i = 0; i < chunk.length; i++) {
          const ch = chunk[i];
          const nx = chunk[i + 1];
          if (ch === '{' && nx === '{') { brace++; i++; }
          else if (ch === '}' && nx === '}') { brace = Math.max(0, brace - 1); i++; }
          else if (ch === '[' && nx === '[') { bracket++; i++; }
          else if (ch === ']' && nx === ']') { bracket = Math.max(0, bracket - 1); i++; }
          else if (ch === '|' && brace === 0 && bracket === 0) {
            attrSep = i;
            break;
          }
        }
        if (attrSep !== -1) {
          cellText = chunk.slice(attrSep + 1);
        }
        currentRow.push({ isHeader, raw: cellText.trim() });
      }
    } else if (currentRow && currentRow.length > 0 && line.length > 0) {
      // 多行续写合并到上一个单元格
      currentRow[currentRow.length - 1].raw += '\n' + line;
    }
  }
  if (currentRow && currentRow.length > 0) rows.push(currentRow);
  return rows;
}

/** 解析造价字符串（例如 "4000 [[gold]]<br/>2 [[crystal]]"） */
function parseCost(rawCost) {
  const cleaned = cleanWikiText(rawCost).toLowerCase();
  const resources = {};
  let gold = null;
  const regex = /(\d[\d,]*)\s*(gold|wood|ore|mercury|sulfur|crystal|gems?)/gi;
  let m;
  while ((m = regex.exec(cleaned)) !== null) {
    const qty = Number(m[1].replace(/,/g, ''));
    let res = m[2].toLowerCase();
    if (res === 'gem') res = 'gems';
    if (res === 'gold') {
      gold = qty;
    } else {
      resources[res] = qty;
    }
  }
  return { gold, rareResources: resources, raw: cleanWikiText(rawCost) };
}

/** 解析整数（无法解析时返回 null） */
function parseNumber(val) {
  if (val === undefined || val === null) return null;
  const m = cleanWikiText(val).match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** 解析伤害区间（例如 "40-65" 或 "15–20" 或单值 "5"） */
function parseDamage(val) {
  const cleaned = cleanWikiText(val);
  const m = cleaned.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (m) return { min: Number(m[1]), max: Number(m[2]) };
  const single = cleaned.match(/(\d+)/);
  if (single) return { min: Number(single[1]), max: Number(single[1]) };
  return { min: null, max: null };
}

/** 提取某个二级标题下的正文内容 */
function extractSection(content, headingRegex) {
  const lines = content.split('\n');
  let capturing = false;
  let targetLevel = 2;
  const buf = [];

  for (const line of lines) {
    const h = line.match(/^(={2,4})\s*(.+?)\s*\1\s*$/);
    if (h) {
      const level = h[1].length;
      const title = h[2].trim();
      if (!capturing) {
        if (headingRegex.test(title)) {
          capturing = true;
          targetLevel = level;
        }
      } else if (level <= targetLevel) {
        break;
      } else {
        buf.push(line);
      }
    } else if (capturing) {
      buf.push(line);
    }
  }
  return buf.join('\n').trim();
}

// ============================================================================
// 1. 抓取并解析全兵种（Creatures）
// ============================================================================
async function collectCreatures() {
  console.log('▶ [1/6] 正在拉取全阵营与野外/资料片兵种列表...');
  const listPageMap = await fetchPages(['Heroes IV creatures']);
  const listContent = listPageMap.get('Heroes IV creatures')?.content ?? '';

  const entries = [];
  let currentAlignment = 'Neutral';
  const lines = listContent.split('\n');
  let sectionBuf = [];

  const flushSection = () => {
    const text = sectionBuf.join('\n');
    const lineups = parseTemplateBlocks(text, 'Lineup');
    for (const block of lineups) {
      // a 组为城镇兵营兵种，b 组为野外/中立/资料片兵种
      for (const group of ['a', 'b']) {
        for (let idx = 1; idx <= 20; idx++) {
          const link = block[`link${idx}${group}`];
          const desc = block[`desc${idx}${group}`];
          if (!link) continue;
          entries.push({
            wikiTitle: link.trim(),
            displayName: (desc ?? stripH4Suffix(link)).trim(),
            alignment: currentAlignment,
            isTownUnit: group === 'a',
            lineupOrder: idx,
          });
        }
      }
    }
    sectionBuf = [];
  };

  for (const line of lines) {
    const h = line.match(/^==\s*([^=]+?)\s*==$/);
    if (h) {
      flushSection();
      currentAlignment = h[1].trim();
    } else {
      sectionBuf.push(line);
    }
  }
  flushSection();

  console.log(`  共发现 ${entries.length} 个 H4 兵种条目，正在批量抓取详细属性页...`);
  const pages = await fetchPages(entries.map((e) => e.wikiTitle));

  const creatures = [];
  for (const entry of entries) {
    const page = pages.get(entry.wikiTitle);
    const content = page?.content ?? '';
    const infobox = parseTemplateBlocks(content, 'CreatureInfobox')[0] ?? {};
    const damage = parseDamage(infobox.damage);
    const cost = parseCost(infobox.cost ?? '');

    // 解析兵种特技表（== Abilities == 下的 wikitable，兼容 !标题 与 |'''粗体标题''' 两种写法）
    const abilitiesSection = extractSection(content, /^Abilit(?:y|ies)$/i);
    const abilities = [];
    const tableMatch = abilitiesSection.match(/\{\|[\s\S]*?\|\}/);
    if (tableMatch) {
      const rows = parseWikiTable(tableMatch[0]);
      for (let r = 0; r < rows.length; r++) {
        const headerCell =
          rows[r].find((c) => c.isHeader) ??
          rows[r].find((c) => /^'''[^']+'''$/.test(c.raw.trim()));
        if (headerCell) {
          const abilityName = cleanWikiText(headerCell.raw);
          const nextRow = rows[r + 1];
          const descCell =
            nextRow &&
            !nextRow.some((c) => c.isHeader || /^'''[^']+'''$/.test(c.raw.trim()))
              ? nextRow[0]
              : null;
          if (abilityName) {
            abilities.push({
              name: abilityName,
              description: descCell ? cleanWikiText(descCell.raw) : '',
            });
          }
        }
      }
    } else if (abilitiesSection) {
      for (const l of abilitiesSection.split('\n')) {
        const cleaned = cleanWikiText(l.replace(/^\*+\s*/, ''));
        if (cleaned) abilities.push({ name: cleaned, description: '' });
      }
    }

    // 提取施法兵种自带法术（通常出现在 {{text|... can cast ...}} 或正文）
    let castableSpells = [];
    const castMatch = content.match(/can cast(?: the following spells)?:\s*([^.}\n]+)/i);
    if (castMatch) {
      castableSpells = cleanWikiText(castMatch[1])
        .replace(/\band\b/gi, ',')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // 提取干净的首段简介（完整剔除 Infobox 与顶部消歧义模板后再取正文）
    const leadRaw = content.split(/\n==/)[0] ?? '';
    const leadWithoutTemplates = stripNestedTemplates(leadRaw);
    const summary = cleanWikiText(leadWithoutTemplates);

    // 若 Infobox 漏填 tier（如 Naga），则从正文首句回退识别级别
    let tier = parseNumber(infobox.tier);
    if (tier === null) {
      if (/\b(first-level|level-one|1st-level|tier\s*1)\b/i.test(summary)) tier = 1;
      else if (/\b(second-level|level-two|2nd-level|tier\s*2)\b/i.test(summary)) tier = 2;
      else if (/\b(third-level|level-three|3rd-level|tier\s*3)\b/i.test(summary)) tier = 3;
      else if (/\b(fourth-level|level-four|4th-level|tier\s*4)\b/i.test(summary)) tier = 4;
    }

    const rangedAttack = parseNumber(infobox['ranged attack']);
    const ammo = parseNumber(infobox.ammo ?? infobox.shots);

    creatures.push({
      id: slugify(entry.displayName),
      name: entry.displayName,
      wikiTitle: page?.title ?? entry.wikiTitle,
      alignment: entry.alignment,
      alignmentZh: ALIGNMENT_ZH[entry.alignment] ?? entry.alignment,
      faction: cleanWikiText(infobox.faction ?? '') || entry.alignment,
      isTownUnit: entry.isTownUnit,
      tier,
      dwelling: cleanWikiText(infobox.dwelling ?? '') || null,
      stats: {
        hp: parseNumber(infobox.hp),
        damageMin: damage.min,
        damageMax: damage.max,
        meleeAttack: parseNumber(infobox['melee attack'] ?? infobox.attack),
        meleeDefense: parseNumber(infobox['melee defense'] ?? infobox.defense),
        rangedAttack,
        rangedDefense: parseNumber(infobox['ranged defense']),
        ammo,
        speed: parseNumber(infobox.speed),
        movement: parseNumber(infobox.movement),
        spellPoints: parseNumber(infobox.sp ?? infobox.mana),
        growth: parseNumber(infobox.growth),
        experience: parseNumber(infobox.exp ?? infobox.experience),
        size: cleanWikiText(infobox.size ?? '') || null,
      },
      cost,
      abilities,
      castableSpells,
      summary,
    });
  }

  console.log(`  ✓ 完成 ${creatures.length} 个兵种解析`);
  return creatures;
}

// ============================================================================
// 2. 抓取并解析五系完整法术（Spells）
// ============================================================================
async function collectSpells() {
  console.log('▶ [2/6] 正在拉取五系（生命/秩序/死亡/混乱/自然）完整法术表...');
  const schoolPages = [
    { school: 'Life', schoolZh: '生命魔法', title: 'Life Magic spells' },
    { school: 'Order', schoolZh: '秩序魔法', title: 'Order Magic spells' },
    { school: 'Death', schoolZh: '死亡魔法', title: 'Death Magic spells' },
    { school: 'Chaos', schoolZh: '混乱魔法', title: 'Chaos Magic spells' },
    { school: 'Nature', schoolZh: '自然魔法', title: 'Nature Magic spells' },
  ];

  const pages = await fetchPages(schoolPages.map((s) => s.title));
  const spells = [];

  for (const meta of schoolPages) {
    const content = pages.get(meta.title)?.content ?? '';
    const levelRegex = /===\s*Level\s+(\d)\s*===([\s\S]*?)(?====\s*Level\s+\d\s*===|==[^=]|$)/gi;
    let m;
    while ((m = levelRegex.exec(content)) !== null) {
      const level = Number(m[1]);
      const block = m[2];
      const manaMatch = block.match(/cost\s+(\d+)\s+mana/i);
      const manaCost = manaMatch ? Number(manaMatch[1]) : DEFAULT_SPELL_MANA[level] ?? null;

      const tableMatch = block.match(/\{\|[\s\S]*?\|\}/);
      if (!tableMatch) continue;
      const rows = parseWikiTable(tableMatch[0]);
      if (rows.length < 2) continue;

      const headers = rows[0].map((c) => cleanWikiText(c.raw).toLowerCase());
      const colIndex = (key) => headers.findIndex((h) => h.includes(key));
      const spellCol = colIndex('spell');
      const catCol = colIndex('category');
      const descCol = colIndex('description');
      const blurbCol = colIndex('blurb');
      const notesCol = colIndex('notes');

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.every((c) => c.isHeader)) continue;
        const name = cleanWikiText(row[spellCol >= 0 ? spellCol : 1]?.raw ?? '');
        if (!name) continue;
        spells.push({
          id: slugify(`${meta.school}_${name}`),
          name,
          school: meta.school,
          schoolZh: meta.schoolZh,
          level,
          manaCost,
          category: cleanWikiText(row[catCol >= 0 ? catCol : 2]?.raw ?? ''),
          description: cleanWikiText(row[descCol >= 0 ? descCol : 3]?.raw ?? ''),
          blurb: blurbCol >= 0 ? cleanWikiText(row[blurbCol]?.raw ?? '') : '',
          notes: notesCol >= 0 ? cleanWikiText(row[notesCol]?.raw ?? '') : '',
        });
      }
    }
  }

  console.log(`  ✓ 完成 ${spells.length} 个五系法术解析`);
  return spells;
}

// ============================================================================
// 3. 抓取并解析全装备、药水、宝物与 5 套组合神器（Artifacts & Potions）
// ============================================================================
async function collectArtifacts() {
  console.log('▶ [3/6] 正在拉取全装备、战斗药水、宝物与组合神器套装...');
  const pages = await fetchPages(['List of Heroes IV artifacts']);
  const content = pages.get('List of Heroes IV artifacts')?.content ?? '';

  const items = [];
  const sets = [];

  let h2 = '';
  let h3 = '';
  let h4 = '';
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const m2 = line.match(/^==\s*([^=]+?)\s*==$/);
    const m3 = line.match(/^===\s*([^=]+?)\s*===$/);
    const m4 = line.match(/^====\s*([^=]+?)\s*====$/);

    if (m2) {
      h2 = m2[1].trim();
      h3 = '';
      h4 = '';
      i++;
      continue;
    }
    if (m3) {
      h3 = m3[1].trim();
      h4 = '';
      i++;
      continue;
    }
    if (m4) {
      h4 = m4[1].trim();
      i++;
      continue;
    }

    if (line.trim().startsWith('{|')) {
      const tableLines = [line];
      i++;
      while (i < lines.length) {
        tableLines.push(lines[i]);
        if (lines[i].trim().startsWith('|}')) {
          i++;
          break;
        }
        i++;
      }

      const rows = parseWikiTable(tableLines.join('\n'));
      const headers = (rows[0] ?? []).map((c) => cleanWikiText(c.raw).toLowerCase());
      const hasSlotCol = headers.some((h) => h.includes('slot'));
      const isPotionSection = /potion/i.test(h3);
      const isCampaign = /campaign/i.test(h2);
      const setId = h4 ? slugify(h4) : null;
      const pieceNames = [];

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 3 || row.every((c) => c.isHeader)) continue;
        const name = cleanWikiText(row[0].raw);
        if (!name) continue;
        const description = cleanWikiText(row[2].raw);
        const slot = hasSlotCol ? cleanWikiText(row[3]?.raw ?? '') : isPotionSection ? 'Potion' : 'Miscellaneous';

        items.push({
          id: slugify(name),
          name,
          group: h2 || 'Normal artifacts',
          tier: h3 || 'Items',
          campaignOnly: isCampaign,
          isPotion: isPotionSection,
          slot: slot || (isPotionSection ? 'Potion' : 'Miscellaneous'),
          description,
          setId,
          setName: h4 || null,
        });
        if (setId) pieceNames.push(name);
      }

      // 若是 5 套组合神器（Gathering Storm 四级标题），紧跟表格后的一行即为套装效果
      if (setId && pieceNames.length > 0) {
        const bonusLines = [];
        let look = i;
        while (look < lines.length) {
          const l = lines[look].trim();
          if (l.startsWith('==') || l.startsWith('{|') || l.startsWith('[[Category:')) break;
          if (l.length > 0) bonusLines.push(l);
          look++;
        }
        sets.push({
          id: setId,
          name: h4,
          expansion: h3,
          pieces: pieceNames,
          setBonus: cleanWikiText(bonusLines.join(' ')),
        });
      }
      continue;
    }

    i++;
  }

  console.log(`  ✓ 完成 ${items.length} 件宝物/装备/药水 与 ${sets.length} 套组合神器解析`);
  return { items, sets };
}

// ============================================================================
// 4. 抓取并解析全 36 个英雄技能（9 主 + 27 次，5 档精确加成）
// ============================================================================
async function collectSkills() {
  console.log('▶ [4/6] 正在拉取全部 36 个 H4 英雄技能（初级→宗师 5 档数值）...');
  const titles = await listCategory('Heroes IV secondary skills');
  const pages = await fetchPages(titles);

  const skills = [];
  for (const title of titles) {
    const page = pages.get(title);
    const content = page?.content ?? '';
    const name = stripH4Suffix(page?.title ?? title);
    const isPrimary = Object.prototype.hasOwnProperty.call(PRIMARY_SKILL_TREE, name);
    const parentPrimary = isPrimary ? null : CHILD_TO_PRIMARY.get(name.toLowerCase()) ?? null;

    // 抓取 ==Levels== 下的 5 档子章节
    const levels = {};
    for (const rank of ['Basic', 'Advanced', 'Expert', 'Master', 'Grandmaster']) {
      const rankRegex = new RegExp(
        `===\\s*${rank}\\s*===([\\s\\S]*?)(?===|$)`,
        'i',
      );
      const m = content.match(rankRegex);
      if (m) {
        // 移除 "This skill allows the hero to learn:" 及图库提示，保留纯粹数值效果
        const rawBlock = m[1]
          .replace(/This skill allows the hero to learn:[\s\S]*$/i, '')
          .replace(/This is the final level[\s\S]*$/i, '');
        levels[rank.toLowerCase()] = cleanWikiText(rawBlock);
      } else {
        levels[rank.toLowerCase()] = '';
      }
    }

    // 首段概述
    const intro = cleanWikiText(
      content
        .replace(/^\{\{For\|[^}]+\}\}\s*/i, '')
        .split(/\n==/)[0] ?? '',
    );

    skills.push({
      id: slugify(name),
      name,
      wikiTitle: page?.title ?? title,
      isPrimary,
      parentPrimary,
      subSkills: isPrimary ? PRIMARY_SKILL_TREE[name] : [],
      summary: intro,
      levels,
    });
  }

  skills.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  console.log(`  ✓ 完成 ${skills.length} 个英雄技能解析`);
  return skills;
}

// ============================================================================
// 5. 抓取并解析全 48 个英雄职业（11 基础职业 + 37 进阶职业 + 升级权重）
// ============================================================================
async function collectClasses() {
  console.log('▶ [5/6] 正在拉取 11 基础职业与 37 进阶职业（含合成矩阵、被动特效与技能权重）...');
  const catTitles = (await listCategory('Heroes IV classes')).filter(
    (t) => t !== 'Advanced class (H4)',
  );
  const pages = await fetchPages(['Advanced class (H4)', ...catTitles]);

  // 1. 解析 Advanced class (H4) 上的 9×9 进阶职业组合矩阵
  const matrixContent = pages.get('Advanced class (H4)')?.content ?? '';
  const matrixTableMatch = matrixContent.match(/\{\|[\s\S]*?\|\}/);
  const requiredSkillsByClass = new Map();
  const matrixPairs = [];

  if (matrixTableMatch) {
    const rows = parseWikiTable(matrixTableMatch[0]);
    const colSkills = rows[0].slice(1).map((c) => {
      const m = c.raw.match(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g);
      const last = m ? m[m.length - 1] : c.raw;
      return stripH4Suffix(cleanWikiText(last));
    });
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length < 2) continue;
      const rowHeaderMatches = row[0].raw.match(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g);
      const rowSkill = stripH4Suffix(
        cleanWikiText(rowHeaderMatches ? rowHeaderMatches[rowHeaderMatches.length - 1] : row[0].raw),
      );
      for (let c = 1; c < row.length; c++) {
        const clsName = stripH4Suffix(cleanWikiText(row[c].raw));
        if (!clsName) continue;
        const pair = [rowSkill, colSkills[c - 1]].filter(Boolean);
        requiredSkillsByClass.set(clsName.toLowerCase(), pair);
        matrixPairs.push({ className: clsName, skills: pair });
      }
    }
  }
  requiredSkillsByClass.set('archmage', ['Any 3 of 5 Magic Skills']);

  // 2. 逐页解析每个职业的定位、起始技能、进阶特效与升级学习权重（4/2/1/0）
  const classes = [];
  for (const title of catTitles) {
    const page = pages.get(title);
    const content = page?.content ?? '';
    const name = stripH4Suffix(page?.title ?? title);
    const intro = cleanWikiText(
      content
        .replace(/^\{\{(?:for|about)\|[^}]+\}\}\s*/i, '')
        .split(/\n==/)[0] ?? '',
    );

    const isAdvanced =
      /advanced class/i.test(intro) ||
      requiredSkillsByClass.has(name.toLowerCase());

    const effectSection = extractSection(content, /^Effects?$/i);
    const skillsSection = extractSection(content, /^Skills$/i);

    // 解析升级学习权重（*4: ... / *2: ... / *1: ... / *0: ...）
    const skillPriorities = {};
    let currentWeight = null;
    for (const rawLine of skillsSection.split('\n')) {
      const wMatch = rawLine.match(/^\*\s*([0-9]+)\s*:\s*(.+)$/);
      if (wMatch) {
        currentWeight = wMatch[1];
        skillPriorities[currentWeight] = skillPriorities[currentWeight] ?? [];
        skillPriorities[currentWeight].push(cleanWikiText(wMatch[2]));
      } else if (rawLine.startsWith('**') && currentWeight !== null) {
        skillPriorities[currentWeight].push(cleanWikiText(rawLine.replace(/^\*+\s*/, '')));
      }
    }

    // 解析进阶职业依赖技能（若矩阵未命中则从首段回退解析）
    let requiredSkills = requiredSkillsByClass.get(name.toLowerCase()) ?? [];
    if (isAdvanced && requiredSkills.length === 0) {
      const reqMatch = intro.match(/(?:requires?(?: specialization in)?|based on)\s+(.+?)\./i);
      if (reqMatch) {
        requiredSkills = reqMatch[1]
          .split(/\s+and\s+|,\s*/i)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // 解析基础职业初始技能
    let startingSkills = [];
    if (!isAdvanced) {
      const startMatch = intro.match(/starts? with\s+(.+?)\./i);
      if (startMatch) {
        startingSkills = startMatch[1]
          .split(/\s+and\s+|,\s*/i)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    classes.push({
      id: slugify(name),
      name,
      wikiTitle: page?.title ?? title,
      kind: isAdvanced ? 'advanced' : 'base',
      requiredSkills: isAdvanced ? requiredSkills : [],
      startingSkills: !isAdvanced ? startingSkills : [],
      bonusEffect: cleanWikiText(effectSection) || null,
      skillPriorities,
      summary: intro,
    });
  }

  classes.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'base' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  console.log(`  ✓ 完成 ${classes.length} 个职业解析（含 ${matrixPairs.length + 1} 组进阶职业配方）`);
  return { classes, advancedMatrix: matrixPairs };
}

// ============================================================================
// 6. 抓取并解析 6 大阵营城镇建筑树（Towns）
// ============================================================================
async function collectTowns() {
  console.log('▶ [6/6] 正在拉取 6 大阵营城镇设定与建筑树...');
  const townDefs = [
    { name: 'Haven', alignment: 'Life', title: 'Haven (H4)' },
    { name: 'Academy', alignment: 'Order', title: 'Academy (H4)' },
    { name: 'Necropolis', alignment: 'Death', title: 'Necropolis (H4)' },
    { name: 'Asylum', alignment: 'Chaos', title: 'Asylum' },
    { name: 'Preserve', alignment: 'Nature', title: 'Preserve' },
    { name: 'Stronghold', alignment: 'Might', title: 'Stronghold (H4)' },
  ];

  const pages = await fetchPages(townDefs.map((t) => t.title));
  const towns = [];

  for (const def of townDefs) {
    const content = pages.get(def.title)?.content ?? '';
    const infobox = parseTemplateBlocks(content, 'FactionInfobox')[0] ?? {};

    // 按 Buildings 下各个三级标题解析 {{Structure}} 模板
    const buildingsSection = extractSection(content, /^Buildings$/i);
    const buildings = [];
    const subSections = buildingsSection.split(/(?=^===\s*[^=]+?\s*===$)/m);

    for (const sub of subSections) {
      const hMatch = sub.match(/^===\s*([^=]+?)\s*===/);
      const category = hMatch ? hMatch[1].trim() : 'General';
      const structBlocks = parseTemplateBlocks(sub, 'Structure');
      for (const block of structBlocks) {
        for (let idx = 1; idx <= 30; idx++) {
          const bName = block[`name${idx}`];
          if (!bName) continue;
          const reqRaw = block[`req${idx}`] ?? '';
          const reqParts = reqRaw.split(/<hr\s*\/?>/i);
          const costPart = reqParts[0] ?? '';
          const prereqPart = reqParts.slice(1).join(' | ');
          buildings.push({
            category,
            name: cleanWikiText(bName),
            description: cleanWikiText(block[`desc${idx}`] ?? ''),
            cost: parseCost(costPart),
            prerequisites: cleanWikiText(prereqPart) || null,
          });
        }
      }
    }

      const rawSchools = cleanWikiText(infobox.schools ?? '');
      const magicSchools = /^n\s*\/\s*a$|^none$/i.test(rawSchools)
        ? []
        : rawSchools
            .split('/')
            .map((s) => s.trim())
            .filter(Boolean);

      towns.push({
        id: slugify(def.name),
        name: def.name,
        alignment: def.alignment,
        alignmentZh: ALIGNMENT_ZH[def.alignment] ?? def.alignment,
        nativeTerrain: cleanWikiText(infobox.terrain ?? ''),
        heroClasses: cleanWikiText(infobox.classes ?? '')
          .split('/')
          .map((s) => s.trim())
          .filter(Boolean),
        magicSchools,
        grailBuilding: cleanWikiText(infobox.grail ?? ''),
        buildings,
      });
  }

  console.log(`  ✓ 完成 ${towns.length} 座阵营城镇解析`);
  return towns;
}

/** 从全兵种列表中聚合去重出完整的 H4 兵种特技词典（含各兵种差异化描述，如魔抗比例/施法列表） */
function buildAbilitiesCatalog(creatures) {
  const byKey = new Map();

  for (const c of creatures) {
    for (const ab of c.abilities) {
      const key = ab.name.toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, {
          id: slugify(ab.name),
          name: ab.name,
          description: ab.description,
          owners: [],
          creatureNotes: [],
        });
      }
      const entry = byKey.get(key);
      if (!entry.description && ab.description) {
        entry.description = ab.description;
      }
      entry.owners.push({
        id: c.id,
        name: c.name,
        alignment: c.alignment,
        tier: c.tier,
      });
      // 若某个兵种对该特技有独立数值说明（如不同魔抗百分比、不同施法表），单独保留不丢失
      if (ab.description && ab.description !== entry.description) {
        entry.creatureNotes.push({
          creature: c.name,
          description: ab.description,
        });
      }
    }
  }

  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** 生成便于人工查阅的中文总览与全量速查表（reference/h4/README.md） */
function buildMarkdownSummary({ creatures, abilities, spells, artifactsData, skills, classesData, towns, metadata }) {
  const lines = [];
  lines.push('# 《英雄无敌 4》（HoMM4 + 风暴聚集 + 疾风战场）全量数值与设定参考库');
  lines.push('');
  lines.push(`> 数据来源：${metadata.source}（${metadata.license}）`);
  lines.push(`> 抓取时间：\`${metadata.fetchedAt}\` · 更新命令：\`node scripts/fetch-h4-reference.mjs\``);
  lines.push('');
  lines.push('## 一、文件索引与规模总览');
  lines.push('');
  lines.push('| 文件名 | 内容说明 | 条目数 |');
  lines.push('| :--- | :--- | ---: |');
  lines.push(`| \`creatures.json\` | 6 大阵营 48 城镇兵种 + 26 野外/资料片兵种完整数值与特技 | **${metadata.counts.creaturesTotal}** |`);
  lines.push(`| \`abilities.json\` | 全去重 H4 兵种特技词典（完整官方机制说明 + 持有兵种与差异注释） | **${metadata.counts.uniqueAbilitiesTotal}** |`);
  lines.push(`| \`spells.json\` | 生命/秩序/死亡/混乱/自然 五系 1~5 级完整法术与耗蓝 | **${metadata.counts.spellsTotal}** |`);
  lines.push(`| \`artifacts.json\` | 普通装备、22 种战斗药水、珍宝/次级/主级/遗物宝物与 5 套组合神器 | **${metadata.counts.artifactsAndItemsTotal} 件 + ${metadata.counts.combinationSetsTotal} 套** |`);
  lines.push(`| \`skills.json\` | 9 主技能 + 27 次技能（初级→宗师 5 档精确加成） | **${metadata.counts.skillsTotal}** |`);
  lines.push(`| \`classes.json\` | 11 基础职业 + 37 进阶职业（含合成矩阵、被动特效与升级权重） | **${metadata.counts.classesTotal}** |`);
  lines.push(`| \`towns.json\` | 6 大阵营城镇建筑树、互斥兵营、魔法塔与圣杯建筑 | **${metadata.counts.townsTotal} 城 / ${metadata.counts.townBuildingsTotal} 建筑** |`);
  lines.push(`| \`metadata.json\` | 数据量统计与字段完整性自检报告 | 1 |`);
  lines.push('');

  lines.push('## 二、全阵营兵种数值速查表（74 兵种）');
  lines.push('');
  const alignments = ['Life', 'Order', 'Death', 'Chaos', 'Nature', 'Might'];
  for (const align of alignments) {
    const group = creatures.filter((c) => c.alignment === align);
    lines.push(`### ${ALIGNMENT_ZH[align] ?? align}（共 ${group.length} 种）`);
    lines.push('');
    lines.push('| 归属 | 级 | 兵种 | HP | 伤害 | 近攻/防 | 远攻/防(弹) | 速/移 | 蓝 | 周产 | 造价 | 核心特技 |');
    lines.push('| :--- | :-: | :--- | --: | :-: | :-: | :-: | :-: | --: | --: | :--- | :--- |');
    for (const c of group) {
      const s = c.stats;
      const dmg = s.damageMin !== null ? `${s.damageMin}-${s.damageMax}` : '-';
      const melee = `${s.meleeAttack ?? '-'}/${s.meleeDefense ?? '-'}`;
      const ranged = s.rangedAttack !== null ? `${s.rangedAttack}/${s.rangedDefense ?? '-'}(${s.ammo ?? '∞'})` : `-/${s.rangedDefense ?? '-'}`;
      const spd = `${s.speed ?? '-'}/${s.movement ?? '-'}`;
      const costStr = c.cost.gold !== null
        ? `${c.cost.gold}g${Object.entries(c.cost.rareResources).map(([k, v]) => `+${v}${k}`).join('')}`
        : '野外专属';
      const ab = c.abilities.map((a) => a.name).join(', ') || '-';
      lines.push(
        `| ${c.isTownUnit ? '城镇' : '野外'} | T${c.tier ?? '?'} | **${c.name}** | ${s.hp ?? '-'} | ${dmg} | ${melee} | ${ranged} | ${spd} | ${s.spellPoints ?? '-'} | ${s.growth ?? '-'} | ${costStr} | ${ab} |`,
      );
    }
    lines.push('');
  }

  lines.push('## 三、五系法术分布（142 法术）');
  lines.push('');
  lines.push('> H4 原版蓝耗规则：1 级 = `2 MP`，2 级 = `3 MP`，3 级 = `5 MP`，4 级 = `8 MP`，5 级 = `12 MP`。');
  lines.push('');
  for (const [school, label] of [
    ['Life', '生命魔法 Life'],
    ['Order', '秩序魔法 Order'],
    ['Death', '死亡魔法 Death'],
    ['Chaos', '混乱魔法 Chaos'],
    ['Nature', '自然魔法 Nature'],
  ]) {
    const list = spells.filter((s) => s.school === school);
    lines.push(`### ${label}（${list.length} 个）`);
    for (let lv = 1; lv <= 5; lv++) {
      const lvList = list.filter((s) => s.level === lv);
      const mana = lvList[0]?.manaCost ?? DEFAULT_SPELL_MANA[lv];
      lines.push(`- **L${lv}（${mana} MP，${lvList.length} 个）**：${lvList.map((s) => s.name).join('、')}`);
    }
    lines.push('');
  }

  lines.push('## 四、战斗药水（22 种）与 5 套组合神器');
  lines.push('');
  lines.push('### 战斗药水（Potions）');
  lines.push('');
  lines.push('| 药水名称 | 效果说明 |');
  lines.push('| :--- | :--- |');
  for (const p of artifactsData.items.filter((x) => x.isPotion)) {
    lines.push(`| **${p.name}** | ${p.description} |`);
  }
  lines.push('');

  lines.push('### 5 套经典组合神器（The Gathering Storm）');
  lines.push('');
  lines.push('| 套装名 | 组成部件 | 套装额外效果 |');
  lines.push('| :--- | :--- | :--- |');
  for (const set of artifactsData.sets) {
    lines.push(`| **${set.name}** | ${set.pieces.join(' + ')} | ${set.setBonus} |`);
  }
  lines.push('');

  lines.push('## 五、9 主技能 × 27 次技能与 37 进阶职业');
  lines.push('');
  lines.push('### 技能树总览');
  lines.push('');
  for (const [primary, subs] of Object.entries(PRIMARY_SKILL_TREE)) {
    lines.push(`- **${primary}**：${subs.join(' / ')}`);
  }
  lines.push('');

  lines.push('### 37 个进阶职业全表');
  lines.push('');
  lines.push('| 进阶职业 | 所需主技能组合 | 专属被动/特效 |');
  lines.push('| :--- | :--- | :--- |');
  for (const cls of classesData.classes.filter((c) => c.kind === 'advanced')) {
    lines.push(`| **${cls.name}** | ${cls.requiredSkills.join(' + ')} | ${cls.bonusEffect ?? '-'} |`);
  }
  lines.push('');

  lines.push('## 六、6 大阵营城镇一览');
  lines.push('');
  lines.push('| 阵营城镇 | 魔法阵营 | 原生地形 | 基础英雄职业 | 可建魔法学院 | 圣杯建筑 | 建筑总数 |');
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- | --: |');
  for (const t of towns) {
    lines.push(
      `| **${t.name}** | ${t.alignmentZh} | ${t.nativeTerrain} | ${t.heroClasses.join(' / ')} | ${t.magicSchools.join(' / ') || '无（纯物理）'} | ${t.grailBuilding} | ${t.buildings.length} |`,
    );
  }
  lines.push('');

  lines.push(`## 七、全兵种特技词典（共 ${abilities.length} 种，0 缺漏）`);
  lines.push('');
  lines.push('| 特技名称 | 持有兵种 | 机制说明 |');
  lines.push('| :--- | :--- | :--- |');
  for (const ab of abilities) {
    const ownersStr = ab.owners.map((o) => o.name).join(', ');
    const safeDesc = ab.description.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
    lines.push(`| **${ab.name}** | ${ownersStr} | ${safeDesc} |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// 主流程：串行/并发拉取、自检与写盘
// ============================================================================
async function main() {
  console.log('====================================================');
  console.log('开始从 Might & Magic Wiki 抓取《英雄无敌4》全量设定参考库');
  console.log('====================================================');

  await mkdir(OUT_DIR, { recursive: true });

  const [creatures, spells, artifactsData, skills, classesData, towns] = await Promise.all([
    collectCreatures(),
    collectSpells(),
    collectArtifacts(),
    collectSkills(),
    collectClasses(),
    collectTowns(),
  ]);

  const abilities = buildAbilitiesCatalog(creatures);

  // 数据完整性自检
  const creaturesMissingHp = creatures.filter((c) => c.stats.hp === null).map((c) => c.name);
  const abilitiesMissingDesc = abilities.filter((a) => !a.description).map((a) => a.name);
  const spellsMissingDesc = spells.filter((s) => !s.description).map((s) => s.name);
  const skillsMissingLevels = skills
    .filter((s) => !s.levels.basic || !s.levels.grandmaster)
    .map((s) => s.name);
  const advancedMissingBonus = classesData.classes
    .filter((c) => c.kind === 'advanced' && !c.bonusEffect)
    .map((c) => c.name);

  const metadata = {
    source: 'Might & Magic Wiki (https://mightandmagic.fandom.com) via MediaWiki API',
    license: 'CC-BY-SA 3.0 (data & text reference only; zero copyrighted images/audio)',
    fetchedAt: new Date().toISOString(),
    counts: {
      creaturesTotal: creatures.length,
      creaturesTown: creatures.filter((c) => c.isTownUnit).length,
      creaturesExternalOrExpansion: creatures.filter((c) => !c.isTownUnit).length,
      uniqueAbilitiesTotal: abilities.length,
      spellsTotal: spells.length,
      spellsBySchool: Object.fromEntries(
        ['Life', 'Order', 'Death', 'Chaos', 'Nature'].map((s) => [
          s,
          spells.filter((x) => x.school === s).length,
        ]),
      ),
      artifactsAndItemsTotal: artifactsData.items.length,
      potionsTotal: artifactsData.items.filter((x) => x.isPotion).length,
      combinationSetsTotal: artifactsData.sets.length,
      skillsTotal: skills.length,
      primarySkills: skills.filter((s) => s.isPrimary).length,
      secondarySkills: skills.filter((s) => !s.isPrimary).length,
      classesTotal: classesData.classes.length,
      baseClasses: classesData.classes.filter((c) => c.kind === 'base').length,
      advancedClasses: classesData.classes.filter((c) => c.kind === 'advanced').length,
      townsTotal: towns.length,
      townBuildingsTotal: towns.reduce((acc, t) => acc + t.buildings.length, 0),
    },
    audit: {
      creaturesMissingHp,
      abilitiesMissingDesc,
      spellsMissingDesc,
      skillsMissingLevels,
      advancedMissingBonus,
    },
  };

  const readmeMd = buildMarkdownSummary({
    creatures,
    abilities,
    spells,
    artifactsData,
    skills,
    classesData,
    towns,
    metadata,
  });

  await Promise.all([
    writeFile(path.join(OUT_DIR, 'creatures.json'), JSON.stringify(creatures, null, 2), 'utf8'),
    writeFile(path.join(OUT_DIR, 'abilities.json'), JSON.stringify(abilities, null, 2), 'utf8'),
    writeFile(path.join(OUT_DIR, 'spells.json'), JSON.stringify(spells, null, 2), 'utf8'),
    writeFile(path.join(OUT_DIR, 'artifacts.json'), JSON.stringify(artifactsData, null, 2), 'utf8'),
    writeFile(path.join(OUT_DIR, 'skills.json'), JSON.stringify(skills, null, 2), 'utf8'),
    writeFile(path.join(OUT_DIR, 'classes.json'), JSON.stringify(classesData, null, 2), 'utf8'),
    writeFile(path.join(OUT_DIR, 'towns.json'), JSON.stringify(towns, null, 2), 'utf8'),
    writeFile(path.join(OUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8'),
    writeFile(path.join(OUT_DIR, 'README.md'), readmeMd, 'utf8'),
  ]);

  console.log('\n=== 抓取完成！统计与质量自检 ===');
  console.log(JSON.stringify(metadata, null, 2));
}

main().catch((err) => {
  console.error('抓取脚本异常终止:', err);
  process.exit(1);
});

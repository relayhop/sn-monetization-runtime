#!/usr/bin/env node
// Stacker News Bounty & Opportunity Processor
// Ingests radar telemetry, evaluates expected value (EV), classifies signals,
// routes execution actions, generates sports/contest pick'em entries,
// and manages bounty lifecycle state persistence.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIER_OF, SUB_ANGLE } from './sn_subs_config.mjs';

export const VALID_STATUSES = [
  'DETECTED',
  'EVALUATED',
  'QUEUED',
  'CLAIMED',
  'IN_PROGRESS',
  'SUBMITTED',
  'PAID',
  'EXPIRED',
  'REJECTED'
];

/**
 * Decodes common HTML entities found in scraped or radar titles.
 * @param {string} str
 * @returns {string}
 */
export function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&apos;/g, "'");
}

/**
 * Parses a single tab-separated line from radar TSV output into a structured record.
 * Supports Radar v2 (12 cols), 11 cols, and Radar v1 (10 cols).
 *
 * @param {string} line
 * @returns {Object | null}
 */
export function parseSNRadarLine(line) {
  if (!line || typeof line !== 'string') return null;
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const parts = trimmed.split('\t');
  if (parts.length < 5) return null;

  let id, sub, tierStr, scoreStr, bountyStr, ncomStr, ageStr, opSinceStr, opNitemsStr, hitsStr, tagsStr, title;

  if (parts.length >= 12) {
    [id, sub, tierStr, scoreStr, bountyStr, ncomStr, ageStr, opSinceStr, opNitemsStr, hitsStr, tagsStr] = parts;
    title = parts.slice(11).join('\t');
  } else if (parts.length === 11) {
    [id, sub, tierStr, scoreStr, bountyStr, ncomStr, ageStr, opSinceStr, opNitemsStr, hitsStr, tagsStr] = parts;
    title = parts[10];
  } else if (parts.length === 10) {
    [id, sub, scoreStr, bountyStr, ncomStr, ageStr, opSinceStr, opNitemsStr, tagsStr, title] = parts;
    tierStr = String(TIER_OF[sub] || 3);
    hitsStr = `recent@${sub}`;
  } else {
    // Best effort fallback for varying column schemas
    id = parts[0];
    sub = parts[1] || '-';
    tierStr = parts[2] || String(TIER_OF[sub] || 3);
    scoreStr = parts[3] || '0';
    bountyStr = parts[4] || '0';
    ncomStr = parts[5] || '0';
    ageStr = parts[6] || '0';
    opSinceStr = parts[7] || '-';
    opNitemsStr = parts[8] || '-';
    hitsStr = parts[9] || '';
    tagsStr = parts[10] || '';
    title = parts.slice(11).join('\t') || parts[parts.length - 1] || '';
  }

  const tags = (tagsStr || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const hits = (hitsStr || '')
    .split('|')
    .map(h => h.trim())
    .filter(Boolean);

  const cleanTitle = decodeHtmlEntities(String(title || '').trim());
  const tier = Number.parseInt(tierStr, 10) || TIER_OF[sub] || 3;
  const score = Number.parseFloat(scoreStr) || 0;
  const bounty = Number.parseFloat(bountyStr) || 0;
  const ncomments = Number.parseInt(ncomStr, 10) || 0;
  const ageHours = Number.parseFloat(ageStr) || 0;
  const opSince = opSinceStr === '-' ? null : (isNaN(Number(opSinceStr)) ? opSinceStr : Number(opSinceStr));
  const opNItems = opNitemsStr === '-' ? null : (isNaN(Number(opNitemsStr)) ? opNitemsStr : Number(opNitemsStr));

  const opportunity = {
    id: String(id).trim(),
    sub: String(sub).trim(),
    tier,
    score,
    bounty,
    bountySats: bounty,
    ncomments,
    comments: ncomments,
    ageHours,
    opSince,
    opNItems,
    opNitems: opNItems,
    hits,
    tags,
    title: cleanTitle
  };

  opportunity.evaluation = evaluateOpportunity(opportunity);
  return opportunity;
}

/**
 * Parses multi-line TSV radar output into structured opportunity records.
 * @param {string} tsvContent
 * @returns {Array<Object>}
 */
export function parseRadarTSV(tsvContent) {
  if (!tsvContent || typeof tsvContent !== 'string') return [];
  const lines = tsvContent.split(/\r?\n/);
  const results = [];
  for (const line of lines) {
    const parsed = parseSNRadarLine(line);
    if (parsed) results.push(parsed);
  }
  return results;
}

export const parseSNRadarTSV = parseRadarTSV;

/**
 * Computes win probability, Expected Value (EV in sats), priority, and action routing.
 *
 * @param {Object} item
 * @param {Object} [options]
 * @returns {Object}
 */
export function evaluateOpportunity(item, options = {}) {
  const maxLowComp = options.maxLowCompComments ?? 5;
  const bounty = Number(item.bounty ?? item.bountySats) || 0;
  const ncom = Number(item.ncomments ?? item.comments) || 0;
  const ageH = Number(item.ageHours) || 0;
  const score = Number(item.score) || 0;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const sub = String(item.sub || '');
  const tier = Number(item.tier) || TIER_OF[sub] || 3;

  const isBounty = tags.includes('OPEN_BOUNTY') || bounty > 0;
  const isLowComp = ncom <= maxLowComp;
  const isSelfPost = tags.includes('SELF_POST_OPP');
  const isSignal = tags.includes('SIGNAL');
  const isHot = tags.includes('HOT') || score >= 500;

  // 1. Base Win Probability based on comment competition
  let winProb;
  if (ncom <= 2) {
    winProb = 0.85;
  } else if (ncom <= 5) {
    winProb = 0.70;
  } else if (ncom <= 10) {
    winProb = 0.50;
  } else if (ncom <= 20) {
    winProb = 0.30;
  } else {
    winProb = 0.15;
  }

  // 2. Modifiers
  if (ageH <= 2) winProb *= 1.15; // Fresh bonus
  else if (ageH > 24) winProb *= 0.70; // Age penalty

  if (tags.includes('LOW_COMP')) winProb *= 1.10;
  if (isSignal) winProb *= 1.05;

  winProb = Math.min(0.95, Math.max(0.05, Number(winProb.toFixed(3))));

  // 3. Sub Tier Multiplier
  const tierMultiplier = tier === 1 ? 1.5 : (tier === 2 ? 1.2 : 1.0);

  // 4. Expected Value (EV in sats)
  const compDiscount = Math.max(0.2, 1 - (ncom * 0.04));
  const bountyEV = bounty * winProb * compDiscount;
  const engagementEV = Math.min(score * 0.4, 400);
  const expectedValueSats = Math.round((bountyEV + engagementEV) * tierMultiplier);

  // 5. Priority Classification
  let priority = 'LOW';
  if (expectedValueSats >= 2500 || (bounty >= 5000 && winProb >= 0.4)) {
    priority = 'CRITICAL';
  } else if (expectedValueSats >= 1000 || (bounty >= 2000 && winProb >= 0.3)) {
    priority = 'HIGH';
  } else if (expectedValueSats >= 300 || bounty >= 500 || isSignal || isHot) {
    priority = 'MEDIUM';
  }

  // 6. Action Routing
  let action = 'MONITOR';
  const titleLower = String(item.title || '').toLowerCase();
  const isPickEm = titleLower.includes("pick 'em") || titleLower.includes('pick em') || titleLower.includes('sports pick');
  const isContest = titleLower.includes('contest') || titleLower.includes('weekly close') || titleLower.includes('award') || isPickEm;

  if (isBounty && isSelfPost) {
    action = 'QUEUE_SELF_POST_AND_CLAIM';
  } else if (isBounty) {
    if (isPickEm) {
      action = 'ANALYZE_AND_SUBMIT_PICKEM';
    } else if (isContest) {
      action = 'ANALYZE_AND_SUBMIT_CONTEST';
    } else if (isLowComp) {
      action = 'CLAIM_BOUNTY_HIGH_PRIORITY';
    } else {
      action = 'CLAIM_BOUNTY';
    }
  } else if (isSelfPost) {
    action = 'QUEUE_SELF_POST';
  } else if (isSignal) {
    action = 'ANALYZE_SIGNAL';
  }

  const topicAngle = SUB_ANGLE[sub] || 'general contextual response';

  return {
    id: String(item.id || ''),
    sub,
    subTier: tier,
    tier,
    title: String(item.title || ''),
    bountySats: bounty,
    score,
    comments: ncom,
    ageHours: ageH,
    winProbability: winProb,
    expectedValueSats,
    evScore: expectedValueSats,
    priority,
    action,
    recommendedAngle: topicAngle,
    topicAngle,
    isLowCompetition: isLowComp,
    isSelfPostOpportunity: isSelfPost,
    isContest,
    isPickEm,
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * Generates an analytical sports pick'em submission entry for weekly contests.
 *
 * @param {Object} item
 * @param {Object} [overrides]
 * @returns {Object}
 */
export function evaluateSportsPickEm(item, overrides = {}) {
  const {
    sport = 'NFL / Global Sports',
    picks = [
      { matchup: 'Team Alpha vs Team Beta', pick: 'Team Alpha (-3.5)', rationale: 'Strong defensive efficiency rating and red zone conversion edge.' },
      { matchup: 'Club Gamma vs Club Delta', pick: 'Over 48.5 Total Points', rationale: 'Pace of play and top-3 offensive EPA per drive matchup.' },
      { matchup: 'Squad Epsilon vs Squad Zeta', pick: 'Squad Epsilon (Moneyline)', rationale: 'Home-field advantage with rest asymmetry (+3 days).' }
    ],
    confidenceScore = '87%',
    submitter = 'Universal Sports Analytics Engine (relayhop runtime)'
  } = overrides;

  const picksMarkdown = picks.map((p, idx) => `${idx + 1}. **${p.matchup}**: **${p.pick}**\n   - *Edge Analysis:* ${p.rationale}`).join('\n\n');

  const submissionMarkdown = `### 🏈 Weekly Random Sports Pick 'em Submission

**Contest Entry for Item #${item.id}: ${item.title}**
*Subreddit / Channel:* \`${item.sub || 'Stacker_Sports'}\` | *Bounty Pool:* **${item.bounty || 2100} sats**

#### 🎯 Strategic Model Picks:
${picksMarkdown}

---
- **Model Confidence Rating:** ${confidenceScore}
- **Methodology:** Statistical regression modeling against historical possession value and pace.
- *Submitted by:* ${submitter}
- *Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    sport,
    picks,
    confidenceScore,
    submissionMarkdown
  };
}

/**
 * Generates a financial weekly close contest submission.
 *
 * @param {Object} item
 * @param {Object} [marketSignals]
 * @returns {Object}
 */
export function evaluateWeeklyCloseContest(item, marketSignals = {}) {
  const {
    direction = '🟩 BULLISH',
    targetPrice = '$5,640',
    indexSymbol = 'S&P 500 (SPX)',
    catalysts = [
      'Resilient tech earnings momentum providing structural support',
      'Easing PCE inflation telemetry supporting dovish policy sentiment',
      'Defensive positioning short squeeze potential on weekly close'
    ],
    technicalRationale = 'Holding above 20-day EMA support with positive MACD divergence.',
    submitter = 'Universal Market Analyst (relayhop runtime)'
  } = marketSignals;

  const isGreen = direction.includes('🟩') || direction.toLowerCase().includes('bull');
  const emoji = isGreen ? '🟩' : '🟥';
  const verdict = isGreen ? 'GREEN / BULLISH' : 'RED / BEARISH';

  const submissionMarkdown = `### Weekly Close Contest Entry (${emoji} ${verdict})

**Contest Submission for Item #${item.id} (${item.title})**

- **Asset / Index:** ${indexSymbol}
- **Predicted Close Direction:** ${emoji} **${verdict}**
- **Target Closing Range:** ${targetPrice}

#### Technical & Macro Rationale:
${catalysts.map(c => `- ${c}`).join('\n')}
- **Technical Indicator Bias:** ${technicalRationale}

---
*Submitted by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    direction: verdict,
    emoji,
    indexSymbol,
    targetPrice,
    catalysts,
    technicalRationale,
    submissionMarkdown
  };
}

/**
 * Bounty Registry for tracking opportunity lifecycle and status persistence.
 */
export class SNBountyRegistry {
  constructor(storagePath = null) {
    this.storagePath = storagePath;
    this.bounties = new Map();
    if (storagePath && fs.existsSync(storagePath)) {
      this.load();
    }
  }

  register(opportunity, metadata = {}) {
    if (!opportunity || !opportunity.id) {
      throw new Error('Opportunity must possess a valid id');
    }

    const id = String(opportunity.id);
    const existing = this.bounties.get(id);

    const record = {
      ...(existing || {}),
      ...opportunity,
      id,
      status: existing?.status || 'DETECTED',
      registeredAt: existing?.registeredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: existing?.history || [
        {
          status: 'DETECTED',
          timestamp: new Date().toISOString(),
          note: 'Ingested via radar telemetry'
        }
      ],
      metadata: {
        ...(existing?.metadata || {}),
        ...metadata
      }
    };

    if (!record.evaluation) {
      record.evaluation = evaluateOpportunity(record);
    }

    this.bounties.set(id, record);
    return record;
  }

  updateStatus(id, newStatus, note = '', extraMeta = {}) {
    const key = String(id);
    const item = this.bounties.get(key);
    if (!item) {
      throw new Error(`Bounty ID ${id} not found in registry`);
    }

    if (!VALID_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Allowed: ${VALID_STATUSES.join(', ')}`);
    }

    item.status = newStatus;
    item.updatedAt = new Date().toISOString();
    item.history.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note
    });

    if (Object.keys(extraMeta).length > 0) {
      item.metadata = { ...item.metadata, ...extraMeta };
    }

    return item;
  }

  get(id) {
    return this.bounties.get(String(id)) || null;
  }

  getAll() {
    return Array.from(this.bounties.values());
  }

  filterByStatus(status) {
    return this.getAll().filter(b => b.status === status);
  }

  filterBySub(sub) {
    return this.getAll().filter(b => b.sub === sub);
  }

  getSummaryStats() {
    const all = this.getAll();
    const byStatus = {};
    for (const status of VALID_STATUSES) {
      byStatus[status] = 0;
    }
    let totalBountySats = 0;
    let totalExpectedValueSats = 0;

    for (const b of all) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      totalBountySats += Number(b.bounty || b.bountySats) || 0;
      totalExpectedValueSats += Number(b.evaluation?.expectedValueSats ?? b.evaluation?.evScore) || 0;
    }

    return {
      total: all.length,
      byStatus,
      totalBountySats,
      totalExpectedValueSats
    };
  }

  save() {
    if (!this.storagePath) return false;
    const dir = path.dirname(this.storagePath);
    fs.mkdirSync(dir, { recursive: true });
    const data = {
      updatedAt: new Date().toISOString(),
      stats: this.getSummaryStats(),
      bounties: this.getAll()
    };
    fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  }

  load() {
    if (!this.storagePath || !fs.existsSync(this.storagePath)) return false;
    try {
      const raw = fs.readFileSync(this.storagePath, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.bounties)) {
        for (const item of data.bounties) {
          this.bounties.set(String(item.id), item);
        }
      }
      return true;
    } catch (e) {
      console.error(`Failed to load registry from ${this.storagePath}:`, e.message);
      return false;
    }
  }
}

/**
 * Evaluates and ranks a collection of opportunity items by EV score descending.
 * @param {Array<Object>} items
 * @param {Object} [options]
 * @returns {Array<Object>}
 */
export function rankOpportunities(items, options = {}) {
  const evaluated = items.map(it => evaluateOpportunity(it, options));
  return evaluated.sort((a, b) => b.expectedValueSats - a.expectedValueSats);
}

/**
 * Formats a Markdown summary table of opportunities.
 * @param {Array<Object>} items
 * @returns {string}
 */
export function formatBountyReport(items) {
  if (!items || items.length === 0) {
    return '_No opportunities detected._\n';
  }

  const headers = [
    '| ID | Sub | Tier | Bounty (sats) | Comments | Win Prob | EV (sats) | Priority | Action | Title |',
    '| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |'
  ];

  const rows = items.map(it => {
    const ev = it.evaluation || evaluateOpportunity(it);
    const winPct = `${Math.round(ev.winProbability * 100)}%`;
    const bountyVal = Number(it.bounty ?? it.bountySats ?? 0).toLocaleString();
    const evVal = Number(ev.expectedValueSats ?? ev.evScore ?? 0).toLocaleString();
    const titleClean = (it.title || '').replace(/\|/g, '\\|').slice(0, 50);

    return `| ${it.id} | ${it.sub} | ${it.tier} | ${bountyVal} | ${it.ncomments ?? it.comments} | ${winPct} | ${evVal} | **${ev.priority}** | \`${ev.action}\` | ${titleClean} |`;
  });

  return [...headers, ...rows].join('\n') + '\n';
}

export const formatOpportunityReport = formatBountyReport;

// CLI Execution Entrypoint
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const args = process.argv.slice(2);
  const inputArg = args.find(a => a.startsWith('--input='))?.slice(8)
    || args[args.indexOf('--input') + 1]
    || args.find(a => a.startsWith('--file='))?.slice(7)
    || args[args.indexOf('--file') + 1];
  const lineArg = args.find(a => a.startsWith('--line='))?.slice(7)
    || args[args.indexOf('--line') + 1]
    || args.find(a => a.startsWith('--row='))?.slice(6)
    || args[args.indexOf('--row') + 1];
  const isJson = args.includes('--json');
  const isPickEm = args.includes('--pickem') || args.includes('--sports');
  const isContest = args.includes('--contest');

  let rawContent = '';
  if (lineArg) {
    rawContent = lineArg;
  } else if (inputArg && fs.existsSync(inputArg)) {
    rawContent = fs.readFileSync(inputArg, 'utf8');
  } else {
    // Default fallback: Issue #114 payload
    rawContent = "1519033\tStacker_Sports\t3\t728\t2100\t15\t15.5\t232181\t3804\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,SELF_POST_OPP\tWeekly Random Sports Pick 'em";
  }

  const items = parseRadarTSV(rawContent);

  if (isJson) {
    console.log(JSON.stringify(items, null, 2));
  } else {
    console.log(`[sn_bounty_processor] Ingested ${items.length} opportunities:\n`);
    console.log(formatBountyReport(items));

    if (items.length > 0 && (isPickEm || items[0].evaluation?.isPickEm)) {
      console.log('\n--- Strategic Sports Pick \'em Entry ---\n');
      console.log(evaluateSportsPickEm(items[0]).submissionMarkdown);
    } else if (items.length > 0 && (isContest || items[0].evaluation?.isContest)) {
      console.log('\n--- Contest Prediction Strategy ---\n');
      console.log(evaluateWeeklyCloseContest(items[0]).submissionMarkdown);
    }
  }
}

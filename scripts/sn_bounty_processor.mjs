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
 * Parses raw Stacker News radar TSV text into structured opportunity objects.
 * Supports Radar v2 schema (12 columns) and Radar v1 schema (10 columns).
 *
 * @param {string} tsvContent - Raw TSV text containing radar opportunities
 * @returns {Array<Object>} Parsed opportunity objects
 */
export function parseRadarTSV(tsvContent) {
  if (!tsvContent || typeof tsvContent !== 'string') {
    return [];
  }

  const lines = tsvContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  const results = [];

  for (const line of lines) {
    const cols = line.split('\t').map(c => c.trim());
    if (cols.length < 5) continue;

    let id, sub, tier, score, bounty, ncom, ageH, opSince, opNitems, hits, tags, title;

    if (cols.length >= 12) {
      // v2 schema: id, sub, tier, score, bounty, ncom, ageH, op_since, op_nitems, hits, tags, title
      [id, sub, tier, score, bounty, ncom, ageH, opSince, opNitems, hits, tags, title] = cols;
    } else if (cols.length === 10) {
      // v1 schema: id, sub, score, bounty, ncom, ageH, op_since, op_nitems, tags, title
      [id, sub, score, bounty, ncom, ageH, opSince, opNitems, tags, title] = cols;
      tier = TIER_OF[sub] ?? 3;
      hits = `recent@${sub}`;
    } else {
      // Best effort fallback
      id = cols[0];
      sub = cols[1] || '-';
      tier = Number.parseInt(cols[2], 10) || TIER_OF[sub] || 3;
      score = cols[3] || '0';
      bounty = cols[4] || '0';
      ncom = cols[5] || '0';
      ageH = cols[6] || '0';
      opSince = cols[7] || '-';
      opNitems = cols[8] || '-';
      hits = cols[9] || '';
      tags = cols[10] || '';
      title = cols.slice(11).join(' ') || cols[cols.length - 1] || '';
    }

    const parsedTags = (tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const parsedHits = (hits || '')
      .split('|')
      .map(h => h.trim())
      .filter(Boolean);

    const opportunity = {
      id: String(id),
      sub: String(sub),
      tier: Number.parseInt(tier, 10) || TIER_OF[sub] || 3,
      score: Number.parseFloat(score) || 0,
      bounty: Number.parseFloat(bounty) || 0,
      ncomments: Number.parseInt(ncom, 10) || 0,
      ageHours: Number.parseFloat(ageH) || 0,
      opSince: opSince === '-' ? null : String(opSince),
      opNitems: opNitems === '-' ? null : Number.parseInt(opNitems, 10) || 0,
      hits: parsedHits,
      tags: parsedTags,
      title: String(title || '')
    };

    opportunity.evaluation = evaluateOpportunity(opportunity);
    results.push(opportunity);
  }

  return results;
}

/**
 * Computes win probability, expected value (EV), priority level, and recommended actions.
 *
 * @param {Object} item - Opportunity record
 * @returns {Object} Evaluation metrics
 */
export function evaluateOpportunity(item) {
  const bounty = Number(item.bounty) || 0;
  const ncom = Number(item.ncomments) || 0;
  const ageH = Number(item.ageHours) || 0;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const sub = item.sub || '';
  const tier = item.tier || TIER_OF[sub] || 3;

  // Base win probability based on current comment competition
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

  // Age decay modifier
  if (ageH <= 2) {
    winProb *= 1.15; // Fresh bonus
  } else if (ageH > 24) {
    winProb *= 0.70; // Age penalty
  }

  // Tag adjustments
  if (tags.includes('LOW_COMP')) winProb *= 1.1;
  if (tags.includes('SIGNAL')) winProb *= 1.05;

  // Clamp probability between 0.05 and 0.95
  winProb = Math.min(0.95, Math.max(0.05, Number(winProb.toFixed(3))));

  // Sub tier weighting
  const tierMultiplier = tier === 1 ? 1.2 : tier === 2 ? 1.0 : 0.85;

  // Estimated Expected Value (in sats)
  const expectedValueSats = Math.round(bounty * winProb * tierMultiplier);

  // Priority classification
  let priority = 'LOW';
  if (expectedValueSats >= 5000 || (bounty >= 10000 && winProb >= 0.4)) {
    priority = 'CRITICAL';
  } else if (expectedValueSats >= 2000 || (bounty >= 5000 && winProb >= 0.3)) {
    priority = 'HIGH';
  } else if (expectedValueSats >= 500 || bounty >= 1000 || tags.includes('SIGNAL')) {
    priority = 'MEDIUM';
  }

  // Recommended Action
  let action = 'LOG_OPPORTUNITY';
  const titleLower = (item.title || '').toLowerCase();
  const isContest = titleLower.includes('contest') || titleLower.includes('weekly close') || titleLower.includes('award');

  if (tags.includes('OPEN_BOUNTY')) {
    if (isContest) {
      action = 'ANALYZE_AND_SUBMIT_CONTEST';
    } else if (tags.includes('LOW_COMP')) {
      action = 'FAST_TRACK_CLAIM';
    } else {
      action = 'CLAIM_AND_EXECUTE';
    }
  } else if (tags.includes('SELF_POST_OPP')) {
    action = 'QUEUE_SELF_POST';
  } else if (tags.includes('SIGNAL')) {
    action = 'MONITOR_SIGNAL';
  }

  return {
    winProbability: winProb,
    expectedValueSats,
    priority,
    action,
    subTier: tier,
    topicAngle: SUB_ANGLE[sub] || 'general commentary',
    isContest,
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * Contest analysis and prediction engine for Sunday Weekly Close contests.
 *
 * @param {Object} item - Bounty opportunity item
 * @param {Object} marketSignals - Optional market indicator overrides
 * @returns {Object} Contest prediction package
 */
export function evaluateWeeklyCloseContest(item, marketSignals = {}) {
  const {
    direction = '🟩 BULLISH',
    targetPrice = '$5,640',
    indexSymbol = 'S&P 500 (SPX)',
    catalysts = [
      'Resilient tech earnings momentum providing structural support',
      'Easing PCE inflation telemetry supporting dovish policy sentiment',
      'Defensive positioning short squeeze potential on Friday/Sunday close'
    ],
    technicalRationale = 'Holding above 20-day EMA support with positive MACD divergence on weekly timeframe.',
    submitter = 'Universal Engineer (relayhop runtime)'
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
      totalBountySats += Number(b.bounty) || 0;
      totalExpectedValueSats += Number(b.evaluation?.expectedValueSats) || 0;
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
 * Formats a Markdown summary table of opportunities.
 *
 * @param {Array<Object>} items - Array of opportunities
 * @returns {string} Markdown table
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
    const bountyStr = Number(it.bounty || 0).toLocaleString();
    const evStr = Number(ev.expectedValueSats || 0).toLocaleString();
    const titleClean = (it.title || '').replace(/\|/g, '\\|').slice(0, 50);

    return `| ${it.id} | ${it.sub} | ${it.tier} | ${bountyStr} | ${it.ncomments} | ${winPct} | ${evStr} | **${ev.priority}** | \`${ev.action}\` | ${titleClean} |`;
  });

  return [...headers, ...rows].join('\n') + '\n';
}

// CLI Interface execution
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const args = process.argv.slice(2);
  const rowArgIdx = args.indexOf('--row');
  const fileArgIdx = args.indexOf('--file');
  const isJson = args.includes('--json');
  const isContest = args.includes('--contest');

  let tsvContent = '';

  if (rowArgIdx !== -1 && args[rowArgIdx + 1]) {
    tsvContent = args[rowArgIdx + 1];
  } else if (fileArgIdx !== -1 && args[fileArgIdx + 1]) {
    const targetFile = path.resolve(args[fileArgIdx + 1]);
    if (fs.existsSync(targetFile)) {
      tsvContent = fs.readFileSync(targetFile, 'utf8');
    }
  } else {
    // Default fallback: Issue 646 payload
    tsvContent = '1553226\tStacker_Stocks\t2\t35\t10000\t21\t22.7\t9274\t26624\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!';
  }

  const items = parseRadarTSV(tsvContent);

  if (isJson) {
    console.log(JSON.stringify(items, null, 2));
  } else {
    console.log(`[sn_bounty_processor] Parsed ${items.length} opportunities:\n`);
    console.log(formatBountyReport(items));

    if (isContest && items.length > 0) {
      const contest = evaluateWeeklyCloseContest(items[0]);
      console.log('\n--- Contest Prediction Strategy ---\n');
      console.log(contest.submissionMarkdown);
    }
  }
}

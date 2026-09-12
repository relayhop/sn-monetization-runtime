/**
 * SN Monetization Runtime - Radar Bounty Handler & Opportunity Engine
 * 
 * Ingests, parses, validates, and manages lifecycle execution for Stacker News
 * open bounties and radar opportunity signals.
 */

import fs from 'node:fs';
import path from 'node:path';

export const VALID_STATUSES = [
  'DETECTED',
  'CLAIMED',
  'IN_PROGRESS',
  'SUBMITTED',
  'PAID',
  'EXPIRED',
  'CANCELLED'
];

export const VALID_TAGS = [
  'OPEN_BOUNTY',
  'LOW_COMP',
  'JOB',
  'FRESH',
  'HOT',
  'SIGNAL',
  'SELF_POST_OPP'
];

/**
 * Parses raw radar TSV output (such as sn_radar_v2 outputs or GitHub radar issue bodies).
 *
 * @param {string} tsvInput - Raw TSV text
 * @returns {Array<Object>} Parsed SN bounty items
 */
export function parseSNRadarBounties(tsvInput) {
  if (!tsvInput || typeof tsvInput !== 'string') return [];

  const lines = tsvInput.trim().split(/\r?\n/);
  const bounties = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Split on tab character
    const parts = trimmed.split('\t');
    if (parts.length < 5) continue;

    let id = '';
    let sub = '';
    let tier = 3;
    let score = 0;
    let bounty = 0;
    let comments = 0;
    let ageHours = 0;
    let opSince = '-';
    let opNitems = '-';
    let hits = [];
    let tags = [];
    let title = '';

    if (parts.length >= 12) {
      // 12-column radar v2 schema:
      // id, sub, tier, score, bounty, ncom, ageH, op_since, op_nitems, hits, tags, ...title
      id = parts[0].trim();
      sub = parts[1].trim();
      tier = parseInt(parts[2], 10) || 3;
      score = parseInt(parts[3], 10) || 0;
      bounty = parseInt(parts[4], 10) || 0;
      comments = parseInt(parts[5], 10) || 0;
      ageHours = parseFloat(parts[6]) || 0;
      opSince = parts[7]?.trim() || '-';
      opNitems = parts[8]?.trim() || '-';
      hits = parts[9] ? parts[9].split('|').map(s => s.trim()).filter(Boolean) : [];
      tags = parts[10] ? parts[10].split(',').map(t => t.trim()).filter(Boolean) : [];
      title = parts.slice(11).join('\t').trim();
    } else if (parts.length === 11) {
      // 11-column radar v2 format without tier:
      // id, sub, depth/score, bounty, ncom, boost/age, multiplier, upvotes, downvotes, feed/hits, flags, title
      id = parts[0].trim();
      sub = parts[1].trim();
      tier = 3;
      score = parseInt(parts[2], 10) || 0;
      bounty = parseInt(parts[3], 10) || 0;
      comments = parseInt(parts[4], 10) || 0;
      ageHours = parseFloat(parts[5]) || 0;
      opSince = parts[6]?.trim() || '-';
      opNitems = parts[7]?.trim() || '-';
      hits = parts[8] ? parts[8].split('|').map(s => s.trim()).filter(Boolean) : [];
      tags = parts[9] ? parts[9].split(',').map(t => t.trim()).filter(Boolean) : [];
      title = parts[10].trim();
    } else if (parts.length === 10) {
      // 10-column radar v1 schema:
      // id, sub, score, bounty, ncom, ageH, op_since, op_nitems, tags, title
      id = parts[0].trim();
      sub = parts[1].trim();
      tier = 1;
      score = parseInt(parts[2], 10) || 0;
      bounty = parseInt(parts[3], 10) || 0;
      comments = parseInt(parts[4], 10) || 0;
      ageHours = parseFloat(parts[5]) || 0;
      opSince = parts[6]?.trim() || '-';
      opNitems = parts[7]?.trim() || '-';
      hits = [];
      tags = parts[8] ? parts[8].split(',').map(t => t.trim()).filter(Boolean) : [];
      title = parts[9].trim();
    } else {
      // Fallback for minimal TSV
      id = parts[0].trim();
      sub = parts[1]?.trim() || '-';
      score = parseInt(parts[2], 10) || 0;
      bounty = parseInt(parts[3], 10) || 0;
      comments = parseInt(parts[4], 10) || 0;
      tags = parts[5] ? parts[5].split(',').map(t => t.trim()).filter(Boolean) : [];
      title = parts.slice(6).join('\t').trim();
    }

    if (!id) continue;

    const item = {
      id,
      sub,
      tier,
      score,
      bounty,
      comments,
      ageHours,
      opSince,
      opNitems,
      hits,
      tags,
      title
    };

    const metrics = calculateBountyMetrics(item);
    bounties.push({
      ...item,
      metrics
    });
  }

  return bounties;
}

/**
 * Calculates priority metrics, expected value, and action triggers for a bounty.
 *
 * @param {Object} item - Bounty or Opportunity item
 * @returns {Object} Calculated metrics
 */
export function calculateBountyMetrics(item) {
  const score = Number(item.score || 0);
  const bounty = Number(item.bounty || 0);
  const comments = Number(item.comments || 0);
  const ageHours = Number(item.ageHours || 0);
  const tags = Array.isArray(item.tags) ? item.tags : [];

  const isOpenBounty = tags.includes('OPEN_BOUNTY') || bounty > 0;
  const isSelfPostOpp = tags.includes('SELF_POST_OPP');
  const isSignal = tags.includes('SIGNAL');
  const isHot = tags.includes('HOT');
  const isLowComp = tags.includes('LOW_COMP') || comments <= 5;
  const isFresh = tags.includes('FRESH') || ageHours <= 2.0;

  // Expected Value Calculation in sats:
  // Bounty value weighted by probability of winning (inversely related to comments) + audience upvote upside
  const winProbability = isLowComp ? 0.85 : Math.max(0.15, 1.0 / (comments + 1));
  const estimatedSatsEV = Math.round((bounty * winProbability) + (score * 0.25));

  // Determine Primary Action
  let action = 'MONITOR';
  let priority = 'NORMAL';

  if (isOpenBounty && isSelfPostOpp) {
    action = 'QUEUE_SELF_POST_AND_CLAIM';
    priority = 'HIGH';
  } else if (isOpenBounty && (isLowComp || isFresh)) {
    action = 'FAST_TRACK_CLAIM';
    priority = 'CRITICAL';
  } else if (isOpenBounty) {
    action = 'QUEUE_CLAIM_BOUNTY';
    priority = 'HIGH';
  } else if (isSelfPostOpp) {
    action = 'QUEUE_SELF_POST';
    priority = 'MEDIUM';
  } else if (isSignal) {
    action = 'MONITOR_SIGNAL';
    priority = 'MEDIUM';
  } else if (isHot) {
    action = 'MONITOR_HOT';
    priority = 'LOW';
  }

  return {
    isOpenBounty,
    isSelfPostOpp,
    isSignal,
    isHot,
    isLowComp,
    isFresh,
    winProbability: parseFloat(winProbability.toFixed(2)),
    estimatedSatsEV,
    action,
    priority
  };
}

/**
 * Categorizes and routes opportunities for automated lifecycle execution.
 *
 * @param {Array<Object>} bounties - List of parsed bounty items
 * @param {Object} options - Filtering / routing options
 * @returns {Object} Opportunity categorization and action lists
 */
export function processRadarOpportunities(bounties, options = {}) {
  if (!Array.isArray(bounties)) return { claimBounties: [], selfPostOpportunities: [], highSignals: [], hotTopics: [], summary: {} };

  const claimBounties = [];
  const selfPostOpportunities = [];
  const highSignals = [];
  const hotTopics = [];

  for (const b of bounties) {
    const metrics = b.metrics || calculateBountyMetrics(b);
    const enriched = { ...b, metrics };

    if (metrics.isOpenBounty) {
      claimBounties.push(enriched);
    }
    if (metrics.isSelfPostOpp) {
      selfPostOpportunities.push(enriched);
    }
    if (metrics.isSignal) {
      highSignals.push(enriched);
    }
    if (metrics.isHot) {
      hotTopics.push(enriched);
    }
  }

  // Sort claim bounties by EV descending
  claimBounties.sort((a, b) => (b.metrics?.estimatedSatsEV || 0) - (a.metrics?.estimatedSatsEV || 0));
  selfPostOpportunities.sort((a, b) => (b.score || 0) - (a.score || 0));
  highSignals.sort((a, b) => (b.score || 0) - (a.score || 0));
  hotTopics.sort((a, b) => (b.score || 0) - (a.score || 0));

  return {
    claimBounties,
    selfPostOpportunities,
    highSignals,
    hotTopics,
    summary: {
      totalParsed: bounties.length,
      openBountyCount: claimBounties.length,
      selfPostOppCount: selfPostOpportunities.length,
      signalCount: highSignals.length,
      hotCount: hotTopics.length,
      totalBountySats: claimBounties.reduce((sum, item) => sum + (item.bounty || 0), 0)
    }
  };
}

/**
 * Persistent Bounty Registry to manage lifecycle state and deduplication.
 */
export class SNBountyRegistry {
  constructor(storagePath = null) {
    this.storagePath = storagePath;
    this.records = new Map();
    if (this.storagePath && fs.existsSync(this.storagePath)) {
      this.load();
    }
  }

  load() {
    if (!this.storagePath || !fs.existsSync(this.storagePath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) this.records.set(item.id, item);
        }
      } else if (typeof data === 'object' && data !== null) {
        for (const [id, item] of Object.entries(data)) {
          this.records.set(id, item);
        }
      }
    } catch (err) {
      console.error(`[registry] Error reading registry at ${this.storagePath}: ${err.message}`);
    }
  }

  save() {
    if (!this.storagePath) return;
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const obj = {};
    for (const [id, item] of this.records.entries()) {
      obj[id] = item;
    }
    fs.writeFileSync(this.storagePath, JSON.stringify(obj, null, 2), 'utf8');
  }

  registerBounty(bounty) {
    if (!bounty?.id) throw new Error('Bounty must have an ID');
    const existing = this.records.get(bounty.id);

    if (existing) {
      // Merge tags & update score/bounty
      existing.score = Math.max(existing.score || 0, bounty.score || 0);
      existing.bounty = Math.max(existing.bounty || 0, bounty.bounty || 0);
      existing.comments = Math.max(existing.comments || 0, bounty.comments || 0);
      existing.tags = Array.from(new Set([...(existing.tags || []), ...(bounty.tags || [])]));
      existing.lastDetectedAt = new Date().toISOString();
      return existing;
    }

    const newRecord = {
      id: bounty.id,
      sub: bounty.sub || '-',
      tier: bounty.tier || 3,
      score: bounty.score || 0,
      bounty: bounty.bounty || 0,
      comments: bounty.comments || 0,
      title: bounty.title || '',
      tags: bounty.tags || [],
      status: 'DETECTED',
      detectedAt: new Date().toISOString(),
      lastDetectedAt: new Date().toISOString(),
      metrics: bounty.metrics || calculateBountyMetrics(bounty),
      history: [
        {
          timestamp: new Date().toISOString(),
          status: 'DETECTED',
          notes: 'Radar discovery registration'
        }
      ]
    };

    this.records.set(bounty.id, newRecord);
    return newRecord;
  }

  claimBounty(id, claimantNotes = '') {
    return this.updateStatus(id, 'CLAIMED', claimantNotes);
  }

  updateStatus(id, status, notes = '') {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const record = this.records.get(id);
    if (!record) {
      throw new Error(`Bounty ID ${id} not found in registry`);
    }

    record.status = status;
    record.updatedAt = new Date().toISOString();
    record.history.push({
      timestamp: new Date().toISOString(),
      status,
      notes
    });

    return record;
  }

  getBounty(id) {
    return this.records.get(id) || null;
  }

  listBounties(filter = {}) {
    const list = Array.from(this.records.values());
    return list.filter(item => {
      if (filter.status && item.status !== filter.status) return false;
      if (filter.sub && item.sub !== filter.sub) return false;
      if (filter.minBounty && item.bounty < filter.minBounty) return false;
      if (filter.tag && !item.tags.includes(filter.tag)) return false;
      return true;
    });
  }

  getSummaryStats() {
    const list = Array.from(this.records.values());
    const stats = {
      total: list.length,
      byStatus: {},
      totalBountySats: 0,
      claimedCount: 0
    };

    for (const st of VALID_STATUSES) {
      stats.byStatus[st] = 0;
    }

    for (const item of list) {
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
      stats.totalBountySats += (item.bounty || 0);
      if (item.status === 'CLAIMED' || item.status === 'IN_PROGRESS' || item.status === 'SUBMITTED' || item.status === 'PAID') {
        stats.claimedCount++;
      }
    }

    return stats;
  }
}

/**
 * Formats parsed bounties into a clean GitHub / Markdown report.
 *
 * @param {Array<Object>} bounties - Parsed bounty records
 * @returns {string} Markdown formatted report
 */
export function formatBountyReport(bounties) {
  if (!bounties || bounties.length === 0) {
    return 'No open bounties detected.';
  }

  const rows = [
    '| ID | Sub | Bounty (sats) | Score | Comments | Tags | Action | Title |',
    '|---|---|---|---|---|---|---|---|'
  ];

  for (const b of bounties) {
    const m = b.metrics || calculateBountyMetrics(b);
    rows.push(
      `| [${b.id}](https://stacker.news/items/${b.id}) | \`${b.sub}\` | **${b.bounty.toLocaleString()}** | ${b.score} | ${b.comments} | \`${b.tags.join(', ')}\` | \`${m.action}\` | ${b.title.replace(/\|/g, '\\|')} |`
    );
  }

  return rows.join('\n');
}

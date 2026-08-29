// scripts/sn_bounty_processor.mjs — Stacker News Bounty Ingestion & Scoring Engine
// Cloud cron runtime module for Stacker News Monetization Sub-Project.

/**
 * @typedef {Object} SnBountyRecord
 * @property {number} id
 * @property {string} sub
 * @property {number} tier
 * @property {number} score
 * @property {number} bounty
 * @property {number} ncomments
 * @property {number} ageHours
 * @property {number|string} opSince
 * @property {number|string} opNitems
 * @property {string[]} hits
 * @property {string[]} tags
 * @property {string} title
 */

/**
 * @typedef {'QUEUE_SELF_POST' | 'CLAIM_BOUNTY' | 'ENGAGE_THREAD' | 'MONITOR'} BountyAction
 */

/**
 * @typedef {Object} ClassifiedBounty
 * @property {SnBountyRecord} record
 * @property {'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'} priority
 * @property {number} expectedValueScore
 * @property {BountyAction} action
 * @property {string[]} qualificationReasons
 */

/**
 * Decodes standard HTML entities commonly found in scraped RSS/GraphQL titles.
 * @param {string} text
 * @returns {string}
 */
export function decodeHtmlEntities(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Validates whether a value is a non-negative finite number.
 * @param {any} val
 * @returns {boolean}
 */
export function isValidNumber(val) {
  return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val);
}

/**
 * Parse an 11-field or 12-field TSV radar row into a typed record.
 * Supports radar v2 schema: id, sub, tier, score, bounty, ncom, ageH, op_since, op_nitems, hits, tags, title
 * @param {string} rawLine
 * @returns {SnBountyRecord}
 */
export function parseRadarBountyLine(rawLine) {
  if (typeof rawLine !== 'string' || !rawLine.trim()) {
    throw new Error('Invalid input: rawLine must be a non-empty string');
  }

  // Strip comment prefix if present
  const cleanLine = rawLine.startsWith('#') ? rawLine.slice(1).trim() : rawLine.trim();
  const fields = cleanLine.split('\t');

  if (fields.length < 11) {
    throw new Error(`Invalid TSV format: expected at least 11 tab-separated fields, got ${fields.length}`);
  }

  const id = parseInt(fields[0], 10);
  const sub = fields[1]?.trim() || '-';
  const tier = parseInt(fields[2], 10);
  const score = parseFloat(fields[3]);
  const bounty = parseFloat(fields[4]);
  const ncomments = parseInt(fields[5], 10);
  const ageHours = parseFloat(fields[6]);
  const opSinceRaw = fields[7]?.trim();
  const opNitemsRaw = fields[8]?.trim();
  const hits = fields[9] ? fields[9].split('|').map(s => s.trim()).filter(Boolean) : [];
  const tags = fields[10] ? fields[10].split(',').map(s => s.trim()).filter(Boolean) : [];
  const rawTitle = fields.slice(11).join('\t').trim();
  const title = decodeHtmlEntities(rawTitle);

  if (Number.isNaN(id) || id <= 0) {
    throw new Error(`Invalid item ID: "${fields[0]}" must be a positive integer`);
  }
  if (Number.isNaN(tier) || tier < 1) {
    throw new Error(`Invalid tier: "${fields[2]}" must be a positive integer`);
  }
  if (Number.isNaN(score)) {
    throw new Error(`Invalid score: "${fields[3]}" must be numeric`);
  }
  if (Number.isNaN(bounty) || bounty < 0) {
    throw new Error(`Invalid bounty: "${fields[4]}" must be non-negative numeric`);
  }
  if (Number.isNaN(ncomments) || ncomments < 0) {
    throw new Error(`Invalid comment count: "${fields[5]}" must be non-negative integer`);
  }
  if (Number.isNaN(ageHours) || ageHours < 0) {
    throw new Error(`Invalid ageHours: "${fields[6]}" must be non-negative numeric`);
  }

  const opSince = !opSinceRaw || opSinceRaw === '-' || Number.isNaN(Number(opSinceRaw)) ? opSinceRaw : Number(opSinceRaw);
  const opNitems = !opNitemsRaw || opNitemsRaw === '-' || Number.isNaN(Number(opNitemsRaw)) ? opNitemsRaw : Number(opNitemsRaw);

  return {
    id,
    sub,
    tier,
    score,
    bounty,
    ncomments,
    ageHours,
    opSince,
    opNitems,
    hits,
    tags,
    title,
  };
}

/**
 * Classifies and scores a bounty opportunity.
 * Calculates an Expected Value (EV) score based on reward size, competition density,
 * OP credibility, freshness, and sub saturation.
 * @param {SnBountyRecord} record
 * @returns {ClassifiedBounty}
 */
export function classifyBountyOpportunity(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('record must be a valid SnBountyRecord object');
  }

  const reasons = [];
  let evScore = 0;

  // 1. Bounty Reward Pool Valuation
  if (record.bounty >= 10000) {
    evScore += 50;
    reasons.push(`High reward bounty (${record.bounty} sats)`);
  } else if (record.bounty >= 2000) {
    evScore += 35;
    reasons.push(`Significant reward bounty (${record.bounty} sats)`);
  } else if (record.bounty >= 1000) {
    evScore += 25;
    reasons.push(`Medium reward bounty (${record.bounty} sats)`);
  } else if (record.bounty >= 100) {
    evScore += 15;
    reasons.push(`Standard bounty (${record.bounty} sats)`);
  }

  // 2. Competition Density
  if (record.ncomments === 0) {
    evScore += 30;
    reasons.push('Zero competition (0 comments)');
  } else if (record.ncomments <= 5) {
    evScore += 20;
    reasons.push(`Low competition (${record.ncomments} comments)`);
  } else if (record.ncomments <= 15) {
    evScore += 10;
    reasons.push(`Moderate competition (${record.ncomments} comments)`);
  } else if (record.ncomments <= 25) {
    evScore += 5;
    reasons.push(`Active discussion (${record.ncomments} comments)`);
  } else {
    evScore -= 10;
    reasons.push(`High competition (${record.ncomments} comments)`);
  }

  // 3. Social Proof & Post Momentum
  if (record.score >= 1000) {
    evScore += 15;
    reasons.push(`High post score (${record.score} sats)`);
  } else if (record.score >= 200) {
    evScore += 10;
    reasons.push(`Solid engagement (${record.score} sats)`);
  } else if (record.score >= 50) {
    evScore += 5;
    reasons.push(`Positive engagement (${record.score} sats)`);
  }

  // 4. Freshness Window
  if (record.ageHours <= 2) {
    evScore += 20;
    reasons.push(`Fresh opportunity (${record.ageHours}h old)`);
  } else if (record.ageHours <= 12) {
    evScore += 15;
    reasons.push(`Active window (${record.ageHours}h old)`);
  } else if (record.ageHours <= 24) {
    evScore += 10;
    reasons.push(`Standard window (${record.ageHours}h old)`);
  }

  // 5. OP Credibility
  if (typeof record.opNitems === 'number' && record.opNitems >= 1000) {
    evScore += 10;
    reasons.push(`Established OP account (${record.opNitems} items posted)`);
  } else if (typeof record.opNitems === 'number' && record.opNitems >= 100) {
    evScore += 5;
    reasons.push(`Active OP account (${record.opNitems} items posted)`);
  }

  // 6. Tag Boosts
  if (record.tags.includes('OPEN_BOUNTY')) {
    evScore += 15;
    reasons.push('Verified OPEN_BOUNTY tag');
  }
  if (record.tags.includes('LOW_COMP')) {
    evScore += 15;
    reasons.push('Verified LOW_COMP tag');
  }
  if (record.tags.includes('SIGNAL')) {
    evScore += 10;
    reasons.push('Verified high SIGNAL ratio');
  }
  if (record.tags.includes('HOT')) {
    evScore += 10;
    reasons.push('Verified HOT trending status');
  }
  if (record.tags.includes('SELF_POST_OPP')) {
    evScore += 15;
    reasons.push('High-yield SELF_POST_OPP audience opportunity');
  }

  // 7. Tactical Action Determination
  /** @type {BountyAction} */
  let action = 'MONITOR';
  if (record.tags.includes('SELF_POST_OPP')) {
    action = 'QUEUE_SELF_POST';
  } else if (record.tags.includes('OPEN_BOUNTY') && record.ncomments <= 15) {
    action = 'CLAIM_BOUNTY';
  } else if (record.tags.includes('SIGNAL')) {
    action = 'ENGAGE_THREAD';
  }

  // 8. Priority Level Determination
  /** @type {'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'} */
  let priority = 'LOW';
  if (evScore >= 80) {
    priority = 'CRITICAL';
  } else if (evScore >= 55) {
    priority = 'HIGH';
  } else if (evScore >= 35) {
    priority = 'MEDIUM';
  }

  return {
    record,
    priority,
    expectedValueScore: evScore,
    action,
    qualificationReasons: reasons,
  };
}

/**
 * Filter bounty records according to criteria.
 * @param {SnBountyRecord[]} records
 * @param {Object} [filters]
 * @param {number} [filters.minBountySats]
 * @param {number} [filters.maxComments]
 * @param {number} [filters.minScore]
 * @param {string[]} [filters.requiredTags]
 * @param {string[]} [filters.allowedSubs]
 * @returns {SnBountyRecord[]}
 */
export function filterBounties(records, filters = {}) {
  const {
    minBountySats = 0,
    maxComments = Infinity,
    minScore = -Infinity,
    requiredTags = [],
    allowedSubs = [],
  } = filters;

  return records.filter(item => {
    if (item.bounty < minBountySats) return false;
    if (item.ncomments > maxComments) return false;
    if (item.score < minScore) return false;
    if (allowedSubs.length > 0 && !allowedSubs.includes(item.sub)) return false;
    if (requiredTags.length > 0 && !requiredTags.every(t => item.tags.includes(t))) return false;
    return true;
  });
}

/**
 * Generates formatted markdown report for an ingested bounty item.
 * @param {ClassifiedBounty} classified
 * @returns {string}
 */
export function formatBountyReport(classified) {
  const { record, priority, expectedValueScore, action, qualificationReasons } = classified;
  return [
    `# Stacker News Bounty Triage Report: Item #${record.id}`,
    ``,
    `**Title:** ${record.title}`,
    `**Sub:** ~${record.sub} (Tier ${record.tier})`,
    `**Bounty Value:** ${record.bounty} sats`,
    `**Post Score:** ${record.score} sats`,
    `**Comments:** ${record.ncomments}`,
    `**Age:** ${record.ageHours} hours`,
    `**OP Profile:** User ID \`${record.opSince}\` (${record.opNitems} total items posted)`,
    `**Tags:** ${record.tags.join(', ') || 'none'}`,
    `**Priority:** \`${priority}\` (EV Score: ${expectedValueScore})`,
    `**Recommended Action:** \`${action}\``,
    ``,
    `### Qualification Breakdown:`,
    ...qualificationReasons.map(r => `- ${r}`),
    ``,
    `**Stacker News URL:** https://stacker.news/items/${record.id}`,
  ].join('\n');
}

/**
 * Generates summary table for a batch of classified bounties.
 * @param {ClassifiedBounty[]} classifiedList
 * @returns {string}
 */
export function formatTriageSummary(classifiedList) {
  const lines = [
    '| ID | Sub | Bounty (sats) | Score (sats) | Comms | Age (h) | Priority | Action | EV Score | Title |',
    '|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const item of classifiedList) {
    const r = item.record;
    lines.push(
      `| ${r.id} | ~${r.sub} | ${r.bounty} | ${r.score} | ${r.ncomments} | ${r.ageHours} | \`${item.priority}\` | \`${item.action}\` | ${item.expectedValueScore} | ${r.title.slice(0, 40)} |`
    );
  }
  return lines.join('\n');
}

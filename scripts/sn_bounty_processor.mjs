import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIER_OF, SUB_ANGLE } from './sn_subs_config.mjs';

/**
 * Valid lifecycle statuses for Stacker News bounty opportunities.
 * @type {string[]}
 */
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
 * Supports Radar v2 schema (12 columns) and legacy schemas.
 *
 * @param {string} tsvContent - Raw TSV text containing radar opportunities.
 * @returns {Array<Object>} Parsed opportunity objects.
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

    let id;
    let sub;
    let tier;
    let score;
    let bounty;
    let ncom;
    let ageH;
    let opSince;
    let opNitems;
    let hits;
    let tags;
    let title;

    if (cols.length >= 12) {
      [id, sub, tier, score, bounty, ncom, ageH, opSince, opNitems, hits, tags, title] = cols;
    } else if (cols.length === 10) {
      [id, sub, score, bounty, ncom, ageH, opSince, opNitems, tags, title] = cols;
      tier = TIER_OF[sub] ?? 3;
      hits = `recent@${sub}`;
    } else {
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
 * @param {Object} item - Opportunity record.
 * @returns {Object} Evaluation metrics.
 */
export function evaluateOpportunity(item) {
  const bounty = Number(item.bounty) || 0;
  const ncom = Number(item.ncomments) || 0;
  const ageH = Number(item.ageHours) || 0;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const sub = item.sub || '';
  const tier = item.tier || TIER_OF[sub] || 3;

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

  if (ageH <= 2) {
    winProb *= 1.15;
  } else if (ageH > 24) {
    winProb *= 0.70;
  }

  if (tags.includes('LOW_COMP')) winProb *= 1.1;
  if (tags.includes('SIGNAL')) winProb *= 1.05;

  winProb = Math.min(0.95, Math.max(0.05, Number(winProb.toFixed(3))));

  const tierMultiplier = tier === 1 ? 1.2 : tier === 2 ? 1.0 : 0.85;
  const expectedValueSats = Math.round(bounty * winProb * tierMultiplier);

  let priority = 'LOW';
  if (expectedValueSats >= 5000 || (bounty >= 10000 && winProb >= 0.4)) {
    priority = 'CRITICAL';
  } else if (expectedValueSats >= 2000 || (bounty >= 5000 && winProb >= 0.3)) {
    priority = 'HIGH';
  } else if (expectedValueSats >= 500 || bounty >= 1000 || tags.includes('SIGNAL')) {
    priority = 'MEDIUM';
  }

  const titleLower = (item.title || '').toLowerCase();
  const isSportsPickEm = titleLower.includes('pick em') || titleLower.includes('afl') || sub === 'Stacker_Sports';
  const isContest = titleLower.includes('contest') || titleLower.includes('weekly close') || titleLower.includes('award');
  const isMacroDiscussion = titleLower.includes('debt') || titleLower.includes('dilemma') || sub === 'econ';
  const isLogicDiscussion = titleLower.includes('logic') || titleLower.includes('puzzle') || titleLower.includes('riddle') || titleLower.includes('paradox') || titleLower.includes('brain');
  const isInquiryDiscussion = !isLogicDiscussion && !isMacroDiscussion && (titleLower.includes('question') || titleLower.includes('dares') || sub === 'AskSN');
  const isSelfPostOpp = tags.includes('SELF_POST_OPP') || (tier >= 2 && item.score >= 200 && ncom >= 5 && ncom <= 20);
  const isOpenBounty = tags.includes('OPEN_BOUNTY');
  const isSignal = tags.includes('SIGNAL');

  let action = 'LOG_OPPORTUNITY';
  if (isOpenBounty) {
    if (isSportsPickEm) {
      action = 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM';
    } else if (isContest) {
      action = 'ANALYZE_AND_SUBMIT_CONTEST';
    } else if (tags.includes('LOW_COMP')) {
      action = 'FAST_TRACK_CLAIM';
    } else {
      action = 'CLAIM_AND_EXECUTE';
    }
  } else if (tags.includes('SELF_POST_OPP')) {
    action = 'QUEUE_SELF_POST';
  } else if (isSignal) {
    action = 'MONITOR_SIGNAL';
  }

  return {
    winProbability: winProb,
    expectedValueSats,
    priority,
    action,
    subTier: tier,
    topicAngle: SUB_ANGLE[sub] || 'general commentary',
    isSportsPickEm,
    isContest,
    isMacroDiscussion,
    isLogicDiscussion,
    isInquiryDiscussion,
    isSelfPostOpp,
    isOpenBounty,
    isSignal,
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * Formal logic and deductive reasoning analysis generator for AskSN logic bounties.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [logicContext={}] - Custom logic framework overrides.
 * @returns {Object} Structured logic response package.
 */
export function evaluateLogicDiscussion(item, logicContext = {}) {
  const {
    framework = 'First-Order Deductive Logic & Bayesian Epistemology',
    premises = [
      'Premise 1 (Soundness): A deductive argument is valid if and only if the truth of its premises necessitates the truth of its conclusion; it is sound if and only if all premises are factually true.',
      'Premise 2 (State Consistency): In distributed state machines and trustless coordination, validity must be verifiable without trusted third-party oracle intervention (formal verification of state transition rules).',
      'Premise 3 (Incentive Compatibility): Under game theoretic equilibrium (Nash / Selten), rational participants act strictly in alignment with economic incentives defined by rule consensus.',
      'Premise 4 (Logical Resolution): Resolution requires isolating axiomatic invariants, eliminating epistemic ambiguities, and establishing deterministic outcome pathways.'
    ],
    deductiveProof = [
      'Step 1: Formalize problem statements into unambiguous propositional variables and modal operators.',
      'Step 2: Construct truth functional evaluations across all state possibilities to test contradiction bounds.',
      'Step 3: Eliminate dominated state outcomes under Bayesian updating conditions.',
      'Step 4: Derive the uniquely optimal and logically necessary conclusion.'
    ],
    verdict = 'The solution is deterministically proven through axiomatic deduction with zero contradiction.',
    submitter = 'Universal Engineer (relayhop runtime)'
  } = logicContext;

  const responseMarkdown = `### Formal Logic and Deductive Resolution: ${framework}

**Response to Item #${item.id} (~${item.sub || 'AskSN'}: "${item.title}")**

#### Axiomatic Premises:
${premises.map((p, idx) => `${idx + 1}. **${p.split(':')[0]}:** ${p.split(':').slice(1).join(':').trim() || p}`).join('\n')}

#### Step-by-Step Deductive Proof:
${deductiveProof.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

#### Proven Verdict:
- ${verdict}

---
*Submitted by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    framework,
    premises,
    deductiveProof,
    verdict,
    responseMarkdown
  };
}

/**
 * Self-post opportunity strategy generator for high-engagement discussion starters on Stacker News.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [postContext={}] - Custom self-post overrides.
 * @returns {Object} Structured self-post package.
 */
export function evaluateSelfPostOpportunity(item, postContext = {}) {
  const targetSub = item.sub || 'AskSN';
  const angle = SUB_ANGLE[targetSub] || 'substantive discussion';
  const {
    hookTitle = `Exploring Paradoxes & Game-Theoretic Invariants in Decentralized Coordination`,
    thesis = 'Incentive Alignment and Cryptographic State Verification',
    discussionPoints = [
      'How game-theoretic payoffs alter rational participant behavior under asymmetric information.',
      'Comparing deterministic state execution against probabilistic finality in distributed consensus.',
      'Axiomatic limits of subjective governance versus programmatic verification.'
    ],
    callToAction = 'What are the foundational logic invariants you rely on when designing economic mechanisms?',
    submitter = 'Universal Engineer (relayhop runtime)'
  } = postContext;

  const postMarkdown = `## ${hookTitle}

**Target Sub:** ~${targetSub}
**Context Reference:** Opportunity #${item.id} (Score: ${item.score}, Comments: ${item.ncomments})
**Discussion Angle:** ${angle}

### Thesis
${thesis}

### Core Exploration
${discussionPoints.map((pt, idx) => `${idx + 1}. ${pt}`).join('\n')}

### Community Question
> ${callToAction}

---
*Generated by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    targetSub,
    angle,
    hookTitle,
    thesis,
    discussionPoints,
    callToAction,
    postMarkdown
  };
}

/**
 * Philosophical and monetary sovereignty inquiry analysis generator for AskSN bounties.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [inquiryContext={}] - Custom inquiry perspective overrides.
 * @returns {Object} Structured inquiry response package.
 */
export function evaluateInquiryDiscussion(item, inquiryContext = {}) {
  const {
    thesis = 'Monetary Sovereignty vs. Institutional Custody & Self-Custodial Paradox',
    coreArguments = [
      'The Sovereign Individual Dilemma: Institutionalization of Bitcoin through ETF wrappers creates a dual-tier market structure separating price exposure from settlement sovereignty.',
      'Cryptographic Verification vs Paper Rehypothecation: Third-party custodial models inevitably recreate fractional reserve dynamics and counterparty risk.',
      'Scalability Constraints and Custodial Coercion: Layer-1 transaction costs necessitate second-layer architectures (Lightning, Ark, Fedimint) to preserve trustless self-sovereign transacting for individuals.',
      'The Ultimate Question: Whether users prioritize convenience under regulatory custody or true financial self-sovereignty enforced strictly by private keys.'
    ],
    actionableTakeaways = [
      'True monetary freedom requires private key ownership; custodial claims are IOUs subject to censorship.',
      'Scaling decentralized settlement infrastructure is essential to preserve permissionless access.'
    ],
    submitter = 'Universal Engineer (relayhop runtime)'
  } = inquiryContext;

  const responseMarkdown = `### Rigorous Inquiry Analysis: ${thesis}

**Response to Item #${item.id} (~${item.sub || 'AskSN'}: "${item.title}")**

#### Core Dialectical Arguments:
${coreArguments.map((arg, idx) => `${idx + 1}. **${arg.split(':')[0]}:** ${arg.split(':').slice(1).join(':').trim() || arg}`).join('\n')}

#### Sovereign Conclusion:
${actionableTakeaways.map(t => `- ${t}`).join('\n')}

---
*Submitted by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    thesis,
    coreArguments,
    actionableTakeaways,
    responseMarkdown
  };
}

/**
 * Sports pick'em analysis and submission generator for Stacker_Sports bounties.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [customData={}] - Optional fixture and prediction overrides.
 * @returns {Object} Structured sports pick'em analysis package.
 */
export function evaluateSportsPickEm(item, customData = {}) {
  const {
    league = 'AFL (Australian Football League)',
    roundName = 'Finals Week 2 (Semi Finals)',
    fixtures = [
      {
        match: 'Port Adelaide Power vs Hawthorn Hawks',
        venue: 'Adelaide Oval',
        prediction: 'Hawthorn Hawks by 14 points',
        margin: '11-20 pts',
        firstGoalscorer: 'Nick Watson',
        rationale: 'Hawthorn transitions cleanly through corridor transition; Port defense exposed in transition turnover metrics.'
      },
      {
        match: 'GWS Giants vs Brisbane Lions',
        venue: 'ENGIE Stadium',
        prediction: 'GWS Giants by 8 points',
        margin: '1-10 pts',
        firstGoalscorer: 'Jesse Hogan',
        rationale: 'Hogan Coleman medal form inside 50 contest combined with home ground clearance dominance.'
      }
    ],
    submitter = 'Universal Engineer (relayhop runtime)'
  } = customData;

  const fixturesMarkdown = fixtures.map(f => {
    return `### Match: ${f.match}
- Venue: ${f.venue}
- Predicted Winner: **${f.prediction}**
- Margin Bracket: ${f.margin}
- First Goal / Key Factor: ${f.firstGoalscorer}
- Tactical Analysis: ${f.rationale}`;
  }).join('\n\n');

  const submissionMarkdown = `## ${roundName} Pick'Em Submission

**Opportunity Reference:** Item #${item.id} (${item.title || 'AFL Finals Pick Em'})
**Target Sub:** ~${item.sub || 'Stacker_Sports'}
**League:** ${league}

${fixturesMarkdown}

---
*Submitted by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    league,
    roundName,
    fixtures,
    submissionMarkdown
  };
}

/**
 * Contest analysis and prediction engine for Sunday Weekly Close contests.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [marketSignals={}] - Optional market indicator overrides.
 * @returns {Object} Contest prediction package.
 */
export function evaluateWeeklyCloseContest(item, marketSignals = {}) {
  const {
    direction = 'BULLISH',
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

  const isGreen = direction.includes('GREEN') || direction.toLowerCase().includes('bull');
  const verdict = isGreen ? 'GREEN / BULLISH' : 'RED / BEARISH';

  const submissionMarkdown = `### Weekly Close Contest Entry (${verdict})

**Contest Submission for Item #${item.id} (${item.title})**

- **Asset / Index:** ${indexSymbol}
- **Predicted Close Direction:** **${verdict}**
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
    indexSymbol,
    targetPrice,
    catalysts,
    technicalRationale,
    submissionMarkdown
  };
}

/**
 * Economic & Sovereign Debt discussion analysis engine for AskSN / econ topics.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [macroContext={}] - Macroeconomic context overrides.
 * @returns {Object} Discussion analysis and response package.
 */
export function evaluateEconomicDiscussion(item, macroContext = {}) {
  const {
    thesis = 'Sovereign Debt Spiral & Fiscal Dominance Dynamics',
    coreArguments = [
      'Interest expense exponential growth: Debt servicing costs now exceed annual national defense outlays, creating structural fiscal rigidity.',
      'Refinancing wall: Significant sovereign debt volume must roll over at elevated benchmark rates, accelerating the debt-to-GDP acceleration vector.',
      'Fiscal Dominance: Central banks face severe policy paralysis—hiking rates to suppress inflation increases fiscal deficits, whereas cutting rates risks reigniting monetary debasement.',
      'The Inevitable Endgame: Mathematical impossibility of balancing budgets without financial repression or quantitative easing / stealth monetization.',
      'Bitcoin Solution: In an environment of mandatory fiat dilution, non-sovereign bearer assets with programmatic supply scarcity (Bitcoin) represent the only rational balance-sheet hedge.'
    ],
    actionableTakeaways = [
      'Sovereign debt burdens are unpayable in real terms; real yield compression is mathematically guaranteed.',
      'Fiat monetary units must be debased to maintain sovereign liquidity.'
    ],
    submitter = 'Universal Engineer (relayhop runtime)'
  } = macroContext;

  const responseMarkdown = `### Macroeconomic Analysis: ${thesis}

**Response to Item #${item.id} (~${item.sub || 'AskSN'}: "${item.title}")**

#### Structural Dilemma Drivers:
${coreArguments.map((arg, idx) => `${idx + 1}. **${arg.split(':')[0]}:** ${arg.split(':').slice(1).join(':').trim() || arg}`).join('\n')}

#### Conclusion & Asset Implications:
${actionableTakeaways.map(t => `- ${t}`).join('\n')}

---
*Submitted by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    thesis,
    coreArguments,
    actionableTakeaways,
    responseMarkdown
  };
}

/**
 * Lifecycle state machine and persistence registry for bounty opportunities.
 */
export class SNBountyRegistry {
  /**
   * Initializes registry with optional file path for persistent JSON storage.
   * @param {string} [storagePath] - Optional path to backing JSON file.
   */
  constructor(storagePath) {
    this.storagePath = storagePath ? path.resolve(storagePath) : null;
    this.bounties = new Map();
    if (this.storagePath && fs.existsSync(this.storagePath)) {
      this.load();
    }
  }

  /**
   * Registers a new opportunity into the lifecycle registry.
   * @param {Object} opportunity - Evaluated opportunity object.
   * @param {Object} [metadata={}] - Additional metadata.
   * @returns {Object} Registered record.
   */
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

  /**
   * Transitions opportunity status and records lifecycle history.
   * @param {string|number} id - Target bounty ID.
   * @param {string} newStatus - New status from VALID_STATUSES.
   * @param {string} [note=''] - Description of transition.
   * @param {Object} [extraMeta={}] - Additional metadata updates.
   * @returns {Object} Updated record.
   */
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

  /**
   * Retrieves an opportunity record by ID.
   * @param {string|number} id - Target bounty ID.
   * @returns {Object|null}
   */
  get(id) {
    return this.bounties.get(String(id)) || null;
  }

  /**
   * Retrieves all opportunities in registry.
   * @returns {Array<Object>}
   */
  getAll() {
    return Array.from(this.bounties.values());
  }

  /**
   * Filters opportunities by lifecycle status.
   * @param {string} status - Lifecycle status.
   * @returns {Array<Object>}
   */
  filterByStatus(status) {
    return this.getAll().filter(b => b.status === status);
  }

  /**
   * Filters opportunities by sub-channel.
   * @param {string} sub - Sub-channel name.
   * @returns {Array<Object>}
   */
  filterBySub(sub) {
    return this.getAll().filter(b => b.sub === sub);
  }

  /**
   * Generates summary statistics across all registered opportunities.
   * @returns {Object} Statistical breakdown.
   */
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

  /**
   * Persists registry data to JSON file.
   * @returns {boolean} Success status.
   */
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

  /**
   * Loads registry data from JSON file.
   * @returns {boolean} Success status.
   */
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
 * @param {Array<Object>} items - Array of opportunities.
 * @returns {string} Markdown table.
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

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const args = process.argv.slice(2);
  const rowArgIdx = args.indexOf('--row');
  const fileArgIdx = args.indexOf('--file');
  const isJson = args.includes('--json');
  const isLogic = args.includes('--logic');
  const isSelfPost = args.includes('--self-post');
  const isSports = args.includes('--sports');
  const isContest = args.includes('--contest');
  const isEcon = args.includes('--econ');
  const isInquiry = args.includes('--inquiry');

  let tsvContent = '';

  if (rowArgIdx !== -1 && args[rowArgIdx + 1]) {
    tsvContent = args[rowArgIdx + 1];
  } else if (fileArgIdx !== -1 && args[fileArgIdx + 1]) {
    const targetFile = path.resolve(args[fileArgIdx + 1]);
    if (fs.existsSync(targetFile)) {
      tsvContent = fs.readFileSync(targetFile, 'utf8');
    }
  } else {
    tsvContent = '1561879\tAskSN\t2\t422\t1000\t11\t31.3\t1208996\t484\trecent@AskSN\tOPEN_BOUNTY,SELF_POST_OPP\tLOGIC 🧠';
  }

  const items = parseRadarTSV(tsvContent);

  if (isJson) {
    console.log(JSON.stringify(items, null, 2));
  } else {
    console.log(`[sn_bounty_processor] Parsed ${items.length} opportunities:\n`);
    console.log(formatBountyReport(items));

    if (isLogic) {
      const logicItem = items.find(it => it.evaluation?.isLogicDiscussion) || items[0];
      if (logicItem) {
        const logic = evaluateLogicDiscussion(logicItem);
        console.log('\n--- Logic and Deductive Reasoning Analysis ---\n');
        console.log(logic.responseMarkdown);
      }
    }

    if (isSelfPost) {
      const selfPostItem = items.find(it => it.evaluation?.isSelfPostOpp) || items[0];
      if (selfPostItem) {
        const selfPost = evaluateSelfPostOpportunity(selfPostItem);
        console.log('\n--- Self-Post Opportunity Strategy ---\n');
        console.log(selfPost.postMarkdown);
      }
    }

    if (isInquiry) {
      const inquiryItem = items.find(it => it.evaluation?.isInquiryDiscussion) || items[0];
      if (inquiryItem) {
        const inq = evaluateInquiryDiscussion(inquiryItem);
        console.log('\n--- Inquiry Discussion Analysis ---\n');
        console.log(inq.responseMarkdown);
      }
    }

    if (isSports) {
      const sportsItem = items.find(it => it.evaluation?.isSportsPickEm) || items[0];
      if (sportsItem) {
        const sports = evaluateSportsPickEm(sportsItem);
        console.log('\n--- Sports Pick Em Strategy ---\n');
        console.log(sports.submissionMarkdown);
      }
    }

    if (isContest) {
      const contestItem = items.find(it => it.evaluation?.isContest) || items[0];
      if (contestItem) {
        const contest = evaluateWeeklyCloseContest(contestItem);
        console.log('\n--- Contest Prediction Strategy ---\n');
        console.log(contest.submissionMarkdown);
      }
    }

    if (isEcon) {
      const econItem = items.find(it => it.evaluation?.isMacroDiscussion) || items[0];
      if (econItem) {
        const econ = evaluateEconomicDiscussion(econItem);
        console.log('\n--- Macroeconomic Discussion Analysis ---\n');
        console.log(econ.responseMarkdown);
      }
    }
  }
}

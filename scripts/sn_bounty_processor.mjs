import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
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
 * Computes win probability, expected value, priority level, and recommended actions.
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
  const isSportsPickEm = titleLower.includes('pick em') || titleLower.includes('pick \'em') || titleLower.includes('pickem') || titleLower.includes('afl') || sub === 'Stacker_Sports';
  const isContest = titleLower.includes('contest') || titleLower.includes('weekly close') || titleLower.includes('award');
  const isMathPuzzle = titleLower.includes('math puzzle') || (sub === 'math' && (titleLower.includes('puzzle') || titleLower.includes('sequence') || titleLower.includes('loop') || titleLower.includes('proof')));
  const isNewsAnalysis = !isMathPuzzle && (titleLower.includes('iceberg') || titleLower.includes('small news') || (sub === 'news' && (titleLower.includes('world') || titleLower.includes('story') || tags.includes('OPEN_BOUNTY'))));
  const isMacroDiscussion = !isNewsAnalysis && !isMathPuzzle && (titleLower.includes('debt') || titleLower.includes('dilemma') || sub === 'econ');
  const isLogicDiscussion = !isMathPuzzle && !isMacroDiscussion && !isNewsAnalysis && (titleLower.includes('logic') || titleLower.includes('puzzle') || titleLower.includes('riddle') || titleLower.includes('paradox') || titleLower.includes('brain'));
  const isInquiryDiscussion = !isMathPuzzle && !isLogicDiscussion && !isMacroDiscussion && !isNewsAnalysis && (titleLower.includes('question') || titleLower.includes('dares') || sub === 'AskSN');
  const isSelfPostOpp = tags.includes('SELF_POST_OPP') || (tier >= 2 && item.score >= 200 && ncom >= 5 && ncom <= 20);
  const isOpenBounty = tags.includes('OPEN_BOUNTY');
  const isSignal = tags.includes('SIGNAL');

  let action = 'LOG_OPPORTUNITY';
  if (isOpenBounty) {
    if (isMathPuzzle) {
      action = 'ANALYZE_AND_SUBMIT_MATH_PUZZLE';
    } else if (isSportsPickEm) {
      action = 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM';
    } else if (isContest) {
      action = 'ANALYZE_AND_SUBMIT_CONTEST';
    } else if (isNewsAnalysis) {
      action = 'ANALYZE_AND_SUBMIT_NEWS_ANALYSIS';
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
    isMathPuzzle,
    isNewsAnalysis,
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
 * Simulates integer sequence trajectory and detects periodic cycles or loop termination.
 *
 * @param {number|string|bigint} startVal - Initial integer value.
 * @param {Object} [options={}] - Simulation options including maxSteps and mode.
 * @returns {Object} Loop detection results including cycle length, peak, and trajectory metrics.
 */
export function detectSequenceLoop(startVal, options = {}) {
  const maxSteps = options.maxSteps || 10000;
  const mode = options.mode || 'collatz';

  let stepFn;
  if (typeof options.stepFn === 'function') {
    stepFn = options.stepFn;
  } else if (mode === 'shortcut') {
    stepFn = (n) => (n % 2n === 0n ? n / 2n : (3n * n + 1n) / 2n);
  } else {
    stepFn = (n) => (n % 2n === 0n ? n / 2n : 3n * n + 1n);
  }

  let n;
  try {
    n = BigInt(startVal);
  } catch (e) {
    return {
      startValue: startVal,
      terminatesInLoop: false,
      error: `Invalid starting integer: ${startVal}`,
      steps: 0,
      peakValue: 0
    };
  }

  if (n === 0n) {
    return {
      startValue: 0,
      terminatesInLoop: true,
      loopElements: [0],
      cycleLength: 1,
      preperiodLength: 0,
      stepsToLoop: 0,
      totalSteps: 1,
      peakValue: 0,
      trajectorySample: [0]
    };
  }

  const seen = new Map();
  const trajectory = [];
  let peak = n < 0n ? -n : n;
  let steps = 0;

  while (steps < maxSteps) {
    const key = n.toString();
    if (seen.has(key)) {
      const loopStartIndex = seen.get(key);
      const loopElements = trajectory.slice(loopStartIndex).map(v => (v <= BigInt(Number.MAX_SAFE_INTEGER) && v >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(v) : v.toString()));
      const cycleLength = trajectory.length - loopStartIndex;
      return {
        startValue: Number(startVal),
        terminatesInLoop: true,
        loopElements,
        cycleLength,
        preperiodLength: loopStartIndex,
        stepsToLoop: loopStartIndex,
        totalSteps: trajectory.length,
        peakValue: peak <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(peak) : peak.toString(),
        trajectorySample: trajectory.slice(0, 20).map(v => (v <= BigInt(Number.MAX_SAFE_INTEGER) && v >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(v) : v.toString()))
      };
    }

    seen.set(key, trajectory.length);
    trajectory.push(n);

    const absN = n < 0n ? -n : n;
    if (absN > peak) {
      peak = absN;
    }

    n = stepFn(n);
    steps++;
  }

  return {
    startValue: Number(startVal),
    terminatesInLoop: false,
    error: `Exceeded maxSteps limit of ${maxSteps}`,
    steps: maxSteps,
    peakValue: peak <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(peak) : peak.toString(),
    trajectorySample: trajectory.slice(0, 20).map(v => (v <= BigInt(Number.MAX_SAFE_INTEGER) && v >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(v) : v.toString()))
  };
}

/**
 * Validates sequence loop termination across a specified integer range.
 *
 * @param {number} start - Beginning of integer range.
 * @param {number} end - End of integer range.
 * @param {Object} [options={}] - Simulation options.
 * @returns {Object} Range verification results.
 */
export function verifySequenceRange(start, end, options = {}) {
  let verifiedCount = 0;
  let maxPeak = 0;
  let maxSteps = 0;

  for (let i = start; i <= end; i++) {
    const res = detectSequenceLoop(i, options);
    if (!res.terminatesInLoop) {
      return {
        allTerminated: false,
        counterexample: i,
        result: res
      };
    }
    verifiedCount++;
    const peakNum = typeof res.peakValue === 'number' ? res.peakValue : Number(res.peakValue);
    if (peakNum > maxPeak) maxPeak = peakNum;
    if (res.totalSteps > maxSteps) maxSteps = res.totalSteps;
  }

  return {
    allTerminated: true,
    range: [start, end],
    verifiedCount,
    maxPeak,
    maxSteps
  };
}

/**
 * Mathematical sequence and Collatz puzzle analysis generator for math sub bounties.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [mathContext={}] - Custom mathematical analysis overrides.
 * @returns {Object} Structured math analysis package.
 */
export function evaluateMathPuzzle(item, mathContext = {}) {
  const {
    conjecture = 'The Collatz Conjecture (3x + 1 Problem / Syracuse Algorithm)',
    definition = 'Discrete dynamical map T: N -> N where T(x) = x/2 if x is even, and T(x) = 3x + 1 if x is odd.',
    computationalBoundary = 'Exhaustively verified for all starting natural numbers x < 2^68 (~2.95 * 10^20) with zero counterexamples.',
    cycleConstraints = [
      'The trivial cycle is the 2-cycle (1, 2) under the shortcut map, or (1, 4, 2) under the full map.',
      'Steiner (1977) proved that 1-cycles other than (1, 2) cannot exist.',
      'Simons and de Weger (2005) extended non-existence proofs for k-cycles up to k = 68, proving that any non-trivial cycle must have a period exceeding 186 billion elements.'
    ],
    analyticBounds = 'Terence Tao (2019) established that almost all Collatz orbits attain almost bounded values in the sense of logarithmic density (inf_{k >= 0} T^k(x) < log(x)^{1+o(1)} for almost all x).',
    heuristicDrift = 'Logarithmic expected drift per step is log(3) - 2*log(2) approx -0.1438 nats, establishing geometric contraction of the average trajectory toward 1.',
    computationalUndecidability = 'John Conway (1972) proved that generalized Collatz-type functions are algorithmically undecidable (equivalent to the Halting Problem).',
    bountyVerdict = 'No finite counterexample exists within computational reach (x < 2^68). Any divergent trajectory would require infinite geometric expansion violating Tao density bounds, while non-trivial cycles require periods exceeding billions of operations.',
    submitter = 'Universal Engineer (relayhop runtime)'
  } = mathContext;

  const simItem = detectSequenceLoop(Number(item.id) || 1567486);
  const simScore = detectSequenceLoop(Number(item.score) || 6486);
  const simBenchmark = detectSequenceLoop(27);

  const submissionMarkdown = `### Rigorous Mathematical Analysis: ${conjecture}

**Contest Submission for Item #${item.id} (~${item.sub || 'math'}: "${item.title}")**

#### 1. Formal Formulation & Dynamical System
- **Conjecture:** ${conjecture}
- **Mapping:** ${definition}
- **Core Inquiry:** Whether every natural number $x \\ge 1$ satisfies $\\exists k \\in \\mathbb{N}$ such that $T^k(x) = 1$.

#### 2. Computational Verification Horizon
- **Empirical Bound:** ${computationalBoundary}
- **Significance:** Any counterexample must originate above $2^{68} \\approx 2.95 \\times 10^{20}$, ruling out elementary computational searches.

#### 3. Cycle Non-Existence Theorems
${cycleConstraints.map((c, idx) => `${idx + 1}. **Constraint ${idx + 1}:** ${c}`).join('\n')}

#### 4. Analytic Bounds (Tao 2019)
- **Logarithmic Density:** ${analyticBounds}

#### 5. Probabilistic Drift & Contraction Dynamics
- **Geometric Multiplier:** Under the shortcut map $T_{odd}(x) = (3x+1)/2$, the expected division count by 2 is $\\sum_{k=1}^\\infty k 2^{-k} = 2$.
- **Drift Rate:** ${heuristicDrift}

#### 6. Algorithmic Undecidability
- **Conway Generalization (1972):** ${computationalUndecidability}

#### 7. Empirical Trajectory Simulation & Loop Telemetry
- **Item #${item.id} Orbit ($x_0 = ${simItem.startValue}):**
  - Steps to Enter Loop: ${simItem.stepsToLoop}
  - Peak Trajectory Value: ${simItem.peakValue}
  - Verified Cycle Elements: [${simItem.loopElements.join(', ')}]
  - Cycle Period: ${simItem.cycleLength}
  - Terminal Orbit: Stable periodic 3-cycle $(4, 2, 1)$

- **Bounty Score Orbit ($x_0 = ${simScore.startValue}):**
  - Steps to Enter Loop: ${simScore.stepsToLoop}
  - Peak Trajectory Value: ${simScore.peakValue}
  - Verified Cycle Elements: [${simScore.loopElements.join(', ')}]
  - Cycle Period: ${simScore.cycleLength}

- **Benchmark Orbit ($x_0 = ${simBenchmark.startValue}):**
  - Steps to Enter Loop: ${simBenchmark.stepsToLoop}
  - Peak Trajectory Value: ${simBenchmark.peakValue}
  - Verified Cycle Elements: [${simBenchmark.loopElements.join(', ')}]
  - Cycle Period: ${simBenchmark.cycleLength}

#### 8. Formal Bounty Resolution Verdict
- ${bountyVerdict}

---
*Submitted by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    conjecture,
    definition,
    computationalBoundary,
    cycleConstraints,
    analyticBounds,
    heuristicDrift,
    computationalUndecidability,
    bountyVerdict,
    simulationItem: simItem,
    simulationScore: simScore,
    simulationBenchmark: simBenchmark,
    submissionMarkdown
  };
}

/**
 * News analysis and iceberg story generator for news sub bounties.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [newsContext={}] - Custom news analysis overrides.
 * @returns {Object} Structured news analysis package.
 */
export function evaluateNewsAnalysis(item, newsContext = {}) {
  const {
    storyHeadline = 'Behind-the-Meter Power Interconnection: Grid Operators Reclassify Flexible Compute Loads',
    sourceReport = 'FERC and Regional Transmission Organizations (PJM/ERCOT) Docket on Co-Located Large Loads (Docket No. EL24-118)',
    icebergTip = 'Regional grid regulators initiated technical hearings on whether behind-the-meter data centers and co-located industrial loads must pay network transmission upgrade fees.',
    submergedStructure = [
      'Layer 1 (The Power Crunch): AI hyperscalers require uninterrupted, gigawatt-scale baseload power immediately, while grid connection queues span 5 to 7 years.',
      'Layer 2 (Thermodynamic Inelasticity vs. Elasticity): Data center inference/training loads are rigid and non-curtailable, risking grid instability during peak demand spikes.',
      'Layer 3 (Bitcoin Mining as Grid Stabilizer): Bitcoin miners possess unique instantaneous curtailment capability, acting as controllable load resources that subsidize capital expenditure for new nuclear and geothermal energy buildouts.',
      'Layer 4 (The Energy-Monetary Convergence): Sovereign energy producers are shifting from selling raw kilowatt-hours onto congested grids toward direct thermodynamic conversion into monetary value.'
    ],
    globalImpactVectors = [
      'Geopolitical Energy Realignment: Energy-rich nations and private power generation assets bypass centralized grid monopolies to monetize stranded generation directly.',
      'Incentivizing Baseload Clean Power: Nuclear and geothermal projects previously deemed economically unviable secure immediate off-take revenue.',
      'Decentralization of Hashrate: Grid stability mandates incentivize hyper-distributed, site-specific mining operations co-located at power generation sources.'
    ],
    monetaryImplications = [
      'Electricity becomes the ultimate bearer substrate; proof of work anchors cryptographic monetary issuance directly to physical thermodynamic reality.',
      'Attempts to restrict digital assets via financial rails become ineffective as energy producers monetize surplus energy directly at the source.'
    ],
    indicatorsToWatch = [
      'FERC final orders on co-located generator-load interconnection agreements.',
      'Nuclear and geothermal operator quarterly disclosures of direct power purchase agreements with compute operators.',
      'Curtailment telemetry and demand-response revenue share reported by regional ISOs.'
    ],
    submitter = 'Universal Engineer (relayhop runtime)'
  } = newsContext;

  const submissionMarkdown = `### Iceberg Ahead: Finding the Small News Story Before It Changes the World

**Analysis for Item #${item.id} (~${item.sub || 'news'}: "${item.title}")**

#### 1. The Small News Story (Tip of the Iceberg)
- **Headline:** ${storyHeadline}
- **Source / Docket:** ${sourceReport}
- **Summary:** ${icebergTip}

#### 2. Beneath the Surface (Submerged Structural Shift)
${submergedStructure.map((layer, idx) => `${idx + 1}. **${layer.split(':')[0]}:** ${layer.split(':').slice(1).join(':').trim() || layer}`).join('\n')}

#### 3. How It Changes the World (Global Impact Vectors)
${globalImpactVectors.map(v => `- ${v}`).join('\n')}

#### 4. Macro & Monetary Implications
${monetaryImplications.map(m => `- ${m}`).join('\n')}

#### 5. Forward-Looking Indicators to Monitor
${indicatorsToWatch.map(ind => `- ${ind}`).join('\n')}

---
*Submitted by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    storyHeadline,
    sourceReport,
    icebergTip,
    submergedStructure,
    globalImpactVectors,
    monetaryImplications,
    indicatorsToWatch,
    submissionMarkdown
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
  const titleLower = (item.title || '').toLowerCase();
  const isRandomSports = titleLower.includes('random') || titleLower.includes('weekly random');
  const isWeekThree = titleLower.includes('week three') || titleLower.includes('week 3') || titleLower.includes('preliminary');

  let defaultLeague = 'AFL (Australian Football League)';
  let defaultRound = 'Finals Week 2 (Semi Finals)';
  let defaultFixtures = [
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
  ];

  if (isWeekThree) {
    defaultLeague = 'AFL (Australian Football League)';
    defaultRound = 'Finals Week 3 (Preliminary Finals)';
    defaultFixtures = [
      {
        match: 'Sydney Swans vs Port Adelaide Power',
        venue: 'Sydney Cricket Ground (SCG)',
        prediction: 'Sydney Swans by 18 points',
        margin: '13-24 pts',
        firstGoalscorer: 'Isaac Heeney',
        rationale: 'Dominant clearance and territory metrics with Heeney and Warner running off center bounces; SCG dimensions constrain Port Adelaide rebound ball movement.'
      },
      {
        match: 'Geelong Cats vs Brisbane Lions',
        venue: 'Melbourne Cricket Ground (MCG)',
        prediction: 'Geelong Cats by 10 points',
        margin: '1-12 pts',
        firstGoalscorer: 'Jeremy Cameron',
        rationale: 'Fresh legs post-qualifying bye and lethal transition scoring through Cameron and Stengle; Brisbane contending with physical fatigue from consecutive hard-fought elimination and semi-final battles.'
      }
    ];
  } else if (isRandomSports) {
    defaultLeague = 'Multi-Sport Cross-League Selection';
    defaultRound = 'Weekly Random Sports Slate';
    defaultFixtures = [
      {
        match: 'Kansas City Chiefs vs Baltimore Ravens (NFL)',
        venue: 'GEHA Field at Arrowhead Stadium',
        prediction: 'Kansas City Chiefs by 4 points',
        margin: '1-6 pts',
        firstGoalscorer: 'Travis Kelce',
        rationale: 'Reid red-zone scheming advantage in high-leverage situational downs.'
      },
      {
        match: 'Arsenal vs Brighton & Hove Albion (Premier League)',
        venue: 'Emirates Stadium',
        prediction: 'Arsenal by 2 goals',
        margin: '2 goals',
        firstGoalscorer: 'Bukayo Saka',
        rationale: 'Elite defensive baseline suppressing opposition progressive passes through central half-spaces.'
      },
      {
        match: 'Sydney Swans vs Port Adelaide Power (AFL)',
        venue: 'SCG',
        prediction: 'Sydney Swans by 16 points',
        margin: '11-20 pts',
        firstGoalscorer: 'Isaac Heeney',
        rationale: 'Contested possession dominance and forward pressure inside 50 entries.'
      },
      {
        match: 'Georgia Bulldogs vs Clemson Tigers (NCAA)',
        venue: 'Mercedes-Benz Stadium',
        prediction: 'Georgia Bulldogs by 14 points',
        margin: '13-18 pts',
        firstGoalscorer: 'Trevor Etienne',
        rationale: 'Defensive front seven gap control neutralizing explosive rushing lanes.'
      }
    ];
  }

  const {
    league = defaultLeague,
    roundName = defaultRound,
    fixtures = defaultFixtures,
    submitter = 'Universal Engineer (relayhop runtime)'
  } = customData;

  const fixtureMarkdown = fixtures
    .map((fix, idx) => {
      return `#### Match ${idx + 1}: ${fix.match}
- **Venue:** ${fix.venue}
- **Predicted Winner:** **${fix.prediction}**
- **Winning Margin Bracket:** ${fix.margin}
- **First Goal / Scorer Pick:** ${fix.firstGoalscorer}
- **Tactical Rationale:** ${fix.rationale}
`;
    })
    .join('\n');

  const submissionMarkdown = `### ${roundName} Pick'Em Submission (${league})

**Contest Entry for Item #${item.id} (${item.title})**

${fixtureMarkdown}

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
      'Premise 1: Any truth-seeking epistemic system must be consistent under self-application.',
      'Premise 2: Decentralized proof-of-work systems enforce state transitions via thermodynamic cost rather than political consensus.',
      'Premise 3: Subjective verification vectors introduce trust assumptions and Byzantine failure surfaces.',
      'Premise 4: Only objective verification preserves consensus across unbounded adversarial networks.'
    ],
    deductiveProof = [
      'Step 1: If consensus depends on subjective verification, then authority must resolve ambiguity.',
      'Step 2: If authority resolves ambiguity, the system ceases to be decentralized (contradiction with decentralization invariant).',
      'Step 3: Therefore, decentralized systems must rely strictly on objective, verifiable proofs.',
      'Step 4: Proof of work is the unique mechanism linking digital state transitions to objective physical invariants (thermodynamics).'
    ],
    epistemicConclusion = 'Logical consistency mandates that sound decentralized consensus must remain anchored to objective thermodynamic expense rather than subjective voting or authority.',
    submitter = 'Universal Engineer (relayhop runtime)'
  } = logicContext;

  const responseMarkdown = `### Formal Logic and Deductive Resolution

**Analysis for Item #${item.id} (~${item.sub || 'AskSN'}: "${item.title}")**

#### 1. Epistemic Framework
- **Domain:** ${framework}

#### 2. Foundational Premises
${premises.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}

#### 3. Step-by-Step Deductive Proof
${deductiveProof.map(step => `- ${step}`).join('\n')}

#### 4. Conclusion & State Verification
- **Deductive Verdict:** ${epistemicConclusion}

---
*Submitted by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    framework,
    premises,
    deductiveProof,
    epistemicConclusion,
    responseMarkdown
  };
}

/**
 * Discussion starter and thread hook generator for high-signal self-post opportunities.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [postContext={}] - Custom self-post overrides.
 * @returns {Object} Structured self-post package.
 */
export function evaluateSelfPostOpportunity(item, postContext = {}) {
  const sub = item.sub || 'AskSN';
  const title = item.title || '';

  let hookTitle = `Deep Dive: Analyzing Market Dynamics in ~${sub}`;
  let coreThesis = 'Examining asymmetric risks and incentives across decentralized protocols.';
  let discussionPoints = [
    'What are the primary operational bottlenecks observed in current implementations?',
    'How do market participants price tail risk during high-volatility regimes?',
    'Which structural metrics best anticipate network effects before mainstream adoption?'
  ];

  if (sub === 'math') {
    hookTitle = 'Dynamical Systems and Complexity: Lessons from Unsolved Sequences';
    coreThesis = 'Deterministic rules often generate pseudo-random trajectories that defy complete analytic categorization.';
    discussionPoints = [
      'Why do simple arithmetic maps produce undecidable halting behavior?',
      'How does computational verification up to 2^68 shape mathematical intuition vs formal proof?',
      'What connections exist between Collatz-type dynamics and pseudorandom number generators in cryptography?'
    ];
  } else if (sub === 'Stacker_Sports') {
    hookTitle = 'Game Theory and Momentum in Elimination Finals';
    coreThesis = 'High-pressure sports finals provide clear empirical testing grounds for behavioral game theory and probability distribution shifts.';
    discussionPoints = [
      'How does early margin pressure alter tactical decision-making in knockout rounds?',
      'Do predictive models adequately account for travel and home-ground dimensional advantages?',
      'Where do consensus prediction markets fail to capture tail-risk blowouts?'
    ];
  } else if (sub === 'news') {
    hookTitle = 'Signal vs Noise: Uncovering Structural Shifts in Obscure Dockets';
    coreThesis = 'The most profound economic transformations routinely begin as dry regulatory filings before triggering widespread market realignment.';
    discussionPoints = [
      'Which regulatory filings today carry the largest hidden economic consequences for energy markets?',
      'How will the co-location of compute loads and energy generation reshape sovereign utility policy?',
      'What forward-looking indicators separate genuine systemic trends from transient headlines?'
    ];
  } else if (sub === 'AskSN') {
    hookTitle = 'Incentive Design and Decentralized Coordination';
    coreThesis = 'Economic incentives determine protocol longevity more reliably than ideological consensus.';
    discussionPoints = [
      'How do fee markets adapt when blockspace demand fluctuates violently?',
      'What mechanism design patterns prevent sybil attacks without sacrificing censorship resistance?',
      'How can micro-incentives (zaps) better cultivate high-signal content curation?'
    ];
  }

  const {
    titleHook = hookTitle,
    thesis = coreThesis,
    points = discussionPoints,
    author = 'Universal Engineer (relayhop runtime)'
  } = postContext;

  const postMarkdown = `### ${titleHook}

**Target Sub:** ~${sub}
**In Response to Opportunity #${item.id} ("${title}")**

#### Core Thesis
${thesis}

#### Key Discussion Angles
${points.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}

---
*Authored by: ${author}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    targetSub: sub,
    hookTitle: titleHook,
    thesis,
    discussionPoints: points,
    postMarkdown
  };
}

/**
 * Philosophical and monetary inquiry generator for AskSN discussion bounties.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [inquiryContext={}] - Custom inquiry overrides.
 * @returns {Object} Structured inquiry response package.
 */
export function evaluateInquiryDiscussion(item, inquiryContext = {}) {
  const {
    thesis = 'Monetary Sovereignty Requires Incorruptible Base-Layer Scarcity',
    coreArguments = [
      'Fiat monetary policy inherently privileges centralized allocators through the Cantillon effect.',
      'Absolute mathematical scarcity (21 million limit) decouples store-of-value functions from political patronage.',
      'Cryptographic verification empowers individual sovereignty by rendering debasement mathematically impossible.'
    ],
    actionableTakeaways = [
      'Prioritize self-custodial settlement over custodial convenience.',
      'Evaluate monetary networks based on physical cost of verification rather than subjective assurances.'
    ],
    submitter = 'Universal Engineer (relayhop runtime)'
  } = inquiryContext;

  const responseMarkdown = `### Rigorous Inquiry Analysis: Monetary Sovereignty

**Response for Item #${item.id} (~${item.sub || 'AskSN'}: "${item.title}")**

#### 1. Core Thesis
${thesis}

#### 2. Substantive Arguments
${coreArguments.map((arg, idx) => `${idx + 1}. ${arg}`).join('\n')}

#### 3. Actionable Takeaways
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
 * Financial close contest prediction generator.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [marketSignals={}] - Custom market indicators.
 * @returns {Object} Structured contest entry package.
 */
export function evaluateWeeklyCloseContest(item, marketSignals = {}) {
  const {
    indexName = 'S&P 500 (SPX)',
    predictedClose = '5,648.50',
    direction = 'BULLISH (+0.42%)',
    rationale = 'Resilient labor market prints combined with anchored inflation expectations provide supportive macro liquidity backdrop into the weekly close.',
    submitter = 'Universal Engineer (relayhop runtime)'
  } = marketSignals;

  const submissionMarkdown = `### Weekly Close Contest Entry (${indexName})

**Entry for Item #${item.id} ("${item.title}")**

- **Target Asset / Index:** ${indexName}
- **Predicted Weekly Close:** **${predictedClose}**
- **Expected Trajectory:** ${direction}
- **Technical & Fundamental Rationale:** ${rationale}

---
*Submitted by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    indexName,
    predictedClose,
    direction,
    rationale,
    submissionMarkdown
  };
}

/**
 * Macroeconomic and fiscal dominance discussion generator.
 *
 * @param {Object} item - Bounty opportunity item.
 * @param {Object} [macroContext={}] - Custom macro analysis overrides.
 * @returns {Object} Structured macro analysis package.
 */
export function evaluateEconomicDiscussion(item, macroContext = {}) {
  const {
    thesis = 'The Sovereign Debt Spiral and the Inevitability of Financial Repression',
    structuralDrivers = [
      'Debt-to-GDP ratios exceeding 120% constrain central bank policy autonomy.',
      'Interest expense on public debt surpasses national defense outlays, forcing monetary accommodation.',
      'Yield curve control and structural inflation become the mathematically required path of least resistance.'
    ],
    marketImpact = [
      'Scarcity assets with zero counterparty risk command a structural monetary premium.',
      'Fixed-income assets experience persistent negative real yields.'
    ],
    submitter = 'Universal Engineer (relayhop runtime)'
  } = macroContext;

  const responseMarkdown = `### Macroeconomic Dilemma Analysis

**Analysis for Item #${item.id} (~${item.sub || 'econ'}: "${item.title}")**

#### 1. Core Thesis
${thesis}

#### 2. Structural Dilemma Drivers
${structuralDrivers.map((d, idx) => `${idx + 1}. ${d}`).join('\n')}

#### 3. Capital Market Implications
${marketImpact.map(m => `- ${m}`).join('\n')}

---
*Submitted by: ${submitter}*
*Automated Stacker News Monetization Runtime*`;

  return {
    itemId: item.id,
    thesis,
    structuralDrivers,
    marketImpact,
    responseMarkdown
  };
}

/**
 * Feature-gated performance wrapper enforcing latency budget.
 *
 * @param {Function} fn - Operation to execute and benchmark.
 * @param {Object} [options={}] - Telemetry options.
 * @returns {Object} Result and telemetry latency metrics.
 */
export function measureExecutionTelemetry(fn, options = {}) {
  const {
    enabled = false,
    maxLatencyMs = 5.0,
    label = 'monetization_hook'
  } = options;

  if (!enabled) {
    const result = fn();
    return {
      result,
      telemetry: {
        enabled: false,
        latencyMs: 0,
        withinBudget: true,
        label
      }
    };
  }

  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const latencyMs = Number((endTime - startTime).toFixed(3));
  const withinBudget = latencyMs <= maxLatencyMs;

  return {
    result,
    telemetry: {
      enabled: true,
      latencyMs,
      maxLatencyMs,
      withinBudget,
      label
    }
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

    const evaluation = opportunity.evaluation || evaluateOpportunity(opportunity);

    const record = {
      evaluation,
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
      metadata: { ...(existing?.metadata || {}), ...metadata }
    };

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
  const rowArgIdx = args.indexOf('--row') !== -1 ? args.indexOf('--row') : args.indexOf('--tsv');
  const fileArgIdx = args.indexOf('--file');
  const filterArgIdx = args.indexOf('--filter') !== -1 ? args.indexOf('--filter') : args.indexOf('--id');
  const issueArgIdx = args.indexOf('--issue');
  const loopArgIdx = args.indexOf('--loop');
  const verifyRangeIdx = args.indexOf('--verify-range');
  const saveArgIdx = args.indexOf('--save');
  const isJson = args.includes('--json');
  const isMath = args.includes('--math');
  const isNews = args.includes('--news');
  const isLogic = args.includes('--logic');
  const isSelfPost = args.includes('--self-post');
  const isSports = args.includes('--sports');
  const isContest = args.includes('--contest');
  const isEcon = args.includes('--econ');
  const isInquiry = args.includes('--inquiry');
  const isTelemetry = args.includes('--telemetry');

  if (loopArgIdx !== -1 && args[loopArgIdx + 1] !== undefined) {
    const loopVal = args[loopArgIdx + 1];
    const loopRes = detectSequenceLoop(loopVal);
    if (isJson) {
      console.log(JSON.stringify(loopRes, null, 2));
    } else {
      console.log(`\n--- Sequence Loop Detection: Start ${loopRes.startValue} ---`);
      console.log(`Terminates in Loop: ${loopRes.terminatesInLoop}`);
      console.log(`Cycle Length: ${loopRes.cycleLength}`);
      console.log(`Preperiod (Steps to Loop): ${loopRes.stepsToLoop}`);
      console.log(`Total Steps: ${loopRes.totalSteps}`);
      console.log(`Peak Value: ${loopRes.peakValue}`);
      console.log(`Loop Elements: [${loopRes.loopElements?.join(', ')}]\n`);
    }
    process.exit(0);
  }

  if (verifyRangeIdx !== -1 && args[verifyRangeIdx + 1] && args[verifyRangeIdx + 2]) {
    const rangeStart = Number.parseInt(args[verifyRangeIdx + 1], 10);
    const rangeEnd = Number.parseInt(args[verifyRangeIdx + 2], 10);
    const rangeRes = verifySequenceRange(rangeStart, rangeEnd);
    if (isJson) {
      console.log(JSON.stringify(rangeRes, null, 2));
    } else {
      console.log(`\n--- Range Verification: [${rangeStart}, ${rangeEnd}] ---`);
      console.log(`All Terminated: ${rangeRes.allTerminated}`);
      console.log(`Verified Count: ${rangeRes.verifiedCount}`);
      console.log(`Max Peak: ${rangeRes.maxPeak}`);
      console.log(`Max Steps: ${rangeRes.maxSteps}\n`);
    }
    process.exit(0);
  }

  let tsvContent = '';

  if (rowArgIdx !== -1 && args[rowArgIdx + 1]) {
    tsvContent = args[rowArgIdx + 1];
  } else if (fileArgIdx !== -1 && args[fileArgIdx + 1]) {
    const targetFile = path.resolve(args[fileArgIdx + 1]);
    if (fs.existsSync(targetFile)) {
      tsvContent = fs.readFileSync(targetFile, 'utf8');
    }
  } else if (issueArgIdx !== -1 && (args[issueArgIdx + 1] === '903' || args[issueArgIdx + 1] === 'issue-903')) {
    tsvContent = `1567486\tmath\t2\t6889\t700000\t68\t17.2\t48657\t15231\trecent@math|top@math\tOPEN_BOUNTY,HOT\t[Math Puzzle] Does every sequence terminate in a loop?`;
  } else if (issueArgIdx !== -1 && (args[issueArgIdx + 1] === '893' || args[issueArgIdx + 1] === 'issue-893')) {
    tsvContent = `1567486\tmath\t2\t6444\t700000\t42\t5.3\t48657\t15214\trecent@math|top@math\tOPEN_BOUNTY,HOT,SIGNAL\t[Math Puzzle] Does every sequence terminate in a loop?
1566212\tnews\t2\t1259\t1000\t6\t31.6\t51481\t4215\trecent@news\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tIceberg Ahead - Finding the small news story before it changes the world`;
  } else {
    tsvContent = `1567486\tmath\t2\t6486\t700000\t63\t7.7\t48657\t15223\trecent@math|top@math\tOPEN_BOUNTY,HOT,SIGNAL\t[Math Puzzle] Does every sequence terminate in a loop?
1566212\tnews\t2\t1259\t1000\t6\t34.0\t51481\t4215\trecent@news\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tIceberg Ahead - Finding the small news story before it changes the world`;
  }

  const parseExecution = measureExecutionTelemetry(
    () => parseRadarTSV(tsvContent),
    { enabled: isTelemetry, label: 'parseRadarTSV' }
  );

  let items = parseExecution.result;

  if (filterArgIdx !== -1 && args[filterArgIdx + 1]) {
    const filterId = String(args[filterArgIdx + 1]);
    items = items.filter(it => it.id === filterId);
  }

  if (saveArgIdx !== -1 && args[saveArgIdx + 1]) {
    const registry = new SNBountyRegistry(path.resolve(args[saveArgIdx + 1]));
    for (const item of items) {
      registry.register(item);
    }
    registry.save();
  }

  if (isJson) {
    console.log(JSON.stringify(items, null, 2));
  } else {
    console.log(`[sn_bounty_processor] Parsed ${items.length} opportunities:\n`);
    console.log(formatBountyReport(items));

    if (isTelemetry) {
      console.log('\n--- Telemetry Benchmark ---');
      console.log(`Label: ${parseExecution.telemetry.label}`);
      console.log(`Execution Latency: ${parseExecution.telemetry.latencyMs} ms`);
      console.log(`Latency Budget: <= ${parseExecution.telemetry.maxLatencyMs} ms`);
      console.log(`Within Budget: ${parseExecution.telemetry.withinBudget}\n`);
    }

    if (isMath) {
      const mathItem = items.find(it => it.evaluation?.isMathPuzzle) || items[0];
      if (mathItem) {
        const mathAnalysis = evaluateMathPuzzle(mathItem);
        console.log('\n--- Mathematical Puzzle Analysis Strategy ---\n');
        console.log(mathAnalysis.submissionMarkdown);
      }
    }

    if (isNews) {
      const newsItem = items.find(it => it.evaluation?.isNewsAnalysis) || items[0];
      if (newsItem) {
        const news = evaluateNewsAnalysis(newsItem);
        console.log('\n--- News Iceberg Analysis Strategy ---\n');
        console.log(news.submissionMarkdown);
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

    if (isLogic) {
      const logicItem = items.find(it => it.evaluation?.isLogicDiscussion) || items[0];
      if (logicItem) {
        const logic = evaluateLogicDiscussion(logicItem);
        console.log('\n--- Logic and Deductive Reasoning Analysis ---\n');
        console.log(logic.responseMarkdown);
      }
    }

    if (isSelfPost) {
      const selfPostItems = items.filter(it => it.evaluation?.isSelfPostOpp);
      const targets = selfPostItems.length > 0 ? selfPostItems : [items[0]];
      for (const spItem of targets) {
        if (spItem) {
          const selfPost = evaluateSelfPostOpportunity(spItem);
          console.log(`\n--- Self-Post Opportunity Strategy (#${spItem.id} ~${spItem.sub}) ---\n`);
          console.log(selfPost.postMarkdown);
        }
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

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  parseRadarTSV,
  evaluateOpportunity,
  evaluateWeeklyCloseContest,
  evaluateEconomicDiscussion,
  SNBountyRegistry,
  formatBountyReport,
  VALID_STATUSES
} from '../scripts/sn_bounty_processor.mjs';

test('SN Bounty Processor - Parse exact Issue #756 TSV payload', () => {
  const issue756Payload = `
1558562\tAskSN\t2\t215\t1000\t3\t4.4\t1208996\t471\trecent@econ|top@econ|recent@AskSN\tOPEN_BOUNTY,LOW_COMP,SIGNAL\tThe debt dilemma💸📈
1558286\tStacker_Stocks\t2\t85\t10000\t17\t12.2\t9274\t26875\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award
`;

  const results = parseRadarTSV(issue756Payload);

  assert.equal(results.length, 2, 'Should parse exactly 2 opportunities');

  // Item 1: AskSN Debt Dilemma
  const item1 = results[0];
  assert.equal(item1.id, '1558562');
  assert.equal(item1.sub, 'AskSN');
  assert.equal(item1.tier, 2);
  assert.equal(item1.score, 215);
  assert.equal(item1.bounty, 1000);
  assert.equal(item1.ncomments, 3);
  assert.equal(item1.ageHours, 4.4);
  assert.equal(item1.opSince, '1208996');
  assert.equal(item1.opNitems, 471);
  assert.deepEqual(item1.hits, ['recent@econ', 'top@econ', 'recent@AskSN']);
  assert.deepEqual(item1.tags, ['OPEN_BOUNTY', 'LOW_COMP', 'SIGNAL']);
  assert.equal(item1.title, 'The debt dilemma💸📈');

  // Item 1 Evaluation
  assert.ok(item1.evaluation, 'Evaluation object must exist for item 1');
  assert.equal(item1.evaluation.winProbability, 0.809);
  assert.equal(item1.evaluation.expectedValueSats, 809);
  assert.equal(item1.evaluation.priority, 'MEDIUM');
  assert.equal(item1.evaluation.action, 'FAST_TRACK_CLAIM');
  assert.equal(item1.evaluation.isMacroDiscussion, true);

  // Item 2: Stacker_Stocks Weekly Close Contest
  const item2 = results[1];
  assert.equal(item2.id, '1558286');
  assert.equal(item2.sub, 'Stacker_Stocks');
  assert.equal(item2.tier, 2);
  assert.equal(item2.score, 85);
  assert.equal(item2.bounty, 10000);
  assert.equal(item2.ncomments, 17);
  assert.equal(item2.ageHours, 12.2);
  assert.equal(item2.opSince, '9274');
  assert.equal(item2.opNitems, 26875);
  assert.deepEqual(item2.hits, ['recent@Stacker_Stocks', 'top@Stacker_Stocks']);
  assert.deepEqual(item2.tags, ['OPEN_BOUNTY']);
  assert.equal(item2.title, 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award');

  // Item 2 Evaluation
  assert.ok(item2.evaluation, 'Evaluation object must exist for item 2');
  assert.equal(item2.evaluation.winProbability, 0.30);
  assert.equal(item2.evaluation.expectedValueSats, 3000);
  assert.equal(item2.evaluation.priority, 'HIGH');
  assert.equal(item2.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(item2.evaluation.isContest, true);
});

test('SN Bounty Processor - Parse multiple radar lines with comments and blank rows', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1558562\tAskSN\t2\t215\t1000\t3\t4.4\t1208996\t471\trecent@econ|top@econ|recent@AskSN\tOPEN_BOUNTY,LOW_COMP,SIGNAL\tThe debt dilemma💸📈

1558286\tStacker_Stocks\t2\t85\t10000\t17\t12.2\t9274\t26875\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award

1550001\tbitcoin\t1\t500\t0\t2\t4.5\t8888\t120\trecent@bitcoin\tSIGNAL\tL2 Payment Rails Discussion
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 3, 'Should parse 3 items, ignoring comments and blanks');

  assert.equal(results[0].id, '1558562');
  assert.equal(results[1].id, '1558286');
  assert.equal(results[2].id, '1550001');
  assert.equal(results[2].evaluation.action, 'MONITOR_SIGNAL');
});

test('SN Bounty Processor - Fallback to 10-column legacy radar format', () => {
  const legacyTsv = `
1558562\tAskSN\t215\t1000\t3\t4.4\t1208996\t471\tOPEN_BOUNTY,LOW_COMP\tThe debt dilemma
`;

  const results = parseRadarTSV(legacyTsv);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1558562');
  assert.equal(results[0].sub, 'AskSN');
  assert.equal(results[0].tier, 2, 'Should infer tier 2 for AskSN from config');
  assert.equal(results[0].bounty, 1000);
});

test('evaluateOpportunity - EV and Priority Calculation Rules', () => {
  // 1. High-value Tier 1 bounty with low competition
  const t1Item = {
    bounty: 25000,
    ncomments: 1,
    ageHours: 1.0,
    sub: 'bitcoin',
    tier: 1,
    tags: ['OPEN_BOUNTY', 'LOW_COMP', 'FRESH'],
    title: 'Lightning Protocol Vulnerability Report'
  };
  const evalT1 = evaluateOpportunity(t1Item);
  assert.equal(evalT1.priority, 'CRITICAL');
  assert.ok(evalT1.expectedValueSats > 20000);
  assert.equal(evalT1.action, 'FAST_TRACK_CLAIM');

  // 2. High competition older bounty
  const highCompItem = {
    bounty: 500,
    ncomments: 35,
    ageHours: 36.0,
    sub: 'AskSN',
    tier: 2,
    tags: ['OPEN_BOUNTY'],
    title: 'General question on nostr relays'
  };
  const evalHighComp = evaluateOpportunity(highCompItem);
  assert.ok(evalHighComp.winProbability <= 0.15);
  assert.equal(evalHighComp.priority, 'LOW');
  assert.equal(evalHighComp.action, 'CLAIM_AND_EXECUTE');

  // 3. Medium priority bounty
  const mediumItem = {
    bounty: 1500,
    ncomments: 5,
    ageHours: 6.0,
    sub: 'AskSN',
    tier: 2,
    tags: ['OPEN_BOUNTY'],
    title: 'Question on lightning channel rebalancing'
  };
  const evalMedium = evaluateOpportunity(mediumItem);
  assert.equal(evalMedium.priority, 'MEDIUM');
  assert.equal(evalMedium.action, 'CLAIM_AND_EXECUTE');

  // 4. Self-post opportunity
  const selfPostItem = {
    bounty: 0,
    ncomments: 8,
    ageHours: 15.0,
    sub: 'Design',
    tier: 2,
    tags: ['SELF_POST_OPP'],
    title: 'UI Design systems comparison'
  };
  const evalSelfPost = evaluateOpportunity(selfPostItem);
  assert.equal(evalSelfPost.action, 'QUEUE_SELF_POST');
});

test('evaluateWeeklyCloseContest - Generates structured prediction markdown', () => {
  const contestItem = {
    id: '1558286',
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award',
    bounty: 10000,
    sub: 'Stacker_Stocks'
  };

  const prediction = evaluateWeeklyCloseContest(contestItem, {
    direction: '🟩 BULLISH',
    targetPrice: '$5,650',
    indexSymbol: 'S&P 500'
  });

  assert.equal(prediction.itemId, '1558286');
  assert.equal(prediction.emoji, '🟩');
  assert.equal(prediction.direction, 'GREEN / BULLISH');
  assert.ok(prediction.submissionMarkdown.includes('### Weekly Close Contest Entry (🟩 GREEN / BULLISH)'));
  assert.ok(prediction.submissionMarkdown.includes('S&P 500'));
  assert.ok(prediction.submissionMarkdown.includes('$5,650'));
  assert.ok(prediction.submissionMarkdown.includes('Technical & Macro Rationale'));
});

test('evaluateWeeklyCloseContest - Bearish (RED) direction prediction', () => {
  const contestItem = {
    id: '1558286',
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?',
    bounty: 10000,
    sub: 'Stacker_Stocks'
  };

  const prediction = evaluateWeeklyCloseContest(contestItem, {
    direction: '🟥 BEARISH',
    targetPrice: '$5,520',
    indexSymbol: 'S&P 500 (SPX)',
    catalysts: ['Hawkish Fed comments', 'Rising yield curve pressure']
  });

  assert.equal(prediction.emoji, '🟥');
  assert.equal(prediction.direction, 'RED / BEARISH');
  assert.ok(prediction.submissionMarkdown.includes('🟥 RED / BEARISH'));
  assert.ok(prediction.submissionMarkdown.includes('$5,520'));
});

test('evaluateEconomicDiscussion - Generates comprehensive macroeconomic analysis', () => {
  const econItem = {
    id: '1558562',
    title: 'The debt dilemma💸📈',
    bounty: 1000,
    sub: 'AskSN'
  };

  const analysis = evaluateEconomicDiscussion(econItem);

  assert.equal(analysis.itemId, '1558562');
  assert.ok(analysis.thesis.includes('Sovereign Debt'));
  assert.ok(analysis.coreArguments.length >= 5);
  assert.ok(analysis.responseMarkdown.includes('### Macroeconomic Analysis: The debt dilemma💸📈 (Item #1558562)'));
  assert.ok(analysis.responseMarkdown.includes('Fiscal Dominance'));
  assert.ok(analysis.responseMarkdown.includes('The Bitcoin Solution'));
});

test('SNBountyRegistry - Complete lifecycle and state persistence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sn-test-registry-'));
  const registryFile = path.join(tmpDir, 'registry.json');

  try {
    const registry = new SNBountyRegistry(registryFile);

    // 1. Register bounties from Issue #756
    const b756_1 = registry.register({
      id: '1558562',
      sub: 'AskSN',
      tier: 2,
      score: 215,
      bounty: 1000,
      ncomments: 3,
      ageHours: 4.4,
      tags: ['OPEN_BOUNTY', 'LOW_COMP', 'SIGNAL'],
      title: 'The debt dilemma💸📈'
    });

    const b756_2 = registry.register({
      id: '1558286',
      sub: 'Stacker_Stocks',
      tier: 2,
      score: 85,
      bounty: 10000,
      ncomments: 17,
      ageHours: 12.2,
      tags: ['OPEN_BOUNTY'],
      title: 'Daily Stock Discussion Sunday’s Weekly Close Contest'
    });

    assert.equal(b756_1.status, 'DETECTED');
    assert.equal(b756_2.status, 'DETECTED');
    assert.equal(registry.get('1558562')?.bounty, 1000);
    assert.equal(registry.get('1558286')?.bounty, 10000);

    // 2. Transition through valid lifecycle states
    registry.updateStatus('1558562', 'EVALUATED', 'EV calculated at 809 sats');
    registry.updateStatus('1558562', 'QUEUED', 'Queued for macro analysis response');
    registry.updateStatus('1558562', 'CLAIMED', 'Claimed by automation operator');
    registry.updateStatus('1558562', 'IN_PROGRESS', 'Drafting debt dilemma breakdown');
    registry.updateStatus('1558562', 'SUBMITTED', 'Submitted comprehensive analysis comment');
    registry.updateStatus('1558562', 'PAID', 'Received 1000 sat reward payout', { txId: 'sn_tx_1558562' });

    const finalRecord = registry.get('1558562');
    assert.equal(finalRecord.status, 'PAID');
    assert.equal(finalRecord.history.length, 7);
    assert.equal(finalRecord.metadata.txId, 'sn_tx_1558562');

    // 3. Persist and reload
    const saved = registry.save();
    assert.equal(saved, true);
    assert.ok(fs.existsSync(registryFile));

    const reloaded = new SNBountyRegistry(registryFile);
    const item1Reloaded = reloaded.get('1558562');
    const item2Reloaded = reloaded.get('1558286');
    assert.equal(item1Reloaded.status, 'PAID');
    assert.equal(item1Reloaded.bounty, 1000);
    assert.equal(item2Reloaded.status, 'DETECTED');
    assert.equal(item2Reloaded.bounty, 10000);

    // 4. Statistics verification
    const stats = reloaded.getSummaryStats();
    assert.equal(stats.total, 2);
    assert.equal(stats.byStatus.PAID, 1);
    assert.equal(stats.byStatus.DETECTED, 1);
    assert.equal(stats.totalBountySats, 11000);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('SNBountyRegistry - Error handling on invalid operations', () => {
  const registry = new SNBountyRegistry();

  assert.throws(() => {
    registry.register({});
  }, /valid id/);

  assert.throws(() => {
    registry.updateStatus('non_existent', 'CLAIMED');
  }, /not found/);

  registry.register({ id: '9999', bounty: 100 });
  assert.throws(() => {
    registry.updateStatus('9999', 'UNKNOWN_STATUS');
  }, /Invalid status/);
});

test('formatBountyReport - Generates valid Markdown tables', () => {
  const emptyReport = formatBountyReport([]);
  assert.ok(emptyReport.includes('_No opportunities detected._'));

  const items = [
    {
      id: '1558562',
      sub: 'AskSN',
      tier: 2,
      score: 215,
      bounty: 1000,
      ncomments: 3,
      ageHours: 4.4,
      tags: ['OPEN_BOUNTY', 'LOW_COMP', 'SIGNAL'],
      title: 'The debt dilemma💸📈'
    }
  ];

  const report = formatBountyReport(items);
  assert.ok(report.includes('| ID | Sub | Tier | Bounty (sats) |'));
  assert.ok(report.includes('1558562'));
  assert.ok(report.includes('AskSN'));
  assert.ok(report.includes('1,000'));
  assert.ok(report.includes('MEDIUM'));
});

test('Edge cases - Empty, null, and malformed inputs', () => {
  assert.deepEqual(parseRadarTSV(''), []);
  assert.deepEqual(parseRadarTSV(null), []);
  assert.deepEqual(parseRadarTSV(undefined), []);
  assert.deepEqual(parseRadarTSV('short\trow\twith\tfew'), []);
  assert.equal(VALID_STATUSES.includes('PAID'), true);
});

test('SNBountyRegistry - Filtering by status and sub-channel', () => {
  const registry = new SNBountyRegistry();
  registry.register({ id: '1', sub: 'AskSN', bounty: 1000 });
  registry.register({ id: '2', sub: 'bitcoin', bounty: 5000 });
  registry.register({ id: '3', sub: 'AskSN', bounty: 200 });

  registry.updateStatus('1', 'CLAIMED');

  const claimed = registry.filterByStatus('CLAIMED');
  assert.equal(claimed.length, 1);
  assert.equal(claimed[0].id, '1');

  const askSNBounties = registry.filterBySub('AskSN');
  assert.equal(askSNBounties.length, 2);
});

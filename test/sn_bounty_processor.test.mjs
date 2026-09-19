import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  parseRadarTSV,
  evaluateOpportunity,
  evaluateWeeklyCloseContest,
  SNBountyRegistry,
  formatBountyReport,
  VALID_STATUSES
} from '../scripts/sn_bounty_processor.mjs';

test('SN Bounty Processor - Parse exact Issue #614 TSV payload', () => {
  const issue614Payload = `
1553226\tStacker_Stocks\t2\t35\t10000\t20\t17.7\t9274\t26623\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!
`;

  const results = parseRadarTSV(issue614Payload);

  assert.equal(results.length, 1, 'Should parse exactly 1 opportunity');

  const item = results[0];
  assert.equal(item.id, '1553226');
  assert.equal(item.sub, 'Stacker_Stocks');
  assert.equal(item.tier, 2);
  assert.equal(item.score, 35);
  assert.equal(item.bounty, 10000);
  assert.equal(item.ncomments, 20);
  assert.equal(item.ageHours, 17.7);
  assert.equal(item.opSince, '9274');
  assert.equal(item.opNitems, 26623);
  assert.deepEqual(item.hits, ['recent@Stacker_Stocks', 'top@Stacker_Stocks']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY']);
  assert.equal(item.title, 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!');

  // Evaluation assertions
  assert.ok(item.evaluation, 'Evaluation object must exist');
  assert.equal(item.evaluation.winProbability, 0.3);
  assert.equal(item.evaluation.expectedValueSats, 3000); // 10000 * 0.3 * 1.0 (Tier 2)
  assert.equal(item.evaluation.priority, 'HIGH');
  assert.equal(item.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(item.evaluation.isContest, true);
});

test('SN Bounty Processor - Parse Issue #583 TSV payload', () => {
  const issue583Payload = `
1553226\tStacker_Stocks\t2\t20\t10000\t10\t9.3\t9274\t26610\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!
`;

  const results = parseRadarTSV(issue583Payload);
  assert.equal(results.length, 1);
  const item = results[0];
  assert.equal(item.evaluation.winProbability, 0.5);
  assert.equal(item.evaluation.expectedValueSats, 5000);
  assert.equal(item.evaluation.priority, 'CRITICAL');
});

test('SN Bounty Processor - Parse multiple radar lines with comments and blank rows', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1553226\tStacker_Stocks\t2\t35\t10000\t20\t17.7\t9274\t26623\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!

1519033\tStacker_Sports\t3\t2100\t2100\t1\t1.2\t11223\t450\trecent@Stacker_Sports\tOPEN_BOUNTY,LOW_COMP,FRESH\tSports Prediction Bounty

1550001\tbitcoin\t1\t500\t0\t2\t4.5\t8888\t120\trecent@bitcoin\tSIGNAL\tL2 Payment Rails Discussion
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 3, 'Should parse 3 items, ignoring comments and blanks');

  // Verify first item
  assert.equal(results[0].id, '1553226');
  assert.equal(results[0].sub, 'Stacker_Stocks');

  // Verify second item (Fresh & Low Comp)
  const freshItem = results[1];
  assert.equal(freshItem.id, '1519033');
  assert.equal(freshItem.sub, 'Stacker_Sports');
  assert.equal(freshItem.evaluation.action, 'FAST_TRACK_CLAIM');
  assert.ok(freshItem.evaluation.winProbability > 0.85, 'Fresh item should have boosted win probability');

  // Verify third item (Signal)
  const signalItem = results[2];
  assert.equal(signalItem.id, '1550001');
  assert.equal(signalItem.evaluation.action, 'MONITOR_SIGNAL');
});

test('SN Bounty Processor - Fallback to 10-column legacy radar format', () => {
  const legacyTsv = `
1553226\tStacker_Stocks\t35\t10000\t20\t17.7\t9274\t26623\tOPEN_BOUNTY\tDaily Stock Discussion Weekly Close
`;

  const results = parseRadarTSV(legacyTsv);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1553226');
  assert.equal(results[0].sub, 'Stacker_Stocks');
  assert.equal(results[0].tier, 2, 'Should infer tier 2 for Stacker_Stocks from config');
  assert.equal(results[0].bounty, 10000);
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

test('evaluateWeeklyCloseContest - Generates structured prediction markdown (Bullish)', () => {
  const contestItem = {
    id: '1553226',
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!',
    bounty: 10000,
    sub: 'Stacker_Stocks'
  };

  const prediction = evaluateWeeklyCloseContest(contestItem, {
    direction: '🟩 BULLISH',
    targetPrice: '$5,650',
    indexSymbol: 'S&P 500'
  });

  assert.equal(prediction.itemId, '1553226');
  assert.equal(prediction.emoji, '🟩');
  assert.equal(prediction.direction, 'GREEN / BULLISH');
  assert.ok(prediction.submissionMarkdown.includes('### Weekly Close Contest Entry (🟩 GREEN / BULLISH)'));
  assert.ok(prediction.submissionMarkdown.includes('S&P 500'));
  assert.ok(prediction.submissionMarkdown.includes('$5,650'));
  assert.ok(prediction.submissionMarkdown.includes('Technical & Macro Rationale'));
});

test('evaluateWeeklyCloseContest - Generates structured prediction markdown (Bearish)', () => {
  const contestItem = {
    id: '1553226',
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

test('SNBountyRegistry - Complete lifecycle and state persistence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sn-test-registry-'));
  const registryFile = path.join(tmpDir, 'registry.json');

  try {
    const registry = new SNBountyRegistry(registryFile);

    // 1. Register bounty
    const b614 = registry.register({
      id: '1553226',
      sub: 'Stacker_Stocks',
      tier: 2,
      score: 35,
      bounty: 10000,
      ncomments: 20,
      ageHours: 17.7,
      tags: ['OPEN_BOUNTY'],
      title: 'Daily Stock Discussion Sunday’s Weekly Close Contest'
    });

    assert.equal(b614.status, 'DETECTED');
    assert.equal(b614.history.length, 1);
    assert.equal(registry.get('1553226')?.bounty, 10000);

    // 2. Transition through valid lifecycle states
    registry.updateStatus('1553226', 'EVALUATED', 'EV calculated at 3000 sats');
    registry.updateStatus('1553226', 'QUEUED', 'Queued for contest submission');
    registry.updateStatus('1553226', 'CLAIMED', 'Claimed by automation operator');
    registry.updateStatus('1553226', 'IN_PROGRESS', 'Drafting weekly close technical thesis');
    registry.updateStatus('1553226', 'SUBMITTED', 'Submitted entry with 🟩 Bullish direction');
    registry.updateStatus('1553226', 'PAID', 'Received 10000 sat reward payout', { txId: 'sn_tx_1553226' });

    const finalRecord = registry.get('1553226');
    assert.equal(finalRecord.status, 'PAID');
    assert.equal(finalRecord.history.length, 7);
    assert.equal(finalRecord.metadata.txId, 'sn_tx_1553226');

    // 3. Persist and reload
    const saved = registry.save();
    assert.equal(saved, true);
    assert.ok(fs.existsSync(registryFile));

    const reloaded = new SNBountyRegistry(registryFile);
    const itemReloaded = reloaded.get('1553226');
    assert.equal(itemReloaded.status, 'PAID');
    assert.equal(itemReloaded.bounty, 10000);

    // 4. Statistics verification
    const stats = reloaded.getSummaryStats();
    assert.equal(stats.total, 1);
    assert.equal(stats.byStatus.PAID, 1);
    assert.equal(stats.totalBountySats, 10000);
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
      id: '1553226',
      sub: 'Stacker_Stocks',
      tier: 2,
      score: 35,
      bounty: 10000,
      ncomments: 20,
      ageHours: 17.7,
      tags: ['OPEN_BOUNTY'],
      title: 'Daily Stock Discussion Sunday’s Weekly Close Contest'
    }
  ];

  const report = formatBountyReport(items);
  assert.ok(report.includes('| ID | Sub | Tier | Bounty (sats) |'));
  assert.ok(report.includes('1553226'));
  assert.ok(report.includes('Stacker_Stocks'));
  assert.ok(report.includes('10,000'));
  assert.ok(report.includes('HIGH'));
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
  registry.register({ id: '1', sub: 'Stacker_Stocks', bounty: 1000 });
  registry.register({ id: '2', sub: 'bitcoin', bounty: 5000 });
  registry.register({ id: '3', sub: 'Stacker_Stocks', bounty: 200 });

  registry.updateStatus('1', 'CLAIMED');

  const claimed = registry.filterByStatus('CLAIMED');
  assert.equal(claimed.length, 1);
  assert.equal(claimed[0].id, '1');

  const stockBounties = registry.filterBySub('Stacker_Stocks');
  assert.equal(stockBounties.length, 2);
});

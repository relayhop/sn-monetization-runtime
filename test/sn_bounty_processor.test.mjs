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

test('SN Bounty Processor - Parse exact Issue #757 TSV payload', () => {
  const issue757Payload = `
1558562\tAskSN\t2\t215\t1000\t6\t10.4\t1208996\t471\trecent@econ|top@econ|recent@AskSN\tOPEN_BOUNTY,SIGNAL,SELF_POST_OPP\tThe debt dilemma💸📈
1558286\tStacker_Stocks\t2\t87\t10000\t20\t18.1\t9274\t26877\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award
`;

  const results = parseRadarTSV(issue757Payload);

  assert.equal(results.length, 2, 'Should parse exactly 2 opportunities');

  const item1 = results[0];
  assert.equal(item1.id, '1558562');
  assert.equal(item1.sub, 'AskSN');
  assert.equal(item1.tier, 2);
  assert.equal(item1.score, 215);
  assert.equal(item1.bounty, 1000);
  assert.equal(item1.ncomments, 6);
  assert.equal(item1.ageHours, 10.4);
  assert.equal(item1.opSince, '1208996');
  assert.equal(item1.opNitems, 471);
  assert.deepEqual(item1.hits, ['recent@econ', 'top@econ', 'recent@AskSN']);
  assert.deepEqual(item1.tags, ['OPEN_BOUNTY', 'SIGNAL', 'SELF_POST_OPP']);
  assert.equal(item1.title, 'The debt dilemma💸📈');

  assert.ok(item1.evaluation, 'Evaluation object must exist for item 1');
  assert.equal(item1.evaluation.winProbability, 0.525);
  assert.equal(item1.evaluation.expectedValueSats, 525);
  assert.equal(item1.evaluation.priority, 'MEDIUM');
  assert.equal(item1.evaluation.action, 'CLAIM_AND_EXECUTE');
  assert.equal(item1.evaluation.isMacroDiscussion, true);
  assert.equal(item1.evaluation.isContest, false);

  const item2 = results[1];
  assert.equal(item2.id, '1558286');
  assert.equal(item2.sub, 'Stacker_Stocks');
  assert.equal(item2.tier, 2);
  assert.equal(item2.score, 87);
  assert.equal(item2.bounty, 10000);
  assert.equal(item2.ncomments, 20);
  assert.equal(item2.ageHours, 18.1);
  assert.equal(item2.opSince, '9274');
  assert.equal(item2.opNitems, 26877);
  assert.deepEqual(item2.hits, ['recent@Stacker_Stocks', 'top@Stacker_Stocks']);
  assert.deepEqual(item2.tags, ['OPEN_BOUNTY']);
  assert.equal(item2.title, 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award');

  assert.ok(item2.evaluation, 'Evaluation object must exist for item 2');
  assert.equal(item2.evaluation.winProbability, 0.30);
  assert.equal(item2.evaluation.expectedValueSats, 3000);
  assert.equal(item2.evaluation.priority, 'HIGH');
  assert.equal(item2.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(item2.evaluation.isContest, true);
  assert.equal(item2.evaluation.isMacroDiscussion, false);
});

test('SN Bounty Processor - Parse multiple radar lines with comments and blank rows', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1558562\tAskSN\t2\t215\t1000\t6\t10.4\t1208996\t471\trecent@econ|top@econ|recent@AskSN\tOPEN_BOUNTY,SIGNAL,SELF_POST_OPP\tThe debt dilemma💸📈

1558286\tStacker_Stocks\t2\t87\t10000\t20\t18.1\t9274\t26877\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award

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
1558562\tAskSN\t215\t1000\t6\t10.4\t1208996\t471\tOPEN_BOUNTY,SIGNAL\tThe debt dilemma
`;

  const results = parseRadarTSV(legacyTsv);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1558562');
  assert.equal(results[0].sub, 'AskSN');
  assert.equal(results[0].tier, 2, 'Should infer tier 2 for AskSN from config');
  assert.equal(results[0].bounty, 1000);
});

test('evaluateOpportunity - EV and Priority Calculation Rules', () => {
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

  const emptyItem = evaluateOpportunity({});
  assert.equal(emptyItem.expectedValueSats, 0);
  assert.equal(emptyItem.priority, 'LOW');
});

test('evaluateWeeklyCloseContest - Generates structured submission', () => {
  const contestItem = {
    id: '1558286',
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award',
    bounty: 10000,
    sub: 'Stacker_Stocks'
  };

  const output = evaluateWeeklyCloseContest(contestItem, {
    direction: '🟩 BULLISH',
    targetPrice: '$5,650',
    indexSymbol: 'S&P 500 (SPX)'
  });

  assert.equal(output.itemId, '1558286');
  assert.equal(output.emoji, '🟩');
  assert.equal(output.direction, 'GREEN / BULLISH');
  assert.equal(output.indexSymbol, 'S&P 500 (SPX)');
  assert.equal(output.targetPrice, '$5,650');
  assert.ok(output.catalysts.length >= 3);
  assert.ok(output.submissionMarkdown.includes('### Weekly Close Contest Entry'));
  assert.ok(output.submissionMarkdown.includes('1558286'));
});

test('evaluateEconomicDiscussion - Generates structured analysis', () => {
  const econItem = {
    id: '1558562',
    title: 'The debt dilemma💸📈',
    bounty: 1000,
    sub: 'AskSN'
  };

  const output = evaluateEconomicDiscussion(econItem);

  assert.equal(output.itemId, '1558562');
  assert.ok(output.thesis.includes('Sovereign Debt'));
  assert.ok(output.coreArguments.length >= 4);
  assert.ok(output.responseMarkdown.includes('Macroeconomic Analysis'));
  assert.ok(output.responseMarkdown.includes('Bitcoin'));
});

test('SNBountyRegistry - Lifecycle state transitions and persistence', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sn-registry-test-'));
  const storagePath = path.join(tempDir, 'registry.json');

  const registry = new SNBountyRegistry(storagePath);

  const item = {
    id: '1558286',
    sub: 'Stacker_Stocks',
    tier: 2,
    score: 87,
    bounty: 10000,
    ncomments: 20,
    ageHours: 18.1,
    hits: ['recent@Stacker_Stocks'],
    tags: ['OPEN_BOUNTY'],
    title: 'Sunday Weekly Close Contest'
  };

  const registered = registry.register(item, { source: 'Issue #757' });
  assert.equal(registered.status, 'DETECTED');
  assert.equal(registered.metadata.source, 'Issue #757');

  registry.updateStatus('1558286', 'EVALUATED', 'Completed win probability scoring');
  assert.equal(registry.get('1558286').status, 'EVALUATED');
  assert.equal(registry.get('1558286').history.length, 2);

  registry.updateStatus('1558286', 'IN_PROGRESS', 'Drafting submission strategy');
  registry.updateStatus('1558286', 'SUBMITTED', 'Posted contest response', { commentId: '998811' });

  const current = registry.get('1558286');
  assert.equal(current.status, 'SUBMITTED');
  assert.equal(current.metadata.commentId, '998811');
  assert.equal(current.history.length, 4);

  const stats = registry.getSummaryStats();
  assert.equal(stats.total, 1);
  assert.equal(stats.byStatus.SUBMITTED, 1);
  assert.equal(stats.totalBountySats, 10000);

  const saved = registry.save();
  assert.equal(saved, true);
  assert.ok(fs.existsSync(storagePath));

  const loadedRegistry = new SNBountyRegistry(storagePath);
  const loadedItem = loadedRegistry.get('1558286');
  assert.ok(loadedItem);
  assert.equal(loadedItem.status, 'SUBMITTED');
  assert.equal(loadedItem.metadata.commentId, '998811');

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('SNBountyRegistry - Error handling for invalid IDs and status transitions', () => {
  const registry = new SNBountyRegistry();

  assert.throws(() => {
    registry.register({});
  }, /valid id/);

  assert.throws(() => {
    registry.updateStatus('nonexistent', 'CLAIMED');
  }, /not found in registry/);

  registry.register({ id: '999', bounty: 100 });
  assert.throws(() => {
    registry.updateStatus('999', 'INVALID_STATUS');
  }, /Invalid status/);
});

test('formatBountyReport - Render Markdown summary table', () => {
  const emptyReport = formatBountyReport([]);
  assert.equal(emptyReport, '_No opportunities detected._\n');

  const items = [
    {
      id: '1558562',
      sub: 'AskSN',
      tier: 2,
      bounty: 1000,
      ncomments: 6,
      title: 'The debt dilemma'
    }
  ];

  const tableReport = formatBountyReport(items);
  assert.ok(tableReport.includes('| ID | Sub | Tier | Bounty (sats) |'));
  assert.ok(tableReport.includes('| 1558562 | AskSN | 2 | 1,000 | 6 |'));
});

test('SN Constants - Validate status definitions', () => {
  assert.ok(VALID_STATUSES.includes('DETECTED'));
  assert.ok(VALID_STATUSES.includes('EVALUATED'));
  assert.ok(VALID_STATUSES.includes('QUEUED'));
  assert.ok(VALID_STATUSES.includes('CLAIMED'));
  assert.ok(VALID_STATUSES.includes('IN_PROGRESS'));
  assert.ok(VALID_STATUSES.includes('SUBMITTED'));
  assert.ok(VALID_STATUSES.includes('PAID'));
  assert.ok(VALID_STATUSES.includes('EXPIRED'));
  assert.ok(VALID_STATUSES.includes('REJECTED'));
});

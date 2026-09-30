import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  parseRadarTSV,
  evaluateOpportunity,
  evaluateSportsPickEm,
  evaluateWeeklyCloseContest,
  evaluateEconomicDiscussion,
  SNBountyRegistry,
  formatBountyReport,
  VALID_STATUSES
} from '../scripts/sn_bounty_processor.mjs';

test('SN Bounty Processor - Parse Issue #760 radar TSV payload', () => {
  const issue760Tsv = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1558884\tStacker_Sports\t3\t714\t2000\t8\t3.8\t54354\t6617\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,SIGNAL,SELF_POST_OPP\tAFL Finals Week 2 Pick Em
1558562\tAskSN\t2\t215\t1000\t7\t18.6\t1208996\t471\trecent@econ|top@econ|recent@AskSN\tOPEN_BOUNTY,SELF_POST_OPP\tThe debt dilemma
1558286\tStacker_Stocks\t2\t87\t10000\t26\t26.3\t9274\t26890\trecent@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 20k sat award
`;

  const items = parseRadarTSV(issue760Tsv);
  assert.equal(items.length, 3);

  const item1 = items[0];
  assert.equal(item1.id, '1558884');
  assert.equal(item1.sub, 'Stacker_Sports');
  assert.equal(item1.tier, 3);
  assert.equal(item1.score, 714);
  assert.equal(item1.bounty, 2000);
  assert.equal(item1.ncomments, 8);
  assert.equal(item1.ageHours, 3.8);
  assert.equal(item1.opSince, '54354');
  assert.equal(item1.opNitems, 6617);
  assert.deepEqual(item1.hits, ['recent@Stacker_Sports', 'top@Stacker_Sports']);
  assert.deepEqual(item1.tags, ['OPEN_BOUNTY', 'SIGNAL', 'SELF_POST_OPP']);
  assert.equal(item1.title, 'AFL Finals Week 2 Pick Em');
  assert.equal(item1.evaluation.winProbability, 0.525);
  assert.equal(item1.evaluation.expectedValueSats, 893);
  assert.equal(item1.evaluation.priority, 'MEDIUM');
  assert.equal(item1.evaluation.action, 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM');
  assert.equal(item1.evaluation.isSportsPickEm, true);

  const item2 = items[1];
  assert.equal(item2.id, '1558562');
  assert.equal(item2.sub, 'AskSN');
  assert.equal(item2.tier, 2);
  assert.equal(item2.score, 215);
  assert.equal(item2.bounty, 1000);
  assert.equal(item2.ncomments, 7);
  assert.equal(item2.ageHours, 18.6);
  assert.equal(item2.opSince, '1208996');
  assert.equal(item2.opNitems, 471);
  assert.deepEqual(item2.hits, ['recent@econ', 'top@econ', 'recent@AskSN']);
  assert.deepEqual(item2.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(item2.title, 'The debt dilemma');
  assert.equal(item2.evaluation.winProbability, 0.50);
  assert.equal(item2.evaluation.expectedValueSats, 500);
  assert.equal(item2.evaluation.priority, 'MEDIUM');
  assert.equal(item2.evaluation.action, 'CLAIM_AND_EXECUTE');
  assert.equal(item2.evaluation.isMacroDiscussion, true);

  const item3 = items[2];
  assert.equal(item3.id, '1558286');
  assert.equal(item3.sub, 'Stacker_Stocks');
  assert.equal(item3.tier, 2);
  assert.equal(item3.score, 87);
  assert.equal(item3.bounty, 10000);
  assert.equal(item3.ncomments, 26);
  assert.equal(item3.ageHours, 26.3);
  assert.equal(item3.opSince, '9274');
  assert.equal(item3.opNitems, 26890);
  assert.deepEqual(item3.hits, ['recent@Stacker_Stocks']);
  assert.deepEqual(item3.tags, ['OPEN_BOUNTY']);
  assert.equal(item3.evaluation.winProbability, 0.105);
  assert.equal(item3.evaluation.expectedValueSats, 1050);
  assert.equal(item3.evaluation.priority, 'MEDIUM');
  assert.equal(item3.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(item3.evaluation.isContest, true);
});

test('SN Bounty Processor - Parse multiple radar lines with comments and blank rows', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1558884\tStacker_Sports\t3\t714\t2000\t8\t3.8\t54354\t6617\trecent@Stacker_Sports\tOPEN_BOUNTY\tAFL Finals Week 2 Pick Em

1558562\tAskSN\t2\t215\t1000\t7\t18.6\t1208996\t471\trecent@AskSN\tOPEN_BOUNTY\tThe debt dilemma

1550001\tbitcoin\t1\t500\t0\t2\t4.5\t8888\t120\trecent@bitcoin\tSIGNAL\tL2 Payment Rails Discussion
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 3);
  assert.equal(results[0].id, '1558884');
  assert.equal(results[1].id, '1558562');
  assert.equal(results[2].id, '1550001');
  assert.equal(results[2].evaluation.action, 'MONITOR_SIGNAL');
});

test('SN Bounty Processor - Fallback to 10-column legacy radar format', () => {
  const legacyTsv = `
1558562\tAskSN\t215\t1000\t7\t18.6\t1208996\t471\tOPEN_BOUNTY,SIGNAL\tThe debt dilemma
`;

  const results = parseRadarTSV(legacyTsv);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1558562');
  assert.equal(results[0].sub, 'AskSN');
  assert.equal(results[0].tier, 2);
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

test('evaluateSportsPickEm - Generates structured submission', () => {
  const sportsItem = {
    id: '1558884',
    title: 'AFL Finals Week 2 Pick Em',
    bounty: 2000,
    sub: 'Stacker_Sports'
  };

  const output = evaluateSportsPickEm(sportsItem);

  assert.equal(output.itemId, '1558884');
  assert.equal(output.league, 'AFL (Australian Football League)');
  assert.ok(output.fixtures.length >= 2);
  assert.ok(output.submissionMarkdown.includes('Pick\'Em Submission'));
  assert.ok(output.submissionMarkdown.includes('Port Adelaide Power vs Hawthorn Hawks'));
  assert.ok(output.submissionMarkdown.includes('GWS Giants vs Brisbane Lions'));
});

test('evaluateWeeklyCloseContest - Generates structured submission', () => {
  const contestItem = {
    id: '1558286',
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 20k sat award',
    bounty: 10000,
    sub: 'Stacker_Stocks'
  };

  const output = evaluateWeeklyCloseContest(contestItem, {
    direction: 'GREEN / BULLISH',
    targetPrice: '$5,650',
    indexSymbol: 'S&P 500 (SPX)'
  });

  assert.equal(output.itemId, '1558286');
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
    title: 'The debt dilemma',
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
    id: '1558884',
    sub: 'Stacker_Sports',
    tier: 3,
    score: 714,
    bounty: 2000,
    ncomments: 8,
    ageHours: 3.8,
    hits: ['recent@Stacker_Sports'],
    tags: ['OPEN_BOUNTY'],
    title: 'AFL Finals Week 2 Pick Em'
  };

  const registered = registry.register(item, { source: 'Issue #760' });
  assert.equal(registered.status, 'DETECTED');
  assert.equal(registered.metadata.source, 'Issue #760');

  registry.updateStatus('1558884', 'EVALUATED', 'Completed scoring');
  assert.equal(registry.get('1558884').status, 'EVALUATED');
  assert.equal(registry.get('1558884').history.length, 2);

  registry.updateStatus('1558884', 'IN_PROGRESS', 'Drafting picks');
  registry.updateStatus('1558884', 'SUBMITTED', 'Posted response', { commentId: '998811' });

  const current = registry.get('1558884');
  assert.equal(current.status, 'SUBMITTED');
  assert.equal(current.metadata.commentId, '998811');
  assert.equal(current.history.length, 4);

  const stats = registry.getSummaryStats();
  assert.equal(stats.total, 1);
  assert.equal(stats.byStatus.SUBMITTED, 1);
  assert.equal(stats.totalBountySats, 2000);

  const saved = registry.save();
  assert.equal(saved, true);
  assert.ok(fs.existsSync(storagePath));

  const loadedRegistry = new SNBountyRegistry(storagePath);
  const loadedItem = loadedRegistry.get('1558884');
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
      id: '1558884',
      sub: 'Stacker_Sports',
      tier: 3,
      bounty: 2000,
      ncomments: 8,
      title: 'AFL Finals Week 2 Pick Em'
    }
  ];

  const tableReport = formatBountyReport(items);
  assert.ok(tableReport.includes('| ID | Sub | Tier | Bounty (sats) |'));
  assert.ok(tableReport.includes('| 1558884 | Stacker_Sports | 3 | 2,000 | 8 |'));
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

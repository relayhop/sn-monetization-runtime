import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  parseRadarTSV,
  evaluateOpportunity,
  evaluateInquiryDiscussion,
  evaluateEconomicDiscussion,
  evaluateSportsPickEm,
  evaluateWeeklyCloseContest,
  SNBountyRegistry,
  formatBountyReport,
  VALID_STATUSES
} from '../scripts/sn_bounty_processor.mjs';

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #787)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1559635\tAskSN\t2\t227\t1000\t2\t30.4\t1208996\t473\trecent@AskSN\tOPEN_BOUNTY,LOW_COMP\t🔥 THE QUESTION THAT ALMOST NO ONE DARES TO ANSWER
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const item1 = results[0];
  assert.equal(item1.id, '1559635');
  assert.equal(item1.sub, 'AskSN');
  assert.equal(item1.tier, 2);
  assert.equal(item1.score, 227);
  assert.equal(item1.bounty, 1000);
  assert.equal(item1.ncomments, 2);
  assert.equal(item1.ageHours, 30.4);
  assert.equal(item1.opSince, '1208996');
  assert.equal(item1.opNitems, 473);
  assert.deepEqual(item1.hits, ['recent@AskSN']);
  assert.deepEqual(item1.tags, ['OPEN_BOUNTY', 'LOW_COMP']);
  assert.equal(item1.title, '🔥 THE QUESTION THAT ALMOST NO ONE DARES TO ANSWER');
  assert.equal(item1.evaluation.priority, 'MEDIUM');
  assert.equal(item1.evaluation.action, 'FAST_TRACK_CLAIM');
  assert.equal(item1.evaluation.expectedValueSats, 654);
  assert.equal(item1.evaluation.winProbability, 0.654);
  assert.equal(item1.evaluation.isInquiryDiscussion, true);
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

test('SN Bounty Processor - Empty and invalid TSV handling', () => {
  assert.deepEqual(parseRadarTSV(''), []);
  assert.deepEqual(parseRadarTSV(null), []);
  assert.deepEqual(parseRadarTSV('# only comments\n# second line'), []);
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

test('evaluateInquiryDiscussion - Generates structured analysis for #1559635', () => {
  const inqItem = {
    id: '1559635',
    title: '🔥 THE QUESTION THAT ALMOST NO ONE DARES TO ANSWER',
    bounty: 1000,
    sub: 'AskSN'
  };

  const output = evaluateInquiryDiscussion(inqItem);

  assert.equal(output.itemId, '1559635');
  assert.ok(output.thesis.includes('Monetary Sovereignty'));
  assert.ok(output.coreArguments.length >= 4);
  assert.ok(output.responseMarkdown.includes('Rigorous Inquiry Analysis'));
  assert.ok(output.responseMarkdown.includes('1559635'));
});

test('evaluateEconomicDiscussion - Generates structured analysis for #1558562', () => {
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
  assert.ok(output.responseMarkdown.includes('1558562'));
});

test('evaluateSportsPickEm - Generates structured submission for #1558884', () => {
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

test('SNBountyRegistry - Lifecycle state transitions and persistence', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sn-registry-test-'));
  const storagePath = path.join(tempDir, 'registry.json');

  const registry = new SNBountyRegistry(storagePath);

  const item = {
    id: '1559635',
    sub: 'AskSN',
    tier: 2,
    score: 227,
    bounty: 1000,
    ncomments: 2,
    ageHours: 30.4,
    hits: ['recent@AskSN'],
    tags: ['OPEN_BOUNTY', 'LOW_COMP'],
    title: '🔥 THE QUESTION THAT ALMOST NO ONE DARES TO ANSWER'
  };

  const registered = registry.register(item, { source: 'Issue #787' });
  assert.equal(registered.status, 'DETECTED');
  assert.equal(registered.metadata.source, 'Issue #787');

  registry.updateStatus('1559635', 'EVALUATED', 'Completed scoring');
  assert.equal(registry.get('1559635').status, 'EVALUATED');
  assert.equal(registry.get('1559635').history.length, 2);

  registry.updateStatus('1559635', 'IN_PROGRESS', 'Drafting inquiry response');
  registry.updateStatus('1559635', 'SUBMITTED', 'Posted response', { commentId: '998844' });

  const current = registry.get('1559635');
  assert.equal(current.status, 'SUBMITTED');
  assert.equal(current.metadata.commentId, '998844');
  assert.equal(current.history.length, 4);

  const stats = registry.getSummaryStats();
  assert.equal(stats.total, 1);
  assert.equal(stats.byStatus.SUBMITTED, 1);
  assert.equal(stats.totalBountySats, 1000);

  const saved = registry.save();
  assert.equal(saved, true);
  assert.ok(fs.existsSync(storagePath));

  const loadedRegistry = new SNBountyRegistry(storagePath);
  const loadedItem = loadedRegistry.get('1559635');
  assert.ok(loadedItem);
  assert.equal(loadedItem.status, 'SUBMITTED');
  assert.equal(loadedItem.metadata.commentId, '998844');

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
      id: '1559635',
      sub: 'AskSN',
      tier: 2,
      bounty: 1000,
      ncomments: 2,
      ageHours: 30.4,
      title: '🔥 THE QUESTION THAT ALMOST NO ONE DARES TO ANSWER'
    }
  ];

  const tableReport = formatBountyReport(items);
  assert.ok(tableReport.includes('| ID | Sub | Tier | Bounty (sats) |'));
  assert.ok(tableReport.includes('| 1559635 | AskSN | 2 | 1,000 | 2 |'));
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

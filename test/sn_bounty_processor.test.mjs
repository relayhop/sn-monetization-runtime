import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  parseRadarTSV,
  evaluateOpportunity,
  evaluateLogicDiscussion,
  evaluateSelfPostOpportunity,
  evaluateInquiryDiscussion,
  evaluateEconomicDiscussion,
  evaluateSportsPickEm,
  evaluateWeeklyCloseContest,
  SNBountyRegistry,
  formatBountyReport,
  VALID_STATUSES
} from '../scripts/sn_bounty_processor.mjs';

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #807)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1561879\tAskSN\t2\t422\t1000\t11\t19.7\t1208996\t483\trecent@AskSN|top@AskSN\tOPEN_BOUNTY,SELF_POST_OPP\tLOGIC 🧠
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const item = results[0];
  assert.equal(item.id, '1561879');
  assert.equal(item.sub, 'AskSN');
  assert.equal(item.tier, 2);
  assert.equal(item.score, 422);
  assert.equal(item.bounty, 1000);
  assert.equal(item.ncomments, 11);
  assert.equal(item.ageHours, 19.7);
  assert.equal(item.opSince, '1208996');
  assert.equal(item.opNitems, 483);
  assert.deepEqual(item.hits, ['recent@AskSN', 'top@AskSN']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(item.title, 'LOGIC 🧠');
  assert.equal(item.evaluation.priority, 'MEDIUM');
  assert.equal(item.evaluation.action, 'CLAIM_AND_EXECUTE');
  assert.equal(item.evaluation.expectedValueSats, 300);
  assert.equal(item.evaluation.winProbability, 0.3);
  assert.equal(item.evaluation.isLogicDiscussion, true);
  assert.equal(item.evaluation.isSelfPostOpp, true);
  assert.equal(item.evaluation.isOpenBounty, true);
  assert.equal(item.evaluation.isSignal, false);
  assert.equal(item.evaluation.isInquiryDiscussion, false);
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
    title: 'Monetary philosophy query'
  };
  const evalMedium = evaluateOpportunity(mediumItem);
  assert.equal(evalMedium.priority, 'MEDIUM');
  assert.equal(evalMedium.action, 'CLAIM_AND_EXECUTE');
});

test('evaluateLogicDiscussion - Formal logic and deduction generator', () => {
  const item = {
    id: '1561879',
    sub: 'AskSN',
    title: 'LOGIC 🧠'
  };

  const logicPkg = evaluateLogicDiscussion(item);
  assert.equal(logicPkg.itemId, '1561879');
  assert.ok(logicPkg.framework.includes('Deductive Logic'));
  assert.ok(logicPkg.premises.length >= 3);
  assert.ok(logicPkg.deductiveProof.length >= 3);
  assert.ok(logicPkg.responseMarkdown.includes('### Formal Logic and Deductive Resolution'));
  assert.ok(logicPkg.responseMarkdown.includes('Item #1561879'));
});

test('evaluateSelfPostOpportunity - Strategic discussion hook generator', () => {
  const item = {
    id: '1561879',
    sub: 'AskSN',
    score: 422,
    ncomments: 11,
    title: 'LOGIC 🧠'
  };

  const selfPostPkg = evaluateSelfPostOpportunity(item);
  assert.equal(selfPostPkg.itemId, '1561879');
  assert.equal(selfPostPkg.targetSub, 'AskSN');
  assert.ok(selfPostPkg.hookTitle.length > 0);
  assert.ok(selfPostPkg.discussionPoints.length >= 3);
  assert.ok(selfPostPkg.postMarkdown.includes('## Exploring Paradoxes'));
  assert.ok(selfPostPkg.postMarkdown.includes('Opportunity #1561879'));
});

test('evaluateInquiryDiscussion - Philosophical and monetary inquiry generator', () => {
  const item = {
    id: '1559635',
    sub: 'AskSN',
    title: 'The question that almost no one dares to answer'
  };

  const inqPkg = evaluateInquiryDiscussion(item);
  assert.equal(inqPkg.itemId, '1559635');
  assert.ok(inqPkg.thesis.includes('Monetary Sovereignty'));
  assert.ok(inqPkg.coreArguments.length >= 3);
  assert.ok(inqPkg.actionableTakeaways.length >= 2);
  assert.ok(inqPkg.responseMarkdown.includes('### Rigorous Inquiry Analysis'));
  assert.ok(inqPkg.responseMarkdown.includes('Item #1559635'));
});

test('evaluateSportsPickEm - AFL and Sports predictions', () => {
  const item = {
    id: '1558900',
    sub: 'Stacker_Sports',
    title: 'AFL Finals Week 2 Pick Em'
  };

  const sportsPkg = evaluateSportsPickEm(item);
  assert.equal(sportsPkg.itemId, '1558900');
  assert.equal(sportsPkg.fixtures.length, 2);
  assert.ok(sportsPkg.submissionMarkdown.includes('AFL Finals Week 2 Pick Em'));
});

test('evaluateWeeklyCloseContest - S&P 500 Market Close Contest', () => {
  const item = {
    id: '1558901',
    sub: 'econ',
    title: 'Weekly Close Contest'
  };

  const contestPkg = evaluateWeeklyCloseContest(item);
  assert.equal(contestPkg.itemId, '1558901');
  assert.ok(contestPkg.direction.includes('BULLISH'));
  assert.ok(contestPkg.submissionMarkdown.includes('Weekly Close Contest Entry'));
});

test('evaluateEconomicDiscussion - Macroeconomic and sovereign debt engine', () => {
  const item = {
    id: '1558562',
    sub: 'AskSN',
    title: 'The debt dilemma'
  };

  const econPkg = evaluateEconomicDiscussion(item);
  assert.equal(econPkg.itemId, '1558562');
  assert.ok(econPkg.thesis.includes('Sovereign Debt Spiral'));
  assert.ok(econPkg.responseMarkdown.includes('Structural Dilemma Drivers'));
});

test('SNBountyRegistry - State machine lifecycle transitions', () => {
  const registry = new SNBountyRegistry();
  const rawItem = {
    id: '1561879',
    sub: 'AskSN',
    tier: 2,
    bounty: 1000,
    ncomments: 11,
    ageHours: 19.7,
    tags: ['OPEN_BOUNTY', 'SELF_POST_OPP'],
    title: 'LOGIC 🧠'
  };

  const registered = registry.register(rawItem);
  assert.equal(registered.status, 'DETECTED');
  assert.equal(registered.id, '1561879');

  const evaluated = registry.updateStatus('1561879', 'EVALUATED', 'Evaluated 300 sat EV');
  assert.equal(evaluated.status, 'EVALUATED');

  const queued = registry.updateStatus('1561879', 'QUEUED', 'Queued for automated response');
  assert.equal(queued.status, 'QUEUED');

  const claimed = registry.updateStatus('1561879', 'CLAIMED', 'Claimed on Stacker News');
  assert.equal(claimed.status, 'CLAIMED');

  const inProgress = registry.updateStatus('1561879', 'IN_PROGRESS', 'Generating logic proof');
  assert.equal(inProgress.status, 'IN_PROGRESS');

  const submitted = registry.updateStatus('1561879', 'SUBMITTED', 'Submitted formal deductive argument');
  assert.equal(submitted.status, 'SUBMITTED');

  const paid = registry.updateStatus('1561879', 'PAID', 'Received 1000 sat reward');
  assert.equal(paid.status, 'PAID');
  assert.equal(paid.history.length, 7);

  assert.throws(() => {
    registry.updateStatus('1561879', 'UNKNOWN_STATUS');
  }, /Invalid status/);

  assert.throws(() => {
    registry.updateStatus('9999999', 'CLAIMED');
  }, /not found in registry/);
});

test('SNBountyRegistry - Persistence load and save to file', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sn-bounty-test-'));
  const storagePath = path.join(tmpDir, 'registry.json');

  const reg1 = new SNBountyRegistry(storagePath);
  reg1.register({ id: '101', sub: 'AskSN', bounty: 500, title: 'Item 101' });
  reg1.register({ id: '102', sub: 'bitcoin', bounty: 2500, title: 'Item 102' });
  reg1.updateStatus('101', 'CLAIMED', 'Claimed');
  assert.ok(reg1.save());

  const reg2 = new SNBountyRegistry(storagePath);
  assert.equal(reg2.getAll().length, 2);
  assert.equal(reg2.get('101')?.status, 'CLAIMED');
  assert.equal(reg2.get('102')?.status, 'DETECTED');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('SNBountyRegistry - Summary statistics and aggregation', () => {
  const registry = new SNBountyRegistry();
  registry.register({ id: '1', sub: 'AskSN', bounty: 1000, ncomments: 2, tags: ['OPEN_BOUNTY'] });
  registry.register({ id: '2', sub: 'bitcoin', bounty: 5000, ncomments: 1, tags: ['OPEN_BOUNTY'] });
  registry.updateStatus('1', 'PAID');

  const stats = registry.getSummaryStats();
  assert.equal(stats.total, 2);
  assert.equal(stats.totalBountySats, 6000);
  assert.equal(stats.byStatus.PAID, 1);
  assert.equal(stats.byStatus.DETECTED, 1);
  assert.ok(stats.totalExpectedValueSats > 0);
});

test('formatBountyReport - Generates valid Markdown tables', () => {
  const emptyReport = formatBountyReport([]);
  assert.ok(emptyReport.includes('_No opportunities detected._'));

  const items = [
    {
      id: '1561879',
      sub: 'AskSN',
      tier: 2,
      bounty: 1000,
      ncomments: 11,
      title: 'LOGIC 🧠',
      evaluation: {
        winProbability: 0.3,
        expectedValueSats: 300,
        priority: 'MEDIUM',
        action: 'CLAIM_AND_EXECUTE'
      }
    }
  ];

  const report = formatBountyReport(items);
  assert.ok(report.includes('| 1561879 | AskSN | 2 | 1,000 | 11 | 30% | 300 | **MEDIUM** | `CLAIM_AND_EXECUTE` | LOGIC 🧠 |'));
});

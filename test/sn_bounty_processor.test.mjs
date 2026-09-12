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

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #820)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1564991\tStacker_Sports\t3\t1894\t3000\t14\t27.0\t54354\t6647\trecent@Stacker_Sports\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tAFL Finals Week Three Pickem!
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const sportsItem = results[0];
  assert.equal(sportsItem.id, '1564991');
  assert.equal(sportsItem.sub, 'Stacker_Sports');
  assert.equal(sportsItem.tier, 3);
  assert.equal(sportsItem.score, 1894);
  assert.equal(sportsItem.bounty, 3000);
  assert.equal(sportsItem.ncomments, 14);
  assert.equal(sportsItem.ageHours, 27.0);
  assert.equal(sportsItem.opSince, '54354');
  assert.equal(sportsItem.opNitems, 6647);
  assert.deepEqual(sportsItem.hits, ['recent@Stacker_Sports']);
  assert.deepEqual(sportsItem.tags, ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP']);
  assert.equal(sportsItem.title, 'AFL Finals Week Three Pickem!');
  assert.equal(sportsItem.evaluation.priority, 'MEDIUM');
  assert.equal(sportsItem.evaluation.action, 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM');
  assert.equal(sportsItem.evaluation.expectedValueSats, 536);
  assert.equal(sportsItem.evaluation.winProbability, 0.21);
  assert.equal(sportsItem.evaluation.isSportsPickEm, true);
  assert.equal(sportsItem.evaluation.isSelfPostOpp, true);
  assert.equal(sportsItem.evaluation.isOpenBounty, true);
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

test('evaluateSportsPickEm - AFL Finals Week Three Preliminary Finals generator (Issue #820)', () => {
  const item = {
    id: '1564991',
    sub: 'Stacker_Sports',
    title: 'AFL Finals Week Three Pickem!'
  };

  const sportsPkg = evaluateSportsPickEm(item);
  assert.equal(sportsPkg.itemId, '1564991');
  assert.equal(sportsPkg.league, 'AFL (Australian Football League)');
  assert.equal(sportsPkg.roundName, 'Finals Week 3 (Preliminary Finals)');
  assert.equal(sportsPkg.fixtures.length, 2);
  assert.ok(sportsPkg.fixtures[0].match.includes('Sydney Swans vs Port Adelaide Power'));
  assert.ok(sportsPkg.fixtures[1].match.includes('Geelong Cats vs Brisbane Lions'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Finals Week 3 (Preliminary Finals) Pick\'Em Submission'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Item #1564991'));
});

test('evaluateSportsPickEm - AFL Finals Week 2 Semi Finals generator', () => {
  const item = {
    id: '1558900',
    sub: 'Stacker_Sports',
    title: 'AFL Finals Week 2 Pick Em'
  };

  const sportsPkg = evaluateSportsPickEm(item);
  assert.equal(sportsPkg.itemId, '1558900');
  assert.equal(sportsPkg.league, 'AFL (Australian Football League)');
  assert.equal(sportsPkg.roundName, 'Finals Week 2 (Semi Finals)');
  assert.equal(sportsPkg.fixtures.length, 2);
  assert.ok(sportsPkg.submissionMarkdown.includes('Finals Week 2 (Semi Finals) Pick\'Em Submission'));
});

test('evaluateSportsPickEm - Random sports pick em generator', () => {
  const item = {
    id: '1562157',
    sub: 'Stacker_Sports',
    title: "Weekly Random Sports Pick 'em"
  };

  const sportsPkg = evaluateSportsPickEm(item);
  assert.equal(sportsPkg.itemId, '1562157');
  assert.equal(sportsPkg.league, 'Multi-Sport Cross-League Selection');
  assert.equal(sportsPkg.roundName, 'Weekly Random Sports Slate');
  assert.equal(sportsPkg.fixtures.length, 4);
  assert.ok(sportsPkg.submissionMarkdown.includes('Weekly Random Sports Slate Pick\'Em Submission'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Item #1562157'));
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

test('evaluateSelfPostOpportunity - Sports pick em discussion hook generator', () => {
  const item = {
    id: '1564991',
    sub: 'Stacker_Sports',
    score: 1894,
    ncomments: 14,
    title: 'AFL Finals Week Three Pickem!'
  };

  const selfPostPkg = evaluateSelfPostOpportunity(item);
  assert.equal(selfPostPkg.itemId, '1564991');
  assert.equal(selfPostPkg.targetSub, 'Stacker_Sports');
  assert.ok(selfPostPkg.hookTitle.includes('Sports Pick\'ems'));
  assert.ok(selfPostPkg.discussionPoints.length >= 3);
  assert.ok(selfPostPkg.postMarkdown.includes('Opportunity #1564991'));
});

test('evaluateSelfPostOpportunity - AskSN strategic discussion hook generator', () => {
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
  assert.ok(selfPostPkg.postMarkdown.includes('Exploring Paradoxes'));
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
    id: '1564991',
    sub: 'Stacker_Sports',
    tier: 3,
    bounty: 3000,
    ncomments: 14,
    ageHours: 27.0,
    tags: ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP'],
    title: 'AFL Finals Week Three Pickem!'
  };

  const registered = registry.register(rawItem);
  assert.equal(registered.status, 'DETECTED');
  assert.equal(registered.history.length, 1);

  registry.updateStatus('1564991', 'EVALUATED', 'Automated EV score 536 sats');
  assert.equal(registry.get('1564991').status, 'EVALUATED');

  registry.updateStatus('1564991', 'QUEUED', 'Added to preliminary finals submission queue');
  assert.equal(registry.get('1564991').status, 'QUEUED');

  registry.updateStatus('1564991', 'CLAIMED', 'Posted intent');
  assert.equal(registry.get('1564991').status, 'CLAIMED');

  registry.updateStatus('1564991', 'IN_PROGRESS', 'Drafting tactical match analysis');
  assert.equal(registry.get('1564991').status, 'IN_PROGRESS');

  registry.updateStatus('1564991', 'SUBMITTED', 'Pickem entry published to Stacker_Sports');
  assert.equal(registry.get('1564991').status, 'SUBMITTED');

  registry.updateStatus('1564991', 'PAID', 'Received 3000 sats bounty settlement');
  assert.equal(registry.get('1564991').status, 'PAID');
  assert.equal(registry.get('1564991').history.length, 7);
});

test('SNBountyRegistry - Validation errors on invalid status or missing id', () => {
  const registry = new SNBountyRegistry();
  assert.throws(() => registry.register({}), /must possess a valid id/);

  registry.register({ id: '9999', sub: 'bitcoin', bounty: 5000 });
  assert.throws(() => registry.updateStatus('9999', 'INVALID_STATUS'), /Invalid status/);
  assert.throws(() => registry.updateStatus('0000', 'CLAIMED'), /not found in registry/);
});

test('SNBountyRegistry - File persistence and summary analytics', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sn-registry-test-'));
  const storagePath = path.join(tmpDir, 'test_registry.json');

  const registry = new SNBountyRegistry(storagePath);
  registry.register({
    id: '1564991',
    sub: 'Stacker_Sports',
    tier: 3,
    bounty: 3000,
    ncomments: 14,
    ageHours: 27.0,
    tags: ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP'],
    title: 'AFL Finals Week Three Pickem!'
  });

  assert.equal(registry.save(), true);
  assert.equal(fs.existsSync(storagePath), true);

  const newRegistry = new SNBountyRegistry(storagePath);
  const loaded = newRegistry.get('1564991');
  assert.ok(loaded);
  assert.equal(loaded.title, 'AFL Finals Week Three Pickem!');

  const stats = newRegistry.getSummaryStats();
  assert.equal(stats.total, 1);
  assert.equal(stats.totalBountySats, 3000);
  assert.equal(stats.totalExpectedValueSats, 536);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('formatBountyReport - Markdown formatting for single and empty items', () => {
  const emptyReport = formatBountyReport([]);
  assert.ok(emptyReport.includes('_No opportunities detected._'));

  const items = [
    {
      id: '1564991',
      sub: 'Stacker_Sports',
      tier: 3,
      bounty: 3000,
      ncomments: 14,
      ageHours: 27.0,
      tags: ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP'],
      title: 'AFL Finals Week Three Pickem!'
    }
  ];

  const report = formatBountyReport(items);
  assert.ok(report.includes('| 1564991 | Stacker_Sports | 3 | 3,000 | 14 | 21% | 536 | **MEDIUM** | `ANALYZE_AND_SUBMIT_SPORTS_PICKEM` | AFL Finals Week Three Pickem! |'));
});

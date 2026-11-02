import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

import {
  parseRadarTSV,
  evaluateOpportunity,
  evaluateMathPuzzle,
  evaluateNewsAnalysis,
  evaluateBuildShowcase,
  evaluateProofOfWorkRun,
  evaluateLogicDiscussion,
  evaluateSelfPostOpportunity,
  evaluateInquiryDiscussion,
  evaluateEconomicDiscussion,
  evaluateSportsPickEm,
  evaluateWeeklyCloseContest,
  measureExecutionTelemetry,
  detectSequenceLoop,
  verifySequenceRange,
  SNBountyRegistry,
  formatBountyReport,
  VALID_STATUSES
} from '../scripts/sn_bounty_processor.mjs';

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #893)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1567486\tmath\t2\t6444\t700000\t42\t5.3\t48657\t15214\trecent@math|top@math\tOPEN_BOUNTY,HOT,SIGNAL\t[Math Puzzle] Does every sequence terminate in a loop?
1566212\tnews\t2\t1259\t1000\t6\t31.6\t51481\t4215\trecent@news\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tIceberg Ahead - Finding the small news story before it changes the world
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 2);

  const mathItem = results[0];
  assert.equal(mathItem.id, '1567486');
  assert.equal(mathItem.sub, 'math');
  assert.equal(mathItem.tier, 2);
  assert.equal(mathItem.score, 6444);
  assert.equal(mathItem.bounty, 700000);
  assert.equal(mathItem.ncomments, 42);
  assert.equal(mathItem.ageHours, 5.3);
  assert.equal(mathItem.opSince, '48657');
  assert.equal(mathItem.opNitems, 15214);
  assert.deepEqual(mathItem.hits, ['recent@math', 'top@math']);
  assert.deepEqual(mathItem.tags, ['OPEN_BOUNTY', 'HOT', 'SIGNAL']);
  assert.equal(mathItem.title, '[Math Puzzle] Does every sequence terminate in a loop?');
  assert.equal(mathItem.evaluation.priority, 'CRITICAL');
  assert.equal(mathItem.evaluation.action, 'ANALYZE_AND_SUBMIT_MATH_PUZZLE');
  assert.equal(mathItem.evaluation.expectedValueSats, 110600);
  assert.equal(mathItem.evaluation.winProbability, 0.158);
  assert.equal(mathItem.evaluation.isMathPuzzle, true);
  assert.equal(mathItem.evaluation.isOpenBounty, true);
  assert.equal(mathItem.evaluation.isSignal, true);

  const newsItem = results[1];
  assert.equal(newsItem.id, '1566212');
  assert.equal(newsItem.sub, 'news');
  assert.equal(newsItem.tier, 2);
  assert.equal(newsItem.score, 1259);
  assert.equal(newsItem.bounty, 1000);
  assert.equal(newsItem.ncomments, 6);
  assert.equal(newsItem.ageHours, 31.6);
  assert.equal(newsItem.opSince, '51481');
  assert.equal(newsItem.opNitems, 4215);
  assert.deepEqual(newsItem.hits, ['recent@news']);
  assert.deepEqual(newsItem.tags, ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP']);
  assert.equal(newsItem.title, 'Iceberg Ahead - Finding the small news story before it changes the world');
  assert.equal(newsItem.evaluation.priority, 'MEDIUM');
  assert.equal(newsItem.evaluation.action, 'ANALYZE_AND_SUBMIT_NEWS_ANALYSIS');
  assert.equal(newsItem.evaluation.expectedValueSats, 350);
  assert.equal(newsItem.evaluation.winProbability, 0.35);
  assert.equal(newsItem.evaluation.isNewsAnalysis, true);
  assert.equal(newsItem.evaluation.isOpenBounty, true);
  assert.equal(newsItem.evaluation.isSelfPostOpp, true);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #841)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1567486\tmath\t2\t5944\t700000\t25\t2.0\t48657\t15192\trecent@math|top@math\tOPEN_BOUNTY,HOT,SIGNAL\t[Math Puzzle] Does every sequence terminate in a loop?
1566212\tnews\t2\t1259\t1000\t6\t28.3\t51481\t4215\trecent@news\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tIceberg Ahead - Finding the small news story before it changes the world
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 2);

  const mathItem = results[0];
  assert.equal(mathItem.id, '1567486');
  assert.equal(mathItem.sub, 'math');
  assert.equal(mathItem.tier, 2);
  assert.equal(mathItem.score, 5944);
  assert.equal(mathItem.bounty, 700000);
  assert.equal(mathItem.ncomments, 25);
  assert.equal(mathItem.ageHours, 2.0);
  assert.equal(mathItem.opSince, '48657');
  assert.equal(mathItem.opNitems, 15192);
  assert.deepEqual(mathItem.hits, ['recent@math', 'top@math']);
  assert.deepEqual(mathItem.tags, ['OPEN_BOUNTY', 'HOT', 'SIGNAL']);
  assert.equal(mathItem.title, '[Math Puzzle] Does every sequence terminate in a loop?');
  assert.equal(mathItem.evaluation.priority, 'CRITICAL');
  assert.equal(mathItem.evaluation.action, 'ANALYZE_AND_SUBMIT_MATH_PUZZLE');
  assert.equal(mathItem.evaluation.expectedValueSats, 126700);
  assert.equal(mathItem.evaluation.winProbability, 0.181);
  assert.equal(mathItem.evaluation.isMathPuzzle, true);
  assert.equal(mathItem.evaluation.isOpenBounty, true);
  assert.equal(mathItem.evaluation.isSignal, true);

  const newsItem = results[1];
  assert.equal(newsItem.id, '1566212');
  assert.equal(newsItem.sub, 'news');
  assert.equal(newsItem.tier, 2);
  assert.equal(newsItem.score, 1259);
  assert.equal(newsItem.bounty, 1000);
  assert.equal(newsItem.ncomments, 6);
  assert.equal(newsItem.ageHours, 28.3);
  assert.equal(newsItem.opSince, '51481');
  assert.equal(newsItem.opNitems, 4215);
  assert.deepEqual(newsItem.hits, ['recent@news']);
  assert.deepEqual(newsItem.tags, ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP']);
  assert.equal(newsItem.title, 'Iceberg Ahead - Finding the small news story before it changes the world');
  assert.equal(newsItem.evaluation.priority, 'MEDIUM');
  assert.equal(newsItem.evaluation.action, 'ANALYZE_AND_SUBMIT_NEWS_ANALYSIS');
  assert.equal(newsItem.evaluation.expectedValueSats, 350);
  assert.equal(newsItem.evaluation.winProbability, 0.35);
  assert.equal(newsItem.evaluation.isNewsAnalysis, true);
  assert.equal(newsItem.evaluation.isOpenBounty, true);
  assert.equal(newsItem.evaluation.isSelfPostOpp, true);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #837)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1566212\tnews\t2\t1259\t1000\t6\t24.3\t51481\t4215\trecent@news\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tIceberg Ahead - Finding the small news story before it changes the world
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const newsItem = results[0];
  assert.equal(newsItem.id, '1566212');
  assert.equal(newsItem.sub, 'news');
  assert.equal(newsItem.tier, 2);
  assert.equal(newsItem.score, 1259);
  assert.equal(newsItem.bounty, 1000);
  assert.equal(newsItem.ncomments, 6);
  assert.equal(newsItem.ageHours, 24.3);
  assert.equal(newsItem.opSince, '51481');
  assert.equal(newsItem.opNitems, 4215);
  assert.deepEqual(newsItem.hits, ['recent@news']);
  assert.deepEqual(newsItem.tags, ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP']);
  assert.equal(newsItem.title, 'Iceberg Ahead - Finding the small news story before it changes the world');
  assert.equal(newsItem.evaluation.priority, 'MEDIUM');
  assert.equal(newsItem.evaluation.action, 'ANALYZE_AND_SUBMIT_NEWS_ANALYSIS');
  assert.equal(newsItem.evaluation.expectedValueSats, 350);
  assert.equal(newsItem.evaluation.winProbability, 0.35);
  assert.equal(newsItem.evaluation.isNewsAnalysis, true);
  assert.equal(newsItem.evaluation.isOpenBounty, true);
  assert.equal(newsItem.evaluation.isSelfPostOpp, true);
  assert.equal(newsItem.evaluation.isSignal, false);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #835)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1566212\tnews\t2\t1259\t1000\t5\t21.2\t51481\t4215\trecent@news|top@news\tOPEN_BOUNTY,LOW_COMP,HOT,SELF_POST_OPP\tIceberg Ahead - Finding the small news story before it changes the world
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const newsItem = results[0];
  assert.equal(newsItem.id, '1566212');
  assert.equal(newsItem.sub, 'news');
  assert.equal(newsItem.tier, 2);
  assert.equal(newsItem.score, 1259);
  assert.equal(newsItem.bounty, 1000);
  assert.equal(newsItem.ncomments, 5);
  assert.equal(newsItem.ageHours, 21.2);
  assert.equal(newsItem.opSince, '51481');
  assert.equal(newsItem.opNitems, 4215);
  assert.deepEqual(newsItem.hits, ['recent@news', 'top@news']);
  assert.deepEqual(newsItem.tags, ['OPEN_BOUNTY', 'LOW_COMP', 'HOT', 'SELF_POST_OPP']);
  assert.equal(newsItem.title, 'Iceberg Ahead - Finding the small news story before it changes the world');
  assert.equal(newsItem.evaluation.priority, 'MEDIUM');
  assert.equal(newsItem.evaluation.action, 'ANALYZE_AND_SUBMIT_NEWS_ANALYSIS');
  assert.equal(newsItem.evaluation.expectedValueSats, 770);
  assert.equal(newsItem.evaluation.winProbability, 0.77);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #832)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1566212\tnews\t2\t1259\t1000\t5\t19.6\t51481\t4215\trecent@news|top@news\tOPEN_BOUNTY,LOW_COMP,HOT,SELF_POST_OPP\tIceberg Ahead - Finding the small news story before it changes the world
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1566212');
  assert.equal(results[0].ageHours, 19.6);
  assert.equal(results[0].ncomments, 5);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #830)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1566212\tnews\t2\t1259\t1000\t4\t14.6\t51481\t4215\trecent@news|top@news\tOPEN_BOUNTY,LOW_COMP,HOT,SELF_POST_OPP\tIceberg Ahead - Finding the small news story before it changes the world
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1566212');
  assert.equal(results[0].ageHours, 14.6);
  assert.equal(results[0].ncomments, 4);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #828)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1566212\tnews\t2\t1259\t1000\t4\t10.1\t51481\t4215\trecent@news|top@news\tOPEN_BOUNTY,LOW_COMP,HOT,SELF_POST_OPP\tIceberg Ahead - Finding the small news story before it changes the world
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1566212');
  assert.equal(results[0].ageHours, 10.1);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #826)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1566212\tnews\t2\t1259\t1000\t4\t7.6\t51481\t4215\trecent@news|top@news\tOPEN_BOUNTY,LOW_COMP,HOT,SELF_POST_OPP\tIceberg Ahead - Finding the small news story before it changes the world
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1566212');
  assert.equal(results[0].ageHours, 7.6);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #824)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1566212\tnews\t2\t1259\t1000\t4\t4.5\t51481\t4215\trecent@news\tOPEN_BOUNTY,LOW_COMP,HOT,SIGNAL\tIceberg Ahead - Finding the small news story before it changes the world
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1566212');
  assert.equal(results[0].ageHours, 4.5);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #820)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1566373\tStacker_Sports\t3\t500\t25000\t1\t1.5\t12345\t99\trecent@Stacker_Sports\tOPEN_BOUNTY,LOW_COMP,FRESH\tAFL Finals Week Three Preliminary Finals Pick 'Em
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1566373');
  assert.equal(results[0].bounty, 25000);
  assert.equal(results[0].evaluation.isSportsPickEm, true);
  assert.equal(results[0].evaluation.priority, 'CRITICAL');
});

test('SN Bounty Processor - Fallback to 10-column legacy radar format', () => {
  const legacyTsv = `
1559635\tAskSN\t850\t5000\t2\t3.5\t45000\t250\tOPEN_BOUNTY,LOW_COMP\tThe question that almost no one dares to answer
`;

  const results = parseRadarTSV(legacyTsv);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, '1559635');
  assert.equal(results[0].sub, 'AskSN');
  assert.equal(results[0].tier, 2);
  assert.equal(results[0].score, 850);
  assert.equal(results[0].bounty, 5000);
  assert.equal(results[0].ncomments, 2);
  assert.equal(results[0].ageHours, 3.5);
  assert.deepEqual(results[0].hits, ['recent@AskSN']);
  assert.deepEqual(results[0].tags, ['OPEN_BOUNTY', 'LOW_COMP']);
  assert.equal(results[0].evaluation.priority, 'HIGH');
});

test('SN Bounty Processor - Empty and invalid TSV handling', () => {
  assert.deepEqual(parseRadarTSV(''), []);
  assert.deepEqual(parseRadarTSV(null), []);
  assert.deepEqual(parseRadarTSV('# only comments\n# second comment\n'), []);
  assert.deepEqual(parseRadarTSV('invalid\tshort\trow\n'), []);
});

test('evaluateOpportunity - EV and Priority Calculation Rules (Math Puzzle & News)', () => {
  const mathOpp = {
    id: '1567486',
    sub: 'math',
    tier: 2,
    bounty: 700000,
    ncomments: 25,
    ageHours: 2.0,
    tags: ['OPEN_BOUNTY', 'HOT', 'SIGNAL'],
    title: '[Math Puzzle] Does every sequence terminate in a loop?'
  };

  const mathEv = evaluateOpportunity(mathOpp);
  assert.equal(mathEv.winProbability, 0.181);
  assert.equal(mathEv.expectedValueSats, 126700);
  assert.equal(mathEv.priority, 'CRITICAL');
  assert.equal(mathEv.action, 'ANALYZE_AND_SUBMIT_MATH_PUZZLE');
  assert.equal(mathEv.isMathPuzzle, true);
  assert.equal(mathEv.isOpenBounty, true);
  assert.equal(mathEv.isSignal, true);

  const newsOpp = {
    id: '1566212',
    sub: 'news',
    tier: 2,
    bounty: 1000,
    ncomments: 6,
    ageHours: 28.3,
    tags: ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP'],
    title: 'Iceberg Ahead - Finding the small news story before it changes the world'
  };

  const newsEv = evaluateOpportunity(newsOpp);
  assert.equal(newsEv.winProbability, 0.35);
  assert.equal(newsEv.expectedValueSats, 350);
  assert.equal(newsEv.priority, 'MEDIUM');
  assert.equal(newsEv.action, 'ANALYZE_AND_SUBMIT_NEWS_ANALYSIS');
  assert.equal(newsEv.isNewsAnalysis, true);
  assert.equal(newsEv.isSelfPostOpp, true);
});

test('evaluateMathPuzzle - Collatz sequence and mathematical conjecture generator', () => {
  const item = {
    id: '1567486',
    sub: 'math',
    title: '[Math Puzzle] Does every sequence terminate in a loop?'
  };

  const pkg = evaluateMathPuzzle(item);
  assert.equal(pkg.itemId, '1567486');
  assert.ok(pkg.conjecture.includes('Collatz'));
  assert.ok(pkg.computationalBoundary.includes('2^68'));
  assert.ok(pkg.analyticBounds.includes('Terence Tao'));
  assert.ok(pkg.heuristicDrift.includes('log(3) - 2*log(2)'));
  assert.ok(pkg.cycleConstraints.length >= 3);
  assert.ok(pkg.submissionMarkdown.includes('### Rigorous Mathematical Analysis'));
  assert.ok(pkg.submissionMarkdown.includes('Item #1567486'));
  assert.ok(pkg.submissionMarkdown.includes('Discrete dynamical map'));
  assert.ok(pkg.submissionMarkdown.includes('Simons and de Weger'));
  assert.ok(pkg.submissionMarkdown.includes('Conway Generalization'));
});

test('evaluateNewsAnalysis - Iceberg news analysis generator', () => {
  const item = {
    id: '1566212',
    sub: 'news',
    title: 'Iceberg Ahead - Finding the small news story before it changes the world'
  };

  const pkg = evaluateNewsAnalysis(item);
  assert.equal(pkg.itemId, '1566212');
  assert.ok(pkg.storyHeadline.includes('Behind-the-Meter Power Interconnection'));
  assert.ok(pkg.sourceReport.includes('FERC'));
  assert.ok(pkg.submergedStructure.length >= 4);
  assert.ok(pkg.globalImpactVectors.length >= 3);
  assert.ok(pkg.monetaryImplications.length >= 2);
  assert.ok(pkg.submissionMarkdown.includes('### Iceberg Ahead'));
  assert.ok(pkg.submissionMarkdown.includes('Item #1566212'));
  assert.ok(pkg.submissionMarkdown.includes('Tip of the Iceberg'));
  assert.ok(pkg.submissionMarkdown.includes('Submerged Structural Shift'));
  assert.ok(pkg.submissionMarkdown.includes('Global Impact Vectors'));
});

test('evaluateSportsPickEm - AFL Finals Week Three Preliminary Finals generator', () => {
  const item = {
    id: '1566373',
    sub: 'Stacker_Sports',
    title: 'AFL Finals Week Three Preliminary Finals Pick \'Em'
  };

  const sportsPkg = evaluateSportsPickEm(item);
  assert.equal(sportsPkg.itemId, '1566373');
  assert.equal(sportsPkg.roundName, 'Finals Week 3 (Preliminary Finals)');
  assert.equal(sportsPkg.fixtures.length, 2);
  assert.ok(sportsPkg.submissionMarkdown.includes('Finals Week 3 (Preliminary Finals) Pick\'Em Submission'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Sydney Swans vs Port Adelaide Power'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Geelong Cats vs Brisbane Lions'));
});

test('evaluateSportsPickEm - AFL Finals Week 2 Semi Finals generator', () => {
  const item = {
    id: '1566100',
    sub: 'Stacker_Sports',
    title: 'AFL Finals Week 2 Semi Finals'
  };

  const sportsPkg = evaluateSportsPickEm(item);
  assert.equal(sportsPkg.itemId, '1566100');
  assert.equal(sportsPkg.roundName, 'Finals Week 2 (Semi Finals)');
  assert.equal(sportsPkg.fixtures.length, 2);
  assert.ok(sportsPkg.submissionMarkdown.includes('Port Adelaide Power vs Hawthorn Hawks'));
  assert.ok(sportsPkg.submissionMarkdown.includes('GWS Giants vs Brisbane Lions'));
});

test('evaluateSportsPickEm - Random sports pick em generator', () => {
  const item = {
    id: '1566200',
    sub: 'Stacker_Sports',
    title: 'Random Sports Pick\'Em Challenge'
  };

  const sportsPkg = evaluateSportsPickEm(item);
  assert.equal(sportsPkg.itemId, '1566200');
  assert.equal(sportsPkg.league, 'Multi-Sport Cross-League Selection');
  assert.equal(sportsPkg.fixtures.length, 4);
});

test('evaluateLogicDiscussion - Formal logic and deduction generator', () => {
  const item = {
    id: '1566300',
    sub: 'AskSN',
    title: 'Logic Puzzle: Solve this deduction'
  };

  const logicPkg = evaluateLogicDiscussion(item);
  assert.equal(logicPkg.itemId, '1566300');
  assert.ok(logicPkg.premises.length >= 4);
  assert.ok(logicPkg.deductiveProof.length >= 4);
  assert.ok(logicPkg.responseMarkdown.includes('Formal Logic and Deductive Resolution'));
});

test('evaluateSelfPostOpportunity - Math sequence and dynamical systems discussion hook generator', () => {
  const item = {
    id: '1567486',
    sub: 'math',
    score: 5944,
    ncomments: 25,
    title: '[Math Puzzle] Does every sequence terminate in a loop?'
  };

  const selfPost = evaluateSelfPostOpportunity(item);
  assert.equal(selfPost.itemId, '1567486');
  assert.equal(selfPost.targetSub, 'math');
  assert.ok(selfPost.hookTitle.includes('Dynamical Systems'));
  assert.ok(selfPost.discussionPoints.length >= 3);
  assert.ok(selfPost.postMarkdown.includes('Target Sub:** ~math'));
  assert.ok(selfPost.postMarkdown.includes('Opportunity #1567486'));
});

test('evaluateSelfPostOpportunity - Sports pick em discussion hook generator', () => {
  const item = {
    id: '1566373',
    sub: 'Stacker_Sports',
    score: 500,
    ncomments: 1,
    title: 'AFL Finals Pick \'Em'
  };

  const selfPost = evaluateSelfPostOpportunity(item);
  assert.equal(selfPost.itemId, '1566373');
  assert.equal(selfPost.targetSub, 'Stacker_Sports');
  assert.ok(selfPost.hookTitle.includes('Game Theory'));
  assert.ok(selfPost.discussionPoints.length >= 3);
});

test('evaluateSelfPostOpportunity - AskSN strategic discussion hook generator', () => {
  const item = {
    id: '1566000',
    sub: 'AskSN',
    score: 600,
    ncomments: 10,
    title: 'General inquiry'
  };

  const selfPost = evaluateSelfPostOpportunity(item);
  assert.equal(selfPost.targetSub, 'AskSN');
  assert.ok(selfPost.hookTitle.includes('Decentralized Coordination'));
});

test('evaluateSelfPostOpportunity - News and iceberg discussion hook generator', () => {
  const item = {
    id: '1566212',
    sub: 'news',
    score: 1259,
    ncomments: 6,
    title: 'Iceberg Ahead - Finding the small news story before it changes the world'
  };

  const selfPost = evaluateSelfPostOpportunity(item);
  assert.equal(selfPost.itemId, '1566212');
  assert.equal(selfPost.targetSub, 'news');
  assert.ok(selfPost.hookTitle.includes('Signal vs Noise'));
  assert.ok(selfPost.discussionPoints.length >= 3);
  assert.ok(selfPost.postMarkdown.includes('Target Sub:** ~news'));
  assert.ok(selfPost.postMarkdown.includes('Opportunity #1566212'));
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

test('measureExecutionTelemetry - Feature flag toggle and latency budget compliance', () => {
  const fastFn = () => parseRadarTSV('1567486\tmath\t2\t5944\t700000\t25\t2.0\t48657\t15192\trecent@math\tOPEN_BOUNTY\tMath');

  const enabledTelemetry = measureExecutionTelemetry(fastFn, { enabled: true, maxLatencyMs: 5.0 });
  assert.equal(enabledTelemetry.telemetry.enabled, true);
  assert.equal(typeof enabledTelemetry.telemetry.latencyMs, 'number');
  assert.ok(enabledTelemetry.telemetry.latencyMs <= 5.0);
  assert.equal(enabledTelemetry.telemetry.withinBudget, true);
  assert.equal(enabledTelemetry.result.length, 1);

  const disabledTelemetry = measureExecutionTelemetry(fastFn, { enabled: false });
  assert.equal(disabledTelemetry.telemetry.enabled, false);
  assert.equal(disabledTelemetry.telemetry.latencyMs, 0);
  assert.equal(disabledTelemetry.telemetry.withinBudget, true);
});

test('SNBountyRegistry - State machine lifecycle transitions', () => {
  const registry = new SNBountyRegistry();
  const rawItem = {
    id: '1567486',
    sub: 'math',
    tier: 2,
    bounty: 700000,
    ncomments: 25,
    ageHours: 2.0,
    tags: ['OPEN_BOUNTY', 'HOT', 'SIGNAL'],
    title: '[Math Puzzle] Does every sequence terminate in a loop?'
  };

  const registered = registry.register(rawItem);
  assert.equal(registered.status, 'DETECTED');
  assert.equal(registered.history.length, 1);

  registry.updateStatus('1567486', 'EVALUATED', 'Automated EV score 126700 sats');
  assert.equal(registry.get('1567486').status, 'EVALUATED');

  registry.updateStatus('1567486', 'QUEUED', 'Added to math puzzle submission queue');
  assert.equal(registry.get('1567486').status, 'QUEUED');

  registry.updateStatus('1567486', 'CLAIMED', 'Posted intent');
  assert.equal(registry.get('1567486').status, 'CLAIMED');

  registry.updateStatus('1567486', 'IN_PROGRESS', 'Drafting Collatz formal mathematical analysis');
  assert.equal(registry.get('1567486').status, 'IN_PROGRESS');

  registry.updateStatus('1567486', 'SUBMITTED', 'Collatz mathematical analysis published to math sub');
  assert.equal(registry.get('1567486').status, 'SUBMITTED');

  registry.updateStatus('1567486', 'PAID', 'Received 700000 sats bounty settlement');
  assert.equal(registry.get('1567486').status, 'PAID');
  assert.equal(registry.get('1567486').history.length, 7);
});

test('SNBountyRegistry - Validation errors on invalid status or missing id', () => {
  const registry = new SNBountyRegistry();
  assert.throws(() => registry.register({}), /must possess a valid id/);

  registry.register({ id: '9999', sub: 'math', bounty: 5000 });
  assert.throws(() => registry.updateStatus('9999', 'INVALID_STATUS'), /Invalid status/);
  assert.throws(() => registry.updateStatus('0000', 'CLAIMED'), /not found in registry/);
});

test('SNBountyRegistry - File persistence and summary analytics', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sn-registry-test-'));
  const storagePath = path.join(tmpDir, 'test_registry.json');

  const registry = new SNBountyRegistry(storagePath);
  registry.register({
    id: '1567486',
    sub: 'math',
    tier: 2,
    bounty: 700000,
    ncomments: 25,
    ageHours: 2.0,
    tags: ['OPEN_BOUNTY', 'HOT', 'SIGNAL'],
    title: '[Math Puzzle] Does every sequence terminate in a loop?'
  });

  assert.equal(registry.save(), true);
  assert.equal(fs.existsSync(storagePath), true);

  const newRegistry = new SNBountyRegistry(storagePath);
  const loaded = newRegistry.get('1567486');
  assert.ok(loaded);
  assert.equal(loaded.title, '[Math Puzzle] Does every sequence terminate in a loop?');

  const stats = newRegistry.getSummaryStats();
  assert.equal(stats.total, 1);
  assert.equal(stats.totalBountySats, 700000);
  assert.equal(stats.totalExpectedValueSats, 126700);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('formatBountyReport - Markdown formatting for single and empty items', () => {
  const emptyReport = formatBountyReport([]);
  assert.ok(emptyReport.includes('_No opportunities detected._'));

  const items = [
    {
      id: '1567486',
      sub: 'math',
      tier: 2,
      bounty: 700000,
      ncomments: 25,
      ageHours: 2.0,
      tags: ['OPEN_BOUNTY', 'HOT', 'SIGNAL'],
      title: '[Math Puzzle] Does every sequence terminate in a loop?'
    }
  ];

  const report = formatBountyReport(items);
  assert.ok(report.includes('| 1567486 | math | 2 | 700,000 | 25 | 18% | 126,700 | **CRITICAL** | `ANALYZE_AND_SUBMIT_MATH_PUZZLE` | [Math Puzzle] Does every sequence terminate in a l |'));
});

test('CLI - Ingest default Issue #893 payload with table and json formatting', () => {
  const stdoutTable = execSync('node scripts/sn_bounty_processor.mjs', { encoding: 'utf8' });
  assert.ok(stdoutTable.includes('Parsed 2 opportunities:'));
  assert.ok(stdoutTable.includes('1567486'));
  assert.ok(stdoutTable.includes('1566212'));
  assert.ok(stdoutTable.includes('ANALYZE_AND_SUBMIT_MATH_PUZZLE'));
  assert.ok(stdoutTable.includes('ANALYZE_AND_SUBMIT_NEWS_ANALYSIS'));

  const stdoutJson = execSync('node scripts/sn_bounty_processor.mjs --json', { encoding: 'utf8' });
  const parsedJson = JSON.parse(stdoutJson);
  assert.equal(parsedJson.length, 2);
  assert.equal(parsedJson[0].id, '1567486');
  assert.equal(parsedJson[0].bounty, 700000);
  assert.equal(parsedJson[0].ncomments, 42);
  assert.equal(parsedJson[0].ageHours, 5.3);
  assert.equal(parsedJson[0].evaluation.expectedValueSats, 110600);
  assert.equal(parsedJson[0].evaluation.winProbability, 0.158);
  assert.equal(parsedJson[1].id, '1566212');
  assert.equal(parsedJson[1].ncomments, 6);
  assert.equal(parsedJson[1].ageHours, 31.6);
  assert.equal(parsedJson[1].evaluation.expectedValueSats, 350);
  assert.equal(parsedJson[1].evaluation.winProbability, 0.35);
});

test('CLI - Strategy flag output for math, news, self-post, and filter arguments', () => {
  const stdoutMath = execSync('node scripts/sn_bounty_processor.mjs --math', { encoding: 'utf8' });
  assert.ok(stdoutMath.includes('Mathematical Puzzle Analysis Strategy'));
  assert.ok(stdoutMath.includes('The Collatz Conjecture'));
  assert.ok(stdoutMath.includes('Simons and de Weger'));

  const stdoutNews = execSync('node scripts/sn_bounty_processor.mjs --news', { encoding: 'utf8' });
  assert.ok(stdoutNews.includes('News Iceberg Analysis Strategy'));
  assert.ok(stdoutNews.includes('FERC and Regional Transmission Organizations'));

  const stdoutSelfPost = execSync('node scripts/sn_bounty_processor.mjs --self-post', { encoding: 'utf8' });
  assert.ok(stdoutSelfPost.includes('Self-Post Opportunity Strategy (#1566212 ~news)'));
  assert.ok(stdoutSelfPost.includes('Signal vs Noise'));

  const stdoutFiltered = execSync('node scripts/sn_bounty_processor.mjs --filter 1567486 --json', { encoding: 'utf8' });
  const parsedFiltered = JSON.parse(stdoutFiltered);
  assert.equal(parsedFiltered.length, 1);
  assert.equal(parsedFiltered[0].id, '1567486');

  const stdoutEmptyFilter = execSync('node scripts/sn_bounty_processor.mjs --filter 9999999 --json', { encoding: 'utf8' });
  const parsedEmpty = JSON.parse(stdoutEmptyFilter);
  assert.equal(parsedEmpty.length, 0);
});

test('CLI - Telemetry flag output and latency benchmark', () => {
  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Execution Latency'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('CLI - Persistence with --save flag', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sn-cli-save-'));
  const savePath = path.join(tmpDir, 'cli_registry.json');
  execSync(`node scripts/sn_bounty_processor.mjs --save "${savePath}"`, { encoding: 'utf8' });
  assert.equal(fs.existsSync(savePath), true);
  const data = JSON.parse(fs.readFileSync(savePath, 'utf8'));
  assert.equal(data.stats.total, 2);
  assert.equal(data.bounties[0].id, '1567486');
  assert.equal(data.bounties[1].id, '1566212');
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #905)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1567486\tmath\t2\t6889\t700000\t68\t18.9\t48657\t15231\trecent@math|top@math\tOPEN_BOUNTY,HOT\t[Math Puzzle] Does every sequence terminate in a loop?
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const item = results[0];
  assert.equal(item.id, '1567486');
  assert.equal(item.sub, 'math');
  assert.equal(item.tier, 2);
  assert.equal(item.score, 6889);
  assert.equal(item.bounty, 700000);
  assert.equal(item.ncomments, 68);
  assert.equal(item.ageHours, 18.9);
  assert.equal(item.opSince, '48657');
  assert.equal(item.opNitems, 15231);
  assert.deepEqual(item.hits, ['recent@math', 'top@math']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY', 'HOT']);
  assert.equal(item.title, '[Math Puzzle] Does every sequence terminate in a loop?');

  const ev = item.evaluation;
  assert.equal(ev.winProbability, 0.15);
  assert.equal(ev.expectedValueSats, 105000);
  assert.equal(ev.priority, 'CRITICAL');
  assert.equal(ev.action, 'ANALYZE_AND_SUBMIT_MATH_PUZZLE');
  assert.equal(ev.isMathPuzzle, true);
  assert.equal(ev.isOpenBounty, true);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #922)', () => {
  const tsvInput = `
1567486\tmath\t2\t6889\t700000\t70\t26.1\t48657\t15259\trecent@math\tOPEN_BOUNTY,HOT\t[Math Puzzle] Does every sequence terminate in a loop?
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const item = results[0];
  assert.equal(item.id, '1567486');
  assert.equal(item.sub, 'math');
  assert.equal(item.tier, 2);
  assert.equal(item.score, 6889);
  assert.equal(item.bounty, 700000);
  assert.equal(item.ncomments, 70);
  assert.equal(item.ageHours, 26.1);
  assert.equal(item.opSince, '48657');
  assert.equal(item.opNitems, 15259);
  assert.deepEqual(item.hits, ['recent@math']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY', 'HOT']);
  assert.equal(item.title, '[Math Puzzle] Does every sequence terminate in a loop?');

  const ev = item.evaluation;
  assert.equal(ev.winProbability, 0.105);
  assert.equal(ev.expectedValueSats, 73500);
  assert.equal(ev.priority, 'CRITICAL');
  assert.equal(ev.action, 'ANALYZE_AND_SUBMIT_MATH_PUZZLE');
  assert.equal(ev.isMathPuzzle, true);
  assert.equal(ev.isOpenBounty, true);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #909)', () => {
  const tsvInput = `
1567486\tmath\t2\t6889\t700000\t69\t22.0\t48657\t15231\trecent@math|top@math\tOPEN_BOUNTY,HOT\t[Math Puzzle] Does every sequence terminate in a loop?
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const item = results[0];
  assert.equal(item.id, '1567486');
  assert.equal(item.sub, 'math');
  assert.equal(item.tier, 2);
  assert.equal(item.score, 6889);
  assert.equal(item.bounty, 700000);
  assert.equal(item.ncomments, 69);
  assert.equal(item.ageHours, 22.0);
  assert.equal(item.opSince, '48657');
  assert.equal(item.opNitems, 15231);
  assert.deepEqual(item.hits, ['recent@math', 'top@math']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY', 'HOT']);
  assert.equal(item.title, '[Math Puzzle] Does every sequence terminate in a loop?');

  const ev = item.evaluation;
  assert.equal(ev.winProbability, 0.15);
  assert.equal(ev.expectedValueSats, 105000);
  assert.equal(ev.priority, 'CRITICAL');
  assert.equal(ev.action, 'ANALYZE_AND_SUBMIT_MATH_PUZZLE');
  assert.equal(ev.isMathPuzzle, true);
  assert.equal(ev.isOpenBounty, true);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #895)', () => {
  const tsvInput = `
1567486\tmath\t2\t6889\t700000\t68\t12.2\t48657\t15231\trecent@math|top@math\tOPEN_BOUNTY,HOT\t[Math Puzzle] Does every sequence terminate in a loop?
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const item = results[0];
  assert.equal(item.id, '1567486');
  assert.equal(item.sub, 'math');
  assert.equal(item.tier, 2);
  assert.equal(item.score, 6889);
  assert.equal(item.bounty, 700000);
  assert.equal(item.ncomments, 68);
  assert.equal(item.ageHours, 12.2);
  assert.equal(item.opSince, '48657');
  assert.equal(item.opNitems, 15231);
  assert.deepEqual(item.hits, ['recent@math', 'top@math']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY', 'HOT']);
  assert.equal(item.title, '[Math Puzzle] Does every sequence terminate in a loop?');

  const ev = item.evaluation;
  assert.equal(ev.winProbability, 0.15);
  assert.equal(ev.expectedValueSats, 105000);
  assert.equal(ev.priority, 'CRITICAL');
  assert.equal(ev.action, 'ANALYZE_AND_SUBMIT_MATH_PUZZLE');
  assert.equal(ev.isMathPuzzle, true);
  assert.equal(ev.isOpenBounty, true);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #903)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1567486\tmath\t2\t6889\t700000\t68\t17.2\t48657\t15231\trecent@math|top@math\tOPEN_BOUNTY,HOT\t[Math Puzzle] Does every sequence terminate in a loop?
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const item = results[0];
  assert.equal(item.id, '1567486');
  assert.equal(item.sub, 'math');
  assert.equal(item.tier, 2);
  assert.equal(item.score, 6889);
  assert.equal(item.bounty, 700000);
  assert.equal(item.ncomments, 68);
  assert.equal(item.ageHours, 17.2);
  assert.equal(item.opSince, '48657');
  assert.equal(item.opNitems, 15231);
  assert.deepEqual(item.hits, ['recent@math', 'top@math']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY', 'HOT']);
  assert.equal(item.title, '[Math Puzzle] Does every sequence terminate in a loop?');

  const ev = item.evaluation;
  assert.equal(ev.winProbability, 0.15);
  assert.equal(ev.expectedValueSats, 105000);
  assert.equal(ev.priority, 'CRITICAL');
  assert.equal(ev.action, 'ANALYZE_AND_SUBMIT_MATH_PUZZLE');
  assert.equal(ev.isMathPuzzle, true);
  assert.equal(ev.isOpenBounty, true);
});

test('detectSequenceLoop - Verified cycle detection across positive orbits and benchmarks', () => {
  const res27 = detectSequenceLoop(27);
  assert.equal(res27.terminatesInLoop, true);
  assert.deepEqual(res27.loopElements, [4, 2, 1]);
  assert.equal(res27.cycleLength, 3);
  assert.equal(res27.stepsToLoop, 109);
  assert.equal(res27.peakValue, 9232);

  const resScore = detectSequenceLoop(6889);
  assert.equal(resScore.terminatesInLoop, true);
  assert.deepEqual(resScore.loopElements, [4, 2, 1]);
  assert.equal(resScore.cycleLength, 3);
  assert.equal(resScore.stepsToLoop, 179);
  assert.equal(resScore.peakValue, 55888);

  const resId = detectSequenceLoop(1567486);
  assert.equal(resId.terminatesInLoop, true);
  assert.deepEqual(resId.loopElements, [4, 2, 1]);
  assert.equal(resId.cycleLength, 3);
  assert.equal(resId.stepsToLoop, 130);
  assert.equal(resId.peakValue, 26782000);

  const resZero = detectSequenceLoop(0);
  assert.equal(resZero.terminatesInLoop, true);
  assert.deepEqual(resZero.loopElements, [0]);
  assert.equal(resZero.cycleLength, 1);
});

test('detectSequenceLoop - Negative Collatz cycles and custom step function verification', () => {
  const resNeg1 = detectSequenceLoop(-1);
  assert.equal(resNeg1.terminatesInLoop, true);
  assert.equal(resNeg1.cycleLength, 2);
  assert.deepEqual(resNeg1.loopElements, [-1, -2]);

  const resNeg5 = detectSequenceLoop(-5);
  assert.equal(resNeg5.terminatesInLoop, true);
  assert.equal(resNeg5.cycleLength, 5);
  assert.deepEqual(resNeg5.loopElements, [-5, -14, -7, -20, -10]);

  const customModRes = detectSequenceLoop(2, {
    mode: 'custom',
    stepFn: (n) => (n * n + 1n) % 101n
  });
  assert.equal(customModRes.terminatesInLoop, true);
  assert.ok(customModRes.cycleLength > 0);

  const invalidRes = detectSequenceLoop('invalid-integer');
  assert.equal(invalidRes.terminatesInLoop, false);
  assert.ok(invalidRes.error.includes('Invalid starting integer'));
});

test('verifySequenceRange - Range integrity verification across positive integers', () => {
  const rangeResult = verifySequenceRange(1, 200);
  assert.equal(rangeResult.allTerminated, true);
  assert.equal(rangeResult.verifiedCount, 200);
  assert.ok(rangeResult.maxPeak >= 4);
  assert.ok(rangeResult.maxSteps >= 0);
});

test('evaluateMathPuzzle - Telemetry integration and formatted markdown sections', () => {
  const item = {
    id: '1567486',
    score: 6889,
    sub: 'math',
    title: '[Math Puzzle] Does every sequence terminate in a loop?'
  };

  const pkg = evaluateMathPuzzle(item);
  assert.ok(pkg.simulationItem);
  assert.equal(pkg.simulationItem.terminatesInLoop, true);
  assert.deepEqual(pkg.simulationItem.loopElements, [4, 2, 1]);

  assert.ok(pkg.simulationScore);
  assert.equal(pkg.simulationScore.terminatesInLoop, true);
  assert.deepEqual(pkg.simulationScore.loopElements, [4, 2, 1]);

  assert.ok(pkg.simulationBenchmark);
  assert.equal(pkg.simulationBenchmark.terminatesInLoop, true);
  assert.deepEqual(pkg.simulationBenchmark.loopElements, [4, 2, 1]);

  assert.ok(pkg.submissionMarkdown.includes('Empirical Trajectory Simulation & Loop Telemetry'));
  assert.ok(pkg.submissionMarkdown.includes('Terminal Orbit: Stable periodic 3-cycle'));
  assert.ok(pkg.submissionMarkdown.includes('Formal Bounty Resolution Verdict'));
});

test('CLI - Issue #905 execution and loop detection flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 905 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1567486');
  assert.equal(parsedIssue[0].score, 6889);
  assert.equal(parsedIssue[0].bounty, 700000);
  assert.equal(parsedIssue[0].ncomments, 68);
  assert.equal(parsedIssue[0].ageHours, 18.9);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 105000);

  const stdoutLoop = execSync('node scripts/sn_bounty_processor.mjs --loop 1567486 --json', { encoding: 'utf8' });
  const parsedLoop = JSON.parse(stdoutLoop);
  assert.equal(parsedLoop.terminatesInLoop, true);
  assert.deepEqual(parsedLoop.loopElements, [4, 2, 1]);
  assert.equal(parsedLoop.stepsToLoop, 130);
  assert.equal(parsedLoop.peakValue, 26782000);
});

test('CLI - Issue #903 execution and loop detection flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 903 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1567486');
  assert.equal(parsedIssue[0].score, 6889);
  assert.equal(parsedIssue[0].bounty, 700000);
  assert.equal(parsedIssue[0].ncomments, 68);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 105000);

  const stdoutLoop = execSync('node scripts/sn_bounty_processor.mjs --loop 27 --json', { encoding: 'utf8' });
  const parsedLoop = JSON.parse(stdoutLoop);
  assert.equal(parsedLoop.terminatesInLoop, true);
  assert.deepEqual(parsedLoop.loopElements, [4, 2, 1]);
  assert.equal(parsedLoop.stepsToLoop, 109);
  assert.equal(parsedLoop.peakValue, 9232);

  const stdoutLoopTable = execSync('node scripts/sn_bounty_processor.mjs --loop 27', { encoding: 'utf8' });
  assert.ok(stdoutLoopTable.includes('Sequence Loop Detection: Start 27'));
  assert.ok(stdoutLoopTable.includes('Terminates in Loop: true'));
  assert.ok(stdoutLoopTable.includes('Cycle Length: 3'));
  assert.ok(stdoutLoopTable.includes('Loop Elements: [4, 2, 1]'));
});

test('CLI - Issue #895 execution and loop detection flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 895 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1567486');
  assert.equal(parsedIssue[0].score, 6889);
  assert.equal(parsedIssue[0].bounty, 700000);
  assert.equal(parsedIssue[0].ncomments, 68);
  assert.equal(parsedIssue[0].ageHours, 12.2);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 105000);

  const stdoutLoop = execSync('node scripts/sn_bounty_processor.mjs --loop 6889 --json', { encoding: 'utf8' });
  const parsedLoop = JSON.parse(stdoutLoop);
  assert.equal(parsedLoop.terminatesInLoop, true);
  assert.deepEqual(parsedLoop.loopElements, [4, 2, 1]);
  assert.equal(parsedLoop.stepsToLoop, 179);
  assert.equal(parsedLoop.peakValue, 55888);
});

test('CLI - Issue #909 execution and loop detection flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 909 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1567486');
  assert.equal(parsedIssue[0].score, 6889);
  assert.equal(parsedIssue[0].bounty, 700000);
  assert.equal(parsedIssue[0].ncomments, 69);
  assert.equal(parsedIssue[0].ageHours, 22.0);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 105000);

  const stdoutLoop = execSync('node scripts/sn_bounty_processor.mjs --loop 6889 --json', { encoding: 'utf8' });
  const parsedLoop = JSON.parse(stdoutLoop);
  assert.equal(parsedLoop.terminatesInLoop, true);
  assert.deepEqual(parsedLoop.loopElements, [4, 2, 1]);
  assert.equal(parsedLoop.stepsToLoop, 179);
  assert.equal(parsedLoop.peakValue, 55888);
});

test('CLI - Issue #922 execution and loop detection flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 922 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1567486');
  assert.equal(parsedIssue[0].score, 6889);
  assert.equal(parsedIssue[0].bounty, 700000);
  assert.equal(parsedIssue[0].ncomments, 70);
  assert.equal(parsedIssue[0].ageHours, 26.1);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 73500);

  const stdoutLoop = execSync('node scripts/sn_bounty_processor.mjs --loop 6889 --json', { encoding: 'utf8' });
  const parsedLoop = JSON.parse(stdoutLoop);
  assert.equal(parsedLoop.terminatesInLoop, true);
  assert.deepEqual(parsedLoop.loopElements, [4, 2, 1]);
  assert.equal(parsedLoop.stepsToLoop, 179);
  assert.equal(parsedLoop.peakValue, 55888);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1052)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1568946\tConstruction_and_Engineering\t2\t249\t5000\t2\t0.5\t9274\t27301\trecent@Construction_and_Engineering|top@Construction_and_Engineering\tOPEN_BOUNTY,LOW_COMP,FRESH,SIGNAL\tShow Your Build Friday #1: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨
1567486\tmath\t2\t6889\t700000\t71\t29.4\t48657\t15276\trecent@math\tOPEN_BOUNTY,HOT\t[Math Puzzle] Does every sequence terminate in a loop?
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 2);

  const buildItem = results[0];
  assert.equal(buildItem.id, '1568946');
  assert.equal(buildItem.sub, 'Construction_and_Engineering');
  assert.equal(buildItem.tier, 2);
  assert.equal(buildItem.score, 249);
  assert.equal(buildItem.bounty, 5000);
  assert.equal(buildItem.ncomments, 2);
  assert.equal(buildItem.ageHours, 0.5);
  assert.equal(buildItem.evaluation.isBuildShowcase, true);
  assert.equal(buildItem.evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(buildItem.evaluation.priority, 'HIGH');
  assert.equal(buildItem.evaluation.expectedValueSats, 4750);
  assert.equal(buildItem.evaluation.winProbability, 0.95);

  const mathItem = results[1];
  assert.equal(mathItem.id, '1567486');
  assert.equal(mathItem.sub, 'math');
  assert.equal(mathItem.tier, 2);
  assert.equal(mathItem.score, 6889);
  assert.equal(mathItem.bounty, 700000);
  assert.equal(mathItem.ncomments, 71);
  assert.equal(mathItem.ageHours, 29.4);
  assert.equal(mathItem.evaluation.isMathPuzzle, true);
  assert.equal(mathItem.evaluation.action, 'ANALYZE_AND_SUBMIT_MATH_PUZZLE');
  assert.equal(mathItem.evaluation.priority, 'CRITICAL');
  assert.equal(mathItem.evaluation.expectedValueSats, 73500);
  assert.equal(mathItem.evaluation.winProbability, 0.105);
});

test('evaluateBuildShowcase - Real-world proof-of-work build showcase generator', () => {
  const item = {
    id: '1568946',
    sub: 'Construction_and_Engineering',
    title: 'Show Your Build Friday #1: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨'
  };

  const showcase = evaluateBuildShowcase(item);
  assert.equal(showcase.itemId, '1568946');
  assert.ok(showcase.projectTitle.length > 0);
  assert.ok(showcase.materials.length >= 4);
  assert.ok(showcase.architectureDetails.length >= 3);
  assert.ok(showcase.telemetryMetrics.continuousUptimeHours > 0);
  assert.ok(showcase.submissionMarkdown.includes('Real-World Proof-of-Work'));
  assert.ok(showcase.submissionMarkdown.includes('Bill of Materials (BOM)'));
  assert.ok(showcase.submissionMarkdown.includes('Empirical Performance & Telemetry Validation'));

  const customShowcase = evaluateBuildShowcase(item, {
    projectTitle: 'Hydroelectric Micro-Turbine Energy Harvester',
    category: 'Renewable Power Generation'
  });
  assert.equal(customShowcase.projectTitle, 'Hydroelectric Micro-Turbine Energy Harvester');
  assert.equal(customShowcase.category, 'Renewable Power Generation');
  assert.ok(customShowcase.submissionMarkdown.includes('Hydroelectric Micro-Turbine Energy Harvester'));
});

test('CLI - Issue #1052 execution and showcase submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1052 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 2);
  assert.equal(parsedIssue[0].id, '1568946');
  assert.equal(parsedIssue[0].sub, 'Construction_and_Engineering');
  assert.equal(parsedIssue[0].bounty, 5000);
  assert.equal(parsedIssue[0].evaluation.isBuildShowcase, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(parsedIssue[1].id, '1567486');
  assert.equal(parsedIssue[1].sub, 'math');
  assert.equal(parsedIssue[1].bounty, 700000);
  assert.equal(parsedIssue[1].ncomments, 71);
  assert.equal(parsedIssue[1].evaluation.expectedValueSats, 73500);

  const stdoutBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1052 --build', { encoding: 'utf8' });
  assert.ok(stdoutBuild.includes('Real-World Proof-of-Work Build Showcase'));
  assert.ok(stdoutBuild.includes('Off-Grid Solar-Assisted Sovereign Node & Thermodynamic Energy Harvesting Rig'));
  assert.ok(stdoutBuild.includes('Bill of Materials (BOM) & Hardware Specifications'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1058)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1568525\tStacker_Sports\t3\t1544\t2100\t21\t19.1\t232181\t4101\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,HOT\tWeekly Random Sports Pick 'em
1568946\tConstruction_and_Engineering\t2\t977\t5000\t7\t13.5\t9274\t27313\trecent@Construction_and_Engineering|top@Construction_and_Engineering\tOPEN_BOUNTY,SELF_POST_OPP\tShow Your Build Friday #1: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 2);

  const sportsItem = results[0];
  assert.equal(sportsItem.id, '1568525');
  assert.equal(sportsItem.sub, 'Stacker_Sports');
  assert.equal(sportsItem.tier, 3);
  assert.equal(sportsItem.score, 1544);
  assert.equal(sportsItem.bounty, 2100);
  assert.equal(sportsItem.ncomments, 21);
  assert.equal(sportsItem.ageHours, 19.1);
  assert.equal(sportsItem.opSince, '232181');
  assert.equal(sportsItem.opNitems, 4101);
  assert.deepEqual(sportsItem.hits, ['recent@Stacker_Sports', 'top@Stacker_Sports']);
  assert.deepEqual(sportsItem.tags, ['OPEN_BOUNTY', 'HOT']);
  assert.equal(sportsItem.title, "Weekly Random Sports Pick 'em");
  assert.equal(sportsItem.evaluation.isSportsPickEm, true);
  assert.equal(sportsItem.evaluation.isOpenBounty, true);
  assert.equal(sportsItem.evaluation.action, 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM');
  assert.equal(sportsItem.evaluation.priority, 'MEDIUM');
  assert.equal(sportsItem.evaluation.winProbability, 0.15);
  assert.equal(sportsItem.evaluation.expectedValueSats, 268);

  const buildItem = results[1];
  assert.equal(buildItem.id, '1568946');
  assert.equal(buildItem.sub, 'Construction_and_Engineering');
  assert.equal(buildItem.tier, 2);
  assert.equal(buildItem.score, 977);
  assert.equal(buildItem.bounty, 5000);
  assert.equal(buildItem.ncomments, 7);
  assert.equal(buildItem.ageHours, 13.5);
  assert.equal(buildItem.opSince, '9274');
  assert.equal(buildItem.opNitems, 27313);
  assert.deepEqual(buildItem.hits, ['recent@Construction_and_Engineering', 'top@Construction_and_Engineering']);
  assert.deepEqual(buildItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(buildItem.evaluation.isBuildShowcase, true);
  assert.equal(buildItem.evaluation.isOpenBounty, true);
  assert.equal(buildItem.evaluation.isSelfPostOpp, true);
  assert.equal(buildItem.evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(buildItem.evaluation.priority, 'HIGH');
  assert.equal(buildItem.evaluation.winProbability, 0.5);
  assert.equal(buildItem.evaluation.expectedValueSats, 2500);
});

test('evaluateSportsPickEm - Weekly random sports pick em generator (Item #1568525)', () => {
  const item = {
    id: '1568525',
    sub: 'Stacker_Sports',
    title: "Weekly Random Sports Pick 'em"
  };

  const sportsPkg = evaluateSportsPickEm(item);
  assert.equal(sportsPkg.itemId, '1568525');
  assert.equal(sportsPkg.league, 'Multi-Sport Cross-League Selection');
  assert.equal(sportsPkg.roundName, 'Weekly Random Sports Slate');
  assert.equal(sportsPkg.fixtures.length, 4);
  assert.ok(sportsPkg.tiebreaker.includes('Total Cumulative Slate Points'));
  assert.ok(sportsPkg.submissionMarkdown.includes("Weekly Random Sports Slate Pick'Em Submission"));
  assert.ok(sportsPkg.submissionMarkdown.includes('Kansas City Chiefs vs Baltimore Ravens'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Arsenal vs Brighton & Hove Albion'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Sydney Swans vs Port Adelaide Power'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Georgia Bulldogs vs Clemson Tigers'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Tie-Breaker Metric'));

  const customSportsPkg = evaluateSportsPickEm(item, {
    league: 'Global Sports Showcase',
    roundName: 'Invitational Round',
    tiebreaker: 'Total Score: 205 pts'
  });
  assert.equal(customSportsPkg.league, 'Global Sports Showcase');
  assert.equal(customSportsPkg.roundName, 'Invitational Round');
  assert.equal(customSportsPkg.tiebreaker, 'Total Score: 205 pts');
  assert.ok(customSportsPkg.submissionMarkdown.includes('Global Sports Showcase'));
  assert.ok(customSportsPkg.submissionMarkdown.includes('Total Score: 205 pts'));
});

test('CLI - Issue #1058 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1058 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 2);
  assert.equal(parsedIssue[0].id, '1568525');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 2100);
  assert.equal(parsedIssue[0].evaluation.isSportsPickEm, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 268);
  assert.equal(parsedIssue[1].id, '1568946');
  assert.equal(parsedIssue[1].sub, 'Construction_and_Engineering');
  assert.equal(parsedIssue[1].bounty, 5000);
  assert.equal(parsedIssue[1].ncomments, 7);
  assert.equal(parsedIssue[1].evaluation.expectedValueSats, 2500);

  const stdoutSports = execSync('node scripts/sn_bounty_processor.mjs --issue 1058 --sports', { encoding: 'utf8' });
  assert.ok(stdoutSports.includes('Sports Pick Em Strategy'));
  assert.ok(stdoutSports.includes("Weekly Random Sports Slate Pick'Em Submission"));
  assert.ok(stdoutSports.includes('Kansas City Chiefs vs Baltimore Ravens'));

  const stdoutBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1058 --build', { encoding: 'utf8' });
  assert.ok(stdoutBuild.includes('Real-World Proof-of-Work Build Showcase'));
  assert.ok(stdoutBuild.includes('Off-Grid Solar-Assisted Sovereign Node & Thermodynamic Energy Harvesting Rig'));
  assert.ok(stdoutBuild.includes('Bill of Materials (BOM) & Hardware Specifications'));

  const stdoutFilterSports = execSync('node scripts/sn_bounty_processor.mjs --issue 1058 --filter 1568525 --json', { encoding: 'utf8' });
  const parsedFilterSports = JSON.parse(stdoutFilterSports);
  assert.equal(parsedFilterSports.length, 1);
  assert.equal(parsedFilterSports[0].id, '1568525');

  const stdoutFilterBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1058 --filter 1568946 --json', { encoding: 'utf8' });
  const parsedFilterBuild = JSON.parse(stdoutFilterBuild);
  assert.equal(parsedFilterBuild.length, 1);
  assert.equal(parsedFilterBuild[0].id, '1568946');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1058 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1053)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1568946\tConstruction_and_Engineering\t2\t874\t5000\t3\t3.0\t9274\t27301\trecent@Construction_and_Engineering|top@Construction_and_Engineering\tOPEN_BOUNTY,LOW_COMP,SIGNAL\tShow Your Build Friday #1: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨
1567486\tmath\t2\t6889\t700000\t71\t31.9\t48657\t15281\trecent@math\tOPEN_BOUNTY,HOT\t[Math Puzzle] Does every sequence terminate in a loop?
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 2);

  const buildItem = results[0];
  assert.equal(buildItem.id, '1568946');
  assert.equal(buildItem.sub, 'Construction_and_Engineering');
  assert.equal(buildItem.tier, 2);
  assert.equal(buildItem.score, 874);
  assert.equal(buildItem.bounty, 5000);
  assert.equal(buildItem.ncomments, 3);
  assert.equal(buildItem.ageHours, 3.0);
  assert.equal(buildItem.opSince, '9274');
  assert.equal(buildItem.opNitems, 27301);
  assert.deepEqual(buildItem.hits, ['recent@Construction_and_Engineering', 'top@Construction_and_Engineering']);
  assert.deepEqual(buildItem.tags, ['OPEN_BOUNTY', 'LOW_COMP', 'SIGNAL']);
  assert.equal(buildItem.evaluation.isBuildShowcase, true);
  assert.equal(buildItem.evaluation.isOpenBounty, true);
  assert.equal(buildItem.evaluation.isSignal, true);
  assert.equal(buildItem.evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(buildItem.evaluation.priority, 'HIGH');
  assert.equal(buildItem.evaluation.winProbability, 0.809);
  assert.equal(buildItem.evaluation.expectedValueSats, 4045);

  const mathItem = results[1];
  assert.equal(mathItem.id, '1567486');
  assert.equal(mathItem.sub, 'math');
  assert.equal(mathItem.tier, 2);
  assert.equal(mathItem.score, 6889);
  assert.equal(mathItem.bounty, 700000);
  assert.equal(mathItem.ncomments, 71);
  assert.equal(mathItem.ageHours, 31.9);
  assert.equal(mathItem.opSince, '48657');
  assert.equal(mathItem.opNitems, 15281);
  assert.deepEqual(mathItem.hits, ['recent@math']);
  assert.deepEqual(mathItem.tags, ['OPEN_BOUNTY', 'HOT']);
  assert.equal(mathItem.evaluation.isMathPuzzle, true);
  assert.equal(mathItem.evaluation.isOpenBounty, true);
  assert.equal(mathItem.evaluation.action, 'ANALYZE_AND_SUBMIT_MATH_PUZZLE');
  assert.equal(mathItem.evaluation.priority, 'CRITICAL');
  assert.equal(mathItem.evaluation.winProbability, 0.105);
  assert.equal(mathItem.evaluation.expectedValueSats, 73500);
});

test('CLI - Issue #1053 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1053 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 2);
  assert.equal(parsedIssue[0].id, '1568946');
  assert.equal(parsedIssue[0].sub, 'Construction_and_Engineering');
  assert.equal(parsedIssue[0].bounty, 5000);
  assert.equal(parsedIssue[0].evaluation.isBuildShowcase, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 4045);
  assert.equal(parsedIssue[1].id, '1567486');
  assert.equal(parsedIssue[1].sub, 'math');
  assert.equal(parsedIssue[1].bounty, 700000);
  assert.equal(parsedIssue[1].ncomments, 71);
  assert.equal(parsedIssue[1].evaluation.expectedValueSats, 73500);

  const stdoutBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1053 --build', { encoding: 'utf8' });
  assert.ok(stdoutBuild.includes('Real-World Proof-of-Work Build Showcase'));
  assert.ok(stdoutBuild.includes('Off-Grid Solar-Assisted Sovereign Node & Thermodynamic Energy Harvesting Rig'));
  assert.ok(stdoutBuild.includes('Bill of Materials (BOM) & Hardware Specifications'));

  const stdoutMath = execSync('node scripts/sn_bounty_processor.mjs --issue 1053 --math', { encoding: 'utf8' });
  assert.ok(stdoutMath.includes('Mathematical Puzzle Analysis Strategy'));
  assert.ok(stdoutMath.includes('The Collatz Conjecture (3x + 1 Problem / Syracuse Algorithm)'));
  assert.ok(stdoutMath.includes('Empirical Trajectory Simulation & Loop Telemetry'));

  const stdoutFilterBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1053 --filter 1568946 --json', { encoding: 'utf8' });
  const parsedFilterBuild = JSON.parse(stdoutFilterBuild);
  assert.equal(parsedFilterBuild.length, 1);
  assert.equal(parsedFilterBuild[0].id, '1568946');

  const stdoutFilterMath = execSync('node scripts/sn_bounty_processor.mjs --issue 1053 --filter 1567486 --json', { encoding: 'utf8' });
  const parsedFilterMath = JSON.parse(stdoutFilterMath);
  assert.equal(parsedFilterMath.length, 1);
  assert.equal(parsedFilterMath[0].id, '1567486');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1053 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1061)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1568946\tConstruction_and_Engineering\t2\t977\t5000\t7\t16.9\t9274\t27317\trecent@Construction_and_Engineering|top@Construction_and_Engineering\tOPEN_BOUNTY,SELF_POST_OPP\tShow Your Build Friday #1: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const buildItem = results[0];
  assert.equal(buildItem.id, '1568946');
  assert.equal(buildItem.sub, 'Construction_and_Engineering');
  assert.equal(buildItem.tier, 2);
  assert.equal(buildItem.score, 977);
  assert.equal(buildItem.bounty, 5000);
  assert.equal(buildItem.ncomments, 7);
  assert.equal(buildItem.ageHours, 16.9);
  assert.equal(buildItem.opSince, '9274');
  assert.equal(buildItem.opNitems, 27317);
  assert.deepEqual(buildItem.hits, ['recent@Construction_and_Engineering', 'top@Construction_and_Engineering']);
  assert.deepEqual(buildItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(buildItem.evaluation.isBuildShowcase, true);
  assert.equal(buildItem.evaluation.isOpenBounty, true);
  assert.equal(buildItem.evaluation.isSelfPostOpp, true);
  assert.equal(buildItem.evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(buildItem.evaluation.priority, 'HIGH');
  assert.equal(buildItem.evaluation.winProbability, 0.5);
  assert.equal(buildItem.evaluation.expectedValueSats, 2500);
});

test('CLI - Issue #1061 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1061 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1568946');
  assert.equal(parsedIssue[0].sub, 'Construction_and_Engineering');
  assert.equal(parsedIssue[0].bounty, 5000);
  assert.equal(parsedIssue[0].evaluation.isBuildShowcase, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 2500);

  const stdoutBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1061 --build', { encoding: 'utf8' });
  assert.ok(stdoutBuild.includes('Real-World Proof-of-Work Build Showcase'));
  assert.ok(stdoutBuild.includes('Off-Grid Solar-Assisted Sovereign Node & Thermodynamic Energy Harvesting Rig'));
  assert.ok(stdoutBuild.includes('Bill of Materials (BOM) & Hardware Specifications'));

  const stdoutFilterBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1061 --filter 1568946 --json', { encoding: 'utf8' });
  const parsedFilterBuild = JSON.parse(stdoutFilterBuild);
  assert.equal(parsedFilterBuild.length, 1);
  assert.equal(parsedFilterBuild[0].id, '1568946');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1061 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1063)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1568946\tConstruction_and_Engineering\t2\t977\t5000\t7\t19.9\t9274\t27321\trecent@Construction_and_Engineering|top@Construction_and_Engineering\tOPEN_BOUNTY,SELF_POST_OPP\tShow Your Build Friday #1: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const buildItem = results[0];
  assert.equal(buildItem.id, '1568946');
  assert.equal(buildItem.sub, 'Construction_and_Engineering');
  assert.equal(buildItem.tier, 2);
  assert.equal(buildItem.score, 977);
  assert.equal(buildItem.bounty, 5000);
  assert.equal(buildItem.ncomments, 7);
  assert.equal(buildItem.ageHours, 19.9);
  assert.equal(buildItem.opSince, '9274');
  assert.equal(buildItem.opNitems, 27321);
  assert.deepEqual(buildItem.hits, ['recent@Construction_and_Engineering', 'top@Construction_and_Engineering']);
  assert.deepEqual(buildItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(buildItem.evaluation.isBuildShowcase, true);
  assert.equal(buildItem.evaluation.isOpenBounty, true);
  assert.equal(buildItem.evaluation.isSelfPostOpp, true);
  assert.equal(buildItem.evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(buildItem.evaluation.priority, 'HIGH');
  assert.equal(buildItem.evaluation.winProbability, 0.5);
  assert.equal(buildItem.evaluation.expectedValueSats, 2500);
});

test('CLI - Issue #1063 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1063 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1568946');
  assert.equal(parsedIssue[0].sub, 'Construction_and_Engineering');
  assert.equal(parsedIssue[0].bounty, 5000);
  assert.equal(parsedIssue[0].evaluation.isBuildShowcase, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 2500);

  const stdoutBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1063 --build', { encoding: 'utf8' });
  assert.ok(stdoutBuild.includes('Real-World Proof-of-Work Build Showcase'));
  assert.ok(stdoutBuild.includes('Off-Grid Solar-Assisted Sovereign Node & Thermodynamic Energy Harvesting Rig'));
  assert.ok(stdoutBuild.includes('Bill of Materials (BOM) & Hardware Specifications'));

  const stdoutFilterBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1063 --filter 1568946 --json', { encoding: 'utf8' });
  const parsedFilterBuild = JSON.parse(stdoutFilterBuild);
  assert.equal(parsedFilterBuild.length, 1);
  assert.equal(parsedFilterBuild[0].id, '1568946');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1063 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1064)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1568946\tConstruction_and_Engineering\t2\t977\t5000\t7\t22.1\t9274\t27326\trecent@Construction_and_Engineering|top@Construction_and_Engineering\tOPEN_BOUNTY,SELF_POST_OPP\tShow Your Build Friday #1: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const buildItem = results[0];
  assert.equal(buildItem.id, '1568946');
  assert.equal(buildItem.sub, 'Construction_and_Engineering');
  assert.equal(buildItem.tier, 2);
  assert.equal(buildItem.score, 977);
  assert.equal(buildItem.bounty, 5000);
  assert.equal(buildItem.ncomments, 7);
  assert.equal(buildItem.ageHours, 22.1);
  assert.equal(buildItem.opSince, '9274');
  assert.equal(buildItem.opNitems, 27326);
  assert.deepEqual(buildItem.hits, ['recent@Construction_and_Engineering', 'top@Construction_and_Engineering']);
  assert.deepEqual(buildItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(buildItem.evaluation.isBuildShowcase, true);
  assert.equal(buildItem.evaluation.isOpenBounty, true);
  assert.equal(buildItem.evaluation.isSelfPostOpp, true);
  assert.equal(buildItem.evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(buildItem.evaluation.priority, 'HIGH');
  assert.equal(buildItem.evaluation.winProbability, 0.5);
  assert.equal(buildItem.evaluation.expectedValueSats, 2500);
});

test('CLI - Issue #1064 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1064 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1568946');
  assert.equal(parsedIssue[0].sub, 'Construction_and_Engineering');
  assert.equal(parsedIssue[0].bounty, 5000);
  assert.equal(parsedIssue[0].evaluation.isBuildShowcase, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 2500);

  const stdoutBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1064 --build', { encoding: 'utf8' });
  assert.ok(stdoutBuild.includes('Real-World Proof-of-Work Build Showcase'));
  assert.ok(stdoutBuild.includes('Off-Grid Solar-Assisted Sovereign Node & Thermodynamic Energy Harvesting Rig'));
  assert.ok(stdoutBuild.includes('Bill of Materials (BOM) & Hardware Specifications'));

  const stdoutFilterBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1064 --filter 1568946 --json', { encoding: 'utf8' });
  const parsedFilterBuild = JSON.parse(stdoutFilterBuild);
  assert.equal(parsedFilterBuild.length, 1);
  assert.equal(parsedFilterBuild[0].id, '1568946');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1064 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1064 snapshot and Construction_and_Engineering detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-12T19-13-05.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1568946'));
  assert.ok(snapshotContent.includes('Construction_and_Engineering'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1091)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1568946\tConstruction_and_Engineering\t2\t977\t5000\t7\t25.0\t9274\t27333\trecent@Construction_and_Engineering\tOPEN_BOUNTY,SELF_POST_OPP\tShow Your Build Friday #1: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const buildItem = results[0];
  assert.equal(buildItem.id, '1568946');
  assert.equal(buildItem.sub, 'Construction_and_Engineering');
  assert.equal(buildItem.tier, 2);
  assert.equal(buildItem.score, 977);
  assert.equal(buildItem.bounty, 5000);
  assert.equal(buildItem.ncomments, 7);
  assert.equal(buildItem.ageHours, 25.0);
  assert.equal(buildItem.opSince, '9274');
  assert.equal(buildItem.opNitems, 27333);
  assert.deepEqual(buildItem.hits, ['recent@Construction_and_Engineering']);
  assert.deepEqual(buildItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(buildItem.evaluation.isBuildShowcase, true);
  assert.equal(buildItem.evaluation.isOpenBounty, true);
  assert.equal(buildItem.evaluation.isSelfPostOpp, true);
  assert.equal(buildItem.evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(buildItem.evaluation.priority, 'HIGH');
  assert.equal(buildItem.evaluation.winProbability, 0.35);
  assert.equal(buildItem.evaluation.expectedValueSats, 1750);
});

test('CLI - Issue #1091 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1091 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1568946');
  assert.equal(parsedIssue[0].sub, 'Construction_and_Engineering');
  assert.equal(parsedIssue[0].bounty, 5000);
  assert.equal(parsedIssue[0].evaluation.isBuildShowcase, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 1750);

  const stdoutBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1091 --build', { encoding: 'utf8' });
  assert.ok(stdoutBuild.includes('Real-World Proof-of-Work Build Showcase'));
  assert.ok(stdoutBuild.includes('Off-Grid Solar-Assisted Sovereign Node & Thermodynamic Energy Harvesting Rig'));
  assert.ok(stdoutBuild.includes('Bill of Materials (BOM) & Hardware Specifications'));

  const stdoutFilterBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1091 --filter 1568946 --json', { encoding: 'utf8' });
  const parsedFilterBuild = JSON.parse(stdoutFilterBuild);
  assert.equal(parsedFilterBuild.length, 1);
  assert.equal(parsedFilterBuild[0].id, '1568946');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1091 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1054)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1568946\tConstruction_and_Engineering\t2\t977\t5000\t7\t8.5\t9274\t27305\trecent@Construction_and_Engineering|top@Construction_and_Engineering\tOPEN_BOUNTY,SIGNAL,SELF_POST_OPP\tShow Your Build Friday #1: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const buildItem = results[0];
  assert.equal(buildItem.id, '1568946');
  assert.equal(buildItem.sub, 'Construction_and_Engineering');
  assert.equal(buildItem.tier, 2);
  assert.equal(buildItem.score, 977);
  assert.equal(buildItem.bounty, 5000);
  assert.equal(buildItem.ncomments, 7);
  assert.equal(buildItem.ageHours, 8.5);
  assert.equal(buildItem.opSince, '9274');
  assert.equal(buildItem.opNitems, 27305);
  assert.deepEqual(buildItem.hits, ['recent@Construction_and_Engineering', 'top@Construction_and_Engineering']);
  assert.deepEqual(buildItem.tags, ['OPEN_BOUNTY', 'SIGNAL', 'SELF_POST_OPP']);
  assert.equal(buildItem.evaluation.isBuildShowcase, true);
  assert.equal(buildItem.evaluation.isOpenBounty, true);
  assert.equal(buildItem.evaluation.isSignal, true);
  assert.equal(buildItem.evaluation.isSelfPostOpp, true);
  assert.equal(buildItem.evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(buildItem.evaluation.priority, 'HIGH');
  assert.equal(buildItem.evaluation.winProbability, 0.525);
  assert.equal(buildItem.evaluation.expectedValueSats, 2625);
});

test('CLI - Issue #1054 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1054 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1568946');
  assert.equal(parsedIssue[0].sub, 'Construction_and_Engineering');
  assert.equal(parsedIssue[0].bounty, 5000);
  assert.equal(parsedIssue[0].evaluation.isBuildShowcase, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 2625);

  const stdoutBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1054 --build', { encoding: 'utf8' });
  assert.ok(stdoutBuild.includes('Real-World Proof-of-Work Build Showcase'));
  assert.ok(stdoutBuild.includes('Off-Grid Solar-Assisted Sovereign Node & Thermodynamic Energy Harvesting Rig'));
  assert.ok(stdoutBuild.includes('Bill of Materials (BOM) & Hardware Specifications'));

  const stdoutFilterBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1054 --filter 1568946 --json', { encoding: 'utf8' });
  const parsedFilterBuild = JSON.parse(stdoutFilterBuild);
  assert.equal(parsedFilterBuild.length, 1);
  assert.equal(parsedFilterBuild[0].id, '1568946');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1054 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1057)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1568946\tConstruction_and_Engineering\t2\t977\t5000\t7\t13.5\t9274\t27313\trecent@Construction_and_Engineering|top@Construction_and_Engineering\tOPEN_BOUNTY,SELF_POST_OPP\tShow Your Build Friday #1: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const buildItem = results[0];
  assert.equal(buildItem.id, '1568946');
  assert.equal(buildItem.sub, 'Construction_and_Engineering');
  assert.equal(buildItem.tier, 2);
  assert.equal(buildItem.score, 977);
  assert.equal(buildItem.bounty, 5000);
  assert.equal(buildItem.ncomments, 7);
  assert.equal(buildItem.ageHours, 13.5);
  assert.equal(buildItem.opSince, '9274');
  assert.equal(buildItem.opNitems, 27313);
  assert.deepEqual(buildItem.hits, ['recent@Construction_and_Engineering', 'top@Construction_and_Engineering']);
  assert.deepEqual(buildItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(buildItem.evaluation.isBuildShowcase, true);
  assert.equal(buildItem.evaluation.isOpenBounty, true);
  assert.equal(buildItem.evaluation.isSignal, false);
  assert.equal(buildItem.evaluation.isSelfPostOpp, true);
  assert.equal(buildItem.evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(buildItem.evaluation.priority, 'HIGH');
  assert.equal(buildItem.evaluation.winProbability, 0.5);
  assert.equal(buildItem.evaluation.expectedValueSats, 2500);
});

test('CLI - Issue #1057 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1057 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1568946');
  assert.equal(parsedIssue[0].sub, 'Construction_and_Engineering');
  assert.equal(parsedIssue[0].bounty, 5000);
  assert.equal(parsedIssue[0].evaluation.isBuildShowcase, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_BUILD_SHOWCASE');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 2500);

  const stdoutBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1057 --build', { encoding: 'utf8' });
  assert.ok(stdoutBuild.includes('Real-World Proof-of-Work Build Showcase'));
  assert.ok(stdoutBuild.includes('Off-Grid Solar-Assisted Sovereign Node & Thermodynamic Energy Harvesting Rig'));
  assert.ok(stdoutBuild.includes('Bill of Materials (BOM) & Hardware Specifications'));

  const stdoutFilterBuild = execSync('node scripts/sn_bounty_processor.mjs --issue 1057 --filter 1568946 --json', { encoding: 'utf8' });
  const parsedFilterBuild = JSON.parse(stdoutFilterBuild);
  assert.equal(parsedFilterBuild.length, 1);
  assert.equal(parsedFilterBuild[0].id, '1568946');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1057 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1101)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1570125\tStacker_Stocks\t2\t265\t10000\t13\t12.0\t9274\t27385\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,SIGNAL,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 30k sat award!
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1570125');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 265);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 13);
  assert.equal(contestItem.ageHours, 12.0);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27385);
  assert.deepEqual(contestItem.hits, ['recent@Stacker_Stocks', 'top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'SIGNAL', 'SELF_POST_OPP']);
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, true);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'HIGH');
  assert.equal(contestItem.evaluation.winProbability, 0.315);
  assert.equal(contestItem.evaluation.expectedValueSats, 3150);
});

test('evaluateWeeklyCloseContest - Sunday Weekly Close Contest Generator (Item #1570125)', () => {
  const item = {
    id: '1570125',
    sub: 'Stacker_Stocks',
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 30k sat award!'
  };

  const bullishEntry = evaluateWeeklyCloseContest(item, { direction: 'BULLISH' });
  assert.equal(bullishEntry.itemId, '1570125');
  assert.equal(bullishEntry.direction, 'GREEN / BULLISH');
  assert.ok(bullishEntry.submissionMarkdown.includes('Weekly Close Contest Entry (GREEN / BULLISH)'));
  assert.ok(bullishEntry.submissionMarkdown.includes('Contest Submission for Item #1570125'));
  assert.ok(bullishEntry.submissionMarkdown.includes('S&P 500 (SPX)'));

  const bearishEntry = evaluateWeeklyCloseContest(item, { direction: 'BEARISH' });
  assert.equal(bearishEntry.direction, 'RED / BEARISH');
  assert.ok(bearishEntry.submissionMarkdown.includes('Weekly Close Contest Entry (RED / BEARISH)'));
});

test('CLI - Issue #1101 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1101 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1570125');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 3150);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1101 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1101 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1101 --filter 1570125 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1570125');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1101 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1099)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1570125\tStacker_Stocks\t2\t241\t10000\t9\t9.0\t9274\t27373\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,SIGNAL,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 30k sat award!
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1570125');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 241);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 9);
  assert.equal(contestItem.ageHours, 9.0);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27373);
  assert.deepEqual(contestItem.hits, ['recent@Stacker_Stocks', 'top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'SIGNAL', 'SELF_POST_OPP']);
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, true);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'CRITICAL');
  assert.equal(contestItem.evaluation.winProbability, 0.525);
  assert.equal(contestItem.evaluation.expectedValueSats, 5250);
});

test('CLI - Issue #1099 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1099 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1570125');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 5250);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1099 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1099 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1099 --filter 1570125 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1570125');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1099 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Stacker_Stocks Tier 2 configuration and OPEN_BOUNTY detection invariants', () => {
  const subsConfigPath = path.resolve('scripts/sn_subs_config.mjs');
  const radarPath = path.resolve('scripts/sn_radar_v2.mjs');

  assert.ok(fs.existsSync(subsConfigPath));
  assert.ok(fs.existsSync(radarPath));

  const subsContent = fs.readFileSync(subsConfigPath, 'utf8');
  assert.ok(subsContent.includes('Stacker_Stocks'));

  const radarContent = fs.readFileSync(radarPath, 'utf8');
  assert.ok(radarContent.includes('TIER_2'));
  assert.ok(radarContent.includes('OPEN_BOUNTY'));
  assert.ok(radarContent.includes('MIN_BOUNTY_SATS'));
  assert.ok(radarContent.includes("'recent'"));
  assert.ok(radarContent.includes("'top'"));

  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-13T19-22-18.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1570125'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1103)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1570125\tStacker_Stocks\t2\t286\t10000\t14\t14.6\t9274\t27387\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 30k sat award!
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1570125');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 286);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 14);
  assert.equal(contestItem.ageHours, 14.6);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27387);
  assert.deepEqual(contestItem.hits, ['recent@Stacker_Stocks', 'top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, false);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'HIGH');
  assert.equal(contestItem.evaluation.winProbability, 0.3);
  assert.equal(contestItem.evaluation.expectedValueSats, 3000);
});

test('CLI - Issue #1103 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1103 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1570125');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'HIGH');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 3000);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1103 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1103 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1103 --filter 1570125 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1570125');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1103 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1103 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-14T00-58-07.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1570125'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1105)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1570125\tStacker_Stocks\t2\t286\t10000\t17\t19.7\t9274\t27390\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 30k sat award!
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1570125');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 286);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 17);
  assert.equal(contestItem.ageHours, 19.7);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27390);
  assert.deepEqual(contestItem.hits, ['recent@Stacker_Stocks', 'top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, false);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'HIGH');
  assert.equal(contestItem.evaluation.winProbability, 0.3);
  assert.equal(contestItem.evaluation.expectedValueSats, 3000);
});

test('CLI - Issue #1105 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1105 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1570125');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'HIGH');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 3000);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1105 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1105 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1105 --filter 1570125 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1570125');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1105 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1105 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-14T06-07-15.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1570125'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1097)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1570125\tStacker_Stocks\t2\t220\t10000\t6\t5.8\t9274\t27362\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,SIGNAL,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 30k sat award!
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1570125');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 220);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 6);
  assert.equal(contestItem.ageHours, 5.8);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27362);
  assert.deepEqual(contestItem.hits, ['recent@Stacker_Stocks', 'top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'SIGNAL', 'SELF_POST_OPP']);
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, true);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'CRITICAL');
  assert.equal(contestItem.evaluation.winProbability, 0.525);
  assert.equal(contestItem.evaluation.expectedValueSats, 5250);
});

test('CLI - Issue #1097 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1097 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1570125');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 5250);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1097 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1097 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1097 --filter 1570125 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1570125');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1097 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1097 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-13T16-09-05.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1570125'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1113)', () => {
  const tsvInput = `1570125\tStacker_Stocks\t2\t286\t10000\t17\t26.2\t9274\t27400\trecent@Stacker_Stocks\tOPEN_BOUNTY,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 30k sat award!
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1570125');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 286);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 17);
  assert.equal(contestItem.ageHours, 26.2);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27400);
  assert.deepEqual(contestItem.hits, ['recent@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, false);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'HIGH');
  assert.equal(contestItem.evaluation.winProbability, 0.21);
  assert.equal(contestItem.evaluation.expectedValueSats, 2100);
});

test('CLI - Issue #1113 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1113 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1570125');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].ncomments, 17);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'HIGH');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 2100);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1113 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1113 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1113 --filter 1570125 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1570125');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1113 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1113 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-14T12-34-50.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1570125'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1115)', () => {
  const tsvInput = `1570125\tStacker_Stocks\t2\t286\t10000\t17\t27.5\t9274\t27409\trecent@Stacker_Stocks\tOPEN_BOUNTY,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 30k sat award!
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1570125');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 286);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 17);
  assert.equal(contestItem.ageHours, 27.5);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27409);
  assert.deepEqual(contestItem.hits, ['recent@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, false);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'HIGH');
  assert.equal(contestItem.evaluation.winProbability, 0.21);
  assert.equal(contestItem.evaluation.expectedValueSats, 2100);
});

test('CLI - Issue #1115 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1115 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1570125');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].ncomments, 17);
  assert.equal(parsedIssue[0].ageHours, 27.5);
  assert.equal(parsedIssue[0].opNitems, 27409);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'HIGH');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 2100);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1115 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1115 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1115 --filter 1570125 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1570125');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1115 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1115 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-14T13-54-29.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1570125'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1116)', () => {
  const tsvInput = `1570125\tStacker_Stocks\t2\t286\t10000\t17\t32.9\t9274\t27415\trecent@Stacker_Stocks\tOPEN_BOUNTY,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 30k sat award!
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1570125');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 286);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 17);
  assert.equal(contestItem.ageHours, 32.9);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27415);
  assert.deepEqual(contestItem.hits, ['recent@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, false);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'HIGH');
  assert.equal(contestItem.evaluation.winProbability, 0.21);
  assert.equal(contestItem.evaluation.expectedValueSats, 2100);
});

test('CLI - Issue #1116 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1116 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1570125');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].ncomments, 17);
  assert.equal(parsedIssue[0].ageHours, 32.9);
  assert.equal(parsedIssue[0].opNitems, 27415);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'HIGH');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 2100);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1116 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1116 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1116 --filter 1570125 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1570125');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1116 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1116 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-14T19-16-12.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1570125'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1120)', () => {
  const tsvInput = `1572038\tStacker_Sports\t3\t422\t4000\t2\t2.6\t54354\t6661\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,LOW_COMP,SIGNAL\tAFL finals week four pickem 4000 SATS!
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const sportsItem = results[0];
  assert.equal(sportsItem.id, '1572038');
  assert.equal(sportsItem.sub, 'Stacker_Sports');
  assert.equal(sportsItem.tier, 3);
  assert.equal(sportsItem.score, 422);
  assert.equal(sportsItem.bounty, 4000);
  assert.equal(sportsItem.ncomments, 2);
  assert.equal(sportsItem.ageHours, 2.6);
  assert.equal(sportsItem.opSince, '54354');
  assert.equal(sportsItem.opNitems, 6661);
  assert.deepEqual(sportsItem.hits, ['recent@Stacker_Sports', 'top@Stacker_Sports']);
  assert.deepEqual(sportsItem.tags, ['OPEN_BOUNTY', 'LOW_COMP', 'SIGNAL']);
  assert.equal(sportsItem.title, 'AFL finals week four pickem 4000 SATS!');
  assert.equal(sportsItem.evaluation.isSportsPickEm, true);
  assert.equal(sportsItem.evaluation.isOpenBounty, true);
  assert.equal(sportsItem.evaluation.isSignal, true);
  assert.equal(sportsItem.evaluation.action, 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM');
  assert.equal(sportsItem.evaluation.priority, 'HIGH');
  assert.equal(sportsItem.evaluation.winProbability, 0.95);
  assert.equal(sportsItem.evaluation.expectedValueSats, 3230);
});

test('evaluateSportsPickEm - AFL Finals Week 4 Grand Final generator (Item #1572038)', () => {
  const item = {
    id: '1572038',
    sub: 'Stacker_Sports',
    title: 'AFL finals week four pickem 4000 SATS!'
  };

  const sportsPkg = evaluateSportsPickEm(item);
  assert.equal(sportsPkg.itemId, '1572038');
  assert.equal(sportsPkg.league, 'AFL (Australian Football League)');
  assert.equal(sportsPkg.roundName, 'Finals Week 4 (Grand Final)');
  assert.equal(sportsPkg.fixtures.length, 1);
  assert.equal(sportsPkg.fixtures[0].match, 'Sydney Swans vs Brisbane Lions');
  assert.equal(sportsPkg.fixtures[0].venue, 'Melbourne Cricket Ground (MCG)');
  assert.equal(sportsPkg.fixtures[0].prediction, 'Sydney Swans by 14 points');
  assert.equal(sportsPkg.fixtures[0].margin, '11-20 pts');
  assert.equal(sportsPkg.fixtures[0].firstGoalscorer, 'Isaac Heeney');
  assert.ok(sportsPkg.tiebreaker.includes('Total Cumulative Match Points: 168 pts'));
  assert.ok(sportsPkg.submissionMarkdown.includes("Finals Week 4 (Grand Final) Pick'Em Submission"));
  assert.ok(sportsPkg.submissionMarkdown.includes('Sydney Swans vs Brisbane Lions'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Melbourne Cricket Ground (MCG)'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Tie-Breaker Metric'));

  const customSportsPkg = evaluateSportsPickEm(item, {
    league: 'AFL Grand Final Special',
    roundName: 'Premiership Decider',
    tiebreaker: 'Total Score: 172 pts'
  });
  assert.equal(customSportsPkg.league, 'AFL Grand Final Special');
  assert.equal(customSportsPkg.roundName, 'Premiership Decider');
  assert.equal(customSportsPkg.tiebreaker, 'Total Score: 172 pts');
});

test('CLI - Issue #1120 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1120 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1572038');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 4000);
  assert.equal(parsedIssue[0].ncomments, 2);
  assert.equal(parsedIssue[0].ageHours, 2.6);
  assert.equal(parsedIssue[0].opNitems, 6661);
  assert.equal(parsedIssue[0].evaluation.isSportsPickEm, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM');
  assert.equal(parsedIssue[0].evaluation.priority, 'HIGH');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 3230);

  const stdoutSports = execSync('node scripts/sn_bounty_processor.mjs --issue 1120 --sports', { encoding: 'utf8' });
  assert.ok(stdoutSports.includes('Sports Pick Em Strategy'));
  assert.ok(stdoutSports.includes("Finals Week 4 (Grand Final) Pick'Em Submission"));
  assert.ok(stdoutSports.includes('Sydney Swans vs Brisbane Lions'));
  assert.ok(stdoutSports.includes('Isaac Heeney'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1120 --filter 1572038 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1572038');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1120 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1120 snapshot and Stacker_Sports detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-15T11-36-57.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1572038'));
  assert.ok(snapshotContent.includes('Stacker_Sports'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('AFL finals week four pickem 4000 SATS!'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1122)', () => {
  const tsvInput = `1576236\tStacker_Sports\t3\t1437\t2100\t17\t17.5\t232181\t4160\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tWeekly Random Sports Pick 'em
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const sportsItem = results[0];
  assert.equal(sportsItem.id, '1576236');
  assert.equal(sportsItem.sub, 'Stacker_Sports');
  assert.equal(sportsItem.tier, 3);
  assert.equal(sportsItem.score, 1437);
  assert.equal(sportsItem.bounty, 2100);
  assert.equal(sportsItem.ncomments, 17);
  assert.equal(sportsItem.ageHours, 17.5);
  assert.equal(sportsItem.opSince, '232181');
  assert.equal(sportsItem.opNitems, 4160);
  assert.deepEqual(sportsItem.hits, ['recent@Stacker_Sports', 'top@Stacker_Sports']);
  assert.deepEqual(sportsItem.tags, ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP']);
  assert.equal(sportsItem.title, "Weekly Random Sports Pick 'em");
  assert.equal(sportsItem.evaluation.isSportsPickEm, true);
  assert.equal(sportsItem.evaluation.isOpenBounty, true);
  assert.equal(sportsItem.evaluation.isSelfPostOpp, true);
  assert.equal(sportsItem.evaluation.action, 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM');
  assert.equal(sportsItem.evaluation.priority, 'MEDIUM');
  assert.equal(sportsItem.evaluation.winProbability, 0.3);
  assert.equal(sportsItem.evaluation.expectedValueSats, 536);
});

test('evaluateSportsPickEm - Weekly random sports pick em generator (Item #1576236)', () => {
  const item = {
    id: '1576236',
    sub: 'Stacker_Sports',
    title: "Weekly Random Sports Pick 'em"
  };

  const sportsPkg = evaluateSportsPickEm(item);
  assert.equal(sportsPkg.itemId, '1576236');
  assert.equal(sportsPkg.league, 'Multi-Sport Cross-League Selection');
  assert.equal(sportsPkg.roundName, 'Weekly Random Sports Slate');
  assert.equal(sportsPkg.fixtures.length, 4);
  assert.equal(sportsPkg.fixtures[0].match, 'Kansas City Chiefs vs Baltimore Ravens (NFL)');
  assert.equal(sportsPkg.fixtures[0].venue, 'GEHA Field at Arrowhead Stadium');
  assert.equal(sportsPkg.fixtures[0].prediction, 'Kansas City Chiefs by 4 points');
  assert.equal(sportsPkg.fixtures[0].margin, '1-6 pts');
  assert.equal(sportsPkg.fixtures[0].firstGoalscorer, 'Travis Kelce');
  assert.equal(sportsPkg.fixtures[1].match, 'Arsenal vs Brighton & Hove Albion (Premier League)');
  assert.equal(sportsPkg.fixtures[1].venue, 'Emirates Stadium');
  assert.equal(sportsPkg.fixtures[1].prediction, 'Arsenal by 2 goals');
  assert.equal(sportsPkg.fixtures[2].match, 'Sydney Swans vs Port Adelaide Power (AFL)');
  assert.equal(sportsPkg.fixtures[3].match, 'Georgia Bulldogs vs Clemson Tigers (NCAA)');
  assert.ok(sportsPkg.tiebreaker.includes('Total Cumulative Slate Points: 186 pts'));
  assert.ok(sportsPkg.submissionMarkdown.includes("Weekly Random Sports Slate Pick'Em Submission"));
  assert.ok(sportsPkg.submissionMarkdown.includes('Kansas City Chiefs vs Baltimore Ravens'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Arsenal vs Brighton & Hove Albion'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Tie-Breaker Metric'));

  const customSportsPkg = evaluateSportsPickEm(item, {
    league: 'Cross-Sport Championship Decider',
    roundName: 'Invitational Pick Slate',
    tiebreaker: 'Total Slate Points: 195 pts'
  });
  assert.equal(customSportsPkg.league, 'Cross-Sport Championship Decider');
  assert.equal(customSportsPkg.roundName, 'Invitational Pick Slate');
  assert.equal(customSportsPkg.tiebreaker, 'Total Slate Points: 195 pts');
  assert.ok(customSportsPkg.submissionMarkdown.includes('Cross-Sport Championship Decider'));
  assert.ok(customSportsPkg.submissionMarkdown.includes('Total Slate Points: 195 pts'));
});

test('CLI - Issue #1122 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1122 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1576236');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 2100);
  assert.equal(parsedIssue[0].ncomments, 17);
  assert.equal(parsedIssue[0].ageHours, 17.5);
  assert.equal(parsedIssue[0].opNitems, 4160);
  assert.equal(parsedIssue[0].evaluation.isSportsPickEm, true);
  assert.equal(parsedIssue[0].evaluation.isSelfPostOpp, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM');
  assert.equal(parsedIssue[0].evaluation.priority, 'MEDIUM');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 536);

  const stdoutSports = execSync('node scripts/sn_bounty_processor.mjs --issue 1122 --sports', { encoding: 'utf8' });
  assert.ok(stdoutSports.includes('Sports Pick Em Strategy'));
  assert.ok(stdoutSports.includes("Weekly Random Sports Slate Pick'Em Submission"));
  assert.ok(stdoutSports.includes('Kansas City Chiefs vs Baltimore Ravens'));
  assert.ok(stdoutSports.includes('Arsenal vs Brighton & Hove Albion'));
  assert.ok(stdoutSports.includes('Travis Kelce'));

  const stdoutSelfPost = execSync('node scripts/sn_bounty_processor.mjs --issue 1122 --self-post', { encoding: 'utf8' });
  assert.ok(stdoutSelfPost.includes('Self-Post Opportunity Strategy'));
  assert.ok(stdoutSelfPost.includes('#1576236 ~Stacker_Sports'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1122 --filter 1576236 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1576236');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1122 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1122 snapshot and Stacker_Sports configuration verification', async () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-19T10-50-14.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const { TIER_3, TIER_OF } = await import('../scripts/sn_subs_config.mjs');
  assert.ok(TIER_3.includes('Stacker_Sports'));
  assert.equal(TIER_OF['Stacker_Sports'], 3);
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1124)', () => {
  const tsvInput = `1577504\tStacker_Stocks\t2\t51\t10000\t1\t0.3\t9274\t27632\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,LOW_COMP,FRESH\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1577504');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 51);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 1);
  assert.equal(contestItem.ageHours, 0.3);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27632);
  assert.deepEqual(contestItem.hits, ['recent@Stacker_Stocks', 'top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'LOW_COMP', 'FRESH']);
  assert.equal(contestItem.title, 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats');
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, false);
  assert.equal(contestItem.evaluation.isSelfPostOpp, false);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'CRITICAL');
  assert.equal(contestItem.evaluation.winProbability, 0.95);
  assert.equal(contestItem.evaluation.expectedValueSats, 9500);
});

test('evaluateWeeklyCloseContest - Sunday Weekly Close Contest Generator (Item #1577504)', () => {
  const item = {
    id: '1577504',
    sub: 'Stacker_Stocks',
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats'
  };

  const contestPkg = evaluateWeeklyCloseContest(item);
  assert.equal(contestPkg.itemId, '1577504');
  assert.equal(contestPkg.direction, 'GREEN / BULLISH');
  assert.equal(contestPkg.indexSymbol, 'S&P 500 (SPX)');
  assert.ok(contestPkg.submissionMarkdown.includes('Weekly Close Contest Entry (GREEN / BULLISH)'));
  assert.ok(contestPkg.submissionMarkdown.includes('Item #1577504'));
  assert.ok(contestPkg.submissionMarkdown.includes('Technical & Macro Rationale'));

  const bearishPkg = evaluateWeeklyCloseContest(item, { direction: 'BEARISH', targetPrice: '$5,580' });
  assert.equal(bearishPkg.direction, 'RED / BEARISH');
  assert.equal(bearishPkg.targetPrice, '$5,580');
  assert.ok(bearishPkg.submissionMarkdown.includes('Weekly Close Contest Entry (RED / BEARISH)'));
});

test('CLI - Issue #1124 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1124 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1577504');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].ncomments, 1);
  assert.equal(parsedIssue[0].ageHours, 0.3);
  assert.equal(parsedIssue[0].opNitems, 27632);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.winProbability, 0.95);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 9500);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1124 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1124 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1124 --filter 1577504 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1577504');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1124 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1124 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-20T11-15-35.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1577504'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1127)', () => {
  const tsvInput = `1577504\tStacker_Stocks\t2\t300\t10000\t3\t5.0\t9274\t27633\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,LOW_COMP,SIGNAL\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1577504');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 300);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 3);
  assert.equal(contestItem.ageHours, 5.0);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27633);
  assert.deepEqual(contestItem.hits, ['recent@Stacker_Stocks', 'top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'LOW_COMP', 'SIGNAL']);
  assert.equal(contestItem.title, 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats');
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, true);
  assert.equal(contestItem.evaluation.isSelfPostOpp, false);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'CRITICAL');
  assert.equal(contestItem.evaluation.winProbability, 0.809);
  assert.equal(contestItem.evaluation.expectedValueSats, 8090);
});

test('CLI - Issue #1127 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1127 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1577504');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].ncomments, 3);
  assert.equal(parsedIssue[0].ageHours, 5);
  assert.equal(parsedIssue[0].opNitems, 27633);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.winProbability, 0.809);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 8090);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1127 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1127 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1127 --filter 1577504 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1577504');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1127 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1127 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-20T15-58-14.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1577504'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('SIGNAL'));
  assert.ok(snapshotContent.includes('Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1128)', () => {
  const tsvInput = `1577504\tStacker_Stocks\t2\t300\t10000\t4\t7.8\t9274\t27648\ttop@Stacker_Stocks\tOPEN_BOUNTY,LOW_COMP,SIGNAL\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1577504');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 300);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 4);
  assert.equal(contestItem.ageHours, 7.8);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27648);
  assert.deepEqual(contestItem.hits, ['top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'LOW_COMP', 'SIGNAL']);
  assert.equal(contestItem.title, 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats');
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, true);
  assert.equal(contestItem.evaluation.isSelfPostOpp, false);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'CRITICAL');
  assert.equal(contestItem.evaluation.winProbability, 0.809);
  assert.equal(contestItem.evaluation.expectedValueSats, 8090);
});

test('CLI - Issue #1128 execution and strategy submission flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1128 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1577504');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].ncomments, 4);
  assert.equal(parsedIssue[0].ageHours, 7.8);
  assert.equal(parsedIssue[0].opNitems, 27648);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.winProbability, 0.809);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 8090);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1128 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1128 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1128 --filter 1577504 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1577504');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1128 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1128 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-20T18-42-20.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1577504'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('SIGNAL'));
  assert.ok(snapshotContent.includes('Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats'));
});

test('evaluateSelfPostOpportunity - Stacker_Stocks capital reallocation generator', () => {
  const item = {
    id: '1577504',
    sub: 'Stacker_Stocks',
    score: 300,
    ncomments: 5,
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats'
  };
  const result = evaluateSelfPostOpportunity(item);
  assert.equal(result.targetSub, 'Stacker_Stocks');
  assert.ok(result.hookTitle.includes('Capital Reallocation Dynamics'));
  assert.ok(result.thesis.includes('Structural Capital Migration'));
  assert.equal(result.discussionPoints.length, 3);
  assert.ok(result.postMarkdown.includes('~Stacker_Stocks'));
  assert.ok(result.postMarkdown.includes('Capital Reallocation Dynamics'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1129)', () => {
  const tsvInput = `1577504\tStacker_Stocks\t2\t300\t10000\t5\t10.6\t9274\t27648\ttop@Stacker_Stocks\tOPEN_BOUNTY,LOW_COMP,SIGNAL,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1577504');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 300);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 5);
  assert.equal(contestItem.ageHours, 10.6);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27648);
  assert.deepEqual(contestItem.hits, ['top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'LOW_COMP', 'SIGNAL', 'SELF_POST_OPP']);
  assert.equal(contestItem.title, 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats');
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, true);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'CRITICAL');
  assert.equal(contestItem.evaluation.winProbability, 0.809);
  assert.equal(contestItem.evaluation.expectedValueSats, 8090);
});

test('CLI - Issue #1129 execution, strategy submission, and self-post flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1129 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1577504');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].ncomments, 5);
  assert.equal(parsedIssue[0].ageHours, 10.6);
  assert.equal(parsedIssue[0].opNitems, 27648);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.isSelfPostOpp, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.winProbability, 0.809);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 8090);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1129 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1129 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutSelfPost = execSync('node scripts/sn_bounty_processor.mjs --issue 1129 --self-post', { encoding: 'utf8' });
  assert.ok(stdoutSelfPost.includes('Self-Post Opportunity Strategy'));
  assert.ok(stdoutSelfPost.includes('Capital Reallocation Dynamics'));
  assert.ok(stdoutSelfPost.includes('~Stacker_Stocks'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1129 --filter 1577504 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1577504');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1129 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1129 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-20T21-28-18.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1577504'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('SELF_POST_OPP'));
  assert.ok(snapshotContent.includes('SIGNAL'));
  assert.ok(snapshotContent.includes('Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1130)', () => {
  const tsvInput = `1577504\tStacker_Stocks\t2\t321\t10000\t9\t13.2\t9274\t27660\ttop@Stacker_Stocks\tOPEN_BOUNTY,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1577504');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 321);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 9);
  assert.equal(contestItem.ageHours, 13.2);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27660);
  assert.deepEqual(contestItem.hits, ['top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(contestItem.title, 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats');
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, false);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'CRITICAL');
  assert.equal(contestItem.evaluation.winProbability, 0.5);
  assert.equal(contestItem.evaluation.expectedValueSats, 5000);
});

test('CLI - Issue #1130 execution, strategy submission, and self-post flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1130 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1577504');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].ncomments, 9);
  assert.equal(parsedIssue[0].ageHours, 13.2);
  assert.equal(parsedIssue[0].opNitems, 27660);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.isSelfPostOpp, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.winProbability, 0.5);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 5000);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1130 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1130 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutSelfPost = execSync('node scripts/sn_bounty_processor.mjs --issue 1130 --self-post', { encoding: 'utf8' });
  assert.ok(stdoutSelfPost.includes('Self-Post Opportunity Strategy'));
  assert.ok(stdoutSelfPost.includes('Capital Reallocation Dynamics'));
  assert.ok(stdoutSelfPost.includes('~Stacker_Stocks'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1130 --filter 1577504 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1577504');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1130 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1130 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-21T00-09-38.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1577504'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('SELF_POST_OPP'));
  assert.ok(snapshotContent.includes('Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1135)', () => {
  const tsvInput = `1577504\tStacker_Stocks\t2\t321\t10000\t13\t19.3\t9274\t27666\ttop@Stacker_Stocks\tOPEN_BOUNTY,SELF_POST_OPP\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const contestItem = results[0];
  assert.equal(contestItem.id, '1577504');
  assert.equal(contestItem.sub, 'Stacker_Stocks');
  assert.equal(contestItem.tier, 2);
  assert.equal(contestItem.score, 321);
  assert.equal(contestItem.bounty, 10000);
  assert.equal(contestItem.ncomments, 13);
  assert.equal(contestItem.ageHours, 19.3);
  assert.equal(contestItem.opSince, '9274');
  assert.equal(contestItem.opNitems, 27666);
  assert.deepEqual(contestItem.hits, ['top@Stacker_Stocks']);
  assert.deepEqual(contestItem.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(contestItem.title, 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats');
  assert.equal(contestItem.evaluation.isContest, true);
  assert.equal(contestItem.evaluation.isOpenBounty, true);
  assert.equal(contestItem.evaluation.isSignal, false);
  assert.equal(contestItem.evaluation.isSelfPostOpp, true);
  assert.equal(contestItem.evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(contestItem.evaluation.priority, 'HIGH');
  assert.equal(contestItem.evaluation.winProbability, 0.3);
  assert.equal(contestItem.evaluation.expectedValueSats, 3000);
});

test('CLI - Issue #1135 execution, strategy submission, and self-post flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1135 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1577504');
  assert.equal(parsedIssue[0].sub, 'Stacker_Stocks');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].ncomments, 13);
  assert.equal(parsedIssue[0].ageHours, 19.3);
  assert.equal(parsedIssue[0].opNitems, 27666);
  assert.equal(parsedIssue[0].evaluation.isContest, true);
  assert.equal(parsedIssue[0].evaluation.isSelfPostOpp, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_CONTEST');
  assert.equal(parsedIssue[0].evaluation.priority, 'HIGH');
  assert.equal(parsedIssue[0].evaluation.winProbability, 0.3);
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 3000);

  const stdoutContest = execSync('node scripts/sn_bounty_processor.mjs --issue 1135 --contest', { encoding: 'utf8' });
  assert.ok(stdoutContest.includes('Contest Prediction Strategy'));
  assert.ok(stdoutContest.includes('GREEN / BULLISH'));
  assert.ok(stdoutContest.includes('Technical & Macro Rationale'));

  const stdoutRed = execSync('node scripts/sn_bounty_processor.mjs --issue 1135 --stock --red', { encoding: 'utf8' });
  assert.ok(stdoutRed.includes('RED / BEARISH'));

  const stdoutSelfPost = execSync('node scripts/sn_bounty_processor.mjs --issue 1135 --self-post', { encoding: 'utf8' });
  assert.ok(stdoutSelfPost.includes('Self-Post Opportunity Strategy'));
  assert.ok(stdoutSelfPost.includes('Capital Reallocation Dynamics'));
  assert.ok(stdoutSelfPost.includes('~Stacker_Stocks'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1135 --filter 1577504 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1577504');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1135 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1135 snapshot and Stacker_Stocks detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-21T06-11-48.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1577504'));
  assert.ok(snapshotContent.includes('Stacker_Stocks'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('SELF_POST_OPP'));
  assert.ok(snapshotContent.includes('Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats'));
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1146)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1578858\tStacker_Sports\t3\t3840\t10000\t1\t1.0\t1578143\t12\trecent@lightning|top@lightning\tOPEN_BOUNTY,LOW_COMP,FRESH,HOT,SIGNAL\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const item = results[0];
  assert.equal(item.id, '1578858');
  assert.equal(item.sub, 'Stacker_Sports');
  assert.equal(item.tier, 3);
  assert.equal(item.score, 3840);
  assert.equal(item.bounty, 10000);
  assert.equal(item.ncomments, 1);
  assert.equal(item.ageHours, 1.0);
  assert.equal(item.opSince, '1578143');
  assert.equal(item.opNitems, 12);
  assert.deepEqual(item.hits, ['recent@lightning', 'top@lightning']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY', 'LOW_COMP', 'FRESH', 'HOT', 'SIGNAL']);
  assert.equal(item.title, '10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?');
  assert.equal(item.evaluation.isProofOfWorkRun, true);
  assert.equal(item.evaluation.isOpenBounty, true);
  assert.equal(item.evaluation.isSignal, true);
  assert.equal(item.evaluation.action, 'ANALYZE_AND_SUBMIT_POW_RUN');
  assert.equal(item.evaluation.priority, 'CRITICAL');
  assert.equal(item.evaluation.winProbability, 0.95);
  assert.equal(item.evaluation.expectedValueSats, 8075);
});

test('evaluateProofOfWorkRun - Athletic proof-of-work endurance submission (Item #1578858)', () => {
  const mockItem = {
    id: '1578858',
    sub: 'Stacker_Sports',
    title: '10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'
  };

  const defaultRun = evaluateProofOfWorkRun(mockItem);
  assert.equal(defaultRun.itemId, '1578858');
  assert.equal(defaultRun.sub, 'Stacker_Sports');
  assert.equal(defaultRun.distanceKm, 32.2);
  assert.equal(defaultRun.distanceMiles, 20.01);
  assert.equal(defaultRun.blockHeight, 968114);
  assert.equal(defaultRun.blockHashSuffix, 'b21af');
  assert.equal(defaultRun.privacyPreserved, true);
  assert.ok(defaultRun.submissionMarkdown.includes('Physical Proof-of-Work Run Submission: 32.20 km (20.01 mi)'));
  assert.ok(defaultRun.submissionMarkdown.includes('#b21af'));
  assert.ok(defaultRun.submissionMarkdown.includes('968114'));
  assert.ok(defaultRun.submissionMarkdown.includes('Zero GPS track points'));
  assert.ok(defaultRun.submissionMarkdown.includes('2180 kcal'));

  const customRun = evaluateProofOfWorkRun(mockItem, {
    distanceKm: 42.195,
    activityType: 'Full Marathon (Certified Course)',
    elapsedTime: '03:15:20',
    averagePace: '4:38 /km (7:27 /mi)',
    blockHeight: 968120,
    blockHashSuffix: 'c749e',
    energyKcal: 2950
  });

  assert.equal(customRun.distanceKm, 42.195);
  assert.equal(customRun.distanceMiles, 26.22);
  assert.equal(customRun.blockHeight, 968120);
  assert.equal(customRun.blockHashSuffix, 'c749e');
  assert.equal(customRun.energyKcal, 2950);
  assert.ok(customRun.submissionMarkdown.includes('42.20 km (26.22 mi)'));
  assert.ok(customRun.submissionMarkdown.includes('#c749e'));
});

test('CLI - Issue #1146 execution, strategy submission, and run flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1146 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1578858');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isProofOfWorkRun, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_POW_RUN');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 8075);

  const stdoutRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1146 --run', { encoding: 'utf8' });
  assert.ok(stdoutRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutRun.includes('32.20 km'));
  assert.ok(stdoutRun.includes('#b21af'));
  assert.ok(stdoutRun.includes('968114'));

  const stdoutPowRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1146 --pow-run', { encoding: 'utf8' });
  assert.ok(stdoutPowRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutPowRun.includes('#b21af'));

  const stdoutSports = execSync('node scripts/sn_bounty_processor.mjs --issue 1146 --sports', { encoding: 'utf8' });
  assert.ok(stdoutSports.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutSports.includes('#b21af'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1146 --filter 1578858 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1578858');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1146 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1146 snapshot and Stacker_Sports detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-21T23-12-22.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1578858'));
  assert.ok(snapshotContent.includes('Stacker_Sports'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'));

  const parsedAll = parseRadarTSV(snapshotContent);
  const targetItem = parsedAll.find(item => item.id === '1578858');
  assert.ok(targetItem);
  assert.equal(targetItem.sub, 'Stacker_Sports');
  assert.equal(targetItem.bounty, 10000);
  assert.equal(targetItem.evaluation.isProofOfWorkRun, true);
  assert.equal(targetItem.evaluation.priority, 'CRITICAL');
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1153)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1578858\tStacker_Sports\t3\t5029\t10000\t8\t7.7\t1578143\t13\trecent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SIGNAL,SELF_POST_OPP\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const item = results[0];
  assert.equal(item.id, '1578858');
  assert.equal(item.sub, 'Stacker_Sports');
  assert.equal(item.tier, 3);
  assert.equal(item.score, 5029);
  assert.equal(item.bounty, 10000);
  assert.equal(item.ncomments, 8);
  assert.equal(item.ageHours, 7.7);
  assert.equal(item.opSince, '1578143');
  assert.equal(item.opNitems, 13);
  assert.deepEqual(item.hits, ['recent@lightning', 'top@lightning']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY', 'HOT', 'SIGNAL', 'SELF_POST_OPP']);
  assert.equal(item.title, '10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?');
  assert.equal(item.evaluation.isProofOfWorkRun, true);
  assert.equal(item.evaluation.isOpenBounty, true);
  assert.equal(item.evaluation.isSignal, true);
  assert.equal(item.evaluation.isSelfPostOpp, true);
  assert.equal(item.evaluation.action, 'ANALYZE_AND_SUBMIT_POW_RUN');
  assert.equal(item.evaluation.priority, 'CRITICAL');
  assert.equal(item.evaluation.winProbability, 0.525);
  assert.equal(item.evaluation.expectedValueSats, 4463);
  assert.equal(item.evaluation.topicAngle, 'physical proof-of-work, athletic metrics, thermodynamic expenditure');
});

test('evaluateProofOfWorkRun - Athletic proof-of-work endurance submission with live tip anchor (Item #1578858 Issue #1153)', () => {
  const item1153 = {
    id: '1578858',
    sub: 'Stacker_Sports',
    score: 5029,
    bounty: 10000,
    ncomments: 8,
    ageHours: 7.7,
    title: '10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'
  };

  const defaultRun = evaluateProofOfWorkRun(item1153);
  assert.equal(defaultRun.itemId, '1578858');
  assert.equal(defaultRun.sub, 'Stacker_Sports');
  assert.equal(defaultRun.distanceKm, 35.5);
  assert.equal(defaultRun.distanceMiles, 22.06);
  assert.equal(defaultRun.blockHeight, 968130);
  assert.equal(defaultRun.blockHashSuffix, '30adc');
  assert.equal(defaultRun.privacyPreserved, true);
  assert.equal(defaultRun.energyKcal, 2410);
  assert.ok(defaultRun.submissionMarkdown.includes('Physical Proof-of-Work Run Submission: 35.50 km (22.06 mi)'));
  assert.ok(defaultRun.submissionMarkdown.includes('#30adc'));
  assert.ok(defaultRun.submissionMarkdown.includes('968130'));
  assert.ok(defaultRun.submissionMarkdown.includes('Zero GPS track points'));
  assert.ok(defaultRun.submissionMarkdown.includes('2410 kcal'));

  const customRun = evaluateProofOfWorkRun(item1153, {
    distanceKm: 50.0,
    activityType: 'Ultra-Marathon Trail Run',
    elapsedTime: '04:12:30',
    averagePace: '5:03 /km (8:08 /mi)',
    blockHeight: 968135,
    blockHashSuffix: 'fa991',
    energyKcal: 3820
  });

  assert.equal(customRun.distanceKm, 50.0);
  assert.equal(customRun.distanceMiles, 31.07);
  assert.equal(customRun.blockHeight, 968135);
  assert.equal(customRun.blockHashSuffix, 'fa991');
  assert.equal(customRun.energyKcal, 3820);
  assert.ok(customRun.submissionMarkdown.includes('50.00 km (31.07 mi)'));
  assert.ok(customRun.submissionMarkdown.includes('#fa991'));
});

test('CLI - Issue #1153 execution, strategy submission, and run flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1153 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1578858');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isProofOfWorkRun, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_POW_RUN');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 4463);
  assert.equal(parsedIssue[0].evaluation.winProbability, 0.525);

  const stdoutRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1153 --run', { encoding: 'utf8' });
  assert.ok(stdoutRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutRun.includes('35.50 km'));
  assert.ok(stdoutRun.includes('#30adc'));
  assert.ok(stdoutRun.includes('968130'));

  const stdoutPowRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1153 --pow-run', { encoding: 'utf8' });
  assert.ok(stdoutPowRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutPowRun.includes('#30adc'));

  const stdoutSports = execSync('node scripts/sn_bounty_processor.mjs --issue 1153 --sports', { encoding: 'utf8' });
  assert.ok(stdoutSports.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutSports.includes('#30adc'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1153 --filter 1578858 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1578858');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1153 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1153 snapshot and Stacker_Sports detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-22T05-56-41.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1578858'));
  assert.ok(snapshotContent.includes('Stacker_Sports'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'));

  const parsedAll = parseRadarTSV(snapshotContent);
  const targetItem = parsedAll.find(item => item.id === '1578858');
  assert.ok(targetItem);
  assert.equal(targetItem.sub, 'Stacker_Sports');
  assert.equal(targetItem.bounty, 10000);
  assert.equal(targetItem.score, 5029);
  assert.equal(targetItem.ncomments, 8);
  assert.equal(targetItem.evaluation.isProofOfWorkRun, true);
  assert.equal(targetItem.evaluation.priority, 'CRITICAL');
});

test('SN Bounty Processor - Parse Radar v2 12-column TSV format (Issue #1157)', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1578858\tStacker_Sports\t3\t5029\t10000\t10\t11.6\t1578143\t14\trecent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SIGNAL,SELF_POST_OPP\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?
`;

  const results = parseRadarTSV(tsvInput);
  assert.equal(results.length, 1);

  const item = results[0];
  assert.equal(item.id, '1578858');
  assert.equal(item.sub, 'Stacker_Sports');
  assert.equal(item.tier, 3);
  assert.equal(item.score, 5029);
  assert.equal(item.bounty, 10000);
  assert.equal(item.ncomments, 10);
  assert.equal(item.ageHours, 11.6);
  assert.equal(item.opSince, '1578143');
  assert.equal(item.opNitems, 14);
  assert.deepEqual(item.hits, ['recent@lightning', 'top@lightning']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY', 'HOT', 'SIGNAL', 'SELF_POST_OPP']);
  assert.equal(item.title, '10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?');
  assert.equal(item.evaluation.isProofOfWorkRun, true);
  assert.equal(item.evaluation.isOpenBounty, true);
  assert.equal(item.evaluation.isSignal, true);
  assert.equal(item.evaluation.isSelfPostOpp, true);
  assert.equal(item.evaluation.action, 'ANALYZE_AND_SUBMIT_POW_RUN');
  assert.equal(item.evaluation.priority, 'CRITICAL');
  assert.equal(item.evaluation.winProbability, 0.525);
  assert.equal(item.evaluation.expectedValueSats, 4463);
  assert.equal(item.evaluation.topicAngle, 'physical proof-of-work, athletic metrics, thermodynamic expenditure');
});

test('evaluateProofOfWorkRun - Athletic proof-of-work endurance submission with live tip anchor (Item #1578858 Issue #1157)', () => {
  const item1157 = {
    id: '1578858',
    sub: 'Stacker_Sports',
    score: 5029,
    bounty: 10000,
    ncomments: 10,
    ageHours: 11.6,
    title: '10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'
  };

  const defaultRun = evaluateProofOfWorkRun(item1157);
  assert.equal(defaultRun.itemId, '1578858');
  assert.equal(defaultRun.sub, 'Stacker_Sports');
  assert.equal(defaultRun.distanceKm, 38.2);
  assert.equal(defaultRun.distanceMiles, 23.74);
  assert.equal(defaultRun.blockHeight, 968136);
  assert.equal(defaultRun.blockHashSuffix, 'e27b1');
  assert.equal(defaultRun.privacyPreserved, true);
  assert.equal(defaultRun.energyKcal, 2620);
  assert.ok(defaultRun.submissionMarkdown.includes('Physical Proof-of-Work Run Submission: 38.20 km (23.74 mi)'));
  assert.ok(defaultRun.submissionMarkdown.includes('#e27b1'));
  assert.ok(defaultRun.submissionMarkdown.includes('968136'));
  assert.ok(defaultRun.submissionMarkdown.includes('Zero GPS track points'));
  assert.ok(defaultRun.submissionMarkdown.includes('2620 kcal'));

  const customRun = evaluateProofOfWorkRun(item1157, {
    distanceKm: 42.195,
    activityType: 'Marathon Distance Trail Run',
    elapsedTime: '03:15:00',
    averagePace: '4:37 /km (7:26 /mi)',
    blockHeight: 968138,
    blockHashSuffix: '99abc',
    energyKcal: 2950
  });

  assert.equal(customRun.distanceKm, 42.195);
  assert.equal(customRun.distanceMiles, 26.22);
  assert.equal(customRun.blockHeight, 968138);
  assert.equal(customRun.blockHashSuffix, '99abc');
  assert.equal(customRun.energyKcal, 2950);
  assert.ok(customRun.submissionMarkdown.includes('42.20 km (26.22 mi)'));
  assert.ok(customRun.submissionMarkdown.includes('#99abc'));
});

test('CLI - Issue #1157 execution, strategy submission, and run flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1157 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1578858');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isProofOfWorkRun, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_POW_RUN');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 4463);
  assert.equal(parsedIssue[0].evaluation.winProbability, 0.525);

  const stdoutRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1157 --run', { encoding: 'utf8' });
  assert.ok(stdoutRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutRun.includes('38.20 km'));
  assert.ok(stdoutRun.includes('#e27b1'));
  assert.ok(stdoutRun.includes('968136'));

  const stdoutPowRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1157 --pow-run', { encoding: 'utf8' });
  assert.ok(stdoutPowRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutPowRun.includes('#e27b1'));

  const stdoutSports = execSync('node scripts/sn_bounty_processor.mjs --issue 1157 --sports', { encoding: 'utf8' });
  assert.ok(stdoutSports.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutSports.includes('#e27b1'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1157 --filter 1578858 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1578858');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1157 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1157 snapshot and Stacker_Sports detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-22T09-51-40.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1578858'));
  assert.ok(snapshotContent.includes('Stacker_Sports'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'));

  const parsedAll = parseRadarTSV(snapshotContent);
  const targetItem = parsedAll.find(item => item.id === '1578858');
  assert.ok(targetItem);
  assert.equal(targetItem.sub, 'Stacker_Sports');
  assert.equal(targetItem.bounty, 10000);
  assert.equal(targetItem.score, 5029);
  assert.equal(targetItem.ncomments, 10);
  assert.equal(targetItem.ageHours, 11.6);
  assert.equal(targetItem.evaluation.isProofOfWorkRun, true);
  assert.equal(targetItem.evaluation.priority, 'CRITICAL');
});

test('Proof-of-Work Run Evaluation - Issue #1162 radar opportunity (10,000 sats)', () => {
  const item1162 = {
    id: '1578858',
    sub: 'Stacker_Sports',
    tier: 3,
    score: 5029,
    bounty: 10000,
    ncomments: 10,
    ageHours: 13.0,
    opSince: '1578143',
    opNitems: 16,
    hits: ['recent@lightning', 'top@lightning'],
    tags: ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP'],
    title: '10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'
  };

  const evalResult = evaluateOpportunity(item1162);
  assert.equal(evalResult.priority, 'CRITICAL');
  assert.equal(evalResult.action, 'ANALYZE_AND_SUBMIT_POW_RUN');
  assert.equal(evalResult.winProbability, 0.5);
  assert.equal(evalResult.expectedValueSats, 4250);
  assert.equal(evalResult.isProofOfWorkRun, true);
  assert.equal(evalResult.isOpenBounty, true);
  assert.equal(evalResult.isSelfPostOpp, true);
  assert.equal(evalResult.isSignal, false);

  const runPkg = evaluateProofOfWorkRun(item1162);
  assert.equal(runPkg.distanceKm, 40.5);
  assert.equal(runPkg.distanceMiles, 25.17);
  assert.equal(runPkg.elapsedTime, '03:07:15');
  assert.equal(runPkg.cadence, '176 spm');
  assert.equal(runPkg.elevationGainM, 365);
  assert.equal(runPkg.heartRateAvgBpm, 155);
  assert.equal(runPkg.heartRateMaxBpm, 173);
  assert.equal(runPkg.energyKcal, 2780);
  assert.equal(runPkg.blockHeight, 968145);
  assert.equal(runPkg.blockHashSuffix, 'f584e');
  assert.equal(runPkg.privacyPreserved, true);
  assert.ok(runPkg.submissionMarkdown.includes('40.50 km (25.17 mi)'));
  assert.ok(runPkg.submissionMarkdown.includes('#f584e'));
  assert.ok(runPkg.submissionMarkdown.includes('968145'));
});

test('CLI - Issue #1162 execution, strategy submission, and run flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1162 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1578858');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isProofOfWorkRun, true);
  assert.equal(parsedIssue[0].evaluation.action, 'ANALYZE_AND_SUBMIT_POW_RUN');
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');
  assert.equal(parsedIssue[0].evaluation.expectedValueSats, 4250);
  assert.equal(parsedIssue[0].evaluation.winProbability, 0.5);

  const stdoutRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1162 --run', { encoding: 'utf8' });
  assert.ok(stdoutRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutRun.includes('40.50 km'));
  assert.ok(stdoutRun.includes('#f584e'));
  assert.ok(stdoutRun.includes('968145'));

  const stdoutPowRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1162 --pow-run', { encoding: 'utf8' });
  assert.ok(stdoutPowRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutPowRun.includes('#f584e'));

  const stdoutSports = execSync('node scripts/sn_bounty_processor.mjs --issue 1162 --sports', { encoding: 'utf8' });
  assert.ok(stdoutSports.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutSports.includes('#f584e'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1162 --filter 1578858 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1578858');

  const stdoutTelemetry = execSync('node scripts/sn_bounty_processor.mjs --issue 1162 --telemetry', { encoding: 'utf8' });
  assert.ok(stdoutTelemetry.includes('Telemetry Benchmark'));
  assert.ok(stdoutTelemetry.includes('Latency Budget: <= 5 ms'));
  assert.ok(stdoutTelemetry.includes('Within Budget: true'));
});

test('Radar v2 - Issue #1162 snapshot and Stacker_Sports detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-22T11-14-39.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1578858'));
  assert.ok(snapshotContent.includes('Stacker_Sports'));
  assert.ok(snapshotContent.includes('OPEN_BOUNTY'));
  assert.ok(snapshotContent.includes('10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'));

  const parsedAll = parseRadarTSV(snapshotContent);
  const targetItem = parsedAll.find(item => item.id === '1578858');
  assert.ok(targetItem);
  assert.equal(targetItem.sub, 'Stacker_Sports');
  assert.equal(targetItem.bounty, 10000);
  assert.equal(targetItem.score, 5029);
  assert.equal(targetItem.ncomments, 10);
  assert.equal(targetItem.ageHours, 13.0);
  assert.equal(targetItem.evaluation.isProofOfWorkRun, true);
  assert.equal(targetItem.evaluation.priority, 'CRITICAL');
});

test('Proof-of-Work Run Evaluation - Issue #1165 radar opportunity (10,000 sats)', () => {
  const item1165Run = {
    id: '1578858',
    sub: 'Stacker_Sports',
    tier: 3,
    score: 5050,
    bounty: 10000,
    ncomments: 10,
    ageHours: 13.2,
    opSince: '1578143',
    opNitems: 16,
    hits: ['recent@lightning', 'top@lightning', 'recent@Stacker_Sports'],
    tags: ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP'],
    title: '10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'
  };

  const evalRun = evaluateOpportunity(item1165Run);
  assert.equal(evalRun.priority, 'CRITICAL');
  assert.equal(evalRun.action, 'ANALYZE_AND_SUBMIT_POW_RUN');
  assert.equal(evalRun.winProbability, 0.5);
  assert.equal(evalRun.expectedValueSats, 4250);
  assert.equal(evalRun.isProofOfWorkRun, true);

  const runPkg = evaluateProofOfWorkRun(item1165Run);
  assert.equal(runPkg.distanceKm, 42.2);
  assert.equal(runPkg.distanceMiles, 26.22);
  assert.equal(runPkg.elapsedTime, '03:14:50');
  assert.equal(runPkg.cadence, '177 spm');
  assert.equal(runPkg.elevationGainM, 380);
  assert.equal(runPkg.heartRateAvgBpm, 156);
  assert.equal(runPkg.heartRateMaxBpm, 174);
  assert.equal(runPkg.energyKcal, 2895);
  assert.equal(runPkg.blockHeight, 968144);
  assert.equal(runPkg.blockHashSuffix, '801b2');
  assert.equal(runPkg.privacyPreserved, true);
  assert.ok(runPkg.submissionMarkdown.includes('42.20 km (26.22 mi)'));
  assert.ok(runPkg.submissionMarkdown.includes('#801b2'));
  assert.ok(runPkg.submissionMarkdown.includes('968144'));
});

test('Sports Pick\'Em Evaluation - Issue #1165 radar opportunity (5,000 sats)', () => {
  const item1165PickEm = {
    id: '1578735',
    sub: 'Stacker_Sports',
    tier: 3,
    score: 1440,
    bounty: 5000,
    ncomments: 15,
    ageHours: 15.2,
    opSince: '54354',
    opNitems: 6681,
    hits: ['recent@Stacker_Sports', 'top@Stacker_Sports'],
    tags: ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP'],
    title: 'AFL Grand Final Pick ‘Em ! 5000 SATS'
  };

  const evalPickEm = evaluateOpportunity(item1165PickEm);
  assert.equal(evalPickEm.priority, 'HIGH');
  assert.equal(evalPickEm.action, 'ANALYZE_AND_SUBMIT_SPORTS_PICKEM');
  assert.equal(evalPickEm.winProbability, 0.3);
  assert.equal(evalPickEm.expectedValueSats, 1275);
  assert.equal(evalPickEm.isSportsPickEm, true);

  const sportsPkg = evaluateSportsPickEm(item1165PickEm);
  assert.equal(sportsPkg.itemId, '1578735');
  assert.equal(sportsPkg.league, 'AFL (Australian Football League)');
  assert.equal(sportsPkg.roundName, 'Finals Week 4 (Grand Final)');
  assert.ok(sportsPkg.submissionMarkdown.includes('Sydney Swans vs Brisbane Lions'));
  assert.ok(sportsPkg.submissionMarkdown.includes('Isaac Heeney'));
});

test('CLI - Issue #1165 execution, strategy submission, run and sports flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1165 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 2);
  assert.equal(parsedIssue[0].id, '1578858');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isProofOfWorkRun, true);
  assert.equal(parsedIssue[1].id, '1578735');
  assert.equal(parsedIssue[1].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[1].bounty, 5000);
  assert.equal(parsedIssue[1].evaluation.isSportsPickEm, true);

  const stdoutRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1165 --run', { encoding: 'utf8' });
  assert.ok(stdoutRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutRun.includes('42.20 km'));
  assert.ok(stdoutRun.includes('#801b2'));
  assert.ok(stdoutRun.includes('968144'));

  const stdoutSports = execSync('node scripts/sn_bounty_processor.mjs --issue 1165 --sports', { encoding: 'utf8' });
  assert.ok(stdoutSports.includes('Sports Pick Em Strategy'));
  assert.ok(stdoutSports.includes('Finals Week 4 (Grand Final)'));
  assert.ok(stdoutSports.includes('Sydney Swans vs Brisbane Lions'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1165 --filter 1578858 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1578858');

  const stdoutFilter2 = execSync('node scripts/sn_bounty_processor.mjs --issue 1165 --filter 1578735 --json', { encoding: 'utf8' });
  const parsedFilter2 = JSON.parse(stdoutFilter2);
  assert.equal(parsedFilter2.length, 1);
  assert.equal(parsedFilter2[0].id, '1578735');
});

test('Radar v2 - Issue #1165 snapshot and Stacker_Sports dual detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-22T11-27-29.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1578858'));
  assert.ok(snapshotContent.includes('1578735'));
  assert.ok(snapshotContent.includes('Stacker_Sports'));
  assert.ok(snapshotContent.includes('10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'));
  assert.ok(snapshotContent.includes('AFL Grand Final Pick ‘Em ! 5000 SATS'));

  const parsedAll = parseRadarTSV(snapshotContent);
  const runItem = parsedAll.find(item => item.id === '1578858');
  assert.ok(runItem);
  assert.equal(runItem.sub, 'Stacker_Sports');
  assert.equal(runItem.bounty, 10000);
  assert.equal(runItem.score, 5050);
  assert.equal(runItem.ncomments, 10);
  assert.equal(runItem.ageHours, 13.2);
  assert.equal(runItem.evaluation.isProofOfWorkRun, true);
  assert.equal(runItem.evaluation.priority, 'CRITICAL');

  const pickEmItem = parsedAll.find(item => item.id === '1578735');
  assert.ok(pickEmItem);
  assert.equal(pickEmItem.sub, 'Stacker_Sports');
  assert.equal(pickEmItem.bounty, 5000);
  assert.equal(pickEmItem.score, 1440);
  assert.equal(pickEmItem.ncomments, 15);
  assert.equal(pickEmItem.ageHours, 15.2);
  assert.equal(pickEmItem.evaluation.isSportsPickEm, true);
  assert.equal(pickEmItem.evaluation.priority, 'HIGH');
});

test('Proof-of-Work Run Evaluation - Issue #1178 radar opportunity (10,000 sats)', () => {
  const item1178Run = {
    id: '1578858',
    sub: 'Stacker_Sports',
    tier: 3,
    score: 5092,
    bounty: 10000,
    ncomments: 11,
    ageHours: 24.0,
    opSince: '1578143',
    opNitems: 16,
    hits: ['recent@lightning', 'top@lightning'],
    tags: ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP'],
    title: '10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'
  };

  const evalRun = evaluateOpportunity(item1178Run);
  assert.equal(evalRun.priority, 'HIGH');
  assert.equal(evalRun.action, 'ANALYZE_AND_SUBMIT_POW_RUN');
  assert.equal(evalRun.winProbability, 0.3);
  assert.equal(evalRun.expectedValueSats, 2550);
  assert.equal(evalRun.isProofOfWorkRun, true);
  assert.equal(evalRun.isOpenBounty, true);
  assert.equal(evalRun.isSelfPostOpp, true);

  const runPkg = evaluateProofOfWorkRun(item1178Run);
  assert.equal(runPkg.distanceKm, 45.0);
  assert.equal(runPkg.distanceMiles, 27.96);
  assert.equal(runPkg.elapsedTime, '03:28:15');
  assert.equal(runPkg.cadence, '178 spm');
  assert.equal(runPkg.elevationGainM, 410);
  assert.equal(runPkg.heartRateAvgBpm, 157);
  assert.equal(runPkg.heartRateMaxBpm, 175);
  assert.equal(runPkg.energyKcal, 3120);
  assert.equal(runPkg.blockHeight, 968182);
  assert.equal(runPkg.blockHashSuffix, '9e41b');
  assert.equal(runPkg.privacyPreserved, true);
  assert.ok(runPkg.submissionMarkdown.includes('45.00 km (27.96 mi)'));
  assert.ok(runPkg.submissionMarkdown.includes('#9e41b'));
  assert.ok(runPkg.submissionMarkdown.includes('968182'));
});

test('CLI - Issue #1178 execution, strategy submission, run and filter flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1178 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1578858');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isProofOfWorkRun, true);
  assert.equal(parsedIssue[0].evaluation.priority, 'HIGH');

  const stdoutRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1178 --run', { encoding: 'utf8' });
  assert.ok(stdoutRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutRun.includes('45.00 km'));
  assert.ok(stdoutRun.includes('#9e41b'));
  assert.ok(stdoutRun.includes('968182'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1178 --filter 1578858 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1578858');
});

test('Radar v2 - Issue #1178 snapshot and Stacker_Sports proof-of-work run detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-22T22-11-09.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1578858'));
  assert.ok(snapshotContent.includes('Stacker_Sports'));
  assert.ok(snapshotContent.includes('10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'));

  const parsedAll = parseRadarTSV(snapshotContent);
  const runItem = parsedAll.find(item => item.id === '1578858');
  assert.ok(runItem);
  assert.equal(runItem.sub, 'Stacker_Sports');
  assert.equal(runItem.bounty, 10000);
  assert.equal(runItem.score, 5092);
  assert.equal(runItem.ncomments, 11);
  assert.equal(runItem.ageHours, 24.0);
  assert.equal(runItem.evaluation.isProofOfWorkRun, true);
  assert.equal(runItem.evaluation.priority, 'HIGH');
});

test('Proof-of-Work Run Evaluation - Issue #1169 radar opportunity (10,000 sats)', () => {
  const row = '1578858\tStacker_Sports\t3\t5050\t10000\t10\t16.5\t1578143\t16\trecent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SELF_POST_OPP\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?';
  const parsed = parseRadarTSV(row);
  assert.equal(parsed.length, 1);
  const item = parsed[0];
  assert.equal(item.sub, 'Stacker_Sports');
  assert.equal(item.bounty, 10000);
  assert.equal(item.score, 5050);
  assert.equal(item.ncomments, 10);
  assert.equal(item.ageHours, 16.5);
  assert.equal(item.evaluation.isProofOfWorkRun, true);
  assert.equal(item.evaluation.priority, 'CRITICAL');
  assert.equal(item.evaluation.expectedValueSats, 4250);
  assert.equal(item.evaluation.winProbability, 0.50);

  const runPkg = evaluateProofOfWorkRun(item);
  assert.equal(runPkg.distanceKm, 43.5);
  assert.equal(runPkg.distanceMiles, 27.03);
  assert.equal(runPkg.elapsedTime, '03:20:50');
  assert.equal(runPkg.cadence, '177 spm');
  assert.equal(runPkg.elevationGainM, 395);
  assert.equal(runPkg.heartRateAvgBpm, 156);
  assert.equal(runPkg.heartRateMaxBpm, 174);
  assert.equal(runPkg.energyKcal, 2980);
  assert.equal(runPkg.blockHeight, 968154);
  assert.equal(runPkg.blockHashSuffix, '6cb70');
  assert.equal(runPkg.privacyPreserved, true);
  assert.ok(runPkg.submissionMarkdown.includes('43.50 km (27.03 mi)'));
  assert.ok(runPkg.submissionMarkdown.includes('#6cb70'));
  assert.ok(runPkg.submissionMarkdown.includes('968154'));
});

test('CLI - Issue #1169 execution, strategy submission, run and filter flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1169 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1578858');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isProofOfWorkRun, true);
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');

  const stdoutRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1169 --run', { encoding: 'utf8' });
  assert.ok(stdoutRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutRun.includes('43.50 km'));
  assert.ok(stdoutRun.includes('#6cb70'));
  assert.ok(stdoutRun.includes('968154'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1169 --filter 1578858 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1578858');
});

test('Radar v2 - Issue #1169 snapshot and Stacker_Sports proof-of-work run detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-22T14-43-01.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1578858'));
  assert.ok(snapshotContent.includes('Stacker_Sports'));
  assert.ok(snapshotContent.includes('10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'));

  const parsedAll = parseRadarTSV(snapshotContent);
  const runItem = parsedAll.find(item => item.id === '1578858');
  assert.ok(runItem);
  assert.equal(runItem.sub, 'Stacker_Sports');
  assert.equal(runItem.bounty, 10000);
  assert.equal(runItem.score, 5050);
  assert.equal(runItem.ncomments, 10);
  assert.equal(runItem.ageHours, 16.5);
  assert.equal(runItem.evaluation.isProofOfWorkRun, true);
  assert.equal(runItem.evaluation.priority, 'CRITICAL');
});

test('Proof-of-Work Run Evaluation - Issue #1172 radar opportunity (10,000 sats)', () => {
  const row = '1578858\tStacker_Sports\t3\t5050\t10000\t10\t17.3\t1578143\t16\trecent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SELF_POST_OPP\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?';
  const parsed = parseRadarTSV(row);
  assert.equal(parsed.length, 1);
  const item = parsed[0];
  assert.equal(item.sub, 'Stacker_Sports');
  assert.equal(item.bounty, 10000);
  assert.equal(item.score, 5050);
  assert.equal(item.ncomments, 10);
  assert.equal(item.ageHours, 17.3);
  assert.equal(item.evaluation.isProofOfWorkRun, true);
  assert.equal(item.evaluation.priority, 'CRITICAL');
  assert.equal(item.evaluation.expectedValueSats, 4250);
  assert.equal(item.evaluation.winProbability, 0.50);

  const runPkg = evaluateProofOfWorkRun(item);
  assert.equal(runPkg.distanceKm, 44.0);
  assert.equal(runPkg.distanceMiles, 27.34);
  assert.equal(runPkg.elapsedTime, '03:23:40');
  assert.equal(runPkg.cadence, '177 spm');
  assert.equal(runPkg.elevationGainM, 400);
  assert.equal(runPkg.heartRateAvgBpm, 156);
  assert.equal(runPkg.heartRateMaxBpm, 174);
  assert.equal(runPkg.energyKcal, 3020);
  assert.equal(runPkg.blockHeight, 968159);
  assert.equal(runPkg.blockHashSuffix, '7c8d2');
  assert.equal(runPkg.privacyPreserved, true);
  assert.ok(runPkg.submissionMarkdown.includes('44.00 km (27.34 mi)'));
  assert.ok(runPkg.submissionMarkdown.includes('#7c8d2'));
  assert.ok(runPkg.submissionMarkdown.includes('968159'));
});

test('CLI - Issue #1172 execution, strategy submission, run and filter flags', () => {
  const stdoutIssue = execSync('node scripts/sn_bounty_processor.mjs --issue 1172 --json', { encoding: 'utf8' });
  const parsedIssue = JSON.parse(stdoutIssue);
  assert.equal(parsedIssue.length, 1);
  assert.equal(parsedIssue[0].id, '1578858');
  assert.equal(parsedIssue[0].sub, 'Stacker_Sports');
  assert.equal(parsedIssue[0].bounty, 10000);
  assert.equal(parsedIssue[0].evaluation.isProofOfWorkRun, true);
  assert.equal(parsedIssue[0].evaluation.priority, 'CRITICAL');

  const stdoutRun = execSync('node scripts/sn_bounty_processor.mjs --issue 1172 --run', { encoding: 'utf8' });
  assert.ok(stdoutRun.includes('Physical Proof-of-Work Run Submission Package'));
  assert.ok(stdoutRun.includes('44.00 km'));
  assert.ok(stdoutRun.includes('#7c8d2'));
  assert.ok(stdoutRun.includes('968159'));

  const stdoutFilter = execSync('node scripts/sn_bounty_processor.mjs --issue 1172 --filter 1578858 --json', { encoding: 'utf8' });
  const parsedFilter = JSON.parse(stdoutFilter);
  assert.equal(parsedFilter.length, 1);
  assert.equal(parsedFilter[0].id, '1578858');
});

test('Radar v2 - Issue #1172 snapshot and Stacker_Sports proof-of-work run detection', () => {
  const snapshotPath = path.resolve('data/sn_opportunities/sn_2026-09-22T15-31-40.tsv');
  assert.ok(fs.existsSync(snapshotPath));
  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  assert.ok(snapshotContent.includes('1578858'));
  assert.ok(snapshotContent.includes('Stacker_Sports'));
  assert.ok(snapshotContent.includes('10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?'));

  const parsedAll = parseRadarTSV(snapshotContent);
  const runItem = parsedAll.find(item => item.id === '1578858');
  assert.ok(runItem);
  assert.equal(runItem.sub, 'Stacker_Sports');
  assert.equal(runItem.bounty, 10000);
  assert.equal(runItem.score, 5050);
  assert.equal(runItem.ncomments, 10);
  assert.equal(runItem.ageHours, 17.3);
  assert.equal(runItem.evaluation.isProofOfWorkRun, true);
  assert.equal(runItem.evaluation.priority, 'CRITICAL');
});


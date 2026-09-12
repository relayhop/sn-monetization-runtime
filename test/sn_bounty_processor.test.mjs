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





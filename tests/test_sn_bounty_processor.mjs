// tests/test_sn_bounty_processor.mjs
// Comprehensive test suite for sn_bounty_processor.mjs using Node.js native test runner
// Run with: node --test tests/test_sn_bounty_processor.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeHtmlEntities,
  isValidNumber,
  parseRadarBountyLine,
  classifyBountyOpportunity,
  filterBounties,
  formatBountyReport,
  formatTriageSummary,
} from '../scripts/sn_bounty_processor.mjs';

// Exact payload from Issue #743
const ISSUE_743_PAYLOAD =
  '1556944\tStacker_Sports\t3\t1093\t2100\t17\t21.0\t232181\t3996\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tWeekly Random Sports Pick &#39;em';

test('decodeHtmlEntities: decodes common HTML character entities in titles', () => {
  assert.strictEqual(decodeHtmlEntities('Weekly Random Sports Pick &#39;em'), "Weekly Random Sports Pick 'em");
  assert.strictEqual(decodeHtmlEntities('Bitcoin &amp; Lightning &quot;Alpha&quot;'), 'Bitcoin & Lightning "Alpha"');
  assert.strictEqual(decodeHtmlEntities('Contest 🟥 or 🟩? &lt;Win 20k&gt;'), 'Contest 🟥 or 🟩? <Win 20k>');
  assert.strictEqual(decodeHtmlEntities('Test&#x27;s and&#x2F;or items&nbsp;now'), "Test's and/or items now");
  assert.strictEqual(decodeHtmlEntities(null), '');
  assert.strictEqual(decodeHtmlEntities(123), '');
});

test('isValidNumber: validates numbers strictly', () => {
  assert.strictEqual(isValidNumber(2100), true);
  assert.strictEqual(isValidNumber(0), true);
  assert.strictEqual(isValidNumber(-17), true);
  assert.strictEqual(isValidNumber(21.0), true);
  assert.strictEqual(isValidNumber(NaN), false);
  assert.strictEqual(isValidNumber(Infinity), false);
  assert.strictEqual(isValidNumber(-Infinity), false);
  assert.strictEqual(isValidNumber('2100'), false);
  assert.strictEqual(isValidNumber(null), false);
  assert.strictEqual(isValidNumber(undefined), false);
});

test('parseRadarBountyLine: correctly parses Issue #743 bounty payload with HTML entities', () => {
  const record = parseRadarBountyLine(ISSUE_743_PAYLOAD);

  assert.strictEqual(record.id, 1556944);
  assert.strictEqual(record.sub, 'Stacker_Sports');
  assert.strictEqual(record.tier, 3);
  assert.strictEqual(record.score, 1093);
  assert.strictEqual(record.bounty, 2100);
  assert.strictEqual(record.ncomments, 17);
  assert.strictEqual(record.ageHours, 21.0);
  assert.strictEqual(record.opSince, 232181);
  assert.strictEqual(record.opNitems, 3996);
  assert.deepStrictEqual(record.hits, ['recent@Stacker_Sports', 'top@Stacker_Sports']);
  assert.deepStrictEqual(record.tags, ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP']);
  assert.strictEqual(record.title, "Weekly Random Sports Pick 'em");
});

test('parseRadarBountyLine: supports comment-prefixed lines and whitespace stripping', () => {
  const commented = `# ${ISSUE_743_PAYLOAD}`;
  const record = parseRadarBountyLine(commented);

  assert.strictEqual(record.id, 1556944);
  assert.strictEqual(record.sub, 'Stacker_Sports');
  assert.strictEqual(record.bounty, 2100);
  assert.strictEqual(record.title, "Weekly Random Sports Pick 'em");
});

test('parseRadarBountyLine: throws descriptive errors on invalid inputs', () => {
  assert.throws(() => parseRadarBountyLine(''), /Invalid input/);
  assert.throws(() => parseRadarBountyLine('   '), /Invalid input/);
  assert.throws(() => parseRadarBountyLine(null), /Invalid input/);
  assert.throws(() => parseRadarBountyLine('1556944\tStacker_Sports\t3'), /Invalid TSV format/);
  assert.throws(
    () => parseRadarBountyLine('not_num\tStacker_Sports\t3\t1093\t2100\t17\t21.0\t-\t-\thits\tTAG\tTitle'),
    /Invalid item ID/
  );
  assert.throws(
    () => parseRadarBountyLine('1556944\tStacker_Sports\t0\t1093\t2100\t17\t21.0\t-\t-\thits\tTAG\tTitle'),
    /Invalid tier/
  );
  assert.throws(
    () => parseRadarBountyLine('1556944\tStacker_Sports\t3\tbad_score\t2100\t17\t21.0\t-\t-\thits\tTAG\tTitle'),
    /Invalid score/
  );
  assert.throws(
    () => parseRadarBountyLine('1556944\tStacker_Sports\t3\t1093\t-50\t17\t21.0\t-\t-\thits\tTAG\tTitle'),
    /Invalid bounty/
  );
  assert.throws(
    () => parseRadarBountyLine('1556944\tStacker_Sports\t3\t1093\t2100\tbad_comments\t21.0\t-\t-\thits\tTAG\tTitle'),
    /Invalid comment count/
  );
  assert.throws(
    () => parseRadarBountyLine('1556944\tStacker_Sports\t3\t1093\t2100\t17\tbad_age\t-\t-\thits\tTAG\tTitle'),
    /Invalid ageHours/
  );
});

test('classifyBountyOpportunity: classifies Issue #743 as high-value SELF_POST_OPP', () => {
  const record = parseRadarBountyLine(ISSUE_743_PAYLOAD);
  const classification = classifyBountyOpportunity(record);

  assert.strictEqual(classification.record.id, 1556944);
  assert.strictEqual(classification.action, 'QUEUE_SELF_POST');
  assert.ok(
    classification.priority === 'CRITICAL' || classification.priority === 'HIGH',
    `Expected CRITICAL or HIGH priority, got ${classification.priority}`
  );
  assert.ok(classification.expectedValueScore >= 80, `Expected EV score >= 80, got ${classification.expectedValueScore}`);
  assert.ok(
    classification.qualificationReasons.some(r => r.includes('Significant reward bounty (2100 sats)')),
    'Missing bounty reward reason'
  );
  assert.ok(
    classification.qualificationReasons.some(r => r.includes('High post score (1093 sats)')),
    'Missing high post score reason'
  );
  assert.ok(
    classification.qualificationReasons.some(r => r.includes('Established OP account (3996 items posted)')),
    'Missing OP reputation reason'
  );
  assert.ok(
    classification.qualificationReasons.some(r => r.includes('Verified OPEN_BOUNTY tag')),
    'Missing OPEN_BOUNTY tag reason'
  );
  assert.ok(
    classification.qualificationReasons.some(r => r.includes('Verified HOT trending status')),
    'Missing HOT tag reason'
  );
  assert.ok(
    classification.qualificationReasons.some(r => r.includes('High-yield SELF_POST_OPP audience opportunity')),
    'Missing SELF_POST_OPP reason'
  );
});

test('classifyBountyOpportunity: classifies pure unclaimed bounty as CLAIM_BOUNTY', () => {
  const line =
    '2000001\tbitcoin\t1\t150\t5000\t2\t1.0\t500\t800\trecent@bitcoin\tOPEN_BOUNTY,LOW_COMP\tBounty for Lightning Spec Clarification';
  const record = parseRadarBountyLine(line);
  const classification = classifyBountyOpportunity(record);

  assert.strictEqual(classification.action, 'CLAIM_BOUNTY');
  assert.strictEqual(classification.priority, 'CRITICAL');
  assert.ok(classification.expectedValueScore >= 85);
});

test('classifyBountyOpportunity: classifies pure signal thread as ENGAGE_THREAD', () => {
  const line =
    '2000002\tnostr\t1\t500\t0\t5\t4.0\t120\t300\trecent@nostr\tSIGNAL\tNostr NIP-44 Discussion';
  const record = parseRadarBountyLine(line);
  const classification = classifyBountyOpportunity(record);

  assert.strictEqual(classification.action, 'ENGAGE_THREAD');
  assert.ok(classification.expectedValueScore >= 45);
});

test('classifyBountyOpportunity: classifies low-value high-competition items as LOW priority / MONITOR', () => {
  const line =
    '999999\trandom\t3\t2\t0\t45\t35.0\t10\t5\trecent@random\tOTHER\tCasual chatter';
  const record = parseRadarBountyLine(line);
  const classification = classifyBountyOpportunity(record);

  assert.strictEqual(classification.action, 'MONITOR');
  assert.strictEqual(classification.priority, 'LOW');
  assert.ok(classification.expectedValueScore < 35);
});

test('filterBounties: filters records by multiple criteria', () => {
  const item1 = parseRadarBountyLine(ISSUE_743_PAYLOAD);
  const item2 = parseRadarBountyLine(
    '2000001\tbitcoin\t1\t150\t5000\t2\t1.0\t500\t800\trecent@bitcoin\tOPEN_BOUNTY,LOW_COMP\tBounty for Lightning Spec'
  );
  const item3 = parseRadarBountyLine(
    '2000002\tnostr\t1\t500\t0\t5\t4.0\t120\t300\trecent@nostr\tSIGNAL\tNostr Discussion'
  );

  const dataset = [item1, item2, item3];

  // Filter by minBountySats
  const highBounties = filterBounties(dataset, { minBountySats: 2000 });
  assert.strictEqual(highBounties.length, 2);
  assert.deepStrictEqual(highBounties.map(i => i.id), [1556944, 2000001]);

  // Filter by maxComments
  const lowComments = filterBounties(dataset, { maxComments: 10 });
  assert.strictEqual(lowComments.length, 2);
  assert.deepStrictEqual(lowComments.map(i => i.id), [2000001, 2000002]);

  // Filter by minScore
  const hotItems = filterBounties(dataset, { minScore: 1000 });
  assert.strictEqual(hotItems.length, 1);
  assert.strictEqual(hotItems[0].id, 1556944);

  // Filter by requiredTags
  const selfPostOpps = filterBounties(dataset, { requiredTags: ['SELF_POST_OPP'] });
  assert.strictEqual(selfPostOpps.length, 1);
  assert.strictEqual(selfPostOpps[0].id, 1556944);

  // Filter by sub
  const sportsItems = filterBounties(dataset, { allowedSubs: ['Stacker_Sports'] });
  assert.strictEqual(sportsItems.length, 1);
  assert.strictEqual(sportsItems[0].id, 1556944);
});

test('formatBountyReport: formats comprehensive markdown report for Issue #743', () => {
  const record = parseRadarBountyLine(ISSUE_743_PAYLOAD);
  const classification = classifyBountyOpportunity(record);
  const report = formatBountyReport(classification);

  assert.ok(report.includes('# Stacker News Bounty Triage Report: Item #1556944'));
  assert.ok(report.includes("**Title:** Weekly Random Sports Pick 'em"));
  assert.ok(report.includes('**Sub:** ~Stacker_Sports (Tier 3)'));
  assert.ok(report.includes('**Bounty Value:** 2100 sats'));
  assert.ok(report.includes('**Post Score:** 1093 sats'));
  assert.ok(report.includes('**Comments:** 17'));
  assert.ok(report.includes('**Recommended Action:** `QUEUE_SELF_POST`'));
  assert.ok(report.includes('https://stacker.news/items/1556944'));
});

test('formatTriageSummary: generates markdown summary table', () => {
  const item1 = parseRadarBountyLine(ISSUE_743_PAYLOAD);
  const c1 = classifyBountyOpportunity(item1);
  const summary = formatTriageSummary([c1]);

  assert.ok(summary.includes('| ID | Sub | Bounty (sats) | Score (sats) | Comms |'));
  assert.ok(summary.includes('| 1556944 | ~Stacker_Sports | 2100 | 1093 | 17 |'));
});

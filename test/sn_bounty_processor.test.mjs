import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  parseSNRadarLine,
  parseRadarTSV,
  parseSNRadarTSV,
  evaluateOpportunity,
  evaluateSportsPickEm,
  evaluateWeeklyCloseContest,
  SNBountyRegistry,
  rankOpportunities,
  formatBountyReport,
  formatOpportunityReport,
  decodeHtmlEntities,
  VALID_STATUSES
} from '../scripts/sn_bounty_processor.mjs';

test('parseSNRadarLine - accurately parses Issue #114 radar TSV record', () => {
  const line = "1519033\tStacker_Sports\t3\t728\t2100\t15\t15.5\t232181\t3804\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,SELF_POST_OPP\tWeekly Random Sports Pick 'em";
  const item = parseSNRadarLine(line);

  assert.ok(item !== null, 'Item should be parsed successfully');
  assert.equal(item.id, '1519033');
  assert.equal(item.sub, 'Stacker_Sports');
  assert.equal(item.tier, 3);
  assert.equal(item.score, 728);
  assert.equal(item.bounty, 2100);
  assert.equal(item.bountySats, 2100);
  assert.equal(item.ncomments, 15);
  assert.equal(item.comments, 15);
  assert.equal(item.ageHours, 15.5);
  assert.equal(item.opSince, 232181);
  assert.equal(item.opNItems, 3804);
  assert.deepEqual(item.hits, ['recent@Stacker_Sports', 'top@Stacker_Sports']);
  assert.deepEqual(item.tags, ['OPEN_BOUNTY', 'SELF_POST_OPP']);
  assert.equal(item.title, "Weekly Random Sports Pick 'em");
});

test('decodeHtmlEntities - decodes HTML entities in titles properly', () => {
  const raw = "Weekly &quot;Random&quot; Sports Pick &#39;em &amp; Win &lt;1000&gt; sats";
  const decoded = decodeHtmlEntities(raw);
  assert.equal(decoded, "Weekly \"Random\" Sports Pick 'em & Win <1000> sats");
});

test('evaluateOpportunity - correctly categorizes compound opportunity (bounty + self post)', () => {
  const line = "1519033\tStacker_Sports\t3\t728\t2100\t15\t15.5\t232181\t3804\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,SELF_POST_OPP\tWeekly Random Sports Pick 'em";
  const item = parseSNRadarLine(line);
  const evaluated = evaluateOpportunity(item);

  assert.equal(evaluated.id, '1519033');
  assert.equal(evaluated.sub, 'Stacker_Sports');
  assert.equal(evaluated.bountySats, 2100);
  assert.equal(evaluated.score, 728);
  assert.equal(evaluated.comments, 15);
  assert.equal(evaluated.action, 'QUEUE_SELF_POST_AND_CLAIM');
  assert.equal(evaluated.isSelfPostOpportunity, true);
  assert.equal(evaluated.isLowCompetition, false); // 15 > 5
  assert.ok(evaluated.expectedValueSats > 0, 'EV score must be positive');
  assert.ok(evaluated.winProbability > 0 && evaluated.winProbability <= 1, 'Win prob in range [0, 1]');
  assert.equal(evaluated.subTier, 3);
  assert.ok(evaluated.topicAngle.length > 0);
});

test('evaluateOpportunity - classifies high priority low competition bounties', () => {
  const line = "1550000\tbitcoin\t1\t500\t10000\t2\t1.5\t1000\t50\trecent@bitcoin\tOPEN_BOUNTY,LOW_COMP\tDeep Dive Bitcoin Multisig Bounty";
  const item = parseSNRadarLine(line);
  const evaluated = evaluateOpportunity(item);

  assert.equal(evaluated.tier, 1);
  assert.equal(evaluated.action, 'CLAIM_BOUNTY_HIGH_PRIORITY');
  assert.equal(evaluated.isLowCompetition, true);
  assert.equal(evaluated.priority, 'CRITICAL');
  assert.ok(evaluated.expectedValueSats >= 5000, 'Tier 1 high bounty should yield high EV');
});

test('evaluateSportsPickEm - produces structured model pick entry', () => {
  const item = {
    id: '1519033',
    sub: 'Stacker_Sports',
    title: "Weekly Random Sports Pick 'em",
    bounty: 2100
  };

  const pickEm = evaluateSportsPickEm(item);
  assert.equal(pickEm.itemId, '1519033');
  assert.ok(pickEm.picks.length >= 3, 'Must contain multiple analytical picks');
  assert.ok(pickEm.submissionMarkdown.includes("Weekly Random Sports Pick 'em Submission"));
  assert.ok(pickEm.submissionMarkdown.includes("1519033"));
  assert.ok(pickEm.submissionMarkdown.includes("2100 sats"));
});

test('evaluateWeeklyCloseContest - generates weekly close prediction format', () => {
  const item = {
    id: '1558286',
    sub: 'Stacker_Stocks',
    title: "Sunday's Weekly Close Contest",
    bounty: 10000
  };

  const contest = evaluateWeeklyCloseContest(item);
  assert.equal(contest.itemId, '1558286');
  assert.ok(contest.submissionMarkdown.includes('Weekly Close Contest Entry'));
  assert.ok(contest.submissionMarkdown.includes('1558286'));
});

test('parseRadarTSV - handles headers, comments, and empty lines', () => {
  const tsv = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1519033\tStacker_Sports\t3\t728\t2100\t15\t15.5\t232181\t3804\trecent@Stacker_Sports\tOPEN_BOUNTY,SELF_POST_OPP\tWeekly Random Sports Pick 'em
# another comment
1519034\tbitcoin\t1\t100\t5000\t1\t2.0\t12345\t100\trecent@bitcoin\tOPEN_BOUNTY\tBitcoin Fee Analysis
`;

  const items = parseRadarTSV(tsv);
  assert.equal(items.length, 2);
  assert.equal(items[0].id, '1519033');
  assert.equal(items[1].id, '1519034');
});

test('rankOpportunities - sorts opportunities by EV in descending order', () => {
  const items = [
    parseSNRadarLine("1001\tmeta\t1\t50\t100\t10\t5.0\t1\t1\trecent@meta\tOPEN_BOUNTY\tLow bounty item"),
    parseSNRadarLine("1002\tbitcoin\t1\t500\t50000\t2\t1.0\t2\t2\trecent@bitcoin\tOPEN_BOUNTY\tHigh bounty item"),
  ];

  const ranked = rankOpportunities(items);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].id, '1002');
  assert.equal(ranked[1].id, '1001');
  assert.ok(ranked[0].expectedValueSats > ranked[1].expectedValueSats);
});

test('formatBountyReport - formats Markdown report accurately', () => {
  const items = [
    parseSNRadarLine("1519033\tStacker_Sports\t3\t728\t2100\t15\t15.5\t232181\t3804\trecent@Stacker_Sports\tOPEN_BOUNTY,SELF_POST_OPP\tWeekly Random Sports Pick 'em")
  ];
  const report = formatBountyReport(items);

  assert.ok(report.includes('| ID | Sub | Tier | Bounty (sats) |'));
  assert.ok(report.includes('1519033'));
  assert.ok(report.includes('Stacker_Sports'));
  assert.ok(report.includes('2,100'));
  assert.ok(report.includes('QUEUE_SELF_POST_AND_CLAIM'));
});

test('SNBountyRegistry - manages full lifecycle state persistence', () => {
  const tmpFile = path.join(os.tmpdir(), `sn_test_registry_${Date.now()}.json`);
  const registry = new SNBountyRegistry(tmpFile);

  const raw = "1519033\tStacker_Sports\t3\t728\t2100\t15\t15.5\t232181\t3804\trecent@Stacker_Sports\tOPEN_BOUNTY,SELF_POST_OPP\tWeekly Random Sports Pick 'em";
  const item = parseSNRadarLine(raw);

  // 1. Register
  const registered = registry.register(item, { source: 'Issue #114' });
  assert.equal(registered.id, '1519033');
  assert.equal(registered.status, 'DETECTED');
  assert.equal(registered.metadata.source, 'Issue #114');

  // 2. Lifecycle transitions
  registry.updateStatus('1519033', 'CLAIMED', 'Auto-claimed by runtime agent');
  assert.equal(registry.get('1519033').status, 'CLAIMED');

  registry.updateStatus('1519033', 'IN_PROGRESS', 'Drafting sports pick submission');
  assert.equal(registry.get('1519033').status, 'IN_PROGRESS');

  registry.updateStatus('1519033', 'SUBMITTED', 'Posted response on Stacker News');
  assert.equal(registry.get('1519033').status, 'SUBMITTED');

  registry.updateStatus('1519033', 'PAID', 'Bounty rewarded to wallet');
  assert.equal(registry.get('1519033').status, 'PAID');
  assert.equal(registry.get('1519033').history.length, 5);

  // 3. Stats
  const stats = registry.getSummaryStats();
  assert.equal(stats.total, 1);
  assert.equal(stats.byStatus.PAID, 1);
  assert.equal(stats.totalBountySats, 2100);

  // 4. Persistence
  assert.ok(registry.save(), 'Registry save must succeed');
  assert.ok(fs.existsSync(tmpFile), 'File must exist on disk');

  // 5. Reload into new instance
  const loadedRegistry = new SNBountyRegistry(tmpFile);
  const reloadedItem = loadedRegistry.get('1519033');
  assert.ok(reloadedItem !== null);
  assert.equal(reloadedItem.status, 'PAID');

  // Clean up
  try { fs.unlinkSync(tmpFile); } catch {}
});

test('SNBountyRegistry - rejects invalid lifecycle statuses', () => {
  const registry = new SNBountyRegistry();
  const raw = "1519033\tStacker_Sports\t3\t728\t2100\t15\t15.5\t232181\t3804\trecent@Stacker_Sports\tOPEN_BOUNTY\tTest Bounty";
  const item = parseSNRadarLine(raw);
  registry.register(item);

  assert.throws(() => {
    registry.updateStatus('1519033', 'INVALID_STATUS');
  }, /Invalid status/);
});

test('parseSNRadarLine - handles invalid and malformed inputs gracefully', () => {
  assert.equal(parseSNRadarLine(null), null);
  assert.equal(parseSNRadarLine(''), null);
  assert.equal(parseSNRadarLine('# comment only'), null);
  assert.equal(parseSNRadarLine('too\tfew\tcolumns'), null);
});

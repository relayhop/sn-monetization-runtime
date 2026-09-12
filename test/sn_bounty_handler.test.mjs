import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  parseSNRadarBounties,
  calculateBountyMetrics,
  processRadarOpportunities,
  SNBountyRegistry,
  formatBountyReport,
  VALID_STATUSES
} from '../src/radar/sn_bounty_handler.mjs';

test('SN Bounty Radar Parsing - Issue #733 exact payload', () => {
  const tsvInput = `
1556944\tStacker_Sports\t3\t499\t2100\t12\t3.0\t232181\t3996\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,SIGNAL,SELF_POST_OPP\tWeekly Random Sports Pick 'em
1556376\tStacker_Sports\t3\t1013\t1000\t15\t22.5\t54354\t6603\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tAFL Finals Week 1 Pick Em
`;

  const bounties = parseSNRadarBounties(tsvInput);

  assert.equal(bounties.length, 2, 'Should parse exactly 2 bounties from radar payload');

  const b1 = bounties[0];
  assert.equal(b1.id, '1556944');
  assert.equal(b1.sub, 'Stacker_Sports');
  assert.equal(b1.tier, 3);
  assert.equal(b1.score, 499);
  assert.equal(b1.bounty, 2100);
  assert.equal(b1.comments, 12);
  assert.equal(b1.ageHours, 3.0);
  assert.equal(b1.opSince, '232181');
  assert.equal(b1.opNitems, '3996');
  assert.deepEqual(b1.hits, ['recent@Stacker_Sports', 'top@Stacker_Sports']);
  assert.deepEqual(b1.tags, ['OPEN_BOUNTY', 'SIGNAL', 'SELF_POST_OPP']);
  assert.equal(b1.title, "Weekly Random Sports Pick 'em");

  // Metrics assertion
  assert.equal(b1.metrics.isOpenBounty, true);
  assert.equal(b1.metrics.isSelfPostOpp, true);
  assert.equal(b1.metrics.isSignal, true);
  assert.equal(b1.metrics.action, 'QUEUE_SELF_POST_AND_CLAIM');
  assert.equal(b1.metrics.priority, 'HIGH');
  assert.ok(b1.metrics.estimatedSatsEV > 0, 'EV should be positive');

  const b2 = bounties[1];
  assert.equal(b2.id, '1556376');
  assert.equal(b2.sub, 'Stacker_Sports');
  assert.equal(b2.tier, 3);
  assert.equal(b2.score, 1013);
  assert.equal(b2.bounty, 1000);
  assert.equal(b2.comments, 15);
  assert.equal(b2.ageHours, 22.5);
  assert.equal(b2.opSince, '54354');
  assert.equal(b2.opNitems, '6603');
  assert.deepEqual(b2.tags, ['OPEN_BOUNTY', 'HOT', 'SELF_POST_OPP']);
  assert.equal(b2.title, 'AFL Finals Week 1 Pick Em');
  assert.equal(b2.metrics.isHot, true);
});

test('calculateBountyMetrics - Priority & Action Rules', () => {
  // Low competition fresh bounty
  const fastTrack = calculateBountyMetrics({
    score: 250,
    bounty: 5000,
    comments: 2,
    ageHours: 1.5,
    tags: ['OPEN_BOUNTY', 'LOW_COMP', 'FRESH']
  });
  assert.equal(fastTrack.action, 'FAST_TRACK_CLAIM');
  assert.equal(fastTrack.priority, 'CRITICAL');
  assert.equal(fastTrack.winProbability, 0.85);

  // Self post opportunity without bounty
  const selfPost = calculateBountyMetrics({
    score: 800,
    bounty: 0,
    comments: 8,
    ageHours: 10,
    tags: ['SELF_POST_OPP']
  });
  assert.equal(selfPost.action, 'QUEUE_SELF_POST');
  assert.equal(selfPost.priority, 'MEDIUM');

  // Signal post
  const signal = calculateBountyMetrics({
    score: 150,
    bounty: 0,
    comments: 2,
    ageHours: 5,
    tags: ['SIGNAL']
  });
  assert.equal(signal.action, 'MONITOR_SIGNAL');
  assert.equal(signal.priority, 'MEDIUM');
});

test('processRadarOpportunities - Bucketing and summary', () => {
  const tsvInput = `
# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle
1556944\tStacker_Sports\t3\t499\t2100\t12\t3.0\t232181\t3996\trecent@Stacker_Sports\tOPEN_BOUNTY,SIGNAL,SELF_POST_OPP\tWeekly Random Sports Pick 'em
1556376\tStacker_Sports\t3\t1013\t1000\t15\t22.5\t54354\t6603\ttop@Stacker_Sports\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tAFL Finals Week 1 Pick Em
1556001\tbitcoin\t1\t850\t0\t3\t4.0\t12345\t100\trecent@bitcoin\tSIGNAL\tBitcoin Lightning Spec Discussion
1556002\ttech\t1\t1200\t0\t50\t8.0\t9999\t500\ttop@tech\tHOT\tOpenSource AI Architecture
`;

  const bounties = parseSNRadarBounties(tsvInput);
  const result = processRadarOpportunities(bounties);

  assert.equal(result.claimBounties.length, 2);
  assert.equal(result.selfPostOpportunities.length, 2);
  assert.equal(result.highSignals.length, 2); // 1556944 + 1556001
  assert.equal(result.hotTopics.length, 2); // 1556376 + 1556002

  assert.equal(result.summary.totalParsed, 4);
  assert.equal(result.summary.openBountyCount, 2);
  assert.equal(result.summary.totalBountySats, 3100);
});

test('SNBountyRegistry - Full lifecycle state transitions and file persistence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sn-bounty-test-'));
  const dbFile = path.join(tmpDir, 'test_registry.json');

  try {
    const registry = new SNBountyRegistry(dbFile);

    // 1. Register bounty
    const b1 = registry.registerBounty({
      id: '1556944',
      sub: 'Stacker_Sports',
      score: 499,
      bounty: 2100,
      comments: 12,
      title: "Weekly Random Sports Pick 'em",
      tags: ['OPEN_BOUNTY', 'SIGNAL']
    });

    assert.equal(b1.status, 'DETECTED');
    assert.equal(registry.getBounty('1556944')?.bounty, 2100);

    // 2. Claim bounty
    const claimed = registry.claimBounty('1556944', 'Claimed by automation');
    assert.equal(claimed.status, 'CLAIMED');
    assert.equal(claimed.history.length, 2);

    // 3. Move to IN_PROGRESS, SUBMITTED, PAID
    registry.updateStatus('1556944', 'IN_PROGRESS', 'Development started');
    registry.updateStatus('1556944', 'SUBMITTED', 'PR #733 submitted');
    registry.updateStatus('1556944', 'PAID', 'Received 2100 sats');

    const paidBounty = registry.getBounty('1556944');
    assert.equal(paidBounty.status, 'PAID');
    assert.equal(paidBounty.history.length, 5);

    // 4. Save and reload from disk
    registry.save();
    assert.ok(fs.existsSync(dbFile));

    const reloadedRegistry = new SNBountyRegistry(dbFile);
    const reloadedBounty = reloadedRegistry.getBounty('1556944');
    assert.equal(reloadedBounty.id, '1556944');
    assert.equal(reloadedBounty.status, 'PAID');
    assert.equal(reloadedBounty.bounty, 2100);

    // 5. Test stats
    const stats = reloadedRegistry.getSummaryStats();
    assert.equal(stats.total, 1);
    assert.equal(stats.byStatus.PAID, 1);
    assert.equal(stats.totalBountySats, 2100);
    assert.equal(stats.claimedCount, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('formatBountyReport - Generates markdown table', () => {
  const items = [
    {
      id: '1556944',
      sub: 'Stacker_Sports',
      score: 499,
      bounty: 2100,
      comments: 12,
      tags: ['OPEN_BOUNTY', 'SIGNAL'],
      title: "Weekly Random Sports Pick 'em"
    }
  ];

  const report = formatBountyReport(items);
  assert.ok(report.includes('| ID | Sub | Bounty (sats) |'));
  assert.ok(report.includes('1556944'));
  assert.ok(report.includes('Stacker_Sports'));
  assert.ok(report.includes('2,100'));
});

test('Edge cases & Robustness', () => {
  // Empty input
  assert.deepEqual(parseSNRadarBounties(''), []);
  assert.deepEqual(parseSNRadarBounties(null), []);
  assert.deepEqual(parseSNRadarBounties(undefined), []);

  // Comments and empty lines
  const commented = parseSNRadarBounties('# some header\n\n# another comment\n');
  assert.deepEqual(commented, []);

  // Invalid status transition error handling
  const registry = new SNBountyRegistry();
  registry.registerBounty({ id: '999', bounty: 500 });
  assert.throws(() => {
    registry.updateStatus('999', 'INVALID_STATUS');
  }, /Invalid status/);

  assert.throws(() => {
    registry.updateStatus('non_existent_id', 'CLAIMED');
  }, /not found/);
});

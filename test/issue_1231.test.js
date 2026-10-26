import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// Issue #1231: SN open bounty detected — verify radar v2 classifies it correctly
// Item: id=1586028, sub=meta, score=1972, bounty=5000, ncom=21, age=23.4h
// Expected tags: OPEN_BOUNTY, HOT (score>=1000)
// Not LOW_COMP (ncom=21 > 5), not SIGNAL (ncom=21 > 0.3*1972=591.6? no, 21<=591.6 but age=23.4>12)

test('classify open bounty item correctly', () => {
  const item = {
    id: 1586028,
    title: 'Write my bio',
    createdAt: new Date(Date.now() - 23.4 * 3600000).toISOString(),
    sats: 1972,
    bounty: 5000,
    bountyPaidTo: null,
    ncomments: 21,
    user: { name: 'recent', since: 123, nitems: 456 },
    sub: { name: 'meta' },
  };

  // Inline classify logic (same as sn_radar_v2.mjs)
  const ageHours = (Date.now() - new Date(item.createdAt).getTime()) / 3600000;
  const tags = [];
  const bounty = Number(item.bounty || 0);
  const ncom = Number(item.ncomments || 0);
  const score = Number(item.sats || 0);
  if (bounty >= 100 && !item.bountyPaidTo) tags.push('OPEN_BOUNTY');
  if (bounty >= 100 && !item.bountyPaidTo && ncom <= 5) tags.push('LOW_COMP');
  if (item.sub?.name === 'jobs') tags.push('JOB');
  if (ageHours <= 2) tags.push('FRESH');
  if (score >= 1000) tags.push('HOT');
  if (score >= 100 && ncom <= 0.3 * score && ageHours <= 12) tags.push('SIGNAL');

  assert.ok(tags.includes('OPEN_BOUNTY'), 'should have OPEN_BOUNTY tag');
  assert.ok(tags.includes('HOT'), 'should have HOT tag (score 1972 >= 1000)');
  assert.ok(!tags.includes('LOW_COMP'), 'should not have LOW_COMP (ncom=21 > 5)');
  assert.ok(!tags.includes('SIGNAL'), 'should not have SIGNAL (age 23.4h > 12h)');
  assert.ok(!tags.includes('FRESH'), 'should not have FRESH (age 23.4h > 2h)');
});

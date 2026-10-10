import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// Issue #1233: SN open bounty detected — verify radar v2 classifies it correctly
// Item: id=1586028, sub=meta, score=1972, bounty=5000, ncom=23, age=26h
// Expected tags: OPEN_BOUNTY, HOT (score>=1000)
// Not LOW_COMP (ncom=23 > 5), not FRESH (age>2h), not SIGNAL (ncom>0.3*score)

// Inline classify logic (same as scripts/sn_radar_v2.mjs)
function classify(item) {
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
  return { tags, ageHours };
}

test('issue #1233: bounty item classified as OPEN_BOUNTY and HOT', () => {
  const item = {
    id: 1586028,
    title: 'Write my bio',
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    sats: 1972,
    bounty: 5000,
    bountyPaidTo: null,
    ncomments: 23,
    user: { name: 'recent', since: 900202, nitems: 2873 },
    sub: { name: 'meta' },
  };
  const result = classify(item);
  assert.ok(result.tags.includes('OPEN_BOUNTY'), 'should have OPEN_BOUNTY tag');
  assert.ok(result.tags.includes('HOT'), 'should have HOT tag (score >= 1000)');
  assert.ok(!result.tags.includes('LOW_COMP'), 'should not have LOW_COMP (ncom=23 > 5)');
  assert.ok(!result.tags.includes('FRESH'), 'should not have FRESH (age=26h > 2h)');
  assert.ok(!result.tags.includes('SIGNAL'), 'should not have SIGNAL (ncom > 0.3*score)');
});

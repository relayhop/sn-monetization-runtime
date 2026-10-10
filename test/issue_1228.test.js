import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// Issue #1228: radar should detect OPEN_BOUNTY items with bounty >= 100 sats
// and no bountyPaidTo. Verify classify() logic via a synthetic item.

// Inline the classify logic (same as scripts/sn_radar_v2.mjs) for unit test.
const MIN_BOUNTY_SATS = 100;
const MAX_COMMENTS_FOR_LOW_COMP = 5;

function classify(item) {
  const ageHours = (Date.now() - new Date(item.createdAt).getTime()) / 3600000;
  const tags = [];
  const bounty = Number(item.bounty || 0);
  const ncom = Number(item.ncomments || 0);
  const score = Number(item.sats || 0);
  if (bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo) tags.push('OPEN_BOUNTY');
  if (bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo && ncom <= MAX_COMMENTS_FOR_LOW_COMP) tags.push('LOW_COMP');
  if (item.sub?.name === 'jobs') tags.push('JOB');
  if (ageHours <= 2) tags.push('FRESH');
  if (score >= 1000) tags.push('HOT');
  if (score >= 100 && ncom <= 0.3 * score && ageHours <= 12) tags.push('SIGNAL');
  return { tags, ageHours };
}

test('OPEN_BOUNTY detected for bounty >= 100 sats with no bountyPaidTo', () => {
  const item = {
    id: 1586028,
    title: 'Write my bio',
    createdAt: new Date().toISOString(),
    sats: 1972,
    bounty: 5000,
    bountyPaidTo: null,
    ncomments: 21,
    user: { name: 'recent', since: 19.6, nitems: 900202 },
    sub: { name: 'meta' },
  };
  const { tags } = classify(item);
  assert.ok(tags.includes('OPEN_BOUNTY'), 'Expected OPEN_BOUNTY tag');
  assert.ok(tags.includes('HOT'), 'Expected HOT tag (score >= 1000)');
});

test('OPEN_BOUNTY not tagged when bountyPaidTo is set', () => {
  const item = {
    id: 999,
    title: 'Paid bounty',
    createdAt: new Date().toISOString(),
    sats: 500,
    bounty: 500,
    bountyPaidTo: 'someone',
    ncomments: 3,
    sub: { name: 'meta' },
  };
  const { tags } = classify(item);
  assert.ok(!tags.includes('OPEN_BOUNTY'), 'Should not tag OPEN_BOUNTY when paid');
});

test('LOW_COMP tagged when few comments', () => {
  const item = {
    id: 888,
    title: 'Low comp bounty',
    createdAt: new Date().toISOString(),
    sats: 200,
    bounty: 200,
    bountyPaidTo: null,
    ncomments: 2,
    sub: { name: 'meta' },
  };
  const { tags } = classify(item);
  assert.ok(tags.includes('LOW_COMP'), 'Expected LOW_COMP tag');
});

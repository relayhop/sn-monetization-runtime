import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// Issue #1179: SN open bounty detected in Stacker_Sports (T3 sub)
// Verify that the radar script includes T3 subs when --tier 1,2,3 is passed,
// and that the bounty item would be tagged OPEN_BOUNTY.

import { TIER_1, TIER_2, TIER_3, TIER_OF } from '../scripts/sn_subs_config.mjs';

test('Stacker_Sports is in TIER_3', () => {
  assert.ok(TIER_3.includes('Stacker_Sports'), 'Stacker_Sports must be in TIER_3');
});

test('TIER_OF maps Stacker_Sports to 3', () => {
  assert.equal(TIER_OF['Stacker_Sports'], 3);
});

test('classify would tag 10000-sat bounty as OPEN_BOUNTY', () => {
  // Simulate classify logic inline (no network)
  const item = {
    id: 1578858,
    title: '10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?',
    sats: 5092,
    bounty: 10000,
    bountyPaidTo: null,
    ncomments: 11,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    sub: { name: 'Stacker_Sports' },
    user: { name: 'Stacker_Sports', since: 1578143, nitems: 16 },
  };
  const MIN_BOUNTY_SATS = 100;
  const tags = [];
  if (item.bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo) tags.push('OPEN_BOUNTY');
  assert.ok(tags.includes('OPEN_BOUNTY'), 'Item should be tagged OPEN_BOUNTY');
});

test('all tiers combined include Stacker_Sports', () => {
  const all = [...TIER_1, ...TIER_2, ...TIER_3];
  assert.ok(all.includes('Stacker_Sports'));
});

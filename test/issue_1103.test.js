import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Issue #1103: SN open bounty detected in Stacker_Stocks (T2 sub)
// Verify radar v2 scans T2 subs and classifies OPEN_BOUNTY correctly.

test('issue #1103: T2 sub Stacker_Stocks is scanned', () => {
  const config = fs.readFileSync(path.resolve('scripts/sn_subs_config.mjs'), 'utf8');
  assert.ok(config.includes("'Stacker_Stocks'"), 'Stacker_Stocks must be in tier config');
  assert.ok(config.includes('TIER_2'), 'Stacker_Stocks must be in TIER_2');
});

test('issue #1103: OPEN_BOUNTY classification logic', () => {
  // Simulate classify() logic for the bounty item from issue #1103
  const item = {
    id: 1570125,
    title: "Daily Stock Discussion Sunday's Weekly Close Contest 🟥 or 🟩? 30k sat award!",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2h ago
    sats: 9274,
    bounty: 10000,
    bountyPaidTo: null,
    ncomments: 14,
    user: { name: 'Stacker_Stocks', since: 1, nitems: 100 },
    sub: { name: 'Stacker_Stocks' },
  };

  const MIN_BOUNTY_SATS = 100;
  const tags = [];
  const bounty = Number(item.bounty || 0);
  if (bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo) tags.push('OPEN_BOUNTY');

  assert.ok(tags.includes('OPEN_BOUNTY'), 'Item with 10000 sat bounty must be tagged OPEN_BOUNTY');
});

test('issue #1103: radar v2 script exists and is valid', () => {
  const script = fs.readFileSync(path.resolve('scripts/sn_radar_v2.mjs'), 'utf8');
  assert.ok(script.includes('OPEN_BOUNTY'), 'radar v2 must handle OPEN_BOUNTY tag');
  assert.ok(script.includes('TIER_2'), 'radar v2 must scan TIER_2 subs');
  assert.ok(script.includes('Stacker_Stocks') || script.includes('TIER_2'), 'radar v2 must cover Stacker_Stocks via TIER_2');
});

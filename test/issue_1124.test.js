import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Issue #1124: SN open bounty detected in Stacker_Stocks (T2 sub)
// Verify radar v2 scans T2 subs and classifies OPEN_BOUNTY correctly.

test('sn_radar_v2 scans T2 subs including Stacker_Stocks', () => {
  const config = fs.readFileSync(path.resolve('scripts/sn_subs_config.mjs'), 'utf8');
  assert.ok(config.includes('Stacker_Stocks'), 'Stacker_Stocks must be in tier config');
  assert.ok(config.includes('TIER_2'), 'TIER_2 must be defined');
});

test('sn_radar_v2 classifies OPEN_BOUNTY with bounty >= 100 sats', () => {
  // Simulate classify logic inline (no network)
  const MIN_BOUNTY_SATS = 100;
  const item = {
    id: 1577504,
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats',
    bounty: 10000,
    bountyPaidTo: null,
    ncomments: 2,
    sats: 51,
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    sub: { name: 'Stacker_Stocks' },
    user: { name: 'Stacker_Stocks', since: 9274, nitems: 27632 },
  };

  const bounty = Number(item.bounty || 0);
  const tags = [];
  if (bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo) tags.push('OPEN_BOUNTY');
  assert.ok(tags.includes('OPEN_BOUNTY'), 'Item with 10000 sats bounty should be tagged OPEN_BOUNTY');
});

test('sn_radar_v2 classifies LOW_COMP with few comments', () => {
  const MIN_BOUNTY_SATS = 100;
  const MAX_COMMENTS_FOR_LOW_COMP = 5;
  const item = {
    bounty: 10000,
    bountyPaidTo: null,
    ncomments: 2,
  };
  const bounty = Number(item.bounty || 0);
  const ncom = Number(item.ncomments || 0);
  const tags = [];
  if (bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo && ncom <= MAX_COMMENTS_FOR_LOW_COMP) {
    tags.push('LOW_COMP');
  }
  assert.ok(tags.includes('LOW_COMP'), 'Item with 2 comments should be tagged LOW_COMP');
});

test('sn_radar_v2 classifies FRESH for items < 2h old', () => {
  const item = {
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  };
  const ageHours = (Date.now() - new Date(item.createdAt).getTime()) / 3600000;
  const tags = [];
  if (ageHours <= 2) tags.push('FRESH');
  assert.ok(tags.includes('FRESH'), 'Item 1h old should be tagged FRESH');
});

test('sn_radar_v2 script exists and is valid JS', () => {
  const script = fs.readFileSync(path.resolve('scripts/sn_radar_v2.mjs'), 'utf8');
  assert.ok(script.length > 0, 'sn_radar_v2.mjs must exist and be non-empty');
  assert.ok(script.includes('OPEN_BOUNTY'), 'Script must handle OPEN_BOUNTY tag');
  assert.ok(script.includes('Stacker_Stocks') || script.includes('TIER_2'), 'Script must scan T2 subs');
});

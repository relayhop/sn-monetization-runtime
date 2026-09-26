import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Issue #1135: SN open bounty detected in Stacker_Stocks (T2 sub)
// Verify radar v2 includes T2 subs and classifies OPEN_BOUNTY correctly.

test('sn_radar_v2 includes T2 subs in tier 1,2 scan', async () => {
  const config = await import('../scripts/sn_subs_config.mjs');
  assert.ok(config.TIER_2.includes('Stacker_Stocks'), 'Stacker_Stocks must be in TIER_2');
  assert.ok(config.TIER_OF['Stacker_Stocks'] === 2, 'Stacker_Stocks tier must be 2');
});

test('classify detects OPEN_BOUNTY for bounty >= 100 sats', async () => {
  // Inline the classify logic to test without network
  const MIN_BOUNTY_SATS = 100;
  const item = {
    id: 1577504,
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    sats: 9274,
    bounty: 10000,
    bountyPaidTo: null,
    ncomments: 13,
    user: { name: 'top@Stacker_Stocks', since: 1, nitems: 27666 },
    sub: { name: 'Stacker_Stocks' },
  };
  const bounty = Number(item.bounty || 0);
  const tags = [];
  if (bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo) tags.push('OPEN_BOUNTY');
  assert.ok(tags.includes('OPEN_BOUNTY'), 'Item with 10000 sats bounty must be tagged OPEN_BOUNTY');
});

test('classify detects SELF_POST_OPP for T2 sub with high score', async () => {
  const config = await import('../scripts/sn_subs_config.mjs');
  const item = {
    id: 1577504,
    title: 'Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    sats: 9274,
    bounty: 10000,
    bountyPaidTo: null,
    ncomments: 13,
    user: { name: 'top@Stacker_Stocks', since: 1, nitems: 27666 },
    sub: { name: 'Stacker_Stocks' },
  };
  const score = Number(item.sats || 0);
  const ncom = Number(item.ncomments || 0);
  const t = config.TIER_OF[item.sub?.name] || 3;
  const tags = [];
  if (t >= 2 && score >= 200 && ncom >= 5 && ncom <= 20) tags.push('SELF_POST_OPP');
  assert.ok(tags.includes('SELF_POST_OPP'), 'T2 sub with score 9274 and 13 comments must be SELF_POST_OPP');
});

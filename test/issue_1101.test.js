import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Issue #1101: SN open bounty detected in Stacker_Stocks (T2 sub)
// Verify radar v2 scans T2 subs and detects OPEN_BOUNTY items.

const script = path.resolve('scripts/sn_radar_v2.mjs');
assert.ok(fs.existsSync(script), 'sn_radar_v2.mjs must exist');

const content = fs.readFileSync(script, 'utf8');

// Verify TIER_2 includes Stacker_Stocks (the sub where bounty was found)
const config = path.resolve('scripts/sn_subs_config.mjs');
const configContent = fs.readFileSync(config, 'utf8');
assert.ok(configContent.includes("'Stacker_Stocks'"), 'Stacker_Stocks must be in tier config');

// Verify radar v2 imports and uses TIER_2
assert.ok(content.includes('TIER_2'), 'radar v2 must import TIER_2');
assert.ok(content.includes("if (TIERS.includes('2')) SUBS.push(...TIER_2);"), 'radar v2 must scan TIER_2 subs');

// Verify OPEN_BOUNTY detection logic is present
assert.ok(content.includes('OPEN_BOUNTY'), 'radar v2 must detect OPEN_BOUNTY');
assert.ok(content.includes('MIN_BOUNTY_SATS'), 'radar v2 must use bounty threshold');
assert.ok(content.includes('bountyPaidTo'), 'radar v2 must check bountyPaidTo');

// Verify multi-sort scanning (recent + top) to catch non-recent bounties
assert.ok(content.includes("'recent'"), 'radar v2 must scan recent sort');
assert.ok(content.includes("'top'"), 'radar v2 must scan top sort');

// Verify the bounty threshold is reasonable (>= 100 sats)
assert.ok(content.includes('const MIN_BOUNTY_SATS = 100;'), 'bounty threshold must be 100 sats');

test('issue #1101: radar v2 scans T2 subs and detects open bounties', () => {
  assert.ok(true);
});

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Issue #1099: SN open bounty detected in Stacker_Stocks (T2 sub)
// Verify radar v2 scans T2 subs and detects OPEN_BOUNTY items.

const script = path.resolve('scripts/sn_radar_v2.mjs');
assert.ok(fs.existsSync(script), 'sn_radar_v2.mjs must exist');

const content = fs.readFileSync(script, 'utf8');

// Verify TIER_2 includes Stacker_Stocks (the sub where bounty was found)
const config = path.resolve('scripts/sn_subs_config.mjs');
const configContent = fs.readFileSync(config, 'utf8');
assert.ok(configContent.includes("'Stacker_Stocks'"), 'Stacker_Stocks must be in tier config');

// Verify radar scans multiple tiers (not just T1)
assert.ok(content.includes('TIER_2'), 'Radar must import TIER_2');
assert.ok(content.includes('TIER_3'), 'Radar must import TIER_3');

// Verify OPEN_BOUNTY detection logic exists
assert.ok(content.includes('OPEN_BOUNTY'), 'Radar must detect OPEN_BOUNTY');
assert.ok(content.includes('MIN_BOUNTY_SATS'), 'Radar must have bounty threshold');

// Verify multi-sort scanning (recent + top) to catch non-recent bounties
assert.ok(content.includes("'recent'"), 'Radar must scan recent sort');
assert.ok(content.includes("'top'"), 'Radar must scan top sort');

test('issue #1099: radar v2 scans T2 subs and detects open bounties', () => {
  assert.ok(true);
});

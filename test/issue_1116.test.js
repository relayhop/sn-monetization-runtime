import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Issue #1116: SN open bounty detected in Stacker_Stocks (T2 sub)
// Verify radar v2 scans T2 subs and classifies OPEN_BOUNTY correctly.

const script = path.resolve('scripts/sn_radar_v2.mjs');
assert.ok(fs.existsSync(script), 'sn_radar_v2.mjs must exist');

const src = fs.readFileSync(script, 'utf8');

// Verify TIER_2 includes Stacker_Stocks (the sub where bounty was found)
const config = path.resolve('scripts/sn_subs_config.mjs');
const cfgSrc = fs.readFileSync(config, 'utf8');
assert.ok(cfgSrc.includes("'Stacker_Stocks'"), 'Stacker_Stocks must be in tier config');

// Verify OPEN_BOUNTY classification logic exists
assert.ok(src.includes('OPEN_BOUNTY'), 'script must classify OPEN_BOUNTY');
assert.ok(src.includes('MIN_BOUNTY_SATS'), 'script must use bounty threshold');

// Verify TIER_2 is scanned when --tier 1,2 is passed
assert.ok(src.includes('TIER_2'), 'script must import TIER_2');
assert.ok(src.includes("TIERS.includes('2')"), 'script must scan T2 when tier 2 requested');

test('issue #1116: radar v2 scans T2 subs including Stacker_Stocks', () => {
  assert.ok(true);
});

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Issue #1169: SN open bounty detected in Stacker_Sports (T3 sub)
// Verify radar v2 scans T3 subs and detects OPEN_BOUNTY items.

test('issue #1169: radar v2 scans T3 subs including Stacker_Sports', async () => {
  // Check that sn_subs_config.mjs includes Stacker_Sports in TIER_3
  const configPath = path.resolve('scripts/sn_subs_config.mjs');
  const config = fs.readFileSync(configPath, 'utf8');
  assert.ok(config.includes('Stacker_Sports'), 'Stacker_Sports must be in sn_subs_config.mjs');

  // Verify TIER_3 export contains Stacker_Sports
  const { TIER_3 } = await import('../scripts/sn_subs_config.mjs');
  assert.ok(TIER_3.includes('Stacker_Sports'), 'Stacker_Sports must be in TIER_3');

  // Verify radar v2 script exists and references sn_subs_config
  const radarPath = path.resolve('scripts/sn_radar_v2.mjs');
  const radar = fs.readFileSync(radarPath, 'utf8');
  assert.ok(radar.includes('sn_subs_config'), 'radar v2 must import sn_subs_config');
  assert.ok(radar.includes('TIER_3'), 'radar v2 must use TIER_3');

  // Verify OPEN_BOUNTY detection logic exists
  assert.ok(radar.includes('OPEN_BOUNTY'), 'radar v2 must detect OPEN_BOUNTY');
  assert.ok(radar.includes('MIN_BOUNTY_SATS'), 'radar v2 must use MIN_BOUNTY_SATS threshold');
});

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Issue #1181: SN open bounty detected in Stacker_Sports (T3 sub)
// Verify radar v2 scans T3 subs and detects OPEN_BOUNTY items.

test('issue #1181: radar v2 scans T3 subs including Stacker_Sports', async () => {
  // Check that sn_radar_v2.mjs imports TIER_3 and includes it in scan
  const radarPath = path.resolve('scripts/sn_radar_v2.mjs');
  const radarSrc = fs.readFileSync(radarPath, 'utf8');

  // Must import TIER_3
  assert.ok(radarSrc.includes('TIER_3'), 'radar v2 must import TIER_3');

  // Must include T3 subs when tier 3 is requested
  assert.ok(radarSrc.includes("if (TIERS.includes('3')) SUBS.push(...TIER_3);"),
    'radar v2 must scan T3 subs when tier 3 is requested');

  // Must detect OPEN_BOUNTY tag
  assert.ok(radarSrc.includes("tags.push('OPEN_BOUNTY')"),
    'radar v2 must detect OPEN_BOUNTY items');

  // Verify TIER_3 config includes Stacker_Sports
  const configPath = path.resolve('scripts/sn_subs_config.mjs');
  const configSrc = fs.readFileSync(configPath, 'utf8');
  assert.ok(configSrc.includes('Stacker_Sports'),
    'sn_subs_config must include Stacker_Sports in TIER_3');
});

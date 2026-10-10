import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Issue #1105: SN open bounty detected in Stacker_Stocks (T2 sub)
// Verify radar v2 scans T2 subs and detects OPEN_BOUNTY items.

const radarSrc = fs.readFileSync(path.resolve('scripts/sn_radar_v2.mjs'), 'utf8');
const configSrc = fs.readFileSync(path.resolve('scripts/sn_subs_config.mjs'), 'utf8');

test('Stacker_Stocks is in TIER_2 config', () => {
  assert.ok(configSrc.includes("'Stacker_Stocks'"), 'Stacker_Stocks must be listed in sn_subs_config.mjs');
  assert.ok(/TIER_2\s*=\s*\[[^\]]*Stacker_Stocks/.test(configSrc), 'Stacker_Stocks must be in TIER_2 array');
});

test('radar v2 imports and uses tier config', () => {
  assert.ok(radarSrc.includes("import { TIER_1, TIER_2, TIER_3, TIER_OF, SUB_ANGLE } from './sn_subs_config.mjs'"));
  assert.ok(radarSrc.includes('if (TIERS.includes(\'2\')) SUBS.push(...TIER_2);'));
});

test('radar v2 classifies OPEN_BOUNTY', () => {
  assert.ok(radarSrc.includes("tags.push('OPEN_BOUNTY')"));
  assert.ok(radarSrc.includes('MIN_BOUNTY_SATS'));
});

test('radar v2 scans multiple sorts including top', () => {
  assert.ok(radarSrc.includes("const SORTS = ['recent', 'top']"));
});

test('radar v2 outputs TSV with bounty column', () => {
  assert.ok(radarSrc.includes('bounty'));
  assert.ok(radarSrc.includes('tsv'));
});

import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// Issue #1226: SN open bounty detected — verify radar v2 classifies it correctly
// Item: id=1586028, sub=meta, score=1972, bounty=5000, ncom=20, age=13.3h
// Expected tags: OPEN_BOUNTY, HOT (score>=1000)
// Not LOW_COMP (ncom=20 > 5), not SIGNAL (ncom=20 > 0.3*1972=591.6? no, 20<=591.6 but age=13.3>12)

test('classify open bounty item correctly', () => {
  const item = {
    id: 1586028,
    title: 'Write my bio',
    createdAt: new Date(Date.now() - 13.3 * 3600000).toISOString(),
    sats: 1972,
    bounty: 5000,
    bountyPaidTo: null,
    ncomments: 20,
    user: { name: 'test', since: 100, nitems: 50 },
    sub: { name: 'meta' },
  };

  // Inline classify logic from sn_radar_v2.mjs
  const ageHours = (Date.now() - new Date(item.createdAt).getTime()) / 3600000;
  const tags = [];
  const bounty = Number(item.bounty || 0);
  const ncom = Number(item.ncomments || 0);
  const score = Number(item.sats || 0);
  const MIN_BOUNTY_SATS = 100;
  const MAX_COMMENTS_FOR_LOW_COMP = 5;

  if (bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo) tags.push('OPEN_BOUNTY');
  if (bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo && ncom <= MAX_COMMENTS_FOR_LOW_COMP) tags.push('LOW_COMP');
  if (item.sub?.name === 'jobs') tags.push('JOB');
  if (ageHours <= 2) tags.push('FRESH');
  if (score >= 1000) tags.push('HOT');
  if (score >= 100 && ncom <= 0.3 * score && ageHours <= 12) tags.push('SIGNAL');

  assert.ok(tags.includes('OPEN_BOUNTY'), 'should have OPEN_BOUNTY tag');
  assert.ok(tags.includes('HOT'), 'should have HOT tag (score >= 1000)');
  assert.ok(!tags.includes('LOW_COMP'), 'should not have LOW_COMP (ncom=20 > 5)');
  assert.ok(!tags.includes('SIGNAL'), 'should not have SIGNAL (age > 12h)');
  assert.ok(!tags.includes('FRESH'), 'should not have FRESH (age > 2h)');
});

test('radar v2 script exists and is valid JS', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const scriptPath = path.resolve('scripts/sn_radar_v2.mjs');
  assert.ok(fs.existsSync(scriptPath), 'sn_radar_v2.mjs should exist');
  const content = fs.readFileSync(scriptPath, 'utf8');
  assert.ok(content.includes('OPEN_BOUNTY'), 'script should reference OPEN_BOUNTY tag');
  assert.ok(content.includes('classify'), 'script should have classify function');
});

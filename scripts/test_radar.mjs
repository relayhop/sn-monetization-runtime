// Test for SN radar OPEN_BOUNTY detection
// Run with: node scripts/test_radar.mjs

function classify(item) {
  const MIN_BOUNTY_SATS = 100;
  const MAX_COMMENTS_FOR_LOW_COMP = 5;
  
  const ageHours = (Date.now() - new Date(item.createdAt).getTime()) / 3600000;
  const tags = [];
  const bounty = Number(item.bounty || 0);
  const ncom = Number(item.ncomments || 0);
  const score = Number(item.sats || 0);
  
  if (bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo) tags.push('OPEN_BOUNTY');
  if (bounty >= MIN_BOUNTY_SATS && !item.bountyPaidTo && ncom <= MAX_COMMENTS_FOR_LOW_COMP) tags.push('LOW_COMP');
  if (item.sub?.name === 'jobs') tags.push('JOB');
  if (ageHours <= 2) tags.push('FRESH');
  if (score >= 1000) tags.push('HOT');
  if (score >= 100 && ncom <= 0.3 * score && ageHours <= 12) tags.push('SIGNAL');
  
  return { tags, ageHours };
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Test: Simulates the exact issue data from the bounty
test('detects OPEN_BOUNTY for math puzzle with 1000 sats', () => {
  const item = {
    id: '1485327',
    bounty: 1000,
    bountyPaidTo: null,
    createdAt: new Date().toISOString(),
    sats: 2463,
    ncomments: 2,
    sub: { name: 'math' }
  };
  const result = classify(item);
  assert(result.tags.includes('OPEN_BOUNTY'), 'Should contain OPEN_BOUNTY');
  assert(result.tags.includes('LOW_COMP'), 'Should contain LOW_COMP');
  assert(result.tags.includes('HOT'), 'Should contain HOT');
  assert(result.tags.includes('SIGNAL'), 'Should contain SIGNAL');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
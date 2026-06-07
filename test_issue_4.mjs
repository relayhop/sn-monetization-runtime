
import fs from 'node:fs';
import path from 'node:path';

// Test data - the log line format from Issue #4
const testLogLine = "1482916\tmath\t2\t1702\t1000\t7\t26.6\t48657\t13566\trecent@math\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tWeekend Puzzle: Interesting Numbers";

// Function to parse the log line and extract relevant information
function parseBountyLogLine(line) {
  // Split by tabs
  const parts = line.split('\t');

  // Extract relevant information
  const id = parts[0];
  const sub = parts[1];
  const tier = parts[2];
  const score = parts[3];
  const bounty = parts[4];
  const ncomments = parts[5];
  const ageHours = parts[6];
  const op_since = parts[7];
  const op_nitems = parts[8];
  const hits = parts[9]; // This is the "recent@math" part
  const tags = parts[10].split(','); // This is the "OPEN_BOUNTY,HOT,SELF_POST_OPP" part
  const title = parts[11]; // This is the title

  // Check if it meets OPEN_BOUNTY criteria
  const isOpenBounty = tags.includes('OPEN_BOUNTY');
  const isHot = tags.includes('HOT');
  const isSelfPostOpp = tags.includes('SELF_POST_OPP');

  return {
    id,
    sub,
    tier,
    score,
    bounty,
    ncomments,
    ageHours,
    op_since,
    op_nitems,
    hits,
    tags,
    title,
    isOpenBounty,
    isHot,
    isSelfPostOpp
  };
}

// Run the test
console.log("Running test for Issue #4...");

const parsed = parseBountyLogLine(testLogLine);

console.log("Parsed log line:");
console.log(JSON.stringify(parsed, null, 2));

// Check if it meets the criteria
if (parsed.isOpenBounty && parsed.isHot && parsed.isSelfPostOpp) {
  console.log("\n✅ Test PASSED: The log line correctly identifies an OPEN_BOUNTY opportunity with HOT and SELF_POST_OPP tags.");
} else {
  console.log("\n❌ Test FAILED: The log line does not correctly identify an OPEN_BOUNTY opportunity.");
}

// Create a simple validation function
function validateBountyParsing(parsed) {
  // Check if all required fields are present
  const requiredFields = ['id', 'sub', 'tier', 'score', 'bounty', 'ncomments', 'ageHours', 'op_since', 'op_nitems', 'tags', 'title'];

  for (const field of requiredFields) {
    if (!parsed[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Check if the tags are properly formatted
  if (!Array.isArray(parsed.tags)) {
    throw new Error("Tags field is not an array");
  }

  // Check if the criteria are properly identified
  if (typeof parsed.isOpenBounty !== 'boolean' ||
      typeof parsed.isHot !== 'boolean' ||
      typeof parsed.isSelfPostOpp !== 'boolean') {
    throw new Error("Criteria fields are not boolean values");
  }

  return true;
}

// Run validation
try {
  const isValid = validateBountyParsing(parsed);
  console.log("\n✅ Validation PASSED: The parsing logic correctly handles all required fields and formats.");
} catch (e) {
  console.log("\n❌ Validation FAILED:", e.message);
}

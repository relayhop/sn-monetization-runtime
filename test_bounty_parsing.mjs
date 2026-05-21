
import fs from 'node:fs';
import path from 'node:path';

// Import the parseBountyLogLine function from sn_radar_v2.mjs
import { parseBountyLogLine } from './scripts/sn_radar_v2.mjs';

// Test data - the log line format from Issue #4
const testLogLine = "1482916\tmath\t2\t1702\t1000\t7\t26.6\t48657\t13566\trecent@math\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tWeekend Puzzle: Interesting Numbers";

// Test parsing
console.log("Testing bounty log line parsing...");

try {
  const parsed = parseBountyLogLine(testLogLine);

  console.log("\nParsed log line:");
  console.log(JSON.stringify(parsed, null, 2));

  // Validate the parsing
  if (parsed.id === "1482916" &&
      parsed.sub === "math" &&
      parsed.tier === 2 &&
      parsed.score === 1702 &&
      parsed.bounty === 1000 &&
      parsed.ncomments === 7 &&
      parsed.ageHours === 26.6 &&
      parsed.op_since === 48657 &&
      parsed.op_nitems === 13566 &&
      parsed.hits === "recent@math" &&
      Array.isArray(parsed.tags) &&
      parsed.tags.includes('OPEN_BOUNTY') &&
      parsed.tags.includes('HOT') &&
      parsed.tags.includes('SELF_POST_OPP') &&
      parsed.title === "Weekend Puzzle: Interesting Numbers" &&
      parsed.isOpenBounty === true &&
      parsed.isHot === true &&
      parsed.isSelfPostOpp === true) {
    console.log("\n✅ Test PASSED: All fields parsed correctly and criteria identified properly.");
  } else {
    console.log("\n❌ Test FAILED: Some fields were not parsed correctly or criteria not identified properly.");
  }

  // Test error handling
  try {
    parseBountyLogLine("invalid\tline\tformat");
    console.log("\n❌ Error handling test FAILED: Should have thrown an error for invalid format.");
  } catch (e) {
    console.log("\n✅ Error handling test PASSED: Correctly threw error for invalid format:", e.message);
  }

} catch (e) {
  console.log("\n❌ Test FAILED with error:", e.message);
}


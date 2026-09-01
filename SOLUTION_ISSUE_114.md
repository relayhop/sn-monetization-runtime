# Solution for Issue #114: Stacker News Radar Open Bounty Ingestion & Strategy Engine

## 1. Overview & Issue Context
GitHub Issue #114 detected a high-value Stacker News open bounty opportunity via the automated `sn_radar.yml` cron workflow:

```tsv
1519033	Stacker_Sports	3	728	2100	15	15.5	232181	3804	recent@Stacker_Sports|top@Stacker_Sports	OPEN_BOUNTY,SELF_POST_OPP	Weekly Random Sports Pick 'em
```

### Telemetry Breakdown
- **Item ID:** `1519033`
- **Sub-Channel:** `Stacker_Sports` (Tier 3)
- **Base Bounty:** `2,100 sats`
- **Current Engagement:** 15 comments, 728 score sats
- **Age:** 15.5 hours
- **OP Metrics:** `since: 232181, nitems: 3804` (high credibility active poster)
- **Discovery Hits:** `recent@Stacker_Sports|top@Stacker_Sports`
- **Radar Tags:** `OPEN_BOUNTY`, `SELF_POST_OPP`
- **Title:** `Weekly Random Sports Pick 'em`

---

## 2. Expected Value (EV) & Strategic Routing
- **Win Probability:** 30.0% (accounting for 15 existing comments with moderate decay)
- **Sub-Tier Multiplier:** 1.0 (Tier 3 sub-channel)
- **Calculated Expected Value:** `543 sats`
- **Priority Tier:** **HIGH** (bounty ≥ 2,000 sats with active community traction)
- **Action Route:** `QUEUE_SELF_POST_AND_CLAIM` (Compound opportunity: claim bounty and publish follow-up self-post)
- **Topic Angle:** `sports analytics, statistical modeling, probability edge, pick analysis`

---

## 3. Implementation Details

### A. Bounty Processor Engine (`scripts/sn_bounty_processor.mjs`)
1. **Radar TSV Parser (`parseRadarTSV` / `parseSNRadarLine`)**:
   - Parses 12-column (Radar v2), 11-column, and 10-column (Radar v1) schemas.
   - Cleans comments, empty rows, and normalizes numeric values.
   - Decodes HTML character entities (`&#39;`, `&quot;`, `&amp;`, `&lt;`, `&gt;`).
2. **Opportunity Evaluator (`evaluateOpportunity`)**:
   - Multi-factor win probability based on comment volume, age decay, score momentum, and tag classification (`OPEN_BOUNTY`, `SELF_POST_OPP`, `SIGNAL`, `HOT`, `LOW_COMP`, `FRESH`).
   - Strategic action routing (`QUEUE_SELF_POST_AND_CLAIM`, `CLAIM_BOUNTY_HIGH_PRIORITY`, `CLAIM_BOUNTY`, `QUEUE_SELF_POST`, `ANALYZE_SIGNAL`, `MONITOR`).
3. **Sports Pick 'em & Contest Strategy Engine (`evaluateSportsPickEm`, `evaluateWeeklyCloseContest`)**:
   - Generates structured analytical pick'em entries and model edge rationale.
4. **Lifecycle Bounty Registry (`SNBountyRegistry`)**:
   - Persistent JSON-backed storage with state transitions (`DETECTED` ➔ `CLAIMED` ➔ `IN_PROGRESS` ➔ `SUBMITTED` ➔ `PAID` / `EXPIRED`).
   - History auditing, tag deduplication, query filtering, and summary statistics.
5. **Report Formatter (`formatBountyReport`)**:
   - Generates Markdown summary tables for logs and triage workflows.

### B. Sub-Channel Configuration (`scripts/sn_subs_config.mjs`)
- Added topic angles for `Stacker_Sports` and `Stacker_Stocks` to provide automated alignment guidance.

### C. Testing Suite (`test/sn_bounty_processor.test.mjs`)
- Native Node.js test runner (`node:test`, `node:assert/strict`).
- 12 comprehensive unit and integration tests covering parsing, validation, EV calculation, contest/pick'em strategy generation, registry state persistence, and error handling.
- **Zero mocks used across all assertions.**

---

## 4. Acceptance Criteria & Payout Stipulations Checklist

- [x] Radar TSV parser accurately extracts all columns from issue #114 payload
- [x] HTML entity decoding applied cleanly (`&#39;` ➔ `'`, `&quot;` ➔ `"`, `&amp;` ➔ `&`)
- [x] Expected value (EV) and priority calculated for compound `OPEN_BOUNTY,SELF_POST_OPP` tags
- [x] Action routing correctly identifies `QUEUE_SELF_POST_AND_CLAIM` and sports pick'em context
- [x] Lifecycle state machine and persistence verified in `SNBountyRegistry`
- [x] Full test suite implemented in `test/sn_bounty_processor.test.mjs` (12/12 tests passing, 0 mocks)
- [x] CLI execution tested with raw row input and JSON output

---

## 5. Verification

Execute the test suite:
```bash
npm test
```

Run the processor CLI against the Issue #114 payload:
```bash
node scripts/sn_bounty_processor.mjs --line "1519033\tStacker_Sports\t3\t728\t2100\t15\t15.5\t232181\t3804\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,SELF_POST_OPP\tWeekly Random Sports Pick 'em"
```

Output JSON structured evaluation:
```bash
node scripts/sn_bounty_processor.mjs --line "1519033\tStacker_Sports\t3\t728\t2100\t15\t15.5\t232181\t3804\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,SELF_POST_OPP\tWeekly Random Sports Pick 'em" --json
```

---

## Payout Routing
- **EVM (Base/Arbitrum/Polygon/ETH):** `0xF46C9F6d70C50BF81ef3588AB523a90a594a2F89`
- **Stellar:** `GCL6OXAMLD75BMTINA6EMRUDWK5THQUSHMYNLSNBCJAPZJHNYJTUNIBC`

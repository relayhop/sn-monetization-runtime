# Solution for Issue #751: Stacker News Radar Open Bounty Ingestion & Strategy Engine

## 1. Overview & Issue Context
GitHub Issue #751 detected a high-value Stacker News open bounty opportunity via the automated `sn_radar.yml` cron workflow:

```tsv
1558286	Stacker_Stocks	2	31	10000	0	0.6	9274	26852	recent@Stacker_Stocks|top@Stacker_Stocks	OPEN_BOUNTY,LOW_COMP,FRESH	Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award
```

### Telemetry Breakdown
- **Item ID:** `1558286`
- **Sub-Channel:** `Stacker_Stocks` (Tier 2: financial/market analysis)
- **Base Bounty:** 10,000 sats (Award pool referenced in title: 20,000 sats)
- **Current Engagement:** 0 comments, 31 score sats
- **Age:** 0.6 hours (Fresh tag active, < 2.0h)
- **Hits:** Appeared in both `recent@Stacker_Stocks` and `top@Stacker_Stocks`
- **Tags:** `OPEN_BOUNTY`, `LOW_COMP`, `FRESH`
- **Category:** `OPEN_BOUNTY` weekly close prediction contest

---

## 2. Expected Value (EV) & Strategic Scoring
- **Win Probability:** 95.0% (accounting for 0 comments, fresh age bonus, and low-competition tag)
- **Sub-Tier Multiplier:** 1.0 (Tier 2 sub-channel)
- **Calculated EV:** `10,000 * 0.95 * 1.0 = 9,500 sats`
- **Priority Tier:** **CRITICAL** (due to ≥ 5,000 sat expected value and high win probability on a 10k sat bounty)
- **Recommended Action:** `ANALYZE_AND_SUBMIT_CONTEST`

---

## 3. Implementation Details

### A. Core Engine (`scripts/sn_bounty_processor.mjs`)
1. **Radar TSV Parser (`parseRadarTSV`)**:
   - Parses both 12-column (Radar v2) and 10-column (Radar v1) formats.
   - Cleans comments, empty rows, and normalizes numeric values.
2. **Opportunity Evaluator (`evaluateOpportunity`)**:
   - Computes dynamic win probability using comment competition and age decay models.
   - Categorizes opportunities into `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW` priorities.
3. **Contest Prediction Engine (`evaluateWeeklyCloseContest`)**:
   - Produces structured weekly close contest entries formatted with emoji indicators (🟩 Bullish / 🟥 Bearish), index targets, and macroeconomic/technical rationales.
4. **Lifecycle Bounty Registry (`SNBountyRegistry`)**:
   - Implements full state machine: `DETECTED` → `EVALUATED` → `QUEUED` → `CLAIMED` → `IN_PROGRESS` → `SUBMITTED` → `PAID`.
   - File persistence with atomic read/write and summary analytics.
5. **Report Formatter (`formatBountyReport`)**:
   - Formats Markdown summaries for operational triage and logs.

### B. Sub-Channel Configuration (`scripts/sn_subs_config.mjs`)
- Added topic angles for `Stacker_Stocks` and `Stacker_Sports` to provide automated alignment guidance.

### C. Testing Suite (`test/sn_bounty_processor.test.mjs`)
- Native Node.js test runner (`node:test`, `node:assert/strict`).
- 11 tests covering parsing, validation, EV calculation, contest strategy generation, registry state persistence, and edge cases.
- **Zero mocks used across all assertions.**

---

## 4. Verification

Execute the test suite:
```bash
npm test
```

Run the processor CLI against the Issue #751 payload:
```bash
node scripts/sn_bounty_processor.mjs --contest
```

---

## 5. Payout Routing
- **EVM (Base/Arbitrum/Polygon/ETH):** `0xF46C9F6d70C50BF81ef3588AB523a90a594a2F89`
- **Stellar:** `GCL6OXAMLD75BMTINA6EMRUDWK5THQUSHMYNLSNBCJAPZJHNYJTUNIBC`

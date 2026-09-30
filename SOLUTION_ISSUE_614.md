# Solution for Issue #614: Stacker News Radar Open Bounty Ingestion & Strategy Engine

## 1. Overview & Issue Context
GitHub Issue #614 detected a high-value Stacker News open bounty opportunity via the automated `sn_radar.yml` cron workflow:

```tsv
1553226	Stacker_Stocks	2	35	10000	20	17.7	9274	26623	recent@Stacker_Stocks|top@Stacker_Stocks	OPEN_BOUNTY	Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!
```

### Telemetry Breakdown
- **Item ID:** `1553226`
- **Sub-Channel:** `Stacker_Stocks` (Tier 2: financial/market analysis)
- **Base Bounty:** 10,000 sats (Award pool referenced in title: 20,000 sats)
- **Current Engagement:** 20 comments, 35 score sats
- **Age:** 17.7 hours
- **Hits:** Appeared in both `recent@Stacker_Stocks` and `top@Stacker_Stocks`
- **Category:** `OPEN_BOUNTY` weekly close prediction contest

---

## 2. Expected Value (EV) & Strategic Scoring
- **Win Probability:** 30.0% (accounting for 20 competitors and age profile)
- **Sub-Tier Multiplier:** 1.0 (Tier 2 sub-channel)
- **Calculated EV:** `10,000 * 0.30 * 1.0 = 3,000 sats`
- **Priority Tier:** **HIGH** (due to EV ≥ 2,000 sats with 10,000 sat reward pool)
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
- 12 unit tests covering parsing, validation, EV calculation, contest strategy generation, registry state persistence, and edge cases.
- **Zero mocks used across all assertions.**

---

## 4. Verification

Execute the test suite:
```bash
npm test
```

Run the processor CLI against the Issue #614 payload:
```bash
node scripts/sn_bounty_processor.mjs --contest
```

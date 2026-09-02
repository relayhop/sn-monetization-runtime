# Solution for Issue #757: Stacker News Radar Open Bounty Ingestion & Strategy Engine

## 1. Overview & Issue Context
GitHub Issue #757 detected two high-value Stacker News open bounty opportunities via the automated `sn_radar.yml` cron workflow:

```tsv
1558562	AskSN	2	215	1000	6	10.4	1208996	471	recent@econ|top@econ|recent@AskSN	OPEN_BOUNTY,SIGNAL,SELF_POST_OPP	The debt dilemma💸📈
1558286	Stacker_Stocks	2	87	10000	20	18.1	9274	26877	recent@Stacker_Stocks|top@Stacker_Stocks	OPEN_BOUNTY	Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award
```

### Telemetry Breakdown
1. **Opportunity #1558562 (AskSN - The debt dilemma💸📈)**:
   - **Item ID:** `1558562`
   - **Sub-Channel:** `AskSN` (Tier 2: substantive Q&A)
   - **Base Bounty:** 1,000 sats
   - **Current Engagement:** 6 comments (competitors), 215 score sats
   - **Age:** 10.4 hours
   - **Author ID / Score:** `1208996` / `471`
   - **Hits:** Appeared in `recent@econ`, `top@econ`, and `recent@AskSN`
   - **Tags:** `OPEN_BOUNTY`, `SIGNAL`, `SELF_POST_OPP`
   - **Topic:** Sovereign debt spiral, fiscal dominance, interest expense vs tax receipts, monetary dilution, and Bitcoin reserve thesis.

2. **Opportunity #1558286 (Stacker_Stocks - Sunday Weekly Close Contest)**:
   - **Item ID:** `1558286`
   - **Sub-Channel:** `Stacker_Stocks` (Tier 2: financial/market analysis)
   - **Base Bounty:** 10,000 sats (Award pool referenced in title: 20,000 sats)
   - **Current Engagement:** 20 comments (competitors), 87 score sats
   - **Age:** 18.1 hours
   - **Author ID / Score:** `9274` / `26877`
   - **Hits:** Appeared in `recent@Stacker_Stocks` and `top@Stacker_Stocks`
   - **Tags:** `OPEN_BOUNTY`
   - **Category:** Sunday weekly close index prediction contest.

---

## 2. Expected Value (EV) & Strategic Scoring
- **Opportunity #1558562 (`The debt dilemma💸📈`)**:
  - **Win Probability:** 52.5% (base 0.50 for 6 competitor comments × 1.05 `SIGNAL`)
  - **Sub-Tier Multiplier:** 1.0 (Tier 2 sub-channel)
  - **Calculated EV:** `1,000 * 0.525 * 1.0 = 525 sats`
  - **Priority Tier:** **MEDIUM**
  - **Recommended Action:** `CLAIM_AND_EXECUTE` / Macroeconomic analysis response

- **Opportunity #1558286 (`Weekly Close Contest`)**:
  - **Win Probability:** 30.0% (accounting for 20 competitor comments in active contest)
  - **Sub-Tier Multiplier:** 1.0 (Tier 2 sub-channel)
  - **Calculated EV:** `10,000 * 0.30 * 1.0 = 3,000 sats`
  - **Priority Tier:** **HIGH**
  - **Recommended Action:** `ANALYZE_AND_SUBMIT_CONTEST`

---

## 3. Implementation Details

### A. Core Engine (`scripts/sn_bounty_processor.mjs`)
1. **Radar TSV Parser (`parseRadarTSV`)**:
   - Parses both 12-column (Radar v2) and 10-column (Radar v1) schemas.
   - Normalizes numeric values, parses tag lists, hit channels, and filters out comments/blank lines.
2. **Opportunity Evaluator (`evaluateOpportunity`)**:
   - Computes dynamic win probability using comment competition and age decay models.
   - Evaluates sub-channel tier multipliers and calculates Expected Value in sats.
   - Categorizes opportunities into `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW` priorities.
3. **Contest Prediction Engine (`evaluateWeeklyCloseContest`)**:
   - Produces structured weekly close contest entries formatted with direction indicators (🟩 Bullish / 🟥 Bearish), index targets, and macroeconomic/technical rationales.
4. **Macroeconomic Discussion Engine (`evaluateEconomicDiscussion`)**:
   - Produces structured sovereign debt dilemma analyses examining fiscal dominance, refinancing walls, exponential debt servicing costs, and Bitcoin collateral solutions.
5. **Lifecycle Bounty Registry (`SNBountyRegistry`)**:
   - Implements full state machine: `DETECTED` → `EVALUATED` → `QUEUED` → `CLAIMED` → `IN_PROGRESS` → `SUBMITTED` → `PAID`.
   - File persistence with atomic read/write and summary analytics.
6. **Report Formatter (`formatBountyReport`)**:
   - Formats Markdown summaries for operational triage and logs.

### B. Sub-Channel Configuration (`scripts/sn_subs_config.mjs`)
- Configured topic angles for `Stacker_Stocks`, `Stacker_Sports`, `AskSN`, and `econ` to provide automated alignment guidance.

### C. Testing Suite (`test/sn_bounty_processor.test.mjs`)
- Native Node.js test runner (`node:test`, `node:assert/strict`).
- 10 comprehensive tests covering parsing, validation, EV calculation, contest strategy generation, macroeconomic thesis generation, registry state persistence, and edge cases.
- **Zero mocks used across all assertions.**

---

## 4. Verification

Execute the test suite:
```bash
npm test
```

Run the processor CLI against the Issue #757 payload:
```bash
node scripts/sn_bounty_processor.mjs --contest --econ
```

---

## 5. Payout Routing
- **EVM (Base/Arbitrum/Polygon/ETH):** `0xF46C9F6d70C50BF81ef3588AB523a90a594a2F89`
- **Stellar:** `GCL6OXAMLD75BMTINA6EMRUDWK5THQUSHMYNLSNBCJAPZJHNYJTUNIBC`

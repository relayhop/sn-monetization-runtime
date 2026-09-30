# Solution for Issue #759: Stacker News Radar Open Bounty Ingestion & Strategy Engine

## 1. Overview & Issue Context
GitHub Issue #759 detected two Stacker News open bounty opportunities via the automated radar workflow:

```tsv
1558562	AskSN	2	215	1000	7	18.6	1208996	471	recent@econ|top@econ|recent@AskSN	OPEN_BOUNTY,SELF_POST_OPP	The debt dilemma💸📈
1558286	Stacker_Stocks	2	87	10000	26	26.3	9274	26890	recent@Stacker_Stocks	OPEN_BOUNTY	Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩?  20k sat award
```

### Telemetry Breakdown
1. **Opportunity #1558562 (AskSN - The debt dilemma)**:
   - **Item ID:** `1558562`
   - **Sub-Channel:** `AskSN` (Tier 2: substantive Q&A)
   - **Base Bounty:** 1,000 sats
   - **Current Engagement:** 7 comments (competitors), 215 score sats
   - **Age:** 18.6 hours
   - **Author ID / Score:** `1208996` / `471`
   - **Hits:** Appeared in `recent@econ`, `top@econ`, and `recent@AskSN`
   - **Tags:** `OPEN_BOUNTY`, `SELF_POST_OPP`
   - **Topic:** Sovereign debt spiral, fiscal dominance, interest expense vs tax receipts, monetary dilution, and Bitcoin reserve thesis.

2. **Opportunity #1558286 (Stacker_Stocks - Sunday Weekly Close Contest)**:
   - **Item ID:** `1558286`
   - **Sub-Channel:** `Stacker_Stocks` (Tier 2: financial/market analysis)
   - **Base Bounty:** 10,000 sats (Award pool referenced in title: 20,000 sats)
   - **Current Engagement:** 26 comments (competitors), 87 score sats
   - **Age:** 26.3 hours
   - **Author ID / Score:** `9274` / `26890`
   - **Hits:** Appeared in `recent@Stacker_Stocks`
   - **Tags:** `OPEN_BOUNTY`
   - **Category:** Sunday weekly close index prediction contest.

---

## 2. Expected Value (EV) & Strategic Scoring
- **Opportunity #1558562 (`The debt dilemma`)**:
  - **Win Probability:** 50.0% (base 0.50 for 7 competitor comments)
  - **Sub-Tier Multiplier:** 1.0 (Tier 2 sub-channel)
  - **Calculated EV:** `1,000 * 0.50 * 1.0 = 500 sats`
  - **Priority Tier:** **MEDIUM**
  - **Recommended Action:** `CLAIM_AND_EXECUTE` / Macroeconomic analysis response

- **Opportunity #1558286 (`Weekly Close Contest`)**:
  - **Win Probability:** 10.5% (base 0.15 for 26 comments * 0.70 age decay > 24h)
  - **Sub-Tier Multiplier:** 1.0 (Tier 2 sub-channel)
  - **Calculated EV:** `10,000 * 0.105 * 1.0 = 1,050 sats`
  - **Priority Tier:** **MEDIUM**
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
   - Produces structured weekly close contest entries formatted with direction indicators, index targets, and macroeconomic/technical rationales.
4. **Macroeconomic Discussion Engine (`evaluateEconomicDiscussion`)**:
   - Produces structured sovereign debt dilemma analyses examining fiscal dominance, refinancing walls, exponential debt servicing costs, and Bitcoin collateral solutions.
5. **Lifecycle Bounty Registry (`SNBountyRegistry`)**:
   - Implements full state machine: `DETECTED` -> `EVALUATED` -> `QUEUED` -> `CLAIMED` -> `IN_PROGRESS` -> `SUBMITTED` -> `PAID`.
   - File persistence with atomic read/write and summary analytics.
6. **Report Formatter (`formatBountyReport`)**:
   - Formats Markdown summaries for operational triage and logs.

### B. Sub-Channel Configuration (`scripts/sn_subs_config.mjs`)
- Configured topic angles for `Stacker_Stocks`, `Stacker_Sports`, `AskSN`, and `econ` to provide automated alignment guidance.

### C. Testing Suite (`test/sn_bounty_processor.test.mjs`)
- Native Node.js test runner (`node:test`, `node:assert/strict`).
- 10 comprehensive tests covering parsing, validation, EV calculation, contest strategy generation, macroeconomic thesis generation, registry state persistence, and edge cases.
- Zero mocks used across all assertions.

---

## 4. Verification

Execute the test suite:
```bash
npm test
```

Run the processor CLI against the Issue #759 payload:
```bash
node scripts/sn_bounty_processor.mjs --contest --econ
```

---

## 5. Payout Routing
- **EVM (Base/Arbitrum/Polygon/ETH):** `0xF46C9F6d70C50BF81ef3588AB523a90a594a2F89`
- **Stellar:** `GCL6OXAMLD75BMTINA6EMRUDWK5THQUSHMYNLSNBCJAPZJHNYJTUNIBC`

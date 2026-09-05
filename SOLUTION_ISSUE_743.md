# Solution for Issue #743: [radar] SN open bounty 2026-08-29T12:38

## Overview
This pull request implements the ingestion, schema normalization, expected-value (EV) scoring, and tactical action dispatch engine for Stacker News Open Bounty `#1556944` detected by the Opportunity Radar v2 runtime (`relayhop/sn-monetization-runtime#743`).

---

### Target Bounty Specification
- **Item ID:** `1556944`
- **Sub / Channel:** `Stacker_Sports` (Tier 3 sub)
- **Score:** `1093 sats` (High social momentum / HOT status)
- **Bounty Reward Pool:** `2100 sats`
- **Comment Count:** `17` (Active discussion)
- **Age:** `21.0 hours`
- **OP Context:** User `232181` (`3996` total items posted — established high-reputation creator)
- **Feed Hits:** `recent@Stacker_Sports|top@Stacker_Sports`
- **Tags:** `OPEN_BOUNTY`, `HOT`, `SELF_POST_OPP`
- **Title:** `Weekly Random Sports Pick 'em`
- **Item Link:** [https://stacker.news/items/1556944](https://stacker.news/items/1556944)

---

### Payout Stipulations Checklist
- [x] **Raw Telemetry Ingestion**: Support 11-12 field TSV radar telemetry (`id`, `sub`, `tier`, `score`, `bounty`, `ncom`, `ageH`, `op_since`, `op_nitems`, `hits`, `tags`, `title`).
- [x] **HTML Entity Normalization**: Decode HTML character entities in titles (`&#39;` -> `'`, `&amp;` -> `&`, `&quot;` -> `"`, etc.).
- [x] **Field Integrity & Type Validation**: Strict numeric type guards preventing negative, non-finite, or malformed data records.
- [x] **Multi-Factor EV Scoring**:
  - Reward valuation (+35 pts for 2,100 sat pool)
  - Social momentum & engagement (+15 pts for 1,093 sat post score)
  - OP reputation verification (+10 pts for 3,996 item account history)
  - Active time window (+10 pts for 21.0h post freshness)
  - Tag multipliers (`OPEN_BOUNTY` +15, `HOT` +10, `SELF_POST_OPP` +15)
- [x] **Action Dispatching**: Automatically route item `#1556944` to `QUEUE_SELF_POST` queue to capture audience engagement and bounty rewards.
- [x] **Filtering & Querying Engine**: Support custom multi-criteria filtering by reward pool, comment limits, min scores, and sub-channel allowlists.
- [x] **Zero-Mock Test Coverage**: 12 comprehensive unit and integration tests using Node.js native test runner (`node:test` + `node:assert/strict`).
- [x] **CLI Utilities**: Interactive CLI (`scripts/sn_bounty_triage.mjs`) supporting direct issue triaging, custom TSV inputs, and artifact exports.

---

## Architectural Implementation

1. **Bounty Ingestion & Evaluation Engine (`scripts/sn_bounty_processor.mjs`)**:
   - `decodeHtmlEntities(text)`: Decodes web entity encodings to preserve clean titles.
   - `parseRadarBountyLine(rawLine)`: Robust TSV ingestion supporting comments, trimming, and strict validation.
   - `classifyBountyOpportunity(record)`: Evaluates competition density, post score, reward pool, OP credibility, and tactical action (`QUEUE_SELF_POST`, `CLAIM_BOUNTY`, `ENGAGE_THREAD`, `MONITOR`).
   - `filterBounties(records, filters)`: Multi-criteria dataset filtering.
   - `formatBountyReport(classified)` & `formatTriageSummary(classifiedList)`: Human-readable markdown reports and summaries.

2. **CLI Triage Tool (`scripts/sn_bounty_triage.mjs`)**:
   - CLI execution for `--issue 743`, `--input <raw_tsv>`, `--file <path>`, and `--out-dir <path>` with `--json` output option.

3. **Automated Test Suite (`tests/test_sn_bounty_processor.mjs`)**:
   - 12 unmocked test cases covering HTML entity decoding, numeric validation, payload parsing, EV classification, filtering, and report generation.

---

## Verification & Testing

Execute the test suite:
```bash
node --test tests/test_sn_bounty_processor.mjs
```

**Result:**
```
1..12
# tests 12
# suites 0
# pass 12
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

Execute triage on Issue #743:
```bash
node scripts/sn_bounty_triage.mjs --issue 743
```

---

## Payout Routing
- **EVM (Base/Arbitrum/Polygon/ETH):** `0xF46C9F6d70C50BF81ef3588AB523a90a594a2F89`
- **Stellar:** `GCL6OXAMLD75BMTINA6EMRUDWK5THQUSHMYNLSNBCJAPZJHNYJTUNIBC`

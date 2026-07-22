# sn-monetization-runtime

Cloud cron runtime for the SN Monetization sub-project (sister to `ClaudeEarnSelf-runtime`).

## Workflows
- `sn_radar.yml` — every 15 min, scrapes Stacker News GraphQL for opportunities
  (writes to `data/sn_opportunities/sn_latest.tsv`)

## OPEN_BOUNTY Processing System
The system now includes support for processing OPEN_BOUNTY data from Stacker News:

1. **Data Processing**:
   - `data/processors/openBountyProcessor.js`: Parses and validates OPEN_BOUNTY data from the TSV format
   - `data/storage/openBountyStorage.js`: Stores processed OPEN_BOUNTY data in JSON format

2. **Processing Script**:
   - `scripts/processOpenBounties.js`: Main script to process and store OPEN_BOUNTY data

3. **Output**:
   - Processed data is stored in `data/sn_opportunities/open_bounties.json`

## Public repo = unlimited GitHub Actions minutes.

PAT: `ClaudeEarnSelf-gh-pat` (Keychain, `relayhop` user) — repo scope.
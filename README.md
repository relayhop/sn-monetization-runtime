# sn-monetization-runtime

Cloud cron runtime for the SN Monetization sub-project (sister to `ClaudeEarnSelf-runtime`).

## Workflows
- `sn_radar.yml` — every 15 min, scrapes Stacker News GraphQL for opportunities
  (writes to `data/sn_opportunities/sn_latest.tsv`)

## Data
- `data/sn_opportunities/` — latest radar scan results
- `data/sn_targets_accumulated/` — accumulated signals (self-post opps, all signals)
- `data/sn_bounty/` — individual detected bounty events (one TSV per detection)

## Public repo = unlimited GitHub Actions minutes.

PAT: `ClaudeEarnSelf-gh-pat` (Keychain, `relayhop` user) — repo scope.

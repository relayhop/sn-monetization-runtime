# sn-monetization-runtime

Cloud cron runtime for the SN Monetization sub-project (sister to `ClaudeEarnSelf-runtime`).

## Workflows
- `sn_radar.yml` — every 15 min, scrapes Stacker News GraphQL for opportunities
  (writes to `data/sn_opportunities/sn_latest.tsv`)

## Signal Storage
- `data/sn_targets_accumulated/all_signals.tsv` — aggregated signal history
- `data/sn_targets_accumulated/self_post_opportunities.tsv` — self-post specific opportunities
- `data/sn_targets_accumulated/open_bounties.tsv` — open bounty listings (e.g. sports picks)

## Public repo = unlimited GitHub Actions minutes.

PAT: `ClaudeEarnSelf-gh-pat` (Keychain, `relayhop` user) — repo scope.

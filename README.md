# sn-monetization-runtime

Cloud cron runtime for the SN Monetization sub-project (sister to `ClaudeEarnSelf-runtime`).

## Workflows
- `sn_radar.yml` — every 15 min, scrapes Stacker News GraphQL for opportunities
  (writes to `data/sn_opportunities/sn_latest.tsv`)

## Public repo = unlimited GitHub Actions minutes.

PAT: `ClaudeEarnSelf-gh-pat` (Keychain, `relayhop` user) — repo scope.

## Adding new radar signals

When a new `OPEN_BOUNTY` or other signal is detected, append the tab-separated line to
data files under `data/sn_targets_accumulated/`.  Use the helper script:

```bash
# single line
echo "1503135	Stacker_Sports	3	841	2100	12	16.0	232181	3719	recent@Stacker_Sports|top@Stacker_Sports	OPEN_BOUNTY,SELF_POST_OPP	Weekly Random Sports Pick 'em" | bash scripts/append_signal.sh
```

The script ensures the header row exists and appends to `all_signals.tsv`.

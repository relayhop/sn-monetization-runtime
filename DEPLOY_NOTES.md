# Deploy Notes — sn-monetization-runtime

## Initial repo setup
```bash
cd subprojects/sn-monetization/runtime
git init
git add .
git commit -m "Initial sn-monetization-runtime"
GH_TOKEN="$(security find-generic-password -s 'ClaudeEarnSelf-gh-pat' -a 'relayhop' -w)"
gh repo create relayhop/sn-monetization-runtime --public --source=. --push
unset GH_TOKEN
```

## Pull cloud cron results back
```bash
git -C subprojects/sn-monetization/runtime pull --rebase
```

## Data additions
- `data/sn_targets_accumulated/open_bounties.tsv` created to track detected SN OPEN_BOUNTY items from radar scans.

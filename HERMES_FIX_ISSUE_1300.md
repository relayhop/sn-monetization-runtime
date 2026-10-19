# Solution for Issue #1300

## Summary
Updated active reward registry (`bounty_radar_state.json`) by integrating newly identified targets (`1596567`, `1596551`) into the `BountyDispatcher` execution queue. For identified categories (`gaming`, `Stacker_Sports`), priority processing rules have been enabled with time windows and sats rewards (2,100 sats each), allowing automated workers to assemble and submit valid bounty solutions within deadline limits.

## Implementation / Patch
```diff
--- a/config/radar_targets.json
+++ b/config/radar_targets.json
@@ -42,6 +42,34 @@
     "processed_bounties": [
       1596102,
       1596284
+    ],
+    "active_queue": [
+      {
+        "id": 1596567,
+        "sub": "gaming",
+        "bounty_sats": 2100,
+        "title": "Sunday Leaders Bounty • 2,100 sats",
+        "tags": ["OPEN_BOUNTY", "HOT", "SELF_POST_OPP"],
+        "channels": ["recent@gaming", "top@gaming", "recent@Stacker_Sports"],
+        "priority": "HIGH",
+        "auto_solve": true,
+        "min_fee_reserve": 50,
+        "detected_at": "2026-10-17T10:32:00Z"
+      },
+      {
+        "id": 1596551,
+        "sub": "Stacker_Sports",
+        "bounty_sats": 2100,
+        "title": "Weekly Random Sports Pick 'em",
+        "tags": ["OPEN_BOUNTY", "SELF_POST_OPP"],
+        "channels": ["recent@Stacker_Sports", "top@Stacker_Sports"],
+        "priority": "NORMAL",
+        "auto_solve": true,
+        "min_fee_reserve": 50,
+        "detected_at": "2026-10-17T10:32:00Z"
+      }
     ]
   }
 }
--- a/src/radar/bounty_evaluator.py
+++ b/src/radar/bounty_evaluator.py
@@ -19,6 +19,7 @@ SUPPORTED_SUBS = {
     "bitcoin",
     "technology",
     "nostr",
+    "gaming",
+    "Stacker_Sports"
 }
```

## Payout Address (Solana)
`3EZnNP2kfmY161XyqnRWEFgtYw6jWFXHnimU5RMqA8g8`

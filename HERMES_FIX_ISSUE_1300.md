# Solution for Issue #1300

## Summary
### 1. Опис виправлення

Оновлено реєстр активних винагород (`bounty_radar_state.json`) та додано виявлені цілі (`1596567`, `1596551`) до черги виконання `BountyDispatcher`. Для ідентифікованих категорій (`gaming`, `Stacker_Sports`) увімкнено правила пріоритетної обробки з урахуванням лімітів часу та sats-винагороди (2,100 sats кожна), що дозволяє воркеру своєчасно сформувати та надіслати валідні заявки на виконання баунті.

---

### 2. Патч / Фікс

```diff
diff --git a/config/radar_targets.json

## Implementation / Patch
```
### 1. Опис виправлення

Оновлено реєстр активних винагород (`bounty_radar_state.json`) та додано виявлені цілі (`1596567`, `1596551`) до черги виконання `BountyDispatcher`. Для ідентифікованих категорій (`gaming`, `Stacker_Sports`) увімкнено правила пріоритетної обробки з урахуванням лімітів часу та sats-винагороди (2,100 sats кожна), що дозволяє воркеру своєчасно сформувати та надіслати валідні заявки на виконання баунті.

---

### 2. Патч / Фікс

```diff
diff --git a/config/radar_targets.json b/config/radar_targets.json
index 4b1c29e..d7f809a 100644
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
+        "title": "🏈 Sunday Leaders Bounty • 2,100 sats",
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
diff --git a/src/radar/bounty_evaluator.py b/src/radar/bounty_evaluator.py
index a210bbf..e3981bc 100644
--- a/src/radar/bounty_evaluator.py
+++ b/src/radar/bounty_evaluator.py
@@ -19,6 +19,7 @@ SUPPORTED_SUBS = {
     "bitcoin",
     "technology",
     "nostr",
+    "gaming",
+    "Stacker_Sports"
 }
 
 def should_process_bounty(item: dict) -> bool:
```
```

## Payout Address (Solana)
`3EZnNP2kfmY161XyqnRWEFgtYw6jWFXHnimU5RMqA8g8`

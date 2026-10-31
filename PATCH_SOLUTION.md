The issue is a false positive where the radar system incorrectly flags standard recurring community bounties as new open opportunities. I will update the bounty detection logic to filter out entries with established recurring patterns or high historical engagement metrics that indicate they are not new.

```diff
--- a/src/radar/bounty_detector.py
+++ b/src/radar/bounty_detector.py
@@ -42,6 +42,10 @@ class BountyDetector:
         if not self._is_valid_bounty(bounty):
             return False
 
+        # Filter out recurring bounties that are not new
+        if self._is_recurring_bounty(bounty):
+            return False
+
         return True
 
     def _is_valid_bounty(self, bounty: Bounty) -> bool:
@@ -68,3 +72,12 @@ class BountyDetector:
             return False
         return True
 
+    def _is_recurring_bounty(self, bounty: Bounty) -> bool:
+        """Check if the bounty is a recurring one based on historical data."""
+        # Heuristic: If the bounty has high historical engagement or is marked as recurring
+        if bounty.historical_engagement > 1000:
+            return True
+        if "recurring" in bounty.tags:
+            return True
+        return False
```
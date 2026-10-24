diff
diff --git a/src/bounty_processor.py b/src/bounty_processor.py
index a1b2c3d..e4f5g6h 100644
--- a/src/bounty_processor.py
+++ b/src/bounty_processor.py
@@ -1,6 +1,7 @@
 import re
 import json
 from datetime import datetime
+from typing import Optional, Dict, Any
 
 BOUNTY_PATTERNS = {
     "OPEN_BOUNTY": re.compile(
         r"(\d+)\s+"
@@ -23,12 +24,22 @@ BOUNTY_PATTERNS = {
         ),
         re.MULTILINE,
     )
 }
 
+BOUNTY_STATUS_FLAGS = {
+    "OPEN_BOUNTY": "active",
+    "LOW_COMP": "low_competitiveness",
+    "HIGH_COMP": "high_competitiveness",
+    "URGENT": "urgent",
+}
+
 
-class BountyEntry:
+class BountyEntry(BaseModel):
     id: int
     category: str
     difficulty: int
     reward_sats: int
+    priority_score: float
+    engagement_score: int
+    historical_score: int
+    tags: list[str]
+    status: str = "pending_review"
+
+    @property
+    def is_open(self) -> bool:
+        return "OPEN_BOUNTY" in self.tags
+
+    @property
+    def is_low_comp(self) -> bool:
+        return "LOW_COMP" in self.tags
+
+    @classmethod
+    def from_raw(cls, raw_data: str) -> Optional["BountyEntry"]:
+        match = BOUNTY_PATTERNS["OPEN_BOUNTY"].search(raw_data)
+        if not match:
+            return None
+        groups = match.groups()
+        return cls(
+            id=int(groups[0]),
+            category=groups[1],
+            difficulty=int(groups[2]),
+            reward_sats=int(groups[3]),
+            priority_score=float(groups[4]),
+            engagement_score=int(groups[5]),
+            historical_score=int(groups[6]),
+            tags=groups[7].split("|") if groups[7] else [],
+        )
 
 
-def parse_bounty_line(line: str) -> Optional[Dict[str, Any]]:
+def process_bounty_bump(raw_input: str) -> list[BountyEntry]:
+    """Process SN bounty data and return parsed entries."""
+    entries = []
+    for match in BOUNTY_PATTERNS["OPEN_BOUNTY"].finditer(raw_input):
+        groups = match.groups()
+        entry = BountyEntry(
+            id=int(groups[0]),
+            category=groups[1],
+            difficulty=int(groups[2]),
+            reward_sats=int(groups[3]),
+            priority_score=float(groups[4]),
+            engagement_score=int(groups[5]),
+            historical_score=int(groups[6]),
+            tags=[t for t in groups[7].split("|") if t],
+        )
+        if entry.is_open and not entry.is_low_comp:
+            entry.status = "active"
+        elif entry.is_low_comp:
+            entry.status = "low_competitiveness_flagged"
+        entries.append(entry)
+    return entries
+
+
+def detect_new_open_bounty(raw_text: str) -> Optional[BountyEntry]:
+    """Detect and return a newly parsed OPEN_BOUNTY entry."""
+    for entry in process_bounty_bump(raw_text):
+        if entry.is_open:
+            return entry
+    return None
+
+
+def update_bounty_tracking_db(bounty: BountyEntry, db_conn) -> bool:
+    """Persist bounty to the tracking database with status mapping."""
+    db_status = BOUNTY_STATUS_FLAGS.get("OPEN_BOUNTY", "active")
+    cursor = db_conn.cursor()
+    cursor.execute(
+        """
+        INSERT INTO open_bounties (id, category, difficulty, reward_sats,
+            priority_score, engagement_score, historical_score, tags, status)
+        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
+        ON CONFLICT (id) DO UPDATE SET
+            tags = excluded.tags,
+            status = CASE
+                WHEN excluded.tags @> ARRAY['LOW_COMP'] THEN 'low_competitiveness_flagged'
+                ELSE excluded.status
+            END,
+            updated_at = CURRENT_TIMESTAMP
+        """,
+        (
+            bounty.id,
+            bounty.category,
+            bounty.difficulty,
+            bounty.reward_sats,
+            bounty.priority_score,
+            bounty.engagement_score,
+            bounty.historical_score,
+            bounty.tags,
+            bounty.status,
+        ),
+    )
+    db_conn.commit()
+    return True
+
+
+if __name__ == "__main__":
+    import sys
+    sample = "1581934	Construction_and_Engineering	2	56	5000	1	18.1	9274	27858	recent@Construction_and_Engineering|top@Construction_and_Engineering	OPEN_BOUNTY,LOW_COMP	Show Your Build Friday #3: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨"
+    result = detect_new_open_bounty(sample)
+    if result:
+        print(f"Detected bounty #{result.id}: {result.tags}")
+    else:
+        print("No new open bounty detected.")
diff --git a/tests/test_bounty_processor.py b/tests/test_bounty_processor.py
index 1a2b3c4..d5e6f7g 100644
--- a/tests/test_bounty_processor.py
+++ b/tests/test_bounty_processor.py
@@ -1,5 +1,6 @@
 import pytest
 from src.bounty_processor import BountyEntry, detect_new_open_bounty, process_bounty_bump
+from src.bounty_processor import update_bounty_tracking_db
 
 SAMPLE_BOUNTY_LINE = (
     "1581934\tConstruction_and_Engineering\t2\t56\t5000\t1\t18.1\t9274\t27858"
     "\trecent@Construction_and_Engineering|top@Construction_and_Engineering"
     "\tOPEN_BOUNTY,LOW_COMP\tShow Your Build Friday #3: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨"
 )
+
+SAMPLE_BOUNTY_ACTIVE = (
+    "1599999\tEngineering\t1\t30\t10000\t2\t12.5\t5000\t15000"
+    "\trecent@Engineering\tOPEN_BOUNTY\tNew Engineering Bounty [10,000 Sat]"
+)
 
 
 class TestDetectNewOpenBounty:
     def test_detects_standard_open_bounty(self):
         result = detect_new_open_bounty(SAMPLE_BOUNTY_LINE)
         assert result is not None
-        assert result["id"] == 1581934
-        assert result["category"] == "Construction_and_Engineering"
-        assert result["reward_sats"] == 5000
+        assert result.id == 1581934
+        assert result.category == "Construction_and_Engineering"
+        assert result.reward_sats == 5000
+        assert result.is_open
+        assert result.is_low_comp
+        assert result.status == "low_competitiveness_flagged"
+
+    def test_active_bounty_not_low_comp(self):
+        result = detect_new_open_bounty(SAMPLE_BOUNTY_ACTIVE)
+        assert result is not None
+        assert result.is_open
+        assert not result.is_low_comp
+        assert result.status == "active"
+
+    def test_returns_none_when_no_match(self):
+        result = detect_new_open_bounty("nothing here")
+        assert result is None
+
+
+class TestUpdateBountyTrackingDb:
+    def test_inserts_bounty_with_correct_status(self, mocker):
+        mock_conn = mocker.MagicMock()
+        mock_cursor = mocker.MagicMock()
+        mock_conn.cursor.return_value = mock_cursor
+
+        bounty = BountyEntry(
+            id=1581934,
+            category="Construction_and_Engineering",
+            difficulty=2,
+            reward_sats=5000,
+            priority_score=18.1,
+            engagement_score=9274,
+            historical_score=27858,
+            tags=["OPEN_BOUNTY", "LOW_COMP"],
+            status="low_competitiveness_flagged",
+        )
+
+        result = update_bounty_tracking_db(bounty, mock_conn)
+
+        assert result is True
+        mock_cursor.execute.assert_called_once()
+        args, _ = mock_cursor.execute.call_args
+        inserted_tags = args[1][7]
+        inserted_status = args[1][8]
+        assert "LOW_COMP" in inserted_tags
+        assert inserted_status == "low_competitiveness_flagged"
+
+
+class TestProcessBountyBump:
+    def test_processes_multiple_entries(self):
+        multi = f"{SAMPLE_BOUNTY_LINE}\n{SAMPLE_BOUNTY_ACTIVE}"
+        results = process_bounty_bump(multi)
+        assert len(results) == 2
+        assert results[0].is_low_comp
+        assert not results[1].is_low_comp
diff --git a/config/bounty_categories.yaml b/config/bounty_categories.yaml
index 9a8b7c6..d1e2f3a 100644
--- a/config/bounty_categories.yaml
+++ b/config/bounty_categories.yaml
@@ -1,4 +1,5 @@
 categories:
   Construction_and_Engineering:
     min_reward_sats: 1000
+    low_comp_threshold: 0.5
+    auto_flag_low_comp: true
   Engineering:
     min_reward_sats: 500
+    auto_flag_low_comp: false
   General:
     min_reward_sats: 100
+    auto_flag_low_comp: false
+
+tags:
+  OPEN_BOUNTY:
+    description: "Bounty is currently open for submissions"
+    priority_weight: 1.0
+  LOW_COMP:
+    description: "Low competitiveness detected based on engagement metrics"
+    priority_weight: -0.2
+    auto_review: true
+  HIGH_COMP:
+    description: "High competitiveness, may need escalation"
+    priority_weight: 0.3
+  URGENT:
+    description: "Time-sensitive bounty requiring immediate attention"
+    priority_weight: 0.5
+    auto_review: true
diff --git a/scripts/monitor_bounties.sh b/scripts/monitor_bounties.sh
index abc1234..def5678 100644
--- a/scripts/monitor_bounties.yaml
+++ b/scripts/monitor_bounties.sh
@@ -1,6 +1,10 @@
-#!/bin/bash
-# Monitor bounties via cron every 15 minutes
-while true; do
-    python3 -m src.bounty_monitor
-    sleep 900
-done
+#!/bin/bash
+# Monitor bounties via cron every 15 minutes
+# Handles OPEN_BOUNTY detection with LOW_COMP flagging
+set -euo pipefail
+
+REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
+cd "$REPO_ROOT"
+
+python3 -m src.bounty_processor
+
+if python3 -c "from src.bounty_processor import process_bounty_bump; print('ok')" 2>/dev/null; then
+    echo "[$(date)] Bounty monitoring check passed"
+else
+    echo "[$(date)] ERROR: Bounty processing failed" >&2
+    exit 1
+fi
diff --git a/pyproject.toml b/pyproject.toml
index aabbccdd..eeffgghh 100644
--- a/pyproject.toml
+++ b/pyproject.toml
@@ -15,6 +15,7 @@ dependencies = [
     "pydantic>=2.0",
     "sqlalchemy>=2.0",
     "psycopg2-binary>=2.9",
+    "python-dotenv>=1.0",
 ]
 
 [project.optional-dependencies]
 dev = [
     "pytest>=7.0",
     "pytest-mock>=3.0",
+    "pytest-cov>=4.0",
 ]
 
+[tool.pytest.ini_options]
+testpaths = ["tests"]
+addopts = "-v --tb=short"
diff --git a/src/__init__.py b/src/__init__.py
new file mode 100644
index 0000000..e69de29
--- /dev/null
+++ b/src/__init__.py
@@ -0,0 +1 @@
+# SN Bounty Tracker
diff --git a/scripts/detect_bounty.py b/scripts/detect_bounty.py
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/scripts/detect_bounty.py
@@ -0,0 +1,30 @@
+#!/usr/bin/env python3
+"""Detect and report new OPEN_BOUNTY entries from raw SN feed data."""
+import argparse
+import sys
+from pathlib import Path
+
+from src.bounty_processor import detect_new_open_bounty
+
+
+def main():
+    parser = argparse.ArgumentParser(description="Detect new SN bounties")
+    parser.add_argument("input", help="Path to input file or '-' for stdin")
+    args = parser.parse_args()
+
+    if args.input == "-":
+        raw = sys.stdin.read()
+    else:
+        raw = Path(args.input).read_text(encoding="utf-8")
+
+    bounty = detect_new_open_bounty(raw)
+    if bounty:
+        print(json.dumps({
+            "id": bounty.id,
+            "category": bounty.category,
+            "reward_sats": bounty.reward_sats,
+            "tags": bounty.tags,
+            "status": bounty.status,
+        }, indent=2))
+        sys.exit(0)
+    else:
+        print("No new open bounty detected.", file=sys.stderr)
+        sys.exit(1)
+
+
+if __name__ == "__main__":
+    import json
+    main()
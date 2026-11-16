"""Unit tests for tools/sn_bounty_tracker.py (Issue #1316)."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import sn_bounty_tracker as T  # noqa: E402


def test_parse_issue_1316_radar_row() -> None:
    bounty = T.parse_radar_tsv_line(T.ISSUE_1316_LINE)
    assert bounty.item_id == 1597978
    assert bounty.sub == "Construction_and_Engineering"
    assert bounty.tier == 3
    assert bounty.score_sats == 220
    assert bounty.bounty_sats == 10000
    assert bounty.ncomments == 0
    assert bounty.age_hours == 18.0
    assert bounty.is_open_bounty is True
    assert bounty.is_low_competition is True
    assert bounty.competition_adjusted_ev_sats == 6500.0
    assert bounty.item_url == "https://stacker.news/items/1597978"


def test_deduplicate_open_bounties_skips_tracked_items() -> None:
    rows = [
        "# id\tsub\ttier\tscore\tbounty\tncom\tageH\top_since\top_nitems\thits\ttags\ttitle",
        T.ISSUE_1316_LINE,
        T.ISSUE_1316_LINE,
    ]
    fresh = T.deduplicate_open_bounties(rows, already_tracked_item_ids=set())
    assert len(fresh) == 1
    assert fresh[0].item_id == 1597978

    none_left = T.deduplicate_open_bounties(rows, already_tracked_item_ids={1597978})
    assert none_left == []


def test_build_proof_of_work_submission_contains_verification() -> None:
    bounty = T.parse_radar_tsv_line(T.ISSUE_1316_LINE)
    payload = T.build_proof_of_work_submission(bounty)
    assert payload["target_item_id"] == 1597978
    assert payload["bounty_sats"] == 10000
    assert "1597978" in str(payload["submission_markdown"])

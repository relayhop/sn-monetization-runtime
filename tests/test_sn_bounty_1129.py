"""Unit tests for tools/sn_stocks_contest_1129.py (Issue #1129)."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import sn_stocks_contest_1129 as M  # noqa: E402


def test_parse_issue_1129_row_and_title_sats() -> None:
    bounty = M.parse_issue_1129_row()
    assert bounty.item_id == 1577504
    assert bounty.sub == "Stacker_Stocks"
    assert bounty.tier == 2
    assert bounty.score_sats == 300
    assert bounty.bounty_sats == 10000
    assert bounty.title_advertised_sats == 40000
    assert bounty.effective_bounty_sats == 40000
    assert bounty.ncomments == 5
    assert bounty.age_hours == 10.6
    assert bounty.is_signal_contest is True
    assert bounty.item_url == "https://stacker.news/items/1577504"


def test_build_contest_response_plan() -> None:
    bounty = M.parse_issue_1129_row()
    plan = M.build_contest_response_plan(bounty)
    assert plan["issue_number"] == 1129
    assert plan["effective_bounty_sats"] == 40000
    assert plan["competition_adjusted_ev_sats"] == round(40000 / 7, 2)

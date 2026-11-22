#!/usr/bin/env python3
"""Stacker News OPEN_BOUNTY radar parser & title-sats reconciler for Issue #1129 (`Stacker_Stocks` #1577504)."""
from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass

ISSUE_1129_LINE = (
    "1577504\tStacker_Stocks\t2\t300\t10000\t5\t10.6\t9274\t27648\t"
    "top@Stacker_Stocks\tOPEN_BOUNTY,LOW_COMP,SIGNAL,SELF_POST_OPP\t"
    "Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 40k sats"
)

_TITLE_SATS_RE = re.compile(r"\b(\d+(?:\.\d+)?)\s*([kKmM])?\s*sats\b")


def parse_title_sats(title: str) -> int:
    """Extract satoshi bounty amounts advertised in an item title (e.g. '40k sats' -> 40000)."""
    best = 0
    for match in _TITLE_SATS_RE.finditer(title):
        val = float(match.group(1))
        suffix = (match.group(2) or "").lower()
        if suffix == "k":
            val *= 1_000
        elif suffix == "m":
            val *= 1_000_000
        best = max(best, int(round(val)))
    return best


@dataclass(frozen=True)
class SnRadarContestBounty:
    item_id: int
    sub: str
    tier: int
    score_sats: int
    bounty_sats: int
    ncomments: int
    age_hours: float
    op_since: int
    op_nitems: int
    hits: list[str]
    tags: list[str]
    title: str

    @property
    def title_advertised_sats(self) -> int:
        return parse_title_sats(self.title)

    @property
    def effective_bounty_sats(self) -> int:
        """Reconcile radar column bounty_sats against title-advertised prize pool (40k sats > 10k sats)."""
        return max(self.bounty_sats, self.title_advertised_sats)

    @property
    def is_signal_contest(self) -> bool:
        return "OPEN_BOUNTY" in self.tags and "SIGNAL" in self.tags and "LOW_COMP" in self.tags

    @property
    def competition_adjusted_ev_sats(self) -> float:
        prob = 1.0 / (self.ncomments + 2)
        return round(self.effective_bounty_sats * prob, 2)

    @property
    def item_url(self) -> str:
        return f"https://stacker.news/items/{self.item_id}"


def parse_issue_1129_row(line: str = ISSUE_1129_LINE) -> SnRadarContestBounty:
    parts = line.rstrip("\r\n").split("\t")
    if len(parts) != 12:
        raise ValueError(f"Expected 12 TSV columns, got {len(parts)}")
    return SnRadarContestBounty(
        item_id=int(parts[0]),
        sub=parts[1],
        tier=int(parts[2]),
        score_sats=int(parts[3]),
        bounty_sats=int(parts[4]),
        ncomments=int(parts[5]),
        age_hours=float(parts[6]),
        op_since=int(parts[7]),
        op_nitems=int(parts[8]),
        hits=[h for h in parts[9].split("|") if h],
        tags=[t for t in parts[10].split(",") if t],
        title=parts[11],
    )


def build_contest_response_plan(bounty: SnRadarContestBounty) -> dict[str, object]:
    return {
        "issue_number": 1129,
        "item_id": bounty.item_id,
        "item_url": bounty.item_url,
        "sub": bounty.sub,
        "tier": bounty.tier,
        "column_bounty_sats": bounty.bounty_sats,
        "title_advertised_sats": bounty.title_advertised_sats,
        "effective_bounty_sats": bounty.effective_bounty_sats,
        "competition_adjusted_ev_sats": bounty.competition_adjusted_ev_sats,
        "is_signal_contest": bounty.is_signal_contest,
    }


if __name__ == "__main__":
    parsed = parse_issue_1129_row()
    print(json.dumps({"bounty": asdict(parsed), "plan": build_contest_response_plan(parsed)}, indent=2))

#!/usr/bin/env python3
"""Stacker News OPEN_BOUNTY radar parser, deduplicator, and response planner (Issue #1316)."""
from __future__ import annotations

import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

ISSUE_1316_LINE = (
    "1597978\tConstruction_and_Engineering\t3\t220\t10000\t0\t18.0\t469\t3213\t"
    "top@Construction_and_Engineering\tOPEN_BOUNTY,LOW_COMP\t"
    "Show Your Build Weekly #6: Post Your Proof-of-Work"
)


@dataclass(frozen=True)
class SnRadarBounty:
    item_id: int
    sub: str
    tier: int
    score_sats: int
    bounty_sats: int
    ncomments: int
    age_hours: float
    op_since: str
    op_nitems: int
    hits: list[str]
    tags: list[str]
    title: str

    @property
    def is_open_bounty(self) -> bool:
        return "OPEN_BOUNTY" in self.tags and self.bounty_sats >= 100

    @property
    def is_low_competition(self) -> bool:
        return "LOW_COMP" in self.tags or self.ncomments <= 5

    @property
    def competition_adjusted_ev_sats(self) -> float:
        """Expected value heuristic weighting bounty sats against current comment saturation."""
        base_prob = 0.65 if self.ncomments == 0 else max(0.08, 1.0 / (self.ncomments + 2))
        return round(self.bounty_sats * base_prob, 2)

    @property
    def item_url(self) -> str:
        return f"https://stacker.news/items/{self.item_id}"


def parse_radar_tsv_line(line: str) -> SnRadarBounty:
    parts = line.rstrip("\r\n").split("\t")
    if len(parts) != 12:
        raise ValueError(f"Expected 12 TSV columns in radar v2 row, got {len(parts)}")
    return SnRadarBounty(
        item_id=int(parts[0]),
        sub=parts[1],
        tier=int(parts[2]),
        score_sats=int(parts[3]),
        bounty_sats=int(parts[4]),
        ncomments=int(parts[5]),
        age_hours=float(parts[6]),
        op_since=parts[7],
        op_nitems=int(parts[8]) if parts[8].isdigit() else 0,
        hits=[h for h in parts[9].split("|") if h],
        tags=[t for t in parts[10].split(",") if t],
        title=parts[11],
    )


def deduplicate_open_bounties(
    tsv_lines: list[str], already_tracked_item_ids: set[int]
) -> list[SnRadarBounty]:
    """Filter radar TSV rows to only newly discovered OPEN_BOUNTY items not yet opened as issues."""
    seen: set[int] = set(already_tracked_item_ids)
    fresh: list[SnRadarBounty] = []
    for raw in tsv_lines:
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            continue
        bounty = parse_radar_tsv_line(stripped)
        if bounty.is_open_bounty and bounty.item_id not in seen:
            seen.add(bounty.item_id)
            fresh.append(bounty)
    return fresh


def build_proof_of_work_submission(bounty: SnRadarBounty) -> dict[str, object]:
    """Build structured Proof-of-Work summary for SN item #1597978 (Show Your Build Weekly #6)."""
    return {
        "target_item_id": bounty.item_id,
        "target_url": bounty.item_url,
        "sub": bounty.sub,
        "bounty_sats": bounty.bounty_sats,
        "competition_adjusted_ev_sats": bounty.competition_adjusted_ev_sats,
        "tags": bounty.tags,
        "submission_markdown": (
            f"### Proof-of-Work Build Entry for `{bounty.title}` (#{bounty.item_id})\n\n"
            "- **Artifact**: Automated 3-Tier Stacker News Opportunity Radar & Bounty Lifecycle Tracker (`sn_radar_v2` + `sn_bounty_tracker.py`)\n"
            "- **Verification**: Deterministic TSV ingestion across 58 active territories (T1 15m, T2 1h, T3 24h), "
            "deduplicating `OPEN_BOUNTY` alerts by item ID and ranking `LOW_COMP` bounties by competition-adjusted satoshi EV.\n"
            f"- **Target**: `{bounty.item_url}` (`{bounty.bounty_sats}` sats bounty, `{bounty.ncomments}` existing comments -> EV `{bounty.competition_adjusted_ev_sats}` sats)."
        ),
    }


if __name__ == "__main__":
    b = parse_radar_tsv_line(ISSUE_1316_LINE)
    print(json.dumps({"bounty": asdict(b), "plan": build_proof_of_work_submission(b)}, indent=2))

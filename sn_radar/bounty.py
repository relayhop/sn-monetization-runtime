"""Validation and parsing for the tab-separated SN radar feed."""

from __future__ import annotations

from dataclasses import asdict, dataclass
import json
import re
from typing import Iterable

_SAT_RE = re.compile(r"^(?P<number>[0-9][0-9,]*)\s+SATS?\b", re.IGNORECASE)


@dataclass(frozen=True, slots=True)
class BountyEvent:
    """A normalized open-bounty event from the SN feed."""

    post_id: int
    author: str
    age: int
    score: int
    bounty_sats: int
    comments: int
    ranking: float
    parent_id: int
    rank: int
    feeds: tuple[str, ...]
    flags: frozenset[str]
    title: str

    @property
    def is_open_bounty(self) -> bool:
        return "OPEN_BOUNTY" in self.flags

    @property
    def proof_of_work(self) -> bool:
        return "PROOF-OF-WORK" in self.title.upper()

    def to_dict(self) -> dict[str, object]:
        result = asdict(self)
        result["feeds"] = list(self.feeds)
        result["flags"] = sorted(self.flags)
        return result


def _int(value: str, field: str) -> int:
    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(f"{field} must be an integer") from exc


def _money_from_title(title: str) -> int | None:
    match = _SAT_RE.search(title.strip())
    return int(match.group("number").replace(",", "")) if match else None


def parse_event(line: str) -> BountyEvent:
    """Parse one SN radar row; reject malformed or non-bounty rows."""
    if not isinstance(line, str) or not line.strip():
        raise ValueError("event row must be a non-empty string")
    fields = line.rstrip("\r\n").split("\t")
    if len(fields) != 12:
        raise ValueError(f"event row must contain 12 tab-separated fields, got {len(fields)}")
    post_id, author, age, score, sats, comments, ranking, parent, rank, feeds, flags, title = fields
    if not author.strip() or not title.strip():
        raise ValueError("author and title are required")
    event = BountyEvent(
        post_id=_int(post_id, "post_id"), author=author.strip(), age=_int(age, "age"),
        score=_int(score, "score"), bounty_sats=_int(sats, "bounty_sats"),
        comments=_int(comments, "comments"), ranking=float(ranking), parent_id=_int(parent, "parent_id"),
        rank=_int(rank, "rank"), feeds=tuple(x for x in feeds.split("|") if x),
        flags=frozenset(x for x in flags.split(",") if x), title=title.strip(),
    )
    if event.post_id < 0 or event.bounty_sats < 0 or event.rank < 0:
        raise ValueError("post_id, bounty_sats, and rank must be non-negative")
    if not event.is_open_bounty:
        raise ValueError("event is not an OPEN_BOUNTY")
    stated = _money_from_title(event.title)
    if stated is not None and stated != event.bounty_sats:
        raise ValueError("bounty_sats does not match the SATS amount in the title")
    return event


def parse_events(lines: Iterable[str]) -> list[BountyEvent]:
    """Parse non-empty rows while preserving input order."""
    return [parse_event(line) for line in lines if line.strip()]


def to_json(event: BountyEvent) -> str:
    """Serialize an event without exposing any credentials or environment data."""
    return json.dumps(event.to_dict(), ensure_ascii=False, sort_keys=True)


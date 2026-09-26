"""Parsing and validation for the tab-separated SN radar feed.

The feed is intentionally treated as untrusted input: malformed rows are
rejected, flags are normalized, and no credentials or network access are used.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import json
import re
from typing import Iterable

_SAT_RE = re.compile(r"[^0-9]")


class RecordError(ValueError):
    """Raised when a radar row cannot be interpreted safely."""


@dataclass(frozen=True, slots=True)
class BountyRecord:
    post_id: int
    author: str
    rank: int
    parent_id: int
    sats: int
    age_hours: int
    score: float
    root_id: int
    comment_count: int
    feeds: tuple[str, ...]
    flags: frozenset[str]
    title: str

    @property
    def is_open(self) -> bool:
        return "OPEN_BOUNTY" in self.flags

    @property
    def proof_of_work(self) -> bool:
        return "PROOF-OF-WORK" in self.title.upper()

    def to_dict(self) -> dict[str, object]:
        value = asdict(self)
        value["feeds"] = list(self.feeds)
        value["flags"] = sorted(self.flags)
        value["is_open"] = self.is_open
        value["proof_of_work"] = self.proof_of_work
        return value


def _int(value: str, field: str) -> int:
    try:
        result = int(value)
    except (TypeError, ValueError) as exc:
        raise RecordError(f"{field} must be an integer") from exc
    if result < 0:
        raise RecordError(f"{field} must not be negative")
    return result


def _sats(value: str) -> int:
    cleaned = _SAT_RE.sub("", value)
    if not cleaned:
        raise RecordError("sats must contain digits")
    return _int(cleaned, "sats")


def parse_record(line: str) -> BountyRecord:
    """Parse exactly one SN radar row."""
    if not isinstance(line, str) or not line.strip():
        raise RecordError("record must be a non-empty string")
    fields = line.rstrip("\r\n").split("\t")
    if len(fields) != 12:
        raise RecordError(f"expected 12 tab-separated fields, got {len(fields)}")
    post_id, author, rank, parent_id, sats, age, score, root_id, comments, feeds, flags, title = fields
    if not author.strip() or not title.strip():
        raise RecordError("author and title are required")
    try:
        score_value = float(score)
    except ValueError as exc:
        raise RecordError("score must be numeric") from exc
    if score_value < 0:
        raise RecordError("score must not be negative")
    feed_values = tuple(item.strip() for item in feeds.split("|") if item.strip())
    flag_values = frozenset(item.strip().upper() for item in flags.split(",") if item.strip())
    return BountyRecord(
        _int(post_id, "post_id"), author.strip(), _int(rank, "rank"),
        _int(parent_id, "parent_id"), _sats(sats), _int(age, "age_hours"),
        score_value, _int(root_id, "root_id"), _int(comments, "comment_count"),
        feed_values, flag_values, title.strip(),
    )


def is_open_bounty(record: BountyRecord, *, minimum_sats: int = 1) -> bool:
    """Return whether a parsed record is an actionable open bounty."""
    if minimum_sats < 0:
        raise ValueError("minimum_sats must not be negative")
    return record.is_open and record.sats >= minimum_sats


def records_as_json(lines: Iterable[str], *, minimum_sats: int = 1) -> str:
    """Serialize valid actionable records; invalid rows are never silently included."""
    records = [parse_record(line) for line in lines if line.strip()]
    return json.dumps([r.to_dict() for r in records if is_open_bounty(r, minimum_sats=minimum_sats)], sort_keys=True)

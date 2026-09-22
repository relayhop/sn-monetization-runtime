"""Parse and classify tab-separated Stacker News radar records.

The feed is intentionally treated as data, not as a command or URL.  No
network access or credentials are needed by this module.
"""

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True, slots=True)
class SNRecord:
    """A normalized Stacker News radar row."""

    item_id: int
    author: str
    rank: int
    score: int
    sats: int
    comments: int
    quality: float
    parent_id: int
    age: int
    feeds: tuple[str, ...]
    tags: frozenset[str]
    title: str
    raw: str = ""

    @property
    def is_open_bounty(self) -> bool:
        return "OPEN_BOUNTY" in self.tags

    @property
    def is_hot(self) -> bool:
        return "HOT" in self.tags


def _int(value: str, field: str) -> int:
    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(f"{field} must be an integer: {value!r}") from exc


def parse_record(line: str) -> SNRecord:
    """Parse one 12-column tab-separated feed row.

    Blank lines are rejected, and extra/missing columns are reported rather
    than silently shifting the title or metadata.
    """
    raw = line.rstrip("\r\n")
    if not raw.strip():
        raise ValueError("record must not be blank")
    fields = raw.split("\t")
    if len(fields) != 12:
        raise ValueError(f"expected 12 tab-separated fields, got {len(fields)}")
    if not fields[1].strip():
        raise ValueError("author must not be empty")
    if not fields[11].strip():
        raise ValueError("title must not be empty")
    try:
        quality = float(fields[6])
    except ValueError as exc:
        raise ValueError(f"quality must be a number: {fields[6]!r}") from exc
    if quality < 0:
        raise ValueError("quality must be non-negative")
    feeds = tuple(feed for feed in fields[9].split("|") if feed)
    tags = frozenset(tag.strip().upper() for tag in fields[10].split(",") if tag.strip())
    return SNRecord(
        item_id=_int(fields[0], "item_id"), author=fields[1], rank=_int(fields[2], "rank"),
        score=_int(fields[3], "score"), sats=_int(fields[4], "sats"),
        comments=_int(fields[5], "comments"), quality=quality,
        parent_id=_int(fields[7], "parent_id"), age=_int(fields[8], "age"),
        feeds=feeds, tags=tags, title=fields[11], raw=raw,
    )


def parse_records(lines: Iterable[str]) -> tuple[SNRecord, ...]:
    """Parse non-blank lines while preserving input order."""
    return tuple(parse_record(line) for line in lines if line.strip())


def is_open_bounty(record: SNRecord | str) -> bool:
    """Return whether a record carries the OPEN_BOUNTY tag."""
    return parse_record(record).is_open_bounty if isinstance(record, str) else record.is_open_bounty

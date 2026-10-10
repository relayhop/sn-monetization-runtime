"""Parsing and conservative classification of tab-separated SN bounty rows.

The radar feed is treated as untrusted input: parsing never executes content,
and summaries preserve the original title without inventing claims.
"""

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Iterable


class RowFormatError(ValueError):
    """Raised when a radar row cannot be parsed or contains invalid fields."""


@dataclass(frozen=True, slots=True)
class Bounty:
    post_id: int
    author: str
    category_id: int
    score: int
    sats: int
    comments: int
    age_hours: Decimal
    parent_id: int
    rank: int
    feeds: tuple[str, ...]
    flags: frozenset[str]
    title: str


def _int(value: str, field: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise RowFormatError(f"{field} must be an integer") from exc


def _decimal(value: str, field: str) -> Decimal:
    try:
        result = Decimal(value)
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise RowFormatError(f"{field} must be numeric") from exc
    if not result.is_finite() or result < 0:
        raise RowFormatError(f"{field} must be finite and non-negative")
    return result


def parse_row(row: str) -> Bounty:
    """Parse one 12-column tab-separated radar row."""
    if not isinstance(row, str):
        raise RowFormatError("row must be text")
    fields = row.rstrip("\r\n").split("\t")
    if len(fields) != 12:
        raise RowFormatError(f"expected 12 columns, got {len(fields)}")
    if not fields[1].strip() or not fields[11].strip():
        raise RowFormatError("author and title must not be empty")
    nums = [_int(fields[i], name) for i, name in zip(
        (0, 2, 3, 4, 5, 7, 8),
        ("post_id", "category_id", "score", "sats", "comments", "parent_id", "rank"),
    )]
    if any(value < 0 for value in nums):
        raise RowFormatError("integer fields must be non-negative")
    feeds = tuple(item for item in fields[9].split("|") if item)
    flags = frozenset(item.strip().upper() for item in fields[10].split(",") if item.strip())
    return Bounty(*nums[:1], fields[1].strip(), *nums[1:5], _decimal(fields[6], "age_hours"), *nums[5:], feeds, flags, fields[11].strip())


def is_open_bounty(bounty: Bounty) -> bool:
    """Return true only for explicitly open bounty rows."""
    return "OPEN_BOUNTY" in bounty.flags and bounty.sats > 0


def summarize(bounties: Iterable[Bounty]) -> list[dict[str, object]]:
    """Return deterministic, JSON-friendly summaries for open bounties."""
    result = [
        {"post_id": b.post_id, "author": b.author, "sats": b.sats,
         "title": b.title, "flags": sorted(b.flags), "feeds": list(b.feeds)}
        for b in bounties if is_open_bounty(b)
    ]
    return sorted(result, key=lambda item: (-int(item["sats"]), int(item["post_id"])))

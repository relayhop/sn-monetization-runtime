"""Strict parser for the tab-separated SN radar feed format."""

from .model import Bounty


def _int(value: str, field: str) -> int:
    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(f"{field} must be an integer") from exc


def _float(value: str, field: str) -> float:
    try:
        return float(value)
    except ValueError as exc:
        raise ValueError(f"{field} must be a number") from exc


def parse_bounty(line: str) -> Bounty:
    """Parse one feed line; blank lines and malformed records fail clearly."""
    if not isinstance(line, str):
        raise TypeError("line must be a string")
    fields = line.rstrip("\r\n").split("\t")
    if len(fields) != 12:
        raise ValueError(f"expected 12 tab-separated fields, got {len(fields)}")
    if any(not field.strip() for field in fields):
        raise ValueError("fields must not be empty")
    feeds = tuple(x.strip() for x in fields[9].split("|") if x.strip())
    flags = frozenset(x.strip() for x in fields[10].split(",") if x.strip())
    if not feeds or not flags:
        raise ValueError("feeds and flags must not be empty")
    return Bounty(
        id=_int(fields[0], "id"), author=fields[1].strip(), category=_int(fields[2], "category"),
        sats=_int(fields[3], "sats"), score=_float(fields[4], "score"),
        comments=_int(fields[5], "comments"), age_hours=_float(fields[6], "age_hours"),
        parent_id=_int(fields[7], "parent_id"), rank=_int(fields[8], "rank"),
        feeds=feeds, flags=flags, title=fields[11].strip(),
    )


def parse_lines(text: str) -> list[Bounty]:
    """Parse non-empty lines while preserving input order."""
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    return [parse_bounty(line) for line in text.splitlines() if line.strip()]

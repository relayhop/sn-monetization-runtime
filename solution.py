"""Small, dependency-free parser and triage scorer for SN bounty radar events."""

from dataclasses import dataclass
import re


class BountyFormatError(ValueError):
    """Raised when an SN radar row cannot be parsed safely."""


@dataclass(frozen=True)
class Bounty:
    post_id: int
    author: str
    category_id: int
    board_id: int
    reward_sats: int
    replies: int
    age_hours: float
    parent_id: int
    score: int
    feeds: tuple[str, ...]
    flags: frozenset[str]
    title: str

    @property
    def is_open(self) -> bool:
        return "OPEN_BOUNTY" in self.flags


def _int(value: str, name: str) -> int:
    try:
        return int(value.replace(",", "").strip())
    except (AttributeError, ValueError) as exc:
        raise BountyFormatError(f"invalid {name}") from exc


def parse_bounty_row(row: str) -> Bounty:
    """Parse the tab-separated SN radar format, preserving title text verbatim."""
    if not isinstance(row, str) or not row.strip():
        raise BountyFormatError("row must be a non-empty string")
    fields = row.rstrip("\r\n").split("\t", 11)
    if len(fields) != 12:
        raise BountyFormatError("expected 12 tab-separated fields")
    feeds = tuple(x for x in fields[9].split("|") if x)
    flags = frozenset(x.strip() for x in fields[10].split(",") if x.strip())
    title = fields[11].strip()
    if "\t" in title:
        raise BountyFormatError("title must not contain tabs")
    if not title:
        raise BountyFormatError("title must not be empty")
    try:
        age = float(fields[6])
    except ValueError as exc:
        raise BountyFormatError("invalid age_hours") from exc
    if age < 0 or not re.fullmatch(r"\d+(?:\.\d+)?", fields[6].strip()):
        raise BountyFormatError("age_hours must be a non-negative number")
    bounty = Bounty(_int(fields[0], "post_id"), fields[1].strip(), _int(fields[2], "category_id"),
                    _int(fields[3], "board_id"), _int(fields[4], "reward_sats"), _int(fields[5], "replies"),
                    age, _int(fields[7], "parent_id"), _int(fields[8], "score"), feeds, flags, title)
    if bounty.post_id < 0 or bounty.reward_sats < 0 or bounty.replies < 0:
        raise BountyFormatError("numeric values cannot be negative")
    return bounty


def triage_score(bounty: Bounty) -> int:
    """Return a deterministic priority score; non-open rows are never actionable."""
    if not bounty.is_open:
        return 0
    score = min(bounty.reward_sats // 1000, 100)
    score += 20 if "HOT" in bounty.flags else 0
    score += 10 if "SELF_POST_OPP" in bounty.flags else 0
    score += min(bounty.score, 10)
    return score


def is_actionable(bounty: Bounty) -> bool:
    """Radar-level gate only; this does not claim rights, identity, or payment readiness."""
    return bounty.is_open and bounty.reward_sats > 0 and bool(bounty.title)

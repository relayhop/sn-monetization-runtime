"""Pure, side-effect-free processing for SN radar rows."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Iterable


class RadarError(ValueError):
    """Raised when an input radar row is malformed."""


@dataclass(frozen=True, slots=True)
class Bounty:
    post_id: int
    author: str
    level: int
    age_minutes: int
    sats: int
    difficulty: int
    hotness: Decimal
    parent_id: int
    comments: int
    feeds: tuple[str, ...]
    flags: frozenset[str]
    title: str

    @property
    def is_open_bounty(self) -> bool:
        return "OPEN_BOUNTY" in self.flags

    @property
    def url(self) -> str:
        return f"https://stacker.news/items/{self.post_id}"

    @property
    def priority_score(self) -> Decimal:
        """Stable ranking: sats and recency dominate, hotness breaks ties."""
        return Decimal(self.sats) / Decimal(max(self.age_minutes, 1)) + self.hotness


def _int(value: str, field: str, *, minimum: int = 0) -> int:
    try:
        result = int(value)
    except (TypeError, ValueError) as exc:
        raise RadarError(f"{field} must be an integer") from exc
    if result < minimum:
        raise RadarError(f"{field} must be >= {minimum}")
    return result


def _decimal(value: str, field: str) -> Decimal:
    try:
        result = Decimal(value)
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise RadarError(f"{field} must be numeric") from exc
    if not result.is_finite():
        raise RadarError(f"{field} must be finite")
    return result


def parse_row(line: str) -> Bounty:
    """Parse one radar TSV row; blank lines are rejected by design."""
    fields = line.rstrip("\r\n").split("\t")
    if len(fields) != 12:
        raise RadarError(f"expected 12 tab-separated fields, got {len(fields)}")
    post_id, author, level, age, sats, difficulty, hotness, parent, comments, feeds, flags, title = fields
    if not author.strip() or not title.strip():
        raise RadarError("author and title are required")
    return Bounty(
        _int(post_id, "post_id", minimum=1), author.strip(), _int(level, "level"),
        _int(age, "age_minutes"), _int(sats, "sats"), _int(difficulty, "difficulty"),
        _decimal(hotness, "hotness"), _int(parent, "parent_id", minimum=1),
        _int(comments, "comments"), tuple(x for x in feeds.split("|") if x),
        frozenset(x for x in flags.split(",") if x), title.strip(),
    )


def parse_bounties(text: str, *, open_only: bool = True) -> list[Bounty]:
    rows = []
    for number, line in enumerate(text.splitlines(), 1):
        if not line.strip():
            continue
        try:
            bounty = parse_row(line)
        except RadarError as exc:
            raise RadarError(f"line {number}: {exc}") from exc
        if not open_only or bounty.is_open_bounty:
            rows.append(bounty)
    return rows


def prioritize(bounties: Iterable[Bounty]) -> list[Bounty]:
    """Return open bounties, highest score first, with post-id tie-break."""
    return sorted((b for b in bounties if b.is_open_bounty),
                  key=lambda b: (-b.priority_score, -b.sats, b.post_id))


def render_markdown(bounties: Iterable[Bounty]) -> str:
    items = prioritize(bounties)
    if not items:
        return "# SN Open Bounties\n\nNo open bounties found.\n"
    lines = ["# SN Open Bounties", "", f"Found {len(items)} open bounty(ies).", ""]
    for i, bounty in enumerate(items, 1):
        lines += [f"{i}. **[{bounty.title}]({bounty.url})** — {bounty.sats:,} sats",
                  f"   - Author: `{bounty.author}`; age: {bounty.age_minutes} min; comments: {bounty.comments}",
                  f"   - Flags: `{','.join(sorted(bounty.flags))}`; priority score: `{bounty.priority_score:.4f}`"]
    return "\n".join(lines) + "\n"


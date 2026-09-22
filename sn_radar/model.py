from dataclasses import dataclass


@dataclass(frozen=True)
class Bounty:
    id: int
    author: str
    category: int
    sats: int
    score: float
    comments: int
    age_hours: float
    parent_id: int
    rank: int
    feeds: tuple[str, ...]
    flags: frozenset[str]
    title: str

    @property
    def is_open(self) -> bool:
        return "OPEN_BOUNTY" in self.flags

    @property
    def is_hot(self) -> bool:
        return "HOT" in self.flags

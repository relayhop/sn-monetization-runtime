from .model import Bounty


def is_actionable(bounty: Bounty, *, minimum_sats: int = 0) -> bool:
    """Return whether a record is an open bounty meeting the payout threshold."""
    if minimum_sats < 0:
        raise ValueError("minimum_sats must be non-negative")
    return bounty.is_open and bounty.sats >= minimum_sats

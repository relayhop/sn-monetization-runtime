"""
main.py - Runtime entry point and bounty event handler for sn-monetization-runtime.

Provides `target_handler(payload=None, **kwargs)` with defensive boundary handling,
dual-format ingestion (TSV radar line or dictionary), safe type casting,
and standardized response schema.
"""

import os
import sys
from typing import Any, Dict, List, Optional, Union

MIN_BOUNTY_SATS = 100
MAX_COMMENTS_FOR_LOW_COMP = 5


def _safe_int(val: Any, default: int = 0) -> int:
    """Safely cast value to integer with fallback default."""
    if val is None:
        return default
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return default


def _safe_id(val: Any) -> Optional[Union[int, str]]:
    """Safely cast ID to int if possible, else cleaned string, or None if empty."""
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        return s


def _safe_tags(val: Any) -> List[str]:
    """Normalize tags from string or iterable into a clean list of uppercase tag strings."""
    if val is None:
        return []
    if isinstance(val, (list, tuple, set)):
        return [str(t).strip().upper() for t in val if str(t).strip()]
    if isinstance(val, str):
        return [t.strip().upper() for t in val.split(",") if t.strip()]
    return []


def target_handler(
    payload: Optional[Union[str, Dict[str, Any]]] = None,
    **kwargs: Any
) -> Dict[str, Any]:
    """
    Ingest, validate, and process a Stacker News opportunity/bounty event.

    Args:
        payload: A 12-column TSV row string from sn_latest.tsv or a dictionary payload.
        **kwargs: Additional contextual arguments for forward-compatibility.

    Returns:
        Dict adhering to the standard schema:
        {
            "status": "success" | "invalid_input" | "error",
            "bounty_id": int | str | None,
            "sub": str | None,
            "bounty_sats": int,
            "is_open_bounty": bool,
            "is_low_competition": bool,
            "eligible": bool,
            "title": str,
            "error": str | None
        }
    """
    try:
        # 1. Precondition & Type Validation
        if payload is None:
            return {
                "status": "invalid_input",
                "bounty_id": None,
                "sub": None,
                "bounty_sats": 0,
                "is_open_bounty": False,
                "is_low_competition": False,
                "eligible": False,
                "title": "",
                "error": "Payload is None",
            }

        if not isinstance(payload, (str, dict)):
            return {
                "status": "invalid_input",
                "bounty_id": None,
                "sub": None,
                "bounty_sats": 0,
                "is_open_bounty": False,
                "is_low_competition": False,
                "eligible": False,
                "title": "",
                "error": f"Unsupported payload type: {type(payload).__name__}",
            }

        # 2. Ingestion: String (TSV) or Dict
        if isinstance(payload, str):
            clean_str = payload.strip()
            if not clean_str:
                return {
                    "status": "invalid_input",
                    "bounty_id": None,
                    "sub": None,
                    "bounty_sats": 0,
                    "is_open_bounty": False,
                    "is_low_competition": False,
                    "eligible": False,
                    "title": "",
                    "error": "Payload string is empty or whitespace",
                }

            if clean_str.startswith("#"):
                return {
                    "status": "invalid_input",
                    "bounty_id": None,
                    "sub": None,
                    "bounty_sats": 0,
                    "is_open_bounty": False,
                    "is_low_competition": False,
                    "eligible": False,
                    "title": "",
                    "error": "Payload is a TSV header or comment line",
                }

            cols = clean_str.split("\t")
            if len(cols) < 11:
                return {
                    "status": "invalid_input",
                    "bounty_id": None,
                    "sub": None,
                    "bounty_sats": 0,
                    "is_open_bounty": False,
                    "is_low_competition": False,
                    "eligible": False,
                    "title": "",
                    "error": f"Insufficient TSV columns: expected at least 11, got {len(cols)}",
                }

            raw_id = cols[0]
            sub = cols[1] if cols[1] and cols[1] != "-" else None
            tier = _safe_int(cols[2], default=0)
            score = _safe_int(cols[3], default=0)
            bounty_sats = _safe_int(cols[4], default=0)
            ncomments = _safe_int(cols[5], default=0)
            # col 6: ageH, col 7: op_since, col 8: op_nitems, col 9: hits
            raw_tags = cols[10]
            title = "\t".join(cols[11:]).strip() if len(cols) > 11 else ""
            bounty_paid_to = None

        else:
            # Dictionary payload
            # Guard against invalid or arbitrary dicts lacking recognizable fields
            recognized_keys = (
                "id",
                "bounty_id",
                "item_id",
                "bounty",
                "bounty_sats",
                "title",
                "sub",
                "sub_name",
                "tags",
                "_tags",
            )
            if not payload or not any(k in payload for k in recognized_keys):
                return {
                    "status": "invalid_input",
                    "bounty_id": None,
                    "sub": None,
                    "bounty_sats": 0,
                    "is_open_bounty": False,
                    "is_low_competition": False,
                    "eligible": False,
                    "title": "",
                    "error": "Dictionary missing recognizable opportunity fields",
                }

            raw_id = payload.get("id") or payload.get("bounty_id") or payload.get("item_id")
            sub_val = payload.get("sub") or payload.get("sub_name")
            if isinstance(sub_val, dict):
                sub = sub_val.get("name")
            elif sub_val and sub_val != "-":
                sub = str(sub_val)
            else:
                sub = None

            tier = _safe_int(payload.get("tier"), default=0)
            score = _safe_int(
                payload.get("sats") if "sats" in payload else payload.get("score"), default=0
            )
            bounty_sats = _safe_int(
                payload.get("bounty_sats")
                if "bounty_sats" in payload
                else payload.get("bounty"),
                default=0,
            )
            ncomments = _safe_int(
                payload.get("ncomments")
                if "ncomments" in payload
                else payload.get("ncom"),
                default=0,
            )
            raw_tags = payload.get("tags") or payload.get("_tags")
            title = str(payload.get("title") or "").strip()
            bounty_paid_to = payload.get("bountyPaidTo")

        # 3. Data Normalization
        bounty_id = _safe_id(raw_id)
        tags = _safe_tags(raw_tags)

        # 4. Domain Logic Evaluation
        # Open Bounty: marked with OPEN_BOUNTY or having bounty >= MIN_BOUNTY_SATS without payout
        is_open_bounty = "OPEN_BOUNTY" in tags or (
            bounty_sats >= MIN_BOUNTY_SATS and not bool(bounty_paid_to)
        )
        # Low Competition: marked with LOW_COMP or (open bounty and comments <= MAX_COMMENTS_FOR_LOW_COMP)
        is_low_competition = "LOW_COMP" in tags or (
            is_open_bounty and ncomments <= MAX_COMMENTS_FOR_LOW_COMP
        )
        # Eligibility: bounty must be open and offer at least MIN_BOUNTY_SATS
        eligible = bool(is_open_bounty and bounty_sats >= MIN_BOUNTY_SATS)

        return {
            "status": "success",
            "bounty_id": bounty_id,
            "sub": str(sub) if sub is not None else None,
            "bounty_sats": bounty_sats,
            "is_open_bounty": is_open_bounty,
            "is_low_competition": is_low_competition,
            "eligible": eligible,
            "title": title,
            "error": None,
        }

    except Exception as e:
        # 5. Top-level Exception Shield
        return {
            "status": "error",
            "bounty_id": None,
            "sub": None,
            "bounty_sats": 0,
            "is_open_bounty": False,
            "is_low_competition": False,
            "eligible": False,
            "title": "",
            "error": str(e),
        }


if __name__ == "__main__":
    import json

    if len(sys.argv) > 1:
        arg = sys.argv[1]
        res = target_handler(arg)
        print(json.dumps(res, indent=2))
    else:
        latest_tsv = "data/sn_opportunities/sn_latest.tsv"
        if os.path.exists(latest_tsv):
            with open(latest_tsv, "r", encoding="utf-8") as f:
                for line in f:
                    if "OPEN_BOUNTY" in line:
                        print(f"Processing bounty: {line.strip()[:60]}...")
                        res = target_handler(line)
                        print(json.dumps(res, indent=2))

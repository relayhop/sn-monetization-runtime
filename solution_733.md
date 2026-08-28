# Solution for #733: [radar] SN open bounty 2026-08-28T18:35

===FILE:.github/workflows/radar.yml===
name: Stacker News Bounty Radar

on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - name: Run radar
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SN_API_BASE: https://stacker.news/api
        run: python src/radar.py
===END_FILE===
===FILE:requirements.txt===
requests>=2.28.0
python-dotenv>=1.0.0
===END_FILE===
===FILE:src/radar.py===
import os
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

import requests

# Constants
STATE_FILE = Path("data/seen_bounties.json")
API_BASE = os.getenv("SN_API_BASE", "https://stacker.news/api")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO = os.getenv("GITHUB_REPOSITORY", "owner/repo")  # set by Actions

# Tag we are looking for
TARGET_TAG = "OPEN_BOUNTY"


def get_recent_items(limit: int = 50) -> List[Dict[str, Any]]:
    """Fetch recent items from Stacker News API."""
    url = f"{API_BASE}/items"
    params = {"limit": limit, "sort": "new"}
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    # The API returns items in 'items' key or directly? Usually it's a list.
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "items" in data:
        return data["items"]
    raise ValueError("Unexpected API response format")


def filter_open_bounties(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return items that have the OPEN_BOUNTY tag."""
    result = []
    for item in items:
        tags = item.get("tags", [])
        if TARGET_TAG in tags:
            result.append(item)
    return result


def load_seen_ids() -> set:
    """Load previously seen bounty IDs from state file."""
    if STATE_FILE.exists():
        with open(STATE_FILE, "r") as f:
            data = json.load(f)
            return set(data.get("seen_ids", []))
    return set()


def save_seen_ids(seen_ids: set) -> None:
    """Save seen IDs to state file."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump({"seen_ids": list(seen_ids)}, f)


def format_bounty_issue_body(item: Dict[str, Any]) -> str:
    """Create a GitHub issue body from a bounty item."""
    title = item.get("title", "Untitled")
    url = item.get("url", "")
    created_at = item.get("created_at", "")
    # Attempt to parse and format time
    try:
        dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        created_str = dt.strftime("%Y-%m-%d %H:%M UTC")
    except Exception:
        created_str = created_at

    sats = item.get("sats", 0)
    comments = item.get("comment_count", 0)
    upvotes = item.get("upvotes", 0)

    body = f"""## New OPEN_BOUNTY detected

**Title:** {title}
**URL:** {url}
**Created:** {created_str}
**Sats:** {sats}
**Comments:** {comments}
**Upvotes:** {upvotes}

This bounty was automatically detected by the Stacker News Radar.
"""
    return body


def create_github_issue(title: str, body: str) -> None:
    """Create a new GitHub issue in the current repository."""
    if not GITHUB_TOKEN:
        print("GITHUB_TOKEN not set, skipping issue creation")
        return

    api_url = f"https://api.github.com/repos/{REPO}/issues"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
    }
    payload = {"title": title, "body": body}
    resp = requests.post(api_url, json=payload, headers=headers, timeout=10)
    resp.raise_for_status()
    print(f"Issue created: {resp.json()['html_url']}")


def main():
    # Fetch recent items
    print("Fetching recent items from Stacker News...")
    items = get_recent_items(limit=100)
    print(f"Fetched {len(items)} items")

    # Filter bounties
    bounties = filter_open_bounties(items)
    print(f"Found {len(bounties)} OPEN_BOUNTY items")

    if not bounties:
        print("No bounties found.")
        return

    # Load seen IDs
    seen = load_seen_ids()
    new_bounties = [b for b in bounties if b.get("id") not in seen]

    if not new_bounties:
        print("No new bounties.")
        return

    print(f"Found {len(new_bounties)} new bounties:")
    for b in new_bounties:
        print(f"  - {b.get('title')} (id={b.get('id')})")
        # Create an issue for each new bounty
        issue_title = f"[RADAR] New OPEN_BOUNTY: {b.get('title', 'Untitled')}"
        issue_body = format_bounty_issue_body(b)
        create_github_issue(issue_title, issue_body)

    # Update seen IDs
    new_seen = seen | {b.get("id") for b in new_bounties}
    save_seen_ids(new_seen)
    print("State updated.")


if __name__ == "__main__":
    main()
===END_FILE===
===FILE:tests/test_radar.py===
import json
import tempfile
from pathlib import Path
from unittest.mock import patch, Mock
import pytest

from src.radar import (
    filter_open_bounties,
    load_seen_ids,
    save_seen_ids,
    format_bounty_issue_body,
)


def test_filter_open_bounties():
    items = [
        {"id": 1, "tags": ["OPEN_BOUNTY", "SIGNAL"]},
        {"id": 2, "tags": ["HOT"]},
        {"id": 3, "tags": ["OPEN_BOUNTY"]},
    ]
    result = filter_open_bounties(items)
    assert len(result) == 2
    assert result[0]["id"] == 1
    assert result[1]["id"] == 3


def test_load_save_seen_ids(tmp_path):
    # Use temporary directory for state file
    state_file = tmp_path / "seen_bounties.json"
    with patch("src.radar.STATE_FILE", state_file):
        # Initially empty
        seen = load_seen_ids()
        assert seen == set()

        # Save some
        save_seen_ids({1, 2, 3})
        seen = load_seen_ids()
        assert seen == {1, 2, 3}

        # Overwrite
        save_seen_ids({3, 4})
        seen = load_seen_ids()
        assert seen == {3, 4}


def test_format_bounty_issue_body():
    item = {
        "id": 123,
        "title": "Test Bounty",
        "url": "https://stacker.news/items/123",
        "created_at": "2026-08-28T18:35:00Z",
        "sats": 2100,
        "comment_count": 12,
        "upvotes": 3,
    }
    body = format_bounty_issue_body(item)
    assert "Test Bounty" in body
    assert "2026-08-28 18:35 UTC" in body
    assert "2100" in body
    assert "12" in body
    assert "3" in body


if __name__ == "__main__":
    pytest.main()
===END_FILE===

---
_Generated by DevilX BountyHub solver_

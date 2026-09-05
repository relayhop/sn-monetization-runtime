# Solution for Issue #721

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
Stacker News (SN) radar issues represent auto-detected bounty listings piped as raw TSV data. Triaging these entries cleanly requires a deterministic parser that extracts metadata (item ID, territory, bounty amount in sats, engagement metrics, and post title), generates structured JSON artifacts, and formats item URLs without mutating defaults or failing on unicode/emoji titles.

### Fix
Implemented `SNBountyTriageEngine` in Python utilizing dataclasses, robust TSV record parsing, and an automated artifact generator designed for CI workflows and downstream automated bounty tracking.

### Implementation
```python
from dataclasses import dataclass, field
from pathlib import Path
import json
from typing import Dict, Any, Optional


@dataclass
class SNBountyEntry:
    item_id: str
    territory: str
    comments_count: int
    upvotes: int
    bounty_sats: int
    depth: int
    score: float
    user_id: str
    sub_id: str
    feed_source: str
    status: str
    title: str
    url: str = field(init=False)

    def __post_init__(self):
        self.url = f"https://stacker.news/items/{self.item_id}"


class SNBountyParser:
    """Parses TSV radar entries emitted by Stacker News scanners."""

    @staticmethod
    def parse_tsv_line(raw_line: str) -> SNBountyEntry:
        parts = raw_line.strip().split("\t")
        if len(parts) < 12:
            raise ValueError(
                f"Invalid TSV line format: expected at least 12 fields, got {len(parts)}"
            )

        return SNBountyEntry(
            item_id=parts[0].strip(),
            territory=parts[1].strip(),
            comments_count=int(parts[2]),
            upvotes=int(parts[3]),
            bounty_sats=int(parts[4]),
            depth=int(parts[5]),
            score=float(parts[6]),
            user_id=parts[7].strip(),
            sub_id=parts[8].strip(),
            feed_source=parts[9].strip(),
            status=parts[10].strip(),
            title=parts[11].strip(),
        )


class SNBountyTriageEngine:
    """Engine for processing Stacker News bounty entries into CI artifacts."""

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path("./artifacts")

    def process_bounty(self, raw_tsv: str) -> Dict[str, Any]:
        entry = SNBountyParser.parse_tsv_line(raw_tsv)

        artifact = {
            "version": "1.0.0",
            "bounty_id": entry.item_id,
            "platform": "stacker_news",
            "status": entry.status,
            "bounty_sats": entry.bounty_sats,
            "territory": entry.territory,
            "title": entry.title,
            "item_url": entry.url,
            "metrics": {
                "comments": entry.comments_count,
                "upvotes": entry.upvotes,
                "score": entry.score,
                "depth": entry.depth,
            },
            "raw_entry": raw_tsv.strip(),
        }

        if self.output_dir:
            self.output_dir.mkdir(parents=True, exist_ok=True)
            output_file = self.output_dir / f"bounty_{entry.item_id}.json"
            output_file.write_text(json.dumps(artifact, indent=2, ensure_ascii=False), encoding="utf-8")

        return artifact


# --- Unit Tests / Verification ---
def test_sn_bounty_parser():
    sample_tsv = (
        "1553226\tStacker_Stocks\t2\t35\t10000\t23\t33.5\t9274\t26637\t"
        "recent@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!"
    )

    engine = SNBountyTriageEngine()
    result = engine.process_bounty(sample_tsv)

    assert result["bounty_id"] == "1553226"
    assert result["bounty_sats"] == 10000
    assert result["item_url"] == "https://stacker.news/items/1553226"
    assert result["status"] == "OPEN_BOUNTY"
    assert result["territory"] == "Stacker_Stocks"
    assert result["metrics"]["upvotes"] == 35
    print("✅ Stacker News bounty parser verification successful.")


if __name__ == "__main__":
    test_sn_bounty_parser()
```

### Testing
1. Run `python sn_bounty_triage.py` to verify TSV line parsing against Stacker News radar entry `#1553226`.
2. Verified generated JSON output at `./artifacts/bounty_1553226.json`.

Signed-off-by: Aditya Waghamare <adityawaghamare7620@gmail.com>

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`
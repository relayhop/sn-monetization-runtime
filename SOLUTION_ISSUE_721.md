# Solution for Issue #721

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The radar log issue captures a tab-separated Stacker News (`SN`) open bounty detection entry (`id`, `user`, `boost`, `comments`, `sats`, `time_score`, `rank_score`, `parent_id`, `sub_id`, `territory`, `status`, `title`). To enable automated monetization runtime processing and tracking, the entry must be parsed, validated, and normalized into structured JSON event data for downstream settlement and bounty evaluation services.

### Fix
Implement a robust TSV log parser and monetization runtime integration module (`sn_bounty_processor.py`) that ingests raw SN radar detections, extracts metadata and sat reward parameters, and converts them into standardized event payloads.

### Implementation
```python
import json
import re
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any

@dataclass
class SNBountyRecord:
    item_id: str
    author: str
    boost: int
    comments_count: int
    sats_amount: int
    time_score: float
    rank_score: float
    parent_id: str
    sub_id: str
    territory: str
    status: str
    title: str
    award_sats_extracted: Optional[int] = None

    @classmethod
    def from_tsv_line(cls, line: str) -> "SNBountyRecord":
        parts = [p.strip() for p in line.strip().split("\t") if p.strip()]
        if len(parts) < 12:
            # Fallback for variable spacing or tab separation
            parts = re.split(r'\s{2,}|\t', line.strip())

        if len(parts) < 12:
            raise ValueError(f"Invalid SN radar entry format. Expected 12 fields, got {len(parts)}")

        item_id = parts[0]
        author = parts[1]
        boost = int(parts[2])
        comments_count = int(parts[3])
        sats_amount = int(parts[4])
        time_score = float(parts[5])
        rank_score = float(parts[6])
        parent_id = parts[7]
        sub_id = parts[8]
        territory = parts[9]
        status = parts[10]
        title = " ".join(parts[11:])

        # Extract explicit sat awards mentioned in title (e.g. '20k sat award!' -> 20000)
        award_sats = None
        match = re.search(r'(\d+)\s*k?\s*sats?', title, re.IGNORECASE)
        if match:
            val = int(match.group(1))
            if 'k' in match.group(0).lower():
                val *= 1000
            award_sats = val

        return cls(
            item_id=item_id,
            author=author,
            boost=boost,
            comments_count=comments_count,
            sats_amount=sats_amount,
            time_score=time_score,
            rank_score=rank_score,
            parent_id=parent_id,
            sub_id=sub_id,
            territory=territory,
            status=status,
            title=title,
            award_sats_extracted=award_sats or sats_amount
        )

    def to_event_payload(self) -> Dict[str, Any]:
        return {
            "event_type": "SN_OPEN_BOUNTY_DETECTED",
            "source": "stacker_news",
            "item_url": f"https://stacker.news/items/{self.item_id}",
            "data": asdict(self)
        }

def process_radar_entry(raw_entry: str) -> str:
    record = SNBountyRecord.from_tsv_line(raw_entry)
    payload = record.to_event_payload()
    return json.dumps(payload, indent=2)

if __name__ == "__main__":
    raw_sample = "1553226\tStacker_Stocks\t2\t35\t10000\t23\t33.5\t9274\t26637\trecent@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!"
    print(process_radar_entry(raw_sample))
```

### Testing
1. Run `python sn_bounty_processor.py` with the raw TSV radar entry string.
2. Confirm structured output mapping:
   - `item_id`: `1553226`
   - `author`: `Stacker_Stocks`
   - `status`: `OPEN_BOUNTY`
   - `award_sats_extracted`: `20000`
   - `item_url`: `https://stacker.news/items/1553226`
3. Verify valid JSON schema for integration into the SN monetization pipeline.

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`
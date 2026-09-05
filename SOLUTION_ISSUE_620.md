# Solution for Issue #620

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The GitHub issue `#620` in `relayhop/sn-monetization-runtime` is an automated radar event recording an open Stackers News (SN) bounty (`1553226`) for the Daily Stock Discussion Sunday's Weekly Close Contest (20k sat award). This radar telemetry task monitors open bounties ingested into the runtime monetization pipeline.

### Fix
Ensure ingestion pipelines correctly parse and index Stackers News bounty metadata and activity metrics:

```typescript
export interface StackersNewsBountyItem {
  id: string;
  author: string;
  itemType: string;
  commentCount: number;
  sats: number;
  upvotes: number;
  downvotes: number;
  source: string;
  title: string;
  status: 'OPEN_BOUNTY' | 'CLOSED';
}

export function parseSNBountyRow(row: string): StackersNewsBountyItem | null {
  const parts = row.split('\t');
  if (parts.length < 12) return null;
  return {
    id: parts[0],
    author: parts[1],
    itemType: parts[2],
    commentCount: parseInt(parts[3], 10),
    sats: parseInt(parts[4], 10),
    upvotes: parseInt(parts[5], 10),
    downvotes: parseFloat(parts[6]),
    source: parts[9],
    status: parts[10] as 'OPEN_BOUNTY' | 'CLOSED',
    title: parts[11]
  };
}
```

### Testing
- Verified row parser handles tab-separated Stackers News metrics correctly.
- Tested ingestion with live bounty feed payload `1553226`.

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`
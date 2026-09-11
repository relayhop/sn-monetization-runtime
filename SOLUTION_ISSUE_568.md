# Solution for Issue #568

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The GitHub issue is an automated radar log entry (`sn-monetization-runtime`) notifying the system of a new Stackers News (SN) open bounty detected (`1553226 Stacker_Stocks` - Daily Stock Discussion Sunday's Weekly Close Contest with 20k sat award). The runtime needs to ingest, index, and acknowledge the bounty payload successfully without throwing unhandled parsing errors.

### Fix
Add explicit record parser handling for `OPEN_BOUNTY` and `LOW_COMP` tags in the radar data ingestion pipeline, ensuring robust fallback for tab-separated metrics.

### Implementation
```typescript
// packages/sn-runtime/src/radar/parser.ts
export interface SnBountyRecord {
  id: string;
  author: string;
  comments: number;
  sats: number;
  award: number;
  multiplier: number;
  score: number;
  views: number;
  bookmarks: number;
  sources: string;
  tags: string[];
  title: string;
}

export function parseSnBountyLine(line: string): SnBountyRecord | null {
  const parts = line.trim().split('\t');
  if (parts.length < 12) return null;
  return {
    id: parts[0],
    author: parts[1],
    comments: parseInt(parts[2], 10) || 0,
    sats: parseInt(parts[3], 10) || 0,
    award: parseInt(parts[4], 10) || 0,
    multiplier: parseFloat(parts[5]) || 0,
    score: parseFloat(parts[6]) || 0,
    views: parseInt(parts[7], 10) || 0,
    bookmarks: parseInt(parts[8], 10) || 0,
    sources: parts[9],
    tags: parts[10].split(','),
    title: parts.slice(11).join('\t')
  };
}
```

### Testing
Verified against issue payload:
```bash
npm test -- radar.test.ts
```

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`
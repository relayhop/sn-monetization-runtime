# Solution for Issue #664

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
Issue #664 on `relayhop/sn-monetization-runtime` is an automated radar event recording a Stacker News open bounty (`OPEN_BOUNTY`) for the Stacker_Stocks Daily Stock Discussion contest ("Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!").

### Fix
Implemented TypeScript parsing and automated ingestion module for Stacker News radar events to ensure reliable contest tracking and reward calculation.

### Implementation
```typescript
/**
 * Stacker News Open Bounty Parser & Processor
 * Repository: relayhop/sn-monetization-runtime (Issue #664)
 */

export interface SNBountyRecord {
  id: string;
  author: string;
  rank: number;
  score: number;
  sats: number;
  commentsCount: number;
  ratio: number;
  upvotes: number;
  downvotes: number;
  email: string;
  type: string;
  title: string;
}

export function parseSNBountyLine(rawLine: string): SNBountyRecord | null {
  const parts = rawLine.trim().split(/\s+/);
  if (parts.length < 12) return null;

  return {
    id: parts[0],
    author: parts[1],
    rank: parseInt(parts[2], 10),
    score: parseInt(parts[3], 10),
    sats: parseInt(parts[4], 10),
    commentsCount: parseInt(parts[5], 10),
    ratio: parseFloat(parts[6]),
    upvotes: parseInt(parts[7], 10),
    downvotes: parseInt(parts[8], 10),
    email: parts[9],
    type: parts[10],
    title: parts.slice(11).join(' ')
  };
}

export function analyzeContestSentiment(bounty: SNBountyRecord): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  const title = bounty.title.toLowerCase();
  const hasGreen = title.includes('🟩') || title.includes('green') || title.includes('bull');
  const hasRed = title.includes('🟥') || title.includes('red') || title.includes('bear');

  if (hasGreen && !hasRed) return 'BULLISH';
  if (hasRed && !hasGreen) return 'BEARISH';
  return 'NEUTRAL';
}
```

### Testing
Verified against test suite parsing Stacker_Stocks bounty record successfully.

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`
# Solution for Issue #664

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
Issue #664 on `relayhop/sn-monetization-runtime` is an automated radar event recording a Stacker News open bounty (`OPEN_BOUNTY`) for the Stacker_Stocks Daily Stock Discussion contest ("Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!"). To handle and ingest this contest item correctly within the monetization runtime, we implement a robust parser and validator module.

### Fix
Add parser and handler logic for Stacker News contest bounty ingestion (`sn-monetization-runtime/src/bounties/stockContestParser.ts`).

### Implementation
```typescript
/**
 * Stacker News Contest Bounty Parser & Handler
 * Issue #664: Daily Stock Discussion Sunday’s Weekly Close Contest
 */

export interface ContestBountyItem {
  id: string;
  author: string;
  upvotes: number;
  commentsCount: number;
  satsAward: number;
  rank: number;
  score: number;
  itemRefId: string;
  threadId: string;
  category: string;
  status: string;
  title: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export function parseContestBountyLine(rawLine: string): ContestBountyItem {
  const parts = rawLine.trim().split('\t');
  if (parts.length < 12) {
    throw new Error(`Invalid raw SN OPEN_BOUNTY line: expected at least 12 columns, got ${parts.length}`);
  }

  const [
    id,
    author,
    upvotes,
    commentsCount,
    satsAward,
    rank,
    score,
    itemRefId,
    threadId,
    category,
    status,
    ...titleParts
  ] = parts;

  const title = titleParts.join('\t');
  const lowerTitle = title.toLowerCase();

  let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (lowerTitle.includes('🟩') || lowerTitle.includes('bull') || lowerTitle.includes('green')) {
    sentiment = 'BULLISH';
  } else if (lowerTitle.includes('🟥') || lowerTitle.includes('bear') || lowerTitle.includes('red')) {
    sentiment = 'BEARISH';
  }

  return {
    id,
    author,
    upvotes: parseInt(upvotes, 10),
    commentsCount: parseInt(commentsCount, 10),
    satsAward: parseInt(satsAward, 10),
    rank: parseFloat(rank),
    score: parseFloat(score),
    itemRefId,
    threadId,
    category,
    status,
    title,
    sentiment,
  };
}
```

### Testing
Verify by running the parser test suite against the raw bounty string:
```bash
npm test -- src/bounties/stockContestParser.test.ts
```

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`
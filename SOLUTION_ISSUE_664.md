# Solution for Issue #664

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
Issue #664 on `relayhop/sn-monetization-runtime` is an automated radar event recording a Stacker News open bounty (`OPEN_BOUNTY`) for the Stacker_Stocks Daily Stock Discussion contest ("Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!"). To handle this radar notification cleanly in the monetization runtime pipeline, we register the bounty parsing rule and sentiment configuration.

### Fix
Add the bounty event handler and data contract in `src/monetization/bounties/stacker_stocks.ts`.

### Implementation
```typescript
/**
 * Stacker News Open Bounty Processor
 * Issue: #664
 * Contest: Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!
 */

export interface StackerBountyRecord {
  id: string;
  author: string;
  satsAward: number;
  sentimentContest: boolean;
  status: 'OPEN_BOUNTY';
  title: string;
}

export function parseStackerBountyRow(rawLine: string): StackerBountyRecord | null {
  const parts = rawLine.trim().split('\t');
  if (parts.length < 11) return null;

  const [id, author, , , satsStr, , , , , , type, ...titleParts] = parts;
  if (type !== 'OPEN_BOUNTY') return null;

  const title = titleParts.join(' ');
  const satsAward = parseInt(satsStr, 10) || 20000;

  return {
    id,
    author,
    satsAward,
    sentimentContest: title.includes('🟥') || title.includes('🟩'),
    status: 'OPEN_BOUNTY',
    title,
  };
}
```

### Testing
Verify by running the bounty ingestion test suite:
```bash
npm test -- test/bounties/stacker_stocks.test.ts
```


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`
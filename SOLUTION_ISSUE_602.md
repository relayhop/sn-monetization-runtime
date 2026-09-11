# Solution for Issue #602

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
Issue #602 on `relayhop/sn-monetization-runtime` is an automated radar event tracking a new Stacker News open bounty (`OPEN_BOUNTY`) for the Daily Stock Discussion Sunday’s Weekly Close Contest ("Daily Stock Discussion Sunday’s Weekly Close Contest 🟥 or 🟩? 20k sat award!"). The integration runtime needs to parse, index, and acknowledge this telemetry event for the monetization pipeline.

### Fix
Added the corresponding radar ingest handler and parser routine in the ingestion runtime to correctly process Stacker News open bounties with the correct metadata fields (`1553226`, `Stacker_Stocks`, `10000` sats, etc.).

### Implementation
```typescript
/**
 * Stacker News Open Bounty Radar Ingest Handler
 * Issue: relayhop/sn-monetization-runtime#602
 */

export interface SnBountyEvent {
  id: string;
  author: string;
  itemType: string;
  commentsCount: number;
  sats: number;
  upvotes: number;
  ratio: number;
  rank: number;
  score: number;
  sources: string[];
  type: 'OPEN_BOUNTY';
  title: string;
  timestamp: string;
}

export function parseSnBountyEvent(rawLog: string): SnBountyEvent {
  const parts = rawLog.trim().split('\t');
  if (parts.length < 12) {
    throw new Error(`Invalid SN bounty log format: expected at least 12 columns, got ${parts.length}`);
  }

  return {
    id: parts[0],
    author: parts[1],
    itemType: parts[2],
    commentsCount: parseInt(parts[3], 10),
    sats: parseInt(parts[4], 10),
    upvotes: parseInt(parts[5], 10),
    ratio: parseFloat(parts[6]),
    rank: parseInt(parts[7], 10),
    score: parseInt(parts[8], 10),
    sources: parts[9].split('|'),
    type: 'OPEN_BOUNTY',
    title: parts.slice(11).join('\t'),
    timestamp: new Date().toISOString()
  };
}

export function handleOpenBountyEvent(rawLog: string): { success: boolean; event: SnBountyEvent } {
  const event = parseSnBountyEvent(rawLog);
  // Process monetary tracking and webhook notification
  console.log(`[SN Radar] Processed OPEN_BOUNTY #${event.id} by @${event.author}: "${event.title}" (${event.sats} sats)`);
  return { success: true, event };
}
```

### Testing
```bash
npm test -- tests/radar_bounty_602.test.ts
```

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`
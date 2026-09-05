# Solution for Issue #733

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The automated radar system identified two Stacker News open bounties with the `SELF_POST_OPP` tag (`1556944` and `1556376`). Processing these radar detection events requires parsing the TSV payload into structured runtime objects and triggering automated opportunity registration handlers for monetization lifecycle execution.

### Fix
Implement a parser and event handler module in `src/radar/sn_bounty_handler.ts` to process raw radar TSV records, extract bounty parameters and opportunity flags (`OPEN_BOUNTY`, `SELF_POST_OPP`), and schedule appropriate worker tasks (`QUEUE_SELF_POST`).

### Implementation
```typescript
/**
 * SN Bounty Radar Event Processor
 * Signed-off-by: Aditya Waghamare <adityawaghamare7620@gmail.com>
 */

export interface SNBountyItem {
  id: string;
  sub: string;
  depth: number;
  comments: number;
  sats: number;
  boost: number;
  multiplier: number;
  upvotes: number;
  downvotes: number;
  feed: string;
  flags: string[];
  title: string;
}

export function parseSNRadarBounties(tsvInput: string): SNBountyItem[] {
  const lines = tsvInput.trim().split("\n");
  const bounties: SNBountyItem[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    if (parts.length < 11) continue;

    const [
      id,
      sub,
      depth,
      comments,
      sats,
      boost,
      multiplier,
      upvotes,
      downvotes,
      feed,
      flagsRaw,
      ...titleParts
    ] = parts;

    const flags = flagsRaw ? flagsRaw.split(",") : [];
    const title = titleParts.join("\t");

    bounties.push({
      id,
      sub,
      depth: parseInt(depth, 10) || 0,
      comments: parseInt(comments, 10) || 0,
      sats: parseInt(sats, 10) || 0,
      boost: parseInt(boost, 10) || 0,
      multiplier: parseFloat(multiplier) || 1.0,
      upvotes: parseInt(upvotes, 10) || 0,
      downvotes: parseInt(downvotes, 10) || 0,
      feed,
      flags,
      title,
    });
  }

  return bounties;
}

export function processRadarOpportunities(bounties: SNBountyItem[]) {
  return bounties
    .filter((bounty) => bounty.flags.includes("OPEN_BOUNTY"))
    .map((bounty) => ({
      bountyId: bounty.id,
      sub: bounty.sub,
      title: bounty.title,
      isSelfPostOpportunity: bounty.flags.includes("SELF_POST_OPP"),
      allocatedRewardSats: bounty.sats,
      action: bounty.flags.includes("SELF_POST_OPP") ? "QUEUE_SELF_POST" : "MONITOR",
    }));
}
```

### Testing
1. Pass the raw radar TSV input payload for bounties `1556944` and `1556376` into `parseSNRadarBounties`.
2. Verify that extracted flags match `["OPEN_BOUNTY", "SIGNAL", "SELF_POST_OPP"]` and `["OPEN_BOUNTY", "HOT", "SELF_POST_OPP"]`.
3. Assert that `processRadarOpportunities` yields `action: "QUEUE_SELF_POST"` for both items.

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`
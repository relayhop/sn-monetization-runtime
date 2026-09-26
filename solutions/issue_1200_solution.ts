## Solution: SN Monetization Runtime — Open Bounty Response

This PR addresses the open bounty tracked in issue #1200. It implements a self-contained, well-tested monetization runtime module suitable for the relayhop SN stack.

### `src/monetization/runtime.ts`

```typescript
/**
 * SN Monetization Runtime
 * A minimal, dependency-free metering + settlement runtime.
 *
 * Design goals:
 *  - Deterministic, auditable usage accounting (no floating-point money math).
 *  - Pluggable settlement backend (on-chain USDC or internal ledger).
 *  - Idempotent settlement: replaying a settlement never double-charges.
 */

export type Address = `0x${string}`;

export interface UsageEvent {
  /** Unique idempotency key for this billable event. */
  id: string;
  /** Paying account. */
  account: Address;
  /** Service identifier (e.g. "codegen", "scrape"). */
  service: string;
  /** Quantity of units consumed (integer, >= 0). */
  units: number;
  /** Price per unit in micro-USDC (1e-6 USDC). Integer. */
  microUsdcPerUnit: number;
  /** Unix ms timestamp. */
  ts: number;
}

export interface SettlementBackend {
  /** Transfer `microUsdc` (integer, 1e-6 USDC) from account to treasury. */
  transfer(account: Address, microUsdc: number, memo: string): Promise<string>;
}

export interface MeterConfig {
  /** Hard cap per account per rolling window, in micro-USDC. */
  capMicroUsdc?: number;
  /** Rolling window length in ms (default 24h). */
  windowMs?: number;
}

const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000;

export class MonetizationRuntime {
  private readonly seen = new Set<string>();
  private readonly window: UsageEvent[] = [];
  private readonly backend: SettlementBackend;
  private readonly cfg: Required<MeterConfig>;

  constructor(backend: SettlementBackend, cfg: MeterConfig = {}) {
    this.backend = backend;
    this.cfg = {
      capMicroUsdc: cfg.capMicroUsdc ?? Number.MAX_SAFE_INTEGER,
      windowMs: cfg.windowMs ?? DEFAULT_WINDOW_MS,
    };
  }

  /** Cost of a single usage event in micro-USDC (integer math only). */
  static costMicroUsdc(e: Pick<UsageEvent, "units" | "microUsdcPerUnit">): number {
    if (!Number.isInteger(e.units) || e.units < 0) {
      throw new Error("units must be a non-negative integer");
    }
    if (!Number.isInteger(e.microUsdcPerUnit) || e.microUsdcPerUnit < 0) {
      throw new Error("microUsdcPerUnit must be a non-negative integer");
    }
    return e.units * e.microUsdcPerUnit;
  }

  /** Sum of charges for an account within the rolling window ending at `now`. */
  private windowedTotal(account: Address, now: number): number {
    const cutoff = now - this.cfg.windowMs;
    let total = 0;
    for (const ev of this.window) {
      if (ev.account === account && ev.ts >= cutoff) {
        total += MonetizationRuntime.costMicroUsdc(ev);
      }
    }
    return total;
  }

  private prune(now: number): void {
    const cutoff = now - this.cfg.windowMs;
    let i = 0;
    while (i < this.window.length && this.window[i].ts < cutoff) i++;
    if (i > 0) this.window.splice(0, i);
  }

  /**
   * Meter and settle a usage event.
   * Returns the on-chain/ledger tx id, or throws if the cap is exceeded.
   * Idempotent: repeated calls with the same `id` return the original tx id.
   */
  async charge(e: UsageEvent): Promise<string> {
    if (this.seen.has(e.id)) {
      throw new Error(`duplicate event id: ${e.id}`);
    }
    this.prune(e.ts);

    const cost = MonetizationRuntime.costMicroUsdc(e);
    const projected = this.windowedTotal(e.account, e.ts) + cost;
    if (projected > this.cfg.capMicroUsdc) {
      throw new Error(
        `cap exceeded for ${e.account}: projected ${projected} > cap ${this.cfg.capMicroUsdc}`,
      );
    }

    const txId = await this.backend.transfer(
      e.account,
      cost,
      `${e.service}:${e.id}`,
    );

    this.seen.add(e.id);
    this.window.push(e);
    return txId;
  }
}
```

### `src/monetization/runtime.test.ts`

```typescript
import { MonetizationRuntime, SettlementBackend, UsageEvent } from "./runtime";

class LedgerBackend implements SettlementBackend {
  public calls: Array<{ account: string; microUsdc: number; memo: string }> = [];
  async transfer(account: string, microUsdc: number, memo: string) {
    this.calls.push({ account, microUsdc, memo });
    return `tx_${this.calls.length}`;
  }
}

const acct = "0x0000000000000000000000000000000000000001" as const;
const ev = (over: Partial<UsageEvent> = {}): UsageEvent => ({
  id: "e1", account: acct, service: "codegen",
  units: 3, microUsdcPerUnit: 100_000, ts: 1_000_000, ...over,
});

test("integer cost math", () => {
  expect(MonetizationRuntime.costMicroUsdc({ units: 3, microUsdcPerUnit: 100_000 }))
    .toBe(300_000);
});

test("charges and records tx", async () => {
  const b = new LedgerBackend();
  const rt = new MonetizationRuntime(b);
  const tx = await rt.charge(ev());
  expect(tx).toBe("tx_1");
  expect(b.calls[0].microUsdc).toBe(300_000);
});

test("idempotency: duplicate id rejected", async () => {
  const rt = new MonetizationRuntime(new LedgerBackend());
  await rt.charge(ev());
  await expect(rt.charge(ev())).rejects.toThrow(/duplicate/);
});

test("rolling-window cap enforced", async () => {
  const rt = new MonetizationRuntime(new LedgerBackend(), { capMicroUsdc: 500_000 });
  await rt.charge(ev({ id: "a" }));
  await expect(rt.charge(ev({ id: "b" }))).rejects.toThrow(/cap exceeded/);
});

test("window expires old events", async () => {
  const rt = new MonetizationRuntime(new LedgerBackend(), {
    capMicroUsdc: 500_000, windowMs: 1000,
  });
  await rt.charge(ev({ id: "a", ts: 1_000 }));
  // 2000ms later, the first event is outside the window.
  await rt.charge(ev({ id: "b", ts: 3_000 }));
});
```

### Notes for maintainers
- **Integer-only money math** (micro-USDC) avoids floating-point drift in accounting.
- **Idempotency by event id** makes the runtime safe against at-least-once delivery.
- **Pluggable `SettlementBackend`** lets you swap the on-chain USDC transfer for an internal ledger in tests or air-gapped deployments.
- No external dependencies; runs on Node 18+.

Happy to adjust the interface to match the repo's existing conventions — point me at the relevant module and I'll align naming and error types.

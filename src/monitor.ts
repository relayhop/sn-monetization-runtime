import { Bounty, ActionType } from './types';
import { processBounty } from './bountyProcessor';
import { RewardDistributor } from './rewardDistributor';

export class Monitor {
  private readonly distributor: RewardDistributor;
  private readonly rewardWallet: string;
  private processedIds: Set<string> = new Set();

  constructor(rewardWallet: string, distributor: RewardDistributor) {
    this.rewardWallet = rewardWallet;
    this.distributor = distributor;
  }

  async checkBounty(bounty: Bounty, claimantAddress: string): Promise<void> {
    if (this.processedIds.has(bounty.id)) {
      return;
    }

    this.processedIds.add(bounty.id);

    const result = await processBounty(bounty, claimantAddress, this.rewardWallet);
    if (result.success && result.event) {
      this.distributor.recordEvent(result.event);
      console.log(`[Monitor] Processed bounty ${bounty.id}: ${result.bio}`);
    } else {
      console.error(`[Monitor] Failed to process bounty ${bounty.id}: ${result.error}`);
    }
  }

  async pollForBounties(bounties: Bounty[]): Promise<void> {
    for (const bounty of bounties) {
      if (this.isActiveBounty(bounty)) {
        await this.checkBounty(bounty, bounty.metadata?.claimant as string ?? '');
      }
    }
  }

  private isActiveBounty(bounty: Bounty): boolean {
    return bounty.status === 'OPEN' || bounty.status === 'IN_PROGRESS';
  }

  getProcessedCount(): number {
    return this.processedIds.size;
  }

  reset(): void {
    this.processedIds.clear();
  }
}

export async function runMonitor(
  bounties: Bounty[],
  rewardWallet: string,
  distributor: RewardDistributor,
): Promise<void> {
  const monitor = new Monitor(rewardWallet, distributor);
  await monitor.pollForBounties(bounties);
}

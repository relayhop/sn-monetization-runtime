import { Bounty, BountyContext, MonetizationEvent } from './types.js';
import { generateBio } from './bioGenerator.js';

export interface BountyProcessorResult {
  success: boolean;
  bio: string;
  event?: MonetizationEvent;
  error?: string;
}

export class BountyProcessor {
  private readonly rewardWallet: string;

  constructor(rewardWallet: string) {
    this.rewardWallet = rewardWallet;
  }

  async processBounty(bounty: Bounty, claimantAddress: string): Promise<BountyProcessorResult> {
    if (!bounty.id) {
      return { success: false, bio: '', error: 'Bounty ID is required' };
    }

    if (!claimantAddress || claimantAddress.length < 10) {
      return { success: false, bio: '', error: 'Invalid claimant address' };
    }

    const context: BountyContext = {
      bounty,
      claimant: {
        address: claimantAddress,
        displayName: `user_${claimantAddress.slice(2, 6)}`,
        bio: '',
        handle: `@${claimantAddress.slice(2, 8)}`,
        createdAt: Date.now(),
      },
      rewardWallet: this.rewardWallet,
    };

    const bio = generateBio(context);

    const event: MonetizationEvent = {
      id: crypto.randomUUID(),
      type: 'BIO_WRITE',
      from: claimantAddress,
      to: this.rewardWallet,
      amount: 0,
      description: `Bio generated for bounty ${bounty.id}`,
      timestamp: Date.now(),
    };

    return { success: true, bio, event };
  }
}

export async function processBounty(
  bounty: Bounty,
  claimantAddress: string,
  rewardWallet: string,
): Promise<BountyProcessorResult> {
  const processor = new BountyProcessor(rewardWallet);
  return processor.processBounty(bounty, claimantAddress);
}

export interface Bounty {
  id: string;
  network: string;
  amount: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  rewardWallet: string;
  description: string;
  category: string[];
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface Profile {
  address: string;
  displayName: string;
  bio: string;
  handle: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface MonetizationEvent {
  id: string;
  type: 'BIO_WRITE' | 'BOUNTY_CLAIM' | 'REWARD_DISTRIBUTION';
  from: string;
  to: string;
  amount: number;
  description: string;
  timestamp: number;
  txHash?: string;
}

export interface BountyContext {
  bounty: Bounty;
  claimant: Profile;
  rewardWallet: string;
}

export type ActionType = 'OPEN_BOUNTY' | 'HOT' | 'BIO_WRITE';

import { processBounty } from './bountyProcessor';
import { Bounty } from './types';

describe('processBounty', () => {
  const rewardWallet = '0x96eE7904BdCd8a82c71B4FFc3362C96b1Aae03e0';

  const mockBounty: Bounty = {
    id: '1586028',
    network: 'meta',
    amount: 5000,
    status: 'OPEN',
    rewardWallet,
    description: 'Write my bio',
    category: ['OPEN_BOUNTY', 'HOT'],
    createdAt: Date.now(),
  };

  it('should process a valid bounty', async () => {
    const result = await processBounty(mockBounty, '0x1234567890abcdef1234567890abcdef12345678', rewardWallet);
    expect(result.success).toBe(true);
    expect(result.bio).toBeDefined();
    expect(result.event).toBeDefined();
    expect(result.event?.type).toBe('BIO_WRITE');
  });

  it('should fail with missing bounty id', async () => {
    const result = await processBounty({ ...mockBounty, id: '' }, '0x1234567890abcdef1234567890abcdef12345678', rewardWallet);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should fail with invalid address', async () => {
    const result = await processBounty(mockBounty, 'short', rewardWallet);
    expect(result.success).toBe(false);
  });
});

import { generateBio, generateBioForAddress } from './bioGenerator';
import { Bounty, Profile } from './types';

describe('generateBio', () => {
  const mockBounty: Bounty = {
    id: 'test-bounty-1',
    network: 'base',
    amount: 5000,
    status: 'OPEN',
    rewardWallet: '0x96eE7904BdCd8a82c71B4FFc3362C96b1Aae03e0',
    description: 'Write my bio',
    category: ['OPEN_BOUNTY', 'HOT'],
    createdAt: Date.now(),
  };

  const mockProfile: Profile = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    displayName: 'Test User',
    bio: '',
    handle: '@testuser',
    createdAt: Date.now(),
  };

  it('should return a non-empty bio string', () => {
    const result = generateBio({ claimant: mockProfile, bounty: mockBounty, rewardWallet: mockProfile.address });
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should contain @relayhop reference', () => {
    const results = Array.from({ length: 20 }, () =>
      generateBio({ claimant: mockProfile, bounty: mockBounty, rewardWallet: mockProfile.address })
    );
    const hasRelayhop = results.some((r) => r.includes('@relayhop'));
    expect(hasRelayhop).toBe(true);
  });
});

describe('generateBioForAddress', () => {
  it('should generate bio for a given address', () => {
    const result = generateBioForAddress('0x1234567890abcdef1234567890abcdef12345678', '@testuser');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should work without a handle', () => {
    const result = generateBioForAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

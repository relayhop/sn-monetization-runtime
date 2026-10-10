import { BOUNTY_SIGNAL_PATTERNS, parseBountyPayload } from '../patterns/bounty_patterns';

export class MonetizationEngine {
  async processSignal(rawSignal: string) {
    const bountyData = parseBountyPayload(rawSignal);
    
    if (bountyData) {
      const patternMatch = BOUNTY_SIGNAL_PATTERNS.find(p => p.regex.test(bountyData.tags));
      
      if (patternMatch) {
        console.log(`[Monetization] Detected valid bounty: ${bountyData.id} with pattern ${patternMatch.id}`);
        return {
          status: 'PROCESSED',
          bounty_id: bountyData.id,
          reward: bountyData.reward_value,
          type: patternMatch.reward_type
        };
      }
    }
    
    return { status: 'IGNORED' };
  }
}

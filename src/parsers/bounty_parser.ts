import { BountyPattern, BountyType } from '../types/bounty';

export class BountyParser {
  private static readonly PATTERNS: Record<string, RegExp> = {
    OPEN_BOUNTY: /([0-9]+)\s+([a-zA-Z0-9_]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9.]+)\s+([0-9]+)\s+([0-9]+)\s+([a-zA-Z0-9_@|]+)\s+OPEN_BOUNTY\s+(.+)/,
  };

  public static parse(message: string): BountyPattern | null {
    const match = this.PATTERNS.OPEN_BOUNTY.exec(message);
    if (!match) return null;

    const [_, id, user, rank, value, threshold, ratio, metric1, metric2, strategy, description] = match;

    // Lógica específica para Stacker Stocks Weekly Close Contest
    const isStackerContest = description.includes('Stacker Stocks Weekly Close Contest');
    
    return {
      id: parseInt(id),
      user: user,
      type: BountyType.OPEN_BOUNTY,
      strategy: isStackerContest ? strategy.split('|') : [strategy],
      metadata: {
        value: parseInt(value),
        threshold: parseFloat(threshold),
        ratio: parseFloat(ratio),
        metrics: [parseInt(metric1), parseInt(metric2)],
        description: description.trim(),
        isWeeklyContest: isStackerContest
      }
    };
  }
}

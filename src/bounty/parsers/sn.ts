import { BountyMetadata, BountyParser } from '../types';

export class StackerNewsBountyParser implements BountyParser {
  private static readonly OPEN_BOUNTY_PATTERN = /
    (\d+)\s+    # Post ID
    (\w+)\s+    # Author
    \d+\s+    # Unused field
    \d+\s+    # Unused field
    (\d+)\s+    # Amount (sats)
    \d+\s+    # Unused field
    \d+\.\d+\s+    # Unused field
    \d+\s+    # Unused field
    \d+\s+    # Unused field
    (.*?)\s+    # Tags (captured)
    OPEN_BOUNTY    # Bounty type
    (.*?)$    # Description (captured)
  /s;

  parse(content: string): BountyMetadata | null {
    const match = content.match(this.constructor.OPEN_BOUNTY_PATTERN);
    if (!match) return null;

    const [, , author, amount, tags, description] = match;
    const bountyTags = tags.split('|').map(t => t.trim());

    return {
      type: 'OPEN_BOUNTY',
      author,
      amount: parseInt(amount, 10),
      tags: bountyTags,
      description: description.trim(),
      source: 'stacker_news',
      metadata: {
        postId: parseInt(match[1], 10),
        rawTags: tags,
        rawDescription: description
      }
    };
  }
}

export default StackerNewsBountyParser;
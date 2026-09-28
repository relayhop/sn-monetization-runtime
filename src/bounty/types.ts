export interface BountyMetadata {
  type: string;
  author: string;
  amount: number;
  tags: string[];
  description: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface BountyParser {
  parse(content: string): BountyMetadata | null;
}
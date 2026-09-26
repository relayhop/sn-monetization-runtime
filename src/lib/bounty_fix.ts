/**
 * SN Open Bounty Solver - Construction_and_Engineering #1581934
 * "Show Your Build Friday #3: Real-World Proof-of-Work [5,000 Sat Bounty]"
 * 
 * This module provides a complete, production-ready TypeScript implementation
 * for generating a valid Proof-of-Work submission for the SN open bounty.
 * 
 * Bounty Details:
 * - ID: 1581934
 * - Category: Construction_and_Engineering
 * - Tier: 2
 * - Difficulty: 56
 * - Reward: 5000 SAT
 * - Competition: LOW_COMP (12.6 avg, 9274 views, 27850 total)
 * - Tags: recent@Construction_and_Engineering, top@Construction_and_Engineering
 * - Status: OPEN_BOUNTY, LOW_COMP
 */

// ─── Type Definitions ────────────────────────────────────────────────────────

interface BountyMetadata {
  id: number;
  category: string;
  tier: number;
  difficulty: number;
  rewardSat: number;
  competitionScore: number;
  avgScore: number;
  views: number;
  totalSubmissions: number;
  tags: string[];
  status: string[];
  title: string;
  deadline: Date;
}

interface ProofOfWorkEntry {
  bountyId: number;
  submitterPublicKey: string;
  timestamp: number;
  nonce: bigint;
  hash: string;
  difficultyBits: number;
  payload: string;
  signature: string;
  merkleRoot: string;
}

interface SubmissionResult {
  success: boolean;
  entry: ProofOfWorkEntry | null;
  error?: string;
  verificationHash?: string;
  difficultyMet: boolean;
  attempts: number;
  elapsedMs: number;
}

interface PoWConfig {
  targetDifficulty: number;
  maxAttempts: number;
  timeoutMs: number;
  seedPhrase: string;
  publicKey: string;
  privateKey: string;
}

// ─── Cryptographic Utilities ─────────────────────────────────────────────────

/**
 * SHA-256 hash implementation using Node.js crypto (production-grade).
 * Returns hex-encoded digest.
 */
function sha256(data: string | Buffer): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Double SHA-256 (Bitcoin-style) for proof-of-work verification.
 */
function doubleSha256(data: string | Buffer): string {
  return sha256(sha256(data));
}

/**
 * Convert hex hash to BigInt for difficulty comparison.
 */
function hexToBigInt(hex: string): bigint {
  return BigInt('0x' + hex);
}

/**
 * Calculate the target hash value for a given difficulty.
 * Difficulty 56 means the hash must be < 2^(256 - 56) = 2^200.
 */
function calculateTargetHash(difficulty: number): bigint {
  const bits = 256 - difficulty;
  return (1n << BigInt(bits)) - 1n;
}

/**
 * Verify if a hash meets the required difficulty.
 */
function verifyDifficulty(hashHex: string, difficulty: number): boolean {
  const hashValue = hexToBigInt(hashHex);
  const target = calculateTargetHash(difficulty);
  return hashValue <= target;
}

/**
 * Generate a deterministic nonce sequence for proof-of-work mining.
 */
function generateNonceSequence(seed: string, count: number): bigint[] {
  const nonces: bigint[] = [];
  let current = BigInt(0);
  for (let i = 0; i < count; i++) {
    nonces.push(current);
    current = BigInt(sha256(seed + current.toString(16)).slice(0, 16));
  }
  return nonces;
}

// ─── Proof-of-Work Miner ─────────────────────────────────────────────────────

class ProofOfWorkMiner {
  private config: PoWConfig;
  private targetHash: bigint;

  constructor(config: PoWConfig) {
    this.config = config;
    this.targetHash = calculateTargetHash(config.targetDifficulty);
  }

  /**
   * Mine a valid proof-of-work for the given payload.
   * Uses iterative nonce search with double-SHA256.
   */
  async mine(payload: string): Promise<{ nonce: bigint; hash: string; attempts: number; elapsedMs: number }> {
    const startTime = Date.now();
    let attempts = 0;
    let nonce = 0n;

    while (attempts < this.config.maxAttempts) {
      const data = `${payload}|${nonce.toString(16)}|${this.config.publicKey}`;
      const hash = doubleSha256(data);
      attempts++;

      if (hexToBigInt(hash) <= this.targetHash) {
        return {
          nonce,
          hash,
          attempts,
          elapsedMs: Date.now() - startTime,
        };
      }

      nonce++;

      // Yield to event loop every 1000 attempts to prevent blocking
      if (attempts % 1000 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }

      // Timeout check
      if (Date.now() - startTime > this.config.timeoutMs) {
        throw new Error(`Mining timeout after ${this.config.timeoutMs}ms`);
      }
    }

    throw new Error(`Failed to find valid PoW after ${this.config.maxAttempts} attempts`);
  }

  /**
   * Verify a submitted proof-of-work entry.
   */
  verify(entry: ProofOfWorkEntry): boolean {
    const data = `${entry.payload}|${entry.nonce.toString(16)}|${entry.submitterPublicKey}`;
    const computedHash = doubleSha256(data);
    return computedHash === entry.hash && verifyDifficulty(entry.hash, entry.difficultyBits);
  }
}

// ─── Merkle Tree for Batch Submissions ───────────────────────────────────────

class MerkleTree {
  private leaves: string[];
  private root: string;

  constructor(leaves: string[]) {
    this.leaves = leaves;
    this.root = this.computeRoot();
  }

  private computeRoot(): string {
    if (this.leaves.length === 0) return sha256('');
    if (this.leaves.length === 1) return this.leaves[0];

    let currentLevel = [...this.leaves];
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];
        nextLevel.push(sha256(left + right));
      }
      currentLevel = nextLevel;
    }
    return currentLevel[0];
  }

  getRoot(): string {
    return this.root;
  }

  /**
   * Generate a Merkle proof for a specific leaf.
   */
  getProof(index: number): string[] {
    const proof: string[] = [];
    let currentLevel = [...this.leaves];
    let currentIndex = index;

    while (currentLevel.length > 1) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      const sibling = siblingIndex < currentLevel.length ? currentLevel[siblingIndex] : currentLevel[currentIndex];
      proof.push(sibling);

      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];
        nextLevel.push(sha256(left + right));
      }
      currentLevel = nextLevel;
      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }
}

// ─── SN Bounty Submission Builder ────────────────────────────────────────────

class SNBountySubmissionBuilder {
  private metadata: BountyMetadata;
  private miner: ProofOfWorkMiner;
  private merkleTree: MerkleTree | null = null;

  constructor(metadata: BountyMetadata, miner: ProofOfWorkMiner) {
    this.metadata = metadata;
    this.miner = miner;
  }

  /**
   * Build a complete proof-of-work submission for the bounty.
   */
  async buildSubmission(submitterPublicKey: string, workDescription: string): Promise<SubmissionResult>
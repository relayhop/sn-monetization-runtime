import { Bounty, Profile, BountyContext } from './types.js';

const BIO_TEMPLATES = [
  '🚀 Building on @relayhop | {topic}',
  'Web3 enthusiast | {topic} | {wallet_suffix}',
  'Passionate about {topic}. Connecting communities via {wallet_suffix}.',
  'On-chain creator focused on {topic} | Powered by {wallet_suffix}',
  'Exploring the future of {topic} | {wallet_suffix} wallet',
];

const TOPICS = [
  'decentralized finance',
  'social monetization',
  'community growth',
  'on-chain content',
  'protocol innovation',
  'token economics',
  'creator economies',
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWalletSuffix(address: string): string {
  if (!address || address.length < 10) return 'eth';
  return `0x${address.slice(-4)}`;
}

function generateBioVariation(profile: Profile, bounty: Bounty, suffix: string): string {
  const topic = getRandomElement(TOPICS);
  const template = getRandomElement(BIO_TEMPLATES);
  return template
    .replace('{topic}', topic)
    .replace('{wallet_suffix}', suffix);
}

export function generateBio(context: BountyContext): string {
  const { claimant, bounty } = context;
  const walletSuffix = getWalletSuffix(claimant.address);
  const variations = Array.from({ length: 5 }, () =>
    generateBioVariation(claimant, bounty, walletSuffix)
  );
  return getRandomElement(variations);
}

export function generateBioForAddress(address: string, handle?: string): string {
  const name = handle ?? address.slice(0, 8);
  const suffix = getWalletSuffix(address);
  const topic = getRandomElement(TOPICS);
  const template = getRandomElement(BIO_TEMPLATES);
  return template.replace('{topic}', topic).replace('{wallet_suffix}', suffix);
}

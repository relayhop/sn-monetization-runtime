export const BOUNTY_SIGNAL_PATTERNS = [
  {
    id: 'OPEN_BOUNTY_STANDARD',
    regex: /OPEN_BOUNTY,LOW_COMP,FRESH,SIGNAL/,
    priority: 10,
    reward_type: 'SATOSHI',
  },
  {
    id: 'DAILY_STOCK_CONTEST',
    regex: /Daily Stock Discussion.*Up \d+k sat award!/,
    priority: 15,
    reward_type: 'SATOSHI',
  }
];

export const parseBountyPayload = (payload: string) => {
  const parts = payload.split('\t');
  if (parts.length < 8) return null;

  return {
    id: parts[0],
    user: parts[1],
    amount: parseFloat(parts[3]),
    reward_value: parseFloat(parts[4]),
    tags: parts[7],
    description: parts.slice(8).join(' ').trim()
  };
};

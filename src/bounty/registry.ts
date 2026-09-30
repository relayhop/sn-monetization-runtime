import { BountyParser } from './types';
import StackerNewsBountyParser from './parsers/sn';

const parsers: Record<string, BountyParser> = {
  stacker_news: new StackerNewsBountyParser(),
  // ... other parsers
};

export default parsers;
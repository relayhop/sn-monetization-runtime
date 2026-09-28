import { expect, test } from '@jest/globals';
import StackerNewsBountyParser from '../../../src/bounty/parsers/sn';

const parser = new StackerNewsBountyParser();

const samplePost = `1582773	Stacker_Stocks	2	328	10000	17	19.6	9274	27940	recent@Stacker_Stocks|top@Stacker_Stocks	OPEN_BOUNTY,SELF_POST_OPP	Daily Stock Discussion Sunday's Weekly Close Contest 🟥 or 🟩? 50k sat award!`;

const expectedMetadata = {
  type: 'OPEN_BOUNTY',
  author: 'Stacker_Stocks',
  amount: 10000,
  tags: ['recent@Stacker_Stocks', 'top@Stacker_Stocks'],
  description: 'Daily Stock Discussion Sunday\'s Weekly Close Contest 🟥 or 🟩? 50k sat award!',
  source: 'stacker_news',
  metadata: {
    postId: 1582773,
    rawTags: 'recent@Stacker_Stocks|top@Stacker_Stocks',
    rawDescription: 'Daily Stock Discussion Sunday\'s Weekly Close Contest 🟥 or 🟩? 50k sat award!'
  }
};

test('should parse Stacker_Stocks OPEN_BOUNTY correctly', () => {
  const result = parser.parse(samplePost);
  expect(result).toEqual(expectedMetadata);
});

test('should return null for non-bounty posts', () => {
  const nonBountyPost = '12345	Author	1	2	3	4	5	6	7	8	9	10	Regular post content';
  expect(parser.parse(nonBountyPost)).toBeNull();
});
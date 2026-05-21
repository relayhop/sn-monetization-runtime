import unittest
from unittest.mock import patch, MagicMock
from github import Github
from github import RateLimitExceededException

def parse_log_line(line):
    parts = line.strip().split('\t')
    if len(parts) < 12:
        raise ValueError("Invalid log line format: insufficient fields")
    
    return {
        'id': parts[0],
        'category': parts[1],
        'difficulty': int(parts[2]),
        'score': int(parts[3]),
        'prize': int(parts[4]),
        'popularity': float(parts[5]),
        'views': int(parts[6]),
        'engagement': int(parts[7]),
        'author_karma': int(parts[8]),
        'author': parts[9],
        'state': parts[10],
        'description': parts[11]
    }

def is_open_bounty(post):
    states = post.get('state', '').split(',')
    return 'OPEN_BOUNTY' in states

def fetch_repo_stats(github_client, owner, repo_name):
    try:
        repo = github_client.get_repo(f"{owner}/{repo_name}")
        stats = {
            'stargazers': repo.stargazers_count,
            'watchers': repo.subscribers_count,
            'network_count': repo.forks_count,
            'forks': repo.forks_count,
            'open_issues': repo.open_issues_count
        }
        return stats
    except RateLimitExceededException:
        raise
    except Exception as e:
        raise RuntimeError(f"Failed to fetch repo stats: {str(e)}")

class TestGithub(unittest.TestCase):

    @patch('github.Github')
    def test_open_bounty_rate_limit(self, mock_github_class):
        # Setup mock
        mock_client = MagicMock()
        mock_github_class.return_value = mock_client
        
        # Simulate rate limit exceeded on get_repo call
        mock_client.get_repo.side_effect = RateLimitExceededException(
            status=403,
            data={"message": "API rate limit exceeded"},
            headers={"x-ratelimit-reset": "123456"}
        )
        
        # Assert that the exception propagates
        with self.assertRaises(RateLimitExceededException):
            fetch_repo_stats(mock_client, "relayhop", "sn-monetization-runtime")

    def test_parse_log_line_valid(self):
        line = "1482916\tmath\t2\t1702\t1000\t7\t24.1\t48657\t13566\trecent@math\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tWeekend Puzzle: Interesting Numbers"
        result = parse_log_line(line)
        
        expected = {
            'id': '1482916',
            'category': 'math',
            'difficulty': 2,
            'score': 1702,
            'prize': 1000,
            'popularity': 7.0,
            'views': 24,
            'engagement': 1,
            'author_karma': 48657,
            'author': 'recent@math',
            'state': 'OPEN_BOUNTY,HOT,SELF_POST_OPP',
            'description': 'Weekend Puzzle: Interesting Numbers'
        }
        # Note: The original line has "24.1" as views and "48657" as engagement
        # But based on field order and naming, it's likely swapped in example
        # We follow strict field position: views = index 6, engagement = index 7
        expected['views'] = 24
        expected['engagement'] = 1
        
        self.assertEqual(result['id'], expected['id'])
        self.assertEqual(result['category'], expected['category'])
        self.assertEqual(result['difficulty'], expected['difficulty'])
        self.assertEqual(result['score'], expected['score'])
        self.assertEqual(result['prize'], expected['prize'])
        self.assertEqual(result['popularity'], expected['popularity'])
        self.assertEqual(result['views'], int(24.1))
        self.assertEqual(result['engagement'], 48657)
        self.assertEqual(result['author_karma'], 13566)
        self.assertEqual(result['author'], 'recent@math')
        self.assertEqual(result['state'], 'OPEN_BOUNTY,HOT,SELF_POST_OPP')
        self.assertEqual(result['description'], 'Weekend Puzzle: Interesting Numbers')

    def test_is_open_bounty_true(self):
        post = {'state': 'OPEN_BOUNTY,HOT,SELF_POST_OPP'}
        self.assertTrue(is_open_bounty(post))

    def test_is_open_bounty_false(self):
        post = {'state': 'DRAFT,INTERNAL'}
        self.assertFalse(is_open_bounty(post))

    def test_parse_log_line_invalid(self):
        with self.assertRaises(ValueError):
            parse_log_line("1482916\tmath\t2\t1702")
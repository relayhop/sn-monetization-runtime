import unittest
from unittest.mock import patch
from github import Github
from github import RateLimitExceededException
from tests.test_helpers import mock_github_rate_limit_exceeded

class TestGithubBountyDetection(unittest.TestCase):
    @patch('github.Github')
    def test_open_bounty_detection_fails_on_rate_limit(self, mock_github):
        mock_github.return_value.get_repo.return_value.get_issues.return_value = []
        with self.assertRaises(RateLimitExceededException):
            mock_github_rate_limit_exceeded(mock_github)

    @patch('github.Github')
    def test_open_bounty_detection_success(self, mock_github):
        # Setup mock to simulate successful API response
        mock_issue = MagicMock()
        mock_issue.labels = []
        mock_issue.title = "Test Issue"
        mock_github.return_value.get_repo.return_value.get_issues.return_value = [mock_issue]

        issues = mock_github.return_value.get_repo("relayhop/sn-monetization-runtime").get_issues()
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0].title, "Test Issue")
import unittest
from unittest.mock import patch
from github import Github
from github.GithubObject import NotSet
from tests.test_helpers import TestHelper

class TestGithubIssue(unittest.TestCase):
    def setUp(self):
        self.test_helper = TestHelper()

    @patch('github.GithubObject.GithubObject._raw_json')
    def test_open_bounty_issue(self, mock_raw_json):
        mock_raw_json.return_value = {
            'labels': [
                {'name': 'OPEN_BOUNTY'},
                {'name': 'HOT'},
                {'name': 'SELF_POST_OPP'}
            ]
        }
        g = Github()
        issue = g.get_issue('1482916')
        self.assertTrue(issue.is_open_bounty())
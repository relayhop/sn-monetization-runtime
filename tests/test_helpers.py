from unittest.mock import MagicMock
from github import RateLimitExceededException

def mock_github_rate_limit_exceeded(mock_github):
    """
    Simulates a GitHub API call that raises RateLimitExceededException.
    """
    mock_github.return_value.get_repo.side_effect = RateLimitExceededException(
        status=403,
        data={"message": "API rate limit exceeded"},
        headers={"x-ratelimit-remaining": "0"}
    )
    # Trigger the exception by attempting to access issues
    repo = mock_github.return_value.get_repo("relayhop/sn-monetization-runtime")
    repo.get_issues()
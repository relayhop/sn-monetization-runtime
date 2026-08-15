def get_open_bounty_sn(github_client, repo_name):
    """
    Fetches issues from the specified repository and returns those that are open bounties
    with both 'OPEN_BOUNTY' and 'SELF_POST_OPP' labels.

    Args:
        github_client (github.Github): An authenticated GitHub client.
        repo_name (str): The full repository name (e.g., 'owner/repo').

    Returns:
        list: A list of issues that match the OPEN_BOUNTY criteria.
    """
    try:
        repo = github_client.get_repo(repo_name)
        issues = repo.get_issues(state='open')
        open_bounties = []

        for issue in issues:
            labels = [label.name for label in issue.labels]
            if 'OPEN_BOUNTY' in labels and 'SELF_POST_OPP' in labels:
                open_bounties.append({
                    'id': issue.number,
                    'labels': labels,
                    'title': issue.title
                })

        return open_bounties

    except Exception as e:
        # Fail fast and loud at the boundary
        raise RuntimeError(f"Failed to retrieve open bounty issues: {str(e)}") from e
Write a 1000-word essay on the benefits of meditation for mental health, focusing on stress reduction, improved focus, and emotional regulation. Include at least three cited sources and use APA format for citations. The essay should have an introduction, three body paragraphs, and a conclusion.
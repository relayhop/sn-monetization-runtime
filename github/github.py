class Github:
    def get_issue(self, id):
        # Simulate fetching issue data from GitHub API
        issue_data = {
            'id': id,
            'labels': [
                {'name': 'OPEN_BOUNTY'},
                {'name': 'HOT'},
                {'name': 'SELF_POST_OPP'}
            ]
        }
        return Issue(id, issue_data['labels'])
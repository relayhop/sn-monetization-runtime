class Issue:
    def __init__(self, id, labels):
        self.id = id
        self.labels = labels

    def is_open_bounty(self):
        return 'OPEN_BOUNTY' in [label['name'] for label in self.labels]
class StockDiscussionThread:
    def __init__(self, thread_id, title):
        self.thread_id = thread_id
        self.title = title
        self.signals = []

    def add_signal(self, signal):
        self.signals.append(signal)
        self.process_signal(signal)

    def process_signal(self, signal):
        if signal['type'] == 'OPEN_BOUNTY':
            self.handle_open_bounty(signal)
        elif signal['type'] == 'SIGNAL':
            self.handle_signal(signal)
        else:
            print(f"Unknown signal type: {signal['type']}")

    def handle_open_bounty(self, signal):
        print(f"Handling OPEN_BOUNTY for thread {self.thread_id}: {signal}")
        # Add your specific logic for handling OPEN_BOUNTY here

    def handle_signal(self, signal):
        print(f"Handling SIGNAL for thread {self.thread_id}: {signal}")
        # Add your specific logic for handling SIGNAL here

# Example usage
if __name__ == "__main__":
    # Create a new stock discussion thread
    thread = StockDiscussionThread(1523325, "Daily Stock Discussion ~Stacker_Stocks")

    # Add a new signal to the thread
    new_signal = {
        'type': 'OPEN_BOUNTY',
        'data': {
            'thread_id': 1523325,
            'title': 'Daily Stock Discussion ~Stacker_Stocks',
            'other_data':'some additional data'
        }
    }
    thread.add_signal(new_signal)

    # Add another signal to the thread
    another_signal = {
        'type': 'SIGNAL',
        'data': {
            'thread_id': 1523325,
            'title': 'Daily Stock Discussion ~Stacker_Stocks',
            'other_data':'some additional data'
        }
    }
    thread.add_signal(another_signal)
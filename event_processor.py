class EventProcessor:
    def __init__(self):
        self.event_handlers = {
            'OPEN_BOUNTY': self.handle_open_bounty,
            'SELF_POST_OPP': self.handle_self_post_opp,
        }

    def process_event(self, event_data):
        event_type = event_data.get('event_type')
        if event_type in self.event_handlers:
            handler = self.event_handlers[event_type]
            handler(event_data)
        else:
            print(f"Unknown event type: {event_type}")

    def handle_open_bounty(self, event_data):
        bounty_id = event_data.get('bounty_id')
        user = event_data.get('user')
        amount = event_data.get('amount')
        print(f"Handling OPEN_BOUNTY for user {user} with bounty ID {bounty_id} and amount {amount}")
        # Add your specific logic for handling OPEN_BOUNTY here

    def handle_self_post_opp(self, event_data):
        post_id = event_data.get('post_id')
        user = event_data.get('user')
        print(f"Handling SELF_POST_OPP for user {user} with post ID {post_id}")
        # Add your specific logic for handling SELF_POST_OPP here

# Example usage
if __name__ == "__main__":
    processor = EventProcessor()
    
    # Simulated event data
    event1 = {
        'event_type': 'OPEN_BOUNTY',
        'bounty_id': 1515426,
        'user': 'Stacker_Sports',
        'amount': 2100,
    }
    
    event2 = {
        'event_type': 'SELF_POST_OPP',
        'post_id': 1515489,
        'user': 'Stacker_Sports',
    }
    
    processor.process_event(event1)
    processor.process_event(event2)
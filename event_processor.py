def process_event(data):
    # Split the incoming data into its components
    parts = data.strip().split('\t')
    
    # Check if the data has enough parts to be valid
    if len(parts) < 10:
        print('Invalid data format')
        return
    
    # Extract relevant fields
    event_id = parts[0]
    source = parts[1]
    event_type = parts[9]  # Assuming the event type is in the 10th column
    
    # Check if the event type is 'SN OPEN_BOUNTY'
    if event_type == 'OPEN_BOUNTY':
        # Handle the 'SN OPEN_BOUNTY' event
        handle_open_bounty(event_id, source, parts)
    else:
        # Handle other types of events or log them
        print(f'Event {event_id} from {source} is not an OPEN_BOUNTY event: {event_type}')

def handle_open_bounty(event_id, source, data_parts):
    # Implement the specific logic for handling the 'SN OPEN_BOUNTY' event
    print(f'Handling OPEN_BOUNTY event: ID={event_id}, Source={source}')
    # Add your specific handling logic here
    # For example, you might want to store this event in a database, send a notification, etc.
    # Example: Store the event in a list or database
    open_bounties.append(data_parts)

# Example usage
open_bounties = []  # A list to store the open bounties

# Incoming data
incoming_data = '1523325\tStacker_Stocks\t2\t1545\t10000\t19\t27.4\t9274\t24741\trecent@Stacker_Stocks\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tDaily Stock Discussion ~Stacker_Stocks'

# Process the incoming data
process_event(incoming_data)

# Print the collected open bounties
print('Collected Open Bounties:')
for bounty in open_bounties:
    print(bounty)
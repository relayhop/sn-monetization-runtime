def process_data(data):
    """Process incoming data to detect and handle "SN OPEN_BOUNTY" events.

    :param data: A string containing the incoming data.
    :return: None
    """
    # Split the incoming data into lines
    lines = data.strip().split('\n')

    for line in lines:
        # Split each line into fields
        fields = line.split('\t')
        
        # Check if the line has enough fields to be valid
        if len(fields) < 10:
            print("Invalid data format: ", line)
            continue

        # Extract the relevant fields
        event_types = fields[8].split(',')
        event_description = fields[9]

        # Check if the "SN OPEN_BOUNTY" event is present
        if 'OPEN_BOUNTY' in event_types:
            # Handle the "SN OPEN_BOUNTY" event
            handle_open_bounty_event(fields)

def handle_open_bounty_event(event_data):
    """Handle the "SN OPEN_BOUNTY" event.

    :param event_data: A list of fields from the event.
    :return: None
    """
    # Extract relevant information
    event_id = event_data[0]
    event_source = event_data[1]
    bounty_amount = event_data[4]
    event_tags = event_data[8]
    event_description = event_data[9]

    # Print or log the event details (or perform other actions as needed)
    print(f"Detected SN OPEN_BOUNTY Event:")
    print(f"Event ID: {event_id}")
    print(f"Event Source: {event_source}")
    print(f"Bounty Amount: {bounty_amount}")
    print(f"Event Tags: {event_tags}")
    print(f"Event Description: {event_description}")

# Example usage
data = """
1523325\tStacker_Stocks\t2\t1509\t10000\t9\t12.6\t9274\t24709\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tDaily Stock Discussion ~Stacker_Stocks
"""
process_data(data)
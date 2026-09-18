def process_event(data):
    # Split the incoming data into fields
    fields = data.split('\t')
    
    # Extract the relevant fields
    event_id = fields[0]
    source = fields[1]
    event_type = fields[-2].split(',')
    
    # Check if "OPEN_BOUNTY" is in the event types
    if 'OPEN_BOUNTY' in event_type:
        # Handle the OPEN_BOUNTY event
        print(f"Handling OPEN_BOUNTY event with ID: {event_id} from source: {source}")
        # Add your specific handling logic here
    else:
        # Handle other events or log them
        print(f"Event ID: {event_id} from source: {source} is not an OPEN_BOUNTY event")

# Example usage
data = "1523325\tStacker_Stocks\t2\t1545\t10000\t20\t32.2\t9274\t24751\trecent@Stacker_Stocks\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tDaily Stock Discussion ~Stacker_Stocks"
process_event(data)
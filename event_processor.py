def process_event(data):
    # Split the incoming data into parts
    parts = data.split('\t')
    
    # Extract the relevant fields
    event_id = parts[0]
    company = parts[1]
    event_type = parts[-1]  # Assuming the event type is the last field
    
    # Split the event types into a list
    event_types = [event.strip() for event in event_type.split(',')]
    
    # Check if "OPEN_BOUNTY" is in the event types
    if 'OPEN_BOUNTY' in event_types:
        # Handle the OPEN_BOUNTY event
        bounty_amount = int(parts[4])  # Assuming the bounty amount is in the 5th field (index 4)
        print(f"Open Bounty detected: Event ID: {event_id}, Company: {company}, Bounty Amount: {bounty_amount}")
        
        # Add any additional logic to handle the OPEN_BOUNTY event here
        # For example, you might want to log this event, send a notification, etc.
    
    else:
        # Handle other events or do nothing
        print(f"Event ID: {event_id}, Company: {company}, Event Types: {event_types}")

# Example usage
data = "1513799\tStacker_Sports\t3\t686\t10000\t5\t33.6\t88718\t44713\trecent@Stacker_Sports\tOPEN_BOUNTY,LOW_COMP,SELF_POST_OPP\tThe Winner of the 2027 NBA Prediction Contest is..."
process_event(data)
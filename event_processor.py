import gc

def process_data(data):
    # Split the incoming data into lines
    lines = data.split('\n')
    
    for line in lines:
        # Skip empty lines
        if not line.strip():
            continue
        
        # Split the line into fields
        fields = line.split('\t')
        
        # Check if the last field contains "OPEN_BOUNTY"
        if 'OPEN_BOUNTY' in fields[-1]:
            handle_open_bounty_event(fields)
        else:
            # Process other types of events (if needed)
            process_other_events(fields)

def handle_open_bounty_event(fields):
    # Extract relevant information from the fields
    event_id = fields[0]
    username = fields[1]
    bounty_amount = fields[4]
    tags = fields[-1]
    
    # Print or log the detected "OPEN_BOUNTY" event
    print(f"Detected OPEN_BOUNTY event: ID={{event_id}}, User={{username}}, Bounty Amount={{bounty_amount}}, Tags={{tags}}")
    
    # Add any additional handling logic here
    # For example, you might want to store this event in a database, send a notification, etc.

def process_other_events(fields):
    # Placeholder for processing other types of events
    pass

# Example usage
data = """1523325\tStacker_Stocks\t2\t1545\t10000\t21\t35.6\t9274\t24758\trecent@Stacker_Stocks\tOPEN_BOUNTY,HOT\tDaily Stock Discussion ~Stacker_Stocks\n1523326\tOther_User\t1\t1234\t5000\t10\t20.0\t8000\t20000\trecent@Other_User\tNEW,FEATURED\tSome Other Event"""

process_data(data)

# Call the garbage collector (optional, but can be useful in some cases)
gc.collect()
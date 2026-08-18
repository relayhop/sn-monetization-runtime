def process_event(data):
    # Split the incoming data into fields
    fields = data.split('\t')
    
    # Extract the relevant fields
    event_id = fields[0]
    source = fields[1]
    some_value1 = fields[2]
    some_value2 = fields[3]
    some_value3 = fields[4]
    some_value4 = fields[5]
    some_value5 = fields[6]
    some_value6 = fields[7]
    some_value7 = fields[8]
    user = fields[9]
    events = fields[10].split(',')
    description = fields[11]
    
    # Check if the "OPEN_BOUNTY" event is present
    if "OPEN_BOUNTY" in events:
        # Handle the "OPEN_BOUNTY" event
        print(f"OPEN_BOUNTY event detected: {event_id} from {source}")
        # Add your specific handling logic here
        # For example, you might want to trigger some action or send a notification
    
    # Optionally, you can add handling for other event types as well
    if "HOT" in events:
        print(f"HOT event detected: {event_id} from {source}")
    
    if "SIGNAL" in events:
        print(f"SIGNAL event detected: {event_id} from {source}")

# Example usage
data = "1527788\tStacker_Stocks\t2\t1150\t10000\t24\t10.0\t9274\t25053\ttop@Stacker_Stocks\tOPEN_BOUNTY,HOT,SIGNAL\tDaily Stock Discussion ~Stacker_Stocks (🟥 or 🟩 week?)"
process_event(data)
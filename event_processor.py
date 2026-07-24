def process_event(data):
    # Split the incoming data into fields
    fields = data.split('\t')
    
    # Check if the data has the expected number of fields
    if len(fields) < 10:
        print("Invalid data format")
        return
    
    # Extract the relevant fields
    event_id = fields[0]
    source = fields[1]
    some_int_1 = int(fields[2])
    some_int_2 = int(fields[3])
    some_int_3 = int(fields[4])
    some_int_4 = int(fields[5])
    some_float = float(fields[6])
    some_int_5 = int(fields[7])
    some_int_6 = int(fields[8])
    tags = fields[9]
    event_type = fields[10] if len(fields) > 10 else None
    description = fields[11] if len(fields) > 11 else None
    
    # Check if the event type is "OPEN_BOUNTY"
    if event_type == "OPEN_BOUNTY":
        print(f"OPEN_BOUNTY event detected: {event_id}")
        print(f"Source: {source}")
        print(f"Tags: {tags}")
        print(f"Description: {description}")
        # Add any additional handling for the OPEN_BOUNTY event here
    else:
        print(f"Event type '{event_type}' is not 'OPEN_BOUNTY'")

# Example usage
data = "1526558\tStacker_Sports\t3\t717\t2100\t20\t15.2\t232181\t3840\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,SELF_POST_OPP\tRandom Sports Pick 'em"
process_event(data)
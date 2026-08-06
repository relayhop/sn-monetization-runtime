# This file contains the function to process the 'NEW SN OPEN_BOUNTY detected' event

def process_open_bounty_event(event_data):
    # Split the incoming event data into its components
    parts = event_data.split('\t')
    
    if len(parts) < 10:
        raise ValueError("Invalid event data format")
    
    # Extract the relevant fields
    sn_id = parts[0]
    stacker_name = parts[1]
    some_integer = int(parts[2])
    another_integer = int(parts[3])
    bounty_amount = float(parts[4])
    some_value = float(parts[5])
    another_value = float(parts[6])
    user_id = parts[7]
    post_id = parts[8]
    tags_and_event = parts[9].split(',')
    tags = tags_and_event[:-1]
    event_type = tags_and_event[-1]
    
    # Check if the event is an OPEN_BOUNTY
    if event_type == 'OPEN_BOUNTY':
        print(f"Processing OPEN_BOUNTY event for {stacker_name} (SN ID: {sn_id})")
        print(f"User ID: {user_id}, Post ID: {post_id}")
        print(f"Bounty Amount: {bounty_amount}")
        print(f"Tags: {tags}")
        
        # Add your custom processing logic here
        # For example, you might want to store this information in a database,
        # send a notification, or perform some other action.
        
    else:
        print(f"Event type {event_type} is not supported by this function.")

# Example usage
event_data = "1519033\tStacker_Sports\t3\t728\t2100\t15\t15.5\t232181\t3804\trecent@Stacker_Sports|top@Stacker_Sports,OPEN_BOUNTY,SELF_POST_OPP\tWeekly Random Sports Pick 'em"
process_open_bounty_event(event_data)
def process_data(data):
    # Split the incoming data into parts
    parts = data.split('\t')
    
    # Extract relevant fields
    event_type = parts[-1].split(',')[0]  # The event type is the first part of the last field
    
    if event_type == 'OPEN_BOUNTY':
        # Extract specific fields for the OPEN_BOUNTY event
        id_ = parts[0]
        source = parts[1]
        priority = parts[2]
        amount = parts[3]
        duration = parts[4]
        bounty_status = parts[5]
        bounty_amount = parts[6]
        user_id = parts[7]
        post_id = parts[8]
        user_email = parts[9]
        
        # Process the OPEN_BOUNTY event
        print(f"Processing OPEN_BOUNTY event: ID={id_}, Source={source}, Priority={priority}, Amount={amount}, Duration={duration}, Bounty Status={bounty_status}, Bounty Amount={bounty_amount}, User ID={user_id}, Post ID={post_id}, User Email={user_email}")
        
        # Add your custom logic here to handle the OPEN_BOUNTY event
        # For example, you might want to store this information in a database, send notifications, etc.
        
    else:
        # Handle other types of events or log an unknown event
        print(f"Unknown event type: {event_type}")

# Example usage
data = "1523325\tStacker_Stocks\t2\t1545\t10000\t19\t29.9\t9274\t24746\trecent@Stacker_Stocks\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tDaily Stock Discussion ~Stacker_Stocks"
process_data(data)
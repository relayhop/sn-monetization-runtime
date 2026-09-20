def process_data(data):
    # Split the incoming data into fields
    fields = data.strip().split('\t')
    
    # Extract relevant fields
    event_type = fields[-2]  # Assuming the event type is in the second last field
    
    # Check if the event type is "OPEN_BOUNTY"
    if "OPEN_BOUNTY" in event_type:
        # Extract other relevant information
        id = fields[0]
        name = fields[1]
        quantity = fields[3]
        price = fields[4]
        tags = fields[-3]
        description = fields[-1]
        
        # Perform specific actions for "OPEN_BOUNTY" event
        print(f"Open Bounty Detected: ID={id}, Name={name}, Quantity={quantity}, Price={price}, Tags={tags}, Description={description}")
        
        # Add any additional processing or actions here
        # For example, you might want to log this event, send a notification, etc.
        
    else:
        # Handle other event types if needed
        print("No Open Bounty detected.")

# Example usage
data = "1523325\tStacker_Stocks\t2\t51\t10000\t4\t3.7\t9274\t24694\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,LOW_COMP\tDaily Stock Discussion ~Stacker_Stocks"
process_data(data)
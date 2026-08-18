def process_event(event_data):
    # Split the event data into parts
    parts = event_data.split()
    
    # Check if the event is "SN OPEN_BOUNTY"
    if len(parts) < 10 or parts[9]!= "OPEN_BOUNTY":
        print("Event is not an SN OPEN_BOUNTY event.")
        return
    
    # Extract the specific fields
    event_id = parts[0]
    category = parts[1]
    subcategory_count = int(parts[2])
    some_value = int(parts[3])
    bounty_amount = int(parts[4])
    another_value = int(parts[5])
    some_float = float(parts[6])
    some_integer = int(parts[7])
    some_other_integer = int(parts[8])
    event_type = parts[9]
    additional_info =''.join(parts[10:])
    
    # Process the specific fields and data
    print(f"Processing SN OPEN_BOUNTY event:")
    print(f"Event ID: {event_id}")
    print(f"Category: {category}")
    print(f"Subcategory Count: {subcategory_count}")
    print(f"Some Value: {some_value}")
    print(f"Bounty Amount: {bounty_amount}")
    print(f"Another Value: {another_value}")
    print(f"Some Float: {some_float}")
    print(f"Some Integer: {some_integer}")
    print(f"Some Other Integer: {some_other_integer}")
    print(f"Event Type: {event_type}")
    print(f"Additional Info: {additional_info}")
    
    # Handle the event appropriately (example: log the event, send a notification, etc.)
    # For now, we'll just print a message
    print(f"Handled SN OPEN_BOUNTY event with ID: {event_id} and Bounty Amount: {bounty_amount}")

# Example usage
event_data = "1505292 Memes 2 574 1000 3 5.4 51481 4041 recent@Memes|top@Memes OPEN_BOUNTY,LOW_COMP,SIGNAL Meme Bounty - Thanks to REUTERS"
process_event(event_data)
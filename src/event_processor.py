def process_open_bounty_event(event_data):
    # Split the event data into its components
    parts = event_data.split()
    
    # Extract the relevant fields
    try:
        id_number = parts[0]
        category = parts[1]
        field_2 = parts[2]
        field_3 = parts[3]
        amount = int(parts[4])
        field_5 = parts[5]
        version = float(parts[6])
        field_7 = parts[7]
        field_8 = parts[8]
        tags = parts[9].split(',')
        event_type = parts[10]
        description = ' '.join(parts[11:])
    except (IndexError, ValueError) as e:
        print(f"Error parsing event data: {e}")
        return
    
    # Process the event based on the extracted fields
    if event_type == "OPEN_BOUNTY":
        print(f"Processing OPEN_BOUNTY event for {category} with amount {amount}")
        print(f"Description: {description}")
        print(f"Tags: {tags}")
        
        # Add your specific processing logic here
        # For example, you might want to store this information in a database,
        # send notifications, or trigger other actions.
        
        # Example: Print out the details
        print(f"ID: {id_number}")
        print(f"Category: {category}")
        print(f"Field 2: {field_2}")
        print(f"Field 3: {field_3}")
        print(f"Amount: {amount}")
        print(f"Field 5: {field_5}")
        print(f"Version: {version}")
        print(f"Field 7: {field_7}")
        print(f"Field 8: {field_8}")
        print(f"Event Type: {event_type}")
    else:
        print(f"Unknown event type: {event_type}")

# Example usage
event_data = "1505292 Memes 2 515 1000 1 2.1 51481 4041 recent@Memes|top@Memes OPEN_BOUNTY,LOW_COMP,SIGNAL Meme Bounty - Thanks to REUTERS"
process_open_bounty_event(event_data)
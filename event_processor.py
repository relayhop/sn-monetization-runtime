import re

def process_open_bounty_event(event_data):
    # Define a regular expression pattern to match the event data
    pattern = re.compile(r'(\d+)\s+(\w+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(\d+)\s+(\S+@[\w-]+)\s+(\w+)\s+(.*)')

    # Match the pattern against the event data
    match = pattern.match(event_data)
    
    if not match:
        raise ValueError("Invalid event data format")

    # Extract the fields from the matched groups
    event_id, source, field1, field2, amount, field3, rate, field4, field5, user, event_type, description = match.groups()

    # Validate the event type
    if event_type!= "OPEN_BOUNTY":
        raise ValueError("Event type is not 'OPEN_BOUNTY'")

    # Process the event (example: logging or further processing)
    print(f"Processing OPEN_BOUNTY event:")
    print(f"Event ID: {event_id}")
    print(f"Source: {source}")
    print(f"Field 1: {field1}")
    print(f"Field 2: {field2}")
    print(f"Amount: {amount}")
    print(f"Field 3: {field3}")
    print(f"Rate: {rate}")
    print(f"Field 4: {field4}")
    print(f"Field 5: {field5}")
    print(f"User: {user}")
    print(f"Event Type: {event_type}")
    print(f"Description: {description}")

# Example usage
event_data = "1527788\tStacker_Stocks\t2\t28\t10000\t8\t2.7\t9274\t25040\ttop@Stacker_Stocks\tOPEN_BOUNTY\tDaily Stock Discussion ~Stacker_Stocks (🟥 or 🟩 week?)"
process_open_bounty_event(event_data)
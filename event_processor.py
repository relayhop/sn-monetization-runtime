# This file contains the function to process OPEN_BOUNTY events

def process_event(event_data):
    # Split the event data into components
    parts = event_data.split()
    
    # Check if the last part is 'OPEN_BOUNTY'
    if parts[-1] == 'OPEN_BOUNTY':
        # Extract the specific fields
        event_id = parts[0]
        category = parts[1]
        subcategory = parts[2]
        amount = parts[3]
        duration = parts[4]
        priority = parts[5]
        reward = parts[6]
        bounty_id = parts[7]
        post_id = parts[8]
        tags = parts[9].split('|')
        flags = parts[10].split(',')
        title = ' '.join(parts[11:])
        
        # Process the event data
        print(f"Processing OPEN_BOUNTY event with ID: {event_id}")
        print(f"Category: {category}, Subcategory: {subcategory}")
        print(f"Amount: {amount}, Duration: {duration} days")
        print(f"Priority: {priority}, Reward: {reward}")
        print(f"Bounty ID: {bounty_id}, Post ID: {post_id}")
        print(f"Tags: {tags}")
        print(f"Flags: {flags}")
        print(f"Title: {title}")
        
        # Perform any necessary actions based on the event data
        # For example, you might want to store this information in a database,
        # send notifications, or trigger other processes.
        
        # Placeholder for further processing
        handle_open_bounty(event_id, category, subcategory, amount, duration, priority, reward, bounty_id, post_id, tags, flags, title)
    else:
        print("This is not an OPEN_BOUNTY event.")

def handle_open_bounty(event_id, category, subcategory, amount, duration, priority, reward, bounty_id, post_id, tags, flags, title):
    # Example of handling the open bounty event
    # This could involve storing the data, sending notifications, etc.
    print(f"Handling OPEN_BOUNTY event with ID: {event_id}")
    # Add your custom logic here

# Example usage
event_data = "1505292 Memes 2 595 1000 5 20.3 51481 4042 recent@Memes|top@Memes OPEN_BOUNTY,LOW_COMP,SELF_POST_OPP Meme Bounty - Thanks to REUTERS"
process_event(event_data)
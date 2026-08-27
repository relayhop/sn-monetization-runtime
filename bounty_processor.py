def process_bounty_event(data):
    # Split the input data into parts
    parts = data.split()
    
    # Extract the relevant information
    bounty_id = parts[0]
    category = parts[1]
    num_submissions = int(parts[2])
    num_votes = int(parts[3])
    reward_amount = int(parts[4])
    num_winners = int(parts[5])
    bounty_duration = float(parts[6])
    start_time = int(parts[7])
    end_time = int(parts[8])
    tags = parts[9].split('|')
    events = parts[10].split(',')
    description =''.join(parts[11:])
    
    # Check if the "OPEN_BOUNTY" event is present
    if "OPEN_BOUNTY" in events:
        print(f"Open Bounty Detected: {description}")
        print(f"Bounty ID: {bounty_id}")
        print(f"Category: {category}")
        print(f"Number of Submissions: {num_submissions}")
        print(f"Number of Votes: {num_votes}")
        print(f"Reward Amount: {reward_amount}")
        print(f"Number of Winners: {num_winners}")
        print(f"Bounty Duration: {bounty_duration} days")
        print(f"Start Time: {start_time}")
        print(f"End Time: {end_time}")
        print(f"Tags: {tags}")
        print(f"Events: {events}")
        print(f"Description: {description}")
        
        # Perform specific actions based on the detected event
        # For example, you might want to log the event, notify users, or update a database
        # Here, we'll just simulate some actions
        log_event(bounty_id, category, description)
        notify_users(bounty_id, category, description)
        update_database(bounty_id, category, num_submissions, num_votes, reward_amount, num_winners, bounty_duration, start_time, end_time, tags, events, description)

def log_event(bounty_id, category, description):
    print(f"Logging event: Bounty ID: {bounty_id}, Category: {category}, Description: {description}")

def notify_users(bounty_id, category, description):
    print(f"Notifying users: New Bounty Opened - ID: {bounty_id}, Category: {category}, Description: {description}")

def update_database(bounty_id, category, num_submissions, num_votes, reward_amount, num_winners, bounty_duration, start_time, end_time, tags, events, description):
    print(f"Updating database with new bounty: ID: {bounty_id}, Category: {category}, Num Submissions: {num_submissions}, Num Votes: {num_votes}, Reward Amount: {reward_amount}, Num Winners: {num_winners}, Duration: {bounty_duration}, Start Time: {start_time}, End Time: {end_time}, Tags: {tags}, Events: {events}, Description: {description}")

# Example usage
data = "1505292 Memes 2 595 1000 3 14.6 51481 4041 recent@Memes|top@Memes OPEN_BOUNTY,LOW_COMP Meme Bounty - Thanks to REUTERS"
process_bounty_event(data)
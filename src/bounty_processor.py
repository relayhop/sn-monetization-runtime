def process_bounty_data(data):
    # Split the data into parts
    parts = data.split()
    
    # Extract relevant information
    bounty_id = parts[0]
    category = parts[1]
    num_submissions = int(parts[2])
    total_rewards = int(parts[3])
    reward_per_submission = int(parts[4])
    num_winners = int(parts[5])
    win_probability = float(parts[6])
    total_participants = int(parts[7])
    active_participants = int(parts[8])
    tags = parts[9].split('|')
    signals = parts[10].split(',')
    bounty_description =''.join(parts[11:])
    
    # Check for the "OPEN_BOUNTY" signal
    if "OPEN_BOUNTY" in signals:
        # Handle the "OPEN_BOUNTY" event
        print(f"Open Bounty Detected: {bounty_description}")
        print(f"Bounty ID: {bounty_id}")
        print(f"Category: {category}")
        print(f"Number of Submissions: {num_submissions}")
        print(f"Total Rewards: {total_rewards}")
        print(f"Reward per Submission: {reward_per_submission}")
        print(f"Number of Winners: {num_winners}")
        print(f"Win Probability: {win_probability}")
        print(f"Total Participants: {total_participants}")
        print(f"Active Participants: {active_participants}")
        print(f"Tags: {tags}")
        print(f"Signals: {signals}")
        
        # Additional logic to handle the bounty can be added here
        # For example, you might want to notify users, update a database, etc.

# Example usage
data = "1505292 Memes 2 595 1000 3 9.6 51481 4041 recent@Memes|top@Memes OPEN_BOUNTY,LOW_COMP,SIGNAL Meme Bounty - Thanks to REUTERS"
process_bounty_data(data)
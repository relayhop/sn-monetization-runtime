def process_bounty_data(data):
    # Split the incoming data into components
    parts = data.split('\t')
    
    if len(parts) < 10:
        raise ValueError("Invalid data format. Expected at least 10 tab-separated values.")
    
    # Extract the relevant fields
    bounty_id = parts[0]
    source = parts[1]
    type_ = parts[2]
    user_id = parts[3]
    amount = parts[4]
    duration = parts[5]
    score = parts[6]
    post_id = parts[7]
    comment_id = parts[8]
    tags = parts[9].split(',')
    title = parts[10] if len(parts) > 10 else None
    
    # Check for the OPEN_BOUNTY tag
    if 'OPEN_BOUNTY' in tags:
        handle_open_bounty(bounty_id, source, type_, user_id, amount, duration, score, post_id, comment_id, tags, title)
    else:
        handle_other_bounty(bounty_id, source, type_, user_id, amount, duration, score, post_id, comment_id, tags, title)

def handle_open_bounty(bounty_id, source, type_, user_id, amount, duration, score, post_id, comment_id, tags, title):
    print(f"Handling OPEN_BOUNTY: {bounty_id}")
    # Add your custom logic here to handle the OPEN_BOUNTY
    # For example, you might want to log it, notify users, or perform some other action

def handle_other_bounty(bounty_id, source, type_, user_id, amount, duration, score, post_id, comment_id, tags, title):
    print(f"Handling other bounty: {bounty_id}")
    # Add your custom logic here to handle other types of bounties

# Example usage
data = "1523325\tStacker_Stocks\t2\t1545\t10000\t15\t20.1\t9274\t24716\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tDaily Stock Discussion ~Stacker_Stocks"
process_bounty_data(data)
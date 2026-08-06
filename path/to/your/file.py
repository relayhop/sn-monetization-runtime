def handle_open_bounty(data):
    # Split the data by tab character
    parts = data.split('\t')
    
    # Extract the relevant fields
    bounty_id = parts[0]
    project = parts[1]
    amount = parts[8]  # Assuming the amount is in the 9th column (index 8)
    description = parts[-1]  # The last part is the description
    
    # Check if the signal is "OPEN_BOUNTY"
    signals = parts[-2].split(',')
    if 'OPEN_BOUNTY' in signals:
        # Handle the OPEN_BOUNTY signal
        print(f"New SN OPEN_BOUNTY detected:")
        print(f"Bounty ID: {bounty_id}")
        print(f"Project: {project}")
        print(f"Amount: {amount} sats")
        print(f"Description: {description}")
        
        # Additional handling can be added here, e.g., logging, database insertion, etc.
    else:
        print("No OPEN_BOUNTY signal detected.")

# Example usage
data = "1516588\tbitcoin\t1\t955\t1000\t1\t1.1\t74100\t10866\trecent@bitcoin|top@bitcoin\tOPEN_BOUNTY,LOW_COMP,FRESH,SIGNAL\t1000 sats for evidence of Taproot opposition in 2021"
handle_open_bounty(data)
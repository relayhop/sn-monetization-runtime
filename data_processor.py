def process_data(data):
    # Define a list to hold the processed results
    processed_results = []

    # Iterate over each line in the data
    for line in data:
        # Split the line into its components
        parts = line.strip().split('\t')
        
        # Extract relevant fields
        id_ = parts[0]
        source = parts[1]
        signal_types = parts[-1].split(',')
        
        # Check if the "OPEN_BOUNTY" signal is present
        if 'OPEN_BOUNTY' in signal_types:
            # Process the "OPEN_BOUNTY" signal
            open_bounty_data = {
                'id': id_,
                'source': source,
                'signal_types': signal_types,
                'additional_info': parts[2:-1]  # Additional information from the line
            }
            
            # Add the processed data to the results list
            processed_results.append(open_bounty_data)
    
    # Return the processed results
    return processed_results

# Example usage
data = [
    "1523325\tStacker_Stocks\t2\t1509\t10000\t9\t9.6\t9274\t24707\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,HOT,SIGNAL,SELF_POST_OPP\tDaily Stock Discussion ~Stacker_Stocks",
    "1523326\tOther_Source\t1\t1234\t5000\t5\t5.5\t8000\t20000\tother@Source\tHOT,SIGNAL\tOther Discussion"
]

processed_data = process_data(data)

# Print the processed data
for result in processed_data:
    print(result)
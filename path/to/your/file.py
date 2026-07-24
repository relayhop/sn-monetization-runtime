def process_data(data):
    # Define the structure of the data
    data_structure = {
        'id': None,
       'source': None,
        'type': None,
        'value1': None,
        'value2': None,
        'value3': None,
        'value4': None,
        'value5': None,
        'value6': None,
        'tags': None,
        'flags': None,
        'description': None
    }

    # Split the incoming data into parts
    parts = data.split('\t')

    # Map the parts to the data structure
    data_structure['id'] = parts[0]
    data_structure['source'] = parts[1]
    data_structure['type'] = parts[2]
    data_structure['value1'] = parts[3]
    data_structure['value2'] = parts[4]
    data_structure['value3'] = parts[5]
    data_structure['value4'] = parts[6]
    data_structure['value5'] = parts[7]
    data_structure['value6'] = parts[8]
    data_structure['tags'] = parts[9]
    data_structure['flags'] = parts[10]
    data_structure['description'] = parts[11]

    # Check if the "OPEN_BOUNTY" flag is present
    if 'OPEN_BOUNTY' in data_structure['flags']:
        handle_open_bounty(data_structure)
    else:
        print("No OPEN_BOUNTY detected.")

def handle_open_bounty(data):
    print(f"Handling OPEN_BOUNTY for {{data['source']}} with ID: {{data['id']}}")
    # Add your specific handling logic here
    # For example, you might want to log this event, send a notification, or update a database

# Example usage
incoming_data = "1523325\tStacker_Stocks\t2\t1545\t10000\t19\t22.3\t9274\t24717\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tDaily Stock Discussion ~Stacker_Stocks"
process_data(incoming_data)
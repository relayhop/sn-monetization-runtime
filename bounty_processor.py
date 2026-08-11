import re
from datetime import datetime

def parse_input_line(line):
    # Split the line into components, assuming it's tab-separated or space-separated
    parts = line.strip().split()
    if len(parts) < 10:
        raise ValueError("Input line does not contain enough fields")
    
    # Extract relevant fields
    timestamp = int(parts[0])
    tags = parts[8].split(',')
    bounty_description =''.join(parts[9:])
    
    return timestamp, tags, bounty_description

def detect_taproot_opposition(bounty_description):
    # Define a more flexible regular expression to match variations of the bounty description
    bounty_pattern = re.compile(r'\b\d+\s+sats\s+for\s+evidence\s+of\s+Taproot\s+opposition\s+in\s+\d{4}\b', re.IGNORECASE)
    
    # Check if the bounty description matches the pattern
    if bounty_pattern.search(bounty_description):
        # Extract the year from the bounty description
        year_match = re.search(r'(\d{4})', bounty_description)
        if year_match:
            year = int(year_match.group(0))
            # Check if the year is 2021
            if year == 2021:
                return True
    return False

def process_bounty_line(line):
    try:
        timestamp, tags, bounty_description = parse_input_line(line)
        
        # Convert timestamp to a readable date (optional, for debugging)
        readable_date = datetime.utcfromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
        
        # Detect Taproot opposition
        if 'OPEN_BOUNTY' in tags and detect_taproot_opposition(bounty_description):
            print(f"Detected Taproot opposition in 2021: {bounty_description} (Timestamp: {readable_date})")
        else:
            print("No Taproot opposition detected.")
    except Exception as e:
        print(f"Error processing line: {e}")

# Example usage
input_line = "1516588\tbitcoin\t1\t955\t1000\t1\t1.6\t74100\t10866\trecent@bitcoin|top@bitcoin\tOPEN_BOUNTY,LOW_COMP,FRESH,SIGNAL\t1000 sats for evidence of Taproot opposition in 2021"
process_bounty_line(input_line)
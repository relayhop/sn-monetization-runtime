import sys
import json

def parse_sn_bounty_line(line):
    """
    Parses a tab-separated line representing an SN Open Bounty detection.
    Handles specific edge cases like the pipe delimiter in column 9.
    """
    raw = line.strip()
    if not raw:
        return None

    # Split by tab to preserve the pipe '|' in the tags column
    tokens = raw.split('\t')

    # Validate we have the expected minimum columns
    if len(tokens) < 11:
        return None

    # Map the specific columns observed in the issue
    return {
        "id": tokens[0],
        "source": tokens[1],
        "col_2": tokens[2],
        "score": tokens[3],
        "limit": tokens[4],
        "count": tokens[5],
        "ratio": tokens[6],
        "timestamp": tokens[7],
        "age": tokens[8],
        "tags": tokens[9], # Contains pipe '|' e.g., recent@AskSN|top@AskSN
        "state": tokens[10], # Contains comma e.g., OPEN_BOUNTY,SELF_POST_OPP
        "logic": tokens[11] if len(tokens) > 11 else "UNKNOWN"
    }

def format_output(line):
    parsed = parse_sn_bounty_line(line)
    if parsed:
        # Normalize state by taking the first part before the comma
        parsed["state_clean"] = parsed["state"].split(",")[0]
        parsed["tags_clean"] = parsed["tags"] # Already parsed, but keep for context
        
        # Return a structured dictionary suitable for CI/CD consumption
        yield parsed

class SNOpenBountyDetector:
    """
    A robust detector class for processing streams of AskSN bounty data.
    """
    def __init__(self):
        pass

    def detect(self, stream=None):
        if stream is None:
            stream = sys.stdin
        else:
            stream = iter(stream)

        for line in stream:
            parsed = parse_sn_bounty_line(line)
            if parsed:
                print(json.dumps(parsed))
            else:
                # If the parser couldn't handle it, print raw or skip
                # Keeping it strict to the "Bounty" logic implies yielding parsed objects
                pass

def main():
    detector = SNOpenBountyDetector()
    # Iterate over the specific data from the issue context
    # If piped, sys.stdin handles it; if running locally, pass a string
    if hasattr(sys, 'stdin') and not hasattr(sys, 'argv') or len(sys.argv) == 1:
        for item in detector.detect():
            print(json.dumps(item))
    else:
        # Handle local file run fallback
        for item in detector.detect():
            print(json.dumps(item))

if __name__ == "__main__":
    main()
import re
from typing import List, Optional

class BountyDetector:
    """
    Parses log lines to detect open bounties based on specific criteria.
    """
    def __init__(self, required_labels: Optional[List[str]] = None):
        self.required_labels = required_labels or ["OPEN_BOUNTY", "SELF_POST_OPP"]

    def is_open_bounty_line(self, line: str) -> bool:
        """
        Determines if a log line represents an open bounty by checking for required labels.
        """
        if not isinstance(line, str):
            raise TypeError("Input must be a string")
        if not line.strip():
            return False

        try:
            # Extract the labels field - it's the second-to-last field before the title
            parts = line.strip().split("\t")
            if len(parts) < 11:
                return False

            labels_str = parts[10]
            labels = [label.strip() for label in labels_str.split(",") if label.strip()]

            return all(required_label in labels for required_label in self.required_labels)

        except (IndexError, AttributeError) as e:
            # Fail fast on unexpected data structure
            raise ValueError(f"Failed to parse bounty line: {line}") from e
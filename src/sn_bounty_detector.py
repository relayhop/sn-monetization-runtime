import re
from typing import Dict, Optional, Tuple

class SNBountyDetector:
    """
    Parses SN log lines to detect OPEN_BOUNTY entries and extract relevant metadata.
    """
    # Regex pattern based on the tab-separated log format:
    # id,sub,rep,awarded_rep,amount,comments,views,created,author,labels,title
    LOG_LINE_PATTERN = re.compile(
        r'^(\d+)\t([^\t]+)\t(\d+)\t(\d+)\t(\d+)\t(\d+)\t([\d.]+)\t(\d+)\t([^\t]+)\t([^\t]*)\t([^\t]+)$'
    )

    @staticmethod
    def parse_log_line(line: str) -> Optional[Dict[str, str]]:
        """
        Parse a single SN log line and return structured data if it matches expected format.
        Returns None if the line is malformed or doesn't match.
        """
        if not line or not line.strip():
            return None

        line = line.strip()
        match = SNBountyDetector.LOG_LINE_PATTERN.match(line)
        if not match:
            return None

        return {
            'id': match.group(1),
            'sub': match.group(2),
            'rep': match.group(3),
            'awarded_rep': match.group(4),
            'amount': match.group(5),
            'comments': match.group(6),
            'views': match.group(7),
            'created': match.group(8),
            'author': match.group(9),
            'labels': match.group(10),
            'title': match.group(11)
        }

    @staticmethod
    def is_open_bounty(entry: Dict[str, str]) -> bool:
        """
        Determine if the given SN entry is an open bounty.
        An entry is considered an open bounty if:
        - It has 'OPEN_BOUNTY' in the labels field
        """
        if not entry or 'labels' not in entry:
            return False

        labels = entry['labels']
        return 'OPEN_BOUNTY' in labels

    @staticmethod
    def extract_bounty_data(line: str) -> Optional[Dict[str, str]]:
        """
        Fully parse a log line and return bounty-relevant data if it's an open bounty.
        Returns None if not an open bounty or invalid format.
        """
        parsed = SNBountyDetector.parse_log_line(line)
        if not parsed:
            return None

        if not SNBountyDetector.is_open_bounty(parsed):
            return None

        return {
            'id': parsed['id'],
            'sub': parsed['sub'],
            'amount': parsed['amount'],
            'author': parsed['author'],
            'title': parsed['title'],
            'labels': parsed['labels']
        }
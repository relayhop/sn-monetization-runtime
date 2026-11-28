2. Code Patch / Fix

We need to add a **source validation layer** and a **confidence score threshold** to the bounty detector.

**File:** `src/detector/bounty_scanner.py` (assumed path based on repo name)

```python
import re
from typing import Optional, Dict, Any
from .models import BountyCandidate

# Whitelist of trusted domains for bounty detection
TRUSTED_BOUNTY_DOMAINS = {
    "github.com",
    "gitlab.com",
    "bountysource.com",
    "gitcoin.co",
    "dework.xyz"
}

# Minimum confidence score required to flag a bounty
MIN_CONFIDENCE_SCORE = 0.85

class BountyScanner:
    def __init__(self):
        self.bounty_pattern = re.compile(r'(bounty|reward|prize).*?(\d+\.?\d*)\s*(USD|Sats|BTC)', re.IGNORECASE)
    
    def scan(self, content: str, source_url: str, metadata: Dict[str, Any]) -> Optional[BountyCandidate]:
        """
        Scans content for bounty signals.
        Returns None if source is untrusted or confidence is low.
        """
        # 1. Source Validation
        if not self._is_trusted_source(source_url):
            return None
        
        # 2. Content Matching
        match = self.bounty_pattern.search(content)
        if not match:
            return None
        
        # 3. Confidence Scoring
        confidence = self._calculate_confidence(content, source_url, metadata)
        if confidence < MIN_CONFIDENCE_SCORE:
            return None
        
        # 4. Parse Reward
        reward_amount = float(match.group(2))
        currency = match.group(3).upper()
        
        # Convert Sats to USD if necessary (using current rate)
        if currency == "SATS":
            usd_value = self._sats_to_usd(reward_amount)
        else
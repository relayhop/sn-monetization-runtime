2. Code Patch / Fix
We need to add a filter to exclude `SELF_POST_OPP` signals from being classified as `OPEN_BOUNTY` unless the poster is a verified platform admin. Additionally, we should add a heuristic to ignore posts that are clearly community contests (e.g., containing "Contest", "Win up to", "Sats" without a direct USD payment link).

**File: `src/radar/detector.rs`**

```rust
use crate::models::{SignalType, Post, User};

impl BountyDetector {
    pub fn detect_bounty(&self, post: &Post, author: &User) -> Option<BountyCandidate> {
        // ... existing logic ...

        // NEW: Filter out self-posted opportunities unless author is a platform admin
        if post.signals.contains(&SignalType::SelfPostOpp) {
            if !author.is_platform_admin() {
                return None; // Do not treat as an open bounty
            }
        }

        // NEW: Heuristic to ignore community contests
        if self.is_community_contest(post) {
            return None;
        }

        // ... rest of detection logic ...
    }

    fn is_community_contest(&self, post: &Post) -> bool {
        let content = post.content.to_lowercase();
        let contest_keywords = ["contest", "win up to", "sats", "weekly close"];
        let has_contest_keywords = contest_keywords.iter().any(|kw| content.contains(kw));
        
        // If it looks like a contest and doesn't have a direct USD bounty link, ignore it
        has_contest_keywords && !post.has_direct_usd_payment_link()
    }
}
```

**File: `src/models/post.rs`** (Add helper if not present)

```rust
impl Post {
    pub fn has_direct_usd_payment_link(&self) -> bool {
        // Check for explicit USD bounty markers, e.g., "bounty: $2026" or a link to a payment portal
        self.content.contains("b
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bounty {
    pub id: u64,
    pub title: String,
    pub user_id: u64,
    pub sats: u64,
    pub bounty: u64,
    pub comments: u32,
    pub boost: f64,
    pub tips: u64,
    pub upvotes: u64,
    pub sub: String,
    pub tags: String,
    pub description: String,
    pub detected_at: DateTime<Utc>,
}

impl Bounty {
    pub fn has_tag(&self, tag: &str) -> bool {
        self.tags.split(',').any(|t| t.trim() == tag)
    }

    pub fn is_open_bounty(&self) -> bool {
        self.has_tag("OPEN_BOUNTY")
    }
}

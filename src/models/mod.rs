use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bounty {
    pub id: u64,
    pub title: String,
    pub author: String,
    pub bounty_amount: u64,
    pub upvotes: u64,
    pub comments: u64,
    pub detected_at: DateTime<Utc>,
}

impl Bounty {
    pub fn new(
        id: u64,
        title: String,
        author: String,
        bounty_amount: u64,
        upvotes: u64,
        comments: u64,
    ) -> Self {
        Self {
            id,
            title,
            author,
            bounty_amount,
            upvotes,
            comments,
            detected_at: Utc::now(),
        }
    }
}

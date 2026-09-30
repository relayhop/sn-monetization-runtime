use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DetectionType {
    OpenBounty,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
    pub id: u64,
    pub detection_type: DetectionType,
    pub territory: String,
    pub bounty_sats: Option<u64>,
    pub title: String,
    pub detected_at: DateTime<Utc>,
}

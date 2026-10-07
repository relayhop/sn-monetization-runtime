use anyhow::Result;
use log::{info, warn};
use crate::scanner::BountyEntry;

pub struct Notifier;

impl Notifier {
    pub fn new() -> Self {
        Self
    }

    pub fn notify_new_bounty(&self, bounty: &BountyEntry) {
        info!(
            "[radar] SN OPEN_BOUNTY detected:\n{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}",
            bounty.id,
            bounty.issuer,
            bounty.difficulty,
            bounty.max_spent,
            bounty.award,
            bounty.deadline_days,
            bounty.time_left,
            bounty.current_spent,
            bounty.total_spent,
            bounty.recent_at,
            bounty.status,
            bounty.title,
        );
    }

    pub async fn send_notification(&self, bounty: &BountyEntry) -> Result<()> {
        self.notify_new_bounty(bounty);
        Ok(())
    }
}

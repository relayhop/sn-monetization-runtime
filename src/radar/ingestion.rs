// src/radar/ingestion.rs

pub struct BountyIngestionPipeline;

impl BountyIngestionPipeline {
    pub fn process_signal(&self, record: &SignalRecord) -> Result<PriorityQueueStatus, IngestionError> {
        if record.tags.contains(&Tag::OpenBounty) && record.score >= 1000 {
            Ok(PriorityQueueStatus::ActiveHighPriority {
                bounty_id: record.id,
                channel: record.channel.clone(),
                self_post_opp: record.tags.contains(&Tag::SelfPostOpp),
            })
        } else {
            Ok(PriorityQueueStatus::Standard)
        }
    }
}
use std::collections::HashSet;

#[derive(Default)]
pub struct RewardTracker {
    seen_ids: HashSet<u64>,
}

impl RewardTracker {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_seen_reward(&mut self, id: u64, _award: u64) {
        self.seen_ids.insert(id);
    }

    pub fn get_all_ids(&self) -> &HashSet<u64> {
        &self.seen_ids
    }
}

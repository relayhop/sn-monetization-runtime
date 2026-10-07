use anyhow::{Result, Context};
use reqwest::Client;
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::config::Config;
use crate::reward_tracker::RewardTracker;

#[derive(Debug, Deserialize, Clone)]
pub struct BountyEntry {
    pub id: u64,
    pub issuer: String,
    pub difficulty: u32,
    pub max_spent: u64,
    pub award: u64,
    pub deadline_days: u64,
    pub time_left: f64,
    pub current_spent: u64,
    pub total_spent: u64,
    pub recent_at: String,
    pub status: String,
    pub title: String,
}

#[derive(Debug, Clone)]
pub struct Scanner {
    client: Client,
    config: Arc<Config>,
    tracker: Arc<Mutex<RewardTracker>>,
}

impl Scanner {
    pub fn new(config: Arc<Config>, tracker: Arc<Mutex<RewardTracker>>) -> Self {
        Self {
            client: Client::new(),
            config,
            tracker,
        }
    }

    pub async fn scan_open_bounties(&self) -> Result<Vec<BountyEntry>> {
        let url = format!(
            "{}/api/v1/bounties?status=OPEN_BOUNTY&limit=100",
            self.config.sn_api_base_url
        );

        let response = self
            .client
            .get(&url)
            .header("Accept", "application/json")
            .send()
            .await
            .context("Failed to fetch bounties from Stacker News API")?;

        let text = response
            .text()
            .await
            .context("Failed to read bounty response body")?;

        let bounties: Vec<BountyEntry> =
            serde_json::from_str(&text).context("Failed to parse bounty list")?;

        Ok(bounties)
    }

    pub async fn check_new_bounties(&self) -> Result<Vec<BountyEntry>> {
        let existing: Vec<u64> = self.tracker.lock().await.get_all_ids().collect();

        let all = self.scan_open_bounties().await?;
        let mut new_bounties = Vec::new();

        for bounty in &all {
            if !existing.contains(&bounty.id) {
                new_bounties.push(bounty.clone());
            }
        }

        for bounty in &new_bounties {
            self.tracker
                .lock()
                .await
                .add_seen_reward(bounty.id, bounty.award);
        }

        Ok(new_bounties)
    }
}

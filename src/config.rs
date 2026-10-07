use serde::Deserialize;
use std::env;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub sn_api_base_url: String,
    pub check_interval_seconds: u64,
    pub reward_wallet_address: String,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            sn_api_base_url: env::var("SN_API_BASE_URL")
                .unwrap_or_else(|_| "https://stacker.news/api".to_string()),
            check_interval_seconds: env::var("CHECK_INTERVAL_SECONDS")
                .unwrap_or_else(|_| "300".to_string())
                .parse()
                .unwrap_or(300),
            reward_wallet_address: env::var("REWARD_WALLET_ADDRESS")
                .unwrap_or_default(),
        }
    }
}

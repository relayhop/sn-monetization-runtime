use std::sync::Arc;
use tokio::sync::Mutex;
use sn_monetization_runtime::{Scanner, Notifier, Config, RewardTracker};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::init();

    let config = Arc::new(Config::from_env());
    let tracker = Arc::new(Mutex::new(RewardTracker::new()));
    let scanner = Arc::new(Scanner::new(config.clone(), tracker.clone()));
    let notifier = Arc::new(Notifier::new());

    info!("Starting SN monetization runtime scanner...");

    loop {
        let new_bounties = scanner.check_new_bounties().await?;

        for bounty in new_bounties {
            notifier.send_notification(&bounty).await?;
        }

        tokio::time::sleep(std::time::Duration::from_secs(
            config.check_interval_seconds,
        ))
        .await;
    }
}

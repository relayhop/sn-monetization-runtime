use std::sync::Arc;
use tokio::sync::Mutex;

#[cfg(test)]
mod tests {
    use super::*;
    use wiremock::{MockServer, mock, Respond};
    use wiremock::matchers::{method, path_prefix};
    use sn_monetization_runtime::{Scanner, Notifier, Config, RewardTracker};

    #[derive(Clone)]
    struct TestResponder {
        body: String,
    }

    impl Respond for TestResponder {
        fn respond(&self, _request: &wiremock::Request) -> wiremock::ResponseTemplate {
            wiremock::ResponseTemplate::new(200)
                .set_body_string(self.body.clone())
                .insert_header("content-type", "application/json")
        }
    }

    #[tokio::test]
    async fn test_radar_format_output() {
        let mock_bounty_response = serde_json::json!([
            {
                "id": 1582773,
                "issuer": "Stacker_Stocks",
                "difficulty": 2,
                "max_spent": 328,
                "award": 10000,
                "deadline_days": 21,
                "time_left": 26.7,
                "current_spent": 9274,
                "total_spent": 27951,
                "recent_at": "recent@Stacker_Stocks",
                "status": "OPEN_BOUNTY",
                "title": "Daily Stock Discussion Sunday's Weekly Close Contest 🟥 or 🟩? 50k sat award!"
            }
        ]);

        let mock_server = MockServer::start().await;
        mock_server
            .then(TestResponder {
                body: mock_bounty_response.to_string(),
            })
            .mount(&mock_server)
            .await;

        let config = Arc::new(Config {
            sn_api_base_url: mock_server.uri(),
            check_interval_seconds: 1,
            reward_wallet_address: "0x96eE7904BdCd8a82c71B4FFc3362C96b1Aae03e0".to_string(),
        });
        let tracker = Arc::new(Mutex::new(RewardTracker::new()));
        let scanner = Scanner::new(config, tracker.clone());
        let notifier = Notifier::new();

        let bounties = scanner.check_new_bounties().await.unwrap();
        assert_eq!(bounties.len(), 1);

        notifier.notify_new_bounty(&bounties[0]);

        let seen_ids = tracker.lock().await.get_all_ids();
        assert!(seen_ids.contains(&1582773));
    }
}

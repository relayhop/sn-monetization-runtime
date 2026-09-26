use crate::models::Bounty;
use chrono::{DateTime, Utc};

pub struct BountyDetector {
    last_check: DateTime<Utc>,
}

impl BountyDetector {
    pub fn new() -> Self {
        Self {
            last_check: Utc::now(),
        }
    }

    pub fn parse_bounty_line(line: &str) -> Option<Bounty> {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() < 11 {
            return None;
        }

        let id = parts[0].parse().ok()?;
        let title = parts[1].to_string();
        let user_id = parts[2].parse().ok()?;
        let sats = parts[3].parse().ok()?;
        let bounty = parts[4].parse().ok()?;
        let comments = parts[5].parse().ok()?;
        let boost = parts[6].parse().ok()?;
        let tips = parts[7].parse().ok()?;
        let upvotes = parts[8].parse().ok()?;
        let sub = parts[9].to_string();
        let tags = parts[10].to_string();
        let description = parts.get(11).unwrap_or(&"").to_string();

        Some(Bounty {
            id,
            title,
            user_id,
            sats,
            bounty,
            comments,
            boost,
            tips,
            upvotes,
            sub,
            tags,
            description,
            detected_at: Utc::now(),
        })
    }

    pub fn is_open_bounty(bounty: &Bounty) -> bool {
        bounty.tags.contains("OPEN_BOUNTY")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_bounty_line() {
        let line = "1533094\tStacker_Stocks\t2\t1050\t10000\t25\t9.9\t9274\t25443\ttop@Stacker_Stocks\tOPEN_BOUNTY,HOT,SIGNAL\tDaily Stock Discussion: Sunday's Weekly Close Contest 🟥 or 🟩?";
        let bounty = BountyDetector::parse_bounty_line(line).unwrap();

        assert_eq!(bounty.id, 1533094);
        assert_eq!(bounty.title, "Stacker_Stocks");
        assert_eq!(bounty.user_id, 2);
        assert_eq!(bounty.sats, 1050);
        assert_eq!(bounty.bounty, 10000);
        assert_eq!(bounty.comments, 25);
        assert_eq!(bounty.boost, 9.9);
        assert_eq!(bounty.tips, 9274);
        assert_eq!(bounty.upvotes, 25443);
        assert_eq!(bounty.sub, "top@Stacker_Stocks");
        assert_eq!(bounty.tags, "OPEN_BOUNTY,HOT,SIGNAL");
        assert_eq!(bounty.description, "Daily Stock Discussion: Sunday's Weekly Close Contest 🟥 or 🟩?");
    }

    #[test]
    fn test_is_open_bounty() {
        let bounty = Bounty {
            id: 1533094,
            title: "Test".to_string(),
            user_id: 2,
            sats: 1050,
            bounty: 10000,
            comments: 25,
            boost: 9.9,
            tips: 9274,
            upvotes: 25443,
            sub: "top@Stacker_Stocks".to_string(),
            tags: "OPEN_BOUNTY,HOT,SIGNAL".to_string(),
            description: "Test description".to_string(),
            detected_at: Utc::now(),
        };

        assert!(BountyDetector::is_open_bounty(&bounty));
    }

    #[test]
    fn test_is_not_open_bounty() {
        let bounty = Bounty {
            id: 1533094,
            title: "Test".to_string(),
            user_id: 2,
            sats: 1050,
            bounty: 10000,
            comments: 25,
            boost: 9.9,
            tips: 9274,
            upvotes: 25443,
            sub: "top@Stacker_Stocks".to_string(),
            tags: "HOT,SIGNAL".to_string(),
            description: "Test description".to_string(),
            detected_at: Utc::now(),
        };

        assert!(!BountyDetector::is_open_bounty(&bounty));
    }
}

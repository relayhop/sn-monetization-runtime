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

    pub fn detect_open_bounties(&mut self, data: &str) -> Vec<Bounty> {
        let mut bounties = Vec::new();
        
        for line in data.lines() {
            if line.contains("OPEN_BOUNTY") {
                if let Some(bounty) = self.parse_bounty_line(line) {
                    bounties.push(bounty);
                }
            }
        }
        
        self.last_check = Utc::now();
        bounties
    }

    fn parse_bounty_line(&self, line: &str) -> Option<Bounty> {
        let parts: Vec<&str> = line.split('\t').collect();
        
        if parts.len() < 11 {
            return None;
        }

        Some(Bounty {
            id: parts[0].parse().ok()?,
            title: parts[10].split("\t").last().unwrap_or("").to_string(),
            author: parts[1].to_string(),
            bounty_amount: parts[3].parse().ok()?,
            upvotes: parts[5].parse().ok()?,
            comments: parts[7].parse().ok()?,
            detected_at: Utc::now(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_open_bounty() {
        let mut detector = BountyDetector::new();
        let data = "1533094\tStacker_Stocks\t2\t1050\t10000\t21\t5.9\t9274\t25435\ttop@Stacker_Stocks\tOPEN_BOUNTY,HOT,SIGNAL\tDaily Stock Discussion: Sunday's Weekly Close Contest 🟥 or 🟩?";
        
        let bounties = detector.detect_open_bounties(data);
        
        assert_eq!(bounties.len(), 1);
        assert_eq!(bounties[0].id, 1533094);
        assert_eq!(bounties[0].author, "Stacker_Stocks");
        assert_eq!(bounties[0].bounty_amount, 1050);
    }

    #[test]
    fn test_no_bounty_in_data() {
        let mut detector = BountyDetector::new();
        let data = "1533094\tStacker_Stocks\t2\t1050\t10000\t21\t5.9\t9274\t25435\ttop@Stacker_Stocks\tHOT,SIGNAL\tDaily Stock Discussion";
        
        let bounties = detector.detect_open_bounties(data);
        
        assert_eq!(bounties.len(), 0);
    }
}

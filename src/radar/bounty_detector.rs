use chrono::{DateTime, Utc};
use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct BountyRecord {
    pub id: u64,
    pub title: String,
    pub user: String,
    pub sats: u64,
    pub boost: u64,
    pub comments: u32,
    pub score: f64,
    pub upvotes: u64,
    pub total_sats: u64,
    pub tags: Vec<String>,
    pub detected_at: DateTime<Utc>,
}

impl BountyRecord {
    pub fn from_line(line: &str) -> Option<Self> {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() < 11 {
            return None;
        }

        let id = parts[0].parse().ok()?;
        let user = parts[1].to_string();
        let sats = parts[3].parse().ok()?;
        let boost = parts[4].parse().ok()?;
        let comments = parts[5].parse().ok()?;
        let score = parts[6].parse().ok()?;
        let upvotes = parts[7].parse().ok()?;
        let total_sats = parts[8].parse().ok()?;
        let title_parts = parts[9].to_string();
        let tags_str = parts[10];
        let title = parts.get(11).unwrap_or(&"").to_string();

        let tags: Vec<String> = tags_str
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        Some(BountyRecord {
            id,
            title,
            user,
            sats,
            boost,
            comments,
            score,
            upvotes,
            total_sats,
            tags,
            detected_at: Utc::now(),
        })
    }

    pub fn is_open_bounty(&self) -> bool {
        self.tags.iter().any(|tag| tag == "OPEN_BOUNTY")
    }

    pub fn format_issue_title(&self) -> String {
        format!("[radar] SN open bounty {}", self.detected_at.format("%Y-%m-%dT%H:%M"))
    }

    pub fn format_issue_body(&self) -> String {
        format!(
            "New SN OPEN_BOUNTY detected:\n\n```\n{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\n```",
            self.id,
            self.user,
            "",
            self.sats,
            self.boost,
            self.comments,
            self.score,
            self.upvotes,
            self.total_sats,
            format!("top@{}", self.user),
            self.tags.join(","),
        )
    }
}

pub struct BountyDetector {
    seen_bounties: HashSet<u64>,
}

impl BountyDetector {
    pub fn new() -> Self {
        Self {
            seen_bounties: HashSet::new(),
        }
    }

    pub fn process_feed(&mut self, feed_data: &str) -> Vec<BountyRecord> {
        let mut new_bounties = Vec::new();

        for line in feed_data.lines() {
            if let Some(record) = BountyRecord::from_line(line) {
                if record.is_open_bounty() && !self.seen_bounties.contains(&record.id) {
                    self.seen_bounties.insert(record.id);
                    new_bounties.push(record);
                }
            }
        }

        new_bounties
    }

    pub fn mark_seen(&mut self, bounty_id: u64) {
        self.seen_bounties.insert(bounty_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_bounty_line() {
        let line = "1533094\tStacker_Stocks\t2\t1050\t10000\t26\t16.7\t9274\t25450\ttop@Stacker_Stocks\tOPEN_BOUNTY,HOT\tDaily Stock Discussion: Sunday's Weekly Close Contest 🟥 or 🟩?";
        let record = BountyRecord::from_line(line).unwrap();

        assert_eq!(record.id, 1533094);
        assert_eq!(record.user, "Stacker_Stocks");
        assert_eq!(record.sats, 1050);
        assert_eq!(record.boost, 10000);
        assert_eq!(record.comments, 26);
        assert!(record.is_open_bounty());
    }

    #[test]
    fn test_detector_deduplication() {
        let mut detector = BountyDetector::new();
        let feed = "1533094\tStacker_Stocks\t2\t1050\t10000\t26\t16.7\t9274\t25450\ttop@Stacker_Stocks\tOPEN_BOUNTY,HOT\tDaily Stock Discussion";

        let first = detector.process_feed(feed);
        assert_eq!(first.len(), 1);

        let second = detector.process_feed(feed);
        assert_eq!(second.len(), 0);
    }

    #[test]
    fn test_format_issue() {
        let line = "1533094\tStacker_Stocks\t2\t1050\t10000\t26\t16.7\t9274\t25450\ttop@Stacker_Stocks\tOPEN_BOUNTY,HOT\tDaily Stock Discussion";
        let record = BountyRecord::from_line(line).unwrap();

        let title = record.format_issue_title();
        assert!(title.starts_with("[radar] SN open bounty"));

        let body = record.format_issue_body();
        assert!(body.contains("New SN OPEN_BOUNTY detected"));
        assert!(body.contains("1533094"));
    }
}

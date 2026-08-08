use crate::types::{Detection, DetectionType};
use chrono::{DateTime, Utc};

pub struct OpenBountyDetector;

impl OpenBountyDetector {
    pub fn new() -> Self {
        Self
    }

    pub fn detect(&self, line: &str) -> Option<Detection> {
        // Parse tab-separated bounty format:
        // id  territory  boost  sats  bounty_sats  comments  rank  user_id  post_id  tags  types  title
        let parts: Vec<&str> = line.split('\t').collect();
        
        if parts.len() < 11 {
            return None;
        }

        // Check if types field contains OPEN_BOUNTY
        let types = parts.get(10)?;
        if !types.contains("OPEN_BOUNTY") {
            return None;
        }

        let id = parts.get(0)?.parse::<u64>().ok()?;
        let territory = parts.get(1)?.to_string();
        let bounty_sats = parts.get(4)?.parse::<u64>().ok()?;
        let title = parts.get(11).unwrap_or(&"").to_string();

        Some(Detection {
            id,
            detection_type: DetectionType::OpenBounty,
            territory,
            bounty_sats: Some(bounty_sats),
            title,
            detected_at: Utc::now(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_open_bounty() {
        let detector = OpenBountyDetector::new();
        let line = "1531752\tStacker_Sports\t3\t430\t2100\t12\t16.6\t232181\t3853\trecent@Stacker_Sports|top@Stacker_Sports\tOPEN_BOUNTY,SELF_POST_OPP\tRandom Sports Pick 'em";
        
        let result = detector.detect(line);
        assert!(result.is_some());
        
        let detection = result.unwrap();
        assert_eq!(detection.id, 1531752);
        assert_eq!(detection.territory, "Stacker_Sports");
        assert_eq!(detection.bounty_sats, Some(2100));
        assert_eq!(detection.title, "Random Sports Pick 'em");
        assert!(matches!(detection.detection_type, DetectionType::OpenBounty));
    }

    #[test]
    fn test_detect_non_bounty() {
        let detector = OpenBountyDetector::new();
        let line = "1531752\tStacker_Sports\t3\t430\t2100\t12\t16.6\t232181\t3853\trecent@Stacker_Sports\tSELF_POST_OPP\tRandom Sports Pick 'em";
        
        let result = detector.detect(line);
        assert!(result.is_none());
    }

    #[test]
    fn test_detect_malformed_line() {
        let detector = OpenBountyDetector::new();
        let line = "invalid\tdata";
        
        let result = detector.detect(line);
        assert!(result.is_none());
    }
}

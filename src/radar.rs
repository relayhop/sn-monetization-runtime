```rust
use sp_std::vec::Vec;

/// Represents a bounty entry as returned by the external SN Oracle API.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SnBounty {
    pub id: u64,
    pub source: String,
    pub score: u32,
    pub tags: Vec<String>,
    pub status: String,
}

/// Parses a bounty line from the SN radar feed.
///
/// The expected format is space-delimited:
/// `<id> <source> <flags> <score> <tags>`
///
/// Example:
/// ```text
/// 1592079 Stacker_Sports 3 2632 2100 10 20.8 232181 4315 recent@Stacker_Sports|top@Stacker_Sports OPEN_BOUNTY,HOT,SELF_POST_OPP Weekly Random Sports Pick 'em
/// ```
pub fn parse_bounty_line(line: &str) -> Option<SnBounty> {
    let parts: Vec<&str> = line.splitn(5, ' ').collect();
    if parts.len() < 4 {
        return None;
    }

    let id: u64 = parts[0].parse().ok()?;
    let source = parts[1].to_string();
    let tags_part = parts[2];
    let tags: Vec<String> = tags_part
        .split('|')
        .filter(|t| !t.is_empty())
        .map(|s| s.to_string())
        .collect();
    let score: u32 = parts[3].split_whitespace().next()?.parse().ok()?;
    let status = if tags.iter().any(|t| t.contains("OPEN_BOUNTY")) {
        "OPEN_BOUNTY".to_string()
    } else {
        "CLOSED".to_string()
    };

    Some(SnBounty {
        id,
        source,
        score,
        tags,
        status,
    })
}

/// Validates that a parsed bounty is an active open bounty.
pub fn is_open_bounty(bounty: &SnBounty) -> bool {
    bounty.status == "OPEN_BOUNTY"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_bounty_line() {
        let line = "1592079 Stacker_Sports 3 2632 2100 10 20.8 232181 4315 recent@Stacker_Sports|top@Stacker_Sports OPEN_BOUNTY,HOT,SELF_POST_OPP Weekly Random Sports Pick 'em";
        let bounty = parse_bounty_line(line).expect("should parse");
        assert_eq!(bounty.id, 1592079);
        assert_eq!(bounty.source, "Stacker_Sports");
        assert!(is_open_bounty(&bounty));
        assert_eq!(bounty.tags, vec!["recent@Stacker_Sports", "top@Stacker_Sports"]);
    }

    #[test]
    fn test_parse_invalid_line() {
        assert!(parse_bounty_line("too-few-fields").is_none());
        assert!(parse_bounty_line("").is_none());
    }
}

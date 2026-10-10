```rust
use crate::radar::{parse_bounty_line, is_open_bounty, SnBounty};
use sp_std::vec::Vec;

/// Fetches and parses bounty entries from the SN Radar feed.
///
/// In production this would make an HTTP call to the oracle service.
/// For the no-std runtime we expose a pure parsing interface.
pub fn fetch_and_parse_bounties(raw_feed: &str) -> Vec<SnBounty> {
    raw_feed
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with('#') {
                return None;
            }
            parse_bounty_line(trimmed).filter(is_open_bounty)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fetch_and_parse() {
        let feed = "\
# comment line
1592079 Stacker_Sports 3 2632 2100 10 20.8 232181 4315 recent@Stacker_Sports|top@Stacker_Sports OPEN_BOUNTY,HOT,SELF_POST_OPP Weekly Random Sports Pick 'em
not-a-bounty
";
        let bounties = fetch_and_parse_bounties(feed);
        assert_eq!(bounties.len(), 1);
        assert_eq!(bounties[0].id, 1592079);
        assert_eq!(bounties[0].source, "Stacker_Sports");
    }
}

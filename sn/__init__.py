"""Compatibility namespace for Stacker News data types."""

from radar.sn import SNRecord, is_open_bounty, parse_record, parse_records

__all__ = ["SNRecord", "is_open_bounty", "parse_record", "parse_records"]

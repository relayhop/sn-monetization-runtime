import unittest
from unittest.mock import patch, MagicMock
from github import Github
from github import RateLimitExceededException
from src.bounty_detector import BountyDetector

class TestBountyDetector(unittest.TestCase):
    def setUp(self):
        self.detector = BountyDetector()

    def test_open_bounty_detection_valid_line(self):
        line = "1482916\tmath\t2\t1702\t1000\t7\t20.8\t48657\t13562\trecent@math|top@math\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tWeekend Puzzle: Interesting Numbers"
        self.assertTrue(self.detector.is_open_bounty_line(line))

    def test_open_bounty_missing_required_labels(self):
        line = "1482916\tmath\t2\t1702\t1000\t7\t20.8\t48657\t13562\trecent@math|top@math\tHOT\tWeekend Puzzle: Interesting Numbers"
        self.assertFalse(self.detector.is_open_bounty_line(line))

    def test_open_bounty_with_extra_whitespace(self):
        line = "  1482916\tmath\t2\t1702\t1000\t7\t20.8\t48657\t13562\trecent@math|top@math\tOPEN_BOUNTY, SELF_POST_OPP \tWeekend Puzzle: Interesting Numbers  "
        self.assertTrue(self.detector.is_open_bounty_line(line))

    def test_open_bounty_invalid_input_type(self):
        with self.assertRaises(TypeError):
            self.detector.is_open_bounty_line(None)

    def test_open_bounty_empty_string(self):
        self.assertFalse(self.detector.is_open_bounty_line(""))

    def test_open_bounty_malformed_line(self):
        line = "incomplete\tdata"
        with self.assertRaises(ValueError):
            self.detector.is_open_bounty_line(line)

    def test_open_bounty_no_labels(self):
        line = "1482916\tmath\t2\t1702\t1000\t7\t20.8\t48657\t13562\trecent@math|top@math\t\tWeekend Puzzle: Interesting Numbers"
        self.assertFalse(self.detector.is_open_bounty_line(line))

    def test_open_bounty_partial_labels(self):
        line = "1482916\tmath\t2\t1702\t1000\t7\t20.8\t48657\t13562\trecent@math|top@math\tOPEN_BOUNTY\tWeekend Puzzle: Interesting Numbers"
        self.assertFalse(self.detector.is_open_bounty_line(line))
import unittest
import os
import sys

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from main import target_handler
except ImportError:
    target_handler = None


class TestIssue1196(unittest.TestCase):
    """Regression test suite for Issue #1196 - [radar] SN open bounty 2026-09-26T07:33.
    Verifies target_handler() defensive boundary guards, dual-format ingestion,
    and schema normalization.
    """

    RAW_BOUNTY_TSV = (
        "1581934\tConstruction_and_Engineering\t2\t56\t5000\t0\t12.6\t9274\t27850\t"
        "recent@Construction_and_Engineering|top@Construction_and_Engineering\t"
        "OPEN_BOUNTY,LOW_COMP\t"
        "Show Your Build Friday #3: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨"
    )

    def setUp(self):
        if target_handler is None:
            self.fail("target_handler could not be imported from main.py")

    # 1. Normal Flow Tests
    def test_01_normal_flow_tsv(self):
        """Test standard TSV radar line ingestion matching Issue #1196."""
        result = target_handler(self.RAW_BOUNTY_TSV)
        self.assertIsInstance(result, dict)
        self.assertEqual(result.get("status"), "success")
        self.assertEqual(result.get("bounty_id"), 1581934)
        self.assertEqual(result.get("sub"), "Construction_and_Engineering")
        self.assertEqual(result.get("bounty_sats"), 5000)
        self.assertTrue(result.get("is_open_bounty"))
        self.assertTrue(result.get("is_low_competition"))
        self.assertTrue(result.get("eligible"))
        self.assertEqual(
            result.get("title"),
            "Show Your Build Friday #3: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨",
        )
        self.assertIsNone(result.get("error"))

    def test_02_normal_flow_dict(self):
        """Test valid dictionary payload representing the bounty."""
        payload = {
            "id": 1581934,
            "sub": "Construction_and_Engineering",
            "tier": 2,
            "score": 56,
            "bounty": 5000,
            "ncom": 0,
            "tags": ["OPEN_BOUNTY", "LOW_COMP"],
            "title": "Show Your Build Friday #3: Real-World Proof-of-Work [5,000 Sat Bounty] ⚡🔨",
        }
        result = target_handler(payload)
        self.assertIsInstance(result, dict)
        self.assertEqual(result.get("status"), "success")
        self.assertEqual(result.get("bounty_id"), 1581934)
        self.assertEqual(result.get("sub"), "Construction_and_Engineering")
        self.assertEqual(result.get("bounty_sats"), 5000)
        self.assertTrue(result.get("is_open_bounty"))
        self.assertTrue(result.get("is_low_competition"))
        self.assertTrue(result.get("eligible"))
        self.assertIsNone(result.get("error"))

    # 2. Boundary Handling Tests
    def test_03_boundary_none(self):
        """Test boundary condition with None payload."""
        result = target_handler(None)
        self.assertIsInstance(result, dict)
        self.assertEqual(result.get("status"), "invalid_input")
        self.assertFalse(result.get("eligible"))
        self.assertIsNotNone(result.get("error"))

    def test_04_boundary_empty_and_whitespace(self):
        """Test boundary condition with empty and whitespace strings."""
        for empty_val in ("", "   ", "\t\n"):
            result = target_handler(empty_val)
            self.assertIsInstance(result, dict)
            self.assertEqual(result.get("status"), "invalid_input")
            self.assertFalse(result.get("eligible"))

    def test_05_boundary_partial_tsv(self):
        """Test boundary condition with truncated TSV rows."""
        partial_row = "1581934\tConstruction_and_Engineering\t2"
        result = target_handler(partial_row)
        self.assertIsInstance(result, dict)
        self.assertEqual(result.get("status"), "invalid_input")
        self.assertFalse(result.get("eligible"))

    # 3. Contract Integrity Tests
    def test_06_contract_unsupported_types(self):
        """Test contract safety against unsupported object types."""
        unsupported = [12345, 99.9, [1, 2, 3], {"unexpected": object()}, object()]
        for val in unsupported:
            result = target_handler(val)
            self.assertIsInstance(result, dict)
            self.assertIn(result.get("status"), ("invalid_input", "error"))
            self.assertFalse(result.get("eligible"))

    def test_07_contract_non_numeric_fallback(self):
        """Test safe casting when numeric positions contain non-numeric data."""
        corrupted_tsv = (
            "not_an_id\tConstruction_and_Engineering\tbad_tier\tbad_score\t"
            "bad_bounty\tbad_ncom\tbad_age\tbad_since\tbad_nitems\t"
            "hits\tOPEN_BOUNTY\tTitle"
        )
        result = target_handler(corrupted_tsv)
        self.assertIsInstance(result, dict)
        self.assertEqual(result.get("bounty_sats"), 0)
        self.assertFalse(result.get("eligible"))

    def test_08_contract_no_args(self):
        """Test calling target_handler() with zero arguments."""
        result = target_handler()
        self.assertIsInstance(result, dict)
        self.assertEqual(result.get("status"), "invalid_input")
        self.assertFalse(result.get("eligible"))

    # 4. Integration & Domain Logic Tests
    def test_09_low_comp_thresholds(self):
        """Test LOW_COMP boundary logic: comments <= 5 vs > 5."""
        # 5 comments -> low competition
        payload_5_comments = {
            "id": 101,
            "bounty": 1000,
            "ncom": 5,
            "tags": ["OPEN_BOUNTY"],
        }
        res_5 = target_handler(payload_5_comments)
        self.assertTrue(res_5.get("is_low_competition"))

        # 6 comments -> high competition
        payload_6_comments = {
            "id": 102,
            "bounty": 1000,
            "ncom": 6,
            "tags": ["OPEN_BOUNTY"],
        }
        res_6 = target_handler(payload_6_comments)
        self.assertFalse(res_6.get("is_low_competition"))

    def test_10_min_bounty_threshold(self):
        """Test minimum bounty threshold (100 sats) for eligibility."""
        # Below 100 sats -> ineligible
        low_bounty = {"id": 103, "bounty": 99, "tags": ["OPEN_BOUNTY"]}
        res_low = target_handler(low_bounty)
        self.assertFalse(res_low.get("eligible"))

        # 100 sats -> eligible
        valid_bounty = {"id": 104, "bounty": 100, "tags": ["OPEN_BOUNTY"]}
        res_valid = target_handler(valid_bounty)
        self.assertTrue(res_valid.get("eligible"))

    def test_11_kwargs_forwarding(self):
        """Test that extra kwargs do not cause TypeError."""
        result = target_handler(
            self.RAW_BOUNTY_TSV, custom_option="test", dry_run=True, retry_count=3
        )
        self.assertEqual(result.get("status"), "success")
        self.assertEqual(result.get("bounty_id"), 1581934)


if __name__ == "__main__":
    unittest.main()

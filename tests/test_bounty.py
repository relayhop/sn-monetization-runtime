import pytest

from sn_radar import parse_event, parse_events
from sn_radar.bounty import to_json

ROW = "1578858\tStacker_Sports\t3\t4929\t10000\t6\t6.5\t1578143\t12\trecent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SIGNAL,SELF_POST_OPP\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?"


def test_parse_real_row_and_properties():
    event = parse_event(ROW)
    assert event.post_id == 1578858
    assert event.bounty_sats == 10000
    assert event.feeds == ("recent@lightning", "top@lightning")
    assert event.is_open_bounty and event.proof_of_work


def test_normalized_json_is_safe_and_stable():
    output = to_json(parse_event(ROW))
    assert '"bounty_sats": 10000' in output
    assert "secret" not in output.lower()


def test_parse_events_skips_blank_lines():
    assert len(parse_events(["", ROW, "\n"])) == 1


@pytest.mark.parametrize("bad", ["", "a\tb", ROW.replace("\tOPEN_BOUNTY", "\tHOT"), ROW.replace("\t10000\t", "\t9999\t")])
def test_rejects_invalid_rows(bad):
    with pytest.raises(ValueError):
        parse_event(bad)


def test_rejects_invalid_numeric_field():
    with pytest.raises(ValueError, match="score"):
        parse_event(ROW.replace("\t4929\t", "\tnot-a-number\t"))


def test_accepts_title_without_amount_and_empty_feed_entries():
    row = ROW.replace("recent@lightning|top@lightning", "recent@lightning|").replace("10,000 SATS ", "")
    event = parse_event(row)
    assert event.feeds == ("recent@lightning",)


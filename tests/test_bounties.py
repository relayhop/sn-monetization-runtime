from decimal import Decimal

import pytest

from radar.bounties import RowFormatError, is_open_bounty, parse_row, summarize


ROW = ("1578858\tStacker_Sports\t3\t5050\t10000\t10\t16.5\t1578143\t16\t"
       "recent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SELF_POST_OPP\t"
       "10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?")


def test_parse_real_radar_row():
    bounty = parse_row(ROW)
    assert bounty.post_id == 1578858
    assert bounty.author == "Stacker_Sports"
    assert bounty.sats == 10000
    assert bounty.age_hours == Decimal("16.5")
    assert bounty.feeds == ("recent@lightning", "top@lightning")
    assert is_open_bounty(bounty)


def test_parse_accepts_newline_and_summarizes_without_mutation():
    bounty = parse_row(ROW + "\n")
    assert summarize([bounty]) == [{"post_id": 1578858, "author": "Stacker_Sports",
        "sats": 10000, "title": bounty.title,
        "flags": ["HOT", "OPEN_BOUNTY", "SELF_POST_OPP"],
        "feeds": ["recent@lightning", "top@lightning"]}]


@pytest.mark.parametrize("bad", ["", "a\tb", ROW.replace("\t10000\t", "\tnope\t"), ROW.replace("\t16.5\t", "\tNaN\t")])
def test_rejects_malformed_rows(bad):
    with pytest.raises(RowFormatError):
        parse_row(bad)


def test_closed_or_zero_value_is_not_open():
    closed = parse_row(ROW.replace("OPEN_BOUNTY,HOT,SELF_POST_OPP", "HOT"))
    zero = parse_row(ROW.replace("\t10000\t10\t", "\t0\t10\t"))
    assert not is_open_bounty(closed)
    assert not is_open_bounty(zero)


def test_summarize_sorts_by_value_then_id():
    low = parse_row(ROW.replace("1578858", "2", 1).replace("\t10000\t", "\t5\t"))
    assert [x["post_id"] for x in summarize([low, parse_row(ROW)])] == [1578858, 2]

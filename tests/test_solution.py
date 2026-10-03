import pytest

from solution import BountyFormatError, is_actionable, parse_bounty_row, triage_score


ROW = "1578858\tStacker_Sports\t3\t5029\t10000\t10\t13.0\t1578143\t16\trecent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SELF_POST_OPP\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?"


def test_parses_supplied_open_bounty():
    bounty = parse_bounty_row(ROW)
    assert bounty.post_id == 1578858
    assert bounty.reward_sats == 10000
    assert bounty.feeds == ("recent@lightning", "top@lightning")
    assert bounty.is_open and is_actionable(bounty)
    assert triage_score(bounty) == 50


def test_title_tabs_are_not_silently_accepted():
    with pytest.raises(BountyFormatError):
        parse_bounty_row(ROW.replace("\t10,000", "\tbroken\t10,000"))


@pytest.mark.parametrize("bad", ["", "a\tb", ROW.replace("\t13.0\t", "\t-1\t"), ROW.replace("\t13.0\t", "\tnope\t")])
def test_rejects_malformed_rows(bad):
    with pytest.raises(BountyFormatError):
        parse_bounty_row(bad)


def test_closed_bounty_has_zero_priority():
    bounty = parse_bounty_row(ROW.replace("OPEN_BOUNTY,HOT,SELF_POST_OPP", "HOT"))
    assert not bounty.is_open
    assert triage_score(bounty) == 0
    assert not is_actionable(bounty)


def test_empty_feed_entries_are_ignored():
    bounty = parse_bounty_row(ROW.replace("recent@lightning|top@lightning", "|recent@lightning|"))
    assert bounty.feeds == ("recent@lightning",)

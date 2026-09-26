import pytest

from sn_radar import Bounty, is_actionable, parse_bounty, parse_lines

LINE = "1578858\tStacker_Sports\t3\t5050\t10000\t10\t17.3\t1578143\t16\trecent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SELF_POST_OPP\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?"


def test_parse_detected_record():
    bounty = parse_bounty(LINE)
    assert bounty == Bounty(1578858, "Stacker_Sports", 3, 5050, 10000.0, 10, 17.3,
                            1578143, 16, ("recent@lightning", "top@lightning"),
                            frozenset({"OPEN_BOUNTY", "HOT", "SELF_POST_OPP"}),
                            "10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?")
    assert bounty.is_open and bounty.is_hot
    assert is_actionable(bounty, minimum_sats=5000)


def test_parse_lines_skips_blank_lines():
    assert parse_lines("\n" + LINE + "\n") == [parse_bounty(LINE)]


@pytest.mark.parametrize("line,error", [("", "12"), ("\t".join(["x"] * 12), "id")])
def test_rejects_malformed_records(line, error):
    with pytest.raises(ValueError, match=error):
        parse_bounty(line)


def test_non_open_bounty_is_not_actionable():
    bounty = parse_bounty(LINE.replace("OPEN_BOUNTY,", ""))
    assert not is_actionable(bounty, minimum_sats=1)


def test_negative_threshold_rejected_and_non_string_rejected():
    with pytest.raises(ValueError):
        is_actionable(parse_bounty(LINE), minimum_sats=-1)
    with pytest.raises(TypeError):
        parse_bounty(None)

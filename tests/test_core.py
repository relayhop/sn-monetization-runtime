from decimal import Decimal
import pytest

from sn_radar import RadarError, parse_bounties, prioritize, render_markdown
from sn_radar.core import parse_row

ROW = "1578858\tStacker_Sports\t3\t5050\t10000\t10\t13.2\t1578143\t16\trecent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SELF_POST_OPP\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?"
ROW2 = "1578735\tStacker_Sports\t3\t1440\t5000\t15\t15.2\t54354\t6681\trecent@Stacker_Sports\tOPEN_BOUNTY,HOT,SELF_POST_OPP\tAFL Grand Final Pick ‘Em ! 5000 SATS"


def test_parse_and_fields():
    bounty = parse_row(ROW)
    assert bounty.post_id == 1578858
    assert bounty.sats == 10000
    assert bounty.hotness == Decimal("13.2")
    assert bounty.is_open_bounty and bounty.url.endswith("1578858")


def test_parse_ignores_blank_lines_and_filters_flags():
    closed = ROW.replace("OPEN_BOUNTY,", "HOT,")
    assert [b.post_id for b in parse_bounties(f"\n{ROW}\n{closed}\n")] == [1578858]
    assert len(parse_bounties(closed, open_only=False)) == 1


def test_prioritize_is_deterministic_and_does_not_mutate():
    values = parse_bounties(f"{ROW}\n{ROW2}")
    assert [b.post_id for b in prioritize(values)] == [1578735, 1578858]
    assert values[0].post_id == 1578858


@pytest.mark.parametrize("bad", ["", "a\tb", ROW.replace("10000", "-1"), ROW.replace("13.2", "NaN")])
def test_malformed_rows_raise(bad):
    with pytest.raises(RadarError):
        parse_row(bad)


def test_line_number_is_reported():
    with pytest.raises(RadarError, match="line 2"):
        parse_bounties(f"{ROW}\nbad")


def test_markdown_empty_and_content():
    assert "No open bounties" in render_markdown([])
    report = render_markdown(parse_bounties(ROW))
    assert "10,000 sats" in report and "https://stacker.news/items/1578858" in report


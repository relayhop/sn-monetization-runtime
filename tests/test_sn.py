import pytest

from radar.sn import SNRecord, is_open_bounty, parse_record, parse_records


ROW = "1578858\tStacker_Sports\t3\t5029\t10000\t8\t7.7\t1578143\t13\trecent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SIGNAL,SELF_POST_OPP\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?"


def test_parse_bounty_row():
    record = parse_record(ROW)
    assert record == SNRecord(1578858, "Stacker_Sports", 3, 5029, 10000, 8, 7.7,
                              1578143, 13, ("recent@lightning", "top@lightning"),
                              frozenset({"OPEN_BOUNTY", "HOT", "SIGNAL", "SELF_POST_OPP"}),
                              "10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?", ROW)
    assert record.is_open_bounty and record.is_hot


def test_classification_accepts_string_or_record_and_normalizes_tags():
    row = ROW.replace("OPEN_BOUNTY,HOT", "open_bounty,hot")
    record = parse_record(row)
    assert is_open_bounty(record) is True
    assert is_open_bounty(row) is True


def test_parse_records_skips_blank_lines_and_keeps_order():
    other = ROW.replace("1578858", "2", 1).replace("OPEN_BOUNTY,", "", 1)
    records = parse_records(["", ROW + "\n", "  \n", other])
    assert [r.item_id for r in records] == [1578858, 2]
    assert records[1].is_open_bounty is False


@pytest.mark.parametrize("bad", ["", "a\tb", ROW + "\textra", ROW.replace("7.7", "x"), ROW.replace("Stacker_Sports", "")])
def test_invalid_rows_are_rejected(bad):
    with pytest.raises(ValueError):
        parse_record(bad)


def test_negative_quality_is_rejected():
    with pytest.raises(ValueError, match="non-negative"):
        parse_record(ROW.replace("\t7.7\t", "\t-1\t"))

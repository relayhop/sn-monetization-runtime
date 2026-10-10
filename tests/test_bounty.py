import pytest

from sn_radar.bounty import RecordError, is_open_bounty, parse_record, records_as_json

SAMPLE = "1578858\tStacker_Sports\t3\t5029\t10000\t10\t11.6\t1578143\t14\trecent@lightning|top@lightning\tOPEN_BOUNTY,HOT,SIGNAL,SELF_POST_OPP\t10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?"


def test_parse_sample_and_derived_properties():
    record = parse_record(SAMPLE)
    assert record.post_id == 1578858
    assert record.sats == 10000
    assert record.feeds == ("recent@lightning", "top@lightning")
    assert record.is_open and record.proof_of_work


def test_sats_accepts_commas_and_flags_are_case_insensitive():
    row = SAMPLE.replace("10000", "10,000", 1).replace("OPEN_BOUNTY", "open_bounty", 1)
    assert parse_record(row).sats == 10000
    assert parse_record(row).is_open


@pytest.mark.parametrize("bad", ["", "a\tb", SAMPLE + "\textra", SAMPLE.replace("11.6", "nope")])
def test_rejects_malformed_rows(bad):
    with pytest.raises(RecordError):
        parse_record(bad)


def test_filter_threshold_and_json_output():
    assert is_open_bounty(parse_record(SAMPLE), minimum_sats=10000)
    assert not is_open_bounty(parse_record(SAMPLE), minimum_sats=10001)
    assert '"post_id": 1578858' in records_as_json([SAMPLE], minimum_sats=10000)


def test_non_open_record_is_not_actionable():
    record = parse_record(SAMPLE.replace("OPEN_BOUNTY,", ""))
    assert not is_open_bounty(record)


def test_negative_threshold_rejected():
    with pytest.raises(ValueError):
        is_open_bounty(parse_record(SAMPLE), minimum_sats=-1)

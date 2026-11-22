"""Unit tests for tools/sn_math_square_pairs.py (Issue #1326)."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import sn_math_square_pairs as M  # noqa: E402


def test_hamiltonian_square_path_n15() -> None:
    path = M.find_square_sum_path(15)
    assert path is not None
    assert sorted(path) == list(range(1, 16))
    for a, b in zip(path, path[1:]):
        assert M.is_perfect_square(a + b), f"{a} + {b} is not a square"


def test_hamiltonian_square_cycle_n32() -> None:
    cycle = M.find_square_sum_cycle(32)
    assert cycle is not None
    assert sorted(cycle) == list(range(1, 33))
    for i in range(32):
        a = cycle[i]
        b = cycle[(i + 1) % 32]
        assert M.is_perfect_square(a + b), f"{a} + {b} is not a square"


def test_disjoint_square_pair_partitions() -> None:
    for even_n in (8, 16, 24, 100):
        pairs = M.partition_into_square_pairs(even_n)
        assert len(pairs) == even_n // 2
        flat = [x for pair in pairs for x in pair]
        assert sorted(flat) == list(range(1, even_n + 1))
        for a, b in pairs:
            assert M.is_perfect_square(a + b)


def test_solve_issue_1326_metadata() -> None:
    rep = M.solve_issue_1326()
    assert rep.item_id == 1600261
    assert rep.sub == "math"
    assert rep.bounty_sats == 10000
    assert "OPEN_BOUNTY" in rep.tags
    assert "SIGNAL" in rep.tags
    assert len(rep.hamiltonian_path_n15) == 15
    assert len(rep.hamiltonian_cycle_n32) == 32

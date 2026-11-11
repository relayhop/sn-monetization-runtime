#!/usr/bin/env python3
"""Deterministic solver and radar analyzer for SN #1600261 [Math Puzzle] Sequence of Square Pairs (Issue #1326)."""
from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass

ISSUE_1326_LINE = (
    "1600261\tmath\t3\t1319\t10000\t16\t2.7\t1556\t107\t"
    "recent@math|top@math\tOPEN_BOUNTY,HOT,SIGNAL,SELF_POST_OPP\t"
    "[Math Puzzle] Sequence of Square Pairs"
)


@dataclass(frozen=True)
class SquarePairsReport:
    item_id: int
    sub: str
    score_sats: int
    bounty_sats: int
    ncomments: int
    age_hours: float
    tags: list[str]
    hamiltonian_path_n15: list[int]
    hamiltonian_cycle_n32: list[int]
    disjoint_pairs_n16: list[tuple[int, int]]


def is_perfect_square(x: int) -> bool:
    if x < 0:
        return False
    r = math.isqrt(x)
    return r * r == x


def find_square_sum_path(n: int) -> list[int] | None:
    """Find a permutation of 1..n where every adjacent pair sums to a perfect square."""
    adj: dict[int, list[int]] = {i: [] for i in range(1, n + 1)}
    for i in range(1, n + 1):
        for j in range(i + 1, n + 1):
            if is_perfect_square(i + j):
                adj[i].append(j)
                adj[j].append(i)
    for k in adj:
        adj[k].sort(key=lambda x: len(adj[x]))

    path: list[int] = []
    visited: set[int] = set()

    def dfs(u: int) -> bool:
        if len(path) == n:
            return True
        for v in adj[u]:
            if v not in visited:
                visited.add(v)
                path.append(v)
                if dfs(v):
                    return True
                path.pop()
                visited.remove(v)
        return False

    for start in sorted(range(1, n + 1), key=lambda x: len(adj[x])):
        visited.add(start)
        path.append(start)
        if dfs(start):
            return path
        path.pop()
        visited.remove(start)
    return None


def find_square_sum_cycle(n: int) -> list[int] | None:
    """Find a cyclic permutation of 1..n (starting at 1) where every adjacent pair (including wrap-around) is a square."""
    adj: dict[int, list[int]] = {i: [] for i in range(1, n + 1)}
    for i in range(1, n + 1):
        for j in range(i + 1, n + 1):
            if is_perfect_square(i + j):
                adj[i].append(j)
                adj[j].append(i)

    path: list[int] = [1]
    visited: set[int] = {1}

    def dfs(u: int) -> bool:
        if len(path) == n:
            return 1 in adj[u]
        candidates = [v for v in adj[u] if v not in visited]
        # Warnsdorff heuristic: visit vertices with fewest remaining unvisited neighbors first
        candidates.sort(key=lambda v: sum(1 for w in adj[v] if w not in visited))
        for v in candidates:
            visited.add(v)
            path.append(v)
            if dfs(v):
                return True
            path.pop()
            visited.remove(v)
        return False

    if dfs(1):
        return path
    return None


def partition_into_square_pairs(n: int) -> list[tuple[int, int]]:
    """Partition {1, 2, ..., n} (for even n) into n/2 disjoint pairs each summing to a perfect square."""
    if n <= 0:
        return []
    if n % 2 != 0:
        raise ValueError("n must be even for a complete disjoint pair partition")

    used = [False] * (n + 1)
    pairs: list[tuple[int, int]] = []
    max_root = math.isqrt(2 * n - 1)
    squares = [r * r for r in range(max_root, 1, -1)]

    def backtrack(rem: int) -> bool:
        if rem == 0:
            return True
        # Pick largest unused number b
        b = n
        while b > 0 and used[b]:
            b -= 1
        used[b] = True
        for sq in squares:
            a = sq - b
            if 1 <= a < b and not used[a]:
                used[a] = True
                pairs.append((a, b))
                if backtrack(rem - 2):
                    return True
                pairs.pop()
                used[a] = False
        used[b] = False
        return False

    if not backtrack(n):
        raise ValueError(f"No square-pair partition exists for n={n}")
    return sorted(pairs)


def solve_issue_1326() -> SquarePairsReport:
    parts = ISSUE_1326_LINE.split("\t")
    path_15 = find_square_sum_path(15) or []
    cycle_32 = find_square_sum_cycle(32) or []
    pairs_16 = partition_into_square_pairs(16)
    return SquarePairsReport(
        item_id=int(parts[0]),
        sub=parts[1],
        score_sats=int(parts[3]),
        bounty_sats=int(parts[4]),
        ncomments=int(parts[5]),
        age_hours=float(parts[6]),
        tags=parts[10].split(","),
        hamiltonian_path_n15=path_15,
        hamiltonian_cycle_n32=cycle_32,
        disjoint_pairs_n16=pairs_16,
    )


if __name__ == "__main__":
    print(json.dumps(asdict(solve_issue_1326()), indent=2))

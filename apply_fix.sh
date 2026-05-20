#!/bin/bash
set -e
#!/bin/bash
git checkout -b fix/issue-24
cat << 'EOF' > puzzle_004_selfish_mining.py
def calculate_selfish_mining_threshold(gamma):
    """
    Returns the alpha (hash power) threshold for selfish mining to be profitable.
    Formula: alpha > (1 - gamma) / (3 - 2 * gamma)
    """
    return (1 - gamma) / (3 - 2 * gamma)

if __name__ == "__main__":
    # Common gamma values for simulation
    for g in [0.0, 0.5, 1.0]:
        print(f"Gamma: {g}, Alpha Threshold: {calculate_selfish_mining_threshold(g):.4f}")
EOF
git add puzzle_004_selfish_mining.py
git commit -m "fix: [radar] SN open bounty 2026-05-07T20:49 — Fixes #24"

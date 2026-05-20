#!/bin/bash
set -e
#!/bin/bash
git checkout -b fix/issue-15
cat << 'EOF' > puzzle_004_selfish_mining_pt4.py
def calculate_selfish_mining_profitability(alpha, gamma):
    """
    Calculates if selfish mining is more profitable than honest mining.
    alpha: attacker's relative hash power (0 < alpha < 0.5)
    gamma: ratio of honest nodes that mine on the attacker's pool (0 <= gamma <= 1)
    """
    # Eyal and Sirer (2013) threshold: alpha > (1 - gamma) / (3 - 2 * gamma)
    threshold = (1 - gamma) / (3 - 2 * gamma)
    is_profitable = alpha > threshold
    return is_profitable, threshold

if __name__ == "__main__":
    # Test parameters for Bitcoin Math Puzzle #004
    a, g = 0.33, 0.5
    profitable, t = calculate_selfish_mining_profitability(a, g)
    print(f"Alpha: {a}, Gamma: {g} | Threshold: {t:.4f} | Profitable: {profitable}")
EOF
git add puzzle_004_selfish_mining_pt4.py
git commit -m "fix: [radar] SN open bounty 2026-05-06T20:54 — Fixes #15"

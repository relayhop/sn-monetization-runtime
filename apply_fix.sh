#!/bin/bash
set -e
#!/bin/bash
git checkout -b fix/issue-27
cat << 'EOF' > selfish_mining_solver.py
def calculate_alpha_threshold(gamma):
    """
    Returns the alpha threshold for selfish mining profitability.
    Formula: alpha > (1 - gamma) / (3 - 2 * gamma)
    """
    return (1 - gamma) / (3 - 2 * gamma)

if __name__ == "__main__":
    # Parameters for Bitcoin Math Puzzle #004
    gammas = [0.0, 0.5, 1.0]
    for g in gammas:
        threshold = calculate_alpha_threshold(g)
        print(f"Gamma: {g}, Alpha Threshold: {threshold:.4f}")
EOF
git add selfish_mining_solver.py
git commit -m "fix: [radar] SN open bounty 2026-05-08T00:10 — Fixes #27"

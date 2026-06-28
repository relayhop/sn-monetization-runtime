#!/bin/bash
set -e
#!/bin/bash
git checkout -b fix/issue-25
cat << 'EOF' > selfish_mining_pt4_solution.py
def selfish_mining_threshold(gamma):
    """
    Calculates the alpha threshold for selfish mining profitability.
    Eyal and Sirer (2013): alpha > (1 - gamma) / (3 - 2 * gamma)
    """
    return (1 - gamma) / (3 - 2 * gamma)

if __name__ == "__main__":
    # Parameters for Bitcoin Math Puzzle #004
    gamma_test = 0.5
    threshold = selfish_mining_threshold(gamma_test)
    print(f"Profitability threshold for alpha (gamma={gamma_test}): {threshold:.4f}")
EOF
git add selfish_mining_pt4_solution.py
git commit -m "fix: [radar] SN open bounty 2026-05-07T20:49 — Fixes #25"

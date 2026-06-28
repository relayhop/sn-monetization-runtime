def selfish_mining_threshold(gamma):
    """
    Returns the alpha (hash power) threshold for selfish mining.
    alpha > (1 - gamma) / (3 - 2 * gamma)
    """
    return (1 - gamma) / (3 - 2 * gamma)


if __name__ == "__main__":
    # Parameters for Bitcoin Math Puzzle #004: Selfish Mining Pt. 4
    gamma_values = [0.0, 0.5, 1.0]
    for g in gamma_values:
        print(f"Gamma: {g}, Alpha Threshold: {selfish_mining_threshold(g):.4f}")

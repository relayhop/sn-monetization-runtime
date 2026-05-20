def calculate_selfish_mining_threshold(gamma):
    """
    Returns the alpha (hash power) threshold for selfish mining to be profitable.
    Formula: alpha > (1 - gamma) / (3 - 2 * gamma)
    """
    return (1 - gamma) / (3 - 2 * gamma)


if __name__ == "__main__":
    # Common gamma values:
    # gamma = 0: threshold = 1/3 (~0.33)
    # gamma = 0.5: threshold = 1/4 (0.25)
    # gamma = 1: threshold = 0
    for g in [0.0, 0.5, 1.0]:
        print(
            f"Gamma: {g}, Alpha Threshold: {calculate_selfish_mining_threshold(g):.4f}"
        )

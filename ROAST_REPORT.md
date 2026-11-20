# SN Shop Monetization: Critical Roast & UX Analysis

## Executive Summary
This report analyzes the current SN shop monetization runtime and user-facing shop experience. While the backend infrastructure (`sn-monetization-runtime`) is robust, the frontend/UX layer presents several friction points that hinder mass adoption of paid content/digital goods.

## 1. Friction in the Checkout Flow
*   **The "Sats" Barrier:** While the target audience is Bitcoin-native, the lack of a clear USD-equivalent display during the final checkout step creates cognitive load. Users are forced to mentally calculate the value of 57k sats.
*   **Recommendation:** Implement a toggle for "Display price in USD" that persists across the session.

## 2. Signal vs. Noise in "OPEN_BOUNTY"
*   **The Problem:** The current scraping logic (`sn_radar.yml`) identifies bounties, but the shop interface often buries high-value opportunities under a feed of low-effort posts.
*   **Recommendation:** Create a dedicated "Monetization Dashboard" tab that filters only for high-signal, high-reward bounties, separating them from standard discussion threads.

## 3. Lack of "Proof of Value"
*   **The Problem:** When purchasing digital goods or participating in a bounty, there is no clear "Preview" or "Sample" mechanism. Users are buying into a "black box."
*   **Recommendation:** Introduce a metadata field in the shop schema that allows for a "Preview" link or a "Sample" snippet, increasing trust and conversion.

## 4. Technical Debt in Ledgering
*   **The Problem:** The `data/ledger/*.tsv` files are growing linearly. While efficient for local storage, they lack a queryable API layer for the end-user to track their own earnings history.
*   **Recommendation:** Transition from raw TSV files to a lightweight SQLite or indexed JSON structure to allow users to visualize their "Earnings vs. Spending" ratio directly on their profile.

## 5. Conclusion
The SN shop is a powerful tool for value-for-value exchange, but it currently feels like a "developer-first" tool. By focusing on **price transparency**, **better signal filtering**, and **user-centric data visualization**, the platform can significantly increase the velocity of sats moving through the ecosystem.

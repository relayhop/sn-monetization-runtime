# Stacker News Shop Audit - Roast Report
**Date:** 2026-11-19
**Bounty Reference:** #1424

## 1. UX Friction Points
- **Payment Flow:** The transition from "Buy" to "Invoice" is abrupt. Users often experience a "dead air" moment while the Lightning invoice generates. Suggest adding a skeleton loader or a more descriptive status message.
- **Mobile Responsiveness:** On smaller viewports, the "Zap" button overlaps with the price tag in the shop grid, leading to accidental clicks.

## 2. Monetization Strategy
- **Lack of Bundling:** Currently, users purchase items individually. Introducing "Creator Bundles" (e.g., 5 items for a discounted rate) could increase the average transaction value.
- **Visibility:** The shop is currently siloed. Integrating "Shop Highlights" into the main feed (similar to how `sn_radar` detects opportunities) would significantly increase discovery.

## 3. Technical Recommendations
- **Invoice Polling:** The current polling interval for invoice settlement is slightly aggressive. Implementing a Webhook-based confirmation or a more efficient WebSocket subscription would reduce server load on the `sn-monetization-runtime`.
- **Error Handling:** When a payment fails due to route finding (common in Lightning), the error message is too technical for the average user. Suggest mapping these to human-readable suggestions (e.g., "Try a smaller amount" or "Check your node connectivity").

## 4. Conclusion
The shop is functional but feels like a secondary feature. To move from a "utility" to a "marketplace," the focus should shift towards reducing the cognitive load during the payment process and increasing the social proof of items being purchased in real-time.

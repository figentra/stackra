/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/analytics (the native `PosthogAnalyticsDriver`, which a
 *          mobile app's gen wiring loads for `analytics.driver: posthog`) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing; imports `core` and `contracts`, never `./react` or
 *           `./testing`. React Native is an optional peer, loaded by this entry only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; the STA-347 stand-in barrel decision.
 */
export { PosthogAnalyticsDriver } from "#native/drivers/posthog-analytics.driver";

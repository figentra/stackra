/**
 * Stackra file contract:
 * Purpose: `ANALYTICS_IDENTITY_STORAGE_KEY`, the key a device keeps the analytics identity under in the `prefs` area
 *          of `@stackra/storage`.
 * Boundary: internal; read and written by `StorageAnalyticsIdentityDriver` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 2: the prefs area); ADR 0298 (decision 5).
 */

/** The `prefs` key of the analytics identity. */
export const ANALYTICS_IDENTITY_STORAGE_KEY = "analytics.identity";

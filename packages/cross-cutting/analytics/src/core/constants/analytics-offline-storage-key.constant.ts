/**
 * Stackra file contract:
 * Purpose: `ANALYTICS_OFFLINE_STORAGE_KEY`, the key a device keeps undelivered analytics batches under in the `prefs`
 *          area of `@stackra/storage`.
 * Boundary: internal; read and written by `StorageAnalyticsOfflineQueueDriver` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 2: the prefs area); ADR 0298 (decision 5).
 */

/** The `prefs` key of the offline queue. */
export const ANALYTICS_OFFLINE_STORAGE_KEY = "analytics.offline";

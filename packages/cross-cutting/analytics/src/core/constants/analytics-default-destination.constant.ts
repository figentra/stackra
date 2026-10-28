/**
 * Stackra file contract:
 * Purpose: `ANALYTICS_DEFAULT_DESTINATION`, the instance name (`default`) a destination uses for the driver
 *          `AnalyticsConfig.driver` selects, which is also the one destination when `destinations` is empty.
 * Boundary: internal data; reserved, so the schema refuses it as a key of `drivers`.
 * Runtime: isomorphic
 * Governing contract: analytics gap 7 (stackra-407); ADR 0294 (decision 17: the default instance is the bare port).
 */

/** The name of the `driver` field's instance among the destinations. */
export const ANALYTICS_DEFAULT_DESTINATION = "default";

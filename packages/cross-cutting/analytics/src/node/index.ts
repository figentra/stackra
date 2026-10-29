/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/analytics until `stackra gen` writes the entry barrels
 *          (STA-339): `RelayTrackedAnalyticsListener`, which sends the pipeline's `analytics.tracked.v1` events to the
 *          server destinations, and
 *          `EraseAnalyticsPersonListener`, which deletes an erased subject's person at the vendor (STA-1582).
 * Boundary: names each re-export and declares nothing. Server only: browsers and React Native never import it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; STA-1512; STA-1582.
 */
export { EraseAnalyticsPersonListener } from "#node/listeners/erase-analytics-person.listener";
export { RelayTrackedAnalyticsListener } from "#node/listeners/relay-tracked-analytics.listener";

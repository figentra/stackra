/**
 * Stackra file contract:
 * Purpose: `CanarySettings`, the window and thresholds a canary is judged by.
 * Boundary: type only; `EDGE_PUBLISH_SETTINGS.canary` holds the defaults, a request may override any of them.
 * Runtime: node
 * Governing contract: owner decision D6; app-shells 16 (point 4).
 */

/** How a canary is judged. */
export type CanarySettings = {
  /** Hours the canary runs on the canary scopes before it may promote. */
  readonly windowHours: number;
  /** The highest error rate (errors / requests) the canary may show before it rolls back. */
  readonly maxErrorRate: number;
  /** Requests the canary must have served before its error rate counts. */
  readonly minRequests: number;
};

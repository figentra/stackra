/**
 * Stackra file contract:
 * Purpose: `CanarySettings`, the window and thresholds a canary is judged by.
 * Boundary: type only; `EDGE_PUBLISH_SETTINGS.canary` holds the defaults, a request may override any of them.
 * Runtime: node
 * Governing contract: owner decision D6; app-shells 16 (point 4).
 */

/** How a canary is judged. */
export type CanarySettings = {
  readonly windowHours: number;
  readonly maxErrorRate: number;
  readonly minRequests: number;
};

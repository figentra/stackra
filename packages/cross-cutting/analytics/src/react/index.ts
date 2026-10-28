/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/analytics (`useAnalytics`, `useAutocapture`) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useAnalytics } from "#react/analytics/use-analytics";
export { useAutocapture } from "#react/autocapture/use-autocapture";

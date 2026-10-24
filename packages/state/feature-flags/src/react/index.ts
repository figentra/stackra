/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/feature-flags (`useFlag`) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useFlag } from "#react/flag/use-flag";

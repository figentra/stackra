/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/consent (`useConsent` and the two shapes it returns) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { CategoryConsent } from "#react/consent/category-consent.type";
export type { ConsentState } from "#react/consent/consent-state.type";
export { useConsent } from "#react/consent/use-consent";

/**
 * Stackra file contract:
 * Purpose: `AnalyticsPropertyValue`, a scalar an event property is compared with in an `AnalyticsEventMatch`.
 * Boundary: a type only; a driver passes it as a filter value, never as query text.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */

/** A scalar an event property is compared with. */
export type AnalyticsPropertyValue = string | number | boolean;

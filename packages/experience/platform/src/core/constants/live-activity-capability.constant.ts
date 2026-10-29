/**
 * Stackra file contract:
 * Purpose: `LIVE_ACTIVITY_CAPABILITY`, the capability code a `LiveActivities` refusal names.
 * Boundary: a code only; it is not a `PlatformCapability` case until code asks `platform.has` about it.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0231 (snake_case codes); STA-1539.
 */

/** The capability code of a refused Live Activity. */
export const LIVE_ACTIVITY_CAPABILITY = "live_activity";

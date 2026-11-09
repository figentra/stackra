/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_MAX_ALLOW_DAYS`, the longest an allow-list entry may excuse a failure after it is added.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** The most days an allow-list entry's `expires` may fall after its `added`. */
export const CONSUMER_GATE_MAX_ALLOW_DAYS = 30;

/**
 * Stackra file contract:
 * Purpose: `CUSTOMER_DISPLAY_CHANNEL`, the `BroadcastChannel` name the till's `channel` customer display driver posts
 *          views on and the display window listens to, so the two windows of one origin agree on one spelling.
 * Boundary: data only. A BroadcastChannel never leaves the origin and the browser profile, so a view reaches only the
 *           app's own windows.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1 and open question 3).
 */

/** The channel name. */
export const CUSTOMER_DISPLAY_CHANNEL = "stackra.peripherals.customer_display";

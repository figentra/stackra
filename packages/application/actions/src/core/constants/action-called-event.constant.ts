/**
 * Stackra file contract:
 * Purpose: `ACTION_CALLED_EVENT`, the name of the generic analytics event `analytics: true` writes for each call:
 *          its key, outcome, duration and origin as properties.
 * Boundary: a constant; the name a destination sees in `AnalyticsDelivery.name`.
 * Runtime: isomorphic
 * Governing contract: gap analysis analytics 10 (stackra-410, STA-1512).
 */

/** The generic call event's name. */
export const ACTION_CALLED_EVENT = "action.called";

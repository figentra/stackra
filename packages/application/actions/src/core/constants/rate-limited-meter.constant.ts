/**
 * Stackra file contract:
 * Purpose: `RATE_LIMITED_METER`, the meter every rate-limited call feeds: the pipeline's rate-limit step writes one
 *          `count` usage event under this name per refusal, so limit hits are metered (ADR 0217 decision 2).
 * Boundary: a meter name, dotted snake_case. What a hit means (alerts, an upsell, a plan review) is data in the usage
 *           service, never here. Written only when an `EventOutbox` is bound.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: limits are metered); ADR 0216 (decisions 1 and 4); STA-1477.
 */

/** The meter of rate-limited (refused) calls. */
export const RATE_LIMITED_METER = "actions.rate_limited";

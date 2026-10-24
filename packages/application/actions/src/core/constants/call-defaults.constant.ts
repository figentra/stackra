/**
 * Stackra file contract:
 * Purpose: `CALL_DEFAULTS`, the request facts a call takes when its transport sends none: locale `en`, time zone
 *          `UTC`, currency `USD`, market `default`.
 * Boundary: a frozen constant read by `ActionPipeline` and the testing fakes; a host's transport always sends the
 *           request's own values, so these only reach jobs and tests.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1: locale, time zone and currency on the context).
 */

/** Defaults of the request facts. */
export const CALL_DEFAULTS = Object.freeze({
  locale: "en",
  timeZone: "UTC",
  currency: "USD",
  market: "default",
});

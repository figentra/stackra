/**
 * Stackra file contract:
 * Purpose: `ANALYTICS_SKIPPED`, the log event the pipeline writes when a call's output does not fit its declared
 *          `AnalyticsEvent`'s schema, so the event is skipped and the call still succeeds.
 * Boundary: a constant; the line carries the key, the call id and the event class's name, never the output.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: structured log events); STA-1512.
 */

/** The log event of a skipped analytics event. */
export const ANALYTICS_SKIPPED = "actions.analytics_skipped";

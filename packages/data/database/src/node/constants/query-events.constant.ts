/**
 * Stackra file contract:
 * Purpose: `QUERY_EVENTS`, the `Logger` event names of the query guard: a slow statement and a call over its query
 *          budget or repeat limit.
 * Boundary: internal to this package's node drivers; log event names, not domain events.
 * Runtime: node
 * Governing contract: data-layer gaps scale-performance 7 and 8 (stackra-282, STA-1400).
 */

/** The query guard's log events. */
export const QUERY_EVENTS = Object.freeze({
  /** A statement at or above `DatabaseConfig.queries.slow`. */
  slow: "database.slow_query",
  /** A call over its `queryBudget` or with a statement shape run more than `queries.repeats` times. */
  overrun: "database.query_budget_exceeded",
});

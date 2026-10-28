/**
 * Stackra file contract:
 * Purpose: `SLOW_QUERY_MS`, the default threshold in milliseconds from which a Cloud SQL server logs a statement
 *          (`log_min_duration_statement`) and its plan (`auto_explain.log_min_duration`), when the runway's
 *          `shared.database.slowQueryMs` does not set one.
 * Boundary: internal to this package. Server-side, above the application's own slow-statement log
 *           (`DatabaseConfig.queries.slow`, half a second), so the server log keeps the worst statements with plans.
 * Runtime: isomorphic
 * Governing contract: data-layer gap scale-performance 7 (stackra-282, STA-1400).
 */

/** One second. */
export const SLOW_QUERY_MS = 1000;

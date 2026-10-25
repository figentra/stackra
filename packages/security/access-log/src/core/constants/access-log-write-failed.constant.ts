/**
 * Stackra file contract:
 * Purpose: `ACCESS_LOG_WRITE_FAILED`, the logger event written when a sink rejects a record, so an operator alerts on
 *          one stable code.
 * Boundary: a module-level constant (SCREAMING_SNAKE, ADR 0231); the same code is `AccessLogWriteFailedError`'s and
 *           names the operator text `access_log::errors.access_log_write_failed.message`.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0184 (telemetry); ADR 0212 (open question 1: a failed
 *                     read audit does not block the read).
 */

/** The log event of a swallowed sink failure. */
export const ACCESS_LOG_WRITE_FAILED = "access_log_write_failed";

/**
 * Stackra file contract:
 * Purpose: `AUDIT_WRITE_SKIPPED`, the logger event written when `PostgresAuditTrailDriver` gets the entry of a call in no
 *          tenant, which its tenant-owned table cannot hold, so an operator alerts on one stable code.
 * Boundary: a module-level constant (SCREAMING_SNAKE, ADR 0231). The call is never failed for it: an audit write must
 *           not block a platform call; a host that audits platform calls binds the `outbox` driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0184 (telemetry); ADR 0465 (decision 4).
 */

/** The log event of an audit entry the Postgres store could not hold. */
export const AUDIT_WRITE_SKIPPED = "audit_write_skipped";

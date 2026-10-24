/**
 * Stackra file contract:
 * Purpose: `EVENT_NAME_PATTERN`, the short form an author writes once as an event's `name`: dotted snake_case
 *          segments, at least two (`order.paid`, `inbox_message.created`, `scan.barcode_scanned`).
 * Boundary: the authored part only; gen adds the module key and the version (`orders.order.paid.v1`). Internal: the
 *           integration and analytics event bases check their `name` with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (decision 1 and the 2026-10-23 note); ADR 0231 (machine codes are snake_case).
 */

/** Two or more snake_case segments joined by dots. */
export const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

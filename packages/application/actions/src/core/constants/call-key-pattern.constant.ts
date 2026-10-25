/**
 * Stackra file contract:
 * Purpose: `CALL_KEY_PATTERN`, the shape of a written action or query key: `<model>.<verb>` in snake_case
 *          (`order.create`, `inbox_message.mark_read`, `points.stats_today`).
 * Boundary: a constant read when a class is declared; gen adds the module key and the major version
 *           (`orders.order.create@1`) and never trusts a written prefix.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: an action or query key is written once); ADR 0231 (snake_case codes).
 */

/** Two snake_case segments joined by one dot. */
export const CALL_KEY_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*\.[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

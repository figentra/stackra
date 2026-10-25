/**
 * Stackra file contract:
 * Purpose: `OUTBOX_DRIVERS`, the names of the message and inbox drivers this package ships, each its file prefix: one
 *          `outbox.driver` value picks both stores.
 * Boundary: internal; read by the shipped config schema and the driver-name registry entries.
 * Runtime: isomorphic
 * Governing contract: ADR 0142 (drivers behind ports); ADR 0294 (decision 16).
 */

/** The `OutboxDriver` and `InboxDriver` drivers of this package, by name. */
export const OUTBOX_DRIVERS = ["postgres", "memory"] as const;

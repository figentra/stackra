/**
 * Stackra file contract:
 * Purpose: `OUTBOX_LOG_EVENTS`, the names of the log lines the relay writes.
 * Boundary: internal; snake_case after the package key, as every log event name is. A line carries ids, codes and
 *           counts, never a payload.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (machine codes are snake_case); ADR 0184 (logs).
 */

/** The relay's log events. */
export const OUTBOX_LOG_EVENTS = Object.freeze({
  /** A message failed its last delivery and was dead-lettered. */
  messageDead: "outbox.message_dead",
  /** A relay tick failed to read or record messages and paused. */
  relayFailed: "outbox.relay_failed",
});

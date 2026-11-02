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
  /** A change consumer failed its last attempt; its cursor stalled until it is resumed or replayed. */
  consumerStalled: "outbox.consumer_stalled",
  /** A relay tick failed to read or record messages and paused. */
  relayFailed: "outbox.relay_failed",
  /** The inbox ran a receipt as a platform call because the envelope's actor did not belong to its scope (ADR 0495). */
  actorDowngraded: "outbox.actor_downgraded",
  /** A cross-app delivery was refused for good or failed its last attempt and was dead-lettered (ADR 0511). */
  deliveryDead: "outbox.delivery_dead",
  /** A cross-app delivery was dropped because its subscriber is no longer configured. */
  deliveryDropped: "outbox.delivery_dropped",
  /** A cross-app relay tick failed to read or record deliveries and paused. */
  crossAppFailed: "outbox.cross_app_failed",
  /** The inbox refused a request whose sender it could not verify; the reason, never the body. */
  inboxRefused: "outbox.inbox_refused",
});

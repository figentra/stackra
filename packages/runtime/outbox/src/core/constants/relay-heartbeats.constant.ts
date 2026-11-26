/**
 * Stackra file contract:
 * Purpose: `RELAY_HEARTBEATS`, the heartbeat job names of this package's relays (ADR 0184 decision 4), as
 *          `@stackra/infra-observability` plans them: `outbox-relay` for `OutboxRelayService` and `cross-app-relay`
 *          for `CrossAppRelayService`. Each relay beats its name after every poll that completed.
 * Boundary: a frozen constant, internal to this package; the URL of each comes from `@stackra/queue`'s
 *           `HeartbeatConfig`, never from here.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 4: relays send heartbeats); ADR 0078 (decision 4: the relay).
 */

/** The relays' heartbeat job names. */
export const RELAY_HEARTBEATS = Object.freeze({
  /** `OutboxRelayService`: one beat per poll. */
  outbox: "outbox-relay",
  /** `CrossAppRelayService`: one beat per poll. */
  crossApp: "cross-app-relay",
});

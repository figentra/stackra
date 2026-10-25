/**
 * Stackra file contract:
 * Purpose: `OUTBOX_DEFAULTS`, the relay's fixed settings: how many messages one tick takes, how many deliveries a
 *          message gets before it is dead-lettered and with which backoff, how often an idle relay polls, and the lock
 *          that keeps one relay running per service.
 * Boundary: internal. A one-second poll keeps the lag of a committed change under ADR 0221's five seconds; ten
 *           exponential attempts from ten seconds (capped at an hour) span about four hours before a dead letter.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4); ADR 0221 (decision 5: under five seconds of lag); ADR 0148 (backoff).
 */
import { Duration } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";

/** The relay defaults. */
export const OUTBOX_DEFAULTS = Object.freeze({
  /** Messages one tick delivers at most. */
  batchSize: 100,
  /** Deliveries a message gets; the last failure dead-letters it. */
  attempts: 10,
  /** The wait between failed deliveries. */
  backoff: Backoff.Exponential,
  /** The pause of an idle or locked-out relay. */
  pollInterval: Duration.seconds(1),
  /** The lock one relay of the service holds per tick. */
  lockKey: "outbox.relay",
  /** How long the relay lock outlives a relay that stopped renewing it. */
  lockTtl: Duration.minutes(1),
});

/**
 * Stackra file contract:
 * Purpose: `CROSS_APP_DEFAULTS`, the cross-app relay's fixed settings: how many deliveries one tick takes, how many
 *          attempts a delivery gets with which backoff, how long one request may take, how often an idle relay polls,
 *          its lock, the inbox route, the replay window an inbox allows, and the envelope version it sends.
 * Boundary: internal. The attempts and the backoff match the outbox relay's, so a cross-app delivery is given up about
 *           as late as an in-app one; the request timeout keeps one slow subscriber from holding a tick.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12, 13 and 18, amendment of 2026-11-02); ADR 0078 (decision 4); ADR 0148.
 */
import { Backoff, Duration } from "@stackra/contracts";

/** The cross-app relay defaults. */
export const CROSS_APP_DEFAULTS = Object.freeze({
  /** Deliveries one tick sends at most. */
  batchSize: 100,
  /** Attempts a delivery gets; the last failure dead-letters it. */
  attempts: 10,
  /** The curve between failed attempts, under the queue's `JOB_BACKOFF` waits. */
  backoff: Backoff.Exponential,
  /** How long one request may take before it counts as failed. */
  requestTimeout: Duration.seconds(10),
  /** The pause of an idle or locked-out relay. */
  pollInterval: Duration.seconds(1),
  /** The lock one cross-app relay of the service holds per tick. */
  lockKey: "outbox.cross-app",
  /** How long the lock outlives a relay that stopped renewing it. */
  lockTtl: Duration.minutes(1),
  /** The consumer's inbox route, appended to a subscriber's origin. */
  inboxPath: "/events/inbox",
  /** How far a request's signing time may be from the inbox's clock, either way. */
  replayWindow: Duration.minutes(5),
  /** The version of the envelope's form. */
  envelopeVersion: 1,
  /** The largest body an inbox reads; a larger one is refused before it is verified. */
  maxBodyBytes: 1_048_576,
});

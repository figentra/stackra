/**
 * Stackra file contract:
 * Purpose: `CROSS_APP_DEFAULTS`, the cross-app relay's fixed settings: its lock, how many deliveries of each
 *          subscriber one tick takes and how long it leases them, the inbox path on a consumer's origin, the request
 *          timeout, the envelope version it sends and the inbox's signature window. Attempts, backoff and poll interval
 *          are the outbox's (`OUTBOX_DEFAULTS`).
 * Boundary: internal. Its own lock key, so the cross-app relay never waits on the outbox relay's tick. The lock is held
 *           only while a tick leases its deliveries; the lease outlasts one subscriber's whole batch sent in order at
 *           the timeout each, so no other relay takes a row while it is in flight, and a crashed relay's rows come
 *           back when it expires.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12, 16 and 18, amendment of 2026-11-02); ADR 0149 (one runner under a lock).
 */
import { Duration } from "@stackra/contracts";

/** The cross-app relay defaults. */
export const CROSS_APP_DEFAULTS = Object.freeze({
  /** The lock one cross-app relay of the service holds per tick. */
  lockKey: "outbox.cross-app",
  /** Deliveries of each subscriber one tick takes at most. */
  batchSize: 10,
  /** How long a taken delivery is hidden from other ticks: the batch at the timeout each, plus one. */
  lease: Duration.seconds(110),
  /** The route every consumer's inbox answers on. */
  inboxPath: "/events/inbox",
  /** How long one delivery request may take. */
  timeout: Duration.seconds(10),
  /** The `envelopeVersion` the relay sends. */
  envelopeVersion: 1,
  /** How far a signature's timestamp may be from the inbox's clock, either way. */
  signatureWindow: Duration.minutes(5),
});

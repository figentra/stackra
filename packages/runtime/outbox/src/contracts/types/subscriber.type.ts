/**
 * Stackra file contract:
 * Purpose: `Subscriber`, one consumer in another app that the producer delivers events to: its member key, its inbox
 *          origin and the wire names it takes.
 * Boundary: a type only; the shape of one entry of runway's `events.subscribers`. Public facts, no secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 17, amendment of 2026-11-02).
 */

/** A cross-app consumer of this producer's events. */
export interface Subscriber {
  /** The consumer's member key (`billing`). */
  readonly member: string;

  /** The consumer's origin (`https://billing.example.com`); the relay posts to its `/events/inbox`. */
  readonly inbox: string;

  /** The versioned wire names it takes (`payments.payment.captured.v1`). */
  readonly events: readonly string[];
}

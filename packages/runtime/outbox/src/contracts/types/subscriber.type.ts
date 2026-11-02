/**
 * Stackra file contract:
 * Purpose: `Subscriber`, a consumer in another app that a producer's cross-app relay delivers to: its member key, the
 *          origin of its inbox and the integration events it takes, by wire name.
 * Boundary: a type only, JSON-safe; what a `SubscriberSource` lists. No secret: a subscriber verifies with the
 *           producer's public key from its pinned contract.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 17, amendment of 2026-11-02).
 */

/** A consumer a producer delivers cross-app events to. */
export interface Subscriber {
  /** The consumer's member key (`billing`). */
  readonly member: string;

  /** The origin of its inbox (`https://billing.example.com`); the inbox route is appended. */
  readonly inbox: string;

  /** The wire names it takes (`payments.payment.captured.v1`). */
  readonly events: readonly string[];
}

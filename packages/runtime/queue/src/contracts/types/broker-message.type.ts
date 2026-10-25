/**
 * Stackra file contract:
 * Purpose: `BrokerMessage`, one message a `BrokerPublisher` hands to a broker topic: its id, which subscribers
 *          deduplicate by, and its JSON body.
 * Boundary: a type only, JSON-safe: the body is plain data (an integration event envelope, a job), never a class
 *           instance. A broker delivers at least once, so every subscriber treats the id as its deduplication key.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 3: Encore Pub/Sub and Valkey drivers); ADR 0142 (decision 1: transports are
 *                     drivers); ADR 0141 (decision 2: ids).
 */

/** A message for a broker topic. */
export interface BrokerMessage {
  /** Unique per message; subscribers deduplicate by it. */
  readonly id: string;

  /** The JSON body. */
  readonly body: unknown;
}

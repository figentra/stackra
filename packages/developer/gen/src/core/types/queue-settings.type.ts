/**
 * Stackra file contract:
 * Purpose: `QueueSettings`, one queue of one environment of a service runway (`environments.<env>.queues.<queue>`):
 *          the visibility timeout and whether a delivery that keeps failing ends in a dead-letter queue, as gen reads
 *          them to set the queue's Encore subscription (STA-2050).
 * Boundary: a type only; both fields optional, as `@stackra/runway`'s `SERVICE_ENVIRONMENT_SCHEMA` leaves them.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (runway v3: a member's runway sizes its own queues); ADR 0148 (decisions 1, 3 and 6).
 */

/** One queue's settings in one runway environment. */
export interface QueueSettings {
  /** How long a delivery may run before the broker hands it out again, in seconds. */
  readonly visibilityTimeoutSeconds?: number;

  /** Whether a delivery that keeps failing ends in a dead-letter queue. */
  readonly dlq?: boolean;
}

/**
 * Stackra file contract:
 * Purpose: `QueuedRun`, what `queue` answers: the queued run and its conversation, to poll or subscribe to.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 2: `queue`); STA-781.
 */

/** A queued run. */
export interface QueuedRun {
  /** The run. */
  readonly runId: string;

  /** The conversation. */
  readonly conversationId: string;
}

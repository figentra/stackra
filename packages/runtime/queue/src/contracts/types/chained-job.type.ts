/**
 * Stackra file contract:
 * Purpose: `ChainedJob`, one link still to run in a job chain: the job key of the next action and its input.
 * Boundary: a type only. `QueueService.chain` stores the rest of the chain on the first job; when a link is done the
 *           worker queues the next one with the links after it, in the same scope and for the same origin. A link that
 *           is dead-lettered or dropped stops the chain, and its dead letter keeps the rest, so a redrive resumes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: chains).
 */

/** A link of a job chain. */
export interface ChainedJob {
  /** The key of the action the link runs. */
  readonly key: string;

  /** The action's input, JSON-serialisable. */
  readonly input: unknown;
}

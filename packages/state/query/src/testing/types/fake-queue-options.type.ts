/**
 * Stackra file contract:
 * Purpose: `FakeQueueOptions`, what a test seeds a fake queue with (`fakeQueue({ pending: 2 })`): how many calls wait
 *          and how many conflicts need a person.
 * Boundary: a type only; both counts default to zero.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0294 (decision 8: named types).
 */

/** The seed of a fake queue. */
export interface FakeQueueOptions {
  /** Calls waiting for the network; `0` by default. */
  readonly pending?: number;

  /** Conflict records waiting for a person; `0` by default. */
  readonly conflicts?: number;
}

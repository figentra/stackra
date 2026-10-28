/**
 * Stackra file contract:
 * Purpose: `JobPlacement`, where a built job belongs beyond its push options: the batch it is queued in and the chain
 *          links to queue after it.
 * Boundary: a type only, internal to this package; the last argument of `buildJob`.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: batches and chains).
 */
import type { ChainedJob } from "#contracts/index";

/** A job's batch and chain. */
export interface JobPlacement {
  /** The batch it is queued in. */
  readonly batchId?: string;

  /** The links to queue after it. */
  readonly chain?: readonly ChainedJob[];
}

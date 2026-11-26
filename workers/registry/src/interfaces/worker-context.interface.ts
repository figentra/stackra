/**
 * Stackra file contract:
 * Purpose: `WorkerContext`: the part of the Workers execution context the registry uses.
 * Boundary: types only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 2).
 */

/** The Worker's execution context. */
export interface WorkerContext {
  /** Keeps the Worker alive until `task` settles, after the response is sent. */
  readonly waitUntil: (task: Promise<unknown>) => void;
}

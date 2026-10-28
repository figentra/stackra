/**
 * Stackra file contract:
 * Purpose: `WorkerExecutionContext`, the Worker's execution context as @stackra/app reads it: the members of the
 *          runtime's `ExecutionContext` a request needs (`waitUntil` for work after the response).
 * Boundary: a type only, structurally the runtime's own, so this package needs no Workers type package; the member's
 *           `wrangler types` declarations stay the source of the full type.
 * Runtime: worker
 * Governing contract: ADR 0284 (Workers members); ADR 0297 (web runtime on Workers).
 */

/** The execution context of one Worker invocation. */
export interface WorkerExecutionContext {
  /** Keeps the isolate alive until `promise` settles, after the response is sent. */
  waitUntil: (promise: Promise<unknown>) => void;

  /** Lets the request fall through to the origin when the Worker throws. */
  passThroughOnException: () => void;

  /** The props a service binding or an entrypoint passed. */
  readonly props: unknown;
}

/**
 * Stackra file contract:
 * Purpose: `WorkerRequest<E>`, one request as the Worker app hands it to the member's `context` factory: the Fetch
 *          request, the validated server env, the execution context, the request container and the reporter.
 * Boundary: a type only. The generated `context.ts` copies these into React Router's typed context keys.
 * Runtime: worker
 * Governing contract: ADR 0295 (decision 8); ADR 0297 (web runtime on Workers); ADR 0263 (decision 5).
 */
import type { Container } from "@stackra/container";
import type { ErrorReporter } from "@stackra/errors/contracts";

import type { WorkerExecutionContext } from "#worker/types/worker-execution-context.type";

/** One request inside the Worker app. */
export interface WorkerRequest<E> {
  /** The incoming request. */
  readonly request: Request;

  /** The member's server env, validated by the `env` option for this request. */
  readonly env: E;

  /** The Worker's execution context, for `waitUntil`. */
  readonly ctx: WorkerExecutionContext;

  /** A request container over the booted app: singletons shared, request instances its own. */
  readonly container: Container;

  /** The error reporter; every server error reaches it once. */
  readonly reporter: ErrorReporter;
}

/**
 * Stackra file contract:
 * Purpose: `WorkerApp`, what `createApp` from `@stackra/app/worker` resolves to: the `fetch` the Worker entry's
 *          exported handler calls.
 * Boundary: a type only.
 * Runtime: worker
 * Governing contract: ADR 0295 (decision 8).
 */
import type { WorkerExecutionContext } from "#worker/types/worker-execution-context.type";

/** A Worker app. */
export interface WorkerApp {
  /** Answers one request; never rejects (a throw is reported and answered with the crash page). */
  fetch(request: Request, env: unknown, ctx: WorkerExecutionContext): Promise<Response>;
}

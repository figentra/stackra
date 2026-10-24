/**
 * Stackra file contract:
 * Purpose: `PushOptions`, the third argument of `QueueService.push`: who queued the job, the scope it runs in, the
 *          Idempotency-Key of a queued call, and the call that caused it.
 * Boundary: a type only. `origin` is the verified caller and `scope` the authenticated scope, never request input. A
 *           queued call of an action without a `job` option needs `origin`: it runs as that caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4: the queued call runs at least once, deduplicated by its Idempotency-Key);
 *                     ADR 0098 (the typed actor); ADR 0327 and ADR 0323 (a scope is a `ScopeRef`).
 */
import type { Actor, ScopeRef } from "@stackra/contracts";

/** How a job is queued. */
export interface PushOptions {
  /** The caller whose call queues the job; a `job` action runs on its behalf, any other action as it. */
  readonly origin?: Actor;

  /** The scope the job runs in, set as the database scope session around each attempt. */
  readonly scope?: ScopeRef;

  /** The Idempotency-Key the queued call was sent with; every attempt runs under it. */
  readonly idempotencyKey?: string;

  /** The id of the call that queues the job, kept with it for tracing. */
  readonly causedBy?: string;
}

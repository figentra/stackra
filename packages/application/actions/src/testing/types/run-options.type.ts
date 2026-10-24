/**
 * Stackra file contract:
 * Purpose: `RunOptions`, the third argument of `run(...)`: who calls (`as`, usually from `actors.*()` of
 *          `@stackra/iam/testing`), the Idempotency-Key, and the request facts a test wants other than the defaults.
 * Boundary: a type only; `run` hands it to the pipeline as `CallOptions` with `as` as the actor.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0136 (decision 1).
 */
import type { Actor } from "@stackra/contracts";

import type { CallOptions } from "#core/index";

/** How a test calls an action or query. */
export type RunOptions = Omit<CallOptions, "actor"> & {
  /** The caller. */
  readonly as: Actor;
};

/**
 * Stackra file contract:
 * Purpose: `CURRENT_WORKFLOWS`, the engine of the testing app compiled last, with its clock and how far
 *          `advanceClock` has moved the engine's time, for `runWorkflow`, `signal` and `app.workflows`.
 * Boundary: module state of the test process, written only by the plugin on each `compile()`.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the queue precedent (`CURRENT_QUEUE`).
 */
import type { Clock } from "@stackra/contracts";

import type { NativeWorkflowRunnerDriver } from "#core/index";

/** The current testing app's engine. */
export const CURRENT_WORKFLOWS: {
  value:
    | { readonly runner: NativeWorkflowRunnerDriver; readonly clock: Clock; offset: number }
    | undefined;
} = { value: undefined };

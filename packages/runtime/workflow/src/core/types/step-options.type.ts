/**
 * Stackra file contract:
 * Purpose: `StepOptions<W>`, the options of `@Step`: the steps it runs after, the condition it runs on, its heartbeat,
 *          retries (the contracts `RetryPolicy`, stackra-223), the signal or event it waits for with the correlation that picks it, and its timeout.
 * Boundary: a type only; `W` types the callbacks (`@Step<MyWorkflow>({ correlate: (run) => ... })`). `when` and
 *           `correlate` are pure functions of the run (the purity lint, ADR 0151): no clock, no I/O. Durations are text
 *           (`"15m"`). With `waitFor`, `timeout` bounds the wait; without it, it aborts the step's `abortSignal`. An
 *           awaited event is a trigger building block with a `correlate` (`registerBlocks`): the explorer holds each
 *           occurrence under that correlation, and the wait takes the one whose correlation matches its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 18: the option list); ADR 0152 (decision 1: `waitFor: event | signal`; 0294
 *                     note: waits, timeouts, heartbeats).
 */
import type { AnyClass } from "@stackra/container";
import type { RetryPolicy } from "@stackra/contracts";
import type { Event } from "@stackra/events";

import type { Signal } from "#core/bases/signal.base";
import type { Run } from "#core/types/run.type";

/** The options of one step. */
export interface StepOptions<W> {
  /** Steps that must be done first, for a graph that is not a line; declaration order otherwise. */
  readonly after?: readonly string[];

  /** Runs the step only when true; a false step is skipped and has no result. */
  readonly when?: (run: Run<W>) => boolean;

  /** The longest gap between two `ctx.heartbeat(...)` calls; a step that misses one is aborted and retried. */
  readonly heartbeat?: string;

  /**
   * Attempts (a whole number from 1) and the `Backoff` curve (exponential when absent) of the shared `RetryPolicy`;
   * one attempt when absent. The waits are the queue's `JOB_BACKOFF`. A refusal that is not retryable fails the
   * step at once whatever the budget.
   */
  readonly retry?: Pick<RetryPolicy, "attempts" | "backoff">;

  /** The signal or event the run parks for before this step; the step receives it as its third argument. */
  readonly waitFor?: AnyClass<Signal> | AnyClass<Event>;

  /** The value a sent signal's (or a held event's) correlation must equal to resume this run. */
  readonly correlate?: (run: Run<W>) => string | object;

  /** How long the wait may take (with `waitFor`), else how long one attempt may take. */
  readonly timeout?: string;
}

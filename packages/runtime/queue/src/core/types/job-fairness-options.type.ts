/**
 * Stackra file contract:
 * Purpose: `JobFairnessOptions`, the fields of an action's `job` option that schedule it fairly: its `priority`, the
 *          `scopeConcurrency` cap on its running jobs per scope, and a `throttle` towards a third party.
 * Boundary: a type only, read by `readJob` from the action's recorded `job` option next to @stackra/actions'
 *           `JobOptions`, which does not list these fields yet (an integration ask of stackra-278); until it does, an
 *           action passes them through a typed constant. `PushOptions.priority` overrides the priority per push.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 2: fair queues, per-scope concurrency, throttles); ADR 0323 (scope vocabulary).
 */
import type { JobThrottle } from "#contracts/index";

/** The fairness fields of a `job` option. */
export interface JobFairnessOptions {
  /** Higher runs first among due jobs of its queue, a whole number; `0` when absent. */
  readonly priority?: number;

  /** The most jobs of this action's queue and one scope that run at once, a whole number from 1. */
  readonly scopeConcurrency?: number;

  /** At most `perMinute` attempts a minute, counted in bucket `key`. */
  readonly throttle?: JobThrottle;
}

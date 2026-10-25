/**
 * Stackra file contract:
 * Purpose: `WorkflowOptions<I>`, the options of `Workflow({ ... })`: the event that starts a run, the key that keeps
 *          one run per business fact, and the time a whole run may take.
 * Boundary: a type only. A workflow an action starts writes `Workflow<Input>({ timeout })` and names its input; one an
 *           event starts writes `startOn`, whose class gives the input. Durations are text (`"20m"`, `"PT20M"`), read
 *           with @stackra/validation's `duration` when the class is defined.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 3, 4 and 25: `startOn` takes a class of another kind); ADR 0101 (0294 note:
 *                     an event starts a workflow only through `startOn`); ADR 0152 (0294 note: a run timeout).
 */
import type { AnyClass } from "@stackra/container";

/** The options of a workflow. */
export interface WorkflowOptions<I> {
  /** The event class whose every occurrence starts a run with the event as its input. */
  readonly startOn?: AnyClass<I & object>;

  /**
   * The run's business key, from its input: a start whose key already has a run starts nothing, so a redelivered or
   * repeated event never runs the workflow twice. Needs `startOn`.
   */
  readonly correlate?: (input: I) => string | object;

  /** How long a whole run may take, waits included (`"20m"`); past it the run compensates and refuses. */
  readonly timeout?: string;
}

/**
 * Stackra file contract:
 * Purpose: `WorkflowPlan`, a workflow class (or an automation document) as the engine runs it: its key, its version,
 *          its steps in run order, its run timeout in milliseconds, and the event and correlation a `startOn` run uses.
 * Boundary: a type only, internal; `planOf` builds it once per class, `documentPlan` per document. Coded workflows and
 *           automation documents compile to this one graph format (ADR 0152 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 18); ADR 0151 (0294 note: the class is the graph); ADR 0152 (decisions 2 and
 *                     5).
 */
import type { AnyClass } from "@stackra/container";

import type { StepPlan } from "#core/types/step-plan.type";

/** The plan of one workflow class. */
export interface WorkflowPlan {
  /** The registered key, else the class name. */
  readonly key: string;

  /** The version a run of it is pinned to. */
  readonly version: number;

  /** The steps in the order they run: declaration order, moved only by `after`. */
  readonly steps: readonly StepPlan[];

  /** The run timeout, in milliseconds. */
  readonly timeout?: number;

  /** The event class that starts a run. */
  readonly startOn?: AnyClass;

  /** The run's business key, from its input. */
  readonly correlate?: (input: never) => string | object;
}

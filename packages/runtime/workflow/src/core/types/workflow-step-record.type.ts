/**
 * Stackra file contract:
 * Purpose: `WorkflowStepRecord`, one step of a run as the journal keeps it: its status and attempts, its stored result,
 *          its last failure, its reported progress, and, while it waits, the signal and correlation it waits on and
 *          when the wait ends.
 * Boundary: a type only; results and progress are JSON. A step gets a record when it first starts, parks, is skipped or
 *           times out, so a run lists exactly the steps it reached, in that order.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decision 1: run, step, status, attempt); ADR 0152 (0294 note: waits, heartbeats).
 */
import type { Json } from "@stackra/contracts";

import type { StepStatus } from "#core/enums/step-status.enum";
import type { WorkflowError } from "#core/types/workflow-error.type";

/** One step of a run. */
export interface WorkflowStepRecord {
  /** The step's method name. */
  readonly name: string;

  /** Where it stands. */
  readonly status: StepStatus;

  /** Attempts made so far. */
  readonly attempts: number;

  /** Its result, once done; absent for a step that returned nothing. */
  readonly result?: unknown;

  /** Its last failure, or its undo's failure. */
  readonly error?: WorkflowError;

  /** What it last reported through `ctx.heartbeat(...)`. */
  readonly progress?: Json;

  /** The key of the signal it waits for. */
  readonly signal?: string;

  /** The correlation that signal must carry. */
  readonly correlation?: string;

  /** When its wait times out. */
  readonly wakeAt?: Date;

  /** When it first started or parked. */
  readonly startedAt: Date;

  /** When it ended. */
  readonly endedAt?: Date;
}

/**
 * Stackra file contract:
 * Purpose: `WorkflowRun`, one run as the journal keeps it and `app.workflows.last(W)` returns it: its workflow key and
 *          pinned version, the automation it runs (a document run of a stored automation), status, input, starting
 *          call, scope, failure, times and steps.
 * Boundary: a type only; the input is JSON. The scope is the one the starting call ran in; every step runs in it.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decision 1: the journal); ADR 0152 (decision 2: the version pin; decision 4: inspect
 *                     is an operation); ADR 0327 and
 *                     ADR 0323 (a scope is a `ScopeRef`).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";
import type { RunOrigin } from "#core/types/run-origin.type";
import type { WorkflowError } from "#core/types/workflow-error.type";
import type { WorkflowStepRecord } from "#core/types/workflow-step-record.type";

/** One run of a workflow. */
export interface WorkflowRun {
  /** The run's id. */
  readonly id: PublicId<"wfr">;

  /** The workflow's registered key, else its class name. */
  readonly workflow: string;

  /** The version it started on and resumes on; absent reads as 1 (a run journaled before versions). */
  readonly version?: number;

  /** The automation a document run runs, so the journal lists an automation's runs; absent otherwise. */
  readonly automation?: PublicId<"wfa">;

  /** Where it stands. */
  readonly status: WorkflowRunStatus;

  /** The input it started with, as JSON. */
  readonly input: unknown;

  /** The call that started it. */
  readonly origin: RunOrigin;

  /** The scope it runs in; absent for a platform run. */
  readonly scope?: ScopeRef;

  /** Why it compensated or failed. */
  readonly error?: WorkflowError;

  /** When it started. */
  readonly startedAt: Date;

  /** When its timeout passes. */
  readonly deadlineAt?: Date;

  /** When it ended. */
  readonly endedAt?: Date;

  /** The steps it reached, in the order it reached them. */
  readonly steps: readonly WorkflowStepRecord[];
}

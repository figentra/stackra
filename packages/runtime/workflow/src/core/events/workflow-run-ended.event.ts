/**
 * Stackra file contract:
 * Purpose: `WorkflowRunEnded`, recorded when a run reaches an end: completed, compensated, failed (an undo failed) or
 *          cancelled, with the error it ended on. A host listens to record the outcome and count failures (the OS
 *          automation ledger's `record_outcome` and its failure pause).
 * Boundary: a domain event, dispatched in process once the run's last row commits, with the run's caller and scope in
 *           its metadata; a listener that fails is recorded by the bus and never changes the run. It carries no input
 *           and no result. It registers this package's own schema when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (decision 4); ADR 0102 (decisions 1 and 2); ADR 0305 (rules 19 and 21); ADR 0294
 *                     (decision 23).
 */
import type { PublicId } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { WORKFLOW_RUN_ENDED_SCHEMA } from "#core/constants/workflow-run-ended-schema.constant";
import type { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";
import type { WorkflowError } from "#core/types/workflow-error.type";

/**
 * One run ended.
 *
 * @example
 * export class RecordOutcomeOnRunEndedListener extends Listener {
 *   async handle(event: WorkflowRunEnded): Promise<void> {
 *     if (event.automationId !== undefined) await this.runs.recordOutcome(event.runId, event.status, event.error);
 *   }
 * }
 */
export class WorkflowRunEnded extends DomainEvent {
  /** The id of the run that ended. */
  runId!: PublicId<"wfr">;

  /** Its workflow key. */
  workflow!: string;

  /** The version it ran on. */
  version!: number;

  /** The automation it ran; absent for a coded run or a plan. */
  automationId?: PublicId<"wfa">;

  /** How it ended: `completed`, `compensated`, `failed` or `cancelled`. */
  status!: WorkflowRunStatus;

  /** The error it compensated, failed or was cancelled with; absent when it completed. */
  error?: WorkflowError;
}

registerSchemas([[WorkflowRunEnded, WORKFLOW_RUN_ENDED_SCHEMA]]);

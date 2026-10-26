/**
 * Stackra file contract:
 * Purpose: `WorkflowRunStarted`, recorded when the engine starts a run, coded or document, triggered, manual or a
 *          plan: the run, its workflow key and pinned version, and the automation it runs when it runs one. A host
 *          listens to record and meter the run (the OS automation ledger's `record_start`).
 * Boundary: a domain event, dispatched in process once the run's first row commits, with the run's caller and scope in
 *           its metadata; a listener that fails is recorded by the bus and never fails the run. It carries no input.
 *           It registers this package's own schema when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (decision 4: inspect, retry and cancel are operations); ADR 0102 (decision 1); ADR 0305
 *                     (rules 19 and 21); ADR 0294 (decision 23: an event, never a backend hook).
 */
import type { PublicId } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { WORKFLOW_RUN_STARTED_SCHEMA } from "#core/constants/workflow-run-started-schema.constant";

/**
 * One run started.
 *
 * @example
 * export class RecordStartOnRunStartedListener extends Listener {
 *   async handle(event: WorkflowRunStarted): Promise<void> {
 *     if (event.automationId !== undefined) await this.runs.recordStart(event.automationId, event.runId);
 *   }
 * }
 */
export class WorkflowRunStarted extends DomainEvent {
  /** The run. */
  runId!: PublicId<"wfr">;

  /** Its workflow key (`workflow.document` for an automation or a plan). */
  workflow!: string;

  /** The version it is pinned to. */
  version!: number;

  /** The automation it runs; absent for a coded run or a plan. */
  automationId?: PublicId<"wfa">;
}

registerSchemas([[WorkflowRunStarted, WORKFLOW_RUN_STARTED_SCHEMA]]);

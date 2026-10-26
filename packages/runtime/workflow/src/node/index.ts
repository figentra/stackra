/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/workflow (the Postgres journal, the boot explorer, the
 *          `Automation` model with `AutomationService` and the types it reads, the `ServiceAckSet` model with
 *          `ServiceAckService`, and the `Checklist` and `ChecklistProgress` models with `ChecklistService`) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: the journal reaches Postgres through
 *           @stackra/database. The migration is found by its path, as every migration is, so it is not re-exported.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { PostgresWorkflowJournalDriver } from "#node/drivers/postgres-workflow-journal.driver";
export { Automation } from "#node/models/automation.model";
export { Checklist } from "#node/models/checklist.model";
export { ChecklistProgress } from "#node/models/checklist-progress.model";
export { ServiceAckSet } from "#node/models/service-ack-set.model";
export { AutomationService } from "#node/services/automation.service";
export { ChecklistService } from "#node/services/checklist.service";
export { ServiceAckService } from "#node/services/service-ack.service";
export type { AutomationRevision } from "#node/types/automation-revision.type";
export type { TriggeredAutomation } from "#node/types/triggered-automation.type";
export { WorkflowExplorer } from "#node/workflow.explorer";

/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/workflow (the Postgres journal and the boot explorer) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: the journal reaches Postgres through
 *           @stackra/database. The migration is found by its path, as every migration is, so it is not re-exported.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { PostgresWorkflowJournalDriver } from "#node/drivers/postgres-workflow-journal.driver";
export { WorkflowExplorer } from "#node/workflow.explorer";

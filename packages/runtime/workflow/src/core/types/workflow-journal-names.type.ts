/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `workflow.WorkflowJournal`, so `DriverName<WorkflowJournal>` narrows to the
 *          journals this package ships.
 * Boundary: a module augmentation only; gen writes the same entry for a member's own drivers.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); the queue and outbox precedent.
 */
import type { WORKFLOW_JOURNALS } from "#core/constants/workflow-journals.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `WorkflowJournal` (`postgres`, `memory`). */
    "workflow.WorkflowJournal": (typeof WORKFLOW_JOURNALS)[number];
  }
}

/**
 * Stackra file contract:
 * Purpose: `ChecklistViewStep`, one step of a checklist as one user sees it: the template step and whether it is done
 *          (by the scope for a scope step, by that user for a user step).
 * Boundary: a type only; `checklistView` builds it. The console's checklist component renders it.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decisions 1 and 2).
 */
import type { ChecklistTemplate } from "#core/types/checklist-template.type";

/** One step as seen. */
export type ChecklistViewStep = ChecklistTemplate["steps"][number] & {
  /** Whether it is done for the viewer. */
  readonly done: boolean;
};

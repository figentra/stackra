/**
 * Stackra file contract:
 * Purpose: `ChecklistView`, a checklist as one user sees it: its key, its visible steps in order, how many are done and
 *          whether all are.
 * Boundary: a type only; `checklistView` builds it from the template, the scope's customization and the progress.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decisions 1 and 2).
 */
import type { ChecklistViewStep } from "#core/types/checklist-view-step.type";

/** A checklist as seen. */
export interface ChecklistView {
  /** The template key (`workflow-template:commerce:onboarding`). */
  readonly key: string;

  /** The visible steps: locked ones in their template place, the others in the scope's order. */
  readonly steps: readonly ChecklistViewStep[];

  /** How many visible steps are done. */
  readonly done: number;

  /** Whether every visible step is done. */
  readonly complete: boolean;
}

/**
 * Stackra file contract:
 * Purpose: `ChecklistProgress`, one completed checklist step: the checklist, the step, whose progress it is (the scope's
 *          id for a scope step, the user's id for a user step) and who completed it.
 * Boundary: data only. Key `workflow.checklist_progress`, table `workflow.checklist_progress`, under forced row-level
 *           security on `scope_path`. One row per checklist, step and owner; a step is never un-done. Rows are added
 *           through `ChecklistService.complete`, never with `new`.
 * Runtime: node
 * Governing contract: ADR 0424 (decision 2: progress per scope and per user); ADR 0294 (decisions 4, 11, 20 and 27).
 */
import type { Actor, PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** One completed step. Traits add `id` and the timestamps (`createdAt` is when it was completed). */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class ChecklistProgress extends Model.with(HasPublicId("wfp"), Timestamps) {
  /** The scope node the progress belongs to. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The scope's checklist. */
  checklistId!: PublicId<"wfc">;

  /** The step key. */
  step!: string;

  /** Whose progress: the scope's id for a scope step, the user's id for a user step. */
  ownerId!: string;

  /** Who completed it: the actor's kind and public id. */
  completedBy!: Actor;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
/** The insert-time side of `ChecklistProgress`: which fields `CrudService.insert` may leave out. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface ChecklistProgress {
  /** The fields that have a default, so an insert may leave them out. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}

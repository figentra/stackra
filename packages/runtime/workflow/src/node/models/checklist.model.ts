/**
 * Stackra file contract:
 * Purpose: `Checklist`, a scope's copy of a product checklist (onboarding, exit, fix list): the template key and the
 *          seeded template version it shows, the scope's customization (unlocked steps hidden and reordered), the
 *          industry profile applied at sign-up, and whether the scope has customized it since.
 * Boundary: data only. Key `workflow.checklist`, table `workflow.checklists`, under forced row-level security on
 *           `scope_path`. The template is the seed document as seeded, kept on the row so a new pack version moves it
 *           forward without touching the customization. Progress is `ChecklistProgress`. Rows are added through
 *           `ChecklistService.seed`, never with `new`.
 * Runtime: node
 * Governing contract: ADR 0424 (decisions 1, 2 and 4); config-model sections 5 and 6; ADR 0294 (decisions 4, 11, 20 and
 *                     27).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { Field } from "@stackra/validation";

import { type ChecklistTemplate, ChecklistTemplate$ } from "#core/index";

/** A scope's checklist. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Checklist extends Model.with(HasPublicId("wfc"), Timestamps) {
  /** The template as last seeded. */
  // reason: ChecklistTemplate is the output of this package's shipped ChecklistTemplate$, so the hatch names that schema
  @Field(ChecklistTemplate$)
  template!: ChecklistTemplate;

  /** The scope node the checklist belongs to. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The template key (`workflow-template:commerce:onboarding`). */
  key!: string;

  /** The unlocked steps the scope hides. */
  hidden: string[] = [];

  /** The scope's order of its unlocked steps. */
  order: string[] = [];

  /** The industry profile applied at sign-up; null when none was. */
  profile: string | null = null;

  /** Whether the scope changed the customization itself, so a profile no longer applies. */
  customized = false;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the defaulted
// fields out; remove it once gen writes the entity files (STA-339).
/** The insert-time side of `Checklist`: which fields `CrudService.insert` may leave out. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface Checklist {
  /** The fields that have a default, so an insert may leave them out. */
  [OptionalProps]?: "createdAt" | "updatedAt" | "hidden" | "order" | "profile" | "customized";
}

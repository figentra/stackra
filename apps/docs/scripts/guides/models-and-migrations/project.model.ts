/**
 * Stackra file contract:
 * Purpose: `Project`, the example model of the "Models and migrations" guide: a piece of work a team tracks, one row
 *          of `projects.projects` (key `projects.project`, public ids `prj_…`), with timestamps and a soft delete.
 * Boundary: data only, as an app's `src/modules/projects/models/project.model.ts` would hold it; the guide page copies
 *           its code from this file and the guide's tests run it.
 * Runtime: node
 * Governing contract: ADR 0294 (the model kind, as amended by programming model v3.1); ADR 0305 (one declaration per
 *                     file); STA-2843.
 */
import { HasPublicId, Index, Model, SoftDeletes, Timestamps } from "@stackra/model";
import { Int, Str } from "@stackra/validation";

/** A piece of work a team tracks. */
@Index(["status", "createdAt"])
export class Project extends Model.with(HasPublicId("prj"), Timestamps, SoftDeletes) {
  /** What the team calls it. */
  @Str({ max: 120 })
  name!: string;

  /** The team's estimate in days, added by the second migration. */
  @Int({ min: 1 })
  estimateDays: number | null = null;

  /** `active` until someone closes it, then `closed`. */
  status = "active";

  /** When it is due, if anyone said. */
  dueOn: Date | null = null;
}

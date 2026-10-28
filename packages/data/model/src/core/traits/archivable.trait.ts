/**
 * Stackra file contract:
 * Purpose: `Archivable`, the trait of the `archive` delete policy: a delete sets `archivedAt` instead of removing the
 *          row, reads leave archived rows out, and a restore brings one back.
 * Boundary: adds the field only. @stackra/database turns `CrudService.delete` into the update and registers the
 *           `archived` filter that hides archived rows by the same mechanism as `SoftDeletes`; the migration column is
 *           the blueprint's `t.archivable()`. An archived row is kept with no expiry, unlike a soft-deleted one.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (decision 4: the archive delete policy); ADR 0321 (the trait inventory); ADR 0294
 *                     (decision 27).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The archive trait.
 *
 * @example
 * export class Project extends Model.with(HasPublicId("prj"), Archivable) {}
 */
export const Archivable: Trait<{ archivedAt: Date | null }> = createTrait(
  "archivable",
  (base) =>
    class extends base {
      /** When the row was archived; null while it is active. */
      archivedAt: Date | null = null;
    },
);

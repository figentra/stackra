/**
 * Stackra file contract:
 * Purpose: `SoftDeletes`, the trait of the `soft` delete policy: a delete sets `deletedAt` instead of removing the row,
 *          and reads leave such rows out.
 * Boundary: adds the field only. @stackra/database turns a delete into the update and filters deleted rows; a unique
 *           index that must ignore them says `where: "deleted_at is null"`. The name is the one exception to the trait
 *           grammar, kept for recognition.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decision 3); ADR 0134 (delete lifecycle); ADR 0294 (decision 27).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The soft-delete trait.
 *
 * @example
 * export class LoyaltyAccount extends Model.with(HasPublicId("lac"), SoftDeletes) {}
 */
export const SoftDeletes: Trait<{ deletedAt: Date | null }> = createTrait(
  "soft_deletes",
  (base) =>
    class extends base {
      /** When the row was deleted; null while it is live. */
      deletedAt: Date | null = null;
    },
);

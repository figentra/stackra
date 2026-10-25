/**
 * Stackra file contract:
 * Purpose: `Taggable`, the trait of a model whose records carry tags drawn from the tenant's tag list: `tags` holds
 *          the tag keys, in the order they were applied.
 * Boundary: adds the field only (a `jsonb` array of tag keys, default empty). The tenant's tag list, and checking that
 *           a key is on it, are the tag list owner's; a key is data, never a label (labels are translated in the list).
 *           Filtering by tag needs the GIN index the model declares.
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (decisions 2 and 4: `Taggable`); ADR 0294 (decision 27).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The taggable trait.
 *
 * @example
 * export class Customer extends Model.with(HasPublicId("cus"), Taggable) {}
 */
export const Taggable: Trait<{ tags: string[] }> = createTrait(
  "taggable",
  (base) =>
    class extends base {
      /** The keys of the tags on the record, from the tenant's tag list. */
      tags: string[] = [];
    },
);

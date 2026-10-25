/**
 * Stackra file contract:
 * Purpose: `HasAttachments`, the trait of a model whose records carry attached files (a matter's documents, an
 *          invoice's receipts): the files service keeps the file records and links each to the record.
 * Boundary: adds no field; it is a marker in the trait registry. The file rows, their versions, scanning and the key
 *           layout are the files service's (ADR 0222); `HasMedia` of @stackra/media stays the trait of a model's own
 *           media collections. The model's table does not change.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (files); ADR 0321 (decision 1: `Has*` for a trait that owns data); ADR 0096.
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The attachments trait.
 *
 * @example
 * export class Expense extends Model.with(HasPublicId("exp"), HasAttachments) {}
 */
export const HasAttachments: Trait = createTrait(
  "has_attachments",
  (base) => class extends base {},
);

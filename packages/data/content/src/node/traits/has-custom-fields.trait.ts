/**
 * Stackra file contract:
 * Purpose: `HasCustomFields`, the trait of a model whose records carry the custom fields a scope defines for it, on
 *          content types and business models alike.
 * Boundary: adds no field and no column: the values live in the side table `content.custom_field_value_sets`, keyed by
 *           the model key and the record's public id, read and written through `CustomFieldService`, and checked
 *           against the stored definitions. How many fields a scope may define is `CustomFieldLimitEntitlement`. The
 *           trait is recorded in the trait registry so gen can check that a definition's model key names such a model.
 * Runtime: node
 * Governing contract: ADR 0116 (decisions CT2 and CT3); ADR 0321 (decision 2: owned by @stackra/content); ADR 0096
 *                     (decision 2: `Has*` owns data); ADR 0294 (decision 27).
 */
import { createTrait } from "@stackra/model";
import type { Trait } from "@stackra/model";

/**
 * The custom fields trait.
 *
 * @example
 * export class Product extends Model.with(HasPublicId("prd"), Timestamps, HasCustomFields) {}
 */
export const HasCustomFields: Trait = createTrait(
  "has_custom_fields",
  (base) => class extends base {},
);

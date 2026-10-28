/**
 * Stackra file contract:
 * Purpose: `HasMetadata`, the trait of a model whose records carry a bounded `metadata` bag: string keys to string
 *          values (an integration's external id, a campaign tag), at most 16 KB a record.
 * Boundary: adds the field only (`metadata jsonb not null default '{}'`, the blueprint's `t.metadata()`). The bound is
 *           checked on write by `MetadataSubscriber` and `CrudService` (`MetadataInvalidError`). Metadata never holds a
 *           secret, classified data, code or logic; a typed value the tenant defines is a custom field (ADR 0116).
 *           Filtering on it needs the GIN index of `t.metadata({ index: true })`.
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (decisions 2 and 4: `HasMetadata`, owned by @stackra/database); ADR 0294 (decision
 *                     27); data-layer gap mo18.
 */
import { createTrait } from "@stackra/model";
import type { Trait } from "@stackra/model";

/**
 * The metadata trait.
 *
 * @example
 * export class Customer extends Model.with(HasPublicId("cus"), HasMetadata) {}
 * await customers.update({ id }, { metadata: { crmId: "0031x00000AbC" } });
 */
export const HasMetadata: Trait<{ metadata: Record<string, string> }> = createTrait(
  "has_metadata",
  (base) =>
    class extends base {
      /** The record's metadata: string keys to string values, at most 16 KB in all. */
      metadata: Record<string, string> = {};
    },
);

/**
 * Stackra file contract:
 * Purpose: `BelongsToTenant`, the trait that makes a model tenant-owned: a `tenantId` column that row-level security
 *          compares by shape equality, filled from the call's tenant, never from input.
 * Boundary: adds the field only. The tenant id is set by the unit of work from the tenant context (@stackra/tenancy);
 *           gen indexes the column and the migration enables row-level security on the table.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (RLS on `tenant_id`); ADR 0294 (decision 27); ADR 0096 (decision 4).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The tenant-owned trait.
 *
 * @example
 * export class Order extends Model.with(HasPublicId("ord"), BelongsToTenant) {}
 */
export const BelongsToTenant: Trait<{ tenantId: string }> = createTrait(
  "belongs_to_tenant",
  (base) =>
    class extends base {
      /** The owning tenant; set by the unit of work, never from input. */
      tenantId!: string;
    },
);

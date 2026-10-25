/**
 * Stackra file contract:
 * Purpose: `BelongsToTenant`, the trait of a tenant-owned model: `tenantId`, the id of the tenant that owns the row,
 *          filled when the row is created from the running `withTenant` call, never from input.
 * Boundary: the field's initializer reads the call's tenant, so `em.create`, a factory and `CrudService.insert` get it
 *           while a loaded row keeps its stored one (the ORM never runs the constructor of a loaded row). Outside a
 *           tenant call the field stays unset and Postgres refuses the insert (`tenant_id` is NOT NULL); a value from
 *           input that names another tenant fails the policy's WITH CHECK. The column, its index and the policy are the
 *           partner macro's (`t.belongsToTenant()`); a model with this trait lists `tenantId` in its `[OptionalProps]`.
 *           Owned here (ADR 0321, 0323 d3), made with the model package's `createTrait`.
 * Runtime: node
 * Governing contract: ADR 0321 (the trait inventory: BelongsToTenant is tenancy's); ADR 0323 (decision 3); ADR 0239
 *                     (equality on `tenant_id`); ADR 0096 (decision 1); ADR 0294 (decision 27).
 */
import type { PublicId } from "@stackra/contracts";
import { createTrait } from "@stackra/model";
import type { Trait } from "@stackra/model";

import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";

/**
 * The tenant-owned trait.
 *
 * @example
 * export class Order extends Model.with(HasPublicId("ord"), BelongsToTenant, Timestamps) {}
 * await tenancy.withTenant(actor, () => orders.insert({ number: "A-1" })); // tenant_id is the actor's tenant
 */
export const BelongsToTenant: Trait<{ tenantId: PublicId<"scp"> }> = createTrait(
  "belongs_to_tenant",
  (base) =>
    class extends base {
      /** The owning tenant: its scope node's public id; set from the running tenant call, never from input. */
      // reason: unset outside a tenant call, where Postgres refuses the insert (NOT NULL), so a stored row always has one
      tenantId: PublicId<"scp"> = ACTIVE_TENANT.getStore() as PublicId<"scp">;
    },
);

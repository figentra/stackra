/**
 * Stackra file contract:
 * Purpose: `BelongsToTenantOrPlatform`, the nullable form of `BelongsToTenant`: `tenantId` is the owning tenant, or
 *          `null` for a platform row (an inbound message on a platform account, a platform-wide record), filled when
 *          the row is created from the running `withTenant` call, never from input.
 * Boundary: the field's initializer reads the call's tenant and takes `null` in a platform call, so a row made outside
 *           any tenant is the platform's; a loaded row keeps its stored value. The column and its policy are the
 *           partner macro's nullable form (`t.belongsToTenant({ nullable: true })`): a platform call reads and writes
 *           only NULL rows, a tenant call only its own. Made with the model package's `createTrait`.
 * Runtime: node
 * Governing contract: ADR 0321 (BelongsToTenant is tenancy's); ADR 0239 (equality on `tenant_id`); ADR 0323
 *                     (decision 3); OS webhooks SPEC gap 4 (stackra-115).
 */
import type { PublicId } from "@stackra/contracts";
import { createTrait } from "@stackra/model";
import type { Trait } from "@stackra/model";

import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";

/**
 * The tenant-or-platform trait.
 *
 * @example
 * export class InboundMessage extends Model.with(HasPublicId("ibm"), BelongsToTenantOrPlatform) {}
 * await tenancy.withTenant(platformActor, () => messages.insert({ body })); // tenant_id is NULL
 */
export const BelongsToTenantOrPlatform: Trait<{ tenantId: PublicId<"scp"> | null }> = createTrait(
  "belongs_to_tenant_or_platform",
  (base) =>
    class extends base {
      /** The owning tenant's scope node id, or `null` for a platform row; set from the running call, never input. */
      tenantId: PublicId<"scp"> | null = ACTIVE_TENANT.getStore() ?? null;
    },
);

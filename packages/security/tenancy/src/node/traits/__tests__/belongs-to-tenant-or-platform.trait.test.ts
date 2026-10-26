/**
 * Stackra file contract:
 * Purpose: unit and type tests of `BelongsToTenantOrPlatform`: a trait named `belongs_to_tenant_or_platform`; a row
 *          created in a tenant call takes that tenant, one created in a platform call (or outside any) takes `null`.
 * Boundary: test only; enters the tenant storage directly, as `TenantIsolationService.withTenant` does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0321; ADR 0239.
 */
import type { PublicId } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";
import { BelongsToTenantOrPlatform } from "#node/traits/belongs-to-tenant-or-platform.trait";

const ALPHA = "scp_01j9z3k4m5n6p7q8r9s0t1v2wa";

/** A model whose rows are a tenant's or the platform's. */
class InboundMessage extends Model.with(HasPublicId("ibm"), BelongsToTenantOrPlatform) {}

describe("BelongsToTenantOrPlatform", () => {
  it("is recorded as the belongs_to_tenant_or_platform trait", () => {
    expect(BelongsToTenantOrPlatform.traitName).toBe("belongs_to_tenant_or_platform");
  });

  it("takes the running call's tenant, and null in a platform call or outside one", () => {
    expect(ACTIVE_TENANT.run(ALPHA, () => new InboundMessage()).tenantId).toBe(ALPHA);
    expect(ACTIVE_TENANT.run(undefined, () => new InboundMessage()).tenantId).toBeNull();
    expect(new InboundMessage().tenantId).toBeNull();
  });

  it("types tenantId as a scope node's public id or null", () => {
    expectTypeOf<InboundMessage["tenantId"]>().toEqualTypeOf<PublicId<"scp"> | null>();
  });
});

/**
 * Stackra file contract:
 * Purpose: unit and type tests of `BelongsToTenant`: a trait named `belongs_to_tenant` in the registry; a row created
 *          inside a tenant call takes that call's tenant, one created outside takes none (Postgres refuses its
 *          insert), and concurrent calls never see each other's tenant; `tenantId` is typed as a scope node's id.
 * Boundary: test only; enters the tenant storage directly, as `TenantIsolationService.withTenant` does, so no database
 *           runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0321; ADR 0239; ADR 0294 (decision 27).
 */
import type { PublicId } from "@stackra/contracts";
import { HasPublicId, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";
import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";

const ALPHA = "scp_01j9z3k4m5n6p7q8r9s0t1v2wa";
const BETA = "scp_01j9z3k4m5n6p7q8r9s0t1v2wb";

/** A tenant-owned model. */
class Ticket extends Model.with(HasPublicId("tkt"), BelongsToTenant) {}

/** The tenant a row created after an await takes inside a call of `tenantId`. */
const make = (tenantId: PublicId<"scp">) =>
  ACTIVE_TENANT.run(tenantId, async () => {
    await Promise.resolve();
    return new Ticket().tenantId;
  });

describe("BelongsToTenant", () => {
  it("is recorded as the belongs_to_tenant trait", () => {
    expect(BelongsToTenant.traitName).toBe("belongs_to_tenant");
    expect(new Ticket()).toBeInstanceOf(Model);
    expect(traitsOf(Ticket).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "belongs_to_tenant",
    ]);
  });

  it("takes the running call's tenant, and none outside a tenant call", () => {
    expect(ACTIVE_TENANT.run(ALPHA, () => new Ticket()).tenantId).toBe(ALPHA);
    expect(ACTIVE_TENANT.run(undefined, () => new Ticket()).tenantId).toBeUndefined();
    expect(new Ticket().tenantId).toBeUndefined();
  });

  it("never lets concurrent calls see each other's tenant", async () => {
    await expect(Promise.all([make(ALPHA), make(BETA)])).resolves.toEqual([ALPHA, BETA]);
  });

  it("types tenantId as a scope node's public id", () => {
    expectTypeOf<Ticket["tenantId"]>().toEqualTypeOf<PublicId<"scp">>();
  });
});

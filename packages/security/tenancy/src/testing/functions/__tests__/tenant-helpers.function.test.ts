/**
 * Stackra file contract:
 * Purpose: unit tests of the testing helpers: `fakeTenantId` makes distinct well-formed tenant ids, `tenantActor` is a
 *          tenant-realm user in the given (or a fresh) tenant, and `runAsTenant` fills `BelongsToTenant` without a
 *          database (and `undefined` is a platform call).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; OS audit SPEC gap 11.
 */
import { ActorKind, Realm } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { isTenantId } from "#core/functions/is-tenant-id.function";
import { BelongsToTenantOrPlatform } from "#node/traits/belongs-to-tenant-or-platform.trait";
import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";
import { fakeTenantId } from "#testing/functions/fake-tenant-id.function";
import { runAsTenant } from "#testing/functions/run-as-tenant.function";
import { tenantActor } from "#testing/functions/tenant-actor.function";

/** A tenant-owned model. */
class Ticket extends Model.with(HasPublicId("tkt"), BelongsToTenant) {}

/** A tenant-or-platform model. */
class Notice extends Model.with(HasPublicId("ntc"), BelongsToTenantOrPlatform) {}

describe("tenancy testing helpers", () => {
  it("fakeTenantId makes distinct tenant ids", () => {
    const first = fakeTenantId();
    expect(isTenantId(first)).toBe(true);
    expect(fakeTenantId()).not.toBe(first);
  });

  it("tenantActor is a tenant-realm user in the given or a fresh tenant", () => {
    const tenantId = fakeTenantId();
    expect(tenantActor(tenantId)).toMatchObject({
      kind: ActorKind.User,
      realm: Realm.Tenant,
      tenantId,
    });
    expect(isTenantId(tenantActor().tenantId ?? "")).toBe(true);
  });

  it("runAsTenant fills the tenant traits without a database", () => {
    const tenantId = fakeTenantId();
    expect(runAsTenant(tenantId, () => new Ticket()).tenantId).toBe(tenantId);
    expect(runAsTenant(undefined, () => new Notice()).tenantId).toBeNull();
  });
});

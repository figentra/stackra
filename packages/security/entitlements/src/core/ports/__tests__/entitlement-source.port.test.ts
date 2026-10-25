/**
 * Stackra file contract:
 * Purpose: unit tests of the `EntitlementSource` port: it is an abstract `Port` (its own token, never built directly)
 *          and a driver answers a grant per entitlement and scope, `undefined` for a right outside the plan.
 * Boundary: test only; the driver here is a stand-in for the plan service's or the licence's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { Port, type PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Entitlement } from "#core/bases/entitlement.base";
import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import { EntitlementSource } from "#core/ports/entitlement-source.port";
import type { EntitlementClass } from "#core/types/entitlement-class.type";
import type { EntitlementGrant } from "#core/types/entitlement-grant.type";

class ReportsEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}

class SsoEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}

class OneScopeSourceDriver extends Driver(EntitlementSource) {
  async grant(
    entitlement: EntitlementClass,
    scope: PublicId | undefined,
  ): Promise<EntitlementGrant | undefined> {
    return entitlement === ReportsEntitlement && scope === "org_1" ? true : undefined;
  }
}

describe("EntitlementSource", () => {
  it("is an abstract port", () => {
    expect(EntitlementSource.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver that answers per entitlement and scope", async () => {
    const source = new OneScopeSourceDriver();
    expect(source).toBeInstanceOf(EntitlementSource);
    await expect(source.grant(ReportsEntitlement, "org_1")).resolves.toBe(true);
    await expect(source.grant(ReportsEntitlement, "org_2")).resolves.toBeUndefined();
    await expect(source.grant(SsoEntitlement, "org_1")).resolves.toBeUndefined();
  });
});

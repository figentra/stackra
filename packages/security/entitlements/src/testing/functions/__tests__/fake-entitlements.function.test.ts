/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeEntitlements`: it is an `EntitlementSource` (so a container override accepts it) that
 *          answers each listed entitlement with its grant in every scope, and `undefined` for any other.
 * Boundary: test only; the limit restates the template's `ProductLimitEntitlement`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { Entitlement, EntitlementKind, EntitlementSource } from "#core/index";
import { fakeEntitlements } from "#testing/functions/fake-entitlements.function";

class Product {}

class ProductLimitEntitlement extends Entitlement({
  kind: EntitlementKind.Limit,
  counts: () => Product,
}) {}

class ReportsEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}

describe("fakeEntitlements", () => {
  it("is an EntitlementSource", () => {
    expect(fakeEntitlements()).toBeInstanceOf(EntitlementSource);
  });

  it("answers each listed grant in every scope", async () => {
    const plan = fakeEntitlements([
      [ProductLimitEntitlement, 2],
      [ReportsEntitlement, true],
    ]);
    await expect(plan.grant(ProductLimitEntitlement, "org_1")).resolves.toBe(2);
    await expect(plan.grant(ProductLimitEntitlement, undefined)).resolves.toBe(2);
    await expect(plan.grant(ReportsEntitlement, "org_2")).resolves.toBe(true);
  });

  it("answers undefined for an entitlement not in the plan", async () => {
    await expect(
      fakeEntitlements([[ProductLimitEntitlement, 2]]).grant(ReportsEntitlement, "org_1"),
    ).resolves.toBeUndefined();
  });
});

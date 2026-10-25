/**
 * Stackra file contract:
 * Purpose: unit tests of the `EntitlementUsage` port: it is an abstract `Port` (its own token, never built directly)
 *          and a driver counts the records of a model in a scope.
 * Boundary: test only; the driver here is a stand-in for the data layer's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { type AnyClass, Driver } from "@stackra/container";
import { Port, type PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { EntitlementUsage } from "#contracts/ports/entitlement-usage.port";

class Product {}

class Order {}

class ListUsageDriver extends Driver(EntitlementUsage) {
  readonly rows: readonly [AnyClass, PublicId][] = [
    [Product, "org_1"],
    [Product, "org_1"],
    [Order, "org_1"],
    [Product, "org_2"],
  ];

  async count(model: AnyClass, scope: PublicId | undefined): Promise<number> {
    return this.rows.filter(([type, owner]) => type === model && owner === scope).length;
  }
}

describe("EntitlementUsage", () => {
  it("is an abstract port", () => {
    expect(EntitlementUsage.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver that counts one model in one scope", async () => {
    const usage = new ListUsageDriver();
    await expect(usage.count(Product, "org_1")).resolves.toBe(2);
    await expect(usage.count(Order, "org_1")).resolves.toBe(1);
    await expect(usage.count(Product, undefined)).resolves.toBe(0);
  });
});

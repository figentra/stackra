/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryServicePrincipalsDriver`: it is the `ServicePrincipals` port, finds a seeded principal
 *          by its subject, knows no other subject, and a new seed replaces the old.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0209 (decision 3); STA-2558.
 */
import { describe, expect, it } from "@stackra/testing";

import { ServicePrincipals } from "#contracts/index";
import { MemoryServicePrincipalsDriver } from "#core/drivers/memory-service-principals.driver";

const SHIPPING = { id: "svc_01j9z3k4m5n6p7q8r9s0t1v2w5", key: "ship.shipping" } as const;

describe(MemoryServicePrincipalsDriver, () => {
  it("is the ServicePrincipals port", () => {
    expect(new MemoryServicePrincipalsDriver()).toBeInstanceOf(ServicePrincipals);
  });

  it("finds a seeded principal by subject and no other", async () => {
    const principals = new MemoryServicePrincipalsDriver().seed({ "1": SHIPPING });
    expect(await principals.bySubject("1")).toBe(SHIPPING);
    expect(await principals.bySubject("2")).toBeUndefined();
    principals.seed({});
    expect(await principals.bySubject("1")).toBeUndefined();
  });
});

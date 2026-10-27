/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryLicenceIssuerDriver`: it is a `LicenceIssuer`; create, update, suspend and check-out
 *          round-trip through the map, and the stand-in file carries the licence as JSON.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0266; ADR 0178.
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryLicenceIssuerDriver } from "#core/drivers/memory-licence-issuer.driver";
import { LicenceIssuer } from "#core/ports/licence-issuer.port";

describe("MemoryLicenceIssuerDriver", () => {
  it("is a LicenceIssuer", () => {
    expect(new MemoryLicenceIssuerDriver()).toBeInstanceOf(LicenceIssuer);
  });

  it("creates, renews, suspends and checks out", async () => {
    const issuer = new MemoryLicenceIssuerDriver();
    const id = await issuer.create({
      policyId: "pol-1",
      name: "Acme",
      expiry: new Date("2027-01-01T00:00:00.000Z"),
      metadata: { plan: "enterprise" },
    });
    expect(id).toBe("mem_1");
    await issuer.update(id, {
      expiry: new Date("2028-01-01T00:00:00.000Z"),
      metadata: { plan: "pro" },
    });
    await issuer.suspend(id);
    const file = await issuer.checkOut(id, undefined);
    const body = file.split("\n")[1] ?? "";
    expect(JSON.parse(body)).toEqual({
      id: "mem_1",
      expiry: "2028-01-01T00:00:00.000Z",
      suspended: true,
      metadata: { plan: "pro" },
    });
  });

  it("ignores an unknown id", async () => {
    const issuer = new MemoryLicenceIssuerDriver();
    await issuer.suspend("mem_9");
    expect(issuer.licences.size).toBe(0);
  });
});

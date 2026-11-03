/**
 * Stackra file contract:
 * Purpose: proves `MemoryTenantProfileDriver` is a `TenantProfile`, rejects a read before a profile is set, and merges
 *          only the fields an update names.
 * Boundary: unit tier; the driver alone.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0263.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TenantProfile } from "#contracts/ports/tenant-profile.port";
import type { TenantProfileView } from "#contracts/types/tenant-profile-view.type";
import { MemoryTenantProfileDriver } from "#testing/drivers/memory-tenant-profile.driver";

const ACME: TenantProfileView = {
  tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa" as PublicId<"scp">,
  handle: "acme",
  name: "Acme",
  legalName: null,
  logo: { light: null, dark: null },
  market: "sa",
  defaultLocale: "ar-SA",
  timeZone: "Asia/Riyadh",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

describe("MemoryTenantProfileDriver", () => {
  it("is a TenantProfile and rejects a read before a profile is set", async () => {
    const profile = new MemoryTenantProfileDriver();
    expect(profile).toBeInstanceOf(TenantProfile);
    await expect(profile.get()).rejects.toThrow();
  });

  it("merges only the named fields and records the update", async () => {
    const profile = new MemoryTenantProfileDriver().set(ACME);
    const next = await profile.update({ name: "Acme Academy", legalName: undefined });
    expect(next).toEqual({ ...ACME, name: "Acme Academy" });
    expect(await profile.get()).toEqual(next);
    expect(profile.updates).toEqual([{ name: "Acme Academy", legalName: undefined }]);
  });
});

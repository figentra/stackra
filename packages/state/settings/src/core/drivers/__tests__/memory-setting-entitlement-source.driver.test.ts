/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySettingEntitlementSourceDriver`: nothing granted until granted, only asked keys are
 *          answered, a revoke takes a grant back.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0420 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { SettingEntitlementSource } from "#contracts/index";
import { MemorySettingEntitlementSourceDriver } from "#core/drivers/memory-setting-entitlement-source.driver";

describe(MemorySettingEntitlementSourceDriver, () => {
  it("is a SettingEntitlementSource that grants nothing until told", async () => {
    const source = new MemorySettingEntitlementSourceDriver();
    expect(source).toBeInstanceOf(SettingEntitlementSource);
    await expect(source.granted(["access.sso"], {})).resolves.toEqual(new Set());
  });

  it("answers the asked keys it grants, and forgets a revoked one", async () => {
    const source = new MemorySettingEntitlementSourceDriver().grant("access.sso", "access.audit");
    await expect(source.granted(["access.sso", "access.scim"], {})).resolves.toEqual(
      new Set(["access.sso"]),
    );
    source.revoke("access.sso");
    await expect(source.granted(["access.sso"], {})).resolves.toEqual(new Set());
  });
});

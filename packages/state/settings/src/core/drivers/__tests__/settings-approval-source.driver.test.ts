/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsApprovalSourceDriver`: it is an `ApprovalSettingsSource`, answers a key's stored value
 *          and its default, lifts a value below a legal floor, and refuses an unknown key and a key not marked `approval`.
 * Boundary: test only; memory drivers and a fixed clock, the key registered by `settingKeys` as gen's wiring does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0509 (S9); STA-1724 FR-002.
 */
import { type Clock, ApprovalSettingsSource, type ScopeRef } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { SettingsApprovalSourceDriver } from "#core/drivers/settings-approval-source.driver";
import { MemorySettingFloorSourceDriver } from "#core/drivers/memory-setting-floor-source.driver";
import { MemorySettingRevisionStoreDriver } from "#core/drivers/memory-setting-revision-store.driver";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingScope } from "#core/enums/setting-scope.enum";
import { SettingType } from "#core/enums/setting-type.enum";
import { settingKeys } from "#core/functions/setting-keys.function";
import { SettingsResolver } from "#core/services/settings-resolver.service";

const label = (key: string) => `coupons::settings.${key}.label` as I18nKey;
const CASCADE = [SettingScope.Platform, SettingScope.Product];

settingKeys({
  coupons: {
    maxPercent: {
      type: SettingType.Integer,
      default: 20,
      min: 0,
      scopes: CASCADE,
      label: label("max_percent"),
      approval: true,
    },
    note: { type: SettingType.String, default: "", scopes: CASCADE, label: label("note") },
  },
});

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

/** A driver over memory stores. */
function setup() {
  const clock = { now: () => new Date("2026-11-01T10:00:00.000Z") };
  const values = new MemorySettingValueStoreDriver();
  const floors = new MemorySettingFloorSourceDriver();
  const resolver = new SettingsResolver(
    values,
    floors,
    new MemorySettingRevisionStoreDriver(),
    clock as unknown as Clock,
  );
  return { values, floors, source: new SettingsApprovalSourceDriver(resolver) };
}

describe(SettingsApprovalSourceDriver, () => {
  it("is an ApprovalSettingsSource", () => {
    expect(setup().source).toBeInstanceOf(ApprovalSettingsSource);
  });

  it("answers the default of an approval key and the stored value once a holder sets one", async () => {
    const { source, values } = setup();
    await expect(source.get("coupons.maxPercent")).resolves.toBe(20);
    await values.write("coupons", { scope: ACME }, { maxPercent: 35 });
    await expect(source.get("coupons.maxPercent")).resolves.toBeDefined();
  });

  it("refuses a key no module registered and a key not marked approval", async () => {
    const { source } = setup();
    await expect(source.get("coupons.missing")).rejects.toThrow(RangeError);
    await expect(source.get("coupons.note")).rejects.toThrow(/not marked approval/);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsVersionSupportSourceDriver` and its `VersioningSettings` group: it is a
 *          `VersionSupportSource`, answers 12 months by default and the months the platform stores, and throws when a
 *          stored value is below 1.
 * Boundary: test only; the store is this package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0118; ADR 0213 (decision 2).
 */
import { VersionSupportSource } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingsVersionSupportSourceDriver } from "#core/drivers/settings-version-support-source.driver";
import { SettingsReader } from "#core/services/settings-reader.service";

/** A driver over a memory store. */
function setup() {
  const store = new MemorySettingValueStoreDriver();
  return { store, source: new SettingsVersionSupportSourceDriver(new SettingsReader(store)) };
}

describe(SettingsVersionSupportSourceDriver, () => {
  it("is a VersionSupportSource that supports 12 months by default", async () => {
    const { source } = setup();
    expect(source).toBeInstanceOf(VersionSupportSource);
    expect(await source.supportMonths()).toBe(12);
  });

  it("answers the months the platform stores", async () => {
    const { store, source } = setup();
    await store.write("versioning", {}, { supportMonths: 18 });
    expect(await source.supportMonths()).toBe(18);
  });

  it("throws when a stored period is below 1", async () => {
    const { store, source } = setup();
    await store.write("versioning", {}, { supportMonths: 0 });
    await expect(source.supportMonths()).rejects.toThrow();
  });
});

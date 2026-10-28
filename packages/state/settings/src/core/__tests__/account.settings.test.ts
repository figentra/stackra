/**
 * Stackra file contract:
 * Purpose: unit tests of `AccountSettings`: the group keyed `account` reads no language by default, reads the user's
 *          own choice over the platform's, and its schema refuses a code that is not a locale.
 * Boundary: test only; the store is this package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0080 (2026-10-29 note); ADR 0307 (rule 22).
 */
import { describe, expect, it } from "@stackra/testing";

import { AccountSettings } from "#core/account.settings";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingsReader } from "#core/services/settings-reader.service";

const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";

describe("AccountSettings", () => {
  it("reads no language by default", async () => {
    const settings = await new SettingsReader(new MemorySettingValueStoreDriver()).get(
      AccountSettings,
      { user: USER },
    );
    expect(settings).toBeInstanceOf(AccountSettings);
    expect(settings.locale).toBeNull();
  });

  it("reads the user's own choice under the account group", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("account", { user: USER }, { locale: "ar" });
    const reader = new SettingsReader(store);
    expect((await reader.get(AccountSettings, { user: USER })).locale).toBe("ar");
    expect((await reader.get(AccountSettings)).locale).toBeNull();
  });

  it("refuses a code that is not a locale", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("account", { user: USER }, { locale: "klingon" });
    await expect(new SettingsReader(store).get(AccountSettings, { user: USER })).rejects.toThrow();
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `DisplaySettings`: the group keyed `display` reads Gregorian by default, a tenant's choice
 *          of the Umm al-Qura calendar for that tenant only, and its schema refuses a code that is not a calendar.
 * Boundary: test only; the store is this package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0192 (decision 3); ADR 0307 (rule 22).
 */
import type { ScopeRef } from "@stackra/contracts";
import { CalendarSystem } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { DisplaySettings } from "#core/display.settings";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingsReader } from "#core/services/settings-reader.service";

/** A tenant's scope node. */
const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme" };

/** Another tenant's scope node. */
const OTHER: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4", path: "platform.other" };

describe("DisplaySettings", () => {
  it("reads Gregorian by default", async () => {
    const settings = await new SettingsReader(new MemorySettingValueStoreDriver()).get(
      DisplaySettings,
      { scope: SCOPE },
    );
    expect(settings).toBeInstanceOf(DisplaySettings);
    expect(settings.calendar).toBe(CalendarSystem.Gregory);
  });

  it("reads a tenant's Hijri choice for that tenant only", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("display", { scope: SCOPE }, { calendar: "islamic-umalqura" });
    const reader = new SettingsReader(store);
    expect((await reader.get(DisplaySettings, { scope: SCOPE })).calendar).toBe(
      CalendarSystem.IslamicUmalqura,
    );
    expect((await reader.get(DisplaySettings, { scope: OTHER })).calendar).toBe(
      CalendarSystem.Gregory,
    );
  });

  it("refuses a code that is not a calendar", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("display", { scope: SCOPE }, { calendar: "julian" });
    await expect(
      new SettingsReader(store).get(DisplaySettings, { scope: SCOPE }),
    ).rejects.toThrow();
  });
});

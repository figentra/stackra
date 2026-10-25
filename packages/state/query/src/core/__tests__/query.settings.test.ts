/**
 * Stackra file contract:
 * Purpose: unit tests of `QuerySettings`: the group keyed `query` resolves the 24-hour offline limit by default and a
 *          stored value over it, through the real settings reader.
 * Boundary: test only; the store is settings' memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decision 4); ADR 0307 (rule 22).
 */
import { MemorySettingValueStoreDriver, SettingsReader } from "@stackra/settings";
import { describe, expect, it } from "@stackra/testing";

import { QuerySettings } from "#core/query.settings";

describe("QuerySettings", () => {
  it("defaults the offline limit to 24 hours", async () => {
    const reader = new SettingsReader(new MemorySettingValueStoreDriver());
    const settings = await reader.get(QuerySettings);
    expect(settings).toBeInstanceOf(QuerySettings);
    expect(settings.offlineLimitHours).toBe(24);
  });

  it("reads a stored limit under the query group", async () => {
    const store = new MemorySettingValueStoreDriver().seed("query", { offlineLimitHours: 48 });
    expect((await new SettingsReader(store).get(QuerySettings)).offlineLimitHours).toBe(48);
  });
});

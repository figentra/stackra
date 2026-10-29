/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchSettings`: the group keyed `search` resolves no synonyms by default and a stored text
 *          over it, through the real settings reader, and its schema refuses a text with a broken line.
 * Boundary: test only; the store is settings' memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0307 (rule 22); ADR 0403.
 */
import { MemorySettingValueStoreDriver, SettingsReader } from "@stackra/settings";
import { describe, expect, it } from "@stackra/testing";

import { SearchSettings } from "#core/search.settings";

describe("SearchSettings", () => {
  it("defaults to no synonyms", async () => {
    const settings = await new SettingsReader(new MemorySettingValueStoreDriver()).get(
      SearchSettings,
    );
    expect(settings).toBeInstanceOf(SearchSettings);
    expect(settings.synonyms).toBe("");
    expect(settings.rankingRules).toBe("");
    expect(settings.querySample).toBe(0);
  });

  it("reads stored rules and the query sample, and refuses a broken rule or a sample above 1", async () => {
    const store = new MemorySettingValueStoreDriver().seed("search", {
      rankingRules:
        "# merchandising\nproducts pin linen shirt: prd_9\nproducts boost featured=true: 2",
      querySample: 0.25,
    });
    const settings = await new SettingsReader(store).get(SearchSettings);
    expect(settings.querySample).toBe(0.25);
    await expect(
      new SettingsReader(
        new MemorySettingValueStoreDriver().seed("search", { rankingRules: "pin everything" }),
      ).get(SearchSettings),
    ).rejects.toThrow();
    await expect(
      new SettingsReader(
        new MemorySettingValueStoreDriver().seed("search", { querySample: 2 }),
      ).get(SearchSettings),
    ).rejects.toThrow();
  });

  it("reads stored sets under the search group", async () => {
    const store = new MemorySettingValueStoreDriver().seed("search", {
      synonyms: "products en: sofa, couch",
    });
    expect((await new SettingsReader(store).get(SearchSettings)).synonyms).toBe(
      "products en: sofa, couch",
    );
  });

  it("refuses a text with a line that is not a set, a comment or blank", async () => {
    const store = new MemorySettingValueStoreDriver().seed("search", { synonyms: "sofa = couch" });
    await expect(new SettingsReader(store).get(SearchSettings)).rejects.toThrow();
  });
});

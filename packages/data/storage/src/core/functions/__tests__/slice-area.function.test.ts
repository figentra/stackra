/**
 * Stackra file contract:
 * Purpose: unit tests of `sliceArea`: a slice reads and writes only its own rows, lists and clears only them, leaves
 *          the area's other keys alone, removes another value's rows of the same dimension when opened, and refuses a
 *          bad dimension or value.
 * Boundary: test only; a memory storage driver holds the area.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";
import { sliceArea } from "#core/functions/slice-area.function";

describe(sliceArea, () => {
  it("keeps one legal entity's rows and drops another's", () => {
    const { cache } = new MemoryStorageDriver();
    cache.set("catalogue.page_1", [1]);
    const saudi = sliceArea(cache, "legalEntityId", "len_sa");
    saudi.set("sales.sale.sal_1", { total: 10 });
    expect(saudi.get("sales.sale.sal_1")).toEqual({ total: 10 });
    expect(saudi.has("sales.sale.sal_1")).toBe(true);
    expect(saudi.keys()).toEqual(["sales.sale.sal_1"]);

    const egypt = sliceArea(cache, "legalEntityId", "len_eg");
    expect(egypt.keys()).toEqual([]);
    expect(cache.keys()).toEqual(["catalogue.page_1"]);

    egypt.set("sales.sale.sal_2", { total: 5 });
    egypt.clear();
    expect(egypt.keys()).toEqual([]);
    expect(cache.get("catalogue.page_1")).toEqual([1]);
  });

  it("refuses a bad dimension or value", () => {
    const { cache } = new MemoryStorageDriver();
    expect(() => sliceArea(cache, "LegalEntity", "len_sa")).toThrow(/camelCase/);
    expect(() => sliceArea(cache, "legalEntityId", "")).toThrow(TypeError);
    expect(() => sliceArea(cache, "legalEntityId", "a:b")).toThrow(TypeError);
  });
});

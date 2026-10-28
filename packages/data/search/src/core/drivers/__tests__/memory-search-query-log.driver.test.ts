/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySearchQueryLogDriver`: it keeps entries and completes a prefix from the model's
 *          phrases that found rows, most frequent first, withheld phrases and clicks left out.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266; stackra-326.
 */
import { describe, expect, it } from "@stackra/testing";

import { SearchQueryLog } from "#contracts/index";
import { MemorySearchQueryLogDriver } from "#core/drivers/memory-search-query-log.driver";

describe(MemorySearchQueryLogDriver, () => {
  it("completes a prefix from the phrases that found rows", async () => {
    const log = new MemorySearchQueryLogDriver();
    expect(log).toBeInstanceOf(SearchQueryLog);
    for (const [phrase, hits] of [
      ["linen shirt", 3],
      ["linen shirt", 2],
      ["linen trousers", 1],
      ["linen tote", 0],
      [null, 4],
    ] as const)
      await log.record({ model: "Product", phrase, hits, latencyMs: 5 });
    await log.record({ model: "Product", phrase: "lino", clicked: "prd_1" });
    await log.record({ model: "Article", phrase: "linen care", hits: 9, latencyMs: 5 });
    expect(await log.popular("Product", "lin", 5)).toEqual(["linen shirt", "linen trousers"]);
    expect(await log.popular("Product", "lin", 1)).toEqual(["linen shirt"]);
    expect(log.entries).toHaveLength(7);
  });
});

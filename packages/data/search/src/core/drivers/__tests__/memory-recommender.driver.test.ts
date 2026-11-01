/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryRecommenderDriver`: it is a `Recommender`, answers what it was seeded with per kind best
 *          score first without the item itself, cuts at the limit, has nothing for an unknown item and refuses a bad limit.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266; ADR 0492 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { Recommender } from "#contracts/index";
import { MemoryRecommenderDriver } from "#core/drivers/memory-recommender.driver";

const SEED = {
  similar: {
    a: [
      { id: "b", score: 0.5 },
      { id: "a", score: 1 },
      { id: "c", score: 0.9 },
    ],
  },
  boughtTogether: { a: [{ id: "d", score: 7 }] },
};

describe(MemoryRecommenderDriver, () => {
  it("is a Recommender answering both kinds from its seed", async () => {
    const recommender = new MemoryRecommenderDriver().seed(SEED);
    expect(recommender).toBeInstanceOf(Recommender);
    expect(await recommender.similar("a")).toEqual([
      { id: "c", score: 0.9 },
      { id: "b", score: 0.5 },
    ]);
    expect(await recommender.boughtTogether("a")).toEqual([{ id: "d", score: 7 }]);
  });

  it("cuts at the limit, knows nothing of an unknown item and refuses a bad limit", async () => {
    const recommender = new MemoryRecommenderDriver().seed(SEED);
    expect(await recommender.similar("a", { limit: 1 })).toEqual([{ id: "c", score: 0.9 }]);
    expect(await recommender.similar("zzz")).toEqual([]);
    expect(await new MemoryRecommenderDriver().boughtTogether("a")).toEqual([]);
    await expect(recommender.similar("a", { limit: 0 })).rejects.toThrow(RangeError);
  });
});

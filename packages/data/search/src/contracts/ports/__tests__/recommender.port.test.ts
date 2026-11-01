/**
 * Stackra file contract:
 * Purpose: unit tests of the `Recommender` port: an abstract `Port` with a similar and a bought-together answer.
 * Boundary: test only; a minimal driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0492 (decision 8).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Recommender } from "#contracts/ports/recommender.port";

/** Suggests the item's own id with a fixed score per kind. */
class FixedRecommenderDriver extends Driver(Recommender) {
  async similar(itemId: string) {
    return [{ id: `${itemId}-s`, score: 1 }];
  }

  async boughtTogether(itemId: string) {
    return [{ id: `${itemId}-b`, score: 2 }];
  }
}

describe("Recommender", () => {
  it("is a port a driver extends, answering both kinds", async () => {
    const recommender = new FixedRecommenderDriver();
    expect(recommender).toBeInstanceOf(Recommender);
    expect(recommender).toBeInstanceOf(Port);
    await expect(recommender.similar("a")).resolves.toEqual([{ id: "a-s", score: 1 }]);
    await expect(recommender.boughtTogether("a")).resolves.toEqual([{ id: "a-b", score: 2 }]);
  });
});
